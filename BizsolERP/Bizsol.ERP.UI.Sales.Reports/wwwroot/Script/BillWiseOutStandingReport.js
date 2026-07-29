import { BillWiseOutStandingReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BillWiseOutStandingReportService.js';
import { MillWiseProductionReport } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_MillWiseProductionReportService.js';
import { AgeingParameterControlService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_AgeingParameterControlService.js';
import { initializeAgeingParameterControl } from '../../Bizsol.WebERP.UI.Shared/js/Pages/CommonAgeingParameterControl.js';

/** @type {Array<object>|null} */
let lastReportRows = null;

/** @type {{ outstanding: Array<object>, overdue: Array<object> }|null} Month-wise API data. */
let lastMonthWiseData = null;

/** @type {{ Desp: string, Rows: Array<{Days:number, DaysDesp:string}>, AgeingParameters?: string }|null} */
let G_AgeingParameter = null;

/** When true, run ShowData() after user clicks USE in the ageing modal. */
let bwoPendingShowAfterAgeing = false;

const BWO_AGEING_FORM_NAME = 'BillWiseOutStandingReport';
const BWO_AGEING_FORM_TYPE = 'S';

/** Default delay-day buckets when no ageing format is loaded from DB. */
const BWO_DEFAULT_DELAY_BUCKETS = [
    { Days: 0, DaysDesp: 'No delay (≤0)' },
    { Days: 30, DaysDesp: '1–30 days' },
    { Days: 60, DaysDesp: '31–60 days' },
    { Days: 90, DaysDesp: '61–90 days' },
    { Days: 120, DaysDesp: '91–120 days' },
    { Days: 0, DaysDesp: '121+ days' },
];

/** Bill-date delay only — excludes generic DelayDays (that is due-date / credit-days-after). */
const BWO_DELAY_DAYS_BILL_ALIASES = [
    'Delay Days (Bill Date)', 'Delay Days(Bill Date)', 'DelayDaysBillDate',
];

/** Due-date delay: generic DelayDays from API = credit days after due date. */
const BWO_DELAY_DAYS_DUE_ALIASES = [
    'Delay Days', 'DelayDays', 'delayDays', 'Delay_Days', 'DelayDay',
    'Delay Days Due', 'DelayDaysDue', 'Delay On Due Date', 'Delay_On_Due_Date',
    'Due Date Delay Days', 'DelayDaysAsPerDueDate', 'Delay Days (Due Date)',
    'Delay Days(Due Date)', 'DelayDaysDueDate',
    'Credit Days After Data', 'CreditDaysAfterData', 'Credit_Days_After_Data',
];

const BWO_DUE_DATE_ALIASES = [
    'Due Date', 'DueDate', 'dueDate', 'Due_Date', 'due_date',
];

const BWO_BILL_DATE_ALIASES = [
    'Bill Date', 'BillDate', 'billDate', 'Bill_Date', 'bill_date',
    'Entry Date', 'EntryDate', 'entryDate', 'Entry_Date',
    'Voucher Date', 'VoucherDate', 'voucherDate', 'Voucher_Date',
];

/** Bill Date / Entry Date only — used for month-wise trend chart grouping. */
const BWO_MONTH_BILL_DATE_ALIASES = [
    'Bill Date', 'BillDate', 'billDate', 'Bill_Date', 'bill_date',
    'Entry Date', 'EntryDate', 'entryDate', 'Entry_Date',
];

const BWO_CREDIT_DAYS_ALIASES = [
    'Credit Days', 'CreditDays', 'creditDays', 'Credit_Days',
];

/** Prefer API / grid label "GSTN No" (not "GSTIN"). */
const BWO_GSTIN_ALIASES = [
    'GSTN No', 'GSTNNo', 'Gstn No', 'GstnNo',
    'GSTIN', 'Gstin', 'gstin', 'GST No', 'GSTNo', 'GstNo', 'GST_No',
    'GSTIN No', 'GSTINNo', 'Party GSTIN', 'PartyGSTIN', 'Vendor GSTIN', 'VendorGSTIN',
];

/**
 * All GSTN-related keys on a row — hide these on Dashboard grid.
 * @param {object} row
 * @returns {string[]}
 */
function gstnHiddenColumnNames(row) {
    if (!row || typeof row !== 'object') return ['GSTN No'];
    const want = new Set(BWO_GSTIN_ALIASES.map(normalizeFieldName));
    const found = Object.keys(row).filter(function (k) {
        return want.has(normalizeFieldName(k));
    });
    return found.length ? found : ['GSTN No'];
}

const BWO_CREDIT_LIMIT_ALIASES = [
    'Credit Limit', 'CreditLimit', 'creditLimit', 'Credit_Limit',
    'Cr Limit', 'CrLimit', 'Cr. Limit', 'Credit Limit In Lacs', 'CreditLimitInLacs',
    'Cr Limit In Lacs', 'CrLimitInLacs',
];

/** Delay Days column from report grid/API — used everywhere except delay-bucket chart. */
const BWO_DELAY_DAYS_REPORT_ALIASES = [
    'Delay Days', 'DelayDays', 'delayDays', 'Delay_Days', 'DelayDay',
];

const BWO_CODE_ALIASES = ['Code', 'code', 'Bill Code', 'BillCode', 'Voucher Code', 'VoucherCode'];

const BWO_AMOUNT_ALIASES = ['Amount', 'amount', 'Amt', 'amt'];

const BWO_AMOUNT_ADJUSTED_ALIASES = [
    'Amount Adjusted', 'AmountAdjusted', 'amountAdjusted', 'Amount_Adjusted', 'AmtAdjusted',
];

const BWO_BALANCE_ALIASES = ['Balance', 'balance'];

const BWO_OUTSTANDING_ALIASES = [
    'Outstanding', 'Net Outstanding', 'NetOutstanding', 'Net_Outstanding',
    'Outstanding Amount', 'OutstandingAmount', 'Outstanding_Amount',
];

/** GetBillMonthWiseOutStandingReport API month-trend columns. */
const BWO_MONTH_TREND_MONTH_ALIASES = ['Month', 'month'];
const BWO_TOTAL_BILLS_ALIASES = ['TotalBills', 'Total Bills', 'Total_Bills'];
const BWO_TOTAL_ADJUSTED_ALIASES = ['TotalAdjusted', 'Total Adjusted', 'Total_Adjusted'];
const BWO_CLOSING_OUTSTANDING_ALIASES = [
    'ClosingOutstanding', 'Closing Outstanding', 'Closing_Outstanding',
];

/** @type {any[]} */
const dashboardChartInstances = [];

/** Chart.js instance for Outstanding by Delay-Days Bucket only. */
let delayBucketChartInstance = null;

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
 * @param {object} row
 * @param {string[]} aliases
 * @returns {boolean}
 */
function rowHasFieldFromAliases(row, aliases) {
    if (!row || typeof row !== 'object') return false;
    for (let i = 0; i < aliases.length; i++) {
        const k = aliases[i];
        if (Object.prototype.hasOwnProperty.call(row, k) && row[k] != null && row[k] !== '') {
            return true;
        }
    }
    const want = new Set(aliases.map(normalizeFieldName));
    const keys = Object.keys(row);
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (want.has(normalizeFieldName(k)) && row[k] != null && row[k] !== '') {
            return true;
        }
    }
    return false;
}

/**
 * @param {object} row
 * @param {string[]} aliases
 * @returns {string}
 */
function rowStringFromAliases(row, aliases) {
    if (!row || typeof row !== 'object') return '';
    for (let i = 0; i < aliases.length; i++) {
        const k = aliases[i];
        if (Object.prototype.hasOwnProperty.call(row, k) && row[k] != null && row[k] !== '') {
            return String(row[k]).trim();
        }
    }
    const want = new Set(aliases.map(normalizeFieldName));
    const keys = Object.keys(row);
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (want.has(normalizeFieldName(k)) && row[k] != null && row[k] !== '') {
            return String(row[k]).trim();
        }
    }
    return '';
}

/**
 * @param {string} dateStr
 * @returns {Date|null}
 */
function parseDateValue(dateStr) {
    if (dateStr == null || String(dateStr).trim() === '') return null;
    const s = String(dateStr).trim();

    let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
    if (m) {
        const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        return isNaN(d.getTime()) ? null : d;
    }

    m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/.exec(s);
    if (m) {
        const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
        return isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
function addDaysToDate(date, days) {
    const out = new Date(date.getTime());
    out.setDate(out.getDate() + Math.floor(toNumber(days)));
    return out;
}

/**
 * @param {object} row
 * @returns {Date|null}
 */
function getRowBillDate(row) {
    return parseDateValue(rowStringFromAliases(row, BWO_BILL_DATE_ALIASES));
}

/**
 * @param {object} row
 * @returns {number}
 */
function getRowCreditDays(row) {
    return Math.floor(rowNumberFromAliases(row, BWO_CREDIT_DAYS_ALIASES));
}

/**
 * Days from start date to end date (end − start).
 * @param {Date} start
 * @param {Date} end
 * @returns {number}
 */
function daysBetweenDates(start, end) {
    return Math.floor((end.getTime() - start.getTime()) / 86400000);
}

/**
 * Delay days from report API (Delay Days column).
 * Used for KPIs and all dashboard charts except Outstanding by Delay-Days Bucket.
 * @param {object} row
 * @returns {number}
 */
function getRowDelayDaysFromReport(row) {
    return Math.floor(rowNumberFromAliases(row, BWO_DELAY_DAYS_REPORT_ALIASES));
}

/**
 * Delay days from Bill Date → As on Date (delay-bucket chart only).
 * Does not use credit days, due date, or generic DelayDays (credit-days-after).
 * @param {object} row
 * @returns {number}
 */
function getRowDelayDaysAsPerBillDate(row) {
    const asOnDate = parseDateValue(getAsonDateString());
    const billDate = getRowBillDate(row);
    if (billDate && asOnDate) {
        return daysBetweenDates(billDate, asOnDate);
    }

    if (rowHasFieldFromAliases(row, BWO_DELAY_DAYS_BILL_ALIASES)) {
        return Math.floor(rowNumberFromAliases(row, BWO_DELAY_DAYS_BILL_ALIASES));
    }

    return 0;
}

/**
 * Delay days from Due Date → As on Date (delay-bucket chart only).
 * Uses DelayDays / credit-days-after from API, or Due Date = Bill Date + Credit Days.
 * @param {object} row
 * @returns {number}
 */
function getRowDelayDaysAsPerDueDate(row) {
    if (rowHasFieldFromAliases(row, BWO_DELAY_DAYS_DUE_ALIASES)) {
        return Math.floor(rowNumberFromAliases(row, BWO_DELAY_DAYS_DUE_ALIASES));
    }

    const asOnDate = parseDateValue(getAsonDateString());
    if (asOnDate) {
        const dueFromColumn = parseDateValue(rowStringFromAliases(row, BWO_DUE_DATE_ALIASES));
        if (dueFromColumn) {
            return daysBetweenDates(dueFromColumn, asOnDate);
        }

        const billDate = getRowBillDate(row);
        if (billDate) {
            const dueDate = addDaysToDate(billDate, getRowCreditDays(row));
            return daysBetweenDates(dueDate, asOnDate);
        }
    }

    return getRowDelayDaysAsPerBillDate(row) - getRowCreditDays(row);
}

/**
 * Delay days for Outstanding by Delay-Days Bucket chart only.
 * @param {object} row
 * @param {'bill'|'due'} mode
 * @returns {number}
 */
function getRowDelayDaysForBucket(row, mode) {
    if (mode === 'due') {
        return getRowDelayDaysAsPerDueDate(row);
    }
    return getRowDelayDaysAsPerBillDate(row);
}

/**
 * @returns {'bill'|'due'}
 */
function getDelayBucketDateMode() {
    const sel = document.querySelector('#bill-wise-outstanding-report input[name="bwoDelayBucketDateMode"]:checked');
    if (sel && String(sel.value).toLowerCase() === 'due') return 'due';
    return 'bill';
}

/**
 * Build delay-bucket outstanding totals for the bucket chart.
 * @param {Array<object>} rows
 * @param {'bill'|'due'} [dateMode]
 * @returns {{ bucketOrder: string[], bucketOutstanding: Record<string, number> }}
 */
function buildDelayBucketOutstanding(rows, dateMode) {
    const mode = dateMode || getDelayBucketDateMode();
    const bucketRows = getActiveDelayBucketRows();
    const bucketOrder = bucketRows.map(function (r) { return r.DaysDesp; });
    /** @type {Record<string, number>} */
    const bucketOutstanding = {};
    bucketOrder.forEach(function (b) {
        bucketOutstanding[b] = 0;
    });

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const amt = rowNumberFromAliases(row, BWO_AMOUNT_ALIASES);
        const adj = rowNumberFromAliases(row, BWO_AMOUNT_ADJUSTED_ALIASES);
        const net = rowNetOutstanding(row);
        const ddBucket = getRowDelayDaysForBucket(row, mode);
        const bucket = delayDaysBucketLabel(ddBucket, bucketRows);
        if (Object.prototype.hasOwnProperty.call(bucketOutstanding, bucket)) {
            bucketOutstanding[bucket] += net;
        } else if (bucketOrder.length) {
            bucketOutstanding[bucketOrder[bucketOrder.length - 1]] += net;
        }
    }

    return { bucketOrder: bucketOrder, bucketOutstanding: bucketOutstanding };
}

/**
 * Short label for delay-bucket x-axis on small screens.
 * @param {string} label
 * @param {boolean} isMobile
 * @returns {string}
 */
function mobileDelayBucketLabel(label, isMobile) {
    if (!isMobile) return label;
    let s = String(label || '').trim();
    s = s.replace(/\s*D\s*$/i, '');
    s = s.replace(/\s*days?\s*$/i, '');
    if (s.length > 10) return s.slice(0, 9) + '…';
    return s || label;
}

/**
 * Refresh only the Outstanding by Delay-Days Bucket chart when Bill/Due toggle changes.
 */
function refreshDelayBucketChartOnly() {
    if (!lastReportRows || !lastReportRows.length || !delayBucketChartInstance) return;

    const bucketData = buildDelayBucketOutstanding(lastReportRows);
    const bucketOrder = bucketData.bucketOrder;
    const bucketOutstanding = bucketData.bucketOutstanding;
    const isMobile = window.innerWidth < 576;
    const bucketDisplayLabels = bucketOrder.map(function (b) {
        return mobileDelayBucketLabel(b, isMobile);
    });
    const bucketValues = bucketOrder.map(function (b) {
        return Math.max(0, bucketOutstanding[b] || 0);
    });

    delayBucketChartInstance.data.labels = bucketDisplayLabels;
    delayBucketChartInstance.data.datasets[0].data = bucketValues;
    delayBucketChartInstance.update();
}

/**
 * Net outstanding for one grouped bill row.
 * Balance / Outstanding = Amount − Sum(Amount Adjusted) when present.
 * @param {object} row
 * @returns {number}
 */
function rowNetOutstanding(row) {
    if (rowHasFieldFromAliases(row, BWO_BALANCE_ALIASES)) {
        return rowNumberFromAliases(row, BWO_BALANCE_ALIASES);
    }
    if (rowHasFieldFromAliases(row, BWO_OUTSTANDING_ALIASES)) {
        return rowNumberFromAliases(row, BWO_OUTSTANDING_ALIASES);
    }
    const amt = rowNumberFromAliases(row, BWO_AMOUNT_ALIASES);
    const adj = rowNumberFromAliases(row, BWO_AMOUNT_ADJUSTED_ALIASES);
    return amt - adj;
}

function formatInr(n) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));
}

/**
 * Amount cell for Ageing Report (2 decimal places, Indian grouping).
 * Empty string when amount is zero (matches Excel blank cells).
 * @param {number} n
 * @param {boolean} [blankIfZero]
 * @returns {string}
 */
function formatAgeingAmount(n, blankIfZero) {
    const v = toNumber(n);
    if (blankIfZero && Math.abs(v) < 0.005) return '';
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(v);
}

/**
 * @returns {'Dashboard'|'AgeingReport'}
 */
function getReportStatus() {
    const el = document.getElementById('ddlBillWiseReportStatus');
    if (!el) return 'Dashboard';
    return String(el.value || 'Dashboard') === 'AgeingReport' ? 'AgeingReport' : 'Dashboard';
}

/**
 * @returns {'bill'|'due'}
 */
function getAgeingTableDateMode() {
    const sel = document.querySelector('#bill-wise-outstanding-report input[name="bwoAgeingTableDateMode"]:checked');
    if (sel && String(sel.value).toLowerCase() === 'due') return 'due';
    return 'bill';
}

/**
 * Selected group type description for Ageing Report side label (e.g. DEBTORS).
 * @returns {string}
 */
function getSelectedGroupTypeLabel() {
    const code = debtorCreditorFilterForApi();
    const item = groupTypeMasterList.find((x) => String(x.Code) === String(code));
    const desp = item && item.GroupTypeDesp ? String(item.GroupTypeDesp).trim() : '';
    return (desp || 'DEBTORS').toUpperCase();
}

/**
 * Party display name from a bill-wise row.
 * @param {object} row
 * @returns {string}
 */
function getRowPartyName(row) {
    const name = rowStringFromAliases(row, [
        'Client Name', 'ClientName', 'Vendor Name', 'VendorName', 'Vendor/Client',
        'Party Name', 'PartyName', 'Account Name', 'AccountName', 'AccountDesp',
    ]);
    return name || '—';
}

/**
 * Credit limit in lacs for Ageing Report column.
 * If value looks like absolute rupees (>= 1000), convert to lacs.
 * @param {object} row
 * @returns {number}
 */
function getRowCreditLimitInLacs(row) {
    const raw = rowNumberFromAliases(row, BWO_CREDIT_LIMIT_ALIASES);
    if (!raw) return 0;
    if (Math.abs(raw) >= 1000) return raw / 100000;
    return raw;
}

/**
 * Aggregate bill-wise rows into party × ageing-bucket matrix (Excel Ageing Report layout).
 * @param {Array<object>} rows
 * @param {'bill'|'due'} [dateMode]
 * @returns {Array<object>}
 */
function buildPartyAgeingRows(rows, dateMode) {
    const mode = dateMode || getAgeingTableDateMode();
    const bucketRows = getActiveDelayBucketRows();
    const bucketOrder = bucketRows.map(function (r) { return r.DaysDesp; });
    /** @type {Map<string, object>} */
    const byParty = new Map();

    for (let i = 0; i < (rows || []).length; i++) {
        const row = rows[i];
        const party = getRowPartyName(row);
        const gstin = rowStringFromAliases(row, BWO_GSTIN_ALIASES);
        const key = party.toUpperCase() + '||' + gstin.toUpperCase();
        let agg = byParty.get(key);
        if (!agg) {
            /** @type {Record<string, number>} */
            const buckets = {};
            bucketOrder.forEach(function (b) { buckets[b] = 0; });
            agg = {
                partyName: party,
                gstin: gstin,
                creditDays: getRowCreditDays(row),
                creditLimitLacs: getRowCreditLimitInLacs(row),
                buckets: buckets,
                total: 0,
            };
            byParty.set(key, agg);
        } else {
            if (!agg.gstin && gstin) agg.gstin = gstin;
            const cd = getRowCreditDays(row);
            if (cd > agg.creditDays) agg.creditDays = cd;
            const cl = getRowCreditLimitInLacs(row);
            if (cl > agg.creditLimitLacs) agg.creditLimitLacs = cl;
        }

        const net = rowNetOutstanding(row);
        if (Math.abs(net) < 0.00001) continue;

        const dd = getRowDelayDaysForBucket(row, mode);
        let bucket = delayDaysBucketLabel(dd, bucketRows);
        if (!Object.prototype.hasOwnProperty.call(agg.buckets, bucket) && bucketOrder.length) {
            bucket = bucketOrder[bucketOrder.length - 1];
        }
        if (Object.prototype.hasOwnProperty.call(agg.buckets, bucket)) {
            agg.buckets[bucket] += net;
            agg.total += net;
        }
    }

    const list = Array.from(byParty.values()).filter(function (p) {
        return Math.abs(p.total) >= 0.005;
    });
    list.sort(function (a, b) {
        return String(a.partyName).localeCompare(String(b.partyName), undefined, { sensitivity: 'base' });
    });
    return list;
}

/**
 * Show/hide Ageing Report toolbar vs Dashboard charts.
 * @param {boolean} isAgeing
 */
function setAgeingReportUiVisible(isAgeing) {
    const toolbar = document.getElementById('billWiseAgeingToolbar');
    if (toolbar) toolbar.classList.toggle('d-none', !isAgeing);
    if (isAgeing) {
        setDashboardSectionVisible(false);
    }
}

/**
 * Render party Ageing Report table (Excel-style matrix).
 * @param {Array<object>} billRows
 */
function renderAgeingReportGrid(billRows) {
    clearReportTableDom();
    setAgeingReportUiVisible(true);
    destroyDashboardCharts();
    setDashboardSectionVisible(false);

    const partyRows = buildPartyAgeingRows(billRows || []);
    const bucketOrder = getDelayBucketOrder();
    const groupLabel = getSelectedGroupTypeLabel();
    const tbl = document.getElementById('tblReport');
    const thead = document.getElementById('table-header');
    const tbody = document.getElementById('table-body');
    const tfoot = document.getElementById('table-footer');
    const paginator = document.getElementById('paginator-tblReport');

    if (tbl) {
        tbl.classList.remove('fixed-width-table', 'table');
        tbl.classList.add('bwo-ageing-table');
    }
    if (paginator) paginator.innerHTML = '';

    if (!partyRows.length) {
        toastr.info('No records found.');
        setDownloadButtonVisible(false);
        return;
    }

    let headHtml = '<tr>';
    headHtml += '<th></th>';
    headHtml += '<th>Company Name</th>';
    headHtml += '<th>GSTN No</th>';
    headHtml += '<th>Credit Days</th>';
    headHtml += '<th>Cr. Limit (In Lacs)</th>';
    for (let b = 0; b < bucketOrder.length; b++) {
        headHtml += '<th>' + escapeHtml(bucketOrder[b]) + '</th>';
    }
    headHtml += '<th>Total</th>';
    headHtml += '</tr>';
    if (thead) thead.innerHTML = headHtml;

    /** @type {Record<string, number>} */
    const colTotals = {};
    bucketOrder.forEach(function (b) { colTotals[b] = 0; });
    let grandTotal = 0;

    let bodyHtml = '';
    for (let i = 0; i < partyRows.length; i++) {
        const p = partyRows[i];
        bodyHtml += '<tr>';
        if (i === 0) {
            bodyHtml +=
                '<td class="bwo-ageing-group" rowspan="' +
                partyRows.length +
                '">' +
                escapeHtml(groupLabel) +
                '</td>';
        }
        bodyHtml += '<td class="bwo-ageing-party">' + escapeHtml(p.partyName) + '</td>';
        bodyHtml += '<td class="bwo-ageing-center">' + escapeHtml(p.gstin || '') + '</td>';
        bodyHtml += '<td class="bwo-ageing-center">' + escapeHtml(String(p.creditDays || 0)) + '</td>';
        bodyHtml +=
            '<td class="bwo-ageing-num">' +
            formatAgeingAmount(p.creditLimitLacs, false) +
            '</td>';
        for (let b = 0; b < bucketOrder.length; b++) {
            const label = bucketOrder[b];
            const amt = p.buckets[label] || 0;
            colTotals[label] += amt;
            bodyHtml +=
                '<td class="bwo-ageing-num">' +
                formatAgeingAmount(amt, true) +
                '</td>';
        }
        grandTotal += p.total;
        bodyHtml +=
            '<td class="bwo-ageing-num bwo-ageing-total-col">' +
            formatAgeingAmount(p.total, false) +
            '</td>';
        bodyHtml += '</tr>';
    }
    if (tbody) tbody.innerHTML = bodyHtml;

    let footHtml = '<tr>';
    footHtml += '<td></td>';
    footHtml += '<td colspan="3" class="bwo-ageing-party">Total</td>';
    footHtml += '<td></td>';
    for (let b = 0; b < bucketOrder.length; b++) {
        footHtml +=
            '<td class="bwo-ageing-num">' +
            formatAgeingAmount(colTotals[bucketOrder[b]], true) +
            '</td>';
    }
    footHtml +=
        '<td class="bwo-ageing-num bwo-ageing-total-col">' +
        formatAgeingAmount(grandTotal, false) +
        '</td>';
    footHtml += '</tr>';
    if (tfoot) tfoot.innerHTML = footHtml;

    setDownloadButtonVisible(true);
}

/**
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
    return String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
 * Pick Y-axis step for monthly trend — 1K for small amounts, 50L (50 lakh) for larger.
 * @param {number} max
 * @returns {number}
 */
function pickMonthlyTickStep(max) {
    if (max <= 0) return 1e3;
    if (max <= 1e4) return 1e3;       // 1K
    if (max <= 1e5) return 1e4;       // 10K
    if (max <= 5e5) return 5e4;       // 50K
    if (max <= 2e6) return 1e5;       // 1L
    if (max <= 1e7) return 5e5;       // 5L
    if (max <= 5e7) return 5e6;       // 50L (50 lakh)
    return 1e7;                        // 1Cr
}

/**
 * Build fixed Y-axis tick values for monthly chart (0 … max).
 * @param {number} maxVal
 * @returns {{ suggestedMax: number, tickValues: number[], tickSet: Set<number> }}
 */
function buildMonthlyYAxisTicks(maxVal, maxLabelLimit, maxStepCeiling) {
    const max = Math.max(toNumber(maxVal), 0);
    let step = pickMonthlyTickStep(max || 1e3);
    let ceiling = Math.max(step, Math.ceil((max || step) / step) * step);
    let tickValues = [];
    for (let v = 0; v <= ceiling + step * 0.001; v += step) {
        tickValues.push(v);
    }
    const maxLabels = maxLabelLimit != null
        ? maxLabelLimit
        : (window.innerWidth < 576 ? 8 : 14);
    const stepCap = maxStepCeiling != null ? maxStepCeiling : 5e7;
    while (tickValues.length > maxLabels && step < stepCap) {
        if (step === 1e3) step = 1e4;
        else if (step === 1e4) step = 5e4;
        else if (step === 5e4) step = 1e5;
        else if (step === 1e5) step = 5e5;
        else if (step === 5e5) step = 1e6;
        else if (step === 1e6) step = 5e6;
        else if (step === 5e6) step = 1e7;
        else step = 5e7;
        ceiling = Math.max(step, Math.ceil((max || step) / step) * step);
        tickValues = [];
        for (let v = 0; v <= ceiling + step * 0.001; v += step) {
            tickValues.push(v);
        }
    }
    const tickSet = new Set(tickValues.map(function (t) { return Math.round(t); }));
    return { suggestedMax: ceiling, tickValues: tickValues, tickSet: tickSet };
}

/**
 * Active bucket rows: from DB ageing parameter, or built-in defaults.
 * @returns {Array<{Days:number, DaysDesp:string}>}
 */
function getActiveDelayBucketRows() {
    const rows = G_AgeingParameter && Array.isArray(G_AgeingParameter.Rows)
        ? G_AgeingParameter.Rows
        : [];
    if (rows.length) {
        return rows.map(function (r) {
            return {
                Days: r.Days != null ? Number(r.Days) : 0,
                DaysDesp: r.DaysDesp != null ? String(r.DaysDesp).trim() : '',
            };
        }).filter(function (r) { return r.DaysDesp; });
    }
    return BWO_DEFAULT_DELAY_BUCKETS.slice();
}

/**
 * Ordered bucket labels for chart x-axis.
 * @returns {string[]}
 */
function getDelayBucketOrder() {
    return getActiveDelayBucketRows().map(function (r) { return r.DaysDesp; });
}

/**
 * Assign delay days to a bucket label using ageing rows (Days = upper bound per row; last row = overflow).
 * @param {number} delayDays
 * @param {Array<{Days:number, DaysDesp:string}>} [rows]
 * @returns {string}
 */
function delayDaysBucketLabel(delayDays, rows) {
    const bucketRows = rows && rows.length ? rows : getActiveDelayBucketRows();
    const d = Math.floor(toNumber(delayDays));

    if (!bucketRows.length) {
        return String(d);
    }

    for (let i = 0; i < bucketRows.length; i++) {
        const isLast = i === bucketRows.length - 1;
        if (isLast) {
            return bucketRows[i].DaysDesp;
        }
        const upper = Math.floor(toNumber(bucketRows[i].Days));
        if (d <= upper) {
            return bucketRows[i].DaysDesp;
        }
    }

    return bucketRows[bucketRows.length - 1].DaysDesp;
}

function updateAgeingFormatLabel(desp) {
    const text = desp ? String(desp) : 'Default';
    const chartEl = document.getElementById('lblBillWiseAgeingFormatChart');
    if (chartEl) chartEl.textContent = text;
    const tableEl = document.getElementById('lblBillWiseAgeingFormatTable');
    if (tableEl) tableEl.textContent = text;
}

/**
 * Load first saved ageing format from DB on page init (if any).
 * @returns {Promise<void>}
 */
function loadDefaultAgeingParameterFromDb() {
    return AgeingParameterControlService.GetSavedFormatList(BWO_AGEING_FORM_NAME, BWO_AGEING_FORM_TYPE)
        .then(function (list) {
            if (!list || !list.length) {
                updateAgeingFormatLabel('');
                return;
            }
            const desp = list[0].Desp;
            if (!desp) return;
            return AgeingParameterControlService.GetFormatDetail(desp, BWO_AGEING_FORM_NAME, BWO_AGEING_FORM_TYPE)
                .then(function (detail) {
                    if (detail && detail.Rows && detail.Rows.length) {
                        G_AgeingParameter = {
                            Desp: detail.Desp || desp,
                            Rows: detail.Rows,
                            FormName: BWO_AGEING_FORM_NAME,
                            FormType: BWO_AGEING_FORM_TYPE,
                        };
                        updateAgeingFormatLabel(G_AgeingParameter.Desp);
                    }
                });
        })
        .catch(function () {
            updateAgeingFormatLabel('');
        });
}

function ShowAgeingParameterModal(runReportAfterUse) {
    bwoPendingShowAfterAgeing = !!runReportAfterUse;
    initializeAgeingParameterControl({
        FormName: BWO_AGEING_FORM_NAME,
        FormType: BWO_AGEING_FORM_TYPE,
        CallBackFn: onAgeingParameterSelected,
    });
}

function onAgeingParameterSelected(result) {
    G_AgeingParameter = result;
    updateAgeingFormatLabel(result && result.Desp ? result.Desp : '');

    if (bwoPendingShowAfterAgeing) {
        bwoPendingShowAfterAgeing = false;
        ShowData();
        return;
    }

    if (lastReportRows && lastReportRows.length) {
        renderLoadedReport(lastReportRows, lastMonthWiseData);
    }
}

function destroyDashboardCharts() {
    delayBucketChartInstance = null;
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

function formatMonthKeyLabel(key, isMobile) {
    const parts = String(key || '').split('-');
    if (parts.length < 2) return String(key || '');
    const yr = parts[0];
    const mo = parseInt(parts[1], 10);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (isMobile) return (monthNames[mo - 1] || mo) + " '" + String(yr).slice(-2);
    return (monthNames[mo - 1] || mo) + ' ' + yr;
}

/**
 * Parse YYYY-MM from a Bill Date / Entry Date (or API month label).
 * @param {*} value
 * @returns {string|null}
 */
function parseMonthKeyFromValue(value) {
    if (value == null || value === '') return null;
    const s = String(value).trim();
    if (!s) return null;

    const isoMatch = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?/.exec(s);
    if (isoMatch) {
        return isoMatch[1] + '-' + String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    }

    const d = parseDateValue(s);
    if (d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }

    const compact = s.replace(/\D/g, '');
    if (/^\d{6}$/.test(compact)) {
        const y = parseInt(compact.slice(0, 4), 10);
        const m = parseInt(compact.slice(4, 6), 10);
        if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12) {
            return compact.slice(0, 4) + '-' + compact.slice(4, 6);
        }
    }

    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    const mmmHyphenYyyy = /^([a-z]{3})-(\d{4})$/i.exec(s);
    if (mmmHyphenYyyy) {
        const idx = monthNames.indexOf(mmmHyphenYyyy[1].slice(0, 3).toLowerCase());
        if (idx >= 0) {
            return mmmHyphenYyyy[2] + '-' + String(idx + 1).padStart(2, '0');
        }
    }

    let textMatch = /([a-z]{3,9})[\s\-\/\.]+(\d{4})/i.exec(s);
    if (textMatch) {
        const idx = monthNames.indexOf(textMatch[1].slice(0, 3).toLowerCase());
        if (idx >= 0) {
            return textMatch[2] + '-' + String(idx + 1).padStart(2, '0');
        }
    }
    textMatch = /(\d{4})[\s\-\/\.]+([a-z]{3,9})/i.exec(s);
    if (textMatch) {
        const idx = monthNames.indexOf(textMatch[2].slice(0, 3).toLowerCase());
        if (idx >= 0) {
            return textMatch[1] + '-' + String(idx + 1).padStart(2, '0');
        }
    }

    return null;
}

/**
 * Read month key from row — prefers Bill Date / Entry Date (not Voucher Date).
 * @param {object} row
 * @returns {string|null}
 */
function getBillMonthKeyFromRow(row) {
    if (!row || typeof row !== 'object') return null;

    const monthFromApi = rowStringFromAliases(row, BWO_MONTH_TREND_MONTH_ALIASES);
    if (monthFromApi) {
        const key = parseMonthKeyFromValue(monthFromApi);
        if (key) return key;
    }

    const billDateKey = parseMonthKeyFromValue(rowStringFromAliases(row, BWO_MONTH_BILL_DATE_ALIASES));
    if (billDateKey) return billDateKey;

    const wantBill = new Set(BWO_MONTH_BILL_DATE_ALIASES.map(normalizeFieldName));
    const keys = Object.keys(row);
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const norm = normalizeFieldName(k);
        if (wantBill.has(norm) && row[k] != null && row[k] !== '') {
            const key = parseMonthKeyFromValue(row[k]);
            if (key) return key;
        }
        if ((norm.includes('bill') && norm.includes('date')) || (norm.includes('entry') && norm.includes('date'))) {
            const key = parseMonthKeyFromValue(row[k]);
            if (key) return key;
        }
    }

    const monthAliases = [
        'MonthYear', 'Month Year', 'Month-Year', 'Month_Year', 'monthYear',
        'Month', 'Period', 'PeriodLabel', 'Period Label',
    ];
    for (let i = 0; i < monthAliases.length; i++) {
        const k = monthAliases[i];
        if (Object.prototype.hasOwnProperty.call(row, k) && row[k] != null && row[k] !== '') {
            const key = parseMonthKeyFromValue(row[k]);
            if (key) return key;
        }
    }

    const wantMonth = new Set(monthAliases.map(normalizeFieldName));
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (wantMonth.has(normalizeFieldName(k)) && row[k] != null && row[k] !== '') {
            const key = parseMonthKeyFromValue(row[k]);
            if (key) return key;
        }
    }

    const monthVal = Math.floor(rowNumberFromAliases(row, [
        'Month', 'month', 'MonthNo', 'Month_No', 'MonthNumber', 'Month_Number',
    ]));
    const yearVal = Math.floor(rowNumberFromAliases(row, [
        'Year', 'year', 'YearNo', 'Year_No', 'YearNumber', 'Year_Number',
    ]));
    if (monthVal >= 1 && monthVal <= 12 && yearVal >= 1900) {
        return yearVal + '-' + String(monthVal).padStart(2, '0');
    }

    return null;
}

/**
 * Row from GetBillMonthWiseOutStandingReport (Month, TotalBills, TotalAdjusted, ClosingOutstanding).
 * @param {object} row
 * @returns {boolean}
 */
function isMonthTrendApiRow(row) {
    if (!rowHasFieldFromAliases(row, BWO_MONTH_TREND_MONTH_ALIASES)) return false;
    return rowHasFieldFromAliases(row, BWO_CLOSING_OUTSTANDING_ALIASES)
        || rowHasFieldFromAliases(row, BWO_TOTAL_BILLS_ALIASES)
        || rowHasFieldFromAliases(row, BWO_TOTAL_ADJUSTED_ALIASES);
}

/**
 * Closing outstanding for month-trend API row.
 * ClosingOutstanding = TotalBills − TotalAdjusted when ClosingOutstanding column is absent.
 * @param {object} row
 * @returns {number}
 */
function getMonthWiseClosingOutstanding(row) {
    if (rowHasFieldFromAliases(row, BWO_CLOSING_OUTSTANDING_ALIASES)) {
        return rowNumberFromAliases(row, BWO_CLOSING_OUTSTANDING_ALIASES);
    }

    const totalBills = rowNumberFromAliases(row, BWO_TOTAL_BILLS_ALIASES);
    const totalAdjusted = rowNumberFromAliases(row, BWO_TOTAL_ADJUSTED_ALIASES);
    if (rowHasFieldFromAliases(row, BWO_TOTAL_BILLS_ALIASES)
        || rowHasFieldFromAliases(row, BWO_TOTAL_ADJUSTED_ALIASES)) {
        return totalBills - totalAdjusted;
    }

    return getMonthWiseNetAmount(row);
}

/**
 * @param {object} row
 * @returns {{ totalBills: number, totalAdjusted: number, closing: number }}
 */
function getMonthTrendDetails(row) {
    const totalBills = rowNumberFromAliases(row, BWO_TOTAL_BILLS_ALIASES);
    const totalAdjusted = rowNumberFromAliases(row, BWO_TOTAL_ADJUSTED_ALIASES);
    return {
        totalBills: totalBills,
        totalAdjusted: totalAdjusted,
        closing: getMonthWiseClosingOutstanding(row),
    };
}

/**
 * Display label for API Month value (e.g. Apr-2026 → Apr 2026).
 * @param {string} monthText
 * @param {boolean} isMobile
 * @returns {string}
 */
function formatMonthTrendDisplayLabel(monthText, isMobile) {
    const key = parseMonthKeyFromValue(monthText);
    if (key) return formatMonthKeyLabel(key, isMobile);
    return String(monthText || '').trim();
}

/**
 * Net outstanding for month-wise row (legacy / fallback rows).
 * @param {object} row
 * @returns {number}
 */
function getMonthWiseNetAmount(row) {
    const outstandingAliases = [
        'Outstanding', 'Net Outstanding', 'NetOutstanding', 'Net_Outstanding',
        'Outstanding Amount', 'OutstandingAmount', 'Outstanding_Amount',
        'Balance', 'NetAmount', 'Net Amount', 'Net_Amount',
    ];
    if (rowHasFieldFromAliases(row, outstandingAliases)) {
        return rowNumberFromAliases(row, outstandingAliases);
    }

    const amt = rowNumberFromAliases(row, ['Amount', 'amount', 'Amt', 'amt']);
    const adj = rowNumberFromAliases(row, [
        'Amount Adjusted', 'AmountAdjusted', 'amountAdjusted', 'Amount_Adjusted', 'AmtAdjusted',
    ]);
    return amt - adj;
}

/**
 * Build month chart series from GetBillMonthWiseOutStandingReport API rows.
 * Uses Month + ClosingOutstanding (TotalBills − TotalAdjusted).
 * @param {Array<object>|null|undefined} rows
 * @param {boolean} isMobile
 * @returns {{ keys: string[], labels: string[], values: number[], rowsByKey: Record<string, object> }}
 */
function aggregateMonthWiseRows(rows, isMobile) {
    /** @type {Record<string, number>} */
    const aggregated = {};
    /** @type {Record<string, string>} */
    const labelByKey = {};
    /** @type {Record<string, object>} */
    const rowsByKey = {};
    const list = Array.isArray(rows) ? rows : [];
    const useApiFormat = list.some(isMonthTrendApiRow);

    for (let i = 0; i < list.length; i++) {
        const row = list[i];
        const key = getBillMonthKeyFromRow(row);
        if (!key) continue;

        const value = useApiFormat
            ? getMonthWiseClosingOutstanding(row)
            : getMonthWiseNetAmount(row);
        aggregated[key] = (aggregated[key] || 0) + value;

        if (!rowsByKey[key]) {
            rowsByKey[key] = row;
        }

        if (!labelByKey[key]) {
            const monthText = rowStringFromAliases(row, BWO_MONTH_TREND_MONTH_ALIASES);
            labelByKey[key] = monthText
                ? formatMonthTrendDisplayLabel(monthText, isMobile)
                : formatMonthKeyLabel(key, isMobile);
        }
    }

    const keys = Object.keys(aggregated).sort();
    return {
        keys: keys,
        labels: keys.map(function (k) { return labelByKey[k] || formatMonthKeyLabel(k, isMobile); }),
        values: keys.map(function (k) { return aggregated[k]; }),
        rowsByKey: rowsByKey,
    };
}

/**
 * Build sorted monthly compare series: Outstanding vs Overdue from API arrays.
 * @param {Array<object>|null|undefined} outstandingRows
 * @param {Array<object>|null|undefined} overdueRows
 * @param {boolean} isMobile
 * @returns {{
 *   keys: string[],
 *   labels: string[],
 *   outstandingValues: number[],
 *   overdueValues: number[],
 *   outstandingRowsByKey: Record<string, object>,
 *   overdueRowsByKey: Record<string, object>,
 * }}
 */
function buildMonthWiseCompareChartSeries(outstandingRows, overdueRows, isMobile) {
    const outAgg = aggregateMonthWiseRows(outstandingRows, isMobile);
    const odAgg = aggregateMonthWiseRows(overdueRows, isMobile);

    /** @type {Record<string, boolean>} */
    const keySet = {};
    outAgg.keys.forEach(function (k) { keySet[k] = true; });
    odAgg.keys.forEach(function (k) { keySet[k] = true; });
    const keys = Object.keys(keySet).sort();

    /** @type {Record<string, number>} */
    const outMap = {};
    /** @type {Record<string, number>} */
    const odMap = {};
    outAgg.keys.forEach(function (k, i) { outMap[k] = outAgg.values[i]; });
    odAgg.keys.forEach(function (k, i) { odMap[k] = odAgg.values[i]; });

    const labels = keys.map(function (k) {
        const row = outAgg.rowsByKey[k] || odAgg.rowsByKey[k];
        const monthText = row ? rowStringFromAliases(row, BWO_MONTH_TREND_MONTH_ALIASES) : '';
        if (monthText) return formatMonthTrendDisplayLabel(monthText, isMobile);
        return formatMonthKeyLabel(k, isMobile);
    });

    return {
        keys: keys,
        labels: labels,
        outstandingValues: keys.map(function (k) { return outMap[k] || 0; }),
        overdueValues: keys.map(function (k) { return odMap[k] || 0; }),
        outstandingRowsByKey: outAgg.rowsByKey,
        overdueRowsByKey: odAgg.rowsByKey,
    };
}

function renderBillWiseDashboard(rows, monthWiseData) {
    destroyDashboardCharts();

    if (!rows.length) {
        setDashboardSectionVisible(false);
        return;
    }

    setDashboardSectionVisible(true);

    let totalOutstanding = 0;
    let sumDelay = 0;
    /** @type {Record<string, number>} */
    const partyOutstanding = {};
    /** @type {Record<string, number>} */
    const salesPersonOutstanding = {};
    /** @type {Record<string, number>} overdue net outstanding per sales person */
    const salesPersonOverdueOutstanding = {};
    /** @type {Record<string, {billed: number, collected: number}>} */
    const partyCollection = {};
    /** @type {Record<string, number>} sum of (DelayDays - CreditDays) where breach > 0 */
    const partyCreditBreach = {};
    let overdueOutstandingAmount = 0;
    let totalBilled = 0;
    let totalCollected = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const amt = rowNumberFromAliases(row, BWO_AMOUNT_ALIASES);
        const adj = rowNumberFromAliases(row, BWO_AMOUNT_ADJUSTED_ALIASES);
        const net = rowNetOutstanding(row);
        totalOutstanding += net;
        totalBilled += amt;
        totalCollected += adj;

        const dd = getRowDelayDaysFromReport(row);
        sumDelay += dd;
        if (dd > 0) {
            overdueOutstandingAmount += net;
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

        const creditDays = getRowCreditDays(row);
        const breach = dd - creditDays;
        if (breach > 0) {
            partyCreditBreach[party] = (partyCreditBreach[party] || 0) + breach;
        }

        const spRaw = row['Person Name'];
        const sp =
            spRaw != null && String(spRaw).trim() !== '' ? String(spRaw).trim() : '(No salesperson)';
        salesPersonOutstanding[sp] = (salesPersonOutstanding[sp] || 0) + net;
        if (dd > 0) {
            salesPersonOverdueOutstanding[sp] = (salesPersonOverdueOutstanding[sp] || 0) + net;
        }
    }

    const bucketData = buildDelayBucketOutstanding(rows);
    const bucketOrder = bucketData.bucketOrder;
    const bucketOutstanding = bucketData.bucketOutstanding;

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
    if (ChartCtor.defaults) {
        ChartCtor.defaults.devicePixelRatio = window.devicePixelRatio || 1;
    }

    function setChartScrollWidth(innerId, widthPx) {
        const inner = document.getElementById(innerId);
        if (inner) {
            inner.style.width = widthPx + 'px';
        }
    }

    function resizeChartAfterLayout(chart, innerId, widthPx) {
        setChartScrollWidth(innerId, widthPx);
        requestAnimationFrame(function () {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    const DL = globalThis.ChartDataLabels ?? null;
    if (DL && typeof ChartCtor.register === 'function') {
        try {
            ChartCtor.register(DL);
        } catch {
            /* already registered */
        }
    }
    const dlPlugins = DL ? [DL] : [];
    const barAnimOff = { duration: 0 };

    const isMobile = window.innerWidth < 576;
    const isTablet = window.innerWidth < 768;
    const dlFontSize = isMobile ? 7 : 10;
    const topBarCount = isMobile ? 6 : 10;
    const yAxisTickFmt = { callback: function (v) { return formatShortInr(v); } };
    const barThickH = isMobile ? 26 : 44;
    const barThickV = isMobile ? 40 : 56;
    const barThickGrouped = isMobile ? 24 : 38;
    const chartBlue = '#3d5cce';
    const chartGreen = '#22c55e';
    const chartViolet = '#5b4fcf';
    const chartRed = '#ef4444';

    function hasChartDataValue(ctx) {
        const v = ctx.dataset.data[ctx.dataIndex];
        return v != null && v !== '';
    }

    /** Fallback for charts that still need outside labels (line chart etc.) */
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

    function truncateChartLabel(name) {
        if (!name) return '';
        const max = isMobile ? 11 : 28;
        const s = String(name).trim();
        if (s.length <= max) return s;
        return s.slice(0, max - 1) + '…';
    }

    function mobileBucketLabel(label) {
        return mobileDelayBucketLabel(label, isMobile);
    }

    function hBarYAxisScale() {
        return {
            ticks: {
                font: { size: isMobile ? 7 : 11 },
                crossAlign: 'far',
                autoSkip: false,
            },
            afterFit(scale) { scale.width = isMobile ? 72 : (isTablet ? 160 : 210); },
        };
    }

    function hBarYAxisScaleWide() {
        return {
            ticks: {
                font: { size: isMobile ? 7 : 11 },
                crossAlign: 'far',
                autoSkip: false,
            },
            afterFit(scale) { scale.width = isMobile ? 88 : (isTablet ? 200 : 260); },
        };
    }

    function buildGroupedHBarDatalabels(outsideLabelColors) {
        const outsideColors = outsideLabelColors || [chartBlue, chartGreen];
        const minInside = isMobile ? 52 : 68;
        return {
            display: function (ctx) {
                return hasChartDataValue(ctx);
            },
            anchor: 'end',
            align: function (ctx) {
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const w = bar ? Math.abs(bar.width ?? 0) : 0;
                return w >= minInside ? 'start' : 'end';
            },
            offset: function (ctx) {
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const w = bar ? Math.abs(bar.width ?? 0) : 0;
                return w >= minInside ? 6 : 5;
            },
            formatter: function (value) {
                const s = formatShortInr(value);
                return isMobile ? s : ('₹ ' + s);
            },
            font: { size: isMobile ? 7 : 9, weight: '700' },
            color: function (ctx) {
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const w = bar ? Math.abs(bar.width ?? 0) : 0;
                if (w >= minInside) return '#ffffff';
                return outsideColors[ctx.datasetIndex] || outsideColors[0];
            },
            backgroundColor: function (ctx) {
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const w = bar ? Math.abs(bar.width ?? 0) : 0;
                return w >= minInside ? null : 'rgba(255,255,255,0.95)';
            },
            borderColor: function (ctx) {
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const w = bar ? Math.abs(bar.width ?? 0) : 0;
                return w >= minInside ? 'transparent' : '#dde4f5';
            },
            borderWidth: function (ctx) {
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const w = bar ? Math.abs(bar.width ?? 0) : 0;
                return w >= minInside ? 0 : 1;
            },
            borderRadius: 3,
            padding: { top: 1, bottom: 1, left: 3, right: 3 },
            clamp: false,
        };
    }

    function buildHBarDatalabels() {
        return {
            display: function (ctx) {
                if (!hasChartDataValue(ctx)) return false;
                if (!isMobile) return true;
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                return bar ? Math.abs(bar.width ?? 0) >= 28 : false;
            },
            anchor: isMobile ? 'end' : 'center',
            align: isMobile ? 'start' : 'center',
            offset: isMobile ? 4 : 0,
            formatter: function (value) {
                const s = formatShortInr(value);
                return isMobile ? s : ('₹ ' + s);
            },
            font: { size: dlFontSize, weight: '700' },
            color: '#ffffff',
            backgroundColor: null,
            borderWidth: 0,
            padding: 0,
            clamp: true,
        };
    }

    function buildVBarDatalabels() {
        return buildSmartVBarDatalabels(['#ffffff']);
    }

    function buildSmartVBarDatalabels(barColors) {
        const minInsideH = isMobile ? 26 : 34;
        return {
            display: function (ctx) {
                const v = ctx.dataset.data[ctx.dataIndex];
                return v != null && v !== '';
            },
            anchor: function (ctx) {
                const v = toNumber(ctx.dataset.data[ctx.dataIndex]);
                if (v <= 0) return 'end';
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const h = bar ? Math.abs(bar.height ?? 0) : 0;
                return h >= minInsideH ? 'center' : 'end';
            },
            align: function (ctx) {
                const v = toNumber(ctx.dataset.data[ctx.dataIndex]);
                if (v <= 0) return 'end';
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const h = bar ? Math.abs(bar.height ?? 0) : 0;
                return h >= minInsideH ? 'center' : 'end';
            },
            offset: function (ctx) {
                const v = toNumber(ctx.dataset.data[ctx.dataIndex]);
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const h = bar ? Math.abs(bar.height ?? 0) : 0;
                if (v <= 0 || h < minInsideH) return 4;
                return 0;
            },
            formatter: function (value) {
                if (value == null || value === '') return isMobile ? '0' : '₹ 0';
                const s = formatShortInr(toNumber(value));
                return isMobile ? s : ('₹ ' + s);
            },
            font: { size: dlFontSize, weight: '700' },
            color: function (ctx) {
                const v = toNumber(ctx.dataset.data[ctx.dataIndex]);
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const h = bar ? Math.abs(bar.height ?? 0) : 0;
                const inside = v > 0 && h >= minInsideH;
                if (inside) return ctx.dataIndex === 2 ? '#1e293b' : '#ffffff';
                return barColors[ctx.dataIndex] || '#1e293b';
            },
            backgroundColor: function (ctx) {
                const v = toNumber(ctx.dataset.data[ctx.dataIndex]);
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const h = bar ? Math.abs(bar.height ?? 0) : 0;
                return (v <= 0 || h < minInsideH) ? 'rgba(255,255,255,0.95)' : null;
            },
            borderColor: function (ctx) {
                const v = toNumber(ctx.dataset.data[ctx.dataIndex]);
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const h = bar ? Math.abs(bar.height ?? 0) : 0;
                return (v <= 0 || h < minInsideH) ? '#dde4f5' : 'transparent';
            },
            borderWidth: function (ctx) {
                const v = toNumber(ctx.dataset.data[ctx.dataIndex]);
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const h = bar ? Math.abs(bar.height ?? 0) : 0;
                return (v <= 0 || h < minInsideH) ? 1 : 0;
            },
            borderRadius: 3,
            padding: { top: 1, bottom: 1, left: 3, right: 3 },
            clamp: false,
        };
    }

    function getMonthlyScalePlan(values) {
        const nums = values.map(function (v) { return toNumber(v); });
        const pos = nums.filter(function (v) { return v > 0; });
        const allMax = pos.length ? Math.max.apply(null, pos) : 0;
        const scaleMax = allMax > 0 ? allMax * 1.08 : 0;
        const yAxis = buildMonthlyYAxisTicks(scaleMax, isMobile ? 9 : 16, 1e7);
        return {
            chartValues: nums,
            yAxis: yAxis,
            yMax: yAxis.suggestedMax,
        };
    }

    function buildMonthlyDatalabels() {
        const minInsideH = isMobile ? 22 : 28;
        return {
            display: function (ctx) {
                return toNumber(ctx.dataset.data[ctx.dataIndex]) > 0;
            },
            anchor: function (ctx) {
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const h = bar ? Math.abs(bar.height ?? 0) : 0;
                return h >= minInsideH ? 'center' : 'end';
            },
            align: function (ctx) {
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const h = bar ? Math.abs(bar.height ?? 0) : 0;
                return h >= minInsideH ? 'center' : 'end';
            },
            offset: function (ctx) {
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const h = bar ? Math.abs(bar.height ?? 0) : 0;
                return h >= minInsideH ? 0 : 4;
            },
            formatter: function (value) {
                const s = formatInr(toNumber(value));
                return isMobile ? s : ('₹ ' + s);
            },
            font: { size: isMobile ? 7 : 9, weight: '700' },
            color: function (ctx) {
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const h = bar ? Math.abs(bar.height ?? 0) : 0;
                return h >= minInsideH ? '#ffffff' : chartBlue;
            },
            backgroundColor: function (ctx) {
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const h = bar ? Math.abs(bar.height ?? 0) : 0;
                return h >= minInsideH ? null : 'rgba(255,255,255,0.95)';
            },
            borderColor: function (ctx) {
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const h = bar ? Math.abs(bar.height ?? 0) : 0;
                return h >= minInsideH ? 'transparent' : '#dde4f5';
            },
            borderWidth: function (ctx) {
                const bar = ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.dataIndex];
                const h = bar ? Math.abs(bar.height ?? 0) : 0;
                return h >= minInsideH ? 0 : 1;
            },
            borderRadius: 3,
            padding: { top: 1, bottom: 1, left: 3, right: 3 },
            clamp: false,
        };
    }

    const bucketDisplayLabels = bucketOrder.map(mobileBucketLabel);
    const bucketValues = bucketOrder.map((b) => Math.max(0, bucketOutstanding[b] || 0));
    const bucketPalette = ['#198754', '#20c997', '#ffc107', '#fd7e14', '#dc3545', '#6f42c1', '#0d6efd', '#6610f2', '#d63384', '#198754'];
    const bucketColors = bucketOrder.map(function (_b, idx) {
        return bucketPalette[idx % bucketPalette.length];
    });

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
                labels: bucketDisplayLabels,
                datasets: [{
                    label: 'Net outstanding',
                    data: bucketValues,
                    backgroundColor: bucketColors,
                    borderWidth: 0,
                    borderRadius: 4,
                    maxBarThickness: barThickV,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: barAnimOff,
                layout: { padding: { top: isMobile ? 28 : 36 } },
                plugins: {
                    legend: { display: false },
                    tooltip: commonTooltip,
                    datalabels: buildSmartVBarDatalabels(bucketColors),
                },
                scales: {
                    x: {
                        ticks: {
                            maxRotation: isMobile ? 0 : 45,
                            minRotation: isMobile ? 0 : 0,
                            font: { size: dlFontSize },
                        },
                    },
                    y: { beginAtZero: true, ticks: Object.assign({ font: { size: dlFontSize } }, yAxisTickFmt) },
                },
            },
        });
        delayBucketChartInstance = chartDelay;
        dashboardChartInstances.push(chartDelay);
    }

    /* ── Top 10 Parties (horizontal bar) ── */
    const partyEntries = Object.entries(partyOutstanding)
        .filter(([, v]) => v !== 0)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, topBarCount);
    const partyFullNames = partyEntries.map(([name]) => name);
    const partyLabels = partyFullNames.map(truncateChartLabel);
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
                    backgroundColor: chartBlue,
                    borderWidth: 0,
                    borderRadius: 4,
                    maxBarThickness: barThickH,
                    hoverBackgroundColor: chartBlue,
                }],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: barAnimOff,
                layout: { padding: { right: isMobile ? 4 : 12 } },
                plugins: {
                    legend: { display: false },
                    tooltip: partyTooltip,
                    datalabels: buildHBarDatalabels(),
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: Object.assign({
                            font: { size: dlFontSize },
                            maxTicksLimit: isMobile ? 4 : 11,
                        }, yAxisTickFmt),
                    },
                    y: hBarYAxisScale(),
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
        .slice(0, topBarCount);
    const spFullNames = spEntries.map(([name]) => name);
    const spLabels = spFullNames.map(truncateChartLabel);
    const spValues = spEntries.map(([, v]) => v);
    const spOverdueValues = spEntries.map(function (entry) {
        return salesPersonOverdueOutstanding[entry[0]] || 0;
    });

    if (canvasSalesPerson && spLabels.length) {
        const spTooltip = {
            callbacks: {
                title(items) {
                    const idx = items[0]?.dataIndex;
                    return idx != null ? (spFullNames[idx] || spLabels[idx]) : '';
                },
                label(ctx) {
                    return ' ' + ctx.dataset.label + ': ₹ ' + formatInr(ctx.raw);
                },
            },
        };
        const chartSp = new ChartCtor(canvasSalesPerson, {
            type: 'bar',
            plugins: dlPlugins,
            data: {
                labels: spLabels,
                datasets: [
                    {
                        label: 'Outstanding Amount',
                        data: spValues,
                        backgroundColor: chartViolet,
                        borderWidth: 0,
                        borderRadius: 4,
                        maxBarThickness: barThickGrouped,
                        barPercentage: 0.88,
                        categoryPercentage: 0.92,
                        hoverBackgroundColor: chartViolet,
                    },
                    {
                        label: 'OverDue Amount',
                        data: spOverdueValues,
                        backgroundColor: chartRed,
                        borderWidth: 0,
                        borderRadius: 4,
                        maxBarThickness: barThickGrouped,
                        barPercentage: 0.88,
                        categoryPercentage: 0.92,
                        hoverBackgroundColor: chartRed,
                    },
                ],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: barAnimOff,
                layout: { padding: { left: 4, right: isMobile ? 56 : 88, top: 4 } },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 10, font: { size: dlFontSize }, padding: isMobile ? 8 : 12 },
                    },
                    tooltip: spTooltip,
                    datalabels: buildGroupedHBarDatalabels([chartViolet, chartRed]),
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: Object.assign({
                            font: { size: dlFontSize },
                            maxTicksLimit: isMobile ? 5 : 11,
                        }, yAxisTickFmt),
                    },
                    y: hBarYAxisScale(),
                },
            },
        });
        dashboardChartInstances.push(chartSp);
    } else if (canvasSalesPerson) {
        const ctxSp = canvasSalesPerson.getContext('2d');
        if (ctxSp) ctxSp.clearRect(0, 0, canvasSalesPerson.width, canvasSalesPerson.height);
    }

    /* ── Monthly Trend compare: Outstanding vs Overdue (GetBillMonthWiseOutStandingReport) ── */
    const canvasMonthly = document.getElementById('chartBillWiseMonthlyTrend');
    const monthApiData = monthWiseData != null ? monthWiseData : lastMonthWiseData;
    const monthSeries = buildMonthWiseCompareChartSeries(
        monthApiData && monthApiData.outstanding ? monthApiData.outstanding : [],
        monthApiData && monthApiData.overdue ? monthApiData.overdue : [],
        isMobile
    );
    const monthlyLabels = monthSeries.labels;
    const monthlyOutValues = monthSeries.outstandingValues;
    const monthlyOdValues = monthSeries.overdueValues;

    if (canvasMonthly && monthlyLabels.length) {
        const allMonthlyValues = monthlyOutValues.concat(monthlyOdValues);
        const scalePlan = getMonthlyScalePlan(allMonthlyValues);
        const monthLabelStep = monthlyLabels.length > 24 ? 2 : 1;
        const monthCanvasMinWidth = Math.max(
            isMobile ? 480 : 900,
            monthlyLabels.length * (isMobile ? 72 : 96)
        );

        const monthlyYTicks = scalePlan.yAxis.tickValues;
        const monthlyYMax = scalePlan.yMax;

        function buildMonthlyTrendLineDatalabels() {
            const labelOffset = isMobile ? 28 : 36;
            return {
                display: function (ctx) {
                    return toNumber(ctx.dataset.data[ctx.dataIndex]) >= 0;
                },
                anchor: 'end',
                align: 'bottom',
                offset: function (ctx) {
                    const chart = ctx.chart;
                    const area = chart.chartArea;
                    const meta = chart.getDatasetMeta(ctx.datasetIndex);
                    const pt = meta.data[ctx.dataIndex];
                    if (!pt || !area) return labelOffset;
                    const gapBelowPoint = pt.y - area.bottom;
                    return Math.max(labelOffset, gapBelowPoint + labelOffset + (ctx.datasetIndex === 1 ? 16 : 0));
                },
                formatter: function (value) {
                    return '₹ ' + formatInr(toNumber(value));
                },
                font: { size: isMobile ? 6 : 8, weight: '700' },
                color: function (ctx) {
                    return ctx.datasetIndex === 0 ? chartBlue : chartRed;
                },
                backgroundColor: 'rgba(255,255,255,0.96)',
                borderColor: function (ctx) {
                    return ctx.datasetIndex === 0 ? '#c7d4f5' : '#fecaca';
                },
                borderWidth: 1,
                borderRadius: 4,
                padding: { top: 2, bottom: 2, left: isMobile ? 3 : 5, right: isMobile ? 3 : 5 },
                clamp: false,
            };
        }

        const monthlyTooltip = {
            mode: 'index',
            intersect: false,
            callbacks: {
                title: function (items) {
                    const idx = items[0]?.dataIndex;
                    return idx != null ? (monthlyLabels[idx] || '') : '';
                },
                label: function (ctx) {
                    const idx = ctx.dataIndex;
                    const key = monthSeries.keys[idx];
                    const isOverdue = ctx.datasetIndex === 1;
                    const apiRow = key != null
                        ? (isOverdue ? monthSeries.overdueRowsByKey[key] : monthSeries.outstandingRowsByKey[key])
                        : null;
                    const seriesLabel = ctx.dataset.label || '';
                    if (apiRow && isMonthTrendApiRow(apiRow)) {
                        const d = getMonthTrendDetails(apiRow);
                        return [
                            ' ' + seriesLabel,
                            ' Total Bills: ₹ ' + formatInr(d.totalBills),
                            ' Total Adjusted: ₹ ' + formatInr(d.totalAdjusted),
                            ' Closing Outstanding: ₹ ' + formatInr(d.closing),
                        ];
                    }
                    return ' ' + seriesLabel + ': ₹ ' + formatInr(toNumber(ctx.raw));
                },
            },
        };

        const chartMonthly = new ChartCtor(canvasMonthly, {
            type: 'line',
            plugins: dlPlugins,
            data: {
                labels: monthlyLabels,
                datasets: [{
                    label: 'Outstanding',
                    data: monthlyOutValues,
                    borderColor: chartBlue,
                    backgroundColor: chartBlue,
                    pointBackgroundColor: chartBlue,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: isMobile ? 3 : 5,
                    pointHoverRadius: isMobile ? 5 : 7,
                    borderWidth: isMobile ? 2 : 2.5,
                    tension: 0.35,
                    fill: false,
                }, {
                    label: 'Overdue Outstanding',
                    data: monthlyOdValues,
                    borderColor: chartRed,
                    backgroundColor: chartRed,
                    pointBackgroundColor: chartRed,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: isMobile ? 3 : 5,
                    pointHoverRadius: isMobile ? 5 : 7,
                    borderWidth: isMobile ? 2 : 2.5,
                    tension: 0.35,
                    fill: false,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: barAnimOff,
                devicePixelRatio: window.devicePixelRatio || 1,
                interaction: { mode: 'index', intersect: false },
                layout: {
                    padding: {
                        top: isMobile ? 28 : 36,
                        right: isMobile ? 8 : 16,
                        bottom: isMobile ? 56 : 72,
                        left: 4,
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: { boxWidth: 14, usePointStyle: true, font: { size: isMobile ? 8 : 10 }, padding: isMobile ? 8 : 12 },
                    },
                    tooltip: monthlyTooltip,
                    datalabels: buildMonthlyTrendLineDatalabels(),
                },
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: {
                            maxRotation: isMobile ? 45 : 0,
                            minRotation: isMobile ? 45 : 0,
                            font: { size: isMobile ? 8 : 10, weight: '600' },
                            autoSkip: false,
                            color: '#64748b',
                            callback: function (value, index) {
                                if (monthLabelStep > 1 && index % monthLabelStep !== 0 && index !== monthlyLabels.length - 1) {
                                    return '';
                                }
                                return monthlyLabels[index] ?? this.getLabelForValue(value);
                            },
                        },
                    },
                    y: {
                        type: 'linear',
                        beginAtZero: true,
                        min: 0,
                        max: monthlyYMax,
                        bounds: 'ticks',
                        grace: '0%',
                        border: { display: false },
                        grid: { color: 'rgba(221, 228, 245, 0.85)', drawBorder: false },
                        ticks: {
                            font: { size: isMobile ? 8 : 10 },
                            color: '#64748b',
                            autoSkip: false,
                            maxTicksLimit: monthlyYTicks.length + 2,
                            afterBuildTicks: function (axis) {
                                axis.ticks = monthlyYTicks.map(function (v) {
                                    return { value: v };
                                });
                            },
                            callback: function (v) {
                                return formatInr(v);
                            },
                        },
                    },
                },
            },
        });
        dashboardChartInstances.push(chartMonthly);
        resizeChartAfterLayout(chartMonthly, 'billWiseMonthlyChartInner', monthCanvasMinWidth);
    } else if (canvasMonthly) {
        const ctxMonthly = canvasMonthly.getContext('2d');
        if (ctxMonthly) ctxMonthly.clearRect(0, 0, canvasMonthly.width, canvasMonthly.height);
    }

    /* ── Collection Efficiency — Billed vs Collected (top 10 by billed) ── */
    const canvasColEff = document.getElementById('chartBillWiseCollectionEff');
    const colEffEntries = Object.entries(partyCollection)
        .sort(function (a, b) { return b[1].billed - a[1].billed; })
        .slice(0, topBarCount);
    const colEffFullNames = colEffEntries.map(function (e) { return e[0]; });
    const colEffLabels = colEffFullNames.map(truncateChartLabel);
    const colEffBilled    = colEffEntries.map(function (e) { return e[1].billed; });
    const colEffCollected = colEffEntries.map(function (e) { return e[1].collected; });

    if (canvasColEff && colEffLabels.length) {
        const amtTooltip = {
            callbacks: {
                title: function (items) {
                    const idx = items[0]?.dataIndex;
                    return idx != null ? (colEffFullNames[idx] || colEffLabels[idx]) : '';
                },
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
                    {
                        label: 'Billed',
                        data: colEffBilled,
                        backgroundColor: chartBlue,
                        borderWidth: 0,
                        borderRadius: 4,
                        maxBarThickness: barThickGrouped,
                        barPercentage: 0.88,
                        categoryPercentage: 0.92,
                        hoverBackgroundColor: chartBlue,
                    },
                    {
                        label: 'Collected',
                        data: colEffCollected,
                        backgroundColor: chartGreen,
                        borderWidth: 0,
                        borderRadius: 4,
                        maxBarThickness: barThickGrouped,
                        barPercentage: 0.88,
                        categoryPercentage: 0.92,
                        hoverBackgroundColor: chartGreen,
                    },
                ],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: barAnimOff,
                layout: { padding: { left: 4, right: isMobile ? 56 : 88, top: 4 } },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 10, font: { size: dlFontSize }, padding: isMobile ? 8 : 12 },
                    },
                    tooltip: amtTooltip,
                    datalabels: buildGroupedHBarDatalabels(),
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: Object.assign({
                            font: { size: dlFontSize },
                            maxTicksLimit: isMobile ? 5 : 11,
                        }, yAxisTickFmt),
                    },
                    y: hBarYAxisScaleWide(),
                },
            },
        });
        dashboardChartInstances.push(chartColEff);
        resizeChartAfterLayout(chartColEff, 'billWiseCollectionChartInner', isMobile ? 720 : 980);
    }

    /* ── Credit Breach — top 10 parties by sum of excess delay days ── */
    const canvasBreach = document.getElementById('chartBillWiseCreditBreach');
    const breachEntries = Object.entries(partyCreditBreach)
        .sort(function (a, b) { return b[1] - a[1]; })
        .slice(0, topBarCount);
    const breachFullNames = breachEntries.map(function (e) { return e[0]; });
    const breachLabels = breachFullNames.map(truncateChartLabel);
    const breachValues = breachEntries.map(function (e) { return e[1]; });

    if (canvasBreach && breachLabels.length) {
        const daysTooltip = {
            callbacks: {
                title: function (items) {
                    const idx = items[0]?.dataIndex;
                    return idx != null ? (breachFullNames[idx] || breachLabels[idx]) : '';
                },
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
                    backgroundColor: chartRed,
                    borderWidth: 0,
                    borderRadius: 4,
                    maxBarThickness: barThickH,
                    hoverBackgroundColor: chartRed,
                }],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: barAnimOff,
                layout: { padding: { right: isMobile ? 4 : 12 } },
                plugins: {
                    legend: { display: false },
                    tooltip: daysTooltip,
                    datalabels: Object.assign({}, buildHBarDatalabels(), {
                        formatter: function (value) { return value + 'd'; },
                    }),
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            font: { size: dlFontSize },
                            maxTicksLimit: isMobile ? 4 : 11,
                        },
                    },
                    y: hBarYAxisScale(),
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
 * Cr. Days source: Y = From Master, N = From Invoice, W = Without Credit Limit.
 * @returns {'Y'|'N'|'W'}
 */
function creditDaysFromMasterForApi() {
    const sel = document.querySelector('#bill-wise-outstanding-report input[name="billWiseCrDaysFrom"]:checked');
    if (!sel) return 'Y';
    const v = String(sel.value || '').trim().toUpperCase();
    if (v === 'N') return 'N';
    if (v === 'W') return 'W';
    return 'Y';
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
    const candidates = ['Data', 'data', 'Items', 'items', 'Rows', 'rows', 'Result', 'result', 'Table', 'table', 'List', 'list'];
    for (const key of candidates) {
        if (response[key] != null && Array.isArray(response[key])) return response[key];
    }
    return [];
}

/**
 * Parse GetBillMonthWiseOutStandingReport response:
 * { OutStandingAmount: [...], OverDueOutStandingAmout: [...] }
 * @param {*} response
 * @returns {{ outstanding: Array<object>, overdue: Array<object> }}
 */
function normalizeMonthWiseApiResponse(response) {
    if (!response) {
        return { outstanding: [], overdue: [] };
    }
    if (Array.isArray(response)) {
        return { outstanding: response, overdue: [] };
    }

    function pickArray(obj, keys) {
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (obj[k] != null && Array.isArray(obj[k])) return obj[k];
        }
        const want = new Set(keys.map(normalizeFieldName));
        const objKeys = Object.keys(obj);
        for (let j = 0; j < objKeys.length; j++) {
            const k = objKeys[j];
            if (want.has(normalizeFieldName(k)) && Array.isArray(obj[k])) return obj[k];
        }
        return null;
    }

    const outstanding = pickArray(response, [
        'OutStandingAmount', 'OutstandingAmount', 'OutStanding_Amount',
        'outStandingAmount', 'outstandingAmount',
    ]) || normalizeReportRows(response);

    const overdue = pickArray(response, [
        'OverDueOutStandingAmout', 'OverDueOutStandingAmount', 'OverdueOutStandingAmount',
        'OverDueOutstandingAmount', 'overDueOutStandingAmout', 'overDueOutStandingAmount',
    ]) || [];

    return {
        outstanding: outstanding || [],
        overdue: overdue || [],
    };
}

/**
 * @param {object} row
 * @returns {string}
 */
function getRowCode(row) {
    const code = rowStringFromAliases(row, BWO_CODE_ALIASES);
    if (code) return code;
    return '';
}

/**
 * Write grouped Amount / Adjusted / Balance / Outstanding onto a row (keeps API column names).
 * @param {object} row
 * @param {number} amount
 * @param {number} sumAdjusted
 * @param {number} balance
 */
function applyGroupedAmountsToRow(row, amount, sumAdjusted, balance) {
    function setAliases(aliases, value) {
        const want = new Set(aliases.map(normalizeFieldName));
        const keys = Object.keys(row);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (want.has(normalizeFieldName(k))) {
                row[k] = value;
            }
        }
        for (let j = 0; j < aliases.length; j++) {
            if (Object.prototype.hasOwnProperty.call(row, aliases[j])) {
                row[aliases[j]] = value;
            }
        }
    }

    setAliases(BWO_AMOUNT_ALIASES, amount);
    setAliases(BWO_AMOUNT_ADJUSTED_ALIASES, sumAdjusted);
    setAliases(BWO_BALANCE_ALIASES, balance);
    setAliases(BWO_OUTSTANDING_ALIASES, balance);
}

/**
 * Group report rows by Code: one row per bill.
 * Amount = bill amount (max per code), Amount Adjusted = sum, Balance = Outstanding = Amount − sum adjusted.
 * @param {Array<object>} rows
 * @returns {Array<object>}
 */
function groupReportRowsByCode(rows) {
    if (!rows || !rows.length) return [];

    /** @type {Record<string, { rows: object[] }>} */
    const groups = {};

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const code = getRowCode(row);
        const key = code !== '' ? code : '__row_' + i;
        if (!groups[key]) {
            groups[key] = { rows: [] };
        }
        groups[key].rows.push(row);
    }

    const out = [];
    const groupKeys = Object.keys(groups);
    for (let g = 0; g < groupKeys.length; g++) {
        const groupRows = groups[groupKeys[g]].rows;
        let rep = groupRows[0];
        let billAmount = 0;
        let sumAdjusted = 0;

        for (let j = 0; j < groupRows.length; j++) {
            const r = groupRows[j];
            const amt = rowNumberFromAliases(r, BWO_AMOUNT_ALIASES);
            const adj = rowNumberFromAliases(r, BWO_AMOUNT_ADJUSTED_ALIASES);
            if (amt >= billAmount) {
                billAmount = amt;
                rep = r;
            }
            sumAdjusted += adj;
        }

        const balance = billAmount - sumAdjusted;
        const merged = Object.assign({}, rep);
        applyGroupedAmountsToRow(merged, billAmount, sumAdjusted, balance);
        merged['Balance'] = balance;
        merged['Outstanding'] = balance;
        out.push(merged);
    }

    return out;
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

function clearReportTableDom() {
    const thead = document.getElementById('table-header');
    const tbody = document.getElementById('table-body');
    const tfoot = document.getElementById('table-footer');
    const paginator = document.getElementById('paginator-tblReport');
    const tbl = document.getElementById('tblReport');
    if (thead) thead.innerHTML = '';
    if (tbody) tbody.innerHTML = '';
    if (tfoot) tfoot.innerHTML = '';
    if (paginator) paginator.innerHTML = '';
    if (tbl) {
        tbl.classList.remove('bwo-ageing-table');
        tbl.classList.add('fixed-width-table', 'table');
    }
}

function clearReportTable() {
    clearDashboardUi();
    setAgeingReportUiVisible(false);
    setDownloadButtonVisible(false);
    clearReportTableDom();
}

/**
 * Render based on Status dropdown (Dashboard charts + bill grid, or Ageing Report matrix).
 * @param {Array<object>} rows
 * @param {{ outstanding: Array<object>, overdue: Array<object> }|null} monthWiseData
 */
function renderLoadedReport(rows, monthWiseData) {
    if (getReportStatus() === 'AgeingReport') {
        renderAgeingReportGrid(rows || []);
        return;
    }
    renderReportGrid(rows || [], monthWiseData);
}

function renderReportGrid(rows, monthWiseData) {
    clearReportTable();
    setAgeingReportUiVisible(false);
    if (!rows.length) {
        toastr.info('No records found.');
        renderBillWiseDashboard([], monthWiseData || { outstanding: [], overdue: [] });
        return;
    }

    // Detect party column name from first row (Client Name or Vendor Name)
    const firstRow = rows[0] || {};
    const partyColName = firstRow.hasOwnProperty('Client Name') ? 'Client Name' : 'Vendor Name';

    const StringFilterColumn = [partyColName, 'Person Name'];
    const NumericFilterColumn = [
        'Amount', 'Amount Adjusted', 'Balance', 'Outstanding',
        'Credit Days', 'Delay Days', 'DelayDays',
    ];
    const DateFilterColumn = ['Entry Date', 'Bill Date'];
    const StringdoubleFilterColumn = [];
    // Dashboard: hide GSTN No (Ageing Report shows it via renderAgeingReportGrid)
    const HiddenColumns = ['Code'].concat(gstnHiddenColumnNames(firstRow));
    const ColumnAlignment = {
        'Amount': 'right',
        'Credit Days': 'right',
        'Delay Days': 'right',
        'DelayDays': 'right',
        'Amount Adjusted': 'right',
        'Balance': 'right',
        'Outstanding': 'right',
    };
    const Button = false;
    const showButtons = [];
    const Total = [
        'Amount Adjusted',
        'Amount',
        'Balance',
        'Outstanding',
    ];

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
    renderBillWiseDashboard(rows, monthWiseData);
}

function ShowData() {
    if (!validateFilters()) return;

    const marketingManMasterCode = marketingManFilterCodeForApi();
    const accountMasterCode = accountFilterCodeForApi();
    const asonDate = getAsonDateString();
    const groupTypeCode = debtorCreditorFilterForApi();
    const creditDaysFromMaster = creditDaysFromMasterForApi();

    if (typeof Showloader === 'function') Showloader();

    Promise.all([
        BillWiseOutStandingReportService.GetBillWiseOutStandingReport(
            marketingManMasterCode,
            accountMasterCode,
            asonDate,
            groupTypeCode,
            creditDaysFromMaster
        ),
        BillWiseOutStandingReportService.GetBillMonthWiseOutStandingReport(
            marketingManMasterCode,
            accountMasterCode,
            asonDate,
            groupTypeCode,
            creditDaysFromMaster
        ).catch(function () {
            return { outstanding: [], overdue: [] };
        }),
    ])
        .then(function (results) {
            const response = results[0];
            const monthResponse = results[1];
            const raw = normalizeReportRows(response);
            const filtered = applyDebtorCreditorClientFilter(raw, groupTypeCode);
            lastReportRows = groupReportRowsByCode(applyPartyNameTransform(filtered, groupTypeCode));
            lastMonthWiseData = normalizeMonthWiseApiResponse(monthResponse);
            renderLoadedReport(lastReportRows, lastMonthWiseData);
        })
        .catch(function () {
            lastReportRows = null;
            lastMonthWiseData = null;
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
    const sheetName = getReportStatus() === 'AgeingReport' ? 'Ageing Report' : 'Bill Wise Outstanding';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
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
    const filePrefix = getReportStatus() === 'AgeingReport' ? 'AgeingReport' : 'BillWiseOutStandingReport';
    XLSX.writeFile(wb, `${filePrefix}_${stamp}.xlsx`);
}

document.getElementById('btnShow')?.addEventListener('click', () => {
    ShowData();
});

document.getElementById('btnBillWiseAgeingParamChart')?.addEventListener('click', function () {
    ShowAgeingParameterModal(false);
});

document.getElementById('btnBillWiseAgeingParamTable')?.addEventListener('click', function () {
    ShowAgeingParameterModal(false);
});

document.getElementById('btnDownload')?.addEventListener('click', () => {
    downloadExcel();
});

document.getElementById('ddlBillWiseReportStatus')?.addEventListener('change', function () {
    if (lastReportRows && lastReportRows.length) {
        renderLoadedReport(lastReportRows, lastMonthWiseData);
    } else {
        clearReportTable();
    }
});

window.ShowAgeingParameterModal = ShowAgeingParameterModal;
window.onBillWiseAgeingParameterSelected = onAgeingParameterSelected;

$(function () {
    const todayEl = document.getElementById('txtAsOnDate');
    if (todayEl && !todayEl.value) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        todayEl.value = `${yyyy}-${mm}-${dd}`;
    }

    loadDefaultAgeingParameterFromDb();

    // Load GroupTypeMaster first so the toggle is ready before Account dropdown loads
    loadGroupTypeMaster().then(function () {
        loadMarketingManDropdown();
        loadAccountDropdown(0);
    });

    $(document).on('change', 'input[name="billWiseDrCr"]', function () {
        // Reload both salesperson and account lists when Debtors/Creditors changes
        loadMarketingManDropdown();
        loadAccountDropdown(0);
        if (getReportStatus() === 'AgeingReport' && lastReportRows && lastReportRows.length) {
            renderAgeingReportGrid(lastReportRows);
        }
    });

    $(document).on('change', 'input[name="bwoDelayBucketDateMode"]', function () {
        refreshDelayBucketChartOnly();
    });

    $(document).on('change', 'input[name="bwoAgeingTableDateMode"]', function () {
        if (getReportStatus() === 'AgeingReport' && lastReportRows && lastReportRows.length) {
            renderAgeingReportGrid(lastReportRows);
        }
    });
});
