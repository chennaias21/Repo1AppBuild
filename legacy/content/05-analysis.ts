import type { Module } from "@/lib/content-types";

export const analysisModule: Module = {
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
      content: {
        kind: "lesson",
        objectives: [
          "Sort by multiple columns without scrambling your data",
          "Filter to answer specific questions quickly",
          "Use the status bar and SUBTOTAL to summarise what's visible",
        ],
        scenario:
          "In a review meeting your manager asks: 'What did the Mumbai team sell in March, and who was the top performer?' You have the raw data open. You should be able to answer in twenty seconds, without writing a single formula.",
        steps: [
          {
            title: "Sort the whole table, never one column",
            detail:
              "Click any single cell inside the data and use Data > Sort. Excel expands the selection to the whole table automatically. The catastrophic mistake is selecting just one column and sorting that — it reorders that column while leaving every other column in place, silently destroying the relationship between fields. If Excel offers 'Continue with the current selection', that's the warning: choose 'Expand the selection'.",
          },
          {
            title: "Sort by multiple levels",
            detail:
              "Data > Sort > Add Level lets you sort by Region, then by Salesperson, then by Amount descending. Levels apply in order, so put the broadest grouping at the top. This is how you produce a report that reads sensibly without any formulas at all.",
          },
          {
            title: "Turn on filters",
            detail:
              "Select any cell in your data and press Ctrl+Shift+L (or Data > Filter). Dropdown arrows appear on every header. From there you can tick specific values, search within the list, or use Number Filters / Date Filters for conditions like 'greater than' or 'last month'.",
          },
          {
            title: "Read the status bar",
            detail:
              "With a filter applied, select the amount column and look at the bottom-right of the Excel window. It shows Count, Sum and Average of the visible cells only. This is the fastest way to answer 'what did Mumbai sell in March' — filter to Mumbai and March, select the column, read the sum. No formula, no PivotTable, ten seconds.",
          },
          {
            title: "Use SUBTOTAL instead of SUM with filters",
            detail:
              "SUM always totals everything, including rows hidden by a filter. =SUBTOTAL(9,D2:D500) totals only the visible rows and updates as you change the filter. The 9 means 'sum'; 1 is average, 2 is count, 3 is counta. Put SUBTOTAL at the top of your sheet, not the bottom, so it stays visible while scrolling.",
          },
          {
            title: "Filter by colour when you've used conditional formatting",
            detail:
              "If you've highlighted overdue items in red, the filter dropdown includes 'Filter by Color'. This turns a visual flag into a working filter, which is a neat way to isolate exactly the rows a conditional rule caught.",
          },
          {
            title: "Clear filters before sharing",
            detail:
              "A filtered file looks like it's missing data to whoever opens it next. Data > Clear removes all filters. Better still, note in your summary sheet what filters produced each figure — future you will not remember.",
          },
        ],
        tips: [
          "Ctrl+Shift+L toggles filters on and off instantly.",
          "Convert to a Table (Ctrl+T) and you get filters automatically, plus a Total Row that uses SUBTOTAL correctly by default.",
          "Sorting a column of text-numbers gives alphabetical order (1, 10, 100, 2). If sorting looks wrong, your numbers are text.",
          "Custom Sort > Order > Custom List lets you sort by a non-alphabetical sequence such as Jan, Feb, Mar or your own grade bands.",
        ],
        practice:
          "On any dataset, filter to one category, select a numeric column, and read the sum from the status bar. Then write =SUBTOTAL(9,range) and change the filter — watch it follow.",
      },
    },
    {
      slug: "what-if-analysis",
      title: "What-If Analysis: Goal Seek and Data Tables",
      summary: "Model scenarios the way finance teams actually do.",
      type: "lesson",
      durationMinutes: 16,
      isFree: false,
      content: {
        kind: "lesson",
        objectives: [
          "Use Goal Seek to work backwards from a target",
          "Build a one- and two-variable data table to compare scenarios",
          "Structure a model so scenarios are easy to run",
        ],
        scenario:
          "Your target is ₹50 lakh revenue this quarter. Current pipeline and conversion rate get you to ₹41 lakh. The question in the meeting will be: what conversion rate would we need to hit target? Guessing and retyping numbers until it works is what most people do. Goal Seek answers it in five seconds.",
        steps: [
          {
            title: "Build the model with assumptions in their own cells",
            detail:
              "Before any what-if analysis is possible, the model must be formula-driven end to end. Leads, conversion rate, and average deal value each get their own labelled cell; revenue is =leads × rate × value. If any of those are typed as constants inside the revenue formula, what-if tools have nothing to change.",
          },
          {
            title: "Run Goal Seek",
            detail:
              "Data > What-If Analysis > Goal Seek. 'Set cell' is your revenue cell. 'To value' is 5000000. 'By changing cell' is your conversion rate cell. Excel iterates until it finds the rate that produces exactly that revenue, and writes it into the cell. Note that it changes the cell permanently — press Ctrl+Z if you only wanted to know the answer.",
          },
          {
            title: "Know Goal Seek's limits",
            detail:
              "It changes exactly one input to hit exactly one target. It cannot optimise multiple variables at once, and it can't apply constraints like 'rate must stay below 40%'. For those you'd need Solver (an add-in). For the great majority of workplace questions, one input and one target is precisely what's being asked.",
          },
          {
            title: "Build a one-variable data table",
            detail:
              "List candidate conversion rates down a column. In the cell one row up and one column right of that list, reference your revenue formula (=B10). Select the whole block including both, then Data > What-If Analysis > Data Table. Leave 'Row input cell' blank and set 'Column input cell' to your conversion-rate cell. Excel fills in the resulting revenue for every rate — a complete sensitivity analysis in one step.",
          },
          {
            title: "Extend to two variables",
            detail:
              "Put conversion rates down the left column and average deal values across the top row, with the formula reference in the corner cell where they meet. Select the whole grid, run Data Table, and set both Row input cell and Column input cell. You now have a grid showing revenue for every combination — the exact table finance teams bring to planning meetings.",
          },
          {
            title: "Use Scenario Manager for named cases",
            detail:
              "Data > What-If Analysis > Scenario Manager lets you save named sets of inputs — 'Best case', 'Base case', 'Worst case' — and switch between them, or produce a summary comparing all three. It's more structured than data tables when you have several inputs changing together.",
          },
        ],
        tips: [
          "Goal Seek overwrites the input cell. Note the original value first, or work on a copy of the sheet.",
          "Data tables recalculate on every workbook change and can slow large files. Formulas > Calculation Options > Automatic Except for Data Tables helps.",
          "If Goal Seek says it can't find a solution, the target may be unreachable — sometimes that's genuinely the answer to bring to the meeting.",
          "Colour your input cells differently from calculated cells. It's a small convention that prevents people typing over formulas.",
        ],
        practice:
          "Build a three-input revenue model (leads, conversion %, deal value). Use Goal Seek to find the conversion rate needed for a target you choose. Then build a one-variable data table showing revenue across five different rates.",
      },
    },
    {
      slug: "analysis-exercise",
      title: "Exercise: Answer 8 Business Questions From One Sheet",
      summary: "Practice pulling insight, not just formatting.",
      type: "exercise",
      durationMinutes: 25,
      isFree: false,
      content: {
        kind: "exercise",
        scenario:
          "You have a sales dataset with these columns: Date, Region, Salesperson, Product, Units, Unit Price, Total. Roughly 500 rows covering a full year. Your manager fires eight questions at you in a meeting. Answer each using sorting, filtering, the status bar, and conditional formulas only — no PivotTables yet. Time yourself: an experienced analyst answers all eight in under fifteen minutes.",
        tasks: [
          "What is total revenue for the full year?",
          "Which region generated the most revenue, and how much?",
          "Who was the top salesperson by revenue, and what did they sell?",
          "How many transactions were above ₹1,00,000?",
          "What is the average transaction value in the Mumbai region?",
          "Which product sold the most units overall?",
          "How many transactions happened in the last quarter of the year?",
          "Which salespeople had zero transactions above ₹50,000?",
        ],
        hints: [
          "For totals of the whole dataset, select the column and read the Sum in the status bar.",
          "For 'per region' answers, filter to one region at a time and read the status bar — or write =SUMIF(Region_range,\"Mumbai\",Total_range).",
          "Counting with a condition is COUNTIF; counting with two conditions is COUNTIFS.",
          "For the last question, COUNTIFS per salesperson with a >50000 condition, then look for the zeros.",
          "For date-range questions, Date Filters > Between is faster than writing formulas.",
        ],
        solution: [
          "Total revenue: select the Total column, read Sum from the status bar. Or =SUM(G:G).",
          "Top region: =SUMIF($B:$B,\"Mumbai\",$G:$G) repeated per region, or filter each region and read the status bar. Compare the results.",
          "Top salesperson: =SUMIF($C:$C,name,$G:$G) per person; then filter to that person to see their product mix.",
          "Transactions above ₹1,00,000: =COUNTIF(G:G,\">100000\").",
          "Average in Mumbai: =AVERAGEIF($B:$B,\"Mumbai\",$G:$G).",
          "Most units by product: =SUMIF($D:$D,product,$E:$E) per product, then compare — note this asks for units, not revenue.",
          "Last-quarter count: =COUNTIFS($A:$A,\">=01-Oct-2025\",$A:$A,\"<=31-Dec-2025\") with your own dates, or use a Date Filter and read Count.",
          "Zero large deals: =COUNTIFS($C:$C,name,$G:$G,\">50000\") per salesperson; the ones returning 0 are your answer.",
        ],
      },
    },
  ],
};
