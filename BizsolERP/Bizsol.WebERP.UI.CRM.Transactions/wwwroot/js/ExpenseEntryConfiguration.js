import { ExpenseEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseEntryService.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');

const Indx_Tbl = {
    ParameterName: 0,
    ParameterValue: 1
}
$(document).ready(function () {
    $("#ERPHeading").text("Expense Entry Configuration");

    //GetRateUnitListFromQtyConfig();
    $('#btnBack').click(function (e) {
        window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryList";
    });
    $('#btnSubmit').click(function (e) {
        //SaveData();
    });

});
function GetRateUnitListFromQtyConfig() {
    ExpenseEntryService.GetFixedParameterQtyConfig().then(function (response) {

        if (response.length > 0) {
            var inputString = response[0].RateUnit;

            // Split the string by "/" and store it in an array
            var response1 = inputString.split('/');

            $('#listUOMVerify option').empty();
            $('#listUOMVerify').empty();
            $.each(response1, function (index, value) {
                // Create a new <option> element for each item

                $("#listUOMVerify").append($('<option>', {
                    value: value
                }));
            });

            GetStockOptionList();
            GetCRMFixedParameterConfigFields();
        }
    });
}

function GetCRMFixedParameterConfigFields() {

    ExpenseEntryService.GetCRMFixedParameterConfigFields().then(function (response) {
        if (response.length > 0) {
            var tbItemConsumeRowNo = 0;
            var tbody = $('#tblFixedParameterList tbody');
            var theadRow = $('#tblFixedParameterList thead tr')[0];
            // Clear any existing rows
            tbody.empty();

            response.forEach(function (item, index) {

                var tbItemConsumeRowNo = index + 1;

                var td_ParameterName = item.FieldDescription;
                var td_ParameterDetails = item.FieldDetails;

                if (item.DataType == 'S') {
                    if (item.Update_Y_N_Applicaple == 'Y') {

                        var bChecked = item.AttributeValue == 'Y' ? 'checked' : '';


                        var td_ParameterValue = `<div class="d-flex flex-wrap gap-2">
                                   <input type="checkbox" id="btnToggle_${item.FixedParameterFieldName}" name="${item.FixedParameterFieldName}"  switch="success" ${bChecked} onchange="SetParameters();">
                                   <label for="btnToggle_${item.FixedParameterFieldName}"  data-on-label="Yes" data-off-label="No"></label></div>`;

                    } else {
                        if (item.FixedParameterFieldName == 'ShowDeliveryDate') {
                            var td_ParameterValue = `<input type="text" id="txtParameterValue_` + tbItemConsumeRowNo + `" list="listShowDeliveryDate"  value="${item.AttributeValue}" name="${item.FixedParameterFieldName}" maxlength="${item.FieldMaxLen}" onchange="SetParameters();"  class="BizSolFormControl box_border form-control form-control-sm"  placeholder=""  autocomplete="off"  required  onclick="$(this).val(\'\')" >`;

                        } else if (item.FixedParameterFieldName == 'ShowStock') {
                            var td_ParameterValue = `<input type="text" id="txtParameterValue_` + tbItemConsumeRowNo + `" list="listShowStock"  value="${item.AttributeValue}" name="${item.FixedParameterFieldName}" maxlength="${item.FieldMaxLen}" onchange="SetParameters();" class="BizSolFormControl box_border form-control form-control-sm"  placeholder=""  autocomplete="off"  required  onclick="$(this).val(\'\')" >`;

                        } else if (item.FixedParameterFieldName == 'ShowUOM') {
                            var td_ParameterValue = `<input type="text" id="txtParameterValue_` + tbItemConsumeRowNo + `" list="listShowUOM"  value="${item.AttributeValue}" name="${item.FixedParameterFieldName}" maxlength="${item.FieldMaxLen}" onchange="SetParameters();" class="BizSolFormControl box_border form-control form-control-sm"  placeholder=""  autocomplete="off"  required  onclick="$(this).val(\'\')" >`;

                        } else if (item.FixedParameterFieldName == 'AskDiscountItemWise') {
                            var td_ParameterValue = `<input type="text" id="txtParameterValue_` + tbItemConsumeRowNo + `" list="listDiscount"  value="${item.AttributeValue}" name="${item.FixedParameterFieldName}" maxlength="${item.FieldMaxLen}" onchange="SetParameters();" class="BizSolFormControl box_border form-control form-control-sm"  placeholder=""  autocomplete="off"  required  onclick="$(this).val(\'\')" >`;

                        } else if (item.FixedParameterFieldName == 'UOMForVerifyDiscount') {
                            var td_ParameterValue = `<input type="text" id="txtParameterValue_` + tbItemConsumeRowNo + `" list="listUOMVerify"  value="${item.AttributeValue}" name="${item.FixedParameterFieldName}" maxlength="${item.FieldMaxLen}" onchange="SetParameters();" class="BizSolFormControl box_border form-control form-control-sm"  placeholder=""  autocomplete="off"  required  onclick="$(this).val(\'\')" >`;

                        } else {
                            var td_ParameterValue = `<input type="text" id="txtParameterValue_` + tbItemConsumeRowNo + `"  value="${item.AttributeValue}" name="${item.FixedParameterFieldName}" maxlength="${item.FieldMaxLen}" onchange="SetParameters();"  class="BizSolFormControl box_border form-control form-control-sm"  placeholder=""  autocomplete="off"  required>`;

                        }

                    }
                } else if (item.DataType == 'N') {
                    var FieldMaxLength = item.DecimalDigit > 0 ? item.FieldMaxLen + item.DecimalDigit + 1 : item.FieldMaxLen;

                    var td_ParameterValue = `<input type="number" id="txtParameterValue_` + tbItemConsumeRowNo + `" maxlength="${FieldMaxLength}" name="${item.FixedParameterFieldName}" value="${item.AttributeValue}" onchange="SetParameters();" class="BizSolFormControl box_border form-control form-control-sm" placeholder=""  autocomplete="off"  required>`;

                } else {
                    var td_ParameterValue = '';
                }



                var row = `
                          <tr>
                            <td>${td_ParameterName}   </td>
                            <td>${td_ParameterValue}   </td>
                            <td>${td_ParameterDetails}   </td>
                          </tr>
                        `;
                tbody.append(row);
            });
            SetParameters();

        } else {
            toastr.error('No Data Found');
            return false;
        }
    });
}

function SetParameters() {
    $("#tblFixedParameterList tbody tr").each(function (index, row) {
        var inputobj = $(this).find('td:eq(' + Indx_Tbl.ParameterValue + ')')[0].getElementsByTagName('input')[0];

        if (inputobj.name != undefined && inputobj.name == 'ShowPriceFromPriceList') {

            if (inputobj.checked == true) {
                $('#btnToggle_AllowToChangeBasicRate').prop('checked', false);
                $('#btnToggle_AllowToChangeBasicRate').prop('disabled', true);

            } else {
                $('#btnToggle_AllowToChangeBasicRate').prop('disabled', false);

            }
        } else if (inputobj.name != undefined && inputobj.name == 'AskDiscountOnOrder') {
            if (inputobj.checked == true) {
                // $('#btnToggle_AskDiscountItemWise').prop('checked', false);
                $('#tblFixedParameterList  input[name="AskDiscountItemWise"]').prop('disabled', true);
            } else {
                $('#tblFixedParameterList  input[name="AskDiscountItemWise"]').prop('disabled', false);
            }


        } else if (inputobj.name != undefined && inputobj.name == 'ShowSizeThicknessColumns') {
            if (inputobj.checked == false) {
                // $('#btnToggle_AskDiscountItemWise').prop('checked', false);
                $('#tblFixedParameterList  input[name="RemoveMMFromParameterValue"]').prop('disabled', true);
            } else {
                $('#tblFixedParameterList  input[name="RemoveMMFromParameterValue"]').prop('disabled', false);
            }


        }

        //else if (inputobj.name != undefined && inputobj.name == 'AskDiscountItemWise') {
        //    if (inputobj.checked == true) {
        //        $('#btnToggle_AskDiscountOnOrder').prop('checked', false);
        //        //$('#tblFixedParameterList  input[name="LimitForVerifyDiscount"]').prop('disabled', false);
        //    } else {
        //        //$('#tblFixedParameterList  input[name="LimitForVerifyDiscount"]').prop('disabled', true);
        //    }

        //}
        else {

        }

    });

    //if ($('#btnToggle_AskDiscountOnOrder')[0].checked == false && $('#btnToggle_AskDiscountItemWise')[0].checked == false) {
    //    $('#tblFixedParameterList  input[name="LimitForVerifyDiscount"]').prop('disabled', true);
    //    $('#tblFixedParameterList  input[name="LimitForVerifyDiscount"]')[0].value=0;
    //} else {
    //    $('#tblFixedParameterList  input[name="LimitForVerifyDiscount"]').prop('disabled', false);
    //}
}


function SaveData() {
    if (ValidateData() == false) {
        return false;
    }
    //var ObjCurrRow = $(x).closest('tr');

    var FixedParameterConfigData = [];


    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var userMasterCode = authKeyData.UserMaster_Code;
    $("#tblFixedParameterList tbody tr").each(function (index, row) {
        var FixedParameterConfigRow = {};

        var inputobj = $(this).find('td:eq(' + Indx_Tbl.ParameterValue + ')')[0].getElementsByTagName('input')[0];
        var FixedParameterFieldName = inputobj.name;
        var FixedParameterFieldValue = '';

        if (inputobj.type == 'checkbox') {
            if (inputobj.checked == true) {
                FixedParameterFieldValue = 'Y';
            } else {
                FixedParameterFieldValue = 'N';
            }
        } else {
            FixedParameterFieldValue = $(this).find('td:eq(' + Indx_Tbl.ParameterValue + ')')[0].getElementsByTagName('input')[0].value;
        }


        //FixedParameterConfigRow[FixedParameterFieldName] = FixedParameterFieldValue;

        FixedParameterConfigRow["FieldName"] = FixedParameterFieldName;
        FixedParameterConfigRow["Value"] = FixedParameterFieldValue;
        FixedParameterConfigRow["UserMaster_Code"] = userMasterCode;

        FixedParameterConfigData.push(FixedParameterConfigRow);
    });


    //FixedParameterConfigRow["FieldName"] = $(x)[0].name;
    //FixedParameterConfigRow["Value"] = $(x)[0].value;
    //FixedParameterConfigRow["UserMaster_Code"] = userMasterCode;

    //var FixedParameterFieldDesp = ObjCurrRow.find('td:eq(' + Indx_Tbl.ParameterName + ')')[0].innerHTML.trim();

    //const alertCls = confirm("Are you sure you want to Change the value of " + FixedParameterFieldDesp + " = " + $(x)[0].value + " ?");

    const alertCls = confirm("Are you sure you want to Change the Configuration ?");
    if (alertCls) {

    } else {
        window.location = baseUrl + "/CRMTransactions/FixedParameterConfiguration/FixedParameterConfiguration";
        return false;
    }
    ExpenseEntryService.SaveCRMFixedParameterConfig(FixedParameterConfigData).then(function (response) {

        if (response != '') {
            if (response.Status == 'N') {
                toastr.error(response.Msg);
            } else {
                toastr.success(response.Msg);
                setTimeout(function () {

                    window.location = baseUrl + "/CRMTransactions/FixedParameterConfiguration/FixedParameterConfiguration";
                }, 2000); // 2 seconds delay before redirect

            }

        }

    });

}
function ValidateData() {
    return true;
}
function GetStockOptionList() {

    ExpenseEntryService.GetStockOptionList().then(function (response) {
        var defaultValue = '';

        if (response.length > 0) {
            $('#listShowStock option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                if (i == 1) {
                    defaultValue = response[1].AttributeValue;
                }
                option += '<option text="' + response[i].Attribute + '">' + response[i].AttributeValue + '</option>'
            }
            $('#listShowStock')[0].innerHTML = option;

        }

    });

}


window.SaveData = SaveData;
window.SetParameters = SetParameters;
window.GetStockOptionList = GetStockOptionList;