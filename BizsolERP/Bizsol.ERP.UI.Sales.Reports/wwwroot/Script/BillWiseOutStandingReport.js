import { BillWiseOutStandingReportService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/BillWiseOutStandingReportService.js';
import { MillWiseProductionReport } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/_MillWiseProductionReportService.js';

/** @type {Array<object>|null} */
let lastReportRows = null;

/** @type {any[]} */
const dashboardChartInstances = [];

/**
 * Cached GroupTypeMaster list loaded from API.
 * Each item: { Code: number, GroupTypeDesp: string, CodeinAccountMaster: number }
 * @type {Array<object>}
 */
let groupTypeMasterList = [];

function toNumber(value) {
    if (value == null || value === '') return 0;
    const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
}

/**
 * For matching API keys like DelayDays, delayDays, Delay_Days to dashboard aliases.
 * @param {string} s
 */
function normalizeFieldName(s) {
    return String(s || '')
        .replace(/\s+/g, '')
        .replace(/_/g, '')
        .toLowerCase();
}

/**
 * Read numeric column from row; API may use spaced labels or PascalCase/camelCase.
 * @param {object} row
 * @param {string[]} aliases
 */
function rowNumberFromAliases(row, aliases) {
    if (!row || typeof row !== 'object') return 0;
    for (let i = 0; i < aliases.length; i++) {
        const k = aliases[i];
        if (Object.prototype.hasOwnProperty.call(row, k) && row[k] != null && row[k] !== '') {
            return toNumber(row[k]);
        }
    }
    const want = new Set(aliases.map(normalizeFieldName));
    const keys = Object.keys(row);
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (want.has(normalizeFieldName(k)) && row[k] != null && row[k] !== '') {
            return toNumber(row[k]);
        }
    }
    return 0;
}

/**
 * Net outstanding for one API row (bill line).
 * @param {object} row
 * @returns {number}
 */
function rowNetOutstanding(row) {
    const amt = rowNumberFromAliases(row, ['Amount', 'amount', 'Amt', 'amt']);
    const adj = rowNumberFromAliases(row, [
        'Amount Adjusted',
        'AmountAdjusted',
        'amountAdjusted',
        'Amount_Adjusted',
        'AmtAdjusted',
    ]);
    return amt - adj;
}

function formatInr(n) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));
}

/**
 * Compact Indian-system label: 22.9Cr / 34.7L / 5.2K / 678
 * Used for chart axis ticks and data-labels so they don't overflow on mobile.
 * @param {number} n
 * @returns {string}
 */
function formatShortInr(n) {
    const abs = Math.abs(n);
    if (abs >= 1e7) return (n / 1e7).toFixed(1).replace(/\.0$/, '') + 'Cr';
    if (abs >= 1e5) return (n / 1e5).toFixed(1).replace(/\.0$/, '') + 'L';
    if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(Math.round(n));
}

/**
 * @param {number} delayDays
 * @returns {string}
 */
function delayDaysBucketLabel(delayDays) {
    const d = Math.floor(toNumber(delayDays));
    if (d <= 0) return 'No delay (≤0)';
    if (d <= 30) return '1–30 days';
    if (d <= 60) return '31–60 days';
    if (d <= 90) return '61–90 days';
    if (d <= 120) return '91–120 days';
    return '121+ days';
}

function destroyDashboardCharts() {
    while (dashboardChartInstances.length) {
        const c = dashboardChartInstances.pop();
        try {
            c.destroy();
        } catch {
            /* ignore */
        }
    }
}

function setDashboardSectionVisible(visible) {
    const el = document.getElementById('billWiseDashboardSection');
    if (!el) return;
    el.classList.toggle('d-none', !visible);
}

function renderBillWiseDashboard(rows) {
    destroyDashboardCharts();

    if (!rows.length) {
        setDashboardSectionVisible(false);
        return;
    }

    setDashboardSectionVisible(true);

    let totalOutstanding = 0;
    let sumDelay = 0;
    const bucketOrder = ['No delay (≤0)', '1–30 days', '31–60 days', '61–90 days', '91–120 days', '121+ days'];
    /** @type {Record<string, number>} */
    const bucketOutstanding = {};
    bucketOrder.forEach((b) => {
        bucketOutstanding[b] = 0;
    });
    /** @type {Record<string, number>} */
    const partyOutstanding = {};
    /** @type {Record<string, number>} */
    const salesPersonOutstanding = {};
    /** @type {Record<string, number>} monthly outstanding keyed "YYYY-MM" */
    const monthlyOutstanding = {};
    /** @type {Record<string, {billed: number, collected: number}>} */
    const partyCollection = {};
    /** @type {Record<string, number>} sum of (DelayDays - CreditDays) where breach > 0 */
    const partyCreditBreach = {};
    let overdueOutstandingAmount = 0;
    let totalBilled = 0;
    let totalCollected = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const amt = rowNumberFromAliases(row, ['Amount', 'amount', 'Amt', 'amt']);
        const adj = rowNumberFromAliases(row, [
            'Amount Adjusted',
            'AmountAdjusted',
            'amountAdjusted',
            'Amount_Adjusted',
            'AmtAdjusted',
        ]);
        const net = amt - adj;
        totalOutstanding += net;
        totalBilled += amt;
        totalCollected += adj;

        const dd = Math.floor(
            rowNumberFromAliases(row, ['Delay Days', 'DelayDays', 'delayDays', 'Delay_Days', 'DelayDay'])
        );
        sumDelay += dd;
        if (dd > 0) {
            overdueOutstandingAmount += net;
        }
        const bucket = delayDaysBucketLabel(dd);
        if (bucketOutstanding[bucket] != null) {
            bucketOutstanding[bucket] += net;
        }

        const partyRaw = row['Client Name'] != null ? row['Client Name'] :
                         row['Vendor Name'] != null ? row['Vendor Name'] :
                         row['Vendor/Client'];
        const party =
            partyRaw != null && String(partyRaw).trim() !== '' ? String(partyRaw).trim() : '(No party)';
        partyOutstanding[party] = (partyOutstanding[party] || 0) + net;

        if (!partyCollection[party]) partyCollection[party] = { billed: 0, collected: 0 };
        partyCollection[party].billed += amt;
        partyCollection[party].collected += adj;

        const creditDays = Math.floor(
            rowNumberFromAliases(row, ['Credit Days', 'CreditDays', 'creditDays', 'Credit_Days'])
        );
        const breach = dd - creditDays;
        if (breach > 0) {
            partyCreditBreach[party] = (partyCreditBreach[party] || 0) + breach;
        }

        const spRaw = row['Person Name'];
        const sp =
            spRaw != null && String(spRaw).trim() !== '' ? String(spRaw).trim() : '(No salesperson)';
        salesPersonOutstanding[sp] = (salesPersonOutstanding[sp] || 0) + net;

        const dateStr = row['Bill Date'] || row['Entry Date'];
        if (dateStr) {
            try {
                const d = new Date(dateStr);
                if (!isNaN(d.getTime())) {
                    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                    monthlyOutstanding[key] = (monthlyOutstanding[key] || 0) + net;
                }
            } catch {
                /* ignore bad dates */
            }
        }
    }

    const avgDelay = rows.length ? sumDelay / rows.length : 0;

    const kpiTot = document.getElementById('kpiTotalOutstanding');
    const kpiAvg = document.getElementById('kpiAvgDelay');
    const kpiOverdue = document.getElementById('kpiOverdueOutstanding');
    if (kpiTot) kpiTot.textContent = formatInr(totalOutstanding);
    if (kpiAvg) kpiAvg.textContent = avgDelay.toFixed(1);
    if (kpiOverdue) kpiOverdue.textContent = formatInr(overdueOutstandingAmount);

    const ChartCtor = globalThis.Chart ?? null;
    if (!ChartCtor) {
        return;
    }

    const DL = globalThis.ChartDataLabels ?? null;
    const dlPlugins = DL ? [DL] : [];

    const isMobile = window.innerWidth < 576;
    const dlFontSize = isMobile ? 9 : 10;
    const yAxisTickFmt = { callback: function (v) { return formatShortInr(v); } };

    /** Shared label style for ₹ amounts — compact on all screen sizes */
    const amtDatalabels = {
        display: true,
        anchor: 'end',
        align: 'end',
        offset: isMobile ? 3 : 4,
        formatter: function (value) { return '₹ ' + formatShortInr(value); },
        font: { size: dlFontSize, weight: '700' },
        color: '#1e293b',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderColor: '#dde4f5',
        borderWidth: 1,
        borderRadius: 4,
        padding: { top: 2, bottom: 2, left: isMobile ? 3 : 5, right: isMobile ? 3 : 5 },
        clamp: true,
    };

    const bucketLabels = bucketOrder;
    const bucketValues = bucketOrder.map((b) => Math.max(0, bucketOutstanding[b] || 0));
    const bucketColors = ['#198754', '#20c997', '#ffc107', '#fd7e14', '#dc3545', '#6f42c1'];

    const canvasBuckets = document.getElementById('chartBillWiseDelayBuckets');
    const canvasParties = document.getElementById('chartBillWiseTopParties');
    const canvasSalesPerson = document.getElementById('chartBillWiseSalesPerson');

    const commonTooltip = {
        callbacks: {
            label(ctx) {
                const v = ctx.raw;
                const num = typeof v === 'number' ? v : parseFloat(v);
                return ` ₹ ${formatInr(Number.isFinite(num) ? num : 0)}`;
            },
        },
    };

    /* ── Delay Buckets (vertical bar) ── */
    if (canvasBuckets) {
        const chartDelay = new ChartCtor(canvasBuckets, {
            type: 'bar',
            plugins: dlPlugins,
            data: {
                labels: bucketLabels,
                datasets: [{
                    label: 'Net outstanding',
                    data: bucketValues,
                    backgroundColor: bucketColors,
                    borderWidth: 0,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 30 } },
                plugins: {
                    legend: { display: false },
                    tooltip: commonTooltip,
                    datalabels: Object.assign({}, amtDatalabels, { align: 'top', anchor: 'end' }),
                },
                scales: {
                    x: { ticks: { maxRotation: 45, minRotation: 0, font: { size: dlFontSize } } },
                    y: { beginAtZero: true, ticks: Object.assign({ font: { size: dlFontSize } }, yAxisTickFmt) },
                },
            },
        });
        dashboardChartInstances.push(chartDelay);
    }

    /* ── Top 10 Parties (horizontal bar) ── */
    const partyEntries = Object.entries(partyOutstanding)
        .filter(([, v]) => v !== 0)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 10);
    const partyFullNames = partyEntries.map(([name]) => name);
    const partyLabels = partyEntries.map(([name]) => (name.length > 28 ? `${name.slice(0, 26)}…` : name));
    const partyValues = partyEntries.map(([, v]) => v);

    if (canvasParties && partyLabels.length) {
        const partyTooltip = {
            callbacks: {
                title(items) {
                    const idx = items[0]?.dataIndex;
                    return idx != null ? (partyFullNames[idx] || partyLabels[idx]) : '';
                },
                label(ctx) {
                    const v = ctx.raw;
                    const num = typeof v === 'number' ? v : parseFloat(v);
                    return ` ₹ ${formatInr(Number.isFinite(num) ? num : 0)}`;
                },
            },
        };
        const chartParties = new ChartCtor(canvasParties, {
            type: 'bar',
            plugins: dlPlugins,
            data: {
                labels: partyLabels,
                datasets: [{
                    label: 'Net outstanding',
                    data: partyValues,
                    backgroundColor: '#0d6efd',
                    borderWidth: 0,
                    borderRadius: 3,
                }],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { right: isMobile ? 70 : 90 } },
                plugins: {
                    legend: { display: false },
                    tooltip: partyTooltip,
                    datalabels: amtDatalabels,
                },
                scales: {
                    x: { beginAtZero: true, ticks: Object.assign({ font: { size: dlFontSize } }, yAxisTickFmt) },
                    y: {
                        ticks: { font: { size: isMobile ? 9 : 11 }, crossAlign: 'far' },
                        afterFit(scale) { scale.width = isMobile ? 130 : 210; },
                    },
                },
            },
        });
        dashboardChartInstances.push(chartParties);
    } else if (canvasParties) {
        const ctx = canvasParties.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasParties.width, canvasParties.height);
    }

    /* ── Top 10 Sales Persons (horizontal bar) ── */
    const spEntries = Object.entries(salesPersonOutstanding)
        .filter(([, v]) => v !== 0)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 10);
    const spFullNames = spEntries.map(([name]) => name);
    const spLabels = spEntries.map(([name]) => (name.length > 28 ? `${name.slice(0, 26)}…` : name));
    const spValues = spEntries.map(([, v]) => v);

    if (canvasSalesPerson && spLabels.length) {
        const spTooltip = {
            callbacks: {
                title(items) {
                    const idx = items[0]?.dataIndex;
                    return idx != null ? (spFullNames[idx] || spLabels[idx]) : '';
                },
                label(ctx) {
                    const v = ctx.raw;
                    const num = typeof v === 'number' ? v : parseFloat(v);
                    return ` ₹ ${formatInr(Number.isFinite(num) ? num : 0)}`;
                },
            },
        };
        const chartSp = new ChartCtor(canvasSalesPerson, {
            type: 'bar',
            plugins: dlPlugins,
            data: {
                labels: spLabels,
                datasets: [{
                    label: 'Net outstanding',
                    data: spValues,
                    backgroundColor: '#6610f2',
                    borderWidth: 0,
                    borderRadius: 3,
                }],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { right: isMobile ? 70 : 90 } },
                plugins: {
                    legend: { display: false },
                    tooltip: spTooltip,
                    datalabels: amtDatalabels,
                },
                scales: {
                    x: { beginAtZero: true, ticks: Object.assign({ font: { size: dlFontSize } }, yAxisTickFmt) },
                    y: {
                        ticks: { font: { size: isMobile ? 9 : 11 }, crossAlign: 'far' },
                        afterFit(scale) { scale.width = isMobile ? 130 : 210; },
                    },
                },
            },
        });
        dashboardChartInstances.push(chartSp);
    } else if (canvasSalesPerson) {
        const ctxSp = canvasSalesPerson.getContext('2d');
        if (ctxSp) ctxSp.clearRect(0, 0, canvasSalesPerson.width, canvasSalesPerson.height);
    }

    /* ── Monthly Trend (line) ── */
    const canvasMonthly = document.getElementById('chartBillWiseMonthlyTrend');
    const monthlyKeys = Object.keys(monthlyOutstanding).sort();
    const monthlyLabels = monthlyKeys.map(function (k) {
        const parts = k.split('-');
        const yr = parts[0];
        const mo = parseInt(parts[1], 10);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return (monthNames[mo - 1] || mo) + ' ' + yr;
    });
    const monthlyValues = monthlyKeys.map(function (k) { return monthlyOutstanding[k]; });

    if (canvasMonthly && monthlyLabels.length) {
        const n = monthlyValues.length;
        const maxVal = Math.max(...monthlyValues);
        const maxIdx = monthlyValues.indexOf(maxVal);
        /* Show label only for: first, last, max, and every Nth when many points */
        const labelStep = n > 12 ? Math.ceil(n / 6) : (n > 8 ? 2 : 1);
        const monthlyDatalabels = Object.assign({}, amtDatalabels, {
            align: 'top',
            anchor: 'end',
            color: '#3d5cce',
            borderColor: '#dde4f5',
            font: { size: isMobile ? 8 : dlFontSize, weight: '700' },
            display: function (ctx) {
                const i = ctx.dataIndex;
                if (i === 0 || i === n - 1 || i === maxIdx) return true;
                return i % labelStep === 0;
            },
        });

        const chartMonthly = new ChartCtor(canvasMonthly, {
            type: 'line',
            plugins: dlPlugins,
            data: {
                labels: monthlyLabels,
                datasets: [{
                    label: 'Net outstanding',
                    data: monthlyValues,
                    borderColor: '#3d5cce',
                    backgroundColor: 'rgba(61, 92, 206, 0.08)',
                    borderWidth: 2,
                    pointBackgroundColor: '#3d5cce',
                    pointRadius: isMobile ? 3 : 4,
                    fill: true,
                    tension: 0.35,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 30, right: isMobile ? 8 : 12 } },
                plugins: {
                    legend: { display: false },
                    tooltip: commonTooltip,
                    datalabels: monthlyDatalabels,
                },
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0,
                            font: { size: isMobile ? 8 : 10 },
                            maxTicksLimit: isMobile ? 6 : 12,
                        },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: Object.assign({ font: { size: isMobile ? 8 : 10 } }, yAxisTickFmt),
                    },
                },
            },
        });
        dashboardChartInstances.push(chartMonthly);
    }

    /* ── Collection Efficiency — Billed vs Collected (top 10 by billed) ── */
    const canvasColEff = document.getElementById('chartBillWiseCollectionEff');
    const colEffEntries = Object.entries(partyCollection)
        .sort(function (a, b) { return b[1].billed - a[1].billed; })
        .slice(0, 10);
    const colEffLabels = colEffEntries.map(function (e) {
        const n = e[0];
        return n.length > 28 ? n.slice(0, 26) + '…' : n;
    });
    const colEffBilled    = colEffEntries.map(function (e) { return e[1].billed; });
    const colEffCollected = colEffEntries.map(function (e) { return e[1].collected; });

    if (canvasColEff && colEffLabels.length) {
        const amtTooltip = {
            callbacks: {
                label: function (ctx) {
                    return ' ' + ctx.dataset.label + ': ₹ ' + formatInr(ctx.raw);
                },
            },
        };
        const chartColEff = new ChartCtor(canvasColEff, {
            type: 'bar',
            plugins: dlPlugins,
            data: {
                labels: colEffLabels,
                datasets: [
                    { label: 'Billed',    data: colEffBilled,    backgroundColor: '#3d5cce', borderWidth: 0 },
                    { label: 'Collected', data: colEffCollected, backgroundColor: '#22c55e', borderWidth: 0 },
                ],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { right: isMobile ? 70 : 90 } },
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12, font: { size: dlFontSize } } },
                    tooltip: amtTooltip,
                    datalabels: amtDatalabels,
                },
                scales: {
                    x: { beginAtZero: true, ticks: Object.assign({ font: { size: dlFontSize } }, yAxisTickFmt) },
                    y: {
                        ticks: { font: { size: isMobile ? 9 : 11 }, crossAlign: 'far' },
                        afterFit(scale) { scale.width = isMobile ? 130 : 210; },
                    },
                },
            },
        });
        dashboardChartInstances.push(chartColEff);
    }

    /* ── Credit Breach — top 10 parties by sum of excess delay days ── */
    const canvasBreach = document.getElementById('chartBillWiseCreditBreach');
    const breachEntries = Object.entries(partyCreditBreach)
        .sort(function (a, b) { return b[1] - a[1]; })
        .slice(0, 10);
    const breachLabels = breachEntries.map(function (e) {
        const n = e[0];
        return n.length > 28 ? n.slice(0, 26) + '…' : n;
    });
    const breachValues = breachEntries.map(function (e) { return e[1]; });

    if (canvasBreach && breachLabels.length) {
        const daysTooltip = {
            callbacks: {
                label: function (ctx) { return ' Excess delay: ' + ctx.raw + ' days'; },
            },
        };
        const chartBreach = new ChartCtor(canvasBreach, {
            type: 'bar',
            plugins: dlPlugins,
            data: {
                labels: breachLabels,
                datasets: [{
                    label: 'Excess delay (days)',
                    data: breachValues,
                    backgroundColor: '#ef4444',
                    borderWidth: 0,
                }],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { right: isMobile ? 52 : 70 } },
                plugins: {
                    legend: { display: false },
                    tooltip: daysTooltip,
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'end',
                        offset: isMobile ? 3 : 4,
                        formatter: function (value) { return value + 'd'; },
                        font: { size: dlFontSize, weight: '700' },
                        color: '#ef4444',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        borderColor: '#fecaca',
                        borderWidth: 1,
                        borderRadius: 4,
                        padding: { top: 2, bottom: 2, left: isMobile ? 3 : 5, right: isMobile ? 3 : 5 },
                        clamp: true,
                    },
                },
                scales: {
                    x: { beginAtZero: true, ticks: { font: { size: dlFontSize } } },
                    y: {
                        ticks: { font: { size: isMobile ? 9 : 11 }, crossAlign: 'far' },
                        afterFit(scale) { scale.width = isMobile ? 130 : 210; },
                    },
                },
            },
        });
        dashboardChartInstances.push(chartBreach);
    }
}

function clearDashboardUi() {
    destroyDashboardCharts();
    setDashboardSectionVisible(false);
    ['kpiTotalOutstanding', 'kpiAvgDelay', 'kpiOverdueOutstanding'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });
}

function bindSelectList(element, list, firstItem) {
    let html = '';
    if (firstItem === 'FirstItemAll') {
        html = '<option value="All">All</option>';
    } else if (firstItem === 'FirstItemSelected') {
        html = '';
    } else {
        html = '<option value="0"></option>';
    }
    for (let i = 0; i < list.length; i++) {
        const val = list[i];
        html += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    }
    element.innerHTML = html;
}

function attachSelect2Multiple($select, placeholder) {
    $select.select2({
        width: '100%',
        closeOnSelect: false,
        placeholder: placeholder || 'All',
        allowClear: true,
        matcher: function (params, data) {
            if ($.trim(params.term) === '') {
                return data;
            }
            if (data.text.toLowerCase().includes(params.term.toLowerCase())) {
                return data;
            }
            return null;
        },
    });
}

function normalizeListResponse(response) {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    const keys = ['Data', 'data', 'Items', 'items'];
    for (let k = 0; k < keys.length; k++) {
        const v = response[keys[k]];
        if (v != null && Array.isArray(v)) return v;
    }
    return [];
}

function selectedDropdownCode(selectId) {
    const el = document.getElementById(selectId);
    if (!el) return 0;
    const v = el.value;
    if (v === '' || v == null || v === 'All') return 0;
    const n = parseInt(String(v).trim(), 10);
    return Number.isFinite(n) ? n : 0;
}

function multiSelectCsvForApi(selectId) {
    const vals = $(document.getElementById(selectId)).val() || [];
    // empty selection = no filter (API returns all)
    if (!vals.length) return '';
    return vals.join(',');
}

function marketingManFilterCodeForApi() {
    return multiSelectCsvForApi('ddlBillWiseMarketingMan');
}

function accountFilterCodeForApi() {
    return multiSelectCsvForApi('ddlBillWiseAccount');
}

/**
 * Returns the selected GroupTypeMaster_Code from the dynamic toggle.
 * Falls back to the first item in groupTypeMasterList if nothing is checked,
 * or to 0 if the list has not loaded yet.
 * @returns {string}
 */
function debtorCreditorFilterForApi() {
    const sel = document.querySelector('#bill-wise-outstanding-report input[name="billWiseDrCr"]:checked');
    if (sel) return String(sel.value || '').trim();
    if (groupTypeMasterList.length) return String(groupTypeMasterList[0].Code);
    return '0';
}

/**
 * Returns true when the currently-selected GroupTypeMaster item has a description
 * that refers to Creditors (case-insensitive), so we know to use "Client Name".
 * @param {string} code  – the GroupTypeMaster_Code string
 * @returns {boolean}
 */
function isCreditorCode(code) {
    const item = groupTypeMasterList.find((x) => String(x.Code) === String(code));
    if (!item) return false;
    return String(item.GroupTypeDesp || '').toLowerCase().includes('credit');
}

/**
 * Remaps the party-name column in each row based on the selected GroupTypeMaster_Code.
 *   Creditor code → uses "Client Name" / "ClientName" field
 *   Debtor code   → uses "Vendor Name" / "VendorName"  field
 * The result row always exposes the value under the appropriate key so the
 * existing grid + dashboard code works without further changes.
 * If neither dedicated field exists the original "Vendor/Client" value is kept.
 * @param {Array<object>} rows
 * @param {string} groupTypeCode  – GroupTypeMaster_Code string
 * @returns {Array<object>}
 */
function applyPartyNameTransform(rows, groupTypeCode) {
    if (!rows || !rows.length) return rows;
    const creditor = isCreditorCode(groupTypeCode);
    const targetKey = creditor ? 'Client Name' : 'Vendor Name';
    return rows.map(function (row) {
        const r = Object.assign({}, row);
        let partyValue = r['Vendor/Client'];
        if (creditor) {
            const v = r['Client Name'] != null ? r['Client Name'] :
                      r['ClientName']  != null ? r['ClientName']  :
                      r['client_name'] != null ? r['client_name'] : null;
            if (v != null && String(v).trim() !== '') partyValue = v;
        } else {
            const v = r['Vendor Name'] != null ? r['Vendor Name'] :
                      r['VendorName']  != null ? r['VendorName']  :
                      r['vendor_name'] != null ? r['vendor_name'] : null;
            if (v != null && String(v).trim() !== '') partyValue = v;
        }
        delete r['Vendor/Client'];
        const reordered = { [targetKey]: partyValue };
        Object.assign(reordered, r);
        return reordered;
    });
}

/**
 * If API returns a DR_CR / GroupTypeMaster_Code / party-type column, refine rows
 * when the server does not filter by GroupTypeMaster_Code itself.
 * Matches by numeric code first, then falls back to legacy Y/N/C/D/Creditor/Debtor strings.
 * @param {Array<object>} rows
 * @param {string} wantCode  – GroupTypeMaster_Code string (e.g. "1" or "2")
 */
function applyDebtorCreditorClientFilter(rows, wantCode) {
    if (!rows || !rows.length) return rows || [];
    const sample = rows[0];
    if (!sample || typeof sample !== 'object') return rows;

    /** @type {string|null} */
    let key = null;
    const keys = Object.keys(sample);
    for (let i = 0; i < keys.length; i++) {
        const n = normalizeFieldName(keys[i]);
        if (
            n === 'grouptypemastercode' ||
            n === 'grouptypecode' ||
            n === 'drcr' ||
            n === 'debtorcreditor' ||
            n.includes('debtorcreditor') ||
            n === 'partytype' ||
            n === 'accounttype'
        ) {
            key = keys[i];
            break;
        }
    }
    if (!key) return rows;

    const wantCreditor = isCreditorCode(wantCode);

    function matches(raw) {
        if (raw == null || String(raw).trim() === '') return true;
        const s = String(raw).trim();
        // Numeric code match (e.g. row has GroupTypeMaster_Code = 1 or 2)
        if (s === String(wantCode)) return true;
        const su = s.toUpperCase();
        if (wantCreditor) {
            return su === 'Y' || su === 'C' || su === 'CR' || su.includes('CREDIT');
        } else {
            return su === 'N' || su === 'D' || su === 'DR' || su.includes('DEBTOR');
        }
    }

    const out = [];
    for (let i = 0; i < rows.length; i++) {
        if (matches(rows[i][key])) out.push(rows[i]);
    }
    return out;
}

function destroySelect2IfAny($sel) {
    if ($sel.data('select2')) {
        $sel.select2('destroy');
    }
}

/**
 * Renders the Debtors/Creditors toggle buttons from the groupTypeMasterList.
 * The first item is pre-selected (checked).
 */
function renderGroupTypeToggle() {
    const container = document.getElementById('bwoGroupTypeToggle');
    const label = document.getElementById('lblGroupTypeToggle');
    if (!container) return;

    container.innerHTML = '';

    if (!groupTypeMasterList.length) {
        container.innerHTML = '<span class="text-muted" style="font-size:0.8rem;padding:4px;">—</span>';
        return;
    }

    if (label) {
        const allDesps = groupTypeMasterList.map((x) => x.GroupTypeDesp || '').join(' / ');
        label.textContent = allDesps;
    }

    groupTypeMasterList.forEach(function (item, idx) {
        const id = 'radBillWiseDrCr_' + item.Code;
        const inp = document.createElement('input');
        inp.type = 'radio';
        inp.name = 'billWiseDrCr';
        inp.id = id;
        inp.value = String(item.Code);
        inp.autocomplete = 'off';
        if (idx === 0) inp.checked = true;

        const lbl = document.createElement('label');
        lbl.htmlFor = id;
        lbl.textContent = item.GroupTypeDesp || String(item.Code);

        container.appendChild(inp);
        container.appendChild(lbl);
    });
}

/**
 * Loads GroupTypeMaster list from API, caches it, and renders the toggle.
 * After toggle is ready, loads the Account dropdown for the default selection.
 * @returns {Promise<void>}
 */
function loadGroupTypeMaster() {
    return MillWiseProductionReport.GetGroupTypeMaster()
        .then(function (response) {
            const list = normalizeListResponse(response);
            groupTypeMasterList = list.map(function (item) {
                return {
                    Code: item.Code ?? item.GroupTypeMaster_Code ?? item.code,
                    GroupTypeDesp: item.GroupTypeDesp ?? item.GroupTypeDesc ?? item.Desp ?? item.Description ?? '',
                    CodeinAccountMaster: item.CodeinAccountMaster ?? 0,
                };
            });
            renderGroupTypeToggle();
        })
        .catch(function () {
            groupTypeMasterList = [];
            renderGroupTypeToggle();
        });
}

function loadMarketingManDropdown() {
    const groupTypeCode = debtorCreditorFilterForApi();
    MillWiseProductionReport.GetMarketingManMasterByCR_DR(groupTypeCode)
        .then(function (response) {
            const rows = normalizeListResponse(response);
            const el = document.getElementById('ddlBillWiseMarketingMan');
            if (!el) return;
            const $el = $(el);
            destroySelect2IfAny($el);
            el.innerHTML = '';
            if (rows.length) {
                bindSelectList(el, rows.map((item) => ({
                    Code: item.Code ?? item.MarketingManMaster_Code ?? item.code,
                    Desp: item.PersonName ?? item.Desp ?? item.Name ?? item.Description ?? '',
                })), 'FirstItemSelected');
            }
            attachSelect2Multiple($el, 'All');
            $el.off('select2:select.bwoReloadParty select2:unselect.bwoReloadParty')
                .on('select2:select.bwoReloadParty select2:unselect.bwoReloadParty', function () {
                    loadAccountDropdown(marketingManFilterCodeForApi());
                });
        })
        .catch(function () {
            const el = document.getElementById('ddlBillWiseMarketingMan');
            if (el) el.innerHTML = '';
        });
}

function loadAccountDropdown(marketingManMasterCode) {
    const mm = marketingManMasterCode != null && marketingManMasterCode !== '' ? marketingManMasterCode : 0;
    const groupTypeCode = debtorCreditorFilterForApi();
    const $ddl = $('#ddlBillWiseAccount');

    const previouslySelected = $ddl.val() || [];

    destroySelect2IfAny($ddl);

    MillWiseProductionReport.GetMillWiseProductionFilters(groupTypeCode, mm)
        .then(function (response) {
            const rows = normalizeListResponse(response);
            const el = document.getElementById('ddlBillWiseAccount');
            if (!el) return;
            el.innerHTML = '';
            if (rows.length) {
                bindSelectList(el, rows.map((item) => ({ Code: item.Code, Desp: item.Desp || item.AccountDesp || item.Name || '' })), 'FirstItemSelected');
            }
            attachSelect2Multiple($ddl, 'All');

            if (previouslySelected.length) {
                const availableCodes = new Set(rows.map((item) => String(item.Code)));
                const stillValid = previouslySelected.filter((v) => availableCodes.has(String(v)));
                if (stillValid.length) {
                    $ddl.val(stillValid).trigger('change');
                }
            }
        })
        .catch(function () {
            const el = document.getElementById('ddlBillWiseAccount');
            if (el) el.innerHTML = '';
        });
}

function getAsonDateString() {
    const ason = document.getElementById('txtAsonDate');
    const asOn = document.getElementById('txtAsOnDate');
    const to = document.getElementById('txtToDate');
    const v =
        (ason && ason.value) ||
        (asOn && asOn.value) ||
        (to && to.value) ||
        '';
    return String(v).trim();
}

/**
 * Normalizes API payload to a row array (handles common wrapper shapes).
 * @param {*} response
 * @returns {Array<object>}
 */
function normalizeReportRows(response) {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    const candidates = ['Data', 'data', 'Items', 'items', 'Rows', 'rows', 'Result', 'result'];
    for (const key of candidates) {
        if (response[key] != null && Array.isArray(response[key])) return response[key];
    }
    return [];
}

function validateFilters() {
    const fromEl = document.getElementById('txtFromDate');
    const toEl = document.getElementById('txtToDate');
    if (fromEl && fromEl.required && !String(fromEl.value || '').trim()) {
        toastr.warning('From Date is required.');
        return false;
    }
    if (toEl && toEl.required && !String(toEl.value || '').trim()) {
        toastr.warning('To Date is required.');
        return false;
    }
    if (!getAsonDateString()) {
        toastr.warning('As on date is required (use As on Date field, or set To Date).');
        return false;
    }
    return true;
}

function setDownloadButtonVisible(visible) {
    const btn = document.getElementById('btnDownload');
    if (!btn) return;
    btn.classList.toggle('d-none', !visible);
}

function clearReportTable() {
    clearDashboardUi();
    setDownloadButtonVisible(false);
    const thead = document.getElementById('table-header');
    const tbody = document.getElementById('table-body');
    const paginator = document.getElementById('paginator-tblReport');
    if (thead) thead.innerHTML = '';
    if (tbody) tbody.innerHTML = '';
    if (paginator) paginator.innerHTML = '';
}

function renderReportGrid(rows) {
    clearReportTable();
    if (!rows.length) {
        toastr.info('No records found.');
        renderBillWiseDashboard([]);
        return;
    }

    // Detect party column name from first row (Client Name or Vendor Name)
    const firstRow = rows[0] || {};
    const partyColName = firstRow.hasOwnProperty('Client Name') ? 'Client Name' : 'Vendor Name';

    const StringFilterColumn = [partyColName, 'Person Name'];
    const NumericFilterColumn = ['Amount', 'Credit Days', 'Delay Days', 'Amount Adjusted'];
    const DateFilterColumn = ['Entry Date', 'Bill Date'];
    const StringdoubleFilterColumn = [];
    const HiddenColumns = ["Code"];
    const ColumnAlignment = [];
    const Button = false;
    const showButtons = [];
    const Total = [
        "Amount Adjusted",
        "Amount"
    ]

    window.BizsolCustomFilterGrid.CreateDataTable(
        'table-header',
        'table-body',
        rows,
        Button,
        showButtons,
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        HiddenColumns,
        ColumnAlignment,
        true,
        Total
    );
    $('#tblReport th').css('font-weight', 'bold');
    setDownloadButtonVisible(true);
    renderBillWiseDashboard(rows);
}

function ShowData() {
    if (!validateFilters()) return;

    const marketingManMasterCode = marketingManFilterCodeForApi();
    const accountMasterCode = accountFilterCodeForApi();
    const asonDate = getAsonDateString();
    const groupTypeCode = debtorCreditorFilterForApi();

    if (typeof Showloader === 'function') Showloader();

    BillWiseOutStandingReportService.GetBillWiseOutStandingReport(
        marketingManMasterCode,
        accountMasterCode,
        asonDate,
        groupTypeCode
    )
        .then(function (response) {
            const raw = normalizeReportRows(response);
            const filtered = applyDebtorCreditorClientFilter(raw, groupTypeCode);
            lastReportRows = applyPartyNameTransform(filtered, groupTypeCode);
            renderReportGrid(lastReportRows);
        })
        .catch(function () {
            lastReportRows = null;
            clearReportTable();
        })
        .finally(function () {
            if (typeof HideLoader === 'function') HideLoader();
        });
}

function downloadExcel() {
    if (!lastReportRows || !lastReportRows.length) {
        toastr.warning('Run the report first — there is no data to export.');
        return;
    }
    if (typeof XLSX === 'undefined') {
        toastr.error('Excel library not loaded.');
        return;
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.table_to_sheet(document.getElementById('tblReport'));
    XLSX.utils.book_append_sheet(wb, ws, 'Bill Wise Outstanding');
    const now = new Date();
    const stamp =
        now.getFullYear() +
        '-' +
        String(now.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(now.getDate()).padStart(2, '0') +
        '_' +
        String(now.getHours()).padStart(2, '0') +
        '-' +
        String(now.getMinutes()).padStart(2, '0') +
        '-' +
        String(now.getSeconds()).padStart(2, '0');
    XLSX.writeFile(wb, `BillWiseOutStandingReport_${stamp}.xlsx`);
}

document.getElementById('btnShow')?.addEventListener('click', () => {
    ShowData();
});

document.getElementById('btnDownload')?.addEventListener('click', () => {
    downloadExcel();
});

$(function () {
    const todayEl = document.getElementById('txtAsOnDate');
    if (todayEl && !todayEl.value) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        todayEl.value = `${yyyy}-${mm}-${dd}`;
    }

    // Load GroupTypeMaster first so the toggle is ready before Account dropdown loads
    loadGroupTypeMaster().then(function () {
        loadMarketingManDropdown();
        loadAccountDropdown(0);
    });

    $(document).on('change', 'input[name="billWiseDrCr"]', function () {
        // Reload both salesperson and account lists when Debtors/Creditors changes
        loadMarketingManDropdown();
        loadAccountDropdown(0);
    });
});
