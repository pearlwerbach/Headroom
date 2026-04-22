import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  diagnoseGoogleCalendarReadForEmail,
  listGoogleAccountDebugRows,
  removeLocalGoogleAccountState,
} from "@/lib/google-calendar-debug";
import { prisma } from "@/lib/prisma";

function stripMatchingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function loadLocalEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, "utf8");

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const value = stripMatchingQuotes(line.slice(equalsIndex + 1).trim());

    process.env[key] = value;
  }
}

function loadLocalScriptEnv() {
  const cwd = process.cwd();

  loadLocalEnvFile(path.join(cwd, ".env"));
  loadLocalEnvFile(path.join(cwd, ".env.local"));
}

loadLocalScriptEnv();

async function main() {
  const command = process.argv[2];

  if (!command) {
    throw new Error("Usage: pnpm exec tsx scripts/google-calendar-local-admin.ts <list|diagnose|cleanup-stale|cleanup-user> [email]");
  }

  if (command === "list") {
    console.log(JSON.stringify(await listGoogleAccountDebugRows(), null, 2));
    return;
  }

  if (command === "diagnose") {
    const email = process.argv[3];

    if (!email) {
      throw new Error("Provide an email for diagnose.");
    }

    console.log(JSON.stringify(await diagnoseGoogleCalendarReadForEmail(email), null, 2));
    return;
  }

  if (command === "cleanup-stale") {
    console.log(JSON.stringify(await removeLocalGoogleAccountState({ mode: "stale_missing_scope" }), null, 2));
    return;
  }

  if (command === "cleanup-user") {
    const email = process.argv[3];

    if (!email) {
      throw new Error("Provide an email for cleanup-user.");
    }

    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new Error(`No user found for ${email}.`);
    }

    console.log(JSON.stringify(await removeLocalGoogleAccountState({ mode: "user", userId: user.id }), null, 2));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
