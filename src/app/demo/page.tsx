"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

export default function DemoEntryPage() {
  useEffect(() => {
    void signIn("demo", { callbackUrl: "/onboarding?edit=1" });
  }, []);

  return null;
}
