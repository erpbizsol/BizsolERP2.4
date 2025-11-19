import { StockAgeingReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_StockAgeingReportService.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    GetStockAgeingReportList();
});
function GetStockAgeingReportList() {
    Showloader();
    StockAgeingReportService.GetStockAgeingReportList().then(function (response) {
        HideLoader();
        if (response && response.length > 0) {
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const columnAlignment = {};

            BizsolCustomFilterGrid.CreateDataTable("table-head-StockAgeingReport", "table-body-StockAgeingReport", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);

        } else {
            HideLoader();
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error(error.Msg || 'Error During Get Rolling Plan Sheet');
    });
}
function ExportExcel() {
        const hiddenFields = [];
        StockAgeingReportService.GetStockAgeingReportList().then(function (response) {
            if (response && response.length > 0) {
                ExportToExcelControl.ExportToExcel(response, hiddenFields, "StockAgeingReport");
            } else {
                toastr.error('No Data Found');
            }
        }).catch(function (error) {
            toastr.error(error.Msg || 'Error During Export Stock Ageing Report Data');
        });
}

window.ExportExcel = ExportExcel;

