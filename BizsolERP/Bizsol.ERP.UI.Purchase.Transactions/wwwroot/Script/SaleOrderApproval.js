import { SaleOrderApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SaleOrderApprovalService.js';

let FrmType = '';
let FrmAction = '';
let G_BCode = 0;
let G_CheckCreditLimitAmountBase = 'Y';
let G_CheckCreditLimitDaysBase = 'Y';
let CreditLimitCheck_BuyerPO = 'Y';
let SaleOrderApprovalFixedParaMeters = [];

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
    SaleOrderApprovalService.GetUnApprovedSaleOrders(FrmAction).then(function (response) {
        if (response.length > 0) {
            const StringFilterColumn = ["Order No", "PartyName"];
            const NumericFilterColumn = [];
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
                "Total Order Amount":"right",
            };
            const updatedResponse = response.map(item => ({
                ...item, Action: item.Action ? `<button class="btn btn-success icon-height mb-1" title="${FrmAction}" onclick="SaleOrderApprovedlist('${item.BuyerPOMaster_Code}')"><i class="fa fa-check-circle"></i></button>
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
    SaleOrderDeliveryTerms(Code);
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
function SaleOrderDeliveryTerms(Code) {
    SaleOrderApprovalService.GetSaleOrderDeliveryTermsDetail(Code).then(function (response) {
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
            const hiddenColumns = ["Code", "BuyerPOMaster_Code"];
            const ColumnAlignment = {
                "Order Date": "center",
                "BuyerPOMaster_Code": "center",
                "Qty KG": "right",
                "Qty PC": "right",
                "Qty SQM": "right",
                "Amount": "right",
            };
            BizsolCustomFilterGrid.CreateDataTable("table-header-SaleOrderDeliveryTermsTable", "table-body-SaleOrderDeliveryTermsTable", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            $('#paginator-SaleOrderDeliveryTermsTable').hide();
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

    G_BCode = BCode;
    SaleOrderApprovalService.SaleOrdersCreditLimitReports(BCode).then(function (response) {
        let CheckCreditLimit = 'Y';
        let DoCreditLimtCheck = 'N';
        let CreditLimitAmountBase = [];
        let CreditLimitDayBase = [];
        let PartyName = '';
        console.log(response);
        if ((response.CreditLimitAmountBase.length > 0 && response.CreditLimitAmountBase[0].CheckCreditLimitAmountBase === "N") || (response.CreditLimitDayBase.length > 0 && response.CreditLimitDayBase[0].CheckCreditLimitDaysBase === "N")) {
            
            CheckCreditLimit = 'N';
            CreditLimitAmountBase = response.CreditLimitAmountBase;
            CreditLimitDayBase = response.CreditLimitDayBase;
            PartyName = response.CreditLimitAmountBase[0].AccountName;
            G_CheckCreditLimitAmountBase = response.CreditLimitAmountBase[0].CheckCreditLimitAmountBase;
            G_CheckCreditLimitDaysBase = response.CreditLimitDayBase[0].CheckCreditLimitDaysBase;
        }
        //CheckCreditLimit = 'N';
        //CreditLimitAmountBase = response.CreditLimitAmountBase;
        //CreditLimitDayBase = response.CreditLimitDayBase;
        //PartyName = response.CreditLimitAmountBase[0].AccountName;

        if (CreditLimitCheck_BuyerPO == 'V' && FrmAction == 'Verify') {
            DoCreditLimtCheck = 'Y';
        }
        if (CreditLimitCheck_BuyerPO == 'C' && FrmAction == 'Check') {
            DoCreditLimtCheck = 'Y';
        }

        if (CheckCreditLimit === 'N' && DoCreditLimtCheck=='Y') {
            $('#OTPModalDisplay').modal({
                backdrop: 'static',
            });
            $('#OTPModalDisplay').modal('show');

            CreditLimitAmountBase = CreditLimitAmountBase.map((item) => ({
                "Credit Limit (Rs.)": item.txtCreditLimit,
                "Ledger Closig": item.txtLedgerClosing,
                "Un Booked Sale": item.txtUnBookSale,
                "Pending Do": item.txtPendingDO,
                "Available Limit": item.txtAvailableLimit,
                "Order Amount": item.txtDoAmount,
                "Balance": item.txtBalance

            }))

            CreditLimitAmountBase = Object.keys(CreditLimitAmountBase[0]).map((item) => ({
                Desp: item,
                Value: CreditLimitAmountBase[0][item]
            }))
           
            CreditLimitDayBase = CreditLimitDayBase.map((item) => ({
                "Credit Days": item.TxtCreditDays,
                "Grace Period": item.TxtGracePeriod,
                "Out Standing": item.txtOutStanding,
                "Gen Credit Limit OverDue": item.objGenCreditLimitOverDue,
            }))
            CreditLimitDayBase = Object.keys(CreditLimitDayBase[0]).map((item) => ({
                Desp: item,
                Value: CreditLimitDayBase[0][item]
            }))

            

                const StringFilterColumn = [];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = [];
            const ColumnAlignment = {};
            BizsolCustomFilterGrid.CreateDataTable("table-header-CreditLimitAmountBaseTable", "table-body-CreditLimitAmountBaseTable", CreditLimitAmountBase, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
            BizsolCustomFilterGrid.CreateDataTable("table-header-CreditLimitDayBaseTable", "table-body-CreditLimitDayBaseTable", CreditLimitDayBase, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);

            $('#paginator-CreditLimitAmountBaseTable').hide();
            $('#paginator-CreditLimitAmountBaseTable').empty();
            $('#paginator-CreditLimitDayBaseTable').hide();
            $('#paginator-CreditLimitDayBaseTable').empty();
            $('#ChkCreditLimitPartyName')[0].innerHTML = PartyName;

            //if (G_CheckCreditLimitDaysBase == "Y") {

            //    $('#CreditLimitDayBaseTable').hide();
            //}

            return;
        }

        SaleOrderApprovalService.SaleOrderApproved(BCode, FrmAction, FrmType).then(function (resdata) {
            if (resdata.Status === "Y") {
                toastr.success(resdata.Msg);
                GetSaleOrderApproval();
                GetWebNotificationList();
            } else if (resdata.Status === "N") {
                toastr.error(resdata.Msg);

            }
        }).catch(function (error) {
            toastr.error("Error in Sale Order Approval: ", error);
        });

    }).catch(error => {
        toastr.error("Error in fetching data:", error);
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
function SaleOrder_Authentication() {
    SaleOrderApprovalService.SendVerifyOrApproveNotificationToSenior(G_BCode).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
        }
    });
}
function SaleOrder_OTPReceive() {
    let OTP = $('#txtOTP').val()

    if (OTP === "") {
        toastr.error('Please Check! Authorization Code can not be blank');
        return;
    }
    let ReasonFor = 'Credit Limit Check (Amount)';
    if (G_CheckCreditLimitAmountBase == 'N' && G_CheckCreditLimitDaysBase == 'N') {
        ReasonFor = 'Credit Limit Check (Days with Amount)';
    } else if (G_CheckCreditLimitDaysBase=='N') {
        ReasonFor = 'Credit Limit Check (Days)';
    }

    SaleOrderApprovalService.SaleOrdersApprovedBYOTP(G_BCode, FrmAction, FrmType, OTP, ReasonFor).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            GetSaleOrderApproval();
            GetWebNotificationList();
            $('#txtOTP').val('');
            $('#OTPModalDisplay').modal('hide');

        } else {
            toastr.error(response.Msg);
        }

    });
}

function getSaleOrderApprovalFixedParaMeters() {
    SaleOrderApprovalService.GetFixedParaMeter().then(function (response) {
        SaleOrderApprovalFixedParaMeters = response;
        LoadFrm();
    });
}

function LoadFrm() {
    if (SaleOrderApprovalFixedParaMeters.length > 0 && SaleOrderApprovalFixedParaMeters.find(x => x.PeramaterName === 'CreditLimitCheck_BuyerPO').PeramaterValue != '') {
        CreditLimitCheck_BuyerPO = SaleOrderApprovalFixedParaMeters.find(x => x.PeramaterName === 'CreditLimitCheck_BuyerPO').PeramaterValue;
    }
}

getSaleOrderApprovalFixedParaMeters();
window.ViewData = ViewData;
window.CloseModal = CloseModal;
window.SaleOrderApprovedlist = SaleOrderApprovedlist;
window.SaleOrder_Authentication = SaleOrder_Authentication;
window.SaleOrder_OTPReceive = SaleOrder_OTPReceive;