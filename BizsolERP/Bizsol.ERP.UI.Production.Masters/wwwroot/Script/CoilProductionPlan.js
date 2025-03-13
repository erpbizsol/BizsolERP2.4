
import { CoilProductionPlanService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CoilProductionPlanService.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';

$("#ERPHeading").text("Coil Production Plan");
//$('#txtFromDate').val(new Date().toISOString().slice(0, 10));
//$('#txtToDate').val(new Date().toISOString().slice(0, 10));

let baseUrl = sessionStorage.getItem('AppBaseURL');


function CoilProductionPlan_GetCoilProductionPlanGridView() {
    //let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
    
    //if (FromDate == "" && Todate == "") {
    //    return false;
    //}
    //let filterType = $('input[name="filterType"]:checked').val();
    Showloader();
    CoilProductionPlanService.GetCoilProductionPlanGridView().then(function (response) {
        HideLoader();
        console.log(response);
        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = [];
        const ColumnAlignment = {};

        if (response.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbCoilProductionPlanHeader", "tbCoilProductionPlanBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
           // WebLocatePackingSumDispatch(response);
        } else {
            $('#tbCoilProductionPlan tr').empty()
            $('#paginator-tbCoilProductionPlan').empty();
        }

    });

   
}
CoilProductionPlan_GetCoilProductionPlanGridView();

