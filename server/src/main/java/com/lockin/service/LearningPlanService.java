package com.lockin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lockin.dto.LearningLessonDto;
import com.lockin.dto.LearningPlanDto;
import com.lockin.dto.LearningPlanRequest;
import com.lockin.dto.TodayLessonDto;
import com.lockin.entity.GoalStatus;
import com.lockin.entity.LearningLessonEntity;
import com.lockin.entity.LearningPlanEntity;
import com.lockin.entity.LongTermGoalEntity;
import com.lockin.exception.AppException;
import com.lockin.repository.LearningPlanRepository;
import com.lockin.repository.LongTermGoalRepository;
import com.lockin.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.net.InetAddress;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.*;

/**
 * Builds a day-by-day learning plan for a goal. Gemini searches the live web for good free resources
 * (W3Schools, Programiz, Lichess, YouTube lessons and so on). Every link is checked before it is saved,
 * and a built-in plan is used when Gemini is not configured or fails.
 */
@Service
public class LearningPlanService {

    private static final Logger log = LoggerFactory.getLogger(LearningPlanService.class);

    private static final Set<String> TYPES = Set.of("READ", "VIDEO", "PRACTICE");

    private record LessonDraft(
            int day, String title, String description, String resourceTitle, String resourceUrl,
            String resourceType, int minutes
    ) {}

    private record PlanDraft(String provider, String summary, List<LessonDraft> lessons) {}

    private record Step(String title, String url, String type, String description) {}

    private final String geminiApiKey;
    private final String geminiModel;
    private final LongTermGoalRepository goalRepository;
    private final LearningPlanRepository planRepository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate tx;
    private final HttpClient aiClient;
    private final HttpClient linkClient;
    private final ExecutorService linkPool = Executors.newFixedThreadPool(8, r -> {
        Thread t = new Thread(r, "link-check");
        t.setDaemon(true);
        return t;
    });

    public LearningPlanService(
            @Value("${app.ai.gemini-api-key:}") String geminiApiKey,
            @Value("${app.ai.gemini-model:gemini-3-flash-preview}") String geminiModel,
            LongTermGoalRepository goalRepository,
            LearningPlanRepository planRepository,
            ObjectMapper objectMapper,
            PlatformTransactionManager txManager
    ) {
        this.geminiApiKey = geminiApiKey != null ? geminiApiKey.trim() : "";
        this.geminiModel = geminiModel != null && !geminiModel.isBlank() ? geminiModel.trim() : "gemini-3-flash-preview";
        this.goalRepository = goalRepository;
        this.planRepository = planRepository;
        this.objectMapper = objectMapper;
        this.tx = new TransactionTemplate(txManager);
        this.aiClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        // Redirects are not followed on purpose, so a link can never bounce the server to an internal address.
        this.linkClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
    }

    // ---------------------------------------------------------------- public API

    public LearningPlanDto generate(UserPrincipal principal, UUID goalId, LearningPlanRequest req) {
        LongTermGoalEntity goal = goalRepository.findByIdAndUserId(goalId, principal.getId())
                .orElseThrow(() -> new AppException("Long-term goal not found", HttpStatus.NOT_FOUND));

        String level = pick(req.level(), Set.of("BEGINNER", "SOME_EXPERIENCE", "INTERMEDIATE"), "BEGINNER");
        String style = pick(req.learningStyle(), Set.of("READING", "VIDEO", "PRACTICE", "MIX"), "MIX");
        int minutes = req.minutesPerDay() != null ? req.minutesPerDay() : 30;
        int days = req.days() != null ? req.days() : 30;
        String title = goal.getTitle();
        String details = goal.getDescription();

        // Slow work (web search and link checks) happens outside any database transaction.
        PlanDraft draft = null;
        if (!geminiApiKey.isBlank()) {
            try {
                draft = callGemini(title, details, level, minutes, style, days);
            } catch (Exception ex) {
                log.warn("Gemini learning plan failed, using the built-in plan: {}", ex.getMessage());
            }
        }
        if (draft == null || draft.lessons().isEmpty()) {
            draft = builtInPlan(title, details, level, minutes, style, days);
        }

        List<LessonDraft> lessons = checkLinks(fillDays(draft.lessons(), days, minutes), title);
        PlanDraft finalDraft = new PlanDraft(draft.provider(), draft.summary(), lessons);

        return tx.execute(status -> {
            planRepository.findByGoalId(goalId).ifPresent(old -> {
                planRepository.delete(old);
                planRepository.flush();
            });
            LearningPlanEntity plan = new LearningPlanEntity();
            plan.setGoalId(goalId);
            plan.setLevel(level);
            plan.setMinutesPerDay(minutes);
            plan.setLearningStyle(style);
            plan.setTotalDays(days);
            plan.setStartDate(LocalDate.now());
            plan.setSummary(finalDraft.summary());
            plan.setProvider(finalDraft.provider());
            for (LessonDraft d : finalDraft.lessons()) {
                LearningLessonEntity lesson = new LearningLessonEntity();
                lesson.setPlan(plan);
                lesson.setDayNumber(d.day());
                lesson.setTitle(truncate(d.title(), 195));
                lesson.setDescription(d.description());
                lesson.setResourceTitle(truncate(d.resourceTitle(), 195));
                lesson.setResourceUrl(d.resourceUrl());
                lesson.setResourceType(d.resourceType());
                lesson.setDurationMinutes(d.minutes());
                plan.getLessons().add(lesson);
            }
            return toDto(planRepository.save(plan));
        });
    }

    @Transactional(readOnly = true)
    public Optional<LearningPlanDto> getPlan(UserPrincipal principal, UUID goalId) {
        requireGoal(principal, goalId);
        return planRepository.findByGoalId(goalId).map(this::toDto);
    }

    @Transactional
    public LearningPlanDto toggleLesson(UserPrincipal principal, UUID goalId, UUID lessonId) {
        requireGoal(principal, goalId);
        LearningPlanEntity plan = planRepository.findByGoalId(goalId)
                .orElseThrow(() -> new AppException("Learning plan not found", HttpStatus.NOT_FOUND));
        LearningLessonEntity lesson = plan.getLessons().stream()
                .filter(l -> l.getId().equals(lessonId))
                .findFirst()
                .orElseThrow(() -> new AppException("Lesson not found", HttpStatus.NOT_FOUND));
        lesson.setCompleted(!lesson.isCompleted());
        lesson.setCompletedAt(lesson.isCompleted() ? Instant.now() : null);
        return toDto(planRepository.save(plan));
    }

    @Transactional
    public void deletePlan(UserPrincipal principal, UUID goalId) {
        requireGoal(principal, goalId);
        planRepository.findByGoalId(goalId).ifPresent(planRepository::delete);
    }

    /** Today's lesson for every active goal that has a plan. */
    @Transactional(readOnly = true)
    public List<TodayLessonDto> today(UserPrincipal principal) {
        List<TodayLessonDto> result = new ArrayList<>();
        for (LongTermGoalEntity goal : goalRepository.findByUserIdOrderByCreatedAtDesc(principal.getId())) {
            if (goal.getStatus() != GoalStatus.ACTIVE) continue;
            planRepository.findByGoalId(goal.getId()).ifPresent(plan -> {
                int day = currentDay(plan);
                plan.getLessons().stream()
                        .filter(l -> l.getDayNumber() == day)
                        .findFirst()
                        .ifPresent(l -> result.add(new TodayLessonDto(
                                goal.getId(), goal.getTitle(), day, plan.getTotalDays(),
                                (int) plan.getLessons().stream().filter(LearningLessonEntity::isCompleted).count(),
                                toLessonDto(l))));
            });
        }
        return result;
    }

    // ---------------------------------------------------------------- mapping

    private void requireGoal(UserPrincipal principal, UUID goalId) {
        goalRepository.findByIdAndUserId(goalId, principal.getId())
                .orElseThrow(() -> new AppException("Long-term goal not found", HttpStatus.NOT_FOUND));
    }

    private int currentDay(LearningPlanEntity plan) {
        long elapsed = ChronoUnit.DAYS.between(plan.getStartDate(), LocalDate.now()) + 1;
        return (int) Math.max(1, Math.min(plan.getTotalDays(), elapsed));
    }

    private LearningLessonDto toLessonDto(LearningLessonEntity l) {
        return new LearningLessonDto(l.getId(), l.getDayNumber(), l.getTitle(), l.getDescription(),
                l.getResourceTitle(), l.getResourceUrl(), l.getResourceType(), l.getDurationMinutes(), l.isCompleted());
    }

    private LearningPlanDto toDto(LearningPlanEntity p) {
        List<LearningLessonDto> lessons = p.getLessons().stream().map(this::toLessonDto).toList();
        int done = (int) lessons.stream().filter(LearningLessonDto::completed).count();
        return new LearningPlanDto(p.getId(), p.getGoalId(), p.getLevel(), p.getMinutesPerDay(), p.getLearningStyle(),
                p.getTotalDays(), p.getStartDate(), p.getSummary(), p.getProvider(), done, currentDay(p), lessons);
    }

    // ---------------------------------------------------------------- Gemini

    private PlanDraft callGemini(String title, String details, String level, int minutes, String style, int days)
            throws Exception {
        String prompt = """
                You are a learning coach who builds day-by-day study plans from real, free online resources.
                Use Google Search to find the best current resources for this subject before you write the plan.

                Learner goal: %s
                Details: %s
                Current level: %s
                Time available per day: %d minutes
                Preferred learning style: %s (READING = written tutorials, VIDEO = video lessons, PRACTICE = hands-on exercises, MIX = a balance)
                Plan length: %d days, starting today (%s)

                Return ONLY JSON, with no commentary and no code fences, in exactly this shape:
                {
                  "summary": "Two plain sentences on the route this plan takes and which sites it uses.",
                  "lessons": [
                    {
                      "day": 1,
                      "title": "Short lesson title (max 80 chars)",
                      "description": "One or two plain sentences: what to do today and what you can do afterwards.",
                      "resourceTitle": "Name of the page or video, with the site name",
                      "resourceUrl": "https://...",
                      "resourceType": "READ or VIDEO or PRACTICE",
                      "minutes": 25
                    }
                  ]
                }

                Rules:
                - Exactly %d lessons, for day 1 to day %d, in order. Each lesson must fit in %d minutes.
                - Pick the best-known free site for the subject and send the learner to the specific page for that day, not a home page.
                  Examples: HTML and CSS use W3Schools or MDN. Java, Python and C use Programiz or W3Schools.
                  Chess uses Lichess learn and practice pages, or a named YouTube lesson.
                  Photography and video editing use well-reviewed free YouTube lessons or the software maker's official tutorials.
                  For any other subject choose the best equivalent.
                - Only use URLs you actually saw in search results. Never invent a URL. If you are not sure of the exact page, use the section page of that site.
                - The plan must progress: basics first, then build up. Include a practice or small project day every few days, and a final project or review near the end.
                - Write in plain, simple English. Do not use em dashes.
                """.formatted(
                title,
                details != null && !details.isBlank() ? details : "Not provided",
                level, minutes, style, days, LocalDate.now(),
                days, days, minutes
        );

        HttpResponse<String> response = sendGeminiRequest(prompt);

        StringBuilder text = new StringBuilder();
        for (JsonNode part : objectMapper.readTree(response.body()).path("candidates").path(0).path("content").path("parts")) {
            if (part.path("thought").asBoolean(false)) continue;
            text.append(part.path("text").asText(""));
        }
        String raw = text.toString();
        int start = raw.indexOf('{');
        int end = raw.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new IllegalStateException("Gemini returned no JSON");
        }
        JsonNode parsed = objectMapper.readTree(raw.substring(start, end + 1));

        List<LessonDraft> lessons = new ArrayList<>();
        for (JsonNode n : parsed.path("lessons")) {
            int day = n.path("day").asInt(0);
            String lessonTitle = n.path("title").asText("").trim();
            if (day < 1 || day > days || lessonTitle.isBlank()) continue;
            String type = n.path("resourceType").asText("READ").trim().toUpperCase(Locale.ENGLISH);
            lessons.add(new LessonDraft(
                    day, lessonTitle, n.path("description").asText("").trim(),
                    n.path("resourceTitle").asText("").trim(), n.path("resourceUrl").asText("").trim(),
                    TYPES.contains(type) ? type : "READ",
                    clampMinutes(n.path("minutes").asInt(minutes), minutes)));
        }
        if (lessons.size() < Math.max(3, days / 2)) {
            throw new IllegalStateException("Gemini returned too few lessons: " + lessons.size());
        }
        String summary = parsed.path("summary").asText("").trim();
        return new PlanDraft("GEMINI", summary.isBlank() ? "A day-by-day plan built from live web resources." : summary, lessons);
    }

    private HttpResponse<String> sendGeminiRequest(String prompt) throws Exception {
        List<String> models = new ArrayList<>();
        models.add(geminiModel);
        if (!"gemini-3.5-flash-lite".equals(geminiModel)) {
            models.add("gemini-3.5-flash-lite");
        }

        int lastStatus = 0;
        for (String model : models) {
            // Try with Google Search grounding first; if quota/tier rejects search (429/403/400), retry without search.
            for (boolean useSearch : new boolean[]{true, false}) {
                Map<String, Object> body = useSearch
                        ? Map.of(
                                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                                "tools", List.of(Map.of("google_search", Map.of())),
                                "generationConfig", Map.of("temperature", 0.4, "maxOutputTokens", 32000)
                        )
                        : Map.of(
                                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                                "generationConfig", Map.of(
                                        "temperature", 0.4,
                                        "maxOutputTokens", 32000,
                                        "responseMimeType", "application/json"
                                )
                        );

                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(150))
                        .header("Content-Type", "application/json")
                        .header("x-goog-api-key", geminiApiKey)
                        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                        .build();

                HttpResponse<String> response = aiClient.send(request, HttpResponse.BodyHandlers.ofString());
                lastStatus = response.statusCode();
                if (lastStatus >= 200 && lastStatus < 300) {
                    return response;
                }
                if (useSearch && (lastStatus == 429 || lastStatus == 403 || lastStatus == 400)) {
                    log.info("Gemini search grounding unavailable on {} (HTTP {}), retrying without Google Search tool", model, lastStatus);
                    continue;
                }
                log.warn("Gemini model {} (search={}) returned HTTP {}, trying fallback if available", model, useSearch, lastStatus);
                break;
            }
        }
        throw new IllegalStateException("Gemini HTTP status " + lastStatus);
    }

    // ---------------------------------------------------------------- plan shaping and link checks

    /** Exactly one lesson per day. Gaps become a review of the previous lesson. */
    private List<LessonDraft> fillDays(List<LessonDraft> drafts, int days, int minutes) {
        Map<Integer, LessonDraft> byDay = new TreeMap<>();
        for (LessonDraft d : drafts) byDay.putIfAbsent(d.day(), d);
        List<LessonDraft> out = new ArrayList<>();
        LessonDraft previous = null;
        for (int day = 1; day <= days; day++) {
            LessonDraft d = byDay.get(day);
            if (d == null) {
                d = previous == null
                        ? new LessonDraft(day, "Get set up", "Pick a quiet time and place for your daily session.", "", "", "READ", minutes)
                        : new LessonDraft(day, "Review: " + previous.title(),
                        "Go back over yesterday's lesson and practise it once more.",
                        previous.resourceTitle(), previous.resourceUrl(), previous.resourceType(), previous.minutes());
            }
            d = new LessonDraft(day, d.title(), d.description(), d.resourceTitle(), d.resourceUrl(), d.resourceType(),
                    clampMinutes(d.minutes(), minutes));
            out.add(d);
            previous = d;
        }
        return out;
    }

    /** Keeps working links. Anything dead or unsafe turns into a search for that lesson, so it never leads nowhere. */
    private List<LessonDraft> checkLinks(List<LessonDraft> lessons, String goalTitle) {
        Map<String, Future<Boolean>> checks = new HashMap<>();
        for (LessonDraft l : lessons) {
            String url = l.resourceUrl();
            if (url != null && !url.isBlank()) {
                checks.computeIfAbsent(url, u -> linkPool.submit(() -> linkWorks(u)));
            }
        }
        Map<String, Boolean> ok = new HashMap<>();
        long deadline = System.currentTimeMillis() + 45_000;
        for (Map.Entry<String, Future<Boolean>> e : checks.entrySet()) {
            try {
                long wait = Math.max(1, deadline - System.currentTimeMillis());
                ok.put(e.getKey(), e.getValue().get(wait, TimeUnit.MILLISECONDS));
            } catch (Exception ex) {
                e.getValue().cancel(true);
                ok.put(e.getKey(), false);
            }
        }
        List<LessonDraft> out = new ArrayList<>();
        for (LessonDraft l : lessons) {
            String url = l.resourceUrl();
            if (url != null && Boolean.TRUE.equals(ok.get(url))) {
                out.add(l);
                continue;
            }
            String query = (l.resourceTitle() != null && !l.resourceTitle().isBlank() ? l.resourceTitle() : l.title())
                    + " " + goalTitle;
            String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String fallback = "VIDEO".equals(l.resourceType())
                    ? "https://www.youtube.com/results?search_query=" + encoded
                    : "https://www.google.com/search?q=" + encoded;
            out.add(new LessonDraft(l.day(), l.title(), l.description(),
                    l.resourceTitle() != null && !l.resourceTitle().isBlank() ? l.resourceTitle() : "Search: " + l.title(),
                    fallback, l.resourceType(), l.minutes()));
        }
        return out;
    }

    private boolean linkWorks(String url) {
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme();
            if (scheme == null || !(scheme.equals("https") || scheme.equals("http")) || uri.getHost() == null) return false;
            if (!isPublicHost(uri.getHost())) return false;
            int status = probe(uri, "HEAD");
            if (status == 400 || status == 405 || status == 501) status = probe(uri, "GET");
            // 3xx means the page exists. 401, 403 and 429 are bot protection on real sites.
            return (status >= 200 && status < 400) || status == 401 || status == 403 || status == 429;
        } catch (Exception ex) {
            return false;
        }
    }

    private int probe(URI uri, String method) throws Exception {
        HttpRequest.Builder b = HttpRequest.newBuilder().uri(uri).timeout(Duration.ofSeconds(6))
                .header("User-Agent", "Mozilla/5.0 (compatible; LOCKIN link check)");
        HttpRequest req = method.equals("HEAD") ? b.method("HEAD", HttpRequest.BodyPublishers.noBody()).build() : b.GET().build();
        return linkClient.send(req, HttpResponse.BodyHandlers.discarding()).statusCode();
    }

    private boolean isPublicHost(String host) {
        try {
            for (InetAddress a : InetAddress.getAllByName(host)) {
                byte[] raw = a.getAddress();
                boolean uniqueLocalV6 = raw.length == 16 && (raw[0] & 0xfe) == 0xfc;
                if (a.isAnyLocalAddress() || a.isLoopbackAddress() || a.isLinkLocalAddress()
                        || a.isSiteLocalAddress() || a.isMulticastAddress() || uniqueLocalV6) {
                    return false;
                }
            }
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    // ---------------------------------------------------------------- built-in plan

    private PlanDraft builtInPlan(String title, String details, String level, int minutes, String style, int days) {
        List<Step> modules = modulesFor((title + " " + (details != null ? details : "")).toLowerCase(Locale.ENGLISH), title);
        List<LessonDraft> lessons = new ArrayList<>();
        int previousIndex = -1;
        for (int day = 1; day <= days; day++) {
            int index = Math.min(modules.size() - 1, (int) Math.floor((day - 1) * modules.size() / (double) days));
            Step m = modules.get(index);
            boolean repeat = index == previousIndex;
            lessons.add(new LessonDraft(
                    day,
                    repeat ? "Practice and review: " + m.title() : m.title(),
                    repeat ? "Go over " + m.title().toLowerCase(Locale.ENGLISH) + " again and try one small exercise of your own."
                            : m.description(),
                    m.title(), m.url(), m.type(), minutes));
            previousIndex = index;
        }
        return new PlanDraft("BUILT_IN",
                "A ready-made route for this subject, spread evenly over " + days + " days. Add a Gemini API key for a plan built from live web search.",
                lessons);
    }

    private static Step read(String title, String url, String what) { return new Step(title, url, "READ", what); }
    private static Step video(String title, String query, String what) {
        return new Step(title, "https://www.youtube.com/results?search_query=" + URLEncoder.encode(query, StandardCharsets.UTF_8), "VIDEO", what);
    }
    private static Step practice(String title, String url, String what) { return new Step(title, url, "PRACTICE", what); }

    private List<Step> modulesFor(String text, String goalTitle) {
        if (text.contains("javascript") || text.matches(".*\\bjs\\b.*")) {
            return List.of(
                    read("JavaScript introduction", "https://www.w3schools.com/js/js_intro.asp", "Learn what JavaScript is and where it runs."),
                    read("Variables", "https://www.w3schools.com/js/js_variables.asp", "Store values with let and const."),
                    read("Data types", "https://www.w3schools.com/js/js_datatypes.asp", "Meet strings, numbers, booleans and objects."),
                    read("Functions", "https://www.w3schools.com/js/js_functions.asp", "Write code you can reuse."),
                    read("Conditions", "https://www.w3schools.com/js/js_if_else.asp", "Make decisions with if and else."),
                    read("Loops", "https://www.w3schools.com/js/js_loop_for.asp", "Repeat work with for loops."),
                    read("Arrays", "https://www.w3schools.com/js/js_arrays.asp", "Work with lists of values."),
                    read("The DOM", "https://www.w3schools.com/js/js_htmldom.asp", "Change a web page from your code."));
        }
        if (text.contains("html") || text.contains("css") || text.contains("web design") || text.contains("website")) {
            return List.of(
                    read("HTML introduction", "https://www.w3schools.com/html/html_intro.asp", "See what HTML is and write your first page."),
                    read("HTML basics", "https://www.w3schools.com/html/html_basic.asp", "Learn headings, paragraphs and links."),
                    read("HTML images and links", "https://www.w3schools.com/html/html_images.asp", "Add pictures and link pages together."),
                    read("HTML lists and tables", "https://www.w3schools.com/html/html_lists.asp", "Show information in lists and tables."),
                    read("HTML forms", "https://www.w3schools.com/html/html_forms.asp", "Collect input from visitors."),
                    read("CSS introduction", "https://www.w3schools.com/css/css_intro.asp", "Style your page with CSS."),
                    read("CSS selectors and colors", "https://www.w3schools.com/css/css_selectors.asp", "Target elements and set colors."),
                    read("The CSS box model", "https://www.w3schools.com/css/css_boxmodel.asp", "Control spacing, borders and size."),
                    read("CSS Flexbox", "https://www.w3schools.com/css/css_flexbox.asp", "Lay out rows and columns with ease."),
                    read("CSS Grid", "https://www.w3schools.com/css/css_grid.asp", "Build full page layouts."));
        }
        if (text.contains("java")) {
            return List.of(
                    read("Hello World", "https://www.programiz.com/java-programming/hello-world", "Write and run your first Java program."),
                    read("Variables and data types", "https://www.programiz.com/java-programming/variables-datatypes", "Store and use values."),
                    read("Operators", "https://www.programiz.com/java-programming/operators", "Do maths and compare values."),
                    read("Input and output", "https://www.programiz.com/java-programming/basic-input-output", "Read input and print results."),
                    read("If and else", "https://www.programiz.com/java-programming/if-else-statement", "Make decisions in code."),
                    read("Loops", "https://www.programiz.com/java-programming/for-loop", "Repeat work with loops."),
                    read("Arrays", "https://www.programiz.com/java-programming/arrays", "Hold lists of values."),
                    read("Methods", "https://www.programiz.com/java-programming/methods", "Split code into reusable pieces."),
                    read("Classes and objects", "https://www.programiz.com/java-programming/class-objects", "Start thinking in objects."),
                    read("Inheritance", "https://www.programiz.com/java-programming/inheritance", "Reuse and extend classes."));
        }
        if (text.contains("python")) {
            return List.of(
                    read("Hello World", "https://www.programiz.com/python-programming/first-program", "Write your first Python program."),
                    read("Variables and types", "https://www.programiz.com/python-programming/variables-datatypes", "Store and use values."),
                    read("Operators", "https://www.programiz.com/python-programming/operators", "Do maths and compare values."),
                    read("If and else", "https://www.programiz.com/python-programming/if-elif-else", "Make decisions in code."),
                    read("Loops", "https://www.programiz.com/python-programming/for-loop", "Repeat work with loops."),
                    read("Functions", "https://www.programiz.com/python-programming/function", "Write reusable code."),
                    read("Lists", "https://www.programiz.com/python-programming/list", "Work with collections."),
                    read("Classes and objects", "https://www.programiz.com/python-programming/class", "Start with object oriented code."));
        }
        if (text.contains("chess")) {
            return List.of(
                    practice("Learn the pieces and the board", "https://lichess.org/learn", "Work through the Lichess basics, one lesson at a time."),
                    practice("Checkmate patterns", "https://lichess.org/practice", "Practise the common mating patterns."),
                    practice("Tactics puzzles", "https://lichess.org/training", "Solve a few puzzles every day."),
                    video("Opening principles", "chess opening principles for beginners", "Watch a short lesson on how to start a game well."),
                    video("Basic endgames", "chess basic endgames for beginners", "Learn the king and pawn endings that win games."),
                    practice("Play a game and review it", "https://lichess.org/", "Play one calm game, then look at where it turned."),
                    video("Common beginner mistakes", "chess beginner mistakes to avoid", "Spot the habits that lose the most games."));
        }
        if (text.contains("photo")) {
            return List.of(
                    video("How a camera works", "photography for beginners how a camera works", "Understand the basics of your camera."),
                    video("The exposure triangle", "exposure triangle aperture shutter iso explained", "Learn aperture, shutter speed and ISO."),
                    video("Composition", "photography composition rules", "Frame a shot so it holds attention."),
                    video("Using light", "photography natural light for beginners", "See how light changes a photo."),
                    video("Editing basics", "photo editing basics lightroom", "Edit your best shot from the week."),
                    video("Shooting a photo project", "photography beginner project ideas", "Pick a subject and shoot it all week."));
        }
        if (text.contains("video edit") || text.contains("editing") || text.contains("premiere") || text.contains("davinci")) {
            return List.of(
                    video("Meet your editing software", "video editing for beginners full tutorial", "Find your way around the timeline."),
                    video("Cuts and pacing", "video editing cuts pacing tutorial", "Cut footage so it flows."),
                    video("Audio and music", "video editing audio mixing for beginners", "Balance voice and music."),
                    video("Titles and transitions", "video editing titles transitions tutorial", "Add text and smooth changes."),
                    video("Colour basics", "color correction basics video editing", "Make your footage look consistent."),
                    video("Export for social media", "best export settings video editing", "Publish your first finished video."));
        }
        return List.of(
                video("Overview for beginners", goalTitle + " for beginners", "Get the big picture of the subject."),
                video("The core basics", goalTitle + " basics tutorial", "Learn the building blocks."),
                video("Common mistakes", goalTitle + " beginner mistakes", "Avoid the usual traps."),
                video("Hands-on practice", goalTitle + " practice exercises", "Do a small exercise yourself."),
                video("Next steps", goalTitle + " intermediate next steps", "See where to go once you have the basics."));
    }

    // ---------------------------------------------------------------- small helpers

    private static String pick(String value, Set<String> allowed, String fallback) {
        String v = value == null ? "" : value.trim().toUpperCase(Locale.ENGLISH);
        return allowed.contains(v) ? v : fallback;
    }

    private static int clampMinutes(int value, int max) {
        return Math.max(5, Math.min(max, value));
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
