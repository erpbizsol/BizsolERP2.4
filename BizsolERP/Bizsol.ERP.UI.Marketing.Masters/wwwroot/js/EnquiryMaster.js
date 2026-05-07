import { LeadMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_LeadMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');
var UserDetails = JSON.parse(sessionStorage.getItem('UserDetails'));
var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
var G_UserMasterCode = authKeyData.UserMaster_Code;
var G_UserType = UserDetails[0].UserType;
var G_UserName = UserDetails[0].UserName;
let G_originalData = [];
let G_ItemMasterList = [];
let G_UOMMasterList = [];
let G_CompanyNation = "";
let G_Status = "";
var ENQUIRY_FILTER_SS_KEY_SP = "EnquiryMaster_ddlSalesPerson";
var ENQUIRY_FILTER_SS_KEY_ST = "EnquiryMaster_ddlStatus";
var ENQUIRY_FILTER_SS_KEY_LT = "EnquiryMaster_ddlLeadType";
function saveEnquiryListFilters() {
    try {
        var sp = $("#ddlSalesPerson").val();
        var st = $("#ddlStatus").val();
        var lt = $("#ddlfilterLeadType").val();
        if (sp != null && sp !== "") sessionStorage.setItem(ENQUIRY_FILTER_SS_KEY_SP, sp);
        if (st != null && st !== "") sessionStorage.setItem(ENQUIRY_FILTER_SS_KEY_ST, st);
        if (lt != null) sessionStorage.setItem(ENQUIRY_FILTER_SS_KEY_LT, lt);
    } catch (e) { /* ignore quota / private mode */ }
}
function restoreEnquirySalesPersonSelect() {
    try {
        var saved = sessionStorage.getItem(ENQUIRY_FILTER_SS_KEY_SP);
        if (!saved) return;
        var $sel = $("#ddlSalesPerson");
        var $match = $sel.find("option").filter(function () { return this.value === saved; });
        if ($match.length) {
            $sel.val(saved);
        }
    } catch (e) { /* ignore */ }
}
function restoreEnquiryStatusInput() {
    try {
        var saved = sessionStorage.getItem(ENQUIRY_FILTER_SS_KEY_ST);
        if (saved != null && saved !== "") {
            $("#ddlStatus").val(saved);
        }
    } catch (e) { /* ignore */ }
}
function restoreEnquiryLeadTypeSelect() {
    try {
        var saved = sessionStorage.getItem(ENQUIRY_FILTER_SS_KEY_LT);
        if (saved != null) {
            $("#ddlfilterLeadType").val(saved);
        }
    } catch (e) { /* ignore */ }
}
/** Select2 breaks when #dvLoad is display:none (wrong coordinates / label in header). Tear down while hidden; rebuild when list is shown. */
function detachSalesPersonSelect2() {
    var $el = $("#ddlSalesPerson");
    if (!$el.length) return;
    $el.off("select2:opening select2:open select2:close");
    if ($el.data("select2")) {
        try {
            $el.select2("close");
        } catch (e) { /* ignore */ }
        try {
            $el.select2("destroy");
        } catch (e) { /* ignore */ }
    }
}
function rebindSalesPersonSelect2() {
    var $el = $("#ddlSalesPerson");
    if (!$el.length || !$el.is("select")) return;
    var saved = $el.val();
    detachSalesPersonSelect2();
    $el.select2({
        width: "100%"
    });
    BizSolHelperFunction.attachSelect2ScrollPrevention($el);
    if (saved != null && saved !== "") {
        $el.val(saved);
    }
    if (G_UserType == "A") {
        $el.prop("disabled", false);
    } else {
        $el.prop("disabled", true);
    }
}
/** After BizsolCustomFilterGrid redraws the table, layout reflow can leave Select2's widget at wrong coordinates (floating near page header). Re-init after paint. */
function scheduleSalesPersonSelect2LayoutFix() {
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            if (!$("#dvLoad").is(":visible")) return;
            rebindSalesPersonSelect2();
        });
    });
}
$(document).ready(function () {
    GetDepartmentlist();
    GetCompanyParameter();

    $("#ERPHeading").text("Enquiry Master");
    $('#btnSubmit').click(function (e) {
        SaveData();
    });

    // Load Status list, Lead Status list and saved Config in parallel,
    // then populate dropdowns and apply the saved default values.
    Promise.all([
        LeadMasterService.GetStatuslist().catch(function () { return []; }),
        LeadMasterService.GetLeadStatuslist().catch(function () { return []; }),
        LeadMasterService.GetEnquiryMasterConfig().catch(function () { return null; })
    ]).then(function (results) {
        var statusList  = results[0] || [];
        var leadList    = results[1] || [];
        var config      = results[2];

        // ── Populate #ddlStatus ────────────────────────────────────────────
        var statusOption = '<option value="All">All</option>';
        for (var i = 0; i < statusList.length; i++) {
            statusOption += '<option value="' + statusList[i].Desp + '">' + statusList[i].Desp + '</option>';
        }
        $('#ddlStatus').empty().append(statusOption);

        // ── Populate #ddlfilterLeadType & #ddlLeadStatus ──────────────────
        var leadOption = '<option value="">All</option>';
        $.each(leadList, function (key, val) {
            leadOption += '<option value="' + val.Value + '">' + val.Value + '</option>';
        });
        $('#ddlLeadStatus').empty().append(leadOption);
        $('#ddlfilterLeadType').empty().append(leadOption);

        // ── Normalise config (handles array or object response) ───────────
        var rawCfg = {};
        if (Array.isArray(config) && config.length > 0) rawCfg = config[0];
        else if (config && typeof config === 'object') rawCfg = config;

        function cfgVal(key) {
            if (!rawCfg) return '';
            var lk = key.toLowerCase();
            var found = Object.keys(rawCfg).find(function (k) { return k.toLowerCase() === lk; });
            return found ? (rawCfg[found] || '') : '';
        }

        var defaultStatus   = cfgVal('defaultStatus').trim();
        var defaultLeadType = cfgVal('defaultLeadType').trim();

        // ── Apply config → #ddlStatus ─────────────────────────────────────
        if (defaultStatus && $('#ddlStatus option').filter(function () { return $(this).val() === defaultStatus; }).length) {
            $('#ddlStatus').val(defaultStatus);
        } else {
            restoreEnquiryStatusInput();
        }

        // ── Apply config → #ddlfilterLeadType ────────────────────────────
        if (defaultLeadType && $('#ddlfilterLeadType option').filter(function () { return $(this).val() === defaultLeadType; }).length) {
            $('#ddlfilterLeadType').val(defaultLeadType);
        } else {
            restoreEnquiryLeadTypeSelect();
        }

        GetNestedMarketingManList();
    }).catch(function () {
        Bind_ddlLeadStatus();
        GetStatuslist();
        GetNestedMarketingManList();
    });
    if (G_UserType == 'A') {
        $("#ddlSalesPerson").prop("disabled",false)
    } else {
        $("#ddlSalesPerson").prop("disabled", true)
    }
    $("#ddlSalesPerson").change(function () {
        saveEnquiryListFilters();
        var SalesPerson = $(this).val();
        if (G_originalData && G_originalData.length > 0) {
            const filteredData = filterEnquiryListBySalesAndStatus(G_originalData, SalesPerson, $("#ddlStatus").val(), $("#ddlfilterLeadType").val());
            renderEnquiryListGridFromFilteredData(filteredData);
        } else {
            GetLeadMasterList(SalesPerson);
        }
    });
    $("#ddlStatus").change(function () {
        saveEnquiryListFilters();
        var SalesPerson = $("#ddlSalesPerson").val();
        var Status = $("#ddlStatus").val();
        if (!G_originalData || G_originalData.length === 0) {
            return;
        }
        const filteredData = filterEnquiryListBySalesAndStatus(G_originalData, SalesPerson, Status, $("#ddlfilterLeadType").val());
        renderEnquiryListGridFromFilteredData(filteredData);
    });
    $("#ddlfilterLeadType").change(function () {
        saveEnquiryListFilters();
        var SalesPerson = $("#ddlSalesPerson").val();
        var Status = $("#ddlStatus").val();
        var LeadType = $(this).val();
        if (!G_originalData || G_originalData.length === 0) {
            return;
        }
        const filteredData = filterEnquiryListBySalesAndStatus(G_originalData, SalesPerson, Status, LeadType);
        renderEnquiryListGridFromFilteredData(filteredData);
    });
    Bind_ddlCustomer();
    //Bind_ddlCustomerType();
    Bind_ddlEnquiryType();
    Bind_ddlCountry();
    Bind_ddlLeadSource();
    //Bind_ddlDepartment();
    //Bind_ddlDesignation();
    //Bind_ddlUOM();
    //Bind_ddlItemMaster();
    $("#ddlProductName").change(function () {
        var Code = $(this).val()
        if (Code != '') {
            var filteredData = G_ItemMasterList.filter(item => item.ItemName == Code);
            var UOMData = G_UOMMasterList.filter(item => item.UOM == filteredData[0]["UOM"]);
            $("#ddlUOM").val(UOMData[0].UOM).trigger('change');
            Bind_ddlItemSizeMaster(Code);
        }
    })
        ;
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
            $("#ddlEnquiryType").focus();
        }
    });
    
    $('#txtCompanyName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlEnquiryType").focus();
        }
    });
    
    $('#ddlEnquiryType').on('keydown', function (e) {
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
            $("#txtMobileNo").focus();
        }
    });
    
    $('#txtMobileNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtEnquiryDate").focus();
        }
    });
    
    $('#txtWebsite').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtReference").focus();
        }
    });
    
    $('#txtEnquiryDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlLeadSource").focus();
        }
    });
    
    $('#ddlLeadSource').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtWebsite").focus();
        }
    });
    
    $('#txtReference').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtReferenceDate").focus();
        }
    });
    
    $('#txtReferenceDate').on('keydown', function (e) {
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
            $("#txtPinCode").focus();
        }
    });
    
    $('#txtPinCode').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtAttachment").focus();
        }
    });
    
    $('#ddlAssignSalesman').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtNextFollowupDate").focus();
        }
    });
    
    $('#txtAttachment').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtRemarks").focus();
        }
    });

    // Ensure only one default contact checkbox is selected at a time
    $(document).on('change', '.cp-default', function () {
        // Uncheck all others
        $('.cp-default').not(this).prop('checked', false);

        // If user tries to uncheck the last one, keep it checked (always at least one)
        if (!$('.cp-default:checked').length) {
            $(this).prop('checked', true);
        }

        UpdateDefaultContactSummary();
    });
    
    $('#txtNextFollowupDate').change(function () {
        var v = $(this).val();
        if (IsDateBeforeToday(v)) {
            var d = new Date();
            var yyyy = d.getFullYear();
            var mm = ("0" + (d.getMonth() + 1)).slice(-2);
            var dd = ("0" + d.getDate()).slice(-2);
            $(this).val(yyyy + '-' + mm + '-' + dd);
            toastr.error('Next Followup Date cannot be a past date. Reset to today.');
            $(this).focus();
        }
    });

    $('#txtNextFollowUpDateFollowUp').off('change').on('change', function () {
        var v = $(this).val();
        if (IsDateBeforeToday(v)) {
            // Respect min attribute instead of hard reset
            var min = $(this).attr('min');
            $(this).val(min || '');
            toastr.error('Next Followup Date cannot be a past date.');
            $(this).focus();
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
    
    $('#txtRemarks').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#btnSubmit").focus();
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
    try { SetTodayEnquiryDate(); } catch (e) {}
    try { SetMaxDateToToday(); } catch (e) {}
    try { SetMinNextFollowupDateToToday(); } catch (e) {}
    try {
        if (!document.getElementById('txtManualVehicleNoList')) {
            $('body').append("<ul id='txtManualVehicleNoList' class='AutoSuggestion-list'></ul>");
        }
    } catch (e) { }
    $(document).on('keyup input paste', '.Phone', function (e) {
        var originalValue = this.value;
        this.value = this.value.replace(/[^0-9]/g, '');
        if (originalValue !== this.value) {
            $(this).trigger('change');
        }
    });
    
    $(document).on('keyup input paste', '.Quantity', function (e) {
        var originalValue = this.value;
        this.value = this.value.replace(/[^0-9\.]/g, '');
        // Prevent multiple decimal points
        if (this.value.split(".").length > 2) this.value = this.value.replace(/\.+?$/, '');
        if (this.value.split(".").length > 2) this.value = this.value.replace(this.value, '');
        // Handle leading decimal
        if (this.value.charAt(0) == ".") this.value = this.value.replace(this.value, '0' + this.value);
        if (originalValue !== this.value) {
            // Trigger change event if value was modified
            $(this).trigger('change');
        }
    });
    
    $('#txtContactNo, #txtMobileNo').addClass('Phone');
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
});
function SetTodayEnquiryDate() {
    var $el = $('#txtEnquiryDate');
    if ($el.length && !$el.val()) {
        var d = new Date();
        var yyyy = d.getFullYear();
        var mm = ("0" + (d.getMonth() + 1)).slice(-2);
        var dd = ("0" + d.getDate()).slice(-2);
        $el.val(yyyy + '-' + mm + '-' + dd);
    }
}
function SetTodayFollowUpDateFollowUp() {
    var $el = $('#txtFollowUpDateFollowUp');
    if ($el.length && !$el.val()) {
        var d = new Date();
        var yyyy = d.getFullYear();
        var mm = ("0" + (d.getMonth() + 1)).slice(-2);
        var dd = ("0" + d.getDate()).slice(-2);
        $el.val(yyyy + '-' + mm + '-' + dd);
    }
}
function SetMaxDateToToday() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = ("0" + (d.getMonth() + 1)).slice(-2);
    var dd = ("0" + d.getDate()).slice(-2);
    var todayStr = yyyy + '-' + mm + '-' + dd;
    $('#txtEnquiryDate').attr('max', todayStr);
}
function SetMinNextFollowupDateToToday() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = ("0" + (d.getMonth() + 1)).slice(-2);
    var dd = ("0" + d.getDate()).slice(-2);
    var todayStr = yyyy + '-' + mm + '-' + dd;
    $('#txtNextFollowupDate').attr('min', todayStr);
    $('#txtNextFollowUpDateFollowUp').attr('min', todayStr);
}
function IsInvalidDate(dateValue) {
    if (!dateValue || dateValue === null || dateValue === undefined || dateValue === '') {
        return true;
    }
    var dateStr = dateValue.toString().trim();
    if (dateStr === '' || dateStr === 'null' || dateStr === 'undefined') {
        return true;
    }
    if (dateStr.indexOf('1900') !== -1 || dateStr.indexOf('01-Jan-1900') !== -1 || dateStr.indexOf('1900-01-01') !== -1) {
        return true;
    }
    if (/^0?1[-/]Jan[-/]1900$/i.test(dateStr) || /^Jan[-/]0?1[-/]1900$/i.test(dateStr)) {
        return true;
    }
    var date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        return true;
    }
    var year = date.getFullYear();
    if (year === 1900 || year < 1900) {
        return true;
    }
    return false;
}
function IsDateBeforeToday(dateStr) {
    if (!dateStr) return false;
    try {
        var parts = dateStr.split('-');
        if (parts.length !== 3) return false;
        var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        return d.getTime() < today.getTime();
    } catch (e) { return false; }
}
function toggleCompanyNameField() {
    var selectedValue = $('input[name="customerType"]:checked').val();
    if (selectedValue === 'Existing') {
        $('#ddlCompanyName').next('.select2-container').show();
        $('#txtCompanyName').hide();
        ClearData();
    } else {
        SelectOptionByText('ddlCompanyName', "Select");
        $('#ddlCompanyName').next('.select2-container').hide();
        $('#txtCompanyName').show();
        ClearData();
    }
}

$('input[name="customerType"]').change(function () {
    toggleCompanyNameField();
});

$('#ddlCompanyName, #ddlEnquiryType, #ddlCountry, #ddlState, #ddlCity,#txtEnquiryDate, #ddlLeadSource, #txtReferenceDate')
    .change(function () {
        if ($(this).val() != '') {
            SaveLeadEnquiryOnChange();
        }
    });
$('#txtCompanyName, #txtPinCode, #txtEmail, #txtContactNo,#txtMobileNo, #txtWebsite, #txtAddressLine1, #txtAddressLine2, #txtReference, #txtRemarks')
    .on("keypress", function (e) {
        if (e.which === 13) {
            e.preventDefault();
            if ($(this).val() != '') {
                SaveLeadEnquiryOnChange();
            }
        }
    });

$('#txtCompanyName, #txtPinCode, #txtEmail, #txtContactNo,#txtMobileNo, #txtWebsite, #txtAddressLine1, #txtAddressLine2, #txtReference, #txtRemarks')
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
                width: '100%'
            });
            BizSolHelperFunction.attachSelect2ScrollPrevention($('#ddlSalesPerson'));
            restoreEnquirySalesPersonSelect();
            BindSelectList($('#ddlAssignSalesman')[0], response.map((item) => ({ Code: item.PersonName, Desp: item.PersonName })));
            $('#ddlAssignSalesman').select2({
                width: '-webkit-fill-available'
            });
            BizSolHelperFunction.attachSelect2ScrollPrevention($('#ddlAssignSalesman'));
            BindSelectList($('#ddlAssignTo')[0], response.map((item) => ({ Code: item.Code, Desp: item.PersonName })));
            $('#ddlAssignTo').select2({
                width: '-webkit-fill-available',
                dropdownParent: $('#AssignModal')
            });
            BizSolHelperFunction.attachSelect2ScrollPrevention($('#ddlAssignTo'));
            $("#ddlSalesPerson").trigger("change");
        } else {
            GetLeadMasterList($("#ddlSalesPerson").val());
        }
    });
}
function GetStatuslist() {
    return LeadMasterService.GetStatuslist().then(function (response) {
        $('#ddlStatus').empty();
        var option = '<option value="All">All</option>';
        for (var i = 0; i < response.length; i++) {
            option += '<option value="' + response[i].Desp + '">' + response[i].Desp + '</option>';
        }
        $('#ddlStatus')[0].innerHTML = option;
        //restoreEnquiryStatusInput();
    });
}
function filterEnquiryListBySalesAndStatus(data, salesPerson, status, leadType) {
    if (!data || !data.length) return [];
    const sp = String(salesPerson ?? "all").toLowerCase();
    const st = String(status ?? "all").toLowerCase();
    const lt = String(leadType ?? "").toLowerCase();
    if (sp === "all" && st === "all" && (lt === "" || lt === "all")) {
        return data.slice();
    }
    return data.filter(item => {
        const salesMatch = sp === "all"
            || item["Sales Person"]?.toLowerCase() === sp;
        const statusMatch = st === "all"
            || item["Status"]?.toLowerCase() === st;
        const leadMatch = (lt === "" || lt === "all")
            || item["Lead Type"]?.toLowerCase() === lt;
        return salesMatch && statusMatch && leadMatch;
    });
}
function mapEnquiryItemToGridRow(item) {
    const isDraft = item.Status === 'Draft';
    const isRejected = item.Status === 'Rejected';
    const isVerified = item.Verified === 'Y' || item.Status === 'Draft';
    const isUnverified = item.Verified === 'N';

    const followUpBtn = isUnverified ? '' : `<button class="btn btn-info icon-height mb-1" title="Follow Up" onclick="FollowUp(${item.Code})" ${isRejected ? 'disabled' : ''}><i class="fa-solid fa-user-plus"></i></button>&nbsp;`;
    const editBtn = `<button class="btn btn-warning icon-height mb-1" title="Edit" onclick="GetEnquiryDetailsByCode(${item.Code},this)" ${isRejected ? 'disabled' : ''}><i class="fa fa-pencil"></i></button>&nbsp;<button class="btn btn-info icon-height mb-1" title="View" onclick="GetEnquiryDetailsForViewByCode(${item.Code})"><i class="fa fa-eye"></i></button>&nbsp;`;

    const verifyBtn = isVerified ? '' : `<li style="padding:1px;"><input type="button" style="width:100%;height:30px;" value="Verify" class="btn btn-success mb-1 btn-height" title="Verify" onclick="VerifyEnquiry(${item.Code})" ${isRejected ? 'disabled' : ''}></li>`;
    const assignBtn = isDraft ? '' : `<li style="padding:1px;"><input type="button" style="width:100%;height:30px;" value="Assign" class="btn btn-info mb-1 btn-height" title="Assign" onclick="AssignEnquiry(${item.Code})" ${isRejected ? 'disabled' : ''}></li>`;
    const deleteBtn = `<li style="padding:1px;"><input type="button" style="width:100%;height:30px;" value="Delete" class="btn btn-danger mb-1 btn-height" title="Delete" onclick="Delete(${item.Code})" ${isRejected ? 'disabled' : ''}></li>`;

    const dropdown = `
        <div class="btn-group">
            <button type="button" class="btn btn-primary icon-height dropdown-toggle" data-bs-toggle="dropdown" ${isRejected ? 'disabled' : ''}>
                ...
            </button>
            <ul class="dropdown-menu p-1">
                ${verifyBtn}
                ${assignBtn}
                ${deleteBtn}
            </ul>
        </div>&nbsp;
    `;
    const whatsappbtn = `<button class="btn btn-success icon-height mb-1" title="WhatsApp" onclick="WhatsApp(${item.Code})"><i class="fab fa-whatsapp"></i></button>&nbsp;`;

    var updatedItem = {
        ...item,
        Action: `<div class="enq-action-wrap">${followUpBtn + editBtn + whatsappbtn + dropdown}</div>`,
    };

    if (item["Next FollowUp Date"] !== undefined && IsInvalidDate(item["Next FollowUp Date"])) {
        updatedItem["Next FollowUp Date"] = "";
    }
    if (item["Next Followup Date"] !== undefined && IsInvalidDate(item["Next Followup Date"])) {
        updatedItem["Next Followup Date"] = "";
    }

    return updatedItem;
}
function renderEnquiryListGridFromFilteredData(filteredData) {
    const StringFilterColumn = ["Person Name", "Company Name", "City", "Sales Person", "Contact No", "Status", "Lead Type"];
    const NumericFilterColumn = [];
    const DateFilterColumn = ["Followup Date",];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = ["Followup Date", "Lead Date", "Lead Source", "Code", "ReferenceNo", "ReferenceDate", "PinCode", "CustomerFromMaster", "AccountContactPersonDetail", "UserID", "MarketingPersonMaster_Code", "Address1", "Address2", "Nation", "PhoneNo", "MobileNo", "FaxNo", "EMail", "Remark", "FinYear", "DeliveryDays", "VerifiedBy", "UserVerifiedBy", "VerifiedOn", "DeliveryRemark", "Specification", "CustomerType", "EnquiryType_Code", "EnquiryTypeName", "SortOrder", "FollowupMode", "LeadSourceMaster_Code", "LeadSourceDespName", "ReferenceBy", "Website", "CurrencyMaster_Code", "Currency", "ConversionRate", "FreightPerKG", "ContactPersonFromMaster", "ContactPersonName", "TestingGroupMaster_Code", "TestingGroup", "EnquiryToVendor", "EnquiryToVendorVerify", "PriceToVendorRemark", "ReasonForReject", "Enquiry No", "State"];
    const ColumnAlignment = {
        Action: 'center'
    };

    if (!filteredData || filteredData.length === 0) {
        $("#table-body").html("<tr><td colspan='10' style='text-align:center;'>No matching records found</td></tr>");
        scheduleSalesPersonSelect2LayoutFix();
        return;
    }
    const updatedResponse = filteredData.map(mapEnquiryItemToGridRow);
    BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
    setTimeout(function () {
        applyEnquiryListOverdueNextFollowUpRowHighlight();
    }, 100);
    scheduleSalesPersonSelect2LayoutFix();
}
function GetLeadMasterList(SalesPerson) {
    LeadMasterService.GetLeadMasterList(SalesPerson).then(function (response) {
        $("#table").show();
        if (response.length > 0) {
            G_originalData = response;
            const filteredData = filterEnquiryListBySalesAndStatus(G_originalData, $("#ddlSalesPerson").val(), $("#ddlStatus").val(), $("#ddlfilterLeadType").val());
            renderEnquiryListGridFromFilteredData(filteredData);
        }
        else {
            G_originalData = [];
            toastr.error('No Data Found');
            $("#table").hide();
        }
    });
}
function BackMaster() {
    $("#dvLoad").show();
    rebindSalesPersonSelect2();
    $("#dvEnquiry").hide();
    $('input[name="customerType"]').eq(0).prop('disabled', false);
    $('input[name="customerType"]').eq(0).prop('checked', true);
    $("#txtCompanyName").hide("");
    $('#ddlCompanyName').next('.select2-container').show();
   
    GetLeadMasterList($("#ddlSalesPerson").val());
    $("#tblContactPerson").hide();
    $("#tblProductDetails").hide();
    $("#dvFollowup").hide();
    $("#tblFollowUp").hide();
    $("#dvFollowTab1").show();
    $("#dvFollowTab2").hide();
    $("#hfFollowUpEnquiryMaster_Code").val('0')
    ClearContactPersonField();
    ClearEnquiryProductField();
    ClearData();
    $("#ProductDetailsGridBody").empty();
    $("#ContactPersonGridBody").empty();
    ClearFollowUpData();
}
function BackFolloupMaster() {
    $("#dvLoad").show();
    rebindSalesPersonSelect2();
    $("#dvEnquiry").hide();
    $('input[name="customerType"]').eq(0).prop('disabled', false);
    $('input[name="customerType"]').eq(0).prop('checked', true);
    $("#txtCompanyName").hide("");
    $('#ddlCompanyName').next('.select2-container').show();
    GetLeadMasterList($("#ddlSalesPerson").val());
    $("#tblContactPerson").hide();
    $("#tblProductDetails").hide();
    $("#dvFollowup").hide();
    $("#tblFollowUp").hide();
    $("#dvFollowTab1").show();
    $("#dvFollowTab2").hide();
    $("#hfFollowUpEnquiryMaster_Code").val('0')
    ClearContactPersonField();
    ClearEnquiryProductField();
    ClearData();
    $("#ProductDetailsGridBody").empty();
    $("#ContactPersonGridBody").empty();
    ClearFollowUpData();
}
function CreateNew() {
    var ModuleName = "Enquiry",
        OptionName = "New",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            $("#dvLoad").hide();
            detachSalesPersonSelect2();
            $("#dvEnquiry").show();
            let Grid = CreateContactNewRow();
            $("#ContactPersonGrid tbody").html(Grid);
            let grid = CreateProductNewRow();
            $("#ProductDetailsGridBody").html(grid);
            BindUOMDropdownsInGrid();
            BindItemDropdownsInGrid();
            try { GetDepartmentlist(); } catch (e) { };
            try { var _t = $('#txtEnquiryDate').val(); if (!_t) SetTodayEnquiryDate(); } catch (e) { };
        }
    });
}
function Bind_ddlCustomer() {
    LeadMasterService.GetAccountlist().then(function (resObj) {

        BindSelectList($('#ddlCompanyName')[0], resObj.map((item) => ({ Code: item.Desp, Desp: item.Desp })));
        $('#ddlCompanyName').select2({
            width: '-webkit-fill-available'
        });
        BizSolHelperFunction.attachSelect2ScrollPrevention($('#ddlCompanyName'));
    });
}
//function Bind_ddlCustomerType() {
//    LeadMasterService.GetAccountCategorylist().then(function (resObj) {
//        let option = '<option value="" >select</option>';
//        $.each(resObj, function (key, val) {
//            option += '<option value="' + val.Desp + '" >' + val.Desp + '</option>';
//        });
//        $("#ddlCustomerType").append(option);
//    });
//}
function Bind_ddlEnquiryType() {
    LeadMasterService.GetEnquiryTypelist().then(function (resObj) {
        let option = '<option value="" >Select</option>';
        $.each(resObj, function (key, val) {
            option += '<option value="' + val.Desp + '" >' + val.Desp + '</option>';
        });
        $("#ddlEnquiryType").append(option);
    });
}
function Bind_ddlLeadSource() {
    LeadMasterService.GetLeadSourcelist().then(function (resObj) {
        let option = '<option value="" >Select</option>';
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
        let option = '<option value="" >Select</option>';
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
        BizSolHelperFunction.attachSelect2ScrollPrevention($('#ddlCountry'));
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
        BizSolHelperFunction.attachSelect2ScrollPrevention($('#ddlState'));
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
        BizSolHelperFunction.attachSelect2ScrollPrevention($('#ddlCity'));

        return resObj; // return data if needed
    } catch (error) {
        console.error("Error loading cities:", error);
        toastr.error(error.Msg || 'Failed to load cities');
    }
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
        BizSolHelperFunction.attachSelect2ScrollPrevention($('#ddlSpecification'));

        return resObj; // return data if needed
    } catch (error) {
        console.error("Error loading cities:", error);
        toastr.error(error.Msg || 'Failed to load cities');
    }
}
function BindSelectList(element, list) {
    let option = '<option value="">Select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '" >' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function BindSelectForSalePerson(element, list) {
    let option = G_UserType == 'U' ? '' :'<option value="all">All</option>';
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
        phoneNo: $('#txtMobileNo').val(),
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
        status: 'U',
        isAttachmentExists: '',
        documentName: '',
        documentContent: '',
        customerType: '',
        enquirytypeName: $('#ddlEnquiryType').val() || '',
        nextFollowupdate: $('#txtNextFollowupDate').val(),
        nextFollowupmode: $('#ddlNextFollowupMode').val() || '',
        leadSourceDespName: $('#ddlLeadSource').val() || '',
        referenceBy: $('#txtReference').val(),
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
    if (!data[0].enquirytypeName) {
        toastr.error('Please select Enquiry Type.');
        $('#ddlEnquiryType').focus();
        return;
    }
    //if (!data[0].pinCode) {
    //    toastr.error('Please enter PIN / ZIP Code.');
    //    $('#txtPinCode').focus();
    //    return;
    //}
    //if (!data[0].nation) {
    //    toastr.error('Please select Country.');
    //    $('#ddlCountry').focus();
    //    return;
    //}
    if (data[0].nation) {
        if (!data[0].state && data[0].nation.toUpperCase() == G_CompanyNation.toUpperCase()) {
            toastr.error('Please select State.');
            $('#ddlState').focus();
            return;
        }
        if (!data[0].city && data[0].nation.toUpperCase() == G_CompanyNation.toUpperCase()) {
            toastr.error('Please select City/Town.');
            $('#ddlCity').focus();
            return;
        }
    }
    if (!data[0].eMail && !data[0].mobileNo && !data[0].phoneNo) {
        toastr.error('Please enter at least one: Email, Contact No., or Mobile No.');
        $('#txtEmail').focus();
        return;
    }
    if (data[0].eMail && !isEmail(data[0].eMail)) {
        toastr.error('Please enter valid email.');
        $('#txtEmail').focus();
        return;
    }
    if (data[0].mobileNo && !IsMobileNumber(data[0].mobileNo)) {
        toastr.error('Please enter valid mobile No.');
        $('#txtContactNo').focus();
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
    // If salesman is selected, ensure Next Followup Date is today or later
    if (data[0].personName && data[0].nextFollowupdate && IsDateBeforeToday(data[0].nextFollowupdate)) {
        toastr.error('Next Followup Date cannot be a past date.');
        $('#txtNextFollowupDate').focus();
        return;
    }
   
    // If salesman is not blank, Next Followup Date and Mode are mandatory
    if (data[0].personName && (data[0].nextFollowupdate === '' || data[0].nextFollowupdate == null)) {
        toastr.error('Please select Next Followup Date.');
        $('#txtNextFollowupDate').focus();
        return;
    }
    if (data[0].personName && (data[0].nextFollowupmode === '' || data[0].nextFollowupmode == null)) {
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
    var $element = $('#' + Id);
    $element.select2({
        width: '-webkit-fill-available'
    });
    BizSolHelperFunction.attachSelect2ScrollPrevention($element);
}
function CompanyBlank() {
    $("#txtPinCode").val("");
    SelectOptionByText('ddlCountry', "Select");
    SelectOptionByText('ddlState', "Select");
    SelectOptionByText('ddlCity', "Select");
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
    const ModuleName = "Enquiry";
    const OptionName = "Edit";
    const ShowMsg = "Y";
    const FinYear = getFinancialYear();

    try {
        // 1. Check permissions
        const response = await MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear);
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return false;
        }

        // 2. Show / Hide required sections
        $("#dvLoad").hide();
        detachSalesPersonSelect2();
        $("#dvEnquiry").show();
        $('input[name="customerType"]').eq(0).prop('disabled', true);
        $('input[name="customerType"]').eq(1).prop('checked', true);
        SelectOptionByText('ddlCompanyName', "Select");
        $('#ddlCompanyName').next('.select2-container').hide();
        $('#txtCompanyName').show();
        $("#ProductDetailsGridBody").empty();
        $("#ContactPersonGridBody").empty();

        // 3. Fetch Enquiry details
        const resObj = await LeadMasterService.GetEnquiryDetailsByCode(Code);

        // ---------------- Enquiry Master ----------------
        if (resObj.EnquiryMaster?.length > 0) {
            const data = resObj.EnquiryMaster[0];
            $("#hfCode").val(data.Code);
            $("#txtCompanyName").val(data.AccountDesp);
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
            $('#txtMobileNo').val(data.PhoneNo);
            $("#txtWebsite").val(data.Website);
            $("#txtAddressLine1").val(data.Address1);
            $("#txtAddressLine2").val(data.Address2);
            $("#txtEnquiryDate").val(data.EnquiryDate);
            $("#ddlLeadSource").val(data.LeadSourceDespName);
            $("#txtReference").val(data.ReferenceBy);
            $("#txtReferenceDate").val(data.ReferenceDate);
            SelectOptionByText('ddlAssignSalesman', data.PersonName);
            $("#txtNextFollowupDate").val(data.NextFollowupDate);
            $("#ddlNextFollowupMode").val(data.NextFollowupMode);
            $("#txtRemarks").val(data.Remark);
            G_Status = data.Status;
        }

        // ---------------- Enquiry Details ----------------
        if (resObj.EnquiryDetails?.length > 0) {
            let grid = "";
            $.each(resObj.EnquiryDetails, function (i, product) {
                grid += `
                    <tr>
                        <td><select id='txtItemName_${product.Code}' class='form-control form-control-sm pd-name' data-current-value='${product["Product Name"] || ""}'></select></td>
                        <td><input type='text' id='txtSpecification_${product.Code}' class='form-control form-control-sm pd-spec' value='${product["Specification"] || ""}' maxlength='100' autocomplete='off' /></td>
                        <td><select id='txtUOM_${product.Code}' class='form-control form-control-sm pd-uom' data-current-value='${product["UOM"] || ""}'></select></td>
                        <td><input type='text' id='txtQuantity_${product.Code}' class='form-control form-control-sm pd-qty Quantity' value='${product["Quantity"] || ""}' maxlength='10' autocomplete='off' /></td>
                        <td><input type='text' id='txtProductRemarks_${product.Code}' class='form-control form-control-sm pd-remark' value='${product["Remarks"] || ""}' maxlength='150' autocomplete='off' /></td>
                        <td class='text-center'>
                            <button type='button' class='btn btn-height btn-info' onclick='ChangeProduct(${product.Code})'><i class='fa fa-save'></i></button>
                            &nbsp;
                            <button type='button' class='btn btn-height btn-danger' onclick='DeleteProductDetail(${product.Code})'><i class='fa fa-times'></i></button>
                        </td>
                    </tr>`;
            });
            grid += CreateProductNewRow();
            $("#ProductDetailsGridBody").html(grid);
            BindUOMDropdownsInGrid();
            BindItemDropdownsInGrid();
        } else {
            $("#ProductDetailsGridBody").html(CreateProductNewRow());
            BindUOMDropdownsInGrid();
            BindItemDropdownsInGrid();
        }

        // ---------------- Contact Persons ----------------
        if (resObj.ContactPersonsList?.length > 0) {
            let grid = "";
            $.each(resObj.ContactPersonsList, function (i, person) {
                let isDefaultValue = person.isDefault || person.IsDefault || person["Is Default"] || person["Default"] || "";
                const isDefault = isDefaultValue === 'Y' || isDefaultValue === 'y';
                grid += `
                    <tr>
                        <td><input type='text' id='txtName_${person.Code}' class='form-control form-control-sm cp-name' value='${person.Name || ""}' maxlength='50' autocomplete='off' /></td>
                        <td><input type='text' id='txtDepartment_${person.Code}' class='form-control form-control-sm cp-dept' value='${person.Department || ""}' autocomplete='off' /></td>
                        <td><input type='text' id='txtDesignation_${person.Code}' class='form-control form-control-sm cp-desig' value='${person.Designation || ""}' autocomplete='off' /></td>
                        <td><input type='email' id='txtContactEmail_${person.Code}' class='form-control form-control-sm cp-email' value='${person["Email Id"] || ""}' maxlength='100' autocomplete='off' /></td>
                        <td><input type='text' id='txtContactMobileNo_${person.Code}' class='form-control form-control-sm cp-mobile Phone' value='${person["Contact No"] || ""}' maxlength='10' autocomplete='off' /></td>
                        <td class='text-center'>
                            <input type='checkbox' class='form-check-input cp-default' ${isDefault ? "checked" : ""} />
                        </td>
                        <td class='text-center'>
                            <button type='button' class='btn btn-height btn-info' onclick='ChangeContact(${person.Code})'><i class='fa fa-save'></i></button>
                            &nbsp;
                            <button type='button' class='btn btn-height btn-danger' onclick='DeleteContactPerson(${person.Code})'><i class='fa fa-times'></i></button>
                        </td>
                    </tr>`;
            });
            grid += CreateContactNewRow();
            $("#ContactPersonGrid tbody").html(grid);
            try { GetDepartmentlist(); } catch (e) { }
        } else {
            $("#ContactPersonGrid tbody").html(CreateContactNewRow());
            try { GetDepartmentlist(); } catch (e) { }
        }

    } catch (error) {
        toastr.error(error.Msg || 'An error occurred while fetching enquiry details');
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
            OpenContactPersonModal();
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
                SelectOptionByText('ddlSpecification', "");
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
    SelectOptionByText('ddlCountry', "Select");
    SelectOptionByText('ddlState', "Select");
    SelectOptionByText('ddlCity', "Select");
    SelectOptionByText('ddlAssignSalesman', "Select");
    $("#ddlEnquiryType").val("");
    $("#ddlNextFollowupMode").val("");
    $("#ddlLeadSource").val("");
    $("#ddlProductName").val("");
    $("#ddlSpecification").val("");
    $("#ddlUOM").val("");
    $("#txtCompanyName").val("");
    $('#txtMobileNo').val("");
    G_Status = "";
    // Reset Enquiry Date to today
    try { SetTodayEnquiryDate(); } catch (e) {}
}
function SaveContactPersonDetails(Code) {
    let isDefaultChecked = false;
    let $nameInput = $("#txtName_" + Code);
    if ($nameInput.length > 0) {
        let $row = $nameInput.closest('tr');
        let $checkbox = $row.find('.cp-default');
        if ($checkbox.length > 0) {
            isDefaultChecked = $checkbox.is(':checked');
        }
    }
    let payload = [{
        code: Code || 0,
        enquiryMaster_Code: $("#hfCode").val() || 0,
        contactPersonName: $("#txtName_"+Code).val().trim(),
        contactPersonMobile: $("#txtContactMobileNo_" + Code).val().trim(),
        contactPersonEMail: $("#txtContactEmail_" + Code).val().trim(),
        contactPersonExt: "",
        contactPersonDesignation: $("#txtDesignation_"+Code).val() || "",
        departmentName: $("#txtDepartment_"+Code).val() || "",
        emailInInvoiceCopy: "",
        isDefault: isDefaultChecked ? "Y" : "N"
    }];
    if ($("#hfCode").val() == '0' || $("#hfCode").val() == '0') {
        toastr.error("Please fill first enquiry details.");
        return;
    }
    let fields = [
        payload[0].contactPersonName,
        payload[0].departmentName,
        payload[0].contactPersonDesignation,
        payload[0].contactPersonEMail,
        payload[0].contactPersonMobile
    ];
    let anyFilled = fields.some(f => (typeof f === 'string' ? f.trim() !== '' : f));
    if (!anyFilled) {
        toastr.error("Please fill at least one contact person detail field.");
        return;
    }
    // Only validate filled fields
    if (payload[0].contactPersonEMail && !isEmail(payload[0].contactPersonEMail)) {
        toastr.error("Please enter valid contact person email.");
        $("#txtContactEmail_" + Code).focus();
        return;
    }
    if (payload[0].contactPersonMobile && !IsMobileNumber(payload[0].contactPersonMobile)) {
        toastr.error("Please enter valid contact person mobile number.");
        $("#txtContactMobileNo_" + Code).focus();
        return;
    }
    LeadMasterService.SaveContactPersonDetails(payload)
        .then(function (response) {
            if (response && response[0].Status === 'Y') {
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
function SaveEnquiryProductDetails(Code) {
    let payload = [{
        code: Code || 0,
        enquiryMaster_Code: $("#hfCode").val() || 0,
        itemName: $("#txtItemName_"+Code).val() || "",
        sizeDetails: $("#txtSpecification_"+Code).val() || "",
        quantity: parseFloat($("#txtQuantity_"+Code).val()) || 0,
        uom: $("#txtUOM_"+Code).val() || "",
        remarks: $("#txtProductRemarks_"+Code).val() || "",
        classificationDesp: "",
        gradeDesp: "",
        basicValue: 0,
        freight: 0,
        basicRatePerPC: 0,
        sizeDesp: "",
        partNumber: "",
        mrpOfProducts: 0,
        schemeDiscount: "",
        vatRate: 0,
        purchasePrice: 0,
        vatAmount: 0,
        rateAfterVat: 0,
        newDiscountPercentage: 0,
        checkSendMail: "N",
        newFreight: 0,
        oldPurchaseRate: 0,
        updatedby: G_UserMasterCode,
        updatedDate: null,
        verifiedby: 0,
        verifiedDate: null,
        vendorName: "",
        newPurchaseRate: 0,
        priceToVendorRemark: "",
        discountIncl: 0,
        discountInclValue: 0,
        discount2: 0,
        discount2Value: 0,
        discount3: 0,
        discount3Value: 0
    }];
    if ($("#hfCode").val() == '0' || $("#hfCode").val() == '0') {
        toastr.error("Please fill first enquiry details.");
        return;
    }
    // Allow save if any field is filled, block only if all are blank
    let fields = [
        payload[0].itemName,
        payload[0].sizeDetails,
        payload[0].uom,
        payload[0].quantity,
        payload[0].remarks
    ];
    let anyFilled = fields.some(f => (typeof f === 'string' ? f.trim() !== '' : f > 0));
    if (!anyFilled) {
        toastr.error("Please fill at least one product detail field.");
        return;
    }
    LeadMasterService.SaveEnquiryProductDetails(payload)
        .then(function (response) {
            if (response && response[0].Status === 'Y') {
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
    //SelectOptionByText('ddlDesignation', "select");
    //SelectOptionByText('ddlDepartment', "select");
}
function ClearEnquiryProductField() {
    $("#hfProductDetailCode").val(0);
    //SelectOptionByText('ddlProductName', "select");
    //SelectOptionByText('ddlSpecification', "select");
    //SelectOptionByText('ddlUOM', "select");
    $("#txtQuantity").val("");
    $("#txtProductRemark").val("");
}
function Delete(Code) {
    var ModuleName = "Enquiry",
        OptionName = "DELETE",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            OpenModal()
            $("#txtcode").val(Code);
        }

    });
}
function WhatsApp(Code) {
    try {
        if (!G_originalData || G_originalData.length === 0) {
            toastr.error("Contact information not available.");
            return;
        }
        let item = G_originalData.find(function (x) {
            return x.Code == Code;
        });
        if (!item) {
            toastr.error("Contact information not found.");
            return;
        }
        let contactNo = item["Contact No"] || item.ContactNo;
        if (contactNo === null || contactNo === undefined || contactNo === "" || contactNo === "null" || contactNo === "undefined") {
            toastr.error("Contact number is not available for this record. Please add a contact number.");
            return;
        }
        contactNo = contactNo.toString().trim();
        if (contactNo === "" || contactNo === "null" || contactNo === "undefined") {
            toastr.error("Contact number is not available for this record. Please add a contact number.");
            return;
        }
        contactNo = contactNo.replace(/\s+/g, "");
        contactNo = contactNo.replace(/-/g, "");
        contactNo = contactNo.replace(/\(/g, "");
        contactNo = contactNo.replace(/\)/g, "");
        if (contactNo.startsWith("+")) {
            contactNo = contactNo.substring(1);
        }
        if (contactNo.startsWith("91") && contactNo.length === 12) {
        } else if (contactNo.length === 10) {
            contactNo = "91" + contactNo;
        }
        if (contactNo.length < 10) {
            toastr.error("Invalid contact number.");
            return;
        }
        let whatsappUrl = "https://wa.me/" + contactNo;
        window.open(whatsappUrl, "_blank");
    } catch (error) {
        toastr.error("An error occurred while opening WhatsApp.");
        console.error(error);
    }
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
            GetLeadMasterList($("#ddlSalesPerson").val());
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
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
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
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
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
    let Status = '';
    if (G_Status == '') {
        Status = 'I';
    } else if (G_Status.toUpperCase() == 'DRAFT') {
        Status = 'I';
    } else {
        Status = '';
    }
    const data = [{
        code: $('#hfCode').val() || 0,
        enquiryDate: $('#txtEnquiryDate').val(),
        referenceNo: $('#txtReference').val(),
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
        phoneNo: $('#txtMobileNo').val(),
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
        status: Status,
        isAttachmentExists: '',
        documentName: '',
        documentContent: '',
        customerType:  '',
        enquirytypeName: $('#ddlEnquiryType').val() || '',
        nextFollowupdate: $('#txtNextFollowupDate').val(),
        nextFollowupmode: $('#ddlNextFollowupMode').val() || '',
        leadSourceDespName: $('#ddlLeadSource').val() || '',
        referenceBy: $('#txtReference').val() || '',
        website: $('#txtWebsite').val()
    }];
    LeadMasterService.SaveLeadEnquiryData(data).then(function (response) {
        if (response[0].Status === 'Y') {
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
        OptionName = "Verify",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
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
    LeadMasterService.VerifyEnquiry(code, reason).then(function (response) {
        if (response[0].Status == 'Y') {
            toastr.success(response[0].Msg);
            GetLeadMasterList($("#ddlSalesPerson").val());
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
            GetLeadMasterList($("#ddlSalesPerson").val());
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
    OpenAssignModal();
    $("#txtEnquiryAssignCode").val(Code);
    GetAssignDetails(Code);
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
            GetLeadMasterList($("#ddlSalesPerson").val());
            SelectOptionByText('ddlAssignTo', "Select");
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
    detachSalesPersonSelect2();
    Bind_ddlContactPersonDetail(EnquiryMaster_Code);
    CreateNewFollowUp();
    Bind_ddlLeadStatus();
    LeadMasterService.GetEnquiryFollowUpList(EnquiryMaster_Code).then(function (response) {
        if (response.length > 0) {
            $("#tblFollowUp").show();
            $("#txtEnquiryNumber").val(response[0]["EnquiryNo"])
            $("#txtFollowupEnquiryDate").val(response[0]["EnquiryDate"])
            $("#txtFollowupCustomerName").val(response[0]["CompanyName"])
            const StringFilterColumn = ["CustomerRemarks", "OurRemarks"];
            const NumericFilterColumn = ["OverdueFollowupDays"];
            const DateFilterColumn = ["FollowUpDate", "NextFollowUpDate"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "EnquiryMaster_Code", "FollowupMode", "EnquiryContactPersonDetail_Code", "EnquiryDate", "EnquiryNo", "CompanyName", "FollowupByName", "CustomerContactPersonName", "CustomerContactPhoneNumber", "CustomerContactEmailID"]
            const ColumnAlignment = {
                Action: 'center'
            };

            const cleanGridVal = (v) => {
                if (v === null || v === undefined) return '';
                if (typeof v === 'number' && !Number.isNaN(v)) return v;
                const s = String(v).trim();
                return s.toLowerCase() === 'null' ? '' : v;
            };
            const updatedResponse = response.map(item => {
                const row = Object.fromEntries(
                    Object.entries(item).map(([k, v]) => [k, cleanGridVal(v)])
                );
                let buttonsHTML = `<span class="enq-fu-row-actions"><button type="button" class="btn btn-primary icon-height" title="Edit" onclick="GetFollowupDetailsByCode(${item.Code},this)"><i class="fa fa-pencil"></i></button><button type="button" class="btn btn-danger icon-height" title="Delete" onclick="DeleteFollowUp(${item.Code})"><i class="fa fa-times"></i></button></span>`;
                return {
                    ...row,
                    Action: buttonsHTML,
                };

            });
            BizsolCustomFilterGrid.CreateDataTable("FollowUp-header", "FollowUp-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        }
        else {
            $("#tblFollowUp").hide();
            //BackMaster();
        }
    });
}
function CreateNewFollowUp() {
    $("#dvFollowTab1").hide();
    $("#dvFollowTab2").show();
    SetTodayFollowUpDateFollowUp();
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
    $("#ddlLeadStatus").val("");
}
function SaveEnquiryFollowUp() {
    var txtOurRemarks = $("#txtOurRemarks").val().trim();
    var txtCustomerRemarks = $("#txtCustomerRemarks").val();
    var ddlCustomerContactPersonName = $("#ddlCustomerContactPersonName").val().trim();
    var txtFollowUpDateFollowUp = $("#txtFollowUpDateFollowUp").val().trim();
    var ddlFollowUpModeFollowUp = $("#ddlFollowUpModeFollowUp").val().trim();
    var txtNextFollowUpDateFollowUp = $("#txtNextFollowUpDateFollowUp").val().trim();
    var ddlNextFollowUpModeFollowUp = $("#ddlNextFollowUpModeFollowUp").val().trim();
    var ddlLeadStatus = $("#ddlLeadStatus").val().trim();

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
    // Prevent past date for Next Followup Date (when required)
    if ($("#chkFollowUpRequired").is(":checked") && txtNextFollowUpDateFollowUp && IsDateBeforeToday(txtNextFollowUpDateFollowUp)) {
        toastr.error("Next Followup Date cannot be a past date.");
        $("#txtNextFollowUpDateFollowUp").focus();
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
    if (ddlLeadStatus === "") {
        toastr.error("Please select lead status.");
        $("#ddlLeadStatus").focus();
        return;
    }

    var followUpData = {
        enquiryFollowUpList: [
            {
                code: parseInt($("#hfFollowUpMaster_Code").val()),
                enquiryMaster_Code: parseInt($("#hfFollowUpEnquiryMaster_Code").val()),
                enquiryContactPersonDetail_Code: 0,
                marketingPersonMaster_Code: 0,
                enquiryNo: "",
                followupDate: $("#txtFollowUpDateFollowUp").val(),
                followupMode: $("#ddlFollowUpModeFollowUp").val(),
                nextFollowupDate: $("#txtNextFollowUpDateFollowUp").val(),
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
                enquiryDate: null,
                status: $("#ddlLeadStatus").val(),
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
            $("#ddlLeadStatus").val(resObj["Status"]);
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
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
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
            $("#ddlFollowUpModeFollowUpFollow").val(resObj["FollowupMode"]);
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
    GetDepartmentlistForModal();
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
    $("#ddlModalDesignation").val("");
    $("#ddlModalDepartment").val("");
    //SelectOptionByText('ddlModalDesignation', "Select");
    //SelectOptionByText('ddlModalDepartment', "Select");
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
function CreateContactNewRow() {
    let grid = "";
    grid += "<tr>";
    grid += "<td><input type='text'id='txtName_0' class='form-control form-control-sm pd-ContactName' value='' maxlength='100' autocomplete='off' /></td>";
    grid += "<td><input type='text'id='txtDepartment_0' class='form-control form-control-sm cp-dept' value='' autocomplete='off' /></td>";
    grid += "<td><input type='text'id='txtDesignation_0' class='form-control form-control-sm cp-desig' value='' autocomplete='off' /></td>";
    grid += "<td><input type='text'id='txtContactEmail_0' class='form-control form-control-sm pd-ContactEmail' value='' autocomplete='off' /></td>";
    grid += "<td><input type='text'id='txtContactMobileNo_0' class='form-control form-control-sm pd-ContactMobileNo Phone' value='' maxlength='10' autocomplete='off' /></td>";
    grid += "<td class='text-center'><input type='checkbox' class='form-check-input cp-default' /></td>";
    grid += "<td class='text-center'><button type='button' class='btn btn-height btn-info' onclick='ChangeContact(0)'><i class='fa fa-save'></i></button></td>";
    grid += "</tr>";
    return grid;
}

function UpdateDefaultContactSummary() {
    try {
        const $checked = $('.cp-default:checked').closest('tr');
        if ($checked.length === 0) {
            return;
        }

        const name = $checked.find('.cp-name, .pd-ContactName').val() || '';
        const email = $checked.find('.cp-email, .pd-ContactEmail').val() || '';
        const mobile = $checked.find('.cp-mobile, .pd-ContactMobileNo').val() || '';

        // Reflect selected contact into main enquiry fields
        if (name !== '') {
            $('#ddlCustomerContactPersonName').val(name);
        }
        if (email !== '') {
            $('#txtEmail').val(email);
        }
        if (mobile !== '') {
            $('#txtContactNo').val(mobile);
        }
    } catch (e) {
        // silent fail for safety
    }
}
function CreateProductNewRow() {
    let grid = "";
    grid += "<tr>";
    grid += "<td><select id='txtItemName_0' class='form-control form-control-sm pd-name'></select></td>";
    grid += "<td><input type='text'id='txtSpecification_0' class='form-control form-control-sm pd-spec' value='' maxlength='100' autocomplete='off' /></td>";
    grid += "<td><select id='txtUOM_0' class='form-control form-control-sm pd-uom'></select></td>";
    grid += "<td><input type='text'id='txtQuantity_0' class='form-control form-control-sm pd-qty Quantity' value='' autocomplete='off' maxlength='10'  /></td>";
    grid += "<td><input type='text'id='txtProductRemarks_0' class='form-control form-control-sm pd-remark' value='' maxlength='150' autocomplete='off' /></td>";
    grid += "<td class='text-center'><button type='button' class='btn btn-height btn-info' onclick='ChangeProduct(0)'><i class='fa fa-save'></i></button></td>";
    grid += "</tr>";
    return grid;
}
function BindUOMDropdownsInGrid() {
    // Get all elements with pd-uom class
    $('.pd-uom').each(function() {
        var $element = $(this);
        var elementId = $element.attr('id');
        
        // Store the current value before binding
        var currentValue = $element.data('current-value') || '';
        
        // Bind UOM data to the dropdown
        if (typeof G_UOMMasterList !== 'undefined' && G_UOMMasterList.length > 0) {
            BindSelectList($element[0], G_UOMMasterList.map((item) => ({ Code: item.UOM, Desp: item.UOM })));
            
            // Set the value if it exists
            if (currentValue) {
                $element.val(currentValue);
            }
            
            // Initialize Select2
            $element.select2({
                width: '-webkit-fill-available',
                placeholder: 'Select UOM'
            });
            BizSolHelperFunction.attachSelect2ScrollPrevention($element);
        } else {
            // If UOM data is not loaded, fetch it first
            LeadMasterService.GetUOMMasterList().then(function (resObj) {
                G_UOMMasterList = resObj;
                BindSelectList($element[0], resObj.map((item) => ({ Code: item.UOM, Desp: item.UOM })));
                
                // Set the value if it exists
                if (currentValue) {
                    $element.val(currentValue);
                }
                
                // Initialize Select2
                $element.select2({
                    width: '-webkit-fill-available',
                    placeholder: 'Select UOM'
                });
                BizSolHelperFunction.attachSelect2ScrollPrevention($element);
            }).catch(function(error) {
                toastr.error(error.Msg || 'An error occurred while fetching UOM list');
            });
        }
    });
}
function BindItemDropdownsInGrid() {
    $('.pd-name').each(function () {
        var $element = $(this);
        var currentValue = $element.data('current-value') || '';

        function bindFromList(list) {
            if (!Array.isArray(list)) list = [];
            var options = [{ Code: '', Desp: 'Select' }].concat(list.map(function (item) { return { Code: item.ItemName, Desp: item.ItemName }; }));
            // Build HTML once
            var html = '';
            for (var i = 0; i < options.length; i++) {
                html += "<option value='" + options[i].Code + "'>" + options[i].Desp + "</option>";
            }
            $element.html(html);
            if (currentValue) {
                $element.val(currentValue);
            }
            $element.select2({
                width: '-webkit-fill-available',
                placeholder: 'Select product'
            });
            BizSolHelperFunction.attachSelect2ScrollPrevention($element);
        }

        if (typeof G_ItemMasterList !== 'undefined' && G_ItemMasterList.length > 0) {
            bindFromList(G_ItemMasterList);
        } else if (LeadMasterService && LeadMasterService.GetItemMasterDropDown) {
            LeadMasterService.GetItemMasterDropDown().then(function (resObj) {
                G_ItemMasterList = resObj || [];
                bindFromList(G_ItemMasterList);
            }).catch(function (error) {
                toastr.error(error.Msg || 'An error occurred while fetching item master list');
            });
        }
    });
}

$(document).on('change', '.pd-name', function () {
    var selectedName = $(this).val();
    if (!selectedName) return;
    try {
        var match = (G_ItemMasterList || []).find(function (x) { return x.ItemName === selectedName; });
        if (!match) return;
        var $row = $(this).closest('tr');
        var $uom = $row.find('.pd-uom');
        if ($uom.length) {
            $uom.val(match.UOM).trigger('change');
        }
    } catch (e) { /* no-op */ }
});
function AddNewProductRow() {
    var newRowHtml = CreateProductNewRow();
    $("#ProductDetailsGridBody").append(newRowHtml);
    // Bind UOM dropdown for the newly added row
    BindUOMDropdownsInGrid();
    // Bind Item dropdown for the newly added row
    BindItemDropdownsInGrid();
}
function SetUOMValue(elementId, uomValue) {
    var $element = $('#' + elementId);
    if ($element.length > 0) {
        $element.data('current-value', uomValue);
        if ($element.hasClass('pd-uom')) {
            // If it's already a dropdown, set the value
            $element.val(uomValue);
            $element.trigger('change');
        }
    }
}
function GetUOMValue(elementId) {
    var $element = $('#' + elementId);
    if ($element.length > 0 && $element.hasClass('pd-uom')) {
        return $element.val();
    }
    return '';
}
function GetDepartmentlist() {
    // Fetch departments and designations in parallel
    const deptPromise = LeadMasterService.GetDesignationList();
    const desigPromise = (LeadMasterService.GetDesignationList
        ? LeadMasterService.GetDesignationList()
        : Promise.resolve([]));

    Promise.all([deptPromise, desigPromise]).then(function (results) {
        const deptRes = results[0] || [];
        const desigRes = results[1] || [];

        // Normalize to { Desp: string }
        const departments = deptRes
            .map(function (item) { return { Desp: item.Department || item['Department'] || '' }; })
            .filter(function (x) { return x.Desp; });
        const designations = desigRes
            .map(function (item) { return { Desp: item.Designation || item['Designation'] || '' }; })
            .filter(function (x) { return x.Desp; });

        const selector = '.cp-desig, .cp-dept';

        // Ensure each input has its own suggestion list and is bound correctly
        $(selector).each(function (idx) {
            const $input = $(this);
            let inputId = $input.attr('id');
            if (!inputId) {
                inputId = 'cp_input_' + Date.now() + '_' + idx;
                $input.attr('id', inputId);
            }
            const listId = 'cpSuggest_' + inputId;
            let $list = $('#' + listId);
            if (!$list.length) {
                $list = $("<ul class='AutoSuggestion-list' id='" + listId + "'></ul>");
                $('body').append($list);
            }
            $input.data('suggestListId', listId);

            // Choose source based on field type
            const items = $input.hasClass('cp-dept') ? departments : designations;
            // Guard against multiple initializations for the same input
            if ($input.data('cpSuggestInit')) {
                return; // already initialized once
            }
            if (typeof AutoSuggestionControl !== 'undefined' && AutoSuggestionControl.SetUpAutoSuggestion && items.length) {
                AutoSuggestionControl.SetUpAutoSuggestion($input, $list, items, 'StartWith');
                $input.data('cpSuggestInit', true);
            } else {
                $list.empty().hide();
            }
        });

        // Position and show per-input on focus/input; hide all others
        $(document)
            .off('focus.cpSuggest input.cpSuggest', selector)
            .on('focus.cpSuggest input.cpSuggest', selector, function () {
                // Hide all suggestion lists first
                $('.AutoSuggestion-list').hide();
                const $input = $(this);
                const listId = $input.data('suggestListId');
                const $list = $('#' + listId);
                const items = $input.hasClass('cp-dept') ? departments : designations;
                if (!$list.length || !items.length) { if ($list.length) $list.hide(); return; }
                const offset = $input.offset();
                const gap = 8; // small space between input and list
                $list.css({
                    position: 'absolute',
                    top: offset.top + $input.outerHeight() + gap,
                    left: offset.left,
                    width: $input.outerWidth(),
                    zIndex: 99999
                }).show();
            })
            .off('blur.cpSuggest', selector)
            .on('blur.cpSuggest', selector, function () {
                const $input = $(this);
                const listId = $input.data('suggestListId');
                const $list = $('#' + listId);
                setTimeout(function () { if ($list.length) $list.hide(); }, 150);
            });
    }).catch(function (error) {
        console.error('GetDepartmentlist error:', error);
    });
}
function ChangeContact(Code) {
        SaveContactPersonDetails(Code);
}
function ChangeProduct(Code) {
        SaveEnquiryProductDetails(Code);
}
function ViewAttachment(x) {
    if (parseFloat($("#hfCode").val()) > 0) {
        var ObjCurrRow = $(x).closest('tr');
        var ExpenseEntryDetail_Code = $("#hfCode").val();
        InitAttachmentControl('EnquiryMaster', 0, 'EnquiryMaster', ExpenseEntryDetail_Code, 0, '', "all");
    }
}
function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode) {
    var url = `${sessionStorage.getItem('AppBaseURL')}/CustomControl/AttachmentControl`;
    $('#EnquiryMaster_AttachmentControlmodal').load(url, { MasterTableName: masterTableName, MasterTableCode: masterTableCode, DetailTableName: detailTableName, DetailTableCode: detailTableCode, EntryNo: entryNo, EntryDate: entryDate, Mode: mode });
}
function ChangecolorTr() {
    const table = document.querySelector("#table-body").closest("table");
    const headerCells = table.querySelectorAll("thead th");
    let statusIndex = -1;
    headerCells.forEach((th, index) => {
        if (th.textContent.trim().toUpperCase() === "STATUS") {
            statusIndex = index;
        }
    });

    if (statusIndex === -1) return; // Exit if Status column not found

    const rows = document.querySelectorAll("#table-body tr");
    rows.forEach((row) => {
        const tds = row.querySelectorAll("td");
        const columnValue = tds[statusIndex]?.textContent.trim().toUpperCase();

        if (columnValue === "DRAFT") {
            row.style.backgroundColor = "#bcdbf3";
        }
    });
}

setInterval(ChangecolorTr, 100);
function GetCompanyParameter() {
    LeadMasterService.GetCompanyParameter().then(function (response) {
        if (response.length > 0) {
            G_CompanyNation = response[0]["CompanyNation"];
        } else {
            toastr.error('No Data Found');
        }
    });
}
function GetAssignDetails(Code) {
    LeadMasterService.GetAssignDetails(Code).then(function (response) {
        if (response.length > 0) {
            $("#dvAssignDetailsWrap").show();
            const StringFilterColumn = ["Name", "Assign Date"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                Action: 'center'
            };

            BizsolCustomFilterGrid.CreateDataTable("AssignDetails-header", "AssignDetails-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment,false)
        }
        else {
            $("#dvAssignDetailsWrap").hide();
        }
    });
}
function GetDepartmentlistForModal() {
    const deptPromise = LeadMasterService.GetDesignationList();
    const desigPromise = (LeadMasterService.GetDesignationList
        ? LeadMasterService.GetDesignationList()
        : Promise.resolve([]));

    Promise.all([deptPromise, desigPromise]).then(function (results) {
        const deptRes = results[0] || [];
        const desigRes = results[1] || [];

        // Normalize to { Desp: string }
        const departments = deptRes
            .map(item => ({ Desp: item.Department || item['Department'] || '' }))
            .filter(x => x.Desp);
        const designations = desigRes
            .map(item => ({ Desp: item.Designation || item['Designation'] || '' }))
            .filter(x => x.Desp);

        // Only your inputs
        const selector = '#ddlModalDepartment, #ddlModalDesignation';

        $(selector).each(function (idx) {
            const $input = $(this);
            const inputId = $input.attr('id');
            const listId = 'cpSuggest_' + inputId;

            // Create suggestion list
            let $list = $('#' + listId);
            if (!$list.length) {
                $list = $("<ul class='AutoSuggestion-list' id='" + listId + "'></ul>");
                $('body').append($list);
            }
            $input.data('suggestListId', listId);

            // Pick dataset
            const items = $input.is('#ddlModalDepartment') ? departments : designations;

            if (!$input.data('cpSuggestInit')) {
                if (typeof AutoSuggestionControl !== 'undefined' &&
                    AutoSuggestionControl.SetUpAutoSuggestion &&
                    items.length) {

                    AutoSuggestionControl.SetUpAutoSuggestion($input, $list, items, 'StartWith');
                    $input.data('cpSuggestInit', true);
                } else {
                    $list.empty().hide();
                }
            }
        });

        // Event binding
        $(document)
            .off('focus.cpSuggest', selector)
            .off('input.cpSuggest', selector)
            .on('focus.cpSuggest input.cpSuggest', selector, function () {
                $('.AutoSuggestion-list').hide(); // hide all
                const $input = $(this);
                const listId = $input.data('suggestListId');
                const $list = $('#' + listId);
                const items = $input.is('#ddlModalDepartment') ? departments : designations;
                if (!$list.length || !items.length) {
                    if ($list.length) $list.hide();
                    return;
                }
                const offset = $input.offset();
                const gap = 8;
                $list.css({
                    position: 'absolute',
                    top: offset.top + $input.outerHeight() + gap,
                    left: offset.left,
                    width: $input.outerWidth(),
                    zIndex: 99999
                }).show();
            })
            .off('blur.cpSuggest', selector)
            .on('blur.cpSuggest', selector, function () {
                const $input = $(this);
                const listId = $input.data('suggestListId');
                const $list = $('#' + listId);
                setTimeout(function () { if ($list.length) $list.hide(); }, 150);
            });
    }).catch(function (error) {
        console.error('GetDepartmentlist error:', error);
    });
}
function ResetEnquiryFollowUp() {
    ClearFollowUpData();
}
function BackEnquiry() {
    if ($("#ddlAssignSalesman").val() != '') {
        SaveLeadEnquiryOnChange();
    }
    // Reset tabs and select Enquiry tab
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    var enquiryTab = document.querySelector('.card-header-tabs .tab');
    if (enquiryTab) {
        enquiryTab.classList.add('active');
    }
    // Show Enquiry tab content and hide others
    $("#dvTab1").show();
    $("#dvTab2").show();
    $("#dvTab3").show();
    BackMaster();
}
function Bind_ddlLeadStatus() {
    $("#ddlLeadStatus").empty();
    $("#ddlfilterLeadType").empty();
    LeadMasterService.GetLeadStatuslist().then(function (resObj) {
        let option = '<option value="" >All</option>';
        $.each(resObj, function (key, val) {
            option += '<option value="' + val.Value + '" >' + val.Value + '</option>';
        });
        $("#ddlLeadStatus").append(option);
        $("#ddlfilterLeadType").append(option);
        restoreEnquiryLeadTypeSelect();
    });
}

async function GetEnquiryDetailsForViewByCode(Code) {
    const ModuleName = "Enquiry";
    const OptionName = "View";
    const ShowMsg = "Y";
    const FinYear = getFinancialYear();

    try {
        // Check permissions
        const response = await MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear);
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return false;
        }
        
        const resObj = await LeadMasterService.GetEnquiryDetailsByCode(Code);

        // Build HTML for view-only modal
        let modalHtml = '';

        
        if (resObj.ContactPersonsList?.length > 0) {
            modalHtml += `
                <div class="enq-details-section">
                    <div class="enq-details-section-head">
                        <h6>Contact Persons</h6>
                    </div>
                    <div class="enq-details-section-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-sm enq-details-table mb-0">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Department</th>
                                        <th>Designation</th>
                                        <th>Email</th>
                                        <th>Contact No</th>
                                        <th>Default</th>
                                    </tr>
                                </thead>
                                <tbody>`;

            $.each(resObj.ContactPersonsList, function (i, person) {
                let isDefaultValue = person.isDefault || person.IsDefault || person["Is Default"] || person["Default"] || "";
                const isDefault = isDefaultValue === 'Y' || isDefaultValue === 'y';

                modalHtml += `
                    <tr>
                        <td>${person.Name || '-'}</td>
                        <td>${person.Department || '-'}</td>
                        <td>${person.Designation || '-'}</td>
                        <td>${person["Email Id"] || '-'}</td>
                        <td>${person["Contact No"] || '-'}</td>
                        <td class="text-center">${isDefault ? '<i class="fa fa-check" style="color:#16a34a;"></i>' : '—'}</td>
                    </tr>`;
            });

            modalHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }
        if (resObj.EnquiryDetails?.length > 0) {
            modalHtml += `
                <div class="enq-details-section">
                    <div class="enq-details-section-head">
                        <h6>Product Details</h6>
                    </div>
                    <div class="enq-details-section-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-sm enq-details-table mb-0">
                                <thead>
                                    <tr>
                                        <th>Product Name</th>
                                        <th>Specification</th>
                                        <th>UOM</th>
                                        <th>Quantity</th>
                                        <th>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>`;

            $.each(resObj.EnquiryDetails, function (i, product) {
                modalHtml += `
                    <tr>
                        <td>${product["Product Name"] || '-'}</td>
                        <td>${product["Specification"] || '-'}</td>
                        <td>${product["UOM"] || '-'}</td>
                        <td>${product["Quantity"] || '-'}</td>
                        <td>${product["Remarks"] || '-'}</td>
                    </tr>`;
            });

            modalHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }
        if (resObj.EnquiryFollupDetails?.length > 0) {
            modalHtml += `
                <div class="enq-details-section">
                    <div class="enq-details-section-head">
                        <h6>Follow Up Details</h6>
                    </div>
                    <div class="enq-details-section-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-sm enq-details-table mb-0">
                                <thead>
                                    <tr>
                                        <th>Follow Up Date</th>
                                        <th>Follow Up Mode</th>
                                        <th>Next Follow Up Date</th>
                                        <th>Next Follow Up Mode</th>
                                        <th>Our Remarks</th>
                                        <th>Customer Remarks</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>`;

            $.each(resObj.EnquiryFollupDetails, function (i, product) {
                modalHtml += `
                    <tr>
                        <td>${product["FollowupDate"] || '-'}</td>
                        <td>${product["FollowupMode"] || '-'}</td>
                        <td>${product["NextFollowupDate"] || '-'}</td>
                        <td>${product["NextFollowupMode"] || '-'}</td>
                        <td>${product["Remark"] || '-'}</td>
                        <td>${product["CustomerRemark"] || '-'}</td>
                        <td>${product["Status"] || '-'}</td>
                    </tr>`;
            });

            modalHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }
        if (resObj.EnquiryMaster?.length > 0) {
            const data = resObj.EnquiryMaster[0];

            modalHtml += `
                <div class="enq-details-section">
                    <div class="enq-details-section-head">
                        <h6>Enquiry Information</h6>
                    </div>
                    <div class="enq-details-section-body">
                        <div class="enq-details-kv">
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Company Name</span>
                                <span class="enq-kv-val">${data.AccountDesp || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Enquiry Type</span>
                                <span class="enq-kv-val">${data.EnquiryTypeName || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Enquiry Date</span>
                                <span class="enq-kv-val">${data.EnquiryDate || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Status</span>
                                <span class="enq-kv-val">${data.Status || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Email</span>
                                <span class="enq-kv-val">${data.EMail || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Mobile No</span>
                                <span class="enq-kv-val">${data.MobileNo || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Phone No</span>
                                <span class="enq-kv-val">${data.PhoneNo || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Website</span>
                                <span class="enq-kv-val">${data.Website || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Country</span>
                                <span class="enq-kv-val">${data.Nation || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">State</span>
                                <span class="enq-kv-val">${data.State || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">City</span>
                                <span class="enq-kv-val">${data.City || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Pin Code</span>
                                <span class="enq-kv-val">${data.PinCode || '—'}</span>
                            </div>
                            <div class="enq-kv-item enq-kv-full">
                                <span class="enq-kv-label">Address Line 1</span>
                                <span class="enq-kv-val">${data.Address1 || '—'}</span>
                            </div>
                            <div class="enq-kv-item enq-kv-full">
                                <span class="enq-kv-label">Address Line 2</span>
                                <span class="enq-kv-val">${data.Address2 || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Enquiry Source</span>
                                <span class="enq-kv-val">${data.LeadSourceDespName || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Reference By</span>
                                <span class="enq-kv-val">${data.ReferenceBy || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Reference Date</span>
                                <span class="enq-kv-val">${data.ReferenceDate || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Assigned Salesman</span>
                                <span class="enq-kv-val">${data.PersonName || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Next Followup Date</span>
                                <span class="enq-kv-val">${data.NextFollowupDate || '—'}</span>
                            </div>
                            <div class="enq-kv-item">
                                <span class="enq-kv-label">Next Followup Mode</span>
                                <span class="enq-kv-val">${data.NextFollowupMode || '—'}</span>
                            </div>
                            <div class="enq-kv-item enq-kv-full">
                                <span class="enq-kv-label">Remarks</span>
                                <span class="enq-kv-val">${data.Remark || '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (!modalHtml || !modalHtml.trim()) {
            modalHtml = '<p class="text-muted text-center py-4 mb-0" style="font-size:0.9rem;">No enquiry details to display.</p>';
        }

        $("#EnquiryDetailsModaldv").html(modalHtml);
        $("#EnquiryDetailsModal").modal('show');

    } catch (error) {
        toastr.error(error.Msg || 'An error occurred while fetching enquiry details');
    }
}

function CloseEnquiryDetails() {
    $("#EnquiryDetailsModal").modal('hide');
}

/** Main enquiry list grid: find "Next Follow Up Date" column index from header row */
function getEnquiryListNextFollowUpDateColumnIndex() {
    const headers = document.querySelectorAll("#table-header th");
    for (let i = 0; i < headers.length; i++) {
        // Collapse all whitespace and compare — handles "Next FollowUp Date", "Next Follow Up Date", etc.
        const t = (headers[i].textContent || "").replace(/\s+/g, "").toUpperCase();
        if (t.indexOf("NEXTFOLLOWUPDATE") !== -1) {
            return i;
        }
    }
    return -1;
}

function parseEnquiryListGridDateCell(text) {
    if (!text || !String(text).trim()) return null;
    const s = String(text).trim();
    if (!s) return null;

    // DD-MMM-YYYY  e.g. "22-Apr-2026"
    const dmy = s.match(/^(\d{1,2})[-\/\s]([A-Za-z]{3})[-\/\s](\d{4})$/);
    if (dmy) {
        const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
        const m = months[dmy[2].toLowerCase()];
        if (m !== undefined) {
            const d = new Date(parseInt(dmy[3]), m, parseInt(dmy[1]));
            if (!isNaN(d.getTime()) && d.getFullYear() > 1900) return d;
        }
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const dmy2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy2) {
        const d = new Date(parseInt(dmy2[3]), parseInt(dmy2[2]) - 1, parseInt(dmy2[1]));
        if (!isNaN(d.getTime()) && d.getFullYear() > 1900) return d;
    }

    // ISO YYYY-MM-DD
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
        const d = new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]));
        if (!isNaN(d.getTime()) && d.getFullYear() > 1900) return d;
    }

    return null;
}

/** If Next Follow Up Date is strictly before today, highlight the whole row (light red) */
function applyEnquiryListOverdueNextFollowUpRowHighlight() {
    const tbody = document.getElementById("table-body");
    if (!tbody) return;
    const colIdx = getEnquiryListNextFollowUpDateColumnIndex();
    if (colIdx < 0) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rows = tbody.querySelectorAll("tr");
    rows.forEach(function (row) {
        row.classList.remove("enq-row-overdue");
        row.style.backgroundColor = "";
        const tds = row.querySelectorAll("td");
        if (tds.length <= colIdx) return;
        const cellText = tds[colIdx].textContent || "";
        const cellDate = parseEnquiryListGridDateCell(cellText);
        if (!cellDate) return;
        const cd = new Date(cellDate.getTime());
        cd.setHours(0, 0, 0, 0);
        if (cd.getFullYear() > 1900 && cd < today) {
            row.classList.add("enq-row-overdue");
        }
    });
}

(function initEnquiryListOverdueHighlightObserver() {
    var debounceTimer = null;
    function scheduleHighlight() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
            if (document.getElementById("dvLoad") && $("#dvLoad").is(":visible")) {
                applyEnquiryListOverdueNextFollowUpRowHighlight();
            }
        }, 50);
    }
    function attachObserver() {
        var tbody = document.getElementById("table-body");
        if (!tbody) {
            setTimeout(attachObserver, 300);
            return;
        }
        var observer = new MutationObserver(scheduleHighlight);
        observer.observe(tbody, { childList: true, subtree: true });
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", attachObserver);
    } else {
        attachObserver();
    }
})();



window.ViewAttachment = ViewAttachment;
window.ChangeContact = ChangeContact;
window.ChangeProduct = ChangeProduct;
window.BindUOMDropdownsInGrid = BindUOMDropdownsInGrid;
window.BindItemDropdownsInGrid = BindItemDropdownsInGrid;
window.AddNewProductRow = AddNewProductRow;
window.SetUOMValue = SetUOMValue;
window.GetUOMValue = GetUOMValue;
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
window.ResetEnquiryFollowUp = ResetEnquiryFollowUp;
window.BackEnquiry = BackEnquiry;
window.WhatsApp = WhatsApp;
// ─── Enquiry Configuration Modal ──────────────────────────────────────────────

function ShowEnquiryConfigurationModal() {
    var $leadDiv   = $('#DivChkLeadStatusConfig');
    var $statusDiv = $('#DivChkStatusConfig');
    var $saveBtn   = $('#btnSaveEnquiryConfig');

    $leadDiv.html('<span class="text-muted" style="font-size:12px;">Loading…</span>');
    $statusDiv.html('<span class="text-muted" style="font-size:12px;">Loading…</span>');
    $saveBtn.prop('disabled', true);

    // Reset mandatory checkboxes
    $('#chkMandatoryAddress').prop('checked', false);
    $('#chkMandatoryPinCode').prop('checked', false);
    $('#chkMandatoryIndustryType').prop('checked', false);
    $('#chkMandatoryPhoneNo').prop('checked', false);
    $('#chkMandatoryEmail').prop('checked', false);

    $("#EnquiryConfigurationModal").modal({ backdrop: 'static' });
    $("#EnquiryConfigurationModal").modal('show');

    // Load all three in parallel: saved config + both dropdown lists
    Promise.all([
        LeadMasterService.GetEnquiryMasterConfig().catch(function () { return null; }),
        LeadMasterService.GetLeadStatuslist().catch(function () { return []; }),
        LeadMasterService.GetStatuslist().catch(function () { return []; })
    ]).then(function (results) {
        var config     = results[0];
        var leadList   = results[1] || [];
        var statusList = results[2] || [];

        // Normalise saved config (API may return array or object)
        var rawCfg = {};
        if (Array.isArray(config) && config.length > 0) rawCfg = config[0];
        else if (config && typeof config === 'object') rawCfg = config;

        // Case-insensitive property lookup helper
        function cfgVal(key) {
            if (!rawCfg) return '';
            var lk = key.toLowerCase();
            var found = Object.keys(rawCfg).find(function (k) { return k.toLowerCase() === lk; });
            return found ? (rawCfg[found] || '') : '';
        }

        // ── Mandatory field checkboxes ────────────────────────────────────
        $('#chkMandatoryAddress').prop('checked',      cfgVal('isMandatoryAddress').toUpperCase()      === 'Y');
        $('#chkMandatoryPinCode').prop('checked',      cfgVal('isMandatoryPinCode').toUpperCase()      === 'Y');
        $('#chkMandatoryIndustryType').prop('checked', cfgVal('isMandatoryIndustryType').toUpperCase() === 'Y');
        $('#chkMandatoryPhoneNo').prop('checked',      cfgVal('isMandatoryPhoneNo').toUpperCase()      === 'Y');
        $('#chkMandatoryEmail').prop('checked',        cfgVal('isMandatoryEmail').toUpperCase()        === 'Y');

        // ── Default Lead Status — radio buttons ───────────────────────────
        var savedLead = cfgVal('defaultLeadType').trim().toLowerCase();
        if (!leadList.length) {
            $leadDiv.html('<span class="text-muted" style="font-size:12px;">No data found.</span>');
        } else {
            var html = '';
            $.each(leadList, function (i, item) {
                var val   = (item.Value || item.value || item.Desp || item.desp || '').trim();
                var label = item.Value  || item.Desp  || item.desp || val;
                var uid   = 'rdoLead_' + i;
                var chk   = (val && val.toLowerCase() === savedLead) ? 'checked' : '';
                html += '<div class="col-6">'
                      + '<input type="radio" name="rdoEnqLeadStatus" id="' + uid + '" value="' + val + '" ' + chk
                      + ' onchange="SaveEnquiryConfig()" />'
                      + '&nbsp;<label for="' + uid + '">' + label + '</label>'
                      + '</div>';
            });
            $leadDiv.html(html);
        }

        // ── Default Status — radio buttons ────────────────────────────────
        var savedStatus = cfgVal('defaultStatus').trim().toLowerCase();
        if (!statusList.length) {
            $statusDiv.html('<span class="text-muted" style="font-size:12px;">No data found.</span>');
        } else {
            var html2 = '';
            $.each(statusList, function (i, item) {
                var val   = (item.Value || item.value || item.Desp || item.desp || '').trim();
                var label = item.Value  || item.Desp  || item.desp || val;
                var uid   = 'rdoStatus_' + i;
                var chk   = (val && val.toLowerCase() === savedStatus) ? 'checked' : '';
                html2 += '<div class="col-6">'
                       + '<input type="radio" name="rdoEnqStatus" id="' + uid + '" value="' + val + '" ' + chk
                       + ' onchange="SaveEnquiryConfig()" />'
                       + '&nbsp;<label for="' + uid + '">' + label + '</label>'
                       + '</div>';
            });
            $statusDiv.html(html2);
        }

        $saveBtn.prop('disabled', false);
    });
}

function SaveEnquiryConfig() {
    var $saveBtn = $('#btnSaveEnquiryConfig');
    $saveBtn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Saving…');

    var payload = [{
        isMandatoryAddress:      $('#chkMandatoryAddress').is(':checked')      ? 'Y' : 'N',
        isMandatoryPinCode:      $('#chkMandatoryPinCode').is(':checked')      ? 'Y' : 'N',
        isMandatoryIndustryType: $('#chkMandatoryIndustryType').is(':checked') ? 'Y' : 'N',
        isMandatoryPhoneNo:      $('#chkMandatoryPhoneNo').is(':checked')      ? 'Y' : 'N',
        isMandatoryEmail:        $('#chkMandatoryEmail').is(':checked')        ? 'Y' : 'N',
        defaultLeadType:  $('input[name="rdoEnqLeadStatus"]:checked').val() || '',
        defaultStatus:    $('input[name="rdoEnqStatus"]:checked').val()     || ''
    }];

    LeadMasterService.SaveEnquiryMasterConfig(payload).then(function (res) {
        $saveBtn.prop('disabled', false).html('<i class="fa fa-floppy-disk"></i> Save');
        if (res && (res.Status === 'Y' || res.status === 'Y' || res.Status === 'S')) {
            toastr.success(res.Msg || res.msg || 'Configuration saved successfully.');
        } else if (res && (res.Status === 'N' || res.status === 'N')) {
            toastr.error(res.Msg || res.msg || 'Failed to save configuration.');
        } else {
            toastr.success('Configuration saved successfully.');
        }
    }).catch(function () {
        $saveBtn.prop('disabled', false).html('<i class="fa fa-floppy-disk"></i> Save');
        toastr.error('An error occurred while saving configuration.');
    });
}
// ──────────────────────────────────────────────────────────────────────────────

window.GetEnquiryDetailsForViewByCode = GetEnquiryDetailsForViewByCode;
window.CloseEnquiryDetails = CloseEnquiryDetails;
window.ShowEnquiryConfigurationModal = ShowEnquiryConfigurationModal;
window.SaveEnquiryConfig = SaveEnquiryConfig;
window.BackFolloupMaster = BackFolloupMaster;