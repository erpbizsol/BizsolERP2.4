import { StockAgeingReportService } from './JSServices/_StockAgeingReportService.js';

const YIELD_OPEN_TO = -1;
let YIELD_BANDS = [];
let YIELD_RED_CLASS = '';
let yieldConfigReady = Promise.resolve();
let yieldStyleSelectorTemplate =
    '#tblProductionReport td.{cls}, .tbl-sum td.{cls}';

function toNum(v) {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
}

function normalizeYieldHex(v) {
    if (v == null) return '#888888';
    let s = String(v).trim();
    if (!s.startsWith('#')) s = '#' + s;
    return /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(s) ? s : '#888888';
}

function contrastTextColor(hex) {
    const h = normalizeYieldHex(hex).replace('#', '').slice(0, 6);
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.55 ? '#111827' : '#ffffff';
}

function normalizeYieldBand(raw) {
    const codeRaw = raw?.Code ?? raw?.code ?? raw?.Id ?? raw?.id;
    const code = codeRaw != null && Number(codeRaw) > 0 ? Number(codeRaw) : null;
    const from = toNum(raw?.FromRange ?? raw?.fromRange ?? raw?.RangeFrom ?? raw?.rangeFrom);
    const toRaw = raw?.FromTo ?? raw?.fromTo ?? raw?.RangeTo ?? raw?.rangeTo;
    const toNumTo = toNum(toRaw);
    const fromTo =
        toNumTo === null &&
        (toRaw === YIELD_OPEN_TO || toRaw === null || toRaw === undefined || String(toRaw).trim() === '')
            ? YIELD_OPEN_TO
            : toNumTo;
    const colour = normalizeYieldHex(raw?.Colour ?? raw?.colour ?? raw?.ColourCode ?? raw?.colourCode);
    return {
        Code: code,
        FromRange: from,
        FromTo: fromTo,
        Colour: colour,
    };
}

function normalizeYieldListResponse(raw) {
    let inner = raw;
    if (raw && typeof raw === 'object') {
        inner = raw.data !== undefined ? raw.data : raw.Data !== undefined ? raw.Data : raw;
    }
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        if (Array.isArray(inner.rows)) inner = inner.rows;
        else if (Array.isArray(inner.Rows)) inner = inner.Rows;
    }
    if (!Array.isArray(inner)) return [];
    return inner.map(normalizeYieldBand).filter((b) => b.Code != null && b.FromRange !== null);
}

function sortYieldBands(bands) {
    bands.sort((a, b) => a.FromRange - b.FromRange);
}

function findYieldBand(n) {
    if (n === null || n === 0) return null;
    for (let i = 0; i < YIELD_BANDS.length; i++) {
        const b = YIELD_BANDS[i];
        if (n < b.FromRange) continue;
        if (b.FromTo === YIELD_OPEN_TO || n <= b.FromTo) return b;
    }
    return null;
}

function applyYieldBandStyles(bands) {
    let el = document.getElementById('yield-dynamic-styles');
    if (!el) {
        el = document.createElement('style');
        el.id = 'yield-dynamic-styles';
        document.head.appendChild(el);
    }
    let css = '';
    bands.forEach((b) => {
        const cls = 'yield-band-' + b.Code;
        const fg = contrastTextColor(b.Colour);
        const selector = yieldStyleSelectorTemplate.replace(/\{cls\}/g, cls);
        css += `${selector}{background:${b.Colour} !important;color:${fg};font-weight:600;}\n`;
    });
    el.textContent = css;
}

function setYieldBands(bands) {
    YIELD_BANDS = bands;
    sortYieldBands(YIELD_BANDS);
    applyYieldBandStyles(YIELD_BANDS);
    YIELD_RED_CLASS = YIELD_BANDS.length ? 'yield-band-' + YIELD_BANDS[0].Code : '';
}

function loadYieldConfiguration() {
    yieldConfigReady = StockAgeingReportService.GetYieldConfigurationList()
        .then(function (raw) {
            setYieldBands(normalizeYieldListResponse(raw));
        })
        .catch(function () {
            setYieldBands([]);
            if (typeof toastr !== 'undefined') {
                toastr.warning('Yield colour configuration could not be loaded.');
            }
        });
    return yieldConfigReady;
}

function yieldCls(v) {
    const band = findYieldBand(toNum(v));
    return band ? 'yield-band-' + band.Code : '';
}

function getYieldColour(v) {
    const band = findYieldBand(toNum(v));
    return band ? band.Colour : '';
}

function applyYieldCellColour(td, yieldValue) {
    if (!td) return;
    const n = toNum(yieldValue);
    if (n === null || n === 0) {
        td.style.backgroundColor = '';
        td.style.color = '';
        td.style.fontWeight = '';
        return;
    }
    const colour = getYieldColour(n);
    if (!colour) {
        td.style.backgroundColor = '';
        td.style.color = '';
        td.style.fontWeight = '';
        return;
    }
    td.style.backgroundColor = colour;
    td.style.color = contrastTextColor(colour);
    td.style.fontWeight = '600';
}

function configureYieldStyleSelectors(template) {
    yieldStyleSelectorTemplate = template;
    if (YIELD_BANDS.length) applyYieldBandStyles(YIELD_BANDS);
}

function getYieldRedClass() {
    return YIELD_RED_CLASS;
}

function getYieldConfigReady() {
    return yieldConfigReady;
}

export {
    loadYieldConfiguration,
    getYieldConfigReady,
    configureYieldStyleSelectors,
    yieldCls,
    getYieldColour,
    applyYieldCellColour,
    getYieldRedClass,
};
