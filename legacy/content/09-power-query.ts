import type { Module } from "@/lib/content-types";

export const powerQueryModule: Module = {
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
      content: {
        kind: "lesson",
        objectives: [
          "Import data into Power Query and apply cleaning steps",
          "Understand that steps are recorded and replayed on refresh",
          "Combine multiple files or sheets into one table automatically",
        ],
        scenario:
          "Every month you receive the same messy export and spend forty minutes cleaning it the same way. Power Query records that cleaning once and replays it on every future file at the click of Refresh. This is the single biggest time-saver in modern Excel, and most people never touch it.",
        steps: [
          {
            title: "Understand what Power Query is",
            detail:
              "It's a data-preparation engine built into Excel (Data tab > Get & Transform). You point it at a source, clean the data through a visual interface, and it records every action as a step. Next month, you point it at the new file and hit Refresh — every step reruns automatically. It's macro-like automation without writing any code.",
          },
          {
            title: "Import your first source",
            detail:
              "Data > Get Data > From File > From Workbook (or From Text/CSV). Select the file, choose the sheet or table in the Navigator preview, then click Transform Data rather than Load. That opens the Power Query Editor, which is where the actual work happens.",
          },
          {
            title: "Learn the editor layout",
            detail:
              "Data preview in the middle, and the Applied Steps list on the right. Every action you take adds a step to that list. You can click any step to see the data as it was at that point, reorder steps, or delete one. That list is your recipe, and it's fully editable — which is why this beats recording a macro.",
          },
          {
            title: "Apply the common cleaning steps",
            detail:
              "Use First Row as Headers when the header sits in row one. Right-click a column > Remove to drop what you don't need. Home > Remove Rows > Remove Blank Rows. Transform > Format > Trim to strip spaces. Right-click > Change Type to set numbers and dates properly. Each click becomes a permanent, repeatable step.",
          },
          {
            title: "Split and unpivot",
            detail:
              "Split Column by Delimiter does what Text to Columns does, but repeatably. Unpivot is the one worth learning properly: if your data has twelve month columns across the top, select the ID columns, right-click > Unpivot Other Columns, and you get a tidy three-column table of ID, Month and Value. That's the shape PivotTables need, and doing it by hand is miserable.",
          },
          {
            title: "Load the result",
            detail:
              "Home > Close & Load To. Choose Table to place it on a sheet, or 'Only Create Connection' plus 'Add to Data Model' if you'll build a Power Pivot model. The loaded table carries a query behind it — right-click it and Refresh to rerun the whole pipeline.",
          },
          {
            title: "Combine every file in a folder",
            detail:
              "Data > Get Data > From File > From Folder. Point it at a folder of identically-structured monthly files, and Power Query appends them all into a single table. Drop next month's file into the folder, hit Refresh, and it's included. This alone replaces hours of copy-paste for anyone consolidating regional or monthly reports.",
          },
        ],
        tips: [
          "Rename your steps (right-click > Rename) to describe intent. 'Removed blank rows' is far more useful six months later than 'Filtered Rows1'.",
          "Power Query never modifies your source file. It reads, transforms, and outputs — the original stays untouched.",
          "If a refresh breaks, a column was probably renamed at source. Click the failing step to see exactly where it stopped.",
          "Queries can be chained: reference one query as the source of another to build a layered pipeline.",
        ],
        practice:
          "Take any CSV export. Import it via Get Data, promote headers, trim a text column, set data types, and load it to a sheet. Then change the source file and hit Refresh — watch it redo everything.",
      },
    },
    {
      slug: "power-pivot-data-model",
      title: "Power Pivot and the Data Model",
      summary: "Relationships between tables without VLOOKUP chains.",
      type: "lesson",
      durationMinutes: 24,
      isFree: false,
      content: {
        kind: "lesson",
        objectives: [
          "Understand why relationships beat flattening everything with VLOOKUP",
          "Create relationships between tables in the Data Model",
          "Write basic DAX measures for reliable calculations",
        ],
        scenario:
          "You have three tables: 200,000 sales transactions, a product list, and a store list. The traditional approach is to VLOOKUP product and store details into every one of those 200,000 rows — a file that's slow, enormous, and breaks whenever a reference list changes. The Data Model relates the tables instead, and keeps them separate.",
        steps: [
          {
            title: "Understand the shift in thinking",
            detail:
              "Instead of copying reference data into your fact table, you tell Excel how the tables relate — Sales.ProductID matches Products.ProductID — and let it do the joining at calculation time. It's how databases have always worked, and it's dramatically faster and more maintainable than a wall of lookups.",
          },
          {
            title: "Get your tables into the Data Model",
            detail:
              "Convert each table with Ctrl+T, then Power Pivot > Add to Data Model (or in Power Query, Close & Load To > Only Create Connection with 'Add this data to the Data Model' ticked). The Model can hold millions of rows — far beyond what a worksheet handles comfortably.",
          },
          {
            title: "Create relationships",
            detail:
              "Power Pivot > Manage > Diagram View. Drag from the ID field in your fact table to the matching ID in your lookup table. The key rule: the lookup side must contain unique values, with no duplicates. If Excel refuses the relationship, that's why — clean the duplicates first.",
          },
          {
            title: "Build PivotTables across related tables",
            detail:
              "Insert > PivotTable > 'Use this workbook's Data Model'. The field list now shows every table. Drag Product Category from the Products table and Revenue from Sales into the same pivot — Excel joins them through the relationship automatically. No VLOOKUP anywhere.",
          },
          {
            title: "Write your first DAX measure",
            detail:
              "In Power Pivot, click a cell in the calculation area below a table and write: Total Revenue := SUM(Sales[Revenue]). Measures calculate in the context of whatever the pivot is showing — so the same measure gives the right answer per region, per month, or overall, without you writing three formulas.",
          },
          {
            title: "Write a measure that would be painful otherwise",
            detail:
              "Distinct Customers := DISTINCTCOUNT(Sales[CustomerID]) counts unique customers correctly at every level of a pivot. A normal PivotTable genuinely cannot do this well, and doing it with formulas is awkward. This is typically the moment people see why the Data Model is worth learning.",
          },
          {
            title: "Add a date table for time intelligence",
            detail:
              "Create a table of continuous dates covering your range, mark it via Power Pivot > Mark as Date Table, and relate it to your fact table's date column. That unlocks measures like Revenue LY := CALCULATE([Total Revenue], SAMEPERIODLASTYEAR(Dates[Date])) — year-on-year comparison in one line.",
          },
        ],
        tips: [
          "Power Pivot may need enabling: File > Options > Add-ins > COM Add-ins > Go > tick Microsoft Power Pivot for Excel.",
          "Prefer measures over calculated columns. Measures compute on demand and don't inflate file size.",
          "Name measures descriptively — they appear in the field list and other people will use them.",
          "One-to-many relationships are the norm: many sales rows, one product row. Many-to-many needs a bridge table and more care.",
        ],
        practice:
          "Build three small tables (sales, products, stores) with matching IDs. Add all three to the Data Model, create the relationships in Diagram View, and build a pivot that shows revenue by product category — with no lookup formulas anywhere.",
      },
    },
    {
      slug: "power-query-project",
      title: "Project: Merge Three Messy Sheets Into One Model",
      summary: "A realistic multi-source data-prep project.",
      type: "project",
      durationMinutes: 35,
      isFree: false,
      content: {
        kind: "project",
        scenario:
          "Three regional managers each send a monthly sales file. The formats differ slightly: different column orders, one uses 'Amount' where others use 'Revenue', one has two header rows, and all three have trailing spaces in the city column. You must produce one consolidated, refreshable report — and next month it should take one click, not another afternoon.",
        deliverables: [
          "Three queries, one per source file, each cleaned to an identical structure",
          "One appended query combining all three into a single table",
          "A products or targets lookup related to the combined data in the Data Model",
          "A PivotTable report that refreshes end to end with Refresh All",
        ],
        steps: [
          {
            title: "Create the three files",
            detail:
              "Build three source files with deliberate inconsistencies — different column orders, one named 'Amount' instead of 'Revenue', one with a title row above the headers, trailing spaces in city names. Save them in one folder. Making the mess yourself teaches you what to look for in real exports.",
          },
          {
            title: "Import and clean the first file",
            detail:
              "Get Data > From Workbook > Transform Data. Remove the title row (Home > Remove Rows > Remove Top Rows), promote headers, rename 'Amount' to 'Revenue' so all three match, trim the city column, and set data types. Rename each applied step to describe what it does.",
          },
          {
            title: "Repeat for the other two files",
            detail:
              "Import each and clean to exactly the same column names, order and data types. This matters: Append matches columns by name, so 'Revenue' and 'revenue' would create two separate columns with half the data in each.",
          },
          {
            title: "Add a source column",
            detail:
              "In each query, Add Column > Custom Column, and hard-code the region name. After appending you'll want to know which file each row came from — for filtering, and for tracing problems back to their source.",
          },
          {
            title: "Append the three queries",
            detail:
              "Home > Append Queries > Append Queries as New > Three or more tables, and add all three. You get a single combined query. Check the row count equals the sum of the three sources — if it's short, a source had a filter step you forgot about.",
          },
          {
            title: "Load to the Data Model",
            detail:
              "Close & Load To > Only Create Connection, ticking 'Add this data to the Data Model'. Load the individual source queries as connection-only too — you don't need three extra sheets cluttering the workbook.",
          },
          {
            title: "Add a lookup table and relate it",
            detail:
              "Create a small targets table (region and monthly target), add it to the Data Model, and create a relationship from the combined table's region column to it. Now you can compare actuals against targets in a pivot without a single lookup formula.",
          },
          {
            title: "Build the report and test the refresh",
            detail:
              "Build a PivotTable from the Data Model showing revenue by region and month against target. Then the real test: edit one of the source files, add a few rows, save it, and press Ctrl+Alt+F5 in your report. Everything should update. If it does, you've automated a recurring job permanently.",
          },
        ],
        successCriteria: [
          "All three sources land in one table with consistent column names and types",
          "A source/region column identifies where every row came from",
          "The combined row count reconciles exactly against the three source files",
          "Editing a source file and pressing Refresh All updates the final report with no manual steps",
          "Next month's update genuinely takes one click",
        ],
      },
    },
  ],
};
