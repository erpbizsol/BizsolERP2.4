import { RawMaterialOfferService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_RawMaterialOfferService.js';
import { FGInspectedOfferService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_FGInspectedEntryService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

let G_RawMaterialDropDown = [];
let G_ClientOrderProjectData = [];
let G_BomTransactionOrderWise_Code = 0;
let G_RMInspectionRequestMaster_Code = 0;

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    GetRawMaterialDropDown();
    GetCurrentDate();
    GetRawMaterialGoDownName();
    GetFGInspectedOfferList();
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
function GetFGInspectedOfferList() {
    Showloader();
    FGInspectedOfferService.GetFGInspectedOfferList().then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            const stringFilterColumn = ["Order No", "Project No", "Client Name", "Godown Name", "Status"];
            const numericFilterColumn = [];
            const dateFilterColumn = ["Entry Date", "Inspection Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code", "BuyerPODetail_Code", "Thickness_Code", "Grade_Code", "BuyerPOMaster_Code"];
            const columnAlignment = {
            };
            const updatedResponse = (response).map(function (item) {
                let actionHtml = '<button class="btn btn-primary icon-height mb-1" title="Edit FG Offer" onclick="EditRMInspectionRequest(' + item.Code + ')"><i class="fa fa-pencil"></i></button>';
                actionHtml += ' <button class="btn btn-danger icon-height mb-1" title="Delete FG Offer" onclick="DeleteFGOffer(' + item.Code + ')"><i class="fa fa-trash"></i></button>';
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
    var ModuleName = "FG Offer",
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

    if (currentValue && uniqueOrders.some(function (o) { return o.OrderNo == currentValue; })) {
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
        if (orderNo, !orderMap.has(orderNo)) {
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

    if (currentValue && uniqueProjects.some(function (p) { return p.ProjectCode == currentValue; })) {
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

    if (currentValue && uniqueProjects.some(function (p) { return p.ProjectCode == currentValue; })) {
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
            setTimeout(function () {
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
    FGInspectedOfferService.GetBOMMasterDataOrderWise(ddlClientName, ddlOrderNo, ddlProjectNo, G_RMInspectionRequestMaster_Code).then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            const stringFilterColumn = ["Order No", "Project No", "Mark No", "Thickness", "Grade", "Client Name"];
            const numericFilterColumn = ["P.O(PCS)","Already Cleared Qty","Bal Qty for Inspection"];
            const dateFilterColumn = ["Order Date", "Dispatch Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code", "SortPriority", "BuyerPODetail_Code", "Thickness_Code", "Grade_Code", "BuyerPOMaster_Code", "EntryNo", "GodownMaster_Code", "AccountMaster_Code", "EntryDate", "InspectionDate", "RMInspectionRequestDetails_Code", "BOMWeight","Verify"];
            const columnAlignment = {
                "P.O(PCS)": "right;",
                "Already Cleared Qty": "right;",
                "Bal Qty for Inspection": "right;",
                "Offer Qty": "right;max-width:60px;",
                "Offer Qty(Wt.)": "right;max-width:60px;"
            };
            const updatedResponse = (response).map(function (item) {
                const balanceToInspect = parseFloat(item["Bal Qty for Inspection"]) || 0;
                const BOMWeight = parseFloat(item["BOMWeight"]) || 0;
                const Verify = item["Verify"];

                // Determine if row should be disabled (when Verify is not 'N')
                const isDisabled = Verify !== 'N' && Verify !== undefined && Verify !== null && Verify !== '';
                const disabledAttr = isDisabled ? 'disabled' : '';
                const disabledClass = isDisabled ? 'opacity-50 cursor-not-allowed' : '';
                const disabledStyle = isDisabled ? 'background-color: #e9ecef; opacity: 0.6; cursor: not-allowed;' : '';

                // Calculate initial weighted value if Offer Qty exists
                let initialWeightedValue = '';
                if (item["Offer Qty"] && BOMWeight > 0) {
                    const offerQtyNum = parseFloat(item["Offer Qty"]) || 0;
                    if (offerQtyNum > 0) {
                        initialWeightedValue = parseFloat((offerQtyNum * BOMWeight).toFixed(3));
                    }
                }

                item["Offer Qty"] = `<input type='text' class="form-control form-control-sm box_border offer-qty-input ${disabledClass}" id="OfferQty_${item.Code}" data-balance="${balanceToInspect}" data-bom-weight="${BOMWeight}" data-code="${item.Code}" value="${item["Offer Qty"] || ''}" placeholder="Enter Qty" onkeypress="return FGOffer_OnlyNumeric(event)" oninput="FGOffer_ValidateAndCalculateWeight(this)" maxlength="10" ${disabledAttr} style="${disabledStyle}"/>`;
                item["Offer Qty(Wt.)"] = `<input type='text' class="form-control form-control-sm box_border" id="OfferQtyWt_${item.Code}" value="${initialWeightedValue}" disabled placeholder="Auto calculated" style="background-color: #e9ecef;" />`;
                
                const buttonDisabledAttr = isDisabled ? 'disabled' : '';
                const buttonDisabledClass = isDisabled ? 'opacity-50 cursor-not-allowed' : '';
                
                item.Action = `<button class="btn btn-success icon-height mb-1 ${buttonDisabledClass}" title="${isDisabled ? 'This record is already verified' : 'Save Coil Details'}" onclick="SaveRMInspectionRequest(${item.Code}, ${item.RMInspectionRequestDetails_Code})" ${buttonDisabledAttr}><i class="fa fa-save"></i></button>`;
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
function SaveRMInspectionRequest(Code,RMInspectionRequestDetails_Code) {
    G_BomTransactionOrderWise_Code = Code;
    const entryDate = $('#txtDate').val();
    const inspectionDate = $('#txtInspectionDate').val();
    const godownMaster_Code = $('#ddlInspectionLocation').val();
    const OfferQtyElement = $("#OfferQty_" + Code);
    
    // Check if the field is disabled
    if (OfferQtyElement.is(':disabled')) {
        toastr.error('This record is already verified and cannot be edited.');
        return;
    }
    
    const OfferQty = parseInt(OfferQtyElement.val());
    
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
    if (OfferQty === '' || OfferQty === null || OfferQty === undefined || isNaN(OfferQty)) {
        toastr.error('Please enter offer qty.');
        return;
    }
    if (OfferQty == 0) {
        toastr.error('Offer qty should be Greter then 0.');
        return;
    }
        const detailRows = [];
        detailRows.push({
            code: RMInspectionRequestDetails_Code,
            rmInspectionRequestMaster_Code: G_RMInspectionRequestMaster_Code,
            bomTransactionOrderWise_Code: G_BomTransactionOrderWise_Code,
            godownMaster_Code: 0,
            identificationNo: "",
            qtyMTOffer: OfferQty
        });

    const saveData = {
        rmInspectionRequestMaster: [
            {
                code: G_RMInspectionRequestMaster_Code,
                entryDate: entryDate,
                inspectionDate: inspectionDate,
                godownMaster_Code: godownMaster_Code,
                userMaster_Code: 0
            }
        ],
        rmInspectionRequestDetails: detailRows,// Include deleted codes for server-side deletion
    };

    Showloader();
    FGInspectedOfferService.SaveRMInspectionRequest(saveData).then(function (response) {
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
    var ModuleName = "FG Offer",
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
    GetFGInspectedOfferList();
    ShowGrid();
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
function FGOffer_OnlyNumeric(event) {
    // Allow only numeric input
    const charCode = event.which ? event.which : event.keyCode;
    // Allow: 0-9, Backspace(8), Tab(9), Enter(13), Delete(46)
    if (!(charCode === 8 || charCode === 9 || charCode === 13 || charCode === 46 || 
          (charCode >= 48 && charCode <= 57))) {
        event.preventDefault();
        return false;
    }
    return true;
}
function FGOffer_ValidateAndCalculateWeight(inputElement) {
    const offerQty = parseFloat(inputElement.value) || 0;
    const code = inputElement.getAttribute('data-code');
    const balanceToInspect = parseFloat(inputElement.getAttribute('data-balance')) || 0;
    const bomWeight = parseFloat(inputElement.getAttribute('data-bom-weight')) || 0;
    
    // Get the weighted output field
    const weightedQtyElement = document.getElementById(`OfferQtyWt_${code}`);
    
    if (!weightedQtyElement) {
        return;
    }
    
    // Validate: Value should not exceed balance to inspect
    if (offerQty > 0 && offerQty > balanceToInspect) {
        toastr.error(`Offer Qty (${offerQty}) cannot exceed Balance to Inspect (${balanceToInspect})`);
        inputElement.value = '';
        weightedQtyElement.value = '';
        inputElement.focus();
        return false;
    }
    
    // Calculate weighted quantity: Offer Qty * BOM Weight
    let calculatedWeight = 0;
    if (offerQty > 0 && bomWeight > 0) {
        calculatedWeight = parseFloat((offerQty * bomWeight).toFixed(3));
    }
    
    // Display the calculated weight in the disabled field
    weightedQtyElement.value = calculatedWeight > 0 ? calculatedWeight : '';
    
    return true;
}
function DeleteFGOffer(Code) {
    if (!Code) {
        return;
    }
    const ModuleName = "FG Offer";
    const OptionName = "Delete";
    const ShowMsg = "Y";
    const FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck && respCheck.CheckModuleOptionRight === 'N') {
            toastr.error(respCheck.Msg || 'You do not have permission to delete.');
            return;
        }

        $('#hfCode').val(Code);
        $('#txtRemark').val('');
        OpenModal();
    }).catch(function (error) {
        toastr.error((error && error.Msg) || 'Error checking delete rights');
    });
}
function DeleteFGOfferModal() {
    const remark = ($('#txtRemark').val() || '').trim();
    if (!remark) {
        toastr.error('Remark is required');
        $('#txtRemark').focus();
        return;
    }

    const codeFromInput = parseInt($('#hfCode').val() || '0', 10) || 0;
    const code = codeFromInput;

    const ipAddress = '';
    const location = '';

    FGInspectedOfferService.DeleteFGDetailsByCode(
        code,
        encodeURIComponent(remark),
        ipAddress,
        location
    ).then(function (response) {
        if (response && response.Status === 'Y') {
            toastr.success(response.Msg || 'Deleted successfully');
            GetFGInspectedOfferList();
            CloseModal();
            $('#txtRemark').val('');
            $('#hfCode').val('');
        } else {
            toastr.error((response && response.Msg) || 'Failed to delete');
        }
    }).catch(function (error) {
        toastr.error((error && error.Msg) || 'Error occurred while deleting');
        console.error('Delete FG Offer error:', error);
    });
}
function OpenModal() {
    $('#dvRemark').modal({ backdrop: 'static' });
    $('#dvRemark').modal('show');
}
function CloseModal() {
    $('#dvRemark').modal('hide');
    $('#txtRemark').val('');
    $('#hfCode').val(0);
}

window.CreateNew = CreateNew;
window.OpenModal = OpenModal;
window.CloseModal = CloseModal;
window.SaveRMInspectionRequest = SaveRMInspectionRequest;
window.EditRMInspectionRequest = EditRMInspectionRequest;
window.Back = Back;
window.FGOffer_OnlyNumeric = FGOffer_OnlyNumeric;
window.FGOffer_ValidateAndCalculateWeight = FGOffer_ValidateAndCalculateWeight;
window.DeleteFGOffer = DeleteFGOffer;
window.DeleteFGOfferModal = DeleteFGOfferModal;