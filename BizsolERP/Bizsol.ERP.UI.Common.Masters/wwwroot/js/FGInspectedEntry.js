import { RawMaterialOfferService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_RawMaterialOfferService.js';
import { FGInspectedOfferService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_FGInspectedEntryService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

let G_RawMaterialDropDown = [];
let G_ClientOrderProjectData = [];
let G_RMClearanceDataList = [];
let G_TodayDate = [];
let G_StartOfMonth = [];
$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    GetRawMaterialDropDown();

    $('#btnRMClearanceShow').on("click", function () {
        GetFGInspectedOfferList();
    });
    $('#chkCompleted').on("change", function () {
        var IsChecked = $(this).is(':checked');
        if (IsChecked) {
            $('#btnVerifyall').hide();
        } else {
            $('#btnVerifyall').show();
        }
        GetFGInspectedOfferList();
    });
    setDefaultDateRange();
});
function setDefaultDateRange() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    function formatDate(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    $('#txtFromDate').val(formatDate(startOfMonth));
    $('#txtToDate').val(formatDate(today));
    G_TodayDate = formatDate(today);
    G_StartOfMonth = formatDate(startOfMonth);
    GetFGInspectedOfferList();
}
function GetRawMaterialDropDown() {
    RawMaterialOfferService.GetRawMaterialDropDown()
        .then(function (response) {
            G_RawMaterialDropDown = Array.isArray(response) ? response : [];
            bindClientOrderProjectDropdowns(G_RawMaterialDropDown);
        })
        .catch(function (error) {
            console.error('Error loading item master list:', error);
            G_RawMaterialDropDown = [];
        });
}
function bindClientOrderProjectDropdowns(list) {
    G_ClientOrderProjectData = Array.isArray(list) ? list : [];

    const $clientName = $('#txtClientName');
    const $orderNo = $('#txtOrderNo');
    const $projectNo = $('#txtProjectNo');

    const uniqueClients = [];
    const clientMap = new Map();

    (G_ClientOrderProjectData || []).forEach(function (item) {
        const code = item.Code || '';
        const accountDesp = item.AccountDesp || '';

        if (code && !clientMap.has(code)) {
            clientMap.set(code, accountDesp);
            uniqueClients.push({
                Code: code,
                AccountDesp: accountDesp
            });
        }
    });

    let clientOptions = '<option value="0">All</option>';
    uniqueClients.forEach(function (client) {
        clientOptions += `<option value="${client.Code}">${client.AccountDesp}</option>`;
    });
    $clientName.html(clientOptions);

    const uniqueOrders = [];
    const orderMap = new Map();

    (G_ClientOrderProjectData || []).forEach(function (item) {
        const orderNo = item.OrderNo || '';
        if (orderNo && !orderMap.has(orderNo)) {
            orderMap.set(orderNo, true);
            uniqueOrders.push({
                OrderNo: orderNo
            });
        }
    });

    let orderOptions = '<option value="All">All</option>';
    uniqueOrders.forEach(function (order) {
        orderOptions += `<option value="${order.OrderNo}">${order.OrderNo}</option>`;
    });
    $orderNo.html(orderOptions);

    // On load: Bind all projects in project dropdown
    const uniqueProjects = [];
    const projectMap = new Map();

    (G_ClientOrderProjectData || []).forEach(function (item) {
        const projectCode = item.ProjectCode || '';
        if (projectCode && !projectMap.has(projectCode)) {
            projectMap.set(projectCode, true);
            uniqueProjects.push({
                ProjectCode: projectCode
            });
        }
    });

    let projectOptions = '<option value="All">All</option>';
    uniqueProjects.forEach(function (project) {
        projectOptions += `<option value="${project.ProjectCode}">${project.ProjectCode}</option>`;
    });
    $projectNo.html(projectOptions);

    // Initialize select2 for all three dropdowns
    const select2Config = {
        width: '100%',
        dropdownParent: $(document.body)
    };

    try {
        if ($.fn.select2) {
            [$clientName, $orderNo, $projectNo].forEach(function ($dropdown) {
                $dropdown.select2(select2Config);

                if (typeof attachSelect2ScrollPrevention === 'function') {
                    attachSelect2ScrollPrevention($dropdown);
                } else {
                    function preventScroll() {
                        const scrollY = window.scrollY || window.pageYOffset;
                        document.documentElement.style.overflow = 'hidden';
                        document.body.style.position = 'fixed';
                        document.body.style.top = `-${scrollY}px`;
                        document.body.style.width = '100%';
                        document.body.setAttribute('data-scroll-y', scrollY);
                    }

                    function restoreScroll() {
                        const scrollY = document.body.getAttribute('data-scroll-y') || '0';
                        document.documentElement.style.overflow = '';
                        document.body.style.position = '';
                        document.body.style.top = '';
                        document.body.style.width = '';
                        window.scrollTo(0, parseInt(scrollY));
                        document.body.removeAttribute('data-scroll-y');
                    }

                    $dropdown.on('select2:open', preventScroll);
                    $dropdown.on('select2:close', restoreScroll);
                }
            });
        }
    } catch (e) {
        console.error('Error initializing select2:', e);
    }

    // Cascading: When client changes, update order dropdown
    $clientName.off('change.clientOrderProject').on('change.clientOrderProject', function () {
        const selectedClientCode = $(this).val();
        if (selectedClientCode === '0') {
            bindAllOrderDropdown();
            bindAllProjectDropdown();
        } else {
            updateOrderDropdown(selectedClientCode);
            // Only reset order if it's not already set to a valid value for this client
            const currentOrder = $orderNo.val();
            if (currentOrder === 'All' || currentOrder === '0' || !isOrderValidForClient(currentOrder, selectedClientCode)) {
                $orderNo.val('All').trigger('change.clientOrderProject');
            }
        }
    });

    // Cascading: When order changes, update project dropdown and auto-select client
    $orderNo.off('change.clientOrderProject').on('change.clientOrderProject', function () {
        const selectedOrderNo = $(this).val();
        if (selectedOrderNo === 'All' || selectedOrderNo === '0') {
            bindAllProjectDropdown();
        } else {
            // Find the client for this order and auto-select it (without triggering change)
            const orderItem = (G_ClientOrderProjectData || []).find(function (item) {
                return item.OrderNo == selectedOrderNo;
            });

            if (orderItem && orderItem.Code) {
                const currentClient = $clientName.val();
                if (currentClient !== orderItem.Code) {
                    // Set value without triggering change to avoid circular updates
                    $clientName.val(orderItem.Code);
                    // Update select2 display
                    if ($.fn.select2 && $clientName.hasClass('select2-hidden-accessible')) {
                        $clientName.trigger('change.select2');
                    }
                }
            }

            // Rebind project dropdown based on selected order
            updateProjectDropdownByOrder(selectedOrderNo);
        }
    });

    // Cascading: When project changes, auto-select order and client
    $projectNo.off('change.clientOrderProject').on('change.clientOrderProject', function () {
        const selectedProjectCode = $(this).val();
        if (selectedProjectCode === 'All' || selectedProjectCode === '0') {
            bindAllOrderDropdown();
        } else {
            // Find the order and client for this project
            const projectItem = (G_ClientOrderProjectData || []).find(function (item) {
                return item.ProjectCode == selectedProjectCode;
            });

            if (projectItem) {
                // Auto-select client (without triggering change to avoid circular updates)
                if (projectItem.Code) {
                    const currentClient = $clientName.val();
                    if (currentClient !== projectItem.Code) {
                        $clientName.val(projectItem.Code);
                        // Update select2 display
                        if ($.fn.select2 && $clientName.hasClass('select2-hidden-accessible')) {
                            $clientName.trigger('change.select2');
                        }
                    }
                }

                // Auto-select order and trigger its change to rebind project dropdown
                if (projectItem.OrderNo) {
                    const currentOrder = $orderNo.val();
                    if (currentOrder !== projectItem.OrderNo) {
                        $orderNo.val(projectItem.OrderNo);
                        // Update select2 display
                        if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
                            $orderNo.trigger('change.select2');
                        }
                        // Trigger our custom change handler
                        $orderNo.trigger('change.clientOrderProject');
                    } else {
                        // If order is already selected, just rebind project dropdown
                        updateProjectDropdownByOrder(projectItem.OrderNo);
                    }
                }
            }
        }
    });
}
function isOrderValidForClient(orderNo, clientCode) {
    return (G_ClientOrderProjectData || []).some(function (item) {
        return item.OrderNo == orderNo && item.Code == clientCode;
    });
}
function bindAllOrderDropdown() {
    const $orderNo = $('#txtOrderNo');
    const currentValue = $orderNo.val();
    const uniqueOrders = [];
    const orderMap = new Map();

    (G_ClientOrderProjectData || []).forEach(function (item) {
        const orderNo = item.OrderNo || '';
        if (orderNo && !orderMap.has(orderNo)) {
            orderMap.set(orderNo, true);
            uniqueOrders.push({
                OrderNo: orderNo
            });
        }
    });

    let orderOptions = '<option value="All">All</option>';
    uniqueOrders.forEach(function (order) {
        orderOptions += `<option value="${order.OrderNo}">${order.OrderNo}</option>`;
    });
    $orderNo.html(orderOptions);

    // Reinitialize select2 if it exists
    if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
        $orderNo.select2('destroy');
        $orderNo.select2({
            width: '100%',
            dropdownParent: $(document.body)
        });
    }

    // Restore previous value if it's still valid (without triggering change to avoid cascading)
    if (currentValue && uniqueOrders.some(function (o) { return o.OrderNo == currentValue; })) {
        $orderNo.val(currentValue);
        if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
            $orderNo.trigger('change.select2');
        }
    } else {
        $orderNo.val('All');
        if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
            $orderNo.trigger('change.select2');
        }
    }
}
function bindAllProjectDropdown() {
    const $projectNo = $('#txtProjectNo');
    const currentValue = $projectNo.val();
    const uniqueProjects = [];
    const projectMap = new Map();

    (G_ClientOrderProjectData || []).forEach(function (item) {
        const projectCode = item.ProjectCode || '';
        if (projectCode && !projectMap.has(projectCode)) {
            projectMap.set(projectCode, true);
            uniqueProjects.push({
                ProjectCode: projectCode
            });
        }
    });

    let projectOptions = '<option value="All">All</option>';
    uniqueProjects.forEach(function (project) {
        projectOptions += `<option value="${project.ProjectCode}">${project.ProjectCode}</option>`;
    });
    $projectNo.html(projectOptions);

    // Reinitialize select2 if it exists
    if ($.fn.select2 && $projectNo.hasClass('select2-hidden-accessible')) {
        $projectNo.select2('destroy');
        $projectNo.select2({
            width: '100%',
            dropdownParent: $(document.body)
        });
    }

    // Restore previous value if it's still valid (without triggering change to avoid cascading)
    if (currentValue && uniqueProjects.some(function (p) { return p.ProjectCode == currentValue; })) {
        $projectNo.val(currentValue);
        if ($.fn.select2 && $projectNo.hasClass('select2-hidden-accessible')) {
            $projectNo.trigger('change.select2');
        }
    } else {
        $projectNo.val('All');
        if ($.fn.select2 && $projectNo.hasClass('select2-hidden-accessible')) {
            $projectNo.trigger('change.select2');
        }
    }
}
function updateOrderDropdown(clientCode) {
    const $orderNo = $('#txtOrderNo');
    const currentValue = $orderNo.val();

    if (!clientCode || clientCode === '0') {
        bindAllOrderDropdown();
        return;
    }

    // Get unique orders for the selected client
    const uniqueOrders = [];
    const orderMap = new Map();

    (G_ClientOrderProjectData || []).forEach(function (item) {
        if (item.Code == clientCode) {
            const orderNo = item.OrderNo || '';
            if (orderNo && !orderMap.has(orderNo)) {
                orderMap.set(orderNo, true);
                uniqueOrders.push({
                    OrderNo: orderNo
                });
            }
        }
    });
    let orderOptions = '<option value="All">All</option>';
    uniqueOrders.forEach(function (order) {
        orderOptions += `<option value="${order.OrderNo}">${order.OrderNo}</option>`;
    });
    $orderNo.html(orderOptions);

    // Reinitialize select2 if it exists
    if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
        $orderNo.select2('destroy');
        $orderNo.select2({
            width: '100%',
            dropdownParent: $(document.body)
        });
    }

    // Restore previous value if it's still valid (without triggering change to avoid cascading)
    if (currentValue && uniqueOrders.some(function (o) { return o.OrderNo == currentValue; })) {
        $orderNo.val(currentValue);
        if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
            $orderNo.trigger('change.select2');
        }
    } else {
        $orderNo.val('All');
        if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
            $orderNo.trigger('change.select2');
        }
    }
}
function updateProjectDropdownByOrder(orderNo) {
    const $projectNo = $('#txtProjectNo');
    const currentValue = $projectNo.val();

    if (!orderNo || orderNo === '0' || orderNo === 'All') {
        bindAllProjectDropdown();
        return;
    }

    const uniqueProjects = [];
    const projectMap = new Map();

    (G_ClientOrderProjectData || []).forEach(function (item) {
        if (item.OrderNo == orderNo) {
            const projectCode = item.ProjectCode || '';
            if (projectCode && !projectMap.has(projectCode)) {
                projectMap.set(projectCode, true);
                uniqueProjects.push({
                    ProjectCode: projectCode
                });
            }
        }
    });

    let projectOptions = '<option value="All">All</option>';
    uniqueProjects.forEach(function (project) {
        projectOptions += `<option value="${project.ProjectCode}">${project.ProjectCode}</option>`;
    });
    $projectNo.html(projectOptions);

    // Reinitialize select2 if it exists
    if ($.fn.select2 && $projectNo.hasClass('select2-hidden-accessible')) {
        $projectNo.select2('destroy');
        $projectNo.select2({
            width: '100%',
            dropdownParent: $(document.body)
        });
    }

    // Restore previous value if it's still valid (without triggering change to avoid cascading)
    if (currentValue && uniqueProjects.some(function (p) { return p.ProjectCode == currentValue; })) {
        $projectNo.val(currentValue);
        if ($.fn.select2 && $projectNo.hasClass('select2-hidden-accessible')) {
            $projectNo.trigger('change.select2');
        }
    } else {
        $projectNo.val('All');
        if ($.fn.select2 && $projectNo.hasClass('select2-hidden-accessible')) {
            $projectNo.trigger('change.select2');
        }
    }
}
function Verify(Code) {
    var ModuleName = "RM Clearance Entry",
        OptionName = "Verify",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $('#dvVerifyRemark').data('Code', Code);
            $('#dvVerifyRemark').modal({ backdrop: 'static', keyboard: false });
            $('#dvVerifyRemark').modal('show');
            $('#hfVerifyCode').val(Code);
        }
    });
}
function GetFGInspectedOfferList() {
    let AccountMaster_Code = $('#txtClientName').val();
    let OrderNo = $('#txtOrderNo').val();
    let ProjectNo = $('#txtProjectNo').val();
    let FromDate = $('#txtFromDate').val();
    let ToDate = $('#txtToDate').val();
    let IsCompleted = $('#chkCompleted').is(':checked') == true ? 'Y' : 'N';

    if (AccountMaster_Code === null || AccountMaster_Code === undefined || AccountMaster_Code === '') {
        AccountMaster_Code = '0';
    }
    if (OrderNo === null || OrderNo === undefined || OrderNo === '') {
        OrderNo = 'All';
    }
    if (ProjectNo === null || ProjectNo === undefined || ProjectNo === '') {
        ProjectNo = 'All';
    }
    if (FromDate === null || FromDate === undefined || FromDate === '') {
        FromDate = G_StartOfMonth;
    }
    if (ToDate === null || ToDate === undefined || ToDate === '') {
        ToDate = G_TodayDate;
    }
    if (IsCompleted === null || IsCompleted === undefined || IsCompleted === '') {
        IsCompleted = 'N';
    }
    Showloader();
    FGInspectedOfferService.GetFGInspectedClearanceList(AccountMaster_Code, OrderNo, ProjectNo, FromDate, ToDate, IsCompleted).then(function (response) {
        HideLoader();
        if (response && response.length > 0) {
            $('#dvGrid').show();
            G_RMClearanceDataList = response;
            let StringFilterColumn = [];
            const NumericFilterColumn = ["Entry No"];
            const DateFilterColumn = ["Entry Date", "Inspection Date"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            let hiddenColumns = [];
            if (IsCompleted == 'N') {
                hiddenColumns = ["Code", "Thickness_Code", "Grade_Code", "RMInspectionRequestMaster_Code", "IsInspected", "Status", "Verify/Rejected By", "Verify/Rejected On", "Remark"];
                StringFilterColumn = ["Inspection Location", "Client Name", "Order No", "Project No", "Mark No", "Thickness", "Grade", "IdentificationNo", "Location of Coil"];

            } else {
                hiddenColumns = ["Code", "Thickness_Code", "Grade_Code", "RMInspectionRequestMaster_Code", "IsInspected",];
                StringFilterColumn = ["Inspection Location", "Client Name", "Order No", "Project No", "Mark No", "Thickness", "Grade", "IdentificationNo", "Location of Coil", "Status"];

            }
            const ColumnAlignment = {
                'S.No.': 'center;width:10px',
                "Entry Date": 'center',
                "Inspection Date": 'center',
                "Entry No": 'center',
                'P.O.(PCS)': 'right;',
                'Bal Qty for Inspection': 'right;',
                'Offer Qty': 'right;',
                'Is Inspected': 'center;'
                		
            };
            const updatedResponse = response.map((item) => {
                let InputHTML = '';
                let IsInspectedHTML = '';
                if (IsCompleted == 'N') {
                    if (item.IsInspected === 'Y') {
                        InputHTML = `<button class="btn btn-secondary icon-height mb-1" title="Hold" onclick="Hold(${item.Code})">Hold</button>&nbsp;&nbsp;
                        <button class="btn btn-success icon-height mb-1" title="Pass" onclick="Verify(${item.Code})">Pass</button>&nbsp;&nbsp;
                        <button class="btn btn-danger icon-height mb-1" title="Reject" onclick="OpenModalReject(${item.Code})">Reject</button>`;
                        IsInspectedHTML = `<input type="checkbox" class="form-check-input" checked disabled />`;
                    } else {
                        IsInspectedHTML = `<input type="checkbox" class="form-check-input" onclick="OpenModalInspectedRemark(${item.Code},this)" />`;
                    }
                    return {
                        ...item,
                        'Is Inspected': IsInspectedHTML,
                        'Action': InputHTML,
                    };
                }
                return {
                    ...item
                };
            });
            const TotalColumns = [
                "P.O.(PCS)",
                "Bal Qty for Inspection",
                "Offer Qty"		
            ]
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, true, TotalColumns);
        } else {
            G_RMClearanceDataList = [];
            $('#dvGrid').hide();
            toastr.error('No data found');
        }
    }).catch(function (error) {
        G_RMClearanceDataList = [];
        $('#dvGrid').hide();
        HideLoader();
        toastr.error('Error loading list. Please try again.');
    });
}
function getFinancialYear() {
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth();
    var startYear = currentDate.getFullYear();
    if (currentMonth < 3) {
        startYear = startYear - 1;
    }
    return startYear + "-" + (startYear + 1);
}
function OpenModalReject(Code) {
    var ModuleName = "RM Clearance Entry",
        OptionName = "Reject",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $('#dvRemark').data('Code', Code);
            $('#dvRemark').modal({ backdrop: 'static', keyboard: false });
            $('#dvRemark').modal('show');
            $('#hfCode').val(Code);

        }
    });
}
function RejectRMClearance() {
    var reason = $("#txtRemark").val();
    var Code = $("#hfCode").val();
    if (reason == "") {
        toastr.error('Please enter a reason before proceeding.');
        return;
    }
    FGInspectedOfferService.GetFGInspectedClearanceReject(Code, reason).then(function (response) {
        if (response.Status == 'Y') {
            toastr.success(response.Msg);
            CloseModal();
            GetFGInspectedOfferList();
            $("#txtRemark").val('')
            $("#hfCode").val(0);
        } else {
            toastr.error(response.Msg);
        }
    });
}
function VerifyRMClearance() {
    var reason = $("#txtVerifyRemark").val();
    var Code = $("#hfVerifyCode").val();
    if (reason == "") {
        toastr.error('Please enter a reason before proceeding.');
        return;
    }
    FGInspectedOfferService.GetFGInspectedClearanceVerify(Code, reason).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            CloseVerifyModal();
            GetFGInspectedOfferList();
            $("#txtVerifyRemark").val('')
            $("#hfVerifyCode").val(0);
        }
        else if (response.Status === 'N') {
            toastr.danger(response.Msg);
        }
    });
}
function CloseModal() {
    $('#dvRemark').modal('hide');
    $("#txtRemark").val("");
}
function CloseVerifyModal() {
    $('#dvVerifyRemark').modal('hide');
    $("#txtVerifyRemark").val("");
}
function OpenModalInspectedRemark(Code, element) {
    var ModuleName = "RM Clearance Entry",
        OptionName = "Verify",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            SaveInspectedRemark(Code, element);
        }
    });
}
function SaveInspectedRemark(Code, element) {
    if (confirm("Are you sure you want to inspect this?")) {
        FGInspectedOfferService.SaveInspectedRemark(Code).then(function (response) {
            if (response.Status == 'Y') {
                toastr.success(response.Msg);
                GetFGInspectedOfferList();
            } else {
                toastr.error(response.Msg);
                $(element).prop("checked", false);
            }
        });
    } else {
        $(element).prop("checked", false);
    }
}
function Download() {
    let hiddenFields = [];
    let IsCompleted = $('#chkCompleted').is(':checked') == true ? 'Y' : 'N';
    if (IsCompleted == 'N') {
        hiddenFields = ["Code", "Thickness_Code", "Grade_Code", "RMInspectionRequestMaster_Code", "IsInspected", "Status", "Verify/Rejected By", "Verify/Rejected On", "Remark"];
    } else {
        hiddenFields = ["Code", "Thickness_Code", "Grade_Code", "RMInspectionRequestMaster_Code", "IsInspected",];
    }
    ExportToExcelControl.ExportToExcel(G_RMClearanceDataList, hiddenFields, "FGInspectedEntry");
}
function VerifyAll() {
    var ModuleName = "RM Clearance Entry",
        OptionName = "Verify",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $('#dvVerifyAll').modal({ backdrop: 'static', keyboard: false });
            $('#dvVerifyAll').modal('show');
            $('#hfAllCode').val(0);
        }
    });
}
function VerifyAllRMClearance() {
    let reason = $("#txtRemarkAll").val();
    let Codes = G_RMClearanceDataList
        .filter(item => item["IsInspected"] === 'Y')
        .map(item => item.Code)
        .join(',');

    if (!Codes) {
        toastr.error('Please inspect at least one record.');
        return;
    }
    if (reason == "") {
        toastr.error('Please enter a reason before proceeding.');
        return;
    }
    if (confirm("Are you sure you want to verify all ?")) {
        FGInspectedOfferService.GetAllFGClearanceVerify(Codes, reason).then(function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                CloseAllVerifyModal();
                GetFGInspectedOfferList();
                $("#txtRemarkAll").val('')
            } else if (response.Status === 'N') {
                toastr.error(response.Msg);
            }
        });
    }
}
function CloseAllVerifyModal() {
    $('#dvVerifyAll').modal('hide');
    $("#txtRemarkAll").val("");
}
function Hold(Code) {
    $('#hfHold').val(Code);
    $('#txtHold').val('');
    $('#dvHold').modal({ backdrop: 'static', keyboard: false });
    $('#dvHold').modal('show');
}
function HoldFGInspectedClearance() {
    var remark = $('#txtHold').val().trim();
    var Code = $('#hfHold').val();
    if (remark === "") {
        toastr.error('Please enter remark.');
        return;
    }
    FGInspectedOfferService.GetFGInspectedClearanceHold(Code, remark).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            HoldVerifyModal();
            GetFGInspectedOfferList();
            $('#txtHold').val('');
            $('#hfHold').val(0);
        } else {
            toastr.error(response.Msg);
        }
    });
}
function HoldVerifyModal() {
    $('#dvHold').modal('hide');
    $('#txtHold').val('');
}

window.Verify = Verify;
window.VerifyAll = VerifyAll;
window.VerifyAllRMClearance = VerifyAllRMClearance;
window.CloseModal = CloseModal;
window.OpenModalReject = OpenModalReject;
window.Download = Download;
window.RejectRMClearance = RejectRMClearance;
window.VerifyRMClearance = VerifyRMClearance;
window.CloseVerifyModal = CloseVerifyModal;
window.CloseAllVerifyModal = CloseAllVerifyModal;
window.OpenModalInspectedRemark = OpenModalInspectedRemark;
window.SaveInspectedRemark = SaveInspectedRemark;
window.Hold = Hold;
window.HoldFGInspectedClearance = HoldFGInspectedClearance;
window.HoldVerifyModal = HoldVerifyModal;