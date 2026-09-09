import type { Module } from "@/lib/content-types";

export const advancedModule: Module = {
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
      content: {
        kind: "lesson",
        objectives: [
          "Understand what it means for a formula to return many values",
          "Use FILTER, SORT, UNIQUE and SEQUENCE in real reporting",
          "Diagnose the #SPILL! error",
        ],
        scenario:
          "You need a live list of every overdue project, sorted by days late, that updates automatically as the tracker changes. Historically this meant a helper column, a sort, and a manual refresh every time. With dynamic arrays it's one formula that maintains itself.",
        steps: [
          {
            title: "Understand the shift",
            detail:
              "Traditionally one formula produced one result in one cell. Dynamic arrays let a single formula return many results, which 'spill' into the cells below and beside it. You write the formula once, in one cell, and Excel fills as many cells as the answer needs. Available in Microsoft 365 and Excel 2021 onward.",
          },
          {
            title: "Use UNIQUE to build live lists",
            detail:
              "=UNIQUE(B2:B5000) returns every distinct value in that column, with no duplicates, spilling down as far as needed. This replaces the old Remove Duplicates copy-paste routine, and unlike that routine it updates automatically when the source changes — ideal for building dropdown source lists.",
          },
          {
            title: "Use FILTER to extract matching rows",
            detail:
              "=FILTER(A2:F500, E2:E500=\"Overdue\", \"None found\") returns every row where column E says Overdue. The third argument is what to show when nothing matches, which saves wrapping it in IFERROR. This is the modern replacement for advanced filters and most helper-column work.",
          },
          {
            title: "Combine functions by nesting",
            detail:
              "=SORT(FILTER(A2:F500, E2:E500=\"Overdue\"), 4, -1) filters to overdue rows and then sorts the result by its 4th column, descending. Read it inside-out: FILTER produces a table, SORT arranges it. That single formula is the live overdue report from the scenario.",
          },
          {
            title: "Generate sequences",
            detail:
              "=SEQUENCE(12) produces 1 to 12 down a column. =SEQUENCE(12,1,DATE(2026,1,1),1) can build a date scaffold. It's genuinely useful for creating calendar rows, numbering, and building model frameworks without dragging anything.",
          },
          {
            title: "Diagnose #SPILL!",
            detail:
              "#SPILL! means the formula's results need room that something is occupying. Look at the cells directly below and to the right — there's data, a stray space, or a merged cell in the way. Clear the blocking cells and the formula spills immediately. It is always about obstruction, never about the formula being wrong.",
          },
          {
            title: "Reference a whole spill range with #",
            detail:
              "If a spilled array starts in D2, then D2# refers to the entire spilled range however large it grows. So =COUNTA(D2#) counts every item in the live list, and a chart pointed at D2# resizes as the data does. That # is what makes dynamic arrays compose into self-maintaining reports.",
          },
        ],
        tips: [
          "On older Excel versions, legacy array formulas are confirmed with Ctrl+Shift+Enter and show in braces {}. You may still meet them in inherited files.",
          "SUMPRODUCT does array work in every Excel version: =SUMPRODUCT((A2:A100=\"Mumbai\")*(B2:B100>50000)) counts rows meeting both conditions.",
          "Dynamic array results can't be edited cell by cell — you edit the source formula in the top-left cell only.",
          "Don't put a dynamic array formula inside a Table; Tables and spill ranges conflict.",
        ],
        practice:
          "On a task list, write =SORT(FILTER(A2:D50, C2:C50=\"Overdue\"), 2, 1) and watch it produce a live filtered, sorted report. Change a status in the source and watch the report update itself.",
      },
    },
    {
      slug: "data-validation-and-forms",
      title: "Data Validation and Simple Input Forms",
      summary: "Stop bad data before it enters your sheet.",
      type: "lesson",
      durationMinutes: 14,
      isFree: false,
      content: {
        kind: "lesson",
        objectives: [
          "Create dropdown lists that prevent inconsistent entries",
          "Restrict entries by number range, date, or custom rule",
          "Protect a sheet so people fill in only what they should",
        ],
        scenario:
          "You share a tracker with fifteen colleagues. Within a month you have 'Mumbai', 'mumbai', 'MUM' and 'Bombay' in the city column, target dates typed as text, and someone has overwritten a formula. Data validation prevents all of it at the point of entry, which is the only place prevention actually works.",
        steps: [
          {
            title: "Create a dropdown list",
            detail:
              "Select the cells, then Data > Data Validation > Allow: List. In Source, either type the options separated by commas (Mumbai,Delhi,Bangalore,Chennai) or point to a range of cells holding them. Users now pick from a dropdown instead of typing, and your city column stays consistent forever.",
          },
          {
            title: "Keep the source list on its own sheet",
            detail:
              "Put valid options on a separate 'Lists' sheet and reference that range. Better still, make it a Table or wrap it in UNIQUE so it grows automatically. Then hide the sheet. Updating options in one place beats editing validation rules on twelve columns.",
          },
          {
            title: "Restrict numbers and dates",
            detail:
              "Allow: Whole Number, between 1 and 100, stops someone entering 1000 in a percentage column. Allow: Date, greater than TODAY(), stops backdated entries in a planning sheet. These are quiet guardrails that prevent errors nobody would otherwise catch until reporting.",
          },
          {
            title: "Write a custom rule",
            detail:
              "Allow: Custom takes a formula that must evaluate TRUE. =LEN(A2)=10 forces exactly ten digits for a mobile number. =A2>=B2 ensures an end date isn't before a start date. Custom rules are where validation becomes genuinely powerful.",
          },
          {
            title: "Write the messages people actually see",
            detail:
              "The Input Message tab shows a tooltip when the cell is selected — use it to say what's expected. The Error Alert tab controls what happens on a bad entry: Stop blocks it, Warning allows an override, Information just notes it. Write a helpful message ('Enter a 10-digit mobile number, digits only'), not the default. This is the difference between a rule people follow and one they work around.",
          },
          {
            title: "Protect the sheet properly",
            detail:
              "Select the cells people SHOULD edit, press Ctrl+1 > Protection tab, and untick Locked. Then Review > Protect Sheet. Everything still locked becomes read-only, while your chosen input cells stay editable. Excel locks every cell by default, so unlocking the inputs first is the step people miss.",
          },
          {
            title: "Find data that predates your rules",
            detail:
              "Validation only checks new entries, so existing bad data stays. Data > Data Validation > Circle Invalid Data draws red circles around every existing cell that breaks the current rules. It's the fastest audit of a tracker you've inherited.",
          },
        ],
        tips: [
          "Validation doesn't block pasting. Someone pasting a block of values can bypass it entirely — protect the sheet as well if it matters.",
          "For dependent dropdowns (city list changing by state), use named ranges with INDIRECT, or FILTER on newer versions.",
          "Sheet protection is not security — the password is trivially removable. It prevents accidents, not determined people.",
          "Colour input cells consistently (a pale fill) so users can see where they're meant to type.",
        ],
        practice:
          "Build a five-column entry form: a dropdown for department, a date restricted to the future, a mobile field with =LEN(A2)=10, and a helpful error message on each. Then protect the sheet leaving only those cells editable.",
      },
    },
    {
      slug: "advanced-shortcut-challenge",
      title: "Advanced Shortcut Challenge",
      summary: "Speed-run 15 power-user shortcuts.",
      type: "shortcut-challenge",
      durationMinutes: 10,
      isFree: false,
      content: {
        kind: "shortcuts",
        intro:
          "These are the shortcuts that separate people who use Excel from people who are fast at Excel. Several have no ribbon equivalent worth using. Learn them in batches of five, and use each one deliberately for a week.",
        shortcuts: [
          {
            keys: "Ctrl + T",
            action: "Convert range to a Table",
            whenToUse: "Before building any PivotTable or chart, so ranges grow automatically.",
          },
          {
            keys: "Alt + =",
            action: "AutoSum the column above",
            whenToUse: "Totalling a column instantly without typing a formula.",
          },
          {
            keys: "Ctrl + Shift + L",
            action: "Toggle filters on/off",
            whenToUse: "Turning filtering on for a quick question, then clearing it.",
          },
          {
            keys: "Ctrl + 1",
            action: "Open Format Cells",
            whenToUse: "Any formatting change — custom number formats, alignment, borders.",
          },
          {
            keys: "Ctrl + Shift + V",
            action: "Paste Special",
            whenToUse: "Pasting values only, killing formulas that would otherwise break.",
          },
          {
            keys: "F4",
            action: "Cycle reference types / repeat last action",
            whenToUse: "Adding $ signs while editing; repeating a format elsewhere.",
          },
          {
            keys: "F9 (on selected formula text)",
            action: "Evaluate just that part of a formula",
            whenToUse: "Debugging a long formula piece by piece. Esc to exit safely.",
          },
          {
            keys: "Ctrl + `",
            action: "Show all formulas instead of results",
            whenToUse: "Auditing an inherited workbook to see what's calculated vs typed.",
          },
          {
            keys: "Ctrl + Shift + Plus",
            action: "Insert cells / rows / columns",
            whenToUse: "Adding rows without leaving the keyboard.",
          },
          {
            keys: "Ctrl + Minus",
            action: "Delete cells / rows / columns",
            whenToUse: "Removing rows quickly during clean-up.",
          },
          {
            keys: "Alt + Enter",
            action: "Line break inside a cell",
            whenToUse: "Multi-line headers or notes without spilling into other cells.",
          },
          {
            keys: "Ctrl + Enter",
            action: "Fill the entire selection with what you typed",
            whenToUse: "After F5 > Special > Blanks, to fill every blank at once.",
          },
          {
            keys: "F5 then Alt + S",
            action: "Go To Special",
            whenToUse: "Selecting only blanks, only formulas, or only visible cells.",
          },
          {
            keys: "Alt + ;",
            action: "Select visible cells only",
            whenToUse: "Copying filtered data without dragging the hidden rows along.",
          },
          {
            keys: "Ctrl + Alt + F5",
            action: "Refresh All",
            whenToUse: "Updating every PivotTable and query after new data arrives.",
          },
        ],
        challenge:
          "Take a raw dataset and, using only the keyboard: convert it to a Table, add a total row with Alt+=, turn on filters, filter to one category, select only the visible cells, copy them to a new sheet, and format the numbers with Ctrl+1. Target: under 60 seconds without touching the mouse.",
      },
    },
  ],
};
