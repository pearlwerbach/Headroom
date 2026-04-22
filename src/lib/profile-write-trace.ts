import { cookies } from "next/headers";

export const PROFILE_WRITE_TRACE_COOKIE = "profile-write-trace";

export interface ProfileWriteTraceEntry {
  callsite: string;
  timestamp: string;
  rowId: string;
  updatedAt: string;
  subtypeName: string | null;
  rawAnswers: unknown;
}

export async function appendProfileWriteTrace(entry: ProfileWriteTraceEntry) {
  if (process.env.PROFILE_MODEL_DEBUG !== "true") {
    return;
  }

  try {
    const cookieStore = await cookies();
    const current = parseProfileWriteTrace(
      cookieStore.get(PROFILE_WRITE_TRACE_COOKIE)?.value,
    );
    const next = [entry, ...current].slice(0, 12);

    cookieStore.set(PROFILE_WRITE_TRACE_COOKIE, JSON.stringify(next), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30,
    });
  } catch {
    // Best-effort dev tracing only.
  }
}

export function parseProfileWriteTrace(value: string | undefined) {
  if (!value) {
    return [] as ProfileWriteTraceEntry[];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as ProfileWriteTraceEntry[]) : [];
  } catch {
    return [] as ProfileWriteTraceEntry[];
  }
}
