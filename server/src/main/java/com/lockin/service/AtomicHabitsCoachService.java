package com.lockin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AtomicHabitsCoachService {

    private static final Logger log = LoggerFactory.getLogger(AtomicHabitsCoachService.class);

    private final String geminiApiKey;
    private final String geminiModel;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public record MilestonePlan(String title, String description, LocalDate targetDate) {}

    public record HabitPlan(
            String name,
            String twoMinuteVersion,
            String habitStackCue,
            String category,
            String whyItWorks
    ) {}

    public record GoalBlueprint(
            String provider,
            String identityStatement,
            String roadmapSummary,
            List<MilestonePlan> milestones,
            List<HabitPlan> suggestedHabits
    ) {}

    public AtomicHabitsCoachService(
            @Value("${app.ai.gemini-api-key:}") String geminiApiKey,
            @Value("${app.ai.gemini-model:gemini-2.5-flash}") String geminiModel,
            ObjectMapper objectMapper
    ) {
        this.geminiApiKey = geminiApiKey != null ? geminiApiKey.trim() : "";
        this.geminiModel = geminiModel != null && !geminiModel.isBlank() ? geminiModel.trim() : "gemini-2.5-flash";
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public boolean isAiConfigured() {
        return !geminiApiKey.isBlank();
    }

    public GoalBlueprint generateBlueprint(
            String title,
            String description,
            String category,
            String userIdentityStatement,
            LocalDate targetDate
    ) {
        LocalDate today = LocalDate.now();
        LocalDate effectiveTarget = (targetDate == null || !targetDate.isAfter(today))
                ? today.plusDays(90)
                : targetDate;

        if (isAiConfigured()) {
            try {
                GoalBlueprint aiBlueprint = callGemini(title, description, category, userIdentityStatement, today, effectiveTarget);
                if (aiBlueprint != null && !aiBlueprint.suggestedHabits().isEmpty() && !aiBlueprint.milestones().isEmpty()) {
                    return aiBlueprint;
                }
            } catch (Exception ex) {
                log.warn("Gemini AI blueprint generation failed, falling back to built-in Atomic Habits engine: {}", ex.getMessage());
            }
        }

        return generateBuiltInBlueprint(title, description, category, userIdentityStatement, today, effectiveTarget);
    }

    private GoalBlueprint callGemini(
            String title,
            String description,
            String category,
            String userIdentityStatement,
            LocalDate today,
            LocalDate targetDate
    ) throws Exception {
        long daysUntilTarget = Math.max(7, ChronoUnit.DAYS.between(today, targetDate));

        String prompt = """
                You are an expert habit coach grounded strictly in James Clear's "Atomic Habits".
                A user created this long-term goal:
                - Goal Title: %s
                - Category: %s
                - Details/Context: %s
                - User's Identity Statement (optional): %s
                - Today's Date: %s
                - Target Date: %s (%d days from now)

                Return ONLY valid JSON matching this exact schema:
                {
                  "identityStatement": "I am becoming a person who ...",
                  "roadmapSummary": "2 concise sentences explaining how daily systems achieve this goal without burnout.",
                  "milestones": [
                    {
                      "title": "Short-term milestone title (max 100 chars)",
                      "description": "Concrete observable checkpoint",
                      "targetDate": "YYYY-MM-DD"
                    }
                  ],
                  "suggestedHabits": [
                    {
                      "name": "Specific daily atomic habit (max 90 chars)",
                      "twoMinuteVersion": "Tiny 2-minute starter version for tired/busy days (max 140 chars)",
                      "habitStackCue": "After I [existing daily anchor], I will [tiny start] (max 160 chars)",
                      "category": "Short category label",
                      "whyItWorks": "1 concise sentence connecting this daily habit to the long-term goal"
                    }
                  ]
                }

                Rules:
                - Include 4 short-term milestones spaced evenly between %s and %s.
                - Include 4 to 5 daily atomic habits that are realistic, specific, and measurable.
                - If the user provided an Identity Statement, keep or refine it gently.
                - Keep all text punchy, practical, and motivating.
                """.formatted(
                title,
                category != null ? category : "PERSONAL",
                description != null && !description.isBlank() ? description : "Not provided",
                userIdentityStatement != null && !userIdentityStatement.isBlank() ? userIdentityStatement : "None provided",
                today,
                targetDate,
                daysUntilTarget,
                today,
                targetDate
        );

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "temperature", 0.65,
                        "responseMimeType", "application/json"
                )
        );

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(18))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Gemini HTTP status " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            throw new IllegalStateException("Empty response from Gemini");
        }

        String rawJson = stripCodeFences(textNode.asText().trim());
        JsonNode parsed = objectMapper.readTree(rawJson);

        String identity = firstNonBlank(userIdentityStatement, parsed.path("identityStatement").asText(""), "I am becoming someone who shows up daily for " + title);
        String summary = firstNonBlank(parsed.path("roadmapSummary").asText(""), "Break this long-term goal into short-term milestones and cast daily votes through small, repeatable habits.");

        List<MilestonePlan> milestones = new ArrayList<>();
        JsonNode milestonesNode = parsed.path("milestones");
        if (milestonesNode.isArray()) {
            int total = Math.min(milestonesNode.size(), 5);
            for (int i = 0; i < total; i++) {
                JsonNode m = milestonesNode.get(i);
                String mTitle = truncate(m.path("title").asText("").trim(), 155);
                if (mTitle.isBlank()) continue;
                String mDesc = m.path("description").asText("").trim();
                LocalDate mDate = parseDateOrFallback(m.path("targetDate").asText(""), proportionalDate(today, targetDate, (double) (i + 1) / Math.max(1, total)));
                milestones.add(new MilestonePlan(mTitle, mDesc, mDate));
            }
        }

        List<HabitPlan> habits = new ArrayList<>();
        JsonNode habitsNode = parsed.path("suggestedHabits");
        if (habitsNode.isArray()) {
            int total = Math.min(habitsNode.size(), 6);
            for (int i = 0; i < total; i++) {
                JsonNode h = habitsNode.get(i);
                String hName = truncate(h.path("name").asText("").trim(), 120);
                if (hName.isBlank()) continue;
                habits.add(new HabitPlan(
                        hName,
                        truncate(h.path("twoMinuteVersion").asText("").trim(), 240),
                        truncate(h.path("habitStackCue").asText("").trim(), 240),
                        truncate(firstNonBlank(h.path("category").asText(""), category, "Growth"), 60),
                        h.path("whyItWorks").asText("").trim()
                ));
            }
        }

        return new GoalBlueprint("GEMINI", truncate(identity, 250), summary, milestones, habits);
    }

    private GoalBlueprint generateBuiltInBlueprint(
            String title,
            String description,
            String category,
            String userIdentityStatement,
            LocalDate today,
            LocalDate targetDate
    ) {
        String domain = detectDomain(title, description, category);
        LocalDate d1 = proportionalDate(today, targetDate, 0.20);
        LocalDate d2 = proportionalDate(today, targetDate, 0.50);
        LocalDate d3 = proportionalDate(today, targetDate, 0.80);
        LocalDate d4 = targetDate;

        return switch (domain) {
            case "FITNESS" -> new GoalBlueprint(
                    "BUILT_IN",
                    firstNonBlank(userIdentityStatement, "I am an athlete who never misses two days in a row."),
                    "Physical transformation is a lagging indicator of your daily training and recovery habits. Start embarrassingly easy, lock in the schedule first, then gradually increase intensity.",
                    List.of(
                            new MilestonePlan("Lock in the daily movement cue", "Complete 14 days of showing up consistently—even if some sessions use the 2-minute fallback.", d1),
                            new MilestonePlan("Build baseline endurance & strength", "Reach 75%+ consistency across a full 30-day tracking period and log measurable progress.", d2),
                            new MilestonePlan("Progressive overload phase", "Increase workout duration or difficulty by 20–30% while keeping sleep and hydration steady.", d3),
                            new MilestonePlan("Achieve: " + truncate(title, 120), "Hit your target fitness benchmark and transition into a sustainable maintenance system.", d4)
                    ),
                    List.of(
                            new HabitPlan("Complete daily workout or run (25–30 min)", "Put on workout shoes and do 5 minutes of stretching or 10 pushups", "After I wake up and drink water, I will immediately change into workout gear", "Fitness", "Consistent training volume compounds far faster than occasional heroic workouts."),
                            new HabitPlan("Hit 8,000+ daily steps", "Step outside and walk to the end of the street and back", "After lunch, I will take a 10-minute walk before checking my phone", "Movement", "Low-intensity daily movement accelerates recovery and caloric burn without fatigue."),
                            new HabitPlan("Drink 2.5L of water & hit protein goal", "Drink one full glass of water right now", "Before my morning coffee, I will drink one tall glass of water", "Nutrition", "Fueling and hydration drive energy levels and visible physical results."),
                            new HabitPlan("Prep gym clothes & gear the night before", "Set workout shoes beside the bed", "After brushing my teeth at night, I will lay out tomorrow's training clothes", "Environment", "Environment design removes morning friction so showing up becomes automatic.")
                    )
            );
            case "CAREER" -> new GoalBlueprint(
                    "BUILT_IN",
                    firstNonBlank(userIdentityStatement, "I am a craftsperson who sharpens my skills every single day."),
                    "Career leaps rarely come from last-minute cramming; they come from compounding daily deep work, public proof of skill, and deliberate practice.",
                    List.of(
                            new MilestonePlan("Define skill gap & study system", "Audit the top 3 skills required for your goal and lock in a protected daily focus block.", d1),
                            new MilestonePlan("Ship your first tangible milestone", "Build a portfolio project, complete a core module, or solve 30 practice problems.", d2),
                            new MilestonePlan("Real-world feedback & mock reps", "Get code/work reviews, run mock interviews, or take on stretch ownership at work.", d3),
                            new MilestonePlan("Achieve: " + truncate(title, 120), "Demonstrate mastery with measurable results, shipped projects, or role transition.", d4)
                    ),
                    List.of(
                            new HabitPlan("45 min distraction-free deep skill practice", "Open your IDE/notes and work on one tiny problem for 2 minutes", "After my first morning coffee, I will start a 25-min timer with phone in another room", "Deep Work", "Uninterrupted deliberate practice builds rare, high-leverage competence."),
                            new HabitPlan("Build or ship one small code/project improvement", "Write 5 lines of code or update one checklist item in your project", "After finishing my core work block, I will commit one small visible improvement", "Building", "Shipping daily builds a portfolio of undeniable proof over months."),
                            new HabitPlan("Read technical docs, architecture notes, or industry insights (15 min)", "Read one single page or engineering post summary", "After lunch, I will read one technical article before scrolling social media", "Learning", "Daily exposure expands your mental models and decision-making sharpness."),
                            new HabitPlan("Log 1 daily win & tomorrow's #1 priority", "Write a single bullet point of what moved the needle today", "Before shutting down my laptop, I will write tomorrow's single top task", "Clarity", "Ending each day with clarity eliminates procrastination the next morning.")
                    )
            );
            case "FINANCE" -> new GoalBlueprint(
                    "BUILT_IN",
                    firstNonBlank(userIdentityStatement, "I am a financially disciplined person who directs every dollar with intention."),
                    "Wealth and financial freedom are built by automating good decisions and keeping daily spending visible so small leaks never compound against you.",
                    List.of(
                            new MilestonePlan("Full visibility & automated savings", "Map every monthly expense, cancel unused subscriptions, and set an automatic savings transfer.", d1),
                            new MilestonePlan("Hit 25% of your financial target", "Maintain 30+ days of daily expense awareness and lock in a zero-impulse spending habit.", d2),
                            new MilestonePlan("Accelerate income or savings rate", "Reach 65% of target by increasing savings allocation or adding a focused income lever.", d3),
                            new MilestonePlan("Achieve: " + truncate(title, 120), "Cross your target financial milestone with a repeatable system that protects it.", d4)
                    ),
                    List.of(
                            new HabitPlan("Log all daily expenses & check budget (3 min)", "Open your banking app and review today's transactions for 60 seconds", "After dinner, I will review today's spending in under 3 minutes", "Finance", "What gets measured daily stays under control—awareness stops silent lifestyle creep."),
                            new HabitPlan("Apply the 24-hour rule before non-essential purchases", "Add any impulse want to a 'Wait 24h' note instead of clicking Buy", "Whenever I feel tempted to buy something online, I will add it to my wishlist first", "Discipline", "Adding a tiny friction pause eliminates most emotional spending."),
                            new HabitPlan("Cook or pack meals instead of ordering takeout", "Prep one simple snack or fill a reusable lunch box", "After dinner cleanup, I will pack tomorrow's lunch or set out breakfast", "Savings", "Small daily food savings routinely free up hundreds of dollars per month."),
                            new HabitPlan("15 min financial education or income-building work", "Read one page on investing, budgeting, or high-income skills", "After my morning routine, I will spend 15 minutes sharpening my wealth/income skills", "Growth", "Pairing disciplined saving with growing earning power compounds your timeline.")
                    )
            );
            case "BUSINESS" -> new GoalBlueprint(
                    "BUILT_IN",
                    firstNonBlank(userIdentityStatement, "I am a builder who ships value and talks to users consistently."),
                    "Businesses grow when you focus daily on the two activities that actually move the needle: improving the product and distributing it to real customers.",
                    List.of(
                            new MilestonePlan("Validate problem & launch MVP", "Talk to 10+ target users and ship a working first version without over-polishing.", d1),
                            new MilestonePlan("Build a repeatable distribution loop", "Publish content or do direct outreach daily for 30 days to get consistent inbound leads.", d2),
                            new MilestonePlan("Convert paying users & iterate", "Refine onboarding, pricing, and core features based on real customer feedback.", d3),
                            new MilestonePlan("Achieve: " + truncate(title, 120), "Hit your business milestone with a predictable daily acquisition and shipping cadence.", d4)
                    ),
                    List.of(
                            new HabitPlan("Ship 1 product or service improvement", "Fix one tiny bug or write one user-facing paragraph", "After opening my laptop, I will spend 30 minutes building before checking email", "Product", "Daily shipping creates unstoppable momentum and faster customer feedback."),
                            new HabitPlan("Reach out to 2 potential users/clients or publish 1 value post", "Draft 2 sentences of an outreach message or post hook", "After lunch, I will send 2 genuine messages or publish one useful insight", "Distribution", "Great products fail silently—daily distribution makes growth inevitable."),
                            new HabitPlan("Review key metrics & customer feedback (10 min)", "Check your core metric dashboard and note 1 takeaway", "At 5 PM, I will review user activity and log one insight", "Strategy", "Staying close to real numbers keeps you focused on high-leverage work."),
                            new HabitPlan("Plan tomorrow's single highest-leverage needle mover", "Write 1 sentence naming tomorrow's #1 revenue/product task", "Before closing my laptop, I will write tomorrow's must-do task on top of my list", "Focus", "Protects your days from getting swallowed by busywork.")
                    )
            );
            case "LEARNING" -> new GoalBlueprint(
                    "BUILT_IN",
                    firstNonBlank(userIdentityStatement, "I am a curious lifelong learner who practices a little every day."),
                    "Memory and skill acquisition rely on spaced repetition, not marathon cram sessions. Showing up daily keeps neural pathways active and compounding.",
                    List.of(
                            new MilestonePlan("Set syllabus & daily study rhythm", "Gather core study materials and hit a 14-day unbroken streak of daily practice.", d1),
                            new MilestonePlan("Master foundational concepts", "Complete the first major module and test yourself with active recall (no peeking).", d2),
                            new MilestonePlan("Practice under real conditions", "Complete timed practice exams, real conversations, or applied projects.", d3),
                            new MilestonePlan("Achieve: " + truncate(title, 120), "Pass your benchmark or demonstrate confident real-world fluency.", d4)
                    ),
                    List.of(
                            new HabitPlan("25 min focused active study session", "Open your study app/notes and review 3 flashcards", "After breakfast, I will set a 25-minute timer for uninterrupted study", "Study", "Daily spaced sessions build far stronger long-term retention than weekend cramming."),
                            new HabitPlan("Active recall review (flashcards or practice questions)", "Answer just 2 practice questions from memory", "While waiting for coffee or commuting, I will review 5 flashcards", "Retention", "Retrieving knowledge from memory doubles retention compared to passive re-reading."),
                            new HabitPlan("Summarize 1 concept in your own words", "Write 2 sentences explaining what you learned today", "Right after finishing my study block, I will write a 2-sentence Feynman note", "Mastery", "If you can explain an idea simply, you truly understand it."),
                            new HabitPlan("Immersion or applied practice (15 min)", "Listen to 2 minutes of audio or solve 1 small exercise", "After dinner, I will spend 15 minutes applying what I'm learning in context", "Application", "Applying knowledge bridges the gap between theory and real skill.")
                    )
            );
            case "READING" -> new GoalBlueprint(
                    "BUILT_IN",
                    firstNonBlank(userIdentityStatement, "I am a reader and clear thinker who feeds my mind every day."),
                    "Reading 15 pages a day quietly equals 18+ books a year. Make books obvious in your environment and attach reading to an anchor you never skip.",
                    List.of(
                            new MilestonePlan("Curate your reading/writing list & daily cue", "Pick your next 3 books or writing themes and read/write daily for 14 days straight.", d1),
                            new MilestonePlan("Build a 30-day unbroken reading/writing rhythm", "Finish your first major book or publish/draft 4 solid pieces.", d2),
                            new MilestonePlan("Capture & apply key ideas", "Build a personal notes library of insights you actually use in daily life.", d3),
                            new MilestonePlan("Achieve: " + truncate(title, 120), "Complete your reading or writing milestone and reflect on your top takeaways.", d4)
                    ),
                    List.of(
                            new HabitPlan("Read 15 pages (or write 300 words)", "Read 1 single page (or write 2 sentences)", "After getting into bed, I will put my phone away and read before sleeping", "Reading", "Small daily page counts compound into dozens of finished books every year."),
                            new HabitPlan("Capture 1 key takeaway or highlight in notes", "Jot down one favorite sentence from today's session", "Right after closing my book, I will write 1 bullet takeaway", "Retention", "Reflecting on one idea turns passive reading into lasting wisdom."),
                            new HabitPlan("Replace 15 min of mindless scrolling with book/article", "Open your e-reader or pick up your book instead of social media", "When I reach for my phone during a break, I will open my book app first", "Focus", "Swapping one bad cue for a good habit reclaims hours every week.")
                    )
            );
            case "MINDFULNESS" -> new GoalBlueprint(
                    "BUILT_IN",
                    firstNonBlank(userIdentityStatement, "I am a calm, present, and well-rested person who protects my peace."),
                    "Clarity, deep sleep, and mental calm are built through gentle daily nervous-system resets and consistent wind-down cues.",
                    List.of(
                            new MilestonePlan("Establish morning & evening anchor cues", "Complete 14 days of brief daily mindfulness and a consistent bedtime wind-down.", d1),
                            new MilestonePlan("Reduce digital noise & reactivity", "Keep phone-free mornings and evenings for 30 days and notice calmer focus.", d2),
                            new MilestonePlan("Deepen emotional resilience", "Maintain consistent sleep timing and daily reflection even during stressful weeks.", d3),
                            new MilestonePlan("Achieve: " + truncate(title, 120), "Experience sustained calm, sharper focus, and restorative energy as your new default.", d4)
                    ),
                    List.of(
                            new HabitPlan("10 min mindfulness, breathwork, or quiet stillness", "Take 5 slow deep breaths with eyes closed", "After waking up and drinking water, I will sit quietly for 2–10 minutes before checking screens", "Mindfulness", "Training attention for even a few minutes daily lowers baseline stress."),
                            new HabitPlan("5 min evening reflection & gratitude journal", "Write down 1 thing you're grateful for today", "After brushing my teeth at night, I will write 3 quick lines in my journal", "Reflection", "Unloading thoughts onto paper quiets mental racing before sleep."),
                            new HabitPlan("Screen-free wind-down 45 min before bed", "Put your phone on charger across the room at bedtime", "When my bedtime alarm rings, I will plug my phone in away from the bed", "Sleep", "Protecting your final 45 minutes dramatically improves deep sleep quality."),
                            new HabitPlan("15 min outdoor daylight walk without distractions", "Step outside for 2 minutes of fresh air and sunlight", "After morning coffee, I will step outside for daylight exposure", "Energy", "Morning light and movement anchor your circadian rhythm and boost mood.")
                    )
            );
            case "CREATIVE" -> new GoalBlueprint(
                    "BUILT_IN",
                    firstNonBlank(userIdentityStatement, "I am a prolific creator who shows up to practice and make things daily."),
                    "Creative breakthroughs come from volume and consistency, not waiting for inspiration. Show up daily, keep the barrier tiny, and share your work.",
                    List.of(
                            new MilestonePlan("Build the daily creation habit", "Show up to your craft 14 days in a row—quantity and consistency over perfection.", d1),
                            new MilestonePlan("Complete your first mini-project", "Finish and save/share a complete piece (song, sketch, video, or design).", d2),
                            new MilestonePlan("Refine technique & publish consistently", "Get feedback, study masters in your craft, and produce a steady body of work.", d3),
                            new MilestonePlan("Achieve: " + truncate(title, 120), "Reach your creative milestone with a strong portfolio and effortless practice rhythm.", d4)
                    ),
                    List.of(
                            new HabitPlan("30 min deliberate creative practice", "Pick up your instrument/tool and create for 2 minutes", "After dinner (or morning coffee), I will sit at my creative space for a 2-minute start", "Craft", "Starting is 90% of creative momentum—inspiration follows action."),
                            new HabitPlan("Study 1 reference piece or technique (10 min)", "Watch or analyze 2 minutes of a master example", "During my afternoon break, I will study one detail from an artist I admire", "Inspiration", "Active analysis trains your eye/ear faster than passive consumption."),
                            new HabitPlan("Capture or share 1 work-in-progress snippet", "Save a quick photo, recording, or draft note", "At the end of my session, I will log or export today's progress", "Output", "Tracking creative output shows unmistakable growth over months.")
                    )
            );
            case "HEALTH" -> new GoalBlueprint(
                    "BUILT_IN",
                    firstNonBlank(userIdentityStatement, "I am someone who nourishes and respects my body every day."),
                    "Sustainable health is never about extreme diets—it's about simple daily nutrition, hydration, and sleep choices made easy by your environment.",
                    List.of(
                            new MilestonePlan("Clean up your daily defaults", "Stock healthy staples at home and track core daily health habits for 14 days.", d1),
                            new MilestonePlan("Build a 30-day energy & nutrition rhythm", "Maintain 80%+ consistency on whole foods, hydration, and sleep.", d2),
                            new MilestonePlan("Fine-tune & sustain under busy weeks", "Keep your 2-minute fallbacks ready for travel or stressful days—never miss twice.", d3),
                            new MilestonePlan("Achieve: " + truncate(title, 120), "Reach your health goal with habits that feel natural for life.", d4)
                    ),
                    List.of(
                            new HabitPlan("Eat at least 2 servings of whole fruits/vegetables", "Add one handful of greens or fruit to your next meal", "Before serving lunch, I will add a serving of vegetables to my plate first", "Nutrition", "Crowding in whole foods naturally improves energy and reduces cravings."),
                            new HabitPlan("Drink 2.5L of water throughout the day", "Fill your water bottle and take 5 sips right now", "Right after waking up, I will drink one full glass of water", "Hydration", "Consistent hydration boosts focus, digestion, and metabolism."),
                            new HabitPlan("In bed on time for 7–8 hours of sleep", "Start bedtime routine 10 minutes earlier tonight", "At 10 PM, I will dim lights and start winding down", "Recovery", "Quality sleep regulates hunger hormones, mood, and willpower."),
                            new HabitPlan("20 min daily movement or stretching", "Do 2 minutes of mobility stretching", "After sitting for work, I will stand up and stretch or walk", "Movement", "Gentle daily movement keeps joints healthy and energy steady.")
                    )
            );
            default -> new GoalBlueprint(
                    "BUILT_IN",
                    firstNonBlank(userIdentityStatement, "I am becoming a disciplined person who takes daily action toward " + truncate(title, 120) + "."),
                    "Big goals happen automatically when you shrink them into small, obvious daily habits. Focus on showing up every day—especially using the 2-minute fallback on tough days.",
                    List.of(
                            new MilestonePlan("Foundation: Build your daily trigger", "Clarify your exact plan for '" + truncate(title, 70) + "' and show up 14 days straight.", d1),
                            new MilestonePlan("Momentum: Complete a 30-day LOCKIN sprint", "Hit 75%+ habit consistency and measure your first concrete win.", d2),
                            new MilestonePlan("Acceleration: Level up difficulty", "Double down on the highest-impact habit and remove your #1 distraction.", d3),
                            new MilestonePlan("Achieve: " + truncate(title, 120), "Cross your target finish line with a proven daily system behind you.", d4)
                    ),
                    List.of(
                            new HabitPlan("25 min focused daily action on: " + truncate(title, 60), "Spend just 2 focused minutes taking the smallest next step", "After my morning routine, I will work on this goal for at least 2 minutes before checking messages", "Core Action", "Daily forward motion guarantees steady progress instead of waiting for free weekends."),
                            new HabitPlan("15 min learning or research to sharpen your approach", "Read 1 page, watch 2 minutes of a tutorial, or review notes", "During my afternoon break, I will learn one actionable tip related to my goal", "Learning", "Small daily upgrades in knowledge multiply the effectiveness of your effort."),
                            new HabitPlan("Prepare environment & remove 1 friction point for tomorrow", "Set out the tool, tab, or workspace you need for tomorrow", "Before ending my evening, I will set up my workspace so starting tomorrow takes 5 seconds", "Environment", "In Atomic Habits, making the right action the easiest option beats raw willpower."),
                            new HabitPlan("2 min nightly progress check-in & next step", "Check off today's LOCKIN habits and write 1 line for tomorrow", "After dinner, I will open LOCKIN and log my daily wins", "Accountability", "Immediate visual tracking makes consistency satisfying and prevents missing twice.")
                    )
            );
        };
    }

    private String detectDomain(String title, String description, String category) {
        String cat = category != null ? category.trim().toUpperCase(Locale.ENGLISH) : "";
        if (Set.of("FITNESS", "CAREER", "FINANCE", "BUSINESS", "LEARNING", "READING", "MINDFULNESS", "CREATIVE", "HEALTH").contains(cat)) {
            return cat;
        }
        String text = ((title != null ? title : "") + " " + (description != null ? description : "")).toLowerCase(Locale.ENGLISH);
        if (containsAny(text, "marathon", "run", "running", "gym", "workout", "muscle", "weight", "lose ", "fit", "strength", "pushup", "body", "6 pack", "six pack", "abs", "yoga", "swim", "cycling")) {
            return "FITNESS";
        }
        if (containsAny(text, "save", "money", "invest", "debt", "budget", "wealth", "financial", "$", "dollar", "naira", "pound", "euro", "net worth", "emergency fund", "house", "mortgage", "retire")) {
            return "FINANCE";
        }
        if (containsAny(text, "startup", "business", "saas", "revenue", "client", "freelance", "agency", "launch", "founder", "company", "brand", "ecommerce", "customers", "sales")) {
            return "BUSINESS";
        }
        if (containsAny(text, "engineer", "developer", "code", "coding", "programming", "software", "java", "python", "react", "aws", "cloud", "job", "promotion", "interview", "career", "leetcode", "salary", "tech")) {
            return "CAREER";
        }
        if (containsAny(text, "read", "book", "write", "writing", "novel", "blog", "newsletter", "author", "publish")) {
            return "READING";
        }
        if (containsAny(text, "learn", "study", "exam", "degree", "spanish", "french", "german", "japanese", "language", "course", "certif", "ielts", "gmat", "university", "fluent", "gpa")) {
            return "LEARNING";
        }
        if (containsAny(text, "meditat", "sleep", "stress", "calm", "mental", "anxiety", "mindful", "peace", "journal", "dopamine", "phone", "screen", "wake up", "5am", "morning")) {
            return "MINDFULNESS";
        }
        if (containsAny(text, "piano", "guitar", "music", "draw", "paint", "art", "design", "video", "youtube", "podcast", "photo", "film", "content creator")) {
            return "CREATIVE";
        }
        if (containsAny(text, "diet", "eat", "nutrition", "water", "cook", "sugar", "healthy", "alcohol", "smoke", "skin", "posture")) {
            return "HEALTH";
        }
        return "PERSONAL";
    }

    private boolean containsAny(String haystack, String... needles) {
        for (String n : needles) {
            if (haystack.contains(n)) return true;
        }
        return false;
    }

    private LocalDate proportionalDate(LocalDate start, LocalDate end, double ratio) {
        long totalDays = Math.max(1, ChronoUnit.DAYS.between(start, end));
        long offset = Math.max(1, Math.round(totalDays * ratio));
        LocalDate candidate = start.plusDays(offset);
        return candidate.isAfter(end) ? end : candidate;
    }

    private LocalDate parseDateOrFallback(String text, LocalDate fallback) {
        if (text == null || text.isBlank()) return fallback;
        try {
            return LocalDate.parse(text.trim());
        } catch (Exception e) {
            return fallback;
        }
    }

    private String stripCodeFences(String text) {
        if (text.startsWith("```")) {
            int firstNewline = text.indexOf('\n');
            int lastFence = text.lastIndexOf("```");
            if (firstNewline > 0 && lastFence > firstNewline) {
                return text.substring(firstNewline + 1, lastFence).trim();
            }
        }
        return text;
    }

    private String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v.trim();
        }
        return "";
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "";
        return s.length() <= maxLen ? s : s.substring(0, maxLen).trim();
    }
}
