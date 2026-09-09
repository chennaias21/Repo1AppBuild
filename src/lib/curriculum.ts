export type LessonType =
  | "lesson"
  | "exercise"
  | "quiz"
  | "shortcut-challenge"
  | "project"
  | "cheat-sheet";

export interface Lesson {
  slug: string;
  title: string;
  summary: string;
  type: LessonType;
  durationMinutes: number;
  isFree: boolean;
  /** Set once real content exists. Unlisted YouTube embed id, e.g. "dQw4w9WgXcQ". */
  videoId?: string;
  /** Placeholder body shown until real lesson content is written. */
  body: string;
}

export interface Module {
  slug: string;
  title: string;
  outcome: string;
  lessons: Lesson[];
}

export const CURRICULUM: Module[] = [
  {
    slug: "basics",
    title: "1. Excel Basics",
    outcome: "Get comfortable navigating Excel and entering data correctly.",
    lessons: [
      {
        slug: "getting-around-excel",
        title: "Getting Around the Excel Interface",
        summary: "Ribbon, sheets, cells, and the habits that save you time later.",
        type: "lesson",
        durationMinutes: 12,
        isFree: true,
        body: "Placeholder lesson content — replace with the real walkthrough (interface tour, workbook vs. worksheet, saving formats).",
      },
      {
        slug: "entering-and-editing-data",
        title: "Entering and Editing Data Like a Pro",
        summary: "Fast data entry, autofill, and the mistakes beginners make.",
        type: "lesson",
        durationMinutes: 10,
        isFree: true,
        body: "Placeholder lesson content — replace with the real walkthrough (typing vs. pasting, autofill handles, undo history).",
      },
      {
        slug: "basics-quick-quiz",
        title: "Quick Quiz: Excel Basics",
        summary: "5 questions to check what stuck.",
        type: "quiz",
        durationMinutes: 5,
        isFree: true,
        body: "Placeholder quiz — replace with real questions.",
      },
      {
        slug: "essential-navigation-shortcuts",
        title: "Essential Navigation Shortcuts",
        summary: "Ctrl+arrow, Ctrl+Home, and 8 more that pay off immediately.",
        type: "shortcut-challenge",
        durationMinutes: 8,
        isFree: false,
        body: "Placeholder shortcut challenge — locked, replace with real content.",
      },
    ],
  },
  {
    slug: "formatting",
    title: "2. Formatting That Communicates",
    outcome: "Make spreadsheets readable and workplace-ready at a glance.",
    lessons: [
      {
        slug: "number-and-cell-formatting",
        title: "Number Formats, Borders, and Styles",
        summary: "Currency, percentages, dates — formatted so nobody misreads them.",
        type: "lesson",
        durationMinutes: 14,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "conditional-formatting-workplace",
        title: "Conditional Formatting for Real Reports",
        summary: "Highlight overdue items, top performers, and outliers automatically.",
        type: "lesson",
        durationMinutes: 16,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "formatting-exercise",
        title: "Exercise: Clean Up a Messy Sales Sheet",
        summary: "A real-looking workplace file, deliberately messy.",
        type: "exercise",
        durationMinutes: 20,
        isFree: false,
        body: "Placeholder exercise — locked.",
      },
    ],
  },
  {
    slug: "data-cleaning",
    title: "3. Data Cleaning",
    outcome: "Turn messy exports into usable data.",
    lessons: [
      {
        slug: "removing-duplicates-and-blanks",
        title: "Removing Duplicates, Blanks, and Trailing Spaces",
        summary: "The unglamorous 80% of real Excel work.",
        type: "lesson",
        durationMinutes: 15,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "text-to-columns-and-flash-fill",
        title: "Text to Columns and Flash Fill",
        summary: "Split, merge, and reshape messy text fast.",
        type: "lesson",
        durationMinutes: 12,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "data-cleaning-project",
        title: "Project: Clean a Raw CRM Export",
        summary: "A real-world messy dataset, start to finish.",
        type: "project",
        durationMinutes: 35,
        isFree: false,
        body: "Placeholder project — locked.",
      },
    ],
  },
  {
    slug: "formulas-functions",
    title: "4. Formulas and Functions",
    outcome: "Write formulas confidently, including lookups and logic.",
    lessons: [
      {
        slug: "formula-fundamentals",
        title: "Formula Fundamentals and Cell References",
        summary: "Relative vs. absolute references, without the confusion.",
        type: "lesson",
        durationMinutes: 15,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "vlookup-xlookup-index-match",
        title: "VLOOKUP, XLOOKUP, and INDEX/MATCH",
        summary: "The lookup toolkit every workplace analyst actually uses.",
        type: "lesson",
        durationMinutes: 22,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "logical-functions",
        title: "IF, IFS, AND/OR in Real Reports",
        summary: "Build decision logic that doesn't break on edge cases.",
        type: "lesson",
        durationMinutes: 18,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "formulas-quiz",
        title: "Quiz: Formulas and Functions",
        summary: "10 questions covering lookups and logic.",
        type: "quiz",
        durationMinutes: 8,
        isFree: false,
        body: "Placeholder quiz — locked.",
      },
    ],
  },
  {
    slug: "data-analysis",
    title: "5. Data Analysis",
    outcome: "Summarize and interrogate data before building reports.",
    lessons: [
      {
        slug: "sorting-filtering-subtotals",
        title: "Sorting, Filtering, and Subtotals",
        summary: "Answer questions from raw data without formulas.",
        type: "lesson",
        durationMinutes: 14,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "what-if-analysis",
        title: "What-If Analysis: Goal Seek and Data Tables",
        summary: "Model scenarios the way finance teams actually do.",
        type: "lesson",
        durationMinutes: 16,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "analysis-exercise",
        title: "Exercise: Answer 8 Business Questions From One Sheet",
        summary: "Practice pulling insight, not just formatting.",
        type: "exercise",
        durationMinutes: 25,
        isFree: false,
        body: "Placeholder exercise — locked.",
      },
    ],
  },
  {
    slug: "pivot-tables",
    title: "6. PivotTables",
    outcome: "Summarize thousands of rows in minutes.",
    lessons: [
      {
        slug: "pivot-table-fundamentals",
        title: "Building Your First PivotTable",
        summary: "From raw rows to a summary table in under 5 minutes.",
        type: "lesson",
        durationMinutes: 18,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "pivot-charts-and-slicers",
        title: "PivotCharts, Slicers, and Timelines",
        summary: "Make pivots interactive for the people reading your report.",
        type: "lesson",
        durationMinutes: 16,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "pivot-table-project",
        title: "Project: Monthly Sales Summary From Raw Transactions",
        summary: "A complete, realistic PivotTable build.",
        type: "project",
        durationMinutes: 30,
        isFree: false,
        body: "Placeholder project — locked.",
      },
    ],
  },
  {
    slug: "reports-dashboards",
    title: "7. Reports and Dashboards",
    outcome: "Package analysis into something a manager can act on.",
    lessons: [
      {
        slug: "dashboard-design-principles",
        title: "Dashboard Design Principles for Excel",
        summary: "Layout, color, and hierarchy that don't overwhelm.",
        type: "lesson",
        durationMinutes: 16,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "kpi-dashboard-build",
        title: "Building a KPI Dashboard From Scratch",
        summary: "Charts, cards, and slicers tied together on one sheet.",
        type: "lesson",
        durationMinutes: 28,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "dashboard-project",
        title: "Project: Executive Dashboard for a Retail Business",
        summary: "A capstone-style dashboard project.",
        type: "project",
        durationMinutes: 40,
        isFree: false,
        body: "Placeholder project — locked.",
      },
    ],
  },
  {
    slug: "advanced-excel",
    title: "8. Advanced Excel",
    outcome: "Handle the trickier formulas and features confidently.",
    lessons: [
      {
        slug: "array-formulas-and-dynamic-arrays",
        title: "Array Formulas and Dynamic Arrays",
        summary: "SPILL ranges, SEQUENCE, and modern array thinking.",
        type: "lesson",
        durationMinutes: 20,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "data-validation-and-forms",
        title: "Data Validation and Simple Input Forms",
        summary: "Stop bad data before it enters your sheet.",
        type: "lesson",
        durationMinutes: 14,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "advanced-shortcut-challenge",
        title: "Advanced Shortcut Challenge",
        summary: "Speed-run 15 power-user shortcuts.",
        type: "shortcut-challenge",
        durationMinutes: 10,
        isFree: false,
        body: "Placeholder shortcut challenge — locked.",
      },
    ],
  },
  {
    slug: "power-query-pivot",
    title: "9. Power Query and Power Pivot",
    outcome: "Automate data prep and model relationships across tables.",
    lessons: [
      {
        slug: "power-query-basics",
        title: "Power Query Basics: Import, Clean, Load",
        summary: "Build a repeatable data-cleaning pipeline once.",
        type: "lesson",
        durationMinutes: 22,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "power-pivot-data-model",
        title: "Power Pivot and the Data Model",
        summary: "Relationships between tables without VLOOKUP chains.",
        type: "lesson",
        durationMinutes: 24,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "power-query-project",
        title: "Project: Merge Three Messy Sheets Into One Model",
        summary: "A realistic multi-source data-prep project.",
        type: "project",
        durationMinutes: 35,
        isFree: false,
        body: "Placeholder project — locked.",
      },
    ],
  },
  {
    slug: "automation",
    title: "10. Automation",
    outcome: "Automate repetitive Excel work with macros and VBA basics.",
    lessons: [
      {
        slug: "recording-your-first-macro",
        title: "Recording Your First Macro",
        summary: "Automate a repetitive task without writing code.",
        type: "lesson",
        durationMinutes: 16,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "intro-to-vba",
        title: "Introduction to VBA",
        summary: "Read and tweak simple macros with confidence.",
        type: "lesson",
        durationMinutes: 24,
        isFree: false,
        body: "Placeholder lesson content — locked.",
      },
      {
        slug: "automation-cheat-sheet",
        title: "Quick Revision: Automation Cheat Sheet",
        summary: "One-page reference for macros and VBA basics.",
        type: "cheat-sheet",
        durationMinutes: 5,
        isFree: false,
        body: "Placeholder cheat sheet — locked.",
      },
    ],
  },
];

export function allLessons(): Lesson[] {
  return CURRICULUM.flatMap((m) => m.lessons);
}

export function findLesson(slug: string): { module: Module; lesson: Lesson } | undefined {
  for (const mod of CURRICULUM) {
    const lesson = mod.lessons.find((l) => l.slug === slug);
    if (lesson) return { module: mod, lesson };
  }
  return undefined;
}

export function totalLessonCount(): number {
  return allLessons().length;
}
