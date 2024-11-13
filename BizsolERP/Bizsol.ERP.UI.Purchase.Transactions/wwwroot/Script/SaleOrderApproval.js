import { SaleOrderApprovalService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/SaleOrderApprovalService.js';
$(document).ready(function () {
    GetSaleOrderApproval();

});

function GetSaleOrderApproval() {
    SaleOrderApprovalService.GetUnApprovedSaleOrders().then(function (response) {
        const StringFilterColumn = ["Order No", "PartyName", "Sales Person"];
        const NumericFilterColumn = ["Qty MT", "Qty PC", "Qty MTRS", "Amount", "TotalOrderAmount"];
        const DateFilterColumn = ["Order Date"];
        const Button = false;
        const StringdoubleFilterColumn = ["UserName"];
        //const showButtons = ["V","A"];
        const showButtons = [];
        const hiddenColumns = ["Code","BuyerPOMaster_Code"];
        const updatedResponse = response.map(item => ({ ...item, Action: item.Action ? `<button onclick="ViewData('${item.BuyerPOMaster_Code}')">View</button>` : "" }));
         //response = response.map((item) => ({ Action: '<button onclick="alert(' + item.BuyerPOMaster_Code +')">Edit</button>'  }))
        CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns)
    });
}
window.GetSaleOrderDetails = function (Code) {
    SaleOrderApprovalService.GetSaleOrderDetail(Code).then(function (data) {
        const StringFilterColumn = ["Party Name"];
        const NumericFilterColumn = ["PO No"];
        const DateFilterColumn = ["PO Date"];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = ["Product"];
        const hiddenColumns = ["Code"];
        CreateDataTable("table-header1", "table-body1", data, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns);

    });
}
function ViewData(Code) {
    $('#myModal').modal('show');
    $('#myModal').modal({
        backdrop: 'static', 
    });
    GetSaleOrderDetails(Code);
}
function closeModal() {
    $('#myModal').modal('hide');
}



window.ViewData = ViewData;
window.closeModal = closeModal;

