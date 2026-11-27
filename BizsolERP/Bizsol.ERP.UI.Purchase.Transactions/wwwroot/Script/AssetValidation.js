import { AssetValidationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/AssetValidationService.js';

var G_AVList = [];
var G_AVItems = [];
var G_AVMode = 'New';
var G_AVConditions = [];
var G_AVScanBusy = false;

$(document).ready(function () {
    $('#ERPHeading').text('Asset Validation');
    _setDefaultListDates();
    _loadConditionList();
    LoadAssetValidationList();

    $('#frmAVScanQR').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            var text = ($(this).val() || '').trim();
            $(this).val('');
            if (text) _scanAsset(text);
        }
    });

    $('#txtAVDeleteReason').on('keydown', function (e) {
        if (e.key === 'Enter') ConfirmAssetValidationDelete();
    });
});

function _isoDate(d) {
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
}

function _dateOnly(v) {
    return String(v || '').substring(0, 10);
}

function _setDefaultListDates() {
    var today = new Date();
    $('#txtAVFromDate').val(_isoDate(new Date(today.getFullYear(), today.getMonth(), 1)));
    $('#txtAVToDate').val(_isoDate(today));
}

function _toList(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.Table)) return res.Table;
    if (Array.isArray(res.Data)) return res.Data;
    return [];
}

function _esc(v) {
    return String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _loadConditionList() {
    return AssetValidationService.GetConditionList()
        .then(function (res) {
            G_AVConditions = _toList(res)
                .map(function (r) { return String(r.Desp ?? r.Code ?? '').trim(); })
                .filter(function (v) { return v !== ''; });
            if (G_AVItems.length) _renderItems();
        })
        .catch(function () { G_AVConditions = []; });
}

function _showLoader() { if (typeof Showloader === 'function') Showloader(); }
function _hideLoader() { if (typeof HideLoader === 'function') HideLoader(); }

/* ───────────────────────── LIST ───────────────────────── */

function LoadAssetValidationList() {
    var fromDate = $('#txtAVFromDate').val();
    var toDate = $('#txtAVToDate').val();
    if (!fromDate || !toDate) {
        toastr.warning('Please select From Date and To Date.');
        return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
        toastr.warning('From Date cannot be greater than To Date.');
        return;
    }

    _showLoader();
    AssetValidationService.GetAssetValidationList(fromDate, toDate)
        .then(function (res) {
            _hideLoader();
            G_AVList = _toList(res);
            _updateStats(G_AVList);
            _renderList(G_AVList);
        })
        .catch(function () {
            _hideLoader();
            toastr.error('Error loading Asset Validation list.');
        });
}

function _updateStats(list) {
    var sum = function (key) {
        return list.reduce(function (t, r) { return t + (parseInt(r[key], 10) || 0); }, 0);
    };
    var fmt = function (n) { return n > 0 ? String(n) : '—'; };
    $('#statAVTotal').text(fmt(list.length));
    $('#statAVAssets').text(fmt(sum('Total Assets')));
}

function _renderList(list) {
    $('#divAssetValidationGrid').show();
    if (!list.length) {
        $('#tblAssetValidationHeader').html('');
        $('#tblAssetValidationBody').html(
            '<tr><td colspan="10" class="text-center text-muted py-4">' +
            '<i class="fa fa-inbox fa-2x d-block mb-2 text-muted"></i>' +
            'No records found for the selected period.</td></tr>');
        $('#paginator-AssetValidationTable').html('');
        return;
    }

    var rows = list.map(function (item) {
        var code = parseInt(item.Code, 10) || 0;
        var isClosed = item.IsClosed === 'Y';
        return Object.assign({}, item, {
            Action:
                (isClosed ? '' : `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="OpenAssetValidationForm('Edit', ${code})"><i class="fa-solid fa-pencil"></i></button>`) +
                `<button class="btn btn-info icon-height mb-1" title="View" onclick="OpenAssetValidationReport(${code})"><i class="fa-regular fa-eye"></i></button>` +
                `<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteAssetValidation(${code})"><i class="fa-regular fa-circle-xmark"></i></button>`
        });
    });

    var columnAlignment = {
        'S.No': 'center',
        'Entry No': 'right',
        'Entry Date': 'center',
        'Start Date': 'center',
        'End Date': 'center',
        'Total Assets': 'right',
        'Status': 'center'
    };

    BizsolCustomFilterGrid.CreateDataTable(
        'tblAssetValidationHeader', 'tblAssetValidationBody', rows,
        false, [],
        ['Entry No', 'Status'], ['Total Assets'], ['Entry Date', 'Start Date', 'End Date'], [],
        ['Code', 'IsClosed'], columnAlignment);
}

/* ───────────────────────── FORM ───────────────────────── */

function _currentCode() {
    return parseInt($('#frmAVCode').val(), 10) || 0;
}

/** New: all dates editable. Edit: Entry/Start Date stay as first saved, End Date editable. View: read only. */
function _setFormMode(mode) {
    G_AVMode = mode;
    var readOnly = mode === 'View';
    var headerSaved = _currentCode() > 0;
    $('#frmAVEntryDate, #frmAVStartDate').prop('disabled', readOnly || headerSaved);
    $('#frmAVEndDate').prop('disabled', readOnly);
    $('.av-edit-only').toggle(!readOnly);

    var badge = { New: ['NEW', 'bg-success'], Edit: ['EDIT', 'bg-warning'], View: ['VIEW', 'bg-info'] }[mode];
    $('#floatAVModeBadge').text(badge[0]).removeClass('bg-success bg-warning bg-info').addClass(badge[1]);
}

function _resetForm() {
    var today = _isoDate(new Date());
    $('#frmAVCode').val('0');
    $('#frmAVEntryNo').val('');
    $('#frmAVEntryDate').val(today);
    $('#frmAVStartDate').val(today);
    $('#frmAVEndDate').val('');
    $('#frmAVScanQR').val('');
    $('#floatAVEntryNo').text('New Entry');
    G_AVItems = [];
    _renderItems();
}

function _showForm() {
    $('#divAssetValidationList').hide();
    $('#divAssetValidationForm').show();
    $('#avFloatBar').css('display', 'flex');
}

function _mapItem(t) {
    return {
        Code: parseInt(t.Code, 10) || 0,
        AssetsMaster_Code: t.AssetsMaster_Code,
        AssetTagNo: t.AssetTagNo || '',
        AssetName: t.AssetName || '',
        AssetType: t.AssetType || '',
        AssetLocation: t.AssetLocation || '',
        PhysicalStatus: t.PhysicalStatus === 'Y' ? 'Y' : 'N',
        FoundAt: t.FoundAt || '',
        Condition: t.Condition || ''
    };
}

function OpenAssetValidationForm(mode, code) {
    _resetForm();

    if (mode === 'New') {
        _setFormMode('New');
        _showForm();
        AssetValidationService.GetNextEntryNo().then(function (res) {
            var row = _toList(res)[0] || {};
            if (row.EntryNo) $('#frmAVEntryNo').val(row.EntryNo);
        }).catch(function () { });
        setTimeout(function () { $('#frmAVScanQR').trigger('focus'); }, 200);
        return;
    }

    _showLoader();
    AssetValidationService.GetAssetValidationByCode(code)
        .then(function (res) {
            _hideLoader();
            var master = (res && res.Master && res.Master[0]) || null;
            if (!master) {
                toastr.error('Data Not Found');
                return;
            }
            $('#frmAVCode').val(master.Code);
            $('#frmAVEntryNo').val(master.EntryNo);
            $('#frmAVEntryDate').val(_dateOnly(master.EntryDate));
            $('#frmAVStartDate').val(_dateOnly(master.StartDate));
            $('#frmAVEndDate').val(_dateOnly(master.EndDate));
            $('#floatAVEntryNo').text('Entry No ' + master.EntryNo);

            if (mode === 'Edit' && master.IsClosed === 'Y') {
                toastr.info('This entry is closed (End Date saved). It can only be viewed.');
                mode = 'View';
            }
            _setFormMode(mode);

            G_AVItems = (res.Transactions || []).map(_mapItem);
            _renderItems();
            _showForm();
        })
        .catch(function () {
            _hideLoader();
            toastr.error('Error loading Asset Validation entry.');
        });
}

/* ───────────────────────── REPORT MODAL ───────────────────────── */

var G_AVReport = [];

function _reportDisplayRows(list) {
    return list.map(function (r) {
        var status = String(r.PhysicalStatus || '').toUpperCase();
        return {
            'Entry No': r.EntryNo,
            'Entry Date': r.EntryDate || '',
            'Start Date': r.StartDate || '',
            'End Date': r.EndDate || '',
            'Asset Tag No': r.AssetTagNo || '',
            'Asset Name': r.AssetName || '',
            'Asset Type': r.AssetType || '',
            'Location': r.AssetLocation || '',
            'Physical Status': status === 'Y' ? 'Yes' : (status === 'N' ? 'No' : (r.PhysicalStatus || '')),
            'Found At': r.FoundAt || '',
            'Condition': r.Condition || ''
        };
    });
}

function OpenAssetValidationReport(code) {
    _showLoader();
    AssetValidationService.GetAssetValidationReport(code)
        .then(function (res) {
            _hideLoader();
            var list = _toList(res);
            if (!list.length) {
                toastr.error((res && res.Msg) || 'No Data Found');
                return;
            }

            G_AVReport = _reportDisplayRows(list);
            BizsolCustomFilterGrid.CreateDataTable(
                'tblAVReportHeader', 'tblAVReportBody', G_AVReport,
                false, [],
                ['Asset Tag No', 'Asset Name', 'Asset Type', 'Location', 'Physical Status', 'Condition', 'Found At'],
                ['Entry No'],
                ['Entry Date', 'Start Date', 'End Date'],
                [], [], {});
            _fillAssetValidationExport(G_AVReport);
            $('#dvAVReportModal').modal({ backdrop: 'static' });
            $('#dvAVReportModal').modal('show');
        })
        .catch(function () {
            _hideLoader();
            toastr.error('Error loading Asset Validation report.');
        });
}

function CloseAssetValidationReport() {
    $('#dvAVReportModal').modal('hide');
}

function _fillAssetValidationExport(data) {
    var $head = $('#tblAVReportExport thead tr');
    var $body = $('#tblAVReportExport tbody');
    $head.empty();
    $body.empty();
    if (!data.length) return;

    var headers = Object.keys(data[0]);
    headers.forEach(function (header) {
        $head.append($('<th>').text(header));
    });
    data.forEach(function (item) {
        var $tr = $('<tr>');
        headers.forEach(function (header) {
            $tr.append($('<td>').text(item[header] == null ? '' : item[header]));
        });
        $body.append($tr);
    });
}

function ExportAssetValidationReport() {
    var table = document.getElementById('tblAVReportExport');
    if (!table || !table.rows.length) {
        toastr.error('No data to export.');
        return;
    }

    var now = new Date();
    var stamp = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') + '-' +
        String(now.getMinutes()).padStart(2, '0') + '-' +
        String(now.getSeconds()).padStart(2, '0');

    var parts = ['<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table>'];
    Array.prototype.forEach.call(table.rows, function (tr) {
        parts.push('<tr>');
        for (var c = 0; c < tr.cells.length; c++) {
            parts.push('<td>' + _esc(tr.cells[c].textContent) + '</td>');
        }
        parts.push('</tr>');
    });
    parts.push('</table></body></html>');

    var blob = new Blob([parts.join('')], { type: 'application/vnd.ms-excel;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'AssetValidationReport_' + stamp + '.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function CloseAssetValidationForm() {
    $('#divAssetValidationForm').hide();
    $('#avFloatBar').hide();
    $('#divAssetValidationList').show();
    LoadAssetValidationList();
}

/* ───────────────────────── SCANNING (saved immediately) ───────────────────────── */

function _scanAsset(qrText) {
    var tag = String(qrText || '').trim();
    if (!tag || G_AVMode === 'View') return;

    if (G_AVItems.some(function (x) { return String(x.AssetTagNo).toUpperCase() === tag.toUpperCase(); })) {
        toastr.warning('Asset ' + tag + ' is already scanned.');
        return;
    }

    var code = _currentCode();
    var entryDate = $('#frmAVEntryDate').val();
    var startDate = $('#frmAVStartDate').val();
    if (code <= 0) {
        if (!entryDate) { toastr.warning('Please select Entry Date.'); $('#frmAVEntryDate').focus(); return; }
        if (!startDate) { toastr.warning('Please select Start Date.'); $('#frmAVStartDate').focus(); return; }
    }
    if (G_AVScanBusy) return;
    G_AVScanBusy = true;

    var payload = {
        Code: code,
        Master: [{ Code: code, EntryDate: entryDate, StartDate: startDate }],
        Transactions: [{ Condition: G_AVConditions[0] || '' }]
    };

    AssetValidationService.ScanAsset(tag, payload)
        .then(function (res) {
            G_AVScanBusy = false;
            if (!res || res.Status !== 'Y') {
                toastr.error((res && res.Msg) || 'Scan failed.');
                return;
            }
            var row = _toList(res.Data)[0];
            if (code <= 0 && res.Code > 0) {
                $('#frmAVCode').val(res.Code);
                if (row && row.EntryNo) {
                    $('#frmAVEntryNo').val(row.EntryNo);
                    $('#floatAVEntryNo').text('Entry No ' + row.EntryNo);
                }
                _setFormMode('Edit');
            }
            if (row) G_AVItems.unshift(_mapItem(row));
            _renderItems();
            toastr.success(res.Msg || ('Asset ' + tag + ' added.'));
        })
        .catch(function () { G_AVScanBusy = false; });
}

function _cameraBaseUrl() {
    return (sessionStorage.getItem('AppBaseURL') || window.location.origin).replace(/\/+$/, '');
}

function AssetValidation_btnScanQR() {
    $('#hfAVCameraScanText').val('');
    $('#DivScanQRCodeByCameraControlModal').load(_cameraBaseUrl() + '/CustomControl/ScanQRCodeByCameraControl', {
        OutputQRTextElementID: 'hfAVCameraScanText',
        CallBackFunctionName: 'AssetValidation_CallbackScanQRCode'
    });
}

function AssetValidation_CallbackScanQRCode() {
    var text = ($('#hfAVCameraScanText').val() || '').trim();
    $('#hfAVCameraScanText').val('');
    if (text) _scanAsset(text);
}

/* ───────────────────────── SCANNED ASSET GRID ───────────────────────── */

function _renderItems() {
    var readOnly = G_AVMode === 'View';
    var $body = $('#tblAVItemsBody');
    $('#frmAVCount').text(G_AVItems.length + (G_AVItems.length === 1 ? ' Asset' : ' Assets'));

    if (!G_AVItems.length) {
        $body.html('<tr><td colspan="8" class="av-items-empty"><i class="fa fa-qrcode fa-2x d-block mb-2"></i>' +
            'No assets scanned yet. Scan an asset QR code to add it here.</td></tr>');
        return;
    }

    var dis = readOnly ? ' disabled' : '';
    var html = G_AVItems.map(function (item, i) {
        var conditionOptions = ['<option value="">-- Select --</option>'].concat(
            G_AVConditions.concat(item.Condition && G_AVConditions.indexOf(item.Condition) < 0 ? [item.Condition] : [])
                .map(function (c) {
                    return '<option value="' + _esc(c) + '"' + (c === item.Condition ? ' selected' : '') + '>' + _esc(c) + '</option>';
                })).join('');

        return '<tr class="' + (item.PhysicalStatus === 'Y' ? '' : 'av-row-notfound') + '">' +
            '<td class="text-center">' + (i + 1) + '</td>' +
            '<td title="' + _esc(item.AssetTagNo) + '">' + _esc(item.AssetName) + '</td>' +
            '<td>' + _esc(item.AssetType) + '</td>' +
            '<td>' + _esc(item.AssetLocation) + '</td>' +
            '<td><select class="form-control form-control-sm" onchange="UpdateAVItem(' + i + ', \'PhysicalStatus\', this.value)"' + dis + '>' +
                '<option value="Y"' + (item.PhysicalStatus === 'Y' ? ' selected' : '') + '>Yes</option>' +
                '<option value="N"' + (item.PhysicalStatus !== 'Y' ? ' selected' : '') + '>No</option>' +
            '</select></td>' +
            '<td><input type="text" class="form-control form-control-sm" maxlength="300" value="' + _esc(item.FoundAt) + '"' +
                ' onblur="UpdateAVItem(' + i + ', \'FoundAt\', this.value)"' + dis + ' /></td>' +
            '<td><select class="form-control form-control-sm" onchange="UpdateAVItem(' + i + ', \'Condition\', this.value)"' + dis + '>' +
                conditionOptions + '</select></td>' +
            (readOnly ? '' : '<td class="text-center"><button type="button" class="av-del-row-btn" title="Remove" onclick="RemoveAVItem(' + i + ')">' +
                '<i class="fa fa-trash"></i></button></td>') +
            '</tr>';
    }).join('');
    $body.html(html);
}

/** Saves the changed row immediately (dropdown change / Found At focus out). */
function UpdateAVItem(index, field, value) {
    var item = G_AVItems[index];
    if (!item || G_AVMode === 'View') return;

    var newValue = field === 'FoundAt' ? String(value || '').trim() : value;
    var oldValue = item[field];
    if (newValue === oldValue) return;

    item[field] = newValue;
    if (field === 'PhysicalStatus') _renderItems();

    AssetValidationService.UpdateTransaction({
        Code: item.Code,
        AssetStockAuditMaster_Code: _currentCode(),
        AssetsMaster_Code: item.AssetsMaster_Code,
        PhysicalStatus: item.PhysicalStatus,
        FoundAt: item.FoundAt,
        Condition: item.Condition
    }).then(function (res) {
        if (!res || res.Status !== 'Y') {
            item[field] = oldValue;
            _renderItems();
            toastr.error((res && res.Msg) || 'Save failed.');
        }
    }).catch(function () {
        item[field] = oldValue;
        _renderItems();
    });
}

function RemoveAVItem(index) {
    var item = G_AVItems[index];
    if (!item || G_AVMode === 'View') return;

    AssetValidationService.DeleteTransaction(item.Code)
        .then(function (res) {
            if (res && res.Status === 'Y') {
                G_AVItems.splice(G_AVItems.indexOf(item), 1);
                _renderItems();
                toastr.success(res.Msg || 'Asset removed.');
            } else {
                toastr.error((res && res.Msg) || 'Remove failed.');
            }
        })
        .catch(function () { });
}

/* ───────────────────────── SAVE (End Date) ───────────────────────── */

function SaveAssetValidation() {
    if (G_AVMode === 'View') return;

    var code = _currentCode();
    var startDate = $('#frmAVStartDate').val();
    var endDate = $('#frmAVEndDate').val();

    if (code <= 0 || !G_AVItems.length) {
        toastr.warning('Please scan at least one asset.');
        $('#frmAVScanQR').focus();
        return;
    }
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
        toastr.warning('End Date cannot be less than Start Date.');
        $('#frmAVEndDate').focus();
        return;
    }
    if (endDate) {
        $('#saveAVEntryNo').text($('#frmAVEntryNo').val() || '');
        $('#btnAVConfirmSave').prop('disabled', false);
        $('#dvAVSaveConfirmModal').modal('show');
        return;
    }

    _saveAssetValidation();
}

function ConfirmAssetValidationSave() {
    $('#btnAVConfirmSave').prop('disabled', true);
    $('#dvAVSaveConfirmModal').modal('hide');
    _saveAssetValidation();
}

function _saveAssetValidation() {
    var code = _currentCode();
    var endDate = $('#frmAVEndDate').val();
    var payload = {
        Code: code,
        Master: [{ Code: code, EndDate: endDate || '' }]
    };

    _showLoader();
    AssetValidationService.SaveAssetValidation(payload)
        .then(function (res) {
            _hideLoader();
            if (res && res.Status === 'Y') {
                toastr.success(res.Msg || 'Saved successfully.');
                CloseAssetValidationForm();
            } else {
                toastr.error((res && res.Msg) || 'Save failed.');
            }
        })
        .catch(function () { _hideLoader(); });
}

/* ───────────────────────── DELETE ───────────────────────── */

function DeleteAssetValidation(code) {
    var row = G_AVList.find(function (r) { return parseInt(r.Code, 10) === code; }) || {};
    $('#hfAVDeleteCode').val(code);
    $('#delAVEntryNo').text(row['Entry No'] || '');
    $('#txtAVDeleteReason').val('');
    $('#btnAVConfirmDelete').prop('disabled', false);
    $('#dvAVDeleteModal').modal('show');
    setTimeout(function () { $('#txtAVDeleteReason').trigger('focus'); }, 300);
}

function ConfirmAssetValidationDelete() {
    var code = parseInt($('#hfAVDeleteCode').val(), 10) || 0;
    var reason = ($('#txtAVDeleteReason').val() || '').trim();
    if (!reason) {
        toastr.warning('Please provide a reason for deletion.');
        $('#txtAVDeleteReason').focus();
        return;
    }

    $('#btnAVConfirmDelete').prop('disabled', true);
    AssetValidationService.DeleteAssetValidation(code, reason)
        .then(function (res) {
            $('#btnAVConfirmDelete').prop('disabled', false);
            if (res && res.Status === 'Y') {
                $('#dvAVDeleteModal').modal('hide');
                toastr.success(res.Msg || 'Deleted successfully.');
                LoadAssetValidationList();
            } else {
                toastr.error((res && res.Msg) || 'Delete failed.');
            }
        })
        .catch(function () { $('#btnAVConfirmDelete').prop('disabled', false); });
}

window.LoadAssetValidationList = LoadAssetValidationList;
window.OpenAssetValidationForm = OpenAssetValidationForm;
window.OpenAssetValidationReport = OpenAssetValidationReport;
window.CloseAssetValidationReport = CloseAssetValidationReport;
window.ExportAssetValidationReport = ExportAssetValidationReport;
window.CloseAssetValidationForm = CloseAssetValidationForm;
window.SaveAssetValidation = SaveAssetValidation;
window.ConfirmAssetValidationSave = ConfirmAssetValidationSave;
window.DeleteAssetValidation = DeleteAssetValidation;
window.ConfirmAssetValidationDelete = ConfirmAssetValidationDelete;
window.UpdateAVItem = UpdateAVItem;
window.RemoveAVItem = RemoveAVItem;
window.AssetValidation_btnScanQR = AssetValidation_btnScanQR;
window.AssetValidation_CallbackScanQRCode = AssetValidation_CallbackScanQRCode;
