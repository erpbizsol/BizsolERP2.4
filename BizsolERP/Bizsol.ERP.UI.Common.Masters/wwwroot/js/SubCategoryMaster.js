import { SubCategoryMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_SubCategoryMasterService.js';
import { CategoryMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_CategoryMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { BranchDetailsFunction } from '../../Bizsol.WebERP.UI.Shared/js/BranchdetailsFunction.js?v=branch-fn-v10';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

var G_EditCode = 0;
var G_ViewCode = 0;
var G_EditRow = null;
var G_List = [];
/** Branch-level operation rights from BranchDetailsFunction.AllowNew/AllowEdit/AllowDelete (FixedParameter). */
var G_AllowNew = true;
var G_AllowEdit = true;
var G_AllowDelete = true;
/** Module option rights (User Module Right: New / Edit / Delete / View). */
var G_HasNew = true;
var G_HasEdit = true;
var G_HasDelete = true;
var G_HasView = true;
/** Whether the currently logged-in company is the Main Company (FixedParameter.MainCompany via GetBranchInfo API). */
var G_IsMainCompany = false;
/** Branch companies eligible to receive Main Company's master data (MaintainMasterTransferApplicable = 'Y'). */
var G_BranchList = [];
/** Codes of branches checked in the Branch Details box (in-session until Save). */
var G_SelectedBranchCodes = [];
/** Branches that already received data — checked + disabled; cannot be unchecked. */
var G_LockedBranchCodes = [];
/** Transferred branches loaded from DB for this edit session — never shrinks until form closes. */
var G_InitialLockedBranchCodes = [];
/** True after user clicks OK in Branch Details — keeps selection when reopening before Save. */
var G_BranchSelectionDirty = false;
/** When Save is blocked for missing branches, auto-save after Branch Details OK. */
var G_PendingSaveAfterBranchDetails = false;
/** CategoryMaster.Code → CategoryMaster.CategoryName (real Group Master rows only). */
var G_GroupNameByCode = {};
var MODULE_NAME = 'Sub Group';

function getFormType() {
    try {
        return new URLSearchParams(window.location.search).get('FormType') || 'S';
    } catch (e) {
        return 'S';
    }
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

function getFinancialYear() {
    if (BizSolHelperFunction && typeof BizSolHelperFunction.getFinancialYear === 'function') {
        return BizSolHelperFunction.getFinancialYear();
    }
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth();
    var startYear = currentDate.getFullYear();
    if (currentMonth < 3) startYear = startYear - 1;
    return startYear + '-' + (startYear + 1);
}

function getModuleName() {
    try {
        var fromUrl = new URLSearchParams(window.location.search).get('ModuleDesp');
        if (fromUrl && fromUrl.trim()) return decodeURIComponent(fromUrl.trim());
    } catch (e) { /* use fallback */ }
    return MODULE_NAME;
}

function isRightAllowed(response) {
    return !(response && response.CheckModuleOptionRight === 'N');
}

function checkRight(optionName, showMsg) {
    var show = showMsg == null ? 'Y' : showMsg;
    return MenuService.CheckModuleOptionRight(getModuleName(), optionName, show, getFinancialYear()).then(function (response) {
        if (!isRightAllowed(response)) {
            if (show === 'Y') {
                toastr.error(response.Msg || ('No rights for ' + optionName));
            }
            return false;
        }
        return true;
    }).catch(function () {
        if (show === 'Y') {
            toastr.error('Unable to verify module rights.');
            return false;
        }
        return true;
    });
}

function canNew() { return G_HasNew && G_AllowNew; }
function canEdit() { return G_HasEdit && G_AllowEdit; }
function canDelete() { return G_HasDelete && G_AllowDelete; }
function canView() { return G_HasView; }

function loadUserRights() {
    return Promise.all([
        checkRight('New', 'N'),
        checkRight('Edit', 'N'),
        checkRight('Delete', 'N'),
        checkRight('View', 'N')
    ]).then(function (results) {
        G_HasNew = results[0] !== false;
        G_HasEdit = results[1] !== false;
        G_HasDelete = results[2] !== false;
        G_HasView = results[3] !== false;
        applyActionRightsToUI();
    }).catch(function (err) {
        console.error('[SubGroup] Failed to load user rights, failing open (all allowed).', err);
        G_HasNew = true;
        G_HasEdit = true;
        G_HasDelete = true;
        G_HasView = true;
        applyActionRightsToUI();
    });
}

function normalizeList(response) {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.Data)) return response.Data;
    if (Array.isArray(response.SubCategoryMasterList)) return response.SubCategoryMasterList;
    if (Array.isArray(response.result)) return response.result;
    if (Array.isArray(response.Result)) return response.Result;
    return [];
}

function pickEntity(response) {
    if (!response) return null;
    if (response.SubCategoryMasterList && response.SubCategoryMasterList[0]) return response.SubCategoryMasterList[0];
    if (Array.isArray(response) && response[0]) return response[0];
    if (response.Code != null || response.SubCategoryName != null || response.CategoryName != null) return response;
    return null;
}

function yn(val) {
    if (val === true || val === 1 || val === '1') return 'Y';
    var s = (val == null ? '' : String(val)).trim().toUpperCase();
    return s === 'Y' || s === 'YES' || s === 'TRUE' ? 'Y' : 'N';
}

function pickSubCategoryName(item) {
    if (!item) return '';
    var v = item.SubCategoryName || item.subCategoryName || '';
    return v != null ? String(v).trim() : '';
}

function pickUnderGroup(item) {
    if (!item) return '';
    var fromView = (item.Category || item.category || '').trim();
    if (fromView) return fromView;
    var joined = (item.CategoryName || item.categoryName || '').trim();
    var sub = pickSubCategoryName(item);
    if (joined && (!sub || joined.toUpperCase() !== sub.toUpperCase())) return joined;
    var code = parseInt(item.CategoryMaster_Code, 10) || 0;
    if (code > 0 && G_GroupNameByCode[code]) return G_GroupNameByCode[code];
    if (code === 1) return 'CONSUMABLE';
    if (code === 2) return 'NON CONSUMABLE';
    return '';
}

$(document).ready(function () {
    // Escape #modern-content fixed pane so modals center on full viewport
    $('.im-backdrop').appendTo(document.body);

    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');

    $('#btnModalClose, #btnCancelSubGroup').on('click', CloseForm);
    $('#btnCancelDelete').on('click', function () {
        $('#deleteConfirmBackdrop').removeClass('show');
    });
    $('#btnBranchClose').on('click', function () {
        $('#branchDetailsBackdrop').removeClass('show');
    });
    $('#btnBranchOk').on('click', function () {
        G_SelectedBranchCodes = collectBranchSelectionFromUi();
        G_BranchSelectionDirty = true;

        if (G_PendingSaveAfterBranchDetails && !hasSelectedBranches()) {
            toastr.warning('Please select at least one branch. Branch Details is mandatory before save.');
            return;
        }

        $('#branchDetailsBackdrop').removeClass('show');

        if (G_PendingSaveAfterBranchDetails && hasSelectedBranches()) {
            G_PendingSaveAfterBranchDetails = false;
            SaveSubGroup(true);
        }
    });
    $('#btnSelectAllBranches').on('click', function () {
        var $checkboxes = $('#branchListContainer input[type="checkbox"]:not(:disabled)');
        if (!$checkboxes.length) return;
        var allChecked = $checkboxes.filter(':checked').length === $checkboxes.length;
        $checkboxes.prop('checked', !allChecked);
        $('#branchListContainer input[type="checkbox"][data-locked="1"]').prop('checked', true);
    });

    $('#branchListContainer').on('change', 'input[type="checkbox"][data-locked="1"]', function () {
        $(this).prop('checked', true);
    });

    $('#txtSubGroupDescription').on('input', function () {
        if ($(this).val().trim()) {
            $('#err_SubGroupDescription').hide();
            $(this).removeClass('im-input-error');
        }
    });
    $('#ddlUnderGroup').on('change', function () {
        if ($(this).val()) {
            $('#err_UnderGroup').hide();
            $(this).removeClass('im-input-error');
        }
    });
    $('#txtItemCodePrefix').on('input', function () {
        if ($(this).val().trim()) {
            $('#err_ItemCodePrefix').hide();
            $(this).removeClass('im-input-error');
        }
    });

    Promise.all([loadBranchPermissions(), loadUserRights()]).then(function () {
        return Promise.all([loadGroupMasterMap(), GetSubCategoryMasterList()]);
    }).then(function () {
        if (!Object.keys(G_GroupNameByCode).length) {
            toastr.warning('No Under Group found in Group Master. Please create groups first.');
        }
    });
    loadMainCompanyFlag();
});

/**
 * Shows the "Branch Details" button only when the currently logged-in company is the Main
 * Company (FixedParameter.MainCompany = 'Y'). Branch companies never see this button.
 * Fails closed (hidden) on error, since this manages cross-branch data and shouldn't be
 * exposed by default if the check itself is unreliable.
 */
function loadMainCompanyFlag() {
    try {
        return BranchDetailsFunction.MainCompany().then(function (value) {
            G_IsMainCompany = (value || '').toString().trim().toUpperCase() === 'Y';
            applyMainCompanyVisibility();
        }).catch(function (err) {
            console.error('[SubGroup] Failed to load MainCompany flag, hiding Branch Details button.', err);
            G_IsMainCompany = false;
            applyMainCompanyVisibility();
        });
    } catch (err) {
        console.error('[SubGroup] BranchDetailsFunction.MainCompany unavailable, hiding Branch Details button.', err);
        G_IsMainCompany = false;
        applyMainCompanyVisibility();
        return Promise.resolve();
    }
}

function applyMainCompanyVisibility() {
    var $btnBranch = $('#btnBranchDetails');
    if (G_IsMainCompany) {
        $btnBranch.show();
    } else {
        $btnBranch.hide();
    }
}

/**
 * Loads branch-level AllowNew/AllowEdit/AllowDelete (FixedParameter, via AllowOperationsInBranch API)
 * and applies them to the New Sub Group button. Grid Edit/Delete buttons pick these up when rendered.
 * On failure (including BizSolHelperFunction being an outdated/incomplete cached copy), fails open
 * (all true) — wrapped in try/catch since a missing method throws synchronously, not as a rejection,
 * and must never be allowed to block the rest of the page (group dropdown + grid) from loading.
 */
function loadBranchPermissions() {
    try {
        return Promise.all([
            BranchDetailsFunction.AllowNew(),
            BranchDetailsFunction.AllowEdit(),
            BranchDetailsFunction.AllowDelete()
        ]).then(function (results) {
            G_AllowNew = results[0] !== false;
            G_AllowEdit = results[1] !== false;
            G_AllowDelete = results[2] !== false;
            applyActionRightsToUI();
        }).catch(function (err) {
            console.error('[SubGroup] Failed to load branch permissions, failing open (all allowed).', err);
            G_AllowNew = true;
            G_AllowEdit = true;
            G_AllowDelete = true;
            applyActionRightsToUI();
        });
    } catch (err) {
        console.error('[SubGroup] BranchDetailsFunction permission functions unavailable, failing open (all allowed).', err);
        G_AllowNew = true;
        G_AllowEdit = true;
        G_AllowDelete = true;
        applyActionRightsToUI();
        return Promise.resolve();
    }
}

function applyActionRightsToUI() {
    var $btnNew = $('#btnNewSubGroup');
    if (!G_HasNew) {
        $btnNew.hide();
    } else if (!G_AllowNew) {
        $btnNew.show().prop('disabled', true).attr('title', 'Adding a new Sub Group is not allowed for this branch.');
    } else {
        $btnNew.show().prop('disabled', false).removeAttr('title');
    }

    var $btnEditFromView = $('#btnEditFromView');
    if (!G_HasEdit) {
        $btnEditFromView.hide();
    } else if (!G_AllowEdit) {
        $btnEditFromView.show().prop('disabled', true).attr('title', 'Editing is not allowed for this branch.');
    } else {
        $btnEditFromView.show().prop('disabled', false).removeAttr('title');
    }
}

function buildActionButtons(code) {
    var btns = '';
    if (G_HasView) {
        btns +=
            '<button class="im-btn-view" title="View" onclick="ViewSubGroup(' + code + ')">' +
            '<i class="fas fa-eye"></i></button>';
    }
    if (G_HasEdit) {
        btns +=
            '<button class="im-btn-edit" title="Edit" onclick="EditSubGroup(' + code + ')"' +
            (G_AllowEdit ? '' : ' disabled title="Editing is not allowed for this branch."') + '>' +
            '<i class="fas fa-pen"></i></button>';
    }
    if (G_HasDelete) {
        btns +=
            '<button class="im-btn-delete" title="Delete" onclick="ConfirmDelete(' + code + ')"' +
            (G_AllowDelete ? '' : ' disabled title="Deleting is not allowed for this branch."') + '>' +
            '<i class="fas fa-trash-can"></i></button>';
    }
    return btns;
}

function pickGroupMasterName(item) {
    if (!item) return '';
    return (
        item.CategoryName || item.categoryName ||
        item.Group || item.group ||
        item.Category || item.category ||
        item['Group Desc'] || item.GroupDesc || item.groupDesc ||
        ''
    ).trim();
}

function loadGroupMasterMap() {
    return CategoryMasterService.GetCategoryMasterList().then(function (response) {
        G_GroupNameByCode = {};
        normalizeList(response).forEach(function (item) {
            var code = parseInt(item.Code ?? item.code, 10) || 0;
            var name = pickGroupMasterName(item);
            if (code > 0 && name) G_GroupNameByCode[code] = name;
        });
        renderUnderGroupDropdown();
    }).catch(function () {
        G_GroupNameByCode = {};
        renderUnderGroupDropdown();
        toastr.error('Failed to load Under Group list from Group Master.');
    });
}

function setUnderGroupEditable(editable) {
    $('#ddlUnderGroup').prop('disabled', !editable);
}

function renderUnderGroupDropdown() {
    var $ddl = $('#ddlUnderGroup');
    var prevCode = parseInt($ddl.find('option:selected').attr('data-category-master-code') || $ddl.val(), 10) || 0;
    $ddl.empty().append('<option value="">-- Select Group --</option>');
    Object.keys(G_GroupNameByCode).sort(function (a, b) {
        return (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0);
    }).forEach(function (k) {
        var name = G_GroupNameByCode[k];
        if (!name) return;
        // value = CategoryMaster.Code (FK). Text is only for display.
        $ddl.append(
            $('<option></option>')
                .attr('value', k)
                .attr('data-category-master-code', k)
                .text(name)
        );
    });
    if (prevCode > 0 && G_GroupNameByCode[prevCode]) {
        $ddl.val(String(prevCode));
    }
}

function GetSubCategoryMasterList() {
    return SubCategoryMasterService.GetSubCategoryMasterList(getFormType()).then(function (response) {
        var rows = normalizeList(response);
        G_List = rows.slice().sort(function (a, b) {
            return (parseInt(a.Code, 10) || 0) - (parseInt(b.Code, 10) || 0);
        });

        // Enrich group map from already-saved Sub Groups (Code + Category text)
        G_List.forEach(function (row) {
            var code = parseInt(row.CategoryMaster_Code, 10) || 0;
            var parent = (row.Category || row.category || row.CategoryName || '').trim();
            if (code > 0 && parent && !G_GroupNameByCode[code]) {
                G_GroupNameByCode[code] = parent;
            }
        });
        renderUnderGroupDropdown();

        if (rows.length > 0) {
            $('#tblSubCategoryMaster').show();
            var StringFilterColumn = ['Sub Group Description', 'Under Group', 'Item Code', 'Sub Group Code'];
            var NumericFilterColumn = [];
            var DateFilterColumn = [];
            var Button = false;
            var showButtons = [];
            var StringdoubleFilterColumn = [];
            var hiddenColumns = ['Code'];
            var ColumnAlignment = { Action: 'center;width:118px;' };

            var updatedResponse = rows.map(function (item) {
                var code = item.Code != null ? item.Code : 0;
                var btns = buildActionButtons(code);

                return {
                    Code: code,
                    'Sub Group Description': pickSubCategoryName(item) || '—',
                    'Under Group': pickUnderGroup(item) || '—',
                    'Item Code': item.ItemCode || '',
                    'Sub Group Code': item.SubGroupCode || '',
                    Action: btns
                };
            });

            BizsolCustomFilterGrid.CreateDataTable(
                'SubCategoryMaster-header',
                'SubCategoryMaster-body',
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
            toastr.warning('No sub groups found. Add your first sub group.');
            $('#tblSubCategoryMaster').hide();
        }
    }).catch(function () {
        toastr.error('Failed to load Sub Group list.');
    });
}

function OpenNewSubGroup() {
    if (!canNew()) {
        toastr.warning(!G_HasNew
            ? 'You do not have New rights for Sub Group.'
            : 'Adding a new Sub Group is not allowed for this branch.');
        return;
    }
    checkRight('New').then(function (ok) {
        if (!ok) return;
        G_EditCode = 0;
        G_EditRow = null;
        ClearForm();
        loadGroupMasterMap().then(function () {
            $('#formModalTitle').text('Add New Sub Group');
            $('#btnSaveText').text('Save Sub Group');
            $('#subGroupDialogBackdrop').addClass('show');
            setTimeout(function () { $('#txtSubGroupDescription').focus(); }, 140);
        });
    });
}

function EditSubGroup(code) {
    if (!canEdit()) {
        toastr.warning(!G_HasEdit
            ? 'You do not have Edit rights for Sub Group.'
            : 'Editing Sub Group is not allowed for this branch.');
        return;
    }
    checkRight('Edit').then(function (ok) {
        if (!ok) return;
        G_EditCode = code;
        ClearForm();
        loadGroupMasterMap().then(function () {
            $('#formModalTitle').text('Edit Sub Group');
            $('#btnSaveText').text('Update Sub Group');
            return SubCategoryMasterService.GetSubCategoryMasterByCode(code);
        }).then(function (res) {
            var row = pickEntity(res);
            if (!row) {
                var idx = G_List.findIndex(function (r) { return (parseInt(r.Code, 10) || 0) === (parseInt(code, 10) || 0); });
                row = idx >= 0 ? G_List[idx] : null;
            }
            if (!row) {
                toastr.error('Failed to load Sub Group data.');
                return;
            }
            G_EditRow = Object.assign({}, row);
            fillForm(row);
            var branchLoadPromise = (G_IsMainCompany && code > 0)
                ? BranchDetailsFunction.GetTransferredBranches('SubCategoryMaster', code).catch(function () {
                    return [];
                }).then(function (codes) {
                    applyTransferredBranchState(codes, true);
                })
                : Promise.resolve();

            return branchLoadPromise.then(function () {
                $('#subGroupDialogBackdrop').addClass('show');
            });
        }).catch(function () {
            toastr.error('Error loading Sub Group. Please try again.');
        });
    });
}

function fillForm(row) {
    $('#txtSubGroupDescription').val(pickSubCategoryName(row));

    var underCode = parseInt(row.CategoryMaster_Code, 10) || 0;
    var underName = pickUnderGroup(row);
    if (underCode > 0 && !G_GroupNameByCode[underCode] && underName) {
        G_GroupNameByCode[underCode] = underName;
        renderUnderGroupDropdown();
    }

    var $ddl = $('#ddlUnderGroup');
    if (underCode > 0 && G_GroupNameByCode[underCode]) {
        $ddl.val(String(underCode));
    } else if (underName) {
        var matchedCode = 0;
        Object.keys(G_GroupNameByCode).forEach(function (k) {
            if (G_GroupNameByCode[k].toUpperCase() === underName.toUpperCase()) matchedCode = parseInt(k, 10) || 0;
        });
        if (matchedCode > 0) {
            $ddl.val(String(matchedCode));
        } else {
            $ddl.append(
                $('<option></option>')
                    .attr('value', underCode || underName)
                    .attr('data-category-master-code', underCode)
                    .text(underName)
            );
            $ddl.val(String(underCode || underName));
        }
    } else {
        $ddl.val('');
    }

    $('#txtItemCodePrefix').val(row.ItemCode || '');
    $('#txtSubGroupCode').val(row.SubGroupCode || '');
    $('#chkIsPackingMaterial').prop('checked', yn(row.IsPackingMaterial) === 'Y');
    setUnderGroupEditable(!(G_EditCode > 0));
}

function ViewSubGroup(code) {
    if (!canView()) {
        toastr.warning('You do not have View rights for Sub Group.');
        return;
    }
    checkRight('View').then(function (ok) {
        if (!ok) return;
        G_ViewCode = code;
        SubCategoryMasterService.GetSubCategoryMasterByCode(code).then(function (res) {
            var row = pickEntity(res);
            if (!row) {
                var idx = G_List.findIndex(function (r) { return (parseInt(r.Code, 10) || 0) === (parseInt(code, 10) || 0); });
                row = idx >= 0 ? G_List[idx] : null;
            }
            if (!row) {
                toastr.error('Failed to load Sub Group details.');
                return;
            }
            $('#viewSubGroupCode').text(row.Code != null ? row.Code : '—');
            $('#viewSubGroupName').text(pickSubCategoryName(row) || '—');
            $('#vf_SubGroupDescription').text(pickSubCategoryName(row) || '—');
            $('#vf_UnderGroup').text(pickUnderGroup(row) || '—');
            $('#vf_ItemCode').text(row.ItemCode || '—');
            $('#vf_SubGroupCode').text(row.SubGroupCode || '—');
            $('#vf_IsPackingMaterial').text(yn(row.IsPackingMaterial) === 'Y' ? 'Yes' : 'No');
            $('#viewSubGroupBackdrop').addClass('show');
        }).catch(function () {
            toastr.error('Error loading Sub Group details. Please try again.');
        });
    });
}

function CloseViewModal() {
    G_ViewCode = 0;
    $('#viewSubGroupBackdrop').removeClass('show');
}

function EditFromView() {
    var codeToEdit = G_ViewCode;
    CloseViewModal();
    EditSubGroup(codeToEdit);
}

function ConfirmDelete(code) {
    if (!canDelete()) {
        toastr.warning(!G_HasDelete
            ? 'You do not have Delete rights for Sub Group.'
            : 'Deleting Sub Group is not allowed for this branch.');
        return;
    }
    checkRight('Delete').then(function (ok) {
        if (!ok) return;
        G_EditCode = code;
        $('#reasonForDeleteInput').val('');
        $('#deleteConfirmBackdrop').addClass('show');
        setTimeout(function () { $('#reasonForDeleteInput').focus(); }, 150);
    });
}

function DoDelete() {
    if (!canDelete()) {
        toastr.warning(!G_HasDelete
            ? 'You do not have Delete rights for Sub Group.'
            : 'Deleting Sub Group is not allowed for this branch.');
        $('#deleteConfirmBackdrop').removeClass('show');
        return;
    }
    checkRight('Delete').then(function (ok) {
        if (!ok) return;
        var reasonForDelete = ($('#reasonForDeleteInput').val() || '').trim();
        if (!reasonForDelete) {
            toastr.warning('Please Provide a Reason For Delete.');
            $('#reasonForDeleteInput').focus();
            return;
        }
        if (!G_EditCode || parseInt(G_EditCode, 10) <= 0) {
            toastr.error('Invalid Sub Group code. Please close and try delete again.');
            return;
        }
        SubCategoryMasterService.DeleteSubCategoryMaster(G_EditCode, reasonForDelete).then(function (response) {
            $('#deleteConfirmBackdrop').removeClass('show');
            if (response && (response.Status === 'Y' || response.Status === 'SUCCESS')) {
                G_EditCode = 0;
                GetSubCategoryMasterList();
                ShowSuccessModal(
                    'Deleted Successfully!',
                    response.Msg || 'The sub group has been removed.',
                    'fa-trash-can'
                );
            } else {
                var deleteMsg = (response && response.Msg) || 'Failed to delete Sub Group.';
                deleteMsg = deleteMsg.trim().replace(/\.$/, '');
                if (/for this record$/i.test(deleteMsg))
                    deleteMsg = deleteMsg.replace(/\s*for this record\s*$/i, '').trim();
                toastr.error(deleteMsg);
            }
        }).catch(function (err) {
            var detail = (err && err.xhr && err.xhr.responseText) ? String(err.xhr.responseText).substring(0, 300) : '';
            toastr.error('Failed to delete Sub Group.' + (detail ? (' ' + detail) : ' Please try again.'));
            $('#deleteConfirmBackdrop').removeClass('show');
        });
    });
}

function hasSelectedBranches() {
    return unionBranchCodes(G_SelectedBranchCodes, G_LockedBranchCodes, G_InitialLockedBranchCodes).length > 0;
}

function requireBranchDetailsBeforeSave() {
    G_PendingSaveAfterBranchDetails = true;
    toastr.warning('Branch Details is mandatory. Please select at least one branch.');
    OpenBranchDetails();
}

function SaveSubGroup(skipBranchCheck) {
    if (!ValidateForm()) return;
    if (!skipBranchCheck && G_IsMainCompany && !hasSelectedBranches()) {
        requireBranchDetailsBeforeSave();
        return;
    }

    var isEdit = G_EditCode > 0;
    if (isEdit ? !canEdit() : !canNew()) {
        toastr.warning(isEdit
            ? (!G_HasEdit ? 'You do not have Edit rights for Sub Group.' : 'Editing Sub Group is not allowed for this branch.')
            : (!G_HasNew ? 'You do not have New rights for Sub Group.' : 'Adding a new Sub Group is not allowed for this branch.'));
        return;
    }

    checkRight(isEdit ? 'Edit' : 'New').then(function (ok) {
        if (!ok) return;
        SaveSubGroupAfterRightCheck(isEdit);
    });
}

function SaveSubGroupAfterRightCheck(isEdit) {
    var payload = BuildPayload();
    if (!payload) return;

    // Capture branch state BEFORE CloseForm() — ClearForm() resets session globals.
    var lockedBranchesAtSave = G_InitialLockedBranchCodes.slice();
    var branchCodesToTransfer = unionBranchCodes(G_SelectedBranchCodes, lockedBranchesAtSave);

    var btnSave = $('#btnSaveSubGroup');
    var origLabel = $('#btnSaveText').text();
    btnSave.prop('disabled', true);
    $('#btnSaveText').text(isEdit ? 'Updating…' : 'Saving…');

    SubCategoryMasterService.SaveSubCategoryMaster(payload).then(function (response) {
        if (response && response.Status === 'Y') {
            var savedCode = parseInt((response && response.Code) || payload[0].Code, 10) || 0;
            var reloadPromise = GetSubCategoryMasterList();
            var finishSave = function () {
                CloseForm();
                ShowSuccessModal(
                    isEdit ? 'Updated Successfully!' : 'Saved Successfully!',
                    response.Msg || (isEdit ? 'Sub Group has been saved.' : 'New Sub Group has been added.'),
                    isEdit ? 'fa-pen-to-square' : 'fa-circle-check'
                );
            };
            var transferPromise = transferToSelectedBranches(
                savedCode, payload[0], reloadPromise, branchCodesToTransfer, lockedBranchesAtSave, isEdit
            );
            if (transferPromise && typeof transferPromise.then === 'function') {
                transferPromise.then(finishSave).catch(finishSave);
            } else {
                finishSave();
            }
        } else {
            toastr.error(
                (response && response.Msg) ||
                (isEdit ? 'Failed to update Sub Group.' : 'Failed to save Sub Group.')
            );
        }
    }).catch(function () {
        toastr.error('An error occurred. Please try again.');
    }).finally(function () {
        btnSave.prop('disabled', false);
        $('#btnSaveText').text(origLabel);
    });
}

/**
 * After save: call transfer when there are new branches (edit) or any selected (new).
 * Pass ALL selected CompanyCodes to the SP — it syncs *BranchDetails; omitting an already-
 * transferred code removes that row and the checkbox will appear unchecked on reopen.
 */
function transferToSelectedBranches(savedCode, savedRow, reloadPromise, branchCodes, lockedBranchCodes, isEdit) {
    if (!G_IsMainCompany) return Promise.resolve();

    var selected = normalizeBranchCodes(branchCodes);
    var locked = normalizeBranchCodes(lockedBranchCodes);
    var hasNewBranches = isEdit
        ? selected.some(function (c) { return locked.indexOf(c) < 0; })
        : selected.length > 0;
    if (!hasNewBranches) return Promise.resolve();

    var codePromise = savedCode > 0
        ? Promise.resolve(savedCode)
        : Promise.resolve(reloadPromise).then(function () { return resolveSavedCodeFromList(savedRow); });

    return codePromise.then(function (code) {
        if (!code) {
            console.error('[SubGroup] Could not resolve saved Code; skipping branch transfer.');
            toastr.warning('Saved, but could not determine the Code to transfer to branches.');
            return;
        }

        var currentMode = isEdit ? 'Update' : 'New';
        var formName = getFormType() === 'S' ? 'STORE' : '';

        return BranchDetailsFunction.TransferDataToBranch('SubCategoryMaster', code, selected.join(','), currentMode, formName)
            .then(function (result) {
                if (result && (result.Status === 'SUCCESS' || result.Status === 'Y')) {
                    if (result.Msg) toastr.success(result.Msg);
                } else {
                    toastr.warning((result && result.Msg) || 'Branch transfer failed.');
                }
            })
            .catch(function (err) {
                console.error('[SubGroup] TransferDataToBranch failed', err);
                toastr.warning('Failed to transfer Sub Group to selected branches.');
            });
    });
}

function resolveSavedCodeFromList(savedRow) {
    var desc = (savedRow.SubCategoryName || '').trim().toUpperCase();
    var underGroup = (savedRow.CategoryName || '').trim().toUpperCase();

    // G_List rows come from the LOCATE view and expose the parent group as "Category"
    // (not "CategoryName" — that key only exists on the SAVE payload). Comparing against
    // the wrong key always returned 0 matches, which is why the Code could never be
    // resolved and branch transfer silently never ran.
    var rowGroup = function (r) { return (r.Category || r.category || r.CategoryName || '').trim().toUpperCase(); };

    var exact = (G_List || []).filter(function (r) {
        return (r.SubCategoryName || '').trim().toUpperCase() === desc && rowGroup(r) === underGroup;
    }).sort(function (a, b) { return (parseInt(b.Code, 10) || 0) - (parseInt(a.Code, 10) || 0); });
    if (exact.length) return parseInt(exact[0].Code, 10) || 0;

    // Fall back to matching by description alone in case the Under Group text differs slightly.
    var byDesc = (G_List || []).filter(function (r) {
        return (r.SubCategoryName || '').trim().toUpperCase() === desc;
    }).sort(function (a, b) { return (parseInt(b.Code, 10) || 0) - (parseInt(a.Code, 10) || 0); });
    if (byDesc.length) return parseInt(byDesc[0].Code, 10) || 0;

    // Last resort: the newest insert should be the row with the highest auto-generated Code.
    var newest = (G_List || []).slice().sort(function (a, b) { return (parseInt(b.Code, 10) || 0) - (parseInt(a.Code, 10) || 0); })[0];
    return newest ? (parseInt(newest.Code, 10) || 0) : 0;
}

function BuildPayload() {
    var userCode = getUserMasterCodeFromSession();
    var formType = getFormType();
    var code = parseInt(G_EditCode, 10) || 0;
    var desc = $('#txtSubGroupDescription').val().trim();
    var $opt = $('#ddlUnderGroup option:selected');
    var categoryMasterCode = parseInt($opt.attr('data-category-master-code') || $('#ddlUnderGroup').val(), 10) || 0;
    var categoryName = ($opt.text() || '').trim();
    if (categoryName === '-- Select Group --') categoryName = '';

    if (!categoryMasterCode && categoryName) {
        for (var k in G_GroupNameByCode) {
            if (G_GroupNameByCode[k].toUpperCase() === categoryName.toUpperCase()) {
                categoryMasterCode = parseInt(k, 10) || 0;
                categoryName = G_GroupNameByCode[k];
                break;
            }
        }
    }

    if (categoryMasterCode > 0 && G_GroupNameByCode[categoryMasterCode]) {
        categoryName = G_GroupNameByCode[categoryMasterCode];
    }

    if (!categoryMasterCode || !categoryName) {
        toastr.error('Please select a valid Under Group from Group Master.');
        return null;
    }

    var maxValue = 0;
    if (G_EditRow) {
        var parsedMax = parseInt(G_EditRow.MaxValue, 10);
        maxValue = isNaN(parsedMax) ? 0 : parsedMax;
    }

    var row = {
        Code: code,
        CategoryMaster_Code: categoryMasterCode,
        CategoryName: categoryName,
        SubCategoryName: desc,
        ItemCode: $('#txtItemCodePrefix').val().trim(),
        MaxValue: maxValue,
        FormType: formType || 'S',
        SubGroupCode: $('#txtSubGroupCode').val().trim(),
        LogoApplicable: 'Y',
        SizeApplicable: 'Y',
        ItemCodeApplicable: 'Y',
        LotNoApplicable: 'Y',
        MaterialApplicable: 'Y',
        AutoCreateItemCode: 'Y',
        IsPackingMaterial: $('#chkIsPackingMaterial').is(':checked') ? 'Y' : 'N',
        UserMaster_Code: userCode
    };

    if (G_EditRow) {
        row.LogoApplicable = G_EditRow.LogoApplicable || row.LogoApplicable;
        row.SizeApplicable = G_EditRow.SizeApplicable || row.SizeApplicable;
        row.ItemCodeApplicable = G_EditRow.ItemCodeApplicable || row.ItemCodeApplicable;
        row.LotNoApplicable = G_EditRow.LotNoApplicable || row.LotNoApplicable;
        row.MaterialApplicable = G_EditRow.MaterialApplicable || row.MaterialApplicable;
        row.AutoCreateItemCode = G_EditRow.AutoCreateItemCode || row.AutoCreateItemCode;
        if (G_EditRow.FormType) row.FormType = G_EditRow.FormType;
    }

    return [row];
}

function ValidateForm() {
    var valid = true;
    var desc = $('#txtSubGroupDescription');
    var under = $('#ddlUnderGroup');
    var itemCodePrefix = $('#txtItemCodePrefix');

    if (!desc.val().trim()) {
        $('#err_SubGroupDescription').css('display', 'flex');
        desc.addClass('im-input-error');
        valid = false;
    } else {
        $('#err_SubGroupDescription').hide();
        desc.removeClass('im-input-error');
    }

    if (!under.val()) {
        $('#err_UnderGroup').css('display', 'flex');
        under.addClass('im-input-error');
        valid = false;
    } else {
        $('#err_UnderGroup').hide();
        under.removeClass('im-input-error');
    }

    if (!itemCodePrefix.val().trim()) {
        $('#err_ItemCodePrefix').css('display', 'flex');
        itemCodePrefix.addClass('im-input-error');
        valid = false;
    } else {
        $('#err_ItemCodePrefix').hide();
        itemCodePrefix.removeClass('im-input-error');
    }

    return valid;
}

function normalizeBranchCodes(codes) {
    return (codes || []).map(function (c) { return parseInt(c, 10); }).filter(function (c) { return c > 0; });
}

function unionBranchCodes() {
    var merged = {};
    for (var i = 0; i < arguments.length; i++) {
        normalizeBranchCodes(arguments[i]).forEach(function (c) { merged[c] = true; });
    }
    return Object.keys(merged).map(function (k) { return parseInt(k, 10); });
}

/** Merge DB transferred branches into locked state (never remove a previously transferred branch). */
function applyTransferredBranchState(fromApiCodes, resetSelection) {
    var fromApi = normalizeBranchCodes(fromApiCodes);
    G_InitialLockedBranchCodes = unionBranchCodes(G_InitialLockedBranchCodes, fromApi);
    G_LockedBranchCodes = G_InitialLockedBranchCodes.slice();

    if (resetSelection || !G_BranchSelectionDirty) {
        G_SelectedBranchCodes = G_LockedBranchCodes.slice();
    } else {
        G_SelectedBranchCodes = unionBranchCodes(G_LockedBranchCodes, G_SelectedBranchCodes);
    }
}

function collectBranchSelectionFromUi() {
    return unionBranchCodes(
        G_LockedBranchCodes,
        $('#branchListContainer input[type="checkbox"]:not(:disabled):checked')
            .map(function () { return parseInt($(this).val(), 10); }).get()
    );
}

function ClearForm() {
    G_EditRow = null;
    G_SelectedBranchCodes = [];
    G_LockedBranchCodes = [];
    G_InitialLockedBranchCodes = [];
    G_BranchSelectionDirty = false;
    G_PendingSaveAfterBranchDetails = false;
    $('#txtSubGroupDescription').val('').removeClass('im-input-error');
    $('#ddlUnderGroup').val('').removeClass('im-input-error');
    setUnderGroupEditable(true);
    $('#txtItemCodePrefix').val('').removeClass('im-input-error');
    $('#txtSubGroupCode').val('');
    $('#chkIsPackingMaterial').prop('checked', false);
    $('#err_SubGroupDescription, #err_UnderGroup, #err_ItemCodePrefix').hide();
}

function CloseForm() {
    ClearForm();
    G_EditCode = 0;
    G_ViewCode = 0;
    $('#subGroupDialogBackdrop').removeClass('show');
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

function OpenBranchDetails() {
    if (!G_IsMainCompany) {
        toastr.warning('Branch Details is only available for the Main Company.');
        return;
    }
    $('#branchDetailsBackdrop').addClass('show');
    loadBranchListForBranchDetails();
}

/**
 * Loads eligible branches for the Branch Details box.
 * Transferred branches: checked + disabled. Others: unchecked and selectable.
 */
function loadBranchListForBranchDetails() {
    var $container = $('#branchListContainer');
    $container.html('<p class="im-branch-list-empty">Loading branches...</p>');

    var recordCode = parseInt(G_EditCode, 10) || 0;
    var transferredPromise = recordCode > 0
        ? BranchDetailsFunction.GetTransferredBranches('SubCategoryMaster', recordCode).catch(function (err) {
            console.error('[SubGroup] Failed to load SubCategoryMasterBranchDetails.', err);
            return G_LockedBranchCodes.slice();
        })
        : Promise.resolve([]);

    try {
        Promise.all([BranchDetailsFunction.GetTransferApplicableBranches(), transferredPromise]).then(function (results) {
            var branches = results[0];
            var transferredCodes = results[1];
            G_BranchList = Array.isArray(branches) ? branches : [];

            applyTransferredBranchState(transferredCodes, !G_BranchSelectionDirty);
            renderBranchList();
        }).catch(function (err) {
            console.error('[SubGroup] Failed to load transfer-applicable branches.', err);
            G_BranchList = [];
            $container.html('<p class="im-branch-list-empty">Failed to load branches. Please try again.</p>');
        });
    } catch (err) {
        console.error('[SubGroup] BranchDetailsFunction.GetTransferApplicableBranches unavailable.', err);
        G_BranchList = [];
        $container.html('<p class="im-branch-list-empty">Failed to load branches. Please try again.</p>');
    }
}

function renderBranchList() {
    var $container = $('#branchListContainer');

    if (!G_BranchList.length) {
        $container.html('<p class="im-branch-list-empty">No branches have Master Data Transfer enabled.</p>');
        return;
    }

    var lockedSet = {};
    normalizeBranchCodes(G_LockedBranchCodes).forEach(function (c) { lockedSet[c] = true; });

    var selectedSet = {};
    normalizeBranchCodes(G_SelectedBranchCodes).forEach(function (c) { selectedSet[c] = true; });
    normalizeBranchCodes(G_LockedBranchCodes).forEach(function (c) { selectedSet[c] = true; });

    var html = G_BranchList.map(function (branch) {
        var code = parseInt(branch.Code ?? branch.CompanyCode ?? branch.code, 10) || 0;
        var name = branch.CompanyName ?? branch.ShortCompanyName ?? branch.name ?? ('Company ' + code);
        var isLocked = !!lockedSet[code];
        var checked = selectedSet[code] ? 'checked' : '';
        var disabled = isLocked ? 'disabled' : '';
        var itemClass = 'im-branch-list-item' + (isLocked ? ' im-branch-list-item--locked' : '');
        var lockedAttr = isLocked ? ' data-locked="1"' : '';
        return '<label class="' + itemClass + '">' +
            '<input type="checkbox" value="' + code + '" ' + checked + ' ' + disabled + lockedAttr + ' />' +
            '<span>' + $('<div>').text(name).html() + '</span>' +
            '</label>';
    }).join('');

    $container.html(html);
}

window.OpenNewSubGroup = OpenNewSubGroup;
window.EditSubGroup = EditSubGroup;
window.ViewSubGroup = ViewSubGroup;
window.CloseViewModal = CloseViewModal;
window.EditFromView = EditFromView;
window.ConfirmDelete = ConfirmDelete;
window.DoDelete = DoDelete;
window.SaveSubGroup = SaveSubGroup;
window.CloseSuccessModal = CloseSuccessModal;
window.OpenBranchDetails = OpenBranchDetails;
