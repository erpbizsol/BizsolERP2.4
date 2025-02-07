import { FixedParameterQtyConfigService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/FixedParameterQtyConfigService.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');

const Indx_Tbl = {
    ParameterName: 0,
    ParameterValue: 1
}
$(document).ready(function () {
    $("#ERPHeading").text("QTY Configuration");

    GetFixedParameterQtyConfigFields();

    $('#btnBack').click(function (e) {
        window.location = baseUrl + "/";
    });
    $('#btnSubmit').click(function (e) {
        SaveData();
    });
});
function GetFixedParameterQtyConfigFields() {

    FixedParameterQtyConfigService.GetFixedParameterQtyConfigFields().then(function (response) {
        if (response.length > 0) {
            var tbItemConsumeRowNo = 0;
            var tbody = $('#tblFixedParameterList tbody');
            var theadRow = $('#tblFixedParameterList thead tr')[0];
            // Clear any existing rows
            tbody.empty();

            response.forEach(function (item, index) {

                var tbItemConsumeRowNo = index + 1;

                var td_ParameterName = item.FieldDescription;

                if (item.DataType == 'S') {
                    if (item.Update_Y_N_Applicaple == 'Y') {
                        var bChecked = item.AttributeValue == 'Y' ? 'checked' : '';


                        var td_ParameterValue = `<div class="d-flex flex-wrap gap-2">
                                   <input type="checkbox" id="btnToggle_${item.FixedParameterFieldName}" name="${item.FixedParameterFieldName}"  switch="success" ${bChecked} onchange="SetParameters();">
                                   <label for="btnToggle_${item.FixedParameterFieldName}"  data-on-label="Yes" data-off-label="No"></label></div>`;

                    } else {
                        if (item.FixedParameterFieldName == 'Unit') {
                            var td_ParameterValue = `<input type="text" id="txtParameterValue_` + tbItemConsumeRowNo + `" list="listUnit"  value="${item.AttributeValue}" name="${item.FixedParameterFieldName}" maxlength="${item.FieldMaxLen}" onchange="SetParameters();"  class="BizSolFormControl box_border form-control form-control-sm"  placeholder=""  autocomplete="off"  required  onclick="$(this).val(\'\')" >`;

                        } else {
                            var td_ParameterValue = `<input type="text" id="txtParameterValue_` + tbItemConsumeRowNo + `"  value="${item.AttributeValue}" name="${item.FixedParameterFieldName}" maxlength="${item.FieldMaxLen}" onchange="SetParameters();" class="BizSolFormControl box_border form-control form-control-sm"  placeholder=""  autocomplete="off"  required>`;

                        }

                    }
                } else if (item.DataType == 'N') {
                    var FieldMaxLength = item.DecimalDigit > 0 ? item.FieldMaxLen + item.DecimalDigit + 1 : item.FieldMaxLen;

                    var td_ParameterValue = `<input type="number" id="txtParameterValue_` + tbItemConsumeRowNo + `" maxlength="${FieldMaxLength}" name="${item.FixedParameterFieldName}" value="${item.AttributeValue}"   class="BizSolFormControl box_border form-control form-control-sm" placeholder=""  autocomplete="off"  required>`;

                } else {
                    var td_ParameterValue = '';
                }



                var row = `
                          <tr>
                            <td>${td_ParameterName}   </td>
                            <td>${td_ParameterValue}   </td>
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

function SaveData() {
    if (ValidateData() == false) {
        return false;
    }
    //var ObjCurrRow = $(x).closest('tr');
    var FixedParameterConfigData = [];

  
    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var userMasterCode = authKeyData.UserMaster_Code;

    //FixedParameterConfigRow["FieldName"] = $(x)[0].name;
    //FixedParameterConfigRow["Value"] = $(x)[0].value;
    //FixedParameterConfigRow["UserMaster_Code"] = userMasterCode;

    //var FixedParameterFieldDesp = ObjCurrRow.find('td:eq(' + Indx_Tbl.ParameterName + ')')[0].innerHTML.trim();
    //const alertCls = confirm("Are you sure you want to Change the value of " + FixedParameterFieldDesp + " = " + $(x)[0].value + " ?");
    //if (alertCls) {

    //} else {
    //    window.location = baseUrl + "/Configuration/FixedParameterQtyConfig/FixedParameterQtyConfig";
    //    return false;
    //}
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

    const alertCls = confirm("Are you sure you want to Change the Configuration ?");
    if (alertCls) {

    } else {
        window.location = baseUrl + "/Configuration/FixedParameterQtyConfig/FixedParameterQtyConfig";
        return false;
    }
    FixedParameterQtyConfigService.SaveFixedParameterQtyConfig(FixedParameterConfigData).then(function (response) {

        if (response != '') {
            if (response.Status == 'N') {
                toastr.error(response.Msg);
            } else {
                toastr.success(response.Msg);
                setTimeout(function () {

                    window.location = baseUrl + "/Configuration/FixedParameterQtyConfig/FixedParameterQtyConfig";
                }, 2000); // 2 seconds delay before redirect

            }

        }

    });

}

function SetParameters() {

    var FieldArray = ['QtyMT', 'QtyPC', 'QtyMR'];
    var RateUnitValue = '';
    $("#tblFixedParameterList tbody tr").each(function (index, row) {
        var inputobj = $(this).find('td:eq(' + Indx_Tbl.ParameterValue + ')')[0].getElementsByTagName('input')[0];

        if (inputobj.name != undefined && inputobj.value != '' && ($.inArray(inputobj.name, FieldArray) !== -1)) {

               RateUnitValue += inputobj.value + '/';
           
        } else if (inputobj.name != undefined && inputobj.name == 'RateUnit') {
            $('#tblFixedParameterList  input[name="RateUnit"]').prop('disabled', true);
            $('#tblFixedParameterList  input[name="RateUnit"]').val(RateUnitValue.slice(0, -1));

        }  else {

        }

    });

}
function ValidateData() {
    return true;
}

window.SaveData = SaveData;
window.SetParameters = SetParameters;
