import { ProjectDetailDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectDetailDashboardService.js';

// ── Chart instances (destroyed & recreated on each load) ─────────────────────
let chartPOStatus        = null;
let chartPaymentTrend    = null;
let chartProjectSummary  = null;
let chartBudgetLine      = null;
let chartExpenseSummary  = null;


// ── Helpers ──────────────────────────────────────────────────────────────────
function FmtDateInput(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function SetKpiText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function FormatUnReconciled(val) {
    const n = Number(val);
    if (!n) return '0';
    if (Math.abs(n) >= 1e5) {
        const l = n / 1e5;
        return (Number.isInteger(l) ? l : parseFloat(l.toFixed(2))) + 'L';
    }
    return String(n);
}

function FirstRow(data) {
    if (!data) return null;
    if (Array.isArray(data)) return data[0] || null;
    if (Array.isArray(data.Data)) return data.Data[0] || null;
    if (Array.isArray(data.data)) return data.data[0] || null;
    if (typeof data === 'object') return data;
    return null;
}

function AsArray(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.Data)) return data.Data;
    if (Array.isArray(data.data)) return data.data;
    return [];
}

function RowTypeVal(row) {
    return parseInt(row.RowType ?? row.rowType ?? 0, 10);
}

function FmtLakh(val) {
    const n = parseFloat(val);
    if (isNaN(n) || n === 0) return '₹0';
    if (Math.abs(n) >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
    if (Math.abs(n) >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SetLoading(on) {
    document.getElementById('pddLoadingOverlay').classList.toggle('active', on);
}

function DestroyChart(ref) {
    if (ref) { try { ref.destroy(); } catch (_) {} }
    return null;
}

function NowNote() {
    const d = new Date();
    return 'All amounts are in INR (₹)  |  Data as of ' +
        d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function AppBase() {
    let base = sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/');
    if (base && !base.endsWith('/')) base += '/';
    return base;
}

function NavToPage(path) {
    window.location.href = AppBase() + String(path || '').replace(/^\//, '');
}

function BindKpiNavigation() {
    const routes = {
        kpiCardPO:         'PurchaseTransactions/PurchaseOrder/POLevelsApprove?ModuleDesp=PO%20Approval',
        kpiCardPayment:    'PurchaseTransactions/GRNService/GRNPaymentApproval',
        kpiCardExpense:    'CRMTransactions/ExpenseEntry/ExpenseEntryLevelsApproval',
        kpiCardReconciled: 'FinanceTransactions/BankStatement/BankStatementImport?ModuleDesp=Bank%20Statement%20Import',
    };

    Object.keys(routes).forEach(function (id) {
        const el = document.getElementById(id);
        if (!el) return;
        const path = routes[id];
        el.addEventListener('click', function () { NavToPage(path); });
        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                NavToPage(path);
            }
        });
    });
}

// ── Init ─────────────────────────────────────────────────────────────────────
$(document).ready(function () {
    InitDefaultDates();
    BindFilterChange();
    BindKpiNavigation();
    LoadProjectDropdown()
        .then(function () {
            // On page load with "All Projects" selected, also load all sub-projects
            LoadSubProjectDropdown(0);
            LoadDashboard();
        })
        .catch(function () { LoadDashboard(); });
});

function InitDefaultDates() {
    const today              = new Date();
    const firstDayPrevMonth  = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    document.getElementById('pddFromDate').value = FmtDateInput(firstDayPrevMonth);
    document.getElementById('pddToDate').value   = FmtDateInput(today);
}

// ── Project dropdown ─────────────────────────────────────────────────────────
function LoadProjectDropdown() {
    return ProjectDetailDashboardService.GetProjectList()
        .then(function (data) {
            const ddl = document.getElementById('ddlProject');
            ddl.innerHTML = '<option value="0">-- All Projects --</option>';
            (data || []).forEach(function (p) {
                const opt = document.createElement('option');
                opt.value       = p.Code ?? p.ProjectMaster_Code ?? p.code ?? 0;
                opt.textContent = p.ProjectDesp ?? p.ProjectName ?? p.Desp ?? '';
                ddl.appendChild(opt);
            });
        })
        .catch(function (err) {
            console.error('GetProjectList error:', err);
        });
}

// ── Load sub-project dropdown for a given project code (0 = All) ─────────────
function LoadSubProjectDropdown(projectCode) {
    const ddlSub = document.getElementById('ddlSubProject');
    ddlSub.innerHTML = '<option value="0">-- All Sub Projects --</option>';
    ddlSub.disabled  = true;

    return ProjectDetailDashboardService.GetSubProjectListByProject(projectCode)
        .then(function (data) {
            (data || []).forEach(function (s) {
                const opt = document.createElement('option');
                opt.value       = s.Code ?? s.SubProjectMaster_Code ?? s.code ?? 0;
                opt.textContent = s.SubProjectDesp ?? s.SubProjectName ?? s.Desp ?? '';
                ddlSub.appendChild(opt);
            });
            // Enable only if there are actual sub-projects to choose from
            if (ddlSub.options.length > 1) ddlSub.disabled = false;
        })
        .catch(function (err) {
            console.error('GetSubProjectListByProject error:', err);
            ddlSub.disabled = false;
        });
}

// ── Project / Sub-project change → reload dashboard ─────────────────────────
function BindFilterChange() {
    document.getElementById('ddlProject').addEventListener('change', function () {
        const projectCode = parseInt(this.value, 10) || 0;
        LoadSubProjectDropdown(projectCode).then(function () {
            LoadDashboard();
        });
    });

    document.getElementById('ddlSubProject').addEventListener('change', function () {
        LoadDashboard();
    });
}

// ── Main loader ───────────────────────────────────────────────────────────────
function LoadDashboard() {
    const projectCode    = parseInt(document.getElementById('ddlProject').value, 10)    || 0;
    const subProjectCode = parseInt(document.getElementById('ddlSubProject').value, 10) || 0;
    const fromDate       = document.getElementById('pddFromDate').value;
    const toDate         = document.getElementById('pddToDate').value;

    if (!fromDate || !toDate) {
        toastr.warning('Please select From Date and To Date.');
        return;
    }
    if (fromDate > toDate) {
        toastr.warning('From Date cannot be greater than To Date.');
        return;
    }

    SetLoading(true);
    const year = new Date(fromDate).getFullYear();

    Promise.all([
        ProjectDetailDashboardService.GetDashboardSummary(projectCode, subProjectCode, fromDate, toDate),
        ProjectDetailDashboardService.GetPOStatus(projectCode, subProjectCode, fromDate, toDate),
        ProjectDetailDashboardService.GetPaymentTrend(projectCode, subProjectCode, year),
        ProjectDetailDashboardService.GetProjectSummary(projectCode),
        ProjectDetailDashboardService.GetBudgetVsActual(projectCode, subProjectCode, fromDate, toDate),
        ProjectDetailDashboardService.GetExpenseSummary(projectCode, subProjectCode, fromDate, toDate),
    ])
    .then(function ([summary, poStatus, paymentTrend, projectSummary, bva, expenseSummary]) {
        RenderKPI(summary);
        RenderPOStatus(poStatus);
        RenderPaymentTrend(paymentTrend, year);
        RenderProjectSummary(projectSummary);
        RenderBudgetVsActual(bva);
        RenderExpenseSummary(expenseSummary);
        document.getElementById('pddDataNote').textContent = NowNote();
    })
    .catch(function (err) {
        console.error('Dashboard load error:', err);
        toastr.error('Error loading dashboard data. Please try again.');
    })
    .finally(function () {
        SetLoading(false);
    });
}

// ── Reset ────────────────────────────────────────────────────────────────────
function ResetDashboard() {
    document.getElementById('ddlProject').value    = '0';
    document.getElementById('ddlSubProject').innerHTML = '<option value="0">-- All Sub Projects --</option>';
    document.getElementById('ddlSubProject').disabled  = true;
    InitDefaultDates();
    LoadSubProjectDropdown(0).then(function () {
        LoadDashboard();
    });
}

function ClearAllWidgets() {
    ['kpiPOCount','kpiPaymentAmt','kpiExpenseAmt','kpiTotalProjects','kpiIsReconciled',
     'legPOApproved','legPOPending','legPORejected','legPOTotal',
     'projSummaryTotal','legProjActive','legProjPending','legProjCompleted','legProjOnHold',
     'bvaBudget','bvaSpent','bvaBalance','bvaPct',
     'expTotalAmount','legExpApproved','legExpPending','legExpRejected',
     'pddDataNote','trendYear'
    ].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });
    const bar = document.getElementById('bvaProgressBar');
    if (bar) bar.style.width = '0%';

    chartPOStatus       = DestroyChart(chartPOStatus);
    chartPaymentTrend   = DestroyChart(chartPaymentTrend);
    chartProjectSummary = DestroyChart(chartProjectSummary);
    chartBudgetLine     = DestroyChart(chartBudgetLine);
    chartExpenseSummary = DestroyChart(chartExpenseSummary);
}

// ── Render KPI cards ─────────────────────────────────────────────────────────
function RenderKPI(data) {
    const d = FirstRow(data);
    if (!d) return;
    SetKpiText('kpiPOCount',       d.PendingPOCount      ?? '0');
    SetKpiText('kpiPaymentAmt',    FmtLakh(d.PendingPaymentAmount  ?? 0));
    SetKpiText('kpiExpenseAmt',    FmtLakh(d.PendingExpenseAmount  ?? 0));
    SetKpiText('kpiTotalProjects', d.TotalProjects       ?? '0');
    SetKpiText('kpiIsReconciled',  FormatUnReconciled(d.IsReconciled ?? d.isReconciled ?? 0));
}

// ── Render PO Status donut ────────────────────────────────────────────────────
function RenderPOStatus(data) {
    if (!data || !data.length) return;
    const d        = data[0];
    const approved = parseInt(d.Approved ?? 0, 10);
    const pending  = parseInt(d.Pending  ?? 0, 10);
    const rejected = parseInt(d.Rejected ?? 0, 10);
    const total    = approved + pending + rejected;

    document.getElementById('legPOApproved').textContent = `${approved} (${total ? Math.round(approved/total*100) : 0}%)`;
    document.getElementById('legPOPending').textContent  = `${pending} (${total  ? Math.round(pending /total*100) : 0}%)`;
    document.getElementById('legPORejected').textContent = `${rejected} (${total ? Math.round(rejected/total*100) : 0}%)`;
    document.getElementById('legPOTotal').textContent    = total;

    chartPOStatus = DestroyChart(chartPOStatus);
    chartPOStatus = new Chart(document.getElementById('chartPOStatus'), {
        type: 'doughnut',
        data: {
            labels: ['Approved', 'Pending', 'Rejected'],
            datasets: [{
                data: [approved, pending, rejected],
                backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                borderWidth: 3,
                borderColor: '#fff',
                hoverOffset: 8,
                hoverBorderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            animation: { animateRotate: true, duration: 900 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.85)',
                    padding: 10,
                    cornerRadius: 10,
                    titleFont: { weight: '700' },
                    callbacks: {
                        label: function (ctx) {
                            return ` ${ctx.label}: ${ctx.parsed} (${total ? Math.round(ctx.parsed/total*100) : 0}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ── Render Payment Trend bar ─────────────────────────────────────────────────
function RenderPaymentTrend(data, year) {
    document.getElementById('trendYear').textContent = year || '—';

    const allMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const amountMap = {};
    (data || []).forEach(function (r) {
        const mn = parseInt(r.Month ?? r.MonthNo ?? 0, 10);
        if (mn >= 1 && mn <= 12) amountMap[mn] = parseFloat(r.TotalAmount ?? r.Amount ?? 0);
    });
    const amounts = allMonths.map(function (_, i) { return amountMap[i+1] || 0; });
    const maxAmt  = Math.max(...amounts);

    chartPaymentTrend = DestroyChart(chartPaymentTrend);
    chartPaymentTrend = new Chart(document.getElementById('chartPaymentTrend'), {
        type: 'bar',
        data: {
            labels: allMonths,
            datasets: [{
                label: 'Payment Amount',
                data: amounts,
                backgroundColor: amounts.map(function (v) {
                    return v === maxAmt && maxAmt > 0 ? '#6366f1' : 'rgba(99,102,241,0.18)';
                }),
                hoverBackgroundColor: amounts.map(function (v) {
                    return v === maxAmt && maxAmt > 0 ? '#4f46e5' : 'rgba(99,102,241,0.45)';
                }),
                borderRadius: 8,
                borderSkipped: false,
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 900 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.85)',
                    padding: 10,
                    cornerRadius: 10,
                    callbacks: {
                        label: function (ctx) { return '  ' + FmtLakh(ctx.parsed.y); }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { font: { size: 11, weight: '600' }, color: '#94a3b8' }
                },
                y: {
                    grid: { color: '#f1f5f9', lineWidth: 1 },
                    border: { display: false, dash: [4,4] },
                    ticks: {
                        font: { size: 10 },
                        color: '#94a3b8',
                        callback: function (v) { return FmtLakh(v); }
                    }
                }
            }
        }
    });
}

// ── Render Project Summary donut ─────────────────────────────────────────────
function RenderProjectSummary(data) {
    if (!data || !data.length) return;
    const d         = data[0];
    const active    = parseInt(d.Active    ?? 0, 10);
    const pending   = parseInt(d.Pending   ?? 0, 10);
    const completed = parseInt(d.Completed ?? 0, 10);
    const onHold    = parseInt(d.OnHold    ?? d.On_Hold ?? 0, 10);
    const total     = active + pending + completed + onHold;

    document.getElementById('projSummaryTotal').textContent = total;
    document.getElementById('legProjActive').textContent    = `${active}    (${total ? Math.round(active/total*100) : 0}%)`;
    document.getElementById('legProjPending').textContent   = `${pending}   (${total ? Math.round(pending/total*100) : 0}%)`;
    document.getElementById('legProjCompleted').textContent = `${completed} (${total ? Math.round(completed/total*100) : 0}%)`;
    document.getElementById('legProjOnHold').textContent    = `${onHold}    (${total ? Math.round(onHold/total*100) : 0}%)`;

    chartProjectSummary = DestroyChart(chartProjectSummary);
    chartProjectSummary = new Chart(document.getElementById('chartProjectSummary'), {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Pending', 'Completed', 'On Hold'],
            datasets: [{
                data: [active, pending, completed, onHold],
                backgroundColor: ['#6366f1', '#f59e0b', '#22c55e', '#cbd5e1'],
                borderWidth: 3,
                borderColor: '#fff',
                hoverOffset: 8,
                hoverBorderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '66%',
            animation: { animateRotate: true, duration: 900 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.85)',
                    padding: 10,
                    cornerRadius: 10,
                }
            }
        }
    });
}

// ── Render Budget vs Actual ───────────────────────────────────────────────────
function RenderBudgetVsActual(data) {
    const rows = AsArray(data);
    if (!rows.length) return;

    // RowType=0 → summary header; RowType=1 → monthly detail rows
    const summary = rows.find(function (r) { return RowTypeVal(r) === 0; }) || rows[0];
    const details = rows.filter(function (r) { return RowTypeVal(r) === 1; });

    const budget  = parseFloat(summary.TotalBudget ?? 0);
    const spent   = parseFloat(summary.TotalSpent  ?? 0);
    const balance = parseFloat(summary.TotalBalance ?? (budget - spent));
    const pct     = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

    document.getElementById('bvaBudget').textContent  = FmtLakh(budget);
    document.getElementById('bvaSpent').textContent   = FmtLakh(spent);
    document.getElementById('bvaBalance').textContent = FmtLakh(balance);
    document.getElementById('bvaPct').textContent    = pct.toFixed(2) + '%';
    document.getElementById('bvaProgressBar').style.width = pct.toFixed(2) + '%';

    // Monthly spend line (detail rows only)
    const months     = details.map(function (r) { return r.MonthName ?? ''; });
    const spentData  = details.map(function (r) { return parseFloat(r.MonthlySpent  ?? 0); });
    const budgetData = details.map(function (r) { return parseFloat(r.MonthlyBudget ?? 0); });

    chartBudgetLine = DestroyChart(chartBudgetLine);
    chartBudgetLine = new Chart(document.getElementById('chartBudgetLine'), {
        type: 'line',
        data: {
            labels: months.length ? months : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            datasets: [
                {
                    label: 'Budget',
                    data: budgetData.length ? budgetData : Array(12).fill(0),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.10)',
                    borderWidth: 2.5,
                    pointRadius: 3,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    tension: 0.45,
                    fill: true,
                },
                {
                    label: 'Spent',
                    data: spentData.length ? spentData : Array(12).fill(0),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245,158,11,0.08)',
                    borderWidth: 2.5,
                    pointRadius: 3,
                    pointBackgroundColor: '#f59e0b',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    tension: 0.45,
                    fill: true,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 900 },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { size: 10, weight: '600' }, boxWidth: 10, boxHeight: 10, borderRadius: 3, usePointStyle: true }
                },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.85)',
                    padding: 10,
                    cornerRadius: 10,
                    callbacks: { label: function (ctx) { return '  ' + FmtLakh(ctx.parsed.y); } }
                }
            },
            scales: {
                x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 9 }, color: '#94a3b8' } },
                y: { grid: { color: '#f1f5f9' }, border: { display: false }, ticks: { font: { size: 9 }, color: '#94a3b8', callback: function (v) { return FmtLakh(v); } } }
            }
        }
    });
}

// ── Render Expense Summary donut ─────────────────────────────────────────────
function RenderExpenseSummary(data) {
    if (!data || !data.length) return;
    const d              = data[0];
    const approved       = parseFloat(d.Approved       ?? 0);
    const pendingApproval= parseFloat(d.PendingApproval ?? d.Pending ?? 0);
    const rejected       = parseFloat(d.Rejected       ?? 0);
    const total          = parseFloat(d.TotalExpenses  ?? (approved + pendingApproval + rejected));

    document.getElementById('expTotalAmount').textContent  = FmtLakh(total);
    document.getElementById('legExpApproved').textContent  = FmtLakh(approved);
    document.getElementById('legExpPending').textContent   = FmtLakh(pendingApproval);
    document.getElementById('legExpRejected').textContent  = FmtLakh(rejected);

    chartExpenseSummary = DestroyChart(chartExpenseSummary);
    chartExpenseSummary = new Chart(document.getElementById('chartExpenseSummary'), {
        type: 'doughnut',
        data: {
            labels: ['Approved', 'Pending Approval', 'Rejected'],
            datasets: [{
                data: [approved, pendingApproval, rejected],
                backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                borderWidth: 3,
                borderColor: '#fff',
                hoverOffset: 8,
                hoverBorderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            animation: { animateRotate: true, duration: 900 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.85)',
                    padding: 10,
                    cornerRadius: 10,
                    callbacks: {
                        label: function (ctx) { return '  ' + ctx.label + ': ' + FmtLakh(ctx.parsed); }
                    }
                }
            }
        }
    });
}

// ── Expose to window (onclick in HTML) ───────────────────────────────────────
window.LoadDashboard  = LoadDashboard;
window.ResetDashboard = ResetDashboard;
