import { GateEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GateEntryService.js';
//import { BizsolCustomFilterGrid } from '../../Bizsol.WebERP.UI.Shared/js/filter.js';
$("#ERPHeading").text("Gate Entry");
function GateEntryGirdByDates() {
    let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
    if (FromDate == "" && Todate == "") {
        return false;
    }
    GateEntryService.GateEntryDate(FromDate, Todate).then(function (response) {
        console.log(response);
        response = response.map((item) => ({ Code: item.Code, "Type In": item["Type In"], "Entry No.": item["Entry No."], "Date In Time": item["Date In Time"], "Date Out Time": item["Date Out Time"], "Vehicle No.": item["Vehicle No."], "Party name": item["Party name"], Action: '<a class="btn btn-primary icon-height" onclick="Delete_AttachmentControl(' + item.Code + ')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="Delete_AttachmentControl(' + item.Code + ')">Empty Out</a>' }))
        const StringFilterColumn = ["Type In", "Party name","Vehicle No."];
        const NumericFilterColumn = ["Entry No."];
        const DateFilterColumn = ["Date In Time", "Date Out Time"];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code","Hour"];
        const ColumnAlignment = {};
        BizsolCustomFilterGrid.CreateDataTable("tbGateEntyViewHeader", "tbGateEntyViewBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)


    });
}
GateEntryService.GetMinPending().then(function (response) {
    $('#txtFromDate').val(response.minDate);
    $('#txtToDate').val(new Date().toISOString().slice(0, 10));
    GateEntryGirdByDates()
});

function ViewAttachment_GateEntry(GateEntryMaster_Code) {
    InitAttachmentControl('GateEntryMaster', GateEntryMaster_Code, '', 0, 0, '', "View");
}
function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode) {
    var url = '/CustomControl/AttachmentControl';
    $('#GateEntry_AttachmentControlmodal').load(url, { MasterTableName: masterTableName, MasterTableCode: masterTableCode, DetailTableName: detailTableName, DetailTableCode: detailTableCode, EntryNo: entryNo, EntryDate: entryDate, Mode: mode });
}

window.GateEntryGirdByDates = GateEntryGirdByDates
window.ViewAttachment_GateEntry = ViewAttachment_GateEntry