import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { ProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectMasterService.js';
import { SubProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SubProjectMasterService.js';

let G_ProjectList         = [];
let G_SubProjectsCache    = []; 
let G_ActiveStatusFilter  = 'all'; 
let G_CompanyInfoList = [];

function refreshSubProjectsCache() {
    return SubProjectMasterService.GetSubProjectList()
        .then(function (response) {
            G_SubProjectsCache = Array.isArray(response) ? response
                : (response && Array.isArray(response.Data) ? response.Data : null)
                || (response && Array.isArray(response.data) ? response.data : null)
                || [];
        })
        .catch(function () {
            G_SubProjectsCache = [];
        });
}

function firstPayloadArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.Data)) return payload.Data;
    return [];
}

/**
 * Display text from GetCompanyInfoList row (SP: Code, UnitCode+'('+CompanyName+')').
 * Supports a single concatenated column from API or separate UnitCode / CompanyName.
 */
function getCompanyInfoListDisplayText(item) {
    if (!item) return '—';
    const t =
        item.CompanyInfo != null ? String(item.CompanyInfo)
            : item.CompanyInfoText != null ? String(item.CompanyInfoText)
                : item.DisplayText != null ? String(item.DisplayText)
                    : item.Label != null ? String(item.Label)
                        : item.Text != null ? String(item.Text)
                            : item.Desp != null ? String(item.Desp)
                                : item.Description != null ? String(item.Description)
                                    : '';
    if (t) return t;
    const uc = item.UnitCode != null ? String(item.UnitCode) : (item.unitCode != null ? String(item.unitCode) : '');
    const cn = item.CompanyName || item.companyName || '';
    if (uc && cn) return uc + '(' + cn + ')';
    if (cn) return cn;
    if (uc) return uc;
    return '—';
}

function companyInfoRowCode(item) {
    if (!item) return '';
    const c =
        item.Code != null ? item.Code
            : item.code != null ? item.code
                : item.CompanyParameter_Code != null ? item.CompanyParameter_Code
                    : item.companyParameter_Code != null ? item.companyParameter_Code
                        : item.CompanyParameterCode != null ? item.CompanyParameterCode
                            : '';
    if (c === '' || c == null) return '';
    const s = String(c).trim();
    const n = normalizeCompanyInfoId(s);
    if (n !== null && n <= 0) return '';
    return s;
}

function normalizeCompanyInfoId(v) {
    if (v === null || v === undefined || v === '') return null;
    const n = parseInt(String(v).trim(), 10);
    return isNaN(n) ? null : n;
}

function applyCompanyInfoDropdownSelection($ddl, rawCode, fallbackRow) {
    if (rawCode === null || rawCode === undefined || rawCode === '') return;

    const wantNum = normalizeCompanyInfoId(rawCode);
    if (wantNum !== null && wantNum <= 0) return;
    if (wantNum === null && String(rawCode).trim() === '0') return;

    const rawStr = String(rawCode).trim();

    if (wantNum !== null) {
        $ddl.val(String(wantNum));
        if ($ddl.val() === String(wantNum)) return;
    }

    $ddl.val(rawStr);
    if ($ddl.val() === rawStr) return;

    if (wantNum !== null) {
        let matchedVal = null;
        $ddl.find('option').each(function () {
            const ov = $(this).attr('value');
            if (ov === '' || ov == null) return;
            if (normalizeCompanyInfoId(ov) === wantNum) {
                matchedVal = ov;
                return false;
            }
        });
        if (matchedVal != null) {
            $ddl.val(matchedVal);
            return;
        }
    }

    if (!fallbackRow) return;

    const uc = fallbackRow.UnitCode != null ? String(fallbackRow.UnitCode) : (fallbackRow.unitCode != null ? String(fallbackRow.unitCode) : '');
    const cn = fallbackRow.CompanyName || fallbackRow.companyName || '';
    if (!cn && !uc) return;

    let label = '';
    if (uc && cn) label = uc + '(' + cn + ')';
    else if (cn) label = cn;
    else label = uc;

    const valToUse = wantNum != null ? String(wantNum) : rawStr;
    const hasVal = $ddl.find('option').filter(function () { return $(this).val() === valToUse; }).length > 0;
    if (!hasVal) {
        $ddl.append($('<option></option>').attr('value', valToUse).text(label));
    }
    $ddl.val(valToUse);
}

/**
 * Binds #ddlCompanyInfo via ProjectMaster GetCompanyInfoList (SP: GETCompanyInfo → Code, CompanyInfo).
 * @param {string|number} [selectedCode] - PM.CompanyParameter_Code for edit
 * @param {object} [fallbackRow] - row from GetProjectByCode if option missing
 */
function loadCompanyInfoDropdown(selectedCode, fallbackRow) {
    function bindOptions(response) {
        G_CompanyInfoList = firstPayloadArray(response);
        const $ddl = $('#ddlCompanyInfo');
        $ddl.empty().append('<option value="">-- Select Company Info --</option>');
        G_CompanyInfoList.forEach(function (item) {
            const val = companyInfoRowCode(item);
            if (!val) return;
            const text = getCompanyInfoListDisplayText(item);
            $ddl.append($('<option></option>').attr('value', val).text(text !== '—' ? text : ('Code ' + val)));
        });
        applyCompanyInfoDropdownSelection($ddl, selectedCode, fallbackRow);
    }

    return ProjectMasterService.GetCompanyInfoList()
        .then(function (response) {
            bindOptions(response);
        })
        .catch(function () {
            G_CompanyInfoList = [];
            toastr.error('Failed to load company information list.');
            const $ddl = $('#ddlCompanyInfo');
            $ddl.empty().append('<option value="">-- Select Company Info --</option>');
            applyCompanyInfoDropdownSelection($ddl, selectedCode, fallbackRow);
        });
}

function getCompanyInfoDisplayByCode(code) {
    if (code == null || code === '') return '—';
    const want = normalizeCompanyInfoId(code);
    const item = (G_CompanyInfoList || []).find(function (x) {
        const xv = companyInfoRowCode(x);
        if (!xv) return false;
        if (want !== null && normalizeCompanyInfoId(xv) === want) return true;
        return String(xv).trim() === String(code).trim();
    });
    if (item) return getCompanyInfoListDisplayText(item);
    return '—';
}

/** Reads FK from API row (PascalCase / camelCase / nested). Empty / 0 = no selection. */
function resolveCompanyParameterCode(row) {
    if (!row || typeof row !== 'object') return '';
    const tryVals = [
        row.CompanyParameter_Code,
        row.companyParameter_Code,
        row.CompanyParameterCode,
        row.companyParameterCode,
        row.Company_Parameter_Code
    ];
    for (let i = 0; i < tryVals.length; i++) {
        const v = tryVals[i];
        if (v !== undefined && v !== null && String(v).trim() !== '') {
            const s = String(v).trim();
            const n = normalizeCompanyInfoId(s);
            if (n !== null && n <= 0) return '';
            return s;
        }
    }
    if (row.ProjectMaster && typeof row.ProjectMaster === 'object') {
        return resolveCompanyParameterCode(row.ProjectMaster);
    }
    return '';
}

/** Normalizes GetProjectByCode / list API payloads. */
function unwrapProjectRecord(response) {
    if (response == null) return null;
    if (Array.isArray(response) && response.length) return response[0];
    if (response.Code != null || response.ProjectCode != null || response.ProjectDesp != null) return response;
    if (response.Data !== undefined) {
        const d = response.Data;
        if (Array.isArray(d) && d.length) return d[0];
        if (d && typeof d === 'object') return d;
    }
    if (response.data !== undefined) {
        const d = response.data;
        if (Array.isArray(d) && d.length) return d[0];
        if (d && typeof d === 'object') return d;
    }
    if (response.Result !== undefined && response.Result != null && typeof response.Result === 'object') {
        return unwrapProjectRecord(response.Result);
    }
    if (response.result !== undefined && response.result != null && typeof response.result === 'object') {
        return unwrapProjectRecord(response.result);
    }
    if (response.ProjectMaster != null && typeof response.ProjectMaster === 'object') {
        return response.ProjectMaster;
    }
    return null;
}

/**
 * View label: prefer UnitCode(CompanyName) from company list by code; else use join columns from SQL
 * (CompanyName, UnitCode on the same row as your INNER JOIN result).
 */
function getCompanyInfoDisplayForRow(row) {
    const code = resolveCompanyParameterCode(row);
    if (code) {
        const fromList = getCompanyInfoDisplayByCode(code);
        if (fromList !== '—') return fromList;
    }
    const uc = row.UnitCode != null ? String(row.UnitCode) : (row.unitCode != null ? String(row.unitCode) : '');
    const cn = row.CompanyName || row.companyName || '';
    if (uc && cn) return uc + '(' + cn + ')';
    if (cn) return cn;
    if (uc) return uc;
    return '—';
}

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    refreshSubProjectsCache();
    loadCompanyInfoDropdown();
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

    $('#txtEstimatedDays').on('input', function () {
        calcEstimatedDateFromDays();
    });

    $('#pmSearch').on('input', function () {
        applyProjectFilters();
    });

    $('.pm-stat-chip[data-filter]').on('click', function () {
        const filter = $(this).data('filter');
        if (filter) {
            G_ActiveStatusFilter = filter;
            $('.pm-stat-chip[data-filter]').removeClass('pm-stat-active');
            $(this).addClass('pm-stat-active');
            applyProjectFilters();
        }
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
            loadCompanyInfoDropdown();
            showModal('dvProjectModal');
        }
    });
}

function bindProjectDetailToEditForm(row) {
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
            Showloader && Showloader();
            ProjectMasterService.GetProjectByCode(code)
                .then(function (apiResponse) {
                    HideLoader && HideLoader();
                    const fromList = (G_ProjectList || []).find(x => String(x.Code) === String(code));
                    const fromApi = unwrapProjectRecord(apiResponse);
                    const row = fromApi
                        ? Object.assign({}, fromList || {}, fromApi)
                        : fromList;
                    if (!row) {
                        toastr.warning('Project not found.');
                        return;
                    }
                    const companyParamCode = resolveCompanyParameterCode(row);
                    loadCompanyInfoDropdown(companyParamCode, row).then(function () {
                        bindProjectDetailToEditForm(row);
                        $('#project-modal-title').text('Edit Project');
                        showModal('dvProjectModal');
                    });
                })
                .catch(function () {
                    HideLoader && HideLoader();
                    const row = (G_ProjectList || []).find(x => String(x.Code) === String(code));
                    if (!row) {
                        toastr.warning('Project not found.');
                        return;
                    }
                    const companyParamCode = resolveCompanyParameterCode(row);
                    loadCompanyInfoDropdown(companyParamCode, row).then(function () {
                        bindProjectDetailToEditForm(row);
                        $('#project-modal-title').text('Edit Project');
                        showModal('dvProjectModal');
                    });
                });
        }
    });
}

function fillProjectViewModal(row) {
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

    $('#viewCompanyInfo').text(getCompanyInfoDisplayForRow(row));
}

/* ── View ────────────────────────────────────────────────── */
function viewProject(code) {
    Showloader && Showloader();
    ProjectMasterService.GetProjectByCode(code)
        .then(function (apiResponse) {
            HideLoader && HideLoader();
            const row =
                unwrapProjectRecord(apiResponse)
                || (G_ProjectList || []).find(x => String(x.Code) === String(code));
            if (!row) {
                toastr.warning('Project not found.');
                return;
            }
            fillProjectViewModal(row);
            showModal('dvProjectViewModal');
        })
        .catch(function () {
            HideLoader && HideLoader();
            const row = (G_ProjectList || []).find(x => String(x.Code) === String(code));
            if (!row) {
                toastr.warning('Project not found.');
                return;
            }
            fillProjectViewModal(row);
            showModal('dvProjectViewModal');
        });
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
                toastr.warning(response.Msg);
            }
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            toastr.error((error && error.Msg));
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
    $('#ddlCompanyInfo').val('');
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
    const companyInfo = ($('#ddlCompanyInfo').val() || '').trim();
    if (!companyInfo) {
        toastr.warning('Please select Company Info.');
        $('#ddlCompanyInfo').focus();
        return false;
    }
    return true;
}

/* ── Save ────────────────────────────────────────────────── */
function saveProject() {
    if (!validateProjectForm()) return;

    const editingCode = parseInt($('#hfProjectCode').val() || '0', 10) || 0;
    var ModuleName = "Project Master",
        OptionName = editingCode > 0 ? "Edit" : "New",
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

    const newBudget = $('#txtBudget').val()
        ? parseFloat($('#txtBudget').val().toString().replace(/,/g, ''))
        : 0;

    if (code > 0 && G_SubProjectsCache && G_SubProjectsCache.length) {
        const subs = G_SubProjectsCache.filter(function (s) {
            return String(s.ProjectMaster_Code || s.MasterProjectCode || 0) === String(code);
        });

        // Budget: combined sub-project budgets must not exceed the project budget
        let sumSubBud = 0;
        subs.forEach(function (s) {
            sumSubBud += parseFloat(s.Budget || s.SubProjectBudget || 0) || 0;
        });

        if (newBudget > 0 && sumSubBud > 0 && newBudget < sumSubBud) {
            toastr.warning(
                'Project budget cannot be less than the combined sub-project budgets (total ₹ '
                    + Number(sumSubBud).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    + ').'
            );
            $('#txtBudget').focus();
            return;
        }

        // Dates: when updating project dates, existing sub-projects must still fit within the new range.
        // No sum-of-days check — only start/end date boundary is enforced.
        // Use YYYY-MM-DD string comparison to avoid timezone/time-component issues.
        const newStartStr = ($('#txtStartDate').val() || '').trim();
        const newEndStr   = ($('#txtEstimatedDate').val() || '').trim();

        if (newStartStr) {
            const offender = subs.find(function (s) {
                const sd = extractYMD(s.ProjectStartDate);
                return sd && sd < newStartStr;
            });
            if (offender) {
                toastr.warning(
                    'Cannot move project start date forward: sub-project "' +
                        (offender.SubProjectDesp || offender.SubProjectName || offender.Code) +
                        '" starts before the new project start date (' + newStartStr + '). Adjust sub-projects first.'
                );
                $('#txtStartDate').focus();
                return;
            }
        }

        if (newEndStr) {
            const offender = subs.find(function (s) {
                const ed = extractYMD(s.EstimatedCompletionDate);
                return ed && ed > newEndStr;
            });
            if (offender) {
                toastr.warning(
                    'Cannot move project end date backward: sub-project "' +
                        (offender.SubProjectDesp || offender.SubProjectName || offender.Code) +
                        '" ends after the new project end date (' + newEndStr + '). Adjust sub-projects first.'
                );
                $('#txtEstimatedDate').focus();
                return;
            }
        }
    }

    const companyParameter_Code = parseInt($('#ddlCompanyInfo').val() || '0', 10) || 0;
    const newDays = parseInt(($('#txtEstimatedDays').val() || '').trim(), 10) || 0;

    const payload = {
        Code:                    code,
        ProjectCode:             ($('#txtProjectCode').val() || '').trim(),
        ProjectDesp:             ($('#txtProjectName').val() || '').trim(),
        Budget:                  newBudget,
        ProjectStartDate:        $('#txtStartDate').val() || null,
        ProjectEstimatedDate:    $('#txtEstimatedDate').val() || null,
        EstimatedCompletionDays: newDays,
        CompanyParameter_Code:   companyParameter_Code
    };

    Showloader && Showloader();

    ProjectMasterService.SaveProject(payload)
        .then(function (response) {
            HideLoader && HideLoader();
            if (response.Status === 'Y') {
                toastr.success(response.Message || response.Msg || 'Project saved successfully.');
                hideModal('dvProjectModal');
                refreshSubProjectsCache();
                loadProjects();
            } else {
                toastr.warning(response.Message || response.Msg);
            }
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            toastr.error((error && (error.Msg || error.Message)));
        });
}

/* ── Load & bind grid ────────────────────────────────────── */
function loadProjects() {
    Showloader && Showloader();

    ProjectMasterService.GetProjectList()
        .then(function (response) {
            HideLoader && HideLoader();
            const rows = firstPayloadArray(response);
            G_ProjectList = rows.length ? rows : (Array.isArray(response) ? response : []);
            updateStats(G_ProjectList);
            applyProjectFilters();
            refreshSubProjectsCache();
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            G_ProjectList = [];
            updateStats([]);
            applyProjectFilters();
            toastr.error((error && error.Msg));
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

/* Sum of Budget for the list currently bound to the grid (filtered rows). */
function sumProjectListBudget(list) {
    let sum = 0;
    (list || []).forEach(function (x) {
        sum += parseFloat(x.Budget || x.ProjectBudget || 0) || 0;
    });
    return sum;
}

function sumProjectListEstDays(list) {
    let sum = 0;
    (list || []).forEach(function (x) {
        sum += parseInt(x.EstimatedCompletionDays || x.EstimatedDays || 0, 10) || 0;
    });
    return sum;
}

function formatTotalBudgetInr(sum) {
    return '₹ ' + Number(sum).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Keeps table footer and Total Budget stat in sync with visible rows. */
function updateProjectVisibleBudgetTotals(list) {
    const txt = formatTotalBudgetInr(sumProjectListBudget(list));
    $('#projectTableBudgetTotal').text(txt);
    $('#statTotalBudget').text(txt);
    const daysTotal = sumProjectListEstDays(list);
    $('#projectTableEstDaysTotal').text(daysTotal + ' days');
}

function bindProjectGrid(list) {
    const $tbody = $('#tblProject tbody');
    $tbody.empty();

    if (!list || list.length === 0) {
        $tbody.append(`
            <tr>
                <td colspan="8">
                    <div class="pm-empty">
                        <div class="pm-empty-icon"><i class="fas fa-folder-open"></i></div>
                        <div class="pm-empty-title">No Projects Found</div>
                        <div class="pm-empty-sub">Click "New Project" to create your first project.</div>
                    </div>
                </td>
            </tr>`);
        updateProjectVisibleBudgetTotals([]);
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

    updateProjectVisibleBudgetTotals(list);
}

/* ── Apply status + search filters and bind grid ──────────── */
function applyProjectFilters() {
    const query = ($('#pmSearch').val() || '').toLowerCase().trim();
    let list   = G_ProjectList;

    // Status filter (from card click)
    if (G_ActiveStatusFilter === 'running') {
        list = list.filter(function (x) { return String(x.Verify || '').toUpperCase() === 'Y'; });
    } else if (G_ActiveStatusFilter === 'pending') {
        list = list.filter(function (x) { return String(x.Verify || '').toUpperCase() === 'N'; });
    }

    // Search filter
    if (query) {
        list = list.filter(function (item) {
            const code = (item.ProjectCode || '').toLowerCase();
            const name = (item.ProjectDesp || item.ProjectName || '').toLowerCase();
            return code.includes(query) || name.includes(query);
        });
    }

    bindProjectGrid(list);
}

/* ── Client-side search (legacy, now delegates to apply) ─── */
function filterProjects(query) {
    applyProjectFilters();
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
function calcEstimatedDateFromDays() {
    const startVal = $('#txtStartDate').val();
    const days     = parseInt($('#txtEstimatedDays').val() || '', 10);
    if (!startVal || isNaN(days) || days < 0) return;
    const start = new Date(startVal);
    if (isNaN(start.getTime())) return;
    const estDate = new Date(start);
    estDate.setDate(estDate.getDate() + days);
    $('#txtEstimatedDate').val(formatDate(estDate));
}

/* Returns the YYYY-MM-DD portion of any date string/value without timezone shift.
   Works correctly for both '2026-04-01' and '2026-04-01T00:00:00' API formats. */
function extractYMD(dateVal) {
    if (!dateVal) return null;
    const m = String(dateVal).trim().match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
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
