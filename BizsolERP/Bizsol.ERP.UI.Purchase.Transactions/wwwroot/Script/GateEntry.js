import { GateEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GateEntryService.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/menuservices.js';

$("#ERPHeading").text("Gate Entry");

let ConfigGateEntry = [];
let IsWithPo = false;
let GateEntryMaster_Code = 0;

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

let baseUrl = sessionStorage.getItem('AppBaseURL');

function GateEntryGirdByDates() {

    let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
    let ddlVehiclesStatusInFectory = $('#ddlVehiclesStatusInFectory').val();
    let QueryCondition = ".";
    if (ddlVehiclesStatusInFectory === 'LIN') {
        QueryCondition = " and TransactionType='LIN' and GateEntryOutDate is not null"

    } else if (ddlVehiclesStatusInFectory === 'EIN'){
        QueryCondition = " and TransactionType='EIN' and GateEntryOutDate is not null"
    }
    else if (ddlVehiclesStatusInFectory === 'PLIN') {
        QueryCondition = " and TransactionType='LIN' and GateEntryOutDate is null"
    }
    else if (ddlVehiclesStatusInFectory === 'PEIN') {
        QueryCondition = " and TransactionType='EIN' and GateEntryOutDate is null"
    }
    else if (ddlVehiclesStatusInFectory === 'PAll') {
        QueryCondition = " and GateEntryOutDate is null"
    }

    if (FromDate == "" && Todate == "") {
        return false;
    }
    GateEntryService.GateEntryDate(FromDate, Todate, QueryCondition).then(function (response) {
       
        console.log(response);
        //response.forEach(item => {
        //    item.Action = item["Date Out Time"] !== '' ? '<a class="btn btn-info icon-height" onclick="GateEntyMode_GateEntry(\'grid\',\'' + item["Type In"].replace(' ', '') + 'print_' + item.Code + '\')"> <i class="fa fa-print"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ',\'' + item["Type In"].replace(' ', '') + ' ' + item["Entry No"] +' '+ item["Vehicle No"] + ' ' + item["Date In Time"].replace(':', '').replace('/', '').replace('/', '') + ' ' + item["Date Out Time"].replace(':', '').replace('/', '').replace('/', '') + '\')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-dark icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'view_' + item.Code + '\')" ><i class="fa fa-eye"></i></a>' : item["Type In"].replace(' ', '').toLowerCase() === 'loadedin' ? '<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ',\'' + item["Type In"].replace(' ', '') + ' ' + item["Entry No"] +' '+ item["Vehicle No"] + ' ' + item["Date In Time"].replace(':', '').replace('/', '').replace('/', '') + ' ' + item["Date Out Time"].replace(':', '').replace('/', '').replace('/', '') + '\')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'emptyout_' + item.Code + '\')" >Empty Out</a>' : '<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ',\'' + item["Type In"].replace(' ', '') + ' ' + item["Entry No"] +' '+ item["Vehicle No"] + ' ' + item["Date In Time"].replace(':', '').replace('/', '').replace('/', '') + ' ' + item["Date Out Time"].replace(':', '').replace('/', '').replace('/', '') +'\')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'loadedout_' + item.Code + '\')" >Loaded Out</a>'
        //});
        response.forEach(item => {
            item.Action = item["Date Out Time"] !== '' ? '<a class="btn btn-info icon-height" onclick="GateEntyMode_GateEntry(\'grid\',\'' + item["Type In"].replace(' ', '') + 'print_' + item.Code + '\')"> <i class="fa fa-print"></i></a>&nbsp;<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ',\'' + item["Type In"].replace(' ', '') + ' ' + item["Entry No"] + ' ' + item["Vehicle No"] + ' ' + item["Date In Time"].replace(':', '').replace('/', '').replace('/', '') + ' ' + item["Date Out Time"].replace(':', '').replace('/', '').replace('/', '') + '\')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'editFull_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-dark icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'view_' + item.Code + '\')" ><i class="fa fa-eye"></i></a>' : item["Type In"].replace(' ', '').toLowerCase() === 'loadedin' ? '<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ',\'' + item["Type In"].replace(' ', '') + ' ' + item["Entry No"] + ' ' + item["Vehicle No"] + ' ' + item["Date In Time"].replace(':', '').replace('/', '').replace('/', '') + ' ' + item["Date Out Time"].replace(':', '').replace('/', '').replace('/', '') + '\')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'edit_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'emptyout_' + item.Code + '\')" >Empty Out</a>' : '<a class="btn btn-success icon-height" onclick="ViewAttachment_GateEntry(' + item.Code + ',\'' + item["Type In"].replace(' ', '') + ' ' + item["Entry No"] + ' ' + item["Vehicle No"] + ' ' + item["Date In Time"].replace(':', '').replace('/', '').replace('/', '') + ' ' + item["Date Out Time"].replace(':', '').replace('/', '').replace('/', '') + '\')"> <i class="fa fa-paperclip"></i></a>&nbsp;<a class="btn btn-primary icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'edit_' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;<a class="btn btn-danger icon-height" onclick="GateEntyMode_GateEntry(\'form\',\'' + item["Type In"].replace(' ', '') + 'loadedout_' + item.Code + '\')" >Loaded Out</a>'
        });
        //console.log(response);
        const StringFilterColumn = ["Type In", "Party name", "Vehicle No"];
        const NumericFilterColumn = ["Entry No"];
        const DateFilterColumn = ["Date In Time", "Date Out Time"];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code","Hour"];
        const ColumnAlignment = {};
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
    }
    else if (Mode === 'form' && EntryType === 'LoadedInNew') {
        ChangeMode(Mode);
        ClearAllFrm();
        LoadedInNew();
    }
    else if (Mode === 'form' && EntryType.includes('emptyout') == true) {
        
        GateEntryMaster_Code = EntryType.split('_')[1];
        GateEntryService.GetGateEntryDetails(GateEntryMaster_Code).then(function (response) {
            //console.log(response);
            ChangeMode(Mode);
            ClearEmptyOutOrLoadedOutFrm();
            UpdateLoadedIn_Emptyout(response);
        });

    }
    else if (Mode === 'form' && EntryType.includes('loadedout') == true) {
        GateEntryMaster_Code = EntryType.split('_')[1];
        GateEntryService.GetGateEntryDetails(GateEntryMaster_Code).then(function (response) {
            //console.log(response);
            ChangeMode(Mode);
            ClearEmptyOutOrLoadedOutFrm();
            UpdateEmptyIn_loadedout(response);
        });
        
    }
    else if (EntryType.includes('print') == true) {
        ChangeMode(Mode);
        GateEntryMaster_Code = EntryType.split('_')[1];
        PrintGateEntry(GateEntryMaster_Code);
    }
    else if (EntryType.includes('edit') == true) {
        
        GateEntryMaster_Code = EntryType.split('_')[1];
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

    $('#frmLoadedIn_txtDateIn').val(new Date().toISOString().slice(0, 10));
    $('#frmLoadedIn_txtVehicleInTime').val(`${new Date().getHours()}:${new Date().getMinutes()}`);



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

            BindSelectList($('#frmLoadedIn_ddlPurchaseOrder')[0], response.map((item) => ({ Code: item.PurchaseOrderMaster_Code, Desp: item.PONo, VendorName: item.VendorName })));
            $('#frmLoadedIn_ddlPurchaseOrder').select2({
                width: '-webkit-fill-available'
            });
        });

        $('#RowfrmLoadedInPOAccess').show();
        $('#RowfrmLoadedInddlPurchaseOrder').show();
        IsWithPo = true;
        WithPO();
     }

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
        $('#frmLoadedIn_txtChassisNo').val('');
        $('#frmLoadedIn_txtRCNo').val('');
        $('#frmLoadedIn_txtRCExpiredDate').val('');
        $('#frmLoadedIn_txtDriverLicenseNo').val('');
        $('#frmLoadedIn_txtDriverLicenseExpiredDate').val('');

        $('#DivLoadedInChassisNo').show();
        $('#DivLoadedInRCNo').show();
        $('#DivLoadedInRCExpiredDate').show();
        $('#DivLoadedInDriverLicenseNo').show();
        $('#DivLoadedInDriverLicenseExpiredDate').show();
    }

    GateEntryService.GetTransportersNameList().then(function (response) {
        AutoSuggestionControl.SetUpAutoSuggestion($('#frmLoadedIn_ddlTransporterName'), $('#frmLoadedIn_ddlTransporterName_List'), response.map((item) => ({ Desp: item.AccountDesp })), 'StartWith');
    });
    GateEntryService.GetVendorOrClientNameListData('VENDOR').then(function (response) {
        AutoSuggestionControl.SetUpAutoSuggestion($('#frmLoadedIn_txtVendorName'), $('#frmLoadedIn_txtVendorName_List'), response.map((item) => ({ Desp: item.AccountDesp })), 'StartWith');
    });
    GateEntryService.GetGoodDespList().then(function (response) {
        // Map with UOM included for auto-suggestion
        const goodsList = response.map((item) => ({ Desp: item.GoodDesp, UOM: item.UOM }));

        // Setup auto-suggestion with selection callback to set UOM
        AutoSuggestionControl.SetUpAutoSuggestion(
            $('#frmLoadedIn_txtGoodsDescription'),
            $('#frmLoadedIn_txtGoodsDescription_List'),
            goodsList,
            'StartWith',
            true,
            function(selectedItem) {
                if (selectedItem && selectedItem.UOM) {
                    $('#frmLoadedIn_txtUOM').val(selectedItem.UOM).trigger('change');
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

    $('#DivEmptyInChassisNo').hide();
    $('#DivEmptyInRCNo').hide();
    $('#DivEmptyInRCExpiredDate').hide();
    $('#DivEmptyInDriverLicenseNo').hide();
    $('#DivEmptyInDriverLicenseExpiredDate').hide();

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
              
        $('#DivEmptyInChassisNo').show();
        $('#DivEmptyInRCNo').show();
        $('#DivEmptyInRCExpiredDate').show();
        $('#DivEmptyInDriverLicenseNo').show();
        $('#DivEmptyInDriverLicenseExpiredDate').show();
    }

    $('#DivfrmEmptyIn_fileVehiclePhoto').show();

    $('#DivfrmLoadedOut').hide();
}

function UpdateLoadedIn_Emptyout(gateEntryData) {
    console.log(gateEntryData);
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

    $('#frmEmptyOut_txtDateOut').val(new Date().toISOString().slice(0, 10));
    $('#frmEmptyOut_txtOutTime').val(`${new Date().getHours()}:${new Date().getMinutes()}`);
    
    $('#frmLoadedIn_txtDateIn').val(new Date(gateEntryData[0].GateEntryDate).toISOString().slice(0, 10));
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
    $('#frmLoadedIn_txtDocumentDate').val(gateEntryData[0].InvoiceDate == null ? '' : new Date(gateEntryData[0].InvoiceDate).toISOString().slice(0, 10));
    $('#frmLoadedIn_txtEWayBillNo').val(gateEntryData[0].EwaybillNo);
    $('#frmLoadedIn_txtEWayBillDate').val(gateEntryData[0].EwaybillDate ==null?'': new Date(gateEntryData[0].EwaybillDate).toISOString().slice(0, 10));
    $('#frmLoadedIn_txtRemarks').val(gateEntryData[0].Remarks);
    $('#frmLoadedIn_txtChassisNo').val(gateEntryData[0].ChassisNo); 
    $('#frmLoadedIn_txtRCNo').val(gateEntryData[0].RCNo);
    $('#frmLoadedIn_txtRCExpiredDate').val(gateEntryData[0].RCExpiredDate == null ? '' : new Date(gateEntryData[0].RCExpiredDate).toISOString().slice(0, 10));
    $('#frmLoadedIn_txtDriverLicenseNo').val(gateEntryData[0].DriverLicenseNo);
    $('#frmLoadedIn_txtDriverLicenseExpiredDate').val(gateEntryData[0].DriverLicenseExpiredDate == null ? '' : new Date(gateEntryData[0].DriverLicenseExpiredDate).toISOString().slice(0, 10));



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
        WithPO();
        $('#frmLoadedIn_txtGoodsDescription').val(gateEntryData[0].GoodDescription);
        $('#frmLoadedIn_txtQTY').val(gateEntryData[0].Qty);
        $('#frmLoadedIn_txtUOM').attr('disabled', 'disabled');
        
        jQuery('input:radio[name="rdPOAccess"]').filter('[value="withoutpo"]').attr('checked', true);
    }
    else {
        jQuery('input:radio[name="rdPOAccess"]').filter('[value="withpo"]').attr('checked', true);
    }
      $('#DivfrmEmptyOut').show();
      $('#RowfrmEmptyOut_fileVehiclePhoto').show();


}

function UpdateEmptyIn_loadedout(gateEntryData) {

    $('#frmEmptyIn_txtDateIn').val(new Date(gateEntryData[0].GateEntryDate).toISOString().slice(0, 10));
    $('#frmEmptyIn_txtVehicleInTime').val(gateEntryData[0].TimeIO);
    $('#frmEmptyIn_txtVehicleNo').val(gateEntryData[0].VehicleNo); 
    $('#frmEmptyIn_txtDriverName').val(gateEntryData[0].DriverName);
    $('#frmEmptyIn_txtDriverNo').val(gateEntryData[0].DriverMobile);
    $('#frmEmptyIn_ddlTransporterName').val(gateEntryData[0].OtherTransporterName);
    $('#frmEmptyIn_txtRemarks').val(gateEntryData[0].Remarks);
    $('#frmEmptyIn_txtVehicleEmptyWeight').val(gateEntryData[0].EmptyWeight);
    $('#frmEmptyIn_txtWeightmentSlipNoEmpty').val(gateEntryData[0].WeightmentSlipNumberIn);
    $('#frmEmptyIn_txtReportingDatetime').val(gateEntryData[0].ReportingDatetime);
    $('#frmLoadedOut_txtDateOut').val(gateEntryData[0].GateEntryOutDate == null ? new Date().toISOString().slice(0, 10) : new Date(gateEntryData[0].GateEntryDate).toISOString().slice(0, 10));
    $('#frmLoadedOut_txtVehicleOutTime').val(gateEntryData[0].VehicleOutTime == '00:00' ? `${new Date().getHours()}:${new Date().getMinutes()}` : gateEntryData[0].VehicleOutTime);

    $('#frmEmptyIn_txtChassisNo').val(gateEntryData[0].ChassisNo);
    $('#frmEmptyIn_txtRCNo').val(gateEntryData[0].RCNo);
    $('#frmEmptyIn_txtRCExpiredDate').val(new Date(gateEntryData[0].RCExpiredDate).toISOString().slice(0, 10));
    $('#frmEmptyIn_txtDriverLicenseNo').val(gateEntryData[0].DriverLicenseNo);
    $('#frmEmptyIn_txtDriverLicenseExpiredDate').val(new Date(gateEntryData[0].DriverLicenseExpiredDate).toISOString().slice(0, 10));


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

    
    $('#DivfrmEmptyIn_fileVehiclePhoto').hide();
    $('#RowfrmEmptyInReportingDatetime').hide();
    $('#RowfrmEmptyInVehicleEmptyWeight').hide();
    $('#RowfrmEmptyInWeightmentSlipNoEmpty').hide();
    $('#RowfrmLoadedOutVehicleLoadedWeight').hide();
    $('#RowfrmLoadedOutWeightmentSlipNoLoadedOut').hide();

    $('#DivEmptyInChassisNo').hide();
    $('#DivEmptyInRCNo').hide();
    $('#DivEmptyInRCExpiredDate').hide();
    $('#DivEmptyInDriverLicenseNo').hide();
    $('#DivEmptyInDriverLicenseExpiredDate').hide();
    

    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'ReportingDatetimeApplicable').PerameterValue === 'Y') {
        $('#RowfrmEmptyInReportingDatetime').show();
    }
    
    if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
        $('#RowfrmEmptyInVehicleEmptyWeight').show();
        $('#RowfrmEmptyInWeightmentSlipNoEmpty').show();
        $('#RowfrmLoadedOutVehicleLoadedWeight').show();
        $('#RowfrmLoadedOutWeightmentSlipNoLoadedOut').show();
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
function ShowGateEntryConfigurationModal() {
    GateEntryService.GetConfigGateEntry().then(function (response) {
        //console.log(response);

        let option = '';
        $.each(response, function (key, val) {
            let Checked = val.PerameterValue.toLowerCase() === 'y'?'checked':''
            option += `<div class="col-6"><input type="checkbox" class="box_border" ${Checked} onclick="setGateEntryParamater(this,'${val.PerameterName}','${val.PerameterValue}')" />&nbsp;<label>${BizSolHelperFunction.ToWithSpace(val.PerameterName) }</label></div>`;
        });


        $('#DivChkSetGateEntryConfiguration')[0].innerHTML = option;
        $("#GateEntryConfigurationModal").modal({
            backdrop: 'static',
            // keyboard: false
        });
        $("#GateEntryConfigurationModal").modal('show');
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

function GetConfigGateEntry() {
    GateEntryService.GetConfigGateEntry().then(function (response) {
        ConfigGateEntry = response;
        EnableScaleWeight();
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

function PrintGateEntry(GateEntyMaster_Code) {
    GateEntryService.Print(GateEntyMaster_Code).then(function (response) {
        let url = response.Url;
        const a = document.createElement('a');
        a.style.display = 'none';
        a.target = '_blank';
        a.href = url;
        document.body.appendChild(a);
        a.click();
    });
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
    let GodownMaster_Code = 0;
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

    if (Mode === 'EmptyInSave' || Mode === 'emptyinedit') {
        let PhotoLenth = 0;
        Time = $('#frmEmptyIn_txtVehicleInTime').val();
        VehicleNo = $('#frmEmptyIn_txtVehicleNo').val();
        DriverName = $('#frmEmptyIn_txtDriverName').val();
        DriverMobile = $('#frmEmptyIn_txtDriverNo').val();
        TransporterName = $('#frmEmptyIn_ddlTransporterName').val();
        Remark = $('#frmEmptyIn_txtRemarks').val();
        PhotoLenth = $('#frmEmptyIn_fileVehiclePhoto')[0].files.length;

        
        if (typeof VehicleNo === 'undefined' || VehicleNo === '' || VehicleNo === null) {
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

        if (typeof DriverName === 'undefined' || DriverName === '' || DriverName === null) {
            valid = false;
            toastr.error('Please Check! Driver Name can not be blank');
            $('#frmEmptyIn_txtDriverName').focus();
            return;
        }
        if (typeof DriverMobile === 'undefined' || DriverMobile === '' || DriverMobile === null) {
            valid = false;
            toastr.error('Please Check! Driver No. can not be blank');
            $('#frmEmptyIn_txtDriverNo').focus();
            return;
        }
        if (BizSolInputControl.IsMobileNumber(DriverMobile) == false) {
            valid = false;
            toastr.error('Please enter valid mobile number.');
            $('#frmEmptyIn_txtDriverNo').focus();
            return;

        }
        if (typeof TransporterName === 'undefined' || TransporterName === '' || TransporterName === null) {
            valid = false;
            toastr.error('Please Check! Transporter Name can not be blank');
            $('#frmEmptyIn_ddlTransporterName').focus();
            return;
        }

        if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
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
        }

        if (Mode === 'EmptyInSave' && (typeof PhotoLenth === 'undefined' || PhotoLenth === 0)) {
            valid = false;
            toastr.error('Please Check! Vehicle Photo can not be blank');
            $('#frmEmptyIn_fileVehiclePhoto').focus();
            return;
        }

        if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'ReportingDatetimeApplicable').PerameterValue === 'Y') {
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
        let VehiclePhotoLenth = $('#frmLoadedOut_fileVehiclePhoto')[0].files.length;
        let GoodsPhotoLenth = $('#frmLoadedOut_fileGoodsPhoto')[0].files.length;
        let InvoicePhotoLenth = $('#frmLoadedOut_fileInvoicePhoto')[0].files.length;
        //let OtherPhotoLenth = $('#frmLoadedOut_fileOtherPhoto')[0].files.length;
        
        if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
            ChassisNo = $('#frmEmptyIn_txtChassisNo').val();
            RCNo = $('#frmEmptyIn_txtRCNo').val();
            RCExpiredDate = $('#frmEmptyIn_txtRCExpiredDate').val();
            DriverLicenseNo = $('#frmEmptyIn_txtDriverLicenseNo').val();
            DriverLicenseExpiredDate = $('#frmEmptyIn_txtDriverLicenseExpiredDate').val();
        }

        if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
            LoadedWeight = $('#frmLoadedOut_txtVehicleLoadedWeight').val();
            WeightmentSlipNumberOut = $('#frmLoadedOut_txtWeightmentSlipNoLoadedOut').val();

            if (typeof LoadedWeight === 'undefined' || LoadedWeight === '0' || LoadedWeight === '' || LoadedWeight === 0 || LoadedWeight === null) {
                valid = false;
                toastr.error('Please Check! Vehicle Loaded Weight can not be blank or zero');
                $('#frmLoadedOut_txtVehicleLoadedWeight').focus();
                return;
            }
            if (typeof WeightmentSlipNumberOut === 'undefined' || WeightmentSlipNumberOut === '' || WeightmentSlipNumberOut === null) {
                valid = false;
                toastr.error('Please Check! Weightment Slip No. Loaded can not be blank');
                $('#frmLoadedOut_txtWeightmentSlipNoLoadedOut').focus();
                return;
            }
            NetWeight = LoadedWeight - EmptyWeight;
            if (NetWeight < 0) {
                toastr.error('Please Check! vehicle loaded weight Should be greater than to vehicle empty weight');
                return;
            }
        }

        if (Mode === 'UpdateEmptyInSave' && (typeof VehiclePhotoLenth === 'undefined' || VehiclePhotoLenth === 0)) {
            valid = false;
            toastr.error('Please Check! Vehicle Photo can not be blank');
            $('#frmLoadedOut_fileVehiclePhoto').focus();
            return;
        }
        if (Mode === 'UpdateEmptyInSave' && (typeof GoodsPhotoLenth === 'undefined' || GoodsPhotoLenth === 0)) {
            valid = false;
            toastr.error('Please Check! Goods Photo can not be blank');
            $('#frmLoadedOut_fileGoodsPhoto').focus();
            return;
        }
        if (Mode === 'UpdateEmptyInSave' && (typeof InvoicePhotoLenth === 'undefined' || InvoicePhotoLenth === 0)) {
            valid = false;
            toastr.error('Please Check! Document Photo can not be blank');
            $('#frmLoadedOut_fileInvoicePhoto').focus();
            return;
        }
        
        if (typeof GoodDescription === 'undefined' || GoodDescription === '' || GoodDescription === null) {
            valid = false;
            toastr.error('Please Check! Goods Description can not be blank');
            $('#frmLoadedOut_txtGoodsDescription').focus();
            return;
        }
        if (typeof Qty === 'undefined' || Qty === '0' || Qty === '' || Qty === 0 || Qty === null) {
            valid = false;
            toastr.error('Please Check! Qty can not be blank or zero');
            $('#frmLoadedOut_txtQty').focus();
            return;
        }
        if (typeof Uom === 'undefined' || Uom === '' || Uom === '0' || Uom === null) {
            valid = false;
            toastr.error('Please Check! Uom can not be blank');
            $('#frmLoadedOut_ddlUOM').focus();
            return;
        }
        if (typeof Documenttype === 'undefined' || Documenttype === '' || Documenttype === '0' || Documenttype === null) {
            valid = false;
            toastr.error('Please Check! Document Type can not be blank');
            $('#frmLoadedOut_ddlDocumentType').focus();
            return;
        }

        if (typeof VendorName === 'undefined' || VendorName === '' || VendorName === null) {
            valid = false;
            toastr.error('Please Check! Customer Name can not be blank');
            $('#frmLoadedOut_txtCustomerName').focus();
            return;
        }
        
        
        if (typeof InvoiceNo === 'undefined' || InvoiceNo === '' || InvoiceNo === null) {
            valid = false;
            toastr.error('Please Check! Document No. can not be blank');
            $('#frmLoadedOut_txtDocumentNo').focus();
            return;
        }
        if (typeof InvoiceDate === 'undefined' || InvoiceDate === '' || InvoiceDate === null) {
            valid = false;
            toastr.error('Please Check! Document Date can not be blank');
            $('#frmLoadedOut_txtDocumentDate').focus();
            return;
        }
       
    }
    else if (Mode === 'LoadedInSave' || Mode ==='loadedinedit') {
        Time = $('#frmLoadedIn_txtVehicleInTime').val();
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
        let GoodsPhotoLenth = $('#frmLoadedIn_fileGoodsPhoto')[0].files.length;
        let InvoicePhotoLenth = $('#frmLoadedIn_fileInvoicePhoto')[0].files.length;


        if (typeof VehicleNo === 'undefined' || VehicleNo === '' || VehicleNo === null) {
            valid = false;
            toastr.error('Please Check! Vehicle No can not be blank');
            $('#frmLoadedIn_txtVehicleNo').focus();
            return;
        }
        if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
            ChassisNo = $('#frmLoadedIn_txtChassisNo').val();
            RCNo = $('#frmLoadedIn_txtRCNo').val();
            RCExpiredDate = $('#frmLoadedIn_txtRCExpiredDate').val();
            DriverLicenseNo = $('#frmLoadedIn_txtDriverLicenseNo').val();
            DriverLicenseExpiredDate = $('#frmLoadedIn_txtDriverLicenseExpiredDate').val();

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
        
        if (typeof DriverName === 'undefined' || DriverName === '' || DriverName === null) {
            valid = false;
            toastr.error('Please Check! Driver Name can not be blank');
            $('#frmLoadedIn_txtDriverName').focus();
            return;
        }
        if (typeof DriverMobile === 'undefined' || DriverMobile === '' || DriverMobile === null) {
            valid = false;
            toastr.error('Please Check! Driver No. can not be blank');
            $('#frmLoadedIn_txtDriverNo').focus();
            return;
        }
        if (BizSolInputControl.IsMobileNumber(DriverMobile) == false) {
            valid = false;
            toastr.error('Please enter valid mobile number.');
            $('#frmLoadedIn_txtDriverNo').focus();
            return;

        }
        
        if (typeof TransporterName === 'undefined' || TransporterName === '' || TransporterName === null) {
            valid = false;
            toastr.error('Please Check! Transporter Name can not be blank');
            $('#frmLoadedIn_ddlTransporterName').focus();
            return;
        }
        if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
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
        }

        if (Mode === 'LoadedInSave' && (typeof VehiclePhotoLenth === 'undefined' || VehiclePhotoLenth === 0)) {
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
                var RecvQty = tbPOItemsUpdateRow.cells[6].getElementsByTagName('input')[0].value;
                var purchaseOrderMaster = tbPOItemsUpdateRow.cells[6].getElementsByTagName('input')[1].value;
                var purchaseOrderTransaction = tbPOItemsUpdateRow.cells[6].getElementsByTagName('input')[2].value;

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

        if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'ReportingDatetimeApplicable').PerameterValue === 'Y') {
            ReportingDatetime = $('#frmLoadedIn_txtReportingDatetime').val();

            if (typeof ReportingDatetime === 'undefined' || ReportingDatetime === '' || ReportingDatetime === null) {
                valid = false;
                toastr.error('Please Check! Reporting Date time can not be blank');
                $('#frmLoadedIn_txtReportingDatetime').focus();
                return;
            }
        }

    }
    else if (Mode == 'UpdateLoadedInSave' || Mode ==='loadedineditfull') {
        Time = $('#frmLoadedIn_txtVehicleInTime').val();
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
        LoadedWeight = $('#frmLoadedIn_txtVehicleLoadedWeight').val();
        WeightmentSlipNumberIn = $('#frmLoadedIn_txtWeightmentSlipNoLoaded').val();

        GateEntryOutDate = $('#frmEmptyOut_txtDateOut').val();
        VehicleOutTime = $('#frmEmptyOut_txtOutTime').val();
        OutRemarks = $('#frmEmptyOut_txtRemarks').val();

        let VehiclePhotoLenth = $('#frmEmptyOut_fileVehiclePhoto')[0].files.length;
        if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
            ChassisNo = $('#frmLoadedIn_txtChassisNo').val();
            RCNo = $('#frmLoadedIn_txtRCNo').val();
            RCExpiredDate = $('#frmLoadedIn_txtRCExpiredDate').val();
            DriverLicenseNo = $('#frmLoadedIn_txtDriverLicenseNo').val();
            DriverLicenseExpiredDate = $('#frmLoadedIn_txtDriverLicenseExpiredDate').val();
        }
        if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'WeightApplicable').PerameterValue === 'Y') {
            EmptyWeight = $('#frmEmptyOut_txtVehicleEmptyWeight').val();
            WeightmentSlipNumberOut = $('#frmEmptyOut_txtWeightmentSlipNoLoaded').val();

            if (typeof EmptyWeight === 'undefined' || EmptyWeight === '0' || EmptyWeight === '' || EmptyWeight === 0 || EmptyWeight === null) {
                valid = false;
                toastr.error('Please Check! Vehicle Empty Weight can not be blank or zero');
                $('#frmEmptyOut_txtVehicleEmptyWeight').focus();
                return;
            }
            if (typeof WeightmentSlipNumberOut === 'undefined' || WeightmentSlipNumberOut === '' || WeightmentSlipNumberOut === null) {
                valid = false;
                toastr.error('Please Check! Weightment Slip No. Loaded can not be blank');
                $('#frmEmptyOut_txtWeightmentSlipNoLoaded').focus();
                return;
            }

            NetWeight = LoadedWeight - EmptyWeight ;
            if (NetWeight < 0) {
                toastr.error('Please Check! vehicle Empty weight Should be less than to vehicle Loaded weight');
                return;
            }
        }
        if (ConfigGateEntry.length > 0 && ConfigGateEntry.find(x => x.PerameterName === 'ReportingDatetimeApplicable').PerameterValue === 'Y') {
            ReportingDatetime = $('#frmLoadedIn_txtReportingDatetime').val();
        }
        
        if (Mode == 'UpdateLoadedInSave' &&(typeof VehiclePhotoLenth === 'undefined' || VehiclePhotoLenth === 0)) {
            valid = false;
            toastr.error('Please Check! Vehicle Photo can not be blank');
            $('#frmEmptyOut_fileVehiclePhoto').focus();
            return;
        }

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
                    tableName: "",
                    table_Code: 0,
                    uom: Uom,
                    otherTransporterName: TransporterName,
                    godownMaster_Code: GodownMaster_Code,
                    grossWeight: 0,
                    ticketNo: "",
                    emptyWeight: EmptyWeight,
                    loadedWeight: LoadedWeight,
                    emptyWeightDateTime: EmptyWeightDateTime,
                    loadedWeightDateTime: LoadedWeightDateTime,
                    manualDocNo: "",
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
                    driverLicenseExpiredDate: DriverLicenseExpiredDate

                }
            ],

            gateEntryImageDetail: GateEntryImageDetail

        }
        

        //alert('Save Alert!' + Mode + ' Post Data: ' + JSON.stringify(GateEntryPostdata));

        Showloader();
        GateEntryService.SaveGateEntryMaster(JSON.stringify(GateEntryPostdata), POItemsData).then(function (response) {
            if (response.Status === 'Y') {
                HideLoader();
                toastr.success(`Entry save success`);
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
    let frmLoadedIn_ddlPurchaseOrder_VendorName = frmLoadedIn_ddlPurchaseOrder.options[frmLoadedIn_ddlPurchaseOrder.selectedIndex].attributes["vendorname"].value;

    let purchaseOrderMaster_Code = $('#frmLoadedIn_ddlPurchaseOrder').val();

    GateEntryService.GetPOItems(purchaseOrderMaster_Code).then(function (response) {
            //console.log(response)
        $('#RowfrmLoadedInPoItemGrid').show();
        $('#frmLoadedIn_txtVendorName').val(frmLoadedIn_ddlPurchaseOrder_VendorName);
        $('#frmLoadedIn_txtVendorName').attr('readonly', 'readonly');

        response.forEach(item => {
            item["BiLLED QTY"] = '<input class="BizSolFormControl form-control form-control-sm" type="text" onchange="BizSolInputControl.OnChangeFloatTextBox(this,2)" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" autocomplete="off" maxlength="7"><input type="hidden" value="' + item.PurchaseOrderMaster_Code + '" id="hfPurchaseOrderMaster_Code"/><input type="hidden" value="' + item.PurchaseOrderTransaction_Code +'" id="hfPurchaseOrderTransaction_Code"/>';
        });
        
        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["PurchaseOrderMaster_Code", "PurchaseOrderTransaction_Code","BILLED QTY"];
        const ColumnAlignment = {};
        BizsolCustomFilterGrid.CreateDataTable("tbGateEntyLoadedInPoItemHeader", "tbGateEntyLoadedInPoItemBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
    });

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

    if (elementValue.toLowerCase() === 'sales return') {
        $('#DivfrmLoadedIn_Vendor')[0].innerHTML = 'Customer Name'
        GateEntryService.GetVendorOrClientNameListData('CLIENT').then(function (response) {
            AutoSuggestionControl.SetUpAutoSuggestion($('#frmLoadedIn_txtVendorName'), $('#frmLoadedIn_txtVendorName_List'), response.map((item) => ({ Desp: item.AccountDesp })), 'StartWith');

        });
    }
    else if (elementValue.toLowerCase().includes('job work') == true) {
        $('#DivfrmLoadedIn_Vendor')[0].innerHTML = 'Job Worker'
        GateEntryService.GetVendorOrClientNameListData('JOBWORK').then(function (response) {
            AutoSuggestionControl.SetUpAutoSuggestion($('#frmLoadedIn_txtVendorName'), $('#frmLoadedIn_txtVendorName_List'), response.map((item) => ({ Desp: item.AccountDesp })), 'StartWith');

        });
    }
    else {
        $('#DivfrmLoadedIn_Vendor')[0].innerHTML = 'Vendor Name'
        GateEntryService.GetVendorOrClientNameListData('VENDOR').then(function (response) {
            AutoSuggestionControl.SetUpAutoSuggestion($('#frmLoadedIn_txtVendorName'), $('#frmLoadedIn_txtVendorName_List'), response.map((item) => ({ Desp: item.AccountDesp })), 'StartWith');

        });
    }
    if (typeof callby === 'undefined' || callby === '') {
        $('#frmLoadedIn_txtVendorName').val('');
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

    $('#frmLoadedOut_txtVehicleLoadedWeight').val('');
    $('#frmLoadedOut_txtWeightmentSlipNoLoadedOut').val('');
    $('#frmLoadedOut_txtGoodsDescription').val('');
    $('#frmLoadedOut_txtQty').val('');
    $('#frmLoadedOut_ddlUOM').val('');
    $('#frmLoadedOut_txtCustomerName').val('');
    $('#frmLoadedOut_ddlDocumentType').val('');
    $('#frmLoadedOut_txtDocumentNo').val('');
    $('#frmLoadedOut_txtDocumentDate').val('');
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
    }
    WithPO();
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
    

}
function ClearEmptyOutOrLoadedOutFrm() {
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
}
function ViewGateEntry(gateEntryData, EntryType) {
    
    let mode = EntryType.split('_')[0]; 
    if (mode.toLowerCase() === 'loadedinview') {
        ClearEmptyOutOrLoadedOutFrm();
        UpdateLoadedIn_Emptyout(gateEntryData);
        $('#frmEmptyOut_txtDateOut').val(new Date(gateEntryData[0].GateEntryOutDate).toISOString().slice(0, 10));
        $('#frmEmptyOut_txtOutTime').val(gateEntryData[0].VehicleOutTime); 

        $('#frmEmptyOut_txtVehicleEmptyWeight').val(gateEntryData[0].EmptyWeight);
        $('#frmEmptyOut_txtWeightmentSlipNoLoaded').val(gateEntryData[0].WeightmentSlipNumberOut);
        $('#frmEmptyOut_txtRemarks').val(gateEntryData[0].OutRemarks);

        $('#RowfrmEmptyOut_fileVehiclePhoto').hide();

        $('#frmEmptyOut_txtVehicleEmptyWeight').attr('readonly', 'readonly');
        $('#frmEmptyOut_txtWeightmentSlipNoLoaded').attr('readonly', 'readonly');
        $('#frmEmptyOut_txtRemarks').attr('readonly', 'readonly');
        $('#frmEmptyOut_btnSave').attr('disabled', 'disabled')
        
    }
    else if (mode.toLowerCase() === 'emptyinview') {
        ClearEmptyOutOrLoadedOutFrm();
        UpdateEmptyIn_loadedout(gateEntryData);

        $('#frmLoadedOut_txtVehicleLoadedWeight').val(gateEntryData[0].LoadedWeight);
        $('#frmLoadedOut_txtWeightmentSlipNoLoadedOut').val(gateEntryData[0].WeightmentSlipNumberOut);
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
        $('#frmLoadedOut_txtDocumentDate').val(new Date(gateEntryData[0].InvoiceDate).toISOString().slice(0, 10));
        $('#frmLoadedOut_txtEWayBillNo').val(gateEntryData[0].EwaybillNo);
        $('#frmLoadedOut_txtEWayBillDate').val(gateEntryData[0].EwaybillDate);
        $('#frmLoadedOut_txtRemarks').val(gateEntryData[0].OutRemarks);

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
        $('#frmLoadedOut_txtEWayBillNo').attr('readonly', 'readonly');
        $('#frmLoadedOut_txtEWayBillDate').attr('readonly', 'readonly');
        $('#frmLoadedOut_txtRemarks').attr('readonly', 'readonly');

        $('#frmLoadedOut_btnSave').attr('disabled', 'disabled')
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

        $('#frmEmptyOut_txtDateOut').val(new Date(gateEntryData[0].GateEntryOutDate).toISOString().slice(0, 10));
        $('#frmEmptyOut_txtOutTime').val(gateEntryData[0].VehicleOutTime);

        $('#frmEmptyOut_txtVehicleEmptyWeight').val(gateEntryData[0].EmptyWeight);
        $('#frmEmptyOut_txtWeightmentSlipNoLoaded').val(gateEntryData[0].WeightmentSlipNumberOut);
        $('#frmEmptyOut_txtRemarks').val(gateEntryData[0].OutRemarks);
        $('#RowfrmEmptyOut_fileVehiclePhoto').hide();

        $('#frmEmptyOut_txtVehicleEmptyWeight').removeAttr('readonly');
        $('#frmEmptyOut_txtWeightmentSlipNoLoaded').removeAttr('readonly');
        $('#frmEmptyOut_txtRemarks').removeAttr('readonly');
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
        $('#frmLoadedOut_txtDocumentDate').val(new Date(gateEntryData[0].InvoiceDate).toISOString().slice(0, 10));
        $('#frmLoadedOut_txtEWayBillNo').val(gateEntryData[0].EwaybillNo);
        $('#frmLoadedOut_txtEWayBillDate').val(gateEntryData[0].EwaybillDate);
        $('#frmLoadedOut_txtRemarks').val(gateEntryData[0].OutRemarks);


        $('#RowLoadedOut_fileVehiclePhoto').hide();
        $('#RowLoadedOut_fileGoodsPhoto').hide();
        $('#RowLoadedOut_fileInvoicePhoto').hide();
        $('#RowLoadedOut_fileOtherPhoto').hide();
        

        //$('#frmLoadedOut_btnSave').attr('disabled', 'disabled')
        $('#frmLoadedOut_btnSave').removeAttr('disabled');

        $('#frmLoadedOut_btnSave').removeAttr('onclick');
        $('#frmLoadedOut_btnSave').attr('onclick', "GateEntry_SaveData('emptyineditfull')");
    }
}

function EditLoaded() {
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


    $('#frmLoadedIn_ddlDocumentType').removeAttr('disabled');
    $('#frmLoadedIn_txtUOM').removeAttr('disabled');
}
function EditEmptyIn() {
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
    $('#txtFromDate').attr('max', maxDate);
    $('#txtToDate').attr('max', maxDate);

    $('#frmLoadedOut_txtDocumentDate').attr('min', MinDate);
    $('#frmLoadedIn_txtDocumentDate').attr('min', MinDate);
    $('#frmLoadedIn_txtEWayBillDate').attr('min', MinDate);
    $('#frmLoadedOut_txtEWayBillDate').attr('min', MinDate);
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

                                    }
                                    $('#frmLoadedIn_txtDriverName').val(RespVehicleDetails[0].DriverName);
                                    $('#frmLoadedIn_txtDriverNo').val(RespVehicleDetails[0].DriverMobile);
                                    $('#frmLoadedIn_ddlTransporterName').val(RespVehicleDetails[0].TransporterName);
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
                                    }

                                    $('#frmEmptyIn_txtDriverName').val(RespVehicleDetails[0].DriverName);
                                    $('#frmEmptyIn_txtDriverNo').val(RespVehicleDetails[0].DriverMobile);
                                    $('#frmEmptyIn_ddlTransporterName').val(RespVehicleDetails[0].TransporterName);
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

// Apply to all inputs with this class
applyAlphaNumUppercase(".alphanum-uppercase");
BizSolHelperFunction.HideOrShowConfigurationSettingBtn('btnGateEntyConfiguration');

window.GateEntyMode_GateEntry = GateEntyMode_GateEntry
window.GateEntryGirdByDates = GateEntryGirdByDates
window.ViewAttachment_GateEntry = ViewAttachment_GateEntry
window.ShowGateEntryConfigurationModal = ShowGateEntryConfigurationModal
window.setGateEntryParamater = setGateEntryParamater
window.GateEntry_rdPOAccess_onClick = GateEntry_rdPOAccess_onClick
window.GateEntry_SaveData = GateEntry_SaveData
window.GateEntry_frmLoadedIn_ddlPurchaseOrder_Change = GateEntry_frmLoadedIn_ddlPurchaseOrder_Change
window.GateEntry_InitSelectMachineToGetWeightControl = GateEntry_InitSelectMachineToGetWeightControl
