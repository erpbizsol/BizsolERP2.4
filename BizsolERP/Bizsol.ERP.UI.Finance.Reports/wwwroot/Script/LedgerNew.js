import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { DateRangeControl } from '../../Bizsol.WebERP.UI.Shared/components/DateRangeControl/DateRangeControl.js';
import '../../Bizsol.WebERP.UI.Shared/components/FilterSidePanelControl/FilterSidePanelControl.js';
import { LedgerService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/LedgerService.js';
import { CompanyInformationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CompanyInformationService.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

// Global cache for account list response
let G_ddlAccountList = [];
let fromDate = '0';
let toDate = '0';

let G_RawLedgerData = [];
let G_IsDataLoaded = false;

const LEDGER_INTERNAL_HIDDEN_KEYS = [
    'Code', 'MasterTableCode', 'MasterTableName', 'TableName', 'VoucherMaster_Code',
    'VoucherTableName', 'HasAttachment', 'IsAttached', 'CanShow', 'CanEdit', 'CanAttach',
    '_ledgerRowIndex', 'RowSequence', 'View Total'
];

// Grid columns that should never be shown on LedgerNew (matched by normalized column name).
const LEDGER_ALWAYS_HIDDEN_EXACT = ['show', 'edit', 'attachment', 'attached'];
const LEDGER_ALWAYS_HIDDEN_PATTERNS = ['monthstotal', 'monthtotal', 'monthdebit', 'monthcredit', 'advanceamount', 'partyname'];

function isLedgerAlwaysHiddenColumn(colKey) {
    const n = normalizeLedgerColKey(colKey);
    return LEDGER_ALWAYS_HIDDEN_EXACT.includes(n)
        || LEDGER_ALWAYS_HIDDEN_PATTERNS.some(p => n === p || n.endsWith(p));
}

// Remove columns from row objects before grid render. hiddenColumns alone is not enough because
// Filter.js renders NumericFilterColumn headers before it checks hiddenColumns.
function stripAlwaysHiddenLedgerColumns(row) {
    if (!row || typeof row !== 'object') return row;
    const out = {};
    Object.keys(row).forEach(function (key) {
        if (!isLedgerAlwaysHiddenColumn(key)) {
            out[key] = row[key];
        }
    });
    return out;
}
function initFilterSidePanelControl() {
    console.log('Initializing FilterSidePanelControl...');

    const filterPanel = document.getElementById('filterPanel');
    if (!filterPanel) {
        console.error('FilterSidePanelControl element not found! Make sure <filter-side-panel-control id="filterPanel"> is in the HTML.');
        return;
    }

    console.log('FilterSidePanelControl found:', filterPanel);

    // Wait for the component to be fully defined
    if (!customElements.get('filter-side-panel-control')) {
        console.warn('filter-side-panel-control not yet defined, waiting...');
        customElements.whenDefined('filter-side-panel-control').then(() => {
            console.log('filter-side-panel-control now defined, continuing initialization...');
            initFilterSidePanelControl();
        });
        return;
    }

    // Initialize with empty filters first
    const filters = [
        { id: 'dateRange', type: 'daterange', label: 'Date Range' },
        { id: 'ddlAccountList', type: 'select', label: 'Account', data: [], placeholder: 'Search and select account...' },
    ];

    console.log('Setting filters:', filters);
    filterPanel.setFilters(filters);

    // Toggle grid columns instantly when a "Show ..." checkbox above the grid is changed (no re-fetch needed)
    attachColumnToggleListeners();
    attachLedgerActionButtonListeners();

    // Set default date range to financial year (from FY start to current date)
    setTimeout(() => {
        console.log('Setting default date range...');
        try {
            const dateRangeEl = filterPanel.shadowRoot?.getElementById('dateRange');
            if (dateRangeEl) {
                const now = new Date();
                const month = now.getMonth() + 1;
                const year = now.getFullYear();
                const fyStartYear = (month >= 4) ? year : (year - 1);
                const fyFrom = fyStartYear + '-04-01';
                // Set FyTo to current date instead of financial year end
                const fyTo = now.toISOString().slice(0, 10);

                console.log(`Setting financial year range: ${fyFrom} to ${fyTo} (current date)`);
                dateRangeEl.setRange({ fromDate: fyFrom, toDate: fyTo });
                fromDate = fyFrom;
                toDate = fyTo;
                console.log('Date range set successfully');
            } else {
                console.warn('DateRange element not found in shadow DOM');
            }
        } catch (e) {
            console.error('Failed to set default date range:', e);
        }
    }, 500);

    // Listen to filter apply event
    filterPanel.addEventListener('filtersapplied', (e) => {
        console.log('Filters applied event received:', e.detail);
        const filters = e.detail.filters;

        // Update global date variables
        if (filters.dateRange) {
            fromDate = filters.dateRange.fromDate || '0';
            toDate = filters.dateRange.toDate || '0';
            console.log(`Updated global date range: ${fromDate} to ${toDate}`);
        }

        // Load raw data and then show the report (refresh all tabs)
        console.log('Calling LoadRawLedgerData...');
        LoadRawLedgerData().then(() => {
            LedgerNew_ShowReport(true); // true = refresh all tabs
        });
    });

    console.log('FilterSidePanelControl initialized, loading dropdowns...');
    // Load dropdown data
    loadFilterDropdowns(filterPanel);
}
function loadFilterDropdowns(filterPanel) {
    // Create an array to track all promises
    const loadPromises = [];

    // Load Account List with mode DDL_ACCOUNTLIST
    const accountListPromise = LedgerService.GetLedgerData('DDL_ACCOUNTLIST', '0', '0', '0').then(function (response) {
        if (response && response.length > 0) {
            G_ddlAccountList = response.slice();
            const data = response.map(item => ({ Code: item.Code, Desp: item.AccountDesp || item.Desp || item.Description }));
            filterPanel.updateFilterData('ddlAccountList', data);
        }
    }).catch(function (error) {
        console.error('Error fetching account list:', error);
    });
    loadPromises.push(accountListPromise);

    // Wait for all dropdowns to load
    Promise.all(loadPromises).then(function () {
        console.log('All filter dropdowns loaded successfully');
    }).catch(function (error) {
        console.error('Error loading one or more filter dropdowns:', error);
    });
}
function GetAllFilters() {
    const filterPanel = document.getElementById('filterPanel');
    if (!filterPanel) {
        console.warn('FilterSidePanelControl not found - using fallback values');
        return {
            accountCodes: '0',
            fromDate: fromDate,
            toDate: toDate
        };
    }

    try {
        const filterValues = filterPanel.getFilterValues();
        console.log('Filter values from control:', filterValues);

        const accountValue = filterValues.ddlAccountList;
        const accountCodes = (typeof accountValue === 'object' && accountValue !== null)
            ? (accountValue.joined || '0')
            : (accountValue || '0');

        const filters = {
            accountCodes: accountCodes,
            fromDate: filterValues.dateRange?.fromDate || fromDate || '0',
            toDate: filterValues.dateRange?.toDate || toDate || '0'
        };

        console.log('Processed filters:', filters);
        return filters;
    } catch (e) {
        console.error('Error getting filter values:', e);
        return {
            accountCodes: '0',
            fromDate: fromDate,
            toDate: toDate
        };
    }
}
function isLedgerNullish(value) {
    if (value === null || value === undefined) return true;
    const s = String(value).trim();
    return s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined';
}
function isLedgerNumericColumn(key) {
    const n = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
    return /amount|debit|credit|balance|total|running|qty|quantity|rate|tax|opening|closing/.test(n);
}
function isLedgerDateColumn(key) {
    const n = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
    return n.includes('date');
}
function parseLedgerDateValue(value) {
    if (isLedgerNullish(value)) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;

    const s = String(value).trim();
    const iso = Date.parse(s);
    if (!isNaN(iso)) return new Date(iso);

    // dd/mm/yyyy or dd-mm-yyyy
    const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmy) {
        const dt = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
        return isNaN(dt.getTime()) ? null : dt;
    }
    return null;
}
function formatLedgerCellDate(value) {
    const dt = parseLedgerDateValue(value);
    if (!dt) return isLedgerNullish(value) ? '' : String(value).trim();
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}
function formatLedgerRowDates(item) {
    const out = Object.assign({}, item);
    Object.keys(out).forEach(function (key) {
        if (isLedgerDateColumn(key)) {
            out[key] = formatLedgerCellDate(out[key]);
        }
    });
    return out;
}
function sanitizeLedgerCellValue(key, value) {
    if (isLedgerNullish(value)) {
        return isLedgerNumericColumn(key) ? 0 : '';
    }
    if (isLedgerNumericColumn(key)) {
        const num = parseFloat(value);
        if (!isNaN(num) && isFinite(num)) {
            return num;
        }
        return 0;
    }
    return value;
}
function sanitizeLedgerRow(item) {
    if (!item || typeof item !== 'object') return item;
    const out = {};
    Object.keys(item).forEach(function (key) {
        out[key] = sanitizeLedgerCellValue(key, item[key]);
    });
    return out;
}
function sanitizeLedgerRows(rows) {
    return (rows || []).map(sanitizeLedgerRow);
}

async function LoadRawLedgerData() {
    const filters = GetAllFilters();
    const selectedAccounts = filters.accountCodes;

    if (!selectedAccounts || selectedAccounts === '' || selectedAccounts === '0') {
        console.warn('No accounts selected, skipping data load');
        G_RawLedgerData = [];
        G_IsDataLoaded = false;
        clearAllTabs();
        return;
    }

    console.log('Loading raw ledger data...');
    console.log('Filters:', { accounts: selectedAccounts, from: filters.fromDate, to: filters.toDate });
    Showloader();

    try {
        const response = await LedgerService.GetLedgerData(
            'SHOW_INGRID',
            selectedAccounts,
            filters.fromDate,
            filters.toDate
        );

        HideLoader();

        if (response && Array.isArray(response) && response.length > 0) {
            G_RawLedgerData = sanitizeLedgerRows(response);
            G_IsDataLoaded = true;
            console.log(`Loaded ${G_RawLedgerData.length} raw data records`);
        } else {
            console.warn('No raw data received from API');
            G_RawLedgerData = [];
            G_IsDataLoaded = false;
            clearAllTabs();
        }
    } catch (error) {
        HideLoader();
        console.error('Error loading raw ledger data:', error);
        G_RawLedgerData = [];
        G_IsDataLoaded = false;
        clearAllTabs();
    }
}
function clearAllTabs() {
    console.log('Clearing all tabs - no data available');
    updateLedgerViewState(false);
}
function updateLedgerViewState(hasData) {
    const emptyEl = document.getElementById('ledgerEmptyState');
    const gridEl = document.getElementById('ledgerGridArea');
    const bannerEl = document.getElementById('ledgerStatusBanner');

    if (emptyEl) {
        emptyEl.classList.toggle('is-hidden', !!hasData);
    }
    if (gridEl) {
        gridEl.classList.toggle('is-hidden', !hasData);
    }
    if (bannerEl) {
        bannerEl.classList.toggle('is-loaded', !!hasData);
    }
}
function LedgerNew_ShowReport(refreshAll = false) {
    console.log('Showing report...', refreshAll ? '(refreshing all tabs)' : '');

    // Update date range display
    updateLedgerBannerDisplay();

    // Render the ledger data grid
    if (G_IsDataLoaded && G_RawLedgerData.length > 0) {
        renderLedgerGrid();
    } else {
        clearAllTabs();
    }
}
function normalizeLedgerColKey(name) {
    return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
}
function buildLedgerGridOptions(gridData) {
    const columns = gridData && gridData.length > 0 ? Object.keys(gridData[0]) : [];

    const ColumnAlignment = {};
    const NumericFilterColumn = [];
    const TotalColumns = [];
    const FixedDecimalvalue = {};
    const CommaColumns = [];

    const numericPatterns = [
        'debitamount',
        'creditamount',
        'accountwiserunningbalance',
        'runningbalance'
    ];

    columns.forEach(function (col) {
        if (isLedgerAlwaysHiddenColumn(col)) {
            return;
        }

        const n = normalizeLedgerColKey(col);
        const isNumericCol = numericPatterns.some(function (p) {
            return n === p || (n.endsWith(p) && !n.includes('show') && !n.includes('edit'));
        });

        if (isNumericCol) {
            ColumnAlignment[col] = 'right';
            NumericFilterColumn.push(col);
            TotalColumns.push(col);
            FixedDecimalvalue[col] = 2;
            CommaColumns.push(col);
        }
    });

    return { ColumnAlignment, NumericFilterColumn, TotalColumns, FixedDecimalvalue, CommaColumns };
}

function renderLedgerGrid() {
    console.log('Rendering ledger grid with', G_RawLedgerData.length, 'records');

    // Clear existing table
    //$('#tblLedgerDataHeader').empty();
    //$('#tblLedgerDataBody').empty();
    //$('#paginator-tblLedgerDataBody').empty();

    if (!G_RawLedgerData || G_RawLedgerData.length === 0) {
        console.warn('No data to render in grid');
        return;
    }

    // Build grid rows (always-hidden columns are stripped before render)
    const gridData = mapLedgerRowsForGrid(G_RawLedgerData);

    // Define filter columns - adjust based on your data structure
    const StringFilterColumn = ["AccountDesp","Voucher Type"];
    const hiddenColumns = getLedgerHiddenColumns();
    const gridOpts = buildLedgerGridOptions(gridData);
    const NumericFilterColumn = gridOpts.NumericFilterColumn;
    const DateFilterColumn = ["Record Date"];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = ["Bill No"];

    // Use BizsolCustomFilterGrid to create the data table
    BizsolCustomFilterGrid.CreateDataTable(
        "tblLedgerDataHeader",
        "tblLedgerDataBody",
        gridData,
        Button,
        showButtons,
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        gridOpts.ColumnAlignment,
        true,
        gridOpts.TotalColumns,
        gridOpts.FixedDecimalvalue,
        gridOpts.CommaColumns
    );

    updateLedgerViewState(true);
    applyColumnVisibilityToGrid();
    console.log('Ledger grid rendered successfully');
}

// Pick the first non-empty field from a ledger row (handles varying API property names).
function pickLedgerField(item, keys) {
    if (!item) return '';
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== '' && String(item[k]).toLowerCase() !== 'null') {
            return item[k];
        }
    }
    return '';
}

function ledgerRowHasAttachment(item) {
    const flag = pickLedgerField(item, ['HasAttachment', 'IsAttached', 'Attachment', 'HasDocument']);
    if (flag === '' || flag === undefined || flag === null) return false;
    const s = String(flag).trim().toUpperCase();
    return s === 'Y' || s === 'YES' || s === '1' || s === 'TRUE' || s === 'ATTACHED';
}

function ledgerCanShowRow(item) {
    const canShow = pickLedgerField(item, ['CanShow']);
    if (canShow !== '') {
        const s = String(canShow).trim().toUpperCase();
        if (s === 'N' || s === 'NO' || s === '0') return false;
    }
    const voucherType = String(pickLedgerField(item, ['VoucherType', 'Voucher Type']) || '').trim().toLowerCase();
    if (!voucherType || voucherType === 'opening') return false;
    const code = pickLedgerField(item, ['MasterTableCode', 'Code', 'VoucherMaster_Code', 'VoucherCode']);
    return code !== '' && code !== 0 && code !== '0';
}

function ledgerCanEditRow(item) {
    const canEdit = pickLedgerField(item, ['CanEdit']);
    if (canEdit !== '') {
        const s = String(canEdit).trim().toUpperCase();
        return s === 'Y' || s === 'YES' || s === '1' || s === 'TRUE';
    }
    return ledgerCanShowRow(item);
}

function buildLedgerActionLink(label, onclick, cssClass) {
    const cls = cssClass ? ` ${cssClass}` : '';
    return `<a href="javascript:void(0)" class="ledger-action-link${cls}" onclick="${onclick}">&lt;&lt;${label}&gt;&gt;</a>`;
}

function buildVoucherPayloadFromRow(item) {
    return {
        Code: pickLedgerField(item, ['Code', 'MasterTableCode', 'VoucherMaster_Code', 'VoucherCode']),
        MasterTableCode: pickLedgerField(item, ['MasterTableCode', 'Code', 'VoucherMaster_Code', 'VoucherCode']),
        MasterTableName: pickLedgerField(item, ['MasterTableName', 'TableName', 'VoucherTableName']),
        VoucherType: pickLedgerField(item, ['VoucherType', 'Voucher Type']),
        VoucherNo: pickLedgerField(item, ['VoucherNo', 'Voucher No']),
        EntryNo: pickLedgerField(item, ['EntryNo', 'Entry No']),
        RecordDate: pickLedgerField(item, ['RecordDate', 'Record Date'])
    };
}

function findLedgerEntryNoColumn(keys) {
    return (keys || []).find(function (col) {
        const n = normalizeLedgerColKey(col);
        return n === 'entryno' || n === 'entrynumber';
    });
}

function orderLedgerRowColumns(row) {
    const dataKeys = Object.keys(row);
    const entryNoKey = findLedgerEntryNoColumn(dataKeys);
    const ordered = {};

    if (entryNoKey) {
        ordered[entryNoKey] = row[entryNoKey];
    }
    dataKeys.forEach(function (k) {
        if (k !== entryNoKey) {
            ordered[k] = row[k];
        }
    });
    return ordered;
}

function mapLedgerRowsForGrid(rows) {
    return sanitizeLedgerRows(rows).map(function (item, index) {
        const displayItem = formatLedgerRowDates(item);
        const row = stripAlwaysHiddenLedgerColumns(Object.assign({}, displayItem, {
            _ledgerRowIndex: index
        }));
        return orderLedgerRowColumns(row);
    });
}

function getLedgerCheckboxOptions() {
    const isChecked = (id) => {
        const el = document.getElementById(id);
        return !!(el && el.checked);
    };
    return {
        showNarration: isChecked('showNarration'),
        showEntryNo: isChecked('showEntryNo'),
        showVoucherNo: isChecked('showVoucherNo'),
        showBillNo: isChecked('showBillNo'),
        showGSTNo: false,
        showMonthTotal: false,
        showRefNo: false
    };
}

function openCrystalReportUrl(response) {
    const url = LedgerService.extractCrystalUrl(response);
    if (!url) {
        return false;
    }
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    return true;
}

function findLedgerColumnKey(row, patterns) {
    if (!row) return '';
    const keys = Object.keys(row);
    for (let i = 0; i < keys.length; i++) {
        const n = normalizeLedgerColKey(keys[i]);
        if (patterns.some(function (p) { return n === p || n.includes(p); })) {
            return keys[i];
        }
    }
    return '';
}

function getLedgerRowField(row, patterns) {
    const key = findLedgerColumnKey(row, patterns);
    if (!key) return '';
    const val = row[key];
    if (isLedgerNullish(val)) return '';
    return val;
}

function formatLedgerPreviewAmount(value) {
    const num = parseFloat(value);
    if (isNaN(num) || !isFinite(num)) return '0.00';
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ledgerPreviewRowKind(row) {
    const particulars = getLedgerRowField(row, ['particulars']);
    const accountDesp = getLedgerPreviewAccountDesp(row);
    const voucherType = getLedgerRowField(row, ['vouchertype']);
    const labels = [particulars, accountDesp, voucherType].map(function (v) {
        return String(v || '').trim().toLowerCase();
    });
    if (labels.some(function (p) { return p === 'opening balance' || p.indexOf('opening balance') === 0; })) {
        return 'opening';
    }
    if (labels.some(function (p) { return p === 'closing balance' || p.indexOf('closing balance') === 0; })) {
        return 'closing';
    }
    return 'entry';
}

function buildLedgerPreviewClosingRowHtml(debit, credit, balanceAmount, drCr) {
    return '<tr class="row-closing">'
        + '<td></td><td></td>'
        + '<td class="closing-label">Closing Balance</td>'
        + `<td class="num">${formatLedgerPreviewAmount(debit)}</td>`
        + `<td class="num">${formatLedgerPreviewAmount(credit)}</td>`
        + buildLedgerPreviewBalanceCell(balanceAmount, drCr)
        + '</tr>';
}

function escapeLedgerPreviewHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function findExactLedgerColumnKey(row, exactPatterns) {
    if (!row) return '';
    const keys = Object.keys(row);
    for (let i = 0; i < keys.length; i++) {
        const n = normalizeLedgerColKey(keys[i]);
        if (exactPatterns.some(function (p) { return n === p; })) {
            return keys[i];
        }
    }
    return '';
}

function getLedgerRowFieldExact(row, exactPatterns) {
    const key = findExactLedgerColumnKey(row, exactPatterns);
    if (!key) return '';
    const val = row[key];
    if (isLedgerNullish(val)) return '';
    return val;
}

function normalizeLedgerDrCrValue(value) {
    const s = String(value || '').trim().toUpperCase();
    if (!s) return '';
    if (s.startsWith('CR') || s === 'C') return 'Cr';
    if (s.startsWith('DR') || s === 'D') return 'Dr';
    return String(value).trim();
}

function getLedgerPreviewDrCrFromSigned(signedRunning) {
    if (signedRunning < 0) return 'Cr';
    if (signedRunning > 0) return 'Dr';
    return '';
}

function getLedgerPreviewBalanceAmount(row, signedRunning) {
    const apiBal = parseFloat(getLedgerRowField(row, ['accountwiserunningbalance', 'runningbalance', 'balance']));
    if (!isNaN(apiBal)) return Math.abs(apiBal);
    return Math.abs(signedRunning);
}

function resolveOpeningSignedBalance(row) {
    const apiBal = parseFloat(getLedgerRowField(row, ['accountwiserunningbalance', 'runningbalance', 'balance']));
    const amount = isNaN(apiBal) ? 0 : apiBal;
    const explicit = normalizeLedgerDrCrValue(
        getLedgerRowFieldExact(row, ['drcr', 'drorcr', 'balancetype', 'runningbalancedrcr'])
    );
    if (explicit === 'Cr') return -Math.abs(amount);
    if (explicit === 'Dr') return Math.abs(amount);
    if (amount < 0) return amount;
    return Math.abs(amount);
}

function buildLedgerPreviewBodyRowHtmlList(rows) {
    let signedRunning = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    let hasClosing = false;
    const list = [];

    (rows || []).forEach(function (row) {
        const kind = ledgerPreviewRowKind(row);
        const debit = parseFloat(getLedgerRowField(row, ['debitamount', 'debit'])) || 0;
        const credit = parseFloat(getLedgerRowField(row, ['creditamount', 'credit'])) || 0;

        if (kind === 'opening') {
            signedRunning = resolveOpeningSignedBalance(row);
        } else if (kind === 'closing') {
            hasClosing = true;
        } else {
            signedRunning += debit - credit;
            totalDebit += debit;
            totalCredit += credit;
        }

        const balanceAmount = getLedgerPreviewBalanceAmount(row, signedRunning);
        const drCr = getLedgerPreviewDrCrFromSigned(signedRunning);
        list.push(buildLedgerPreviewRowHtml(row, balanceAmount, drCr, kind));
    });

    if (!hasClosing && list.length > 0) {
        list.push(buildLedgerPreviewClosingRowHtml(
            totalDebit,
            totalCredit,
            Math.abs(signedRunning),
            getLedgerPreviewDrCrFromSigned(signedRunning)
        ));
    }

    return list;
}

const LEDGER_PREVIEW_COLS = 6;
const LEDGER_PREVIEW_ROWS_PER_PAGE = 28;

function buildLedgerPreviewStackedCell(top, bottom) {
    const topHtml = escapeLedgerPreviewHtml(top);
    const bottomHtml = escapeLedgerPreviewHtml(bottom);
    if (topHtml && bottomHtml) {
        return `<span class="stack-top">${topHtml}</span><span class="stack-bottom">${bottomHtml}</span>`;
    }
    if (topHtml) return `<span class="stack-top">${topHtml}</span>`;
    if (bottomHtml) return `<span class="stack-bottom">${bottomHtml}</span>`;
    return '';
}

function buildLedgerPreviewBalanceText(balance, drCr) {
    const amt = formatLedgerPreviewAmount(balance);
    const suffix = drCr ? ' ' + String(drCr).trim() : '';
    return amt + suffix;
}

function buildLedgerPreviewBalanceCell(balance, drCr) {
    return `<td class="num num-bal">${buildLedgerPreviewBalanceText(balance, drCr)}</td>`;
}

function getLedgerPreviewAccountDesp(row) {
    const accountDesp = getLedgerRowField(row, ['accountdesp', 'accountdesc', 'accountdescription']);
    if (accountDesp) return accountDesp;
    return getLedgerRowField(row, ['particulars']);
}

function buildLedgerPreviewParticularsCell(accountDesp, narration, showDocAttached) {
    let html = '';
    if (accountDesp) {
        html += `<span class="acct-name">${escapeLedgerPreviewHtml(accountDesp)}</span>`;
    }
    if (showDocAttached) {
        html += '<span class="narr-text">DocAttached</span>';
    }
    const narrText = String(narration || '').trim();
    const acctText = String(accountDesp || '').trim();
    if (narrText && narrText.toLowerCase() !== acctText.toLowerCase()) {
        html += `<span class="narr-text">${escapeLedgerPreviewHtml(narration)}</span>`;
    }
    return html || '&nbsp;';
}

function buildLedgerPreviewTableHead() {
    return `<thead>
                <tr class="hdr-main">
                    <th><span class="hdr-line">Date</span><span class="hdr-line hdr-sub">VR No.</span></th>
                    <th><span class="hdr-line">VR Type</span><span class="hdr-line hdr-sub">Entry/Bill No</span></th>
                    <th>Particulars</th>
                    <th>Debit (Rs)</th>
                    <th>Credit (Rs)</th>
                    <th>Balance</th>
                </tr>
            </thead>`;
}

function buildLedgerPreviewRowHtml(row, balanceAmount, drCr, kindOverride) {
    const particulars = getLedgerRowField(row, ['particulars']);
    const accountDesp = getLedgerPreviewAccountDesp(row);
    const kind = kindOverride || ledgerPreviewRowKind(row);
    const recordDate = formatLedgerCellDate(getLedgerRowField(row, ['recorddate', 'date']));
    const voucherType = getLedgerRowField(row, ['vouchertype']);
    const voucherNo = getLedgerRowField(row, ['voucherno', 'vouchernumber']);
    const entryNo = getLedgerRowField(row, ['entryno', 'entrynumber']);
    const billNo = getLedgerRowField(row, ['billno', 'billnumber']);
    const narration = getLedgerRowField(row, ['narration']);
    const debit = parseFloat(getLedgerRowField(row, ['debitamount', 'debit'])) || 0;
    const credit = parseFloat(getLedgerRowField(row, ['creditamount', 'credit'])) || 0;
    const hasAttachment = ledgerRowHasAttachment(row);
    const vrNo = entryNo || voucherNo;
    const entryBillNo = billNo || '';

    if (kind === 'opening') {
        return '<tr class="row-opening">'
            + `<td>${escapeLedgerPreviewHtml(recordDate)}</td>`
            + '<td></td>'
            + `<td>${escapeLedgerPreviewHtml(particulars || 'Opening Balance')}</td>`
            + '<td></td><td></td>'
            + buildLedgerPreviewBalanceCell(balanceAmount, drCr)
            + '</tr>';
    }

    if (kind === 'closing') {
        return buildLedgerPreviewClosingRowHtml(debit, credit, balanceAmount, drCr);
    }

    return '<tr class="row-entry">'
        + `<td class="cell-stack">${buildLedgerPreviewStackedCell(recordDate, vrNo)}</td>`
        + `<td class="cell-stack">${buildLedgerPreviewStackedCell(voucherType, entryBillNo)}</td>`
        + `<td class="cell-part">${buildLedgerPreviewParticularsCell(accountDesp, narration, hasAttachment)}</td>`
        + `<td class="num">${debit > 0 ? formatLedgerPreviewAmount(debit) : ''}</td>`
        + `<td class="num">${credit > 0 ? formatLedgerPreviewAmount(credit) : ''}</td>`
        + buildLedgerPreviewBalanceCell(balanceAmount, drCr)
        + '</tr>';
}

function buildLedgerPreviewPages(bodyRowHtmlList, fromLabel, toLabel, companyName, companyAddress, partyName) {
    const dataRows = (bodyRowHtmlList || []).slice();
    let closingRow = '';
    const lastRow = dataRows[dataRows.length - 1] || '';
    if (lastRow.indexOf('row-closing') !== -1) {
        closingRow = dataRows.pop();
    }

    const pages = [];
    for (let i = 0; i < dataRows.length; i += LEDGER_PREVIEW_ROWS_PER_PAGE) {
        pages.push(dataRows.slice(i, i + LEDGER_PREVIEW_ROWS_PER_PAGE).join(''));
    }
    if (!pages.length) pages.push('');

    return pages.map(function (pageRows, index) {
        const pageNum = index + 1;
        const isLastPage = index === pages.length - 1;
        const tbodyHtml = isLastPage && closingRow ? pageRows + closingRow : pageRows;
        return `<div class="a4-page">
            <div class="page-content">
            <div class="report-header">
                <p class="company-name">${companyName || '&nbsp;'}</p>
                <p class="company-address">${companyAddress || '&nbsp;'}</p>
                <p class="party-name">${partyName}</p>
                <p class="date-range">Ledger From ${fromLabel} To ${toLabel}</p>
            </div>
            <div class="ledger-table-wrap">
            <table class="ledger-table">
                <colgroup>
                    <col class="col-date-vr" />
                    <col class="col-type-bill" />
                    <col class="col-part" />
                    <col class="col-debit" />
                    <col class="col-credit" />
                    <col class="col-bal" />
                </colgroup>
                ${buildLedgerPreviewTableHead()}
                <tbody>${tbodyHtml}</tbody>
            </table>
            </div>
            </div>
            <div class="page-footer">
                <span class="page-num">${pageNum}</span>
                <span class="page-footer-text">BizSol ERP (BIZARCHIT)</span>
            </div>
        </div>`;
    }).join('');
}

function buildLedgerPrintPreviewHtml(companyInfo) {
    const filters = GetAllFilters();
    const partyName = escapeLedgerPreviewHtml(getLedgerPartyDisplayName());
    const companyName = escapeLedgerPreviewHtml(pickCompanyPreviewField(companyInfo, ['CompanyName', 'companyName', 'CompanyNameForShow', 'companyNameForShow']));
    const companyAddress = escapeLedgerPreviewHtml(pickCompanyPreviewField(companyInfo, ['OfficeAddress1', 'officeAddress1', 'OfficeAddress', 'CompanyAddress', 'companyAddress', 'Address']));
    const fromLabel = escapeLedgerPreviewHtml(formatLedgerCellDate(filters.fromDate));
    const toLabel = escapeLedgerPreviewHtml(formatLedgerCellDate(filters.toDate));
    const rows = G_RawLedgerData || [];
    const bodyRowHtmlList = buildLedgerPreviewBodyRowHtmlList(rows);
    const pagesHtml = buildLedgerPreviewPages(bodyRowHtmlList, fromLabel, toLabel, companyName, companyAddress, partyName);

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Ledger Preview</title>
<style>
    @page {
        size: A4 portrait;
        margin: 10mm 8mm 14mm 8mm;
    }

    * { box-sizing: border-box; }

    html, body {
        margin: 0;
        padding: 0;
        background: #d1d5db;
    }

    body {
        padding: 10mm 0 14mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12mm;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 8pt;
        color: #000;
    }

    .a4-page {
        width: 210mm;
        min-height: 297mm;
        background: #fff;
        padding: 10mm 10mm 8mm;
        box-shadow: 0 4px 24px rgba(15, 23, 42, 0.18);
        position: relative;
        page-break-after: always;
        break-after: page;
        display: flex;
        flex-direction: column;
    }

    .page-content {
        flex: 1 1 auto;
        min-width: 0;
    }

    .ledger-table-wrap {
        width: 100%;
        max-width: 100%;
    }

    .a4-page:last-child {
        page-break-after: auto;
        break-after: auto;
    }

    .report-header {
        text-align: center;
        margin-bottom: 10px;
        line-height: 1.4;
    }
    .company-name {
        font-size: 12pt;
        font-weight: 700;
        margin: 0 0 3px;
        text-transform: uppercase;
        letter-spacing: 0.01em;
    }
    .company-address {
        font-size: 8pt;
        margin: 0 0 6px;
        line-height: 1.3;
        word-wrap: break-word;
        overflow-wrap: anywhere;
    }
    .party-name {
        font-size: 9.5pt;
        font-weight: 700;
        margin: 0 0 3px;
        text-transform: uppercase;
        line-height: 1.3;
    }
    .date-range {
        font-size: 8pt;
        margin: 0 0 10px;
        font-weight: 400;
    }

    .ledger-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 8pt;
        border: 1px solid #000;
    }
    .ledger-table th {
        border: 1px solid #000;
        border-top: 2px solid #000;
        border-bottom: 2px solid #000;
        padding: 5px 4px;
        vertical-align: middle;
        word-wrap: break-word;
        overflow-wrap: anywhere;
        line-height: 1.25;
        font-weight: 700;
        text-align: center;
        font-size: 8pt;
        background: #fff;
    }
    .ledger-table td {
        border-left: 1px solid #000;
        border-right: 1px solid #000;
        border-top: none;
        border-bottom: none;
        padding: 4px 4px;
        vertical-align: top;
        word-wrap: break-word;
        overflow-wrap: anywhere;
        line-height: 1.4;
    }
    .ledger-table tbody tr.row-entry:last-of-type td {
        border-bottom: none;
    }
    .ledger-table tbody tr.row-closing td {
        border-bottom: 1px solid #000;
    }
    .ledger-table th .hdr-line {
        display: block;
    }
    .ledger-table th .hdr-sub {
        font-size: 7.5pt;
        margin-top: 2px;
        font-weight: 700;
    }

    .col-date-vr { width: 10%; }
    .col-type-bill { width: 13%; }
    .col-part { width: 36%; }
    .col-debit { width: 11%; }
    .col-credit { width: 14%; }
    .col-bal { width: 16%; }

    .cell-stack {
        text-align: center;
        font-size: 8pt;
        line-height: 1.35;
        padding-top: 4px;
        padding-bottom: 5px;
    }
    .cell-stack .stack-top {
        display: block;
        margin-bottom: 3px;
    }
    .cell-stack .stack-bottom {
        display: block;
        font-size: 7.5pt;
    }
    .cell-part {
        text-align: left;
        font-size: 8pt;
        padding-left: 6px;
        padding-top: 3px;
        padding-bottom: 3px;
        line-height: 1.15;
    }
    .acct-name {
        color: #000080;
        font-weight: 700;
        font-size: 8pt;
        display: block;
        margin: 0;
        line-height: 1.15;
    }
    .narr-text {
        color: #000;
        font-weight: 400;
        font-size: 7.5pt;
        display: block;
        margin: 0;
        line-height: 1.15;
    }
    .cell-part .acct-name + .narr-text {
        margin-top: 1px;
    }

    .num {
        text-align: right;
        white-space: nowrap;
        font-size: 8pt;
        padding-top: 4px;
        padding-right: 4px;
        padding-left: 2px;
        padding-bottom: 5px;
        vertical-align: top;
        color: #000;
    }
    .num-bal {
        color: #000;
        font-weight: 400;
    }
    .row-opening td {
        font-weight: 400;
        color: #000;
        font-size: 8pt;
        padding-top: 4px;
        padding-bottom: 5px;
    }
    .row-opening td:first-child {
        text-align: center;
    }
    .row-closing td {
        font-weight: 700;
        color: #000;
        font-size: 8pt;
        padding-top: 6px;
        padding-bottom: 6px;
        border-top: 1px solid #000;
        border-bottom: 1px solid #000;
        vertical-align: middle;
    }
    .row-closing td.closing-label {
        text-align: right;
        padding-right: 8px;
    }
    .row-closing td.num,
    .row-closing td.num-bal {
        font-weight: 700;
    }
    .row-entry td {
        min-height: 26px;
    }

    .page-footer {
        flex-shrink: 0;
        position: relative;
        margin-top: auto;
        padding-top: 6mm;
        min-height: 8mm;
        text-align: center;
        font-size: 8pt;
        color: #000;
        border-top: 1px solid #000;
    }

    .page-num {
        position: absolute;
        left: 0;
        top: 6mm;
        text-align: left;
        font-size: 8pt;
    }

    .page-footer-text {
        display: block;
        text-align: center;
        padding-top: 0;
        font-size: 8pt;
    }

    thead { display: table-header-group; }
    tr { page-break-inside: avoid; break-inside: avoid; }

    /* On-screen mobile: fit ledger to device width (print keeps A4 layout below) */
    @media screen and (max-width: 768px) {
        html, body {
            overflow-x: auto;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }

        body {
            display: block;
            width: 100%;
            max-width: 100%;
            padding: 6px 4px 12px;
            gap: 0;
            background: #e5e7eb;
        }

        .a4-page {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            min-height: auto;
            padding: 8px 4px 10px;
            margin: 0 auto 10px;
            box-shadow: 0 2px 10px rgba(15, 23, 42, 0.12);
        }

        .company-name { font-size: 10pt; }
        .party-name { font-size: 8.5pt; word-break: break-word; }
        .company-address, .date-range { font-size: 7pt; }

        .ledger-table { font-size: 6.5pt; }
        .ledger-table th {
            font-size: 6.5pt;
            padding: 3px 2px;
        }
        .ledger-table th .hdr-sub { font-size: 6pt; }
        .ledger-table td { padding: 3px 2px; }

        .col-date-vr { width: 11%; }
        .col-type-bill { width: 13%; }
        .col-part { width: 30%; }
        .col-debit { width: 12%; }
        .col-credit { width: 14%; }
        .col-bal { width: 20%; }

        .cell-stack { font-size: 6.5pt; padding-top: 2px; padding-bottom: 3px; }
        .cell-stack .stack-bottom { font-size: 6pt; }
        .cell-part { font-size: 6.5pt; padding-left: 3px; }
        .acct-name { font-size: 6.5pt; }
        .narr-text { font-size: 6pt; }

        .num {
            font-size: 6.5pt;
            white-space: normal;
            word-break: break-all;
            padding-right: 2px;
        }

        .row-opening td, .row-closing td { font-size: 6.5pt; }
        .page-footer { font-size: 7pt; padding-top: 4mm; min-height: 6mm; }
        .page-num, .page-footer-text { font-size: 7pt; }

        .ledger-table-wrap {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            max-width: 100%;
        }
    }

    @media screen and (max-width: 480px) {
        body { padding: 4px 2px 10px; }
        .a4-page { padding: 6px 2px 8px; }
        .ledger-table { font-size: 6pt; }
        .ledger-table th, .ledger-table td { padding: 2px 1px; }
        .col-part { width: 28%; }
        .col-bal { width: 22%; }
        .num { font-size: 6pt; }
    }

    @media print {
        html, body { background: #fff; padding: 0; display: block; }
        body { gap: 0; }
        .ledger-table-wrap { overflow: visible; }
        .a4-page {
            width: auto;
            min-height: auto;
            padding: 0;
            margin: 0;
            box-shadow: none;
        }
    }
</style>
</head>
<body>
    ${pagesHtml}
</body>
</html>`;
}

function pickCompanyPreviewField(companyInfo, keys) {
    if (!companyInfo) return '';
    if (Array.isArray(companyInfo) && companyInfo.length > 0) {
        companyInfo = companyInfo[0];
    }
    if (companyInfo.data && typeof companyInfo.data === 'object') {
        companyInfo = Array.isArray(companyInfo.data) ? companyInfo.data[0] : companyInfo.data;
    }
    if (companyInfo.Data && typeof companyInfo.Data === 'object') {
        companyInfo = Array.isArray(companyInfo.Data) ? companyInfo.Data[0] : companyInfo.Data;
    }
    for (let i = 0; i < keys.length; i++) {
        const val = companyInfo[keys[i]];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
            return String(val).trim();
        }
    }
    return '';
}

let G_LedgerPreviewHtml = '';

function ensureLedgerPreviewModalInBody() {
    const modal = document.getElementById('ledgerPreviewModal');
    if (modal && modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }
}

function showLedgerPreviewModal(html) {
    ensureLedgerPreviewModalInBody();
    const modal = document.getElementById('ledgerPreviewModal');
    const frame = document.getElementById('ledgerPreviewFrame');
    if (!modal || !frame) {
        return false;
    }
    G_LedgerPreviewHtml = html || '';
    frame.srcdoc = G_LedgerPreviewHtml;
    modal.classList.remove('is-hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ledger-preview-open');
    return true;
}

function closeLedgerPreviewModal() {
    const modal = document.getElementById('ledgerPreviewModal');
    const frame = document.getElementById('ledgerPreviewFrame');
    if (!modal) return;
    modal.classList.add('is-hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ledger-preview-open');
    G_LedgerPreviewHtml = '';
    if (frame) {
        frame.srcdoc = '';
    }
}

function printLedgerPreviewModal() {
    const frame = document.getElementById('ledgerPreviewFrame');
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.focus();
    frame.contentWindow.print();
}

function downloadLedgerPreviewModal() {
    if (!G_LedgerPreviewHtml) {
        if (typeof toastr !== 'undefined') toastr.warning('Nothing to download.');
        return;
    }
    const party = (getLedgerPartyDisplayName() || 'Ledger').replace(/[^\w\-]+/g, '_').slice(0, 40);
    const filters = GetAllFilters();
    const from = (filters.fromDate || 'from').replace(/[^\d\-]/g, '');
    const to = (filters.toDate || 'to').replace(/[^\d\-]/g, '');
    const fileName = `Ledger_${party}_${from}_${to}.html`;
    const blob = new Blob([G_LedgerPreviewHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function initLedgerPreviewModal() {
    ensureLedgerPreviewModalInBody();
    const btnClose = document.getElementById('btnLedgerPreviewClose');
    const btnPrint = document.getElementById('btnLedgerPreviewPrint');
    const btnDownload = document.getElementById('btnLedgerPreviewDownload');
    const backdrop = document.getElementById('ledgerPreviewBackdrop');

    if (btnClose && !btnClose._ledgerBound) {
        btnClose._ledgerBound = true;
        btnClose.addEventListener('click', closeLedgerPreviewModal);
    }
    if (btnPrint && !btnPrint._ledgerBound) {
        btnPrint._ledgerBound = true;
        btnPrint.addEventListener('click', printLedgerPreviewModal);
    }
    if (btnDownload && !btnDownload._ledgerBound) {
        btnDownload._ledgerBound = true;
        btnDownload.addEventListener('click', downloadLedgerPreviewModal);
    }
    if (backdrop && !backdrop._ledgerBound) {
        backdrop._ledgerBound = true;
        backdrop.addEventListener('click', closeLedgerPreviewModal);
    }
    if (!document._ledgerPreviewEscBound) {
        document._ledgerPreviewEscBound = true;
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeLedgerPreviewModal();
            }
        });
    }
}

function openLedgerPreviewHtml(html) {
    if (!html) {
        return false;
    }

    // In-page modal is the most reliable preview host (avoids about:blank popup issues).
    if (showLedgerPreviewModal(html)) {
        return true;
    }

    // Fallback: open fully rendered HTML via blob URL (do not use about:blank + document.write).
    let blobUrl = '';
    try {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        blobUrl = URL.createObjectURL(blob);
        const previewWin = window.open(blobUrl, '_blank');
        if (previewWin) {
            setTimeout(function () {
                URL.revokeObjectURL(blobUrl);
            }, 120000);
            return true;
        }
    } catch (err) {
        console.error('Ledger preview open failed:', err);
    }

    if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
    }
    return false;
}

function openLedgerHtmlPrintPreview() {
    if (!G_IsDataLoaded || !G_RawLedgerData.length) {
        if (typeof toastr !== 'undefined') toastr.warning('No ledger data available for preview.');
        return Promise.resolve(false);
    }

    const openPreview = function (companyInfo) {
        const html = buildLedgerPrintPreviewHtml(companyInfo || {});
        const opened = openLedgerPreviewHtml(html);
        if (!opened && typeof toastr !== 'undefined') {
            toastr.error('Could not open ledger preview.');
        }
        return opened;
    };

    return CompanyInformationService.GetCompanyInfo()
        .then(function (info) {
            return openPreview(info || {});
        })
        .catch(function () {
            return openPreview({});
        });
}

function handleLedgerVoucherShowResponse(response) {
    if (!response) {
        if (typeof toastr !== 'undefined') toastr.warning('No response from server.');
        return;
    }
    if (response.Status === 'N' || response.status === 'N') {
        if (typeof toastr !== 'undefined') {
            toastr.error(response.Msg || response.message || 'Could not open voucher preview.');
        }
        return;
    }
    if (!openCrystalReportUrl(response) && typeof toastr !== 'undefined') {
        toastr.warning(response.Msg || response.message || 'Voucher report URL not available.');
    }
}

function handleLedgerActionResponse(response) {
    if (!response) {
        if (typeof toastr !== 'undefined') toastr.warning('No response from server.');
        return;
    }
    if (LedgerService.extractCrystalUrl(response)) {
        openCrystalReportUrl(response);
        return;
    }
    const redirect = response.RedirectUrl || response.redirectUrl || response.NavigateUrl || response.navigateUrl;
    if (redirect) {
        window.location = redirect;
        return;
    }
    if (typeof toastr !== 'undefined') {
        toastr.warning(response.Msg || response.message || 'Action not available for this entry.');
    }
}

function LedgerNew_ShowRow(rowIndex) {
    const item = G_RawLedgerData[rowIndex];
    if (!item) return;
    Showloader();
    LedgerService.GetLedgerVoucherAction('SHOW_VOUCHER', buildVoucherPayloadFromRow(item))
        .then(handleLedgerVoucherShowResponse)
        .catch(function (err) {
            console.error('Ledger show error:', err);
            if (typeof toastr !== 'undefined') toastr.error('Failed to open voucher preview.');
        })
        .finally(function () { HideLoader(); });
}

function LedgerNew_EditRow(rowIndex) {
    const item = G_RawLedgerData[rowIndex];
    if (!item) return;
    Showloader();
    LedgerService.GetLedgerVoucherAction('EDIT_VOUCHER', buildVoucherPayloadFromRow(item))
        .then(handleLedgerActionResponse)
        .catch(function (err) {
            console.error('Ledger edit error:', err);
            if (typeof toastr !== 'undefined') toastr.error('Failed to open voucher for edit.');
        })
        .finally(function () { HideLoader(); });
}

function InitLedgerAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode) {
    const baseUrl = sessionStorage.getItem('AppBaseURL') || '';
    const url = `${baseUrl}/CustomControl/AttachmentControl`;
    $('#DivLedgerAttachmentControlmodal').load(url, {
        MasterTableName: masterTableName,
        MasterTableCode: masterTableCode,
        DetailTableName: detailTableName || '',
        DetailTableCode: detailTableCode || 0,
        EntryNo: entryNo || 0,
        EntryDate: entryDate || '',
        Mode: mode || 'View'
    });
}

function LedgerNew_AttachmentRow(rowIndex) {
    const item = G_RawLedgerData[rowIndex];
    if (!item) return;

    const masterTableName = pickLedgerField(item, ['MasterTableName', 'TableName', 'VoucherTableName']);
    const masterTableCode = pickLedgerField(item, ['MasterTableCode', 'Code', 'VoucherMaster_Code', 'VoucherCode']);
    const entryNo = pickLedgerField(item, ['EntryNo', 'Entry No']);
    let entryDate = pickLedgerField(item, ['RecordDate', 'Record Date']);
    const parsedEntryDate = parseLedgerDateValue(entryDate);
    if (parsedEntryDate) {
        entryDate = parsedEntryDate.toISOString().slice(0, 10);
    } else if (entryDate && String(entryDate).length >= 10) {
        entryDate = String(entryDate).substring(0, 10);
    }

    if (!masterTableName || !masterTableCode) {
        if (typeof toastr !== 'undefined') toastr.warning('Attachment not available for this entry.');
        return;
    }

    InitLedgerAttachmentControl(masterTableName, masterTableCode, '', 0, entryNo, entryDate, 'View');
}

async function LedgerNew_PreviewReport() {
    const filters = GetAllFilters();
    if (!filters.accountCodes || filters.accountCodes === '' || filters.accountCodes === '0') {
        if (typeof toastr !== 'undefined') toastr.warning('Please select an account from filters first.');
        return;
    }
    if (!filters.fromDate || filters.fromDate === '0' || !filters.toDate || filters.toDate === '0') {
        if (typeof toastr !== 'undefined') toastr.warning('Please select a valid date range.');
        return;
    }

    Showloader();
    try {
        if (!G_IsDataLoaded || !G_RawLedgerData.length) {
            await LoadRawLedgerData();
            if (G_IsDataLoaded && G_RawLedgerData.length > 0) {
                LedgerNew_ShowReport(false);
            }
        }
        if (!G_IsDataLoaded || !G_RawLedgerData.length) {
            if (typeof toastr !== 'undefined') toastr.warning('No ledger data found for preview.');
            return;
        }
        await openLedgerHtmlPrintPreview();
    } catch (err) {
        console.error('Ledger preview error:', err);
        if (typeof toastr !== 'undefined') toastr.error('Failed to open ledger preview.');
    } finally {
        HideLoader();
    }
}

function attachLedgerActionButtonListeners() {
    const btnPreview = document.getElementById('btnLedgerPreview');
    if (btnPreview && !btnPreview._ledgerBound) {
        btnPreview._ledgerBound = true;
        btnPreview.addEventListener('click', LedgerNew_PreviewReport);
    }

    const btnExcel = document.getElementById('btnLedgerExportExcel');
    if (btnExcel && !btnExcel._ledgerBound) {
        btnExcel._ledgerBound = true;
        btnExcel.addEventListener('click', LedgerNew_ExportExcel);
    }
}

function buildLedgerExcelFileName() {
    const filters = GetAllFilters();
    const party = (getLedgerPartyDisplayName() || 'Ledger').replace(/[^\w\-]+/g, '_').slice(0, 40);
    const from = (filters.fromDate || 'from').replace(/[^\d\-]/g, '');
    const to = (filters.toDate || 'to').replace(/[^\d\-]/g, '');
    return `Ledger_${party}_${from}_${to}`;
}

function stripHtmlForExcelExport(value) {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'string') return value;
    if (value.indexOf('<') === -1) return value;
    const tmp = value
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
    return tmp.replace(/\s+/g, ' ').trim();
}

function buildLedgerExcelExportRows() {
    if (!G_IsDataLoaded || !G_RawLedgerData.length) {
        return [];
    }

    const hiddenFields = getLedgerHiddenColumns().concat(['_ledgerRowIndex']);
    const gridData = mapLedgerRowsForGrid(G_RawLedgerData);

    return gridData.map(function (row) {
        const out = {};
        Object.keys(row).forEach(function (key) {
            if (hiddenFields.includes(key)) return;
            out[key] = stripHtmlForExcelExport(row[key]);
        });
        return out;
    }).filter(function (row) {
        return Object.keys(row).length > 0;
    });
}

function LedgerNew_ExportExcel() {
    if (typeof XLSX === 'undefined') {
        if (typeof toastr !== 'undefined') {
            toastr.error('Excel export library is not loaded.');
        }
        return;
    }

    if (!G_IsDataLoaded || !G_RawLedgerData.length) {
        if (typeof toastr !== 'undefined') {
            toastr.warning('No ledger data to export. Load the grid first.');
        }
        return;
    }

    const exportRows = buildLedgerExcelExportRows();
    if (!exportRows.length) {
        if (typeof toastr !== 'undefined') {
            toastr.warning('No ledger data to export.');
        }
        return;
    }

    ExportToExcelControl.ExportToExcel(exportRows, [], buildLedgerExcelFileName());
}

function getLedgerHiddenColumns() {
    const hidden = getColumnVisibilityHiddenColumns();
    const columnKeys = getLedgerGridColumnKeys();
    if (columnKeys.length === 0 && G_RawLedgerData && G_RawLedgerData.length > 0) {
        columnKeys.push(...Object.keys(G_RawLedgerData[0]));
    }

    const normalize = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

    LEDGER_INTERNAL_HIDDEN_KEYS.forEach(k => {
        if (!hidden.includes(k)) {
            hidden.push(k);
        }
    });

    // Match column names regardless of spacing/casing (ViewTotal, View Total, etc.)
    columnKeys.forEach(col => {
        const n = normalize(col);
        if ((n === 'viewtotal' || n === 'rowsequence' || n === 'ledgerrowindex') && !hidden.includes(col)) {
            hidden.push(col);
        }
    });

    columnKeys.forEach(col => {
        if (isLedgerAlwaysHiddenColumn(col) && !hidden.includes(col)) {
            hidden.push(col);
        }
    });

    return hidden;
}

// Build the list of columns to hide based on the "Show ..." checkbox states.
// Column keys are detected dynamically from the loaded data so this keeps working
// regardless of the exact property names returned by the API.
function getColumnVisibilityHiddenColumns() {
    const hidden = [];
    if (!G_RawLedgerData || G_RawLedgerData.length === 0) {
        return hidden;
    }

    const columns = Object.keys(G_RawLedgerData[0]);

    const states = getLedgerCheckboxOptions();

    const normalize = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
    const findColumn = (...needles) => columns.find(col => {
        const n = normalize(col);
        return needles.some(needle => n.includes(needle));
    });

    const narrationCol = findColumn('narration');
    const gstCol = findColumn('gstno', 'gstinno', 'gstnno', 'gstin', 'gst');
    const refCol = findColumn('refno', 'reference');
    const entryNoCol = findColumn('entryno', 'entrynumber');
    const voucherNoCol = findColumn('voucherno', 'vouchernumber');
    const billNoCol = findColumn('billno', 'billnumber');

    if (narrationCol && !states.showNarration) hidden.push(narrationCol);
    if (gstCol) hidden.push(gstCol);
    if (refCol) hidden.push(refCol);
    if (entryNoCol && !states.showEntryNo) hidden.push(entryNoCol);
    if (voucherNoCol && !states.showVoucherNo) hidden.push(voucherNoCol);
    if (billNoCol && !states.showBillNo) hidden.push(billNoCol);

    console.log('Hidden columns based on checkboxes:', hidden);
    return hidden;
}

// Show/hide grid columns purely via the DOM (no full re-render).
// Rebuilding the whole table (13k+ rows) on every checkbox click freezes the browser,
// so instead we just flip the display of the affected <th>/<td> cells and keep the
// grid's internal hiddenColumns state in sync so pagination/sorting respect it.
function getLedgerGridColumnKeys() {
    if (!G_RawLedgerData || G_RawLedgerData.length === 0) {
        return [];
    }
    return Object.keys(mapLedgerRowsForGrid([G_RawLedgerData[0]])[0]);
}

function applyColumnVisibilityToGrid() {
    if (!G_RawLedgerData || G_RawLedgerData.length === 0) {
        return;
    }

    const headerId = 'tblLedgerDataHeader';
    const bodyId = 'tblLedgerDataBody';
    const columns = getLedgerGridColumnKeys();
    const hidden = getLedgerHiddenColumns();

    // Keep the grid's stored state in sync so re-paginating/sorting keeps the right columns hidden
    window[`hiddenColumns_${bodyId}`] = hidden;

    columns.forEach((col, idx) => {
        const nth = idx + 1;
        const display = hidden.includes(col) ? 'none' : '';

        document.querySelectorAll(`#${headerId} tr > th:nth-child(${nth})`).forEach(th => {
            th.style.display = display;
        });
        document.querySelectorAll(`#${bodyId} tr > td:nth-child(${nth})`).forEach(td => {
            td.style.display = display;
        });
    });
}

// Attach change listeners to the "Show ..." checkboxes above the grid so toggling
// them instantly shows/hides the matching column (without re-fetching or rebuilding the grid).
function attachColumnToggleListeners() {
    const ids = ['showNarration', 'showEntryNo', 'showVoucherNo', 'showBillNo'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el._columnToggleBound) {
            el._columnToggleBound = true;
            el.addEventListener('change', () => {
                if (G_IsDataLoaded && G_RawLedgerData.length > 0) {
                    applyColumnVisibilityToGrid();
                }
            });
        }
    });
}

// Update date range display
function updateLedgerBannerDisplay() {
    const dateRangeEl = document.getElementById('report-date-range');
    const partyNameEl = document.getElementById('ledger-party-name');
    const partyName = getLedgerPartyDisplayName();

    if (partyNameEl) {
        if (partyName) {
            partyNameEl.textContent = partyName;
            partyNameEl.classList.remove('is-hidden');
        } else {
            partyNameEl.textContent = '';
            partyNameEl.classList.add('is-hidden');
        }
    }

    if (!dateRangeEl) return;

    if (G_IsDataLoaded && fromDate !== '0' && toDate !== '0') {
        dateRangeEl.textContent = `${formatDateDisplay(fromDate)} — ${formatDateDisplay(toDate)}`;
    } else if (fromDate !== '0' && toDate !== '0') {
        dateRangeEl.textContent = `Ready: ${formatDateDisplay(fromDate)} — ${formatDateDisplay(toDate)}`;
    } else {
        dateRangeEl.textContent = 'Please select an account to view ledger';
    }
}

function getLedgerPartyDisplayName() {
    const filters = GetAllFilters();
    const accountCode = filters.accountCodes;

    if (accountCode && accountCode !== '0' && G_ddlAccountList.length > 0) {
        const account = G_ddlAccountList.find(function (item) {
            return String(item.Code) === String(accountCode);
        });
        if (account) {
            const name = account.AccountDesp || account.Desp || account.Description || '';
            if (name) return String(name).trim();
        }
    }

    if (G_RawLedgerData && G_RawLedgerData.length > 0) {
        const first = G_RawLedgerData[0];
        const partyKey = Object.keys(first).find(function (k) {
            return normalizeLedgerColKey(k) === 'partyname';
        });
        if (partyKey && !isLedgerNullish(first[partyKey])) {
            return String(first[partyKey]).trim();
        }
    }

    return '';
}

// Format date helper for display
function formatDateDisplay(dateStr) {
    if (!dateStr || dateStr === '0') return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Initialize FilterSidePanelControl on DOM ready
function initLedgerPage() {
    initFilterSidePanelControl();
    attachLedgerActionButtonListeners();
    initLedgerPreviewModal();
    updateLedgerViewState(false);
    updateLedgerBannerDisplay();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLedgerPage);
} else {
    initLedgerPage();
}

window.LedgerNew_ShowRow = LedgerNew_ShowRow;
window.LedgerNew_EditRow = LedgerNew_EditRow;
window.LedgerNew_AttachmentRow = LedgerNew_AttachmentRow;
window.LedgerNew_PreviewReport = LedgerNew_PreviewReport;
window.LedgerNew_ExportExcel = LedgerNew_ExportExcel;
window.closeLedgerPreviewModal = closeLedgerPreviewModal;
window.downloadLedgerPreviewModal = downloadLedgerPreviewModal;
window.InitLedgerAttachmentControl = InitLedgerAttachmentControl;
