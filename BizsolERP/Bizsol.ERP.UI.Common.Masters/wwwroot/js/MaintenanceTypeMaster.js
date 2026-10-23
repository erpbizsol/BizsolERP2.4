import { MaintenanceTypeMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MaintenanceTypeMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BranchDetailsFunction } from '../../Bizsol.WebERP.UI.Shared/js/BranchdetailsFunction.js';

var G_EditCode = 0;
var G_List = [];
var G_DeleteCode = 0;
var G_IsMainCompany = false;
var G_VerifyInProgress = false;
var G_SaveInProgress = false;
var MODULE_NAME = 'Maintenance Type Master';

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
            || response.MaintenanceTypeName != null
            || response['Maintenance Type Name'] != null) {
            return response;
        }
    }
    return null;
}

function fillForm(row, editCode) {
    $('#txtMaintenanceTypeName').val(row.MaintenanceTypeName || row.maintenanceTypeName || row['Maintenance Type Name'] || '');
    $('#txtDesp').val(row.DESP || row.desp || '');
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
        verifyBtn = '<button type="button" class="im-btn-view im-btn-verify" title="Verify and transfer to all branches" onclick="VerifyMaintenanceType(' + code + ')"><i class="fas fa-check"></i></button>';
    } else if (isRecordVerified(item)) {
        verifyBtn = '<button type="button" class="im-btn-view im-btn-verified-mark" title="Verified and transferred" disabled><i class="fas fa-check"></i></button>';
    }
    return ''
        + '<button type="button" class="im-btn-edit" title="Edit" onclick="EditMaintenanceType(' + code + ')"><i class="fas fa-pen"></i></button>'
        + '<button type="button" class="im-btn-delete" title="Delete" onclick="ConfirmDeleteMaintenanceType(' + code + ')"><i class="fas fa-trash-can"></i></button>'
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

function loadMaintenanceTypeList() {
    return MaintenanceTypeMasterService.GetMaintenanceTypeMasterList().then(function (response) {
        var rows = normalizeList(response);
        G_List = rows;
        if (!rows.length) {
            $('#tblMaintenanceTypeMaster').hide();
            toastr.info('No maintenance types found. Click New to add one.');
            return;
        }
        $('#tblMaintenanceTypeMaster').show();
        var gridRows = rows.map(function (item) {
            var code = getRecordCode(item);
            return {
                'S.No.': item['S.No.'],
                Code: code,
                'Maintenance Type Name': item.MaintenanceTypeName || item.maintenanceTypeName || item['Maintenance Type Name'] || '—',
                DESP: item.DESP || item.desp || '—',
                Action: buildActionButtons(code, item)
            };
        });
        BizsolCustomFilterGrid.CreateDataTable(
            'MaintenanceTypeMaster-header',
            'MaintenanceTypeMaster-body',
            gridRows,
            false, [],
            ['Maintenance Type Name', 'DESP'],
            [],
            [],
            [],
            ['Code', 'Verify'],
            {
                'S.No.': 'center;width:52px;max-width:56px;min-width:48px;white-space:nowrap;',
                Action: 'center;width:130px;'
            },
            true, null, null, null,
            'Search by Maintenance Type Name, Description...'
        );
    }).catch(function (err) {
        toastr.error(formatAjaxError(err, 'Failed to load Maintenance Type list.'));
    });
}

function clearFormFields() {
    $('#txtMaintenanceTypeName, #txtDesp').val('').removeClass('im-input-error');
    $('#err_MaintenanceTypeName').hide();
}

function openNewMaintenanceType() {
    checkRight('New').then(function (ok) {
        if (!ok) return;
        G_EditCode = 0;
        clearFormFields();
        $('#formModalTitle').text('Add New Maintenance Type');
        $('#btnSaveText').text('Save Maintenance Type');
        $('#maintenanceTypeDialogBackdrop').addClass('show');
        setTimeout(function () { $('#txtMaintenanceTypeName').focus(); }, 140);
    });
}

function openEditMaintenanceTypeModal(row, editCode) {
    fillForm(row, editCode);
    $('#formModalTitle').text('Edit Maintenance Type');
    $('#btnSaveText').text('Update Maintenance Type');
    $('#maintenanceTypeDialogBackdrop').addClass('show');
    setTimeout(function () { $('#txtMaintenanceTypeName').focus(); }, 140);
}

function EditMaintenanceType(code) {
    var editCode = parseInt(code, 10) || 0;
    if (editCode <= 0) {
        toastr.error('Invalid record. Refresh the list and try again.');
        return;
    }
    checkRight('Edit').then(function (ok) {
        if (!ok) return;
        G_EditCode = editCode;
        clearFormFields();
        MaintenanceTypeMasterService.GetMaintenanceTypeMasterByCode(editCode).then(function (response) {
            var row = pickRecord(response) || findListRowByCode(editCode);
            if (!row) {
                toastr.error('Failed to load Maintenance Type data.');
                return;
            }
            openEditMaintenanceTypeModal(row, editCode);
        }).catch(function () {
            var row = findListRowByCode(editCode);
            if (!row) {
                toastr.error('Error loading Maintenance Type. Please try again.');
                return;
            }
            openEditMaintenanceTypeModal(row, editCode);
        });
    });
}

function closeForm() {
    $('#maintenanceTypeDialogBackdrop').removeClass('show');
    clearFormFields();
    G_EditCode = 0;
}

function validateForm() {
    var name = $('#txtMaintenanceTypeName').val().trim();
    $('#err_MaintenanceTypeName').hide();
    $('#txtMaintenanceTypeName').removeClass('im-input-error');
    if (!name) {
        $('#err_MaintenanceTypeName').show();
        $('#txtMaintenanceTypeName').addClass('im-input-error');
        return false;
    }
    return true;
}

function saveMaintenanceType() {
    if (!validateForm()) return;
    if (G_SaveInProgress) return;
    var isEdit = G_EditCode > 0;
    var editCode = G_EditCode;
    var maintenanceTypeName = $('#txtMaintenanceTypeName').val().trim();
    var desp = ($('#txtDesp').val() || '').trim();
    if (!maintenanceTypeName) return;
    G_SaveInProgress = true;
    checkRight(isEdit ? 'Edit' : 'New').then(function (ok) {
        if (!ok) {
            G_SaveInProgress = false;
            return;
        }
        var payload = [{
            Code: editCode,
            MaintenanceTypeName: maintenanceTypeName,
            DESP: desp
        }];
        $('#btnSaveMaintenanceType').prop('disabled', true);
        MaintenanceTypeMasterService.SaveMaintenanceTypeMaster(payload).then(function (response) {
            if (isApiStatusYes(response)) {
                toastr.success(getApiMessage(response, 'Saved successfully.'));
                closeForm();
                loadMaintenanceTypeList();
            } else {
                toastr.warning(getApiMessage(response, 'Save failed.'));
            }
        }).catch(function (err) {
            toastr.error(formatAjaxError(err, 'Error while saving.'));
        }).finally(function () {
            G_SaveInProgress = false;
            $('#btnSaveMaintenanceType').prop('disabled', false);
        });
    });
}

function ConfirmDeleteMaintenanceType(code) {
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

function VerifyMaintenanceType(code) {
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
        toastr.info('This Maintenance Type is already verified.');
        return;
    }
    checkVerifyRight().then(function (ok) {
        if (!ok) return;
        G_VerifyInProgress = true;
        MaintenanceTypeMasterService.VerifyMaintenanceTypeMaster(recordCode).then(function (response) {
            if (isApiStatusYes(response)) {
                toastr.success(getApiMessage(response, 'Verified and transferred to all branch companies successfully.'));
                loadMaintenanceTypeList();
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

function DoDeleteMaintenanceType() {
    checkRight('Delete').then(function (ok) {
        if (!ok) return;
        var reasonForDelete = ($('#reasonForDeleteInput').val() || '').trim();
        if (!reasonForDelete) {
            toastr.warning('Please Provide a Reason For Delete.');
            $('#reasonForDeleteInput').focus();
            return;
        }
        if (!G_DeleteCode || parseInt(G_DeleteCode, 10) <= 0) {
            toastr.error('Invalid code. Please close and try delete again.');
            return;
        }
        MaintenanceTypeMasterService.DeleteMaintenanceTypeMaster(G_DeleteCode, reasonForDelete).then(function (response) {
            $('#deleteConfirmBackdrop').removeClass('show');
            if (response && (response.Status === 'Y' || response.Status === 'SUCCESS')) {
                G_DeleteCode = 0;
                loadMaintenanceTypeList();
                toastr.success(response.Msg || 'The maintenance type has been removed.');
            } else {
                var deleteMsg = (response && response.Msg) || 'Failed to delete Maintenance Type.';
                deleteMsg = String(deleteMsg).trim().replace(/\.$/, '');
                if (/for this record$/i.test(deleteMsg)) {
                    deleteMsg = deleteMsg.replace(/\s*for this record\s*$/i, '').trim();
                }
                toastr.error(deleteMsg);
            }
        }).catch(function (err) {
            toastr.error(formatAjaxError(err, 'Failed to delete Maintenance Type.'));
            $('#deleteConfirmBackdrop').removeClass('show');
        });
    });
}

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    $('#btnNewMaintenanceType').on('click', openNewMaintenanceType);
    $('#btnModalClose, #btnCancelMaintenanceType').on('click', closeForm);
    $('#btnSaveMaintenanceType').on('click', saveMaintenanceType);
    $('#btnCancelDelete').on('click', closeDeleteModal);
    loadMainCompanyFlag().finally(function () {
        loadMaintenanceTypeList();
    });
});

window.openNewMaintenanceType = openNewMaintenanceType;
window.EditMaintenanceType = EditMaintenanceType;
window.ConfirmDeleteMaintenanceType = ConfirmDeleteMaintenanceType;
window.saveMaintenanceType = saveMaintenanceType;
window.DoDeleteMaintenanceType = DoDeleteMaintenanceType;
window.VerifyMaintenanceType = VerifyMaintenanceType;
