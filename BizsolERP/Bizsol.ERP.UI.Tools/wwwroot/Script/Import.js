import { ImportExportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ImportExportService.js';
import { BranchDetailsFunction } from '../../Bizsol.WebERP.UI.Shared/js/BranchdetailsFunction.js';

var G_Templates = [];
var G_Columns = [];
var G_Rows = [];
var G_FileError = '';
var G_BranchInfo = null;
var G_BranchList = [];
var G_SelectedBranchCodes = [];
var G_ImportTransferRules = { allowed: true, showBranchGrid: false, message: '' };
var SELECT_COLUMN = 'Select';
var SERIAL_COLUMN = 'S.No.';

var ITEM_GST_ALIASES = ['GST Rate', 'GSTRate', 'GST'];
var ITEM_OPBAL_ALIASES = ['OP Bal', 'Opening Balance', 'Opening Bal', 'OPBal', 'Opening Balance Qty'];
var EMP_ESINO_ALIASES = ['ESINo', 'ESI No', 'ESINumber', 'ESI'];
var YN_FLAG_COLUMN_KEYS = {
    'groupitem': true,
    'by product': true,
    'rejection': true,
    'active': true,
    'verified': true,
    'maintaininventory': true,
    'autocalculateqty': true
};

function trim(v) {
    return String(v == null ? '' : v).replace(/\u00a0/g, ' ').trim();
}

function esc(v) {
    return trim(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function asList(response) {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.$values && Array.isArray(response.$values)) return response.$values;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.Data)) return response.Data;
    if (response.value && Array.isArray(response.value)) return response.value;
    if (response.Value && Array.isArray(response.Value)) return response.Value;
    if (typeof response === 'object') {
        var keys = Object.keys(response).filter(function (k) { return /^\d+$/.test(k); });
        if (keys.length) {
            return keys.sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); })
                .map(function (k) { return response[k]; });
        }
    }
    return [];
}

function readMetaInt(obj, keys) {
    for (var i = 0; i < keys.length; i++) {
        var v = obj[keys[i]];
        if (v != null && v !== '') {
            var n = parseInt(v, 10);
            if (!isNaN(n)) return n;
        }
    }
    return null;
}

function readMetaString(obj, keys, fallback) {
    for (var i = 0; i < keys.length; i++) {
        var v = obj[keys[i]];
        if (v != null && String(v).trim() !== '') return String(v);
    }
    return fallback || '';
}

function normalizeHeader(v) {
    return trim(v)
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .replace(/ line (\d+)/g, ' line$1');
}

function getTableName(item) {
    return String(item && (item.TableName || item.tableName) || '');
}

function isImportTable(tableName, token) {
    var tbl = String(tableName || '').toLowerCase();
    return tbl === token + 'import' || (tbl.indexOf(token) >= 0 && tbl.indexOf('import') >= 0);
}

function isAccountMasterTable(tableName) {
    return isImportTable(tableName, 'accountmaster');
}

function isItemMasterTable(tableName) {
    return isImportTable(tableName, 'itemmaster');
}

function isEmployeeMasterTable(tableName) {
    return isImportTable(tableName, 'employeemaster');
}

function isAccountMasterVendorImport(templateItem) {
    if (!templateItem) return false;
    if (parseInt(templateItem.Code || templateItem.code || 0, 10) === 7) return true;
    var text = (trim(templateItem.DisplayName || templateItem.displayName || '') + ' '
        + trim(templateItem.Desp || templateItem.desp || '')).toLowerCase();
    return text.indexOf('vendor') >= 0;
}

function getAccountMasterFlagColumn(templateItem) {
    if (!templateItem || !isAccountMasterTable(getTableName(templateItem))) return null;
    return isAccountMasterVendorImport(templateItem) ? 'Vendor' : 'Client';
}

function selectedTemplate() {
    var code = trim($('#ddlImportTemplate').val());
    if (!code) return null;
    for (var i = 0; i < G_Templates.length; i++) {
        var item = G_Templates[i];
        if (String(item.Code || (i + 1)) === code) {
            return { code: code, item: item };
        }
    }
    return null;
}

function templateLabel(item) {
    var display = trim(item.DisplayName || item.displayName || '');
    if (display) return display;
    var table = getTableName(item) || 'ImportTemplate';
    return table !== 'ImportTemplate' ? table : (item.Desp || item.desp || table);
}

function normalizeXltxFileName(fileName, fallbackBase) {
    var fn = trim(fileName || '') || trim(fallbackBase || '') || 'ImportTemplate';
    fn = fn.replace(/\.zip$/i, '.xltx');
    if (/\.xltx$/i.test(fn)) return fn;
    if (/xltx$/i.test(fn)) return fn.replace(/xltx$/i, '.xltx');
    if (fn.indexOf('.') < 0) return fn + '.xltx';
    return fn;
}

function templateFileName(item) {
    var base = (getTableName(item) || 'ImportTemplate').replace(/[^\w\-]+/g, '_');
    var display = trim(item.DisplayName || item.displayName || '').toLowerCase();
    if (display.indexOf('vendor') >= 0) base += '_Vendor';
    else if (display.indexOf('client') >= 0) base += '_Client';
    return normalizeXltxFileName(item.TemplateFileName || item.templateFileName, base);
}

function getCurrentImportFileName() {
    var file = $('#fileImportUpload')[0].files && $('#fileImportUpload')[0].files[0];
    return file ? file.name : '';
}

function hasImportFileSelected() {
    return !!getCurrentImportFileName();
}

function getTemplateMatchTokens(templateItem) {
    var tokens = [];
    var label = templateLabel(templateItem).toLowerCase();
    var table = getTableName(templateItem).replace(/Import$/i, '').replace(/[_\s]+/g, ' ').toLowerCase();
    if (table) tokens.push(table.replace(/\s+/g, ''));
    label.split(/[\s_\-]+/).forEach(function (word) {
        if (word.length >= 3 && word !== 'master' && word !== 'import') tokens.push(word);
    });
    ['client', 'vendor', 'employee', 'item', 'account'].forEach(function (word) {
        if (label.indexOf(word) >= 0) tokens.push(word);
    });
    return tokens.filter(function (token, idx, arr) { return arr.indexOf(token) === idx; });
}

function doesImportFileMatchTemplate(fileName, templateItem) {
    if (!fileName || !templateItem) return true;
    var normalized = fileName.toLowerCase().replace(/\.(xlsx|xls|xltx)$/i, '');
    var tokens = getTemplateMatchTokens(templateItem);
    if (!tokens.length) return true;
    return tokens.some(function (token) { return normalized.indexOf(token) >= 0; });
}

function clearImportFile(showMessage) {
    $('#fileImportUpload').val('');
    $('#lblImportFileName').text('No file chosen').addClass('is-empty');
    G_FileError = '';
    $('#impFileValidation').hide().text('');
    $('#impFileField').removeClass('imp-file-invalid');
    if (showMessage) {
        toastr.info('Import file cleared because it does not match the selected import type.');
    }
}

function isFlagYes(value) {
    return String(value || '').trim().toUpperCase() === 'Y';
}

function getMaintainMain(templateItem) {
    return String(templateItem && (templateItem.MaintainMain || templateItem.maintainMain) || 'Y').trim().toUpperCase();
}

function getTransferApplicable(branchInfo) {
    if (!branchInfo) return false;
    if (isFlagYes(branchInfo.TransferApplicable)) return true;
    if (isFlagYes(branchInfo.MaintainMasterTransferApplicable)) return true;
    return false;
}

function evaluateImportTransferRules(branchInfo, maintainMain) {
    var mainCompany = isFlagYes(branchInfo && branchInfo.MainCompany);
    var transferApplicable = getTransferApplicable(branchInfo);
    var maintain = String(maintainMain || 'Y').trim().toUpperCase();

    if (!transferApplicable) {
        return { allowed: true, showBranchGrid: false, message: '' };
    }

    if (maintain === 'A') {
        return { allowed: true, showBranchGrid: false, message: '' };
    }

    if (!mainCompany && transferApplicable && maintain === 'Y') {
        return {
            allowed: false,
            showBranchGrid: false,
            message: 'Please Check ! Import Allowed in Main Branch Only'
        };
    }

    if (mainCompany && transferApplicable && maintain === 'N') {
        return {
            allowed: false,
            showBranchGrid: false,
            message: 'Please Check ! Import Allowed in Branch Only'
        };
    }

    if (mainCompany && transferApplicable && maintain === 'Y') {
        return { allowed: true, showBranchGrid: true, message: '' };
    }

    return { allowed: true, showBranchGrid: false, message: '' };
}

function hideImportBranchSection() {
    $('#impBranchSection').hide();
    $('#impBranchListContainer').empty();
}

function hideImportTransferBlocked() {
    $('#impTransferBlocked').hide().text('');
}

function showImportTransferBlocked(message) {
    hideImportBranchSection();
    $('#impTransferBlocked').text(message || '').show();
}

function syncBranchSelectionFromDom() {
    G_SelectedBranchCodes = [];
    $('#impBranchListContainer .imp-branch-item-check:checked').each(function () {
        var code = parseInt($(this).val(), 10);
        if (code > 0) G_SelectedBranchCodes.push(code);
    });
}

function updateBranchSelectAllCheckbox() {
    var $all = $('#chkSelectAllImportBranches');
    if (!$all.length || !G_BranchList.length) {
        if ($all.length) $all.prop('checked', false).prop('indeterminate', false);
                return;
            }
    var selectedCount = G_SelectedBranchCodes.length;
    $all.prop('checked', selectedCount === G_BranchList.length);
    $all.prop('indeterminate', selectedCount > 0 && selectedCount < G_BranchList.length);
}

function renderImportBranchGrid() {
    var $container = $('#impBranchListContainer');
    if (!G_BranchList.length) {
        $container.html('<p class="imp-branch-list-empty">No branches have Master Data Transfer enabled.</p>');
        updateBranchSelectAllCheckbox();
        return;
    }

    var selectedSet = {};
    (G_SelectedBranchCodes || []).forEach(function (code) {
        selectedSet[code] = true;
    });

    var html = G_BranchList.map(function (branch) {
        var code = parseInt(branch.Code ?? branch.CompanyCode ?? branch.code, 10) || 0;
        var name = branch.CompanyName ?? branch.ShortCompanyName ?? branch.name ?? ('Company ' + code);
        var checked = selectedSet[code] ? ' checked' : '';
        return '<label class="imp-branch-list-item">' +
            '<input type="checkbox" class="imp-branch-item-check" value="' + code + '"' + checked + ' />' +
            '<span>' + esc(name) + '</span>' +
            '</label>';
    }).join('');

    $container.html(html);
    syncBranchSelectionFromDom();
    updateBranchSelectAllCheckbox();
}

function shouldApplyBranchTransfer() {
    var sel = selectedTemplate();
    if (!sel) return false;
    var maintainMain = getMaintainMain(sel.item);
    if (maintainMain === 'A') return true;
    return G_ImportTransferRules.showBranchGrid === true;
}

function buildParameterCompanyCode() {
    if (!shouldApplyBranchTransfer()) return null;

    var sel = selectedTemplate();
    var maintainMain = sel ? getMaintainMain(sel.item) : 'Y';
    if (maintainMain === 'A') return '';

    syncBranchSelectionFromDom();
    if (!G_SelectedBranchCodes.length) return '-1';
    // Always send explicit FixedParameter codes (e.g. "1,3") — some transfer SPs skip when blank.
    return G_SelectedBranchCodes.join(',');
}

function refreshImportTransferContext() {
    var sel = selectedTemplate();
    hideImportTransferBlocked();
    hideImportBranchSection();

    if (!sel) {
        G_ImportTransferRules = { allowed: true, showBranchGrid: false, message: '' };
        G_BranchList = [];
        G_SelectedBranchCodes = [];
        return Promise.resolve();
    }

    var maintainMain = getMaintainMain(sel.item);
    if (maintainMain === 'A') {
        G_ImportTransferRules = { allowed: true, showBranchGrid: false, message: '' };
        G_BranchList = [];
        G_SelectedBranchCodes = [];
        return Promise.resolve();
    }

    if (maintainMain !== 'Y' && maintainMain !== 'N') {
        G_ImportTransferRules = { allowed: true, showBranchGrid: false, message: '' };
        G_BranchList = [];
        G_SelectedBranchCodes = [];
        return Promise.resolve();
    }

    return BranchDetailsFunction.getBranchInfo().then(function (branchInfo) {
        G_BranchInfo = branchInfo || {};
        G_ImportTransferRules = evaluateImportTransferRules(G_BranchInfo, maintainMain);

        if (!G_ImportTransferRules.allowed) {
            showImportTransferBlocked(G_ImportTransferRules.message);
            G_BranchList = [];
            G_SelectedBranchCodes = [];
            return;
        }

        if (!G_ImportTransferRules.showBranchGrid) {
            G_BranchList = [];
            G_SelectedBranchCodes = [];
        return;
    }

        return BranchDetailsFunction.GetTransferApplicableBranches().then(function (branches) {
            G_BranchList = asList(branches);
            G_SelectedBranchCodes = G_BranchList.map(function (branch) {
                return parseInt(branch.Code ?? branch.CompanyCode ?? branch.code, 10) || 0;
            }).filter(function (code) { return code > 0; });
            renderImportBranchGrid();
            $('#impBranchSection').show();
        });
    }).catch(function () {
        G_ImportTransferRules = { allowed: true, showBranchGrid: false, message: '' };
        toastr.warning('Unable to load branch transfer settings.');
    });
}

function validateImportTransferAllowed() {
    var sel = selectedTemplate();
    if (!sel) return true;

    var maintainMain = getMaintainMain(sel.item);
    if (maintainMain !== 'Y' && maintainMain !== 'N') return true;

    if (G_ImportTransferRules.allowed === false) {
        showImportTransferBlocked(G_ImportTransferRules.message);
        toastr.error(G_ImportTransferRules.message);
        return false;
    }
    return true;
}

function onImportTypeChange() {
    hideResult();
    resetGrid();

    if (hasImportFileSelected()) {
        var sel = selectedTemplate();
        if (!sel || !doesImportFileMatchTemplate(getCurrentImportFileName(), sel.item)) {
            clearImportFile(!!sel);
        }
    }

    refreshImportTransferContext().finally(updateButtons);
}

function mapColumns(response) {
    var list = asList(response);
    if (!list.length && response && response.Columns) list = asList(response.Columns);
    return list.map(function (col, idx) {
        var dataType = readMetaString(col, ['DataType', 'dataType', 'DATA_TYPE'], 'varchar').toLowerCase();
        var maxLen = readMetaInt(col, ['MaxLength', 'maxLength', 'MAXLENGTH', 'CharacterMaximumLength']);
        if (maxLen === -1) maxLen = null;
        if ((dataType === 'char' || dataType === 'nchar') && !maxLen) maxLen = 1;
        var nullableRaw = readMetaString(col, ['IsNullable', 'isNullable', 'IS_NULLABLE'], 'YES').toUpperCase();
        return {
            ColumnName: readMetaString(col, ['ColumnName', 'columnName', 'COLUMN_NAME'], ''),
            SortOrder: readMetaInt(col, ['SortOrder', 'sortOrder', 'SORTORDER']) || idx + 1,
            DataType: dataType,
            MaxLength: maxLen,
            IsNullable: nullableRaw === 'YES' || nullableRaw === 'Y'
        };
    }).filter(function (col) { return col.ColumnName; })
        .sort(function (a, b) { return a.SortOrder - b.SortOrder; });
}

function findColumnByAliases(aliases) {
    for (var i = 0; i < G_Columns.length; i++) {
        var nh = normalizeHeader(G_Columns[i].ColumnName);
        for (var a = 0; a < aliases.length; a++) {
            if (nh === normalizeHeader(aliases[a])) return G_Columns[i].ColumnName;
        }
    }
    return '';
}

function findRowByNo(rowNo) {
    return G_Rows.find(function (r) { return String(r.RowNo) === String(rowNo); });
}

function isRemarksColumn(colName) {
    return normalizeHeader(colName) === 'remarks';
}

function isExcelImportColumn(col) {
    return !isRemarksColumn(col.ColumnName);
}

function getDisplayColumnNames() {
    return G_Columns.slice()
        .sort(function (a, b) { return a.SortOrder - b.SortOrder; })
        .map(function (col) { return col.ColumnName; });
}

function getRowCellValue(row, colName) {
    if (!row) return '';
    if (row[colName] != null && row[colName] !== '') return row[colName];
    var nh = normalizeHeader(colName);
    var key = Object.keys(row).find(function (k) { return normalizeHeader(k) === nh; });
    return key ? row[key] : '';
}

function flattenImportRow(row) {
    var out = {};
    if (!row || typeof row !== 'object') return out;
    Object.keys(row).forEach(function (key) {
        if (normalizeHeader(key) === 'rowno') return;
        var val = row[key] == null ? '' : row[key];
        out[key] = typeof val === 'string' ? val : String(val);
    });
    return out;
}

function ensureGridColumnsFromRows(rows) {
    if (!rows.length) return;
    var existing = {};
    G_Columns.forEach(function (col) {
        existing[normalizeHeader(col.ColumnName)] = true;
    });
    Object.keys(rows[0]).forEach(function (key) {
        if (normalizeHeader(key) === 'rowno' || existing[normalizeHeader(key)]) return;
        G_Columns.push({
            ColumnName: key,
            SortOrder: 9998,
            DataType: 'varchar',
            MaxLength: null,
            IsNullable: true
        });
        existing[normalizeHeader(key)] = true;
    });
}

function isRowLocked(row) {
    return row && row._locked === true;
}

function isRowSelected(row) {
    return row && !isRowLocked(row) && row._selected !== false;
}

function getSelectableRows() {
    return G_Rows.filter(function (row) { return !isRowLocked(row); });
}

function getSelectedRows() {
    return G_Rows.filter(isRowSelected);
}

function setAllRowsSelected(checked) {
    G_Rows.forEach(function (row) {
        if (!isRowLocked(row)) row._selected = checked;
    });
}

function setRowStateAfterSave(row) {
    var hasRemark = !!trim(getRowCellValue(row, 'Remarks'));
    row._locked = !hasRemark;
    row._selected = hasRemark;
}

function updateSelectAllCheckbox() {
    var $all = $('#chkSelectAllImportGridHeader');
    if (!$all.length || !G_Rows.length) {
        if ($all.length) $all.prop('checked', false).prop('indeterminate', false);
        return;
    }
    var selectableCount = getSelectableRows().length;
    var selectedCount = getSelectedRows().length;
    $all.prop('checked', selectableCount > 0 && selectedCount === selectableCount);
    $all.prop('indeterminate', selectedCount > 0 && selectedCount < selectableCount);
}

function updateButtons() {
    var sel = selectedTemplate();
    var hasFile = !!($('#fileImportUpload')[0].files && $('#fileImportUpload')[0].files[0]);
    var hasRows = G_Rows.length > 0;
    var hasSelected = getSelectedRows().length > 0;
    var transferAllowed = G_ImportTransferRules.allowed !== false;
    $('#btnDownloadTemplate').prop('disabled', !sel || !transferAllowed);
    $('#btnImportData').prop('disabled', !sel || !hasFile || !!G_FileError || !transferAllowed);
    $('#btnSaveImportGrid').prop('disabled', !sel || !hasRows || !hasSelected || !transferAllowed);
    updateSelectAllCheckbox();
}

function resetGrid() {
    G_Columns = [];
    G_Rows = [];
    $('#impGridSection').hide();
    $('#table-header-ImportData, #table-body-ImportData, #paginator-ImportData').empty();
    updateButtons();
}

function showResult(title, body, isError) {
    $('#impResultTitle').text(title || '');
    $('#impResultBody').text(body || '');
    $('#impResultPanel').css({
        borderColor: isError ? '#f5c2c7' : '#badbcc',
        background: isError ? '#f8d7da' : '#d1e7dd'
    }).show();
}

function hideResult() {
    $('#impResultPanel').hide();
    $('#impResultTitle, #impResultBody').text('');
}

function countSaveResults(rows) {
    var success = 0;
    var failed = 0;
    (rows || []).forEach(function (row) {
        if (trim(getRowCellValue(row, 'Remarks'))) failed++;
        else success++;
    });
    return { success: success, failed: failed };
}

function buildSaveSummaryMessage(result, fallbackMsg, ok) {
    var success = result.success;
    var failed = result.failed;
    if (failed > 0) {
        return success + ' record(s) saved successfully and ' + failed + ' record(s) could not be saved.';
    }
    if (success > 0) {
        return success + ' record(s) saved successfully.';
    }
    return fallbackMsg || (ok ? 'Saved successfully.' : 'Save failed.');
}

function countSaveResultsFromServerRows(serverRows) {
    return countSaveResults(asList(serverRows).map(flattenImportRow));
}

function applySaveResponseRows(serverRows, submittedRows) {
    var list = asList(serverRows).map(flattenImportRow);
    if (!list.length) return false;
    ensureGridColumnsFromRows(list);

    if (submittedRows && submittedRows.length && G_Rows.length > submittedRows.length) {
        list.forEach(function (flat, idx) {
            var localRow = submittedRows[idx];
            if (!localRow) return;
            Object.keys(flat).forEach(function (key) {
                localRow[key] = flat[key];
            });
            setRowStateAfterSave(localRow);
        });
        return true;
    }

    G_Rows = list.map(function (row, idx) {
        row.RowNo = idx + 1;
        setRowStateAfterSave(row);
        return row;
    });
    return true;
}

function isDrCrColumn(col) {
    return normalizeHeader(col.ColumnName) === 'dr_cr';
}

function isYnFlagColumn(col) {
    if (isDrCrColumn(col)) return false;
    if (YN_FLAG_COLUMN_KEYS[normalizeHeader(col.ColumnName)]) return true;
    return col.MaxLength === 1;
}

function isItemGstRateColumn(col) {
    if (!col) return false;
    var nh = normalizeHeader(col.ColumnName);
    for (var i = 0; i < ITEM_GST_ALIASES.length; i++) {
        if (nh === normalizeHeader(ITEM_GST_ALIASES[i])) return true;
    }
    return false;
}

function formatItemGstRateForSave(value, dataType) {
    var text = trim(value).replace(/%/g, '').replace(/,/g, '');
    if (!text) return '';
    var num = parseFloat(text);
    if (isNaN(num)) return '';
    var dt = String(dataType || '').toLowerCase();
    if (dt.indexOf('int') >= 0) {
        if (num > 0 && num <= 1) return String(Math.round(num * 100));
        return String(Math.round(num));
    }
    if (num > 0 && num <= 1) return String(num);
    if (num > 1 && num <= 100) return String(num / 100);
    return String(num);
}

function prepareItemMasterSaveRows(rows) {
    var gstCol = findColumnByAliases(ITEM_GST_ALIASES);
    var gstMeta = gstCol ? G_Columns.find(function (c) { return c.ColumnName === gstCol; }) : null;
    var opCol = findColumnByAliases(ITEM_OPBAL_ALIASES);
    return rows.map(function (row) {
        var copy = Object.assign({}, row);
        if (gstCol && trim(copy[gstCol])) {
            copy[gstCol] = formatItemGstRateForSave(copy[gstCol], gstMeta ? gstMeta.DataType : 'int');
        }
        if (opCol) {
            var op = parseFloat(String(copy[opCol] || '').replace(/,/g, ''));
            if (isNaN(op) || op <= 0) copy[opCol] = '';
        }
        return copy;
    });
}

function prepareEmployeeMasterSaveRows(rows) {
    var esiCol = findColumnByAliases(EMP_ESINO_ALIASES);
    if (!esiCol) return rows;
    return rows.map(function (row) {
        var copy = Object.assign({}, row);
        if (!trim(copy[esiCol] || '')) copy[esiCol] = '0';
        return copy;
    });
}

function applyAccountMasterFlagDefaults(rows, templateItem) {
    var flagCol = getAccountMasterFlagColumn(templateItem);
    if (!flagCol) return rows;
    return rows.map(function (row) {
        var copy = Object.assign({}, row);
        if (!trim(copy[flagCol])) copy[flagCol] = 'Y';
        return copy;
    });
}

function prepareRowsForSave(rows, templateItem) {
    var tbl = getTableName(templateItem);
    var out = rows;
    if (isAccountMasterTable(tbl)) out = applyAccountMasterFlagDefaults(out, templateItem);
    if (isItemMasterTable(tbl)) out = prepareItemMasterSaveRows(out);
    if (isEmployeeMasterTable(tbl)) out = prepareEmployeeMasterSaveRows(out);
    return out;
}

function isColumnNullable(col) {
    return String(col.IsNullable || 'YES').toUpperCase() === 'YES';
}

function isNumericDataType(dataType) {
    var dt = String(dataType || '').toLowerCase();
    return dt.indexOf('int') >= 0 || dt === 'float' || dt === 'real' || dt === 'decimal'
        || dt === 'numeric' || dt === 'money' || dt === 'smallmoney';
}

function isStringDataType(dataType) {
    var dt = String(dataType || '').toLowerCase();
    return dt === 'varchar' || dt === 'nvarchar' || dt === 'char' || dt === 'nchar'
        || dt === 'text' || dt === 'ntext';
}

function isDateTimeDataType(dataType) {
    var dt = String(dataType || '').toLowerCase();
    return dt === 'datetime' || dt === 'datetime2' || dt === 'smalldatetime' || dt === 'date';
}

function isIntegerDataType(dataType) {
    var dt = String(dataType || '').toLowerCase();
    return dt === 'int' || dt === 'bigint' || dt === 'smallint' || dt === 'tinyint';
}

function formatCellForSave(value, col) {
    var nullable = isColumnNullable(col);
    var text = trim(value);
    var dt = String(col.DataType || '').toLowerCase();
    var flagUpper;

    if (isItemGstRateColumn(col)) return formatItemGstRateForSave(value, col.DataType);

    if (isDrCrColumn(col)) {
        flagUpper = text.toUpperCase();
        return flagUpper === 'C' ? 'C' : 'D';
    }

    if (dt === 'bit' || dt === 'boolean') {
        if (!text) return nullable ? '' : '0';
        flagUpper = text.toUpperCase();
        if (flagUpper === '1' || flagUpper === 'Y' || flagUpper === 'YES' || flagUpper === 'TRUE') return '1';
        return '0';
    }

    if (isIntegerDataType(dt) || isNumericDataType(dt)) {
        if (!text) return nullable ? '' : '0';
        var numericText = text.replace(/,/g, '');
        if (numericText && !isNaN(numericText)) return numericText;
        return nullable ? '' : '0';
    }

    if (isDateTimeDataType(dt)) {
        if (!text) return '';
        return isNaN(Date.parse(text)) ? '' : text;
    }

    if (isYnFlagColumn(col)) {
        if (!text) return nullable ? '' : 'N';
        flagUpper = text.toUpperCase();
        if (flagUpper === 'Y' || flagUpper === '1') return 'Y';
        if (flagUpper === 'N' || flagUpper === '0') return 'N';
        return nullable ? '' : 'N';
    }

    if (isStringDataType(dt) || dt === 'text' || dt === 'ntext') return text;
    return text;
}

function shouldEmitSaveCellInXml(col, val, flagCol) {
    if (isDrCrColumn(col)) return true;
    if (flagCol && col.ColumnName === flagCol) return true;
    if (val !== '' && val != null) return true;
    return !isColumnNullable(col);
}

function buildSavePayload(templateCode, rows) {
    var sel = selectedTemplate();
    var flagCol = sel && sel.item ? getAccountMasterFlagColumn(sel.item) : null;
    var saveRows = prepareRowsForSave(rows, sel ? sel.item : null);

    var normalized = saveRows.map(function (row) {
        var out = {};
        G_Columns.forEach(function (col) {
            if (isRemarksColumn(col.ColumnName)) return;
            out[col.ColumnName] = formatCellForSave(row[col.ColumnName], col);
        });
        if (flagCol && !trim(out[flagCol])) out[flagCol] = 'Y';
        return out;
    });

    var xml = ['<ImportMasterData>'];
    normalized.forEach(function (row, idx) {
        xml.push('<Row i="' + (idx + 1) + '">');
        G_Columns.forEach(function (col) {
            if (isRemarksColumn(col.ColumnName)) return;
            var val = row[col.ColumnName];
            if (flagCol && col.ColumnName === flagCol && !trim(val)) val = 'Y';
            if (shouldEmitSaveCellInXml(col, val, flagCol)) {
                xml.push('<C n="' + esc(col.ColumnName) + '">' + esc(val == null ? '' : val) + '</C>');
            }
        });
        if (flagCol && !G_Columns.some(function (c) { return c.ColumnName === flagCol; })) {
            xml.push('<C n="' + esc(flagCol) + '">Y</C>');
        }
        xml.push('</Row>');
    });
    xml.push('</ImportMasterData>');

    var userCode = 0;
    try { userCode = JSON.parse(sessionStorage.getItem('authKey') || '{}').UserMaster_Code || 0; } catch (e) { }

    var code = parseInt(templateCode, 10) || 0;
    var payload = {
        ImportExportTemplateConfiguration_Code: code,
        UserMaster_Code: parseInt(userCode, 10) || 0,
        ImportMasterDataXml: xml.join('')
    };

    if (shouldApplyBranchTransfer()) {
        payload.BranchTransferRequested = true;
        payload.ParameterCompanyCode = buildParameterCompanyCode();
    }

    return payload;
}

function buildDataCellInput(row, colName) {
    if (isRowLocked(row)) {
        return '<span class="imp-cell-locked">' + esc(getRowCellValue(row, colName)) + '</span>';
    }
    return '<input type="text" class="imp-cell-input form-control form-control-sm box_border" '
        + 'data-field="' + esc(colName) + '" data-rowno="' + esc(row.RowNo) + '" '
        + 'value="' + esc(getRowCellValue(row, colName)) + '" autocomplete="off" />';
}

function buildGridCellHtml(row, colName) {
    if (isRemarksColumn(colName)) {
        var remark = trim(getRowCellValue(row, colName));
        var cls = remark ? 'imp-validation-remark text-danger' : 'imp-validation-remark';
        return '<span class="' + cls + '">' + esc(remark) + '</span>';
    }
    return buildDataCellInput(row, colName);
}

function buildRowSelectCheckboxHtml(row) {
    if (isRowLocked(row)) {
        return '<span class="imp-row-locked" title="Already saved"><i class="fa fa-lock" aria-hidden="true"></i></span>';
    }
    return '<input type="checkbox" class="imp-row-select" data-rowno="' + esc(String(row.RowNo)) + '"'
        + (isRowSelected(row) ? ' checked' : '') + ' aria-label="Select row" />';
}

function buildGridSelectAllCheckboxHtml() {
    var selectableCount = getSelectableRows().length;
    var selectedCount = getSelectedRows().length;
    var allChecked = selectableCount > 0 && selectedCount === selectableCount;
    return '<input type="checkbox" id="chkSelectAllImportGridHeader" class="imp-grid-select-all"'
        + (allChecked ? ' checked' : '') + ' title="Select all editable rows" aria-label="Select all editable rows" />';
}

function renderImportGrid() {
    var colNames = getDisplayColumnNames();
    var gridData = G_Rows.map(function (row) {
        var item = {};
        item[SELECT_COLUMN] = buildRowSelectCheckboxHtml(row);
        item[SERIAL_COLUMN] = String(row.RowNo);
        item.RowNo = row.RowNo;
        colNames.forEach(function (col) {
            item[col] = buildGridCellHtml(row, col);
        });
        return item;
    });
    $('#impGridSection').show();
    $('#table-header-ImportData, #table-body-ImportData, #paginator-ImportData').empty();
    BizsolCustomFilterGrid.CreateDataTable(
        'table-header-ImportData', 'table-body-ImportData', gridData,
        false, [], colNames, [], [], [], ['RowNo'],
        {}, false
    );
    $('#table-header-ImportData th').first()
        .empty()
        .addClass('imp-select-col-header')
        .html(buildGridSelectAllCheckboxHtml());
    updateButtons();
}

function syncGridToRows() {
    $('#table-body-ImportData .imp-cell-input').each(function () {
        var $input = $(this);
        var row = findRowByNo($input.data('rowno'));
        if (row) row[$input.data('field')] = $input.val();
    });
    $('#table-body-ImportData .imp-row-select').each(function () {
        var $cb = $(this);
        var row = findRowByNo($cb.data('rowno'));
        if (row && !isRowLocked(row)) row._selected = $cb.prop('checked');
    });
}

function loadTemplates() {
    Showloader();
    ImportExportService.GetImportTemplateConfigurationList()
        .then(function (response) {
            G_Templates = asList(response).filter(function (row) {
                return !row.IsActive || String(row.IsActive).toUpperCase() === 'Y';
            }).sort(function (a, b) {
                var sa = parseInt(a.SortOrder, 10) || 0;
                var sb = parseInt(b.SortOrder, 10) || 0;
                return sa !== sb ? sa - sb : templateLabel(a).localeCompare(templateLabel(b));
            });

            var $ddl = $('#ddlImportTemplate');
            if ($ddl.data('select2')) $ddl.select2('destroy');
            $ddl.empty().append('<option value="">-- Select Import Type --</option>');
            G_Templates.forEach(function (item, idx) {
                var code = String(item.Code || (idx + 1));
                $ddl.append('<option value="' + esc(code) + '">' + esc(templateLabel(item)) + '</option>');
            });

            if (!G_Templates.length) toastr.warning('No import types configured.');
            updateButtons();
        })
        .catch(function () {
            toastr.error('Failed to load import types.');
            G_Templates = [];
            $('#ddlImportTemplate').empty().append('<option value="">-- Select Import Type --</option>');
            updateButtons();
        })
        .finally(HideLoader);
}

function downloadXltx(headers, fileName) {
    if (typeof JSZip === 'undefined') {
        return Promise.reject(new Error('JSZip library is not loaded.'));
    }
    var headerRow = headers.map(trim).filter(Boolean);
    if (!headerRow.length) {
        return Promise.reject(new Error('No template columns found.'));
    }

    var cells = headerRow.map(function (header, index) {
        var n = index + 1;
        var letters = '';
        while (n > 0) {
            var m = (n - 1) % 26;
            letters = String.fromCharCode(65 + m) + letters;
            n = Math.floor((n - m) / 26);
        }
        return '<c r="' + letters + '1" t="inlineStr"><is><t>' + esc(header) + '</t></is></c>';
    }).join('');

    var zip = new JSZip();
    zip.file('[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + '<Default Extension="xml" ContentType="application/xml"/>'
        + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml"/>'
        + '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        + '</Types>');
    zip.file('_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        + '</Relationships>');
    zip.file('xl/workbook.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        + '<sheets><sheet name="Import" sheetId="1" r:id="rId1"/></sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
        + '</Relationships>');
    zip.file('xl/worksheets/sheet1.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        + '<sheetData><row r="1">' + cells + '</row></sheetData></worksheet>');

    return zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.template'
    }).then(function (blob) {
        var xltxBlob = blob.type
            ? blob
            : new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.template' });
        var url = window.URL.createObjectURL(xltxBlob);
        var a = document.createElement('a');
        a.href = url;
        a.download = normalizeXltxFileName(fileName, 'ImportTemplate');
        a.click();
        window.URL.revokeObjectURL(url);
        });
}

function onDownloadTemplate() {
    var sel = selectedTemplate();
    if (!sel) return toastr.warning('Please select an import type.');
    Showloader();
    ImportExportService.GetImportTemplateColumns(sel.code)
        .then(function (response) {
            var headers = mapColumns(response)
                .filter(isExcelImportColumn)
                .map(function (c) { return c.ColumnName; });
            return downloadXltx(headers, templateFileName(sel.item));
        })
        .then(function () { toastr.success('Template downloaded.'); })
        .catch(function (err) { toastr.error((err && err.message) || 'Failed to download template.'); })
        .finally(HideLoader);
}

function readExcel(file) {
    return new Promise(function (resolve, reject) {
        if (!file) return reject(new Error('Import file is required.'));
        if (typeof XLSX === 'undefined') return reject(new Error('XLSX library is not loaded.'));
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                var sheet = wb.Sheets[wb.SheetNames.indexOf('Import') >= 0 ? 'Import' : wb.SheetNames[0]];
                resolve(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false }).map(function (row) {
                    return (row || []).map(function (cell) { return trim(cell); });
                }));
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = function () { reject(new Error('Unable to read import file.')); };
        reader.readAsArrayBuffer(file);
    });
}

function parseExcelRows(sheetRows, columns) {
    if (!sheetRows || sheetRows.length <= 1) throw new Error('No data found in import file.');

    var headerRow = sheetRows[0] || [];
    var headerIndex = {};
    headerRow.forEach(function (cell, idx) {
        var key = normalizeHeader(cell);
        if (key && headerIndex[key] === undefined) headerIndex[key] = idx;
    });

    var missing = [];
    columns.forEach(function (col) {
        if (!isExcelImportColumn(col)) return;
        if (headerIndex[normalizeHeader(col.ColumnName)] === undefined) {
            missing.push(col.ColumnName);
        }
    });

    if (missing.length) {
        var found = headerRow.map(trim).filter(Boolean);
        throw new Error(
            'Incorrect template. Missing columns: ' + missing.join(', ')
            + '. Found in file: ' + (found.length ? found.join(', ') : '(none)')
            + '. Download a fresh template if you renamed the import table.'
        );
    }

    var rows = [];
    for (var r = 1; r < sheetRows.length; r++) {
        var dataRow = sheetRows[r] || [];
        var row = {};
        var hasValue = false;
        columns.forEach(function (col) {
            var idx = headerIndex[normalizeHeader(col.ColumnName)];
            var val = idx !== undefined ? trim(dataRow[idx]) : '';
            if (isExcelImportColumn(col) && val) hasValue = true;
            row[col.ColumnName] = val;
        });
        if (hasValue) {
            row.RowNo = rows.length + 1;
            row._selected = true;
            row._locked = false;
            rows.push(row);
        }
    }
    if (!rows.length) throw new Error('No data found in import file.');
    return rows;
}

function onImportData() {
    var sel = selectedTemplate();
    var file = $('#fileImportUpload')[0].files && $('#fileImportUpload')[0].files[0];
    if (!sel) return toastr.warning('Please select an import type.');
    if (!validateImportTransferAllowed()) return;
    if (!file) return toastr.warning('Please choose an import file.');
    if (G_FileError) return toastr.warning(G_FileError);

    hideResult();
    resetGrid();
    Showloader();
    var importLoaderTimeout = setTimeout(HideLoader, 30000);
    ImportExportService.GetImportTemplateColumns(sel.code)
        .then(function (response) {
            G_Columns = mapColumns(response);
            return readExcel(file).then(function (sheetRows) {
                G_Rows = parseExcelRows(sheetRows, G_Columns);
            });
        })
        .then(function () {
                    renderImportGrid();
                    toastr.success('Import data loaded. Review and edit rows, then click Save Import.');
        })
        .catch(function (err) {
            var msg = (err && err.message) || 'Unable to import file.';
            if (msg.toLowerCase().indexOf('incorrect template') >= 0) {
                resetGrid();
                hideResult();
                showResult('Incorrect template', msg, true);
            }
            toastr.error(msg);
        })
        .finally(function () {
            clearTimeout(importLoaderTimeout);
            HideLoader();
        });
}

function onSaveImportGrid() {
    var sel = selectedTemplate();
    if (!sel) return toastr.warning('Please select an import type.');
    if (!validateImportTransferAllowed()) return;

    syncGridToRows();
    if (!G_Rows.length) return toastr.warning('No data to save.');

    var selectedRows = getSelectedRows();
    if (!selectedRows.length) return toastr.warning('Please select at least one row to save.');

    Showloader();
    ImportExportService.SaveImportMasterData(buildSavePayload(sel.code, selectedRows))
        .then(function (response) {
            var ok = String((response && (response.Status || response.status)) || '').toUpperCase() === 'Y';
            var msg = (response && (response.Msg || response.msg || response.Message)) || (ok ? 'Saved successfully.' : 'Save failed.');
            var importRows = asList(response && (response.ImportRows || response.importRows));

            var gridUpdated = importRows.length && applySaveResponseRows(importRows, selectedRows);
            if (gridUpdated) {
                    renderImportGrid();
            } else if (ok && !importRows.length) {
                console.warn('SaveImportMasterData returned no ImportRows for grid refresh.');
            }

            var saveResult = importRows.length ? countSaveResultsFromServerRows(importRows) : null;
            var summaryMsg = saveResult
                ? buildSaveSummaryMessage(saveResult, msg, ok)
                : msg;

            if (saveResult && saveResult.failed > 0) {
                showResult(
                    'Validation remarks',
                    summaryMsg + ' Rows with errors stay selected. Successfully saved rows are locked.',
                    true
                );
                toastr.warning(summaryMsg);
            } else if (saveResult && saveResult.success > 0) {
                showResult('Save completed', summaryMsg, false);
                toastr.success(summaryMsg);
            } else if (ok) {
                showResult('Save completed', summaryMsg, false);
                toastr.success(summaryMsg);
            } else {
                showResult('Save failed', summaryMsg, true);
                toastr.error(summaryMsg);
            }
        })
        .catch(function (err) {
            var msg = 'Save request failed.';
            if (err && err.xhr && err.xhr.responseJSON) msg = err.xhr.responseJSON.Msg || err.xhr.responseJSON.msg || msg;
            else if (err && err.message) msg = err.message;
            toastr.error(msg);
        })
        .finally(HideLoader);
}

$('#ERPHeading').text('Import');

$(document).ready(function () {
    $('#ddlImportTemplate').on('change', onImportTypeChange);

    $('#impFileField').on('click', function () {
        $('#fileImportUpload').trigger('click');
    });

    $('#fileImportUpload').on('change', function () {
        var file = this.files && this.files[0];
        $('#lblImportFileName').text(file ? file.name : 'No file chosen').toggleClass('is-empty', !file);

        hideResult();
        resetGrid();
        G_FileError = '';
        $('#impFileValidation').hide().text('');
        $('#impFileField').removeClass('imp-file-invalid');

        if (file) {
            var ext = (file.name.split('.').pop() || '').toLowerCase();
            if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'xltx') {
                G_FileError = 'Please choose a valid Excel file (.xltx, .xlsx or .xls).';
                $('#impFileValidation').text(G_FileError).show();
                $('#impFileField').addClass('imp-file-invalid');
                toastr.warning(G_FileError);
            }
        }
        updateButtons();
    });

    $('#btnDownloadTemplate').on('click', onDownloadTemplate);
    $('#btnImportData').on('click', onImportData);
    $('#btnSaveImportGrid').on('click', onSaveImportGrid);

    $(document).on('change', '#chkSelectAllImportGridHeader', function () {
        setAllRowsSelected($(this).prop('checked'));
        renderImportGrid();
    });

    $(document).on('change', '#table-body-ImportData .imp-row-select', function () {
        var row = findRowByNo($(this).data('rowno'));
        if (row && !isRowLocked(row)) row._selected = $(this).prop('checked');
        updateButtons();
    });

    $(document).on('change blur', '#table-body-ImportData .imp-cell-input', function () {
        var row = findRowByNo($(this).data('rowno'));
        if (row) row[$(this).data('field')] = $(this).val();
    });

    $(document).on('change', '#chkSelectAllImportBranches', function () {
        var checked = $(this).prop('checked');
        $('#impBranchListContainer .imp-branch-item-check').prop('checked', checked);
        syncBranchSelectionFromDom();
        updateBranchSelectAllCheckbox();
    });

    $(document).on('change', '#impBranchListContainer .imp-branch-item-check', function () {
        syncBranchSelectionFromDom();
        updateBranchSelectAllCheckbox();
    });

    loadTemplates();
});
