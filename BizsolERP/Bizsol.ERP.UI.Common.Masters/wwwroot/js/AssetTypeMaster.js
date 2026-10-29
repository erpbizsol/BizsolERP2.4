import { AssetTypeMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/AssetTypeMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BranchDetailsFunction } from '../../Bizsol.WebERP.UI.Shared/js/BranchdetailsFunction.js';

var G_List = [];
var G_DeleteCode = 0;
var G_IsMainCompany = false;
var G_AllowNew = true;
var G_AllowEdit = true;
var G_AllowDelete = true;
var G_VerifyInProgress = false;
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

function getEntryUrl(code) {
    var params = new URLSearchParams(window.location.search);
    var moduleDesp = params.get('ModuleDesp') || MODULE_NAME;
    var q = new URLSearchParams();
    q.set('ModuleDesp', moduleDesp);
    q.set('Code', String(code || 0));
    return '/CommonMasters/AssetTypeMaster/AssetTypeMasterEntry?' + q.toString();
}

function normalizeList(response) {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.$values)) return response.$values;
    if (Array.isArray(response.data)) return response.data;
    return [];
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
            G_AllowNew = G_IsMainCompany;
            G_AllowEdit = G_IsMainCompany;
            G_AllowDelete = true;
        });
    } catch (e) {
        G_AllowNew = G_IsMainCompany;
        G_AllowEdit = G_IsMainCompany;
        G_AllowDelete = true;
        return Promise.resolve();
    }
}

function applyActionRightsToUI() {
    if (!G_IsMainCompany) {
        G_AllowNew = false;
        G_AllowEdit = false;
    }
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
        window.location.href = getEntryUrl(0);
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
        window.location.href = getEntryUrl(editCode);
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
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    $('#btnNewAssetType').on('click', openNewAssetType);
    $('#btnCancelDelete').on('click', closeDeleteModal);
    Promise.all([loadMainCompanyFlag(), loadBranchPermissions()]).then(function () {
        applyActionRightsToUI();
        return loadAssetTypeList();
    });
});

window.openNewAssetType = openNewAssetType;
window.EditAssetType = EditAssetType;
window.ConfirmDeleteAssetType = ConfirmDeleteAssetType;
window.DoDeleteAssetType = DoDeleteAssetType;
window.VerifyAssetType = VerifyAssetType;
