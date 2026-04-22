import { addDays, addHours, startOfDay } from "date-fns";

export function buildSeedEvents(now = new Date()) {
  const today = startOfDay(now);

  return [
    {
      externalId: "seed-class-1",
      title: "Cognitive Science Seminar",
      description: "Weekly seminar",
      location: "Dwinelle 155",
      startTime: addHours(addDays(today, 1), 10),
      endTime: addHours(addDays(today, 1), 11.5),
      allDay: false,
      inferredType: "demand" as const,
      source: "seed",
    },
    {
      externalId: "seed-workout",
      title: "Gym + stretch",
      description: null,
      location: "RSF",
      startTime: addHours(addDays(today, 1), 17),
      endTime: addHours(addDays(today, 1), 18),
      allDay: false,
      inferredType: "recovery" as const,
      source: "seed",
    },
    {
      externalId: "seed-office-hours",
      title: "Office Hours",
      description: null,
      location: "Zoom",
      startTime: addHours(addDays(today, 2), 13),
      endTime: addHours(addDays(today, 2), 14),
      allDay: false,
      inferredType: "demand" as const,
      source: "seed",
    },
    {
      externalId: "seed-dinner",
      title: "Dinner with friends",
      description: null,
      location: "Elmwood",
      startTime: addHours(addDays(today, 3), 19),
      endTime: addHours(addDays(today, 3), 21),
      allDay: false,
      inferredType: "mixed" as const,
      source: "seed",
    },
  ];
}

export function buildSeedTasks(now = new Date()) {
  return [
    {
      title: "Lab report draft",
      dueAt: addDays(now, 3),
      estimatedHours: "4.00",
      taskType: "writing" as const,
      projectLabel: "Neuro Lab",
      ambiguityLevel: 4,
      emotionalFriction: 3,
      requiresUninterruptedBlock: true,
      status: "active" as const,
      notes: "Need a first pass before Friday.",
    },
    {
      title: "Problem set 6",
      dueAt: addDays(now, 2),
      estimatedHours: "3.50",
      taskType: "problem_solving" as const,
      projectLabel: "Stats",
      ambiguityLevel: 2,
      emotionalFriction: 2,
      requiresUninterruptedBlock: true,
      status: "active" as const,
      notes: "Two questions are computationally heavy.",
    },
    {
      title: "Read methods paper",
      dueAt: addDays(now, 4),
      estimatedHours: "1.25",
      taskType: "reading" as const,
      projectLabel: "Seminar",
      ambiguityLevel: 1,
      emotionalFriction: 1,
      requiresUninterruptedBlock: false,
      status: "active" as const,
      notes: "Annotate key figures.",
    },
    {
      title: "Reply to internship emails",
      dueAt: addDays(now, 1),
      estimatedHours: "0.50",
      taskType: "admin" as const,
      projectLabel: "Career",
      ambiguityLevel: 1,
      emotionalFriction: 2,
      requiresUninterruptedBlock: false,
      status: "active" as const,
      notes: "Keep it short and warm.",
    },
  ];
}
