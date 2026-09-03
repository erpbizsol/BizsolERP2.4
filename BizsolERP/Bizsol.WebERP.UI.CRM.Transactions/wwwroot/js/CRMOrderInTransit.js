import { CRMOrderInTransitService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/CRMOrderInTransitService.js';
import { VisitOrderEntryService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/VisitOrderEntryService.js';
import { MenuService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BizSolHelperFunction } from '/_content/Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

const LIST_MODE = 'SHOW_PendingOrders';
const SAVE_MODE_UPDATE = 'Update';
const SAVE_MODE_TRANSFER = 'OrderTransfer';
const HIDDEN_COLUMN_CANDIDATES = [
    'VisitOrderDetails_Code', 'VisitMaster_Code', 'BuyerPoMaster_Code', 'BuyerPOMaster_Code', 'Code',
    'ItemMaster_Code', 'ItemMaster_code', 'ItemMasterCode',
    'ItemSizeMaster_Code', 'ItemSizeMaster_code', 'ItemSizeMasterCode',
    '_rowIndex', '_selected', '_estimatedDate', '_originalEstimatedDate', '_remark'
];
const ITEM_CODE_CANDIDATES = ['ItemMaster_Code', 'ItemMaster_code', 'ItemMasterCode'];
const ITEM_SIZE_CODE_CANDIDATES = ['ItemSizeMaster_Code', 'ItemSizeMaster_code', 'ItemSizeMasterCode'];
const SIZE_KEY_CANDIDATES = ['Size', 'SIZE', 'SizeDesp', 'Size Desp'];
const THICKNESS_KEY_CANDIDATES = ['Thickness', 'THICKNESS', 'ThickNess'];
const DATE_KEY_CANDIDATES = [
    'Estimated Date', 'EstimatedDate', 'EstimateDate', 'Estmated Date', 'EstmatedDate',
    'PPCEstimatedDate', 'PPC Estimated Date', 'Expected Date', 'ExpectedDate'
];
const REMARK_KEY_CANDIDATES = ['Remark', 'PPCRemark', 'PPC Remark'];
const STOCK_KEY_CANDIDATES = [
    'Cur. Stock', 'Current Stock', 'CurrentStock', 'Cur Stock', 'Stock'
];
const QTY_MT_KEY_CANDIDATES = [
    'QTY MT', 'Qty MT', 'QtyMT', 'QTYMT', 'Qty Mt'
];

let gridRows = [];
let rowState = [];
let dateColumnKey = 'Estimated Date';
let remarkColumnKey = 'Remark';

function GetModuleName() {
    return ($('#ERPHeading').text() || '').trim();
}

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    $('#btnShowCRMOrderInTransit').on('click', GetCRMOrderInTransitList);
    $('#btnUpdateCRMOrderInTransit').on('click', function () {
        SaveSelectedRows(SAVE_MODE_UPDATE);
    });
    $('#btnCheckStockCRMOrderInTransit').on('click', CheckCurrentStockForAllRows);
    $('#btnTransferCRMOrderInTransit').on('click', function () {
        SaveSelectedRows(SAVE_MODE_TRANSFER);
    });
    ApplyButtonRights();
    GetCRMOrderInTransitList();
});

function CheckRight(optionName, showMsg) {
    const FinYear = BizSolHelperFunction.getFinancialYear();
    return MenuService.CheckModuleOptionRight(GetModuleName(), optionName, showMsg || 'Y', FinYear);
}

function ApplyButtonRights() {
    CheckRight('Update', 'N').then(function (response) {
        if (response && response.CheckModuleOptionRight === 'N') {
            $('#btnUpdateCRMOrderInTransit').hide();
        } else {
            $('#btnUpdateCRMOrderInTransit').show();
        }
    }).catch(function () {
        $('#btnUpdateCRMOrderInTransit').show();
    });

    CheckRight('Transfer', 'N').then(function (response) {
        if (response && response.CheckModuleOptionRight === 'N') {
            $('#btnTransferCRMOrderInTransit').hide();
        } else {
            $('#btnTransferCRMOrderInTransit').show();
        }
    }).catch(function () {
        $('#btnTransferCRMOrderInTransit').show();
    });
}

function unwrapList(response) {
    if (Array.isArray(response)) {
        return response;
    }
    if (response && Array.isArray(response.data)) {
        return response.data;
    }
    if (response && Array.isArray(response.Data)) {
        return response.Data;
    }
    return [];
}

function findKey(row, candidates) {
    if (!row) {
        return null;
    }
    const keys = Object.keys(row);
    const normalized = {};
    keys.forEach(function (key) {
        normalized[key.toLowerCase().replace(/\s+/g, '')] = key;
    });
    for (let i = 0; i < candidates.length; i++) {
        const match = normalized[candidates[i].toLowerCase().replace(/\s+/g, '')];
        if (match) {
            return match;
        }
    }
    return null;
}

function pad2(value) {
    return String(value).padStart(2, '0');
}

function toISODate(date) {
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
}

function toInputDate(value) {
    if (value === null || value === undefined || value === '') {
        return '';
    }
    if (typeof value === 'string' && value.indexOf('<input') !== -1) {
        const match = value.match(/value\s*=\s*"([^"]*)"/i);
        return match ? match[1] : '';
    }

    const raw = String(value).trim();
    if (!raw || raw.toLowerCase() === 'null') {
        return '';
    }

    if (raw.indexOf('/Date(') !== -1) {
        const ms = parseInt(raw.replace(/\D/g, ''), 10);
        const parsed = new Date(ms);
        return isNaN(parsed.getTime()) ? '' : toISODate(parsed);
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
        return raw.substring(0, 10);
    }

    const monthNames = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const parts = raw.replace(/[./]/g, '-').split('-').map(function (p) { return p.trim(); }).filter(Boolean);
    if (parts.length === 3) {
        let day;
        let month;
        let year;
        if (isNaN(parseInt(parts[1], 10))) {
            day = parseInt(parts[0], 10);
            month = monthNames[parts[1].substring(0, 3).toLowerCase()];
            year = parseInt(parts[2], 10);
        } else if (parts[0].length === 4) {
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            day = parseInt(parts[2], 10);
        } else {
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            year = parseInt(parts[2], 10);
        }
        if (!isNaN(day) && month !== undefined && !isNaN(month) && !isNaN(year)) {
            const parsed = new Date(year, month, day);
            if (!isNaN(parsed.getTime())) {
                return toISODate(parsed);
            }
        }
    }

    const fallback = new Date(raw);
    return isNaN(fallback.getTime()) ? '' : toISODate(fallback);
}

function formatApiDate(isoDate) {
    if (!isoDate) {
        return '';
    }
    const parts = String(isoDate).split('-');
    if (parts.length !== 3) {
        return isoDate;
    }
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(parts[1], 10) - 1;
    if (monthIndex < 0 || monthIndex > 11) {
        return isoDate;
    }
    return parts[2] + '-' + monthNames[monthIndex] + '-' + parts[0];
}

function escapeAttr(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function parseQty(value) {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    const n = parseFloat(String(value).replace(/,/g, '').trim());
    return isNaN(n) ? 0 : n;
}

function getRowNumber(row, candidates) {
    const key = findKey(row, candidates);
    return key ? parseQty(row[key]) : 0;
}

function getRowLabel(row, index) {
    const orderKey = findKey(row, ['Order No', 'OrderNo', 'Order Number']);
    const itemKey = findKey(row, ['Item Name', 'ItemName']);
    const parts = [];
    if (orderKey && row[orderKey]) {
        parts.push(String(row[orderKey]));
    }
    if (itemKey && row[itemKey]) {
        parts.push(String(row[itemKey]));
    }
    return parts.length ? parts.join(' - ') : ('Row ' + (index + 1));
}

function getNumeric(row, names) {
    for (let i = 0; i < names.length; i++) {
        if (row[names[i]] !== undefined && row[names[i]] !== null && row[names[i]] !== '') {
            return parseInt(row[names[i]], 10) || 0;
        }
    }
    return 0;
}

function buildDateCell(index, isoDate, locked) {
    const lockAttr = locked
        ? ' disabled readonly tabindex="-1" title="Estimated Date is already set and cannot be changed"'
        : '';
    return '<input type="date" class="form-control form-control-sm box_border oit-est-date'
        + (locked ? ' oit-locked' : '') + '" data-index="'
        + index + '" value="' + escapeAttr(isoDate || '') + '"' + lockAttr + '>';
}

function buildRemarkCell(index, remark, locked) {
    const lockAttr = locked
        ? ' disabled readonly tabindex="-1" title="Remark is already set and cannot be changed"'
        : '';
    return '<input type="text" class="form-control form-control-sm box_border oit-remark'
        + (locked ? ' oit-locked' : '') + '" data-index="'
        + index + '" value="' + escapeAttr(remark) + '" maxlength="500" placeholder="Remark"' + lockAttr + '>';
}

function buildSelectCell(index, checked) {
    return '<input type="checkbox" class="oit-row-check" data-index="' + index + '"'
        + (checked ? ' checked' : '') + '>';
}

function stripInternalKeys(row) {
    delete row._rowIndex;
    delete row._selected;
    delete row._estimatedDate;
    delete row._originalEstimatedDate;
    delete row._remark;
    return row;
}

function prepareGridRows(list) {
    dateColumnKey = findKey(list[0], DATE_KEY_CANDIDATES) || 'Estimated Date';
    remarkColumnKey = findKey(list[0], REMARK_KEY_CANDIDATES) || 'Remark';
    rowState = [];

    return list.map(function (item, index) {
        const row = stripInternalKeys(Object.assign({}, item));
        const isoDate = toInputDate(row[dateColumnKey]);
        const remark = row[remarkColumnKey] == null ? '' : String(row[remarkColumnKey]).trim();
        const dateLocked = !!isoDate;
        const remarkLocked = !!remark;

        rowState[index] = {
            selected: false,
            estimatedDate: isoDate,
            originalEstimatedDate: isoDate,
            remark: remark,
            dateLocked: dateLocked,
            remarkLocked: remarkLocked
        };

        row[dateColumnKey] = buildDateCell(index, isoDate, dateLocked);
        row[remarkColumnKey] = buildRemarkCell(index, remark, remarkLocked);
        delete row.Select;
        row.Select = buildSelectCell(index, false);
        return row;
    });
}

function getHiddenColumns(row) {
    const hidden = HIDDEN_COLUMN_CANDIDATES.slice();
    if (row) {
        Object.keys(row).forEach(function (key) {
            if (key.charAt(0) === '_' && hidden.indexOf(key) === -1) {
                hidden.push(key);
            }
        });
    }
    return hidden;
}

function getStringFilterColumns(rawRow) {
    const skip = {};
    skip[dateColumnKey] = true;
    skip[remarkColumnKey] = true;
    skip.Select = true;
    HIDDEN_COLUMN_CANDIDATES.forEach(function (name) { skip[name] = true; });

    return Object.keys(rawRow || {}).filter(function (key) {
        if (skip[key] || key.charAt(0) === '_') {
            return false;
        }
        const value = rawRow[key];
        return typeof value === 'string' && String(value).indexOf('<') === -1;
    });
}

function bindGridEvents() {
    const $selectHeader = $('#tblCRMOrderInTransit-header th').filter(function () {
        return $(this).text().trim() === 'Select';
    });
    if ($selectHeader.length) {
        $selectHeader.addClass('oit-select-col').html('<input type="checkbox" id="chkSelectAll" title="Select All">');
        $selectHeader.css('text-align', 'center');
    }

    $('#chkSelectAll').off('change.oit').on('change.oit', function () {
        const checked = this.checked;
        gridRows.forEach(function (row, index) {
            if (rowState[index]) {
                rowState[index].selected = checked;
            }
            row.Select = buildSelectCell(index, checked);
        });
        $('.oit-row-check').prop('checked', checked);
    });

    $('#tblCRMOrderInTransit').off('change.oitCheck', '.oit-row-check').on('change.oitCheck', '.oit-row-check', function () {
        const index = parseInt(this.dataset.index, 10);
        setRowSelected(index, this.checked);
    });

    $('#tblCRMOrderInTransit').off('change.oitDate input.oitDate', '.oit-est-date')
        .on('change.oitDate input.oitDate', '.oit-est-date', function () {
            const index = parseInt(this.dataset.index, 10);
            if (!rowState[index] || !gridRows[index]) {
                return;
            }
            if (rowState[index].dateLocked) {
                this.value = rowState[index].originalEstimatedDate || '';
                return;
            }
            rowState[index].estimatedDate = this.value || '';
            gridRows[index][dateColumnKey] = buildDateCell(index, rowState[index].estimatedDate, false);
            if (rowState[index].estimatedDate) {
                setRowSelected(index, true);
            }
        });

    $('#tblCRMOrderInTransit').off('change.oitRemark input.oitRemark', '.oit-remark')
        .on('change.oitRemark input.oitRemark', '.oit-remark', function () {
            const index = parseInt(this.dataset.index, 10);
            if (!rowState[index] || !gridRows[index]) {
                return;
            }
            if (rowState[index].remarkLocked) {
                this.value = rowState[index].remark || '';
                return;
            }
            rowState[index].remark = this.value || '';
            gridRows[index][remarkColumnKey] = buildRemarkCell(index, rowState[index].remark, false);
        });
}

function setRowSelected(index, checked) {
    if (!rowState[index] || !gridRows[index]) {
        return;
    }
    rowState[index].selected = !!checked;
    gridRows[index].Select = buildSelectCell(index, rowState[index].selected);
    $('.oit-row-check[data-index="' + index + '"]').prop('checked', rowState[index].selected);
    syncSelectAllHeader();
}

function syncSelectAllHeader() {
    const $all = $('#chkSelectAll');
    if (!$all.length || !rowState.length) {
        return;
    }
    const selectedCount = rowState.filter(function (state) { return state && state.selected; }).length;
    $all.prop({
        checked: selectedCount === rowState.length,
        indeterminate: selectedCount > 0 && selectedCount < rowState.length
    });
}

function RenderGrid(rawFirst) {
    if (!gridRows.length) {
        return;
    }
    const filterSource = rawFirst || gridRows[0];
    const StringFilterColumn = getStringFilterColumns(filterSource);
    const hiddenColumns = getHiddenColumns(gridRows[0]);
    const ColumnAlignment = {};
    ColumnAlignment[dateColumnKey] = 'center';
    ColumnAlignment.Select = 'center';

    BizsolCustomFilterGrid.CreateDataTable(
        'tblCRMOrderInTransit-header',
        'tblCRMOrderInTransit-body',
        gridRows,
        false,
        [],
        StringFilterColumn,
        [],
        [],
        [],
        hiddenColumns,
        ColumnAlignment
    );

    bindGridEvents();
    syncSelectAllHeader();
    applyStockRowStyles();
    $('#paginator-tblCRMOrderInTransit').off('click.oitStock').on('click.oitStock', function () {
        setTimeout(applyStockRowStyles, 50);
    });
}

function isStockAvailable(row) {
    return getRowNumber(row, STOCK_KEY_CANDIDATES) > 0;
}

function applyStockRowStyles() {
    $('#tblCRMOrderInTransit-body tr').each(function () {
        const index = parseInt($(this).find('.oit-row-check').attr('data-index'), 10);
        const available = !isNaN(index) && gridRows[index] && isStockAvailable(gridRows[index]);
        $(this).toggleClass('oit-row-stock-available', !!available);
    });
}

function normalizeText(value) {
    return String(value ?? '').trim().toLowerCase();
}

function normalizeThickness(value) {
    return String(value ?? '').replace(/\s*mm\s*$/i, '').trim().toLowerCase();
}

function getStockBalance(stock) {
    if (!stock) {
        return 0;
    }
    return parseQty(stock.BalanceQty ?? stock['Balance Qty'] ?? stock.PhysicalStock ?? stock['Physical Stock'] ?? 0);
}

function stockMatchesRow(row, stock) {
    const rowItemCode = getNumeric(row, ITEM_CODE_CANDIDATES);
    const stockItemCode = parseInt(stock.ItemMaster_Code ?? stock.ItemMaster_code ?? stock.ItemMasterCode ?? 0, 10) || 0;
    if (rowItemCode && stockItemCode && rowItemCode !== stockItemCode) {
        return false;
    }
    if (!rowItemCode || !stockItemCode) {
        const itemKey = findKey(row, ['Item Name', 'ItemName']);
        const stockName = stock['Item Name'] ?? stock.ItemName ?? '';
        if (itemKey && normalizeText(row[itemKey]) !== normalizeText(stockName)) {
            return false;
        }
    }

    const rowSizeCode = getNumeric(row, ITEM_SIZE_CODE_CANDIDATES);
    const stockSizeCode = parseInt(stock.ItemSizeMaster_Code ?? stock.ItemSizeMaster_code ?? stock.ItemSizeMasterCode ?? 0, 10) || 0;
    if (rowSizeCode && stockSizeCode && rowSizeCode !== stockSizeCode) {
        return false;
    }

    const sizeKey = findKey(row, SIZE_KEY_CANDIDATES);
    const stockSize = stock.SIZE ?? stock.Size ?? stock.SizeDesp ?? stock['Size Desp'] ?? '';
    if (sizeKey && normalizeText(row[sizeKey]) !== normalizeText(stockSize)) {
        return false;
    }

    const thkKey = findKey(row, THICKNESS_KEY_CANDIDATES);
    const stockThk = stock.THICKNESS ?? stock.Thickness ?? stock.ThickNess ?? '';
    if (thkKey && normalizeThickness(row[thkKey]) !== normalizeThickness(stockThk)) {
        return false;
    }

    return true;
}

function findMatchingStock(stockList, row) {
    if (!Array.isArray(stockList) || !stockList.length) {
        return null;
    }
    const exact = stockList.filter(function (stock) {
        return stockMatchesRow(row, stock);
    });
    if (!exact.length) {
        return null;
    }
    exact.sort(function (a, b) {
        return getStockBalance(b) - getStockBalance(a);
    });
    return exact[0];
}

function CheckCurrentStockForAllRows() {
    if (!gridRows.length) {
        toastr.warning('Please load the list first.');
        return;
    }

    const itemCodes = [];
    gridRows.forEach(function (row) {
        const code = getNumeric(row, ITEM_CODE_CANDIDATES);
        if (code && itemCodes.indexOf(code) === -1) {
            itemCodes.push(code);
        }
    });

    const dtDate = new Date().toISOString().split('T')[0];
    const itemMasterCodes = itemCodes.join(',');
    const $btn = $('#btnCheckStockCRMOrderInTransit');
    $btn.prop('disabled', true);

    if (typeof Showloader === 'function') {
        Showloader();
    }

    VisitOrderEntryService.GetLogicalStock(
        dtDate,
        itemMasterCodes,
        '',
        '',
        '',
        'Stock',
        '0',
        'SIZE,THICKNESS',
        '',
        '0'
    ).then(function (response) {
        const stockList = unwrapList(response);
        const stockKey = findKey(gridRows[0], STOCK_KEY_CANDIDATES) || 'Cur. Stock';
        let updatedCount = 0;

        gridRows.forEach(function (row, index) {
            const match = findMatchingStock(stockList, row);
            const balQty = match ? getStockBalance(match) : 0;
            const previous = parseQty(row[stockKey]);
            row[stockKey] = balQty;
            if (previous !== balQty) {
                updatedCount += 1;
            }
            if (isStockAvailable(row) && rowState[index]) {
                rowState[index].selected = true;
                row.Select = buildSelectCell(index, true);
            }
        });

        RenderGrid();
        if (typeof HideLoader === 'function') {
            HideLoader();
        }
        $btn.prop('disabled', false);

        if (!stockList.length) {
            toastr.warning('No stock data found. Current Stock set to 0 for all rows.');
            return;
        }
        toastr.success('Current Stock updated for all rows. ' + updatedCount + ' row(s) changed.');
    }).catch(function (error) {
        if (typeof HideLoader === 'function') {
            HideLoader();
        }
        $btn.prop('disabled', false);
        toastr.error((error && (error.Msg || error.message)) || 'Failed to check current stock.');
    });
}

function GetCRMOrderInTransitList() {
    if (typeof Showloader === 'function') {
        Showloader();
    }

    CRMOrderInTransitService.GetCRMOrderInTransitList(LIST_MODE).then(function (response) {
        if (typeof HideLoader === 'function') {
            HideLoader();
        }

        const listStatus = (response && (response.Status ?? response.status) || '').toString().trim().toUpperCase();
        if (listStatus === 'N' || listStatus === 'ERROR' || listStatus === 'FALSE') {
            toastr.error((response && (response.Msg || response.msg || response.Message)) || 'Failed to load list.');
            return;
        }

        const list = unwrapList(response);
        if (!list.length) {
            gridRows = [];
            rowState = [];
            $('#tblCRMOrderInTransit-header').empty();
            $('#tblCRMOrderInTransit-body').empty();
            $('#paginator-tblCRMOrderInTransit').empty();
            toastr.error('Record not found...!');
            return;
        }

        const rawFirst = stripInternalKeys(Object.assign({}, list[0]));
        dateColumnKey = findKey(rawFirst, DATE_KEY_CANDIDATES) || 'Estimated Date';
        remarkColumnKey = findKey(rawFirst, REMARK_KEY_CANDIDATES) || 'Remark';

        gridRows = prepareGridRows(list);
        RenderGrid(rawFirst);
    }).catch(function (error) {
        if (typeof HideLoader === 'function') {
            HideLoader();
        }
        toastr.error((error && error.message) || 'Failed to load CRM Order In Transit list.');
    });
}

function isApiSuccess(result) {
    if (!result) {
        return false;
    }
    const status = (result.Status ?? result.status ?? '').toString().trim().toUpperCase();
    if (status === 'Y' || status === 'SUCCESS' || status === '1' || status === 'TRUE') {
        return true;
    }
    if (status === 'N' || status === 'ERROR' || status === '0' || status === 'FALSE') {
        return false;
    }
    return true;
}

function buildSavePayload(row, state) {
    return {
        VisitOrderDetails_Code: getNumeric(row, ['VisitOrderDetails_Code']),
        VisitMaster_Code: getNumeric(row, ['VisitMaster_Code']),
        EstimateDate: formatApiDate(((state && state.estimatedDate) || '').trim()),
        PPCRemark: ((state && state.remark) || '').trim()
    };
}

function SaveSelectedRows(mode) {
    const optionName = mode === SAVE_MODE_TRANSFER ? 'Transfer' : 'Update';

    CheckRight(optionName, 'Y').then(function (respCheck) {
        if (respCheck && respCheck.CheckModuleOptionRight === 'N') {
            toastr.error(respCheck.Msg || ('You do not have ' + optionName + ' rights.'));
            return;
        }
        SubmitSelectedRows(mode);
    }).catch(function () {
        toastr.error('Unable to verify user rights.');
    });
}

async function SubmitSelectedRows(mode) {
    const selectedIndexes = [];
    rowState.forEach(function (state, index) {
        if (state && state.selected) {
            selectedIndexes.push(index);
        }
    });

    if (!selectedIndexes.length) {
        toastr.warning('Please select at least one row.');
        return;
    }

    if (mode === SAVE_MODE_TRANSFER) {
        const invalidRows = [];
        for (let i = 0; i < selectedIndexes.length; i++) {
            const index = selectedIndexes[i];
            const row = gridRows[index];
            const currentStock = getRowNumber(row, STOCK_KEY_CANDIDATES);
            const qtyMt = getRowNumber(row, QTY_MT_KEY_CANDIDATES);
            if (currentStock < qtyMt) {
                invalidRows.push(getRowLabel(row, index) + ' (Cur. Stock: ' + currentStock + ', QTY MT: ' + qtyMt + ')');
            }
        }
        if (invalidRows.length) {
            toastr.error('Cannot transfer. Current Stock must be greater than or equal to QTY MT. ' + invalidRows.join('; '));
            return;
        }
    }

    if (mode === SAVE_MODE_UPDATE) {
        for (let i = 0; i < selectedIndexes.length; i++) {
            const index = selectedIndexes[i];
            const state = rowState[index];
            const dateVal = ((state && state.estimatedDate) || '').trim();
            const remark = ((state && state.remark) || '').trim();

            if (!dateVal) {
                toastr.error('Estimated Date is mandatory for Update.');
                const $date = $('.oit-est-date[data-index="' + index + '"]');
                if ($date.length) {
                    $date.focus();
                }
                return;
            }
            if (!remark) {
                toastr.error('Remark is mandatory for Update.');
                const $remark = $('.oit-remark[data-index="' + index + '"]');
                if ($remark.length) {
                    $remark.focus();
                }
                return;
            }
        }
    }

    const payload = selectedIndexes.map(function (index) {
        return buildSavePayload(gridRows[index], rowState[index]);
    });

    if (typeof Showloader === 'function') {
        Showloader();
    }

    try {
        const result = await CRMOrderInTransitService.SaveCRMOrderInTransit(payload, mode);
        if (typeof HideLoader === 'function') {
            HideLoader();
        }
        if (!isApiSuccess(result)) {
            toastr.error((result && (result.Msg || result.msg || result.Message)) || 'Save failed.');
            return;
        }
        toastr.success((result && (result.Msg || result.msg || result.Message))
            || (mode === SAVE_MODE_TRANSFER ? 'Orders transferred successfully.' : 'Estimated date / remark updated successfully.'));
        GetCRMOrderInTransitList();
    } catch (error) {
        if (typeof HideLoader === 'function') {
            HideLoader();
        }
        toastr.error((error && (error.Msg || error.message)) || 'Failed to save CRM Order In Transit.');
    }
}

window.GetCRMOrderInTransitList = GetCRMOrderInTransitList;
window.SaveSelectedRows = SaveSelectedRows;
window.CheckCurrentStockForAllRows = CheckCurrentStockForAllRows;
