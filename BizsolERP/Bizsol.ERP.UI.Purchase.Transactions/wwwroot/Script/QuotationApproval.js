
import { QuotationApprovalService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/QuotationApprovalService.js';

$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
    GetApprovedQuotationList();
});
function GetApprovedQuotationList() {
    QuotationApprovalService.GetUnApprovedQuotation().then(function (resData) {
        if (resData.length > 0) {
        const StringFilterColumn = ["Quotation No"];
        const NumericFilterColumn = ["Total Amount"];
        const DateFilterColumn = ["Quotation Date"];
        const Button = false;
        const StringdoubleFilterColumn = ["Party"];
        const hiddenColumns = ["Code"];
        const showButtons = [];
        const updatedResponse = resData.map(item => ({
            ...item, Action: item.Action ? `<button style="background-color:#198754;border-radius: 5px; " onclick="ViewData('${item.Code}')"><i class="fa-solid fa-folder-open" data-toggle="tooltip" data-placement="top" title="View Details" style="color:white;"></i></button>
                   <button style="background-color:#3f51b5;border-radius: 5px" onclick="QuotationApprovedlist('${item.Code}')"><i class="fa fa-check-circle" data-toggle="tooltip" data-placement="top" title="Approve" style="color:white;"></i></button>
                ` : ""
        }));
       
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns);
        }
        else {
            toastr.error("Record not found...!");
           // alert("No data available.");
        }

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
    toastr.options.positionClass = "toast-top-right";
 
    QuotationApprovalService.QuotationApproved(code).then(function (resdata) {
        if (resdata.Status === "Y")
        {
            toastr.success(resdata.Msg);
            
            GetWebNotificationList();
            GetApprovedQuotationList(code);

        } else {
            toastr.error(resdata.Msg);
          
            
        }
    }).catch(function (error) {
        toastr.error("Error in Sale Order Approval: ", error);
    });
};

window.ViewData = ViewData;
window.closeModal = closeModal;
window.QuotationApprovedlist = QuotationApprovedlist;