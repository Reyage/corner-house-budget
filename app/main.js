// Corner House: hash-routed budget site. Data lives in data.js; edits persist in
// localStorage on this device only. window.__shotReady flips true once a page
// has rendered, so a screenshot script knows when to capture.
import { transactions as seedTx, income, budgets, bills, savingsGoals, monthlyHistory, household } from './data.js';
import { dashboard, transactionsPage, budgetsPage, billsPage, goalsPage, reportsPage, missing, money } from './views.js';

const app = document.getElementById('app');
const store = (k, v) => { try { localStorage.setItem('corner-house:' + k, JSON.stringify(v)); } catch {} };
const load = (k, fb) => { try { const v = localStorage.getItem('corner-house:' + k); return v ? JSON.parse(v) : fb; } catch { return fb; } };

let txns = load('txns', seedTx);
let myBudgets = load('budgets', budgets);
let myBills = load('bills', bills);
let myGoals = load('goals', savingsGoals);
let filterCat = '', filterQ = '';

const cats = [...new Set(seedTx.map((t) => t.category))];
const spentByCat = () => { const m = {}; for (const t of txns) m[t.category] = (m[t.category] || 0) + t.amount; return m; };
const totalSpent = () => txns.reduce((a, t) => a + t.amount, 0);
const incomeTotal = () => income.reduce((a, i) => a + i.amount, 0);

function ctx() {
  const byCat = cats.map((c) => ({ label: c, value: Math.round((spentByCat()[c] || 0) * 100) / 100 })).filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
  const history = monthlyHistory.map((m) => m.spent == null ? { ...m, spent: Math.round(totalSpent() * 100) / 100 } : m);
  const topMap = {}; for (const t of txns) { topMap[t.merchant] = topMap[t.merchant] || { merchant: t.merchant, n: 0, total: 0 }; topMap[t.merchant].n++; topMap[t.merchant].total += t.amount; }
  return {
    spent: totalSpent(), incomeTotal: incomeTotal(),
    budgetTotal: myBudgets.reduce((a, b) => a + b.limit, 0), byCat,
    recent: [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    upcoming: myBills.filter((b) => !b.paid),
    goals: myGoals, txCount: txns.length, history,
    top: Object.values(topMap).sort((a, b) => b.total - a.total).slice(0, 5),
  };
}

function drawTrend() {
  const c = document.getElementById('trend'); if (!c) return;
  const g = c.getContext('2d'); const h = ctx().history; const max = Math.max(...h.flatMap((m) => [m.income, m.spent]));
  const W = c.width, H = c.height, pad = 46, bw = 34, gap = 26;
  g.clearRect(0, 0, W, H); g.font = '20px system-ui'; g.fillStyle = '#5c6b62';
  h.forEach((m, i) => {
    const x = pad + i * ((W - pad * 2) / h.length) + 30;
    const ih = (m.income / max) * (H - 90), sh = (m.spent / max) * (H - 90);
    g.fillStyle = '#1d6b4f'; g.fillRect(x, H - 50 - ih, bw, ih);
    g.fillStyle = '#b7791f'; g.fillRect(x + bw + 6, H - 50 - sh, bw, sh);
    g.fillStyle = '#22312a'; g.fillText(m.month.split(' ')[0], x - 4, H - 22);
    g.fillStyle = '#5c6b62'; g.fillText('$' + Math.round(m.income / 100) / 10 + 'k', x - 6, H - 58 - ih);
  });
}

function render() {
  window.__shotReady = false;
  const hash = location.hash || '#/';
  const c = ctx();
  if (hash === '#/' || hash === '') { document.title = 'Corner House — Household Budget'; app.innerHTML = dashboard(c); }
  else if (hash.startsWith('#/transactions')) {
    document.title = 'Transactions | Corner House';
    const rows = [...txns].sort((a, b) => b.date.localeCompare(a.date)).filter((t) => (!filterCat || t.category === filterCat) && (!filterQ || (t.merchant + t.category).toLowerCase().includes(filterQ.toLowerCase())));
    app.innerHTML = transactionsPage({ rows, cats, filter: filterCat, q: filterQ });
    document.getElementById('f-cat').addEventListener('change', (e) => { filterCat = e.target.value; render(); });
    document.getElementById('f-q').addEventListener('input', (e) => { filterQ = e.target.value; render(); const q = document.getElementById('f-q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); });
    document.getElementById('add-form').addEventListener('submit', (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      txns.push({ id: Math.max(...txns.map((t) => t.id)) + 1, date: f.get('date'), merchant: f.get('merchant').trim(), category: f.get('category'), amount: Number(f.get('amount')), note: '' });
      store('txns', txns); render();
    });
  }
  else if (hash.startsWith('#/budgets')) {
    document.title = 'Budgets | Corner House';
    const byCat = spentByCat();
    app.innerHTML = budgetsPage({ rows: myBudgets.map((b) => ({ ...b, spent: Math.round((byCat[b.category] || 0) * 100) / 100 })) });
    app.querySelectorAll('[data-budget]').forEach((form) => form.addEventListener('submit', (e) => {
      e.preventDefault(); const cat = form.dataset.budget;
      myBudgets.find((b) => b.category === cat).limit = Number(new FormData(form).get('limit'));
      store('budgets', myBudgets); render();
    }));
  }
  else if (hash.startsWith('#/bills')) {
    document.title = 'Bills | Corner House';
    app.innerHTML = billsPage({ bills: myBills, paidTotal: myBills.filter((b) => b.paid).reduce((a, b) => a + b.amount, 0), unpaidTotal: myBills.filter((b) => !b.paid).reduce((a, b) => a + b.amount, 0) });
    app.querySelectorAll('[data-pay]').forEach((btn) => btn.addEventListener('click', () => { myBills[Number(btn.dataset.pay)].paid = true; store('bills', myBills); render(); }));
  }
  else if (hash.startsWith('#/goals')) {
    document.title = 'Savings goals | Corner House';
    app.innerHTML = goalsPage({ goals: myGoals, totalSaved: myGoals.reduce((a, g) => a + g.saved, 0), totalTarget: myGoals.reduce((a, g) => a + g.target, 0) });
    app.querySelectorAll('[data-goal]').forEach((form) => form.addEventListener('submit', (e) => {
      e.preventDefault(); myGoals[Number(form.dataset.goal)].saved += Number(new FormData(form).get('add'));
      store('goals', myGoals); render();
    }));
  }
  else if (hash.startsWith('#/reports')) { document.title = 'Reports | Corner House'; app.innerHTML = reportsPage(c); drawTrend(); }
  else { document.title = 'Not found | Corner House'; app.innerHTML = missing(); }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}
window.addEventListener('hashchange', render);
render();
