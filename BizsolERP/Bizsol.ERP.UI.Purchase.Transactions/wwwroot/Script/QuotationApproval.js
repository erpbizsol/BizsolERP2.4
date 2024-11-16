
import { QuotationApprovalService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/QuotationApprovalService.js';

$(document).ready(function () {
    GetApprovedQuotationList();
});
function GetApprovedQuotationList() {
    QuotationApprovalService.GetUnApprovedQuotation().then(function (resData) {
        const StringFilterColumn = ["Quotation No"];
        const NumericFilterColumn = ["Total Amount"];
        const DateFilterColumn = ["Quotation Date"];
        const Button = false;
        const StringdoubleFilterColumn = ["Party"];
        const ShowButton = ["V"];
        const hiddenColumns = ["Code"];
        const showButtons = [];
        const updatedResponse = resData.map(item => ({
            ...item, Action: item.Action ? `<button style="background-color:#198754;border-radius: 5px; " onclick="ViewData('${item.Code}')"><i class="fa-solid fa-folder-open" style="color:white;"></i></button>
                   <button style="background-color:#3f51b5;border-radius: 5px" onclick="QuotationApprovedlist('${item.Code}')"><i class="fa fa-check-circle" style="color:white;"></i></button>
                ` : ""
        }));
        BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns);
    });
}
window.GetQuotationDetails = function (Code) {
    QuotationApprovalService.GetQuotationDetail(Code).then(function (data) {
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
    GetQuotationDetails(Code);
}
function closeModal() {
    $('#myModal').modal('hide');
}
function QuotationApprovedlist(code) {
    QuotationApprovalService.QuotationApproved(code).then(function (resdata) {
        if (resdata.Status === "Y") {
            alert("Success: " + resdata.Msg);
            GetWebNotificationList();
            GetApprovedQuotationList(code);

        } else {
            alert("Error: " + resdata.Msg);
        }
    }).catch(function (error) {
        console.error("Error in Sale Order Approval: ", error);
        alert("Error while processing sale order approval");
    });
};
window.ViewData = ViewData;
window.closeModal = closeModal;
window.QuotationApprovedlist = QuotationApprovedlist;