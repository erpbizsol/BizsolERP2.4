import { FMSReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/FMSReportService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/menuservices.js';

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
        $("#ERPHeading").text("FMSReport Approval");
    }
    unApprovedFMSReport();
});
function unApprovedFMSReport() {
    FMSReportService.GetUnApprovedFMSReport(FrmAction, FrmType).then(function (response) {
        if (response && response.length > 0) {
            const stringFilterColumn = [ "Item Name", "Qty", "UOM", "Curr. Stk.", "Last Mon Con.", "Dlry Days", "Unit Price", "Total Amount","Created by"];
            const numericFilterColumn = ["Ind No"];
            const dateFilterColumn = ["Indent Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = {
                "Total Amount": 'right', "Unit Price": 'right', "Dlry Days": 'right', "Last Mon Con.": 'right', "Curr. Stk.": 'right;',
                "Qty": 'right;', "Indent Date": 'center'
            };
            const updatedResponse = response.map(item => ({
                ...item,
                //"Qty": item["Qty"] ? parseFloat(item["Qty"]).toFixed(3) : "0.000",
                "Curr. Stk.": item["Curr. Stk."] ? parseFloat(item["Curr. Stk."]).toFixed(3) : "0.000",
                "Last Mon Con.": item["Last Mon Con."] ? parseFloat(item["Last Mon Con."]).toFixed(3) : "0.000",
                Action: `<button class="btn btn-success icon-height mb-1" title="${FrmAction}" onclick="Approval('${item.Code}')"><i class="fa fa-check-circle" aria-hidden="true"></i></button>`
                }));

            BizsolCustomFilterGrid.CreateDataTable("table-header-FMSReport", "table-body-FMSReport", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment, false); 
        } else {
            toastr.error("No data found:", response);
            $("#FMSReport").hide();
        }
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
    });
}
function Approval(Code) {
    var ModuleName = "Indent/Material Requirement (Store)",
        ShowMsg = "Y",
        FinYear = BizSolHelperFunction.getFinancialYear();
    var OptionName = 'Verify';
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (respCheck) {

        if (respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg);
            return false;
        } else {
            FMSReportService.FMSReportApproved(Code).then(function (approvedata) {
                if (approvedata.Status === "Y") {
                    toastr.success(approvedata.Message);
                    unApprovedFMSReport();
                    GetWebNotificationList();
                }
                else {
                    toastr.error(approvedata.Message);
                }
            }).catch(function (error) {
                toastr.error("Error in FMSReport Approval: ", error);
            });
        }
    }); 
}
function getUrlVars() {
    var vars = {};
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}

window.Approval = Approval;
