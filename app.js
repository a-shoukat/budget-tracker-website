// Budget Tracker - ICT Project
// Author: Ayesha Shoukat

const INCOME_CATS = ["Salary", "Freelance", "Gift", "Other Income"];
const EXPENSE_CATS = ["Food", "Transport", "Utilities", "Education", "Health",
                      "Shopping", "Entertainment", "Other"];

const form = document.getElementById("txForm");
const typeSel = document.getElementById("txType");
const catSel = document.getElementById("txCategory");
const descInput = document.getElementById("txDesc");
const amountInput = document.getElementById("txAmount");
const txBody = document.getElementById("txBody");
const emptyMsg = document.getElementById("emptyMsg");

let transactions = load();
let currentFilter = "all";
let pieChart = null;

// Seed demo data on first visit so the dashboard isn't empty
if (transactions.length === 0 && !localStorage.getItem("bt_seeded")) {
  transactions = [
    { id: 1, date: "2026-10-01", type: "income", category: "Salary", description: "Monthly stipend", amount: 50000 },
    { id: 2, date: "2026-10-02", type: "expense", category: "Food", description: "Grocery shopping", amount: 12500 },
    { id: 3, date: "2026-10-03", type: "expense", category: "Transport", description: "Bus card recharge", amount: 2500 },
    { id: 4, date: "2026-10-05", type: "expense", category: "Utilities", description: "Mobile + internet", amount: 1800 },
    { id: 5, date: "2026-10-08", type: "income", category: "Freelance", description: "Logo design gig", amount: 15000 },
    { id: 6, date: "2026-10-10", type: "expense", category: "Food", description: "Cafeteria", amount: 3200 },
    { id: 7, date: "2026-10-14", type: "expense", category: "Health", description: "Medicine", amount: 2200 },
    { id: 8, date: "2026-10-19", type: "expense", category: "Shopping", description: "Winter jacket", amount: 6500 },
  ];
  localStorage.setItem("bt_seeded", "1");
  save();
}

function load() {
  try {
    return JSON.parse(localStorage.getItem("bt_data")) || [];
  } catch { return []; }
}

function save() {
  localStorage.setItem("bt_data", JSON.stringify(transactions));
}

function fillCategories() {
  const cats = typeSel.value === "income" ? INCOME_CATS : EXPENSE_CATS;
  catSel.innerHTML = cats.map(c => `<option>${c}</option>`).join("");
}
typeSel.addEventListener("change", fillCategories);
fillCategories();

function fmt(n) {
  return "Rs " + n.toLocaleString("en-PK");
}

function render() {
  // Summary cards
  const income = transactions.filter(t => t.type === "income")
                             .reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense")
                              .reduce((s, t) => s + t.amount, 0);
  document.getElementById("totalIncome").textContent = fmt(income);
  document.getElementById("totalExpense").textContent = fmt(expense);
  const bal = document.getElementById("balance");
  bal.textContent = fmt(income - expense);
  bal.style.color = income - expense < 0 ? "var(--red)" : "var(--green)";

  // Table
  const rows = transactions
    .filter(t => currentFilter === "all" || t.type === currentFilter)
    .slice().reverse();
  emptyMsg.style.display = rows.length ? "none" : "block";
  txBody.innerHTML = rows.map(t => `
    <tr class="${t.type}">
      <td>${t.date}</td>
      <td><span class="badge ${t.type}">${t.type}</span></td>
      <td>${t.category}</td>
      <td>${escapeHtml(t.description)}</td>
      <td class="amount">${fmt(t.amount)}</td>
      <td><button class="del" data-id="${t.id}" title="Delete">🗑️</button></td>
    </tr>`).join("");

  // Pie chart - expenses by category
  const byCat = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  });
  const labels = Object.keys(byCat);
  const data = Object.values(byCat);
  const colors = ["#0d2a43", "#0f766e", "#d4af37", "#e53e3e", "#805ad5",
                  "#dd6b20", "#319795", "#718096"];

  if (pieChart) pieChart.destroy();
  pieChart = new Chart(document.getElementById("pieChart"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 2, borderColor: "#fff" }]
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      cutout: "55%"
    }
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const amount = parseFloat(amountInput.value);
  if (!descInput.value.trim() || !(amount > 0)) return;
  transactions.push({
    id: Date.now(),
    date: new Date().toISOString().slice(0, 10),
    type: typeSel.value,
    category: catSel.value,
    description: descInput.value.trim(),
    amount: Math.round(amount)
  });
  save();
  render();
  form.reset();
  fillCategories();
});

txBody.addEventListener("click", e => {
  const btn = e.target.closest(".del");
  if (!btn) return;
  transactions = transactions.filter(t => t.id != btn.dataset.id);
  save();
  render();
});

document.querySelectorAll(".filters button[data-filter]").forEach(b => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".filters button[data-filter]")
            .forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    currentFilter = b.dataset.filter;
    render();
  });
});

document.getElementById("clearBtn").addEventListener("click", () => {
  if (confirm("Delete all transactions?")) {
    transactions = [];
    save();
    render();
  }
});

render();
