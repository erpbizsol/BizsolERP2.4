import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { SubProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SubProjectMasterService.js';
import { ProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectMasterService.js';

let G_SubProjectList = [];
let G_ProjectList    = [];

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    loadProjectDropdown();
    loadSubProjects();

    $('#btnCreateSubProject').on('click', function () {
        OpenNew_SubProjectMaster();
    });

    $('#btnSaveSubProject').on('click', function () {
        saveSubProject();
    });

    $('#btnConfirmDelete').on('click', function () {
        const code   = parseInt($('#hfDeleteCode').val() || '0', 10) || 0;
        const reason = ($('#reasonForDeleteInput').val() || '').trim();
        if (!reason) {
            toastr.warning('Please provide a reason for deletion.');
            $('#reasonForDeleteInput').focus();
            return;
        }
        if (code > 0) callDeleteSubProjectApi(code, reason);
    });

    $('#txtBudget').on('input', function () {
        formatBudgetInput(this);
    });

    $('#txtStartDate, #txtEstimatedDate').on('change', function () {
        calcEstimatedDays();
    });

    $('#spmSearch').on('input', function () {
        filterSubProjects($(this).val().toLowerCase().trim());
    });
});

/* ── Financial year ──────────────────────────────────────── */
function getFinancialYear() {
    var currentDate  = new Date();
    var currentMonth = currentDate.getMonth();
    var startYear    = currentDate.getFullYear();
    if (currentMonth < 3) startYear = startYear - 1;
    return startYear + "-" + (startYear + 1);
}

/* ── Load master project dropdown ────────────────────────── */
function loadProjectDropdown() {
    ProjectMasterService.GetProjectList()
        .then(function (response) {
            G_ProjectList = Array.isArray(response) ? response : [];
            const $sel = $('#ddlMasterProject');
            $sel.empty().append('<option value="">-- Select Master Project --</option>');
            G_ProjectList.forEach(function (p) {
                const val  = p.Code || 0;
                const text = (p.ProjectDesp || p.ProjectName || '');
                $sel.append(`<option value="${val}">${escHtml(text)}</option>`);
            });
        })
        .catch(function () {
            toastr.error('Error loading master projects.');
        });
}

/* ── New ─────────────────────────────────────────────────── */
function OpenNew_SubProjectMaster() {
    var ModuleName = "Sub Project Master",
        OptionName = "New",
        ShowMsg    = "Y",
        FinYear    = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            resetSubProjectForm();
            $('#spm-modal-title').text('New Sub Project');
            showModal('dvSubProjectModal');
        }
    });
}

/* ── Edit ────────────────────────────────────────────────── */
function SubProjectMaster_EditData(code) {
    var ModuleName = "Sub Project Master",
        OptionName = "Edit",
        ShowMsg    = "Y",
        FinYear    = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            resetSubProjectForm();
            const row = (G_SubProjectList || []).find(x => String(x.Code) === String(code));
            if (row) {
                $('#hfSubProjectCode').val(row.Code);
                $('#ddlMasterProject').val(row.ProjectMaster_Code || row.MasterProjectCode || '');
                $('#txtSubProjectName').val(row.SubProjectDesp || row.SubProjectName || '');

                const budgetVal = row.Budget || row.SubProjectBudget || 0;
                $('#txtBudget').val(budgetVal ? formatBudgetRaw(String(budgetVal)) : '');

                if (row.SubProjectStartDate || row.ProjectStartDate) {
                    const d = new Date(row.SubProjectStartDate || row.ProjectStartDate);
                    if (!isNaN(d.getTime())) {
                        $('#txtStartDate').val(formatDate(d));
                    }
                }

                $('#txtEstimatedDays').val(row.EstimatedCompletionDays || row.ProjectEstimatedDate || '');

                if (row.EstimatedCompletionDate || row.ProjectEstimatedDate) {
                    const ed = new Date(row.EstimatedCompletionDate || row.ProjectEstimatedDate);
                    if (!isNaN(ed.getTime())) {
                        $('#txtEstimatedDate').val(formatDate(ed));
                    }
                }

                $('#spm-modal-title').text('Edit Sub Project');
            }
            showModal('dvSubProjectModal');
        }
    });
}

/* ── View ────────────────────────────────────────────────── */
function viewSubProject(code) {
    const row = (G_SubProjectList || []).find(x => String(x.Code) === String(code));
    if (!row) { toastr.warning('Sub Project not found.'); return; }

    const masterCode = row.ProjectMaster_Code || row.MasterProjectCode || '';
    const master = G_ProjectList.find(p => String(p.Code) === String(masterCode));
    const masterName = master
        ? (master.ProjectDesp || master.ProjectName || '') + (master.ProjectCode ? ' (' + master.ProjectCode + ')' : '')
        : '—';

    $('#viewMasterProject').text(masterName);
    $('#viewSubProjectName').text(row.SubProjectDesp || row.SubProjectName || '—');

    const budget = row.Budget || row.SubProjectBudget || 0;
    $('#viewBudget').text(budget
        ? '₹ ' + Number(budget).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '—');

    let startTxt = '—';
    const startRaw = row.SubProjectStartDate || row.ProjectStartDate;
    if (startRaw) {
        const d = new Date(startRaw);
        if (!isNaN(d.getTime())) {
            const parts = formatDate(d).split('-');
            startTxt = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    $('#viewStartDate').text(startTxt);

    let estDateTxt = '—';
    const estRaw = row.EstimatedCompletionDate || row.ProjectEstimatedDate;
    if (estRaw) {
        const ed = new Date(estRaw);
        if (!isNaN(ed.getTime())) {
            const parts = formatDate(ed).split('-');
            estDateTxt = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    $('#viewEstimatedDate').text(estDateTxt);
    $('#viewEstDays').text((row.EstimatedCompletionDays || row.EstimatedDays || 0) + ' days');

    showModal('dvSubProjectViewModal');
}

/* ── Delete ──────────────────────────────────────────────── */
function DeleteSubProject(code) {
    if (!code) return;

    var ModuleName = "Sub Project Master",
        OptionName = "Delete",
        ShowMsg    = "Y",
        FinYear    = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $('#hfDeleteCode').val(code);
            $('#reasonForDeleteInput').val('');
            showModal('dvDeleteConfirmModal');
        }
    });
}

/* ── Call delete API ─────────────────────────────────────── */
function callDeleteSubProjectApi(code, reason) {
    Showloader && Showloader();

    SubProjectMasterService.DeleteSubProject(code, reason)
        .then(function (response) {
            HideLoader && HideLoader();
            if (response.Status === 'Y') {
                toastr.success(response.Msg || 'Sub Project deleted successfully.');
                hideModal('dvDeleteConfirmModal');
                loadSubProjects();
            } else {
                toastr.warning(response.Msg || 'Failed to delete sub project.');
            }
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            toastr.error((error && error.Msg) || 'Error while deleting sub project. Please try again.');
        });
}

/* ── Reset form ──────────────────────────────────────────── */
function resetSubProjectForm() {
    $('#hfSubProjectCode').val(0);
    $('#ddlMasterProject').val('');
    $('#txtSubProjectName').val('');
    $('#txtBudget').val('');
    $('#txtStartDate').val(getTodayForInput());
    $('#txtEstimatedDate').val(getTodayForInput());
    $('#txtEstimatedDays').val('');
}

/* ── Validate ────────────────────────────────────────────── */
function validateSubProjectForm() {
    const masterCode    = ($('#ddlMasterProject').val() || '').trim();
    const subProjName   = ($('#txtSubProjectName').val() || '').trim();
    const estimatedDays = ($('#txtEstimatedDays').val() || '').trim();

    if (!masterCode) {
        toastr.warning('Please select a Master Project.');
        $('#ddlMasterProject').focus();
        return false;
    }
    if (!subProjName) {
        toastr.warning('Please fill the Sub Project Name.');
        $('#txtSubProjectName').focus();
        return false;
    }
    if (!estimatedDays || isNaN(estimatedDays) || parseInt(estimatedDays, 10) < 0) {
        toastr.warning('Please enter valid Estimated Completion Days.');
        $('#txtEstimatedDays').focus();
        return false;
    }
    return true;
}

/* ── Save ────────────────────────────────────────────────── */
function saveSubProject() {
    if (!validateSubProjectForm()) return;

    var ModuleName = "Sub Project Master",
        OptionName = "New",
        ShowMsg    = "Y",
        FinYear    = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            callSaveSubProjectApi();
        }
    });
}

function callSaveSubProjectApi() {
    const code         = parseInt($('#hfSubProjectCode').val() || '0', 10) || 0;
    const startDateRaw = ($('#txtStartDate').val() || '').trim();

    const payload = {
        Code:                    code,
        ProjectMaster_Code:      parseInt($('#ddlMasterProject').val() || '0', 10) || 0,
        SubProjectDesp:          ($('#txtSubProjectName').val() || '').trim(),
        Budget:                  $('#txtBudget').val()
                                     ? parseFloat($('#txtBudget').val().toString().replace(/,/g, ''))
                                     : 0,
        ProjectStartDate:     startDateRaw || null,
        ProjectEstimatedDate: ($('#txtEstimatedDate').val() || '').trim() || null,
        EstimatedCompletionDays: $('#txtEstimatedDays').val()
                                     ? parseInt($('#txtEstimatedDays').val(), 10)
                                     : 0
    };

    Showloader && Showloader();

    SubProjectMasterService.SaveSubProject(payload)
        .then(function (response) {
            HideLoader && HideLoader();
            if (response.Status === 'Y') {
                toastr.success(response.Msg || 'Sub Project saved successfully.');
                hideModal('dvSubProjectModal');
                loadSubProjects();
            } else {
                toastr.warning(response.Msg || 'Failed to save sub project.');
            }
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            toastr.error((error && error.Msg) || 'Error while saving sub project. Please try again.');
        });
}

/* ── Load & bind grid ────────────────────────────────────── */
function loadSubProjects() {
    Showloader && Showloader();

    SubProjectMasterService.GetSubProjectList()
        .then(function (response) {
            HideLoader && HideLoader();
            G_SubProjectList = Array.isArray(response) ? response : [];
            updateStats(G_SubProjectList);
            bindSubProjectGrid(G_SubProjectList);
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            G_SubProjectList = [];
            updateStats([]);
            bindSubProjectGrid([]);
            toastr.error((error && error.Msg) || 'Error loading sub project list.');
        });
}

function updateStats(list) {
    const total = list.length;
    const runningTotal = list
        .filter(function (x) { return String(x.Verify || '').toUpperCase() === 'Y'; })
        .reduce(function (sum, x) { return sum + (Number(x.Budget) || Number(x.SubProjectBudget) || 0); }, 0);
    const pendingTotal = list
        .filter(function (x) { return String(x.Verify || '').toUpperCase() !== 'Y'; })
        .reduce(function (sum, x) { return sum + (Number(x.Budget) || Number(x.SubProjectBudget) || 0); }, 0);

    $('#statTotal').text(total);
    $('#statBudget').text(formatLakhsCrores(runningTotal));
    $('#statAvgDays').text(formatLakhsCrores(pendingTotal));
}

function formatLakhsCrores(n) {
    if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
    if (n >= 100000)   return (n / 100000).toFixed(1) + 'L';
    if (n >= 1000)     return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function bindSubProjectGrid(list) {
    const $tbody = $('#tblSubProject tbody');
    $tbody.empty();

    if (!list || list.length === 0) {
        $tbody.append(`
            <tr>
                <td colspan="7">
                    <div class="pm-empty">
                        <div class="pm-empty-icon"><i class="fas fa-folder-open"></i></div>
                        <div class="pm-empty-title">No Sub Projects Found</div>
                        <div class="pm-empty-sub">Click "New Sub Project" to create your first sub project.</div>
                    </div>
                </td>
            </tr>`);
        return;
    }

    list.forEach(function (item, index) {
        const code            = item.Code || 0;
        const masterCode      = item.ProjectMaster_Code || item.MasterProjectCode || '';
        const master          = G_ProjectList.find(p => String(p.Code) === String(masterCode));
        const masterName      = master ? (master.ProjectDesp || master.ProjectName || master.ProjectCode || '—') : '—';
        const subProjectName  = item.SubProjectDesp || item.SubProjectName || '';
        const budget          = item.Budget || item.SubProjectBudget || 0;
        const estimatedDays   = item.EstimatedCompletionDays || item.EstimatedDays || 0;

        let startDateText = '—';
        const startRaw = item.SubProjectStartDate || item.ProjectStartDate;
        if (startRaw) {
            const d = new Date(startRaw);
            if (!isNaN(d.getTime())) {
                const parts = formatDate(d).split('-');
                startDateText = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        let estDateText = '—';
        const estRaw = item.EstimatedCompletionDate || item.EstimatedDate;
        if (estRaw) {
            const ed = new Date(estRaw);
            if (!isNaN(ed.getTime())) {
                const parts = formatDate(ed).split('-');
                estDateText = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        $tbody.append(`
            <tr>
                <td class="center"><span class="pm-sno">${index + 1}</span></td>
                <td style="max-width:220px; overflow:hidden; text-overflow:ellipsis;">${escHtml(masterName)}</td>
                <td style="max-width:260px; overflow:hidden; text-overflow:ellipsis;">${escHtml(subProjectName)}</td>
                <td class="right">
                    <span class="pm-budget">&#8377; ${Number(budget).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
                <td class="center">${startDateText}</td>
                <td class="center">${estDateText}</td>
                <td class="center"><span class="pm-days-chip">${estimatedDays} days</span></td>
                <td class="center">
                    <div class="pm-actions">
                        <button type="button" class="pm-icon-btn view"  title="View"   onclick="viewSubProject(${code})"><i class="fas fa-eye"></i></button>
                        <button type="button" class="pm-icon-btn edit"  title="Edit"   onclick="SubProjectMaster_EditData(${code})"><i class="fas fa-pencil-alt"></i></button>
                        <button type="button" class="pm-icon-btn del"   title="Delete" onclick="DeleteSubProject(${code})"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            </tr>`);
    });
}

/* ── Client-side search ──────────────────────────────────── */
function filterSubProjects(query) {
    if (!query) { bindSubProjectGrid(G_SubProjectList); return; }
    const filtered = G_SubProjectList.filter(function (item) {
        const name       = (item.SubProjectDesp || item.SubProjectName || '').toLowerCase();
        const masterCode = item.ProjectMaster_Code || item.MasterProjectCode || '';
        const master     = G_ProjectList.find(p => String(p.Code) === String(masterCode));
        const masterName = master ? (master.ProjectDesp || master.ProjectName || '').toLowerCase() : '';
        return name.includes(query) || masterName.includes(query);
    });
    bindSubProjectGrid(filtered);
}

/* ── Budget formatting ───────────────────────────────────── */
function formatBudgetInput(input) {
    if (!input) return;
    input.value = formatBudgetRaw(input.value);
}

function formatBudgetRaw(value) {
    if (value === null || value === undefined) return '';
    let raw = value.toString();
    const endsWithDot = raw.trim().endsWith('.');
    raw = raw.replace(/,/g, '').replace(/[^0-9.]/g, '');
    if (!raw) return '';

    const parts = raw.split('.');
    let intPart = (parts[0] || '').replace(/^0+(?=\d)/, '') || '0';
    let decPart = (parts[1] || '').substring(0, 3);
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (endsWithDot && !decPart) return `${intPart}.`;
    return decPart ? `${intPart}.${decPart}` : intPart;
}

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(date) {
    let day   = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let year  = date.getFullYear();
    return `${year}-${month}-${day}`;
}

function getTodayForInput() {
    return formatDate(new Date());
}
function calcEstimatedDays() {
    const startVal = $('#txtStartDate').val();
    const estVal   = $('#txtEstimatedDate').val();
    if (startVal && estVal) {
        const start = new Date(startVal);
        const end   = new Date(estVal);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
            const diffMs   = end.getTime() - start.getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            $('#txtEstimatedDays').val(diffDays);
        } else if (end < start) {
            toastr.warning('Est. Date cannot be before Start Date.');
            $('#txtEstimatedDate').val('');
            $('#txtEstimatedDays').val('');
        }
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
            const m = bootstrap.Modal.getInstance(el);
            if (m) m.hide();
        } else {
            $(`#${id}`).modal('hide');
        }
    } catch (e) {
        $(`#${id}`).modal('hide');
    }
}

/* ── Expose globals ──────────────────────────────────────── */
window.viewSubProject            = viewSubProject;
window.SubProjectMaster_EditData = SubProjectMaster_EditData;
window.DeleteSubProject          = DeleteSubProject;
