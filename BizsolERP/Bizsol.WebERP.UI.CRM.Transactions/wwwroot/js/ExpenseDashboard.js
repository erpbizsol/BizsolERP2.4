import { ExpenseDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseDashboardService.js';
import { ExpensesLedgerReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpensesLedgerReportService.js';
import { ProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectMasterService.js';
import { SubProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SubProjectMasterService.js';

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
    bindChartResize();
});

function bindChartResize() {
    let resizeTimer = null;
    $(window).on('resize.edash', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (chartTrend) { try { chartTrend.resize(); } catch (_) {} }
            if (chartCategory) { try { chartCategory.resize(); } catch (_) {} }
        }, 180);
    });
}

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
        LoadSubProjectMasterData(),
    ])
        .then(function () {
            LoadSubProjectDropdownIntoFilter(0);
            AutoSelectLoggedInMarketingManInFilter();
            BindProjectChangeInFilter();
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
    return ProjectMasterService.GetProjectList()
        .then(function (response) {
            const raw = Array.isArray(response) ? response : (asArray(response));
            const items = [{ Code: '0', Desp: 'All' }].concat(
                raw.map(function (p) {
                    return {
                        Code: String(p.Code || 0),
                        Desp: (p.ProjectDesp || p.ProjectName || '').trim() || ('Project ' + (p.Code || 0)),
                    };
                })
            );
            edashFilterPanel.updateFilterData('ddlProject', items);
        })
        .catch(function () {
            return ExpensesLedgerReportService.GetProjectMasterList()
                .then(function (response) {
                    const items = [{ Code: '0', Desp: 'All' }].concat(mapProjectRows(asArray(response)));
                    edashFilterPanel.updateFilterData('ddlProject', items);
                });
        });
}

function LoadSubProjectMasterData() {
    return SubProjectMasterService.GetSubProjectList()
        .then(function (response) {
            G_SubProjectList = normalizeSubProjectList(response);
        })
        .catch(function () {
            return ExpensesLedgerReportService.GetSubProjectMasterList()
                .then(function (response) {
                    G_SubProjectList = normalizeSubProjectList(response);
                });
        });
}

function normalizeSubProjectList(response) {
    return asArray(response);
}

function subProjectRowCode(item) {
    return String(firstVal(item, ['Code', 'SubProjectMaster_Code', 'subProjectMaster_Code', 'code']) || '');
}

function subProjectParentCode(item) {
    return String(
        item.ProjectMaster_Code
        ?? item.MasterProjectCode
        ?? item.projectMaster_Code
        ?? item.masterProjectCode
        ?? 0
    );
}

function subProjectDesp(item) {
    return String(
        firstVal(item, ['SubProjectDesp', 'SubProjectName', 'subProjectDesp', 'subProjectName', 'Desp', 'Name'])
    ).trim();
}

function buildSubProjectItems(projectCode) {
    const pid = String(parseInt(projectCode, 10) || 0);
    if (pid === '0') {
        return [{ Code: '0', Desp: 'All' }];
    }

    const items = [{ Code: '0', Desp: 'All' }];
    G_SubProjectList
        .filter(function (sp) { return subProjectParentCode(sp) === pid; })
        .forEach(function (item) {
            const Code = subProjectRowCode(item);
            if (Code) {
                items.push({ Code: Code, Desp: subProjectDesp(item) || Code });
            }
        });
    return items;
}

function LoadSubProjectDropdownIntoFilter(projectCode) {
    const pid = parseInt(projectCode, 10) || 0;
    const items = buildSubProjectItems(pid);
    edashFilterPanel.updateFilterData('ddlSubProject', items);
    SetSelectFilterValue('ddlSubProject', '0', 'All');
    return Promise.resolve();
}

function onProjectFilterChanged(projectCode) {
    LoadSubProjectDropdownIntoFilter(projectCode);
}

function BindProjectChangeInFilter() {
    const shadow = edashFilterPanel?.shadowRoot;
    if (!shadow) return;

    // Disconnect any previous observer before re-binding
    if (edashFilterPanel._edashProjectObserver) {
        edashFilterPanel._edashProjectObserver.disconnect();
        edashFilterPanel._edashProjectObserver = null;
    }

    function attachObserver() {
        const wrapper = shadow.getElementById('ddlProject');
        if (!wrapper) {
            setTimeout(attachObserver, 300);
            return;
        }
        const trigger = wrapper.querySelector('.search-select-trigger');
        if (!trigger) {
            setTimeout(attachObserver, 300);
            return;
        }

        // Watch aria-expanded: true→false means the dropdown just closed (user picked an option or clicked away)
        const observer = new MutationObserver(function (mutations) {
            for (let i = 0; i < mutations.length; i++) {
                const m = mutations[i];
                if (m.attributeName === 'aria-expanded' &&
                    trigger.getAttribute('aria-expanded') === 'false') {
                    const hidden = shadow.getElementById('ddlProject_value');
                    const code = parseInt((hidden && hidden.value) || '0', 10) || 0;
                    onProjectFilterChanged(code);
                    return;
                }
            }
        });

        observer.observe(trigger, { attributes: true, attributeFilter: ['aria-expanded'] });
        edashFilterPanel._edashProjectObserver = observer;
    }

    attachObserver();
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
    $('#chartTrendTitle').text('Expense Trend (' + label + ')');
}

function fmtDisplayDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return String(d.getDate()).padStart(2, '0') + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
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
    $('#donutCenterTotal').text(fmtCurrency(totalExp));

    renderTrendChart(trend);
    renderCategoryChart(categories, totalExp);
    renderProjectTable(projects, projectTotal);
}

function destroyChart(ref) {
    if (ref) { try { ref.destroy(); } catch (_) {} }
    return null;
}

function parseExpenseDate(raw) {
    if (!raw) return null;
    if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
    const s = String(raw).trim();
    let dt = new Date(s);
    if (!isNaN(dt.getTime())) return dt;
    const m = s.match(/^(\d{1,2})[-\/](\w{3})[-\/](\d{4})$/i);
    if (m) {
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const mi = months.indexOf(m[2].toLowerCase());
        if (mi >= 0) return new Date(parseInt(m[3], 10), mi, parseInt(m[1], 10));
    }
    return null;
}

function addDays(date, n) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + n);
    return d;
}

function monthKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function fmtTrendDayLabel(d) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return String(d.getDate()).padStart(2, '0') + ' ' + months[d.getMonth()];
}

function fmtTrendMonthLabel(d) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getFullYear();
}

function buildTrendSeries(rows, fromIso, toIso) {
    const amountByKey = {};
    asArray(rows).forEach(function (r) {
        const dt = parseExpenseDate(r.ExpenseDate || r.expenseDate);
        if (!dt) return;
        const dayKey = fmtIsoDate(dt);
        amountByKey[dayKey] = (amountByKey[dayKey] || 0) + numVal(r.Amount ?? r.amount);
    });

    const start = fromIso ? new Date(fromIso + 'T00:00:00') : null;
    const end = toIso ? new Date(toIso + 'T00:00:00') : null;
    const labels = [];
    const data = [];

    if (start && end && !isNaN(start) && !isNaN(end) && start <= end) {
        const daySpan = Math.round((end - start) / 86400000) + 1;
        if (daySpan > 62) {
            const monthTotals = {};
            for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
                const mk = monthKey(d);
                const dk = fmtIsoDate(d);
                monthTotals[mk] = (monthTotals[mk] || 0) + (amountByKey[dk] || 0);
            }
            const seen = new Set();
            for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
                const mk = monthKey(d);
                if (seen.has(mk)) continue;
                seen.add(mk);
                labels.push(fmtTrendMonthLabel(d));
                data.push(monthTotals[mk] || 0);
            }
        } else {
            for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
                const dk = fmtIsoDate(d);
                labels.push(daySpan > 31 ? fmtTrendDayLabel(d) + ' ' + d.getFullYear() : fmtTrendDayLabel(d));
                data.push(amountByKey[dk] || 0);
            }
        }
        return { labels: labels, data: data };
    }

    const sortedKeys = Object.keys(amountByKey).sort();
    sortedKeys.forEach(function (key) {
        const dt = new Date(key + 'T00:00:00');
        labels.push(isNaN(dt.getTime()) ? key : fmtTrendDayLabel(dt) + ' ' + dt.getFullYear());
        data.push(amountByKey[key]);
    });
    return { labels: labels, data: data };
}

function isMobileView() {
    return window.innerWidth <= 767;
}

function renderTrendChart(rows) {
    const canvas = document.getElementById('chartExpenseTrend');
    if (!canvas || typeof Chart === 'undefined') return;

    const { fromDate, toDate } = GetFilterParams();
    const series = buildTrendSeries(rows, fromDate, toDate);
    const labels = series.labels;
    const data = series.data;
    const mobile = isMobileView();
    const showPoints = labels.length <= (mobile ? 15 : 31);
    const trendArea = canvas.closest('.edash-chart-area--trend');

    if (trendArea) {
        if (labels.length > (mobile ? 6 : 12)) {
            trendArea.style.minWidth = Math.max(mobile ? 300 : 480, labels.length * (mobile ? 34 : 26)) + 'px';
        } else {
            trendArea.style.minWidth = mobile ? '100%' : '';
        }
    }

    chartTrend = destroyChart(chartTrend);
    chartTrend = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expenses',
                data: data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.14)',
                fill: true,
                tension: 0.35,
                pointRadius: showPoints ? (mobile ? 2 : 3) : 0,
                pointHoverRadius: mobile ? 5 : 6,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                borderWidth: mobile ? 2 : 2.5,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: mobile ? 8 : 12,
                    titleFont: { size: mobile ? 11 : 12 },
                    bodyFont: { size: mobile ? 11 : 12 },
                    callbacks: {
                        title: function (items) {
                            return items.length ? items[0].label : '';
                        },
                        label: function (ctx) {
                            return ' ₹ ' + numVal(ctx.raw).toLocaleString('en-IN');
                        },
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        maxRotation: mobile ? 60 : 45,
                        minRotation: mobile ? 45 : 0,
                        autoSkip: true,
                        maxTicksLimit: mobile ? 5 : (labels.length > 20 ? 10 : labels.length),
                        font: { size: mobile ? 9 : 11 },
                        color: '#64748b',
                    },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.2)' },
                    ticks: {
                        color: '#64748b',
                        font: { size: mobile ? 9 : 11 },
                        callback: function (v) {
                            if (v >= 100000) return (v / 100000).toFixed(1) + 'L';
                            if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
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
    const mobile = isMobileView();
    chartCategory = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['No data'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: data.length ? colors : ['#e2e8f0'],
                borderWidth: mobile ? 1 : 2,
                borderColor: '#fff',
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: mobile ? '62%' : '68%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: mobile ? 8 : 10,
                    callbacks: {
                        label: function (ctx) {
                            const val = numVal(ctx.raw);
                            const pct = totalExp > 0 ? ((val * 100) / totalExp).toFixed(1) : '0';
                            return ' ₹ ' + val.toLocaleString('en-IN') + ' (' + pct + '%)';
                        },
                    },
                },
            },
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
