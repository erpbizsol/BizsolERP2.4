import { DealerMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/DealerMasterService.js';
import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';

var baseUrl = sessionStorage.getItem('AppBaseURL');

CRMReportsServices.GetSalespersonList().then(function (response) {
    if (response && response.length > 0) {
        BindSelectList($('#ddlSalePerson'), response.map((item) => ({ Code: item.Code, Desp: item.PersonName })));
    } 
}).catch(function (error) {
    console.error('Error fetching salesperson list:', error);
});

function BindSelectList(element, arrayList) {
    element.empty();

    
   element.append(new Option("Select", "0"));
    


    // Get the options from the datalist and append them to Select2
    $.each(arrayList, function (index, item) {
        // Append new option elements (key as value and value as text)
        element.append(new Option(item.Desp, item.Code));
    });

    if (param_Mode == 'View' && param_DealerMaster_Code > 0) {
        $('#ddlSalePerson').prop('disabled', true);
        $('#chkIsActive').prop('disabled', true);
    }
    // Trigger a change event to update Select2 UI
    // element.trigger('change');

    element.select2({
        //// allowClear: true,
        width: 'resolve',
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

$(document).ready(function () {
	
	$("#ERPHeading").text("Dealer Master");
	
	$("#txtDistributor").val(param_Distributor_Name);
    $("#hfAccountMaster_Code").val(param_Distributor_Code);
    $("#hfCode").val(param_DealerMaster_Code);

    GetCityList('India', 'All');

    $('#txtCity').on('change', function () {
        GetCityDetailsByName();
        var selectedValue = $(this).val();  // Get the selected value from the input

        // Loop through the options in the datalist
        $('#listCity option').each(function () {
            if ($(this).val() === selectedValue) {
                // Get the code (data-code attribute)
                var selectedCode = $(this).data('code');

                // Set the code in the hidden textbox
                $('#hdntxtCity').val(selectedCode);
            }
        });
    });

    $('#btnBack').click(function (e) {
        window.location = baseUrl + "/MarketingMasters/DealerMaster/DealerMasterList";
    });

    $('#btnSubmit').click(function (e) {
        SaveData();
    });

    if (param_DealerMaster_Code > 0) {
        GetEditDealerMasterDetails(param_DealerMaster_Code);
    }
    //DisableControls();
});
function GetCityList(CountryName, StateName) {
    DealerMasterService.GetCityList(CountryName, StateName).then(function (response) {

        if (response.length > 0) {
            $('#listCity option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {

                option += '<option data-code="' + response[i].Code + '">' + response[i].CityName + '</option>'
                
            }
            $('#listCity')[0].innerHTML = option;


        }


    });
}
function GetCityDetailsByName() {
    
    var Mode = 'CityMasterByName';
    var CityName = $('#txtCity').val();
    DealerMasterService.GetCityDetailsByName(CityName, Mode).then(function (response) {

        if (response != null) {
            var StateName = response.StateName;
            $('#txtState').val(StateName);
            $('#hdntxtState').val(response.StateMaster_Code);



        }

    });
}
function SaveData() {
    if (ValidateData() == false) {
        return false;
    }

    let DealerMasterData = [];

    let DealerMasterRow = {};

    let authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    let UserMaster_Code = authKeyData.UserMaster_Code;

    let AccountDesp = $("#txtDistributor").val();
    let DealerName = $("#txtName").val();
    let Address = $("#txtAddress").val();
    let CityName = $("#txtCity").val();
    let StateName = $("#txtState").val();
    let MobileNo = $("#txtMobileNo").val();
    let Email = $("#txtEmail").val();
    let ddlSalePerson = $("#ddlSalePerson").val();
    let IsActive = 'N';
    if ($('#chkIsActive').is(':checked')) {
        IsActive = 'Y';
    }

    DealerMasterRow["Code"] = param_DealerMaster_Code;
    DealerMasterRow["DealerName"] = DealerName;
    DealerMasterRow["AccountMaster_Code"] = param_Distributor_Code;
    DealerMasterRow["Address"] = Address;
    DealerMasterRow["CityMaster_Code"] = $('#hdntxtCity').val() == undefined || $('#hdntxtCity').val() == '' ? 0 : $('#hdntxtCity').val();
    DealerMasterRow["StateMaster_Code"] = $('#hdntxtState').val() == undefined || $('#hdntxtState').val() == '' ? 0 : $('#hdntxtState').val();
    DealerMasterRow["MobileNo"] = MobileNo;
    DealerMasterRow["EmailId"] = Email;
    DealerMasterRow["CreatedBy"] = UserMaster_Code;
    DealerMasterRow["CreatedDate"] = new Date().toISOString().split("T")[0];
    DealerMasterRow["UpdatedBy"] = UserMaster_Code;
    DealerMasterRow["UpdatedDate"] = new Date().toISOString().split("T")[0];
    DealerMasterRow["MarketingManMaster_Code"] = ddlSalePerson;
    DealerMasterRow["IsActive"] = IsActive;


    DealerMasterData.push(DealerMasterRow);

    DealerMasterService.SaveDealerMaster(DealerMasterData).then(function (response) {

        if (response != '') {
            if (response.Status == 'N') {
                toastr.error(response.Msg);
            } else {
                var Code = response.Code == undefined || response.Code == '' ? 0 : response.Code;
                toastr.success(response.Msg);
                setTimeout(function () {
                    
                    window.location = baseUrl + "/MarketingMasters/DealerMaster/DealerMasterList";
                }, 2000); // 2 seconds delay before redirect

            }

        }

    });

}

function ValidateData() {
    var Valid = true;
    var MsgStr = "";
    var newLine = "<br>";
    var AccountDesp  =$("#txtDistributor").val();
    var DealerName  =$("#txtName").val();
    var Address  =$("#txtAddress").val();
    var CityName  =$("#txtCity").val();
    var StateName  =$("#txtState").val();
    var MobileNo = $("#txtMobileNo").val();
    var Email = $("#txtEmail").val();
    var ddlSalePerson = $("#ddlSalePerson").val();

    if (AccountDesp == "") {

        MsgStr += "* Please Select Distributor Name!" + newLine;
        Valid = false;
    }
    if (DealerName == "") {

        MsgStr += "* Please Enter Dealer Name!" + newLine;
        Valid = false;
    }
    if (Address == "") {

        MsgStr += "* Please Enter Address!" + newLine;
        Valid = false;
    }
    if (CityName == "") {

        MsgStr += "* Please Select City Name!" + newLine;
        Valid = false;
    }
    if (MobileNo == "") {

        MsgStr += "* Please Enter Mobile No!" + newLine;
        Valid = false;
    }
    if (Email != "") {
        const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

        if (regex.test(Email) == false) {
            MsgStr += "* Email not valid! Ex. some@uk.in" + newLine;
            Valid = false;
        }
    }
    if (ddlSalePerson == "0") {
        MsgStr += "* Please Select Sales Person!" + newLine;
        Valid = false;
    }

    if (Valid == false) {
        toastr.error(MsgStr);
        return false;
    }

}

function GetEditDealerMasterDetails(param_DealerMaster_Code) {
    DealerMasterService.GetDealerMasterByCode(param_DealerMaster_Code).then(function (response) {

        if (response != null) {
           
            $("#txtDistributor").val(param_Distributor_Name);
            $("#hfAccountMaster_Code").val(response.AccountMaster_Code);
            $("#txtName").val(response.DealerName);
            $("#txtAddress").val(response.Address);
            $("#txtCity").val(response.CityName);
            $("#txtState").val(response.StateName);
            $("#txtMobileNo").val(response.MobileNo);
            $("#txtEmail").val(response.EmailId);
            $("#hdntxtCity").val(response.CityMaster_Code);
            $("#hdntxtState").val(response.StateMaster_Code);
            $("#ddlSalePerson").val(response.MarketingManMaster_Code);
            $("#ddlSalePerson").select2();

            if (response.IsActive == 'Y') {
                $("#chkIsActive")[0].checked = true;
            } else {
                $("#chkIsActive")[0].checked = false;
            }
            DisableControls();
        }

    });
}
function DisableControls() {
    if (param_Mode == 'View' && param_DealerMaster_Code > 0) {
        $('input, textarea').prop('disabled', true);
        $('a').addClass('disabled');
        $("#btnBack").prop("disabled", false);

    }
    
}
window.GetCityDetailsByName = GetCityDetailsByName;
window.SaveData = SaveData;
