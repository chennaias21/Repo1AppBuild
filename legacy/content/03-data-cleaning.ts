import type { Module } from "@/lib/content-types";

export const dataCleaningModule: Module = {
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
      content: {
        kind: "lesson",
        objectives: [
          "Find and remove duplicate records safely, without deleting data you needed",
          "Strip invisible spaces that silently break lookups and counts",
          "Handle blank rows and cells deliberately rather than accidentally",
        ],
        scenario:
          "You export a customer list from your CRM. It has 4,120 rows. Finance says there should be about 3,800 customers. Somewhere in there are duplicates, entries with trailing spaces that make 'Mumbai' and 'Mumbai ' look like two different cities, and blank rows that break your PivotTable. This lesson is the difference between a number you can defend and one you can't.",
        steps: [
          {
            title: "Always work on a copy",
            detail:
              "Before cleaning anything, duplicate the sheet (right-click the tab > Move or Copy > tick 'Create a copy') and name it 'Raw Data'. Never clean the only copy you have. When someone questions a figure three weeks later, you'll want the original to go back to.",
          },
          {
            title: "See duplicates before you delete them",
            detail:
              "Don't jump straight to Remove Duplicates. First select the column and use Conditional Formatting > Highlight Cells Rules > Duplicate Values. Now you can see what's actually duplicated and judge whether it's a genuine repeat or two different people with the same name. Deleting first and looking later is how real records get lost.",
          },
          {
            title: "Use Remove Duplicates with the right columns ticked",
            detail:
              "Select your data, then Data > Remove Duplicates. The dialog lists every column with a checkbox. This is the part people get wrong: Excel removes a row only when ALL ticked columns match. Tick only 'Email' and you'll remove anyone sharing an email. Tick every column and you'll only remove rows that are identical in every respect. Decide what 'duplicate' means for your data before you click OK.",
          },
          {
            title: "Strip trailing and leading spaces with TRIM",
            detail:
              "In a helper column, write =TRIM(A2) and fill it down. TRIM removes spaces before and after the text, and reduces runs of internal spaces to one. This one function resolves an enormous share of 'my VLOOKUP isn't working' problems, because 'Mumbai ' and 'Mumbai' are genuinely different strings to Excel.",
          },
          {
            title: "Convert the cleaned column back to values",
            detail:
              "Your TRIM column contains formulas pointing at the messy original. Select it, Ctrl+C, then right-click the target column > Paste Special > Values. Now the clean text stands on its own and you can safely delete the original column. Skipping this step means deleting the source turns your clean column into #REF! errors.",
          },
          {
            title: "Deal with blanks intentionally",
            detail:
              "Select your range and press F5 > Special > Blanks to select every empty cell at once. From there you can type a value and press Ctrl+Enter to fill them all simultaneously, or right-click > Delete > Entire Row. The important question is whether blank means zero, means unknown, or means the row is junk — those need different treatments, and only you know which applies.",
          },
          {
            title: "Fix numbers stored as text",
            detail:
              "If a numeric column is left-aligned, SUM returns 0. Quickest fix: type 1 in an empty cell, copy it, select the text-numbers, Paste Special > Multiply. Multiplying by 1 forces Excel to treat them as numbers. Alternatively use Data > Text to Columns and click Finish without changing anything — that also re-parses the column.",
          },
        ],
        tips: [
          "CLEAN() removes non-printing characters that come from system exports. Combine as =TRIM(CLEAN(A2)) for stubborn data.",
          "Remove Duplicates is not undoable beyond Ctrl+Z. Save first.",
          "Before and after any clean, note the row count in the status bar. If 4,120 becomes 3,790, you can explain exactly what happened.",
          "Sort by a key column before cleaning — duplicates become visually obvious when adjacent.",
        ],
        practice:
          "Take a list with some deliberate trailing spaces. Write =A2=B2 comparing a spaced entry against a clean one and see FALSE. Then wrap one in TRIM and watch it become TRUE. That's the bug, made visible.",
      },
    },
    {
      slug: "text-to-columns-and-flash-fill",
      title: "Text to Columns and Flash Fill",
      summary: "Split, merge, and reshape messy text fast.",
      type: "lesson",
      durationMinutes: 12,
      isFree: false,
      content: {
        kind: "lesson",
        objectives: [
          "Split one column into several using a delimiter",
          "Use Flash Fill to reshape data by example, without writing formulas",
          "Join columns back together with the & operator or TEXTJOIN",
        ],
        scenario:
          "Your HR system exports employee names as 'Sharma, Rahul' in a single column, and location as 'Mumbai-West-401'. For the headcount report you need first name, last name, city and zone as separate columns. Doing this by hand for 800 employees is a lost day. Doing it properly takes four minutes.",
        steps: [
          {
            title: "Split with Text to Columns",
            detail:
              "Select the column, then Data > Text to Columns > Delimited > Next. Tick the delimiter that separates your data — comma, space, or Other for something like a hyphen. Preview appears at the bottom. Click Finish. The column splits into as many columns as there are pieces.",
          },
          {
            title: "Make room before you split",
            detail:
              "Text to Columns overwrites whatever is to the right of your column, without warning. Insert enough blank columns first. This is the single most common way people destroy data with this feature — they split a middle column and silently overwrite the two columns beside it.",
          },
          {
            title: "Use Text to Columns to repair dates and text-numbers",
            detail:
              "Select the problem column, run Data > Text to Columns, and simply click Finish without changing anything. Excel re-parses every cell. Text-formatted dates become real dates; text-numbers become numbers. It's a genuinely useful trick that has nothing to do with splitting.",
          },
          {
            title: "Let Flash Fill learn by example",
            detail:
              "In the column beside your data, type the result you want for the first row — say, just 'Rahul' from 'Sharma, Rahul'. Start typing the second one and Excel offers a greyed-out preview of the whole column. Press Enter to accept. If it doesn't offer, press Ctrl+E to force it. Flash Fill infers the pattern from your example.",
          },
          {
            title: "Know when Flash Fill is the wrong tool",
            detail:
              "Flash Fill produces static values, not formulas. If the source data changes, the result does not update. That's fine for a one-off clean-up and wrong for a recurring report. For anything you'll repeat monthly, use formulas or Power Query (Module 9) instead.",
          },
          {
            title: "Join columns back together",
            detail:
              "Use =A2&\" \"&B2 to concatenate with a space between. For many columns, TEXTJOIN is cleaner: =TEXTJOIN(\", \",TRUE,A2:D2) joins everything with a comma-space and the TRUE tells it to skip blanks — which stops you getting 'Mumbai, , 401'.",
          },
        ],
        tips: [
          "Flash Fill handles capitalisation, initials, and extracting from the middle of a string. Give it two examples if the first doesn't take.",
          "PROPER(), UPPER() and LOWER() fix inconsistent capitalisation: =PROPER(A2) turns 'rahul SHARMA' into 'Rahul Sharma'.",
          "LEFT, RIGHT and MID extract characters by position when there's no delimiter to split on.",
          "Always keep the original column until you've verified the split, then delete it.",
        ],
        practice:
          "Type five full names as 'Last, First' in a column. Split them with Text to Columns, then use Flash Fill in another column to produce 'First Last' order. Notice which one updates when you edit the source (neither — that's the lesson).",
      },
    },
    {
      slug: "data-cleaning-project",
      title: "Project: Clean a Raw CRM Export",
      summary: "A real-world messy dataset, start to finish.",
      type: "project",
      durationMinutes: 35,
      isFree: false,
      content: {
        kind: "project",
        scenario:
          "You've been handed a raw CRM export of roughly 500 customer records to prepare for the sales team's quarterly review. It contains duplicate customers, inconsistent city names ('mumbai', 'Mumbai', 'Mumbai '), names in 'Last, First' format, phone numbers with mixed formatting, some numeric columns stored as text, and around 20 completely blank rows. Your job is to deliver a clean dataset that a PivotTable can be built on directly. Build this file yourself with deliberate mess, or use a genuine export from your own workplace.",
        deliverables: [
          "A 'Raw Data' sheet preserving the original untouched export",
          "A 'Clean Data' sheet with one fact per cell, no duplicates, no stray spaces, and consistent capitalisation",
          "A short 'Cleaning Log' noting what you changed and how many rows were affected",
        ],
        steps: [
          {
            title: "Preserve the original",
            detail:
              "Copy the sheet and rename the copy 'Clean Data'. Rename the original 'Raw Data'. Record the starting row count from the status bar — you'll need it to explain the difference later.",
          },
          {
            title: "Remove blank rows",
            detail:
              "Select the data range, press F5 > Special > Blanks, then right-click > Delete > Entire Row. Confirm your row count dropped by roughly the number of blanks you expected — if it dropped by far more, undo and investigate, because you've selected too much.",
          },
          {
            title: "Trim and standardise text",
            detail:
              "In helper columns, apply =TRIM(CLEAN(cell)) to every text column, and wrap city names in PROPER() to normalise capitalisation: =PROPER(TRIM(C2)). Then Paste Special > Values over the originals and delete the helper columns.",
          },
          {
            title: "Split the name column",
            detail:
              "Insert two blank columns to the right of the name column first. Use Text to Columns with a comma delimiter to split 'Last, First'. Then use Flash Fill or =B2&\" \"&A2 if you need a combined 'First Last' display column.",
          },
          {
            title: "Fix numbers and dates stored as text",
            detail:
              "Check alignment on every numeric and date column. For any that are left-aligned, run Data > Text to Columns and click Finish, or use the Paste Special > Multiply by 1 trick. Verify by selecting the column and checking that the status bar now shows a Sum.",
          },
          {
            title: "Handle duplicates deliberately",
            detail:
              "First highlight duplicates with conditional formatting on the email or customer-ID column so you can see them. Decide what constitutes a duplicate for this dataset. Then Data > Remove Duplicates with only those columns ticked. Note how many rows Excel reports removing.",
          },
          {
            title: "Convert to a proper Table",
            detail:
              "Select the clean range and press Ctrl+T. A Table gives you filter buttons, structured references, and — importantly — a range that grows automatically when new rows are added, so anything built on it stays correct.",
          },
          {
            title: "Write the cleaning log",
            detail:
              "On a third sheet, record: starting rows, blank rows removed, duplicates removed, final rows, and any judgement calls you made. This takes two minutes and is what makes your numbers defensible in the review.",
          },
        ],
        successCriteria: [
          "Every column contains exactly one type of fact, and no cell has leading or trailing spaces",
          "Selecting any numeric column shows a Sum in the status bar (proving they're real numbers, not text)",
          "City names are consistently capitalised, with no duplicates caused by spacing or case",
          "The clean data is a Table (Ctrl+T) with meaningful headers",
          "Your cleaning log accounts for the difference between the starting and ending row counts",
        ],
      },
    },
  ],
};
