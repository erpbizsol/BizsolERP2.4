import { UserMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_UserMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { UrlService } from '../../Bizsol.WebERP.UI.Shared/js/URL.js';

var U_EditCode = 0;
var U_ViewCode = 0;
var U_EditRow  = null;

/** Loaded sub-projects for multi-select (GetSubProjectMasterList?CompanyCode=… → Code, SubProjectDesp). */
var G_UserMasterSubProjectList = [];
/** Subproject codes to apply after form modal is visible (Select2 in backdrop). */
var G_UserModalSubProjectPendingCodes = null;

function escHtmlUm(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* ─── Auth helper ─── */
function getUserCode() {
    try {
        var auth = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        var c = parseInt(auth.UserMaster_Code, 10);
        return isNaN(c) ? 0 : c;
    } catch (e) { return 0; }
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    GetUserMasterList();
    LoadDropdowns();

    $('#btnModalClose, #btnCancelUser').on('click', CloseForm);
    $('#btnCancelDelete').on('click', function () { $('#deleteConfirmBackdrop').removeClass('show'); });

    /* Live validation */
    $('#txtUserID').on('input', function () {
        if ($(this).val().trim()) { $(this).removeClass('im-input-error'); $('#err_UserID').hide(); }
    });
    $('#txtUserName').on('input', function () {
        if ($(this).val().trim()) { $(this).removeClass('im-input-error'); $('#err_UserName').hide(); }
    });
    $('#txtPassword').on('input', function () {
        if ($(this).val().trim()) { $(this).removeClass('im-input-error'); $('#err_Password').hide(); }
        ValidatePasswordMatch();
    });
    $('#txtConfirmPassword').on('input', ValidatePasswordMatch);

    /* Subprojects are per company: reload list when default company changes (manual change clears selection). */
    $('#ddlDefaultCompany').on('change', function () {
        var cc = String($(this).val() || '').trim();
        G_UserModalSubProjectPendingCodes = null;
        resetUserSubProjectDropdownToEmpty();
        loadSubProjectsForUserMaster(cc);
    });

    /* Status radio visual sync */
    $('input[name="rdoStatus"]').on('change', function () {
        SetStatus($(this).val());
    });
});

/* ══════════════════════════════════════════
   SUBPROJECT MULTI (Select2 — same pattern as Sub Project GRN Check)
══════════════════════════════════════════ */
function tryParseJsonIfString(val) {
    if (typeof val !== 'string') return val;
    var s = val.trim();
    if (!s || (s[0] !== '[' && s[0] !== '{')) return val;
    try {
        return JSON.parse(s);
    } catch (e) {
        return val;
    }
}

function rowLooksLikeSubProjectMasterRow(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
    return ('Code' in o) || ('code' in o)
        || ('SubProjectMaster_Code' in o) || ('subProjectMaster_Code' in o)
        || ('SubProjectDesp' in o) || ('subProjectDesp' in o);
}

function normalizeSubProjectMasterListResponse(res) {
    if (!res) return [];
    res = tryParseJsonIfString(res);
    if (Array.isArray(res)) return res;
    /* ASP.NET often wraps list in Data / value (string or object) */
    if (res.Data != null) {
        var d = tryParseJsonIfString(res.Data);
        if (Array.isArray(d)) return d;
        if (d && typeof d === 'object' && !Array.isArray(d)) {
            var inner = normalizeSubProjectMasterListResponse(d);
            if (inner.length) return inner;
        }
    }
    if (res.data != null) {
        var d2 = tryParseJsonIfString(res.data);
        if (Array.isArray(d2)) return d2;
        if (d2 && typeof d2 === 'object' && !Array.isArray(d2)) {
            var inner2 = normalizeSubProjectMasterListResponse(d2);
            if (inner2.length) return inner2;
        }
    }
    if (Array.isArray(res.SubProjectList)) return res.SubProjectList;
    if (Array.isArray(res.subProjectList)) return res.subProjectList;
    if (Array.isArray(res.Table)) return res.Table;
    if (Array.isArray(res.table)) return res.table;
    if (Array.isArray(res.Result)) return res.Result;
    if (Array.isArray(res.result)) return res.result;
    if (Array.isArray(res.value)) return res.value;
    if (Array.isArray(res.Value)) return res.Value;
    /* Nested wrapper e.g. { Data: { Table: [...] } } */
    if (res.Data && typeof res.Data === 'object' && !Array.isArray(res.Data)) {
        var nested = normalizeSubProjectMasterListResponse(res.Data);
        if (nested.length) return nested;
    }
    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
        var nested2 = normalizeSubProjectMasterListResponse(res.data);
        if (nested2.length) return nested2;
    }
    /* First array-of-objects that looks like Code + SubProjectDesp rows */
    if (typeof res === 'object') {
        var keys = Object.keys(res);
        for (var i = 0; i < keys.length; i++) {
            var arr = res[keys[i]];
            if (!Array.isArray(arr) || !arr.length) continue;
            var first = arr[0];
            if (rowLooksLikeSubProjectMasterRow(first)) return arr;
        }
    }
    return [];
}

/**
 * Subproject multi-select: GET …/UserMaster/GetSubProjectMasterList?CompanyCode=… (SQL: Code, SubProjectDesp).
 * Uses plain $.ajax GET (no application/json body) — same pattern as GetGroupMasterList; avoids servers that reject GET+JSON content-type from promiseAjaxCallApi.
 * @param {string|number} companyCode Company master Code from ddlDefaultCompany; empty clears the list.
 */
function loadSubProjectsForUserMaster(companyCode) {
    var cc = companyCode != null && companyCode !== '' ? String(companyCode).trim() : '';
    if (!cc) {
        G_UserMasterSubProjectList = [];
        scheduleSubProjectSelectAfterModalOpen();
        return;
    }
    var url = UrlService.API_ENDPOINT_USERMASTER + '/GetSubProjectMasterList?CompanyCode=' + encodeURIComponent(cc);
    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        success: function (response) {
            G_UserMasterSubProjectList = normalizeSubProjectMasterListResponse(response);
            scheduleSubProjectSelectAfterModalOpen();
        },
        error: function () {
            G_UserMasterSubProjectList = [];
            toastr.error('Failed to load subproject list.');
            scheduleSubProjectSelectAfterModalOpen();
        }
    });
}

/**
 * GetSubProjectMasterList / GETSUBPROJECT row shape from SQL:
 *   SELECT Code, SubProjectDesp FROM …SubProjectMaster
 * API JSON: PascalCase (Code, SubProjectDesp) or camelCase (code, subProjectDesp).
 */
function pickSubProjectRowCode(sp) {
    if (!sp) return '';
    var v = sp.Code != null ? sp.Code : sp.code;
    if (v === null || v === undefined || v === '') return '';
    var s = String(v).trim();
    return s === '0' ? '' : s;
}

function pickSubProjectDisplayName(sp) {
    if (!sp) return '';
    var t = sp.SubProjectDesp != null ? sp.SubProjectDesp : sp.subProjectDesp;
    t = (t != null && String(t).trim() !== '') ? String(t).trim() : '';
    if (t) return t;
    return pickSubProjectRowCode(sp) || '';
}

/** Tear down Select2 and options — no API; use until a company is chosen. */
function resetUserSubProjectDropdownToEmpty() {
    var $sel = $('#ddlUserSubProjects');
    if (!$sel.length) return;
    try { $sel.select2('destroy'); } catch (e) { }
    $sel.empty();
}

function bindUserSubProjectSelect() {
    var $sel = $('#ddlUserSubProjects');
    if (!$sel.length) return;
    try { $sel.select2('destroy'); } catch (e) { }
    var opts = '';
    (G_UserMasterSubProjectList || []).forEach(function (sp) {
        /* <option value="Code">SubProjectDesp</option> — only these two columns from SP */
        var val = pickSubProjectRowCode(sp);
        if (!val) return;
        var text = pickSubProjectDisplayName(sp);
        opts += '<option value="' + escHtmlUm(val) + '">' + escHtmlUm(text) + '</option>';
    });
    $sel.empty().append(opts);
    if (typeof $.fn.select2 === 'function') {
        try {
            $sel.select2({
                placeholder: 'Select subproject(s)…',
                allowClear: true,
                width: '100%',
                dropdownParent: $('#userDialogBackdrop')
            });
        } catch (e2) { }
    }
}

function refreshUserSubProjectSelectPreserveSelection() {
    var $sel = $('#ddlUserSubProjects');
    if (!$sel.length) return;
    var prev = [];
    try {
        var rawVal = $sel.val();
        prev = Array.isArray(rawVal)
            ? rawVal.slice()
            : (rawVal != null && rawVal !== '' ? [String(rawVal)] : []);
    } catch (e0) { }
    bindUserSubProjectSelect();
    if (prev.length) {
        try {
            $sel.val(prev).trigger('change');
        } catch (e1) { }
    }
}

function applyPendingUserSubProjectsIfAny() {
    if (!G_UserModalSubProjectPendingCodes || !G_UserModalSubProjectPendingCodes.length) return;
    var $sel = $('#ddlUserSubProjects');
    if (!$sel.length) {
        G_UserModalSubProjectPendingCodes = null;
        return;
    }
    try {
        $sel.val(G_UserModalSubProjectPendingCodes).trigger('change');
    } catch (e) { }
    G_UserModalSubProjectPendingCodes = null;
}

function scheduleSubProjectSelectAfterModalOpen() {
    setTimeout(function () {
        refreshUserSubProjectSelectPreserveSelection();
        applyPendingUserSubProjectsIfAny();
    }, 160);
}

/** Second SHOWDATA / GRN-user-detail row shape from API. */
function rowLooksLikeSubProjectUserDetailRow(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
    if ('SubProjectMaster_Code' in o || 'subProjectMaster_Code' in o) return true;
    var desp = o.SubProjectDesp != null ? o.SubProjectDesp : o.subProjectDesp;
    if (desp != null && String(desp).trim() !== '') {
        var c = o.Code != null ? o.Code : o.code;
        return c != null && String(c).trim() !== '' && !isNaN(Number(c));
    }
    return false;
}

function pickSubProjectDetailsArrayFromResponseObject(obj) {
    if (!obj || typeof obj !== 'object') return null;
    var keys = [
        'SubProjectMasterDetails', 'subProjectMasterDetails',
        'SubProjectMasterGRNUserDetails', 'subProjectMasterGRNUserDetails',
        'UserSubProjectDetails', 'userSubProjectDetails',
        'UserMasterSubProjectDetails', 'userMasterSubProjectDetails',
        'SubProjectDetails', 'subProjectDetails'
    ];
    for (var i = 0; i < keys.length; i++) {
        var v = tryParseJsonIfString(obj[keys[i]]);
        if (!v) continue;
        if (Array.isArray(v) && v.length && rowLooksLikeSubProjectUserDetailRow(v[0])) return v;
        if (v && typeof v === 'object' && !Array.isArray(v) && rowLooksLikeSubProjectUserDetailRow(v)) return [v];
    }
    var t1 = obj.Table1 != null ? obj.Table1 : obj.table1;
    t1 = tryParseJsonIfString(t1);
    if (Array.isArray(t1) && t1.length && rowLooksLikeSubProjectUserDetailRow(t1[0])) return t1;
    return null;
}

/** True if object looks like a UserMaster row (not a subproject-only row). */
function isUserMasterRowShape(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
    if (o.UserID != null && String(o.UserID).trim() !== '') return true;
    if (o.UserName != null && String(o.UserName).trim() !== '') return true;
    if (o.Code != null && o.GroupMaster_Code != null && o.FixedParameter_Code != null) return true;
    return false;
}

/**
 * API shape from multi-result-set: [ [ userRow ], [ subProjectRow, ... ] ].
 * Previously pickEntity returned only the first inner array, so the form never bound.
 */
function pickEntityFromNestedTableArray(outer) {
    if (!Array.isArray(outer) || outer.length < 1) return null;
    var pack0 = outer[0];
    if (!Array.isArray(pack0) || !pack0.length) return null;
    var user = pack0[0];
    if (!isUserMasterRowShape(user)) return null;
    if (outer.length < 2) return user;
    var pack1 = outer[1];
    if (!Array.isArray(pack1) || !pack1.length || !rowLooksLikeSubProjectUserDetailRow(pack1[0])) return user;
    return Object.assign({}, user, { SubProjectMasterDetails: pack1 });
}

/** Attach subproject rows when API returns them beside UserMasterList / on outer wrapper. */
function mergeUserRowWithDetailsFromGetByCodeResponse(userRow, response) {
    if (!userRow || !response || typeof response !== 'object') return userRow;
    if (Array.isArray(response)) {
        var nestedUser = pickEntityFromNestedTableArray(response);
        if (nestedUser && nestedUser.SubProjectMasterDetails && nestedUser.SubProjectMasterDetails.length)
            return Object.assign({}, userRow, { SubProjectMasterDetails: nestedUser.SubProjectMasterDetails });
    }
    var layers = [response];
    var inner = response.Data != null ? response.Data : response.data;
    inner = tryParseJsonIfString(inner);
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) layers.push(inner);
    if (inner && Array.isArray(inner)) {
        var fromArr = pickEntityFromNestedTableArray(inner);
        if (fromArr && fromArr.SubProjectMasterDetails && fromArr.SubProjectMasterDetails.length)
            return Object.assign({}, userRow, { SubProjectMasterDetails: fromArr.SubProjectMasterDetails });
    }
    for (var li = 0; li < layers.length; li++) {
        var arr = pickSubProjectDetailsArrayFromResponseObject(layers[li]);
        if (arr && arr.length) return Object.assign({}, userRow, { SubProjectMasterDetails: arr });
    }
    return userRow;
}

function subProjectCodesArrayFromUserRow(row) {
    if (!row) return [];
    var parts = [];
    var seen = Object.create(null);
    function pushCode(t) {
        if (t == null || t === '') return;
        var s = String(t).trim();
        if (!s) return;
        if (!isNaN(Number(s)) && s !== '') s = String(Number(s));
        if (seen[s]) return;
        seen[s] = 1;
        parts.push(s);
    }
    function addFromCsv(csv) {
        String(csv || '').split(',').forEach(function (p) { pushCode(p); });
    }
    var list = row.SubProjectMasterDetails || row.subProjectMasterDetails
        || row.UserSubProjectDetails || row.userSubProjectDetails
        || row.UserMasterSubProjectDetails || row.userMasterSubProjectDetails;
    if (list && !Array.isArray(list)) list = [list];
    if (Array.isArray(list) && list.length) {
        list.forEach(function (x) {
            if (!x) return;
            var sp = x.SubProjectMaster_Code != null ? x.SubProjectMaster_Code : x.subProjectMaster_Code;
            if (sp == null || String(sp).trim() === '' || isNaN(Number(sp))) {
                var hasDesp = (x.SubProjectDesp != null && String(x.SubProjectDesp).trim() !== '')
                    || (x.subProjectDesp != null && String(x.subProjectDesp).trim() !== '');
                if (hasDesp) {
                    var c = x.Code != null ? x.Code : x.code;
                    if (c != null && String(c).trim() !== '' && !isNaN(Number(c))) sp = c;
                }
            }
            if (sp != null && String(sp).trim() !== '' && !isNaN(Number(sp))) {
                pushCode(String(Number(sp)));
                return;
            }
            addFromCsv(x.SubProjectMaster_Codes || x.subProjectMaster_Codes || '');
        });
    }
    addFromCsv(row.SubProjectMaster_Codes || row.subProjectMaster_Codes);
    addFromCsv(row.SubProjectCodes || row.subProjectCodes);
    return parts;
}

/** tblUserMaster.SubProjectMasterDetails — TY_SubProjectMasterFor_GRN: SubProjectMaster_Code, UserMaster_Code */
function buildSubProjectMasterDetailsPayload() {
    var userCode = U_EditCode > 0 ? parseInt(U_EditCode, 10) : 0;
    var raw = $('#ddlUserSubProjects').val();
    var codes = Array.isArray(raw) ? raw : (raw != null && raw !== '' ? [raw] : []);
    var out = [];
    codes.forEach(function (c) {
        var n = parseInt(String(c == null ? '' : c).trim(), 10);
        if (isNaN(n) || n <= 0) return;
        out.push({
            SubProjectMaster_Code: n,
            UserMaster_Code: userCode
        });
    });
    return out;
}

function subProjectNamesDisplayFromCodes(arr) {
    if (!arr || !arr.length) return '—';
    var names = arr.map(function (c) {
        var sp = (G_UserMasterSubProjectList || []).find(function (x) {
            return pickSubProjectRowCode(x) === String(c);
        });
        return sp ? pickSubProjectDisplayName(sp) : String(c);
    }).filter(Boolean);
    return names.length ? names.join(', ') : '—';
}

/* ══════════════════════════════════════════
   LOAD LIST
══════════════════════════════════════════ */
function GetUserMasterList() {
    UserMasterService.GetUserMasterList().then(function (response) {
        var rows = [];
        if (Array.isArray(response))             rows = response;
        else if (Array.isArray(response.data))   rows = response.data;
        else if (Array.isArray(response.Data))   rows = response.Data;

        if (rows.length === 0) {
            toastr.warning('No users found. Add your first user.');
            $('#tblUserMaster').hide();
            return;
        }

        $('#tblUserMaster').show();
        var StringFilterColumn  = ['UserID', 'UserName', 'GroupName', 'Email', 'Mobile', 'Status'];
        var NumericFilterColumn = [];
        var DateFilterColumn    = [];
        var hiddenColumns       = ['Code'];
        var ColumnAlignment     = { Action: 'center;width:118px;' };

        var updatedResponse = rows.map(function (item) {
            var row  = Object.assign({}, item);
            var code = row.Code != null ? row.Code : 0;

            row.Action =
                '<button class="im-btn-view"   title="View"   onclick="ViewUser('    + code + ')"><i class="fas fa-eye"></i></button>' +
                '<button class="im-btn-edit"   title="Edit"   onclick="EditUser('    + code + ')"><i class="fas fa-pen"></i></button>' +
                '<button class="im-btn-delete" title="Delete" onclick="ConfirmDelete(' + code + ')"><i class="fas fa-trash-can"></i></button>';
            return row;
        });

        BizsolCustomFilterGrid.CreateDataTable(
            'UserMaster-header', 'UserMaster-body',
            updatedResponse, false, [],
            StringFilterColumn, NumericFilterColumn, DateFilterColumn,
            [], hiddenColumns, ColumnAlignment
        );
    }).catch(function () {
        toastr.error('Failed to load user list.');
    });
}

/* ══════════════════════════════════════════
   LOAD DROPDOWNS
══════════════════════════════════════════ */
function LoadDropdowns() {
    /* Group Name */
    $.ajax({
        url: UrlService.API_ENDPOINT_USERMASTER + '/GetGroupMasterList',
        type: 'GET',
        success: function (res) {
            var groups = Array.isArray(res) ? res : (res.data || res.Data || []);
            var $ddl = $('#ddlGroupName').empty().append('<option value="">— Select Group —</option>');
            groups.forEach(function (g) {
                $ddl.append($('<option>').val(g.Code).text(g.GroupName));
            });
        }
    });

    /* Default Company */
    $.ajax({
        url: UrlService.API_ENDPOINT_USERMASTER + '/GetCompanyMasterList',
        type: 'GET',
        success: function (res) {
            var companies = Array.isArray(res) ? res : (res.data || res.Data || []);
            var $ddl = $('#ddlDefaultCompany').empty().append('<option value="">— Select Company —</option>');
            companies.forEach(function (c) {
                $ddl.append($('<option>').val(c.Code).text(c.CompanyName));
            });
        }
    });

    /* Subprojects load when user picks default company (see #ddlDefaultCompany change). */
}

/* ══════════════════════════════════════════
   OPEN NEW
══════════════════════════════════════════ */
function OpenNewUser() {
    U_EditCode = 0;
    U_EditRow = null;
    ClearForm();
    $('#formModalTitle').text('Add New User');
    $('#btnSaveText').text('Save User');
    $('#userDialogBackdrop').addClass('show');
    /* Subproject list + Select2 only after user picks Default Company (change → loadSubProjects…). */
    setTimeout(function () { $('#txtUserID').focus(); }, 140);
}

/* ══════════════════════════════════════════
   EDIT
══════════════════════════════════════════ */
function EditUser(code) {
    U_EditCode = code;
    ClearForm();
    $('#formModalTitle').text('Edit User');
    $('#btnSaveText').text('Update User');

    UserMasterService.GetUserMasterByCode(code).then(function (res) {
        var row = pickEntity(res);
        if (!row) { toastr.error('Failed to load user data.'); return; }
        row = mergeUserRowWithDetailsFromGetByCodeResponse(row, res);
        PopulateForm(row);
        U_EditRow = Object.assign({}, row);
        var companyCode = String($('#ddlDefaultCompany').val() || '').trim();
        loadSubProjectsForUserMaster(companyCode);
        $('#userDialogBackdrop').addClass('show');
    }).catch(function () { toastr.error('Error loading user. Please try again.'); });
}

/* ══════════════════════════════════════════
   VIEW
══════════════════════════════════════════ */
function ViewUser(code) {
    U_ViewCode = code;
    UserMasterService.GetUserMasterByCode(code).then(function (res) {
        var row = pickEntity(res);
        if (!row) { toastr.error('Failed to load user details.'); return; }
        row = mergeUserRowWithDetailsFromGetByCodeResponse(row, res);
        PopulateViewModal(row);
        $('#viewUserBackdrop').addClass('show');
    }).catch(function () { toastr.error('Error loading user details.'); });
}

function PopulateViewModal(d) {
    $('#viewUserCode').text(d.Code || '—');
    $('#viewUserName').text(d.UserName || '—');
    $('#vf_UserID').text(d.UserID || '—');
    $('#vf_UserIDVal').text(d.UserID || '—');
    $('#vf_UserName').text(d.UserName || '—');
    $('#vf_MobileNo').text(d.UserMobileNo || '—');
    $('#vf_Group').text(d.GroupName || '—');
    $('#vf_GroupLabel').text(d.GroupName || '—');
    $('#vf_Company').text(d.DefaultCompanyName || '—');
    $('#vf_SubProjects').text(subProjectNamesDisplayFromCodes(subProjectCodesArrayFromUserRow(d)));

    /* Status badge */
    var isActive = d.Status === 'A';
    $('#vf_StatusBadge')
        .removeClass('badge-active badge-inactive')
        .addClass(isActive ? 'badge-active' : 'badge-inactive')
        .html('<i class="fas fa-' + (isActive ? 'circle-check' : 'circle-xmark') + '" style="margin-right:4px;"></i>' + (isActive ? 'Active' : 'Inactive'));

    if (d.GroupName) $('#vf_GroupBadge').show(); else $('#vf_GroupBadge').hide();

    if (d.PhotoPath) {
        $('#viewAvatarImg').attr('src', d.PhotoPath).show();
        $('#viewAvatarIcon').hide();
    } else {
        $('#viewAvatarImg').hide();
        $('#viewAvatarIcon').show();
    }
}

function CloseViewModal() {
    U_ViewCode = 0;
    $('#viewUserBackdrop').removeClass('show');
}

function EditFromView() {
    var codeToEdit = U_ViewCode;
    CloseViewModal();
    EditUser(codeToEdit);
}

/* ══════════════════════════════════════════
   SAVE
══════════════════════════════════════════ */
function SaveUser() {
    if (!ValidateForm()) return;

    var isEdit  = U_EditCode > 0;
    var payload = BuildPayload();
    var $btn    = $('#btnSaveUser');
    var origText = $('#btnSaveText').text();
    $btn.prop('disabled', true);
    $('#btnSaveText').text(isEdit ? 'Updating…' : 'Saving…');

    UserMasterService.SaveUserMaster(payload).then(function (raw) {
        var response = unwrapStandardApiBody(raw);
        if (apiSuccessY(response)) {
            CloseForm();
            GetUserMasterList();
            ShowSuccessModal(
                isEdit ? 'Updated Successfully!' : 'Saved Successfully!',
                coalesceApiMessage(response, 'User has been saved.'),
                isEdit ? 'fa-pen-to-square' : 'fa-circle-check'
            );
        } else {
            var failMsg = isEdit ? 'Failed to update user.' : 'Failed to save user.';
            toastr.error(coalesceApiMessage(response, failMsg));
        }
    }).catch(function () {
        toastr.error('An error occurred. Please try again.');
    }).finally(function () {
        $btn.prop('disabled', false);
        $('#btnSaveText').text(origText);
    });
}

function BuildPayload() {
    var statusVal = $('input[name="rdoStatus"]:checked').val();
    var statusChar = statusVal === 'Active' ? 'A' : 'C';
    var companyKey = parseInt($('#ddlDefaultCompany').val(), 10) || 0;
    var sessionUser = getUserCode();
    var codeVal = U_EditCode > 0 ? parseInt(U_EditCode, 10) : 0;
    var row = {
        Code:                   codeVal,
        UserID:                 $('#txtUserID').val().trim(),
        UserName:               $('#txtUserName').val().trim(),
        Password:               $('#txtPassword').val().trim(),
        GroupMaster_Code:       parseInt($('#ddlGroupName').val()) || 0,
        FixedParameter_Code:    companyKey,
        IsBizSolUser:           $('#chkBizsolUser').prop('checked') ? 'Y' : 'N',
        UserMobileNo:           $('#txtMobileNo').val(),
        Status:                 statusChar,
        Statuss:                statusChar,
        UserCode:               sessionUser,
        SubProjectMasterDetails: buildSubProjectMasterDetailsPayload(),
    };

    if (U_EditRow) {
        row = Object.assign({}, U_EditRow, row);
    }

    /* Never let stale GET row override form / session (SP @CompanyCode / @DBName / TVP / audit). */
    row.Code = codeVal;
    row.UserID = $('#txtUserID').val().trim();
    row.UserName = $('#txtUserName').val().trim();
    row.Password = $('#txtPassword').val().trim();
    row.GroupMaster_Code = parseInt($('#ddlGroupName').val()) || 0;
    row.FixedParameter_Code = companyKey;
    row.CompanyCode = companyKey;
    row.IsBizSolUser = $('#chkBizsolUser').prop('checked') ? 'Y' : 'N';
    row.UserMobileNo = $('#txtMobileNo').val();
    row.Status = statusChar;
    row.Statuss = statusChar;
    row.UserCode = sessionUser;
    row.UserMaster_Code = sessionUser;
    row.SubProjectMasterDetails = buildSubProjectMasterDetailsPayload();

    return row;
}

/* ══════════════════════════════════════════
   DELETE
══════════════════════════════════════════ */
function ConfirmDelete(code) {
    U_EditCode = code;
    $('#reasonForDeleteInput').val('');
    $('#deleteConfirmBackdrop').addClass('show');
    setTimeout(function () { $('#reasonForDeleteInput').focus(); }, 150);
}

function DoDelete() {
    var reason = $('#reasonForDeleteInput').val();
    if (!reason) { toastr.warning('Please provide a reason for delete.'); $('#reasonForDeleteInput').focus(); return; }

    UserMasterService.DeleteUserMaster(U_EditCode, reason).then(function (raw) {
        var res = unwrapStandardApiBody(raw);
        $('#deleteConfirmBackdrop').removeClass('show');
        if (apiSuccessY(res)) {
            GetUserMasterList();
            ShowSuccessModal('Deleted Successfully!', coalesceApiMessage(res, 'The user has been removed.'), 'fa-trash-can');
        } else {
            toastr.error(coalesceApiMessage(res, 'Failed to delete user.'));
        }
    }).catch(function () {
        toastr.error('Failed to delete user.');
        $('#deleteConfirmBackdrop').removeClass('show');
    });
}

/* ══════════════════════════════════════════
   VALIDATE
══════════════════════════════════════════ */
function ValidateForm() {
    var valid = true;

    if (!$('#txtUserID').val().trim()) {
        $('#txtUserID').addClass('im-input-error');
        $('#err_UserID').css('display', 'flex');
        $('#txtUserID').focus();
        valid = false;
    } else {
        $('#txtUserID').removeClass('im-input-error');
        $('#err_UserID').hide();
    }

    if (!$('#txtUserName').val().trim()) {
        $('#txtUserName').addClass('im-input-error');
        $('#err_UserName').css('display', 'flex');
        if (valid) $('#txtUserName').focus();
        valid = false;
    } else {
        $('#txtUserName').removeClass('im-input-error');
        $('#err_UserName').hide();
    }

    if (U_EditCode === 0 && !$('#txtPassword').val().trim()) {
        $('#txtPassword').addClass('im-input-error');
        $('#err_Password').css('display', 'flex');
        if (valid) $('#txtPassword').focus();
        valid = false;
    }

    if ($('#txtPassword').val() && $('#txtPassword').val() !== $('#txtConfirmPassword').val()) {
        $('#txtConfirmPassword').addClass('im-input-error');
        $('#err_ConfirmPassword').css('display', 'flex');
        valid = false;
    } else {
        $('#txtConfirmPassword').removeClass('im-input-error');
        $('#err_ConfirmPassword').hide();
    }

    if (!$('#ddlGroupName').val()) {
        $('#ddlGroupName').addClass('im-input-error');
        $('#err_GroupName').css('display', 'flex');
        if (valid) $('#ddlGroupName').focus();
        valid = false;
    } else {
        $('#ddlGroupName').removeClass('im-input-error');
        $('#err_GroupName').hide();
    }

    if (!valid) toastr.warning('Please fill all required fields correctly.');
    return valid;
}

/* ══════════════════════════════════════════
   FORM HELPERS
══════════════════════════════════════════ */
function PopulateForm(d) {
    /* Clear fields only — do not clear U_EditRow / U_EditCode (EditUser sets row after PopulateForm). */
    clearUserFormFieldsOnly();
    $('#txtUserID').val(d.UserID || '');
    $('#txtUserName').val(d.UserName || '');
    $('#txtMobileNo').val(d.UserMobileNo || '');
    $('#ddlGroupName').val(d.GroupMaster_Code != null && d.GroupMaster_Code !== '' ? String(d.GroupMaster_Code) : '');
    $('#txtPassword').val('');
    $('#ddlDefaultCompany').val(d.FixedParameter_Code != null && d.FixedParameter_Code !== '' ? String(d.FixedParameter_Code) : '');
    $('#chkBizsolUser').prop('checked', d.IsBizSolUser === 'Y');
    SetStatus(d.Status === 'A' ? 'Active' : 'Inactive');

    var spArr = subProjectCodesArrayFromUserRow(d);
    G_UserModalSubProjectPendingCodes = spArr.length ? spArr.slice() : null;
}

/** Reset modal inputs/errors; full clear including edit buffer (Add New / Close). */
function clearUserFormFieldsOnly() {
    G_UserMasterSubProjectList = [];
    $('#txtUserID').val('').removeClass('im-input-error');
    $('#txtUserName').val('').removeClass('im-input-error');
    $('#txtPassword').val('').removeClass('im-input-error');
    $('#txtConfirmPassword').val('').removeClass('im-input-error');
    $('#txtMobileNo').val('');
    $('#ddlGroupName').val('').removeClass('im-input-error');
    $('#ddlDefaultCompany').val('');
    $('#chkBizsolUser').prop('checked', false);
    SetStatus('Active');
    G_UserModalSubProjectPendingCodes = null;
    resetUserSubProjectDropdownToEmpty();
    $('.im-err-text').hide();
}

function ClearForm() {
    U_EditRow = null;
    clearUserFormFieldsOnly();
}

function CloseForm() {
    ClearForm();
    U_EditCode = 0;
    U_ViewCode = 0;
    $('#userDialogBackdrop').removeClass('show');
}

/* ══════════════════════════════════════════
   STATUS TOGGLE
══════════════════════════════════════════ */
function SetStatus(status) {
    var isActive = status === 'Active';
    $('#rdoActive').prop('checked', isActive);
    $('#rdoInactive').prop('checked', !isActive);
    $('#lblActive').toggleClass('active-opt', isActive).css('opacity', isActive ? 1 : 0.55);
    $('#lblInactive').toggleClass('inactive-opt', !isActive).css('opacity', !isActive ? 1 : 0.55);
}

/* ══════════════════════════════════════════
   PASSWORD VALIDATION
══════════════════════════════════════════ */
function ValidatePasswordMatch() {
    var pwd  = $('#txtPassword').val();
    var cpwd = $('#txtConfirmPassword').val();
    if (cpwd && pwd !== cpwd) {
        $('#txtConfirmPassword').addClass('im-input-error');
        $('#err_ConfirmPassword').css('display', 'flex');
    } else {
        $('#txtConfirmPassword').removeClass('im-input-error');
        $('#err_ConfirmPassword').hide();
    }
}

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
/** Unwrap { Data: { Status, Msg } }, { value: "{...}" }, etc. */
function unwrapStandardApiBody(res) {
    if (!res || typeof res !== 'object') return res;
    var r = tryParseJsonIfString(res);
    if (typeof r !== 'object' || r === null || Array.isArray(r)) return res;
    if (r.Status != null || r.status != null || r.Msg !== undefined || r.msg !== undefined) return r;
    if (r.Data !== undefined && r.Data != null) {
        var inner = tryParseJsonIfString(r.Data);
        if (inner && typeof inner === 'object') return unwrapStandardApiBody(inner);
    }
    if (r.data !== undefined && r.data != null) {
        var inner2 = tryParseJsonIfString(r.data);
        if (inner2 && typeof inner2 === 'object') return unwrapStandardApiBody(inner2);
    }
    if (r.value !== undefined && r.value != null) {
        var v = tryParseJsonIfString(r.value);
        if (v && typeof v === 'object') return unwrapStandardApiBody(v);
    }
    return r;
}

/** Use server text when present; ignore null, blank, or literal "null". */
function coalesceApiMessage(res, fallback) {
    var fb = fallback != null && String(fallback).trim() !== '' ? String(fallback).trim() : 'Something went wrong. Please try again.';
    if (!res || typeof res !== 'object') return fb;
    var candidates = [res.Msg, res.msg, res.Message, res.message, res.Error, res.error];
    for (var i = 0; i < candidates.length; i++) {
        var m = candidates[i];
        if (m == null) continue;
        var s = String(m).trim();
        if (!s) continue;
        var low = s.toLowerCase();
        if (low === 'null' || low === 'undefined') continue;
        return s;
    }
    return fb;
}

function apiSuccessY(res) {
    if (!res || typeof res !== 'object') return false;
    var s = res.Status != null ? res.Status : res.status;
    return s === 'Y' || s === 'y';
}

function pickEntity(response) {
    if (!response) return null;
    response = tryParseJsonIfString(response);
    if (response === null || typeof response !== 'object') return null;

    if (Array.isArray(response)) {
        var nested = pickEntityFromNestedTableArray(response);
        if (nested) return mergeUserRowWithDetailsFromGetByCodeResponse(nested, response);
        if (response.length && response[0] && typeof response[0] === 'object' && !Array.isArray(response[0])) {
            if (isUserMasterRowShape(response[0]))
                return mergeUserRowWithDetailsFromGetByCodeResponse(response[0], response);
            return response[0];
        }
        return null;
    }

    if (response.UserMasterList && response.UserMasterList[0]) {
        var u0 = response.UserMasterList[0];
        return mergeUserRowWithDetailsFromGetByCodeResponse(u0, response);
    }
    if (response.UserID != null || response.UserName != null) {
        return mergeUserRowWithDetailsFromGetByCodeResponse(response, response);
    }
    if (response.Code != null && (response.GroupMaster_Code != null || response.FixedParameter_Code != null || response.Status != null))
        return mergeUserRowWithDetailsFromGetByCodeResponse(response, response);
    if (response.data != null) return pickEntity(tryParseJsonIfString(response.data));
    if (response.Data != null) return pickEntity(tryParseJsonIfString(response.Data));
    if (response.value != null) return pickEntity(tryParseJsonIfString(response.value));
    if (response.Value != null) return pickEntity(tryParseJsonIfString(response.Value));
    return null;
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

/* ══════════════════════════════════════════
   EXPOSE TO WINDOW (required for onclick)
══════════════════════════════════════════ */
window.GetUserMasterList = GetUserMasterList;
window.OpenNewUser       = OpenNewUser;
window.EditUser          = EditUser;
window.ViewUser          = ViewUser;
window.CloseViewModal    = CloseViewModal;
window.EditFromView      = EditFromView;
window.SaveUser          = SaveUser;
window.ConfirmDelete     = ConfirmDelete;
window.DoDelete          = DoDelete;
window.SetStatus         = SetStatus;
window.CloseSuccessModal = CloseSuccessModal;
