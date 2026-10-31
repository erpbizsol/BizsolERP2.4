import { AssetTypeMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/AssetTypeMasterService.js';
import { MaintenanceTypeMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MaintenanceTypeMasterService.js';
import { AssetGroupMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/AssetGroupMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BranchDetailsFunction } from '../../Bizsol.WebERP.UI.Shared/js/BranchdetailsFunction.js';

var G_List = [];
var G_DeleteCode = 0;
var G_EditCode = 0;
var G_IsMainCompany = false;
var G_AllowNew = true;
var G_AllowEdit = true;
var G_AllowDelete = true;
var G_VerifyInProgress = false;
var G_SaveInProgress = false;
var G_MaintenanceTypes = [];
var G_PlanningOptions = [];
var G_DepreciationMethods = [];
var G_AssetGroups = [];
var G_PreservedMaxValue = 0;
var DETAIL_ROW_ID = 0;
var TITLE_BRANCH_NEW = 'Adding a new Asset Type is not allowed for this branch.';
var TITLE_BRANCH_EDIT = 'Editing is not allowed for this branch.';
var MODULE_NAME = 'Asset Type Master';

function getModuleName() {
    try {
        var fromUrl = new URLSearchParams(window.location.search).get('ModuleDesp');
        if (fromUrl && fromUrl.trim()) return decodeURIComponent(fromUrl.trim());
    } catch (e) { /* fallback */ }
    return MODULE_NAME;
}

function normalizeList(response) {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.$values)) return response.$values;
    if (Array.isArray(response.data)) return response.data;
    return [];
}

function firstArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload.$values && Array.isArray(payload.$values)) return payload.$values;
    return [];
}

function firstRecord(payload) {
    if (!payload) return null;
    if (Array.isArray(payload)) return payload.length ? payload[0] : null;
    if (payload.$values && Array.isArray(payload.$values)) return payload.$values.length ? payload.$values[0] : null;
    if (typeof payload === 'object') return payload;
    return null;
}

function unwrapAssetTypeGet(res) {
    var root = res;
    if (root && root.data && typeof root.data === 'object' && !Array.isArray(root.data)) root = root.data;
    var headerNode = root && (root.Header || root.header);
    var detailNode = root && (root.Details || root.details);
    return {
        header: firstRecord(headerNode) || firstRecord(root),
        details: firstArray(detailNode)
    };
}

function getRecordCode(item) {
    if (!item) return 0;
    var c = item.Code != null ? item.Code : item.code;
    if (c == null || c === '') return 0;
    var n = parseInt(c, 10);
    return isNaN(n) ? 0 : n;
}

function findListRowByCode(code) {
    var id = parseInt(code, 10) || 0;
    if (!id || !G_List.length) return null;
    for (var i = 0; i < G_List.length; i++) {
        if (getRecordCode(G_List[i]) === id) return G_List[i];
    }
    return null;
}

function getField(row, camel, pascal) {
    if (!row) return '';
    if (row[pascal] != null && row[pascal] !== '') return row[pascal];
    if (row[camel] != null && row[camel] !== '') return row[camel];
    return '';
}

function getDepreciationMethodForGrid(item) {
    if (!item) return '';
    var keys = ['DepreciationMethod', 'depreciationMethod', 'DepMethod', 'depMethod'];
    for (var i = 0; i < keys.length; i++) {
        var v = item[keys[i]];
        if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

function getAssetGroupNameForGrid(item) {
    if (!item) return '';
    var keys = ['AssetGroupName', 'assetGroupName', 'Asset Group Name'];
    for (var i = 0; i < keys.length; i++) {
        var v = item[keys[i]];
        if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

function checkRight(optionName, showMsg) {
    var show = showMsg == null ? 'Y' : showMsg;
    return MenuService.CheckModuleOptionRight(getModuleName(), optionName, show, BizSolHelperFunction.getFinancialYear())
        .then(function (response) {
            if (response && response.CheckModuleOptionRight === 'N') {
                if (show === 'Y') toastr.error(response.Msg || ('No rights for ' + optionName));
                return false;
            }
            return true;
        })
        .catch(function () {
            if (show === 'Y') toastr.error('Unable to verify module rights.');
            return false;
        });
}

function checkVerifyRight() {
    return checkRight('Verify', 'N').then(function (hasVerify) {
        if (hasVerify) return true;
        return checkRight('Edit');
    });
}

function formatAjaxError(err, fallback) {
    var detail = fallback || 'Request failed.';
    if (err && err.xhr && err.xhr.responseText) detail = String(err.xhr.responseText).trim().substring(0, 400);
    else if (err && err.message) detail = err.message;
    return detail;
}

function isApiStatusYes(response) {
    if (!response) return false;
    var status = response.Status != null ? response.Status : response.status;
    return String(status || '').trim().toUpperCase() === 'Y';
}

function getApiMessage(response, fallback) {
    if (!response) return fallback || '';
    return (response.Msg != null ? response.Msg : response.msg) || fallback || '';
}

function isRecordVerified(item) {
    if (!item) return false;
    var v = item.Verify != null ? item.Verify : item.verify;
    return String(v || 'N').trim().toUpperCase() === 'Y';
}

function disableBrowserFieldSuggestions($fields) {
    $fields.attr('autocomplete', 'off').attr('readonly', 'readonly');
    $fields.on('focus', function () { $(this).removeAttr('readonly'); });
}

// ——— List / entry panels ———

function showAssetTypeList() {
    $('#atEntryPanel').hide();
    $('#atListPanel').show();
    G_EditCode = 0;
    if (window.history && window.history.replaceState) {
        var params = new URLSearchParams(window.location.search);
        params.delete('Code');
        var qs = params.toString();
        window.history.replaceState({}, '', window.location.pathname + (qs ? '?' + qs : ''));
    }
}

function resetEntryPanelDom() {
    destroySelect2IfAny($('#ddlDepreciationMethod'));
    destroySelect2IfAny($('#ddlAssetGroup'));
    $('#assetTypeDetailBody tr').each(function () {
        var $row = $(this);
        destroySelect2IfAny($row.find('.js-maint-type'));
        destroySelect2IfAny($row.find('.js-maint-plan'));
    });
    $('#assetTypeDetailBody').empty();
    $('#txtAssetTypeName, #txtDepreciationPercentage, #txtPrefix').val('').removeClass('at-input-error');
    $('#err_AssetTypeName, #err_DepPercentage, #err_DepMethod, #err_Prefix, #err_AssetGroup').hide();
    G_PreservedMaxValue = 0;
    DETAIL_ROW_ID = 0;
}

function applyEntrySaveRightsToUI() {
    var isEdit = G_EditCode > 0;
    var $btn = $('#btnSaveEntry');
    if ((isEdit && !G_AllowEdit) || (!isEdit && !G_AllowNew)) {
        $btn.prop('disabled', true).attr('title', isEdit ? TITLE_BRANCH_EDIT : TITLE_BRANCH_NEW);
    } else {
        $btn.prop('disabled', false).removeAttr('title');
    }
}

function showAssetTypeEntry(code) {
    G_EditCode = parseInt(code, 10) || 0;
    var isEdit = G_EditCode > 0;
    $('#entryPageTitle').text(isEdit ? 'Edit Asset Type' : 'New Asset Type');
    $('#btnSaveEntryText').text(isEdit ? 'Update' : 'Save');
    resetEntryPanelDom();
    $('#atListPanel').hide();
    $('#atEntryPanel').hide();
    applyEntrySaveRightsToUI();
    return loadAssetTypeEntryForm().then(function () {
        $('#atEntryPanel').show();
    });
}

function pickHeader(response) {
    var unwrapped = unwrapAssetTypeGet(response);
    if (unwrapped.header) return unwrapped.header;
    if (!response) return null;
    var fromBag = firstArray(response.Header || response.header);
    if (fromBag.length) return fromBag[0];
    var top = normalizeList(response);
    if (top.length && (top[0].AssetTypeName != null || top[0].assetTypeName != null || getRecordCode(top[0]) > 0)) {
        return top[0];
    }
    return null;
}

function pickDetails(response) {
    var unwrapped = unwrapAssetTypeGet(response);
    if (unwrapped.details.length) return unwrapped.details;
    if (!response) return [];
    return firstArray(response.Details || response.details);
}

function detailFieldInt(row, pascal, camel) {
    if (!row || typeof row !== 'object') return 0;
    var v = row[pascal] != null ? row[pascal] : row[camel];
    if (v == null || v === '') return 0;
    var n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
}

function detailFieldText(row, pascal, camel) {
    if (!row) return '';
    var v = row[pascal] != null ? row[pascal] : row[camel];
    return v == null ? '' : String(v).trim();
}

function getMaintenanceTypeName(code) {
    var id = parseInt(code, 10) || 0;
    for (var i = 0; i < G_MaintenanceTypes.length; i++) {
        if (parseInt(G_MaintenanceTypes[i].Code, 10) === id) {
            return (
                G_MaintenanceTypes[i].MaintenanceTypeName
                || G_MaintenanceTypes[i].maintenanceTypeName
                || G_MaintenanceTypes[i]['Maintenance Type Name']
                || ''
            ).trim();
        }
    }
    return '';
}

function commonOptionValue(row) {
    if (row == null) return '';
    if (typeof row === 'string') return row.trim();
    return String(row.Value != null ? row.Value : row.value || '').trim();
}

function destroySelect2IfAny($el) {
    if (!$el || !$el.length) return;
    if ($el.data('select2')) {
        try { $el.select2('destroy'); } catch (e) { /* ignore */ }
    }
}

function initSearchableSelect($el, placeholder) {
    if (!$el || !$el.length || typeof $.fn.select2 !== 'function') return;
    destroySelect2IfAny($el);
    $el.select2({
        width: '100%',
        placeholder: placeholder || '-- Select --',
        allowClear: true,
        minimumResultsForSearch: 0
    });
}

function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
}

function clearDetailDuplicateMarks() {
    $('#assetTypeDetailBody .js-maint-type').each(function () {
        var $sel = $(this);
        $sel.removeClass('at-input-error');
        $sel.next('.select2-container').removeClass('at-input-error');
    });
}

function findDuplicateMaintenanceTypeCodes() {
    var seen = {};
    var dupes = {};
    $('#assetTypeDetailBody tr').each(function () {
        var code = parseInt($(this).find('.js-maint-type').val(), 10) || 0;
        if (code <= 0) return;
        if (seen[code]) dupes[code] = true;
        else seen[code] = true;
    });
    return dupes;
}

function markDuplicateMaintenanceTypes(showToast) {
    clearDetailDuplicateMarks();
    var dupes = findDuplicateMaintenanceTypeCodes();
    var keys = Object.keys(dupes);
    if (!keys.length) return false;
    var firstName = '';
    $('#assetTypeDetailBody tr').each(function () {
        var code = parseInt($(this).find('.js-maint-type').val(), 10) || 0;
        if (code > 0 && dupes[code]) {
            var $sel = $(this).find('.js-maint-type');
            $sel.addClass('at-input-error');
            $sel.next('.select2-container').addClass('at-input-error');
            if (!firstName) firstName = getMaintenanceTypeName(code) || ('Code ' + code);
        }
    });
    if (showToast) {
        toastr.warning(firstName
            ? ('Duplicate Maintenance Type Name is not allowed: "' + firstName + '".')
            : 'Duplicate Maintenance Type Name is not allowed.');
    }
    return true;
}

function validateDetails() {
    return !markDuplicateMaintenanceTypes(true);
}

function isDetailRowMaintenanceTypeFilled($tr) {
    return (parseInt($tr.find('.js-maint-type').val(), 10) || 0) > 0;
}

function markDetailRowMaintenanceError($tr, on) {
    var $sel = $tr.find('.js-maint-type');
    if (on) {
        $sel.addClass('at-input-error');
        $sel.next('.select2-container').addClass('at-input-error');
    } else {
        $sel.removeClass('at-input-error');
        $sel.next('.select2-container').removeClass('at-input-error');
    }
}

function canAddDetailRow(showToast) {
    var $rows = $('#assetTypeDetailBody tr');
    if (!$rows.length) return true;
    var $last = $rows.last();
    if (isDetailRowMaintenanceTypeFilled($last)) {
        markDetailRowMaintenanceError($last, false);
        return true;
    }
    markDetailRowMaintenanceError($last, true);
    if (showToast) toastr.warning('Please select Maintenance Type Name in the current row before adding a new row.');
    return false;
}

function tryAddDetailRow() {
    if (!canAddDetailRow(true)) return;
    addDetailRow(null);
}

function buildMaintenanceSelect(selectedCode, selectedName) {
    var sel = parseInt(selectedCode, 10) || 0;
    var labelHint = (selectedName || '').trim();
    var html = '<select class="at-input js-maint-type js-search-select"><option value="">-- Select --</option>';
    var found = false;
    for (var i = 0; i < G_MaintenanceTypes.length; i++) {
        var m = G_MaintenanceTypes[i];
        var c = parseInt(m.Code, 10) || 0;
        var name = m.MaintenanceTypeName || m.maintenanceTypeName || m['Maintenance Type Name'] || '';
        var desp = m.DESP || m.desp || m.Desp || '';
        if (c === sel) found = true;
        html += '<option value="' + c + '" data-desp="' + escapeAttr(desp) + '"' + (c === sel ? ' selected' : '') + '>' + escapeHtml(name) + '</option>';
    }
    if (sel > 0 && !found) {
        var fallbackName = labelHint || getMaintenanceTypeName(sel) || ('Maintenance Type ' + sel);
        html += '<option value="' + sel + '" selected>' + escapeHtml(fallbackName) + '</option>';
    }
    html += '</select>';
    return html;
}

function buildPlanningSelect(selected) {
    var val = (selected || '').trim();
    var html = '<select class="at-input js-maint-plan js-search-select"><option value="">-- Select --</option>';
    var found = false;
    for (var i = 0; i < G_PlanningOptions.length; i++) {
        var o = commonOptionValue(G_PlanningOptions[i]);
        if (!o) continue;
        if (o === val) found = true;
        html += '<option value="' + escapeAttr(o) + '"' + (o === val ? ' selected' : '') + '>' + escapeHtml(o) + '</option>';
    }
    if (val && !found) {
        html += '<option value="' + escapeAttr(val) + '" selected>' + escapeHtml(val) + '</option>';
    }
    html += '</select>';
    return html;
}

function addDetailRow(rowData) {
    DETAIL_ROW_ID += 1;
    var rid = DETAIL_ROW_ID;
    var data = rowData || {};
    var maintCode = detailFieldInt(data, 'MaintenanceTypeMaster_Code', 'maintenanceTypeMaster_Code');
    var maintName = detailFieldText(data, 'MaintenanceTypeName', 'maintenanceTypeName');
    var plan = detailFieldText(data, 'MaintenancePlanning', 'maintenancePlanning');
    var desp = detailFieldText(data, 'Desp', 'desp');
    var remarks = detailFieldText(data, 'Remarks', 'remarks');
    var tr = ''
        + '<tr data-row-id="' + rid + '">'
        + '<td>' + buildMaintenanceSelect(maintCode, maintName) + '</td>'
        + '<td>' + buildPlanningSelect(plan) + '</td>'
        + '<td><input type="text" class="at-input js-desp" maxlength="500" autocomplete="off" value="' + escapeAttr(desp) + '" /></td>'
        + '<td><input type="text" class="at-input js-remark" maxlength="500" autocomplete="off" value="' + escapeAttr(remarks) + '" /></td>'
        + '<td style="text-align:center"><button type="button" class="at-btn-del-row js-del-detail" title="Delete row"><i class="fas fa-trash-can"></i></button></td>'
        + '</tr>';
    $('#assetTypeDetailBody').append(tr);
    var $row = $('#assetTypeDetailBody tr[data-row-id="' + rid + '"]');
    var $maintSel = $row.find('.js-maint-type');
    var $planSel = $row.find('.js-maint-plan');
    initSearchableSelect($maintSel, '-- Select --');
    initSearchableSelect($planSel, '-- Select --');
    if (maintCode > 0) $maintSel.val(String(maintCode)).trigger('change.select2');
    if (plan) $planSel.val(plan).trigger('change.select2');
    $row.find('.js-maint-type').on('change select2:select', function () {
        markDetailRowMaintenanceError($row, false);
        var opt = $(this).find('option:selected');
        var autoDesp = opt.data('desp') || opt.attr('data-desp') || '';
        if (autoDesp) $row.find('.js-desp').val(autoDesp);
        markDuplicateMaintenanceTypes(true);
    });
    $row.find('.js-del-detail').on('click', function () {
        destroySelect2IfAny($row.find('.js-maint-type'));
        destroySelect2IfAny($row.find('.js-maint-plan'));
        $row.remove();
        markDuplicateMaintenanceTypes(false);
    });
    disableBrowserFieldSuggestions($row.find('.js-desp, .js-remark'));
}

function getAssetGroupName(item) {
    if (!item) return '';
    return (item.AssetGroupName || item.assetGroupName || item['Asset Group Name'] || '').trim();
}

function bindAssetGroupDropdown(selectedCode) {
    var $ddl = $('#ddlAssetGroup');
    destroySelect2IfAny($ddl);
    var sel = parseInt(selectedCode, 10) || 0;
    var html = '<option value="">-- Select --</option>';
    var found = false;
    for (var i = 0; i < G_AssetGroups.length; i++) {
        var g = G_AssetGroups[i];
        var c = parseInt(g.Code, 10) || 0;
        if (c <= 0) continue;
        var name = getAssetGroupName(g);
        if (!name) name = 'Asset Group ' + c;
        if (c === sel) found = true;
        html += '<option value="' + c + '"' + (c === sel ? ' selected' : '') + '>' + escapeHtml(name) + '</option>';
    }
    if (sel > 0 && !found) {
        html += '<option value="' + sel + '" selected>Asset Group ' + sel + '</option>';
    }
    $ddl.html(html);
    initSearchableSelect($ddl, '-- Select --');
    if (sel > 0) $ddl.val(String(sel)).trigger('change.select2');
}

function bindDepreciationMethodDropdown(selectedValue) {
    var $ddl = $('#ddlDepreciationMethod');
    destroySelect2IfAny($ddl);
    var val = (selectedValue || '').trim();
    var html = '<option value="">-- Select --</option>';
    var found = false;
    for (var i = 0; i < G_DepreciationMethods.length; i++) {
        var o = commonOptionValue(G_DepreciationMethods[i]);
        if (!o) continue;
        if (o === val) found = true;
        html += '<option value="' + escapeAttr(o) + '"' + (o === val ? ' selected' : '') + '>' + escapeHtml(o) + '</option>';
    }
    if (val && !found) {
        html += '<option value="' + escapeAttr(val) + '" selected>' + escapeHtml(val) + '</option>';
    }
    $ddl.html(html);
    initSearchableSelect($ddl, '-- Select --');
    if (val) $ddl.val(val).trigger('change.select2');
}

function collectDetails() {
    var rows = [];
    $('#assetTypeDetailBody tr').each(function () {
        var $tr = $(this);
        var maintCode = parseInt($tr.find('.js-maint-type').val(), 10) || 0;
        if (maintCode <= 0) return;
        rows.push({
            MaintenanceTypeMaster_Code: maintCode,
            MaintenancePlanning: ($tr.find('.js-maint-plan').val() || '').trim(),
            Desp: ($tr.find('.js-desp').val() || '').trim(),
            Remarks: ($tr.find('.js-remark').val() || '').trim()
        });
    });
    return rows;
}

function fillHeader(row) {
    $('#txtAssetTypeName').val(row.AssetTypeName || row.assetTypeName || '');
    $('#txtDepreciationPercentage').val(row.DepreciationPercentage != null ? row.DepreciationPercentage : '');
    G_PreservedMaxValue = row.MaxValue != null ? (parseInt(row.MaxValue, 10) || 0) : 0;
    bindDepreciationMethodDropdown(row.DepreciationMethod || row.depreciationMethod || '');
    $('#txtPrefix').val(row.Prefix || row.prefix || '');
    var agCode = row.AssetGroupMaster_Code != null ? row.AssetGroupMaster_Code : row.assetGroupMaster_Code;
    bindAssetGroupDropdown(agCode);
}

function validateHeader() {
    var ok = true;
    $('#err_AssetTypeName, #err_DepPercentage, #err_DepMethod, #err_Prefix, #err_AssetGroup').hide();
    $('#txtAssetTypeName, #txtDepreciationPercentage, #txtPrefix, #ddlDepreciationMethod, #ddlAssetGroup').removeClass('at-input-error');
    $('#ddlDepreciationMethod, #ddlAssetGroup').next('.select2-container').removeClass('at-input-error');
    if (!$('#txtAssetTypeName').val().trim()) {
        $('#err_AssetTypeName').show();
        $('#txtAssetTypeName').addClass('at-input-error');
        ok = false;
    }
    var depPctRaw = ($('#txtDepreciationPercentage').val() || '').trim();
    if (depPctRaw === '' || isNaN(parseFloat(depPctRaw))) {
        $('#err_DepPercentage').show();
        $('#txtDepreciationPercentage').addClass('at-input-error');
        ok = false;
    }
    if (!($('#ddlDepreciationMethod').val() || '').trim()) {
        $('#err_DepMethod').show();
        $('#ddlDepreciationMethod').addClass('at-input-error');
        $('#ddlDepreciationMethod').next('.select2-container').addClass('at-input-error');
        ok = false;
    }
    if (!$('#txtPrefix').val().trim()) {
        $('#err_Prefix').show();
        $('#txtPrefix').addClass('at-input-error');
        ok = false;
    }
    if ((parseInt($('#ddlAssetGroup').val(), 10) || 0) <= 0) {
        $('#err_AssetGroup').show();
        $('#ddlAssetGroup').addClass('at-input-error');
        $('#ddlAssetGroup').next('.select2-container').addClass('at-input-error');
        ok = false;
    }
    return ok;
}

function loadMaintenanceTypes() {
    return MaintenanceTypeMasterService.GetMaintenanceTypeMasterList().then(function (response) {
        G_MaintenanceTypes = normalizeList(response);
    }).catch(function () {
        G_MaintenanceTypes = [];
        toastr.warning('Could not load Maintenance Type list.');
    });
}

function loadMaintenancePlanningOptions() {
    return AssetTypeMasterService.GetMaintenancePlanningList().then(function (response) {
        G_PlanningOptions = normalizeList(response);
    }).catch(function () {
        G_PlanningOptions = [];
        toastr.warning('Could not load Maintenance planning options.');
    });
}

function loadDepreciationMethods() {
    return AssetTypeMasterService.GetDepreciationMethodList().then(function (response) {
        G_DepreciationMethods = normalizeList(response);
    }).catch(function () {
        G_DepreciationMethods = [];
        toastr.warning('Could not load Depreciation Method list.');
    });
}

function loadAssetGroups() {
    return AssetGroupMasterService.GetAssetGroupMasterList().then(function (response) {
        G_AssetGroups = normalizeList(response);
    }).catch(function () {
        G_AssetGroups = [];
        toastr.warning('Could not load Asset Group list.');
    });
}

function loadAssetTypeEntryForm() {
    var isEdit = G_EditCode > 0;
    return Promise.all([
        loadMaintenanceTypes(),
        loadMaintenancePlanningOptions(),
        loadDepreciationMethods(),
        loadAssetGroups()
    ]).then(function () {
        if (!isEdit) {
            bindDepreciationMethodDropdown('');
            bindAssetGroupDropdown(0);
            addDetailRow(null);
            return;
        }
        return AssetTypeMasterService.GetAssetTypeMasterByCode(G_EditCode).then(function (response) {
            var header = pickHeader(response) || mapListRowToHeader(findListRowByCode(G_EditCode));
            if (!header) {
                toastr.error('Asset Type not found.');
                showAssetTypeList();
                return;
            }
            fillHeader(header);
            var details = pickDetails(response);
            $('#assetTypeDetailBody').empty();
            DETAIL_ROW_ID = 0;
            if (details.length) details.forEach(function (d) { addDetailRow(d); });
            else addDetailRow(null);
        }).catch(function (err) {
            var header = mapListRowToHeader(findListRowByCode(G_EditCode));
            if (header) {
                fillHeader(header);
                $('#assetTypeDetailBody').empty();
                DETAIL_ROW_ID = 0;
                addDetailRow(null);
                toastr.warning('Detail rows could not be loaded from server.');
            } else {
                toastr.error(formatAjaxError(err, 'Failed to load Asset Type.'));
                showAssetTypeList();
            }
        });
    });
}

function mapListRowToHeader(row) {
    if (!row) return null;
    var code = getRecordCode(row);
    if (code <= 0 && !row.AssetTypeName && !row.assetTypeName && !row['Asset Type Name']) return null;
    return {
        Code: code,
        AssetTypeName: getField(row, 'assetTypeName', 'AssetTypeName') || row['Asset Type Name'] || '',
        AssetGroupMaster_Code: row.AssetGroupMaster_Code != null ? row.AssetGroupMaster_Code : row.assetGroupMaster_Code,
        DepreciationPercentage: row.DepreciationPercentage != null ? row.DepreciationPercentage : row['Dep %'],
        DepreciationMethod: getDepreciationMethodForGrid(row) || row.DepreciationMethod || row.depreciationMethod,
        Prefix: getField(row, 'prefix', 'Prefix'),
        MaxValue: row.MaxValue != null ? row.MaxValue : row.maxValue
    };
}

function saveAssetTypeEntry() {
    if (!validateHeader()) return;
    if (!validateDetails()) return;
    if (G_SaveInProgress) return;
    var isEdit = G_EditCode > 0;
    G_SaveInProgress = true;
    checkRight(isEdit ? 'Edit' : 'New').then(function (ok) {
        if (!ok) {
            G_SaveInProgress = false;
            return;
        }
        if (isEdit && !G_AllowEdit) {
            toastr.warning(TITLE_BRANCH_EDIT);
            G_SaveInProgress = false;
            return;
        }
        if (!isEdit && !G_AllowNew) {
            toastr.warning(TITLE_BRANCH_NEW);
            G_SaveInProgress = false;
            return;
        }
        var payload = {
            Master: {
                Code: G_EditCode,
                AssetTypeName: $('#txtAssetTypeName').val().trim(),
                AssetGroupMaster_Code: parseInt($('#ddlAssetGroup').val(), 10) || 0,
                DepreciationPercentage: parseFloat($('#txtDepreciationPercentage').val()) || 0,
                DepreciationMethod: ($('#ddlDepreciationMethod').val() || '').trim(),
                Prefix: $('#txtPrefix').val().trim(),
                MaxValue: G_EditCode > 0 ? G_PreservedMaxValue : 0
            },
            Details: collectDetails()
        };
        $('#btnSaveEntry').prop('disabled', true);
        AssetTypeMasterService.SaveAssetTypeMaster(payload).then(function (response) {
            if (isApiStatusYes(response)) {
                toastr.success(getApiMessage(response, 'Saved successfully.'));
                showAssetTypeList();
                loadAssetTypeList();
            } else {
                toastr.warning(getApiMessage(response, 'Save failed.'));
            }
        }).catch(function (err) {
            toastr.error(formatAjaxError(err, 'Error while saving.'));
        }).finally(function () {
            G_SaveInProgress = false;
            applyEntrySaveRightsToUI();
        });
    });
}

function buildActionButtons(code, item) {
    var verifyBtn = '';
    if (G_IsMainCompany && !isRecordVerified(item)) {
        verifyBtn = '<button type="button" class="im-btn-view im-btn-verify" title="Unverified" onclick="VerifyAssetType(' + code + ')"><i class="far fa-circle-check"></i></button>';
    } else if (isRecordVerified(item)) {
        verifyBtn = '<button type="button" class="im-btn-view im-btn-verified-mark" title="Verified" tabindex="-1"><i class="fas fa-circle-check"></i></button>';
    }
    return ''
        + '<button type="button" class="im-btn-edit" title="Edit" onclick="EditAssetType(' + code + ')"'
        + (G_AllowEdit ? '' : ' disabled title="' + TITLE_BRANCH_EDIT + '"') + '><i class="fas fa-pen"></i></button>'
        + '<button type="button" class="im-btn-delete" title="Delete" onclick="ConfirmDeleteAssetType(' + code + ')"><i class="fas fa-trash-can"></i></button>'
        + verifyBtn;
}

function loadMainCompanyFlag() {
    if (!BranchDetailsFunction || typeof BranchDetailsFunction.MainCompany !== 'function') {
        G_IsMainCompany = false;
        return Promise.resolve();
    }
    return BranchDetailsFunction.MainCompany().then(function (value) {
        G_IsMainCompany = (value || '').toString().trim().toUpperCase() === 'Y';
    }).catch(function () {
        G_IsMainCompany = false;
    });
}

function loadBranchPermissions() {
    try {
        return Promise.all([
            BranchDetailsFunction.AllowNew(),
            BranchDetailsFunction.AllowEdit(),
            BranchDetailsFunction.AllowDelete()
        ]).then(function (results) {
            G_AllowNew = results[0] === true;
            G_AllowEdit = results[1] === true;
            G_AllowDelete = results[2] !== false;
        }).catch(function () {
            G_AllowNew = false;
            G_AllowEdit = false;
            G_AllowDelete = true;
        });
    } catch (e) {
        G_AllowNew = false;
        G_AllowEdit = false;
        G_AllowDelete = true;
        return Promise.resolve();
    }
}

function applyActionRightsToUI() {
    var $btnNew = $('#btnNewAssetType');
    if (!G_AllowNew) {
        $btnNew.prop('disabled', true).attr('title', TITLE_BRANCH_NEW);
    } else {
        $btnNew.prop('disabled', false).removeAttr('title');
    }
}

function formatDepreciationForGrid(item) {
    var v = item.DepreciationPercentage != null ? item.DepreciationPercentage : item.depreciationPercentage;
    if (v == null || v === '') return '—';
    var n = parseFloat(v);
    return isNaN(n) ? String(v) : n.toFixed(2);
}

function loadAssetTypeList() {
    return AssetTypeMasterService.GetAssetTypeMasterList().then(function (response) {
        var rows = normalizeList(response);
        G_List = rows;
        if (!rows.length) {
            $('#tblAssetTypeMaster').hide();
            toastr.info('No asset types found. Click New to add one.');
            return;
        }
        $('#tblAssetTypeMaster').show();
        var gridRows = rows.map(function (item) {
            var code = getRecordCode(item);
            return {
                'S.No.': item['S.No.'],
                Code: code,
                'Asset Type Name': getField(item, 'assetTypeName', 'AssetTypeName') || '—',
                'Asset Group': getAssetGroupNameForGrid(item) || '—',
                'Dep %': formatDepreciationForGrid(item),
                'Dep Method': getDepreciationMethodForGrid(item) || '—',
                Prefix: getField(item, 'prefix', 'Prefix') || '—',
                Action: buildActionButtons(code, item)
            };
        });
        BizsolCustomFilterGrid.CreateDataTable(
            'AssetTypeMaster-header',
            'AssetTypeMaster-body',
            gridRows,
            false, [],
            ['Asset Type Name', 'Asset Group', 'Dep Method', 'Prefix'],
            [], [], [],
            ['Code', 'Verify', 'AssetGroupMaster_Code'],
            {
                'S.No.': 'center;width:52px;max-width:56px;min-width:48px;white-space:nowrap;',
                Action: 'center;width:130px;'
            },
            true, null, null, null,
            'Search by asset type, asset group, method, prefix...'
        );
    }).catch(function (err) {
        toastr.error(formatAjaxError(err, 'Failed to load Asset Type list.'));
    });
}

function openNewAssetType() {
    checkRight('New').then(function (ok) {
        if (!ok) return;
        if (!G_AllowNew) {
            toastr.warning(TITLE_BRANCH_NEW);
            return;
        }
        showAssetTypeEntry(0);
    });
}

function EditAssetType(code) {
    var editCode = parseInt(code, 10) || 0;
    if (editCode <= 0) {
        toastr.error('Invalid record. Refresh the list and try again.');
        return;
    }
    checkRight('Edit').then(function (ok) {
        if (!ok) return;
        if (!G_AllowEdit) {
            toastr.warning(TITLE_BRANCH_EDIT);
            return;
        }
        showAssetTypeEntry(editCode);
    });
}

function ConfirmDeleteAssetType(code) {
    checkRight('Delete').then(function (ok) {
        if (!ok) return;
        G_DeleteCode = parseInt(code, 10) || 0;
        if (G_DeleteCode <= 0) {
            toastr.error('Invalid record. Refresh the list and try again.');
            return;
        }
        $('#reasonForDeleteInput').val('');
        $('#deleteConfirmBackdrop').addClass('show');
        setTimeout(function () { $('#reasonForDeleteInput').focus(); }, 150);
    });
}

function closeDeleteModal() {
    $('#deleteConfirmBackdrop').removeClass('show');
    G_DeleteCode = 0;
}

function VerifyAssetType(code) {
    var recordCode = parseInt(code, 10) || 0;
    if (recordCode <= 0) {
        toastr.error('Invalid Asset Type code.');
        return;
    }
    if (!G_IsMainCompany) {
        toastr.warning('Verify is available only from the Main Company.');
        return;
    }
    if (G_VerifyInProgress) return;
    var row = findListRowByCode(recordCode);
    if (row && isRecordVerified(row)) {
        toastr.info('This Asset Type is already verified.');
        return;
    }
    checkVerifyRight().then(function (ok) {
        if (!ok) return;
        G_VerifyInProgress = true;
        AssetTypeMasterService.VerifyAssetTypeMaster(recordCode).then(function (response) {
            if (isApiStatusYes(response)) {
                toastr.success(getApiMessage(response, 'Verified and transferred to all branch companies successfully.'));
                loadAssetTypeList();
            } else {
                toastr.warning(getApiMessage(response, 'Verification failed.'));
            }
        }).catch(function (err) {
            toastr.error(formatAjaxError(err, 'Error during verification.'));
        }).finally(function () {
            G_VerifyInProgress = false;
        });
    });
}

function DoDeleteAssetType() {
    checkRight('Delete').then(function (ok) {
        if (!ok) return;
        var reasonForDelete = ($('#reasonForDeleteInput').val() || '').trim();
        if (!reasonForDelete) {
            toastr.warning('Please Provide a Reason For Delete.');
            $('#reasonForDeleteInput').focus();
            return;
        }
        if (!G_DeleteCode || parseInt(G_DeleteCode, 10) <= 0) {
            toastr.error('Invalid Asset Type code. Please close and try again.');
            return;
        }
        AssetTypeMasterService.DeleteAssetTypeMaster(G_DeleteCode, reasonForDelete).then(function (response) {
            $('#deleteConfirmBackdrop').removeClass('show');
            if (response && (response.Status === 'Y' || response.Status === 'SUCCESS')) {
                G_DeleteCode = 0;
                loadAssetTypeList();
                toastr.success(response.Msg || 'The asset type has been removed.');
            } else {
                toastr.error((response && response.Msg) || 'Failed to delete Asset Type.');
            }
        }).catch(function (err) {
            toastr.error(formatAjaxError(err, 'Failed to delete Asset Type.'));
            $('#deleteConfirmBackdrop').removeClass('show');
        });
    });
}

$(document).ready(function () {
    disableBrowserFieldSuggestions($('#txtAssetTypeName, #txtDepreciationPercentage, #txtPrefix'));
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    $('#btnNewAssetType').on('click', openNewAssetType);
    $('#btnCancelDelete').on('click', closeDeleteModal);
    $('#btnAddDetailRow').on('click', tryAddDetailRow);
    $('#btnSaveEntry').on('click', saveAssetTypeEntry);
    $('#btnBackToList, #btnCancelEntry').on('click', showAssetTypeList);
    Promise.all([loadMainCompanyFlag(), loadBranchPermissions()]).then(function () {
        applyActionRightsToUI();
        return loadAssetTypeList();
    }).then(function () {
        var deepCode = parseInt(new URLSearchParams(window.location.search).get('Code'), 10) || 0;
        if (deepCode > 0) EditAssetType(deepCode);
    });
});

window.openNewAssetType = openNewAssetType;
window.EditAssetType = EditAssetType;
window.ConfirmDeleteAssetType = ConfirmDeleteAssetType;
window.DoDeleteAssetType = DoDeleteAssetType;
window.VerifyAssetType = VerifyAssetType;
