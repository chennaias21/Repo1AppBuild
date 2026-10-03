import type { Module } from "@/lib/content-types";

export const automationModule: Module = {
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
      content: {
        kind: "lesson",
        objectives: [
          "Record, run, and save a macro safely",
          "Understand relative vs absolute recording",
          "Know when a macro is the right tool and when Power Query is better",
        ],
        scenario:
          "Every Monday you open the weekly export and perform the same fourteen clicks: delete two columns, format the header, autofit, apply a filter, add a total row. It takes six minutes and it's identical every time. The macro recorder captures those clicks once and replays them in under a second.",
        steps: [
          {
            title: "Show the Developer tab",
            detail:
              "File > Options > Customize Ribbon, then tick Developer on the right-hand list. You can also record from View > Macros > Record Macro, but the Developer tab keeps everything in one place.",
          },
          {
            title: "Plan the steps before you record",
            detail:
              "The recorder captures everything, including your mistakes and stray clicks. Walk through the task once manually and note each step. Two minutes of planning produces a clean macro instead of one that recreates your typos every week.",
          },
          {
            title: "Record",
            detail:
              "Developer > Record Macro. Give it a meaningful name with no spaces (FormatWeeklyReport), optionally assign a shortcut key, and choose where to store it — 'This Workbook' for file-specific tasks, 'Personal Macro Workbook' for something you want available in every file you open. Then perform your steps and click Stop Recording.",
          },
          {
            title: "Understand absolute vs relative recording",
            detail:
              "By default the recorder captures exact cell addresses — it will always select B2, regardless of where you are. Toggle 'Use Relative References' before recording and it captures movement instead ('move two cells right'), which is what you want for a macro that works on any row. Choosing wrong here is the most common reason a recorded macro misbehaves.",
          },
          {
            title: "Save as .xlsm",
            detail:
              "Macros cannot be saved in .xlsx. Save As and choose Excel Macro-Enabled Workbook (.xlsm). If you save as .xlsx, Excel discards every macro — with a warning most people click straight through.",
          },
          {
            title: "Run and assign it",
            detail:
              "Developer > Macros > Run, or the shortcut key you assigned. To make it usable for others, Insert > Shapes, draw a button, right-click > Assign Macro. A labelled button on the sheet is far more approachable for a colleague than explaining where the Macros dialog lives.",
          },
          {
            title: "Know the limits",
            detail:
              "Macros can't be undone — Ctrl+Z will not reverse one, so test on a copy. They break when the sheet structure changes. And for the specific job of importing and cleaning data, Power Query is more robust and easier to maintain. Use macros for formatting, layout and multi-step UI actions; use Power Query for data preparation.",
          },
        ],
        tips: [
          "Macro-enabled files are often blocked by email systems and corporate policy. Check that colleagues can actually open them before building a workflow around one.",
          "Start every macro from a consistent place — press Ctrl+Home first while recording — so it doesn't depend on where the cursor happened to be.",
          "If a recorded macro fails, open it (Alt+F11) and read it. Recorded code is verbose but readable, and the failing line is usually obvious.",
          "Never enable macros in a file from an unknown source. Macros can run arbitrary code on your machine.",
        ],
        practice:
          "Record a macro that formats a header row: bold, fill colour, freeze top row, autofit columns. Save as .xlsm, then run it on a fresh sheet. Re-record it with Relative References on and note how the behaviour differs.",
      },
    },
    {
      slug: "intro-to-vba",
      title: "Introduction to VBA",
      summary: "Read and tweak simple macros with confidence.",
      type: "lesson",
      durationMinutes: 24,
      isFree: false,
      content: {
        kind: "lesson",
        objectives: [
          "Open the VBA editor and read recorded code",
          "Edit a recorded macro to make it more useful",
          "Write a simple loop and understand basic VBA structure",
        ],
        scenario:
          "Your recorded macro works, but it only handles exactly 100 rows because that's what the file had when you recorded it. This month there are 340 rows. Rather than re-recording every time, you'll open the code and make it handle any number of rows — about four lines of change.",
        steps: [
          {
            title: "Open the editor and find your macro",
            detail:
              "Press Alt+F11. The Project Explorer on the left shows your workbook; expand Modules and double-click Module1. Your recorded macro is there as a Sub — a block starting with Sub MacroName() and ending with End Sub. Everything between is what the recorder captured.",
          },
          {
            title: "Read what the recorder wrote",
            detail:
              "Recorded code follows a pattern: select something, then act on it. Range(\"A1:D100\").Select then Selection.Font.Bold = True. It's verbose but very readable — object, then property or action. You don't need to write VBA from scratch to be useful with it; reading and editing gets you most of the value.",
          },
          {
            title: "Remove the Select statements",
            detail:
              "Range(\"A1\").Select followed by Selection.Font.Bold = True can be written as Range(\"A1\").Font.Bold = True. Acting directly on the range instead of selecting it first makes code shorter, faster, and less likely to break. This one habit improves nearly every recorded macro.",
          },
          {
            title: "Make it handle any number of rows",
            detail:
              "Replace the hard-coded 100 with a calculated last row: Dim lastRow As Long, then lastRow = Cells(Rows.Count, 1).End(xlUp).Row — which is the VBA equivalent of pressing Ctrl+Up from the bottom of column A. Then use Range(\"A1:D\" & lastRow). Your macro now works on 100 rows or 100,000.",
          },
          {
            title: "Understand variables and data types",
            detail:
              "Dim declares a variable: Dim total As Double, Dim name As String, Dim i As Long. Declaring types helps Excel catch mistakes. Put Option Explicit at the top of every module to force declaration — it turns silent typos into clear errors, and it will save you hours.",
          },
          {
            title: "Write a loop",
            detail:
              "For i = 2 To lastRow / If Cells(i, 4).Value > 100000 Then Cells(i, 4).Interior.Color = vbGreen / End If / Next i. That walks every row from 2 to the last, checks column 4, and colours the qualifying cells. Loops are where VBA does things formulas and conditional formatting can't.",
          },
          {
            title: "Debug by stepping through",
            detail:
              "Press F8 to run one line at a time, watching the sheet after each step. Click the grey margin to set a breakpoint that pauses execution. Hover over any variable while paused to see its current value. Stepping through code is how you actually learn what it's doing.",
          },
          {
            title: "Handle errors gracefully",
            detail:
              "A macro that hits an error stops and shows a technical dialog to whoever ran it. On Error Resume Next skips errors — use it sparingly and deliberately. Better is checking conditions before acting: If Not IsEmpty(cell) Then. And always turn Application.ScreenUpdating = False at the start and True at the end for a noticeable speed increase on long loops.",
          },
        ],
        tips: [
          "The macro recorder is the best VBA tutor available: record an action you don't know how to code, then read what it produced.",
          "F1 on any highlighted VBA keyword opens documentation for it.",
          "Comment your code with an apostrophe: ' This loop colours high-value rows. Six months later you'll need it.",
          "Keep a backup before running a new macro on real data — remember there's no undo.",
        ],
        practice:
          "Take your recorded formatting macro. Remove every .Select, add a lastRow variable, and wrap the formatting in a loop that also colours any value above a threshold. Step through it with F8 and watch each line execute.",
      },
    },
    {
      slug: "automation-cheat-sheet",
      title: "Quick Revision: Automation Cheat Sheet",
      summary: "One-page reference for macros and VBA basics.",
      type: "cheat-sheet",
      durationMinutes: 5,
      isFree: false,
      content: {
        kind: "cheatsheet",
        intro:
          "Keep this beside you while you work. It covers the macro basics and the VBA snippets you'll reach for most often. Nothing here needs memorising — it needs to be findable.",
        rows: [
          {
            item: "Show Developer tab",
            note: "File > Options > Customize Ribbon > tick Developer.",
          },
          {
            item: "Record a macro",
            note: "Developer > Record Macro. Name without spaces. Stop Recording when done.",
          },
          {
            item: "Open the VBA editor",
            syntax: "Alt + F11",
            note: "Modules live under your workbook in the Project Explorer.",
          },
          {
            item: "Run a macro",
            syntax: "Alt + F8",
            note: "Or assign it to a shape or a keyboard shortcut.",
          },
          {
            item: "Save with macros",
            syntax: ".xlsm",
            note: "Saving as .xlsx silently deletes every macro in the file.",
          },
          {
            item: "Force variable declaration",
            syntax: "Option Explicit",
            note: "First line of every module. Turns typos into clear errors.",
          },
          {
            item: "Declare a variable",
            syntax: "Dim lastRow As Long",
            note: "Long for row numbers, String for text, Double for decimals.",
          },
          {
            item: "Find the last used row",
            syntax: "lastRow = Cells(Rows.Count, 1).End(xlUp).Row",
            note: "The VBA equivalent of Ctrl+Up from the bottom of column A.",
          },
          {
            item: "Reference a cell",
            syntax: 'Range("A1").Value  /  Cells(1, 1).Value',
            note: "Cells(row, column) is easier inside loops because both are numbers.",
          },
          {
            item: "Loop through rows",
            syntax: "For i = 2 To lastRow ... Next i",
            note: "Start at 2 to skip the header row.",
          },
          {
            item: "Conditional",
            syntax: "If condition Then ... Else ... End If",
            note: "End If is required when the If spans multiple lines.",
          },
          {
            item: "Refer to a sheet explicitly",
            syntax: 'Worksheets("Data").Range("A1")',
            note: "Avoids acting on whichever sheet happens to be active.",
          },
          {
            item: "Speed up a long macro",
            syntax: "Application.ScreenUpdating = False",
            note: "Set back to True at the end, including in your error path.",
          },
          {
            item: "Message box",
            syntax: 'MsgBox "Done. " & lastRow & " rows processed."',
            note: "Useful confirmation for whoever runs the macro.",
          },
          {
            item: "Comment a line",
            syntax: "' This colours high-value rows",
            note: "An apostrophe starts a comment.",
          },
          {
            item: "Step through code",
            syntax: "F8",
            note: "Runs one line at a time. Click the margin to set a breakpoint.",
          },
          {
            item: "Macro vs Power Query",
            note: "Power Query for importing and cleaning data. Macros for formatting, layout and multi-step actions.",
          },
          {
            item: "Critical warning",
            note: "Macros cannot be undone with Ctrl+Z. Always test on a copy of your data.",
          },
        ],
      },
    },
  ],
};
