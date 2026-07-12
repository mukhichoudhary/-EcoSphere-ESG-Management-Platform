/* ---------- STATE (persisted in localStorage) ---------- */
const state = {
  ops: JSON.parse(localStorage.getItem('eco_ops')) || [],
  employees: JSON.parse(localStorage.getItem('eco_employees')) || [],
  compliance: JSON.parse(localStorage.getItem('eco_compliance')) || [],
};

function save() {
  localStorage.setItem('eco_ops', JSON.stringify(state.ops));
  localStorage.setItem('eco_employees', JSON.stringify(state.employees));
  localStorage.setItem('eco_compliance', JSON.stringify(state.compliance));
}

/* ---------- TAB NAVIGATION ---------- */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'dashboard') renderDashboard();
  });
});

/* ---------- OPERATIONAL DATA ---------- */
document.getElementById('opsForm').addEventListener('submit', e => {
  e.preventDefault();
  const entry = {
    energy: +document.getElementById('energy').value,
    water: +document.getElementById('water').value,
    waste: +document.getElementById('waste').value,
    recycled: +document.getElementById('recycled').value,
    date: new Date().toLocaleDateString()
  };
  state.ops.push(entry);
  save();
  e.target.reset();
  renderOpsSummary();
  alert('Operational data saved!');
});

function renderOpsSummary() {
  const el = document.getElementById('opsSummary');
  if (!state.ops.length) { el.innerHTML = ''; return; }
  const latest = state.ops[state.ops.length - 1];
  el.innerHTML = `<p>Latest entry (${latest.date}): ${latest.energy} kWh energy, ${latest.water} L water, ${latest.waste} kg waste, ${latest.recycled}% recycled.</p>`;
}

/* ---------- EMPLOYEE PARTICIPATION (gamification) ---------- */
const ACTION_POINTS = { recycle: 10, carpool: 15, event: 20, idea: 25, energy: 10 };
const ACTION_LABELS = {
  recycle: 'Recycled correctly',
  carpool: 'Carpooled / public transport',
  event: 'Attended sustainability event',
  idea: 'Submitted a green idea',
  energy: 'Reported energy-saving action'
};

document.getElementById('empForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('empName').value.trim();
  const action = document.getElementById('empAction').value;
  const points = ACTION_POINTS[action];

  state.employees.push({ name, action, points, date: new Date().toLocaleDateString() });
  save();
  e.target.reset();
  renderEmpLog();
  checkBadges(name);
  alert(`+${points} points logged for ${name}!`);
});

function renderEmpLog() {
  const el = document.getElementById('empLogList');
  el.innerHTML = state.employees.slice().reverse().slice(0, 10).map(log =>
    `<div class="log-item"><span>${log.name} — ${ACTION_LABELS[log.action]}</span><strong>+${log.points}</strong></div>`
  ).join('');
}

/* ---------- BADGES ---------- */
const BADGE_RULES = [
  { id: 'starter', label: '🌱 First Action', check: total => total >= 1 },
  { id: 'green50', label: '🌿 50 Points', check: total => total >= 50 },
  { id: 'green100', label: '🌳 100 Points', check: total => total >= 100 },
  { id: 'green200', label: '🏅 Eco Champion (200+)', check: total => total >= 200 },
];

function getTotalsByEmployee() {
  const totals = {};
  state.employees.forEach(e => {
    totals[e.name] = (totals[e.name] || 0) + e.points;
  });
  return totals;
}

function checkBadges(name) {
  const totals = getTotalsByEmployee();
  const total = totals[name] || 0;
  BADGE_RULES.forEach(rule => {
    if (rule.check(total)) {
      // badge earned — will show up next render
    }
  });
}

/* ---------- COMPLIANCE ---------- */
document.getElementById('complianceForm').addEventListener('submit', e => {
  e.preventDefault();
  state.compliance.push({
    task: document.getElementById('taskName').value,
    deadline: document.getElementById('taskDeadline').value,
    done: false
  });
  save();
  e.target.reset();
  renderCompliance();
});

function renderCompliance() {
  const el = document.getElementById('complianceList');
  const today = new Date();
  el.innerHTML = state.compliance.map((t, i) => {
    const due = new Date(t.deadline);
    let cls = 'upcoming';
    if (t.done) cls = 'done';
    else if (due < today) cls = 'overdue';
    return `<div class="task-item ${cls}">
      <span>${t.task} — due ${t.deadline}</span>
      <button onclick="toggleTask(${i})">${t.done ? 'Undo' : 'Mark Done'}</button>
    </div>`;
  }).join('');
}

function toggleTask(i) {
  state.compliance[i].done = !state.compliance[i].done;
  save();
  renderCompliance();
  renderDashboard();
}

/* ---------- LEADERBOARD ---------- */
function renderLeaderboard() {
  const totals = getTotalsByEmployee();
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const el = document.getElementById('leaderboardList');
  el.innerHTML = sorted.map(([name, pts], i) =>
    `<div class="leader-item rank-${i + 1}"><span>#${i + 1} ${name}</span><strong>${pts} pts</strong></div>`
  ).join('') || '<p>No activity logged yet.</p>';
}

/* ---------- ESG SCORING ---------- */
function computeScores() {
  // Environmental: based on recycling % and energy efficiency trend
  let envScore = 50;
  if (state.ops.length) {
    const avgRecycled = state.ops.reduce((s, o) => s + o.recycled, 0) / state.ops.length;
    envScore = Math.round(avgRecycled); // simple: recycling % drives E score
  }

  // Social: based on employee participation points (capped at 100)
  const totalEmpPoints = state.employees.reduce((s, e) => s + e.points, 0);
  const socialScore = Math.min(100, Math.round(totalEmpPoints / 5));

  // Governance: based on compliance completion rate
  let govScore = 50;
  if (state.compliance.length) {
    const doneCount = state.compliance.filter(t => t.done).length;
    govScore = Math.round((doneCount / state.compliance.length) * 100);
  }

  const overall = Math.round((envScore + socialScore + govScore) / 3);
  return { envScore, socialScore, govScore, overall };
}

/* ---------- DASHBOARD RENDER ---------- */
let opsChart, complianceChart;

function renderDashboard() {
  const { envScore, socialScore, govScore, overall } = computeScores();
  document.getElementById('envScore').textContent = envScore;
  document.getElementById('socialScore').textContent = socialScore;
  document.getElementById('govScore').textContent = govScore;
  document.getElementById('overallScore').textContent = overall;

  // Total points across all employees (for header display)
  const totalPoints = state.employees.reduce((s, e) => s + e.points, 0);
  document.getElementById('userPointsDisplay').textContent = totalPoints;
  document.getElementById('userLevel').textContent = Math.floor(totalPoints / 100) + 1;

  // Badges (org-wide, based on total points)
  const badgeEl = document.getElementById('badgeList');
  badgeEl.innerHTML = BADGE_RULES.filter(r => r.check(totalPoints))
    .map(r => `<span class="badge">${r.label}</span>`).join('') || '<span>No badges yet — log an action!</span>';

  // Operations chart
  const ctx1 = document.getElementById('operationsChart');
  const labels = state.ops.map(o => o.date);
  if (opsChart) opsChart.destroy();
  opsChart = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['No data'],
      datasets: [
        { label: 'Energy (kWh)', data: state.ops.map(o => o.energy), borderColor: '#2e7d32', tension: 0.3 },
        { label: 'Waste (kg)', data: state.ops.map(o => o.waste), borderColor: '#e53935', tension: 0.3 }
      ]
    },
    options: { responsive: true, plugins: { title: { display: true, text: 'Operational Trends' } } }
  });

  // Compliance chart
  const ctx2 = document.getElementById('complianceChart');
  const doneCount = state.compliance.filter(t => t.done).length;
  const pendingCount = state.compliance.length - doneCount;
  if (complianceChart) complianceChart.destroy();
  complianceChart = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'Pending'],
      datasets: [{ data: [doneCount, pendingCount], backgroundColor: ['#2e7d32', '#ffb300'] }]
    },
    options: { responsive: true, plugins: { title: { display: true, text: 'Compliance Status' } } }
  });
}

/* ---------- INIT ---------- */
renderOpsSummary();
renderEmpLog();
renderCompliance();
renderLeaderboard();
renderDashboard();
setInterval(renderLeaderboard, 2000); // keep leaderboard fresh if data changes across tabs