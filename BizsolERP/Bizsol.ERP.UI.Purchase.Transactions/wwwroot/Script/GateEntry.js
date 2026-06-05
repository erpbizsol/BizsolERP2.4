import { GateEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GateEntryService.js';
import { AttachmentControlService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_AttachmentControlService.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/menuservices.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';
//import { MultiAutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/MultiAutoSuggestion.js';

$("#ERPHeading").text("Gate Entry");

let ConfigGateEntry = [];
let IsWithPo = false;
let IsEntryWithoutExistingItem = false;
let GateEntryMaster_Code = 0;
let LoginGodownMaster_Code = 0;
let G_PendingPONOList = [];
let ExcelExportDataArry = [];
let doctype = [
    { name: "Invoice" },
    { name: "Packing List" },
    { name: "Gate Pass" },
    { name: "Job Challan" }
];
let GateEntryImageDetail = [{
    imgVehicle: [],
    imgMaterial: [],
    imgDoc: [],
    ImgOther: []

}];
let G_ScaleVehiclePhotoProvided = false;
//let G_GateEntryLinkedERPDocuments = [{ TableName: "kumar", TableCode:5 }];
let G_GateEntryLinkedERPDocuments = [{ TableName: "kumar", TableCode:5 }];

let baseUrl = sessionStorage.getItem('AppBaseURL');
let G_TableName = '';
let G_TableCode = 0;
function GateEntryGirdByDates() {

    let UserDetailsobj = JSON.parse(sessionStorage.getItem('UserDetails'));
    let UserType = UserDetailsobj[0].UserType;
    let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
    let ddlVehiclesStatusInFectory = $('#ddlVehiclesStatusInFectory').val();
    let ddlGodownMaster_Code = $('#ddlGodown').val();
    ddlGodownMaster_Code = ddlGodownMaster_Code ? ddlGodownMaster_Code : '0';
    let QueryCondition = ".";

    if (UserType == 'U' && LoginGodownMaster_Code>0) {
        ddlGodownMaster_Code = LoginGodownMaster_Code
        $('#ddlGodown').attr('disabled', 'disabled');
    }

    if (ddlVehiclesStatusInFectory === 'ALIN') {  //Inward Entry
        QueryCondition = " and GateEntryNo>0 and TransactionType='LIN' and (GodownMaster_Code=" + ddlGodownMaster_Code + " OR 0=" + ddlGodownMaster_Code + ")"

    } 
    else if (ddlVehiclesStatusInFectory === 'AEIN') { //Outward Entry
        QueryCondition = " and GateEntryNo>0 and TransactionType='EIN' and (GodownMaster_Code=" + ddlGodownMaster_Code + " OR 0=" + ddlGodownMaster_Code + ")"
    }
    else if (ddlVehiclesStatusInFectory === 'LIN') {
        QueryCondition = " and GateEntryNo>0 and TransactionType='LIN' and GateEntryOutDate is not null and (GodownMaster_Code=" + ddlGodownMaster_Code + " OR 0=" + ddlGodownMaster_Code + ")"

    } 
    else if (ddlVehiclesStatusInFectory === 'EIN') {
        QueryCondition = " and GateEntryNo>0 and TransactionType='EIN' and GateEntryOutDate is not null and (GodownMaster_Code=" + ddlGodownMaster_Code + " OR 0=" + ddlGodownMaster_Code + ")"
    }
    else if (ddlVehiclesStatusInFectory === 'PLIN') {
        QueryCondition = " and GateEntryNo>0 and TransactionType='LIN' and GateEntryOutDate is null and (GodownMaster_Code=" + ddlGodownMaster_Code + " OR 0=" + ddlGodownMaster_Code + ")"
    }
    else if (ddlVehiclesStatusInFectory === 'PEIN') {
        QueryCondition = " and GateEntryNo>0 and TransactionType='EIN' and GateEntryOutDate is null and (GodownMaster_Code=" + ddlGodownMaster_Code + " OR 0=" + ddlGodownMaster_Code + ")"
    }
    else if (ddlVehiclesStatusInFectory === 'PAll') {
        QueryCondition = " and GateEntryNo>0 and GateEntryOutDate is null"
    }
    else if (ddlVehiclesStatusInFectory === 'RAll') {
        QueryCondition = " and GateEntryNo>0 and (TransactionType='EIN' and OutType='EOUT') OR (TransactionType='LIN' and OutType='LOUT') and (GodownMaster_Code=" + ddlGodownMaster_Code + " OR 0=" + ddlGodownMaster_Code + ")"
    }
    else if (ddlVehiclesStatusInFectory === 'REOut') {
        QueryCondition = " and GateEntryNo>0 and TransactionType='EIN' and OutType='EOUT' and (GodownMaster_Code=" + ddlGodownMaster_Code + " OR 0=" + ddlGodownMaster_Code + ")"
    }
    else if (ddlVehiclesStatusInFectory === 'RLOut') {
        QueryCondition = " and GateEntryNo>0 and TransactionType='LIN' and OutType='LOUT' and (GodownMaster_Code=" + ddlGodownMaster_Code + " OR 0=" + ddlGodownMaster_Code + ")"
    }
    else if (ddlVehiclesStatusInFectory === 'TAll') {
        QueryCondition = " and TokenNo<>'' and (GodownMaster_Code=" + ddlGodownMaster_Code + " OR 0=" + ddlGodownMaster_Code + ")"
    }
    else if (ddlVehiclesStatusInFectory === 'TCon') {
        QueryCondition = " and GateEntryNo>0 and TokenNo<>'' and (GodownMaster_Code=" + ddlGodownMaster_Code + " OR 0=" + ddlGodownMaster_Code + ")"
    }
    else if (ddlVehiclesStatusInFectory === 'TBal') {
        QueryCondition = " and TokenNo<>'' and GateEntryNo=0 and (GodownMaster_Code=" + ddlGodownMaster_Code + " OR 0=" + ddlGodownMaster_Code + ")"
    }
    else if (ddlVehiclesStatusInFectory === 'all' && parseInt(ddlGodownMaster_Code) > 0) {
        QueryCondition = " and GateEntryNo>0 and (GodownMaster_Code=" + ddlGodownMaster_Code + " OR 0=" + ddlGodownMaster_Code + ")"
    }
    else {
        QueryCondition = " and GateEntryNo>0"
    }

    if (FromDate == "" && Todate == "") {
        return false;
    }
    GateEntryService.GateEntryDate(FromDate, Todate, QueryCondition).then(function (response) {
       
        console.log(response);
        //response.forEach(item => {
        //    item.Action = item["Date Out Time"] !== '' ? '<a class="btn btn-info icon-height" onclick="GateEntyMode_GateEntry(\'grid\',\'' + item["Type In"].replace(' ', '') + 'print_' + item.Code + '\')"> <i class="fa fa-print"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ',\'' + item["Type In"].replace(' ', '') + ' ' + item["Entry No"] +' '+ item["Vehicle No"] + ' ' + item["Date In Time"].replace(':', '').replace('/', '').replace('/', '') + ' ' + item["Date Out Time"].replace(':', '').replace('/', '').replace('/', '') + '\')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-dark icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'view_' + item.Code + '\')" ><i class="fa fa-eye"></i></a>' : item["Type In"].replace(' ', '').toLowerCase() === 'loadedin' ? '<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ',\'' + item["Type In"].replace(' ', '') + ' ' + item["Entry No"] +' '+ item["Vehicle No"] + ' ' + item["Date In Time"].replace(':', '').replace('/', '').replace('/', '') + ' ' + item["Date Out Time"].replace(':', '').replace('/', '').replace('/', '') + '\')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'emptyout_' + item.Code + '\')" >Empty Out</a>' : '<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ',\'' + item["Type In"].replace(' ', '') + ' ' + item["Entry No"] +' '+ item["Vehicle No"] + ' ' + item["Date In Time"].replace(':', '').replace('/', '').replace('/', '') + ' ' + item["Date Out Time"].replace(':', '').replace('/', '').replace('/', '') +'\')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'loadedout_' + item.Code + '\')" >Loaded Out</a>'
        //});
        //response.forEach(item => {
        //    item.Action = item["Date Out Time"] !== '' ? '<a class="btn btn-info icon-height" onclick="GateEntyMode_GateEntry(\'grid\',\'' + item["Type In"].replace(' ', '') + 'print_' + item.Code + '\')"> <i class="fa fa-print"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ',\'' + item["Type In"].replace(' ', '') + ' ' + item["Entry No"] + ' ' + item["Vehicle No"] + ' ' + item["Date In Time"].replace(':', '').replace('/', '').replace('/', '') + ' ' + item["Date Out Time"].replace(':', '').replace('/', '').replace('/', '') + '\')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'editFull_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-dark icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'view_' + item.Code + '\')" ><i class="fa fa-eye"></i></a>' : item["Type In"].replace(' ', '').toLowerCase() === 'loadedin' ? '<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ',\'' + item["Type In"].replace(' ', '') + ' ' + item["Entry No"] + ' ' + item["Vehicle No"] + ' ' + item["Date In Time"].replace(':', '').replace('/', '').replace('/', '') + ' ' + item["Date Out Time"].replace(':', '').replace('/', '').replace('/', '') + '\')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'edit_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'emptyout_' + item.Code + '\')" >Empty Out</a>' : '<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ',\'' + item["Type In"].replace(' ', '') + ' ' + item["Entry No"] + ' ' + item["Vehicle No"] + ' ' + item["Date In Time"].replace(':', '').replace('/', '').replace('/', '') + ' ' + item["Date Out Time"].replace(':', '').replace('/', '').replace('/', '') + '\')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'edit_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'loadedout_' + item.Code + '\')" >Loaded Out</a>'
        //});
        if (ddlVehiclesStatusInFectory.includes('T') == false) {

            //response.forEach(item => {
            //    item.Action = item["Date Out Time"] !== '' ? '<a class="btn btn-info icon-height" onclick="GateEntyMode_GateEntry(\'grid\',\'' + item["Type In"].replace(' ', '') + 'print_' + item.Code + '\')"> <i class="fa fa-print"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ',\'' + item["Type In"].replace(' ', '') + ' ' + item["Entry No"] + ' ' + item["Vehicle No"] + ' ' + item["Date In Time"].replace(':', '').replace('/', '').replace('/', '') + ' ' + item["Date Out Time"].replace(':', '').replace('/', '').replace('/', '') + '\')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'editFull_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-dark icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'view_' + item.Code + '\')" ><i class="fa fa-eye"></i></a>' : item["Type In"].replace(' ', '').toLowerCase() === 'loadedin' ? '<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ',\'' + item["Type In"].replace(' ', '') + ' ' + item["Entry No"] + ' ' + item["Vehicle No"] + ' ' + item["Date In Time"].replace(':', '').replace('/', '').replace('/', '') + ' ' + item["Date Out Time"].replace(':', '').replace('/', '').replace('/', '') + '\')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'edit_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'emptyout_' + item.Code + '\')" >Out</a>' : '<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ',\'' + item["Type In"].replace(' ', '') + ' ' + item["Entry No"] + ' ' + item["Vehicle No"] + ' ' + item["Date In Time"].replace(':', '').replace('/', '').replace('/', '') + ' ' + item["Date Out Time"].replace(':', '').replace('/', '').replace('/', '') + '\')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'edit_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'loadedout_' + item.Code + '\')" >Out</a>'
            //});
            response.forEach(item => {
                item.Action = GateEntry_BuildGridActionButtons(item);
            });
        }
        else {
            response.forEach(item => {
                item.Action = `<a class="btn btn-info icon-height" onclick="GateEnty_PrintPreviewToken(${ item.Code})"> <i class="fa fa-print"></i></a>`;
            });
        }
        ExcelExportDataArry = response;
        //console.log(response);
        const StringFilterColumn = ["Type In", "Party name", "Vehicle No", "Transporter Name", "Doc Type", "Doc No","Good Desp"];
        const NumericFilterColumn = ["Entry No IN", "Entry No OUT",];
        const DateFilterColumn = ["Date In Time", "Date Out Time"];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code", "Hour","GodownMaster_Code"];
        const ColumnAlignment = { 'Action': ';min-width:145px' };

        if (ddlVehiclesStatusInFectory.includes('R') == false) {
            hiddenColumns.push("Out Reason");
        }


        if (response.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbGateEntyViewHeader", "tbGateEntyViewBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
            let VehiclesRows = response;
            let VehiclesRowsGroupedbyVehicles = VehiclesRows.reduce((acc, item) => {
                // Use the category as the key
                const key = item["Vehicle No"];
                if (key && !acc.includes(key)) {
                    acc.push(key);
                }
                // acc[key].push(item);
                return acc;
            }, [])

            $('#spNoOfVehicles')[0].innerHTML = '<b>' + VehiclesRowsGroupedbyVehicles.length + '</b>';
        } else {
            $('#tbGateEntyView tr').empty()
            $('#spNoOfVehicles')[0].innerHTML = '0';
        }

    });
    $('#DivGateEntryForm').hide();
}
GateEntryService.GetMinPending().then(function (response) {
    $('#txtFromDate').val(typeof response === "undefined" ? new Date().toISOString().slice(0, 10) : response.minDate);
    $('#txtToDate').val(new Date().toISOString().slice(0, 10));
    GateEntryGirdByDates();
    GetConfigGateEntry();
    LockDocumntFutureDate();
    LoadListDriverDetailsByVehicleNo();
    LoadListOutReason();
    ddlGodown(); 
});

function ViewAttachment_GateEntry(GateEntryMaster_Code, sourceDownloadFileName) {
    InitAttachmentControl('GateEntryMaster', GateEntryMaster_Code, '', 0, 0, '', "View", sourceDownloadFileName);
   
}
function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode, sourceDownloadFileName) {
    var url = `${sessionStorage.getItem('AppBaseURL')}/CustomControl/AttachmentControl`;
    $('#GateEntry_AttachmentControlmodal').load(url, { MasterTableName: masterTableName, MasterTableCode: masterTableCode, DetailTableName: detailTableName, DetailTableCode: detailTableCode, EntryNo: entryNo, EntryDate: entryDate, Mode: mode, SourceDownloadFileName: sourceDownloadFileName });
}
function GateEntyMode_GateEntry(Mode,EntryType) {
    //ChangeMode(Mode);
    GateEntryMaster_Code = 0;
    if (Mode === 'form' && EntryType === 'EmptyInNew') {
        ChangeMode(Mode);
        ClearAllFrm();
        EmptyInNew();
        $('.nav-tabs button[data-bs-target="#EmptyInTab"]').tab('show');
    }
    else if (Mode === 'form' && EntryType === 'LoadedInNew') {
        ChangeMode(Mode);
        ClearAllFrm();
        LoadedInNew();
    }
    else if (Mode === 'form' && EntryType.includes('emptyout') == true) {
        
        GateEntryMaster_Code = EntryType.split('_')[1];
        let EntryGodownMaster_Code = EntryType.split('_')[2];
        if (EntryGodownMaster_Code != LoginGodownMaster_Code) {
            toastr.error('Please Check! you out worng warehouse entry. you only out Login warehouse entry!');
            return;
        }
        GateEntryService.GetGateEntryDetails(GateEntryMaster_Code).then(function (response) {
            //console.log(response);
            ChangeMode(Mode);
            ClearEmptyOutOrLoadedOutFrm();
            UpdateLoadedIn_Emptyout(response);
            CopyWeightmentSlip('emptyOut');
            GateEntry_ShowEntryNoBanner(response[0].GateEntryNo, 'out');
        });

    }
    else if (Mode === 'form' && EntryType.includes('loadedout') == true) {
        GateEntryMaster_Code = EntryType.split('_')[1];
        let EntryGodownMaster_Code = EntryType.split('_')[2];
        if (EntryGodownMaster_Code != LoginGodownMaster_Code) {
            toastr.error('Please Check! you out worng warehouse entry. you only out Login warehouse entry!');
            return;
        }

        GateEntryService.GetGateEntryDetails(GateEntryMaster_Code).then(function (response) {
            //console.log(response);
            ChangeMode(Mode);
            ClearEmptyOutOrLoadedOutFrm();
            UpdateEmptyIn_loadedout(response);
            CopyWeightmentSlip('loadedOut');
            GateEntry_ShowEntryNoBanner(response[0].GateEntryNo, 'out');
        });

    }
    else if (EntryType.includes('print') == true) {
        GateEntryMaster_Code = EntryType.split('_')[1];
        GateEnty_PrintGateEntry(GateEntryMaster_Code);
    }
    else if (EntryType.includes('edit') == true) {
        
        GateEntryMaster_Code = EntryType.split('_')[1];
        let EntryGodownMaster_Code = EntryType.split('_')[2];
        if (EntryGodownMaster_Code != LoginGodownMaster_Code) {
            toastr.error('Please Check! you edit worng warehouse entry. you only edit Login warehouse entry!');
            return;
        }
        GateEntryService.GetGateEntryDetails(GateEntryMaster_Code).then(function (response) {
            // console.log(response);

            var ModuleName = "Gate Entry",
                ShowMsg = "Y",
                FinYear = BizSolHelperFunction.getFinancialYear();
            var OptionName = 'Edit';
            MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (respCheck) {

                if (respCheck.CheckModuleOptionRight == 'N') {
                    toastr.error(respCheck.Msg);
                    return false;
                } else {
                    ChangeMode(Mode);
                    EditGateEntry(response, EntryType);
                    GateEntry_ShowEntryNoBanner(response[0].GateEntryNo, 'update');
                }
            });

        });

    }
    else if (EntryType.includes('view') == true) {
        GateEntryMaster_Code = EntryType.split('_')[1];
        GateEntryService.GetGateEntryDetails(GateEntryMaster_Code).then(function (response) {
            // console.log(response);
            ChangeMode(Mode);
            ViewGateEntry(response, EntryType);
        });

    }
    else if (Mode === 'grid') {
        ChangeMode(Mode);
        ClearAllFrm();
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
    IsEntryWithoutExistingItem = false;
    $('#RowfrmLoadedInReportingDatetime').hide();
    $('#RowfrmLoadedInVehicleLoadedWeight').hide();
    $('#RowfrmLoadedInWeightmentSlipNoLoaded').hide();
    $('#RowfrmLoadedInPOAccess').hide();
    $('#RowfrmLoadedInddlPurchaseOrder').hide();
    
    $('#DivLoadedInChassisNo').hide();
    $('#DivLoadedInRCNo').hide();
    $('#DivLoadedInRCExpiredDate').hide();
    $('#DivLoadedInDriverLicenseNo').hide();
    $('#DivLoadedInDriverLicenseExpiredDate').hide();
    $('#DivLoadedInDriverAadharNo').hide();
    $('#RowfrmLoadedInTokenNo').hide();

    $('#frmLoadedIn_txtDateIn').val(new Date().toISOString().slice(0, 10));
    $('#frmLoadedIn_txtVehicleInTime').val(`${new Date().getHours()}:${new Date().getMinutes()}`);
    $('#frmLoadedIn_txtModeOfTransportation').val('');

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'ReportingDatetimeApplicable').PerameterValue === 'Y') {
        $('#frmLoadedIn_txtReportingDatetime').val('');
        $('#RowfrmLoadedInReportingDatetime').show();
    }
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
        $('#frmLoadedIn_txtVehicleLoadedWeight').val('');
        $('#frmLoadedIn_txtWeightmentSlipNoLoaded').val('');

        $('#RowfrmLoadedInVehicleLoadedWeight').show();
        $('#RowfrmLoadedInWeightmentSlipNoLoaded').show();
    }
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'POWiseEntryMendatory').PerameterValue === 'Y') {
        
        GateEntryService.GetPendingPONO().then(function (response) {
            //console.log(response);
            G_PendingPONOList = response;
            BindSelectList($('#frmLoadedIn_ddlPurchaseOrder')[0], response.map((item) => ({ Code: item.PurchaseOrderMaster_Code, Desp: item.PONo, VendorName: item.VendorName })));
            $('#frmLoadedIn_ddlPurchaseOrder').select2({
                width: '-webkit-fill-available'
            });
        });

        $('#RowfrmLoadedInPOAccess').show();
        $('#RowfrmLoadedInddlPurchaseOrder').show();
        IsWithPo = true;
        IsEntryWithoutExistingItem = false;
        WithPO();
     }

    GateEntry_applyLoadedInGoodsDescriptionAutoSuggestionState();

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
        $('#frmLoadedIn_txtChassisNo').val('');
        $('#frmLoadedIn_txtRCNo').val('');
        $('#frmLoadedIn_txtRCExpiredDate').val('');
        $('#frmLoadedIn_txtDriverLicenseNo').val('');
        $('#frmLoadedIn_txtDriverLicenseExpiredDate').val('');
        $('#frmLoadedIn_txtDriverAadharNo').val('');

        $('#DivLoadedInChassisNo').show();
        $('#DivLoadedInRCNo').show();
        $('#DivLoadedInRCExpiredDate').show();
        $('#DivLoadedInDriverLicenseNo').show();
        $('#DivLoadedInDriverLicenseExpiredDate').show();
        $('#DivLoadedInDriverAadharNo').show();
    }

    GateEntryService.GetTransportersNameList().then(function (response) {
        AutoSuggestionControl.SetUpAutoSuggestion($('#frmLoadedIn_ddlTransporterName'), $('#frmLoadedIn_ddlTransporterName_List'), response.map((item) => ({ Desp: item.AccountDesp })), 'StartWith');
    });
    GateEntryService.GetVendorOrClientNameListData('VENDOR').then(function (response) {
        AutoSuggestionControl.SetUpAutoSuggestion(
            $('#frmLoadedIn_txtVendorName'), 
            $('#frmLoadedIn_txtVendorName_List'), 
            response.map((item) => ({ Desp: item.AccountDesp })), 
            'StartWith',
            true,
            function (selectedItem) {
                if (selectedItem) {
                    $('#frmLoadedIn_ddlPurchaseOrder').val('').trigger('change');
                    chnage_VendorNameGetPOByVendor();
                }
            }
        );
    });

    GateEntryService.GetUOMMasterList().then(function (response) {

        BindSelectList($('#frmLoadedIn_txtUOM')[0], response.map((item) => ({ Code: item.UOM, Desp: item.UOM, VendorName: '' })));
        $('#frmLoadedIn_txtUOM').select2({
            width: '-webkit-fill-available'
        });

    });

    GateEntryService.GateEntryCategoryIn().then(function (response) {

        BindSelectList($('#frmLoadedIn_ddlDocumentType')[0], response.map((item) => ({ Code: item.Desp, Desp: item.Desp, VendorName: '' })));
        $('#frmLoadedIn_ddlDocumentType').select2({
            width: '-webkit-fill-available'
        });

    });
    
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'TokenApplicable').PerameterValue === 'Y') {
        $('#RowfrmLoadedInReportingDatetime').show();
        $('#frmLoadedIn_txtReportingDatetime').attr('readonly', 'readonly');
        $('#RowfrmLoadedInTokenNo').show();
    }

    $('#DivfrmEmptyOut').hide();
}
function EmptyInNew() {

    $('#frmEmptyIn_txtDateIn').val(new Date().toISOString().slice(0, 10));
    $('#frmEmptyIn_txtVehicleInTime').val(`${new Date().getHours()}:${new Date().getMinutes()}`);

    $('#frmEmptyIn_txtVehicleNo').val('');
    $('#frmEmptyIn_txtModeOfTransportation').val('');
    $('#frmEmptyIn_txtDriverName').val('');
    $('#frmEmptyIn_txtDriverNo').val('');
    $('#frmEmptyIn_txtRemarks').val('');
    $('#frmEmptyIn_ddlTransporterName').val('');
    $('#RowfrmEmptyInReportingDatetime').hide();
    $('#RowfrmEmptyInVehicleEmptyWeight').hide();
    $('#RowfrmEmptyInWeightmentSlipNoEmpty').hide();

    $('#DivEmptyInChassisNo').hide();
    $('#DivEmptyInRCNo').hide();
    $('#DivEmptyInRCExpiredDate').hide();
    $('#DivEmptyInDriverLicenseNo').hide();
    $('#DivEmptyInDriverLicenseExpiredDate').hide();
    $('#RowfrmEmptyInTokenNo').hide();
    $('#DivEmptyInDriverAadharNo').hide();

    GateEntryService.GetTransportersNameList().then(function (response) {
        //console.log(response);
        //BindSelectList($('#frmEmptyIn_ddlTransporterName')[0], response.map((item) => ({ Code: item.Code, Desp: item.AccountDesp })));
        //$('#frmEmptyIn_ddlTransporterName').select2({
        //    width: '-webkit-fill-available'
        //});
        AutoSuggestionControl.SetUpAutoSuggestion($('#frmEmptyIn_ddlTransporterName'), $('#frmEmptyIn_ddlTransporterName_List'), response.map((item) => ({ Desp: item.AccountDesp })),'StartWith');
    });

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'ReportingDatetimeApplicable').PerameterValue === 'Y') {
        $('#frmEmptyIn_txtReportingDatetime').val('');
        $('#RowfrmEmptyInReportingDatetime').show();
    }
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
        $('#frmEmptyIn_txtVehicleEmptyWeight').val('');
        $('#frmEmptyIn_txtWeightmentSlipNoEmpty').val('');

        $('#RowfrmEmptyInVehicleEmptyWeight').show();
        $('#RowfrmEmptyInWeightmentSlipNoEmpty').show();
    }

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
        $('#frmEmptyIn_txtChassisNo').val('');
        $('#frmEmptyIn_txtRCNo').val('');
        $('#frmEmptyIn_txtRCExpiredDate').val('');
        $('#frmEmptyIn_txtDriverLicenseNo').val('');
        $('#frmEmptyIn_txtDriverLicenseExpiredDate').val('');
        $('#frmEmptyIn_txtDriverAadharNo').val('');
              
        $('#DivEmptyInChassisNo').show();
        $('#DivEmptyInRCNo').show();
        $('#DivEmptyInRCExpiredDate').show();
        $('#DivEmptyInDriverLicenseNo').show();
        $('#DivEmptyInDriverLicenseExpiredDate').show();
        $('#DivEmptyInDriverAadharNo').show();
    }
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'TokenApplicable').PerameterValue === 'Y') {
        $('#frmEmptyIn_txtReportingDatetime').attr('readonly', 'readonly');

        $('#RowfrmEmptyInReportingDatetime').show();
        $('#RowfrmEmptyInTokenNo').show();
    }

    $('#DivfrmEmptyIn_fileVehiclePhoto').show();

    $('#DivfrmLoadedOut').hide();
}

function UpdateLoadedIn_Emptyout(gateEntryData) {
    console.log(gateEntryData);
    GateEntry_ApplyEntryWithoutExistingItemRadioVisibility();
    $('#RowfrmLoadedInReportingDatetime').hide();
    $('#RowfrmLoadedInVehicleLoadedWeight').hide();
    $('#RowfrmLoadedInWeightmentSlipNoLoaded').hide();
    $('#RowfrmLoadedInPOAccess').hide();
    $('#RowfrmLoadedInddlPurchaseOrder').hide();
    $('#RowfrmEmptyOutVehicleEmptyWeight').hide();
    $('#RowfrmEmptyOutWeightmentSlipNoLoaded').hide();
    $('#DivLoadedInChassisNo').hide();
    $('#DivLoadedInRCNo').hide();
    $('#DivLoadedInRCExpiredDate').hide();
    $('#DivLoadedInDriverLicenseNo').hide();
    $('#DivLoadedInDriverLicenseExpiredDate').hide();
    $('#DivLoadedInDriverAadharNo').hide();

    $('#frmEmptyOut_txtDateOut').val(new Date().toISOString().slice(0, 10));
    $('#frmEmptyOut_txtOutTime').val(`${new Date().getHours()}:${new Date().getMinutes()}`);
    
    //$('#frmLoadedIn_txtDateIn').val(new Date(gateEntryData[0].GateEntryDate).toISOString().slice(0, 10));
    $('#frmLoadedIn_txtDateIn').val(gateEntryData[0].GateEntryDate.slice(0, 10));
    $('#frmLoadedIn_txtVehicleInTime').val(gateEntryData[0].TimeIO);

    $('#frmLoadedIn_txtVehicleNo').val(gateEntryData[0].VehicleNo);
    $('#frmLoadedIn_txtDriverName').val(gateEntryData[0].DriverName);
    $('#frmLoadedIn_txtDriverNo').val(gateEntryData[0].DriverMobile);
    $('#frmLoadedIn_ddlTransporterName').val(gateEntryData[0].OtherTransporterName);

    
    $('#frmLoadedIn_txtReportingDatetime').val(gateEntryData[0].ReportingDatetime);
    $('#frmLoadedIn_txtVehicleLoadedWeight').val(gateEntryData[0].LoadedWeight);
    $('#frmLoadedIn_txtWeightmentSlipNoLoaded').val(gateEntryData[0].WeightmentSlipNumberIn);
    
    
    GateEntryService.GetUOMMasterList().then(function (response) {

        BindSelectList($('#frmLoadedIn_txtUOM')[0], response.map((item) => ({ Code: item.UOM, Desp: item.UOM, VendorName: '' })));
        $('#frmLoadedIn_txtUOM').select2({
            width: '-webkit-fill-available'
        });
        $('#frmLoadedIn_txtUOM').val(gateEntryData[0].UOM);

        $('#frmLoadedIn_txtUOM').select2({
            width: '-webkit-fill-available'
        });
    });

    GateEntryService.GateEntryCategoryIn().then(function (response) {

        BindSelectList($('#frmLoadedIn_ddlDocumentType')[0], response.map((item) => ({ Code: item.Desp, Desp: item.Desp, VendorName: '' })));

        $('#frmLoadedIn_ddlDocumentType').val(gateEntryData[0].DocumentType);

        $('#frmLoadedIn_ddlDocumentType').select2({
            width: '-webkit-fill-available'
        });
        frmLoadedIn_ddlDocumentType('view');
    });
    
    $('#frmLoadedIn_txtVendorName').val(gateEntryData[0].VendorName);

    $('#frmLoadedIn_txtDocumentNo').val(gateEntryData[0].DocNo);
    $('#frmLoadedIn_txtDocumentDate').val(geFormatGateEntryInputDate(gateEntryData[0].InvoiceDate));
    $('#frmLoadedIn_txtEWayBillNo').val(gateEntryData[0].EwaybillNo);
    $('#frmLoadedIn_txtEWayBillDate').val(gateEntryData[0].EwaybillDate ==null?'': new Date(gateEntryData[0].EwaybillDate).toISOString().slice(0, 10));
    $('#frmLoadedIn_txtRemarks').val(gateEntryData[0].Remarks);
    $('#frmLoadedIn_txtChassisNo').val(gateEntryData[0].ChassisNo); 
    $('#frmLoadedIn_txtRCNo').val(gateEntryData[0].RCNo);
    $('#frmLoadedIn_txtRCExpiredDate').val(gateEntryData[0].RCExpiredDate == null ? '' : new Date(gateEntryData[0].RCExpiredDate).toISOString().slice(0, 10));
    $('#frmLoadedIn_txtDriverLicenseNo').val(gateEntryData[0].DriverLicenseNo);
    $('#frmLoadedIn_txtDriverLicenseExpiredDate').val(gateEntryData[0].DriverLicenseExpiredDate == null ? '' : new Date(gateEntryData[0].DriverLicenseExpiredDate).toISOString().slice(0, 10));
    $('#frmLoadedIn_txtDriverAadharNo').val(gateEntryData[0].DriverAadharNo);
    $('#frmLoadedIn_txtTokenNo').val(gateEntryData[0].TokenNo);

    GateEntry_ApplyModeOfTransportationCode(GateEntry_ModeOfTransportationCodeFromData(gateEntryData));

    $('#frmLoadedIn_txtVehicleInTime').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtVehicleNo').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtDriverName').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtDriverNo').attr('readonly', 'readonly');
    $('#frmLoadedIn_ddlTransporterName').attr('readonly', 'readonly');

    $('#frmLoadedIn_txtReportingDatetime').attr('readonly', 'readonly');

    $('#frmLoadedIn_txtWeightmentSlipNoLoaded').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtVehicleLoadedWeight').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtGoodsDescription').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtQTY').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtUOM').attr('readonly', 'readonly');
    //$('#frmLoadedIn_ddlDocumentType').attr('readonly', 'readonly');
    $('#frmLoadedIn_ddlDocumentType').attr('disabled', 'disabled');
    $('#frmLoadedIn_txtVendorName').attr('readonly', 'readonly');

    $('#frmLoadedIn_txtDocumentNo').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtDocumentDate').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtEWayBillNo').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtEWayBillDate').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtRemarks').attr('readonly', 'readonly');

    $('#frmLoadedIn_txtChassisNo').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtRCNo').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtRCExpiredDate').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtDriverLicenseNo').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtDriverLicenseExpiredDate').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtDriverAadharNo').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtTokenNo').attr('readonly', 'readonly');
    $('#frmLoadedIn_txtModeOfTransportation').attr('disabled', 'disabled');

    $('#DivfrmLoadedIn_fileVehiclePhoto').hide();
    $('#DivfrmLoadedIn_fileGoodsPhoto').hide();
    $('#DivfrmLoadedIn_fileInvoicePhoto').hide();
    $('#DivfrmLoadedIn_fileOtherPhoto').hide();
    
    $('.nav-tabs button[data-bs-target="#LoadedInTab"]').tab('show')
    $('#frmLoadedIn_btnSave').attr('disabled', 'disabled')
    $('#frmLoadedIn_btnCancel').attr('disabled', 'disabled')

    $('#frmLoadedIn_btnSave').removeAttr('onclick');
    $('#frmLoadedIn_btnSave').attr('onclick', "GateEntry_SaveData('LoadedInSave')");

    $('#frmEmptyOut_btnSave').removeAttr('onclick');
    $('#frmEmptyOut_btnSave').attr('onclick', "GateEntry_SaveData('UpdateLoadedInSave')");

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'ReportingDatetimeApplicable').PerameterValue === 'Y') {

        $('#RowfrmLoadedInReportingDatetime').show();
    }
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'TokenApplicable').PerameterValue === 'Y') {
        $('#RowfrmLoadedInReportingDatetime').show();
        $('#frmLoadedIn_txtReportingDatetime').attr('readonly', 'readonly');
        $('#RowfrmLoadedInTokenNo').show();
    }

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
        
        $('#RowfrmLoadedInVehicleLoadedWeight').show();
        $('#RowfrmLoadedInWeightmentSlipNoLoaded').show();
        $('#RowfrmEmptyOutVehicleEmptyWeight').show();
        $('#RowfrmEmptyOutWeightmentSlipNoLoaded').show();
    }
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {

        $('#DivLoadedInChassisNo').show();
        $('#DivLoadedInRCNo').show();
        $('#DivLoadedInRCExpiredDate').show();
        $('#DivLoadedInDriverLicenseNo').show();
        $('#DivLoadedInDriverLicenseExpiredDate').show();
        $('#DivLoadedInDriverAadharNo').show();
    }

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'POWiseEntryMendatory').PerameterValue === 'Y') {
        GateEntryService.GetPendingPONO().then(function (response) {
                console.log(response);
            console.log(gateEntryData[0].PurchaseOrderMaster_Code);

            BindSelectList($('#frmLoadedIn_ddlPurchaseOrder')[0], response.map((item) => ({ Code: item.PurchaseOrderMaster_Code, Desp: item.PONo, VendorName: item.VendorName })));
                $('#frmLoadedIn_ddlPurchaseOrder').select2({
                    width: '-webkit-fill-available'
                });
            $('#frmLoadedIn_ddlPurchaseOrder').val(gateEntryData[0].PurchaseOrderMaster_Code);
            $('#frmLoadedIn_ddlPurchaseOrder').select2({
                width: '-webkit-fill-available'
            });
        });

        GateEntryService.getPODetailByGateEntryCode(gateEntryData[0].Code).then(function (response) {
            console.log(response)
            $('#RowfrmLoadedInPoItemGrid').show();
            

            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = []
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["PurchaseOrderMaster_Code", "PurchaseOrderTransaction_Code"];
            const ColumnAlignment = {};
            BizsolCustomFilterGrid.CreateDataTable("tbGateEntyLoadedInPoItemHeader", "tbGateEntyLoadedInPoItemBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        });
        $('#frmLoadedIn_ddlPurchaseOrder').attr('disabled', 'disabled');

        $('#RowfrmLoadedInPOAccess').show();
        $('#RowfrmLoadedInddlPurchaseOrder').show();
        IsWithPo = true;
        WithPO();
    }
    if (parseInt(gateEntryData[0].PurchaseOrderMaster_Code) == 0) { //Entry saved without PO...

        IsWithPo = false;
        const entryWithoutExisting =
            gateEntryData[0].EntryWithOutExistingItem === 'Y' ||
            gateEntryData[0].EntryWithOutExistingItem === true ||
            String(gateEntryData[0].EntryWithOutExistingItem || '').toUpperCase() === 'Y';
        const useWithoutExistingRadio = entryWithoutExisting && GateEntry_IsEntryWithoutExistingItemEnabled();
        IsEntryWithoutExistingItem = useWithoutExistingRadio;
        WithPO();
        $('#frmLoadedIn_txtGoodsDescription').val(gateEntryData[0].GoodDescription);
        $('#frmLoadedIn_txtQTY').val(gateEntryData[0].Qty);
        $('#frmLoadedIn_txtUOM').attr('disabled', 'disabled');
        
        if (useWithoutExistingRadio) {
            jQuery('input:radio[name="rdPOAccess"]').filter('[value="withoutexistingitem"]').prop('checked', true);
        } else {
            jQuery('input:radio[name="rdPOAccess"]').filter('[value="withoutpo"]').prop('checked', true);
        }
    }
    else {
        IsEntryWithoutExistingItem = false;
        jQuery('input:radio[name="rdPOAccess"]').filter('[value="withpo"]').prop('checked', true);
    }

    GateEntry_applyLoadedInGoodsDescriptionAutoSuggestionState();

      $('#DivfrmEmptyOut').show();
      $('#RowfrmEmptyOut_fileVehiclePhoto').show();


}

function UpdateEmptyIn_loadedout(gateEntryData) {

    //$('#frmEmptyIn_txtDateIn').val(new Date(gateEntryData[0].GateEntryDate).toISOString().slice(0, 10));
    $('#frmEmptyIn_txtDateIn').val(gateEntryData[0].GateEntryDate.slice(0, 10));
    $('#frmEmptyIn_txtVehicleInTime').val(gateEntryData[0].TimeIO);
    $('#frmEmptyIn_txtVehicleNo').val(gateEntryData[0].VehicleNo); 
    $('#frmEmptyIn_txtDriverName').val(gateEntryData[0].DriverName);
    $('#frmEmptyIn_txtDriverNo').val(gateEntryData[0].DriverMobile);
    $('#frmEmptyIn_ddlTransporterName').val(gateEntryData[0].OtherTransporterName);
    $('#frmEmptyIn_txtRemarks').val(gateEntryData[0].Remarks);
    $('#frmEmptyIn_txtVehicleEmptyWeight').val(gateEntryData[0].EmptyWeight);
    $('#frmEmptyIn_txtWeightmentSlipNoEmpty').val(gateEntryData[0].WeightmentSlipNumberIn);
    $('#frmEmptyIn_txtReportingDatetime').val(gateEntryData[0].ReportingDatetime);
    //$('#frmLoadedOut_txtDateOut').val(gateEntryData[0].GateEntryOutDate == null ? new Date().toISOString().slice(0, 10) : new Date(gateEntryData[0].GateEntryDate).toISOString().slice(0, 10));

    $('#frmLoadedOut_txtDateOut').val(gateEntryData[0].GateEntryOutDate == null ? new Date().toISOString().slice(0, 10) : gateEntryData[0].GateEntryDate.slice(0, 10));

    $('#frmLoadedOut_txtVehicleOutTime').val(gateEntryData[0].VehicleOutTime == '00:00' ? `${new Date().getHours()}:${new Date().getMinutes()}` : gateEntryData[0].VehicleOutTime);

    $('#frmLoadedOut_txtNetWeightLoadedOut').val(0);

    $('#frmEmptyIn_txtChassisNo').val(gateEntryData[0].ChassisNo);
    $('#frmEmptyIn_txtRCNo').val(gateEntryData[0].RCNo);
    $('#frmEmptyIn_txtRCExpiredDate').val(new Date(gateEntryData[0].RCExpiredDate).toISOString().slice(0, 10));
    $('#frmEmptyIn_txtDriverLicenseNo').val(gateEntryData[0].DriverLicenseNo);
    $('#frmEmptyIn_txtDriverLicenseExpiredDate').val(new Date(gateEntryData[0].DriverLicenseExpiredDate).toISOString().slice(0, 10));
    $('#frmEmptyIn_txtDriverAadharNo').val(gateEntryData[0].DriverAadharNo);
    $('#frmEmptyIn_txtTokenNo').val(gateEntryData[0].TokenNo);

    GateEntry_ApplyModeOfTransportationCode(GateEntry_ModeOfTransportationCodeFromData(gateEntryData));

    G_TableName = gateEntryData[0].TableName;
    G_TableCode = gateEntryData[0].Table_Code;

    $('#frmEmptyIn_txtVehicleNo').attr('readonly', 'readonly')
    $('#frmEmptyIn_txtDriverName').attr('readonly', 'readonly')
    $('#frmEmptyIn_txtDriverNo').attr('readonly', 'readonly')
    $('#frmEmptyIn_ddlTransporterName').attr('readonly', 'readonly')
    $('#frmEmptyIn_txtRemarks').attr('readonly', 'readonly')
    $('#frmEmptyIn_txtVehicleEmptyWeight').attr('readonly', 'readonly')
    $('#frmEmptyIn_txtWeightmentSlipNoEmpty').attr('readonly', 'readonly')
    $('#frmEmptyIn_txtReportingDatetime').attr('readonly', 'readonly')
    $('#frmEmptyIn_txtChassisNo').attr('readonly', 'readonly');
    $('#frmEmptyIn_txtRCNo').attr('readonly', 'readonly');
    $('#frmEmptyIn_txtRCExpiredDate').attr('readonly', 'readonly');
    $('#frmEmptyIn_txtDriverLicenseNo').attr('readonly', 'readonly');
    $('#frmEmptyIn_txtDriverLicenseExpiredDate').attr('readonly', 'readonly');
    $('#frmEmptyIn_txtDriverAadharNo').attr('readonly', 'readonly');
    $('#frmEmptyIn_txtTokenNo').attr('readonly', 'readonly');
    $('#frmEmptyIn_txtModeOfTransportation').attr('disabled', 'disabled');

    
    $('#DivfrmEmptyIn_fileVehiclePhoto').hide();
    $('#RowfrmEmptyInReportingDatetime').hide();
    $('#RowfrmEmptyInVehicleEmptyWeight').hide();
    $('#RowfrmEmptyInWeightmentSlipNoEmpty').hide();
    $('#RowfrmLoadedOutVehicleLoadedWeight').hide();
    $('#RowfrmLoadedOutWeightmentSlipNoLoadedOut').hide();
    $('#RowfrmLoadedOutNetWeightLoadedOut').hide();

    $('#DivEmptyInChassisNo').hide();
    $('#DivEmptyInRCNo').hide();
    $('#DivEmptyInRCExpiredDate').hide();
    $('#DivEmptyInDriverLicenseNo').hide();
    $('#DivEmptyInDriverLicenseExpiredDate').hide();
    $('#DivEmptyInDriverAadharNo').hide();
    $('#RowfrmEmptyInTokenNo').hide();

    $('#RowLoadedOut_txtManualDocNo').hide();
    $('#RowLoadedOut_txtGRNo').hide();

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'ReportingDatetimeApplicable').PerameterValue === 'Y') {
        $('#RowfrmEmptyInReportingDatetime').show();
    }
    
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'TokenApplicable').PerameterValue === 'Y') {
        $('#frmEmptyIn_txtReportingDatetime').attr('readonly', 'readonly');
       
        $('#RowfrmEmptyInReportingDatetime').show();
        $('#RowfrmEmptyInTokenNo').show();
    }
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
        $('#RowfrmEmptyInVehicleEmptyWeight').show();
        $('#RowfrmEmptyInWeightmentSlipNoEmpty').show();
        $('#RowfrmLoadedOutVehicleLoadedWeight').show();
        $('#RowfrmLoadedOutWeightmentSlipNoLoadedOut').show();
        $('#RowfrmLoadedOutNetWeightLoadedOut').show();
    }

    GateEntryService.GetVendorOrClientNameListData('CLIENT').then(function (response) {
        AutoSuggestionControl.SetUpAutoSuggestion($('#frmLoadedOut_txtCustomerName'), $('#frmLoadedOut_txtCustomerName_List'), response.map((item) => ({ Desp: item.AccountDesp })), 'StartWith');
    });
    GateEntryService.GetGoodDespList().then(function (response) {
        const goodsList = response.map((item) => ({ Desp: item.GoodDesp, UOM: item.UOM }));
        AutoSuggestionControl.SetUpAutoSuggestion(
            $('#frmLoadedOut_txtGoodsDescription'),
            $('#frmLoadedOut_txtGoodsDescription_List'),
            goodsList,
            'StartWith',
            true,
            function(selectedItem) {
                if (selectedItem && selectedItem.UOM) {
                    $('#frmLoadedOut_ddlUOM').val(selectedItem.UOM).trigger('change');
                }
            }
        );
    });

    GateEntryService.GetUOMMasterList().then(function (response) {
        
        BindSelectList($('#frmLoadedOut_ddlUOM')[0], response.map((item) => ({ Code: item.UOM, Desp: item.UOM, VendorName: '' })));
        $('#frmLoadedOut_ddlUOM').select2({
            width: '-webkit-fill-available'
        });
       
    });

    
    GateEntryService.GateEntryCategoryOut().then(function (response) {
        BindSelectList($('#frmLoadedOut_ddlDocumentType')[0], response.map((item) => ({ Code: item.Desp, Desp: item.Desp, VendorName: '' })));
        $('#frmLoadedOut_ddlDocumentType').select2({
            width: '-webkit-fill-available'
        });
    });

    ////BindSelectList($('#frmLoadedOut_ddlDocumentType')[0], doctype.map((item) => ({ Code: item.name, Desp: item.name, VendorName: '' })));
    ////$('#frmLoadedOut_ddlDocumentType').select2({
    ////    width: '-webkit-fill-available'
    ////});

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
        $('#DivEmptyInChassisNo').show();
        $('#DivEmptyInRCNo').show();
        $('#DivEmptyInRCExpiredDate').show();
        $('#DivEmptyInDriverLicenseNo').show();
        $('#DivEmptyInDriverLicenseExpiredDate').show();
        $('#DivEmptyInDriverAadharNo').show();
    }

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'ShowExtraDocumentNo').PerameterValue === 'Y') {
        $('#RowLoadedOut_txtManualDocNo').show();
        $('#RowLoadedOut_txtGRNo').show();
    }

    $('.nav-tabs button[data-bs-target="#EmptyInTab"]').tab('show')
    $('#frmEmptyIn_btnSave').attr('disabled', 'disabled')
    $('#frmEmptyIn_btnCancel').attr('disabled', 'disabled')
    $('#DivfrmLoadedOut').show();
    $('#RowLoadedOut_fileVehiclePhoto').show();
    $('#RowLoadedOut_fileGoodsPhoto').show();
    $('#RowLoadedOut_fileInvoicePhoto').show();
    $('#RowLoadedOut_fileOtherPhoto').show();

    $('#frmEmptyIn_btnSave').removeAttr('onclick');
    $('#frmEmptyIn_btnSave').attr('onclick', "GateEntry_SaveData('EmptyInSave')");

    $('#frmLoadedOut_btnSave').removeAttr('onclick');
    $('#frmLoadedOut_btnSave').attr('onclick', "GateEntry_SaveData('UpdateEmptyInSave')");
}
function BindSelectList(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '" VendorName="' + val.VendorName + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

function BindSelectList2(element, list) {
    let option = '<option value="0">All</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function BindSelectList3(element, list) {
    let option = '<option value="">Please select </option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Desp + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function GateEntry_ModeOfTransportationCodeFromData(gateEntryData) {
    if (!gateEntryData || !gateEntryData[0]) return '';
    const d = gateEntryData[0];
    const v = d.F_ModeOfTransportation_Code ?? d.ModeOfTransportationCode ?? d.ModeOfTransportation ?? d.modeOfTransportation;
    return v === undefined || v === null ? '' : String(v);
}

function GateEntry_ApplyModeOfTransportationCode(code) {
    const v = code === undefined || code === null || code === '' ? '' : String(code);
    $('#frmEmptyIn_txtModeOfTransportation').val(v);
    $('#frmLoadedIn_txtModeOfTransportation').val(v);
}

function GateEntry_IsModeOfTransportEnabled() {
    if (!ConfigGateEntry || ConfigGateEntry.length === 0) return false;
    const p = ConfigGateEntry.find((x) => x.PerameterName === 'EnableModeOfTransport');
    return p && String(p.PerameterValue).toUpperCase() === 'Y';
}

/** When mode is By Hand or Courier, vehicle/driver/transporter/weight slip/vehicle photo are not mandatory (requires EnableModeOfTransport + matching option text). */
function GateEntry_IsByHandOrCourierFromSelect($select) {
    if (!$select || !$select.length) return false;
    const t = ($select.find('option:selected').text() || '').trim().toLowerCase().replace(/\s+/g, ' ');
    return t === 'by hand' || t === 'courier';
}

function GateEntry_ApplyModeOfTransportVisibility() {
    const show = GateEntry_IsModeOfTransportEnabled();
    const $rows = $('#RowGateEntry_ModeOfTransportation_EmptyIn, #RowGateEntry_ModeOfTransportation_LoadedIn');
    if (show) {
        $rows.show();
    } else {
        $rows.hide();
        $('#frmEmptyIn_txtModeOfTransportation').val('');
        $('#frmLoadedIn_txtModeOfTransportation').val('');
    }
}

function BindGateEntryTransportModeSelects() {
    GateEntryService.GetTransportMode().then(function (response) {
        if (!response || !Array.isArray(response)) return;
        const list = response.map((item) => ({
            Desp: item.Desp ?? item.desp ?? item.Description ?? item.ModeName ?? '',
        })).filter((x) => x.Desp !== '');
        const ids = ['frmEmptyIn_txtModeOfTransportation', 'frmLoadedIn_txtModeOfTransportation'];
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (el) BindSelectList3(el, list);
        });
    });
}

function ShowGateEntryConfigurationModal() {
    GateEntryService.GetConfigGateEntry().then(function (response) {
        const toleranceParamName = 'ToleranceToMatchNetWeightWithDocumentQty';
        const matchParamName = 'MatchNetWeightWithDocumentQty';

        const matchParam = response.find(x => x.PerameterName === matchParamName);
        const isMatchEnabled = matchParam && String(matchParam.PerameterValue).toUpperCase() === 'Y';

        let option = '';
        $.each(response, function (key, val) {
            if (val.PerameterName === toleranceParamName) {
                // Render as number textbox; only show when MatchNetWeightWithDocumentQty = Y
                const displayStyle = isMatchEnabled ? '' : 'display:none;';
                option += `<div class="col-6" id="DivConfig_${toleranceParamName}" style="${displayStyle}">` +
                    `<label>${BizSolHelperFunction.ToWithSpace(val.PerameterName)}</label>` +
                    `&nbsp;<input type="number" min="0" max="100" step="0.01" class="form-control d-inline-block w-50" ` +
                    `value="${val.PerameterValue}" onchange="setGateEntryToleranceParamater(this,'${val.PerameterName}')" /></div>`;
            } else {
                let Checked = String(val.PerameterValue).toLowerCase() === 'y' ? 'checked' : '';
                let extraOnClick = val.PerameterName === matchParamName
                    ? ` GateEntry_ToggleToleranceVisibility(this);`
                    : '';
                option += `<div class="col-6"><input type="checkbox" class="box_border" ${Checked} onclick="setGateEntryParamater(this,'${val.PerameterName}','${val.PerameterValue}');${extraOnClick}" />&nbsp;<label>${BizSolHelperFunction.ToWithSpace(val.PerameterName)}</label></div>`;
            }
        });

        $('#DivChkSetGateEntryConfiguration')[0].innerHTML = option;
        $("#GateEntryConfigurationModal").modal({
            backdrop: 'static',
        });
        $("#GateEntryConfigurationModal").modal('show');
    });
}

function GateEntry_ToggleToleranceVisibility(checkbox) {
    const div = document.getElementById('DivConfig_ToleranceToMatchNetWeightWithDocumentQty');
    if (div) {
        div.style.display = checkbox.checked ? '' : 'none';
    }
}

function setGateEntryToleranceParamater(element, PerameterName) {
    const val = parseFloat(element.value);
    if (isNaN(val) || val < 0 || val > 100) {
        toastr.error('Please enter a valid tolerance value between 0 and 100');
        return;
    }
    GateEntryService.UpdateConfigGateEntry(PerameterName, String(val)).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            GetConfigGateEntry();
        }
    });
}
function setGateEntryParamater(element, PerameterName, PerameterValue) {
    let SetPerameterValue = 'N';
    if (element.checked == true) {
        SetPerameterValue = 'Y';
    }
    GateEntryService.UpdateConfigGateEntry(PerameterName, SetPerameterValue).then(function (response) {
        if (response.Status === 'Y') {
            //alert(response.Msg)
            toastr.success(response.Msg);
            GateEntryGirdByDates();
            GetConfigGateEntry();
        }
    });

}

function GateEntry_IsEntryWithoutExistingItemEnabled() {
    if (!ConfigGateEntry || ConfigGateEntry.length === 0) return false;
    const p = ConfigGateEntry.find((x) => x.PerameterName === 'EntryWithOutExistingItem');
    return p && String(p.PerameterValue).toUpperCase() === 'Y';
}

function GateEntry_ApplyEntryWithoutExistingItemRadioVisibility() {
    const $wrap = $('#RowGateEntry_rdPOAccess_WithoutExistingItem');
    if (!$wrap.length) return;
    if (GateEntry_IsEntryWithoutExistingItemEnabled()) {
        $wrap.removeClass('d-none');
    } else {
        $wrap.addClass('d-none');
        const sel = $('input[name="rdPOAccess"]:checked').val();
        if (sel === 'withoutexistingitem') {
            $('input[name="rdPOAccess"][value="withpo"]').prop('checked', true);
            IsWithPo = true;
            IsEntryWithoutExistingItem = false;
            WithPO();
            GateEntry_applyLoadedInGoodsDescriptionAutoSuggestionState();
        }
    }
}

function GateEntry_clearLoadedInGoodsDescriptionAutoSuggestion() {
    const $inp = $('#frmLoadedIn_txtGoodsDescription');
    const $list = $('#frmLoadedIn_txtGoodsDescription_List');
    $inp.off('focus input keydown');
    $list.empty().hide();
    $(document).off('click', '#frmLoadedIn_txtGoodsDescription_List li');
}

function GateEntry_applyLoadedInGoodsDescriptionAutoSuggestionState() {
    if (IsEntryWithoutExistingItem) {
        GateEntry_clearLoadedInGoodsDescriptionAutoSuggestion();
        return;
    }
    GateEntryService.GetGoodDespList().then(function (response) {
        const goodsList = response.map((item) => ({ Desp: item.GoodDesp, UOM: item.UOM }));
        AutoSuggestionControl.SetUpAutoSuggestion(
            $('#frmLoadedIn_txtGoodsDescription'),
            $('#frmLoadedIn_txtGoodsDescription_List'),
            goodsList,
            'StartWith',
            true,
            function (selectedItem) {
                if (selectedItem && selectedItem.UOM) {
                    $('#frmLoadedIn_txtUOM').val(selectedItem.UOM).trigger('change');
                }
            }
        );
    });
}

function GetConfigGateEntry() {
    GateEntryService.GetConfigGateEntry().then(function (response) {
        ConfigGateEntry = response;
        EnableScaleWeight();
        BindddlVehiclesStatusInFectory();
        BindGateEntryTransportModeSelects();
        GateEntry_ApplyModeOfTransportVisibility();
        GateEntry_ApplyEntryWithoutExistingItemRadioVisibility();

    });
}

function GateEntry_rdPOAccess_onClick(ele) {
   
    if (ele.value === 'withpo') {
        IsWithPo = true;
        IsEntryWithoutExistingItem = false;
    } else if (ele.value === 'withoutexistingitem') {
        IsWithPo = false;
        IsEntryWithoutExistingItem = true;
    } else {
        IsWithPo = false;
        IsEntryWithoutExistingItem = false;
    }
    WithPO();
    GateEntry_applyLoadedInGoodsDescriptionAutoSuggestionState();
}
function WithPO() {
    if (IsWithPo ==true) {
        $('#frmLoadedIn_txtGoodsDescription').val('');
        $('#frmLoadedIn_txtQTY').val('0');
        $('#frmLoadedIn_txtUOM').val('');
        $('#RowfrmLoadedInQTYorUOM').hide();
        $('#RowfrmLoadedInGoodsDescription').hide();
        $('#RowfrmLoadedInddlPurchaseOrder').show();

        

        $('#RowfrmLoadedInPoItemGrid').show();
    } else {
        
        $('#frmLoadedIn_ddlPurchaseOrder').val('');

        $('#frmLoadedIn_txtGoodsDescription').val('');
        $('#frmLoadedIn_txtQTY').val('0');
        $('#frmLoadedIn_txtUOM').val('');
        $('#RowfrmLoadedInQTYorUOM').show();
        $('#RowfrmLoadedInGoodsDescription').show();
        $('#RowfrmLoadedInddlPurchaseOrder').hide();
        $('#RowfrmLoadedInPoItemGrid').hide();
    }
}
function GateEntry_BuildGridActionButtons(item) {
    const typeIn = item['Type In'].replace(' ', '');
    const code = item.Code;
    const godown = item.GodownMaster_Code;
    const attachName = `${item['Type In']} ${item['Entry No']} ${item['Vehicle No']} ${String(item['Date In Time'] || '').replace(/[:/]/g, '')} ${String(item['Date Out Time'] || '').replace(/[:/]/g, '')}`;
    const printBtn = `<a class="btn btn-info icon-height" onclick="GateEnty_PrintGateEntry(${code})" title="Print"> <i class="fa fa-print"></i></a>&nbsp;`;
    const attachBtn = `<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(${code},'${attachName.replace(/'/g, '\\\'')}')"> <i class="fa fa-paperclip"></i></a>&nbsp;`;

    if (item['Date Out Time'] !== '') {
        return printBtn + attachBtn
            + `<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry('form','${typeIn}editFull_${code}_${godown}')"> <i class="fa fa-pencil"></i></a>&nbsp;`
            + `<a class="btn btn-dark icon-height" onclick="GateEntyMode_GateEntry('form','${typeIn}view_${code}_${godown}')" ><i class="fa fa-eye"></i></a>`;
    }
    if (typeIn.toLowerCase() === 'loadedin') {
        return printBtn + attachBtn
            + `<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry('form','${typeIn}edit_${code}_${godown}')"> <i class="fa fa-pencil"></i></a>&nbsp;`
            + `<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry('form','${typeIn}emptyout_${code}_${godown}')" >Out</a>`;
    }
    return printBtn + attachBtn
        + `<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry('form','${typeIn}edit_${code}_${godown}')"> <i class="fa fa-pencil"></i></a>&nbsp;`
        + `<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry('form','${typeIn}loadedout_${code}_${godown}')" >Out</a>`;
}

function geEscapeHtml(value) {
    if (value == null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function gePickField(obj, keys, defaultValue) {
    if (!obj) return defaultValue || '';
    for (let i = 0; i < keys.length; i++) {
        const val = obj[keys[i]];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
            return val;
        }
    }
    return defaultValue || '';
}

function geFormatGateEntryDate(value) {
    if (!value) return '';
    try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-IN');
        }
    } catch (ex) { /* ignore */ }
    return String(value).slice(0, 10);
}

function geFormatGateEntryDateTime(dateValue, timeValue) {
    const datePart = geFormatGateEntryDate(dateValue);
    const timePart = timeValue ? String(timeValue).trim() : '';
    if (datePart && timePart) return `${datePart} ${timePart}`;
    return datePart || timePart || '';
}

function geGetCompanyLogoFileName(companyName) {
    const name = String(companyName || '').trim();
    if (!name) {
        return '';
    }

    const normalized = name.toLowerCase();
    if (normalized.includes('allianz')) {
        return 'allianzlog.jpeg';
    }
    if (normalized.includes('purshotam')) {
        return 'pppllog.jpeg';
    }

    const firstWord = name.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/)[0] || '';
    if (firstWord) {
        return `${firstWord.toLowerCase()}log.jpeg`;
    }

    return '';
}

function geGetGateEntryCompanyInfo(data) {
    let companyName = gePickField(data, ['CompanyName', 'companyName'], '');
    let companyAddress = gePickField(data, ['CompanyAddress', 'companyAddress'], '');
    try {
        const userDetails = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
        if (userDetails && userDetails[0]) {
            if (!companyName) {
                companyName = userDetails[0].CompanyName || userDetails[0].CompanyNameForShow || '';
            }
            if (!companyAddress) {
                companyAddress = userDetails[0].CompanyAddress || '';
            }
        }
    } catch (ex) { /* ignore */ }
    const logoFileName = geGetCompanyLogoFileName(companyName);
    const logoUrl = `${(sessionStorage.getItem('AppBaseURL') || '/').replace(/\/?$/, '/')}assets/images/${logoFileName}`;
    return { companyName, companyAddress, logoUrl };
}

function geGetGateEntryCreatedBy(data) {
    const fromApi = gePickField(data, ['CreatedBy', 'CreatedByName', 'UserName', 'UserID', 'createdBy'], '');
    if (fromApi) return fromApi;
    try {
        const userDetails = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
        if (userDetails && userDetails[0]) {
            return userDetails[0].UserID || userDetails[0].UserName || '';
        }
    } catch (ex) { /* ignore */ }
    return '';
}

function geIsImageFileName(fileName) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(String(fileName || ''));
}

function geBlobToDataUrl(blob) {
    return new Promise(function (resolve) {
        const reader = new FileReader();
        reader.onloadend = function () { resolve(reader.result || ''); };
        reader.onerror = function () { resolve(''); };
        reader.readAsDataURL(blob);
    });
}

function geBytesToDataUrl(bytes) {
    if (!bytes || !bytes.length) return '';
    try {
        const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
        let binary = '';
        for (let i = 0; i < arr.length; i++) {
            binary += String.fromCharCode(arr[i]);
        }
        return 'data:image/jpeg;base64,' + btoa(binary);
    } catch (ex) {
        return '';
    }
}

function geLoadAttachmentDataUrl(documentMasterCode) {
    return AttachmentControlService.DownloadAttachment(documentMasterCode)
        .then(function (blob) { return geBlobToDataUrl(blob); })
        .catch(function () { return ''; });
}

function geExtractImageFromGateEntryDetails(data) {
    const imageDetail = data.gateEntryImageDetail || data.GateEntryImageDetail;
    if (!Array.isArray(imageDetail) || imageDetail.length === 0) {
        return { inSrc: '', outSrc: '' };
    }

    let inSrc = '';
    let outSrc = '';
    imageDetail.forEach(function (imgRow, index) {
        const vehicleSrc = geBytesToDataUrl(imgRow.imgVehicle || imgRow.ImgVehicle || []);
        const materialSrc = geBytesToDataUrl(imgRow.imgMaterial || imgRow.ImgMaterial || []);
        const src = materialSrc || vehicleSrc;
        if (!src) return;
        if (index === 0 && !inSrc) {
            inSrc = src;
        } else if (!outSrc) {
            outSrc = src;
        } else if (!inSrc) {
            inSrc = src;
        }
    });
    return { inSrc, outSrc };
}

function geFetchGateEntryPhotoSources(code, data) {
    const fromDetails = geExtractImageFromGateEntryDetails(data);
    return AttachmentControlService.GetAttachmentUploadFiles('GateEntryMaster', code, '', 0)
        .then(function (response) {
            const list = Array.isArray(response) ? response.filter(function (item) {
                return geIsImageFileName(item.DocumentName);
            }) : [];

            let inAtt = null;
            let outAtt = null;
            list.forEach(function (att) {
                const text = `${att.DocumentParticulars || ''} ${att.DocumentName || ''}`.toLowerCase();
                if (!outAtt && (text.includes('out') || text.includes('loadedout') || text.includes('emptyout'))) {
                    outAtt = att;
                } else if (!inAtt && (text.includes('in') || text.includes('vehicle') || text.includes('goods') || text.includes('material'))) {
                    inAtt = att;
                }
            });

            if (!inAtt && list.length > 0) inAtt = list[0];
            if (!outAtt && list.length > 1) outAtt = list[1];

            const tasks = [];
            if (!fromDetails.inSrc && inAtt) {
                tasks.push(geLoadAttachmentDataUrl(inAtt.Code).then(function (src) { fromDetails.inSrc = src; }));
            }
            if (!fromDetails.outSrc && outAtt) {
                tasks.push(geLoadAttachmentDataUrl(outAtt.Code).then(function (src) { fromDetails.outSrc = src; }));
            }
            return Promise.all(tasks).then(function () { return fromDetails; });
        })
        .catch(function () { return fromDetails; });
}

function geIsBlankOutPrintValue(value) {
    if (value == null || value === undefined) {
        return true;
    }
    const text = String(value).trim();
    return text === '' || text === '0' || text === '00:00' || text.toLowerCase() === 'null';
}

function geIsGateEntryOutCompleted(data) {
    const dateOutTime = gePickField(data, ['Date Out Time'], '');
    const outNo = gePickField(data, ['Entry No OUT', 'GateEntryOutNo', 'gateEntryOutNo', 'OutEntryNo'], '');
    if (!geIsBlankOutPrintValue(dateOutTime) || !geIsBlankOutPrintValue(outNo)) {
        return true;
    }

    const outDate = gePickField(data, ['GateEntryOutDate'], '');
    const vehicleOutTime = gePickField(data, ['VehicleOutTime'], '');
    return !geIsBlankOutPrintValue(outDate) && !geIsBlankOutPrintValue(vehicleOutTime);
}

function geGetGateEntryOutDateTime(data) {
    if (!geIsGateEntryOutCompleted(data)) {
        return '';
    }

    const gridDateOutTime = gePickField(data, ['Date Out Time'], '');
    if (!geIsBlankOutPrintValue(gridDateOutTime)) {
        return gridDateOutTime;
    }

    return geFormatGateEntryDateTime(data.GateEntryOutDate, data.VehicleOutTime);
}

function geGetGateEntryVehicleOutTime(data) {
    if (!geIsGateEntryOutCompleted(data)) {
        return '';
    }

    const gridDateOutTime = gePickField(data, ['Date Out Time'], '');
    if (!geIsBlankOutPrintValue(gridDateOutTime)) {
        const parts = String(gridDateOutTime).trim().split(/\s+/);
        if (parts.length > 1) {
            return parts.slice(1).join(' ');
        }
    }

    const vehicleOutTime = gePickField(data, ['VehicleOutTime'], '');
    return geIsBlankOutPrintValue(vehicleOutTime) ? '' : vehicleOutTime;
}

function geFormatVehicleWeight(value) {
    if (value == null || value === undefined || String(value).trim() === '') {
        return '';
    }
    const num = parseFloat(String(value).replace(/,/g, ''));
    if (isNaN(num) || num === 0) {
        return '';
    }
    return num.toFixed(2);
}

function geGetGateEntryInVehicleWeight(data, isLoadedIn) {
    const weight = isLoadedIn
        ? gePickField(data, ['LoadedWeight', 'loadedWeight'], '')
        : gePickField(data, ['EmptyWeight', 'emptyWeight'], '');
    return geFormatVehicleWeight(weight);
}

function geGetGateEntryOutVehicleWeight(data, isLoadedIn) {
    if (!geIsGateEntryOutCompleted(data)) {
        return '';
    }
    const weight = isLoadedIn
        ? gePickField(data, ['EmptyWeight', 'emptyWeight'], '')
        : gePickField(data, ['LoadedWeight', 'loadedWeight'], '');
    return geFormatVehicleWeight(weight);
}

function geGetGateEntryNetWeight(data) {
    if (!geIsGateEntryOutCompleted(data)) {
        return '';
    }
    return geFormatVehicleWeight(gePickField(data, ['NetWeight', 'netWeight'], ''));
}

function geFindGateEntryGridRow(code) {
    if (!Array.isArray(ExcelExportDataArry) || ExcelExportDataArry.length === 0) {
        return null;
    }
    const entryCode = parseInt(String(code), 10);
    return ExcelExportDataArry.find(function (row) {
        return parseInt(String(row.Code), 10) === entryCode;
    }) || null;
}

function geMergeGateEntryPrintData(detailsRow, gridRow) {
    const merged = Object.assign({}, detailsRow || {});
    if (!gridRow) {
        return merged;
    }

    if (!gePickField(merged, ['GateEntryNo', 'Entry No IN', 'Entry No', 'gateEntryNo'], '')) {
        merged.GateEntryNo = gridRow['Entry No IN'] || gridRow['Entry No'] || gridRow.GateEntryNo;
        merged['Entry No IN'] = merged.GateEntryNo;
    }
    if (!gePickField(merged, ['GateEntryOutNo', 'Entry No OUT', 'gateEntryOutNo', 'OutEntryNo'], '')) {
        merged.GateEntryOutNo = gridRow['Entry No OUT'] || gridRow.GateEntryOutNo || gridRow.OutEntryNo;
        merged['Entry No OUT'] = merged.GateEntryOutNo;
    } else if (gridRow['Entry No OUT']) {
        merged.GateEntryOutNo = gridRow['Entry No OUT'];
        merged['Entry No OUT'] = gridRow['Entry No OUT'];
    }
    merged['Date Out Time'] = gridRow['Date Out Time'] || merged['Date Out Time'] || '';
    if (geIsBlankOutPrintValue(gridRow['Date Out Time']) && geIsBlankOutPrintValue(gridRow['Entry No OUT'])) {
        merged['Entry No OUT'] = '';
        merged.GateEntryOutNo = '';
        merged['Date Out Time'] = '';
        merged.GateEntryOutDate = '';
        merged.VehicleOutTime = '';
    }
    if (!gePickField(merged, ['Type In', 'TypeIn'], '')) {
        merged['Type In'] = gridRow['Type In'];
    }
    if (!gePickField(merged, ['TransactionType', 'transactionType'], '')) {
        merged.TransactionType = gridRow.TransactionType;
    }
    if (!gePickField(merged, ['GoodDescription', 'Good Desp', 'goodDescription', 'goodDesc'], '')) {
        merged.GoodDescription = gridRow['Good Desp'] || gridRow.GoodDescription;
        merged['Good Desp'] = merged.GoodDescription;
    } else if (gridRow['Good Desp']) {
        merged.GoodDescription = gridRow['Good Desp'];
        merged['Good Desp'] = gridRow['Good Desp'];
    }
    if (!gePickField(merged, ['Qty', 'qty'], '')) {
        merged.Qty = gridRow.Qty;
    }
    if (!gePickField(merged, ['UOM', 'Uom'], '')) {
        merged.UOM = gridRow.UOM;
    }
    if (!gePickField(merged, ['VendorName', 'Party name'], '')) {
        merged.VendorName = gridRow['Party name'] || gridRow.VendorName;
    }
    if (!gePickField(merged, ['DocumentType', 'Doc Type'], '')) {
        merged.DocumentType = gridRow['Doc Type'] || gridRow.DocumentType;
    }
    if (!gePickField(merged, ['DocNo', 'Doc No'], '')) {
        merged.DocNo = gridRow['Doc No'] || gridRow.DocNo;
    }
    if (!gePickField(merged, ['PurchaseOrderMaster_Code', 'purchaseOrderMaster_Code'], '')) {
        merged.PurchaseOrderMaster_Code = gridRow.PurchaseOrderMaster_Code || gridRow.purchaseOrderMaster_Code;
    }
    if (!gePickField(merged, ['PONo', 'PO No'], '')) {
        merged.PONo = gridRow['PO No'] || gridRow.PONo || gridRow.PONumber;
    }
    return merged;
}

function geGetGateEntryOutNo(data) {
    if (!geIsGateEntryOutCompleted(data)) {
        return '';
    }
    return gePickField(data, [
        'GateEntryOutNo',
        'gateEntryOutNo',
        'Entry No OUT',
        'EntryNoOut',
        'OutEntryNo',
        'GateEntryNoOut',
        'Out Gate Entry No'
    ], '');
}

function geResolveGateEntryPONo(data, poItems, pendingPoList) {
    let poNo = gePickField(data, ['PONo', 'PO No', 'PONumber', 'PurchaseOrderNo', 'poNo'], '');
    if (poNo) {
        return poNo;
    }

    if (Array.isArray(poItems) && poItems.length > 0) {
        poNo = gePickField(poItems[0], ['PONo', 'PO No', 'PONumber', 'Purchase Order No'], '');
        if (poNo) {
            return poNo;
        }
    }

    const poCode = parseInt(gePickField(data, ['PurchaseOrderMaster_Code', 'purchaseOrderMaster_Code'], 0), 10);
    if (poCode > 0) {
        const poList = Array.isArray(pendingPoList) && pendingPoList.length > 0
            ? pendingPoList
            : (Array.isArray(G_PendingPONOList) ? G_PendingPONOList : []);
        const found = poList.find(function (item) {
            return parseInt(item.PurchaseOrderMaster_Code, 10) === poCode;
        });
        if (found && found.PONo) {
            return found.PONo;
        }
    }

    return '';
}

function geIsGateEntryWithPO(data, poItems) {
    const poCode = parseInt(gePickField(data, ['PurchaseOrderMaster_Code', 'purchaseOrderMaster_Code'], 0), 10);
    if (poCode > 0) {
        return true;
    }
    if (geResolveGateEntryPONo(data, poItems)) {
        return true;
    }
    return Array.isArray(poItems) && poItems.length > 0;
}

function geBuildGateEntryItemRows(data, poItems) {
    const transactionType = String(gePickField(data, ['TransactionType', 'transactionType'], 'LIN')).toUpperCase();
    const rows = [];

    if (Array.isArray(poItems) && poItems.length > 0) {
        poItems.forEach(function (item) {
            rows.push({
                itemName: gePickField(item, ['Item Name', 'ItemName', 'Product', 'GoodDescription', 'Good Desp'], ''),
                specification: gePickField(item, ['Specification', 'ItemSpecificationDesp', 'Size Description'], ''),
                billQty: gePickField(item, [
                    'BILLED QTY', 'BiLLED QTY', 'Bill Qty', 'Bill QTY', 'BILL QTY',
                    'Qty', 'Billed Qty', 'Recv Qty', 'RECV QTY', 'Received Qty'
                ], ''),
                uom: gePickField(item, ['UOM', 'Uom', 'Unit'], '')
            });
        });
        return rows;
    }

    const itemName = gePickField(data, ['GoodDescription', 'Good Desp', 'goodDescription', 'goodDesc'], '');
    const billQty = gePickField(data, ['Qty', 'qty'], '');
    const uom = gePickField(data, ['UOM', 'Uom'], '');
    if (itemName || billQty || uom) {
        rows.push({
            itemName: itemName,
            specification: '',
            billQty: billQty,
            uom: uom
        });
    } else if (transactionType === 'EIN' && gePickField(data, ['GateEntryOutDate'], '')) {
        rows.push({
            itemName: '-',
            specification: '-',
            billQty: '-',
            uom: '-'
        });
    }
    return rows;
}

function geBuildGateEntryPrintHtml(data, poItems, photos, pendingPoList) {
    const company = geGetGateEntryCompanyInfo(data);
    const transactionType = String(gePickField(data, ['TransactionType', 'transactionType'], '')).toUpperCase();
    const typeInDesp = String(gePickField(data, ['Type In', 'TypeIn'], '')).replace(/\s/g, '').toLowerCase();
    const isLoadedIn = transactionType === 'LIN' || typeInDesp === 'loadedin';
    const entryTypeLabel = isLoadedIn ? 'Loaded IN' : 'Empty IN';
    const inPhotoLabel = isLoadedIn ? 'Loaded In photos' : 'Empty In photos';
    const outPhotoLabel = isLoadedIn ? 'Empty Out Photos' : 'Loaded Out Photos';

    const withPO = geIsGateEntryWithPO(data, poItems);
    const poNo = geResolveGateEntryPONo(data, poItems, pendingPoList);
    const withoutExistingItem =
        gePickField(data, ['EntryWithOutExistingItem', 'entryWithOutExistingItem'], '') === 'Y' ||
        gePickField(data, ['EntryWithOutExistingItem', 'entryWithOutExistingItem'], '') === true ||
        String(gePickField(data, ['EntryWithOutExistingItem', 'entryWithOutExistingItem'], '')).toUpperCase() === 'Y';
    const withoutPO = !withPO && !withoutExistingItem;
    const poAccessHtml = isLoadedIn
        ? `<strong>With PO</strong> ${withPO ? 'Y' : 'N'} &nbsp;&nbsp;
           <strong>W/O PO</strong> ${withoutPO ? 'Y' : 'N'} &nbsp;&nbsp;
           <strong>W/O Existing Item</strong> ${withoutExistingItem ? 'Y' : 'N'}`
        : '';
    const itemRows = geBuildGateEntryItemRows(data, poItems);
    const itemRowsHtml = itemRows.length > 0
        ? itemRows.map(function (row) {
            return `<tr>
                <td>${geEscapeHtml(row.itemName)}</td>
                <td>${geEscapeHtml(row.specification)}</td>
                <td style="text-align:center;">${geEscapeHtml(row.billQty)}</td>
                <td style="text-align:center;">${geEscapeHtml(row.uom)}</td>
            </tr>`;
        }).join('')
        : `<tr><td colspan="4" style="text-align:center;color:#666;">No item details</td></tr>`;
    const vehicleRowHtml = isLoadedIn
        ? `<tr>
                    <td colspan="2" style="border:1px solid #000;padding:6px 10px;"><strong>Vehicle No.</strong><br>${geEscapeHtml(gePickField(data, ['VehicleNo', 'Vehicle No'], ''))}</td>
                    <td colspan="2" style="border:1px solid #000;padding:6px 10px;">${poAccessHtml}</td>
                </tr>`
        : `<tr>
                    <td colspan="4" style="border:1px solid #000;padding:6px 10px;"><strong>Vehicle No.</strong><br>${geEscapeHtml(gePickField(data, ['VehicleNo', 'Vehicle No'], ''))}</td>
                </tr>`;
    const poNoRowHtml = isLoadedIn && withPO
        ? `<tr>
                    <td colspan="4" style="border:1px solid #000;padding:6px 10px;"><strong>PO No.</strong><br>${geEscapeHtml(poNo)}</td>
                </tr>`
        : '';
    const itemTableHtml = `<tr>
                    <td colspan="4" style="border:1px solid #000;padding:0;">
                        <table class="ge-item-table" style="width:100%;border-collapse:collapse;">
                            <thead>
                                <tr>
                                    <th style="border:1px solid #000;padding:6px;text-align:left;">Item name</th>
                                    <th style="border:1px solid #000;padding:6px;text-align:left;">Specification</th>
                                    <th style="border:1px solid #000;padding:6px;text-align:center;width:90px;">Bill Qty</th>
                                    <th style="border:1px solid #000;padding:6px;text-align:center;width:70px;">UOM</th>
                                </tr>
                            </thead>
                            <tbody>${itemRowsHtml}</tbody>
                        </table>
                    </td>
                </tr>`;

    const inPhotoHtml = photos.inSrc
        ? `<img src="${photos.inSrc}" alt="${geEscapeHtml(inPhotoLabel)}" style="max-width:100%;max-height:220px;object-fit:contain;" />`
        : `<div class="photo-placeholder">No photo</div>`;
    const outPhotoHtml = photos.outSrc
        ? `<img src="${photos.outSrc}" alt="${geEscapeHtml(outPhotoLabel)}" style="max-width:100%;max-height:220px;object-fit:contain;" />`
        : `<div class="photo-placeholder">No photo</div>`;

    const gateEntryNo = gePickField(data, ['GateEntryNo', 'Entry No IN', 'Entry No', 'gateEntryNo'], '');
    const gateEntryOutNo = geGetGateEntryOutNo(data);
    const gateEntryInDateTime = geFormatGateEntryDateTime(data.GateEntryDate, data.TimeIO);
    const gateEntryOutDateTime = geGetGateEntryOutDateTime(data);
    const vehicleInTime = gePickField(data, ['TimeIO', 'VehicleInTime'], '');
    const vehicleOutTime = geGetGateEntryVehicleOutTime(data);
    const isOutCompleted = geIsGateEntryOutCompleted(data);
    const vehicleInWeight = geGetGateEntryInVehicleWeight(data, isLoadedIn);
    const vehicleOutWeight = geGetGateEntryOutVehicleWeight(data, isLoadedIn);
    const netWeight = geGetGateEntryNetWeight(data);
    const inWeightLabel = isLoadedIn ? 'Vehicle Loaded Weight (KG)' : 'Vehicle Empty Weight (KG)';
    const outWeightLabel = isLoadedIn ? 'Vehicle Empty Weight (KG)' : 'Vehicle Loaded Weight (KG)';
    const outPhotoDisplayHtml = isOutCompleted ? outPhotoHtml : `<div class="photo-placeholder">-</div>`;
    const netWeightHtml = netWeight
        ? `<div style="margin-top:6px;"><strong>Net Weight (KG)</strong><br>${geEscapeHtml(netWeight)}</div>`
        : '';
    return `
        <div class="ge-print-wrap">
            <table class="ge-print-table">
                <tr>
                    <td class="logo-cell" rowspan="2" style="width:120px;border:1px solid #000;text-align:center;vertical-align:middle;">
                        <img src="${company.logoUrl}" alt="Logo" style="max-width:100px;max-height:70px;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
                        <div style="display:none;font-weight:bold;">LOGO</div>
                    </td>
                    <td colspan="3" style="border:1px solid #000;text-align:center;font-size:20px;font-weight:bold;padding:8px;">
                        ${geEscapeHtml(company.companyName || 'Company Name')}
                    </td>
                </tr>
                <tr>
                    <td colspan="3" style="border:1px solid #000;padding:6px 10px;">
                        <strong>Address:</strong> ${geEscapeHtml(company.companyAddress)}
                    </td>
                </tr>
                <tr>
                    <td colspan="4" style="border:1px solid #000;padding:6px 10px;font-weight:bold;background:#f5f5f5;">
                        Gate Entry Print &mdash; 
                    </td>
                </tr>
                <tr>
                    <td style="border:1px solid #000;padding:6px 10px;width:25%;"><strong>Gate entry no</strong><br>${geEscapeHtml(gateEntryNo)}</td>
                    <td style="border:1px solid #000;padding:6px 10px;width:25%;"><strong>Gate entry Date and time</strong><br>${geEscapeHtml(gateEntryInDateTime)}</td>
                    <td style="border:1px solid #000;padding:6px 10px;width:25%;"><strong>OUT entry no</strong><br>${geEscapeHtml(gateEntryOutNo)}</td>
                    <td style="border:1px solid #000;padding:6px 10px;width:25%;"><strong>Out entry Date and time</strong><br>${geEscapeHtml(gateEntryOutDateTime)}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #000;padding:6px 10px;"><strong>Driver no</strong><br>${geEscapeHtml(gePickField(data, ['DriverMobile', 'Driver No'], ''))}</td>
                    <td colspan="3" style="border:1px solid #000;padding:6px 10px;"><strong>Driver Name</strong><br>${geEscapeHtml(gePickField(data, ['DriverName'], ''))}</td>
                </tr>
                <tr>
                    <td colspan="2" style="border:1px solid #000;padding:6px 10px;"><strong>Transporter name</strong><br>${geEscapeHtml(gePickField(data, ['OtherTransporterName', 'Transporter Name'], ''))}</td>
                    <td colspan="2" style="border:1px solid #000;padding:6px 10px;"><strong>Vendor name</strong><br>${geEscapeHtml(gePickField(data, ['VendorName', 'Party name'], ''))}</td>
                </tr>
                <tr>
                    <td colspan="2" style="border:1px solid #000;padding:6px 10px;"><strong>Document type</strong><br>${geEscapeHtml(gePickField(data, ['DocumentType', 'Doc Type'], ''))}</td>
                    <td colspan="2" style="border:1px solid #000;padding:6px 10px;"><strong>Document No.</strong><br>${geEscapeHtml(gePickField(data, ['DocNo', 'Doc No'], ''))}</td>
                </tr>
                ${vehicleRowHtml}
                ${poNoRowHtml}
                ${itemTableHtml}
                <tr>
                    <td colspan="2" style="border:1px solid #000;padding:8px;text-align:center;vertical-align:top;">
                        <div style="font-weight:bold;margin-bottom:8px;">${geEscapeHtml(inPhotoLabel)}</div>
                        <div class="photo-box">${inPhotoHtml}</div>
                        <div style="margin-top:8px;"><strong>Vehicle IN time</strong><br>${geEscapeHtml(vehicleInTime)}</div>
                        <div style="margin-top:6px;"><strong>${geEscapeHtml(inWeightLabel)}</strong><br>${geEscapeHtml(vehicleInWeight)}</div>
                    </td>
                    <td colspan="2" style="border:1px solid #000;padding:8px;text-align:center;vertical-align:top;">
                        <div style="font-weight:bold;margin-bottom:8px;">${geEscapeHtml(outPhotoLabel)}</div>
                        <div class="photo-box">${outPhotoDisplayHtml}</div>
                        <div style="margin-top:8px;"><strong>Vehicle Out time</strong><br>${geEscapeHtml(vehicleOutTime)}</div>
                        <div style="margin-top:6px;"><strong>${geEscapeHtml(outWeightLabel)}</strong><br>${geEscapeHtml(vehicleOutWeight)}</div>
                        ${netWeightHtml}
                    </td>
                </tr>
                <tr>
                    <td colspan="4" style="border:1px solid #000;padding:8px 10px;">
                        <strong>Created By:</strong> ${geEscapeHtml(geGetGateEntryCreatedBy(data))}
                    </td>
                </tr>
            </table>
        </div>
    `;
}

function geOpenGateEntryPrintWindow(html, title) {
    const printWindow = window.open('', '_blank', 'width=980,height=760,scrollbars=yes');
    if (!printWindow) {
        toastr.error('Please allow pop-ups for this site');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${geEscapeHtml(title)}</title>
            <style>
                @media print {
                    body { margin: 0; padding: 8mm; }
                    @page { size: A4; margin: 8mm; }
                }
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 12px;
                    color: #000;
                }
                .ge-print-wrap {
                    max-width: 900px;
                    margin: 0 auto;
                }
                .ge-print-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }
                .ge-item-table th,
                .ge-item-table td {
                    font-size: 12px;
                }
                .photo-box {
                    min-height: 180px;
                    border: 1px solid #999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8px;
                    background: #fafafa;
                }
                .photo-placeholder {
                    color: #777;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            ${html}
            <script>
                window.onload = function() {
                    window.focus();
                    setTimeout(function() { window.print(); }, 400);
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function GateEnty_PrintGateEntry(Code) {
    Showloader();
    GateEntryService.GetGateEntryDetails(Code).then(function (response) {
        if (!response || response.length === 0) {
            HideLoader();
            toastr.error('No data found for this gate entry');
            return;
        }

        const data = geMergeGateEntryPrintData(response[0], geFindGateEntryGridRow(Code));
        const isLoadedInEntry =
            String(gePickField(data, ['TransactionType', 'transactionType'], '')).toUpperCase() === 'LIN' ||
            String(gePickField(data, ['Type In', 'TypeIn'], '')).replace(/\s/g, '').toLowerCase() === 'loadedin';
        const poDetailPromise = isLoadedInEntry
            ? GateEntryService.getPODetailByGateEntryCode(Code).catch(function () { return []; })
            : Promise.resolve([]);
        const pendingPoPromise = isLoadedInEntry
            ? GateEntryService.GetPendingPONO().catch(function () { return G_PendingPONOList || []; })
            : Promise.resolve(G_PendingPONOList || []);

        return Promise.all([poDetailPromise, geFetchGateEntryPhotoSources(Code, data), pendingPoPromise]).then(function (results) {
            const poItemsRaw = results[0];
            const poItems = Array.isArray(poItemsRaw) ? poItemsRaw : (poItemsRaw && Array.isArray(poItemsRaw.data) ? poItemsRaw.data : []);
            if (poItems.length > 0 && !gePickField(data, ['PurchaseOrderMaster_Code', 'purchaseOrderMaster_Code'], '')) {
                data.PurchaseOrderMaster_Code = gePickField(poItems[0], ['PurchaseOrderMaster_Code', 'purchaseOrderMaster_Code'], '');
            }
            const photos = results[1] || { inSrc: '', outSrc: '' };
            const pendingPoList = Array.isArray(results[2]) ? results[2] : [];
            const entryNo = gePickField(data, ['GateEntryNo', 'Entry No IN', 'Entry No'], Code);
            const html = geBuildGateEntryPrintHtml(data, poItems, photos, pendingPoList);
            geOpenGateEntryPrintWindow(html, `Gate Entry - ${entryNo}`);
        });
    }).catch(function (error) {
        console.error('Gate entry print error:', error);
        toastr.error('Failed to load gate entry for print');
    }).finally(function () {
        HideLoader();
    });
}

function PrintGateEntry(GateEntyMaster_Code) {
    GateEnty_PrintGateEntry(GateEntyMaster_Code);
}
function GateEntry_SaveData(Mode) {
    let valid = true;
    let NetWeight = 0;
    let Remark = '';
    let Time = ''//`${this.hours}:${this.minutes}`;
    let InvoiceDate = null;
    let InvoiceNo = '';
    let Qty = 0;
    let DriverName = '';
    let VehicleNo = '';
    let DriverMobile = '';
    let Uom = '';
    let TransporterName = '';
    
    let EmptyWeight = 0;
    let LoadedWeight = 0;
    let EmptyWeightDateTime = null;
    let LoadedWeightDateTime = null;
    let PurchaseOrderMaster_Code = 0;
    let VehicleOutTime = '';
    let GateEntryOutDate = null;
    let WeightmentSlipNumberIn = '';
    let WeightmentSlipNumberOut = '';
    let GoodDescription = '';
    let VendorName = '';
    let Documenttype = '';
    let EwaybillNo = '';
    let EwaybillDate = null;
    let ReportingDatetime = null;
    let POItemsData = "";
    let OutRemarks = "";
    let ChassisNo = "";
    let RCNo = "";
    let RCExpiredDate = "";
    let DriverLicenseNo = "";
    let DriverLicenseExpiredDate = "";
    let DriverAadharNo = "";
    let TokenNo = "";
    let OutType = "";
 
    let OutReason = "";
    let ManualDocNo = "";
    let GRNo = "";

    let RejectEntry = 'N';
    let ModeOfTransportation = '';

    if (Mode === 'EmptyInSave' || Mode === 'emptyinedit') {
        let PhotoLenth = 0;
        Time = $('#frmEmptyIn_txtVehicleInTime').val();
        if (GateEntry_IsModeOfTransportEnabled()) {
            ModeOfTransportation = $('#frmEmptyIn_txtModeOfTransportation').val() || '';
            if (!ModeOfTransportation || ModeOfTransportation === '') {
                valid = false;
                toastr.error('Please Check! Mode Of Transportation can not be blank');
                $('#frmEmptyIn_txtModeOfTransportation').focus();
                return;
            }
        } else {
            ModeOfTransportation = '';
        }
        const relaxHandCourierEmptyIn = GateEntry_IsModeOfTransportEnabled() && GateEntry_IsByHandOrCourierFromSelect($('#frmEmptyIn_txtModeOfTransportation'));
        VehicleNo = $('#frmEmptyIn_txtVehicleNo').val();
        DriverName = $('#frmEmptyIn_txtDriverName').val();
        DriverMobile = $('#frmEmptyIn_txtDriverNo').val();
        TransporterName = $('#frmEmptyIn_ddlTransporterName').val();
        Remark = $('#frmEmptyIn_txtRemarks').val();
        PhotoLenth = $('#frmEmptyIn_fileVehiclePhoto')[0].files.length;
        if (PhotoLenth === 0 && (G_ScaleVehiclePhotoProvided || (GateEntryImageDetail && GateEntryImageDetail[0] && GateEntryImageDetail[0].imgVehicle && GateEntryImageDetail[0].imgVehicle.length > 0))) { PhotoLenth = 1; }

        
        if (!relaxHandCourierEmptyIn && (typeof VehicleNo === 'undefined' || VehicleNo === '' || VehicleNo === null)) {
            valid = false;
            toastr.error('Please Check! Vehicle No can not be blank');
            $('#frmEmptyIn_txtVehicleNo').focus();
            return;
        }
        if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
            ChassisNo = $('#frmEmptyIn_txtChassisNo').val();
            RCNo = $('#frmEmptyIn_txtRCNo').val();
            RCExpiredDate = $('#frmEmptyIn_txtRCExpiredDate').val();
            DriverLicenseNo = $('#frmEmptyIn_txtDriverLicenseNo').val();
            DriverLicenseExpiredDate = $('#frmEmptyIn_txtDriverLicenseExpiredDate').val();
            DriverAadharNo = $('#frmEmptyIn_txtDriverAadharNo').val();

            if (typeof ChassisNo === 'undefined' || ChassisNo === '' || ChassisNo === null) {
                valid = false;
                toastr.error('Please Check! Chassis No can not be blank');
                $('#frmEmptyIn_txtChassisNo').focus();
                return;
            }
            if (typeof RCNo === 'undefined' || RCNo === '' || RCNo === null) {
                valid = false;
                toastr.error('Please Check! RC No can not be blank');
                $('#frmEmptyIn_txtRCNo').focus();
                return;
            }
            if (typeof RCExpiredDate === 'undefined' || RCExpiredDate === '' || RCExpiredDate === null) {
                valid = false;
                toastr.error('Please Check! RC Expired Date can not be blank');
                $('#frmEmptyIn_txtRCExpiredDate').focus();
                return;
            }
            if (typeof DriverLicenseNo === 'undefined' || DriverLicenseNo === '' || DriverLicenseNo === null) {
                valid = false;
                toastr.error('Please Check! Driver License No can not be blank');
                $('#frmEmptyIn_txtDriverLicenseNo').focus();
                return;
            }
            if (typeof DriverLicenseExpiredDate === 'undefined' || DriverLicenseExpiredDate === '' || DriverLicenseExpiredDate === null) {
                valid = false;
                toastr.error('Please Check! Driver License Expired Date can not be blank');
                $('#frmEmptyIn_txtDriverLicenseExpiredDate').focus();
                return;
            }
            
        }

        if (!relaxHandCourierEmptyIn && (typeof DriverName === 'undefined' || DriverName === '' || DriverName === null)) {
            valid = false;
            toastr.error('Please Check! Driver Name can not be blank');
            $('#frmEmptyIn_txtDriverName').focus();
            return;
        }
        if (!relaxHandCourierEmptyIn && (typeof DriverMobile === 'undefined' || DriverMobile === '' || DriverMobile === null)) {
            valid = false;
            toastr.error('Please Check! Driver No. can not be blank');
            $('#frmEmptyIn_txtDriverNo').focus();
            return;
        }
        if (!relaxHandCourierEmptyIn && BizSolInputControl.IsMobileNumber(DriverMobile) == false) {
            valid = false;
            toastr.error('Please enter valid mobile number.');
            $('#frmEmptyIn_txtDriverNo').focus();
            return;

        }
        if (!relaxHandCourierEmptyIn && (typeof TransporterName === 'undefined' || TransporterName === '' || TransporterName === null)) {
            valid = false;
            toastr.error('Please Check! Transporter Name can not be blank');
            $('#frmEmptyIn_ddlTransporterName').focus();
            return;
        }

        if (!relaxHandCourierEmptyIn && ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
            EmptyWeight = $('#frmEmptyIn_txtVehicleEmptyWeight').val();
            WeightmentSlipNumberIn = $('#frmEmptyIn_txtWeightmentSlipNoEmpty').val();

            if (typeof EmptyWeight === 'undefined' || EmptyWeight === '' || EmptyWeight === null) {
                valid = false;
                toastr.error('Please Check! Vehicle Empty Weight can not be blank');
                $('#frmEmptyIn_txtVehicleEmptyWeight').focus();
                return;
            }
            if (typeof WeightmentSlipNumberIn === 'undefined' || WeightmentSlipNumberIn === '' || WeightmentSlipNumberIn === null) {
                valid = false;
                toastr.error('Please Check! Weightment Slip No can not be blank');
                $('#frmEmptyIn_txtWeightmentSlipNoEmpty').focus();
                return;
            }
        } else if (relaxHandCourierEmptyIn && ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
            EmptyWeight = $('#frmEmptyIn_txtVehicleEmptyWeight').val();
            WeightmentSlipNumberIn = $('#frmEmptyIn_txtWeightmentSlipNoEmpty').val();
        }

        if (Mode === 'EmptyInSave' && !relaxHandCourierEmptyIn && (typeof PhotoLenth === 'undefined' || PhotoLenth === 0)) {
            valid = false;
            toastr.error('Please Check! Vehicle Photo can not be blank');
            $('#frmEmptyIn_fileVehiclePhoto').focus();
            return;
        }

        if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'TokenApplicable').PerameterValue === 'Y') {
            
        }
        else if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'ReportingDatetimeApplicable').PerameterValue === 'Y') {
            ReportingDatetime = $('#frmEmptyIn_txtReportingDatetime').val();

            if (typeof ReportingDatetime === 'undefined' || ReportingDatetime === '' || ReportingDatetime === null) {
                valid = false;
                toastr.error('Please Check! Reporting Date time can not be blank');
                $('#frmEmptyIn_txtReportingDatetime').focus();
                return;
            }
        }

    }
    else if (Mode === 'UpdateEmptyInSave' || Mode ==='emptyineditfull') {
        Time = $('#frmEmptyIn_txtVehicleInTime').val();
        VehicleNo = $('#frmEmptyIn_txtVehicleNo').val();
        DriverName = $('#frmEmptyIn_txtDriverName').val();
        DriverMobile = $('#frmEmptyIn_txtDriverNo').val();
        TransporterName = $('#frmEmptyIn_ddlTransporterName').val();
        Remark = $('#frmEmptyIn_txtRemarks').val();
        ReportingDatetime = $('#frmEmptyIn_txtReportingDatetime').val();
        EmptyWeight = $('#frmEmptyIn_txtVehicleEmptyWeight').val();
        WeightmentSlipNumberIn = $('#frmEmptyIn_txtWeightmentSlipNoEmpty').val();

        if (GateEntry_IsModeOfTransportEnabled()) {
            ModeOfTransportation = $('#frmEmptyIn_txtModeOfTransportation').val() || '';
            if (!ModeOfTransportation || ModeOfTransportation === '') {
                valid = false;
                toastr.error('Please Check! Mode Of Transportation can not be blank');
                $('#frmEmptyIn_txtModeOfTransportation').focus();
                return;
            }
        } else {
            ModeOfTransportation = '';
        }
        const relaxHandCourierLoadedOut = GateEntry_IsModeOfTransportEnabled() && GateEntry_IsByHandOrCourierFromSelect($('#frmEmptyIn_txtModeOfTransportation'));

        GateEntryOutDate = $('#frmLoadedOut_txtDateOut').val();
        VehicleOutTime = $('#frmLoadedOut_txtVehicleOutTime').val();

        GoodDescription = $('#frmLoadedOut_txtGoodsDescription').val();
        Qty = $('#frmLoadedOut_txtQty').val();
        Uom = $('#frmLoadedOut_ddlUOM').val();
        VendorName = $('#frmLoadedOut_txtCustomerName').val();
        Documenttype = $('#frmLoadedOut_ddlDocumentType').val();
        InvoiceNo = $('#frmLoadedOut_txtDocumentNo').val();
        InvoiceDate = $('#frmLoadedOut_txtDocumentDate').val();
        EwaybillNo = $('#frmLoadedOut_txtEWayBillNo').val();
        EwaybillDate = $('#frmLoadedOut_txtEWayBillDate').val();
        OutRemarks = $('#frmLoadedOut_txtRemarks').val();

        OutType = $('#frmLoadedOut_ddlOutType').val();
        OutReason = $('#frmLoadedOut_txtOutReason').val();
        ManualDocNo = $('#frmLoadedOut_txtManualDocNo').val();
        GRNo = $('#frmLoadedOut_txtGRNo').val();
   
        if (OutType=='EOUT') {
            RejectEntry = 'Y';
        }

        let isOthersDocument = Documenttype && Documenttype.toLowerCase() === 'others';

        let VehiclePhotoLenth = $('#frmLoadedOut_fileVehiclePhoto')[0].files.length;
        if (VehiclePhotoLenth === 0 && (G_ScaleVehiclePhotoProvided || (GateEntryImageDetail && GateEntryImageDetail[0] && GateEntryImageDetail[0].imgVehicle && GateEntryImageDetail[0].imgVehicle.length > 0))) { VehiclePhotoLenth = 1; }
        let GoodsPhotoLenth = $('#frmLoadedOut_fileGoodsPhoto')[0].files.length;
        let InvoicePhotoLenth = $('#frmLoadedOut_fileInvoicePhoto')[0].files.length;
        //let OtherPhotoLenth = $('#frmLoadedOut_fileOtherPhoto')[0].files.length;
        
        if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
            ChassisNo = $('#frmEmptyIn_txtChassisNo').val();
            RCNo = $('#frmEmptyIn_txtRCNo').val();
            RCExpiredDate = $('#frmEmptyIn_txtRCExpiredDate').val();
            DriverLicenseNo = $('#frmEmptyIn_txtDriverLicenseNo').val();
            DriverLicenseExpiredDate = $('#frmEmptyIn_txtDriverLicenseExpiredDate').val();
            DriverAadharNo = $('#frmEmptyIn_txtDriverAadharNo').val();
        }

        if (!relaxHandCourierLoadedOut && ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
            LoadedWeight = $('#frmLoadedOut_txtVehicleLoadedWeight').val();
            WeightmentSlipNumberOut = $('#frmLoadedOut_txtWeightmentSlipNoLoadedOut').val();

            if (RejectEntry == 'N' && (typeof LoadedWeight === 'undefined' || LoadedWeight === '0' || LoadedWeight === '' || LoadedWeight === 0 || LoadedWeight === null)) {
                valid = false;
                toastr.error('Please Check! Vehicle Loaded Weight can not be blank or zero');
                $('#frmLoadedOut_txtVehicleLoadedWeight').focus();
                return;
            }
            if (RejectEntry == 'N' && (typeof WeightmentSlipNumberOut === 'undefined' || WeightmentSlipNumberOut === '' || WeightmentSlipNumberOut === null)) {
                valid = false;
                toastr.error('Please Check! Weightment Slip No. Loaded can not be blank');
                $('#frmLoadedOut_txtWeightmentSlipNoLoadedOut').focus();
                return;
            }
            NetWeight = LoadedWeight - EmptyWeight;
            $('#frmLoadedOut_txtNetWeightLoadedOut').val(parseFloat(NetWeight).toFixed(2));
            if (RejectEntry == 'N' && NetWeight < 0) {
                toastr.error('Please Check! vehicle loaded weight Should be greater than to vehicle empty weight');
                return;
            }
        } else if (relaxHandCourierLoadedOut && ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
            LoadedWeight = $('#frmLoadedOut_txtVehicleLoadedWeight').val();
            WeightmentSlipNumberOut = $('#frmLoadedOut_txtWeightmentSlipNoLoadedOut').val();
            const lw = parseFloat(LoadedWeight) || 0;
            const ew = parseFloat(EmptyWeight) || 0;
            NetWeight = lw - ew;
            $('#frmLoadedOut_txtNetWeightLoadedOut').val(parseFloat(NetWeight).toFixed(2));
        }
        if (RejectEntry == 'N' && Mode === 'UpdateEmptyInSave' && !relaxHandCourierLoadedOut && (typeof VehiclePhotoLenth === 'undefined' || VehiclePhotoLenth === 0)) {
            valid = false;
            toastr.error('Please Check! Vehicle Photo can not be blank');
            $('#frmLoadedOut_fileVehiclePhoto').focus();
            return;
        }
        if (isOthersDocument) {
            // Only driver name is mandatory for "Others" document type
            // Skip all other field validations
        } else {
            
            if (RejectEntry == 'N' && Mode === 'UpdateEmptyInSave' && (typeof GoodsPhotoLenth === 'undefined' || GoodsPhotoLenth === 0)) {
                valid = false;
                toastr.error('Please Check! Goods Photo can not be blank');
                $('#frmLoadedOut_fileGoodsPhoto').focus();
                return;
            }
            if (RejectEntry == 'N' && Mode === 'UpdateEmptyInSave' && (typeof InvoicePhotoLenth === 'undefined' || InvoicePhotoLenth === 0)) {
                valid = false;
                toastr.error('Please Check! Document Photo can not be blank');
                $('#frmLoadedOut_fileInvoicePhoto').focus();
                return;
            }

            if (RejectEntry == 'N' && (typeof GoodDescription === 'undefined' || GoodDescription === '' || GoodDescription === null)) {
                valid = false;
                toastr.error('Please Check! Goods Description can not be blank');
                $('#frmLoadedOut_txtGoodsDescription').focus();
                return;
            }
            if (RejectEntry == 'N' && (typeof Qty === 'undefined' || Qty === '0' || Qty === '' || Qty === 0 || Qty === null)) {
                valid = false;
                toastr.error('Please Check! Qty can not be blank or zero');
                $('#frmLoadedOut_txtQty').focus();
                return;
            }
            if (RejectEntry == 'N' && (typeof Uom === 'undefined' || Uom === '' || Uom === '0' || Uom === null)) {
                valid = false;
                toastr.error('Please Check! Uom can not be blank');
                $('#frmLoadedOut_ddlUOM').focus();
                return;
            }
            if (RejectEntry == 'N' && (typeof Documenttype === 'undefined' || Documenttype === '' || Documenttype === '0' || Documenttype === null)) {
                valid = false;
                toastr.error('Please Check! Document Type can not be blank');
                $('#frmLoadedOut_ddlDocumentType').focus();
                return;
            }

            if (RejectEntry == 'N' && (typeof VendorName === 'undefined' || VendorName === '' || VendorName === null)) {
                valid = false;
                toastr.error('Please Check! Customer Name can not be blank');
                $('#frmLoadedOut_txtCustomerName').focus();
                return;
            }


            if (RejectEntry == 'N' && (typeof InvoiceNo === 'undefined' || InvoiceNo === '' || InvoiceNo === null)) {
                valid = false;
                toastr.error('Please Check! Document No. can not be blank');
                $('#frmLoadedOut_txtDocumentNo').focus();
                return;
            }
            if (RejectEntry == 'N' && (typeof InvoiceDate === 'undefined' || InvoiceDate === '' || InvoiceDate === null)) {
                valid = false;
                toastr.error('Please Check! Document Date can not be blank');
                $('#frmLoadedOut_txtDocumentDate').focus();
                return;
            }

            if (RejectEntry === 'Y' && (typeof OutReason === 'undefined' || OutReason === '' || OutReason === null)) {
                valid = false;
                toastr.error('Please Check! Out Reason can not be blank');
                $('#frmLoadedOut_txtOutReason').focus();
                return;
            }

            // Net Weight vs Document Qty tolerance check (only for Loaded Out, not for Empty Out/Reject)
            if (RejectEntry == 'N') {
                const matchNetWeightParam = ConfigGateEntry.find(x => x.PerameterName === 'MatchNetWeightWithDocumentQty');
                if (matchNetWeightParam && String(matchNetWeightParam.PerameterValue).toUpperCase() === 'Y') {
                    const toleranceParam = ConfigGateEntry.find(x => x.PerameterName === 'ToleranceToMatchNetWeightWithDocumentQty');
                    const tolerancePct = toleranceParam ? (parseFloat(toleranceParam.PerameterValue) || 0) : 0;
                    const docQty = parseFloat($('#frmLoadedOut_txtQty').val()) || 0;
                    const lw = parseFloat($('#frmLoadedOut_txtVehicleLoadedWeight').val()) || 0;
                    const ew = parseFloat($('#frmEmptyIn_txtVehicleEmptyWeight').val()) || 0;
                    const netWt = lw - ew;
                    if (docQty > 0) {
                        const allowedDiff = (tolerancePct / 100) * docQty;
                        const minAllowed = docQty - allowedDiff;
                        const maxAllowed = docQty + allowedDiff;
                        if (netWt < minAllowed || netWt > maxAllowed) {
                            valid = false;
                            toastr.error(`Net Weight (${parseFloat(netWt).toFixed(2)}) does not match Document Qty (${docQty}) within tolerance of ${tolerancePct}%. Allowed range: ${parseFloat(minAllowed).toFixed(2)} - ${parseFloat(maxAllowed).toFixed(2)}`);
                            return;
                        }
                    }
                }
            }
        }
    }
    else if (Mode === 'LoadedInSave' || Mode ==='loadedinedit') {
        Time = $('#frmLoadedIn_txtVehicleInTime').val();
        if (GateEntry_IsModeOfTransportEnabled()) {
            ModeOfTransportation = $('#frmLoadedIn_txtModeOfTransportation').val() || '';
            if (!ModeOfTransportation || ModeOfTransportation === '') {
                valid = false;
                toastr.error('Please Check! Mode Of Transportation can not be blank');
                $('#frmLoadedIn_txtModeOfTransportation').focus();
                return;
            }
        } else {
            ModeOfTransportation = '';
        }
        const relaxHandCourierLoadedIn = GateEntry_IsModeOfTransportEnabled() && GateEntry_IsByHandOrCourierFromSelect($('#frmLoadedIn_txtModeOfTransportation'));
        VehicleNo = $('#frmLoadedIn_txtVehicleNo').val();
        DriverName = $('#frmLoadedIn_txtDriverName').val();
        DriverMobile = $('#frmLoadedIn_txtDriverNo').val();
        TransporterName = $('#frmLoadedIn_ddlTransporterName').val();
        
        ReportingDatetime = $('#frmLoadedIn_txtReportingDatetime').val();
        
        WeightmentSlipNumberIn = $('#frmLoadedIn_txtWeightmentSlipNoLoaded').val();
        GoodDescription = $('#frmLoadedIn_txtGoodsDescription').val();
        Qty = $('#frmLoadedIn_txtQTY').val();
        Uom = $('#frmLoadedIn_txtUOM').val();
        Documenttype = $('#frmLoadedIn_ddlDocumentType').val();
        VendorName = $('#frmLoadedIn_txtVendorName').val();
       
        InvoiceNo = $('#frmLoadedIn_txtDocumentNo').val();
        InvoiceDate = $('#frmLoadedIn_txtDocumentDate').val();
        EwaybillNo = $('#frmLoadedIn_txtEWayBillNo').val();
        EwaybillDate = $('#frmLoadedIn_txtEWayBillDate').val();
        Remark = $('#frmLoadedIn_txtRemarks').val();

        


        let VehiclePhotoLenth = $('#frmLoadedIn_fileVehiclePhoto')[0].files.length;
        if (VehiclePhotoLenth === 0 && (G_ScaleVehiclePhotoProvided || (GateEntryImageDetail && GateEntryImageDetail[0] && GateEntryImageDetail[0].imgVehicle && GateEntryImageDetail[0].imgVehicle.length > 0))) { VehiclePhotoLenth = 1; }
        let GoodsPhotoLenth = $('#frmLoadedIn_fileGoodsPhoto')[0].files.length;
        let InvoicePhotoLenth = $('#frmLoadedIn_fileInvoicePhoto')[0].files.length;


        // Check if document type is "Others" - if yes, only validate driver name
        let isOthersDocument = Documenttype && Documenttype.toLowerCase() === 'others';
        
        if (!isOthersDocument && !relaxHandCourierLoadedIn && (typeof VehicleNo === 'undefined' || VehicleNo === '' || VehicleNo === null)) {
            valid = false;
            toastr.error('Please Check! Vehicle No can not be blank');
            $('#frmLoadedIn_txtVehicleNo').focus();
            return;
        }
        if (!isOthersDocument && ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
            ChassisNo = $('#frmLoadedIn_txtChassisNo').val();
            RCNo = $('#frmLoadedIn_txtRCNo').val();
            RCExpiredDate = $('#frmLoadedIn_txtRCExpiredDate').val();
            DriverLicenseNo = $('#frmLoadedIn_txtDriverLicenseNo').val();
            DriverLicenseExpiredDate = $('#frmLoadedIn_txtDriverLicenseExpiredDate').val();
            DriverAadharNo = $('#frmLoadedIn_txtDriverAadharNo').val();

            if (typeof ChassisNo === 'undefined' || ChassisNo === '' || ChassisNo === null) {
                valid = false;
                toastr.error('Please Check! Chassis No can not be blank');
                $('#frmLoadedIn_txtChassisNo').focus();
                return;
            }
            if (typeof RCNo === 'undefined' || RCNo === '' || RCNo === null) {
                valid = false;
                toastr.error('Please Check! RC No can not be blank');
                $('#frmLoadedIn_txtRCNo').focus();
                return;
            }
            if (typeof RCExpiredDate === 'undefined' || RCExpiredDate === '' || RCExpiredDate === null) {
                valid = false;
                toastr.error('Please Check! RC Expired Date can not be blank');
                $('#frmLoadedIn_txtRCExpiredDate').focus();
                return;
            }
            if (typeof DriverLicenseNo === 'undefined' || DriverLicenseNo === '' || DriverLicenseNo === null) {
                valid = false;
                toastr.error('Please Check! Driver License No can not be blank');
                $('#frmLoadedIn_txtDriverLicenseNo').focus();
                return;
            }
            if (typeof DriverLicenseExpiredDate === 'undefined' || DriverLicenseExpiredDate === '' || DriverLicenseExpiredDate === null) {
                valid = false;
                toastr.error('Please Check! Driver License Expired Date can not be blank');
                $('#frmLoadedIn_txtDriverLicenseExpiredDate').focus();
                return;
            }
        }
        
        if (!relaxHandCourierLoadedIn && (typeof DriverName === 'undefined' || DriverName === '' || DriverName === null)) {
            valid = false;
            toastr.error('Please Check! Driver Name can not be blank');
            $('#frmLoadedIn_txtDriverName').focus();
            return;
        }
        
        // Skip other validations if document type is "Others"
        if (isOthersDocument) {
            // Only driver name is mandatory for "Others" document type
            // Skip all other field validations
        } else {
            if (!relaxHandCourierLoadedIn && (typeof DriverMobile === 'undefined' || DriverMobile === '' || DriverMobile === null)) {
                valid = false;
                toastr.error('Please Check! Driver No. can not be blank');
                $('#frmLoadedIn_txtDriverNo').focus();
                return;
            }
            if (!relaxHandCourierLoadedIn && BizSolInputControl.IsMobileNumber(DriverMobile) == false) {
                valid = false;
                toastr.error('Please enter valid mobile number.');
                $('#frmLoadedIn_txtDriverNo').focus();
                return;

            }
            
            if (!relaxHandCourierLoadedIn && (typeof TransporterName === 'undefined' || TransporterName === '' || TransporterName === null)) {
                valid = false;
                toastr.error('Please Check! Transporter Name can not be blank');
                $('#frmLoadedIn_ddlTransporterName').focus();
                return;
            }
            if (!relaxHandCourierLoadedIn && ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
                LoadedWeight = $('#frmLoadedIn_txtVehicleLoadedWeight').val();
                WeightmentSlipNumberIn = $('#frmLoadedIn_txtWeightmentSlipNoLoaded').val();


                if (typeof LoadedWeight === 'undefined' || LoadedWeight === '' || LoadedWeight === null) {
                    valid = false;
                    toastr.error('Please Check! Vehicle Loaded Weight can not be blank');
                    $('#frmLoadedIn_txtVehicleLoadedWeight').focus();
                    return;
                }
                if (typeof WeightmentSlipNumberIn === 'undefined' || WeightmentSlipNumberIn === '' || WeightmentSlipNumberIn === null) {
                    valid = false;
                    toastr.error('Please Check! Weightment Slip No can not be blank');
                    $('#frmLoadedIn_txtWeightmentSlipNoLoaded').focus();
                    return;
                }
            } else if (relaxHandCourierLoadedIn && ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
                LoadedWeight = $('#frmLoadedIn_txtVehicleLoadedWeight').val();
                WeightmentSlipNumberIn = $('#frmLoadedIn_txtWeightmentSlipNoLoaded').val();
            }

            if (Mode === 'LoadedInSave' && !relaxHandCourierLoadedIn && (typeof VehiclePhotoLenth === 'undefined' || VehiclePhotoLenth === 0)) {
                valid = false;
                toastr.error('Please Check! Vehicle Photo can not be blank');
                $('#frmLoadedIn_fileVehiclePhoto').focus();
                return;
            }
            if (Mode === 'LoadedInSave' &&(typeof GoodsPhotoLenth === 'undefined' || GoodsPhotoLenth === 0)) {
                valid = false;
                toastr.error('Please Check! Goods Photo can not be blank');
                $('#frmLoadedIn_fileGoodsPhoto').focus();
                return;
            }
            if (Mode === 'LoadedInSave' &&(typeof InvoicePhotoLenth === 'undefined' || InvoicePhotoLenth === 0)) {
                valid = false;
                toastr.error('Please Check! Document Photo can not be blank');
                $('#frmLoadedIn_fileInvoicePhoto').focus();
                return;
            }
            

            if (IsWithPo == true) {

                PurchaseOrderMaster_Code = $('#frmLoadedIn_ddlPurchaseOrder').val();
                if (typeof PurchaseOrderMaster_Code === 'undefined' || PurchaseOrderMaster_Code === '' || PurchaseOrderMaster_Code === '0' || PurchaseOrderMaster_Code === 0 || PurchaseOrderMaster_Code === null) {
                    valid = false;
                    toastr.error('Please Check! Purchase Order can not be blank');
                    $('#frmLoadedIn_ddlPurchaseOrder').focus();
                    return;
                }

                var tbPOItems = document.getElementById("tbGateEntyLoadedInPoItem");
                POItemsData = "";
                for (var i = 1; i < tbPOItems.rows.length; i++) {
                    var tbPOItemsUpdateRow = tbPOItems.rows[i];
                    
                    var BalQty = tbPOItemsUpdateRow.cells[4].innerHTML.trim();
                    var RecvQty = tbPOItemsUpdateRow.cells[8].getElementsByTagName('input')[0].value;
                    var purchaseOrderMaster = tbPOItemsUpdateRow.cells[8].getElementsByTagName('input')[1].value;
                    var purchaseOrderTransaction = tbPOItemsUpdateRow.cells[8].getElementsByTagName('input')[2].value;

                    if (parseInt(RecvQty) > -1) {
                        POItemsData += 'PurchaseOrderMaster' + '*' + purchaseOrderMaster + '*' + 'PurchaseOrderTransaction' + '*' + purchaseOrderTransaction + '*' + BalQty + '*' + RecvQty + '(';
                    }
                }
                //alert(POItemsData);
                if (POItemsData === "") {
                    valid = false;
                    toastr.error('Please Check! You not fill any billed qty in Po Items ');
                    return;
                }
                
            } else {

                if (typeof GoodDescription === 'undefined' || GoodDescription === '' || GoodDescription === null) {
                    valid = false;
                    toastr.error('Please Check! Goods Description can not be blank');
                    $('#frmLoadedIn_txtGoodsDescription').focus();
                    return;
                }
                if (typeof Qty === 'undefined' || Qty === '0' || Qty === '' || Qty === 0 || Qty === null) {
                    valid = false;
                    toastr.error('Please Check! Qty can not be blank or zero');
                    $('#frmLoadedIn_txtQTY').focus();
                    return;
                }
                if (typeof Uom === 'undefined' || Uom === '' || Uom === '0' || Uom === null) {
                    valid = false;
                    toastr.error('Please Check! Uom can not be blank');
                    $('#frmLoadedIn_txtUOM').focus();
                    return;
                }
            }
            if (typeof Documenttype === 'undefined' || Documenttype === '' || Documenttype === '0' || Documenttype === null) {
                valid = false;
                toastr.error('Please Check! Document Type can not be blank');
                $('#frmLoadedIn_ddlDocumentType').focus();
                return;
            }

            if (typeof VendorName === 'undefined' || VendorName === '' || VendorName === null) {
                valid = false;
                toastr.error('Please Check! Vendor Name can not be blank');
                $('#frmLoadedIn_txtVendorName').focus();
                return;
            }
            
            if (typeof InvoiceNo === 'undefined' || InvoiceNo === '' || InvoiceNo === null) {
                valid = false;
                toastr.error('Please Check! Document No. can not be blank');
                $('#frmLoadedIn_txtDocumentNo').focus();
                return;
            }
            if (typeof InvoiceDate === 'undefined' || InvoiceDate === '' || InvoiceDate === null) {
                valid = false;
                toastr.error('Please Check! Document Date can not be blank');
                $('#frmLoadedIn_txtDocumentDate').focus();
                return;
            }
        }
        if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'TokenApplicable').PerameterValue === 'Y') {

        }
        else if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'ReportingDatetimeApplicable').PerameterValue === 'Y') {
            ReportingDatetime = $('#frmLoadedIn_txtReportingDatetime').val();

            if (typeof ReportingDatetime === 'undefined' || ReportingDatetime === '' || ReportingDatetime === null) {
                valid = false;
                toastr.error('Please Check! Reporting Date time can not be blank');
                $('#frmLoadedIn_txtReportingDatetime').focus();
                return;
            }
        }

        // Note: Net Weight check is NOT done here for LoadedInSave/loadedinedit
        // because at this stage empty weight is always zero (empty out not done yet).
        // The check is applied in UpdateLoadedInSave (Loaded In + Empty Out complete entry).

    }
    else if (Mode == 'UpdateLoadedInSave' || Mode ==='loadedineditfull') {
        Time = $('#frmLoadedIn_txtVehicleInTime').val();
        VehicleNo = $('#frmLoadedIn_txtVehicleNo').val();
        DriverName = $('#frmLoadedIn_txtDriverName').val();
        DriverMobile = $('#frmLoadedIn_txtDriverNo').val();
        TransporterName = $('#frmLoadedIn_ddlTransporterName').val();

        ReportingDatetime = $('#frmLoadedIn_txtReportingDatetime').val();

        if (GateEntry_IsModeOfTransportEnabled()) {
            ModeOfTransportation = $('#frmLoadedIn_txtModeOfTransportation').val() || '';
            if (!ModeOfTransportation || ModeOfTransportation === '') {
                valid = false;
                toastr.error('Please Check! Mode Of Transportation can not be blank');
                $('#frmLoadedIn_txtModeOfTransportation').focus();
                return;
            }
        } else {
            ModeOfTransportation = '';
        }
        const relaxHandCourierEmptyOut = GateEntry_IsModeOfTransportEnabled() && GateEntry_IsByHandOrCourierFromSelect($('#frmLoadedIn_txtModeOfTransportation'));

        WeightmentSlipNumberIn = $('#frmLoadedIn_txtWeightmentSlipNoLoaded').val();
        GoodDescription = $('#frmLoadedIn_txtGoodsDescription').val();
        Qty = $('#frmLoadedIn_txtQTY').val();
        Uom = $('#frmLoadedIn_txtUOM').val();
        Documenttype = $('#frmLoadedIn_ddlDocumentType').val();
        VendorName = $('#frmLoadedIn_txtVendorName').val();

        InvoiceNo = $('#frmLoadedIn_txtDocumentNo').val();
        InvoiceDate = $('#frmLoadedIn_txtDocumentDate').val();
        EwaybillNo = $('#frmLoadedIn_txtEWayBillNo').val();
        EwaybillDate = $('#frmLoadedIn_txtEWayBillDate').val();
        Remark = $('#frmLoadedIn_txtRemarks').val();
        LoadedWeight = $('#frmLoadedIn_txtVehicleLoadedWeight').val();
        WeightmentSlipNumberIn = $('#frmLoadedIn_txtWeightmentSlipNoLoaded').val();

        GateEntryOutDate = $('#frmEmptyOut_txtDateOut').val();
        VehicleOutTime = $('#frmEmptyOut_txtOutTime').val();
        OutRemarks = $('#frmEmptyOut_txtRemarks').val();

        OutType = $('#frmEmptyOut_ddlOutType').val();
        OutReason = $('#frmEmptyOut_txtOutReason').val();

        if (OutType == 'LOUT') {
            RejectEntry = 'Y';
        }

        // Check if document type is "Others" - if yes, only validate driver name
        let isOthersDocument = Documenttype && Documenttype.toLowerCase() === 'others';
        
        // Validate driver name (always mandatory)
        if (!relaxHandCourierEmptyOut && (typeof DriverName === 'undefined' || DriverName === '' || DriverName === null)) {
            valid = false;
            toastr.error('Please Check! Driver Name can not be blank');
            $('#frmLoadedIn_txtDriverName').focus();
            return;
        }
        
        // Skip all other validations if document type is "Others"
        if (isOthersDocument) {
            // Only driver name is mandatory for "Others" document type
            // Skip all other field validations
        } else {
            let VehiclePhotoLenth = $('#frmEmptyOut_fileVehiclePhoto')[0].files.length;
            if (VehiclePhotoLenth === 0 && (G_ScaleVehiclePhotoProvided || (GateEntryImageDetail && GateEntryImageDetail[0] && GateEntryImageDetail[0].imgVehicle && GateEntryImageDetail[0].imgVehicle.length > 0))) { VehiclePhotoLenth = 1; }
            if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
                ChassisNo = $('#frmLoadedIn_txtChassisNo').val();
                RCNo = $('#frmLoadedIn_txtRCNo').val();
                RCExpiredDate = $('#frmLoadedIn_txtRCExpiredDate').val();
                DriverLicenseNo = $('#frmLoadedIn_txtDriverLicenseNo').val();
                DriverLicenseExpiredDate = $('#frmLoadedIn_txtDriverLicenseExpiredDate').val();
                DriverAadharNo = $('#frmLoadedIn_txtDriverAadharNo').val();
            }
            if (!relaxHandCourierEmptyOut && ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
                EmptyWeight = $('#frmEmptyOut_txtVehicleEmptyWeight').val();
                WeightmentSlipNumberOut = $('#frmEmptyOut_txtWeightmentSlipNoLoaded').val();

                if (RejectEntry == 'N' && (typeof EmptyWeight === 'undefined' || EmptyWeight === '0' || EmptyWeight === '' || EmptyWeight === 0 || EmptyWeight === null)) {
                    valid = false;
                    toastr.error('Please Check! Vehicle Empty Weight can not be blank or zero');
                    $('#frmEmptyOut_txtVehicleEmptyWeight').focus();
                    return;
                }
                if (RejectEntry == 'N' && (typeof WeightmentSlipNumberOut === 'undefined' || WeightmentSlipNumberOut === '' || WeightmentSlipNumberOut === null)) {
                    valid = false;
                    toastr.error('Please Check! Weightment Slip No. Loaded can not be blank');
                    $('#frmEmptyOut_txtWeightmentSlipNoLoaded').focus();
                    return;
                }

                NetWeight = LoadedWeight - EmptyWeight ;
                if (RejectEntry == 'N' &&  NetWeight < 0) {
                    toastr.error('Please Check! vehicle Empty weight Should be less than to vehicle Loaded weight');
                    return;
                }
            } else if (relaxHandCourierEmptyOut && ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
                EmptyWeight = $('#frmEmptyOut_txtVehicleEmptyWeight').val();
                WeightmentSlipNumberOut = $('#frmEmptyOut_txtWeightmentSlipNoLoaded').val();
                const lw = parseFloat(LoadedWeight) || 0;
                const ew = parseFloat(EmptyWeight) || 0;
                NetWeight = lw - ew;
            }
            if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'ReportingDatetimeApplicable').PerameterValue === 'Y') {
                ReportingDatetime = $('#frmLoadedIn_txtReportingDatetime').val();
            }
            
            if (RejectEntry == 'N' && Mode == 'UpdateLoadedInSave' && !relaxHandCourierEmptyOut && (typeof VehiclePhotoLenth === 'undefined' || VehiclePhotoLenth === 0)) {
                valid = false;
                toastr.error('Please Check! Vehicle Photo can not be blank');
                $('#frmEmptyOut_fileVehiclePhoto').focus();
                return;
            }

            if (RejectEntry === 'Y' && (typeof OutReason === 'undefined' || OutReason === '' || OutReason === null)) {
                valid = false;
                toastr.error('Please Check! Out Reason can not be blank');
                $('#frmEmptyOut_txtOutReason').focus();
                return;
            }

            // Net Weight vs Document Qty tolerance check (only for Loaded In, not for Loaded Out/Reject)
            if (RejectEntry == 'N') {
                const matchNetWeightParam = ConfigGateEntry.find(x => x.PerameterName === 'MatchNetWeightWithDocumentQty');
                if (matchNetWeightParam && String(matchNetWeightParam.PerameterValue).toUpperCase() === 'Y') {
                    const toleranceParam = ConfigGateEntry.find(x => x.PerameterName === 'ToleranceToMatchNetWeightWithDocumentQty');
                    const tolerancePct = toleranceParam ? (parseFloat(toleranceParam.PerameterValue) || 0) : 0;
                    const docQty = parseFloat($('#frmLoadedIn_txtQTY').val()) || 0;
                    const lw = parseFloat($('#frmLoadedIn_txtVehicleLoadedWeight').val()) || 0;
                    const ew = parseFloat($('#frmEmptyOut_txtVehicleEmptyWeight').val()) || 0;
                    const netWt = lw - ew;
                    if (docQty > 0) {
                        const allowedDiff = (tolerancePct / 100) * docQty;
                        const minAllowed = docQty - allowedDiff;
                        const maxAllowed = docQty + allowedDiff;
                        if (netWt < minAllowed || netWt > maxAllowed) {
                            valid = false;
                            toastr.error(`Net Weight (${parseFloat(netWt).toFixed(2)}) does not match Document Qty (${docQty}) within tolerance of ${tolerancePct}%. Allowed range: ${parseFloat(minAllowed).toFixed(2)} - ${parseFloat(maxAllowed).toFixed(2)}`);
                            return;
                        }
                    }
                }
            }
        }
    }

    if (EmptyWeight == ""){
        EmptyWeight = "0";
    }
    if (LoadedWeight == "") {
        LoadedWeight = "0";
    }
    if (Qty == "") {
        Qty = "0";
    }

    if (valid == true) {
        let GateEntryPostdata =
        {
            gateEntryMaster: [
                {
                    code: GateEntryMaster_Code,
                    netWeight: NetWeight,
                    gateEntryNo: 0,
                    remark: Remark,
                    transactionType: Mode.toLowerCase().includes('emptyin') == true ? 'EIN' : 'LIN',
                    f_GateEntryType_Code: 0,
                    time: Time,
                    invoiceDate: InvoiceDate,
                    accountMaster_Code_Party: 0,
                    invoiceNo: InvoiceNo,
                    accountMaster_Code_Transporter: '0',
                    qty: Qty,
                    driverName: DriverName,
                    vehicleNo: VehicleNo,
                    driverMobile: DriverMobile,
                    finYear: 2024,
                    createdBy: 0,
                    tableName: G_TableName,
                    table_Code: G_TableCode,
                    uom: Uom,
                    otherTransporterName: TransporterName,
                    godownMaster_Code: LoginGodownMaster_Code,
                    grossWeight: 0,
                    ticketNo: "",
                    emptyWeight: EmptyWeight,
                    loadedWeight: LoadedWeight,
                    emptyWeightDateTime: EmptyWeightDateTime,
                    loadedWeightDateTime: LoadedWeightDateTime,
                    manualDocNo: ManualDocNo,
                    gateEntryMaster_CodeReference: 0,
                    purchaseOrderMaster_Code: PurchaseOrderMaster_Code,
                    vehicleOutTime: VehicleOutTime,
                    gateEntryOutDate: GateEntryOutDate,
                    weightmentSlipNumberIn: WeightmentSlipNumberIn,
                    weightmentSlipNumberOut: WeightmentSlipNumberOut,
                    goodDescription: GoodDescription,
                    goodDesc: GoodDescription,
                    vendorName: VendorName,
                    userMaster_Code: 0,
                    documentType: Documenttype,
                    ewaybillNo: EwaybillNo,
                    ewaybillDate: EwaybillDate,
                    reportingDatetime: ReportingDatetime,
                    outRemarks: OutRemarks,
                    chassisNo: ChassisNo,
                    rCNo: RCNo,
                    rCExpiredDate: RCExpiredDate,
                    driverLicenseNo: DriverLicenseNo,
                    driverLicenseExpiredDate: DriverLicenseExpiredDate,
                    tokenNo: TokenNo,
                    outType: OutType,
                    outReason: OutReason,
                    gRNo: GRNo,
                    driverAadharNo: DriverAadharNo,
                    modeOfTransportation: ModeOfTransportation,
                    entryWithOutExistingItem: IsEntryWithoutExistingItem ? 'Y' : 'N'
                }
            ],

            gateEntryImageDetail: GateEntryImageDetail,
            gateEntryLinkedERPDocuments: G_GateEntryLinkedERPDocuments

        }
        

        //alert('Save Alert!' + Mode + ' Post Data: ' + JSON.stringify(GateEntryPostdata));

        Showloader();
        GateEntryService.SaveGateEntryMaster(JSON.stringify(GateEntryPostdata), POItemsData, 'SAVEDATA').then(function (response) {
            if (response.Status === 'Y') {
                HideLoader();
                //toastr.success(`Entry save success`);
                        ShowGateEntrySaveSuccessModal(response.Msg);
                        // window.location.href = sessionStorage.getItem('AppBaseURL') +'PurchaseTransactions/GateEntry/GateEntryView';
                        GateEntyMode_GateEntry('grid', '');
                        GateEntryGirdByDates();
            }
            else {
                toastr.error(response.Msg);
                HideLoader();
            }
        });

    }

}

function ConvertFileToByteArry(File) {
    return new Promise(function (resolve, reject) {
        var fileByteArray = [];
        var reader = new FileReader();

        reader.readAsArrayBuffer(File);
        reader.onloadend = function (evt) {
            if (evt.target.readyState == FileReader.DONE) {
                var arrayBuffer = evt.target.result,
                    array = new Uint8Array(arrayBuffer);
                for (var i = 0; i < array.length; i++) {
                    fileByteArray.push(array[i]);
                }
                resolve(fileByteArray);
            }
        }
    });
}

function GateEntry_frmLoadedIn_ddlPurchaseOrder_Change() {
    let frmLoadedIn_ddlPurchaseOrder = document.getElementById("frmLoadedIn_ddlPurchaseOrder");
    if (!frmLoadedIn_ddlPurchaseOrder) {
        return;
    }
    
    let frmLoadedIn_ddlPurchaseOrder_VendorName = '';
    let selectedIndex = frmLoadedIn_ddlPurchaseOrder.selectedIndex;
    
    if (selectedIndex >= 0 && frmLoadedIn_ddlPurchaseOrder.options[selectedIndex]) {
        let selectedOption = frmLoadedIn_ddlPurchaseOrder.options[selectedIndex];
        // Try to get vendorname from attribute (HTML attributes are case-insensitive, but check both)
        if (selectedOption.attributes) {
            let vendorNameAttr = selectedOption.attributes["vendorname"] || selectedOption.attributes["VendorName"];
            if (vendorNameAttr && vendorNameAttr.value) {
                frmLoadedIn_ddlPurchaseOrder_VendorName = vendorNameAttr.value;
            }
        }
        
        // If not found in attributes, try dataset
        if (!frmLoadedIn_ddlPurchaseOrder_VendorName && selectedOption.dataset && selectedOption.dataset.vendorname) {
            frmLoadedIn_ddlPurchaseOrder_VendorName = selectedOption.dataset.vendorname;
        }
        
        // If still not found, get from the original data array
        if (!frmLoadedIn_ddlPurchaseOrder_VendorName) {
            let selectedValue = $('#frmLoadedIn_ddlPurchaseOrder').val();
            if (selectedValue && G_PendingPONOList && G_PendingPONOList.length > 0) {
                let selectedItem = G_PendingPONOList.find(item => item.PurchaseOrderMaster_Code == selectedValue);
                if (selectedItem && selectedItem.VendorName) {
                    frmLoadedIn_ddlPurchaseOrder_VendorName = selectedItem.VendorName;
                }
            }
        }
    }

    let purchaseOrderMaster_Code = $('#frmLoadedIn_ddlPurchaseOrder').val() == null ? "0" : $('#frmLoadedIn_ddlPurchaseOrder').val();

    $("#tbGateEntyLoadedInPoItemHeader").empty();
    $("#tbGateEntyLoadedInPoItemBody").empty();
    if (purchaseOrderMaster_Code > 0) {
        GateEntryService.GetPOItems(purchaseOrderMaster_Code).then(function (response) {
            //console.log(response)
            $('#RowfrmLoadedInPoItemGrid').show();
            $('#frmLoadedIn_txtVendorName').val(frmLoadedIn_ddlPurchaseOrder_VendorName);
            $('#frmLoadedIn_txtVendorName').attr('readonly', 'readonly');

            response.forEach(item => {
                item["BiLLED QTY"] = '<input class="BizSolFormControl form-control form-control-sm" type="text" onchange="BizSolInputControl.OnChangeFloatTextBox(this,2)" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" autocomplete="off" maxlength="7"><input type="hidden" value="' + item.PurchaseOrderMaster_Code + '" id="hfPurchaseOrderMaster_Code"/><input type="hidden" value="' + item.PurchaseOrderTransaction_Code + '" id="hfPurchaseOrderTransaction_Code"/>';
            });

            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = []
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["PurchaseOrderMaster_Code", "PurchaseOrderTransaction_Code", "BILLED QTY"];
            const ColumnAlignment = {};
            BizsolCustomFilterGrid.CreateDataTable("tbGateEntyLoadedInPoItemHeader", "tbGateEntyLoadedInPoItemBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        });
    }
}

$('#frmEmptyIn_fileVehiclePhoto').bind('change', function () {

    // If file size > 500kB, resize such that width <= 1000, quality = 0.9
    OptimizeImage.reduceFileSize($('#frmEmptyIn_fileVehiclePhoto')[0].files[0], 500 * 1024, 1000, Infinity, 0.9, blob => {
       
        //ConvertFileToByteArry($('#frmEmptyIn_fileVehiclePhoto')[0].files[0]).then(function (ByteArray) {
        ConvertFileToByteArry(blob).then(function (ByteArray) {
            GateEntryImageDetail = [{
                imgVehicle: ByteArray,
                imgMaterial: [],
                imgDoc: [],
                ImgOther: []

            }];
        })

        
    });

   
});

$('#frmLoadedOut_fileVehiclePhoto').bind('change', function () {

    // If file size > 500kB, resize such that width <= 1000, quality = 0.9
    OptimizeImage.reduceFileSize($('#frmLoadedOut_fileVehiclePhoto')[0].files[0], 500 * 1024, 1000, Infinity, 0.9, blob => {

        ConvertFileToByteArry(blob).then(function (ByteArray) {
            GateEntryImageDetail.push({
                imgVehicle: ByteArray,
                imgMaterial: [],
                imgDoc: [],
                ImgOther: []
            });
        });


    });

   

});
$('#frmLoadedOut_fileGoodsPhoto').bind('change', function () {

    // If file size > 500kB, resize such that width <= 1000, quality = 0.9
    OptimizeImage.reduceFileSize($('#frmLoadedOut_fileGoodsPhoto')[0].files[0], 500 * 1024, 1000, Infinity, 0.9, blob => {

        
        ConvertFileToByteArry(blob).then(function (ByteArray) {
            GateEntryImageDetail.push({
                imgVehicle: [],
                imgMaterial: ByteArray,
                imgDoc: [],
                ImgOther: []
            });
        });

    });

    

});
$('#frmLoadedOut_fileInvoicePhoto').bind('change', function () {

    // If file size > 500kB, resize such that width <= 1000, quality = 0.9
    OptimizeImage.reduceFileSize($('#frmLoadedOut_fileInvoicePhoto')[0].files[0], 500 * 1024, 1000, Infinity, 0.9, blob => {


        ConvertFileToByteArry(blob).then(function (ByteArray) {
            GateEntryImageDetail.push({
                imgVehicle: [],
                imgMaterial: [],
                imgDoc: ByteArray,
                ImgOther: []
            });
        });

    });

    

});
$('#frmLoadedOut_fileOtherPhoto').bind('change', function () {

    $.each($('#frmLoadedOut_fileOtherPhoto')[0].files, function (key, file) {

        // If file size > 500kB, resize such that width <= 1000, quality = 0.9
        OptimizeImage.reduceFileSize(file, 500 * 1024, 1000, Infinity, 0.9, blob => {

            ConvertFileToByteArry(blob).then(function (ByteArray) {
                GateEntryImageDetail.push({
                    imgVehicle: [],
                    imgMaterial: [],
                    imgDoc: [],
                    ImgOther: ByteArray
                });
            });

        });
       
    });
});

$('#frmLoadedIn_fileVehiclePhoto').bind('change', function () {

    // If file size > 500kB, resize such that width <= 1000, quality = 0.9
    OptimizeImage.reduceFileSize($('#frmLoadedIn_fileVehiclePhoto')[0].files[0], 500 * 1024, 1000, Infinity, 0.9, blob => {

        ConvertFileToByteArry(blob).then(function (ByteArray) {
            GateEntryImageDetail.push({
                imgVehicle: ByteArray,
                imgMaterial: [],
                imgDoc: [],
                ImgOther: []
            });
        });

    });

    

});

$('#frmLoadedIn_fileGoodsPhoto').bind('change', function () {
    // If file size > 500kB, resize such that width <= 1000, quality = 0.9
    OptimizeImage.reduceFileSize($('#frmLoadedIn_fileGoodsPhoto')[0].files[0], 500 * 1024, 1000, Infinity, 0.9, blob => {

        ConvertFileToByteArry(blob).then(function (ByteArray) {
            GateEntryImageDetail.push({
                imgVehicle: [],
                imgMaterial: ByteArray,
                imgDoc: [],
                ImgOther: []
            });
        });

    });

    

});
$('#frmLoadedIn_fileInvoicePhoto').bind('change', function () {

    // If file size > 500kB, resize such that width <= 1000, quality = 0.9
    OptimizeImage.reduceFileSize($('#frmLoadedIn_fileInvoicePhoto')[0].files[0], 500 * 1024, 1000, Infinity, 0.9, blob => {

        ConvertFileToByteArry(blob).then(function (ByteArray) {
            GateEntryImageDetail.push({
                imgVehicle: [],
                imgMaterial: [],
                imgDoc: ByteArray,
                ImgOther: []
            });
        });

    });

    

});
$('#frmLoadedIn_fileOtherPhoto').bind('change', function () {
    $.each($('#frmLoadedIn_fileOtherPhoto')[0].files, function (key, file) {
        // If file size > 500kB, resize such that width <= 1000, quality = 0.9
        OptimizeImage.reduceFileSize(file, 500 * 1024, 1000, Infinity, 0.9, blob => {

            ConvertFileToByteArry(blob).then(function (ByteArray) {
                GateEntryImageDetail.push({
                    imgVehicle: [], 
                    imgMaterial: [], 
                    imgDoc: [], 
                    ImgOther: ByteArray
                });
            });

        });

        
    });
});


$('#frmEmptyOut_fileVehiclePhoto').bind('change', function () {

    // If file size > 500kB, resize such that width <= 1000, quality = 0.9
    OptimizeImage.reduceFileSize($('#frmEmptyOut_fileVehiclePhoto')[0].files[0], 500 * 1024, 1000, Infinity, 0.9, blob => {

        ConvertFileToByteArry(blob).then(function (ByteArray) {
            GateEntryImageDetail = [{
                imgVehicle: ByteArray,
                imgMaterial: [],
                imgDoc: [],
                ImgOther: []

            }];
        })

    });

    
});


$('#frmLoadedIn_ddlDocumentType').on('change', function () {
    frmLoadedIn_ddlDocumentType();
});
$('#frmLoadedOut_ddlDocumentType').on('change', function () {
    frmLoadedOut_ddlDocumentType();
});

function frmLoadedIn_ddlDocumentType(callby) {
    let elementValue = $('#frmLoadedIn_ddlDocumentType').val();
    let oldlable = $('#DivfrmLoadedIn_Vendor').text().replace(/\*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (elementValue.toLowerCase() === 'sales return') {

        $('#DivfrmLoadedIn_Vendor')[0].innerHTML = 'Customer Name'
        GateEntryService.GetVendorOrClientNameListData('CLIENT').then(function (response) {
            AutoSuggestionControl.SetUpAutoSuggestion(
                $('#frmLoadedIn_txtVendorName'), 
                $('#frmLoadedIn_txtVendorName_List'), 
                response.map((item) => ({ Desp: item.AccountDesp })), 
                'StartWith',
                true,
                function (selectedItem) {
                    if (selectedItem) {
                        $('#frmLoadedIn_ddlPurchaseOrder').val('').trigger('change');
                    }
                }
            );
        });
    }
    else if (elementValue.toLowerCase().includes('job work') == true) {
        $('#DivfrmLoadedIn_Vendor')[0].innerHTML = 'Job Worker'
        GateEntryService.GetVendorOrClientNameListData('JOBWORK').then(function (response) {
            AutoSuggestionControl.SetUpAutoSuggestion(
                $('#frmLoadedIn_txtVendorName'), 
                $('#frmLoadedIn_txtVendorName_List'), 
                response.map((item) => ({ Desp: item.AccountDesp })), 
                'StartWith',
                true,
                function (selectedItem) {
                    if (selectedItem) {
                        $('#frmLoadedIn_ddlPurchaseOrder').val('').trigger('change');
                    }
                }
            );
        });
    }
    else {
        $('#DivfrmLoadedIn_Vendor')[0].innerHTML = 'Vendor Name'
        GateEntryService.GetVendorOrClientNameListData('VENDOR').then(function (response) {
            AutoSuggestionControl.SetUpAutoSuggestion(
                $('#frmLoadedIn_txtVendorName'), 
                $('#frmLoadedIn_txtVendorName_List'), 
                response.map((item) => ({ Desp: item.AccountDesp })), 
                'StartWith',
                true,
                function (selectedItem) {
                    if (selectedItem) {
                        $('#frmLoadedIn_ddlPurchaseOrder').val('').trigger('change');
                    }
                }
            );
        });
    }

    if (typeof callby === 'undefined' || callby === '') {
        let lableName = $('#DivfrmLoadedIn_Vendor').text().replace(/\*/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (lableName != oldlable) {//"Vendor Name"
            $('#frmLoadedIn_txtVendorName').val('');
            chnage_VendorNameGetPOByVendor();
        }
    }
    
}

function frmLoadedOut_ddlDocumentType(callby) {
    let elementValue = $('#frmLoadedOut_ddlDocumentType').val();

    if (elementValue.toLowerCase() === 'purchase return') {
        $('#DivfrmLoadedOut_CustomerName')[0].innerHTML = 'Vendor Name'
        GateEntryService.GetVendorOrClientNameListData('VENDOR').then(function (response) {
            AutoSuggestionControl.SetUpAutoSuggestion($('#frmLoadedOut_txtCustomerName'), $('#frmLoadedOut_txtCustomerName_List'), response.map((item) => ({ Desp: item.AccountDesp })), 'StartWith');
        });
    }
    else if (elementValue.toLowerCase().includes('job work') == true) {
        $('#DivfrmLoadedOut_CustomerName')[0].innerHTML = 'Job Worker'
        GateEntryService.GetVendorOrClientNameListData('JOBWORK').then(function (response) {
            AutoSuggestionControl.SetUpAutoSuggestion($('#frmLoadedOut_txtCustomerName'), $('#frmLoadedOut_txtCustomerName_List'), response.map((item) => ({ Desp: item.AccountDesp })), 'StartWith');
        });
    }
    else {
        $('#DivfrmLoadedOut_CustomerName')[0].innerHTML = 'Customer Name'
        GateEntryService.GetVendorOrClientNameListData('CLIENT').then(function (response) {
            AutoSuggestionControl.SetUpAutoSuggestion($('#frmLoadedOut_txtCustomerName'), $('#frmLoadedOut_txtCustomerName_List'), response.map((item) => ({ Desp: item.AccountDesp })), 'StartWith');
        });
    }

    if (typeof callby === 'undefined' || callby === '') {
        $('#frmLoadedOut_txtCustomerName').val('');
    }
    
}

function ClearAllFrm() {
    $('#GateEntryFormEntryNoBanner').remove();
    G_ScaleVehiclePhotoProvided = false;
    GateEntryImageDetail = [{
        imgVehicle: [],
        imgMaterial: [],
        imgDoc: [],
        ImgOther: []

    }];
    // EmptyIn
    $('#frmEmptyIn_txtDateIn').val('');
    $('#frmEmptyIn_txtVehicleNo').val('');
    $('#frmEmptyIn_txtDriverName').val('');
    $('#frmEmptyIn_txtDriverNo').val('');
    $('#frmEmptyIn_ddlTransporterName').val('');
    //$('#frmEmptyIn_ddlTransporterName_List').val('');
    $('#frmEmptyIn_txtVehicleEmptyWeight').val('');
    $('#frmEmptyIn_txtWeightmentSlipNoEmpty').val('');
    $('#frmEmptyIn_txtVehicleInTime').val('');
    $('#frmEmptyIn_fileVehiclePhoto').val('');
    $('#frmEmptyIn_txtReportingDatetime').val('');
    $('#frmEmptyIn_txtRemarks').val('');
    $('#frmEmptyIn_txtChassisNo').val('');
    $('#frmEmptyIn_txtRCNo').val('');
    $('#frmEmptyIn_txtRCExpiredDate').val('');
    $('#frmEmptyIn_txtDriverLicenseNo').val('');
    $('#frmEmptyIn_txtDriverLicenseExpiredDate').val('');
    $('#frmEmptyIn_txtDriverAadharNo').val('');
    $('#frmEmptyIn_txtTokenNo').val('');

    $('#frmLoadedOut_txtVehicleLoadedWeight').val('');
    $('#frmLoadedOut_txtWeightmentSlipNoLoadedOut').val('');
    $('#frmLoadedOut_txtGoodsDescription').val('');
    $('#frmLoadedOut_txtQty').val('');
    $('#frmLoadedOut_ddlUOM').val('');
    $('#frmLoadedOut_txtCustomerName').val('');
    $('#frmLoadedOut_ddlDocumentType').val('');
    $('#frmLoadedOut_txtDocumentNo').val('');
    $('#frmLoadedOut_txtDocumentDate').val('');
    $('#frmLoadedOut_txtManualDocNo').val('');
    $('#frmLoadedOut_txtGRNo').val('');
    $('#frmLoadedOut_txtEWayBillNo').val('');
    $('#frmLoadedOut_txtEWayBillDate').val();
    $('#frmLoadedOut_txtRemarks').val();

    $('#frmEmptyIn_txtVehicleNo').removeAttr('readonly')
    $('#frmEmptyIn_txtDriverName').removeAttr('readonly')
    $('#frmEmptyIn_txtDriverNo').removeAttr('readonly')
    $('#frmEmptyIn_ddlTransporterName').removeAttr('readonly')
    $('#frmEmptyIn_txtRemarks').removeAttr('readonly')
    $('#frmEmptyIn_txtVehicleEmptyWeight').removeAttr('readonly')
    $('#frmEmptyIn_txtWeightmentSlipNoEmpty').removeAttr('readonly')
    $('#frmEmptyIn_txtReportingDatetime').removeAttr('readonly')
    $('#frmEmptyIn_txtChassisNo').removeAttr('readonly');
    $('#frmEmptyIn_txtRCNo').removeAttr('readonly');
    $('#frmEmptyIn_txtRCExpiredDate').removeAttr('readonly');
    $('#frmEmptyIn_txtDriverLicenseNo').removeAttr('readonly');
    $('#frmEmptyIn_txtDriverLicenseExpiredDate').removeAttr('readonly');
    $('#frmEmptyIn_txtDriverAadharNo').removeAttr('readonly');
    $('#frmEmptyIn_txtTokenNo').removeAttr('readonly');
    $('#frmEmptyIn_btnSave').removeAttr('disabled')
    $('#frmEmptyIn_btnCancel').removeAttr('disabled')

    $('#frmLoadedOut_txtVehicleLoadedWeight').removeAttr('readonly');
    $('#frmLoadedOut_txtWeightmentSlipNoLoadedOut').removeAttr('readonly');
    $('#frmLoadedOut_txtGoodsDescription').removeAttr('readonly');
    $('#frmLoadedOut_txtQty').removeAttr('readonly');
    $('#frmLoadedOut_ddlUOM').removeAttr('disabled');
    $('#frmLoadedOut_txtCustomerName').removeAttr('readonly');
    $('#frmLoadedOut_ddlDocumentType').removeAttr('disabled');
    $('#frmLoadedOut_txtDocumentNo').removeAttr('readonly');
    $('#frmLoadedOut_txtDocumentDate').removeAttr('readonly');
    $('#frmLoadedOut_txtManualDocNo').removeAttr('readonly');
    $('#frmLoadedOut_txtGRNo').removeAttr('readonly');

    $('#frmLoadedOut_txtEWayBillNo').removeAttr('readonly');
    $('#frmLoadedOut_txtEWayBillDate').removeAttr('readonly');
    $('#frmLoadedOut_txtRemarks').removeAttr('readonly');
    //Loaded-in

    $('#frmLoadedIn_txtDateIn').val('');
    $('#frmLoadedIn_txtVehicleNo').val('');
    $('#frmLoadedIn_txtDriverName').val('');
    $('#frmLoadedIn_txtDriverNo').val('');
    $('#frmLoadedIn_ddlTransporterName').val('');
    //$('#frmLoadedIn_ddlTransporterName_List').val('');
    $('#frmLoadedIn_txtVehicleLoadedWeight').val('');
    $('#frmLoadedIn_txtWeightmentSlipNoLoaded').val('');
    $('#frmLoadedIn_txtVehicleInTime').val('');
    $('#frmLoadedIn_fileVehiclePhoto').val('');
    $('#frmLoadedIn_fileGoodsPhoto').val('');
    $('#frmLoadedIn_fileInvoicePhoto').val('');
    $('#frmLoadedIn_fileOtherPhoto').val('');
    $('#frmLoadedIn_txtGoodsDescription').val('');
    $('#frmLoadedIn_txtQTY').val('');
    $('#frmLoadedIn_txtUOM').val('');
    $('#frmLoadedIn_ddlDocumentType').val('');
    $('#frmLoadedIn_txtVendorName').val('');
    $('#frmLoadedIn_txtDocumentNo').val('');
    $('#frmLoadedIn_txtDocumentDate').val('');
    $('#frmLoadedIn_txtReportingDatetime').val('');
    $('#frmLoadedIn_txtEWayBillNo').val('');
    $('#frmLoadedIn_txtEWayBillDate').val('');
    $('#frmLoadedIn_txtRemarks').val('');
    $('#frmLoadedIn_txtChassisNo').val('');
    $('#frmLoadedIn_txtRCNo').val('');
    $('#frmLoadedIn_txtRCExpiredDate').val('');
    $('#frmLoadedIn_txtDriverLicenseNo').val('');
    $('#frmLoadedIn_txtDriverLicenseExpiredDate').val('');
    $('#frmLoadedIn_txtDriverAadharNo').val('');
    $('#frmLoadedIn_txtTokenNo').val('');


    $('#frmLoadedIn_txtVehicleNo').removeAttr('readonly');
    $('#frmLoadedIn_txtDriverName').removeAttr('readonly');
    $('#frmLoadedIn_txtDriverNo').removeAttr('readonly');
    $('#frmLoadedIn_ddlTransporterName').removeAttr('readonly');
    $('#frmLoadedIn_txtVehicleLoadedWeight').removeAttr('readonly');
    $('#frmLoadedIn_txtWeightmentSlipNoLoaded').removeAttr('readonly');
    $('#frmLoadedIn_txtGoodsDescription').removeAttr('readonly');
    $('#frmLoadedIn_txtQTY').removeAttr('readonly');
    $('#frmLoadedIn_txtUOM').removeAttr('disabled');
    $('#frmLoadedIn_ddlDocumentType').removeAttr('disabled');
    $('#frmLoadedIn_txtVendorName').removeAttr('readonly');
    $('#frmLoadedIn_txtDocumentNo').removeAttr('readonly');
    $('#frmLoadedIn_txtDocumentDate').removeAttr('readonly');
    $('#frmLoadedIn_txtReportingDatetime').removeAttr('readonly');
    $('#frmLoadedIn_txtEWayBillNo').removeAttr('readonly');
    $('#frmLoadedIn_txtEWayBillDate').removeAttr('readonly');
    $('#frmLoadedIn_txtRemarks').removeAttr('readonly');
    $('#frmEmptyOut_txtVehicleEmptyWeight').removeAttr('readonly');
    $('#frmEmptyOut_txtWeightmentSlipNoLoaded').removeAttr('readonly');
    $('#frmEmptyOut_txtRemarks').removeAttr('readonly');
    $('#frmLoadedIn_txtChassisNo').removeAttr('readonly');
    $('#frmLoadedIn_txtRCNo').removeAttr('readonly');
    $('#frmLoadedIn_txtRCExpiredDate').removeAttr('readonly');
    $('#frmLoadedIn_txtDriverLicenseNo').removeAttr('readonly');
    $('#frmLoadedIn_txtDriverLicenseExpiredDate').removeAttr('readonly');
    $('#frmLoadedIn_txtDriverAadharNo').removeAttr('readonly');
    $('#frmLoadedIn_txtTokenNo').removeAttr('readonly');

    $('#DivfrmLoadedIn_fileVehiclePhoto').show();
    $('#DivfrmLoadedIn_fileGoodsPhoto').show();
    $('#DivfrmLoadedIn_fileInvoicePhoto').show();
    $('#DivfrmLoadedIn_fileOtherPhoto').show();
    
    $('#frmLoadedIn_btnSave').removeAttr('disabled')
    $('#frmLoadedIn_btnCancel').removeAttr('disabled')

    $('#frmEmptyOut_btnSave').removeAttr('disabled')
    $('#frmLoadedOut_btnSave').removeAttr('disabled', 'disabled')

    $('#frmLoadedIn_ddlPurchaseOrder').removeAttr('disabled');

    $('#tbGateEntyLoadedInPoItem tr').empty();
    $('#frmLoadedIn_txtVendorName').removeAttr('readonly');
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'POWiseEntryMendatory').PerameterValue === 'Y') {
        IsWithPo = true;
        IsEntryWithoutExistingItem = false;
    }
    WithPO();
    GateEntry_applyLoadedInGoodsDescriptionAutoSuggestionState();
    ClearEmptyOutOrLoadedOutFrm();


    //Reset EmptyIn frmbtn
    $('#frmEmptyIn_btnSave').removeAttr('onclick');
    $('#frmEmptyIn_btnSave').attr('onclick', "GateEntry_SaveData('EmptyInSave')");

    $('#frmLoadedOut_btnSave').removeAttr('onclick');
    $('#frmLoadedOut_btnSave').attr('onclick', "GateEntry_SaveData('UpdateEmptyInSave')");

    //Reset LoadedIN frmbtn
    $('#frmLoadedIn_btnSave').removeAttr('onclick');
    $('#frmLoadedIn_btnSave').attr('onclick', "GateEntry_SaveData('LoadedInSave')");

    $('#frmEmptyOut_btnSave').removeAttr('onclick');
    $('#frmEmptyOut_btnSave').attr('onclick', "GateEntry_SaveData('UpdateLoadedInSave')");

    $('#frmEmptyIn_txtModeOfTransportation').removeAttr('disabled');
    $('#frmLoadedIn_txtModeOfTransportation').removeAttr('disabled');
    GateEntry_ApplyModeOfTransportVisibility();
    GateEntry_ApplyEntryWithoutExistingItemRadioVisibility();
    ClearWeightScalePreviews();
}
function ClearEmptyOutOrLoadedOutFrm() {
    G_ScaleVehiclePhotoProvided = false;
    GateEntryImageDetail = [{
        imgVehicle: [],
        imgMaterial: [],
        imgDoc: [],
        ImgOther: []

    }];
    //Loaded Out
    $('#frmLoadedOut_txtDateOut').val('');
    $('#frmLoadedOut_txtVehicleLoadedWeight').val('');
    $('#frmLoadedOut_txtWeightmentSlipNoLoadedOut').val('');
    $('#frmLoadedOut_txtVehicleOutTime').val('');
    $('#frmLoadedOut_fileVehiclePhoto').val('');
    $('#frmLoadedOut_fileGoodsPhoto').val('');
    $('#frmLoadedOut_fileInvoicePhoto').val('');
    $('#frmLoadedOut_fileOtherPhoto').val('');
    $('#frmLoadedOut_txtGoodsDescription').val('');
    //$('#frmLoadedOut_txtGoodsDescription_List').val('');
    $('#frmLoadedOut_txtQty').val('');
    $('#frmLoadedOut_ddlUOM').val('');
    $('#frmLoadedOut_txtCustomerName').val('');
    //$('#frmLoadedOut_txtCustomerName_List').val('');
    $('#frmLoadedOut_ddlDocumentType').val('0');
    $('#frmLoadedOut_txtDocumentNo').val('');
    $('#frmLoadedOut_txtDocumentDate').val('');
    $('#frmLoadedOut_txtManualDocNo').val('');
    $('#frmLoadedOut_txtGRNo').val('');
    $('#frmLoadedOut_txtEWayBillNo').val('');
    $('#frmLoadedOut_txtEWayBillDate').val('');
    $('#frmLoadedOut_txtRemarks').val('');

    //EmptyOut

    $('#frmEmptyOut_txtDateOut').val('');
    $('#frmEmptyOut_txtOutTime').val('');
    $('#frmEmptyOut_fileVehiclePhoto').val('');

    $('#frmEmptyOut_txtVehicleEmptyWeight').val('');
    $('#frmEmptyOut_txtWeightmentSlipNoLoaded').val('');
    $('#frmEmptyOut_txtRemarks').val('');
    ClearWeightScalePreviews();
}
function ViewGateEntry(gateEntryData, EntryType) {
    
    let mode = EntryType.split('_')[0]; 
    if (mode.toLowerCase() === 'loadedinview') {
        ClearEmptyOutOrLoadedOutFrm();
        UpdateLoadedIn_Emptyout(gateEntryData);
        //$('#frmEmptyOut_txtDateOut').val(new Date(gateEntryData[0].GateEntryOutDate).toISOString().slice(0, 10));
        $('#frmEmptyOut_txtDateOut').val(gateEntryData[0].GateEntryOutDate.slice(0, 10));
        $('#frmEmptyOut_txtOutTime').val(gateEntryData[0].VehicleOutTime); 

        $('#frmEmptyOut_txtVehicleEmptyWeight').val(gateEntryData[0].EmptyWeight);
        $('#frmEmptyOut_txtWeightmentSlipNoLoaded').val(gateEntryData[0].WeightmentSlipNumberOut);
        $('#frmEmptyOut_txtRemarks').val(gateEntryData[0].OutRemarks);
        $('#frmEmptyOut_ddlOutType').val(gateEntryData[0].OutType);
        $('#frmEmptyOut_txtOutReason').val(gateEntryData[0].OutReason);

        $('#RowfrmEmptyOut_fileVehiclePhoto').hide();

        $('#frmEmptyOut_txtVehicleEmptyWeight').attr('readonly', 'readonly');
        $('#frmEmptyOut_txtWeightmentSlipNoLoaded').attr('readonly', 'readonly');
        $('#frmEmptyOut_txtRemarks').attr('readonly', 'readonly');
        $('#frmEmptyOut_ddlOutType').attr('disabled', 'disabled');
        $('#frmEmptyOut_txtOutReason').attr('readonly', 'readonly');


        $('#frmEmptyOut_btnSave').attr('disabled', 'disabled')

        $('#frmEmptyIn_txtModeOfTransportation').attr('disabled', 'disabled');
        $('#frmLoadedIn_txtModeOfTransportation').attr('disabled', 'disabled');
        
    }
    else if (mode.toLowerCase() === 'emptyinview') {
        ClearEmptyOutOrLoadedOutFrm();
        UpdateEmptyIn_loadedout(gateEntryData);

        $('#frmLoadedOut_txtVehicleLoadedWeight').val(gateEntryData[0].LoadedWeight);
        $('#frmLoadedOut_txtWeightmentSlipNoLoadedOut').val(gateEntryData[0].WeightmentSlipNumberOut);
        $('#frmLoadedOut_txtNetWeightLoadedOut').val(parseFloat(gateEntryData[0].NetWeight).toFixed(2));
        $('#frmLoadedOut_txtGoodsDescription').val(gateEntryData[0].GoodDescription);
        $('#frmLoadedOut_txtQty').val(gateEntryData[0].Qty);
        GateEntryService.GetUOMMasterList().then(function (response) {

            BindSelectList($('#frmLoadedOut_ddlUOM')[0], response.map((item) => ({ Code: item.UOM, Desp: item.UOM, VendorName: '' })));
            $('#frmLoadedOut_ddlUOM').val(gateEntryData[0].UOM);
            $('#frmLoadedOut_ddlUOM').select2({
                width: '-webkit-fill-available'
            });

        });


        GateEntryService.GateEntryCategoryOut().then(function (response) {
            BindSelectList($('#frmLoadedOut_ddlDocumentType')[0], response.map((item) => ({ Code: item.Desp, Desp: item.Desp, VendorName: '' })));
            $('#frmLoadedOut_ddlDocumentType').val(gateEntryData[0].DocumentType);
            $('#frmLoadedOut_ddlDocumentType').select2({
                width: '-webkit-fill-available'
            });
            frmLoadedOut_ddlDocumentType('view');
        });
       
        
        $('#frmLoadedOut_txtCustomerName').val(gateEntryData[0].VendorName);
        
        $('#frmLoadedOut_txtDocumentNo').val(gateEntryData[0].DocNo);
        $('#frmLoadedOut_txtDocumentDate').val(geFormatGateEntryInputDate(gateEntryData[0].InvoiceDate));
        $('#frmLoadedOut_txtManualDocNo').val(gateEntryData[0].ManualDocNo);
        $('#frmLoadedOut_txtGRNo').val(gateEntryData[0].GRNo);

        $('#frmLoadedOut_txtEWayBillNo').val(gateEntryData[0].EwaybillNo);
        $('#frmLoadedOut_txtEWayBillDate').val(gateEntryData[0].EwaybillDate);
        $('#frmLoadedOut_txtRemarks').val(gateEntryData[0].OutRemarks);
        $('#frmLoadedOut_ddlOutType').val(gateEntryData[0].OutType);
        $('#frmLoadedOut_txtOutReason').val(gateEntryData[0].OutReason);

        $('#RowLoadedOut_fileVehiclePhoto').hide();
        $('#RowLoadedOut_fileGoodsPhoto').hide();
        $('#RowLoadedOut_fileInvoicePhoto').hide();
        $('#RowLoadedOut_fileOtherPhoto').hide();

        $('#frmLoadedOut_txtVehicleLoadedWeight').attr('readonly', 'readonly');
        $('#frmLoadedOut_txtWeightmentSlipNoLoadedOut').attr('readonly', 'readonly');
        $('#frmLoadedOut_txtGoodsDescription').attr('readonly', 'readonly');
        $('#frmLoadedOut_txtQty').attr('readonly', 'readonly');
        $('#frmLoadedOut_ddlUOM').attr('disabled', 'disabled');
        $('#frmLoadedIn_ddlPurchaseOrder').attr('disabled');
        $('#frmLoadedOut_txtCustomerName').attr('readonly', 'readonly');
        $('#frmLoadedOut_ddlDocumentType').attr('disabled', 'disabled');
        $('#frmLoadedOut_txtDocumentNo').attr('readonly', 'readonly');
        $('#frmLoadedOut_txtDocumentDate').attr('readonly', 'readonly');
        $('#frmLoadedOut_txtManualDocNo').attr('readonly', 'readonly');
        $('#frmLoadedOut_txtGRNo').attr('readonly', 'readonly');

        $('#frmLoadedOut_txtEWayBillNo').attr('readonly', 'readonly');
        $('#frmLoadedOut_txtEWayBillDate').attr('readonly', 'readonly');
        $('#frmLoadedOut_txtRemarks').attr('readonly', 'readonly');

        $('#frmLoadedOut_ddlOutType').attr('disabled', 'disabled');
        $('#frmLoadedOut_txtOutReason').attr('readonly', 'readonly');

        $('#frmLoadedOut_btnSave').attr('disabled', 'disabled')

        $('#frmEmptyIn_txtModeOfTransportation').attr('disabled', 'disabled');
        $('#frmLoadedIn_txtModeOfTransportation').attr('disabled', 'disabled');
    }

}

function EditGateEntry(gateEntryData, EntryType) {

    let mode = EntryType.split('_')[0];
    if (mode.toLowerCase() === 'loadedinedit') {
        ClearEmptyOutOrLoadedOutFrm();
        UpdateLoadedIn_Emptyout(gateEntryData);
        EditLoaded();
        
        $('#frmLoadedIn_btnSave').removeAttr('disabled');
        $('#frmLoadedIn_btnCancel').removeAttr('disabled');

        $('#frmLoadedIn_btnSave').removeAttr('onclick');
        $('#frmLoadedIn_btnSave').attr('onclick', "GateEntry_SaveData('loadedinedit')");
        $('#DivfrmEmptyOut').hide();

        
    }
    else if (mode.toLowerCase() === 'loadedineditfull') {
        ClearEmptyOutOrLoadedOutFrm();
        UpdateLoadedIn_Emptyout(gateEntryData);
        EditLoaded();

        //$('#frmEmptyOut_txtDateOut').val(new Date(gateEntryData[0].GateEntryOutDate).toISOString().slice(0, 10));
        $('#frmEmptyOut_txtDateOut').val(gateEntryData[0].GateEntryOutDate.slice(0, 10));
        $('#frmEmptyOut_txtOutTime').val(gateEntryData[0].VehicleOutTime);

        $('#frmEmptyOut_txtVehicleEmptyWeight').val(gateEntryData[0].EmptyWeight);
        $('#frmEmptyOut_txtWeightmentSlipNoLoaded').val(gateEntryData[0].WeightmentSlipNumberOut);
        $('#frmEmptyOut_txtRemarks').val(gateEntryData[0].OutRemarks);
        $('#frmEmptyOut_ddlOutType').val(gateEntryData[0].OutType);
        $('#frmEmptyOut_txtOutReason').val(gateEntryData[0].OutReason);
        $('#RowfrmEmptyOut_fileVehiclePhoto').hide();

        

        $('#frmEmptyOut_txtVehicleEmptyWeight').removeAttr('readonly');
        $('#frmEmptyOut_txtWeightmentSlipNoLoaded').removeAttr('readonly');
        $('#frmEmptyOut_txtRemarks').removeAttr('readonly');
        $('#frmEmptyOut_txtOutReason').removeAttr('readonly');

        $('#frmEmptyOut_ddlOutType').removeAttr('disabled');
        $('#frmEmptyOut_btnSave').removeAttr('disabled');

        $('#frmEmptyOut_btnSave').removeAttr('onclick');
        $('#frmEmptyOut_btnSave').attr('onclick', "GateEntry_SaveData('loadedineditfull')");

    }
    else if (mode.toLowerCase() === 'emptyinedit') {
        ClearEmptyOutOrLoadedOutFrm();
        UpdateEmptyIn_loadedout(gateEntryData);
        EditEmptyIn();

        $('#frmEmptyIn_btnSave').removeAttr('disabled');
        $('#frmEmptyIn_btnCancel').removeAttr('disabled');


        $('#frmEmptyIn_btnSave').removeAttr('onclick');
        $('#frmEmptyIn_btnSave').attr('onclick', "GateEntry_SaveData('emptyinedit')");

        $('#DivfrmLoadedOut').hide();

    }
    else if (mode.toLowerCase() === 'emptyineditfull') {
        ClearEmptyOutOrLoadedOutFrm();
        UpdateEmptyIn_loadedout(gateEntryData);
        EditEmptyIn();

        $('#frmLoadedOut_txtVehicleLoadedWeight').val(gateEntryData[0].LoadedWeight);
        $('#frmLoadedOut_txtWeightmentSlipNoLoadedOut').val(gateEntryData[0].WeightmentSlipNumberOut);
        $('#frmLoadedOut_txtNetWeightLoadedOut').val(parseFloat(gateEntryData[0].NetWeight).toFixed(2));
        $('#frmLoadedOut_txtGoodsDescription').val(gateEntryData[0].GoodDescription);
        $('#frmLoadedOut_txtQty').val(gateEntryData[0].Qty);
        GateEntryService.GetUOMMasterList().then(function (response) {

            BindSelectList($('#frmLoadedOut_ddlUOM')[0], response.map((item) => ({ Code: item.UOM, Desp: item.UOM, VendorName: '' })));
            $('#frmLoadedOut_ddlUOM').val(gateEntryData[0].UOM);
            $('#frmLoadedOut_ddlUOM').select2({
                width: '-webkit-fill-available'
            });

        });


        GateEntryService.GateEntryCategoryOut().then(function (response) {
            BindSelectList($('#frmLoadedOut_ddlDocumentType')[0], response.map((item) => ({ Code: item.Desp, Desp: item.Desp, VendorName: '' })));
            $('#frmLoadedOut_ddlDocumentType').val(gateEntryData[0].DocumentType);
            $('#frmLoadedOut_ddlDocumentType').select2({
                width: '-webkit-fill-available'
            });
            frmLoadedOut_ddlDocumentType('view');
            GateEntry_changeDocumentType();
        });


        $('#frmLoadedOut_txtCustomerName').val(gateEntryData[0].VendorName);

        $('#frmLoadedOut_txtDocumentNo').val(gateEntryData[0].DocNo);
        $('#frmLoadedOut_txtDocumentDate').val(geFormatGateEntryInputDate(gateEntryData[0].InvoiceDate));

        $('#frmLoadedOut_txtManualDocNo').val(gateEntryData[0].ManualDocNo);
        $('#frmLoadedOut_txtGRNo').val(gateEntryData[0].GRNo);

        

        $('#frmLoadedOut_txtEWayBillNo').val(gateEntryData[0].EwaybillNo);
        $('#frmLoadedOut_txtEWayBillDate').val(gateEntryData[0].EwaybillDate);
        $('#frmLoadedOut_txtRemarks').val(gateEntryData[0].OutRemarks);
        $('#frmLoadedOut_ddlOutType').val(gateEntryData[0].OutType);
        $('#frmLoadedOut_txtOutReason').val(gateEntryData[0].OutReason);


        $('#RowLoadedOut_fileVehiclePhoto').hide();
        $('#RowLoadedOut_fileGoodsPhoto').hide();
        $('#RowLoadedOut_fileInvoicePhoto').hide();
        $('#RowLoadedOut_fileOtherPhoto').hide();
        
        $('#frmLoadedOut_txtOutReason').removeAttr('readonly');

        $('#frmLoadedOut_ddlOutType').removeAttr('disabled');

        //$('#frmLoadedOut_btnSave').attr('disabled', 'disabled')
        $('#frmLoadedOut_btnSave').removeAttr('disabled');

        $('#frmLoadedOut_btnSave').removeAttr('onclick');
        $('#frmLoadedOut_btnSave').attr('onclick', "GateEntry_SaveData('emptyineditfull')");
    }
}

function EditLoaded() {
    $('#frmLoadedIn_txtModeOfTransportation').removeAttr('disabled');
    $('#frmLoadedIn_txtVehicleInTime').removeAttr('readonly');
    $('#frmLoadedIn_txtVehicleNo').removeAttr('readonly');
    $('#frmLoadedIn_txtDriverName').removeAttr('readonly');
    $('#frmLoadedIn_txtDriverNo').removeAttr('readonly');
    $('#frmLoadedIn_ddlTransporterName').removeAttr('readonly');

    $('#frmLoadedIn_txtReportingDatetime').removeAttr('readonly');

    $('#frmLoadedIn_txtWeightmentSlipNoLoaded').removeAttr('readonly');
    $('#frmLoadedIn_txtVehicleLoadedWeight').removeAttr('readonly');
    $('#frmLoadedIn_txtGoodsDescription').removeAttr('readonly');
    $('#frmLoadedIn_txtQTY').removeAttr('readonly');
    $('#frmLoadedIn_txtUOM').removeAttr('readonly');
    //$('#frmLoadedIn_ddlDocumentType').removeAttr('readonly');

    $('#frmLoadedIn_txtVendorName').removeAttr('readonly');

    $('#frmLoadedIn_txtDocumentNo').removeAttr('readonly');
    $('#frmLoadedIn_txtDocumentDate').removeAttr('readonly');
    $('#frmLoadedIn_txtEWayBillNo').removeAttr('readonly');
    $('#frmLoadedIn_txtEWayBillDate').removeAttr('readonly');
    $('#frmLoadedIn_txtRemarks').removeAttr('readonly');

    $('#frmLoadedIn_txtChassisNo').removeAttr('readonly');
    $('#frmLoadedIn_txtRCNo').removeAttr('readonly');
    $('#frmLoadedIn_txtRCExpiredDate').removeAttr('readonly');
    $('#frmLoadedIn_txtDriverLicenseNo').removeAttr('readonly');
    $('#frmLoadedIn_txtDriverLicenseExpiredDate').removeAttr('readonly');
    $('#frmLoadedIn_txtDriverAadharNo').removeAttr('readonly');

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'TokenApplicable').PerameterValue === 'Y')
    {
            $('#frmLoadedIn_txtTokenNo').attr('readonly', 'readonly');
            $('#frmLoadedIn_txtReportingDatetime').attr('readonly', 'readonly');
    }

    $('#frmLoadedIn_ddlDocumentType').removeAttr('disabled');
    $('#frmLoadedIn_txtUOM').removeAttr('disabled');
}
function EditEmptyIn() {
    $('#frmEmptyIn_txtModeOfTransportation').removeAttr('disabled');
    $('#frmEmptyIn_txtVehicleNo').removeAttr('readonly')
    $('#frmEmptyIn_txtDriverName').removeAttr('readonly')
    $('#frmEmptyIn_txtDriverNo').removeAttr('readonly')
    $('#frmEmptyIn_ddlTransporterName').removeAttr('readonly')
    $('#frmEmptyIn_txtRemarks').removeAttr('readonly')
    $('#frmEmptyIn_txtVehicleEmptyWeight').removeAttr('readonly')
    $('#frmEmptyIn_txtWeightmentSlipNoEmpty').removeAttr('readonly')
    $('#frmEmptyIn_txtReportingDatetime').removeAttr('readonly')
    $('#frmEmptyIn_txtChassisNo').removeAttr('readonly');
    $('#frmEmptyIn_txtRCNo').removeAttr('readonly');
    $('#frmEmptyIn_txtRCExpiredDate').removeAttr('readonly');
    $('#frmEmptyIn_txtDriverLicenseNo').removeAttr('readonly');
    $('#frmEmptyIn_txtDriverLicenseExpiredDate').removeAttr('readonly');
    $('#frmEmptyIn_txtDriverAadharNo').removeAttr('readonly');

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'TokenApplicable').PerameterValue === 'Y') {
        $('#frmEmptyIn_txtTokenNo').attr('readonly', 'readonly');
        $('#frmEmptyIn_txtReportingDatetime').attr('readonly', 'readonly');
    }
}
function LockDocumntFutureDate() {
    let maxDate = new Date().toISOString().slice(0, 10);
    let MinDate = new Date()///.toISOString().slice(0, 10);
    MinDate.setDate(MinDate.getDate() - 30);
    MinDate=MinDate.toISOString().slice(0, 10);

    $('#frmLoadedOut_txtDocumentDate').attr('max', maxDate);
    $('#frmLoadedIn_txtDocumentDate').attr('max', maxDate);
    $('#frmLoadedIn_txtEWayBillDate').attr('max', maxDate);
    $('#frmLoadedOut_txtEWayBillDate').attr('max', maxDate);
    $('#frmLoadedIn_txtReportingDatetime').attr('max', maxDate);
    $('#frmEmptyIn_txtReportingDatetime').attr('max', maxDate);
    //$('#txtFromDate').attr('max', maxDate);
    //$('#txtToDate').attr('max', maxDate);

    $('#frmLoadedOut_txtDocumentDate').attr('min', MinDate);
    $('#frmLoadedIn_txtDocumentDate').attr('min', MinDate);
    $('#frmLoadedIn_txtEWayBillDate').attr('min', MinDate);
    $('#frmLoadedOut_txtEWayBillDate').attr('min', MinDate);

    $('#frmLoadedOut_txtDocumentDate').attr('value', maxDate);
    $('#frmLoadedIn_txtDocumentDate').attr('value', maxDate);
}
function GateEntry_InitSelectMachineToGetWeightControl(outputTextElementID) {
    let url = baseUrl + '/CustomControl/SelectMachineToGetWeightControl';

    $('#GateEntry_DivSelectMachineToGetWeightControl').load(url, { OutputTextElementID: outputTextElementID });

}
function EnableScaleWeight() {
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightByScale').PerameterValue === 'Y') {
        // Enable the scale weight button
        $('#btnScaleWeigh_frmEmptyIn_txtVehicleEmptyWeight').show();
        $('#btnScaleWeigh_frmLoadedOut_txtVehicleLoadedWeight').show();
        $('#btnScaleWeigh_frmLoadedIn_txtVehicleLoadedWeight').show();
        $('#btnScaleWeigh_frmEmptyOut_txtVehicleEmptyWeight').show();
    } else {
        $('#btnScaleWeigh_frmEmptyIn_txtVehicleEmptyWeight').hide();
        $('#btnScaleWeigh_frmLoadedOut_txtVehicleLoadedWeight').hide();
        $('#btnScaleWeigh_frmLoadedIn_txtVehicleLoadedWeight').hide();
        $('#btnScaleWeigh_frmEmptyOut_txtVehicleEmptyWeight').hide();
    }
    
}
function LoadListDriverDetailsByVehicleNo() {

    GateEntryService.GetDriverDetailsByVehicleNo("GETVEHICLENO", "0").then(function (response) {
        const goodsList = response.map((item) => ({ Desp: item.VehicleNo }));
        AutoSuggestionControl.SetUpAutoSuggestion(
            $('#frmLoadedIn_txtVehicleNo'),
            $('#frmLoadedIn_txtVehicleNo_List'),
            goodsList,
            'StartWith',
            true,
            function (selectedItem) {
                if (selectedItem && selectedItem.Desp) {
                    GateEntryService.GetDriverDetailsByVehicleNo("CHECKVEHICLEINSTATUS", selectedItem.Desp).then(function (RespCheckVehicleStatus) {
                        if (RespCheckVehicleStatus[0].Status == 'Y') {
                            GateEntryService.GetDriverDetailsByVehicleNo("DRIVERDETAILS", selectedItem.Desp).then(function (RespVehicleDetails) {
                                if (RespVehicleDetails.length > 0) {
                                    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
                                        $('#frmLoadedIn_txtChassisNo').val(RespVehicleDetails[0].ChassisNo);
                                        $('#frmLoadedIn_txtRCNo').val(RespVehicleDetails[0].RCNo);
                                        $('#frmLoadedIn_txtRCExpiredDate').val(new Date(RespVehicleDetails[0].RCExpiredDate).toISOString().slice(0, 10));

                                        $('#frmLoadedIn_txtDriverLicenseNo').val(RespVehicleDetails[0].DriverLicenseNo);
                                        $('#frmLoadedIn_txtDriverLicenseExpiredDate').val(new Date(RespVehicleDetails[0].DriverLicenseExpiredDate).toISOString().slice(0, 10));
                                        $('#frmLoadedIn_txtDriverAadharNo').val(RespVehicleDetails[0].DriverAadharNo);

                                    }
                                    $('#frmLoadedIn_txtDriverName').val(RespVehicleDetails[0].DriverName);
                                    $('#frmLoadedIn_txtDriverNo').val(RespVehicleDetails[0].DriverMobile);
                                    $('#frmLoadedIn_ddlTransporterName').val(RespVehicleDetails[0].TransporterName);

                                    $('#frmLoadedIn_txtTokenNo').val(RespVehicleDetails[0].TokenNo);
                                    $('#frmLoadedIn_txtReportingDatetime').val(RespVehicleDetails[0].ReportingDatetime);
                                }
                            });
                        } else {
                            toastr.error(RespCheckVehicleStatus[0].Msg);
                        }

                    });
                }
            }
        );
    });

    GateEntryService.GetDriverDetailsByVehicleNo("GETVEHICLENO", "0").then(function (response) {
        const goodsList = response.map((item) => ({ Desp: item.VehicleNo }));
        AutoSuggestionControl.SetUpAutoSuggestion(
            $('#frmEmptyIn_txtVehicleNo'),
            $('#frmEmptyIn_txtVehicleNo_List'),
            goodsList,
            'StartWith',
            true,
            function (selectedItem) {
                if (selectedItem && selectedItem.Desp) {
                    GateEntryService.GetDriverDetailsByVehicleNo("CHECKVEHICLEINSTATUS", selectedItem.Desp).then(function (RespCheckVehicleStatus) {
                        if (RespCheckVehicleStatus[0].Status == 'Y') {
                            GateEntryService.GetDriverDetailsByVehicleNo("DRIVERDETAILS", selectedItem.Desp).then(function (RespVehicleDetails) {
                                if (RespVehicleDetails.length > 0) {

                                    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
                                        $('#frmEmptyIn_txtChassisNo').val(RespVehicleDetails[0].ChassisNo);
                                        $('#frmEmptyIn_txtRCNo').val(RespVehicleDetails[0].RCNo);
                                        $('#frmEmptyIn_txtRCExpiredDate').val(new Date(RespVehicleDetails[0].RCExpiredDate).toISOString().slice(0, 10));
                                        $('#frmEmptyIn_txtDriverLicenseNo').val(RespVehicleDetails[0].DriverLicenseNo);
                                        $('#frmEmptyIn_txtDriverLicenseExpiredDate').val(new Date(RespVehicleDetails[0].DriverLicenseExpiredDate).toISOString().slice(0, 10));
                                        $('#frmEmptyIn_txtDriverAadharNo').val(RespVehicleDetails[0].DriverAadharNo);
                                    }

                                    $('#frmEmptyIn_txtDriverName').val(RespVehicleDetails[0].DriverName);
                                    $('#frmEmptyIn_txtDriverNo').val(RespVehicleDetails[0].DriverMobile);
                                    $('#frmEmptyIn_ddlTransporterName').val(RespVehicleDetails[0].TransporterName);

                                    $('#frmEmptyIn_txtTokenNo').val(RespVehicleDetails[0].TokenNo);
                                    $('#frmEmptyIn_txtReportingDatetime').val(RespVehicleDetails[0].ReportingDatetime);
                                }
                            });
                        } else {
                            toastr.error(RespCheckVehicleStatus[0].Msg);
                        }
                    });
                }
            }
        );
    });

    GateEntryService.GetDriverDetailsByVehicleNo("GETVEHICLETOKENNO", "0").then(function (response) {
        const goodsList = response.map((item) => ({ Desp: item.TokenNo }));
        AutoSuggestionControl.SetUpAutoSuggestion(
            $('#frmEmptyIn_txtTokenNo'),
            $('#frmEmptyIn_txtTokenNo_List'),
            goodsList,
            'StartWith',
            true,
            function (selectedItem) {
                if (selectedItem && selectedItem.Desp) {
                    GateEntryService.GetDriverDetailsByVehicleNo("CHECKVEHICLEINSTATUS", selectedItem.Desp).then(function (RespCheckVehicleStatus) {
                        if (RespCheckVehicleStatus[0].Status == 'Y') {
                            GateEntryService.GetDriverDetailsByVehicleNo("DRIVERDETAILS", selectedItem.Desp).then(function (RespVehicleDetails) {
                                if (RespVehicleDetails.length > 0) {

                                    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
                                        $('#frmEmptyIn_txtChassisNo').val(RespVehicleDetails[0].ChassisNo);
                                        $('#frmEmptyIn_txtRCNo').val(RespVehicleDetails[0].RCNo);
                                        $('#frmEmptyIn_txtRCExpiredDate').val(new Date(RespVehicleDetails[0].RCExpiredDate).toISOString().slice(0, 10));
                                        $('#frmEmptyIn_txtDriverLicenseNo').val(RespVehicleDetails[0].DriverLicenseNo);
                                        $('#frmEmptyIn_txtDriverLicenseExpiredDate').val(new Date(RespVehicleDetails[0].DriverLicenseExpiredDate).toISOString().slice(0, 10));
                                        $('#frmEmptyIn_txtDriverAadharNo').val(RespVehicleDetails[0].DriverAadharNo);
                                    }

                                    $('#frmEmptyIn_txtDriverName').val(RespVehicleDetails[0].DriverName);
                                    $('#frmEmptyIn_txtDriverNo').val(RespVehicleDetails[0].DriverMobile);
                                    $('#frmEmptyIn_ddlTransporterName').val(RespVehicleDetails[0].TransporterName);

                                    $('#frmEmptyIn_txtVehicleNo').val(RespVehicleDetails[0].VehicleNo);
                                    $('#frmEmptyIn_txtReportingDatetime').val(RespVehicleDetails[0].ReportingDatetime);
                                }
                            });
                        } else {
                            toastr.error(RespCheckVehicleStatus[0].Msg);
                        }
                    });
                }
            }
        );
    });

    GateEntryService.GetDriverDetailsByVehicleNo("GETVEHICLETOKENNO", "0").then(function (response) {
        const goodsList = response.map((item) => ({ Desp: item.TokenNo }));
        AutoSuggestionControl.SetUpAutoSuggestion(
            $('#frmLoadedIn_txtTokenNo'),
            $('#frmLoadedIn_txtTokenNo_List'),
            goodsList,
            'StartWith',
            true,
            function (selectedItem) {
                if (selectedItem && selectedItem.Desp) {
                    GateEntryService.GetDriverDetailsByVehicleNo("CHECKVEHICLEINSTATUS", selectedItem.Desp).then(function (RespCheckVehicleStatus) {
                        if (RespCheckVehicleStatus[0].Status == 'Y') {
                            GateEntryService.GetDriverDetailsByVehicleNo("DRIVERDETAILS", selectedItem.Desp).then(function (RespVehicleDetails) {
                                if (RespVehicleDetails.length > 0) {
                                    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
                                        $('#frmLoadedIn_txtChassisNo').val(RespVehicleDetails[0].ChassisNo);
                                        $('#frmLoadedIn_txtRCNo').val(RespVehicleDetails[0].RCNo);
                                        $('#frmLoadedIn_txtRCExpiredDate').val(new Date(RespVehicleDetails[0].RCExpiredDate).toISOString().slice(0, 10));

                                        $('#frmLoadedIn_txtDriverLicenseNo').val(RespVehicleDetails[0].DriverLicenseNo);
                                        $('#frmLoadedIn_txtDriverLicenseExpiredDate').val(new Date(RespVehicleDetails[0].DriverLicenseExpiredDate).toISOString().slice(0, 10));
                                        $('#frmLoadedIn_txtDriverAadharNo').val(RespVehicleDetails[0].DriverAadharNo);

                                    }
                                    $('#frmLoadedIn_txtDriverName').val(RespVehicleDetails[0].DriverName);
                                    $('#frmLoadedIn_txtDriverNo').val(RespVehicleDetails[0].DriverMobile);
                                    $('#frmLoadedIn_ddlTransporterName').val(RespVehicleDetails[0].TransporterName);

                                    $('#frmLoadedIn_txtVehicleNo').val(RespVehicleDetails[0].VehicleNo);
                                    $('#frmLoadedIn_txtReportingDatetime').val(RespVehicleDetails[0].ReportingDatetime);
                                }
                            });
                        } else {
                            toastr.error(RespCheckVehicleStatus[0].Msg);
                        }

                    });
                }
            }
        );
    });
}
function LoadListOutReason() {
    GateEntryService.GetDriverDetailsByVehicleNo("GETOUTREASON", "0").then(function (response) {
        const OutReasonList = response.map((item) => ({ Desp: item.OutReason }));
        AutoSuggestionControl.SetUpAutoSuggestion(
            $('#frmEmptyOut_txtOutReason'),
            $('#frmEmptyOut_txtOutReason_List'),
            OutReasonList,
            'StartWith',
            true
        );
    });
    GateEntryService.GetDriverDetailsByVehicleNo("GETOUTREASON", "0").then(function (response) {
        const OutReasonList = response.map((item) => ({ Desp: item.OutReason }));
        AutoSuggestionControl.SetUpAutoSuggestion(
            $('#frmLoadedOut_txtOutReason'),
            $('#frmLoadedOut_txtOutReason_List'),
            OutReasonList,
            'StartWith',
            true
        );
    });
}
function applyAlphaNumUppercase(selector) {
    document.querySelectorAll(selector).forEach(input => {

        // Block invalid characters on keypress
        input.addEventListener("keypress", function (e) {
            const char = String.fromCharCode(e.which);
            if (!/[a-zA-Z0-9]/.test(char)) {
                e.preventDefault();
            }
        });

        // Handle paste & enforce uppercase
        input.addEventListener("input", function () {
            this.value = this.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        });

    });
}
function GateEnty_PrintPreviewToken(Code) {
    GateEntryService.GetGateEntryDetails(Code).then(function (response) {
        if (!response || response.length === 0) {
            toastr.error('No data found for this token');
            return;
        }

        const data = response[0];
        //const companyName = sessionStorage.getItem('CompanyName') || 'Vimla Novochem Private Limited';
        const companyName = data.CompanyName || 'mVimla Novochem Private Limited';
        //const companyAddress = sessionStorage.getItem('CompanyAddress') || 'Plot No:1059/2, 1178/4, 1178/5, 1178/6, 1180/1, 1180/2, 1180/3 and 1180/4,<br>Village–Bhothi, Tehsil–Khairagarh, Distt:Khairagarh, Chhukhadan Gandai, Chhattisgarh';
        const companyAddress = data.CompanyAddress || 'mPlot No:1059/2, 1178/4, 1178/5, 1178/6, 1180/1, 1180/2, 1180/3 and 1180/4,<br>Village–Bhothi, Tehsil–Khairagarh, Distt:Khairagarh, Chhukhadan Gandai, Chhattisgarh';
        
        // Format dates
        //const currentDate = new Date().toLocaleDateString('en-IN');
        //const currentTime = new Date().toLocaleTimeString('en-IN', { hour12: false });
        //
        const currentDate = new Date(data.ReportingDatetime).toLocaleDateString('en-IN');
        const currentTime = new Date(data.ReportingDatetime).toLocaleTimeString('en-IN', { hour12: false });

        const rcExpiredDate = data.RCExpiredDate ? new Date(data.RCExpiredDate).toLocaleDateString('en-IN') : '';
        const licenseExpiredDate = data.DriverLicenseExpiredDate ? new Date(data.DriverLicenseExpiredDate).toLocaleDateString('en-IN') : '';
        
        const html = `
            <div style="border: 2px solid #000; padding: 20px; max-width: 800px; margin: 20px auto; font-family: Arial, sans-serif;">
                <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 24px; font-weight: bold;">${companyName}</h2>
                    <p style="margin: 5px 0; font-size: 12px;">${companyAddress}</p>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 15px 0; font-size: 20px;">Token Slip</h3>
                        <p style="margin: 5px 0;"><strong>Token No:</strong> ${data.TokenNo || ''}</p>
                    </div>
                    <div style="flex: 1; text-align: right;">
                        <h3 style="margin: 0 0 15px 0; font-size: 20px;">Vehicle No: ${data.VehicleNo || ''}</h3>
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${currentDate} <strong>Time:</strong>${currentTime}</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <table style="width: 100%; font-size: 14px;">
                        <tr>
                            <td style="padding: 5px 0; width: 35%;"><strong>Chesis No:</strong></td>
                            <td style="padding: 5px 0;">${data.ChassisNo || ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;"><strong>RCNo:</strong></td>
                            <td style="padding: 5px 0;">${data.RCNo || ''}</td>
                            <td style="padding: 5px 0; text-align: right;"><strong>Expired Dt:</strong> ${rcExpiredDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;"><strong>Driver Name:</strong></td>
                            <td style="padding: 5px 0; font-weight: bold;">${data.DriverName || ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;"><strong>Driver License:</strong></td>
                            <td style="padding: 5px 0;">${data.DriverLicenseNo || ''}</td>
                            <td style="padding: 5px 0; text-align: right;"><strong>Expired Dt:</strong> ${licenseExpiredDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;"><strong>Driver Ph.No:</strong></td>
                            <td style="padding: 5px 0;">${data.DriverMobile || ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;"><strong>Driver Aadhar No:</strong></td>
                            <td style="padding: 5px 0;">${data.DriverAadharNo || ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;"><strong>Transporter Name:</strong></td>
                            <td style="padding: 5px 0;">${data.OtherTransporterName || ''}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #ccc;">
                    <p style="margin: 5px 0; font-size: 12px;"><strong>Created By:</strong> ${JSON.parse(sessionStorage.getItem('UserDetails'))[0].UserID || 'User Name'}</p>
                </div>
            </div>
        `;
        
        // Open print preview window
        const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
        if (!printWindow) {
            toastr.error('Please allow pop-ups for this site');
            return;
        }
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Token Slip - ${data.TokenNo || ''}</title>
                <style>
                    @media print {
                        body { margin: 0; padding: 10px; }
                        @page { size: A4; margin: 10mm; }
                    }
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0;
                        padding: 0;
                    }
                </style>
            </head>
            <body>
                ${html}
                <script>
                    window.onload = function() {
                        window.focus();
                        setTimeout(function() {
                            window.print();
                        }, 250);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }).catch(function(error) {
        console.error('Error fetching token details:', error);
        toastr.error('Failed to load token details');
    });
}
function ddlGodown() {
    $('#DivGodown').hide()
    GateEntryService.getDll('GETGODOWN').then(function (response) {
        BindSelectList2($('#ddlGodown')[0], response.map((item) => ({ Code: item.Code, Desp: item.GodownName})));

        let loginGodownMaster_Code = JSON.parse(sessionStorage.getItem('authKey')).WebERPLoginGodownMaster_Code;

        LoginGodownMaster_Code = loginGodownMaster_Code;

        $('#ddlGodown').val(LoginGodownMaster_Code);
        
        $('#ddlGodown').select2({
            width: '-webkit-fill-available'
        });

        if (LoginGodownMaster_Code>0) {
            $('#DivGodown').show();
            GateEntryGirdByDates();
        }
    });
}
function GateEntry_ExportExecl() {
    const hiddenFields = [
        "Action", "Code", "GodownMaster_Code", "Hour", "Out Reason"
        // Add more field names to hide as needed
    ];
    ExportToExcelControl.ExportToExcel(ExcelExportDataArry, hiddenFields, "GateEntry");
}
function BindddlVehiclesStatusInFectory() {
    let ddlVehiclesStatusInFectoryArray = [];
    ddlVehiclesStatusInFectoryArray.push({ Code: "all", Desp: "All vehicles in progress" });
    ddlVehiclesStatusInFectoryArray.push({ Code: "ALIN", Desp: "All Inward" });
    ddlVehiclesStatusInFectoryArray.push({ Code: "AEIN", Desp: "All Outward" });
    ddlVehiclesStatusInFectoryArray.push({ Code: "LIN", Desp: "Loaded IN (completed)" });
    ddlVehiclesStatusInFectoryArray.push({ Code: "EIN", Desp: "Empty IN (completed)" });
    ddlVehiclesStatusInFectoryArray.push({ Code: "PLIN", Desp: "Loaded IN (in progress)" });
    ddlVehiclesStatusInFectoryArray.push({ Code: "PEIN", Desp: "Empty IN (in progress)" });
    ddlVehiclesStatusInFectoryArray.push({ Code: "PAll", Desp: "All Vehicles in progress" });
    ddlVehiclesStatusInFectoryArray.push({ Code: "RAll", Desp: "All Reject" });
    ddlVehiclesStatusInFectoryArray.push({ Code: "REOut", Desp: "Empty Out (Reject)" });
    ddlVehiclesStatusInFectoryArray.push({ Code: "RLOut", Desp: "Loaded Out (Reject)" });


    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'TokenApplicable').PerameterValue === 'Y') {
        ddlVehiclesStatusInFectoryArray.push({ Code: "TAll", Desp: "All Token Entry" });
        ddlVehiclesStatusInFectoryArray.push({ Code: "TCon", Desp: "Token Entry (Converted)" });
        ddlVehiclesStatusInFectoryArray.push({ Code: "TBal", Desp: "Token Entry (Balance)" });
    }


    let option = '';
    $.each(ddlVehiclesStatusInFectoryArray, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    $('#ddlVehiclesStatusInFectory')[0].innerHTML = option;


    //$('#ddlGodown').select2({
    //    width: '-webkit-fill-available'
    //});
}
function CopyWeightmentSlip(transactionType) {

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'CopyWeightmentSlip').PerameterValue === 'Y') {
        if (transactionType === 'loadedOut') {

            // Copy from Empty In to Loaded Out
            let weightmentSlipValue = $('#frmEmptyIn_txtWeightmentSlipNoEmpty').val();
            $('#frmLoadedOut_txtWeightmentSlipNoLoadedOut').val(weightmentSlipValue);

            //if (weightmentSlipValue) {
            //    toastr.success('Weightment Slip No copied successfully');
            //}
        }
        else if (transactionType === 'emptyOut') {
            // Copy from Loaded In to Empty Out frmEmptyIn_txtWeightmentSlipNoEmpty
            let weightmentSlipValue = $('#frmLoadedIn_txtWeightmentSlipNoLoaded').val();
            $('#frmEmptyOut_txtWeightmentSlipNoLoaded').val(weightmentSlipValue);

            //if (weightmentSlipValue) {
            //    toastr.success('Weightment Slip No copied successfully');
            //}
        }
    }

    
}
function GateEntry_changeDocumentType() {
    G_TableName = '';
    G_TableCode = 0;
    $('#frmLoadedOut_txtCustomerName').removeAttr('readonly');
    $('#frmLoadedOut_txtGoodsDescription').removeAttr('readonly');
    $('#frmLoadedOut_txtQty').removeAttr('readonly');
    let F_GateEntryType_Desp = $('#frmLoadedOut_ddlDocumentType').val();
    let IsMultipleDocument = false;
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'MultipleDocument').PerameterValue === 'Y') {
        IsMultipleDocument = true;
    }

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'AutoFatchDocumentDetails').PerameterValue === 'Y') {

        GateEntryService.GetGateEntryERPDocumentDetails("0", F_GateEntryType_Desp, 'Y', LoginGodownMaster_Code).then(function (response) {
            const DocList = response.map((item) => ({ Desp: item.InvoiceNo }));
            AutoSuggestionControl.SetUpAutoSuggestion(
                $('#frmLoadedOut_txtDocumentNo'),
                $('#frmLoadedOut_txtDocumentNo_List'),
                DocList,
                'StartWith',
                true,
                function (selectedItem) {
                    if (selectedItem) {
                        let DocNos = ''
                        if (IsMultipleDocument == true) {
                            DocNos = selectedItem.map(x => x.Desp).join(',');
                        }
                        else {
                            DocNos = selectedItem.Desp;
                        }
                        GateEntryService.GetGateEntryERPDocumentDetails(DocNos, F_GateEntryType_Desp, 'N', LoginGodownMaster_Code).then(function (RespDocumentDetails) {
                            if (RespDocumentDetails.length > 0) {

                                const sumtotalWeight = RespDocumentDetails.reduce((sum, item) => {
                                    // Adjust keys if API uses a slightly different name (TotalWegit vs TotalWeight)
                                    const raw = item.TotalWeight?? 0;
                                    // normalize string (remove thousands separators) and parse
                                    const parsed = parseFloat(String(raw).replace(/,/g, '')) || 0;
                                    return sum + parsed;
                                }, 0);


                                $('#frmLoadedOut_txtCustomerName').val(RespDocumentDetails[0].PartyName)
                                $('#frmLoadedOut_txtGoodsDescription').val(RespDocumentDetails[0].GoodsDesp)
                                $('#frmLoadedOut_txtQty').val(parseFloat(sumtotalWeight).toFixed(2))
                                $('#frmLoadedOut_txtGRNo').val(RespDocumentDetails[0].GRNo)
                                $('#frmLoadedOut_ddlUOM').val(RespDocumentDetails[0].UOM).trigger('change')
                                $('#frmLoadedOut_txtEWayBillNo').val(RespDocumentDetails[0].EWayBillNo)
                                if (RespDocumentDetails[0].EWayBillDate) {
                                    $('#frmLoadedOut_txtEWayBillDate').val(RespDocumentDetails[0].EWayBillDate.split('T')[0]);
                                }
                                if (RespDocumentDetails[0].DocumentDate) {
                                    $('#frmLoadedOut_txtDocumentDate').val(RespDocumentDetails[0].DocumentDate.split('T')[0]);
                                }

                               // G_TableName = RespDocumentDetails[0].TableName;
                               // G_TableCode = RespDocumentDetails[0].Code;


                                $('#frmLoadedOut_txtCustomerName').attr('readonly', 'readonly');
                                $('#frmLoadedOut_txtGoodsDescription').attr('readonly', 'readonly');
                                $('#frmLoadedOut_txtQty').attr('readonly', 'readonly');

                                G_GateEntryLinkedERPDocuments = RespDocumentDetails.map((x) => ({ TableName: x.TableName, TableCode: x.Code }));

                            } else {
                                toastr.error('Document Not Fund');
                                $('#frmLoadedOut_txtCustomerName').removeAttr('readonly');
                                $('#frmLoadedOut_txtGoodsDescription').removeAttr('readonly');
                                $('#frmLoadedOut_txtQty').removeAttr('readonly');
                                G_TableName = '';
                                G_TableCode = 0;
                            }
                        });
                    }
                }
                ,IsMultipleDocument
            );


            //MultiAutoSuggestionControl.SetUpMultiAutoSuggestion(
            //    $('#frmLoadedOut_txtDocumentNo'),
            //    $('#frmLoadedOut_txtDocumentNo_List'),
            //    DocList,
            //    'StartWith',
            //    true,
            //    function (selectedItem) {
            //        const codes = selectedItem.map(obj => obj.Desp).join(',');

            //        if (selectedItem && selectedItem.Desp) {

            //            GateEntryService.GetGateEntryERPDocumentDetails(selectedItem.Desp, F_GateEntryType_Desp, 'N', LoginGodownMaster_Code).then(function (RespDocumentDetails) {
            //                if (RespDocumentDetails.length > 0) {
            //                    $('#frmLoadedOut_txtCustomerName').val(RespDocumentDetails[0].PartyName)
            //                    $('#frmLoadedOut_txtGoodsDescription').val(RespDocumentDetails[0].GoodsDesp)
            //                    $('#frmLoadedOut_txtQty').val(RespDocumentDetails[0].TotalWeight)
            //                    $('#frmLoadedOut_txtGRNo').val(RespDocumentDetails[0].GRNo)
            //                    $('#frmLoadedOut_ddlUOM').val(RespDocumentDetails[0].UOM).trigger('change')

            //                    G_TableName = RespDocumentDetails[0].TableName;
            //                    G_TableCode = RespDocumentDetails[0].Code;


            //                    $('#frmLoadedOut_txtCustomerName').attr('readonly', 'readonly');
            //                    $('#frmLoadedOut_txtGoodsDescription').attr('readonly', 'readonly');
            //                    $('#frmLoadedOut_txtQty').attr('readonly', 'readonly');


            //                } else {
            //                    toastr.error('Document Not Fund');
            //                    $('#frmLoadedOut_txtCustomerName').removeAttr('readonly');
            //                    $('#frmLoadedOut_txtGoodsDescription').removeAttr('readonly');
            //                    $('#frmLoadedOut_txtQty').removeAttr('readonly');
            //                    G_TableName = '';
            //                    G_TableCode = 0;
            //                }
            //            });
            //        }
            //    }
            //);
        });
    } 
}
function GateEntry_GetNetWeight() {
    let EmptyWeight = 0;
    let LoadedWeight = 0;
    let NetWeight = 0;

    EmptyWeight = $('#frmEmptyIn_txtVehicleEmptyWeight').val();
    LoadedWeight = $('#frmLoadedOut_txtVehicleLoadedWeight').val();

    NetWeight = LoadedWeight - EmptyWeight;

    $('#frmLoadedOut_txtNetWeightLoadedOut').val(parseFloat(NetWeight).toFixed(2));
}
function chnage_VendorNameGetPOByVendor() {
    var VendorName = document.getElementById("frmLoadedIn_txtVendorName").value;
    if (VendorName == "") {
        BindSelectList($('#frmLoadedIn_ddlPurchaseOrder')[0], G_PendingPONOList.map((item) => ({ Code: item.PurchaseOrderMaster_Code, Desp: item.PONo, VendorName: item.VendorName })));
        $('#frmLoadedIn_ddlPurchaseOrder').select2({
            width: '-webkit-fill-available'
        });
    } else {
        // Filter POs by matching VendorName
        let PendingPONOList = G_PendingPONOList.filter((item) => item.VendorName === VendorName);

        BindSelectList($('#frmLoadedIn_ddlPurchaseOrder')[0], PendingPONOList.map((item) => ({ Code: item.PurchaseOrderMaster_Code, Desp: item.PONo, VendorName: item.VendorName })));
        $('#frmLoadedIn_ddlPurchaseOrder').select2({
            width: '-webkit-fill-available'
        });
    }
}
// Apply to all inputs with this class
applyAlphaNumUppercase(".alphanum-uppercase");
BindddlVehiclesStatusInFectory();
BizSolHelperFunction.HideOrShowConfigurationSettingBtn('btnGateEntyConfiguration');

function GateEntry_changeDocumentType_LoadedIn() {
    G_TableName = '';
    G_TableCode = 0;
    $('#frmLoadedIn_txtVendorName').removeAttr('readonly');
    $('#frmLoadedIn_txtGoodsDescription').removeAttr('readonly');
    $('#frmLoadedIn_txtQTY').removeAttr('readonly');
    let F_GateEntryType_Desp = $('#frmLoadedIn_ddlDocumentType').val();
    let IsMultipleDocument = false;
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'MultipleDocument').PerameterValue === 'Y') {
        IsMultipleDocument = true;
    }

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'AutoFatchDocumentDetails').PerameterValue === 'Y') {

        GateEntryService.GetGateEntryERPDocumentDetails("0", F_GateEntryType_Desp, 'Y', LoginGodownMaster_Code).then(function (response) {
            const DocList = response.map((item) => ({ Desp: item.InvoiceNo }));
            AutoSuggestionControl.SetUpAutoSuggestion(
                $('#frmLoadedIn_txtDocumentNo'),
                $('#frmLoadedIn_txtDocumentNo_List'),
                DocList,
                'StartWith',
                true,
                function (selectedItem) {
                    if (selectedItem) {
                        let DocNos = ''
                        if (IsMultipleDocument == true) {
                            DocNos = selectedItem.map(x => x.Desp).join(',');
                        }
                        else {
                            DocNos = selectedItem.Desp;
                        }
                        GateEntryService.GetGateEntryERPDocumentDetails(DocNos, F_GateEntryType_Desp, 'N', LoginGodownMaster_Code).then(function (RespDocumentDetails) {
                            if (RespDocumentDetails.length > 0) {

                                const sumtotalWeight = RespDocumentDetails.reduce((sum, item) => {
                                    const raw = item.TotalWeight ?? 0;
                                    const parsed = parseFloat(String(raw).replace(/,/g, '')) || 0;
                                    return sum + parsed;
                                }, 0);

                                $('#frmLoadedIn_txtVendorName').val(RespDocumentDetails[0].PartyName)
                                $('#frmLoadedIn_txtGoodsDescription').val(RespDocumentDetails[0].GoodsDesp)
                                $('#frmLoadedIn_txtQTY').val(parseFloat(sumtotalWeight).toFixed(2))
                                $('#frmLoadedIn_txtUOM').val(RespDocumentDetails[0].UOM).trigger('change')
                                $('#frmLoadedIn_txtEWayBillNo').val(RespDocumentDetails[0].EWayBillNo)
                                if (RespDocumentDetails[0].EWayBillDate) {
                                    $('#frmLoadedIn_txtEWayBillDate').val(RespDocumentDetails[0].EWayBillDate.split('T')[0]);
                                }
                                if (RespDocumentDetails[0].DocumentDate) {
                                    $('#frmLoadedIn_txtDocumentDate').val(RespDocumentDetails[0].DocumentDate.split('T')[0]);
                                }

                                $('#frmLoadedIn_txtVendorName').attr('readonly', 'readonly');
                                $('#frmLoadedIn_txtGoodsDescription').attr('readonly', 'readonly');
                                $('#frmLoadedIn_txtQTY').attr('readonly', 'readonly');

                                G_GateEntryLinkedERPDocuments = RespDocumentDetails.map((x) => ({ TableName: x.TableName, TableCode: x.Code }));

                            } else {
                                toastr.error('Document Not Fund');
                                $('#frmLoadedIn_txtVendorName').removeAttr('readonly');
                                $('#frmLoadedIn_txtGoodsDescription').removeAttr('readonly');
                                $('#frmLoadedIn_txtQTY').removeAttr('readonly');
                                G_TableName = '';
                                G_TableCode = 0;
                            }
                        });
                    }
                },
                IsMultipleDocument
            );
        });
    }
}

function ShowGateEntrySaveSuccessModal(msg) {
    $('#GateEntrySaveSuccessModal').remove();
    let modalHtml = `
        <div class="modal fade" id="GateEntrySaveSuccessModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title"><i class="fa fa-check-circle"></i>&nbsp;Entry Saved Successfully</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center">
                        <p class="mb-2">${msg}</p>
                        <div class="alert alert-warning mb-0 text-start">
                            <i class="fa fa-exclamation-triangle"></i>&nbsp;<strong>Note:</strong> Entry No. is auto-generated and <strong>cannot be decreased</strong> once saved.
                        </div>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <a class="btn btn-success px-4" data-bs-dismiss="modal">OK</a>
                    </div>
                </div>
            </div>
        </div>`;
    $('body').append(modalHtml);
    const modalEl = document.getElementById('GateEntrySaveSuccessModal');
    const bsModal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
    bsModal.show();
    modalEl.addEventListener('hidden.bs.modal', function () { $(this).remove(); });
}

function GateEntry_ShowEntryNoBanner(entryNo, operation) {
    $('#GateEntryFormEntryNoBanner').remove();
    if (!entryNo || parseInt(entryNo) <= 0) return;
    let opLabel = operation === 'out' ? 'Entry Out' : 'Update Entry';
    let bannerHtml = `<div id="GateEntryFormEntryNoBanner" class="alert alert-info alert-dismissible fade show mb-2 py-2">
        <i class="fa fa-info-circle"></i>&nbsp;<strong>${opLabel}</strong>&nbsp;&mdash;&nbsp;Entry No:&nbsp;<strong class="text-primary fs-5">${entryNo}</strong>
        <button type="button" class="btn-close py-2" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
    $('#DivGateEntryForm').prepend(bannerHtml);
}

document.addEventListener('weightScaleDataReceived', function (e) {
    const d = e.detail;
    if (!d) return;
    // Clear any existing weight-scale previews before handling new data
    ClearWeightScalePreviews();

    const outputID = d.outputTextElementID || '';

    if (d.weight) {
        if (outputID) {
            $('#' + outputID).val(d.weight);
        }
    }

    if (d.vehicleNo) {
        const vehicleFieldMap = {
            'frmEmptyIn_txtVehicleEmptyWeight': 'frmEmptyIn_txtVehicleNo',
            'frmLoadedIn_txtVehicleLoadedWeight': 'frmLoadedIn_txtVehicleNo',
            'frmLoadedOut_txtVehicleLoadedWeight': 'frmEmptyIn_txtVehicleNo',
            'frmEmptyOut_txtVehicleEmptyWeight': 'frmLoadedIn_txtVehicleNo'
        };
        const vehicleFieldID = vehicleFieldMap[outputID];
        if (vehicleFieldID) {
            let $vf = $('#' + vehicleFieldID);
            if ($vf.length && !$vf.prop('readonly') && !$vf.prop('disabled')) {
                $vf.val(d.vehicleNo);
            }
        }
    }

    const imageFieldMap = {
        'frmEmptyIn_txtVehicleEmptyWeight': 'frmEmptyIn_fileVehiclePhoto',
        'frmLoadedIn_txtVehicleLoadedWeight': 'frmLoadedIn_fileVehiclePhoto',
        'frmLoadedOut_txtVehicleLoadedWeight': 'frmLoadedOut_fileVehiclePhoto',
        'frmEmptyOut_txtVehicleEmptyWeight': 'frmEmptyOut_fileVehiclePhoto'
    };
    const previewContainerMap = {
        'frmEmptyIn_txtVehicleEmptyWeight': 'DivfrmEmptyIn_fileVehiclePhoto',
        'frmLoadedIn_txtVehicleLoadedWeight': 'DivfrmLoadedIn_fileVehiclePhoto',
        'frmLoadedOut_txtVehicleLoadedWeight': 'RowLoadedOut_fileVehiclePhoto',
        'frmEmptyOut_txtVehicleEmptyWeight': 'RowfrmEmptyOut_fileVehiclePhoto'
    };

    if (outputID && imageFieldMap[outputID]) {
        G_ScaleVehiclePhotoProvided = true;

        const imgSrc = d.frontImage || d.backImage || '';
        const previewDivID = previewContainerMap[outputID];

        if (previewDivID) {
            const previewID = previewDivID + '_WeightScalePreview';
            $('#' + previewID).remove();
            if (d.frontImage || d.backImage) {
                const previewHtml = '<div id="' + previewID + '" class="mt-1">'
                    + (d.frontImage ? '<img src="data:image/jpeg;base64,' + d.frontImage + '" style="max-height:80px;border:1px solid #ccc;margin-right:4px;" title="Front Camera" />' : '')
                    + (d.backImage ? '<img src="data:image/jpeg;base64,' + d.backImage + '" style="max-height:80px;border:1px solid #ccc;" title="Back Camera" />' : '')
                    + '</div>';
                $('#' + previewDivID).after(previewHtml);
            }
        }

        const base64ToByteArray = function (base64) {
            try {
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                return Array.from(bytes);
            } catch (ex) { return []; }
        };

        GateEntryImageDetail = [{
            imgVehicle: imgSrc ? base64ToByteArray(imgSrc) : [],
            imgMaterial: [],
            imgDoc: [],
            ImgOther: []
        }];
    }
});

function ClearWeightScalePreviews() {
    try {
        const previewContainers = [
            'DivfrmEmptyIn_fileVehiclePhoto',
            'DivfrmLoadedIn_fileVehiclePhoto',
            'RowLoadedOut_fileVehiclePhoto',
            'RowfrmEmptyOut_fileVehiclePhoto'
        ];
        previewContainers.forEach(function (id) {
            const previewID = id + '_WeightScalePreview';
            $('#' + previewID).remove();
        });
    } catch (ex) {
        // ignore
    }
}

function geFormatGateEntryInputDate(value) {
    if (!value) return '';

    if (typeof value === 'string') {
        const datePart = value.trim().slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
            return datePart;
        }
    }

    try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    } catch (ex) { /* ignore */ }

    return '';
}

window.GateEntyMode_GateEntry = GateEntyMode_GateEntry
window.GateEntryGirdByDates = GateEntryGirdByDates
window.ViewAttachment_GateEntry = ViewAttachment_GateEntry
window.ShowGateEntryConfigurationModal = ShowGateEntryConfigurationModal
window.setGateEntryParamater = setGateEntryParamater
window.GateEntry_ToggleToleranceVisibility = GateEntry_ToggleToleranceVisibility
window.setGateEntryToleranceParamater = setGateEntryToleranceParamater
window.GateEntry_rdPOAccess_onClick = GateEntry_rdPOAccess_onClick
window.GateEntry_SaveData = GateEntry_SaveData
window.GateEntry_frmLoadedIn_ddlPurchaseOrder_Change = GateEntry_frmLoadedIn_ddlPurchaseOrder_Change
window.GateEntry_InitSelectMachineToGetWeightControl = GateEntry_InitSelectMachineToGetWeightControl
window.GateEnty_PrintPreviewToken = GateEnty_PrintPreviewToken
window.GateEnty_PrintGateEntry = GateEnty_PrintGateEntry
window.GateEntry_ExportExecl = GateEntry_ExportExecl
window.GateEntry_changeDocumentType = GateEntry_changeDocumentType
window.GateEntry_changeDocumentType_LoadedIn = GateEntry_changeDocumentType_LoadedIn
window.GateEntry_GetNetWeight = GateEntry_GetNetWeight


