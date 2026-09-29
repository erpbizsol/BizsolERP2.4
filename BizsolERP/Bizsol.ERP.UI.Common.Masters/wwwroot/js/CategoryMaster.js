import { CategoryMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_CategoryMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

var G_EditCode = 0;
var G_ViewCode = 0;

/** Full row from GetCategoryMasterByCode when editing; null for new. Preserves non-UI fields on save. */
var G_EditCategoryRow = null;

function getUserMasterCodeFromSession() {
    try {
        var auth = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        var c = parseInt(auth.UserMaster_Code, 10);
        return isNaN(c) ? 0 : c;
    } catch (e) {
        return 0;
    }
}

function numOrZero(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
}



$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
   
    GetCategoryMasterList();

    $('#btnModalClose, #btnCancelCategory').on('click', CloseForm);
    $('#btnCancelDelete').on('click', function () {
        $('#deleteConfirmBackdrop').removeClass('show');
    });

    ['CategoryName'].forEach(function (id) {
        $('#' + id).on('input', function () {
            if ($(this).val().trim()) {
                $('#err_' + id).hide();
                $(this).removeClass('im-input-error');
            }
        });
    });
});

function pickCategoryEntity(response) {
    if (!response) return null;
    if (response.CategoryMasterList && response.CategoryMasterList[0]) return response.CategoryMasterList[0];
    if (Array.isArray(response) && response[0]) return response[0];
    if (response.Code != null || response.CategoryName != null) return response;
    return null;
}

function GetCategoryMasterList() {
    CategoryMasterService.GetCategoryMasterList().then(function (response) {
        var rows = [];
        if (Array.isArray(response)) rows = response;
        else if (Array.isArray(response.data)) rows = response.data;
        else if (Array.isArray(response.Data)) rows = response.Data;

        if (rows.length > 0) {
            $('#tblCategoryMaster').show();
            var StringFilterColumn = ['CategoryName', 'CategoryDesc', 'StockApplicable', 'FormType'];
            var NumericFilterColumn = ['Entry No'];
            var DateFilterColumn = ['Entry Date'];
            var Button = false;
            var showButtons = [];
            var StringdoubleFilterColumn = [];
            var hiddenColumns = ['Code'];
            var ColumnAlignment = { Action: 'center;width:118px;' };

            var updatedResponse = rows.map(function (item) {
                var row = Object.assign({}, item);
                var code = row.Code != null ? row.Code : 0;
                var btns =
                    '<button class="im-btn-view" title="View" onclick="ViewCategory(' + code + ')">' +
                    '<i class="fas fa-eye"></i></button>' +
                    '<button class="im-btn-edit" title="Edit" onclick="EditCategory(' + code + ')">' +
                    '<i class="fas fa-pen"></i></button>' +
                    '<button class="im-btn-delete" title="Delete" onclick="ConfirmDelete(' + code + ')">' +
                    '<i class="fas fa-trash-can"></i></button>';
                return Object.assign({}, row, { Action: btns });
            });

            BizsolCustomFilterGrid.CreateDataTable(
                'CategoryMaster-header',
                'CategoryMaster-body',
                updatedResponse,
                Button,
                showButtons,
                StringFilterColumn,
                NumericFilterColumn,
                DateFilterColumn,
                StringdoubleFilterColumn,
                hiddenColumns,
                ColumnAlignment
            );
        } else {
            toastr.warning('No categories found. Add your first category.');
            $('#tblCategoryMaster').hide();
        }
    }).catch(function () {
        toastr.error('Failed to load category list.');
    });
}

function OpenNewCategory() {
    var ModuleName = 'Group Master',
        OptionName = 'New',
        ShowMsg = 'Y',
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return false;
        }
        G_EditCode = 0;
        ClearForm();
        $('#formModalTitle').text('Add New Category');
        $('#btnSaveText').text('Save Category');
        $('#categoryDialogBackdrop').addClass('show');
        setTimeout(function () { $('#CategoryName').focus(); }, 140);
    });
}

function EditCategory(code) {
    var ModuleName = 'Group Master',
        OptionName = 'Edit',
        ShowMsg = 'Y',
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return false;
        }
        G_EditCode = code;
        ClearForm();
        $('#formModalTitle').text('Edit Category');
        $('#btnSaveText').text('Update Category');
        CategoryMasterService.GetCategoryMasterByCode(code).then(function (res) {
            var row = pickCategoryEntity(res);
            if (row) {
                G_EditCategoryRow = Object.assign({}, row);
                $('#CategoryName').val(row.CategoryName || '');
                $('#CategoryDesc').val(row.CategoryDesc || '');
                $('#categoryDialogBackdrop').addClass('show');
            } else {
                toastr.error('Failed to load category data.');
            }
        }).catch(function () {
            toastr.error('Error loading category. Please try again.');
        });
    });
}

function ViewCategory(code) {
    var ModuleName = 'Group Master',
        OptionName = 'View',
        ShowMsg = 'Y',
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return false;
        }
        G_ViewCode = code;
        CategoryMasterService.GetCategoryMasterByCode(code).then(function (res) {
            var row = pickCategoryEntity(res);
            if (!row) {
                toastr.error('Failed to load category details.');
                return;
            }
            $('#viewCategoryCode').text(row.Code != null ? row.Code : '—');
            $('#viewCategoryName').text(row.CategoryName || '—');
            $('#vf_CategoryName').text(row.CategoryName || '—');
            $('#vf_CategoryDesc').text(row.CategoryDesc || '—');
            $('#viewCategoryBackdrop').addClass('show');
        }).catch(function () {
            toastr.error('Error loading category details. Please try again.');
        });
    });
}

function CloseViewModal() {
    G_ViewCode = 0;
    $('#viewCategoryBackdrop').removeClass('show');
}

function EditFromView() {
    var codeToEdit = G_ViewCode;
    CloseViewModal();
    EditCategory(codeToEdit);
}

function ConfirmDelete(code) {
    G_EditCode = code;
    $('#reasonForDeleteInput').val('');
    $('#deleteConfirmBackdrop').addClass('show');
    setTimeout(function () { $('#reasonForDeleteInput').focus(); }, 150);
}

function DoDelete() {
    var ModuleName = 'Group Master',
        OptionName = 'Delete',
        ShowMsg = 'Y',
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return false;
        }
        var reasonForDelete = $('#reasonForDeleteInput').val();
        if (!reasonForDelete) {
            toastr.warning('Please Provide a Reason For Delete.');
            $('#reasonForDeleteInput').focus();
            return;
        }
        CategoryMasterService.DeleteCategoryMaster(G_EditCode, reasonForDelete).then(function (response) {
            $('#deleteConfirmBackdrop').removeClass('show');
            if (response && response.Status === 'Y') {
                GetCategoryMasterList();
                ShowSuccessModal(
                    'Deleted Successfully!',
                    response.Msg || 'The category has been removed.',
                    'fa-trash-can'
                );
            } else {
                toastr.error((response && response.Msg) || 'Failed to delete category.');
            }
        }).catch(function () {
            toastr.error('Failed to delete category. Please try again.');
            $('#deleteConfirmBackdrop').removeClass('show');
        });
    });
}

function SaveCategory() {
    if (!ValidateForm()) return;
    var isEdit = G_EditCode > 0;
    var payload = BuildPayload();
    var btnSave = $('#btnSaveCategory');
    var origLabel = $('#btnSaveText').text();

    btnSave.prop('disabled', true);
    $('#btnSaveText').text(isEdit ? 'Updating…' : 'Saving…');

    CategoryMasterService.SaveCategoryMaster(payload).then(function (response) {
        if (response && response.Status === 'Y') {
            CloseForm();
            GetCategoryMasterList();
            if (isEdit) {
                ShowSuccessModal(
                    'Updated Successfully!',
                    response.Msg || 'Category has been saved.',
                    'fa-pen-to-square'
                );
            } else {
                ShowSuccessModal(
                    'Saved Successfully!',
                    response.Msg || 'New category has been added.',
                    'fa-circle-check'
                );
            }
        } else {
            toastr.error(
                (response && response.Msg) ||
                (isEdit ? 'Failed to update category.' : 'Failed to save category.')
            );
        }
    }).catch(function () {
        toastr.error('An error occurred. Please try again.');
    }).finally(function () {
        btnSave.prop('disabled', false);
        $('#btnSaveText').text(origLabel);
    });
}

function BuildPayload() {
    var userCode = getUserMasterCodeFromSession();
    var formType = '';
    try {
        formType = new URLSearchParams(window.location.search).get('FormType') || '';
    } catch (e) {}

    var name = $('#CategoryName').val().trim();
    var desc = $('#CategoryDesc').val().trim();
    var code = parseInt(G_EditCode, 10) || 0;

    var row = {
        Code: code,
        CategoryName: name,
        CategoryDesc: desc,
        StockApplicable: '',
        FormType: formType,
        ComponentCostPercentage: 0,
        GroupSequenceForValuation: 0,
        SortOrder: 0,
        RejectedItem: '',
        UserMaster_Code: userCode,
    };

    if (G_EditCategoryRow) {
        row.StockApplicable =
            G_EditCategoryRow.StockApplicable != null && G_EditCategoryRow.StockApplicable !== ''
                ? G_EditCategoryRow.StockApplicable
                : '';
        row.ComponentCostPercentage = numOrZero(G_EditCategoryRow.ComponentCostPercentage);
        row.GroupSequenceForValuation = numOrZero(G_EditCategoryRow.GroupSequenceForValuation);
        row.SortOrder = numOrZero(G_EditCategoryRow.SortOrder);
        row.RejectedItem =
            G_EditCategoryRow.RejectedItem != null ? G_EditCategoryRow.RejectedItem : '';
        if (!formType && G_EditCategoryRow.FormType) {
            row.FormType = G_EditCategoryRow.FormType;
        }
    }

    row.CategoryName = name;
    row.CategoryDesc = desc;
    row.Code = code;
    row.FormType = formType || row.FormType || '';
    row.UserMaster_Code = userCode;

    return [row];
}

function ValidateForm() {
    var valid = true;
    var el = $('#CategoryName');
    var err = $('#err_CategoryName');
    if (!el.val().trim()) {
        err.css('display', 'flex');
        el.addClass('im-input-error');
        valid = false;
    } else {
        err.hide();
        el.removeClass('im-input-error');
    }
    return valid;
}

function ClearForm() {
    G_EditCategoryRow = null;
    $('#CategoryName').val('').removeClass('im-input-error');
    $('#CategoryDesc').val('');
    $('#err_CategoryName').hide();
}

function CloseForm() {
    ClearForm();
    G_EditCode = 0;
    G_ViewCode = 0;
    $('#categoryDialogBackdrop').removeClass('show');
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

function getFinancialYear() {
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth();
    var startYear = currentDate.getFullYear();
    if (currentMonth < 3) {
        startYear = startYear - 1;
    }
    return startYear + '-' + (startYear + 1);
}

window.OpenNewCategory = OpenNewCategory;
window.EditCategory = EditCategory;
window.ViewCategory = ViewCategory;
window.CloseViewModal = CloseViewModal;
window.EditFromView = EditFromView;
window.ConfirmDelete = ConfirmDelete;
window.DoDelete = DoDelete;
window.SaveCategory = SaveCategory;
window.CloseSuccessModal = CloseSuccessModal;
