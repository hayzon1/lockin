package com.lockin.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Loads local .env when present and converts Neon libpq PostgreSQL URLs (postgresql://...)
 * into Spring DataSource & Flyway JDBC settings:
 * - Pooled URL (DATABASE_URL_POOLED, or pooled DATABASE_URL) -> HikariCP app traffic (with prepareThreshold=0)
 * - Direct URL (DATABASE_URL_UNPOOLED, or non-pooled DATABASE_URL) -> Flyway migrations
 */
public class DatabaseUrlPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Boolean loadDotenv = environment.getProperty("app.dotenv.enabled", Boolean.class, true);
        Map<String, Object> dotenvProps = new LinkedHashMap<>();

        if (Boolean.TRUE.equals(loadDotenv)) {
            Path envFile = resolveEnvFile();
            if (envFile != null) {
                loadDotenvFile(envFile, dotenvProps);
            }
        }

        if (!dotenvProps.isEmpty()) {
            environment.getPropertySources().addLast(new MapPropertySource("localDotenv", dotenvProps));
        }

        String rawUrl = getEffectiveProp(environment, dotenvProps, "DATABASE_URL");
        String rawPooled = getEffectiveProp(environment, dotenvProps, "DATABASE_URL_POOLED");
        String rawUnpooled = getEffectiveProp(environment, dotenvProps, "DATABASE_URL_UNPOOLED");

        // Determine best app traffic URL (prefer pooled) and best Flyway migration URL (prefer direct)
        String appUrl = (rawPooled != null && !rawPooled.isBlank()) ? rawPooled : rawUrl;
        String migrationUrl = (rawUnpooled != null && !rawUnpooled.isBlank()) ? rawUnpooled : rawUrl;

        Map<String, Object> derived = new LinkedHashMap<>();

        if (appUrl != null && isLibpqPostgresUrl(appUrl)) {
            boolean isPooled = appUrl.contains("-pooler");
            JdbcParts appJdbc = parseLibpqUrl(appUrl, isPooled);
            if (appJdbc != null) {
                derived.put("spring.datasource.url", appJdbc.jdbcUrl());
                if (appJdbc.username() != null) derived.put("spring.datasource.username", appJdbc.username());
                if (appJdbc.password() != null) derived.put("spring.datasource.password", appJdbc.password());
            }
        }

        if (migrationUrl != null && isLibpqPostgresUrl(migrationUrl)) {
            JdbcParts flywayJdbc = parseLibpqUrl(migrationUrl, false);
            if (flywayJdbc != null) {
                derived.put("spring.flyway.url", flywayJdbc.jdbcUrl());
                if (flywayJdbc.username() != null) derived.put("spring.flyway.user", flywayJdbc.username());
                if (flywayJdbc.password() != null) derived.put("spring.flyway.password", flywayJdbc.password());
            }
        }

        if (!derived.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource("neonJdbcConfig", derived));
        }
    }

    private String getEffectiveProp(ConfigurableEnvironment env, Map<String, Object> dotenvProps, String key) {
        String val = System.getenv(key);
        if (val != null && !val.isBlank()) return val.trim();
        val = System.getProperty(key);
        if (val != null && !val.isBlank()) return val.trim();
        Object fromDotenv = dotenvProps.get(key);
        if (fromDotenv != null && !fromDotenv.toString().isBlank()) return fromDotenv.toString().trim();
        val = env.getProperty(key);
        return (val != null && !val.isBlank()) ? val.trim() : null;
    }

    private Path resolveEnvFile() {
        List<Path> candidates = List.of(
                Path.of(".env"),
                Path.of("../.env"),
                Path.of(".env.local"),
                Path.of("../.env.local")
        );
        for (Path p : candidates) {
            if (Files.isRegularFile(p)) {
                return p;
            }
        }
        return null;
    }

    private void loadDotenvFile(Path path, Map<String, Object> target) {
        try {
            for (String rawLine : Files.readAllLines(path, StandardCharsets.UTF_8)) {
                String line = rawLine.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;
                int eq = line.indexOf('=');
                if (eq <= 0) continue;
                String key = line.substring(0, eq).trim();
                String val = line.substring(eq + 1).trim();
                if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.substring(1, val.length() - 1);
                }
                if (!key.isEmpty() && !val.isEmpty()) {
                    target.put(key, val);
                }
            }
        } catch (IOException ignored) {
            // Best-effort dotenv loading
        }
    }

    private boolean isLibpqPostgresUrl(String url) {
        return url.startsWith("postgres://") || url.startsWith("postgresql://");
    }

    private record JdbcParts(String jdbcUrl, String username, String password) {}

    private JdbcParts parseLibpqUrl(String rawUrl, boolean pooled) {
        try {
            String normalized = rawUrl.startsWith("postgres://")
                    ? "postgresql://" + rawUrl.substring("postgres://".length())
                    : rawUrl;
            URI uri = URI.create(normalized);
            String host = uri.getHost();
            int port = uri.getPort();
            String path = uri.getPath();
            String query = uri.getRawQuery();

            String username = null;
            String password = null;
            String userInfo = uri.getRawUserInfo();
            if (userInfo != null && !userInfo.isBlank()) {
                int colon = userInfo.indexOf(':');
                if (colon >= 0) {
                    username = URLDecoder.decode(userInfo.substring(0, colon), StandardCharsets.UTF_8);
                    password = URLDecoder.decode(userInfo.substring(colon + 1), StandardCharsets.UTF_8);
                } else {
                    username = URLDecoder.decode(userInfo, StandardCharsets.UTF_8);
                }
            }

            StringBuilder jdbc = new StringBuilder("jdbc:postgresql://").append(host);
            if (port > 0) {
                jdbc.append(':').append(port);
            }
            jdbc.append(path != null && !path.isBlank() ? path : "/neondb");

            StringBuilder cleanQuery = new StringBuilder();
            boolean hasSslMode = false;
            boolean hasPrepareThreshold = false;
            if (query != null && !query.isBlank()) {
                for (String pair : query.split("&")) {
                    if (pair.isBlank()) continue;
                    if (pair.startsWith("channel_binding=")) continue;
                    if (pair.startsWith("sslmode=")) hasSslMode = true;
                    if (pair.startsWith("prepareThreshold=")) hasPrepareThreshold = true;
                    if (cleanQuery.length() > 0) cleanQuery.append('&');
                    cleanQuery.append(pair);
                }
            }
            if (!hasSslMode) {
                if (cleanQuery.length() > 0) cleanQuery.append('&');
                cleanQuery.append("sslmode=require");
            }
            if (pooled && !hasPrepareThreshold) {
                if (cleanQuery.length() > 0) cleanQuery.append('&');
                cleanQuery.append("prepareThreshold=0");
            }

            if (cleanQuery.length() > 0) {
                jdbc.append('?').append(cleanQuery);
            }

            return new JdbcParts(jdbc.toString(), username, password);
        } catch (Exception e) {
            return null;
        }
    }
}
