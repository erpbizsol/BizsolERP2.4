import { FreightInvoiceService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/FreightInvoiceService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

// =============================================================================
// MODULE STATE
// =============================================================================

let filtersPromise = null;
let gridLoading = false;
let fiSavedList = [];
let fiEditMasterCode = 0;
let fiHasNewRight = false;
let fiHasEditRight = false;
let fiHasViewRight = false;
let fiHasVerifyRight = false;
let fiHasApproveRight = false;
let fiHasEditAfterVerifyRight = false;
let fiAllowEditAfterVerify = false;
let fiConfirmPendingCode = 0;
let fiConfirmAction = '';
let fiGridSortState = { colIndex: -1, dir: 'asc' };
const FINANCE_DECIMALS = 2;

/**
 * Saved list grid — single column config drives row mapping, filters, alignment, and widths.
 * ColumnAlignment in filter.js is manual per form across ERP; min-width here keeps columns readable.
 */
const FI_SAVED_LIST_COLUMNS = [
    { key: 'S.No.', type: 'sno', align: 'center', width: 52 },
    { key: 'Entry No', apiKey: 'Entry No', filter: 'string', align: 'center', width: 100, search: true, format: 'entryNoFinYear' },
    { key: 'Entry Date', apiKey: 'Entry Date', filter: 'date', align: 'center', width: 100 },
    { key: 'Bill Type', apiKey: 'Bill Type', filter: 'string', align: 'center', width: 88, search: true },
    { key: 'GRN No.', apiKey: 'GRN Numbers', filter: 'string', align: 'left', width: 120, maxWidth: 160, ellipsis: true, format: 'compactGrn' },
    { key: 'Transporter', apiKey: 'Transporter', filter: 'string', align: 'left', width: 140, maxWidth: 180, ellipsis: true, format: 'compactTransporter' },
    { key: 'Other Deduction', apiKey: 'Other Deduction', filter: 'numeric', align: 'right', width: 118, comma: true },
    { key: 'Other Addition', apiKey: 'Other Addition', filter: 'numeric', align: 'right', width: 118, comma: true },
    { key: 'Total Freight Amount', apiKey: 'Total Amount', filter: 'numeric', align: 'right', width: 130, comma: true },
    { key: 'Code', apiKey: 'Code', hidden: true },
    { key: 'Action', type: 'action', align: 'center', width: 188 }
];

/** View modal header summary fields (populated from SHOWMASTER header result set). */
const FI_VIEW_HEADER_FIELDS = [
    { label: 'Entry Date', keys: ['Entry Date', 'EntryDate'] },
    { label: 'Bill Type', keys: ['Bill Type', 'BillType'] },
    { label: 'GRN No.', keys: ['GRN Numbers', 'GRNNumbers'], format: 'compactGrn' },
    { label: 'Transporter', keys: ['Transporter'], format: 'compactTransporter' },
    { label: 'Total Freight Amount', keys: ['Total Amount', 'TotalAmount'], format: 'amount' },
    { label: 'Created By', keys: ['Created By', 'CreatedBy'] },
    { label: 'Updated By', keys: ['Updated By', 'UpdatedBy'] },
    { label: 'Updated On', keys: ['Updated On', 'UpdatedOn'] }
];

/** Entry + view modal columns — single config (view omits Select and Rate / Vehicle). */
const FI_GRID_HEADERS = [
    { key: 'select', label: 'Select', colClass: 'fi-col-check', thClass: 'center fi-th-normal fi-col-check', isSelectAll: true, sortType: 'check', view: false },
    { key: 'grnDate', label: 'GRN Date', colClass: 'fi-col-date', thClass: 'center fi-col-date', sortType: 'date' },
    { key: 'grnNo', label: 'GRN No.', viewKey: 'GRN Number', colClass: 'fi-col-grn', thClass: 'fi-col-grn', sortType: 'text', viewFormat: 'grn', apiKeys: ['GRN Number', 'GRN No.'] },
    { key: 'partyName', label: 'Party Name', colClass: 'fi-col-party', thClass: 'fi-col-party', sortType: 'text', apiKeys: ['Party Name', 'Party'] },
    { key: 'grNo', label: 'GR No', colClass: 'fi-col-grn', thClass: 'fi-col-grn', sortType: 'text', apiKeys: ['GR No'] },
    { key: 'grDate', label: 'GR Date', colClass: 'fi-col-date', thClass: 'center fi-col-date', sortType: 'date', apiKeys: ['GR Date'] },
    { key: 'vehicleNo', label: 'Vehicle No', colClass: 'fi-col-grn', thClass: 'fi-col-grn', sortType: 'text', apiKeys: ['Vehicle No', 'Truck No'] },
    { key: 'invoiceDate', label: 'Invoice Date', colClass: 'fi-col-date', thClass: 'center fi-col-date', sortType: 'date' },
    { key: 'invoiceNo', label: 'Invoice No.', viewKey: 'Invoice Number', colClass: 'fi-col-grn', thClass: 'fi-col-grn', sortType: 'text', apiKeys: ['Invoice Number', 'Invoice No.'] },
    { key: 'billNo', label: 'Bill No', colClass: 'fi-col-grn', thClass: 'fi-col-grn', sortType: 'text' },
    { key: 'billDate', label: 'Bill Date', colClass: 'fi-col-date', thClass: 'center fi-col-date', sortType: 'date' },
    { key: 'freightContractNo', label: 'Fr. Con. No', colClass: 'fi-col-grn', thClass: 'fi-col-grn', sortType: 'number', viewFormat: 'grn', apiKeys: ['Freight Contract No'] },
    { key: 'transporter', label: 'Transporter', colClass: 'fi-col-transporter', thClass: 'fi-col-transporter', sortType: 'text', apiKeys: ['Transporter'], view: false },
    { key: 'fromCity', label: 'From City', colClass: 'fi-col-city', thClass: 'fi-col-city', sortType: 'text' },
    { key: 'toCity', label: 'To City', colClass: 'fi-col-city', thClass: 'fi-col-city', sortType: 'text' },
    { key: 'contractType', label: 'Freight Type', colClass: 'fi-col-combo', thClass: 'fi-col-combo', sortType: 'text', apiKeys: ['Contract Type', 'Freight Type'] },
    { key: 'vehicleType', label: 'Vehicle Type', colClass: 'fi-col-vehicle', thClass: 'fi-col-vehicle', sortType: 'text' },
    { key: 'rateWt', label: 'Rate / Wt', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', viewFormat: 'qty', apiKeys: ['Rate / Wt', 'Rate Per Wt'] },
    { key: 'rateVehicle', label: 'Rate / Vehicle', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', view: false },
    { key: 'minQty', label: 'Min Qty', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', viewFormat: 'qty' },
    { key: 'billedQty', label: 'Billed Qty', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', viewFormat: 'qty' },
    { key: 'grnQty', label: 'Qty(Received)', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', viewFormat: 'qty', apiKeys: ['Qty(Received)', 'GRN Qty', 'Total Weight'] },
    { key: 'invoiceQty', label: 'Invoice Qty', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', viewFormat: 'qty' },
    { key: 'reachedQty', label: 'Reached Qty', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', viewFormat: 'qty' },
    { key: 'freightBilledQty', label: 'Freight Billed Qty', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', viewFormat: 'qty' },
    { key: 'freightAmount', label: 'Freight Amount', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', viewFormat: 'amount' },
    { key: 'toleranceType', label: 'Tolerance Type', colClass: 'fi-col-tolerance', thClass: 'fi-col-tolerance', sortType: 'text' },
    { key: 'toleranceQty', label: 'Tolerance Qty', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', viewFormat: 'qty' },
    { key: 'shortageQty', label: 'Shortage Qty', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', viewFormat: 'qty' },
    { key: 'shortageRate', label: 'Shortage Rate', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', viewFormat: 'qty' },
    { key: 'shortageDeduction', label: 'Shortage Deduction Amount', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', viewFormat: 'amount', apiKeys: ['Shortage Deduction Amount', 'Shortage Deduction'] },
    { key: 'otherDeduction', label: 'Other Deduction', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', viewFormat: 'amount' },
    { key: 'otherAddition', label: 'Other Addition', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', viewFormat: 'amount' },
    { key: 'netFreightAmount', label: 'Net Freight Amount', colClass: 'fi-col-num', thClass: 'fi-col-num', sortType: 'number', viewFormat: 'amount' }
];

function getFiViewDetailColumns() {
    return FI_GRID_HEADERS.filter(function (col) {
        return col.view !== false && col.key !== 'select';
    }).map(function (col) {
        return {
            key: col.viewKey || col.label,
            align: col.viewAlign || (col.sortType === 'number' ? 'right' : col.sortType === 'date' ? 'center' : 'left'),
            format: col.viewFormat || (col.sortType === 'number' ? 'qty' : undefined),
            apiKeys: col.apiKeys
        };
    });
}

function getFiApiValue(item, apiKey) {
    if (!item || !apiKey) return '';
    if (item[apiKey] != null && item[apiKey] !== '') return item[apiKey];
    const compact = String(apiKey).replace(/\s+/g, '');
    if (item[compact] != null && item[compact] !== '') return item[compact];
    const lower = compact.toLowerCase();
    for (const k in item) {
        if (!Object.prototype.hasOwnProperty.call(item, k)) continue;
        if (String(k).replace(/\s+/g, '').toLowerCase() === lower && item[k] != null && item[k] !== '') {
            return item[k];
        }
    }
    return '';
}

function getFiQtyReceived(row) {
    const keys = ['Qty(Received)', 'GRN Qty', 'Total Weight'];
    for (let i = 0; i < keys.length; i++) {
        const val = getFiApiValue(row, keys[i]);
        if (val !== '') return val;
    }
    return '';
}

function getFiShortageDeductionAmount(row) {
    const val = getFiApiValue(row, 'Shortage Deduction Amount');
    if (val !== '') return val;
    return getFiApiValue(row, 'Shortage Deduction');
}

function getFiHeaderValue(header, field) {
    const keys = field.keys || [field.label];
    for (let i = 0; i < keys.length; i++) {
        const val = getFiApiValue(header, keys[i]);
        if (val !== '') return val;
    }
    return '';
}

function parseCommaSeparatedList(val) {
    if (val == null || val === '') return [];
    const seen = new Set();
    const items = [];
    String(val).split(',').forEach(function (part) {
        const t = part.trim();
        if (!t || seen.has(t.toLowerCase())) return;
        seen.add(t.toLowerCase());
        items.push(t);
    });
    return items;
}

function formatGrnToken(token) {
    const n = parseFloat(String(token).replace(/,/g, ''));
    if (!isNaN(n) && isFinite(n)) return String(Math.round(n));
    return token;
}

function formatCompactGrnSummary(val) {
    const list = parseCommaSeparatedList(val).map(formatGrnToken);
    if (!list.length) return { text: '', title: '' };
    const title = list.join(', ');
    if (list.length === 1) return { text: list[0], title: title };
    return { text: list[0] + ' +' + (list.length - 1) + ' more', title: title };
}

function formatCompactTransporterSummary(val) {
    const list = parseCommaSeparatedList(val);
    if (!list.length) return { text: '', title: '' };
    const title = list.join(', ');
    if (list.length === 1) return { text: list[0], title: title };
    return { text: 'Multiple (' + list.length + ')', title: title };
}

function buildFiCompactListCell(summary) {
    if (!summary || !summary.text) return '—';
    if (!summary.title || summary.title === summary.text) {
        return escHtml(summary.text);
    }
    return (
        '<span class="fi-compact-list" title="' + escAttr(summary.title) + '">' +
        escHtml(summary.text) +
        '</span>'
    );
}

function formatGrnNumbersDisplay(val) {
    if (val == null || val === '') return '';
    return String(val).split(',').map(function (part) {
        const t = part.trim();
        if (!t) return '';
        const n = parseFloat(String(t).replace(/,/g, ''));
        if (!isNaN(n) && isFinite(n)) return String(Math.round(n));
        return t;
    }).filter(Boolean).join(', ');
}

function formatRouteDisplay(val) {
    if (val == null || val === '') return '';
    return String(val)
        .replace(/\s*→\s*/g, ' -> ')
        .replace(/\u2192/g, ' -> ')
        .trim();
}

function formatEntryNoWithFinYear(item) {
    const entryNo = getFiApiValue(item, 'Entry No');
    const finYear = getFiApiValue(item, 'Fin Year');
    if (entryNo === '' && finYear === '') return '';
    const noText = entryNo === '' ? '' : String(Math.round(parseNum(entryNo)));
    return noText + ' (' + finYear + ')';
}

function formatFiSavedCellValue(item, col, rowIndex) {
    if (col.type === 'sno') return String(rowIndex + 1);
    if (col.type === 'action') return buildFiListActionHtml(item);
    if (col.hidden) return item.Code || 0;

    const raw = getFiApiValue(item, col.apiKey);
    if (col.comma) return parseNum(raw);
    if (col.format === 'integerText') {
        return raw === '' ? '' : String(Math.round(parseNum(raw)));
    }
    if (col.format === 'entryNoFinYear') return formatEntryNoWithFinYear(item);
    if (col.format === 'grnList') return formatGrnNumbersDisplay(raw);
    if (col.format === 'compactGrn') return buildFiCompactListCell(formatCompactGrnSummary(raw));
    if (col.format === 'compactTransporter') return buildFiCompactListCell(formatCompactTransporterSummary(raw));
    if (col.format === 'route') return formatRouteDisplay(raw);
    return raw;
}

function formatFiHeaderValue(val, format) {
    if (format === 'verifiedStatus') return buildFiVerifiedStatusHtml({ Verified: val });
    if (val == null || val === '') return '—';
    if (format === 'amount') return formatInrAmount(val);
    if (format === 'integer') return String(Math.round(parseNum(val)));
    if (format === 'grnList') return escHtml(formatGrnNumbersDisplay(val) || '—');
    if (format === 'compactGrn') {
        const grn = formatCompactGrnSummary(val);
        return grn.text ? buildFiCompactListCell(grn) : '—';
    }
    if (format === 'compactTransporter') {
        const transporter = formatCompactTransporterSummary(val);
        return transporter.text ? buildFiCompactListCell(transporter) : '—';
    }
    if (format === 'route') return escHtml(formatRouteDisplay(val) || '—');
    return escHtml(val);
}

function buildFiSavedColumnAlignment() {
    const alignment = {};
    FI_SAVED_LIST_COLUMNS.forEach(function (col) {
        if (col.hidden) return;
        const parts = [(col.align || 'left') + ';'];
        if (col.width) parts.push('min-width:' + col.width + 'px');
        if (col.maxWidth) parts.push('max-width:' + col.maxWidth + 'px');
        parts.push('white-space:nowrap');
        if (col.ellipsis) {
            parts.push('overflow:hidden');
            parts.push('text-overflow:ellipsis');
        }
        alignment[col.key] = parts.join(';') + ';';
    });
    return alignment;
}

function buildFiSavedGridMeta() {
    const stringCols = [];
    const numericCols = [];
    const dateCols = [];
    const commaCols = [];
    const hiddenCols = [];

    FI_SAVED_LIST_COLUMNS.forEach(function (col) {
        if (col.hidden) {
            hiddenCols.push(col.key);
            return;
        }
        if (col.filter === 'string') stringCols.push(col.key);
        else if (col.filter === 'numeric') numericCols.push(col.key);
        else if (col.filter === 'date') dateCols.push(col.key);
        if (col.comma) commaCols.push(col.key);
    });

    return {
        stringCols: stringCols,
        numericCols: numericCols,
        dateCols: dateCols,
        commaCols: commaCols,
        hiddenCols: hiddenCols,
        columnAlignment: buildFiSavedColumnAlignment()
    };
}

function dedupeFiViewDetails(details) {
    const seen = new Set();
    return (details || []).filter(function (row) {
        const key = row.Code ?? row.code;
        if (key == null || key === '') return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/** Search box — full API values (not compact labels) so any GRN/transporter name still matches. */
const FI_SAVED_LIST_SEARCH_KEYS = ['Entry No', 'Fin Year', 'Bill Type', 'GRN Numbers', 'Transporter', 'Created By'];

function getFiSavedSearchText(item) {
    return FI_SAVED_LIST_SEARCH_KEYS.map(function (key) {
        return String(getFiApiValue(item, key)).toLowerCase();
    }).join(' ');
}

function formatInrAmount(val) {
    const n = parseNum(val);
    return '₹ ' + n.toLocaleString('en-IN', { minimumFractionDigits: FINANCE_DECIMALS, maximumFractionDigits: FINANCE_DECIMALS });
}

function escHtml(text) {
    return String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escAttr(text) {
    return String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function getDefaultFiDateRange() {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const pad = (n) => String(n).padStart(2, '0');
    const toIso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    return { from: toIso(firstOfMonth), to: toIso(today) };
}

// =============================================================================
// SAVED LIST — BOM-style list view vs new entry section
// =============================================================================

function showFiListView() {
    fiEditMasterCode = 0;
    fiAllowEditAfterVerify = false;
    setFiEntryEditMode(false);
    resetFiGridScroll();
    $('#dvFiEntry').removeClass('fi-entry-visible');
    $('#dvFiList').removeClass('fi-list-hidden');
    return loadFiSavedList();
}

function parseFiDisplayDateToIso(displayDate) {
    if (!displayDate) return '';
    const parts = String(displayDate).trim().split(/[\/\-]/);
    if (parts.length !== 3) return '';
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
    return year + '-' + month + '-' + day;
}

function setBillTypeFromHeader(header) {
    const billTypeCode = parseInt(getFiApiValue(header, 'Bill Type Code') || getFiApiValue(header, 'BillTypeCode'), 10) || 0;
    if (billTypeCode > 0) {
        $('#ddlFiBillType').val(String(billTypeCode));
        return;
    }
    const billTypeText = getFiApiValue(header, 'Bill Type');
    if (!billTypeText) return;
    const $match = $('#ddlFiBillType option').filter(function () {
        return $(this).text().trim().toLowerCase() === String(billTypeText).trim().toLowerCase();
    }).first();
    if ($match.length) $('#ddlFiBillType').val($match.val());
}

function mapShowMasterDetailsToGridRows(details) {
    return (details || []).map(function (row) {
        const movementCode = getFiApiValue(row, 'FreightMovement_Code') || getFiApiValue(row, 'FreightMovement Code');
        return {
            Code: movementCode,
            MRNMaster_Code: getFiApiValue(row, 'MRNMaster_Code'),
            AccountMaster_Code: getFiApiValue(row, 'AccountMaster_Code'),
            'GRN Date': getFiApiValue(row, 'GRN Date'),
            'GRN Number': getFiApiValue(row, 'GRN Number'),
            'Party Name': getFiApiValue(row, 'Party Name') || getFiApiValue(row, 'Party'),
            'GR No': getFiApiValue(row, 'GR No'),
            'GR Date': getFiApiValue(row, 'GR Date'),
            'Vehicle No': getFiApiValue(row, 'Vehicle No') || getFiApiValue(row, 'Truck No'),
            'Invoice Date': getFiApiValue(row, 'Invoice Date'),
            'Invoice Number': getFiApiValue(row, 'Invoice Number'),
            'Bill No': getFiApiValue(row, 'Bill No'),
            'Bill Date': getFiApiValue(row, 'Bill Date'),
            'From City': getFiApiValue(row, 'From City'),
            'From Area': getFiApiValue(row, 'From Area'),
            'To City': getFiApiValue(row, 'To City'),
            'To Area': getFiApiValue(row, 'To Area'),
            Transporter: getFiApiValue(row, 'Transporter'),
            'Contract Type Code': getFiApiValue(row, 'Contract Type Code'),
            'Contract Type': getFiApiValue(row, 'Contract Type'),
            'Vehicle Type Code': getFiApiValue(row, 'Vehicle Type Code'),
            'Vehicle Type': getFiApiValue(row, 'Vehicle Type'),
            'Rate Per Wt': getFiApiValue(row, 'Rate Per Wt'),
            'Rate Per Vehicle': getFiApiValue(row, 'Rate Per Vehicle'),
            'Min Qty': getFiApiValue(row, 'Min Qty'),
            'Deduction On': getFiApiValue(row, 'Deduction On'),
            'Tolerance Value': getFiApiValue(row, 'Tolerance Value'),
            'Tolerance Type': getFiApiValue(row, 'Tolerance Type'),
            'Tolerance Nature': getFiApiValue(row, 'Tolerance Nature'),
            'Billed Qty': getFiApiValue(row, 'Billed Qty'),
            'Qty(Received)': getFiQtyReceived(row),
            'Total Weight': getFiApiValue(row, 'Total Weight'),
            'Invoice Qty': getFiApiValue(row, 'Invoice Qty'),
            'Reached Qty': '',
            'Freight Billed Qty': getFiApiValue(row, 'Freight Billed Qty'),
            'Freight Amount': getFiApiValue(row, 'Freight Amount'),
            'Tolerance Qty': getFiApiValue(row, 'Tolerance Qty'),
            'Tolerance Type': getFiApiValue(row, 'Tolerance Type'),
            'Shortage Qty': getFiApiValue(row, 'Shortage Qty'),
            'Shortage Rate': getFiApiValue(row, 'Shortage Rate'),
            'Shortage Deduction Amount': getFiShortageDeductionAmount(row),
            'Other Deduction': getFiApiValue(row, 'Other Deduction'),
            'Other Addition': getFiApiValue(row, 'Other Addition'),
            'Net Freight Amount': getFiApiValue(row, 'Net Freight Amount')
        };
    }).filter(function (row) {
        return parseInt(row.Code, 10) > 0;
    });
}

function setFiEntryEditMode(isEdit) {
    $('#btnFiShow').prop('disabled', !!isEdit);
    $('#ddlFiBillType, #ddlFiTransporter, #txtFiFromDate, #txtFiToDate').prop('disabled', !!isEdit);
    $('#btnFiSaveAll').html(
        '<i class="fas fa-save"></i> ' + (isEdit ? 'Update' : 'Save All')
    );
}

function applySavedRowAmounts($tr, row) {
    const shortageRate = parseNum(getFiApiValue(row, 'Shortage Rate'));
    $tr.attr('data-shortage-rate', String(shortageRate));

    const otherDed = getFiApiValue(row, 'Other Deduction');
    const otherAdd = getFiApiValue(row, 'Other Addition');
    if (otherDed !== '') setFiField($tr.find('.fi-other-deduction'), formatNum(otherDed, FINANCE_DECIMALS));
    if (otherAdd !== '') setFiField($tr.find('.fi-other-addition'), formatNum(otherAdd, FINANCE_DECIMALS));

    const savedFields = [
        { key: 'Freight Billed Qty', sel: '.fi-freight-billed-qty', decimals: 3 },
        { key: 'Freight Amount', sel: '.fi-freight-amt', decimals: FINANCE_DECIMALS },
        { key: 'Tolerance Qty', sel: '.fi-tolerance-qty', decimals: 3 },
        { key: 'Shortage Qty', sel: '.fi-shortage-qty', decimals: 3 },
        { key: 'Shortage Rate', sel: '.fi-shortage-rate', decimals: 3 },
        { key: 'Shortage Deduction Amount', sel: '.fi-shortage-deduction', decimals: FINANCE_DECIMALS },
        { key: 'Net Freight Amount', sel: '.fi-net-freight-amt', decimals: FINANCE_DECIMALS }
    ];
    savedFields.forEach(function (field) {
        const val = getFiApiValue(row, field.key);
        if (val !== '') setFiField($tr.find(field.sel), formatNum(val, field.decimals));
    });

    const tolType = getFiApiValue(row, 'Tolerance Type');
    if (tolType !== '') setFiField($tr.find('.fi-tolerance-type'), tolType);
}

function ensureFiCanEditVerifiedEntry(showMsg) {
    const finYear = BizSolHelperFunction.getFinancialYear();
    return MenuService.CheckModuleOptionRight(getFiModuleName(), 'Edit After Verification', showMsg || 'Y', finYear)
        .then(function (response) {
            if (response.CheckModuleOptionRight === 'N') {
                if (showMsg !== 'N') {
                    toastr.warning(response.Msg || 'This entry is verified and cannot be edited.');
                }
                return false;
            }
            return true;
        })
        .catch(function () {
            if (showMsg !== 'N') {
                toastr.error('Permission check failed.');
            }
            return false;
        });
}

function openFiEditForm(code, header, details) {
    const gridRows = mapShowMasterDetailsToGridRows(details);

    if (!gridRows.length) {
        toastr.warning('No editable freight lines found for this entry.');
        return Promise.reject({ handled: true });
    }

    fiEditMasterCode = code;
    fiAllowEditAfterVerify = isFiEntryVerified(header) && fiHasEditAfterVerifyRight;
    $('#dvFiList').addClass('fi-list-hidden');
    $('#dvFiEntry').addClass('fi-entry-visible');
    setFiEntryEditMode(true);

    setBillTypeFromHeader(header);
    $('#ddlFiTransporter').val('0');

    setGridVisible(true);

    return bindSpreadFromData(gridRows, {
        preserveSavedAmounts: true,
        selectAllRows: true
    });
}

function editFiSavedEntry(code) {
    if (!code) return;

    const finYear = BizSolHelperFunction.getFinancialYear();
    const moduleName = getFiModuleName();
    const listItem = getFiSavedItemByCode(code);

    MenuService.CheckModuleOptionRight(moduleName, 'Edit', 'Y', finYear).then(function (editResp) {
        if (editResp.CheckModuleOptionRight === 'N') {
            toastr.error(editResp.Msg || 'You do not have Edit permission.');
            return;
        }

        function loadAndOpenEdit() {
            showFiLoader();
            return loadFilterDropdowns()
                .then(function () {
                    return FreightInvoiceService.GetSavedFreightInvoiceByCode(code);
                })
                .then(function (response) {
                    const header = response.Header || response.header || {};
                    const details = dedupeFiViewDetails(
                        response.Details || response.details || toList(response.FreightMovementDetail)
                    );

                    if (isFiEntryVerified(header)) {
                        return ensureFiCanEditVerifiedEntry('Y').then(function (canEdit) {
                            if (!canEdit) return Promise.reject({ handled: true });
                            return openFiEditForm(code, header, details);
                        });
                    }
                    return openFiEditForm(code, header, details);
                })
                .catch(function (error) {
                    if (!(error && error.handled)) {
                        console.error('editFiSavedEntry failed:', error);
                        toastr.error('Error loading freight invoice for edit.');
                    }
                })
                .finally(function () {
                    hideFiLoader();
                });
        }

        if (isFiEntryVerified(listItem)) {
            return ensureFiCanEditVerifiedEntry('Y').then(function (canEdit) {
                if (!canEdit) return;
                return loadAndOpenEdit();
            });
        }
        return loadAndOpenEdit();
    }).catch(function () {
        toastr.error('Permission check failed.');
    });
}

function openNewFreightEntry() {
    const finYear = BizSolHelperFunction.getFinancialYear();
    MenuService.CheckModuleOptionRight(getFiModuleName(), 'New', 'Y', finYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg || 'You do not have New permission.');
            return;
        }

        fiEditMasterCode = 0;
        fiAllowEditAfterVerify = false;
        $('#dvFiList').addClass('fi-list-hidden');
        $('#dvFiEntry').addClass('fi-entry-visible');
        resetFiEntryForm();
        setFiEntryEditMode(false);
        showFiLoader();
        loadFilterDropdowns().finally(function () {
            hideFiLoader();
            $('#btnFiShow').prop('disabled', false);
        });
    }).catch(function () {
        toastr.error('Permission check failed.');
    });
}

function resetFiEntryForm() {
    fiEditMasterCode = 0;
    fiAllowEditAfterVerify = false;
    setGridVisible(false);
    setFiEntryEditMode(false);
    $('#tblFreightInvoice tbody').empty();
    fiGridSortState = { colIndex: -1, dir: 'asc' };
    $('#chkFiSelectAll').prop('checked', false).prop('indeterminate', false);
    const dates = getDefaultFiDateRange();
    $('#txtFiFromDate').val(dates.from);
    $('#txtFiToDate').val(dates.to);
    $('#ddlFiBillType').val('');
    $('#ddlFiTransporter').val('0');
}

function getFiModuleName() {
    return ($('#ERPHeading').text() || 'Freight Invoice').trim();
}

function isFiEntryVerified(item) {
    if (!item) return false;
    const v = String(getFiApiValue(item, 'Verified') || '').trim().toUpperCase();
    return v === 'Y' || v === 'YES' || v === '1' || v === 'TRUE';
}

function isFiEntryApproved(item) {
    if (!item) return false;
    const v = String(getFiApiValue(item, 'Approved') || '').trim().toUpperCase();
    return v === 'Y' || v === 'YES' || v === '1' || v === 'TRUE';
}

function fiEntryNeedsApproval(item) {
    const ded = parseNum(getFiApiValue(item, 'Other Deduction'));
    const add = parseNum(getFiApiValue(item, 'Other Addition'));
    return ded !== 0 || add !== 0;
}

function buildFiVerifiedTooltip(item) {
    const verifiedBy = getFiApiValue(item, 'Verified By');
    const verifiedOn = getFiApiValue(item, 'Verified On');
    const parts = [];
    if (verifiedBy) parts.push('Verified by: ' + verifiedBy);
    if (verifiedOn) parts.push('On: ' + verifiedOn);
    return parts.length ? parts.join(' · ') : 'Verified';
}

function showFiVerifiedTip(el) {
    const $el = $(el);
    const tip = ($el.attr('data-fi-verify-tip') || $el.attr('title') || 'Verified').trim();
    if (!tip) return;
    toastr.info(tip, '', { timeOut: 5000, extendedTimeOut: 2000 });
}

function buildFiApprovedTooltip(item) {
    const approvedBy = getFiApiValue(item, 'Approved By');
    const approvedOn = getFiApiValue(item, 'Approved On');
    const parts = [];
    if (approvedBy) parts.push('Approved by: ' + approvedBy);
    if (approvedOn) parts.push('On: ' + approvedOn);
    return parts.length ? parts.join(' · ') : 'Approved';
}

function showFiApprovedTip(el) {
    const $el = $(el);
    const tip = ($el.attr('data-fi-approve-tip') || $el.attr('title') || 'Approved').trim();
    if (!tip) return;
    toastr.info(tip, '', { timeOut: 5000, extendedTimeOut: 2000 });
}

function buildFiApprovedStatusHtml(item) {
    if (!fiEntryNeedsApproval(item)) return '';
    if (!isFiEntryApproved(item)) {
        return '<span class="fi-view-status fi-view-status--pending"><i class="far fa-clock"></i> Approval Pending</span>';
    }
    const tip = escAttr(buildFiApprovedTooltip(item));
    return '<span class="fi-view-status fi-view-status--approved js-fi-approved-tip" title="' + tip + '" data-fi-approve-tip="' + tip + '" role="button" tabindex="0" aria-label="Approved details">' +
        '<i class="fas fa-user-check"></i> Approved</span>';
}

function buildFiVerifiedStatusHtml(item) {
    if (!isFiEntryVerified(item)) {
        return '<span class="fi-view-status fi-view-status--pending"><i class="far fa-clock"></i> Pending</span>';
    }
    const tip = escAttr(buildFiVerifiedTooltip(item));
    return '<span class="fi-view-status fi-view-status--verified js-fi-verified-tip" title="' + tip + '" data-fi-verify-tip="' + tip + '" role="button" tabindex="0" aria-label="Verified details">' +
        '<i class="fas fa-check-double"></i> Verified</span>';
}

function getFiSavedItemByCode(code) {
    const n = parseInt(code, 10) || 0;
    if (!n) return null;
    return (fiSavedList || []).find(function (item) {
        return parseInt(item.Code || item.code || 0, 10) === n;
    }) || null;
}

function resolveFiModuleRights() {
    const finYear = BizSolHelperFunction.getFinancialYear();
    const moduleName = getFiModuleName();
    return Promise.all([
        MenuService.CheckModuleOptionRight(moduleName, 'New', 'N', finYear),
        MenuService.CheckModuleOptionRight(moduleName, 'Edit', 'N', finYear),
        MenuService.CheckModuleOptionRight(moduleName, 'View', 'N', finYear),
        MenuService.CheckModuleOptionRight(moduleName, 'Verify', 'N', finYear),
        MenuService.CheckModuleOptionRight(moduleName, 'Approve', 'N', finYear),
        MenuService.CheckModuleOptionRight(moduleName, 'Edit After Verification', 'N', finYear)
    ]).then(function (results) {
        fiHasNewRight = !!(results[0] && results[0].CheckModuleOptionRight === 'Y');
        fiHasEditRight = !!(results[1] && results[1].CheckModuleOptionRight === 'Y');
        fiHasViewRight = !!(results[2] && results[2].CheckModuleOptionRight === 'Y');
        fiHasVerifyRight = !!(results[3] && results[3].CheckModuleOptionRight === 'Y');
        fiHasApproveRight = !!(results[4] && results[4].CheckModuleOptionRight === 'Y');
        fiHasEditAfterVerifyRight = !!(results[5] && results[5].CheckModuleOptionRight === 'Y');
        applyFiModuleRightsUi();
    }).catch(function () {
        fiHasNewRight = false;
        fiHasEditRight = false;
        fiHasViewRight = false;
        fiHasVerifyRight = false;
        fiHasApproveRight = false;
        fiHasEditAfterVerifyRight = false;
        applyFiModuleRightsUi();
    });
}

function applyFiModuleRightsUi() {
    $('#btnFiNew').toggle(!!fiHasNewRight);
}

function isFiVerifyApiSuccess(response) {
    const status = String(response?.Status || response?.status || '').trim().toLowerCase();
    return status === 'success' || status === 'y';
}

function isFiAlreadyVerifiedMessage(response) {
    const msg = String(response?.Msg || response?.msg || '').toLowerCase();
    return msg.indexOf('already verified') >= 0;
}

function isFiAlreadyApprovedMessage(response) {
    const msg = String(response?.Msg || response?.msg || '').toLowerCase();
    return msg.indexOf('already approved') >= 0;
}

function openFiConfirmModal(action, code) {
    if (action === 'verify') {
        if (!fiHasVerifyRight) {
            toastr.warning('You do not have Verify permission.');
            return;
        }
        const item = getFiSavedItemByCode(code);
        if (item && isFiEntryVerified(item)) {
            toastr.info('This freight invoice is already verified.');
            return;
        }
        fiConfirmAction = 'verify';
        fiConfirmPendingCode = code;
        $('#fiVerifyConfirmTitle').text('Verify freight invoice?');
        $('#fiVerifyConfirmText').text('Mark this freight invoice entry as verified?');
        $('#btnFiVerifyConfirm').html('<i class="fas fa-check"></i> Yes, Verify');
    } else if (action === 'approve') {
        if (!fiHasApproveRight) {
            toastr.warning('You do not have Approve permission.');
            return;
        }
        const item = getFiSavedItemByCode(code);
        if (!item || !fiEntryNeedsApproval(item)) {
            return;
        }
        if (!isFiEntryVerified(item)) {
            toastr.warning('Verify this freight invoice before approval.');
            return;
        }
        if (isFiEntryApproved(item)) {
            toastr.info('This freight invoice is already approved.');
            return;
        }
        fiConfirmAction = 'approve';
        fiConfirmPendingCode = code;
        $('#fiVerifyConfirmTitle').text('Approve freight invoice?');
        $('#fiVerifyConfirmText').text('This entry has Other Deduction or Other Addition. Mark it as approved?');
        $('#btnFiVerifyConfirm').html('<i class="fas fa-user-check"></i> Yes, Approve');
    } else {
        return;
    }

    const modalEl = document.getElementById('dvFiVerifyModal');
    if (modalEl && window.bootstrap?.Modal) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    } else {
        $('#dvFiVerifyModal').modal('show');
    }
}

function openFiVerifyConfirm(code) {
    openFiConfirmModal('verify', code);
}

function openFiApproveConfirm(code) {
    openFiConfirmModal('approve', code);
}

function closeFiConfirmModal() {
    fiConfirmPendingCode = 0;
    fiConfirmAction = '';
    const modalEl = document.getElementById('dvFiVerifyModal');
    if (modalEl && window.bootstrap?.Modal) {
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    } else {
        $('#dvFiVerifyModal').modal('hide');
    }
}

function closeFiVerifyConfirm() {
    closeFiConfirmModal();
}

function doFiConfirmAction() {
    if (fiConfirmAction === 'approve') {
        doFiApprove();
        return;
    }
    doFiVerify();
}

function doFiVerify() {
    const code = fiConfirmPendingCode;
    if (!code) {
        closeFiConfirmModal();
        return;
    }

    const finYear = BizSolHelperFunction.getFinancialYear();
    MenuService.CheckModuleOptionRight(getFiModuleName(), 'Verify', 'Y', finYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg || 'You do not have Verify permission.');
            closeFiConfirmModal();
            return;
        }

        showFiLoader();
        return FreightInvoiceService.VerifyFreightInvoice(code).then(function (res) {
            if (isFiVerifyApiSuccess(res)) {
                closeFiConfirmModal();
                toastr.success(res.Msg || 'Freight invoice verified successfully.');
                return loadFiSavedList();
            }
            if (isFiAlreadyVerifiedMessage(res)) {
                closeFiConfirmModal();
                toastr.info(res.Msg || 'Already verified.');
                return loadFiSavedList();
            }
            toastr.warning(res.Msg || 'Verify failed.');
        }).catch(function (error) {
            console.error('VerifyFreightInvoice failed:', error);
            toastr.error('Error verifying freight invoice.');
        }).finally(function () {
            hideFiLoader();
        });
    }).catch(function () {
        toastr.error('Permission check failed.');
        closeFiConfirmModal();
    });
}

function doFiApprove() {
    const code = fiConfirmPendingCode;
    if (!code) {
        closeFiConfirmModal();
        return;
    }

    const finYear = BizSolHelperFunction.getFinancialYear();
    MenuService.CheckModuleOptionRight(getFiModuleName(), 'Approve', 'Y', finYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg || 'You do not have Approve permission.');
            closeFiConfirmModal();
            return;
        }

        showFiLoader();
        return FreightInvoiceService.ApproveFreightInvoice(code).then(function (res) {
            if (isFiVerifyApiSuccess(res)) {
                closeFiConfirmModal();
                toastr.success(res.Msg || 'Freight invoice approved successfully.');
                return loadFiSavedList();
            }
            if (isFiAlreadyApprovedMessage(res)) {
                closeFiConfirmModal();
                toastr.info(res.Msg || 'Already approved.');
                return loadFiSavedList();
            }
            toastr.warning(res.Msg || 'Approve failed.');
        }).catch(function (error) {
            console.error('ApproveFreightInvoice failed:', error);
            toastr.error('Error approving freight invoice.');
        }).finally(function () {
            hideFiLoader();
        });
    }).catch(function () {
        toastr.error('Permission check failed.');
        closeFiConfirmModal();
    });
}

function buildFiListActionHtml(item) {
    const code = parseInt(item?.Code || 0, 10) || 0;
    const verified = isFiEntryVerified(item);
    const approved = isFiEntryApproved(item);
    const needsApproval = fiEntryNeedsApproval(item);
    let html = '<div class="pm-actions">';

    if (fiHasViewRight) {
        html += '<button type="button" class="pm-icon-btn view js-fi-view" data-code="' + code + '" title="View">' +
            '<i class="fas fa-eye"></i></button>';
    }

    if (verified) {
        const tip = buildFiVerifiedTooltip(item);
        html += '<span class="fi-verified-badge fi-verified-badge--done js-fi-verified-tip" title="' + escAttr(tip) + '" data-fi-verify-tip="' + escAttr(tip) + '" role="button" tabindex="0" aria-label="Verified details">' +
            '<i class="fas fa-check-double"></i></span>';
    } else if (fiHasVerifyRight) {
        html += '<button type="button" class="pm-icon-btn verify js-fi-verify" data-code="' + code + '" title="Verify entry">' +
            '<i class="fas fa-check"></i></button>';
    } else {
        html += '<span class="fi-verified-badge fi-verified-badge--pending" title="Not verified">' +
            '<i class="far fa-circle"></i></span>';
    }

    if (needsApproval) {
        if (approved) {
            const tip = buildFiApprovedTooltip(item);
            html += '<span class="fi-approved-badge fi-approved-badge--done js-fi-approved-tip" title="' + escAttr(tip) + '" data-fi-approve-tip="' + escAttr(tip) + '" role="button" tabindex="0" aria-label="Approved details">' +
                '<i class="fas fa-user-check"></i></span>';
        } else if (!verified) {
            html += '<span class="fi-approved-badge fi-approved-badge--waiting" title="Verify first">' +
                '<i class="fas fa-user-check"></i></span>';
        } else if (fiHasApproveRight) {
            html += '<button type="button" class="pm-icon-btn approve js-fi-approve" data-code="' + code + '" title="Approve entry">' +
                '<i class="fas fa-user-check"></i></button>';
        } else {
            html += '<span class="fi-approved-badge fi-approved-badge--pending" title="Approval pending">' +
                '<i class="far fa-circle"></i></span>';
        }
    }

    if (fiHasEditRight) {
        html += '<button type="button" class="pm-icon-btn edit js-fi-edit" data-code="' + code + '" title="Edit">' +
            '<i class="fas fa-pencil-alt"></i></button>';
    }

    html += '</div>';
    return html;
}

function buildFiViewActionHtml(code) {
    return buildFiListActionHtml(code);
}

function formatFiViewCell(val, format) {
    if (val == null || val === '') return '—';
    if (format === 'amount') return formatInrAmount(val);
    if (format === 'qty') return formatNum(val, 3);
    if (format === 'grn') {
        const n = parseNum(val);
        return n ? String(Math.round(n)) : escHtml(String(val));
    }
    if (format === 'route') return escHtml(formatRouteDisplay(val) || '—');
    return escHtml(val);
}

function mapFiSavedRowForGrid(item, rowIndex) {
    const row = {};

    FI_SAVED_LIST_COLUMNS.forEach(function (col) {
        row[col.key] = formatFiSavedCellValue(item, col, rowIndex);
    });

    return row;
}

function bindFiSavedGrid(list) {
    const rows = list || [];
    const headerId = 'table-header-FiSavedList';
    const bodyId = 'table-body-FiSavedList';

    if (!rows.length) {
        $('#' + headerId).empty();
        $('#' + bodyId).html(
            '<tr><td colspan="' + FI_SAVED_LIST_COLUMNS.filter(function (c) { return !c.hidden; }).length + '">' +
            '<div class="pm-empty">' +
            '<div class="pm-empty-title">No saved freight invoices found</div>' +
            '<div class="pm-empty-sub">Click &quot;New Freight Invoice&quot; to create one.</div>' +
            '</div></td></tr>'
        );
        $('#paginator-tblFiSavedList').empty();
        return;
    }

    const mapped = rows.map(function (item, idx) {
        return mapFiSavedRowForGrid(item, idx);
    });

    const gridMeta = buildFiSavedGridMeta();

    if (typeof window.columnFilters === 'object' && window.columnFilters !== null) {
        window.columnFilters = {};
    }

    if (typeof window.BizsolCustomFilterGrid === 'undefined') {
        console.error('BizsolCustomFilterGrid not loaded — include filter.js before FreightInvoice.js');
        return;
    }

    window.BizsolCustomFilterGrid.CreateDataTable(
        headerId,
        bodyId,
        mapped,
        false,
        [],
        gridMeta.stringCols,
        gridMeta.numericCols,
        gridMeta.dateCols,
        [],
        gridMeta.hiddenCols,
        gridMeta.columnAlignment,
        true,
        null,
        { 'Total Freight Amount': FINANCE_DECIMALS },
        gridMeta.commaCols
    );
}

function filterFiSavedList(query) {
    if (!query) {
        bindFiSavedGrid(fiSavedList);
        return;
    }
    const filtered = (fiSavedList || []).filter(function (item) {
        return getFiSavedSearchText(item).includes(query);
    });
    bindFiSavedGrid(filtered);
}

function loadFiSavedList() {
    const fromDate = $('#txtFiListFromDate').val();
    const toDate = $('#txtFiListToDate').val();

    if (fromDate && toDate && new Date(toDate) < new Date(fromDate)) {
        toastr.warning('List To Date must be greater than or equal to From Date.');
        return;
    }

    showFiLoader();
    return reloadFiSavedListData(fromDate, toDate).finally(function () {
        hideFiLoader();
    });
}

function getFiViewCellValue(row, col) {
    const keys = col.apiKeys || [col.key];
    for (let i = 0; i < keys.length; i++) {
        const val = getFiApiValue(row, keys[i]);
        if (val !== '') return val;
    }
    return getFiApiValue(row, col.key);
}

/** Compute Q-Z display fields for view modal from SHOWMASTER row (same rules as Show grid). */
function enrichViewDetailRow(row) {
    const minQty = parseNum(getFiApiValue(row, 'Min Qty'));
    const billedQty = parseNum(getFiApiValue(row, 'Billed Qty'));
    const grnQty = parseNum(getFiQtyReceived(row));
    const rateWt = parseNum(getFiApiValue(row, 'Rate Per Wt'));
    const rateVeh = parseNum(getFiApiValue(row, 'Rate Per Vehicle'));
    const tolValue = parseNum(getFiApiValue(row, 'Tolerance Value'));
    const tolType = getFiApiValue(row, 'Tolerance Type');
    const tolNature = getFiApiValue(row, 'Tolerance Nature');
    const deductionOn = getFiApiValue(row, 'Deduction On') || 'Billed Qty';

    const freightBilledQty = calcFreightBilledQtyFromValues(minQty, billedQty, grnQty, deductionOn);
    let freightAmt = parseNum(getFiApiValue(row, 'Freight Amount'));
    if (!freightAmt) {
        freightAmt = rateVeh > 0 ? rateVeh : rateWt * freightBilledQty;
        freightAmt = roundTo(freightAmt, FINANCE_DECIMALS);
    }

    const toleranceQty = calcAllowedToleranceQty(billedQty, tolValue, tolType, tolNature);
    const shortageQty = calcShortageQty(billedQty, grnQty, toleranceQty, tolType, tolNature);
    const shortageRate = parseNum(getFiApiValue(row, 'Shortage Rate'));
    let shortageDeduction = parseNum(getFiShortageDeductionAmount(row));
    if (!shortageDeduction && shortageQty > 0 && shortageRate > 0 && rateVeh <= 0) {
        shortageDeduction = roundTo(shortageQty * shortageRate, FINANCE_DECIMALS);
    }

    const otherDed = parseNum(getFiApiValue(row, 'Other Deduction'));
    const otherAdd = parseNum(getFiApiValue(row, 'Other Addition'));
    let netFreight = parseNum(getFiApiValue(row, 'Net Freight Amount'));
    if (!netFreight) {
        netFreight = roundTo(freightAmt - shortageDeduction - otherDed + otherAdd, FINANCE_DECIMALS);
        if (netFreight < 0) netFreight = 0;
    }

    const enriched = Object.assign({}, row);
    enriched['Rate / Wt'] = rateVeh > 0 ? 0 : rateWt;
    enriched['Freight Billed Qty'] = freightBilledQty;
    enriched['Freight Amount'] = freightAmt;
    enriched['Tolerance Qty'] = toleranceQty;
    enriched['Shortage Qty'] = shortageQty;
    enriched['Shortage Rate'] = shortageRate;
    enriched['Shortage Deduction Amount'] = shortageDeduction;
    enriched['Other Deduction'] = otherDed;
    enriched['Other Addition'] = otherAdd;
    enriched['Net Freight Amount'] = netFreight;
    return enriched;
}

function viewFiSavedEntry(code) {
    if (!code) return;

    const finYear = BizSolHelperFunction.getFinancialYear();
    MenuService.CheckModuleOptionRight(getFiModuleName(), 'View', 'Y', finYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg || 'You do not have View permission.');
            return;
        }

        showFiLoader();
        return FreightInvoiceService.GetSavedFreightInvoiceByCode(code)
        .then(function (response) {
            const header = response.Header || response.header || {};
            const details = dedupeFiViewDetails(
                response.Details || response.details || toList(response.FreightMovementDetail)
            );
            $('#fiViewEntryNo').text(formatEntryNoWithFinYear(header) || '—');

            const $badge = $('#fiViewVerifyBadge');
            if (isFiEntryVerified(header)) {
                const tip = buildFiVerifiedTooltip(header);
                $badge.removeAttr('hidden').attr('title', tip).html(
                    '<i class="fas fa-check-double"></i> Verified'
                );
            } else {
                $badge.attr('hidden', 'hidden').removeAttr('title').empty();
            }

            const viewFields = FI_VIEW_HEADER_FIELDS.slice();
            if (fiEntryNeedsApproval(header)) {
                viewFields.push(
                    { label: 'Other Deduction', keys: ['Other Deduction'], format: 'amount' },
                    { label: 'Other Addition', keys: ['Other Addition'], format: 'amount' },
                    { label: 'Approval', keys: ['Approved'], format: 'approvedStatus' }
                );
                if (isFiEntryApproved(header)) {
                    viewFields.push(
                        { label: 'Approved By', keys: ['Approved By', 'ApprovedBy'] },
                        { label: 'Approved On', keys: ['Approved On', 'ApprovedOn'] }
                    );
                }
            }
            viewFields.push({ label: 'Status', keys: ['Verified'], format: 'verifiedStatus' });
            if (isFiEntryVerified(header)) {
                viewFields.push(
                    { label: 'Verified By', keys: ['Verified By', 'VerifiedBy'] },
                    { label: 'Verified On', keys: ['Verified On', 'VerifiedOn'] }
                );
            }

            const $summary = $('#fiViewSummary').empty();
            viewFields.forEach(function (field) {
                const val = getFiHeaderValue(header, field);
                const display = field.format === 'verifiedStatus'
                    ? buildFiVerifiedStatusHtml(header)
                    : field.format === 'approvedStatus'
                        ? buildFiApprovedStatusHtml(header)
                        : formatFiHeaderValue(val, field.format);
                $summary.append(
                    '<div class="col-6 col-md-4 col-lg-3 fi-view-item">' +
                    '<div class="fi-view-label">' + escHtml(field.label) + '</div>' +
                    '<div class="fi-view-value">' + display + '</div>' +
                    '</div>'
                );
            });

            const viewDetailColumns = getFiViewDetailColumns();
            const $thead = $('#tblFiViewDetail thead').empty();
            const $headRow = $('<tr></tr>');
            $headRow.append('<th class="text-center fi-view-sno">#</th>');
            viewDetailColumns.forEach(function (col) {
                $headRow.append(
                    '<th class="text-' + col.align + '">' + escHtml(col.key) + '</th>'
                );
            });
            $thead.append($headRow);

            const colSpan = viewDetailColumns.length + 1;
            const $tbody = $('#tblFiViewDetail tbody').empty();
            if (!details.length) {
                $tbody.append('<tr><td colspan="' + colSpan + '" class="text-center text-muted">No detail lines.</td></tr>');
            } else {
                details.map(enrichViewDetailRow).forEach(function (row, idx) {
                    let html = '<tr><td class="text-center">' + (idx + 1) + '</td>';
                    viewDetailColumns.forEach(function (col) {
                        const val = getFiViewCellValue(row, col);
                        html += '<td class="text-' + col.align + '">' + formatFiViewCell(val, col.format) + '</td>';
                    });
                    html += '</tr>';
                    $tbody.append(html);
                });
            }

            const modalEl = document.getElementById('dvFiViewModal');
            if (modalEl && window.bootstrap?.Modal) {
                bootstrap.Modal.getOrCreateInstance(modalEl).show();
            } else {
                $('#dvFiViewModal').modal('show');
            }
        })
        .catch(function (error) {
            console.error('GetSavedFreightInvoiceByCode failed:', error);
            toastr.error('Error loading freight invoice details.');
        })
        .finally(function () {
            hideFiLoader();
        });
    }).catch(function () {
        toastr.error('Permission check failed.');
    });
}

function showFiLoader() {
    if (typeof window.Showloader === 'function') window.Showloader();
}

function hideFiLoader() {
    if (typeof window.HideLoader === 'function') window.HideLoader();
}

function reloadFiSavedListData(fromDate, toDate) {
    return FreightInvoiceService.GetSavedFreightInvoiceList(fromDate, toDate, '')
        .then(function (response) {
            fiSavedList = toList(response);
            const query = ($('#txtFiListSearch').val() || '').toLowerCase().trim();
            if (query) filterFiSavedList(query);
            else bindFiSavedGrid(fiSavedList);
        })
        .catch(function (error) {
            fiSavedList = [];
            bindFiSavedGrid([]);
            console.error('GetSavedFreightInvoiceList failed:', error);
            toastr.error('Error loading saved freight invoices.');
        });
}

// =============================================================================
// HELPERS — API response, numbers, grid cell read/write
// =============================================================================

function toList(response) {
    if (response == null) return [];
    if (Array.isArray(response)) return response;
    for (const key of ['data', 'Data', 'result', 'Result', 'items', 'Items', 'value', 'Value']) {
        if (Array.isArray(response[key])) return response[key];
    }
    if (typeof response === 'object' && (response.Code != null || response['Rate Per Wt'] != null || response.RatePerWt != null)) {
        return [response];
    }
    return [];
}

function parseNum(val) {
    const n = parseFloat(String(val == null ? '' : val).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
}

function formatNum(val, decimals) {
    return parseNum(val).toFixed(decimals == null ? 2 : decimals);
}

function roundTo(val, decimals) {
    const places = decimals == null ? FINANCE_DECIMALS : decimals;
    const factor = Math.pow(10, places);
    return Math.round(parseNum(val) * factor) / factor;
}

function getFiField($el) {
    if (!$el?.length) return '';
    const el = $el[0];
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
        return ($el.val() || '').trim();
    }
    const text = ($el.text() || '').trim();
    return text === '—' ? '' : text;
}

function setFiField($el, val) {
    if (!$el?.length) return;
    const el = $el[0];
    const text = val == null ? '' : String(val).trim();
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
        $el.val(text);
        return;
    }
    if (!text && $el.hasClass('fi-skeleton')) {
        $el.text('—').addClass('fi-empty');
    } else {
        $el.text(text).removeClass('fi-empty');
    }
}

function updateFiSaveForTransporter() {
    const gridVisible = !$('#dvFiGridSection').prop('hidden');
    if (!gridVisible) return;

    const isAll = !fiEditMasterCode && isFiAllTransportersSelected();
    if (isAll) {
        $('#btnFiSaveAll').prop('disabled', true);
        $('#chkFiSelectAll, #tblFreightInvoice tbody .fi-row-select').prop('disabled', true).prop('checked', false);
        $('#chkFiSelectAll').prop('indeterminate', false);
    } else {
        $('#btnFiSaveAll').prop('disabled', false);
        $('#chkFiSelectAll, #tblFreightInvoice tbody .fi-row-select').prop('disabled', false);
        syncSelectAllCheckbox();
    }
    syncFiTransporterColumnVisibility();
}

function onFiTransporterChange() {
    const gridVisible = !$('#dvFiGridSection').prop('hidden');
    if (gridVisible && !fiEditMasterCode) {
        $('#tblFreightInvoice tbody').empty();
        $('#chkFiSelectAll').prop('checked', false).prop('indeterminate', false);
        setGridVisible(false);
        return;
    }
    updateFiSaveForTransporter();
}

/** Transporter column visible only when All Transporters filter is selected. */
function syncFiTransporterColumnVisibility() {
    $('#tblFreightInvoice').toggleClass('fi-all-transporters', isFiAllTransportersSelected());
}

function isFiAllTransportersSelected() {
    return (parseInt($('#ddlFiTransporter').val(), 10) || 0) === 0;
}

function setGridVisible(visible) {
    $('#dvFiGridSection').prop('hidden', !visible);
    if (!visible) {
        resetFiGridScroll();
        $('#btnFiSaveAll').prop('disabled', true);
    } else {
        updateFiSaveForTransporter();
    }
}

function resetFiGridScroll() {
    const $wrap = $('#dvFiGridSection .fi-table-wrap');
    if (!$wrap.length) return;
    $wrap.scrollLeft(0);
    $wrap.scrollTop(0);
}

/** Validation fail par focus + scroll karo */
function focusCell($field) {
    if (!$field?.length) return;
    const $wrap = $('#dvFiGridSection .fi-table-wrap');
    if ($wrap.length && $field.offset()) {
        $wrap.scrollTop($wrap.scrollTop() + $field.offset().top - $wrap.offset().top - 60);
    }
    if ($field.is('select') && $field.hasClass('select2-hidden-accessible')) {
        $field.next('.select2-container').find('.select2-selection').trigger('focus');
        return;
    }
    $field.trigger('focus');
    if ($field.is('input')) $field.select();
}

function getRowContractType($tr) {
    return String($tr.attr('data-contract-type') || '').trim();
}

function getRowContractTypeCode($tr) {
    return parseInt($tr.attr('data-contract-type-code') || '0', 10) || 0;
}

function getRowVehicleTypeCode($tr) {
    return parseInt($tr.attr('data-vehicle-type-code') || '0', 10) || 0;
}

function setRowContractVehicle($tr, row) {
    const contractType = getFiApiValue(row, 'Contract Type');
    const vehicleType = getFiApiValue(row, 'Vehicle Type');
    $tr.attr({
        'data-contract-type': contractType,
        'data-contract-type-code': getFiApiValue(row, 'Contract Type Code') || row.contractTypeCode || 0,
        'data-vehicle-type-code': getFiApiValue(row, 'Vehicle Type Code') || row.vehicleTypeCode || 0
    });
    setFiField($tr.find('.fi-contract-type'), contractType);
    setFiField($tr.find('.fi-vehicle-type'), vehicleType);
}

function applyRowFreightRates($tr, row) {
    const contractType = getFiApiValue(row, 'Contract Type');
    const rateWt = parseNum(getFiApiValue(row, 'Rate Per Wt'));
    const rateVeh = parseNum(getFiApiValue(row, 'Rate Per Vehicle'));
    const minQty = parseNum(getFiApiValue(row, 'Min Qty'));

    if (String(contractType).trim().toLowerCase() === 'contract') {
        setRowTolerance(
            $tr,
            getFiApiValue(row, 'Tolerance Value'),
            getFiApiValue(row, 'Tolerance Type'),
            getFiApiValue(row, 'Tolerance Nature')
        );
        $tr.attr('data-deduction-on', getFiApiValue(row, 'Deduction On') || 'Billed Qty');
        setContractRates($tr, rateWt, rateVeh, minQty);
        return;
    }

    setRowTolerance($tr, 0, '', '');
    $tr.attr('data-deduction-on', 'Billed Qty');
    setRowRateVehicle($tr, rateVeh);
    setFiField($tr.find('.fi-rate-wt'), formatNum(rateWt, 3));
    setFiField($tr.find('.fi-min-qty'), formatNum(minQty, 3));
}

function getRowTransporter($tr) {
    const filterCode = parseInt($('#ddlFiTransporter').val(), 10) || 0;
    return filterCode > 0 ? filterCode : parseInt($tr.attr('data-account-master-code') || '0', 10) || 0;
}

// =============================================================================
// FORM LOAD — page open par filter dropdowns
// =============================================================================

function bindBillTypeDropdown(rows) {
    const $ddl = $('#ddlFiBillType').empty();
    $ddl.append($('<option></option>').val('').text('Select Bill Type'));
    if (!rows.length) {
        toastr.warning('No bill types found.');
        return;
    }
    rows.forEach(function (item) {
        const code = String(item.Code);
        const nature = item.Nature || '';
        $ddl.append($('<option></option>').val(code).attr('data-nature', nature).text(item['Bill Type'] || item.Value || ''));
    });
}

function bindTransporterDropdown(rows) {
    const $ddl = $('#ddlFiTransporter').empty().append('<option value="0">All Transporters</option>');
    rows.forEach(function (item) {
        $ddl.append($('<option></option>').val(item.Code).text(item.Transporter));
    });
}

function loadFilterDropdowns() {
    if (filtersPromise) return filtersPromise;

    filtersPromise = Promise.all([
        FreightInvoiceService.GetBillTypeList()
            .then(function (response) { bindBillTypeDropdown(toList(response)); })
            .catch(function () {
                $('#ddlFiBillType').empty();
                toastr.error('Error loading bill type list.');
            }),
        FreightInvoiceService.GetTransporterList()
            .then(function (response) { bindTransporterDropdown(toList(response)); })
            .catch(function () {
                bindTransporterDropdown([]);
                toastr.error('Error loading transporter list.');
            })
    ]);

    return filtersPromise;
}

// =============================================================================
// KEYBOARD — Enter / Tab = agla editable field
// =============================================================================

function moveToNextEditableField(currentEl, reverse) {
    const $fields = $('#tblFreightInvoice tbody .fi-editable:visible:not([disabled]):not([readonly])');
    const idx = $fields.index(currentEl);
    if (idx < 0) return;
    const $next = $fields.eq(idx + (reverse ? -1 : 1));
    if (!$next.length) return;

    if ($next.is('select') && $next.hasClass('select2-hidden-accessible')) {
        $next.next('.select2-container').find('.select2-selection').trigger('focus');
    } else {
        $next.trigger('focus');
        if ($next.is('input')) $next.select();
    }
}

function bindGridEnterTab() {
    $('#tblFreightInvoice').off('keydown.fiNav').on('keydown.fiNav', '.fi-input.fi-editable', function (e) {
        if (e.key !== 'Enter' && e.key !== 'Tab') return;
        e.preventDefault();
        $(this).trigger('change');
        moveToNextEditableField(this, e.shiftKey);
    });
}

// =============================================================================
// CALCULATIONS — qty sources are separate:
//   Billed Qty  = supplier billed qty on GRN (Billed Qty column)
//   Qty(Received) = MRN received MT — used internally when Deduction On = Qty(Received)
//   Reached Qty column = blank for now (display only; SP returns '')
//   Contract base qty from [Deduction On]: Billed Qty | Qty(Received) | Whichever is Lower
// Freight Amount = Rate/Vehicle OR Rate/Wt × Freight Billed Qty
// Tolerance Qty = Billed × Tolerance Value (%) [all types; KG = fixed value]
// Shortage only when (Billed − Received) > Tolerance Qty:
//   % (F) → Shortage Qty = Billed − Received
//   % (D) → Shortage Qty = (Billed − Received) − Tolerance Qty
// Shortage Rate = PO material rate + GST; Deduction = Shortage Qty × Rate
// =============================================================================

function getRowGrnQty($tr) {
    return parseNum($tr.attr('data-received-qty')) || parseNum($tr.attr('data-total-weight'));
}

/** Billed Qty — used for tolerance % (F) and shortage diff. */
function getRowBilledQty($tr) {
    return parseNum($tr.attr('data-billed-qty'));
}

function formatToleranceTypeDisplay($tr) {
    const type = String($tr.attr('data-tolerance-type') || '').trim();
    const value = parseNum($tr.attr('data-tolerance-value'));
    if (!type && value <= 0) return '';
    if (value > 0 && type) return formatNum(value, 3) + ' ' + type;
    return type || (value > 0 ? formatNum(value, 3) : '');
}

function setRowTolerance($tr, toleranceValue, toleranceType, toleranceNature) {
    $tr.attr({
        'data-tolerance-value': parseNum(toleranceValue),
        'data-tolerance-type': toleranceType == null ? '' : String(toleranceType).trim(),
        'data-tolerance-nature': toleranceNature == null ? '' : String(toleranceNature).trim()
    });
}

/** Excel: Auto / Not Applicable → no tolerance qty. */
function isFiToleranceNotApplicable(toleranceType) {
    const t = String(toleranceType || '').trim().toUpperCase().replace(/\s/g, '');
    return !t || t === 'AUTO' || t.indexOf('NOTAPPLICABLE') >= 0 || t === 'NA' || t === 'N/A';
}

/** % (D) / KG (D) — shortage beyond tolerance uses differential (diff − tolerance). */
function isFiToleranceTypeD(toleranceType, toleranceNature) {
    const t = String(toleranceType || '').toUpperCase().replace(/\s/g, '');
    const n = String(toleranceNature || '').toUpperCase();
    if (t.indexOf('%(D)') >= 0 || t.indexOf('(D)') >= 0) return true;
    if (/%D(?![A-Z0-9])/.test(t) || t.endsWith('%D')) return true;
    if (t.indexOf('KG(D)') >= 0) return true;
    return n === 'KG' && t.indexOf('(D)') >= 0;
}

/**
 * Tolerance Qty — always Billed × Tolerance Value (%) for all types; KG = fixed value.
 * Shown whenever contract tolerance applies (even if received ≥ billed).
 */
function calcAllowedToleranceQty(billedQty, toleranceValue, toleranceType, toleranceNature) {
    if (toleranceValue <= 0 || isFiToleranceNotApplicable(toleranceType)) return 0;

    const t = String(toleranceType || '').toUpperCase().replace(/\s/g, '');
    const n = String(toleranceNature || '').toUpperCase();
    if (n === 'KG' || t.indexOf('KG') >= 0) return roundTo(toleranceValue, 3);
    if (billedQty <= 0) return 0;
    return roundTo(billedQty * toleranceValue / 100, 3);
}

/**
 * Shortage Qty — only when (Billed − Received) > Tolerance Qty:
 *   % (F) / KG (F) → full shortfall = Billed − Received
 *   % (D) / KG (D) → differential = (Billed − Received) − Tolerance Qty
 * Shortage Rate × Shortage Qty → Shortage Deduction (PO material rate + GST from SP).
 */
function calcShortageQty(billedQty, receivedQty, toleranceQty, toleranceType, toleranceNature) {
    const diff = roundTo(billedQty - receivedQty, 3);
    if (diff <= 0 || diff <= toleranceQty) return 0;

    if (isFiToleranceTypeD(toleranceType, toleranceNature)) {
        return roundTo(diff - toleranceQty, 3);
    }
    return roundTo(diff, 3);
}

function normalizeFiDeductionOn(value) {
    return String(value || 'Billed Qty').trim().toLowerCase();
}

/** Contract [Deduction On] from F_CommonValues: Billed Qty | Qty(Received) | Whichever is Lower */
function getContractBaseQty($tr) {
    const billedQty = getRowBilledQty($tr);
    const receivedQty = getRowGrnQty($tr);
    const deductionOn = normalizeFiDeductionOn($tr.attr('data-deduction-on'));

    if (deductionOn === 'qty(received)') {
        return receivedQty;
    }
    if (deductionOn.indexOf('lower') >= 0) {
        return roundTo(Math.min(billedQty, receivedQty), 3);
    }
    return billedQty;
}

function calcFreightBilledQtyFromValues(minQty, billedQty, receivedQty, deductionOn) {
    const min = parseNum(minQty);
    const billed = parseNum(billedQty);
    const received = parseNum(receivedQty);

    const ded = normalizeFiDeductionOn(deductionOn);
    let base = billed;
    if (ded === 'qty(received)') base = received;
    else if (ded.indexOf('lower') >= 0) base = Math.min(billed, received);

    return roundTo(Math.max(min, base), 3);
}

function getFreightBilledQty($tr) {
    const minQty = parseNum(getFiField($tr.find('.fi-min-qty')));
    const baseQty = getContractBaseQty($tr);
    return roundTo(Math.max(minQty, baseQty), 3);
}

function getRowRateVehicle($tr) {
    const $input = $tr.find('.fi-rate-vehicle');
    if ($input.length) {
        const val = parseNum(getFiField($input));
        if (val > 0) return val;
    }
    return parseNum($tr.attr('data-rate-vehicle'));
}

function setRowRateVehicle($tr, val) {
    const n = parseNum(val);
    $tr.attr('data-rate-vehicle', String(n));
    const $input = $tr.find('.fi-rate-vehicle');
    if ($input.length) {
        setFiField($input, n > 0 ? formatNum(n, FINANCE_DECIMALS) : formatNum(0, FINANCE_DECIMALS));
    }
}

/** Row ke calculated columns update karo (columns Q-Z) */
function calculateFreightRow($tr) {
    const billedQty = getRowBilledQty($tr);
    const receivedQty = getRowGrnQty($tr);
    const rateWt = parseNum(getFiField($tr.find('.fi-rate-wt')));
    const rateVeh = getRowRateVehicle($tr);
    const freightBilledQty = getFreightBilledQty($tr);

    let freightAmt = 0;
    if (rateVeh > 0) {
        freightAmt = rateVeh;
    } else if (rateWt > 0) {
        freightAmt = rateWt * freightBilledQty;
    }
    freightAmt = roundTo(freightAmt, FINANCE_DECIMALS);

    const tolValue = parseNum($tr.attr('data-tolerance-value'));
    const tolType = $tr.attr('data-tolerance-type');
    const tolNature = $tr.attr('data-tolerance-nature');
    const toleranceQty = calcAllowedToleranceQty(billedQty, tolValue, tolType, tolNature);
    const shortageQty = calcShortageQty(billedQty, receivedQty, toleranceQty, tolType, tolNature);
    const shortageRate = parseNum($tr.attr('data-shortage-rate'));
    let shortageDeduction = 0;
    if (shortageQty > 0 && shortageRate > 0 && rateVeh <= 0) {
        shortageDeduction = roundTo(shortageQty * shortageRate, FINANCE_DECIMALS);
    }

    const otherDeduction = parseNum(getFiField($tr.find('.fi-other-deduction')));
    const otherAddition = parseNum(getFiField($tr.find('.fi-other-addition')));
    let netFreight = roundTo(freightAmt - shortageDeduction - otherDeduction + otherAddition, FINANCE_DECIMALS);
    if (netFreight < 0) netFreight = 0;

    setFiField($tr.find('.fi-billed-qty'), formatNum(billedQty, 3));
    setFiField($tr.find('.fi-grn-qty'), formatNum(receivedQty, 3));
    setFiField($tr.find('.fi-freight-billed-qty'), formatNum(freightBilledQty, 3));
    setFiField($tr.find('.fi-freight-amt'), formatNum(freightAmt, FINANCE_DECIMALS));
    setFiField($tr.find('.fi-tolerance-type'), formatToleranceTypeDisplay($tr));
    setFiField($tr.find('.fi-tolerance-qty'), formatNum(toleranceQty, 3));
    setFiField($tr.find('.fi-shortage-qty'), formatNum(shortageQty, 3));
    setFiField($tr.find('.fi-shortage-rate'), formatNum(shortageRate, 3));
    setFiField($tr.find('.fi-shortage-deduction'), formatNum(shortageDeduction, FINANCE_DECIMALS));
    setFiField($tr.find('.fi-net-freight-amt'), formatNum(netFreight, FINANCE_DECIMALS));
}

function syncEditableInputSize(input) {
    if (!input?.classList?.contains('fi-editable')) return;
    const len = Math.max(String(input.value || '').length, 4);
    input.size = len + 1;
    input.style.width = 'calc(' + len + 'ch + 14px)';
}

function allowDecimalKey(e, maxDecimals) {
    if (e.ctrlKey || e.metaKey || e.altKey) return true;
    const key = e.key;
    if (key === 'Backspace' || key === 'Delete' || key === 'Tab' || key === 'Enter' || key === 'ArrowLeft' || key === 'ArrowRight') return true;
    const el = e.target;
    if (key === '.' && el.value.indexOf('.') < 0) return true;
    if (!/^\d$/.test(key)) {
        e.preventDefault();
        return false;
    }
    const dot = el.value.indexOf('.');
    if (dot >= 0 && el.selectionStart > dot) {
        const decimals = el.value.length - dot - 1;
        if (decimals >= maxDecimals && (el.selectionEnd || 0) - (el.selectionStart || 0) === 0) {
            e.preventDefault();
            return false;
        }
    }
    return true;
}

function formatDecimalInput(el, decimals) {
    const raw = String(el.value == null ? '' : el.value).replace(/,/g, '').trim();
    if (!raw) {
        el.value = formatNum(0, decimals);
        return 0;
    }
    const n = parseFloat(raw);
    if (isNaN(n)) {
        el.value = formatNum(0, decimals);
        return 0;
    }
    el.value = n.toFixed(decimals);
    return n;
}

function bindEditableInputResize($scope) {
    $scope.find('.fi-input.fi-editable')
        .off('input.fiResize')
        .on('input.fiResize', function () { syncEditableInputSize(this); })
        .each(function () { syncEditableInputSize(this); });
}

function bindDecimalInput($input, decimals, eventNs, onChange) {
    if (!$input?.length) return;
    $input.off('.' + eventNs)
        .on('keydown.' + eventNs, function (e) { allowDecimalKey(e, decimals); })
        .on('input.' + eventNs, function () { syncEditableInputSize(this); })
        .on('change.' + eventNs, function () {
            formatDecimalInput(this, decimals);
            syncEditableInputSize(this);
            if (onChange) onChange.call(this);
        });
    if ($input.hasClass('fi-editable')) syncEditableInputSize($input[0]);
}

// =============================================================================
// SPREAD CHANGE — contract/vehicle change, contract rates, rate lock
// =============================================================================

function setContractRates($tr, rateWt, rateVeh, minQty) {
    if (rateVeh > 0) {
        setRowRateVehicle($tr, rateVeh);
        setFiField($tr.find('.fi-rate-wt'), formatNum(0, 3));
    } else if (rateWt > 0) {
        setRowRateVehicle($tr, 0);
        setFiField($tr.find('.fi-rate-wt'), formatNum(rateWt, 3));
    } else {
        setRowRateVehicle($tr, 0);
        setFiField($tr.find('.fi-rate-wt'), formatNum(0, 3));
    }
    setFiField($tr.find('.fi-min-qty'), formatNum(minQty, 3));
    calculateFreightRow($tr);
}

function setRateFieldLock($input, locked) {
    if (!$input?.length) return;
    if (locked) {
        $input.prop('readonly', true).removeClass('fi-editable').addClass('fi-locked').attr('tabindex', '-1');
    } else {
        $input.prop('readonly', false).removeClass('fi-locked').addClass('fi-editable').removeAttr('tabindex');
    }
}

function setupManualAdjustmentFields($tr) {
    const $ded = $tr.find('.fi-other-deduction');
    const $add = $tr.find('.fi-other-addition');
    $ded.add($add).prop('readonly', false).removeClass('fi-locked').addClass('fi-editable');
    const recalc = function () { calculateFreightRow($tr); };
    bindDecimalInput($ded, FINANCE_DECIMALS, 'fiAdjDed', recalc);
    bindDecimalInput($add, FINANCE_DECIMALS, 'fiAdjAdd', recalc);
}

/** Contract = Rate/Wt, Rate/Vehicle, Min Qty locked; Open = all three editable. Combos always locked. */
function setupRateFields($tr, freightType) {
    const isOpen = freightType === 'Open';
    const $rateWt = $tr.find('.fi-rate-wt');
    const $rateVeh = $tr.find('.fi-rate-vehicle');
    const $minQty = $tr.find('.fi-min-qty');

    setRateFieldLock($rateWt, !isOpen);
    setRateFieldLock($rateVeh, !isOpen);
    setRateFieldLock($minQty, freightType === 'Contract');
    setupManualAdjustmentFields($tr);
    $tr.find('.fi-input[readonly]').attr('tabindex', '-1');
    $tr.find('.fi-editable').removeAttr('tabindex');

    if (!isOpen) return;

    bindEditableInputResize($tr);
    bindDecimalInput($rateWt, 3, 'fiRate', function () {
        if (parseNum(this.value) > 0) setRowRateVehicle($tr, 0);
        calculateFreightRow($tr);
    });
    bindDecimalInput($rateVeh, FINANCE_DECIMALS, 'fiRateVeh', function () {
        const n = parseNum(this.value);
        setRowRateVehicle($tr, n);
        if (n > 0) setFiField($rateWt, formatNum(0, 3));
        calculateFreightRow($tr);
    });
    bindDecimalInput($minQty, 3, 'fiMinQty', function () {
        calculateFreightRow($tr);
    });
}

// =============================================================================
// GRID COLUMNS — FI_GRID_HEADERS defined at top (entry grid + view modal)
// =============================================================================

function syncFiGridColgroup() {
    const $colgroup = $('#fiGridColgroup').empty();
    FI_GRID_HEADERS.forEach(function (col) {
        $colgroup.append($('<col>').addClass(col.colClass));
    });
}

function buildFreightGridHeader() {
    syncFiGridColgroup();
    const $thead = $('#tblFreightInvoice thead').empty();
    const $tr = $('<tr></tr>');
    FI_GRID_HEADERS.forEach(function (col, colIndex) {
        const $th = $('<th></th>')
            .addClass((col.thClass || '') + ' fi-sortable')
            .attr({
                'data-col-index': colIndex,
                'data-sort-type': col.sortType || 'text',
                title: 'Click to sort'
            });

        if (col.isSelectAll) {
            $th.append(
                $('<span class="fi-head-check-box"></span>').html(
                    '<input type="checkbox" id="chkFiSelectAll" class="fi-select-all" title="Select all rows" aria-label="Select all rows" />'
                )
            );
        } else {
            $th.append($('<span class="fi-th-label"></span>').text(col.label));
        }

        $th.append($('<i class="fas fa-sort fi-sort-icon" aria-hidden="true"></i>'));
        $tr.append($th);
    });
    $thead.append($tr);
    updateFiGridSortIcons();
    syncFiTransporterColumnVisibility();
}

function getFiGridCellValue($tr, colIndex) {
    const $td = $tr.children('td').eq(colIndex);
    if (!$td.length) return '';

    const $checkbox = $td.find('input.fi-row-select');
    if ($checkbox.length) return $checkbox.is(':checked') ? 1 : 0;

    const $input = $td.find('input.fi-input').first();
    if ($input.length) return String($input.val() || '').trim();

    return String($td.text() || '').trim();
}

function compareFiGridSortValues(a, b, sortType) {
    if (sortType === 'number') {
        return parseNum(a) - parseNum(b);
    }
    if (sortType === 'date') {
        const da = Date.parse(String(a || '').trim());
        const db = Date.parse(String(b || '').trim());
        return (isNaN(da) ? 0 : da) - (isNaN(db) ? 0 : db);
    }
    if (sortType === 'check') {
        return (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0);
    }
    return String(a || '').localeCompare(String(b || ''), undefined, { numeric: true, sensitivity: 'base' });
}

function updateFiGridSortIcons() {
    $('#tblFreightInvoice thead th.fi-sortable').each(function () {
        const colIndex = parseInt($(this).attr('data-col-index'), 10);
        const $icon = $(this).find('.fi-sort-icon');
        $icon.removeClass('fa-sort fa-sort-up fa-sort-down');
        if (colIndex === fiGridSortState.colIndex) {
            $icon.addClass(fiGridSortState.dir === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
        } else {
            $icon.addClass('fa-sort');
        }
    });
}

function sortFiGridColumn(colIndex) {
    const sortType = FI_GRID_HEADERS[colIndex]?.sortType || 'text';
    const $tbody = $('#tblFreightInvoice tbody');
    const rows = $tbody.children('tr').get();
    if (!rows.length) return;

    if (fiGridSortState.colIndex === colIndex) {
        fiGridSortState.dir = fiGridSortState.dir === 'asc' ? 'desc' : 'asc';
    } else {
        fiGridSortState.colIndex = colIndex;
        fiGridSortState.dir = 'asc';
    }

    const direction = fiGridSortState.dir === 'asc' ? 1 : -1;
    rows.sort(function (rowA, rowB) {
        const valA = getFiGridCellValue($(rowA), colIndex);
        const valB = getFiGridCellValue($(rowB), colIndex);
        return compareFiGridSortValues(valA, valB, sortType) * direction;
    });

    $tbody.append(rows);
    updateFiGridSortIcons();
}

function onFiGridHeaderSortClick(e) {
    if ($(e.target).closest('.fi-select-all, .fi-head-check-box, #chkFiSelectAll').length) return;
    const colIndex = parseInt($(this).attr('data-col-index'), 10);
    if (isNaN(colIndex)) return;
    sortFiGridColumn(colIndex);
}

function resetFiGridSortState() {
    fiGridSortState = { colIndex: -1, dir: 'asc' };
    updateFiGridSortIcons();
}

function syncSelectAllCheckbox() {
    const $rows = $('#tblFreightInvoice tbody .fi-row-select');
    const $all = $('#chkFiSelectAll');
    if (!$all.length) return;
    if (!$rows.length) {
        $all.prop('checked', false).prop('indeterminate', false);
        return;
    }
    const checkedCount = $rows.filter(':checked').length;
    $all.prop('checked', checkedCount === $rows.length);
    $all.prop('indeterminate', checkedCount > 0 && checkedCount < $rows.length);
}

function buildFreightRowHtml() {
    return `
            <tr data-code="0" data-mrn-code="0" data-total-weight="0" data-account-master-code="0" data-tolerance-value="0" data-tolerance-type="" data-tolerance-nature="" data-rate-vehicle="0" data-shortage-rate="0">
                <td class="center fi-col-check"><input type="checkbox" class="fi-row-select" title="Select row for save" /></td>
                <td class="center fi-col-date"><span class="fi-cell fi-grn-date center"></span></td>
                <td class="fi-col-grn"><span class="fi-cell fi-grn-no"></span></td>
                <td class="fi-col-party"><span class="fi-cell fi-party-name fi-locked"></span></td>
                <td class="fi-col-grn"><span class="fi-cell fi-gr-no fi-locked"></span></td>
                <td class="center fi-col-date"><span class="fi-cell fi-gr-date fi-locked center"></span></td>
                <td class="fi-col-grn"><span class="fi-cell fi-vehicle-no fi-locked"></span></td>
                <td class="center fi-col-date"><span class="fi-cell fi-invoice-date center fi-locked"></span></td>
                <td class="fi-col-grn"><span class="fi-cell fi-invoice-no fi-locked"></span></td>
                <td class="fi-col-grn"><span class="fi-cell fi-bill-no"></span></td>
                <td class="center fi-col-date"><span class="fi-cell fi-bill-date center"></span></td>
                <td class="fi-col-grn"><span class="fi-cell fi-freight-contract-no fi-locked"></span></td>
                <td class="fi-col-transporter"><span class="fi-cell fi-transporter-name fi-locked"></span></td>
                <td class="fi-col-city"><span class="fi-cell fi-from-city"></span></td>
                <td class="fi-col-city"><span class="fi-cell fi-to-city"></span></td>
                <td class="fi-col-combo"><span class="fi-cell fi-contract-type fi-locked"></span></td>
                <td class="fi-col-vehicle"><span class="fi-cell fi-vehicle-type fi-locked"></span></td>
                <td class="fi-col-num"><input type="text" class="fi-input fi-rate-wt" /></td>
                <td class="fi-col-num"><input type="text" class="fi-input fi-rate-vehicle" /></td>
                <td class="fi-col-num"><input type="text" class="fi-input fi-min-qty" /></td>
                <td class="fi-col-num"><span class="fi-cell fi-billed-qty fi-locked"></span></td>
                <td class="fi-col-num"><span class="fi-cell fi-grn-qty fi-locked"></span></td>
                <td class="fi-col-num"><span class="fi-cell fi-invoice-qty fi-locked"></span></td>
                <td class="fi-col-num"><span class="fi-cell fi-reached-qty fi-locked"></span></td>
                <td class="fi-col-num"><span class="fi-cell fi-freight-billed-qty fi-calc"></span></td>
                <td class="fi-col-num"><span class="fi-cell fi-freight-amt fi-calc"></span></td>
                <td class="fi-col-tolerance"><span class="fi-cell fi-tolerance-type fi-calc"></span></td>
                <td class="fi-col-num"><span class="fi-cell fi-tolerance-qty fi-calc"></span></td>
                <td class="fi-col-num"><span class="fi-cell fi-shortage-qty fi-calc"></span></td>
                <td class="fi-col-num"><span class="fi-cell fi-shortage-rate fi-calc"></span></td>
                <td class="fi-col-num"><span class="fi-cell fi-shortage-deduction fi-calc"></span></td>
                <td class="fi-col-num"><input type="text" class="fi-input fi-other-deduction fi-editable" value="0.00" /></td>
                <td class="fi-col-num"><input type="text" class="fi-input fi-other-addition fi-editable" value="0.00" /></td>
                <td class="fi-col-num"><span class="fi-cell fi-net-freight-amt fi-calc"></span></td>
            </tr>
        `;
}

function assertFreightGridColumns() {
    const $firstRow = $('#tblFreightInvoice tbody tr').first();
    if (!$firstRow.length) return;
    const thCount = $('#tblFreightInvoice thead th').length;
    const tdCount = $firstRow.children('td').length;
    const expectedCount = FI_GRID_HEADERS.length;
    if (thCount !== tdCount || thCount !== expectedCount) {
        console.error('Freight grid column mismatch — th:', thCount, 'td:', tdCount, 'expected:', expectedCount);
    }
}

// =============================================================================
// SHOW DATA — Show button → LOCATE API → grid bind
// =============================================================================

/** API rows se grid rows banao aur values set karo */
function bindSpreadFromData(rows, options) {
    options = options || {};
    buildFreightGridHeader();
    const $tbody = $('#tblFreightInvoice tbody').empty();

    return Promise.all(rows.map(function (row) {
        const $tr = $(buildFreightRowHtml());
        $tbody.append($tr);

        const billedQty = parseNum(row['Billed Qty']) || parseNum(row['Billed Qty MT']);
        const receivedQty = parseNum(getFiQtyReceived(row));

        $tr.attr({
            'data-code': row.Code || 0,
            'data-mrn-code': row.MRNMaster_Code || 0,
            'data-billed-qty': billedQty,
            'data-received-qty': receivedQty,
            'data-total-weight': receivedQty,
            'data-account-master-code': row.AccountMaster_Code || row.accountMaster_Code || 0,
            'data-from-city': row['From City'] || '',
            'data-from-area': row['From Area'] || '',
            'data-to-city': row['To City'] || '',
            'data-to-area': row['To Area'] || '',
            'data-shortage-rate': String(parseNum(getFiApiValue(row, 'Shortage Rate')))
        });

        setFiField($tr.find('.fi-grn-date'), row['GRN Date'] || '');
        setFiField($tr.find('.fi-grn-no'), row['GRN Number'] || '');
        setFiField($tr.find('.fi-party-name'), getFiApiValue(row, 'Party Name') || getFiApiValue(row, 'Party'));
        setFiField($tr.find('.fi-gr-no'), getFiApiValue(row, 'GR No'));
        setFiField($tr.find('.fi-gr-date'), getFiApiValue(row, 'GR Date'));
        setFiField($tr.find('.fi-vehicle-no'), getFiApiValue(row, 'Vehicle No') || getFiApiValue(row, 'Truck No'));
        setFiField($tr.find('.fi-invoice-date'), row['Invoice Date'] || '');
        setFiField($tr.find('.fi-invoice-no'), row['Invoice Number'] || '');
        setFiField($tr.find('.fi-bill-no'), row['Bill No'] || '');
        setFiField($tr.find('.fi-bill-date'), row['Bill Date'] || '');
        setFiField($tr.find('.fi-freight-contract-no'), getFiApiValue(row, 'Freight Contract No') || '');
        setFiField($tr.find('.fi-transporter-name'), getFiApiValue(row, 'Transporter'));
        setFiField($tr.find('.fi-from-city'), row['From City'] || '');
        setFiField($tr.find('.fi-to-city'), row['To City'] || '');
        setRowContractVehicle($tr, row);
        applyRowFreightRates($tr, row);
        setFiField($tr.find('.fi-billed-qty'), billedQty > 0 ? formatNum(billedQty, 3) : '');
        setFiField($tr.find('.fi-grn-qty'), receivedQty > 0 ? formatNum(receivedQty, 3) : '');
        const invoiceQty = parseNum(row['Invoice Qty']);
        setFiField($tr.find('.fi-invoice-qty'), invoiceQty > 0 ? formatNum(invoiceQty, 3) : '');
        if (options.preserveSavedAmounts) {
            const otherDed = getFiApiValue(row, 'Other Deduction');
            const otherAdd = getFiApiValue(row, 'Other Addition');
            setFiField($tr.find('.fi-other-deduction'), otherDed !== '' ? formatNum(otherDed, FINANCE_DECIMALS) : formatNum(0, FINANCE_DECIMALS));
            setFiField($tr.find('.fi-other-addition'), otherAdd !== '' ? formatNum(otherAdd, FINANCE_DECIMALS) : formatNum(0, FINANCE_DECIMALS));
        } else {
            setFiField($tr.find('.fi-other-deduction'), formatNum(0, FINANCE_DECIMALS));
            setFiField($tr.find('.fi-other-addition'), formatNum(0, FINANCE_DECIMALS));
        }

        setupRateFields($tr, getRowContractType($tr));
        calculateFreightRow($tr);
        if (options.preserveSavedAmounts) {
            applySavedRowAmounts($tr, row);
        }

        bindEditableInputResize($tr);
        return Promise.resolve();
    })).then(function () {
        if (options.selectAllRows) {
            $('#tblFreightInvoice tbody .fi-row-select').prop('checked', true);
        }
        assertFreightGridColumns();
        syncSelectAllCheckbox();
        updateFiSaveForTransporter();
        bindGridEnterTab();
        bindEditableInputResize($('#tblFreightInvoice tbody'));
        resetFiGridSortState();
        resetFiGridScroll();
    });
}

/** Show button — filters + LOCATE API + bindSpreadFromData */
function showFreightData() {
    if (gridLoading) return;

    const fromDate = $('#txtFiFromDate').val();
    const toDate = $('#txtFiToDate').val();

    if (!fromDate || !toDate) {
        toastr.warning('Please select From Date and To Date.');
        return focusCell($('#txtFiFromDate'));
    }
    if (new Date(toDate) < new Date(fromDate)) {
        toastr.warning('To Date must be greater than or equal to From Date.');
        return focusCell($('#txtFiToDate'));
    }

    setGridVisible(false);
    gridLoading = true;
    showFiLoader();

    return loadFilterDropdowns()
        .then(function () {
            const billTypeCode = parseInt($('#ddlFiBillType').val(), 10) || 0;
            if (billTypeCode <= 0) {
                toastr.warning('Please select Bill Type.');
                focusCell($('#ddlFiBillType'));
                return Promise.reject({ handled: true });
            }
            return FreightInvoiceService.GetFreightInvoiceList(
                fromDate,
                toDate,
                '',
                parseInt($('#ddlFiTransporter').val(), 10) || 0,
                billTypeCode
            );
        })
        .then(function (response) {
            const rows = toList(response);
            if (!rows.length) {
                setGridVisible(false);
                toastr.error('No Data Found');
                return;
            }
            setGridVisible(true);
            return bindSpreadFromData(rows);
        })
        .catch(function (error) {
            setGridVisible(false);
            if (error && error.handled) return;
            if (!(error && error.message)) toastr.error('Error during Freight Invoice');
        })
        .finally(function () {
            gridLoading = false;
            hideFiLoader();
        });
}

// =============================================================================
// SAVE — validate → save
// =============================================================================

/** Checked rows validate — fail par message + focus, null return */
function validateFreightData() {
    const details = [];
    let selectedCount = 0;

    let valid = true;
    $('#tblFreightInvoice tbody tr').each(function () {
        const $tr = $(this);
        if (!$tr.find('.fi-row-select').is(':checked')) return;

        selectedCount++;
        const grnNo = getFiField($tr.find('.fi-grn-no'));
        const freightType = getRowContractType($tr);
        let invalidField = null;
        let message = '';

        if (!grnNo) {
            message = 'Invalid row — GRN Number is missing.';
            invalidField = $tr.find('.fi-grn-no');
        } else if (!String(getFiField($tr.find('.fi-gr-no')) || '').trim()) {
            message = 'GR No is mandatory. Please enter GR No in GRN ' + grnNo + ' before saving freight.';
            invalidField = $tr.find('.fi-gr-no');
        } else if (parseInt($tr.attr('data-code') || '0', 10) <= 0) {
            message = 'Invalid row — freight line code is missing for GRN ' + grnNo + '.';
            invalidField = $tr.find('.fi-grn-no');
        } else if (!getRowContractTypeCode($tr)) {
            message = 'Contract Type is missing for GRN ' + grnNo + '.';
            invalidField = $tr.find('.fi-contract-type');
        } else if (!getRowVehicleTypeCode($tr)) {
            message = 'Vehicle Type is missing for GRN ' + grnNo + '.';
            invalidField = $tr.find('.fi-vehicle-type');
        } else if (parseNum(getFiField($tr.find('.fi-rate-wt'))) === 0 && getRowRateVehicle($tr) === 0) {
            message = freightType === 'Contract'
                ? 'No contract rate found for this route and vehicle on GRN ' + grnNo + '.'
                : 'Please enter Rate / Wt or Rate / Vehicle for GRN ' + grnNo + '.';
            invalidField = $tr.find('.fi-rate-wt');
        }

        if (invalidField) {
            focusCell(invalidField);
            toastr.warning(message);
            valid = false;
            return false;
        }

        calculateFreightRow($tr);

        details.push({
            Code: parseInt($tr.attr('data-code') || '0', 10) || 0,
            MRNMaster_Code: parseInt($tr.attr('data-mrn-code') || '0', 10) || 0,
            AccountMaster_Code: getRowTransporter($tr),
            ContractTypeCode: getRowContractTypeCode($tr),
            VehicleTypeCode: getRowVehicleTypeCode($tr),
            RatePerWt: parseNum(getFiField($tr.find('.fi-rate-wt'))),
            RatePerVehicle: getRowRateVehicle($tr),
            MinQty: parseNum(getFiField($tr.find('.fi-min-qty'))),
            MinAmount: 0,
            BilledQty: getRowBilledQty($tr),
            GRNQty: parseNum(getFiField($tr.find('.fi-grn-qty'))),
            FreightBilledQty: parseNum(getFiField($tr.find('.fi-freight-billed-qty'))),
            FreightAmount: parseNum(getFiField($tr.find('.fi-freight-amt'))),
            ToleranceQty: parseNum(getFiField($tr.find('.fi-tolerance-qty'))),
            ShortageQty: parseNum(getFiField($tr.find('.fi-shortage-qty'))),
            ShortageRate: parseNum($tr.attr('data-shortage-rate')) || parseNum(getFiField($tr.find('.fi-shortage-rate'))),
            ShortageDeduction: parseNum(getFiField($tr.find('.fi-shortage-deduction'))),
            OtherDeduction: parseNum(getFiField($tr.find('.fi-other-deduction'))),
            OtherAddition: parseNum(getFiField($tr.find('.fi-other-addition'))),
            NetFreightAmount: parseNum(getFiField($tr.find('.fi-net-freight-amt')))
        });
    });

    if (selectedCount === 0) {
        toastr.warning('Please select at least one row to save.');
        return null;
    }
    if (!valid) return null;
    return details;
}

/** Selected rows API ko post karo */
function saveFreightData(details) {
    const isEdit = (fiEditMasterCode || 0) > 0;
    const rightName = isEdit ? 'Edit' : 'New';
    const finYear = BizSolHelperFunction.getFinancialYear();

    return MenuService.CheckModuleOptionRight(getFiModuleName(), rightName, 'Y', finYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg || 'You do not have ' + rightName + ' permission.');
            return Promise.reject({ handled: true });
        }

        const authKey = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const payload = {
            Master: [{
                Code: fiEditMasterCode || 0,
                UserMaster_Code: parseInt(authKey.UserMaster_Code, 10) || 0,
                BillTypeCode: parseInt($('#ddlFiBillType').val(), 10) || 0,
                AllowEditAfterVerify: fiAllowEditAfterVerify ? 'Y' : 'N',
                FinYear: finYear || '',
                DataBaseLocation_Code: 0
            }],
            Details: details
        };

        showFiLoader();
        $('#btnFiSaveAll').prop('disabled', true);

        return FreightInvoiceService.SaveFreightInvoice(payload).then(function (response) {
        const status = String(response.Status || response.status || '').toLowerCase();
        const msg = response.Msg || response.msg || 'Freight invoice saved.';
        if (status === 'success') {
            toastr.success(msg);
            fiEditMasterCode = 0;
            fiAllowEditAfterVerify = false;
            $('#dvFiEntry').removeClass('fi-entry-visible');
            $('#dvFiList').removeClass('fi-list-hidden');
            const fromDate = $('#txtFiListFromDate').val();
            const toDate = $('#txtFiListToDate').val();
            return reloadFiSavedListData(fromDate, toDate);
        }
        toastr.warning(msg || 'Save failed.');
        return Promise.reject({ handled: true });
    }).catch(function (error) {
        if (!(error && error.handled)) {
            console.error('SaveFreightInvoice failed:', error);
            toastr.error('Error saving freight invoice.');
        }
        return Promise.reject(error);
        }).finally(function () {
            hideFiLoader();
            updateFiSaveForTransporter();
        });
    }).catch(function (error) {
        if (!(error && error.handled)) {
            toastr.error('Permission check failed.');
        }
        return Promise.reject(error);
    });
}

/** Save All button — pehle validate, phir save */
function onSaveAllClick() {
    const details = validateFreightData();
    if (!details) return;
    saveFreightData(details);
}

// =============================================================================
// PAGE INIT — default dates, buttons, filter load
// =============================================================================

function initFreightInvoicePage() {
    buildFreightGridHeader();
    const dates = getDefaultFiDateRange();
    $('#txtFiFromDate').val(dates.from);
    $('#txtFiToDate').val(dates.to);
    $('#txtFiListFromDate').val(dates.from);
    $('#txtFiListToDate').val(dates.to);

    $('#FreightInvoicePage')
        .on('click', '#btnFiNew', openNewFreightEntry)
        .on('click', '#btnFiBackToList', showFiListView)
        .on('click', '#btnFiListRefresh', loadFiSavedList)
        .on('click', '#btnFiShow', showFreightData)
        .on('click', '#btnFiSaveAll', onSaveAllClick)
        .on('click', '#table-body-FiSavedList .js-fi-view', function () {
            viewFiSavedEntry(parseInt($(this).data('code') || '0', 10) || 0);
        })
        .on('click', '#table-body-FiSavedList .js-fi-edit', function () {
            editFiSavedEntry(parseInt($(this).data('code') || '0', 10) || 0);
        })
        .on('click', '#table-body-FiSavedList .js-fi-verify', function () {
            openFiVerifyConfirm(parseInt($(this).data('code') || '0', 10) || 0);
        })
        .on('click', '#table-body-FiSavedList .js-fi-approve', function () {
            openFiApproveConfirm(parseInt($(this).data('code') || '0', 10) || 0);
        })
        .on('click', '.js-fi-verified-tip', function (e) {
            e.preventDefault();
            showFiVerifiedTip(this);
        })
        .on('click', '.js-fi-approved-tip', function (e) {
            e.preventDefault();
            showFiApprovedTip(this);
        })
        .on('keydown', '.js-fi-verified-tip', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showFiVerifiedTip(this);
            }
        })
        .on('keydown', '.js-fi-approved-tip', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showFiApprovedTip(this);
            }
        })
        .on('input', '#txtFiListSearch', function () {
            filterFiSavedList(($(this).val() || '').toLowerCase().trim());
        })
        .on('change', '#ddlFiTransporter', onFiTransporterChange)
        .on('change', '#chkFiSelectAll', function () {
            if (this.disabled) return;
            const checked = $(this).prop('checked');
            $('#tblFreightInvoice tbody .fi-row-select').prop('checked', checked);
            $(this).prop('indeterminate', false);
        })
        .on('change', '#tblFreightInvoice tbody .fi-row-select', syncSelectAllCheckbox)
        .on('click', '#tblFreightInvoice thead th.fi-sortable', onFiGridHeaderSortClick);

    $('#btnFiVerifyConfirm').on('click', doFiConfirmAction);
    $('#btnFiVerifyCancel').on('click', closeFiConfirmModal);

    resolveFiModuleRights().finally(function () {
        loadFiSavedList();
    });
}

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    if (!$('#ERPHeading').text()) $('#ERPHeading').text('Freight Invoice');
    initFreightInvoicePage();
});
