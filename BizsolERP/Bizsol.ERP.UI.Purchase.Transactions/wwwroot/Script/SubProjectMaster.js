import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { SubProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SubProjectMasterService.js';
import { ProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectMasterService.js';

let G_SubProjectList = [];
let G_ProjectList    = [];
let G_UserList       = [];
let G_POLevelList    = [];

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    loadProjectDropdown();
    loadUserDropdown();
    loadPOLevelList();
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

    $('#txtEstimatedDays').on('input', function () {
        calcEstimatedDateFromDays();
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

/* ── Load user list ───────────────────────────────────────── */
function loadUserDropdown() {
    SubProjectMasterService.GetUserList()
        .then(function (response) {
            G_UserList = Array.isArray(response) ? response : [];
        })
        .catch(function () {
            toastr.error('Error loading user list.');
        });
}

/* ── Load PO approval levels list ────────────────────────── */
function loadPOLevelList() {
    SubProjectMasterService.GetLevelList()
        .then(function (response) {
            G_POLevelList = Array.isArray(response) ? response : [];
        })
        .catch(function () {
            toastr.error('Error loading PO approval levels.');
        });
}

/* ── Render PO levels user-assignment in form modal ──────── */
function renderPOLevelsFormTable(existingDetails) {
    $('#tblPOLevelsBody').find('select').each(function () {
        try { $(this).select2('destroy'); } catch (e) {}
    });
    try { $('#ddlSingleLevelUsers').select2('destroy'); } catch (e) {}
    $('#tblPOLevelsBody').empty();
    $('#dvSingleLevelSelect').empty().hide();

    if (!G_POLevelList || G_POLevelList.length === 0) {
        $('#dvPOLevelsTableWrap').show();
        $('#tblPOLevelsBody').append('<tr><td colspan="3" style="text-align:center;color:#94a3b8;font-size:13px;padding:14px;">No PO approval levels configured.</td></tr>');
        return;
    }

    if (G_POLevelList.length === 1) {
        // Single level — show a plain labelled dropdown, no table needed
        const level     = G_POLevelList[0];
        const levelCode = level.Code || level.PurchaseOrderApprovalConfiguration_Code || 0;
        const levelDesp = level.LevelDesp || '';
        const existing  = (existingDetails || []).find(function (d) {
            return String(d.PurchaseOrderApprovalConfiguration_Code) === String(levelCode);
        });
        const preSelected = existing
            ? String(existing.UserMaster_Codes_RightToVerifyPO || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean)
            : [];

        let opts = '';
        (G_UserList || []).forEach(function (u) {
            const val  = String(u.Code || u.UserMaster_Code || u.ID || 0);
            const text = u.UserName || u.Name || u.FullName || '';
            const sel  = preSelected.includes(val) ? ' selected' : '';
            opts += `<option value="${val}"${sel}>${escHtml(text)}</option>`;
        });

        $('#dvSingleLevelSelect').html(
            `<label style="font-size:12.5px;font-weight:700;color:var(--text-primary);margin-bottom:6px;display:block;">Users \u2014 ${escHtml(levelDesp)}</label>` +
            `<select id="ddlSingleLevelUsers" data-level-code="${levelCode}" multiple="multiple" style="width:100%;">${opts}</select>`
        ).show();
        $('#dvPOLevelsTableWrap').hide();

        try {
            $('#ddlSingleLevelUsers').select2({
                placeholder  : 'Select users\u2026',
                allowClear   : true,
                width        : '100%',
                dropdownParent: $('#dvSubProjectModal')
            });
        } catch (e) {}
        return;
    }

    // Multiple levels — table grid
    $('#dvPOLevelsTableWrap').show();
    G_POLevelList.forEach(function (level, idx) {
        const levelCode = level.Code || level.PurchaseOrderApprovalConfiguration_Code || 0;
        const levelDesp = level.LevelDesp || '';
        const existing  = (existingDetails || []).find(function (d) {
            return String(d.PurchaseOrderApprovalConfiguration_Code) === String(levelCode);
        });
        const preSelected = existing
            ? String(existing.UserMaster_Codes_RightToVerifyPO || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean)
            : [];

        const selectId = 'ddlLevelUsers_' + levelCode;
        let opts = '';
        (G_UserList || []).forEach(function (u) {
            const val  = String(u.Code || u.UserMaster_Code || u.ID || 0);
            const text = u.UserName || u.Name || u.FullName || '';
            const sel  = preSelected.includes(val) ? ' selected' : '';
            opts += `<option value="${val}"${sel}>${escHtml(text)}</option>`;
        });

        $('#tblPOLevelsBody').append(`
            <tr data-level-code="${levelCode}">
                <td class="center" style="width:44px;"><span class="pm-sno">${idx + 1}</span></td>
                <td style="white-space:nowrap; font-weight:600;">${escHtml(levelDesp)}</td>
                <td><select id="${selectId}" multiple="multiple" style="width:100%;">${opts}</select></td>
            </tr>
        `);

        try {
            $('#' + selectId).select2({
                placeholder  : 'Select users\u2026',
                allowClear   : true,
                width        : '100%',
                dropdownParent: $('#dvSubProjectModal')
            });
        } catch (e) {}
    });
}

/* ── Collect PO level-user details for save payload ─────── */
function collectPOLevelDetails() {
    const details        = [];
    const subProjectCode = parseInt($('#hfSubProjectCode').val() || '0', 10) || 0;

    if (G_POLevelList.length === 1) {
        const level     = G_POLevelList[0];
        const levelCode = level.Code || level.PurchaseOrderApprovalConfiguration_Code || 0;
        const levelDesp = level.LevelDesp || '';
        const userCodes = ($('#ddlSingleLevelUsers').val() || []).join(',');
        if (levelCode > 0) {
            details.push({
                PurchaseOrderApprovalConfiguration_Code: levelCode,
                LevelDesp                              : levelDesp,
                UserMaster_Codes_RightToVerifyPO       : userCodes,
                SubProjectMaster_Code                  : subProjectCode
            });
        }
        return details;
    }

    $('#tblPOLevelsBody tr[data-level-code]').each(function () {
        const $row      = $(this);
        const levelCode = parseInt($row.data('level-code'), 10) || 0;
        if (levelCode <= 0) return;
        const levelObj  = (G_POLevelList || []).find(function (l) {
            return (l.Code || l.PurchaseOrderApprovalConfiguration_Code || 0) === levelCode;
        });
        const levelDesp = levelObj ? (levelObj.LevelDesp || '') : '';
        const userCodes = ($('#ddlLevelUsers_' + levelCode).val() || []).join(',');
        details.push({
            PurchaseOrderApprovalConfiguration_Code: levelCode,
            LevelDesp                              : levelDesp,
            UserMaster_Codes_RightToVerifyPO       : userCodes,
            SubProjectMaster_Code                  : subProjectCode
        });
    });
    return details;
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

/* ── Parse GetSubProjectByCode response ──────────────────── */
/*  Handles two common shapes returned by the API:
    1. { SubProjectMasterData:[{...}], PurchaseOrderLevelsApprovalProjectUserDetails:[...] }
    2. A single main-row object with PurchaseOrderLevelsApprovalProjectUserDetails embedded     */
function parseSubProjectByCodeResponse(response) {
    var row          = null;
    var levelDetails = [];
    if (!response) return { row: row, levelDetails: levelDetails };

    var mainArr = response.SubProjectMasterData
               || response.SubProjectData
               || response.SubProjectDetails
               || null;

    if (Array.isArray(mainArr) && mainArr.length > 0) {
        row = mainArr[0];
    } else if (Array.isArray(response) && response.length > 0) {
        if (Array.isArray(response[0])) {
            row          = (response[0] || [])[0] || null;
            levelDetails = Array.isArray(response[1]) ? response[1] : [];
            return { row: row, levelDetails: levelDetails };
        }
        row = response[0];
    } else if (response.Code || response.code) {
        row = response;
    }

    if (Array.isArray(response.PurchaseOrderLevelsApprovalProjectUserDetails)) {
        levelDetails = response.PurchaseOrderLevelsApprovalProjectUserDetails;
    } else if (row && Array.isArray(row.PurchaseOrderLevelsApprovalProjectUserDetails)) {
        levelDetails = row.PurchaseOrderLevelsApprovalProjectUserDetails;
    }

    return { row: row, levelDetails: levelDetails };
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
        }

        Showloader && Showloader();
        SubProjectMasterService.GetSubProjectByCode(code)
            .then(function (res) {
                HideLoader && HideLoader();
                var parsed       = parseSubProjectByCodeResponse(res);
                var row          = parsed.row;
                var levelDetails = parsed.levelDetails;

                if (!row) { toastr.warning('Sub Project not found.'); return; }

                resetSubProjectForm();

                $('#hfSubProjectCode').val(row.Code);
                $('#ddlMasterProject').val(row.ProjectMaster_Code || '');
                $('#txtSubProjectName').val(row.SubProjectDesp || '');

                var budgetVal = row.Budget || 0;
                $('#txtBudget').val(budgetVal ? formatBudgetRaw(String(budgetVal)) : '');

                if (row.ProjectStartDate) {
                    var d = new Date(row.ProjectStartDate);
                    if (!isNaN(d.getTime())) $('#txtStartDate').val(formatDate(d));
                }

                if (row.EstimatedCompletionDate) {
                    var ed = new Date(row.EstimatedCompletionDate);
                    if (!isNaN(ed.getTime())) $('#txtEstimatedDate').val(formatDate(ed));
                }

                $('#txtEstimatedDays').val(row.EstimatedCompletionDays || '');

                renderPOLevelsFormTable(levelDetails);
                $('#spm-modal-title').text('Edit Sub Project');
                showModal('dvSubProjectModal');
            })
            .catch(function () {
                HideLoader && HideLoader();
                toastr.error('Error loading sub project for editing.');
            });
    });
}

/* ── View ────────────────────────────────────────────────── */
function viewSubProject(code) {
    Showloader && Showloader();
    SubProjectMasterService.GetSubProjectByCode(code)
        .then(function (res) {
            HideLoader && HideLoader();
            var parsed       = parseSubProjectByCodeResponse(res);
            var row          = parsed.row;
            var levelDetails = parsed.levelDetails;

            if (!row) { toastr.warning('Sub Project not found.'); return; }

            $('#viewMasterProject').text(row.ProjectDesp || '—');
            $('#viewSubProjectName').text(row.SubProjectDesp || '—');

            var budget = row.Budget || 0;
            $('#viewBudget').text(budget
                ? '₹ ' + Number(budget).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '—');

            var startTxt = '—';
            if (row.ProjectStartDate) {
                var d = new Date(row.ProjectStartDate);
                if (!isNaN(d.getTime())) {
                    var p = formatDate(d).split('-');
                    startTxt = p[2] + '-' + p[1] + '-' + p[0];
                }
            }
            $('#viewStartDate').text(startTxt);

            var estDateTxt = '—';
            if (row.EstimatedCompletionDate) {
                var ed = new Date(row.EstimatedCompletionDate);
                if (!isNaN(ed.getTime())) {
                    var ep = formatDate(ed).split('-');
                    estDateTxt = ep[2] + '-' + ep[1] + '-' + ep[0];
                }
            }
            $('#viewEstimatedDate').text(estDateTxt);
            $('#viewEstDays').text((row.EstimatedCompletionDays || 0) + ' days');

            if (levelDetails.length > 0) {
                var tbl = '<table style="width:100%;border-collapse:collapse;font-size:12.5px;">';
                tbl += '<thead><tr>' +
                       '<th style="padding:5px 10px;background:#f1f5f9;border:1px solid #e2e8f0;font-weight:700;color:#475569;">Level</th>' +
                       '<th style="padding:5px 10px;background:#f1f5f9;border:1px solid #e2e8f0;font-weight:700;color:#475569;">Users</th>' +
                       '</tr></thead><tbody>';
                levelDetails.forEach(function (d) {
                    var codes = String(d.UserMaster_Codes_RightToVerifyPO || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
                    var names = codes.map(function (c) {
                        var u = (G_UserList || []).find(function (x) { return String(x.Code || x.UserMaster_Code || x.ID) === c; });
                        return u ? (u.UserName || u.Name || u.FullName || c) : c;
                    }).filter(Boolean);
                    tbl += '<tr>' +
                           '<td style="padding:5px 10px;border:1px solid #e2e8f0;font-weight:600;white-space:nowrap;">' + escHtml(d.LevelDesp || '') + '</td>' +
                           '<td style="padding:5px 10px;border:1px solid #e2e8f0;">' + escHtml(names.join(', ') || '—') + '</td>' +
                           '</tr>';
                });
                tbl += '</tbody></table>';
                $('#viewVerifyPOUsers').html(tbl);
            } else {
                $('#viewVerifyPOUsers').html('—');
            }

            showModal('dvSubProjectViewModal');
        })
        .catch(function () {
            HideLoader && HideLoader();
            toastr.error('Error loading sub project details.');
        });
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
                toastr.warning(response.Msg);
            }
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            toastr.error((error && error.Msg));
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
    renderPOLevelsFormTable([]);
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
                                     : 0,
        PurchaseOrderLevelsApprovalProjectUserDetails: collectPOLevelDetails()
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
                toastr.warning(response.Msg);
            }
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            toastr.error((error && error.Msg) );
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
            toastr.error((error && error.Msg) );
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
