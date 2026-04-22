import { prisma } from "@/lib/prisma";

export const GOOGLE_ACCOUNT_LINK_COOKIE = "headroom-google-account-link";

interface GoogleAccountLinkPayload {
  sourceUserId: string;
}

export function serializeGoogleAccountLinkPayload(sourceUserId: string) {
  return JSON.stringify({ sourceUserId } satisfies GoogleAccountLinkPayload);
}

export function parseGoogleAccountLinkPayload(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<GoogleAccountLinkPayload>;

    if (!parsed.sourceUserId || typeof parsed.sourceUserId !== "string") {
      return null;
    }

    return {
      sourceUserId: parsed.sourceUserId,
    } satisfies GoogleAccountLinkPayload;
  } catch {
    return null;
  }
}

export async function migrateLinkedProfileToUser(sourceUserId: string, targetUserId: string) {
  if (!sourceUserId || !targetUserId || sourceUserId === targetUserId) {
    return false;
  }

  const [sourceProfile, targetProfile] = await Promise.all([
    prisma.workProfile.findUnique({
      where: { userId: sourceUserId },
    }),
    prisma.workProfile.findUnique({
      where: { userId: targetUserId },
    }),
  ]);

  if (!sourceProfile || targetProfile) {
    return false;
  }

  await prisma.workProfile.update({
    where: { id: sourceProfile.id },
    data: { userId: targetUserId },
  });

  return true;
}
