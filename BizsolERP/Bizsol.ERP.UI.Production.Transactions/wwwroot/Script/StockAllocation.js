import { StockAllocationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_StockAllocationService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';
import { createObjectlistControlModal, initializeObjectlistControl } from '../../Bizsol.WebERP.UI.Shared/js/Pages/CustomControl/_ObjectListControlPage.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');


let G_RawMaterialDropDown = [];
let G_GetBOMMasterDataOrderWise = [];
let G_ClientOrderProjectData = [];
let G_IdentificationList = [];
let G_StockAllocationList = [];
let G_CurrentIdentificationRow = null;
let G_BomTransactionOrderWise_Code = 0;
let G_RMInspectionRequestMaster_Code = 0;

let G_DeleteContext = {
    type: '',
    code: 0,
    row: null 
};

let G_BalanceToInspectWt = 0;
let G_ToAllocateWt = 0;
let G_AllocatedWt = 0;
let G_InitialBalanceWt = 0;

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    GetRawMaterialDropDown();
    GetStockAllocationList();
    initCoilFilterInputs();
    $("#btnStockAllocationShow").click(function () {
        GetBOMMasterDataOrderWiselist();
    });

});
function GetBOMMasterDataOrderWiselist() {
    var ddlClientName = $("#ddlClientName").val();
    var ddlOrderNo = $("#ddlOrderNo").val();
    GetBOMMasterDataOrderWise(ddlClientName, ddlOrderNo)
}
function clearStockAllocationListGrid() {
    $('#table-header').empty();
    $('#table-body').empty();
    $('#paginator-tblStockAllocation').empty();
    $('#paginator-table-body').empty();
}

function GetStockAllocationList() {
    Showloader();
    StockAllocationService.GetStockAllocationList().then(function (response) {
        HideLoader();
        clearStockAllocationListGrid();

        if (response && response.length > 0) {
            G_StockAllocationList = Array.isArray(response) ? response : [];
            const stringFilterColumn = ["Order No", "Client Name", "Status"];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code", "BuyerPODetail_Code", "Thickness_Code", "Grade_Code", "BuyerPOMaster_Code"];
            const columnAlignment = {
            };
            const updatedResponse = (response).map(function (item) {
                let actionHtml = '<button class="btn btn-primary icon-height mb-1" title="Edit Stock Allocation" onclick="EditStockAllocation(' + item.Code + ')"><i class="fa fa-pencil"></i></button>';
                actionHtml += ' <button class="btn btn-danger icon-height mb-1" title="Delete Stock Allocation" onclick="DeleteStockAllocationClick(' + item.Code + ')"><i class="fa fa-trash"></i></button>';
                item.Action = actionHtml;
                return item;
            });

            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
        } else {
            G_StockAllocationList = [];
            toastr.info('No Data Found');
        }

    }).catch(function (error) {
        HideLoader();
        clearStockAllocationListGrid();
        toastr.error(error);
    });
}
function CreateNew() { 
    var ModuleName = "Stock Allocation",
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
    
            clearBOMMasterOrderWiseGrid();
            G_GetBOMMasterDataOrderWise = [];

            try {
                delete window[`hiddenColumns_table-bodyEditable`];
                delete window[`columnAlignment_table-bodyEditable`];
                delete window[`totalColumns_table-bodyEditable`];
                delete window[`floatingTotalRow_table-bodyEditable`];
                delete window[`button_tblStockAllocationEditable`];
                delete window[`ShowButtons_table-bodyEditable`];
                delete window[`filteredData_tblStockAllocationEditable`];
                delete window[`filteredDataTemp_tblStockAllocationEditable`];
                delete window[`currentPage_tblStockAllocationEditable`];
                delete window[`itemsPerPage_tblStockAllocationEditable`];
                delete window[`Paginator_tblStockAllocationEditable`];
            } catch (e) {
                console.log('Window variables cleanup:', e.message);
            }
            if ($.fn.select2) {
                if ($('#ddlClientName').hasClass('select2-hidden-accessible')) {
                    $('#ddlClientName').trigger('change.select2').val('0');
                }
                if ($('#ddlOrderNo').hasClass('select2-hidden-accessible')) {
                    $('#ddlOrderNo').trigger('change.select2').val('');
                }
            }
    
            HideGrid();
        }
    });
}
function ShowGrid() {
    $("#dvGrid").show();
    $("#dvFrom").hide();
    $("#saHeaderActions").show();
    $("#saPageHeader").removeClass("sa-list-header--with-filter");
}
function HideGrid() {
    $("#dvGrid").hide();
    $("#dvFrom").show();
    $("#saHeaderActions").hide();
    $("#saPageHeader").addClass("sa-list-header--with-filter");
}
function GetRawMaterialDropDown() {
    StockAllocationService.GetRawMaterialDropDown().then(function (response) {
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

    const select2Config = {
        width: '100%',
        dropdownParent: $(document.body)
    };

    try {
        if ($.fn.select2) {
            [$clientName, $orderNo].forEach(function ($dropdown) {
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
        } else {
            updateOrderDropdown(selectedClientCode);
            const currentOrder = $orderNo.val();
            if (currentOrder === '' || !isOrderValidForClient(currentOrder, selectedClientCode)) {
                $orderNo.val('');
                if ($.fn.select2 && $orderNo.hasClass('select2-hidden-accessible')) {
                    $orderNo.trigger('change.select2');
                }
            }
        }
    });

    $orderNo.off('change.clientOrderProject').on('change.clientOrderProject', function () {
        const selectedOrderNo = $(this).val();
        if (selectedOrderNo !== '') {
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
function clearBOMMasterOrderWiseGrid() {
    $('#table-headerEditable').empty();
    $('#table-bodyEditable').empty();
    $('#tblStockAllocationEditable tfoot').remove();
    $('#paginator-tblStockAllocationEditable').empty();
}

function forceRefreshEditableGridTotals() {
    const bodyId = 'table-bodyEditable';
    const tableId = 'tblStockAllocationEditable';
    const data = window[`filteredData_${tableId}`] || [];
    const $tfoot = $('#tfoot-' + bodyId);

    if (!data.length) {
        if ($tfoot.length) {
            $tfoot.empty();
        }
        return;
    }

    // Re-render so floating tfoot totals match current grid data
    if (typeof window.renderTable === 'function') {
        window.renderTable(data, bodyId, false);
    }
}

function bindBOMMasterOrderWiseGrid(response) {
    clearBOMMasterOrderWiseGrid();

    const list = Array.isArray(response) ? response : [];
    G_GetBOMMasterDataOrderWise = list;

    if (list.length === 0) {
        return;
    }

    const stringFilterColumn = ["Order No", "Mark No", "Grade", "Client Name","Section Size"];
    const numericFilterColumn = ["Width", "Thickness"];
    const dateFilterColumn = ["Order Date", "Dispatch Date"];
    const button = false;
    const stringDoubleFilterColumn = [];
    const showButtons = [];
    const hiddenColumns = ["BomTransactionOrderWise_Codes", "Code", "SortPriority", "BuyerPODetail_Code", "Thickness_Code", "Grade_Code", "BuyerPOMaster_Code", "EntryNo", "GodownMaster_Code", "AccountMaster_Code", "EntryDate", "InspectionDate"];
    const columnAlignment = {
        "Client Name": "left;min-width:240px;",
        "Order No": "left;min-width:100px;",
        "Width": "right;width:76px;min-width:76px;",
        "Thickness": "right;width:76px;min-width:76px;",
        "Grade": "left;min-width:120px;",
        "Qty(Wt.) To Allocate": "right;width:130px;min-width:130px;",
        "Allocated Qty(Wt.)": "right;width:110px;min-width:110px;",
        "Action": "center;width:52px;min-width:52px;max-width:56px;"
    };
    const totalColumns = ["Qty(Wt.) To Allocate", "Allocated Qty(Wt.)"];
    const updatedResponse = list.map(function (item) {
        const balanceToInspect = parseFloat(item["BalQty"] != null ? item["BalQty"] : item["Qty(Wt.) To Allocate"]) || 0;
        const actionHtml = '<button class="btn btn-primary icon-height mb-1 sa-grid-action-btn" title="Coil Details" onclick="UpdateCoilDetail('
            + item.Grade_Code + ',' + item.Code + ',' + balanceToInspect + ')"><i class="fa fa-pencil"></i></button>';

        // Place Action between Qty(Wt.) To Allocate and Allocated Qty(Wt.)
        const ordered = {};
        Object.keys(item).forEach(function (key) {
            if (key === 'Action') return;
            ordered[key] = item[key];
            if (key === 'Qty(Wt.) To Allocate') {
                ordered.Action = actionHtml;
            }
        });
        if (!ordered.hasOwnProperty('Action')) {
            ordered.Action = actionHtml;
        }
        return ordered;
    });

    BizsolCustomFilterGrid.CreateDataTable(
        "table-headerEditable",
        "table-bodyEditable",
        updatedResponse,
        button,
        showButtons,
        stringFilterColumn,
        numericFilterColumn,
        dateFilterColumn,
        stringDoubleFilterColumn,
        hiddenColumns,
        columnAlignment,
        false,
        totalColumns,
        null,
        null,
        false,
        true
    );
    forceRefreshEditableGridTotals();
    tightenEditableGridActionColumn();
}

function GetBOMMasterDataOrderWise(ddlClientName, ddlOrderNo) {
    Showloader();
    StockAllocationService.GetBOMMasterDataOrderWise(ddlClientName, ddlOrderNo, G_RMInspectionRequestMaster_Code).then(function (response) {
        HideLoader();
        if (response && response.length > 0) {
            bindBOMMasterOrderWiseGrid(response);
        } else {
            G_GetBOMMasterDataOrderWise = [];
            clearBOMMasterOrderWiseGrid();
            toastr.error('No Data Found');
        }
    }).catch(function () {
        HideLoader();
        G_GetBOMMasterDataOrderWise = [];
        clearBOMMasterOrderWiseGrid();
        toastr.error('No Data Found');
    });
}
function tightenEditableGridActionColumn() {
    const $ths = $('#table-headerEditable th');
    if (!$ths.length) {
        return;
    }

    $ths.each(function (index) {
        const label = (($(this).find('.filter-table-heading').text() || $(this).text() || '')).replace(/\s+/g, ' ').trim();
        if (label !== 'Action') {
            return;
        }

        const actionStyle = {
            width: '52px',
            minWidth: '52px',
            maxWidth: '56px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            paddingLeft: '4px',
            paddingRight: '4px'
        };

        $(this).css(actionStyle).addClass('sa-action-col');
        $('#table-bodyEditable tr').each(function () {
            $(this).children('td').eq(index).css(actionStyle).addClass('sa-action-col');
        });
        $('#tfoot-table-bodyEditable tr, #tblStockAllocationEditable tfoot tr').each(function () {
            $(this).children('td').eq(index).css(actionStyle).addClass('sa-action-col');
        });
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
            <th style="width:130px;">Order No To</th>
            <th style="width:90px;">Coil Wt.</th>
            <th style="width:220px;">Size</th>
            <th style="width:50px;">Action</th>
        </tr>`;

    $thead.html(headerHtml);
}
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

        // Build footer row (6 columns: SNo, Identification No, Order No To, Coil Wt., Size, Action)
        const footerHtml = `
            <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td></td>
                <td>Total</td>
                <td></td>
                <td style="text-align:right;">${total.toFixed(3)}</td>
                <td></td>
                <td></td>
            </tr>`;

        $tfoot.html(footerHtml);
        updateCoilAllocationSummaryFromGrid();
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

    const currentVal = ($identificationNo.val() || '').toString();
    const selectedIds = getSelectedIdentificationNos(excludeRow);

    $identificationNo.empty();
    $identificationNo.append($('<option>').val('').text('Select...'));

    (G_IdentificationList || []).forEach(function (item) {
        const idVal = (item.IdentificationNo || item.IdentificationNos || '').toString();
        if (!idVal) {
            return;
        }
        const $opt = $('<option>').val(idVal).text(idVal);
        if (selectedIds.indexOf(idVal) >= 0 && idVal !== currentVal) {
            $opt.prop('disabled', true);
        }
        $identificationNo.append($opt);
    });

    if (currentVal) {
        const hasCurrent = $identificationNo.find('option').filter(function () {
            return $(this).val() === currentVal;
        }).length > 0;
        if (!hasCurrent) {
            $identificationNo.append($('<option>').val(currentVal).text(currentVal));
        }
        $identificationNo.val(currentVal);
    } else {
        $identificationNo.val('');
    }

    // Refresh select2 after option rebuild (do not trigger change — avoids recursion)
    if ($.fn.select2 && $identificationNo.hasClass('select2-hidden-accessible')) {
        try {
            const keepVal = $identificationNo.val();
            $identificationNo.select2('destroy');
            if (keepVal) {
                $identificationNo.val(keepVal);
            }
            $identificationNo.select2({
                width: '100%',
                dropdownParent: $('#DetailModal'),
                placeholder: 'Select...',
                allowClear: true
            });
        } catch (e) {
            console.error('Error refreshing select2 for identification-no:', e);
        }
    }
}
function updateAllIdentificationDropdowns() {
    const $tbody = $('#DetailTable-body');
    if ($tbody && $tbody.length) {
        $tbody.find('tr.editable-row').each(function() {
            const $currentRow = $(this);
            const $identificationNo = $currentRow.find('.identification-no');
            if ($identificationNo && $identificationNo.length) {
                updateIdentificationDropdownOptions($identificationNo, $currentRow);
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

    const currentRowCount = $tbody.find('tr.editable-row').length;
    const newSNo = currentRowCount + 1;

    const defaultOrderNoTo = resolveOrderNoToForRow(null);
    const rowHtml = `
        <tr class="editable-row">
            <td class="row-sno">${newSNo}
                <input type="hidden" class="Code" value="0" />
                <input type="hidden" class="param-width-code" value="0" />
                <input type="hidden" class="param-thk-code" value="0" />
                <input type="hidden" class="param-grade-code" value="0" />
            </td>
            <td>
                <select class="form-control form-control-sm identification-no">
                    <option value="">Select...</option>
                </select>
            </td>
            <td>
                <input type="text" class="form-control form-control-sm order-no-to" readonly value="${defaultOrderNoTo.replace(/"/g, '&quot;')}" />
            </td>
            <td>
                <input type="text" class="form-control form-control-sm coil-wt text-end sa-coil-wt-readonly" readonly disabled />
            </td>
            <td>
                <input type="text" class="form-control form-control-sm coil-size" readonly />
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

    const ModuleName = "Stock Allocation";
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
            
            if ($.fn.select2 && $identificationNo.hasClass('select2-hidden-accessible')) {
                try {
                    $identificationNo.select2('destroy');
                } catch (e) {
                    console.error('Error destroying select2 for identification-no:', e);
                }
            }

            $row.remove();
            updateRowNumbers();
            updateButtonVisibility();
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

        StockAllocationService.DeleteStockAllocation(
            rowCode,
            encodeURIComponent(reasonForDelete),
            mode,
            ipAddress,
            location
        ).then(function (response) {
            if (response && response.Status === 'Y') {
                toastr.success(response.Msg || 'Detail row deleted successfully');
                const $identificationNo = $row.find('.identification-no');
                
                if ($.fn.select2 && $identificationNo.hasClass('select2-hidden-accessible')) {
                    try {
                        $identificationNo.select2('destroy');
                    } catch (e) {
                        console.error('Error destroying select2 for identification-no:', e);
                    }
                }

                $row.remove();
                updateRowNumbers();
                updateButtonVisibility();
                updateAllIdentificationDropdowns();
                updateDetailTableFooterSum();
                // Refresh parent grid + totals after detail delete
                GetBOMMasterDataOrderWiselist();
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
function getIdentificationParamCodes(item) {
    if (!item) {
        return { width: 0, thk: 0, grade: 0 };
    }
    return {
        width: parseInt(item.ItemParaMeterValueCode_Width ?? item.itemParameterValueCode_Width ?? item.ItemParameterValueCode_Width ?? 0, 10) || 0,
        thk: parseInt(item.ItemParaMeterValueCode_Thk ?? item.itemParameterValueCode_Thk ?? item.ItemParameterValueCode_Thk ?? 0, 10) || 0,
        grade: parseInt(item.ItemParaMeterValueCode_Grade ?? item.itemParameterValueCode_Grade ?? item.ItemParameterValueCode_Grade ?? 0, 10) || 0
    };
}

function getDetailIdentificationNo(detail) {
    if (!detail) {
        return '';
    }
    return (detail.IdentificationNo || detail.identificationNo || detail.IdentificationNos || detail.identificationNos || '').toString().trim();
}

function normalizeStockAllocationDetails(detailResponse) {
    if (!detailResponse) {
        return [];
    }
    if (Array.isArray(detailResponse)) {
        return detailResponse;
    }
    if (typeof detailResponse === 'object') {
        // Some APIs wrap list in a property
        if (Array.isArray(detailResponse.data)) {
            return detailResponse.data;
        }
        if (Array.isArray(detailResponse.Details)) {
            return detailResponse.Details;
        }
        if (Array.isArray(detailResponse.boMorderWiseStockAllocationDetails)) {
            return detailResponse.boMorderWiseStockAllocationDetails;
        }
        // Single detail object
        if (getDetailIdentificationNo(detailResponse) || detailResponse.Weight != null || detailResponse.weight != null) {
            return [detailResponse];
        }
    }
    return [];
}

/** Keep saved IDs in dropdown/list even when outside current Width/Thickness/Grade filter */
function mergeSavedDetailsIntoIdentificationList(details) {
    G_IdentificationList = Array.isArray(G_IdentificationList) ? G_IdentificationList : [];
    (details || []).forEach(function (detail) {
        const id = getDetailIdentificationNo(detail);
        if (!id) {
            return;
        }
        const existing = G_IdentificationList.find(function (item) {
            return String(item.IdentificationNo || item.IdentificationNos || '') === id;
        });
        const codes = getIdentificationParamCodes(detail);
        const size = detail.Size || detail.size || '';
        const weight = detail.Weight != null ? detail.Weight : (detail.weight != null ? detail.weight : 0);

        if (existing) {
            if (!existing.Size && size) {
                existing.Size = size;
            }
            if (!existing.BalQtyMT && weight) {
                existing.BalQtyMT = weight;
            }
            if (!existing.ItemParaMeterValueCode_Width && codes.width) {
                existing.ItemParaMeterValueCode_Width = codes.width;
            }
            if (!existing.ItemParaMeterValueCode_Thk && codes.thk) {
                existing.ItemParaMeterValueCode_Thk = codes.thk;
            }
            if (!existing.ItemParaMeterValueCode_Grade && codes.grade) {
                existing.ItemParaMeterValueCode_Grade = codes.grade;
            }
        } else {
            G_IdentificationList.push({
                IdentificationNo: id,
                BalQtyMT: weight,
                Size: size,
                ItemParaMeterValueCode_Width: codes.width,
                ItemParaMeterValueCode_Thk: codes.thk,
                ItemParaMeterValueCode_Grade: codes.grade
            });
        }
    });
}

function ensureIdentificationOption($identificationNo, identificationNo) {
    if (!$identificationNo || !$identificationNo.length || !identificationNo) {
        return;
    }
    const id = String(identificationNo);
    const hasOption = $identificationNo.find('option').filter(function () {
        return $(this).val() === id;
    }).length > 0;
    if (!hasOption) {
        $identificationNo.append($('<option>').val(id).text(id));
    }
}

function setRowIdentificationParamCodes($row, item) {
    const codes = getIdentificationParamCodes(item);
    $row.find('.param-width-code').val(codes.width);
    $row.find('.param-thk-code').val(codes.thk);
    $row.find('.param-grade-code').val(codes.grade);
}

function clearRowIdentificationParamCodes($row) {
    $row.find('.param-width-code').val('0');
    $row.find('.param-thk-code').val('0');
    $row.find('.param-grade-code').val('0');
}

function getStockAllocationEntryDate() {
    try {
        const currentDate = BizSolHelperFunction.getCurrentDate && BizSolHelperFunction.getCurrentDate();
        if (currentDate) {
            return currentDate;
        }
    } catch (e) { }
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return dd + '/' + mm + '/' + yyyy;
}

function initializeEditableRow($row, detail) {
    if (!$row || !$row.length) {
        return;
    }

    const $identificationNo = $row.find('.identification-no');
    const $orderNoTo = $row.find('.order-no-to');
    const $coilWt = $row.find('.coil-wt');
    const $coilSize = $row.find('.coil-size');
    const $addBtn = $row.find('.add-row-btn');
    const $deleteBtn = $row.find('.delete-row-btn');

    // Order No To: API value on edit; grid Order No for new rows
    if ($orderNoTo && $orderNoTo.length) {
        $orderNoTo.val(resolveOrderNoToForRow(detail));
    }

    // Bind Identification options from GetBOMMasterIdentificationNo result
    updateIdentificationDropdownOptions($identificationNo, $row);
    if ($.fn.select2 && $identificationNo && $identificationNo.length) {
        try {
            if ($identificationNo.hasClass('select2-hidden-accessible')) {
                $identificationNo.select2('destroy');
            }
            $identificationNo.select2({
                width: '100%',
                dropdownParent: $('#DetailModal'),
                placeholder: 'Select...',
                allowClear: true
            });
        } catch (e) {
            console.error('Error initializing select2 for identification-no:', e);
        }
    }

    function checkRowComplete() {
        const identificationVal = $identificationNo.val() || '';
        const coilWtVal = $coilWt.val() || '';

        const isComplete = identificationVal !== '' &&
                          coilWtVal !== '' &&
                          parseFloat(coilWtVal) > 0;

        if (isComplete) {
            $addBtn.prop('disabled', false).removeClass('disabled');
        } else {
            $addBtn.prop('disabled', true).addClass('disabled');
        }
    }

    // On Identification change, auto-set Size and Coil Wt. (read-only)
    function handleIdentificationChange() {
        const selectedId = $identificationNo.val() || '';
        
        const selectedIds = getSelectedIdentificationNos($row);
        if (selectedId && selectedIds.indexOf(selectedId) >= 0) {
            toastr.warning('This Identification No is already selected in another row. Please select a different one.');
            $identificationNo.val('');
            clearRowIdentificationParamCodes($row);
            $coilSize.val('');
            clearRowCoilWt($coilWt);
            return;
        }
        
        if (selectedId) {
            const match = (G_IdentificationList || []).find(function (item) {
                const idVal = item.IdentificationNo || item.IdentificationNos || '';
                return idVal === selectedId;
            });

            if (match) {
                setRowIdentificationParamCodes($row, match);
                $coilSize.val(match.Size || match.size || '');

                const idBalQty = parseFloat(match.BalQtyMT) || 0;
                $coilWt.data('id-bal-qty', idBalQty);

                const maxWt = getMaxCoilWtForRow($row, idBalQty);
                if (idBalQty > 0 && maxWt > 0 && idBalQty > maxWt) {
                    toastr.warning('Coil Wt. (' + formatAllocationWt(idBalQty) + ') exceeds available Balance (' + formatAllocationWt(maxWt) + ').');
                }

                setRowCoilWt($coilWt, idBalQty);
            }
        } else {
            clearRowIdentificationParamCodes($row);
            $coilSize.val('');
            clearRowCoilWt($coilWt);
        }
        
        updateAllIdentificationDropdowns();
        checkRowComplete();
        updateDetailTableFooterSum();
    }

    $identificationNo.off('change.identification').on('change.identification', handleIdentificationChange);

    $addBtn.off('click.addRow').on('click.addRow', function() {
        if (!$(this).prop('disabled')) {
            addNewEditableRow();
        }
    });

    $deleteBtn.off('click.deleteRow').on('click.deleteRow', function() {
        deleteEditableRow($row);
    });

    if (detail) {
        const existingIdentification = getDetailIdentificationNo(detail);
        const existingQty = detail.weight != null ? detail.weight : (detail.Weight != null ? detail.Weight : (detail.qtyMTOffer || detail.QtyMTOffer || ''));
        const existingSize = detail.Size || detail.size || '';

        setRowIdentificationParamCodes($row, detail);

        // Always keep saved Identification in dropdown, even outside filter range
        if (existingIdentification) {
            ensureIdentificationOption($identificationNo, existingIdentification);
            $identificationNo.val(existingIdentification);

            if ($.fn.select2 && $identificationNo.hasClass('select2-hidden-accessible')) {
                $identificationNo.trigger('change.select2');
            }
        }

        if (existingSize) {
            $coilSize.val(existingSize);
        }

        if ($identificationNo.val()) {
            setRowIdentificationParamCodes($row, detail);

            const match = (G_IdentificationList || []).find(function (item) {
                const idVal = item.IdentificationNo || item.IdentificationNos || '';
                return idVal === $identificationNo.val();
            });
            const idBalQty = match ? (parseFloat(match.BalQtyMT) || 0) : (parseFloat(existingQty) || 0);
            $coilWt.data('id-bal-qty', idBalQty);
            setRowCoilWt($coilWt, existingQty !== '' ? existingQty : idBalQty);

            if (existingSize) {
                $coilSize.val(existingSize);
            }
        }

        updateDetailTableFooterSum();
        checkRowComplete();
    } else {
        checkRowComplete();
    }
}
function bindEmptyEditableRow() {
    const $tbody = $('#DetailTable-body');
    if (!$tbody || !$tbody.length) {
        return;
    }

    const defaultOrderNoTo = resolveOrderNoToForRow(null);
    const rowHtml = `
        <tr class="editable-row">
            <td class="row-sno">1
                <input type="hidden" class="Code" value="0" />
                <input type="hidden" class="param-width-code" value="0" />
                <input type="hidden" class="param-thk-code" value="0" />
                <input type="hidden" class="param-grade-code" value="0" />
            </td>
            <td>
                <select class="form-control form-control-sm identification-no">
                    <option value="">Select...</option>
                </select>
            </td>
            <td>
                <input type="text" class="form-control form-control-sm order-no-to" readonly value="${defaultOrderNoTo.replace(/"/g, '&quot;')}" />
            </td>
            <td>
                <input type="text" class="form-control form-control-sm coil-wt text-end sa-coil-wt-readonly" readonly disabled />
            </td>
            <td>
                <input type="text" class="form-control form-control-sm coil-size" readonly />
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

    const details = normalizeStockAllocationDetails(detailResponse);
    if (details.length === 0) {
        bindEmptyEditableRow();
        return;
    }

    mergeSavedDetailsIntoIdentificationList(details);
    $tbody.empty();

    details.forEach(function (detail, index) {
        const verifyStatus = detail.Verify || detail.verify || 'N';
        const isLocked = verifyStatus !== 'N';
        const lockedClass = isLocked ? 'locked-row' : '';
        
        const paramCodes = getIdentificationParamCodes(detail);
        const orderNoTo = resolveOrderNoToForRow(detail).replace(/"/g, '&quot;');
        const rowHtml = `
            <tr class="editable-row ${lockedClass}">
                <td class="row-sno">${index + 1}
                    <input type="hidden" class="Code" value="${detail.Code || 0}" />
                    <input type="hidden" class="Verify" value="${verifyStatus}" />
                    <input type="hidden" class="param-width-code" value="${paramCodes.width}" />
                    <input type="hidden" class="param-thk-code" value="${paramCodes.thk}" />
                    <input type="hidden" class="param-grade-code" value="${paramCodes.grade}" />
                </td>
                <td>
                    <select class="form-control form-control-sm identification-no" ${isLocked ? 'disabled' : ''}>
                        <option value="">Select...</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm order-no-to" readonly value="${orderNoTo}" />
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm coil-wt text-end sa-coil-wt-readonly" readonly disabled />
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm coil-size" readonly />
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
            
            // Coil Wt. is always read-only
            $coilWt.prop('readonly', true).addClass('sa-coil-wt-readonly');
            
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
function limitFilterSixChars($input) {
    let val = ($input.val() || '').toString();
    // allow digits and one decimal point, max 6 chars
    val = val.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
        val = parts[0] + '.' + parts.slice(1).join('');
    }
    if (val.length > 6) {
        val = val.substring(0, 6);
    }
    $input.val(val);
}
function initCoilFilterInputs() {
    $('.sa-filter-6').off('input.sa6').on('input.sa6', function () {
        limitFilterSixChars($(this));
    });

    $('#btnGradeDropdown').off('click.saGrade').on('click.saGrade', function (e) {
        e.stopPropagation();
        const $menu = $('#ddlGradeCheckList');
        $menu.toggle();
        if ($menu.is(':visible')) {
            $('#txtGradeSearch').val('').trigger('input').focus();
        }
    });

    $('#txtGradeSearch').off('input.saGrade').on('input.saGrade', function () {
        const q = ($(this).val() || '').toString().toLowerCase();
        $('#saGradeCheckItems .sa-grade-dd-item').each(function () {
            const text = ($(this).data('grade') || '').toString().toLowerCase();
            $(this).toggle(!q || text.indexOf(q) >= 0);
        });
    });

    $(document).off('click.saGradeClose').on('click.saGradeClose', function (e) {
        if (!$(e.target).closest('#saGradeDropdown').length) {
            $('#ddlGradeCheckList').hide();
        }
    });

    $('#ddlGradeCheckList').off('click.saGradeStop').on('click.saGradeStop', function (e) {
        e.stopPropagation();
    });
}
function getUniqueGradesFromGrid() {
    const grades = [];
    const map = new Map();
    (G_GetBOMMasterDataOrderWise || []).forEach(function (item) {
        const grade = (item.Grade != null ? item.Grade : item['Grade'] || '').toString().trim();
        if (grade && !map.has(grade.toLowerCase())) {
            map.set(grade.toLowerCase(), true);
            grades.push(grade);
        }
    });
    grades.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    return grades;
}
function bindGradeCheckboxDropdown(selectedGrades) {
    const grades = getUniqueGradesFromGrid();
    const selected = (selectedGrades || []).map(function (g) { return String(g).toLowerCase(); });
    const $items = $('#saGradeCheckItems');
    $items.empty();

    if (grades.length === 0) {
        $items.html('<div class="px-3 py-2 text-muted" style="font-size:0.8rem;">No grades available</div>');
        updateGradeSelectedText();
        return;
    }

    grades.forEach(function (grade, idx) {
        const id = 'saGradeChk_' + idx;
        const isChecked = selected.indexOf(grade.toLowerCase()) >= 0;
        const $label = $('<label class="sa-grade-dd-item"></label>').attr('data-grade', grade);
        const $chk = $('<input type="checkbox" class="sa-grade-chk" />').attr('id', id).val(grade).prop('checked', isChecked);
        const $span = $('<span></span>').text(grade);
        $label.append($chk).append($span);
        $items.append($label);
    });

    $items.find('.sa-grade-chk').off('change.saGrade').on('change.saGrade', function () {
        updateGradeSelectedText();
    });
    updateGradeSelectedText();
}
function getSelectedGrades() {
    const grades = [];
    $('#saGradeCheckItems .sa-grade-chk:checked').each(function () {
        const v = ($(this).val() || '').toString().trim();
        if (v) grades.push(v);
    });
    return grades;
}
function updateGradeSelectedText() {
    const grades = getSelectedGrades();
    const $text = $('#saGradeSelectedText');
    if (grades.length === 0) {
        $text.text('Select Grade...');
    } else if (grades.length === 1) {
        $text.text(grades[0]);
    } else {
        $text.text(grades.length + ' grades selected');
    }
}
function getCoilFilterValues() {
    const grades = getSelectedGrades();
    return {
        WidthFrom: ($('#txtWidthFrom').val() || '').toString().trim().substring(0, 6),
        WidthTo: ($('#txtWidthTo').val() || '').toString().trim().substring(0, 6),
        ThicknessFrom: ($('#txtThicknessFrom').val() || '').toString().trim().substring(0, 6),
        ThicknessTo: ($('#txtThicknessTo').val() || '').toString().trim().substring(0, 6),
        Grades: grades,
        GradesCsv: grades.join(',')
    };
}
function fillCoilFiltersFromRow(row) {
    const width = row ? (row.Width != null ? row.Width : row['Width']) : '';
    const thickness = row ? (row.Thickness != null ? row.Thickness : row['Thickness']) : '';
    const grade = row ? (row.Grade != null ? row.Grade : row['Grade']) : '';

    const widthStr = width !== '' && width != null ? String(width).substring(0, 6) : '';
    const thickStr = thickness !== '' && thickness != null ? String(thickness).substring(0, 6) : '';

    $('#txtWidthFrom').val(widthStr);
    $('#txtWidthTo').val(widthStr);
    $('#txtThicknessFrom').val(thickStr);
    $('#txtThicknessTo').val(thickStr);

    bindGradeCheckboxDropdown(grade ? [grade] : []);
    $('#ddlGradeCheckList').hide();
}

function getStockAllocationEntryNoDisplay() {
    const masterCode = G_RMInspectionRequestMaster_Code || 0;
    if (!masterCode) {
        return '';
    }
    const listRow = (G_StockAllocationList || []).find(function (r) {
        return String(r.Code) === String(masterCode);
    });
    if (listRow) {
        return listRow['Entry No'] != null ? listRow['Entry No']
            : (listRow.EntryNo != null ? listRow.EntryNo
                : (listRow.Entry_No != null ? listRow.Entry_No : masterCode));
    }
    return masterCode;
}

function getCurrentGridOrderNo() {
    const currentGridRow = Array.isArray(G_GetBOMMasterDataOrderWise)
        ? G_GetBOMMasterDataOrderWise.find(function (r) { return String(r.Code) === String(G_BomTransactionOrderWise_Code); })
        : null;
    if (!currentGridRow) {
        return '';
    }
    const orderNo = currentGridRow['Order No'] != null ? currentGridRow['Order No']
        : (currentGridRow.OrderNo != null ? currentGridRow.OrderNo
            : (currentGridRow.Order_No != null ? currentGridRow.Order_No : ''));
    return orderNo != null ? String(orderNo) : '';
}

function getOrderNoToFromDetail(detail) {
    if (!detail) {
        return '';
    }
    const orderNoTo = detail['Order no To'] != null ? detail['Order no To']
        : (detail['Order No To'] != null ? detail['Order No To']
            : (detail.OrderNoTo != null ? detail.OrderNoTo
                : (detail.orderNoTo != null ? detail.orderNoTo : '')));
    return orderNoTo != null ? String(orderNoTo) : '';
}

/** Edit: API Order No To; New row: current BOM grid Order No */
function resolveOrderNoToForRow(detail) {
    const fromApi = getOrderNoToFromDetail(detail);
    if (fromApi !== '') {
        return fromApi;
    }
    return getCurrentGridOrderNo();
}

function getCurrentGridAllocationInfo() {
    const currentGridRow = Array.isArray(G_GetBOMMasterDataOrderWise)
        ? G_GetBOMMasterDataOrderWise.find(function (r) { return String(r.Code) === String(G_BomTransactionOrderWise_Code); })
        : null;

    if (!currentGridRow) {
        return {
            toAllocate: G_ToAllocateWt || 0,
            allocated: G_AllocatedWt || 0,
            balance: G_BalanceToInspectWt || 0
        };
    }

    const toAllocate = parseFloat(currentGridRow['Qty(Wt.) To Allocate']) || 0;
    const allocated = parseFloat(currentGridRow['Allocated Qty(Wt.)']) || 0;
    const balance = parseFloat(
        currentGridRow.BalQty != null ? currentGridRow.BalQty : (toAllocate - allocated)
    ) || 0;

    return { toAllocate: toAllocate, allocated: allocated, balance: balance };
}

function formatAllocationWt(value) {
    const num = parseFloat(value) || 0;
    return num.toFixed(3);
}

function fillCoilAllocationSummary() {
    const info = getCurrentGridAllocationInfo();
    G_ToAllocateWt = info.toAllocate;
    G_InitialBalanceWt = info.balance;
    G_AllocatedWt = info.allocated;
    G_BalanceToInspectWt = info.balance;

    $('#txtToAllocateWt').val(formatAllocationWt(info.toAllocate));
    updateCoilAllocationSummaryFromGrid();
}

function updateCoilAllocationSummaryFromGrid() {
    const toAllocate = G_ToAllocateWt || parseFloat($('#txtToAllocateWt').val()) || 0;
    const allocated = getTotalCoilWtExcludingRow(null);
    const balance = Math.max(0, toAllocate - allocated);

    G_AllocatedWt = allocated;
    G_BalanceToInspectWt = balance;

    $('#txtAllocatedWt').val(formatAllocationWt(allocated));
    $('#txtBalanceWt').val(formatAllocationWt(balance));
}

function clearCoilAllocationSummary() {
    G_ToAllocateWt = 0;
    G_AllocatedWt = 0;
    G_InitialBalanceWt = 0;
    G_BalanceToInspectWt = 0;
    $('#txtToAllocateWt').val('');
    $('#txtAllocatedWt').val('');
    $('#txtBalanceWt').val('');
}

function getTotalCoilWtExcludingRow(excludeRow) {
    let total = 0;
    const $tbody = $('#DetailTable-body');
    if (!$tbody || !$tbody.length) {
        return 0;
    }

    $tbody.find('tr.editable-row').each(function () {
        if (excludeRow && this === excludeRow[0]) {
            return;
        }
        total += parseFloat($(this).find('.coil-wt').val()) || 0;
    });
    return total;
}

function getRemainingBalanceForRow(excludeRow) {
    const maxAllowed = G_InitialBalanceWt > 0 ? G_InitialBalanceWt : (G_ToAllocateWt || 0);
    const usedByOthers = getTotalCoilWtExcludingRow(excludeRow);
    return Math.max(0, maxAllowed - usedByOthers);
}

function setRowCoilWt($coilWt, weight) {
    if (!$coilWt || !$coilWt.length) {
        return;
    }

    const wt = parseFloat(weight) || 0;
    $coilWt
        .val(wt > 0 ? formatAllocationWt(wt) : '')
        .prop('readonly', true)
        .prop('disabled', false)
        .addClass('sa-coil-wt-readonly');
}

function clearRowCoilWt($coilWt) {
    if (!$coilWt || !$coilWt.length) {
        return;
    }

    $coilWt
        .val('')
        .prop('readonly', true)
        .prop('disabled', true)
        .removeClass('sa-coil-wt-readonly')
        .removeData('id-bal-qty');
}

function getMaxCoilWtForRow($row, identificationBalQty) {
    const remainingBalance = getRemainingBalanceForRow($row);
    const idBalQty = parseFloat(identificationBalQty) || 0;

    if (idBalQty > 0 && remainingBalance > 0) {
        return Math.min(remainingBalance, idBalQty);
    }
    if (idBalQty > 0) {
        return idBalQty;
    }
    return remainingBalance;
}

function fillCoilModalInfo() {
    $('#txtCoilEntryNo').val(getStockAllocationEntryNoDisplay());
    fillCoilAllocationSummary();
}

function clearCoilModalInfo() {
    $('#txtCoilEntryNo').val('');
    clearCoilAllocationSummary();
}
function filterIdentificationListByRange(list) {
    const f = getCoilFilterValues();
    const widthFrom = parseFloat(f.WidthFrom);
    const widthTo = parseFloat(f.WidthTo);
    const thickFrom = parseFloat(f.ThicknessFrom);
    const thickTo = parseFloat(f.ThicknessTo);
    const selectedGrades = (f.Grades || []).map(function (g) { return g.toLowerCase(); });

    return (Array.isArray(list) ? list : []).filter(function (item) {
        const w = parseFloat(item.Width != null ? item.Width : item['Width']);
        const t = parseFloat(item.Thickness != null ? item.Thickness : item['Thickness']);
        const g = String(item.Grade != null ? item.Grade : (item['Grade'] || '')).toLowerCase();

        if (!isNaN(widthFrom) && !isNaN(w) && w < widthFrom) return false;
        if (!isNaN(widthTo) && !isNaN(w) && w > widthTo) return false;
        if (!isNaN(thickFrom) && !isNaN(t) && t < thickFrom) return false;
        if (!isNaN(thickTo) && !isNaN(t) && t > thickTo) return false;

        if (selectedGrades.length > 0 && selectedGrades.indexOf(g) < 0) {
            return false;
        }
        return true;
    });
}
function loadIdentificationList(keepDetailRows) {
    const f = getCoilFilterValues();
    return StockAllocationService.GetBOMMasterIdentificationNo(
        G_BomTransactionOrderWise_Code,
        f.WidthFrom,
        f.WidthTo,
        f.ThicknessFrom,
        f.ThicknessTo,
        f.GradesCsv
    ).then(function (response) {
        let list = Array.isArray(response) ? response : [];
        if (list.length > 0 && (list[0].Width != null || list[0].Thickness != null || list[0].Grade != null)) {
            list = filterIdentificationListByRange(list);
        }
        G_IdentificationList = list;

        if (!keepDetailRows) {
            clearDetailTable();
            buildDetailTableHeader();
            bindEmptyEditableRow();
        }
        return G_IdentificationList;
    });
}
function FetchIdentificationByFilter() {
    if (!G_BomTransactionOrderWise_Code) {
        toastr.error('Please open coil details from a grid row first');
        return;
    }
    const f = getCoilFilterValues();
    if (!f.WidthFrom && !f.WidthTo && !f.ThicknessFrom && !f.ThicknessTo && f.Grades.length === 0) {
        toastr.warning('Please enter Width / Thickness / Grade filter');
        return;
    }
    if (f.Grades.length === 0) {
        toastr.warning('Please select at least one Grade');
        return;
    }
    Showloader();
    // Keep existing coil detail rows; open pick modal with ID / Weight / Size
    loadIdentificationList(true).then(function (list) {
        HideLoader();
        if (!list || list.length === 0) {
            toastr.warning('No Identification found for selected Width, Thickness and Grade');
            return;
        }
        updateAllIdentificationDropdowns();
        ShowIdentificationPickModal();
    }).catch(function () {
        HideLoader();
        G_IdentificationList = [];
        toastr.error('No Identification data found');
    });
}
function UpdateCoilDetail(Grade_Code, Code, balanceToInspectWt) {
    var ModuleName = "Stock Allocation",
        OptionName = "Edit",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            G_BalanceToInspectWt = parseFloat(balanceToInspectWt) || 0;
            G_BomTransactionOrderWise_Code = Code;

            const gridRow = Array.isArray(G_GetBOMMasterDataOrderWise)
                ? G_GetBOMMasterDataOrderWise.find(function (r) { return String(r.Code) === String(Code); })
                : null;
            if (gridRow) {
                G_ToAllocateWt = parseFloat(gridRow['Qty(Wt.) To Allocate']) || 0;
                G_AllocatedWt = parseFloat(gridRow['Allocated Qty(Wt.)']) || 0;
                G_InitialBalanceWt = parseFloat(
                    gridRow.BalQty != null ? gridRow.BalQty : (G_ToAllocateWt - G_AllocatedWt)
                ) || 0;
                G_BalanceToInspectWt = G_InitialBalanceWt;
            }
            fillCoilFiltersFromRow(gridRow);

            Showloader();
            loadIdentificationList(true).then(function () {
                clearDetailTable();
                buildDetailTableHeader();

                StockAllocationService.GetRMInspectionRequestDetailsEdit(G_RMInspectionRequestMaster_Code, G_BomTransactionOrderWise_Code).then(function (detailResponse) {
                    let details = normalizeStockAllocationDetails(detailResponse);
                    // Only filter by BOM order-wise code when that key exists
                    const hasBomKey = details.length > 0 && (
                        ('bomTransactionOrderWise_Code' in details[0]) ||
                        ('BomTransactionOrderWise_Code' in details[0])
                    );

                    if (hasBomKey) {
                        details = details.filter(function (d) {
                            const val = d.bomTransactionOrderWise_Code != null ? d.bomTransactionOrderWise_Code : d.BomTransactionOrderWise_Code;
                            return String(val) === String(G_BomTransactionOrderWise_Code);
                        });
                    }

                    mergeSavedDetailsIntoIdentificationList(details);
                    fillCoilModalInfo();

                    if (details.length > 0) {
                        bindExistingEditableRows(details);
                    } else {
                        bindEmptyEditableRow();
                    }

                    HideLoader();
                    OpenModal();
                }).catch(function () {
                    fillCoilModalInfo();
                    bindEmptyEditableRow();
                    HideLoader();
                    OpenModal();
                });
            }).catch(function () {
                toastr.error('No Data Found');
                G_IdentificationList = [];
                clearDetailTable();
                buildDetailTableHeader();
                fillCoilModalInfo();
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
    try {
        $('#dvRemark').modal('hide');
    } catch (e) { }
    $('#txtRemark').val('');
    $('#hfCode').val('');
    $('#txtWidthFrom, #txtWidthTo, #txtThicknessFrom, #txtThicknessTo').val('');
    clearCoilModalInfo();
    $('#saGradeCheckItems').empty();
    $('#saGradeSelectedText').text('Select Grade...');
    $('#ddlGradeCheckList').hide();
    $('#txtGradeSearch').val('');
    G_DeleteContext = { type: '', code: 0, row: null };
}
function SaveStockAllocation() {
    let userMaster_Code = 0;
    try {
        const userDetails = JSON.parse(sessionStorage.getItem('UserDetails'));
        if (userDetails && userDetails.length > 0 && userDetails[0].Code) {
            userMaster_Code = userDetails[0].Code;
        }
        if (!userMaster_Code) {
            const authKey = JSON.parse(sessionStorage.getItem('authKey') || '{}');
            userMaster_Code = authKey.UserMaster_Code || 0;
        }
    } catch (e) {
        console.error('Error getting user details:', e);
        toastr.error('Unable to get user details');
        return;
    }

    const currentGridRow = Array.isArray(G_GetBOMMasterDataOrderWise)
        ? G_GetBOMMasterDataOrderWise.find(function (r) { return String(r.Code) === String(G_BomTransactionOrderWise_Code); })
        : null;
    const buyerPOMaster_Code = currentGridRow
        ? (currentGridRow.BuyerPOMaster_Code || currentGridRow.buyerPOMaster_Code || 0)
        : 0;

    const $tbody = $('#DetailTable-body');
    const detailRows = [];
    let validationError = false;
    
    if ($tbody && $tbody.length) {
        $tbody.find('tr.editable-row').each(function () {
            if (validationError) {
                return false;
            }
            
            const $row = $(this);
            const identificationNo = $row.find('.identification-no').val() || '';
            const coilWt = parseFloat($row.find('.coil-wt').val()) || 0;
            const orderNoTo = ($row.find('.order-no-to').val() || '').toString().trim() || getCurrentGridOrderNo();
            const widthCode = parseInt($row.find('.param-width-code').val(), 10) || 0;
            const thkCode = parseInt($row.find('.param-thk-code').val(), 10) || 0;
            const gradeCode = parseInt($row.find('.param-grade-code').val(), 10) || 0;

            if (identificationNo !== '' && coilWt > 0) {
                const maxWt = getMaxCoilWtForRow($row, $row.find('.coil-wt').data('id-bal-qty'));
                if (maxWt > 0 && coilWt > maxWt) {
                    toastr.error('Coil Wt. (' + formatAllocationWt(coilWt) + ') for Identification ' + identificationNo + ' exceeds available Balance (' + formatAllocationWt(maxWt) + ').');
                    validationError = true;
                    return false;
                }
                
                detailRows.push({
                    boMorderWiseStockAllocationMaster_Code: G_RMInspectionRequestMaster_Code || 0,
                    buyerPOMaster_Code: buyerPOMaster_Code,
                    itemParameterValueCode_Width: widthCode,
                    itemParameterValueCode_Thk: thkCode,
                    itemParameterValueCode_Grade: gradeCode,
                    identificationNo: identificationNo,
                    weight: coilWt,
                    orderNoTo: orderNoTo
                });
            }
        });
    }
    
    if (validationError) {
        return;
    }

    if (detailRows.length === 0) {
        toastr.error('Please add at least one valid detail row with all fields filled');
        return;
    }

    try {
        const totalCoilWt = detailRows.reduce(function (sum, item) {
            return sum + (parseFloat(item.weight) || 0);
        }, 0);

        const maxAllowed = G_InitialBalanceWt > 0 ? G_InitialBalanceWt : G_ToAllocateWt;
        if (maxAllowed > 0 && totalCoilWt > maxAllowed) {
            toastr.error('Total Coil Wt. (' + formatAllocationWt(totalCoilWt) + ') cannot be greater than Balance (Wt.) (' + formatAllocationWt(maxAllowed) + ').');
            return;
        }
    } catch (e) {
        console.error('Error validating Coil Wt. total vs Balance to Inspect (Wt.):', e);
    }

    const saveData = {
        boMorderWiseStockAllocationMaster: [
            {
                code: G_RMInspectionRequestMaster_Code || 0,
                entryDate: getStockAllocationEntryDate(),
                userMaster_Code: userMaster_Code
            }
        ],
        boMorderWiseStockAllocationDetails: detailRows
    };

    Showloader();
    StockAllocationService.SaveStockAllocation(saveData).then(function (response) {
        HideLoader();
        if (response && response.Status == "Y") {
            toastr.success(response.Msg);
            CloseModal();
            G_RMInspectionRequestMaster_Code = response.Code;
            GetBOMMasterDataOrderWiselist();
        } else {
            const errorMessage = response && (response.Msg || response.message) ? (response.Msg || response.message) : 'Failed to save data';
            toastr.error(errorMessage);
        }
    }).catch(function (error) {
        HideLoader();
        const errorMessage = error && error.message ? error.message : 'Error occurred while saving data';
        toastr.error(errorMessage);
        console.error('Save error:', error);
    });
}
function EditStockAllocation(Code) {
    var ModuleName = "Stock Allocation",
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
    clearBOMMasterOrderWiseGrid();
    G_GetBOMMasterDataOrderWise = [];

    try {
        delete window[`hiddenColumns_table-bodyEditable`];
        delete window[`columnAlignment_table-bodyEditable`];
        delete window[`totalColumns_table-bodyEditable`];
        delete window[`floatingTotalRow_table-bodyEditable`];
        delete window[`button_tblStockAllocationEditable`];
        delete window[`ShowButtons_table-bodyEditable`];
        delete window[`filteredData_tblStockAllocationEditable`];
        delete window[`filteredDataTemp_tblStockAllocationEditable`];
        delete window[`currentPage_tblStockAllocationEditable`];
        delete window[`itemsPerPage_tblStockAllocationEditable`];
        delete window[`Paginator_tblStockAllocationEditable`];
    } catch (e) {
        console.log('Window variables cleanup:', e.message);
    }
    
    if ($.fn.select2) {
        if ($('#ddlClientName').hasClass('select2-hidden-accessible')) {
            $('#ddlClientName').trigger('change.select2').val("0");
        }
        if ($('#ddlOrderNo').hasClass('select2-hidden-accessible')) {
            $('#ddlOrderNo').trigger('change.select2').val("");
        }
    }
    
    GetStockAllocationList();
    ShowGrid();
}
function DeleteStockAllocationClick(Code) {
    if (!Code) {
        return;
    }
    const ModuleName = "Stock Allocation";
    const OptionName = "Delete";
    const ShowMsg = "Y";
    const FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck && respCheck.CheckModuleOptionRight === 'N') {
            toastr.error(respCheck.Msg || 'You do not have permission to delete.');
            return;
        }

        if (!confirm('Are you sure you want to delete this Stock Allocation?')) {
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
function DeleteStockAllocation() {
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

    StockAllocationService.DeleteStockAllocation(
        code,
        encodeURIComponent(remark),
        mode,
        ipAddress,
        location
    ).then(function (response) {
        if (response && response.Status === 'Y') {
            toastr.success(response.Msg || 'Deleted successfully');

            // Master delete: refresh main grid
            GetStockAllocationList();

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
        console.error('DeleteStockAllocation error:', error);
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
function ShowIdentificationPickModal() {
    if (!G_IdentificationList || G_IdentificationList.length === 0) {
        toastr.warning('No Identification data available. Please click Show first.');
        return;
    }

    const selectedIds = getSelectedIdentificationNos(null);
    const pickData = (G_IdentificationList || [])
        .filter(function (item) {
            const id = (item.IdentificationNo || item.IdentificationNos || '').toString();
            return id !== '' && selectedIds.indexOf(id) < 0;
        })
        .map(function (item) {
            const codes = getIdentificationParamCodes(item);
            return {
                IdentificationNo: item.IdentificationNo || item.IdentificationNos || '',
                BalQtyMT: item.BalQtyMT != null ? item.BalQtyMT : 0,
                Size: item.Size || item.size || '',
                ItemParaMeterValueCode_Width: codes.width,
                ItemParaMeterValueCode_Thk: codes.thk,
                ItemParaMeterValueCode_Grade: codes.grade
            };
        });

    if (pickData.length === 0) {
        toastr.warning('No available Identification to add (all already selected or none found)');
        return;
    }

    const options = {
        ModalId: 'IdentificationControlmodal',
        searchvalue: '.',
        MultiSelect: true,
        ClientOrderProjectData: pickData,
        CallBackFunctionName_btnDone: 'onIdentificationSelected',
        DefaultColumnfilter: 'IdentificationNo',
        NumericColumns: ['BalQtyMT'],
        ModalTitle: 'Select Coil / Identification',
        DoneButtonText: 'Add',
        Columns: [
            { field: 'IdentificationNo', header: 'Identification No' },
            { field: 'BalQtyMT', header: 'Weight' },
            { field: 'Size', header: 'Size' },
            { field: 'ItemParaMeterValueCode_Width', visible: false },
            { field: 'ItemParaMeterValueCode_Thk', visible: false },
            { field: 'ItemParaMeterValueCode_Grade', visible: false }
        ]
    };
    initializeObjectlistControl(options);
    applyIdentificationModalTheme();
}

function applyIdentificationModalTheme() {
    const $modal = $('#IdentificationControlmodal');
    if (!$modal.length) {
        return;
    }

    $modal.addClass('sa-objlist-modal rps-detail-modal');

    const $header = $modal.find('.modal-header');
    if ($header.length && $header.find('.modal-close, .close, [data-bs-dismiss="modal"]').length === 0) {
        $header.css('display', 'flex').append(
            '<button type="button" class="modal-close" data-bs-dismiss="modal" aria-label="Close">' +
            '<span aria-hidden="true">&times;</span></button>'
        );
    }

    // Ensure footer Close uses themed button classes
    $modal.find('a.btn-danger').addClass('btn-height');
}
function ShowIdentificationModal(value) {
    // Keep for compatibility; Show filter uses ShowIdentificationPickModal
    if (value !== undefined && value !== null && String(value).trim() !== '') {
        G_CurrentIdentificationRow = G_CurrentIdentificationRow || $('#DetailTable-body tr.editable-row').last();
    }
    ShowIdentificationPickModal();
}
function ShowObjectlistControlModal(value) {
    if (G_GetBOMMasterDataOrderWise.length > 0) {
        const options = {
            ModalId: 'DivControlmodal',
            searchvalue: value,
            MultiSelect: true,
            NoOfHideColumn: 1,
            ClientOrderProjectData: G_GetBOMMasterDataOrderWise,
            CallBackFunctionName_btnDone: 'onSelectedRowApplied',
            DefaultColumnfilter: 'Order No',
            NumericColumns: ["Offer Qty","P.O. Qty(Wt.)"],
            Columns: [
                { field: 'Code', visible: false }
            ]
        };
        initializeObjectlistControl(options);
    }
}

window.onIdentificationSelected = function (response) {
    if (!response || response.length === 0) {
        return;
    }

    const $tbody = $('#DetailTable-body');
    if (!$tbody.length) {
        return;
    }

    if (!$('#DetailTable-head').children().length) {
        buildDetailTableHeader();
    }
    if ($tbody.find('tr.editable-row').length === 0) {
        bindEmptyEditableRow();
    }

    let addedCount = 0;

    response.forEach(function (item) {
        const identNo = (item.IdentificationNo || item.IdentificationNos || '').toString();
        if (!identNo) {
            return;
        }

        const alreadySelected = getSelectedIdentificationNos(null);
        if (alreadySelected.indexOf(identNo) >= 0) {
            toastr.warning(identNo + ' is already added');
            return;
        }

        let $targetRow;
        const $lastRow = $tbody.find('tr.editable-row').last();
        const lastVal = ($lastRow.find('.identification-no').val() || '').toString();

        if (lastVal === '') {
            $targetRow = $lastRow;
        } else {
            addNewEditableRow();
            $targetRow = $tbody.find('tr.editable-row').last();
        }

        const sizeVal = item.Size || item.size || '';
        const $ident = $targetRow.find('.identification-no');
        const hasOption = $ident.find('option').filter(function () {
            return $(this).val() === identNo;
        }).length > 0;
        if (!hasOption) {
            $ident.append($('<option>').val(identNo).text(identNo));
        }

        $targetRow.find('.coil-size').val(sizeVal);
        // New selection: Order No To = current BOM grid Order No
        $targetRow.find('.order-no-to').val(getCurrentGridOrderNo());
        setRowIdentificationParamCodes($targetRow, item);
        $ident.val(identNo).trigger('change.identification');
        // Keep codes/size from selected modal row if list lookup did not overwrite
        setRowIdentificationParamCodes($targetRow, item);
        $targetRow.find('.coil-size').val(sizeVal);
        $targetRow.find('.order-no-to').val(getCurrentGridOrderNo());
        addedCount++;
    });

    G_CurrentIdentificationRow = null;

    const $last = $tbody.find('tr.editable-row').last();
    if ($last.length && (($last.find('.identification-no').val() || '') !== '')) {
        addNewEditableRow();
    }

    updateButtonVisibility();
    updateDetailTableFooterSum();

    if (addedCount > 0) {
        toastr.success(addedCount + ' coil(s) added to Coil Details');
    }
};

window.onSelectedRowApplied = function (response) {
    if (response && response.length > 0) {
    } else {
    }
};

window.CreateNew = CreateNew;
window.UpdateCoilDetail = UpdateCoilDetail;
window.FetchIdentificationByFilter = FetchIdentificationByFilter;
window.OpenModal = OpenModal;
window.CloseModal = CloseModal;
window.SaveStockAllocation = SaveStockAllocation;
window.EditStockAllocation = EditStockAllocation;
window.Back = Back;
window.DeleteStockAllocationClick = DeleteStockAllocationClick;
window.DeleteStockAllocation = DeleteStockAllocation;
window.ShowObjectlistControlModal = ShowObjectlistControlModal;
window.ShowIdentificationModal = ShowIdentificationModal;
window.ShowIdentificationPickModal = ShowIdentificationPickModal;
