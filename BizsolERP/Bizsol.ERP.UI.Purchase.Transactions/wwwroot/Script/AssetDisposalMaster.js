import { AssetDisposalMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/AssetDisposalMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BranchDetailsFunction } from '../../Bizsol.WebERP.UI.Shared/js/BranchdetailsFunction.js';

const ADM_MODULE_NAME = 'Asset Disposal Master';
const TITLE_BRANCH_NEW = 'Adding a new Asset Disposal is not allowed for this branch.';
const TITLE_BRANCH_EDIT = 'Editing is not allowed for this branch.';

let G_Rows = [];
let G_Assets = [];
let G_Mode = 'list';
let G_AllowNew = true;
let G_AllowEdit = true;
let G_AllowDelete = true;
let G_SaveInProgress = false;

function firstPayloadArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.$values)) return payload.$values;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.Data)) return payload.Data;
    return [];
}

function firstPayloadRow(payload) {
    const arr = firstPayloadArray(payload);
    if (arr.length) return arr[0];
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) return payload;
    return null;
}

function esc(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function todayIso() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
}

function formatDisplayDate(val) {
    if (val == null || val === '') return '';
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const p = s.substring(0, 10).split('-');
        return p[2] + '-' + p[1] + '-' + p[0];
    }
    return s;
}

function formatAmount(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return '';
    return n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

function disposeValueParts(raw) {
    let v = String(raw == null ? '' : raw).replace(/,/g, '').trim();
    v = v.replace(/[^\d.]/g, '');
    const dot = v.indexOf('.');
    if (dot >= 0) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '');
    const hasDot = v.indexOf('.') >= 0;
    let whole = hasDot ? v.slice(0, v.indexOf('.')) : v;
    let frac = hasDot ? v.slice(v.indexOf('.') + 1) : '';
    if (frac.length > 3) frac = frac.slice(0, 3);
    if (whole.length + frac.length > 10) {
        frac = frac.slice(0, Math.max(0, 10 - whole.length));
    }
    if (whole.length > 10) whole = whole.slice(0, 10);
    return { hasDot: hasDot, whole: whole, frac: frac };
}

function limitDisposeValue(raw) {
    const parts = disposeValueParts(raw);
    if (parts.whole.length >= 10) return parts.whole.slice(0, 10);
    if (!parts.hasDot) return parts.whole;
    return parts.whole + '.' + parts.frac;
}

function parseAmount(val) {
    const limited = limitDisposeValue(val);
    if (limited === '' || limited === '.') return null;
    if (!/^\d{1,10}(\.\d{1,3})?$/.test(limited)) return null;
    if (limited.replace('.', '').length > 10) return null;
    const n = parseFloat(limited);
    return isNaN(n) ? null : n;
}

function keepDisposeValueFloat(el) {
    if (!el) return;
    el.value = limitDisposeValue(el.value);
}

function rowCode(item) {
    return parseInt(item && (item.Code != null ? item.Code : item.code), 10) || 0;
}

function assetCodeOf(item) {
    return parseInt(item && (item.AssetsMaster_Code != null ? item.AssetsMaster_Code : item.assetsMaster_Code), 10) || 0;
}

function pick(item, pascal, camel) {
    if (!item) return '';
    if (item[pascal] != null) return item[pascal];
    if (camel && item[camel] != null) return item[camel];
    return '';
}

function isStatusYes(response) {
    const row = firstPayloadRow(response) || response;
    if (!row) return false;
    return String(row.Status != null ? row.Status : row.status || '').trim().toUpperCase() === 'Y';
}

function apiMessage(response, fallback) {
    const row = firstPayloadRow(response) || response || {};
    return (row.Msg != null ? row.Msg : row.msg) || fallback || '';
}

function formatAjaxError(err, fallback) {
    let detail = fallback || 'Request failed.';
    if (err && err.xhr) {
        const rt = err.xhr.responseText ? String(err.xhr.responseText).trim() : '';
        if (rt) {
            if (rt.indexOf('{') === 0) {
                try {
                    const parsed = JSON.parse(rt);
                    detail = parsed.Msg || parsed.msg || parsed.title || parsed.message || rt;
                } catch (e) {
                    detail = rt;
                }
            } else {
                detail = rt;
            }
        }
    }
    return detail;
}

function getFinYear() {
    try {
        if (typeof BizSolHelperFunction.getFinancialYear === 'function') {
            const fy = BizSolHelperFunction.getFinancialYear();
            if (fy) return fy;
        }
    } catch (e) { /* local fallback */ }
    const d = new Date();
    let sy = d.getFullYear();
    if (d.getMonth() < 3) sy -= 1;
    return sy + '-' + (sy + 1);
}

function checkRight(optionName, showMsg) {
    const show = showMsg == null ? 'Y' : showMsg;
    return MenuService.CheckModuleOptionRight(ADM_MODULE_NAME, optionName, show, getFinYear())
        .then(function (response) {
            if (response && response.CheckModuleOptionRight === 'N') {
                if (show === 'Y') toastr.error(response.Msg || ('No rights for ' + optionName));
                return false;
            }
            return true;
        })
        .catch(function () {
            if (show === 'Y') toastr.error('Unable to verify module rights.');
            return false;
        });
}

function loadBranchPermissions() {
    try {
        return Promise.all([
            BranchDetailsFunction.AllowNew(),
            BranchDetailsFunction.AllowEdit(),
            BranchDetailsFunction.AllowDelete()
        ]).then(function (results) {
            G_AllowNew = results[0] === true;
            G_AllowEdit = results[1] === true;
            G_AllowDelete = results[2] !== false;
        }).catch(function () {
            G_AllowNew = false;
            G_AllowEdit = false;
            G_AllowDelete = true;
        });
    } catch (e) {
        G_AllowNew = false;
        G_AllowEdit = false;
        G_AllowDelete = true;
        return Promise.resolve();
    }
}

function applyActionRightsToUI() {
    const $btn = $('#btnNewDisposal');
    if (!G_AllowNew) $btn.prop('disabled', true).attr('title', TITLE_BRANCH_NEW);
    else $btn.prop('disabled', false).removeAttr('title');
    if ($('#admDetailPanel').is(':visible') && G_Mode !== 'view') setFormMode(G_Mode);
}

function showModal(id) {
    const el = document.getElementById(id);
    if (window.bootstrap && window.bootstrap.Modal) bootstrap.Modal.getOrCreateInstance(el).show();
    else $('#' + id).modal('show');
}

function hideModal(id) {
    const el = document.getElementById(id);
    if (window.bootstrap && window.bootstrap.Modal) {
        const m = bootstrap.Modal.getInstance(el);
        if (m) m.hide();
    } else {
        $('#' + id).modal('hide');
    }
}

function findRow(code) {
    const id = parseInt(code, 10) || 0;
    return (G_Rows || []).find(function (x) { return rowCode(x) === id; }) || null;
}

function findAsset(code) {
    const id = parseInt(code, 10) || 0;
    return (G_Assets || []).find(function (x) { return rowCode(x) === id; }) || null;
}

function showList() {
    G_Mode = 'list';
    $('#admListPanel').show();
    $('#admDetailPanel').hide();
}
window.ShowAssetDisposalList = showList;

function showForm() {
    $('#admListPanel').hide();
    $('#admDetailPanel').show();
}

function clearFieldErrors() {
    $('#ddlDisposeAsset, #txtDisposeOffDate, #txtValueOfDispose, #txtDisposeRemark').removeClass('adm-input-error');
}

function markError(selector) {
    $(selector).addClass('adm-input-error');
}

function bindAssetSelect() {
    const $el = $('#ddlDisposeAsset');
    if (typeof $.fn.select2 !== 'function') return;
    if ($el.data('select2')) $el.select2('destroy');
    $el.select2({
        width: '100%',
        dropdownParent: $(document.body),
        placeholder: 'Select asset'
    });
}

function loadAssetDropdown(selectedCode, extra) {
    return AssetDisposalMasterService.GetAssetList(selectedCode).then(function (res) {
        G_Assets = firstPayloadArray(res);
        if (extra && rowCode(extra) > 0 && !findAsset(rowCode(extra))) {
            G_Assets.unshift(extra);
        }
        const $ddl = $('#ddlDisposeAsset');
        if ($ddl.data('select2')) $ddl.select2('destroy');
        $ddl.empty().append('<option value="">Select asset</option>');
        G_Assets.forEach(function (item) {
            const code = rowCode(item);
            if (!code) return;
            const tag = pick(item, 'AssetTagNo', 'assetTagNo');
            $ddl.append('<option value="' + code + '">' + esc(tag) + '</option>');
        });
        if (selectedCode) $ddl.val(String(selectedCode));
        bindAssetSelect();
    });
}

function resetForm() {
    clearFieldErrors();
    $('#hdnDisposalCode').val('0');
    $('#txtDisposeOffDate').val(todayIso());
    $('#txtValueOfDispose').val('');
    $('#txtDisposeRemark').val('');
    $('#lblDisposalTitle').text('New Asset Disposal');
}

function setFormMode(mode) {
    G_Mode = mode || 'edit';
    const ro = G_Mode === 'view';
    $('#admDetailPanel').toggleClass('amm-readonly', ro);
    $('#ddlDisposeAsset, #txtDisposeOffDate, #txtValueOfDispose, #txtDisposeRemark').prop('disabled', ro);
    if ($('#ddlDisposeAsset').data('select2')) $('#ddlDisposeAsset').trigger('change.select2');
    const $save = $('#btnSaveDisposal');
    if (ro) {
        $save.hide();
        return;
    }
    $save.show();
    const isEdit = (parseInt($('#hdnDisposalCode').val(), 10) || 0) > 0;
    const canSave = isEdit ? G_AllowEdit : G_AllowNew;
    $save.prop('disabled', !canSave);
    if (canSave) $save.removeAttr('title');
    else $save.attr('title', isEdit ? TITLE_BRANCH_EDIT : TITLE_BRANCH_NEW);
}

function actionHtml(item) {
    const code = rowCode(item);
    const editDisabled = G_AllowEdit ? '' : ' disabled title="' + esc(TITLE_BRANCH_EDIT) + '"';
    const delDisabled = G_AllowDelete ? ' title="Delete"' : ' disabled title="Deleting is not allowed for this branch."';
    return '<div class="text-nowrap">' +
        '<button type="button" class="amm-icon-btn view" title="View" onclick="ViewAssetDisposal(' + code + ')"><i class="fas fa-eye"></i></button>' +
        '<button type="button" class="amm-icon-btn edit ms-1" title="Edit" onclick="EditAssetDisposal(' + code + ')"' + editDisabled + '><i class="fas fa-pen"></i></button>' +
        '<button type="button" class="amm-icon-btn del ms-1"' + delDisabled + ' onclick="DeleteAssetDisposal(' + code + ')"><i class="fas fa-trash"></i></button>' +
        '</div>';
}

function applySearch(rows) {
    const q = ($('#admSearch').val() || '').trim().toLowerCase();
    if (!q) return (rows || []).slice();
    return (rows || []).filter(function (row) {
        const hay = [
            pick(row, 'Asset Tag No', 'asset Tag No'),
            pick(row, 'Remark', 'remark'),
            pick(row, 'Dispose Off Date', 'dispose Off Date'),
            pick(row, 'Value Of Dispose', 'value Of Dispose')
        ].join(' ').toLowerCase();
        return hay.indexOf(q) >= 0;
    });
}

function bindGrid(rows) {
    const list = rows || [];
    if (!list.length) {
        $('#table-header-AssetDisposal').empty();
        $('#table-body-AssetDisposal').html('<tr><td colspan="7" class="text-center text-muted py-4">No records found.</td></tr>');
        $('#paginator-tblAssetDisposal').empty();
        return;
    }
    const mapped = list.map(function (item, idx) {
        return {
            Code: rowCode(item),
            'S.No.': idx + 1,
            'Asset Tag No': pick(item, 'Asset Tag No', 'asset Tag No'),
            'Dispose Off Date': formatDisplayDate(pick(item, 'Dispose Off Date', 'dispose Off Date')),
            'Value Of Dispose': formatAmount(pick(item, 'Value Of Dispose', 'value Of Dispose')),
            Remark: pick(item, 'Remark', 'remark'),
            Action: actionHtml(item)
        };
    });
    if (typeof window.columnFilters === 'object' && window.columnFilters !== null) window.columnFilters = {};
    BizsolCustomFilterGrid.CreateDataTable(
        'table-header-AssetDisposal',
        'table-body-AssetDisposal',
        mapped,
        false,
        [],
        ['Asset Tag No', 'Remark'],
        ['Value Of Dispose'],
        ['Dispose Off Date'],
        [],
        ['Code'],
        {
            'S.No.': 'center;min-width:52px;',
            'Dispose Off Date': 'center;white-space:nowrap;',
            'Value Of Dispose': 'right;white-space:nowrap;min-width:120px;',
            Action: 'center;min-width:130px;white-space:nowrap;'
        },
        true,
        null,
        null
    );
}

function loadList() {
    AssetDisposalMasterService.GetAssetDisposalMasterList('', '').then(function (res) {
        G_Rows = firstPayloadArray(res);
        bindGrid(applySearch(G_Rows));
    }).catch(function (err) {
        console.error('loadList', err);
        toastr.error('Failed to load asset disposals.');
    });
}

function openNew() {
    checkRight('New').then(function (ok) {
        if (!ok) return;
        if (!G_AllowNew) {
            toastr.warning(TITLE_BRANCH_NEW);
            return;
        }
        resetForm();
        loadAssetDropdown(0).then(function () {
            showForm();
            setFormMode('edit');
        }).catch(function () {
            toastr.error('Could not load the asset list.');
        });
    });
}

function fillForm(data) {
    const code = rowCode(data);
    const assetCode = assetCodeOf(data);
    $('#hdnDisposalCode').val(String(code));
    $('#txtDisposeOffDate').val(String(pick(data, 'DisposeOffDate', 'disposeOffDate') || '').substring(0, 10));
    $('#txtValueOfDispose').val(formatAmount(pick(data, 'ValueOfDispose', 'valueOfDispose')));
    $('#txtDisposeRemark').val(pick(data, 'Remark', 'remark'));
    $('#lblDisposalTitle').text(G_Mode === 'view' ? 'View Asset Disposal' : 'Edit Asset Disposal');
    const extra = {
        Code: assetCode,
        AssetTagNo: pick(data, 'AssetTagNo', 'assetTagNo')
    };
    return loadAssetDropdown(assetCode, extra);
}

function loadRecord(code, mode) {
    AssetDisposalMasterService.GetAssetDisposalMasterByCode(code).then(function (res) {
        const data = firstPayloadRow(res);
        if (!data || !rowCode(data)) {
            toastr.warning('Record not found.');
            return;
        }
        G_Mode = mode;
        clearFieldErrors();
        fillForm(data).then(function () {
            showForm();
            setFormMode(mode);
        });
    }).catch(function (err) {
        toastr.error(formatAjaxError(err, 'Failed to load the disposal.'));
    });
}

function viewRecord(code) {
    checkRight('View').then(function (ok) {
        if (!ok) return;
        loadRecord(code, 'view');
    });
}
window.ViewAssetDisposal = viewRecord;

function editRecord(code) {
    checkRight('Edit').then(function (ok) {
        if (!ok) return;
        if (!G_AllowEdit) {
            toastr.warning(TITLE_BRANCH_EDIT);
            return;
        }
        loadRecord(code, 'edit');
    });
}
window.EditAssetDisposal = editRecord;

function deleteRecord(code) {
    checkRight('Delete').then(function (ok) {
        if (!ok) return;
        if (!G_AllowDelete) {
            toastr.warning('Deleting is not allowed for this branch.');
            return;
        }
        const row = findRow(code);
        $('#hfADMDeleteCode').val(String(code));
        $('#admDelAssetName').text(row ? (pick(row, 'AssetTagNo', 'assetTagNo') || 'this disposal') : 'this disposal');
        $('#admReasonForDeleteInput').val('');
        showModal('dvADMDeleteConfirmModal');
    });
}
window.DeleteAssetDisposal = deleteRecord;

function confirmDelete() {
    const code = parseInt($('#hfADMDeleteCode').val(), 10) || 0;
    const reason = ($('#admReasonForDeleteInput').val() || '').trim();
    if (!reason) {
        toastr.warning('Please provide a reason for deletion.');
        $('#admReasonForDeleteInput').focus();
        return;
    }
    if (code <= 0) return;
    AssetDisposalMasterService.DeleteAssetDisposalMaster(code, reason).then(function (res) {
        if (isStatusYes(res)) {
            toastr.success(apiMessage(res, 'Data Delete successfully.'));
            hideModal('dvADMDeleteConfirmModal');
            loadList();
        } else {
            toastr.warning(apiMessage(res, 'Delete failed.'));
        }
    }).catch(function (err) {
        toastr.error(formatAjaxError(err, 'Delete failed.'));
    });
}

function validateForm() {
    clearFieldErrors();
    const assetCode = parseInt($('#ddlDisposeAsset').val(), 10) || 0;
    const date = ($('#txtDisposeOffDate').val() || '').trim();
    const amountRaw = ($('#txtValueOfDispose').val() || '').replace(/,/g, '').trim();
    const amount = parseAmount(amountRaw);
    const remark = ($('#txtDisposeRemark').val() || '').trim();
    if (assetCode <= 0) {
        markError('#ddlDisposeAsset');
        toastr.warning('Please select an asset.');
        return false;
    }
    if (!date) {
        markError('#txtDisposeOffDate');
        toastr.warning('Dispose Off Date is required.');
        return false;
    }
    if (amountRaw === '' || amountRaw === '.') {
        markError('#txtValueOfDispose');
        toastr.warning('Value of Dispose is required.');
        return false;
    }
    if (amount == null) {
        markError('#txtValueOfDispose');
        toastr.warning('Enter up to 10 digits in total, with only 3 digits after the decimal.');
        return false;
    }
    if (amount < 0) {
        markError('#txtValueOfDispose');
        toastr.warning('Value of Dispose cannot be negative.');
        return false;
    }
    if (remark.length > 100) {
        markError('#txtDisposeRemark');
        toastr.warning('Remark cannot exceed 100 characters.');
        return false;
    }
    return true;
}

function saveRecord() {
    if (G_SaveInProgress || G_Mode === 'view') return;
    const code = parseInt($('#hdnDisposalCode').val(), 10) || 0;
    if (code > 0 && !G_AllowEdit) {
        toastr.warning(TITLE_BRANCH_EDIT);
        return;
    }
    if (code <= 0 && !G_AllowNew) {
        toastr.warning(TITLE_BRANCH_NEW);
        return;
    }
    if (!validateForm()) return;
    const rightName = code > 0 ? 'Edit' : 'New';
    checkRight(rightName).then(function (ok) {
        if (!ok) return;
        const assetCode = parseInt($('#ddlDisposeAsset').val(), 10) || 0;
        const payload = {
            Code: code,
            Details: [{
                Code: code,
                AssetsMaster_Code: assetCode,
                DisposeOffDate: ($('#txtDisposeOffDate').val() || '').trim(),
                ValueOfDispose: parseAmount($('#txtValueOfDispose').val()) || 0,
                Remark: ($('#txtDisposeRemark').val() || '').trim()
            }]
        };
        G_SaveInProgress = true;
        $('#btnSaveDisposal').prop('disabled', true);
        AssetDisposalMasterService.SaveAssetDisposalMaster(payload).then(function (res) {
            if (isStatusYes(res)) {
                toastr.success(apiMessage(res, 'Asset disposal saved successfully.'));
                showList();
                loadList();
            } else {
                toastr.warning(apiMessage(res, 'Save failed.'));
            }
        }).catch(function (err) {
            toastr.error(formatAjaxError(err, 'Save failed.'));
        }).finally(function () {
            G_SaveInProgress = false;
            if (G_Mode !== 'view') $('#btnSaveDisposal').prop('disabled', false);
        });
    });
}

$(document).ready(function () {
    $('#AssetDisposalMasterPage').find('input, select, textarea').attr('autocomplete', 'off');
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    if (!$('#ERPHeading').text().trim()) $('#ERPHeading').text(ADM_MODULE_NAME);

    loadBranchPermissions().then(function () {
        applyActionRightsToUI();
        loadList();
    });

    $('#btnNewDisposal').on('click', openNew);
    $('#btnDisposalBack').on('click', showList);
    $('#btnSaveDisposal').on('click', saveRecord);
    $('#btnADMConfirmDelete').on('click', confirmDelete);
    $('#ddlDisposeAsset').on('change', function () {
        $(this).removeClass('adm-input-error');
    });
    $('#txtDisposeOffDate, #txtDisposeRemark').on('input change', function () {
        $(this).removeClass('adm-input-error');
    });
    $('#txtValueOfDispose').on('input', function () {
        keepDisposeValueFloat(this);
        $(this).removeClass('adm-input-error');
    });
    $('#txtValueOfDispose').on('blur', function () {
        const n = parseAmount(this.value);
        if (n != null) this.value = formatAmount(n);
    });
    $('#admSearch').on('input', function () {
        bindGrid(applySearch(G_Rows));
    });
});
