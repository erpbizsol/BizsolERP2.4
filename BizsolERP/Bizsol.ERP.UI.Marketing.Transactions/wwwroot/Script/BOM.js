import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { ProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectMasterService.js';
import { SubProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SubProjectMasterService.js';
import { ItemMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_ItemMasterService.js';
import { BOMService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BOMService.js';

let G_ProjectList = [];
let G_SubProjectList = [];
let G_ItemList = [];
let G_TypeList = [];
let G_BOMRows = [];   // rows within current BOM entry
let G_BOMList = [];   // header list for main grid

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    //loadBOMList();
    loadProjectsAndSubProjects();
    loadItemAndTypeMaster();

    $('#btnCreateBOM').on('click', function () {
        openNewBOM();
    });

    $('#bomSearch').on('input', function () {
        const q = $(this).val().toLowerCase().trim();
        filterBOMs(q);
    });

    $('#dvBOMModal').on('hidden.bs.modal', function () {
        loadBOMList();
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
                <td colspan="5">
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

        $tbody.append(`
            <tr>
                <td class="center"><span class="pm-sno">${index + 1}</span></td>
                <td style="max-width:260px; overflow:hidden; text-overflow:ellipsis;">${escHtml(projectName)}</td>
                <td style="max-width:260px; overflow:hidden; text-overflow:ellipsis;">${escHtml(subProjectName)}</td>
                <td class="right">
                    <span class="pm-budget">&#8377; ${totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
                <td class="center">
                    <span class="${statusClass}">${statusTxt}</span>
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
    resetBomForm();

    if (!G_ProjectList.length || !G_SubProjectList.length) {
        loadProjectsAndSubProjects();
    }
    if (!G_ItemList.length || !G_TypeList.length) {
        loadItemAndTypeMaster();
    }

    $('#bom-modal-title').text('New BOM');
    showModal('dvBOMModal');
    addNewBomRow();
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

function loadItemAndTypeMaster() {
    ItemMasterService.GetTypeMasterList()
        .then(function (types) {
            G_TypeList = Array.isArray(types) ? types : [];
        })
        .catch(function () {
            toastr.error('Error loading work type master.');
        });

    ItemMasterService.GetItemMasterListData()
        .then(function (items) {
            let rows = [];
            if (Array.isArray(items)) rows = items;
            else if (Array.isArray(items.data)) rows = items.data;
            else if (Array.isArray(items.Data)) rows = items.Data;
            G_ItemList = rows;
        })
        .catch(function () {
            toastr.error('Error loading item master.');
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
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="Services">Services</option>
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
                <div class="bom-actions">
                    <button type="button" class="bom-btn save js-save-row">
                        <i class="fas fa-save"></i> Save
                    </button>
                    <button type="button" class="bom-btn verify js-verify-row" style="display:none;">
                        <i class="fas fa-check-circle"></i> Verify
                    </button>
                </div>
            </td>
        </tr>
    `);

    $tbody.append($tr);

    initRowWorkTypeDropdown($tr);
    initRowEvents($tr);
}

function resetBomForm() {
    G_BOMRows = [];

    $('#ddlProject').val('');
    const $sub = $('#ddlSubProject');
    $sub.empty().append('<option value="">Select project first</option>');

    const $tbody = $('#tblBOM tbody');
    $tbody.empty();
}

function initRowWorkTypeDropdown($tr) {
    const $wt = $tr.find('.bom-work-type');
    $wt.empty().append('<option value="">Select</option>');

    const filteredTypes = G_TypeList.filter(function (t) {
        const name = (t.ItemType || '').toLowerCase();
        return name === 'goods' || name === 'service';
    });

    filteredTypes.forEach(function (t) {
        const code = t.Code || 0;
        const name = t.ItemType || '';
        $wt.append(`<option value="${code}" data-name="${name}">${escHtml(name)}</option>`);
    });

    $wt.off('change').on('change', function () {
        bindItemDropdownForRow($tr);
    });
}

function bindItemDropdownForRow($tr) {
    const $wt = $tr.find('.bom-work-type');
    const selectedTypeCode = $wt.val();

    const $item = $tr.find('.bom-item');
    $item.empty().append('<option value="">Select</option>');
    $tr.find('.bom-uom').val('');

    if (!selectedTypeCode) return;

    const typeObj = G_TypeList.find(function (t) { return String(t.Code) === String(selectedTypeCode); });
    const typeName = typeObj ? (typeObj.ItemType || '').toLowerCase() : '';

    const filteredItems = G_ItemList.filter(function (it) {
        const tCode = it.TypeMaster_Code || 0;
        const tName = (it.ItemType || it.TypeName || '').toLowerCase();

        if (tCode && String(tCode) === String(selectedTypeCode)) return true;
        if (typeName && tName && tName === typeName) return true;
        return false;
    });

    filteredItems.forEach(function (it) {
        const code = it.Code || 0;
        const name = (it.ItemName || it.ItemCode || '').trim();
        $item.append(`<option value="${code}" data-uom="${escHtml(it.UOM || '')}">${escHtml(name)}</option>`);
    });

    $item.off('change').on('change', function () {
        const uom = $(this).find('option:selected').data('uom') || '';
        $tr.find('.bom-uom').val(uom || '');
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

    $tr.find('.js-save-row').on('click', function () {
        saveRow($tr);
    });

    $tr.find('.js-verify-row').on('click', function () {
        verifyRow($tr);
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

function saveRow($tr) {
    if (!validateRow($tr)) return;

    const payload = buildRowPayload($tr);

    // Optional: call API when available
    if (BOMService && typeof BOMService.SaveBOMRow === 'function') {
        Showloader && Showloader();
        BOMService.SaveBOMRow(payload)
            .then(function (resp) {
                HideLoader && HideLoader();
                if (resp && resp.Status === 'Y') {
                    finalizeRowAfterSave($tr, payload);
                    toastr.success(resp.Msg || 'BOM row saved.');
                } else {
                    toastr.warning((resp && resp.Msg) || 'Failed to save BOM row.');
                }
            })
            .catch(function () {
                HideLoader && HideLoader();
                toastr.error('Error while saving BOM row.');
            });
    } else {
        // local-only fallback
        finalizeRowAfterSave($tr, payload);
        toastr.success('BOM row saved (local only).');
    }
}

function finalizeRowAfterSave($tr, payload) {
    const rowId = $tr.data('row-id');
    const existingIndex = G_BOMRows.findIndex(function (r) { return r.RowId === rowId; });
    const rowData = Object.assign({ RowId: rowId, Verified: 'N' }, payload);

    if (existingIndex >= 0) {
        G_BOMRows[existingIndex] = rowData;
    } else {
        G_BOMRows.push(rowData);
    }

    $tr.attr('data-state', 'saved');
    $tr.find('.bom-input, .bom-select')
        .prop('readonly', true)
        .prop('disabled', true);

    $tr.find('.bom-amount').prop('readonly', true);

    $tr.find('.js-save-row').hide();
    $tr.find('.js-verify-row').show();

    // enable re-verify clicks
    $tr.find('.bom-project-category').prop('disabled', true);
    $tr.find('.bom-work-type').prop('disabled', true);
    $tr.find('.bom-item').prop('disabled', true);

    // Add a fresh row only once after previous row moves to saved state
    const $tbody = $('#tblBOM tbody');
    const isLastRow = $tbody.children('tr').last().is($tr);
    if (isLastRow) {
        addNewBomRow();
    }
}

function verifyRow($tr) {
    const rowId = $tr.data('row-id');
    const row = G_BOMRows.find(function (r) { return r.RowId === rowId; });
    if (!row) {
        toastr.warning('Please save the row before verify.');
        return;
    }

    if (BOMService && typeof BOMService.VerifyBOMRow === 'function') {
        Showloader && Showloader();
        BOMService.VerifyBOMRow(row)
            .then(function (resp) {
                HideLoader && HideLoader();
                if (resp && resp.Status === 'Y') {
                    row.Verified = 'Y';
                    $tr.addClass('table-success');
                    $tr.find('.js-verify-row').prop('disabled', true);
                    toastr.success(resp.Msg || 'Row verified.');
                    loadBOMList();
                } else {
                    toastr.warning((resp && resp.Msg) || 'Failed to verify row.');
                }
            })
            .catch(function () {
                HideLoader && HideLoader();
                toastr.error('Error while verifying row.');
            });
    } else {
        row.Verified = 'Y';
        $tr.addClass('table-success');
        $tr.find('.js-verify-row').prop('disabled', true);
        toastr.success('Row verified (local only).');
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

