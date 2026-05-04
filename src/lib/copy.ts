export const SITE_COPY = {
  shared: {
    COPY_SHARED_APPNAME_01: "Headroom",
    COPY_SHARED_NAV_DASHBOARD_01: "Dashboard",
    COPY_SHARED_NAV_HISTORY_01: "History",
    COPY_SHARED_NAV_PROFILE_01: "Profile",
    COPY_SHARED_NAV_SETTINGS_01: "Settings",
    COPY_SHARED_SIGNED_IN_01: "Signed in",
    COPY_SHARED_FALLBACK_USERNAME_01: "Student planner",
    COPY_SHARED_AUTH_SIGNOUT_01: "Sign out",
    COPY_SHARED_AUTH_SIGNIN_GOOGLE_01: "Continue with Google",
    COPY_SHARED_AUTH_SIGNIN_DEMO_01: "Start assessment",
    COPY_SHARED_STATUS_CONNECTED_01: "Connected",
    COPY_SHARED_STATUS_RECONNECT_01: "Reconnect needed",
    COPY_SHARED_STATUS_MISSING_ACCESS_01: "Calendar access missing",
    COPY_SHARED_STATUS_PROVIDER_RESTRICTED_01: "Provider access restricted",
    COPY_SHARED_STATUS_NOT_CONNECTED_01: "Not connected",
  },
  landing: {
    COPY_LANDING_HEADER_HEADLINE_01: "Plan your week with you in mind",
    COPY_LANDING_HERO_HEADLINE_01: "Plan your week around your cognitive profile.",
    COPY_LANDING_HERO_BODY_01:
      "Headroom reads your calendar and workload through your cognitive profile to identify better work windows, recovery periods, and daily overload risk.",
    COPY_LANDING_REPORT_EYEBROW_01: "Weekly cognitive load report",
    COPY_LANDING_REPORT_HEADLINE_01: "Thursday looks tight for deep work.",
    COPY_LANDING_REPORT_BADGE_01: "74 / 100 overload risk",
    COPY_LANDING_REPORT_METRICS: [
      ["Protected focus time", "4.5 hours"],
      ["Recovery blocks", "2"],
      ["Major deadlines", "3"],
    ] as const,
    COPY_LANDING_SIGNAL_EYEBROW_01: "Planning signal",
    COPY_LANDING_SIGNAL_HEADLINE_01: "Start your lab report Tuesday at 1:30 PM.",
    COPY_LANDING_SIGNAL_BODY_01:
      "Based on a 95-minute uninterrupted block, earlier ambiguity protection, and the fact that later windows are more fragmented.",
    COPY_LANDING_FEATURES_HEADLINE_01:
      "Understand your cognitive profile, map your week to it, and allocate work with intention.",
    COPY_LANDING_FEATURES: [
      {
        title: "1. Identify your cognitive subtype",
        body: "Take a short assessment of focus, overload, and recovery patterns.",
      },
      {
        title: "2. Align your schedule with your profile",
        body: "See your week through your subtype.",
      },
      {
        title: "3. Plan your weeks intelligently",
        body: "Find deep-work windows and overload warnings before they hit you",
      },
    ] as const,
    COPY_LANDING_INPUTS_HEADLINE_01: "Four inputs shape how Headroom reads each week.",
    COPY_LANDING_INPUT_LABELS: [
      "Work & Recovery Profile",
      "Calendar Structure",
      "Task Demands",
      "Quality and Duration of Recovery Blocks",
    ] as const,
  },
  onboarding: {
    COPY_ONBOARDING_BRAND_01: "Headroom",
    COPY_ONBOARDING_HERO_HEADLINE_01: "Get your personalized cognitive profile",
    COPY_ONBOARDING_HERO_BODY_01: "Answer a few quick questions to personalize your planning.",
    COPY_ONBOARDING_SAVED_BADGE_01: "Profile saved",
    COPY_ONBOARDING_PROFILE_ACTION_01: "Open dashboard",
    COPY_ONBOARDING_PROFILE_ACTION_02: "Open settings",
    COPY_ONBOARDING_PROFILE_ACTION_04: "Retake assessment",
    COPY_ONBOARDING_PROGRESS_LABEL_01: (step: number, total: number) =>
      `Question ${step} of ${total}`,
    COPY_ONBOARDING_PROGRESS_PILL_01: (step: number, total: number) => `${step} / ${total}`,
    COPY_ONBOARDING_HELPER_01: "Responses inform your planning profile.",
    COPY_ONBOARDING_BACK_01: "Back",
    COPY_ONBOARDING_SAVE_IDLE_01: "Save profile",
    COPY_ONBOARDING_SAVE_PENDING_01: "Saving...",
    COPY_ONBOARDING_ANALYZING_HEADING_01: "Analyzing your profile",
    COPY_ONBOARDING_LOADING_EYEBROW_01: "Building profile",
    COPY_ONBOARDING_LOADING_HEADLINE_01:
      "Turning your signals into weekly planning constraints",
    COPY_ONBOARDING_LOADING_MESSAGES: [
      "Analyzing focus endurance and recovery patterns",
      "Estimating usable work capacity vs scheduled time",
      "Evaluating fragmentation sensitivity",
      "Modeling task switching costs",
      "Identifying scheduling failure points",
      "Converting signals into planning constraints",
    ] as const,
    COPY_ONBOARDING_ERROR_INCOMPLETE_SUBMISSION_01: "The quiz submission was incomplete.",
    COPY_ONBOARDING_ERROR_INCOMPLETE_ANSWERS_01:
      "Please answer every question before continuing.",
    COPY_ONBOARDING_ERROR_SCORE_FAILED_01:
      "The quiz answers could not be scored. Please try again.",
    COPY_ONBOARDING_QUESTIONS: [
      {
        prompt:
          "When you’re doing demanding work, what kind of work block leads to your best output?",
        options: [
          "20-40 minute bursts",
          "45-75 minute blocks",
          "90+ minute protected sessions",
          "It depends more on how clearly the task is defined",
        ],
      },
      {
        prompt:
          "When your day is broken into short gaps, how usable are those gaps for meaningful work?",
        options: [
          "Very usable",
          "Usable for defined tasks, not demanding work",
          "Mostly not usable",
          "I lose too much time getting back into the work",
        ],
      },
      {
        prompt:
          "When you switch between different types of work in the same day, how much does it affect your output?",
        options: [
          "Not much - I adjust easily",
          "Slight slowdown, but manageable",
          "It noticeably reduces output",
          "Once I switch modes too much, the whole day gets worse",
        ],
      },
      {
        prompt:
          "When a task is open-ended or unclear, how long does it usually take you to get started?",
        options: [
          "Very little time",
          "Some time, but manageable",
          "A meaningful chunk of time",
          "Long enough that it slows down the rest of the work",
        ],
      },
      {
        prompt:
          "After several meetings, classes, or social interactions, what is your next work block usually like?",
        options: [
          "Mostly unaffected",
          "Slightly slower but still usable",
          "Noticeably worse",
          "I usually need a reset before doing demanding work",
        ],
      },
      {
        prompt:
          "After a mentally heavy block, what most reliably helps you do another demanding block later that day?",
        options: [
          "Quiet alone time (reading, scrolling, etc.)",
          "Light conversation or being around people",
          "Movement (walk, workout, stretching)",
          "None of these reliably work if the day is already overloaded",
        ],
      },
      {
        prompt:
          "When you take passive downtime (TV, scrolling, etc.), how does it affect your ability to focus afterward?",
        options: [
          "It reliably restores focus and output",
          "It improves focus somewhat",
          "It feels like a break but doesn't restore real focus",
          "It makes it harder to get back into work",
        ],
      },
      {
        prompt: "How does physical activity affect your ability to focus later in the day?",
        options: [
          "It consistently improves focus and output",
          "It helps, but only if the day isn't already overloaded",
          "It helps physically more than cognitively",
          "It doesn't meaningfully improve focus",
        ],
      },
      {
        prompt: "What is the most common reason that you fall behind on work?",
        options: [
          "I keep waiting for a better or longer block later",
          "My day looks open, but I can't use most of the time well",
          "Social or meeting-heavy time drains more than I expect",
          "It takes longer than expected to get into tasks",
        ],
      },
      {
        prompt: "When you plan your week, which of these tends to happen?",
        options: [
          "I plan based on ideal conditions and assume things will go smoothly",
          "My schedule looks reasonable, but ends up feeling more packed than expected",
          "I underestimate how long tasks will take",
          "I end up committing to more than I can actually get through",
        ],
      },
    ] as const,
  },
  profile: {
    COPY_PROFILE_REPORT_EYEBROW_01: "Work & Recovery Profile",
    COPY_PROFILE_REPORT_SECTION_HOW_YOU_WORK_01: "How you work",
    COPY_PROFILE_REPORT_SECTION_HOW_YOU_WORK_BODY_01:
      "These signals are stable across weeks. They describe the conditions that make your days feel usable or deceptively draining.",
    COPY_PROFILE_REPORT_SECTION_SUBTYPE_01: "Cognitive subtype",
    COPY_PROFILE_REPORT_SECTION_WHAT_THIS_MEANS_01: "What this means",
    COPY_PROFILE_REPORT_SECTION_KEEP_IN_MIND_01: "What to keep in mind",
    COPY_PROFILE_REPORT_SECTION_KEEP_IN_MIND_BODY_01:
      "Patterns that make a week look manageable on paper, but feel tighter in practice.",
    COPY_PROFILE_REPORT_SECTION_PLAN_AROUND_01: "How to plan",
    COPY_PROFILE_REPORT_SECTION_PLAN_AROUND_BODY_01:
      "Use these as planning defaults when deciding how much structure, setup, and protection your week needs.",
    COPY_PROFILE_REPORT_SECTION_NEXT_STEP_01: "Next step",
    COPY_PROFILE_REPORT_SECTION_NEXT_STEP_BODY_01:
      "Use this profile to interpret your dashboard, protect the right kind of time, and adjust when the week starts to tighten.",
    COPY_PROFILE_REPORT_SIGNAL_LOW_01: "Low",
    COPY_PROFILE_REPORT_SIGNAL_HIGH_01: "High",
    COPY_PROFILE_OVERVIEW_EYEBROW_01: "Your cognitive subtype",
    COPY_PROFILE_OVERVIEW_HOW_YOU_WORK_01: "How you work",
    COPY_PROFILE_OVERVIEW_EMPTY_SIGNALS_01: "No signal data available yet.",
    COPY_PROFILE_OVERVIEW_WHAT_THIS_MEANS_01: "What this means",
    COPY_PROFILE_OVERVIEW_PLAN_AROUND_01: "How to plan around it",
    signalLabels: {
      block_integrity_need: "Focus Block Need",
      fragmentation_cost: "Cost of Interruptions",
      startup_cost: "Startup Cost",
      load_sensitivity: "Overload Sensitivity",
    } as const,
    signalInterpretations: {
      block_integrity_need: {
        Low: "Demanding work is usually manageable without long, protected blocks.",
        Medium: "Protected time helps, but shorter blocks can still work.",
        High: "Demanding work happens best with protected time and minimal interruptions.",
      },
      fragmentation_cost: {
        Low: "Short gaps and interruptions are usually manageable.",
        Medium: "Some fragmented time is usable, but cleaner blocks work better.",
        High: "Broken time quickly reduces how much demanding work you can do.",
      },
      startup_cost: {
        Low: "Open-ended work becomes productive quickly once you begin.",
        Medium: "Some setup time helps before open-ended work becomes productive.",
        High: "Open-ended work often needs to be narrowed before it becomes productive.",
      },
      load_sensitivity: {
        Low: "Busier weeks are usually manageable without a sharp drop in output.",
        Medium: "Load builds gradually, so week shape matters as demands stack up.",
        High: "Dense weeks reduce output quickly, even when the calendar looks open.",
      },
    } as const,
    subtypePresentations: {
      "Protected-Block Planner": {
        description:
          "You do your best work when demanding tasks have structure, protection, and enough uninterrupted time.",
        corePattern:
          "Your week works best when deep work is protected before smaller commitments fill the space.",
        overviewLine:
          "When a work block gets interrupted, it can be hard to recover the depth that block was meant to support.",
        keepInMind: [
          "Open gaps are not always enough for demanding work.",
          "Interrupted blocks are better treated as admin, reset, or lighter work time.",
          "Vague tasks need narrowing before they deserve a protected block.",
          "Full weeks require fewer, clearer priorities.",
        ],
        planningRules: [
          "Protect clean blocks before filling the rest of the week.",
          "Define the starting point before a deep work block begins.",
          "Use fragmented or interrupted time for support tasks, not primary output.",
        ],
      },
      "Short-Cycle Executor": {
        description:
          "You keep work moving in shorter cycles when tasks are clear, concrete, and easy to resume.",
        corePattern: "Progress comes from maintaining momentum, not waiting for one perfect block.",
        overviewLine:
          "Short windows can stay useful when each task has a clear next action.",
        keepInMind: [
          "Small blocks work best when the next step is obvious.",
          "Waiting for ideal timing can create more friction than starting small.",
          "Vague work is harder to restart after interruptions.",
          "Too many unfinished tasks can quietly drain momentum.",
        ],
        planningRules: [
          "Break demanding work into clear continuation steps.",
          "Use short windows to move one concrete piece forward.",
          "Start earlier with a smaller task instead of waiting for one perfect block.",
        ],
      },
      "Context-Sensitive Worker": {
        description:
          "Your usable work time depends strongly on environment, task type, and surrounding context.",
        corePattern:
          "The same hour can support very different work depending on what comes before and after it.",
        overviewLine:
          "Your schedule works best when similar modes of work are grouped instead of scattered.",
        keepInMind: [
          "A good work block can become harder if it follows the wrong kind of demand.",
          "Frequent context changes make the day feel more expensive.",
          "Environment fit matters for whether time becomes usable.",
          "Brief resets help separate one mode from the next.",
        ],
        planningRules: [
          "Group similar work before adding more total time.",
          "Reduce unnecessary context changes across the day.",
          "Place demanding work where the surrounding context already supports it.",
        ],
      },
      "Reset-Sensitive Scheduler": {
        description:
          "You stay effective when demanding efforts are separated by real reset time.",
        corePattern:
          "Capacity depends on recovery between demands, not just open space on the calendar.",
        overviewLine:
          "The sequence of your week matters: heavy blocks can reduce what the next block can support.",
        keepInMind: [
          "Time after heavy demand may need recovery before it can support output.",
          "Low-quality recovery makes the next block less usable.",
          "Switching costs can build before they feel obvious.",
          "Dense days can reduce capacity later in the week.",
        ],
        planningRules: [
          "Leave reset space before the next demanding block.",
          "Avoid stacking high-demand tasks without recovery.",
          "Plan around recovery needs, not just open time.",
        ],
      },
      "Adaptive Generalist": {
        description:
          "You can work across different conditions without needing highly specific setup.",
        corePattern:
          "Consistency comes from staying engaged and keeping tasks scoped.",
        overviewLine:
          "Your time stays usable across varied weeks, but flexibility can turn into overcommitment if scope expands too far.",
        keepInMind: [
          "Many structures can work, but too many options can dilute priority.",
          "Engagement matters more than perfect conditions.",
          "Small windows stay useful when tasks are well-scoped.",
          "Overload can build quietly when commitments spread across the week.",
        ],
        planningRules: [
          "Use flexible windows while the week is still light.",
          "Keep tasks concrete enough to start in imperfect time.",
          "Watch scope before flexibility turns into overcommitment.",
        ],
      },
    } as const,
  },
  dashboard: {
    COPY_DASHBOARD_ANALYZE_TITLE_01: "Analyze My Week",
    COPY_DASHBOARD_ANALYZE_ACTION_01: "Run Analysis",
    COPY_DASHBOARD_ANALYZE_ACTION_02: "Re-analyze Week",
    COPY_DASHBOARD_ANALYZE_PENDING_01: "Re-analyzing",
    COPY_DASHBOARD_STATUS_LAST_ANALYZED_01: (value: string) => `Last analyzed: ${value}`,
    COPY_DASHBOARD_ACTION_CONNECT_SETTINGS_01: "Connect in Settings",
    COPY_DASHBOARD_ACTION_FINISH_LOCAL_OAUTH_01: "Finish local OAuth setup",
    COPY_DASHBOARD_ACTION_REFRESH_PROFILE_01: "Refresh profile",
    COPY_DASHBOARD_EMPTY_PROFILE_TITLE_01: "Profile needed",
    COPY_DASHBOARD_EMPTY_PROFILE_BODY_01:
      "Refresh your profile so Headroom can interpret your week alongside it.",
    COPY_DASHBOARD_EMPTY_OAUTH_TITLE_01: "Finish local Google OAuth setup",
    COPY_DASHBOARD_EMPTY_OAUTH_BODY_01:
      "Google Calendar analysis is ready in-app, but localhost OAuth credentials are still placeholders.",
    COPY_DASHBOARD_EMPTY_CONNECT_TITLE_01: "Connect Google Calendar",
    COPY_DASHBOARD_EMPTY_CONNECT_BODY_01:
      "Headroom only reads the calendars you include and only analyzes the next week.",
    COPY_DASHBOARD_EMPTY_MISSING_ACCESS_TITLE_01: "Calendar access is missing",
    COPY_DASHBOARD_EMPTY_MISSING_ACCESS_BODY_01:
      "This Google account is linked, but Headroom does not have read-only calendar access for it yet. Reconnect in Settings and approve calendar access.",
    COPY_DASHBOARD_EMPTY_PROVIDER_RESTRICTED_TITLE_01: "Calendar access is restricted",
    COPY_DASHBOARD_EMPTY_PROVIDER_RESTRICTED_BODY_01:
      "Google sign-in worked, but this account is not currently allowed to expose calendar data here. Check provider access restrictions, then reconnect.",
    COPY_DASHBOARD_EMPTY_RECONNECT_TITLE_01: "Reconnect Google Calendar",
    COPY_DASHBOARD_EMPTY_RECONNECT_BODY_01:
      "Google Calendar access expired. Reconnect Google Calendar, then run a fresh analysis.",
    COPY_DASHBOARD_EMPTY_NO_REPORT_TITLE_01: "No report yet",
    COPY_DASHBOARD_EMPTY_NO_REPORT_BODY_01:
      "Run your first fresh read of the week from the calendars you include in Settings. If a cached report exists later, the dashboard will show it until you re-analyze or it expires.",
    COPY_DASHBOARD_TRAJECTORY_EYEBROW_01: "Week trajectory",
    COPY_DASHBOARD_TRAJECTORY_TITLE_01: "How your capacity shifts across the week",
    COPY_DASHBOARD_WEEKLOAD_EYEBROW_01: "Weekly load",
    COPY_DASHBOARD_TODAY_SUPPORTS_01: "What today can support",
    COPY_DASHBOARD_DAY_LOAD_LABEL_01: (score: number) => `Load: ${score}`,
    COPY_DASHBOARD_DAY_EMPTY_01: "Hover or tap a day to see what it can realistically support.",
    COPY_DASHBOARD_LOAD_LABEL_OPEN_01: "Open",
    COPY_DASHBOARD_LOAD_LABEL_STEADY_01: "Steady",
    COPY_DASHBOARD_LOAD_LABEL_FULL_01: "Full",
    COPY_DASHBOARD_LOAD_LABEL_TIGHT_01: "Tight",
    COPY_DASHBOARD_LOAD_LABEL_STRAINED_01: "Strained",
    COPY_DASHBOARD_LOAD_INTERPRETATION_OPEN_01:
      "This week has real breathing room, and your capacity is unlikely to be limited by structure alone.",
    COPY_DASHBOARD_LOAD_INTERPRETATION_STEADY_01:
      "The week has meaningful structure, but still leaves enough margin to stay workable.",
    COPY_DASHBOARD_LOAD_INTERPRETATION_FULL_01:
      "The week is carrying real demand, but remains workable if recovery and placement stay intentional.",
    COPY_DASHBOARD_LOAD_INTERPRETATION_TIGHT_01:
      "The week has limited margin, so structure, recovery, and transitions will strongly shape how usable it feels.",
    COPY_DASHBOARD_LOAD_INTERPRETATION_STRAINED_01:
      "Demand is likely to outpace support this week, so without adjustment the schedule is likely to feel difficult.",
    COPY_DASHBOARD_PROFILE_PANEL_TITLE_01: "Through your profile lens",
    COPY_DASHBOARD_PROFILE_HEADLINE_01:
      "The biggest pressure isn’t total hours, but how much of your time is broken into less usable pieces.",
    COPY_DASHBOARD_PROFILE_HEADLINE_02:
      "Switching cost will matter almost as much as total volume this week.",
    COPY_DASHBOARD_PROFILE_HEADLINE_03:
      "The week will feel tight where demand clusters, more than from total hours alone.",
    COPY_DASHBOARD_PROFILE_DETAIL_01:
      "You tend to benefit from quieter reset, but this week leaves only a modest amount of it.",
    COPY_DASHBOARD_PROFILE_DETAIL_02:
      "You tend to benefit from active reset, and this week does give exercise a real place in the rhythm.",
    COPY_DASHBOARD_PROFILE_DETAIL_03:
      "You can use social time as real recovery, as long as it isn’t stacked too tightly.",
    COPY_DASHBOARD_MODE_TITLE_OPEN_01: "Open Capacity Day",
    COPY_DASHBOARD_MODE_MEANING_OPEN_01:
      "Use this day to make real progress and prioritize your hardest work.",
    COPY_DASHBOARD_MODE_ACTION_OPEN_01: "Place your hardest work in the clearest block.",
    COPY_DASHBOARD_MODE_ACTION_OPEN_02:
      "Keep admin and follow-through outside your best runway.",
    COPY_DASHBOARD_MODE_ACTION_OPEN_03:
      "Use the day early, before later pressure makes the week feel tighter.",
    COPY_DASHBOARD_MODE_REFRAME_OPEN_01:
      "Using this kind of day well usually makes the rest of the week easier to carry.",
    COPY_DASHBOARD_MODE_TITLE_FOLLOW_01: "Follow-Through Day",
    COPY_DASHBOARD_MODE_MEANING_FOLLOW_01:
      "Move through what is scheduled, and do not force depth between transitions.",
    COPY_DASHBOARD_MODE_ACTION_FOLLOW_01:
      "Let the schedule set the pace instead of trying to force extra depth.",
    COPY_DASHBOARD_MODE_ACTION_FOLLOW_02:
      "Use smaller openings for review, admin, setup, or completion.",
    COPY_DASHBOARD_MODE_ACTION_FOLLOW_03:
      "Protect momentum without expecting deep work from a scattered schedule.",
    COPY_DASHBOARD_MODE_REFRAME_FOLLOW_01:
      "A good Follow-Through Day keeps the week moving without fighting the structure.",
    COPY_DASHBOARD_MODE_TITLE_RECOVER_01: "Recover Day",
    COPY_DASHBOARD_MODE_MEANING_RECOVER_01:
      "Let the system reset—recovery today supports the rest of the week.",
    COPY_DASHBOARD_MODE_ACTION_RECOVER_01:
      "Let rest, exercise, care, or quieter catch-up take priority.",
    COPY_DASHBOARD_MODE_ACTION_RECOVER_02:
      "If work needs to happen, keep it concrete, bounded, and lower-stakes.",
    COPY_DASHBOARD_MODE_ACTION_RECOVER_03:
      "Treat open time as margin to protect, not pressure to fill.",
    COPY_DASHBOARD_MODE_REFRAME_RECOVER_01:
      "Protecting capacity on a Recover Day is part of the plan, not a detour from it.",
    COPY_DASHBOARD_MODE_TITLE_FRAGMENTED_01: "Fragmented Day",
    COPY_DASHBOARD_MODE_MEANING_FRAGMENTED_01:
      "Stay modular, as deep work will be harder than it looks.",
    COPY_DASHBOARD_MODE_ACTION_FRAGMENTED_01:
      "Keep tasks small, well-defined, and easy to restart between commitments.",
    COPY_DASHBOARD_MODE_ACTION_FRAGMENTED_02:
      "Save your best energy for a different day instead of forcing depth here.",
    COPY_DASHBOARD_MODE_ACTION_FRAGMENTED_03:
      "Use the day for review, prep, admin, and bounded follow-through instead.",
    COPY_DASHBOARD_MODE_REFRAME_FRAGMENTED_01:
      "This is not a depth-friendly day, even if the calendar looks open at times.",
    COPY_DASHBOARD_MODE_TITLE_PROTECTED_01: "Protected Work Day",
    COPY_DASHBOARD_MODE_MEANING_PROTECTED_01:
      "Protecting one real work block is the win.",
    COPY_DASHBOARD_MODE_ACTION_PROTECTED_01: (label: string) =>
      `Choose ${label} and decide in advance what belongs there.`,
    COPY_DASHBOARD_MODE_ACTION_PROTECTED_02:
      "Let the rest of the day absorb everything that doesn’t belong in the protected block.",
    COPY_DASHBOARD_MODE_ACTION_PROTECTED_03:
      "Keep extra demands from leaking into the one block that can still hold real work.",
    COPY_DASHBOARD_MODE_REFRAME_PROTECTED_01:
      "The goal is not to do everything today, but to keep one part of the day genuinely usable.",
    COPY_DASHBOARD_INTERVENTIONS_TITLE_01: "What to adjust",
    COPY_DASHBOARD_INTERVENTION_LABEL_01: "Main adjustment",
    COPY_DASHBOARD_INTERVENTION_LABEL_02: "What to protect",
    COPY_DASHBOARD_INTERVENTION_LABEL_03: "What to add",
    COPY_DASHBOARD_INTERVENTION_LABEL_04: "Place carefully",
    COPY_DASHBOARD_PATTERN_TITLE_COMPRESSION_01: "Compression",
    COPY_DASHBOARD_PATTERN_TEXT_COMPRESSION_01:
      "Too much demand is landing in one stretch, so margin may drop faster than total hours suggest.",
    COPY_DASHBOARD_PATTERN_TITLE_FALSE_OPENNESS_01: "False openness",
    COPY_DASHBOARD_PATTERN_TEXT_FALSE_OPENNESS_01:
      "Some open-looking gaps are broken enough that they may not function as real work time.",
    COPY_DASHBOARD_PATTERN_TEXT_FALSE_OPENNESS_02:
      "Some open-looking gaps may behave more like overflow space than real margin.",
    COPY_DASHBOARD_PATTERN_TITLE_RECOVERY_MISMATCH_01: "Recovery mismatch",
    COPY_DASHBOARD_PATTERN_TEXT_RECOVERY_MISMATCH_01:
      "Quiet reset is limited this week, so recovery may need more deliberate protection.",
    COPY_DASHBOARD_PATTERN_TEXT_RECOVERY_MISMATCH_02:
      "Physical reset is limited this week, so support may feel thinner than the calendar shows.",
    COPY_DASHBOARD_PATTERN_TEXT_RECOVERY_MISMATCH_03:
      "Recovery is light or uneven, so effort may build as demands stack up.",
    COPY_DASHBOARD_PATTERN_TITLE_TRANSITION_01: "Transition overload",
    COPY_DASHBOARD_PATTERN_TEXT_TRANSITION_01:
      "There are enough mode switches that changing gears may carry a real capacity cost.",
    COPY_DASHBOARD_PATTERN_TEXT_TRANSITION_02:
      "The schedule asks for a lot of switching, making open time less stable.",
    COPY_DASHBOARD_PATTERN_TITLE_FATIGUE_01: "Fatigue accumulation",
    COPY_DASHBOARD_PATTERN_TEXT_FATIGUE_01:
      "A dense stretch without enough recovery afterward may wear on you progressively.",
    COPY_DASHBOARD_PATTERN_TITLE_SOCIAL_DENSE_01: "Socially dense",
    COPY_DASHBOARD_PATTERN_TEXT_SOCIAL_DENSE_01:
      "Social time can restore you, but only if it is not pressed tightly against heavy commitments.",
    COPY_DASHBOARD_PATTERN_TEXT_SOCIAL_DENSE_02:
      "Social time is prominent enough to shape the week, and may function more like demand than relief.",
    COPY_DASHBOARD_RECOVERY_TITLE_01: "Recovery Islands",
    COPY_DASHBOARD_RECOVERY_PROFILE_TITLE_01: "Through your profile lens",
    COPY_DASHBOARD_RECOVERY_STAT_TITLE_01: "Scheduled recovery",
    COPY_DASHBOARD_RECOVERY_STAT_SUBTITLE_01: "across the week",
    COPY_DASHBOARD_RECOVERY_STAT_TITLE_02: "Most restorative day",
    COPY_DASHBOARD_RECOVERY_STAT_EMPTY_01: "None yet",
    COPY_DASHBOARD_RECOVERY_STAT_EMPTY_02: "No visible islands",
    COPY_DASHBOARD_RECOVERY_FOOTNOTE_01:
      "These are islands, not quotas. Small moments add up.",
    COPY_DASHBOARD_RECOVERY_SUMMARY_01:
      "Recovery is barely visible this week, so reset will need deliberate protection.",
    COPY_DASHBOARD_RECOVERY_SUMMARY_02: (topDays: string) =>
      `Recovery is visible across the week, with the clearest support around ${topDays}.`,
    COPY_DASHBOARD_RECOVERY_SUMMARY_03: (topDays: string) =>
      `Recovery is visible, but clusters around ${topDays}.`,
    COPY_DASHBOARD_RECOVERY_SUPPORTING_01:
      "There is not enough visible support for a detailed read, so assume recovery needs deliberate placement.",
    COPY_DASHBOARD_RECOVERY_SUPPORTING_02: (label: string) =>
      `Most scheduled support appears as ${label.toLowerCase()}, with smaller pockets elsewhere.`,
    COPY_DASHBOARD_RECOVERY_PROFILE_BEST_01:
      "Best with: movement before or after tighter stretches.",
    COPY_DASHBOARD_RECOVERY_PROFILE_BEST_02:
      "Best with: buffered social support that still feels restorative.",
    COPY_DASHBOARD_RECOVERY_PROFILE_BEST_03:
      "Best with: longer quiet blocks and slower transitions.",
    COPY_DASHBOARD_RECOVERY_PROFILE_VISIBLE_01: "Already visible: recovery is fairly light.",
    COPY_DASHBOARD_RECOVERY_PROFILE_VISIBLE_02:
      "Already visible: movement is showing up at useful points in the week.",
    COPY_DASHBOARD_RECOVERY_PROFILE_VISIBLE_03:
      "Already visible: meals and care routines are giving the week some structure.",
    COPY_DASHBOARD_RECOVERY_PROFILE_VISIBLE_04:
      "Already visible: explicit rest appears in a few useful pockets.",
    COPY_DASHBOARD_RECOVERY_PROFILE_VISIBLE_05:
      "Already visible: social support is part of the recovery picture this week.",
    COPY_DASHBOARD_RECOVERY_PROFILE_PRIORITY_01:
      "Prioritize: protecting one or two recovery blocks.",
    COPY_DASHBOARD_RECOVERY_PROFILE_PRIORITY_02:
      "Prioritize: movement near the tighter stretches.",
    COPY_DASHBOARD_RECOVERY_PROFILE_PRIORITY_03:
      "Prioritize: buffered social support that does not create extra switching.",
    COPY_DASHBOARD_RECOVERY_PROFILE_PRIORITY_04:
      "Prioritize: meals/care or explicit rest before tighter stretches.",
    COPY_DASHBOARD_RECOVERY_PROFILE_PRIORITY_05:
      "Prioritize: keeping the recovery that is already visible intact.",
    COPY_DASHBOARD_RECOVERY_MODE_LABEL_01: "Movement",
    COPY_DASHBOARD_RECOVERY_MODE_LABEL_02: "Social support",
    COPY_DASHBOARD_RECOVERY_MODE_LABEL_03: "Meals / care",
    COPY_DASHBOARD_RECOVERY_MODE_LABEL_04: "Explicit rest",
    COPY_DASHBOARD_RECOVERY_PILL_LABEL_EXERCISE_01: "Movement block",
    COPY_DASHBOARD_RECOVERY_PILL_LABEL_SOCIAL_01: "Social support",
    COPY_DASHBOARD_RECOVERY_PILL_LABEL_CARE_01: "Meals / care",
    COPY_DASHBOARD_RECOVERY_PILL_LABEL_REST_01: "Explicit rest",
    COPY_DASHBOARD_RECOVERY_TIME_BUCKET_MORNING_01: "Morning",
    COPY_DASHBOARD_RECOVERY_TIME_BUCKET_AFTERNOON_01: "Afternoon",
    COPY_DASHBOARD_RECOVERY_TIME_BUCKET_EVENING_01: "Evening",
    COPY_DASHBOARD_RECOVERY_TIMELINE_TIME_01: "7 AM",
    COPY_DASHBOARD_RECOVERY_TIMELINE_TIME_02: "12 PM",
    COPY_DASHBOARD_RECOVERY_TIMELINE_TIME_03: "6 PM",
    COPY_DASHBOARD_RECOVERY_TIMELINE_TIME_04: "11 PM",
    COPY_DASHBOARD_RECOVERY_LEGEND_LABEL_01: "Exercise",
    COPY_DASHBOARD_RECOVERY_LEGEND_LABEL_02: "Social support",
    COPY_DASHBOARD_RECOVERY_LEGEND_LABEL_03: "Meals / care",
    COPY_DASHBOARD_RECOVERY_LEGEND_LABEL_04: "Explicit rest",
    COPY_DASHBOARD_RECOVERY_LEGEND_BODY_01: "Movement that helps you reset.",
    COPY_DASHBOARD_RECOVERY_LEGEND_BODY_02: "Connection that restores perspective.",
    COPY_DASHBOARD_RECOVERY_LEGEND_BODY_03:
      "Meals and care routines that support recovery.",
    COPY_DASHBOARD_RECOVERY_LEGEND_BODY_04: "Planned rest that protects your capacity.",
    COPY_DASHBOARD_COMPOSITION_TITLE_01: "How your week is allocated",
    COPY_DASHBOARD_COMPOSITION_BAR_LABEL_01: "Work & class",
    COPY_DASHBOARD_COMPOSITION_BAR_LABEL_02: "Meetings & commitments",
    COPY_DASHBOARD_COMPOSITION_BAR_LABEL_03: "Social time",
    COPY_DASHBOARD_COMPOSITION_BAR_LABEL_04: "Recovery & solo time",
    COPY_DASHBOARD_COMPOSITION_OPEN_CAPACITY_01: (hours: string) =>
      `Unallocated time: ${hours} this week`,
    COPY_DASHBOARD_SPARSE_OBSERVATION_01:
      "The next seven days are lightly scheduled across the included calendars, so this is a lower-confidence read.",
    COPY_DASHBOARD_SPARSE_OBSERVATION_02:
      "Most of the week is unclaimed, so your own planning will shape it.",
    COPY_DASHBOARD_SPARSE_OBSERVATION_03: (minutes: number) =>
      `If you want clean progress, protect one ${minutes}-minute block before smaller plans fill the week.`,
    COPY_DASHBOARD_SPARSE_SUGGESTION_01: (minutes: number) =>
      `Protect one ${minutes}-minute block early for your most demanding work.`,
    COPY_DASHBOARD_SPARSE_SUGGESTION_02:
      "Use the lighter schedule to decide in advance which open time is for focus and which is for recovery or admin.",
  },
  settings: {
    COPY_SETTINGS_GOOGLE_TITLE_01: "Google Calendar",
    COPY_SETTINGS_GOOGLE_EYEBROW_01: "Integration",
    COPY_SETTINGS_GOOGLE_DESC_01:
      "Read-only access to selected calendars for the next 7 days.",
    COPY_SETTINGS_GOOGLE_STATE_RESET_01:
      "Local Google account state was cleared. Reconnect Google Calendar to create one clean account row.",
    COPY_SETTINGS_GOOGLE_LINKED_01:
      "Google Calendar connected. Your saved profile is still in place, and your dashboard is ready for week analysis.",
    COPY_SETTINGS_GOOGLE_CALENDARS_SAVED_01:
      "Included calendars updated. Re-analyze your week when you want a fresh read from the new set.",
    COPY_SETTINGS_GOOGLE_STATUS_CONNECTED_01: "Connected and ready",
    COPY_SETTINGS_GOOGLE_STATUS_RECONNECT_01: "Reconnect needed",
    COPY_SETTINGS_GOOGLE_STATUS_MISSING_ACCESS_01: "Calendar access missing",
    COPY_SETTINGS_GOOGLE_STATUS_PROVIDER_RESTRICTED_01: "Provider access restricted",
    COPY_SETTINGS_GOOGLE_STATUS_NOT_CONNECTED_01: "Not connected",
    COPY_SETTINGS_GOOGLE_STATUS_NEXT7_01: "Next 7 days",
    COPY_SETTINGS_GOOGLE_BODY_01:
      "Headroom only reads the calendars you include here. It analyzes the next 7 days and stores categories and insights — not raw event names.",
    COPY_SETTINGS_GOOGLE_CONNECT_DISABLED_01: "Connect Google Calendar",
    COPY_SETTINGS_GOOGLE_DISCONNECT_01: "Disconnect",
    COPY_SETTINGS_GOOGLE_OPEN_DASHBOARD_01: "Open dashboard",
    COPY_SETTINGS_GOOGLE_SELECTION_TITLE_01: "Calendars included in analysis",
    COPY_SETTINGS_GOOGLE_SELECTION_EYEBROW_01: "Source selection",
    COPY_SETTINGS_GOOGLE_SELECTION_DESC_01:
      "Choose which readable Google calendars Headroom should merge into the weekly read.",
    COPY_SETTINGS_GOOGLE_CALENDAR_PRIMARY_01: "Primary calendar",
    COPY_SETTINGS_GOOGLE_CALENDAR_OWNED_01: "Owned calendar",
    COPY_SETTINGS_GOOGLE_CALENDAR_SHARED_01: "Shared readable calendar",
    COPY_SETTINGS_GOOGLE_SELECTION_HELPER_01:
      "If you change the included calendars, Headroom clears the current cached report so the next analysis reflects the new source set.",
    COPY_SETTINGS_GOOGLE_SELECTION_SAVE_01: "Save included calendars",
    COPY_SETTINGS_GOOGLE_SELECTION_EMPTY_01:
      "Connect Google Calendar with read-only access before choosing which calendars are included in the weekly analysis.",
    COPY_SETTINGS_PROFILE_TITLE_01: "Work & Recovery Profile",
    COPY_SETTINGS_PROFILE_EYEBROW_01: "Saved profile",
    COPY_SETTINGS_PROFILE_DESC_01: "A quick read of how the planner sees your week.",
    COPY_SETTINGS_PROFILE_SAVED_BADGE_01: "Profile saved",
    COPY_SETTINGS_PROFILE_ACTION_01: "Retake quiz",
    COPY_SETTINGS_PROFILE_EMPTY_01: "Complete the onboarding quiz to create your first profile.",
    COPY_SETTINGS_GOOGLE_COPY_CONNECTED_FRESH_01:
      "Your calendar is connected and this week is already analyzed.",
    COPY_SETTINGS_GOOGLE_COPY_CONNECTED_NEEDS_ANALYSIS_01:
      "Google Calendar is connected. Your next step is to analyze the current week.",
    COPY_SETTINGS_GOOGLE_COPY_RECONNECT_01:
      "Google Calendar access expired. Reconnect Google Calendar.",
    COPY_SETTINGS_GOOGLE_COPY_MISSING_ACCESS_01:
      "This Google account is linked, but it does not currently include read-only calendar access.",
    COPY_SETTINGS_GOOGLE_COPY_PROVIDER_RESTRICTED_01:
      "Google sign-in succeeded, but this account cannot currently expose calendar data to Headroom.",
    COPY_SETTINGS_GOOGLE_COPY_NOT_CONNECTED_01:
      "Connect Google Calendar to analyze the next seven days through your profile.",
    COPY_SETTINGS_GOOGLE_NEXTSTEP_CONNECTED_FRESH_01:
      "You can re-analyze any time.",
    COPY_SETTINGS_GOOGLE_NEXTSTEP_CONNECTED_NEEDS_ANALYSIS_01:
      "Analyze your week from the Dashboard.",
    COPY_SETTINGS_GOOGLE_NEXTSTEP_PROVIDER_RESTRICTED_01:
      "Review account access restrictions, then reconnect.",
    COPY_SETTINGS_GOOGLE_NEXTSTEP_MISSING_ACCESS_01:
      "Reconnect Google Calendar and approve read-only calendar access.",
    COPY_SETTINGS_GOOGLE_NEXTSTEP_RECONNECT_01:
      "Reconnect Google Calendar, then run a fresh analysis.",
    COPY_SETTINGS_GOOGLE_NEXTSTEP_NOT_CONNECTED_01: "Connect Google Calendar to get started.",
    COPY_SETTINGS_GOOGLE_PRIMARY_ACTION_CONNECT_01: "Connect Google Calendar",
    COPY_SETTINGS_GOOGLE_PRIMARY_ACTION_RECONNECT_01: "Reconnect Google Calendar",
    COPY_SETTINGS_GOOGLE_OAUTH_NOT_CONFIGURED_01:
      "Local Google OAuth is not configured yet. Add a real localhost Google client ID and secret in .env.local, then restart the dev server.",
    COPY_SETTINGS_CALSUMMARY_NONE_LABEL_01: "No calendars selected",
    COPY_SETTINGS_CALSUMMARY_NONE_DETAIL_01:
      "Choose which calendars Headroom should include in analysis.",
    COPY_SETTINGS_CALSUMMARY_ONE_LABEL_01: "1 calendar included",
    COPY_SETTINGS_CALSUMMARY_ONE_DETAIL_01: "Primary calendar included",
    COPY_SETTINGS_CALSUMMARY_ONE_DETAIL_02: "One calendar included",
    COPY_SETTINGS_CALSUMMARY_MULTI_DETAIL_01: "Multiple calendars included",
  },
  history: {
    COPY_HISTORY_EYEBROW_01: "Week to week",
    COPY_HISTORY_TITLE_01: "Compare how your weeks are carrying",
    COPY_HISTORY_BODY_01:
      "Headroom keeps a lightweight summary of prior analyzed weeks so you can compare load, openness, and planning conditions over time without storing raw event names.",
    COPY_HISTORY_EMPTY_TITLE_01: "No history yet",
    COPY_HISTORY_EMPTY_BODY_01:
      "No previous weekly analysis exists yet. Come back in seven days to review how your planning compares week to week.",
    COPY_HISTORY_LOADLABEL_HEAVY_01: "Heavy",
    COPY_HISTORY_LOADLABEL_TIGHT_01: "Tight",
    COPY_HISTORY_LOADLABEL_BALANCED_01: "Balanced",
    COPY_HISTORY_SAVED_AT_01: (value: string) => `Saved ${value}`,
    COPY_HISTORY_LOAD_BADGE_01: (score: number) => `${score}/100 load`,
    COPY_HISTORY_COMMITTED_BADGE_01: (hours: string) => `${hours} committed`,
    COPY_HISTORY_OPEN_BADGE_01: (hours: string) => `${hours} open`,
    COPY_HISTORY_STOOD_OUT_01: "What stood out",
    COPY_HISTORY_SNAPSHOT_01: "Snapshot",
    COPY_HISTORY_SNAPSHOT_WORK_01: (hours: string) => `Work / class: ${hours}`,
    COPY_HISTORY_SNAPSHOT_MEETINGS_01: (hours: string) => `Meetings / structured: ${hours}`,
    COPY_HISTORY_SNAPSHOT_RECOVERY_01: (hours: string) => `Recovery / solo: ${hours}`,
    COPY_HISTORY_SNAPSHOT_SOCIAL_01: (hours: string) => `Social: ${hours}`,
    COPY_HISTORY_COMPARISON_EARLIEST_01: "This is the earliest saved week in your history so far.",
    COPY_HISTORY_COMPARISON_LOAD_UP_01: "The overall load climbed noticeably from the week before.",
    COPY_HISTORY_COMPARISON_LOAD_DOWN_01:
      "The overall load eased meaningfully from the week before.",
    COPY_HISTORY_COMPARISON_LOAD_STEADY_01:
      "The overall load stayed fairly close to the week before.",
    COPY_HISTORY_COMPARISON_COMMITTED_UP_01: (hours: string) =>
      `Committed time rose by about ${hours}.`,
    COPY_HISTORY_COMPARISON_COMMITTED_DOWN_01: (hours: string) =>
      `Committed time fell by about ${hours}.`,
    COPY_HISTORY_COMPARISON_COMMITTED_STEADY_01: "Committed time stayed in a similar range.",
    COPY_HISTORY_COMPARISON_OPEN_UP_01: (hours: string) =>
      `Open time expanded by about ${hours}.`,
    COPY_HISTORY_COMPARISON_OPEN_DOWN_01: (hours: string) =>
      `Open time narrowed by about ${hours}.`,
    COPY_HISTORY_COMPARISON_OPEN_STEADY_01: "Open time stayed broadly similar.",
  },
} as const;
