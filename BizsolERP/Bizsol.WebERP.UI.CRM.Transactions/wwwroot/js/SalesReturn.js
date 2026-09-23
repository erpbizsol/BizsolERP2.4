import { CRMSalesReturnService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMSalesReturnService.js';
import { VisitOrderEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VisitOrderEntryService.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/menuservices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

let rowCounter = 0;
let itemsList = [];
let dealersList = [];
let distributorsList = [];
let currentMode = ''; // 'create', 'edit', 'view'
let currentEditId = null;
let isAutoSelecting = false; // Flag to prevent infinite loops
let pendingWarehouseCode = null;
let cratesReceiveMasterCode = 0;

$(document).ready(function () {
    window.editSalesReturn = editSalesReturn;
    window.viewSalesReturn = viewSalesReturn;
    window.deleteSalesReturn = deleteSalesReturn;
    $("#ERPHeading").text("Sales Return");

    // Set default date range (last 30 days)
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - 30);
    
    $('#txtFromDate').val(formatDateForInput(fromDate));
    $('#txtToDate').val(formatDateForInput(today));

    loadDropdowns();
    
    // Event handlers
    $('#btnShow').on('click', loadSalesReturnList);
    $('#btnCreateNew').on('click', showCreateForm);
    $('#btnCloseForm').on('click', closeForm);
    $('#btnAddRow').on('click', function() {
        addNewRow(); // Call without any arguments, will default to 0
    });
    $('#btnSave').on('click', saveData);
    
    // Show filter and list section by default
    $('#filterSection').show();
    $('#listSection').show();
    $('#salesReturnFormSection').hide();
    
    // Load initial list
    loadSalesReturnList();
});

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatDateToIso(dateValue) {
    if (!dateValue) {
        return '';
    }

    if (dateValue.includes('/')) {
        const dateParts = dateValue.split('/');
        if (dateParts.length === 3) {
            return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T00:00:00.000Z`;
        }
    }

    if (dateValue.includes('T')) {
        return dateValue;
    }

    return `${dateValue}T00:00:00.000Z`;
}

function setInvoiceDateValue(dateValue) {
    if (!dateValue) {
        $('#txtInvoiceDate').val('');
        return;
    }

    if (typeof dateValue === 'string') {
        if (dateValue.includes('T') || (dateValue.includes('-') && dateValue.length >= 10)) {
            $('#txtInvoiceDate').val(dateValue.substring(0, 10));
            return;
        }

        if (dateValue.includes('/')) {
            const dateParts = dateValue.split('/');
            if (dateParts.length === 3) {
                $('#txtInvoiceDate').val(`${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`);
                return;
            }
        }
    }

    const dateObj = new Date(dateValue);
    if (!isNaN(dateObj.getTime())) {
        $('#txtInvoiceDate').val(formatDateForInput(dateObj));
    } else {
        $('#txtInvoiceDate').val('');
    }
}

function loadDropdowns() {
    // Load Dealer and Distributor dropdown using CRMSalesReturnService
    CRMSalesReturnService.GetDDL('GetDealerList').then(function (response) {
        dealersList = response || [];
        
        // Populate Dealer dropdown
        const ddlDealer = $('#ddlDealerName');
        ddlDealer.empty();
        ddlDealer.append(new Option('Select Dealer', ''));
        
        if (dealersList.length > 0) {
            dealersList.forEach(item => {
                ddlDealer.append(new Option(item.DealerName, item.Code));
            });
        }
        
        ddlDealer.select2({
            width: '100%',
            placeholder: 'Select Dealer'
        });
        
        // Populate Distributor dropdown
        const ddlDistributor = $('#ddlDistributorName');
        ddlDistributor.empty();
        ddlDistributor.append(new Option('Select Distributor', ''));
        
        // Get unique distributors from the dealer list
        const uniqueDistributors = [];
        const distributorMap = new Map();
        
        dealersList.forEach(item => {
            if (!distributorMap.has(item.AccountMaster_Code)) {
                distributorMap.set(item.AccountMaster_Code, {
                    Code: item.AccountMaster_Code,
                    Name: item.AccountDesp
                });
                uniqueDistributors.push({
                    Code: item.AccountMaster_Code,
                    Name: item.AccountDesp
                });
            }
        });
        
        distributorsList = uniqueDistributors;
        
        if (uniqueDistributors.length > 0) {
            uniqueDistributors.forEach(item => {
                ddlDistributor.append(new Option(item.Name, item.Code));
            });
        }
        
        ddlDistributor.select2({
            width: '100%',
            placeholder: 'Select Distributor'
        });
        
        // Attach change events after dropdowns are initialized
        attachDropdownEvents();
        
    }).catch(() => {
        console.error('Error loading dealers and distributors');
        $('#ddlDealerName').select2({ width: '100%' });
        $('#ddlDistributorName').select2({ width: '100%' });
    });

    // Load Items using VisitOrderEntryService
    VisitOrderEntryService.GetItemMasterDropdown().then(function (response) {
        itemsList = response || [];
    }).catch(() => {
        console.error('Error loading items');
        itemsList = [];
    });

    loadWarehouseDropdown();
}

function loadWarehouseDropdown() {
    const ddlWarehouse = $('#ddlWarehouse');
    ddlWarehouse.empty();
    ddlWarehouse.append(new Option('Select Warehouse', ''));

    CRMSalesReturnService.GetDDL('GetGodownList').then(function (response) {
        const godownList = Array.isArray(response) ? response : [];

        godownList.forEach(item => {
            ddlWarehouse.append(new Option(item.GodownName, item.Code));
        });

        ddlWarehouse.select2({
            width: '100%',
            placeholder: 'Select Warehouse'
        });

        if (pendingWarehouseCode) {
            setWarehouseValue(pendingWarehouseCode);
        }
    }).catch(() => {
        console.error('Error loading warehouse list');
        ddlWarehouse.select2({
            width: '100%',
            placeholder: 'Select Warehouse'
        });
    });
}

function setWarehouseValue(code) {
    const warehouseCode = code ? String(code) : '';
    const ddlWarehouse = $('#ddlWarehouse');

    if (warehouseCode && ddlWarehouse.find(`option[value="${warehouseCode}"]`).length === 0) {
        pendingWarehouseCode = warehouseCode;
        return;
    }

    pendingWarehouseCode = null;
    ddlWarehouse.val(warehouseCode).trigger('change.select2');
}

function attachDropdownEvents() {
    // Dealer change event - auto select distributor
    $('#ddlDealerName').on('select2:select', function(e) {
        if (isAutoSelecting) return;
        
        const selectedDealerCode = $(this).val();
        console.log('Dealer selected:', selectedDealerCode);
        
        if (selectedDealerCode) {
            autoSelectDistributor(selectedDealerCode);
        }
    });
    
    $('#ddlDealerName').on('select2:clear', function(e) {
        if (!isAutoSelecting) {
            $('#ddlDistributorName').val('').trigger('change.select2');
        }
    });
    
    // Distributor change event - auto select dealer
    $('#ddlDistributorName').on('select2:select', function(e) {
        if (isAutoSelecting) return;
        
        const selectedDistributorCode = $(this).val();
        console.log('Distributor selected:', selectedDistributorCode);
        
        if (selectedDistributorCode) {
            autoSelectDealer(selectedDistributorCode);
        }
    });
}

function autoSelectDistributor(dealerCode) {
    // Find the dealer in the list
    const dealer = dealersList.find(d => String(d.Code) === String(dealerCode));
    
    console.log('Looking for dealer with code:', dealerCode);
    console.log('Found dealer:', dealer);
    
    if (dealer && dealer.AccountMaster_Code) {
        // Auto-select the corresponding distributor
        const distributorCode = String(dealer.AccountMaster_Code);
        
        console.log('Auto-selecting distributor with code:', distributorCode);
        
        // Set flag to prevent infinite loop
        isAutoSelecting = true;
        
        // Set the value and trigger change
        $('#ddlDistributorName').val(distributorCode).trigger('change.select2');
        
        // Reset flag after a delay
        setTimeout(() => {
            isAutoSelecting = false;
        }, 300);
    } else {
        console.log('No distributor found for dealer');
    }
}

function autoSelectDealer(distributorCode) {
    // Find the first dealer that has this distributor
    const dealer = dealersList.find(d => String(d.AccountMaster_Code) === String(distributorCode));
    
    console.log('Looking for dealer with distributor code:', distributorCode);
    console.log('Found dealer:', dealer);
    
    if (dealer) {
        // Auto-select the corresponding dealer (first matching dealer)
        const dealerCode = String(dealer.Code);
        
        console.log('Auto-selecting dealer with code:', dealerCode);
        
        // Set flag to prevent infinite loop
        isAutoSelecting = true;
        
        // Set the value and trigger change
        $('#ddlDealerName').val(dealerCode).trigger('change.select2');
        
        // Reset flag after a delay
        setTimeout(() => {
            isAutoSelecting = false;
        }, 300);
    } else {
        console.log('No dealer found for distributor');
    }
}

function loadSalesReturnList() {
    const fromDate = $('#txtFromDate').val();
    const toDate = $('#txtToDate').val();
    
    if (!fromDate || !toDate) {
        toastr.error('Please select From Date and To Date');
        return;
    }
    
    // Call CRMSalesReturnService to get returns
    CRMSalesReturnService.GetCRMSalesReturnLocate(fromDate, toDate).then(function (data) {
        if (Array.isArray(data) && data.length > 0) {
            const stringFilterColumn = ["Entry No", "Customer Name", "Dealer Name"];
            const numericFilterColumn = ["Return Crate", "Received Payments"];
            const dateFilterColumn = ["Entry Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code", "CratesReceiveMaster_Code"];
            const ColumnAlignment = { 
                "Return Crate": 'right', 
                "Received Payments": 'right',
                "Entry Date": 'center',
                "Action": 'center'
            };

            // Map data to grid-friendly objects with action buttons in data
            const gridData = data.map(item => {
                const code = parseInt(item.Code ?? item.code) || 0;
                const cratesReceiveCode = parseInt(item.CratesReceiveMaster_Code ?? item.cratesReceiveMaster_Code) || 0;
                const actionButtons = `<button type="button" class="btn btn-sm btn-primary sr-action-btn" title="Edit" onclick="event.stopPropagation();editSalesReturn(${code},${cratesReceiveCode})"><i class="fa fa-pencil"></i></button> <button type="button" class="btn btn-sm btn-info sr-action-btn" title="View" onclick="event.stopPropagation();viewSalesReturn(${code},${cratesReceiveCode})"><i class="fa fa-eye"></i></button> <button type="button" class="btn btn-sm btn-danger sr-action-btn" title="Delete" onclick="event.stopPropagation();deleteSalesReturn(${code},${cratesReceiveCode})"><i class="fa fa-times"></i></button>`;
                
                return {
                    ...item,
                    Action: actionButtons
                };
            });

            BizsolCustomFilterGrid.CreateDataTable(
                "SalesReturnList-header",
                "SalesReturnList-body",
                gridData,
                button,
                showButtons,
                stringFilterColumn,
                numericFilterColumn,
                dateFilterColumn,
                stringDoubleFilterColumn,
                hiddenColumns,
                ColumnAlignment
            );
            
            $('#tblSalesReturnList').show();
        } else {
            $('#SalesReturnList-header').html('<tr><th>No Data</th></tr>');
            $('#SalesReturnList-body').html('<tr><td colspan="10" class="text-center">No records found</td></tr>');
            $('#tblSalesReturnList').show();
        }
    }).catch(function (error) {
        console.error('Error fetching sales returns:', error);
        toastr.error('Error fetching sales returns');
    });
}

function showCreateForm() {
    currentMode = 'create';
    currentEditId = null;
    
    $('#formTitle').text('Create New Sales Return');
    
    // Show form section, hide list section
    $('#filterSection').hide();
    $('#listSection').hide();
    $('#salesReturnFormSection').show();
    
    // Reset form
    resetForm();
    
    // Enable all fields
    setFormMode(false);
}

function editSalesReturn(code, cratesReceiveMaster_Code) {
    var ModuleName = "Sale / Crate Return",
        ShowMsg = "Y",
        FinYear = BizSolHelperFunction.getFinancialYear();
    var OptionName = 'Edit';
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (respCheck) {

        if (respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg);
            return false;
        } else {
            currentMode = 'edit';
            currentEditId = parseInt(code) || 0;
            cratesReceiveMasterCode = parseInt(cratesReceiveMaster_Code) || 0;

            $('#formTitle').text('Edit Sales Return');

            // Show form section, hide list section
            $('#filterSection').hide();
            $('#listSection').hide();
            $('#salesReturnFormSection').show();

            // Load data
            loadSalesReturnData(currentEditId, cratesReceiveMasterCode, false);
        }
    });

    
}

function viewSalesReturn(code, cratesReceiveMaster_Code) {


    currentMode = 'view';
    currentEditId = parseInt(code) || 0;
    cratesReceiveMasterCode = parseInt(cratesReceiveMaster_Code) || 0;
    
    $('#formTitle').text('View Sales Return');
    
    // Show form section, hide list section
    $('#filterSection').hide();
    $('#listSection').hide();
    $('#salesReturnFormSection').show();
    
    // Load data
    loadSalesReturnData(currentEditId, cratesReceiveMasterCode, true);
}

function getShowDataSets(response) {
    if (!response) {
        return { master: null, details: [] };
    }

    if (Array.isArray(response) && response.length > 0) {
        const first = response[0];
        const second = response.length > 1 ? response[1] : [];

        if (Array.isArray(first)) {
            return {
                master: first.length > 0 ? first[0] : null,
                details: Array.isArray(second) ? second : []
            };
        }

        if (typeof first === 'object') {
            return {
                master: first,
                details: Array.isArray(second) ? second : []
            };
        }
    }

    return { master: null, details: [] };
}

function loadSalesReturnData(code, cratesReceiveMaster_Code, isViewMode) {
    CRMSalesReturnService.GetCRMSalesReturnShowData(code, cratesReceiveMaster_Code).then(function (response) {
        console.log('Loaded data for edit/view:', response);

        const showData = getShowDataSets(response);
        const master = showData.master;
        const detailsData = showData.details;

        if (master) {
            
            console.log('Master:', master);
            console.log('Details:', detailsData);
            
            // Set header fields
            $('#txtEntryNo').val(master.EntryNo || '');
            
            // Format date for display
            let dateValue = master.EntryDate;
            if (dateValue) {
                // If ISO format, convert to dd/mm/yyyy
                if (dateValue.includes('T') || dateValue.includes('-')) {
                    const dateObj = new Date(dateValue);
                    dateValue = formatDate(dateObj);
                }
            }
            $('#txtDate').val(dateValue);
            
            // Set dealer and distributor
            isAutoSelecting = true;
            
            const dealerCode = master.DealerMaster_Code;
            const distributorCode = master.AccountMaster_Code;
            
            console.log('Setting dealer code:', dealerCode);
            console.log('Setting distributor code:', distributorCode);
            
            if (dealerCode) {
                $('#ddlDealerName').val(dealerCode).trigger('change.select2');
            }
            
            if (distributorCode) {
                $('#ddlDistributorName').val(distributorCode).trigger('change.select2');
            }
            
            setTimeout(() => {
                isAutoSelecting = false;
            }, 300);
            
            // Set Invoice No
            $('#txtInvoiceNo').val(master.InvoiceNo || '');
            setInvoiceDateValue(master.InvoiceDate || master.invoiceDate);

            setWarehouseValue(master.GodownMaster_Code || master.godownMaster_Code);
            
            // Set ReturnCrate and ReceivedPayments with default 0
            $('#txtReturnCrate').val(formatQtyDisplay(master.ReturnQtyBags || 0));
            $('#txtReceivedPayments').val(formatQtyDisplay(master.Payments || 0));
            $('#txtCrateRemark').val(master.CrateRemark ?? master.crateRemark ?? master['Crate Remark'] ?? '');
            cratesReceiveMasterCode = parseInt(master.CratesReceiveMaster_Code || master.cratesReceiveMaster_Code) || 0;
            
            // Clear grid
            $('#gridBody').empty();
            rowCounter = 0;
            
            // Load items from details data
            if (detailsData && detailsData.length > 0) {
                detailsData.forEach(item => {
                    const detailCode = item.Code; // Get the detail code
                    const isConsumed = item.IsConsumed || item.isConsumed || '';
                    addNewRow(detailCode, isConsumed); // Pass detail code and consumed flag
                    const currentRow = rowCounter;
                    
                    const itemCode = item.ItemMaster_Code;
                    const qty = item.Qty || 0;
                    const remarks = item.Remark || '';
                    
                    console.log(`Setting row ${currentRow}: Code=${detailCode}, ItemCode=${itemCode}, Qty=${qty}, Remark=${remarks}, IsConsumed=${isConsumed}`);
                    
                    $(`.item-select[data-row="${currentRow}"]`).val(itemCode).trigger('change');
                    $(`.qty-input[data-row="${currentRow}"]`).val(formatQtyDisplay(qty));
                    $(`.remarks-input[data-row="${currentRow}"]`).val(remarks);
                });
            } else {
                addNewRow(); // Add empty row with code 0
            }
            
            calculateTotal();
            
            // Set form mode (readonly for view)
            setFormMode(isViewMode);
            applyConsumedRowLocks();
        } else {
            toastr.error('Invalid data format received from server');
            closeForm();
        }
    }).catch(function (error) {
        console.error('Error loading sales return data:', error);
        toastr.error('Error loading sales return data');
        closeForm();
    });
}

function setFormMode(isReadonly) {
    if (isReadonly) {
        // View mode - disable all inputs
        $('#ddlDealerName').prop('disabled', true);
        $('#ddlDistributorName').prop('disabled', true);
        $('#ddlWarehouse').prop('disabled', true);
        $('#txtInvoiceNo').prop('readonly', true).addClass('readonly-field');
        $('#txtInvoiceDate').prop('readonly', true).prop('disabled', true).addClass('readonly-field');
        $('#txtReturnCrate').prop('readonly', true).addClass('readonly-field');
        $('#txtReceivedPayments').prop('readonly', true).addClass('readonly-field');
        $('#txtCrateRemark').prop('readonly', true).addClass('readonly-field');
        
        $('.item-select').prop('disabled', true);
        $('.qty-input').prop('readonly', true).addClass('readonly-field');
        $('.remarks-input').prop('readonly', true).addClass('readonly-field');
        
        $('#btnAddRow').hide();
        $('.btn-remove').hide();
        $('#btnSave').hide();
    } else {
        // Create/Edit mode - enable inputs
        $('#ddlDealerName').prop('disabled', false);
        $('#ddlDistributorName').prop('disabled', false);
        $('#ddlWarehouse').prop('disabled', false);
        $('#txtInvoiceNo').prop('readonly', false).removeClass('readonly-field');
        $('#txtInvoiceDate').prop('readonly', false).prop('disabled', false).removeClass('readonly-field');
        $('#txtReturnCrate').prop('readonly', false).removeClass('readonly-field');
        $('#txtReceivedPayments').prop('readonly', false).removeClass('readonly-field');
        $('#txtCrateRemark').prop('readonly', false).removeClass('readonly-field');
        
        $('.item-select').not('.consumed-lock').prop('disabled', false);
        $('.qty-input').not('.consumed-lock').prop('readonly', false).removeClass('readonly-field');
        $('.remarks-input').not('.consumed-lock').prop('readonly', false).removeClass('readonly-field');
        
        $('#btnAddRow').show();
        $('.btn-remove').not('.consumed-lock').show();
        $('#btnSave').show();
        applyConsumedRowLocks();
    }
}

function isRowConsumed(flag) {
    return String(flag || '').trim().toUpperCase() === 'Y';
}

function applyConsumedRowLocks() {
    $('#gridBody tr.consumed-row').each(function() {
        const rowId = $(this).data('row-id');
        lockConsumedRow(rowId);
    });
}

function lockConsumedRow(rowId) {
    const $row = $(`tr[data-row-id="${rowId}"]`);
    $row.addClass('consumed-row');
    $row.find('.item-select').prop('disabled', true).addClass('consumed-lock');
    $row.find('.qty-input').prop('readonly', true).addClass('readonly-field consumed-lock');
    $row.find('.remarks-input').prop('readonly', true).addClass('readonly-field consumed-lock');
    $row.find('.btn-remove').addClass('consumed-lock').hide();
}

function deleteSalesReturn(code, cratesReceiveMaster_Code) {

    var ModuleName = "Sale / Crate Return",
        ShowMsg = "Y",
        FinYear = BizSolHelperFunction.getFinancialYear();
    var OptionName = 'Delete';
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (respCheck) {

        if (respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg);
            return false;
        } else {
            const reasonForDelete = prompt('Please enter reason for deletion:');

            if (reasonForDelete === null) {
                // User cancelled
                return;
            }

            if (!reasonForDelete.trim()) {
                toastr.error('Reason for deletion is required');
                return;
            }

            if (confirm('Are you sure you want to delete this Sales Return entry?')) {
                const authKeyData = JSON.parse(sessionStorage.getItem('authKey')) || {};
                const UserMaster_Code = authKeyData.UserMaster_Code || 0;
                const IPAddress = '';
                const Location = '';

                CRMSalesReturnService.DeleteCRMSalesReturn(code, cratesReceiveMaster_Code, UserMaster_Code, reasonForDelete, IPAddress, Location)
                    .then(function (response) {
                        if (response.Status === 'Y') {
                            toastr.success(response.Msg);
                            loadSalesReturnList();
                        } else {
                            toastr.error(response.Msg);
                        }
                    });

            }
        }
    });
    
}

function closeForm() {
    currentMode = '';
    currentEditId = null;
    cratesReceiveMasterCode = 0;
    
    // Hide form section, show list section
    $('#salesReturnFormSection').hide();
    $('#filterSection').show();
    $('#listSection').show();
    
    // Reload list
    loadSalesReturnList();
}

function addNewRow(detailCode = 0, isConsumed = '') {
    rowCounter++;
    const consumed = isRowConsumed(isConsumed);
    
    const row = `
        <tr data-row-id="${rowCounter}" data-detail-code="${detailCode}" data-is-consumed="${consumed ? 'Y' : 'N'}" class="${consumed ? 'consumed-row' : ''}">
            <td class="text-center">${rowCounter}</td>
            <td>
                <select class="form-control form-control-sm item-select grid-select2" data-row="${rowCounter}">
                    <option value="">Select Item</option>
                </select>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm grid-input qty-input text-end" 
                       data-row="${rowCounter}" min="0" step="any" value="0" />
            </td>
            <td>
                <input type="text" class="form-control form-control-sm grid-input remarks-input" 
                       data-row="${rowCounter}" placeholder="Enter remarks" />
            </td>
            <td class="action-column">
                <button type="button" class="btn btn-sm btn-danger btn-remove" data-row="${rowCounter}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
    
    $('#gridBody').append(row);
    
    // Initialize Select2 for the new item dropdown
    const itemSelect = $(`.item-select[data-row="${rowCounter}"]`);
    if (itemsList.length > 0) {
        itemsList.forEach(item => {
            itemSelect.append(new Option(item.Desp || item.ItemName, item.Code || item.Item_Code));
        });
    }
    
    itemSelect.select2({
        width: '100%',
        placeholder: 'Select Item',
        dropdownParent: itemSelect.parent()
    });
    
    // Attach event handlers
    $(`.qty-input[data-row="${rowCounter}"]`).on('input', calculateTotal);
    $(`.qty-input[data-row="${rowCounter}"]`).on('blur', function() {
        $(this).val(formatQtyDisplay($(this).val()));
        calculateTotal();
    });
    $(`.btn-remove[data-row="${rowCounter}"]`).on('click', function() {
        removeRow($(this).data('row'));
    });

    if (consumed) {
        lockConsumedRow(rowCounter);
    }
    
    calculateTotal();
}

function removeRow(rowId) {
    const $row = $(`tr[data-row-id="${rowId}"]`);
    if (isRowConsumed($row.data('is-consumed'))) {
        toastr.warning('This row is consumed and cannot be deleted');
        return;
    }

    if ($('#gridBody tr').length > 1) {
        $row.remove();
        renumberRows();
        calculateTotal();
    } else {
        toastr.warning('At least one row is required');
    }
}

function renumberRows() {
    let newCounter = 0;
    $('#gridBody tr').each(function() {
        newCounter++;
        $(this).find('td:first').text(newCounter);
    });
    rowCounter = newCounter;
}

function roundTo3(value) {
    const num = parseFloat(value);
    if (isNaN(num)) {
        return 0;
    }
    return Math.round((num + Number.EPSILON) * 1000) / 1000;
}

function formatQtyDisplay(value) {
    const rounded = roundTo3(value);
    if (Number.isInteger(rounded)) {
        return String(rounded);
    }
    return rounded.toFixed(3);
}

function calculateTotal() {
    let total = 0;
    $('.qty-input').each(function() {
        total += roundTo3($(this).val());
    });
    $('#totalQty').text(formatQtyDisplay(total));
}

function saveData() {
    // Validate header fields
    const dealerCode = $('#ddlDealerName').val();
    const distributorCode = $('#ddlDistributorName').val();
    const warehouseCode = $('#ddlWarehouse').val();
    const invoiceNo = $('#txtInvoiceNo').val().trim();
    const invoiceDate = $('#txtInvoiceDate').val();
    const crateRemark = $('#txtCrateRemark').val().trim();
    
    if (!dealerCode) {
        toastr.error('Please select Dealer Name');
        return;
    }
    
    if (!distributorCode) {
        toastr.error('Please select Distributor Name');
        return;
    }
    
    if (!invoiceNo) {
        toastr.error('Please enter Invoice No.');
        return;
    }

    if (!invoiceDate) {
        toastr.error('Please select Invoice Date');
        $('#txtInvoiceDate').focus();
        return;
    }
    
    // Get ReturnCrate and ReceivedPayments values (default to 0 if empty)
    const returnCrate = parseFloat($('#txtReturnCrate').val()) || 0;
    const receivedPayments = parseFloat($('#txtReceivedPayments').val()) || 0;
    
    // Collect grid data
    const gridData = [];
    let isValid = true;
    let hasGridRows = false;
    const itemCodesSet = new Set(); // To track duplicate items
    
    $('#gridBody tr').each(function() {
        const rowId = $(this).data('row-id');
        const rowCode = $(this).data('detail-code') || 0; // Get the detail code from row data attribute
        const itemCode = $(this).find('.item-select').val();
        const itemName = $(this).find('.item-select option:selected').text();
        const qty = parseFloat($(this).find('.qty-input').val()) || 0;
        const remarks = $(this).find('.remarks-input').val().trim();
        
        // Check if row has any data
        if (itemCode || qty > 0 || remarks) {
            hasGridRows = true;
            
            // Validate filled rows
            if (!itemCode) {
                toastr.error(`Please select item in row ${$(this).find('td:first').text()}`);
                isValid = false;
                return false;
            }
            
            if (qty <= 0) {
                toastr.error(`Please enter valid quantity in row ${$(this).find('td:first').text()}`);
                isValid = false;
                return false;
            }
            
            // Check for duplicate item
            if (itemCodesSet.has(itemCode)) {
                toastr.error(`Duplicate item "${itemName}" found in row ${$(this).find('td:first').text()}. Each item can be added only once.`);
                isValid = false;
                return false;
            }
            
            // Add item code to set
            itemCodesSet.add(itemCode);
            
            gridData.push({
                code: rowCode, // Pass the detail code (0 for new rows, existing code for edit)
                crmSalesReturnReplacementMaster_Code: currentEditId || 0,
                itemMaster_Code: parseInt(itemCode),
                qty: qty,
                remark: remarks
            });
        }
    });
    
    if (!isValid) {
        return;
    }
    
    // Validation logic:
    // If no grid rows are filled, ReturnCrate and ReceivedPayments are required
    // If grid rows are filled, ReturnCrate and ReceivedPayments are optional (default to 0)
    if (!hasGridRows) {
        if (returnCrate === 0 && receivedPayments === 0) {
            toastr.error('Please fill either grid rows OR enter Return Crate and Received Payments');
            return;
        }
    }
    
    // Prepare data for saving according to API schema
    const authKeyData = JSON.parse(sessionStorage.getItem('authKey')) || {};
    const UserId = authKeyData.UserMaster_Code || 0;
    
    // Format date to ISO format
    const dateValue = $('#txtDate').val();
    let formattedDate = '';
    
    if (dateValue) {
        // If date is in dd/mm/yyyy format, convert to ISO
        const dateParts = dateValue.split('/');
        if (dateParts.length === 3) {
            // dd/mm/yyyy to ISO
            formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${new Date().toTimeString().split(' ')[0]}.754Z`;
        } else {
            // If already in yyyy-mm-dd format, convert to ISO
            formattedDate = new Date(dateValue).toISOString();
        }
    } else {
        formattedDate = new Date().toISOString();
    }
    
    const salesReturnData = {
        crmSalesReturnMaster: {
            code: currentEditId || 0,
            accountMaster_Code: parseInt(distributorCode),
            entryNo: $('#txtEntryNo').val(),
            createDate: formattedDate,
            dealerMaster_Code: parseInt(dealerCode),
            invoiceNo: invoiceNo,
            invoiceDate: formatDateToIso(invoiceDate),
            returnQtyBags: returnCrate, // Use the value from input (defaults to 0)
            payments: receivedPayments,   // Use the value from input (defaults to 0)
            godownMaster_Code: parseInt(warehouseCode) || 0,
            crateRemark: crateRemark,
            cratesReceiveMaster_Code: cratesReceiveMasterCode || 0
        },
        crmSalesReturnDetailList: gridData
    };
    
    console.log('Sales Return Data:', JSON.stringify(salesReturnData, null, 2));
    
    // Call CRMSalesReturnService to save data
    CRMSalesReturnService.SaveCRMSalesReturn(salesReturnData, UserId)
        .then(function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                closeForm();
            } else {
                toastr.error(response.Msg);
            }
        });
        
}

function resetForm() {
    // Reset header fields
    $('#txtEntryNo').val('0');
    const today = new Date();
    $('#txtDate').val(formatDate(today));
    
    isAutoSelecting = true;
    
    $('#ddlDealerName').val('').trigger('change');
    $('#ddlDistributorName').val('').trigger('change');
    
    setTimeout(() => {
        isAutoSelecting = false;
    }, 300);
    
    $('#txtInvoiceNo').val('');
    $('#txtInvoiceDate').val(formatDateForInput(today));
    $('#txtReturnCrate').val('0');
    $('#txtReceivedPayments').val('0');
    setWarehouseValue('');
    $('#txtCrateRemark').val('');
    cratesReceiveMasterCode = 0;
    
    // Clear grid
    $('#gridBody').empty();
    rowCounter = 0;
    
    // Add initial row
    addNewRow();
}

// Export functions for global access
window.loadSalesReturnList = loadSalesReturnList;
window.showCreateForm = showCreateForm;
window.editSalesReturn = editSalesReturn;
window.viewSalesReturn = viewSalesReturn;
window.deleteSalesReturn = deleteSalesReturn;
