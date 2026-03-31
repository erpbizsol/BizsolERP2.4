import { PurchaseOrderStoreService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PurchaseOrderStoreServices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

var baseUrl = sessionStorage.getItem('AppBaseURL');

let G_POStoreList = [];
let G_POStoreItemList = [];
let G_POStoreEditMode = 'New';
let G_ItemMasterList = [];
let G_UOMMasterList = [];
let G_VendorList = [];
let G_PaymentTermsList = [];
let G_ProjectList = [];
let G_SubProjectList = [];
let G_ItemRowCount = 0;
let G_MobileItemEditRowId = null;
let G_BillToShipToList = [];
let G_SiteRepList = [];

BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

// ─── FLOAT BAR MARGIN — tracks sidebar collapsed state ───────────────────────
function SyncFloatBarMargin() {
    const bar = document.getElementById('poFloatBar');
    if (!bar) return;
    if (window.innerWidth <= 768) {
        bar.style.marginLeft = '0';
        return;
    }
    const sidebar = document.getElementById('modern-sidebar');
    bar.style.marginLeft = (sidebar && sidebar.classList.contains('collapsed')) ? '70px' : '280px';
}

// ─── PO STAT COUNTS (Pending on Me / Approved) ──────────────────────────────

function LoadPOStatCounts() {
    // Pending On Me = POs awaiting the current user's approval
    PurchaseOrderStoreService.GetPendingPOStoreList().then(function (data) {
        const count = Array.isArray(data) ? data.length : 0;
        $('#statPendingOnMePO').text(count > 0 ? count : '—');
    }).catch(() => { $('#statPendingOnMePO').text('—'); });
}

function NavigateToPOApproval() {
    const appBase = (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/')).replace(/\/?$/, '/');
    window.location.href = appBase + 'PurchaseTransactions/PurchaseOrder/POLevelsApprove?ModuleDesp=PO%20Approval';
}

$(document).ready(function () {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    $('#lstTxtFromDate').val(FormatDateInput(firstDay));
    $('#lstTxtToDate').val(FormatDateInput(today));
    InitDropdowns();
    LoadPOStatCounts();
    window.ShowPOListGrid(); 

    // Watch sidebar class changes (collapse/expand) and sync float bar
    const sidebarEl = document.getElementById('modern-sidebar');
    if (sidebarEl) {
        new MutationObserver(SyncFloatBarMargin)
            .observe(sidebarEl, { attributes: true, attributeFilter: ['class'] });
    }
    window.addEventListener('resize', SyncFloatBarMargin);
});

function FormatDateInput(d) {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
}

function FormatDateDisplay(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    const dy = String(dt.getDate()).padStart(2, '0');
    const mo = String(dt.getMonth() + 1).padStart(2, '0');
    const yr = dt.getFullYear();
    return `${dy}/${mo}/${yr}`;
}

function IsMobile() {
    return window.innerWidth <= 768;
}

function GetUserCode() {
    try {
        const authKey = JSON.parse(sessionStorage.getItem('authKey'));
        return authKey ? authKey.UserMaster_Code : 0;
    } catch { return 0; }
}

// ─── INIT DROPDOWNS ─────────────────────────────────────────────────────────

function InitDropdowns() {
    LoadStatusDropdown();
    LoadVendorDropdown();
    LoadWorkTypeDropdown();
    LoadItemDropdown();
    LoadUOMDropdown();
    LoadPaymentTermsDropdown();
    LoadBillToShipToDropdown();
    LoadSiteRepDropdown();
}

function LoadStatusDropdown() {
    PurchaseOrderStoreService.GetPOStoreStatusList().then(function (data) {
        let html = '<option value="">-- All Status --</option>';
        if (data && data.length > 0) {
            data.forEach(s => { html += `<option value="${s.Code}">${s.Name}</option>`; });
        }
        $('#lstDdlStatus').html(html);
    }).catch(() => { $('#lstDdlStatus').html('<option value="">-- All Status --</option>'); });
}

function LoadVendorDropdown() {
    PurchaseOrderStoreService.GetVendorList().then(function (data) {
        G_VendorList = data || [];
        let html = '<option value="">-- Select Vendor --</option>';
        G_VendorList.forEach(v => { html += `<option value="${v.Code}">${v.Name}</option>`; });
        $('#frmDdlVendor').html(html);
    }).catch(() => { $('#frmDdlVendor').html('<option value="">-- Select Vendor --</option>'); });
}

function LoadWorkTypeDropdown() {
    PurchaseOrderStoreService.GetWorkTypeList().then(function (data) {
        let html = '<option value="">-- Select Work Type --</option>';
        if (data && data.length > 0) {
            data.forEach(w => { html += `<option value="${w.Code}">${w.Name}</option>`; });
        }
        $('#frmDdlWorkType').html(html);
    }).catch(() => { $('#frmDdlWorkType').html('<option value="">-- Select Work Type --</option>'); });
}

function LoadItemDropdown() {
    PurchaseOrderStoreService.GetItemList().then(function (data) {
        G_ItemMasterList = data || [];
    }).catch(() => { G_ItemMasterList = []; });
}

function LoadUOMDropdown() {
    PurchaseOrderStoreService.GetUOMList().then(function (data) {
        G_UOMMasterList = data || [];
    }).catch(() => { G_UOMMasterList = []; });
}

function LoadPaymentTermsDropdown(selectedCode) {
    PurchaseOrderStoreService.GetPaymentTermsList().then(function (data) {
        G_PaymentTermsList = data || [];
        let html = '<option value="">-- Select Payment Terms --</option>';
        G_PaymentTermsList.forEach(p => {
            const sel = selectedCode && p.Code == selectedCode ? 'selected' : '';
            html += `<option value="${p.Code}" ${sel}>${p.Name}</option>`;
        });
        $('#frmDdlPaymentTerms').html(html);
    }).catch(() => { $('#frmDdlPaymentTerms').html('<option value="">-- Select Payment Terms --</option>'); });
}

// ─── FILTERED ITEM LIST ──────────────────────────────────────────────────────

function GetFilteredItemList() {
    const againstProject = $('#frmChkAgainstProject').is(':checked');
    const projectCode    = parseInt($('#frmDdlProject').val())    || 0;
    const subProjectCode = parseInt($('#frmDdlSubProject').val()) || 0;
    const workTypeCode   = parseInt($('#frmDdlWorkType').val())   || 0;

    if (againstProject && subProjectCode && workTypeCode) {
        return G_ItemMasterList.filter(i =>
            i.ProjectMaster_Code    == projectCode &&
            i.SubProjectMaster_Code == subProjectCode &&
            i.WorkTypeMaster_Code == workTypeCode
        );
    }
    if (workTypeCode) {
        return G_ItemMasterList.filter(i => i.WorkTypeMaster_Code == workTypeCode);
    }
    return G_ItemMasterList;
}

function RefreshAllItemDropdowns() {
    const filtered = GetFilteredItemList();
    $('#tblPOItemsBody tr').each(function () {
        const rowId     = $(this).attr('id').replace('itemRow_', '');
        const currentVal = $(`#frmDdlItem_${rowId}`).val();
        let html = '<option value="">-- Select Item --</option>';
        filtered.forEach(i => {
            const sel = currentVal && i.Code == currentVal ? 'selected' : '';
            html += `<option value="${i.Code}" ${sel}>${i.Name}</option>`;
        });
        $(`#frmDdlItem_${rowId}`).html(html);
    });
}

// ─── ITEM SELECT HTML ────────────────────────────────────────────────────────

function BuildItemSelect(rowId, selectedCode) {
    let html = `<select id="frmDdlItem_${rowId}" class="form-control form-control-sm" onchange="OnItemChange(${rowId})">
        <option value="">-- Select Item --</option>`;
    GetFilteredItemList().forEach(i => {
        const sel = selectedCode && i.Code == selectedCode ? 'selected' : '';
        html += `<option value="${i.Code}" ${sel}>${i.Name}</option>`;
    });
    html += '</select>';
    return html;
}

function BuildUOMSelect(rowId, selectedCode) {
    let html = `<select id="frmDdlUOM_${rowId}" class="form-control form-control-sm">
        <option value="">UOM</option>`;
    G_UOMMasterList.forEach(u => {
        const sel = selectedCode && u.Code == selectedCode ? 'selected' : '';
        html += `<option value="${u.Code}" ${sel}>${u.Name}</option>`;
    });
    html += '</select>';
    return html;
}

// ─── TOGGLE PROJECT FIELDS ───────────────────────────────────────────────────

window.ToggleProjectFields = function () {
    const checked = $('#frmChkAgainstProject').is(':checked');
    if (checked) {
        $('#divProjectFields').slideDown(220);
        if (G_ProjectList.length === 0) LoadProjectDropdown();
    } else {
        $('#divProjectFields').slideUp(220);
        G_ProjectList = [];
        G_SubProjectList = [];
        $('#frmDdlProject').html('<option value="">-- Select Project --</option>');
        $('#frmDdlSubProject').html('<option value="">-- Select Sub Project --</option>');
    }
    RefreshAllItemDropdowns();
};

function LoadProjectDropdown(selectedCode) {
    PurchaseOrderStoreService.GetProjectList().then(function (data) {
        G_ProjectList = data || [];
        let html = '<option value="">-- Select Project --</option>';
        G_ProjectList.forEach(p => {
            const sel = selectedCode && p.Code == selectedCode ? 'selected' : '';
            html += `<option value="${p.Code}" ${sel}>${p.Name}</option>`;
        });
        $('#frmDdlProject').html(html);
    }).catch(() => { $('#frmDdlProject').html('<option value="">-- Select Project --</option>'); });
}

window.LoadSubProjects = function (selectedCode) {
    const projectCode = $('#frmDdlProject').val();
    if (!projectCode) {
        $('#frmDdlSubProject').html('<option value="">-- Select Sub Project --</option>');
        RefreshAllItemDropdowns();
        return;
    }
    PurchaseOrderStoreService.GetSubProjectList(projectCode).then(function (data) {
        G_SubProjectList = data || [];
        let html = '<option value="">-- Select Sub Project --</option>';
        G_SubProjectList.forEach(s => {
            const sel = selectedCode && s.Code == selectedCode ? 'selected' : '';
            html += `<option value="${s.Code}" ${sel}>${s.Name}</option>`;
        });
        $('#frmDdlSubProject').html(html);
        RefreshAllItemDropdowns();
    }).catch(() => { $('#frmDdlSubProject').html('<option value="">-- Select Sub Project --</option>'); });
};

// ─── BILL TO / SHIP TO ───────────────────────────────────────────────────────

function LoadBillToShipToDropdown(billToCode, shipToCode) {
    PurchaseOrderStoreService.GetBillToShipToList().then(function (data) {
        G_BillToShipToList = data || [];
        PopulateBillShipDropdowns(billToCode, shipToCode);
    }).catch(() => {
        G_BillToShipToList = [];
        PopulateBillShipDropdowns(billToCode, shipToCode);
    });
}

function PopulateBillShipDropdowns(billToCode, shipToCode) {
    let opts = '<option value="">-- Select Address --</option>';
    G_BillToShipToList.forEach(a => {
        opts += `<option value="${a.Code}">${a.Name}</option>`;
    });

    if ($('#frmDdlBillTo').data('select2')) $('#frmDdlBillTo').select2('destroy');
    if ($('#frmDdlShipTo').data('select2')) $('#frmDdlShipTo').select2('destroy');

    $('#frmDdlBillTo').html(opts);
    $('#frmDdlShipTo').html(opts);

    if ($.fn.select2) {
        $('#frmDdlBillTo').select2({
            placeholder: '-- Select Bill To Address --',
            allowClear: true,
            width: '100%',
            dropdownParent: $('body')
        });
        $('#frmDdlShipTo').select2({
            placeholder: '-- Select Ship To Address --',
            allowClear: true,
            width: '100%',
            dropdownParent: $('body')
        });
        $('#frmDdlBillTo').off('change.bts').on('change.bts', function () {
            ShowAddressDetails('BillTo', $(this).val());
        });
        $('#frmDdlShipTo').off('change.bts').on('change.bts', function () {
            ShowAddressDetails('ShipTo', $(this).val());
        });
    }

    if (billToCode) { $('#frmDdlBillTo').val(billToCode).trigger('change'); }
    if (shipToCode) { $('#frmDdlShipTo').val(shipToCode).trigger('change'); }
}

function ShowAddressDetails(type, code) {
    const prefix = type === 'BillTo' ? 'billTo' : 'shipTo';
    const divId  = type === 'BillTo' ? '#divBillToAddress' : '#divShipToAddress';
    if (!code) { $(divId).hide(); return; }
    const addr = G_BillToShipToList.find(a => String(a.Code) === String(code));
    if (!addr)  { $(divId).hide(); return; }
    $(`#${prefix}Name`).text(addr.Name || '');
    $(`#${prefix}DisplayName`).text(addr.DisplayName || '');
    $(`#${prefix}Address`).text(addr.Address || '');
    $(`#${prefix}GSTNo`).text(addr.GSTNo || '');
    $(divId).show();
}

window.OpenAddAddressModal = function (type) {
    $('#addrModalType').val(type);
    $('#modalAddAddressTitle').text(type === 'BillTo' ? 'Add Bill To Address' : 'Add Ship To Address');
    $('#addrTxtName').val('');
    $('#addrTxtDisplayName').val('');
    $('#addrTxtAddress').val('');
    $('#addrTxtGSTNo').val('');
    $('#modalAddAddress').modal('show');
};

window.SaveBillToShipToAddress = function () {
    const name        = $('#addrTxtName').val().trim();
    const displayName = $('#addrTxtDisplayName').val().trim();
    const address     = $('#addrTxtAddress').val().trim();
    const gstNo       = $('#addrTxtGSTNo').val().trim();
    const type        = $('#addrModalType').val();

    if (!name)        { toastr.warning('Please enter Name.');         return; }
    if (!displayName) { toastr.warning('Please enter Display Name.'); return; }
    if (!address)     { toastr.warning('Please enter Address.');      return; }

    const payload = JSON.stringify({ Code:0, Addresses: [{ Name: name, DisplayName: displayName, Address: address, GSTNo: gstNo }]});

    PurchaseOrderStoreService.SaveBillToShipToAddress(payload).then(function (res) {
        if (res && res.Status === 'Y') {
            toastr.success(res.Msg || 'Address saved successfully.');
            $('#modalAddAddress').modal('hide');
            const newCode = res.Code || res.NewCode || null;
            LoadBillToShipToDropdown(
                type === 'BillTo'  ? (newCode || $('#frmDdlBillTo').val() || null)  : ($('#frmDdlBillTo').val() || null),
                type === 'ShipTo'  ? (newCode || $('#frmDdlShipTo').val() || null)  : ($('#frmDdlShipTo').val() || null)
            );
        } else {
            toastr.error(res ? res.Msg : 'Failed to save address.');
        }
    }).catch(err => {
        toastr.error('Error saving address.');
        console.error(err);
    });
};

// ─── SITE REPRESENTATIVE ──────────────────────────────────────────────────

function LoadSiteRepDropdown(selectedCode) {
    PurchaseOrderStoreService.GetSiteRepresentativeList().then(function (data) {
        G_SiteRepList = data || [];
        PopulateSiteRepDropdown(selectedCode);
    }).catch(function () {
        G_SiteRepList = [];
        PopulateSiteRepDropdown(selectedCode);
    });
}

function PopulateSiteRepDropdown(selectedCode) {
    let opts = '<option value="">-- Select Site Representative --</option>';
    G_SiteRepList.forEach(function (r) {
        opts += '<option value="' + r.Code + '">' + r.Name + '</option>';
    });
    if ($('#frmDdlSiteRep').data('select2')) $('#frmDdlSiteRep').select2('destroy');
    $('#frmDdlSiteRep').html(opts);
    if ($.fn.select2) {
        $('#frmDdlSiteRep').select2({
            placeholder: '-- Select Site Representative --',
            allowClear: true,
            width: '100%',
            dropdownParent: $('body')
        });
        $('#frmDdlSiteRep').off('change.srep').on('change.srep', function () {
            ShowSiteRepDetails($(this).val());
        });
    }
    if (selectedCode) { $('#frmDdlSiteRep').val(selectedCode).trigger('change'); }
}

function ShowSiteRepDetails(code) {
    if (!code) { $('#divSiteRepDetails').hide(); return; }
    const rep = G_SiteRepList.find(function (r) { return String(r.Code) === String(code); });
    if (!rep) { $('#divSiteRepDetails').hide(); return; }
    $('#siteRepName').text(rep.Name || '');
    $('#siteRepMobile').text(rep.Mobile || rep.MobileNo || '');
    $('#siteRepEmail').text(rep.Email || '');
    $('#divSiteRepDetails').show();
}

window.OpenAddSiteRepModal = function () {
    $('#siteRepTxtName').val('');
    $('#siteRepTxtMobile').val('');
    $('#siteRepTxtEmail').val('');
    $('#modalAddSiteRep').modal('show');
};

window.SaveSiteRepresentative = function () {
    const name   = $('#siteRepTxtName').val().trim();
    const mobile = $('#siteRepTxtMobile').val().trim();
    const email  = $('#siteRepTxtEmail').val().trim();
    if (!name) { toastr.warning('Please enter Name.'); return; }
    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
        toastr.warning('Please enter a valid 10-digit Mobile No (starting with 6–9).');
        $('#siteRepTxtMobile').focus();
        return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        toastr.warning('Please enter a valid Email address.');
        $('#siteRepTxtEmail').focus();
        return;
    }
    const payload = JSON.stringify({ siteRepresentatives: [{ Code: 0, Name: name, MobileNo: mobile, Email: email }]});
    PurchaseOrderStoreService.SaveSiteRepresentative(payload).then(function (res) {
        if (res && res.Status === 'Y') {
            toastr.success(res.Msg || 'Site Representative saved.');
            $('#modalAddSiteRep').modal('hide');
            const newCode = res.Code || res.NewCode || null;
            LoadSiteRepDropdown(newCode);
        } else {
            toastr.error(res ? res.Msg : 'Failed to save Site Representative.');
        }
    }).catch(function (err) {
        toastr.error('Error saving Site Representative.');
        console.error(err);
    });
};

// ─── PO LIST GRID ──────────────────────────────────────────────────

window.ShowPOListGrid = function () {
    const fromDate = $('#lstTxtFromDate').val();
    const toDate = $('#lstTxtToDate').val();
    const status = $('#lstDdlStatus').val();

    if (!fromDate || !toDate) {
        toastr.warning('Please select From Date and To Date.');
        return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
        toastr.warning('From Date cannot be greater than To Date.');
        return;
    }

    PurchaseOrderStoreService.GetPurchaseOrderStoreList(status, fromDate, toDate).then(function (data) {
        G_POStoreList = data || [];
        $('#statTotalPO').text(G_POStoreList.length || '—');
        const pendingCount  = G_POStoreList.filter(i => (i.Status || '').toLowerCase() === 'pending').length;
        const approvedCount = G_POStoreList.filter(i => (i.Status || '').toLowerCase() === 'approved').length;
        $('#statPendingPO').text(pendingCount  > 0 ? pendingCount  : '—');
        $('#statApprovedPO').text(approvedCount > 0 ? approvedCount : '—');
        if (G_POStoreList.length === 0) {
            $('#tblPOListHeader').html('');
            $('#tblPOListBody').html('<tr><td colspan="10" class="text-center text-muted py-4"><i class="fa fa-inbox fa-2x d-block mb-2 text-muted"></i>No records found for the selected period.</td></tr>');
            $('#paginator-tblPOList').html('');
            return;
        }
        const stringFilterColumn = ['PO No', 'Vendor', 'Status', 'Project Name', 'Sub Project Name','Work Type'];
        const numericFilterColumn = ['Total Amount'];
        const dateFilterColumn = ['PO Date'];
        const button = false;
        const showButtons = [];
        const hiddenColumns = ['Code'];
        const columnAlignment = { 'Total Amount': 'right', 'PO Date': 'center', 'PO No': 'center' };
        const TotalColumns = ['Total Amount']

        const displayData = G_POStoreList.map(item => ({
            'Code': item.Code,
            'PO No': item.PONo || item.PO_No || '',
            'PO Date': FormatDateDisplay(item.PODate || item.PO_Date),
            'Vendor': item.VendorName || item.Vendor || '',
            'Ref No': item.RefNo || '',
            'Project Name': item.ProjectName,
            'Sub Project Name': item.SubProjectName,
            'Work Type': item.WorkType,
            'Total Amount': parseFloat(item.TotalPOAmount || item.Total_Amount || 0).toFixed(2),
            'Status': item.Status || '',
            'Action': `<button class="btn btn-info icon-height mb-1" title="View" onclick="ViewPO('${item.Code}')"><i class="fa fa-eye"></i></button>
                       <button class="btn btn-warning icon-height mb-1 ms-1" title="Edit" onclick="OpenPOForm('Edit','${item.Code}')"><i class="fa fa-edit"></i></button>
                       <button class="btn btn-danger icon-height mb-1 ms-1" title="Delete" onclick="InitDeletePO('${item.Code}','${item.PONo || item.PO_No || ''}')"><i class="fa fa-trash"></i></button>
                       <button class="btn btn-secondary icon-height mb-1 ms-1" title="Print Preview" onclick="PrintPO('${item.Code}','preview')"><i class="fa fa-search-plus"></i></button>
                       <button class="btn btn-dark icon-height mb-1 ms-1" title="Print" onclick="PrintPO('${item.Code}','print')"><i class="fa fa-print"></i></button>
                       ${(item.Status || '').toLowerCase() === 'approved' ? `<button class="btn icon-height mb-1 ms-1" style="background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border:none;" title="Cancel PO" onclick="InitCancelPO('${item.Code}','${item.PONo || item.PO_No || ''}')"><i class="fa fa-ban"></i></button>` : ''}`
        }));
        BizsolCustomFilterGrid.CreateDataTable('tblPOListHeader', 'tblPOListBody', displayData, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, [], hiddenColumns, columnAlignment, true, TotalColumns);
    }).catch(err => {
        toastr.error('Error loading PO list.');
        console.error(err);
    });
};

// ─── OPEN / CLOSE FORM ───────────────────────────────────────────────────────

window.OpenPOForm = function (mode, code) {
    const ModuleName = $('#ERPHeading').text().trim();
    const OptionName = mode;
    const ShowMsg = 'Y';
    const FinYear = BizSolHelperFunction.getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg);
            return;
        }

        G_POStoreEditMode = mode;
        ResetPOForm();
        $('#divPOList').hide();
        $('#divPOForm').show();
        // Show floating save bar
        $('#poFloatBar').css('display', 'flex');
        SyncFloatBarMargin();
        // Update floating bar labels
        $('#floatPONo').text(mode === 'New' ? 'New PO' : 'Loading…');
        if (mode === 'Edit') {
            $('#floatModeBadge').text('EDIT').removeClass('bg-success').addClass('bg-warning text-dark');
        } else {
            $('#floatModeBadge').text('NEW').removeClass('bg-warning text-dark').addClass('bg-success');
        }
        if (mode === 'Edit' && code) {
            LoadPOForEdit(code);
        } else {
            $('#frmTxtPODate').val(FormatDateInput(new Date()));
            G_ItemRowCount = 0;
            if (IsMobile()) {
                RenderMobileItemCards();
            } else {
                AddItemRow();
            }
        }
    });
};

window.ClosePOForm = function () {
    $('#divPOForm').hide();
    $('#poFloatBar').hide();
    $('#divPOList').show();
};

function ResetPOForm() {
    $('#frmHfCode').val('');
    $('#frmTxtPONo').val('');
    $('#frmTxtPODate').val('');
    $('#frmDdlVendor').val('');
    $('#frmTxtRefNo').val('');
    $('#frmTxtRefDate').val('');
    $('#frmDdlPaymentTerms').val('');
    $('#frmTxtRemarks').val('');
    $('#frmChkAgainstProject').prop('checked', true);
    $('#divProjectFields').show();
    G_SubProjectList = [];
    if (G_ProjectList.length === 0) LoadProjectDropdown();
    $('#frmDdlProject').html('<option value="">-- Select Project --</option>');
    $('#frmDdlSubProject').html('<option value="">-- Select Sub Project --</option>');
    $('#frmDdlWorkType').val('');
    $('#frmTxtOtherCharges1').val(0);
    $('#frmTxtOtherCharges2').val(0);
    $('#frmChkRoundOff').prop('checked', false);
    $('#tblPOItemsBody').html('');
    G_ItemRowCount = 0;
    UpdateSummary(0, 0, 0, 0, 0);
    if ($('#frmDdlBillTo').data('select2')) {
        $('#frmDdlBillTo').val(null).trigger('change');
        $('#frmDdlShipTo').val(null).trigger('change');
    } else {
        $('#frmDdlBillTo').val('');
        $('#frmDdlShipTo').val('');
    }
    $('#divBillToAddress').hide();
    $('#divShipToAddress').hide();
    if ($('#frmDdlSiteRep').data('select2')) {
        $('#frmDdlSiteRep').val(null).trigger('change');
    } else {
        $('#frmDdlSiteRep').val('');
    }
    $('#divSiteRepDetails').hide();
}

// ─── ADD / DELETE ITEM ROWS ──────────────────────────────────────────────────

window.AddItemRow = function (silent) {
    if (IsMobile() && !silent) {
        OpenMobileItemModal(null);
        return;
    }
    G_ItemRowCount++;
    const rowId = G_ItemRowCount;
    const itemSelect = BuildItemSelect(rowId, null);
    const uomSelect = BuildUOMSelect(rowId, null);
    const row = `<tr id="itemRow_${rowId}">
        <td class="text-center fw-bold">${rowId}</td>
        <td>${itemSelect}</td>
        <td><input type="text" id="frmTxtSpecification_${rowId}" class="form-control form-control-sm" placeholder="Specification…" /></td>
        <td>${uomSelect}</td>
        <td><input type="number" id="frmTxtGSTRate_${rowId}" class="form-control form-control-sm" value="0" min="0" max="100" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
        <td><input type="number" id="frmTxtQty_${rowId}" class="form-control form-control-sm" value="0" min="0" step="0.001" onchange="CalcRowValue(${rowId})" /></td>
        <td><input type="number" id="frmTxtRate_${rowId}" class="form-control form-control-sm" value="0" min="0" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
        <td><input type="number" id="frmTxtValue_${rowId}" class="form-control form-control-sm" value="0" readonly /></td>
        <td class="text-center">
            <input type="hidden" id="frmHfDetailCode_${rowId}" value="0" />
            <input type="hidden" id="frmHfBaseQty_${rowId}" value="0" />
            <input type="hidden" id="frmHfQtyTolerance_${rowId}" value="0" />
            <input type="hidden" id="frmHfBaseRate_${rowId}" value="0" />
            <input type="hidden" id="frmHfRateTolerance_${rowId}" value="0" />
            <button type="button" class="del-row-btn" title="Remove" onclick="DeleteItemRow(${rowId})"><i class="fa fa-times-circle"></i></button>
        </td>
    </tr>`;
    $('#tblPOItemsBody').append(row);
    RenumberRows();
};

window.DeleteItemRow = function (rowId) {
    if ($('#tblPOItemsBody tr').length <= 1) {
        toastr.warning('At least one item row is required.');
        return;
    }
    $(`#itemRow_${rowId}`).remove();
    RenumberRows();
    CalcTotals();
    if (IsMobile()) RenderMobileItemCards();
};

function RenumberRows() {
    $('#tblPOItemsBody tr').each(function (index) {
        $(this).find('td:first').text(index + 1);
    });
}

// ─── TOLERANCE HELPERS ───────────────────────────────────────────────────────

function GetRowToleranceInfo(rowId) {
    const baseQty  = parseFloat($(`#frmHfBaseQty_${rowId}`).val())       || 0;
    const qtyTol   = parseFloat($(`#frmHfQtyTolerance_${rowId}`).val())  || 0;
    const baseRate = parseFloat($(`#frmHfBaseRate_${rowId}`).val())      || 0;
    const rateTol  = parseFloat($(`#frmHfRateTolerance_${rowId}`).val()) || 0;
    const maxQty   = (baseQty  > 0 && qtyTol  > 0) ? parseFloat((baseQty  * (1 + qtyTol  / 100)).toFixed(3)) : 0;
    const maxRate  = (baseRate > 0 && rateTol > 0) ? parseFloat((baseRate * (1 + rateTol / 100)).toFixed(2)) : 0;
    return { baseQty, qtyTol, baseRate, rateTol, maxQty, maxRate };
}

function ApplyToleranceToRow(rowId, item) {
    const baseQty  = item ? (parseFloat(item.QtyRequired  || item.Qty          || 0)) : 0;
    const qtyTol   = item ? (parseFloat(item.QtyTolerance || item.Tolerance     || 0)) : 0;
    const baseRate = item ? (parseFloat(item.Rate         || item.EstimatedRate || 0)) : 0;
    const rateTol  = item ? (parseFloat(item.RateTolerance                      || 0)) : 0;

    $(`#frmHfBaseQty_${rowId}`).val(baseQty);
    $(`#frmHfQtyTolerance_${rowId}`).val(qtyTol);
    $(`#frmHfBaseRate_${rowId}`).val(baseRate);
    $(`#frmHfRateTolerance_${rowId}`).val(rateTol);

    const maxQty  = (baseQty  > 0 && qtyTol  > 0) ? parseFloat((baseQty  * (1 + qtyTol  / 100)).toFixed(3)) : 0;
    const maxRate = (baseRate > 0 && rateTol > 0) ? parseFloat((baseRate * (1 + rateTol / 100)).toFixed(2)) : 0;

    if (maxQty  > 0) {
        $(`#frmTxtQty_${rowId}`).attr('title', `Max Qty (${qtyTol}% tolerance): ${maxQty}`);
    } else {
        $(`#frmTxtQty_${rowId}`).removeAttr('title');
    }
    if (maxRate > 0) {
        $(`#frmTxtRate_${rowId}`).attr('title', `Max Rate (${rateTol}% tolerance): ${maxRate}`);
    } else {
        $(`#frmTxtRate_${rowId}`).removeAttr('title');
    }
}

window.OnItemChange = function (rowId) {
    const selectedCode = $(`#frmDdlItem_${rowId}`).val();
    const item = G_ItemMasterList.find(i => String(i.Code) === String(selectedCode));
    if (item && item.UOM_Code) {
        $(`#frmDdlUOM_${rowId}`).val(item.UOM_Code);
    }
    if (item && item.GSTRate !== undefined) {
        $(`#frmTxtGSTRate_${rowId}`).val(item.GSTRate || 0);
    }
    $(`#frmTxtSpecification_${rowId}`).val(item ? (item.ItemSpecificationDesp || '') : '');
    ApplyToleranceToRow(rowId, item || null);
    CalcRowValue(rowId);
};

window.CalcRowValue = function (rowId) {
    const tol = GetRowToleranceInfo(rowId);
    let qty    = parseFloat($(`#frmTxtQty_${rowId}`).val())  || 0;
    let rate   = parseFloat($(`#frmTxtRate_${rowId}`).val()) || 0;

    if (tol.maxQty > 0 && qty > tol.maxQty) {
        toastr.warning(`Qty exceeds the ${tol.qtyTol}% tolerance. Maximum allowed Qty is ${tol.maxQty}.`);
        qty = tol.maxQty;
        $(`#frmTxtQty_${rowId}`).val(qty);
    }
    if (tol.maxRate > 0 && rate > tol.maxRate) {
        toastr.warning(`Rate exceeds the ${tol.rateTol}% tolerance. Maximum allowed Rate is ${tol.maxRate}.`);
        rate = tol.maxRate;
        $(`#frmTxtRate_${rowId}`).val(rate);
    }

    const value = qty * rate;
    $(`#frmTxtValue_${rowId}`).val(value.toFixed(2));
    CalcTotals();
};

// ─── CALCULATE TOTALS ────────────────────────────────────────────────────────

window.CalcTotals = function () {
    let taxableAmount = 0;
    let totalGST = 0;

    $('#tblPOItemsBody tr').each(function () {
        const rowId = $(this).attr('id').replace('itemRow_', '');
        const value = parseFloat($(`#frmTxtValue_${rowId}`).val()) || 0;
        const gstRate = parseFloat($(`#frmTxtGSTRate_${rowId}`).val()) || 0;
        taxableAmount += value;
        totalGST += value * gstRate / 100;
    });

    const otherCharges1 = parseFloat($('#frmTxtOtherCharges1').val()) || 0;
    const otherCharges2 = parseFloat($('#frmTxtOtherCharges2').val()) || 0;
    let totalPO = taxableAmount + totalGST + otherCharges1 + otherCharges2;

    let roundOff = 0;
    if ($('#frmChkRoundOff').is(':checked')) {
        const rounded = Math.round(totalPO);
        roundOff = rounded - totalPO;
        totalPO = rounded;
    }

    UpdateSummary(taxableAmount, totalGST, otherCharges1, otherCharges2, totalPO, roundOff);
};

function UpdateSummary(taxable, gst, other1, other2, total, roundOff) {
    $('#sumTaxableAmount').text(parseFloat(taxable || 0).toFixed(2));
    $('#sumTotalGST').text(parseFloat(gst || 0).toFixed(2));
    $('#sumRoundOff').text(parseFloat(roundOff || 0).toFixed(2));
    $('#sumTotalPOAmount').text(parseFloat(total || 0).toFixed(2));
}

// ─── SAVE PO ─────────────────────────────────────────────────────────────────

window.SavePO = function () {
    const poDate = $('#frmTxtPODate').val();
    const vendorCode = $('#frmDdlVendor').val();

    if (!poDate)     { toastr.warning('Please select PO Date.'); return; }
    if (!vendorCode) { toastr.warning('Please select Vendor.'); return; }
    if (!$('#frmDdlWorkType').val()) { toastr.warning('Please select Work Type.'); return; }
    if ($('#frmChkAgainstProject').is(':checked')) {
        if (!$('#frmDdlProject').val())    { toastr.warning('Please select Project.');     return; }
        if (!$('#frmDdlSubProject').val()) { toastr.warning('Please select Sub Project.'); return; }
    }

    const masterCode = parseInt($('#frmHfCode').val()) || 0;
    const agaistProject = $('#frmChkAgainstProject').is(':checked') ? 'Y' : 'N';
    const projectCode = agaistProject === 'Y' ? (parseInt($('#frmDdlProject').val()) || 0) : 0;
    const taxable = parseFloat($('#sumTaxableAmount').text()) || 0;
    const totalGST = parseFloat($('#sumTotalGST').text()) || 0;
    const totalPO = parseFloat($('#sumTotalPOAmount').text()) || 0;
    const freightAmt = parseFloat($('#frmTxtOtherCharges2').val()) || 0;
    const otherChargesAmt = parseFloat($('#frmTxtOtherCharges1').val()) || 0;

    const transactions = [];
    let itemValid = true;

    $('#tblPOItemsBody tr').each(function () {
        const rowId = $(this).attr('id').replace('itemRow_', '');
        const detailCode = parseInt($(`#frmHfDetailCode_${rowId}`).val()) || 0;
        const itemCode = parseInt($(`#frmDdlItem_${rowId}`).val()) || 0;
        const qty = parseFloat($(`#frmTxtQty_${rowId}`).val()) || 0;
        const rate = parseFloat($(`#frmTxtRate_${rowId}`).val()) || 0;
        const gstRate = parseFloat($(`#frmTxtGSTRate_${rowId}`).val()) || 0;
        const amount = parseFloat($(`#frmTxtValue_${rowId}`).val()) || 0;

        if (!itemCode) { toastr.warning('Please select item in all rows.'); itemValid = false; return false; }
        if (qty <= 0) { toastr.warning('Qty must be greater than 0 for all items.'); itemValid = false; return false; }
        const saveTol = GetRowToleranceInfo(rowId);
        if (saveTol.maxQty > 0 && qty > saveTol.maxQty) {
            toastr.warning(`Row ${rowId}: Qty ${qty} exceeds the ${saveTol.qtyTol}% tolerance. Maximum allowed: ${saveTol.maxQty}.`);
            itemValid = false; return false;
        }
        if (saveTol.maxRate > 0 && rate > saveTol.maxRate) {
            toastr.warning(`Row ${rowId}: Rate ${rate} exceeds the ${saveTol.rateTol}% tolerance. Maximum allowed: ${saveTol.maxRate}.`);
            itemValid = false; return false;
        }

        transactions.push({
            code: detailCode,
            purchaseOrderMaster_Code: masterCode,
            itemMaster_Code: itemCode,
            itemSizeMaster_Code: 0,
            uomMaster_Code: parseInt($(`#frmDdlUOM_${rowId}`).val()) || 0,
            qtyMT: qty,
            qtyPC: 0,
            qtyMTRS: 0,
            rateUnit: '',
            rate: rate,
            amount: amount,
            status: '',
            gstRate: gstRate,
            gstAmount: parseFloat((amount * gstRate / 100).toFixed(2)),
            remark: '',
            projectMaster_Code: projectCode,
            specification: $(`#frmTxtSpecification_${rowId}`).val() || ''
        });
    });

    if (!itemValid || transactions.length === 0) {
        if (transactions.length === 0) toastr.warning('Please add at least one item.');
        return;
    }

    const payload = {
        code: masterCode,
        master: [{
            code: masterCode,
            poNo: 0,
            poDate: poDate,
            vendorMaster_Code: parseInt(vendorCode) || 0,
            refNo: $('#frmTxtRefNo').val(),
            refDate: $('#frmTxtRefDate').val() || null,
            paymentTermsMaster_Code: parseInt($('#frmDdlPaymentTerms').val()) || 0,
            totalAssValue: taxable,
            dutyRate: 0,
            dutyAmount: 0,
            cessRate: 0,
            cessAmount: 0,
            shCessRate: 0,
            shCessAmount: 0,
            taxRate: 0,
            taxAmount: totalGST,
            entryTaxRate: 0,
            entryTaxAmount: 0,
            freightAmount: freightAmt,
            otherChargesDesp: $('#frmTxtOtherChargesLbl1').val(),
            otherChargesAmount: otherChargesAmt,
            totalPOAmount: totalPO,
            remarks: $('#frmTxtRemarks').val(),
            poType: 'S',
            finYear: '',
            remarks1: '',
            isPOAgainstProject: agaistProject,
            projectMaster_Code: projectCode,
            billingAddress: parseInt($('#frmDdlBillTo').val()) || 0,
            ShippingAdress: parseInt($('#frmDdlShipTo').val()) || 0,
            subProjectMaster_Code: agaistProject === 'Y' ? (parseInt($('#frmDdlSubProject').val()) || 0) : 0,
            workTypeMaster_Code: parseInt($('#frmDdlWorkType').val()) || 0,
            SiteRepresentativeMaster_Code: parseInt($('#frmDdlSiteRep').val()) || 0
        }],
        transactions: transactions
    };

    PurchaseOrderStoreService.SavePurchaseOrderStore(JSON.stringify(payload)).then(function (res) {
        if (res && res.Status === 'Y') {
            toastr.success(res.Msg || 'PO saved successfully.');
            ClosePOForm();
            ShowPOListGrid();
            LoadPOStatCounts();
        } else {
            toastr.error(res ? res.Msg : 'Failed to save PO.');
        }
    }).catch(err => {
        toastr.error('Error saving PO.');
        console.error(err);
    });
};

// ─── EDIT PO ──────────────────────────────────────────────────────────────────

function LoadPOForEdit(code) {
    PurchaseOrderStoreService.GetPurchaseOrderStoreById(code).then(function (res) {
        if (!res) { toastr.error('PO not found.'); ClosePOForm(); return; }

        const header = res[0][0];
        const details = res[1] || [];

        $('#frmHfCode').val(header.Code);
        $('#frmTxtPONo').val(header.PONo || '');
        $('#frmTxtPODate').val(FormatDateInput(new Date(header.PODate)));
        $('#frmDdlVendor').val(header.VendorMaster_Code);
        $('#frmTxtRefNo').val(header.RefNo || '');
        if (header.RefDate) $('#frmTxtRefDate').val(FormatDateInput(new Date(header.RefDate)));
        $('#frmDdlPaymentTerms').val(header.PaymentTermsMaster_Code || '');
        $('#frmTxtRemarks').val(header.Remarks || '');

        const againstProject = (header.IsPOAgainstProject === 'Y');
        $('#frmChkAgainstProject').prop('checked', againstProject);
        $('#frmDdlWorkType').val(header.WorkTypeMaster_Code || '');

        // ── Bill To / Ship To ──────────────────────────────────────────────
        if (G_BillToShipToList.length > 0) {
            if (header.BillToAddress_Code) {
                $('#frmDdlBillTo').val(header.BillToAddress_Code).trigger('change');
            }
            if (header.ShipToAddress_Code) {
                $('#frmDdlShipTo').val(header.ShipToAddress_Code).trigger('change');
            }
        } else {
            LoadBillToShipToDropdown(header.BillToAddress_Code || null, header.ShipToAddress_Code || null);
        }

        if (againstProject) {
            $('#divProjectFields').show();
            LoadProjectDropdown(header.ProjectMaster_Code);
            PurchaseOrderStoreService.GetSubProjectList(header.ProjectMaster_Code).then(function (data) {
                G_SubProjectList = data || [];
                let html = '<option value="">-- Select Sub Project --</option>';
                G_SubProjectList.forEach(s => {
                    const sel = s.Code == header.SubProjectMaster_Code ? 'selected' : '';
                    html += `<option value="${s.Code}" ${sel}>${s.Name}</option>`;
                });
                $('#frmDdlSubProject').html(html);
            }).catch(() => {
                $('#frmDdlSubProject').html(`<option value="${header.SubProjectMaster_Code}" selected></option>`);
            });
        } else {
            $('#divProjectFields').hide();
        }
        // Update floating PO number
        $('#floatPONo').text(header.PONo || 'PO');
        $('#floatModeBadge').text('EDIT').removeClass('bg-success').addClass('bg-warning text-dark');

        $('#frmTxtOtherChargesLbl1').val(header.OtherChargesDesp || 'Other Charges');
        $('#frmTxtOtherCharges1').val(header.OtherChargesAmount || 0);
        $('#frmTxtOtherChargesLbl2').val('Freight');
        $('#frmTxtOtherCharges2').val(header.FreightAmount || 0);
        $('#frmChkRoundOff').prop('checked', header.IsRoundOff === 'Y');
        if (G_SiteRepList.length > 0) {
            if (header.SiteRepresentativeMaster_Code) {
                $('#frmDdlSiteRep').val(header.SiteRepresentativeMaster_Code).trigger('change');
            }
        } else {
            LoadSiteRepDropdown(header.SiteRepresentativeMaster_Code || null);
        }

        $('#tblPOItemsBody').html('');
        G_ItemRowCount = 0;

        details.forEach(function (det) {
            G_ItemRowCount++;
            const rowId = G_ItemRowCount;
            const itemSelect = BuildItemSelect(rowId, det.ItemMaster_Code);
            const uomSelect = BuildUOMSelect(rowId, det.UOMMaster_Code);
            const row = `<tr id="itemRow_${rowId}">
                <td class="text-center fw-bold">${rowId}</td>
                <td>${itemSelect}</td>
                <td><input type="text" id="frmTxtSpecification_${rowId}" class="form-control form-control-sm" placeholder="Specification…" value="${(det.Specification || '').replace(/"/g, '&quot;')}" /></td>
                <td>${uomSelect}</td>
                <td><input type="number" id="frmTxtGSTRate_${rowId}" class="form-control form-control-sm" value="${det.GSTRate || 0}" min="0" max="100" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
                <td><input type="number" id="frmTxtQty_${rowId}" class="form-control form-control-sm" value="${det.QtyMT || 0}" min="0" step="0.001" onchange="CalcRowValue(${rowId})" /></td>
                <td><input type="number" id="frmTxtRate_${rowId}" class="form-control form-control-sm" value="${det.Rate || 0}" min="0" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
                <td><input type="number" id="frmTxtValue_${rowId}" class="form-control form-control-sm" value="${det.Amount || 0}" readonly /></td>
                <td class="text-center">
                    <input type="hidden" id="frmHfDetailCode_${rowId}" value="${det.Code || 0}" />
                    <input type="hidden" id="frmHfBaseQty_${rowId}" value="0" />
                    <input type="hidden" id="frmHfQtyTolerance_${rowId}" value="0" />
                    <input type="hidden" id="frmHfBaseRate_${rowId}" value="0" />
                    <input type="hidden" id="frmHfRateTolerance_${rowId}" value="0" />
                    <button type="button" class="del-row-btn" title="Remove" onclick="DeleteItemRow(${rowId})"><i class="fa fa-times-circle"></i></button>
                </td>
            </tr>`;
            $('#tblPOItemsBody').append(row);
            const tolItem = G_ItemMasterList.find(i => String(i.Code) === String(det.ItemMaster_Code));
            ApplyToleranceToRow(rowId, tolItem || null);
        });

        if (details.length === 0) AddItemRow(true);
        if (IsMobile()) RenderMobileItemCards();
        CalcTotals();
    }).catch(err => {
        toastr.error('Error loading PO details.');
        console.error(err);
    });
}

// ─── VIEW PO ──────────────────────────────────────────────────────────────────

function BuildApprovalFlowHTML(steps) {
    if (!steps || steps.length === 0) return '';
    let html = '';
    steps.forEach(function (step, idx) {
        const status   = (step.ApprovalStatus || '').trim().toLowerCase();
        const approved = status === 'approved';
        const rejected = status === 'rejected';

        // ── circle colours ────────────────────────────────────────────────────
        const circleBg  = approved ? '#1a9e5c' : rejected ? '#e53935' : '#e0e0e0';
        const circleBdr = approved ? '#1a9e5c' : rejected ? '#e53935' : '#bdbdbd';
        const circleIcon = rejected ? 'fa-times' : 'fa-check';
        const iconClr    = (approved || rejected) ? '#fff' : '#aaaaaa';

        // ── badge ─────────────────────────────────────────────────────────────
        const badgeBg  = approved ? '#d4f5e2' : rejected ? '#fde8e8' : '#f0f0f0';
        const badgeClr = approved ? '#1a9e5c' : rejected ? '#e53935' : '#aaaaaa';
        const badgeTxt = approved ? 'Approved' : rejected ? 'Rejected' : 'Pending';

        // ── approver name ─────────────────────────────────────────────────────
        const nameHtml = (approved || rejected) && step.ApproverName && step.ApproverName.trim() !== ''
            ? '<div style="font-size:10px;color:#333;font-weight:600;margin-top:4px;text-align:center;max-width:88px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + step.ApproverName + '">'
              + '<i class="fa fa-user" style="font-size:9px;margin-right:2px;color:' + circleBg + ';"></i>' + step.ApproverName
              + '</div>'
            : '';

        // ── approved / action date ────────────────────────────────────────────
        const dateStr  = ((approved || rejected) && step.ApprovedOn && step.ApprovedOn.trim() !== '') ? FormatDateDisplay(step.ApprovedOn) : '';
        const dateHtml = dateStr
            ? '<div style="font-size:10px;color:#888;margin-top:2px;text-align:center;white-space:nowrap;">'
              + '<i class="fa fa-calendar-check" style="font-size:9px;margin-right:2px;"></i>' + dateStr
              + '</div>'
            : '';

        // ── remarks ───────────────────────────────────────────────────────────
        const remarkHtml = step.Remarks && step.Remarks.trim() !== ''
            ? '<div style="font-size:10px;color:#666;margin-top:3px;text-align:center;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-style:italic;" title="' + step.Remarks + '">'
              + '<i class="fa fa-comment-dots" style="font-size:9px;margin-right:2px;color:#aaa;"></i>' + step.Remarks
              + '</div>'
            : '';

        html += '<div style="display:flex;flex-direction:column;align-items:center;min-width:80px;max-width:96px;">'
              + '<div style="width:44px;height:44px;border-radius:50%;background:' + circleBg + ';border:3px solid ' + circleBdr + ';display:flex;align-items:center;justify-content:center;">'
              + '<i class="fa ' + circleIcon + '" style="color:' + iconClr + ';font-size:14px;"></i>'
              + '</div>'
              + '<div style="font-size:12px;font-weight:600;color:#444;margin-top:7px;text-align:center;">' + step.LevelDesc + '</div>'
              + '<div style="background:' + badgeBg + ';color:' + badgeClr + ';font-size:11px;font-weight:600;padding:2px 10px;border-radius:12px;margin-top:4px;white-space:nowrap;">' + badgeTxt + '</div>'
              + nameHtml
              + dateHtml
              + remarkHtml
              + '</div>';
        if (idx < steps.length - 1) {
            html += '<div style="flex:1;border-top:2px dashed #bdbdbd;min-width:16px;margin-top:20px;"></div>';
        }
    });
    return '<div style="background:#f8fffe;border:1px solid #ddf0e8;border-radius:10px;padding:14px 20px;margin-bottom:16px;">'
         + '<div style="font-size:11px;font-weight:700;color:#667;letter-spacing:1.2px;margin-bottom:14px;">'
         + '<i class="fa fa-layer-group" style="color:#1a9e5c;margin-right:6px;"></i>APPROVAL FLOW'
         + '</div>'
         + '<div style="display:flex;align-items:flex-start;overflow-x:auto;padding-bottom:4px;">'
         + html
         + '</div>'
         + '</div>';
}

window.ViewPO = function (code) {
    const ModuleName = $('#ERPHeading').text().trim();
    const ShowMsg = 'Y';
    const FinYear = BizSolHelperFunction.getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, 'View', ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg);
            return;
        }

        PurchaseOrderStoreService.GetPurchaseOrderStoreById(code).then(function (res) {
            if (!res) { toastr.error('PO not found.'); return; }
        const header = res[0][0];
        const details = res[1] || [];
        const approvalFlow = res[2] || [];

        const vendorName = (G_VendorList.find(v => v.Code == header.VendorMaster_Code) || {}).Name || '';
        const paymentTermsName = (G_PaymentTermsList.find(p => p.Code == header.PaymentTermsMaster_Code) || {}).Name || '';
        const againstProject = header.IsPOAgainstProject === 'Y';
        const billToAddr = G_BillToShipToList.find(a => a.Code == header.BillToAddress_Code) || null;
        const shipToAddr = G_BillToShipToList.find(a => a.Code == header.ShipToAddress_Code) || null;

        let detailRows = '';
        details.forEach((det, idx) => {
            const itemName = (G_ItemMasterList.find(i => i.Code == det.ItemMaster_Code) || {}).Name || '';
            const uomName = (G_UOMMasterList.find(u => u.Code == det.UOMMaster_Code) || {}).Name || '';
            detailRows += `<tr>
                <td class="text-center">${idx + 1}</td>
                <td>${itemName}</td>
                <td>${det.Specification || ''}</td>
                <td class="text-center">${uomName}</td>
                <td class="text-center">${det.GSTRate || 0}%</td>
                <td class="text-end">${det.QtyMT || 0}</td>
                <td class="text-end">${parseFloat(det.Rate || 0).toFixed(2)}</td>
                <td class="text-end">${parseFloat(det.Amount || 0).toFixed(2)}</td>
            </tr>`;
        });

        const siteRepObj = G_SiteRepList.find(function (r) { return r.Code == header.SiteRepresentativeMaster_Code; }) || null;
        let siteRepViewHtml = '';
        if (siteRepObj) {
            const srMobile = siteRepObj.Mobile || siteRepObj.MobileNo || '';
            let sr = '<div class="row g-2 mt-1">';
            if (siteRepObj.Name)  sr += '<div class="col-md-4" style="font-size:0.8rem;"><i class="fa fa-user me-1 text-muted"></i><b>Name:</b> ' + siteRepObj.Name + '</div>';
            if (srMobile)         sr += '<div class="col-md-4" style="font-size:0.8rem;"><i class="fa fa-phone me-1 text-muted"></i><b>Mobile:</b> ' + srMobile + '</div>';
            if (siteRepObj.Email) sr += '<div class="col-md-4" style="font-size:0.8rem;"><i class="fa fa-envelope me-1 text-muted"></i><b>Email:</b> ' + siteRepObj.Email + '</div>';
            sr += '</div>';
            siteRepViewHtml = '<div class="row g-2 mb-3"><div class="col-12"><div class="bts-view-panel" style="border-color:#d1fae5;background:#f0fdf4;"><div class="bts-vp-title" style="color:#059669;"><i class="fa fa-user-tie me-1"></i>Site Representative</div>' + sr + '</div></div></div>';
        }

        $('#modalViewPOBody').html(`
            <div class="row g-2 mb-3">
                <div class="col-md-6">
                    <table class="table table-sm table-borderless">
                        <tr><td class="fw-bold" style="width:45%">PO Number</td><td>${header.PONo || ''}</td></tr>
                        <tr><td class="fw-bold">PO Date</td><td>${FormatDateDisplay(header.PODate)}</td></tr>
                        <tr><td class="fw-bold">Vendor</td><td>${vendorName}</td></tr>
                        <tr><td class="fw-bold">Ref No</td><td>${header.RefNo || '-'}</td></tr>
                        <tr><td class="fw-bold">Ref Date</td><td>${header.RefDate ? FormatDateDisplay(header.RefDate) : '-'}</td></tr>
                        <tr><td class="fw-bold">Payment Terms</td><td>${paymentTermsName || '-'}</td></tr>
                        <tr><td class="fw-bold">Remarks</td><td>${header.Remarks || '-'}</td></tr>
                        <tr><td class="fw-bold">Create By:</td><td>${header.CreatedByName || '-'}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <table class="table table-sm table-borderless">
                        <tr><td class="fw-bold" style="width:45%">Against Project</td><td>${againstProject ? 'Yes' : 'No'}</td></tr>
                        ${againstProject ? `<tr><td class="fw-bold">Project</td><td>${header.ProjectName || '-'}</td></tr>
                        <tr><td class="fw-bold">Sub Project</td><td>${header.SubProjectName || '-'}</td></tr>` : ''}
                        <tr><td class="fw-bold">Taxable Amount</td><td class="text-end">${parseFloat(header.TotalAssValue || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">${header.OtherChargesDesp || 'Other Charges'}</td><td class="text-end">${parseFloat(header.OtherChargesAmount || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">Freight</td><td class="text-end">${parseFloat(header.FreightAmount || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">Total GST</td><td class="text-end">${parseFloat(header.TaxAmount || 0).toFixed(2)}</td></tr>
                        <tr><td class="fw-bold">Round Off</td><td class="text-end">${parseFloat(header.RoundOff || 0).toFixed(2)}</td></tr>
                        <tr style="background:#667eea;color:#fff;border-radius:6px;"><td class="fw-bold">Total PO Amount</td><td class="text-end fw-bold">${parseFloat(header.TotalPOAmount || 0).toFixed(2)}</td></tr>
                    </table>
                </div>
            </div>
            <div class="row g-2 mb-3">
                <div class="col-md-6">
                    <div class="bts-view-panel">
                        <div class="bts-vp-title"><i class="fa fa-file-invoice me-1"></i>Bill To</div>
                        ${billToAddr
                            ? `<div class="bts-vp-name">${billToAddr.Name}</div>
                               <div class="bts-vp-disp">${billToAddr.DisplayName}</div>
                               <div class="bts-vp-addr"><i class="fa fa-map-marker-alt me-1 text-muted" style="font-size:0.73rem;"></i>${billToAddr.Address}</div>
                               <div class="bts-vp-gst"><i class="fa fa-id-card me-1" style="font-size:0.73rem;"></i>GST: ${billToAddr.GSTNo}</div>`
                            : '<span style="color:#94a3b8;font-size:0.78rem;"><i class="fa fa-minus me-1"></i>Not specified</span>'}
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="bts-view-panel">
                        <div class="bts-vp-title"><i class="fa fa-shipping-fast me-1"></i>Ship To</div>
                        ${shipToAddr
                            ? `<div class="bts-vp-name">${shipToAddr.Name}</div>
                               <div class="bts-vp-disp">${shipToAddr.DisplayName}</div>
                               <div class="bts-vp-addr"><i class="fa fa-map-marker-alt me-1 text-muted" style="font-size:0.73rem;"></i>${shipToAddr.Address}</div>
                               <div class="bts-vp-gst"><i class="fa fa-id-card me-1" style="font-size:0.73rem;"></i>GST: ${shipToAddr.GSTNo}</div>`
                            : '<span style="color:#94a3b8;font-size:0.78rem;"><i class="fa fa-minus me-1"></i>Not specified</span>'}
                    </div>
                </div>
            </div>
            ${siteRepViewHtml}
            ${BuildApprovalFlowHTML(approvalFlow)}
            <div class="table-responsive">
                <table class="table table-sm table-bordered">
                    <thead style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;">
                        <tr>
                            <th class="text-center">#</th>
                            <th>Item Name</th>
                            <th>Specification</th>
                            <th class="text-center">UOM</th>
                            <th class="text-center">GST Rate</th>
                            <th class="text-end">Qty</th>
                            <th class="text-end">Rate</th>
                            <th class="text-end">Value</th>
                        </tr>
                    </thead>
                    <tbody>${detailRows}</tbody>
                </table>
            </div>
        `);
        $('#modalViewPO').modal('show');
        }).catch(err => {
            toastr.error('Error loading PO details.');
            console.error(err);
        });
    });
};

// ─── DELETE PO ────────────────────────────────────────────────────────────────

window.InitDeletePO = function (code, poNo) {
    $('#modalHfDeleteCode').val(code);
    $('#modalDeletePONo').text(poNo);
    $('#modalTxtDeleteReason').val('');
    $('#modalDeletePO').modal('show');
};

window.ConfirmDeletePO = function () {
    const code = $('#modalHfDeleteCode').val();
    const reason = $('#modalTxtDeleteReason').val().trim();
    if (!reason) { toastr.warning('Please enter reason for delete.'); return; }

    const ModuleName = $('#ERPHeading').text().trim();
    const ShowMsg = 'Y';
    const FinYear = BizSolHelperFunction.getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, 'Delete', ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg);
            return;
        }

        PurchaseOrderStoreService.DeletePurchaseOrderStore(code, GetUserCode(), reason).then(function (res) {
            if (res && res.Status === 'Y') {
                toastr.success(res.Msg || 'PO deleted successfully.');
                $('#modalDeletePO').modal('hide');
                ShowPOListGrid();
                LoadPOStatCounts();
            } else {
                toastr.error(res ? res.Msg : 'Failed to delete PO.');
            }
        }).catch(err => {
            toastr.error('Error deleting PO.');
            console.error(err);
        });
    });
};

// ─── CANCEL PO ───────────────────────────────────────────────────────────────

window.InitCancelPO = function (code, poNo) {
    $('#modalHfCancelCode').val(code);
    $('#modalCancelPONo').text(poNo);
    $('#modalCancelPO').modal('show');
};

window.ConfirmCancelPO = function () {
    const code = $('#modalHfCancelCode').val();

    const ModuleName = $('#ERPHeading').text().trim();
    const ShowMsg    = 'Y';
    const FinYear    = BizSolHelperFunction.getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, 'Cancel', ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg);
            return;
        }

        PurchaseOrderStoreService.CancelPurchaseOrderStore(code, GetUserCode()).then(function (res) {
            if (res && res.Status === 'Y') {
                toastr.success(res.Msg || 'PO cancelled successfully.');
                $('#modalCancelPO').modal('hide');
                ShowPOListGrid();
                LoadPOStatCounts();
            } else {
                toastr.error(res ? res.Msg : 'Failed to cancel PO.');
            }
        }).catch(function (err) {
            toastr.error('Error cancelling PO.');
            console.error(err);
        });
    });
};

// ─── MOBILE ITEM ENTRY MODAL ─────────────────────────────────────────────────

function OpenMobileItemModal(rowId) {
    G_MobileItemEditRowId = rowId;

    // Populate item dropdown
    let itemHtml = '<option value="">-- Select Item --</option>';
    G_ItemMasterList.forEach(i => { itemHtml += `<option value="${i.Code}">${i.Name}</option>`; });
    $('#mobileItemDdlItem').html(itemHtml);

    // Populate UOM dropdown
    let uomHtml = '<option value="">UOM</option>';
    G_UOMMasterList.forEach(u => { uomHtml += `<option value="${u.Code}">${u.Name}</option>`; });
    $('#mobileItemDdlUOM').html(uomHtml);

    // Auto-fill UOM and GST when item changes
    $('#mobileItemDdlItem').off('change').on('change', function () {
        const code = $(this).val();
        const item = G_ItemMasterList.find(i => String(i.Code) === String(code));
        if (item && item.UOM_Code) $('#mobileItemDdlUOM').val(item.UOM_Code);
        if (item && item.GSTRate !== undefined) $('#mobileItemTxtGST').val(item.GSTRate || 0);
        $('#mobileItemTxtSpec').val(item ? (item.ItemSpecificationDesp || '') : '');
        MobileCalcValue();
    });

    if (rowId === null) {
        // New item
        $('#mobileItemModalTitle').text('Add Item');
        $('#mobileItemModalBtnTxt').text('Add Item');
        $('#mobileItemDdlItem').val('');
        $('#mobileItemDdlUOM').val('');
        $('#mobileItemTxtGST').val(0);
        $('#mobileItemTxtQty').val(0);
        $('#mobileItemTxtRate').val(0);
        $('#mobileItemTxtSpec').val('');
        $('#mobileItemCalcValue').text('0.00');
    } else {
        // Edit existing row
        $('#mobileItemModalTitle').text('Edit Item');
        $('#mobileItemModalBtnTxt').text('Update Item');
        $('#mobileItemDdlItem').val($(`#frmDdlItem_${rowId}`).val());
        $('#mobileItemDdlUOM').val($(`#frmDdlUOM_${rowId}`).val());
        $('#mobileItemTxtGST').val($(`#frmTxtGSTRate_${rowId}`).val());
        $('#mobileItemTxtQty').val($(`#frmTxtQty_${rowId}`).val());
        $('#mobileItemTxtRate').val($(`#frmTxtRate_${rowId}`).val());
        $('#mobileItemTxtSpec').val($(`#frmTxtSpecification_${rowId}`).val());
        MobileCalcValue();
    }

    $('#modalMobileItemEntry').modal('show');
}

function MobileCalcValue() {
    const qty = parseFloat($('#mobileItemTxtQty').val()) || 0;
    const rate = parseFloat($('#mobileItemTxtRate').val()) || 0;
    $('#mobileItemCalcValue').text((qty * rate).toFixed(2));
}

function MobileItemModalConfirm() {
    const itemCode = $('#mobileItemDdlItem').val();
    const qty = parseFloat($('#mobileItemTxtQty').val()) || 0;

    if (!itemCode) { toastr.warning('Please select an item.'); return; }
    if (qty <= 0) { toastr.warning('Qty must be greater than 0.'); return; }

    // ── Tolerance validation ───────────────────────────────────────────────────
    const mobileItem   = G_ItemMasterList.find(i => String(i.Code) === String(itemCode));
    if (mobileItem) {
        const mbBaseQty  = parseFloat(mobileItem.QtyRequired  || mobileItem.Qty          || 0);
        const mbQtyTol   = parseFloat(mobileItem.QtyTolerance || mobileItem.Tolerance     || 0);
        const mbBaseRate = parseFloat(mobileItem.Rate         || mobileItem.EstimatedRate || 0);
        const mbRateTol  = parseFloat(mobileItem.RateTolerance                             || 0);
        const mobileRate = parseFloat($('#mobileItemTxtRate').val()) || 0;
        const mbMaxQty   = (mbBaseQty  > 0 && mbQtyTol  > 0) ? parseFloat((mbBaseQty  * (1 + mbQtyTol  / 100)).toFixed(3)) : 0;
        const mbMaxRate  = (mbBaseRate > 0 && mbRateTol > 0) ? parseFloat((mbBaseRate * (1 + mbRateTol / 100)).toFixed(2)) : 0;
        if (mbMaxQty > 0 && qty > mbMaxQty) {
            toastr.warning(`Qty exceeds the ${mbQtyTol}% tolerance. Maximum allowed Qty is ${mbMaxQty}.`);
            $('#mobileItemTxtQty').val(mbMaxQty);
            MobileCalcValue();
            return;
        }
        if (mbMaxRate > 0 && mobileRate > mbMaxRate) {
            toastr.warning(`Rate exceeds the ${mbRateTol}% tolerance. Maximum allowed Rate is ${mbMaxRate}.`);
            $('#mobileItemTxtRate').val(mbMaxRate);
            MobileCalcValue();
            return;
        }
    }

    const uomCode = $('#mobileItemDdlUOM').val();
    const gst = parseFloat($('#mobileItemTxtGST').val()) || 0;
    const rate = parseFloat($('#mobileItemTxtRate').val()) || 0;
    const value = (qty * rate).toFixed(2);
    const spec = $('#mobileItemTxtSpec').val() || '';

    if (G_MobileItemEditRowId === null) {
        // Add new row to the hidden table
        G_ItemRowCount++;
        const rowId = G_ItemRowCount;
        const itemSelect = BuildItemSelect(rowId, itemCode);
        const uomSelect = BuildUOMSelect(rowId, uomCode);
        const row = `<tr id="itemRow_${rowId}">
            <td class="text-center fw-bold">${rowId}</td>
            <td>${itemSelect}</td>
            <td><input type="text" id="frmTxtSpecification_${rowId}" class="form-control form-control-sm" placeholder="Specification…" value="${spec.replace(/"/g, '&quot;')}" /></td>
            <td>${uomSelect}</td>
            <td><input type="number" id="frmTxtGSTRate_${rowId}" class="form-control form-control-sm" value="${gst}" min="0" max="100" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
            <td><input type="number" id="frmTxtQty_${rowId}" class="form-control form-control-sm" value="${qty}" min="0" step="0.001" onchange="CalcRowValue(${rowId})" /></td>
            <td><input type="number" id="frmTxtRate_${rowId}" class="form-control form-control-sm" value="${rate}" min="0" step="0.01" onchange="CalcRowValue(${rowId})" /></td>
            <td><input type="number" id="frmTxtValue_${rowId}" class="form-control form-control-sm" value="${value}" readonly /></td>
            <td class="text-center">
                <input type="hidden" id="frmHfDetailCode_${rowId}" value="0" />
                <input type="hidden" id="frmHfBaseQty_${rowId}" value="0" />
                <input type="hidden" id="frmHfQtyTolerance_${rowId}" value="0" />
                <input type="hidden" id="frmHfBaseRate_${rowId}" value="0" />
                <input type="hidden" id="frmHfRateTolerance_${rowId}" value="0" />
                <button type="button" class="del-row-btn" title="Remove" onclick="DeleteItemRow(${rowId})"><i class="fa fa-times-circle"></i></button>
            </td>
        </tr>`;
        $('#tblPOItemsBody').append(row);
        const newTolItem = G_ItemMasterList.find(i => String(i.Code) === String(itemCode));
        ApplyToleranceToRow(rowId, newTolItem || null);
        RenumberRows();
    } else {
        // Update existing row in the hidden table
        const rowId = G_MobileItemEditRowId;
        $(`#frmDdlItem_${rowId}`).val(itemCode);
        $(`#frmDdlUOM_${rowId}`).val(uomCode);
        $(`#frmTxtGSTRate_${rowId}`).val(gst);
        $(`#frmTxtQty_${rowId}`).val(qty);
        $(`#frmTxtRate_${rowId}`).val(rate);
        $(`#frmTxtValue_${rowId}`).val(value);
        $(`#frmTxtSpecification_${rowId}`).val(spec);
    }

    CalcTotals();
    RenderMobileItemCards();
    $('#modalMobileItemEntry').modal('hide');
}

function RenderMobileItemCards() {
    const container = $('#mobileItemCards');
    container.empty();

    const rows = $('#tblPOItemsBody tr');
    if (rows.length === 0) {
        container.html('<div class="mobile-item-empty"><i class="fa fa-box-open fa-2x d-block mb-2"></i>No items added yet.<br>Tap "+ Add Item" to start.</div>');
        return;
    }

    rows.each(function (index) {
        const rowId = $(this).attr('id').replace('itemRow_', '');
        const itemName = $(`#frmDdlItem_${rowId} option:selected`).text();
        const uomName = $(`#frmDdlUOM_${rowId} option:selected`).text();
        const gst = $(`#frmTxtGSTRate_${rowId}`).val();
        const qty = $(`#frmTxtQty_${rowId}`).val();
        const rate = parseFloat($(`#frmTxtRate_${rowId}`).val() || 0).toFixed(2);
        const value = parseFloat($(`#frmTxtValue_${rowId}`).val() || 0).toFixed(2);
        const spec = $(`#frmTxtSpecification_${rowId}`).val() || '';

        container.append(`
            <div class="mobile-item-card">
                <div class="item-card-header">
                    <span class="item-card-num">${index + 1}</span>
                    <span class="item-card-name">${itemName}</span>
                    <div class="item-card-actions">
                        <button type="button" class="item-card-edit-btn" onclick="OpenMobileItemModal(${rowId})" title="Edit"><i class="fa fa-pencil-alt"></i></button>
                        <button type="button" class="item-card-del-btn" onclick="DeleteItemRow(${rowId})" title="Delete"><i class="fa fa-trash"></i></button>
                    </div>
                </div>
                <div class="item-card-details">
                    <span class="item-card-detail"><i class="fa fa-ruler me-1"></i>${uomName}</span>
                    <span class="item-card-detail"><i class="fa fa-percent me-1"></i>GST: ${gst}%</span>
                    <span class="item-card-detail"><i class="fa fa-sort-amount-up me-1"></i>Qty: ${qty}</span>
                    <span class="item-card-detail"><i class="fa fa-tag me-1"></i>Rate: ${rate}</span>
                    <span class="item-card-detail item-card-value"><i class="fa fa-coins me-1"></i>Value: ${value}</span>
                    ${spec ? `<span class="item-card-detail" style="width:100%;"><i class="fa fa-align-left me-1"></i>${spec}</span>` : ''}
                </div>
            </div>`);
    });
}

// ─── PAYMENT TERMS QUICK-ADD ────────────────────────────────────────────────

window.OpenAddPaymentTermsModal = function () {
    
    $('#ptTxtDescription').val('');
    $('#modalAddPaymentTerms').modal('show');
};

window.SavePaymentTerms = function () {
    const Desp = $('#ptTxtDescription').val().trim();
    if (!Desp) { toastr.warning('Please enter Payment Terms Description.'); return; }

    const payload = JSON.stringify([
        {
            code: 0,
            desp: Desp,
            databaseLocation_Code: 0,
            advPaymentApplicable: "N",
            advancePayment: 0,
            defaultForOrder: "N",
            isActive: "Y",
            userMaster_Code: 0
        }
    ]);

    PurchaseOrderStoreService.SavePaymentTerms(payload).then(function (res) {
        if (res && res.Status === 'Y') {
            toastr.success(res.Msg || 'Payment Terms saved successfully.');
            $('#modalAddPaymentTerms').modal('hide');
            const newCode = res.Code || res.NewCode || null;
            LoadPaymentTermsDropdown(newCode);
        } else {
            toastr.error(res ? res.Msg : 'Failed to save Payment Terms.');
        }
    }).catch(err => {
        toastr.error('Error saving Payment Terms.');
        console.error(err);
    });
};

// ─── NUMBER TO WORDS ──────────────────────────────────────────────────────────

function NumberToWords(amount) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                  'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function twoD(n) {
        if (n < 20) return ones[n];
        return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    }
    function threeD(n) {
        if (n >= 100) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoD(n % 100) : '');
        return twoD(n);
    }
    let n = Math.floor(Math.abs(amount));
    if (n === 0) return 'Zero Rupees Only';
    let w = '';
    if (n >= 10000000) { w += threeD(Math.floor(n / 10000000)) + ' Crore ';    n %= 10000000; }
    if (n >= 100000)   { w += twoD(Math.floor(n / 100000))     + ' Lakh ';     n %= 100000;   }
    if (n >= 1000)     { w += twoD(Math.floor(n / 1000))       + ' Thousand '; n %= 1000;     }
    if (n >= 100)      { w += ones[Math.floor(n / 100)]         + ' Hundred ';  n %= 100;      }
    if (n > 0)         { w += twoD(n); }
    return w.trim() + ' Rupees Only';
}

// ─── FORMAT INDIAN CURRENCY ─────────────────────────────────────────────────────

function FormatIndianCurrency(num) {
    const n = parseFloat(num || 0);
    if (isNaN(n)) return '0.00';
    const parts = n.toFixed(2).split('.');
    const intPart = parts[0];
    const decPart = parts[1];
    const lastThree = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const formatted = remaining.length > 0
        ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
        : lastThree;
    return formatted + '.' + decPart;
}

// ─── PRINT PO ───────────────────────────────────────────────────────────────────

function PrintPO(code, mode) {
    PurchaseOrderStoreService.GetPurchaseOrderStoreById(code).then(function (res) {
        if (!res) { toastr.error('PO not found.'); return; }

        const header  = res[0][0];
        const details = res[1] || [];

        // ── Resolve related data ──────────────────────────────────────────────────
        const vendorObj    = G_VendorList.find(v => v.Code == header.VendorMaster_Code) || {};
        const payTermsName = (G_PaymentTermsList.find(p => p.Code == header.PaymentTermsMaster_Code) || {}).Name || '';
        const billToAddr   = G_BillToShipToList.find(a => a.Code == header.BillToAddress_Code)  || null;
        const shipToAddr   = G_BillToShipToList.find(a => a.Code == header.ShipToAddress_Code)  || null;
        const againstProj  = header.IsPOAgainstProject === 'Y';
        const workTypeName = header.WorkType || header.WorkTypeName || '';
        const docTitle     = workTypeName.toLowerCase().includes('goods') ? 'PURCHASE ORDER' : 'WORK ORDER';

        // ── Company info from session ──────────────────────────────────────────
        let companyName = '', companyAddr = '', companyPhone = '', companyEmail = '', companyWeb = '', companyGST = '';
        try {
            //const ud = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
            const ud = res[3]||[];
            if (ud && ud[0]) {
                companyName  = ud[0].CompanyName    || ud[0].CompanyNameForShow || '';
                companyAddr  = ud[0].CompanyAddress || '';
                companyPhone = ud[0].PhoneNo        || ud[0].CompanyPhone       || '';
                companyEmail = ud[0].Email          || ud[0].CompanyEmail       || '';
                companyWeb   = ud[0].Website        || ud[0].CompanyWebsite     || '';
                companyGST   = ud[0].GSTIN          || ud[0].CompanyGSTIN       || '';
            }
        } catch (e) {}

        // ── Vendor info ───────────────────────────────────────────────────────────────
        const vName    = vendorObj.Name             || '';
        const vAddr    = vendorObj.Address          || vendorObj.VendorAddress || '';
        const vGSTIN   = vendorObj.GSTIN            || vendorObj.GSTINNo       || '';
        const vEmail   = vendorObj.Email            || '';
        const vContact = vendorObj.ContactPerson    || vendorObj.ContactPersonName || '';
        const vMobile  = vendorObj.Mobile           || vendorObj.PhoneNo        || '';
        const vBank    = vendorObj.BankName         || '';
        const vAcc     = vendorObj.AccountNo        || vendorObj.AccountNumber  || '';
        const vIFSC    = vendorObj.IFSCCode         || vendorObj.IFSC           || '';

        // ── Amounts ──────────────────────────────────────────────────────────────────
        const taxable   = parseFloat(header.TotalAssValue      || 0);
        const freight   = parseFloat(header.FreightAmount      || 0);
        const otherChg  = parseFloat(header.OtherChargesAmount || 0);
        const otherLbl  = header.OtherChargesDesp || 'Other Charges';
        const totalGST  = parseFloat(header.TaxAmount          || 0);
        const grandTot  = parseFloat(header.TotalPOAmount      || 0);
        const roundOff  = parseFloat(header.RoundOff           || 0);
        const subTotal  = taxable + freight + otherChg;
        const amtWords  = NumberToWords(Math.round(grandTot));
        const poDateStr = FormatDateDisplay(header.PODate);
        const refDateStr = header.RefDate ? FormatDateDisplay(header.RefDate) : '';
        const gstRates  = [...new Set(details.map(d => parseFloat(d.GSTRate || 0)).filter(r => r > 0))];
        const gstLabel  = gstRates.length === 1 ? (gstRates[0] + '% GST') : 'Total GST';

        // ── Build HTML sections ───────────────────────────────────────────────
        let hdrContact = '';
        if (companyPhone) hdrContact += '&#9990;&nbsp;' + companyPhone + '<br>';
        if (companyEmail) hdrContact += '&#9993;&nbsp;' + companyEmail + '<br>';
        if (companyWeb)   hdrContact += '&#127760;&nbsp;' + companyWeb + '<br>';
        if (companyGST)   hdrContact += 'GSTIN:&nbsp;' + companyGST;

        let supplierHtml = '<div class="info-name">' + vName + '</div>';
        if (vAddr)    supplierHtml += '<div class="info-field"><b>ADDRESS : </b>' + vAddr    + '</div>';
        if (vGSTIN)   supplierHtml += '<div class="info-field"><b>GSTIN : </b>'   + vGSTIN   + '</div>';
        if (vEmail)   supplierHtml += '<div class="info-field"><b>Email : </b>'   + vEmail   + '</div>';
        if (vContact) supplierHtml += '<div class="info-field"><b>Contact Person: </b>' + vContact + '</div>';
        if (vMobile)  supplierHtml += '<div class="info-field"><b>Mobile : </b>'  + vMobile  + '</div>';
        if (vBank)    supplierHtml += '<div class="info-field"><b>Bank : </b>'    + vBank
            + (vAcc  ? ' &bull; A/C: ' + vAcc   : '')
            + (vIFSC ? ' &bull; IFSC: ' + vIFSC : '') + '</div>';

        let billToHtml = '<span style="color:#999;font-size:7.5pt;">Not specified</span>';
        if (billToAddr) {
            billToHtml = '<div class="info-name">' + (billToAddr.Name || '') + '</div>';
            if (billToAddr.DisplayName) billToHtml += '<div class="info-field">' + billToAddr.DisplayName + '</div>';
            if (billToAddr.Address)     billToHtml += '<div class="info-field"><b>ADDRESS : </b>' + billToAddr.Address + '</div>';
            if (billToAddr.GSTNo)       billToHtml += '<div class="info-field"><b>GSTIN: </b>' + billToAddr.GSTNo + '</div>';
        }

        let shipToSection = '';
        if (shipToAddr) {
            let st = '<div class="info-name">' + (shipToAddr.Name || '') + '</div>';
            if (shipToAddr.DisplayName) st += '<div class="info-field"><b>Site Name : </b>' + shipToAddr.DisplayName + '</div>';
            if (shipToAddr.Address)     st += '<div class="info-field"><b>ADDRESS : </b>' + shipToAddr.Address + '</div>';
            if (shipToAddr.GSTNo)       st += '<div class="info-field"><b>GSTIN : </b>' + shipToAddr.GSTNo + '</div>';
            shipToSection = '<div class="info-row"><div class="info-cell full"><div class="info-label">Ship To :</div>' + st + '</div></div>';
        }

        const siteRepPrint = G_SiteRepList.find(function (r) { return r.Code == header.SiteRepresentativeMaster_Code; }) || null;
        let siteRepSection = '';
        const srName   = siteRepPrint ? (siteRepPrint.Name                              || '') : '';
        const srMobile = siteRepPrint ? (siteRepPrint.Mobile || siteRepPrint.MobileNo   || '') : '';
        const srEmail  = siteRepPrint ? (siteRepPrint.Email                              || '') : '';
        if (srName || srMobile || srEmail) {
            let sr = '';
            if (srName)   sr += '<span style="margin-right:14px;"><b>Name : </b>' + srName + '</span>';
            if (srMobile) sr += '<span style="margin-right:14px;"><b>Mobile : </b>' + srMobile + '</span>';
            if (srEmail)  sr += '<span><b>Email : </b>' + srEmail + '</span>';
            siteRepSection = '<div class="info-row"><div class="info-cell full"><div class="info-label">Site Representative :</div><div class="info-field" style="padding-top:2px;">' + sr + '</div></div></div>';
        }

        let itemRows = '';
        details.forEach(function (det, idx) {
            const itm     = G_ItemMasterList.find(i => i.Code == det.ItemMaster_Code) || {};
            const iName   = itm.Name || '';
            const hsnCode = itm.HSNCode || itm.HSN_Code || itm.HSNMaster_Code || '';
            const uName   = (G_UOMMasterList.find(u => u.Code == det.UOMMaster_Code) || {}).Name || '';
            const amt     = parseFloat(det.Amount || 0);
            const spec    = det.Specification || '';
            itemRows += '<tr>'
                + '<td class="tc">' + (idx + 1) + '</td>'
                + '<td>' + iName + (spec ? '<br><span style="font-size:7pt;color:#555;">' + spec + '</span>' : '') + '</td>'
                + '<td class="tc">' + hsnCode + '</td>'
                + '<td class="tc">' + uName   + '</td>'
                + '<td class="tr">' + parseFloat(det.QtyMT || 0) + '</td>'
                + '<td class="tr">&#8377;' + FormatIndianCurrency(det.Rate || 0) + '</td>'
                + '<td class="tr">&#8377;' + FormatIndianCurrency(amt) + '</td>'
                + '</tr>';
        });

        let totalsHtml = '';
        totalsHtml += '<tr><td class="lbl">Total Amount Before Tax</td><td class="val">&#8377; ' + FormatIndianCurrency(taxable)  + '</td></tr>';
        if (freight)  totalsHtml += '<tr><td class="lbl">Freight</td><td class="val">&#8377; ' + FormatIndianCurrency(freight)  + '</td></tr>';
        if (otherChg) totalsHtml += '<tr><td class="lbl">' + otherLbl + '</td><td class="val">&#8377; ' + FormatIndianCurrency(otherChg) + '</td></tr>';
        totalsHtml += '<tr><td class="lbl">Total Amount</td><td class="val">&#8377; ' + FormatIndianCurrency(subTotal) + '</td></tr>';
        totalsHtml += '<tr><td class="lbl">' + gstLabel + '</td><td class="val">&#8377; ' + FormatIndianCurrency(totalGST) + '</td></tr>';
        if (roundOff) totalsHtml += '<tr><td class="lbl">Round Off</td><td class="val">&#8377; ' + FormatIndianCurrency(roundOff) + '</td></tr>';
        totalsHtml += '<tr class="grand"><td class="lbl">Total</td><td class="val">&#8377; ' + FormatIndianCurrency(grandTot) + '</td></tr>';

        const ptHtml = payTermsName
            ? '<div class="pt-box"><b>Payment Terms :-</b><br>&bull;&nbsp;' + payTermsName + '</div>'
            : '';

        let nowParts = [];
        if (againstProj && header.ProjectName)    nowParts.push(header.ProjectName);
        if (againstProj && header.SubProjectName) nowParts.push(header.SubProjectName);
        const sectionBand = againstProj
            ? 'ASSIGNMENT DETAILS' + (nowParts.length ? ' &bull; Nature of Work : ' + nowParts.join(' &mdash; ') : '')
            : 'ITEM DETAILS';

        // ── Compose full print document ──────────────────────────────────────────
        const css = '@page{size:A4 portrait;margin:8mm 10mm 22mm 10mm;}'
            + '*{box-sizing:border-box;margin:0;padding:0;}'
            + 'body{font-family:Arial,Helvetica,sans-serif;font-size:9pt;color:#000;background:#fff;}'
            + '.no-print{margin-bottom:5mm;}'
            + '@media print{.no-print{display:none!important;}}'
            + '.po-hdr{display:flex;align-items:flex-start;padding-bottom:5px;border-bottom:2.5px solid #000;margin-bottom:5px;}'
            + '.hdr-co{flex:1;}'
            + '.hdr-name{font-size:14pt;font-weight:800;color:#000;letter-spacing:0.3px;line-height:1.2;}'
            + '.hdr-tag{font-size:8pt;color:#000;letter-spacing:1px;margin-top:1px;font-weight:700;}'
            + '.hdr-contact{text-align:right;font-size:8pt;color:#000;line-height:1.75;min-width:155px;font-weight:600;}'
            + '.po-title{text-align:center;font-size:10pt;font-weight:800;border:2px solid #000;color:#000;padding:3px 0;margin:4px 0;letter-spacing:1.5px;}'
            + '.info-row{display:flex;border:1px solid #000;margin-bottom:4px;}'
            + '.info-cell{flex:1;padding:4px 7px;font-size:8.5pt;}'
            + '.info-cell+.info-cell{border-left:1px solid #000;}'
            + '.info-cell.full{flex:unset;width:100%;}'
            + '.info-label{font-weight:800;font-size:8pt;color:#000;border-bottom:1px dashed #555;padding-bottom:2px;margin-bottom:3px;}'
            + '.info-name{font-weight:800;font-size:9pt;margin-bottom:2px;color:#000;}'
            + '.info-field{font-size:8.5pt;margin-bottom:1px;color:#000;font-weight:600;}'
            + '.sec-band{border-top:2.5px solid #000;border-bottom:2.5px solid #000;font-weight:800;font-size:9.5pt;padding:4px 8px;margin:5px 0 4px;letter-spacing:0.6px;color:#000;text-transform:uppercase;}'
            + 'table.items{width:100%;border-collapse:collapse;}'
            + 'table.items th{background:#fff;color:#000;padding:5px;font-size:9pt;font-weight:800;border:1.5px solid #000;text-align:center;}'
            + 'table.items td{padding:4px 5px;font-size:9pt;color:#000;font-weight:600;border:1px solid #555;vertical-align:top;}'
            + 'table.items tbody tr:nth-child(even){background:#fff;}'
            + '.tc{text-align:center;}.tr{text-align:right;}'
            + '.tot-wrap{display:flex;justify-content:flex-end;margin-top:5px;}'
            + 'table.totals{border-collapse:collapse;min-width:290px;}'
            + 'table.totals td{padding:3px 8px;font-size:9pt;border:1px solid #555;color:#000;}'
            + 'table.totals .lbl{font-weight:700;color:#000;}'
            + 'table.totals .val{text-align:right;min-width:100px;font-weight:700;color:#000;}'
            + 'table.totals tr.grand td{border:1.5px solid #000;border-top:2px solid #000;font-weight:800;color:#000;}'
            + '.words-box{border:1.5px solid #555;padding:5px 9px;margin:5px 0;font-size:9pt;font-weight:600;color:#000;}'
            + '.pt-box{border:1.5px solid #555;padding:5px 9px;margin:5px 0;font-size:9pt;font-weight:600;color:#000;}'
            + '.sig-row{display:flex;gap:5px;margin-top:12px;}'
            + '.sig-box{flex:1;border:1.5px solid #000;padding:5px 4px;text-align:center;min-width:0;}'
            + '.sig-title{font-weight:800;font-size:8.5pt;color:#000;margin-bottom:28px;letter-spacing:0.02em;}'
            + '.sig-line{border-top:1px solid #000;margin:0 4px 3px;}'
            + '.sig-name{font-size:7.5pt;color:#000;font-weight:600;}'
            + '.footer-bar{position:fixed;bottom:0;left:0;right:0;text-align:center;font-size:10.5pt;padding:5px 10px;border-top:2.5px solid #000;color:#000;font-weight:700;background:#fff;letter-spacing:0.02em;}'

        const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + docTitle + ' - '
            + (header.PONo || '') + '</title><style>' + css + '</style></head><body>'
            // Toolbar (hidden on print)
            + '<div class="no-print" style="display:flex;gap:8px;padding:3px 0 6px;">'
            + '<button onclick="window.print()" style="background:#1a2a6c;color:#fff;border:none;padding:5px 16px;border-radius:5px;font-size:9pt;cursor:pointer;">&#128438;&nbsp;Print</button>'
            + '<button onclick="window.close()" style="background:#666;color:#fff;border:none;padding:5px 12px;border-radius:5px;font-size:9pt;cursor:pointer;">&#10005;&nbsp;Close</button>'
            + '</div>'
            // Header
            + '<div class="po-hdr">'
            + '<div class="hdr-co"><div class="hdr-name">' + (companyName || 'COMPANY NAME') + '</div><div class="hdr-tag">OPTIMISING STRUCTURAL SOLUTIONS</div></div>'
            + '<div class="hdr-contact">' + hdrContact + '</div>'
            + '</div>'
            // PO title bar
            + '<div class="po-title">' + docTitle + '</div>'
            // Date | PO No
            + '<div class="info-row">'
            + '<div class="info-cell">'
            + '<div class="info-field"><b>Date : </b>' + poDateStr + '</div>'
            + (refDateStr ? '<div class="info-field"><b>Ref Date : </b>' + refDateStr + '</div>' : '')
            + (header.RefNo ? '<div class="info-field"><b>Ref No : </b>' + (header.RefNo || '') + '</div>' : '')
            + '</div>'
            + '<div class="info-cell" style="text-align:right;">'
            + '<div class="info-field"><b>PO No : </b>' + (header.PONo || '') + '</div>'
            + (againstProj && header.ProjectName    ? '<div class="info-field"><b>Project : </b>' + header.ProjectName    + '</div>' : '')
            + (againstProj && header.SubProjectName ? '<div class="info-field"><b>Sub Project : </b>' + header.SubProjectName + '</div>' : '')
            + '</div></div>'
            // Supplier | Bill To
            + '<div class="info-row">'
            + '<div class="info-cell"><div class="info-label">Supplier Details :</div>' + supplierHtml + '</div>'
            + '<div class="info-cell"><div class="info-label">Bill To :</div>' + billToHtml + '</div>'
            + '</div>'
            // Ship To
            + shipToSection
            // Site Representative
            + siteRepSection
            // Section band
            + '<div class="sec-band">' + sectionBand + '</div>'
            // Items table
            + '<table class="items"><thead><tr>'
            + '<th style="width:28px;">S.No</th>'
            + '<th>Description</th>'
            + '<th style="width:58px;">HSN Code</th>'
            + '<th style="width:50px;">Unit</th>'
            + '<th style="width:52px;">Qty</th>'
            + '<th style="width:72px;">Rate</th>'
            + '<th style="width:80px;">Amount</th>'
            + '</tr></thead><tbody>' + itemRows + '</tbody></table>'
            // Totals
            + '<div class="tot-wrap"><table class="totals"><tbody>' + totalsHtml + '</tbody></table></div>'
            // Amount in words
            + '<div class="words-box"><b>Amount in Word : </b>' + amtWords + '</div>'
            // Payment Terms
            + ptHtml
            // Signatures
            + '<div class="sig-row">'
            + '<div class="sig-box"><div class="sig-title">P.M</div><div class="sig-line"></div><div class="sig-name">&nbsp;</div></div>'
            + '<div class="sig-box"><div class="sig-title">HOD</div><div class="sig-line"></div><div class="sig-name">&nbsp;</div></div>'
            + '<div class="sig-box"><div class="sig-title">Finance</div><div class="sig-line"></div><div class="sig-name">&nbsp;</div></div>'
            + '<div class="sig-box"><div class="sig-title">C.O</div><div class="sig-line"></div><div class="sig-name">&nbsp;</div></div>'
            + '<div class="sig-box"><div class="sig-title">C.E.O</div><div class="sig-line"></div><div class="sig-name">&nbsp;</div></div>'
            + '<div class="sig-box"><div class="sig-title">Management</div><div class="sig-line"></div><div class="sig-name">&nbsp;</div></div>'
            + '</div>'
            // Footer
            + (companyAddr ? '<div class="footer-bar">&#9679;&nbsp;' + companyAddr + '</div>' : '')
            + '</body></html>';

        const win = window.open('', '_blank', 'width=920,height=760,scrollbars=yes,resizable=yes');
        if (!win) { toastr.warning('Please allow popups for this site to use the print feature.'); return; }
        win.document.write(html);
        win.document.close();
        if (mode === 'print') {
            setTimeout(function () { win.focus(); win.print(); }, 600);
        }
    }).catch(function (err) {
        toastr.error('Error loading PO for print.');
        console.error(err);
    });
}

// ─── EXPOSE GLOBALS ─────────────────────────────────────────────────────────

window.ShowPOListGrid = ShowPOListGrid;
window.OpenPOForm = OpenPOForm;
window.ClosePOForm = ClosePOForm;
window.NavigateToPOApproval = NavigateToPOApproval;
window.AddItemRow = AddItemRow;
window.DeleteItemRow = DeleteItemRow;
window.OnItemChange = OnItemChange;
window.CalcRowValue = CalcRowValue;
window.CalcTotals = CalcTotals;
window.SavePO = SavePO;
window.ViewPO = ViewPO;
window.InitDeletePO = InitDeletePO;
window.ConfirmDeletePO = ConfirmDeletePO;
window.LoadSubProjects = LoadSubProjects;
window.ToggleProjectFields = ToggleProjectFields;
window.OpenMobileItemModal = OpenMobileItemModal;
window.MobileCalcValue = MobileCalcValue;
window.MobileItemModalConfirm = MobileItemModalConfirm;
window.RefreshAllItemDropdowns = RefreshAllItemDropdowns;
window.PrintPO = PrintPO;
window.InitCancelPO = InitCancelPO;
window.ConfirmCancelPO = ConfirmCancelPO;
window.OpenAddSiteRepModal = OpenAddSiteRepModal;
window.SaveSiteRepresentative = SaveSiteRepresentative;

