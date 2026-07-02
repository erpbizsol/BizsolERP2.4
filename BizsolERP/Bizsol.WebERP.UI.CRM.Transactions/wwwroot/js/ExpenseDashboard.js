import { ExpenseDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseDashboardService.js';
import { ExpenseEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseEntryService.js';
import { ExpensesLedgerReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpensesLedgerReportService.js';

let G_SubProjectList = [];
let G_MarketingManList = [];
let chartTrend = null;
let chartCategory = null;

const CATEGORY_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#14b8a6', '#eab308', '#ef4444', '#6366f1'];

$(document).ready(function () {
    $('#ERPHeading').text('Expense Dashboard');
    initCurrentMonthDates();
    bindEvents();
    loadFilters().then(function () {
        loadDashboard();
    });
});

function bindEvents() {
    $('#btnShow').on('click', loadDashboard);
    $('#ddlProject').on('change', refreshSubProjectOptions);
    $('#ddlMarketingMan').on('change', function () {
        $('#edashWelcomeName').text(getSelectedMarketingManName());
    });
    $('#btnExport').on('click', exportProjectTable);
    $('#txtFromDate, #txtToDate').on('change', updateDateRangeLabel);
}

function initCurrentMonthDates() {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    $('#txtFromDate').val(fmtIsoDate(first));
    $('#txtToDate').val(fmtIsoDate(last));
    updateDateRangeLabel();
}

function fmtIsoDate(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function updateDateRangeLabel() {
    const from = $('#txtFromDate').val();
    const to = $('#txtToDate').val();
    if (!from || !to) {
        $('#edashDateRangeLabel').text('—');
        $('#projectTableTitle').text('Project Wise Expense');
        return;
    }
    const label = fmtDisplayDate(from) + ' - ' + fmtDisplayDate(to);
    $('#edashDateRangeLabel').text(label);
    $('#projectTableTitle').text('Project Wise Expense (' + label + ')');
    $('#chartTrendTitle').text('Expense Trend (' + fmtMonthLabel(from) + ')');
}

function fmtDisplayDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return String(d.getDate()).padStart(2, '0') + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

function fmtMonthLabel(iso) {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return 'Selected Period';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getFullYear();
}

function convertDateForApi(iso) {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return parts[2] + '-' + months[parseInt(parts[1], 10) - 1] + '-' + parts[0];
}

function asArray(response) {
    if (response == null) return [];
    if (Array.isArray(response)) return response;
    const keys = ['data', 'Data', 'result', 'Result', 'items', 'Items', 'rows', 'Rows'];
    for (let i = 0; i < keys.length; i++) {
        if (Array.isArray(response[keys[i]])) return response[keys[i]];
    }
    return [];
}

function firstVal(obj, keys) {
    if (!obj) return '';
    for (let i = 0; i < keys.length; i++) {
        const v = obj[keys[i]];
        if (v != null && v !== '') return v;
    }
    return '';
}

function numVal(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

function fmtCurrency(v) {
    const n = numVal(v);
    return '₹ ' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtCurrencyFull(v) {
    const n = numVal(v);
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getAuthUserMasterCode() {
    try {
        const auth = JSON.parse(sessionStorage.getItem('authKey'));
        return auth && auth.UserMaster_Code != null ? auth.UserMaster_Code : null;
    } catch (e) {
        return null;
    }
}

function setLoading(on) {
    $('#edashLoader').toggleClass('show', !!on);
}

function bindSelectList($el, list, firstItem) {
    $el.empty();
    if (firstItem === 'All') $el.append(new Option('All', '0'));
    else if (firstItem === 'Select') $el.append(new Option('Select', ''));
    list.forEach(function (item) {
        const code = item.Code != null ? String(item.Code) : '';
        let text = item.Desp != null ? String(item.Desp) : code;
        $el.append(new Option(text, code));
    });
}

function initSelect2(el) {
    const $el = $(el);
    if ($el.data('select2')) $el.select2('destroy');
    $el.select2({
        width: '100%',
        matcher: function (params, data) {
            if ($.trim(params.term) === '') return data;
            if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) return data;
            return null;
        },
    });
}

function mapMarketingManRows(rows) {
    return rows.map(function (item) {
        const Code = firstVal(item, ['MarketingManMaster_Code', 'marketingManMaster_Code', 'Code', 'code', 'EmployeeMaster_Code']);
        const Desp = String(firstVal(item, ['PersonName', 'personName', 'EmployeeName', 'Desp', 'Name'])).trim();
        const userCode = firstVal(item, ['Usermaster_Code', 'UserMaster_Code', 'userMaster_Code']);
        return { Code: String(Code || ''), Desp: Desp || String(Code), UserMaster_Code: userCode };
    }).filter(function (x) { return x.Code; });
}

function mapProjectRows(rows) {
    return rows.map(function (item) {
        const Code = firstVal(item, ['ProjectMaster_Code', 'projectMaster_Code', 'Code', 'code']);
        const Desp = String(firstVal(item, ['ProjectName', 'projectName', 'ProjectDesp', 'Desp', 'Name'])).trim();
        return { Code: String(Code || ''), Desp: Desp || String(Code) };
    });
}

function subProjectParentCode(item) {
    const v = firstVal(item, ['ProjectMaster_Code', 'projectMaster_Code', 'MasterProjectCode', 'Parent_Code']);
    return v === '' ? 0 : (parseInt(v, 10) || 0);
}

function subProjectDesp(item) {
    return String(firstVal(item, ['SubProjectDesp', 'SubProjectName', 'Desp', 'Name'])).trim();
}

function refreshSubProjectOptions() {
    const pid = parseInt($('#ddlProject').val() || '0', 10) || 0;
    const items = pid === 0
        ? G_SubProjectList
        : G_SubProjectList.filter(function (sp) { return subProjectParentCode(sp) === pid; });
    const mapped = items.map(function (item) {
        const Code = String(firstVal(item, ['SubProjectMaster_Code', 'Code', 'code']) || '');
        return { Code: Code, Desp: subProjectDesp(item) || Code };
    });
    bindSelectList($('#ddlSubProject'), mapped, 'All');
    initSelect2('#ddlSubProject');
}

function loadFilters() {
    const pMm = ExpenseEntryService.GetNestedMarketingManList().then(function (response) {
        G_MarketingManList = mapMarketingManRows(asArray(response));
        bindSelectList($('#ddlMarketingMan'), G_MarketingManList, 'Select');
        initSelect2('#ddlMarketingMan');
        autoSelectLoggedInMarketingMan();
    }).catch(function () {
        toastr.error('Could not load Marketing Man list.');
    });

    const pProj = ExpensesLedgerReportService.GetProjectMasterList().then(function (response) {
        bindSelectList($('#ddlProject'), mapProjectRows(asArray(response)), 'All');
        initSelect2('#ddlProject');
    });

    const pSub = ExpensesLedgerReportService.GetSubProjectMasterList().then(function (response) {
        G_SubProjectList = asArray(response);
        refreshSubProjectOptions();
    });

    return Promise.all([pMm, pProj, pSub]).catch(function () {
        toastr.error('Could not load filter dropdowns.');
    });
}

function autoSelectLoggedInMarketingMan() {
    const userCode = getAuthUserMasterCode();
    let matched = null;
    if (userCode != null) {
        matched = G_MarketingManList.find(function (m) {
            return String(m.UserMaster_Code) === String(userCode);
        });
    }
    if (matched) {
        $('#ddlMarketingMan').val(matched.Code).trigger('change');
        $('#edashWelcomeName').text(matched.Desp);
    } else if (G_MarketingManList.length > 0) {
        $('#ddlMarketingMan').val(G_MarketingManList[0].Code).trigger('change');
        $('#edashWelcomeName').text(G_MarketingManList[0].Desp);
    }
}

function getSelectedMarketingManName() {
    const code = $('#ddlMarketingMan').val();
    const found = G_MarketingManList.find(function (m) { return String(m.Code) === String(code); });
    return found ? found.Desp : '—';
}

function loadDashboard() {
    const mmCode = parseInt($('#ddlMarketingMan').val() || '0', 10);
    const projCode = parseInt($('#ddlProject').val() || '0', 10);
    const subCode = parseInt($('#ddlSubProject').val() || '0', 10);
    const fromIso = $('#txtFromDate').val();
    const toIso = $('#txtToDate').val();

    if (!mmCode) {
        toastr.warning('Please select Marketing Man.');
        return;
    }
    if (!fromIso || !toIso) {
        toastr.warning('Please select date range.');
        return;
    }

    updateDateRangeLabel();
    $('#edashWelcomeName').text(getSelectedMarketingManName());
    setLoading(true);

    ExpenseDashboardService.GetExpenseDashboard(
        convertDateForApi(fromIso),
        convertDateForApi(toIso),
        mmCode,
        projCode,
        subCode
    ).then(function (response) {
        bindDashboard(response);
    }).catch(function (err) {
        console.error('Expense dashboard error:', err);
        var apiMsg = '';
        if (err && err.xhr && err.xhr.responseJSON) {
            apiMsg = err.xhr.responseJSON.Msg || err.xhr.responseJSON.msg || err.xhr.responseJSON.message || '';
        } else if (err && err.xhr && err.xhr.responseText) {
            try {
                var parsed = JSON.parse(err.xhr.responseText);
                apiMsg = parsed.Msg || parsed.msg || parsed.message || '';
            } catch (_) { /* ignore */ }
        }
        toastr.error(apiMsg || 'Could not load dashboard data. Deploy USP_WebAPI_ExpenseDashboard on the ERP database.');
        bindDashboard(null);
    }).finally(function () {
        setLoading(false);
    });
}

function firstRow(list) {
    const arr = asArray(list);
    return arr.length ? arr[0] : null;
}

function bindDashboard(response) {
    const kpi = firstRow(response && (response.KpiSummary || response.kpiSummary)) || {};
    const trend = asArray(response && (response.ExpenseTrend || response.expenseTrend));
    const categories = asArray(response && (response.ExpenseByCategory || response.expenseByCategory));
    const projects = asArray(response && (response.ProjectWise || response.projectWise));
    const projectTotal = firstRow(response && (response.ProjectWiseTotal || response.projectWiseTotal));

    const totalExp = numVal(kpi.TotalExpenses ?? kpi.totalExpenses);
    const welcomeName = kpi.MarketingManName || getSelectedMarketingManName();
    if (welcomeName && welcomeName !== '—') $('#edashWelcomeName').text(welcomeName);

    $('#kpiTotal').text(fmtCurrency(totalExp));
    $('#kpiApproved').text(fmtCurrency(kpi.ApprovedAmount ?? kpi.approvedAmount));
    $('#kpiPaid').text(fmtCurrency(kpi.PaidAmount ?? kpi.paidAmount));
    $('#kpiPending').text(fmtCurrency(kpi.PendingAmount ?? kpi.pendingAmount));
    $('#kpiClaims').text(String(numVal(kpi.PendingClaims ?? kpi.pendingClaims)));
    $('#donutCenterTotal').text(fmtCurrency(totalExp));

    renderTrendChart(trend);
    renderCategoryChart(categories, totalExp);
    renderProjectTable(projects, projectTotal);
}

function destroyChart(ref) {
    if (ref) { try { ref.destroy(); } catch (_) {} }
    return null;
}

function renderTrendChart(rows) {
    const canvas = document.getElementById('chartExpenseTrend');
    if (!canvas || typeof Chart === 'undefined') return;

    const labels = rows.map(function (r) {
        const d = r.ExpenseDate || r.expenseDate;
        if (!d) return '';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return String(d);
        return String(dt.getDate()).padStart(2, '0');
    });
    const data = rows.map(function (r) { return numVal(r.Amount ?? r.amount); });

    chartTrend = destroyChart(chartTrend);
    chartTrend = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expenses',
                data: data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.12)',
                fill: true,
                tension: 0.35,
                pointRadius: 2,
                pointHoverRadius: 5,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            return '₹ ' + numVal(ctx.raw).toLocaleString('en-IN');
                        },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (v) {
                            if (v >= 1000) return (v / 1000) + 'K';
                            return v;
                        },
                    },
                },
            },
        },
    });
}

function renderCategoryChart(rows, totalExp) {
    const canvas = document.getElementById('chartCategory');
    const $legend = $('#categoryLegend');
    $legend.empty();

    if (!canvas || typeof Chart === 'undefined') return;

    const labels = rows.map(function (r) { return r.CategoryName || r.categoryName || 'Others'; });
    const data = rows.map(function (r) { return numVal(r.Amount ?? r.amount); });
    const colors = labels.map(function (_, i) { return CATEGORY_COLORS[i % CATEGORY_COLORS.length]; });

    rows.forEach(function (r, i) {
        const name = r.CategoryName || r.categoryName || 'Others';
        const amt = numVal(r.Amount ?? r.amount);
        const pct = r.Percentage != null ? r.Percentage : (totalExp > 0 ? (amt * 100 / totalExp).toFixed(1) : 0);
        $legend.append(
            '<div class="edash-cat-item">' +
                '<span class="edash-cat-name"><span class="edash-cat-dot" style="background:' + colors[i] + '"></span>' + escHtml(name) + '</span>' +
                '<span class="edash-cat-amt">' + fmtCurrency(amt) + '</span>' +
                '<span class="edash-cat-pct">' + pct + '%</span>' +
            '</div>'
        );
    });

    if (!rows.length) {
        $legend.html('<div class="text-muted small">No category data for selected filters.</div>');
    }

    chartCategory = destroyChart(chartCategory);
    chartCategory = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['No data'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: data.length ? colors : ['#e2e8f0'],
                borderWidth: 2,
                borderColor: '#fff',
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: { legend: { display: false } },
        },
    });
}

function renderProjectTable(rows, totalRow) {
    const $body = $('#tblProjectWiseBody');
    $body.empty();

    if (!rows.length) {
        $body.append('<tr><td colspan="7" class="text-center text-muted py-4">No project data for selected filters.</td></tr>');
        return;
    }

    rows.forEach(function (r) {
        const name = r.ProjectName || r.projectName || '—';
        const subProject = r.SubProjectName || r.subProjectName || r.SubProjectDesp || r.subProjectDesp || '—';
        const total = numVal(r.TotalExpenses ?? r.totalExpenses);
        const approved = numVal(r.Approved ?? r.approved);
        const paid = numVal(r.Paid ?? r.paid);
        const pending = numVal(r.Pending ?? r.pending);
        const pct = numVal(r.PctOfTotal ?? r.pctOfTotal);

        $body.append(
            '<tr>' +
                '<td><div class="edash-proj-name">' + escHtml(name) + '</div></td>' +
                '<td><span class="edash-proj-loc">' + escHtml(subProject) + '</span></td>' +
                '<td class="num">' + fmtCurrencyFull(total) + '</td>' +
                '<td class="num">' + fmtCurrencyFull(approved) + '</td>' +
                '<td class="num">' + fmtCurrencyFull(paid) + '</td>' +
                '<td class="num">' + fmtCurrencyFull(pending) + '</td>' +
                '<td class="num"><div class="edash-pct-bar"><span>' + pct.toFixed(1) + '%</span>' +
                    '<div class="edash-pct-bar-track"><div class="edash-pct-bar-fill" style="width:' + Math.min(pct, 100) + '%"></div></div></div></td>' +
            '</tr>'
        );
    });

    if (totalRow) {
        const t = numVal(totalRow.TotalExpenses ?? totalRow.totalExpenses);
        const totApproved = numVal(totalRow.Approved ?? totalRow.approved);
        const totPaid = numVal(totalRow.Paid ?? totalRow.paid);
        const totPending = numVal(totalRow.Pending ?? totalRow.pending);
        $body.append(
            '<tr class="row-total">' +
                '<td colspan="2"><strong>Total</strong></td>' +
                '<td class="num"><strong>' + fmtCurrencyFull(t) + '</strong></td>' +
                '<td class="num"><strong>' + fmtCurrencyFull(totApproved) + '</strong></td>' +
                '<td class="num"><strong>' + fmtCurrencyFull(totPaid) + '</strong></td>' +
                '<td class="num"><strong>' + fmtCurrencyFull(totPending) + '</strong></td>' +
                '<td class="num"><strong>100%</strong></td>' +
            '</tr>'
        );
    }
}

function escHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function exportProjectTable() {
    $('#tblProjectWise').table2excel({
        exclude: '.no-export',
        name: 'ProjectWiseExpense',
        filename: 'ProjectWiseExpense_' + ($('#txtFromDate').val() || 'export'),
        fileext: '.xls',
    });
}
