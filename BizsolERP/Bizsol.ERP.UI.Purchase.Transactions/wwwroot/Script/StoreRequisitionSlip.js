import { StoreRequisitionSlipService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/StoreRequisitionSlipServices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

const SR_FIN_YEAR = BizSolHelperFunction.getFinancialYear();

let srLocateRows = [];

function srRowVal(row, label) {
    if (!row) return '';
    var v = row[label];
    return v === null || v === undefined ? '' : v;
}

function LoadSRList() {
    var fromDate = document.getElementById('txtSRFromDate').value;
    var toDate = document.getElementById('txtSRToDate').value;
    if (typeof Showloader === 'function') Showloader();
    // Locate by date range only — do not filter by current FinYear (slips may belong to other FY).
    StoreRequisitionSlipService.GetStoreRequisitionList(fromDate, toDate, '').then(function (res) {
        var apiRows = Array.isArray(res) ? res : [];
        srLocateRows = apiRows;
        if (apiRows.length > 0) {
            $('#divSRGrid').show();
            var rows = prepareGridRows(apiRows);
            var StringFilterColumn = [];
            var NumericFilterColumn = [];
            var DateFilterColumn = [];
            Object.keys(rows[0]).forEach(function (col) {
                if (col === 'Code' || col === 'Action') return;
                if (/date/i.test(col)) {
                    DateFilterColumn.push(col);
                } else if (col === 'S.No.' || col === 'SRS No.' || col === 'Issue No' || col === 'SNo' || col === 'SRSNo' || col === 'IssueNo') {
                    NumericFilterColumn.push(col);
                } else {
                    StringFilterColumn.push(col);
                }
            });
            var Button = false;
            var showButtons = [];
            var StringdoubleFilterColumn = [];
            var hiddenColumns = ['Code'];
            var ColumnAlignment = { Action: 'center;width:118px;' };
            $('#tblSRListHeader').html('');
            $('#tblSRListBody').html('');
            BizsolCustomFilterGrid.CreateDataTable(
                'tblSRListHeader',
                'tblSRListBody',
                rows,
                Button,
                showButtons,
                StringFilterColumn,
                NumericFilterColumn,
                DateFilterColumn,
                StringdoubleFilterColumn,
                hiddenColumns,
                ColumnAlignment
            );
        } else {
            $('#tblSRListHeader').html('');
            $('#tblSRListBody').html(
                '<tr><td colspan="12" class="text-center text-muted py-4">No records found. Select dates and click Show.</td></tr>'
            );
            $('#divSRGrid').show();
            if (typeof toastr !== 'undefined') {
                toastr.info('No SRS found for the selected dates. Widen the date range if needed.');
            }
        }
    }).catch(function () {
        srLocateRows = [];
        if (typeof toastr !== 'undefined') {
            toastr.error('Failed to load Store Requisition list.');
        }
    }).finally(function () {
        if (typeof HideLoader === 'function') HideLoader();
    });
}
window.LoadSRList = LoadSRList;

function rowCode(row) {
    return parseInt(row && row.Code != null ? row.Code : 0, 10) || 0;
}

function parseApiDate(value) {
    if (!value) return null;
    var s = String(value).trim();
    if (!s) return null;
    if (s.indexOf('/') >= 0) {
        var p = s.split('/');
        if (p.length === 3) {
            var d = parseInt(p[0], 10);
            var m = parseInt(p[1], 10) - 1;
            var y = parseInt(p[2], 10);
            if (y < 100) y += 2000;
            var dt = new Date(y, m, d);
            return isNaN(dt.getTime()) ? null : dt;
        }
    }
    var dt2 = new Date(s);
    return isNaN(dt2.getTime()) ? null : dt2;
}

function formatDateForInput(value) {
    var dt = parseApiDate(value);
    if (!dt) return '';
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}

function formatDateDisplay(value) {
    if (!value) return '';
    var s = String(value).trim();
    if (s.indexOf('/') >= 0) return s;
    var dt = parseApiDate(value);
    if (!dt) return s;
    return String(dt.getDate()).padStart(2, '0') + '/' + String(dt.getMonth() + 1).padStart(2, '0') + '/' + dt.getFullYear();
}

function formatGridCell(key, value) {
    if (value === null || value === undefined) return '';
    if (/date/i.test(key)) return formatDateDisplay(value);
    return value;
}

/** API rows → grid rows (dates + Action). Procedure columns stay as returned. */
function prepareGridRows(apiRows) {
    return apiRows.map(function (row) {
        var code = rowCode(row);
        var gridRow = { Code: code };
        Object.keys(row).forEach(function (k) {
            if (k === 'Code') return;
            gridRow[k] = formatGridCell(k, row[k]);
        });
        gridRow.Action =
            '<button type="button" class="im-btn-view" title="View" onclick="EditSRSlip(' + code + ')">' +
            '<i class="fas fa-eye"></i></button>';
        return gridRow;
    });
}

function initSRSearchDefaults() {
    var startYear = parseInt(String(SR_FIN_YEAR).split('-')[0], 10);
    if (isNaN(startYear)) startYear = new Date().getFullYear();
    document.getElementById('txtSRFromDate').value = (startYear - 2) + '-04-01';
    document.getElementById('txtSRToDate').value = (startYear + 1) + '-03-31';
}

function ShowSRList() {
    document.getElementById('divSRList').style.display = '';
    document.getElementById('divSRForm').style.display = 'none';
}
window.ShowSRList = ShowSRList;

function ShowSRForm() {
    document.getElementById('hdnSRCode').value = '0';
    ['txtSRNumber', 'txtSRDate', 'txtDivisionDesp', 'txtSubDivisionDesp', 'txtDepartment', 'txtSubDepartment',
        'txtGodownName', 'txtIssued', 'txtIssueNo', 'txtIssueDate'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('lblSRFormTitle').textContent = 'New Store Requisition Slip';
    document.getElementById('divSRList').style.display = 'none';
    document.getElementById('divSRForm').style.display = '';
    document.getElementById('txtSRDate').value = new Date().toISOString().split('T')[0];
}
window.ShowSRForm = ShowSRForm;

function bindSRHeader(data, code) {
    if (!data) data = {};
    document.getElementById('hdnSRCode').value = rowCode(data) || code || 0;
    document.getElementById('txtSRNumber').value = srRowVal(data, 'SRS No.') || srRowVal(data, 'SRSNo');
    document.getElementById('txtSRDate').value = formatDateForInput(srRowVal(data, 'SRS Date') || srRowVal(data, 'SRSDate'));
    document.getElementById('txtDivisionDesp').value = srRowVal(data, 'Division Desp') || srRowVal(data, 'DivisionDesp');
    document.getElementById('txtSubDivisionDesp').value = srRowVal(data, 'Sub Division Desp') || srRowVal(data, 'SubDivisionDesp');
    document.getElementById('txtDepartment').value = srRowVal(data, 'Department Name') || srRowVal(data, 'DepartmentName');
    document.getElementById('txtSubDepartment').value = srRowVal(data, 'SubDepartment Name') || srRowVal(data, 'SubDepartmentName');
    document.getElementById('txtGodownName').value = srRowVal(data, 'Godown Name') || srRowVal(data, 'GodownName');
    document.getElementById('txtIssued').value = srRowVal(data, 'Issued');
    document.getElementById('txtIssueNo').value = srRowVal(data, 'Issue No') || srRowVal(data, 'IssueNo');
    document.getElementById('txtIssueDate').value = srRowVal(data, 'Issue Date') || srRowVal(data, 'IssueDate');
}

function EditSRSlip(code) {
    var id = parseInt(code, 10) || 0;
    var data = srLocateRows.find(function (row) { return rowCode(row) === id; });
    if (!data) {
        alert('Record not found. Run Show again to refresh the list.');
        return;
    }
    bindSRHeader(data, id);
    document.getElementById('lblSRFormTitle').textContent = 'Store Requisition Slip';
    document.getElementById('divSRList').style.display = 'none';
    document.getElementById('divSRForm').style.display = '';
}
window.EditSRSlip = EditSRSlip;

document.addEventListener('DOMContentLoaded', function () {
    initSRSearchDefaults();
    LoadSRList();
});
