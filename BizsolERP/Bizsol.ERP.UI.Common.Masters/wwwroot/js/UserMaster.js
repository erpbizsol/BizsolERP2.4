import { UserMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_UserMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { UrlService } from '../../Bizsol.WebERP.UI.Shared/js/URL.js';

var U_EditCode = 0;
var U_ViewCode = 0;
var U_EditRow  = null;

/* ─── Auth helper ─── */
function getUserCode() {
    try {
        var auth = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        var c = parseInt(auth.UserMaster_Code, 10);
        return isNaN(c) ? 0 : c;
    } catch (e) { return 0; }
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    GetUserMasterList();
    LoadDropdowns();

    $('#btnModalClose, #btnCancelUser').on('click', CloseForm);
    $('#btnCancelDelete').on('click', function () { $('#deleteConfirmBackdrop').removeClass('show'); });

    /* Live validation */
    $('#txtUserID').on('input', function () {
        if ($(this).val().trim()) { $(this).removeClass('im-input-error'); $('#err_UserID').hide(); }
    });
    $('#txtUserName').on('input', function () {
        if ($(this).val().trim()) { $(this).removeClass('im-input-error'); $('#err_UserName').hide(); }
    });
    $('#txtPassword').on('input', function () {
        if ($(this).val().trim()) { $(this).removeClass('im-input-error'); $('#err_Password').hide(); }
        ValidatePasswordMatch();
    });
    $('#txtConfirmPassword').on('input', ValidatePasswordMatch);

    /* Status radio visual sync */
    $('input[name="rdoStatus"]').on('change', function () {
        SetStatus($(this).val());
    });
});

/* ══════════════════════════════════════════
   LOAD LIST
══════════════════════════════════════════ */
function GetUserMasterList() {
    UserMasterService.GetUserMasterList().then(function (response) {
        var rows = [];
        if (Array.isArray(response))             rows = response;
        else if (Array.isArray(response.data))   rows = response.data;
        else if (Array.isArray(response.Data))   rows = response.Data;

        if (rows.length === 0) {
            toastr.warning('No users found. Add your first user.');
            $('#tblUserMaster').hide();
            return;
        }

        $('#tblUserMaster').show();
        var StringFilterColumn  = ['UserID', 'UserName', 'GroupName', 'Email', 'Mobile', 'Status'];
        var NumericFilterColumn = [];
        var DateFilterColumn    = [];
        var hiddenColumns       = ['Code'];
        var ColumnAlignment     = { Action: 'center;width:118px;' };

        var updatedResponse = rows.map(function (item) {
            var row  = Object.assign({}, item);
            var code = row.Code != null ? row.Code : 0;

            row.Action =
                '<button class="im-btn-view"   title="View"   onclick="ViewUser('    + code + ')"><i class="fas fa-eye"></i></button>' +
                '<button class="im-btn-edit"   title="Edit"   onclick="EditUser('    + code + ')"><i class="fas fa-pen"></i></button>' +
                '<button class="im-btn-delete" title="Delete" onclick="ConfirmDelete(' + code + ')"><i class="fas fa-trash-can"></i></button>';
            return row;
        });

        BizsolCustomFilterGrid.CreateDataTable(
            'UserMaster-header', 'UserMaster-body',
            updatedResponse, false, [],
            StringFilterColumn, NumericFilterColumn, DateFilterColumn,
            [], hiddenColumns, ColumnAlignment
        );
    }).catch(function () {
        toastr.error('Failed to load user list.');
    });
}

/* ══════════════════════════════════════════
   LOAD DROPDOWNS
══════════════════════════════════════════ */
function LoadDropdowns() {
    /* Group Name */
    $.ajax({
        url: UrlService.API_ENDPOINT_USERMASTER + '/GetGroupMasterList',
        type: 'GET',
        success: function (res) {
            var groups = Array.isArray(res) ? res : (res.data || res.Data || []);
            var $ddl = $('#ddlGroupName').empty().append('<option value="">— Select Group —</option>');
            groups.forEach(function (g) {
                $ddl.append($('<option>').val(g.Code).text(g.GroupName));
            });
        }
    });

    /* Default Company */
    $.ajax({
        url: UrlService.API_ENDPOINT_USERMASTER + '/GetCompanyMasterList',
        type: 'GET',
        success: function (res) {
            var companies = Array.isArray(res) ? res : (res.data || res.Data || []);
            var $ddl = $('#ddlDefaultCompany').empty().append('<option value="">— Select Company —</option>');
            companies.forEach(function (c) {
                $ddl.append($('<option>').val(c.Code).text(c.CompanyName));
            });
        }
    });
}

/* ══════════════════════════════════════════
   OPEN NEW
══════════════════════════════════════════ */
function OpenNewUser() {
    U_EditCode = 0;
    U_EditRow  = null;
    ClearForm();
    $('#formModalTitle').text('Add New User');
    $('#btnSaveText').text('Save User');
    $('#userDialogBackdrop').addClass('show');
    setTimeout(function () { $('#txtUserID').focus(); }, 140);
}

/* ══════════════════════════════════════════
   EDIT
══════════════════════════════════════════ */
function EditUser(code) {
    U_EditCode = code;
    ClearForm();
    $('#formModalTitle').text('Edit User');
    $('#btnSaveText').text('Update User');

    UserMasterService.GetUserMasterByCode(code).then(function (res) {
        var row = pickEntity(res);
        if (!row) { toastr.error('Failed to load user data.'); return; }
        U_EditRow = Object.assign({}, row);
        PopulateForm(row);
        $('#userDialogBackdrop').addClass('show');
    }).catch(function () { toastr.error('Error loading user. Please try again.'); });
}

/* ══════════════════════════════════════════
   VIEW
══════════════════════════════════════════ */
function ViewUser(code) {
    U_ViewCode = code;
    UserMasterService.GetUserMasterByCode(code).then(function (res) {
        var row = pickEntity(res);
        if (!row) { toastr.error('Failed to load user details.'); return; }
        PopulateViewModal(row);
        $('#viewUserBackdrop').addClass('show');
    }).catch(function () { toastr.error('Error loading user details.'); });
}

function PopulateViewModal(d) {
    $('#viewUserCode').text(d.Code || '—');
    $('#viewUserName').text(d.UserName || '—');
    $('#vf_UserID').text(d.UserID || '—');
    $('#vf_UserIDVal').text(d.UserID || '—');
    $('#vf_UserName').text(d.UserName || '—');
    $('#vf_MobileNo').text(d.UserMobileNo || '—');
    $('#vf_Group').text(d.GroupName || '—');
    $('#vf_GroupLabel').text(d.GroupName || '—');
    $('#vf_Company').text(d.DefaultCompanyName || '—');

    /* Status badge */
    var isActive = d.Status === 'A';
    $('#vf_StatusBadge')
        .removeClass('badge-active badge-inactive')
        .addClass(isActive ? 'badge-active' : 'badge-inactive')
        .html('<i class="fas fa-' + (isActive ? 'circle-check' : 'circle-xmark') + '" style="margin-right:4px;"></i>' + (isActive ? 'Active' : 'Inactive'));

    if (d.GroupName) $('#vf_GroupBadge').show(); else $('#vf_GroupBadge').hide();

    if (d.PhotoPath) {
        $('#viewAvatarImg').attr('src', d.PhotoPath).show();
        $('#viewAvatarIcon').hide();
    } else {
        $('#viewAvatarImg').hide();
        $('#viewAvatarIcon').show();
    }
}

function CloseViewModal() {
    U_ViewCode = 0;
    $('#viewUserBackdrop').removeClass('show');
}

function EditFromView() {
    var codeToEdit = U_ViewCode;
    CloseViewModal();
    EditUser(codeToEdit);
}

/* ══════════════════════════════════════════
   SAVE
══════════════════════════════════════════ */
function SaveUser() {
    if (!ValidateForm()) return;

    var isEdit  = U_EditCode > 0;
    var payload = BuildPayload();
    var $btn    = $('#btnSaveUser');
    var origText = $('#btnSaveText').text();
    $btn.prop('disabled', true);
    $('#btnSaveText').text(isEdit ? 'Updating…' : 'Saving…');

    UserMasterService.SaveUserMaster(payload).then(function (response) {
        if (response && response.Status === 'Y') {
            CloseForm();
            GetUserMasterList();
            ShowSuccessModal(
                isEdit ? 'Updated Successfully!' : 'Saved Successfully!',
                response.Msg || 'User has been saved.',
                isEdit ? 'fa-pen-to-square' : 'fa-circle-check'
            );
        } else {
            toastr.error((response && response.Msg) || (isEdit ? 'Failed to update user.' : 'Failed to save user.'));
        }
    }).catch(function () {
        toastr.error('An error occurred. Please try again.');
    }).finally(function () {
        $btn.prop('disabled', false);
        $('#btnSaveText').text(origText);
    });
}

function BuildPayload() {
    var statusVal = $('input[name="rdoStatus"]:checked').val();
    var row = {
        Code:                   U_EditCode > 0 ? parseInt(U_EditCode, 10) : 0,
        UserID:                 $('#txtUserID').val().trim(),
        UserName:               $('#txtUserName').val().trim(),
        Password: $('#txtPassword').val().trim(),
        GroupMaster_Code:       parseInt($('#ddlGroupName').val()) || 0,
        FixedParameter_Code:    parseInt($('#ddlDefaultCompany').val()) || 0,
        IsBizSolUser: $('#chkBizsolUser').prop('checked') ? 'Y' : 'N',
        UserMobileNo: $("#txtMobileNo").val(),
        Status:                 statusVal === 'Active' ? 'A' : 'C',
        UserCode:               getUserCode(),
    };

    if (U_EditRow) {
        row = Object.assign({}, U_EditRow, row);
    }

    return row;
}

/* ══════════════════════════════════════════
   DELETE
══════════════════════════════════════════ */
function ConfirmDelete(code) {
    U_EditCode = code;
    $('#reasonForDeleteInput').val('');
    $('#deleteConfirmBackdrop').addClass('show');
    setTimeout(function () { $('#reasonForDeleteInput').focus(); }, 150);
}

function DoDelete() {
    var reason = $('#reasonForDeleteInput').val();
    if (!reason) { toastr.warning('Please provide a reason for delete.'); $('#reasonForDeleteInput').focus(); return; }

    UserMasterService.DeleteUserMaster(U_EditCode, reason).then(function (res) {
        $('#deleteConfirmBackdrop').removeClass('show');
        if (res && res.Status === 'Y') {
            GetUserMasterList();
            ShowSuccessModal('Deleted Successfully!', res.Msg || 'The user has been removed.', 'fa-trash-can');
        } else {
            toastr.error((res && res.Msg) || 'Failed to delete user.');
        }
    }).catch(function () {
        toastr.error('Failed to delete user.');
        $('#deleteConfirmBackdrop').removeClass('show');
    });
}

/* ══════════════════════════════════════════
   VALIDATE
══════════════════════════════════════════ */
function ValidateForm() {
    var valid = true;

    if (!$('#txtUserID').val().trim()) {
        $('#txtUserID').addClass('im-input-error');
        $('#err_UserID').css('display', 'flex');
        $('#txtUserID').focus();
        valid = false;
    } else {
        $('#txtUserID').removeClass('im-input-error');
        $('#err_UserID').hide();
    }

    if (!$('#txtUserName').val().trim()) {
        $('#txtUserName').addClass('im-input-error');
        $('#err_UserName').css('display', 'flex');
        if (valid) $('#txtUserName').focus();
        valid = false;
    } else {
        $('#txtUserName').removeClass('im-input-error');
        $('#err_UserName').hide();
    }

    if (U_EditCode === 0 && !$('#txtPassword').val().trim()) {
        $('#txtPassword').addClass('im-input-error');
        $('#err_Password').css('display', 'flex');
        if (valid) $('#txtPassword').focus();
        valid = false;
    }

    if ($('#txtPassword').val() && $('#txtPassword').val() !== $('#txtConfirmPassword').val()) {
        $('#txtConfirmPassword').addClass('im-input-error');
        $('#err_ConfirmPassword').css('display', 'flex');
        valid = false;
    } else {
        $('#txtConfirmPassword').removeClass('im-input-error');
        $('#err_ConfirmPassword').hide();
    }

    if (!$('#ddlGroupName').val()) {
        $('#ddlGroupName').addClass('im-input-error');
        $('#err_GroupName').css('display', 'flex');
        if (valid) $('#ddlGroupName').focus();
        valid = false;
    } else {
        $('#ddlGroupName').removeClass('im-input-error');
        $('#err_GroupName').hide();
    }

    if (!valid) toastr.warning('Please fill all required fields correctly.');
    return valid;
}

/* ══════════════════════════════════════════
   FORM HELPERS
══════════════════════════════════════════ */
function PopulateForm(d) {
    ClearForm();
    $('#txtUserID').val(d.UserID || '');
    $('#txtUserName').val(d.UserName || '');
    $('#txtMobileNo').val(d.UserMobileNo || '');
    $('#ddlGroupName').val(d.GroupMaster_Code || '');
    $('#txtPassword').val('');
    $('#ddlDefaultCompany').val(d.FixedParameter_Code || '');
    $('#chkBizsolUser').prop('checked', d.IsBizSolUser === 'Y');
    SetStatus(d.Status === 'A' ? 'Active' : 'Inactive');
}

function ClearForm() {
    U_EditRow = null;
    $('#txtUserID').val('').removeClass('im-input-error');
    $('#txtUserName').val('').removeClass('im-input-error');
    $('#txtPassword').val('').removeClass('im-input-error');
    $('#txtConfirmPassword').val('').removeClass('im-input-error');
    $('#txtMobileNo').val('');
    $('#ddlGroupName').val('').removeClass('im-input-error');
    $('#ddlDefaultCompany').val('');
    $('#chkBizsolUser').prop('checked', false);
    SetStatus('Active');
    $('.im-err-text').hide();
}

function CloseForm() {
    ClearForm();
    U_EditCode = 0;
    U_ViewCode = 0;
    $('#userDialogBackdrop').removeClass('show');
}

/* ══════════════════════════════════════════
   STATUS TOGGLE
══════════════════════════════════════════ */
function SetStatus(status) {
    var isActive = status === 'Active';
    $('#rdoActive').prop('checked', isActive);
    $('#rdoInactive').prop('checked', !isActive);
    $('#lblActive').toggleClass('active-opt', isActive).css('opacity', isActive ? 1 : 0.55);
    $('#lblInactive').toggleClass('inactive-opt', !isActive).css('opacity', !isActive ? 1 : 0.55);
}

/* ══════════════════════════════════════════
   PASSWORD VALIDATION
══════════════════════════════════════════ */
function ValidatePasswordMatch() {
    var pwd  = $('#txtPassword').val();
    var cpwd = $('#txtConfirmPassword').val();
    if (cpwd && pwd !== cpwd) {
        $('#txtConfirmPassword').addClass('im-input-error');
        $('#err_ConfirmPassword').css('display', 'flex');
    } else {
        $('#txtConfirmPassword').removeClass('im-input-error');
        $('#err_ConfirmPassword').hide();
    }
}

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function pickEntity(response) {
    if (!response) return null;
    if (response.UserMasterList && response.UserMasterList[0]) return response.UserMasterList[0];
    if (Array.isArray(response) && response[0]) return response[0];
    if (response.Code != null || response.UserID != null) return response;
    if (response.data) return pickEntity(response.data);
    if (response.Data) return pickEntity(response.Data);
    return null;
}

function ShowSuccessModal(title, text, iconClass) {
    $('#successModalTitle').text(title || 'Done!');
    $('#successModalText').text(text || 'Operation completed successfully.');
    $('#successModalIcon').removeClass().addClass('fas ' + (iconClass || 'fa-circle-check'));
    $('#successBackdrop').addClass('show');
}

function CloseSuccessModal() {
    $('#successBackdrop').removeClass('show');
}

/* ══════════════════════════════════════════
   EXPOSE TO WINDOW (required for onclick)
══════════════════════════════════════════ */
window.GetUserMasterList = GetUserMasterList;
window.OpenNewUser       = OpenNewUser;
window.EditUser          = EditUser;
window.ViewUser          = ViewUser;
window.CloseViewModal    = CloseViewModal;
window.EditFromView      = EditFromView;
window.SaveUser          = SaveUser;
window.ConfirmDelete     = ConfirmDelete;
window.DoDelete          = DoDelete;
window.SetStatus         = SetStatus;
window.CloseSuccessModal = CloseSuccessModal;
