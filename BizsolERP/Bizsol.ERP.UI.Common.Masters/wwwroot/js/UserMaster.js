import { UserMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_UserMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { UrlService } from '../../Bizsol.WebERP.UI.Shared/js/URL.js';

var U_EditCode = 0;
var U_ViewCode = 0;
var U_EditRow  = null;

/** Loaded sub-projects for multi-select (GetSubProjectMasterList?CompanyCode=… → Code, SubProjectDesp). */
var G_UserMasterSubProjectList = [];
/** Companies for default-company dropdown and company×dashboard grid. */
var G_UserMasterCompanyList = [];
/** Dashboard list for per-company dropdown (GETDASHBOARDLIST). */
var G_UserMasterDashboardList = [];
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

function getUserDetailsRow() {
    try {
        var details = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
        return Array.isArray(details) && details[0] ? details[0] : null;
    } catch (e) { return null; }
}

function getUserType() {
    var row = getUserDetailsRow();
    return row ? String(row.UserType || '').toUpperCase() : '';
}

function isLoggedInBizSolUser() {
    var row = getUserDetailsRow();
    if (!row) return false;
    var v = String(row.IsBizSolUser || '').trim().toUpperCase();
    return v === 'Y' || v === 'YES';
}

/** Show BIZSOL User only when logged-in UserType = A and IsBizSolUser = Y (hide for U/N and all other cases). */
function canShowBizsolUserOption() {
    return getUserType() === 'A' && isLoggedInBizSolUser();
}

function updateBizsolUserVisibility() {
    var show = canShowBizsolUserOption();
    $('#wrapBizsolUser')
        .toggleClass('is-visible', show)
        .css('display', show ? 'flex' : 'none');
    $('#wrapAttendanceMandatoryInCRM')
        .toggleClass('is-visible', show)
        .css('display', show ? 'flex' : 'none');
    if (!show) {
        $('#chkBizsolUser').prop('checked', false);
        $('#chkAttendanceMandatoryInCRM').prop('checked', false);
    }
}

function resolveAttendanceMandatoryInCRMForSave() {
    if (canShowBizsolUserOption()) {
        return $('#chkAttendanceMandatoryInCRM').prop('checked') ? 'Y' : 'N';
    }
    if (U_EditRow && U_EditRow.AttendanceMandatoryInCRM != null) {
        return String(U_EditRow.AttendanceMandatoryInCRM).trim().toUpperCase() === 'Y' ? 'Y' : 'N';
    }
    return 'N';
}

function resolveIsBizSolUserForSave() {
    if (canShowBizsolUserOption()) {
        return $('#chkBizsolUser').prop('checked') ? 'Y' : 'N';
    }
    if (U_EditRow && U_EditRow.IsBizSolUser != null) {
        return String(U_EditRow.IsBizSolUser).toUpperCase() === 'Y' ? 'Y' : 'N';
    }
    return 'N';
}

function isAdminUser() {
    return getUserType() === 'A';
}

/** Admin → 0 (all users); regular user → own UserMaster_Code. */
function resolveUserMasterListFilterCode() {
    if (isAdminUser()) return 0;
    return getUserCode();
}

function updateUserMasterPageAccess() {
    var admin = isAdminUser();
    $('#btnNewUser').toggle(admin);
    updateUserDashboardVisibility();
}

/** Company Dashboard grid — visible only to admin (UserType = A). */
function updateUserDashboardVisibility() {
    var show = isAdminUser();
    $('#wrapUserDashboardSection, #wrapViewUserDashboardSection').toggle(show);
}

function buildUserMasterRowActions(code) {
    var c = code != null ? code : 0;
    var html = '<button class="im-btn-view" title="View" onclick="ViewUser(' + c + ')"><i class="fas fa-eye"></i></button>' +
        '<button class="im-btn-edit" title="Edit" onclick="EditUser(' + c + ')"><i class="fas fa-pen"></i></button>';
    if (isAdminUser()) {
        html += '<button class="im-btn-delete" title="Delete" onclick="ConfirmDelete(' + c + ')"><i class="fas fa-trash-can"></i></button>';
    }
    return html;
}

function canAccessUserMasterRecord(code) {
    if (isAdminUser()) return true;
    var c = parseInt(code, 10);
    return !isNaN(c) && c > 0 && c === getUserCode();
}

/** Non-admin editing own profile: User ID, User Name, Group Name are read-only. */
function shouldLockRestrictedUserFields() {
    return !isAdminUser() && U_EditCode > 0;
}

function updateUserFormFieldLocks() {
    var lock = shouldLockRestrictedUserFields();
    $('#txtUserID, #txtUserName')
        .prop('readonly', lock)
        .toggleClass('im-input-locked', lock);
    $('#ddlGroupName')
        .prop('disabled', lock)
        .toggleClass('im-input-locked', lock);
}

function applyRestrictedFieldsForSelfServiceSave(row) {
    if (isAdminUser() || !U_EditRow || U_EditCode <= 0) return row;
    row.UserID = U_EditRow.UserID || row.UserID;
    row.UserName = U_EditRow.UserName || row.UserName;
    if (U_EditRow.GroupMaster_Code != null && U_EditRow.GroupMaster_Code !== '') {
        row.GroupMaster_Code = parseInt(U_EditRow.GroupMaster_Code, 10) || row.GroupMaster_Code;
    }
    return row;
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    updateBizsolUserVisibility();
    updateUserMasterPageAccess();
    /* UserDetails loads async from menu — re-check once session is ready. */
    var _bizsolVisAttempts = 0;
    var _bizsolVisTimer = setInterval(function () {
        _bizsolVisAttempts++;
        if (getUserDetailsRow() || _bizsolVisAttempts >= 24) {
            clearInterval(_bizsolVisTimer);
            updateBizsolUserVisibility();
            updateUserMasterPageAccess();
        }
    }, 250);
    GetUserMasterList();
    LoadDropdowns();

    /* Full viewport center — escape #modern-content scroll pane (see _Layout). */
    $('#userDialogBackdrop, #viewUserBackdrop, #deleteConfirmBackdrop, #successBackdrop')
        .appendTo(document.body);

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

/** Read a field from a row (PascalCase / camelCase / case-insensitive). */
function pickRowVal(row) {
    if (!row || typeof row !== 'object') return undefined;
    var names = Array.prototype.slice.call(arguments, 1);
    var i, n, k, keys, want;
    for (i = 0; i < names.length; i++) {
        if (Object.prototype.hasOwnProperty.call(row, names[i]) && row[names[i]] != null)
            return row[names[i]];
    }
    keys = Object.keys(row);
    for (n = 0; n < names.length; n++) {
        want = String(names[n]).toLowerCase();
        for (k = 0; k < keys.length; k++) {
            if (String(keys[k]).toLowerCase() === want && row[keys[k]] != null)
                return row[keys[k]];
        }
    }
    return undefined;
}

/** DataSet list APIs often return [[ {..}, {..} ]] — first table's object rows. */
function flattenFirstTableRows(res) {
    if (!res) return [];
    res = tryParseJsonIfString(res);
    if (!Array.isArray(res) || !res.length) return [];
    var pack = Array.isArray(res[0]) ? res[0] : res;
    if (!Array.isArray(pack)) return [];
    return pack.filter(function (x) { return x && typeof x === 'object' && !Array.isArray(x); });
}

/** Peel nested arrays until the first object: [[{row}]] → row. */
function unwrapNestedToFirstObject(response) {
    var cur = tryParseJsonIfString(response);
    var guard = 0;
    while (Array.isArray(cur) && cur.length && guard++ < 8) {
        cur = tryParseJsonIfString(cur[0]);
    }
    if (cur && typeof cur === 'object' && !Array.isArray(cur)) return cur;
    return null;
}

function setSelectValueWhenReady($sel, value, attempts, onSet) {
    var v = value == null || String(value).trim() === '' ? '' : String(value).trim();
    attempts = attempts == null ? 12 : attempts;
    if (!$sel || !$sel.length) {
        if (typeof onSet === 'function') onSet(v);
        return;
    }
    if (!v) {
        $sel.val('');
        if (typeof onSet === 'function') onSet('');
        return;
    }
    var has = $sel.find('option').filter(function () {
        return String($(this).val()) === v;
    }).length;
    if (has) {
        $sel.val(v);
        if (typeof onSet === 'function') onSet(v);
        return;
    }
    if (attempts > 0) {
        setTimeout(function () { setSelectValueWhenReady($sel, v, attempts - 1, onSet); }, 180);
        return;
    }
    $sel.val(v);
    if (typeof onSet === 'function') onSet(v);
}

/** JOIN row(s) with WebApiDashboardMaster_Code + FixedParameter_Code on the user object. */
function collectDashboardJoinRows(rows) {
    var out = [];
    if (!Array.isArray(rows)) return out;
    rows.forEach(function (r) {
        if (!r || typeof r !== 'object') return;
        var dc = pickRowVal(r, 'WebApiDashboardMaster_Code', 'webApiDashboardMaster_Code');
        var cc = pickRowVal(r, 'FixedParameter_Code', 'fixedParameter_Code');
        if (dc == null || cc == null || isNaN(Number(dc)) || isNaN(Number(cc))) return;
        if (Number(dc) <= 0) return;
        out.push(r);
    });
    return out;
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
    if (Array.isArray(res)) {
        var flatSp = flattenFirstTableRows(res);
        return flatSp.length ? flatSp : res.filter(function (x) { return x && typeof x === 'object' && !Array.isArray(x); });
    }
    /* ASP.NET often wraps list in Data / value (string or object) */
    if (res.Data != null) {
        var d = tryParseJsonIfString(res.Data);
        if (Array.isArray(d)) {
            var flatD = flattenFirstTableRows(d);
            return flatD.length ? flatD : d.filter(function (x) { return x && typeof x === 'object' && !Array.isArray(x); });
        }
        if (d && typeof d === 'object' && !Array.isArray(d)) {
            var inner = normalizeSubProjectMasterListResponse(d);
            if (inner.length) return inner;
        }
    }
    if (res.data != null) {
        var d2 = tryParseJsonIfString(res.data);
        if (Array.isArray(d2)) {
            var flatD2 = flattenFirstTableRows(d2);
            return flatD2.length ? flatD2 : d2.filter(function (x) { return x && typeof x === 'object' && !Array.isArray(x); });
        }
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
    var uid = pickRowVal(o, 'UserID', 'userID');
    var uname = pickRowVal(o, 'UserName', 'userName');
    if (uid != null && String(uid).trim() !== '') return true;
    if (uname != null && String(uname).trim() !== '') return true;
    var code = pickRowVal(o, 'Code', 'code');
    var g = pickRowVal(o, 'GroupMaster_Code', 'groupMaster_Code');
    var f = pickRowVal(o, 'FixedParameter_Code', 'fixedParameter_Code');
    if (code != null && g != null && f != null) return true;
    return false;
}

/**
 * API shape from multi-result-set: [ [ userRow ], [ subProjectRow, ... ] ]
 * or a JOIN flatten: [ [ { user + WebApiDashboardMaster_Code + Desp } ] ].
 */
function pickEntityFromNestedTableArray(outer) {
    if (!Array.isArray(outer) || outer.length < 1) return null;
    var pack0 = outer[0];
    if (!Array.isArray(pack0) || !pack0.length) return null;
    var user = null;
    var i;
    for (i = 0; i < pack0.length; i++) {
        if (isUserMasterRowShape(pack0[i])) { user = pack0[i]; break; }
    }
    if (!user) user = unwrapNestedToFirstObject(pack0);
    if (!user || typeof user !== 'object') return null;
    var merged = Object.assign({}, user);
    var dashJoin = collectDashboardJoinRows(pack0);
    if (dashJoin.length) merged.UserDashboardDetails = dashJoin;
    if (outer.length >= 2) {
        var pack1 = outer[1];
        if (Array.isArray(pack1) && pack1.length) {
            if (rowLooksLikeSubProjectUserDetailRow(pack1[0]))
                merged.SubProjectMasterDetails = pack1;
            else if (rowLooksLikeUserDashboardDetailRow(pack1[0]))
                merged.UserDashboardDetails = pack1;
        }
    }
    if (outer.length >= 3) {
        var pack2 = outer[2];
        if (Array.isArray(pack2) && pack2.length && rowLooksLikeUserDashboardDetailRow(pack2[0]))
            merged.UserDashboardDetails = pack2;
    }
    if ((!merged.UserDashboardDetails || !merged.UserDashboardDetails.length) && dashJoin.length)
        merged.UserDashboardDetails = dashJoin;
    return merged;
}

/** Attach subproject rows when API returns them beside UserMasterList / on outer wrapper. */
function mergeUserRowWithDetailsFromGetByCodeResponse(userRow, response) {
    if (!userRow || !response || typeof response !== 'object') return userRow;
    if (Array.isArray(response)) {
        var nestedUser = pickEntityFromNestedTableArray(response);
        if (nestedUser) {
            userRow = Object.assign({}, userRow, nestedUser);
            if (nestedUser.SubProjectMasterDetails && nestedUser.SubProjectMasterDetails.length)
                userRow.SubProjectMasterDetails = nestedUser.SubProjectMasterDetails;
            if (nestedUser.UserDashboardDetails && nestedUser.UserDashboardDetails.length)
                userRow.UserDashboardDetails = nestedUser.UserDashboardDetails;
            return userRow;
        }
    }
    var layers = [response];
    var inner = response.Data != null ? response.Data : response.data;
    inner = tryParseJsonIfString(inner);
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) layers.push(inner);
    for (var li = 0; li < layers.length; li++) {
        var dsUser = pickUserRowFromDataSetShape(layers[li]);
        if (dsUser) {
            userRow = Object.assign({}, userRow, dsUser);
            if (dsUser.SubProjectMasterDetails && dsUser.SubProjectMasterDetails.length)
                userRow.SubProjectMasterDetails = dsUser.SubProjectMasterDetails;
            if (dsUser.UserDashboardDetails && dsUser.UserDashboardDetails.length)
                userRow.UserDashboardDetails = dsUser.UserDashboardDetails;
        }
    }
    if (inner && Array.isArray(inner)) {
        var fromArr = pickEntityFromNestedTableArray(inner);
        if (fromArr) {
            userRow = Object.assign({}, userRow, fromArr);
            if (fromArr.SubProjectMasterDetails && fromArr.SubProjectMasterDetails.length)
                userRow.SubProjectMasterDetails = fromArr.SubProjectMasterDetails;
            if (fromArr.UserDashboardDetails && fromArr.UserDashboardDetails.length)
                userRow.UserDashboardDetails = fromArr.UserDashboardDetails;
            return userRow;
        }
    }
    for (var li = 0; li < layers.length; li++) {
        var arr = pickSubProjectDetailsArrayFromResponseObject(layers[li]);
        if (arr && arr.length) userRow = Object.assign({}, userRow, { SubProjectMasterDetails: arr });
        var dashArr = pickUserDashboardDetailsArrayFromResponseObject(layers[li]);
        if (dashArr && dashArr.length) userRow = Object.assign({}, userRow, { UserDashboardDetails: dashArr });
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

function subProjectDetailsArrayFromUserRow(row) {
    if (!row) return [];
    var list = row.SubProjectMasterDetails || row.subProjectMasterDetails
        || row.UserSubProjectDetails || row.userSubProjectDetails
        || row.UserMasterSubProjectDetails || row.userMasterSubProjectDetails;
    if (!list) {
        var t1 = row.Table1 != null ? row.Table1 : row.table1;
        t1 = tryParseJsonIfString(t1);
        if (Array.isArray(t1)) list = t1;
    }
    if (list && !Array.isArray(list)) list = [list];
    return Array.isArray(list) ? list : [];
}

/** View / display: SubProjectDesp from Table1, else lookup from loaded master list. */
function subProjectNamesDisplayFromUserRow(row) {
    if (!row) return '—';
    var list = subProjectDetailsArrayFromUserRow(row);
    if (list.length) {
        var names = list.map(function (x) {
            if (!x) return '';
            var desp = x.SubProjectDesp != null ? x.SubProjectDesp : x.subProjectDesp;
            if (desp != null && String(desp).trim() !== '') return String(desp).trim();
            var sp = x.SubProjectMaster_Code != null ? x.SubProjectMaster_Code : x.subProjectMaster_Code;
            if (sp == null || String(sp).trim() === '' || isNaN(Number(sp))) {
                var c = x.Code != null ? x.Code : x.code;
                if (c != null && String(c).trim() !== '' && !isNaN(Number(c))) sp = c;
            }
            if (sp != null && String(sp).trim() !== '' && !isNaN(Number(sp))) {
                var m = (G_UserMasterSubProjectList || []).find(function (item) {
                    return pickSubProjectRowCode(item) === String(Number(sp));
                });
                if (m) return pickSubProjectDisplayName(m);
            }
            return '';
        }).filter(Boolean);
        if (names.length) return names.join(', ');
    }
    return subProjectNamesDisplayFromCodes(subProjectCodesArrayFromUserRow(row));
}

function loadSubProjectsForViewModal(companyCode, callback) {
    var cc = companyCode != null && companyCode !== '' ? String(companyCode).trim() : '';
    if (!cc) {
        if (typeof callback === 'function') callback();
        return;
    }
    var url = UrlService.API_ENDPOINT_USERMASTER + '/GetSubProjectMasterList?CompanyCode=' + encodeURIComponent(cc);
    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        success: function (response) {
            G_UserMasterSubProjectList = normalizeSubProjectMasterListResponse(response);
        },
        error: function () {
            G_UserMasterSubProjectList = [];
        },
        complete: function () {
            if (typeof callback === 'function') callback();
        }
    });
}

/* ══════════════════════════════════════════
   COMPANY × DASHBOARD GRID (TY_UserDashboard)
══════════════════════════════════════════ */
function normalizeMasterListResponse(res) {
    if (!res) return [];
    res = tryParseJsonIfString(res);
    if (Array.isArray(res)) {
        var flat = flattenFirstTableRows(res);
        return flat.length ? flat : res.filter(function (x) { return x && typeof x === 'object' && !Array.isArray(x); });
    }
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.Data)) return res.Data;
    if (Array.isArray(res.value)) return res.value;
    if (Array.isArray(res.Value)) return res.Value;
    if (res.Data && typeof res.Data === 'object') return normalizeMasterListResponse(res.Data);
    if (res.data && typeof res.data === 'object') return normalizeMasterListResponse(res.data);
    return [];
}

function pickCompanyRowCode(c) {
    if (!c) return '';
    var v = c.Code != null ? c.Code : c.code;
    if (v === null || v === undefined || v === '') return '';
    return String(v).trim();
}

function pickCompanyDisplayName(c) {
    if (!c) return '';
    var t = c.CompanyName != null ? c.CompanyName : c.companyName;
    t = (t != null && String(t).trim() !== '') ? String(t).trim() : '';
    if (t) return t;
    return pickCompanyRowCode(c) || '';
}

function pickDashboardRowCode(d) {
    if (!d) return '';
    var v = d.WebApiDashboardMaster_Code != null ? d.WebApiDashboardMaster_Code
        : (d.webApiDashboardMaster_Code != null ? d.webApiDashboardMaster_Code
            : (d.Code != null ? d.Code : d.code));
    if (v === null || v === undefined || v === '') return '';
    return String(v).trim();
}

function pickDashboardDisplayName(d) {
    if (!d) return '';
    var t = d.Desp != null ? d.Desp
        : (d.desp != null ? d.desp
            : (d.DashboardName != null ? d.DashboardName
                : (d.dashboardName != null ? d.dashboardName
                    : (d.ModuleDesp != null ? d.ModuleDesp
                        : (d.moduleDesp != null ? d.moduleDesp
                            : (d.Name != null ? d.Name : d.name))))));
    t = (t != null && String(t).trim() !== '') ? String(t).trim() : '';
    if (t) return t;
    return pickDashboardRowCode(d) || '';
}

function buildDashboardSelectOptions(selectedCode) {
    var sel = selectedCode != null && String(selectedCode).trim() !== '' ? String(selectedCode).trim() : '';
    var html = '<option value="">— Select Dashboard —</option>';
    (G_UserMasterDashboardList || []).forEach(function (d) {
        var val = pickDashboardRowCode(d);
        if (!val) return;
        var text = pickDashboardDisplayName(d);
        html += '<option value="' + escHtmlUm(val) + '"' + (sel === val ? ' selected' : '') + '>' + escHtmlUm(text) + '</option>';
    });
    return html;
}

/** @param {Object<string,string>} selectionMap companyCode → dashboardCode */
function bindUserDashboardGrid(selectionMap) {
    var $body = $('#userDashboardGridBody');
    if (!$body.length) return;
    selectionMap = selectionMap || {};
    var rows = '';
    (G_UserMasterCompanyList || []).forEach(function (c) {
        var companyCode = pickCompanyRowCode(c);
        if (!companyCode) return;
        var companyName = pickCompanyDisplayName(c);
        var dashSel = selectionMap[companyCode] != null ? String(selectionMap[companyCode]) : '';
        rows += '<tr data-company-code="' + escHtmlUm(companyCode) + '">' +
            '<td class="um-dash-company-name">' + escHtmlUm(companyName) + '</td>' +
            '<td><select class="um-dash-ddl im-input" data-company-code="' + escHtmlUm(companyCode) + '">' +
            buildDashboardSelectOptions(dashSel) +
            '</select></td></tr>';
    });
    if (!rows) {
        rows = '<tr><td colspan="2" style="text-align:center;color:#9ca3af;padding:16px;">No companies found.</td></tr>';
    }
    $body.html(rows);
}

function rowLooksLikeUserDashboardDetailRow(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
    return ('WebApiDashboardMaster_Code' in o) || ('webApiDashboardMaster_Code' in o)
        || ('FixedParameter_Code' in o) || ('fixedParameter_Code' in o);
}

/** GetUserMasterByCode DataSet: Table = user, Table1 = subproject, Table2 = dashboard. */
function pickUserRowFromDataSetShape(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
    var table = tryParseJsonIfString(obj.Table != null ? obj.Table : obj.table);
    if (!Array.isArray(table) || !table.length || !isUserMasterRowShape(table[0])) return null;
    var user = Object.assign({}, table[0]);
    var t1 = tryParseJsonIfString(obj.Table1 != null ? obj.Table1 : obj.table1);
    if (Array.isArray(t1) && t1.length && rowLooksLikeSubProjectUserDetailRow(t1[0]))
        user.SubProjectMasterDetails = t1;
    var t2 = tryParseJsonIfString(obj.Table2 != null ? obj.Table2 : obj.table2);
    if (Array.isArray(t2) && t2.length && rowLooksLikeUserDashboardDetailRow(t2[0]))
        user.UserDashboardDetails = t2;
    return user;
}

function pickUserDashboardDetailsArrayFromResponseObject(obj) {
    if (!obj || typeof obj !== 'object') return null;
    var keys = [
        'UserDashboardDetails', 'userDashboardDetails',
        'UserDashboard', 'userDashboard',
        'DashboardDetails', 'dashboardDetails'
    ];
    for (var i = 0; i < keys.length; i++) {
        var v = tryParseJsonIfString(obj[keys[i]]);
        if (!v) continue;
        if (Array.isArray(v) && v.length && rowLooksLikeUserDashboardDetailRow(v[0])) return v;
        if (v && typeof v === 'object' && !Array.isArray(v) && rowLooksLikeUserDashboardDetailRow(v)) return [v];
    }
    var t2 = obj.Table2 != null ? obj.Table2 : obj.table2;
    t2 = tryParseJsonIfString(t2);
    if (Array.isArray(t2) && t2.length && rowLooksLikeUserDashboardDetailRow(t2[0])) return t2;
    return null;
}

function userDashboardSelectionMapFromUserRow(row) {
    var map = Object.create(null);
    if (!row) return map;
    var list = row.UserDashboardDetails || row.userDashboardDetails
        || row.UserDashboard || row.userDashboard;
    if (!list) {
        var t2 = row.Table2 != null ? row.Table2 : row.table2;
        t2 = tryParseJsonIfString(t2);
        if (Array.isArray(t2) && t2.length) list = t2;
    }
    if (list && !Array.isArray(list)) list = [list];
    if (Array.isArray(list)) {
        list.forEach(function (x) {
            if (!x) return;
            var cc = pickRowVal(x, 'FixedParameter_Code', 'fixedParameter_Code');
            var dc = pickRowVal(x, 'WebApiDashboardMaster_Code', 'webApiDashboardMaster_Code');
            if (cc == null || dc == null || isNaN(Number(cc)) || isNaN(Number(dc))) return;
            if (Number(dc) <= 0) return;
            map[String(Number(cc))] = String(Number(dc));
        });
    }
    if (!Object.keys(map).length) {
        var fcc = pickRowVal(row, 'FixedParameter_Code', 'fixedParameter_Code');
        var fdc = pickRowVal(row, 'WebApiDashboardMaster_Code', 'webApiDashboardMaster_Code');
        if (fcc != null && fdc != null && !isNaN(Number(fcc)) && !isNaN(Number(fdc)) && Number(fdc) > 0)
            map[String(Number(fcc))] = String(Number(fdc));
    }
    return map;
}

function userDashboardDetailsArrayFromUserRow(row) {
    if (!row) return [];
    var list = row.UserDashboardDetails || row.userDashboardDetails
        || row.UserDashboard || row.userDashboard;
    if (!list) {
        var t2 = row.Table2 != null ? row.Table2 : row.table2;
        t2 = tryParseJsonIfString(t2);
        if (Array.isArray(t2)) list = t2;
    }
    if (list && !Array.isArray(list)) list = [list];
    if (Array.isArray(list) && list.length) return list;
    var fcc = pickRowVal(row, 'FixedParameter_Code', 'fixedParameter_Code');
    var fdc = pickRowVal(row, 'WebApiDashboardMaster_Code', 'webApiDashboardMaster_Code');
    if (fcc != null && fdc != null && !isNaN(Number(fcc)) && !isNaN(Number(fdc)) && Number(fdc) > 0)
        return [row];
    return [];
}

function pickUserDashboardDetailCompanyName(x) {
    if (!x) return '';
    var t = x.DefaultCompanyName != null ? x.DefaultCompanyName : x.defaultCompanyName;
    if (t != null && String(t).trim() !== '') return String(t).trim();
    var cc = x.FixedParameter_Code != null ? x.FixedParameter_Code : x.fixedParameter_Code;
    if (cc != null && !isNaN(Number(cc))) {
        var co = (G_UserMasterCompanyList || []).find(function (c) {
            return pickCompanyRowCode(c) === String(Number(cc));
        });
        if (co) return pickCompanyDisplayName(co);
    }
    return cc != null ? String(cc) : '';
}

function pickUserDashboardDetailDesp(x) {
    if (!x) return '';
    var t = x.Desp != null ? x.Desp : x.desp;
    if (t != null && String(t).trim() !== '') return String(t).trim();
    var dc = x.WebApiDashboardMaster_Code != null ? x.WebApiDashboardMaster_Code : x.webApiDashboardMaster_Code;
    if (dc != null && !isNaN(Number(dc))) {
        var d = (G_UserMasterDashboardList || []).find(function (item) {
            return pickDashboardRowCode(item) === String(Number(dc));
        });
        if (d) return pickDashboardDisplayName(d);
    }
    return dc != null ? String(dc) : '';
}

function userDashboardViewHtmlFromUserRow(row) {
    var list = userDashboardDetailsArrayFromUserRow(row);
    if (!list.length) return '<span class="um-view-empty">—</span>';
    var html = '<div class="um-view-dash-table">';
    list.forEach(function (x) {
        var company = escHtmlUm(pickUserDashboardDetailCompanyName(x));
        var dash = escHtmlUm(pickUserDashboardDetailDesp(x));
        if (!company && !dash) return;
        html += '<div class="um-view-dash-row">' +
            '<span class="um-view-dash-company">' + (company || '—') + '</span>' +
            '<span class="um-view-dash-sep"><i class="fas fa-chevron-right"></i></span>' +
            '<span class="um-view-dash-name">' + (dash || '—') + '</span></div>';
    });
    html += '</div>';
    return html;
}

/** tblUserMaster.UserDashboardDetails — TY_UserDashboard: WebApiDashboardMaster_Code, FixedParameter_Code, UserMaster_Code */
function buildUserDashboardDetailsPayload(userCodeOverride) {
    var userCode = userCodeOverride != null ? parseInt(userCodeOverride, 10) : 0;
    if (isNaN(userCode) || userCode <= 0) {
        userCode = U_EditCode > 0 ? parseInt(U_EditCode, 10) : 0;
    }
    var out = [];
    $('#userDashboardGridBody tr').each(function () {
        var companyCode = parseInt(String($(this).data('company-code') || '').trim(), 10);
        var dashCode = parseInt(String($(this).find('.um-dash-ddl').val() || '').trim(), 10);
        if (isNaN(companyCode) || companyCode <= 0) return;
        if (isNaN(dashCode) || dashCode <= 0) return;
        out.push({
            WebApiDashboardMaster_Code: dashCode,
            FixedParameter_Code: companyCode,
            UserMaster_Code: userCode
        });
    });
    return out;
}

function loadUserDashboardLookups(callback) {
    var pending = 2;
    function done() {
        pending--;
        if (pending <= 0 && typeof callback === 'function') callback();
    }
    if (G_UserMasterDashboardList.length) {
        pending--;
    } else {
        $.ajax({
            url: UrlService.API_ENDPOINT_USERMASTER + '/GETDASHBOARDLIST',
            type: 'GET',
            dataType: 'json',
            success: function (res) {
                G_UserMasterDashboardList = normalizeMasterListResponse(res);
            },
            error: function () {
                G_UserMasterDashboardList = [];
                toastr.error('Failed to load dashboard list.');
            },
            complete: done
        });
    }
    if (G_UserMasterCompanyList.length) {
        pending--;
    } else {
        $.ajax({
            url: UrlService.API_ENDPOINT_USERMASTER + '/GetCompanyMasterList',
            type: 'GET',
            dataType: 'json',
            success: function (res) {
                G_UserMasterCompanyList = normalizeMasterListResponse(res);
            },
            error: function () {
                G_UserMasterCompanyList = [];
                toastr.error('Failed to load company list.');
            },
            complete: done
        });
    }
    if (pending === 0 && typeof callback === 'function') callback();
}

function refreshUserDashboardGridFromRow(row) {
    if (!isAdminUser()) return;
    loadUserDashboardLookups(function () {
        bindUserDashboardGrid(userDashboardSelectionMapFromUserRow(row));
    });
}

function resolveUserDashboardDetailsForSave(codeVal) {
    if (isAdminUser()) {
        return buildUserDashboardDetailsPayload(codeVal);
    }
    if (!U_EditRow) return [];
    var userCode = codeVal > 0 ? codeVal : (U_EditCode > 0 ? parseInt(U_EditCode, 10) : 0);
    return userDashboardDetailsArrayFromUserRow(U_EditRow).map(function (x) {
        var companyCode = parseInt(x.FixedParameter_Code != null ? x.FixedParameter_Code : x.fixedParameter_Code, 10);
        var dashCode = parseInt(x.WebApiDashboardMaster_Code != null ? x.WebApiDashboardMaster_Code : x.webApiDashboardMaster_Code, 10);
        if (isNaN(companyCode) || companyCode <= 0 || isNaN(dashCode) || dashCode <= 0) return null;
        return {
            WebApiDashboardMaster_Code: dashCode,
            FixedParameter_Code: companyCode,
            UserMaster_Code: userCode
        };
    }).filter(Boolean);
}

/* ══════════════════════════════════════════
   LOAD LIST
══════════════════════════════════════════ */
function GetUserMasterList() {
    var filterCode = resolveUserMasterListFilterCode();
    UserMasterService.GetUserMasterList(filterCode).then(function (response) {
        var rows = [];
        if (Array.isArray(response)) {
            var flatList = flattenFirstTableRows(response);
            rows = flatList.length ? flatList : response;
        } else if (Array.isArray(response.data)) {
            rows = flattenFirstTableRows(response.data);
            if (!rows.length) rows = response.data;
        } else if (Array.isArray(response.Data)) {
            rows = flattenFirstTableRows(response.Data);
            if (!rows.length) rows = response.Data;
        }

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

            row.Action = buildUserMasterRowActions(code);
            return row;
        });

        BizsolCustomFilterGrid.CreateDataTable(
            'UserMaster-header', 'UserMaster-body',
            updatedResponse, false, [],
            StringFilterColumn, NumericFilterColumn, DateFilterColumn,
            [], hiddenColumns, ColumnAlignment,
            true, null, null, null,
            'Search by User ID, Name, Group, Email, Mobile, Status...'
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
            var groups = normalizeMasterListResponse(res);
            var $ddl = $('#ddlGroupName').empty().append('<option value="">— Select Group —</option>');
            groups.forEach(function (g) {
                var code = pickRowVal(g, 'Code', 'code');
                var name = pickRowVal(g, 'GroupName', 'groupName');
                if (code == null || String(code).trim() === '') return;
                $ddl.append($('<option>').val(String(code)).text(name != null && String(name).trim() !== '' ? String(name) : String(code)));
            });
        }
    });

    /* Default Company */
    $.ajax({
        url: UrlService.API_ENDPOINT_USERMASTER + '/GetCompanyMasterList',
        type: 'GET',
        success: function (res) {
            var companies = normalizeMasterListResponse(res);
            G_UserMasterCompanyList = companies;
            var $ddl = $('#ddlDefaultCompany').empty().append('<option value="">— Select Company —</option>');
            companies.forEach(function (c) {
                var code = pickCompanyRowCode(c);
                var name = pickCompanyDisplayName(c);
                if (!code) return;
                $ddl.append($('<option>').val(code).text(name));
            });
        }
    });

    /* Dashboard list for company×dashboard grid */
    $.ajax({
        url: UrlService.API_ENDPOINT_USERMASTER + '/GETDASHBOARDLIST',
        type: 'GET',
        success: function (res) {
            G_UserMasterDashboardList = normalizeMasterListResponse(res);
        },
        error: function () {
            G_UserMasterDashboardList = [];
        }
    });

    /* Subprojects load when user picks default company (see #ddlDefaultCompany change). */
}

/* ══════════════════════════════════════════
   OPEN NEW
══════════════════════════════════════════ */
function OpenNewUser() {
    if (!isAdminUser()) {
        toastr.warning('Only admin users can add new users.');
        return;
    }
    U_EditCode = 0;
    U_EditRow = null;
    ClearForm();
    updateBizsolUserVisibility();
    updateUserDashboardVisibility();
    $('#formModalTitle').text('Add New User');
    $('#btnSaveText').text('Save User');
    $('#userDialogBackdrop').addClass('show');
    updateBizsolUserVisibility();
    updateUserFormFieldLocks();
    refreshUserDashboardGridFromRow(null);
    /* Subproject list + Select2 only after user picks Default Company (change → loadSubProjects…). */
    setTimeout(function () { $('#txtUserID').focus(); }, 140);
}

/* ══════════════════════════════════════════
   EDIT
══════════════════════════════════════════ */
function EditUser(code) {
    if (!canAccessUserMasterRecord(code)) {
        toastr.warning('You can only edit your own user profile.');
        return;
    }
    U_EditCode = code;
    ClearForm();
    updateBizsolUserVisibility();
    $('#formModalTitle').text('Edit User');
    $('#btnSaveText').text('Update User');

    UserMasterService.GetUserMasterByCode(code).then(function (res) {
        var row = pickEntity(res);
        if (!row) { toastr.error('Failed to load user data.'); return; }
        row = mergeUserRowWithDetailsFromGetByCodeResponse(row, res);
        PopulateForm(row);
        U_EditRow = Object.assign({}, row);
        var companyCode = pickRowVal(row, 'FixedParameter_Code', 'fixedParameter_Code');
        companyCode = companyCode != null && String(companyCode).trim() !== '' ? String(companyCode).trim() : '';
        loadSubProjectsForUserMaster(companyCode);
        $('#userDialogBackdrop').addClass('show');
        updateBizsolUserVisibility();
        updateUserDashboardVisibility();
        updateUserFormFieldLocks();
    }).catch(function () { toastr.error('Error loading user. Please try again.'); });
}

/* ══════════════════════════════════════════
   VIEW
══════════════════════════════════════════ */
function ViewUser(code) {
    if (!canAccessUserMasterRecord(code)) {
        toastr.warning('You can only view your own user profile.');
        return;
    }
    U_ViewCode = code;
    UserMasterService.GetUserMasterByCode(code).then(function (res) {
        var row = pickEntity(res);
        if (!row) { toastr.error('Failed to load user details.'); return; }
        row = mergeUserRowWithDetailsFromGetByCodeResponse(row, res);
        var companyCode = pickRowVal(row, 'FixedParameter_Code', 'fixedParameter_Code');
        companyCode = companyCode != null && String(companyCode).trim() !== '' ? String(companyCode).trim() : '';
        loadSubProjectsForViewModal(companyCode, function () {
            PopulateViewModal(row);
            updateUserDashboardVisibility();
            $('#viewUserBackdrop').addClass('show');
        });
    }).catch(function () { toastr.error('Error loading user details.'); });
}

function PopulateViewModal(d) {
    var code = pickRowVal(d, 'Code', 'code');
    var userName = pickRowVal(d, 'UserName', 'userName');
    var userId = pickRowVal(d, 'UserID', 'userID');
    var mobile = pickRowVal(d, 'UserMobileNo', 'userMobileNo');
    var groupName = pickRowVal(d, 'GroupName', 'groupName');
    var companyName = pickRowVal(d, 'DefaultCompanyName', 'defaultCompanyName');
    var status = String(pickRowVal(d, 'Status', 'status') || '').trim().toUpperCase();
    $('#viewUserCode').text(code != null && String(code) !== '' ? String(code) : '—');
    $('#viewUserName').text(userName || '—');
    $('#vf_UserID').text(userId || '—');
    $('#vf_UserIDVal').text(userId || '—');
    $('#vf_UserName').text(userName || '—');
    $('#vf_MobileNo').text(mobile || '—');
    $('#vf_Group').text(groupName || '—');
    $('#vf_GroupLabel').text(groupName || '—');
    $('#vf_Company').text(companyName || '—');
    $('#vf_SubProjects').text(subProjectNamesDisplayFromUserRow(d));
    $('#vf_DashboardList').html(userDashboardViewHtmlFromUserRow(d));

    /* Status badge */
    var isActive = status === 'A';
    $('#vf_StatusBadge')
        .removeClass('badge-active badge-inactive')
        .addClass(isActive ? 'badge-active' : 'badge-inactive')
        .html('<i class="fas fa-' + (isActive ? 'circle-check' : 'circle-xmark') + '" style="margin-right:4px;"></i>' + (isActive ? 'Active' : 'Inactive'));

    if (groupName) $('#vf_GroupBadge').show(); else $('#vf_GroupBadge').hide();

    var photo = pickRowVal(d, 'PhotoPath', 'photoPath');
    if (photo) {
        $('#viewAvatarImg').attr('src', photo).show();
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
        IsBizSolUser:           resolveIsBizSolUserForSave(),
        AttendanceMandatoryInCRM: resolveAttendanceMandatoryInCRMForSave(),
        UserMobileNo:           $('#txtMobileNo').val(),
        Status:                 statusChar,
        Statuss:                statusChar,
        UserCode:               sessionUser,
        SubProjectMasterDetails: buildSubProjectMasterDetailsPayload(),
        UserDashboardDetails: resolveUserDashboardDetailsForSave(codeVal),
    };

    if (U_EditRow) {
        row = Object.assign({}, U_EditRow, row);
    }

    /* Never let stale GET row override form / session (SP @CompanyCode / @DBName / TVP / audit). */
    row.Code = codeVal;
    row.UserID = $('#txtUserID').val().trim();
    row.UserName = $('#txtUserName').val().trim();
    row.Password = $('#txtPassword').val().trim();
    if (!row.Password && U_EditRow) {
        var keepPwd = pickRowVal(U_EditRow, 'Password', 'password');
        if (keepPwd != null && String(keepPwd) !== '') row.Password = String(keepPwd);
    }
    row.GroupMaster_Code = parseInt($('#ddlGroupName').val()) || 0;
    row.FixedParameter_Code = companyKey;
    row.CompanyCode = companyKey;
    row.IsBizSolUser = resolveIsBizSolUserForSave();
    row.AttendanceMandatoryInCRM = resolveAttendanceMandatoryInCRMForSave();
    row.UserMobileNo = $('#txtMobileNo').val();
    row.Status = statusChar;
    row.Statuss = statusChar;
    row.UserCode = sessionUser;
    row.UserMaster_Code = sessionUser;
    row.SubProjectMasterDetails = buildSubProjectMasterDetailsPayload();
    row.UserDashboardDetails = resolveUserDashboardDetailsForSave(codeVal);

    row = applyRestrictedFieldsForSelfServiceSave(row);

    return row;
}

/* ══════════════════════════════════════════
   DELETE
══════════════════════════════════════════ */
function ConfirmDelete(code) {
    if (!isAdminUser()) {
        toastr.warning('Only admin users can delete users.');
        return;
    }
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
    var userId = pickRowVal(d, 'UserID', 'userID');
    var userName = pickRowVal(d, 'UserName', 'userName');
    var mobile = pickRowVal(d, 'UserMobileNo', 'userMobileNo');
    var groupCode = pickRowVal(d, 'GroupMaster_Code', 'groupMaster_Code');
    var companyCode = pickRowVal(d, 'FixedParameter_Code', 'fixedParameter_Code');
    var pwd = pickRowVal(d, 'Password', 'password');
    var isBiz = String(pickRowVal(d, 'IsBizSolUser', 'isBizSolUser') || '').trim().toUpperCase();
    var att = String(pickRowVal(d, 'AttendanceMandatoryInCRM', 'attendanceMandatoryInCRM') || '').trim().toUpperCase();
    var status = String(pickRowVal(d, 'Status', 'status') || '').trim().toUpperCase();

    $('#txtUserID').val(userId != null ? String(userId) : '');
    $('#txtUserName').val(userName != null ? String(userName) : '');
    $('#txtMobileNo').val(mobile != null ? String(mobile) : '');
    if (pwd != null && String(pwd) !== '') {
        $('#txtPassword').val(String(pwd));
        $('#txtConfirmPassword').val(String(pwd));
    } else {
        $('#txtPassword').val('');
        $('#txtConfirmPassword').val('');
    }
    setSelectValueWhenReady($('#ddlGroupName'), groupCode, 16);
    setSelectValueWhenReady($('#ddlDefaultCompany'), companyCode, 16, function (cc) {
        if (cc) loadSubProjectsForUserMaster(cc);
    });
    if (canShowBizsolUserOption()) {
        $('#chkBizsolUser').prop('checked', isBiz === 'Y' || isBiz === 'YES');
        $('#chkAttendanceMandatoryInCRM').prop('checked', att === 'Y' || att === 'YES');
    } else {
        $('#chkBizsolUser').prop('checked', false);
        $('#chkAttendanceMandatoryInCRM').prop('checked', false);
    }
    SetStatus(status === 'A' ? 'Active' : 'Inactive');

    var spArr = subProjectCodesArrayFromUserRow(d);
    G_UserModalSubProjectPendingCodes = spArr.length ? spArr.slice() : null;
    refreshUserDashboardGridFromRow(d);
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
    $('#chkAttendanceMandatoryInCRM').prop('checked', false);
    SetStatus('Active');
    G_UserModalSubProjectPendingCodes = null;
    resetUserSubProjectDropdownToEmpty();
    bindUserDashboardGrid({});
    $('.im-err-text').hide();
    updateUserFormFieldLocks();
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
        var firstObj = unwrapNestedToFirstObject(response);
        if (firstObj) {
            if (isUserMasterRowShape(firstObj) || pickRowVal(firstObj, 'UserID', 'userID', 'UserName', 'userName') != null)
                return mergeUserRowWithDetailsFromGetByCodeResponse(firstObj, response);
            return firstObj;
        }
        return null;
    }

    var listWrap = response.UserMasterList || response.userMasterList;
    if (listWrap && listWrap[0]) {
        var u0 = listWrap[0];
        return mergeUserRowWithDetailsFromGetByCodeResponse(u0, response);
    }
    var fromDataSet = pickUserRowFromDataSetShape(response);
    if (fromDataSet) return mergeUserRowWithDetailsFromGetByCodeResponse(fromDataSet, response);
    if (pickRowVal(response, 'UserID', 'userID', 'UserName', 'userName') != null) {
        return mergeUserRowWithDetailsFromGetByCodeResponse(response, response);
    }
    if (pickRowVal(response, 'Code', 'code') != null &&
        (pickRowVal(response, 'GroupMaster_Code', 'groupMaster_Code') != null
            || pickRowVal(response, 'FixedParameter_Code', 'fixedParameter_Code') != null
            || pickRowVal(response, 'Status', 'status') != null))
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
