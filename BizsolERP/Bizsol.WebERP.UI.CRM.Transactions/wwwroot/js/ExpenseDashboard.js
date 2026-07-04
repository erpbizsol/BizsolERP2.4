import { ExpenseDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseDashboardService.js';
import { ExpensesLedgerReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpensesLedgerReportService.js';

let G_SubProjectList = [];
let G_MarketingManList = [];
let edashFilterPanel = null;
let chartTrend = null;
let chartCategory = null;

const CATEGORY_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#14b8a6', '#eab308', '#ef4444', '#6366f1'];
const EDASH_MM_MAX_RETRIES = 8;
const EDASH_MM_RETRY_DELAY_MS = 400;

$(document).ready(function () {
    $('#ERPHeading').text('Expense Dashboard');
    $('#btnExport').on('click', exportProjectTable);
    MountFilterPanelToBody();
    InitFilterSidePanelControl();
});

function MountFilterPanelToBody() {
    const panel = document.getElementById('edashFilterPanel');
    if (panel && panel.parentElement !== document.body) {
        document.body.appendChild(panel);
    }
}

function InitFilterSidePanelControl() {
    edashFilterPanel = document.getElementById('edashFilterPanel');
    if (!edashFilterPanel) return;

    if (!customElements.get('filter-side-panel-control')) {
        customElements.whenDefined('filter-side-panel-control').then(InitFilterSidePanelControl);
        return;
    }

    edashFilterPanel.setFilters([
        { id: 'ddlMarketingMan', type: 'select', label: 'Marketing Man *', data: [{ Code: '', Desp: 'Select' }] },
        { id: 'ddlProject', type: 'select', label: 'Project', data: [{ Code: '0', Desp: 'All' }] },
        { id: 'ddlSubProject', type: 'select', label: 'Sub Project', data: [{ Code: '0', Desp: 'All' }] },
        { id: 'dateRange', type: 'daterange', label: 'Date Range' },
    ]);

    edashFilterPanel.addEventListener('filtersapplied', function () {
        loadDashboard();
    });

    Promise.all([
        LoadMarketingManDropdownIntoFilter(),
        LoadProjectDropdownIntoFilter(),
        ExpensesLedgerReportService.GetSubProjectMasterList().then(function (response) {
            G_SubProjectList = asArray(response);
            LoadSubProjectDropdownIntoFilter(0);
        }),
    ])
        .then(function () {
            BindProjectChangeInFilter();
            AutoSelectLoggedInMarketingManInFilter();
            return new Promise(function (resolve) {
                setTimeout(function () {
                    SetDefaultDateRangeInFilter();
                    resolve();
                }, 500);
            });
        })
        .then(function () {
            loadDashboard();
        })
        .catch(function () {
            toastr.error('Could not load filter dropdowns.');
            loadDashboard();
        });
}

function SetDefaultDateRangeInFilter() {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const dateRangeEl = edashFilterPanel?.shadowRoot?.getElementById('dateRange');
    if (dateRangeEl && typeof dateRangeEl.setRange === 'function') {
        dateRangeEl.setRange({
            fromDate: fmtIsoDate(first),
            toDate: fmtIsoDate(last),
        });
    }
}

function GetFilterParams() {
    if (!edashFilterPanel) {
        return { marketingManCode: 0, projectCode: 0, subProjectCode: 0, fromDate: '', toDate: '' };
    }
    const f = edashFilterPanel.getFilterValues();
    return {
        marketingManCode: parseInt(f.ddlMarketingMan, 10) || 0,
        projectCode: parseInt(f.ddlProject, 10) || 0,
        subProjectCode: parseInt(f.ddlSubProject, 10) || 0,
        fromDate: f.dateRange?.fromDate || '',
        toDate: f.dateRange?.toDate || '',
    };
}

function SetSelectFilterValue(filterId, code, desp) {
    const hidden = edashFilterPanel?.shadowRoot?.getElementById(filterId + '_value');
    const wrapper = edashFilterPanel?.shadowRoot?.getElementById(filterId);
    if (!hidden || !wrapper) return;
    hidden.value = String(code);
    const labelEl = wrapper.querySelector('.search-select-label');
    if (labelEl) {
        labelEl.textContent = desp || code;
        if (code === '' || code == null) labelEl.classList.add('is-placeholder');
        else labelEl.classList.remove('is-placeholder');
    }
    const listEl = wrapper.querySelector('.search-select-list');
    if (listEl) {
        listEl.querySelectorAll('.search-select-option').forEach(function (opt) {
            opt.classList.toggle('is-selected', String(opt.dataset.value) === String(code));
        });
    }
}

function LoadMarketingManDropdownIntoFilter(attempt) {
    attempt = attempt || 0;

    if (!isAuthKeyReady()) {
        if (attempt < EDASH_MM_MAX_RETRIES) {
            return new Promise(function (resolve) {
                setTimeout(function () {
                    resolve(LoadMarketingManDropdownIntoFilter(attempt + 1));
                }, EDASH_MM_RETRY_DELAY_MS);
            });
        }
        toastr.error('Unable to load Marketing Man list. Please refresh the page.');
        return Promise.reject(new Error('authKey not ready'));
    }

    return ExpensesLedgerReportService.GetNestedMarketingManList()
        .then(function (response) {
            G_MarketingManList = mapMarketingManRows(asArray(response));
            if (!G_MarketingManList.length) {
                if (attempt < EDASH_MM_MAX_RETRIES) {
                    return new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve(LoadMarketingManDropdownIntoFilter(attempt + 1));
                        }, EDASH_MM_RETRY_DELAY_MS);
                    });
                }
                toastr.error('No Marketing Man data found.');
                return;
            }

            const items = [{ Code: '', Desp: 'Select' }].concat(G_MarketingManList);
            edashFilterPanel.updateFilterData('ddlMarketingMan', items);
            setTimeout(function () {
                AutoSelectLoggedInMarketingManInFilter();
            }, 100);
        })
        .catch(function (err) {
            console.error('Marketing Man list error:', err);
            if (attempt < EDASH_MM_MAX_RETRIES) {
                return new Promise(function (resolve) {
                    setTimeout(function () {
                        resolve(LoadMarketingManDropdownIntoFilter(attempt + 1));
                    }, EDASH_MM_RETRY_DELAY_MS);
                });
            }
            toastr.error('Could not load Marketing Man list.');
            return Promise.reject(err);
        });
}

function LoadProjectDropdownIntoFilter() {
    return ExpensesLedgerReportService.GetProjectMasterList()
        .then(function (response) {
            const items = [{ Code: '0', Desp: 'All' }].concat(mapProjectRows(asArray(response)));
            edashFilterPanel.updateFilterData('ddlProject', items);
        });
}

function buildSubProjectItems(projectCode) {
    const pid = parseInt(projectCode, 10) || 0;
    const items = [{ Code: '0', Desp: 'All' }];
    const list = pid === 0
        ? G_SubProjectList
        : G_SubProjectList.filter(function (sp) { return subProjectParentCode(sp) === pid; });
    list.forEach(function (item) {
        const Code = String(firstVal(item, ['SubProjectMaster_Code', 'Code', 'code']) || '');
        items.push({ Code: Code, Desp: subProjectDesp(item) || Code });
    });
    return items;
}

function LoadSubProjectDropdownIntoFilter(projectCode) {
    edashFilterPanel.updateFilterData('ddlSubProject', buildSubProjectItems(projectCode));
    SetSelectFilterValue('ddlSubProject', '0', 'All');
}

function BindProjectChangeInFilter() {
    setTimeout(function () {
        const wrapper = edashFilterPanel?.shadowRoot?.getElementById('ddlProject');
        if (!wrapper) return;
        wrapper.addEventListener('click', function (e) {
            const option = e.target.closest('.search-select-option');
            if (!option) return;
            setTimeout(function () {
                const hidden = edashFilterPanel?.shadowRoot?.getElementById('ddlProject_value');
                const projectCode = parseInt(hidden?.value || '0', 10) || 0;
                LoadSubProjectDropdownIntoFilter(projectCode);
            }, 50);
        });
    }, 200);
}

function AutoSelectLoggedInMarketingManInFilter() {
    const userCode = getAuthUserMasterCode();
    let matched = null;
    if (userCode != null) {
        matched = G_MarketingManList.find(function (m) {
            return String(m.UserMaster_Code) === String(userCode);
        });
    }
    const selected = matched || (G_MarketingManList.length ? G_MarketingManList[0] : null);
    if (selected) {
        SetSelectFilterValue('ddlMarketingMan', selected.Code, selected.Desp);
        $('#edashWelcomeName').text(selected.Desp);
    }
}

function ResetExpenseDashboard() {
    SetDefaultDateRangeInFilter();
    SetSelectFilterValue('ddlProject', '0', 'All');
    LoadSubProjectDropdownIntoFilter(0);
    AutoSelectLoggedInMarketingManInFilter();
    loadDashboard();
}

window.OpenEdashFilterPanel = function () {
    if (edashFilterPanel && typeof edashFilterPanel.open === 'function') {
        edashFilterPanel.open();
    }
};

window.ResetExpenseDashboard = ResetExpenseDashboard;

function fmtIsoDate(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function updateDateRangeLabel() {
    const { fromDate, toDate } = GetFilterParams();
    if (!fromDate || !toDate || fromDate === '0' || toDate === '0') {
        $('#edashDateRangeLabel').text('—');
        $('#projectTableTitle').text('Project Wise Expense');
        return;
    }
    const label = fmtDisplayDate(fromDate) + ' - ' + fmtDisplayDate(toDate);
    $('#edashDateRangeLabel').text(label);
    $('#projectTableTitle').text('Project Wise Expense (' + label + ')');
    $('#chartTrendTitle').text('Expense Trend (' + fmtMonthLabel(fromDate) + ')');
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

function isAuthKeyReady() {
    try {
        const auth = JSON.parse(sessionStorage.getItem('authKey'));
        return !!(auth && auth.UserMaster_Code != null);
    } catch (e) {
        return false;
    }
}

function asArray(response) {
    if (response == null) return [];
    if (Array.isArray(response)) return response;
    const keys = ['data', 'Data', 'result', 'Result', 'items', 'Items', 'value', 'Value', 'rows', 'Rows', 'records', 'Records'];
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

function mapMarketingManRows(rows) {
    return rows
        .map(function (item) {
            if (!item) return null;
            const Code = firstVal(item, [
                'Code', 'code',
                'MarketingManMaster_Code', 'marketingManMaster_Code',
                'EmployeeMaster_Code', 'employeeMaster_Code',
            ]);
            const Desp = String(firstVal(item, [
                'PersonName', 'personName',
                'EmployeeName', 'employeeName',
                'Desp', 'desp', 'Name', 'name',
            ])).trim();
            const userCode = firstVal(item, ['Usermaster_Code', 'UserMaster_Code', 'userMaster_Code']);
            if (!Code || !Desp) return null;
            return { Code: String(Code), Desp: Desp, UserMaster_Code: userCode };
        })
        .filter(Boolean);
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

function getSelectedMarketingManName() {
    const code = GetFilterParams().marketingManCode;
    const found = G_MarketingManList.find(function (m) { return String(m.Code) === String(code); });
    return found ? found.Desp : '—';
}

function loadDashboard() {
    const { marketingManCode, projectCode, subProjectCode, fromDate, toDate } = GetFilterParams();

    if (!marketingManCode) {
        toastr.warning('Please select Marketing Man.');
        return;
    }
    if (!fromDate || !toDate || fromDate === '0' || toDate === '0') {
        toastr.warning('Please select date range.');
        return;
    }
    if (fromDate > toDate) {
        toastr.warning('From Date cannot be greater than To Date.');
        return;
    }

    updateDateRangeLabel();
    $('#edashWelcomeName').text(getSelectedMarketingManName());
    setLoading(true);

    ExpenseDashboardService.GetExpenseDashboard(
        convertDateForApi(fromDate),
        convertDateForApi(toDate),
        marketingManCode,
        projectCode,
        subProjectCode
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
    const { fromDate } = GetFilterParams();
    $('#tblProjectWise').table2excel({
        exclude: '.no-export',
        name: 'ProjectWiseExpense',
        filename: 'ProjectWiseExpense_' + (fromDate || 'export'),
        fileext: '.xls',
    });
}
