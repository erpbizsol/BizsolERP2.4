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

/** Lazy tree — only L1 is in the DOM until a row is expanded. */
var _urdRowsByParent = {};
var _urdChildCount = {};
var _urdGroupCols = [];
var _urdCatIndex = 0;

// Fixed SP columns — everything else is a group column
var FIXED_COLS = ['+/-', 'lavel', 'level', 'rowadded', 'rowaddedcount', 'code', 'mastercode', 'sortorder', 'moduletype', 'module'];
var FIXED_COL_SET = {};
for (var _fc = 0; _fc < FIXED_COLS.length; _fc++) FIXED_COL_SET[FIXED_COLS[_fc]] = 1;

function isFixedCol(key) {
    return !!FIXED_COL_SET[String(key || '').toLowerCase()];
}

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

/** Parent link — SP may send MasterCode, UserModuleMaster_Code, or MasterModuleCode. */
function getRowMasterCode(r) {
    var mc = gp(r, 'MasterCode');
    if (mc !== undefined && mc !== null && mc !== '') return mc;
    mc = gp(r, 'UserModuleMaster_Code');
    if (mc !== undefined && mc !== null && mc !== '') return mc;
    mc = gp(r, 'MasterModuleCode');
    if (mc !== undefined && mc !== null && mc !== '') return mc;
    return 0;
}

/** Module / operation label — SP may send Module, OptionDesp, or ModuleDesp. */
function getModuleName(r) {
    return String(
        gp(r, 'Module') || gp(r, 'OptionDesp') || gp(r, 'ModuleDesp') || ''
    ).trim();
}

/** Normalize one API row so tree bind always uses MasterCode + Module. */
function normalizeApiRow(r) {
    if (!r || typeof r !== 'object') return r;
    var row = Object.assign({}, r);
    var mod = getModuleName(row);
    if (mod) row.Module = mod;
    var mc = getRowMasterCode(row);
    if (mc !== undefined && mc !== null && mc !== '') row.MasterCode = mc;
    var lv = gp(row, 'Lavel');
    if (lv === undefined || lv === null || lv === '') {
        lv = gp(row, 'Level');
        if (lv !== undefined && lv !== null && lv !== '') row.Lavel = lv;
    }
    return row;
}

function normalizeApiRows(arr) {
    return (arr || []).map(normalizeApiRow);
}

/** One key for Code / MasterCode so "1086", 1086, 1086.0 group the same (fixes missing L3/L4 under parent). */
function toParentKey(v) {
    if (v === undefined || v === null || v === '') return 0;
    var n = Number(v);
    if (!isNaN(n) && isFinite(n)) return n;
    return String(v);
}

/** SP column is "Lavel" or "Level" (Excel export uses Level). */
function getRowLevel(r) {
    var lv = gp(r, 'Lavel');
    if (lv !== undefined && lv !== null && lv !== '') return parseInt(lv, 10) || 0;
    lv = gp(r, 'Level');
    return parseInt(lv, 10) || 0;
}

/** Unique row identity — Code + MasterCode (Lavel is display-only after tree bind). */
function rowSig(r) {
    return String(toParentKey(gp(r, 'Code'))) + '::' +
        String(toParentKey(getRowMasterCode(r)));
}

/** API may send "1 O", "2 O", or "0" (operation) — normalize to O/M/S/N. */
function normalizeModuleTypeVal(raw) {
    var mtype = String(raw === undefined || raw === null ? '' : raw).trim().toUpperCase();
    if (mtype === '0') return 'O';
    var m = mtype.match(/^(\d+)\s*([A-Z])$/);
    if (m) return m[2];
    if (/^[A-Z]$/.test(mtype)) return mtype;
    return mtype;
}

var KNOWN_OPERATION_NAMES = {
    new: 1, edit: 1, delete: 1, view: 1, preview: 1, print: 1,
    save: 1, cancel: 1, approve: 1, reject: 1, add: 1, update: 1
};

function isOptionTypeO(r) {
    return normalizeModuleTypeVal(gp(r, 'ModuleType')) === 'O';
}

function isOperationRow(r) {
    var lavel = getRowLevel(r);
    var mod   = normalizeGroupKey(getModuleName(r));
    return isOptionTypeO(r) || lavel >= 4 || !!KNOWN_OPERATION_NAMES[mod];
}

function rowQualityScore(r) {
    var lavel = getRowLevel(r);
    var mtype = normalizeModuleTypeVal(gp(r, 'ModuleType'));
    var so    = parseInt(gp(r, 'SortOrder'), 10);
    if (isNaN(so)) so = 9999;
    var score = lavel * 100;
    if (mtype === 'O') score += 50;
    else if (mtype === 'S') score += 20;
    if (so >= 1 && so <= 99) score += (100 - so);
    return score;
}

/** Prefer Level4/O row metadata; merge Y/N from all duplicates. */
function mergeDedupeRows(into, from) {
    mergeRowGroupValues(into, from);
    if (rowQualityScore(from) <= rowQualityScore(into)) return;
    Object.keys(from).forEach(function (k) {
        if (isFixedCol(k)) into[k] = from[k];
    });
    mergeRowGroupValues(into, from);
}

/**
 * Bind key: same MasterCode + Module label = one operation row.
 * Collapses Level3 stub + Level4 row (New/Edit/Delete/View) even when ModuleType differs ("S" vs "1 O").
 */
function rowBindSig(r) {
    var master = toParentKey(getRowMasterCode(r));
    var mod    = normalizeGroupKey(getModuleName(r));
    if (isOperationRow(r)) return String(master) + '::@op::' + mod;
    var mtype  = normalizeModuleTypeVal(gp(r, 'ModuleType'));
    return String(master) + '::' + mtype + '::' + mod;
}

function isGrantedVal(v) {
    var s = String(v === undefined || v === null ? '' : v).trim().toLowerCase();
    return s === 'y' || s === '1' || s === 'true' || s === 'yes';
}

/** Merge group-column Y/N from duplicate API rows — prefer Y over N. */
function mergeRowGroupValues(into, from) {
    if (!into || !from) return into;
    Object.keys(from).forEach(function (k) {
        if (isFixedCol(k)) return;
        var fv = from[k];
        if (isGrantedVal(fv)) {
            into[k] = 'Y';
        } else if (into[k] === undefined || into[k] === null || into[k] === '') {
            into[k] = fv;
        }
    });
    return into;
}

/** Drop duplicate rows — keep first by SortOrder; merge group values from later duplicates. */
function dedupeApiRows(arr) {
    var bySig = {};
    var byBind = {};
    var out = [];
    sortRowsByHierarchy(arr || []).forEach(function (r) {
        var sig = rowSig(r);
        var bind = rowBindSig(r);
        var existing = bySig[sig] || byBind[bind];
        if (existing) {
            mergeDedupeRows(existing, r);
            return;
        }
        var copy = Object.assign({}, r);
        bySig[sig] = copy;
        byBind[bind] = copy;
        out.push(copy);
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

/** CRUD names only — do not treat "View Attachments" as a folder-level stub. */
function isStandardCrudOp(r) {
    var mod = normalizeGroupKey(getModuleName(r));
    return !!KNOWN_OPERATION_NAMES[mod];
}

/** If parent has real screens, drop New/Edit/View stubs on the folder (keep ModuleType O). */
function filterDirectOpsWhenSubmodulesExist(children) {
    if (!children || !children.length) return children;
    var hasSubmodule = children.some(function (r) { return !isOperationRow(r); });
    if (!hasSubmodule) return children;
    return children.filter(function (r) {
        if (!isOperationRow(r)) return true;
        if (isOptionTypeO(r)) return true;
        return !isStandardCrudOp(r);
    });
}

/** When New/Edit/Delete/View all exist, drop Preview/Print template stubs. */
function filterExtraOperationStubs(rows) {
    if (!rows || !rows.length) return rows;
    var opNames = {};
    rows.forEach(function (r) {
        if (!isOperationRow(r)) return;
        opNames[normalizeGroupKey(getModuleName(r))] = true;
    });
    if (!(opNames.new && opNames.edit && opNames.delete && opNames.view)) return rows;
    return rows.filter(function (r) {
        if (!isOperationRow(r)) return true;
        var mod = normalizeGroupKey(getModuleName(r));
        return mod !== 'preview' && mod !== 'print';
    });
}

/** Last pass: one operation row per MasterCode + Module (after tree walk). */
function finalDedupeOperationRows(rows) {
    var seen = {};
    var out = [];
    (rows || []).forEach(function (r) {
        if (!isOperationRow(r)) {
            out.push(r);
            return;
        }
        var key = rowBindSig(r);
        if (seen[key]) {
            mergeDedupeRows(seen[key], r);
            return;
        }
        var copy = Object.assign({}, r);
        seen[key] = copy;
        out.push(copy);
    });
    return out;
}

function applyOperationRowFilters(rows) {
    rows = filterExtraOperationStubs(rows || []);
    var hasRealOps = rows.some(function (row) {
        var lavel = getRowLevel(row);
        return lavel >= 4 || normalizeModuleTypeVal(gp(row, 'ModuleType')) === 'O';
    });
    if (!hasRealOps) return rows;
    return rows.filter(function (row) {
        if (!isOperationRow(row)) return true;
        var lavel = getRowLevel(row);
        return lavel >= 4 || normalizeModuleTypeVal(gp(row, 'ModuleType')) === 'O';
    });
}

/** One row per MasterCode + module label among direct siblings; merge group values. */
function dedupeSiblingRows(rows) {
    var seenBind = {};
    var out = [];
    sortRowsByHierarchy(rows || []).forEach(function (r) {
        var bind = rowBindSig(r);
        if (seenBind[bind]) {
            mergeDedupeRows(seenBind[bind], r);
            return;
        }
        var copy = Object.assign({}, r);
        seenBind[bind] = copy;
        out.push(copy);
    });
    return applyOperationRowFilters(out);
}

function opBindKey(r) {
    return String(toParentKey(getRowMasterCode(r))) + '::' +
        normalizeGroupKey(getModuleName(r));
}

/**
 * SP returns 4 result sets. Drop L3 New/Edit stubs only when L4 has the SAME
 * name for that MasterCode. Keep ModuleType O (View/Add Attachments under 1035).
 */
function prepareDashboardLevels(level1, level2, level3, level4) {
    level1 = normalizeApiRows(level1 || []);
    level2 = normalizeApiRows(level2 || []);
    level3 = normalizeApiRows(level3 || []);
    level4 = normalizeApiRows(level4 || []);

    var l4OpNames = {};
    level4.forEach(function (r) {
        l4OpNames[opBindKey(r)] = true;
    });

    function keepUnlessDuplicateL4Stub(r) {
        if (isOptionTypeO(r) && !isStandardCrudOp(r)) return true;
        if (!isOperationRow(r)) return true;
        return !l4OpNames[opBindKey(r)];
    }

    return {
        level1: dedupeApiRows(level1),
        level2: dedupeApiRows(level2.filter(keepUnlessDuplicateL4Stub)),
        level3: dedupeApiRows(level3.filter(keepUnlessDuplicateL4Stub)),
        level4: dedupeApiRows(level4)
    };
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
        .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
        .replace(/\s*&\s*/g, ' & ')
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
        if (isFixedCol(k)) continue;
        var nk = normalizeGroupKey(k);
        if (!nk) continue;
        var v = row[k];
        var sv = (v === undefined || v === null || v === '') ? 'N' : String(v).trim();
        if (map[nk] === undefined || isGrantedVal(sv)) map[nk] = sv;
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
    var fromOpt = 0;
    $('.urd-group-chk').each(function () {
        if (normalizeGroupKey($(this).attr('data-label') || $(this).closest('label').text()) === t) {
            fromOpt = parseInt($(this).val(), 10) || 0;
            if (fromOpt) _groupMap[gName] = fromOpt;
            return false;
        }
    });
    return fromOpt || 0;
}

function resolveGroupCode(gName, preset) {
    var code = parseInt(preset, 10) || 0;
    if (code > 0) return code;
    return parseInt(getGroupCodeFromMap(gName), 10) || 0;
}

function syncUrdGroupSelectAllState() {
    var $all = $('.urd-group-chk');
    var total = $all.length;
    var checked = $all.filter(':checked').length;
    var $selectAll = $('#chkUrdGroupSelectAll');
    if (!$selectAll.length) return;
    $selectAll.prop('checked', total > 0 && checked === total);
    $selectAll.prop('indeterminate', checked > 0 && checked < total);
}

function updateUrdGroupTriggerText() {
    var labels = $('.urd-group-chk:checked').map(function () {
        return ($(this).attr('data-label') || '').toString().trim();
    }).get().filter(Boolean);

    var $text = $('#urdGroupTriggerText');
    if (!$text.length) return;

    if (!labels.length) {
        $text.text('All groups').addClass('is-placeholder');
        return;
    }

    var total = $('.urd-group-chk').length;
    if (labels.length === total && total > 0) {
        $text.text('All groups (' + total + ')').removeClass('is-placeholder');
        return;
    }

    var shown = labels.slice(0, 2).join(', ');
    if (labels.length > 2) {
        shown += ' +' + (labels.length - 2) + ' more';
    }
    $text.text(shown).removeClass('is-placeholder');
}

function positionUrdGroupPanel() {
    var trigger = document.getElementById('btnUrdGroupTrigger');
    var panel = document.getElementById('urdGroupPanel');
    if (!trigger || !panel) return;

    var rect = trigger.getBoundingClientRect();
    var top = rect.bottom + 4;
    var left = rect.left;
    var width = rect.width;
    var maxHeight = Math.max(160, Math.min(280, window.innerHeight - top - 16));

    panel.style.position = 'fixed';
    panel.style.top = top + 'px';
    panel.style.left = left + 'px';
    panel.style.width = width + 'px';
    panel.style.right = 'auto';
    panel.style.zIndex = '9999';

    var list = document.getElementById('urdGroupCheckList');
    if (list) {
        list.style.maxHeight = Math.max(120, maxHeight - 90) + 'px';
    }
}

function setUrdGroupDropdownOpen(isOpen) {
    var $root = $('#urdGroupMulti');
    if (!$root.length) return;
    $root.toggleClass('is-open', !!isOpen);
    $('#btnUrdGroupTrigger').attr('aria-expanded', isOpen ? 'true' : 'false');

    var panel = document.getElementById('urdGroupPanel');
    if (isOpen) {
        positionUrdGroupPanel();
        setTimeout(function () { $('#txtUrdGroupSearch').trigger('focus'); }, 0);
        $(window).off('scroll.urdGroupPanel resize.urdGroupPanel')
            .on('scroll.urdGroupPanel resize.urdGroupPanel', function () {
                if ($('#urdGroupMulti').hasClass('is-open')) {
                    positionUrdGroupPanel();
                }
            });
    } else {
        $(window).off('scroll.urdGroupPanel resize.urdGroupPanel');
        if (panel) {
            panel.style.position = '';
            panel.style.top = '';
            panel.style.left = '';
            panel.style.width = '';
            panel.style.right = '';
            panel.style.zIndex = '';
        }
        $('#txtUrdGroupSearch').val('');
        applyUrdGroupSearch('');
    }
}

function applyUrdGroupSearch(term) {
    var q = (term || '').toString().trim().toLowerCase();
    $('.urd-multi-checkbox-item').each(function () {
        var $item = $(this);
        var text = ($item.text() || '').trim().toLowerCase();
        $item.toggleClass('is-hidden', !!(q && text.indexOf(q) === -1));
    });
}

function onUrdGroupSelectionChanged() {
    syncUrdGroupSelectAllState();
    updateUrdGroupTriggerText();
    var codes = getSelectedGroupCodesFromUi();
    ScheduleLoadGroupUsers(codes);
    if (codes && codes.length) SetHeaderStep(2);
}

function bindUrdGroupMultiselectEvents() {
    $('#btnUrdGroupTrigger').off('click.urdGroup').on('click.urdGroup', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setUrdGroupDropdownOpen(!$('#urdGroupMulti').hasClass('is-open'));
    });

    $('#chkUrdGroupSelectAll').off('change.urdGroup').on('change.urdGroup', function () {
        var checked = $(this).is(':checked');
        $('.urd-group-chk').prop('checked', checked);
        onUrdGroupSelectionChanged();
    });

    $(document).off('change.urdGroup', '.urd-group-chk').on('change.urdGroup', '.urd-group-chk', function () {
        onUrdGroupSelectionChanged();
    });

    $('#txtUrdGroupSearch').off('input.urdGroup').on('input.urdGroup', function () {
        applyUrdGroupSearch($(this).val());
    });

    $('#urdGroupPanel').off('click.urdGroup').on('click.urdGroup', function (e) {
        e.stopPropagation();
    });

    $(document).off('click.urdGroupMulti').on('click.urdGroupMulti', function (e) {
        if (!$(e.target).closest('#urdGroupMulti').length) {
            setUrdGroupDropdownOpen(false);
        }
    });

    $(document).off('keydown.urdGroupMulti').on('keydown.urdGroupMulti', function (e) {
        if (e.key === 'Escape') setUrdGroupDropdownOpen(false);
    });
}

function setUsersPreview(text, title, hasUsers) {
    var $pv = $('#urdUsersPreview');
    if (!$pv.length) return;
    $pv.toggleClass('has-users', !!hasUsers)
        .attr('title', title || '')
        .val(text || '');
    if (!hasUsers && !text) {
        $pv.attr('placeholder', 'Select groups to preview users');
    }
}

function cellValueHtml(val, canEdit) {
    var granted = val === 'Y';
    var cls = granted ? 'urd-cell-granted' : 'urd-cell-empty';
    var tip = granted
        ? (canEdit ? 'Granted (Y) — click for N' : 'Granted (Y)')
        : (canEdit ? 'No access (N) — click for Y' : 'No access (N)');
    return '<span class="' + cls + '" title="' + tip + '">' + (granted ? 'Y' : 'N') + '</span>';
}

/* ═══════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════ */
$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    bindUrdGroupMultiselectEvents();
    LoadInitialData();
    $('#btnGo').on('click', LoadDashboard);
    $(document).on('input', '#urdModuleSearch', function () { FilterMatrixRows($(this).val()); });
    $('#ddlCompany').on('change', function () {
        SetHeaderStep(1);
    });
    SetHeaderStep(1);
});

function SetHeaderStep(n) {
    $('#urdHeaderSteps .urd-step').removeClass('is-active');
    $('#urdHeaderSteps .urd-step[data-step="' + n + '"]').addClass('is-active');
}

function initUsersSelect2() {
    /* Users shown via #urdUsersPreview — hidden select kept for data only */
}

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
            RenderGroupMultiselect(extractArray(results[1]));
            ShowUserListIdle();
        })
        .catch(function () {
            toastr.error('Failed to load company or group list.');
            RenderCompanyDropdown([]);
            RenderGroupMultiselect([]);
            ShowUserListIdle();
        });
}

function RenderCompanyDropdown(rows) {
    var $sel = $('#ddlCompany').empty().append('<option value="0">— Select Company —</option>');
    rows.forEach(function (c) {
        $sel.append($('<option>').val(c.Code || c.CompanyCode).text(c.CompanyName || c.Name || c.CompanyCode));
    });
}

function RenderGroupMultiselect(rows) {
    _groupMap = {};
    var $list = $('#urdGroupCheckList');
    if (!$list.length) return;

    $list.empty();
    $('#txtUrdGroupSearch').val('');

    if (!rows.length) {
        $list.append(
            $('<div>', { class: 'urd-multi-empty' }).text('No groups found.')
        );
        syncUrdGroupSelectAllState();
        updateUrdGroupTriggerText();
        setUrdGroupDropdownOpen(false);
        return;
    }

    rows.forEach(function (g) {
        var code = g.Code || g.GroupCode;
        var name = g.GroupName || g.Name;
        if (!code || !name) return;
        _groupMap[name] = code;

        var id = 'chkUrdGroup_' + code;
        var $item = $('<div>', { class: 'urd-multi-checkbox-item' });
        var $label = $('<label>', { for: id });
        $label.append(
            $('<input>', {
                type: 'checkbox',
                id: id,
                class: 'urd-group-chk',
                value: code,
                'data-label': name
            })
        );
        $label.append($('<span>').text(name));
        $item.append($label);
        $list.append($item);
    });

    syncUrdGroupSelectAllState();
    updateUrdGroupTriggerText();
    setUrdGroupDropdownOpen(false);
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
 * Group checkbox multi-select:
 * • None checked → null → all group columns + all users.
 * • One or more checked → filter columns (client) and users (API comma list).
 */
function getSelectedGroupCodesFromUi() {
    var nums = $('.urd-group-chk:checked').map(function () {
        return parseInt($(this).val(), 10);
    }).get().filter(function (n) {
        return !isNaN(n) && n > 0;
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
    var $sel = $('#ddlUsers');

    if (_urdUserListCache.key === cacheKey && _urdUserListCache.rows &&
        (now - _urdUserListCache.ts) < URD_USER_CACHE_MS) {
        RenderUserList(_urdUserListCache.rows, selectedCodes);
        return;
    }

    if (_urdUserListReq && _urdUserListReq.readyState !== 4) {
        _urdUserListReq.abort();
    }

    $sel.empty();
    setUsersPreview('Loading users…', '', false);

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
    $('#ddlUsers').empty();
    setUsersPreview('Select groups to preview users', '', false);
}

function RenderUserListError() {
    $('#urdUserCount').text('—');
    $('#ddlUsers').empty();
    setUsersPreview('User preview unavailable', 'You can still load the dashboard', false);
}

function RenderUserList(rows, selectedCodes) {
    var $sel = $('#ddlUsers');
    $('#urdUserCount').text(String(rows.length));

    $sel.empty();

    if (!rows.length) {
        var emptyMsg = (selectedCodes && selectedCodes.length)
            ? 'No users in selected group(s)'
            : 'Select groups to preview users';
        setUsersPreview(emptyMsg, '', false);
        return;
    }

    var names = [];
    rows.forEach(function (u) {
        var name = u.UserName || u.userName || u.UserID || u.userID || '—';
        var uid  = String(u.UserID || u.userID || name);
        var grp  = u.GroupName || u.groupName || '';
        var label = grp ? (name + ' · ' + grp) : name;
        $sel.append($('<option>').val(uid).text(label));
        names.push(label);
    });

    var preview = names.join('\n');
    setUsersPreview(preview, rows.length + ' user(s)', true);
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
        scheduleRenderDashboard(_urdApiResponseCache.payload, selectedCodes);
        return;
    }

    SetLoadingState(true);
    SetHeaderStep(3);
    LoadGroupUsers(selectedCodes);

    UserRightDashboardService.GetUserRightDashboard(_currentCompanyCode, _currentGroupCode)
        .then(function (res) {
            _urdApiResponseCache = { key: apiCacheKey, payload: res, ts: Date.now() };
            _dashboardRes  = res;
            scheduleRenderDashboard(res, selectedCodes);
        })
        .catch(function (err) {
            console.error('URD error:', err);
            toastr.error('Failed to load User Right Dashboard.');
            ShowPlaceholder('error');
            SetLoadingState(false);
        });
}

/** Yield a frame so the spinner paints, then bind/render off the API JSON. */
function scheduleRenderDashboard(res, selectedCodes) {
    SetHeaderStep(3);
    requestAnimationFrame(function () {
        try {
            RenderDashboard(res, selectedCodes);
        } catch (err) {
            console.error('URD render:', err);
            toastr.error('Failed to build User Right Dashboard.');
            ShowPlaceholder('error');
        }
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

    if (groups.length && typeof groups[0] === 'object') {
        groups.forEach(function (g) {
            var gName = g.GroupName || g.Name || g.name || '';
            var gCode = g.Code || g.GroupCode || g.groupCode || 0;
            if (gName && gCode) _groupMap[gName] = gCode;
        });
        groups = groups.map(function (g) {
            return g.GroupName || g.Name || g.name || '';
        }).filter(Boolean);
    }

    groups = resolveGroupColumnOrder(groups, level1, level2, level3, level4);

    return { level1: level1, level2: level2, level3: level3, level4: level4, groups: groups };
}

/** API Groups first, then any extra group keys found in Level1–Level4 rows. */
function resolveGroupColumnOrder(apiGroups, level1, level2, level3, level4) {
    var seen = {};
    var order = [];

    function addName(name) {
        var nk = normalizeGroupKey(name);
        if (!nk || seen[nk]) return;
        seen[nk] = name;
        order.push(name);
    }

    (apiGroups || []).forEach(addName);

    [level1, level2, level3, level4].forEach(function (rows) {
        var limit = Math.min((rows || []).length, 3);
        for (var i = 0; i < limit; i++) {
            Object.keys(rows[i] || {}).forEach(function (k) {
                if (!isFixedCol(k)) addName(k);
            });
        }
    });

    return order;
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
    if (!groups.length) {
        groups = Object.keys(_groupMap);
    }

    if (!level1.length && !level2.length && !level3.length) {
        ShowPlaceholder('empty');
        return;
    }

    // Summary (toolbar pills)
    $('#urd-count-groups, #urd-banner-groups').text(groups.length);
    $('#urd-count-modules, #urd-banner-modules').text(level1.length);
    // Update header chips
    $('#urd-placeholder').hide();
    $('#urd-table-wrap').show();
    $('#urd-table-toolbar').show();

    // ─ Column widths — module name + group cols ─
    var colModule = 300;
    var colAccessMin = 140;
    var tableW = colModule + groups.length * colAccessMin;
    var $table = $('.urd-table-matrix');
    $table.css({ width: tableW + 'px', minWidth: tableW + 'px', maxWidth: tableW + 'px' });

    var $colgroup = $('#urd-colgroup').empty();
    $colgroup.append('<col class="urd-col-module" style="width:' + colModule + 'px">');
    groups.forEach(function () {
        $colgroup.append('<col class="urd-col-access" style="width:' + colAccessMin + 'px">');
    });

    // ─ Build Header ─
    var $thead = $('#urd-thead').empty();
    var $hr = $('<tr>');
    $hr.append(
        '<th class="urd-th-fixed urd-th-module">' +
        '<div class="urd-th-module-inner">' +
        '<span class="urd-th-module-label"><i class="fas fa-cubes"></i> Module</span>' +
        '</div></th>'
    );
    groups.forEach(function (gName) {
        $hr.append(
            '<th class="urd-th-user" title="' + escHtml(gName) + '">' +
            escHtml(gName) +
            '</th>');
    });
    $thead.append($hr);

    // ─ Build Body (lazy: only main-menu rows in the DOM) ─
    var mergedRows = BuildMergedRows(level1, level2, level3, level4);
    _urdRowsByParent = GroupByParent(mergedRows);
    _urdChildCount = {};
    _urdCatIndex = 0;
    _collapsedRows = {};
    _urdGroupCols = groups.map(function (gName) {
        return {
            name: gName,
            code: resolveGroupCode(gName, getGroupCodeFromMap(gName))
        };
    });

    mergedRows.forEach(function (r) {
        var pk = toParentKey(getRowMasterCode(r));
        if (pk !== 0 && pk !== '0' && pk !== '') {
            _urdChildCount[pk] = (_urdChildCount[pk] || 0) + 1;
        }
    });

    var rootHtml = [];
    mergedRows.forEach(function (row) {
        var mc = toParentKey(getRowMasterCode(row));
        if (mc !== 0 && mc !== '0') return;
        if (isOperationRow(row)) return;
        rootHtml.push(buildRowHtml(row));
        _collapsedRows[rowCollapsedKey(gp(row, 'Code'))] = true;
    });

    var $tbody = $('#urd-tbody');
    $tbody[0].innerHTML = rootHtml.join('');

    $tbody.off('click.urdToggle').on('click.urdToggle', '.urd-toggle-btn', function (e) {
        e.stopPropagation();
        var $btn = $(this);
        ToggleRow($btn.attr('data-parent-code'), $btn.data('level'), $btn);
    });
    $tbody.off('click.urdAccess').on('click.urdAccess', '.urd-td-access', function () {
        var $cell = $(this);
        if ($cell.hasClass('urd-td-category-gap') || $cell.hasClass('is-readonly')) return;
        OnCellClick($cell);
    });

    $('#urdModuleSearch').val('');
}

function buildRowHtml(row) {
    var groupNormMap = buildRowGroupNormMap(row);
    var lavel      = getRowLevel(row) || 1;
    var code       = gp(row, 'Code');
    var masterCode = parseInt(getRowMasterCode(row), 10);
    if (isNaN(masterCode)) masterCode = 0;
    var moduleType = normalizeModuleTypeVal(gp(row, 'ModuleType'));
    var moduleName = getModuleName(row).replace(/^\s+/, '');
    var modulePath = Array.isArray(row._urdPath) && row._urdPath.length
        ? row._urdPath
        : [moduleName];
    var rowAdded   = String(gp(row, 'RowAdded') || 'N').trim();
    var codeKey    = toParentKey(code);
    var isLeafOp   = isOptionTypeO(row) || isOperationRow(row);
    var hasKids    = !isLeafOp && (_urdChildCount[codeKey] || 0) > 0;
    var isCategory = lavel === 1 && masterCode === 0 && rowAdded !== 'Y';

    var cells = '';
    for (var g = 0; g < _urdGroupCols.length; g++) {
        var col = _urdGroupCols[g];
        var rawVal = readGroupCell(row, groupNormMap, col.name);
        var val = isGrantedVal(rawVal) ? 'Y' : 'N';
        cells += buildAccessCellHtml(val, code, moduleType, col.code, col.name);
    }

    var trCls = 'urd-row-level-' + lavel;
    if (isCategory) {
        trCls += ' urd-row-category urd-cat-' + (_urdCatIndex % 6);
        _urdCatIndex++;
    }

    var tr = '<tr class="' + trCls + '"' +
        ' data-code="' + escHtml(String(code)) + '"' +
        ' data-master="' + masterCode + '"' +
        ' data-level="' + lavel + '"' +
        ' data-leaf-op="' + (isLeafOp ? '1' : '0') + '"' +
        ' data-kids-ready="0">';

    if (isCategory) {
        return tr +
            '<td class="urd-td-module urd-td-category">' +
            '<div class="urd-mod-row">' +
            buildToggleBtn(code, lavel) +
            '<div class="urd-cat-inner">' +
            '<span class="urd-cat-label">' + GetModuleIcon(moduleType, lavel) + escHtml(moduleName) + '</span>' +
            '<span class="urd-cat-badge">' + (_urdChildCount[codeKey] || 0) + '</span>' +
            '</div></div></td>' + cells + '</tr>';
    }

    var indent = Math.max(0, lavel - 1) * 18;
    var toggleHtml = hasKids
        ? buildToggleBtn(code, lavel)
        : '<span class="urd-toggle-spacer"></span>';
    return tr +
        '<td class="urd-td-module" title="' + escHtml(modulePath.join(' > ')) + '">' +
        '<div class="urd-mod-row">' +
        toggleHtml +
        '<span class="urd-mod-text" style="padding-left:' + indent + 'px">' +
        GetModuleIcon(moduleType, lavel) + escHtml(moduleName) + '</span>' +
        '</div></td>' + cells + '</tr>';
}

/* ═══════════════════════════════════════════════════
   BUILD MERGED ROW ORDER — Level + MasterCode (same as SP)
   Level 1 AND MasterCode = 0  →  main menu (Masters, Transactions, …)
   Child.MasterCode === Parent.Code  →  nest under that parent
   Grid path: Master > Marketing > Payment Terms Master > New
═══════════════════════════════════════════════════ */
function GroupByParent(rows) {
    var map = {};
    (rows || []).forEach(function (r) {
        var p = toParentKey(getRowMasterCode(r));
        if (!map[p]) map[p] = [];
        map[p].push(r);
    });
    Object.keys(map).forEach(function (k) {
        map[k] = sortRowsByHierarchy(map[k]);
    });
    return map;
}

function indexRowsByCode(rows) {
    var byCode = {};
    (rows || []).forEach(function (r) {
        var c = toParentKey(gp(r, 'Code'));
        if (c === 0 || c === '0') return;
        var cur = byCode[c];
        if (!cur) {
            byCode[c] = r;
            return;
        }
        // Never let an option (O) steal a screen's Code (Vendor Master 1035)
        if (isOperationRow(cur) && !isOperationRow(r)) {
            byCode[c] = r;
            return;
        }
        if (!isOperationRow(cur) && isOperationRow(r)) return;
        if (rowQualityScore(r) > rowQualityScore(cur)) byCode[c] = r;
    });
    return byCode;
}

/** If MasterCode points at a New/Edit stub, walk up to the real screen. Never become 0. */
function resolveTrueParentCode(row, byCode) {
    var original = toParentKey(getRowMasterCode(row));
    var mc = original;
    var lastGood = original;
    var seen = {};
    var hops = 0;
    while (mc && mc !== 0 && mc !== '0' && !seen[mc] && hops++ < 8) {
        seen[mc] = true;
        var parent = byCode[mc];
        if (!parent) return lastGood;
        if (!isOperationRow(parent)) return mc;
        lastGood = mc;
        var up = toParentKey(getRowMasterCode(parent));
        if (!up || up === 0 || up === '0') return lastGood;
        mc = up;
    }
    return lastGood || original;
}

function reparentRowsToRealMaster(rows, byCode) {
    (rows || []).forEach(function (r) {
        r.MasterCode = resolveTrueParentCode(r, byCode);
    });
    return rows;
}

/** One New/Edit/View per MasterCode after reparent (L3 stub + L4 row → one row). */
function collapseOpsByMasterAndName(rows) {
    var modules = [];
    var best = {};
    var opOrder = [];
    (rows || []).forEach(function (r) {
        if (!isOperationRow(r)) {
            modules.push(r);
            return;
        }
        var key = String(toParentKey(getRowMasterCode(r))) + '::@op::' +
            normalizeGroupKey(getModuleName(r));
        if (best[key]) {
            mergeDedupeRows(best[key], r);
            return;
        }
        var copy = Object.assign({}, r);
        best[key] = copy;
        opOrder.push(copy);
    });
    return modules.concat(opOrder);
}

function isTopLevelRoot(r) {
    var mc = toParentKey(getRowMasterCode(r));
    if (mc !== 0 && mc !== '0') return false;
    var lv = getRowLevel(r);
    return lv <= 1;
}

function BuildMergedRows(level1, level2, level3, level4) {
    var prepared = prepareDashboardLevels(level1, level2, level3, level4);
    var all = []
        .concat(prepared.level1)
        .concat(prepared.level2)
        .concat(prepared.level3)
        .concat(prepared.level4)
        .map(function (r) { return Object.assign({}, r); });

    var byCode = indexRowsByCode(all);
    reparentRowsToRealMaster(all, byCode);
    all = collapseOpsByMasterAndName(dedupeApiRows(all));
    byCode = indexRowsByCode(all);

    var byParent = GroupByParent(all);
    var rows = [];
    var visited = {};
    var usedBind = {};
    var pathByCode = {};

    function rememberPath(r) {
        var ck = toParentKey(gp(r, 'Code'));
        if (ck !== 0 && ck !== '0' && r._urdPath) pathByCode[ck] = r._urdPath;
    }

    function indexOfCode(code) {
        var pk = toParentKey(code);
        for (var i = 0; i < rows.length; i++) {
            if (toParentKey(gp(rows[i], 'Code')) === pk) return i;
        }
        return -1;
    }

    /** Last row in the DFS block that belongs under parentCode. */
    function lastIndexOfSubtree(parentCode) {
        var start = indexOfCode(parentCode);
        if (start < 0) return -1;
        var parentKeys = {};
        parentKeys[toParentKey(parentCode)] = true;
        var last = start;
        for (var i = start + 1; i < rows.length; i++) {
            var mc = toParentKey(getRowMasterCode(rows[i]));
            if (!parentKeys[mc]) break;
            parentKeys[toParentKey(gp(rows[i], 'Code'))] = true;
            last = i;
        }
        return last;
    }

    function pushRow(r, underParentCode) {
        if (!r) return false;
        var sig = rowSig(r);
        var bind = rowBindSig(r);
        if (visited[sig]) return false;
        if (usedBind[bind]) {
            mergeDedupeRows(usedBind[bind], r);
            visited[sig] = true;
            return false;
        }
        visited[sig] = true;
        usedBind[bind] = r;
        if (underParentCode !== undefined && underParentCode !== null && underParentCode !== '') {
            var at = lastIndexOfSubtree(underParentCode);
            if (at < 0) {
                visited[sig] = false;
                delete usedBind[bind];
                return false;
            }
            rows.splice(at + 1, 0, r);
        } else {
            rows.push(r);
        }
        rememberPath(r);
        return true;
    }

    function childrenOf(parentCode) {
        var kids = dedupeSiblingRows((byParent[toParentKey(parentCode)] || []).slice());
        var optionRows = [];
        var otherRows = [];
        kids.forEach(function (r) {
            if (isOptionTypeO(r)) optionRows.push(r);
            else otherRows.push(r);
        });
        return filterDirectOpsWhenSubmodulesExist(otherRows).concat(
            sortRowsByHierarchy(optionRows)
        );
    }

    function walk(parentCode, depth, pathParts) {
        childrenOf(parentCode).forEach(function (child) {
            var node = Object.assign({}, child);
            var apiLv = getRowLevel(child);
            node.Lavel = apiLv > 0 ? apiLv : depth;
            node._urdPath = pathParts.concat(getModuleName(node));
            if (!pushRow(node)) return;
            if (isOptionTypeO(node) || isOperationRow(node)) return;
            walk(gp(node, 'Code'), node.Lavel + 1, node._urdPath);
        });
    }

    function findRowByCode(code) {
        var ck = toParentKey(code);
        if (byCode[ck]) return byCode[ck];
        for (var i = 0; i < all.length; i++) {
            if (toParentKey(gp(all[i], 'Code')) === ck) return all[i];
        }
        return null;
    }

    /** Put missing parent (e.g. Vendor Master) back in the tree, then the option. */
    function ensureRendered(code, guard) {
        var ck = toParentKey(code);
        if (!ck || ck === 0 || ck === '0') return true;
        if (pathByCode[ck] || indexOfCode(ck) >= 0) return true;
        if (guard[ck]) return false;
        guard[ck] = true;
        var parentRow = findRowByCode(ck);
        if (!parentRow) return false;
        var gmc = toParentKey(getRowMasterCode(parentRow));
        if (gmc && gmc !== 0 && gmc !== '0') {
            if (!ensureRendered(gmc, guard)) return false;
        }
        var node = Object.assign({}, parentRow);
        var pPath = pathByCode[gmc] || [];
        node.Lavel = getRowLevel(node) || (pPath.length + 1);
        node._urdPath = pPath.concat(getModuleName(node));
        if (gmc && gmc !== 0 && gmc !== '0') return pushRow(node, gmc);
        return pushRow(node);
    }

    // Main menu only: Level 1 + MasterCode = 0
    var roots = sortRowsByHierarchy(all.filter(isTopLevelRoot));
    if (!roots.length) {
        roots = sortRowsByHierarchy(all.filter(function (r) {
            var mc = toParentKey(getRowMasterCode(r));
            return (mc === 0 || mc === '0') && !isOperationRow(r);
        }));
    }

    roots.forEach(function (r) {
        if (isOperationRow(r)) return;
        var node = Object.assign({}, r);
        node.Lavel = 1;
        node._urdPath = [getModuleName(node)];
        pushRow(node);
        walk(gp(node, 'Code'), 2, node._urdPath);
    });

    // Missed Level 3/4 options — insert under their MasterCode, never after last menu (WEB)
    all.forEach(function (r) {
        if (visited[rowSig(r)] || usedBind[rowBindSig(r)]) return;
        var pk = toParentKey(getRowMasterCode(r));
        if (!pk || pk === 0 || pk === '0') return;
        var hopParent = findRowByCode(pk);
        if (hopParent && isOperationRow(hopParent)) {
            pk = toParentKey(getRowMasterCode(hopParent));
            if (!pk || pk === 0 || pk === '0') return;
        }
        if (!ensureRendered(pk, {})) return;
        var node = Object.assign({}, r);
        var parentPath = pathByCode[pk] || [];
        var parent = findRowByCode(pk);
        var parentLv = parent ? (getRowLevel(parent) || parentPath.length) : parentPath.length;
        node.Lavel = getRowLevel(r) || (parentLv + 1);
        node._urdPath = parentPath.concat(getModuleName(node));
        if (!pushRow(node, pk)) return;
        if (isOptionTypeO(node) || isOperationRow(node)) return;
        walk(gp(node, 'Code'), node.Lavel + 1, node._urdPath);
    });

    return finalDedupeOperationRows(rows);
}

/* ═══════════════════════════════════════════════════
   TOGGLE COLLAPSE / EXPAND
   • Keys use toParentKey so string/number Codes stay consistent.
   • Expanding re-shows the full subtree except branches still marked collapsed.
═══════════════════════════════════════════════════ */
function rowCollapsedKey(code) {
    return String(toParentKey(code));
}

function buildDomChildIndex($tbody) {
    var map = {};
    var list = $tbody[0] ? $tbody[0].rows : [];
    for (var i = 0; i < list.length; i++) {
        var tr = list[i];
        var m = toParentKey(tr.getAttribute('data-master'));
        if (!map[m]) map[m] = [];
        map[m].push(tr);
    }
    return map;
}

function HideAllDescendants(parentCode, $tbody, idx) {
    idx = idx || buildDomChildIndex($tbody);
    var kids = idx[toParentKey(parentCode)] || [];
    for (var i = 0; i < kids.length; i++) {
        kids[i].style.display = 'none';
        HideAllDescendants(kids[i].getAttribute('data-code'), $tbody, idx);
    }
}

function ShowDescendantsIfExpanded(parentCode, $tbody, idx) {
    idx = idx || buildDomChildIndex($tbody);
    var kids = idx[toParentKey(parentCode)] || [];
    for (var i = 0; i < kids.length; i++) {
        kids[i].style.display = '';
        var cc = kids[i].getAttribute('data-code');
        if (cc === undefined || cc === null || cc === '') continue;
        if (_collapsedRows[rowCollapsedKey(cc)]) {
            HideAllDescendants(cc, $tbody, idx);
        } else {
            ShowDescendantsIfExpanded(cc, $tbody, idx);
        }
    }
}

function ensureChildrenInDom($tr) {
    if (!$tr.length || $tr.attr('data-kids-ready') === '1') return;
    var kids = _urdRowsByParent[toParentKey($tr.attr('data-code'))] || [];
    if (kids.length) {
        var html = '';
        for (var i = 0; i < kids.length; i++) {
            html += buildRowHtml(kids[i]);
            var child = kids[i];
            var isLeaf = isOptionTypeO(child) || isOperationRow(child);
            var ck = toParentKey(gp(child, 'Code'));
            if (!isLeaf && (_urdChildCount[ck] || 0) > 0) {
                _collapsedRows[rowCollapsedKey(ck)] = true;
            }
        }
        $tr.after(html);
    }
    $tr.attr('data-kids-ready', '1');
}

function ToggleRow(parentCode, parentLevel, $btn) {
    var $tbody = $('#urd-tbody');
    var $tr = $btn.closest('tr');
    var pk = rowCollapsedKey(parentCode);

    if (_collapsedRows[pk]) {
        delete _collapsedRows[pk];
        ensureChildrenInDom($tr);
        ShowDescendantsIfExpanded(parentCode, $tbody);
        $btn.find('i').removeClass('fa-plus').addClass('fa-minus');
    } else {
        HideAllDescendants(parentCode, $tbody);
        $btn.find('i').removeClass('fa-minus').addClass('fa-plus');
        _collapsedRows[pk] = true;
    }
}

/* ═══════════════════════════════════════════════════
   CELL CLICK → SAVE RIGHT
═══════════════════════════════════════════════════ */
function collectDescendantDataRows(parentCode) {
    var out = [];
    var stack = [toParentKey(parentCode)];
    var seen = {};
    while (stack.length) {
        var p = stack.pop();
        if (seen[p]) continue;
        seen[p] = true;
        var kids = _urdRowsByParent[p] || [];
        for (var k = 0; k < kids.length; k++) {
            out.push(kids[k]);
            stack.push(toParentKey(gp(kids[k], 'Code')));
        }
    }
    return out;
}

function findGroupCell($tr, gName) {
    var cells = $tr[0].querySelectorAll('.urd-td-access');
    for (var i = 0; i < cells.length; i++) {
        var $c = $(cells[i]);
        if (String($c.data('group-name') || '') === String(gName || '')) return $c;
    }
    return null;
}

function saveRightPayload(moduleCode, moduleType, groupCode, action) {
    var authKey = JSON.parse(sessionStorage.getItem('authKey') || '{}');
    return UserRightDashboardService.SaveUserModuleRight({
        CompanyCode    : _currentCompanyCode,
        GroupCode      : groupCode,
        ModuleCode     : moduleCode,
        ModuleType     : moduleType,
        Action         : action,
        UserMaster_Code: authKey.UserMaster_Code || 0,
        IPAddress      : '1',
        Location       : '1'
    });
}

function isSaveOk(res) {
    return !!(res && (res.Status === 'Success' || res.status === 'Success' || res.Success === true));
}

function OnCellClick($cell) {
    var moduleCode = parseInt($cell.data('module-code'), 10);
    var moduleType = $cell.data('module-type');
    var groupName  = $cell.data('group-name');
    var groupCode  = resolveGroupCode(groupName, $cell.data('group-code'));
    var currentVal = $cell.data('value');

    if (!groupCode || !moduleCode) return;

    var newAction = (currentVal === 'Y') ? 'N' : 'Y';
    var $tr = $cell.closest('tr');
    var isLeafOp = $tr.attr('data-leaf-op') === '1';

    var cascade = [];
    if (newAction === 'N' && !isLeafOp) {
        var dataKids = collectDescendantDataRows($tr.attr('data-code'));
        var $tbody = $tr.parent();
        for (var i = 0; i < dataKids.length; i++) {
            var drow = dataKids[i];
            var dCode = gp(drow, 'Code');
            var dType = normalizeModuleTypeVal(gp(drow, 'ModuleType'));
            var $dtr = $tbody.children('tr[data-code="' + dCode + '"]');
            var $dcell = $dtr.length ? findGroupCell($dtr, groupName) : null;
            if ($dcell && $dcell.hasClass('is-readonly')) continue;
            var wasY = ($dcell && $dcell.data('value') === 'Y') || isGrantedVal(drow[groupName]);
            if (!wasY) continue;
            if (drow[groupName] !== undefined) drow[groupName] = 'N';
            cascade.push({
                $cell: $dcell,
                prev: $dcell ? $dcell.data('value') : 'Y',
                moduleCode: parseInt(dCode, 10),
                moduleType: dType
            });
        }
    }

    $cell.data('value', newAction);
    UpdateCellUI($cell, newAction, true);
    for (var c = 0; c < cascade.length; c++) {
        if (!cascade[c].$cell) continue;
        cascade[c].$cell.data('value', 'N');
        UpdateCellUI(cascade[c].$cell, 'N', false);
    }

    var saves = [saveRightPayload(moduleCode, moduleType, groupCode, newAction)];
    for (var s = 0; s < cascade.length; s++) {
        saves.push(saveRightPayload(cascade[s].moduleCode, cascade[s].moduleType, groupCode, 'N'));
    }

    Promise.all(saves)
        .then(function (results) {
            var allOk = results.every(isSaveOk);
            if (allOk) {
                _urdApiResponseCache = { key: '', payload: null, ts: 0 };
                UpdateCellUI($cell, newAction, false);
                toastr.success(cascade.length
                    ? 'Saved. Options under this menu set to N.'
                    : ((results[0] && (results[0].Msg || results[0].msg)) || 'Saved.'));
            } else {
                $cell.data('value', currentVal);
                UpdateCellUI($cell, currentVal, false);
                for (var x = 0; x < cascade.length; x++) {
                    if (!cascade[x].$cell) continue;
                    cascade[x].$cell.data('value', cascade[x].prev);
                    UpdateCellUI(cascade[x].$cell, cascade[x].prev, false);
                }
                toastr.error('Failed to save rights.');
            }
        })
        .catch(function () {
            $cell.data('value', currentVal);
            UpdateCellUI($cell, currentVal, false);
            for (var x = 0; x < cascade.length; x++) {
                if (!cascade[x].$cell) continue;
                cascade[x].$cell.data('value', cascade[x].prev);
                UpdateCellUI(cascade[x].$cell, cascade[x].prev, false);
            }
            toastr.error('Failed to save rights.');
        });
}

function UpdateCellUI($cell, val, saving) {
    if (saving) {
        $cell.removeClass('is-granted').html('<span class="urd-matrix-saving"><i class="fas fa-spinner fa-spin"></i></span>');
        return;
    }
    var granted = val === 'Y';
    var canEdit = !$cell.hasClass('is-readonly');
    $cell.toggleClass('is-granted', granted);
    $cell.html(cellValueHtml(val, canEdit));
}

function buildToggleBtn(code, lavel) {
    return '<button type="button" class="urd-toggle-btn" data-parent-code="' + escHtml(String(code)) +
        '" data-level="' + lavel + '" title="Expand / collapse"><i class="fas fa-plus"></i></button>';
}

function buildAccessCellHtml(val, code, moduleType, groupCode, gName) {
    var granted = val === 'Y';
    var canEdit = groupCode > 0;
    return '<td class="urd-td-access' + (granted ? ' is-granted' : '') + (canEdit ? '' : ' is-readonly') + '"' +
        ' data-module-code="' + code + '"' +
        ' data-module-type="' + escHtml(moduleType) + '"' +
        ' data-group-code="'  + (groupCode || 0) + '"' +
        ' data-group-name="'  + escHtml(gName) + '"' +
        ' data-value="'       + val + '">' +
        cellValueHtml(val, canEdit) +
        '</td>';
}

/** Short 1–2 letter initials for a group-column avatar chip, e.g. "PURCHASE & STORES" → "PS". */
function GetInitials(name) {
    var words = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
}

/* ═══════════════════════════════════════════════════
   EXPAND ALL / COLLAPSE ALL
═══════════════════════════════════════════════════ */
function FilterMatrixRows(query) {
    var q = String(query || '').trim().toLowerCase();
    var $rows = $('#urd-tbody tr');
    if (!q) {
        $rows.removeClass('urd-row-hidden');
        return;
    }
    $rows.each(function () {
        var $tr = $(this);
        if ($tr.hasClass('urd-row-category')) {
            $tr.removeClass('urd-row-hidden');
            return;
        }
        var text = ($tr.find('.urd-td-module').text() || $tr.attr('title') || '').toLowerCase();
        $tr.toggleClass('urd-row-hidden', text.indexOf(q) === -1);
    });
}

/* ═══════════════════════════════════════════════════
   MODULE ICON
═══════════════════════════════════════════════════ */
function GetModuleIcon(moduleType, lavel) {
    var mt = normalizeModuleTypeVal(moduleType);
    if (lavel === 1 || mt === 'N') return '<i class="fas fa-layer-group urd-icon-n"></i>';
    if (mt === 'M')                return '<i class="fas fa-folder      urd-icon-m"></i>';
    if (mt === 'S')                return '<i class="fas fa-dot-circle  urd-icon-s"></i>';
    if (mt === 'O')                return '<i class="fas fa-key         urd-icon-o"></i>';
    return '<i class="fas fa-dot-circle urd-icon-s"></i>';
}

/* ═══════════════════════════════════════════════════
   UI HELPERS
═══════════════════════════════════════════════════ */
function SetLoadingState(loading) {
    if (loading) {
        $('#btnGo').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Loading…');
        $('#urd-loading').show();
        $('#urd-table-wrap').hide();
        $('#urd-table-toolbar').hide();
        $('#urd-placeholder').hide();
    } else {
        $('#btnGo').prop('disabled', false).html('<i class="fas fa-play"></i> Load dashboard');
        $('#urd-loading').hide();
    }
}

function ShowPlaceholder(type) {
    $('#urd-table-wrap').hide();
    $('#urd-table-toolbar').hide();
    var $ph = $('#urd-placeholder');
    if (type === 'empty') {
        $ph.html(
            '<div class="urd-ph-ring"><i class="fas fa-table urd-ph-icon"></i></div>' +
            '<div class="urd-ph-title">No Data Found</div>' +
            '<div class="urd-ph-text">No module data returned. Please check the API.</div>').show();
    } else if (type === 'error') {
        $ph.html(
            '<div class="urd-ph-ring"><i class="fas fa-exclamation-circle urd-ph-icon" style="color:#ef4444"></i></div>' +
            '<div class="urd-ph-title" style="color:#ef4444">Error Loading Data</div>' +
            '<div class="urd-ph-text">Could not connect to server. Please try again.</div>').show();
    } else {
        $ph.html(
            '<div class="urd-ph-ring"><i class="fas fa-shield-alt urd-ph-icon"></i></div>' +
            '<div class="urd-ph-title">User Right Dashboard</div>' +
            '<div class="urd-ph-text">' +
            'Select a <strong>Company</strong>, tick <strong>group checkboxes</strong> if you want to limit columns (or leave none ticked for all groups), then click <strong>Load dashboard</strong>.' +
            '</div>').show();
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
