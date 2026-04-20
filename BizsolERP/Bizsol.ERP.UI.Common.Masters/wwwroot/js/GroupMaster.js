import { GroupMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_GroupMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

var G_EditCode = 0;
var G_ViewCode = 0;
var G_EditRow = null;
var G_TypeLabels = { 'A': 'Admin', 'U': 'User' };

function getTypeLabel(val) {
    return G_TypeLabels[val] || val || '—';
}

function getUserCode() {
    try {
        var auth = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        var c = parseInt(auth.UserMaster_Code, 10);
        return isNaN(c) ? 0 : c;
    } catch (e) { return 0; }
}

function getUserType() {
    try {
        var details = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
        if (Array.isArray(details) && details[0]) return (details[0].UserType || '').toUpperCase();
        return '';
    } catch (e) { return ''; }
}

function isAdminUser() {
    return getUserType() === 'A';
}

function getFinancialYear() {
    var d = new Date(), m = d.getMonth(), y = d.getFullYear();
    if (m < 3) y--;
    return y + '-' + (y + 1);
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    GetGroupMasterList();

    $('#btnModalClose, #btnCancelGroup').on('click', CloseForm);
    $('#btnCancelDelete').on('click', function () { $('#deleteConfirmBackdrop').removeClass('show'); });

    $('#txtGroupName').on('input', function () {
        if ($(this).val().trim()) { $(this).removeClass('im-input-error'); $('#err_GroupName').hide(); }
    });
});

/* ══════════════════════════════════════════
   LOAD LIST
══════════════════════════════════════════ */
function GetGroupMasterList() {
    GroupMasterService.GetGroupMasterList().then(function (response) {
        var rows = [];
        if (Array.isArray(response)) rows = response;
        else if (Array.isArray(response.data)) rows = response.data;
        else if (Array.isArray(response.Data)) rows = response.Data;

        var G_NatureGroups = { 'A': [], 'U': [] };
        rows.forEach(function (r) {
            var n = (r.GroupNature || r['Group Nature'] || '').trim();
            var t = r.GroupType || r['Group Type'] || '';
            if (n && G_NatureGroups[t] && G_NatureGroups[t].indexOf(n) === -1) {
                G_NatureGroups[t].push(n);
            }
        });
        window._NatureGroups = G_NatureGroups;

        function BuildNatureDropdown(filter) {
            var groups = { 'A': 'Admin', 'U': 'User' };
            var html = '';
            Object.keys(groups).forEach(function (type) {
                var items = (window._NatureGroups[type] || []).filter(function (n) {
                    return !filter || n.toLowerCase().indexOf(filter.toLowerCase()) !== -1;
                });
                if (items.length > 0) {
                    html += '<div style="padding:5px 12px 2px;font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:0.06em;text-transform:uppercase;border-bottom:1px solid #f3f4f9;">' + groups[type] + '</div>';
                    items.forEach(function (n) {
                        html += '<div class="nature-opt" data-val="' + n + '" style="padding:7px 14px;font-size:13px;color:#374151;cursor:pointer;" onmouseover="this.style.background=\'#eef2ff\'" onmouseout="this.style.background=\'\'">' + n + '</div>';
                    });
                }
            });
            return html;
        }
        window.BuildNatureDropdown = BuildNatureDropdown;

        function ShowNatureDropdown(filter) {
            var html = BuildNatureDropdown(filter);
            var $dd = $('#natureDropdown');
            if (!html) { $dd.hide(); return; }
            var rect = document.getElementById('txtNature').getBoundingClientRect();
            $dd.html(html)
               .css({ top: rect.bottom + 2, left: rect.left, width: rect.width })
               .show();
        }

        $(document).off('input.nature').on('input.nature', '#txtNature', function () {
            ShowNatureDropdown($(this).val());
        });
        $(document).off('focus.nature').on('focus.nature', '#txtNature', function () {
            ShowNatureDropdown($(this).val());
        });
        $(document).off('mousedown.naturePick').on('mousedown.naturePick', '#natureDropdown .nature-opt', function (e) {
            e.preventDefault();
            $('#txtNature').val($(this).data('val'));
            $('#natureDropdown').hide();
        });
        $(document).off('click.natureClose').on('click.natureClose', function (e) {
            if (!$(e.target).closest('#txtNature, #natureDropdown').length) {
                $('#natureDropdown').hide();
            }
        });

        if (rows.length > 0) {
            $('#tblGroupMaster').show();
            var StringFilterColumn = ['Group Name', 'Group Type', 'Group Nature'];
            var NumericFilterColumn = [];
            var DateFilterColumn = [];
            var Button = false;
            var showButtons = [];
            var StringdoubleFilterColumn = [];
            var hiddenColumns = ['Code',"Type"];
            var ColumnAlignment = { Action: 'center;width:118px;' };

            var updatedResponse = rows.map(function (item) {
                var row = Object.assign({}, item);
                row.Type = getTypeLabel(row.GroupType);
                var code = row.Code != null ? row.Code : 0;
                row.Action =
                    '<button class="im-btn-view" title="View" onclick="ViewGroup(' + code + ')">' +
                    '<i class="fas fa-eye"></i></button>' +
                    '<button class="im-btn-edit" title="Edit" onclick="EditGroup(' + code + ')">' +
                    '<i class="fas fa-pen"></i></button>' +
                    '<button class="im-btn-delete" title="Delete" onclick="ConfirmDelete(' + code + ')">' +
                    '<i class="fas fa-trash-can"></i></button>';
                return row;
            });

            BizsolCustomFilterGrid.CreateDataTable(
                'GroupMaster-header', 'GroupMaster-body',
                updatedResponse, Button, showButtons,
                StringFilterColumn, NumericFilterColumn, DateFilterColumn,
                StringdoubleFilterColumn, hiddenColumns, ColumnAlignment
            );
        } else {
            toastr.warning('No groups found. Add your first group.');
            $('#tblGroupMaster').hide();
        }
    }).catch(function () {
        toastr.error('Failed to load group list.');
    });
}

/* ══════════════════════════════════════════
   OPEN NEW
══════════════════════════════════════════ */
function OpenNewGroup() {
        if (!isAdminUser()) { toastr.error('Only Admin users can create a group.'); return; }
        G_EditCode = 0;
        G_EditRow = null;
        ClearForm();
        $('#formModalTitle').text('Add New Group');
        $('#btnSaveText').text('Save Group');
     
        $('#groupDialogBackdrop').addClass('show');
        setTimeout(function () { $('#txtGroupName').focus(); }, 140);
}

/* ══════════════════════════════════════════
   EDIT
══════════════════════════════════════════ */
function EditGroup(code) {
        if (!isAdminUser()) { toastr.error('Only Admin users can edit a group.'); return; }
        G_EditCode = code;
        ClearForm();
        $('#formModalTitle').text('Edit Group');
        $('#btnSaveText').text('Update Group');

        GroupMasterService.GetGroupMasterByCode(code).then(function (res) {
            var row = pickEntity(res);
            if (!row) { toastr.error('Failed to load group data.'); return; }
            G_EditRow = Object.assign({}, row);
            $('#txtGroupName').val(row.GroupName || '');
            $('#ddlType').val(row.GroupType || '');
            $('#txtNature').val(row.GroupNature || '');
          
            $('#groupDialogBackdrop').addClass('show');
        }).catch(function () { toastr.error('Error loading group. Please try again.'); });
}

/* ══════════════════════════════════════════
   VIEW
══════════════════════════════════════════ */
function ViewGroup(code) {
    //var ModuleName = 'User Group Master', OptionName = 'View', ShowMsg = 'Y', FinYear = getFinancialYear();
    //MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
    //    if (response.CheckModuleOptionRight === 'N') { toastr.error(response.Msg); return; }
        G_ViewCode = code;
        GroupMasterService.GetGroupMasterByCode(code).then(function (res) {
            var row = pickEntity(res);
            if (!row) { toastr.error('Failed to load group details.'); return; }
            $('#viewGroupCode').text(row.Code != null ? row.Code : '—');
            $('#viewGroupName').text(row.GroupName || '—');
            $('#vf_GroupName').text(row.GroupName || '—');
            $('#vf_Type').text(getTypeLabel(row.GroupType));
            $('#vf_Nature').text(row.GroupNature || '—');
            $('#vf_TypeLabel').text(getTypeLabel(row.GroupType));
            $('#vf_NatureLabel').text(row.GroupNature || '—');
        
           
            $('#viewGroupBackdrop').addClass('show');
        }).catch(function () { toastr.error('Error loading group details.'); });
    /*});*/
}

function CloseViewModal() {
    G_ViewCode = 0;
    $('#viewGroupBackdrop').removeClass('show');
}

function EditFromView() {
    var codeToEdit = G_ViewCode;
    CloseViewModal();
    EditGroup(codeToEdit);
}

/* ══════════════════════════════════════════
   DELETE
══════════════════════════════════════════ */
function ConfirmDelete(code) {
    if (!isAdminUser()) { toastr.error('Only Admin users can delete a group.'); return; }
    G_EditCode = code;
    $('#reasonForDeleteInput').val('');
    $('#deleteConfirmBackdrop').addClass('show');
    setTimeout(function () { $('#reasonForDeleteInput').focus(); }, 150);
}

function DoDelete() {
        var reason = $('#reasonForDeleteInput').val();
        if (!reason) { toastr.warning('Please provide a reason for delete.'); $('#reasonForDeleteInput').focus(); return; }
        GroupMasterService.DeleteGroupMaster(G_EditCode, reason).then(function (res) {
            $('#deleteConfirmBackdrop').removeClass('show');
            if (res && res.Status === 'Y') {
                GetGroupMasterList();
                ShowSuccessModal('Deleted Successfully!', res.Msg || 'The group has been removed.', 'fa-trash-can');
            } else {
                toastr.error((res && res.Msg) || 'Failed to delete group.');
            }
        }).catch(function () {
            toastr.error('Failed to delete group.');
            $('#deleteConfirmBackdrop').removeClass('show');
        });
}

/* ══════════════════════════════════════════
   SAVE
══════════════════════════════════════════ */
function SaveGroup() {
    if (!ValidateForm()) return;
    var isEdit = G_EditCode > 0;
    var payload = BuildPayload();
    var $btn = $('#btnSaveGroup');
    var origText = $('#btnSaveText').text();
    $btn.prop('disabled', true);
    $('#btnSaveText').text(isEdit ? 'Updating…' : 'Saving…');

    GroupMasterService.SaveGroupMaster(payload).then(function (response) {
        if (response && response.Status === 'Y') {
            CloseForm();
            GetGroupMasterList();
            ShowSuccessModal(
                isEdit ? 'Updated Successfully!' : 'Saved Successfully!',
                response.Msg || 'Group has been saved.',
                isEdit ? 'fa-pen-to-square' : 'fa-circle-check'
            );
        } else {
            toastr.error((response && response.Msg) || (isEdit ? 'Failed to update group.' : 'Failed to save group.'));
        }
    }).catch(function () {
        toastr.error('An error occurred. Please try again.');
    }).finally(function () {
        $btn.prop('disabled', false);
        $('#btnSaveText').text(origText);
    });
}

function BuildPayload() {
    var row = {
        Code: G_EditCode > 0 ? parseInt(G_EditCode, 10) : 0,
        GroupName: $('#txtGroupName').val().trim(),
        GroupType: $('#ddlType').val(),
        GroupNature: $('#txtNature').val().trim(),
        UserMaster_Code: getUserCode(),
       
    };

    if (G_EditRow) {
        row = Object.assign({}, G_EditRow, row);
    }

    return row;
}

function ValidateForm() {
    var valid = true;
    var $name = $('#txtGroupName');
    if (!$name.val().trim()) {
        $name.addClass('im-input-error');
        $('#err_GroupName').css('display', 'flex');
        $name.focus();
        valid = false;
    } else {
        $name.removeClass('im-input-error');
        $('#err_GroupName').hide();
    }
    if (!$('#ddlType').val()) {
        $('#ddlType').addClass('im-input-error');
        valid = false;
    } else {
        $('#ddlType').removeClass('im-input-error');
    }
    return valid;
}

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function pickEntity(response) {
    if (!response) return null;
    if (response.GroupMasterList && response.GroupMasterList[0]) return response.GroupMasterList[0];
    if (Array.isArray(response) && response[0]) return response[0];
    if (response.Code != null || response.GroupName != null) return response;
    return null;
}

function ClearForm() {
    G_EditRow = null;
    $('#txtGroupName').val('').removeClass('im-input-error');
    $('#ddlType').val('').removeClass('im-input-error');
    $('#txtNature').val('');
    $('#natureDropdown').hide();
    $('#err_GroupName').hide();
}

function CloseForm() {
    ClearForm();
    G_EditCode = 0;
    G_ViewCode = 0;
    $('#groupDialogBackdrop').removeClass('show');
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

function escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ══════════════════════════════════════════
   EXPOSE TO WINDOW (required for onclick)
══════════════════════════════════════════ */
window.OpenNewGroup     = OpenNewGroup;
window.EditGroup        = EditGroup;
window.ViewGroup        = ViewGroup;
window.CloseViewModal   = CloseViewModal;
window.EditFromView     = EditFromView;
window.ConfirmDelete    = ConfirmDelete;
window.DoDelete         = DoDelete;
window.SaveGroup        = SaveGroup;
window.CloseSuccessModal = CloseSuccessModal;
