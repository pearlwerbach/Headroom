import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { createTaskAction, updateTaskStatusAction } from "@/app/actions/tasks";
import { TASK_TYPE_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDateTime, formatRelativeDue } from "@/lib/utils";

export default async function TasksPage() {
  const user = await requireUser();
  const [profile, tasks] = await Promise.all([
    prisma.workProfile.findUnique({ where: { userId: user.id } }),
    prisma.task.findMany({
      where: { userId: user.id },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    }),
  ]);

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <AppShell
      heading="Tasks"
      userName={user.name}
    >
      <main className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="Add a task"
          eyebrow="Task input"
          description="Keep it quick. Extra friction tags are optional."
        >
          <form action={createTaskAction} className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Title</span>
              <input
                name="title"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0 transition focus:border-slate-400"
                placeholder="Lab report draft"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">Due date & time</span>
              <input
                name="dueAt"
                type="datetime-local"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-400"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">Estimated hours</span>
              <input
                name="estimatedHours"
                type="number"
                step="0.25"
                min="0.25"
                max="40"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-400"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">Task type</span>
              <select
                name="taskType"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-400"
              >
                {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">Project or course</span>
              <input
                name="projectLabel"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-400"
                placeholder="Psych 101"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">Ambiguity level</span>
              <input
                name="ambiguityLevel"
                type="number"
                min="1"
                max="5"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-400"
                placeholder="1-5"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">Emotional friction</span>
              <input
                name="emotionalFriction"
                type="number"
                min="1"
                max="5"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-400"
                placeholder="1-5"
              />
            </label>
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Notes</span>
              <textarea
                name="notes"
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-400"
                placeholder="Optional context, subtasks, or reminders"
              />
            </label>
            <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input name="requiresUninterruptedBlock" type="checkbox" className="h-4 w-4" />
              <span className="text-sm text-slate-700">Requires a more uninterrupted block</span>
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="theme-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
              >
                Save task
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Upcoming tasks"
          eyebrow="Current queue"
          description="Complete or archive anything that should stop influencing planning."
        >
          <div className="space-y-4">
            {tasks.length ? (
              tasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
                        <StatusPill
                          tone={
                            task.status === "completed"
                              ? "success"
                              : task.status === "archived"
                                ? "neutral"
                                : "warm"
                          }
                        >
                          {task.status}
                        </StatusPill>
                        <StatusPill>{TASK_TYPE_LABELS[task.taskType]}</StatusPill>
                      </div>
                      <p className="text-sm text-slate-600">
                        Due {formatDateTime(task.dueAt)} ({formatRelativeDue(task.dueAt)})
                      </p>
                      <p className="text-sm text-slate-600">
                        {Number(task.estimatedHours).toFixed(2)}h estimate
                        {task.projectLabel ? ` • ${task.projectLabel}` : ""}
                      </p>
                      {task.notes ? <p className="text-sm leading-6 text-slate-600">{task.notes}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Active", value: "active" },
                        { label: "Complete", value: "completed" },
                        { label: "Archive", value: "archived" },
                      ].map((option) => (
                        <form key={option.value} action={updateTaskStatusAction}>
                          <input type="hidden" name="taskId" value={task.id} />
                          <input type="hidden" name="status" value={option.value} />
                          <button
                            type="submit"
                            className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-500"
                          >
                            {option.label}
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                Add at least three tasks so the weekly dashboard has enough signal to compare deadlines against your calendar windows.
              </p>
            )}
          </div>
        </SectionCard>
      </main>
    </AppShell>
  );
}
