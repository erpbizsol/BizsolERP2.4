import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { EmployeeMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/EmployeeMasterServices.js';


var baseUrl = sessionStorage.getItem('AppBaseURL');
const Indx_Allowance = {
    Code: 0,
    AllowncesDetails_Code: 1,
    AllowncesName: 2,
    PartOfCTC: 3,
    Amount: 4
}
const Indx_Leave = {
    Code: 0,
    LeaveDetails_Code: 1,
    LeaveDesp: 2,
    HalfApplicable: 3,
    Applicability: 4,
    Applicable:5,
    Allowed: 6
}
const Indx_LastEmp = {
    Code: 0,
    Emp_Code: 1,
    Name: 2,
    Address: 3,
    Designation: 4,
     Delete: 5
}
const Indx_Edu = {
    Code: 0,
    Emp_Code: 1,
    Degree: 2,
    YearPassing: 3,
    CollageName: 4,
    Address: 5,
    Delete: 6
}
const Indx_Family = {
    Code: 0,
    Emp_Code: 1,
    MemberName: 2,
    Relation: 3,
    DOB: 4,
    Degree: 5,
    CollageName: 6,
    Address: 7,
    VisaNo: 8,
    VisaExp:9,
    Delete: 10
}
const Indx_Machine = {
    Code: 0,
    Emp_Code: 1,
    Machine: 2,
    Percent: 3,
    Delete: 4
}
const Indx_Deduct = {
    Code: 0,
    DeductionDesp:1,
    Condition: 2,
    Percentage:3,
    PercentageOf:4,
    EmployeeDeductionMasterDetail_Code: 5,
    Deduction: 6,
    Applicable: 7,
    Amount: 8
}
var arrayList_Degree = [];
var arrayList_Machine = [];
var arrayList_Des_LastEmp = [];
var arrayList_FamilyDegree = [];

$(document).ready(function () {
    $("#ERPHeading").text("Employee Master");
    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var UserMaster_Code = authKeyData.UserMaster_Code;
    buttonProperty();
    PBControls();
    PageLoad();
    DatePicker();
   
    $('#navMachine-tab').hide();
    if (param_Emp_Mode == 'View' && param_Emp_Code > 0) {
        PopulateData();
        $('input, textarea,select').prop('disabled', true);
        $("#btnBack").prop("disabled", false);
        $('select').prop('disabled', true);
    }
    if (param_Emp_Mode == 'Edit' && param_Emp_Code > 0) {
        //PopulateData();
        PageLoad();
    }

    //$('#btnBack').click(function (e) {
    //    const alertCls = confirm("Are you sure you want to leave this page?");
    //    if (alertCls == true) {
    //        window.location = baseUrl + "/HRMasters/EmployeeMaster/EmployeeList";
    //    } else {
    //        return false;
    //    }
    //});
    $("#txtEmpName").on("keyup", function () {
        $(this).val($(this).val().toUpperCase());
    });
    $("#txtFatherName").on("keyup", function () {
        $(this).val($(this).val().toUpperCase());
    });

    $("#spanOTCon").hide();
    $("#spanOT").hide();
    $("#spanPFAC").hide();
    $("#spanddlsalPF").hide();
    $("#spantxtsalPF").hide();
    $("#spanFPF").hide();
    $("#spanEPF").hide();
    $("#spanVPF").hide();
    $("#spanESI").hide();
    $("#spanPAN").hide();
    $('#ddlDepartment').on('change', function () {
        var Department = $('#ddlDepartment option:selected').text();
        EmployeeMasterService.GetSubDepartmentMasterList(Department).then(function (response) {
            if (response.length > 0) {
                var arrayList = [];
                response = response.map((item) => ({
                    key: item.Code, value: item.SubDepartmentName
                }));
                arrayList = response;

                BindSelect2FromDataList($('#ddlSubDepartment'), arrayList, "FirstItemZero", "100%");
               
            }
        });
    });
    $('#ddlOTApplicable').on('change', function () {
        if ($(this).val() == 'Y') {
            $("#ddlOTRateCondition").prop("disabled", false);
            $("#txtOTRate").prop("disabled", false);
            $("#spanOTCon").show();
            $("#spanOT").show();
        } else {
            $("#ddlOTRateCondition").prop("disabled", true);
            $("#txtOTRate").prop("disabled", true);
            $("#spanOTCon").hide();
            $("#spanOT").hide();
        }
    });
    $('#ddlPFApplicable').on('change', function () {
        if ($(this).val() == 'Y') {
            $("#txtPFAccountNo").prop("disabled", false);
            $("#ddlSalaryForPF").prop("disabled", false);
            $("#txtSalaryForPF").prop("disabled", false);
            $("#txtFPFRate").prop("disabled", false);
            $("#txtEPFRate").prop("disabled", false);
            $("#txtVPFRate").prop("disabled", false);
           
            $("#spanPFAC").show();
            $("#spanddlsalPF").show();
            $("#spantxtsalPF").show();
            $("#spanFPF").show();
            $("#spanEPF").show();
            $("#spanVPF").show();
           
            
        } else {
            $("#txtPFAccountNo").prop("disabled", true);
            $("#ddlSalaryForPF").prop("disabled", true);
            $("#txtSalaryForPF").prop("disabled", true);
            $("#txtFPFRate").prop("disabled", true);
            $("#txtEPFRate").prop("disabled", true);
            $("#txtVPFRate").prop("disabled", true);

            $("#spanPFAC").hide();
            $("#spanddlsalPF").hide();
            $("#spantxtsalPF").hide();
            $("#spanFPF").hide();
            $("#spanEPF").hide();
            $("#spanVPF").hide();
        }


    });
    $('#ddlESIApplicable').on('change', function () {
        if ($(this).val() == 'Y') {
            $("#txtESIInsuranceNo").prop("disabled", false);
           
            $("#spanESI").show();
        } else {
            $("#txtESIInsuranceNo").prop("disabled", true);
           
            $("#spanESI").hide();
        }
    });
    $('#ddlTDSApplicable').on('change', function () {

        if ($(this).val() == 'Y') {
            $("#txtPAN").prop("disabled", false);
            $("#spanPAN").show();
        } else {
            $("#txtPAN").prop("disabled", true);
            $("#spanPAN").hide();
        }

    });

    $('#btnOtherAllowance').click(function () {
        ShowAllowanceModal();
    });
    $('#btnDeduction').click(function () {
        ShowDeductionModal();
    });
    $('#btnLeave').click(function () {
        ShowLeaveModal();
    });
    TabEnableDisable();

    $('#txtFileInput').change(function (event) {
        if (validateFileType()) {
            var file = event.target.files[0];  // Get the selected file
            if (file) {
                // Convert file to Base64 string using the Promise-based function
                fileToBase64(file)
                    .then(function (base64String) {
                        // Display the Base64 string in the output div
                        $('#hfFileInput').val(removeBase64Prefix(base64String));
                        $('#imgSelfie').attr('src', base64String);
                        console.log('Base64 String:', base64String);  // For debugging
                    })
                    .catch(function (error) {
                        console.error('Error:', error);
                    });

            } else {
                $('#hfFileInput').val('No file selected');
            }
        }
    });

    $('#ddlBankName').change(function (event) {
        GetBankMasterByCode();
    });

    //$('#btnCheckOut').click(function (e) {
    //    CheckOutVisit();

    //});

    $('#imgSelfie').click(function () {
        ShowImageModal(this.src);


    });

    $('#txtBasicSalary, #txtDA, #txtHRA, #txtConvayance').on('change', function () {
        CalculateTotalSalaryAndCTC();
    });

    $('#ddlCountry').on('focus', function () {
        // Needed because focus fires before the select2 container is ready
        let self = this;
        setTimeout(function () {
            $(self).select2('open');
        }, 100);
    });

    // Focus on the search input when dropdown opens
    $(document).on('select2:open', function () {
        // Timeout to ensure the input is rendered
        setTimeout(() => {
            document.querySelector('.select2-container--open .select2-search__field')?.focus();
        }, 0);
    });
});
function ShowImageModal(strSrc) {

    $('#ImgModal').attr("src", strSrc);
    $('#ImageModal').modal('show');

    $(".modal-backdrop").remove();
}
function SetImageControl() {
    if ($('#hfFileInput').val() !== '') {
        var imgdata = $('#hfFileInput').val();
        var base64String = 'data:image/png;base64,' + imgdata;
        $('#imgSelfie').attr('src', base64String);
    }
}
function CloseModal() {
    $('#ImgModal').modal('hide');
}

function validateFileType() {
    var IsValid = true;
    var fileName = document.getElementById("txtFileInput").value;
    var SizeOverload = false;
    if (fileName.trim() != '') {

        var idxDot = fileName.lastIndexOf(".") + 1;
        var extFile = fileName.substr(idxDot, fileName.length).toLowerCase();
        if (extFile == "jpg" || extFile == "jpeg" || extFile == "png" || extFile == "gif") {
            //TO DO
        } else {

            IsValid = false;
        }

        var file = $('#txtFileInput')[0].files[0];
        var Size = parseFloat(parseInt(file.size) / 1000);
        if (Size > 4096) {

            fileName.value = '';
            IsValid = false;
            SizeOverload = true;

        }
    }
    if (IsValid == true && SizeOverload == false) {
        const elements = document.querySelectorAll(`[id^="Photo_"]`);

        elements.forEach(element => {

            var photo_FileName = element.value;
            if (photo_FileName.trim() != '') {

                var idxDot1 = photo_FileName.lastIndexOf(".") + 1;
                var extFile = photo_FileName.substr(idxDot1, photo_FileName.length).toLowerCase();
                if (extFile == "jpg" || extFile == "jpeg" || extFile == "png" || extFile == "gif") {
                    //TO DO
                } else {

                    IsValid = false;
                }
                var photo_Size = parseFloat(parseInt(element.files[0].size) / 1000);
                if (photo_Size > 4096) {

                    element.value = '';
                    IsValid = false;
                    SizeOverload = true;

                }
            }
        });
    }
    if (IsValid == false && SizeOverload == false) {
        toastr.error("Only jpg, jpeg, png and gif files are allowed as Attachment!");
    }
    else if (IsValid == false && SizeOverload == true) {
        toastr.error("Please upload an image less than 4MB!");
    }
    return IsValid;
}
function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();

        reader.onload = function (e) {
            resolve(e.target.result);  // Resolve with the Base64 string
        };

        reader.onerror = function (e) {
            reject('Error reading file: ' + e.target.error);  // Reject if an error occurs
        };

        reader.readAsDataURL(file);  // Read the file as Base64
    });
}

function removeBase64Prefix(base64String) {

    // Regex to match the prefix 'data:image/*;base64,' and remove it
    var regex = /^data:image\/[a-zA-Z]*;base64,/;
    return base64String.replace(regex, '');
}
function TabEnableDisable() {
    if (param_Emp_Code > 0) {

        $('#professional-tab').removeClass('disabled'); 
        $('#professional-tab').attr('aria-disabled', 'false'); 
        //$('#professional-tab').addAttr('data-bs-toggle'); 

        $('#Bank-tab').removeClass('disabled');
        $('#Bank-tab').attr('aria-disabled', 'false');
        //$('#Bank-tab').addAttr('data-bs-toggle'); 

        $('#Attendence-tab').removeClass('disabled');
        $('#Attendence-tab').attr('aria-disabled', 'false');
        //$('#Attendence-tab').addAttr('data-bs-toggle'); 

        $('#Family-tab').removeClass('disabled');
        $('#Family-tab').attr('aria-disabled', 'false');
        //$('#Family-tab').addAttr('data-bs-toggle'); 

        $('#Machine-tab').removeClass('disabled');
        $('#Machine-tab').attr('aria-disabled', 'false');
        //$('#Machine-tab').addAttr('data-bs-toggle');

        $('#OtherDetails-tab').removeClass('disabled');
        $('#OtherDetails-tab').attr('aria-disabled', 'false');

    } else {
        $('#professional-tab').addClass('disabled'); 
        $('#professional-tab').attr('aria-disabled', 'true');
        //$('#professional-tab').removeAttr('data-bs-toggle'); 

        $('#Bank-tab').addClass('disabled');
        $('#Bank-tab').attr('aria-disabled', 'true');
       // $('#Bank-tab').removeAttr('data-bs-toggle'); 

        $('#Attendence-tab').addClass('disabled');
        $('#Attendence-tab').attr('aria-disabled', 'true');
        //$('#Attendence-tab').removeAttr('data-bs-toggle'); 

        $('#Family-tab').addClass('disabled');
        $('#Family-tab').attr('aria-disabled', 'true');
       // $('#Family-tab').removeAttr('data-bs-toggle'); 

        $('#Machine-tab').addClass('disabled');
        $('#Machine-tab').attr('aria-disabled', 'true');
        //$('#Machine-tab').removeAttr('data-bs-toggle'); 

        $('#OtherDetails-tab').addClass('disabled');
        $('#OtherDetails-tab').attr('aria-disabled', 'true');
    }
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}
function convertDateFormatSave(dateString) {
    const [day, month, year] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}
function convertDateFormat2(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${year}-${month}-${day}`;
}

function convertDateFormat3(dateString) {
    const [year, month, day] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${year}-${month}-${day}`;
}
function DatePicker() {

    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();

    $('#dtDOB, #dtDOM').val(`${day}-${month}-${year}`);
    $('#dtDOB, #dtDOM').datepicker({
        format: 'dd-mm-yyyy',
        autoclose: true,
        endDate: new Date(),
        beforeShowDay: function (date) {
            var today = new Date();
            if (date > today) {
                return [false, 'ui-state-disabled', 'Future dates disabled'];
            }
            return [true, ''];
        }
    });

}
function parseDate(dateStr) {
    var parts = dateStr.split('-');
    // Ensure the date is in dd-mm-yyyy format and create a new Date object
    return new Date(parts[2], parts[1] - 1, parts[0]);
}
function PopulateData() {
    var Code = param_Emp_Code;

    EmployeeMasterService.GetEmployeeMasterByCode(Code).then(function (response) {
        if (response.EmployeeMaster.length >0) {
            let Code = response.EmployeeMaster[0].Code;
            let CardNoDesp = response.EmployeeMaster[0].CardNoDesp;
            let CardNoInitial = response.EmployeeMaster[0].CardNoInitial;
            let EmployeeCardNo = response.EmployeeMaster[0].EmployeeCardNo;
            let Title = response.EmployeeMaster[0].Title;
            let EmployeeName = response.EmployeeMaster[0].EmployeeName;
            let FatherName = response.EmployeeMaster[0].FatherName;
            let ParmanentAddress = response.EmployeeMaster[0].ParmanentAddress;
            let PresentAddress = response.EmployeeMaster[0].PresentAddress;
            let ContactNos = response.EmployeeMaster[0].ContactNos;
            let Sex = response.EmployeeMaster[0].Sex;
            let MaretialStatus = response.EmployeeMaster[0].MaretialStatus;
            let DateofBirth = response.EmployeeMaster[0].DateofBirth;
            let DateofMarrige = response.EmployeeMaster[0].DateofMarrige;
            let EducationalBackGround = response.EmployeeMaster[0].EducationalBackGround;
            let CloseRelativeDetails = response.EmployeeMaster[0].CloseRelativeDetails;
            let DepartmentMaster_Code = response.EmployeeMaster[0].DepartmentMaster_Code;
            let DepartmentName = response.EmployeeMaster[0].DepartmentName;
            let SubDepartmentMaster_Code = response.EmployeeMaster[0].SubDepartmentMaster_Code;
            let SubDepartmentName = response.EmployeeMaster[0].SubDepartmentName;
            let DesignationMaster_Code = response.EmployeeMaster[0].DesignationMaster_Code;
            let DesignationMaster_CodeActual = response.EmployeeMaster[0].DesignationMaster_CodeActual;
            let DesignationMaster_CodeTemp = response.EmployeeMaster[0].DesignationMaster_CodeTemp;
            let DesignationName = response.EmployeeMaster[0].DesignationName;
            let DesignationName_Actual = response.EmployeeMaster[0].DesignationName_Actual;
            let DesignationName_Temp = response.EmployeeMaster[0].DesignationName_Temp;
            let DateofJoining = response.EmployeeMaster[0].DateofJoining;
            let WorkingHours = response.EmployeeMaster[0].WorkingHours;
            let BasicSalary = response.EmployeeMaster[0].BasicSalary;
            let BasicSalaryForPF = response.EmployeeMaster[0].BasicSalaryForPF;
            let SalaryLimit = response.EmployeeMaster[0].SalaryLimit;
            let HRAActual = response.EmployeeMaster[0].HRAActual;
            let HRAToPay = response.EmployeeMaster[0].HRAToPay;
            let ConveyanceActual = response.EmployeeMaster[0].ConveyanceActual;
            let ConveyanceToPay = response.EmployeeMaster[0].ConveyanceToPay;
            let SpecialAllowance = response.EmployeeMaster[0].SpecialAllowance;
            let PaymentMode = response.EmployeeMaster[0].PaymentMode;
            let OTApplicable = response.EmployeeMaster[0].OTApplicable;
            let OTRate = response.EmployeeMaster[0].OTRate;
            let PFApplicable = response.EmployeeMaster[0].PFApplicable;
            let PFAccountNo = response.EmployeeMaster[0].PFAccountNo;
            let ESIApplicable = response.EmployeeMaster[0].ESIApplicable;
            let InsuranceNo = response.EmployeeMaster[0].InsuranceNo;
            let Shift = response.EmployeeMaster[0].Shift;
            let Grade = response.EmployeeMaster[0].Grade;
            let TDSApplicable = response.EmployeeMaster[0].TDSApplicable;
            let Dispancry = response.EmployeeMaster[0].Dispancry;
            let LeaveDate = response.EmployeeMaster[0].LeaveDate;
            let DatabaseLocation_Code = response.EmployeeMaster[0].DatabaseLocation_Code;
            let BankACNo = response.EmployeeMaster[0].BankACNo;
            let CreateDate = response.EmployeeMaster[0].CreateDate;
            let PanNo = response.EmployeeMaster[0].PanNo;
            let ReasonForLeaving = response.EmployeeMaster[0].ReasonForLeaving;
            let Weeklyoff = response.EmployeeMaster[0].Weeklyoff;
            let ELPerMonth = response.EmployeeMaster[0].ELPerMonth;
            let CLPerMonth = response.EmployeeMaster[0].CLPerMonth;
            let CLApplicableFrom = response.EmployeeMaster[0].CLApplicableFrom;
            let ELApplicableFrom = response.EmployeeMaster[0].ELApplicableFrom;
            let PFRate = response.EmployeeMaster[0].PFRate;
            let EPFRate = response.EmployeeMaster[0].EPFRate;
            let FPFRate = response.EmployeeMaster[0].FPFRate;
            let UpdateDate = response.EmployeeMaster[0].UpdateDate;
            let Email = response.EmployeeMaster[0].Email;
            let BankName = response.EmployeeMaster[0].BankName;
            let BankBranch = response.EmployeeMaster[0].BankBranch;
            let Address1 = response.EmployeeMaster[0].Address1;
            let Address2 = response.EmployeeMaster[0].Address2;
            let CityMaster_Code = response.EmployeeMaster[0].CityMaster_Code;
            let District = response.EmployeeMaster[0].District;
            let StateMaster_Code = response.EmployeeMaster[0].StateMaster_Code;
            let PIN = response.EmployeeMaster[0].PIN;
            let CountryMaster_Code = response.EmployeeMaster[0].CountryMaster_Code;
            let IsOTApplicableInSunday = response.EmployeeMaster[0].IsOTApplicableInSunday;
            let F_CommonValuesEmpCtgy_Code = response.EmployeeMaster[0].F_CommonValuesEmpCtgy_Code;
            let ExtraDutyApplicable = response.EmployeeMaster[0].ExtraDutyApplicable;
            let EmployeeMaster_Code_Senior = response.EmployeeMaster[0].EmployeeMaster_Code_Senior;
            let UserMaster_Code = response.EmployeeMaster[0].UserMaster_Code;
            let UserId = response.EmployeeMaster[0].UserId;
            let CostCanterIDMaster_Code = response.EmployeeMaster[0].CostCanterIDMaster_Code;
            let MobileNo = response.EmployeeMaster[0].MobileNo;
            let EmergencyContactNo = response.EmployeeMaster[0].EmergencyContactNo;
            let PersonalEMail = response.EmployeeMaster[0].PersonalEMail;
            let SalaryTimeofJoining = response.EmployeeMaster[0].SalaryTimeofJoining;
            let InsurancePolicyNo = response.EmployeeMaster[0].InsurancePolicyNo;
            let MobileAllowance = response.EmployeeMaster[0].MobileAllowance;
            let F_CommonValues_Code_Skill = response.EmployeeMaster[0].F_CommonValues_Code_Skill;
            let RestrictedHoliDay = response.EmployeeMaster[0].RestrictedHoliDay;
            let ConsiderWeeklyOffForSalaryCal = response.EmployeeMaster[0].ConsiderWeeklyOffForSalaryCal;
            let UANNo = response.EmployeeMaster[0].UANNo;
            let AadharNo = response.EmployeeMaster[0].AadharNo;
            let ConsiderHRAWithoutAbsent = response.EmployeeMaster[0].ConsiderHRAWithoutAbsent;
            let ConsiderConveyanceWithoutAbsent = response.EmployeeMaster[0].ConsiderConveyanceWithoutAbsent;
            let ConsiderSplAllowWithoutAbsent = response.EmployeeMaster[0].ConsiderSplAllowWithoutAbsent;
            let MonthlyIncentive = response.EmployeeMaster[0].MonthlyIncentive;
            let OtherSpecialAllowance = response.EmployeeMaster[0].OtherSpecialAllowance;
            let IFSC = response.EmployeeMaster[0].IFSC;
            let ClientMaster_Code = response.EmployeeMaster[0].ClientMaster_Code;
            let IncrementDueDate = response.EmployeeMaster[0].IncrementDueDate;
            let SecondWeeklyoff = response.EmployeeMaster[0].SecondWeeklyoff;
            let FirstSecondWeeklyoffON = response.EmployeeMaster[0].FirstSecondWeeklyoffON;
            let SecondSecondWeeklyoffON = response.EmployeeMaster[0].SecondSecondWeeklyoffON;
            let TempDesigName = response.EmployeeMaster[0].TempDesigName;
            let SLPerMonth = response.EmployeeMaster[0].SLPerMonth;
            let SLApplicableFrom = response.EmployeeMaster[0].SLApplicableFrom;
            let FLPerMonth = response.EmployeeMaster[0].FLPerMonth;
            let FLApplicableFrom = response.EmployeeMaster[0].FLApplicableFrom;
            let IsPMRPYApplicable = response.EmployeeMaster[0].IsPMRPYApplicable;
            let EmployeePassword = response.EmployeeMaster[0].EmployeePassword;
            let ReligionMaster_Code = response.EmployeeMaster[0].ReligionMaster_Code;
            let EmployeeGradeMaster_Code = response.EmployeeMaster[0].EmployeeGradeMaster_Code;
            let TransportationRequired = response.EmployeeMaster[0].TransportationRequired;
            let UpdatedBy = response.EmployeeMaster[0].UpdatedBy;
            let VPFRate = response.EmployeeMaster[0].VPFRate;
            let AccountMaster_Code = response.EmployeeMaster[0].AccountMaster_Code;
            let AccountDesp = response.EmployeeMaster[0].AccountDesp;
            let AdvAccountMaster_Code = response.EmployeeMaster[0].AdvAccountMaster_Code;
            let ExtraSalaryHolidaVsWeeklyOff = response.EmployeeMaster[0].ExtraSalaryHolidaVsWeeklyOff;
            let AutoPayHoliday = response.EmployeeMaster[0].AutoPayHoliday;
            let NoofIncentiveDays = response.EmployeeMaster[0].NoofIncentiveDays;
            let F_CommonValues_IncentiveAs = response.EmployeeMaster[0].F_CommonValues_IncentiveAs;
            let EmployeeLocation = response.EmployeeMaster[0].EmployeeLocation;
            let IsTransferEmployee = response.EmployeeMaster[0].IsTransferEmployee;
            let Nationality = response.EmployeeMaster[0].Nationality;
            let TrustFlagApplicable = response.EmployeeMaster[0].TrustFlagApplicable;
            let EPFTrustFlag = response.EmployeeMaster[0].EPFTrustFlag;
            let VPFTrustFlag = response.EmployeeMaster[0].VPFTrustFlag;
            let FPFTrustFlag = response.EmployeeMaster[0].FPFTrustFlag;
            let GPAPolicyFlagApplicable = response.EmployeeMaster[0].GPAPolicyFlagApplicable;
            let GratuityFlagApplicable = response.EmployeeMaster[0].GratuityFlagApplicable;
            let SuperannuationFlag = response.EmployeeMaster[0].SuperannuationFlag;
            let LTAFlag = response.EmployeeMaster[0].LTAFlag;
            let MediclaimPolicyFlag = response.EmployeeMaster[0].MediclaimPolicyFlag;
            let DateOfConfirmationNewJoining = response.EmployeeMaster[0].DateOfConfirmationNewJoining;
            let F_EmployeeLocationMaster_Code = response.EmployeeMaster[0].F_EmployeeLocationMaster_Code;
            let Telephone = response.EmployeeMaster[0].Telephone;
            let EmployeeNameInBank = response.EmployeeMaster[0].EmployeeNameInBank;
            let TotalCTCAmount = response.EmployeeMaster[0].TotalCTCAmount;
            let CTCCalculationDesp = response.EmployeeMaster[0].CTCCalculationDesp;
            let Verified = response.EmployeeMaster[0].Verified;
            let VerifiedBy = response.EmployeeMaster[0].VerifiedBy;
            let VerifiedON = response.EmployeeMaster[0].VerifiedON;
            let LabourWelfareAmount = response.EmployeeMaster[0].LabourWelfareAmount;
            let AllowBenifitOfSecondAndFourthSaturday = response.EmployeeMaster[0].AllowBenifitOfSecondAndFourthSaturday;
            let POFTNo = response.EmployeeMaster[0].POFTNo;
            let ActualSalary = response.EmployeeMaster[0].ActualSalary;
            let ABRYForPFFrom = response.EmployeeMaster[0].ABRYForPFFrom;
            let ABRYForESIFrom = response.EmployeeMaster[0].ABRYForESIFrom;
            let SuperannuationID = response.EmployeeMaster[0].SuperannuationID;
            let LastWorkingDate = response.EmployeeMaster[0].LastWorkingDate;
            let ContributionPer = response.EmployeeMaster[0].ContributionPer;
            let BloodGroup = response.EmployeeMaster[0].BloodGroup;
            let CanteenFacility = response.EmployeeMaster[0].CanteenFacility;
            let UserName = response.EmployeeMaster[0].UserName;
            let VerifiedByUserName = response.EmployeeMaster[0].VerifiedByUserName;
            let DearnessAllowance = response.EmployeeMaster[0].DearnessAllowance;
            let Category = response.EmployeeMaster[0].Category;
            let EmployeeSkill = response.EmployeeMaster[0].EmployeeSkill;
            let OTRateCondition = response.EmployeeMaster[0].OTRateCondition;
            let UID2No = response.EmployeeMaster[0].UID2No;
            let TotalDeduction = response.EmployeeMaster[0].TotalDeduction;
            let TotalLeave = response.EmployeeMaster[0].TotalLeave;
            

            var ContactArray = ContactNos.split('-');

            /// Personal Details Tab Values
            $('#txtCardPrefix').val(CardNoInitial);
            $('#txtCardNo').val(EmployeeCardNo);
            $('#title').val(Title);
            $('#txtEmpName').val(EmployeeName);
            $('#txtFatherName').val(FatherName);
            $('#txtPermanentAddress').val(ParmanentAddress);
            $('#txtPersentAddress').val(PresentAddress);
            BizSolHelperFunction.SelectOptionByText('ddlCountry', Nationality);
            $('#ddlCountryCode').val(ContactArray[0]);
            //BizSolHelperFunction.SelectOptionByText('ddlCountryCode', ContactArray[0]);
            $('#txtContact').val(ContactArray[1]);
            $('#txtMobile').val(MobileNo);
            $('#txtEmergencyContact').val(EmergencyContactNo);
            $('#txtEmail').val(Email);
            $('#txtPersonalEmail').val(PersonalEMail);
            BizSolHelperFunction.SelectOptionByText('ddlGender', Sex);
            $('#dtDOB').val(DateofBirth !== null && DateofBirth !== '' ? convertDateFormat(DateofBirth) : '');
            $('#dtDOM').val(DateofMarrige !== null && DateofMarrige !== '' ? convertDateFormat(DateofMarrige) : '');
            $('#txtUID1').val(AadharNo);
            $('#txtUID2').val(UID2No);
            $('#ddlBloodGroup').val(BloodGroup);
            BizSolHelperFunction.SelectOptionByText('ddlMaritalStatus', MaretialStatus);
            BizSolHelperFunction.SelectOptionByText('ddlUserName', UserName);
            $('#txtLocation').val(EmployeeLocation);
            //$('#ddlEmpSkill').val(F_CommonValues_Code_Skill);
            BizSolHelperFunction.SelectOptionByText('ddlEmpGrade', Grade);
            //$('#ddlEmpCategory').val(Category);
            BizSolHelperFunction.SelectOptionByText('ddlEmpCategory', Category);
            BizSolHelperFunction.SelectOptionByText('ddlEmpSkill', EmployeeSkill);
            BizSolHelperFunction.SelectOptionByText('ddlOTRateCondition', OTRateCondition);
            $("#dtDOB").datepicker("setDate", DateofBirth);
            $("#dtDOM").datepicker("setDate", DateofMarrige);


            //Professional Details Tab Values

            BizSolHelperFunction.SelectOptionByText('ddlDepartment', DepartmentName);
            BizSolHelperFunction.SelectOptionByText('ddlSubDepartment', SubDepartmentName);
            BizSolHelperFunction.SelectOptionByText('ddlDesignation', DesignationName);
            $('#dtDOJ').val(DateofJoining !== null && DateofJoining !== '' ? convertDateFormat2(DateofJoining) : '');
            //BizSolHelperFunction.SelectOptionByText('ddlShift', Shift);
            $('#ddlShift').val(Shift).trigger('change');
            $('#txtWorkingHours').val(WorkingHours);
            $('#txtBasicSalary').val(BasicSalary);
            $('#txtDA').val(DearnessAllowance);
            $('#txtHRA').val(HRAActual);
            $('#txtConvayance').val(ConveyanceActual);
            $('#txtOtherAllowance').val(OtherSpecialAllowance);
            BizSolHelperFunction.SelectOptionByText('ddlPaymentMode', PaymentMode);
            BizSolHelperFunction.SelectOptionByText('ddlOTApplicable', OTApplicable);
            BizSolHelperFunction.SelectOptionByText('ddlOTRateCondition', OTRateCondition) ;
            $('#txtOTRate').val(OTRate);
            BizSolHelperFunction.SelectOptionByText('ddlPFApplicable', PFApplicable);
            $('#txtPFAccountNo').val(PFAccountNo);
            BizSolHelperFunction.SelectOptionByText('ddlSalaryForPF', PFApplicable);
            $('#txtSalaryForPF').val(BasicSalaryForPF);
            $('#txtFPFRate').val(FPFRate);
            $('#txtEPFRate').val(EPFRate);
            $('#txtVPFRate').val(VPFRate);
            BizSolHelperFunction.SelectOptionByText('ddlESIApplicable', ESIApplicable);
            $('#txtESIInsuranceNo').val(InsuranceNo);
            BizSolHelperFunction.SelectOptionByText('ddlTDSApplicable', TDSApplicable);
            $('#txtPAN').val(PanNo);
            if (OTApplicable == 'Yes') {
                $("#ddlOTRateCondition").prop("disabled", false);
                $("#txtOTRate").prop("disabled", false);
                $("#spanOTCon").show();
                $("#spanOT").show();
            } else {
                $("#ddlOTRateCondition").prop("disabled", true);
                $("#txtOTRate").prop("disabled", true);
                $("#spanOTCon").hide();
                $("#spanOT").hide();
            }
            if (PFApplicable == 'Yes') {
                $("#txtPFAccountNo").prop("disabled", false);
                $("#ddlSalaryForPF").prop("disabled", false);
                $("#txtSalaryForPF").prop("disabled", false);
                $("#txtFPFRate").prop("disabled", false);
                $("#txtEPFRate").prop("disabled", false);
                $("#txtVPFRate").prop("disabled", false);

                $("#spanPFAC").show();
                $("#spanddlsalPF").show();
                $("#spantxtsalPF").show();
                $("#spanFPF").show();
                $("#spanEPF").show();
                $("#spanVPF").show();


            } else {
                $("#txtPFAccountNo").prop("disabled", true);
                $("#ddlSalaryForPF").prop("disabled", true);
                $("#txtSalaryForPF").prop("disabled", true);
                $("#txtFPFRate").prop("disabled", true);
                $("#txtEPFRate").prop("disabled", true);
                $("#txtVPFRate").prop("disabled", true);

                $("#spanPFAC").hide();
                $("#spanddlsalPF").hide();
                $("#spantxtsalPF").hide();
                $("#spanFPF").hide();
                $("#spanEPF").hide();
                $("#spanVPF").hide();
            }
            if (ESIApplicable == 'Yes') {
                $("#txtESIInsuranceNo").prop("disabled", false);

                $("#spanESI").show();
            } else {
                $("#txtESIInsuranceNo").prop("disabled", true);

                $("#spanESI").hide();
            }
            if (TDSApplicable == 'Yes') {
                $("#txtPAN").prop("disabled", false);
                $("#spanPAN").show();
            } else {
                $("#txtPAN").prop("disabled", true);
                $("#spanPAN").hide();
            }
            $('#txtLeave').val(TotalLeave);
            $('#txtDeduction').val(TotalDeduction);

            //Bank Details Tab Values
            
            $('#txtBankAccNo').val(BankACNo);
            BizSolHelperFunction.SelectOptionByText('ddlBankName', BankName);
            $('#txtEmpNameInBank').val(EmployeeNameInBank);
            $('#txtBankBranch').val(BankBranch);
            $('#txtIFSC').val(IFSC);
            $('#txtBankAdd1').val(Address1);
            $('#txtBankAdd2').val(Address2);
            $('#ddlBankCity').val(CityMaster_Code).trigger('change');
            //BizSolHelperFunction.SelectOptionByText('ddlBankCity', response[0].City);
            $('#txtBankDistrict').val(District);
            $('#ddlBankState').val(StateMaster_Code).trigger('change');
            //BizSolHelperFunction.SelectOptionByText('ddlBankState', response[0].State);
            $('#txtBankPin').val(PIN);
            $('#ddlBankCountry').val(CountryMaster_Code).trigger('change');
            // BizSolHelperFunction.SelectOptionByText('ddlBankCountry', response[0].Nation);

            //Family Details

            $('#txtEduBack').val(EducationalBackGround);
            $('#txtCloseRelative').val(CloseRelativeDetails);
            $('#txtInsurancePolicyNo').val(InsurancePolicyNo);

            PopulateDegreeDetails(response.EmployeeDegreeDetails);
            PopulateFamilyDetails(response.EmployeeFamilyDetails);
            PopulateLastEmpDetails(response.EmployeeLastEmployerDetail);
            PopulateMachineDetails(response.EmployeeMasterMachineWiseAllocation);
            PopulatePictureDetails(response.EmployeePictureDetail);
            PopulateAttendenceDetails(response.EmployeeAttendanceDetail);
            CalculateTotalSalaryAndCTC();
        }
    });
}
function PageLoad() {
    GetEmployeeConfiguration();
    GetF_PayrollParameter();
}

function GetF_PayrollParameter() {
    EmployeeMasterService.GetF_PayrollParameter().then(function (response) {
        if (response.length > 0) {
            //sessionStorage.setItem('PayrollParameter', JSON.stringify(response[0]));
            var ShowMachineWiseAllocation = response[0].ShowMachineWiseAllocation;
            if (ShowMachineWiseAllocation == 'Y') {
                $('#navMachine-tab').show();
            } else {
                $('#navMachine-tab').hide();
            }
        }
    });
}
function PopulateDegreeDetails(data) {
    var tbody = $('#tblEducationalDegree tbody');
    tbody.empty();
    data.forEach(function (item, index) {

        var tbItemConsumeRowNo = index + 1;

        var td_Code = `<input type="text"  id="txtCode` + tbItemConsumeRowNo + `" name="txtCode" placeholder="" value=0  autocomplete="off"  onchange="" required>`;
        var td_Emp_Code = `<input type="text"  id="txtEmp_Code` + tbItemConsumeRowNo + `" value="${item.EmployeeMaster_Code}"  name="txtEmp_Code" placeholder="" value=0  autocomplete="off"  onchange="" required>`;
        var td_Degree = `<select id="ddlDegree` + tbItemConsumeRowNo + `" value="${item.DegreeMaster_Code}"  class="BizSolFormControl box_border form-control form-control-sm sizeDesInput" name="ddlDegree"  autocomplete="off" ></select>`;
        var td_YearPassing = `<input type="number" min="1900" max="2100" step="1" value="${item.YearPassing}"   id="txtYearPassing` + tbItemConsumeRowNo + `" class="BizSolFormControl box_border form-control form-control-sm" name="txtYearPassing" placeholder=""  autocomplete="off"  onchange="" required>`;
        var td_CollageName = `<input type="text"  id="txtCollageName` + tbItemConsumeRowNo + `" value="${item.CollegeName}"  class="BizSolFormControl box_border form-control form-control-sm" name="txtCollageName" placeholder="" autocomplete="off"  onchange="" required>`;
        var td_Address = `<input type="text"  id="txtAddress` + tbItemConsumeRowNo + `" value="${item.AddressDetail}"  class="BizSolFormControl box_border form-control form-control-sm" name="txtAddress" placeholder="" autocomplete="off"  onchange="" required>`;
        var td_Delete = `<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light "  title="Delete" ><i class="fa fa-times" aria-hidden="true"></i></a>`;

        GetDegreeMasterList(tbItemConsumeRowNo, item.DegreeMaster_Code);

       

        var row = `
      <tr>
        <td  style="display:none">${td_Code}   </td>
         <td style="display:none">${td_Emp_Code}   </td>
        <td>${td_Degree}   </td>
        <td>${td_YearPassing}   </td>
        <td>${td_CollageName}   </td>
        <td>${td_Address}   </td>
        <td>${td_Delete}   </td>
      </tr>
    `;

        tbody.append(row);

    });
}

function PopulateAttendenceDetails(data) {
    
    if (data && Array.isArray(data) && data.length > 0) {
            $("#tblAttendence").show();
        const stringFilterColumn = ["Month Name", "Year Value"];
        const numericFilterColumn = ["Wages Rate", "OT Hours", "Total Actual Salary", "Monthly Incentive","Total Pay Days"];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                "Wages Rate": 'right',
                "OT Hours": 'right',
                "Total Actual Salary": 'right',
                "Monthly Incentive": 'right',
                "Present": 'right',
                "Total Pay Days": 'right',
                "EL": 'right',
                "CL": 'right',
                "OT Hours": 'right',
            };
        BizsolCustomFilterGrid.CreateDataTable("Attendence-header", "Attendence-body", data, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);

        }
   
}
function PopulateFamilyDetails(data) {
    var tbody = $('#tblFamilyDetails tbody');
    tbody.empty();
    data.forEach(function (item, index) {

        var tbItemConsumeRowNo = index + 1;

       var td_Code= `<input type="text"  id="txtCode` + tbItemConsumeRowNo + `"  name="txtCode" placeholder="" value=0  autocomplete="off"  onchange="" required>`;
        var td_Emp_Code = `<input type="text"  id="txtEmp_Code` + tbItemConsumeRowNo + `" value="${item.EmployeeMaster_Code}" name="txtEmp_Code" placeholder=""   autocomplete="off"  onchange="" required>`;
        var td_MemberName = `<input type="text"  id="txtMemberName` + tbItemConsumeRowNo + `" value="${item.MemberName}"class="BizSolFormControl box_border form-control form-control-sm"  name="txtMemberName" placeholder=""  autocomplete="off"  onchange="" required>`;
        var td_Relation = `<input type="text"  id="txtRelation` + tbItemConsumeRowNo + `" value="${item.Relation}"class="BizSolFormControl box_border form-control form-control-sm" name="txtRelation" placeholder=""   autocomplete="off"  onchange="" required>`;
        var td_DOB = `<input type="date"  id="txtDOB` + tbItemConsumeRowNo + `" class="BizSolFormControl box_border form-control form-control-sm" name="txtDOB" placeholder=""   autocomplete="off"  onchange="" required>`;
        var td_Degree = `<select id="ddlFamilyDegree` + tbItemConsumeRowNo + `" value="${item.DegreeMaster_Code}"class="BizSolFormControl box_border form-control form-control-sm sizeDesInput" name="ddlFamilyDegree"  autocomplete="off" ></select>`;
        var td_CollageName = `<input type="text"  id="txtCollageName` + tbItemConsumeRowNo + `" value="${item.CollegeName}" name="txtCollageName" placeholder="" class="BizSolFormControl box_border form-control form-control-sm"  autocomplete="off"  onchange="" required>`;
        var td_Address = `<input type="text"  id="txtAddress` + tbItemConsumeRowNo + `" value="${item.AddressDetail}"class="BizSolFormControl box_border form-control form-control-sm"  name="txtAddress" placeholder=""   autocomplete="off"  onchange="" required>`;
        var td_VisaNo = `<input type="text"  id="txtVisaNo` + tbItemConsumeRowNo + `" value="${item.FamilyVisaNo}"class="BizSolFormControl box_border form-control form-control-sm" name="txtVisaNo" placeholder=""  autocomplete="off"  onchange="" required>`;
        var td_VisaExp = `<input type="date"  id="dtVisaExp` + tbItemConsumeRowNo + `" class="BizSolFormControl box_border form-control form-control-sm" name="dtVisaExp" placeholder=""   autocomplete="off"  onchange="" required>`;
       var td_Delete= `<a id="btnDelete"  class=" btn btn-danger btn-sm waves-effect waves-light " title="Delete" ><i class="fa fa-times" aria-hidden="true"></i></a>`;

        

       
        var row = `
      <tr>
        <td  style="display:none">${td_Code}   </td>
         <td style="display:none">${td_Emp_Code}   </td>
        <td>${td_MemberName}   </td>
        <td>${td_Relation}   </td>
        <td>${td_DOB}   </td>
        <td>${td_Degree}   </td>
        <td>${td_CollageName}   </td>
        <td>${td_Address}   </td>
        <td>${td_VisaNo}   </td>
        <td>${td_VisaExp}   </td>
        <td>${td_Delete}   </td>
      </tr>
    `;

        tbody.append(row);

        GetFamilyDegreeMasterList(tbItemConsumeRowNo, item.DegreeMaster_Code);
        
        $('#txtDOB' + tbItemConsumeRowNo).val(item.BirthDate !== null && item.BirthDate !== '' ? item.BirthDate.split("T")[0] : '');
        $('#dtVisaExp' + tbItemConsumeRowNo).val(item.FamilyVisaExpiryOn !== null && item.FamilyVisaExpiryOn !== '' ? item.FamilyVisaExpiryOn.split("T")[0] : '');

    });
}
function PopulateLastEmpDetails(data) {
    var tbody = $('#tblLastEmployerDetails tbody');
    tbody.empty();
    data.forEach(function (item, index) {

        var tbItemConsumeRowNo = index + 1;

        var td_Code= `<input type="text"  id="txtCode` + tbItemConsumeRowNo + `"  name="txtCode" placeholder="" value=0  autocomplete="off"  onchange="" required>`;
        var td_Emp_Code = `<input type="text"  id="txtEmp_Code` + tbItemConsumeRowNo + `"  name="txtEmp_Code" placeholder="" value=${item.EmployeeMaster_Code}  autocomplete="off"  onchange="" required>`;
        var td_Name = `<input type="text"  id="txtName` + tbItemConsumeRowNo + `"  value=${item.EmpName} class="BizSolFormControl box_border form-control form-control-sm"  name="txtName" placeholder="" value=""  autocomplete="off"  onchange="" required>`;
        var td_Address = `<input type="text"  id="txtAddress` + tbItemConsumeRowNo + `"  value=${item.EmpAddress} class="BizSolFormControl box_border form-control form-control-sm" name="txtAddress" placeholder="" value=""  autocomplete="off"  onchange="" required>`;
        var td_Designation = `<select id="ddlEmpDesignation` + tbItemConsumeRowNo + `"  value=${item.DesignationMaster_Code} class="BizSolFormControl box_border form-control form-control-sm " name="ddlEmpDesignation"  autocomplete="off" ></select>`;
        var td_Delete= `<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light " title="Delete" ><i class="fa fa-times" aria-hidden="true"></i></a>`;

        GetDesignationMasterList_LastEmp(tbItemConsumeRowNo, item.DesignationMaster_Code);

       
        var row = `
      <tr>
        <td  style="display:none">${td_Code}   </td>
         <td style="display:none">${td_Emp_Code}   </td>
        <td>${td_Name}   </td>
        <td>${td_Address}   </td>
        <td>${td_Designation}   </td>
       
        <td>${td_Delete}   </td>
      </tr>
    `;

        tbody.append(row);
    });
}
function PopulateMachineDetails(data) {
    var tbody = $('#tblMachineAllocation tbody');
    tbody.empty();
    data.forEach(function (item, index) {

        var tbItemConsumeRowNo = index + 1;
        var td_Code = `<input type="text"  id="txtCode` + tbItemConsumeRowNo + `"  name="txtCode" placeholder="" value=${item.Code}  autocomplete="off"  onchange="" required>`;
        var td_Emp_Code = `<input type="text"  id="txtEmp_Code` + tbItemConsumeRowNo + `"  name="txtEmp_Code" placeholder="" value=${item.EmployeeMaster_Code}  autocomplete="off"  onchange="" required>`;
        var td_Machine = `<select id="ddlMachine` + tbItemConsumeRowNo + `" value=${item.MachineMaster_Code}  class="BizSolFormControl box_border form-control form-control-sm" name="ddlMachine"  autocomplete="off" ></select>`;
        var td_Percent = `<input type="number"  id="txtPercent` + tbItemConsumeRowNo + `"  value=${item.Percentage}  min="1" max="100" step="1"  class="BizSolFormControl box_border form-control form-control-sm" name="txtYearPassing" placeholder="" value=""  autocomplete="off"  onchange="" required>`;
        var td_Delete= `<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light" title="Delete"><i class="fa fa-times" aria-hidden="true"></i></a>`;
        GetMachineMasterList(tbItemConsumeRowNo, item.MachineMaster_Code);

       
        var row = `
      <tr>
        <td  style="display:none">${td_Code}   </td>
         <td style="display:none">${td_Emp_Code}   </td>
        <td>${td_Machine}   </td>
        <td>${td_Percent}   </td>
        <td>${td_Delete}   </td>
      </tr>
    `;

        tbody.append(row);
    });
}
function PopulatePictureDetails(data) {
    if (data.length > 0) {
        $('#hfFileInput').val(data[0].EmployeePicture);
        var imgdata = $('#hfFileInput').val();
        var base64String = 'data:image/png;base64,' + data[0].EmployeePicture;
        $('#imgSelfie').attr('src', base64String);
    }
    

    //SetImageControl();
}


function GetEmployeeConfiguration() {
    EmployeeMasterService.GetConfigEmployeeMaster().then(function (response) {
        if (response.length > 0) {
            sessionStorage.setItem('ConfigEmployeeMaster', JSON.stringify(response[0]));
            GetCountryMasterList();
            SetFieldsAsPerConfig();
        }
    });
}

function SetFieldsAsPerConfig() {
    var ConfigEmployeeMaster = JSON.parse(sessionStorage.getItem('ConfigEmployeeMaster'));
    let CardNoAutoManual = ConfigEmployeeMaster.CardNoAutoManual;
    let AadharNoHeader = ConfigEmployeeMaster.AadharNoHeader;
    let BasicSalaryHeader = ConfigEmployeeMaster.BasicSalaryHeader;
    let HRAHeader = ConfigEmployeeMaster.HRAHeader;
    let DAHeader = ConfigEmployeeMaster.DAHeader;
    let ConveyanceHeader = ConfigEmployeeMaster.ConveyanceHeader;
    let UIDHeader = ConfigEmployeeMaster.UIDHeader;
    let AadharNoHeaderMandatory = ConfigEmployeeMaster.AadharNoHeaderMandatory;
    let UIDMandatory = ConfigEmployeeMaster.UIDMandatory;
    let ESIApplicable = ConfigEmployeeMaster.ESIApplicable;


    $("#txtUID1Header").text(AadharNoHeader == '' ? "Aadhar No" : AadharNoHeader);
    if (UIDHeader == '') {
        $("#divUID2").prop('hidden', true);
    } else {
        $("#divUID2").prop('hidden', false);
        $("#txtUID2Header").text(UIDHeader);
    }
    if (AadharNoHeaderMandatory == 'Y') {
        $("#UID1Man").show();
    } else {
        $("#UID1Man").hide();
    }
    if (UIDMandatory == 'Y') {
        $("#UID2Man").show();
    } else {
        $("#UID2Man").hide();
    }
    if (CardNoAutoManual == 'A') {
        $("#txtCardNo").prop('disabled', true);
    } else {
        $("#txtCardNo").prop('disabled', false);
    }

    if (BasicSalaryHeader !== '') {
        $("#lblBasicSalary").text(BasicSalaryHeader);
    }
    if (DAHeader !== '') {
        $("#lblDA").text(DAHeader);
    }
    if (HRAHeader !== '') {
        $("#lblHRA").text(HRAHeader);
    }
    if (ConveyanceHeader !== '') {
        $("#lblConvayance").text(ConveyanceHeader);
    }
    if (ESIApplicable == 'N') {
        $("#ddlESIApplicable").prop('disabled', true);
        $("#txtESIInsuranceNo").prop('disabled', true);
    } else {
        $("#ddlESIApplicable").prop('disabled', false);
        BizSolHelperFunction.SelectOptionByText('ddlESIApplicable', 'No');
        $("#txtESIInsuranceNo").prop('disabled', false);
    }
}



function GetCountryMasterList() {
    EmployeeMasterService.GetCountryMasterList().then(function (response) {
        if (response.length > 0) {
            var arrayList_Country = [];
            response = response.map((item) => ({
                key: item.Code, value: item.CountryName
            }));
            arrayList_Country = response;

            BindSelect2FromDataList($('#ddlCountry'), arrayList_Country, "FirstItemZero", "100%");
            BindSelect2FromDataList($('#ddlBankCountry'), arrayList_Country, "FirstItemZero", "100%");
            BizSolHelperFunction.SelectOptionByText('ddlCountry', "INDIA");
            GetEmployeeCategory();
            GetUserList();
        }
    });
}
function GetEmployeeCategory() {
    EmployeeMasterService.EmployeeCategory().then(function (response) {
        if (response.length > 0) {
            var arrayList = [];
            response = response.map((item) => ({
                key: item.Item, value: item.Item
            }));
            arrayList = response;

            BindSelect2FromDataList($('#ddlEmpCategory'), arrayList, "FirstItemZero", "100%");
            GetEmployeeGrade();
        } else {
            GetEmployeeGrade();
        }
    });
}
function GetEmployeeGrade() {
    EmployeeMasterService.EmployeeGrade().then(function (response) {
        if (response.length > 0) {
            var arrayList = [];
            response = response.map((item) => ({
                key: item.Item, value: item.Item
            }));
            arrayList = response;

            BindSelect2FromDataList($('#ddlEmpGrade'), arrayList, "FirstItemZero", "100%");
            GetEmployeeSkill();
        } else {
            GetEmployeeSkill();
        }
    });
}
function GetEmployeeSkill() {
    EmployeeMasterService.EmployeeSkill().then(function (response) {
        if (response.length > 0) {
            var arrayList = [];
            response = response.map((item) => ({
                key: item.Item, value: item.Item
            }));
            arrayList = response;

            BindSelect2FromDataList($('#ddlEmpSkill'), arrayList, "FirstItemZero", "100%");
            if ((param_Emp_Mode == 'Edit' || param_Emp_Mode == 'View') && param_Emp_Code > 0) {
                PopulateData();
            }

        }
    });
}
function GetUserList() {
    EmployeeMasterService.GetUserList().then(function (response) {
        if (response.length > 0) {
            var arrayList = [];
            response = response.map((item) => ({
                key: item.Code, value: item.UserName
            }));
            arrayList = response;

            BindSelect2FromDataList($('#ddlUserName'), arrayList, "FirstItemZero", "100%");
            
            GetDepartmentMasterList();
        }
    });
}

function buttonProperty() {
    return {
        Save: { color: 'btn-success', visible: true, disabled: false, title: 'Save' },
        Print: { color: 'btn-secondary', visible: false, disabled: false, title: 'Print' },
        Back: { color: 'btn-primary', visible: true, disabled: false, title: 'Back' },
        Attachment: { color: 'btn-warning', visible: false, disabled: false, title: 'View' },
        Delete: { color: 'btn-danger', visible: false, disabled: false, title: 'Delete' },
        Verify: { color: 'btn-danger', visible: false, disabled: false, title: 'Verify' },
        Other: { color: 'btn-primary', visible: false, disabled: false, title: 'Other' }
    };
}
function EditData(editValue) {
    var Code = param_Emp_Code;

}
function calculateAge(dob) {
    let today = new Date();
    let birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    let m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
function ValidateData() {

    let IsValid = true;
    var MsgStr = "";
    var newLine = "<br>";

    let ConfigEmployeeMaster = JSON.parse(sessionStorage.getItem('ConfigEmployeeMaster'));

    let DuplicateCardNo = ConfigEmployeeMaster.DuplicateCardNo;
    let DuplicateEmpName = ConfigEmployeeMaster.DuplicateEmpName;
    let AadharNoHeader = ConfigEmployeeMaster.AadharNoHeader;
    let AadharNoHeaderMandatory = ConfigEmployeeMaster.AadharNoHeaderMandatory;
    let AadharNoDateValue = ConfigEmployeeMaster.AadharNoDateValue;
    let AadharNoMinLength = ConfigEmployeeMaster.AadharNoMinLength;
    let AadharNoMaxLength = ConfigEmployeeMaster.AadharNoMaxLength;
    let SubDepartmentApplicable = ConfigEmployeeMaster.SubDepartmentApplicable;
    let PFApplicable = ConfigEmployeeMaster.PFApplicable;
    let SalaryLimitForPF = ConfigEmployeeMaster.SalaryLimitForPF;
    let ESIApplicable = ConfigEmployeeMaster.ESIApplicable;
    let AskVPFRate = ConfigEmployeeMaster.AskVPFRate;
    let UIDHeader = ConfigEmployeeMaster.UIDHeader;
    let UIDMandatory = ConfigEmployeeMaster.UIDMandatory;
    let UIDValue = ConfigEmployeeMaster.UIDValue;
    let UIDMinLength = ConfigEmployeeMaster.UIDMinLength;
    let UIDMaxLength = ConfigEmployeeMaster.UIDMaxLength;
    var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    var phoneRegex = /^[0-9]{10}$/;

    let Employee_Name = $('#txtEmpName').val();
    let Emolyee_CardNo = '';

    let Employee_Code = param_Emp_Code;
    if (DuplicateCardNo == 'As Per Numeric No') {
        Emolyee_CardNo = $('#txtCardNo').val();

    } else {
        Emolyee_CardNo = $('#txtCardPrefix').val() + $('#txtCardNo').val();
    }
    if (Emolyee_CardNo !== '') {
        EmployeeMasterService.CheckDuplicateCardNo(Employee_Code, Emolyee_CardNo).then(function (response) {
            if (response.length > 0 && response.Status == 'N') {
                MsgStr += "* " + response.Msg + newLine;
                IsValid = false;
            }
        });
    }

    if (DuplicateEmpName == 'Y') {
        EmployeeMasterService.CheckEmployeeName(Employee_Code, Employee_Name).then(function (response) {
            if (response.length > 0 && response.Status == 'N') {
                MsgStr += "* " + response.Msg + newLine;
                IsValid = false;
            }
        });
    }

    if ($('#txtEmpName').val() == '') {
        MsgStr += "* Please Enter Employee Name !" + newLine;
        IsValid = false;
    }
    if ($('#txtFatherName').val() == '') {
        MsgStr += "* Please Enter Father's Name !" + newLine;
        IsValid = false;
    }
    if ($('#txtPermanentAddress').val() == '') {
        MsgStr += "* Please Enter Permanent Address !" + newLine;
        IsValid = false;
    }
    if ($('#txtPersentAddress').val() == '') {
        MsgStr += "* Please Enter Persent Address !" + newLine;
        IsValid = false;
    }
    if ($('#ddlCountry').val() == '') {
        MsgStr += "* Please Enter Nationality !" + newLine;
        IsValid = false;
    }
    if ($('#txtContact').val() == '') {
        MsgStr += "* Please Enter Contact No !" + newLine;
        IsValid = false;
    } else {
        if (phoneRegex.test($('#txtContact').val())) {

        } else {
            MsgStr += "* Please Enter valid Contact No !" + newLine;
            IsValid = false;
        }
    }
    if ($('#txtMobile').val() == '') {
        MsgStr += "* Please Enter Mobile No !" + newLine;
        IsValid = false;
    } else {
        if (phoneRegex.test($('#txtMobile').val())) {

        } else {
            MsgStr += "* Please Enter valid Mobile No !" + newLine;
            IsValid = false;
        }
    }

    if ($('#txtEmail').val() !== '') {
        var email = $("#txtEmail").val();
        if (emailPattern.test(email)) {
        } else {
            MsgStr += "* Please Enter Valid Email Id !" + newLine;
            IsValid = false;
        }
    }
    if ($('#txtPersonalEmail').val() !== '') {
        var email = $("#txtPersonalEmail").val();
        if (emailPattern.test(email)) {
        } else {
            MsgStr += "* Please Enter Valid Personal Email Id !" + newLine;
            IsValid = false;
        }
    }
    if ($('#dtDOB').val() == isNaN || $('#dtDOB').val() == undefined || $('#dtDOB').val() == '') {
        MsgStr += "* Please Select Date of Birth !" + newLine;
        IsValid = false;
    } else {
        let dob = new Date(convertDateFormatSave($('#dtDOB').val()));
        let today = new Date();

        if (dob > today) {
            MsgStr += "* Date of birth cannot be in the future !" + newLine;
            IsValid = false;
        }
        if (calculateAge(dob) < 14) {
            MsgStr += "* Employee Age must be at least 14 years old !" + newLine;
            IsValid = false;
        }
    }



    if ($('#ddlMaritalStatus option:selected').text() == 'Married') {
        if ($('#dtDOM').val() == isNaN || $('#dtDOM').val() == undefined || $('#dtDOM').val() == '') {
            MsgStr += "* Please Select Date of Marriage !" + newLine;
            IsValid = false;
        } else {
            let dom = new Date(convertDateFormatSave($('#dtDOM').val()));
            let today = new Date();
            if (dom > today) {
                MsgStr += "* Date of marriage cannot be in the future !" + newLine;
                IsValid = false;
            }
        }
       
        
    }
    
    var UID1Value = $('#txtUID1').val();
    if (AadharNoHeaderMandatory == 'Y' && UID1Value == '') {
        MsgStr += "* Please Enter " + AadharNoHeader + " !" + newLine;
        IsValid = false;
    } else if (AadharNoHeaderMandatory == 'Y' && UID1Value.length < AadharNoMinLength) {
        MsgStr += "* Minimum Length of " + AadharNoHeader + " should be " + AadharNoMinLength + " !" + newLine;
        IsValid = false;
    } else if (AadharNoHeaderMandatory == 'Y' && UID1Value.length > AadharNoMaxLength) {
        MsgStr += "* Maximum Length of " + AadharNoHeader + " should be " + AadharNoMaxLength + " !" + newLine;
        IsValid = false;
    }
    var UID2Value = $('#txtUID2').val();
    if (UIDMandatory == 'Y' && UID2Value == '') {
        MsgStr += "* Please Enter " + UIDHeader + " !" + newLine;
        IsValid = false;
    } else if (UIDMandatory == 'Y' && UID2Value.length < UIDMinLength) {
        MsgStr += "* Minimum Length of " + UIDHeader + " should be " + UIDMinLength + " !" + newLine;
        IsValid = false;
    } else if (UIDMandatory == 'Y' && UID2Value.length > UIDMaxLength) {
        MsgStr += "* Maximum Length of " + UIDHeader + " should be " + UIDMaxLength + " !" + newLine;
        IsValid = false;
    }
    if ($('#ddlUserName').val() == '') {
        MsgStr += "* Please Select User Name !" + newLine;
        IsValid = false;
    }

    if (param_Emp_Code > 0) {
        if ($('#dtDOJ').val() == '') {
            MsgStr += "* Please Select Date of Joining !" + newLine;
            IsValid = false;
        }

        if (( ESIApplicable == 'Y' && $('#ddlESIApplicable option:selected').text() =='Yes')) {
            if ($('#txtESIInsuranceNo').val() == '' || $('#txtESIInsuranceNo').val()<=0) {
                MsgStr += "* Please Enter ESI Insurance No !" + newLine;
                IsValid = false;
            }
        }

        if ( PFApplicable == 'Y' && $('#ddlTDSApplicable option:selected').text() == 'Yes') {
            if ($('#txtPAN').val() == '' ) {
                MsgStr += "* Please Enter PAN No !" + newLine;
                IsValid = false;
            }

        }
        
        if (SubDepartmentApplicable == 'Y' ) {
            if ($('#ddlSubDepartment option:selected').text() == '') {
                MsgStr += "* Please Select Sub Department !" + newLine;
                IsValid = false;
            }

        }
        if ($('#ddlOTApplicable option:selected').text() == 'Yes') {
            if ($('#ddlOTRateCondition option:selected').text() == '') {
                MsgStr += "* Please Select OT Rate Condition !" + newLine;
                IsValid = false;
            }
            if ($('#txtOTRate').val() == '') {
                MsgStr += "* Please Enter OT Rate !" + newLine;
                IsValid = false;
            }
        }

    }

    if (IsValid == false) {
        toastr.error(MsgStr);
        return false;
    }

}
function SaveData() {
    if (ValidateData() == false) {
        return false;
    }
    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var UserMaster_Code = authKeyData.UserMaster_Code;
    let ContactNo = $('#ddlCountryCode option:selected').text() + "-" + $('#txtContact').val();

    var allTablesData = {};
    var EmployeeMasterData = [];
    var EmployeeMasterRow = {};
    var EmployeeAllowncesData = [];
    var EmployeeAllowncesRow = {};
    var EmployeeDeductionData = [];
    var EmployeeDeductionRow = {};
    var EmployeeLeaveData = [];
    var EmployeeLeaveRow = {};
    var EmployeeDegreeData = [];
    var EmployeeDegreeRow = {};
    var EmployeeFamilyData = [];
    var EmployeeFamilyRow = {};
    var EmployeeMasterMachineData = [];
    var EmployeeMasterMachineRow = {};
    var EmployeePictureData = [];
    var EmployeePictureRow = {};
    var EmployeeLastEmployerData = [];
    var EmployeeLastEmployerRow = {};

    EmployeeMasterRow["Code"] = param_Emp_Code;
    EmployeeMasterRow["CardNoInitial"] = $('#txtCardPrefix').val();
    EmployeeMasterRow["EmployeeCardNo"] = $('#txtCardNo').val() == '' ? 0 : parseInt($('#txtCardNo').val());
    EmployeeMasterRow["Title"] = $('#title option:selected').text();
    EmployeeMasterRow["EmployeeName"] = $('#txtEmpName').val();
    EmployeeMasterRow["FatherName"] = $('#txtFatherName').val();
    EmployeeMasterRow["ParmanentAddress"] = $('#txtPermanentAddress').val();
    EmployeeMasterRow["PresentAddress"] = $('#txtPersentAddress').val();
    EmployeeMasterRow["ContactNos"] = ContactNo;
    EmployeeMasterRow["Sex"] = $('#ddlGender option:selected').text();
    EmployeeMasterRow["MaretialStatus"] = $('#ddlMaritalStatus option:selected').text();
    EmployeeMasterRow["DateofBirth"] = Date.parse($('#dtDOB').val()) ? convertDateFormatSave($('#dtDOB').val()) : null;
    EmployeeMasterRow["DateofMarrige"] = Date.parse($('#dtDOM').val()) ? convertDateFormatSave($('#dtDOM').val()) : null;
    EmployeeMasterRow["EducationalBackGround"] = $('#txtEduBack').val();
    EmployeeMasterRow["CloseRelativeDetails"] = $('#txtCloseRelative').val();
    EmployeeMasterRow["DepartmentName"] = $('#ddlDepartment option:selected').text();
    EmployeeMasterRow["SubDepartmentName"] = $('#ddlSubDepartment option:selected').text();
    EmployeeMasterRow["DesignationName"] = $('#ddlDesignation option:selected').text();
    EmployeeMasterRow["DesignationMaster_CodeActual"] = 0;
    EmployeeMasterRow["DesignationMaster_CodeTemp"] = 0;
    EmployeeMasterRow["DateofJoining"] = Date.parse($('#dtDOJ').val()) ? convertDateFormatSave($('#dtDOJ').val()) : null;
    EmployeeMasterRow["WorkingHours"] = $('#txtWorkingHours').val() == '' ? 0 : parseFloat($('#txtWorkingHours').val());
    EmployeeMasterRow["BasicSalary"] = $('#txtBasicSalary').val() == '' ? 0 : parseFloat($('#txtBasicSalary').val());
    EmployeeMasterRow["BasicSalaryForPF"] = $('#txtSalaryForPF').val() == '' ? 0 : parseFloat($('#txtSalaryForPF').val());
    EmployeeMasterRow["SalaryLimit"] = '';
    EmployeeMasterRow["HRAActual"] = $('#txtHRA').val() == '' ? 0 : parseFloat($('#txtHRA').val());
    EmployeeMasterRow["HRAToPay"] = 0;
    EmployeeMasterRow["ConveyanceActual"] = $('#txtConvayance').val() == '' ? 0 : parseFloat($('#txtConvayance').val());
    EmployeeMasterRow["ConveyanceToPay"] = 0;
    EmployeeMasterRow["DearnessAllowance"] = $('#txtDA').val() == '' ? 0 : parseFloat($('#txtDA').val());
    EmployeeMasterRow["SpecialAllowance"] = 0;
    EmployeeMasterRow["PaymentMode"] = $('#ddlPaymentMode option:selected').text();
    EmployeeMasterRow["OTApplicable"] = $('#ddlOTApplicable option:selected').text();
    EmployeeMasterRow["OTRate"] = $('#txtOTRate').val() == '' ? 0 : parseFloat($('#txtOTRate').val());
    EmployeeMasterRow["OTRateCondition"] = $('#ddlOTRateCondition option:selected').text();
    EmployeeMasterRow["PFApplicable"] = $('#ddlPFApplicable option:selected').text();
    EmployeeMasterRow["PFAccountNo"] = $('#txtPFAccountNo').val() == '' ? 0 : parseFloat($('#txtPFAccountNo').val());
    EmployeeMasterRow["ESIApplicable"] = $('#ddlESIApplicable option:selected').text();
    EmployeeMasterRow["InsuranceNo"] = $('#txtESIInsuranceNo').val() == '' ? 0 : parseInt($('#txtESIInsuranceNo').val());
    EmployeeMasterRow["Shift"] = 0;
    EmployeeMasterRow["TDSApplicable"] = $('#ddlTDSApplicable option:selected').text();
    EmployeeMasterRow["PanNo"] = $('#txtPAN').val();
    EmployeeMasterRow["ReasonForLeaving"] = '';
    EmployeeMasterRow["Weeklyoff"] = '';
    EmployeeMasterRow["ELPerMonth"] = 0;
    EmployeeMasterRow["CLPerMonth"] = 0;
    EmployeeMasterRow["PFRate"] = 0;
    EmployeeMasterRow["EPFRate"] = $('#txtEPFRate').val() == '' ? 0 : parseFloat($('#txtEPFRate').val());
    EmployeeMasterRow["FPFRate"] = $('#txtFPFRate').val() == '' ? 0 : parseFloat($('#txtFPFRate').val());
    EmployeeMasterRow["Email"] = $('#txtEmail').val();
    EmployeeMasterRow["BankACNo"] = $('#txtBankAccNo').val();
    EmployeeMasterRow["BankName"] = $('#ddlBankName option:selected').text();
    EmployeeMasterRow["BankBranch"] = $('#txtBankBranch').val();
    EmployeeMasterRow["Address1"] = $('#txtBankAdd1').val();
    EmployeeMasterRow["Address2"] = $('#txtBankAdd2').val();
    EmployeeMasterRow["CityMaster_Code"] = $('#ddlBankCity option:selected').val();
    EmployeeMasterRow["District"] = $('#txtBankDistrict').val();
    EmployeeMasterRow["StateMaster_Code"] = $('#ddlBankState option:selected').val();
    EmployeeMasterRow["PIN"] = $('#txtBankPin').val() == '' ? 0 : parseInt($('#txtBankPin').val());
    EmployeeMasterRow["CountryMaster_Code"] = $('#ddlBankCountry option:selected').val();
    EmployeeMasterRow["IsOTApplicableInSunday"] = '';
    EmployeeMasterRow["F_CommonValuesEmpCtgy_Code"] = 0;
    EmployeeMasterRow["ExtraDutyApplicable"] = '';
    EmployeeMasterRow["EmployeeMaster_Code_Senior"] = 0;
    EmployeeMasterRow["UserMaster_Code"] = UserMaster_Code;
    EmployeeMasterRow["UserName"] = $('#ddlUserName option:selected').text();
    EmployeeMasterRow["CostCanterIDMaster_Code"] = 0;
    EmployeeMasterRow["MobileNo"] = $('#txtMobile').val();
    EmployeeMasterRow["EmergencyContactNo"] = $('#txtEmergencyContact').val();
    EmployeeMasterRow["PersonalEMail"] = $('#txtPersonalEmail').val();
    EmployeeMasterRow["SalaryTimeofJoining"] = 0;
    EmployeeMasterRow["InsurancePolicyNo"] = $('#txtInsurancePolicyNo').val();
    EmployeeMasterRow["MobileAllowance"] = 0;
    EmployeeMasterRow["F_CommonValues_Code_Skill"] = 0;
    EmployeeMasterRow["RestrictedHoliDay"] = 0;
    EmployeeMasterRow["ConsiderWeeklyOffForSalaryCal"] = '';
    EmployeeMasterRow["UANNo"] = '';
    EmployeeMasterRow["AadharNo"] = $('#txtUID1').val();
    EmployeeMasterRow["ConsiderHRAWithoutAbsent"] = '';
    EmployeeMasterRow["ConsiderConveyanceWithoutAbsent"] = '';
    EmployeeMasterRow["ConsiderSplAllowWithoutAbsent"] = '';
    EmployeeMasterRow["MonthlyIncentive"] = 0;
    EmployeeMasterRow["OtherSpecialAllowance"] = $('#txtOtherAllowance').val() == '' ? 0 : parseFloat($('#txtOtherAllowance').val());
    EmployeeMasterRow["IFSC"] = $('#txtIFSC').val();
    EmployeeMasterRow["ClientMaster_Code"] = 0;
    EmployeeMasterRow["SecondWeeklyoff"] = '';
    EmployeeMasterRow["FirstSecondWeeklyoffON"] = 0;
    EmployeeMasterRow["SecondSecondWeeklyoffON"] = 0;
    EmployeeMasterRow["TempDesigName"] = '';
    EmployeeMasterRow["SLPerMonth"] = 0;
    EmployeeMasterRow["FLPerMonth"] = 0;
    EmployeeMasterRow["IsPMRPYApplicable"] = '';
    EmployeeMasterRow["EmployeePassword"] = '';
    EmployeeMasterRow["ReligionMaster_Code"] = 0;
    EmployeeMasterRow["EmployeeGradeMaster_Code"] = 0;
    EmployeeMasterRow["TransportationRequired"] = '';
    EmployeeMasterRow["UpdatedBy"] = 0;
    EmployeeMasterRow["VPFRate"] = $('#txtVPFRate').val() == '' ? 0 : parseFloat($('#txtVPFRate').val());
    EmployeeMasterRow["AccountMaster_Code"] = 0;
    EmployeeMasterRow["AdvAccountMaster_Code"] = 0;
    EmployeeMasterRow["ExtraSalaryHolidaVsWeeklyOff"] = '';
    EmployeeMasterRow["AutoPayHoliday"] = '';
    EmployeeMasterRow["NoofIncentiveDays"] = 0;
    EmployeeMasterRow["F_CommonValues_IncentiveAs"] = 0;
    EmployeeMasterRow["EmployeeLocation"] = $('#txtLocation').val();
    EmployeeMasterRow["IsTransferEmployee"] = '';
    EmployeeMasterRow["Nationality"] = $('#ddlCountry option:selected').text();
    EmployeeMasterRow["TrustFlagApplicable"] = '';
    EmployeeMasterRow["EPFTrustFlag"] = 0;
    EmployeeMasterRow["VPFTrustFlag"] = 0;
    EmployeeMasterRow["FPFTrustFlag"] = 0;
    EmployeeMasterRow["GPAPolicyFlagApplicable"] = '';
    EmployeeMasterRow["GratuityFlagApplicable"] = '';
    EmployeeMasterRow["SuperannuationFlag"] = 0;
    EmployeeMasterRow["LTAFlag"] = 0;
    EmployeeMasterRow["MediclaimPolicyFlag"] = '';
    EmployeeMasterRow["F_EmployeeLocationMaster_Code"] = 0;
    EmployeeMasterRow["Telephone"] = 0;
    EmployeeMasterRow["EmployeeNameInBank"] = $('#txtEmpNameInBank').val();
    EmployeeMasterRow["TotalCTCAmount"] = 0;
    EmployeeMasterRow["CTCCalculationDesp"] = '';
    EmployeeMasterRow["Verified"] = '';
    EmployeeMasterRow["VerifiedBy"] = 0;
    EmployeeMasterRow["LabourWelfareAmount"] = 0;
    EmployeeMasterRow["AllowBenifitOfSecondAndFourthSaturday"] = '';
    EmployeeMasterRow["POFTNo"] = '';
    EmployeeMasterRow["ActualSalary"] = 0;
    EmployeeMasterRow["SuperannuationID"] = '';
    EmployeeMasterRow["ContributionPer"] = 0;
    EmployeeMasterRow["BloodGroup"] = $('#ddlBloodGroup option:selected').text();
    EmployeeMasterRow["CanteenFacility"] = '';
    EmployeeMasterRow["ShiftName"] = $('#ddlShift option:selected').text();
    EmployeeMasterRow["Grade"] = $('#ddlEmpGrade option:selected').text();;
    EmployeeMasterRow["Category"] = $('#ddlEmpCategory option:selected').text();
    EmployeeMasterRow["EmployeeSkill"] = $('#ddlEmpSkill option:selected').text();
    EmployeeMasterRow["UID2No"] = $('#txtUID2').val();

    EmployeeMasterData.push(EmployeeMasterRow);

    EmployeeAllowncesRow["Code"] = 0;
    EmployeeAllowncesRow["EmployeeMaster_Code"] = 0;
    EmployeeAllowncesRow["Desp"] = '';
    EmployeeAllowncesRow["Amount"] = 0;

    EmployeeAllowncesData.push(EmployeeAllowncesRow);

    EmployeeDeductionRow["Code"] = 0;
    EmployeeDeductionRow["EmployeeMaster_Code"] = 0;
    EmployeeDeductionRow["EmployeeDeductionDesp"] = '';
    EmployeeDeductionRow["Deduction"] = '';
    EmployeeDeductionRow["Applicable"] = '';
    EmployeeDeductionRow["Amount"] = 0;

    EmployeeDeductionData.push(EmployeeDeductionRow);

    EmployeeLeaveRow["Code"] = 0;
    EmployeeLeaveRow["EmployeeMaster_Code"] = 0;
    EmployeeLeaveRow["LeaveDesp"] = '';
    EmployeeLeaveRow["Applicable"] = '';
    EmployeeLeaveRow["ApplicableFrom"] = new Date().toISOString().split("T")[0];
    EmployeeLeaveRow["Allowed"] = 0;
    EmployeeLeaveData.push(EmployeeLeaveRow);
  
    $("#tblLastEmployerDetails tbody tr").each(function (index, row) {
        EmployeeLastEmployerRow = {};
       EmployeeLastEmployerRow["EmployeeMaster_Code"] = param_Emp_Code;
        EmployeeLastEmployerRow["EmpName"] = $(this).find('td:eq(' + Indx_LastEmp.Name + ')')[0].getElementsByTagName('input')[0].value; 
        EmployeeLastEmployerRow["EmpAddress"] = $(this).find('td:eq(' + Indx_LastEmp.Address + ')')[0].getElementsByTagName('input')[0].value;
        EmployeeLastEmployerRow["DesignationMaster_Code"] = $(this).find('td:eq(' + Indx_LastEmp.Designation + ') select option:selected').val();
        
        EmployeeLastEmployerData.push(EmployeeLastEmployerRow);
    });

    $("#tblEducationalDegree tbody tr").each(function (index, row) {
        EmployeeDegreeRow = {};
        EmployeeDegreeRow["EmployeeMaster_Code"] = param_Emp_Code;
        EmployeeDegreeRow["DegreeMaster_Code"] = $(this).find('td:eq(' + Indx_Edu.Degree + ') select option:selected').val();
        EmployeeDegreeRow["YearPassing"] = $(this).find('td:eq(' + Indx_Edu.YearPassing + ')')[0].getElementsByTagName('input')[0].value;
        EmployeeDegreeRow["CollegeName"] = $(this).find('td:eq(' + Indx_Edu.CollageName + ')')[0].getElementsByTagName('input')[0].value;
        EmployeeDegreeRow["AddressDetail"] = $(this).find('td:eq(' + Indx_Edu.Address + ')')[0].getElementsByTagName('input')[0].value;

        EmployeeDegreeData.push(EmployeeDegreeRow);
    });

    $("#tblFamilyDetails tbody tr").each(function (index, row) {
        EmployeeFamilyRow = {};
        EmployeeFamilyRow["EmployeeMaster_Code"] = param_Emp_Code;
        EmployeeFamilyRow["MemberName"] = $(this).find('td:eq(' + Indx_Family.MemberName + ')')[0].getElementsByTagName('input')[0].value;
        EmployeeFamilyRow["Relation"] = $(this).find('td:eq(' + Indx_Family.Relation + ')')[0].getElementsByTagName('input')[0].value;
        EmployeeFamilyRow["BirthDate"] = $(this).find('td:eq(' + Indx_Family.DOB + ')')[0].getElementsByTagName('input')[0].value;
        EmployeeFamilyRow["DegreeMaster_Code"] = $(this).find('td:eq(' + Indx_Family.Degree + ')')[0].getElementsByTagName('select')[0].value;
        EmployeeFamilyRow["CollegeName"] = $(this).find('td:eq(' + Indx_Family.CollageName + ')')[0].getElementsByTagName('input')[0].value;
        EmployeeFamilyRow["AddressDetail"] = $(this).find('td:eq(' + Indx_Family.Address + ')')[0].getElementsByTagName('input')[0].value;
        EmployeeFamilyRow["FamilyVisaNo"] = $(this).find('td:eq(' + Indx_Family.VisaNo + ')')[0].getElementsByTagName('input')[0].value;
        EmployeeFamilyRow["FamilyVisaExpiryOn"] = $(this).find('td:eq(' + Indx_Family.VisaExp + ')')[0].getElementsByTagName('input')[0].value;

        EmployeeFamilyData.push(EmployeeFamilyRow);
    });

    $("#tblMachineAllocation tbody tr").each(function (index, row) {
        EmployeeMasterMachineRow = {};

        EmployeeMasterMachineRow["Code"] = parseInt($(this).find('td:eq(' + Indx_Machine.Code + ')')[0].getElementsByTagName('input')[0].value);
        EmployeeMasterMachineRow["EmployeeMaster_Code"] = param_Emp_Code;
        EmployeeMasterMachineRow["MachineMaster_Code"] = $(this).find('td:eq(' + Indx_Machine.Machine + ')')[0].getElementsByTagName('select')[0].value;
        EmployeeMasterMachineRow["Percentage"] =parseFloat( $(this).find('td:eq(' + Indx_Machine.Percent + ')')[0].getElementsByTagName('input')[0].value);
       
        EmployeeMasterMachineData.push(EmployeeMasterMachineRow);
    });

    EmployeePictureData = [];
    EmployeePictureRow = {};

    EmployeePictureRow["Code"] = $("#hfFileCode")[0].value !== null ? $("#hfFileCode")[0].value : '';
        EmployeePictureRow["EmployeeMaster_Code"] = param_Emp_Code;
    EmployeePictureRow["EmployeePicture"] = $("#hfFileInput")[0].value !== null ? $("#hfFileInput")[0].value : '';

    EmployeePictureData.push(EmployeePictureRow);

    allTablesData["EmployeeMaster"] = EmployeeMasterData;
    //allTablesData["EmployeeAllowncesDetails"] = EmployeeAllowncesData;
    //allTablesData["EmployeeDeductionMasterDetail"] = EmployeeDeductionData;
    //allTablesData["EmployeeLeaveDetail"] = EmployeeLeaveData;
    allTablesData["EmployeeDegreeDetails"] = EmployeeDegreeData;
    allTablesData["EmployeeFamilyDetails"] = EmployeeFamilyData;
    allTablesData["EmployeeMasterMachineWiseAllocation"] = EmployeeMasterMachineData;
    allTablesData["EmployeePictureDetail"] = EmployeePictureData;
    allTablesData["EmployeeLastEmployerDetail"] = EmployeeLastEmployerData;
   
    EmployeeMasterService.SaveEmployeeMaster(allTablesData).then(function (response) {

        if (response != '') {
            if (response.Status == 'N') {
                toastr.error(response.Msg);
            } else {

                toastr.success(response.Msg);
                setTimeout(function () {
                    let Code = response.Code;
                    const Codes = window.btoa(Code);
                    window.location = baseUrl + "/HRMasters/EmployeeMaster/EmployeeMaster?Code=" + Codes + "&Mode=Edit";
                    //window.location = baseUrl + "/HRMasters/EmployeeMaster/EmployeeList";

                }, 2000); // 2 seconds delay before redirect
            }

        }

    });
}
function BindSelect2FromDataList(element, arrayList, FirstItem, ddlwidth) {
    element.empty();

    if (FirstItem == 'FirstItemAll') {

        element.append(new Option("All", "All"));
    } else if (FirstItem == 'FirstItemZero') {

        element.append(new Option("", "0"));
    } else {

    }


    // Get the options from the datalist and append them to Select2
    $.each(arrayList, function (index, item) {
        // Append new option elements (key as value and value as text)
        element.append(new Option(item.value, item.key));
    });

    // Trigger a change event to update Select2 UI
    // element.trigger('change');

    element.select2({
        //// allowClear: true,
        width: '100%',
        matcher: function (params, data) {
            // If there's no search term, return all data
            if ($.trim(params.term) === '') {
                return data;
            }

            // Match items that start with the search term
            if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) {
                return data;
            }

            // Return null if no match
            return null;
        }
    });
}

function SaveAllowance(Code) {
    var Code = param_Emp_Code;
    $('#hdnSelectedCode').val(Code);
    GetAllowanceTotal();
    $('#OtherAllowanceModal').modal('hide');
}
function CloseAllowanceModal() {
    
    GetAllowanceTotal();
    $('#OtherAllowanceModal').modal('hide');

}

function GetAllowanceTotal() {
    let TotalAllowance = 0;
    let PartOFCTCAmount = 0;
    let NotPartOfCTCAmount = 0;
    $('#Allowance tbody tr').each(function () {
        var PartOfCTC = $(this).find('td').eq(Indx_Allowance.PartOfCTC)[0].innerText;
        var value = parseFloat($(this).find('td').eq(Indx_Allowance.Amount)[0].getElementsByTagName('input')[0].value); 
        TotalAllowance += value;
        if (PartOfCTC == 'Yes') {
            PartOFCTCAmount += value;
        } else {
            NotPartOfCTCAmount += value;
        }
    });
    $('#txtOtherAllowance').val(TotalAllowance);
    let TotalSalary = 0;
    let TotalCTC = 0;
    let OtherAllowances = 0;
    let Basic = $('#txtBasicSalary').val() == '' ? 0 : parseFloat($('#txtBasicSalary').val());
    let DA = $('#txtDA').val() == '' ? 0 : parseFloat($('#txtDA').val());
    let HRA = $('#txtHRA').val() == '' ? 0 : parseFloat($('#txtHRA').val());
    let Convayance = $('#txtConvayance').val() == '' ? 0 : parseFloat($('#txtConvayance').val());

    TotalSalary = Basic + DA + HRA + Convayance;
   
    TotalCTC = TotalSalary + PartOFCTCAmount;
    $('#txtTotalCTC').val(Number(parseFloat(TotalCTC).toFixed(2)));
}

function GetDeductionTotal() {
    let TotalDeduction = 0;
    $('#Deduction tbody tr').each(function () {
        var value = parseFloat($(this).find('td').eq(Indx_Deduct.Amount)[0].getElementsByTagName('input')[0].value);
        TotalDeduction += value;
    });
    $('#txtDeduction').val(TotalDeduction);
}
function GetTotalLeave() {
    let TotalLeave = 0;
    $('#Leave tbody tr').each(function () {
        var value = parseFloat($(this).find('td').eq(Indx_Leave.Allowed)[0].getElementsByTagName('input')[0].value);
        var Applicable = $(this).find('td').eq(Indx_Leave.Applicable)[0].getElementsByTagName('select')[0].value;
        var Applicability = $(this).find('td').eq(Indx_Leave.Applicability)[0].innerText;
        if (Applicable == 'Y') {
            TotalLeave += Applicability=='Monthly'?value*12:value;
        }
        
    });
    $('#txtLeave').val(TotalLeave);
}
function ShowAllowanceModal() {
    EmployeeMasterService.GetAllowanceDetailByEmployeeMaster_Code(param_Emp_Code).then(function (response) {


        if (response.length > 0) {
            $('#OtherAllowanceModal').modal('show');
            
            $(".modal-backdrop").remove();


            const StringFilterColumn = ["Allowance Name"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code","EmployeeAllowncesDetails_Code"];
            const ColumnAlignment = {
                "Amount": "right"
            };

            const updatedResponse = response.map(item => {
                let td_Amount = `<input type="number"  id="txtAmount" value="${item.Amount}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtAmount" placeholder=""  autocomplete="off" maxlength="7" style="width:100px !important"  required>`;
                

                return {
                    ...item,
                    "Amount": td_Amount
                };
            });


            BizsolCustomFilterGrid.CreateDataTable("Allowance-header", "Allowance-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false)
            

        }


    });

}

function GetDepartmentMasterList() {
    EmployeeMasterService.GetDepartmentMasterList().then(function (response) {
        if (response.length > 0) {
            var arrayList = [];
            response = response.map((item) => ({
                key: item.Code, value: item["Department Name"]
            }));
            arrayList = response;

            BindSelect2FromDataList($('#ddlDepartment'), arrayList, "FirstItemZero", "100%");
            GetSubDepartmentMasterList();
        }
    });
}

function GetSubDepartmentMasterList() {
    var Department = $('#ddlDepartment option:selected').text();
    EmployeeMasterService.GetSubDepartmentMasterList(Department).then(function (response) {
        if (response.length > 0) {
            var arrayList = [];
            response = response.map((item) => ({
                key: item.Code, value: item.SubDepartmentName
            }));
            arrayList = response;

            BindSelect2FromDataList($('#ddlSubDepartment'), arrayList, "FirstItemZero", "100%");
            GetDesignationMasterList();
        }
    });
}

function GetDesignationMasterList() {
    EmployeeMasterService.GetDesignationMasterList().then(function (response) {
        if (response.length > 0) {
            var arrayList = [];
            response = response.map((item) => ({
                key: item.Code, value: item["Designation Name"]
            }));
            arrayList = response;

            BindSelect2FromDataList($('#ddlDesignation'), arrayList, "FirstItemZero", "100%");
            GetShiftMasterList();
           
        }
    });
}
function GetShiftMasterList() {
    EmployeeMasterService.EmployeeShift().then(function (response) {
        if (response.length > 0) {
            var arrayList = [];
            response = response.map((item) => ({
                key: item.Code, value: item.ShiftName
            }));
            arrayList = response;

            BindSelect2FromDataList($('#ddlShift'), arrayList, "FirstItemZero", "100%");
            GetBankMasterList();

        }
    });
}
function GetBankMasterList() {
    EmployeeMasterService.GetBankMasterList().then(function (response) {
        if (response.length > 0) {
            var arrayList = [];
            response = response.map((item) => ({
                key: item.Code, value: item.BankName
            }));
            arrayList = response;

            BindSelect2FromDataList($('#ddlBankName'), arrayList, "FirstItemZero", "100%");
            GetCityMasterList();

        }
    });
}

function GetCityMasterList() {
    EmployeeMasterService.GetCityMasterList('India','All').then(function (response) {
        if (response.length > 0) {
            var arrayList = [];
            response = response.map((item) => ({
                key: item.Code, value: item.CityName
            }));
            arrayList = response;

            BindSelect2FromDataList($('#ddlBankCity'), arrayList, "FirstItemZero", "100%");
            GetStateMasterList();

        }
    });
}
function GetStateMasterList() {
    EmployeeMasterService.GetStateMasterList('All').then(function (response) {
        if (response.length > 0) {
            var arrayList = [];
            response = response.map((item) => ({
                key: item.Code, value: item.StateName
            }));
            arrayList = response;

            BindSelect2FromDataList($('#ddlBankState'), arrayList, "FirstItemZero", "100%");
            if ((param_Emp_Mode == 'Edit' || param_Emp_Mode == 'View') && param_Emp_Code > 0) {
                PopulateData();
            }

        }
    });
}
function GetDegreeMasterList(RowNo,SelectedValue) {
    EmployeeMasterService.DegreeMasterList().then(function (response) {
        if (response.length > 0) {
            arrayList_Degree = [];
            response = response.map((item) => ({
                key: item.Code, value: item.DegreeDesp
            }));
            arrayList_Degree = response;
            BindSelect2FromDataList($('#ddlDegree' + RowNo), arrayList_Degree, "FirstItemZero", "100%");
            if (SelectedValue !== '') {
                $('#ddlDegree' + RowNo).val(SelectedValue).trigger('change');
            }
        }
    });
}

function GetFamilyDegreeMasterList(RowNo, SelectedValue) {
    EmployeeMasterService.DegreeMasterList().then(function (response) {
        if (response.length > 0) {
            arrayList_FamilyDegree = [];
            response = response.map((item) => ({
                key: item.Code, value: item.DegreeDesp
            }));
            arrayList_FamilyDegree = response;
            BindSelect2FromDataList($('#ddlFamilyDegree' + RowNo), arrayList_FamilyDegree, "FirstItemZero", "100%");
            if (SelectedValue !== '') {
                $('#ddlFamilyDegree' + RowNo).val(SelectedValue).trigger('change');
            }
        }
    });
}
function GetMachineMasterList(RowNo, SelectedValue) {
    EmployeeMasterService.MachineMasterList().then(function (response) {
        if (response.length > 0) {
            arrayList_Machine = [];
            response = response.map((item) => ({
                key: item.Code, value: item.Desp
            }));
            arrayList_Machine = response;
            BindSelect2FromDataList($('#ddlMachine' + RowNo), arrayList_Machine, "FirstItemZero", "100%");
            if (SelectedValue !== '') {
                $('#ddlMachine' + RowNo).val(SelectedValue).trigger('change');
            }
        }
    });
}

function GetDesignationMasterList_LastEmp(RowNo, SelectedValue) {
    EmployeeMasterService.GetDesignationMasterList().then(function (response) {
        if (response.length > 0) {
            arrayList_Des_LastEmp = [];
            response = response.map((item) => ({
                key: item.Code, value: item["Designation Name"]
            }));
            arrayList_Des_LastEmp = response;
            BindSelect2FromDataList($('#ddlEmpDesignation' + RowNo), arrayList_Des_LastEmp, "FirstItemZero", "100%");
            if (SelectedValue !== '') {
                $('#ddlEmpDesignation' + RowNo).val(SelectedValue).trigger('change');
            }
        }
    });
}
function GetBankMasterByCode() {
    var BankCode = $('#ddlBankName option:selected').val();
    EmployeeMasterService.GetBankMasterByCode(BankCode).then(function (response) {
        if (response.length > 0) {
           
            $('#txtIFSC').val(response[0].IFSC_Code);
            $('#txtBankAdd1').val(response[0].Address);
            //$('#txtBankAdd2').val(response[0].);
            
            BizSolHelperFunction.SelectOptionByText('ddlBankCity', response[0].City);
            //$('#txtBankDistrict').val(response[0].);
            BizSolHelperFunction.SelectOptionByText('ddlBankState', response[0].State);
            $('#txtBankPin').val(response[0].PinCode);
            BizSolHelperFunction.SelectOptionByText('ddlBankCountry', response[0].Nation);
            
        }
    });
}

function SaveEmployeeAllowanceDetails() {

    var EmployeeAllowncesData = [];
   


    $("#Allowance tbody tr").each(function (index, row) {
        var EmployeeAllowncesRow = {};

        var Code = $(this).find('td:eq(' + Indx_Allowance.AllowncesDetails_Code + ')')[0].innerText;
        var Allowance = $(this).find('td:eq(' + Indx_Allowance.AllowncesName +')')[0].innerText;
        var Amount = $(this).find('td:eq(' + Indx_Allowance.Amount +')')[0].getElementsByTagName('input')[0].value;
    
        EmployeeAllowncesRow["Code"] = Code;
        EmployeeAllowncesRow["EmployeeMaster_Code"] = param_Emp_Code;
        EmployeeAllowncesRow["Desp"] = Allowance;
        EmployeeAllowncesRow["Amount"] = parseFloat(Amount);

        EmployeeAllowncesData.push(EmployeeAllowncesRow);

    });
    EmployeeMasterService.SaveEmployeeAllowanceDetails(EmployeeAllowncesData).then(function (response) {
        if (response != '') {
            if (response.Status == 'N') {
                toastr.error(response.Msg);
            } else {

                toastr.success(response.Msg);
                setTimeout(function () {

                    CloseAllowanceModal();

                }, 2000); // 2 seconds delay before redirect
            }

        }
    });
}
$(document).on('click', '#btnDelete', function () {
    $(this).closest('tr').remove(); // Remove the row
});

function AddNewRow_LastEmployer() {
    var PageMode = param_Emp_Mode; // New/Edit/View
    var tbItemConsumeRowNo = 0;
    var tbody = $('#tblLastEmployerDetails tbody')[0];
    var theadRow = $('#tblLastEmployerDetails thead tr')[0];
    var rowNO = tbody.rows.length;

    var row = tbody.insertRow(rowNO);
    tbItemConsumeRowNo = rowNO + 1;
    
    var Code= row.insertCell(Indx_LastEmp.Code);
    var Emp_Code = row.insertCell(Indx_LastEmp.Emp_Code);
    var Name = row.insertCell(Indx_LastEmp.Name);
    var Address = row.insertCell(Indx_LastEmp.Address);
    var Designation = row.insertCell(Indx_LastEmp.Designation);
    var Delete = row.insertCell(Indx_LastEmp.Delete);

    Code.style["display"] = "none";
    Emp_Code.style["display"] = "none";

    Code.innerHTML = '<input type="text"  id="txtCode' + tbItemConsumeRowNo + '"  name="txtCode" placeholder="" value=0  autocomplete="off"  onchange="" required>';
    Emp_Code.innerHTML = '<input type="text"  id="txtEmp_Code' + tbItemConsumeRowNo + '"  name="txtEmp_Code" placeholder="" value=0  autocomplete="off"  onchange="" required>';
    Name.innerHTML = '<input type="text"  id="txtName' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm"  name="txtName" placeholder="" value=""  autocomplete="off"  onchange="" required>';
    Address.innerHTML = '<input type="text"  id="txtAddress' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtAddress" placeholder="" value=""  autocomplete="off"  onchange="" required>';
    Designation.innerHTML = '<select id="ddlEmpDesignation' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm " name="ddlEmpDesignation"  autocomplete="off" ></select>';

    Delete.innerHTML = '<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light " title="Delete" ><i class="fa fa-times" aria-hidden="true"></i></a>';

    GetDesignationMasterList_LastEmp(tbItemConsumeRowNo);
}
function AddNewRow_Education() {
    var PageMode = param_Emp_Mode; // New/Edit/View
    var tbItemConsumeRowNo = 0;
    var tbody = $('#tblEducationalDegree tbody')[0];
    var theadRow = $('#tblEducationalDegree thead tr')[0];
    var rowNO = tbody.rows.length;

    var row = tbody.insertRow(rowNO);
    tbItemConsumeRowNo = rowNO + 1;

    var Code = row.insertCell(Indx_Edu.Code);
    var Emp_Code = row.insertCell(Indx_Edu.Emp_Code);
    var Degree = row.insertCell(Indx_Edu.Degree);
    var YearPassing = row.insertCell(Indx_Edu.YearPassing);
    var CollageName = row.insertCell(Indx_Edu.CollageName);
    var Address = row.insertCell(Indx_Edu.Address);
    var Delete = row.insertCell(Indx_Edu.Delete);

    Code.style["display"] = "none";
    Emp_Code.style["display"] = "none";

    Code.innerHTML = '<input type="text"  id="txtCode' + tbItemConsumeRowNo + '"  name="txtCode" placeholder="" value=0  autocomplete="off"  onchange="" required>';
    Emp_Code.innerHTML = '<input type="text"  id="txtEmp_Code' + tbItemConsumeRowNo + '"  name="txtEmp_Code" placeholder="" value=0  autocomplete="off"  onchange="" required>';
    Degree.innerHTML = '<select id="ddlDegree' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm sizeDesInput" name="ddlDegree"  autocomplete="off" ></select>';
    YearPassing.innerHTML = '<input type="number" min="1900" max="2100" step="1"   id="txtYearPassing' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtYearPassing" placeholder="" value=""  autocomplete="off"  onchange="" required>';
    CollageName.innerHTML = '<input type="text"  id="txtCollageName' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtCollageName" placeholder="" value=""  autocomplete="off"  onchange="" required>';
    Address.innerHTML = '<input type="text"  id="txtAddress' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtAddress" placeholder="" value=""  autocomplete="off"  onchange="" required>';
    Delete.innerHTML = '<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light " title="Delete" ><i class="fa fa-times" aria-hidden="true"></i></a>';

    GetDegreeMasterList(tbItemConsumeRowNo,'');
    
}
function AddNewRow_Family() {

    var PageMode = param_Emp_Mode; // New/Edit/View
    var tbItemConsumeRowNo = 0;
    var tbody = $('#tblFamilyDetails tbody')[0];
    var theadRow = $('#tblFamilyDetails thead tr')[0];
    var rowNO = tbody.rows.length;

    var row = tbody.insertRow(rowNO);
    tbItemConsumeRowNo = rowNO + 1;

    var Code = row.insertCell(Indx_Family.Code);
    var Emp_Code = row.insertCell(Indx_Family.Emp_Code);
    var MemberName = row.insertCell(Indx_Family.MemberName);
    var Relation = row.insertCell(Indx_Family.Relation);
    var DOB = row.insertCell(Indx_Family.DOB);
    var Degree = row.insertCell(Indx_Family.Degree);
    var CollageName = row.insertCell(Indx_Family.CollageName);
    var Address = row.insertCell(Indx_Family.Address);
    var VisaNo = row.insertCell(Indx_Family.VisaNo);
    var VisaExp = row.insertCell(Indx_Family.VisaExp);
    var Delete = row.insertCell(Indx_Family.Delete);

    Code.style["display"] = "none";

    Emp_Code.style["display"] = "none";

    Code.innerHTML = '<input type="text"  id="txtCode' + tbItemConsumeRowNo + '"  name="txtCode" placeholder="" value=0  autocomplete="off"  onchange="" required>';
    Emp_Code.innerHTML = '<input type="text"  id="txtEmp_Code' + tbItemConsumeRowNo + '"  name="txtEmp_Code" placeholder="" value=0  autocomplete="off"  onchange="" required>';
    MemberName.innerHTML = '<input type="text"  id="txtMemberName' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm"  name="txtMemberName" placeholder="" value=""  autocomplete="off"  onchange="" required>';
    Relation.innerHTML = '<input type="text"  id="txtRelation' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtRelation" placeholder="" value=""  autocomplete="off"  onchange="" required>';
    DOB.innerHTML = '<input type="date"  id="txtDOB' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtDOB" placeholder=""   autocomplete="off"  onchange="" required>';
    Degree.innerHTML = '<select id="ddlFamilyDegree' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm sizeDesInput" name="ddlFamilyDegree"  autocomplete="off" ></select>';
    CollageName.innerHTML = '<input type="text"  id="txtCollageName' + tbItemConsumeRowNo + '"  name="txtCollageName" placeholder="" class="BizSolFormControl box_border form-control form-control-sm" value="" autocomplete="off"  onchange="" required>';
    Address.innerHTML = '<input type="text"  id="txtAddress' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm"  name="txtAddress" placeholder="" value=""  autocomplete="off"  onchange="" required>';
    VisaNo.innerHTML = '<input type="text"  id="txtVisaNo' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtVisaNo" placeholder="" value=""  autocomplete="off"  onchange="" required>';
    VisaExp.innerHTML = '<input type="date"  id="dtVisaExp' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="dtVisaExp" placeholder="" value=""  autocomplete="off"  onchange="" required>';
    Delete.innerHTML = '<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light " title="Delete" ><i class="fa fa-times" aria-hidden="true"></i></a>';

    GetFamilyDegreeMasterList(tbItemConsumeRowNo, '');
}
function AddNewRow_Machine() {
    var PageMode = param_Emp_Mode; // New/Edit/View
    var tbItemConsumeRowNo = 0;
    var tbody = $('#tblMachineAllocation tbody')[0];
    var theadRow = $('#tblMachineAllocation thead tr')[0];
    var rowNO = tbody.rows.length;

    var row = tbody.insertRow(rowNO);
    tbItemConsumeRowNo = rowNO + 1;

    var Code = row.insertCell(Indx_Machine.Code);
    var Emp_Code = row.insertCell(Indx_Machine.Emp_Code);
    var Machine = row.insertCell(Indx_Machine.Machine);
    var Percent = row.insertCell(Indx_Machine.Percent);
    var Delete = row.insertCell(Indx_Machine.Delete);

    Code.style["display"] = "none";
    Emp_Code.style["display"] = "none";

    Code.innerHTML = '<input type="text"  id="txtCode' + tbItemConsumeRowNo + '"  name="txtCode" placeholder="" value=0  autocomplete="off"  onchange="" required>';
    Emp_Code.innerHTML = '<input type="text"  id="txtEmp_Code' + tbItemConsumeRowNo + '"  name="txtEmp_Code" placeholder="" value=0  autocomplete="off"  onchange="" required>';
    Machine.innerHTML = '<select id="ddlMachine' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="ddlMachine"  autocomplete="off" ></select>';
    Percent.innerHTML = '<input type="number"  id="txtPercent' + tbItemConsumeRowNo + '"  min="1" max="100" step="1"  class="BizSolFormControl box_border form-control form-control-sm" name="txtYearPassing" placeholder="" value=""  autocomplete="off"  onchange="" required>';
    Delete.innerHTML = '<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light" title="Delete"><i class="fa fa-times" aria-hidden="true"></i></a>';
    GetMachineMasterList(tbItemConsumeRowNo, '');

}
function ShowDeductionModal() {
    EmployeeMasterService.GetDeductionDetailByEmployeeMaster_Code(param_Emp_Code).then(function (response) {


        if (response.length > 0) {
            $('#DeductionModal').modal('show');

            $(".modal-backdrop").remove();


            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "EmployeeDeductionMasterDetail_Code", "Percentage", "Condition", "Deduction","PercentageOf"];
            const ColumnAlignment = {
                "Amount": "right"
            };

            const updatedResponse = response.map(item => {
                let td_Applicable = `<select  id="ddlDeductApplicable" class="BizSolFormControl box_border form-control form-control-sm btn-width" onchange="ResetAllowedDeduction(this);"><option value="Y" ${item.Applicable === 'Y' ? 'selected' : ''}>Yes</option><option value="N" ${item.Applicable === 'N' ? 'selected' : ''}>No</option></select>`;
                let td_Amount = `<input type="number"  id="txtAmount" value="${item.Amount}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtAmount" placeholder=""  autocomplete="off" maxlength="7" style="width:100px !important"  required>`;
                

                return {
                    ...item,
                    "Applicable":td_Applicable,
                    "Amount": td_Amount
                };
            });


            BizsolCustomFilterGrid.CreateDataTable("Deduction-header", "Deduction-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false)


        }


    });
}
function ShowLeaveModal() {
    EmployeeMasterService.GetLeaveDetailByEmployeeMaster_Code(param_Emp_Code).then(function (response) {


        if (response.length > 0) {
            $('#LeaveModal').modal('show');

            $(".modal-backdrop").remove();


            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "EmployeeLeaveDetail_Code","Half Applicable"];
            const ColumnAlignment = {
                "Allowed": "right"
            };

            const updatedResponse = response.map(item => {
                let td_Applicable = `<select  id="ddlApplicable" class="BizSolFormControl box_border form-control form-control-sm btn-width" onchange="ResetAllowedLeave(this);"><option value="Y" ${item.Applicable === 'Y' ? 'selected' : ''}>Yes</option><option value="N" ${item.Applicable === 'N' ? 'selected' : ''}>No</option></select>`;
                let td_Allowed = `<input type="number"  id="txtAllowed" value="${item.Allowed}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtAllowed" placeholder=""  autocomplete="off" maxlength="7" style="width:100px !important"  required>`;


                return {
                    ...item,
                    "Applicable": td_Applicable,
                    "Allowed": td_Allowed
                };
            });


            BizsolCustomFilterGrid.CreateDataTable("Leave-header", "Leave-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false)


        }


    });
}
function ResetAllowedLeave(x) {
    var ObjCurrRow = $(x).closest('tr');
    var selectedValue = $(x).val(); 
    if (selectedValue == 'N') {
        ObjCurrRow.find('input[name="txtAllowed"]').val(0);
    }


}

function ResetAllowedDeduction(x) {
    var ObjCurrRow = $(x).closest('tr');
    var selectedValue = $(x).val();
    if (selectedValue == 'N') {
        ObjCurrRow.find('input[name="txtAmount"]').val(0);
    } else {
        CalculateDeductionAmount(x);
    }


}
function CloseLeaveModal() {

    GetTotalLeave();
    $('#LeaveModal').modal('hide');

}
function CloseDeductionModal() {
    GetDeductionTotal();

    $('#DeductionModal').modal('hide');

}

function SaveEmployeeLeaveDetails() {

    var EmployeeLeaveData = [];



    $("#Leave tbody tr").each(function (index, row) {
        var EmployeeLeaveRow = {};

        var Code = $(this).find('td:eq(' + Indx_Leave.LeaveDetails_Code + ')')[0].innerText;
        var LeaveDesp = $(this).find('td:eq(' + Indx_Leave.LeaveDesp + ')')[0].innerText;
        var Allowed = $(this).find('td:eq(' + Indx_Leave.Allowed + ')')[0].getElementsByTagName('input')[0].value;
        var Applicable = $(this).find('td:eq(' + Indx_Leave.Applicable + ')')[0].getElementsByTagName('select')[0].value;

        EmployeeLeaveRow["Code"] = Code;
        EmployeeLeaveRow["EmployeeMaster_Code"] = param_Emp_Code;
        EmployeeLeaveRow["LeaveDesp"] = LeaveDesp;
        EmployeeLeaveRow["Applicable"] = Applicable;
        EmployeeLeaveRow["Allowed"] = parseFloat(Allowed);

        EmployeeLeaveData.push(EmployeeLeaveRow);

    });
    EmployeeMasterService.SaveEmployeeLeaveDetails(EmployeeLeaveData).then(function (response) {
        if (response != '') {
            if (response.Status == 'N') {
                toastr.error(response.Msg);
            } else {

                toastr.success(response.Msg);
                setTimeout(function () {

                    CloseLeaveModal();

                }, 2000); // 2 seconds delay before redirect
            }

        }
    });
}
function CalculateTotalSalaryAndCTC() {
    let TotalSalary = 0;
    let TotalCTC = 0;
    let OtherAllowances = 0;
    let Basic = $('#txtBasicSalary').val() == '' ? 0 : parseFloat($('#txtBasicSalary').val());
    let DA = $('#txtDA').val() == '' ? 0 : parseFloat($('#txtDA').val());
    let HRA = $('#txtHRA').val() == '' ? 0 : parseFloat($('#txtHRA').val());
    let Convayance = $('#txtConvayance').val() == '' ? 0 : parseFloat($('#txtConvayance').val());

    TotalSalary = Basic + DA + HRA + Convayance;
    $('#txtTotalSalary').val(Number(parseFloat(TotalSalary).toFixed(2)));

    TotalCTC = TotalSalary + OtherAllowances;
    $('#txtTotalCTC').val(Number(parseFloat(TotalCTC).toFixed(2)));
    
}
function CalculateDeductionAmount(x) {
    let TotalSalary = $('#txtTotalSalary').val() == '' ? 0 : parseFloat($('#txtTotalSalary').val());
    let TotalCTC = $('#txtTotalCTC').val() == '' ? 0 : parseFloat($('#txtTotalCTC').val());
    let OtherAllowances = $('#txtOtherAllowance').val() == '' ? 0 : parseFloat($('#txtOtherAllowance').val());
    let Basic = $('#txtBasicSalary').val() == '' ? 0 : parseFloat($('#txtBasicSalary').val());
    let DA = $('#txtDA').val() == '' ? 0 : parseFloat($('#txtDA').val());
    let HRA = $('#txtHRA').val() == '' ? 0 : parseFloat($('#txtHRA').val());
    let Convayance = $('#txtConvayance').val() == '' ? 0 : parseFloat($('#txtConvayance').val());
    let OtherAllowance = $('#txtOtherAllowance').val() == '' ? 0 : parseFloat($('#txtOtherAllowance').val());
    let DeductionAmount = 0;
    let PercentageOfAmount = 0;

    let  ObjCurrRow = $(x).closest('tr');
    
    let Code = ObjCurrRow.find('td:eq(' + Indx_Deduct.Code + ')')[0].innerHTML;
    let DeductionDesp = ObjCurrRow.find('td:eq(' + Indx_Deduct.DeductionDesp + ')')[0].innerHTML;
    let Condition = ObjCurrRow.find('td:eq(' + Indx_Deduct.Condition + ')')[0].innerHTML;
    let Percentage = ObjCurrRow.find('td:eq(' + Indx_Deduct.Percentage + ')')[0].innerHTML;
    let PercentageOf = ObjCurrRow.find('td:eq(' + Indx_Deduct.PercentageOf + ')')[0].innerHTML;
    let EmployeeDeductionMasterDetail_Code = ObjCurrRow.find('td:eq(' + Indx_Deduct.EmployeeDeductionMasterDetail_Code + ')')[0].innerHTML;
    let Deduction = ObjCurrRow.find('td:eq(' + Indx_Deduct.Deduction + ')')[0].innerHTML;
    let  Applicable = ObjCurrRow.find('td:eq(' + Indx_Deduct.Applicable + ')')[0].getElementsByTagName('select')[0].value;

    if (PercentageOf == 'Basic') {
        PercentageOfAmount = parseFloat(Basic);
    } else if (PercentageOf == 'DA') {
        PercentageOfAmount = parseFloat(DA);
    } else if (PercentageOf == 'HRA') {
        PercentageOfAmount = parseFloat(HRA);
    } else if (PercentageOf == 'Convayance') {
        PercentageOfAmount = parseFloat(Convayance);
    } else {
        PercentageOfAmount = parseFloat(OtherAllowance);
    }

    if (Condition !== undefined && Condition == 'Fixed') {
        DeductionAmount = Percentage;
    } else {
        DeductionAmount = (parseFloat(PercentageOfAmount) * parseFloat(Percentage)) / 100;
    }
    ObjCurrRow.find('td:eq(' + Indx_Deduct.Amount + ')')[0].getElementsByTagName('input')[0].value = parseFloat(DeductionAmount).toFixed(2);

    
}
function SaveEmployeeDeductionDetails() {
    var EmployeeDeductionData = [];



    $("#Deduction tbody tr").each(function (index, row) {
        var EmployeeDeductionRow = {};

        var Code = $(this).find('td:eq(' + Indx_Deduct.Code + ')')[0].innerText;
        var EmployeeDeductionDesp = $(this).find('td:eq(' + Indx_Deduct.DeductionDesp + ')')[0].innerText;
        var Deduction = $(this).find('td:eq(' + Indx_Deduct.Deduction + ')')[0].innerText;
        var Applicable = $(this).find('td:eq(' + Indx_Deduct.Applicable + ')')[0].getElementsByTagName('select')[0].value;
        var Amount = $(this).find('td:eq(' + Indx_Deduct.Amount + ')')[0].getElementsByTagName('input')[0].value;

        EmployeeDeductionRow["Code"] = Code;
        EmployeeDeductionRow["EmployeeMaster_Code"] = param_Emp_Code;
        EmployeeDeductionRow["EmployeeDeductionDesp"] = EmployeeDeductionDesp;
        EmployeeDeductionRow["Deduction"] = Deduction;
        EmployeeDeductionRow["Applicable"] = Applicable;
        EmployeeDeductionRow["Amount"] = parseFloat(Amount);

        EmployeeDeductionData.push(EmployeeDeductionRow);

    });
    EmployeeMasterService.SaveEmployeeDeductionDetails(EmployeeDeductionData).then(function (response) {
        if (response != '') {
            if (response.Status == 'N') {
                toastr.error(response.Msg);
            } else {

                toastr.success(response.Msg);
                setTimeout(function () {

                    CloseDeductionModal();

                }, 2000); // 2 seconds delay before redirect
            }

        }
    });
}

function Save() {
    SaveData();
}
function Back() {
    //const alertCls = confirm("Are you sure you want to leave this page?");
    //if (alertCls == true) {
    //    window.location = baseUrl + "/HRMasters/EmployeeMaster/EmployeeList";
    //}


    Swal.fire({
        title: 'Confirmation',
        text: 'Are you sure you want to leave this page?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Leave Page',
        cancelButtonText: 'Stay Here'
    }).then((result) => {
        if (result.isConfirmed) {
            
            window.location = baseUrl + "/HRMasters/EmployeeMaster/EmployeeList";
        }
    });
}

function BizSolhandleEnterKey(event) {
    if (event.key === "Enter") {
        //const inputs = document.getElementsByTagName('input')
        const inputs = $('.BizSolFormControl')
        const index = [...inputs].indexOf(event.target);
        if ((index + 1) == inputs.length) {
            inputs[0].focus();
        } else {
            inputs[index + 1].focus();
        }

        event.preventDefault();
    }
}


window.buttonProperty = buttonProperty;
window.PopulateData = PopulateData;
window.SaveData = SaveData;
window.ShowAllowanceModal = ShowAllowanceModal;
window.CloseAllowanceModal = CloseAllowanceModal;
window.SaveAllowance = SaveAllowance;
window.CloseModal = CloseModal;
window.ShowImageModal = ShowImageModal;
window.SaveEmployeeAllowanceDetails = SaveEmployeeAllowanceDetails;
window.AddNewRow_LastEmployer = AddNewRow_LastEmployer;
window.AddNewRow_Education = AddNewRow_Education;
window.AddNewRow_Family = AddNewRow_Family;
window.AddNewRow_Machine = AddNewRow_Machine;
window.ShowDeductionModal = ShowDeductionModal;
window.ShowLeaveModal = ShowLeaveModal;
window.CloseLeaveModal = CloseLeaveModal;
window.CloseDeductionModal = CloseDeductionModal;
window.SaveEmployeeLeaveDetails = SaveEmployeeLeaveDetails;
window.ResetAllowedLeave = ResetAllowedLeave;
window.CalculateTotalSalaryAndCTC = CalculateTotalSalaryAndCTC;
window.ResetAllowedDeduction = ResetAllowedDeduction;
window.CalculateDeductionAmount = CalculateDeductionAmount;
window.SaveEmployeeDeductionDetails = SaveEmployeeDeductionDetails;
window.Save = Save;
window.Back = Back;
window.BizSolhandleEnterKey = BizSolhandleEnterKey;
