import { LeadMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_LeadMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
var G_UserMasterCode = authKeyData.UserMaster_Code;
let G_originalData = [];
let G_ItemMasterList = [];
let G_UOMMasterList = [];
$(document).ready(function () {
    $("#ERPHeading").text("Enquiry Master");
    $('#btnSubmit').click(function (e) {
        SaveData();
    });
    GetNestedMarketingManList();
    GetStatuslist();
    GetLeadMasterList('All');
    $("#ddlSalesPerson,#ddlStatus").change(function () {
        var SalesPerson = $("#ddlSalesPerson").val();
        var Status = $("#ddlStatus").val();
        let updatedResponse = [];
        let filteredData = [];

        if (SalesPerson?.toLowerCase() === "all" && Status?.toLowerCase() === "all") {
            filteredData = G_originalData;
        } else {
            filteredData = G_originalData.filter(item => {
                const salesMatch = SalesPerson?.toLowerCase() === "all"
                    || item["Sales Person"]?.toLowerCase() === SalesPerson?.toLowerCase();

                const statusMatch = Status?.toLowerCase() === "all"
                    || item["Status"]?.toLowerCase() === Status?.toLowerCase();

                return salesMatch && statusMatch;
            });
        }


        const StringFilterColumn = ["Enquiry No", "Company Name", "City", "State", "Sales Person", "Status", "Verified"];
        const NumericFilterColumn = [];
        const DateFilterColumn = ["Lead Date", "Next Followup Date"];
        const Button = false;
        const showButtons = [];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code", "ReferenceNo", "ReferenceDate", "PinCode", "CustomerFromMaster", "AccountContactPersonDetail", "UserID", "MarketingPersonMaster_Code", "Address1", "Address2", "Nation", "PhoneNo", "MobileNo", "FaxNo", "EMail", "Remark", "FinYear", "DeliveryDays", "VerifiedBy", "UserVerifiedBy", "VerifiedOn", "DeliveryRemark", "Specification", "CustomerType", "EnquiryType_Code", "EnquiryTypeName", "SortOrder", "NextFollowupMode", "LeadSourceMaster_Code", "LeadSourceDespName", "ReferenceBy", "Website", "CurrencyMaster_Code", "Currency", "ConversionRate", "FreightPerKG", "ContactPersonFromMaster", "ContactPersonName", "TestingGroupMaster_Code", "TestingGroup", "EnquiryToVendor", "EnquiryToVendorVerify", "PriceToVendorRemark", "ReasonForReject"]
        const ColumnAlignment = {
        };
        if (filteredData.length > 0) {
            updatedResponse = filteredData.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit"  onclick="EditData(${item.Code},this)"><i class="fa fa-pencil"></i></button>
                <button class="btn btn-danger icon-height mb-1" title="Delete"  onclick="DeleteData(${item.Code})"><i class="fa fa-times"></i></button>
                <button class="btn btn-info icon-height mb-1" title="View" onclick="ViewData(${item.Code},this)"><i class="fa fa-eye"></i></button>`;
                return {
                    ...item,
                    Action: buttonsHTML,
                };
            });
        }
        if (filteredData.length === 0) {
            $("#table-body").html("<tr><td colspan='10' style='text-align:center;'>No matching records found</td></tr>");
            return;
        }
        BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
    });
    Bind_ddlCustomer();
    Bind_ddlCustomerType();
    Bind_ddlEnquiryType();
    Bind_ddlCountry();
    Bind_ddlLeadSource();
    Bind_ddlDepartment();
    Bind_ddlDesignation();
    Bind_ddlUOM();
    Bind_ddlItemMaster();
    $("#ddlProductName").change(function () {
        var Code = $(this).val()
        if (Code != '') {
            var filteredData = G_ItemMasterList.filter(item => item.ItemName == Code);
            var UOMData = G_UOMMasterList.filter(item => item.UOM == filteredData[0]["UOM"]);
            $("#ddlUOM").val(UOMData[0].UOM).trigger('change');
            Bind_ddlItemSizeMaster(Code);
        }
    });
    $("#ddlCountry").change(function () {
        if ($(this).val() != '') {
            Bind_ddlState($(this).val());
        }
    });
    $("#ddlState").change(function () {
        if ($(this).val() != '' && $("#ddlCountry").val() != '') {
            Bind_ddlCity($("#ddlCountry").val(), $(this).val());
        }
    });
    toggleCompanyNameField();
    $("#ddlCompanyName").change(function () {
        if ($(this).val() == '') {
            CompanyBlank();
        } else {
            GetAccountDetailsByAccountDesp($(this).val());
        }
    });
    $('#ddlCompanyName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlCustomerType").focus();
        }
    });
    $('#txtCompanyName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlCustomerType").focus();
        }
    });
    $('#ddlCustomerType').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlEnquiryType").focus();
        }
    });
    $('#ddlEnquiryType').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPinCode").focus();
        }
    });
    $('#txtPinCode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlCountry").focus();
        }
    });
    $('#ddlCountry').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlState").focus();
        }
    });
    $('#ddlState').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlCity").focus();
        }
    });
    $('#ddlCity').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtEmail").focus();
        }
    });
    $('#txtEmail').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtContactNo").focus();
        }
    });
    $('#txtContactNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtWebsite").focus();
        }
    });
    $('#txtChallanDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtClientName").focus();
        }
    });
    $('#txtWebsite').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtAddressLine1").focus();
        }
    });
    $('#txtAddressLine1').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtAddressLine2").focus();
        }
    });
    $('#txtAddressLine2').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtEnquiryDate").focus();
        }
    });
    $('#txtEnquiryDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlLeadSource").focus();
        }
    });
    $('#ddlLeadSource').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtReference").focus();
        }
    });
    $('#txtReference').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtReferenceDate").focus();
        }
    });
    $('#txtReferenceDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlAssignSalesman").focus();
        }
    });
    $('#ddlAssignSalesman').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtAttachment").focus();
        }
    });
    $('#txtAttachment').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtNextFollowupDate").focus();
        }
    });
    $('#txtNextFollowupDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlNextFollowupMode").focus();
        }
    });
    $('#ddlNextFollowupMode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtRemarks").focus();
        }
    });
    $('#txtName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlDepartment").focus();
        }
    });
    $('#ddlDepartment').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlDesignation").focus();
        }
    });
    $('#ddlDesignation').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtEmailId").focus();
        }
    });
    $('#txtEmailId').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPersonContactNo").focus();
        }
    });
    $('#ddlProductName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlSpecification").focus();
        }
    });
    $('#ddlSpecification').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlUOM").focus();
        }
    });
    $('#ddlUOM').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtQuantity").focus();
        }
    });
    $('#txtQuantity').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtProductRemark").focus();
        }
    });
    $(".Phone").keyup(function (e) {
        if (/\D/g.test(this.value)) this.value = this.value.replace(/[^0-9]/g, '')
    });
    $(".Weight").blur(function (e) {
        if ($.isNumeric(this.value))
            this.value = parseFloat(this.value).toFixed(3);
    });
    $(".Weight").keyup(function (e) {
        if (/\D/g.test(this.value)) {
            if (this.value.length == 1) this.value = this.value.replace(/[.]/g, '0.');
            this.value = this.value.replace(/[^0-9\.]/g, '')
            if (this.value.split(".").length > 2) this.value = this.value.replace(/\.+?$/, '')
            if (this.value.split(".").length > 2) this.value = this.value.replace(this.value, '')
            if (this.value.charAt(0) == ".") this.value = this.value.replace(this.value, '0' + this.value)
        }
    });
    $("#chkFollowUpRequired").change(function () {
        if ($("#chkFollowUpRequired").is(":checked")) {
            $("#dvNextFollowUpDateFollowUp").show();
            $("#dvNextFollowUpModeFollowUp").show();
            $("#ddlNextFollowUpModeFollowUp").val("");
            $("#txtNextFollowUpDateFollowUp").val("");
        } else {
            $("#dvNextFollowUpDateFollowUp").hide();
            $("#dvNextFollowUpModeFollowUp").hide();
            $("#ddlNextFollowUpModeFollowUp").val("");
            $("#txtNextFollowUpDateFollowUp").val("");
        }
    });
});
function toggleCompanyNameField() {
var selectedValue = $('input[name="customerType"]:checked').val();
    if (selectedValue === 'Existing') {
        $('#ddlCompanyName').next('.select2-container').show();
        $('#txtCompanyName').hide();
        ClearData();
    } else {
        SelectOptionByText('ddlCompanyName', "select");
        $('#ddlCompanyName').next('.select2-container').hide();
        $('#txtCompanyName').show();
        ClearData();
    }
}

$('input[name="customerType"]').change(function () {
    toggleCompanyNameField();
});

$('#ddlCompanyName, #ddlCustomerType, #ddlEnquiryType, #ddlCountry, #ddlState, #ddlCity, #ddlNextFollowupMode, #txtEnquiryDate, #ddlLeadSource, #txtReferenceDate, #ddlAssignSalesman, #txtNextFollowupDate')
    .change(function () {
        if ($(this).val() != '') {
            SaveLeadEnquiryOnChange();
        }
    });
$('#txtCompanyName, #txtPinCode, #txtEmail, #txtContactNo, #txtWebsite, #txtAddressLine1, #txtAddressLine2, #txtReference, #txtRemarks')
    .on("keypress", function (e) {
        if (e.which === 13) { 
            e.preventDefault();
            if ($(this).val() != '') {
                SaveLeadEnquiryOnChange();
            }
        }
});

$('#txtCompanyName, #txtPinCode, #txtEmail, #txtContactNo, #txtWebsite, #txtAddressLine1, #txtAddressLine2, #txtReference, #txtRemarks')
    .on("blur", function () {
        if ($(this).val() != '') {
            SaveLeadEnquiryOnChange();
        }
});


function GetNestedMarketingManList() {
    LeadMasterService.GetNestedMarketingManList().then(function (response) {
        if (response.length > 0) {
            BindSelectForSalePerson($('#ddlSalesPerson')[0], response.map((item) => ({ Code: item.PersonName, Desp: item.PersonName })));
            $('#ddlSalesPerson').select2({
                width: '-webkit-fill-available'
            });
            BindSelectList($('#ddlAssignSalesman')[0], response.map((item) => ({ Code: item.PersonName, Desp: item.PersonName })));
            $('#ddlAssignSalesman').select2({
                width: '-webkit-fill-available'
            });
            BindSelectList($('#ddlAssignTo')[0], response.map((item) => ({ Code: item.Code, Desp: item.PersonName })));
            $('#ddlAssignTo').select2({
                width: '-webkit-fill-available',
                dropdownParent: $('#AssignModal')
            });
        }
    });
}
function GetStatuslist() {
    LeadMasterService.GetStatuslist().then(function (response) {
        if (response.length > 0) {
            $('#ddlStatusList option').empty();
            var option = '<option data-code="0">All</option>';
            for (var i = 0; i < response.length; i++) {

                option += '<option data-code="' + response[i].Desp + '">' + response[i].Desp + '</option>'

            }
            $('#ddlStatusList')[0].innerHTML = option;
        }


    });
}
function GetLeadMasterList(SalesPerson) {
    LeadMasterService.GetLeadMasterList(SalesPerson).then(function (response) {
        $("#table").show();
        if (response.length > 0) {
            G_originalData = response;
            const StringFilterColumn = ["Enquiry No", "Company Name", "City", "State", "Sales Person", "Status", "Verified"];
            const NumericFilterColumn = [];
            const DateFilterColumn = ["Lead Date", "Next Followup Date"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code","ReferenceNo", "ReferenceDate", "PinCode", "CustomerFromMaster","AccountContactPersonDetail","UserID","MarketingPersonMaster_Code","Address1","Address2","Nation","PhoneNo","MobileNo","FaxNo","EMail","Remark","FinYear","DeliveryDays","VerifiedBy","UserVerifiedBy","VerifiedOn","DeliveryRemark","Specification","CustomerType","EnquiryType_Code","EnquiryTypeName","SortOrder","NextFollowupMode","LeadSourceMaster_Code","LeadSourceDespName","ReferenceBy","Website","CurrencyMaster_Code","Currency","ConversionRate","FreightPerKG","ContactPersonFromMaster","ContactPersonName","TestingGroupMaster_Code","TestingGroup","EnquiryToVendor","EnquiryToVendorVerify","PriceToVendorRemark","ReasonForReject"]
            const ColumnAlignment = {
                Action:";width:100px;"
            };

            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit"  onclick="GetEnquiryDetailsByCode(${item.Code},this)"><i class="fa fa-pencil"></i></button>
                <button class="btn btn-danger icon-height mb-1" title="Delete"  onclick="Delete(${item.Code})"><i class="fa fa-times"></i></button>
                <div class="btn-group">
                <button type="button" style="margin-top:-4px" class="btn btn-primary icon-height dropdown-toggle" data-bs-toggle="dropdown">
                  ...
                </button>
                <ul class="dropdown-menu p-1">
                  <li style="padding:1px;"><input type="button" style="width:100%;height: 33px;" value="Verify" class="btn btn-success mb-1" title="Verify"  onclick="VerifyEnquiry(${item.Code})">
                  <li style="padding:1px;"><input type="button" style="width:100%;height: 33px;" value="Assign" class="btn btn-primary mb-1" title="Assign"  onclick="AssignEnquiry(${item.Code})">
                  <li style="padding:1px;"><input type="button" style="width:100%;height: 33px;" value="Follow Up" class="btn btn-primary mb-1" title="Follow Up"  onclick="FollowUp(${item.Code})">
                </ul>
              </div>`;


                return {
                    ...item,
                    Action: buttonsHTML,
                };

            });
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        }
        else {
            toastr.error('No Data Found');
            $("#table").hide();
        }
    });
}
function BackMaster() {
    $("#dvLoad").show();
    $("#dvEnquiry").hide();
    ClearData();
    $('input[name="customerType"]').eq(0).prop('disabled', false);
    $('input[name="customerType"]').eq(0).prop('checked', true);
    $("#txtCompanyName").hide("");
    $('#ddlCompanyName').next('.select2-container').show();
    ClearContactPersonField();
    ClearEnquiryProductField();
    GetLeadMasterList("All");
    $("#tblContactPerson").hide();
    $("#tblProductDetails").hide();
    $("#dvFollowup").hide();
    $("#tblFollowUp").hide();
    $("#dvFollowTab1").show();
    $("#dvFollowTab2").hide();
    $("#hfFollowUpEnquiryMaster_Code").val('0')
}
function CreateNew() {
    $("#dvLoad").hide();
    $("#dvEnquiry").show();
}
function Bind_ddlCustomer() {
    LeadMasterService.GetAccountlist().then(function (resObj) {

        BindSelectList($('#ddlCompanyName')[0], resObj.map((item) => ({ Code: item.Desp, Desp: item.Desp })));
        $('#ddlCompanyName').select2({
            width: '-webkit-fill-available'
        });
    });
}
function Bind_ddlCustomerType() {
    LeadMasterService.GetAccountCategorylist().then(function (resObj) {
        let option = '<option value="" >select</option>';
        $.each(resObj, function (key, val) {
            option += '<option value="' + val.Desp + '" >' + val.Desp + '</option>';
        });
        $("#ddlCustomerType").append(option);
    });
}
function Bind_ddlEnquiryType() {
    LeadMasterService.GetEnquiryTypelist().then(function (resObj) {
        let option = '<option value="" >select</option>';
        $.each(resObj, function (key, val) {
            option += '<option value="' + val.Desp + '" >' + val.Desp + '</option>';
        });
        $("#ddlEnquiryType").append(option);
    });
}
function Bind_ddlLeadSource() {
    LeadMasterService.GetLeadSourcelist().then(function (resObj) {
        let option = '<option value="" >select</option>';
        $.each(resObj, function (key, val) {
            option += '<option value="' + val.LeadSourceDesp + '" >' + val.LeadSourceDesp + '</option>';
        });
        $("#ddlNextFollowupMode").append(option);
        $("#ddlLeadSource").append(option);
        $("#ddlFollowUpModeFollowUp").append(option);
        $("#ddlNextFollowUpModeFollowUp").append(option);
    });
}
function Bind_ddlContactPersonDetail(Code) {
    $("#ddlCustomerContactPersonName").empty();
    LeadMasterService.GetEnquiryContactPersonDetailList(Code).then(function (resObj) {
        let option = '<option value="" >select</option>';
        $.each(resObj, function (key, val) {
            option += '<option value="' + val.ContactPersonName + '" >' + val.ContactPersonName + '</option>';
        });
        $("#ddlCustomerContactPersonName").append(option);
    });
}
function Bind_ddlCountry() {
    LeadMasterService.GetCountryMasterList().then(function (resObj) {
        BindSelectList($('#ddlCountry')[0], resObj.map((item) => ({ Code: item.CountryName, Desp: item.CountryName })));
        $('#ddlCountry').select2({
            width: '-webkit-fill-available'
        });
    });
}

async function Bind_ddlState(CountryName) {
    try {
        const resObj = await LeadMasterService.GetStateMasterList(CountryName);
        resObj;
        BindSelectList($('#ddlState')[0], resObj.map(item => ({
            Code: item.StateName,
            Desp: item.StateName
        })));
        $('#ddlState').select2({
            width: '-webkit-fill-available'
        });
    } catch (error) {
        console.error("Error loading states:", error);
        toastr.error(error.Msg || 'Failed to load states');
    }
}

async function Bind_ddlCity(CountryName, StateName) {
    try {
        const resObj = await LeadMasterService.GetCityList(CountryName, StateName);

        BindSelectList($('#ddlCity')[0], resObj.map(item => ({
            Code: item.CityName,
            Desp: item.CityName
        })));

        $('#ddlCity').select2({
            width: '-webkit-fill-available'
        });

        return resObj; // return data if needed
    } catch (error) {
        console.error("Error loading cities:", error);
        toastr.error(error.Msg || 'Failed to load cities');
    }
}
function Bind_ddlDepartment() {
    LeadMasterService.GetDepartmentlist().then(function (resObj) {
        BindSelectList($('#ddlDepartment')[0], resObj.map((item) => ({ Code: item.DepartmentName, Desp: item.DepartmentName })));
        $('#ddlDepartment').select2({
            width: '-webkit-fill-available'
        });
        BindSelectList($('#ddlModalDepartment')[0], resObj.map((item) => ({ Code: item.DepartmentName, Desp: item.DepartmentName })));
        $('#ddlModalDepartment').select2({
            width: '-webkit-fill-available'
        });
    }).catch(function(error) {
        toastr.error(error.Msg || 'An error occurred while fetching departments');
    });
}
function Bind_ddlDesignation() {
    if (LeadMasterService.GetDesignationList) {
        LeadMasterService.GetDesignationList().then(function (resObj) {
            BindSelectList($('#ddlDesignation')[0], resObj.map((item) => ({ Code: item.DesignationName, Desp: item.DesignationName })));
            $('#ddlDesignation').select2({
                width: '-webkit-fill-available'
            });
            BindSelectList($('#ddlModalDesignation')[0], resObj.map((item) => ({ Code: item.DesignationName, Desp: item.DesignationName })));
            $('#ddlModalDesignation').select2({
                width: '-webkit-fill-available'
            });
        }).catch(function(error) {
            toastr.error(error.Msg || 'An error occurred while fetching designations');
        });
    }
}
function Bind_ddlUOM() {
    LeadMasterService.GetUOMMasterList().then(function (resObj) {
        G_UOMMasterList = resObj;
        BindSelectList($('#ddlUOM')[0], resObj.map((item) => ({ Code: item.UOM, Desp: item.UOM })));
        $('#ddlUOM').select2({
            width: '-webkit-fill-available'
        });
    }).catch(function(error) {
        toastr.error(error.Msg || 'An error occurred while fetching UOM list');
    });
}
function Bind_ddlItemMaster() {
    LeadMasterService.GetItemMasterDropDown().then(function (resObj) {
        G_ItemMasterList = resObj;
        BindSelectList($('#ddlProductName')[0], resObj.map((item) => ({ Code: item.ItemName, Desp: item.ItemName })));
        $('#ddlProductName').select2({
            width: '-webkit-fill-available'
        });
    }).catch(function(error) {
        toastr.error(error.Msg || 'An error occurred while fetching item master list');
    });
}

async function Bind_ddlItemSizeMaster(itemName) {
    try {
        const resObj = await LeadMasterService.GetItemSizeMasterList(itemName);

        BindSelectList($('#ddlSpecification')[0], resObj.map(item => ({
            Code: item.SizeDesp,
            Desp: item.SizeDesp
        })));

        $('#ddlSpecification').select2({
            width: '-webkit-fill-available'
        });

        return resObj; // return data if needed
    } catch (error) {
        console.error("Error loading cities:", error);
        toastr.error(error.Msg || 'Failed to load cities');
    }
}
function BindSelectList(element, list) {
    let option = '<option value="">select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '" >' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function BindSelectForSalePerson(element, list) {
    let option = '<option value="all">All</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '" >' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function SaveLeadEnquiryData() {
    const data = [{
        code: $('#hfCode').val() || 0,
        enquiryDate: $('#txtEnquiryDate').val(),
        referenceNo: $('#txtReference').val() || '',
        referenceDate: $('#txtReferenceDate').val(),
        customerFromMaster: '',
        accountMaster_Code: 0,
        accountDesp: $('input[name="customerType"]:checked').val() == 'New' ? $('#txtCompanyName').val() : $('#ddlCompanyName').val(),
        accountContactPersonDetail_Code: 0,
        accountDespManual: '',
        userID: G_UserMasterCode,
        marketingPersonMaster_Code: 0,
        personName: $('#ddlAssignSalesman').val(),
        customerName: '',
        address1: $('#txtAddressLine1').val(),
        address2: $('#txtAddressLine2').val(),
        city: $('#ddlCity').val() || '',
        pinCode: $('#txtPinCode').val(),
        state: $('#ddlState').val() || '',
        nation: $('#ddlCountry').val() || '',
        mobileNo: $('#txtContactNo').val(),
        faxNo: '',
        eMail: $('#txtEmail').val(),
        remark: $('#txtRemarks').val(),
        finYear: '',
        databaseLocation_Code: 0,
        deliveryDays: 0,
        verified: '',
        verifiedBy: 0,
        userVerifiedBy: '',
        verifiedOn: '',
        deliveryRemark: '',
        specification: '',
        status:'I',
        isAttachmentExists: '',
        documentName: '',
        documentContent: '',
        customerType: $('#ddlCustomerType').val() || '',
        enquirytypeName: $('#ddlEnquiryType').val() || '',
        nextFollowupdate: $('#txtNextFollowupDate').val(),
        nextFollowupmode: $('#ddlNextFollowupMode').val() || '',
        leadSourceDespName: $('#ddlLeadSource').val() || '',
        referenceBy: '',
        website: $('#txtWebsite').val()
    }];

    if (!data[0].accountDesp) {
        toastr.error('Please select Customer/Company Name.');
        if ($('input[name="customerType"]:checked').val() == 'New') {
            $('#txtCompanyName').focus();
        } else {
            $('#ddlCompanyName').focus();
        }
        return;
    }
    if (!data[0].customerType) {
        toastr.error('Please select Customer Type.');
        $('#ddlCustomerType').focus();
        return;
    }
    if (!data[0].enquirytypeName) {
        toastr.error('Please select Enquiry Type.');
        $('#ddlEnquiryType').focus();
        return;
    }
    if (!data[0].pinCode) {
        toastr.error('Please enter PIN / ZIP Code.');
        $('#txtPinCode').focus();
        return;
    }
    if (!data[0].nation) {
        toastr.error('Please select Country.');
        $('#ddlCountry').focus();
        return;
    }
    if (!data[0].state) {
        toastr.error('Please select State.');
        $('#ddlState').focus();
        return;
    }
    if (!data[0].city) {
        toastr.error('Please select City/Town.');
        $('#ddlCity').focus();
        return;
    }
    if (data[0].eMail != '' && !isEmail(data[0].eMail)) {
        toastr.error('Please enter valid email.');
        $('#txtEmail').focus();
        return;
    }
    if (!data[0].mobileNo) {
        toastr.error('Please enter Contact No.');
        $('#txtContactNo').focus();
        return;
    }
    if (!IsMobileNumber(data[0].mobileNo)) {
        toastr.error('Please enter valid Contact No.');
        $('#txtContactNo').focus();
        return;
    }
    if (!data[0].address1) {
        toastr.error('Please enter Address Line 1.');
        $('#txtAddressLine1').focus();
        return;
    }
    if (!data[0].enquiryDate) {
        toastr.error('Please select Enquiry Date.');
        $('#txtEnquiryDate').focus();
        return;
    }
    if (!data[0].leadSourceDespName) {
        toastr.error('Please select Lead Source.');
        $('#ddlLeadSource').focus();
        return;
    }
    if (!data[0].nextFollowupdate) {
        toastr.error('Please select Next Followup Date.');
        $('#txtNextFollowupDate').focus();
        return;
    }
    if (!data[0].nextFollowupmode) {
        toastr.error('Please select Next Followup Mode.');
        $('#ddlNextFollowupMode').focus();
        return;
    }
    LeadMasterService.SaveLeadEnquiryData(data).then(function (response) {
        if (response[0].Status === 'Y') {
            toastr.success(response[0].Msg || 'Lead enquiry saved successfully.');
            BackMaster();
        } else {
            toastr.error(response[0].Msg || 'Save failed.');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'An error occurred while saving.');
    });
}
function HideShowTab(TabNo, ele) {
    const target = document.querySelector('#dvTab' + TabNo);
    if (target) {
        const offset = 100;
        const topPosition = target.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
            top: topPosition,
            behavior: 'smooth'
        });
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        ele.classList.add('active');
    }
}
function SelectOptionByText(Id, FindText) {
    var dd = document.getElementById(Id);
    for (var i = 0; i < dd.options.length; i++) {
        if (dd.options[i].text === FindText) {
            dd.selectedIndex = i;
            break;
        }
    }
    $('#' + Id).select2({
        width: '-webkit-fill-available'
    })
}
function CompanyBlank() {
    $("#ddlCustomerType").val("");
    $("#txtPinCode").val("");
    SelectOptionByText('ddlCountry', "select");
    SelectOptionByText('ddlState',"select");
    SelectOptionByText('ddlCity',"select");
    $("#txtEmail").val("");
    $("#txtContactNo").val("");
    $("#txtWebsite").val("");
    $("#txtAddressLine1").val("");
    $("#txtAddressLine2").val("");
}

async function GetAccountDetailsByAccountDesp(CompanyName) {
    try {
        const resObj = await LeadMasterService.GetAccountDetailsByAccountDesp(CompanyName);

        if (resObj.AccountMaster.length > 0) {
            const data = resObj.AccountMaster[0];

            SelectOptionByText("ddlCustomerType",data.AccountCategory);
            $("#txtPinCode").val(data.PinCode);
            SelectOptionByText('ddlCountry', data.Nation);

            if (data.Nation) {
                await Bind_ddlState(data.Nation);
                SelectOptionByText('ddlState', data.State);

                if (data.State) {
                    await Bind_ddlCity(data.Nation, data.State);
                    SelectOptionByText('ddlCity', data.City);
                }
            }

            $("#txtEmail").val(data.EMail);
            $("#txtContactNo").val(data.PhoneNo);
            $("#txtWebsite").val(data.WebSite);
            $("#txtAddressLine1").val(data.Address1);
            $("#txtAddressLine2").val(data.Address2);
        } else {
            CompanyBlank();
        }
    } catch (error) {
        toastr.error(error.Msg || 'An error occurred while fetching account desp list');
    }
}

async function GetEnquiryDetailsByCode(Code) {
    $("#dvLoad").hide();
    $("#dvEnquiry").show();
    $('input[name="customerType"]').eq(0).prop('disabled', true);
    $('input[name="customerType"]').eq(1).prop('checked', true);
    SelectOptionByText('ddlCompanyName', "select");
    $('#ddlCompanyName').next('.select2-container').hide();
    $('#txtCompanyName').show();
    try {
        const resObj = await LeadMasterService.GetEnquiryDetailsByCode(Code);
        if (resObj.EnquiryMaster.length > 0) {
            const data = resObj.EnquiryMaster[0];
            $("#hfCode").val(data.Code);
            $("#txtCompanyName").val(data.AccountDesp);
            $("#ddlCustomerType").val(data.CustomerType);
            $("#ddlEnquiryType").val(data.EnquiryTypeName);
            $("#txtPinCode").val(data.PinCode);
            SelectOptionByText('ddlCountry', data.Nation);
            if (data.Nation) {
                await Bind_ddlState(data.Nation);
                SelectOptionByText('ddlState', data.State);

                if (data.State) {
                    await Bind_ddlCity(data.Nation, data.State);
                    SelectOptionByText('ddlCity', data.City);
                }
            }
            $("#txtEmail").val(data.EMail);
            $("#txtContactNo").val(data.MobileNo);
            $("#txtWebsite").val(data.Website);
            $("#txtAddressLine1").val(data.Address1);
            $("#txtAddressLine2").val(data.Address2);
            $("#txtEnquiryDate").val(data.EnquiryDate);
            $("#ddlLeadSource").val(data.LeadSourceDespName);
            $("#txtReference").val(data.ReferenceBy);
            $("#txtReferenceDate").val(data.ReferenceDate);
            SelectOptionByText('ddlAssignSalesman', data.PersonName);
            SelectOptionByText('ddlCustomerType', data.CustomerType);
            $("#txtNextFollowupDate").val(data.NextFollowupDate);
            $("#ddlNextFollowupMode").val(data.NextFollowupMode);
            $("#txtRemarks").val(data.Remark);
        }
        if (resObj.EnquiryDetails.length > 0) {
            $("#tblProductDetails").show();
            var EnquiryDetails = resObj.EnquiryDetails;
            const StringFilterColumn = ["Product Name", "Specification", "UOM", "Remarks"];
            const NumericFilterColumn = ["Quantity"];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "EnquiryMaster_Code"]
            const ColumnAlignment = {
            };

            const updatedResponse = EnquiryDetails.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit"  onclick="GetProductDetailsByCode(${item.Code},this)"><i class="fa fa-pencil"></i></button>
                <button class="btn btn-danger icon-height mb-1" title="Delete"  onclick="DeleteProductDetail(${item.Code})"><i class="fa fa-times"></i></button>`;
                return {
                    ...item,
                    Action: buttonsHTML,
                };

            });
            BizsolCustomFilterGrid.CreateDataTable("ProductDetails-header", "ProductDetails-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false)
        } else {
            $("#tblProductDetails").hide();
        }
        if (resObj.ContactPersonsList.length > 0) {
            $("#tblContactPerson").show();
            var ContactPersonsList = resObj.ContactPersonsList;
            const StringFilterColumn = ["Name", "Department", "Designation", "Email Id","Contact No"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "EnquiryMaster_Code"]
            const ColumnAlignment = {
            };

            const updatedResponse = ContactPersonsList.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit"  onclick="GetContactPersonDetailsByCode(${item.Code},this)"><i class="fa fa-pencil"></i></button>
                <button class="btn btn-danger icon-height mb-1" title="Delete"  onclick="DeleteContactPerson(${item.Code})"><i class="fa fa-times"></i></button>`;
                return {
                    ...item,
                    Action: buttonsHTML,
                };

            });
            BizsolCustomFilterGrid.CreateDataTable("ContactPerson-header", "ContactPerson-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment,false)
        } else {
            $("#tblContactPerson").hide();
        }
    } catch (error) {
        toastr.error(error.Msg || 'An error occurred while fetching account desp list');
    }
}

async function GetContactPersonDetailsByCode(Code) {
    try {
        const resObj = await LeadMasterService.GetContactPersonDetailsByCode(Code);
        if (resObj != undefined && resObj != null) {
            $("#hfContactPersonCode").val(resObj.Code);
            $("#txtName").val(resObj.ContactPersonName);
            $("#txtPersonContactNo").val(resObj.ContactPersonMobile);
            SelectOptionByText('ddlDepartment', resObj.ContactPersonDepartment);
            SelectOptionByText('ddlDesignation', resObj.ContactPersonDesignation);
            $("#txtEmailId").val(resObj.ContactPersonEMail);
        }
    } catch (error) {
        toastr.error(error.Msg || 'An error occurred while fetching Contact Person Details');
    }
}

async function GetProductDetailsByCode(Code) {
    try {
        const resObj = await LeadMasterService.GetProductDetailsByCode(Code);
        if (resObj != undefined && resObj != null) {
            $("#hfProductDetailCode").val(resObj.Code);
            $("#txtProductRemark").val(resObj["Remarks"]);
            SelectOptionByText('ddlProductName', resObj["Product Name"]);
            if (resObj["Product Name"]) {
                await Bind_ddlItemSizeMaster(resObj["Product Name"]);
                SelectOptionByText('ddlSpecification', resObj["Specification"]);
            } else {
                SelectOptionByText('ddlSpecification',"");
            }
            SelectOptionByText('ddlUOM', resObj["UOM"]);
            $("#txtQuantity").val(resObj["Quantity"]);
        }
    } catch (error) {
        toastr.error(error.Msg || 'An error occurred while fetching Contact Person Details');
    }
}
function ClearData() {
    $("#hfCode").val("0");
    $("#txtPinCode").val("");
    $("#txtEmail").val("");
    $("#txtContactNo").val("");
    $("#txtWebsite").val("");
    $("#txtAddressLine1").val("");
    $("#txtAddressLine2").val("");
    $("#txtReference").val("");
    $("#txtReferenceDate").val("");
    $("#txtNextFollowupDate").val("");
    $("#txtEnquiryDate").val("");
    $("#txtRemarks").val("");
    SelectOptionByText('ddlCustomerType', "select");
    SelectOptionByText('ddlCountry', "select");
    SelectOptionByText('ddlState', "select");
    SelectOptionByText('ddlCity', "select");
    SelectOptionByText('ddlAssignSalesman', "select");
    $("#ddlCustomerType").val("");
    $("#ddlEnquiryType").val("");
    $("#ddlNextFollowupMode").val("");
    $("#ddlLeadSource").val("");
    $("#ddlProductName").val("");
    $("#ddlSpecification").val("");
    $("#ddlUOM").val("");
    $("#txtCompanyName").val("");
    
}
function SaveContactPersonDetails() {
    let payload = [{
        code: $("#hfContactPersonCode").val() || 0,
        enquiryMaster_Code: $("#hfCode").val() || 0,
        contactPersonName: $("#txtName").val().trim(),
        contactPersonMobile: $("#txtPersonContactNo").val().trim(),
        contactPersonEMail: $("#txtEmailId").val().trim(),
        contactPersonExt:"",
        contactPersonDesignation: $("#ddlDesignation").val() || "",
        departmentName: $("#ddlDepartment").val() || "",
        emailInInvoiceCopy: ""
    }];
    if ($("#hfCode").val() == '0' || $("#hfCode").val() == '0') {
        toastr.error("Please fill first enquiry details.");
        return;
    }
    if (!payload[0].contactPersonName) {
        toastr.error("Please enter contact person name.");
        $("#txtName").focus();
        return;
    }
    if (!payload[0].departmentName) {
        toastr.error("Please select department.");
        $("#ddlDepartment").focus();
        return;
    }
    if (!payload[0].contactPersonDesignation) {
        toastr.error("Please select designation.");
        $("#ddlDesignation").focus();
        return;
    }
    if (!payload[0].contactPersonEMail) {
        toastr.error("Please enter contact person email.");
        $("#txtEmailId").focus();
        return;
    }
    if (!isEmail(payload[0].contactPersonEMail)) {
        toastr.error("Please enter valid contact person email.");
        $("#txtEmailId").focus();
        return;
    }
    if (!payload[0].contactPersonMobile) {
        toastr.error("Please enter contact person mobile number.");
        $("#txtPersonContactNo").focus();
        return;
    }
    if (!IsMobileNumber(payload[0].contactPersonMobile)) {
        toastr.error("Please enter valid contact person mobile number.");
        $("#txtPersonContactNo").focus();
        return;
    }
    LeadMasterService.SaveContactPersonDetails(payload)
        .then(function (response) {
            if (response && response[0].Status === 'Y') {
                toastr.success(response[0].Msg || "Contact person details saved successfully.");
                ClearContactPersonField();
                GetEnquiryDetailsByCode($("#hfCode").val())
            } else {
                toastr.error(response[0].Msg || "Save failed for contact person details.");
            }
        })
        .catch(function (error) {
            toastr.error(error.Msg || "An error occurred while saving contact person details.");
        });
}
function SaveEnquiryProductDetails() {
    let payload = [{
        code: $("#hfProductDetailCode").val() || 0,
        enquiryMaster_Code: $("#hfCode").val() || 0,
        itemName: $("#ddlProductName").val() || "",
        sizeDetails: $("#ddlSpecification").val() || "",
        quantity: parseFloat($("#txtQuantity").val()) || 0,
        uom: $("#ddlUOM").val() || "",
        remarks: $("#txtProductRemark").val() || "",
        classificationDesp: "",
        gradeDesp: "",
        basicValue:0,
        freight:0,
        basicRatePerPC: 0,
        sizeDesp: "",
        partNumber:"",
        mrpOfProducts: 0,
        schemeDiscount: "",
        vatRate:0,
        purchasePrice:0,
        vatAmount:0,
        rateAfterVat:0,
        newDiscountPercentage:0,
        checkSendMail:"N",
        newFreight:0,
        oldPurchaseRate: 0,
        updatedby: G_UserMasterCode,
        updatedDate: null,
        verifiedby: 0,
        verifiedDate: null,
        vendorName: "",
        newPurchaseRate:0,
        priceToVendorRemark:"",
        discountIncl:0,
        discountInclValue:0,
        discount2:0,
        discount2Value:0,
        discount3:0,
        discount3Value:0
    }];
    if ($("#hfCode").val() == '0' || $("#hfCode").val() == '0') {
        toastr.error("Please fill first enquiry details.");
        return;
    }
    if (!payload[0].itemName) {
        toastr.error("Please select Product Name.");
        $("#ddlProductName").focus();
        return;
    }
    if (!payload[0].sizeDetails) {
        toastr.error("Please select Specification.");
        $("#ddlSpecification").focus();
        return;
    }
    if (!payload[0].uom) {
        toastr.error("Please select UOM.");
        $("#ddlUOM").focus();
        return;
    }
    if (!payload[0].quantity || payload[0].quantity <= 0) {
        toastr.error("Please enter valid Quantity.");
        $("#txtQuantity").focus();
        return;
    }
    if (!payload[0].remarks) {
        toastr.error("Please enter remarks.");
        $("#txtProductRemark").focus();
        return;
    }
    LeadMasterService.SaveEnquiryProductDetails(payload)
        .then(function (response) {
            if (response && response[0].Status === 'Y') {
                toastr.success(response[0].Msg || "Product details saved successfully.");
                ClearEnquiryProductField();
                GetEnquiryDetailsByCode($("#hfCode").val());
            } else {
                toastr.error(response[0].Msg || "Save failed for product details.");
            }
        })
        .catch(function (error) {
            toastr.error(error.Msg || "An error occurred while saving product details.");
        });
}
function ClearContactPersonField() {
    $("#hfContactPersonCode").val(0);
    $("#txtName").val("");
    $("#txtPersonContactNo").val("");
    $("#txtEmailId").val("");
    SelectOptionByText('ddlDesignation', "select");
    SelectOptionByText('ddlDepartment', "select");
}
function ClearEnquiryProductField() {
    $("#hfProductDetailCode").val(0);
    SelectOptionByText('ddlProductName', "select");
    SelectOptionByText('ddlSpecification', "select");
    SelectOptionByText('ddlUOM', "select");
    $("#txtQuantity").val("");
    $("#txtProductRemark").val("");
}
function Delete(Code) {
    var ModuleName = "Enquiry",
        OptionName = "DELETE",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
        LeadMasterService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            OpenModal()
            $("#txtcode").val(Code);
        }

    });
}
function getFinancialYear() {
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth(); 
    var startYear = currentDate.getFullYear();
    if (currentMonth < 3) {
        startYear = startYear - 1;
    }
    return startYear + "-" + (startYear + 1);
}
function DeleteModal() {
    var reason = $("#deleteReason").val();
    var code = $("#txtcode").val();
    if (reason == "") {
        toastr.error('Please enter a reason before proceeding.');
        return;
    }
    LeadMasterService.DeleteEnquiryMaster(code, reason).then(function (response) {
        if (response[0].Status == 'Y') {
            toastr.success(response[0].Msg);
            $("#deleteReason").val('');
            $("#txtcode").val('');
            GetLeadMasterList('All');
            CloseModal();
        } else {
            toastr.error(response[0].Msg);
        }
    });

}
function OpenModal() {
    var myModal = new bootstrap.Modal(document.getElementById('myModal'));
    myModal.show();
}
function CloseModal() {
    var myModalEl = document.getElementById('myModal');
    var modalInstance = bootstrap.Modal.getInstance(myModalEl); 
    if (modalInstance) {
        modalInstance.hide();
    }
    $("#deleteReason").val('');
    $("#txtcode").val('');
}
function DeleteContactPerson(Code) {
    var ModuleName = "Enquiry",
        OptionName = "DELETE",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
        LeadMasterService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            OpenModalContactPerson()
            $("#txtContactPersonCode").val(Code);
        }
    });
}
function DeleteContactPersonModal() {
    var reason = $("#deleteContactReason").val();
    var code = $("#txtContactPersonCode").val();
    if (reason == "") {
        toastr.error('Please enter a reason before proceeding.');
        return;
    }
    LeadMasterService.DeleteEnquiryContactDetail(code, reason).then(function (response) {
        if (response[0].Status == 'Y') {
            toastr.success(response[0].Msg);
            GetEnquiryDetailsByCode($("#hfCode").val());
            $("#deleteContactReason").val('');
            $("#txtContactPersonCode").val('');
            CloseModalContactPerson();
            ClearContactPersonField();
        } else {
            toastr.error(response[0].Msg);
        }
    });

}
function OpenModalContactPerson() {
    var myModal = new bootstrap.Modal(document.getElementById('ContactModal'));
    myModal.show();
}
function CloseModalContactPerson() {
    var myModalEl = document.getElementById('ContactModal');
    var modalInstance = bootstrap.Modal.getInstance(myModalEl);
    if (modalInstance) {
        modalInstance.hide();
    }
    $("#deleteContactReason").val('');
    $("#txtContactPersonCode").val('');
}
function DeleteProductDetail(Code) {
    var ModuleName = "Enquiry",
        OptionName = "DELETE",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    LeadMasterService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            OpenModalProduct()
            $("#txtProductCode").val(Code);
        }
    });
}
function DeleteProductModal() {
    var reason = $("#deleteProductReason").val();
    var code = $("#txtProductCode").val();
    if (reason == "") {
        toastr.error('Please enter a reason before proceeding.');
        return;
    }
    LeadMasterService.DeleteEnquiryProductDetail(code, reason).then(function (response) {
        if (response[0].Status == 'Y') {
            toastr.success(response[0].Msg);
            GetEnquiryDetailsByCode($("#hfCode").val());
            $("#deleteProductReason").val('')
            $("#txtProductCode").val('');
            CloseModalProduct();
            ClearEnquiryProductField();
        } else {
            toastr.error(response[0].Msg);
        }
    });

}
function OpenModalProduct() {
    var myModal = new bootstrap.Modal(document.getElementById('ProductModal'));
    myModal.show();
}
function CloseModalProduct() {
    var myModalEl = document.getElementById('ProductModal');
    var modalInstance = bootstrap.Modal.getInstance(myModalEl);
    if (modalInstance) {
        modalInstance.hide();
    }
    $("#deleteProductReason").val('')
    $("#txtProductCode").val('');
}
function isEmail(email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
}
function IsMobileNumber(txtMobId) {
    var mob = /^[6-9]{1}[0-9]{9}$/;
    if (mob.test(txtMobId) == false) {
        return false;
    }
    return true;
}
function SaveLeadEnquiryOnChange() {
    const data = [{
        code: $('#hfCode').val() || 0,
        enquiryDate: $('#txtEnquiryDate').val(),
        referenceNo: $('#txtReference').val() || '',
        referenceDate: $('#txtReferenceDate').val(),
        customerFromMaster: '',
        accountMaster_Code: 0,
        accountDesp: $('input[name="customerType"]:checked').val() == 'New' ? $('#txtCompanyName').val() : $('#ddlCompanyName').val(),
        accountContactPersonDetail_Code: 0,
        accountDespManual: '',
        userID: G_UserMasterCode,
        marketingPersonMaster_Code: 0,
        personName: $('#ddlAssignSalesman').val(),
        customerName: '',
        address1: $('#txtAddressLine1').val(),
        address2: $('#txtAddressLine2').val(),
        city: $('#ddlCity').val() || '',
        pinCode: $('#txtPinCode').val(),
        state: $('#ddlState').val() || '',
        nation: $('#ddlCountry').val() || '',
        mobileNo: $('#txtContactNo').val(),
        faxNo: '',
        eMail: $('#txtEmail').val(),
        remark: $('#txtRemarks').val(),
        finYear: '',
        databaseLocation_Code: 0,
        deliveryDays: 0,
        verified: '',
        verifiedBy: 0,
        userVerifiedBy: '',
        verifiedOn: '',
        deliveryRemark: '',
        specification: '',
        status: 'I',
        isAttachmentExists: '',
        documentName: '',
        documentContent: '',
        customerType: $('#ddlCustomerType').val() || '',
        enquirytypeName: $('#ddlEnquiryType').val() || '',
        nextFollowupdate: $('#txtNextFollowupDate').val(),
        nextFollowupmode: $('#ddlNextFollowupMode').val() || '',
        leadSourceDespName: $('#ddlLeadSource').val() || '',
        referenceBy: '',
        website: $('#txtWebsite').val()
    }];
    LeadMasterService.SaveLeadEnquiryData(data).then(function (response) {
        if (response[0].Status === 'Y') {
            toastr.success(response[0].Msg || 'Lead enquiry saved successfully.');
            $('#hfCode').val(response[0].Code)
        } else {
            toastr.error(response[0].Msg || 'Save failed.');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'An error occurred while saving.');
    });
}
function VerifyEnquiry(Code) {
    var ModuleName = "Enquiry",
        OptionName = "VERIFY",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    LeadMasterService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            OpenVerifyModal()
            $("#txtEnquiryCode").val(Code);
        }
    });
}
function Verify() {
    var reason = $("#txtVerifyReason").val();
    var code = $("#txtEnquiryCode").val();
    if (reason == "") {
        toastr.error('Please enter a reason before proceeding.');
        return;
    }
    LeadMasterService.VerifyEnquiry(code, reason).then(function (response) {
        if (response[0].Status == 'Y') {
            toastr.success(response[0].Msg);
            GetLeadMasterList("All");
            $("#txtVerifyReason").val('')
            $("#txtEnquiryCode").val('');
            CloseVerifyModal();
        } else {
            toastr.error(response[0].Msg);
        }
    });
}
function Reject() {
    var reason = $("#txtVerifyReason").val();
    var code = $("#txtEnquiryCode").val();
    if (reason == "") {
        toastr.error('Please enter a reason before proceeding.');
        return;
    }
    LeadMasterService.RejectEnquiry(code, reason).then(function (response) {
        if (response[0].Status == 'Y') {
            toastr.success(response[0].Msg);
            GetLeadMasterList("All");
            $("#txtVerifyReason").val('')
            $("#txtEnquiryCode").val('');
            CloseVerifyModal();
        } else {
            toastr.error(response[0].Msg);
        }
    });
}
function OpenVerifyModal() {
    var myModal = new bootstrap.Modal(document.getElementById('VerifyModal'));
    myModal.show();
}
function CloseVerifyModal() {
    var myModalEl = document.getElementById('VerifyModal');
    var modalInstance = bootstrap.Modal.getInstance(myModalEl);
    if (modalInstance) {
        modalInstance.hide();
    }
    $("#txtVerifyReason").val('')
    $("#txtEnquiryCode").val('');
}
function AssignEnquiry(Code) {
            OpenAssignModal()
            $("#txtEnquiryAssignCode").val(Code);
};
function Assign() {
    var MarketingPersonMaster_Code = $("#ddlAssignTo").val();
    var code = $("#txtEnquiryAssignCode").val();
    if (MarketingPersonMaster_Code == "") {
        toastr.error('Please select assign to before proceeding.');
        return;
    }
    LeadMasterService.EnquiryAssign(code, MarketingPersonMaster_Code).then(function (response) {
        if (response.Status == 'Y') {
            toastr.success(response.Msg);
            GetLeadMasterList("All");
            SelectOptionByText('ddlAssignTo', "select");
            $("#txtEnquiryAssignCode").val('');
            CloseAssignModal();
        } else {
            toastr.error(response.Msg);
        }
    });
}
function OpenAssignModal() {
    var myModal = new bootstrap.Modal(document.getElementById('AssignModal'));
    myModal.show();
}
function CloseAssignModal() {
    var myModalEl = document.getElementById('AssignModal');
    var modalInstance = bootstrap.Modal.getInstance(myModalEl);
    if (modalInstance) {
        modalInstance.hide();
    }
}
function FollowUp(EnquiryMaster_Code) {
    $("#hfFollowUpEnquiryMaster_Code").val(EnquiryMaster_Code);
    $("#dvFollowup").show();
    $("#dvLoad").hide();
    Bind_ddlContactPersonDetail(EnquiryMaster_Code);
    LeadMasterService.GetEnquiryFollowUpList(EnquiryMaster_Code).then(function (response) {
        if (response.length > 0) {
            $("#tblFollowUp").show();
            $("#txtEnquiryNumber").val(response[0]["EnquiryNo"])
            $("#txtFollowupEnquiryDate").val(response[0]["EnquiryDate"])
            $("#txtFollowupCustomerName").val(response[0]["CompanyName"])
            const StringFilterColumn = ["CustomerRemarks", "OurRemarks"];
            const NumericFilterColumn = ["OverdueFollowupDays"];
            const DateFilterColumn = ["FollowUpDate","NextFollowUpDate"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "EnquiryMaster_Code","FollowupMode", "EnquiryContactPersonDetail_Code", "EnquiryDate", "EnquiryNo", "CompanyName","FollowupByName","CustomerContactPersonName","CustomerContactPhoneNumber","CustomerContactEmailID"]
            const ColumnAlignment = {
            };

            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit"  onclick="GetFollowupDetailsByCode(${item.Code},this)"><i class="fa fa-pencil"></i></button>
                <button class="btn btn-danger icon-height mb-1" title="Delete"  onclick="DeleteFollowUp(${item.Code})"><i class="fa fa-times"></i></button>
                <button class="btn btn-info icon-height mb-1" title="View"  onclick="ViewFollowUp(${item.Code})"><i class="fa fa-eye"></i></button>`;
                return {
                    ...item,
                    Action: buttonsHTML,
                };

            });
            BizsolCustomFilterGrid.CreateDataTable("FollowUp-header", "FollowUp-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        }
        else {
            toastr.error('No Data Found');
            $("#tblFollowUp").hide();
            BackMaster();
        }
    });
}
function CreateNewFollowUp(){
    $("#dvFollowTab1").hide();
    $("#dvFollowTab2").show();
}
function BackFollowUp() {
    DisabledTrueOrFalse(false);
    $("#dvFollowTab1").show();
    $("#dvFollowTab2").hide();
    FollowUp($("#hfFollowUpEnquiryMaster_Code").val());
    ClearFollowUpData();
}
function ClearFollowUpData() {
    $("#txtOurRemarks").val("");
    $("#hfFollowUpMaster_Code").val("0");
    $("#txtCustomerRemarks").val("");
    $("#ddlCustomerContactPersonName").val("");
    $("#txtFollowUpDateFollowUp").val("");
    $("#ddlFollowUpModeFollowUp").val("");
    $("#txtNextFollowUpDateFollowUp").val("");
    $("#ddlNextFollowUpModeFollowUp").val("");
    $("#chkFollowUpRequired").prop("checked", true);
    $("#dvNextFollowUpDateFollowUp").show();
    $("#dvNextFollowUpModeFollowUp").show();
}
function SaveEnquiryFollowUp() {
    var txtOurRemarks = $("#txtOurRemarks").val().trim();
    var txtCustomerRemarks = $("#txtCustomerRemarks").val();
    var ddlCustomerContactPersonName = $("#ddlCustomerContactPersonName").val().trim();
    var txtFollowUpDateFollowUp = $("#txtFollowUpDateFollowUp").val().trim();
    var ddlFollowUpModeFollowUp = $("#ddlFollowUpModeFollowUp").val().trim();
    var txtNextFollowUpDateFollowUp = $("#txtNextFollowUpDateFollowUp").val().trim();
    var ddlNextFollowUpModeFollowUp = $("#ddlNextFollowUpModeFollowUp").val().trim();

    if (txtOurRemarks === "") {
        toastr.error("Please enter our remark.");
        $("#txtOurRemarks").focus();
        return;
    }
    if (txtCustomerRemarks === "") {
        toastr.error("Please enter customer remark.");
        $("#txtCustomerRemarks").focus();
        return;
    }
    if (ddlCustomerContactPersonName === "") {
        toastr.error("Please select customer contact Person Name.");
        $("#ddlCustomerContactPersonName").focus();
        return;
    }
    if (txtFollowUpDateFollowUp === "") {
        toastr.error("Please select follow up date.");
        $("#txtFollowUpDateFollowUp").focus();
        return;
    }
    if (ddlFollowUpModeFollowUp === "") {
        toastr.error("Please select follow up mode.");
        $("#ddlFollowUpModeFollowUp").focus();
        return;
    }
    if ($("#chkFollowUpRequired").is(":checked")) {
        if (txtNextFollowUpDateFollowUp === "") {
            toastr.error("Please select next follow up date.");
            $("#txtNextFollowUpDateFollowUp").focus();
            return;
        }
        if (ddlNextFollowUpModeFollowUp === "") {
            toastr.error("Please select next follow up mode.");
            $("#ddlNextFollowUpModeFollowUp").focus();
            return;
        }
    }
    
    var followUpData = {
        enquiryFollowUpList: [
            {
                code: parseInt($("#hfFollowUpMaster_Code").val()),
                enquiryMaster_Code: parseInt($("#hfFollowUpEnquiryMaster_Code").val()),
                enquiryContactPersonDetail_Code: 0,
                marketingPersonMaster_Code: 0,
                enquiryNo:"",
                followupDate: $("#txtFollowUpDateFollowUp").val(),
                followupMode: $("#ddlFollowUpModeFollowUp").val(),
                nextFollowupDate: $("#txtNextFollowUpDateFollowUp").val() ,
                nextFollowupMode: $("#ddlNextFollowUpModeFollowUp").val(),
                lastFollowupDate: null,
                followupByName: '',
                customerContactPersonName: $("#ddlCustomerContactPersonName").val(),
                customerContactPhoneNumber: "",
                customerContactEmailID: "",
                ourRemarks: $("#txtOurRemarks").val(),
                customerRemarks: $("#txtCustomerRemarks").val(),
                overdueFollowupDays: 0,
                companyName: '',
                enquiryDate: null
            }
        ]
    };
    LeadMasterService.SaveEnquiryFollowUp(followUpData).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg || 'Lead enquiry saved successfully.');
            BackFollowUp();
        } else {
            toastr.error(response.Msg || 'Save failed.');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'An error occurred while saving.');
    });
    
}

async function GetFollowupDetailsByCode(Code) {
    $("#dvFollowTab1").hide();
    $("#dvFollowTab2").show();
    try {
        const resObj = await LeadMasterService.GetEnquiryFollowUpByCode(Code);
        if (resObj != undefined && resObj != null) {
            $("#hfFollowUpMaster_Code").val(resObj.Code);
            $("#txtOurRemarks").val(resObj["OurRemarks"]);
            $("#txtCustomerRemarks").val(resObj["CustomerRemarks"]);
            $("#ddlCustomerContactPersonName").val(resObj["CustomerContactPersonName"]);
            $("#txtFollowUpDateFollowUp").val(resObj["FollowupDate"]);
            $("#ddlFollowUpModeFollowUp").val(resObj["FollowupMode"]);
            if (resObj["NextFollowupMode"] == '' || resObj["NextFollowupMode"] == null) {
                $("#chkFollowUpRequired").prop("checked", false);
                    $("#dvNextFollowUpDateFollowUp").hide();
                    $("#dvNextFollowUpModeFollowUp").hide();
            } else {
                $("#chkFollowUpRequired").prop("checked", true);
                $("#dvNextFollowUpDateFollowUp").show();
                $("#dvNextFollowUpModeFollowUp").show();
                $("#txtNextFollowUpDateFollowUp").val(resObj["NextFollowupDate"]);
                $("#ddlNextFollowUpModeFollowUp").val(resObj["NextFollowupMode"]);
            }
            
        }
    } catch (error) {
        toastr.error(error.Msg || 'An error occurred while fetching Contact Person Details');
    }
}
function DeleteFollowUp(Code) {
    var ModuleName = "Enquiry",
        OptionName = "DELETE",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
        LeadMasterService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            OpenFollowUpModal();
            $("#txtFollowUpMasterCode").val(Code);
        }
    });
}
function DeleteFollowModal() {
    var reason = $("#txtFollowUpReason").val();
    var code = $("#txtFollowUpMasterCode").val();
    if (reason == "") {
        toastr.error('Please enter a reason before proceeding.');
        return;
    }
    LeadMasterService.DeleteEnquiryFollowUp(code, reason).then(function (response) {
        if (response.Status == 'Y') {
            toastr.success(response.Msg);
            FollowUp($("#hfFollowUpEnquiryMaster_Code").val());
            $("#txtFollowUpReason").val('')
            $("#txtFollowUpMasterCode").val('');
            CloseFollowUpModal();
        } else {
            toastr.error(response.Msg);
        }
    });

}
function OpenFollowUpModal() {
    var myModal = new bootstrap.Modal(document.getElementById('FollowUpModal'));
    myModal.show();
}
function CloseFollowUpModal() {
    var myModalEl = document.getElementById('FollowUpModal');
    var modalInstance = bootstrap.Modal.getInstance(myModalEl);
    if (modalInstance) {
        modalInstance.hide();
    }
    $("#txtFollowUpReason").val('')
    $("#txtFollowUpMasterCode").val('');
}

async function ViewFollowUp(Code) {
    $("#dvFollowTab1").hide();
    $("#dvFollowTab2").show();
    try {
        const resObj = await LeadMasterService.GetEnquiryFollowUpByCode(Code);
        if (resObj != undefined && resObj != null) {
            $("#hfFollowUpMaster_Code").val(resObj.Code);
            $("#txtOurRemarks").val(resObj["OurRemarks"]);
            $("#txtCustomerRemarks").val(resObj["CustomerRemarks"]);
            $("#ddlCustomerContactPersonName").val(resObj["CustomerContactPersonName"]);
            $("#txtFollowUpDateFollowUp").val(resObj["FollowupDate"]);
            $("#ddlFollowUpModeFollowUp").val(resObj["FollowupMode"]);
            if (resObj["NextFollowupMode"] == '' || resObj["NextFollowupMode"] == null) {
                $("#chkFollowUpRequired").prop("checked", false);
                $("#dvNextFollowUpDateFollowUp").hide();
                $("#dvNextFollowUpModeFollowUp").hide();
            } else {
                $("#chkFollowUpRequired").prop("checked", true);
                $("#dvNextFollowUpDateFollowUp").show();
                $("#dvNextFollowUpModeFollowUp").show();
                $("#txtNextFollowUpDateFollowUp").val(resObj["NextFollowupDate"]);
                $("#ddlNextFollowUpModeFollowUp").val(resObj["NextFollowupMode"]);
            }
            DisabledTrueOrFalse(true);
        }
    } catch (error) {
        toastr.error(error.Msg || 'An error occurred while fetching Contact Person Details');
    }
}
function DisabledTrueOrFalse(Type) {
    $("#txtOurRemarks").prop("disabled", Type);
    $("#txtCustomerRemarks").prop("disabled", Type);
    $("#ddlCustomerContactPersonName").prop("disabled", Type);
    $("#txtFollowUpDateFollowUp").prop("disabled", Type);
    $("#ddlFollowUpModeFollowUp").prop("disabled", Type);
    $("#txtNextFollowUpDateFollowUp").prop("disabled", Type);
    $("#ddlNextFollowUpModeFollowUp").prop("disabled", Type);
    $("#chkFollowUpRequired").prop("disabled", Type);
    $("#btnFollowUpSave").prop("disabled", Type);
}
function OpenContactPersonModal() {
    var myModal = new bootstrap.Modal(document.getElementById('ContactPersonModal'));
    myModal.show();
}
function CloseContactPersonModal() {
    var myModalEl = document.getElementById('ContactPersonModal');
    var modalInstance = bootstrap.Modal.getInstance(myModalEl);
    if (modalInstance) {
        modalInstance.hide();
    }
    ClearModalContactPersonField();
}
function ClearModalContactPersonField() {
    $("#txtModalName").val("");
    $("#txtModalPersonContactNo").val("");
    $("#txtModalEmailId").val("");
    SelectOptionByText('ddlModalDesignation', "select");
    SelectOptionByText('ddlModalDepartment', "select");
}
function SaveModalContactPersonDetails() {
    let payload = [{
        code: 0,
        enquiryMaster_Code: $("#hfFollowUpEnquiryMaster_Code").val() || 0,
        contactPersonName: $("#txtModalName").val().trim(),
        contactPersonMobile: $("#txtModalPersonContactNo").val().trim(),
        contactPersonEMail: $("#txtModalEmailId").val().trim(),
        contactPersonExt: "",
        contactPersonDesignation: $("#ddlModalDesignation").val() || "",
        departmentName: $("#ddlModalDepartment").val() || "",
        emailInInvoiceCopy: ""
    }];
    if (!payload[0].contactPersonName) {
        toastr.error("Please enter contact person name.");
        $("#txtModalName").focus();
        return;
    }
    if (!payload[0].departmentName) {
        toastr.error("Please select department.");
        $("#ddlModalDepartment").focus();
        return;
    }
    if (!payload[0].contactPersonDesignation) {
        toastr.error("Please select designation.");
        $("#ddlModalDesignation").focus();
        return;
    }
    if (!payload[0].contactPersonEMail) {
        toastr.error("Please enter contact person email.");
        $("#txtModalEmailId").focus();
        return;
    }
    if (!isEmail(payload[0].contactPersonEMail)) {
        toastr.error("Please enter valid contact person email.");
        $("#txtModalEmailId").focus();
        return;
    }
    if (!payload[0].contactPersonMobile) {
        toastr.error("Please enter contact person mobile number.");
        $("#txtModalPersonContactNo").focus();
        return;
    }
    if (!IsMobileNumber(payload[0].contactPersonMobile)) {
        toastr.error("Please enter valid contact person mobile number.");
        $("#txtModalPersonContactNo").focus();
        return;
    }
    LeadMasterService.SaveContactPersonDetails(payload)
        .then(function (response) {
            if (response && response[0].Status === 'Y') {
                toastr.success(response[0].Msg || "Contact person details saved successfully.");
                ClearModalContactPersonField();
                CloseContactPersonModal();
                Bind_ddlContactPersonDetail($("#hfFollowUpEnquiryMaster_Code").val());
            } else {
                toastr.error(response[0].Msg || "Save failed for contact person details.");
            }
        }).catch(function (error) {
            toastr.error(error.Msg || "An error occurred while saving contact person details.");
        });
}

window.Delete = Delete;
window.Verify = Verify;
window.Reject = Reject;
window.Assign = Assign;
window.CreateNewFollowUp = CreateNewFollowUp;
window.ClearFollowUpData = ClearFollowUpData;
window.CloseFollowUpModal = CloseFollowUpModal;
window.DeleteFollowUp = DeleteFollowUp;
window.DeleteFollowModal = DeleteFollowModal;
window.BackFollowUp = BackFollowUp;
window.FollowUp = FollowUp;
window.ViewFollowUp = ViewFollowUp;
window.VerifyEnquiry = VerifyEnquiry;
window.CloseModal = CloseModal;
window.AssignEnquiry = AssignEnquiry;
window.AssignEnquiry = AssignEnquiry;
window.CloseAssignModal = CloseAssignModal;
window.CloseVerifyModal = CloseVerifyModal;
window.DeleteModal = DeleteModal;
window.DeleteProductModal = DeleteProductModal;
window.DeleteProductDetail = DeleteProductDetail;
window.CloseModalProduct = CloseModalProduct;
window.CloseModalContactPerson = CloseModalContactPerson;
window.GetFollowupDetailsByCode = GetFollowupDetailsByCode;
window.DeleteContactPersonModal = DeleteContactPersonModal;
window.DeleteContactPerson = DeleteContactPerson;
window.SaveEnquiryFollowUp = SaveEnquiryFollowUp;
window.SaveEnquiryProductDetails = SaveEnquiryProductDetails;
window.SaveContactPersonDetails = SaveContactPersonDetails;
window.GetProductDetailsByCode = GetProductDetailsByCode;
window.GetContactPersonDetailsByCode = GetContactPersonDetailsByCode;
window.HideShowTab = HideShowTab;
window.CreateNew = CreateNew;
window.BackMaster = BackMaster;
window.SaveLeadEnquiryData = SaveLeadEnquiryData;
window.OpenContactPersonModal = OpenContactPersonModal;
window.GetEnquiryDetailsByCode = GetEnquiryDetailsByCode;
window.CloseContactPersonModal = CloseContactPersonModal;
window.SaveModalContactPersonDetails = SaveModalContactPersonDetails;