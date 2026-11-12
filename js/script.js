"use strict";

// 1. Settings: money uses integer centavos to avoid floating-point rounding errors.
const STORAGE_KEY = "ledger-expenses-v1";
const categories = ["Food", "Transportation", "Education", "Shopping", "Bills and Utilities", "Entertainment", "Healthcare", "Others"];
const icons = ["◒", "↗", "▣", "◇", "⌂", "♫", "✚", "⋯"];
const colors = ["#4264eb", "#58b3bf", "#9b86d7", "#eca96a", "#7792bf", "#dc87a6", "#72b693", "#b4bfce"];
const money = cents => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(cents / 100);
const $ = id => document.getElementById(id);
const form = $("expense-form");
const dialog = $("expense-dialog");
let expenses = [];
let editingId = null;
let chart = null;

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1900-01-01") return false;
  const date = new Date(value + "T12:00:00");
  return !Number.isNaN(date.getTime()) && date.getFullYear() === Number(value.slice(0, 4)) && date.getMonth() + 1 === Number(value.slice(5, 7)) && date.getDate() === Number(value.slice(8, 10));
}
function validExpense(item) {
  return item && typeof item.id === "string" && item.id.length > 0 && typeof item.name === "string" && item.name.trim().length > 0 && item.name.length <= 100 && Number.isSafeInteger(item.cents) && item.cents > 0 && item.cents <= 99999999999 && categories.includes(item.category) && typeof item.date === "string" && validDate(item.date) && typeof item.description === "string" && item.description.length <= 500;
}
function announce(message) { $("notice").textContent = message; $("notice").hidden = false; }

// 2. Persistence: do not change the displayed data unless saving succeeds.
function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(validExpense) || new Set(parsed.map(item => item.id)).size !== parsed.length) throw new Error("Invalid saved data");
    expenses = parsed;
  } catch {
    announce("Saved records could not be loaded. To protect existing data, saving is disabled. Back up or repair the ledger-expenses-v1 entry in browser storage, then reload.");
    $("save").disabled = true;
  }
}
function saveExpenses(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    expenses = next;
    render();
    return true;
  } catch {
    announce("Your change was not saved. Browser storage may be full or unavailable. Your existing records have been kept.");
    return false;
  }
}

// 3. Calculations: all dashboard totals use every record; the summary uses its month.
const totalOf = records => records.reduce((sum, expense) => sum + expense.cents, 0);
const forMonth = month => expenses.filter(expense => expense.date.slice(0, 7) === month);
function monthName(month) { return new Date(month + "-01T12:00:00").toLocaleDateString("en-PH", { month: "long", year: "numeric" }); }
function categoryTotals(records) { return categories.map(category => totalOf(records.filter(expense => expense.category === category))); }

// 4. Rendering: textContent keeps user-entered text safe to display.
function render() {
  const currentMonth = localToday().slice(0, 7);
  $("total").textContent = money(totalOf(expenses));
  $("current-total").textContent = money(totalOf(forMonth(currentMonth)));
  $("current-label").textContent = monthName(currentMonth);
  $("count").textContent = expenses.length;
  $("record-badge").textContent = expenses.length;
  updateYears();
  renderSummary();
  renderRecords();
}
// Include every recorded year, the current year, and the user's selection.
function updateYears() {
  const selected = $("year").value || localToday().slice(0, 4);
  const years = new Set([selected, localToday().slice(0, 4), ...expenses.map(expense => expense.date.slice(0, 4))]);
  $("year").replaceChildren();
  [...years].sort().reverse().forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    $("year").append(option);
  });
  $("year").value = selected;
}
function renderSummary() {
  const yearly = $("period-mode").value === "year";
  const month = $("month").value;
  const year = $("year").value;
  $("month-control").hidden = yearly;
  $("year-control").hidden = !yearly;
  if (!yearly && (!/^\d{4}-\d{2}$/.test(month) || Number(month.slice(5)) < 1 || Number(month.slice(5)) > 12)) return;
  const records = yearly ? expenses.filter(expense => expense.date.slice(0, 4) === year) : forMonth(month);
  const totals = categoryTotals(records);
  const total = totalOf(records);
  const highest = Math.max(...totals);
  const leaders = categories.filter((category, index) => totals[index] === highest);
  const periodLabel = yearly ? year : monthName(month);
  $("selected-month").textContent = periodLabel;
  $("snapshot-label").textContent = yearly ? "YEARLY SNAPSHOT" : "MONTHLY SNAPSHOT";
  $("category-chart").setAttribute("aria-label", `Expenses by category for ${periodLabel}`);
  $("month-total").textContent = money(total);
  $("highest").textContent = total ? leaders.join(" & ") : "No expenses yet";
  $("highest-detail").textContent = total ? `${money(highest)} · ${Math.round(highest / total * 100)}% of ${yearly ? "yearly" : "monthly"} spending${leaders.length > 1 ? " each (tie)" : ""}` : "Add an expense to see your spending habits.";
  $("category-list").replaceChildren();
  categories.forEach((category, index) => {
    const row = document.createElement("div"); row.className = "category-item";
    const dot = document.createElement("span"); dot.className = "dot"; dot.style.background = colors[index];
    const label = document.createElement("span"); label.className = "category-name"; label.textContent = category;
    const amount = document.createElement("strong"); amount.textContent = money(totals[index]);
    row.append(dot, label, amount); $("category-list").append(row);
  });
  $("chart-empty").hidden = total > 0;
  $("category-chart").hidden = total === 0;
  if (chart) { chart.destroy(); chart = null; }
  $("chart-status").hidden = typeof Chart !== "undefined";
  if (typeof Chart !== "undefined" && total) {
    chart = new Chart($("category-chart"), {
      type: "doughnut",
      data: { labels: categories, datasets: [{ data: totals, backgroundColor: colors, borderWidth: 4, borderColor: "#ffffff", hoverOffset: 3 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: "73%", animation: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${context.label}: ${money(context.raw)}` } } } }
    });
  }
}
function renderRecords() {
  const query = $("search").value.trim().toLowerCase();
  const category = $("category-filter").value;
  const visible = expenses.filter(expense => (!category || expense.category === category) && `${expense.name} ${expense.description}`.toLowerCase().includes(query)).sort((a, b) => b.date.localeCompare(a.date));
  $("expense-rows").replaceChildren();
  $("results-count").textContent = `${visible.length} of ${expenses.length} records`;
  $("records-empty").hidden = visible.length > 0;
  if (!visible.length) {
    $("records-empty").querySelector("h3").textContent = expenses.length ? "No matching expenses" : "A fresh start for your finances";
    $("records-empty").querySelector("p").textContent = expenses.length ? "Try another search or choose a different category." : "Add your first expense and start building the bigger picture.";
    $("empty-add").hidden = expenses.length > 0;
  }
  visible.forEach(expense => {
    const row = document.createElement("tr");
    const name = row.insertCell();
    const title = document.createElement("strong"); title.textContent = expense.name; name.append(title);
    if (expense.description) { const description = document.createElement("span"); description.className = "expense-description"; description.textContent = expense.description; name.append(description); }
    const categoryCell = row.insertCell(); const pill = document.createElement("span"); pill.className = "category-pill"; pill.textContent = `${icons[categories.indexOf(expense.category)]} ${expense.category}`; categoryCell.append(pill);
    row.insertCell().textContent = new Date(expense.date + "T12:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
    const amount = row.insertCell(); amount.className = "amount"; amount.textContent = money(expense.cents);
    const actions = row.insertCell(); actions.className = "actions";
    ["Edit", "Delete"].forEach(action => {
      const button = document.createElement("button"); button.textContent = action; button.className = `row-button ${action.toLowerCase()}`; button.setAttribute("aria-label", `${action} ${expense.name}`);
      button.addEventListener("click", () => {
        if (action === "Edit") openForm(expense);
        else if (confirm(`Delete "${expense.name}"? This cannot be undone.`) && saveExpenses(expenses.filter(item => item.id !== expense.id))) announce("Expense deleted.");
      });
      actions.append(button);
    });
    $("expense-rows").append(row);
  });
}

// 5. Forms: share the same fields and validation for adding and editing.
function openForm(expense = null) {
  form.reset(); editingId = expense ? expense.id : null;
  $("form-title").textContent = expense ? "Edit expense" : "Add expense";
  $("save").textContent = expense ? "Save changes" : "Add expense";
  $("form-error").hidden = true;
  form.elements.date.value = expense ? expense.date : localToday();
  if (expense) {
    form.elements.name.value = expense.name;
    form.elements.amount.value = (expense.cents / 100).toFixed(2);
    form.elements.category.value = expense.category;
    form.elements.description.value = expense.description;
  }
  dialog.showModal();
  form.elements.name.focus();
}
form.addEventListener("submit", event => {
  event.preventDefault();
  if ($("save").disabled || !form.reportValidity()) return;
  const expense = {
    id: editingId || (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    name: form.elements.name.value.trim(),
    cents: Math.round(Number(form.elements.amount.value) * 100),
    category: form.elements.category.value,
    date: form.elements.date.value,
    description: form.elements.description.value.trim()
  };
  if (!validExpense(expense)) { $("form-error").textContent = "Enter a name, a valid date, category, and positive amount with at most two decimal places."; $("form-error").hidden = false; return; }
  const next = editingId ? expenses.map(item => item.id === editingId ? expense : item) : [...expenses, expense];
  if (saveExpenses(next)) { dialog.close(); announce(editingId ? "Expense updated." : "Expense added."); }
});
$("open-add").addEventListener("click", () => openForm());
$("empty-add").addEventListener("click", () => openForm());
$("close-dialog").addEventListener("click", () => dialog.close());
$("cancel").addEventListener("click", () => dialog.close());
$("search").addEventListener("input", renderRecords);
$("category-filter").addEventListener("change", renderRecords);
$("month").addEventListener("change", renderSummary);
$("year").addEventListener("change", renderSummary);
$("period-mode").addEventListener("change", renderSummary);
document.querySelectorAll("nav a").forEach(link => link.addEventListener("click", () => {
  document.querySelectorAll("nav a").forEach(item => item.classList.toggle("active", item === link));
}));

// 6. Initialization: populate dropdowns, restore records, then draw the page.
categories.forEach(category => {
  [form.elements.category, $("category-filter")].forEach(select => { const option = document.createElement("option"); option.value = category; option.textContent = category; select.append(option); });
});
$("month").value = localToday().slice(0, 7);
loadExpenses();
render();
