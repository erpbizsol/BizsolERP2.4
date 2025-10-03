import { RMStockService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/RMStockService.js';

let today = '';
let G_IdentificationNo = '';
let G_Code = 0;
let G_SNo = 0;

$(document).ready(function () {
    let isInitialLoad = true;
    var urlParams = getUrlVars();
    var menuValue = decodeURI(urlParams['menu']);
    
    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    } else {
        $("#ERPHeading").text("Raw Material Stock Management");
    }
    setCurrentDate();
    initializeTabs();
    GetRMStockCurrentListTable();
    $('#exampleCheck').on("click", function () {
        GetRMStockCurrentListTable();
    });

    $("#ddlSlitWidth").on('change', function () {
        if (isInitialLoad) {
            isInitialLoad = false; 
            return;
        }
        calculateWeightPerSlit();
    });
});

function setCurrentDate() {
    today = new Date().toISOString().split('T')[0];
    $('#txtFromDate').val(today);
    $('#txtToDate').val(today);
    $('#txtPurchasedDate').val(today);
}
function GetRMStockCurrentListTable() {
    Showloader();
    RMStockService.GetRMStockCurrentList().then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            $('#tblRMStockCurrent').show();
            const stringFilterColumn = ["Invoice No", "Item Name", "Vendor", "Brand", "Challan Wt", "Thickness", "Grade", "Make", "Width", "Actual Wt", "Warehouse", "Remarks", "IdentificationNo","Grade"];
            const numericFilterColumn = ["Qty MT","Qty PC","Qty MTRS"];
            const dateFilterColumn = ["Receive Date","Invoice Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            let hiddenColumns = []
            if ($('#exampleCheck').is(':checked')) {
                hiddenColumns = ["Code"];
            } else {
                hiddenColumns = ["Code", "% E", "Hardness", "UTS", "YST", "BEND TEST"];
            }
            const columnAlignment = {
                'Invoice Date': 'center', 'Receive Date': 'center', 'Thickness': 'right', 'Challan Wt': 'right', 'Width': 'right;min-width:45px','Actual Wt': 'right',
                'Qty MT': 'right', 'Qty PC': 'right', 'Qty MTRS': 'right', '% E': 'right;min-width:50px', 'Hardness': 'right', 'UTS': 'right;min-width:70px', 'YST': 'right;min-width:70px','Status': ';width:150px',
                'Purchased Date': ';width:150px',
                'Vendor': ';min-width:230px !important;',
                'Item Name': ';min-width:100px !important;',
            };
            const updatedResponse = response.map((item, index) => {
                let PlannedButtonInputHTML = `<button type="button" id="txtPlanned_${item.IdentificationNo}" class="btn btn-primary btn-height" title="Planned Button" onclick="ShowModelPlanned('${item.IdentificationNo}');" style="width: 70px;">Plan</button>`;
                
                return {
                    ...item,
                    'Planned Button': PlannedButtonInputHTML,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-RMStockCurrent", "table-body-RMStockCurrent", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment,false);
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $('#tblRMStockCurrent').hide();
        }
    })
        .catch(function (error) {
            HideLoader();
            toastr.error(error.Msg || 'Error during RMStockCurrent');
            $('#tblRMStockCurrent').hide();
        });
}
function ShowModelPlanned(IdentificationNo) {
    G_IdentificationNo = IdentificationNo;
    clearForm();
    enableNewRowAddition();
    $('#PlannedMyModal').data('IdentificationNo',IdentificationNo);
    $('#PlannedMyModal').modal({
        backdrop: 'static',
    });
    $('#PlannedMyModal').modal('show');
    ShowRMStockPlan();
    GetRMStockWidthList();
    GetRMStockItemNameList();
    
    // Initialize totals
    updateTableTotals();
    
    // Add checkbox event handler for manual weight
    $('#AllowManualWeight').off('change').on('change', function() {
        if ($(this).is(':checked')) {
            $('#txtWeightPerSlit').prop('disabled', false).removeClass('bg-light');
        } else {
            $('#txtWeightPerSlit').prop('disabled', true).addClass('bg-light');
        }
    });
    
    // Add checkbox event handler for copy from previous
    $('#CopyFromPrevious').off('change').on('change', function() {
        if ($(this).is(':checked')) {
            copyFromPrevious();
        }
    });
    
     
     
}
function ShowRMStockPlan() {
    RMStockService.ShowRMStockData(G_IdentificationNo).then(function (response) {
        if (response.length > 0) {
            enableNewRowAddition();
            fillTableWithExistingData(response);
        } else {
            enableNewRowAddition();
        }
    });
}

// Fill table with existing data when response has data
function fillTableWithExistingData(response) {
    var tbody = $('#RMStockCurrentPlanned tbody');
    tbody.empty();
    
    response.forEach(function(item) {
        var existingRow = `
            <tr>
                <td>${item.ItemName || ''}</td>
                <td >${item.Desp || ''}</td>
                <td class="text-end">${item.NoofSlits || 0}</td>
                <td class="text-end">${(item.Weight / item.NoofSlits || 0).toFixed(3)}</td>
                <td class="text-end">${item.Weight || 0}</td>
                <td>
                    <button type="button" onclick="editRow(this,${item.SNo})" class="btn btn-warning btn-sm"><i class="fas fa-edit"></i></button>
                    <button type="button" onclick="deleteRow(this,${item.SNo},${item.Code})" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
        tbody.append(existingRow);
    });
    
    updateTableTotals();
    
}

// Enable new row addition when no existing data
function enableNewRowAddition() {
    var tbody = $('#RMStockCurrentPlanned tbody');
    tbody.empty(); 
}
function GetRMStockItemNameList() {
    RMStockService.GetRMStockItemName().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlItemName')[0], response.map((item) => ({ Code: item.Code, Desp: item.itemName })));

            $('#ddlItemName').select2({
                dropdownParent: $('#PlannedMyModal'),
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function GetRMStockWidthList() {
    RMStockService.GetRMStockWidth().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlSlitWidth')[0], response.map((item) => ({ Code: item.Code, Desp: item.Desp })));

            $('#ddlSlitWidth').select2({
                dropdownParent: $('#PlannedMyModal'),
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function validateIntegerInput(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length > 5) {
        value = value.slice(0, 5);
    }
    input.value = value;
}
function validateDecimalRateInput(input) {
    let value = input.value.replace(/[^0-9.]/g, '');
    let parts = value.split('.');
    if (parts.length > 3) {
        value = parts[0] + '.' + parts[1];
    }
    if (value.length > 8) {
        value = value.slice(0, 8);
    }
    if (parts[1] && parts[1].length > 3) {
        value = parts[0] + '.' + parts[1].slice(0, 3);
    }
    input.value = value;
}

 //Calculate total weight automatically
 function calculateWeightPerSlit() {
     let modalSlitWidthValue = $('#ddlSlitWidth').val();
     $('#txtNoOfSlits').val(0);
     $('#txtWeightPerSlit').val(0);
     $('#txtTotalWeight').val(0);
     
     let widthValue = parseFloat(modalSlitWidthValue);
     if (isNaN(widthValue) || widthValue == 0) {
         $('#txtWeightPerSlit').val('');
         calculateTotalWeight();
         return;
     }
     
     RMStockService.GetRMStockCalculateWidth(G_IdentificationNo, widthValue).then(function (response) {
         if (response && response.length > 0 && response[0].CalculatedSlitPerWidth !== undefined) {
             $('#txtWeightPerSlit').val(response[0].CalculatedSlitPerWidth);
             calculateTotalWeight();
         } else {
             $('#txtWeightPerSlit').val('');
             calculateTotalWeight();
         }
     }).catch(function (error) {
         toastr.error('Error calculating weight per slit: ' + (error.message || 'Unknown error'));
         $('#txtWeightPerSlit').val('');
         calculateTotalWeight();
     });
 }
function calculateTotalWeight() {
    var noOfSlits = parseFloat($('#txtNoOfSlits').val()) || 0;
    var weightPerSlit = parseFloat($('#txtWeightPerSlit').val()) || 0;
    var totalWeight = noOfSlits * weightPerSlit;
    $('#txtTotalWeight').val(totalWeight.toFixed(3));
}

// Add event listeners for automatic calculation
$(document).ready(function() {
    // Event listener for number of slits and weight per slit changes
    $('#txtNoOfSlits, #txtWeightPerSlit').on('input', function() {
        calculateTotalWeight();
    });
});

// Copy from previous row functionality
function copyFromPrevious() {
    var tbody = $('#RMStockCurrentPlanned tbody');
    var rows = tbody.find('tr');
    
    if (rows.length > 0) {
        var lastRow = rows.last();
        var lastItemName = lastRow.find('td:eq(0) select').val();
        var lastSlitWidth = lastRow.find('td:eq(1) select').val();
        var lastNoOfSlits = lastRow.find('td:eq(2) input').val();
        var lastWeightPerSlit = lastRow.find('td:eq(3) input').val();
        
        $('#ddlItemName').val(lastItemName).trigger('change');
        $('#ddlSlitWidth').val(lastSlitWidth).trigger('change');
        $('#txtNoOfSlits').val(lastNoOfSlits);
        $('#txtWeightPerSlit').val(lastWeightPerSlit);
        calculateTotalWeight();
    }
}

// Add new row to table
//function addNewRow() {
//    var tbody = $('#RMStockCurrentPlanned tbody');
//    var newRow = `
//        <tr>
//            <td>${$('#ddlItemName option:selected').text()}</td>
//            <td>${$('#ddlSlitWidth option:selected').text()}</td>
//            <td class="text-end">${$('#txtNoOfSlits').val()}</td>
//            <td class="text-end">${$('#txtWeightPerSlit').val()}</td>
//            <td class="text-end">${$('#txtTotalWeight').val()}</td>
//            <td>
//                <button type="button" onclick="editRow(this)" class="btn btn-warning btn-sm"><i class="fas fa-edit"></i></button>
//                <button type="button" onclick="deleteRow(this)" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
//            </td>
//        </tr>
//    `;
//    tbody.append(newRow);
    
//    // Update totals after adding row
//    updateTableTotals();
    
//    // Clear form for next entry
//    clearForm();
//}

// Clear form inputs
function clearForm() {
    $('#ddlItemName').val('').trigger('change');
    $('#ddlSlitWidth').val('').trigger('change');
    $('#txtNoOfSlits').val('');
    $('#txtWeightPerSlit').val('');
    $('#txtTotalWeight').val('');
    G_SNo = 0;
}

// Edit row functionality
function editRow(button,Code) {
    var row = $(button).closest('tr');
    var cells = row.find('td');
    G_SNo = Code;
    $('#ddlItemName').val($('#ddlItemName option').filter(function() {
        return $(this).text() === cells.eq(0).text();
    }).val()).trigger('change');
    
    $('#ddlSlitWidth').val($('#ddlSlitWidth option').filter(function() {
        return $(this).text() === cells.eq(1).text();
    }).val()).trigger('change');
    
    $('#txtNoOfSlits').val(cells.eq(2).text());
    $('#txtWeightPerSlit').val(cells.eq(3).text());
    $('#txtTotalWeight').val(cells.eq(4).text());
    
    row.remove();
    updateTableTotals();
}

// Delete row functionality
function deleteRow(button, Code,SlittingMasterCode) {
    G_SNo = Code;
    G_Code = SlittingMasterCode;
    $('#myModalDelete').modal({
        backdrop: 'static',
    });

    $('#myModalDelete').modal('show');
}
function DeleteModal() {
    let reasonForDelete = $('#deleteReason').val();
    if (!reasonForDelete) {
        toastr.warning("Please Provide a Reason For Delete.");
        return;
    }
    RMStockService.DeleteRMStockData(G_SNo, G_Code, reasonForDelete).then(function (response) {
        if (response != '') {
            if (response.Status == 'Y') {
                toastr.success(response.Msg);
                updateTableTotals();
                CloseModal();
                ShowRMStockPlan();
                clearForm(); 
            } else {
                toastr.error(response.Msg);
            }

        }
    });
}
function CloseModal() {
    $('#myModalDelete').modal('hide');
    $('#deleteReason').val('');

}
// Update table totals
function updateTableTotals() {
    var tbody = $('#RMStockCurrentPlanned tbody');
    var rows = tbody.find('tr');
    
    var totalNoOfSlits = 0;
    var totalWeightPerSlit = 0;
    var totalWeight = 0;
    
    rows.each(function() {
        var noOfSlits = parseFloat($(this).find('td:eq(2)').text()) || 0;
        var weightPerSlit = parseFloat($(this).find('td:eq(3)').text()) || 0;
        var rowTotalWeight = parseFloat($(this).find('td:eq(4)').text()) || 0;
        
        totalNoOfSlits += noOfSlits;
        totalWeightPerSlit += weightPerSlit;
        totalWeight += rowTotalWeight;
    });
    
    // Update footer totals
    $('#totalNoOfSlits').text(totalNoOfSlits.toFixed(0));
    $('#totalWeightPerSlit').text(totalWeightPerSlit.toFixed(3));
    $('#totalWeight').text(totalWeight.toFixed(3));
}

// Save planned slitting data
function Save_PlannedSlitting() {
    // Validate required fields
    let ItemMaster_Code = $('#ddlItemName').val();
    let ItemMasterWidth_Code = $('#ddlSlitWidth').val();
    let NoOfSlitsValue = $('#txtNoOfSlits').val();
    let IdentificationNo = G_IdentificationNo;
    let TotalWeight = $('#txtTotalWeight').val();

    if (!$('#ddlItemName').val()) {
        toastr.error('Please select an item name');
        return;
    }
    if (!$('#ddlSlitWidth').val()) {
        toastr.error('Please select a slit width');
        return;
    }
    if ($('#ddlItemName').val()==0) {
        toastr.error('Please select an item name');
        return;
    }
    if (!$('#ddlSlitWidth').val() || $('#ddlSlitWidth').val() == 0) {
        toastr.error('Please select a slit width');
        return;
    }
    
    // Validate that the width value is a valid number
    let slitWidthValue = parseFloat($('#ddlSlitWidth').val());
    if (isNaN(slitWidthValue) || slitWidthValue <= 0) {
        toastr.error('Please select a valid slit width');
        return;
    }
    if (!$('#txtNoOfSlits').val()) {
        toastr.error('Please enter number of slits');
        return;
    }
    if (!$('#txtWeightPerSlit').val()) {
        toastr.error('Please enter weight per slit');
        return;
    }
    let RMStockPayloadData = {
        Code: G_SNo,
        itemMaster_Code: ItemMaster_Code,
        ItemParameterValueMaster_Code: ItemMasterWidth_Code,
        noofSlit: NoOfSlitsValue,
        identificationNo: IdentificationNo,
        totalWeight: TotalWeight,
        
    }
    RMStockService.SaveRMStockData(RMStockPayloadData).then(function (response) {
        //addNewRow();
        if (response.Status == 'Y') {
            toastr.success(response.Message);
            ShowRMStockPlan();
            clearForm();
        }
        else {
            toastr.error(response.Message);
        }
        
    });
    // Add the row to the table
    
    // If copy from previous is checked, copy data for next entry
    if ($('#CopyFromPrevious').is(':checked')) {
        setTimeout(function() {
            copyFromPrevious();
        }, 100);
    }
}
function CloseModal_RMStock() {
    $('#PlannedMyModal').modal('hide');
}
function BindSelectList1(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function getUrlVars() {
    var vars = {};
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}


// Tab Management Functions
function initializeTabs() {
    // Initialize Bootstrap tabs
    var triggerTabList = [].slice.call(document.querySelectorAll('#rmStockTabs button'));
    triggerTabList.forEach(function (triggerEl) {
        var tabTrigger = new bootstrap.Tab(triggerEl);
        
        triggerEl.addEventListener('click', function (event) {
            event.preventDefault();
            tabTrigger.show();
            
            // Load data for the active tab
            var targetTab = triggerEl.getAttribute('data-bs-target');
            loadTabData(targetTab);
        });
    });
}

function loadTabData(tabId) {
    switch(tabId) {
        case '#current-stock':
            // Current stock data is already loaded by default
            break;
        case '#dispatch':
            loadDispatchData();
            break;
        case '#slitted':
            loadSlittedData();
            break;
        case '#job-work':
            loadJobWorkData();
            break;
        case '#stock-summary':
            loadStockSummaryData();
            break;
    }
}

function loadDispatchData() {
    // Load dispatch data for current month
    console.log('Loading dispatch data...');
    // Add your dispatch data loading logic here
    // Example: RmIndentService.GetDispatchData().then(function(response) { ... });
}

function loadSlittedData() {
    // Load slitted data
    console.log('Loading slitted data...');
    // Add your slitted data loading logic here
    // Example: RmIndentService.GetSlittedData().then(function(response) { ... });
}

function loadJobWorkData() {
    // Load job work data
    console.log('Loading job work data...');
    // Add your job work data loading logic here
    // Example: RmIndentService.GetJobWorkData().then(function(response) { ... });
}

function loadStockSummaryData() {
    // Load stock summary data
    console.log('Loading stock summary data...');
    
    // Calculate and display summary statistics
    calculateStockSummary();
    
    // Add your stock summary data loading logic here
    // Example: RmIndentService.GetStockSummaryData().then(function(response) { ... });
}

function calculateStockSummary() {
    // Calculate total stock value and items
    // This is a placeholder - implement your actual calculation logic
    $('#totalStockValue').text('₹ 0.00');
    $('#totalItems').text('0');
    
    // Example calculation (replace with your actual logic):
    // let totalValue = 0;
    // let totalItems = 0;
    // // Calculate from your data
    // $('#totalStockValue').text('₹ ' + totalValue.toFixed(2));
    // $('#totalItems').text(totalItems);
}

// Tab-specific data loading functions
function refreshCurrentStock() {
    ListStatus_IndentMaster();
}

function refreshDispatch() {
    loadDispatchData();
}

function refreshSlitted() {
    loadSlittedData();
}

function refreshJobWork() {
    loadJobWorkData();
}

function refreshStockSummary() {
    loadStockSummaryData();
}

// Global functions for tab management
window.initializeTabs = initializeTabs;
window.loadTabData = loadTabData;
window.loadDispatchData = loadDispatchData;
window.loadSlittedData = loadSlittedData;
window.loadJobWorkData = loadJobWorkData;
window.loadStockSummaryData = loadStockSummaryData;
window.calculateStockSummary = calculateStockSummary;
window.refreshCurrentStock = refreshCurrentStock;
window.refreshDispatch = refreshDispatch;
window.refreshSlitted = refreshSlitted;
window.refreshJobWork = refreshJobWork;
window.refreshStockSummary = refreshStockSummary;
window.ShowModelPlanned = ShowModelPlanned;
window.CloseModal_RMStock = CloseModal_RMStock;
window.Save_PlannedSlitting = Save_PlannedSlitting;
window.validateIntegerInput = validateIntegerInput;
window.calculateTotalWeight = calculateTotalWeight;
window.copyFromPrevious = copyFromPrevious;
//window.addNewRow = addNewRow;
window.clearForm = clearForm;
window.editRow = editRow;
window.deleteRow = deleteRow;
window.updateTableTotals = updateTableTotals;
window.validateDecimalRateInput = validateDecimalRateInput;
window.fillTableWithExistingData = fillTableWithExistingData;
window.enableNewRowAddition = enableNewRowAddition;
window.DeleteModal = DeleteModal;
window.CloseModal = CloseModal;