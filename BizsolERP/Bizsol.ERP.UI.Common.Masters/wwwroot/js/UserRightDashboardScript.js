import { UserRightDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_UserRightDashboardService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

/* ═══════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════ */
var _currentCompanyCode = 0;
var _currentGroupCode   = 0;   // last request param sent to API (single code or 0 = all from server)
var _groupMap           = {};   // { "GroupName": GroupCode }
var _collapsedRows      = {};
var _dashboardRes       = null;

/** Caches last API JSON by CompanyCode|GroupCode (request param). Saves repeat calls when only group checkboxes change. */
var _urdApiResponseCache = { key: '', payload: null, ts: 0 };
var URD_API_CACHE_MS = 90000;
var _urdUserListCache = { key: '', rows: null, ts: 0 };
var URD_USER_CACHE_MS = 60000;
var _urdMetaLoaded = false;
/** In-flight user-list request — abort when a newer filter is applied. */
var _urdUserListReq = null;
var _urdUserDebounceTimer = null;
var URD_USER_DEBOUNCE_MS = 200;

// Fixed SP columns — everything else is a group column
var FIXED_COLS = ['+/-', 'lavel', 'rowadded', 'rowaddedcount', 'code', 'mastercode', 'sortorder', 'moduletype', 'module'];

/* ═══════════════════════════════════════════════════
   CASE-INSENSITIVE PROPERTY READER
   Works whether API sends PascalCase or camelCase
═══════════════════════════════════════════════════ */
function gp(obj, name) {
    if (!obj) return undefined;
    if (obj[name] !== undefined) return obj[name];
    // Try camelCase
    var cc = name.charAt(0).toLowerCase() + name.slice(1);
    if (obj[cc] !== undefined) return obj[cc];
    // Try lowercase
    var lc = name.toLowerCase();
    if (obj[lc] !== undefined) return obj[lc];
    return undefined;
}

/** One key for Code / MasterCode so "1086", 1086, 1086.0 group the same (fixes missing L3/L4 under parent). */
function toParentKey(v) {
    if (v === undefined || v === null || v === '') return 0;
    var n = Number(v);
    if (!isNaN(n) && isFinite(n)) return n;
    return String(v);
}

/** Unique row identity for visit dedupe (Code alone can collide across levels). */
function rowSig(r) {
    return String(toParentKey(gp(r, 'Code'))) + '::' +
        String(toParentKey(gp(r, 'MasterCode'))) + '::' +
        (parseInt(gp(r, 'Lavel'), 10) || 0);
}

/**
 * Bind key: same MasterCode + ModuleType + Module label = one row under that parent.
 * Omits Lavel/Code so API duplicates (Level3 + Level4, different Code) collapse to one.
 */
function rowBindSig(r) {
    var master = toParentKey(gp(r, 'MasterCode'));
    var mod    = normalizeGroupKey(String(gp(r, 'Module') || '').trim());
    var mtype  = String(gp(r, 'ModuleType') || '').trim().toUpperCase();
    return String(master) + '::' + mtype + '::' + mod;
}

/** Drop duplicate rows — keep first by SortOrder under same MasterCode bind key. */
function dedupeApiRows(arr) {
    var seenCode = {};
    var seenBind = {};
    var out = [];
    sortRowsByHierarchy(arr || []).forEach(function (r) {
        var sig = rowSig(r);
        var bind = rowBindSig(r);
        if (seenCode[sig] || seenBind[bind]) return;
        seenCode[sig] = true;
        seenBind[bind] = true;
        out.push(r);
    });
    return out;
}

function markRowSeen(r, visited, visitedBind) {
    visited[rowSig(r)] = true;
    visitedBind[rowBindSig(r)] = true;
}

function isRowSeen(r, visited, visitedBind) {
    return !!(visited[rowSig(r)] || visitedBind[rowBindSig(r)]);
}

/** One row per MasterCode + module label among direct siblings. */
function dedupeSiblingRows(rows) {
    var seenBind = {};
    var out = [];
    sortRowsByHierarchy(rows || []).forEach(function (r) {
        var bind = rowBindSig(r);
        if (seenBind[bind]) return;
        seenBind[bind] = true;
        out.push(r);
    });
    return out;
}

function sortRowsByHierarchy(arr) {
    return (arr || []).slice().sort(function (a, b) {
        var sa = parseInt(gp(a, 'SortOrder'), 10);
        var sb = parseInt(gp(b, 'SortOrder'), 10);
        if (isNaN(sa)) sa = 0;
        if (isNaN(sb)) sb = 0;
        if (sa !== sb) return sa - sb;
        var ca = toParentKey(gp(a, 'Code'));
        var cb = toParentKey(gp(b, 'Code'));
        if (ca < cb) return -1;
        if (ca > cb) return 1;
        return 0;
    });
}

/* ═══════════════════════════════════════════════════
   GROUP COLUMN NAME NORMALIZATION
   Headers come from Level1 keys; deeper rows may use NBSP,
   thin spaces, or different runs of spaces vs the same label.
═══════════════════════════════════════════════════ */
function normalizeGroupKey(name) {
    if (name === undefined || name === null) return '';
    return String(name)
        .replace(/\u00a0/g, ' ')
        .replace(/[\u1680\u2000-\u200a\u202f\u205f\u3000]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

/* ═══════════════════════════════════════════════════
   GROUP COLUMN VALUE READER
   One pass per row (buildRowGroupNormMap), then O(1) reads per column.
═══════════════════════════════════════════════════ */
function buildRowGroupNormMap(row) {
    var map = {};
    if (!row) return map;
    var keys = Object.keys(row);
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (FIXED_COLS.indexOf(k.toLowerCase()) !== -1) continue;
        var nk = normalizeGroupKey(k);
        if (!nk || map[nk] !== undefined) continue;
        var v = row[k];
        map[nk] = (v === undefined || v === null || v === '') ? 'N' : String(v).trim();
    }
    return map;
}

function readGroupCell(row, normMap, gName) {
    if (!row) return 'N';
    if (row[gName] !== undefined && row[gName] !== null && row[gName] !== '') {
        return String(row[gName]).trim();
    }
    var nk = normalizeGroupKey(gName);
    if (!nk) return 'N';
    var v = normMap[nk];
    return v !== undefined ? v : 'N';
}

/** Resolve GroupMaster name → code when spacing/casing differs from dashboard column title */
function getGroupCodeFromMap(gName) {
    var c = _groupMap[gName];
    if (c !== undefined && c !== null && c !== '') return c;
    var t = normalizeGroupKey(gName);
    var names = Object.keys(_groupMap);
    for (var i = 0; i < names.length; i++) {
        if (normalizeGroupKey(names[i]) === t) return _groupMap[names[i]];
    }
    return 0;
}

/* ═══════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════ */
$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    LoadInitialData();
    $('#btnGo').on('click', LoadDashboard);
    $('#urdGroupSelectAll').on('click', function (e) {
        e.preventDefault();
        $('#urdGroupCheckboxes .urd-group-cb').prop('checked', true);
        LoadGroupUsers(getSelectedGroupCodesFromUi());
    });
    $('#urdGroupClear').on('click', function (e) {
        e.preventDefault();
        $('#urdGroupCheckboxes .urd-group-cb').prop('checked', false);
        LoadGroupUsers(null);
    });
    $(document).on('change', '#urdGroupCheckboxes .urd-group-cb', function () {
        ScheduleLoadGroupUsers(getSelectedGroupCodesFromUi());
    });
    $(document).on('click', '#urdUserRetry', function (e) {
        e.preventDefault();
        LoadGroupUsers(getSelectedGroupCodesFromUi(), { notifyOnFail: true });
    });
});

/* ═══════════════════════════════════════════════════
   LOAD DROPDOWNS — parallel fetch for faster page open
═══════════════════════════════════════════════════ */
function LoadInitialData() {
    if (_urdMetaLoaded) return;

    Promise.all([
        UserRightDashboardService.GetCompanyMasterList(),
        UserRightDashboardService.GetGroupMasterList()
    ])
        .then(function (results) {
            _urdMetaLoaded = true;
            RenderCompanyDropdown(extractArray(results[0]));
            RenderGroupCheckboxes(extractArray(results[1]));
            ShowUserListIdle();
        })
        .catch(function () {
            toastr.error('Failed to load company or group list.');
            RenderCompanyDropdown([]);
            $('#urdGroupCheckboxes').html('<div class="urd-group-empty">Failed to load groups.</div>');
            ShowUserListIdle();
        });
}

function RenderCompanyDropdown(rows) {
    var $sel = $('#ddlCompany').empty().append('<option value="0">— Select Company —</option>');
    rows.forEach(function (c) {
        $sel.append($('<option>').val(c.Code || c.CompanyCode).text(c.CompanyName || c.Name || c.CompanyCode));
    });
}

function RenderGroupCheckboxes(rows) {
    _groupMap = {};
    var $box = $('#urdGroupCheckboxes');
    $box.empty();

    if (!rows.length) {
        $box.append('<div class="urd-group-empty">No groups found.</div>');
        return;
    }

    var frag = document.createDocumentFragment();
    rows.forEach(function (g, idx) {
        var code = g.Code || g.GroupCode;
        var name = g.GroupName || g.Name;
        _groupMap[name] = code;
        var id = 'urdGcb_' + idx + '_' + String(code).replace(/[^\w-]/g, '_');

        var $cb = $('<input type="checkbox" class="urd-group-cb">').attr('id', id).val(code);
        var $row = $('<label class="urd-group-check-row">')
            .attr('for', id)
            .append($cb)
            .append($('<span class="urd-group-check-text">').text(name));

        frag.appendChild($row[0]);
    });
    $box[0].appendChild(frag);
}

function ScheduleLoadGroupUsers(selectedCodes) {
    clearTimeout(_urdUserDebounceTimer);
    _urdUserDebounceTimer = setTimeout(function () {
        LoadGroupUsers(selectedCodes);
    }, URD_USER_DEBOUNCE_MS);
}

function userListCacheKey(codesParam) {
    return codesParam === '' ? '__all__' : codesParam;
}

/**
 * Checkbox list #urdGroupCheckboxes:
 * • None checked → null → all group columns + all users.
 * • One or more checked → filter columns (client) and users (API comma list).
 */
function getSelectedGroupCodesFromUi() {
    var nums = [];
    $('#urdGroupCheckboxes .urd-group-cb:checked').each(function () {
        var n = parseInt($(this).val(), 10);
        if (!isNaN(n) && n > 0) nums.push(n);
    });
    return nums.length ? nums : null;
}

/** API param: '' = all users; '1,5' = users in groups 1 or 5 */
function buildGroupCodesParam(selectedCodes) {
    if (!selectedCodes || !selectedCodes.length) return '';
    return selectedCodes.join(',');
}

function resolveRequestGroupCode(selectedCodes) {
    if (!selectedCodes || !selectedCodes.length) return 0;
    if (selectedCodes.length === 1) return selectedCodes[0];
    return 0;
}

/* ═══════════════════════════════════════════════════
   GROUP USERS (GetGroupUserList — USP_WebAPI_GroupMaster LOCATE)
═══════════════════════════════════════════════════ */
function LoadGroupUsers(selectedCodes, options) {
    options = options || {};
    var codesParam = buildGroupCodesParam(selectedCodes);
    var cacheKey = userListCacheKey(codesParam);
    var now = Date.now();
    var $list = $('#urdUserList');

    if (_urdUserListCache.key === cacheKey && _urdUserListCache.rows &&
        (now - _urdUserListCache.ts) < URD_USER_CACHE_MS) {
        RenderUserList(_urdUserListCache.rows, selectedCodes);
        return;
    }

    if (_urdUserListReq && _urdUserListReq.readyState !== 4) {
        _urdUserListReq.abort();
    }

    $list.html(
        '<div class="urd-user-empty urd-user-loading">' +
        '<i class="fas fa-circle-notch fa-spin"></i>' +
        '<span>Loading users…</span></div>');

    _urdUserListReq = UserRightDashboardService.GetGroupUserList(codesParam);
    _urdUserListReq
        .done(function (res) {
            var rows = extractArray(res);
            _urdUserListCache = { key: cacheKey, rows: rows, ts: Date.now() };
            RenderUserList(rows, selectedCodes);
        })
        .fail(function (jqXHR, textStatus) {
            if (textStatus === 'abort') return;
            RenderUserListError();
            if (options.notifyOnFail) {
                toastr.warning('Could not load users. Check that GetGroupUserList is deployed on the API.');
            }
        });
}

function ShowUserListIdle() {
    $('#urdUserCount').text('—');
    $('#urdUserList').html(
        '<div class="urd-user-empty urd-user-idle">' +
        '<i class="fas fa-users"></i>' +
        '<span>Tick a group to preview users, or leave none selected for all users.</span></div>');
}

function RenderUserListError() {
    $('#urdUserCount').text('—');
    $('#urdUserList').html(
        '<div class="urd-user-empty urd-user-error">' +
        '<i class="fas fa-plug-circle-xmark"></i>' +
        '<div class="urd-user-error-title">User preview unavailable</div>' +
        '<div class="urd-user-error-text">' +
        'GetGroupUserList is not responding. You can still select a company and load the dashboard.</div>' +
        '<button type="button" class="urd-user-retry-btn" id="urdUserRetry">' +
        '<i class="fas fa-rotate-right"></i> Retry</button></div>');
}

function RenderUserList(rows, selectedCodes) {
    var $list = $('#urdUserList');
    $('#urdUserCount').text(String(rows.length));

    if (!rows.length) {
        var msg = selectedCodes && selectedCodes.length
            ? 'No users found for the selected group(s).'
            : 'No active users found.';
        $list.html(
            '<div class="urd-user-empty urd-user-idle">' +
            '<i class="fas fa-user-slash"></i>' +
            '<span>' + escHtml(msg) + '</span></div>');
        return;
    }

    var html = '';
    rows.forEach(function (u) {
        var name = u.UserName || u.userName || u.UserID || u.userID || '—';
        var uid  = u.UserID || u.userID || '';
        var grp  = u.GroupName || u.groupName || '';
        html +=
            '<div class="urd-user-row">' +
            '<span class="urd-user-icon"><i class="fas fa-user"></i></span>' +
            '<span class="urd-user-meta">' +
            '<div class="urd-user-name">' + escHtml(name) + '</div>' +
            (grp ? '<div class="urd-user-group">' + escHtml(grp) + (uid ? ' · ' + escHtml(uid) : '') + '</div>' : '') +
            '</span></div>';
    });
    $list.html(html);
}

/* ═══════════════════════════════════════════════════
   LOAD DASHBOARD
═══════════════════════════════════════════════════ */
function LoadDashboard() {
    _currentCompanyCode = parseInt($('#ddlCompany').val()) || 0;
    var selectedCodes    = getSelectedGroupCodesFromUi();
    _currentGroupCode    = resolveRequestGroupCode(selectedCodes);

    if (!_currentCompanyCode) {
        toastr.warning('Please select a Company.');
        $('#ddlCompany').focus();
        return;
    }

    var apiCacheKey = String(_currentCompanyCode) + '|' + String(_currentGroupCode || 0);
    var now = Date.now();
    if (_urdApiResponseCache.payload &&
        _urdApiResponseCache.key === apiCacheKey &&
        (now - _urdApiResponseCache.ts) < URD_API_CACHE_MS) {
        _dashboardRes = _urdApiResponseCache.payload;
        _collapsedRows = {};
        LoadGroupUsers(selectedCodes);
        requestAnimationFrame(function () {
            RenderDashboard(_urdApiResponseCache.payload, selectedCodes);
        });
        return;
    }

    SetLoadingState(true);
    LoadGroupUsers(selectedCodes);

    UserRightDashboardService.GetUserRightDashboard(_currentCompanyCode, _currentGroupCode)
        .then(function (res) {
            _urdApiResponseCache = { key: apiCacheKey, payload: res, ts: Date.now() };
            _dashboardRes  = res;
            _collapsedRows = {};
            RenderDashboard(res, selectedCodes);
        })
        .catch(function (err) {
            console.error('URD error:', err);
            toastr.error('Failed to load User Right Dashboard.');
            ShowPlaceholder('error');
        })
        .finally(function () {
            SetLoadingState(false);
        });
}

/* ═══════════════════════════════════════════════════
   NORMALIZE RESPONSE — handles ALL formats:
   • Flat array  [ {...}, {...} ]
   • Object      { Level1:[], Level2:[], Level3:[], Level4:[] }   PascalCase
   • Object      { level1:[], level2:[], level3:[], level4:[] }   camelCase
   • Object      { Groups:[], Level1:[], ...}  with Groups array
═══════════════════════════════════════════════════ */
function NormalizeResponse(res) {
    var level1 = [], level2 = [], level3 = [], level4 = [], groups = [];

    var src = res;
    if (Array.isArray(res)) {
        level1 = res;
    } else if (res && typeof res === 'object') {
        var hasAnyLevel =
            (Array.isArray(res.Level1) && res.Level1.length) ||
            (Array.isArray(res.level1) && res.level1.length) ||
            (Array.isArray(res.Level2) && res.Level2.length) ||
            (Array.isArray(res.level2) && res.level2.length) ||
            (Array.isArray(res.Level3) && res.Level3.length) ||
            (Array.isArray(res.level3) && res.level3.length) ||
            (Array.isArray(res.Level4) && res.Level4.length) ||
            (Array.isArray(res.level4) && res.level4.length);

        if (!hasAnyLevel) {
            var inner = res.Data !== undefined ? res.Data : res.data;
            if (inner !== null && typeof inner === 'object') src = inner;
        }

        if (Array.isArray(src)) {
            level1 = src;
        } else if (src && typeof src === 'object') {
            level1  = src.Level1  || src.level1  || [];
            level2  = src.Level2  || src.level2  || [];
            level3  = src.Level3  || src.level3  || [];
            level4  = src.Level4  || src.level4  || [];
            groups  = src.Groups  || src.groups  || [];
        }
    }

    // ── Auto-extract group column names from first row keys ──
    if (!groups.length) {
        var srcRow = (level1[0] || level2[0] || level3[0]);
        if (srcRow) {
            Object.keys(srcRow).forEach(function (k) {
                if (FIXED_COLS.indexOf(k.toLowerCase()) === -1) {
                    groups.push(k);
                }
            });
        }
    }

    return { level1: level1, level2: level2, level3: level3, level4: level4, groups: groups };
}

/* ═══════════════════════════════════════════════════
   RENDER DASHBOARD
═══════════════════════════════════════════════════ */
function RenderDashboard(res, selectedGroupCodes) {
    var d = NormalizeResponse(res);
    var level1 = d.level1, level2 = d.level2;
    var level3 = d.level3, level4 = d.level4;
    var groups = d.groups;

    if (selectedGroupCodes && selectedGroupCodes.length) {
        groups = groups.filter(function (gName) {
            var gc = parseInt(getGroupCodeFromMap(gName), 10) || 0;
            return gc && selectedGroupCodes.indexOf(gc) !== -1;
        });
        if (!groups.length && d.groups.length) {
            toastr.warning('No dashboard columns matched the selected group(s). Check group names vs master.');
        }
    }

    if (!level1.length && !level2.length && !level3.length) {
        ShowPlaceholder('empty');
        return;
    }

    // Summary
    $('#urd-count-groups').text(groups.length);
    $('#urd-count-modules').text(level1.length);
    $('#urd-summary').show();
    $('#urd-placeholder').hide();
    $('#urd-table-wrap').show();

    // ─ Build Header ─
    var $thead = $('#urd-thead').empty();
    var $hr = $('<tr>');
    $hr.append('<th class="urd-th-fixed urd-th-sr">#</th>');
    $hr.append('<th class="urd-th-fixed urd-th-toggle"></th>');
    $hr.append('<th class="urd-th-fixed urd-th-module">Module</th>');
    groups.forEach(function (gName) {
        $hr.append('<th class="urd-th-user">' + escHtml(gName) + '</th>');
    });
    $thead.append($hr);

    // ─ Build Body ─
    var mergedRows = BuildMergedRows(level1, level2, level3, level4);
    var $tbody = $('#urd-tbody').empty();
    var srNo = 0;

    var childCountByParent = {};
    mergedRows.forEach(function (r) {
        var pk = toParentKey(gp(r, 'MasterCode'));
        if (pk !== 0 && pk !== '0' && pk !== '') {
            childCountByParent[pk] = (childCountByParent[pk] || 0) + 1;
        }
    });

    var frag = document.createDocumentFragment();

    mergedRows.forEach(function (row) {
        srNo++;

        var groupNormMap = buildRowGroupNormMap(row);

        // Use gp() so both PascalCase and camelCase work
        var lavel      = parseInt(gp(row, 'Lavel'))      || 1;
        var code       = gp(row, 'Code');
        var masterCode = parseInt(gp(row, 'MasterCode'), 10);
        if (isNaN(masterCode)) masterCode = 0;
        var moduleType = String(gp(row, 'ModuleType') || '').trim();
        var moduleName = String(gp(row, 'Module')     || '').trim().replace(/^\s+/, ''); // trim leading spaces
        var rowAdded   = String(gp(row, 'RowAdded')   || 'N').trim();

        var codeKey    = toParentKey(code);
        var hasKids    = (childCountByParent[codeKey] || 0) > 0;
        var isParent   = (rowAdded !== 'Y') && (lavel === 1 || lavel === 2 || (lavel === 3 && hasKids));

        var $tr = $('<tr>')
            .addClass('urd-row-level-' + lavel)
            .attr('data-code',   code)
            .attr('data-master', masterCode)
            .attr('data-level',  lavel);

        // Sr
        $tr.append('<td class="urd-td-sr">' + srNo + '</td>');

        // Toggle
        if (isParent && rowAdded !== 'Y') {
            $tr.append(
                '<td class="urd-td-toggle">' +
                '<button type="button" class="urd-toggle-btn" data-parent-code="' + escHtml(String(code)) +
                '" data-level="' + lavel + '" title="Expand / collapse"><i class="fas fa-plus"></i></button></td>');
        } else {
            $tr.append('<td class="urd-td-toggle"></td>');
        }

        // Module name
        var indent = (lavel - 1) * 18;
        $tr.append(
            '<td class="urd-td-module"><span style="padding-left:' + indent + 'px">' +
            GetModuleIcon(moduleType, lavel) + escHtml(moduleName) + '</span></td>');

        // Group Y/N cells
        groups.forEach(function (gName) {
            var rawVal    = readGroupCell(row, groupNormMap, gName);
            var rvLower   = String(rawVal).trim().toLowerCase();
            var val       = (rvLower === 'y' || rvLower === '1' || rvLower === 'true' || rvLower === 'yes') ? 'Y' : 'N';
            var groupCode = getGroupCodeFromMap(gName) || 0;
            $tr.append(
                '<td class="urd-td-access"' +
                ' data-module-code="' + code + '"' +
                ' data-module-type="' + escHtml(moduleType) + '"' +
                ' data-group-code="'  + groupCode + '"' +
                ' data-group-name="'  + escHtml(gName) + '"' +
                ' data-value="'       + val + '">' +
                (val === 'Y'
                    ? '<span class="urd-badge-y" title="Click to Revoke"><i class="fas fa-check"></i></span>'
                    : '<span class="urd-badge-n" title="Click to Grant"><i class="fas fa-xmark"></i></span>') +
                '</td>');
        });

        frag.appendChild($tr[0]);
    });

    $tbody[0].appendChild(frag);

    // Delegated handlers — one listener each, faster than per-cell binding on large grids
    $tbody.off('click.urdToggle').on('click.urdToggle', '.urd-toggle-btn', function (e) {
        e.stopPropagation();
        var $btn = $(this);
        ToggleRow($btn.attr('data-parent-code'), $btn.data('level'), $btn);
    });
    $tbody.off('click.urdAccess').on('click.urdAccess', '.urd-td-access', function () {
        OnCellClick($(this));
    });

    ApplyDefaultCollapsedState($tbody);
}

/* ═══════════════════════════════════════════════════
   BUILD MERGED ROW ORDER — DFS from each Level1 root
   • Children keyed by MasterCode → parent Code (all L1–L4 in one map).
   • Siblings sorted by SortOrder.
   • Rows whose Code is a Level1 root are NEVER attached under another root
     (fixes “Web” missing when API wrongly sets Web.MasterCode to Tools etc.).
   • Dedupe by rowSig, not Code alone (avoids skipping a real L1 after a deep row
     reused the same Code).
═══════════════════════════════════════════════════ */
function BuildMergedRows(level1, level2, level3, level4) {
    var l1Rows = dedupeApiRows(level1 || []);
    var deeper = dedupeApiRows([].concat(level2 || [], level3 || [], level4 || []));
    var all = l1Rows.concat(deeper);

    var byParent = {};
    all.forEach(function (r) {
        var p = toParentKey(gp(r, 'MasterCode'));
        if (!byParent[p]) byParent[p] = [];
        byParent[p].push(r);
    });
    Object.keys(byParent).forEach(function (k) {
        byParent[k] = dedupeSiblingRows(byParent[k]);
        byParent[k] = sortRowsByHierarchy(byParent[k]);
    });

    var rootCodes = {};
    l1Rows.forEach(function (l) {
        rootCodes[toParentKey(gp(l, 'Code'))] = true;
    });

    var rows = [];
    var visited = {};
    var visitedBind = {};

    function walkChildren(parentRow) {
        var ck = toParentKey(gp(parentRow, 'Code'));
        (byParent[ck] || []).forEach(function (ch) {
            var chCode = toParentKey(gp(ch, 'Code'));
            if (rootCodes[chCode]) return;
            if (isRowSeen(ch, visited, visitedBind)) return;
            markRowSeen(ch, visited, visitedBind);
            rows.push(ch);
            walkChildren(ch);
        });
    }

    sortRowsByHierarchy(l1Rows).forEach(function (l1) {
        if (isRowSeen(l1, visited, visitedBind)) return;
        markRowSeen(l1, visited, visitedBind);
        rows.push(l1);
        walkChildren(l1);
    });

    return rows;
}

function GroupByParent(rows) {
    var map = {};
    (rows || []).forEach(function (r) {
        var p = toParentKey(gp(r, 'MasterCode'));
        if (!map[p]) map[p] = [];
        map[p].push(r);
    });
    Object.keys(map).forEach(function (k) {
        map[k] = sortRowsByHierarchy(map[k]);
    });
    return map;
}

/* ═══════════════════════════════════════════════════
   TOGGLE COLLAPSE / EXPAND
   • Keys use toParentKey so string/number Codes stay consistent.
   • Expanding re-shows the full subtree except branches still marked collapsed.
═══════════════════════════════════════════════════ */
function rowCollapsedKey(code) {
    return String(toParentKey(code));
}

function HideAllDescendants(parentCode, $tbody) {
    var p = toParentKey(parentCode);
    $tbody.find('tr').each(function () {
        var $tr = $(this);
        if (toParentKey($tr.attr('data-master')) !== p) return;
        $tr.hide();
        var cc = $tr.attr('data-code');
        if (cc !== undefined && cc !== null && cc !== '') {
            HideAllDescendants(cc, $tbody);
        }
    });
}

/** Show direct children of parentCode; recurse where child is not collapsed. */
function ShowDescendantsIfExpanded(parentCode, $tbody) {
    var p = toParentKey(parentCode);
    $tbody.find('tr').each(function () {
        var $tr = $(this);
        if (toParentKey($tr.attr('data-master')) !== p) return;
        $tr.show();
        var cc = $tr.attr('data-code');
        if (cc === undefined || cc === null || cc === '') return;
        var ck = rowCollapsedKey(cc);
        if (_collapsedRows[ck]) {
            HideAllDescendants(cc, $tbody);
        } else {
            ShowDescendantsIfExpanded(cc, $tbody);
        }
    });
}

function ToggleRow(parentCode, parentLevel, $btn) {
    var $tbody = $('#urd-tbody');
    var pk = rowCollapsedKey(parentCode);

    if (_collapsedRows[pk]) {
        delete _collapsedRows[pk];
        ShowDescendantsIfExpanded(parentCode, $tbody);
        $btn.find('i').removeClass('fa-plus').addClass('fa-minus');
    } else {
        HideAllDescendants(parentCode, $tbody);
        $btn.find('i').removeClass('fa-minus').addClass('fa-plus');
        _collapsedRows[pk] = true;
    }
}

/** After load: only top module rows visible; + opens nested rows (less noise at first). */
function ApplyDefaultCollapsedState($tbody) {
    _collapsedRows = {};
    $tbody.find('.urd-toggle-btn').each(function () {
        var $btn = $(this);
        var pc = $btn.attr('data-parent-code');
        if (pc === undefined || pc === '') return;
        HideAllDescendants(pc, $tbody);
        $btn.find('i').removeClass('fa-minus').addClass('fa-plus');
        _collapsedRows[rowCollapsedKey(pc)] = true;
    });
}

/* ═══════════════════════════════════════════════════
   CELL CLICK → SAVE RIGHT
═══════════════════════════════════════════════════ */
function OnCellClick($cell) {
    var moduleCode = parseInt($cell.data('module-code'));
    var moduleType = $cell.data('module-type');
    var groupCode  = parseInt($cell.data('group-code'));
    var currentVal = $cell.data('value');

    if (!groupCode) {
        toastr.warning('Group not mapped. Please reload the page.');
        return;
    }

    var newAction = (currentVal === 'Y') ? 'N' : 'Y';
    $cell.data('value', newAction);
    UpdateCellUI($cell, newAction, true);

    var authKey  = JSON.parse(sessionStorage.getItem('authKey') || '{}');
    var userCode = authKey.UserMaster_Code || 0;

    UserRightDashboardService.SaveUserModuleRight({
        CompanyCode    : _currentCompanyCode,
        GroupCode      : groupCode,
        ModuleCode     : moduleCode,
        ModuleType     : moduleType,
        Action         : newAction,
        UserMaster_Code: userCode,
        IPAddress      : '1',
        Location       : '1'
    })
    .then(function (res) {
        var ok  = res && (res.Status === 'Success' || res.status === 'Success' || res.Success === true);
        var msg = (res && (res.Msg || res.msg)) || (ok ? 'Saved.' : 'Failed.');
        if (ok) {
            _urdApiResponseCache = { key: '', payload: null, ts: 0 };
            UpdateCellUI($cell, newAction, false);
            toastr.success(msg);
        } else {
            $cell.data('value', currentVal);
            UpdateCellUI($cell, currentVal, false);
            toastr.error(msg);
        }
    })
    .catch(function () {
        $cell.data('value', currentVal);
        UpdateCellUI($cell, currentVal, false);
        toastr.error('Failed to save rights.');
    });
}

function UpdateCellUI($cell, val, saving) {
    if (saving) {
        $cell.html('<span class="urd-badge-saving"><i class="fas fa-spinner fa-spin"></i></span>');
        return;
    }
    $cell.html(val === 'Y'
        ? '<span class="urd-badge-y" title="Click to Revoke"><i class="fas fa-check"></i></span>'
        : '<span class="urd-badge-n" title="Click to Grant"><i class="fas fa-xmark"></i></span>');
}

/* ═══════════════════════════════════════════════════
   MODULE ICON
═══════════════════════════════════════════════════ */
function GetModuleIcon(moduleType, lavel) {
    if (lavel === 1 || moduleType === 'N') return '<i class="fas fa-layer-group urd-icon-n"></i>';
    if (moduleType === 'M')                return '<i class="fas fa-folder      urd-icon-m"></i>';
    if (moduleType === 'S')                return '<i class="fas fa-circle-dot  urd-icon-s"></i>';
    if (moduleType === 'O')                return '<i class="fas fa-key         urd-icon-o"></i>';
    return '<i class="fas fa-circle-dot urd-icon-s"></i>';
}

/* ═══════════════════════════════════════════════════
   UI HELPERS
═══════════════════════════════════════════════════ */
function SetLoadingState(loading) {
    if (loading) {
        $('#btnGo').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Loading…');
        $('#urd-loading').show();
        $('#urd-table-wrap').hide();
        $('#urd-summary').hide();
        $('#urd-placeholder').hide();
    } else {
        $('#btnGo').prop('disabled', false).html('<i class="fas fa-play"></i> Load dashboard');
        $('#urd-loading').hide();
    }
}

function ShowPlaceholder(type) {
    $('#urd-table-wrap').hide();
    $('#urd-summary').hide();
    var $ph = $('#urd-placeholder');
    if (type === 'empty') {
        $ph.html(
            '<i class="fas fa-table-list urd-ph-icon"></i>' +
            '<div class="urd-ph-title">No Data Found</div>' +
            '<div class="urd-ph-text">No module data returned. Please check the API.</div>').show();
    } else {
        $ph.html(
            '<i class="fas fa-circle-exclamation urd-ph-icon" style="color:#ef4444"></i>' +
            '<div class="urd-ph-title" style="color:#ef4444">Error Loading Data</div>' +
            '<div class="urd-ph-text">Could not connect to server. Please try again.</div>').show();
    }
}

function extractArray(res) {
    if (Array.isArray(res))         return res;
    if (Array.isArray(res.data))    return res.data;
    if (Array.isArray(res.Data))    return res.Data;
    return [];
}

function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
