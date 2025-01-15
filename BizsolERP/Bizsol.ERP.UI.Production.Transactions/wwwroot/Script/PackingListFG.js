
import { PackingListFGService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PackingListFGService.js';
$("#ERPHeading").text("Packing List FG");
$('#txtFromDate').val(new Date().toISOString().slice(0, 10));
$('#txtToDate').val(new Date().toISOString().slice(0, 10));

PackingListFG_ShowViewGrid();
function ChangeMode(Mode) {
    $('#DivPackingListFGForm').hide();
    $('#DivPackingListFGViewGrid').hide();
    if (Mode === 'New') {
        $('#DivPackingListFGForm').show();
        $('#DivPackingListFGViewGrid').hide();
    } else {
        $('#DivPackingListFGForm').hide();
        $('#DivPackingListFGViewGrid').show();
    }

}
function PackingListFG_ShowViewGrid() {
    let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
    
    if (FromDate == "" && Todate == "") {
        return false;
    }
    PackingListFGService.GetPackingListWebLocate(FromDate, Todate).then(function (response) {

        //response.forEach(item => {
        //    item.Action = item["Date Out Time"] !== '' ? '<a class="btn btn-info icon-height" onclick="GateEntyMode_GateEntry(\'grid\',\'' + item["Type In"].replace(' ', '') + 'print_' + item.Code + '\')"> <i class="fa fa-print"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-dark icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'view_' + item.Code + '\')" ><i class="fa fa-eye"></i></a>' : item["Type In"].replace(' ', '').toLowerCase() === 'loadedin' ? '<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'emptyout_' + item.Code + '\')" >Empty Out</a>' : '<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'loadedout_' + item.Code + '\')" >Loaded Out</a>'
        //});
        console.log(response);
        const StringFilterColumn = ["Type In", "Party name", "Vehicle No"];
        const NumericFilterColumn = ["Entry No"];
        const DateFilterColumn = ["Date In Time", "Date Out Time"];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code", "Hour"];
        const ColumnAlignment = {};
        if (response.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbPackingListFGViewHeader", "tbPackingListFGViewBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        } else {
            $('#tbPackingListFGView tr').empty()
        }

    });

    ChangeMode('');
}


function PackingListFG_CreateNew() {
    ChangeMode('New');
}
function PackingListFG_Back() {
    ChangeMode('');
}

window.PackingListFG_CreateNew = PackingListFG_CreateNew;
window.PackingListFG_Back = PackingListFG_Back;
window.PackingListFG_ShowViewGrid = PackingListFG_ShowViewGrid;