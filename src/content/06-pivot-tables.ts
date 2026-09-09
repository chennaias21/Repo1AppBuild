import type { Module } from "@/lib/content-types";

export const pivotTablesModule: Module = {
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
      content: {
        kind: "lesson",
        objectives: [
          "Build a PivotTable from raw transactional data",
          "Understand what Rows, Columns, Values and Filters each do",
          "Change how values are summarised, and refresh correctly when data changes",
        ],
        scenario:
          "You have 12,000 sales transactions. Your manager wants revenue by region, broken down by month, with the ability to look at one product at a time. Doing this with SUMIFS would take an hour and be fragile. A PivotTable does it in four minutes and can be rearranged live in the meeting.",
        steps: [
          {
            title: "Prepare the source data first",
            detail:
              "A PivotTable needs clean, tabular data: one header row, no blank rows or columns inside the data, one fact per cell, and no merged cells. If Module 3 felt tedious, this is where it pays off — a PivotTable built on messy data produces confidently wrong answers.",
            },
          {
            title: "Convert the source to a Table",
            detail:
              "Select the data and press Ctrl+T. This matters more than it looks: a PivotTable built on a Table automatically includes new rows when they're added. Built on a fixed range like A1:G12000, it silently ignores everything you add later — a classic cause of month-end numbers being quietly wrong.",
          },
          {
            title: "Insert the PivotTable",
            detail:
              "Click inside the data, then Insert > PivotTable > New Worksheet. You get an empty frame and a field list on the right listing your column headers. Nothing has been calculated yet — you're about to describe the summary you want.",
          },
          {
            title: "Understand the four zones",
            detail:
              "Rows: what you want listed down the side (Region). Columns: what you want across the top (Month). Values: the number being summarised (Total). Filters: a field you want to slice the whole table by (Product). Drag field names into these zones and the table builds itself instantly.",
          },
          {
            title: "Build the manager's request",
            detail:
              "Drag Region to Rows, Date to Columns, Total to Values, Product to Filters. Modern Excel automatically groups dates into Months and Years — if it doesn't, right-click any date in the pivot > Group > Months. You now have exactly what was asked for, and you can change Product in the filter dropdown live.",
          },
          {
            title: "Change how values are summarised",
            detail:
              "By default numbers are summed and text is counted. To change: right-click any value > Summarize Values By > Average, Count, Max, and so on. If a numeric field arrives as 'Count of Total' instead of 'Sum of Total', that's the signal that the column contains text somewhere — go back and fix the source.",
          },
          {
            title: "Show percentages instead of raw values",
            detail:
              "Right-click a value > Show Values As > % of Grand Total (or % of Column Total). This converts your revenue table into a contribution table without any formulas. Drag the same field into Values twice to show absolute value and percentage side by side.",
          },
          {
            title: "Refresh — this is the step people forget",
            detail:
              "A PivotTable does not update when the source data changes. Right-click > Refresh, or Data > Refresh All (Ctrl+Alt+F5). If your pivot disagrees with your raw data, refresh before you debug anything else. It's the answer roughly half the time.",
          },
        ],
        tips: [
          "Double-click any value in a PivotTable and Excel creates a new sheet listing the underlying rows behind that number. This is the fastest audit tool there is.",
          "Right-click > PivotTable Options > Layout & Format > tick 'Preserve cell formatting on update' so your formatting survives refreshes.",
          "Design > Report Layout > Show in Tabular Form gives the conventional table look instead of the indented default.",
          "Blank cells in a value field display as empty. PivotTable Options > 'For empty cells show' > 0 makes reports read better.",
        ],
        practice:
          "Take any dataset with a date, a category and an amount. Build a pivot showing amount by category down the side and month across the top. Then add a filter field and switch between values. Four minutes, start to finish.",
      },
    },
    {
      slug: "pivot-charts-and-slicers",
      title: "PivotCharts, Slicers, and Timelines",
      summary: "Make pivots interactive for the people reading your report.",
      type: "lesson",
      durationMinutes: 16,
      isFree: false,
      content: {
        kind: "lesson",
        objectives: [
          "Add a PivotChart that stays in sync with its PivotTable",
          "Use slicers and timelines to make reports self-service",
          "Connect one slicer to several PivotTables at once",
        ],
        scenario:
          "Your regional report is accurate, but every week three managers email asking 'can you send me just my region?' Slicers solve this permanently: you send one file, and each manager clicks their own region. You stop being a filter service.",
        steps: [
          {
            title: "Insert a PivotChart",
            detail:
              "Click inside your PivotTable, then PivotTable Analyze > PivotChart, and choose a type. Column charts for comparing categories, line charts for trends over time. The chart is bound to the pivot — change the pivot and the chart follows, automatically.",
          },
          {
            title: "Choose the chart type honestly",
            detail:
              "Column for comparison across categories. Line for change over time. Bar (horizontal) when category names are long. Avoid pie charts beyond three or four slices — people genuinely cannot compare angles, and a bar chart communicates the same thing more accurately.",
          },
          {
            title: "Add slicers",
            detail:
              "Click the PivotTable, then PivotTable Analyze > Insert Slicer, and tick the fields you want — Region, Product. Slicers are large clickable buttons. Unlike the Filters zone, they show what's currently selected without anyone opening a dropdown, which is exactly what a non-Excel-user needs.",
          },
          {
            title: "Add a timeline for dates",
            detail:
              "PivotTable Analyze > Insert Timeline works only on genuine date fields. It gives a sliding date-range control that can switch between years, quarters, months and days. It's far friendlier than a date filter for anyone reading your report.",
          },
          {
            title: "Connect one slicer to multiple PivotTables",
            detail:
              "This is what turns several pivots into a single dashboard. Right-click the slicer > Report Connections, and tick every PivotTable it should control. Now one click on 'Mumbai' filters all charts and tables at once. Note: all connected pivots must share the same source data.",
          },
          {
            title: "Tidy the slicer for presentation",
            detail:
              "With the slicer selected, use the Slicer tab to set the number of columns (so buttons sit in a row rather than a tall stack), resize it, and pick a style. Slicer Settings lets you hide items with no data. Small effort, and it's the difference between a report that looks built and one that looks assembled.",
          },
        ],
        tips: [
          "Ctrl-click or shift-click selects multiple slicer items. The funnel-with-cross icon at the top-right clears the selection.",
          "PivotChart buttons can be hidden for a cleaner look: right-click the chart > Hide All Field Buttons on Chart.",
          "Slicers connected across sheets still work — keep the pivots on a working sheet and put slicers with the chart on the presentation sheet.",
          "If Report Connections shows nothing, the pivots use different source ranges. Rebuild them from the same Table.",
        ],
        practice:
          "Build one PivotTable and one PivotChart from the same data. Add a Region slicer and connect it to both. Click through regions and confirm everything moves together.",
      },
    },
    {
      slug: "pivot-table-project",
      title: "Project: Monthly Sales Summary From Raw Transactions",
      summary: "A complete, realistic PivotTable build.",
      type: "project",
      durationMinutes: 30,
      isFree: false,
      content: {
        kind: "project",
        scenario:
          "You've been asked to produce the monthly sales pack that goes to the leadership team. The input is a raw transaction export: Date, Region, Salesperson, Product, Units, Unit Price, Total — around 5,000 rows. The output must be a single summary sheet leadership can use themselves without asking you to re-cut it.",
        deliverables: [
          "A source Table (Ctrl+T) that new data can be appended to safely",
          "A summary sheet with at least three PivotTables: revenue by region and month, top 10 salespeople, and revenue by product",
          "A PivotChart showing the monthly revenue trend",
          "Slicers for Region and Product connected to every PivotTable, plus a date timeline",
        ],
        steps: [
          {
            title: "Prepare and convert the source",
            detail:
              "Verify the data is clean: one header row, no blanks inside, dates recognised as dates (right-aligned), Total as a real number. Then select it and press Ctrl+T. Name the Table on the Table Design tab — 'SalesData' — so references stay readable.",
          },
          {
            title: "Build the revenue-by-region-and-month pivot",
            detail:
              "Insert > PivotTable on a new sheet named 'Summary'. Region to Rows, Date to Columns (grouped by Month), Total to Values. Format the values as Accounting with no decimals so the numbers are readable.",
          },
          {
            title: "Build the top-10 salespeople pivot",
            detail:
              "Second PivotTable: Salesperson to Rows, Total to Values, sorted descending. Then right-click the Salesperson field > Filter > Top 10 > Top 10 by Sum of Total. This updates itself as data changes — no manual re-ranking each month.",
          },
          {
            title: "Build the product mix pivot",
            detail:
              "Third PivotTable: Product to Rows, Total to Values, and add Total a second time shown as % of Grand Total. Leadership almost always wants both the number and the share.",
          },
          {
            title: "Add the trend chart",
            detail:
              "Create a PivotChart from the region/month pivot as a line chart, showing monthly totals. Give it a clear title stating what and when: 'Monthly Revenue, FY 2025-26'.",
          },
          {
            title: "Add and connect slicers",
            detail:
              "Insert slicers for Region and Product and a timeline for Date. Right-click each > Report Connections and tick all three PivotTables. Test by clicking one region and confirming every element updates together.",
          },
          {
            title: "Lay out the summary sheet for reading",
            detail:
              "Put slicers along the top, the chart prominently, and the tables below. Hide gridlines (View > uncheck Gridlines). Add a title with the reporting period and a note stating the data source and refresh date.",
          },
          {
            title: "Document the refresh process",
            detail:
              "Add a short note on the sheet: 'To update: paste new transactions at the bottom of the SalesData table, then Data > Refresh All.' Without this, the pack breaks the first time someone else has to run it.",
          },
        ],
        successCriteria: [
          "Adding new rows to the source Table and clicking Refresh All updates every pivot and chart",
          "One slicer click filters all three PivotTables and the chart simultaneously",
          "The top-10 list re-ranks itself automatically rather than being hard-coded",
          "The summary sheet is readable without the reader touching the raw data",
          "A colleague could refresh the pack next month using only your on-sheet instructions",
        ],
      },
    },
  ],
};
