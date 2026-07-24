import { OrderLoadReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/OrderLoadReportService.js';

/*
  Manage Template for Order Load Report.

  ADD  -> "Master Template" dropdown = templates with MasterTemplete = 'Y'.
          Selecting one seeds the editable grid from its F_TempleteTransaction
          fields; Save creates a brand new user template (MasterTemplete = 'N').
  EDIT -> dropdown = user templates (MasterTemplete = 'N'). Loads the saved
          config to edit / delete.
*/

var G_MT_FORM_TYPE = 'OrderLoad';
var G_MT_Mode = 'ADD';                // 'ADD' | 'EDIT'
var G_MT_Rows = [];                   // working copy of grid rows
var G_MT_Loading = false;

$(document).ready(function () {
    $('#btnManageTemplate').on('click', openManageTemplateModal);
    $('#btnMtAdd').on('click', function () { setMode('ADD'); });
    $('#btnMtEdit').on('click', function () { setMode('EDIT'); });
    $('#btnMtDelete').on('click', deleteTemplate);
    $('#btnMtSave').on('click', saveTemplate);
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

    clearGrid();
    loadTemplateDropdown();
}

/* ─────────────────────────── dropdowns ─────────────────────────── */

function loadTemplateDropdown() {
    var masterTemplete = (G_MT_Mode === 'ADD') ? 'Y' : 'N';
    var $ddl = $('#ddlMtMaster')
        .prop('disabled', true)
        .empty()
        .append($('<option/>').val('').text('Loading...'));

    OrderLoadReportService.GetManageTemplateList(masterTemplete, G_MT_FORM_TYPE)
        .then(function (res) {
            var list = unwrapApiList(res);
            $ddl.empty().append($('<option/>').val('').text('-- Select --'));
            list.forEach(function (row) {
                $ddl.append(
                    $('<option/>')
                        .val(prop(row, ['Code', 'code']))
                        .text(prop(row, ['Desp', 'desp']))
                        .attr('data-freeze', prop(row, ['FreezeFromColumn', 'freezeFromColumn']) || '')
                );
            });
            $ddl.prop('disabled', false);
        })
        .catch(function () {
            $ddl.empty().append($('<option/>').val('').text('-- Error --')).prop('disabled', false);
            toastr.error('Could not load templates.');
        });
}

function onMasterTemplateChange() {
    var code = parseInt($('#ddlMtMaster').val(), 10) || 0;
    var isEdit = (G_MT_Mode === 'EDIT');

    $('#btnMtDelete').prop('disabled', !(isEdit && code));

    if (!code) {
        clearGrid();
        if (isEdit) $('#txtMtTemplateName').val('');
        return;
    }

    if (isEdit) {
        $('#txtMtTemplateName').val($('#ddlMtMaster option:selected').text());
    }

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

function mapRow(row) {
    return {
        FieldName: String(prop(row, ['FieldName', 'fieldName']) || ''),
        FieldNameAs: String(prop(row, ['FieldNameAs', 'fieldNameAs']) || ''),
        ShowTotal: flag(prop(row, ['ShowTotal', 'showTotal']), 'N'),
        ApplyFilter: flag(prop(row, ['ApplyFilter', 'applyFilter']), 'N'),
        SortOrder: parseFloat(prop(row, ['SortOrder', 'sortOrder'])) || 0,
        DataType: String(prop(row, ['DataType', 'dataType']) || 'S'),
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
        $body.append(
            '<tr data-idx="' + i + '" class="' + (selected ? 'ol-mt-selected' : '') + '">' +
                '<td class="text-center"><input type="checkbox" class="ol-mt-row-select" ' + (selected ? 'checked' : '') + ' /></td>' +
                '<td class="ol-mt-name">' + escapeHtml(row.FieldName) + '</td>' +
                '<td><input type="text" class="ol-mt-display" value="' + escapeHtml(row.FieldNameAs) + '" /></td>' +
                '<td class="text-center"><input type="checkbox" class="ol-mt-total" ' + (row.ShowTotal === 'Y' ? 'checked' : '') + ' /></td>' +
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
                '</div>' +
                '<div class="ol-mt-card-row">' +
                    '<span class="ol-mt-card-label">Display Name</span>' +
                    '<input type="text" class="ol-mt-display" value="' + escapeHtml(row.FieldNameAs) + '" />' +
                '</div>' +
                '<div class="ol-mt-card-row">' +
                    '<span class="ol-mt-card-label">Sort Order</span>' +
                    '<input type="number" step="0.01" class="ol-mt-sort" value="' + row.SortOrder + '" />' +
                '</div>' +
                '<div class="ol-mt-card-flags">' +
                    '<label><input type="checkbox" class="ol-mt-total" ' + (row.ShowTotal === 'Y' ? 'checked' : '') + ' /> Show Total</label>' +
                    '<label><input type="checkbox" class="ol-mt-filter" ' + (row.ApplyFilter === 'Y' ? 'checked' : '') + ' /> Filter</label>' +
                    '<label><input type="checkbox" class="ol-mt-print" ' + (row.ShowInPrint === 'Y' ? 'checked' : '') + ' /> Print</label>' +
                '</div>' +
            '</div>'
        );
    });

    bindRowEvents();
    syncSelectAllState();
    rebuildFreezeColumnOptions();
}

function bindRowEvents() {
    var $wrap = $('.ol-mt-grid-wrap').off('.mt');

    $wrap.on('change.mt', '.ol-mt-row-select', function () {
        syncRowSelected(this);
        syncSelectAllState();
        rebuildFreezeColumnOptions();
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
        var idx = rowIndex(this);
        var on = this.checked;
        G_MT_Rows[idx].ShowTotal = on ? 'Y' : 'N';
        $('.ol-mt-grid-wrap [data-idx="' + idx + '"] .ol-mt-total').prop('checked', on);
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
}

/* ─────────────────────────── save / delete ─────────────────────────── */

function saveTemplate() {
    if (G_MT_Loading) return;

    var name = ($('#txtMtTemplateName').val() || '').trim();
    if (!name) {
        toastr.warning('Please enter a Template Name.');
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

    var payload = {
        FormType: G_MT_FORM_TYPE,
        F_TempleteMaster_Code: (G_MT_Mode === 'EDIT') ? selectedCode : 0,
        SourceTemplateCode: (G_MT_Mode === 'ADD') ? selectedCode : 0,
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
                DecimalPoint: r.DecimalPoint,
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

    G_MT_Loading = true;
    setGridLoader(true);
    $('#btnMtSave').prop('disabled', true);

    OrderLoadReportService.SaveTemplate(payload)
        .then(function (res) {
            var row = unwrapApiList(res)[0] || {};
            var newCode = parseInt(prop(row, ['Code', 'code']), 10) || 0;
            toastr.success('Template saved successfully.');
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
    if (G_MT_Mode !== 'EDIT') return;
    var code = parseInt($('#ddlMtMaster').val(), 10) || 0;
    if (!code) return;

    if (!window.confirm('Delete template "' + $('#ddlMtMaster option:selected').text() + '"?')) return;

    G_MT_Loading = true;
    setGridLoader(true);

    OrderLoadReportService.DeleteTemplate(code)
        .then(function () {
            toastr.success('Template deleted.');
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
