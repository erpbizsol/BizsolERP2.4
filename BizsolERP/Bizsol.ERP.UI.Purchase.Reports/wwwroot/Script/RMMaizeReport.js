import { PurchaseQualityCheckService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PurchaseQualityCheckService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

let G_RawMaterialReportOfMaize = [];
$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    SetDate();
}); 

function ShowData() {
    var FromDate = $("#txtFromDate").val();
    var ToDate = $("#txtToDate").val();
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
    if (new Date(ToDate) < new Date(FromDate)) {
        toastr.error('To Date cannot be before From Date');
        $("#txtToDate").focus();
        return;
    }
    GetRawMaterialReportOfMaize(FromDate, ToDate);
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

function GetRawMaterialReportOfMaize(FromDate, ToDate) {
    Showloader();
    PurchaseQualityCheckService.RawMaterialReportOfMaize(FromDate, ToDate).then(function (response) {
        if (response && response.length > 0) {
            G_RawMaterialReportOfMaize = response;
            HideLoader();
            $('#tblReport').show();
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            let hiddenColumns = ["Code"]
            const columnAlignment = {
                'Invoice Date': 'center',
                'Receive Date': 'center',
                'Thickness': 'right',
                'Ch Wt': 'right',
                'Width': 'right;min-width:60px',
                'Ac Wt': 'right',
                'Qty MT': 'right',
                'Qty PC': 'right'
            };

            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);

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
window.ShowData = ShowData;
window.Download = Download;