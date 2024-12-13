import { GateEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GateEntryService.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

$("#ERPHeading").text("Gate Entry");

let ConfigGateEntry = [];
let IsWithPo = true;
function GateEntryGirdByDates() {

    let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
    if (FromDate == "" && Todate == "") {
        return false;
    }
    GateEntryService.GateEntryDate(FromDate, Todate).then(function (response) {
        // + item["Type In"].replace(' ', '').toLowerCase() === 'loadedin' ? 'Empty Out' : 'Loaded Out' +
       // response = response.map((item) => ({ Code: item.Code, "Type In": item["Type In"], "Entry No.": item["Entry No."], "Date In Time": item["Date In Time"], "Date Out Time": item["Date Out Time"], "Vehicle No.": item["Vehicle No."], "Party name": item["Party name"], Action: '<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'edit_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + '_' + item.Code + '\')">mansojs</a>' }))
        //console.log(response);
        //response = response.map((item) => ({
        //    Code: item.Code, "Type In": item["Type In"], "Entry No.": item["Entry No."], "Date In Time": item["Date In Time"], "Date Out Time": item["Date Out Time"], "Vehicle No.": item["Vehicle No."], "Party name": item["Party name"],
        //    Action: item["Date Out Time"] !== '' ? '<a class="btn btn-info icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'print_' + item.Code + '\')"> <i class="fa fa-print"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-dark icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'view_' + item.Code + '\')" ><i class="fa fa-eye"></i></a>':item["Type In"].replace(' ', '').toLowerCase() === 'loadedin' ? '<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'edit_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'emptyout_' + item.Code + '\')" >Empty Out</a>' : '<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'edit_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'loadedout_' + item.Code + '\')" >Loaded Out</a>'
        //}))
        //response = response.map((item) => (
        //    item["Action"] = item["Date Out Time"] !== '' ? '<a class="btn btn-info icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'print_' + item.Code + '\')"> <i class="fa fa-print"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-dark icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'view_' + item.Code + '\')" ><i class="fa fa-eye"></i></a>' : item["Type In"].replace(' ', '').toLowerCase() === 'loadedin' ? '<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'edit_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'emptyout_' + item.Code + '\')" >Empty Out</a>' : '<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'edit_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'loadedout_' + item.Code + '\')" >Loaded Out</a>'
        //));

        response.forEach(item => {
            item.Action = item["Date Out Time"] !== '' ? '<a class="btn btn-info icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'print_' + item.Code + '\')"> <i class="fa fa-print"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-dark icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'view_' + item.Code + '\')" ><i class="fa fa-eye"></i></a>' : item["Type In"].replace(' ', '').toLowerCase() === 'loadedin' ? '<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'edit_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'emptyout_' + item.Code + '\')" >Empty Out</a>' : '<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'edit_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'loadedout_' + item.Code + '\')" >Loaded Out</a>'
        });
        console.log(response);
        const StringFilterColumn = ["Type In", "Party name", "Vehicle No."];
        const NumericFilterColumn = ["Entry No."];
        const DateFilterColumn = ["Date In Time", "Date Out Time"];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code","Hour"];
        const ColumnAlignment = {};
        BizsolCustomFilterGrid.CreateDataTable("tbGateEntyViewHeader", "tbGateEntyViewBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)


    });
    $('#DivGateEntryForm').hide();
}
GateEntryService.GetMinPending().then(function (response) {
    $('#txtFromDate').val(response.minDate).replace;
    $('#txtToDate').val(new Date().toISOString().slice(0, 10));
    GateEntryGirdByDates();
    GetConfigGateEntry();
});

function ViewAttachment_GateEntry(GateEntryMaster_Code) {
    InitAttachmentControl('GateEntryMaster', GateEntryMaster_Code, '', 0, 0, '', "View");
}
function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode) {
    var url = '/CustomControl/AttachmentControl';
    $('#GateEntry_AttachmentControlmodal').load(url, { MasterTableName: masterTableName, MasterTableCode: masterTableCode, DetailTableName: detailTableName, DetailTableCode: detailTableCode, EntryNo: entryNo, EntryDate: entryDate, Mode: mode });
}
function GateEntyMode_GateEntry(Mode,EntryType) {
    ChangeMode(Mode);

    if (Mode === 'form' && EntryType === 'EmptyInNew') {
        EmptyInNew(); 
    }
    else if (Mode === 'form' && EntryType === 'LoadedInNew') {
        LoadedInNew();
    }
    else if (Mode === 'form' && EntryType.includes('emptyout') ==true) {
        UpdateLoadedIn_Emptyout();
    }
    else if (Mode === 'form' && EntryType.includes('loadedout')==true) {
        UpdateEmptyIn_loadedout();
    }
    
}
function ChangeMode(Mode) {
    if (Mode==='form') {
        $('#DivGateEntryForm').show();
        $('#DivGateEntryGrid').hide();
    } else {
        $('#DivGateEntryForm').hide();
        $('#DivGateEntryGrid').show();
    }
}
function LoadedInNew() {
    $('#RowfrmLoadedInReportingDatetime').hide();
    $('#RowfrmLoadedInVehicleLoadedWeight').hide();
    $('#RowfrmLoadedInWeightmentSlipNoLoaded').hide();
    $('#RowfrmLoadedInPOAccess').hide();
    $('#RowfrmLoadedInddlPurchaseOrder').hide();


    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PeramaterName === 'ReportingDatetimeApplicable').PeramaterValue === 'Y') {
        $('#frmLoadedIn_txtReportingDatetime').val('');
        $('#RowfrmLoadedInReportingDatetime').show();
    }
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PeramaterName === 'WeightApplicable').PeramaterValue === 'Y') {
        $('#frmLoadedIn_txtVehicleLoadedWeight').val('');
        $('#frmLoadedIn_txtWeightmentSlipNoLoaded').val('');

        $('#RowfrmLoadedInVehicleLoadedWeight').show();
        $('#RowfrmLoadedInWeightmentSlipNoLoaded').show();
    }
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PeramaterName === 'POWiseEntryMendatory').PeramaterValue === 'Y') {
        //$('#frmEmptyIn_txtReportingDatetime').val('');

        $('#RowfrmLoadedInPOAccess').show();
        $('#RowfrmLoadedInddlPurchaseOrder').show();
        WithPO();
     }

    $('#DivfrmEmptyOut').hide();
}
function EmptyInNew() {

    $('#frmEmptyIn_txtDateIn').val(new Date().toISOString().slice(0, 10));
    $('#frmEmptyIn_txtVehicleInTime').val(`${new Date().getHours()}:${new Date().getMinutes()}`);

    $('#frmEmptyIn_txtVehicleNo').val('');
    $('#frmEmptyIn_txtDriverName').val('');
    $('#frmEmptyIn_txtDriverNo').val('');
    $('#frmEmptyIn_txtRemarks').val('');
    $('#frmEmptyIn_ddlTransporterName').val('');
    $('#RowfrmEmptyInReportingDatetime').hide();
    $('#RowfrmEmptyInVehicleEmptyWeight').hide();
    $('#RowfrmEmptyInWeightmentSlipNoEmpty').hide();

    GateEntryService.GetTransportersNameList().then(function (response) {
        //console.log(response);
        //BindSelectList($('#frmEmptyIn_ddlTransporterName')[0], response.map((item) => ({ Code: item.Code, Desp: item.AccountDesp })));
        //$('#frmEmptyIn_ddlTransporterName').select2({
        //    width: '-webkit-fill-available'
        //});
        AutoSuggestionControl.SetUpAutoSuggestion($('#frmEmptyIn_ddlTransporterName'), $('#frmEmptyIn_ddlTransporterName_List'), response.map((item) => ({ Desp: item.AccountDesp })),'StartWith');
    });

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PeramaterName === 'ReportingDatetimeApplicable').PeramaterValue === 'Y') {
        $('#frmEmptyIn_txtReportingDatetime').val('');
        $('#RowfrmEmptyInReportingDatetime').show();
    }
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PeramaterName === 'WeightApplicable').PeramaterValue === 'Y') {
        $('#frmEmptyIn_txtVehicleEmptyWeight').val('');
        $('#frmEmptyIn_txtWeightmentSlipNoEmpty').val('');

        $('#RowfrmEmptyInVehicleEmptyWeight').show();
        $('#RowfrmEmptyInWeightmentSlipNoEmpty').show();
    }
   

    $('#DivfrmLoadedOut').hide();
}

function UpdateLoadedIn_Emptyout() {
    $('.nav-tabs button[data-bs-target="#LoadedInTab"]').tab('show')
    $('#DivfrmEmptyOut').show();
}

function UpdateEmptyIn_loadedout() {
    $('.nav-tabs button[data-bs-target="#EmptyInTab"]').tab('show')
    $('#DivfrmLoadedOut').show();
}
//function BindSelectList(element, list) {
//    let option = '<option value="0"></option>';
//    $.each(list, function (key, val) {
//        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
//    });
//    element.innerHTML = option;
//}
function ShowGateEntryConfigurationModal() {
    GateEntryService.GetConfigGateEntry().then(function (response) {
        //console.log(response);

        let option = '';
        $.each(response, function (key, val) {
            let Checked = val.PeramaterValue.toLowerCase() === 'y'?'checked':''
            option += `<div class="col-6"><input type="checkbox" class="box_border" ${Checked} onclick="setGateEntryParamater(this,'${val.PeramaterName}','${val.PeramaterValue}')" />&nbsp;<label>${BizSolHelperFunction.ToWithSpace(val.PeramaterName) }</label></div>`;
        });


        $('#DivChkSetGateEntryConfiguration')[0].innerHTML = option;
        $("#GateEntryConfigurationModal").modal({
            backdrop: 'static',
            // keyboard: false
        });
        $("#GateEntryConfigurationModal").modal('show');
    });

    
}
function setGateEntryParamater(element, PeramaterName, PeramaterValue) {
    let SetPeramaterValue = 'N';
    if (element.checked == true) {
        SetPeramaterValue = 'Y';
    }
    GateEntryService.UpdateConfigGateEntry(PeramaterName, SetPeramaterValue).then(function (response) {
        if (response.Status === 'Y') {
            //alert(response.Msg)
            toastr.success(response.Msg);
            GateEntryGirdByDates();
            GetConfigGateEntry();
        }
    });

}

function GetConfigGateEntry() {
    GateEntryService.GetConfigGateEntry().then(function (response) {
        ConfigGateEntry = response;
    });
}

function GateEntry_rdPOAccess_onClick(ele) {
   
    if (ele.value === 'withpo') {
        IsWithPo = true;
    } else {
        IsWithPo = false;
    }
    WithPO();
}
function WithPO() {
    if (IsWithPo ==true) {
        $('#frmLoadedIn_txtGoodsDescription').val('');
        $('#frmLoadedIn_txtQTY').val('0');
        $('#frmLoadedIn_txtUOM').val('');
        $('#RowfrmLoadedInQTYorUOM').hide();
        $('#RowfrmLoadedInGoodsDescription').hide();
        $('#RowfrmLoadedInddlPurchaseOrder').show();
    } else {
        
        $('#frmLoadedIn_ddlPurchaseOrder').val('');

        $('#frmLoadedIn_txtGoodsDescription').val('');
        $('#frmLoadedIn_txtQTY').val('0');
        $('#frmLoadedIn_txtUOM').val('');
        $('#RowfrmLoadedInQTYorUOM').show();
        $('#RowfrmLoadedInGoodsDescription').show();
        $('#RowfrmLoadedInddlPurchaseOrder').hide();
    }
}
window.GateEntyMode_GateEntry = GateEntyMode_GateEntry
window.GateEntryGirdByDates = GateEntryGirdByDates
window.ViewAttachment_GateEntry = ViewAttachment_GateEntry
window.ShowGateEntryConfigurationModal = ShowGateEntryConfigurationModal
window.setGateEntryParamater = setGateEntryParamater
window.GateEntry_rdPOAccess_onClick = GateEntry_rdPOAccess_onClick