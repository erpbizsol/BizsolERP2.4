import { EWayBillService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/EWayBillService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

function setEwayBillClosureHeading() {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    if (!$('#ERPHeading').text().trim()) {
        $('#ERPHeading').text('E-Way Bill Closure');
    }
    var heading = ($('#ERPHeading').text() || '').trim() || 'E-Way Bill Closure';
    $('.ewb-header h5').each(function () {
        var $h = $(this);
        var $icon = $h.find('.ewb-title-icon').first().detach();
        $h.empty();
        if ($icon.length) $h.append($icon);
        $h.append(document.createTextNode(' ' + heading));
    });
}

function formatDateInput(date) {
    var yyyy = date.getFullYear();
    var mm = String(date.getMonth() + 1).padStart(2, '0');
    var dd = String(date.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
}

function getDefaultToDate() {
    try {
        var serverDate = BizSolHelperFunction.getCurrentDate();
        if (serverDate) {
            var parsed = new Date(serverDate);
            if (!isNaN(parsed.getTime())) {
                return formatDateInput(parsed);
            }
        }
    } catch (e) { }
    return formatDateInput(new Date());
}

function getDefaultFromDate(toDateStr) {
    var toDate = toDateStr ? new Date(toDateStr) : new Date();
    if (isNaN(toDate.getTime())) {
        toDate = new Date();
    }
    return formatDateInput(new Date(toDate.getFullYear(), toDate.getMonth(), 1));
}

function getFinancialYear() {
    return BizSolHelperFunction.getFinancialYear();
}

var selectedEwayBills = [];
var currentEwayBillGridData = [];
var ewayBillCloseResultMap = {};
var lastClosedGridRows = [];

function pickRowField(item, names) {
    if (!item) return '';
    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        if (item[name] !== undefined && item[name] !== null && item[name] !== '') {
            return item[name];
        }
    }
    var keys = Object.keys(item);
    for (var j = 0; j < names.length; j++) {
        var want = String(names[j]).toLowerCase();
        for (var k = 0; k < keys.length; k++) {
            if (String(keys[k]).toLowerCase() === want) {
                var value = item[keys[k]];
                if (value !== undefined && value !== null && value !== '') {
                    return value;
                }
            }
        }
    }
    return '';
}

function getEwayBillRowObject(item) {
    return {
        Code: parseInt(pickRowField(item, ['Code', 'code']), 10) || 0,
        SourceTable: String(pickRowField(item, ['SourceTable', 'sourceTable']) || '')
    };
}

function getEwayBillNo(item) {
    return String(pickRowField(item, [
        'EwayBillNo', 'EWayBillNo', 'EWBNo', 'EwbNo', 'ewayBillNo', 'ewbNo', 'Eway Bill No', 'E-Way Bill No'
    ]) || '').trim();
}

function isCloseSuccessFlag(value) {
    return value === true || value === 1 ||
        String(value || '').toLowerCase() === 'true' ||
        String(value || '').toUpperCase() === 'Y';
}

function getRowIsSuccess(row) {
    if (!row) return false;
    if (row.IsSuccess !== undefined && row.IsSuccess !== null && row.IsSuccess !== '') {
        return isCloseSuccessFlag(row.IsSuccess);
    }
    if (row.isSuccess !== undefined && row.isSuccess !== null && row.isSuccess !== '') {
        return isCloseSuccessFlag(row.isSuccess);
    }
    return !cleanCloseResultText(row.ErrorMessage || row.errorMessage || '');
}

function cleanCloseResultText(value) {
    return String(value == null ? '' : value)
        .replace(/\\r\\n|\\n|\\r/g, ' ')
        .replace(/\r\n|\n|\r|↵/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function extractCloseResponse(response) {
    var res = Array.isArray(response) ? (response[0] || {}) : (response || {});
    var status = String(res.Status || res.status || '').toUpperCase();
    var msg = cleanCloseResultText(res.Msg || res.msg || res.Message || res.message || '');
    var data = res.Data || res.data || [];
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { data = []; }
    }
    if (!Array.isArray(data)) {
        data = data ? [data] : [];
    }
    return { status: status, msg: msg, data: data, raw: res };
}

function normalizeCloseResultRows(data) {
    return (data || []).map(function (row) {
        var clean = {};
        if (!row || typeof row !== 'object') {
            return {
                Result: escapeHtml(cleanCloseResultText(row)),
                __bizsolRowClass: 'ewb-row-fail'
            };
        }
        Object.keys(row).forEach(function (key) {
            var value = row[key];
            if (value === null || value === undefined) {
                clean[key] = '';
            } else if (typeof value === 'boolean') {
                clean[key] = value ? 'true' : 'false';
            } else if (typeof value === 'object') {
                clean[key] = escapeHtml(JSON.stringify(value));
            } else {
                clean[key] = escapeHtml(cleanCloseResultText(value));
            }
        });
        clean.__bizsolRowClass = getRowIsSuccess(row) ? 'ewb-row-success' : 'ewb-row-fail';
        return clean;
    });
}

function getMainGridHiddenColumns() {
    return ['Code', 'code', 'SourceTable', 'sourceTable', '__bizsolRowClass'];
}

function getMainGridColumnAlignment() {
    return {
        Action: 'center',
        Status: 'center',
        NoOfDays: 'right',
        Pincode: 'center',
        DocDate: 'center',
        ValidFrom: 'center',
        ValidUpto: 'center'
    };
}

function renderEwayBillClosureGrid(data) {
    currentEwayBillGridData = Array.isArray(data) ? data : [];
    if (!currentEwayBillGridData.length) {
        $('#table-header-EwayBillClosure').empty();
        $('#table-body-EwayBillClosure').html(
            "<tr><td colspan='12' class='ewb-empty'><i class='fa fa-inbox'></i>No matching records found</td></tr>"
        );
        return;
    }

    BizsolCustomFilterGrid.CreateDataTable(
        'table-header-EwayBillClosure',
        'table-body-EwayBillClosure',
        currentEwayBillGridData,
        false,
        [],
        [],
        [],
        [],
        [],
        getMainGridHiddenColumns(),
        getMainGridColumnAlignment(),
        false
    );
}

function normalizeEwayBillNoKey(value) {
    return String(value == null ? '' : value).replace(/\s+/g, '').trim();
}

function getMainGridEwayBillNoColumnIndex() {
    var index = -1;
    $('#table-header-EwayBillClosure th').each(function (i) {
        var text = ($(this).find('.filter-table-heading').text() || $(this).text() || '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase()
            .replace(/[\s_\-]/g, '');
        if (text === 'ewaybillno' || text === 'ewbno' || text === 'ewaybill') {
            index = i;
            return false;
        }
    });
    return index;
}

function applyCloseResultToGridData(list) {
    if (!Array.isArray(list)) return;
    list.forEach(function (item, i) {
        var ewayBillNo = normalizeEwayBillNoKey(getEwayBillNo(item));
        if (!ewayBillNo || !Object.prototype.hasOwnProperty.call(ewayBillCloseResultMap, ewayBillNo)) {
            return;
        }
        var success = ewayBillCloseResultMap[ewayBillNo];
        var row = getEwayBillRowObject(item);
        if (success) {
            selectedEwayBills = selectedEwayBills.filter(function (selected) {
                return !(selected.Code == row.Code && selected.SourceTable == row.SourceTable);
            });
            item.Action = '';
        }
        item.__bizsolRowClass = success ? 'ewb-row-success' : 'ewb-row-fail';
        list[i] = item;
    });
}

function getEwayBillNoFromMainRow($tr) {
    var idx = parseInt($tr.attr('data-index'), 10);
    if (!isNaN(idx) && currentEwayBillGridData[idx]) {
        var fromData = normalizeEwayBillNoKey(getEwayBillNo(currentEwayBillGridData[idx]));
        if (fromData) return fromData;
    }
    var ewayColIndex = getMainGridEwayBillNoColumnIndex();
    if (ewayColIndex >= 0) {
        return normalizeEwayBillNoKey($tr.children('td').eq(ewayColIndex).text());
    }
    return '';
}

function captureSelectedMainGridRows() {
    var rows = [];
    $('#EwayBillClosure .ewb-select-chk:checked').each(function () {
        var $chk = $(this);
        var $tr = $chk.closest('tr');
        rows.push({
            $tr: $tr,
            Code: parseInt($chk.attr('data-code'), 10) || 0,
            SourceTable: $chk.attr('data-sourcetable') || '',
            EwayBillNo: getEwayBillNoFromMainRow($tr)
        });
    });
    return rows;
}

function paintMainGridRow($tr, success) {
    if (!$tr || !$tr.length) return;
    var color = success ? '#dcfce7' : '#fee2e2';
    $tr.removeClass('ewb-row-success ewb-row-fail')
        .addClass(success ? 'ewb-row-success' : 'ewb-row-fail');
    $tr.children('td').each(function () {
        this.style.setProperty('background-color', color, 'important');
    });

    if (success) {
        var $chk = $tr.find('.ewb-select-chk');
        if ($chk.length) {
            var code = parseInt($chk.attr('data-code'), 10) || 0;
            var sourceTable = $chk.attr('data-sourcetable') || '';
            selectedEwayBills = selectedEwayBills.filter(function (selected) {
                return !(selected.Code == code && selected.SourceTable == sourceTable);
            });
        }
        $tr.find('.ewb-action-wrap, .ewb-select-chk').remove();
    }
}

function applyCloseResultToMainGrid(dataRows, status) {
    var rows = Array.isArray(dataRows) ? dataRows : [];
    ewayBillCloseResultMap = {};
    rows.forEach(function (row) {
        var ewayBillNo = normalizeEwayBillNoKey(getEwayBillNo(row));
        if (!ewayBillNo) return;
        ewayBillCloseResultMap[ewayBillNo] = getRowIsSuccess(row);
    });

    applyCloseResultToGridData(currentEwayBillGridData);
    applyCloseResultToGridData(window.filteredData_EwayBillClosure);

    var selectedRows = lastClosedGridRows.length ? lastClosedGridRows : captureSelectedMainGridRows();

    selectedRows.forEach(function (selected, i) {
        var success;
        var ewayBillNo = normalizeEwayBillNoKey(selected.EwayBillNo);
        if (ewayBillNo && Object.prototype.hasOwnProperty.call(ewayBillCloseResultMap, ewayBillNo)) {
            success = ewayBillCloseResultMap[ewayBillNo];
        } else if (rows[i]) {
            success = getRowIsSuccess(rows[i]);
        } else {
            success = String(status || '').toUpperCase() === 'Y';
        }
        paintMainGridRow(selected.$tr, success);
    });

    if (!selectedRows.length) {
        $('#table-body-EwayBillClosure tr').each(function () {
            var $tr = $(this);
            var ewayBillNo = getEwayBillNoFromMainRow($tr);
            if (ewayBillNo && Object.prototype.hasOwnProperty.call(ewayBillCloseResultMap, ewayBillNo)) {
                paintMainGridRow($tr, ewayBillCloseResultMap[ewayBillNo]);
            }
        });
    }
}

function ShowEwayBillCloseResultModal(closeResult) {
    var el = document.getElementById('EwayBillCloseResultModal');
    if (!el) {
        toastr.error('Result modal not found.');
        return;
    }

    var status = closeResult.status || '';
    var isOk = status === 'Y';
    $('#ewbCloseResultStatus')
        .text(status || '-')
        .toggleClass('ewb-result-status-y', isOk)
        .toggleClass('ewb-result-status-n', !isOk);
    $('#ewbCloseResultMsg').text(closeResult.msg || (isOk ? 'E-Way Bill closed successfully.' : 'Close failed.'));

    var rows = normalizeCloseResultRows(closeResult.data);
    if (rows.length) {
        $('#ewbCloseResultEmpty').hide();
        $('#tblEwayBillCloseResultWrap').show();
    } else {
        $('#tblEwayBillCloseResultWrap').hide();
        $('#ewbCloseResultEmpty').show();
        $('#table-header-EwayBillCloseResult').empty();
        $('#table-body-EwayBillCloseResult').empty();
    }

    var modal = bootstrap.Modal.getOrCreateInstance(el);
    $(el).off('shown.bs.modal.ewbResult').on('shown.bs.modal.ewbResult', function () {
        if (rows.length) {
            BizsolCustomFilterGrid.CreateDataTable(
                'table-header-EwayBillCloseResult',
                'table-body-EwayBillCloseResult',
                rows,
                false,
                [],
                [],
                [],
                [],
                [],
                ['__bizsolRowClass'],
                { IsSuccess: 'center', GSTIN: 'center', EwayBillNo: 'center' },
                false
            );
        }
        $(el).off('shown.bs.modal.ewbResult');
    });
    modal.show();
}

function CloseEwayBillCloseResultModal() {
    var el = document.getElementById('EwayBillCloseResultModal');
    var modal = el ? bootstrap.Modal.getInstance(el) : null;
    if (modal) modal.hide();
}

function buildCloseRequestPayload(reason) {
    return GetCheckedEwayBillValues().map(function (row) {
        return {
            TableCode : parseInt(row.Code, 10) || 0,
            TableName: row.SourceTable || '',
            Reason: reason || ''
        };
    });
}

function isEwayBillSelected(code, sourceTable) {
    return selectedEwayBills.some(function (row) {
        return row.Code == code && row.SourceTable == (sourceTable || '');
    });
}

function buildActionCheckbox(code, sourceTable, checked) {
    return '<span class="ewb-action-wrap">' +
        '<input type="checkbox" class="ewb-select-chk" title="Select"' +
        ' data-code="' + (code || 0) + '"' +
        ' data-sourcetable="' + String(sourceTable || '').replace(/"/g, '&quot;') + '"' +
        (checked ? ' checked' : '') +
        ' onchange="OnEwayBillCheck(this)">' +
        '</span>';
}

function OnEwayBillCheck(chk) {
    var obj = {
        Code: parseInt(chk.getAttribute('data-code'), 10) || 0,
        SourceTable: chk.getAttribute('data-sourcetable') || ''
    };

    if (chk.checked) {
        if (!isEwayBillSelected(obj.Code, obj.SourceTable)) {
            selectedEwayBills.push(obj);
        }
    } else {
        selectedEwayBills = selectedEwayBills.filter(function (row) {
            return !(row.Code == obj.Code && row.SourceTable == obj.SourceTable);
        });
    }
}

function GetCheckedEwayBillValues() {
    var checkedMap = {};

    function addRow(code, sourceTable) {
        var obj = {
            Code: parseInt(code, 10) || 0,
            SourceTable: sourceTable || ''
        };
        checkedMap[obj.Code + '|' + obj.SourceTable] = obj;
    }

    selectedEwayBills.forEach(function (row) {
        addRow(row.Code, row.SourceTable);
    });

    $('#EwayBillClosure .ewb-select-chk:checked').each(function () {
        addRow(this.getAttribute('data-code'), this.getAttribute('data-sourcetable'));
    });

    return Object.keys(checkedMap).map(function (key) {
        return checkedMap[key];
    });
}

function LoadEwayBillClosureList() {
    var fromDate = $('#txtFromDate').val();
    var toDate = $('#txtToDate').val();
    if (!fromDate || !toDate) {
        toastr.error('Please select From Date and To Date.');
        return false;
    }
    if (fromDate > toDate) {
        toastr.error('From Date cannot be greater than To Date.');
        return false;
    }

    selectedEwayBills = [];
    ewayBillCloseResultMap = {};
    lastClosedGridRows = [];
    currentEwayBillGridData = [];
    Showloader();
    EWayBillService.GetEwayPendingDataForClosure(fromDate, toDate).then(function (response) {
        HideLoader();
        if (response && response.length > 0) {
            var updatedResponse = response.map(function (item) {
                var row = getEwayBillRowObject(item);
                return Object.assign({}, item, {
                    Action: buildActionCheckbox(
                        row.Code,
                        row.SourceTable,
                        isEwayBillSelected(row.Code, row.SourceTable)
                    )
                });
            });
            renderEwayBillClosureGrid(updatedResponse);
        } else {
            toastr.error('No Data Found');
            renderEwayBillClosureGrid([]);
        }
    }).catch(function () {
        HideLoader();
        toastr.error('Error while loading E-Way Bill list.');
    });
}

function OpenEwayBillClose() {
    selectedEwayBills = GetCheckedEwayBillValues();
    if (!selectedEwayBills.length) {
        toastr.error('Please select at least one E-Way Bill.');
        return;
    }

    var moduleName = ($('#ERPHeading').text() || '').trim();
    MenuService.CheckModuleOptionRight(moduleName, 'Close', 'Y', getFinancialYear()).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        }

        $('#txtEwayBillCloseReason').val('');
        var el = document.getElementById('EwayBillCloseModal');
        if (!el) {
            toastr.error('Close modal not found.');
            return;
        }
        bootstrap.Modal.getOrCreateInstance(el).show();
        setTimeout(function () { $('#txtEwayBillCloseReason').focus(); }, 200);
    });
}

function ConfirmEwayBillClose() {
    selectedEwayBills = GetCheckedEwayBillValues();
    if (!selectedEwayBills.length) {
        toastr.error('Please select at least one E-Way Bill.');
        return;
    }

    var reason = ($('#txtEwayBillCloseReason').val() || '').trim();
    if (!reason) {
        toastr.error('Please enter a reason before closing.');
        $('#txtEwayBillCloseReason').focus();
        return;
    }

    var payload = buildCloseRequestPayload(reason);
    var invalidRow = selectedEwayBills.some(function (row) {
        return !row.Code || !row.SourceTable;
    });
    if (invalidRow) {
        toastr.error('Selected E-Way Bill is missing Code or Source Table.');
        return;
    }

    lastClosedGridRows = captureSelectedMainGridRows();
    var $btn = $('#btnEwayBillCloseConfirm');
    $btn.prop('disabled', true);
    Showloader();
    EWayBillService.CloseEwayBill(payload).then(function (response) {
        HideLoader();
        $btn.prop('disabled', false);
        var closeResult = extractCloseResponse(response);
        CloseEwayBillCloseModal();
        applyCloseResultToMainGrid(closeResult.data, closeResult.status);
        setTimeout(function () {
            ShowEwayBillCloseResultModal(closeResult);
        }, 250);
    }).catch(function () {
        HideLoader();
        $btn.prop('disabled', false);
        toastr.error('An error occurred while closing the E-Way Bill.');
    });
}

function CloseEwayBillCloseModal() {
    var el = document.getElementById('EwayBillCloseModal');
    var modal = el ? bootstrap.Modal.getInstance(el) : null;
    if (modal) modal.hide();
    $('#txtEwayBillCloseReason').val('');
}

$(document).ready(function () {
    setEwayBillClosureHeading();
    var toDate = getDefaultToDate();
    $('#txtToDate').val(toDate);
    $('#txtFromDate').val(getDefaultFromDate(toDate));
    LoadEwayBillClosureList();
});

window.LoadEwayBillClosureList = LoadEwayBillClosureList;
window.OnEwayBillCheck = OnEwayBillCheck;
window.OpenEwayBillClose = OpenEwayBillClose;
window.ConfirmEwayBillClose = ConfirmEwayBillClose;
window.CloseEwayBillCloseModal = CloseEwayBillCloseModal;
window.CloseEwayBillCloseResultModal = CloseEwayBillCloseResultModal;
