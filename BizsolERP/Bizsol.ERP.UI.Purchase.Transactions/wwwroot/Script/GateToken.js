import { GateEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GateEntryService.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';
$("#ERPHeading").text("Gate Token / Reporting");
let AutoReportingDateTime = 'N';
let GateEntryImageDetail = [{
    imgVehicle: [],
    imgMaterial: [],
    imgDoc: [],
    ImgOther: []

}];
//$('#txtFromDate').val(new Date().toISOString().slice(0, 10));
//$('#txtToDate').val(new Date().toISOString().slice(0, 10));
//window.GateToken_ShowReport = function GateToken_ShowReport() {

//        let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
//        if (FromDate == "" && Todate == "") {
//            return false;
//        }
//    GateEntryService.getVehiclesStatusList(FromDate, Todate).then(function (response) {

//            //console.log(response);
//        const StringFilterColumn = ["Vehicle No"];
//        const NumericFilterColumn = ["Gate Entry No"];
//            const DateFilterColumn = [];
//            const Button = false;
//            const showButtons = []
//            const StringdoubleFilterColumn = [];
//            const hiddenColumns = ["Code"];
//            const ColumnAlignment = {};
//        BizsolCustomFilterGrid.CreateDataTable("tbGateTokenHeader", "tbGateTokenBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
//    });

//}
//GateToken_ShowReport()

function GateToken_SaveData() {
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

    let GateEntryMaster_Code = 0;


    ReportingDatetime = $('#frmGateToken_txtReportingDatetime').val();
    VehicleNo = $('#frmGateToken_txtVehicleNo').val().toUpperCase();
    TransporterName = $('#frmGateToken_ddlTransporterName').val();
    DriverName = $('#frmGateToken_txtDriverName').val();
    DriverMobile = $('#frmGateToken_txtDriverNo').val();
    ChassisNo = $('#frmGateToken_txtChassisNo').val();
    RCNo = $('#frmGateToken_txtRCNo').val();
    RCExpiredDate = $('#frmGateToken_txtRCExpiredDate').val();
    DriverLicenseNo = $('#frmGateToken_txtDriverLicenseNo').val();
    DriverLicenseExpiredDate = $('#frmGateToken_txtDriverLicenseExpiredDate').val();
    


    if (typeof ReportingDatetime === 'undefined' || ReportingDatetime === '' || ReportingDatetime === '0' || ReportingDatetime === 0 || ReportingDatetime === null) {
        valid = false;
        toastr.error('Please Check! Reporting Date time can not be blank');
        $('#frmGateToken_txtReportingDatetime').focus();
        return;
    }
    if (typeof VehicleNo === 'undefined' || VehicleNo === '' || VehicleNo === '0' || VehicleNo === 0 || VehicleNo === null) {
        valid = false;
        toastr.error('Please Check! Vehicle No can not be blank');
        $('#frmGateToken_txtVehicleNo').focus();
        return;
    }

    if (DriverMobile!="" && BizSolInputControl.IsMobileNumber(DriverMobile) == false) {
        valid = false;
        toastr.error('Please enter valid mobile number.');
        $('#frmEmptyIn_txtDriverNo').focus();
        return;

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
                    transactionType: '',
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


        Showloader();
        GateEntryService.SaveGateEntryMaster(JSON.stringify(GateEntryPostdata), POItemsData, 'GenerateGateToken').then(function (response) {
            if (response.Status === 'Y') {
                HideLoader();
                toastr.success(response.Msg);
                if (AutoReportingDateTime=='Y') {
                    $('#frmGateToken_txtReportingDatetime').val(toLocalISOString(new Date()));
                    $('#frmGateToken_txtReportingDatetime').attr('readonly', 'readonly');
                }
                // window.location.href = sessionStorage.getItem('AppBaseURL') +'PurchaseTransactions/GateEntry/GateEntryView';
                $('#spNote')[0].innerHTML = response.Msg;
            }
            else {
                toastr.error(response.Msg);
                HideLoader();
            }
        });

    }

}
function ShowHideVehicleOtherDetails() {
    $('#DivGateTokenChassisNo').hide();
    $('#DivGateTokenRCNo').hide();
    $('#DivGateTokenRCExpiredDate').hide();
    $('#DivGateTokenDriverLicenseNo').hide();
    $('#DivGateTokenDriverLicenseExpiredDate').hide();

    GateEntryService.GetConfigGateEntry().then(function (response) {
        if (response.length > 0 && response.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
            $('#frmGateToken_txtChassisNo').val('');
            $('#frmGateToken_txtRCNo').val('');
            $('#frmGateToken_txtRCExpiredDate').val('');
            $('#frmGateToken_txtDriverLicenseNo').val('');
            $('#frmGateToken_txtDriverLicenseExpiredDate').val('');

            $('#DivGateTokenChassisNo').show();
            $('#DivGateTokenRCNo').show();
            $('#DivGateTokenRCExpiredDate').show();
            $('#DivGateTokenDriverLicenseNo').show();
            $('#DivGateTokenDriverLicenseExpiredDate').show();
        }
        
       
        if (response.length > 0 && response.find(x => x.PerameterName === 'AutoReportingDateTime').PerameterValue === 'Y') {
            AutoReportingDateTime = 'Y';
            $('#frmGateToken_txtReportingDatetime').val(toLocalISOString(new Date()));
            $('#frmGateToken_txtReportingDatetime').attr('readonly', 'readonly');
            
        }

        GateEntryService.GetDriverDetailsByVehicleNo("GETVEHICLENO", "0").then(function (resVehicle) {
            const goodsList = resVehicle.map((item) => ({ Desp: item.VehicleNo }));
            AutoSuggestionControl.SetUpAutoSuggestion(
                $('#frmGateToken_txtVehicleNo'),
                $('#frmGateToken_txtVehicleNo_List'),
                goodsList,
                'StartWith',
                true,
                function (selectedItem) {
                    if (selectedItem && selectedItem.Desp) {
                        GateEntryService.GetDriverDetailsByVehicleNo("CHECKVEHICLEINSTATUS", selectedItem.Desp).then(function (RespCheckVehicleStatus) {
                            if (RespCheckVehicleStatus[0].Status == 'Y') {
                                GateEntryService.GetDriverDetailsByVehicleNo("DRIVERDETAILS", selectedItem.Desp).then(function (RespVehicleDetails) {
                                    if (RespVehicleDetails.length > 0) {
                                        if (response.length > 0 && response.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
                                            $('#frmGateToken_txtChassisNo').val(RespVehicleDetails[0].ChassisNo);
                                            $('#frmGateToken_txtRCNo').val(RespVehicleDetails[0].RCNo);
                                            $('#frmGateToken_txtRCExpiredDate').val(new Date(RespVehicleDetails[0].RCExpiredDate).toISOString().slice(0, 10));

                                            $('#frmGateToken_txtDriverLicenseNo').val(RespVehicleDetails[0].DriverLicenseNo);
                                            $('#frmGateToken_txtDriverLicenseExpiredDate').val(new Date(RespVehicleDetails[0].DriverLicenseExpiredDate).toISOString().slice(0, 10));

                                        }
                                        $('#frmGateToken_txtDriverName').val(RespVehicleDetails[0].DriverName);
                                        $('#frmGateToken_txtDriverNo').val(RespVehicleDetails[0].DriverMobile);
                                        $('#frmGateToken_ddlTransporterName').val(RespVehicleDetails[0].TransporterName);
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

    });
    
}
function toLocalISOString(date) {
    const localDate = new Date(date - date.getTimezoneOffset() * 60000); //offset in milliseconds. Credit https://stackoverflow.com/questions/10830357/javascript-toisostring-ignores-timezone-offset

    // Optionally remove second/millisecond if needed
    localDate.setSeconds(null);
    localDate.setMilliseconds(null);
    return localDate.toISOString().slice(0, -1);
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
GateEntryService.GetTransportersNameList().then(function (response) {
    
    AutoSuggestionControl.SetUpAutoSuggestion($('#frmGateToken_ddlTransporterName'), $('#frmGateToken_ddlTransporterName_List'), response.map((item) => ({ Desp: item.AccountDesp })), 'StartWith');
});

// Apply to all inputs with this class
applyAlphaNumUppercase(".alphanum-uppercase");
ShowHideVehicleOtherDetails();
window.GateToken_SaveData = GateToken_SaveData