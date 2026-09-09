import type { Module } from "@/lib/content-types";

export const formattingModule: Module = {
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
      content: {
        kind: "lesson",
        objectives: [
          "Apply currency, percentage, and date formats correctly",
          "Understand that formatting changes appearance, never the underlying value",
          "Use borders, alignment and styles to make a table readable in three seconds",
        ],
        scenario:
          "You send a cost sheet to your manager. It shows 0.15 in one column and 1250000 in another. They read it as fifteen paise and twelve lakh fifty thousand — but you meant 15% and ₹12.5 lakh. Nothing was wrong with your maths. Everything was wrong with your formatting.",
        steps: [
          {
            title: "Separate the value from its appearance",
            detail:
              "This is the concept everything else rests on. A cell holding 0.15 formatted as a percentage displays 15%, but the stored value is still 0.15. Formatting never changes the number Excel calculates with — it changes only what you see. If you type 15 into a cell already formatted as a percentage, you'll get 1500%.",
          },
          {
            title: "Apply currency the sane way",
            detail:
              "Select the range, then Home > Number group > choose Currency or Accounting. Accounting format aligns the ₹ symbol at the left edge of the cell and lines up decimal points, which is why finance reports use it. Never type '₹' manually in front of a number — that turns it into text and breaks every calculation.",
          },
          {
            title: "Handle percentages without the classic error",
            detail:
              "Percentage format multiplies the displayed value by 100. So a growth calculation returning 0.0725 displays as 7.25% — correct. But if you compute a percentage yourself as =B2/C2*100 and then also apply percentage format, you'll show 725%. Pick one: either calculate the ratio and let the format present it, or calculate ×100 and label it as a plain number.",
          },
          {
            title: "Force date formats to be unambiguous",
            detail:
              "In an office with people using different regional settings, 03-04-2026 is genuinely ambiguous. Use a custom format of DD-MMM-YYYY so it renders as 03-Apr-2026. Home > Number > More Number Formats > Custom, then type DD-MMM-YYYY. Ambiguity in dates causes real, expensive mistakes.",
          },
          {
            title: "Use borders and shading with restraint",
            detail:
              "One rule: a header row with a fill colour and bold text, thin borders around the data, nothing else. Resist the urge to colour every column differently. A reader should be able to tell headers from data instantly and then be left alone. Excessive colour actively slows comprehension.",
          },
          {
            title: "Widen columns properly",
            detail:
              "Double-click the boundary between two column headers to autofit that column to its widest entry. Select all columns first (Ctrl+A, then double-click any boundary) to autofit everything at once. A column showing ##### isn't broken — it's just too narrow for the number.",
          },
        ],
        tips: [
          "Format Painter (the paintbrush on the Home tab) copies formatting from one range to another. Double-click it to apply repeatedly, then press Esc to stop.",
          "Ctrl+Shift+1 applies number format with two decimals and a thousands separator — instantly readable.",
          "If a number won't format, it's probably text. Check its alignment first.",
          "Use Cell Styles (Home > Styles) to define a house look once and reuse it, rather than hand-formatting every new report.",
        ],
        practice:
          "Take any sheet with numbers. Format one column as Accounting, one as Percentage, and one date column as DD-MMM-YYYY. Then click each cell and check the formula bar — the underlying values haven't changed at all.",
      },
    },
    {
      slug: "conditional-formatting-workplace",
      title: "Conditional Formatting for Real Reports",
      summary: "Highlight overdue items, top performers, and outliers automatically.",
      type: "lesson",
      durationMinutes: 16,
      isFree: false,
      content: {
        kind: "lesson",
        objectives: [
          "Apply built-in conditional formatting rules for common workplace cases",
          "Write a formula-driven rule that highlights an entire row",
          "Manage and clean up rules so a workbook doesn't become unreadable",
        ],
        scenario:
          "You maintain a tracker of 300 open items. Your manager wants to see, at a glance, which items are overdue and which are due this week — without filtering, sorting, or asking you. Conditional formatting does this automatically, and updates itself as dates pass.",
        steps: [
          {
            title: "Start with the built-in rules",
            detail:
              "Select your range, then Home > Conditional Formatting > Highlight Cells Rules. You get Greater Than, Less Than, Between, Text That Contains, and A Date Occurring. For most everyday needs — flagging values above a threshold, or dates in the last 7 days — these are enough and take ten seconds.",
          },
          {
            title: "Use Top/Bottom rules for performance views",
            detail:
              "Conditional Formatting > Top/Bottom Rules > Top 10 Items (change the number to whatever you need). This is how you surface your top 5 performers or bottom 5 branches without sorting the data and disturbing everyone else's view of it.",
          },
          {
            title: "Add data bars for instant comparison",
            detail:
              "Conditional Formatting > Data Bars fills each cell proportionally to its value. On a column of sales figures this gives you a bar chart inside the cells themselves. It's the single highest-impact-per-second formatting available, and it works well in printed reports.",
          },
          {
            title: "Highlight an entire row with a formula rule",
            detail:
              "This is the technique that makes trackers genuinely useful. Select the whole data range (say A2:F300). Conditional Formatting > New Rule > 'Use a formula to determine which cells to format'. Enter =$E2<TODAY() — note the $ before E but not before 2. Choose a red fill. Every row whose date in column E is in the past turns red, automatically, forever.",
          },
          {
            title: "Understand the $ in that formula",
            detail:
              "The $ locks the column so every cell in the row looks at column E. Leaving the row number unlocked lets the rule move down row by row. Get these the wrong way round and you'll see a diagonal stripe of colour across your sheet — which is the classic symptom, and now you'll recognise it instantly.",
          },
          {
            title: "Manage rules before they multiply",
            detail:
              "Conditional Formatting > Manage Rules shows every rule on the sheet, in priority order. Copy-pasting cells duplicates rules, so after a few months a tracker can carry dozens of overlapping rules and slow to a crawl. Review this list occasionally and delete what's dead.",
          },
        ],
        tips: [
          "Rules are evaluated top-down; the first matching rule wins unless you tick 'Stop If True'.",
          "Use fills that survive printing and photocopying — pale red, pale amber, pale green. Bright saturated colours look terrible on a projector.",
          "To remove all rules from a sheet: Conditional Formatting > Clear Rules > Clear Rules from Entire Sheet.",
          "Conditional formatting recalculates constantly. On files above ~50,000 rows, heavy use will noticeably slow things down.",
        ],
        practice:
          "Build a two-column list of tasks and due dates. Apply a formula rule that turns any row red when the due date has passed, and amber when it's within the next 7 days. Change a date and watch it update.",
      },
    },
    {
      slug: "formatting-exercise",
      title: "Exercise: Clean Up a Messy Sales Sheet",
      summary: "A real-looking workplace file, deliberately messy.",
      type: "exercise",
      durationMinutes: 20,
      isFree: false,
      content: {
        kind: "exercise",
        scenario:
          "A colleague sends you a regional sales sheet before a management review. It has 240 rows. The header row is indistinguishable from the data, amounts show as raw numbers with no currency, dates are in three different formats, some columns show #####, and nothing indicates which branches missed target. You have 20 minutes before the meeting. Recreate a sheet like this yourself (or use one from your own work) and fix it.",
        tasks: [
          "Make the header row unmistakable: bold, a fill colour, and freeze it so it stays visible while scrolling (View > Freeze Panes > Freeze Top Row).",
          "Format the amount column as Accounting with no decimal places, so figures line up and are readable at a glance.",
          "Convert every date to a single unambiguous custom format: DD-MMM-YYYY.",
          "Autofit all column widths so no cell shows #####.",
          "Apply a conditional formatting rule that highlights any branch whose sales are below target in pale red.",
          "Add data bars to the sales column so relative performance is visible without reading numbers.",
          "Remove any merged cells in the data area — replace with Center Across Selection if the look matters.",
        ],
        hints: [
          "Select all columns with Ctrl+A, then double-click any column boundary to autofit everything at once.",
          "For the below-target rule, select the data rows only (not headers) and use a formula rule with a locked column reference, e.g. =$D2<$E2.",
          "If the amount column won't accept currency formatting, the values are text — check their alignment.",
        ],
        solution: [
          "Header row: select row 1, apply bold + a mid-grey or brand fill, white text if the fill is dark. View > Freeze Panes > Freeze Top Row.",
          "Amounts: select the column, Home > Number > Accounting, then reduce decimals to 0 with the Decrease Decimal button.",
          "Dates: select the date column, Ctrl+1 to open Format Cells, Custom, type DD-MMM-YYYY. If some entries don't change, they're text dates — fix them with Text to Columns (covered in Module 3).",
          "Widths: Ctrl+A, then double-click any boundary between two column headers.",
          "Below-target rule: select A2:F241, Conditional Formatting > New Rule > Use a formula, enter =$D2<$E2, set a pale red fill.",
          "Data bars: select the sales column only, Conditional Formatting > Data Bars, choose a solid fill.",
          "Merged cells: select all, Home > Merge & Center (click to unmerge), then re-apply Center Across Selection via Ctrl+1 > Alignment > Horizontal.",
        ],
      },
    },
  ],
};
