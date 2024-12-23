
import { GateEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GateEntryService.js';

$("#ERPHeading").text("Transit Material");

$('#txtFromDate').val(new Date().toISOString().slice(0, 10));
$('#txtToDate').val(new Date().toISOString().slice(0, 10));
window.TransitMaterial_ShowReport = function TransitMaterial_ShowReport() {


    let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
    if (FromDate == "" && Todate == "") {
        return false;
    }
    GateEntryService.getTransitMaterialList(FromDate, Todate).then(function (response) {

        //console.log(response);
        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code"];
        const ColumnAlignment = {};
        BizsolCustomFilterGrid.CreateDataTable("tbGateEntyTransitMaterialHeader", "tbGateEntyTransitMaterialBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)


    });

}