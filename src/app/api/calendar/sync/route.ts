import { NextResponse } from "next/server";
import { syncGoogleCalendar } from "@/lib/calendar-sync";
import { getServerAuthSession } from "@/lib/auth";

export async function POST() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncGoogleCalendar(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Calendar sync failed" },
      { status: 500 },
    );
  }
}
