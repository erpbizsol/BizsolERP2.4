import { GateEntryService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/GateEntryService.js';

$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
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
            ...item, Action: item.Action ? `<button style="background-color:#198754;border-radius: 5px; " onclick="ViewData('${item.Code}')"><i class="fa-solid fa-folder-open" data-toggle="tooltip" data-placement="top" title="View Details" style="color:white;"></i></button>
                   <button style="background-color:#3f51b5;border-radius: 5px" onclick="QuotationApprovedlist('${item.Code}')"><i class="fa fa-check-circle" data-toggle="tooltip" data-placement="top" title="Approve" style="color:white;"></i></button>
                ` : ""
        }));
        BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns);
    });
}