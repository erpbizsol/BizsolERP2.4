import { StockAgeingReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_StockAgeingReportService.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { createSizeFilterControlModal, initializeSizeFilterControl } from '../../Bizsol.WebERP.UI.Shared/js/Pages/CommonSizeFilterControl.js';
import { initializeAgeingParameterControl } from '../../Bizsol.WebERP.UI.Shared/js/Pages/CommonAgeingParameterControl.js';

var baseUrl = sessionStorage.getItem('AppBaseURL');
let G_ItemSizeMaster_Codes = '';
let G_AgeingParameter = null;   // { Desp, Rows, AgeingParameters, … }
/** Raw rows from GetReportOptionList (includes DefaultFilterValues). */
let G_ReportOptionList = [];

// Stock With Chart state
let SWC_USE_DUMMY_DATA = false; // set false to use real API
let SWC_SelectedCategoryCode = 0;
let SWC_SelectedCategoryName = '';
let SWC_SelectedGodownCode = 0;
let SWC_SelectedGodownName = '';
let SWC_CategoryChartInstance = null;
let SWC_GodownChartInstance = null;
let SWC_ItemsChartInstance = null;
let SWC_CurrentPayload = null; // populated by LoadStockWithChart from the common filters

// ── Modern curated palette (20 hand-picked colours) ─────────
const SWC_PALETTE = [
    '#6366f1', // indigo
    '#22d3ee', // cyan
    '#10b981', // emerald
    '#f59e0b', // amber
    '#f43f5e', // rose
    '#8b5cf6', // violet
    '#06b6d4', // sky-cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#3b82f6', // blue
    '#a855f7', // purple
    '#14b8a6', // teal
    '#ec4899', // pink
    '#eab308', // yellow
    '#0ea5e9', // sky
    '#ef4444', // red
    '#d946ef', // fuchsia
    '#0d9488', // teal-dark
    '#7c3aed', // violet-dark
    '#059669'  // green
];

// Returns `count` distinct colours, cycling the palette and adjusting
// lightness for runs beyond 20 so colours are never identical.
function SWC_GenerateColors(count) {
    var n = SWC_PALETTE.length;
    var result = [];
    for (var i = 0; i < count; i++) {
        var base = SWC_PALETTE[i % n];
        if (i < n) {
            result.push(base);
        } else {
            var round = Math.floor(i / n);
            result.push(SWC_AdjustHex(base, round % 2 === 0 ? 18 : -18));
        }
    }
    return result;
}

// Shifts the lightness channel of a hex colour by `delta` percentage points.
function SWC_AdjustHex(hex, delta) {
    var r = parseInt(hex.slice(1, 3), 16) / 255;
    var g = parseInt(hex.slice(3, 5), 16) / 255;
    var b = parseInt(hex.slice(5, 7), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else                h = ((r - g) / d + 4) / 6;
    }
    l = Math.min(0.82, Math.max(0.22, l + delta / 100));
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    function _h2r(p, q, t) {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }
    return '#' + [_h2r(p, q, h + 1/3), _h2r(p, q, h), _h2r(p, q, h - 1/3)]
        .map(function (x) { return Math.round(x * 255).toString(16).padStart(2, '0'); })
        .join('');
}

const LOGICAL_STOCK_COLUMN_MAP = [
    ['PhysicalStock', 'Physical Stock'],
    ['BalanceQty', 'Balance Qty'],
    ['SaleOrderQty', 'Sale Order Qty'],
    ['PendingCRMOrder', 'Pending CRM Order'],
    ['RollingForcast', 'Rolling Forecast'],
    ['PendingEnquiry', 'Pending Enquiry'],
    ['MinimumQty', 'Minimum Qty']
];

function filterLogicalStockRows(rows) {
    return rows.filter(function (row) {
        var ps = parseFloat(row.PhysicalStock);
        var bq = parseFloat(row.BalanceQty);
        var psVal = isNaN(ps) ? 0 : ps;
        var bqVal = isNaN(bq) ? 0 : bq;
        return !(psVal === 0 && bqVal === 0);
    });
}

function mapLogicalStockRowForGrid(raw) {
    var apiKeysMappedToDisplay = new Set(
        LOGICAL_STOCK_COLUMN_MAP.map(function (p) {
            return p[0];
        })
    );

    var itemName =
        raw['Item Name'] !== undefined ? raw['Item Name'] : raw['ItemName'];
    var sizeDesp = raw['SizeDesp'];

    /** Logical-stock numeric fields (display keys) */
    var logicalValues = {};
    LOGICAL_STOCK_COLUMN_MAP.forEach(function (pair) {
        var apiKey = pair[0];
        var displayKey = pair[1];
        if (!Object.prototype.hasOwnProperty.call(raw, apiKey)) {
            return;
        }
        var v = raw[apiKey];
        if (v !== undefined && v !== null && v !== '' && !isNaN(parseFloat(v))) {
            logicalValues[displayKey] = parseFloat(v).toFixed(3);
        } else {
            logicalValues[displayKey] = v === undefined || v === null ? '' : v;
        }
    });

    /** Any other API fields (warehouse, etc.) — placed after Item Name / SizeDesp, before qty totals */
    var passthrough = {};
    Object.keys(raw).forEach(function (key) {
        if (
            key === 'Item Name' ||
            key === 'ItemName' ||
            key === 'SizeDesp' ||
            key === 'Code' ||
            key === 'ItemMaster_Code'
        ) {
            return;
        }
        if (apiKeysMappedToDisplay.has(key)) {
            return;
        }
        passthrough[key] = raw[key];
    });
    var passthroughKeys = Object.keys(passthrough).sort();

    var out = {};
    if (itemName !== undefined) {
        out['Item Name'] = itemName;
    }
    if (sizeDesp !== undefined) {
        out['SizeDesp'] = sizeDesp;
    }
    passthroughKeys.forEach(function (k) {
        out[k] = passthrough[k];
    });
    LOGICAL_STOCK_COLUMN_MAP.forEach(function (pair) {
        var displayKey = pair[1];
        if (Object.prototype.hasOwnProperty.call(logicalValues, displayKey)) {
            out[displayKey] = logicalValues[displayKey];
        }
    });
    if (raw['Code'] !== undefined) {
        out['Code'] = raw['Code'];
    }
    if (raw['ItemMaster_Code'] !== undefined) {
        out['ItemMaster_Code'] = raw['ItemMaster_Code'];
    }

    return out;
}

/** FIFO Stock Ageing: bucket headers come from Ageing Parameter (DaysDesp); must match API property names. */
const FIFO_GRID_NON_NUMERIC_KEYS = new Set(['Item Name', 'SizeDesp', 'Code', 'ItemMaster_Code']);

const FIFO_FALLBACK_BUCKET_KEYS = ['0-90 D', '91-120 D', '121-180 D', '> 180 D'];

function getFifoBucketKeysFromAgeingParameter() {
    const rows = G_AgeingParameter && Array.isArray(G_AgeingParameter.Rows) ? G_AgeingParameter.Rows : [];
    const keys = [];
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const desp = r && r.DaysDesp != null ? String(r.DaysDesp).trim() : '';
        if (desp) keys.push(desp);
    }
    return keys;
}

function inferFifoBucketKeysFromRow(sampleRow) {
    if (!sampleRow || typeof sampleRow !== 'object') {
        return FIFO_FALLBACK_BUCKET_KEYS.slice();
    }
    const ordered = [];
    Object.keys(sampleRow).forEach(function (k) {
        if (k === 'Total' || FIFO_GRID_NON_NUMERIC_KEYS.has(k)) return;
        ordered.push(k);
    });
    return ordered.length > 0 ? ordered : FIFO_FALLBACK_BUCKET_KEYS.slice();
}

function fifoRowHasTotalProperty(row) {
    if (!row || typeof row !== 'object') return false;
    if (Object.prototype.hasOwnProperty.call(row, 'Total')) return true;
    const keys = Object.keys(row);
    for (let i = 0; i < keys.length; i++) {
        if (String(keys[i]).trim() === 'Total') return true;
    }
    return false;
}

/**
 * @param {object} [sampleRow] First data row (used to detect Total and fallback order)
 */
function buildFifoStockAgeingGridColumnConfig(sampleRow) {
    let bucketKeys = getFifoBucketKeysFromAgeingParameter();
    if (bucketKeys.length === 0) {
        bucketKeys = inferFifoBucketKeysFromRow(sampleRow);
    }
    const hasTotal = fifoRowHasTotalProperty(sampleRow);
    const totalColKeys = bucketKeys.slice();
    if (hasTotal) totalColKeys.push('Total');

    const columnAlignment = {};
    bucketKeys.forEach(function (k) { columnAlignment[k] = 'right'; });
    if (hasTotal) columnAlignment.Total = 'right';

    return {
        bucketKeys: bucketKeys,
        numericFilterColumn: bucketKeys,
        totalColKeys: totalColKeys,
        columnAlignment: columnAlignment,
    };
}

function normalizeFifoRowKeysInPlace(row, bucketKeys, hasTotal) {
    const trimToKey = Object.create(null);
    Object.keys(row).forEach(function (k) {
        trimToKey[String(k).trim()] = k;
    });
    bucketKeys.forEach(function (canon) {
        const src = trimToKey[canon];
        if (!src || src === canon) return;
        row[canon] = row[src];
        delete row[src];
        trimToKey[canon] = canon;
    });
    if (hasTotal) {
        const src = trimToKey['Total'];
        if (src && src !== 'Total') {
            row.Total = row[src];
            delete row[src];
        }
    }
}

function formatFifoStockAgeingNumericCells(row, bucketKeys, hasTotal) {
    bucketKeys.forEach(function (key) {
        if (row[key] === undefined || row[key] === null || isNaN(row[key])) return;
        row[key] = parseFloat(row[key]).toFixed(3);
    });
    if (hasTotal && row.Total !== undefined && row.Total !== null && !isNaN(row.Total)) {
        row.Total = parseFloat(row.Total).toFixed(3);
    }
}

const STOCK_AGEING_THEAD_ID = 'table-head-StockAgeingReport';
const STOCK_AGEING_TBODY_ID = 'table-body-StockAgeingReport';
const BALANCE_QTY_NEGATIVE_ROW_BG = '#ffe8e8';
const SAR_TABLE_MIN_HEIGHT = 350;
let stockAgeingBalanceQtyHighlightTimerId = null;
let _sarHeightRaf = 0;
let _sarHeightHandlersBound = false;

function getSarViewportHeight() {
    return (window.visualViewport && window.visualViewport.height)
        ? window.visualViewport.height
        : (window.innerHeight || document.documentElement.clientHeight || 0);
}

function getSarFooterViewportOverlapHeight() {
    const footer = document.querySelector('footer.footer, footer.modern-footer');
    if (!footer) return 0;
    const viewportHeight = getSarViewportHeight();
    const rect = footer.getBoundingClientRect();
    const overlap = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
    return overlap > 0 && isFinite(overlap) ? overlap : 0;
}

function adjustStockAgeingReportTableHeight() {
    const tableWrapper = document.getElementById('sarTableWrapper');
    const tableCard = document.getElementById('StockAgeingReportTableCard');
    if (!tableWrapper || !tableCard || tableCard.offsetParent === null) {
        return;
    }

    const paginator = document.getElementById('paginator-StockAgeingReport');
    const paginatorHeight = paginator && paginator.offsetParent !== null
        ? paginator.getBoundingClientRect().height
        : 0;
    const cardRect = tableCard.getBoundingClientRect();
    const footerHeight = getSarFooterViewportOverlapHeight();
    const bottomGap = 8;
    let cardHeight = getSarViewportHeight() - cardRect.top - footerHeight - bottomGap;

    if (!isFinite(cardHeight)) {
        return;
    }
    cardHeight = Math.max(SAR_TABLE_MIN_HEIGHT + paginatorHeight, Math.floor(cardHeight));

    tableCard.style.height = cardHeight + 'px';
    tableCard.style.minHeight = cardHeight + 'px';

    let wrapperHeight = cardHeight - paginatorHeight;
    wrapperHeight = Math.max(SAR_TABLE_MIN_HEIGHT, Math.floor(wrapperHeight));

    tableWrapper.style.height = wrapperHeight + 'px';
    tableWrapper.style.maxHeight = wrapperHeight + 'px';
    tableWrapper.style.minHeight = wrapperHeight + 'px';
}

function scheduleStockAgeingReportTableHeightAdjust() {
    if (_sarHeightRaf) {
        cancelAnimationFrame(_sarHeightRaf);
    }
    _sarHeightRaf = requestAnimationFrame(function () {
        _sarHeightRaf = 0;
        adjustStockAgeingReportTableHeight();
    });
}

function bindStockAgeingReportHeightHandlers() {
    if (_sarHeightHandlersBound) {
        return;
    }
    _sarHeightHandlersBound = true;
    window.addEventListener('resize', scheduleStockAgeingReportTableHeightAdjust);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', scheduleStockAgeingReportTableHeightAdjust);
    }
    const sidebar = document.getElementById('modern-sidebar');
    if (sidebar && typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(scheduleStockAgeingReportTableHeightAdjust);
        observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    }
}

function getBalanceQtyColumnIndex(thead) {
    var headerRow = thead.querySelector('tr');
    if (!headerRow) {
        return -1;
    }
    var ths = headerRow.querySelectorAll('th');
    for (var i = 0; i < ths.length; i++) {
        var span = ths[i].querySelector('.filter-table-heading');
        var label = span ? span.textContent.trim() : ths[i].textContent.trim();
        if (label === 'Balance Qty') {
            return i;
        }
    }
    return -1;
}

/** Light red row when Balance Qty < 0 (logical stock grid). Runs on an interval so it stays correct after filter/pagination. */
function applyStockAgeingNegativeBalanceRowStyle() {
    var thead = document.getElementById(STOCK_AGEING_THEAD_ID);
    var tbody = document.getElementById(STOCK_AGEING_TBODY_ID);
    if (!thead || !tbody) {
        return;
    }

    var balanceColIndex = getBalanceQtyColumnIndex(thead);
    if (balanceColIndex < 0) {
        return;
    }

    var rows = tbody.querySelectorAll('tr');
    rows.forEach(function (row) {
        if (row.classList.contains('total-row') || row.classList.contains('grand-total-row')) {
            return;
        }
        var tds = row.querySelectorAll('td');
        if (tds.length <= balanceColIndex) {
            return;
        }

        var raw = (tds[balanceColIndex].textContent || '').replace(/,/g, '').trim();
        var val = parseFloat(raw);
        var isNegative = !isNaN(val) && val < 0;

        tds.forEach(function (td) {
            td.style.backgroundColor = isNegative ? BALANCE_QTY_NEGATIVE_ROW_BG : '';
        });
    });
}

function startStockAgeingBalanceQtyRowHighlightTimer() {
    if (stockAgeingBalanceQtyHighlightTimerId != null) {
        return;
    }
    stockAgeingBalanceQtyHighlightTimerId = setInterval(applyStockAgeingNegativeBalanceRowStyle, 1000);
}

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    setCurrentDate();
    GetCategoryList();
    GetItemTypeList();
    GetWarehouseList();
    GetReportOptionList();
    Bind_ddlItemMaster();
    $('#StockAgeingReportTableCard').hide();
    $('#ddlSizeParameter').closest('.col-md-3').hide();

    $('#ddlItemNameFilter').on('change', function () {
        if (isLogicalStockWithSeparateParameters()) {
            Bind_ddlSizeParameter($(this).val());
        }
    });

    $("#btnStockAgeingReportShow").click(function () {
        if (isFifoStockAgeingReport()) {
            const ageingParam = G_AgeingParameter?.AgeingParameters ?? '';
            if (ageingParam) {
                GetStockAgeingReportList();
            } else {
                ShowAgeingParameterModal();
            }
        } else {
            GetStockAgeingReportList();
        }
    });

    startStockAgeingBalanceQtyRowHighlightTimer();
    bindStockAgeingReportHeightHandlers();
    scheduleStockAgeingReportTableHeightAdjust();

    $('#swcBtnResetFilters').on('click', function () {
        SWC_SelectedCategoryCode = 0;
        SWC_SelectedCategoryName = '';
        SWC_SelectedGodownCode = 0;
        SWC_SelectedGodownName = '';
        SWC_UpdateFilterBadges();
        SWC_LoadGodownChart();
        $('#swcChartItemsRow').hide();
        $('#swcGridSection').hide();
        SWC_ClearGrid();
    });
});

function setCurrentDate() {
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth();
    var date = today.getDate();

    var fromDate = new Date(year, month, date);

    $('#txtAsOnDate').val(formatDateYYYYMMDD(fromDate));
}

function formatDateYYYYMMDD(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}

function GetCategoryList() {
    StockAgeingReportService.GetCategoryList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlCategory')[0], response.map((item) => ({ Code: item.Category, Desp: item.Category })));
            $('#ddlCategory').select2({ 
                width: '-webkit-fill-available',
                multiple: true,
                placeholder: 'Select Category...'
            });
            
            // Set default value to "All"
            $('#ddlCategory').val(['All']).trigger('change');
            
            // Handle "All" selection logic
            $('#ddlCategory').on('select2:select', function (e) {
                let selectedValues = $(this).val() || [];
                if (e.params.data.id === 'All') {
                    // If "All" is selected, clear all other selections
                    $(this).val(['All']).trigger('change');
                } else {
                    // If any other option is selected, remove "All"
                    if (selectedValues.includes('All')) {
                        selectedValues = selectedValues.filter(v => v !== 'All');
                        $(this).val(selectedValues).trigger('change');
                    }
                }
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error fetching category list');
    });
}

function GetItemTypeList() {
    StockAgeingReportService.GetItemTypeList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlItemName')[0], response.map((item) => ({ Code: item.ItemType, Desp: item.ItemType })));
            $('#ddlItemName').select2({ 
                width: '-webkit-fill-available',
                multiple: true,
                placeholder: 'Select Item Type...'
            });
            
            // Set default value to "All"
            $('#ddlItemName').val(['All']).trigger('change');
            
            // Handle "All" selection logic
            $('#ddlItemName').on('select2:select', function (e) {
                let selectedValues = $(this).val() || [];
                if (e.params.data.id === 'All') {
                    // If "All" is selected, clear all other selections
                    $(this).val(['All']).trigger('change');
                } else {
                    // If any other option is selected, remove "All"
                    if (selectedValues.includes('All')) {
                        selectedValues = selectedValues.filter(v => v !== 'All');
                        $(this).val(selectedValues).trigger('change');
                    }
                }
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error fetching item type list');
    });
}

function GetWarehouseList() {
    StockAgeingReportService.GetWarehouseList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlWarehouse')[0], response.map((item) => ({ Code: item.Warehouse, Desp: item.Warehouse })));
            $('#ddlWarehouse').select2({ 
                width: '-webkit-fill-available',
                multiple: true,
                placeholder: 'Select Warehouse...'
            });
            
            // Set default value to "All"
            $('#ddlWarehouse').val(['All']).trigger('change');
            
            // Handle "All" selection logic
            $('#ddlWarehouse').on('select2:select', function (e) {
                let selectedValues = $(this).val() || [];
                if (e.params.data.id === 'All') {
                    // If "All" is selected, clear all other selections
                    $(this).val(['All']).trigger('change');
                } else {
                    // If any other option is selected, remove "All"
                    if (selectedValues.includes('All')) {
                        selectedValues = selectedValues.filter(v => v !== 'All');
                        $(this).val(selectedValues).trigger('change');
                    }
                }
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error fetching warehouse list');
    });
}

function parseDefaultFilterValues(defaultFilterValues) {
    var result = {};
    if (!defaultFilterValues || typeof defaultFilterValues !== 'string') {
        return result;
    }
    defaultFilterValues.split('#').forEach(function (segment) {
        segment = segment.trim();
        if (!segment) return;
        var eq = segment.indexOf('=');
        if (eq <= 0) return;
        var key = segment.slice(0, eq).trim().toLowerCase().replace(/^#+/, '');
        var value = segment.slice(eq + 1).trim();
        if (!key || !value) return;
        result[key] = value;
    });
    return result;
}

function splitFilterValueList(valueChunk) {
    return valueChunk.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
}

/** True when this field means "ALL" only: every token is All (e.g. Warehouse=All or All,ALL). */
function defaultFilterChunkIsAllOnly(valueChunk) {
    if (!valueChunk || typeof valueChunk !== 'string') {
        return false;
    }
    var tokens = splitFilterValueList(valueChunk);
    if (!tokens.length) {
        return false;
    }
    return tokens.every(function (token) {
        return token.toLowerCase() === 'all';
    });
}

function filterValuesExistingInDropdown($ddl, values) {
    var allowed = {};
    $ddl.find('option').each(function () {
        var v = $(this).val();
        if (v !== undefined && v !== null && v !== '') {
            allowed[v] = true;
        }
    });
    return values.filter(function (x) {
        return Object.prototype.hasOwnProperty.call(allowed, x);
    });
}

function setMultiSelectValuesWithoutChange($ddl, csvValue) {
    if (!$ddl.length || !csvValue) {
        return false;
    }
    var wanted = splitFilterValueList(csvValue);
    var use = filterValuesExistingInDropdown($ddl, wanted);
    if (!use.length) {
        return false;
    }
    $ddl.val(use);
    return true;
}

/** Sets one multi-select from DefaultFilterValues: All-only → ['All'], else specific option values. */
function setMultiSelectFromDefaultFilterCsv($ddl, csvValue) {
    if (!$ddl.length || !csvValue) {
        return false;
    }
    if (defaultFilterChunkIsAllOnly(csvValue)) {
        $ddl.val(['All']);
        return true;
    }
    return setMultiSelectValuesWithoutChange($ddl, csvValue);
}

/** Category / Item Type / Warehouse → ALL (same defaults as initial page load). */
function resetStockAgeingFiltersToAll() {
    $('#ddlCategory').val(['All']);
    $('#ddlItemName').val(['All']);
    $('#ddlWarehouse').val(['All']);
    $('#ddlCategory').trigger('change');
    $('#ddlItemName').trigger('change');
    $('#ddlWarehouse').trigger('change');
}

/** Applies Category / Item Type / Warehouse from the selected row's DefaultFilterValues. */
function applyDefaultFiltersForSelectedReportOption() {
    var desp = $('#ddlReportOption').val();
    if (!desp || typeof desp !== 'string') {
        return;
    }
    var opt = G_ReportOptionList.find(function (row) {
        var label = row.DisplayName || row.OptionName;
        return label === desp;
    });
    if (!opt) {
        return;
    }

    var dfs = opt.DefaultFilterValues;
    if (dfs === undefined || dfs === null || String(dfs).trim() === '') {
        resetStockAgeingFiltersToAll();
        return;
    }

    var keys = parseDefaultFilterValues(dfs);

    var itemTypeCsv = keys.itemtype !== undefined ? keys.itemtype : keys.item_type;

    var didCat = keys.category ? setMultiSelectFromDefaultFilterCsv($('#ddlCategory'), keys.category) : false;
    var didItem = itemTypeCsv ? setMultiSelectFromDefaultFilterCsv($('#ddlItemName'), itemTypeCsv) : false;
    var didWh = keys.warehouse ? setMultiSelectFromDefaultFilterCsv($('#ddlWarehouse'), keys.warehouse) : false;

    if (didCat) {
        $('#ddlCategory').trigger('change');
    }
    if (didItem) {
        $('#ddlItemName').trigger('change');
    }
    if (didWh) {
        $('#ddlWarehouse').trigger('change');
    }
}

function GetReportOptionList() {
    StockAgeingReportService.GetReportOptionList().then(function (response) {
        if (response && response.length > 0) {
            G_ReportOptionList = response;
            BindSelectList2($('#ddlReportOption')[0], response.map((item) => ({
                Code: item.Code,
                Desp: item.DisplayName || item.OptionName || ''
            })));
            $('#ddlReportOption').select2({ width: '-webkit-fill-available' });

            // Show/Hide Item Parameter (Size Parameter Filter) based on report option
            toggleItemParameterField();
            $('#ddlReportOption').off('change.stockAgeReportOption').on('change.stockAgeReportOption', function () {
                toggleItemParameterField();
                applyDefaultFiltersForSelectedReportOption();
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error fetching report option list');
    });
}

function isLogicalStockWithSeparateParameters() {
    const reportOption = $('#ddlReportOption').val();
    return reportOption &&
        reportOption.toString().trim().toLowerCase() ===
        'logical stock with separate parameters'.toLowerCase();
}
function isStockWithChart() {
    const reportOption = $('#ddlReportOption').val();
    return reportOption &&
        reportOption.toString().trim().toLowerCase() === 'stock with chart';
}

function isStockAgeingFifo() {
    const reportOption = $('#ddlReportOption').val();
    return reportOption && reportOption.toString().trim() === 'Stock Ageing (FIFO)';
}

function isStockAgeingFifoWithSeparateParameters() {
    const reportOption = $('#ddlReportOption').val();
    return reportOption &&
        reportOption.toString().trim() === 'Stock Ageing (FIFO) With Separate Parameters';
}

function isFifoStockAgeingReport() {
    return isStockAgeingFifo() || isStockAgeingFifoWithSeparateParameters();
}

function inferFifoStringFilterColumns(sampleRow, bucketKeys, hasTotal) {
    if (!sampleRow || typeof sampleRow !== 'object') {
        return ['Item Name', 'SizeDesp'];
    }

    const exclude = new Set([...bucketKeys, 'Code', 'ItemMaster_Code']);
    if (hasTotal) {
        exclude.add('Total');
    }

    const stringCols = [];
    Object.keys(sampleRow).forEach(function (k) {
        if (exclude.has(k)) {
            return;
        }
        const trimmed = String(k).trim();
        if (trimmed === 'Total' || bucketKeys.some(function (b) { return String(b).trim() === trimmed; })) {
            return;
        }
        const val = sampleRow[k];
        if (val === undefined || val === null || val === '') {
            stringCols.push(k);
            return;
        }
        const num = parseFloat(val);
        if (isNaN(num) || String(val).trim() !== String(num)) {
            stringCols.push(k);
        }
    });

    if (stringCols.length === 0) {
        return ['Item Name', 'SizeDesp'];
    }

    const itemNameIdx = stringCols.indexOf('Item Name');
    if (itemNameIdx > 0) {
        stringCols.splice(itemNameIdx, 1);
        stringCols.unshift('Item Name');
    } else if (itemNameIdx === -1 && sampleRow['Item Name'] !== undefined) {
        stringCols.unshift('Item Name');
    }

    return stringCols;
}

function normalizeStockAgeingApiResponse(response) {
    if (Array.isArray(response)) {
        return response;
    }
    if (response && Array.isArray(response.Data)) {
        return response.Data;
    }
    if (response && Array.isArray(response.data)) {
        return response.data;
    }
    return [];
}

function getStockAgeingGridExportData() {
    return window.filteredData_StockAgeingReport
        || window.filteredDataTemp_StockAgeingReport
        || null;
}

function validateAndBuildStockAgeingReportPayload() {
    let CategoryName = $('#ddlCategory').val() || [];
    let ItemTypeName = $('#ddlItemName').val() || [];
    let WarehouseName = $('#ddlWarehouse').val() || [];
    let ItemName = $('#ddlItemNameFilter').val();
    let AsOnDate = $('#txtAsOnDate').val();
    let ReportOption = $('#ddlReportOption').val();

    const isEmptyMulti = (val) => !val || (Array.isArray(val) && val.length === 0);

    if (isEmptyMulti(CategoryName)) {
        toastr.error('Please select category.');
        return null;
    }
    if (isEmptyMulti(ItemTypeName)) {
        toastr.error('Please select item type.');
        return null;
    }
    if (isEmptyMulti(WarehouseName)) {
        toastr.error('Please select warehouse .');
        return null;
    }
    if (ItemName == null || ItemName == undefined || ItemName == '') {
        toastr.error('Please select item name.');
        return null;
    }
    if (!AsOnDate) {
        toastr.error('Please select as on date.');
        return null;
    }
    if (!ReportOption || ReportOption == '') {
        toastr.error('Please select Report Option.');
        return null;
    }
    if (isLogicalStockWithSeparateParameters()) {
        let sizeParam = $('#ddlSizeParameter').val();
        if (!sizeParam || (Array.isArray(sizeParam) && sizeParam.length === 0)) {
            toastr.error('Please select Size Parameter.');
            return null;
        }
    }
    if (isFifoStockAgeingReport()) {
        const ageingParam = G_AgeingParameter?.AgeingParameters ?? '';
        if (!ageingParam) {
            toastr.error('Please select ageing parameter.');
            return null;
        }
    }

    if (Array.isArray(CategoryName)) {
        if (CategoryName.includes('All')) {
            CategoryName = '';
        } else {
            CategoryName = CategoryName.join(',');
        }
    } else if (CategoryName === 'All') {
        CategoryName = '';
    }
    if (Array.isArray(ItemTypeName)) {
        if (ItemTypeName.includes('All')) {
            ItemTypeName = '';
        } else {
            ItemTypeName = ItemTypeName.join(',');
        }
    } else if (ItemTypeName === 'All') {
        ItemTypeName = '';
    }
    if (Array.isArray(WarehouseName)) {
        if (WarehouseName.includes('All')) {
            WarehouseName = '';
        } else {
            WarehouseName = WarehouseName.join(',');
        }
    } else if (WarehouseName === 'All') {
        WarehouseName = '';
    }

    if (Array.isArray(ItemName)) {
        if (ItemName.includes('All')) {
            ItemName = 0;
        } else {
            ItemName = ItemName.join(',');
        }
    } else if (ItemName === 'All') {
        ItemName = 0;
    }

    let sizeParameterDesps = '';
    if (isLogicalStockWithSeparateParameters()) {
        let sizeParamVal = $('#ddlSizeParameter').val();
        var $sizeParam = $('#ddlSizeParameter');
        if (Array.isArray(sizeParamVal) && sizeParamVal.length > 0) {
            if (!sizeParamVal.includes('All')) {
                sizeParameterDesps = $sizeParam.find('option:selected').map(function () { return $(this).text(); }).get().join(',');
            }
        } else if (sizeParamVal && sizeParamVal !== 'All') {
            sizeParameterDesps = $sizeParam.find('option:selected').map(function () { return $(this).text(); }).get().join(',');
        }
    }

    const AgeingParameter = G_AgeingParameter?.AgeingParameters ?? '';
    return {
        category: CategoryName,
        itemType: ItemTypeName,
        warehouse: WarehouseName,
        itemMaster_Code: ItemName,
        asOnDate: AsOnDate,
        itemSizeMaster_Codes: G_ItemSizeMaster_Codes || 0,
        itemParameterMaster_Desps: sizeParameterDesps,
        AgeingParameters: AgeingParameter,
        ReportType: ReportOption
    };
}

function prepareStockAgeingReportRows(response, reportOption) {
    let rows = normalizeStockAgeingApiResponse(response);
    if (!rows.length) {
        return { rows: [], gridConfig: null };
    }

    if (reportOption === 'Stock Ageing (FIFO)' ||
        reportOption === 'Stock Ageing (FIFO) With Separate Parameters') {
        const fifoCols = buildFifoStockAgeingGridColumnConfig(rows[0]);
        const hasTotal = fifoRowHasTotalProperty(rows[0]);
        const stringFilterColumn = inferFifoStringFilterColumns(rows[0], fifoCols.bucketKeys, hasTotal);
        rows = rows.map(function (item) {
            normalizeFifoRowKeysInPlace(item, fifoCols.bucketKeys, hasTotal);
            formatFifoStockAgeingNumericCells(item, fifoCols.bucketKeys, hasTotal);
            return item;
        });
        return {
            rows: rows,
            gridConfig: {
                stringFilterColumn: stringFilterColumn,
                numericFilterColumn: fifoCols.numericFilterColumn,
                columnAlignment: fifoCols.columnAlignment,
                totalColKeys: fifoCols.totalColKeys
            }
        };
    }

    rows = filterLogicalStockRows(rows);
    if (rows.length === 0) {
        return { rows: [], gridConfig: null };
    }

    rows = rows.map(mapLogicalStockRowForGrid);
    return {
        rows: rows,
        gridConfig: {
            stringFilterColumn: ['Item Name', 'SizeDesp'],
            numericFilterColumn: [
                'Physical Stock', 'Balance Qty', 'Sale Order Qty', 'Pending CRM Order', 'Rolling Forecast', 'Pending Enquiry', 'Minimum Qty'
            ],
            columnAlignment: {
                'Physical Stock': 'right',
                'Balance Qty': 'right',
                'Sale Order Qty': 'right',
                'Pending CRM Order': 'right',
                'Rolling Forecast': 'right',
                'Pending Enquiry': 'right',
                'Minimum Qty': 'right'
            },
            totalColKeys: [
                'Physical Stock', 'Balance Qty', 'Sale Order Qty', 'Pending CRM Order', 'Rolling Forecast', 'Pending Enquiry', 'Minimum Qty'
            ]
        }
    };
}

function clearStockAgeingReportGrid() {
    const tableCard = document.getElementById('StockAgeingReportTableCard');
    const tableWrapper = document.getElementById('sarTableWrapper');
    $('#StockAgeingReportTableCard').hide();
    $('#table-head-StockAgeingReport').empty();
    $('#table-body-StockAgeingReport').empty();
    clearStockAgeingFooter();
    if (tableCard) {
        tableCard.style.height = '';
        tableCard.style.minHeight = '';
    }
    if (tableWrapper) {
        tableWrapper.style.height = '';
        tableWrapper.style.maxHeight = '';
        tableWrapper.style.minHeight = '';
    }
}

function toggleItemParameterField() {
    const shouldShow = isLogicalStockWithSeparateParameters();
    const $sizeParamCol = $('#ddlSizeParameter').closest('.col-md-3');

    if (shouldShow) {
        $sizeParamCol.show();
        var itemCode = $('#ddlItemNameFilter').val();
        if (Array.isArray(itemCode)) {
            if (itemCode.includes('All')) {
                itemCode = 0;
            } else {
                itemCode = itemCode.join(',');
            }
        } else if (itemCode === 'All') {
            itemCode = 0;
        }
        if (itemCode !== '') {
            Bind_ddlSizeParameter(itemCode);
        } else {
            $('#ddlSizeParameter').empty().append('<option value="">Select..</option>');
            if ($('#ddlSizeParameter').hasClass('select2-hidden-accessible')) {
                $('#ddlSizeParameter').select2('destroy');
            }
            $('#ddlSizeParameter').select2({ width: '-webkit-fill-available', multiple: true, placeholder: 'Select Size Parameter...' });
        }
    } else {
        $sizeParamCol.hide();
        G_ItemSizeMaster_Codes = '';
        $('#ddlSizeParameter').val(null).trigger('change');
    }
    if (!isStockWithChart()) {
        $('#StockWithChart').hide();
    }
    scheduleStockAgeingReportTableHeightAdjust();
}

function Bind_ddlSizeParameter(ItemMaster_Code) {
    var $ddl = $('#ddlSizeParameter');
    if (!$ddl.length) return;
    if ($ddl.hasClass('select2-hidden-accessible')) {
        $ddl.select2('destroy');
    }
    $ddl.off('select2:select');
    $ddl.empty().append('<option value="All">All</option>');
    StockAgeingReportService.GetParameterMasterFilter(ItemMaster_Code).then(function (response) {
        if (response && response.length > 0) {
            response.forEach(function (item) {
                var code = item.ItemParameterMaster_Code || item.Code || '';
                var desp = item.ParameterDesp || item.Descp || '';
                if (code !== '' && desp !== '') {
                    $ddl.append($('<option></option>').val(code).text(desp));
                }
            });
        }
        $ddl.select2({ width: '-webkit-fill-available', multiple: true, placeholder: 'Select Size Parameter...' });
        $ddl.val(['All']).trigger('change');
        $ddl.off('select2:select').on('select2:select', function (e) {
            var selectedValues = $(this).val() || [];
            if (e.params.data.id === 'All') {
                $(this).val(['All']).trigger('change');
            } else {
                if (selectedValues.includes('All')) {
                    selectedValues = selectedValues.filter(function (v) { return v !== 'All'; });
                    $(this).val(selectedValues).trigger('change');
                }
            }
        });
    }).catch(function (error) {
        toastr.error(error.Msg || error.message || 'Error loading size parameters');
        $ddl.empty().append('<option value="">Select..</option>');
        $ddl.select2({ width: '-webkit-fill-available', multiple: true, placeholder: 'Select Size Parameter...' });
    });
}
function Bind_ddlItemMaster() {
    let Category = $('#ddlCategory').val() || [];
    let ItemType = $('#ddlItemName').val() || [];
    
    if (!Array.isArray(Category)) {
        Category = Category ? [Category] : [];
    }
    if (!Array.isArray(ItemType)) {
        ItemType = ItemType ? [ItemType] : [];
    }
    
    // Check if Category and ItemType are selected
    if (!Category || Category.length === 0 || !ItemType || ItemType.length === 0) {
        // Clear the Item Name filter if Category or ItemType is not selected
        $('#ddlItemNameFilter').empty();
        $('#ddlItemNameFilter').select2({ width: '-webkit-fill-available' });
        return;
    }
    
    // Convert to SQL IN-clause format with quotes for text fields
    const CategoryCsv = Category.join("','");   // "Cat1','Cat2"
    const ItemTypeCsv = ItemType.join("','");   // "Type1','Type2"

    StockAgeingReportService.GetItemNameList(CategoryCsv, ItemTypeCsv).then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlItemNameFilter')[0], response.map((item) => ({ Code: item.Code, Desp: item.ItemName })));
            $('#ddlItemNameFilter').select2({ width: '-webkit-fill-available' });
        }
        else {
            $('#ddlItemNameFilter').empty();
            $('#ddlItemNameFilter').select2({ width: '-webkit-fill-available' });
            toastr.warning('No items found for the selected Category and Item Type');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'An error occurred while fetching item name list');
    });
}

export function GetStockAgeingReportList() {
    let ReportOption = $('#ddlReportOption').val();

    if (isStockWithChart()) {
        LoadStockWithChart();
        return;
    }
    $('#StockWithChart').hide();
    SWC_DestroyCharts();

    const Payload = validateAndBuildStockAgeingReportPayload();
    if (!Payload) {
        return;
    }
    ReportOption = Payload.ReportType;
    
    Showloader();
    StockAgeingReportService.GetStockAgeingReportList(Payload).then(function (response) {
        HideLoader();
        const prepared = prepareStockAgeingReportRows(response, ReportOption);

        if (prepared.rows.length > 0 && prepared.gridConfig) {
            $('#StockAgeingReportTableCard').show();

            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ['Code', 'ItemMaster_Code'];
            BizsolCustomFilterGrid.CreateDataTable(
                'table-head-StockAgeingReport',
                'table-body-StockAgeingReport',
                prepared.rows,
                button,
                showButtons,
                prepared.gridConfig.stringFilterColumn,
                prepared.gridConfig.numericFilterColumn,
                dateFilterColumn,
                stringDoubleFilterColumn,
                hiddenColumns,
                prepared.gridConfig.columnAlignment,
                false,
                prepared.gridConfig.totalColKeys,
                null
            );
            setTimeout(applyStockAgeingNegativeBalanceRowStyle, 0);
            scheduleStockAgeingReportTableHeightAdjust();
            setTimeout(scheduleStockAgeingReportTableHeightAdjust, 150);
        } else {
            clearStockAgeingReportGrid();
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        HideLoader();
        clearStockAgeingReportGrid();
        toastr.error(error.Msg || 'Error During Get Stock Ageing Report');
    });
}
function ExportExcel() {
    const hiddenFields = ['Code', 'ItemMaster_Code'];
    const ReportOptionExport = $('#ddlReportOption').val();

    if (isStockWithChart()) {
        toastr.error('Download is not available for Stock With Chart.');
        return;
    }

    const gridData = getStockAgeingGridExportData();
    if (gridData && gridData.length > 0) {
        ExportToExcelControl.ExportToExcel(gridData, hiddenFields, 'StockAgeingReport');
        return;
    }

    const Payload = validateAndBuildStockAgeingReportPayload();
    if (!Payload) {
        return;
    }

    StockAgeingReportService.GetStockAgeingReportList(Payload).then(function (response) {
        const prepared = prepareStockAgeingReportRows(response, ReportOptionExport);
        if (prepared.rows.length > 0) {
            ExportToExcelControl.ExportToExcel(prepared.rows, hiddenFields, 'StockAgeingReport');
        } else {
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error During Export Stock Ageing Report Data');
    });
}
function setStockAgeingFooterTotals(data) {
    const footerId = '#table-foot-StockAgeingReport';
    if (!Array.isArray(data) || data.length === 0) {
        clearStockAgeingFooter();
        return;
    }
    
    const fifoCols = buildFifoStockAgeingGridColumnConfig(data[0]);
    const totalColumns = fifoCols.totalColKeys;
    const totals = {};
    
    totalColumns.forEach(function (column) {
        totals[column] = 0;
    });
    
    data.forEach(function (item) {
        totalColumns.forEach(function (column) {
            const value = parseFloat(item[column]);
            if (!isNaN(value)) {
                totals[column] = totals[column] + value;
            }
        });
    });
    
    totalColumns.forEach(function (column) {
        if (!isNaN(totals[column])) {
            totals[column] = totals[column].toFixed(3);
        } else {
            totals[column] = '';
        }
    });
    
    const columns = Object.keys(data[0]);
    let footerRow = '<tr>';
    
    columns.forEach(function (column, index) {
        if (index === 0) {
            footerRow = footerRow + '<th style="text-align:left">Grand Total</th>';
        } else if (totalColumns.includes(column)) {
            footerRow = footerRow + '<th style="text-align:right">' + totals[column] + '</th>';
        } else {
            footerRow = footerRow + '<th></th>';
        }
    });
    
    footerRow = footerRow + '</tr>';
    $(footerId).html(footerRow);
}
function clearStockAgeingFooter() {
    $('#table-foot-StockAgeingReport').empty();
}
function BindSelectList1(element, list) {
    let option = '<option value="All">ALL</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function BindSelectList2(element, list) {
    let option = '<option value="">Please select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Desp + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function ShowSizeControlModal() {
    var itemMasterCode = $("#ddlItemNameFilter").val();
   
    if (!itemMasterCode || itemMasterCode === 'All' || itemMasterCode === '0') {
        itemMasterCode = "0";
    }
    
    const options = {
        ModalId: 'DivSizeControlmodal',
        ItemMaster_Code: itemMasterCode,
        CallBackFunctionName_btnDone: 'onSizeFilterApplied'
    };
   
    initializeSizeFilterControl(options);
}

window.onSizeFilterApplied = function (response) {
    if (response && response.length > 0) {
        G_ItemSizeMaster_Codes = response.map(x => x.Code).join(',');
    } else {
        G_ItemSizeMaster_Codes = '';
    }
};
function ShowAgeingParameterModal() {
    initializeAgeingParameterControl({
        FormName  : 'StockAgeingReport',
        FormType  : 'S',
        CallBackFn: onAgeingParameterSelected
    });
}

window.onAgeingParameterSelected = function (result) {
    G_AgeingParameter = result;
    let AgeingParameter = result?.AgeingParameters ?? "";
    if (AgeingParameter != "") {
        GetStockAgeingReportList();
    } else {

    }
};

window.ExportExcel = ExportExcel;
window.Bind_ddlItemMaster = Bind_ddlItemMaster;
window.GetStockAgeingReportList = GetStockAgeingReportList;
window.ShowSizeControlModal = ShowSizeControlModal;
window.ShowAgeingParameterModal = ShowAgeingParameterModal;
function SWC_DestroyCharts() {
    if (SWC_CategoryChartInstance) {
        try { SWC_CategoryChartInstance.destroy(); } catch (e) { /* ignore */ }
        SWC_CategoryChartInstance = null;
    }
    if (SWC_GodownChartInstance) {
        try { SWC_GodownChartInstance.destroy(); } catch (e) { /* ignore */ }
        SWC_GodownChartInstance = null;
    }
    if (SWC_ItemsChartInstance) {
        try { SWC_ItemsChartInstance.destroy(); } catch (e) { /* ignore */ }
        SWC_ItemsChartInstance = null;
    }
}
function SWC_UpdateFilterBadges() {
    if (SWC_SelectedCategoryName) {
        $('#swcLblCategoryFilter').text(SWC_SelectedCategoryName).show();
        if (SWC_SelectedGodownName) {
            $('#swcLblGodownFilter').text(SWC_SelectedGodownName).show();
            $('#swcLblItemGodownFilter').text(SWC_SelectedGodownName).show();
        } else {
            $('#swcLblGodownFilter').hide();
            $('#swcLblItemGodownFilter').hide();
        }
    } else {
        $('#swcLblCategoryFilter').hide();
        $('#swcLblGodownFilter').hide();
        $('#swcLblItemGodownFilter').hide();
    }
}

function LoadStockWithChart() {
    // ── 1. Read filter values (same sources as GetStockAgeingReportList) ──────
    let CategoryName  = $('#ddlCategory').val()    || [];
    let ItemTypeName  = $('#ddlItemName').val()     || [];
    let WarehouseName = $('#ddlWarehouse').val()    || [];
    let AsOnDate      = $('#txtAsOnDate').val();
    let Item_Code = $('#ddlItemNameFilter').val() || 0;
    const isEmptyMulti = (val) => !val || (Array.isArray(val) && val.length === 0);

    if (!Item_Code || Item_Code === 'All' || Item_Code === '0') {
        Item_Code = 0;
    }
    // ── 2. Validate required fields ──────────────────────────────────────────
    if (isEmptyMulti(CategoryName))  { toastr.error('Please select category.');  return; }
    if (isEmptyMulti(ItemTypeName))  { toastr.error('Please select item type.'); return; }
    if (isEmptyMulti(WarehouseName)) { toastr.error('Please select warehouse.');  return; }
    if (!AsOnDate)                   { toastr.error('Please select as on date.'); return; }

    // ── 3. Normalise to comma strings (identical to GetStockAgeingReportList) ─
    if (Array.isArray(CategoryName)) {
        CategoryName = CategoryName.includes('All') ? '' : CategoryName.join(',');
    } else if (CategoryName === 'All') { CategoryName = ''; }

    if (Array.isArray(ItemTypeName)) {
        ItemTypeName = ItemTypeName.includes('All') ? '' : ItemTypeName.join(',');
    } else if (ItemTypeName === 'All') { ItemTypeName = ''; }

    if (Array.isArray(WarehouseName)) {
        if (WarehouseName.includes('All')) {
            WarehouseName = $('#ddlWarehouse option').not('[value="All"]').map(function () { return $(this).val(); }).get().join(',');
        } else {
            WarehouseName = WarehouseName.join(',');
        }
    } else if (WarehouseName === 'All') {
        WarehouseName = $('#ddlWarehouse option').not('[value="All"]').map(function () { return $(this).val(); }).get().join(',');
    }

    // ── 4. Build & store payload (same shape as GetStockAgeingReportList) ────
    SWC_CurrentPayload = {
        category:                 CategoryName,
        itemType:                 ItemTypeName,
        warehouse:                WarehouseName,
        itemMaster_Code:          Item_Code,   // not restricted at top-level chart
        asOnDate:                 AsOnDate,
        itemSizeMaster_Codes:     G_ItemSizeMaster_Codes || '',
        itemParameterMaster_Desps: '',
        ReportType:               'Stock With Chart'
    };

    // ── 5. Reset chart state ─────────────────────────────────────────────────
    SWC_DestroyCharts();
    SWC_SelectedCategoryCode = 0;
    SWC_SelectedCategoryName = '';
    SWC_SelectedGodownCode   = 0;
    SWC_SelectedGodownName   = '';
    SWC_UpdateFilterBadges();
    $('#swcChartItemsRow').hide();
    $('#swcGridSection').hide();
    SWC_ClearGrid();
    $('#StockAgeingReportTableCard').hide();
    $('#StockWithChart').show();

    Showloader();
    Promise.all([
        SWC_FetchData(0, 0, 0),
        SWC_FetchData(4, 0, 0)
    ]).then(function (results) {
        HideLoader();
        SWC_RenderCategoryPieChart(results[0] || []);
        SWC_RenderGodownBarChart(results[1] || [], 'All Categories');
    }).catch(function () {
        HideLoader();
        toastr.error('Error loading stock data');
    });
}

function SWC_LoadGodownChart() {
    Showloader();
    SWC_FetchData(4, 0, 0).then(function (data) {
        HideLoader();
        SWC_RenderGodownBarChart(data || [], 'All Categories');
    }).catch(function () {
        HideLoader();
    });
}

function SWC_LoadItemsData(categoryCode, godownCode) {
    Showloader();
    Promise.all([
        SWC_FetchData(1, categoryCode, godownCode),
        SWC_FetchData(4, categoryCode, godownCode)
    ]).then(function (results) {
        HideLoader();
        var itemsData = results[0] || [];
        var godownData = results[1] || [];
        SWC_RenderGodownBarChart(godownData, SWC_SelectedCategoryName);
        SWC_UpdateFilterBadges();
        if (itemsData.length > 0) {
            SWC_RenderItemsBarChart(itemsData);
            SWC_RenderGrid(itemsData);
            $('#swcChartItemsRow').show();
            $('#swcGridSection').show();
        } else {
            $('#swcChartItemsRow').hide();
            $('#swcGridSection').hide();
            SWC_ClearGrid();
            toastr.warning('No items found for the selected filter');
        }
    }).catch(function () {
        HideLoader();
        toastr.error('Error loading items data');
    });
}

function SWC_RenderCategoryPieChart(data) {
    if (SWC_CategoryChartInstance) {
        try { SWC_CategoryChartInstance.destroy(); } catch (e) { /* ignore */ }
        SWC_CategoryChartInstance = null;
    }
    var el = document.getElementById('swcChartCategory');
    if (!el) return;
    if (!data || data.length === 0) {
        el.innerHTML = '<div class="text-center text-muted py-5" style="font-size:.85rem;">No stock data available</div>';
        return;
    }
    el.innerHTML = '';
    var labels = data.map(function (r) { return r.Desp || ''; });
    var values = data.map(function (r) { return parseFloat(r.StockQtyMt) || 0; });
    var codes  = data.map(function (r) { return parseInt(r.Code, 10); });
    var categoryGrandTotal = values.reduce(function (sum, v) { return sum + v; }, 0);
    SWC_CategoryChartInstance = new ApexCharts(el, {
        series: values,
        chart: {
            type: 'pie',
            height: 460,
            dropShadow: { enabled: true, blur: 6, opacity: 0.12 },
            events: {
                dataPointSelection: function (event, chartContext, config) {
                    var idx = config.dataPointIndex;
                    if (idx < 0) return;
                    SWC_SelectedCategoryCode = codes[idx];
                    SWC_SelectedCategoryName = labels[idx];
                    SWC_SelectedGodownCode   = 0;
                    SWC_SelectedGodownName   = '';
                    SWC_LoadItemsData(SWC_SelectedCategoryCode, 0);
                }
            }
        },
        title: { text: 'Category-wise Stock', align: 'center', offsetY: 5, style: { fontSize: '13px', fontWeight: '700', color: '#334155' } },
        subtitle: { text: 'Grand Total: ' + categoryGrandTotal.toFixed(3) + ' MT', align: 'center', offsetY: 25, style: { fontSize: '11px', fontWeight: '600', color: '#64748b' } },
        labels:  labels,
        colors:  SWC_GenerateColors(labels.length),
        stroke:  { width: 2, colors: ['#ffffff'] },
        fill:    { type: 'gradient', gradient: { shade: 'dark', type: 'horizontal', shadeIntensity: 0.18, opacityFrom: 1, opacityTo: 0.88 } },
        legend:  { position: 'bottom', fontSize: '11px', fontWeight: 600, markers: { width: 10, height: 10, radius: 4 }, itemMargin: { horizontal: 6, vertical: 3 } },
        dataLabels: {
            enabled: true,
            formatter: function (val, opts) { return opts.w.globals.series[opts.seriesIndex].toFixed(3); },
            style: { fontSize: '11px', fontWeight: '700' },
            dropShadow: { enabled: true, blur: 2, opacity: 0.2 }
        },
        tooltip: { y: { formatter: function (val) { return val.toFixed(3) + ' MT'; } } },
        plotOptions: { pie: { expandOnClick: true, offsetY: 20, customScale: 0.88 } }
    });
    SWC_CategoryChartInstance.render();
}

function SWC_RenderGodownBarChart(data, seriesLabel) {
    if (SWC_GodownChartInstance) {
        try { SWC_GodownChartInstance.destroy(); } catch (e) { /* ignore */ }
        SWC_GodownChartInstance = null;
    }
    var el = document.getElementById('swcChartGodown');
    if (!el) return;
    if (!data || data.length === 0) {
        el.innerHTML = '<div class="text-center text-muted py-5" style="font-size:.85rem;">No godown data available</div>';
        return;
    }
    el.innerHTML = '';
    var labels = data.map(function (r) { return r.Desp || ''; });
    var values = data.map(function (r) { return parseFloat(r.StockQtyMt) || 0; });
    var codes  = data.map(function (r) { return parseInt(r.Code, 10); });
    var godownGrandTotal = values.reduce(function (sum, v) { return sum + v; }, 0);
    SWC_GodownChartInstance = new ApexCharts(el, {
        series: [{ name: seriesLabel || 'Stock MT', data: values }],
        chart: {
            type: 'bar', height: 300, toolbar: { show: false },
            dropShadow: { enabled: true, blur: 4, opacity: 0.1 },
            events: {
                dataPointSelection: function (event, chartContext, config) {
                    var idx = config.dataPointIndex;
                    if (idx < 0) return;
                    SWC_SelectedGodownCode = codes[idx];
                    SWC_SelectedGodownName = labels[idx];
                    if (SWC_SelectedCategoryCode > 0) {
                        SWC_LoadItemsData(SWC_SelectedCategoryCode, SWC_SelectedGodownCode);
                    } else {
                        $('#swcLblGodownFilter').text(SWC_SelectedGodownName).show();
                    }
                }
            }
        },
        title: { text: 'Godown-wise Stock', align: 'center', style: { fontSize: '13px', fontWeight: '700', color: '#334155' } },
        subtitle: { text: 'Grand Total: ' + godownGrandTotal.toFixed(3) + ' MT', align: 'center', style: { fontSize: '11px', fontWeight: '600', color: '#64748b' } },
        colors: SWC_GenerateColors(values.length),
        fill: {
            type: 'gradient',
            gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.25, opacityFrom: 1, opacityTo: 0.78, stops: [0, 90, 100] }
        },
        plotOptions: { bar: { borderRadius: 7, borderRadiusApplication: 'end', columnWidth: '52%', distributed: true, dataLabels: { position: 'top' } } },
        dataLabels: {
            enabled: true,
            formatter: function (val) { return val.toFixed(3); },
            offsetY: -22,
            style: { fontSize: '10px', fontWeight: '700', colors: ['#334155'] }
        },
        xaxis: { categories: labels, labels: { rotate: -35, style: { fontSize: '10px', fontWeight: '600' }, trim: true, maxHeight: 72 } },
        yaxis: { labels: { formatter: function (val) { return val.toFixed(1); }, style: { fontSize: '10px' } } },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
        legend: { show: false },
        tooltip: {
            y: { formatter: function (val) { return val.toFixed(3) + ' MT'; } },
            theme: 'light'
        }
    });
    SWC_GodownChartInstance.render();
}

function SWC_RenderItemsBarChart(data) {
    if (SWC_ItemsChartInstance) {
        try { SWC_ItemsChartInstance.destroy(); } catch (e) { /* ignore */ }
        SWC_ItemsChartInstance = null;
    }
    var el = document.getElementById('swcChartItems');
    if (!el) return;
    if (!data || data.length === 0) {
        el.innerHTML = '<div class="text-center text-muted py-5" style="font-size:.85rem;">No item data available</div>';
        return;
    }
    el.innerHTML = '';
    var labels = data.map(function (r) { return r.Desp || ''; });
    var values = data.map(function (r) { return parseFloat(r.StockQtyMt) || 0; });
    var itemsGrandTotal = values.reduce(function (sum, v) { return sum + v; }, 0);
    SWC_ItemsChartInstance = new ApexCharts(el, {
        series: [{ name: SWC_SelectedCategoryName || 'Stock MT', data: values }],
        chart: {
            type: 'bar', height: 300, toolbar: { show: false },
            dropShadow: { enabled: true, blur: 4, opacity: 0.1 }
        },
        title: { text: (SWC_SelectedCategoryName || 'Item') + '-wise Stock', align: 'center', style: { fontSize: '13px', fontWeight: '700', color: '#334155' } },
        subtitle: { text: 'Grand Total: ' + itemsGrandTotal.toFixed(3) + ' MT', align: 'center', style: { fontSize: '11px', fontWeight: '600', color: '#64748b' } },
        colors: SWC_GenerateColors(values.length),
        fill: {
            type: 'gradient',
            gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.25, opacityFrom: 1, opacityTo: 0.78, stops: [0, 90, 100] }
        },
        plotOptions: { bar: { borderRadius: 7, borderRadiusApplication: 'end', columnWidth: '56%', distributed: true, dataLabels: { position: 'top' } } },
        dataLabels: {
            enabled: true,
            formatter: function (val) { return val.toFixed(3); },
            offsetY: -22,
            style: { fontSize: '10px', fontWeight: '700', colors: ['#334155'] }
        },
        xaxis: { categories: labels, labels: { rotate: -35, style: { fontSize: '10px', fontWeight: '600' }, trim: true, maxHeight: 82 } },
        yaxis: { labels: { formatter: function (val) { return val.toFixed(1); }, style: { fontSize: '10px' } } },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
        legend: { show: false },
        tooltip: {
            y: { formatter: function (val) { return val.toFixed(3) + ' MT'; } },
            theme: 'light'
        }
    });
    SWC_ItemsChartInstance.render();
}

function SWC_ClearGrid() {
    var tbody = document.getElementById('swcTableBody');
    if (tbody) tbody.innerHTML = '';
}

function SWC_RenderGrid(data) {
    var tbody = document.getElementById('swcTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3" style="font-size:.85rem;">No data found</td></tr>';
        return;
    }
    var grandTotalMt = 0;
    var grandTotalPc = 0;
    data.forEach(function (row) {
        var itemCode = row.Code;
        var qtyMtVal = parseFloat(row.StockQtyMt || 0);
        var qtyPcVal = Math.round(parseFloat(row.StockQtyPC || 0));
        grandTotalMt += qtyMtVal;
        grandTotalPc += qtyPcVal;
        var qtyMt = qtyMtVal.toFixed(3);
        var qtyPc = qtyPcVal;
        var tr = document.createElement('tr');
        tr.setAttribute('data-swc-level', '1');
        tr.setAttribute('data-swc-item-code', itemCode);
        tr.innerHTML =
            '<td><span class="swc-expand-icon" id="swc-icon-item-' + itemCode + '">&#9658;</span>' +
            '<a class="swc-item-link" data-swc-item-code="' + itemCode + '">' + SWC_EscHtml(row.Desp) + '</a></td>' +
            '<td class="text-end">' + qtyMt + '</td>' +
            '<td class="text-end">' + qtyPc + '</td>';
        tbody.appendChild(tr);
    });
    var grandTotalTr = document.createElement('tr');
    grandTotalTr.className = 'grand-total-row';
    grandTotalTr.style.cssText = 'font-weight:700;background:#f1f5f9;border-top:2px solid #cbd5e1;';
    grandTotalTr.innerHTML =
        '<td>Grand Total</td>' +
        '<td class="text-end">' + grandTotalMt.toFixed(3) + '</td>' +
        '<td class="text-end">' + grandTotalPc + '</td>';
    tbody.appendChild(grandTotalTr);
    $(tbody).off('click.swc')
        .on('click.swc', '.swc-item-link', function () {
            SWC_ToggleItemRows(parseInt($(this).data('swc-item-code'), 10));
        })
        .on('click.swc', '.swc-size-link', function () {
            SWC_ToggleSizeRows(parseInt($(this).data('swc-size-code'), 10));
        });
}

function SWC_ToggleItemRows(itemCode) {
    var existingRows = $('[data-swc-parent-item="' + itemCode + '"]');
    var icon = $('#swc-icon-item-' + itemCode);
    if (existingRows.length > 0) {
        existingRows.each(function () {
            var sc = $(this).data('swc-size-code');
            if (sc) $('[data-swc-parent-size="' + sc + '"]').remove();
        });
        existingRows.remove();
        icon.removeClass('expanded').html('&#9658;');
        return;
    }
    icon.html('<span class="spinner-border spinner-border-sm" style="width:.7rem;height:.7rem;border-width:2px;"></span>');
    SWC_FetchData(2, itemCode, SWC_SelectedGodownCode || 0).then(function (data) {
        icon.addClass('expanded').html('&#9660;');
        var parentRow = $('[data-swc-item-code="' + itemCode + '"][data-swc-level="1"]');
        if (!data || data.length === 0) {
            parentRow.after('<tr data-swc-parent-item="' + itemCode + '" class="swc-sub-row-2">' +
                '<td colspan="3" class="text-muted" style="padding-left:2.2rem;font-style:italic;font-size:.78rem;">No size data</td></tr>');
            return;
        }
        var rows = '';
        data.forEach(function (row) {
            var sc = row.Code;
            rows += '<tr data-swc-parent-item="' + itemCode + '" data-swc-level="2" data-swc-size-code="' + sc + '" class="swc-sub-row-2">' +
                '<td><span class="swc-expand-icon" id="swc-icon-size-' + sc + '">&#9658;</span>' +
                '<a class="swc-size-link" data-swc-size-code="' + sc + '">' + SWC_EscHtml(row.Desp) + '</a></td>' +
                '<td class="text-end">' + parseFloat(row.StockQtyMt || 0).toFixed(3) + '</td>' +
                '<td class="text-end">' + Math.round(parseFloat(row.StockQtyPC || 0)) + '</td></tr>';
        });
        parentRow.after(rows);
    }).catch(function () {
        icon.removeClass('expanded').html('&#9658;');
        toastr.error('Error loading size data');
    });
}

function SWC_ToggleSizeRows(sizeCode) {
    var existingRows = $('[data-swc-parent-size="' + sizeCode + '"]');
    var icon = $('#swc-icon-size-' + sizeCode);
    if (existingRows.length > 0) {
        existingRows.remove();
        icon.removeClass('expanded').html('&#9658;');
        return;
    }
    icon.html('<span class="spinner-border spinner-border-sm" style="width:.7rem;height:.7rem;border-width:2px;"></span>');
    SWC_FetchData(3, sizeCode, SWC_SelectedGodownCode || 0).then(function (data) {
        icon.addClass('expanded').html('&#9660;');
        var parentRow = $('[data-swc-size-code="' + sizeCode + '"][data-swc-level="2"]');
        if (!data || data.length === 0) {
            parentRow.after('<tr data-swc-parent-size="' + sizeCode + '" class="swc-sub-row-3">' +
                '<td colspan="3" class="text-muted" style="padding-left:3.8rem;font-style:italic;font-size:.78rem;">No identification data</td></tr>');
            return;
        }
        var rows = '';
        data.forEach(function (row) {
            rows += '<tr data-swc-parent-size="' + sizeCode + '" class="swc-sub-row-3">' +
                '<td>' + SWC_EscHtml(row.Desp) + '</td>' +
                '<td class="text-end">' + parseFloat(row.StockQtyMt || 0).toFixed(3) + '</td>' +
                '<td class="text-end">' + parseFloat(row.StockQtyPC || 0).toFixed(3) + '</td></tr>';
        });
        parentRow.after(rows);
    }).catch(function () {
        icon.removeClass('expanded').html('&#9658;');
        toastr.error('Error loading identification data');
    });
}

function SWC_FetchData(level, code, godownCode) {
    if (SWC_USE_DUMMY_DATA) {
        return SWC_GetDummyData(level, code, godownCode);
    }
    return StockAgeingReportService.GetStockData(level, code, godownCode, SWC_CurrentPayload);
}

function SWC_GetDummyData(level, code, godownCode) {
    var DUMMY = {
        // Level 0 – Categories
        categories: [
            { Desp: 'RM',  StockQtyMt: 323.134, StockQtyPC: 112, MasterCode: 0, Code: 1 },
            { Desp: 'SFG', StockQtyMt:  45.678, StockQtyPC:  30, MasterCode: 0, Code: 2 },
            { Desp: 'FG',  StockQtyMt: 207.215, StockQtyPC:  85, MasterCode: 0, Code: 3 }
        ],
        // Level 4 – Godowns (all)
        godowns: [
            { Desp: 'PPPL-3 (AHM)', StockQtyMt: 115.616, StockQtyPC: 55, MasterCode: 0, Code: 10 },
            { Desp: 'Warehouse-A',  StockQtyMt:  89.234, StockQtyPC: 40, MasterCode: 0, Code: 11 },
            { Desp: 'Warehouse-B',  StockQtyMt:  56.789, StockQtyPC: 22, MasterCode: 0, Code: 12 },
            { Desp: 'Dispatch Yard',StockQtyMt:  42.380, StockQtyPC: 18, MasterCode: 0, Code: 13 }
        ],
        // Level 1 – Items per category
        items: {
            1: [ // RM
                { Desp: 'CR Sitted Coil',       StockQtyMt:   0.420, StockQtyPC:  1, MasterCode: 1, Code: 101 },
                { Desp: 'Galvalume Coil',        StockQtyMt: 105.440, StockQtyPC: 90, MasterCode: 1, Code: 102 },
                { Desp: 'Galvalume Sitted Coil', StockQtyMt:   1.074, StockQtyPC:  2, MasterCode: 1, Code: 103 },
                { Desp: 'GP Coil',               StockQtyMt:   0.026, StockQtyPC:  1, MasterCode: 1, Code: 104 },
                { Desp: 'GP Sitted Coil',        StockQtyMt:   3.858, StockQtyPC:  9, MasterCode: 1, Code: 105 },
                { Desp: 'MAGNELS COIL',          StockQtyMt:   0.703, StockQtyPC:  3, MasterCode: 1, Code: 106 },
                { Desp: 'Posmac Coil',           StockQtyMt:   3.983, StockQtyPC:  5, MasterCode: 1, Code: 107 },
                { Desp: 'Posmac Sitted Coil',    StockQtyMt:   0.610, StockQtyPC:  1, MasterCode: 1, Code: 108 }
            ],
            2: [ // SFG
                { Desp: 'HR Coil Semi',  StockQtyMt: 22.340, StockQtyPC: 15, MasterCode: 2, Code: 201 },
                { Desp: 'CR Semi Coil',  StockQtyMt: 14.560, StockQtyPC: 10, MasterCode: 2, Code: 202 },
                { Desp: 'Tinplate Semi', StockQtyMt:  8.778, StockQtyPC:  5, MasterCode: 2, Code: 203 }
            ],
            3: [ // FG
                { Desp: 'Corrugated Sheet',  StockQtyMt:  98.450, StockQtyPC: 42, MasterCode: 3, Code: 301 },
                { Desp: 'Plain Sheet FG',    StockQtyMt:  72.310, StockQtyPC: 28, MasterCode: 3, Code: 302 },
                { Desp: 'Roofing Sheet',     StockQtyMt:  36.455, StockQtyPC: 15, MasterCode: 3, Code: 303 }
            ]
        },
        // Level 2 – Sizes per item
        sizes: {
            101: [{ Desp: '101.6 x 101.6 x 2.50 MM x 6645 MM x 550 AZ 275', StockQtyMt: 0.420, StockQtyPC: 1, MasterCode: 101, Code: 1011 } ],
            102: [
                { Desp: '0.85 MM', StockQtyMt:  35.440, StockQtyPC: 30, MasterCode: 102, Code: 1021 },
                { Desp: '0.90 MM', StockQtyMt:  69.112, StockQtyPC: 40, MasterCode: 102, Code: 1022 },
                { Desp: '1.00 MM', StockQtyMt:  12.922, StockQtyPC: 20, MasterCode: 102, Code: 1023 },
                { Desp: '1.20 MM', StockQtyMt:   9.966, StockQtyPC: 10, MasterCode: 102, Code: 1024 }
            ],
            103: [
                { Desp: '0.60 MM', StockQtyMt: 0.574, StockQtyPC: 1, MasterCode: 103, Code: 1031 },
                { Desp: '0.80 MM', StockQtyMt: 0.500, StockQtyPC: 1, MasterCode: 103, Code: 1032 }
            ],
            104: [ { Desp: '0.40 MM', StockQtyMt: 0.026, StockQtyPC: 1, MasterCode: 104, Code: 1041 } ],
            105: [
                { Desp: '0.55 MM', StockQtyMt: 2.100, StockQtyPC: 5, MasterCode: 105, Code: 1051 },
                { Desp: '0.70 MM', StockQtyMt: 1.758, StockQtyPC: 4, MasterCode: 105, Code: 1052 }
            ],
            106: [
                { Desp: '0.60 MM', StockQtyMt: 0.350, StockQtyPC: 1, MasterCode: 106, Code: 1061 },
                { Desp: '0.75 MM', StockQtyMt: 0.353, StockQtyPC: 2, MasterCode: 106, Code: 1062 }
            ],
            107: [
                { Desp: '0.50 MM', StockQtyMt: 2.010, StockQtyPC: 3, MasterCode: 107, Code: 1071 },
                { Desp: '0.60 MM', StockQtyMt: 1.973, StockQtyPC: 2, MasterCode: 107, Code: 1072 }
            ],
            108: [ { Desp: '0.45 MM', StockQtyMt: 0.610, StockQtyPC: 1, MasterCode: 108, Code: 1081 } ],
            201: [
                { Desp: '2.00 MM', StockQtyMt: 12.340, StockQtyPC: 8, MasterCode: 201, Code: 2011 },
                { Desp: '2.50 MM', StockQtyMt: 10.000, StockQtyPC: 7, MasterCode: 201, Code: 2012 }
            ],
            202: [
                { Desp: '1.50 MM', StockQtyMt:  8.560, StockQtyPC: 6, MasterCode: 202, Code: 2021 },
                { Desp: '1.80 MM', StockQtyMt:  6.000, StockQtyPC: 4, MasterCode: 202, Code: 2022 }
            ],
            203: [ { Desp: '0.30 MM', StockQtyMt: 8.778, StockQtyPC: 5, MasterCode: 203, Code: 2031 } ],
            301: [
                { Desp: '0.47 MM x 900 mm', StockQtyMt: 52.450, StockQtyPC: 22, MasterCode: 301, Code: 3011 },
                { Desp: '0.47 MM x 1000mm', StockQtyMt: 46.000, StockQtyPC: 20, MasterCode: 301, Code: 3012 }
            ],
            302: [
                { Desp: '0.40 MM x 800 mm', StockQtyMt: 38.310, StockQtyPC: 15, MasterCode: 302, Code: 3021 },
                { Desp: '0.50 MM x 900 mm', StockQtyMt: 34.000, StockQtyPC: 13, MasterCode: 302, Code: 3022 }
            ],
            303: [ { Desp: '0.55 MM x 1000mm', StockQtyMt: 36.455, StockQtyPC: 15, MasterCode: 303, Code: 3031 } ]
        },
        // Level 3 – Identification numbers per size
        identifications: {
            1011: [ { Desp: 'ID-CR-0001', StockQtyMt: 0.420, StockQtyPC: 1, MasterCode: 1011, Code: 10110 } ],
            1021: [
                { Desp: 'GC-2024-001', StockQtyMt: 12.450, StockQtyPC: 10, MasterCode: 1021, Code: 10211 },
                { Desp: 'GC-2024-002', StockQtyMt: 11.230, StockQtyPC: 10, MasterCode: 1021, Code: 10212 },
                { Desp: 'GC-2024-003', StockQtyMt: 11.760, StockQtyPC: 10, MasterCode: 1021, Code: 10213 }
            ],
            1022: [
                { Desp: 'GC-2024-011', StockQtyMt: 23.112, StockQtyPC: 20, MasterCode: 1022, Code: 10221 },
                { Desp: 'GC-2024-012', StockQtyMt: 24.500, StockQtyPC: 10, MasterCode: 1022, Code: 10222 },
                { Desp: 'GC-2024-013', StockQtyMt: 21.500, StockQtyPC: 10, MasterCode: 1022, Code: 10223 }
            ],
            1023: [
                { Desp: 'GC-2024-021', StockQtyMt:  6.922, StockQtyPC: 10, MasterCode: 1023, Code: 10231 },
                { Desp: 'GC-2024-022', StockQtyMt:  6.000, StockQtyPC: 10, MasterCode: 1023, Code: 10232 }
            ],
            1024: [ { Desp: 'GC-2024-031', StockQtyMt: 9.966, StockQtyPC: 10, MasterCode: 1024, Code: 10241 } ],
            1051: [
                { Desp: 'GP-S-0001', StockQtyMt: 1.100, StockQtyPC: 3, MasterCode: 1051, Code: 10511 },
                { Desp: 'GP-S-0002', StockQtyMt: 1.000, StockQtyPC: 2, MasterCode: 1051, Code: 10512 }
            ],
            1052: [
                { Desp: 'GP-S-0011', StockQtyMt: 0.958, StockQtyPC: 2, MasterCode: 1052, Code: 10521 },
                { Desp: 'GP-S-0012', StockQtyMt: 0.800, StockQtyPC: 2, MasterCode: 1052, Code: 10522 }
            ]
        }
    };

    return new Promise(function (resolve) {
        setTimeout(function () {
            if (level === 0) {
                resolve(DUMMY.categories);
            } else if (level === 4) {
                // filter godowns by category if code > 0 (simulate SP behaviour)
                resolve(DUMMY.godowns);
            } else if (level === 1) {
                resolve(DUMMY.items[code] || []);
            } else if (level === 2) {
                resolve(DUMMY.sizes[code] || []);
            } else if (level === 3) {
                resolve(DUMMY.identifications[code] || []);
            } else {
                resolve([]);
            }
        }, 300); // simulate a small network delay
    });
}

function SWC_EscHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}



