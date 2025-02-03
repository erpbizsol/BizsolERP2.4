import { QuotationApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/QuotationApprovalService.js';
let FrmType = '';
let FrmAction = '';

$(document).ready(function () {
    var urlParams = getUrlVars();
    var menuValue = decodeURI(urlParams['menu']);
    FrmType = decodeURI(urlParams['FrmType']);
    FrmAction = decodeURI(urlParams['FrmAction']);

    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    }
    else {
        $("#ERPHeading").text("Quotation Approval");
    }
    GetApprovedQuotationList();
});
function GetApprovedQuotationList() {
    QuotationApprovalService.GetUnApprovedQuotation(FrmAction).then(function (resData) {
        if (resData && resData.length > 0) {
            const StringFilterColumn = ["Quotation No", "Party"];
        const NumericFilterColumn = [];
            const DateFilterColumn = ["Quotation Date"];
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
            ...item, Action: item.Action ? `<button class="btn btn-success icon-height mb-1" title="Approve" onclick="QuotationApprovedlist('${item.Code}')"><i class="fa fa-check-circle"></i></button>
                <button class="btn btn-primary icon-height mb-1" title="View Details" onclick="ViewData('${item.Code}')"><i class="fa-solid fa-folder-open"></i></button>` : ""
        }));
       
            BizsolCustomFilterGrid.CreateDataTable("table-header-QuotationTable", "table-body-QuotationTable", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
        else {
            toastr.error("No data available");
            $("#QuotationTable").hide();
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
                const hiddenColumns = ["Code", "ItemMaster_Code","itemsizemaster_Code"];
                const ColumnAlignment = {
                "Amount":'right',
                "Qty MT":'right',
                "Last Rate":'right',
                };
                BizsolCustomFilterGrid.CreateDataTable("table-header-Quotation", "table-body-Quotation", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
    });
}
function CloseModal() {
    $('#myModal').modal('hide');
}
function QuotationApprovedlist(code) {
    QuotationApprovalService.QuotationApproved(code, FrmAction, FrmType).then(function (resdata) {
        if (resdata.Status === "Y"){
            toastr.success(resdata.Msg);
            
            GetWebNotificationList();
            GetApprovedQuotationList();

        } else {
            toastr.error(resdata.Msg);
        }
    }).catch(function (error) {
        toastr.error("Error in Quotation Approval: ", error);
    });
};

function getUrlVars() {
    var vars = {}; 
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}

window.ViewData = ViewData;
window.CloseModal = CloseModal;
window.QuotationApprovedlist = QuotationApprovedlist;