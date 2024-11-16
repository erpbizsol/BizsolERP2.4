import { SaleOrderApprovalService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/SaleOrderApprovalService.js';
$(document).ready(function () {
    GetSaleOrderApproval();
});
//function GetSaleOrderApproval() {
//    SaleOrderApprovalService.GetUnApprovedSaleOrders().then(function (response) {
//        const StringFilterColumn = ["Order No", "PartyName", "Sales Person"];
//        const NumericFilterColumn = ["Qty MT", "Qty PC", "Qty MTRS", "Amount", "TotalOrderAmount"];
//        const DateFilterColumn = ["Order Date"];
//        const Button = false;
//        const StringdoubleFilterColumn = ["UserName"];
//        //const showButtons = ["V","A"];
//        const showButtons = [];
//        const hiddenColumns = ["Code","BuyerPOMaster_Code"];
//        const updatedResponse = response.map(item => ({ ...item, Action: item.Action ? `<button onclick="ViewData('${item.BuyerPOMaster_Code}')">View</button>` : "" }));
//         //response = response.map((item) => ({ Action: '<button onclick="alert(' + item.BuyerPOMaster_Code +')">Edit</button>'  }))
//        CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns)
//    });
//}
function GetSaleOrderApproval() {
    SaleOrderApprovalService.GetUnApprovedSaleOrders().then(function (response) {
        const StringFilterColumn = ["Order No", "PartyName", "Sales Person"];
        const NumericFilterColumn = ["Qty MT", "Qty PC", "Qty MTRS", "Amount", "TotalOrderAmount"];
        const DateFilterColumn = ["Order Date"];
        const Button = false;
        const StringdoubleFilterColumn = ["PartyName"];
        const showButtons = [];
        const hiddenColumns = ["Code", "BuyerPOMaster_Code"];
        const searchInput = document.getElementById('btnSearch');
        function renderTable() {
            const searchText = searchInput.value.toLowerCase();
            const filteredResponse = response.filter(item =>
                Object.values(item).some(value =>
                    value && value.toString().toLowerCase().includes(searchText)
                )
            );
            const updatedFilteredResponse = filteredResponse.map(item => ({
                ...item, Action: item.Action ? `<button style="background-color:#198754;border-radius: 5px; " onclick="ViewData('${item.BuyerPOMaster_Code}')"><i class="fa-solid fa-folder-open" style="color:white;"></i></button>
                   <button style="background-color:#3f51b5;border-radius: 5px" onclick="SaleOrderApprovedlist('${item.BuyerPOMaster_Code}')"><i class="fa fa-check-circle" style="color:white;"></i></button>
                ` : ""
            }));
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedFilteredResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns);
        }
        renderTable();
        searchInput.addEventListener('input', renderTable);
    });
}
window.GetSaleOrderDetails = function (Code) {
    SaleOrderApprovalService.GetSaleOrderDetail(Code).then(function (data) {
        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code"];
        BizsolCustomFilterGrid.CreateDataTable("table-header1", "table-body1", data, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns);

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
function SaleOrderApprovedlist(BCode) {
    SaleOrderApprovalService.SaleOrderApproved(BCode).then(function (resdata) {
        if (resdata.Status === "Y") {
            SaleOrderApprovedlist(BCode);
            GetWebNotificationList();
             alert("Success: " + resdata.Msg);
           
        }else {
            alert("No Approval Sale Order !..");
            //alert("Error: " + resdata.Msg);
        }
    }).catch(function (error) {
        console.error("Error in Sale Order Approval: ", error);
        alert("Error while processing sale order approval");
    });
};

window.ViewData = ViewData;
window.closeModal = closeModal;
window.SaleOrderApprovedlist = SaleOrderApprovedlist;

