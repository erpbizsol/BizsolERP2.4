
import { RollingProductionService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/RollingProductionService.js';
$("#ERPHeading").text("Tube Mill Production");
$('#txtFromDate').val(new Date().toISOString().slice(0, 10));
$('#txtToDate').val(new Date().toISOString().slice(0, 10));

let baseUrl = sessionStorage.getItem('AppBaseURL');


function RollingProductionSummary_ShowPlanGrid() {
    let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
    
    if (FromDate == "" && Todate == "") {
        return false;
    }
   
    Showloader();
    RollingProductionService.GetRollingProductionPlanGridView(FromDate, Todate,"ProductionSummary").then(function (response) {
        HideLoader();
       
            response.forEach(item => {
                item.Action = item.Status === 'Running' ? '<a class="btn btn-info icon-height" onclick="RollingProductionSummary_RollingProductionEntryFrm(\'Y\',' + item.PVCProductionMaster_Code +',\'\',\'\')"> <i class="fa fa-pencil"></i></a>':''
            });
        
       
        console.log(response);
        const StringFilterColumn = ["Warehouse", "Packing Type", "Requisition No / Order No", "Party Name","Status"];
        const NumericFilterColumn = ["PackingList No"];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["QtyMT", "QtyPC", "QtyMTRS","PVCProductionMaster_Code"];
        const ColumnAlignment = {
            "Qty PC": 'right',
            "Qty KG": 'right',
            "Qty SQM": 'right',
        };

        if (response.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbProductionSummaryViewHeader", "tbProductionSummaryViewBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
           // WebLocatePackingSumDispatch(response);
        } else {
            $('#tbProductionSummaryView tr').empty()
            $('#paginator-tbProductionSummaryView').empty();
        }

    });

    
}

function RollingProductionSummary_ShowPendingPlanGrid() {
    let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();

    if (FromDate == "" && Todate == "") {
        return false;
    }

    Showloader();
    RollingProductionService.GetRollingProductionPlanGridView(FromDate, Todate, "PendingPlansSummary").then(function (response) {
        HideLoader();

        response.forEach(item => {
            item.Action = '<a class="btn btn-info icon-height" onclick="RollingProductionSummary_RollingProductionEntryFrm(\'N\',0,\'' + item.EntryDate + '\',\'' + item["Mill"] + '\')"> <i class="fa fa-pencil"></i></a>'
        });

         console.log(response);
        //response = response.map((item) => ({
        //    "PackingList No": item.PackingListNo, Date: item.PackingListDate, Warehouse: item.GodownName, "Packing Type": item.PackingType, "Requisition No / Order No": item["Requisition No"], "Party Name": item.ClienName, "Qty KG": item.QtyMT, "Qty PC": item.QtyPC, "Qty SQM": item.QtyMTRS, Status: item.PKStatus,
        //    Action: item.Verify === 'N' && item.AllowVerify == 'Y' ? '<a class="btn btn-info icon-height" title="Edit" onclick="SlittingProductionEntry_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;&nbsp;<a class="btn btn-success icon-height" title="Verify" onclick="SlittingProductionEntry_Verify(\'' + item.Code + '\')"><i class="fa fa-check"></i></a>': item.Verify === 'N' ? '<a class="btn btn-info icon-height" title="Edit" onclick="SlittingProductionEntry_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>' : '<a class="btn btn-dark icon-height" title="View" onclick="SlittingProductionEntry_EditOrView(\'N\',\'' + item.Code + '\')"> <i class="fa fa-eye"></i></a>', 
        //    QtyMT: item.QtyMT, QtyPC: item.QtyPC, QtyMTRS: item.QtyMTRS
        //}))
        console.log(response);
        const StringFilterColumn = ["Warehouse", "Packing Type", "Requisition No / Order No", "Party Name", "Status"];
        const NumericFilterColumn = ["PackingList No"];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["QtyMT", "QtyPC", "QtyMTRS", "SlittingPlanMaster_Code", "EntryDate"];
        const ColumnAlignment = {
            "Qty PC": 'right',
            "Qty KG": 'right',
            "Qty SQM": 'right',
        };

        if (response.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbPendingPlansSummaryViewHeader", "tbPendingPlansSummaryViewBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
            // WebLocatePackingSumDispatch(response);
        } else {
            $('#tbPendingPlansSummaryView tr').empty()
            $('#paginator-tbPendingPlansSummaryView').empty();
        }

    });


}

function RollingProductionSummary_RollingProductionEntryFrm(IsRunningPlan, PVCProductionMaster_Code, PlanDate, MachineNo) {

    window.location.href = baseUrl + `/ProductionMasters/Rolling/RollingProductionEntry?IsRunningPlan=${IsRunningPlan}&PVCProductionMaster_Code=${PVCProductionMaster_Code}&PlanDate=${PlanDate}&MachineNo=${MachineNo}`;
}
RollingProductionSummary_ShowPendingPlanGrid();



window.RollingProductionSummary_ShowPlanGrid = RollingProductionSummary_ShowPlanGrid;
window.RollingProductionSummary_ShowPendingPlanGrid = RollingProductionSummary_ShowPendingPlanGrid;
window.RollingProductionSummary_RollingProductionEntryFrm = RollingProductionSummary_RollingProductionEntryFrm;


