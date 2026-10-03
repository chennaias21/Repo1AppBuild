"use client";

import { useState } from "react";

export default function LessonCompleteToggle({
  lessonSlug,
  initialCompleted,
}: {
  lessonSlug: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const next = !completed;
    setCompleted(next);
    try {
      await fetch("/api/progress/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonSlug, completed: next }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`rounded-md px-4 py-2 text-sm font-semibold ${
        completed
          ? "bg-brand-100 text-brand-800"
          : "bg-brand-600 text-white hover:bg-brand-700"
      }`}
    >
      {completed ? "Completed ✓" : "Mark as Complete"}
    </button>
  );
}
