import type { Module } from "@/lib/content-types";

export const basicsModule: Module = {
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
      content: {
        kind: "lesson",
        objectives: [
          "Identify the ribbon, formula bar, name box, and sheet tabs, and know what each is for",
          "Move between worksheets and workbooks without losing your place",
          "Save a file in the right format the first time, so you don't lose formulas",
        ],
        scenario:
          "Your manager forwards you a file called Q3_Sales_FINAL_v4.xlsx and asks for 'a quick summary by Friday'. Before you can analyse anything, you need to be able to move around the file confidently. This is the lesson most people skip — and then spend the next two years hunting for buttons.",
        steps: [
          {
            title: "Understand the grid: columns, rows, and cells",
            detail:
              "Columns run vertically and are lettered (A, B, C...). Rows run horizontally and are numbered (1, 2, 3...). Where they meet is a cell, referenced by column-then-row: C5 means column C, row 5. Every formula you ever write depends on this one convention, so get it into your fingers now.",
          },
          {
            title: "Use the Name Box to jump anywhere instantly",
            detail:
              "The small box to the left of the formula bar shows the address of the selected cell. Type any address into it (say, M250) and press Enter — Excel jumps straight there. On a 10,000-row file this beats scrolling every time.",
          },
          {
            title: "Read the formula bar, not the cell",
            detail:
              "A cell shows you the result; the formula bar shows you the truth. If a cell displays 1,250 you don't know whether someone typed it or calculated it. Click the cell and look at the formula bar — that's how you audit somebody else's work.",
          },
          {
            title: "Learn the ribbon by its logic, not by memorising it",
            detail:
              "The ribbon is grouped by intent. Home = how things look and basic editing. Insert = adding new objects (tables, charts, PivotTables). Data = working with the data itself (sort, filter, remove duplicates). Formulas = the function library. Once you know the intent, you can find anything without memorising a single menu position.",
          },
          {
            title: "Work with sheet tabs",
            detail:
              "The tabs at the bottom are worksheets inside one workbook. Right-click a tab to rename, recolour, copy, or delete it. Rename every sheet meaningfully — 'Raw Data', 'Working', 'Summary' — because 'Sheet1, Sheet2, Sheet3' is how files become unusable three months later.",
          },
          {
            title: "Save in the correct format",
            detail:
              "Use .xlsx for normal work. Use .xlsm only if the file contains macros. Save as .csv only when a system specifically demands it — a CSV keeps just the values of one sheet and silently throws away your formulas, formatting, and every other tab. Many lost afternoons start with someone saving a workbook as CSV.",
          },
        ],
        tips: [
          "Ctrl+S every few minutes. Excel's recovery is decent, but it isn't a backup strategy.",
          "If the ribbon disappears, you've collapsed it — press Ctrl+F1 to bring it back.",
          "Hover over any ribbon button for a second and Excel tells you what it does, and often its keyboard shortcut.",
        ],
        practice:
          "Open any spreadsheet you have. Use the Name Box to jump to cell Z100, then press Ctrl+Home to return to A1. Rename one sheet tab to something meaningful. That's it — build the muscle memory.",
      },
    },
    {
      slug: "entering-and-editing-data",
      title: "Entering and Editing Data Like a Pro",
      summary: "Fast data entry, autofill, and the mistakes beginners make.",
      type: "lesson",
      durationMinutes: 10,
      isFree: true,
      content: {
        kind: "lesson",
        objectives: [
          "Enter data quickly using Tab, Enter, and the fill handle",
          "Recognise why Excel treats some entries as text and others as numbers",
          "Avoid the four data-entry habits that break formulas later",
        ],
        scenario:
          "You're given a printed list of 60 new joiners to type into a tracker. How you type it determines whether the file is usable for analysis afterwards — or whether someone spends a day cleaning it up. Most 'Excel problems' are actually data-entry problems.",
        steps: [
          {
            title: "Move deliberately while typing",
            detail:
              "Enter moves you down. Tab moves you right. Here's the trick most people never learn: if you use Tab across a row and then press Enter, the cursor jumps back to the column where you started, one row down. That single habit makes row-by-row entry dramatically faster.",
          },
          {
            title: "Understand how Excel classifies what you type",
            detail:
              "Numbers align right by default; text aligns left. That default alignment is a free diagnostic. If a column of numbers is sitting on the left, Excel is treating them as text — and every SUM you write on that column will silently return 0.",
          },
          {
            title: "Use the fill handle for anything sequential",
            detail:
              "The small square at the bottom-right corner of a selection is the fill handle. Drag it to copy a value down. Type two cells of a pattern (1, 2 or Jan, Feb), select both, then drag — Excel continues the pattern. Double-click the fill handle and it fills down automatically to match the length of the adjacent column.",
          },
          {
            title: "Enter dates in a format Excel actually recognises",
            detail:
              "Type dates as DD-MM-YYYY or DD/MM/YYYY consistent with your system settings. A real date sits right-aligned and can be sorted, filtered, and subtracted. A date typed as '5th April' is just text — it will sort alphabetically and break every date calculation you attempt.",
          },
          {
            title: "Edit without retyping",
            detail:
              "Double-click a cell (or press F2) to edit inside it rather than overwriting it. Typing directly into a selected cell replaces the entire contents — which is fine when intended, and painful when you only wanted to fix a typo in a long entry.",
          },
          {
            title: "Keep one fact per cell",
            detail:
              "'Rahul Sharma - Mumbai - Sales' in one cell is three facts in one box. Split them into three columns. Everything you'll learn later — sorting, filtering, PivotTables, lookups — depends on one fact per cell. This single discipline separates spreadsheets that scale from ones that don't.",
          },
        ],
        tips: [
          "Ctrl+; enters today's date as a fixed value. Useful for logs and trackers.",
          "Alt+Enter puts a line break inside a cell, instead of jumping to the next one.",
          "Never type a space to make a cell look empty. A space is a character, and it breaks lookups and counts in ways that are genuinely painful to diagnose.",
          "Don't merge cells in data tables. Merged cells look tidy and break sorting, filtering and PivotTables. Use 'Center Across Selection' if you need the visual effect.",
        ],
        practice:
          "Type the numbers 1 and 2 in two cells, select both, and drag the fill handle down ten rows. Then type Jan and Feb and do the same. Notice that Excel understands both patterns.",
      },
    },
    {
      slug: "basics-quick-quiz",
      title: "Quick Quiz: Excel Basics",
      summary: "5 questions to check what stuck.",
      type: "quiz",
      durationMinutes: 5,
      isFree: true,
      content: {
        kind: "quiz",
        intro:
          "Five questions on the basics. Answer honestly — the explanations matter more than the score.",
        questions: [
          {
            question: "A column of numbers appears aligned to the LEFT of each cell. What does this usually mean?",
            options: [
              "The column is formatted as currency",
              "Excel is treating those numbers as text",
              "The numbers are negative",
              "Nothing — alignment is random",
            ],
            correctIndex: 1,
            explanation:
              "Numbers align right by default and text aligns left. Left-aligned numbers are almost always text, which is why SUM on that column returns 0. You'd fix it with Text to Columns or by multiplying by 1.",
          },
          {
            question: "You want to see whether a cell contains a typed value or a formula. Where do you look?",
            options: [
              "The cell itself",
              "The Name Box",
              "The formula bar",
              "The status bar at the bottom",
            ],
            correctIndex: 2,
            explanation:
              "The cell shows the result; the formula bar shows what's actually behind it. Checking the formula bar is the first move when auditing someone else's workbook.",
          },
          {
            question: "Which file format should you use for a normal workbook with formulas across several sheets?",
            options: [".csv", ".xlsx", ".txt", ".xlsm"],
            correctIndex: 1,
            explanation:
              ".xlsx is the standard. CSV keeps only the values of a single sheet and discards formulas, formatting and other tabs. .xlsm is only needed when the file contains macros.",
          },
          {
            question: "What is the fastest way to fill a formula down a column that already has 500 rows of data beside it?",
            options: [
              "Copy the cell and paste it 500 times",
              "Drag the fill handle slowly to row 500",
              "Double-click the fill handle",
              "Retype the formula in each row",
            ],
            correctIndex: 2,
            explanation:
              "Double-clicking the fill handle fills down automatically, matching the length of the adjacent column. It works instantly whether there are 50 rows or 50,000.",
          },
          {
            question: "Why is 'Rahul Sharma - Mumbai - Sales' in a single cell a problem?",
            options: [
              "It's too long for Excel to store",
              "It will cause a #VALUE! error",
              "It puts three facts in one cell, which breaks sorting, filtering and PivotTables",
              "It isn't a problem at all",
            ],
            correctIndex: 2,
            explanation:
              "One fact per cell is the foundational rule of usable spreadsheets. With name, city and department in separate columns you can filter by city, pivot by department, and look up by name. Combined, you can do none of those.",
          },
        ],
      },
    },
    {
      slug: "essential-navigation-shortcuts",
      title: "Essential Navigation Shortcuts",
      summary: "Ctrl+arrow, Ctrl+Home, and 8 more that pay off immediately.",
      type: "shortcut-challenge",
      durationMinutes: 8,
      isFree: false,
      content: {
        kind: "shortcuts",
        intro:
          "These are the shortcuts that change how fast you work on large files. Learn these ten and you'll stop scrolling forever. Practise each one three times on a real file — that's what moves it from 'known' to 'automatic'.",
        shortcuts: [
          {
            keys: "Ctrl + Arrow key",
            action: "Jump to the edge of the current data region",
            whenToUse: "Instantly reach the last row or column of a dataset instead of scrolling.",
          },
          {
            keys: "Ctrl + Home",
            action: "Jump to cell A1",
            whenToUse: "Getting back to the top of any sheet, from anywhere.",
          },
          {
            keys: "Ctrl + End",
            action: "Jump to the last used cell in the sheet",
            whenToUse: "Checking how far a file actually extends — often revealing stray data far below.",
          },
          {
            keys: "Ctrl + Shift + Arrow key",
            action: "Select from here to the edge of the data",
            whenToUse: "Selecting a whole column of data without touching the mouse.",
          },
          {
            keys: "Ctrl + Space",
            action: "Select the entire column",
            whenToUse: "Formatting or deleting a full column quickly.",
          },
          {
            keys: "Shift + Space",
            action: "Select the entire row",
            whenToUse: "Inserting or deleting whole records.",
          },
          {
            keys: "Ctrl + Page Up / Page Down",
            action: "Move to the previous / next worksheet",
            whenToUse: "Flipping between Raw Data and Summary tabs while building a report.",
          },
          {
            keys: "Ctrl + F",
            action: "Find",
            whenToUse: "Locating a value when you don't know where it lives.",
          },
          {
            keys: "F2",
            action: "Edit the active cell",
            whenToUse: "Fixing part of an entry instead of retyping the whole thing.",
          },
          {
            keys: "Ctrl + Z / Ctrl + Y",
            action: "Undo / Redo",
            whenToUse: "The two most important keys in Excel. Undo goes back many steps.",
          },
        ],
        challenge:
          "Open a file with at least 200 rows. Starting from A1, use only the keyboard to: reach the last row of data, select that entire column, return to A1, and switch to another sheet and back. Time yourself. Repeat until it takes under 15 seconds.",
      },
    },
  ],
};
