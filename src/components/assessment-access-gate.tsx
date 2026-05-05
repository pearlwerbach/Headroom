"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { signIn } from "next-auth/react";

interface AssessmentAccessGateProps {
  children?: ReactNode;
}

export function AssessmentAccessGate(_props: AssessmentAccessGateProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    void signIn("assessment", { callbackUrl: "/onboarding?edit=1" });
  }, []);

  return null;
}
