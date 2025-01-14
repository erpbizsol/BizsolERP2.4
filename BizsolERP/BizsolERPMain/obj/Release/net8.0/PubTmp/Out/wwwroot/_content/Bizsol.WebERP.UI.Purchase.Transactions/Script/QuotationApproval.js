import { QuotationApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/QuotationApprovalService.js';

$(document).ready(function () {
    $("#ERPHeading").text("Quotation Approval");
    GetApprovedQuotationList();
});
function GetApprovedQuotationList() {
    QuotationApprovalService.GetUnApprovedQuotation().then(function (resData) {
        if (resData && resData.length > 0) {
            const StringFilterColumn = ["Quotation No", "Party"];
        const NumericFilterColumn = ["Total Amount"];
        const DateFilterColumn = [];
        const Button = false;
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code"];
        const showButtons = [];
            const ColumnAlignment = {
                "Quotation Date": "center",
                "Quotation No": "center",
                "Total Amount": "right",
            };
        const updatedResponse = resData.map(item => ({
            ...item, Action: item.Action ? `<button class="btn btn-primary icon-height mb-1" title="View Details" onclick="ViewData('${item.Code}')"><i class="fa-solid fa-folder-open"></i></button>
                   <button class="btn btn-success icon-height mb-1" title="Approve" onclick="QuotationApprovedlist('${item.Code}')"><i class="fa fa-check-circle"></i></button>
                ` : ""
        }));
       
            BizsolCustomFilterGrid.CreateDataTable("table-header-QuotationTable", "table-body-QuotationTable", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
        else {
            toastr.error("No data available");
        }

    });
}

function ViewData(Code) {
    QuotationApprovalService.GetQuotationDetail(Code).then(function (response) {
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
            const ColumnAlignment = {};
                BizsolCustomFilterGrid.CreateDataTable("table-header-Quotation", "table-body-Quotation", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
    });
}
function CloseModal() {
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
window.CloseModal = CloseModal;
window.QuotationApprovedlist = QuotationApprovedlist;