import { RawMaterialOfferService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_RawMaterialOfferService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';
import { QCPropertyItemConfigurationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/QCPropertyItemConfigurationService.js';

let G_RawMaterialDropDown = [];
let G_ClientOrderProjectData = [];

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    GetRawMaterialDropDown();
});
function CreateNew() {
    HideGrid();
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

    let clientOptions = '<option value="0">Please select..</option>';
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

    let orderOptions = '<option value="0">Please select..</option>';
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

    let projectOptions = '<option value="0">Please select..</option>';
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
            if (currentOrder === '0' || !isOrderValidForClient(currentOrder, selectedClientCode)) {
                $orderNo.val('0').trigger('change.clientOrderProject');
            }
        }
    });

    // Cascading: When order changes, update project dropdown and auto-select client
    $orderNo.off('change.clientOrderProject').on('change.clientOrderProject', function () {
        const selectedOrderNo = $(this).val();
        if (selectedOrderNo === '0') {
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
        if (selectedProjectCode === '0') {
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

function updateOrderDropdown(clientCode) {
    const $orderNo = $('#ddlOrderNo');
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
    let orderOptions = '<option value="0">Please select..</option>';
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
    if (currentValue && uniqueOrders.some(function(o) { return o.OrderNo == currentValue; })) {
        $orderNo.val(currentValue);
        if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
            $orderNo.trigger('change.select2');
        }
    } else {
        $orderNo.val('0');
        if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
            $orderNo.trigger('change.select2');
        }
    }
}

function bindAllOrderDropdown() {
    const $orderNo = $('#ddlOrderNo');
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

    let orderOptions = '<option value="0">Please select..</option>';
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
    if (currentValue && uniqueOrders.some(function(o) { return o.OrderNo == currentValue; })) {
        $orderNo.val(currentValue);
        if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
            $orderNo.trigger('change.select2');
        }
    } else {
        $orderNo.val('0');
        if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
            $orderNo.trigger('change.select2');
        }
    }
}

function isOrderValidForClient(orderNo, clientCode) {
    return (G_ClientOrderProjectData || []).some(function (item) {
        return item.OrderNo == orderNo && item.Code == clientCode;
    });
}

function updateProjectDropdown(clientCode, orderNo) {
    const $projectNo = $('#ddlProjectNo');
    const currentValue = $projectNo.val();
    
    if (!clientCode || clientCode === '0' || !orderNo || orderNo === '0') {
        bindAllProjectDropdown();
        return;
    }
    const uniqueProjects = [];
    const projectMap = new Map();
    
    (G_ClientOrderProjectData || []).forEach(function (item) {
        if (item.Code == clientCode && item.OrderNo == orderNo) {
            const projectCode = item.ProjectCode || '';
            if (projectCode && !projectMap.has(projectCode)) {
                projectMap.set(projectCode, true);
                uniqueProjects.push({
                    ProjectCode: projectCode
                });
            }
        }
    });

    let projectOptions = '<option value="0">Please select..</option>';
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
    if (currentValue && uniqueProjects.some(function(p) { return p.ProjectCode == currentValue; })) {
        $projectNo.val(currentValue);
        if ($.fn.select2 && $projectNo.hasClass('select2-hidden-accessible')) {
            $projectNo.trigger('change.select2');
        }
    } else {
        $projectNo.val('0');
        if ($.fn.select2 && $projectNo.hasClass('select2-hidden-accessible')) {
            $projectNo.trigger('change.select2');
        }
    }
}

function updateProjectDropdownByOrder(orderNo) {
    const $projectNo = $('#ddlProjectNo');
    const currentValue = $projectNo.val();
    
    if (!orderNo || orderNo === '0') {
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

    let projectOptions = '<option value="0">Please select..</option>';
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
    if (currentValue && uniqueProjects.some(function(p) { return p.ProjectCode == currentValue; })) {
        $projectNo.val(currentValue);
        if ($.fn.select2 && $projectNo.hasClass('select2-hidden-accessible')) {
            $projectNo.trigger('change.select2');
        }
    } else {
        $projectNo.val('0');
        if ($.fn.select2 && $projectNo.hasClass('select2-hidden-accessible')) {
            $projectNo.trigger('change.select2');
        }
    }
}

function bindAllProjectDropdown() {
    const $projectNo = $('#ddlProjectNo');
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

    let projectOptions = '<option value="0">Please select..</option>';
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
    if (currentValue && uniqueProjects.some(function(p) { return p.ProjectCode == currentValue; })) {
        $projectNo.val(currentValue);
        if ($.fn.select2 && $projectNo.hasClass('select2-hidden-accessible')) {
            $projectNo.trigger('change.select2');
        }
    } else {
        $projectNo.val('0');
        if ($.fn.select2 && $projectNo.hasClass('select2-hidden-accessible')) {
            $projectNo.trigger('change.select2');
        }
    }
}

window.CreateNew = CreateNew;