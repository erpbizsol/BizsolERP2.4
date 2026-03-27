import { GateEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GateEntryService.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
$("#ERPHeading").text("Gate Token / Reporting");
let AutoReportingDateTime = 'N';
let G_VehicleOtherDetails = 'N';
let GateEntryImageDetail = [{
    imgVehicle: [],
    imgMaterial: [],
    imgDoc: [],
    ImgOther: []

}];
let GateEntryLinkedERPDocuments = [];
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
    let DriverAadharNo = "";

    let GateEntryMaster_Code = 0;
    
    let loginGodownMaster_Code = JSON.parse(sessionStorage.getItem('authKey')).WebERPLoginGodownMaster_Code;

    GodownMaster_Code = loginGodownMaster_Code;

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
    DriverAadharNo = $('#frmGateToken_txtDriverAadharNo').val();
    


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
                    driverLicenseExpiredDate: DriverLicenseExpiredDate,
                    driverAadharNo: DriverAadharNo
                }
            ],

            gateEntryImageDetail: GateEntryImageDetail,
            gateEntryLinkedERPDocuments: GateEntryLinkedERPDocuments
        }

        if (G_VehicleOtherDetails == 'Y') {
            var rcConfirmation = getRCExpiredDateConfirm(RCExpiredDate);

            if (rcConfirmation === 'N') {
                return;
            }
        }
        Showloader();
        GateEntryService.SaveGateEntryMaster(JSON.stringify(GateEntryPostdata), POItemsData, 'GenerateGateToken').then(function (response) {
            if (response.Status === 'Y') {
                HideLoader();
                toastr.success(response.Msg);
                if (AutoReportingDateTime == 'Y') {
                    $('#frmGateToken_txtReportingDatetime').val(toLocalISOString(new Date()));
                    $('#frmGateToken_txtReportingDatetime').attr('readonly', 'readonly');
                }
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
    $('#DivGateTokenDriverAadharNo').hide();

    GateEntryService.GetConfigGateEntry().then(function (response) {
        if (response.length > 0 && response.find(x => x.PerameterName === 'VehicleOtherDetails').PerameterValue === 'Y') {
            G_VehicleOtherDetails = 'Y';
            $('#frmGateToken_txtChassisNo').val('');
            $('#frmGateToken_txtRCNo').val('');
            $('#frmGateToken_txtRCExpiredDate').val('');
            $('#frmGateToken_txtDriverLicenseNo').val('');
            $('#frmGateToken_txtDriverLicenseExpiredDate').val('');
            $('#frmGateToken_txtDriverAadharNo').val('');

            $('#DivGateTokenChassisNo').show();
            $('#DivGateTokenRCNo').show();
            $('#DivGateTokenRCExpiredDate').show();
            $('#DivGateTokenDriverLicenseNo').show();
            $('#DivGateTokenDriverLicenseExpiredDate').show();
            $('#DivGateTokenDriverAadharNo').show();
        }
        
       
        if (response.length > 0 && response.find(x => x.PerameterName === 'AutoReportingDateTime').PerameterValue === 'Y') {
            AutoReportingDateTime = 'Y';
            $('#frmGateToken_txtReportingDatetime').val(toLocalISOString(new Date()));
            $('#frmGateToken_txtReportingDatetime').attr('readonly', 'readonly');
            
        }

        GateEntryService.GetDriverDetailsByVehicleNo("GETALLVEHICLENO", "0").then(function (resVehicle) {
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
                                            $('#frmGateToken_txtChassisNo').val(RespVehicleDetails[0].ChassisNo || '');
                                            $('#frmGateToken_txtRCNo').val(RespVehicleDetails[0].RCNo || '');
                                            $('#frmGateToken_txtRCExpiredDate').val(formatDateForInput(RespVehicleDetails[0].RCExpiredDate));

                                            $('#frmGateToken_txtDriverLicenseNo').val(RespVehicleDetails[0].DriverLicenseNo || '');
                                            $('#frmGateToken_txtDriverAadharNo').val(RespVehicleDetails[0].DriverAadharNo || '');
                                            getRCExpiredDateAlert(RespVehicleDetails[0].RCExpiredDate);
                                            $('#frmGateToken_txtDriverLicenseExpiredDate').val(formatDateForInput(RespVehicleDetails[0].DriverLicenseExpiredDate));
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
function formatDateToDDMMYYYY(dateString) {
    if (!dateString || dateString === '') {
        return '';
    }
    
    try {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return '';
        }
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}-${month}-${year}`;
    } catch (error) {
        return '';
    }
}
function getRCExpiredDateAlert(RCDate) {
    if (!RCDate || RCDate === '') {
        return;
    }
    var currentDateString = BizSolHelperFunction.getCurrentDate();
    var currentDate = new Date(currentDateString);
    
    var rcExpiryDate = new Date(RCDate);
 
    var timeDifference = rcExpiryDate.getTime() - currentDate.getTime();
    var daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
    
    if (daysDifference < 0) {
        toastr.error('Your RC has expired on ' + formatDateToDDMMYYYY(RCDate));
    } else if (daysDifference <= 15) {
        toastr.warning('Your RC expires within ' + daysDifference + ' days');
    }
}
function getRCExpiredDateConfirm(RCDate) {
    if (!RCDate || RCDate === '') {
        return null;
    }
    
    var currentDateString = BizSolHelperFunction.getCurrentDate();
    var currentDate = new Date(currentDateString);
    
    var rcExpiryDate = new Date(RCDate);
 
    var timeDifference = rcExpiryDate.getTime() - currentDate.getTime();
    var daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
    
    var message = '';
    var shouldConfirm = false;
    
    if (daysDifference < 0) {
        message = 'Your RC has expired on ' + formatDateToDDMMYYYY(RCDate) + '. Do you want to continue?';
        shouldConfirm = true;
    } else if (daysDifference <= 15) {
        message = 'Your RC expires within ' + daysDifference + ' days. Do you want to continue?';
        shouldConfirm = true;
    }
    
    if (shouldConfirm) {
        var result = confirm(message);
        return result ? 'Y' : 'N';
    }
    
    return null; 
}
function formatDateForInput(dateString) {
    if (!dateString || dateString === null || dateString === '') {
        return '';
    }
    
    try {
        // If date string is in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss), extract date parts directly
        if (typeof dateString === 'string' && dateString.includes('-')) {
            const datePart = dateString.split('T')[0]; // Get YYYY-MM-DD part
            const parts = datePart.split('-');
            
            if (parts.length === 3) {
                const year = parts[0];
                const month = parts[1];
                const day = parts[2];
                
                // Validate the parts
                if (year.length === 4 && month.length === 2 && day.length === 2) {
                    return `${year}-${month}-${day}`;
                }
            }
        }
        
        // Fallback: Parse as date object (for other formats)
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return '';
        }
        
        // Format as YYYY-MM-DD for input field
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
}

applyAlphaNumUppercase(".alphanum-uppercase");
ShowHideVehicleOtherDetails();
window.GateToken_SaveData = GateToken_SaveData
window.getRCExpiredDateAlert = getRCExpiredDateAlert
window.getRCExpiredDateConfirm = getRCExpiredDateConfirm
window.formatDateForInput = formatDateForInput
window.formatDateToDDMMYYYY = formatDateToDDMMYYYY