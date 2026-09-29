import { PurchaseQualityCheckService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PurchaseQualityCheckService.js';
import { ReportsService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ReportsService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

let G_RawMaterialReportOfMaize = [];
let G_ModuleDesp = '';
$(document).ready(function () {
    G_ModuleDesp = BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp") ||'Quality Report In Grid';
    SetDate();
    GetRawMaterialItemList();
}); 

function ShowData() {
    var FromDate = $("#txtFromDate").val();
    var ToDate = $("#txtToDate").val();
    var ReportType = $("#ddlReportType").val();
    var moduleDesp = G_ModuleDesp;
    if (!FromDate || FromDate === "") {
        toastr.error('Please enter from date');
        $("#txtFromDate").focus();
        return;
    }
    
    if (!ToDate || ToDate === "") {
        toastr.error('Please enter to date');
        $("#txtToDate").focus();
        return;
    }
    if (!ReportType || ReportType === "" || ReportType==0) {
        toastr.error('Please select Item Name');
        $("#ReportType").focus();
        return;
    }
    if (new Date(ToDate) < new Date(FromDate)) {
        toastr.error('To Date cannot be before From Date');
        $("#txtToDate").focus();
        return;
    }
    GetRawMaterialReportOfMaize(FromDate, ToDate, ReportType);
}

function SetDate() {
    let today = new Date();
    let firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
   
    let formattedFromDate = formatDate(firstOfMonth);
    let formattedToDate = formatDate(today);
    
    $("#txtFromDate").val(formattedFromDate);
    $("#txtToDate").val(formattedToDate);
}

function formatDate(date) {
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let year = date.getFullYear();
    return `${year}-${month}-${day}`;
}

function GetRawMaterialReportOfMaize(FromDate, ToDate, ItemMaster_Code) {
    Showloader();
    PurchaseQualityCheckService.RawMaterialReportOfMaize(FromDate, ToDate, ItemMaster_Code).then(function (response) {
        if (response && response.length > 0) {
            G_RawMaterialReportOfMaize = response;
            HideLoader();
            $('#tblReport').show();
            const stringFilterColumn = ["Vendor Name", "Vehicle No", "Inv. No.","PO No"];
            const numericFilterColumn = [];
            const dateFilterColumn = ["Inv. Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            let hiddenColumns = ["Code"]
            const columnAlignment = {
                'Inv. Amount': 'right', 'Total D/N Amt': 'right', 'Net Amt after Deduction': 'right', 'DUST D/N': 'right', 'PO Qty(MT)': 'right',
                'PO Rate': 'right', 'Gross WT': 'right', 'Tear WT': 'right', 'Net WT': 'right', 'Inv Qty': 'right', 'Po Bal': 'right','Rcd.Qty':'right',
                'Short/ Excess': 'right', 'Rate': 'right', 'D/N Amt On Qty': 'right', 'DUST': 'right', 'GCV': 'right', 'MOISTURE (B)': 'right','DUST DIFF':'right',
                'GCV DIFF': 'right', 'MOISTURE (B) DIFF': 'right', 'GCV D/N': 'right', 'MOISTURE (B) D/N': 'right', 
            };
            const totalColumns = ["Inv. Amount", "Total D/N Amt", "Net Amt after Deduction", "DUST D/N", "PO Qty(MT)", "PO Rate", "Po Bal",
                "Gross WT", "Tear WT", "Net WT", "Inv Qty", "Rcd.Qty", "Short/ Excess", "Rate", "D/N Amt On Qty", "DUST", "GCV",
                "MOISTURE (B)", "DUST DIFF", "GCV DIFF", "MOISTURE (B) DIFF", "GCV D/N","MOISTURE (B) D/N"];

            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false, totalColumns);

        } else {
            HideLoader();
            toastr.error('No Data Found');
            $('#tblReport').hide();
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error(error.Msg || 'Error during RMStockCurrent');
        $('#tblReport').hide();
    });
}
function Download() {
    const hiddenFields = [
        "Code"
    ];
    ExportToExcelControl.ExportToExcel(G_RawMaterialReportOfMaize, hiddenFields, "RawMaterialReportOfMaize");
}
function GetRawMaterialItemList() {
    PurchaseQualityCheckService.GetRawMaterialItemList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#ddlReportType')[0], response.map((item) => ({ Code: item.Code, Desp: item.ItemName })));

            $('#ddlReportType').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        console.log('Error fetching user list:', error);
    });
}
function BindSelectList(element, list) {
    let option = '<option value="0">Please select..</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

window.ShowData = ShowData;
window.Download = Download;