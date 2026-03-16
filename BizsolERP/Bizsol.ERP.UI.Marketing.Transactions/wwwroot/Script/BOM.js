import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { ProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectMasterService.js';
import { SubProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SubProjectMasterService.js';
import { BOMService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BOMService.js';

let G_ProjectList = [];
let G_SubProjectList = [];
let G_CategoryList = [];
let G_WorkTypeList = [];
let G_ItemCacheByWorkType = {};
let G_BOMRows = [];   // rows within current BOM entry
let G_BOMList = [];   // header list for main grid

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    loadBOMList();
    loadProjectsAndSubProjects();
    loadCategoryAndWorkTypeMaster();

    $('#btnCreateBOM').on('click', function () {
        openNewBOM();
    });

    $('#btnAddBomRow').on('click', function () {
        addNewBomRow();
    });

    $('#btnSaveAllBomRows').on('click', function () {
        saveAllRows();
    });

    $('#btnVerifyAllBomRows').on('click', function () {
        verifyAllRows();
    });

    $('#btnBackToBomList').on('click', function () {
        showBOMListView();
    });

    $('#tblBOMList').on('click', '.js-bom-view', function () {
        const id = $(this).closest('tr').data('id');
        viewBOM(id);
    });

    $('#tblBOMList').on('click', '.js-bom-edit', function () {
        const id = $(this).closest('tr').data('id');
        openBOMFromList(id, 'edit');
    });

    $('#tblBOMList').on('click', '.js-bom-delete', function () {
        const id = $(this).closest('tr').data('id');
        deleteBOMFromList(id);
    });

    $('#btnConfirmDeleteBOM').on('click', function () {
        confirmDeleteBOM();
    });

    $('#bomSearch').on('input', function () {
        const q = $(this).val().toLowerCase().trim();
        filterBOMs(q);
    });
});

function loadBOMList() {
    if (!BOMService || typeof BOMService.GetBOMList !== 'function') {
        return;
    }

    Showloader && Showloader();
    BOMService.GetBOMList()
        .then(function (response) {
            HideLoader && HideLoader();
            let rows = [];
            if (Array.isArray(response)) rows = response;
            else if (Array.isArray(response.data)) rows = response.data;
            else if (Array.isArray(response.Data)) rows = response.Data;
            G_BOMList = rows || [];
            bindBOMGrid(G_BOMList);
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            G_BOMList = [];
            bindBOMGrid([]);
            toastr.error((error && error.Msg) || 'Error loading BOM list.');
        });
}

function bindBOMGrid(list) {
    const $tbody = $('#tblBOMList tbody');
    if (!$tbody.length) return;
    $tbody.empty();

    if (!list || list.length === 0) {
        $tbody.append(`
            <tr>
                <td colspan="6">
                    <div class="pm-empty">
                        <div class="pm-empty-icon"><i class="fas fa-folder-open"></i></div>
                        <div class="pm-empty-title">No BOM records found</div>
                        <div class="pm-empty-sub">Click "New BOM" to create your first BOM.</div>
                    </div>
                </td>
            </tr>`);
        return;
    }

    list.forEach(function (item, index) {
        const projectName = item.ProjectName || item.ProjectDesp || item.Project || '';
        const subProjectName = item.SubProjectName || item.SubProjectDesp || item.SubProject || '';
        const totalAmtRaw = item.TotalAmount || item.Amount || item.Total || 0;
        const totalAmt = Number(totalAmtRaw) || 0;
        const statusVal = (item.Verify || item.Verified || '').toString().toUpperCase();
        const statusTxt = statusVal === 'Y' ? 'Verified' : 'Pending';
        const statusClass = statusVal === 'Y' ? 'pm-days-chip' : 'pm-code-badge';
        const bomId = item.BOMCode || item.Code || item.BOMId || 0;

        $tbody.append(`
            <tr data-index="${index}" data-id="${bomId}">
                <td class="center"><span class="pm-sno">${index + 1}</span></td>
                <td style="max-width:260px; overflow:hidden; text-overflow:ellipsis;">${escHtml(projectName)}</td>
                <td style="max-width:260px; overflow:hidden; text-overflow:ellipsis;">${escHtml(subProjectName)}</td>
                <td class="right">
                    <span class="pm-budget">&#8377; ${totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
                <td class="center">
                    <span class="${statusClass}">${statusTxt}</span>
                </td>
                <td class="center">
                    <div class="bom-actions">
                        <button type="button" class="bom-btn icon view js-bom-view" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="bom-btn icon edit js-bom-edit" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="bom-btn icon del js-bom-delete" title="Delete">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>`);
    });
}

function filterBOMs(query) {
    if (!query) {
        bindBOMGrid(G_BOMList);
        return;
    }
    const filtered = (G_BOMList || []).filter(function (item) {
        const p = (item.ProjectName || item.ProjectDesp || item.Project || '').toLowerCase();
        const s = (item.SubProjectName || item.SubProjectDesp || item.SubProject || '').toLowerCase();
        return p.includes(query) || s.includes(query);
    });
    bindBOMGrid(filtered);
}

function openNewBOM() {
    // switch from list view to entry form
    $('#dvBOMGrid').hide();
    $('#dvBOMEntry').show();

    resetBomForm();

    if (!G_ProjectList.length || !G_SubProjectList.length) {
        loadProjectsAndSubProjects();
    }
    if (!G_CategoryList.length || !G_WorkTypeList.length) {
        loadCategoryAndWorkTypeMaster();
    }

    addNewBomRow();
}

function viewBOM(id) {
    if (!G_BOMList || !G_BOMList.length) return;
    const header = G_BOMList.find(function (x) {
        return String(x.BOMCode || x.Code || x.BOMId || 0) === String(id || 0);
    });
    if (!header) return;

    const projectName = header.ProjectName || header.ProjectDesp || header.Project || '';
    const subProjectName = header.SubProjectName || header.SubProjectDesp || header.SubProject || '';
    const totalAmtRaw = header.TotalAmount || header.Amount || header.Total || 0;
    const totalAmt = Number(totalAmtRaw) || 0;
    const statusVal = (header.Verify || header.Verified || '').toString().toUpperCase();
    const statusTxt = statusVal === 'Y' ? 'Verified' : 'Pending';

    $('#viewBOMProjectName').text(projectName || '—');
    $('#viewBOMSubProjectName').text(subProjectName || '—');
    $('#viewBOMAmount').text('₹ ' + totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    $('#viewBOMStatus').text(statusTxt);

    showModal('dvBOMViewModal');
}

function showBOMListView() {
    // go back to main grid
    $('#dvBOMEntry').hide();
    $('#dvBOMGrid').show();
    loadBOMList();
}

function openBOMFromList(id, mode) {
    if (!G_BOMList || !G_BOMList.length) return;
    const header = G_BOMList.find(function (x) {
        return String(x.BOMCode || x.Code || x.BOMId || 0) === String(id || 0);
    });
    if (!header) return;

    openNewBOM();

    // set current BOM code
    const bomCode = header.BOMCode || header.Code || header.BOMId || 0;
    $('#hfBOMCode').val(bomCode || 0);

    // preselect project & sub project from header, if codes exist
    const projectCode = header.ProjectCode || header.ProjectMaster_Code || header.ProjectId || 0;
    const subProjectCode = header.SubProjectCode || header.SubProjectId || 0;

    if (projectCode) {
        $('#ddlProject').val(String(projectCode));
        bindSubProjectDropdown();
    }
    if (subProjectCode) {
        $('#ddlSubProject').val(String(subProjectCode));
    }

    // populate line items if detail collection is present in header
    const details =
        (Array.isArray(header.Details) && header.Details) ||
        (Array.isArray(header.BOMDetails) && header.BOMDetails) ||
        (Array.isArray(header.BOMLines) && header.BOMLines) ||
        (Array.isArray(header.BOMList) && header.BOMList) ||
        (Array.isArray(header.DetailsList) && header.DetailsList) ||
        [];

    if (details.length) {
        const $tbody = $('#tblBOM tbody');
        $tbody.empty();

        details.forEach(function (d) {
            addNewBomRow();
            const $tr = $('#tblBOM tbody tr').last();

            const catCode = d.ProjectCategoryCode || d.ProjectCategory || 0;
            const wtCode = d.WorkTypeCode || 0;
            const itemCode = d.ItemCode || 0;

            if (catCode) {
                $tr.find('.bom-project-category').val(String(catCode));
            }

            if (wtCode) {
                $tr.find('.bom-work-type').val(String(wtCode)).trigger('change');
            }

            if (itemCode) {
                // item dropdown will be filled after work type change / API load
                setTimeout(function () {
                    $tr.find('.bom-item').val(String(itemCode)).trigger('change');
                }, 150);
            }

            if (d.UOM !== undefined) $tr.find('.bom-uom').val(d.UOM);
            if (d.Tolerance !== undefined) $tr.find('.bom-tolerance').val(d.Tolerance);
            if (d.QtyRequired !== undefined) $tr.find('.bom-qty-required').val(d.QtyRequired);
            if (d.RateTolerancePerc !== undefined) $tr.find('.bom-rate-tol').val(d.RateTolerancePerc);
            if (d.EstRate !== undefined) $tr.find('.bom-est-rate').val(d.EstRate);
            if (d.Amount !== undefined) $tr.find('.bom-amount').val(d.Amount);
        });
    }

    if (mode === 'view') {
        $('#btnSaveAllBomRows').prop('disabled', true);
        $('#btnVerifyAllBomRows').prop('disabled', true);
        $('#tblBOM .bom-input, #tblBOM .bom-select').prop('disabled', true).prop('readonly', true);
    } else {
        $('#btnSaveAllBomRows').prop('disabled', false);
        $('#btnVerifyAllBomRows').prop('disabled', false);
        $('#tblBOM .bom-input, #tblBOM .bom-select').prop('disabled', false).prop('readonly', false);
    }
}

function deleteBOMFromList(id) {
    if (!G_BOMList || !G_BOMList.length) return;
    const header = G_BOMList.find(function (x) {
        return String(x.BOMCode || x.Code || x.BOMId || 0) === String(id || 0);
    });
    if (!header) return;

    const projectName = header.ProjectName || header.ProjectDesp || header.Project || '';
    const subProjectName = header.SubProjectName || header.SubProjectDesp || header.SubProject || '';
    const label = [projectName, subProjectName].filter(Boolean).join(' / ');

    $('#delBOMName').text(label || 'this BOM');
    $('#hfDeleteBOMId').val(id || 0);
    $('#bomReasonForDeleteInput').val('');

    showModal('dvBOMDeleteConfirmModal');
}

function confirmDeleteBOM() {
    const id = parseInt($('#hfDeleteBOMId').val() || '0', 10) || 0;
    const reason = ($('#bomReasonForDeleteInput').val() || '').trim();

    if (!id) {
        toastr.error('Invalid BOM selected for deletion.');
        return;
    }
    if (!reason) {
        toastr.warning('Please enter reason for deletion.');
        $('#bomReasonForDeleteInput').focus();
        return;
    }

    if (BOMService && typeof BOMService.DeleteBOM === 'function') {
        Showloader && Showloader();
        BOMService.DeleteBOM(id, reason)
            .then(function (resp) {
                HideLoader && HideLoader();
                if (resp && resp.Status === 'Y') {
                    toastr.success(resp.Msg || 'BOM deleted successfully.');
                    hideModal('dvBOMDeleteConfirmModal');
                    loadBOMList();
                } else {
                    toastr.warning((resp && resp.Msg) || 'Failed to delete BOM.');
                }
            })
            .catch(function () {
                HideLoader && HideLoader();
                toastr.error('Error while deleting BOM.');
            });
    } else {
        // fallback – remove locally
        const idx = (G_BOMList || []).findIndex(function (x) {
            return String(x.BOMCode || x.Code || x.BOMId || 0) === String(id || 0);
        });
        if (idx >= 0) {
            G_BOMList.splice(idx, 1);
            bindBOMGrid(G_BOMList);
        }
        hideModal('dvBOMDeleteConfirmModal');
        toastr.success('BOM removed from list (local only).');
    }
}

function loadProjectsAndSubProjects() {
    // Load projects
    ProjectMasterService.GetProjectList()
        .then(function (projects) {
            G_ProjectList = Array.isArray(projects) ? projects : [];
            bindProjectDropdown();
        })
        .catch(function () {
            toastr.error('Error loading project list.');
        });

    // Load sub projects
    SubProjectMasterService.GetSubProjectList()
        .then(function (subs) {
            G_SubProjectList = Array.isArray(subs) ? subs : [];
            bindSubProjectDropdown(); // safe – project dropdown may not be ready yet, will re-bind on project change
        })
        .catch(function () {
            toastr.error('Error loading sub project list.');
        });
}

function bindProjectDropdown() {
    const $ddl = $('#ddlProject');
    $ddl.empty();
    // Match SubProjectMaster pattern: master project dropdown
    $ddl.append('<option value="">-- Select Master Project --</option>');
    $ddl.append('<option value="ALL">All Projects</option>');

    G_ProjectList.forEach(function (p) {
        const code = p.Code || 0;
        const name = (p.ProjectDesp || p.ProjectName || '').trim();
        const display = name || (p.ProjectCode || '');
        $ddl.append(`<option value="${code}">${escHtml(display)}</option>`);
    });

    $ddl.off('change').on('change', function () {
        bindSubProjectDropdown();
    });
}

function bindSubProjectDropdown() {
    const $ddl = $('#ddlSubProject');
    const selectedProject = $('#ddlProject').val();

    $ddl.empty();

    if (!G_SubProjectList.length) {
        $ddl.append('<option value="">No sub projects found</option>');
        return;
    }

    if (!selectedProject) {
        $ddl.append('<option value="">Select project first</option>');
        return;
    }

    $ddl.append('<option value="ALL">All Sub Projects</option>');

    let filtered = [];
    if (selectedProject === 'ALL') {
        filtered = G_SubProjectList.slice();
    } else {
        filtered = G_SubProjectList.filter(function (row) {
            const masterCode = row.ProjectMaster_Code || row.MasterProjectCode || 0;
            return String(masterCode) === String(selectedProject);
        });
    }

    filtered.forEach(function (sp) {
        const code = sp.Code || 0;
        const name = (sp.SubProjectDesp || sp.SubProjectName || '').trim() || ('Sub Project ' + code);
        $ddl.append(`<option value="${code}">${escHtml(name)}</option>`);
    });

    $ddl.off('change').on('change', function () {
        const val = $(this).val();
        if (val && val !== 'ALL') {
            const row = G_SubProjectList.find(function (x) { return String(x.Code) === String(val); });
            if (row) {
                const masterCode = row.ProjectMaster_Code || row.MasterProjectCode || '';
                if (masterCode) {
                    $('#ddlProject').val(String(masterCode));
                }
            }
        }
    });
}

function loadCategoryAndWorkTypeMaster() {
    if (!BOMService) return;

    // Category list for Project Category column
    BOMService.GetCategoryList()
        .then(function (categories) {
            let rows = [];
            if (Array.isArray(categories)) rows = categories;
            else if (Array.isArray(categories.data)) rows = categories.data;
            else if (Array.isArray(categories.Data)) rows = categories.Data;
            G_CategoryList = rows || [];
        })
        .catch(function () {
            toastr.error('Error loading project category list.');
        });

    // Work type list for Work Type column
    BOMService.GetWorkTypeList()
        .then(function (workTypes) {
            let rows = [];
            if (Array.isArray(workTypes)) rows = workTypes;
            else if (Array.isArray(workTypes.data)) rows = workTypes.data;
            else if (Array.isArray(workTypes.Data)) rows = workTypes.Data;
            G_WorkTypeList = rows || [];
        })
        .catch(function () {
            toastr.error('Error loading work type list.');
        });
}

function addNewBomRow() {
    const $tbody = $('#tblBOM tbody');
    const nextIndex = $tbody.children('tr').length + 1;

    const rowId = `bomRow_${Date.now()}_${nextIndex}`;

    const $tr = $(`
        <tr data-row-id="${rowId}" data-state="edit">
            <td class="center">${nextIndex}</td>
            <td>
                <select class="bom-select bom-project-category">
                    <option value="">Select</option>
                </select>
            </td>
            <td>
                <select class="bom-select bom-work-type">
                    <option value="">Select</option>
                </select>
            </td>
            <td>
                <select class="bom-select bom-item">
                    <option value="">Select</option>
                </select>
            </td>
            <td>
                <input type="text" class="bom-input bom-uom" readonly />
            </td>
            <td>
                <input type="text" class="bom-input bom-tolerance right" />
            </td>
            <td>
                <input type="text" class="bom-input bom-qty-required right" />
            </td>
            <td>
                <input type="text" class="bom-input bom-rate-tol right" />
            </td>
            <td>
                <input type="text" class="bom-input bom-est-rate right" />
            </td>
            <td>
                <input type="text" class="bom-input bom-amount right" readonly />
            </td>
            <td class="center">
                <button type="button" class="bom-btn icon del js-bom-row-delete" title="Remove">
                    <i class="fas fa-times-circle"></i>
                </button>
            </td>
        </tr>
    `);

    $tbody.append($tr);

    initRowCategoryDropdown($tr);
    initRowWorkTypeDropdown($tr);
    initRowEvents($tr);
}

function initRowCategoryDropdown($tr) {
    const $cat = $tr.find('.bom-project-category');
    $cat.empty().append('<option value="">Select</option>');

    (G_CategoryList || []).forEach(function (c) {
        const code = c.Code || 0;
        const name = (c.CategoryDesp || c.CategoryName || c.Category || '').trim() || ('Category ' + code);
        $cat.append(`<option value="${code}">${escHtml(name)}</option>`);
    });
}

function resetBomForm() {
    G_BOMRows = [];

    $('#hfBOMCode').val(0);

    $('#ddlProject').val('');
    const $sub = $('#ddlSubProject');
    $sub.empty().append('<option value="">Select project first</option>');

    const $tbody = $('#tblBOM tbody');
    $tbody.empty();

    $('#btnVerifyAllBomRows').hide().prop('disabled', false);
    $('#btnSaveAllBomRows').prop('disabled', false);
}

function initRowWorkTypeDropdown($tr) {
    const $wt = $tr.find('.bom-work-type');
    $wt.empty().append('<option value="">Select</option>');

    (G_WorkTypeList || []).forEach(function (t) {
        const code = t.Code || 0;
        const name = (t.WorkType || t.WorkTypeDesp || t.WorkTypeName || t.ItemType || '').trim();
        if (!name) return;
        $wt.append(`<option value="${code}" data-worktype="${escHtml(name)}">${escHtml(name)}</option>`);
    });

    $wt.off('change').on('change', function () {
        bindItemDropdownForRow($tr);
    });
}

function bindItemDropdownForRow($tr) {
    const $wt = $tr.find('.bom-work-type');
    const selectedTypeCode = $wt.val();
    const workTypeName = ($wt.find('option:selected').data('worktype') || '').toString().trim();

    const $item = $tr.find('.bom-item');
    $item.empty().append('<option value="">Select</option>');
    $tr.find('.bom-uom').val('');

    if (!selectedTypeCode || !workTypeName) return;

    const cacheKey = workTypeName.toUpperCase();

    function bindItems(items) {
        (items || []).forEach(function (it) {
            const code = it.Code || 0;
            const name = (it.ItemName || it.ItemCode || '').trim();
            const uom = it.UOM || '';
            $item.append(`<option value="${code}" data-uom="${escHtml(uom)}">${escHtml(name)}</option>`);
        });

        $item.off('change').on('change', function () {
            const uom = $(this).find('option:selected').data('uom') || '';
            $tr.find('.bom-uom').val(uom || '');
        });
    }

    // use cached items if we already fetched for this work type
    if (G_ItemCacheByWorkType[cacheKey]) {
        bindItems(G_ItemCacheByWorkType[cacheKey]);
        return;
    }

    if (!BOMService || typeof BOMService.GetItemMasterList !== 'function') {
        return;
    }

    BOMService.GetItemMasterList(encodeURIComponent(workTypeName))
        .then(function (items) {
            let rows = [];
            if (Array.isArray(items)) rows = items;
            else if (Array.isArray(items.data)) rows = items.data;
            else if (Array.isArray(items.Data)) rows = items.Data;

            G_ItemCacheByWorkType[cacheKey] = rows || [];
            bindItems(G_ItemCacheByWorkType[cacheKey]);
        })
        .catch(function () {
            toastr.error('Error loading item master for selected work type.');
        });
}

function initRowEvents($tr) {
    const $qty = $tr.find('.bom-qty-required');
    const $estRate = $tr.find('.bom-est-rate');
    const $tol = $tr.find('.bom-tolerance');
    const $rateTol = $tr.find('.bom-rate-tol');

    $qty.on('input', function () { enforceNumeric(this, 3); recalcAmount($tr); });
    $estRate.on('input', function () { enforceNumeric(this, 3); recalcAmount($tr); });
    $tol.on('input', function () { enforceNumeric(this, 3); });
    $rateTol.on('input', function () { enforceNumeric(this, 3); });

    $tr.find('.js-bom-row-delete').on('click', function () {
        deleteBomRow($tr);
    });
}

function deleteBomRow($tr) {
    const $tbody = $('#tblBOM tbody');
    if ($tbody.children('tr').length <= 1) {
        // keep at least one empty row
        $tr.find('input.bom-input').val('');
        $tr.find('select.bom-select').val('');
        $tr.find('.bom-uom').val('');
        return;
    }
    $tr.remove();

    // re-number S.No
    $tbody.children('tr').each(function (idx) {
        $(this).find('td').first().text(idx + 1);
    });
}

function enforceNumeric(input, maxDecimals) {
    let v = (input.value || '').toString();
    v = v.replace(/,/g, '').replace(/[^0-9.]/g, '');
    const parts = v.split('.');
    if (parts.length > 2) {
        v = parts[0] + '.' + parts.slice(1).join('');
    }
    const p2 = v.split('.');
    if (p2[1]) {
        v = p2[0] + '.' + p2[1].slice(0, maxDecimals);
    }
    input.value = v;
}

function recalcAmount($tr) {
    const qty = parseFloat(($tr.find('.bom-qty-required').val() || '0').replace(/,/g, '')) || 0;
    const rate = parseFloat(($tr.find('.bom-est-rate').val() || '0').replace(/,/g, '')) || 0;
    const amt = qty * rate;
    if (!isNaN(amt)) {
        $tr.find('.bom-amount').val(amt.toFixed(2));
    } else {
        $tr.find('.bom-amount').val('');
    }
}

function validateRow($tr) {
    const workType = $tr.find('.bom-work-type').val();
    const item = $tr.find('.bom-item').val();
    const qty = $tr.find('.bom-qty-required').val();
    const estRate = $tr.find('.bom-est-rate').val();

    if (!workType) {
        toastr.warning('Please select Work Type.');
        return false;
    }
    if (!item) {
        toastr.warning('Please select Item.');
        return false;
    }

    if (!isValidNumber(qty)) {
        toastr.warning('Please enter valid Qty Required (integer / decimal).');
        return false;
    }

    if (!isValidNumber(estRate)) {
        toastr.warning('Please enter valid Est. Rate (integer / decimal).');
        return false;
    }

    const tol = $tr.find('.bom-tolerance').val();
    const rateTol = $tr.find('.bom-rate-tol').val();

    if (tol && !isValidNumber(tol)) {
        toastr.warning('Please enter valid Tolerance.');
        return false;
    }
    if (rateTol && !isValidNumber(rateTol)) {
        toastr.warning('Please enter valid Rate Tol (%).');
        return false;
    }

    return true;
}

function isValidNumber(val) {
    if (val === null || val === undefined) return false;
    const v = val.toString().trim();
    if (!v) return false;
    return !isNaN(parseFloat(v));
}

function buildRowPayload($tr) {
    const projectVal = $('#ddlProject').val() || '';
    const subProjectVal = $('#ddlSubProject').val() || '';

    return {
        ProjectCode: projectVal === 'ALL' ? 0 : parseInt(projectVal || '0', 10) || 0,
        SubProjectCode: subProjectVal === 'ALL' ? 0 : parseInt(subProjectVal || '0', 10) || 0,
        ProjectCategory: $tr.find('.bom-project-category').val() || '',
        WorkTypeCode: parseInt($tr.find('.bom-work-type').val() || '0', 10) || 0,
        ItemCode: parseInt($tr.find('.bom-item').val() || '0', 10) || 0,
        UOM: $tr.find('.bom-uom').val() || '',
        Tolerance: parseFloat($tr.find('.bom-tolerance').val() || '0') || 0,
        QtyRequired: parseFloat($tr.find('.bom-qty-required').val() || '0') || 0,
        RateTolerancePerc: parseFloat($tr.find('.bom-rate-tol').val() || '0') || 0,
        EstRate: parseFloat($tr.find('.bom-est-rate').val() || '0') || 0,
        Amount: parseFloat($tr.find('.bom-amount').val() || '0') || 0
    };
}

function saveAllRows() {
    const $rows = $('#tblBOM tbody tr');
    if (!$rows.length) {
        toastr.warning('Please add at least one row.');
        return;
    }

    const payloads = [];
    let hasError = false;

    $rows.each(function () {
        const $tr = $(this);

        // allow completely blank rows to be ignored
        const workType = $tr.find('.bom-work-type').val();
        const item = $tr.find('.bom-item').val();
        const qty = $tr.find('.bom-qty-required').val();
        const estRate = $tr.find('.bom-est-rate').val();
        if (!workType && !item && !qty && !estRate) {
            return;
        }

        if (!validateRow($tr)) {
            hasError = true;
            return false; // break
        }

        payloads.push(buildRowPayload($tr));
    });

    if (hasError) return;

    if (!payloads.length) {
        toastr.warning('Please enter at least one complete line before saving.');
        return;
    }

    const bomCode = parseInt($('#hfBOMCode').val() || '0', 10) || 0;
    const projectVal = $('#ddlProject').val() || '';
    const subProjectVal = $('#ddlSubProject').val() || '';

    const headerProjectCode = projectVal === 'ALL' ? 0 : parseInt(projectVal || '0', 10) || 0;
    const headerSubProjectCode = subProjectVal === 'ALL' ? 0 : parseInt(subProjectVal || '0', 10) || 0;

    // store locally for verify-all
    G_BOMRows = payloads.map(function (p, idx) {
        return Object.assign({ RowId: 'row_' + (idx + 1), Verified: 'N' }, p);
    });

    const transactions = payloads.map(function (p, idx) {
        return {
            srNo: idx + 1,
            projectCode: p.ProjectCode,
            subProjectCode: p.SubProjectCode,
            projectCategory: p.ProjectCategory,
            workTypeCode: p.WorkTypeCode,
            itemCode: p.ItemCode,
            uom: p.UOM,
            tolerance: p.Tolerance,
            qtyRequired: p.QtyRequired,
            rateTolerancePerc: p.RateTolerancePerc,
            estRate: p.EstRate,
            amount: p.Amount
        };
    });

    const payload = {
        code: bomCode,
        master: [{
            code: bomCode,
            projectCode: headerProjectCode,
            subProjectCode: headerSubProjectCode
        }],
        transactions: transactions
    };

    if (BOMService && typeof BOMService.SaveBOMRow === 'function') {
        Showloader && Showloader();
        BOMService.SaveBOMRow(payload)
            .then(function (resp) {
                HideLoader && HideLoader();
                if (resp && resp.Status === 'Y') {
                    lockAllRowsAfterSave();
                    $('#btnVerifyAllBomRows').show();
                    $('#btnSaveAllBomRows').prop('disabled', true);
                    toastr.success(resp.Msg || 'BOM saved successfully.');
                    // update current BOM code if returned
                    if (resp.BOMCode || resp.Code) {
                        $('#hfBOMCode').val(resp.BOMCode || resp.Code);
                    }
                } else {
                    toastr.warning((resp && resp.Msg) || 'Failed to save BOM.');
                }
            })
            .catch(function () {
                HideLoader && HideLoader();
                toastr.error('Error while saving BOM.');
            });
    } else {
        // local-only fallback
        lockAllRowsAfterSave();
        $('#btnVerifyAllBomRows').show();
        $('#btnSaveAllBomRows').prop('disabled', true);
        toastr.success('All BOM lines saved (local only).');
    }
}

function lockAllRowsAfterSave() {
    const $rows = $('#tblBOM tbody tr');
    $rows.each(function () {
        const $tr = $(this);
        $tr.attr('data-state', 'saved');
        $tr.find('.bom-input, .bom-select')
            .prop('readonly', true)
            .prop('disabled', true);
        $tr.find('.bom-amount').prop('readonly', true);
    });
}

function verifyAllRows() {
    if (!G_BOMRows || !G_BOMRows.length) {
        toastr.warning('Please save all lines before verify.');
        return;
    }

    if (BOMService && typeof BOMService.VerifyBOMRow === 'function') {
        Showloader && Showloader();
        Promise.all(G_BOMRows.map(function (row) { return BOMService.VerifyBOMRow(row); }))
            .then(function (responses) {
                HideLoader && HideLoader();

                const hasFailure = responses.some(function (resp) {
                    return !resp || resp.Status !== 'Y';
                });

                if (hasFailure) {
                    toastr.warning('Some BOM lines could not be verified. Please check and try again.');
                    return;
                }

                $('#tblBOM tbody tr').addClass('table-success');
                $('#btnVerifyAllBomRows').prop('disabled', true);
                toastr.success('All BOM lines verified successfully.');
                loadBOMList();
            })
            .catch(function () {
                HideLoader && HideLoader();
                toastr.error('Error while verifying BOM lines.');
            });
    } else {
        $('#tblBOM tbody tr').addClass('table-success');
        $('#btnVerifyAllBomRows').prop('disabled', true);
        toastr.success('All BOM lines verified (local only).');
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
    try {
        const el = document.getElementById(id);
        if (window.bootstrap && window.bootstrap.Modal) {
            bootstrap.Modal.getOrCreateInstance(el).show();
        } else {
            $(`#${id}`).modal('show');
        }
    } catch (e) {
        $(`#${id}`).modal('show');
    }
}

function hideModal(id) {
    try {
        const el = document.getElementById(id);
        if (window.bootstrap && window.bootstrap.Modal) {
            bootstrap.Modal.getOrCreateInstance(el).hide();
        } else {
            $(`#${id}`).modal('hide');
        }
    } catch (e) {
        $(`#${id}`).modal('hide');
    }
}

