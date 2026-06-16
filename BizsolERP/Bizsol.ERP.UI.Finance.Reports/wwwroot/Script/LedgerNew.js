import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { DateRangeControl } from '../../Bizsol.WebERP.UI.Shared/components/DateRangeControl/DateRangeControl.js';
import '../../Bizsol.WebERP.UI.Shared/components/FilterSidePanelControl/FilterSidePanelControl.js';
import { LedgerService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/LedgerService.js';

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
        { id: 'ddlAccountList', type: 'multiselect', label: 'Account List', data: [] },
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

        const filters = {
            accountCodes: filterValues.ddlAccountList?.joined || '0',
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
    const hintEl = document.getElementById('ledger-status-hint');

    if (emptyEl) {
        emptyEl.classList.toggle('is-hidden', !!hasData);
    }
    if (gridEl) {
        gridEl.classList.toggle('is-hidden', !hasData);
    }
    if (bannerEl) {
        bannerEl.classList.toggle('is-loaded', !!hasData);
    }
    if (hintEl) {
        if (hasData && G_RawLedgerData.length > 0) {
            hintEl.innerHTML = `<i class="fas fa-list me-1"></i>${G_RawLedgerData.length.toLocaleString('en-IN')} record(s) loaded`;
        } else {
            hintEl.innerHTML = '<i class="fas fa-filter me-1"></i>Use the filter button (top right) to choose account &amp; date range';
        }
    }
}
function LedgerNew_ShowReport(refreshAll = false) {
    console.log('Showing report...', refreshAll ? '(refreshing all tabs)' : '');

    // Update date range display
    updateDateRangeDisplay();

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

    const ColumnAlignment = {
        Show: 'center;min-width:72px;white-space:nowrap;',
        Edit: 'center;min-width:72px;white-space:nowrap;',
        Attachment: 'center;min-width:96px;white-space:nowrap;'
    };
    const NumericFilterColumn = [];
    const TotalColumns = [];
    const FixedDecimalvalue = {};
    const CommaColumns = [];

    const numericPatterns = [
        'debitamount',
        'creditamount',
        'accountwiserunningbalance',
        'runningbalance',
        'monthstotal',
        'monthtotal',
        'monthdebit',
        'monthcredit',
        'advanceamount'
    ];

    columns.forEach(function (col) {
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

    // Map rows with Show / Edit / Attachment action columns (desktop-style <<Show>> links)
    const gridData = mapLedgerRowsForGrid(G_RawLedgerData);

    // Define filter columns - adjust based on your data structure
    const StringFilterColumn = ["AccountDesp","Voucher Type"];
    const hiddenColumns = getLedgerHiddenColumns();
    const gridOpts = buildLedgerGridOptions(gridData);
    const NumericFilterColumn = gridOpts.NumericFilterColumn;
    const DateFilterColumn = ["Record Date"];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = ["Party Name","Bill No"];

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
    const actionKeys = ['Show', 'Edit', 'Attachment'];
    const dataKeys = Object.keys(row).filter(function (k) { return !actionKeys.includes(k); });
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
    actionKeys.forEach(function (k) {
        if (Object.prototype.hasOwnProperty.call(row, k)) {
            ordered[k] = row[k];
        }
    });
    return ordered;
}

function mapLedgerRowsForGrid(rows) {
    return sanitizeLedgerRows(rows).map(function (item, index) {
        const displayItem = formatLedgerRowDates(item);
        const showCell = ledgerCanShowRow(item)
            ? buildLedgerActionLink('Show', `LedgerNew_ShowRow(${index}); return false;`)
            : '';
        const editCell = ledgerCanEditRow(item)
            ? buildLedgerActionLink('Edit', `LedgerNew_EditRow(${index}); return false;`)
            : '';
        const attachLabel = ledgerRowHasAttachment(item) ? 'Attached' : 'Attachment';
        const attachClass = ledgerRowHasAttachment(item) ? 'ledger-action-link--attached' : '';
        const attachCell = buildLedgerActionLink(attachLabel, `LedgerNew_AttachmentRow(${index}); return false;`, attachClass);

        const row = Object.assign({}, displayItem, {
            Show: showCell,
            Edit: editCell,
            Attachment: attachCell,
            _ledgerRowIndex: index
        });

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
        showGSTNo: isChecked('showGSTNo'),
        showMonthTotal: isChecked('showMonthTotal'),
        showRefNo: isChecked('showRefNo')
    };
}

function openCrystalReportUrl(response) {
    const url = LedgerService.extractCrystalUrl(response);
    if (!url) {
        if (typeof toastr !== 'undefined') {
            toastr.error((response && (response.Msg || response.message)) || 'Report URL not available.');
        }
        return false;
    }
    const a = document.createElement('a');
    a.style.display = 'none';
    a.target = '_blank';
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
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

function LedgerNew_PreviewReport() {
    const filters = GetAllFilters();
    if (!filters.accountCodes || filters.accountCodes === '' || filters.accountCodes === '0') {
        if (typeof toastr !== 'undefined') toastr.warning('Please select account(s) and apply filters first.');
        return;
    }
    Showloader();
    LedgerService.PreviewLedgerReport(filters.accountCodes, filters.fromDate, filters.toDate, getLedgerCheckboxOptions())
        .then(openCrystalReportUrl)
        .catch(function (err) {
            console.error('Ledger preview error:', err);
            if (typeof toastr !== 'undefined') toastr.error('Failed to open ledger preview.');
        })
        .finally(function () { HideLoader(); });
}

function attachLedgerActionButtonListeners() {
    const btnPreview = document.getElementById('btnLedgerPreview');
    if (btnPreview && !btnPreview._ledgerBound) {
        btnPreview._ledgerBound = true;
        btnPreview.addEventListener('click', LedgerNew_PreviewReport);
    }
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
    const monthTotalCol = findColumn('monthtotal');

    if (narrationCol && !states.showNarration) hidden.push(narrationCol);
    if (gstCol && !states.showGSTNo) hidden.push(gstCol);
    if (refCol && !states.showRefNo) hidden.push(refCol);
    if (monthTotalCol && !states.showMonthTotal) hidden.push(monthTotalCol);

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
    const ids = ['showNarration', 'showGSTNo', 'showMonthTotal', 'showRefNo'];
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
function updateDateRangeDisplay() {
    const dateRangeEl = document.getElementById('report-date-range');
    if (!dateRangeEl) return;

    if (G_IsDataLoaded && fromDate !== '0' && toDate !== '0') {
        dateRangeEl.textContent = `${formatDateDisplay(fromDate)} — ${formatDateDisplay(toDate)}`;
    } else if (fromDate !== '0' && toDate !== '0') {
        dateRangeEl.textContent = `Ready: ${formatDateDisplay(fromDate)} — ${formatDateDisplay(toDate)}`;
    } else {
        dateRangeEl.textContent = 'Please select an account to view ledger';
    }
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
    updateLedgerViewState(false);
    updateDateRangeDisplay();
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
window.InitLedgerAttachmentControl = InitLedgerAttachmentControl;
