import { TemplateReportsService as OrderLoadReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/TemplateReportsService.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { getTemplateReportFormTypeFromUrlParams } from '../../Bizsol.WebERP.UI.Shared/js/TemplateReportsFormTypeUtil.js';

/*
  Manage Template for Order Load Report.

  ADD  -> Master Template dropdown (Y). Save requires Template Name; creates user template (N).
  EDIT -> Master + user templates. Master: Show/Hide editable. User template: full edit.
          All changes saved only on Save click. Dropdown colored green (Y) / orange (N).
  Show Total and Decimal Point enabled only when DataType = 'N' (numeric).
*/

function getManageTemplateFormType() {
    var formType = getTemplateReportFormTypeFromUrlParams(BizSolHelperFunction.getUrlVars());
    return formType || window.G_OL_FORM_TYPE || 'OrderLoad';
}

var G_MT_FORM_TYPE = getManageTemplateFormType();
var G_MT_Mode = 'ADD';                // 'ADD' | 'EDIT'
var G_MT_Rows = [];                   // working copy of grid rows
var G_MT_Loading = false;
var G_MT_Users = [];
var G_MT_UsersLoaded = false;

function CheckRight(optionName) {
    var ModuleName = $('#ERPHeading').text().trim();
    var optionName = 'ManageTemplate';
    var FinYear = BizSolHelperFunction.getFinancialYear();
    return MenuService.CheckModuleOptionRight(ModuleName, optionName, 'Y', FinYear);

}

$(document).ready(function () {
    $('#btnManageTemplate').on('click', function () {
        CheckRight('ManageTemplate').then(function (respCheck) {
            if (respCheck && respCheck.CheckModuleOptionRight === 'N') {
                toastr.error(respCheck.Msg || 'You do not have rights for Manage Template.');
                return;
            }
            openManageTemplateModal();
        }).catch(function () {
            toastr.error('Permission check failed.');
        });
    });
    $('#btnMtAdd').on('click', function () { setMode('ADD'); });
    $('#btnMtEdit').on('click', function () { setMode('EDIT'); });
    $('#btnMtDelete').on('click', deleteTemplate);
    $('#btnMtSave').on('click', saveTemplate);
    $('#btnMtHistory').on('click', function () {
        openManageTemplateAmendmentHistory({ mode: 'master' });
    });
    $('#ddlMtMaster').on('change', onMasterTemplateChange);
    $('#olManageTemplateModal').on('click', '.ol-mt-tab', function () {
        showManageTemplateTab($(this).attr('data-mt-tab'));
    });
    $('#chkMtSelectAll').on('change', function () {
        var checked = $(this).is(':checked');
        $('.ol-mt-row-select').prop('checked', checked)
            .each(function () { syncRowSelected(this); });
        rebuildFreezeColumnOptions();
    });
});

/* ─────────────────────────── open / mode ─────────────────────────── */

function openManageTemplateModal() {
    setMode('ADD');
    var modalEl = document.getElementById('olManageTemplateModal');
    if (window.bootstrap && bootstrap.Modal) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    } else {
        $(modalEl).modal('show');
    }
}

function setMode(mode) {
    G_MT_Mode = mode;
    showManageTemplateTab('fields');
    ensureManageTemplateUsers();
    $('#btnMtAdd').toggleClass('active', mode === 'ADD');
    $('#btnMtEdit').toggleClass('active', mode === 'EDIT');
    $('#btnMtDelete').prop('disabled', true);

    $('#lblMtMaster').text(mode === 'ADD' ? 'Master Template' : 'Template');
    $('#txtMtTemplateName').val('').prop('readonly', false);
    $('#olMtTemplateNameField').show();
    $('#ddlMtFreezeColumn').prop('disabled', false);

    if (mode === 'ADD') {
        $('.ol-mt-name-optional').hide();
        $('#txtMtTemplateName')
            .attr('placeholder', 'Enter template name')
            .prop('required', true);
    } else {
        $('.ol-mt-name-optional').show();
        $('#txtMtTemplateName')
            .attr('placeholder', 'Leave blank to update master · enter name for new copy')
            .prop('required', false);
    }

    clearGrid();
    loadTemplateDropdown();
}

/* ─────────────────────────── dropdowns ─────────────────────────── */

function manageTemplateShowAllFlag() {
    return $('#chkShowAllTemplates').is(':checked') ? 'Y' : 'N';
}

function loadTemplateDropdown() {
    var $ddl = $('#ddlMtMaster')
        .prop('disabled', true)
        .empty()
        .append($('<option/>').val('').text('Loading...'));
    var showAll = manageTemplateShowAllFlag();

    var loadPromise = (G_MT_Mode === 'ADD')
        ? Promise.all([
            OrderLoadReportService.GetManageTemplateList('M', G_MT_FORM_TYPE, showAll),
            OrderLoadReportService.GetManageTemplateList('Y', G_MT_FORM_TYPE, showAll)
        ]).then(function (results) {
            return unwrapApiList(results[0]).concat(unwrapApiList(results[1]));
        })
        : Promise.all([
            OrderLoadReportService.GetManageTemplateList('M', G_MT_FORM_TYPE, showAll),
            OrderLoadReportService.GetManageTemplateList('Y', G_MT_FORM_TYPE, showAll),
            OrderLoadReportService.GetManageTemplateList('N', G_MT_FORM_TYPE, showAll)
        ]).then(function (results) {
            return unwrapApiList(results[0]).concat(unwrapApiList(results[1])).concat(unwrapApiList(results[2]));
        });

    loadPromise
        .then(function (res) {
            var list = Array.isArray(res) ? res : unwrapApiList(res);
            var seenCodes = {};
            list = list.filter(function (row) {
                var code = String(prop(row, ['Code', 'code']) || '');
                if (!code || seenCodes[code]) return false;
                seenCodes[code] = true;
                return true;
            });
            $ddl.empty().append($('<option/>').val('').text('-- Select --'));
            list.forEach(function (row) {
                var masterFlag = normalizeMasterTemplete(prop(row, ['MasterTemplete', 'masterTemplete', 'MasterTemplate', 'masterTemplate']));
                var desp = prop(row, ['Desp', 'desp']);
                $ddl.append(
                    $('<option/>')
                        .val(prop(row, ['Code', 'code']))
                        .text(String(desp || '').trim())
                        .attr('data-desp', desp)
                        .attr('data-master-templete', masterFlag)
                        .attr('data-freeze', prop(row, ['FreezeFromColumn', 'freezeFromColumn']) || '')
                        .attr('data-users', userCodesFromTemplateRow(row))
                        .addClass(getManageTemplateOptionClass(masterFlag))
                );
            });
            $ddl.prop('disabled', false);
            updateManageTemplateSelectStyle();
        })
        .catch(function () {
            $ddl.empty().append($('<option/>').val('').text('-- Error --')).prop('disabled', false);
            toastr.error('Could not load templates.');
        });
}

function getManageTemplateOptionClass(masterFlag) {
    return masterFlag === 'Y' ? 'ol-tpl-master-y' : 'ol-tpl-master-n';
}

function updateManageTemplateSelectStyle() {
    var $ddl = $('#ddlMtMaster');
    var $opt = $ddl.find('option:selected');
    var flag = normalizeMasterTemplete($opt.attr('data-master-templete'));

    $ddl.removeClass('ol-tpl-selected-y ol-tpl-selected-n');
    if ($ddl.val()) {
        $ddl.addClass(flag === 'Y' ? 'ol-tpl-selected-y' : 'ol-tpl-selected-n');
    }
}

function onMasterTemplateChange() {
    var code = parseInt($('#ddlMtMaster').val(), 10) || 0;
    var isEdit = (G_MT_Mode === 'EDIT');

    if (!code) {
        clearGrid();
        applyAssignedUsers('');
        if (isEdit) $('#txtMtTemplateName').val('');
        updateManageTemplateSelectStyle();
        applyHeaderFieldStates();
        return;
    }

    if (isEdit) {
        if (!isMasterManageTemplateSelected()) {
            $('#txtMtTemplateName').val(getSelectedManageTemplateName());
        } else {
            $('#txtMtTemplateName').val('');
        }
    }

    updateManageTemplateSelectStyle();
    applyHeaderFieldStates();
    loadTemplateTransaction(code);
    loadAssignedTemplateUsers(code);
}

function loadTemplateTransaction(code) {
    if (G_MT_Loading) return;
    G_MT_Loading = true;
    setGridLoader(true);

    OrderLoadReportService.GetTemplateTransaction(code)
        .then(function (res) {
            var rawRows = unwrapApiList(res);
            G_MT_Rows = rawRows.map(mapRow);
            applyOrderByConditionToRows(G_MT_Rows, rawRows);
            renderGrid();
        })
        .catch(function () {
            toastr.error('Could not load template fields.');
            clearGrid();
        })
        .finally(function () {
            G_MT_Loading = false;
            setGridLoader(false);
        });
}

function showManageTemplateTab(tab) {
    var name = tab === 'users' ? 'users' : 'fields';
    $('.ol-mt-tab').removeClass('active');
    $('.ol-mt-tab[data-mt-tab="' + name + '"]').addClass('active');
    $('.ol-mt-tab-pane').prop('hidden', true);
    $('.ol-mt-tab-pane[data-mt-pane="' + name + '"]').prop('hidden', false);
    if (name === 'users') initManageTemplateUserSelect();
}

function userCodesFromTemplateRow(row) {
    var direct = prop(row, [
        'UserMaster_Codes', 'userMaster_Codes',
        'AssignedUserMaster_Codes', 'assignedUserMaster_Codes',
        'AssignedUserCodes', 'assignedUserCodes',
        'UserCodes', 'userCodes'
    ]);
    if (direct) return String(direct);
    return userCodesFromResponse(row).join(',');
}

function userCodesFromResponse(payload) {
    if (payload == null || payload === '') return [];
    if (typeof payload === 'string' || typeof payload === 'number') {
        return String(payload).split(',').map(function (part) { return part.trim(); }).filter(Boolean);
    }
    if (Array.isArray(payload)) {
        var codes = [];
        payload.forEach(function (item) {
            if (item == null || item === '') return;
            if (typeof item !== 'object') {
                String(item).split(',').forEach(function (part) {
                    if (String(part).trim()) codes.push(String(part).trim());
                });
                return;
            }
            var code = prop(item, [
                'UserMaster_Code', 'userMaster_Code',
                'Code', 'code',
                'UserCode', 'userCode'
            ]);
            if (code) codes.push(String(code).trim());
        });
        return codes.filter(Boolean);
    }
    var packed = prop(payload, [
        'UserMaster_Codes', 'userMaster_Codes',
        'AssignedUserMaster_Codes', 'assignedUserMaster_Codes',
        'AssignedUserCodes', 'assignedUserCodes'
    ]);
    if (packed) return userCodesFromResponse(packed);
    return userCodesFromResponse(unwrapApiList(payload));
}

function selectedManageTemplateUserCodes() {
    var vals = $('#ddlMtUsers').val();
    if (!vals) return '';
    var list = Array.isArray(vals) ? vals : [vals];
    return list.map(function (code) { return String(code || '').trim(); }).filter(Boolean).join(',');
}

function renderManageTemplateUserOptions() {
    var $el = $('#ddlMtUsers');
    var selected = selectedManageTemplateUserCodes();
    $el.empty();
    (G_MT_Users || []).forEach(function (user) {
        var code = prop(user, ['Code', 'code', 'UserMaster_Code', 'userMaster_Code', 'UserCode', 'userCode']);
        var name = prop(user, ['UserName', 'userName', 'Name', 'name', 'FullName', 'fullName', 'UserID', 'userID']);
        code = String(code || '').trim();
        name = String(name || '').trim();
        if (!code || code === '0' || !name) return;
        $el.append($('<option/>').val(code).text(name));
    });
    initManageTemplateUserSelect();
    applyAssignedUsers(selected);
}

function initManageTemplateUserSelect() {
    var $el = $('#ddlMtUsers');
    if (!$el.length || !$.fn.select2) return;
    var current = $el.val();
    if ($el.hasClass('select2-hidden-accessible')) $el.select2('destroy');
    $el.select2({
        placeholder: 'Select users',
        allowClear: true,
        width: '100%',
        closeOnSelect: false,
        dropdownParent: $('#olManageTemplateModal')
    });
    if (current && current.length) $el.val(current).trigger('change');
}

function applyAssignedUsers(codes) {
    var wanted = userCodesFromResponse(codes);
    var available = {};
    $('#ddlMtUsers option').each(function () {
        available[String(this.value)] = true;
    });
    var values = [];
    wanted.forEach(function (code) {
        if (available[code] && values.indexOf(code) < 0) values.push(code);
    });
    var $el = $('#ddlMtUsers');
    $el.val(values);
    if ($el.hasClass('select2-hidden-accessible')) $el.trigger('change');
}

function ensureManageTemplateUsers() {
    if (G_MT_UsersLoaded) return Promise.resolve(G_MT_Users);
    return OrderLoadReportService.GetUserList()
        .then(function (res) {
            var list = unwrapApiList(res);
            if (list.length === 1 && list[0] && !prop(list[0], ['Code', 'code', 'UserName', 'userName'])) {
                list = unwrapApiList(list[0]);
            }
            G_MT_Users = list;
            G_MT_UsersLoaded = true;
            renderManageTemplateUserOptions();
            return G_MT_Users;
        })
        .catch(function () {
            toastr.error('Could not load users.');
            return [];
        });
}

function loadAssignedTemplateUsers(code) {
    var fromOption = String($('#ddlMtMaster option:selected').attr('data-users') || '');
    ensureManageTemplateUsers().then(function () {
        applyAssignedUsers(fromOption);
        if (!code) return;
        OrderLoadReportService.GetTemplateUsers(code)
            .then(function (res) {
                var codes = userCodesFromResponse(res);
                if (codes.length) applyAssignedUsers(codes);
            })
            .catch(function () { });
    });
}

/* ─────────────────────────── grid ─────────────────────────── */

function getTemplateTransactionRowCode(row) {
    if (!row) return 0;
    var raw = prop(row, [
        'Code', 'code',
        'F_TempleteTransaction_Code', 'f_TempleteTransaction_Code',
        'TempleteTransaction_Code', 'templeteTransaction_Code',
        'TransactionCode', 'transactionCode',
        'TranTableCode', 'tranTableCode'
    ]);
    return parseInt(raw, 10) || 0;
}

function mapRow(row) {
    return {
        Code: getTemplateTransactionRowCode(row),
        FieldName: String(prop(row, ['FieldName', 'fieldName']) || ''),
        FieldNameAs: String(prop(row, ['DisplayName', 'displayName', 'FieldNameAs', 'fieldNameAs']) || ''),
        ShowTotal: flag(prop(row, ['ShowTotal', 'showTotal']), 'N'),
        ApplyFilter: flag(prop(row, ['Filter', 'filter', 'ApplyFilter', 'applyFilter']), 'N'),
        FilterValue: String(prop(row, ['FilterValue', 'filterValue', 'FilterText', 'filterText']) || ''),
        SortOrder: parseFloat(prop(row, ['SortOrder', 'sortOrder'])) || 0,
        DataSortOrder: clampDataSortOrder(prop(row, [
            'DataSortOrder', 'dataSortOrder',
            'DataSorting', 'dataSorting',
            'SortData', 'sortData'
        ])),
        DataType: normalizeTemplateRowDataType(prop(row, ['DataType', 'dataType'])),
        Selected: flag(prop(row, ['Selected', 'selected']), 'N'),
        DecimalPoint: parseInt(prop(row, ['DecimalPoint', 'decimalPoint']), 10) || 0,
        EditAllow: flag(prop(row, ['EditAllow', 'editAllow']), 'N'),
        AllowVisible: flag(prop(row, ['AllowVisible', 'allowVisible']), 'Y'),
        ShowInPrint: flag(prop(row, ['ShowInPrint', 'showInPrint']), 'Y'),
        FieldForClient: String(prop(row, ['FieldForClient', 'fieldForClient']) || ''),
        FieldForDate: String(prop(row, ['FieldForDate', 'fieldForDate']) || ''),
        OnClickAction: String(prop(row, ['OnClickAction', 'onClickAction']) || ''),
        OnClickQuery: String(prop(row, ['OnClickQuery', 'onClickQuery']) || '')
    };
}

function orderByConditionFromRows(rawRows) {
    var text = '';
    (rawRows || []).forEach(function (row) {
        if (text) return;
        text = String(prop(row, ['OrderByCondition', 'orderByCondition']) || '').trim();
    });
    return text;
}

function applyOrderByConditionToRows(mappedRows, rawRows) {
    var text = orderByConditionFromRows(rawRows);
    if (!text) return;
    var body = text.replace(/^\s*order\s+by\s+/i, '').trim();
    var rankByField = {};
    body.split(',').forEach(function (part, index) {
        var piece = String(part || '').trim();
        if (!piece) return;
        var name = piece;
        var rank = index + 1;
        var eq = piece.indexOf('=');
        if (eq >= 0) {
            name = piece.slice(0, eq).trim();
            var explicit = parseInt(piece.slice(eq + 1).trim(), 10);
            if (!isNaN(explicit)) rank = explicit;
        }
        name = name.replace(/^\[|\]$/g, '').trim().toLowerCase();
        if (!name || rank <= 0) return;
        rankByField[name] = rank;
    });
    (mappedRows || []).forEach(function (row) {
        var key = String(row.FieldName || '').replace(/^\[|\]$/g, '').trim().toLowerCase();
        row.DataSortOrder = rankByField.hasOwnProperty(key) ? clampDataSortOrder(rankByField[key]) : 0;
    });
}

function renderGrid() {
    var $body = $('#olMtTableBody').empty();
    var $cards = $('#olMtCards').empty();

    if (!G_MT_Rows.length) {
        $('#olMtEmpty').text('This template has no fields.').show();
        $('#olMtTable').hide();
        $('.ol-mt-select-all-bar').removeClass('ol-mt-visible').hide();
        $('#olMtDataSortWarn').prop('hidden', true);
        rebuildFreezeColumnOptions();
        return;
    }

    $('#olMtEmpty').hide();
    $('#olMtTable').show();
    $('.ol-mt-select-all-bar').addClass('ol-mt-visible').show();

    G_MT_Rows.forEach(function (row, i) {
        var selected = row.Selected === 'Y';
        var totalAttrs = buildShowTotalInputAttrs(row);
        var decimalAttrs = buildDecimalPointInputAttrs(row);
        $body.append(
            '<tr data-idx="' + i + '" class="' + (selected ? 'ol-mt-selected' : '') + '">' +
                '<td class="text-center"><input type="checkbox" class="ol-mt-row-select" ' + (selected ? 'checked' : '') + ' /></td>' +
                '<td class="ol-mt-name">' +
                    '<button type="button" class="ol-mt-tran-history" title="Field amendment history" aria-label="Field history">' +
                        '<i class="fas fa-clock-rotate-left"></i>' +
                    '</button>' +
                    '<span class="ol-mt-name-text">' + escapeHtml(row.FieldName) + '</span>' +
                '</td>' +
                '<td><input type="text" class="ol-mt-display" value="' + escapeHtml(row.FieldNameAs) + '" /></td>' +
                '<td class="text-center"><input type="number" step="0.01" class="ol-mt-sort" value="' + row.SortOrder + '" /></td>' +
                '<td class="text-center"><input type="checkbox" class="ol-mt-total" ' + totalAttrs + ' /></td>' +
                '<td class="text-center"><input type="text" inputmode="numeric" class="ol-mt-decimal" ' + decimalAttrs + ' /></td>' +
                '<td class="text-center"><input type="text" inputmode="numeric" maxlength="2" class="ol-mt-datasort" value="' + row.DataSortOrder + '" /></td>' +
                '<td class="text-center"><input type="checkbox" class="ol-mt-filter" ' + (row.ApplyFilter === 'Y' ? 'checked' : '') + ' /></td>' +
                '<td><input type="text" class="ol-mt-filter-value" maxlength="200" value="' + escapeHtml(row.FilterValue) + '" ' + (row.ApplyFilter === 'Y' ? '' : 'disabled') + ' /></td>' +
            '</tr>'
        );

        $cards.append(
            '<div class="ol-mt-card' + (selected ? ' ol-mt-selected' : '') + '" data-idx="' + i + '">' +
                '<div class="ol-mt-card-head">' +
                    '<label class="ol-mt-card-check">' +
                        '<input type="checkbox" class="ol-mt-row-select" ' + (selected ? 'checked' : '') + ' />' +
                        '<span class="ol-mt-card-title">' + escapeHtml(row.FieldName) + '</span>' +
                    '</label>' +
                    '<button type="button" class="ol-mt-tran-history" title="Field amendment history" aria-label="Field history">' +
                        '<i class="fas fa-clock-rotate-left"></i>' +
                    '</button>' +
                '</div>' +
                '<div class="ol-mt-card-row">' +
                    '<span class="ol-mt-card-label">Display Name</span>' +
                    '<input type="text" class="ol-mt-display" value="' + escapeHtml(row.FieldNameAs) + '" />' +
                '</div>' +
                '<div class="ol-mt-card-row">' +
                    '<span class="ol-mt-card-label">Column Order</span>' +
                    '<input type="number" step="0.01" class="ol-mt-sort" value="' + row.SortOrder + '" />' +
                '</div>' +
                '<div class="ol-mt-card-row">' +
                    '<span class="ol-mt-card-label">Decimal Point</span>' +
                    '<input type="text" inputmode="numeric" class="ol-mt-decimal" ' + decimalAttrs + ' />' +
                '</div>' +
                '<div class="ol-mt-card-row">' +
                    '<span class="ol-mt-card-label">Data Sorting</span>' +
                    '<input type="text" inputmode="numeric" maxlength="2" class="ol-mt-datasort" value="' + row.DataSortOrder + '" />' +
                '</div>' +
                '<div class="ol-mt-card-flags">' +
                    '<label><input type="checkbox" class="ol-mt-total" ' + totalAttrs + ' /> Show Total</label>' +
                    '<label><input type="checkbox" class="ol-mt-filter" ' + (row.ApplyFilter === 'Y' ? 'checked' : '') + ' /> Filter</label>' +
                '</div>' +
                '<div class="ol-mt-card-row">' +
                    '<span class="ol-mt-card-label">Filter Value</span>' +
                    '<input type="text" class="ol-mt-filter-value" maxlength="200" value="' + escapeHtml(row.FilterValue) + '" ' + (row.ApplyFilter === 'Y' ? '' : 'disabled') + ' />' +
                '</div>' +
            '</div>'
        );
    });

    bindRowEvents();
    syncSelectAllState();
    rebuildFreezeColumnOptions();
    applyGridFieldStates();
    syncDataSortWarning(false);
}

function bindRowEvents() {
    var $wrap = $('.ol-mt-grid-wrap').off('.mt');

    $wrap.on('change.mt', '.ol-mt-row-select', function () {
        syncRowSelected(this);
        syncSelectAllState();
        rebuildFreezeColumnOptions();
    });
    $wrap.on('click.mt', '.ol-mt-tran-history', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openManageTemplateAmendmentHistory({
            mode: 'transaction',
            rowIndex: rowIndex(this)
        });
    });
    $wrap.on('input.mt', '.ol-mt-display', function () {
        var idx = rowIndex(this);
        var val = this.value;
        G_MT_Rows[idx].FieldNameAs = val;
        // keep table + card inputs in sync
        $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-display').val(val);
        rebuildFreezeColumnOptions();
    });
    $wrap.on('change.mt', '.ol-mt-total', function () {
        if (this.disabled) return;
        var idx = rowIndex(this);
        var on = this.checked;
        G_MT_Rows[idx].ShowTotal = on ? 'Y' : 'N';
        $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-total').prop('checked', on);
    });
    $wrap.on('input.mt', '.ol-mt-decimal', function () {
        if (this.disabled) return;
        var raw = String(this.value || '').replace(/\D/g, '');
        if (raw !== this.value) {
            this.value = raw;
        }
        var idx = rowIndex(this);
        $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-decimal').val(raw);
        if (raw === '') return;
        var parsed = parseInt(raw, 10);
        if (!isNaN(parsed)) {
            G_MT_Rows[idx].DecimalPoint = parsed;
        }
    });
    $wrap.on('change.mt blur.mt', '.ol-mt-decimal', function () {
        if (this.disabled) return;
        var idx = rowIndex(this);
        var val = clampDecimalPoint(this.value);
        G_MT_Rows[idx].DecimalPoint = val;
        $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-decimal').val(val);
    });
    $wrap.on('change.mt', '.ol-mt-filter', function () {
        var idx = rowIndex(this);
        var on = this.checked;
        G_MT_Rows[idx].ApplyFilter = on ? 'Y' : 'N';
        if (!on) {
            G_MT_Rows[idx].FilterValue = '';
            $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-filter-value').val('');
        }
        $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-filter').prop('checked', on);
        syncFilterValueState(idx);
        if (on) {
            $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-filter-value').first().focus();
        }
    });
    $wrap.on('input.mt', '.ol-mt-filter-value', function () {
        if (this.disabled) return;
        var idx = rowIndex(this);
        var val = this.value;
        G_MT_Rows[idx].FilterValue = val;
        $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-filter-value').val(val);
        syncFilterValueState(idx);
    });
    $wrap.on('input.mt', '.ol-mt-sort', function () {
        var idx = rowIndex(this);
        var val = parseFloat(this.value) || 0;
        G_MT_Rows[idx].SortOrder = val;
        $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-sort').val(this.value);
    });
    $wrap.on('input.mt', '.ol-mt-datasort', function () {
        var raw = String(this.value || '').replace(/\D/g, '').slice(0, 2);
        if (raw !== this.value) this.value = raw;
        var idx = rowIndex(this);
        $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-datasort').val(raw);
        G_MT_Rows[idx].DataSortOrder = raw === '' ? 0 : clampDataSortOrder(raw);
        syncDataSortWarning(true);
    });
    $wrap.on('change.mt blur.mt', '.ol-mt-datasort', function () {
        var idx = rowIndex(this);
        var val = clampDataSortOrder(this.value);
        G_MT_Rows[idx].DataSortOrder = val;
        $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-datasort').val(val);
        syncDataSortWarning(true);
    });
}

function rowIndex(el) {
    var $host = $(el).closest('[data-idx]');
    return parseInt($host.attr('data-idx'), 10) || 0;
}

function syncRowSelected(checkboxEl) {
    var idx = rowIndex(checkboxEl);
    var on = checkboxEl.checked;
    G_MT_Rows[idx].Selected = on ? 'Y' : 'N';
    $('.ol-mt-grid-wrap [data-idx="' + idx + '"]').toggleClass('ol-mt-selected', on);
    $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-row-select').prop('checked', on);
}

function syncSelectAllState() {
    // count from table rows only (cards mirror the same data)
    var total = $('#olMtTableBody .ol-mt-row-select').length;
    var checked = $('#olMtTableBody .ol-mt-row-select:checked').length;
    $('#chkMtSelectAll').prop('checked', total > 0 && checked === total);
}

function rebuildFreezeColumnOptions() {
    var current = $('#ddlMtFreezeColumn').val();
    var $ddl = $('#ddlMtFreezeColumn').empty().append($('<option/>').val('').text('-- None --'));

    G_MT_Rows.forEach(function (row) {
        if (row.Selected !== 'Y') return;
        var label = row.FieldNameAs || row.FieldName;
        $ddl.append($('<option/>').val(label).text(label));
    });

    // preserve current selection if still available, else try master's freeze
    if (current && $ddl.find('option[value="' + cssEscape(current) + '"]').length) {
        $ddl.val(current);
    } else {
        var masterFreeze = $('#ddlMtMaster option:selected').attr('data-freeze') || '';
        if (masterFreeze && $ddl.find('option[value="' + cssEscape(masterFreeze) + '"]').length) {
            $ddl.val(masterFreeze);
        }
    }
}

var G_MT_DataSortWarnShown = false;

function clampDataSortOrder(value) {
    var text = String(value == null ? '' : value).replace(/\D/g, '').slice(0, 2);
    if (text === '') return 0;
    var n = parseInt(text, 10);
    if (isNaN(n) || n < 0) return 0;
    if (n > 99) return 99;
    return n;
}

function countChosenDataSorts() {
    var count = 0;
    (G_MT_Rows || []).forEach(function (row) {
        if (clampDataSortOrder(row && row.DataSortOrder) !== 0) count++;
    });
    return count;
}

function syncDataSortWarning(showToast) {
    var overLimit = countChosenDataSorts() > 3;
    $('#olMtDataSortWarn').prop('hidden', !overLimit);
    if (!overLimit) {
        G_MT_DataSortWarnShown = false;
        return;
    }
    if (showToast && !G_MT_DataSortWarnShown) {
        toastr.warning('More than 3 data sorting columns will make the report slow to load.');
        G_MT_DataSortWarnShown = true;
    }
}

function clearGrid() {
    G_MT_Rows = [];
    $('#olMtTableBody').empty();
    $('#olMtCards').empty();
    $('#olMtTable').hide();
    $('.ol-mt-select-all-bar').removeClass('ol-mt-visible').hide();
    $('#olMtEmpty').text('Select a template to load its fields.').show();
    $('#chkMtSelectAll').prop('checked', false);
    $('#olMtDataSortWarn').prop('hidden', true);
    G_MT_DataSortWarnShown = false;
    $('#ddlMtFreezeColumn').empty().append($('<option/>').val('').text('-- None --'));
    applyAssignedUsers('');
    updateManageTemplateSelectStyle();
    applyHeaderFieldStates();
}

function isMasterTemplateEditMode() {
    return G_MT_Mode === 'EDIT' && isMasterManageTemplateSelected();
}

function normalizeTemplateRowDataType(value) {
    var t = String(value == null ? '' : value).trim().toUpperCase();
    if (t === 'N' || t === 'NUMERIC' || t === 'NUMBER' || t === 'D' || t === 'DECIMAL' || t === 'M') {
        return 'N';
    }
    if (t === 'S' || t === 'STRING' || t === 'V' || t === 'VARCHAR' || t === 'C') {
        return 'S';
    }
    return t ? t : 'S';
}

function isNumericDataType(dataType) {
    return normalizeTemplateRowDataType(dataType) === 'N';
}

/** Explicit varchar labels from template — never treat as numeric even if name looks like a number. */
function isKnownStringTemplateField(fieldName) {
    var name = String(fieldName || '').replace(/^\[|\]$/g, '').trim().toLowerCase();
    if (!name) return true;
    return /^(particular|rmgrade|materialtype|rateunit|sizeparameters|partyname|itemname|orderno|marketingman|godown|process|remarks|description|desp|status|category|unit|uom|type|name|code|date|orderdate|client|customer|buyer|supplier|address|city|state|country|email|phone|mobile|gst|pan|hsn|specification|spec|color|colour|grade|brand|model|serial|batch|lot|shift|shiftname|shiftcode)$/i.test(name)
        || /parameters$/i.test(name)
        || /^fieldfor/i.test(name);
}

function inferNumericTemplateField(row) {
    if (isNumericDataType(row.DataType)) return true;
    if (normalizeTemplateRowDataType(row.DataType) === 'S') {
        if (isKnownStringTemplateField(row.FieldName)) return false;
        var name = String(row.FieldName || '').replace(/^\[|\]$/g, '').trim().toLowerCase();
        if (!name) return false;
        return /(?:^|[a-z0-9])(qty|quantity|rate|cost|amount|price|value|charge|weight|spread|bal|book|cancel|dispatch|disp|net|pending|total|mt|mtrs|pc|pcs|kg|mm|mr|percent|pct|rs|inr)(?:$|[a-z0-9])/i.test(name);
    }
    return false;
}

function canEnableNumericFieldOptions(row) {
    return inferNumericTemplateField(row);
}

function clampDecimalPoint(value) {
    var text = String(value == null ? '' : value).trim();
    if (text === '') return 0;
    var n = parseInt(text, 10);
    if (isNaN(n) || n < 0) return 0;
    if (n > 9) return 9;
    return n;
}

function syncDecimalPointsFromInputs() {
    G_MT_Rows.forEach(function (row, i) {
        var $input = $('.ol-mt-grid-wrap [data-idx="' + i + '"] .ol-mt-decimal').first();
        if (!$input.length || $input.prop('disabled')) return;
        var val = clampDecimalPoint($input.val());
        row.DecimalPoint = val;
        $('.ol-mt-grid-wrap [data-idx="' + i + '"] .ol-mt-decimal').val(val);
    });
}

function buildShowTotalInputAttrs(row) {
    var enabled = canEnableNumericFieldOptions(row);
    if (!enabled) {
        row.ShowTotal = 'N';
        return 'disabled';
    }
    return row.ShowTotal === 'Y' ? 'checked' : '';
}

function buildDecimalPointInputAttrs(row) {
    var enabled = canEnableNumericFieldOptions(row);
    var val = clampDecimalPoint(row.DecimalPoint);
    row.DecimalPoint = val;
    if (!enabled) {
        return 'value="' + val + '" disabled';
    }
    return 'value="' + val + '"';
}

function applyHeaderFieldStates() {
    var hideTemplateName = isMasterTemplateEditMode();

    $('#olMtTemplateNameField').toggle(!hideTemplateName);
    $('#txtMtTemplateName').prop('readonly', false);
    $('#ddlMtFreezeColumn').prop('disabled', false);
    $('#btnMtDelete').prop('disabled', isMasterManageTemplateSelected() || !(parseInt($('#ddlMtMaster').val(), 10) || 0));
    $('#btnMtHistory').prop('disabled', !(parseInt($('#ddlMtMaster').val(), 10) || 0));
}

function isMasterTemplateSave() {
    return G_MT_Mode === 'EDIT' && isMasterManageTemplateSelected();
}

function resolveTemplateSaveName(isMasterSave) {
    if (isMasterSave) {
        return getSelectedManageTemplateName()
            || String($('#ddlMtMaster option:selected').text() || '').trim();
    }
    return ($('#txtMtTemplateName').val() || '').trim();
}

function syncFilterValueState(idx) {
    var row = G_MT_Rows[idx];
    if (!row) return;
    var enabled = row.ApplyFilter === 'Y';
    var empty = !String(row.FilterValue || '').trim();
    $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-filter-value')
        .prop('disabled', !enabled)
        .toggleClass('ol-mt-filter-value--required', enabled && empty);
}

function findMissingFilterValueIndex() {
    for (var i = 0; i < G_MT_Rows.length; i++) {
        if (G_MT_Rows[i].ApplyFilter === 'Y' && !String(G_MT_Rows[i].FilterValue || '').trim()) {
            return i;
        }
    }
    return -1;
}

function syncFilterValuesFromInputs() {
    G_MT_Rows.forEach(function (row, i) {
        var $host = $('.ol-mt-grid-wrap [data-idx="' + i + '"]').first();
        if (!$host.length) return;
        var $check = $host.find('.ol-mt-filter').first();
        var $value = $host.find('.ol-mt-filter-value').first();
        if ($check.length) row.ApplyFilter = $check.is(':checked') ? 'Y' : 'N';
        if ($value.length) row.FilterValue = String($value.val() || '');
    });
}

function sqlFilterFieldName(name) {
    var field = String(name || '').trim();
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(field)) return field;
    return '[' + field.replace(/]/g, ']]') + ']';
}

function sqlFilterLiteral(value) {
    return "'" + String(value == null ? '' : value).replace(/'/g, "''") + "'";
}

function buildManageTemplateFilterCondition() {
    var parts = [];
    G_MT_Rows.forEach(function (row) {
        if (row.ApplyFilter !== 'Y') return;
        var field = String(row.FieldName || '').trim();
        var value = String(row.FilterValue || '').trim();
        if (!field || !value) return;
        parts.push('AND ' + sqlFilterFieldName(field) + '=' + sqlFilterLiteral(value));
    });
    return parts.length ? (' ' + parts.join(' ')) : '';
}

function syncDataSortFromInputs() {
    G_MT_Rows.forEach(function (row, i) {
        var $input = $('.ol-mt-grid-wrap [data-idx="' + i + '"] .ol-mt-datasort').first();
        if (!$input.length) return;
        row.DataSortOrder = clampDataSortOrder($input.val());
    });
}

function buildManageTemplateOrderByCondition() {
    var fields = [];
    G_MT_Rows.forEach(function (row, index) {
        var sortNo = clampDataSortOrder(row.DataSortOrder);
        var field = String(row.FieldName || '').trim();
        if (sortNo <= 0 || !field) return;
        fields.push({ sortNo: sortNo, index: index, field: field });
    });
    fields.sort(function (a, b) {
        if (a.sortNo !== b.sortNo) return a.sortNo - b.sortNo;
        return a.index - b.index;
    });
    return fields.map(function (item) { return item.field; }).join(',');
}

function manageTemplateApiDate(iso) {
    var text = String(iso || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    var p = text.split('-');
    var months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    var month = months[parseInt(p[1], 10) - 1];
    if (!month) return text;
    return String(parseInt(p[2], 10)) + '-' + month + '-' + p[0];
}

function readTemplateLoadError(response) {
    if (response == null || response === '') return '';
    if (typeof response === 'string') {
        var text = response.trim().replace(/^"|"$/g, '');
        if (!text || text.charAt(0) === '[' || text.charAt(0) === '{') {
            try { return readTemplateLoadError(JSON.parse(text)); } catch (e) { return text; }
        }
        return text;
    }
    if (typeof response !== 'object') return '';
    var status = String(prop(response, ['Status', 'status']) || '').trim().toUpperCase();
    var message = String(prop(response, [
        'Message', 'message', 'Msg', 'msg', 'Error', 'error',
        'ErrorMessage', 'errorMessage', 'ExceptionMessage', 'exceptionMessage'
    ]) || '').trim();
    if (status === 'N' || status === 'E' || status === 'ERROR') {
        return message || 'Filter condition is not valid.';
    }
    if (message && !unwrapApiList(response).length && !Array.isArray(response)) {
        return message;
    }
    return '';
}

function validateManageTemplateFilterCondition(templateCode, filterCondition) {
    if (!filterCondition) return Promise.resolve();
    return OrderLoadReportService.GetTemplateReports({
        reportType: getSelectedManageTemplateName(),
        templateCode: templateCode,
        filterCondition: filterCondition,
        queryCondition: '',
        fromDate: manageTemplateApiDate($('#txtFromDate').val()),
        toDate: manageTemplateApiDate($('#txtToDate').val())
    }).then(function (res) {
        var message = readTemplateLoadError(res);
        if (message) throw { message: message };
    });
}

function applyGridFieldStates() {
    applyHeaderFieldStates();

    G_MT_Rows.forEach(function (row, i) {
        var $hosts = $('.ol-mt-grid-wrap [data-idx="' + i + '"]');
        var numericEnabled = canEnableNumericFieldOptions(row);

        if (!numericEnabled) {
            row.ShowTotal = 'N';
        }

        $hosts.find('.ol-mt-total')
            .prop('disabled', !numericEnabled)
            .prop('checked', numericEnabled && row.ShowTotal === 'Y');
        row.DecimalPoint = clampDecimalPoint(row.DecimalPoint);
        $hosts.find('.ol-mt-decimal')
            .prop('disabled', !numericEnabled)
            .prop('readonly', !numericEnabled)
            .toggleClass('ol-mt-decimal--locked', !numericEnabled)
            .toggleClass('ol-mt-decimal--editable', numericEnabled)
            .val(row.DecimalPoint);
        $hosts.find('.ol-mt-display').prop('readonly', false);
        $hosts.find('.ol-mt-filter').prop('disabled', false);
        syncFilterValueState(i);
        $hosts.find('.ol-mt-sort').prop('readonly', false);
        $hosts.find('.ol-mt-datasort').prop('readonly', false);
        $hosts.find('.ol-mt-row-select').prop('disabled', false);
    });

    $('#chkMtSelectAll').prop('disabled', false);
}

function buildSavePayload(selectedCode, name, isMasterSave, visibilityOnly) {
    // USP_WebAPI_ManageTemplate only handles Mode = 'SAVE' (create when F_TempleteMaster_Code = 0, update otherwise).
    return {
        Mode: 'SAVE',
        FormType: G_MT_FORM_TYPE,
        MasterTemplete: isMasterSave ? 'M' : 'N',
        F_TempleteMaster_Code: (G_MT_Mode === 'EDIT' || isMasterSave) ? selectedCode : 0,
        SourceTemplateCode: (G_MT_Mode === 'ADD' && !isMasterSave) ? selectedCode : 0,
        Desp: name,
        FreezeFromColumn: $('#ddlMtFreezeColumn').val() || '',
        UserMaster_Codes: selectedManageTemplateUserCodes(),
        AssignedUserMaster_Codes: selectedManageTemplateUserCodes(),
        FilterCondition: buildManageTemplateFilterCondition(),
        OrderByCondition: buildManageTemplateOrderByCondition(),
        Rows: G_MT_Rows.map(function (r, i) {
            return {
                Code: parseInt(r.Code, 10) || 0,
                RowNo: i,
                FieldName: r.FieldName,
                DisplayName: r.FieldNameAs || r.FieldName,
                FieldNameAs: r.FieldNameAs || r.FieldName,
                ShowTotal: r.ShowTotal,
                ApplyFilter: r.ApplyFilter,
                Filter: r.ApplyFilter,
                FilterValue: String(r.FilterValue || '').trim(),
                SortOrder: r.SortOrder,
                DataSortOrder: clampDataSortOrder(r.DataSortOrder),
                DataSorting: clampDataSortOrder(r.DataSortOrder),
                DataType: r.DataType,
                Selected: r.Selected,
                DecimalPoint: clampDecimalPoint(r.DecimalPoint),
                EditAllow: r.EditAllow,
                AllowVisible: r.AllowVisible,
                ShowInPrint: r.ShowInPrint,
                FieldForClient: r.FieldForClient,
                FieldForDate: r.FieldForDate,
                OnClickAction: r.OnClickAction,
                OnClickQuery: r.OnClickQuery
            };
        })
    };
}

/* ─────────────────────────── save / delete ─────────────────────────── */

function saveTemplate() {
    if (G_MT_Loading) return;

    var masterEdit = isMasterTemplateEditMode();
    var isMasterSave = masterEdit || isMasterTemplateSave();
    var name = resolveTemplateSaveName(isMasterSave);

    if (!name && !isMasterSave) {
        toastr.warning(G_MT_Mode === 'ADD'
            ? 'Please enter a Template Name.'
            : 'Please enter a Template Name for the new copy.');
        $('#txtMtTemplateName').focus();
        return;
    }

    var selectedCode = parseInt($('#ddlMtMaster').val(), 10) || 0;
    if (!selectedCode) {
        toastr.warning(G_MT_Mode === 'ADD' ? 'Please select a Master Template.' : 'Please select a Template.');
        return;
    }
    if (!G_MT_Rows.length) {
        toastr.warning('No fields to save.');
        return;
    }
    if (!G_MT_Rows.some(function (r) { return r.Selected === 'Y'; })) {
        toastr.warning('Select at least one field.');
        return;
    }
    var missingFilter = findMissingFilterValueIndex();
    if (missingFilter >= 0) {
        showManageTemplateTab('fields');
        syncFilterValueState(missingFilter);
        toastr.warning('Filter Value is required when Filter is checked.');
        var $filterValue = $('#olMtTableBody [data-idx="' + missingFilter + '"] .ol-mt-filter-value');
        if ($filterValue.length) $filterValue.focus();
        return;
    }

    syncDecimalPointsFromInputs();
    syncFilterValuesFromInputs();
    syncDataSortFromInputs();
    syncDataSortWarning(true);

    var visibilityOnly = isMasterSave;
    var payload = buildSavePayload(selectedCode, name, isMasterSave, visibilityOnly);
    setGridLoader(true);
    $('#btnMtSave').prop('disabled', true);
    G_MT_Loading = true;

    validateManageTemplateFilterCondition(selectedCode, payload.FilterCondition)
        .then(function () {
            return OrderLoadReportService.SaveTemplate(payload);
        })
        .then(function (res) {
            var row = unwrapApiList(res)[0] || {};
            var newCode = parseInt(prop(row, ['Code', 'code']), 10) || selectedCode;
            toastr.success(isMasterSave ? 'Master template saved.' : 'Template saved successfully.');
            closeModal();
            refreshMainTemplates(newCode);
        })
        .catch(function (err) {
            toastr.error(apiError(err, 'Could not save template.'));
        })
        .finally(function () {
            G_MT_Loading = false;
            setGridLoader(false);
            $('#btnMtSave').prop('disabled', false);
        });
}

function deleteTemplate() {
    var code = parseInt($('#ddlMtMaster').val(), 10) || 0;
    if (!code) {
        toastr.warning('Please select a template.');
        return;
    }

    if (isMasterManageTemplateSelected()) {
        toastr.warning('Master template not delete.');
        return;
    }

    if (G_MT_Mode !== 'EDIT') {
        toastr.warning('Switch to Edit mode to delete user template.');
        return;
    }

    var templateName = getSelectedManageTemplateName();
    if (!window.confirm('Delete user template "' + templateName + '"?')) return;

    G_MT_Loading = true;
    setGridLoader(true);

    OrderLoadReportService.DeleteTemplate(code)
        .then(function () {
            toastr.success('User template delete.');
            $('#txtMtTemplateName').val('');
            clearGrid();
            loadTemplateDropdown();
            refreshMainTemplates(0);
        })
        .catch(function (err) {
            toastr.error(apiError(err, 'Could not delete template.'));
        })
        .finally(function () {
            G_MT_Loading = false;
            setGridLoader(false);
        });
}

function isMasterManageTemplateSelected() {
    if (G_MT_Mode === 'ADD') {
        return true;
    }

    var $opt = $('#ddlMtMaster option:selected');
    return normalizeMasterTemplete($opt.attr('data-master-templete')) === 'Y';
}

function getSelectedManageTemplateName() {
    var $opt = $('#ddlMtMaster option:selected');
    return String($opt.attr('data-desp') || $opt.text() || '').trim();
}

function normalizeMasterTemplete(value) {
    if (value === true || value === 1) return 'Y';
    if (value === false || value === 0) return 'N';
    var flag = String(value || 'N').trim().toUpperCase();
    return (flag === 'Y' || flag === 'M') ? 'Y' : 'N';
}

function refreshMainTemplates(selectCode) {
    if (typeof window.OrderLoadReportRefreshTemplates === 'function') {
        window.OrderLoadReportRefreshTemplates(selectCode);
    }
}

function closeModal() {
    var modalEl = document.getElementById('olManageTemplateModal');
    if (window.bootstrap && bootstrap.Modal) {
        var instance = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
        instance.hide();
    } else {
        $(modalEl).modal('hide');
    }
}

/* ─────────────────────────── helpers ─────────────────────────── */

function setGridLoader(visible) {
    $('#olMtGridLoader').toggleClass('ol-visible', !!visible);
}

function flag(value, fallback) {
    if (value === true || value === 1) return 'Y';
    if (value === false || value === 0) return 'N';
    var text = String(value == null ? '' : value).trim().toUpperCase();
    if (text === 'Y' || text === 'N') return text;
    return fallback || 'N';
}

function escapeHtml(text) {
    return String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function cssEscape(value) {
    return String(value == null ? '' : value).replace(/"/g, '\\"');
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

/* ─────────────────────────── amendment history ─────────────────────────── */

var G_MT_AMENDMENT_TABLE_MASTER = 'F_TempleteMaster';
var G_MT_AMENDMENT_TABLE_TRANSACTION = 'F_TempleteTransaction';

/** Master: F_TempleteMaster + template Code; tran name blank, tran code 0. */
function fetchTemplateAmendmentMasterHistory(templateCode) {
    return OrderLoadReportService.GetTemplateAmendmentDetails({
        masterTableName: G_MT_AMENDMENT_TABLE_MASTER,
        masterTableCode: templateCode,
        transactionTableName: '',
        transactionTableCode: 0,
        amendmentNo: 0
    }).then(function (response) {
        return normalizeAmendmentHistoryResponse(response);
    });
}

/** Transaction row: only Tran table name + Tran row Code (master name/code blank/0). */
function fetchTemplateAmendmentTransactionHistory(transactionRowCode) {
    return OrderLoadReportService.GetTemplateAmendmentDetails({
        masterTableName: '',
        masterTableCode: 0,
        transactionTableName: G_MT_AMENDMENT_TABLE_TRANSACTION,
        transactionTableCode: transactionRowCode,
        amendmentNo: 0
    }).then(function (response) {
        return normalizeAmendmentHistoryResponse(response);
    });
}

function normalizeAmendmentHistoryResponse(resp) {
    if (Array.isArray(resp)) return resp;
    if (resp && Array.isArray(resp.data)) return resp.data;
    if (resp && Array.isArray(resp.Data)) return resp.Data;
    return [];
}

function amendmentCanonicalColumnName(key) {
    if (key == null) return key;
    var t = String(key).trim();
    var compact = t.replace(/\s+/g, '').toLowerCase();
    var aliases = {
        trancode: 'TranCode',
        type: 'Type',
        amendmentno: 'Amendment No',
        amendmentdate: 'Amendment Date',
        amendmenttime: 'Amendment Time',
        amendmentby: 'Amendment By'
    };
    return aliases[compact] || t;
}

function formatAmendmentHistoryDate(val) {
    if (val == null || val === '') return '';
    try {
        var d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        return String(val);
    }
}

var G_MT_AMENDMENT_HIDDEN_COLS = ['TranCode', 'Table', '__bizsolRowClass'];

function orderAmendmentHistoryColumns(allKeys, historyMode) {
    /* Audit first, then Old/New, then changed columns (master vs field order). */
    var head = ['Amendment No', 'Amendment Date', 'Amendment Time', 'Amendment By', 'Type'];
    var masterPivot = ['Freeze Column', 'Template Name', 'Desp', 'Description'];
    var tranPivot = [
        'Display Name', 'Decimal Places', 'Decimal Point',
        'Show Total', 'Sort Order', 'Show', 'Filter', 'Show In Print'
    ];
    var pivotPreferred = historyMode === 'transaction'
        ? tranPivot.slice()
        : masterPivot.concat(tranPivot);
    var used = {};
    var ordered = [];

    head.forEach(function (k) {
        if (allKeys.indexOf(k) >= 0 && !used[k]) {
            ordered.push(k);
            used[k] = true;
        }
    });

    pivotPreferred.forEach(function (k) {
        if (allKeys.indexOf(k) >= 0 && !used[k]) {
            ordered.push(k);
            used[k] = true;
        }
    });

    allKeys.filter(function (k) {
        return !used[k] && G_MT_AMENDMENT_HIDDEN_COLS.indexOf(k) < 0;
    }).sort(function (a, b) {
        return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
    }).forEach(function (k) {
        ordered.push(k);
    });

    return ordered;
}

function prepareTemplateAmendmentHistoryRows(rawRows, historyMode) {
    var list = Array.isArray(rawRows) ? rawRows : [];
    var canonicalRows = list.map(function (row) {
        var o = {};
        Object.keys(row).forEach(function (k) {
            o[amendmentCanonicalColumnName(k)] = row[k];
        });
        return o;
    });

    var keySet = new Set();
    canonicalRows.forEach(function (r) {
        Object.keys(r).forEach(function (k) { keySet.add(k); });
    });
    var orderedKeys = orderAmendmentHistoryColumns(Array.from(keySet), historyMode || 'master');
    var numericPivotNames = ['Decimal Places', 'Decimal Point', 'Sort Order', 'Amendment No'];

    return canonicalRows.map(function (r) {
        var out = {};
        orderedKeys.forEach(function (k) {
            var v = r.hasOwnProperty(k) ? r[k] : '';
            if (k === 'Amendment Date' && v !== '' && v != null) {
                out[k] = formatAmendmentHistoryDate(v);
                return;
            }
            if (v === null || v === undefined) v = '';
            if (v === '' && numericPivotNames.indexOf(k) >= 0) {
                out[k] = '—';
            } else {
                out[k] = v;
            }
        });
        var typeRaw = String(r.Type || '').trim();
        if (typeRaw === 'NewValue') {
            out.__bizsolRowClass = 'ol-mt-amend-row-new';
        } else if (typeRaw === 'OldValue') {
            out.__bizsolRowClass = 'ol-mt-amend-row-old';
        }
        return out;
    });
}

function paintAmendmentHistoryRowStyles(bodyId, columnKeys) {
    var typeIdx = columnKeys.indexOf('Type');
    if (typeIdx < 0) return;
    $('#' + bodyId + ' tr').each(function () {
        var $tr = $(this);
        var $typeTd = $tr.children('td').eq(typeIdx);
        var t = $typeTd.text().trim();
        $typeTd.removeClass('ol-mt-amend-type-new ol-mt-amend-type-old');
        if (t === 'NewValue') {
            $typeTd.addClass('ol-mt-amend-type-new');
        } else if (t === 'OldValue') {
            $typeTd.addClass('ol-mt-amend-type-old');
        }
    });
}

function hookAmendmentHistoryGridRepaint(bodyId, columnKeys) {
    var tableId = $('#' + bodyId).closest('table').attr('id') || 'tblOlMtAmendmentHistory';
    var pagSel = '#paginator-' + tableId;
    $(document).off('click.olMtAmendPaint', pagSel).on('click.olMtAmendPaint', pagSel + ' button', function () {
        setTimeout(function () { paintAmendmentHistoryRowStyles(bodyId, columnKeys); }, 0);
    });
    $(document).off('change.olMtAmendPaint', pagSel).on('change.olMtAmendPaint', pagSel + ' select', function () {
        setTimeout(function () { paintAmendmentHistoryRowStyles(bodyId, columnKeys); }, 0);
    });
}

function sortAmendmentHistoryRows(rows) {
    return rows.slice().sort(function (a, b) {
        var noA = parseInt(a['Amendment No'], 10) || 0;
        var noB = parseInt(b['Amendment No'], 10) || 0;
        if (noA !== noB) return noB - noA;
        var tcA = parseInt(a.TranCode, 10) || 0;
        var tcB = parseInt(b.TranCode, 10) || 0;
        if (tcA !== tcB) return tcA - tcB;
        var timeA = String(a['Amendment Time'] || '');
        var timeB = String(b['Amendment Time'] || '');
        if (timeA !== timeB) return timeB.localeCompare(timeA);
        var rank = { OldValue: 0, NewValue: 1 };
        var ra = rank.hasOwnProperty(a.Type) ? rank[a.Type] : 9;
        var rb = rank.hasOwnProperty(b.Type) ? rank[b.Type] : 9;
        return ra - rb;
    });
}

function showManageTemplateHistoryModal() {
    var histEl = document.getElementById('olMtAmendmentHistoryModal');
    if (!histEl) return;
    if (window.bootstrap && bootstrap.Modal) {
        bootstrap.Modal.getOrCreateInstance(histEl).show();
    } else {
        $(histEl).modal('show');
    }
}

function bindTemplateAmendmentHistoryGrid(raw, Grid, historyMode) {
    historyMode = historyMode === 'transaction' ? 'transaction' : 'master';
    $('#table-header-OlMtAmendmentHistory').empty();
    $('#table-body-OlMtAmendmentHistory').empty();
    $('#paginator-tblOlMtAmendmentHistory').empty();

    if (!raw.length) {
        $('#table-body-OlMtAmendmentHistory').html(
            '<tr><td colspan="99" style="text-align:center;padding:24px;color:#64748b;">No amendment history found.</td></tr>'
        );
        return;
    }

    var rows = sortAmendmentHistoryRows(prepareTemplateAmendmentHistoryRows(raw, historyMode));
    var keys = Object.keys(rows[0]);
    var hiddenColumns = G_MT_AMENDMENT_HIDDEN_COLS.filter(function (k) {
        return keys.indexOf(k) >= 0;
    });
    var DateFilterColumn = keys.indexOf('Amendment Date') >= 0 ? ['Amendment Date'] : [];
    var NumericFilterColumn = keys.filter(function (k) {
        return hiddenColumns.indexOf(k) < 0
            && (k === 'Amendment No' || k === 'Decimal Places' || k === 'Decimal Point' || k === 'Sort Order');
    });
    var StringFilterColumn = keys.filter(function (k) {
        return hiddenColumns.indexOf(k) < 0
            && DateFilterColumn.indexOf(k) < 0
            && NumericFilterColumn.indexOf(k) < 0;
    });
    var ColumnAlignment = {};
    keys.forEach(function (k) {
        if (NumericFilterColumn.indexOf(k) >= 0) {
            ColumnAlignment[k] = 'right';
        } else if (k === 'Type') {
            ColumnAlignment[k] = 'center';
        }
    });

    Grid.CreateDataTable(
        'table-header-OlMtAmendmentHistory',
        'table-body-OlMtAmendmentHistory',
        rows,
        false,
        [],
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        [],
        hiddenColumns,
        ColumnAlignment,
        true
    );

    var bodyId = 'table-body-OlMtAmendmentHistory';
    setTimeout(function () {
        paintAmendmentHistoryRowStyles(bodyId, keys);
        hookAmendmentHistoryGridRepaint(bodyId, keys);
    }, 0);
}

function openManageTemplateAmendmentHistory(options) {
    var opts = options || {};
    var mode = opts.mode === 'transaction' ? 'transaction' : 'master';
    var templateCode = parseInt($('#ddlMtMaster').val(), 10) || 0;
    if (!templateCode) {
        toastr.warning('Please select a template first.');
        return;
    }

    var Grid = window.BizsolCustomFilterGrid;
    if (!Grid || typeof Grid.CreateDataTable !== 'function') {
        toastr.error('Grid component not loaded.');
        return;
    }

    var templateName = getSelectedManageTemplateName()
        || String($('#ddlMtMaster option:selected').text() || '').trim();
    var loadPromise;
    var titleText = 'Template Amendment History — Master';
    var subtitle = templateName + ' · Master Code ' + templateCode + ' · ' + G_MT_FORM_TYPE;

    if (mode === 'transaction') {
        var rowIdx = parseInt(opts.rowIndex, 10);
        var fieldRow = G_MT_Rows[rowIdx];
        if (!fieldRow) {
            toastr.warning('Field row not found.');
            return;
        }
        var tranCode = getTemplateTransactionRowCode(fieldRow);
        if (!tranCode) {
            toastr.warning('Transaction code missing for this field. Check GetTemplateTransaction returns Code (F_TempleteTransaction PK).');
            return;
        }
        var fieldLabel = String(fieldRow.FieldNameAs || fieldRow.FieldName || '').trim() || ('Row ' + (rowIdx + 1));
        titleText = 'Field Amendment History';
        subtitle = fieldLabel + ' · Template ' + templateName + ' (' + templateCode + ')';
        loadPromise = fetchTemplateAmendmentTransactionHistory(tranCode);
    } else {
        loadPromise = fetchTemplateAmendmentMasterHistory(templateCode);
    }

    $('#olMtAmendmentHistoryLabel').html('<i class="fas fa-clock-rotate-left me-2"></i>' + escapeHtml(titleText));
    $('#olMtAmendmentHistorySubtitle').text(subtitle);

    showManageTemplateHistoryModal();
    setGridLoader(true);

    loadPromise
        .then(function (raw) {
            bindTemplateAmendmentHistoryGrid(raw, Grid, mode);
        })
        .catch(function (err) {
            toastr.error(apiError(err, 'Could not load amendment history. Ensure GetTemplateAmendmentDetails API is deployed.'));
        })
        .finally(function () {
            setGridLoader(false);
        });
}
