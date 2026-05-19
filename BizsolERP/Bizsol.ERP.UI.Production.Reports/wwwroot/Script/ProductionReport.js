import { MillWiseProductionReport } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_MillWiseProductionReportService.js';

/*
 * API returns an object:
 *   {
 *     DateWiseYeild           : [ { ProductionDate, {MACHINE}_{SHIFT}_Production, {MACHINE}_{SHIFT}_Yield, … } ],
 *     MonthWiseAverageYeild   : [ { PeriodLabel, WeekNo, WeekStart, WeekEnd, ShiftCount, [MACHINE]: avgYield, … } ],
 *     MonthWiseAverageRedYeild: [ { PeriodLabel, WeekNo, WeekStart, TotalShifts, [MACHINE]: redCount, … } ]
 *   }
 */

const YIELD_GREEN = 99.0;   // > 99  → green
const YIELD_AMBER = 98.0;   // 98–99 → yellow  |  < 98 → red

/* ── small helpers ── */
function pad2(n) { return String(n).padStart(2, '0'); }

function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function fyStartStr() {
    const d = new Date();
    const yr = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
    return yr + '-04-01';
}
function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d) ? iso : pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
}
function toNum(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }
function fmtProd(v) {
    const n = toNum(v);
    return n === null ? '—' : n.toFixed(3);
}
function fmtYield(v) {
    const n = toNum(v);
    return n === null ? '—' : n.toFixed(2) + '%';
}
function yieldCls(v) {
    const n = toNum(v);
    if (n === null || n === 0) return '';
    if (n > YIELD_GREEN)  return 'yield-green';   // > 99
    if (n >= YIELD_AMBER) return 'yield-amber';   // 98 – 99
    return 'yield-red';                           // < 98
}
/** "DAY" → "Day",  "NORMAL" → "Normal" */
function titleCase(s) {
    return String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase();
}

/*
 * Parse one value column name → { mill, shift, type }
 * Pattern: {MACHINE}_{SHIFT}_{Type}
 *   MILL-1_DAY_Production   → { mill:"MILL-1",       shift:"DAY",   type:"Production" }
 *   PIPECUTTER-1_NIGHT_Yield→ { mill:"PIPECUTTER-1", shift:"NIGHT", type:"Yield" }
 */
function parseCol(col) {
    const parts = col.split('_');
    if (parts.length < 3) return null;
    const type  = parts[parts.length - 1];
    const shift = parts[parts.length - 2];
    const mill  = parts.slice(0, parts.length - 2).join('_');
    if (!mill || !shift || !type) return null;
    return { mill, shift, type };
}

/* ── Fixed column sets for summary tables ── */
const SKIP_AVG = new Set(['periodlabel', 'weekno', 'weekstart', 'weekend', 'shiftcount']);
const SKIP_RED = new Set(['periodlabel', 'weekno', 'weekstart', 'totalshifts']);

function renderDailyTable(dailyRows) {
    if (!dailyRows || !dailyRows.length) return;

    const allKeys = Object.keys(dailyRows[0]);

    const SKIP = new Set(['productiondate']);
    const valueCols = allKeys.filter(k => !SKIP.has(k.toLowerCase()));

    const millOrder  = [];
    const millShifts = {};

    valueCols.forEach(col => {
        const p = parseCol(col);
        if (!p || p.type.toLowerCase() !== 'production') return;
        if (!millShifts[p.mill]) { millShifts[p.mill] = []; millOrder.push(p.mill); }
        if (!millShifts[p.mill].includes(p.shift)) millShifts[p.mill].push(p.shift);
    });

    if (!millOrder.length) { return; }

    let thead = '<tr>';
    thead += '<th rowspan="2" style="vertical-align:middle; min-width:95px;">Date</th>';
    thead += '<th rowspan="2" style="vertical-align:middle; min-width:80px;">Type</th>';
    millOrder.forEach(mill => {
        const span = millShifts[mill].length;
        thead += `<th class="th-mill" colspan="${span}">${mill}</th>`;
    });
    thead += '</tr><tr>';
    millOrder.forEach(mill => {
        millShifts[mill].forEach(shift => {
            thead += `<th>${titleCase(shift)}</th>`;
        });
    });
    thead += '</tr>';

    const keyAlias = {};
    allKeys.forEach(k => { keyAlias[k.toLowerCase()] = k; });
    function rowVal(row, mill, shift, type) {
        const exact = `${mill}_${shift}_${type}`;
        if (exact in row) return row[exact];
        const alias = keyAlias[exact.toLowerCase()];
        return alias ? row[alias] : undefined;
    }

    const dateKey = keyAlias['productiondate'] || 'ProductionDate';
    let tbody = '';

    dailyRows.forEach(row => {
        const dateLabel = fmtDate(row[dateKey]);

        tbody += '<tr>';
        tbody += `<td class="td-date" rowspan="2">${dateLabel}</td>`;
        tbody += `<td class="td-row-label">Production</td>`;
        millOrder.forEach(mill => {
            millShifts[mill].forEach(shift => {
                const v = rowVal(row, mill, shift, 'Production');
                tbody += `<td class="td-num">${fmtProd(v)}</td>`;
            });
        });
        tbody += '</tr>';

        tbody += '<tr>';
        tbody += `<td class="td-row-label">Yield</td>`;
        millOrder.forEach(mill => {
            millShifts[mill].forEach(shift => {
                const v = rowVal(row, mill, shift, 'Yield');
                tbody += `<td class="td-num ${yieldCls(v)}">${fmtYield(v)}</td>`;
            });
        });
        tbody += '</tr>';
    });

    document.getElementById('pr-thead').innerHTML = thead;
    document.getElementById('pr-tbody').innerHTML = tbody;
    document.getElementById('tblProductionReport').classList.remove('d-none');
    document.getElementById('pr-placeholder').style.display = 'none';
}

/* ─────────────────────────────────────────────────────────────
   renderAvgYieldTables  –  MonthWiseAverageYeild
   Groups by PeriodLabel; one bordered table per month.
   ───────────────────────────────────────────────────────────── */
function renderAvgYieldTables(avgRows) {
    const container = document.getElementById('avg-yield-container');
    if (!container) return;
    if (!avgRows || !avgRows.length) { container.innerHTML = ''; return; }

    /* Discover machine columns dynamically */
    const machineCols = Object.keys(avgRows[0]).filter(k => !SKIP_AVG.has(k.toLowerCase()));

    /* Group by PeriodLabel */
    const groups = {};
    const groupOrder = [];
    avgRows.forEach(row => {
        const label = row.PeriodLabel || '';
        if (!groups[label]) { groups[label] = []; groupOrder.push(label); }
        groups[label].push(row);
    });

    let html = '';
    groupOrder.forEach(label => {
        const rows = groups[label];
        html += `<div class="sum-table-wrap">`;
        html += `<div class="sum-table-title">YIELD AVERAGE - ${label}</div>`;
        html += `<table class="tbl-sum"><thead><tr>`;
        html += `<th>WEEK</th>`;
        machineCols.forEach(m => { html += `<th>${m}</th>`; });
        html += `</tr></thead><tbody>`;
        rows.forEach(row => {
            html += `<tr><td class="td-week">${row.WeekNo || ''}</td>`;
            machineCols.forEach(m => {
                const v = toNum(row[m]);
                const cls = yieldCls(v);
                html += `<td class="td-num ${cls}">${fmtYield(v)}</td>`;
            });
            html += `</tr>`;
        });
        html += `</tbody></table></div>`;
    });

    container.innerHTML = html;
    document.getElementById('pr-summary-section').classList.remove('d-none');
}

/* ─────────────────────────────────────────────────────────────
   renderRedYieldTables  –  MonthWiseAverageRedYeild
   Groups by PeriodLabel; one bordered table per month.
   ───────────────────────────────────────────────────────────── */
function renderRedYieldTables(redRows) {
    const container = document.getElementById('red-yield-container');
    if (!container) return;
    if (!redRows || !redRows.length) { container.innerHTML = ''; return; }

    const machineCols = Object.keys(redRows[0]).filter(k => !SKIP_RED.has(k.toLowerCase()));

    const groups = {};
    const groupOrder = [];
    redRows.forEach(row => {
        const label = row.PeriodLabel || '';
        if (!groups[label]) { groups[label] = []; groupOrder.push(label); }
        groups[label].push(row);
    });

    let html = '';
    groupOrder.forEach(label => {
        const rows = groups[label];
        html += `<div class="sum-table-wrap">`;
        html += `<div class="sum-table-title">NO OF RED YIELD'S - ${label}</div>`;
        html += `<table class="tbl-sum"><thead><tr>`;
        html += `<th>WEEK</th>`;
        machineCols.forEach(m => { html += `<th>${m}</th>`; });
        html += `</tr></thead><tbody>`;
        rows.forEach(row => {
            html += `<tr><td class="td-week">${row.WeekNo || ''}</td>`;
            machineCols.forEach(m => {
                const v = toNum(row[m]);
                const display = v !== null ? v : 0;
                const cls = (v !== null && v > 0) ? 'yield-red' : '';
                html += `<td class="td-num ${cls}">${display}</td>`;
            });
            html += `</tr>`;
        });
        html += `</tbody></table></div>`;
    });

    container.innerHTML = html;
}

/* ── clear ── */
function clearReport() {
    document.getElementById('pr-thead').innerHTML = '';
    document.getElementById('pr-tbody').innerHTML = '';
    document.getElementById('tblProductionReport').classList.add('d-none');
    document.getElementById('pr-placeholder').style.display = 'flex';
    document.getElementById('btnPrDownload').classList.add('d-none');
    const avgEl = document.getElementById('avg-yield-container');
    if (avgEl) avgEl.innerHTML = '';
    const redEl = document.getElementById('red-yield-container');
    if (redEl) redEl.innerHTML = '';
    const sumEl = document.getElementById('pr-summary-section');
    if (sumEl) sumEl.classList.add('d-none');
}

/* ── Excel download ── */
function downloadExcel() {
    const table = document.getElementById('tblProductionReport');
    if (!table || table.classList.contains('d-none')) {
        toastr.warning('Run the report first.'); return;
    }
    if (typeof XLSX === 'undefined') { toastr.error('Excel library not loaded.'); return; }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.table_to_sheet(table);
    XLSX.utils.book_append_sheet(wb, ws, 'Production');

    /* Also export summary tables if visible */
    document.querySelectorAll('#avg-yield-container .tbl-sum').forEach((t, i) => {
        const wsSummary = XLSX.utils.table_to_sheet(t);
        XLSX.utils.book_append_sheet(wb, wsSummary, `Avg Yield ${i + 1}`);
    });
    document.querySelectorAll('#red-yield-container .tbl-sum').forEach((t, i) => {
        const wsRed = XLSX.utils.table_to_sheet(t);
        XLSX.utils.book_append_sheet(wb, wsRed, `Red Yield ${i + 1}`);
    });

    const from = document.getElementById('txtPrFromDate').value || 'from';
    const to   = document.getElementById('txtPrToDate').value   || 'to';
    XLSX.writeFile(wb, `ProductionReport_${from}_${to}.xlsx`);
    toastr.success('Excel downloaded.');
}

/* ── Show report ── */
function ShowReport() {
    const from = (document.getElementById('txtPrFromDate').value || '').trim();
    const to   = (document.getElementById('txtPrToDate').value   || '').trim();
    if (!from) { toastr.warning('Please select From Date.'); return; }
    if (!to)   { toastr.warning('Please select To Date.');   return; }
    if (new Date(from) > new Date(to)) {
        toastr.warning('From Date cannot be later than To Date.'); return;
    }

    clearReport();
    if (typeof Showloader === 'function') Showloader();

    MillWiseProductionReport.GetMillWiseProductionReport(from, to)
        .then(function (res) {
            /*
             * Handle two possible API response shapes:
             *   New: { DateWiseYeild:[…], MonthWiseAverageYeild:[…], MonthWiseAverageRedYeild:[…] }
             *   Wrapped: [{ DateWiseYeild:[…], … }]   or legacy   [[row,…],[…],[…]]
             */
            let data = res;
            if (Array.isArray(res)) data = res[0];          // unwrap one level if array

            let daily = [], avgYield = [], redYield = [];

            if (data && !Array.isArray(data) && typeof data === 'object') {
                /* Named-property object (new format) */
                daily    = data.DateWiseYeild            || [];
                avgYield = data.MonthWiseAverageYeild    || [];
                redYield = data.MonthWiseAverageRedYeild || [];
            } else if (Array.isArray(data)) {
                /* Legacy array-of-arrays format */
                daily = data;
            }

            if (!daily.length && !avgYield.length) {
                toastr.info('No data found for the selected date range.'); return;
            }

            if (daily.length) renderDailyTable(daily);
            renderAvgYieldTables(avgYield);
            renderRedYieldTables(redYield);
            document.getElementById('btnPrDownload').classList.remove('d-none');
        })
        .catch(function () {
            toastr.error('Failed to load production report. Please try again.');
        })
        .finally(function () {
            if (typeof HideLoader === 'function') HideLoader();
        });
}

/* ── Init (ES modules are deferred — DOM is ready when this runs) ── */
document.getElementById('txtPrFromDate').value = fyStartStr();
document.getElementById('txtPrToDate').value   = todayStr();
document.getElementById('btnPrShow').addEventListener('click', ShowReport);
document.getElementById('btnPrDownload').addEventListener('click', downloadExcel);
