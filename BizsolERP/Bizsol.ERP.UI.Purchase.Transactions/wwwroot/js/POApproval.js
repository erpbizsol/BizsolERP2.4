import { POApprovalService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/POApprovalService.js';

$(document).ready(function () {
    POApprovalService.GetUnApprovedPO().then(function (response) {
        const stringFilterColumn = ["Party Name", "Product", "Payment Terms"];
        const numericFilterColumn = ["Code", "PO No", "PO Amount"];
        const dateFilterColumn = ["PO Date"];
        const button = true;
        const stringDoubleFilterColumn = ["Product"];
        const showButtons = ["V"];

        // Initialize the data table with the response
        CreateDataTable(response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn);

        // Set up the event listener for each row or button in the table, if needed
        response.forEach(item => {
            // Example: Add click listener for each item
            $(`#button-${item.Code}`).on("click", function () {
                // Call function to handle button click, e.g., open modal with PO details
                openPODetails(item.Code);
            });
        });
    });
});

window.openPODetails=function(code) {
    alert(code);
    POApprovalService.GetPODetail(code).then(function (data) {
        const stringFilterColumn = ["Party Name", "Product", "Payment Terms"];
        const numericFilterColumn = ["Code", "PO No", "PO Amount"];
        const dateFilterColumn = ["PO Date"];
        const button = true;
        const stringDoubleFilterColumn = ["Product"];
        const showButtons = ["V"];

        // Update or re-create the data table with the specific PO details
        CreateDataTable(data, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn);

        // Open the modal to display details
        OpenModal();
    });
}

function OpenModal() {
    openPODetails('10919');
    $('#myModal').modal('show');
    $('#myModal').modal({
        backdrop: 'static',
    });
}

function CloseModal() {
    $('#myModal').modal('hide');
}

// Expose OpenModal and CloseModal globally if needed
window.OpenModal = OpenModal;
window.CloseModal = CloseModal;
