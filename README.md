# Ledger — Personal Expense Tracker

A beginner portfolio project built with HTML5, CSS3, vanilla JavaScript, LocalStorage, and Chart.js. No build tools or frameworks are required. Currency defaults to Philippine pesos (PHP).

## 1. Create and open the folder in VS Code

1. Create a folder named `personal-expense-tracker` in a location you can find easily.
2. Open Visual Studio Code, choose **File → Open Folder**, and select that folder. This workspace already contains the completed project; you can use this folder directly instead.
3. In VS Code's Explorer panel, create `index.html` and `README.md`. Create a `css` folder with `style.css`, then a `js` folder with `script.js`.
4. The complete code is already saved separately in these files. Open each file to follow along or copy its full contents into your own project.

```text
personal-expense-tracker/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── README.md
```

## 2. Run the application

1. In VS Code, open Extensions and install **Live Server** by Ritwick Dey if you do not already have it.
2. Right-click `index.html` in Explorer and choose **Open with Live Server**.
3. Keep using the same browser and server address/port so the browser can find the same saved records.
4. A direct double-click on `index.html` also opens the interface, but browser behavior for LocalStorage on `file:` URLs varies. Use Live Server for consistent storage.

Chart.js is loaded from a pinned CDN URL, following its [official getting-started guide](https://www.chartjs.org/docs/latest/getting-started/). Internet access is needed for the chart. If it cannot load, all forms, tables, totals, and category summaries still work and a message explains the missing chart.

## 3. Understand `index.html`

- The **head** sets the document title, responsive viewport, stylesheet, and scripts. `defer` waits for HTML parsing; Chart.js is loaded before our script.
- The **sidebar** contains links that move to Dashboard, Expense records, and Monthly summary. On mobile it becomes a top navigation area.
- The **dashboard** holds three cards for all-time spending, the current calendar month's spending, and the total record count.
- The **monthly summary** has a month input, chart canvas, text totals for every category, and a card with the month's total and highest category. Ties are shown.
- The **records** section contains search, category selection, a table, and an empty state. JavaScript fills its table body.
- The **dialog** contains a single form reused for adding and editing. Every input has a label. Name, amount, category, and date are required; description is optional. The browser validates these before submission.
- IDs connect HTML elements to JavaScript. Classes connect groups of elements to CSS styles.

## 4. Understand `css/style.css`

The comments mark five main styling sections:

1. **Base styles and controls:** shared colors using CSS variables, readable fonts, buttons, inputs, and visible keyboard focus.
2. **Sidebar and page shell:** desktop navigation, heading, and a three-column grid of dashboard cards.
3. **Summary cards:** a two-column layout, chart container with a defined height, colored category dots, and monthly snapshot.
4. **Records:** search controls, table alignment, category badges, action buttons, and the first-use empty state. Wide tables can scroll horizontally.
5. **Modal and responsive layouts:** a native modal with a dark backdrop, form fields, and media queries that adjust the layout for tablets and phones. Reduced-motion preferences are respected.

Try changing `--blue` at the start of the file to customize the accent color.

## 5. Understand `js/script.js`

The numbered comments organize the script:

1. **Settings and validation:** defines categories, colors, icons, currency formatting, and valid record rules. `localToday()` uses the browser's local calendar date rather than a UTC date that can shift the day. Amounts are stored as integer centavos: ₱12.34 becomes `1234`.
2. **Persistence:** `loadExpenses()` parses the `ledger-expenses-v1` LocalStorage entry. `saveExpenses(next)` writes the updated array and only then updates the interface. Storage failures leave the previous records intact. Invalid saved data is preserved and saving is disabled until it is repaired or backed up and removed.
3. **Calculations:** `totalOf()` adds centavos, `forMonth()` selects `YYYY-MM`, and `categoryTotals()` calculates each category's share. Dashboard totals always use all records, independent of the search filters.
4. **Rendering:** `render()` refreshes cards, summary, and table. `renderSummary()` rebuilds the Chart.js doughnut for the selected month. `renderRecords()` combines name/description search with category filtering and sorts newest dates first. User input is inserted with `textContent`, so it displays as plain text.
5. **Forms and events:** `openForm()` clears the form for a new expense or fills it for editing. Submit validates and saves; edit preserves the record ID. Delete asks for confirmation. Cancel and Escape dismiss the dialog without changing data.
6. **Initialization:** creates category options, selects the current month, loads saved records, and renders the page. No fabricated transactions are added.

An example saved record:

```json
{
  "id": "a-unique-id",
  "name": "Lunch",
  "cents": 15000,
  "category": "Food",
  "date": "2026-11-12",
  "description": "Lunch after class"
}
```

To switch currencies, change `currency: "PHP"` in the `money` formatter and update the HTML amount label and initial currency placeholders. The app assumes one currency; this does not convert existing amounts.

## 6. Use and test the tracker

### Monthly and yearly breakdowns

In **Spending breakdown**, choose **Monthly** to select a specific month or **Yearly** to select a full year. Both modes update the category chart, category totals, total spending, and highest-category snapshot together. The year list includes the current year and all years with saved expenses. Adding, editing, or deleting expenses refreshes the available years and selected summary. Dashboard “This month” stays tied to the current calendar month.

For a yearly check, add Food expenses of ₱100 in January and ₱200 in February of the same year, plus ₱50 in another year. The first year's yearly total should be ₱300, while January's monthly total should be ₱100. Switch to the other year to see ₱50. Confirm editing dates and deleting records update the selected period correctly.

Responsive layouts stack dashboard cards and the chart on narrow phones, wrap period controls and navigation, and keep wide tables scrollable within their panel. Check widths of 320, 375, 768, 1024, and 1440 pixels, including landscape orientation and large amounts. Forms scroll on short screens and inputs use readable mobile sizing.

Start with no records and confirm the cards show zero and the table shows the welcome message. Then use this repeatable manual test:

| Action | Expected result |
| --- | --- |
| Add Lunch, 150.25, Food, today | Total ₱150.25; 1 transaction; current month ₱150.25 |
| Add Bus, 30.50, Transportation, today | Total ₱180.75; 2 transactions; Food is highest |
| Add Book, 200, Education, on the first of last month | Total ₱380.75; 3 transactions; current month remains ₱180.75 |
| Select last month | Monthly total ₱200.00; Education is highest; chart updates |
| Edit Lunch to 100.25 | All-time total ₱330.75; current month ₱130.75 |
| Search for `bus` and choose Transportation | Only Bus appears; dashboard totals stay the same |
| Change category filter to Food while searching `bus` | No matching expenses; clear both filters to restore rows |
| Cancel a deletion | Record and totals remain unchanged |
| Delete Bus and confirm | Total ₱300.25; 2 transactions; current month ₱100.25 |
| Reload using the same address | Those two records and their values return |
| Submit missing name, whitespace-only name, zero, negative, or three-decimal amount | Save is blocked; no new record |
| Add a description containing `<b>test</b>` | Literal text appears; no HTML executes |
| Resize to a phone width and navigate by keyboard | Controls remain reachable; table scrolls; dialog fits |

Also test changing an edited record's month and category, a month with no records, equal category totals, and a cancelled form. Verify all dependent totals refresh. Dashboard “This month” always means the actual current month, even when another month is selected in the summary. Future dates are allowed for planned expenses.

## 7. Storage and troubleshooting

Records belong to this browser profile and origin (protocol, hostname, and port). This project has no server account, cloud sync, or backup feature. Clearing site data removes saved expenses. Private browsing can discard data when closed.

If the chart is missing, check the internet connection and browser console. The category totals provide the same numerical information. If records are missing after reopening, check that you used the same browser and Live Server address. If storage is blocked or full, the app displays an error instead of claiming the save succeeded.

Avoid editing this app in multiple tabs simultaneously: each tab keeps an in-memory copy and the latest save wins. Reload before editing in another tab.

## Verification notes

The source was reviewed for form validation, centavo arithmetic, month selection, combined filters, safe text rendering, and LocalStorage failure handling. See the manual test above for complete browser acceptance checks. Do not treat source review as a completed interactive browser test.
