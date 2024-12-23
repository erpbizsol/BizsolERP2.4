import { GateEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GateEntryService.js';

$("#ERPHeading").text("Vehicles Status");

$('#txtFromDate').val(new Date().toISOString().slice(0, 10));
$('#txtToDate').val(new Date().toISOString().slice(0, 10));
window.VehiclesStatus_ShowReport = function VehiclesStatus_ShowReport() {
    

        let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
        if (FromDate == "" && Todate == "") {
            return false;
        }
    GateEntryService.getVehiclesStatusList(FromDate, Todate).then(function (response) {
           
            //console.log(response);
        const StringFilterColumn = ["Vehicle No"];
        const NumericFilterColumn = ["Gate Entry No"];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = []
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = {};
            BizsolCustomFilterGrid.CreateDataTable("tbGateEntyVehiclesStatusHeader", "tbGateEntyVehiclesStatusBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)


        });
    
}
VehiclesStatus_ShowReport()
