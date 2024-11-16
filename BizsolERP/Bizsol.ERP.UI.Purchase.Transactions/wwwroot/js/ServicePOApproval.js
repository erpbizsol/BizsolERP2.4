import { ServicePOApprovalService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/ServicePOApprovalService.js';

$(document).ready(function () {
    ServicePOApprovalService.GetUnApprovedServicePO().then(function (response) {
        console.log(response)
        const stringFilterColumn = ["Party", "Description", "Payment Terms"];
        const numericFilterColumn = ["Code", "PO No.", "Amount"];
        const dateFilterColumn = ["PO Date"];
        const button = false;
        const stringDoubleFilterColumn = [];
        const showButtons = [];
        const hiddenColumns = [];
        const updatedResponse = response.map(item => ({
            ...item, Action: `<button class="btn btn-success" title="Approve" onclick="Approval('${item.Code}')"><i class="fa fa-check-circle" aria-hidden="true"></i></button>
        <button class="btn btn-info" title="View Details" onclick="ViewData('${item.Code}')"><i class="fa fa-folder-open" aria-hidden="true"></i></button>`
        }));
        // Initialize the data table with the response
        CreateDataTable("table-header", "table-body", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns);

    });

});
window.openServicePODetails = function (code) {
    //alert(code);
    ServicePOApprovalService.GetServicePODetail(code).then(function (data) {
        const stringFilterColumn = ["Description"];
        const numericFilterColumn = ["Qty", "Rate", "Amount"];
        const dateFilterColumn = [];
        const button = false;
        const stringDoubleFilterColumn = [];
        const showButtons = [];
        const hiddenColumns = [];
        const updatedResponse = data.map(item => ({ ...item }));
        // Update or re-create the data table with the specific PO details
        CreateDataTable("modal-table-header", "modal-table-body", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns);
    });
}

function Approval(Code) {
    ServicePOApprovalService.ServicePOApproved(Code).then(function (approve) {
        alert(approve);
        if (approve.status === "Y") {
            alert(approve.Msg);
        }
        else {
            alert(approve.Msg);
        }
    });
}

function ViewData(Code) {
    $('#myModal').modal('show');
    $('#myModal').modal({
        backdrop: 'static',
    });
    openServicePODetails(Code);
}
function CloseModal(Code) {
    $('#myModal').modal('hide');
}

window.ViewData = ViewData;
window.CloseModal = CloseModal;
window.Approval = Approval;