import { RawMaterialOfferService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_RawMaterialOfferService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';
import { initObjectListControl } from '../../Bizsol.WebERP.UI.Shared/js/Pages/CustomControl/_ObjectListControlPage.js';
import { ObjectListControlService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_ObjectListControlService.js';

var baseUrl = sessionStorage.getItem('AppBaseURL');

let G_RawMaterialDropDown = [];
let G_ClientOrderProjectData = [];
let G_IdentificationList = []; 
let G_BomTransactionOrderWise_Code = 0;
let G_RMInspectionRequestMaster_Code = 0;

let G_DeleteContext = {
    type: '',
    code: 0,
    row: null 
};

let G_BalanceToInspectWt = 0;

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    GetRawMaterialDropDown();
    GetCurrentDate();
    GetRawMaterialGoDownName();
    GetRawMaterialOfferList();
    $("#btnRMOfferShow").click(function () {
        GetBOMMasterDataOrderWiselist();
    });
});
function GetBOMMasterDataOrderWiselist() {
    var ddlClientName = $("#ddlClientName").val();
    var ddlOrderNo = $("#ddlOrderNo").val();
    var ddlProjectNo = $("#ddlProjectNo").val();
    GetBOMMasterDataOrderWise(ddlClientName, ddlOrderNo, ddlProjectNo)
}
function GetRawMaterialOfferList() {
    Showloader();
    RawMaterialOfferService.GetRawMaterialOfferList().then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            const stringFilterColumn = ["Order No", "Project No", "Client Name", "Godown Name","Status"];
            const numericFilterColumn = [];
            const dateFilterColumn = ["Entry Date", "Inspection Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code", "BuyerPODetail_Code", "Thickness_Code", "Grade_Code", "BuyerPOMaster_Code"];
            const columnAlignment = {
            };
            const updatedResponse = (response).map(function (item) {
                // Edit button
                let actionHtml = '<button class="btn btn-primary icon-height mb-1" title="Edit RM Offer" onclick="EditRMInspectionRequest(' + item.Code + ')"><i class="fa fa-pencil"></i></button>';
                // Delete button
                actionHtml += ' <button class="btn btn-danger icon-height mb-1" title="Delete RM Offer" onclick="DeleteRawMaterialOfferClick(' + item.Code + ')"><i class="fa fa-trash"></i></button>';
                item.Action = actionHtml;
                return item;
            });

            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
        } else {
            toastr.error('No Data Found');
            HideLoader();
        }

    }).catch(function (error) {
        toastr.error(error);
        HideLoader();
    });
}
function CreateNew() { 
    var ModuleName = "RM Offer",
        OptionName = "New",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            G_RMInspectionRequestMaster_Code = 0;
            G_BomTransactionOrderWise_Code = 0;
    
            const $tableHeaderEditable = $('#table-headerEditable');
            const $tableBodyEditable = $('#table-bodyEditable');
    
            if ($tableHeaderEditable && $tableHeaderEditable.length) {
                $tableHeaderEditable.empty();
            }
            if ($tableBodyEditable && $tableBodyEditable.length) {
                $tableBodyEditable.empty();
            }
    
            try {
                const $table = $tableBodyEditable.closest('table');
                if ($table && $table.length && $.fn.DataTable) {
                    const dataTable = $table.DataTable();
                    if (dataTable) {
                        dataTable.clear().destroy();
                    }
                }
            } catch (e) {
                console.log('DataTable cleanup:', e.message);
            }
    
            try {
                const tableId = $tableBodyEditable.closest('table').attr('id');
                if (tableId) {
                    delete window[`hiddenColumns_table-bodyEditable`];
                    delete window[`columnAlignment_table-bodyEditable`];
                    delete window[`button_${tableId}`];
                    delete window[`ShowButtons_table-bodyEditable`];
                    delete window[`filteredData_${tableId}`];
                    delete window[`filteredDataTemp_${tableId}`];
                    delete window[`currentPage_${tableId}`];
                    delete window[`itemsPerPage_${tableId}`];
                    delete window[`Paginator_${tableId}`];
                }
            } catch (e) {
                console.log('Window variables cleanup:', e.message);
            }
            try {
                const currentDate = BizSolHelperFunction.getCurrentDate();
                if (currentDate) {
                    const formattedDate = formatDateForDateInput(currentDate);
                    $('#txtDate').val(formattedDate);
                    $('#txtInspectionDate').val(formattedDate);
                }
            } catch (error) {
                console.error('Error setting current date:', error);
                $('#txtDate').val('');
                $('#txtInspectionDate').val('');
            }
    
            $('#txtTicketNo').val('');
            $('#ddlInspectionLocation').val('0');
    
            if ($.fn.select2) {
                if ($('#ddlClientName').hasClass('select2-hidden-accessible')) {
                    $('#ddlClientName').trigger('change.select2').val('0');
                }
                if ($('#ddlOrderNo').hasClass('select2-hidden-accessible')) {
                    $('#ddlOrderNo').trigger('change.select2').val('');
                }
                if ($('#ddlProjectNo').hasClass('select2-hidden-accessible')) {
                    $('#ddlProjectNo').trigger('change.select2').val('');
                }
                if ($('#ddlInspectionLocation').hasClass('select2-hidden-accessible')) {
                    $('#ddlInspectionLocation').trigger('change.select2').val('0');
                }
            }
    
            HideGrid();
        }
    });
}
function ShowGrid() {
    $("#dvGrid").show();
    $("#dvFrom").hide();
}
function HideGrid() {
    $("#dvGrid").hide();
    $("#dvFrom").show();
}
function GetRawMaterialDropDown() {
    RawMaterialOfferService.GetRawMaterialDropDown().then(function (response) {
            if (response && response.length > 0) {
                G_RawMaterialDropDown = Array.isArray(response) ? response : [];
                bindClientOrderProjectDropdowns(G_RawMaterialDropDown);
            } else {
                toastr.error('No Data Found');
                G_RawMaterialDropDown = [];
            }
        }).catch(function (error) {
            G_RawMaterialDropDown = [];
    });
}
function bindClientOrderProjectDropdowns(list) {
    G_ClientOrderProjectData = Array.isArray(list) ? list : [];
    const $clientName = $('#ddlClientName');
    const $orderNo = $('#ddlOrderNo');
    const $projectNo = $('#ddlProjectNo');

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

    // Sort clients by AccountDesp alphabetically
    uniqueClients.sort(function (a, b) {
        const nameA = (a.AccountDesp || '').toLowerCase();
        const nameB = (b.AccountDesp || '').toLowerCase();
        return nameA.localeCompare(nameB);
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

    // Sort orders by OrderNo alphabetically
    uniqueOrders.sort(function (a, b) {
        const orderA = (a.OrderNo || '').toLowerCase();
        const orderB = (b.OrderNo || '').toLowerCase();
        return orderA.localeCompare(orderB);
    });

    let orderOptions = '<option value="">All</option>';
    uniqueOrders.forEach(function (order) {
        orderOptions += `<option value="${order.OrderNo}">${order.OrderNo}</option>`;
    });
    $orderNo.html(orderOptions);

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

    // Sort projects by ProjectCode alphabetically
    uniqueProjects.sort(function (a, b) {
        const projectA = (a.ProjectCode || '').toLowerCase();
        const projectB = (b.ProjectCode || '').toLowerCase();
        return projectA.localeCompare(projectB);
    });

    let projectOptions = '<option value="">All</option>';
    uniqueProjects.forEach(function (project) {
        projectOptions += `<option value="${project.ProjectCode}">${project.ProjectCode}</option>`;
    });
    $projectNo.html(projectOptions);

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

    $clientName.off('change.clientOrderProject').on('change.clientOrderProject', function () {
        const selectedClientCode = $(this).val();
        if (selectedClientCode === '0') {
            bindAllOrderDropdown();
            bindAllProjectDropdown();
        } else {
            updateOrderDropdown(selectedClientCode);
            const currentOrder = $orderNo.val();
            if (currentOrder === '' || !isOrderValidForClient(currentOrder, selectedClientCode)) {
                $orderNo.val('');
                if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
                    $orderNo.trigger('change.select2');
                }
            }
            updateProjectDropdownByClient(selectedClientCode);
        }
    });

    $orderNo.off('change.clientOrderProject').on('change.clientOrderProject', function () {
        const selectedOrderNo = $(this).val();
        if (selectedOrderNo === '') {
            const selectedClientCode = $clientName.val();
            if (selectedClientCode && selectedClientCode !== '0') {
                updateProjectDropdownByClient(selectedClientCode);
            } else {
                bindAllProjectDropdown();
            }
        } else {
            const orderItem = (G_ClientOrderProjectData || []).find(function (item) {
                return item.OrderNo == selectedOrderNo;
            });
            
            if (orderItem && orderItem.Code) {
                const currentClient = $clientName.val();
                if (currentClient !== orderItem.Code) {
                    $clientName.val(orderItem.Code);
                    if ($.fn.select2 && $clientName.hasClass('select2-hidden-accessible')) {
                        $clientName.trigger('change.select2');
                    }
                }
            }
            updateProjectDropdownByOrder(selectedOrderNo);
        }
    });

    $projectNo.off('change.clientOrderProject').on('change.clientOrderProject', function () {
        const selectedProjectCode = $(this).val();
        if (selectedProjectCode === '') {
            const selectedClientCode = $clientName.val();
            if (selectedClientCode && selectedClientCode !== '0') {
                updateOrderDropdown(selectedClientCode);
            } else {
                bindAllOrderDropdown();
            }
        } else {
            const projectItem = (G_ClientOrderProjectData || []).find(function (item) {
                return item.ProjectCode == selectedProjectCode;
            });
            
            if (projectItem) {
                let shouldUpdateOrder = false;
                
                if (projectItem.Code) {
                    const currentClient = $clientName.val();
                    if (currentClient !== projectItem.Code) {
                        $clientName.val(projectItem.Code);
                        if ($.fn.select2 && $clientName.hasClass('select2-hidden-accessible')) {
                            $clientName.trigger('change.select2');
                        }
                        shouldUpdateOrder = true;
                    }
                }
                
                if (projectItem.OrderNo) {
                    const currentOrder = $orderNo.val();
                    if (currentOrder !== projectItem.OrderNo) {
                        if (shouldUpdateOrder) {
                            updateOrderDropdown(projectItem.Code);
                        }
                        $orderNo.val(projectItem.OrderNo);
                        if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
                            $orderNo.trigger('change.select2');
                        }
                    }
                }
            }
        }
    });
}
function safeUpdateSelect2($element, options) {
    if (!$element || $element.length === 0) {
        return;
    }
    if (!$.fn.select2) {
        return;
    }
    try {
        const isSelect2Initialized = $element.hasClass('select2-hidden-accessible');
        
        if (isSelect2Initialized) {
            try {
                const select2Instance = $element.data('select2');
                if (select2Instance) {
                    $element.select2('destroy');
                } else {
                    $element.removeClass('select2-hidden-accessible');
                }
            } catch (destroyError) {
                $element.removeClass('select2-hidden-accessible');
                $element.removeData('select2');
                $element.siblings('.select2-container').remove();
            }
        }
        
        const defaultConfig = {
            width: '100%',
            dropdownParent: $(document.body)
        };
        
        const config = $.extend({}, defaultConfig, options || {});
        $element.select2(config);
    } catch (error) {
        console.error('Error updating Select2:', error, $element);
    }
}
function updateOrderDropdown(clientCode) {
    const $orderNo = $('#ddlOrderNo');
    if (!$orderNo || $orderNo.length === 0) {
        return;
    }
    
    const currentValue = $orderNo.val();
    
    if (!clientCode || clientCode === '0') {
        bindAllOrderDropdown();
        return;
    }

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
    
    // Sort orders by OrderNo alphabetically
    uniqueOrders.sort(function (a, b) {
        const orderA = (a.OrderNo || '').toLowerCase();
        const orderB = (b.OrderNo || '').toLowerCase();
        return orderA.localeCompare(orderB);
    });
    
    let orderOptions = '<option value="">All</option>';
    uniqueOrders.forEach(function (order) {
        orderOptions += `<option value="${order.OrderNo}">${order.OrderNo}</option>`;
    });
    
    $orderNo.html(orderOptions);
    safeUpdateSelect2($orderNo);
    
    if (currentValue && uniqueOrders.some(function(o) { return o.OrderNo == currentValue; })) {
        $orderNo.val(currentValue);
    } else {
        $orderNo.val('');
    }
    
    if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
        $orderNo.trigger('change.select2');
    }
}
function bindAllOrderDropdown() {
    const $orderNo = $('#ddlOrderNo');
    if (!$orderNo || $orderNo.length === 0) {
        return;
    }
    
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

    // Sort orders by OrderNo alphabetically
    uniqueOrders.sort(function (a, b) {
        const orderA = (a.OrderNo || '').toLowerCase();
        const orderB = (b.OrderNo || '').toLowerCase();
        return orderA.localeCompare(orderB);
    });

    let orderOptions = '<option value="">All</option>';
    uniqueOrders.forEach(function (order) {
        orderOptions += `<option value="${order.OrderNo}">${order.OrderNo}</option>`;
    });
    
    $orderNo.html(orderOptions);
    safeUpdateSelect2($orderNo);
    $orderNo.val('');
    if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
        $orderNo.trigger('change.select2');
    }
}
function isOrderValidForClient(orderNo, clientCode) {
    return (G_ClientOrderProjectData || []).some(function (item) {
        return item.OrderNo == orderNo && item.Code == clientCode;
    });
}
function updateProjectDropdownByClient(clientCode) {
    const $projectNo = $('#ddlProjectNo');
    if (!$projectNo || $projectNo.length === 0) {
        return;
    }
    
    const currentValue = $projectNo.val();
    
    if (!clientCode || clientCode === '0') {
        bindAllProjectDropdown();
        return;
    }
    
    const uniqueProjects = [];
    const projectMap = new Map();
    
    (G_ClientOrderProjectData || []).forEach(function (item) {
        if (item.Code == clientCode) {
            const projectCode = item.ProjectCode || '';
            if (projectCode && !projectMap.has(projectCode)) {
                projectMap.set(projectCode, true);
                uniqueProjects.push({
                    ProjectCode: projectCode
                });
            }
        }
    });

    // Sort projects by ProjectCode alphabetically
    uniqueProjects.sort(function (a, b) {
        const projectA = (a.ProjectCode || '').toLowerCase();
        const projectB = (b.ProjectCode || '').toLowerCase();
        return projectA.localeCompare(projectB);
    });

    let projectOptions = '<option value="">All</option>';
    uniqueProjects.forEach(function (project) {
        projectOptions += `<option value="${project.ProjectCode}">${project.ProjectCode}</option>`;
    });
    
    $projectNo.html(projectOptions);
    safeUpdateSelect2($projectNo);
    
    if (currentValue && uniqueProjects.some(function(p) { return p.ProjectCode == currentValue; })) {
        $projectNo.val(currentValue);
    } else {
        $projectNo.val('');
    }
    
    if ($.fn.select2 && $projectNo.hasClass('select2-hidden-accessible')) {
        $projectNo.trigger('change.select2');
    }
}
function updateProjectDropdownByOrder(orderNo) {
    const $projectNo = $('#ddlProjectNo');
    if (!$projectNo || $projectNo.length === 0) {
        return;
    }
    
    const currentValue = $projectNo.val();
    
    if (!orderNo || orderNo === '') {
        const selectedClientCode = $('#ddlClientName').val();
        if (selectedClientCode && selectedClientCode !== '0') {
            updateProjectDropdownByClient(selectedClientCode);
        } else {
            bindAllProjectDropdown();
        }
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

    // Sort projects by ProjectCode alphabetically
    uniqueProjects.sort(function (a, b) {
        const projectA = (a.ProjectCode || '').toLowerCase();
        const projectB = (b.ProjectCode || '').toLowerCase();
        return projectA.localeCompare(projectB);
    });

    let projectOptions = '<option value="">All</option>';
    uniqueProjects.forEach(function (project) {
        projectOptions += `<option value="${project.ProjectCode}">${project.ProjectCode}</option>`;
    });
    
    $projectNo.html(projectOptions);
    safeUpdateSelect2($projectNo);
    
    if (currentValue && uniqueProjects.some(function(p) { return p.ProjectCode == currentValue; })) {
        $projectNo.val(currentValue);
    } else {
        $projectNo.val('');
    }
    
    // Trigger select2 update if initialized
    if ($.fn.select2 && $projectNo.hasClass('select2-hidden-accessible')) {
        $projectNo.trigger('change.select2');
    }
}
function bindAllProjectDropdown() {
    const $projectNo = $('#ddlProjectNo');
    if (!$projectNo || $projectNo.length === 0) {
        return;
    }
    
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

    // Sort projects by ProjectCode alphabetically
    uniqueProjects.sort(function (a, b) {
        const projectA = (a.ProjectCode || '').toLowerCase();
        const projectB = (b.ProjectCode || '').toLowerCase();
        return projectA.localeCompare(projectB);
    });

    let projectOptions = '<option value="">All</option>';
    uniqueProjects.forEach(function (project) {
        projectOptions += `<option value="${project.ProjectCode}">${project.ProjectCode}</option>`;
    });
    
    $projectNo.html(projectOptions);
    safeUpdateSelect2($projectNo);
    $projectNo.val('');
    if ($.fn.select2 && $projectNo.hasClass('select2-hidden-accessible')) {
        $projectNo.trigger('change.select2');
    }
}
function GetCurrentDate() {
    try {
        const currentDate = BizSolHelperFunction.getCurrentDate();
        
        if (currentDate) {
            let formattedDate = formatDateForDateInput(currentDate);
            setTimeout(function() {
                const $txtDate = $("#txtDate");
                const $txtInspectionDate = $("#txtInspectionDate");
                if ($txtDate.length) {
                    $txtDate.val(formattedDate);
                    $txtDate.trigger('change');
                    console.log('Date bound to txtDate:', formattedDate);
                } else {
                    console.warn('txtDate element not found');
                }
                
                if ($txtInspectionDate.length) {
                    $txtInspectionDate.val(formattedDate);
                    $txtInspectionDate.trigger('change');
                    console.log('Date bound to txtInspectionDate:', formattedDate);
                } else {
                    console.warn('txtInspectionDate element not found');
                }
            }, 100);
        } else {
            console.warn('No current date returned from getCurrentDate()');
        }
    } catch (error) {
        console.error('Error getting current date:', error);
    }
}
function formatDateForDateInput(dateString) {
    if (!dateString || dateString === '0' || dateString === '') {
        return '';
    }
    
    try {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        
        if (dateString.includes('T')) {
            return dateString.split('T')[0];
        }
        
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        
        const separators = ['/', '-'];
        for (let sep of separators) {
            const parts = dateString.split(sep);
            if (parts.length === 3) {
                if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2];
                    return `${year}-${month}-${day}`;
                }
                if (parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
                    const year = parts[0];
                    const month = parts[1].padStart(2, '0');
                    const day = parts[2].padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }
            }
        }
        console.warn('Could not format date:', dateString);
        return dateString;
    } catch (error) {
        console.error('Error formatting date:', error, dateString);
        return dateString;
    }
}
function GetRawMaterialGoDownName() {
    RawMaterialOfferService.GetRawMaterialGoDownName()
        .then(function (response) {
            if (response && response.length > 0) {
                let GetRawMaterialGoDownName = Array.isArray(response) ? response : [];
                GetRawMaterialGoDownNameDropdown(GetRawMaterialGoDownName);
            } else {
                toastr.error('No Data Found');
                GetRawMaterialGoDownNameDropdown([]);
            }
        })
        .catch(function (error) {
            toastr.error('No Data Found');
            GetRawMaterialGoDownNameDropdown([]);
        });
}
function GetRawMaterialGoDownNameDropdown(list) {
    let GetRawMaterialGoDown = Array.isArray(list) ? list : [];
    const $InspectionLocation = $('#ddlInspectionLocation');
    
    if (!$InspectionLocation || $InspectionLocation.length === 0) {
        return;
    }

    const uniqueLocations = [];
    const locationMap = new Map();

    (GetRawMaterialGoDown || []).forEach(function (item) {
        const code = item.Code || item.GoDownName_Code || '';
        const name = item.GodownName || item.GodownName;
        
        if (code && !locationMap.has(code)) {
            locationMap.set(code, name);
            uniqueLocations.push({
                Code: code,
                Name: name
            });
        }
    });

    let locationOptions = '<option value="0">Please select..</option>';
    uniqueLocations.forEach(function (location) {
        locationOptions += `<option value="${location.Code}">${location.Name}</option>`;
    });
    
    $InspectionLocation.html(locationOptions);

    const select2Config = {
        width: '100%',
        dropdownParent: $(document.body)
    };

    try {
        if ($.fn.select2) {
            if ($InspectionLocation.hasClass('select2-hidden-accessible')) {
                $InspectionLocation.select2('destroy');
            }
            
            $InspectionLocation.select2(select2Config);

            if (typeof attachSelect2ScrollPrevention === 'function') {
                attachSelect2ScrollPrevention($InspectionLocation);
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

                $InspectionLocation.on('select2:open', preventScroll);
                $InspectionLocation.on('select2:close', restoreScroll);
            }
        }
    } catch (e) {
        console.error('Error initializing select2 for InspectionLocation:', e);
    }
}
function GetBOMMasterDataOrderWise(ddlClientName, ddlOrderNo, ddlProjectNo) {
    Showloader();
    RawMaterialOfferService.GetBOMMasterDataOrderWise(ddlClientName, ddlOrderNo, ddlProjectNo, G_RMInspectionRequestMaster_Code).then(function (response) {
            if (response && response.length > 0) {
                    HideLoader();
                const stringFilterColumn = ["Order No", "Project No", "Mark No", "Thickness", "Grade", "Client Name"];
                    const numericFilterColumn = [];
                    const dateFilterColumn = ["Order Date", "Dispatch Date"];
                    const button = false;
                    const stringDoubleFilterColumn = [];
                    const showButtons = [];
                const hiddenColumns = ["Code", "SortPriority","BuyerPODetail_Code", "Thickness_Code", "Grade_Code", "BuyerPOMaster_Code", "EntryNo", "GodownMaster_Code", "AccountMaster_Code", "EntryDate","InspectionDate"];
                    const columnAlignment = {
                        "P.O. Qty(Wt.)": "right;",
                        "Balance to Inspect (Wt.)" : "right;",
                        "Offer Qty": "right;"
                };
                const updatedResponse = (response).map(function (item) {
                    // Get Balance to Inspect (Wt.) from API row (property name has spaces)
                    const balanceToInspect = parseFloat(item["Balance to Inspect (Wt.)"]) || 0;
                    item.Action = '<button class="btn btn-primary icon-height mb-1" title="Coil Details" onclick="UpdateCoilDetail('
                        + item.Grade_Code + ',' + item.Code + ',' + balanceToInspect + ')"><i class="fa fa-pencil"></i></button>';
                    //item.Action = '<button class="btn btn-primary icon-height mb-1" title="Coil Details" onclick="ShowObjectListControlModal()"><i class="fa fa-pencil"></i></button>';
                    return item;
                });

                BizsolCustomFilterGrid.CreateDataTable("table-headerEditable", "table-bodyEditable", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
                if (G_RMInspectionRequestMaster_Code > 0 && Array.isArray(response) && response.length > 0) {
                    const masterData = response[0];
                    
                    if (masterData) {
                        if (masterData.EntryDate) {
                            const formattedEntryDate = formatDateForDateInput(masterData.EntryDate);
                            $('#txtDate').val(formattedEntryDate);
                        }
                        if (masterData.InspectionDate) {
                            const formattedInspectionDate = formatDateForDateInput(masterData.InspectionDate);
                            $('#txtInspectionDate').val(formattedInspectionDate);
                        }
                        if (masterData.EntryNo) {
                            $('#txtTicketNo').val(masterData.EntryNo);
                        }
                        if (masterData.GodownMaster_Code) {
                            $('#ddlInspectionLocation').val(masterData.GodownMaster_Code);
                            if ($.fn.select2 && $('#ddlInspectionLocation').hasClass('select2-hidden-accessible')) {
                                $('#ddlInspectionLocation').trigger('change.select2');
                            }
                        }
                    }
                }
            } else {
                toastr.error('No Data Found');
                HideLoader();
            }
        }).catch(function (error) {
            toastr.error('No Data Found');
            HideLoader();
    });
}
function clearDetailTable() {
    const $thead = $('#DetailTable-head');
    const $tbody = $('#DetailTable-body');
    const $tfoot = $('#DetailTable-foot');

    if ($thead && $thead.length) {
        $thead.empty();
    }
    if ($tbody && $tbody.length) {
        $tbody.empty();
    }
    if ($tfoot && $tfoot.length) {
        $tfoot.empty();
    }
}
function buildDetailTableHeader() {
    const $thead = $('#DetailTable-head');
    if (!$thead || !$thead.length) {
        return;
    }

    const headerHtml = `
        <tr>
            <th style="width:30px;">SNo</th>
            <th style="width:120px;">Identification No</th>
            <th style="width:90px;">Coil Wt.</th>
            <th style="width:120px;">Location of Coil</th>
            <th style="width:50px;">Action</th>
        </tr>`;

    $thead.html(headerHtml);
}

// New function: update footer with sum of Coil Wt.
function updateDetailTableFooterSum() {
    try {
        const $table = $('#DetailTable');
        if (!$table || !$table.length) {
            return;
        }

        // Ensure tfoot exists, create if not
        let $tfoot = $table.find('tfoot');
        if (!$tfoot || !$tfoot.length) {
            $tfoot = $('<tfoot id="DetailTable-foot"></tfoot>');
            $table.append($tfoot);
        }

        const $tbody = $('#DetailTable-body');
        let total = 0;
        
        if ($tbody && $tbody.length) {
            $tbody.find('tr.editable-row').each(function () {
                const val = parseFloat($(this).find('.coil-wt').val()) || 0;
                total += val;
            });
        }

        // Build footer row (5 columns: SNo, Identification No, Coil Wt., Location of Coil, Action)
        const footerHtml = `
            <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td></td>
                <td>Total</td>
                <td style="text-align:right;">${total.toFixed(3)}</td>
                <td></td>
                <td></td>
            </tr>`;

        $tfoot.html(footerHtml);
    } catch (e) {
        console.error('Error updating detail table footer sum:', e);
    }
}
function getSelectedIdentificationNos(excludeRow) {
    const selectedIds = [];
    const $tbody = $('#DetailTable-body');
    if ($tbody && $tbody.length) {
        $tbody.find('tr.editable-row').each(function() {
            const $currentRow = $(this);
            // Skip the excluded row
            if (excludeRow && $currentRow[0] === excludeRow[0]) {
                return;
            }
            const $identificationNo = $currentRow.find('.identification-no');
            if ($identificationNo && $identificationNo.length) {
                const selectedId = $identificationNo.val() || '';
                if (selectedId && selectedId !== '') {
                    selectedIds.push(selectedId);
                }
            }
        });
    }
    return selectedIds;
}
function updateIdentificationDropdownOptions($identificationNo, excludeRow) {
    if (!$identificationNo || !$identificationNo.length) {
        return;
    }
    
    const selectedIds = getSelectedIdentificationNos(excludeRow);
    const currentValue = $identificationNo.val() || '';
    
    // Update each option to disable if already selected in another row
    $identificationNo.find('option').each(function() {
        const $option = $(this);
        const optionValue = $option.val() || '';
        
        // Don't disable empty option or the currently selected option in this row
        if (optionValue === '' || optionValue === currentValue) {
            $option.prop('disabled', false);
        } else {
            // Disable if this Identification No is selected in another row
            $option.prop('disabled', selectedIds.indexOf(optionValue) >= 0);
        }
    });
    
    // Refresh Select2 if initialized to update disabled state
    if ($.fn.select2 && $identificationNo.hasClass('select2-hidden-accessible')) {
        // Force Select2 to re-read the options
        $identificationNo.trigger('change.select2');
        // Also trigger a select2:update event to refresh the dropdown
        setTimeout(function() {
            $identificationNo.trigger('select2:update');
        }, 0);
    }
}
function updateAllIdentificationDropdowns(excludeRow) {
    const $tbody = $('#DetailTable-body');
    if ($tbody && $tbody.length) {
        $tbody.find('tr.editable-row').each(function() {
            const $currentRow = $(this);
            const $identificationNo = $currentRow.find('.identification-no');
            if ($identificationNo && $identificationNo.length) {
                updateIdentificationDropdownOptions($identificationNo, excludeRow || $currentRow);
            }
        });
    }
}
function updateButtonVisibility() {
    const $tbody = $('#DetailTable-body');
    if (!$tbody || !$tbody.length) {
        return;
    }

    const totalRows = $tbody.find('tr.editable-row').length;

    $tbody.find('tr.editable-row').each(function(index) {
        const $row = $(this);
        const $addBtn = $row.find('.add-row-btn');
        const $deleteBtn = $row.find('.delete-row-btn');
        const isLastRow = (index === totalRows - 1);

        // Show Add button only on last row, and only if row is complete
        if (isLastRow) {
            $addBtn.show();
        } else {
            $addBtn.hide();
        }

        // Show Delete button on all rows except last (or if more than one row)
        if (totalRows > 1) {
            $deleteBtn.show();
        } else {
            $deleteBtn.hide();
        }
    });
}
function addNewEditableRow() {
    const $tbody = $('#DetailTable-body');
    if (!$tbody || !$tbody.length) {
        return;
    }

    // Get godown options from G_IdentificationList (unique GodownCode/GodownName)
    let godownOptionsHtml = '<option value="0">Please select..</option>';
    const uniqueGodowns = [];
    const godownMap = new Map();
    
    (G_IdentificationList || []).forEach(function (item) {
        const godownCode = item.GodownCode || item.Code || item.GodownMaster_Code || '';
        const godownName = item.GodownName || '';
        
        if (godownCode && !godownMap.has(godownCode)) {
            godownMap.set(godownCode, godownName);
            uniqueGodowns.push({
                Code: godownCode,
                Name: godownName
            });
        }
    });
    
    uniqueGodowns.forEach(function (godown) {
        godownOptionsHtml += `<option value="${godown.Code}">${godown.Name}</option>`;
    });

    // Get current row count for SNo
    const currentRowCount = $tbody.find('tr.editable-row').length;
    const newSNo = currentRowCount + 1;

    const rowHtml = `
        <tr class="editable-row">
            <td class="row-sno">${newSNo}
                <input type="hidden" class="Code" value="0" />
            </td>
            <td>
                <select class="form-control form-control-sm identification-no">
                    <option value="">Please select..</option>
                </select>
            </td>
            <td>
                <input type="number" min="0" step="0.001" class="form-control form-control-sm coil-wt" />
            </td>
            <td>
                <select class="form-control form-control-sm coil-location" disabled>
                    ${godownOptionsHtml}
                </select>
            </td>
            <td>
                <button type="button" class="btn btn-sm btn-success add-row-btn" title="Add Row" disabled style="margin-right: 5px;">
                    <i class="fa fa-plus"></i>
                </button>
                <button type="button" class="btn btn-sm btn-danger delete-row-btn" title="Delete Row" style="display: none;">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        </tr>`;

    $tbody.append(rowHtml);

    // Initialize the new row
    const $newRow = $tbody.find('tr.editable-row').last();
    initializeEditableRow($newRow, null);

    // Update all row numbers
    updateRowNumbers();
    // Update button visibility after adding new row
    updateButtonVisibility();
    // Update all Identification dropdowns to disable already selected options
    updateAllIdentificationDropdowns();
    updateDetailTableFooterSum();
}
function updateRowNumbers() {
    const $tbody = $('#DetailTable-body');
    if (!$tbody || !$tbody.length) {
        return;
    }

    $tbody.find('tr.editable-row').each(function(index) {
        const $rowSno = $(this).find('.row-sno');
        const $codeInput = $rowSno.find('.Code');
        const codeValue = $codeInput.length ? $codeInput.val() : '0';
        
        // Update the text content while preserving the hidden input
        // Remove only text nodes, keep the hidden input
        $rowSno.contents().filter(function() {
            return this.nodeType === 3; // Text node
        }).remove();
        
        // Add the new row number as text
        $rowSno.prepend(document.createTextNode(index + 1));
        
        // Ensure the Code input exists and has the correct value
        if ($codeInput.length === 0) {
            $rowSno.append($('<input>').attr('type', 'hidden').addClass('Code').val(codeValue));
        }
    });
    updateDetailTableFooterSum();
}
function deleteEditableRow($row) {
    // Check if row is locked (Verify !== "N")
    if ($row && $row.length) {
        const verifyStatus = $row.find('.Verify').val() || 'N';
        if (verifyStatus !== 'N') {
            toastr.warning('This row is verified and cannot be deleted.');
            return;
        }
    }

    const ModuleName = "RM Offer";
    const OptionName = "Delete";
    const ShowMsg = "Y";
    const FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck && respCheck.CheckModuleOptionRight === 'N') {
            toastr.error(respCheck.Msg || 'You do not have permission to delete.');
            return;
        }

        if (!$row || !$row.length) {
            return;
        }

        const $tbody = $('#DetailTable-body');
        if (!$tbody || !$tbody.length) {
            return;
        }

        const totalRows = $tbody.find('tr.editable-row').length;
        if (totalRows <= 1) {
            toastr.warning('At least one row must remain');
            return;
        }

        const rowCodeVal = $row.find('.Code').val() || '0';
        const rowCode = parseInt(rowCodeVal, 10) || 0;

        if (!rowCode || rowCode === 0) {
            const $identificationNo = $row.find('.identification-no');
            const $coilLocation = $row.find('.coil-location');
            
            if ($.fn.select2) {
                if ($identificationNo.hasClass('select2-hidden-accessible')) {
                    try {
                        $identificationNo.select2('destroy');
                    } catch (e) {
                        console.error('Error destroying select2 for identification-no:', e);
                    }
                }
                if ($coilLocation.hasClass('select2-hidden-accessible')) {
                    try {
                        $coilLocation.select2('destroy');
                    } catch (e) {
                        console.error('Error destroying select2 for coil-location:', e);
                    }
                }
            }

            $row.remove();
            updateRowNumbers();
            updateButtonVisibility();
            // Update all Identification dropdowns to enable previously disabled options
            updateAllIdentificationDropdowns();
            updateDetailTableFooterSum();
            return;
        }

        if (!confirm('Are you sure you want to delete this detail row?')) {
            return;
        }

        const mode = 'DetailDelete'; 
        const ipAddress = '';
        const location = '';
        const reasonForDelete = 'Test';

        RawMaterialOfferService.DeleteRawMaterialOffer(
            rowCode,
            encodeURIComponent(reasonForDelete),
            mode,
            ipAddress,
            location
        ).then(function (response) {
            if (response && response.Status === 'Y') {
                toastr.success(response.Msg || 'Detail row deleted successfully');
                GetBOMMasterDataOrderWiselist();
                const $identificationNo = $row.find('.identification-no');
                const $coilLocation = $row.find('.coil-location');
                
                if ($.fn.select2) {
                    if ($identificationNo.hasClass('select2-hidden-accessible')) {
                        try {
                            $identificationNo.select2('destroy');
                        } catch (e) {
                            console.error('Error destroying select2 for identification-no:', e);
                        }
                    }
                    if ($coilLocation.hasClass('select2-hidden-accessible')) {
                        try {
                            $coilLocation.select2('destroy');
                        } catch (e) {
                            console.error('Error destroying select2 for coil-location:', e);
                        }
                    }
                }

                $row.remove();
                updateRowNumbers();
                updateButtonVisibility();
                // Update all Identification dropdowns to enable previously disabled options
                updateAllIdentificationDropdowns();
                updateDetailTableFooterSum();
            } else {
                toastr.error((response && response.Msg) || 'Failed to delete detail row');
            }
        }).catch(function (error) {
            toastr.error((error && error.Msg) || 'Error occurred while deleting detail row');
            console.error('Delete detail row error:', error);
        });
    }).catch(function (error) {
        toastr.error((error && error.Msg) || 'Error checking delete rights');
        console.error('CheckModuleOptionRight error:', error);
    });
}
function initializeEditableRow($row, detail) {
    if (!$row || !$row.length) {
        return;
    }

    const $coilLocation = $row.find('.coil-location');

    // Build Location of Coil dropdown options from G_IdentificationList (unique GodownCode/GodownName)
    if ($coilLocation && $coilLocation.length) {
        const hasOptions = $coilLocation.find('option').length > 0;
        if (!hasOptions) {
            // Extract unique GodownCode/GodownName pairs from G_IdentificationList
            const uniqueGodowns = [];
            const godownMap = new Map();
            
            (G_IdentificationList || []).forEach(function (item) {
                const godownCode = item.GodownCode || item.Code || item.GodownMaster_Code || '';
                const godownName = item.GodownName || '';
                
                if (godownCode && !godownMap.has(godownCode)) {
                    godownMap.set(godownCode, godownName);
                    uniqueGodowns.push({
                        Code: godownCode,
                        Name: godownName
                    });
                }
            });
            
            // Build options HTML
            let locationOptions = '<option value="0">Please select..</option>';
            uniqueGodowns.forEach(function (godown) {
                locationOptions += `<option value="${godown.Code}">${godown.Name}</option>`;
            });
            
            $coilLocation.html(locationOptions);
        }
    }

    // Apply select2 to Location of Coil dropdown inside modal, but keep it read-only (disabled for user)
    if ($.fn.select2 && $coilLocation && $coilLocation.length) {
        try {
            if ($coilLocation.hasClass('select2-hidden-accessible')) {
                $coilLocation.select2('destroy');
            }
            $coilLocation.select2({
                width: '100%',
                dropdownParent: $('#DetailModal')
            });
            // Make it read-only: user cannot change, but code can still set value
            $coilLocation.prop('disabled', true);
        } catch (e) {
            console.error('Error initializing select2 for coil-location:', e);
        }
    } else if ($coilLocation && $coilLocation.length) {
        // Ensure plain select is also disabled
        $coilLocation.prop('disabled', true);
    }

    // Populate Identification dropdown from global list
    const $identificationNo = $row.find('.identification-no');
    if ($identificationNo && $identificationNo.length) {
        let identificationOptions = '<option value="">Please select..</option>';
        (G_IdentificationList || []).forEach(function (item) {
            const identificationNo = item.IdentificationNo || item.IdentificationNos || '';
            // Use GodownCode from G_IdentificationList structure
            const godownCode = item.GodownCode || item.Code || item.GodownMaster_Code || '';
            const godownName = item.GodownName || '';
            const balQtyMT = parseFloat(item.BalQtyMT) || 0;

            if (identificationNo) {
                identificationOptions += `<option value="${identificationNo}" data-godown-code="${godownCode}" data-godown-name="${godownName}" data-bal-qty-mt="${balQtyMT}">${identificationNo}</option>`;
            }
        });
        $identificationNo.html(identificationOptions);

        // Apply select2 to Identification No dropdown inside modal
        if ($.fn.select2) {
            try {
                if ($identificationNo.hasClass('select2-hidden-accessible')) {
                    $identificationNo.select2('destroy');
                }
                $identificationNo.select2({
                    width: '100%',
                    dropdownParent: $('#DetailModal')
                });
            } catch (e) {
                console.error('Error initializing select2 for identification-no:', e);
            }
        }
        
        // Update options to disable already selected Identification Nos
        updateIdentificationDropdownOptions($identificationNo, $row);
    }

    // Get references to fields
    const $coilWt = $row.find('.coil-wt');
    const $addBtn = $row.find('.add-row-btn');
    const $deleteBtn = $row.find('.delete-row-btn');

    // Function to check if all fields are filled
    function checkRowComplete() {
        const identificationVal = $identificationNo.val() || '';
        const coilWtVal = $coilWt.val() || '';
        const locationVal = $coilLocation.val() || '';

        const isComplete = identificationVal !== '' && 
                          coilWtVal !== '' && 
                          parseFloat(coilWtVal) > 0 &&
                          locationVal !== '' && 
                          locationVal !== '0';

        if (isComplete) {
            $addBtn.prop('disabled', false).removeClass('disabled');
        } else {
            $addBtn.prop('disabled', true).addClass('disabled');
        }
    }

    // On Identification change, auto-set Godown (Location of Coil) and BalQtyMT (Coil Wt.)
    function handleIdentificationChange() {
        const selectedId = $identificationNo.val() || '';
        
        // Check if this Identification No is already selected in another row
        const selectedIds = getSelectedIdentificationNos($row);
        if (selectedId && selectedIds.indexOf(selectedId) >= 0) {
            toastr.warning('This Identification No is already selected in another row. Please select a different one.');
            $identificationNo.val('');
            if ($.fn.select2 && $identificationNo.hasClass('select2-hidden-accessible')) {
                $identificationNo.trigger('change.select2');
            }
            return;
        }
        
        if (selectedId) {
            const match = (G_IdentificationList || []).find(function (item) {
                const idVal = item.IdentificationNo || item.IdentificationNos || '';
                return idVal === selectedId;
            });

            if (match) {
                // Use GodownCode from G_IdentificationList structure
                const godownCode = match.GodownCode || match.Code || match.GodownMaster_Code || '';
                if (godownCode) {
                    $coilLocation.val(String(godownCode));
                    if ($.fn.select2 && $coilLocation.hasClass('select2-hidden-accessible')) {
                        $coilLocation.trigger('change.select2');
                    } else {
                        $coilLocation.trigger('change');
                    }
                }
                
                // Auto-fill Coil Wt. with BalQtyMT from selected Identification
                const balQtyMT = parseFloat(match.BalQtyMT) || 0;
                if (balQtyMT > 0) {
                    // Set max value for validation
                    $coilWt.attr('max', balQtyMT);
                    $coilWt.data('max-bal-qty', balQtyMT);
                    
                    // Auto-fill if field is empty
                    if (!$coilWt.val() || parseFloat($coilWt.val()) === 0) {
                        $coilWt.val(balQtyMT.toFixed(3));
                    }
                } else {
                    // Remove max if no BalQtyMT
                    $coilWt.removeAttr('max');
                    $coilWt.removeData('max-bal-qty');
                }
            }
        } else {
            // Clear max when no identification selected
            $coilWt.removeAttr('max');
            $coilWt.removeData('max-bal-qty');
        }
        
        // Update all other rows to disable/enable options based on current selection
        updateAllIdentificationDropdowns($row);
        
        checkRowComplete();
    }

    // Attach event handlers to check row completion
    $identificationNo.off('change.checkComplete handleIdentification').on('change.checkComplete handleIdentification', handleIdentificationChange);
    $coilWt
        .off('input.checkComplete change.checkComplete')
        .on('input.checkComplete change.checkComplete', function() {
            // Validate against BalQtyMT (max allowed value)
            const maxBalQty = parseFloat($(this).data('max-bal-qty')) || parseFloat($(this).attr('max')) || 0;
            const currentVal = parseFloat($(this).val()) || 0;
            
            if (maxBalQty > 0 && currentVal > maxBalQty) {
                toastr.warning('Coil Wt. cannot be greater than Balance Qty (' + maxBalQty.toFixed(3) + '). Value will be limited.');
                $(this).val(maxBalQty.toFixed(3));
            }
            
            checkRowComplete();
            updateDetailTableFooterSum();
        })
        // Limit to max 3 decimal places as user types
        .off('input.decimalLimit')
        .on('input.decimalLimit', function () {
            let val = $(this).val() || '';
            if (val.indexOf('.') >= 0) {
                const parts = val.split('.');
                const intPart = parts[0];
                let decPart = parts[1] || '';
                if (decPart.length > 3) {
                    decPart = decPart.substring(0, 3);
                    $(this).val(intPart + '.' + decPart);
                }
            }
        });
    $coilLocation.off('change.checkComplete').on('change.checkComplete', checkRowComplete);

    // Attach click handler to add button
    $addBtn.off('click.addRow').on('click.addRow', function() {
        if (!$(this).prop('disabled')) {
            addNewEditableRow();
        }
    });

    // Attach click handler to delete button
    $deleteBtn.off('click.deleteRow').on('click.deleteRow', function() {
        deleteEditableRow($row);
    });

    // If detail is provided (edit mode), pre-fill values
    if (detail) {
        const existingIdentification = detail.identificationNo || detail.IdentificationNo || '';
        const existingQty = detail.qtyMTOffer || detail.QtyMTOffer || '';
        const existingGodownCode = detail.godownMaster_Code || detail.GodownMaster_Code || '';
        const existingGodownName = detail.godownName || detail.GodownName || '';

        if (existingIdentification) {
            // Try direct value match first
            $identificationNo.val(existingIdentification);

            // If direct match failed (no option selected), try matching by text (case/space insensitive)
            if (!$identificationNo.val()) {
                const normalizedId = String(existingIdentification).trim().toLowerCase();
                let matchedValue = null;
                $identificationNo.find('option').each(function () {
                    const text = ($(this).text() || '').trim().toLowerCase();
                    if (text === normalizedId) {
                        matchedValue = $(this).val();
                        return false; // break
                    }
                });
                if (matchedValue !== null) {
                    $identificationNo.val(matchedValue);
                }
            }

            // Sync select2 UI when value is set programmatically
            if ($.fn.select2 && $identificationNo.hasClass('select2-hidden-accessible')) {
                $identificationNo.trigger('change.select2');
            } else {
                $identificationNo.trigger('change');
            }
        }
        if (existingQty !== '') {
            $coilWt.val(existingQty);
        }

        // Prefer mapping via Identification change (will set Godown from master list and max BalQtyMT)
        if ($identificationNo.val()) {
            handleIdentificationChange();
            // Also ensure max value is set for validation
            const match = (G_IdentificationList || []).find(function (item) {
                const idVal = item.IdentificationNo || item.IdentificationNos || '';
                return idVal === $identificationNo.val();
            });
            if (match) {
                const balQtyMT = parseFloat(match.BalQtyMT) || 0;
                if (balQtyMT > 0) {
                    $coilWt.attr('max', balQtyMT);
                    $coilWt.data('max-bal-qty', balQtyMT);
                }
            }
        } else if (existingGodownCode || existingGodownName) {
            // Fallback: set Godown directly if we have code or name
            if (existingGodownCode) {
                $coilLocation.val(String(existingGodownCode));
            } else {
                const normalizedName = String(existingGodownName).trim().toLowerCase();
                let matchedLocVal = null;
                $coilLocation.find('option').each(function () {
                    const text = ($(this).text() || '').trim().toLowerCase();
                    if (text === normalizedName) {
                        matchedLocVal = $(this).val();
                        return false;
                    }
                });
                if (matchedLocVal !== null) {
                    $coilLocation.val(matchedLocVal);
                }
            }

            if ($.fn.select2 && $coilLocation.hasClass('select2-hidden-accessible')) {
                $coilLocation.trigger('change.select2');
            } else {
                $coilLocation.trigger('change');
            }
        }

        // Final validation state
        checkRowComplete();
    } else {
        // Initial check for new blank rows
        checkRowComplete();
    }
}
function bindEmptyEditableRow() {
    const $tbody = $('#DetailTable-body');
    if (!$tbody || !$tbody.length) {
        return;
    }

    // Get godown options from G_IdentificationList (unique GodownCode/GodownName)
    let godownOptionsHtml = '<option value="0">Please select..</option>';
    const uniqueGodowns = [];
    const godownMap = new Map();
    
    (G_IdentificationList || []).forEach(function (item) {
        const godownCode = item.GodownCode || item.Code || item.GodownMaster_Code || '';
        const godownName = item.GodownName || '';
        
        if (godownCode && !godownMap.has(godownCode)) {
            godownMap.set(godownCode, godownName);
            uniqueGodowns.push({
                Code: godownCode,
                Name: godownName
            });
        }
    });
    
    uniqueGodowns.forEach(function (godown) {
        godownOptionsHtml += `<option value="${godown.Code}">${godown.Name}</option>`;
    });
    
    const rowHtml = `
        <tr class="editable-row">
            <td class="row-sno">1
                <input type="hidden" class="Code" value="0" />
            </td>
            <td>
                <select class="form-control form-control-sm identification-no">
                    <option value="">Please select..</option>
                </select>
            </td>
            <td>
                <input type="number" min="0" step="0.001" class="form-control form-control-sm coil-wt" />
            </td>
            <td>
                <select class="form-control form-control-sm coil-location" disabled>
                    ${godownOptionsHtml}
                </select>
            </td>
            <td>
                <button type="button" class="btn btn-sm btn-success add-row-btn" title="Add Row" disabled style="margin-right: 5px;">
                    <i class="fa fa-plus"></i>
                </button>
                <button type="button" class="btn btn-sm btn-danger delete-row-btn" title="Delete Row" style="display: none;">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        </tr>`;

    $tbody.html(rowHtml);

    initializeEditableRow($tbody.find('tr.editable-row').last(), null);
    updateButtonVisibility();
    updateDetailTableFooterSum();
}
function bindExistingEditableRows(detailResponse) {
    const $tbody = $('#DetailTable-body');
    if (!$tbody || !$tbody.length) {
        return;
    }

    const details = Array.isArray(detailResponse) ? detailResponse : [];
    if (details.length === 0) {
        bindEmptyEditableRow();
        return;
    }

    $tbody.empty();

    details.forEach(function (detail, index) {
        const verifyStatus = detail.Verify || detail.verify || 'N';
        const isLocked = verifyStatus !== 'N';
        const lockedClass = isLocked ? 'locked-row' : '';
        
        const rowHtml = `
            <tr class="editable-row ${lockedClass}">
                <td class="row-sno">${index + 1}
                    <input type="hidden" class="Code" value="${detail.Code || 0}" />
                    <input type="hidden" class="Verify" value="${verifyStatus}" />
                </td>
                <td>
                    <select class="form-control form-control-sm identification-no" ${isLocked ? 'disabled' : ''}>
                        <option value="">Please select..</option>
                    </select>
                </td>
                <td>
                    <input type="number" min="0" step="0.001" class="form-control form-control-sm coil-wt" ${isLocked ? 'readonly' : ''} />
                </td>
                <td>
                    <select class="form-control form-control-sm coil-location" disabled>
                    </select>
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-success add-row-btn" title="Add Row" disabled>
                        <i class="fa fa-plus"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-danger delete-row-btn" title="Delete Row" style="display: none;" ${isLocked ? 'disabled' : ''}>
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            </tr>`;

        $tbody.append(rowHtml);

        const $row = $tbody.find('tr.editable-row').last();
        // Pass detail so initializeEditableRow can prefill Identification, Qty, and Godown
        initializeEditableRow($row, detail);
        
        // If row is locked (Verify !== "N"), ensure all fields remain disabled
        if (isLocked) {
            const $identificationNo = $row.find('.identification-no');
            const $coilWt = $row.find('.coil-wt');
            const $deleteBtn = $row.find('.delete-row-btn');
            
            // Disable Select2 if initialized
            if ($.fn.select2 && $identificationNo.hasClass('select2-hidden-accessible')) {
                $identificationNo.prop('disabled', true).select2('enable', false);
            } else {
                $identificationNo.prop('disabled', true);
            }
            
            // Make Coil Wt. readonly and add visual indicator
            $coilWt.prop('readonly', true).css('background-color', '#e9ecef');
            
            // Hide delete button for locked rows
            $deleteBtn.hide().prop('disabled', true);
            
            // Add visual indicator (optional - you can style locked-row class in CSS)
            $row.css('opacity', '0.7');
        }
    });

    // Always add one extra empty row for new entry
    addNewEditableRow();
    // Update button visibility after binding existing rows
    updateButtonVisibility();
    // Update all Identification dropdowns to disable already selected options
    updateAllIdentificationDropdowns();
}
function UpdateCoilDetail(Grade_Code, Code, balanceToInspectWt) {
    var ModuleName = "RM Offer",
        OptionName = "Edit",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            const entryDate = $('#txtDate').val();
            const inspectionDate = $('#txtInspectionDate').val();
            const godownMaster_Code = $('#ddlInspectionLocation').val();
            if (!entryDate || entryDate === '') {
                toastr.error('Please select Entry Date');
                return;
            }

            if (!inspectionDate || inspectionDate === '') {
                toastr.error('Please select Inspection Date');
                return;
            }

            if (!godownMaster_Code || godownMaster_Code === '0' || godownMaster_Code === '') {
                toastr.error('Please select Inspection Location');
                return;
            }
            // Store Balance to Inspect (Wt.) for validation while saving
            G_BalanceToInspectWt = parseFloat(balanceToInspectWt) || 0;

            Showloader();
            G_BomTransactionOrderWise_Code = Code;
            RawMaterialOfferService.GetBOMMasterIdentificationNo(G_BomTransactionOrderWise_Code).then(function (response) {
                G_IdentificationList = Array.isArray(response) ? response : [];
                clearDetailTable();
                buildDetailTableHeader();

                RawMaterialOfferService.GetRMInspectionRequestDetailsEdit(G_RMInspectionRequestMaster_Code, G_BomTransactionOrderWise_Code).then(function (detailResponse) {
                    // If API returns multiple items, filter for current BOM transaction if key exists
                    let details = Array.isArray(detailResponse) ? detailResponse : [];
                    const keyNames = ['bomTransactionOrderWise_Code', 'BomTransactionOrderWise_Code'];
                    const hasKey = details.length > 0 && keyNames.some(function (k) { return k in details[0]; });

                    if (hasKey) {
                        details = details.filter(function (d) {
                            const val = d.bomTransactionOrderWise_Code != null ? d.bomTransactionOrderWise_Code : d.BomTransactionOrderWise_Code;
                            return String(val) === String(G_BomTransactionOrderWise_Code);
                        });
                    }

                    if (details.length > 0) {
                        bindExistingEditableRows(details);
                    } else {
                        bindEmptyEditableRow();
                    }

                    HideLoader();
                    OpenModal();
                }).catch(function () {
                    // On error loading existing details, just show empty editable row
                    bindEmptyEditableRow();
                    HideLoader();
                    OpenModal();
                });
            }).catch(function (error) {
                toastr.error('No Data Found');
                G_IdentificationList = [];
                clearDetailTable();
                buildDetailTableHeader();
                bindEmptyEditableRow();
                HideLoader();
                OpenModal();
            });
        }
    });
}
function OpenModal() {
    $('#DetailModal').modal({ backdrop: 'static' });
    $('#DetailModal').modal('show');
}
function CloseModal() {
    const tfoot = document.getElementById('DetailTable-foot');
    if (tfoot) {
        tfoot.innerHTML = '';
    }
    $('#DetailModal').modal('hide');
    // Also close remark modal if open and reset remark fields/context
    try {
        $('#dvRemark').modal('hide');
    } catch (e) { }
    $('#txtRemark').val('');
    $('#hfCode').val('');
    G_DeleteContext = { type: '', code: 0, row: null };
}
function SaveRMInspectionRequest() {
    const entryDate = $('#txtDate').val();
    const inspectionDate = $('#txtInspectionDate').val();
    const godownMaster_Code = $('#ddlInspectionLocation').val();

    if (!entryDate || entryDate === '') {
        toastr.error('Please select Entry Date');
        return;
    }

    if (!inspectionDate || inspectionDate === '') {
        toastr.error('Please select Inspection Date');
        return;
    }

    if (!godownMaster_Code || godownMaster_Code === '0' || godownMaster_Code === '') {
        toastr.error('Please select Inspection Location');
        return;
    }

    let userMaster_Code = 0;
    try {
        const userDetails = JSON.parse(sessionStorage.getItem('UserDetails'));
        if (userDetails && userDetails.length > 0 && userDetails[0].Code) {
            userMaster_Code = userDetails[0].Code;
        }
    } catch (e) {
        console.error('Error getting user details:', e);
        toastr.error('Unable to get user details');
        return;
    }

    const $tbody = $('#DetailTable-body');
    const detailRows = [];
    let validationError = false;
    
    if ($tbody && $tbody.length) {
        $tbody.find('tr.editable-row').each(function () {
            if (validationError) {
                return false; // Stop processing if validation error occurred
            }
            
            const $row = $(this);

            const identificationNo = $row.find('.identification-no').val() || '';
            const coilWt = parseFloat($row.find('.coil-wt').val()) || 0;
            const locationCode = $row.find('.coil-location').val() || '';
            const rowCode = $row.find('.Code').val() || 0;   // hidden code per row

            if (
                identificationNo !== '' &&
                coilWt > 0 &&
                locationCode !== '' &&
                locationCode !== '0'
            ) {
                // Validate Coil Wt. against BalQtyMT for this Identification
                const match = (G_IdentificationList || []).find(function (item) {
                    const idVal = item.IdentificationNo || item.IdentificationNos || '';
                    return idVal === identificationNo;
                });
                
                if (match) {
                    const balQtyMT = parseFloat(match.BalQtyMT) || 0;
                    if (balQtyMT > 0 && coilWt > balQtyMT) {
                        toastr.error('Coil Wt. (' + coilWt + ') for Identification ' + identificationNo + ' cannot be greater than Balance Qty (' + balQtyMT.toFixed(3) + ').');
                        validationError = true;
                        return false; // Stop processing
                    }
                }
                
                detailRows.push({
                    code: rowCode,
                    rmInspectionRequestMaster_Code: G_RMInspectionRequestMaster_Code,
                    bomTransactionOrderWise_Code: G_BomTransactionOrderWise_Code,
                    godownMaster_Code: locationCode,
                    identificationNo: identificationNo,
                    qtyMTOffer: coilWt
                });
            }
        });
    }
    
    if (validationError) {
        return; // Stop save if validation failed
    }

    if (detailRows.length === 0) {
        toastr.error('Please add at least one valid detail row with all fields filled');
        return;
    }

    // Validate that total Coil Wt. does not exceed Balance to Inspect (Wt.)
    try {
        const totalCoilWt = detailRows.reduce(function (sum, item) {
            return sum + (parseFloat(item.qtyMTOffer) || 0);
        }, 0);

        if (G_BalanceToInspectWt > 0 && totalCoilWt > G_BalanceToInspectWt) {
            toastr.error('Total Coil Wt. (' + totalCoilWt + ') cannot be greater than Balance to Inspect (Wt.) (' + G_BalanceToInspectWt + ').');
            return;
        }
    } catch (e) {
        console.error('Error validating Coil Wt. total vs Balance to Inspect (Wt.):', e);
    }

    const saveData = {
        rmInspectionRequestMaster: [
            {
                code: G_RMInspectionRequestMaster_Code,
                entryDate: entryDate,
                inspectionDate: inspectionDate,
                godownMaster_Code: godownMaster_Code,
                userMaster_Code: userMaster_Code
            }
        ],
        rmInspectionRequestDetails: detailRows,// Include deleted codes for server-side deletion
    };

    Showloader();
    RawMaterialOfferService.SaveRMInspectionRequest(saveData).then(function (response) {
        HideLoader();
        if (response && response.Status == "Y") {
            toastr.success(response.Msg);
            CloseModal();
            G_RMInspectionRequestMaster_Code = response.Code;
            GetBOMMasterDataOrderWiselist();
        } else {
            const errorMessage = response && response.message ? response.message : 'Failed to save data';
            toastr.error(errorMessage);
        }
    }).catch(function (error) {
        HideLoader();
        const errorMessage = error && error.message ? error.message : 'Error occurred while saving data';
        toastr.error(errorMessage);
        console.error('Save error:', error);
    });
}
function EditRMInspectionRequest(Code) {
    var ModuleName = "RM Offer",
        OptionName = "Edit",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
        MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            G_RMInspectionRequestMaster_Code = Code;
            GetBOMMasterDataOrderWiselist();
            HideGrid();
        }
    });
}
function Back() {
    G_RMInspectionRequestMaster_Code = 0;
    G_BomTransactionOrderWise_Code = 0;
    const $tableHeaderEditable = $('#table-headerEditable');
    const $tableBodyEditable = $('#table-bodyEditable');
    
    if ($tableHeaderEditable && $tableHeaderEditable.length) {
        $tableHeaderEditable.empty();
    }
    if ($tableBodyEditable && $tableBodyEditable.length) {
        $tableBodyEditable.empty();
    }
    try {
        const $table = $tableBodyEditable.closest('table');
        if ($table && $table.length && $.fn.DataTable) {
            const dataTable = $table.DataTable();
            if (dataTable) {
                dataTable.clear().destroy();
            }
        }
    } catch (e) {
        console.log('DataTable cleanup:', e.message);
    }
    
    try {
        const tableId = $tableBodyEditable.closest('table').attr('id');
        if (tableId) {
            delete window[`hiddenColumns_table-bodyEditable`];
            delete window[`columnAlignment_table-bodyEditable`];
            delete window[`button_${tableId}`];
            delete window[`ShowButtons_table-bodyEditable`];
            delete window[`filteredData_${tableId}`];
            delete window[`filteredDataTemp_${tableId}`];
            delete window[`currentPage_${tableId}`];
            delete window[`itemsPerPage_${tableId}`];
            delete window[`Paginator_${tableId}`];
        }
    } catch (e) {
        console.log('Window variables cleanup:', e.message);
    }
    
    try {
        const currentDate = BizSolHelperFunction.getCurrentDate();
        if (currentDate) {
            const formattedDate = formatDateForDateInput(currentDate);
            $('#txtDate').val(formattedDate);
            $('#txtInspectionDate').val(formattedDate);
        }
    } catch (error) {
        console.error('Error setting current date:', error);
        $('#txtDate').val('');
        $('#txtInspectionDate').val('');
    }
    
    $('#txtTicketNo').val('');
    $('#ddlInspectionLocation').val('0');
    
    if ($.fn.select2) {
        if ($('#ddlClientName').hasClass('select2-hidden-accessible')) {
            $('#ddlClientName').trigger('change.select2').val("0");
        }
        if ($('#ddlOrderNo').hasClass('select2-hidden-accessible')) {
            $('#ddlOrderNo').trigger('change.select2').val("");
        }
        if ($('#ddlProjectNo').hasClass('select2-hidden-accessible')) {
            $('#ddlProjectNo').trigger('change.select2').val("");
        }
        if ($('#ddlInspectionLocation').hasClass('select2-hidden-accessible')) {
            $('#ddlInspectionLocation').trigger('change.select2');
        }
    }
    
    GetRawMaterialOfferList();
    ShowGrid();
}
function DeleteRawMaterialOfferClick(Code) {
    if (!Code) {
        return;
    }
    const ModuleName = "RM Offer";
    const OptionName = "Delete";
    const ShowMsg = "Y";
    const FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck && respCheck.CheckModuleOptionRight === 'N') {
            toastr.error(respCheck.Msg || 'You do not have permission to delete.');
            return;
        }

        if (!confirm('Are you sure you want to delete this RM Offer?')) {
            return;
        }

        G_DeleteContext = {
            type: 'DeleteMaster',
            code: Code,
            row: null
        };

        $('#hfCode').val(Code);
        $('#txtRemark').val('');
        $('#dvRemark').modal('show');
    }).catch(function (error) {
        toastr.error((error && error.Msg) || 'Error checking delete rights');
        console.error('CheckModuleOptionRight error:', error);
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
function DeleteRMOffer() {
    const remark = ($('#txtRemark').val() || '').trim();
    if (!remark) {
        toastr.error('Remark is required');
        $('#txtRemark').focus();
        return;
    }

    const codeFromInput = parseInt($('#hfCode').val() || '0', 10) || 0;
    const code = G_DeleteContext.code || codeFromInput;

    if (!code || code === 0) {
        toastr.error('Invalid code for delete');
        return;
    }

    // This remark modal is only used for master delete
    const mode = 'DeleteMaster';
    const ipAddress = '';
    const location = '';

    RawMaterialOfferService.DeleteRawMaterialOffer(
        code,
        encodeURIComponent(remark),
        mode,
        ipAddress,
        location
    ).then(function (response) {
        if (response && response.Status === 'Y') {
            toastr.success(response.Msg || 'Deleted successfully');

            // Master delete: refresh main grid
            GetRawMaterialOfferList();

            // Close remark modal and reset context
            try {
                $('#dvRemark').modal('hide');
            } catch (e) { }
            $('#txtRemark').val('');
            $('#hfCode').val('');
            G_DeleteContext = { type: '', code: 0, row: null };
        } else {
            toastr.error((response && response.Msg) || 'Failed to delete');
        }
    }).catch(function (error) {
        toastr.error((error && error.Msg) || 'Error occurred while deleting');
        console.error('DeleteRMOffer error:', error);
    });
}
function ChangecolorTr() {
    const tbody = document.getElementById("table-bodyEditable");
    const thead = document.getElementById("table-headerEditable");

    if (!tbody) {
        return;
    }

    // FORCE: default Offer Qty column index (0-based).
    // Change this value if your Offer Qty column index is different.
    const forcedOfferQtyColIndex = 22;
    let offerQtyColIndex = forcedOfferQtyColIndex;

    // Try to detect "Offer Qty" column dynamically if header exists,
    // but ALWAYS fall back to forced index when detection fails.
    if (thead) {
        const headerRow = thead.querySelector("tr");
        if (headerRow) {
            const ths = headerRow.querySelectorAll("th");
            ths.forEach((th, index) => {
                const headerText = (th.textContent || "").trim().toUpperCase();
                const normalized = headerText.replace(/\s+/g, " ");
                if (normalized.indexOf("OFFER QTY") !== -1) {
                    offerQtyColIndex = index;
                }
            });
        }
    }

    const rows = tbody.querySelectorAll("tr");
    rows.forEach((row) => {
        const tds = row.querySelectorAll("td");
        row.style.backgroundColor = "";

        if (tds.length > offerQtyColIndex) {
            const rawText = (tds[offerQtyColIndex].textContent || "").trim().replace(/,/g, "");
            const qty = parseFloat(rawText) || 0;

            if (qty > 0) {
                row.style.backgroundColor = "#d1fae5"; // light green
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    setInterval(ChangecolorTr, 1000);
});

function ensureObjectListControlLoaded() {
    return new Promise(function (resolve, reject) {
        if (window.FrmLOV) {
            resolve();
            return;
        }

        var url = baseUrl + '/CustomControl/ObjectListControl';
        $('#DivObjectListControlModal').load(url, function (response, status, xhr) {
            if (status === 'error') {
                console.error('Error loading ObjectListControl partial:', xhr && xhr.statusText);
                toastr.error('Failed to load List of Values layout.');
                reject(xhr);
                return;
            }

            try {
                initObjectListControl();
                if (!window.FrmLOV) {
                    throw new Error('FrmLOV was not initialized by initObjectListControl.');
                }
                resolve();
            } catch (e) {
                console.error('Error initializing ObjectListControl:', e);
                toastr.error('Failed to initialize List of Values.');
                reject(e);
            }
        });
    });
}

// Base query for GetItemMultipleSelectLOV (adjust per your backend API contract if needed)
var G_ItemMultipleSelectLOV_BaseQuery = 'Item';

// Build options for ObjectListControlService.GetItemMultipleSelectLOV (same payload as _ObjectListControlService.js)
function getItemMultipleSelectLOVServiceOptions(opts) {
    opts = opts || {};
    return {
        filterCondition: opts.filterCondition || null,
        filterValue: opts.filterValue != null ? String(opts.filterValue) : null,
        filterValueDataType: (opts.filterValueDataType === 'N' ? 'N' : 'S'),
        filterCondition1: opts.filterCondition1 || null,
        useLikeSearchInBothSide: (opts.useLikeSearchInBothSide === 'Y' ? 'Y' : 'N')
    };
}

function ShowObjectListControlModal(data, options) {
    // When called from "MultiPle Select" button with no args, use GetItemMultipleSelectLOV
    var useItemLOV = (typeof data === 'undefined' && (!options || Object.keys(options || {}).length === 0));

    var defaultOptions = {
        multiSelect: false,
        filterValue: '',
        filterCondition: '',
        filterCondition1: '',
        filterValueDataType: 'S',
        useLikeSearchInBothSide: 'N',
        noOfColumnToHide: 0,
        showTotalColumnNameByCommaSeparated: '',
        selectAllItems: false,
        query: G_ItemMultipleSelectLOV_BaseQuery,
        columnNameToIncreaseWidth: '',
        loadData: null
    };

    var mergedOptions = $.extend({}, defaultOptions, options || {});

    if (useItemLOV) {
        mergedOptions.multiSelect = true;
        mergedOptions.query = G_ItemMultipleSelectLOV_BaseQuery;
        mergedOptions.loadData = function (query) {
            var baseQuery = (query && String(query).trim()) ? String(query).trim() : G_ItemMultipleSelectLOV_BaseQuery;
            var serviceOpts = getItemMultipleSelectLOVServiceOptions(mergedOptions);
            return ObjectListControlService.GetItemMultipleSelectLOV(baseQuery, serviceOpts);
        };
    }

    // Only set data when explicitly provided so loadData (if any) still works
    if (typeof data !== 'undefined') {
        mergedOptions.data = data;
    }

    return ensureObjectListControlLoaded()
        .then(function () {
            return window.FrmLOV.initialize1(mergedOptions);
        })
        .then(function (result) {
            if (!result.escapePress) {
                ObjectListControlCallback(result);
            }
            return result;
        })
        .catch(function (error) {
            console.error('Error showing ObjectListControl:', error);
            if (!error.__handledToastr) {
                toastr.error('Error opening List of Values');
            }
            throw error;
        });
}

// Holds last selection from GetItemMultipleSelectLOV (codes, display values, and rows)
var G_ObjectListControlLastSelection = { codes: [], values: [], dataView: null };

function ObjectListControlCallback(result) {
    if (result.escapePress) {
        return;
    }
    var url = baseUrl + '/CustomControl/ObjectListControl';
    $('#DivObjectListControlModal').load(url);
    if (result.values) {
        // Parse comma-separated codes/values from LOV (e.g. from MultiPle Select)
        var codeStr = (result.values || '').replace(/'/g, '');
        var valueStr = (result.get_value || '').replace(/'/g, '');
        G_ObjectListControlLastSelection.codes = codeStr ? codeStr.split(',') : [];
        G_ObjectListControlLastSelection.values = valueStr ? valueStr.split(',') : [];
        G_ObjectListControlLastSelection.dataView = result.dataView || null;
        if (G_ObjectListControlLastSelection.codes.length > 0) {
            toastr.success('Selected ' + G_ObjectListControlLastSelection.codes.length + ' item(s).');
            console.log('Selected Codes:', G_ObjectListControlLastSelection.codes);
            console.log('Selected Data:', G_ObjectListControlLastSelection.dataView);
        } else {
            toastr.warning('No item selected');
        }
    } else {
        toastr.warning('No item selected');
    }
}

window.CreateNew = CreateNew;
window.UpdateCoilDetail = UpdateCoilDetail;
window.OpenModal = OpenModal;
window.CloseModal = CloseModal;
window.SaveRMInspectionRequest = SaveRMInspectionRequest;
window.EditRMInspectionRequest = EditRMInspectionRequest;
window.Back = Back;
window.DeleteRawMaterialOfferClick = DeleteRawMaterialOfferClick;
window.DeleteRMOffer = DeleteRMOffer;
window.ShowObjectListControlModal = ShowObjectListControlModal;
window.ObjectListControlCallback = ObjectListControlCallback;