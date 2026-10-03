export type LessonType =
  | "lesson"
  | "exercise"
  | "quiz"
  | "shortcut-challenge"
  | "project"
  | "cheat-sheet";

export interface Step {
  title: string;
  detail: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ShortcutItem {
  keys: string;
  action: string;
  whenToUse: string;
}

export interface CheatSheetRow {
  item: string;
  syntax?: string;
  note: string;
}

export type LessonContent =
  | {
      kind: "lesson";
      /** What the learner can do by the end. */
      objectives: string[];
      /** The workplace situation the lesson is framed around. */
      scenario: string;
      steps: Step[];
      tips: string[];
      /** Optional short practice prompt to try immediately. */
      practice?: string;
    }
  | {
      kind: "exercise";
      scenario: string;
      tasks: string[];
      hints: string[];
      solution: string[];
    }
  | {
      kind: "quiz";
      intro: string;
      questions: QuizQuestion[];
    }
  | {
      kind: "project";
      scenario: string;
      deliverables: string[];
      steps: Step[];
      successCriteria: string[];
    }
  | {
      kind: "shortcuts";
      intro: string;
      shortcuts: ShortcutItem[];
      challenge: string;
    }
  | {
      kind: "cheatsheet";
      intro: string;
      rows: CheatSheetRow[];
    };

export interface Lesson {
  slug: string;
  title: string;
  summary: string;
  type: LessonType;
  durationMinutes: number;
  isFree: boolean;
  /** Unlisted YouTube video id, added once a lesson is recorded. */
  videoId?: string;
  content: LessonContent;
}

export interface Module {
  slug: string;
  title: string;
  outcome: string;
  lessons: Lesson[];
}
