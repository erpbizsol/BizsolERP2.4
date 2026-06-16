import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { ProjectCategoryMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectCategoryMasterService.js';

let G_CategoryList = [];

function firstPayloadArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.Data)) return payload.Data;
    return [];
}

function unwrapCategoryRecord(response) {
    if (response == null) return null;
    if (Array.isArray(response) && response.length) return response[0];
    if (response.Code != null || response.ProjectDesp != null || response.CategoryName != null) return response;
    if (response.Data !== undefined) {
        const d = response.Data;
        if (Array.isArray(d) && d.length) return d[0];
        if (d && typeof d === 'object') return d;
    }
    return null;
}

function ynLabel(v) {
    return String(v || 'N').toUpperCase() === 'Y' ? 'Yes' : 'No';
}

function ynBadge(v) {
    const yes = String(v || 'N').toUpperCase() === 'Y';
    return `<span class="pcm-yesno ${yes ? 'y' : 'n'}">${yes ? 'Yes' : 'No'}</span>`;
}

function getFinancialYear() {
    const d = new Date();
    let startYear = d.getFullYear();
    if (d.getMonth() < 3) startYear -= 1;
    return startYear + '-' + (startYear + 1);
}

function getUserMasterCode() {
    try {
        const auth = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const c = parseInt(auth.UserMaster_Code, 10);
        return isNaN(c) ? 0 : c;
    } catch (e) {
        return 0;
    }
}

function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function showModal(id) {
    const el = document.getElementById(id);
    if (window.bootstrap && window.bootstrap.Modal) {
        bootstrap.Modal.getOrCreateInstance(el).show();
    } else {
        $(`#${id}`).modal('show');
    }
}

function hideModal(id) {
    const el = document.getElementById(id);
    if (window.bootstrap && window.bootstrap.Modal) {
        const m = bootstrap.Modal.getInstance(el);
        if (m) m.hide();
    } else {
        $(`#${id}`).modal('hide');
    }
}

function syncProjectDespFromCategory() {
    const name = ($('#txtCategoryName').val() || '').trim();
    $('#txtProjectDesp').val(name);
}

function setToleranceCheckbox(id, value) {
    $(id).prop('checked', String(value || 'N').toUpperCase() === 'Y');
}

function getToleranceFromCheckbox(id) {
    return $(id).is(':checked') ? 'Y' : 'N';
}

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    loadCategories();

    $('#btnCreateCategory').on('click', openNewCategory);
    $('#btnSaveCategory').on('click', saveCategory);
    $('#btnConfirmDelete').on('click', confirmDelete);
    $('#pcmSearch').on('input', applyFilters);
    $('#txtCategoryName').on('input', syncProjectDespFromCategory);
});

function loadCategories() {
    Showloader && Showloader();
    ProjectCategoryMasterService.GetProjectCategoryList()
        .then(function (response) {
            HideLoader && HideLoader();
            G_CategoryList = firstPayloadArray(response);
            applyFilters();
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            G_CategoryList = [];
            applyFilters();
            toastr.error((error && error.Msg) || 'Failed to load project categories.');
        });
}

function applyFilters() {
    const query = ($('#pcmSearch').val() || '').toLowerCase().trim();
    let list = G_CategoryList;
    if (query) {
        list = list.filter(function (item) {
            const name = (item.CategoryName || '').toLowerCase();
            const desp = (item.ProjectDesp || item.CategoryDesc || '').toLowerCase();
            return name.includes(query) || desp.includes(query);
        });
    }
    bindGrid(list);
}

function bindGrid(list) {
    const $tbody = $('#tblProjectCategory tbody');
    $tbody.empty();

    if (!list || list.length === 0) {
        $tbody.append(`
            <tr>
                <td colspan="7">
                    <div class="pcm-empty">
                        <div class="pcm-empty-title">No Project Categories Found</div>
                        <div class="pcm-empty-sub">Click "New Category" to add your first project category.</div>
                    </div>
                </td>
            </tr>`);
        return;
    }

    list.forEach(function (item, index) {
        const code = item.Code || 0;
        const name = item.CategoryName || '';
        const desp = item.ProjectDesp || item.CategoryDesc || '';
        $tbody.append(`
            <tr>
                <td class="center"><span class="pcm-sno">${index + 1}</span></td>
                <td>${escHtml(name)}</td>
                <td>${escHtml(desp)}</td>
                <td class="center">${ynBadge(item.ToleranceApplicableOnPOQty)}</td>
                <td class="center">${ynBadge(item.ToleranceApplicableOnPORate)}</td>
                <td class="center">${ynBadge(item.ToleranceApplicableOnPOAmount)}</td>
                <td class="center">
                    <div class="pcm-actions">
                        <button type="button" class="pcm-icon-btn view" title="View" onclick="viewCategory(${code})"><i class="fas fa-eye"></i></button>
                        <button type="button" class="pcm-icon-btn edit" title="Edit" onclick="editCategory(${code})"><i class="fas fa-pencil-alt"></i></button>
                        <button type="button" class="pcm-icon-btn del" title="Delete" onclick="deleteCategory(${code})"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            </tr>`);
    });
}

function resetForm() {
    $('#hfCategoryCode').val(0);
    $('#txtCategoryName').val('');
    $('#txtProjectDesp').val('');
    setToleranceCheckbox('#chkTolOnQty', 'N');
    setToleranceCheckbox('#chkTolOnRate', 'N');
    setToleranceCheckbox('#chkTolOnAmount', 'N');
}

function bindForm(row) {
    $('#hfCategoryCode').val(row.Code || 0);
    const name = row.CategoryName || row.ProjectDesp || row.CategoryDesc || '';
    $('#txtCategoryName').val(name);
    syncProjectDespFromCategory();
    setToleranceCheckbox('#chkTolOnQty', row.ToleranceApplicableOnPOQty);
    setToleranceCheckbox('#chkTolOnRate', row.ToleranceApplicableOnPORate);
    setToleranceCheckbox('#chkTolOnAmount', row.ToleranceApplicableOnPOAmount);
}

function validateForm() {
    const name = ($('#txtCategoryName').val() || '').trim();
    if (!name) {
        toastr.warning('Please enter Category.');
        $('#txtCategoryName').focus();
        return false;
    }
    syncProjectDespFromCategory();
    return true;
}

function buildPayload() {
    syncProjectDespFromCategory();
    const name = ($('#txtCategoryName').val() || '').trim();
    return {
        Code: parseInt($('#hfCategoryCode').val() || '0', 10) || 0,
        CategoryName: name,
        ProjectDesp: name,
        ToleranceApplicableOnPOQty: getToleranceFromCheckbox('#chkTolOnQty'),
        ToleranceApplicableOnPORate: getToleranceFromCheckbox('#chkTolOnRate'),
        ToleranceApplicableOnPOAmount: getToleranceFromCheckbox('#chkTolOnAmount'),
        UserMaster_Code: getUserMasterCode(),
    };
}

function openNewCategory() {
    const moduleName = 'Project Category Master';
    MenuService.CheckModuleOptionRight(moduleName, 'New', 'Y', getFinancialYear()).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        }
        resetForm();
        $('#category-modal-title').text('New Project Category');
        showModal('dvCategoryModal');
        setTimeout(function () { $('#txtCategoryName').focus(); }, 150);
    });
}

function editCategory(code) {
    const moduleName = 'Project Category Master';
    MenuService.CheckModuleOptionRight(moduleName, 'Edit', 'Y', getFinancialYear()).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        }
        Showloader && Showloader();
        ProjectCategoryMasterService.GetProjectCategoryByCode(code)
            .then(function (apiResponse) {
                HideLoader && HideLoader();
                const row = unwrapCategoryRecord(apiResponse) || G_CategoryList.find(function (x) { return String(x.Code) === String(code); });
                if (!row) {
                    toastr.warning('Project category not found.');
                    return;
                }
                resetForm();
                bindForm(row);
                $('#category-modal-title').text('Edit Project Category');
                showModal('dvCategoryModal');
            })
            .catch(function () {
                HideLoader && HideLoader();
                const row = G_CategoryList.find(function (x) { return String(x.Code) === String(code); });
                if (!row) {
                    toastr.warning('Project category not found.');
                    return;
                }
                resetForm();
                bindForm(row);
                $('#category-modal-title').text('Edit Project Category');
                showModal('dvCategoryModal');
            });
    });
}

function viewCategory(code) {
    const row = G_CategoryList.find(function (x) { return String(x.Code) === String(code); });
    ProjectCategoryMasterService.GetProjectCategoryByCode(code)
        .then(function (apiResponse) {
            const detail = unwrapCategoryRecord(apiResponse) || row;
            if (!detail) {
                toastr.warning('Project category not found.');
                return;
            }
            fillViewModal(detail);
            showModal('dvCategoryViewModal');
        })
        .catch(function () {
            if (!row) {
                toastr.warning('Project category not found.');
                return;
            }
            fillViewModal(row);
            showModal('dvCategoryViewModal');
        });
}

function fillViewModal(row) {
    $('#viewCategoryName').text(row.CategoryName || '—');
    $('#viewProjectDesp').text(row.ProjectDesp || row.CategoryDesc || '—');
    $('#viewTolOnQty').text(ynLabel(row.ToleranceApplicableOnPOQty));
    $('#viewTolOnRate').text(ynLabel(row.ToleranceApplicableOnPORate));
    $('#viewTolOnAmount').text(ynLabel(row.ToleranceApplicableOnPOAmount));
}

function saveCategory() {
    if (!validateForm()) return;

    const code = parseInt($('#hfCategoryCode').val() || '0', 10) || 0;
    const moduleName = 'Project Category Master';
    const optionName = code > 0 ? 'Edit' : 'New';

    MenuService.CheckModuleOptionRight(moduleName, optionName, 'Y', getFinancialYear()).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        }

        Showloader && Showloader();
        ProjectCategoryMasterService.SaveProjectCategory(buildPayload())
            .then(function (result) {
                HideLoader && HideLoader();
                if (result && result.Status === 'Y') {
                    toastr.success(result.Message || result.Msg || 'Saved successfully.');
                    hideModal('dvCategoryModal');
                    loadCategories();
                } else {
                    toastr.warning((result && (result.Message || result.Msg)) || 'Failed to save.');
                }
            })
            .catch(function (error) {
                HideLoader && HideLoader();
                toastr.error((error && (error.Msg || error.Message)) || 'Failed to save.');
            });
    });
}

function deleteCategory(code) {
    const moduleName = 'Project Category Master';
    MenuService.CheckModuleOptionRight(moduleName, 'Delete', 'Y', getFinancialYear()).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        }
        $('#hfDeleteCode').val(code);
        $('#reasonForDeleteInput').val('');
        showModal('dvDeleteConfirmModal');
    });
}

function confirmDelete() {
    const code = parseInt($('#hfDeleteCode').val() || '0', 10) || 0;
    const reason = ($('#reasonForDeleteInput').val() || '').trim();
    if (!reason) {
        toastr.warning('Please provide a reason for deletion.');
        $('#reasonForDeleteInput').focus();
        return;
    }
    if (code <= 0) return;

    Showloader && Showloader();
    ProjectCategoryMasterService.DeleteProjectCategory(code, reason)
        .then(function (result) {
            HideLoader && HideLoader();
            if (result && result.Status === 'Y') {
                toastr.success(result.Msg || 'Deleted successfully.');
                hideModal('dvDeleteConfirmModal');
                loadCategories();
            } else {
                toastr.warning((result && result.Msg) || 'Failed to delete.');
            }
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            toastr.error((error && error.Msg) || 'Failed to delete.');
        });
}

window.viewCategory = viewCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
