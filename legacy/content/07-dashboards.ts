import type { Module } from "@/lib/content-types";

export const dashboardsModule: Module = {
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
      content: {
        kind: "lesson",
        objectives: [
          "Decide what belongs on a dashboard and what doesn't",
          "Lay out a dashboard so the most important number is found first",
          "Use colour deliberately rather than decoratively",
        ],
        scenario:
          "You send a dashboard with fourteen charts. Your manager replies asking 'so are we ahead or behind?' — the one question the dashboard failed to answer. More information is not more useful. A dashboard is an argument, not an inventory.",
        steps: [
          {
            title: "Start with the decision, not the data",
            detail:
              "Ask what decision this dashboard supports, and who makes it. 'Should we shift budget between regions?' produces a very different dashboard from 'are we on track this month?'. If you can't name the decision, you're building a data dump and the feedback will reflect that.",
          },
          {
            title: "Lead with three to five headline numbers",
            detail:
              "Across the top, put the KPIs that answer the main question: revenue vs target, growth versus last period, and so on. Large text, clear label, and a comparison. A number without a comparison is nearly meaningless — ₹42 lakh is neither good nor bad until you know the target was ₹40 lakh.",
          },
          {
            title: "Respect how people read",
            detail:
              "Eyes travel top-left to bottom-right. Put the most important content top-left, supporting detail below and to the right. Fine detail and methodology go at the bottom or on a separate sheet. Never make someone scroll horizontally — design to fit one screen width.",
          },
          {
            title: "Use colour to mean something",
            detail:
              "Pick one accent colour for your primary metric and grey for everything else. Reserve red and green strictly for bad and good — if red also appears as decoration, it stops carrying meaning. Roughly 1 in 12 men has some red-green colour blindness, so never rely on colour alone; pair it with an arrow, a sign, or a label.",
          },
          {
            title: "Strip the chart junk",
            detail:
              "Remove gridlines, chart borders, and legends where a direct label would do. Delete the default 'Chart Title' and write what the chart shows. Every element that isn't carrying information is competing with the elements that are.",
          },
          {
            title: "Hide the machinery",
            detail:
              "Keep raw data and the PivotTables driving the visuals on separate sheets, and hide those sheets (right-click tab > Hide). The dashboard sheet should show only the finished output. Turn off gridlines on the dashboard sheet (View > uncheck Gridlines) — it instantly looks like a designed page rather than a spreadsheet.",
          },
          {
            title: "Label the data's provenance",
            detail:
              "Put a small line at the bottom: source system, date range covered, and when it was last refreshed. This single line prevents a lot of confusion and gives the reader a reason to trust the numbers.",
          },
        ],
        tips: [
          "Test it by showing someone for ten seconds, then asking what they took away. If it isn't your main message, the layout is wrong.",
          "Set a consistent number format everywhere — mixing ₹42,00,000 and ₹42L on the same screen erodes confidence.",
          "Use Freeze Panes so headline KPIs stay visible if the page does scroll.",
          "Build in greyscale first and add colour last. If it doesn't work in grey, colour is doing work that structure should be doing.",
        ],
        practice:
          "Take a dashboard you've seen at work and write down the single question it's meant to answer. Then list which elements serve that question and which don't. That list is your redesign.",
      },
    },
    {
      slug: "kpi-dashboard-build",
      title: "Building a KPI Dashboard From Scratch",
      summary: "Charts, cards, and slicers tied together on one sheet.",
      type: "lesson",
      durationMinutes: 28,
      isFree: false,
      content: {
        kind: "lesson",
        objectives: [
          "Build KPI cards that update automatically",
          "Combine PivotCharts and slicers into one coherent sheet",
          "Add sparklines and conditional indicators for context",
        ],
        scenario:
          "You're building the monthly dashboard the leadership team will actually open. It needs four KPI cards at the top, a trend chart, a regional breakdown, and controls so people can look at their own slice without asking you.",
        steps: [
          {
            title: "Set up the sheet structure",
            detail:
              "Create three sheets: 'Data' (the source Table), 'Calc' (PivotTables and helper formulas), and 'Dashboard' (the visible output). This separation is what keeps a dashboard maintainable — everything the reader sees lives on one sheet, and everything that computes it lives elsewhere.",
          },
          {
            title: "Build KPI cards",
            detail:
              "On the Dashboard sheet, merge a small block of cells (this is one of the few places merging is fine, because it isn't a data table). Put the label in small grey text and the value in large bold text below, pulling from a Calc-sheet formula such as =Calc!B2. Add a second small line showing the comparison: =TEXT((actual-target)/target,\"+0.0%;-0.0%\")&\" vs target\".",
          },
          {
            title: "Add a conditional colour to the comparison",
            detail:
              "Apply a conditional formatting rule to the comparison cell: green text when above zero, red when below. Because the value is a formula, the colour updates itself. Add an arrow via a custom number format — ▲0.0%;▼0.0% — so the direction reads without relying on colour alone.",
          },
          {
            title: "Add the trend chart",
            detail:
              "Build a PivotTable on the Calc sheet showing revenue by month, create a line PivotChart from it, then cut and paste the chart onto the Dashboard sheet. Remove the legend, gridlines and border. Title it with the actual message: 'Revenue trending 8% above last year'.",
          },
          {
            title: "Add sparklines for compact history",
            detail:
              "Select a cell next to a KPI card, then Insert > Sparklines > Line, and point it at a row of monthly figures on the Calc sheet. You get a tiny inline chart inside a single cell — twelve months of context in the space of a word. Sparklines are one of the most underused features in Excel.",
          },
          {
            title: "Add slicers and connect everything",
            detail:
              "Insert slicers for Region and Product from any PivotTable, place them along the top of the Dashboard sheet, then use Report Connections to link every PivotTable behind the visuals. Test that a single click updates the cards, the chart and the breakdown table together.",
          },
          {
            title: "Finish the presentation",
            detail:
              "Turn off gridlines (View > uncheck Gridlines). Hide the Calc sheet. Set the print area and orientation so it prints to one page if anyone needs it on paper. Add the source-and-refresh-date line at the bottom. Then press Ctrl+Home so the file opens at the top-left when someone else opens it.",
          },
        ],
        tips: [
          "Cell-based KPI cards beat text boxes — text boxes don't recalculate and drift when rows resize.",
          "Camera tool (add it via Quick Access Toolbar) creates a live picture of a range, useful for placing a table anywhere on the dashboard.",
          "If the file gets slow, look at conditional formatting rules and volatile functions like OFFSET and INDIRECT first.",
          "Protect the Dashboard sheet (Review > Protect Sheet) so readers can use slicers but can't accidentally overwrite a formula.",
        ],
        practice:
          "Build one KPI card end to end: label, big number pulling from a pivot, percentage-versus-target with conditional colour, and a sparkline beside it. Get one card right and the rest are repetition.",
      },
    },
    {
      slug: "dashboard-project",
      title: "Project: Executive Dashboard for a Retail Business",
      summary: "A capstone-style dashboard project.",
      type: "project",
      durationMinutes: 40,
      isFree: false,
      content: {
        kind: "project",
        scenario:
          "A retail business with eight stores across four cities wants a single-page monthly dashboard for its leadership team. You have a year of transaction data: Date, Store, City, Category, Units, Revenue, Cost. Leadership meets monthly and wants to answer: are we growing, which stores need attention, and which categories drive profit.",
        deliverables: [
          "A one-page Dashboard sheet that fits a single screen without horizontal scrolling",
          "Four KPI cards: total revenue, gross margin %, growth vs. previous month, and units sold",
          "A monthly revenue trend chart and a store-performance ranking",
          "A category profitability breakdown",
          "Slicers for City and Category, connected to everything, plus a date timeline",
        ],
        steps: [
          {
            title: "Structure the workbook",
            detail:
              "Three sheets: Data, Calc, Dashboard. Convert the transaction data to a Table named 'Transactions'. Add a calculated column for Gross Profit (=Revenue-Cost) directly in the Table so it fills automatically for new rows.",
          },
          {
            title: "Build the calculation layer",
            detail:
              "On Calc, build PivotTables for: revenue by month, revenue and profit by store, revenue and profit by category, and total units. Keep each pivot clearly labelled — you'll be referencing these cells from the Dashboard and future-you needs to find them.",
          },
          {
            title: "Build the KPI cards",
            detail:
              "Four cards across the top. Revenue and Units pull directly from pivots. Gross margin % is =profit/revenue formatted as a percentage. Growth vs. previous month compares the latest month against the one before — write it as a formula referencing pivot cells, not as a typed number, so it survives a refresh.",
          },
          {
            title: "Build the trend chart",
            detail:
              "A line PivotChart of monthly revenue across the full year. Strip the legend and gridlines. Title it with the finding, not the field names.",
          },
          {
            title: "Build the store ranking",
            detail:
              "A PivotTable of revenue by store, sorted descending, with data bars applied to the revenue column so relative performance is visible instantly. Eight stores fit comfortably; if there were eighty, you'd filter to top and bottom five.",
          },
          {
            title: "Build the category breakdown",
            detail:
              "A PivotTable showing revenue, gross profit, and margin % by category. Margin % is where the insight usually hides — the highest-revenue category is frequently not the most profitable one, and that contrast is what leadership needs to see.",
          },
          {
            title: "Add controls and connect them",
            detail:
              "City slicer, Category slicer, and a Date timeline along the top. Report Connections on each, ticking every PivotTable. Test thoroughly: click one city and verify every card, chart and table moves together. A card that doesn't move is a card wired to a stale cell.",
          },
          {
            title: "Finish and document",
            detail:
              "Hide the Calc sheet, turn off gridlines, set the print area to one page landscape, and add the source-and-refresh line. Write the update instructions directly on the Dashboard: append new transactions to the Table, then Data > Refresh All.",
          },
        ],
        successCriteria: [
          "The whole dashboard fits one screen and answers the three leadership questions without scrolling",
          "Appending a new month of transactions and clicking Refresh All updates every element correctly",
          "Every KPI card shows a comparison, not just a bare number",
          "Slicers control all visuals simultaneously",
          "Someone who has never opened the file can understand it without you explaining it",
        ],
      },
    },
  ],
};
