import { OrderLoadReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/OrderLoadReportService.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { getOrderLoadFormTypeFromQuery } from '../../Bizsol.WebERP.UI.Shared/js/OrderLoadFormTypeUtil.js';

/*
  Manage Template for Order Load Report.

  ADD  -> Master Template dropdown (Y). Save requires Template Name; creates user template (N).
  EDIT -> Master + user templates. Master: Show/Hide editable. User template: full edit.
          All changes saved only on Save click. Dropdown colored green (Y) / orange (N).
  Show Total and Decimal Point enabled only when DataType = 'N' (numeric).
*/

function getManageTemplateFormType() {
    var urlParams = BizSolHelperFunction.getUrlVars();
    var formType = getOrderLoadFormTypeFromQuery(
        urlParams['FormType'] || urlParams['formtype'] || '',
        urlParams['ModuleDesp'] || urlParams['moduledesp'] || ''
    );
    return formType || window.G_OL_FORM_TYPE || 'OrderLoad';
}

var G_MT_FORM_TYPE = getManageTemplateFormType();
var G_MT_Mode = 'ADD';                // 'ADD' | 'EDIT'
var G_MT_Rows = [];                   // working copy of grid rows
var G_MT_Loading = false;

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

function loadTemplateDropdown() {
    var $ddl = $('#ddlMtMaster')
        .prop('disabled', true)
        .empty()
        .append($('<option/>').val('').text('Loading...'));

    var loadPromise = (G_MT_Mode === 'ADD')
        ? OrderLoadReportService.GetManageTemplateList('Y', G_MT_FORM_TYPE)
        : Promise.all([
            OrderLoadReportService.GetManageTemplateList('Y', G_MT_FORM_TYPE),
            OrderLoadReportService.GetManageTemplateList('N', G_MT_FORM_TYPE)
        ]).then(function (results) {
            return unwrapApiList(results[0]).concat(unwrapApiList(results[1]));
        });

    loadPromise
        .then(function (res) {
            var list = Array.isArray(res) ? res : unwrapApiList(res);
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
}

function loadTemplateTransaction(code) {
    if (G_MT_Loading) return;
    G_MT_Loading = true;
    setGridLoader(true);

    OrderLoadReportService.GetTemplateTransaction(code)
        .then(function (res) {
            G_MT_Rows = unwrapApiList(res).map(mapRow);
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
        FieldNameAs: String(prop(row, ['FieldNameAs', 'fieldNameAs']) || ''),
        ShowTotal: flag(prop(row, ['ShowTotal', 'showTotal']), 'N'),
        ApplyFilter: flag(prop(row, ['ApplyFilter', 'applyFilter']), 'N'),
        SortOrder: parseFloat(prop(row, ['SortOrder', 'sortOrder'])) || 0,
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

function renderGrid() {
    var $body = $('#olMtTableBody').empty();
    var $cards = $('#olMtCards').empty();

    if (!G_MT_Rows.length) {
        $('#olMtEmpty').text('This template has no fields.').show();
        $('#olMtTable').hide();
        $('.ol-mt-select-all-bar').removeClass('ol-mt-visible').hide();
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
                '<td class="text-center"><input type="checkbox" class="ol-mt-total" ' + totalAttrs + ' /></td>' +
                '<td class="text-center"><input type="text" inputmode="numeric" class="ol-mt-decimal" ' + decimalAttrs + ' /></td>' +
                '<td class="text-center"><input type="checkbox" class="ol-mt-filter" ' + (row.ApplyFilter === 'Y' ? 'checked' : '') + ' /></td>' +
                '<td class="text-center"><input type="number" step="0.01" class="ol-mt-sort" value="' + row.SortOrder + '" /></td>' +
                '<td class="text-center"><input type="checkbox" class="ol-mt-print" ' + (row.ShowInPrint === 'Y' ? 'checked' : '') + ' /></td>' +
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
                    '<span class="ol-mt-card-label">Sort Order</span>' +
                    '<input type="number" step="0.01" class="ol-mt-sort" value="' + row.SortOrder + '" />' +
                '</div>' +
                '<div class="ol-mt-card-row">' +
                    '<span class="ol-mt-card-label">Decimal Point</span>' +
                    '<input type="text" inputmode="numeric" class="ol-mt-decimal" ' + decimalAttrs + ' />' +
                '</div>' +
                '<div class="ol-mt-card-flags">' +
                    '<label><input type="checkbox" class="ol-mt-total" ' + totalAttrs + ' /> Show Total</label>' +
                    '<label><input type="checkbox" class="ol-mt-filter" ' + (row.ApplyFilter === 'Y' ? 'checked' : '') + ' /> Filter</label>' +
                    '<label><input type="checkbox" class="ol-mt-print" ' + (row.ShowInPrint === 'Y' ? 'checked' : '') + ' /> Print</label>' +
                '</div>' +
            '</div>'
        );
    });

    bindRowEvents();
    syncSelectAllState();
    rebuildFreezeColumnOptions();
    applyGridFieldStates();
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
        $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-filter').prop('checked', on);
    });
    $wrap.on('input.mt', '.ol-mt-sort', function () {
        var idx = rowIndex(this);
        var val = parseFloat(this.value) || 0;
        G_MT_Rows[idx].SortOrder = val;
        $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-sort').val(this.value);
    });
    $wrap.on('change.mt', '.ol-mt-print', function () {
        var idx = rowIndex(this);
        var on = this.checked;
        G_MT_Rows[idx].ShowInPrint = on ? 'Y' : 'N';
        $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-print').prop('checked', on);
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

function clearGrid() {
    G_MT_Rows = [];
    $('#olMtTableBody').empty();
    $('#olMtCards').empty();
    $('#olMtTable').hide();
    $('.ol-mt-select-all-bar').removeClass('ol-mt-visible').hide();
    $('#olMtEmpty').text('Select a template to load its fields.').show();
    $('#chkMtSelectAll').prop('checked', false);
    $('#ddlMtFreezeColumn').empty().append($('<option/>').val('').text('-- None --'));
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
        $hosts.find('.ol-mt-sort').prop('readonly', false);
        $hosts.find('.ol-mt-print').prop('disabled', false);
        $hosts.find('.ol-mt-row-select').prop('disabled', false);
    });

    $('#chkMtSelectAll').prop('disabled', false);
}

function buildSavePayload(selectedCode, name, isMasterSave, visibilityOnly) {
    var saveMode = 'SAVETEMPLATE';
    if (isMasterSave) {
        saveMode = visibilityOnly ? 'SAVEMASTERVISIBILITY' : 'SAVEMASTERTEMPLATE';
    }

    return {
        Mode: saveMode,
        FormType: G_MT_FORM_TYPE,
        MasterTemplete: isMasterSave ? 'Y' : 'N',
        F_TempleteMaster_Code: (G_MT_Mode === 'EDIT' || isMasterSave) ? selectedCode : 0,
        SourceTemplateCode: (G_MT_Mode === 'ADD' && !isMasterSave) ? selectedCode : 0,
        Desp: name,
        FreezeFromColumn: $('#ddlMtFreezeColumn').val() || '',
        Rows: G_MT_Rows.map(function (r, i) {
            return {
                RowNo: i,
                FieldName: r.FieldName,
                FieldNameAs: r.FieldNameAs || r.FieldName,
                ShowTotal: r.ShowTotal,
                ApplyFilter: r.ApplyFilter,
                SortOrder: r.SortOrder,
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

    syncDecimalPointsFromInputs();

    var visibilityOnly = isMasterSave;
    var payload = buildSavePayload(selectedCode, name, isMasterSave, visibilityOnly);
    setGridLoader(true);
    $('#btnMtSave').prop('disabled', true);

    OrderLoadReportService.SaveTemplate(payload)
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
    return String(value || 'N').trim().toUpperCase() === 'Y' ? 'Y' : 'N';
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
