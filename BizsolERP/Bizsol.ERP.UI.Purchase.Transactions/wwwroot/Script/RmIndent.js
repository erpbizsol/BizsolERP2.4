import { RmIndentService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/RmIndentService.js';

let currentIndentId = null;
let isEditMode = false;

$(document).ready(function () {
    var urlParams = getUrlVars();
    var menuValue = decodeURI(urlParams['menu']);
    
    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    } else {
        $("#ERPHeading").text("Raw Material Indent Management");
    }
    GetRMIndentListTable();
    //loadIndentData();
    //setCurrentDate();
});

function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    $('#indentDate').val(today);
}
function GetRMIndentListTable() {
    //Showloader();
    RmIndentService.GetRmIndentList().then(function (response) {
        if (response && response.length > 0) {
            //HideLoader();
            $('#tblRMIndent').show();
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const columnAlignment = {
                'Indent Date': 'center',
            };
            const updatedResponse = response.map((item, index) => {
                let sourceInputHTML = `<button type="button" id="txtSource${index + 1}" class="btn btn-primary btn-height" title="Source" onclick="ShowModelVenderDetails(this);">Add Source</button>`;
                let statusInputHTML = `<select id="ddlStatus${index + 1}" class="form-control form-control-sm box_border" name="ddlStatus"  autocomplete="off" onchange="OnChange_ddlStatus(this);" style="min-width: 70px;"><option>Purchased</option><option>Pending</option><option>Reject</option></select>`;
                let purchaseDateInputHTML = `<input type="date" id="txtPurchaseDate${index + 1}" onkeypress="BizSolhandleEnterKey(event);" value="" class="BizSolFormControl box_border form-control form-control-sm" name="txtSource" placeholder="" autocomplete="off" onclick="$(this).val('')" style="min-width: 70px;" onchange="" required>`;
                return {
                    ...item,
                    Source: sourceInputHTML,
                    Status: statusInputHTML,
                    'Purchase Date': purchaseDateInputHTML,
                };
            });

            BizsolCustomFilterGrid.CreateDataTable("table-header-RMIndent", "table-body-RMIndent", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
            
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $('#tblRMIndent').hide();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during RMIndent');
        });
}
function ShowModelVenderDetails() {

}
function loadIndentData() {
    ShowLoader();
    RmIndentService.GetAllIndents().then(function (response) {
        HideLoader();
        if (response && response.length > 0) {
            displayIndentData(response);
        } else {
            toastr.info("No indent data found");
            $("#RmIndentTable").hide();
        }
    }).catch(error => {
        HideLoader();
        console.error("Error loading indent data:", error);
        toastr.error("Error loading indent data. Please try again or contact support if the problem persists.");
        $("#RmIndentTable").hide();
    });
}

function displayIndentData(data) {
    const stringFilterColumn = ["Indent No", "Item Name", "Size", "Grade", "Make", "Source"];
    const numericFilterColumn = ["QTY PC", "QTY MT", "QTY MTRS"];
    const dateFilterColumn = ["Indent Date", "Purchased Date"];
    const button = false;
    const stringDoubleFilterColumn = [];
    const showButtons = [];
    const hiddenColumns = ["Id"];
    const ColumnAlignment = {
        "QTY PC": 'right',
        "QTY MT": 'right',
        "QTY MTRS": 'right',
        "Indent Date": 'center',
        "Purchased Date": 'center',
        "Indent No": 'center'
    };

    const updatedResponse = data.map(item => ({
        ...item,
        Status: getStatusBadge(item.Status),
        Action: getActionButtons(item.Id, item.Status)
    }));

    BizsolCustomFilterGrid.CreateDataTable(
        "table-header-RmIndentTable", 
        "table-body-RmIndentTable", 
        updatedResponse, 
        button, 
        showButtons, 
        stringFilterColumn, 
        numericFilterColumn, 
        dateFilterColumn, 
        stringDoubleFilterColumn, 
        hiddenColumns, 
        ColumnAlignment
    );
}

function getStatusBadge(status) {
    const statusClass = status.toLowerCase() === 'purchased' ? 'status-purchased' : 
                       status.toLowerCase() === 'pending' ? 'status-pending' : 'status-reject';
    return `<span class="status-badge ${statusClass}">${status}</span>`;
}

function getActionButtons(id, status) {
    let buttons = `
        <div class="action-buttons">
            <button class="btn btn-info btn-sm" title="View Details" onclick="viewDetails(${id})">
                <i class="fa fa-eye"></i>
            </button>
            <button class="btn btn-primary btn-sm" title="Edit" onclick="editIndent(${id})">
                <i class="fa fa-edit"></i>
            </button>
            <button class="btn btn-info btn-sm" title="View History" onclick="viewHistory(${id})">
                <i class="fa fa-history"></i>
            </button>
    `;
    
    if (status.toLowerCase() === 'pending') {
        buttons += `
            <button class="btn btn-success btn-sm" title="Approve" onclick="approveIndent(${id})">
                <i class="fa fa-check"></i>
            </button>
            <button class="btn btn-warning btn-sm" title="Reject" onclick="showRejectModal(${id})">
                <i class="fa fa-times"></i>
            </button>
        `;
    }
    
    if (status.toLowerCase() === 'pending') {
        buttons += `
            <button class="btn btn-success btn-sm" title="Mark as Purchased" onclick="markAsPurchased(${id})">
                <i class="fa fa-shopping-cart"></i>
            </button>
        `;
    }
    
    buttons += `
            <button class="btn btn-danger btn-sm" title="Delete" onclick="deleteIndent(${id})">
                <i class="fa fa-trash"></i>
            </button>
        </div>
    `;
    
    return buttons;
}

function showCreateModal() {
    isEditMode = false;
    currentIndentId = null;
    $('#modalTitle').text('Create New Indent');
    $('#indentForm')[0].reset();
    setCurrentDate();
    $('#indentModal').modal('show');
}

function editIndent(id) {
    isEditMode = true;
    currentIndentId = id;
    $('#modalTitle').text('Edit Indent');
    
    ShowLoader();
    RmIndentService.GetIndentById(id).then(function (response) {
        HideLoader();
        if (response) {
            populateForm(response);
            $('#indentModal').modal('show');
        } else {
            toastr.error("Indent not found");
        }
    }).catch(error => {
        HideLoader();
        toastr.error("Error loading indent data:", error);
    });
}

function populateForm(data) {
    $('#indentId').val(data.Id);
    $('#indentNo').val(data.IndentNo);
    $('#indentDate').val(data.IndentDate);
    $('#itemName').val(data.ItemName);
    $('#size').val(data.Size);
    $('#thickness').val(data.Thickness);
    $('#grade').val(data.Grade);
    $('#make').val(data.Make);
    $('#qtyPC').val(data.QtyPC);
    $('#qtyMT').val(data.QtyMT);
    $('#qtyMTRS').val(data.QtyMTRS);
    $('#source').val(data.Source);
    $('#status').val(data.Status);
    $('#remark').val(data.Remark);
}

function saveIndent() {
    if (!validateForm()) {
        return;
    }
    
    const formData = {
        Id: $('#indentId').val() || 0,
        IndentNo: $('#indentNo').val(),
        IndentDate: $('#indentDate').val(),
        ItemName: $('#itemName').val(),
        Size: $('#size').val(),
        Thickness: $('#thickness').val(),
        Grade: $('#grade').val(),
        Make: $('#make').val(),
        QtyPC: parseFloat($('#qtyPC').val()) || 0,
        QtyMT: parseFloat($('#qtyMT').val()) || 0,
        QtyMTRS: parseFloat($('#qtyMTRS').val()) || 0,
        Source: $('#source').val(),
        Status: $('#status').val(),
        Remark: $('#remark').val()
    };
    
    ShowLoader();
    
    const serviceCall = isEditMode ? 
        RmIndentService.UpdateIndent(currentIndentId, formData) : 
        RmIndentService.CreateIndent(formData);
    
    serviceCall.then(function (response) {
        HideLoader();
        if (response && response.Status === "Y") {
            toastr.success(response.Msg || "Indent saved successfully");
            closeModal();
            loadIndentData();
        } else {
            toastr.error(response.Msg || "Error saving indent");
        }
    }).catch(error => {
        HideLoader();
        toastr.error("Error saving indent:", error);
    });
}

function validateForm() {
    const requiredFields = ['indentNo', 'indentDate', 'itemName'];
    let isValid = true;
    let errorMessages = [];
    
    // Clear previous validation errors
    $('.form-control').removeClass('is-invalid');
    $('.invalid-feedback').remove();
    
    // Validate required fields
    requiredFields.forEach(field => {
        const value = $(`#${field}`).val().trim();
        if (!value) {
            $(`#${field}`).addClass('is-invalid');
            $(`#${field}`).after(`<div class="invalid-feedback">${getFieldDisplayName(field)} is required</div>`);
            errorMessages.push(`${getFieldDisplayName(field)} is required`);
            isValid = false;
        }
    });
    
    // Validate date
    const indentDate = $('#indentDate').val();
    if (indentDate) {
        const selectedDate = new Date(indentDate);
        const today = new Date();
        if (selectedDate > today) {
            $('#indentDate').addClass('is-invalid');
            $('#indentDate').after('<div class="invalid-feedback">Indent date cannot be in the future</div>');
            errorMessages.push('Indent date cannot be in the future');
            isValid = false;
        }
    }
    
    // Validate quantities
    const qtyPC = parseFloat($('#qtyPC').val()) || 0;
    const qtyMT = parseFloat($('#qtyMT').val()) || 0;
    const qtyMTRS = parseFloat($('#qtyMTRS').val()) || 0;
    
    if (qtyPC < 0 || qtyMT < 0 || qtyMTRS < 0) {
        errorMessages.push('Quantities cannot be negative');
        isValid = false;
    }
    
    if (qtyPC === 0 && qtyMT === 0 && qtyMTRS === 0) {
        errorMessages.push('At least one quantity must be greater than zero');
        isValid = false;
    }
    
    // Validate indent number format
    const indentNo = $('#indentNo').val().trim();
    if (indentNo && !/^[A-Za-z0-9\-_]+$/.test(indentNo)) {
        $('#indentNo').addClass('is-invalid');
        $('#indentNo').after('<div class="invalid-feedback">Indent number can only contain letters, numbers, hyphens, and underscores</div>');
        errorMessages.push('Invalid indent number format');
        isValid = false;
    }
    
    if (!isValid) {
        toastr.error('Please fix the following errors:\n' + errorMessages.join('\n'));
    }
    
    return isValid;
}

function getFieldDisplayName(field) {
    const fieldNames = {
        'indentNo': 'Indent Number',
        'indentDate': 'Indent Date',
        'itemName': 'Item Name'
    };
    return fieldNames[field] || field;
}

function viewDetails(id) {
    ShowLoader();
    RmIndentService.GetIndentById(id).then(function (response) {
        HideLoader();
        if (response) {
            displayIndentDetails(response);
            $('#detailsModal').modal('show');
        } else {
            toastr.error("Indent not found");
        }
    }).catch(error => {
        HideLoader();
        toastr.error("Error loading indent details:", error);
    });
}

function displayIndentDetails(data) {
    const detailsHtml = `
        <div class="row">
            <div class="col-md-6">
                <table class="table table-bordered">
                    <tr><th>Indent No:</th><td>${data.IndentNo || 'N/A'}</td></tr>
                    <tr><th>Indent Date:</th><td>${data.IndentDate || 'N/A'}</td></tr>
                    <tr><th>Item Name:</th><td>${data.ItemName || 'N/A'}</td></tr>
                    <tr><th>Size:</th><td>${data.Size || 'N/A'}</td></tr>
                    <tr><th>Thickness:</th><td>${data.Thickness || 'N/A'}</td></tr>
                    <tr><th>Grade:</th><td>${data.Grade || 'N/A'}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <table class="table table-bordered">
                    <tr><th>Make:</th><td>${data.Make || 'N/A'}</td></tr>
                    <tr><th>QTY PC:</th><td>${data.QtyPC || 'N/A'}</td></tr>
                    <tr><th>QTY MT:</th><td>${data.QtyMT || 'N/A'}</td></tr>
                    <tr><th>QTY MTRS:</th><td>${data.QtyMTRS || 'N/A'}</td></tr>
                    <tr><th>Source:</th><td>${data.Source || 'N/A'}</td></tr>
                    <tr><th>Status:</th><td>${getStatusBadge(data.Status)}</td></tr>
                </table>
            </div>
        </div>
        <div class="row">
            <div class="col-md-12">
                <table class="table table-bordered">
                    <tr><th>Remark:</th><td>${data.Remark || 'N/A'}</td></tr>
                    <tr><th>Purchased Date:</th><td>${data.PurchasedDate || 'N/A'}</td></tr>
                </table>
            </div>
        </div>
    `;
    
    $('#indentDetails').html(detailsHtml);
}

function viewHistory(id) {
    ShowLoader();
    RmIndentService.GetIndentHistory(id).then(function (response) {
        HideLoader();
        if (response && response.length > 0) {
            displayHistoryData(response);
            $('#historyModal').modal('show');
        } else {
            toastr.info("No history found for this indent");
        }
    }).catch(error => {
        HideLoader();
        toastr.error("Error loading indent history:", error);
    });
}

function displayHistoryData(data) {
    const stringFilterColumn = ["Action", "User"];
    const numericFilterColumn = [];
    const dateFilterColumn = ["Date"];
    const button = false;
    const showButtons = [];
    const hiddenColumns = [];
    const ColumnAlignment = {
        "Date": 'center'
    };

    BizsolCustomFilterGrid.CreateDataTable(
        "table-header-HistoryTable", 
        "table-body-HistoryTable", 
        data, 
        button, 
        showButtons, 
        stringFilterColumn, 
        numericFilterColumn, 
        dateFilterColumn, 
        [], 
        hiddenColumns, 
        ColumnAlignment
    );
    $('#paginator-HistoryTable').hide();
}

function approveIndent(id) {
    if (confirm("Are you sure you want to approve this indent?")) {
        ShowLoader();
        RmIndentService.ApproveIndent(id).then(function (response) {
            HideLoader();
            if (response && response.Status === "Y") {
                toastr.success(response.Msg || "Indent approved successfully");
                loadIndentData();
            } else {
                toastr.error(response.Msg || "Error approving indent");
            }
        }).catch(error => {
            HideLoader();
            toastr.error("Error approving indent:", error);
        });
    }
}

function showRejectModal(id) {
    currentIndentId = id;
    $('#rejectReason').val('');
    $('#rejectModal').modal('show');
}

function confirmReject() {
    const reason = $('#rejectReason').val().trim();
    if (!reason) {
        toastr.error("Please provide a reason for rejection");
        return;
    }
    
    ShowLoader();
    RmIndentService.RejectIndent(currentIndentId, reason).then(function (response) {
        HideLoader();
        if (response && response.Status === "Y") {
            toastr.success(response.Msg || "Indent rejected successfully");
            closeRejectModal();
            loadIndentData();
        } else {
            toastr.error(response.Msg || "Error rejecting indent");
        }
    }).catch(error => {
        HideLoader();
        toastr.error("Error rejecting indent:", error);
    });
}

function markAsPurchased(id) {
    const purchasedDate = prompt("Enter purchased date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    if (purchasedDate) {
        ShowLoader();
        RmIndentService.MarkAsPurchased(id, purchasedDate).then(function (response) {
            HideLoader();
            if (response && response.Status === "Y") {
                toastr.success(response.Msg || "Indent marked as purchased successfully");
                loadIndentData();
            } else {
                toastr.error(response.Msg || "Error marking indent as purchased");
            }
        }).catch(error => {
            HideLoader();
            toastr.error("Error marking indent as purchased:", error);
        });
    }
}

function deleteIndent(id) {
    if (confirm("Are you sure you want to delete this indent? This action cannot be undone.")) {
        ShowLoader();
        RmIndentService.DeleteIndent(id).then(function (response) {
            HideLoader();
            if (response && response.Status === "Y") {
                toastr.success(response.Msg || "Indent deleted successfully");
                loadIndentData();
            } else {
                toastr.error(response.Msg || "Error deleting indent");
            }
        }).catch(error => {
            HideLoader();
            toastr.error("Error deleting indent:", error);
        });
    }
}

function filterByStatus() {
    const status = $('#statusFilter').val();
    if (status) {
        ShowLoader();
        RmIndentService.GetIndentsByStatus(status).then(function (response) {
            HideLoader();
            if (response && response.length > 0) {
                displayIndentData(response);
            } else {
                toastr.info(`No indents found with status: ${status}`);
                $("#RmIndentTable").hide();
            }
        }).catch(error => {
            HideLoader();
            toastr.error("Error filtering indents:", error);
        });
    } else {
        loadIndentData();
    }
}

function searchIndents() {
    const searchTerm = $('#searchInput').val().trim();
    if (searchTerm.length >= 2) {
        const searchCriteria = {
            searchTerm: searchTerm,
            searchFields: ['IndentNo', 'ItemName', 'Size', 'Grade', 'Make']
        };
        
        ShowLoader();
        RmIndentService.SearchIndents(searchCriteria).then(function (response) {
            HideLoader();
            if (response && response.length > 0) {
                displayIndentData(response);
            } else {
                toastr.info("No indents found matching your search");
                $("#RmIndentTable").hide();
            }
        }).catch(error => {
            HideLoader();
            toastr.error("Error searching indents:", error);
        });
    } else if (searchTerm.length === 0) {
        loadIndentData();
    }
}

function refreshData() {
    loadIndentData();
}

function closeModal() {
    $('#indentModal').modal('hide');
}

function closeDetailsModal() {
    $('#detailsModal').modal('hide');
}

function closeHistoryModal() {
    $('#historyModal').modal('hide');
}

function closeRejectModal() {
    $('#rejectModal').modal('hide');
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

// Error handling wrapper
function handleServiceError(error, operation) {
    console.error(`Error in ${operation}:`, error);
    
    let errorMessage = `Error in ${operation}. `;
    
    if (error.includes('404')) {
        errorMessage += "The requested resource was not found.";
    } else if (error.includes('500')) {
        errorMessage += "Internal server error. Please try again later.";
    } else if (error.includes('403')) {
        errorMessage += "You don't have permission to perform this action.";
    } else if (error.includes('timeout')) {
        errorMessage += "Request timed out. Please check your connection and try again.";
    } else {
        errorMessage += "Please try again or contact support if the problem persists.";
    }
    
    toastr.error(errorMessage);
}

// Add retry mechanism for failed requests
function retryOperation(operation, maxRetries = 3) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        function attempt() {
            attempts++;
            operation()
                .then(resolve)
                .catch(error => {
                    if (attempts < maxRetries) {
                        console.log(`Retry attempt ${attempts} for operation`);
                        setTimeout(attempt, 1000 * attempts); // Exponential backoff
                    } else {
                        reject(error);
                    }
                });
        }
        
        attempt();
    });
}

// Export functions for global access
window.showCreateModal = showCreateModal;
window.editIndent = editIndent;
window.viewDetails = viewDetails;
window.viewHistory = viewHistory;
window.approveIndent = approveIndent;
window.showRejectModal = showRejectModal;
window.confirmReject = confirmReject;
window.markAsPurchased = markAsPurchased;
window.deleteIndent = deleteIndent;
window.filterByStatus = filterByStatus;
window.searchIndents = searchIndents;
window.refreshData = refreshData;
window.closeModal = closeModal;
window.closeDetailsModal = closeDetailsModal;
window.closeHistoryModal = closeHistoryModal;
window.closeRejectModal = closeRejectModal;
window.saveIndent = saveIndent;
