import { SaleOrderApprovalService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/SaleOrderApprovalService.js';
$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
    GetSaleOrderApproval();
});
function GetSaleOrderApproval() {
    SaleOrderApprovalService.GetUnApprovedSaleOrders().then(function (response) {
        if (response.length > 0) {
            const StringFilterColumn = ["Order No", "PartyName", "Sales Person"];
            const NumericFilterColumn = ["Qty MT", "Qty PC", "Qty MTRS", "Amount", "TotalOrderAmount"];
            const DateFilterColumn = ["Order Date"];
            const Button = false;
            const StringdoubleFilterColumn = ["PartyName"];
            const showButtons = [];
            const hiddenColumns = ["Code", "BuyerPOMaster_Code"];
            // const searchInput = document.getElementById('btnSearch');
            //function renderTable() {
            //    const searchText = searchInput.value.toLowerCase();
            //    const filteredResponse = response.filter(item =>
            //        Object.values(item).some(value =>
            //            value && value.toString().toLowerCase().includes(searchText)
            //        )
            //    );
            const updatedResponse = response.map(item => ({
                ...item, Action: item.Action ? `<button style="background-color:#198754;border-radius: 5px; " onclick="ViewData('${item.BuyerPOMaster_Code}')"><i class="fa-solid fa-folder-open" data-toggle="tooltip" data-placement="top" title="View Details" style="color:white;"></i></button>
                   <button style="background-color:#3f51b5;border-radius: 5px" onclick="SaleOrderApprovedlist('${item.BuyerPOMaster_Code}')"><i class="fa fa-check-circle" data-toggle="tooltip" data-placement="top" title="Approve" style="color:white;"></i></button>
                ` : ""
            }));
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns);
            // }
            // renderTable();
            // searchInput.addEventListener('input', renderTable);
        }
        else {
            toastr.error("Record not found...!");
           // alert("No data available.");
        }
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
    toastr.options.positionClass = "toast-top-right";
    SaleOrderApprovalService.SaleOrderApproved(BCode).then(function (resdata) {
        if (resdata.Status === "Y") {
            toastr.success(resdata.Msg);
            SaleOrderApprovedlist(BCode);
            GetWebNotificationList();
          

        } else {
            toastr.error(resdata.Msg)
        }
    }).catch(function (error) {
        toastr.error("Error in Sale Order Approval: ", error);
    });
};

window.ViewData = ViewData;
window.closeModal = closeModal;
window.SaleOrderApprovedlist = SaleOrderApprovedlist;

