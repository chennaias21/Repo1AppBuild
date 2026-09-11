"use client";

import { useEffect } from "react";

/** Fires the one-off registration logging in the background. Renders nothing. */
export default function RecordRegistration() {
  useEffect(() => {
    fetch("/api/auth/record-registration", { method: "POST" }).catch(() => {
      // Admin logging only — never surface this to the learner.
    });
  }, []);

  return null;
}
