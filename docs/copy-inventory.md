# Headroom Copy Inventory

This document inventories visible user-facing copy currently implemented in the site. Each item has a stable ID intended for future copy revisions. Update by ID only.

Format:
- **Route**: where the copy appears
- **Component/File**: source location
- **Type**: `Static` or `Conditional/Adaptive`
- **Condition**: when the copy appears
- **Variables**: runtime values interpolated into the string
- **Notes**: placement and state context

---

## Shared Shell and Global UI

### Route group: shared across authenticated app pages

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_SHARED_APPNAME_01 | `src/components/app-shell.tsx` | `Headroom` | Static | Always in authenticated shell header | None | Shared header on dashboard, history, profile, settings, tasks |
| COPY_SHARED_NAV_DASHBOARD_01 | `src/components/app-shell.tsx` | `Dashboard` | Static | Always in nav | None | Shared nav |
| COPY_SHARED_NAV_HISTORY_01 | `src/components/app-shell.tsx` | `History` | Static | Always in nav | None | Shared nav |
| COPY_SHARED_NAV_PROFILE_01 | `src/components/app-shell.tsx` | `Profile` | Static | Always in nav | None | Shared nav |
| COPY_SHARED_NAV_SETTINGS_01 | `src/components/app-shell.tsx` | `Settings` | Static | Always in nav | None | Shared nav |
| COPY_SHARED_SIGNED_IN_01 | `src/components/app-shell.tsx` | `Signed in` | Static | Always when user shell renders | None | Shared user-status line |
| COPY_SHARED_FALLBACK_USERNAME_01 | `src/components/app-shell.tsx` | `Student planner` | Conditional/Adaptive | Appears when `userName` is missing | `userName` | Shared fallback user label |
| COPY_SHARED_AUTH_SIGNOUT_01 | `src/components/auth-button.tsx` | `Sign out` | Conditional/Adaptive | Appears when `mode="signout"` and no custom label is supplied | `label` | Shared shell action |
| COPY_SHARED_AUTH_SIGNIN_GOOGLE_01 | `src/components/auth-button.tsx` | `Continue with Google` | Conditional/Adaptive | Appears when `mode="signin"` and `provider="google"` and no custom label is supplied | `label`, `provider` | Landing CTA variant |
| COPY_SHARED_AUTH_SIGNIN_DEMO_01 | `src/components/auth-button.tsx` | `Start assessment` | Conditional/Adaptive | Appears when `mode="signin"` and `provider="demo"` and no custom label is supplied | `label`, `provider` | Landing CTA variant |
| COPY_SHARED_STATUS_CONNECTED_01 | `src/components/status-pill.tsx` usage across pages | `Connected` | Conditional/Adaptive | Dashboard Google status when connected | None | Dashboard integration state |
| COPY_SHARED_STATUS_RECONNECT_01 | `src/components/status-pill.tsx` usage across pages | `Reconnect needed` | Conditional/Adaptive | Dashboard/Settings Google status when reconnect required | None | Dashboard and settings integration state |
| COPY_SHARED_STATUS_MISSING_ACCESS_01 | `src/components/status-pill.tsx` usage across pages | `Calendar access missing` | Conditional/Adaptive | Dashboard/Settings Google status when scope missing | None | Dashboard and settings integration state |
| COPY_SHARED_STATUS_PROVIDER_RESTRICTED_01 | `src/components/status-pill.tsx` usage across pages | `Provider access restricted` | Conditional/Adaptive | Dashboard/Settings Google status when provider restriction is surfaced | None | Dashboard and settings integration state |
| COPY_SHARED_STATUS_NOT_CONNECTED_01 | `src/components/status-pill.tsx` usage across pages | `Not connected` | Conditional/Adaptive | Dashboard/Settings Google status when no usable connection exists | None | Dashboard and settings integration state |

---

## Landing Page

### Route: `/`

#### Component: `src/app/page.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_LANDING_HEADER_HEADLINE_01 | `src/app/page.tsx` | `Plan your week with you in mind` | Static | Always | None | Top header card |
| COPY_LANDING_HERO_HEADLINE_01 | `src/app/page.tsx` | `Plan your week around your cognitive profile.` | Static | Always | None | Main hero headline |
| COPY_LANDING_HERO_BODY_01 | `src/app/page.tsx` | `Headroom reads your calendar and workload through your cognitive profile to identify better work windows, recovery periods, and daily overload risk.` | Static | Always | None | Main hero body |
| COPY_LANDING_REPORT_EYEBROW_01 | `src/app/page.tsx` | `Weekly cognitive load report` | Static | Always | None | Marketing mock card |
| COPY_LANDING_REPORT_HEADLINE_01 | `src/app/page.tsx` | `Thursday looks tight for deep work.` | Static | Always | None | Marketing mock card |
| COPY_LANDING_REPORT_BADGE_01 | `src/app/page.tsx` | `74 / 100 overload risk` | Static | Always | None | Marketing mock card |
| COPY_LANDING_REPORT_METRIC_LABEL_01 | `src/app/page.tsx` | `Protected focus time` | Static | Always | None | Marketing mock card |
| COPY_LANDING_REPORT_METRIC_VALUE_01 | `src/app/page.tsx` | `4.5 hours` | Static | Always | None | Marketing mock card |
| COPY_LANDING_REPORT_METRIC_LABEL_02 | `src/app/page.tsx` | `Recovery blocks` | Static | Always | None | Marketing mock card |
| COPY_LANDING_REPORT_METRIC_VALUE_02 | `src/app/page.tsx` | `2` | Static | Always | None | Marketing mock card |
| COPY_LANDING_REPORT_METRIC_LABEL_03 | `src/app/page.tsx` | `Major deadlines` | Static | Always | None | Marketing mock card |
| COPY_LANDING_REPORT_METRIC_VALUE_03 | `src/app/page.tsx` | `3` | Static | Always | None | Marketing mock card |
| COPY_LANDING_SIGNAL_EYEBROW_01 | `src/app/page.tsx` | `Planning signal` | Static | Always | None | Marketing mock card |
| COPY_LANDING_SIGNAL_HEADLINE_01 | `src/app/page.tsx` | `Start your lab report Tuesday at 1:30 PM.` | Static | Always | None | Marketing mock card |
| COPY_LANDING_SIGNAL_BODY_01 | `src/app/page.tsx` | `Based on a 95-minute uninterrupted block, earlier ambiguity protection, and the fact that later windows are more fragmented.` | Static | Always | None | Marketing mock card |
| COPY_LANDING_FEATURES_HEADLINE_01 | `src/app/page.tsx` | `Understand your cognitive profile, map your week to it, and allocate work with intention.` | Static | Always | None | Feature section intro |
| COPY_LANDING_FEATURE_CARD_TITLE_01 | `src/app/page.tsx` | `1. Identify your cognitive subtype` | Static | Always | None | Feature card |
| COPY_LANDING_FEATURE_CARD_BODY_01 | `src/app/page.tsx` | `Take a short assessment of focus, overload, and recovery patterns.` | Static | Always | None | Feature card |
| COPY_LANDING_FEATURE_CARD_TITLE_02 | `src/app/page.tsx` | `2. Align your schedule with your profile` | Static | Always | None | Feature card |
| COPY_LANDING_FEATURE_CARD_BODY_02 | `src/app/page.tsx` | `See your week through your subtype.` | Static | Always | None | Feature card |
| COPY_LANDING_FEATURE_CARD_TITLE_03 | `src/app/page.tsx` | `3. Plan your weeks intelligently` | Static | Always | None | Feature card |
| COPY_LANDING_FEATURE_CARD_BODY_03 | `src/app/page.tsx` | `Find deep-work windows and overload warnings before they hit you` | Static | Always | None | Feature card |
| COPY_LANDING_INPUTS_HEADLINE_01 | `src/app/page.tsx` | `Four inputs shape how Headroom reads each week.` | Static | Always | None | Inputs section |
| COPY_LANDING_INPUT_LABEL_01 | `src/app/page.tsx` | `Work & Recovery Profile` | Static | Always | None | Inputs section |
| COPY_LANDING_INPUT_LABEL_02 | `src/app/page.tsx` | `Calendar Structure` | Static | Always | None | Inputs section |
| COPY_LANDING_INPUT_LABEL_03 | `src/app/page.tsx` | `Task Demands` | Static | Always | None | Inputs section |
| COPY_LANDING_INPUT_LABEL_04 | `src/app/page.tsx` | `Quality and Duration of Recovery Blocks` | Static | Always | None | Inputs section |

#### Adaptive auth CTA source: `src/lib/auth.ts` + `src/components/auth-button.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_LANDING_CTA_DEMO_01 | `src/lib/auth.ts` | `Start assessment` | Conditional/Adaptive | Landing CTA when local demo auth mode is active | `effectiveProvider` | Landing-only auth mode |
| COPY_LANDING_CTA_GOOGLE_01 | `src/lib/auth.ts` | `Continue with Google` | Conditional/Adaptive | Landing CTA when Google auth mode is active | `effectiveProvider` | Landing-only auth mode |

---

## Onboarding

### Route: `/onboarding` (no saved profile, or edit mode)

#### Component: `src/app/onboarding/page.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_ONBOARDING_BRAND_01 | `src/app/onboarding/page.tsx` | `Headroom` | Static | On quiz view | None | Top banner |
| COPY_ONBOARDING_HERO_HEADLINE_01 | `src/app/onboarding/page.tsx` | `Get your personalized cognitive profile` | Static | On quiz view | None | Onboarding hero |
| COPY_ONBOARDING_HERO_BODY_01 | `src/app/onboarding/page.tsx` | `Answer a few quick questions to personalize your planning.` | Static | On quiz view | None | Onboarding hero |
| COPY_ONBOARDING_SAVED_BADGE_01 | `src/app/onboarding/page.tsx` | `Profile saved` | Conditional/Adaptive | Appears when `complete=1` and saved profile exists | None | Saved-profile state |
| COPY_ONBOARDING_PROFILE_ACTION_01 | `src/app/onboarding/page.tsx` | `Open dashboard` | Static | Saved profile view | None | Profile report action |
| COPY_ONBOARDING_PROFILE_ACTION_02 | `src/app/onboarding/page.tsx` | `Open settings` | Static | Saved profile view | None | Profile report action |

| COPY_ONBOARDING_PROFILE_ACTION_04 | `src/app/onboarding/page.tsx` | `Retake assessment` | Static | Saved profile view | None | Profile report action |

#### Component: `src/components/onboarding-quiz.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_ONBOARDING_PROGRESS_LABEL_01 | `src/components/onboarding-quiz.tsx` | `Question {step + 1} of {quizQuestions.length}` | Conditional/Adaptive | Always on quiz | `step`, `quizQuestions.length` | Top progress label |
| COPY_ONBOARDING_PROGRESS_PILL_01 | `src/components/onboarding-quiz.tsx` | `{step + 1} / {quizQuestions.length}` | Conditional/Adaptive | Always on quiz | `step`, `quizQuestions.length` | Progress pill |
| COPY_ONBOARDING_HELPER_01 | `src/components/onboarding-quiz.tsx` | `Responses inform your planning profile.` | Static | Always on quiz | None | Footer helper |
| COPY_ONBOARDING_BACK_01 | `src/components/onboarding-quiz.tsx` | `Back` | Static | Always on quiz | None | Navigation button |
| COPY_ONBOARDING_SAVE_IDLE_01 | `src/components/onboarding-quiz.tsx` | `Save profile` | Conditional/Adaptive | Final step submit label when not pending | None | Submit button |
| COPY_ONBOARDING_SAVE_PENDING_01 | `src/components/onboarding-quiz.tsx` | `Saving...` | Conditional/Adaptive | Final step submit label when pending | None | Submit button |

#### Adaptive quiz question set: `src/lib/profile-model.ts`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_ONBOARDING_Q1_PROMPT_01 | `src/lib/profile-model.ts` | `When you’re doing demanding work, what kind of work block leads to your best output?` | Static | Always on question 1 | None | Onboarding question |
| COPY_ONBOARDING_Q1_OPTION_A_01 | `src/lib/profile-model.ts` | `20-40 minute bursts` | Static | Question 1 option A | None | Visible option label |
| COPY_ONBOARDING_Q1_OPTION_B_01 | `src/lib/profile-model.ts` | `45-75 minute blocks` | Static | Question 1 option B | None | Visible option label |
| COPY_ONBOARDING_Q1_OPTION_C_01 | `src/lib/profile-model.ts` | `90+ minute protected sessions` | Static | Question 1 option C | None | Visible option label |
| COPY_ONBOARDING_Q1_OPTION_D_01 | `src/lib/profile-model.ts` | `It depends more on how clearly the task is defined` | Static | Question 1 option D | None | Visible option label |
| COPY_ONBOARDING_Q2_PROMPT_01 | `src/lib/profile-model.ts` | `When your day is broken into short gaps, how usable are those gaps for meaningful work?` | Static | Always on question 2 | None | Onboarding question |
| COPY_ONBOARDING_Q2_OPTION_A_01 | `src/lib/profile-model.ts` | `Very usable` | Static | Question 2 option A | None | Visible option label |
| COPY_ONBOARDING_Q2_OPTION_B_01 | `src/lib/profile-model.ts` | `Usable for defined tasks, not demanding work` | Static | Question 2 option B | None | Visible option label |
| COPY_ONBOARDING_Q2_OPTION_C_01 | `src/lib/profile-model.ts` | `Mostly not usable` | Static | Question 2 option C | None | Visible option label |
| COPY_ONBOARDING_Q2_OPTION_D_01 | `src/lib/profile-model.ts` | `I lose too much time getting back into the work` | Static | Question 2 option D | None | Visible option label |
| COPY_ONBOARDING_Q3_PROMPT_01 | `src/lib/profile-model.ts` | `When you switch between different types of work in the same day, how much does it affect your output?` | Static | Always on question 3 | None | Onboarding question |
| COPY_ONBOARDING_Q3_OPTION_A_01 | `src/lib/profile-model.ts` | `Not much - I adjust easily` | Static | Question 3 option A | None | Visible option label |
| COPY_ONBOARDING_Q3_OPTION_B_01 | `src/lib/profile-model.ts` | `Slight slowdown, but manageable` | Static | Question 3 option B | None | Visible option label |
| COPY_ONBOARDING_Q3_OPTION_C_01 | `src/lib/profile-model.ts` | `It noticeably reduces output` | Static | Question 3 option C | None | Visible option label |
| COPY_ONBOARDING_Q3_OPTION_D_01 | `src/lib/profile-model.ts` | `Once I switch modes too much, the whole day gets worse` | Static | Question 3 option D | None | Visible option label |
| COPY_ONBOARDING_Q4_PROMPT_01 | `src/lib/profile-model.ts` | `When a task is open-ended or unclear, how long does it usually take you to get started?` | Static | Always on question 4 | None | Onboarding question |
| COPY_ONBOARDING_Q4_OPTION_A_01 | `src/lib/profile-model.ts` | `Very little time` | Static | Question 4 option A | None | Visible option label |
| COPY_ONBOARDING_Q4_OPTION_B_01 | `src/lib/profile-model.ts` | `Some time, but manageable` | Static | Question 4 option B | None | Visible option label |
| COPY_ONBOARDING_Q4_OPTION_C_01 | `src/lib/profile-model.ts` | `A meaningful chunk of time` | Static | Question 4 option C | None | Visible option label |
| COPY_ONBOARDING_Q4_OPTION_D_01 | `src/lib/profile-model.ts` | `Long enough that it slows down the rest of the work` | Static | Question 4 option D | None | Visible option label |
| COPY_ONBOARDING_Q5_PROMPT_01 | `src/lib/profile-model.ts` | `After several meetings, classes, or social interactions, what is your next work block usually like?` | Static | Always on question 5 | None | Onboarding question |
| COPY_ONBOARDING_Q5_OPTION_A_01 | `src/lib/profile-model.ts` | `Mostly unaffected` | Static | Question 5 option A | None | Visible option label |
| COPY_ONBOARDING_Q5_OPTION_B_01 | `src/lib/profile-model.ts` | `Slightly slower but still usable` | Static | Question 5 option B | None | Visible option label |
| COPY_ONBOARDING_Q5_OPTION_C_01 | `src/lib/profile-model.ts` | `Noticeably worse` | Static | Question 5 option C | None | Visible option label |
| COPY_ONBOARDING_Q5_OPTION_D_01 | `src/lib/profile-model.ts` | `I usually need a reset before doing demanding work` | Static | Question 5 option D | None | Visible option label |
| COPY_ONBOARDING_Q6_PROMPT_01 | `src/lib/profile-model.ts` | `After a mentally heavy block, what most reliably helps you do another demanding block later that day?` | Static | Always on question 6 | None | Onboarding question |
| COPY_ONBOARDING_Q6_OPTION_A_01 | `src/lib/profile-model.ts` | `Quiet alone time (reading, scrolling, etc.)` | Static | Question 6 option A | None | Visible option label |
| COPY_ONBOARDING_Q6_OPTION_B_01 | `src/lib/profile-model.ts` | `Light conversation or being around people` | Static | Question 6 option B | None | Visible option label |
| COPY_ONBOARDING_Q6_OPTION_C_01 | `src/lib/profile-model.ts` | `Movement (walk, workout, stretching)` | Static | Question 6 option C | None | Visible option label |
| COPY_ONBOARDING_Q6_OPTION_D_01 | `src/lib/profile-model.ts` | `None of these reliably work if the day is already overloaded` | Static | Question 6 option D | None | Visible option label |
| COPY_ONBOARDING_Q7_PROMPT_01 | `src/lib/profile-model.ts` | `When you take passive downtime (TV, scrolling, etc.), how does it affect your ability to focus afterward?` | Static | Always on question 7 | None | Onboarding question |
| COPY_ONBOARDING_Q7_OPTION_A_01 | `src/lib/profile-model.ts` | `It reliably restores focus and output` | Static | Question 7 option A | None | Visible option label |
| COPY_ONBOARDING_Q7_OPTION_B_01 | `src/lib/profile-model.ts` | `It improves focus somewhat` | Static | Question 7 option B | None | Visible option label |
| COPY_ONBOARDING_Q7_OPTION_C_01 | `src/lib/profile-model.ts` | `It feels like a break but doesn't restore real focus` | Static | Question 7 option C | None | Visible option label |
| COPY_ONBOARDING_Q7_OPTION_D_01 | `src/lib/profile-model.ts` | `It makes it harder to get back into work` | Static | Question 7 option D | None | Visible option label |
| COPY_ONBOARDING_Q8_PROMPT_01 | `src/lib/profile-model.ts` | `How does physical activity affect your ability to focus later in the day?` | Static | Always on question 8 | None | Onboarding question |
| COPY_ONBOARDING_Q8_OPTION_A_01 | `src/lib/profile-model.ts` | `It consistently improves focus and output` | Static | Question 8 option A | None | Visible option label |
| COPY_ONBOARDING_Q8_OPTION_B_01 | `src/lib/profile-model.ts` | `It helps, but only if the day isn't already overloaded` | Static | Question 8 option B | None | Visible option label |
| COPY_ONBOARDING_Q8_OPTION_C_01 | `src/lib/profile-model.ts` | `It helps physically more than cognitively` | Static | Question 8 option C | None | Visible option label |
| COPY_ONBOARDING_Q8_OPTION_D_01 | `src/lib/profile-model.ts` | `It doesn't meaningfully improve focus` | Static | Question 8 option D | None | Visible option label |
| COPY_ONBOARDING_Q9_PROMPT_01 | `src/lib/profile-model.ts` | `What is the most common reason that you fall behind on work?` | Static | Always on question 9 | None | Onboarding question |
| COPY_ONBOARDING_Q9_OPTION_A_01 | `src/lib/profile-model.ts` | `I keep waiting for a better or longer block later` | Static | Question 9 option A | None | Visible option label |
| COPY_ONBOARDING_Q9_OPTION_B_01 | `src/lib/profile-model.ts` | `My day looks open, but I can't use most of the time well` | Static | Question 9 option B | None | Visible option label |
| COPY_ONBOARDING_Q9_OPTION_C_01 | `src/lib/profile-model.ts` | `Social or meeting-heavy time drains more than I expect` | Static | Question 9 option C | None | Visible option label |
| COPY_ONBOARDING_Q9_OPTION_D_01 | `src/lib/profile-model.ts` | `It takes longer than expected to get into tasks` | Static | Question 9 option D | None | Visible option label |
| COPY_ONBOARDING_Q10_PROMPT_01 | `src/lib/profile-model.ts` | `When you plan your week, which of these tends to happen?` | Static | Always on question 10 | None | Onboarding question |
| COPY_ONBOARDING_Q10_OPTION_A_01 | `src/lib/profile-model.ts` | `I plan based on ideal conditions and assume things will go smoothly` | Static | Question 10 option A | None | Visible option label |
| COPY_ONBOARDING_Q10_OPTION_B_01 | `src/lib/profile-model.ts` | `My schedule looks reasonable, but ends up feeling more packed than expected` | Static | Question 10 option B | None | Visible option label |
| COPY_ONBOARDING_Q10_OPTION_C_01 | `src/lib/profile-model.ts` | `I underestimate how long tasks will take` | Static | Question 10 option C | None | Visible option label |
| COPY_ONBOARDING_Q10_OPTION_D_01 | `src/lib/profile-model.ts` | `I end up committing to more than I can actually get through` | Static | Question 10 option D | None | Visible option label |

#### Onboarding action messages: `src/app/actions/onboarding.ts`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_ONBOARDING_ERROR_INCOMPLETE_SUBMISSION_01 | `src/app/actions/onboarding.ts` | `The quiz submission was incomplete.` | Conditional/Adaptive | Returned when `answers` form field is missing or not a string | None | Error state |
| COPY_ONBOARDING_ERROR_INCOMPLETE_ANSWERS_01 | `src/app/actions/onboarding.ts` | `Please answer every question before continuing.` | Conditional/Adaptive | Returned when schema validation fails | None | Error state |
| COPY_ONBOARDING_ERROR_SCORE_FAILED_01 | `src/app/actions/onboarding.ts` | `The quiz answers could not be scored. Please try again.` | Conditional/Adaptive | Returned when scoring throws | None | Error state |

### Route: `/onboarding/analyzing`

#### Component: `src/app/onboarding/analyzing/page.tsx` + `src/components/onboarding-loading-screen.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_ONBOARDING_ANALYZING_HEADING_01 | `src/app/onboarding/analyzing/page.tsx` | `Analyzing your profile` | Static | Always | None | App shell heading |
| COPY_ONBOARDING_LOADING_EYEBROW_01 | `src/components/onboarding-loading-screen.tsx` | `Building profile` | Static | Always | None | Loading card |
| COPY_ONBOARDING_LOADING_HEADLINE_01 | `src/components/onboarding-loading-screen.tsx` | `Turning your signals into weekly planning constraints` | Static | Always | None | Loading card |
| COPY_ONBOARDING_LOADING_MESSAGE_01 | `src/components/onboarding-loading-screen.tsx` | `Analyzing focus endurance and recovery patterns` | Conditional/Adaptive | Rotating loading message | None | Loading sequence |
| COPY_ONBOARDING_LOADING_MESSAGE_02 | `src/components/onboarding-loading-screen.tsx` | `Estimating usable work capacity vs scheduled time` | Conditional/Adaptive | Rotating loading message | None | Loading sequence |
| COPY_ONBOARDING_LOADING_MESSAGE_03 | `src/components/onboarding-loading-screen.tsx` | `Evaluating fragmentation sensitivity` | Conditional/Adaptive | Rotating loading message | None | Loading sequence |
| COPY_ONBOARDING_LOADING_MESSAGE_04 | `src/components/onboarding-loading-screen.tsx` | `Modeling task switching costs` | Conditional/Adaptive | Rotating loading message | None | Loading sequence |
| COPY_ONBOARDING_LOADING_MESSAGE_05 | `src/components/onboarding-loading-screen.tsx` | `Identifying scheduling failure points` | Conditional/Adaptive | Rotating loading message | None | Loading sequence |
| COPY_ONBOARDING_LOADING_MESSAGE_06 | `src/components/onboarding-loading-screen.tsx` | `Converting signals into planning constraints` | Conditional/Adaptive | Rotating loading message | None | Loading sequence |

---

## Profile (Saved Profile Report)

### Route: `/onboarding` (saved profile view)

#### Component: `src/components/profile-report.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_PROFILE_REPORT_EYEBROW_01 | `src/components/profile-report.tsx` | `Work & Recovery Profile` | Static | Always on full profile report | None | Profile hero |
| COPY_PROFILE_REPORT_SECTION_HOW_YOU_WORK_01 | `src/components/profile-report.tsx` | `How you work` | Static | Always | None | Signals section |
| COPY_PROFILE_REPORT_SECTION_HOW_YOU_WORK_BODY_01 | `src/components/profile-report.tsx` | `These signals are stable across weeks. They describe the conditions that make your days feel usable or deceptively draining.` | Static | Always | None | Signals section body |
| COPY_PROFILE_REPORT_SECTION_SUBTYPE_01 | `src/components/profile-report.tsx` | `Cognitive subtype` | Static | Always | None | Subtype section |
| COPY_PROFILE_REPORT_SECTION_WHAT_THIS_MEANS_01 | `src/components/profile-report.tsx` | `What this means` | Static | Always | None | Subtype inset |
| COPY_PROFILE_REPORT_SECTION_KEEP_IN_MIND_01 | `src/components/profile-report.tsx` | `What to keep in mind` | Static | Always | None | Guidance section |
| COPY_PROFILE_REPORT_SECTION_KEEP_IN_MIND_BODY_01 | `src/components/profile-report.tsx` | `Patterns that make a week look manageable on paper, but feel tighter in practice.` | Static | Always | None | Guidance section body |
| COPY_PROFILE_REPORT_SECTION_PLAN_AROUND_01 | `src/components/profile-report.tsx` | `How to plan` | Static | Always | None | Planning section |
| COPY_PROFILE_REPORT_SECTION_PLAN_AROUND_BODY_01 | `src/components/profile-report.tsx` | `Use these as planning defaults when deciding how much structure, setup, and protection your week needs.` | Static | Always | None | Planning section body |
| COPY_PROFILE_REPORT_SECTION_NEXT_STEP_01 | `src/components/profile-report.tsx` | `Next step` | Conditional/Adaptive | Appears only when `actions` are supplied | None | Footer action row |
| COPY_PROFILE_REPORT_SECTION_NEXT_STEP_BODY_01 | `src/components/profile-report.tsx` | `Use this profile to interpret your dashboard, protect the right kind of time, and adjust when the week starts to tighten.` | Conditional/Adaptive | Appears only when `actions` are supplied | None | Footer action row |
| COPY_PROFILE_REPORT_SIGNAL_LOW_01 | `src/components/profile-report.tsx` | `Low` | Static | For all visible signal meters | None | Signal scale label |
| COPY_PROFILE_REPORT_SIGNAL_HIGH_01 | `src/components/profile-report.tsx` | `High` | Static | For all visible signal meters | None | Signal scale label |

#### Adaptive profile display source: `src/lib/profile-presentation.ts` + `src/lib/profile-summary.ts`

##### Shared signal labels

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_PROFILE_SIGNAL_LABEL_BLOCK_INTEGRITY_01 | `src/lib/profile-presentation.ts` | `Focus Block Need` | Conditional/Adaptive | Visible whenever this signal is rendered | None | Profile signals |
| COPY_PROFILE_SIGNAL_LABEL_FRAGMENTATION_01 | `src/lib/profile-presentation.ts` | `Cost of Interruptions` | Conditional/Adaptive | Visible whenever this signal is rendered | None | Profile signals |
| COPY_PROFILE_SIGNAL_LABEL_STARTUP_01 | `src/lib/profile-presentation.ts` | `Startup Cost` | Conditional/Adaptive | Visible whenever this signal is rendered | None | Profile signals |
| COPY_PROFILE_SIGNAL_LABEL_LOAD_01 | `src/lib/profile-presentation.ts` | `Overload Sensitivity` | Conditional/Adaptive | Visible whenever this signal is rendered | None | Profile signals |

##### Signal interpretations

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_PROFILE_SIGNAL_BLOCK_LOW_01 | `src/lib/profile-presentation.ts` | `Demanding work is usually manageable without long, protected blocks.` | Conditional/Adaptive | When Block Integrity Need resolves to Low | None | Profile signals |
| COPY_PROFILE_SIGNAL_BLOCK_MEDIUM_01 | `src/lib/profile-presentation.ts` | `Protected time helps, but shorter blocks can still work.` | Conditional/Adaptive | When Block Integrity Need resolves to Medium | None | Profile signals |
| COPY_PROFILE_SIGNAL_BLOCK_HIGH_01 | `src/lib/profile-presentation.ts` | `Demanding work happens best with protected time and minimal interruptions.` | Conditional/Adaptive | When Block Integrity Need resolves to High | None | Profile signals |
| COPY_PROFILE_SIGNAL_FRAGMENTATION_LOW_01 | `src/lib/profile-presentation.ts` | `Short gaps and interruptions are usually manageable.` | Conditional/Adaptive | When Fragmentation Cost resolves to Low | None | Profile signals |
| COPY_PROFILE_SIGNAL_FRAGMENTATION_MEDIUM_01 | `src/lib/profile-presentation.ts` | `Some fragmented time is usable, but cleaner blocks work better.` | Conditional/Adaptive | When Fragmentation Cost resolves to Medium | None | Profile signals |
| COPY_PROFILE_SIGNAL_FRAGMENTATION_HIGH_01 | `src/lib/profile-presentation.ts` | `Broken time quickly reduces how much demanding work you can do.` | Conditional/Adaptive | When Fragmentation Cost resolves to High | None | Profile signals |
| COPY_PROFILE_SIGNAL_STARTUP_LOW_01 | `src/lib/profile-presentation.ts` | `Open-ended work blocks becomes productive quickly once you begin.` | Conditional/Adaptive | When Startup Cost resolves to Low | None | Profile signals |
| COPY_PROFILE_SIGNAL_STARTUP_MEDIUM_01 | `src/lib/profile-presentation.ts` | `Some setup time helps before open-ended work becomes productive.` | Conditional/Adaptive | When Startup Cost resolves to Medium | None | Profile signals |
| COPY_PROFILE_SIGNAL_STARTUP_HIGH_01 | `src/lib/profile-presentation.ts` | `Open-ended work often needs to be narrowed before it becomes productive.` | Conditional/Adaptive | When Startup Cost resolves to High | None | Profile signals |
| COPY_PROFILE_SIGNAL_LOAD_LOW_01 | `src/lib/profile-presentation.ts` | `Busier weeks are usually manageable without a sharp drop in output.` | Conditional/Adaptive | When Load Sensitivity resolves to Low | None | Profile signals |
| COPY_PROFILE_SIGNAL_LOAD_MEDIUM_01 | `src/lib/profile-presentation.ts` | `Load builds gradually, so week shape matters as demands stack up.` | Conditional/Adaptive | When Load Sensitivity resolves to Medium | None | Profile signals |
| COPY_PROFILE_SIGNAL_LOAD_HIGH_01 | `src/lib/profile-presentation.ts` | `Dense weeks reduce output quickly, even when the calendar looks open.` | Conditional/Adaptive | When Load Sensitivity resolves to High | None | Profile signals |

##### Subtype presentations and guidance

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_PROFILE_SUBTYPE_PBP_NAME_01 | `src/lib/profile-presentation.ts` | `Protected-Block Planner` | Conditional/Adaptive | When subtype is Protected-Block Planner | None | Profile title |
| COPY_PROFILE_SUBTYPE_PBP_DESC_01 | `src/lib/profile-presentation.ts` | `You do your best work when demanding tasks have structure, protection, and uninterrupted time.` | Conditional/Adaptive | When subtype is Protected-Block Planner | None | Profile description |
| COPY_PROFILE_SUBTYPE_PBP_CORE_01 | `src/lib/profile-presentation.ts` | `Protected time matters more than how much open time the week appears to have.` | Conditional/Adaptive | When subtype is Protected-Block Planner | None | Appears as “What this means” |
| COPY_PROFILE_SUBTYPE_PBP_OVERVIEW_01 | `src/lib/profile-presentation.ts` | `Your best work depends on protected time, and once a block is broken, depth is harder to recover.` | Conditional/Adaptive | When subtype is Protected-Block Planner | None | Profile overview line |
| COPY_PROFILE_SUBTYPE_PBP_KEEP_01 | `src/lib/profile-presentation.ts` | `Open time can look easier than it actually is` | Conditional/Adaptive | When subtype is Protected-Block Planner | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_PBP_KEEP_02 | `src/lib/profile-presentation.ts` | `Fragmentation quickly reduces how much you can get done.` | Conditional/Adaptive | When subtype is Protected-Block Planner | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_PBP_KEEP_03 | `src/lib/profile-presentation.ts` | `Startup cost rises when tasks stay vague` | Conditional/Adaptive | When subtype is Protected-Block Planner | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_PBP_KEEP_04 | `src/lib/profile-presentation.ts` | `Full weeks feel tighter than they look` | Conditional/Adaptive | When subtype is Protected-Block Planner | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_PBP_PLAN_01 | `src/lib/profile-presentation.ts` | `Protect clean blocks before filling the rest of the week.` | Conditional/Adaptive | When subtype is Protected-Block Planner | None | Planning rule |
| COPY_PROFILE_SUBTYPE_PBP_PLAN_02 | `src/lib/profile-presentation.ts` | `Turn open-ended work into concrete starting points early.` | Conditional/Adaptive | When subtype is Protected-Block Planner | None | Planning rule |
| COPY_PROFILE_SUBTYPE_PBP_PLAN_03 | `src/lib/profile-presentation.ts` | `Treat fragmented or interupted time as support, not primary output time.` | Conditional/Adaptive | When subtype is Protected-Block Planner | None | Planning rule |
| COPY_PROFILE_SUBTYPE_SCE_NAME_01 | `src/lib/profile-presentation.ts` | `Short-Cycle Executor` | Conditional/Adaptive | When subtype is Short-Cycle Executor | None | Profile title |
| COPY_PROFILE_SUBTYPE_SCE_DESC_01 | `src/lib/profile-presentation.ts` | `You keep work moving in shorter cycles, as long as tasks are clearly defined and easy to pick back up.` | Conditional/Adaptive | When subtype is Short-Cycle Executor | None | Profile description |
| COPY_PROFILE_SUBTYPE_SCE_CORE_01 | `src/lib/profile-presentation.ts` | `Maintaining momentum matters more than waiting for one ideal block.` | Conditional/Adaptive | When subtype is Short-Cycle Executor | None | Appears as “What this means” |
| COPY_PROFILE_SUBTYPE_SCE_OVERVIEW_01 | `src/lib/profile-presentation.ts` | `You make steady progress in shorter bursts when the work is clear and easy to re-enter.` | Conditional/Adaptive | When subtype is Short-Cycle Executor | None | Profile overview line |
| COPY_PROFILE_SUBTYPE_SCE_KEEP_01 | `src/lib/profile-presentation.ts` | `Short usable blocks can carry more progress than they seem` | Conditional/Adaptive | When subtype is Short-Cycle Executor | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_SCE_KEEP_02 | `src/lib/profile-presentation.ts` | `Momentum matters more than perfect timing` | Conditional/Adaptive | When subtype is Short-Cycle Executor | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_SCE_KEEP_03 | `src/lib/profile-presentation.ts` | `Concrete tasks are easier to resume than vague ones` | Conditional/Adaptive | When subtype is Short-Cycle Executor | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_SCE_KEEP_04 | `src/lib/profile-presentation.ts` | `Work accumulates when too many tasks stay open` | Conditional/Adaptive | When subtype is Short-Cycle Executor | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_SCE_PLAN_01 | `src/lib/profile-presentation.ts` | `Break demanding work into clear continuation steps.` | Conditional/Adaptive | When subtype is Short-Cycle Executor | None | Planning rule |
| COPY_PROFILE_SUBTYPE_SCE_PLAN_02 | `src/lib/profile-presentation.ts` | `Use short windows to keep work moving forward.` | Conditional/Adaptive | When subtype is Short-Cycle Executor | None | Planning rule |
| COPY_PROFILE_SUBTYPE_SCE_PLAN_03 | `src/lib/profile-presentation.ts` | `Start earlier instead of waiting for one perfect block.` | Conditional/Adaptive | When subtype is Short-Cycle Executor | None | Planning rule |
| COPY_PROFILE_SUBTYPE_CSW_NAME_01 | `src/lib/profile-presentation.ts` | `Context-Sensitive Worker` | Conditional/Adaptive | When subtype is Context-Sensitive Worker | None | Profile title |
| COPY_PROFILE_SUBTYPE_CSW_DESC_01 | `src/lib/profile-presentation.ts` | `Your productivity depends heavily on how well your environment and task context match the work.` | Conditional/Adaptive | When subtype is Context-Sensitive Worker | None | Profile description |
| COPY_PROFILE_SUBTYPE_CSW_CORE_01 | `src/lib/profile-presentation.ts` | `The same amount of time can feel easy or difficult depending on the surrounding context.` | Conditional/Adaptive | When subtype is Context-Sensitive Worker | None | Appears as “What this means” |
| COPY_PROFILE_SUBTYPE_CSW_OVERVIEW_01 | `src/lib/profile-presentation.ts` | `Your usable time depends as much on context as it does on the clock.` | Conditional/Adaptive | When subtype is Context-Sensitive Worker | None | Profile overview line |
| COPY_PROFILE_SUBTYPE_CSW_KEEP_01 | `src/lib/profile-presentation.ts` | `The same hour can vary widely depending on context` | Conditional/Adaptive | When subtype is Context-Sensitive Worker | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_CSW_KEEP_02 | `src/lib/profile-presentation.ts` | `Switching and fragmentation compound on each other` | Conditional/Adaptive | When subtype is Context-Sensitive Worker | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_CSW_KEEP_03 | `src/lib/profile-presentation.ts` | `Environment fit matters as much as open time` | Conditional/Adaptive | When subtype is Context-Sensitive Worker | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_CSW_KEEP_04 | `src/lib/profile-presentation.ts` | `Reset between modes helps preserve focus` | Conditional/Adaptive | When subtype is Context-Sensitive Worker | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_CSW_PLAN_01 | `src/lib/profile-presentation.ts` | `Group similar work before adding more total time.` | Conditional/Adaptive | When subtype is Context-Sensitive Worker | None | Planning rule |
| COPY_PROFILE_SUBTYPE_CSW_PLAN_02 | `src/lib/profile-presentation.ts` | `Reduce unnecessary context changes across the day.` | Conditional/Adaptive | When subtype is Context-Sensitive Worker | None | Planning rule |
| COPY_PROFILE_SUBTYPE_CSW_PLAN_03 | `src/lib/profile-presentation.ts` | `Place demanding work where the context already supports it.` | Conditional/Adaptive | When subtype is Context-Sensitive Worker | None | Planning rule |
| COPY_PROFILE_SUBTYPE_RSS_NAME_01 | `src/lib/profile-presentation.ts` | `Reset-Sensitive Scheduler` | Conditional/Adaptive | When subtype is Reset-Sensitive Scheduler | None | Profile title |
| COPY_PROFILE_SUBTYPE_RSS_DESC_01 | `src/lib/profile-presentation.ts` | `Switching between tasks carries a real cost, and you need recovery between efforts to stay effective.` | Conditional/Adaptive | When subtype is Reset-Sensitive Scheduler | None | Profile description |
| COPY_PROFILE_SUBTYPE_RSS_CORE_01 | `src/lib/profile-presentation.ts` | `Time that looks available may not be usable without enough reset between demands.` | Conditional/Adaptive | When subtype is Reset-Sensitive Scheduler | None | Appears as “What this means” |
| COPY_PROFILE_SUBTYPE_RSS_OVERVIEW_01 | `src/lib/profile-presentation.ts` | `Starting and switching carry real cost, so the sequence of your week matters as much as the time itself.` | Conditional/Adaptive | When subtype is Reset-Sensitive Scheduler | None | Profile overview line |
| COPY_PROFILE_SUBTYPE_RSS_KEEP_01 | `src/lib/profile-presentation.ts` | `Available time can be unusable after heavy demand` | Conditional/Adaptive | When subtype is Reset-Sensitive Scheduler | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_RSS_KEEP_02 | `src/lib/profile-presentation.ts` | `Recovery quality determines what the next block can support` | Conditional/Adaptive | When subtype is Reset-Sensitive Scheduler | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_RSS_KEEP_03 | `src/lib/profile-presentation.ts` | `Switching costs accumulate before they feel obvious` | Conditional/Adaptive | When subtype is Reset-Sensitive Scheduler | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_RSS_KEEP_04 | `src/lib/profile-presentation.ts` | `Dense days reduce later capacity` | Conditional/Adaptive | When subtype is Reset-Sensitive Scheduler | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_RSS_PLAN_01 | `src/lib/profile-presentation.ts` | `Leave reset space before the next demanding block.` | Conditional/Adaptive | When subtype is Reset-Sensitive Scheduler | None | Planning rule |
| COPY_PROFILE_SUBTYPE_RSS_PLAN_02 | `src/lib/profile-presentation.ts` | `Avoid stacking high-demand tasks without recovery.` | Conditional/Adaptive | When subtype is Reset-Sensitive Scheduler | None | Planning rule |
| COPY_PROFILE_SUBTYPE_RSS_PLAN_03 | `src/lib/profile-presentation.ts` | `Plan capacity around recovery, not just open time.` | Conditional/Adaptive | When subtype is Reset-Sensitive Scheduler | None | Planning rule |
| COPY_PROFILE_SUBTYPE_AG_NAME_01 | `src/lib/profile-presentation.ts` | `Adaptive Generalist` | Conditional/Adaptive | When subtype is Adaptive Generalist | None | Profile title |
| COPY_PROFILE_SUBTYPE_AG_DESC_01 | `src/lib/profile-presentation.ts` | `You can adapt across different kinds of work without needing highly specific conditions.` | Conditional/Adaptive | When subtype is Adaptive Generalist | None | Profile description |
| COPY_PROFILE_SUBTYPE_AG_CORE_01 | `src/lib/profile-presentation.ts` | `Consistency comes more from staying engaged than from optimizing your schedule.` | Conditional/Adaptive | When subtype is Adaptive Generalist | None | Appears as “What this means” |
| COPY_PROFILE_SUBTYPE_AG_OVERVIEW_01 | `src/lib/profile-presentation.ts` | `You’re capable of adapting across different kinds of work without heavy setup, which keeps your time consistently usable.` | Conditional/Adaptive | When subtype is Adaptive Generalist | None | Profile overview line |
| COPY_PROFILE_SUBTYPE_AG_KEEP_01 | `src/lib/profile-presentation.ts` | `Many different structures can work for you` | Conditional/Adaptive | When subtype is Adaptive Generalist | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_AG_KEEP_02 | `src/lib/profile-presentation.ts` | `Engagement matters more than ideal conditions` | Conditional/Adaptive | When subtype is Adaptive Generalist | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_AG_KEEP_03 | `src/lib/profile-presentation.ts` | `Small windows stay useful when tasks are well-scoped` | Conditional/Adaptive | When subtype is Adaptive Generalist | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_AG_KEEP_04 | `src/lib/profile-presentation.ts` | `Overload can build quietly as commitments spread` | Conditional/Adaptive | When subtype is Adaptive Generalist | None | Keep-in-mind list |
| COPY_PROFILE_SUBTYPE_AG_PLAN_01 | `src/lib/profile-presentation.ts` | `Use flexible windows while the week is still light.` | Conditional/Adaptive | When subtype is Adaptive Generalist | None | Planning rule |
| COPY_PROFILE_SUBTYPE_AG_PLAN_02 | `src/lib/profile-presentation.ts` | `Keep tasks concrete enough to start in imperfect time.` | Conditional/Adaptive | When subtype is Adaptive Generalist | None | Planning rule |
| COPY_PROFILE_SUBTYPE_AG_PLAN_03 | `src/lib/profile-presentation.ts` | `Watch scope before flexibility turns into overcommitment.` | Conditional/Adaptive | When subtype is Adaptive Generalist | None | Planning rule |

### Route: `/settings` (saved profile summary card)

#### Component: `src/components/profile-overview.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_PROFILE_OVERVIEW_EYEBROW_01 | `src/components/profile-overview.tsx` | `Your cognitive subtype` | Static | Always when profile summary renders | None | Settings profile summary |
| COPY_PROFILE_OVERVIEW_HOW_YOU_WORK_01 | `src/components/profile-overview.tsx` | `How you work` | Static | Always | None | Settings profile summary |
| COPY_PROFILE_OVERVIEW_EMPTY_SIGNALS_01 | `src/components/profile-overview.tsx` | `No signal data available yet.` | Conditional/Adaptive | Appears if no metrics exist | None | Settings profile summary empty state |
| COPY_PROFILE_OVERVIEW_WHAT_THIS_MEANS_01 | `src/components/profile-overview.tsx` | `What this means` | Static | Always | None | Settings profile summary |
| COPY_PROFILE_OVERVIEW_PLAN_AROUND_01 | `src/components/profile-overview.tsx` | `How to plan around it` | Static | Always | None | Settings profile summary |

---

## Dashboard

### Route: `/dashboard`

#### Component: `src/app/dashboard/page.tsx` — top control card and connection states

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_DASHBOARD_ANALYZE_TITLE_01 | `src/app/dashboard/page.tsx` | `Analyze My Week` | Static | Always in top control card | None | Dashboard top control |
| COPY_DASHBOARD_ANALYZE_ACTION_01 | `src/app/dashboard/page.tsx` | `Run Analysis` | Conditional/Adaptive | Analyze button idle label when no report exists | None | Dashboard action |
| COPY_DASHBOARD_ANALYZE_ACTION_02 | `src/app/dashboard/page.tsx` | `Re-analyze Week` | Conditional/Adaptive | Analyze button idle label when report exists | None | Dashboard action |
| COPY_DASHBOARD_ANALYZE_PENDING_01 | `src/components/analyze-week-submit-button.tsx` | `Re-analyzing` | Conditional/Adaptive | Analyze button pending state | None | Dashboard action loading |
| COPY_DASHBOARD_STATUS_LAST_ANALYZED_01 | `src/app/dashboard/page.tsx` | `Last analyzed: {formatDateTime(state.report.analyzedAt)}` | Conditional/Adaptive | Appears when a report exists | `state.report.analyzedAt` | Dashboard status pill |
| COPY_DASHBOARD_ACTION_CONNECT_SETTINGS_01 | `src/app/dashboard/page.tsx` | `Connect in Settings` | Conditional/Adaptive | Appears when profile exists but Google needs setup/connection | `state.normalizedProfile`, `googleOAuthConfigured` | Dashboard fallback CTA |
| COPY_DASHBOARD_ACTION_FINISH_LOCAL_OAUTH_01 | `src/app/dashboard/page.tsx` | `Finish local OAuth setup` | Conditional/Adaptive | Appears when profile exists and local Google OAuth is not configured | `googleOAuthConfigured` | Dashboard fallback CTA |
| COPY_DASHBOARD_ACTION_REFRESH_PROFILE_01 | `src/app/dashboard/page.tsx` | `Refresh profile` | Conditional/Adaptive | Appears when no normalized profile exists | `state.normalizedProfile` | Dashboard fallback CTA |
| COPY_DASHBOARD_EMPTY_PROFILE_TITLE_01 | `src/app/dashboard/page.tsx` | `Profile needed` | Conditional/Adaptive | Appears when no normalized profile exists | None | Dashboard empty/error state |
| COPY_DASHBOARD_EMPTY_PROFILE_BODY_01 | `src/app/dashboard/page.tsx` | `Refresh your profile so Headroom can interpret your week alongside it.` | Conditional/Adaptive | Appears when no normalized profile exists | None | Dashboard empty/error state |
| COPY_DASHBOARD_EMPTY_OAUTH_TITLE_01 | `src/app/dashboard/page.tsx` | `Finish local Google OAuth setup` | Conditional/Adaptive | Appears when local OAuth is not configured | None | Dashboard empty/error state |
| COPY_DASHBOARD_EMPTY_OAUTH_BODY_01 | `src/app/dashboard/page.tsx` | `Google Calendar analysis is ready in-app, but localhost OAuth credentials are still placeholders.` | Conditional/Adaptive | Appears when local OAuth is not configured | None | Dashboard empty/error state |
| COPY_DASHBOARD_EMPTY_CONNECT_TITLE_01 | `src/app/dashboard/page.tsx` | `Connect Google Calendar` | Conditional/Adaptive | Appears when Google is not connected | None | Dashboard empty/error state |
| COPY_DASHBOARD_EMPTY_CONNECT_BODY_01 | `src/app/dashboard/page.tsx` | `Headroom only reads the calendars you include and only analyzes the next week.` | Conditional/Adaptive | Appears when Google is not connected | None | Dashboard empty/error state |
| COPY_DASHBOARD_EMPTY_MISSING_ACCESS_TITLE_01 | `src/app/dashboard/page.tsx` | `Calendar access is missing` | Conditional/Adaptive | Appears when Google account lacks readonly calendar scope | None | Dashboard empty/error state |
| COPY_DASHBOARD_EMPTY_MISSING_ACCESS_BODY_01 | `src/app/dashboard/page.tsx` | `This Google account is linked, but Headroom does not have read-only calendar access for it yet. Reconnect in Settings and approve calendar access.` | Conditional/Adaptive | Appears when Google account lacks readonly calendar scope | None | Dashboard empty/error state |
| COPY_DASHBOARD_EMPTY_PROVIDER_RESTRICTED_TITLE_01 | `src/app/dashboard/page.tsx` | `Calendar access is restricted` | Conditional/Adaptive | Appears when provider restriction is surfaced | None | Dashboard empty/error state |
| COPY_DASHBOARD_EMPTY_PROVIDER_RESTRICTED_BODY_01 | `src/app/dashboard/page.tsx` | `Google sign-in worked, but this account is not currently allowed to expose calendar data here. Check provider access restrictions, then reconnect.` | Conditional/Adaptive | Appears when provider restriction is surfaced | None | Dashboard empty/error state |
| COPY_DASHBOARD_EMPTY_RECONNECT_TITLE_01 | `src/app/dashboard/page.tsx` | `Reconnect Google Calendar` | Conditional/Adaptive | Appears when refresh/reconnect is required | None | Dashboard empty/error state |
| COPY_DASHBOARD_EMPTY_RECONNECT_BODY_01 | `src/app/dashboard/page.tsx` | `Google Calendar access expired. Reconnect Google Calendar, then run a fresh analysis.` | Conditional/Adaptive | Appears when refresh/reconnect is required | None | Dashboard empty/error state |
| COPY_DASHBOARD_EMPTY_NO_REPORT_TITLE_01 | `src/app/dashboard/page.tsx` | `No report yet` | Conditional/Adaptive | Appears when all prerequisites are satisfied but no report exists | None | Dashboard empty state |
| COPY_DASHBOARD_EMPTY_NO_REPORT_BODY_01 | `src/app/dashboard/page.tsx` | `Run your first fresh read of the week from the calendars you include in Settings. If a cached report exists later, the dashboard will show it until you re-analyze or it expires.` | Conditional/Adaptive | Appears when all prerequisites are satisfied but no report exists | None | Dashboard empty state |

#### Component: `src/components/dashboard-daily-panels.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_DASHBOARD_TRAJECTORY_EYEBROW_01 | `src/components/dashboard-daily-panels.tsx` | `Week trajectory` | Static | Appears when a report exists | None | Primary dashboard hero |
| COPY_DASHBOARD_TRAJECTORY_TITLE_01 | `src/components/dashboard-daily-panels.tsx` | `How your capacity shifts across the week` | Static | Appears when a report exists | None | Primary dashboard hero |
| COPY_DASHBOARD_WEEKLOAD_EYEBROW_01 | `src/components/dashboard-daily-panels.tsx` | `Weekly load` | Static | Appears in week-load lens | None | Dashboard hero |
| COPY_DASHBOARD_TODAY_SUPPORTS_01 | `src/components/dashboard-daily-panels.tsx` | `What today can support` | Static | Appears below trajectory | None | Daily detail panel |
| COPY_DASHBOARD_DAY_LOAD_LABEL_01 | `src/components/dashboard-daily-panels.tsx` | `Load: {activeDay.score}` | Conditional/Adaptive | Appears when a day is active | `activeDay.score` | Daily detail panel |
| COPY_DASHBOARD_DAY_EMPTY_01 | `src/components/dashboard-daily-panels.tsx` | `  Hover or tap a day to see what it can realistically support.` | Conditional/Adaptive | Appears when no day is active | None | Daily detail panel empty state |

#### Adaptive dashboard week-load labels: `src/app/dashboard/page.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_DASHBOARD_LOAD_LABEL_OPEN_01 | `src/app/dashboard/page.tsx` | `Open` | Conditional/Adaptive | Week load score below 25 | `score` | Week load label |
| COPY_DASHBOARD_LOAD_LABEL_STEADY_01 | `src/app/dashboard/page.tsx` | `Steady` | Conditional/Adaptive | Week load score 25–44 | `score` | Week load label |
| COPY_DASHBOARD_LOAD_LABEL_FULL_01 | `src/app/dashboard/page.tsx` | `Full` | Conditional/Adaptive | Week load score 45–64 | `score` | Week load label |
| COPY_DASHBOARD_LOAD_LABEL_TIGHT_01 | `src/app/dashboard/page.tsx` | `Tight` | Conditional/Adaptive | Week load score 65–82 | `score` | Week load label |
| COPY_DASHBOARD_LOAD_LABEL_STRAINED_01 | `src/app/dashboard/page.tsx` | `Strained` | Conditional/Adaptive | Week load score 83+ | `score` | Week load label |
| COPY_DASHBOARD_LOAD_INTERPRETATION_OPEN_01 | `src/app/dashboard/page.tsx` | `This week has real breathing room, and your capacity is unlikely to be limited by structure alone.` | Conditional/Adaptive | Week load score below 25 | None | Week load card interpretation |
| COPY_DASHBOARD_LOAD_INTERPRETATION_STEADY_01 | `src/app/dashboard/page.tsx` | `The week has meaningful structure, but still leaves enough margin to stay workable.` | Conditional/Adaptive | Week load score 25–44 | None | Week load card interpretation |
| COPY_DASHBOARD_LOAD_INTERPRETATION_FULL_01 | `src/app/dashboard/page.tsx` | `The week is carrying real demand, but remains workable if recovery and placement stay intentional.` | Conditional/Adaptive | Week load score 45–64 | None | Week load card interpretation |
| COPY_DASHBOARD_LOAD_INTERPRETATION_TIGHT_01 | `src/app/dashboard/page.tsx` | `The week has limited margin, so structure, recovery, and transitions will strongly shape how usable it feels.` | Conditional/Adaptive | Week load score 65–82 | None | Week load card interpretation |
| COPY_DASHBOARD_LOAD_INTERPRETATION_STRAINED_01 | `src/app/dashboard/page.tsx` | `Demand is likely to outpace support this week, so without adjustment the schedule is likely to feel difficult.` | Conditional/Adaptive | Week load score 83+ | None | Week load card interpretation |

#### Adaptive planning-style read: `src/lib/dashboard-insights.ts`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_DASHBOARD_PROFILE_PANEL_TITLE_01 | `src/lib/dashboard-insights.ts` | `Through your profile lens` | Static | Used when planning style read is surfaced | None | Dashboard interpretive framing |
| COPY_DASHBOARD_PROFILE_HEADLINE_01 | `src/lib/dashboard-insights.ts` | `The biggest pressure isn’t total hours, but how much of your time is broken into less usable pieces.` | Conditional/Adaptive | When `fragmentationCost >= 4` and `squeezedOpenBlockCount >= 3` | None | Dashboard profile insight |
| COPY_DASHBOARD_PROFILE_HEADLINE_02 | `src/lib/dashboard-insights.ts` | `Switching cost will matter almost as much as total volume this week.` | Conditional/Adaptive | When `transitionCost >= 4` and transition density threshold is met | None | Dashboard profile insight |
| COPY_DASHBOARD_PROFILE_HEADLINE_03 | `src/lib/dashboard-insights.ts` | `The week will feel tight where demand clusters, more than from total hours alone.` | Conditional/Adaptive | When `overloadSensitivity >= 4` and load concentration threshold is met | None | Dashboard profile insight |
| COPY_DASHBOARD_PROFILE_DETAIL_01 | `src/lib/dashboard-insights.ts` | `You tend to benefit from quieter reset, but this week leaves only a modest amount of it.` | Conditional/Adaptive | When quiet recovery is high and recovery minutes are low | None | Dashboard profile detail |
| COPY_DASHBOARD_PROFILE_DETAIL_02 | `src/lib/dashboard-insights.ts` | `You tend to benefit from active reset, and this week does give exercise a real place in the rhythm.` | Conditional/Adaptive | When exercise recovery value is high and exercise count is positive | None | Dashboard profile detail |
| COPY_DASHBOARD_PROFILE_DETAIL_03 | `src/lib/dashboard-insights.ts` | `You can use social time as real recovery, as long as it isn’t stacked too tightly.` | Conditional/Adaptive | When social recovery value is high and social minutes are positive | None | Dashboard profile detail |

#### Adaptive daily operating modes: `src/lib/week-analysis.ts`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_DASHBOARD_MODE_TITLE_OPEN_01 | `src/lib/week-analysis.ts` | `Open Capacity Day` | Conditional/Adaptive | When day mode resolves to `open_capacity` | None | Daily operating mode |
| COPY_DASHBOARD_MODE_MEANING_OPEN_01 | `src/lib/week-analysis.ts` | `Use this day to make real progress and prioritize your hardest work.` | Conditional/Adaptive | When day mode resolves to `open_capacity` | None | Daily operating mode |
| COPY_DASHBOARD_MODE_ACTION_OPEN_01 | `src/lib/week-analysis.ts` | `Place your hardest work in the clearest block.` | Conditional/Adaptive | When day mode resolves to `open_capacity` | None | Daily operating mode action |
| COPY_DASHBOARD_MODE_ACTION_OPEN_02 | `src/lib/week-analysis.ts` | `Keep admin and follow-through outside your best runway.` | Conditional/Adaptive | When day mode resolves to `open_capacity` | None | Daily operating mode action |
| COPY_DASHBOARD_MODE_ACTION_OPEN_03 | `src/lib/week-analysis.ts` | `Use the day early, before later pressure makes the week feel tighter.` | Conditional/Adaptive | When day mode resolves to `open_capacity` | None | Daily operating mode action |
| COPY_DASHBOARD_MODE_REFRAME_OPEN_01 | `src/lib/week-analysis.ts` | `Using this kind of day well usually makes the rest of the week easier to carry.` | Conditional/Adaptive | When day mode resolves to `open_capacity` | None | Daily operating mode reframe |
| COPY_DASHBOARD_MODE_TITLE_FOLLOW_01 | `src/lib/week-analysis.ts` | `Follow-Through Day` | Conditional/Adaptive | When day mode resolves to `follow_through` | None | Daily operating mode |
| COPY_DASHBOARD_MODE_MEANING_FOLLOW_01 | `src/lib/week-analysis.ts` | `Move through what is scheduled, and do not force depth between transitions.` | Conditional/Adaptive | When day mode resolves to `follow_through` | None | Daily operating mode |
| COPY_DASHBOARD_MODE_ACTION_FOLLOW_01 | `src/lib/week-analysis.ts` | `Let the schedule set the pace instead of trying to force extra depth.` | Conditional/Adaptive | When day mode resolves to `follow_through` | None | Daily operating mode action |
| COPY_DASHBOARD_MODE_ACTION_FOLLOW_02 | `src/lib/week-analysis.ts` | `Use smaller openings for review, admin, setup, or completion.` | Conditional/Adaptive | When day mode resolves to `follow_through` | None | Daily operating mode action |
| COPY_DASHBOARD_MODE_ACTION_FOLLOW_03 | `src/lib/week-analysis.ts` | `Protect momentum without expecting deep work from a scattered schedule.` | Conditional/Adaptive | When day mode resolves to `follow_through` | None | Daily operating mode action |
| COPY_DASHBOARD_MODE_REFRAME_FOLLOW_01 | `src/lib/week-analysis.ts` | `A good Follow-Through Day keeps the week moving without fighting the structure.` | Conditional/Adaptive | When day mode resolves to `follow_through` | None | Daily operating mode reframe |
| COPY_DASHBOARD_MODE_TITLE_RECOVER_01 | `src/lib/week-analysis.ts` | `Recover Day` | Conditional/Adaptive | When day mode resolves to `recover` | None | Daily operating mode |
| COPY_DASHBOARD_MODE_MEANING_RECOVER_01 | `src/lib/week-analysis.ts` | `Let the system reset—recovery today supports the rest of the week.` | Conditional/Adaptive | When day mode resolves to `recover` | None | Daily operating mode |
| COPY_DASHBOARD_MODE_ACTION_RECOVER_01 | `src/lib/week-analysis.ts` | `Let rest, exercise, care, or quieter catch-up take priority.` | Conditional/Adaptive | When day mode resolves to `recover` | None | Daily operating mode action |
| COPY_DASHBOARD_MODE_ACTION_RECOVER_02 | `src/lib/week-analysis.ts` | `If work needs to happen, keep it concrete, bounded, and lower-stakes.` | Conditional/Adaptive | When day mode resolves to `recover` | None | Daily operating mode action |
| COPY_DASHBOARD_MODE_ACTION_RECOVER_03 | `src/lib/week-analysis.ts` | `Treat open time as margin to protect, not pressure to fill.` | Conditional/Adaptive | When day mode resolves to `recover` | None | Daily operating mode action |
| COPY_DASHBOARD_MODE_REFRAME_RECOVER_01 | `src/lib/week-analysis.ts` | `Protecting capacity on a Recover Day is part of the plan, not a detour from it.` | Conditional/Adaptive | When day mode resolves to `recover` | None | Daily operating mode reframe |
| COPY_DASHBOARD_MODE_TITLE_FRAGMENTED_01 | `src/lib/week-analysis.ts` | `Fragmented Day` | Conditional/Adaptive | When day mode resolves to `fragmented` | None | Daily operating mode |
| COPY_DASHBOARD_MODE_MEANING_FRAGMENTED_01 | `src/lib/week-analysis.ts` | `Stay modular, as deep work will be harder than it looks.` | Conditional/Adaptive | When day mode resolves to `fragmented` | None | Daily operating mode |
| COPY_DASHBOARD_MODE_ACTION_FRAGMENTED_01 | `src/lib/week-analysis.ts` | `Keep tasks small, modular, and easy to restart between commitments.` | Conditional/Adaptive | When day mode resolves to `fragmented` | None | Daily operating mode action |
| COPY_DASHBOARD_MODE_ACTION_FRAGMENTED_02 | `src/lib/week-analysis.ts` | `Save your best energy for a different day instead of forcing depth here.` | Conditional/Adaptive | When day mode resolves to `fragmented` | None | Daily operating mode action |
| COPY_DASHBOARD_MODE_ACTION_FRAGMENTED_03 | `src/lib/week-analysis.ts` | `Use the day for review, prep, admin, and bounded follow-through instead.` | Conditional/Adaptive | When day mode resolves to `fragmented` | None | Daily operating mode action |
| COPY_DASHBOARD_MODE_REFRAME_FRAGMENTED_01 | `src/lib/week-analysis.ts` | `This is not a depth-friendly day, even if the calendar looks more open than it feels.` | Conditional/Adaptive | When day mode resolves to `fragmented` | None | Daily operating mode reframe |
| COPY_DASHBOARD_MODE_TITLE_PROTECTED_01 | `src/lib/week-analysis.ts` | `Protected Work Day` | Conditional/Adaptive | When day mode resolves to `protected_work` | None | Daily operating mode |
| COPY_DASHBOARD_MODE_MEANING_PROTECTED_01 | `src/lib/week-analysis.ts` | `Protecting one real work block is the win.` | Conditional/Adaptive | When day mode resolves to `protected_work` | None | Daily operating mode |
| COPY_DASHBOARD_MODE_ACTION_PROTECTED_01 | `src/lib/week-analysis.ts` | `Choose {protectedWindowLabel} and decide in advance what belongs there.` | Conditional/Adaptive | When day mode resolves to `protected_work` | `protectedWindowLabel` | Daily operating mode action |
| COPY_DASHBOARD_MODE_ACTION_PROTECTED_02 | `src/lib/week-analysis.ts` | `Let the rest of the day absorb everything that doesn’t belong in the protected block.` | Conditional/Adaptive | When day mode resolves to `protected_work` | None | Daily operating mode action |
| COPY_DASHBOARD_MODE_ACTION_PROTECTED_03 | `src/lib/week-analysis.ts` | `Keep extra demands from leaking into the one block that can still hold real work.` | Conditional/Adaptive | When day mode resolves to `protected_work` | None | Daily operating mode action |
| COPY_DASHBOARD_MODE_REFRAME_PROTECTED_01 | `src/lib/week-analysis.ts` | `The goal is not to do everything today, but to keep one part of the day genuinely usable.` | Conditional/Adaptive | When day mode resolves to `protected_work` | None | Daily operating mode reframe |

#### Adaptive dashboard observations and interventions

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_DASHBOARD_INTERVENTIONS_TITLE_01 | `src/app/dashboard/page.tsx` | `What to adjust` | Conditional/Adaptive | Appears only when week load score is above 85 | None | Dashboard section |
| COPY_DASHBOARD_INTERVENTION_LABEL_01 | `src/app/dashboard/page.tsx` | `Main adjustment` | Conditional/Adaptive | Appears in interventions list | None | Dashboard intervention label |
| COPY_DASHBOARD_INTERVENTION_LABEL_02 | `src/app/dashboard/page.tsx` | `What to protect` | Conditional/Adaptive | Appears in interventions list | None | Dashboard intervention label |
| COPY_DASHBOARD_INTERVENTION_LABEL_03 | `src/app/dashboard/page.tsx` | `What to add` | Conditional/Adaptive | Appears in interventions list | None | Dashboard intervention label |
| COPY_DASHBOARD_INTERVENTION_LABEL_04 | `src/app/dashboard/page.tsx` | `Place carefully` | Conditional/Adaptive | Added when busiest day exists and transition density threshold is met | `busiestDay.label` | Dashboard intervention label |
| COPY_DASHBOARD_PATTERN_TITLE_COMPRESSION_01 | `src/app/dashboard/page.tsx` | `Compression` | Conditional/Adaptive | Shown in balance feedback when load concentration or midweek concentration threshold is met | None | Dashboard feedback title |
| COPY_DASHBOARD_PATTERN_TEXT_COMPRESSION_01 | `src/app/dashboard/page.tsx` | `Too much demand is landing in one stretch, so margin may drop faster than total hours suggest.` | Conditional/Adaptive | Compression feedback condition | None | Dashboard feedback |
| COPY_DASHBOARD_PATTERN_TITLE_FALSE_OPENNESS_01 | `src/app/dashboard/page.tsx` | `False openness` | Conditional/Adaptive | Shown when squeezed blocks or fragmentation burden threshold is met | None | Dashboard feedback title |
| COPY_DASHBOARD_PATTERN_TEXT_FALSE_OPENNESS_01 | `src/app/dashboard/page.tsx` | `Some open-looking gaps are broken enough that they may not function as real work time.` | Conditional/Adaptive | When fragmentation cost is high and false openness condition is met | None | Dashboard feedback |
| COPY_DASHBOARD_PATTERN_TEXT_FALSE_OPENNESS_02 | `src/app/dashboard/page.tsx` | `Some open-looking gaps may behave more like overflow space than real margin.` | Conditional/Adaptive | Default false openness feedback | None | Dashboard feedback |
| COPY_DASHBOARD_PATTERN_TITLE_RECOVERY_MISMATCH_01 | `src/app/dashboard/page.tsx` | `Recovery mismatch` | Conditional/Adaptive | Shown when recovery minutes are low | None | Dashboard feedback title |
| COPY_DASHBOARD_PATTERN_TEXT_RECOVERY_MISMATCH_01 | `src/app/dashboard/page.tsx` | `Quiet reset is limited this week, so recovery may need more deliberate protection.` | Conditional/Adaptive | Quiet recovery high and recovery low | None | Dashboard feedback |
| COPY_DASHBOARD_PATTERN_TEXT_RECOVERY_MISMATCH_02 | `src/app/dashboard/page.tsx` | `Physical reset is limited this week, so support may feel thinner than the calendar shows.` | Conditional/Adaptive | Exercise recovery high, no exercise, recovery low | None | Dashboard feedback |
| COPY_DASHBOARD_PATTERN_TEXT_RECOVERY_MISMATCH_03 | `src/app/dashboard/page.tsx` | `Recovery is light or uneven, so effort may build as demands stack up.` | Conditional/Adaptive | Default recovery mismatch feedback | None | Dashboard feedback |
| COPY_DASHBOARD_PATTERN_TITLE_TRANSITION_01 | `src/app/dashboard/page.tsx` | `Transition overload` | Conditional/Adaptive | Shown when transition density threshold is met | None | Dashboard feedback title |
| COPY_DASHBOARD_PATTERN_TEXT_TRANSITION_01 | `src/app/dashboard/page.tsx` | `There are enough mode switches that changing gears may carry a real capacity cost.` | Conditional/Adaptive | Transition cost high and transition overload triggered | None | Dashboard feedback |
| COPY_DASHBOARD_PATTERN_TEXT_TRANSITION_02 | `src/app/dashboard/page.tsx` | `The schedule asks for a lot of switching, making open time less stable.` | Conditional/Adaptive | Default transition overload feedback | None | Dashboard feedback |
| COPY_DASHBOARD_PATTERN_TITLE_FATIGUE_01 | `src/app/dashboard/page.tsx` | `Fatigue accumulation` | Conditional/Adaptive | Shown when dense stretch is not followed by enough recovery | None | Dashboard feedback title |
| COPY_DASHBOARD_PATTERN_TEXT_FATIGUE_01 | `src/app/dashboard/page.tsx` | `A dense stretch without enough recovery afterward may wear on you progressively.` | Conditional/Adaptive | Fatigue accumulation condition | None | Dashboard feedback |
| COPY_DASHBOARD_PATTERN_TITLE_SOCIAL_DENSE_01 | `src/app/dashboard/page.tsx` | `Socially dense` | Conditional/Adaptive | Shown when social share threshold is met | None | Dashboard feedback title |
| COPY_DASHBOARD_PATTERN_TEXT_SOCIAL_DENSE_01 | `src/app/dashboard/page.tsx` | `Social time can restore you, but only if it is not pressed tightly against heavy commitments.` | Conditional/Adaptive | Social recovery value high and social density threshold is met | None | Dashboard feedback |
| COPY_DASHBOARD_PATTERN_TEXT_SOCIAL_DENSE_02 | `src/app/dashboard/page.tsx` | `Social time is prominent enough to shape the week, and may function more like demand than relief.` | Conditional/Adaptive | Default social density feedback | None | Dashboard feedback |

#### Recovery Islands: `src/app/dashboard/page.tsx` + `src/lib/dashboard-insights.ts` + `src/components/recovery-islands-visual.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_DASHBOARD_RECOVERY_TITLE_01 | `src/app/dashboard/page.tsx` | `Recovery Islands` | Conditional/Adaptive | Appears when at least 2 detectable recovery blocks exist | None | Dashboard recovery section |
| COPY_DASHBOARD_RECOVERY_PROFILE_TITLE_01 | `src/app/dashboard/page.tsx` | `Through your profile lens` | Conditional/Adaptive | Appears when recovery panel renders | None | Dashboard recovery section |
| COPY_DASHBOARD_RECOVERY_STAT_TITLE_01 | `src/app/dashboard/page.tsx` | `Scheduled recovery` | Conditional/Adaptive | Appears when recovery panel renders | None | Dashboard recovery section |
| COPY_DASHBOARD_RECOVERY_STAT_SUBTITLE_01 | `src/app/dashboard/page.tsx` | `across the week` | Conditional/Adaptive | Appears when recovery panel renders | None | Dashboard recovery section |
| COPY_DASHBOARD_RECOVERY_STAT_TITLE_02 | `src/app/dashboard/page.tsx` | `Most restorative day` | Conditional/Adaptive | Appears when recovery panel renders | None | Dashboard recovery section |
| COPY_DASHBOARD_RECOVERY_STAT_EMPTY_01 | `src/app/dashboard/page.tsx` | `None yet` | Conditional/Adaptive | Appears when no restorative day is found | None | Dashboard recovery section |
| COPY_DASHBOARD_RECOVERY_STAT_EMPTY_02 | `src/app/dashboard/page.tsx` | `No visible island` | Conditional/Adaptive | Appears when no restorative day is found | None | Dashboard recovery section |
| COPY_DASHBOARD_RECOVERY_FOOTNOTE_01 | `src/app/dashboard/page.tsx` | `These are islands, not quotas. Small moments add up.` | Conditional/Adaptive | Appears when recovery panel renders | None | Dashboard recovery section |
| COPY_DASHBOARD_RECOVERY_SUMMARY_01 | `src/lib/dashboard-insights.ts` | `Recovery is barely visible this week, so reset will need deliberate protection.` | Conditional/Adaptive | Default when `totalRecoveryMinutes` is 0 | None | Dashboard recovery summary |
| COPY_DASHBOARD_RECOVERY_SUMMARY_02 | `src/lib/dashboard-insights.ts` | `Recovery is visible across the week, with the clearest support around {formatDayList(topDays)}.` | Conditional/Adaptive | When active recovery appears on 4+ days | `topDays` | Dashboard recovery summary |
| COPY_DASHBOARD_RECOVERY_SUMMARY_03 | `src/lib/dashboard-insights.ts` | `Recovery is visible, but clusters around {formatDayList(topDays)}.` | Conditional/Adaptive | When recovery exists but active days are fewer than 4 | `topDays` | Dashboard recovery summary |
| COPY_DASHBOARD_RECOVERY_SUPPORTING_01 | `src/lib/dashboard-insights.ts` | `There is not enough visible support for a detailed read, so assume recovery needs deliberate placement.` | Conditional/Adaptive | Default when no visible scheduled recovery is found | None | Dashboard recovery supporting line |
| COPY_DASHBOARD_RECOVERY_SUPPORTING_02 | `src/lib/dashboard-insights.ts` | `Most scheduled support appears as {getRecoveryModeLabel(dominantTone).toLowerCase()}, with smaller pockets elsewhere.` | Conditional/Adaptive | When a dominant recovery mode is visible | `dominantTone` | Dashboard recovery supporting line |
| COPY_DASHBOARD_RECOVERY_PROFILE_BEST_01 | `src/lib/dashboard-insights.ts` | `Best with: movement before or after tighter stretches.` | Conditional/Adaptive | When exercise is preferred or exercise recovery value is very high | None | Recovery profile card |
| COPY_DASHBOARD_RECOVERY_PROFILE_BEST_02 | `src/lib/dashboard-insights.ts` | `Best with: buffered social support that still feels restorative.` | Conditional/Adaptive | When social recovery is preferred or very high | None | Recovery profile card |
| COPY_DASHBOARD_RECOVERY_PROFILE_BEST_03 | `src/lib/dashboard-insights.ts` | `Best with: longer quiet blocks and slower transitions.` | Conditional/Adaptive | Default recovery best-fit line | None | Recovery profile card |
| COPY_DASHBOARD_RECOVERY_PROFILE_VISIBLE_01 | `src/lib/dashboard-insights.ts` | `Already visible: recovery is fairly light.` | Conditional/Adaptive | Default when little recovery is present | None | Recovery profile card |
| COPY_DASHBOARD_RECOVERY_PROFILE_VISIBLE_02 | `src/lib/dashboard-insights.ts` | `Already visible: movement is showing up at useful points in the week.` | Conditional/Adaptive | When exercise is the dominant visible recovery mode | None | Recovery profile card |
| COPY_DASHBOARD_RECOVERY_PROFILE_VISIBLE_03 | `src/lib/dashboard-insights.ts` | `Already visible: meals and care routines are giving the week some structure.` | Conditional/Adaptive | When care is the dominant visible recovery mode | None | Recovery profile card |
| COPY_DASHBOARD_RECOVERY_PROFILE_VISIBLE_04 | `src/lib/dashboard-insights.ts` | `Already visible: explicit rest appears in a few useful pockets.` | Conditional/Adaptive | When rest is the dominant visible recovery mode | None | Recovery profile card |
| COPY_DASHBOARD_RECOVERY_PROFILE_VISIBLE_05 | `src/lib/dashboard-insights.ts` | `Already visible: social support is part of the recovery picture this week.` | Conditional/Adaptive | When social is the dominant visible recovery mode | None | Recovery profile card |
| COPY_DASHBOARD_RECOVERY_PROFILE_PRIORITY_01 | `src/lib/dashboard-insights.ts` | `Prioritize: protecting one or two recovery blocks.` | Conditional/Adaptive | Default priority line | None | Recovery profile card |
| COPY_DASHBOARD_RECOVERY_PROFILE_PRIORITY_02 | `src/lib/dashboard-insights.ts` | `Prioritize: movement near the tighter stretches.` | Conditional/Adaptive | When exercise is preferred/high and no exercise is visible | None | Recovery profile card |
| COPY_DASHBOARD_RECOVERY_PROFILE_PRIORITY_03 | `src/lib/dashboard-insights.ts` | `Prioritize: buffered social support that does not create extra switching.` | Conditional/Adaptive | When social is preferred/high and no social support is visible | None | Recovery profile card |
| COPY_DASHBOARD_RECOVERY_PROFILE_PRIORITY_04 | `src/lib/dashboard-insights.ts` | `Prioritize: meals/care or explicit rest before tighter stretches.` | Conditional/Adaptive | When no care/rest support is visible | None | Recovery profile card |
| COPY_DASHBOARD_RECOVERY_PROFILE_PRIORITY_05 | `src/lib/dashboard-insights.ts` | `Prioritize: keeping the recovery that is already visible intact.` | Conditional/Adaptive | When support is already visible and no stronger priority override applies | None | Recovery profile card |
| COPY_DASHBOARD_RECOVERY_MODE_LABEL_01 | `src/lib/dashboard-insights.ts` | `Movement` | Conditional/Adaptive | Used when exercise tone is referenced | None | Recovery mode label |
| COPY_DASHBOARD_RECOVERY_MODE_LABEL_02 | `src/lib/dashboard-insights.ts` | `Social support` | Conditional/Adaptive | Used when social tone is referenced | None | Recovery mode label |
| COPY_DASHBOARD_RECOVERY_MODE_LABEL_03 | `src/lib/dashboard-insights.ts` | `Meals / care` | Conditional/Adaptive | Used when care tone is referenced | None | Recovery mode label |
| COPY_DASHBOARD_RECOVERY_MODE_LABEL_04 | `src/lib/dashboard-insights.ts` | `Explicit rest` | Conditional/Adaptive | Used when rest tone is referenced | None | Recovery mode label |
| COPY_DASHBOARD_RECOVERY_PILL_LABEL_EXERCISE_01 | `src/lib/dashboard-insights.ts` | `Movement block` | Conditional/Adaptive | Recovery pill title for exercise segments | None | Recovery timeline capsule |
| COPY_DASHBOARD_RECOVERY_PILL_LABEL_SOCIAL_01 | `src/lib/dashboard-insights.ts` | `Social support` | Conditional/Adaptive | Recovery pill title for social segments | None | Recovery timeline capsule |
| COPY_DASHBOARD_RECOVERY_PILL_LABEL_CARE_01 | `src/lib/dashboard-insights.ts` | `Meals / care` | Conditional/Adaptive | Recovery pill title for care segments | None | Recovery timeline capsule |
| COPY_DASHBOARD_RECOVERY_PILL_LABEL_REST_01 | `src/lib/dashboard-insights.ts` | `Explicit rest` | Conditional/Adaptive | Recovery pill title for rest segments | None | Recovery timeline capsule |
| COPY_DASHBOARD_RECOVERY_TIME_BUCKET_MORNING_01 | `src/lib/dashboard-insights.ts` | `Morning` | Conditional/Adaptive | Recovery pill secondary label based on time bucket | None | Recovery timeline capsule |
| COPY_DASHBOARD_RECOVERY_TIME_BUCKET_AFTERNOON_01 | `src/lib/dashboard-insights.ts` | `Afternoon` | Conditional/Adaptive | Recovery pill secondary label based on time bucket | None | Recovery timeline capsule |
| COPY_DASHBOARD_RECOVERY_TIME_BUCKET_EVENING_01 | `src/lib/dashboard-insights.ts` | `Evening` | Conditional/Adaptive | Recovery pill secondary label based on time bucket | None | Recovery timeline capsule |
| COPY_DASHBOARD_RECOVERY_TIMELINE_TIME_01 | `src/components/recovery-islands-visual.tsx` | `7 AM` | Static | Always in recovery timeline | None | Recovery timeline axis |
| COPY_DASHBOARD_RECOVERY_TIMELINE_TIME_02 | `src/components/recovery-islands-visual.tsx` | `12 PM` | Static | Always in recovery timeline | None | Recovery timeline axis |
| COPY_DASHBOARD_RECOVERY_TIMELINE_TIME_03 | `src/components/recovery-islands-visual.tsx` | `6 PM` | Static | Always in recovery timeline | None | Recovery timeline axis |
| COPY_DASHBOARD_RECOVERY_TIMELINE_TIME_04 | `src/components/recovery-islands-visual.tsx` | `11 PM` | Static | Always in recovery timeline | None | Recovery timeline axis |
| COPY_DASHBOARD_RECOVERY_LEGEND_LABEL_01 | `src/components/recovery-islands-visual.tsx` | `Exercise` | Static | Always in legend | None | Recovery legend |
| COPY_DASHBOARD_RECOVERY_LEGEND_LABEL_02 | `src/components/recovery-islands-visual.tsx` | `Social support` | Static | Always in legend | None | Recovery legend |
| COPY_DASHBOARD_RECOVERY_LEGEND_LABEL_03 | `src/components/recovery-islands-visual.tsx` | `Meals / care` | Static | Always in legend | None | Recovery legend |
| COPY_DASHBOARD_RECOVERY_LEGEND_LABEL_04 | `src/components/recovery-islands-visual.tsx` | `Explicit rest` | Static | Always in legend | None | Recovery legend |
| COPY_DASHBOARD_RECOVERY_LEGEND_BODY_01 | `src/components/recovery-islands-visual.tsx` | `Movement that helps you reset.` | Static | Always in legend | None | Recovery legend |
| COPY_DASHBOARD_RECOVERY_LEGEND_BODY_02 | `src/components/recovery-islands-visual.tsx` | `Connection that restores perspective.` | Static | Always in legend | None | Recovery legend |
| COPY_DASHBOARD_RECOVERY_LEGEND_BODY_03 | `src/components/recovery-islands-visual.tsx` | `Meals and care routines that support recovery.` | Static | Always in legend | None | Recovery legend |
| COPY_DASHBOARD_RECOVERY_LEGEND_BODY_04 | `src/components/recovery-islands-visual.tsx` | `Planned rest that protects capacity.` | Static | Always in legend | None | Recovery legend |

#### Week composition: `src/app/dashboard/page.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_DASHBOARD_COMPOSITION_TITLE_01 | `src/app/dashboard/page.tsx` | `How your week is allocated` | Conditional/Adaptive | Appears when composition bars exist | None | Dashboard section |
| COPY_DASHBOARD_COMPOSITION_BAR_LABEL_01 | `src/app/dashboard/page.tsx` | `Work & class` | Conditional/Adaptive | Appears when composition bars exist | None | Dashboard section |
| COPY_DASHBOARD_COMPOSITION_BAR_LABEL_02 | `src/app/dashboard/page.tsx` | `Meetings & commitments` | Conditional/Adaptive | Appears when composition bars exist | None | Dashboard section |
| COPY_DASHBOARD_COMPOSITION_BAR_LABEL_03 | `src/app/dashboard/page.tsx` | `Social time` | Conditional/Adaptive | Appears when composition bars exist | None | Dashboard section |
| COPY_DASHBOARD_COMPOSITION_BAR_LABEL_04 | `src/app/dashboard/page.tsx` | `Recovery & solo time` | Conditional/Adaptive | Appears when composition bars exist | None | Dashboard section |
| COPY_DASHBOARD_COMPOSITION_OPEN_CAPACITY_01 | `src/app/dashboard/page.tsx` | `Unallocated time: {formatMinutesAsHours(composition.openMinutes)} this week` | Conditional/Adaptive | Appears when composition bars exist | `composition.openMinutes` | Dashboard section |

#### Week-analysis report observations/suggestions used in history and sparse dashboard fallbacks

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_DASHBOARD_SPARSE_OBSERVATION_01 | `src/lib/week-analysis.ts` | `The next seven days are lightly scheduled across the included calendars, so this is a lower-confidence read.` | Conditional/Adaptive | Sparse report when no classified events are present | None | Sparse report observations |
| COPY_DASHBOARD_SPARSE_OBSERVATION_02 | `src/lib/week-analysis.ts` | `Most of the week is unclaimed, so your own planning will shape it.` | Conditional/Adaptive | Sparse report when no classified events are present | None | Sparse report observations |
| COPY_DASHBOARD_SPARSE_OBSERVATION_03 | `src/lib/week-analysis.ts` | `If you want clean progress, protect one {desiredBlockMinutes}-minute block before smaller plans fill the week.` | Conditional/Adaptive | Sparse report when no classified events are present | `desiredBlockMinutes` | Sparse report observations |
| COPY_DASHBOARD_SPARSE_SUGGESTION_01 | `src/lib/week-analysis.ts` | `Protect one {desiredBlockMinutes}-minute block early for your most demanding work.` | Conditional/Adaptive | Sparse report suggestion | `desiredBlockMinutes` | Sparse report suggestion |
| COPY_DASHBOARD_SPARSE_SUGGESTION_02 | `src/lib/week-analysis.ts` | `Use the lighter schedule to decide in advance which open time is for focus and which is for recovery or admin.` | Conditional/Adaptive | Sparse report suggestion | None | Sparse report suggestion |

---

## Settings

### Route: `/settings`

#### Component: `src/app/settings/page.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_SETTINGS_GOOGLE_TITLE_01 | `src/app/settings/page.tsx` | `Google Calendar` | Static | Always | None | Settings integration card |
| COPY_SETTINGS_GOOGLE_EYEBROW_01 | `src/app/settings/page.tsx` | `Integration` | Static | Always | None | Settings integration card |
| COPY_SETTINGS_GOOGLE_DESC_01 | `src/app/settings/page.tsx` | `Read-only access to the Google calendars you include for the next 7 days.` | Static | Always | None | Settings integration card |
| COPY_SETTINGS_GOOGLE_STATE_RESET_01 | `src/app/settings/page.tsx` | `Local Google account state was cleared. Reconnect Google Calendar to create one clean account row.` | Conditional/Adaptive | Appears when `googleStateReset=1` | None | Settings success state |
| COPY_SETTINGS_GOOGLE_LINKED_01 | `src/app/settings/page.tsx` | `Google Calendar connected. Your saved profile is still in place, and your dashboard is ready for week analysis.` | Conditional/Adaptive | Appears when `googleLinked=1` | None | Settings success state |
| COPY_SETTINGS_GOOGLE_CALENDARS_SAVED_01 | `src/app/settings/page.tsx` | `Included calendars updated. Re-analyze your week when you want a fresh read from the new set.` | Conditional/Adaptive | Appears when `calendarSelectionSaved=1` | None | Settings success state |
| COPY_SETTINGS_GOOGLE_STATUS_CONNECTED_01 | `src/app/settings/page.tsx` | `Connected and ready` | Conditional/Adaptive | When Google UI status is `connected_ready` | None | Settings integration state |
| COPY_SETTINGS_GOOGLE_STATUS_RECONNECT_01 | `src/app/settings/page.tsx` | `Reconnect needed` | Conditional/Adaptive | When Google UI status is `reconnect_needed` | None | Settings integration state |
| COPY_SETTINGS_GOOGLE_STATUS_MISSING_ACCESS_01 | `src/app/settings/page.tsx` | `Calendar access missing` | Conditional/Adaptive | When Google UI status is `missing_calendar_access` | None | Settings integration state |
| COPY_SETTINGS_GOOGLE_STATUS_PROVIDER_RESTRICTED_01 | `src/app/settings/page.tsx` | `Provider access restricted` | Conditional/Adaptive | When Google UI status is `provider_access_restricted` | None | Settings integration state |
| COPY_SETTINGS_GOOGLE_STATUS_NOT_CONNECTED_01 | `src/app/settings/page.tsx` | `Not connected` | Conditional/Adaptive | When Google UI status is `not_connected` | None | Settings integration state |
| COPY_SETTINGS_GOOGLE_STATUS_NEXT7_01 | `src/app/settings/page.tsx` | `Next 7 days` | Static | Always | None | Settings integration status pill |
| COPY_SETTINGS_GOOGLE_BODY_01 | `src/app/settings/page.tsx` | `Headroom reads only the Google calendars you include here, never writes to them, and only analyzes the next seven days. Event names may be read briefly to classify them into broad categories, but only the categories and derived insights are stored.` | Static | Always | None | Settings integration explainer |
| COPY_SETTINGS_GOOGLE_CONNECT_DISABLED_01 | `src/app/settings/page.tsx` | `Connect Google Calendar` | Conditional/Adaptive | Disabled button text when OAuth is not configured | None | Settings CTA |
| COPY_SETTINGS_GOOGLE_DISCONNECT_01 | `src/app/settings/page.tsx` | `Disconnect` | Conditional/Adaptive | Appears when an account exists | None | Settings CTA |
| COPY_SETTINGS_GOOGLE_OPEN_DASHBOARD_01 | `src/app/settings/page.tsx` | `Open Dashboard` | Static | Always in action row | None | Settings CTA |
| COPY_SETTINGS_GOOGLE_SELECTION_TITLE_01 | `src/app/settings/page.tsx` | `Calendars included in analysis` | Static | Always | None | Source-selection card |
| COPY_SETTINGS_GOOGLE_SELECTION_EYEBROW_01 | `src/app/settings/page.tsx` | `Source selection` | Static | Always | None | Source-selection card |
| COPY_SETTINGS_GOOGLE_SELECTION_DESC_01 | `src/app/settings/page.tsx` | `Choose which readable Google calendars Headroom should merge into the weekly read.` | Static | Always | None | Source-selection card |
| COPY_SETTINGS_GOOGLE_CALENDAR_PRIMARY_01 | `src/app/settings/page.tsx` | `Primary calendar` | Conditional/Adaptive | Appears per calendar when `calendar.primary` is true | None | Calendar selector |
| COPY_SETTINGS_GOOGLE_CALENDAR_OWNED_01 | `src/app/settings/page.tsx` | `Owned calendar` | Conditional/Adaptive | Appears per calendar when accessRole is owner and not primary | None | Calendar selector |
| COPY_SETTINGS_GOOGLE_CALENDAR_SHARED_01 | `src/app/settings/page.tsx` | `Shared readable calendar` | Conditional/Adaptive | Appears per calendar otherwise | None | Calendar selector |
| COPY_SETTINGS_GOOGLE_SELECTION_HELPER_01 | `src/app/settings/page.tsx` | `If you change the included calendars, Headroom clears the current cached report so the next analysis reflects the new source set.` | Conditional/Adaptive | Appears when readable calendars are available | None | Calendar selector helper |
| COPY_SETTINGS_GOOGLE_SELECTION_SAVE_01 | `src/app/settings/page.tsx` | `Save included calendars` | Conditional/Adaptive | Appears when readable calendars are available | None | Calendar selector action |
| COPY_SETTINGS_GOOGLE_SELECTION_EMPTY_01 | `src/app/settings/page.tsx` | `Connect Google Calendar with read-only access before choosing which calendars are included in the weekly analysis.` | Conditional/Adaptive | Appears when connection is not ready or no readable calendars are available | None | Calendar selector empty state |
| COPY_SETTINGS_PROFILE_TITLE_01 | `src/app/settings/page.tsx` | `Work & Recovery Profile` | Static | Always | None | Saved-profile card |
| COPY_SETTINGS_PROFILE_EYEBROW_01 | `src/app/settings/page.tsx` | `Saved profile` | Static | Always | None | Saved-profile card |
| COPY_SETTINGS_PROFILE_DESC_01 | `src/app/settings/page.tsx` | `A quick read of how the planner sees your week.` | Static | Always | None | Saved-profile card |
| COPY_SETTINGS_PROFILE_SAVED_BADGE_01 | `src/app/settings/page.tsx` | `Profile saved` | Conditional/Adaptive | Appears when `profileSaved=1` | None | Settings success state |
| COPY_SETTINGS_PROFILE_ACTION_01 | `src/app/settings/page.tsx` | `Retake quiz` | Conditional/Adaptive | Appears when a profile exists | None | Settings profile action |
| COPY_SETTINGS_PROFILE_EMPTY_01 | `src/app/settings/page.tsx` | `Complete the onboarding quiz to create your first profile.` | Conditional/Adaptive | Appears when no profile exists | None | Settings empty state |

#### Adaptive Google connection copy: `src/app/settings/page.tsx` + `src/lib/google-calendar-ui.ts`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_SETTINGS_GOOGLE_COPY_CONNECTED_FRESH_01 | `src/app/settings/page.tsx` | `Google Calendar is connected, and the current week has already been analyzed.` | Conditional/Adaptive | Connected and a fresh report exists | None | Settings integration summary |
| COPY_SETTINGS_GOOGLE_COPY_CONNECTED_NEEDS_ANALYSIS_01 | `src/app/settings/page.tsx` | `Google Calendar is connected. Your next step is to analyze the current week.` | Conditional/Adaptive | Connected but no fresh report exists | None | Settings integration summary |
| COPY_SETTINGS_GOOGLE_COPY_RECONNECT_01 | `src/app/settings/page.tsx` | `Google Calendar access expired. Reconnect Google Calendar.` | Conditional/Adaptive | Reconnect needed | None | Settings integration summary |
| COPY_SETTINGS_GOOGLE_COPY_MISSING_ACCESS_01 | `src/app/settings/page.tsx` | `This Google account is linked, but it does not currently include read-only calendar access.` | Conditional/Adaptive | Missing calendar access | None | Settings integration summary |
| COPY_SETTINGS_GOOGLE_COPY_PROVIDER_RESTRICTED_01 | `src/app/settings/page.tsx` | `Google sign-in succeeded, but this account cannot currently expose calendar data to Headroom.` | Conditional/Adaptive | Provider access restricted | None | Settings integration summary |
| COPY_SETTINGS_GOOGLE_COPY_NOT_CONNECTED_01 | `src/app/settings/page.tsx` | `Connect Google Calendar to analyze the next seven days through your profile.` | Conditional/Adaptive | Not connected | None | Settings integration summary |
| COPY_SETTINGS_GOOGLE_NEXTSTEP_CONNECTED_FRESH_01 | `src/app/settings/page.tsx` | `Re-analyze any time if you want a fresh read.` | Conditional/Adaptive | Connected and a fresh report exists | None | Settings integration next-step |
| COPY_SETTINGS_GOOGLE_NEXTSTEP_CONNECTED_NEEDS_ANALYSIS_01 | `src/app/settings/page.tsx` | `Analyze your week from the Dashboard.` | Conditional/Adaptive | Connected but no fresh report exists | None | Settings integration next-step |
| COPY_SETTINGS_GOOGLE_NEXTSTEP_PROVIDER_RESTRICTED_01 | `src/app/settings/page.tsx` | `Review account access restrictions, then reconnect.` | Conditional/Adaptive | Provider access restricted | None | Settings integration next-step |
| COPY_SETTINGS_GOOGLE_NEXTSTEP_MISSING_ACCESS_01 | `src/app/settings/page.tsx` | `Reconnect Google Calendar and approve read-only calendar access.` | Conditional/Adaptive | Missing access | None | Settings integration next-step |
| COPY_SETTINGS_GOOGLE_NEXTSTEP_RECONNECT_01 | `src/app/settings/page.tsx` | `Reconnect Google Calendar, then run a fresh analysis.` | Conditional/Adaptive | Reconnect needed | None | Settings integration next-step |
| COPY_SETTINGS_GOOGLE_NEXTSTEP_NOT_CONNECTED_01 | `src/app/settings/page.tsx` | `Connect Google Calendar to get started.` | Conditional/Adaptive | Not connected | None | Settings integration next-step |
| COPY_SETTINGS_GOOGLE_PRIMARY_ACTION_CONNECT_01 | `src/app/settings/page.tsx` | `Connect Google Calendar` | Conditional/Adaptive | Primary action when not connected | None | Settings CTA |
| COPY_SETTINGS_GOOGLE_PRIMARY_ACTION_RECONNECT_01 | `src/app/settings/page.tsx` | `Reconnect Google Calendar` | Conditional/Adaptive | Primary action when connected or reconnect-needed | None | Settings CTA |
| COPY_SETTINGS_GOOGLE_OAUTH_NOT_CONFIGURED_01 | `src/app/settings/page.tsx` | `Local Google OAuth is not configured yet. Add a real localhost Google client ID and secret in .env.local, then restart the dev server.` | Conditional/Adaptive | Appears when local Google OAuth is not configured | None | Settings warning |
| COPY_SETTINGS_CALSUMMARY_NONE_LABEL_01 | `src/lib/google-calendar-ui.ts` | `No calendars selected` | Conditional/Adaptive | Included calendar summary when selection count is 0 | None | Settings/dashboard status pill |
| COPY_SETTINGS_CALSUMMARY_NONE_DETAIL_01 | `src/lib/google-calendar-ui.ts` | `Choose which calendars Headroom should include in analysis.` | Conditional/Adaptive | Included calendar summary when selection count is 0 | None | Settings/dashboard helper text |
| COPY_SETTINGS_CALSUMMARY_ONE_LABEL_01 | `src/lib/google-calendar-ui.ts` | `1 calendar included` | Conditional/Adaptive | Included calendar summary when count is 1 | None | Settings/dashboard status pill |
| COPY_SETTINGS_CALSUMMARY_ONE_DETAIL_01 | `src/lib/google-calendar-ui.ts` | `Primary calendar included` | Conditional/Adaptive | Included calendar summary when the one selected calendar is primary | None | Settings/dashboard helper text |
| COPY_SETTINGS_CALSUMMARY_ONE_DETAIL_02 | `src/lib/google-calendar-ui.ts` | `One calendar included` | Conditional/Adaptive | Included calendar summary fallback when one calendar is selected but summary is unavailable | None | Settings/dashboard helper text |
| COPY_SETTINGS_CALSUMMARY_MULTI_LABEL_01 | `src/lib/google-calendar-ui.ts` | `{selectedCalendars.length} calendars included` | Conditional/Adaptive | Included calendar summary when 2 calendars are selected and readable | `selectedCalendars.length` | Settings/dashboard status pill |
| COPY_SETTINGS_CALSUMMARY_MULTI_LABEL_02 | `src/lib/google-calendar-ui.ts` | `{count} calendars included` | Conditional/Adaptive | Included calendar summary when more than 2 calendars are selected or only raw IDs are available | `count` | Settings/dashboard status pill |
| COPY_SETTINGS_CALSUMMARY_MULTI_DETAIL_01 | `src/lib/google-calendar-ui.ts` | `Multiple calendars included` | Conditional/Adaptive | Included calendar summary fallback when names are unavailable | None | Settings/dashboard helper text |

---

## History

### Route: `/history`

#### Component: `src/app/history/page.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_HISTORY_EYEBROW_01 | `src/app/history/page.tsx` | `Week to week` | Static | Always | None | History hero |
| COPY_HISTORY_TITLE_01 | `src/app/history/page.tsx` | `Compare how your weeks are carrying` | Static | Always | None | History hero |
| COPY_HISTORY_BODY_01 | `src/app/history/page.tsx` | `Headroom keeps a lightweight summary of prior analyzed weeks so you can compare load, openness, and planning conditions over time without storing raw event names.` | Static | Always | None | History hero |
| COPY_HISTORY_EMPTY_TITLE_01 | `src/app/history/page.tsx` | `No history yet` | Conditional/Adaptive | Appears when no history entries exist | None | History empty state |
| COPY_HISTORY_EMPTY_BODY_01 | `src/app/history/page.tsx` | `No previous weekly analysis exists yet. Come back in seven days to review how your planning compares week to week.` | Conditional/Adaptive | Appears when no history entries exist | None | History empty state |
| COPY_HISTORY_LOADLABEL_HEAVY_01 | `src/app/history/page.tsx` | `Heavy` | Conditional/Adaptive | Overall load score 72+ | None | History entry label |
| COPY_HISTORY_LOADLABEL_TIGHT_01 | `src/app/history/page.tsx` | `Tight` | Conditional/Adaptive | Overall load score 45–71 | None | History entry label |
| COPY_HISTORY_LOADLABEL_BALANCED_01 | `src/app/history/page.tsx` | `Balanced` | Conditional/Adaptive | Overall load score below 45 | None | History entry label |
| COPY_HISTORY_SAVED_AT_01 | `src/app/history/page.tsx` | `Saved {formatDateTime(entry.analyzedAt)}` | Conditional/Adaptive | Per history entry | `entry.analyzedAt` | History entry metadata |
| COPY_HISTORY_LOAD_BADGE_01 | `src/app/history/page.tsx` | `{entry.overallLoadScore}/99 load` | Conditional/Adaptive | Per history entry | `entry.overallLoadScore` | History badge |
| COPY_HISTORY_COMMITTED_BADGE_01 | `src/app/history/page.tsx` | `{formatHours(entry.derivedMetrics.totalCommittedMinutes)} committed` | Conditional/Adaptive | Per history entry | `entry.derivedMetrics.totalCommittedMinutes` | History badge |
| COPY_HISTORY_OPEN_BADGE_01 | `src/app/history/page.tsx` | `{formatHours(entry.derivedMetrics.totalOpenMinutes)} open` | Conditional/Adaptive | Per history entry | `entry.derivedMetrics.totalOpenMinutes` | History badge |
| COPY_HISTORY_STOOD_OUT_01 | `src/app/history/page.tsx` | `What stood out` | Conditional/Adaptive | Per history entry | None | History section |
| COPY_HISTORY_SNAPSHOT_01 | `src/app/history/page.tsx` | `Snapshot` | Conditional/Adaptive | Per history entry | None | History section |
| COPY_HISTORY_SNAPSHOT_WORK_01 | `src/app/history/page.tsx` | `Work / class: {formatHours(entry.derivedMetrics.workClassMinutes)}` | Conditional/Adaptive | Per history entry | `entry.derivedMetrics.workClassMinutes` | History snapshot |
| COPY_HISTORY_SNAPSHOT_MEETINGS_01 | `src/app/history/page.tsx` | `Meetings / structured: {formatHours(entry.derivedMetrics.meetingsStructuredMinutes)}` | Conditional/Adaptive | Per history entry | `entry.derivedMetrics.meetingsStructuredMinutes` | History snapshot |
| COPY_HISTORY_SNAPSHOT_RECOVERY_01 | `src/app/history/page.tsx` | `Recovery / solo: {formatHours(entry.derivedMetrics.recoverySoloMinutes)}` | Conditional/Adaptive | Per history entry | `entry.derivedMetrics.recoverySoloMinutes` | History snapshot |
| COPY_HISTORY_SNAPSHOT_SOCIAL_01 | `src/app/history/page.tsx` | `Social: {formatHours(entry.derivedMetrics.socialMinutes)}` | Conditional/Adaptive | Per history entry | `entry.derivedMetrics.socialMinutes` | History snapshot |

#### Adaptive comparison strings: `src/app/history/page.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_HISTORY_COMPARISON_EARLIEST_01 | `src/app/history/page.tsx` | `This is the earliest saved week in your history so far.` | Conditional/Adaptive | Appears when there is no previous week to compare against | None | History comparison |
| COPY_HISTORY_COMPARISON_LOAD_UP_01 | `src/app/history/page.tsx` | `The overall load climbed noticeably from the week before.` | Conditional/Adaptive | When `loadDelta >= 8` | `loadDelta` | History comparison |
| COPY_HISTORY_COMPARISON_LOAD_DOWN_01 | `src/app/history/page.tsx` | `The overall load eased meaningfully from the week before.` | Conditional/Adaptive | When `loadDelta <= -8` | `loadDelta` | History comparison |
| COPY_HISTORY_COMPARISON_LOAD_STEADY_01 | `src/app/history/page.tsx` | `The overall load stayed fairly close to the week before.` | Conditional/Adaptive | Default load comparison | None | History comparison |
| COPY_HISTORY_COMPARISON_COMMITTED_UP_01 | `src/app/history/page.tsx` | `Committed time rose by about {formatHours(committedDelta)}.` | Conditional/Adaptive | When `committedDelta >= 120` | `committedDelta` | History comparison |
| COPY_HISTORY_COMPARISON_COMMITTED_DOWN_01 | `src/app/history/page.tsx` | `Committed time fell by about {formatHours(Math.abs(committedDelta))}.` | Conditional/Adaptive | When `committedDelta <= -120` | `committedDelta` | History comparison |
| COPY_HISTORY_COMPARISON_COMMITTED_STEADY_01 | `src/app/history/page.tsx` | `Committed time stayed in a similar range.` | Conditional/Adaptive | Default committed-time comparison | None | History comparison |
| COPY_HISTORY_COMPARISON_OPEN_UP_01 | `src/app/history/page.tsx` | `Open time expanded by about {formatHours(openDelta)}.` | Conditional/Adaptive | When `openDelta >= 120` | `openDelta` | History comparison |
| COPY_HISTORY_COMPARISON_OPEN_DOWN_01 | `src/app/history/page.tsx` | `Open time narrowed by about {formatHours(Math.abs(openDelta))}.` | Conditional/Adaptive | When `openDelta <= -120` | `openDelta` | History comparison |
| COPY_HISTORY_COMPARISON_OPEN_STEADY_01 | `src/app/history/page.tsx` | `Open time stayed broadly similar.` | Conditional/Adaptive | Default open-time comparison | None | History comparison |

---

## Google Connect Route

### Route: `/connect/google` or equivalent redirect surface

#### Component: `src/components/google-connect-redirect.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_GOOGLE_CONNECT_EYEBROW_01 | `src/components/google-connect-redirect.tsx` | `Google Calendar` | Static | Always | None | Reconnect/connect redirect page |
| COPY_GOOGLE_CONNECT_TITLE_01 | `src/components/google-connect-redirect.tsx` | `Connecting your calendar` | Static | Always | None | Reconnect/connect redirect page |
| COPY_GOOGLE_CONNECT_BODY_01 | `src/components/google-connect-redirect.tsx` | `We're opening Google sign-in and will return you to Settings when the connection is complete.` | Static | Always | None | Reconnect/connect redirect page |

---

## Tasks

### Route: `/tasks`

#### Component: `src/app/tasks/page.tsx`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_TASKS_PAGE_HEADING_01 | `src/app/tasks/page.tsx` | `Tasks` | Static | Always | None | App shell heading |
| COPY_TASKS_INPUT_TITLE_01 | `src/app/tasks/page.tsx` | `Add a task` | Static | Always | None | Task input card |
| COPY_TASKS_INPUT_EYEBROW_01 | `src/app/tasks/page.tsx` | `Task input` | Static | Always | None | Task input card |
| COPY_TASKS_INPUT_DESC_01 | `src/app/tasks/page.tsx` | `Keep it quick. Extra friction tags are optional.` | Static | Always | None | Task input card |
| COPY_TASKS_FIELD_TITLE_01 | `src/app/tasks/page.tsx` | `Title` | Static | Always | None | Form label |
| COPY_TASKS_PLACEHOLDER_TITLE_01 | `src/app/tasks/page.tsx` | `Lab report draft` | Static | Always | None | Form placeholder |
| COPY_TASKS_FIELD_DUE_01 | `src/app/tasks/page.tsx` | `Due date & time` | Static | Always | None | Form label |
| COPY_TASKS_FIELD_ESTIMATE_01 | `src/app/tasks/page.tsx` | `Estimated hours` | Static | Always | None | Form label |
| COPY_TASKS_FIELD_TYPE_01 | `src/app/tasks/page.tsx` | `Task type` | Static | Always | None | Form label |
| COPY_TASKS_FIELD_PROJECT_01 | `src/app/tasks/page.tsx` | `Project or course` | Static | Always | None | Form label |
| COPY_TASKS_PLACEHOLDER_PROJECT_01 | `src/app/tasks/page.tsx` | `Psych 101` | Static | Always | None | Form placeholder |
| COPY_TASKS_FIELD_AMBIGUITY_01 | `src/app/tasks/page.tsx` | `Ambiguity level` | Static | Always | None | Form label |
| COPY_TASKS_PLACEHOLDER_AMBIGUITY_01 | `src/app/tasks/page.tsx` | `1-5` | Static | Always | None | Form placeholder |
| COPY_TASKS_FIELD_FRICTION_01 | `src/app/tasks/page.tsx` | `Emotional friction` | Static | Always | None | Form label |
| COPY_TASKS_PLACEHOLDER_FRICTION_01 | `src/app/tasks/page.tsx` | `1-5` | Static | Always | None | Form placeholder |
| COPY_TASKS_FIELD_NOTES_01 | `src/app/tasks/page.tsx` | `Notes` | Static | Always | None | Form label |
| COPY_TASKS_PLACEHOLDER_NOTES_01 | `src/app/tasks/page.tsx` | `Optional context, subtasks, or reminders` | Static | Always | None | Form placeholder |
| COPY_TASKS_FIELD_UNINTERRUPTED_01 | `src/app/tasks/page.tsx` | `Requires a more uninterrupted block` | Static | Always | None | Form label |
| COPY_TASKS_SAVE_01 | `src/app/tasks/page.tsx` | `Save task` | Static | Always | None | Form action |
| COPY_TASKS_QUEUE_TITLE_01 | `src/app/tasks/page.tsx` | `Upcoming tasks` | Static | Always | None | Queue card |
| COPY_TASKS_QUEUE_EYEBROW_01 | `src/app/tasks/page.tsx` | `Current queue` | Static | Always | None | Queue card |
| COPY_TASKS_QUEUE_DESC_01 | `src/app/tasks/page.tsx` | `Complete or archive anything that should stop influencing planning.` | Static | Always | None | Queue card |
| COPY_TASKS_DUE_01 | `src/app/tasks/page.tsx` | `Due {formatDateTime(task.dueAt)} ({formatRelativeDue(task.dueAt)})` | Conditional/Adaptive | Per task row | `task.dueAt` | Queue item metadata |
| COPY_TASKS_ESTIMATE_01 | `src/app/tasks/page.tsx` | `{Number(task.estimatedHours).toFixed(2)}h estimate{task.projectLabel ? \` • \${task.projectLabel}\` : ""}` | Conditional/Adaptive | Per task row | `task.estimatedHours`, `task.projectLabel` | Queue item metadata |
| COPY_TASKS_STATUS_ACTIVE_01 | `src/app/tasks/page.tsx` | `Active` | Static | Per task status action | None | Queue item action |
| COPY_TASKS_STATUS_COMPLETE_01 | `src/app/tasks/page.tsx` | `Complete` | Static | Per task status action | None | Queue item action |
| COPY_TASKS_STATUS_ARCHIVE_01 | `src/app/tasks/page.tsx` | `Archive` | Static | Per task status action | None | Queue item action |
| COPY_TASKS_EMPTY_01 | `src/app/tasks/page.tsx` | `Add at least three tasks so the weekly dashboard has enough signal to compare deadlines against your calendar windows.` | Conditional/Adaptive | Appears when there are no tasks | None | Queue empty state |

#### Task action errors: `src/app/actions/tasks.ts`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_TASKS_ERROR_SAVE_FAILED_01 | `src/app/actions/tasks.ts` | `Unable to save task.` | Conditional/Adaptive | Thrown when task form parsing fails without a more specific schema message | None | Task error state |

#### Shared task-type labels: `src/lib/constants.ts`

| ID | Component/File | Exact current text | Type | Condition | Variables | Notes |
|---|---|---|---|---|---|---|
| COPY_TASKS_TYPE_DEEP_WORK_01 | `src/lib/constants.ts` | `Deep Work` | Static | Visible in task type select and task badges | None | Tasks route |
| COPY_TASKS_TYPE_PROBLEM_SOLVING_01 | `src/lib/constants.ts` | `Problem Solving` | Static | Visible in task type select and task badges | None | Tasks route |
| COPY_TASKS_TYPE_READING_01 | `src/lib/constants.ts` | `Reading` | Static | Visible in task type select and task badges | None | Tasks route |
| COPY_TASKS_TYPE_WRITING_01 | `src/lib/constants.ts` | `Writing` | Static | Visible in task type select and task badges | None | Tasks route |
| COPY_TASKS_TYPE_ADMIN_01 | `src/lib/constants.ts` | `Admin` | Static | Visible in task type select and task badges | None | Tasks route |
| COPY_TASKS_TYPE_SOCIAL_01 | `src/lib/constants.ts` | `Social / Interpersonal` | Static | Visible in task type select and task badges | None | Tasks route |
| COPY_TASKS_TYPE_ERRANDS_01 | `src/lib/constants.ts` | `Errands / Logistics` | Static | Visible in task type select and task badges | None | Tasks route |

---

## Notes on Exclusions

- Developer/debug panels, traces, and internal-only debug strings were excluded unless they currently appear in user-visible flows.
- Invisible helper text that never renders (for example, option hints in the quiz data model) was excluded.
- Internal error strings that only throw server exceptions without a rendered user-facing surface were included only where they plausibly surface to the user via action errors.


