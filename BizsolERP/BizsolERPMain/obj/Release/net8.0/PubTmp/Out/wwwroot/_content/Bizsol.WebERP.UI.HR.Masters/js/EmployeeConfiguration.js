import { EmployeeConfigurationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/EmployeeConfigurationService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';


var baseUrl = sessionStorage.getItem('AppBaseURL');

$(document).ready(function () {
    $("#ERPHeading").text("Employee Configuration");
    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var UserMaster_Code = authKeyData.UserMaster_Code;

    PopulateData();
    SetControls();
    $('#toggleStdPrefix').on('change', function () {

        var toggleStdPrefix = $('#toggleStdPrefix').is(':checked');

        if (toggleStdPrefix == true) {
            $('#txtStdPrefix').prop("disabled", false);
        } else {
            $('#txtStdPrefix').prop("disabled", true);
            $('#txtStdPrefix').val('');
        }

    });
    $('#btnBack').click(function (e) {

        window.location = baseUrl + "/HRMasters/EmployeeMaster/EmployeeList";

    });
});

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
        width: ddlwidth,
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

function PopulateData() {
    EmployeeConfigurationService.GetPrefixOptionList().then(function (response) {
        var defaultValue = '';
        if (response.length > 0) {

            var arrayList_PrefixOption = [];
            response = response.map((item) => ({
                key: item.Code, value: item.PrefixOption
            }));
            arrayList_PrefixOption = response;

            BindSelect2FromDataList($('#ddlPrefix1'), arrayList_PrefixOption, "FirstItemZero", "100%")
            BindSelect2FromDataList($('#ddlPrefix2'), arrayList_PrefixOption, "FirstItemZero", "100%")
            BindSelect2FromDataList($('#ddlPrefix3'), arrayList_PrefixOption, "FirstItemZero", "100%")

            ////////////
            EmployeeConfigurationService.GetDuplicateCardNoOptionList().then(function (response) {
                var defaultValue = '';
                if (response.length > 0) {

                    var arrayList_DuplicateCardNo = [];
                    response = response.map((item) => ({
                        key: item.Code, value: item.DupCardOption
                    }));
                    arrayList_DuplicateCardNo = response;

                    BindSelect2FromDataList($('#ddlDupCardNo'), arrayList_DuplicateCardNo, "FirstItemZero", "100%")

                    ////////////////
                    EmployeeConfigurationService.GetConfigEmployeeMaster().then(function (response) {
                        var defaultValue = '';
                        if (response.length > 0) {
                            $('#txtCode').val(response[0].Code);
                            $('#txtEmpMasterCount').val(response[0].PlanUserName);
                            $('#txtStdPrefix').val(response[0].STDPrefix);
                            $('#txtAadharCardHeader').val(response[0].AadharNoHeader);
                            $('#txtAadharCardMinLen').val(response[0].AadharNoMinLength);
                            $('#txtAadharCardMaxLen').val(response[0].AadharNoMaxLength);
                            $('#txtLocation').val('');
                            $('#txtSalaryLimitPF').val(response[0].SalaryLimitForPF);
                            $('#txtEmpSkill').val(response[0].EmployeeSkill);
                            $('#txtEmpGrade').val(response[0].EmployeeGrade);
                            $('#txtEmpCategory').val(response[0].Category);

                            $('#txtBasicSalaryHeader').val(response[0].BasicSalaryHeader);
                            $('#txtHRAHeader').val(response[0].HRAHeader);
                            $('#txtDAHeader').val(response[0].DAHeader);
                            $('#txtConveyanceHeader').val(response[0].ConveyanceHeader);

                            $('#txtUID2Header').val(response[0].UIDHeader);
                            $('#txtUID2MinLen').val(response[0].UIDMinLength);
                            $('#txtUID2MaxLen').val(response[0].UIDMaxLength);
                           

                            BizSolHelperFunction.SelectOptionByText('ddlPrefix1', response[0].PrefixOption1);
                            BizSolHelperFunction.SelectOptionByText('ddlPrefix2', response[0].PrefixOption2);
                            BizSolHelperFunction.SelectOptionByText('ddlPrefix3', response[0].PrefixOption3);
                            BizSolHelperFunction.SelectOptionByText('ddlPrefixSep', response[0].PrefixSeparator);
                            BizSolHelperFunction.SelectOptionByText('ddlCardNo', response[0].CardNoAutoManual);
                            BizSolHelperFunction.SelectOptionByText('ddlDupCardNo', response[0].DuplicateCardNo);
                            BizSolHelperFunction.SelectOptionByText('ddlAadharCardDataVal', response[0].AadharNoDateValue);
                            BizSolHelperFunction.SelectOptionByText('ddlUID2DataVal', response[0].UIDValue);
                            $('#toggleStdPrefix').prop("checked", response[0].STDPrefixMandatory == 'Y' ? true : false);
                            $('#toggleDupEmp').prop("checked", response[0].DuplicateEmpName == 'Y' ? true : false);
                            $('#toggleSubDeptApp').prop("checked", response[0].SubDepartmentApplicable == 'Y' ? true : false);
                            $('#togglePFApp').prop("checked", response[0].PFApplicable == 'Y' ? true : false);
                            $('#toggleESIApp').prop("checked", response[0].ESIApplicable == 'Y' ? true : false);
                            $('#toggleAskVPF').prop("checked", response[0].AskVPFRate == 'Y' ? true : false);
                            $('#toggleAadharCardCond').prop("checked", response[0].AadharNoHeaderMandatory == 'Y' ? true : false);
                            $('#toggleUID2Mandatory').prop("checked", response[0].UIDMandatory == 'Y' ? true : false);


                           
                            UpdateDropdownValues();
                            SetControls();
                        }
                    });
                }
            });
        }
    });
}

function SetControls() {
    var EmpMasterCount = $('#txtEmpMasterCount').val() == '' ? 0 : $('#txtEmpMasterCount').val();
    var toggleStdPrefix = $('#toggleStdPrefix').is(':checked');

    if (toggleStdPrefix == true) {
        $('#txtStdPrefix').prop("disabled", false);
    } else {
        $('#txtStdPrefix').prop("disabled", true);
    }

    if (EmpMasterCount > 0) {
        $('#toggleStdPrefix').prop("disabled", true);
        $('#txtStdPrefix').prop("disabled", true);
        $('#ddlPrefix1').prop("disabled", true);
        $('#ddlPrefix2').prop("disabled", true);
        $('#ddlPrefix3').prop("disabled", true);
        $('#ddlPrefixSep').prop("disabled", true);
        $('#ddlCardNo').prop("disabled", true);
        $('#ddlDupCardNo').prop("disabled", true);
       
    }
}

function ValidateData() {
    var Valid = true;
    var toggleStdPrefix = $('#toggleStdPrefix').is(':checked');

    if (toggleStdPrefix == true) {

        if ($('#txtStdPrefix').val() == undefined || $('#txtStdPrefix').val() == '') {
            toastr.error('Please enter Standard Prefix!');
            Valid= false;
        }
    } 

    return Valid;
}

function SaveData() {
    if (ValidateData() == false) {
        return false;
    }
    var EmpConfigData = [];
    var EmpConfigRow = {};

    EmpConfigRow["Code"] = $('#txtCode').val() == '' ? 0 : $('#txtCode').val();
    EmpConfigRow["STDPrefixMandatory"] = $('#toggleStdPrefix').is(':checked')  == true?'Y':'N';
    EmpConfigRow["STDPrefix"] = $('#txtStdPrefix').val() == '' ? '' : $('#txtStdPrefix').val();
    EmpConfigRow["PrefixOption1"] = $('#ddlPrefix1 option:selected').text() == null ? '' : $('#ddlPrefix1 option:selected').text();
    EmpConfigRow["PrefixOption2"] = $('#ddlPrefix2 option:selected').text() == null ? '' : $('#ddlPrefix2 option:selected').text();
    EmpConfigRow["PrefixOption3"] = $('#ddlPrefix3 option:selected').text() == null ? '' : $('#ddlPrefix3 option:selected').text();
    EmpConfigRow["PrefixSeparator"] = $('#ddlPrefixSep option:selected').text() == null ? '' : $('#ddlPrefixSep option:selected').text();
    EmpConfigRow["CardNoAutoManual"] = $('#ddlCardNo option:selected').text() == null || $('#ddlCardNo option:selected').text() == 'Auto' ? 'A' :'M';
    EmpConfigRow["DuplicateCardNo"] = $('#ddlDupCardNo option:selected').text() == null ? '' : $('#ddlDupCardNo option:selected').text();
    EmpConfigRow["DuplicateEmpName"] = $('#toggleDupEmp').is(':checked') == true?'Y':'N';

    EmpConfigRow["AadharNoHeaderMandatory"] = $('#toggleAadharCardCond').is(':checked') == true ? 'Y' : 'N';
    EmpConfigRow["AadharNoHeader"] = $('#txtAadharCardHeader').val() == '' ? 'Aadhar No' : $('#txtAadharCardHeader').val();
    EmpConfigRow["AadharNoDateValue"] = $('#ddlAadharCardDataVal option:selected').text() == null ? '' : $('#ddlAadharCardDataVal option:selected').text();
    EmpConfigRow["AadharNoMinLength"] = $('#txtAadharCardMinLen').val() == '' ? 0 : parseInt($('#txtAadharCardMinLen').val());
    EmpConfigRow["AadharNoMaxLength"] = $('#txtAadharCardMaxLen').val() == '' ? 0 : parseInt($('#txtAadharCardMaxLen').val());
    EmpConfigRow["UIDMandatory"] = $('#toggleUID2Mandatory').is(':checked') == true ? 'Y' : 'N';
    EmpConfigRow["UIDHeader"] = $('#txtUID2Header').val() == '' ? '' : $('#txtUID2Header').val();
    EmpConfigRow["UIDValue"] = $('#ddlUID2DataVal option:selected').text() == null ? '' : $('#ddlUID2DataVal option:selected').text();
    EmpConfigRow["UIDMinLength"] = $('#txtUID2MinLen').val() == '' ? 0 : parseInt($('#txtUID2MinLen').val());
    EmpConfigRow["UIDMaxLength"] = $('#txtUID2MaxLen').val() == '' ? 0 : parseInt($('#txtUID2MaxLen').val());

    EmpConfigRow["BasicSalaryHeader"] = $('#txtBasicSalaryHeader').val() == '' ? 'Basic Salary' : $('#txtBasicSalaryHeader').val();
    EmpConfigRow["HRAHeader"] = $('#txtHRAHeader').val() == '' ? 'HRA' : $('#txtHRAHeader').val();
    EmpConfigRow["DAHeader"] = $('#txtDAHeader').val() == '' ? 'DA' : $('#txtDAHeader').val();
    EmpConfigRow["ConveyanceHeader"] = $('#txtConveyanceHeader').val() == '' ? 'Conveyance' : $('#txtConveyanceHeader').val();
    EmpConfigRow["SubDepartmentApplicable"] = $('#toggleSubDeptApp').is(':checked') == true?'Y':'N';
    EmpConfigRow["PFApplicable"] = $('#togglePFApp').is(':checked') == true?'Y':'N';
    EmpConfigRow["SalaryLimitForPF"] = $('#txtSalaryLimitPF').val() == '' ? 0 : parseFloat($('#txtSalaryLimitPF').val());
    EmpConfigRow["ESIApplicable"] = $('#toggleESIApp').is(':checked') == true?'Y':'N';
    EmpConfigRow["AskVPFRate"] = $('#toggleAskVPF').is(':checked') == true?'Y':'N';
    EmpConfigRow["Category"] = $('#txtEmpCategory').val() == '' ? '' : $('#txtEmpCategory').val();
    EmpConfigRow["EmployeeSkill"] = $('#txtEmpSkill').val() == '' ? '' : $('#txtEmpSkill').val();
    EmpConfigRow["EmployeeGrade"] = $('#txtEmpGrade').val() == '' ? '' : $('#txtEmpGrade').val();

    EmpConfigData.push(EmpConfigRow);

    EmployeeConfigurationService.SaveConfigEmployeeMaster(EmpConfigData).then(function (response) {

        if (response != '') {
            if (response.Status == 'N') {
                toastr.error(response.Msg);
            } else {

                toastr.success(response.Msg);
                PopulateData();
            }

        }

    });
}

function UpdateDropdownValues() {
    // Get the selected values from all dropdowns
    const selected1 = $('#ddlPrefix1').val();
    const selected2 = $('#ddlPrefix2').val();
    const selected3 = $('#ddlPrefix3').val();

    // Get the selected values from all other dropdowns
    const selectedValues = [selected1, selected2, selected3];
    const valueToRemove = '0';
    const updatedArray = selectedValues.filter(item => item !== valueToRemove);

    // Update options in all dropdowns based on selected values
    $('#ddlPrefix1 option').each(function () {
        const value = $(this).val();
        if (updatedArray.includes(value) && value !== selected1 ) {
            $(this).prop('disabled', true); // Disable option in dropdown1 if selected in another dropdown
        } else {
            $(this).prop('disabled', false); // Enable the option if not selected in another dropdown
        }
    });

    $('#ddlPrefix2 option').each(function () {
        const value = $(this).val();
        if (updatedArray.includes(value) && value !== selected2 ) {
            $(this).prop('disabled', true); // Disable option in dropdown2 if selected in another dropdown
        } else {
            $(this).prop('disabled', false); // Enable the option if not selected in another dropdown
        }
    });

    $('#ddlPrefix3 option').each(function () {
        const value = $(this).val();
        if (updatedArray.includes(value) && value !== selected3 ) {
            $(this).prop('disabled', true); // Disable option in dropdown3 if selected in another dropdown
        } else {
            $(this).prop('disabled', false); // Enable the option if not selected in another dropdown
        }
    });

    // Re-initialize Select2 to apply changes
    $('.select2').trigger('change');
}
window.SaveData = SaveData;

window.UpdateDropdownValues = UpdateDropdownValues;