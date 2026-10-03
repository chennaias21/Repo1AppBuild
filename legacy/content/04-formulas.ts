import type { Module } from "@/lib/content-types";

export const formulasModule: Module = {
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
      content: {
        kind: "lesson",
        objectives: [
          "Write formulas that reference cells rather than hard-coded numbers",
          "Use relative, absolute and mixed references correctly when copying formulas",
          "Diagnose the common error values instead of guessing",
        ],
        scenario:
          "You build a commission calculator. It works perfectly in the first row. You copy it down 200 rows and every result below the first is wrong — some show zero, some show #DIV/0!. Nothing is broken; you just used the wrong kind of cell reference. This lesson is the one that makes formulas stop feeling random.",
        steps: [
          {
            title: "Reference cells, never retype numbers",
            detail:
              "Write =B2*C2, not =B2*0.05. The moment the commission rate changes, a formula referencing a rate cell updates everywhere, while hard-coded numbers have to be hunted down one by one. Put every assumption — rates, targets, thresholds — in its own labelled cell and point formulas at it.",
          },
          {
            title: "Understand relative references (the default)",
            detail:
              "=B2*C2 in row 2 becomes =B3*C3 when copied to row 3. The references move with the formula. This is what you want for row-by-row calculations, and it's why copying down usually just works.",
          },
          {
            title: "Use absolute references to lock a cell",
            detail:
              "Putting $ before both parts — $F$1 — locks the reference completely. Copy =B2*$F$1 anywhere and it always multiplies by F1. This is the fix for the commission problem: your rate lives in F1, and every row must point at that same cell rather than drifting down to F2, F3, and eventually empty cells (which is where the zeros came from).",
          },
          {
            title: "Use F4 to cycle reference types",
            detail:
              "While editing a formula, put your cursor on a reference and press F4 repeatedly. It cycles B1 → $B$1 → B$1 → $B1 → B1. You never need to type the dollar signs manually.",
          },
          {
            title: "Use mixed references for grid calculations",
            detail:
              "$B2 locks the column but lets the row move. B$2 locks the row but lets the column move. This matters when building a grid — a price matrix, say — where one formula must work across both directions. It's the difference between writing one formula and writing fifty.",
          },
          {
            title: "Read error values as diagnoses, not failures",
            detail:
              "#DIV/0! means you divided by zero or an empty cell. #VALUE! means you did maths on text. #REF! means a referenced cell was deleted. #N/A means a lookup found nothing. #NAME? means a function name is misspelled. Each error tells you precisely what's wrong — read it rather than deleting the formula and starting again.",
          },
          {
            title: "Wrap risky formulas in IFERROR",
            detail:
              "=IFERROR(B2/C2,0) returns 0 instead of #DIV/0!. Use this to keep reports clean — but sparingly. IFERROR hides every error, including ones you'd want to know about. Never wrap a formula in IFERROR before you understand why it's erroring.",
          },
        ],
        tips: [
          "Select part of a formula in the formula bar and press F9 to see what that piece evaluates to. Press Esc (not Enter) to leave the formula unchanged. This is the best debugging tool in Excel.",
          "Ctrl+` (backtick) toggles showing all formulas instead of results — invaluable for auditing an inherited workbook.",
          "Formulas > Trace Precedents draws arrows to the cells a formula depends on.",
          "Keep a clearly labelled 'Assumptions' block at the top of your sheet, and point every formula at it.",
        ],
        practice:
          "Put a rate in F1. In B2:B10 put some amounts. Write =B2*F1 in C2 and copy it down — watch it break. Now change it to =B2*$F$1 and copy again. That contrast is the whole lesson.",
      },
    },
    {
      slug: "vlookup-xlookup-index-match",
      title: "VLOOKUP, XLOOKUP, and INDEX/MATCH",
      summary: "The lookup toolkit every workplace analyst actually uses.",
      type: "lesson",
      durationMinutes: 22,
      isFree: false,
      content: {
        kind: "lesson",
        objectives: [
          "Write a VLOOKUP correctly, including the argument everyone forgets",
          "Use XLOOKUP where available, and know why it's better",
          "Fall back to INDEX/MATCH when VLOOKUP can't do the job",
        ],
        scenario:
          "You have a sales sheet with employee IDs, and a separate HR sheet with IDs, names and departments. You need names and departments beside each sale. Copying them across by hand is not an option for 2,000 rows. This is the single most valuable skill in workplace Excel.",
        steps: [
          {
            title: "Understand what a lookup actually does",
            detail:
              "A lookup takes a value you have (an employee ID), finds it in another table, and returns something from the same row (their name). That's the entire concept. Everything else is syntax.",
          },
          {
            title: "Write VLOOKUP with all four arguments",
            detail:
              "=VLOOKUP(A2, HR!$A$2:$C$500, 3, FALSE). Read it as: look for the value in A2, search the range on the HR sheet, return whatever is in the 3rd column of that range, and FALSE means find an exact match. Note the $ signs locking the range — without them, copying down shifts the table and results go wrong halfway through.",
          },
          {
            title: "Always use FALSE for the fourth argument",
            detail:
              "That fourth argument is the one people omit. TRUE (or leaving it blank) means approximate match, which requires the data to be sorted and will happily return the wrong person's name if it isn't. Use FALSE — exact match — essentially always. Approximate match has legitimate uses, like tax slabs, but they're rare and deliberate.",
          },
          {
            title: "Know VLOOKUP's hard limitation",
            detail:
              "VLOOKUP can only look right. The value you search for must be in the leftmost column of your range, and you can only return something to its right. If your IDs sit to the right of the names you need, VLOOKUP simply cannot do it — which is exactly when people start rearranging their source data, and that's the wrong solution.",
          },
          {
            title: "Use XLOOKUP if your Excel has it",
            detail:
              "=XLOOKUP(A2, HR!$A$2:$A$500, HR!$C$2:$C$500, \"Not found\"). You give it the value, the column to search, and the column to return — two separate ranges, so direction stops mattering. The fourth argument is what to show when nothing is found, which replaces wrapping the whole thing in IFERROR. It's available in Microsoft 365 and Excel 2021 onward.",
          },
          {
            title: "Use INDEX/MATCH when XLOOKUP isn't available",
            detail:
              "=INDEX(HR!$C$2:$C$500, MATCH(A2, HR!$A$2:$A$500, 0)). Read it inside-out: MATCH finds which row position the ID sits at, and INDEX returns the value at that position from the column you want. Like XLOOKUP it works in any direction, and it works in every version of Excel ever shipped. Many experienced analysts still prefer it.",
          },
          {
            title: "Diagnose #N/A properly",
            detail:
              "#N/A means the lookup value genuinely wasn't found. Before assuming the data is missing, check three things: trailing spaces (wrap the lookup value in TRIM), a number stored as text on one side but as a real number on the other, and whether your locked range actually covers all the rows. In practice, one of those three is the cause almost every time.",
          },
        ],
        tips: [
          "Convert your lookup table to a Table (Ctrl+T) and reference it by name — the range then grows automatically when rows are added.",
          "Wrap in IFNA rather than IFERROR when you only want to catch 'not found': =IFNA(VLOOKUP(...),\"Missing\").",
          "To check whether an ID exists at all, use =COUNTIF(range, A2) — it returns 0 or a count, and is faster to reason about than a failing lookup.",
          "If a lookup returns the wrong row entirely, you've almost certainly forgotten FALSE.",
        ],
        practice:
          "Build two small sheets: five IDs with names, and three of those IDs on another sheet. Write a VLOOKUP to pull the names across. Then deliberately add a trailing space to one ID and watch it break — then fix it with TRIM.",
      },
    },
    {
      slug: "logical-functions",
      title: "IF, IFS, AND/OR in Real Reports",
      summary: "Build decision logic that doesn't break on edge cases.",
      type: "lesson",
      durationMinutes: 18,
      isFree: false,
      content: {
        kind: "lesson",
        objectives: [
          "Write IF statements that read clearly and handle edge cases",
          "Combine conditions with AND and OR",
          "Use COUNTIF/SUMIF to summarise by condition without a PivotTable",
        ],
        scenario:
          "Your manager wants a status column on the project tracker: 'Overdue' if the due date has passed and the task isn't complete, 'Due Soon' if it's within seven days, 'On Track' otherwise. And they want the count of each, on the summary sheet, updating automatically.",
        steps: [
          {
            title: "Write a single IF cleanly",
            detail:
              "=IF(condition, value_if_true, value_if_false). For example =IF(D2>100000,\"Above target\",\"Below target\"). Read it aloud as a sentence — if it doesn't read as a sentence, it's probably wrong.",
          },
          {
            title: "Nest IFs only when you must, and in the right order",
            detail:
              "=IF(D2>100000,\"Gold\",IF(D2>50000,\"Silver\",\"Bronze\")). Excel evaluates left to right and stops at the first TRUE, so conditions must run from most to least restrictive. Reverse the order and everything above 50,000 becomes Silver, including your Gold cases — a genuinely common bug that passes a quick glance.",
          },
          {
            title: "Prefer IFS for multiple conditions",
            detail:
              "=IFS(D2>100000,\"Gold\", D2>50000,\"Silver\", TRUE,\"Bronze\"). Each condition sits beside its result, with no closing-bracket pile-up. The final TRUE acts as the catch-all 'otherwise'. Available in Excel 2019 and Microsoft 365.",
          },
          {
            title: "Combine conditions with AND and OR",
            detail:
              "AND requires everything to be true: =IF(AND(D2>50000, E2=\"Delivered\"),\"Payable\",\"Hold\"). OR requires any one: =IF(OR(E2=\"Cancelled\", E2=\"Returned\"),\"Excluded\",\"Include\"). They read exactly as they sound, and they nest inside IF wherever a condition goes.",
          },
          {
            title: "Build the tracker's status column",
            detail:
              "=IFS(C2=\"Complete\",\"Done\", B2<TODAY(),\"Overdue\", B2<=TODAY()+7,\"Due Soon\", TRUE,\"On Track\") — where B is the due date and C the completion status. Order matters: checking 'Complete' first means a finished task never shows as overdue, which is what the manager actually wants.",
          },
          {
            title: "Count and sum by condition",
            detail:
              "=COUNTIF(F:F,\"Overdue\") counts every row with that status. =SUMIF(D:D,\">100000\") totals only values above the threshold. For several conditions at once use the plural forms: =COUNTIFS(F:F,\"Overdue\",G:G,\"Mumbai\"). These give you a live summary without building a PivotTable.",
          },
          {
            title: "Handle blanks explicitly",
            detail:
              "An empty cell in a comparison behaves as zero, so =IF(D2>0,...) treats blank rows as 'not above zero' — usually fine — while =IF(D2=\"\",\"Missing\",...) checks for genuinely empty. Decide what blank means in your data and test that case deliberately, because blanks are where reporting logic quietly goes wrong.",
          },
        ],
        tips: [
          "Excel treats TRUE as 1 and FALSE as 0, so =SUMPRODUCT((A:A=\"Mumbai\")*1) counts matches — useful once you're comfortable.",
          "Text comparisons in IF are not case-sensitive: \"mumbai\" equals \"Mumbai\".",
          "If a nested IF grows past three levels, switch to IFS or a lookup table. Deep nesting is unreadable and unmaintainable.",
          "Always test the boundary: if the rule is 'above 50,000', check what happens at exactly 50,000.",
        ],
        practice:
          "Build a 10-row task list with due dates and a Complete column. Write the IFS status formula above. Then add COUNTIF cells that tally each status. Change a date and watch both update.",
      },
    },
    {
      slug: "formulas-quiz",
      title: "Quiz: Formulas and Functions",
      summary: "10 questions covering lookups and logic.",
      type: "quiz",
      durationMinutes: 8,
      isFree: false,
      content: {
        kind: "quiz",
        intro:
          "Ten questions on references, lookups and logic. These are the mistakes that show up in real workbooks — if you can spot them here, you'll spot them in your own files.",
        questions: [
          {
            question: "You write =B2*F1 and copy it down 200 rows. Results below the first row are wrong. Why?",
            options: [
              "Excel has a row limit for formulas",
              "F1 is a relative reference, so it drifts to F2, F3 and so on",
              "The formula needs to be entered as an array",
              "B2 should be absolute instead",
            ],
            correctIndex: 1,
            explanation:
              "Relative references move with the formula. As it copies down, F1 becomes F2, F3... eventually landing on empty cells and returning zero. Lock it as $F$1.",
          },
          {
            question: "What does the FALSE argument at the end of a VLOOKUP do?",
            options: [
              "Hides errors",
              "Makes the lookup case-sensitive",
              "Requires an exact match",
              "Searches from right to left",
            ],
            correctIndex: 2,
            explanation:
              "FALSE means exact match. TRUE (or omitting it) means approximate match, which requires sorted data and silently returns wrong results when the data isn't sorted. Use FALSE almost always.",
          },
          {
            question: "Your lookup values sit in column D, and the data you need to return is in column A of the same table. What should you use?",
            options: [
              "VLOOKUP with a negative column number",
              "XLOOKUP or INDEX/MATCH",
              "VLOOKUP with TRUE",
              "It's impossible in Excel",
            ],
            correctIndex: 1,
            explanation:
              "VLOOKUP can only return values to the right of the search column. XLOOKUP and INDEX/MATCH take separate search and return ranges, so direction doesn't matter.",
          },
          {
            question: "A VLOOKUP returns #N/A even though you can see the value in the source table. What's the most likely cause?",
            options: [
              "Excel needs restarting",
              "A trailing space, or a number stored as text on one side",
              "The table has too many rows",
              "You must sort the table first",
            ],
            correctIndex: 1,
            explanation:
              "'Mumbai ' and 'Mumbai' are different strings, and 101 as text doesn't match 101 as a number. Wrap the lookup value in TRIM, and check alignment to spot text-numbers.",
          },
          {
            question: "What does =IF(D2>100000,\"Gold\",IF(D2>50000,\"Silver\",\"Bronze\")) return for a value of 120,000?",
            options: ["Gold", "Silver", "Bronze", "#VALUE!"],
            correctIndex: 0,
            explanation:
              "Excel evaluates left to right and stops at the first TRUE. 120,000 satisfies the first condition, so it returns Gold. Reversing the order would wrongly return Silver.",
          },
          {
            question: "Which error means you performed arithmetic on text?",
            options: ["#N/A", "#REF!", "#VALUE!", "#NAME?"],
            correctIndex: 2,
            explanation:
              "#VALUE! is a type mismatch — maths on text. #REF! means a referenced cell was deleted, #N/A means a lookup found nothing, and #NAME? means a misspelled function name.",
          },
          {
            question: "You want to count rows where status is 'Overdue' AND region is 'Mumbai'. Which function?",
            options: ["COUNTIF", "COUNTIFS", "SUMIF", "COUNTA"],
            correctIndex: 1,
            explanation:
              "The plural forms (COUNTIFS, SUMIFS, AVERAGEIFS) accept multiple condition pairs. COUNTIF handles only one condition.",
          },
          {
            question: "What is the risk of wrapping every formula in IFERROR?",
            options: [
              "It slows Excel down significantly",
              "It hides genuine problems you needed to know about",
              "It only works with VLOOKUP",
              "There's no risk — it's best practice",
            ],
            correctIndex: 1,
            explanation:
              "IFERROR suppresses all errors, including ones signalling real data problems. Understand why a formula errors before you hide it; then use IFNA if you only want to catch 'not found'.",
          },
          {
            question: "While editing a formula, you select part of it and press F9. What happens?",
            options: [
              "Excel recalculates the whole workbook",
              "That part is replaced permanently with its result",
              "Excel shows what that part evaluates to, and Esc leaves the formula unchanged",
              "The formula is converted to text",
            ],
            correctIndex: 2,
            explanation:
              "F9 evaluates the selected fragment in place — the best debugging tool in Excel. Press Esc to exit without changing anything; pressing Enter would bake in the result.",
          },
          {
            question: "In =VLOOKUP(A2, HR!$A$2:$C$500, 3, FALSE), what does the 3 refer to?",
            options: [
              "The third row of the table",
              "The third column of the specified range, counting from its leftmost column",
              "Column C of the worksheet",
              "The number of matches to return",
            ],
            correctIndex: 1,
            explanation:
              "It counts columns within the range you gave, not worksheet columns. Here the range starts at column A, so 3 happens to be column C — but if the range started at B, 3 would be column D.",
          },
        ],
      },
    },
  ],
};
