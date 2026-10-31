import { AssetGroupMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/AssetGroupMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BranchDetailsFunction } from '../../Bizsol.WebERP.UI.Shared/js/BranchdetailsFunction.js';
var G_EditCode = 0;
var G_List = [];
var G_DeleteCode = 0;
var G_IsMainCompany = false;
var G_AllowNew = true;
var G_AllowEdit = true;
var G_AllowDelete = true;
var G_VerifyInProgress = false;
var TITLE_BRANCH_NEW = 'Adding a new Asset Group is not allowed for this branch.';
var TITLE_BRANCH_EDIT = 'Editing is not allowed for this branch.';
var G_SaveInProgress = false;
var MODULE_NAME = 'Asset Group Master';
var MAX_ASSET_GROUP_NAME_LEN = 80;

function getModuleName() {
    try {
        var fromUrl = new URLSearchParams(window.location.search).get('ModuleDesp');
        if (fromUrl && fromUrl.trim()) return decodeURIComponent(fromUrl.trim());
    } catch (e) { /* fallback */ }
    return MODULE_NAME;
}

function getUserMasterCodeFromSession() {
    try {
        var auth = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        var c = parseInt(auth.UserMaster_Code, 10);
        return isNaN(c) ? 0 : c;
    } catch (e) {
        return 0;
    }
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

function pickRecord(response) {
    var list = normalizeList(response);
    if (list.length) return list[0];
    if (response && typeof response === 'object') {
        if (getRecordCode(response) > 0
            || response.AssetGroupName != null
            || response.assetGroupName != null
            || response['Asset Group'] != null) {
            return response;
        }
    }
    return null;
}

function formatEpicForGrid(item) {
    var epic = String((item && (item.EPIC != null ? item.EPIC : item.epic)) || '').trim().toUpperCase();
    if (epic === 'EPIC' || epic === 'Y' || epic === '1') return 'EPIC';
    if (epic === 'NON-EPIC' || epic === 'N' || epic === '0') return 'Non-EPIC';
    return epic || '—';
}

function fillForm(row, editCode) {
    $('#txtAssetGroupName').val(row.AssetGroupName || row.assetGroupName || row['Asset Group'] || '');
    var epic = String(row.EPIC || row.epic || 'Y').trim().toUpperCase();
    if (epic === 'EPIC' || epic === 'Y' || epic === '1') {
        $('#rdoEpicYes').prop('checked', true);
    } else {
        $('#rdoEpicNo').prop('checked', true);
    }
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
    if (err && err.xhr) {
        var xhr = err.xhr;
        var rt = xhr.responseText ? String(xhr.responseText).trim() : '';
        if (rt) {
            if (rt.indexOf('{') === 0) {
                try {
                    var parsed = JSON.parse(rt);
                    detail = parsed.Msg || parsed.msg || parsed.title || parsed.message || rt;
                } catch (e) {
                    detail = rt;
                }
            } else {
                detail = rt;
            }
        } else if (xhr.status) {
            detail = 'HTTP ' + xhr.status + (xhr.statusText ? (' ' + xhr.statusText) : '');
        }
    } else if (err && err.message && err.message.indexOf('error:') !== 0) {
        detail = err.message;
    }
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
        verifyBtn = '<button type="button" class="im-btn-view im-btn-verify" title="Unverified" onclick="VerifyAssetGroup(' + code + ')"><i class="far fa-circle-check"></i></button>';
    } else if (isRecordVerified(item)) {
        verifyBtn = '<button type="button" class="im-btn-view im-btn-verified-mark" title="Verified" tabindex="-1"><i class="fas fa-circle-check"></i></button>';
    }
    return ''
        + '<button type="button" class="im-btn-edit" title="Edit" onclick="EditAssetGroup(' + code + ')"'
        + (G_AllowEdit ? '' : ' disabled title="' + TITLE_BRANCH_EDIT + '"') + '><i class="fas fa-pen"></i></button>'
        + '<button type="button" class="im-btn-delete" title="Delete" onclick="ConfirmDeleteAssetGroup(' + code + ')"><i class="fas fa-trash-can"></i></button>'
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
    
    var $btnNew = $('#btnNewAssetGroup');
    if (!G_AllowNew) {
        $btnNew.prop('disabled', true).attr('title', TITLE_BRANCH_NEW);
    } else {
        $btnNew.prop('disabled', false).removeAttr('title');
    }
}

function loadAssetGroupList() {
    return AssetGroupMasterService.GetAssetGroupMasterList().then(function (response) {
        var rows = normalizeList(response);
        G_List = rows;
        if (!rows.length) {
            $('#tblAssetGroupMaster').hide();
            toastr.info('No asset groups found. Click New to add one.');
            return;
        }
        $('#tblAssetGroupMaster').show();
        var gridRows = rows.map(function (item) {
            var code = getRecordCode(item);
            return {
                'S.No.': item['S.No.'],
                Code: code,
                'Asset group': item.AssetGroupName || item.assetGroupName || item['Asset Group'] || '—',
                Epic: formatEpicForGrid(item),
                Action: buildActionButtons(code, item)
            };
        });
        BizsolCustomFilterGrid.CreateDataTable(
            'AssetGroupMaster-header',
            'AssetGroupMaster-body',
            gridRows,
            false, [],
            ['Asset group', 'Epic'],
            [],
            [],
            [],
            ['Code', 'Verify'],
            {
                'S.No.': 'center;width:52px;max-width:56px;min-width:48px;white-space:nowrap;',
                Action: 'center;width:130px;'
            },
            true, null, null, null,
            'Search by Asset Group, EPIC...'
        );
    }).catch(function (err) {
        var detail = 'Failed to load Asset Group list.';
        if (err && err.xhr && err.xhr.responseText) {
            var rt = err.xhr.responseText.trim();
            if (rt) detail = rt.indexOf('{') === 0 ? (function () { try { var p = JSON.parse(rt); return p.title || p.message || rt; } catch (e) { return rt; } })() : rt;
        } else if (err && err.message) {
            detail = err.message;
        }
        toastr.error(detail);
    });
}

function clearFormFields() {
    $('#txtAssetGroupName').val('').removeClass('im-input-error');
    $('#err_AssetGroupName, #err_AssetGroupNameLength').hide();
    $('input[name="rdoEpic"]').prop('checked', false);
    $('#rdoEpicYes').prop('checked', true);
}

function openNewAssetGroup() {
    checkRight('New').then(function (ok) {
        if (!ok) return;
        if (!G_AllowNew) {
            toastr.warning(TITLE_BRANCH_NEW);
            return;
        }
        G_EditCode = 0;
        clearFormFields();
        $('#formModalTitle').text('Add New Asset Group');
        $('#btnSaveText').text('Save Asset Group');
        $('#assetGroupDialogBackdrop').addClass('show');
        setTimeout(function () { $('#txtAssetGroupName').focus(); }, 140);
    });
}

function openEditAssetGroupModal(row, editCode) {
    fillForm(row, editCode);
    $('#formModalTitle').text('Edit Asset Group');
    $('#btnSaveText').text('Update Asset Group');
    $('#assetGroupDialogBackdrop').addClass('show');
    setTimeout(function () { $('#txtAssetGroupName').focus(); }, 140);
}

function EditAssetGroup(code) {
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
        G_EditCode = editCode;
        clearFormFields();
        AssetGroupMasterService.GetAssetGroupMasterByCode(editCode).then(function (response) {
            var row = pickRecord(response) || findListRowByCode(editCode);
            if (!row) {
                toastr.error('Failed to load Asset Group data.');
                return;
            }
            openEditAssetGroupModal(row, editCode);
        }).catch(function () {
            var row = findListRowByCode(editCode);
            if (!row) {
                toastr.error('Error loading Asset Group. Please try again.');
                return;
            }
            openEditAssetGroupModal(row, editCode);
        });
    });
}

function closeForm() {
    $('#assetGroupDialogBackdrop').removeClass('show');
    clearFormFields();
    G_EditCode = 0;
}

function getSelectedEpicFlag() {
    return $('#rdoEpicYes').is(':checked') ? 'Y' : 'N';
}

function validateForm() {
    var name = $('#txtAssetGroupName').val().trim();
    $('#err_AssetGroupName, #err_AssetGroupNameLength').hide();
    $('#txtAssetGroupName').removeClass('im-input-error');
    if (!name) {
        $('#err_AssetGroupName').show();
        $('#txtAssetGroupName').addClass('im-input-error');
        return false;
    }
    if (name.length > MAX_ASSET_GROUP_NAME_LEN) {
        $('#err_AssetGroupNameLength').show();
        $('#txtAssetGroupName').addClass('im-input-error');
        return false;
    }
    return true;
}

function saveAssetGroup() {
    if (!validateForm()) return;
    if (G_SaveInProgress) return;
    var isEdit = G_EditCode > 0;
    var editCode = G_EditCode;
    var assetGroupName = $('#txtAssetGroupName').val().trim();
    var epicFlag = getSelectedEpicFlag();
    if (!assetGroupName) return;
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
        var payload = [{
            Code: editCode,
            AssetGroupName: assetGroupName,
            EPIC: epicFlag
        }];
        $('#btnSaveAssetGroup').prop('disabled', true);
        AssetGroupMasterService.SaveAssetGroupMaster(payload).then(function (response) {
            if (isApiStatusYes(response)) {
                toastr.success(getApiMessage(response, 'Saved successfully.'));
                closeForm();
                loadAssetGroupList();
            } else {
                toastr.warning(getApiMessage(response, 'Save failed.'));
            }
        }).catch(function (err) {
            var detail = (err && err.message) ? err.message : 'Error while saving.';
            if (err && err.xhr && err.xhr.responseText) {
                var rt = err.xhr.responseText.trim();
                if (rt.indexOf('{') === 0) {
                    try {
                        var parsed = JSON.parse(rt);
                        detail = parsed.title || parsed.Msg || parsed.message || parsed || detail;
                    } catch (e) {
                        detail = rt;
                    }
                } else if (rt) {
                    detail = rt;
                }
            }
            toastr.error(detail);
        }).finally(function () {
            G_SaveInProgress = false;
            $('#btnSaveAssetGroup').prop('disabled', false);
        });
    });
}

function ConfirmDeleteAssetGroup(code) {
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

function VerifyAssetGroup(code) {
    var recordCode = parseInt(code, 10) || 0;
    if (recordCode <= 0) {
        toastr.error('Invalid record. Refresh the list and try again.');
        return;
    }
    if (!G_IsMainCompany) {
        toastr.warning('Verify is available only from the Main Company.');
        return;
    }
    if (G_VerifyInProgress) return;
    var row = findListRowByCode(recordCode);
    if (row && isRecordVerified(row)) {
        toastr.info('This Asset Group is already verified.');
        return;
    }
    checkVerifyRight().then(function (ok) {
        if (!ok) return;
        G_VerifyInProgress = true;
        AssetGroupMasterService.VerifyAssetGroupMaster(recordCode).then(function (response) {
            if (isApiStatusYes(response)) {
                toastr.success(getApiMessage(response, 'Verified and transferred to all branch companies successfully.'));
                loadAssetGroupList();
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

function DoDeleteAssetGroup() {
    checkRight('Delete').then(function (ok) {
        if (!ok) return;
        var reasonForDelete = ($('#reasonForDeleteInput').val() || '').trim();
        if (!reasonForDelete) {
            toastr.warning('Please Provide a Reason For Delete.');
            $('#reasonForDeleteInput').focus();
            return;
        }
        if (!G_DeleteCode || parseInt(G_DeleteCode, 10) <= 0) {
            toastr.error('Invalid Asset Group code. Please close and try delete again.');
            return;
        }
        AssetGroupMasterService.DeleteAssetGroupMaster(G_DeleteCode, reasonForDelete).then(function (response) {
            $('#deleteConfirmBackdrop').removeClass('show');
            if (response && (response.Status === 'Y' || response.Status === 'SUCCESS')) {
                G_DeleteCode = 0;
                loadAssetGroupList();
                toastr.success(response.Msg || 'The asset group has been removed.');
            } else {
                var deleteMsg = (response && response.Msg) || 'Failed to delete Asset Group.';
                deleteMsg = String(deleteMsg).trim().replace(/\.$/, '');
                if (/for this record$/i.test(deleteMsg)) {
                    deleteMsg = deleteMsg.replace(/\s*for this record\s*$/i, '').trim();
                }
                toastr.error(deleteMsg);
            }
        }).catch(function (err) {
            var detail = (err && err.xhr && err.xhr.responseText) ? String(err.xhr.responseText).substring(0, 300) : '';
            toastr.error('Failed to delete Asset Group.' + (detail ? (' ' + detail) : ' Please try again.'));
            $('#deleteConfirmBackdrop').removeClass('show');
        });
    });
}

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    $('#btnNewAssetGroup').on('click', openNewAssetGroup);
    $('#btnModalClose, #btnCancelAssetGroup').on('click', closeForm);
    $('#btnSaveAssetGroup').on('click', saveAssetGroup);
    $('#btnCancelDelete').on('click', closeDeleteModal);
    Promise.all([loadMainCompanyFlag(), loadBranchPermissions()]).then(function () {
        applyActionRightsToUI();
        return loadAssetGroupList();
    });
});

window.openNewAssetGroup = openNewAssetGroup;
window.EditAssetGroup = EditAssetGroup;
window.ConfirmDeleteAssetGroup = ConfirmDeleteAssetGroup;
window.saveAssetGroup = saveAssetGroup;
window.DoDeleteAssetGroup = DoDeleteAssetGroup;
window.VerifyAssetGroup = VerifyAssetGroup;
