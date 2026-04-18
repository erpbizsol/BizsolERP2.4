import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { SubProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SubProjectMasterService.js';
import { ProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectMasterService.js';
import { BOMService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BOMService.js';
import { UserMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_UserMasterService.js';
import { PurchaseOrderStoreService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PurchaseOrderStoreServices.js';

let G_SubProjectList    = [];
let G_ProjectList       = [];
let G_UserList          = [];
let G_POLevelList       = [];
let G_SiteRepList       = [];
let G_ActiveStatusFilter = 'all'; // 'all' | 'running' | 'pending'

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    loadUserDropdown();
    loadPOLevelList();
    loadSiteRepDropdown(null);
    // Chain: load master projects first, then sub-projects (avoids race where grid binds before G_ProjectList is ready)
    loadProjectDropdown().finally(function () {
        loadSubProjects();
    });

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
        applySubProjectFilters();
    });

    $('.pm-stat-chip[data-filter]').on('click', function () {
        const filter = $(this).data('filter');
        if (filter) {
            G_ActiveStatusFilter = filter;
            $('.pm-stat-chip[data-filter]').removeClass('pm-stat-active');
            $(this).addClass('pm-stat-active');
            applySubProjectFilters();
        }
    });

    $('#dvSubProjectModal').on('shown.bs.modal', function () {
        if (G_UserList && G_UserList.length > 0) {
            refreshGRNCheckSelectPreserveSelection();
        } else {
            loadUserListForSubProject().catch(function () {});
        }
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
    return ProjectMasterService.GetProjectList()
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
            G_ProjectList = [];
        });
}

/* ── User list (wrapped API + User Master fallback) ──────── */
function normalizeUserListResponse(response) {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.Data)) return response.Data;
    if (Array.isArray(response.value)) return response.value;
    if (Array.isArray(response.Value)) return response.Value;
    if (Array.isArray(response.UserList)) return response.UserList;
    if (Array.isArray(response.userList)) return response.userList;
    if (Array.isArray(response.UserMasterList)) return response.UserMasterList;
    if (Array.isArray(response.userMasterList)) return response.userMasterList;
    if (Array.isArray(response.userMasterData)) return response.userMasterData;
    if (Array.isArray(response.UserMasterData)) return response.UserMasterData;
    if (response.Table && Array.isArray(response.Table)) return response.Table;
    if (response.table && Array.isArray(response.table)) return response.table;
    if (typeof response === 'object') {
        var keys = Object.keys(response);
        for (var i = 0; i < keys.length; i++) {
            var arr = response[keys[i]];
            if (!Array.isArray(arr) || !arr.length) continue;
            var first = arr[0];
            if (first && typeof first === 'object' && !Array.isArray(first)) {
                if ('userName' in first || 'UserName' in first || 'userID' in first || 'UserID' in first
                    || 'code' in first || 'Code' in first
                    || 'userMaster_Code' in first || 'UserMaster_Code' in first) {
                    return arr;
                }
            }
        }
    }
    return [];
}

function pickUserRowCode(u) {
    if (!u) return '';
    const v = u.Code ?? u.code
        ?? u.UserMaster_Code ?? u.userMaster_Code
        ?? u.ID ?? u.id
        ?? u.UserCode ?? u.userCode
        ?? u.EmployeeMaster_Code ?? u.employeeMaster_Code;
    if (v === null || v === undefined || v === '') return '';
    const s = String(v).trim();
    return s === '0' ? '' : s;
}

function pickUserDisplayName(u, val) {
    if (!u) return val || '';
    return u.UserName || u.userName
        || u.Name || u.name
        || u.FullName || u.fullName
        || u.UserID || u.userID
        || u.Email || u.email
        || val;
}

function bindGRNCheckUserSelect() {
    const $sel = $('#ddlGRNCheckUsers');
    if (!$sel.length) return;
    try { $sel.select2('destroy'); } catch (e) {}
    let opts = '';
    (G_UserList || []).forEach(function (u) {
        const val  = pickUserRowCode(u);
        if (!val) return;
        const text = pickUserDisplayName(u, val);
        opts += `<option value="${val}">${escHtml(text)}</option>`;
    });
    $sel.empty().append(opts);
    if (typeof $.fn.select2 === 'function') {
        try {
            $sel.select2({
                placeholder  : 'Select user(s)\u2026',
                allowClear   : true,
                width        : '100%',
                dropdownParent: $('#dvSubProjectModal')
            });
        } catch (e) {}
    }
}

function refreshGRNCheckSelectPreserveSelection() {
    const $sel = $('#ddlGRNCheckUsers');
    if (!$sel.length) return;
    let prev = [];
    try {
        prev = ($sel.val() || []).slice();
    } catch (e0) {}
    bindGRNCheckUserSelect();
    if (prev.length) {
        try {
            $sel.val(prev).trigger('change');
        } catch (e1) {}
    }
}

function loadUserListForSubProject() {
    return SubProjectMasterService.GetUserList()
        .then(function (response) {
            var list = normalizeUserListResponse(response);
            if (list.length) {
                G_UserList = list;
                bindGRNCheckUserSelect();
                return;
            }
            return UserMasterService.GetUserMasterList()
                .then(function (r2) {
                    G_UserList = normalizeUserListResponse(r2);
                    bindGRNCheckUserSelect();
                });
        });
}

function loadUserDropdown() {
    loadUserListForSubProject()
        .catch(function () {
            toastr.error('Error loading user list.');
        });
}

function grnCheckCodesFromRow(row) {
    if (!row) return '';
    var list = row.UserMasterForGRNDetails || row.userMasterForGRNDetails
        || row.UserMasterForGRN || row.userMasterForGRN;
    if (Array.isArray(list) && list.length) {
        var parts = [];
        list.forEach(function (g) {
            if (!g) return;
            var um = g.UserMaster_Code ?? g.userMaster_Code
                ?? g.UserMaster_Code_For_GRN ?? g.userMaster_Code_For_GRN;
            if (um != null && um !== '' && !isNaN(Number(um))) {
                parts.push(String(Number(um)));
                return;
            }
            var raw = g.UserMaster_Code_For_GRN || g.userMaster_Code_For_GRN || '';
            if (!raw) return;
            String(raw).split(',').forEach(function (p) {
                var t = p.trim();
                if (t) parts.push(t);
            });
        });
        if (parts.length) return parts.join(',');
    }
    return row.UserMaster_Code_For_GRN
        || row.userMaster_Code_For_GRN
        || row.GRNCheck
        || row.UserMaster_Codes_GRNCheck
        || row.userMaster_Codes_GRNCheck
        || '';
}

/** TVP TY_UserMasterFor_GRN columns: SubProjectMaster_Code, UserMaster_Code (C# must match). */
function buildUserMasterForGRNPayload() {
    const subProjectCode = parseInt($('#hfSubProjectCode').val() || '0', 10) || 0;
    const raw            = $('#ddlGRNCheckUsers').val();
    const codes          = Array.isArray(raw) ? raw : (raw != null && raw !== '' ? [raw] : []);
    const out            = [];
    codes.forEach(function (c) {
        const n = parseInt(String(c == null ? '' : c).trim(), 10);
        if (isNaN(n) || n <= 0) return;
        out.push({
            SubProjectMaster_Code: subProjectCode,
            UserMaster_Code:       n
        });
    });
    return out;
}

function userCodesCsvToDisplayNames(csv) {
    const codes = String(csv || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    if (!codes.length) return '—';
    const names = codes.map(function (c) {
        const u = (G_UserList || []).find(function (x) { return pickUserRowCode(x) === c; });
        return u ? pickUserDisplayName(u, c) : c;
    }).filter(Boolean);
    return names.join(', ') || '—';
}

function ensureUserListForSubProjectForm() {
    if (G_UserList && G_UserList.length > 0) {
        bindGRNCheckUserSelect();
        return Promise.resolve();
    }
    return loadUserListForSubProject();
}

/* ── Site Representative ─────────────────────────────────── */
function loadSiteRepDropdown(selectedCode) {
    PurchaseOrderStoreService.GetSiteRepresentativeList().then(function (data) {
        G_SiteRepList = data || [];
        populateSiteRepDropdown(selectedCode);
    }).catch(function () {
        G_SiteRepList = [];
        populateSiteRepDropdown(selectedCode);
    });
}

function populateSiteRepDropdown(selectedCode) {
    let opts = '<option value="">-- Select Site Representative --</option>';
    G_SiteRepList.forEach(function (r) {
        opts += '<option value="' + r.Code + '">' + escHtml(r.Name) + '</option>';
    });
    if ($('#frmDdlSiteRepSPM').data('select2')) $('#frmDdlSiteRepSPM').select2('destroy');
    $('#frmDdlSiteRepSPM').html(opts);
    if ($.fn.select2) {
        $('#frmDdlSiteRepSPM').select2({
            placeholder   : '-- Select Site Representative --',
            allowClear    : true,
            width         : '100%',
            dropdownParent: $('body')
        });
        $('#frmDdlSiteRepSPM').off('change.srepspm').on('change.srepspm', function () {
            showSiteRepDetailsSPM($(this).val());
        });
    }
    if (selectedCode) {
        $('#frmDdlSiteRepSPM').val(selectedCode).trigger('change');
    }
}

function showSiteRepDetailsSPM(code) {
    if (!code) { $('#divSiteRepDetailsSPM').hide(); return; }
    const rep = G_SiteRepList.find(function (r) { return String(r.Code) === String(code); });
    if (!rep) { $('#divSiteRepDetailsSPM').hide(); return; }
    $('#siteRepSPMName').text(rep.Name || '');
    $('#siteRepSPMMobile').text(rep.Mobile || rep.MobileNo || '');
    $('#siteRepSPMEmail').text(rep.Email || '');
    $('#divSiteRepDetailsSPM').show();
}

window.OpenAddSiteRepModalSPM = function () {
    const selectedCode = $('#frmDdlSiteRepSPM').val();
    const existingRep  = selectedCode
        ? G_SiteRepList.find(function (r) { return String(r.Code) === String(selectedCode); })
        : null;
    // Pre-fill with existing rep data so user can edit it; empty for a brand-new rep
    $('#hfSiteRepSPMCode').val(existingRep ? existingRep.Code : 0);
    $('#siteRepSPMTxtName').val(existingRep ? (existingRep.Name || '') : '');
    $('#siteRepSPMTxtMobile').val(existingRep ? (existingRep.Mobile || existingRep.MobileNo || '') : '');
    $('#siteRepSPMTxtEmail').val(existingRep ? (existingRep.Email || '') : '');
    const title = existingRep ? 'Edit Site Representative' : 'Add Site Representative';
    $('#modalAddSiteRepSPM .modal-title').html('<i class="fa fa-user-tie me-2"></i>' + title);
    $('#modalAddSiteRepSPM').modal('show');
};

window.SaveSiteRepresentativeSPM = function () {
    const name   = $('#siteRepSPMTxtName').val().trim();
    const mobile = $('#siteRepSPMTxtMobile').val().trim();
    const email  = $('#siteRepSPMTxtEmail').val().trim();
    const code   = parseInt($('#hfSiteRepSPMCode').val() || '0', 10) || 0;
    if (!name) { toastr.warning('Please enter Name.'); return; }
    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
        toastr.warning('Please enter a valid 10-digit Mobile No (starting with 6\u20139).');
        $('#siteRepSPMTxtMobile').focus();
        return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        toastr.warning('Please enter a valid Email address.');
        $('#siteRepSPMTxtEmail').focus();
        return;
    }
    const payload = JSON.stringify({ Code: code, siteRepresentatives: [{ Code: code, Name: name, MobileNo: mobile, Email: email }] });
    PurchaseOrderStoreService.SaveSiteRepresentative(payload).then(function (res) {
        if (res && res.Status === 'Y') {
            toastr.success(res.Msg || 'Site Representative saved.');
            $('#modalAddSiteRepSPM').modal('hide');
            const newCode = res.Code || res.NewCode || code || null;
            loadSiteRepDropdown(newCode);
        } else {
            toastr.error(res ? res.Msg : 'Failed to save Site Representative.');
        }
    }).catch(function (err) {
        toastr.error('Error saving Site Representative.');
        console.error(err);
    });
};

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
            const val  = pickUserRowCode(u);
            if (!val) return;
            const text = pickUserDisplayName(u, val);
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
            const val  = pickUserRowCode(u);
            if (!val) return;
            const text = pickUserDisplayName(u, val);
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
            var grnList  = Array.isArray(response[2]) ? response[2] : [];
            if (row && grnList.length) {
                row.UserMasterForGRNDetails = grnList;
            }
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

    if (row) {
        if (Array.isArray(response.UserMasterForGRNDetails)) {
            row.UserMasterForGRNDetails = response.UserMasterForGRNDetails;
        } else if (Array.isArray(response.userMasterForGRNDetails)) {
            row.UserMasterForGRNDetails = response.userMasterForGRNDetails;
        } else if (Array.isArray(row.UserMasterForGRNDetails)) {
            /* already on row */
        } else if (Array.isArray(row.userMasterForGRNDetails)) {
            row.UserMasterForGRNDetails = row.userMasterForGRNDetails;
        }
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
                var parsed       = parseSubProjectByCodeResponse(res);
                var row          = parsed.row;
                var levelDetails = parsed.levelDetails;

                if (!row) {
                    HideLoader && HideLoader();
                    toastr.warning('Sub Project not found.');
                    return;
                }

                ensureUserListForSubProjectForm()
                    .then(function () {
                        HideLoader && HideLoader();

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

                        const grnArr = String(grnCheckCodesFromRow(row) || '')
                            .split(',')
                            .map(function (x) { return x.trim(); })
                            .filter(Boolean);
                        try {
                            $('#ddlGRNCheckUsers').val(grnArr.length ? grnArr : null).trigger('change');
                        } catch (e) {}

                        // Set site representative
                        const siteRepCode = row.SiteRepresentativeMaster_Code || row.siteRepresentativeMaster_Code || null;
                        if (G_SiteRepList.length > 0) {
                            populateSiteRepDropdown(siteRepCode);
                        } else {
                            loadSiteRepDropdown(siteRepCode);
                        }

                        renderPOLevelsFormTable(levelDetails);
                        $('#spm-modal-title').text('Edit Sub Project');
                        showModal('dvSubProjectModal');
                    })
                    .catch(function () {
                        HideLoader && HideLoader();
                        toastr.error('Error loading user list.');
                    });
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
            // Site Representative
            const siteRepCode = row.SiteRepresentativeMaster_Code || row.siteRepresentativeMaster_Code || null;
            const siteRepObj  = siteRepCode ? (G_SiteRepList || []).find(function (r) { return String(r.Code) === String(siteRepCode); }) : null;
            $('#viewSiteRepresentative').text(siteRepObj ? siteRepObj.Name : '—');
            $('#viewGRNCheckUsers').text(userCodesCsvToDisplayNames(grnCheckCodesFromRow(row)));

            if (levelDetails.length > 0) {
                var tbl = '<table style="width:100%;border-collapse:collapse;font-size:12.5px;">';
                tbl += '<thead><tr>' +
                       '<th style="padding:5px 10px;background:#f1f5f9;border:1px solid #e2e8f0;font-weight:700;color:#475569;">Level</th>' +
                       '<th style="padding:5px 10px;background:#f1f5f9;border:1px solid #e2e8f0;font-weight:700;color:#475569;">Users</th>' +
                       '</tr></thead><tbody>';
                levelDetails.forEach(function (d) {
                    var codes = String(d.UserMaster_Codes_RightToVerifyPO || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
                    var names = codes.map(function (c) {
                        var u = (G_UserList || []).find(function (x) { return pickUserRowCode(x) === c; });
                        return u ? pickUserDisplayName(u, c) : c;
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
    try {
        $('#ddlGRNCheckUsers').val(null).trigger('change');
    } catch (e) {}
    // Reset site representative
    try {
        if ($('#frmDdlSiteRepSPM').data('select2')) $('#frmDdlSiteRepSPM').val(null).trigger('change');
        else $('#frmDdlSiteRepSPM').val('');
    } catch (e) {}
    $('#divSiteRepDetailsSPM').hide();
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

    const masterCodeNum = parseInt(masterCode, 10) || 0;
    const editingCode   = parseInt($('#hfSubProjectCode').val() || '0', 10) || 0;
    const parent        = (G_ProjectList || []).find(function (p) { return String(p.Code) === String(masterCodeNum); });
    if (parent) {
        const pBud = parseFloat(parent.Budget || parent.ProjectBudget || 0) || 0;
        const sBud = $('#txtBudget').val()
            ? parseFloat($('#txtBudget').val().toString().replace(/,/g, ''))
            : 0;

        // Sum of sub-project budgets must not exceed the parent project budget
        let sumOtherBud = 0;
        (G_SubProjectList || []).forEach(function (s) {
            if (String(s.ProjectMaster_Code || s.MasterProjectCode || 0) !== String(masterCodeNum)) return;
            if (editingCode > 0 && String(s.Code || 0) === String(editingCode)) return;
            sumOtherBud += parseFloat(s.Budget || s.SubProjectBudget || 0) || 0;
        });

        if (pBud > 0 && (sumOtherBud + sBud) > pBud) {
            toastr.warning(
                'Combined sub-project budgets cannot exceed parent project budget (₹ '
                    + Number(pBud).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    + '). Other sub-projects already total ₹ '
                    + Number(sumOtherBud).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    + '.'
            );
            $('#txtBudget').focus();
            return false;
        }

        // Sub-project dates must fall within the parent project date range.
        // No sum-of-days check — only start/end date boundary is enforced.
        // Use YYYY-MM-DD string comparison to avoid timezone/time-component issues.
        const subStartStr = ($('#txtStartDate').val() || '').trim();
        const subEndStr   = ($('#txtEstimatedDate').val() || '').trim();
        const pStartStr   = extractYMD(parent.ProjectStartDate);
        const pEndStr     = extractYMD(parent.EstimatedCompletionDate);

        if (pStartStr && subStartStr && subStartStr < pStartStr) {
            toastr.warning(
                'Sub-project start date (' + subStartStr
                    + ') cannot be before parent project start date (' + pStartStr + ').'
            );
            $('#txtStartDate').focus();
            return false;
        }

        if (pEndStr && subEndStr && subEndStr > pEndStr) {
            toastr.warning(
                'Sub-project end date (' + subEndStr
                    + ') cannot be after parent project end date (' + pEndStr + ').'
            );
            $('#txtEstimatedDate').focus();
            return false;
        }
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

function parseBomDetailRowsForSubSave(response) {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.Data)) return response.Data;
    if (response && Array.isArray(response.data)) return response.data;
    return [];
}

function sumBomAmountFromRows(rows) {
    var sum = 0;
    (rows || []).forEach(function (r) {
        sum += parseFloat(String(r.Amount || 0).replace(/,/g, '')) || 0;
    });
    return sum;
}

function callSaveSubProjectApi() {
    const code         = parseInt($('#hfSubProjectCode').val() || '0', 10) || 0;
    const startDateRaw = ($('#txtStartDate').val() || '').trim();
    const projectMaster_Code = parseInt($('#ddlMasterProject').val() || '0', 10) || 0;
    const newBudget = $('#txtBudget').val()
        ? parseFloat($('#txtBudget').val().toString().replace(/,/g, ''))
        : 0;

    const payload = {
        Code:                    code,
        ProjectMaster_Code:      projectMaster_Code,
        SubProjectDesp:          ($('#txtSubProjectName').val() || '').trim(),
        Budget:                  newBudget,
        ProjectStartDate:     startDateRaw || null,
        ProjectEstimatedDate: ($('#txtEstimatedDate').val() || '').trim() || null,
        EstimatedCompletionDays: $('#txtEstimatedDays').val()
                                     ? parseInt($('#txtEstimatedDays').val(), 10)
                                     : 0,
        SiteRepresentativeMaster_Code: parseInt($('#frmDdlSiteRepSPM').val()) || 0,
        UserMasterForGRNDetails: buildUserMasterForGRNPayload(),
        PurchaseOrderLevelsApprovalProjectUserDetails: collectPOLevelDetails()
    };

    function postSaveSubProject() {
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
                toastr.error((error && error.Msg));
            });
    }

    if (code > 0 && projectMaster_Code && BOMService && typeof BOMService.GetBOMByCode === 'function') {
        Showloader && Showloader();
        BOMService.GetBOMByCode(projectMaster_Code, code)
            .then(function (resp) {
                HideLoader && HideLoader();
                var bomSum = sumBomAmountFromRows(parseBomDetailRowsForSubSave(resp));
                if (bomSum > (newBudget || 0)) {
                    toastr.warning(
                        'Sub-project budget cannot be less than total BOM amount (₹ '
                            + Number(bomSum).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            + '). Reduce BOM amounts or lines first.'
                    );
                    $('#txtBudget').focus();
                    return;
                }
                postSaveSubProject();
            })
            .catch(function () {
                HideLoader && HideLoader();
                postSaveSubProject();
            });
    } else {
        postSaveSubProject();
    }
}

/* ── Load & bind grid ────────────────────────────────────── */
function loadSubProjects() {
    Showloader && Showloader();

    SubProjectMasterService.GetSubProjectList()
        .then(function (response) {
            HideLoader && HideLoader();
            // Handle array or wrapped response (Data, data, SubProjectList, etc.)
            var list = Array.isArray(response) ? response
                : (response && Array.isArray(response.Data) ? response.Data : null)
                || (response && Array.isArray(response.data) ? response.data : null)
                || (response && Array.isArray(response.SubProjectList) ? response.SubProjectList : null)
                || [];
            G_SubProjectList = list;
            updateStats(G_SubProjectList);
            applySubProjectFilters();
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            G_SubProjectList = [];
            updateStats([]);
            applySubProjectFilters();
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

function sumSubProjectListBudget(list) {
    let sum = 0;
    (list || []).forEach(function (x) {
        sum += parseFloat(x.Budget || x.SubProjectBudget || 0) || 0;
    });
    return sum;
}

function sumSubProjectListEstDays(list) {
    let sum = 0;
    (list || []).forEach(function (x) {
        sum += parseInt(x.EstimatedCompletionDays || x.EstimatedDays || 0, 10) || 0;
    });
    return sum;
}

function formatSubProjectTotalBudgetInr(sum) {
    return '₹ ' + Number(sum).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateSubProjectVisibleBudgetTotals(list) {
    const txt = formatSubProjectTotalBudgetInr(sumSubProjectListBudget(list));
    $('#subProjectTableBudgetTotal').text(txt);
    $('#statTotalBudget').text(txt);
    const daysTotal = sumSubProjectListEstDays(list);
    $('#subProjectTableEstDaysTotal').text(daysTotal + ' days');
}

function bindSubProjectGrid(list) {
    const $tbody = $('#tblSubProject tbody');
    $tbody.empty();

    if (!list || list.length === 0) {
        $tbody.append(`
            <tr>
                <td colspan="8">
                    <div class="pm-empty">
                        <div class="pm-empty-icon"><i class="fas fa-folder-open"></i></div>
                        <div class="pm-empty-title">No Sub Projects Found</div>
                        <div class="pm-empty-sub">Click "New Sub Project" to create your first sub project.</div>
                    </div>
                </td>
            </tr>`);
        updateSubProjectVisibleBudgetTotals([]);
        return;
    }

    list.forEach(function (item, index) {
        const code            = item.Code || 0;
        const masterCode      = item.ProjectMaster_Code || item.MasterProjectCode || '';
        // Prefer master name from API response (when JOIN returns it); fallback to G_ProjectList lookup
        const apiMasterName   = item.MasterProjectDesp || item.MasterProjectName || item.ProjectDesp || '';
        const master          = G_ProjectList.find(p => String(p.Code) === String(masterCode));
        const lookupMasterName = master ? (master.ProjectDesp || master.ProjectName || master.ProjectCode || '') : '';
        const masterName      = (apiMasterName && String(apiMasterName).trim()) || lookupMasterName || '—';
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

    updateSubProjectVisibleBudgetTotals(list);
}

/* ── Apply status + search filters and bind grid ──────────── */
function applySubProjectFilters() {
    const query = ($('#spmSearch').val() || '').toLowerCase().trim();
    let list   = G_SubProjectList;

    // Status filter (from card click)
    if (G_ActiveStatusFilter === 'running') {
        list = list.filter(function (x) { return String(x.Verify || '').toUpperCase() === 'Y'; });
    } else if (G_ActiveStatusFilter === 'pending') {
        list = list.filter(function (x) { return String(x.Verify || '').toUpperCase() === 'N'; });
    }

    // Search filter
    if (query) {
        list = list.filter(function (item) {
            const name       = (item.SubProjectDesp || item.SubProjectName || '').toLowerCase();
            const apiMaster  = (item.MasterProjectDesp || item.MasterProjectName || item.ProjectDesp || '').toLowerCase();
            const masterCode = item.ProjectMaster_Code || item.MasterProjectCode || '';
            const master     = G_ProjectList.find(p => String(p.Code) === String(masterCode));
            const lookupMaster = master ? (master.ProjectDesp || master.ProjectName || '').toLowerCase() : '';
            const masterName = apiMaster || lookupMaster;
            return name.includes(query) || masterName.includes(query);
        });
    }

    bindSubProjectGrid(list);
}

/* ── Client-side search (legacy, now delegates to apply) ─── */
function filterSubProjects(query) {
    applySubProjectFilters();
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
window.viewSubProject            = viewSubProject;
window.SubProjectMaster_EditData = SubProjectMaster_EditData;
window.DeleteSubProject          = DeleteSubProject;
