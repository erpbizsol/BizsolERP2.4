import { AssetTypeMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/AssetTypeMasterService.js';
import { MaintenanceTypeMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MaintenanceTypeMasterService.js';
import { AssetGroupMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/AssetGroupMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BranchDetailsFunction } from '../../Bizsol.WebERP.UI.Shared/js/BranchdetailsFunction.js';

var G_EditCode = 0;
var G_AllowNew = true;
var G_AllowEdit = true;
var TITLE_BRANCH_NEW = 'Adding a new Asset Type is not allowed for this branch.';
var TITLE_BRANCH_EDIT = 'Editing is not allowed for this branch.';
var G_SaveInProgress = false;
var G_MaintenanceTypes = [];
var G_PlanningOptions = [];
var G_DepreciationMethods = [];
var G_AssetGroups = [];
var G_PreservedMaxValue = 0;
var MODULE_NAME = 'Asset Type Master';
var DETAIL_ROW_ID = 0;

function getModuleName() {
    try {
        var fromUrl = new URLSearchParams(window.location.search).get('ModuleDesp');
        if (fromUrl && fromUrl.trim()) return decodeURIComponent(fromUrl.trim());
    } catch (e) { /* fallback */ }
    return MODULE_NAME;
}

function getListUrl() {
    var params = new URLSearchParams(window.location.search);
    var moduleDesp = params.get('ModuleDesp') || MODULE_NAME;
    return '/CommonMasters/AssetTypeMaster/AssetTypeMaster?ModuleDesp=' + encodeURIComponent(moduleDesp);
}

function normalizeList(response) {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.$values)) return response.$values;
    if (Array.isArray(response.data)) return response.data;
    return [];
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

function formatAjaxError(err, fallback) {
    var detail = fallback || 'Request failed.';
    if (err && err.xhr && err.xhr.responseText) detail = String(err.xhr.responseText).trim().substring(0, 400);
    else if (err && err.message) detail = err.message;
    return detail;
}

function checkRight(optionName) {
    return MenuService.CheckModuleOptionRight(getModuleName(), optionName, 'Y', BizSolHelperFunction.getFinancialYear())
        .then(function (response) {
            if (response && response.CheckModuleOptionRight === 'N') {
                toastr.error(response.Msg || ('No rights for ' + optionName));
                return false;
            }
            return true;
        })
        .catch(function () {
            toastr.error('Unable to verify module rights.');
            return false;
        });
}

function pickHeader(response) {
    if (response && (response.Header || response.header)) {
        var h = normalizeList(response.Header || response.header);
        if (h.length) return h[0];
    }
    var list = normalizeList(response);
    return list.length ? list[0] : null;
}

function pickDetails(response) {
    if (response && (response.Details || response.details)) {
        return normalizeList(response.Details || response.details);
    }
    return [];
}

function getMaintDesp(code) {
    var id = parseInt(code, 10) || 0;
    for (var i = 0; i < G_MaintenanceTypes.length; i++) {
        if (parseInt(G_MaintenanceTypes[i].Code, 10) === id) {
            return G_MaintenanceTypes[i].DESP || G_MaintenanceTypes[i].desp || G_MaintenanceTypes[i].Desp || '';
        }
    }
    return '';
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
        toastr.warning(
            firstName
                ? ('Duplicate Maintenance Type Name is not allowed: "' + firstName + '".')
                : 'Duplicate Maintenance Type Name is not allowed.'
        );
    }
    return true;
}

function validateDetails() {
    return !markDuplicateMaintenanceTypes(true);
}

function isDetailRowMaintenanceTypeFilled($tr) {
    var maintCode = parseInt($tr.find('.js-maint-type').val(), 10) || 0;
    return maintCode > 0;
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

/** Last detail row must have Maintenance Type before another row is added. */
function canAddDetailRow(showToast) {
    var $rows = $('#assetTypeDetailBody tr');
    if (!$rows.length) return true;
    var $last = $rows.last();
    if (isDetailRowMaintenanceTypeFilled($last)) {
        markDetailRowMaintenanceError($last, false);
        return true;
    }
    markDetailRowMaintenanceError($last, true);
    if (showToast) {
        toastr.warning('Please select Maintenance Type Name in the current row before adding a new row.');
    }
    return false;
}

function tryAddDetailRow() {
    if (!canAddDetailRow(true)) return;
    addDetailRow(null);
}

function buildMaintenanceSelect(selectedCode) {
    var sel = parseInt(selectedCode, 10) || 0;
    var html = '<select class="at-input js-maint-type js-search-select"><option value="">-- Select --</option>';
    for (var i = 0; i < G_MaintenanceTypes.length; i++) {
        var m = G_MaintenanceTypes[i];
        var c = parseInt(m.Code, 10) || 0;
        var name = m.MaintenanceTypeName || m.maintenanceTypeName || m['Maintenance Type Name'] || '';
        var desp = m.DESP || m.desp || m.Desp || '';
        html += '<option value="' + c + '" data-desp="' + escapeAttr(desp) + '"' + (c === sel ? ' selected' : '') + '>' + escapeHtml(name) + '</option>';
    }
    html += '</select>';
    return html;
}

function buildPlanningSelect(selected) {
    var val = (selected || '').trim();
    var html = '<select class="at-input js-maint-plan js-search-select"><option value="">-- Select --</option>';
    for (var i = 0; i < G_PlanningOptions.length; i++) {
        var o = commonOptionValue(G_PlanningOptions[i]);
        if (!o) continue;
        html += '<option value="' + escapeAttr(o) + '"' + (o === val ? ' selected' : '') + '>' + escapeHtml(o) + '</option>';
    }
    html += '</select>';
    return html;
}

function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
}

function addDetailRow(rowData) {
    DETAIL_ROW_ID += 1;
    var rid = DETAIL_ROW_ID;
    var data = rowData || {};
    var maintCode = data.MaintenanceTypeMaster_Code || data.maintenanceTypeMaster_Code || 0;
    var plan = data.MaintenancePlanning || data.maintenancePlanning || '';
    var desp = data.Desp || data.desp || '';
    var remarks = data.Remarks || data.remarks || '';

    var tr = ''
        + '<tr data-row-id="' + rid + '">'
        + '<td>' + buildMaintenanceSelect(maintCode) + '</td>'
        + '<td>' + buildPlanningSelect(plan) + '</td>'
        + '<td><input type="text" class="at-input js-desp" maxlength="500" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + escapeAttr(desp) + '" /></td>'
        + '<td><input type="text" class="at-input js-remark" maxlength="500" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + escapeAttr(remarks) + '" /></td>'
        + '<td style="text-align:center"><button type="button" class="at-btn-del-row js-del-detail" title="Delete row"><i class="fas fa-trash-can"></i></button></td>'
        + '</tr>';
    $('#assetTypeDetailBody').append(tr);

    var $row = $('#assetTypeDetailBody tr[data-row-id="' + rid + '"]');
    initSearchableSelect($row.find('.js-maint-type'), '-- Select --');
    initSearchableSelect($row.find('.js-maint-plan'), '-- Select --');

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
    return (
        item.AssetGroupName
        || item.assetGroupName
        || item['Asset Group Name']
        || ''
    ).trim();
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

    var depMethod = ($('#ddlDepreciationMethod').val() || '').trim();
    if (!depMethod) {
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

    var assetGroupCode = parseInt($('#ddlAssetGroup').val(), 10) || 0;
    if (assetGroupCode <= 0) {
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

function loadEntry() {
    var params = new URLSearchParams(window.location.search);
    G_EditCode = parseInt(params.get('Code'), 10) || 0;
    var isEdit = G_EditCode > 0;

    $('#entryPageTitle').text(isEdit ? 'Edit Asset Type' : 'New Asset Type');
    $('#btnSaveEntryText').text(isEdit ? 'Update' : 'Save');

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
            var header = pickHeader(response);
            if (!header) {
                toastr.error('Asset Type not found.');
                return;
            }
            fillHeader(header);
            var details = pickDetails(response);
            $('#assetTypeDetailBody').empty();
            if (details.length) {
                details.forEach(function (d) { addDetailRow(d); });
            } else {
                addDetailRow(null);
            }
        });
    });
}

function saveEntry() {
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
                window.location.href = getListUrl();
            } else {
                toastr.warning(getApiMessage(response, 'Save failed.'));
            }
        }).catch(function (err) {
            toastr.error(formatAjaxError(err, 'Error while saving.'));
        }).finally(function () {
            G_SaveInProgress = false;
            $('#btnSaveEntry').prop('disabled', false);
        });
    });
}

function goBack() {
    window.location.href = getListUrl();
}

function disableBrowserFieldSuggestions($fields) {
    $fields.attr('autocomplete', 'off').attr('readonly', 'readonly');
    $fields.on('focus', function () {
        $(this).removeAttr('readonly');
    });
}

$(document).ready(function () {
    disableBrowserFieldSuggestions($('#txtAssetTypeName, #txtDepreciationPercentage, #txtPrefix'));
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    var params = new URLSearchParams(window.location.search);
    G_EditCode = parseInt(params.get('Code'), 10) || 0;
    var right = G_EditCode > 0 ? 'Edit' : 'New';
    var branchPermPromise = Promise.resolve(true);
    try {
        branchPermPromise = Promise.all([
            BranchDetailsFunction.MainCompany(),
            BranchDetailsFunction.AllowNew(),
            BranchDetailsFunction.AllowEdit()
        ]).then(function (results) {
            var isMain = (results[0] || '').toString().trim().toUpperCase() === 'Y';
            G_AllowNew = isMain && results[1] === true;
            G_AllowEdit = isMain && results[2] === true;
            if (G_EditCode > 0 && !G_AllowEdit) return false;
            if (G_EditCode <= 0 && !G_AllowNew) return false;
            return true;
        }).catch(function () { return false; });
    } catch (e) {
        branchPermPromise = Promise.resolve(false);
    }
    Promise.all([checkRight(right), branchPermPromise]).then(function (results) {
        if (!results[0] || !results[1]) {
            if (results[0] && !results[1]) {
                toastr.warning(G_EditCode > 0 ? TITLE_BRANCH_EDIT : TITLE_BRANCH_NEW);
            }
            setTimeout(goBack, 800);
            return;
        }
        if (G_EditCode > 0 && !G_AllowEdit) {
            $('#btnSaveEntry').prop('disabled', true).attr('title', TITLE_BRANCH_EDIT);
        } else if (G_EditCode <= 0 && !G_AllowNew) {
            $('#btnSaveEntry').prop('disabled', true).attr('title', TITLE_BRANCH_NEW);
        }
        loadEntry();
    });
    $('#btnAddDetailRow').on('click', tryAddDetailRow);
    $('#btnSaveEntry').on('click', saveEntry);
    $('#btnBackToList, #btnCancelEntry').on('click', goBack);
});
