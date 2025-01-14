import { SaleOrderApprovalService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/SaleOrderApprovalService.js';
$(document).ready(function () {
    $("#ERPHeading").text("Sale Order Approval");
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
            const ColumnAlignment = {
                "Order Date": "center",
                "Qty KG":"right",
                "Qty PC":"right",
                "Qty SQM":"right",
                "Amount":"right",
                "TotalOrderAmount":"right",
            };
            const updatedResponse = response.map(item => ({
                ...item, Action: item.Action ? `<button class="btn btn-primary icon-height mb-1" title="View Details" onclick="ViewData('${item.BuyerPOMaster_Code}')"><i class="fa-solid fa-folder-open"></i></button>
                   <button class="btn btn-success icon-height mb-1" title="Approve" onclick="SaleOrderApprovedlist('${item.BuyerPOMaster_Code}')"><i class="fa fa-check-circle"></i></button>
                ` : ""
            }));
            BizsolCustomFilterGrid.CreateDataTable("table-header-SaleOrderApproval", "table-body-SaleOrderApproval", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);  
        }
        else {
            toastr.error("No valid data found:", response);
        }
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
    });
}
function ViewData(Code) {
    SaleOrderApprovalService.GetSaleOrderDetail(Code).then(function (response) {
        if (response && response.length > 0) {
            $('#myModal').modal({
                backdrop: 'static',
            });
            $('#myModal').modal('show');
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = {
                "BuyerPOMaster_Code":"center",
                "Qty KG": "right",
                "Qty PC": "right",
                "Qty SQM": "right",
                "Amount": "right",
                };
            BizsolCustomFilterGrid.CreateDataTable("table-header-SaleOrderApprovalTable", "table-body-SaleOrderApprovalTable", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        } else {
            toastr.error("No valid data found:", response);
        }
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
    });
}
function CloseModal() {
    $('#myModal').modal('hide');
}
function SaleOrderApprovedlist(BCode) {
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
window.CloseModal = CloseModal;
window.SaleOrderApprovedlist = SaleOrderApprovedlist;

