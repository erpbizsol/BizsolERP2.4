import { StoreRequisitionSlipService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/StoreRequisitionSlipServices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

var baseUrl = sessionStorage.getItem('AppBaseURL');

// ── PANEL NAVIGATION ──────────────────────────────────────────────────────────
function ShowSRList() {
    document.getElementById('divSRList').style.display = '';
    document.getElementById('divSRForm').style.display = 'none';
}
window.ShowSRList = ShowSRList;

function ShowSRForm() {
    ResetSRForm();
    document.getElementById('lblSRFormTitle').textContent = 'New Store Requisition Slip';
    document.getElementById('divSRList').style.display = 'none';
    document.getElementById('divSRForm').style.display = '';
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('txtSRDate').value = today;
    AddSRItemRow();
    LoadProjectDropdown();
}
window.ShowSRForm = ShowSRForm;

// ── LOAD LIST ─────────────────────────────────────────────────────────────────
function LoadSRList() {
    const status   = document.getElementById('ddlSRStatus').value;
    const fromDate = document.getElementById('txtSRFromDate').value;
    const toDate   = document.getElementById('txtSRToDate').value;

    StoreRequisitionSlipService.GetStoreRequisitionList(status, fromDate, toDate).then(function (res) {
        const body = document.getElementById('tblSRListBody');
        body.innerHTML = '';
        const data = res?.Data ?? res ?? [];
        if (!data || data.length === 0) {
            body.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No records found.</td></tr>';
            return;
        }
        let html = '';
        data.forEach(function (row, idx) {
            const badge = GetStatusBadge(row.Status);
            html += `<tr>
                <td>${idx + 1}</td>
                <td>${row.SRNumber ?? ''}</td>
                <td>${BizSolHelperFunction.FormatDate(row.SRDate) ?? ''}</td>
                <td>${row.RequestedBy ?? ''}</td>
                <td>${row.Department ?? ''}</td>
                <td>${row.ProjectName ?? ''}</td>
                <td>${row.Remarks ?? ''}</td>
                <td><span class="badge ${badge.cls}">${badge.label}</span></td>
                <td>
                    <button class="action-btn text-primary" title="Edit" onclick="EditSRSlip(${row.StoreRequisitionMaster_Code})">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button class="action-btn text-danger" title="Delete" onclick="DeleteSRSlip(${row.StoreRequisitionMaster_Code})">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                </td>
            </tr>`;
        });
        body.innerHTML = html;
    }).catch(function (err) {
        console.error('LoadSRList error:', err);
    });
}
window.LoadSRList = LoadSRList;

function ClearSRFilter() {
    document.getElementById('ddlSRStatus').value   = '';
    document.getElementById('txtSRFromDate').value = '';
    document.getElementById('txtSRToDate').value   = '';
    LoadSRList();
}
window.ClearSRFilter = ClearSRFilter;

function GetStatusBadge(status) {
    switch ((status ?? '').toUpperCase()) {
        case 'APPROVED':   return { cls: 'badge-approved',   label: 'Approved' };
        case 'CANCELLED':  return { cls: 'badge-cancelled',  label: 'Cancelled' };
        default:           return { cls: 'badge-pending',    label: 'Pending' };
    }
}

// ── DROPDOWNS ─────────────────────────────────────────────────────────────────
function LoadProjectDropdown() {
    StoreRequisitionSlipService.GetProjectList().then(function (res) {
        const ddl  = document.getElementById('ddlSRProject');
        const data = res?.Data ?? res ?? [];
        ddl.innerHTML = '<option value="">-- Select Project --</option>';
        data.forEach(function (p) {
            ddl.innerHTML += `<option value="${p.Code}">${p.Name}</option>`;
        });
    });
}

document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'ddlSRProject') {
        LoadSubProjectDropdown(e.target.value);
    }
});

function LoadSubProjectDropdown(projectCode) {
    const ddl = document.getElementById('ddlSRSubProject');
    ddl.innerHTML = '<option value="">-- Select Sub-Project --</option>';
    if (!projectCode) return;
    StoreRequisitionSlipService.GetSubProjectList(projectCode).then(function (res) {
        const data = res?.Data ?? res ?? [];
        data.forEach(function (p) {
            ddl.innerHTML += `<option value="${p.Code}">${p.Name}</option>`;
        });
    });
}

// ── ITEM ROWS ─────────────────────────────────────────────────────────────────
var srItemRowIndex = 0;

function AddSRItemRow(item) {
    srItemRowIndex++;
    const idx = srItemRowIndex;
    const row = document.createElement('tr');
    row.id = `srRow_${idx}`;
    row.innerHTML = `
        <td>${idx}</td>
        <td><input type="text" id="srItemName_${idx}" class="form-control form-control-sm" value="${item?.ItemName ?? ''}" placeholder="Item name" /></td>
        <td><input type="text" id="srUOM_${idx}"      class="form-control form-control-sm" value="${item?.UOM ?? ''}"      placeholder="UOM" style="width:80px" /></td>
        <td><input type="number" id="srQty_${idx}"    class="form-control form-control-sm" value="${item?.RequiredQty ?? ''}" placeholder="0" min="0" step="any" /></td>
        <td><input type="text" id="srSpec_${idx}"     class="form-control form-control-sm" value="${item?.Specification ?? ''}" placeholder="Specification / remarks" /></td>
        <td>
            <button class="action-btn text-danger" title="Remove" onclick="RemoveSRItemRow(${idx})">
                <i class="bi bi-x-circle-fill"></i>
            </button>
        </td>`;
    document.getElementById('tblSRItemsBody').appendChild(row);
}
window.AddSRItemRow = AddSRItemRow;

function RemoveSRItemRow(idx) {
    const row = document.getElementById(`srRow_${idx}`);
    if (row) row.remove();
}
window.RemoveSRItemRow = RemoveSRItemRow;

function CollectItemRows() {
    const items = [];
    const rows  = document.querySelectorAll('#tblSRItemsBody tr');
    rows.forEach(function (row) {
        const id  = row.id.replace('srRow_', '');
        const name = (document.getElementById(`srItemName_${id}`)?.value ?? '').trim();
        if (!name) return;
        items.push({
            ItemName:     name,
            UOM:          (document.getElementById(`srUOM_${id}`)?.value ?? '').trim(),
            RequiredQty:  parseFloat(document.getElementById(`srQty_${id}`)?.value) || 0,
            Specification:(document.getElementById(`srSpec_${id}`)?.value ?? '').trim()
        });
    });
    return items;
}

// ── SAVE ──────────────────────────────────────────────────────────────────────
function SaveSRSlip() {
    const date    = document.getElementById('txtSRDate').value;
    const reqBy   = document.getElementById('txtRequestedBy').value.trim();
    if (!date)  { alert('Please select a Date.');          return; }
    if (!reqBy) { alert('Please enter Requested By name.'); return; }

    const items = CollectItemRows();
    if (items.length === 0) { alert('Please add at least one item.'); return; }

    const payload = {
        StoreRequisitionMaster_Code: parseInt(document.getElementById('hdnSRCode').value) || 0,
        SRDate:          date,
        RequestedBy:     reqBy,
        Department:      document.getElementById('txtDepartment').value.trim(),
        ProjectMaster_Code:    parseInt(document.getElementById('ddlSRProject').value) || 0,
        SubProjectMaster_Code: parseInt(document.getElementById('ddlSRSubProject').value) || 0,
        RequiredByDate:  document.getElementById('txtRequiredByDate').value || null,
        Remarks:         document.getElementById('txtSRRemarks').value.trim(),
        StoreRequisitionDetails: items
    };

    StoreRequisitionSlipService.SaveStoreRequisition(payload).then(function (res) {
        if (res?.Status === 1 || res?.status === 1 || res?.IsSuccess) {
            alert('Store Requisition saved successfully.');
            ShowSRList();
            LoadSRList();
        } else {
            alert(res?.Message ?? res?.message ?? 'Save failed. Please try again.');
        }
    }).catch(function (err) {
        console.error('SaveSRSlip error:', err);
        alert('An error occurred while saving.');
    });
}
window.SaveSRSlip = SaveSRSlip;

// ── EDIT ──────────────────────────────────────────────────────────────────────
function EditSRSlip(code) {
    StoreRequisitionSlipService.GetStoreRequisitionById(code).then(function (res) {
        const data = res?.Data ?? res;
        if (!data) { alert('Record not found.'); return; }

        document.getElementById('hdnSRCode').value            = data.StoreRequisitionMaster_Code ?? code;
        document.getElementById('txtSRNumber').value          = data.SRNumber ?? '';
        document.getElementById('txtSRDate').value            = (data.SRDate ?? '').substring(0, 10);
        document.getElementById('txtRequestedBy').value       = data.RequestedBy ?? '';
        document.getElementById('txtDepartment').value        = data.Department ?? '';
        document.getElementById('txtRequiredByDate').value    = (data.RequiredByDate ?? '').substring(0, 10);
        document.getElementById('txtSRRemarks').value         = data.Remarks ?? '';

        LoadProjectDropdown().then && LoadProjectDropdown();
        document.getElementById('ddlSRProject').value    = data.ProjectMaster_Code ?? '';
        LoadSubProjectDropdown(data.ProjectMaster_Code);
        setTimeout(function () {
            document.getElementById('ddlSRSubProject').value = data.SubProjectMaster_Code ?? '';
        }, 400);

        // populate items
        document.getElementById('tblSRItemsBody').innerHTML = '';
        srItemRowIndex = 0;
        const details = data.StoreRequisitionDetails ?? [];
        details.forEach(function (d) { AddSRItemRow(d); });
        if (details.length === 0) AddSRItemRow();

        document.getElementById('lblSRFormTitle').textContent = 'Edit Store Requisition Slip';
        document.getElementById('divSRList').style.display = 'none';
        document.getElementById('divSRForm').style.display = '';
    }).catch(function (err) {
        console.error('EditSRSlip error:', err);
    });
}
window.EditSRSlip = EditSRSlip;

// ── DELETE ────────────────────────────────────────────────────────────────────
function DeleteSRSlip(code) {
    if (!confirm('Are you sure you want to delete this Store Requisition?')) return;
    StoreRequisitionSlipService.DeleteStoreRequisition(code).then(function (res) {
        if (res?.Status === 1 || res?.status === 1 || res?.IsSuccess) {
            alert('Deleted successfully.');
            LoadSRList();
        } else {
            alert(res?.Message ?? 'Delete failed.');
        }
    }).catch(function (err) {
        console.error('DeleteSRSlip error:', err);
    });
}
window.DeleteSRSlip = DeleteSRSlip;

// ── RESET ─────────────────────────────────────────────────────────────────────
function ResetSRForm() {
    document.getElementById('hdnSRCode').value         = '0';
    document.getElementById('txtSRNumber').value       = '';
    document.getElementById('txtSRDate').value         = '';
    document.getElementById('txtRequestedBy').value    = '';
    document.getElementById('txtDepartment').value     = '';
    document.getElementById('ddlSRProject').value      = '';
    document.getElementById('ddlSRSubProject').value   = '';
    document.getElementById('txtRequiredByDate').value = '';
    document.getElementById('txtSRRemarks').value      = '';
    document.getElementById('tblSRItemsBody').innerHTML = '';
    srItemRowIndex = 0;
}
window.ResetSRForm = ResetSRForm;

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    LoadSRList();
});
