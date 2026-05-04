"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { signIn } from "next-auth/react";

interface AssessmentAccessGateProps {
  children?: ReactNode;
}

export function AssessmentAccessGate(_props: AssessmentAccessGateProps) {
  useEffect(() => {
    void signIn("assessment", { callbackUrl: "/onboarding?edit=1" });
  }, []);

  return null;
}
