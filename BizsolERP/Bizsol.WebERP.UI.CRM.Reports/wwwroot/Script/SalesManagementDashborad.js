import { SalesManagementDashboradService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SalesManagementDashboradService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';
import { MarketingManMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MarketingManMasterService.js';
import { StateMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/StateMasterService.js';
import { VendorMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VendorMasterService.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');

const FY_LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const PALETTE = ['#6366f1', '#f59e0b', '#22c55e', '#ec4899', '#0ea5e9', '#a855f7', '#f97316', '#14b8a6', '#3b82f6', '#84cc16', '#fb7185', '#8b5cf6'];
/** State master from API: StateName / StateShortName (no hard-coded state list). */
let stateMasterIndex = {};

const charts = {};
let measure = 'VALUE';
let lastTables = null;
let monthRows = [];
let activeFy = null;
let placeMode = 'state';
let cityRows = [];
let stateRows = [];
let contributionRows = [];
let showAllCustomers = false;
let filterReady = false;

const centerTextPlugin = {
    id: 'smdCenterText',
    afterDraw: function (chart) {
        const opts = chart.options.plugins && chart.options.plugins.smdCenterText;
        if (!opts || !opts.lines || !opts.lines.length) return;
        const area = chart.chartArea;
        if (!area) return;
        const ctx = chart.ctx;
        const x = (area.left + area.right) / 2;
        let y = (area.top + area.bottom) / 2 - ((opts.lines.length - 1) * 9);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        opts.lines.forEach(function (line) {
            ctx.fillStyle = line.color || '#0f172a';
            ctx.font = line.font || '700 14px Segoe UI, sans-serif';
            ctx.fillText(line.text, x, y);
            y += 16;
        });
        ctx.restore();
    }
};

function showLoader() {
    if (typeof Showloader === 'function') Showloader();
}
function hideLoader() {
    if (typeof HideLoader === 'function') HideLoader();
}

function field(row, names) {
    if (!row) return undefined;
    const keys = Object.keys(row);
    for (let i = 0; i < names.length; i++) {
        const found = keys.find(function (key) { return key.toLowerCase() === names[i].toLowerCase(); });
        if (found) return row[found];
    }
    return undefined;
}
function num(row, names) {
    const value = parseFloat(field(row, names));
    return isNaN(value) ? 0 : value;
}
function text(row, names, fallback) {
    const value = field(row, names);
    return value === null || value === undefined || value === '' ? (fallback || '') : String(value);
}
function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
function setHtml(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
}
function amountOf(row) {
    return num(row, measure === 'QTY' ? ['QtyMT', 'AchievedQty', 'TotalQtyMT'] : ['SaleValue', 'TotalSaleValue']);
}
function previousOf(row) {
    return num(row, measure === 'QTY' ? ['PrevQtyMT'] : ['PrevSaleValue']);
}
function shareOf(row) {
    return num(row, measure === 'QTY' ? ['QtySharePct', 'SharePct'] : ['SharePct', 'QtySharePct']);
}
function growthBetween(current, previous) {
    if (!previous) return current ? 100 : 0;
    return (current - previous) * 100 / previous;
}
function formatPct(value) {
    const n = Number(value) || 0;
    if (Math.abs(n - Math.round(n)) < 0.05) return Math.round(n) + '%';
    return n.toFixed(1) + '%';
}
function formatQty(value) {
    return Math.abs(Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
function formatInr(value, digits) {
    const amount = Number(value) || 0;
    const dp = digits == null ? 2 : digits;
    const sign = amount < 0 ? '-' : '';
    const abs = Math.abs(amount);
    if (abs >= 10000000) return sign + '₹ ' + (abs / 10000000).toFixed(dp) + ' Cr';
    if (abs >= 100000) return sign + '₹ ' + (abs / 100000).toFixed(dp) + ' L';
    return sign + '₹ ' + abs.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
function formatMeasure(value) {
    if (measure === 'QTY') {
        const amount = Number(value) || 0;
        return (amount < 0 ? '-' : '') + formatQty(amount) + ' MT';
    }
    return formatInr(value);
}
function growthHtml(current, previous, onKpi) {
    const pct = growthBetween(current, previous);
    if (pct > 0.05) {
        return '<span class="smd-pill ' + (onKpi ? 'smd-pill-up' : 'smd-pill-up-table') + '">▲ ' + Math.abs(pct).toFixed(1) + '%</span>';
    }
    if (pct < -0.05) {
        return '<span class="smd-pill ' + (onKpi ? 'smd-pill-down' : 'smd-pill-down-table') + '">▼ ' + Math.abs(pct).toFixed(1) + '%</span>';
    }
    return '<span class="smd-pill ' + (onKpi ? 'smd-pill-flat' : 'smd-pill-flat-table') + '">0%</span>';
}
function flattenTables(response) {
    if (!response) return [];
    if (Array.isArray(response)) {
        if (response.length && Array.isArray(response[0])) return response;
        return [response];
    }
    return ['Table', 'Table1', 'Table2', 'Table3', 'Table4', 'Table5', 'Table6', 'Table7', 'Table8', 'Table9', 'Table10', 'Table11']
        .filter(function (key) { return Array.isArray(response[key]); })
        .map(function (key) { return response[key]; });
}
function fyLabel(start) {
    return 'FY ' + start + '-' + String(start + 1).slice(-2);
}
function isoDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
}
function currentMonthRange() {
    const now = new Date();
    return { fromDate: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), toDate: isoDate(now) };
}
function displayDate(value) {
    if (!value || value === '0') return '';
    const parts = String(value).split('-');
    if (parts.length !== 3) return String(value);
    return parts[2] + '-' + parts[1] + '-' + parts[0];
}
/** Multi-select value from FilterSidePanelControl: '0' = everything (Select All / nothing picked), else comma list. */
function multiValue(entry) {
    if (!entry || entry.isAll || !entry.joined) return '0';
    return entry.joined;
}
function mapNamed(rows, nameKeys) {
    const seen = new Set();
    const list = [];
    (rows || []).forEach(function (row) {
        if (!row || typeof row !== 'object') return;
        const code = text(row, ['Code', 'ZoneMaster_Code', 'IndustryTypeMaster_Code']);
        const name = text(row, nameKeys);
        if (!code || !name || seen.has(code)) return;
        seen.add(code);
        list.push({ Code: code, Desp: name });
    });
    list.sort(function (a, b) { return a.Desp.localeCompare(b.Desp); });
    return list;
}
function normalizeStateKey(name) {
    return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}
function buildStateMasterIndex(rows) {
    const index = {};
    (rows || []).forEach(function (row) {
        if (!row || typeof row !== 'object') return;
        const stateName = text(row, ['StateName', 'Desp', 'Name']);
        if (!stateName) return;
        const shortName = text(row, ['StateShortName', 'StateShort', 'ShortName']);
        const entry = {
            stateName: stateName,
            shortName: shortName ? shortName.trim().toUpperCase() : stateName.trim().substring(0, 2).toUpperCase()
        };
        index[normalizeStateKey(stateName)] = entry;
        if (shortName) {
            index[normalizeStateKey(shortName)] = entry;
        }
    });
    stateMasterIndex = index;
}
function resolveStateShort(stateName) {
    const key = normalizeStateKey(stateName);
    if (!key) return '';
    const hit = stateMasterIndex[key];
    if (hit && hit.shortName) return hit.shortName;
    if (/^[a-z]{2,3}$/i.test(key)) return key.toUpperCase();
    const words = key.split(' ').filter(Boolean);
    if (words.length >= 2) {
        return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return key.substring(0, 2).toUpperCase();
}
function mapStates(rows) {
    const seen = new Set();
    const list = [];
    (rows || []).forEach(function (row) {
        const name = text(row, ['StateName', 'Desp', 'Name']);
        const key = normalizeStateKey(name);
        if (!name || seen.has(key)) return;
        seen.add(key);
        const shortName = text(row, ['StateShortName', 'StateShort', 'ShortName']);
        const label = shortName ? name + ' (' + shortName + ')' : name;
        list.push({ Code: name, Desp: label });
    });
    list.sort(function (a, b) { return a.Desp.localeCompare(b.Desp); });
    return list;
}
function readFilters() {
    const panel = document.getElementById('filterPanel');
    const values = panel && typeof panel.getFilterValues === 'function' ? (panel.getFilterValues() || {}) : {};
    const range = values.dateRange || currentMonthRange();
    return {
        Mode: 'DASHBOARD',
        dealerCodes: multiValue(values.ddlParty),
        salesPersons: multiValue(values.ddlSalesPerson),
        zoneCodes: multiValue(values.ddlZone),
        states: multiValue(values.ddlState),
        industryTypes: multiValue(values.ddlIndustryType),
        itemCodes: multiValue(values.ddlProduct),
        fromDate: range.fromDate || '0',
        toDate: range.toDate || '0',
        compareFromDate: '0',
        compareToDate: '0'
    };
}
function monthName(date) {
    return date.toLocaleDateString('en-GB', { month: 'long' });
}
function dayMon(date) {
    return date.getDate() + ' ' + date.toLocaleDateString('en-GB', { month: 'short' });
}
/** "October 2026 (1-26 Oct)" for one month, otherwise "1 Oct - 5 Nov 2026". */
function describeRange(from, to, withDays) {
    if (from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth()) {
        const head = monthName(from) + ' ' + from.getFullYear();
        const lastDay = new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate();
        const full = from.getDate() === 1 && to.getDate() === lastDay;
        if (!withDays || full) return head;
        return head + ' (' + from.getDate() + '\u2013' + to.getDate() + ' ' + from.toLocaleDateString('en-GB', { month: 'short' }) + ')';
    }
    return dayMon(from) + (from.getFullYear() !== to.getFullYear() ? ' ' + from.getFullYear() : '') + ' \u2013 ' + dayMon(to) + ' ' + to.getFullYear();
}
function updateBanner() {
    const el = document.getElementById('smdBannerText');
    if (!el) return;
    const filters = readFilters();
    const from = parseIsoDate(filters.fromDate);
    const to = parseIsoDate(filters.toDate);
    if (!from || !to) {
        el.textContent = '';
        return;
    }
    // Same default as the procedure: previous month window ending the day before "from".
    const compareFrom = parseIsoDate(filters.compareFromDate) || new Date(from.getFullYear(), from.getMonth() - 1, from.getDate());
    const compareTo = parseIsoDate(filters.compareToDate) || new Date(from.getFullYear(), from.getMonth(), from.getDate() - 1);
    const heroPeriod = document.querySelector('#smdHeroPeriod span');
    if (heroPeriod) heroPeriod.textContent = describeRange(from, to, true);
    const heroCompare = document.querySelector('#smdHeroCompare span');
    if (heroCompare) heroCompare.textContent = 'vs ' + describeRange(compareFrom, compareTo, false);
    el.innerHTML = 'Showing <b>' + escapeHtml(describeRange(from, to, true)) + '</b> \u00B7 Comparisons are against <b>' +
        escapeHtml(describeRange(compareFrom, compareTo, false)) + '</b> \u00B7 Value = Basic + Excise';
}

function ensurePlugin() {
    if (typeof Chart === 'undefined' || ensurePlugin.ready) return;
    Chart.register(centerTextPlugin);
    // One look for every chart: Segoe UI text, soft grey axes, dark rounded tooltip
    Chart.defaults.font.family = '"Segoe UI", system-ui, -apple-system, sans-serif';
    Chart.defaults.color = '#64748b';
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.94)';
    Chart.defaults.plugins.tooltip.cornerRadius = 10;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.boxPadding = 4;
    Chart.defaults.plugins.tooltip.titleFont = { weight: '700', size: 12 };
    Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
    ensurePlugin.ready = true;
}
function renderChart(id, config) {
    const canvas = document.getElementById(id);
    if (!canvas || typeof Chart === 'undefined') return;
    ensurePlugin();
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(canvas, config);
}
function destroyChart(id) {
    if (charts[id]) {
        charts[id].destroy();
        delete charts[id];
    }
}
function renderDonut(id, labels, values, colors, lines) {
    if (!values.length || values.every(function (value) { return !value; })) {
        destroyChart(id);
        return;
    }
    renderChart(id, {
        type: 'doughnut',
        data: { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: { legend: { display: false }, smdCenterText: { lines: lines } }
        }
    });
}
function legendHtml(labels, values, colors, shares) {
    if (!labels.length) return '<div class="smd-empty">No sale in this range</div>';
    const rows = labels.map(function (label, index) {
        const share = shares && shares[index] != null ? '<b>' + formatPct(shares[index]) + '</b>' : '';
        const barWidth = shares && shares[index] != null ? Math.max(0, Math.min(100, shares[index])) : 0;
        return '<div class="smd-legend-row" style="--c:' + colors[index] + ';--w:' + barWidth + '%"><i class="smd-dot" style="background:' + colors[index] + '"></i><span>' +
            escapeHtml(label) + '</span><b>' + formatMeasure(values[index]) + '</b>' + share + '</div>';
    }).join('');
    // Total line at the end of the list (stays visible while the list scrolls)
    const total = values.reduce(function (sum, value) { return sum + (Number(value) || 0); }, 0);
    return rows + '<div class="smd-legend-row smd-legend-total"><i class="smd-dot smd-dot--sigma">&Sigma;</i><span>Total</span><b>' +
        formatMeasure(total) + '</b>' + (shares ? '<b>100%</b>' : '') + '</div>';
}
function meterHtml(name, value, max, extra, color, rank) {
    const width = Math.max(value > 0 ? 2 : 0, max ? (value / max) * 100 : 0);
    const badge = rank ? '<span class="smd-rank smd-rank--' + (rank <= 3 ? rank : 'n') + '">' + rank + '</span>' : '';
    return '<div class="smd-meter"><div class="smd-meter-name" title="' + escapeHtml(name) + '">' + badge +
        '<span class="smd-meter-text">' + escapeHtml(name) + '</span>' +
        '</div><div class="smd-meter-track"><span style="width:' + width + '%;background:' + (color || '#3b82f6') + '"></span></div><div class="smd-meter-val">' +
        formatMeasure(value) + '</div><div>' + (extra || '') + '</div></div>';
}

function paint(tables, resetFy) {
    lastTables = tables;
    const kpi = (tables[0] && tables[0][0]) || {};
    const persons = tables[1] || [];
    const industries = tables[2] || [];
    monthRows = tables[3] || [];
    const saleTypes = tables[4] || [];
    const items = tables[5] || [];
    const parties = tables[6] || [];
    stateRows = tables[7] || [];
    contributionRows = tables[8] || [];
    const dependence = tables[9] || [];
    const outstanding = tables.slice(10).reduce(function (all, table) { return all.concat(table || []); }, []);

    if (resetFy !== false) activeFy = num(kpi, ['FyStartYear']);
    paintKpis(kpi, outstanding);
    paintPersons(persons);
    paintIndustry(industries);
    renderMonth();
    paintSaleType(saleTypes);
    const saleTotal = measure === 'QTY' ? num(kpi, ['TotalQtyMT']) : num(kpi, ['TotalSaleValue']);
    paintRank('itemBars', items, 'ItemName', saleTotal);
    paintRank('partyBars', parties, 'PartyName', saleTotal);
    if (placeMode === 'city') renderCity(cityRows);
    else renderState(stateRows);
    renderContribution(contributionRows);
    renderDependence(dependence, contributionRows);
    paintInsights(kpi, persons, industries, items, parties, stateRows, saleTotal);
    resizeActiveCharts();
}
/** "Highlights" strip: the main facts of the period in plain words. */
function paintInsights(kpi, persons, industries, items, parties, states, saleTotal) {
    const el = document.getElementById('smdInsights');
    if (!el) return;
    const best = function (rows) {
        return (rows || []).slice().sort(function (a, b) { return amountOf(b) - amountOf(a); })[0];
    };
    const share = function (value) { return saleTotal ? ' \u00B7 ' + formatPct(value * 100 / saleTotal) + ' of sale' : ''; };
    const chips = [];

    const sale = measure === 'QTY' ? num(kpi, ['TotalQtyMT']) : num(kpi, ['TotalSaleValue']);
    const previous = measure === 'QTY' ? num(kpi, ['PrevQtyMT']) : num(kpi, ['PrevSaleValue']);
    if (sale || previous) {
        const pct = growthBetween(sale, previous);
        const up = pct >= 0;
        chips.push({
            tone: up ? 'green' : 'red', icon: up ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down', label: 'Sale trend',
            value: (up ? 'Up ' : 'Down ') + Math.abs(pct).toFixed(1) + '%',
            sub: 'vs ' + formatMeasure(previous) + ' in the compare period'
        });
    }
    const pick = function (rows, field, label, icon, tone, subFn) {
        const row = best(rows);
        if (!row || !amountOf(row)) return;
        const name = text(row, [field], '');
        if (!name) return;
        chips.push({ tone: tone, icon: icon, label: label, value: name, sub: subFn ? subFn(row) : formatMeasure(amountOf(row)) });
    };
    pick(persons, 'MarketingMan', 'Top sales person', 'fa-user-tie', 'indigo');
    pick(industries, 'IndustryType', 'Top industry', 'fa-industry', 'amber', function (row) { return formatMeasure(amountOf(row)) + share(amountOf(row)); });
    pick(parties, 'PartyName', 'Top customer', 'fa-handshake', 'teal', function (row) { return formatMeasure(amountOf(row)) + share(amountOf(row)); });
    pick(items, 'ItemName', 'Top item', 'fa-box-open', 'pink', function (row) { return formatMeasure(amountOf(row)) + share(amountOf(row)); });
    pick(states, 'StateName', 'Top state', 'fa-location-dot', 'blue', function (row) { return formatMeasure(amountOf(row)); });

    el.innerHTML = chips.map(function (chip) {
        return '<div class="smd-insight smd-insight--' + chip.tone + '"><span class="smd-insight-ico"><i class="fa-solid ' + chip.icon +
            '" aria-hidden="true"></i></span><div class="smd-insight-body"><span class="smd-insight-k">' + escapeHtml(chip.label) +
            '</span><b class="smd-insight-v" title="' + escapeHtml(chip.value) + '">' + escapeHtml(chip.value) +
            '</b><span class="smd-insight-s">' + escapeHtml(chip.sub) + '</span></div></div>';
    }).join('');
    el.style.display = chips.length ? '' : 'none';
}
function parseIsoDate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}
function kpiGrowthHtml(current, previous) {
    const pct = growthBetween(current, previous);
    if (pct > 0.05) return '<span class="smd-kpi-up">&#9650; ' + Math.abs(pct).toFixed(1) + '%</span>';
    if (pct < -0.05) return '<span class="smd-kpi-down">&#9660; ' + Math.abs(pct).toFixed(1) + '%</span>';
    return '<span class="smd-kpi-flat">0%</span>';
}
/** Numbers roll up from 0 to the value (about 0.7s). The final text is always the exact formatted value. */
const countTimers = {};
function countUp(id, value, format) {
    const el = document.getElementById(id);
    if (!el) return;
    const target = Number(value) || 0;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (countTimers[id]) cancelAnimationFrame(countTimers[id]);
    if (reduce || !target || typeof requestAnimationFrame !== 'function') {
        el.textContent = format(target);
        return;
    }
    const started = performance.now();
    const duration = 700;
    function tick(now) {
        const t = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = format(t >= 1 ? target : target * eased);
        if (t < 1) countTimers[id] = requestAnimationFrame(tick);
        else delete countTimers[id];
    }
    countTimers[id] = requestAnimationFrame(tick);
}
/** Progress bar inside a KPI card. `mark` (optional) draws a tick, e.g. how much of the month is gone. */
function setBar(id, pct, tone, mark) {
    const bar = document.getElementById(id);
    if (!bar) return;
    const fill = bar.querySelector('span');
    const tick = bar.querySelector('i');
    bar.setAttribute('data-tone', tone || 'good');
    if (fill) fill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
    if (tick) {
        tick.style.display = mark ? 'block' : 'none';
        tick.style.left = Math.max(0, Math.min(100, mark || 0)) + '%';
    }
}
function paintKpis(kpi, outstanding) {
    const sale = measure === 'QTY' ? num(kpi, ['TotalQtyMT']) : num(kpi, ['TotalSaleValue']);
    const previous = measure === 'QTY' ? num(kpi, ['PrevQtyMT']) : num(kpi, ['PrevSaleValue']);
    const bestValue = measure === 'QTY' ? num(kpi, ['BestDayQtyMT']) : num(kpi, ['BestDayValue']);
    const bestDate = parseIsoDate(text(kpi, ['BestDayDate']));
    const fromDate = parseIsoDate(text(kpi, ['FromDate']));
    const days = num(kpi, ['DayCount']) || 1;
    const due = outstandingSummary(outstanding);

    // 1. Total sale (this month)  +  growth vs compare month
    const compareFrom = parseIsoDate(text(kpi, ['CompareFromDate']));
    const compareTo = parseIsoDate(text(kpi, ['CompareToDate']));
    const sameMonth = compareFrom && compareTo && compareFrom.getMonth() === compareTo.getMonth() && compareFrom.getFullYear() === compareTo.getFullYear();
    countUp('kpiSale', sale, formatMeasure);
    setHtml('kpiSaleGrowth', kpiGrowthHtml(sale, previous));
    setText('kpiSaleVs', 'vs ' + (sameMonth ? compareFrom.toLocaleDateString('en-GB', { month: 'short' }) : 'compare'));

    // 2. Best day of the month  +  average day
    countUp('kpiBest', bestValue, formatMeasure);
    setText('kpiBestDate', bestDate
        ? bestDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
        : '—');
    setText('kpiBestAvg', 'avg day ' + (measure === 'QTY' ? formatMeasure(sale / days) : formatInr(sale / days, 1)));

    // 3. Target achievement  +  share of month gone
    let monthGone = 0;
    if (fromDate) {
        const daysInMonth = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0).getDate();
        monthGone = Math.min(100, days * 100 / daysInMonth);
    }
    // Targets are saved as quantity (MT). TargetValue is only used when it really exists;
    // otherwise the achievement is worked out on quantity (sale MT vs target MT).
    const useQty = targetUsesQty([kpi]);
    const target = useQty ? num(kpi, ['TargetQty']) : num(kpi, ['TargetValue']);
    const achieved = useQty ? num(kpi, ['TotalQtyMT']) : sale;
    const achievedText = formatBasis(achieved, useQty);
    const targetText = formatBasis(target, useQty);
    const achievedUnit = achievedText.split(' ').pop();
    const sameUnit = target && achievedUnit === targetText.split(' ').pop() && (achievedUnit === 'Cr' || achievedUnit === 'L' || achievedUnit === 'MT');
    setText('kpiAchieve', target ? formatPct(achieved * 100 / target) : '—');
    setText('kpiTarget', target
        ? (sameUnit ? achievedText.slice(0, achievedText.length - achievedUnit.length).trim() : achievedText) + ' of ' + targetText + ' \u00B7 ' + Math.round(monthGone) + '% of month gone'
        : 'Target not set');

    // 4. Total outstanding  5. Overdue amount
    countUp('kpiOutstanding', due.total, formatInr);
    setText('kpiOutstandingSub', 'across ' + due.parties + ' part' + (due.parties === 1 ? 'y' : 'ies'));
    countUp('kpiOverdue', due.overdue, formatInr);
    setText('kpiOverdueSub', (due.total ? Math.round(due.overdue * 100 / due.total) : 0) + '% of outstanding');

    // Little progress bars on the cards
    const achievePct = target ? achieved * 100 / target : 0;
    setBar('kpiAchieveBar', achievePct, achievePct >= 90 ? 'good' : achievePct >= 50 ? 'warn' : 'bad', monthGone);
    setBar('kpiOverdueBar', due.total ? due.overdue * 100 / due.total : 0, 'bad');
}
function outstandingSummary(rows) {
    let total = 0;
    let overdue = 0;
    const parties = new Set();
    (rows || []).forEach(function (row) {
        const failure = field(row, ['OutstandingError']);
        if (failure) {
            console.warn('Outstanding report failed inside USP_WebAPI_SalesManagementDashborad:', failure);
            return;
        }
        const balance = field(row, ['Balance', 'Outstanding', 'Outstanding Amount', 'OutstandingAmount']);
        const amount = num(row, ['Amount']);
        const adjusted = num(row, ['Amount Adjusted', 'AmountAdjusted']);
        const value = balance !== undefined && balance !== null && balance !== '' ? (parseFloat(balance) || 0) : (amount - adjusted);
        const delay = num(row, ['Delay Days', 'DelayDays', 'Delay_Days']);
        const credit = num(row, ['Credit Days', 'CreditDays', 'Credit_Days']);
        if (value > 0) {
            total += value;
            parties.add(text(row, ['Vendor/Client', 'PartyName', 'AccountName', 'BuyersName', 'AccountDesp'], 'Customer ' + (parties.size + 1)));
            if (delay > credit) overdue += value;
        }
    });
    return { total: total, overdue: overdue, parties: parties.size };
}
// Targets come from Vw_MarketingManTargetPartyWise as quantity (MT) and TargetValue is 0.
// Use value only when a value target exists; otherwise compare quantity with quantity.
function targetUsesQty(rows) {
    if (measure === 'QTY') return true;
    return !(rows || []).some(function (row) { return num(row, ['TargetValue']) > 0; });
}
function formatBasis(value, useQty) {
    if (!useQty) return formatInr(value);
    const amount = Number(value) || 0;
    return (amount < 0 ? '-' : '') + formatQty(amount) + ' MT';
}
function personAchieved(row, useQty) {
    return useQty ? num(row, ['AchievedQty']) : num(row, ['SaleValue']);
}
function personTarget(row, useQty) {
    return useQty ? num(row, ['TargetQty']) : num(row, ['TargetValue']);
}
function initialsOf(name) {
    const parts = String(name || '?').replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function paintPersons(rows) {
    const useQty = targetUsesQty(rows);
    const people = rows.slice().sort(function (a, b) { return personAchieved(b, useQty) - personAchieved(a, useQty); });
    const max = people.reduce(function (peak, row) { return Math.max(peak, personAchieved(row, useQty), personTarget(row, useQty)); }, 1);
    setHtml('personBars', people.length ? people.map(function (row) {
        const name = text(row, ['MarketingMan'], 'Unassigned');
        const achieved = personAchieved(row, useQty);
        const target = personTarget(row, useQty);
        const pctText = target ? formatPct(achieved * 100 / target) : '—';
        return '<div class="smd-person"><div class="smd-person-name" title="' + escapeHtml(name) + '">' + escapeHtml(name) +
            '</div><div class="smd-track"><i class="target" style="width:' + (target / max * 100) + '%"></i><i class="achieved" style="width:' +
            (achieved / max * 100) + '%"></i></div><div class="smd-person-pct">' + pctText + '</div></div>';
    }).join('') : '<div class="smd-empty">No sale in this range</div>');

    setHtml('personBody', people.map(function (row) {
        const achieved = personAchieved(row, useQty);
        const target = personTarget(row, useQty);
        const gap = target ? achieved - target : null;
        const pct = target ? achieved * 100 / target : null;
        const personName = text(row, ['MarketingMan'], 'Unassigned');
        const tone = pct == null ? 'none' : pct >= 90 ? 'good' : pct >= 50 ? 'warn' : 'bad';
        return '<tr><td><span class="smd-person-cell"><span class="smd-avatar smd-avatar--' + (initialsOf(personName).charCodeAt(0) % 6) + '">' +
            escapeHtml(initialsOf(personName)) + '</span><span class="smd-person-cell-name">' + escapeHtml(personName) + '</span></span></td><td class="num">' +
            (target ? formatBasis(target, useQty) : '—') + '</td><td class="num">' + formatBasis(achieved, useQty) + '</td><td class="num">' +
            (pct == null ? '—' : '<span class="smd-pct smd-pct--' + tone + '">' + formatPct(pct) + '</span>') + '</td><td class="num ' + (gap < 0 ? 'smd-down' : 'smd-up') + '">' +
            (gap == null ? '—' : formatBasis(gap, useQty)) + '</td></tr>';
    }).join('') || '<tr><td colspan="5">No sale in this range</td></tr>');

    const achievedSum = people.reduce(function (sum, row) { return sum + personAchieved(row, useQty); }, 0);
    const targetSum = people.reduce(function (sum, row) { return sum + personTarget(row, useQty); }, 0);
    const foot = document.getElementById('personFoot');
    if (!foot) return;
    if (!people.length) {
        foot.innerHTML = '';
        return;
    }
    const gap = targetSum ? achievedSum - targetSum : null;
    foot.innerHTML = '<tr><td>Total team</td><td class="num">' + (targetSum ? formatBasis(targetSum, useQty) : '—') +
        '</td><td class="num">' + formatBasis(achievedSum, useQty) + '</td><td class="num">' +
        (targetSum ? formatPct(achievedSum * 100 / targetSum) : '—') + '</td><td class="num">' +
        (gap == null ? '—' : formatBasis(gap, useQty)) + '</td></tr>';
}
function paintIndustry(rows) {
    const labels = rows.map(function (row) { return text(row, ['IndustryType'], 'Other'); });
    const values = rows.map(amountOf);
    const total = values.reduce(function (sum, value) { return sum + value; }, 0);
    const shares = values.map(function (value) { return total ? value * 100 / total : 0; });
    renderDonut('chartIndustry', labels, values, PALETTE, [
        { text: formatMeasure(total), font: '700 15px Segoe UI, sans-serif' },
        { text: 'Total', font: '600 11px Segoe UI, sans-serif', color: '#64748b' }
    ]);
    setHtml('industryLegend', legendHtml(labels, values, PALETTE, shares));
}
/* Month wise trend: month by month, current financial year against the previous one.
   It does not follow the From / To date filter (April 2025 is compared with April 2026). */
function compactAxis(value) {
    if (measure === 'QTY') return formatQty(value);
    return formatInr(value, 1).replace('.0 ', ' ');
}
function renderMonth() {
    const curFy = activeFy;
    const prevFy = curFy - 1;
    const prev = {};
    const cur = {};
    monthRows.forEach(function (row) {
        const year = num(row, ['FyStartYear']);
        const index = num(row, ['FyMonthNo']);
        if (year === prevFy) prev[index] = (prev[index] || 0) + amountOf(row);
        else if (year === curFy) cur[index] = (cur[index] || 0) + amountOf(row);
    });
    const prevData = [];
    const curData = [];
    let lastCur = 0;
    for (let i = 1; i <= 12; i++) {
        prevData.push(prev[i] || 0);
        curData.push(cur[i] || 0);
        if (cur[i]) lastCur = i;
    }
    const sum = function (list, upTo) {
        return list.slice(0, upTo == null ? list.length : upTo).reduce(function (total, value) { return total + value; }, 0);
    };
    const prevTotal = sum(prevData);
    const curTotal = sum(curData);
    const prevSameMonths = sum(prevData, lastCur);   // like-for-like: same months of last year

    // Totals strip in the card header
    const hasData = prevTotal > 0 || curTotal > 0;
    setHtml('fyToggle', hasData
        ? '<span class="smd-fychip smd-fychip--prev"><i></i>' + fyLabel(prevFy) + ' <b>' + formatMeasure(prevTotal) + '</b></span>' +
          '<span class="smd-fychip smd-fychip--cur"><i></i>' + fyLabel(curFy) + ' <b>' + formatMeasure(curTotal) + '</b>' +
          (lastCur ? ' ' + kpiGrowthHtml(curTotal, prevSameMonths) : '') + '</span>'
        : '');

    // Table with a total at the end
    setText('monthHeadPrev', fyLabel(prevFy));
    setText('monthHeadCur', fyLabel(curFy));
    setHtml('monthBody', hasData ? FY_LABELS.map(function (label, index) {
        const before = prevData[index];
        const now = curData[index];
        return '<tr><td>' + label + '</td><td class="num">' + (before ? formatMeasure(before) : '—') + '</td><td class="num">' +
            (now ? formatMeasure(now) : '—') + '</td><td class="num">' + (before || now ? growthHtml(now, before) : '—') + '</td></tr>';
    }).join('') : '<tr><td colspan="4">No sale in these years</td></tr>');
    setHtml('monthFoot', hasData
        ? '<tr><td>Total</td><td class="num">' + formatMeasure(prevTotal) + '</td><td class="num">' + formatMeasure(curTotal) +
          '</td><td class="num">' + (lastCur ? growthHtml(curTotal, prevSameMonths) : '—') + '</td></tr>'
        : '');
    setText('monthNote', hasData && lastCur
        ? 'Change in the total compares April to ' + FY_LABELS[lastCur - 1] + ' of both years.'
        : '');

    if (!hasData) {
        destroyChart('chartMonth');
        return;
    }
    renderChart('chartMonth', {
        type: 'bar',
        data: {
            labels: FY_LABELS,
            datasets: [
                { label: fyLabel(prevFy), data: prevData, backgroundColor: '#c7d2fe', hoverBackgroundColor: '#a5b4fc', borderRadius: 6, maxBarThickness: 22 },
                { label: fyLabel(curFy), data: curData, backgroundColor: '#4f46e5', hoverBackgroundColor: '#4338ca', borderRadius: 6, maxBarThickness: 22 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: true, position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 10, boxHeight: 10, font: { size: 11, weight: '600' } } },
                tooltip: {
                    callbacks: {
                        label: function (ctx) { return ' ' + ctx.dataset.label + ': ' + formatMeasure(ctx.parsed.y); }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, ticks: { callback: compactAxis, maxTicksLimit: 6 }, grid: { color: '#eef2f7' } },
                x: { grid: { display: false } }
            }
        }
    });
}
function paintSaleType(rows) {
    const labels = rows.map(function (row) { return text(row, ['SaleType'], 'Sale'); });
    const values = rows.map(amountOf);
    const total = values.reduce(function (sum, value) { return sum + value; }, 0);
    const colors = labels.map(function (label, index) {
        if (/export/i.test(label)) return '#f97316';
        if (/domestic/i.test(label)) return '#6366f1';
        return PALETTE[index % PALETTE.length];
    });
    const shares = values.map(function (value) { return total ? value * 100 / total : 0; });
    const max = Math.max.apply(null, values.concat([1]));
    renderDonut('chartSaleType', labels, values, colors, [
        { text: formatMeasure(total), font: '700 14px Segoe UI, sans-serif' }
    ]);
    setHtml('saleTypeLegend', legendHtml(labels, values, colors, shares));
    setHtml('saleTypeBars', rows.map(function (row, index) {
        return meterHtml(labels[index], values[index], max, formatPct(shares[index]), colors[index]);
    }).join(''));
}
function paintRank(id, rows, nameField, saleTotal) {
    const ranked = rows.slice().sort(function (a, b) { return amountOf(b) - amountOf(a); }).slice(0, 10);
    const max = ranked.reduce(function (peak, row) { return Math.max(peak, amountOf(row)); }, 1);
    if (!ranked.length) {
        setHtml(id, '<div class="smd-empty">No sale in this range</div>');
        return;
    }
    const rowsHtml = ranked.map(function (row, index) {
        const barColor = PALETTE[index % PALETTE.length];
        return meterHtml(text(row, [nameField], 'Other'), amountOf(row), max, growthHtml(amountOf(row), previousOf(row)), barColor, index + 1);
    }).join('');
    // Total of the rows shown above, with its share of the whole period sale
    const total = ranked.reduce(function (sum, row) { return sum + amountOf(row); }, 0);
    const previous = ranked.reduce(function (sum, row) { return sum + previousOf(row); }, 0);
    const share = saleTotal ? total * 100 / saleTotal : null;
    const label = 'Total (top ' + ranked.length + ')';
    const totalHtml = '<div class="smd-meter smd-meter--total"><div class="smd-meter-name" title="' + label + '">' + label +
        '</div><div class="smd-meter-track"><span style="width:' + Math.min(100, share || 0) + '%;background:#0f172a"></span></div><div class="smd-meter-val">' +
        formatMeasure(total) + '</div><div>' + growthHtml(total, previous) + '</div>' +
        (share == null ? '' : '<div class="smd-meter-sub">' + formatPct(share) + ' of the total sale of ' + formatMeasure(saleTotal) + '</div>') + '</div>';
    setHtml(id, rowsHtml + totalHtml);
}
function mapPinPosition(index, total) {
    if (total <= 0) return [50, 50];
    const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
    const rowCount = Math.ceil(total / cols);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const padX = 12;
    const padY = 16;
    const width = 100 - padX * 2;
    const height = 100 - padY * 2;
    return [
        padX + (col + 0.5) * (width / cols),
        padY + (row + 0.5) * (height / rowCount)
    ];
}
function shade(amount, max) {
    const t = max ? Math.max(0, Math.min(1, amount / max)) : 0;
    const start = [219, 231, 245];
    const end = [11, 58, 130];
    const mix = start.map(function (channel, index) { return Math.round(channel + (end[index] - channel) * t); });
    return { fill: 'rgb(' + mix.join(',') + ')', ink: t > 0.55 ? '#fff' : '#0f2744' };
}
function renderState(rows) {
    placeMode = 'state';
    const button = document.getElementById('btnDrillCity');
    if (button) button.textContent = 'Drill to city';
    setText('placeHead', 'State');
    const ranked = rows.slice().sort(function (a, b) { return amountOf(b) - amountOf(a); });
    renderPlaceTable(ranked, function (row) { return text(row, ['StateName'], 'Unknown'); });
    renderMap(ranked);
    const total = ranked.reduce(function (sum, row) { return sum + amountOf(row); }, 0);
    const top3 = ranked.slice(0, 3).reduce(function (sum, row) { return sum + amountOf(row); }, 0);
    const foot = document.getElementById('stateFoot');
    if (foot) {
        foot.innerHTML = ranked.length ? '<tr><td></td><td>Total domestic</td><td></td><td class="num">' + formatMeasure(total) +
            '</td><td class="num">100%</td><td></td></tr>' : '';
    }
    setText('stateNote', ranked.length
        ? ranked.length + ' states billed. Top 3 states are ' + formatPct(total ? top3 * 100 / total : 0) + ' of domestic sale.'
        : '');
}
function renderCity(rows) {
    if (rows.length === 1 && text(rows[0], ['Available'], 'Y') === 'N') {
        setHtml('stateBody', '<tr><td colspan="6">' + escapeHtml(text(rows[0], ['CityName'])) + '</td></tr>');
        setHtml('stateFoot', '');
        setText('stateNote', '');
        return;
    }
    const button = document.getElementById('btnDrillCity');
    if (button) button.textContent = 'Back to state';
    setText('placeHead', 'City');
    const ranked = rows.slice().sort(function (a, b) { return amountOf(b) - amountOf(a); });
    renderPlaceTable(ranked, function (row) {
        const city = text(row, ['CityName'], 'Unknown');
        const state = text(row, ['StateName']);
        return state ? city + ' (' + state + ')' : city;
    });
    const total = ranked.reduce(function (sum, row) { return sum + amountOf(row); }, 0);
    const foot = document.getElementById('stateFoot');
    if (foot) {
        foot.innerHTML = ranked.length ? '<tr><td></td><td>Total</td><td></td><td class="num">' + formatMeasure(total) +
            '</td><td class="num">100%</td><td></td></tr>' : '';
    }
    setText('stateNote', ranked.length ? ranked.length + ' cities billed.' : '');
}
function renderPlaceTable(rows, nameOf) {
    const max = rows.reduce(function (peak, row) { return Math.max(peak, amountOf(row)); }, 1);
    const total = rows.reduce(function (sum, row) { return sum + amountOf(row); }, 0) || 1;
    setHtml('stateBody', rows.map(function (row, index) {
        const value = amountOf(row);
        return '<tr><td>' + (index + 1) + '</td><td>' + escapeHtml(nameOf(row)) + '</td><td><div class="smd-mini"><span style="width:' +
            (value / max * 100) + '%"></span></div></td><td class="num">' + formatMeasure(value) + '</td><td class="num">' +
            formatPct(value * 100 / total) + '</td><td class="num">' + growthHtml(value, previousOf(row)) + '</td></tr>';
    }).join('') || '<tr><td colspan="6">No domestic sale in this range</td></tr>');
}
/* ---------- India choropleth (real state shapes) ---------- */
const INDIA_GEO_URLS = [
    window.SMD_INDIA_GEOJSON_URL || '',
    new URL('./india-states.geojson', import.meta.url).href,
    'https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson',
    'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@main/geojson/india.geojson'
].filter(Boolean);
const GEO_ALIASES = {
    'orissa': 'odisha',
    'uttaranchal': 'uttarakhand',
    'nct of delhi': 'delhi',
    'national capital territory of delhi': 'delhi',
    'pondicherry': 'puducherry',
    'chattisgarh': 'chhattisgarh',
    'telengana': 'telangana',
    'andaman and nicobar': 'andaman and nicobar islands',
    'andaman and nicobar island': 'andaman and nicobar islands',
    'dadra and nagar haveli': 'dadra and nagar haveli and daman and diu',
    'daman and diu': 'dadra and nagar haveli and daman and diu'
};
let geoPromise = null;
let geoShapes = null;
let mapRows = [];

function geoKey(name) {
    let key = String(name || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
    key = key.replace(/^the /, '');
    return GEO_ALIASES[key] || key;
}
function geoStateName(props) {
    props = props || {};
    const keys = ['st_nm', 'ST_NM', 'NAME_1', 'name', 'NAME', 'State', 'STATE', 'state', 'stname', 'STNAME'];
    for (let i = 0; i < keys.length; i++) {
        if (props[keys[i]]) return String(props[keys[i]]);
    }
    return '';
}
function loadIndiaGeo() {
    if (geoPromise) return geoPromise;
    geoPromise = (function tryNext(index) {
        if (index >= INDIA_GEO_URLS.length) return Promise.resolve(null);
        return fetch(INDIA_GEO_URLS[index]).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        }).then(function (json) {
            if (!json || !Array.isArray(json.features) || !json.features.length) throw new Error('Not a feature collection');
            return json;
        }).catch(function () { return tryNext(index + 1); });
    })(0);
    return geoPromise;
}
function geoRings(geometry) {
    if (!geometry) return [];
    if (geometry.type === 'Polygon') return geometry.coordinates;
    if (geometry.type === 'MultiPolygon') {
        return geometry.coordinates.reduce(function (all, poly) { return all.concat(poly); }, []);
    }
    return [];
}
function buildGeoShapes(geo) {
    let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
    geo.features.forEach(function (feature) {
        geoRings(feature.geometry).forEach(function (ring) {
            ring.forEach(function (pt) {
                if (pt[0] < minLon) minLon = pt[0];
                if (pt[0] > maxLon) maxLon = pt[0];
                if (pt[1] < minLat) minLat = pt[1];
                if (pt[1] > maxLat) maxLat = pt[1];
            });
        });
    });
    const k = Math.cos(22 * Math.PI / 180);
    const scale = 1000 / ((maxLon - minLon) * k);
    const pad = 20;
    const project = function (pt) {
        return [(pt[0] - minLon) * k * scale + pad, (maxLat - pt[1]) * scale + pad];
    };
    const shapes = geo.features.map(function (feature) {
        const name = geoStateName(feature.properties);
        let best = null;
        let d = '';
        geoRings(feature.geometry).forEach(function (ring) {
            const pts = [];
            ring.forEach(function (raw) {
                const p = project(raw);
                const last = pts[pts.length - 1];
                if (!last || Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) >= 1.6) pts.push(p);
            });
            if (pts.length < 3) return;
            d += 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') + 'Z';
            let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
            pts.forEach(function (p) {
                if (p[0] < x0) x0 = p[0];
                if (p[0] > x1) x1 = p[0];
                if (p[1] < y0) y0 = p[1];
                if (p[1] > y1) y1 = p[1];
            });
            const area = (x1 - x0) * (y1 - y0);
            if (!best || area > best.area) best = { area: area, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
        });
        return { name: name, key: geoKey(name), d: d, cx: best ? best.cx : 0, cy: best ? best.cy : 0, area: best ? best.area : 0 };
    }).filter(function (shape) { return shape.d; });
    const height = (maxLat - minLat) * scale + pad * 2;
    return { shapes: shapes, width: 1000 + pad * 2, height: height };
}
function mapKeyForRow(name) {
    let key = geoKey(name);
    const hit = stateMasterIndex[normalizeStateKey(name)];
    if (hit && hit.stateName) key = geoKey(hit.stateName);
    return key;
}
function drawGeoMap(box, geo, rows) {
    const svg = box.querySelector('svg');
    if (!svg) return false;
    if (!geoShapes) geoShapes = buildGeoShapes(geo);
    const byKey = {};
    rows.forEach(function (row) {
        const value = amountOf(row);
        if (value <= 0) return;
        const key = mapKeyForRow(text(row, ['StateName'], ''));
        byKey[key] = (byKey[key] || 0) + value;
    });
    const max = Object.keys(byKey).reduce(function (peak, key) { return Math.max(peak, byKey[key]); }, 1);

    let fills = '';
    let labels = '';
    let matched = 0;
    geoShapes.shapes.forEach(function (shape) {
        const value = byKey[shape.key] || 0;
        const color = shade(value, max);
        const title = escapeHtml(shape.name + (value > 0 ? ' - ' + formatMeasure(value) : ' - no sale'));
        fills += '<path class="smd-geo-state" d="' + shape.d + '" fill="' + (value > 0 ? color.fill : '#e6ecf5') +
            '" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"><title>' + title + '</title></path>';
        if (value > 0) {
            matched++;
            const halo = color.ink === '#fff' ? 'rgba(11,58,130,.7)' : 'rgba(255,255,255,.85)';
            const size = shape.area > 9000 ? 1 : 0.85;
            labels += '<text x="' + shape.cx.toFixed(1) + '" y="' + shape.cy.toFixed(1) + '" text-anchor="middle" fill="' + color.ink +
                '" style="paint-order:stroke;stroke:' + halo + ';stroke-width:5;stroke-linejoin:round;pointer-events:none">' +
                '<tspan font-size="' + Math.round(30 * size) + '" font-weight="800">' + escapeHtml(resolveStateShort(shape.name)) + '</tspan>' +
                '<tspan x="' + shape.cx.toFixed(1) + '" dy="' + Math.round(26 * size) + '" font-size="' + Math.round(24 * size) +
                '" font-weight="700">' + escapeHtml(formatMeasure(value)) + '</tspan></text>';
        }
    });
    svg.setAttribute('viewBox', '0 0 ' + geoShapes.width.toFixed(0) + ' ' + geoShapes.height.toFixed(0));
    svg.innerHTML = fills + labels;

    box.querySelectorAll('.smd-pin, .smd-map-legend, .smd-map-count').forEach(function (el) { el.remove(); });
    const legend = document.createElement('div');
    legend.className = 'smd-map-legend';
    legend.innerHTML = '<span>Less</span><i></i><span>More sale</span>';
    box.appendChild(legend);
    const count = document.createElement('div');
    count.className = 'smd-map-count';
    count.textContent = matched + ' of ' + geoShapes.shapes.length + ' states / UTs billed';
    box.appendChild(count);
    return true;
}
function renderMap(rows) {
    const box = document.getElementById('stateMap');
    if (!box) return;
    mapRows = rows || [];
    loadIndiaGeo().then(function (geo) {
        if (geo && drawGeoMap(box, geo, mapRows)) return;
        drawPinMap(box, mapRows);
    });
}
function drawPinMap(box, rows) {
    box.querySelectorAll('.smd-pin').forEach(function (pin) { pin.remove(); });
    const plotted = rows.filter(function (row) { return amountOf(row) > 0; })
        .sort(function (a, b) { return amountOf(b) - amountOf(a); });
    const max = plotted.reduce(function (peak, row) { return Math.max(peak, amountOf(row)); }, 1);
    plotted.forEach(function (row, index) {
        const name = text(row, ['StateName'], 'Unknown');
        const code = resolveStateShort(name);
        const pos = mapPinPosition(index, plotted.length);
        const color = shade(amountOf(row), max);
        const pin = document.createElement('div');
        pin.className = 'smd-pin';
        pin.style.left = pos[0] + '%';
        pin.style.top = pos[1] + '%';
        pin.style.background = color.fill;
        pin.style.color = color.ink;
        pin.title = name + ' ' + formatMeasure(amountOf(row));
        pin.innerHTML = escapeHtml(code) + '<span>' + formatMeasure(amountOf(row)) + '</span>';
        box.appendChild(pin);
    });
}
function contributionView(rows) {
    const parties = rows.filter(function (row) { return text(row, ['RowType']) === 'PARTY'; });
    const other = rows.filter(function (row) { return text(row, ['RowType']) === 'OTHER'; });
    const total = rows.filter(function (row) { return text(row, ['RowType']) === 'TOTAL'; });
    if (showAllCustomers) return parties.concat(other).concat(total);
    const top = parties.filter(function (row) { return num(row, ['Rn']) <= 5; });
    const next = parties.filter(function (row) { return num(row, ['Rn']) > 5; });
    const nextRow = next.length ? [{
        RowType: 'NEXT',
        PartyName: 'Next ' + next.length + ' customers',
        SaleValue: next.reduce(function (sum, row) { return sum + num(row, ['SaleValue']); }, 0),
        QtyMT: next.reduce(function (sum, row) { return sum + num(row, ['QtyMT']); }, 0),
        SharePct: next.reduce(function (sum, row) { return sum + num(row, ['SharePct']); }, 0),
        QtySharePct: next.reduce(function (sum, row) { return sum + num(row, ['QtySharePct']); }, 0)
    }] : [];
    return top.concat(nextRow).concat(other).concat(total);
}
function renderContribution(rows) {
    const parties = rows.filter(function (row) { return text(row, ['RowType']) === 'PARTY'; });
    const other = rows.find(function (row) { return text(row, ['RowType']) === 'OTHER'; });
    const slices = parties.slice(0, 5);
    if (parties.length > 5) {
        const next = parties.slice(5);
        slices.push({
            PartyName: 'Next ' + next.length,
            SaleValue: next.reduce(function (sum, row) { return sum + num(row, ['SaleValue']); }, 0),
            QtyMT: next.reduce(function (sum, row) { return sum + num(row, ['QtyMT']); }, 0)
        });
    }
    if (other) slices.push(other);
    const labels = slices.map(function (row) { return text(row, ['PartyName'], 'Customer'); });
    const values = slices.map(amountOf);
    const colors = slices.map(function (row, index) { return text(row, ['RowType']) === 'OTHER' ? '#cbd5e1' : PALETTE[index % PALETTE.length]; });
    const top10 = parties.reduce(function (sum, row) { return sum + amountOf(row); }, 0);
    const grand = top10 + (other ? amountOf(other) : 0);
    renderDonut('chartContribution', labels, values, colors, [
        { text: formatPct(grand ? top10 * 100 / grand : 0), font: '700 16px Segoe UI, sans-serif' },
        { text: 'Top 10 share', font: '600 11px Segoe UI, sans-serif', color: '#64748b' }
    ]);
    const view = contributionView(rows);
    setHtml('contributionBody', view.length ? view.map(function (row) {
        const strong = text(row, ['RowType']) === 'TOTAL' ? ' style="font-weight:800"' : '';
        return '<tr' + strong + '><td>' + escapeHtml(text(row, ['PartyName'])) + '</td><td class="num">' + formatMeasure(amountOf(row)) +
            '</td><td class="num">' + formatPct(shareOf(row)) + '</td></tr>';
    }).join('') : '<tr><td colspan="3">No sale in this range</td></tr>');
    const top5 = parties.slice(0, 5).reduce(function (sum, row) { return sum + shareOf(row); }, 0);
    const top10Share = parties.reduce(function (sum, row) { return sum + shareOf(row); }, 0);
    const top3 = parties.slice(0, 3).map(shareOf).filter(function (value) { return value > 0; });
    let note = '';
    if (parties.length) note = 'The top 5 customers give ' + formatPct(top5) + ' of sale and the top 10 give ' + formatPct(top10Share) + '.';
    if (top3.length >= 3) {
        note += ' Losing any one of the top 3 would cut monthly sale by ' + formatPct(Math.min.apply(null, top3)) +
            ' to ' + formatPct(Math.max.apply(null, top3)) + '.';
    }
    setText('contributionNote', note);
}
function cumulativeAt(points, customerNo) {
    const key = measure === 'QTY' ? 'CumulativeQtyPct' : 'CumulativeValuePct';
    let value = 0;
    points.forEach(function (point) {
        if (num(point, ['CustomerNo']) <= customerNo) value = num(point, [key]);
    });
    return value;
}
function renderDependence(points, contribution) {
    const ordered = points.slice().sort(function (a, b) { return num(a, ['CustomerNo']) - num(b, ['CustomerNo']); });
    const count = ordered.length ? num(ordered[0], ['PartyCount']) : 0;
    const key = measure === 'QTY' ? 'CumulativeQtyPct' : 'CumulativeValuePct';
    if (!ordered.length) {
        destroyChart('chartDependence');
        setHtml('depBoxes', '');
        setText('depSummary', 'Customers ranked biggest first');
        setText('depNote', '');
        return;
    }
    renderChart('chartDependence', {
        type: 'line',
        data: {
            labels: ordered.map(function (point) { return num(point, ['CustomerNo']); }),
            datasets: [{
                data: ordered.map(function (point) { return num(point, [key]); }),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.18)',
                fill: true,
                tension: 0.35,
                pointRadius: 0,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { min: 0, max: 100, ticks: { callback: function (value) { return value + '%'; } } },
                x: { title: { display: true, text: 'Number of customers, biggest first (' + count + ')' } }
            }
        }
    });
    const top10 = cumulativeAt(ordered, 10);
    const top20 = cumulativeAt(ordered, 20);
    const top50 = cumulativeAt(ordered, 50);
    const tailFrom = count > 100 ? 100 : (count > 50 ? 50 : 10);
    const lastCount = Math.max(count - tailFrom, 0);
    const lastShare = Math.max(0, 100 - cumulativeAt(ordered, tailFrom));
    setText('depSummary', 'Top 10 = ' + formatPct(top10) + '    Top 20 = ' + formatPct(top20) + '    Top 50 = ' + formatPct(top50));
    setHtml('depBoxes',
        '<div><span>TOP 10</span><strong>' + formatPct(top10) + '</strong></div>' +
        '<div><span>TOP 50</span><strong>' + formatPct(top50) + '</strong></div>' +
        '<div><span>LAST ' + lastCount + '</span><strong>' + formatPct(lastShare) + '</strong></div>');
    const parties = (contribution || []).filter(function (row) { return text(row, ['RowType']) === 'PARTY'; });
    const top3 = parties.slice(0, 3).map(shareOf).filter(function (value) { return value > 0; });
    let note = '';
    if (top3.length >= 3) {
        note = 'Losing any one of the top 3 would cut monthly sale by ' + formatPct(Math.min.apply(null, top3)) +
            ' to ' + formatPct(Math.max.apply(null, top3)) + '. ';
    }
    if (lastCount) note += 'The smallest ' + lastCount + ' customers together give ' + formatPct(lastShare) + ' of sale.';
    setText('depNote', note);
}

function loadDashboard() {
    const filters = readFilters();
    updateBanner();
    placeMode = 'state';
    showLoader();
    SalesManagementDashboradService.GetMultipleTableSalesManagementDashboardData(filters).then(function (response) {
        paint(flattenTables(response), true);
    }).catch(function (error) {
        console.error('Sales Management Dashboard load failed', error);
        if (typeof window.toastr !== 'undefined') window.toastr.error('Dashboard could not be loaded. Check the API and SQL procedure.');
    }).finally(hideLoader);
}
function loadCities() {
    const filters = readFilters();
    filters.Mode = 'CITY';
    showLoader();
    SalesManagementDashboradService.GetMultipleTableSalesManagementDashboardData(filters).then(function (response) {
        const tables = flattenTables(response);
        cityRows = tables[0] || [];
        placeMode = 'city';
        renderCity(cityRows);
    }).catch(function (error) {
        console.error('City drill failed', error);
    }).finally(hideLoader);
}
function asRows(response) {
    if (response && !Array.isArray(response)) {
        if (Array.isArray(response.data)) return response.data;
        if (Array.isArray(response.Data)) return response.Data;
        if (Array.isArray(response.Value)) return response.Value;
    }
    const tables = flattenTables(response);
    if (tables.length && Array.isArray(tables[0])) return tables[0];
    return Array.isArray(response) ? response : [];
}
let partyRequestNo = 0;
/** Party list follows the picked marketing persons (and the Show Recursive checkbox), same as Customer Dashboard. */
function loadPartyOptions(filterPanel) {
    const values = typeof filterPanel.getFilterValues === 'function' ? (filterPanel.getFilterValues() || {}) : {};
    const person = values.ddlSalesPerson;
    const picked = person && !person.isAll && Array.isArray(person.values) ? person.values.filter(Boolean) : [];
    const nested = values.chkShowRecursive === false ? 'N' : 'Y';
    const ticket = ++partyRequestNo;
    const calls = (picked.length ? picked : [0]).map(function (code) {
        return CRMReportsServices.GetDealerList(code, nested).then(asRows).catch(function () { return []; });
    });
    return Promise.all(calls).then(function (lists) {
        if (ticket !== partyRequestNo) return;
        const merged = lists.reduce(function (all, list) { return all.concat(list || []); }, []);
        filterPanel.updateFilterData('ddlParty', mapNamed(merged, ['AccountDesp', 'Desp', 'Name']));
    }).catch(function (error) {
        console.error('Party list failed', error);
    });
}
function watchSalesPerson(filterPanel) {
    const root = filterPanel.shadowRoot;
    if (!root) return;
    let timer = null;
    const reload = function () {
        clearTimeout(timer);
        timer = setTimeout(function () { loadPartyOptions(filterPanel); }, 400);
    };
    const wrapper = root.getElementById('ddlSalesPerson');
    if (wrapper && wrapper.getAttribute('data-smd-bound') !== '1') {
        wrapper.setAttribute('data-smd-bound', '1');
        // change bubbles from every person checkbox and from Select All
        wrapper.addEventListener('change', reload);
    }
    const recursive = root.getElementById('chkShowRecursive');
    if (recursive && recursive.getAttribute('data-smd-bound') !== '1') {
        recursive.setAttribute('data-smd-bound', '1');
        recursive.addEventListener('change', reload);
    }
}
function loadFilterOptions(filterPanel) {
    const jobs = [
        MarketingManMasterService.GetZoneList().then(function (rows) {
            filterPanel.updateFilterData('ddlZone', mapNamed(asRows(rows), ['ZoneName', 'ZoneDesp', 'Desp', 'Field', 'Name']));
        }).catch(function (error) { console.error('Zone list failed', error); }),
        StateMasterService.GetStateMasterList('All').then(function (rows) {
            const stateRows = asRows(rows);
            buildStateMasterIndex(stateRows);
            filterPanel.updateFilterData('ddlState', mapStates(stateRows));
        }).catch(function (error) { console.error('State list failed', error); }),
        VendorMasterService.GetIndustryType().then(function (rows) {
            filterPanel.updateFilterData('ddlIndustryType', mapNamed(asRows(rows), ['IndustryType', 'Desp', 'Name']));
        }).catch(function (error) { console.error('Industry list failed', error); }),
        CRMReportsServices.GetItemMasterDropDownlist().then(function (rows) {
            filterPanel.updateFilterData('ddlProduct', mapNamed(asRows(rows), ['ItemName', 'Desp', 'Name']));
        }).catch(function (error) { console.error('Product list failed', error); }),
        CRMReportsServices.GetSalespersonList().then(function (rows) {
            filterPanel.updateFilterData('ddlSalesPerson', mapNamed(asRows(rows), ['PersonName', 'Desp', 'Name']));
            watchSalesPerson(filterPanel);
        }).catch(function (error) { console.error('Marketing person list failed', error); }),
        loadPartyOptions(filterPanel)
    ];
    return Promise.all(jobs);
}
function initFilterSidePanelControl() {
    const filterPanel = document.getElementById('filterPanel');
    if (!filterPanel) return;
    if (!customElements.get('filter-side-panel-control')) {
        customElements.whenDefined('filter-side-panel-control').then(initFilterSidePanelControl);
        return;
    }
    if (filterReady) return;
    filterReady = true;

    const range = currentMonthRange();
    filterPanel.setFilters([
        { id: 'dateRange', type: 'daterange', label: 'Date Range', defaultFrom: range.fromDate, defaultTo: range.toDate },
        { id: 'chkShowRecursive', type: 'checkbox', label: 'Show Recursive Marketing Man', checkboxLabel: 'Show Recursive Marketing Man', defaultChecked: true },
        { id: 'ddlSalesPerson', type: 'multiselect', label: 'Marketing person', data: [] },
        { id: 'ddlParty', type: 'multiselect', label: 'Party', data: [] },
        { id: 'ddlZone', type: 'multiselect', label: 'Zone', data: [] },
        { id: 'ddlState', type: 'multiselect', label: 'State', data: [] },
        { id: 'ddlIndustryType', type: 'multiselect', label: 'Industry type', data: [] },
        { id: 'ddlProduct', type: 'multiselect', label: 'Product', data: [] }
    ], { useCommaToken: true });

    filterPanel.addEventListener('filtersapplied', function () {
        loadDashboard();
    });

    loadFilterOptions(filterPanel).finally(function () {
        updateBanner();
        loadDashboard();
    });
}
function resizeActiveCharts() {
    Object.keys(charts).forEach(function (key) {
        const chart = charts[key];
        if (chart && typeof chart.resize === 'function') {
            try { chart.resize(); } catch (e) { /* ignore */ }
        }
    });
}
function excelSheetName(name) {
    return String(name || 'Sheet').replace(/[\\/*?:\[\]]/g, '').substring(0, 31);
}
function appendExcelSheet(wb, name, rows) {
    if (!rows || !rows.length || typeof XLSX === 'undefined' || !XLSX.utils) return false;
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), excelSheetName(name));
    return true;
}
function exportDashboardExcel() {
    if (!lastTables || !lastTables.length) {
        if (typeof window.toastr !== 'undefined') window.toastr.warning('Apply filter and load dashboard data first.');
        else alert('Apply filter and load dashboard data first.');
        return;
    }
    if (typeof XLSX === 'undefined' || !XLSX.utils) {
        if (typeof window.toastr !== 'undefined') window.toastr.error('Excel library failed to load. Refresh the page.');
        else alert('Excel library failed to load. Refresh the page.');
        return;
    }
    const wb = XLSX.utils.book_new();
    let sheetCount = 0;
    const kpi = lastTables[0] && lastTables[0][0];
    if (kpi && appendExcelSheet(wb, 'Summary', [kpi])) sheetCount++;
    const sections = [
        ['Marketing person', lastTables[1]],
        ['Industry type', lastTables[2]],
        ['Month wise', lastTables[3]],
        ['Sale type', lastTables[4]],
        ['Top items', lastTables[5]],
        ['Top parties', lastTables[6]],
        ['State wise', lastTables[7]],
        ['Customer contribution', lastTables[8]],
        ['Customer dependence', lastTables[9]]
    ];
    sections.forEach(function (pair) {
        if (appendExcelSheet(wb, pair[0], pair[1] || [])) sheetCount++;
    });
    const outstanding = lastTables.slice(10).reduce(function (all, table) { return all.concat(table || []); }, []);
    if (appendExcelSheet(wb, 'Outstanding', outstanding)) sheetCount++;
    if (!sheetCount) {
        if (typeof window.toastr !== 'undefined') window.toastr.warning('No data to export for the current filters.');
        else alert('No data to export for the current filters.');
        return;
    }
    const filters = readFilters();
    const from = String(filters.fromDate || '0').replace(/\//g, '-');
    const to = String(filters.toDate || '0').replace(/\//g, '-');
    ExportToExcelControl.ExportWorkbook(wb, 'SalesManagementDashboard_' + from + '_' + to);
}
function printDashboardPdf() {
    resizeActiveCharts();
    window.print();
}
function bindEvents() {
    const btnExcel = document.getElementById('btnSmdExportExcel');
    const btnPrint = document.getElementById('btnSmdPrintPdf');
    if (btnExcel) btnExcel.addEventListener('click', exportDashboardExcel);
    if (btnPrint) btnPrint.addEventListener('click', printDashboardPdf);
    document.getElementById('btnDrillCity').addEventListener('click', function () {
        if (placeMode === 'city') {
            placeMode = 'state';
            renderState(stateRows);
            return;
        }
        loadCities();
    });
    document.getElementById('btnAllCustomers').addEventListener('click', function () {
        showAllCustomers = !showAllCustomers;
        this.textContent = showAllCustomers ? 'Grouped' : 'All customers';
        renderContribution(contributionRows);
    });
}

function start() {
    bindEvents();
    updateBanner();
    initFilterSidePanelControl();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
