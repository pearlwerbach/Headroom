import { z } from "zod";
import { quizQuestions } from "@/lib/onboarding";

const quizAnswerSchema = z.record(z.string(), z.string());

export const onboardingSchema = z.object({
  answers: quizAnswerSchema.superRefine((answers, ctx) => {
    for (const question of quizQuestions) {
      const answer = answers[question.id];

      if (!answer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing answer for ${question.id}.`,
          path: [question.id],
        });
        continue;
      }

      const validAnswers = question.options.map((option) => option.value);

      if (!validAnswers.includes(answer as (typeof validAnswers)[number])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid answer for ${question.id}.`,
          path: [question.id],
        });
      }
    }
  }),
});

export const taskFormSchema = z.object({
  title: z.string().trim().min(2, "Add a task title."),
  dueAt: z.coerce.date(),
  estimatedHours: z.coerce
    .number({ message: "Estimated effort is required." })
    .min(0.25, "Use at least 0.25 hours.")
    .max(40, "Keep single-task estimates under 40 hours."),
  taskType: z.enum([
    "deep_work",
    "problem_solving",
    "reading",
    "writing",
    "admin",
    "social_interpersonal",
    "errands_logistics",
  ]),
  projectLabel: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  ambiguityLevel: z.coerce.number().min(1).max(5).optional(),
  emotionalFriction: z.coerce.number().min(1).max(5).optional(),
  requiresUninterruptedBlock: z.boolean().default(false),
  status: z.enum(["active", "completed", "archived"]).default("active"),
});

export const feedbackSchema = z.object({
  recommendationId: z.string().min(1),
  value: z.enum(["useful", "not_useful"]),
});

export const eventOverrideSchema = z.object({
  eventId: z.string().min(1),
  type: z.enum(["demand", "recovery", "neutral", "mixed"]),
});
