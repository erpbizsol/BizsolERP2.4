import { POApprovalService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/POApprovalService.js';
$(document).ready(function () {
    POApprovalService.GetUnApprovedPO().then(function (response) {
        const stringFilterColumn = ["Party Name", "Product", "Payment Terms"];
        const numericFilterColumn = ["Code", "PO No", "PO Amount"];
        const dateFilterColumn = ["PO Date"];
        const button = false;
        const stringDoubleFilterColumn = ["Product"];
        const showButtons = [];
        const hiddenColumns = [];
        const updatedResponse = response.map(item => ({
            ...item, Action: `<button class="btn btn-success" title="Approve" onclick="Approval('${item.Code}')"><i class="fa fa-check-circle" aria-hidden="true"></i></button>
        <button class="btn btn-info" title="View Details" onclick="ViewData('${item.Code}')"><i class="fa fa-folder-open" aria-hidden="true"></i></button>
        <button class="btn btn-info" title="Attchment" onclick="Approval('${item.Approve}')"><i class="fa-solid fa-paperclip"></i></button>
        <button class="btn btn-info" title="Preview" onclick="ViewData('${item.Code}')"><i class="fa fa-eye" aria-hidden="true"></i></button>`
        }));
        // Initialize the data table with the response
        CreateDataTable("table-header", "table-body", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns);

        // Set up the event listener for each row or button in the table, if needed
        response.forEach(item => {
            // Example: Add click listener for each item
            $(`#l-${item.Code}`).on("click", function () {
                // Call function to handle button click, e.g., open modal with PO details
                openPODetails(item.Code);
            });
        });
    });
});

window.openPODetails=function(code) {
    //alert(code);
    POApprovalService.GetPODetail(code).then(function (data) {
        const stringFilterColumn = ["Item Code", "Item Description", "Requested By","Last Purchased From"];
        const numericFilterColumn = ["PO Qty", "IndentMaster_Code", "Rate", "Rate After Discount", "Amount", "Indent No", "ItemMaster_Code", "itemsizemaster_Code", "Last PO Rate", "Last Purchased Qty", "Dis. (%)","Tolerance %"];
        const dateFilterColumn = ["PO Date","Last Po Date"];
        const button = false;
        const stringDoubleFilterColumn = ["Product"];
        const showButtons = [];
        const hiddenColumns = ["AllowPOWithOutIndent_RawMaterial_Code", "Size Description", "Specification"];
        const updatedResponse = data.map(item => ({ ...item, Action: `<button class="btn btn-info" title="View History" onclick="ViewHistory('${item.ItemMaster_Code}', '${item.itemsizemaster_Code}')"><i class="fa fa-folder-open" aria-hidden="true"></i></button>`}));
        //alert(data)
        // Update or re-create the data table with the specific PO details
        CreateDataTable("modal-table-header", "modal-table-body", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns);
        data.forEach(item => {
            // Example: Add click listener for each item
            $(`#l-${item.ItemMaster_Code, item.itemsizemaster_Code}`).on("click", function () {
                // Call function to handle button click, e.g., open modal with PO details
                openPOHistory(item.ItemMaster_Code, item.itemsizemaster_Code);
            });
        });
    });
}

window.openPOHistory = function (ItemMaster_Code, itemsizemaster_Code) {
    //alert(ItemMaster_Code);
    //alert(itemsizemaster_Code);
    POApprovalService.GetPOHistory(ItemMaster_Code, itemsizemaster_Code).then(function (result) {
        console.log(result);
        const stringFilterColumn = [];
        const numericFilterColumn = [];
        const dateFilterColumn = [];
        const button = false;
        const stringDoubleFilterColumn = [];
        const showButtons = [];
        const hiddenColumns = [];
        //alert(data) 
        // Update or re-create the data table with the specific PO details
        CreateDataTable("modal-history-table-header", "modal-history-table-body", result, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns);

    });
}

function ViewData(Code) {
    $('#myModal').modal('show');
    $('#myModal').modal({
        backdrop: 'static',
    });
    openPODetails(Code);
}

function CloseModal() {
    $('#myModal').modal('hide');
}

function Approval(Code) {
    POApprovalService.POApproved(Code).then(function (approve) {
        if (approve.status === 'Y') {
            alert(approve.Msg);
            GetUnApprovedPO();
        
        }
        else {
            alert(approve.Msg);
        }
    });
}
function ViewHistory(ItemMaster_Code, itemsizemaster_Code) {
    $('#myHistoryModal').modal('show');
    $('#myHistoryModal').modal({
        backdrop: 'static',
    });
    openPOHistory(ItemMaster_Code, itemsizemaster_Code);
}
function CloseHistoryModal() {
    $('#myHistoryModal').modal('hide');
}
// Expose OpenModal and CloseModal globally if needed
window.ViewData = ViewData;
window.CloseModal = CloseModal;
window.Approval = Approval;
window.ViewHistory = ViewHistory;
window.CloseHistoryModal = CloseHistoryModal;
