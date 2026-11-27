// HTML for each page, built from the budget data. Every value is escaped.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
export const money = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const COLORS = ['#1d6b4f', '#2b6cb0', '#b7791f', '#b3372f', '#7c5cbf', '#c05621', '#2e8b6a', '#718096', '#975a16'];

export function donut(segs) {
  const total = segs.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;
  const parts = segs.map((s, i) => {
    const a0 = (acc / total) * 360, a1 = ((acc + s.value) / total) * 360; acc += s.value;
    const large = a1 - a0 > 180 ? 1 : 0;
    const p = (deg) => { const r = (deg - 90) * Math.PI / 180; return [50 + 42 * Math.cos(r), 50 + 42 * Math.sin(r)]; };
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `<path d="M50 50 L${x0.toFixed(1)} ${y0.toFixed(1)} A42 42 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${COLORS[i % COLORS.length]}"/>`;
  }).join('');
  return `<svg style="max-width:400px;display:block;margin:0 auto" viewBox="0 0 100 100" role="img" aria-label="Spending by category">${parts}<circle cx="50" cy="50" r="24" fill="#fff"/></svg>`;
}

export function dashboard(ctx) {
  const { spent, incomeTotal, budgetTotal, byCat, recent, upcoming, goals } = ctx;
  const left = budgetTotal - spent;
  return `<h1>November at a glance</h1><p class="sub">The Alvarez household · Maya &amp; Tom, Leo (9) and June (6) · 26 of 30 days in</p>
  <div class="cards">
    <div class="card"><div class="k">Income so far</div><div class="v">${money(incomeTotal)}</div><div class="s">Salaries + $42 refund</div></div>
    <div class="card"><div class="k">Flexible spending</div><div class="v">${money(spent)}</div><div class="s">of ${money(budgetTotal)} budgeted</div></div>
    <div class="card"><div class="k">Left to spend</div><div class="v">${money(left)}</div><div class="s">${left >= 0 ? 'on track for the month' : 'over budget — see Budgets'}</div></div>
    <div class="card"><div class="k">Mortgage paid</div><div class="v">$1,850.00</div><div class="s">1 Nov · next bill 28 Nov</div></div>
  </div>
  <div class="grid2">
    <div class="card"><div class="k">Where the money went</div>${donut(byCat)}
      <div class="legend">${byCat.map((s, i) => `<span><i style="background:${COLORS[i % COLORS.length]}"></i>${esc(s.label)} ${money(s.value)}</span>`).join('')}</div></div>
    <div class="card"><div class="k">Bills coming up</div>${upcoming.map((b) => `<div class="row"><span>${esc(b.name)} · due ${esc(b.due.slice(5))}</span><b>${money(b.amount)}</b></div>`).join('')}
      <p style="margin:12px 0 0"><a href="#/bills">All bills →</a></p></div>
  </div>
  <div class="grid2b">
    <div class="card"><div class="k">Recent spending</div>${recent.map((t) => `<div class="row"><span>${esc(t.date.slice(5))} · ${esc(t.merchant)}</span><span>${esc(t.category)} · <b>${money(t.amount)}</b></span></div>`).join('')}
      <p style="margin:12px 0 0"><a href="#/transactions">All ${ctx.txCount} transactions →</a></p></div>
    <div class="card"><div class="k">Savings goals</div>${goals.map((g) => `<div style="margin:10px 0"><div class="row"><span>${esc(g.name)}</span><span><b>${money(g.saved)}</b> of ${money(g.target)}</span></div><div class="bar"><i style="width:${Math.min(100, Math.round(g.saved / g.target * 100))}%"></i></div></div>`).join('')}
      <p style="margin:12px 0 0"><a href="#/goals">Add to a goal →</a></p></div>
  </div>`;
}

export function transactionsPage(ctx) {
  const { rows, cats, filter, q } = ctx;
  return `<h1>Transactions</h1><p class="sub">${rows.length} shown · November 2026 · add one below and the totals update everywhere</p>
  <form class="add" id="add-form">
    <label>Date <input type="date" name="date" value="2026-11-26" required></label>
    <label>Where <input name="merchant" placeholder="e.g. GreenMart" required></label>
    <label>Category <select name="category">${cats.map((c) => `<option>${esc(c)}</option>`).join('')}</select></label>
    <label>Amount ($) <input type="number" name="amount" step="0.01" min="0.01" placeholder="12.50" required></label>
    <button type="submit">Add transaction</button>
  </form>
  <div class="toolbar">
    <select id="f-cat"><option value="">All categories</option>${cats.map((c) => `<option ${c === filter ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
    <input id="f-q" type="search" placeholder="Search a shop…" value="${esc(q)}">
  </div>
  <table><thead><tr><th>Date</th><th>Where</th><th>Category</th><th class="num">Amount</th></tr></thead>
  <tbody>${rows.map((t) => `<tr><td>${esc(t.date)}</td><td>${esc(t.merchant)}</td><td>${esc(t.category)}</td><td class="num">${money(t.amount)}</td></tr>`).join('') || '<tr><td colspan="4">Nothing matches — clear the search.</td></tr>'}</tbody></table>`;
}

export function budgetsPage(ctx) {
  return `<h1>Budgets</h1><p class="sub">November limits · edit a limit and save — the dashboard updates at once</p>
  ${ctx.rows.map((r) => `<div class="card" style="margin-bottom:12px"><div class="row"><span><b>${esc(r.category)}</b> · spent ${money(r.spent)} of ${money(r.limit)}</span><span class="pill ${r.spent > r.limit ? 'over' : ''}">${r.spent > r.limit ? 'Over by ' + money(r.spent - r.limit) : Math.round(r.spent / r.limit * 100) + '% used'}</span></div>
  <div class="bar"><i class="${r.spent > r.limit ? 'over' : ''}" style="width:${Math.min(100, Math.round(r.spent / r.limit * 100))}%"></i></div>
  <form class="toolbar" data-budget="${esc(r.category)}" style="margin:6px 0 0"><label style="font-family:system-ui,sans-serif;font-size:13px">Monthly limit $ <input type="number" name="limit" step="1" min="0" value="${r.limit}" style="width:110px"></label><button type="submit">Save limit</button></form></div>`).join('')}`;
}

export function billsPage(ctx) {
  return `<h1>Bills</h1><p class="sub">Fixed bills for November · mark one paid and it moves to the paid list</p>
  <table><thead><tr><th>Bill</th><th>Due</th><th class="num">Amount</th><th>Status</th><th></th></tr></thead><tbody>
  ${ctx.bills.map((b, i) => `<tr><td>${esc(b.name)}${b.autopay ? ' · autopay' : ''}</td><td>${esc(b.due)}</td><td class="num">${money(b.amount)}</td><td><span class="pill ${b.paid ? 'paid' : 'due'}">${b.paid ? 'Paid' : 'Due'}</span></td><td>${b.paid ? '' : `<button class="ghost" data-pay="${i}">Mark paid</button>`}</td></tr>`).join('')}
  </tbody></table>
  <p class="sub" style="margin-top:14px">Paid so far: ${money(ctx.paidTotal)} · still to pay: ${money(ctx.unpaidTotal)}</p>`;
}

export function goalsPage(ctx) {
  return `<h1>Savings goals</h1><p class="sub">Add money to a goal — the progress bar and the total update at once</p>
  ${ctx.goals.map((g, i) => `<div class="card" style="margin-bottom:12px"><div class="row"><span><b>${esc(g.name)}</b> · ${esc(g.note)}</span><span><b>${money(g.saved)}</b> of ${money(g.target)} · ${Math.round(g.saved / g.target * 100)}%</span></div>
  <div class="bar"><i style="width:${Math.min(100, Math.round(g.saved / g.target * 100))}%"></i></div>
  <form class="toolbar" data-goal="${i}" style="margin:6px 0 0"><label style="font-family:system-ui,sans-serif;font-size:13px">Add $ <input type="number" name="add" step="1" min="1" placeholder="50" style="width:110px"></label><button type="submit">Add to goal</button></form></div>`).join('')}
  <div class="card"><div class="k">Saved across all goals</div><div class="v">${money(ctx.totalSaved)}</div><div class="s">of ${money(ctx.totalTarget)} total target</div></div>`;
}

export function reportsPage(ctx) {
  const { history, byCat, top } = ctx;
  return `<h1>Reports</h1><p class="sub">Six months of income against spending · November's figure updates as you add transactions</p>
  <div class="card"><div class="k">Income vs spending, Jun–Nov 2026</div><canvas id="trend" width="1000" height="360"></canvas>
  <div class="legend"><span><i style="background:#1d6b4f"></i>Income</span><span><i style="background:#b7791f"></i>Spending</span></div></div>
  <div class="grid2b">
    <div class="card"><div class="k">November by category</div>${byCat.map((s, i) => `<div class="row"><span><i style="display:inline-block;width:11px;height:11px;border-radius:3px;background:${COLORS[i % COLORS.length]};margin-right:6px"></i>${esc(s.label)}</span><b>${money(s.value)}</b></div>`).join('')}</div>
    <div class="card"><div class="k">Most-visited shops</div>${top.map((t) => `<div class="row"><span>${esc(t.merchant)}</span><span>${t.n} visits · <b>${money(t.total)}</b></span></div>`).join('')}</div>
  </div>
  <h2>Month by month</h2>
  <table><thead><tr><th>Month</th><th class="num">Income</th><th class="num">Spending</th><th class="num">Saved</th><th class="num">Savings rate</th></tr></thead><tbody>
  ${history.map((m) => `<tr><td>${esc(m.month)}</td><td class="num">${money(m.income)}</td><td class="num">${money(m.spent)}</td><td class="num">${money(m.income - m.spent)}</td><td class="num">${Math.round((m.income - m.spent) / m.income * 100)}%</td></tr>`).join('')}
  </tbody></table>`;
}

export function missing() {
  return `<h1>Not found</h1><p>There is no page at this address. <a href="#/">Back to the dashboard</a>.</p>`;
}
