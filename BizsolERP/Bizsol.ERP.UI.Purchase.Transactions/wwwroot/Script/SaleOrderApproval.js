import { SaleOrderApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SaleOrderApprovalService.js';
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
        $("#ERPHeading").text("Sale Order Approval");
    }
    GetSaleOrderApproval();
});
function GetSaleOrderApproval() {
    SaleOrderApprovalService.GetUnApprovedSaleOrders().then(function (response) {
        if (response.length > 0) {
            const StringFilterColumn = ["Order No", "PartyName"];
            const NumericFilterColumn = [];
            const DateFilterColumn = ["Order Date"];
            const Button = false;
            const StringdoubleFilterColumn = ["PartyName"];
            const showButtons = [];
            const hiddenColumns = ["Code", "BuyerPOMaster_Code","Qty KG"];
            const ColumnAlignment = {
                "Order Date": "center",
                "Qty KG":"right",
                "Qty PC":"right",
                "Qty SQM":"right",
                "Amount":"right",
                "Total Order Amount":"right",
            };
            const updatedResponse = response.map(item => ({
                ...item, Action: item.Action ? `<button class="btn btn-success icon-height mb-1" title="Approve" onclick="SaleOrderApprovedlist('${item.BuyerPOMaster_Code}')"><i class="fa fa-check-circle"></i></button>
                <button class="btn btn-primary icon-height mb-1" title="View Details" onclick="ViewData('${item.BuyerPOMaster_Code}')"><i class="fa-solid fa-folder-open"></i></button>` : ""
            }));
            BizsolCustomFilterGrid.CreateDataTable("table-header-SaleOrderApproval", "table-body-SaleOrderApproval", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);  
        }
        else {
            toastr.error("No data found:", response);
            $("#SaleOrderApproval").hide();
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
            const hiddenColumns = ["Code","BuyerPOMaster_Code"];
            const ColumnAlignment = {
                "Order Date":"center",
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
function getUrlVars() {
    var vars = {};
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}
function SaleOrderApproval_OTPModal() {
    $('#OTPModalDisplay').modal({
        backdrop: 'static',
    });
    $('#OTPModalDisplay').modal('show');
}
window.ViewData = ViewData;
window.CloseModal = CloseModal;
window.SaleOrderApprovedlist = SaleOrderApprovedlist;
window.SaleOrderApproval_OTPModal = SaleOrderApproval_OTPModal;