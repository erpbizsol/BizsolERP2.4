import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { ProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectMasterService.js';

let G_ProjectList = [];

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    loadProjects();

    $('#btnCreateProject').on('click', function () {
        OpenNew_ProjectMaster();
    });

    $('#btnSaveProject').on('click', function () {
        saveProject();
    });

    $('#btnConfirmDelete').on('click', function () {
        const code   = parseInt($('#hfDeleteCode').val() || '0', 10) || 0;
        const reason = ($('#reasonForDeleteInput').val() || '').trim();
        if (!reason) {
            toastr.warning('Please provide a reason for deletion.');
            $('#reasonForDeleteInput').focus();
            return;
        }
        if (code > 0) callDeleteProjectApi(code, reason);
    });

    $('#txtBudget').on('input', function () {
        formatBudgetInput(this);
    });

    $('#txtStartDate, #txtEstimatedDate').on('change', function () {
        calcEstimatedDays();
    });

    $('#pmSearch').on('input', function () {
        filterProjects($(this).val().toLowerCase().trim());
    });
});

/* ── Financial year ──────────────────────────────────────── */
function getFinancialYear() {
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth();
    var startYear = currentDate.getFullYear();
    if (currentMonth < 3) {
        startYear = startYear - 1;
    }
    return startYear + "-" + (startYear + 1);
}

// ── Auto-generate next Project Code (max + 1) ──────────────
function getNextProjectCode() {
    if (!Array.isArray(G_ProjectList) || G_ProjectList.length === 0) {
        return "1";
    }

    let maxCode = 0;

    G_ProjectList.forEach(function (item) {
        const raw = (item.ProjectCode || "").toString().trim();

        // Try simple numeric code first
        let num = parseInt(raw, 10);

        // If code has prefix like "PROJ-001", extract the last numeric part
        if (isNaN(num)) {
            const match = raw.match(/(\d+)\s*$/);
            if (match) {
                num = parseInt(match[1], 10);
            }
        }

        if (!isNaN(num) && num > maxCode) {
            maxCode = num;
        }
    });

    const next = maxCode + 1;
    return next.toString();
}

/* ── New ─────────────────────────────────────────────────── */
function OpenNew_ProjectMaster() {
    var ModuleName = "Project Master",
        OptionName = "New",
        ShowMsg    = "Y",
        FinYear    = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            resetProjectForm();
            $('#txtProjectCode').val(getNextProjectCode());
            $('#project-modal-title').text('New Project');
            showModal('dvProjectModal');
        }
    });
}

/* ── Edit ────────────────────────────────────────────────── */
function ProjectMaster_EditData(code) {
    var ModuleName = "Project Master",
        OptionName = "Edit",
        ShowMsg    = "Y",
        FinYear    = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            resetProjectForm();
            const row = (G_ProjectList || []).find(x => String(x.Code) === String(code));
            if (row) {
                $('#hfProjectCode').val(row.Code);
                $('#txtProjectCode').val(row.ProjectCode || '');
                $('#txtProjectName').val(row.ProjectDesp || row.ProjectName || '');

                const budgetVal = row.Budget || row.ProjectBudget || 0;
                $('#txtBudget').val(budgetVal ? formatBudgetRaw(String(budgetVal)) : '');

                if (row.ProjectStartDate) {
                    const d = new Date(row.ProjectStartDate);
                    if (!isNaN(d.getTime())) {
                        $('#txtStartDate').val(formatDate(d));
                    }
                }

                $('#txtEstimatedDays').val(row.EstimatedCompletionDays || row.EstimatedDays || '');

                if (row.EstimatedCompletionDate || row.EstimatedDate) {
                    const ed = new Date(row.EstimatedCompletionDate || row.EstimatedDate);
                    if (!isNaN(ed.getTime())) {
                        $('#txtEstimatedDate').val(formatDate(ed));
                    }
                }

                $('#project-modal-title').text('Edit Project');
            }
            showModal('dvProjectModal');
        }
    });
}

/* ── View ────────────────────────────────────────────────── */
function viewProject(code) {
    const row = (G_ProjectList || []).find(x => String(x.Code) === String(code));
    if (!row) { toastr.warning('Project not found.'); return; }

    $('#viewProjectCode').text(row.ProjectCode || '—');
    $('#viewProjectName').text(row.ProjectDesp || row.ProjectName || '—');

    const budget = row.Budget || row.ProjectBudget || 0;
    $('#viewBudget').text(budget
        ? '₹ ' + Number(budget).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '—');

    let startTxt = '—';
    if (row.ProjectStartDate) {
        const d = new Date(row.ProjectStartDate);
        if (!isNaN(d.getTime())) {
            const parts = formatDate(d).split('-');
            startTxt = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    $('#viewStartDate').text(startTxt);

    let estDateTxt = '—';
    if (row.EstimatedCompletionDate || row.EstimatedDate) {
        const ed = new Date(row.EstimatedCompletionDate || row.EstimatedDate);
        if (!isNaN(ed.getTime())) {
            const parts = formatDate(ed).split('-');
            estDateTxt = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    $('#viewEstimatedDate').text(estDateTxt);
    $('#viewEstDays').text((row.EstimatedCompletionDays || row.EstimatedDays || 0) + ' days');

    showModal('dvProjectViewModal');
}

/* ── Delete ──────────────────────────────────────────────── */
function DeleteProject(code) {
    if (!code) return;

    var ModuleName = "Project Master",
        OptionName = "Delete",
        ShowMsg    = "Y",
        FinYear    = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            const row = (G_ProjectList || []).find(x => String(x.Code) === String(code));
            const name = row ? (row.ProjectDesp || row.ProjectName || row.ProjectCode || code) : code;
            $('#delProjectName').text('"' + name + '"');
            $('#hfDeleteCode').val(code);
            $('#reasonForDeleteInput').val('');
            showModal('dvDeleteConfirmModal');
        }
    });
}

/* ── Call delete API ─────────────────────────────────────── */
function callDeleteProjectApi(code, reason) {
    Showloader && Showloader();

    ProjectMasterService.DeleteProject(code, reason)
        .then(function (response) {
            HideLoader && HideLoader();
            if (response.Status === 'Y') {
                toastr.success(response.Msg || 'Project deleted successfully.');
                hideModal('dvDeleteConfirmModal');
                loadProjects();
            } else {
                toastr.warning(response.Msg || 'Failed to delete project.');
            }
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            toastr.error((error && error.Msg) || 'Error while deleting project. Please try again.');
        });
}

/* ── Reset form ──────────────────────────────────────────── */
function resetProjectForm() {
    $('#hfProjectCode').val(0);
    $('#txtProjectCode').val('');
    $('#txtProjectName').val('');
    $('#txtBudget').val('');
    $('#txtStartDate').val(getTodayForInput());
    $('#txtEstimatedDate').val(getTodayForInput());
    $('#txtEstimatedDays').val('');
}

/* ── Validate ────────────────────────────────────────────── */
function validateProjectForm() {
    let projectCode = ($('#txtProjectCode').val() || '').trim();
    let projectName = ($('#txtProjectName').val() || '').trim();
    let estimatedDays = ($('#txtEstimatedDays').val() || '').trim();

    if (!projectCode) {
        toastr.warning('Please fill the Project Code.');
        $('#txtProjectCode').focus();
        return false;
    }
    if (!projectName) {
        toastr.warning('Please fill the Project Name.');
        $('#txtProjectName').focus();
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
function saveProject() {
    if (!validateProjectForm()) return;

    var ModuleName = "Project Master",
        OptionName = "New",
        ShowMsg    = "Y",
        FinYear    = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            callSaveProjectApi();
        }
    });
}

function callSaveProjectApi() {
    const code = parseInt($('#hfProjectCode').val() || '0', 10) || 0;

    const payload = {
        Code:                    code,
        ProjectCode:             ($('#txtProjectCode').val() || '').trim(),
        ProjectDesp:             ($('#txtProjectName').val() || '').trim(),
        Budget:                  $('#txtBudget').val()
                                     ? parseFloat($('#txtBudget').val().toString().replace(/,/g, ''))
                                     : 0,
        ProjectStartDate:        $('#txtStartDate').val() || null,
        ProjectEstimatedDate:    $('#txtEstimatedDate').val() || null,
        EstimatedCompletionDays: $('#txtEstimatedDays').val()
                                     ? parseInt($('#txtEstimatedDays').val(), 10)
                                     : 0
    };

    Showloader && Showloader();

    ProjectMasterService.SaveProject(payload)
        .then(function (response) {
            HideLoader && HideLoader();
            if (response.Status === 'Y') {
                toastr.success(response.Msg || 'Project saved successfully.');
                hideModal('dvProjectModal');
                loadProjects();
            } else {
                toastr.warning(response.Msg || 'Failed to save project.');
            }
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            toastr.error((error && error.Msg) || 'Error while saving project. Please try again.');
        });
}

/* ── Load & bind grid ────────────────────────────────────── */
function loadProjects() {
    Showloader && Showloader();

    ProjectMasterService.GetProjectList()
        .then(function (response) {
            HideLoader && HideLoader();
            G_ProjectList = Array.isArray(response) ? response : [];
            updateStats(G_ProjectList);
            bindProjectGrid(G_ProjectList);
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            G_ProjectList = [];
            updateStats([]);
            bindProjectGrid([]);
            toastr.error((error && error.Msg) || 'Error loading project list.');
        });
}

function updateStats(list) {
    const total = list.length;
    const runningTotal = list.filter(function (x) { return String(x.Verify || '').toUpperCase() === 'Y'; }).length;
    const pendingTotal = list.filter(function (x) { return String(x.Verify || '').toUpperCase() === 'N'; }).length;

    $('#statTotal').text(total);
    $('#statBudget').text(runningTotal);
    $('#statAvgDays').text(pendingTotal);
}

function formatLakhsCrores(n) {
    if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
    if (n >= 100000)   return (n / 100000).toFixed(1) + 'L';
    if (n >= 1000)     return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function bindProjectGrid(list) {
    const $tbody = $('#tblProject tbody');
    $tbody.empty();

    if (!list || list.length === 0) {
        $tbody.append(`
            <tr>
                <td colspan="7">
                    <div class="pm-empty">
                        <div class="pm-empty-icon"><i class="fas fa-folder-open"></i></div>
                        <div class="pm-empty-title">No Projects Found</div>
                        <div class="pm-empty-sub">Click "New Project" to create your first project.</div>
                    </div>
                </td>
            </tr>`);
        return;
    }

    list.forEach(function (item, index) {
        const code          = item.Code || 0;
        const projectCode   = item.ProjectCode || '';
        const projectName   = item.ProjectDesp || item.ProjectName || '';
        const budget        = item.Budget || item.ProjectBudget || 0;
        const estimatedDays = item.EstimatedCompletionDays || item.EstimatedDays || 0;

        let startDateText = '—';
        if (item.ProjectStartDate) {
            const d = new Date(item.ProjectStartDate);
            if (!isNaN(d.getTime())) {
                const parts = formatDate(d).split('-');
                startDateText = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        let estDateText = '—';
        const estRaw = item.EstimatedCompletionDate || item.EstimatedCompletionDate;
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
                <td><span class="pm-code-badge">${escHtml(projectCode)}</span></td>
                <td style="max-width:260px; overflow:hidden; text-overflow:ellipsis;">${escHtml(projectName)}</td>
                <td class="right">
                    <span class="pm-budget">&#8377; ${Number(budget).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
                <td class="center">${startDateText}</td>
                <td class="center">${estDateText}</td>
                <td class="center"><span class="pm-days-chip">${estimatedDays} days</span></td>
                <td class="center">
                    <div class="pm-actions">
                        <button type="button" class="pm-icon-btn view"  title="View"   onclick="viewProject(${code})"><i class="fas fa-eye"></i></button>
                        <button type="button" class="pm-icon-btn edit"  title="Edit"   onclick="ProjectMaster_EditData(${code})"><i class="fas fa-pencil-alt"></i></button>
                        <button type="button" class="pm-icon-btn del"   title="Delete" onclick="DeleteProject(${code})"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            </tr>`);
    });
}

/* ── Client-side search ──────────────────────────────────── */
function filterProjects(query) {
    if (!query) { bindProjectGrid(G_ProjectList); return; }
    const filtered = G_ProjectList.filter(function (item) {
        const code = (item.ProjectCode || '').toLowerCase();
        const name = (item.ProjectDesp || item.ProjectName || '').toLowerCase();
        return code.includes(query) || name.includes(query);
    });
    bindProjectGrid(filtered);
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
window.viewProject            = viewProject;
window.ProjectMaster_EditData = ProjectMaster_EditData;
window.DeleteProject          = DeleteProject;
