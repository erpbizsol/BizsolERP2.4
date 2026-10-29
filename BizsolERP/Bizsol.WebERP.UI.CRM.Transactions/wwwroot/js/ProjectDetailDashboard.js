import { ProjectDetailDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectDetailDashboardService.js';
import { UserDashboardTileRights } from '../../Bizsol.WebERP.UI.Shared/js/UserDashboardTileRights.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

let pddFilterPanel       = null;
let lastFinancialRows    = [];


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
        kpiCardGRN:        'PurchaseTransactions/GRNService/MRNMasterApproval?ModuleDesp=GRN%20Services',
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
    BizSolHelperFunction.applyUserDashboardMenuBackButton('#btnBackToUserDashboardMenu');
    $('#btnBackToUserDashboardMenu').on('click', function () {
        BizSolHelperFunction.goToUserDashboardMenu();
    });
    BindKpiNavigation();
    BindFinancialShowAllToggle();
    MountFilterPanelToBody();
    UserDashboardTileRights.Apply(document).finally(function () {
        InitFilterSidePanelControl();
    });
});

/** Filter panel on body so offcanvas opens correctly on mobile. */
function MountFilterPanelToBody() {
    const panel = document.getElementById('pddFilterPanel');
    if (panel && panel.parentElement !== document.body) {
        document.body.appendChild(panel);
    }
}

function InitFilterSidePanelControl() {
    pddFilterPanel = document.getElementById('pddFilterPanel');
    if (!pddFilterPanel) return;

    if (!customElements.get('filter-side-panel-control')) {
        customElements.whenDefined('filter-side-panel-control').then(InitFilterSidePanelControl);
        return;
    }

    pddFilterPanel.setFilters([
        { id: 'dateRange', type: 'daterange', label: 'Date Range' },
        { id: 'ddlProject', type: 'select', label: 'Project', data: [{ Code: '0', Desp: '-- All Projects --' }] },
        { id: 'ddlSubProject', type: 'select', label: 'Sub Project', data: [{ Code: '0', Desp: '-- All Sub Projects --' }] },
    ]);

    pddFilterPanel.addEventListener('filtersapplied', function () {
        LoadDashboard();
    });

    LoadProjectDropdownIntoFilter()
        .then(function () {
            BindProjectChangeInFilter();
            return LoadSubProjectDropdownIntoFilter(0);
        })
        .then(function () {
            return new Promise(function (resolve) {
                setTimeout(function () {
                    SetDefaultDateRangeInFilter();
                    resolve();
                }, 500);
            });
        })
        .then(function () {
            LoadDashboard();
        })
        .catch(function () {
            LoadDashboard();
        });
}

function SetDefaultDateRangeInFilter() {
    const today             = new Date();
    const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const dateRangeEl       = pddFilterPanel?.shadowRoot?.getElementById('dateRange');
    if (dateRangeEl && typeof dateRangeEl.setRange === 'function') {
        dateRangeEl.setRange({
            fromDate: FmtDateInput(firstDayPrevMonth),
            toDate:   FmtDateInput(today),
        });
    }
}

function GetFilterParams() {
    if (!pddFilterPanel) {
        return { projectCode: 0, subProjectCode: 0, fromDate: '', toDate: '' };
    }
    const f = pddFilterPanel.getFilterValues();
    return {
        projectCode:    parseInt(f.ddlProject, 10) || 0,
        subProjectCode: parseInt(f.ddlSubProject, 10) || 0,
        fromDate:       f.dateRange?.fromDate || '',
        toDate:         f.dateRange?.toDate || '',
    };
}

function LoadProjectDropdownIntoFilter() {
    return ProjectDetailDashboardService.GetProjectList()
        .then(function (data) {
            const items = [{ Code: '0', Desp: '-- All Projects --' }];
            (data || []).forEach(function (p) {
                items.push({
                    Code: String(p.Code ?? p.ProjectMaster_Code ?? p.code ?? 0),
                    Desp: p.ProjectDesp ?? p.ProjectName ?? p.Desp ?? '',
                });
            });
            pddFilterPanel.updateFilterData('ddlProject', items);
        })
        .catch(function (err) {
            console.error('GetProjectList error:', err);
        });
}

function LoadSubProjectDropdownIntoFilter(projectCode) {
    return ProjectDetailDashboardService.GetSubProjectListByProject(projectCode)
        .then(function (data) {
            const items = [{ Code: '0', Desp: '-- All Sub Projects --' }];
            (data || []).forEach(function (s) {
                items.push({
                    Code: String(s.Code ?? s.SubProjectMaster_Code ?? s.code ?? 0),
                    Desp: s.SubProjectDesp ?? s.SubProjectName ?? s.Desp ?? '',
                });
            });
            pddFilterPanel.updateFilterData('ddlSubProject', items);
        })
        .catch(function (err) {
            console.error('GetSubProjectListByProject error:', err);
        });
}

function BindProjectChangeInFilter() {
    setTimeout(function () {
        const projectSel = pddFilterPanel?.shadowRoot?.getElementById('ddlProject');
        if (!projectSel) return;
        projectSel.addEventListener('change', function () {
            const projectCode = parseInt(this.value, 10) || 0;
            LoadSubProjectDropdownIntoFilter(projectCode);
        });
    }, 100);
}

// ── Main loader ───────────────────────────────────────────────────────────────
function LoadDashboard() {
    UserDashboardTileRights.Apply(document).then(LoadDashboardAfterRights);
}

function LoadDashboardAfterRights() {
    const { projectCode, subProjectCode, fromDate, toDate } = GetFilterParams();

    if (!fromDate || !toDate) {
        toastr.warning('Please select From Date and To Date.');
        return;
    }
    if (fromDate > toDate) {
        toastr.warning('From Date cannot be greater than To Date.');
        return;
    }

    SetLoading(true);

    const skip = function (tile) { return UserDashboardTileRights.IsTileHidden(tile); };
    const none = Promise.resolve(null);
    const S    = ProjectDetailDashboardService;

    Promise.all([
        S.GetDashboardSummary(projectCode, subProjectCode, fromDate, toDate),
        skip('Pending PO Approvals')      ? none : S.GetPendingPOBySubProject(projectCode, subProjectCode),
        skip('Pending Payment Approvals') ? none : S.GetPendingPaymentBySubProject(projectCode, subProjectCode),
        skip('Pending Expense Approvals') ? none : S.GetPendingExpenseBySubProject(projectCode, subProjectCode),
        skip('Pending GRN Approval')      ? none : S.GetPendingGRNBySubProject(projectCode, subProjectCode),
        skip('Project Financial Summary') ? none : S.GetProjectFinancialSummary(projectCode, subProjectCode, fromDate, toDate),
    ])
    .then(function ([summary, poRows, paymentRows, expenseRows, grnRows, finRows]) {
        RenderKPI(summary);
        if (poRows)      RenderPendingTable('tblPOBody',      'tblPOTotal',      poRows);
        if (paymentRows) RenderPendingTable('tblPaymentBody', 'tblPaymentTotal', paymentRows);
        if (expenseRows) RenderPendingTable('tblExpenseBody', 'tblExpenseTotal', expenseRows);
        if (grnRows)     RenderPendingTable('tblGRNBody',     'tblGRNTotal',     grnRows);
        if (finRows) {
            RenderFinancialSummary(finRows);
        }
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
    SetDefaultDateRangeInFilter();
    const projectSel = pddFilterPanel?.shadowRoot?.getElementById('ddlProject');
    if (projectSel) projectSel.value = '0';
    LoadSubProjectDropdownIntoFilter(0).then(function () {
        LoadDashboard();
    });
}

// ── Generic helpers for the new widgets ──────────────────────────────────────
function Pick(row, ...keys) {
    for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null) return row[k];
    }
    return undefined;
}

function EscHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

/** Indian-grouped rupee value, e.g. ₹ 12,50,00,000 */
function FmtInr(val) {
    const n = parseFloat(val);
    return '₹ ' + (isNaN(n) ? 0 : n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function ClearAllWidgets() {
    ['kpiPOCount','kpiPaymentAmt','kpiExpenseAmt','kpiGRNCount','kpiTotalProjects','kpiIsReconciled',
     'kpiTotalSubProjects','pddDataNote'
    ].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });
}

// ── Render KPI cards ─────────────────────────────────────────────────────────
function RenderKPI(data) {
    const d = FirstRow(data);
    if (!d) return;
    SetKpiText('kpiPOCount',         d.PendingPOCount      ?? '0');
    SetKpiText('kpiPaymentAmt',      FmtLakh(d.PendingPaymentAmount  ?? 0));
    SetKpiText('kpiExpenseAmt',      FmtLakh(d.PendingExpenseAmount  ?? 0));
    SetKpiText('kpiGRNCount',        d.PendingGRNService   ?? '0');
    SetKpiText('kpiTotalProjects',   d.TotalProjects       ?? '0');
    SetKpiText('kpiTotalSubProjects', d.TotalSubProjects   ?? '0');
    SetKpiText('kpiIsReconciled',    FormatUnReconciled(d.IsReconciled ?? d.isReconciled ?? 0));
}

// ── Pending approvals tables (Sub Project wise) ──────────────────────────────
function RenderPendingTable(bodyId, totalId, data) {
    const rows  = AsArray(data);
    const body  = document.getElementById(bodyId);
    const total = document.getElementById(totalId);
    if (!body || !total) return;

    let sum = 0;
    const html = rows.map(function (r) {
        const name  = Pick(r, 'SubProjectName', 'subProjectName', 'SubProjectDesp') ?? '';
        const count = parseInt(Pick(r, 'PendingCount', 'pendingCount', 'Count') ?? 0, 10) || 0;
        sum += count;
        return '<tr><td>' + EscHtml(name) + '</td><td class="pdd-c">' + count + '</td></tr>';
    }).join('');

    body.innerHTML = html || '<tr><td colspan="2" class="pdd-empty">No pending records</td></tr>';
    total.textContent = sum;
}

function IsShowAllProjects() {
    const chk = document.getElementById('chkShowAllProjects');
    return !!(chk && chk.checked);
}

function BindFinancialShowAllToggle() {
    const chk = document.getElementById('chkShowAllProjects');
    if (!chk) return;
    chk.addEventListener('change', function () {
        RenderFinancialSummary(lastFinancialRows);
    });
}

// ── Project Financial Summary table ──────────────────────────────────────────
function RenderFinancialSummary(data) {
    lastFinancialRows = AsArray(data);
    const rows = lastFinancialRows.filter(function (r) {
        if (IsShowAllProjects()) return true;
        const received = parseFloat(Pick(r, 'PaymentReceived', 'paymentReceived') ?? 0) || 0;
        const made     = parseFloat(Pick(r, 'PaymentMade', 'paymentMade') ?? 0) || 0;
        return received > 0 || made > 0;
    });
    const body = document.getElementById('tblFinBody');
    if (!body) return;

    const tot = { budget: 0, gst: 0, received: 0, made: 0, balance: 0 };
    const html = rows.map(function (r) {
        const budget   = parseFloat(Pick(r, 'BudgetAmount', 'budgetAmount') ?? 0) || 0;
        const gst      = parseFloat(Pick(r, 'BudgetGSTAmount', 'budgetGSTAmount') ?? 0) || 0;
        const received = parseFloat(Pick(r, 'PaymentReceived', 'paymentReceived') ?? 0) || 0;
        const made     = parseFloat(Pick(r, 'PaymentMade', 'paymentMade') ?? 0) || 0;
        const balance  = parseFloat(Pick(r, 'Balance', 'balance') ?? (budget + gst - made)) || 0;
        tot.budget += budget; tot.gst += gst; tot.received += received; tot.made += made; tot.balance += balance;
        return '<tr>' +
            '<td>' + EscHtml(Pick(r, 'ProjectName', 'projectName', 'ProjectDesp') ?? '') + '</td>' +
            '<td class="pdd-r">' + FmtInr(budget)   + '</td>' +
            '<td class="pdd-r">' + FmtInr(gst)      + '</td>' +
            '<td class="pdd-r">' + FmtInr(received) + '</td>' +
            '<td class="pdd-r">' + FmtInr(made)     + '</td>' +
            '<td class="pdd-r">' + FmtInr(balance)  + '</td>' +
            '</tr>';
    }).join('');

    body.innerHTML = html || '<tr><td colspan="6" class="pdd-empty">No projects with payment received or payment made</td></tr>';
    SetKpiText('finTotBudget',   FmtInr(tot.budget));
    SetKpiText('finTotGST',      FmtInr(tot.gst));
    SetKpiText('finTotReceived', FmtInr(tot.received));
    SetKpiText('finTotMade',     FmtInr(tot.made));
    SetKpiText('finTotBalance',  FmtInr(tot.balance));
}

// ── Expose to window (onclick in HTML) ───────────────────────────────────────
window.LoadDashboard       = LoadDashboard;
window.ResetDashboard      = ResetDashboard;
window.OpenPddFilterPanel  = function () {
    if (pddFilterPanel && typeof pddFilterPanel.open === 'function') {
        pddFilterPanel.open();
    }
};
