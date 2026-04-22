import { NextResponse } from "next/server";
import { getDashboardPayload, persistRecommendations } from "@/lib/dashboard";
import { getServerAuthSession } from "@/lib/auth";

export async function POST() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getDashboardPayload(session.user.id);

  if (!payload.insights) {
    return NextResponse.json(
      { error: "Onboarding is required before recommendations can be generated." },
      { status: 400 },
    );
  }

  const created = await persistRecommendations(session.user.id, payload.insights.drafts);
  return NextResponse.json({ count: created.length });
}
