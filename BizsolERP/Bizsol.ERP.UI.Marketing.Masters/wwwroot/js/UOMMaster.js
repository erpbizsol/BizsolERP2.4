import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { UOMMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/UOMMasterService.js';

var authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
var G_UserMasterCode = authKeyData.UserMaster_Code || 0;

var G_UOM_SourceRows = [];
var G_UOM_DetailMode = 'list';

function getFinancialYear() {
    return BizSolHelperFunction.getFinancialYear();
}
function firstArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload.$values && Array.isArray(payload.$values)) return payload.$values;
    if (payload.data   && Array.isArray(payload.data))   return payload.data;
    if (payload.Data   && Array.isArray(payload.Data))   return payload.Data;
    if (payload.value  && Array.isArray(payload.value))  return payload.value;
    if (payload.Value  && Array.isArray(payload.Value))  return payload.Value;
    return [];
}
function firstRecord(payload) {
    if (!payload) return null;
    if (Array.isArray(payload)) return payload.length ? payload[0] : null;
    if (payload.$values && Array.isArray(payload.$values)) return payload.$values.length ? payload.$values[0] : null;
    if (payload.data != null && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data;
    if (payload.Data != null && typeof payload.Data === 'object' && !Array.isArray(payload.Data)) return payload.Data;
    if (typeof payload === 'object') return payload;
    return null;
}
function showModal(id) {
    try {
        const el = document.getElementById(id);
        if (window.bootstrap && window.bootstrap.Modal) {
            window.bootstrap.Modal.getOrCreateInstance(el).show();
        } else {
            $('#' + id).modal('show');
        }
    } catch (e) { $('#' + id).modal('show'); }
}
function hideModal(id) {
    try {
        const el = document.getElementById(id);
        if (window.bootstrap && window.bootstrap.Modal) {
            const m = window.bootstrap.Modal.getInstance(el);
            if (m) m.hide();
        } else {
            $('#' + id).modal('hide');
        }
    } catch (e) { $('#' + id).modal('hide'); }
}
function bindGSTUOMDropdown(rows) {
    var $sel = $('#ddlGSTUOM');
    $sel.empty();
    $sel.append(new Option('-- Select GST UOM --', ''));
    var seen = {};
    $.each(rows, function (_, item) {
        var gstUom = (item.GSTUOM || item.Desp || item.Description || '').toString().trim();
        if (!gstUom || seen[gstUom]) return;   
        seen[gstUom] = true;
        $sel.append(new Option(gstUom, gstUom));
    });
    if ($sel.data('select2')) $sel.select2('destroy');
    $sel.select2({ width: '100%', placeholder: '-- Select GST UOM --', allowClear: true });
}
function loadGSTUOMDropdown() {
    return UOMMasterService.GetGSTUOMDropDown()
        .then(function (res) {
            bindGSTUOMDropdown(firstArray(res));
        })
        .catch(function () {
            bindGSTUOMDropdown([]);
        });
}
function showFieldError(fieldId, message) {
    var $field = $('#' + fieldId);
    $field.addClass('uom-input-error');
    var $wrap = $field.closest('.uom-fg');
    $wrap.find('.uom-field-error').remove();
    $wrap.append(
        '<div class="uom-field-error">' +
        '<i class="fas fa-circle-exclamation"></i> <span>' + message + '</span>' +
        '</div>'
    );
}
function clearFieldError(fieldId) {
    $('#' + fieldId).removeClass('uom-input-error');
    $('#' + fieldId).closest('.uom-fg').find('.uom-field-error').remove();
}
function clearAllFieldErrors() {
    $('#uomDetailPanel .uom-input-error').removeClass('uom-input-error');
    $('#uomDetailPanel .uom-field-error').remove();
}
function clearForm() {
    clearAllFieldErrors();
    $('#hfUOMMaster_Code').val('0');
    $('#txtUOM').val('');
    $('#ddlGSTUOM').val('').trigger('change');
    $('#txtDecimalPoints').val('0');
}
function setDetailFormMode(mode) {
    G_UOM_DetailMode = mode;
    var ro = mode === 'view';
    $('#uomDetailPanel').toggleClass('uom-readonly', ro);
    $('#txtUOM, #txtDecimalPoints').prop('disabled', ro);
    $('#ddlGSTUOM').prop('disabled', ro);
    try { if ($('#ddlGSTUOM').data('select2')) $('#ddlGSTUOM').prop('disabled', ro); } catch (e) {}
    if (!ro) {
        $('#btnSaveUOM, #btnClearUOM').show();
    } else {
        $('#btnSaveUOM, #btnClearUOM').hide();
    }
}
function showListPanel() {
    $('#uomListPanel').show();
    $('#uomDetailPanel').hide();
    G_UOM_DetailMode = 'list';
    refreshUOMGrid();
}
function showDetailPanel(mode) {
    $('#uomListPanel').hide();
    $('#uomDetailPanel').show();
    setDetailFormMode(mode);
}
function buildActionHtml(code) {
    return (
        '<div class="pm-actions">' +
        '<button type="button" class="pm-icon-btn view" title="View" onclick="UOM_OpenView(' + code + ')"><i class="fas fa-eye"></i></button>' +
        '<button type="button" class="pm-icon-btn edit" title="Edit" onclick="UOM_OpenEdit(' + code + ')"><i class="fas fa-pencil-alt"></i></button>' +
        '<button type="button" class="pm-icon-btn del"  title="Delete" onclick="UOM_OpenDelete(' + code + ')"><i class="fas fa-trash-alt"></i></button>' +
        '</div>'
    );
}

function formatDate(val) {
    if (val == null || val === '') return '';
    try {
        var d = new Date(val);
        return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-IN');
    } catch (e) { return String(val); }
}
function mapRowForGrid(item, idx) {
    var code = item.Code != null ? Number(item.Code) : 0;
    return {
        'Code'          : code,
        'S.No.'         : idx + 1,
        'UOM'           : item.UOM          != null ? String(item.UOM).trim()          : '',
        'GST UOM'       : item.GSTUOM       != null ? String(item.GSTUOM).trim()       : '',
        'Decimal Points': item.DecimalPoints != null ? Number(item.DecimalPoints)       : 0,
        'Activity By'   : item.ActivityBy   != null ? String(item.ActivityBy).trim()   : '',
        'Create Date'   : formatDate(item.CreateDate),
        'Update Date'   : formatDate(item.UpdateDate),
        'Action'        : buildActionHtml(code),
    };
}
function applyUOMSearch(rows) {
    var q = ($('#uomSearch').val() || '').toLowerCase().trim();
    if (!q) return (rows || []).slice();
    return (rows || []).filter(function (r) {
        return (
            String(r.UOM       || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.GSTUOM    || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.ActivityBy|| '').toLowerCase().indexOf(q) >= 0
        );
    });
}
function bindUOMGridData(filteredRows) {
    var rows = filteredRows || [];

    if (!rows.length) {
        $('#table-header-UOMMaster').empty();
        $('#table-body-UOMMaster').html(
            '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">No records found. Click <strong>Create New</strong> to add.</td></tr>'
        );
        $('#paginator-UOMMaster').empty();
        return;
    }

    var mapped = rows.map(function (item, idx) { return mapRowForGrid(item, idx); });

    var StringFilterColumn      = ['UOM', 'GST UOM'];
    var NumericFilterColumn     = ['Decimal Points'];
    var DateFilterColumn        = [];
    var Button                  = false;
    var showButtons             = [];
    var StringdoubleFilterColumn= [];
    var hiddenColumns = ['Code', 'Activity By', 'Create Date', 'Update Date'];
    var ColumnAlignment         = {
        'S.No.'         : 'center;min-width:52px;white-space:nowrap;',
        'Decimal Points': 'center;min-width:90px;',
        'Action'        : 'center;min-width:128px;white-space:nowrap;',
    };

    if (typeof window.columnFilters === 'object' && window.columnFilters !== null) {
        window.columnFilters = {};
    }

    BizsolCustomFilterGrid.CreateDataTable(
        'table-header-UOMMaster',
        'table-body-UOMMaster',
        mapped,
        Button,
        showButtons,
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        ColumnAlignment,
        true,
        null,
        null
    );
}
function refreshUOMGrid() {
    UOMMasterService.GetUOMMasterList()
        .then(function (res) {
            G_UOM_SourceRows = firstArray(res);
            bindUOMGridData(applyUOMSearch(G_UOM_SourceRows));
        })
        .catch(function (err) {
            G_UOM_SourceRows = [];
            bindUOMGridData([]);
            if (typeof toastr !== 'undefined') toastr.error('Could not load UOM list.');
        });
}
function loadEditRecord(code, mode) {
    return UOMMasterService.GetUOMMasterByCode(code)
        .then(function (res) {
            // DAL uses QueryAsync → API returns an array; take the first element.
            var rec = firstRecord(res);
            if (rec && typeof rec === 'object') {
                $('#hfUOMMaster_Code').val(rec.Code != null ? rec.Code : 0);
                $('#txtUOM').val(rec.UOM != null ? String(rec.UOM).trim() : '');
                $('#txtDecimalPoints').val(rec.DecimalPoints != null ? rec.DecimalPoints : 0);

                // GSTUOM is stored as the description string (e.g. "KGS", "MTS-METRIC TON").
                // Our dropdown uses Desp as value, so a direct .val() match works.
                var gst = rec.GSTUOM != null ? String(rec.GSTUOM).trim() : '';
                $('#ddlGSTUOM').val(gst);
                if ($('#ddlGSTUOM').data('select2')) {
                    $('#ddlGSTUOM').trigger('change.select2');
                }
            }
            setDetailFormMode(mode || 'edit');
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.warning('Could not load record from server.');
        });
}
function buildSavePayload() {
    // ddlGSTUOM value IS the Desp string (e.g. "KGS") — that's what the SP stores.
    return {
        Code          : parseInt($('#hfUOMMaster_Code').val() || '0', 10) || 0,
        UOM           : ($('#txtUOM').val() || '').trim(),
        GSTUOM        : ($('#ddlGSTUOM').val() || '').trim(),
        DecimalPoints : parseInt($('#txtDecimalPoints').val() || '0', 10),
        UserMaster_Code: G_UserMasterCode,
    };
}
function saveUOM() {
    var currentCode = parseInt($('#hfUOMMaster_Code').val() || '0', 10) || 0;
    var ModuleName  = 'UOM Master';
    var OptionName  = currentCode > 0 ? 'Edit' : 'New';

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, 'Y', getFinancialYear())
        .then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
                return;
            }

            // ── Validation ────────────────────────────────────────────────
            var uom = ($('#txtUOM').val() || '').trim();
            if (!uom) {
                showFieldError('txtUOM', 'UOM Name is required.');
                $('#txtUOM').focus();
                return;
            }

            var gstVal = ($('#ddlGSTUOM').val() || '').trim();
            if (!gstVal) {
                if (typeof toastr !== 'undefined') toastr.warning('Please select a GST UOM.');
                try {
                    if ($('#ddlGSTUOM').data('select2')) $('#ddlGSTUOM').select2('open');
                    else $('#ddlGSTUOM').focus();
                } catch (e) { $('#ddlGSTUOM').focus(); }
                return;
            }

            var dpRaw = $('#txtDecimalPoints').val().trim();
            var dp = parseInt(dpRaw, 10);
            if (dpRaw === '' || isNaN(dp) || dp < 0 || dp > 4) {
                showFieldError('txtDecimalPoints', 'Decimal Points must be between 0 and 4.');
                $('#txtDecimalPoints').focus();
                return;
            }

            UOMMasterService.SaveUOMMaster(buildSavePayload())
                .then(function (res) {
                    var ok = res && (res.Status === 'Y' || res.status === 'Y');
                    if (ok) {
                        if (typeof toastr !== 'undefined') toastr.success((res && (res.Msg || res.Message)) || 'Saved successfully.');
                        clearAllFieldErrors();
                        setTimeout(function () { showListPanel(); }, 900);
                    } else {
                        if (typeof toastr !== 'undefined') toastr.error((res && (res.Msg || res.Message || res.message)) || 'Save failed.');
                    }
                })
                .catch(function () {
                    if (typeof toastr !== 'undefined') toastr.error('Save request failed. Please check UOM API endpoints.');
                });
        });
}
function UOM_OpenView(code) {
    MenuService.CheckModuleOptionRight('UOM Master', 'View', 'Y', getFinancialYear())
        .then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
                return;
            }
            showDetailPanel('view');
            loadGSTUOMDropdown().then(function () {
                clearForm();
                loadEditRecord(code, 'view');
            });
        });
}
function UOM_OpenEdit(code) {
    MenuService.CheckModuleOptionRight('UOM Master', 'Edit', 'Y', getFinancialYear())
        .then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
                return;
            }
            showDetailPanel('edit');
            loadGSTUOMDropdown().then(function () {
                clearForm();
                loadEditRecord(code, 'edit');
            });
        });
}
function UOM_OpenDelete(code) {
    MenuService.CheckModuleOptionRight('UOM Master', 'Delete', 'Y', getFinancialYear())
        .then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
                return;
            }
            $('#hfUOMDeleteCode').val(code);
            $('#uomReasonForDelete').val('');
            showModal('dvUOMDeleteModal');
            setTimeout(function () { $('#uomReasonForDelete').focus(); }, 300);
        });
}
function confirmUOMDelete() {
    var code   = parseInt($('#hfUOMDeleteCode').val() || '0', 10) || 0;
    var reason = ($('#uomReasonForDelete').val() || '').trim();
    if (!code) { hideModal('dvUOMDeleteModal'); return; }
    if (!reason) {
        if (typeof toastr !== 'undefined') toastr.warning('Please enter a reason for deletion.');
        $('#uomReasonForDelete').focus();
        return;
    }
    UOMMasterService.DeleteUOMMaster(code, reason)
        .then(function (res) {
            var ok = res && (res.Status === 'Y' || res.status === 'Y');
            if (ok) {
                hideModal('dvUOMDeleteModal');
                if (typeof toastr !== 'undefined') toastr.success((res && res.Msg) || 'Deleted successfully.');
                refreshUOMGrid();
            } else {
                if (typeof toastr !== 'undefined') toastr.error((res && (res.Msg || res.message)) || 'Delete failed.');
            }
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.error('Delete request failed.');
        });
}
$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    if (!$('#ERPHeading').text().trim()) {
        $('#ERPHeading').text('UOM Master');
    }

    $('#btnCreateUOM').on('click', function () {
        loadGSTUOMDropdown().then(function () {
            clearForm();
            showDetailPanel('new');
        });
    });

    $('#btnBackToUOMList').on('click', function () { showListPanel(); });
    $('#btnClearUOM').on('click', function () { clearForm(); });
    $('#btnSaveUOM').on('click', function () { saveUOM(); });
    $('#btnUOMConfirmDelete').on('click', function () { confirmUOMDelete(); });

    // ── Live validation ───────────────────────────────────────────────────
    $('#txtUOM').on('blur', function () {
        clearFieldError('txtUOM');
        if (!$(this).val().trim()) showFieldError('txtUOM', 'UOM Name is required.');
    }).on('input', function () {
        if ($(this).val().trim()) clearFieldError('txtUOM');
    });

    $('#txtDecimalPoints').on('keypress', function (e) {
        var ch = String.fromCharCode(e.which);
        if (!/[0-9]/.test(ch)) { e.preventDefault(); return; }
        var current = $(this).val().trim();
        if (current.length >= 1) { e.preventDefault(); return; }
        var next = parseInt(ch, 10);
        if (next < 0 || next > 4) { e.preventDefault(); return; }
    }).on('input', function () {
        var raw = $(this).val().replace(/[^0-9]/g, '');
        if (raw.length > 1) raw = raw.charAt(0);
        $(this).val(raw);
        var n = parseInt(raw, 10);
        if (raw !== '' && !isNaN(n) && n >= 0 && n <= 4) {
            clearFieldError('txtDecimalPoints');
        } else if (raw !== '') {
            showFieldError('txtDecimalPoints', 'Decimal Points must be between 0 and 4.');
        }
    }).on('blur', function () {
        var v = $(this).val().trim(), n = parseInt(v, 10);
        if (v === '' || isNaN(n) || n < 0 || n > 4)
            showFieldError('txtDecimalPoints', 'Decimal Points must be between 0 and 4.');
        else
            clearFieldError('txtDecimalPoints');
    });

    // ── Live search ───────────────────────────────────────────────────────
    var searchTimer;
    $('#uomSearch').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            bindUOMGridData(applyUOMSearch(G_UOM_SourceRows));
        }, 200);
    });

    // ── Deep-link: ?Code=X opens the edit form directly ──────────────────
    var params       = BizSolHelperFunction.getUrlVars();
    var codeFromUrl  = parseInt(params.Code || params.code || '0', 10);

    if (isFinite(codeFromUrl) && codeFromUrl > 0) {
        showDetailPanel('edit');
        loadGSTUOMDropdown().then(function () {
            clearForm();
            $('#hfUOMMaster_Code').val(String(codeFromUrl));
            loadEditRecord(codeFromUrl, 'edit');
        });
    } else {
        refreshUOMGrid();
    }
});

window.UOM_OpenView   = UOM_OpenView;
window.UOM_OpenEdit   = UOM_OpenEdit;
window.UOM_OpenDelete = UOM_OpenDelete;
