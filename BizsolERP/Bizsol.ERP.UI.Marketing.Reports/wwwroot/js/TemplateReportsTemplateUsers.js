import { TemplateReportsService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/TemplateReportsService.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { getTemplateReportFormTypeFromUrlParams } from '../../Bizsol.WebERP.UI.Shared/js/TemplateReportsFormTypeUtil.js';

/*
  Template Users - opened by the "Template Users" button in the page header.

  One grid: Form Type | Template Name | Assigned Users (a template with no users is still listed).
    - Form Type dropdown starts on the ?formType= value of the page URL ("All Form Types" shows everything).
    - Template dropdown: "All Templates" or one template. Its list follows the chosen Form Type.
    - User dropdown: "All users", "Not assigned to anyone", or one user (that user's templates).
    - The three filters work together (a template is shown when it passes all three). All three are searchable.
    - Click Assigned Users on a row, tick the users for that template. Changed rows are highlighted.
    - Save sends only the changed templates in one call:
        Assignments = "4:15,23;5:98;6:"      (TemplateCode:UserCode,UserCode ; ...   "6:" = no users)
    - Everybody can see the template users. Only a user with the Manage Template right can change them:
      without that right the modal is view only (no picker, no Save, every assigned user is listed).
      (The UI only hides the editing. SaveTemplateUserAssignments must check the right on the server too.)

  APIs (see USP_WebAPI_TemplateUserAssignment.sql):
    GET  TemplateReports/GetTemplateUserAssignments?FormType=      '' = all form types
         -> [{ TemplateMaster_Code, FormType, TemplateName, MasterTemplete, AssignedUserMaster_Codes: "15,23" }]
    POST TemplateReports/SaveTemplateUserAssignments   { UserMaster_Code, Assignments }
*/

var TU_ALL = '__ALL__';
var TU_UNASSIGNED = '__NONE__';
var TU_MAX_CHIPS = 6;
var TU_FILTERS = '#ddlTuFormType, #ddlTuTemplate, #ddlTuUser';   // the three searchable filter dropdowns

var G_TU_Rows = [];            // [{ code, formType, name, master, codes: ['15','23'], original: ['15','23'] }]
var G_TU_Users = [];           // [{ code: '15', name: 'KIRAN' }] sorted by name
var G_TU_UserNames = {};       // '15' -> 'KIRAN'
var G_TU_UsersLoaded = false;
var G_TU_Busy = false;         // loading or saving
var G_TU_ReadOnly = false;     // no Manage Template right: the users can be seen but not changed
var G_TU_PickerCode = 0;       // template whose user picker is open (0 = closed)
var G_TU_PickerTrigger = null;
var G_TU_PickerOpenedAt = 0;

$(document).ready(function () {
    $('#btnTemplateUsers').on('click', onTemplateUsersClick);

    initSearchableSelects();
    $('#ddlTuFormType').on('change', function () {
        closePicker(false);
        // the Template list belongs to the Form Type: rebuild it (the chosen template stays when it is still in the list)
        fillTemplateOptions(String($('#ddlTuTemplate').val() || TU_ALL));
        renderGrid();
    });
    $('#ddlTuTemplate, #ddlTuUser').on('change', function () {
        closePicker(false);
        renderGrid();
    });
    // opening a dropdown list (mouse or keyboard) puts the user picker away
    $(TU_FILTERS).on('select2:opening', function () {
        closePicker(false);
    });
    $('#olTuTableBody').on('click', '.ol-tu-assign', function () {
        togglePicker(this);
    });
    $('#btnTuSave').on('click', saveAssignments);

    $('#txtTuUserSearch').on('input', filterPickerList);
    $('#olTuPickerList').on('change', '.ol-tu-user-check', onPickerCheckChange);
    $('#btnTuSelectShown').on('click', function () { setShownPickerChecks(true); });
    $('#btnTuClearShown').on('click', function () { setShownPickerChecks(false); });
    $('#btnTuPickerClose').on('click', function () { closePicker(true); });

    bindPickerDismissEvents();
    bindModalEvents();
});

/* ─────────────────────────── open ─────────────────────────── */

function getDefaultFormType() {
    return getTemplateReportFormTypeFromUrlParams(BizSolHelperFunction.getUrlVars()) || window.G_OL_FORM_TYPE || '';
}

/**
 * Can this user change template users? Only when the Manage Template right is confirmed ('Y').
 * Always resolves { canEdit, failed } (never rejects): a "no" answer or a failed check both mean view only.
 * ShowMsg 'N' = silent check, the API must not raise a "no rights" message for a user who may simply look.
 */
function resolveManageRight() {
    return Promise.resolve().then(function () {
        var moduleName = $('#ERPHeading').text().trim();
        var finYear = BizSolHelperFunction.getFinancialYear();
        return MenuService.CheckModuleOptionRight(moduleName, 'ManageTemplate', 'N', finYear);
    }).then(function (resp) {
        return { canEdit: !!(resp && resp.CheckModuleOptionRight === 'Y'), failed: false };
    }).catch(function () {
        return { canEdit: false, failed: true };
    });
}

function onTemplateUsersClick() {
    resolveManageRight().then(function (right) {
        if (right.failed) {
            toastr.warning('Could not check your Manage Template right, so template users are shown view only.');
        }
        openTemplateUsersModal(right.canEdit);
    }).catch(function () {
        toastr.error('Could not open template users.');
    });
}

/** View only: no picker, no Save, every assigned user listed (the modal class drives the badge, hint and footer). */
function setReadOnly(readOnly) {
    G_TU_ReadOnly = !!readOnly;
    $('#olTemplateUsersModal').toggleClass('is-readonly', G_TU_ReadOnly);
}

function openTemplateUsersModal(canEdit) {
    var defaultFormType = getDefaultFormType();

    setReadOnly(!canEdit);
    G_TU_Rows = [];
    fillFormTypeOptions(defaultFormType);
    fillTemplateOptions(TU_ALL);
    fillUserFilterOptions(TU_ALL);
    renderGrid('Loading...');

    var modalEl = document.getElementById('olTemplateUsersModal');
    if (window.bootstrap && bootstrap.Modal) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    } else {
        $(modalEl).modal('show');
    }

    setBusy(true);
    fetchAssignments()
        .then(function () {
            showLoaded(defaultFormType, TU_ALL, TU_ALL);
        })
        .catch(function (err) {
            G_TU_Rows = [];
            showLoaded(defaultFormType, TU_ALL, TU_ALL, 'Could not load template users: ' + apiError(err, 'the server did not answer') + '.');
            toastr.error('Could not load template users.');
        })
        .finally(function () {
            setBusy(false);
        });
}

function bindModalEvents() {
    var modalEl = document.getElementById('olTemplateUsersModal');
    if (!modalEl) return;

    modalEl.addEventListener('hide.bs.modal', function (e) {
        if (changedRows().length && !window.confirm('You have unsaved changes. Close without saving?')) {
            e.preventDefault();
            return;
        }
        closePicker(false);
        closeOpenSelect();
    });

    modalEl.addEventListener('hidden.bs.modal', function () {
        closePicker(false);
        closeOpenSelect();
        G_TU_Rows = [];
        $('#olTuTableBody').empty();
    });
}

/* ─────────────────────────── data ─────────────────────────── */

function fetchAssignments() {
    return Promise.all([
        TemplateReportsService.GetTemplateUserAssignments(''),
        ensureUsers()
    ]).then(function (results) {
        var byCode = {};
        var rows = [];
        unwrapApiList(results[0]).forEach(function (raw) {
            var row = mapAssignmentRow(raw);
            if (!row.code) return;
            var existing = byCode[row.code];
            if (existing) {
                // API returned one row per (template, user): merge them
                row.codes.forEach(function (code) {
                    if (existing.codes.indexOf(code) < 0) existing.codes.push(code);
                });
                existing.original = existing.codes.slice();
                return;
            }
            byCode[row.code] = row;
            rows.push(row);
        });
        sortRows(rows);
        G_TU_Rows = rows;
    });
}

/** Fill the three filters (Form Type first: the Template list depends on it), then show the grid. */
function showLoaded(formType, template, user, message) {
    fillFormTypeOptions(formType);
    fillTemplateOptions(template);
    fillUserFilterOptions(user);
    renderGrid(message);
}

function mapAssignmentRow(raw) {
    var codes = splitCodes(prop(raw, [
        'AssignedUserMaster_Codes', 'UserMaster_Codes',
        'AssignedUserCodes', 'UserCodes', 'UserMaster_Code'
    ]));
    return {
        code: parseInt(prop(raw, ['TemplateMaster_Code', 'TempleteMaster_Code', 'F_TempleteMaster_Code', 'Code']), 10) || 0,
        formType: String(prop(raw, ['FormType']) || '').trim(),
        name: String(prop(raw, ['TemplateName', 'Desp', 'Name']) || '').trim(),
        master: isMasterFlag(prop(raw, ['MasterTemplete', 'MasterTemplate'])),
        codes: codes,
        original: codes.slice()
    };
}

/** "15,23" / 15 / [15, {UserMaster_Code: 23}]  ->  ['15', '23'] (positive numbers, no duplicates) */
function splitCodes(value) {
    var out = [];
    function add(part) {
        var n = parseInt(String(part == null ? '' : part).trim(), 10);
        if (!(n > 0)) return;
        var key = String(n);
        if (out.indexOf(key) < 0) out.push(key);
    }
    if (Array.isArray(value)) {
        value.forEach(function (item) {
            if (item && typeof item === 'object') {
                add(prop(item, ['UserMaster_Code', 'Code', 'UserCode']));
            } else {
                String(item == null ? '' : item).split(',').forEach(add);
            }
        });
    } else {
        String(value == null ? '' : value).split(',').forEach(add);
    }
    return out;
}

function isMasterFlag(value) {
    if (value === true) return true;
    var text = String(value == null ? '' : value).trim().toUpperCase();
    return text === 'M' || text === 'Y';
}

function sortRows(rows) {
    rows.sort(function (a, b) {
        var byType = a.formType.toLowerCase().localeCompare(b.formType.toLowerCase());
        if (byType) return byType;
        if (a.master !== b.master) return a.master ? -1 : 1;
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
}

function ensureUsers() {
    if (G_TU_UsersLoaded) return Promise.resolve(G_TU_Users);
    return TemplateReportsService.GetUserList()
        .then(function (res) {
            var list = unwrapApiList(res);
            if (list.length === 1 && list[0] && !prop(list[0], ['Code', 'UserName'])) {
                list = unwrapApiList(list[0]);
            }
            var users = [];
            var names = {};
            list.forEach(function (item) {
                var code = parseInt(prop(item, ['Code', 'UserMaster_Code', 'UserCode']), 10) || 0;
                var name = String(prop(item, ['UserName', 'Name', 'FullName', 'UserID']) || '').trim();
                if (!code || !name || names[String(code)]) return;
                names[String(code)] = name;
                users.push({ code: String(code), name: name });
            });
            users.sort(byName);
            G_TU_Users = users;
            G_TU_UserNames = names;
            G_TU_UsersLoaded = true;
            return users;
        })
        .catch(function () {
            toastr.error('Could not load users.');
            return [];
        });
}

function findRow(code) {
    for (var i = 0; i < G_TU_Rows.length; i++) {
        if (G_TU_Rows[i].code === code) return G_TU_Rows[i];
    }
    return null;
}

function userLabel(code) {
    return G_TU_UserNames[code] || ('User #' + code);
}

/* ─────────────────────────── filters + grid ─────────────────────────── */

/**
 * Form Type, Template and User are searchable dropdowns (Select2, loaded by the layout - type to filter the list).
 * Like the Manage Template dropdowns, the list is attached to the modal so it stays usable inside it.
 * Without Select2 the plain dropdowns keep working.
 */
function initSearchableSelects() {
    if (!$.fn.select2) return;
    var $modal = $('#olTemplateUsersModal');
    $(TU_FILTERS).each(function () {
        var $ddl = $(this);
        if ($ddl.hasClass('select2-hidden-accessible')) return;
        $ddl.select2({
            width: '100%',
            dropdownParent: $modal,
            minimumResultsForSearch: 0
        });
    });
}

/** After options / the selected value were set from code: let Select2 show them (the app's change handlers do not run). */
function syncSelect($ddl) {
    if ($ddl.hasClass('select2-hidden-accessible')) $ddl.trigger('change.select2');
}

/** Close a dropdown list that is open; restoreFocus puts the keyboard back on that dropdown. Returns true when there was one. */
function closeOpenSelect(restoreFocus) {
    var closed = false;
    $(TU_FILTERS).each(function () {
        var select2 = $(this).data('select2');
        if (select2 && select2.isOpen()) {
            $(this).select2('close');
            var selection = select2.$selection && select2.$selection[0];
            if (restoreFocus && selection && selection.focus) selection.focus({ preventScroll: true });
            closed = true;
        }
    });
    return closed;
}

function fillFormTypeOptions(selected) {
    var wanted = String(selected == null ? '' : selected).trim();
    var seen = {};
    var types = [];
    G_TU_Rows.forEach(function (row) {
        var key = row.formType.toLowerCase();
        if (row.formType && !seen[key]) {
            seen[key] = true;
            types.push(row.formType);
        }
    });
    // the form type of the page may not have a template yet: keep it selectable
    if (wanted && wanted !== TU_ALL && !seen[wanted.toLowerCase()]) types.push(wanted);
    types.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });

    var $ddl = $('#ddlTuFormType').empty();
    $ddl.append($('<option/>').val(TU_ALL).text('All Form Types'));
    var match = TU_ALL;
    types.forEach(function (type) {
        $ddl.append($('<option/>').val(type).text(type));
        if (wanted && type.toLowerCase() === wanted.toLowerCase()) match = type;
    });
    $ddl.val(match);
    syncSelect($ddl);
}

/**
 * Template dropdown: "All Templates" + the templates of the chosen Form Type. For "All Form Types" every template is
 * listed, grouped by Form Type (the rows are already sorted by Form Type, then master first, then name).
 * The chosen template stays selected when it is still in the list; otherwise it falls back to "All Templates".
 * Option value = template code.
 */
function fillTemplateOptions(selected) {
    var wanted = String(selected == null ? TU_ALL : selected);
    var formType = String($('#ddlTuFormType').val() || TU_ALL);
    var allTypes = formType === TU_ALL;

    var $ddl = $('#ddlTuTemplate').empty();
    $ddl.append($('<option/>').val(TU_ALL).text('All Templates'));

    var match = TU_ALL;
    var group = null;
    var groupType = null;
    G_TU_Rows.forEach(function (row) {
        if (!allTypes && row.formType.toLowerCase() !== formType.toLowerCase()) return;

        var $parent = $ddl;
        if (allTypes) {
            if (group === null || groupType !== row.formType.toLowerCase()) {
                groupType = row.formType.toLowerCase();
                group = $('<optgroup/>').attr('label', row.formType || 'No Form Type');
                $ddl.append(group);
            }
            $parent = group;
        }

        var value = String(row.code);
        $parent.append($('<option/>').val(value).text(row.name));
        if (value === wanted) match = value;
    });
    $ddl.val(match);
    syncSelect($ddl);
}

function fillUserFilterOptions(selected) {
    var wanted = String(selected == null ? '' : selected);
    var $ddl = $('#ddlTuUser').empty();
    $ddl.append($('<option/>').val(TU_ALL).text('All users'));
    $ddl.append($('<option/>').val(TU_UNASSIGNED).text('Not assigned to anyone'));
    var match = TU_ALL;
    if (wanted === TU_UNASSIGNED) match = TU_UNASSIGNED;
    G_TU_Users.forEach(function (user) {
        $ddl.append($('<option/>').val(user.code).text(user.name));
        if (user.code === wanted) match = user.code;
    });
    $ddl.val(match);
    syncSelect($ddl);
}

/** A template is shown when it passes all three filters: Form Type, Template and User. */
function visibleRows() {
    var formType = String($('#ddlTuFormType').val() || TU_ALL);
    var template = String($('#ddlTuTemplate').val() || TU_ALL);
    var user = String($('#ddlTuUser').val() || TU_ALL);
    return G_TU_Rows.filter(function (row) {
        if (formType !== TU_ALL && row.formType.toLowerCase() !== formType.toLowerCase()) return false;
        if (template !== TU_ALL && String(row.code) !== template) return false;
        if (user === TU_UNASSIGNED) return row.codes.length === 0;
        if (user !== TU_ALL) return row.codes.indexOf(user) >= 0;
        return true;
    });
}

function emptyMessage() {
    if (!G_TU_Rows.length) return 'No templates found.';
    var user = String($('#ddlTuUser').val() || TU_ALL);
    var oneTemplate = String($('#ddlTuTemplate').val() || TU_ALL) !== TU_ALL;
    if (user === TU_UNASSIGNED) {
        return oneTemplate ? 'This template already has at least one user.' : 'Every template in this Form Type has at least one user.';
    }
    if (user !== TU_ALL) {
        return oneTemplate ? 'This template is not assigned to this user.' : 'No template of this Form Type is assigned to this user.';
    }
    return 'No templates for this Form Type.';
}

function renderGrid(message) {
    var rows = visibleRows();
    $('#olTuTableBody').html(rows.map(rowHtml).join(''));
    $('#olTuEmpty').text(message || emptyMessage()).toggle(!rows.length);
    updateSummary();
    updateSaveState();
}

function rowHtml(row) {
    return '<tr data-code="' + row.code + '"' + (isChanged(row) ? ' class="is-dirty"' : '') + '>'
        + '<td class="ol-tu-form">' + escapeHtml(row.formType) + '</td>'
        + '<td class="ol-tu-name' + (row.master ? ' is-master' : '') + '">'
        + '<span class="ol-tu-name-text">' + escapeHtml(row.name) + '</span>'
        + (row.master ? '<span class="ol-tu-badge">Master</span>' : '')
        + '</td>'
        + '<td class="ol-tu-users">' + usersCellHtml(row) + '</td>'
        + '</tr>';
}

function usersCellHtml(row) {
    // view only: plain chips, nothing to click (no button, no caret, no picker)
    if (G_TU_ReadOnly) {
        return '<div class="ol-tu-chips">' + chipsHtml(row) + '</div>';
    }
    return '<button type="button" class="ol-tu-assign" data-code="' + row.code + '" aria-haspopup="dialog" aria-expanded="false"'
        + ' title="' + escapeHtml(titleFor(row)) + '">'
        + '<span class="ol-tu-chips">' + chipsHtml(row) + '</span>'
        + '<i class="fas fa-chevron-down ol-tu-caret" aria-hidden="true"></i>'
        + '</button>';
}

function sortedUserNames(row) {
    return row.codes.map(userLabel).sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
}

function chipsHtml(row) {
    if (!row.codes.length) return '<span class="ol-tu-none">Not assigned</span>';
    var names = sortedUserNames(row);
    // view only has no picker to open, so it lists everybody instead of "+N more"
    var limit = G_TU_ReadOnly ? names.length : TU_MAX_CHIPS;
    var html = names.slice(0, limit).map(function (name) {
        return '<span class="ol-tu-chip">' + escapeHtml(name) + '</span>';
    }).join('');
    if (names.length > limit) {
        html += '<span class="ol-tu-chip is-more">+' + (names.length - limit) + ' more</span>';
    }
    return html;
}

function titleFor(row) {
    return (row.codes.length ? sortedUserNames(row).join(', ') : 'Not assigned') + ' (click to change)';
}

/** Update one row in place (the picker stays anchored to the same button). */
function refreshRow(row) {
    var $tr = $('#olTuTableBody tr[data-code="' + row.code + '"]');
    if (!$tr.length) return;
    $tr.toggleClass('is-dirty', isChanged(row));
    $tr.find('.ol-tu-chips').html(chipsHtml(row));
    $tr.find('.ol-tu-assign').attr('title', titleFor(row));
    updateSummary();
    positionPicker(G_TU_PickerTrigger);
}

function updateSummary() {
    var shown = [];
    $('#olTuTableBody tr').each(function () {
        var row = findRow(parseInt(this.getAttribute('data-code'), 10) || 0);
        if (row) shown.push(row);
    });
    var text = '';
    if (shown.length) {
        var none = shown.filter(function (row) { return !row.codes.length; }).length;
        text = shown.length + (shown.length === 1 ? ' template' : ' templates');
        if (none) text += ' \u00b7 ' + none + ' not assigned';
    }
    $('#olTuSummary').text(text);
}

/* ─────────────────────────── changes ─────────────────────────── */

function sameCodes(a, b) {
    if (a.length !== b.length) return false;
    var set = {};
    a.forEach(function (code) { set[code] = true; });
    return b.every(function (code) { return set[code]; });
}

function isChanged(row) {
    return !sameCodes(row.codes, row.original);
}

function changedRows() {
    return G_TU_Rows.filter(isChanged);
}

function updateSaveState() {
    var count = changedRows().length;
    $('#btnTuSave').prop('disabled', G_TU_ReadOnly || G_TU_Busy || count === 0);
    $('#olTuPending')
        .text(count + (count === 1 ? ' unsaved change' : ' unsaved changes'))
        .prop('hidden', count === 0);
}

function setBusy(busy) {
    G_TU_Busy = !!busy;
    $('#olTuGridLoader').toggleClass('ol-visible', G_TU_Busy);
    $(TU_FILTERS).prop('disabled', G_TU_Busy);
    updateSaveState();
}

/* ─────────────────────────── user picker ─────────────────────────── */

function togglePicker(trigger) {
    var code = parseInt(trigger.getAttribute('data-code'), 10) || 0;
    if (!code || G_TU_Busy || G_TU_ReadOnly) return;
    if (G_TU_PickerCode === code) {
        closePicker(true);
        return;
    }
    openPicker(trigger, code);
}

function openPicker(trigger, code) {
    var row = findRow(code);
    if (!row) return;
    closePicker(false);

    G_TU_PickerCode = code;
    G_TU_PickerTrigger = trigger;
    G_TU_PickerOpenedAt = Date.now();
    trigger.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');

    $('#olTuPickerTitle').text(row.name + (row.formType ? ' \u2014 ' + row.formType : ''));
    $('#txtTuUserSearch').val('');
    buildPickerList(row);

    document.getElementById('olTuPicker').hidden = false;
    positionPicker(trigger);
    document.getElementById('txtTuUserSearch').focus({ preventScroll: true });
}

function buildPickerList(row) {
    var selected = {};
    row.codes.forEach(function (code) { selected[code] = true; });

    // ticked users first (only when the picker opens, so rows do not jump while ticking)
    var users = G_TU_Users.slice().sort(function (a, b) {
        var rankA = selected[a.code] ? 0 : 1;
        var rankB = selected[b.code] ? 0 : 1;
        return rankA !== rankB ? rankA - rankB : byName(a, b);
    });

    var html = users.map(function (user) {
        var on = !!selected[user.code];
        return '<label class="ol-tu-option' + (on ? ' is-checked' : '') + '" data-name="' + escapeHtml(user.name.toLowerCase()) + '">'
            + '<input type="checkbox" class="ol-tu-user-check" value="' + escapeHtml(user.code) + '"' + (on ? ' checked' : '') + ' />'
            + '<span>' + escapeHtml(user.name) + '</span>'
            + '</label>';
    }).join('');

    $('#olTuPickerList').html(html || '<div class="ol-tu-picker-empty">No users available.</div>');
    $('#olTuPickerList').scrollTop(0);
    updatePickerCount(row);
    filterPickerList();
}

function updatePickerCount(row) {
    $('#olTuPickerCount').text(row.codes.length + ' selected');
}

function filterPickerList() {
    var query = String($('#txtTuUserSearch').val() || '').trim().toLowerCase();
    var $options = $('#olTuPickerList .ol-tu-option');
    var shown = 0;
    $options.each(function () {
        var match = !query || String(this.getAttribute('data-name') || '').indexOf(query) >= 0;
        $(this).toggle(match);
        if (match) shown++;
    });
    $('#olTuPickerNone').toggle($options.length > 0 && shown === 0);
    $('#btnTuSelectShown, #btnTuClearShown').prop('disabled', shown === 0);
    positionPicker(G_TU_PickerTrigger);
}

function onPickerCheckChange() {
    var row = findRow(G_TU_PickerCode);
    if (!row) return;
    var code = String(this.value);
    var index = row.codes.indexOf(code);
    if (this.checked && index < 0) row.codes.push(code);
    if (!this.checked && index >= 0) row.codes.splice(index, 1);
    $(this).closest('.ol-tu-option').toggleClass('is-checked', this.checked);
    refreshRow(row);
    updatePickerCount(row);
    updateSaveState();
}

/** Tick / untick every user the search currently shows. */
function setShownPickerChecks(checked) {
    var row = findRow(G_TU_PickerCode);
    if (!row) return;
    $('#olTuPickerList .ol-tu-option').filter(function () {
        return this.style.display !== 'none';
    }).find('.ol-tu-user-check').each(function () {
        if (this.checked === checked) return;
        this.checked = checked;
        var code = String(this.value);
        var index = row.codes.indexOf(code);
        if (checked && index < 0) row.codes.push(code);
        if (!checked && index >= 0) row.codes.splice(index, 1);
        $(this).closest('.ol-tu-option').toggleClass('is-checked', checked);
    });
    refreshRow(row);
    updatePickerCount(row);
    updateSaveState();
}

/** The picker is fixed-positioned (it is not clipped by the grid scroll box); open it below the button, or above when there is no room. */
function positionPicker(trigger) {
    var picker = document.getElementById('olTuPicker');
    var list = document.getElementById('olTuPickerList');
    if (!picker || !list || !trigger || picker.hidden) return;

    var rect = trigger.getBoundingClientRect();
    var viewWidth = document.documentElement.clientWidth || window.innerWidth;
    var viewHeight = window.innerHeight || document.documentElement.clientHeight;
    var width = Math.min(360, viewWidth - 16);
    var left = Math.max(8, Math.min(rect.left, viewWidth - width - 8));

    picker.style.width = width + 'px';
    list.style.maxHeight = '';
    var natural = picker.offsetHeight;
    var below = viewHeight - rect.bottom - 10;
    var above = rect.top - 10;
    var openUp = natural > below && above > below;
    var space = openUp ? above : below;
    if (natural > space) {
        var chrome = natural - list.offsetHeight;
        list.style.maxHeight = Math.max(120, space - chrome) + 'px';
    }

    var height = picker.offsetHeight;
    picker.style.left = left + 'px';
    picker.style.top = (openUp ? Math.max(8, rect.top - height - 2) : rect.bottom + 2) + 'px';
}

function closePicker(restoreFocus) {
    var trigger = G_TU_PickerTrigger;
    G_TU_PickerCode = 0;
    G_TU_PickerTrigger = null;

    var picker = document.getElementById('olTuPicker');
    if (picker) picker.hidden = true;
    $('#olTuTableBody .ol-tu-assign.is-open').removeClass('is-open').attr('aria-expanded', 'false');

    if (restoreFocus && trigger && document.body.contains(trigger)) {
        trigger.focus({ preventScroll: true });
    }
}

function bindPickerDismissEvents() {
    // click anywhere else closes the picker (a click on its own button is handled as a toggle)
    document.addEventListener('mousedown', function (e) {
        if (!G_TU_PickerCode) return;
        var target = e.target;
        if (!target || !target.closest) return;
        if (target.closest('#olTuPicker')) return;
        if (target.closest('.ol-tu-assign[data-code="' + G_TU_PickerCode + '"]')) return;
        closePicker(false);
    }, true);

    // Escape closes an open dropdown list first, then the user picker - only then the modal
    // (Bootstrap would otherwise close the whole modal on the same key press)
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (closeOpenSelect(true)) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (!G_TU_PickerCode) return;
        e.preventDefault();
        e.stopPropagation();
        closePicker(true);
    }, true);

    // scrolling the grid / modal would leave the picker floating in the wrong place
    document.addEventListener('scroll', function (e) {
        if (!G_TU_PickerCode) return;
        if (Date.now() - G_TU_PickerOpenedAt < 250) return;
        var picker = document.getElementById('olTuPicker');
        if (picker && e.target instanceof Node && picker.contains(e.target)) return;
        closePicker(false);
    }, true);

    window.addEventListener('resize', function () {
        if (G_TU_PickerCode) positionPicker(G_TU_PickerTrigger);
    });
}

/* ─────────────────────────── save ─────────────────────────── */

/** [{code: 4, codes: ['15','23']}, {code: 6, codes: []}]  ->  "4:15,23;6:" */
function buildAssignmentsText(rows) {
    return rows.map(function (row) {
        return row.code + ':' + row.codes.join(',');
    }).join(';');
}

function saveAssignments() {
    if (G_TU_Busy) return;
    if (G_TU_ReadOnly) {
        // the Save button is hidden in view only mode; this only stops a call made some other way
        toastr.error('You do not have rights to manage template users.');
        return;
    }
    var rows = changedRows();
    if (!rows.length) {
        toastr.info('No changes to save.');
        return;
    }

    var me = String(getAuthUserCode() || '');
    var touchesMe = !!me && rows.some(function (row) {
        return row.codes.indexOf(me) >= 0 || row.original.indexOf(me) >= 0;
    });
    var keepFormType = String($('#ddlTuFormType').val() || TU_ALL);
    var keepTemplate = String($('#ddlTuTemplate').val() || TU_ALL);
    var keepUser = String($('#ddlTuUser').val() || TU_ALL);

    closePicker(false);
    setBusy(true);
    TemplateReportsService.SaveTemplateUserAssignments(buildAssignmentsText(rows))
        .then(function (res) {
            var message = readSaveError(res);
            if (message) throw { message: message };

            rows.forEach(function (row) { row.original = row.codes.slice(); });
            toastr.success('Template users saved.');
            // the logged in user's own template list may have changed
            if (touchesMe) refreshMainTemplates();

            return fetchAssignments()
                .then(function () {
                    showLoaded(keepFormType, keepTemplate, keepUser);
                })
                .catch(function () {
                    renderGrid();
                    toastr.warning('Saved, but the list could not be refreshed.');
                });
        })
        .catch(function (err) {
            toastr.error(apiError(err, 'Could not save template users.'));
        })
        .finally(function () {
            setBusy(false);
        });
}

/** The SP answers { Status: 'Y' | 'N', Msg }. 'N' (or an error status) means nothing was saved. */
function readSaveError(response) {
    var payload = response;
    if (typeof response === 'string') {
        var text = response.trim();
        if (!text || (text.charAt(0) !== '[' && text.charAt(0) !== '{')) return '';
        try { payload = JSON.parse(text); } catch (e) { return ''; }
    }
    var first = unwrapApiList(payload)[0];
    if (!first || typeof first !== 'object') return '';
    var status = String(prop(first, ['Status', 'status']) || '').trim().toUpperCase();
    if (status === 'N' || status === 'E' || status === 'ERROR' || status === 'FALSE') {
        return String(prop(first, ['Msg', 'Message', 'Error']) || 'Could not save template users.').trim();
    }
    return '';
}

function refreshMainTemplates() {
    if (typeof window.OrderLoadReportRefreshTemplates === 'function') {
        window.OrderLoadReportRefreshTemplates($('#ddlTemplate').val());
    }
}

/* ─────────────────────────── helpers ─────────────────────────── */

function getAuthUserCode() {
    try {
        var auth = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        return auth.UserMaster_Code || 0;
    } catch (e) {
        return 0;
    }
}

function byName(a, b) {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
}

function escapeHtml(text) {
    return String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function apiError(err, fallback) {
    var msg = fallback || 'Something went wrong.';
    try {
        if (err && err.xhr && err.xhr.responseText) {
            msg = err.xhr.responseText;
        } else if (typeof err === 'string' && err.trim()) {
            msg = err;
        } else if (err && err.message) {
            msg = err.message;
        }
        msg = String(msg).replace(/^Data Error\s*:\s*/i, '').trim();
        if (msg.length > 300) msg = msg.substring(0, 300) + '...';
    } catch (e) { /* keep fallback */ }
    return msg || fallback;
}

function unwrapApiList(payload) {
    if (!payload) return [];
    if (typeof payload === 'string') {
        var trimmed = payload.trim();
        if (trimmed.charAt(0) === '[' || trimmed.charAt(0) === '{') {
            try { return unwrapApiList(JSON.parse(trimmed)); } catch (e) { return []; }
        }
        return [];
    }
    if (Array.isArray(payload)) {
        if (payload.length && Array.isArray(payload[0])) return payload[0];
        return payload;
    }
    if (payload.$values && Array.isArray(payload.$values)) return payload.$values;
    var keys = ['Data', 'data', 'Result', 'result', 'Rows', 'rows'];
    for (var i = 0; i < keys.length; i++) {
        if (payload[keys[i]] && Array.isArray(payload[keys[i]])) return payload[keys[i]];
    }
    if (typeof payload === 'object') return [payload];
    return [];
}

function prop(obj, names) {
    if (!obj) return '';
    for (var i = 0; i < names.length; i++) {
        if (obj[names[i]] != null && obj[names[i]] !== '') return obj[names[i]];
    }
    var objKeys = Object.keys(obj);
    for (var j = 0; j < names.length; j++) {
        var target = String(names[j]).toLowerCase();
        for (var k = 0; k < objKeys.length; k++) {
            if (String(objKeys[k]).toLowerCase() === target) {
                var val = obj[objKeys[k]];
                if (val != null && val !== '') return val;
            }
        }
    }
    return '';
}
