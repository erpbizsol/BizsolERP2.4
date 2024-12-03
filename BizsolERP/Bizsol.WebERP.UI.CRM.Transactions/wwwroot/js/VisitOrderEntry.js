import { VisitOrderEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VisitOrderEntryService.js';

var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

const Indx_TblOrder = {
    Consignee: 0,
    DeliveryAddress: 1,
    ItemName: 2,
    Size: 3,
    Thickness: 4,
    SizeDesp: 5,
    UOM: 6,
    Stock: 7,
    OrderQtyPC: 8,
    OrderQtyMT: 9,
    OrderQtyMTR: 10,
    OrderUOM: 11,
    OrderQTY: 12,
    BasicRate: 13,
    ExtraCharges: 14,
    OrderRate: 15,
    Amount: 16,
    DeliveryDate: 17,
    Remarks: 18,
    Delete: 19,
    VisitDetailsCode: 20,
    IsNewRow: 21,
    SizeApplicable: 22,
    ThkApplicable: 23,
    LenApplicable: 24
}

$(document).ready(function () {
    $("#ERPHeading").text("Direct Order Entry");
    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var UserMaster_Code = authKeyData.UserMaster_Code;
    GetUserDetails();
    // GetActualLocation();
    GetNestedDealerList();
    GetCRMFixedParameterConfig();

    $('#btnShow').click(function () {
        // Change the button text to "Loading..."
        $(this)
            .prop('hidden', true); // Disable the button to prevent multiple clicks
        //.html('<div class="spinner-border text-success m-1" role="status">< span class= "sr-only" > Loading...</span ></div > ');
        $('#btnLoading').prop('hidden', false);

        // Simulate a delay (e.g., waiting for an API call)
        setTimeout(function () {
            // Restore the button to its original state
            $('#btnShow')
                .prop('hidden', false);
            $('#btnLoading').prop('hidden', true);
            //.text('Show Stock');
        }, 3000); // Replace with your actual logic for completion
    });


    $('#btnAddNewRow').click(function (e) {
        //$('#divOrderBooking').scrollTop($('#divOrderBooking')[0].scrollHeight);

    });
});

function GetUserDetails() {

    VisitOrderEntryService.GetUserDetails().then(function (response) {

        if (response != null) {
            var UserName = response[0].UserName;
            $('#txtUserName').val(UserName);

        }

    });
}

function GetNestedDealerList() {
    VisitOrderEntryService.GetNestedDealerList().then(function (response) {

        if (response.length > 0) {
            $('#listdealer option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {

                option += '<option text="' + response[i].Code + '">' + response[i].AccountDesp + '</option>'
            }
            $('#listdealer')[0].innerHTML = option;

        }

    });
}

function GetItemMasterDropdown() {
    VisitOrderEntryService.GetItemMasterDropdown().then(function (response) {

        if (response.length > 0) {
            $('#listItem option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {

                option += '<option text="' + response[i].Code + '">' + response[i].ItemName + '</option>'
            }
            $('#listItem')[0].innerHTML = option;

        }

    });
}

function AddNewRow() {
    var AccountDesp = $("#txtDealer").val();
    if (AccountDesp == "") {
        toastr.error("Please Select Dealer Name!")
    }
    //var table = document.getElementById("tblorderbooking").getElementsByTagName('tbody')[0];
    var tbody = $('#tblorderbooking tbody');

    var rowNO = tbody.rows.length;

    var row = tbody.insertRow(rowNO);

    var Consignee = row.insertCell(Indx_TblOrder.Consignee);
    var DeliveryAddress = row.insertCell(Indx_TblOrder.DeliveryAddress);
    var ItemName = row.insertCell(Indx_TblOrder.ItemName);
    var Size = row.insertCell(Indx_TblOrder.Size);
    var Thickness = row.insertCell(Indx_TblOrder.Thickness);
    var SizeDesp = row.insertCell(Indx_TblOrder.SizeDesp);
    var UOM = row.insertCell(Indx_TblOrder.UOM);
    var Stock = row.insertCell(Indx_TblOrder.Stock);
    var OrderQtyPC = row.insertCell(Indx_TblOrder.OrderQtyPC);
    var OrderQtyMT = row.insertCell(Indx_TblOrder.OrderQtyMT);
    var OrderQtyMTR = row.insertCell(Indx_TblOrder.OrderQtyMTR);
    var OrderUOM = row.insertCell(Indx_TblOrder.OrderUOM);
    var OrderQTY = row.insertCell(Indx_TblOrder.OrderQTY);
    var BasicRate = row.insertCell(Indx_TblOrder.BasicRate);
    var ExtraCharges = row.insertCell(Indx_TblOrder.ExtraCharges);
    var OrderRate = row.insertCell(Indx_TblOrder.OrderRate);
    var Amount = row.insertCell(Indx_TblOrder.Amount);
    var DeliveryDate = row.insertCell(Indx_TblOrder.DeliveryDate);
    var Remarks = row.insertCell(Indx_TblOrder.Remarks);
    var Delete = row.insertCell(Indx_TblOrder.Delete);

    VisitDetailsCode.style["display"] = "none";
    IsNewRow.style["display"] = "none";
    SizeApplicable.style["display"] = "none";
    ThkApplicable.style["display"] = "none";
    LenApplicable.style["display"] = "none";

}


function GetCRMFixedParameterConfig() {
    VisitOrderEntryService.GetCRMFixedParameterConfig().then(function (response) {

        if (response.length > 0) {


        }

    });
}
function GetAccountMasterDetails() {


    var AccountDesp = $('#txtDealer').val();
    VisitOrderEntryService.GetAccountMasterDetails(AccountDesp).then(function (response) {

        if (response != '') {
            var Address = response.Address1 + ',\n ' + response.Address2;

            $('#txtGSTNo').val(response.GSTNNo);
            $('#txtAddress').val(Address);
        }
    });

    GetDealerDetailsByDealerName();
}
function GetDealerDetailsByDealerName() {


    var AccountDesp = $('#txtDealer').val();
    VisitOrderEntryService.GetDealerDetailsByDealerName(AccountDesp).then(function (response) {

        if (response.GetERPDataPanelTwoDirectOrderDashBoard[0] != '') {

        }
        if (response.GetSaleDataPanelTwoDashboardDirectOrder[0] != '') {
            $('#txtLastMonthSales').val(response.GetSaleDataPanelTwoDashboardDirectOrder[0].LastMonthSales);
            $('#txtCurrentMonthSale').val(response.GetSaleDataPanelTwoDashboardDirectOrder[0].CurrentMonthSalesAsOnDate);
            $('#txtTarget').val(response.GetSaleDataPanelTwoDashboardDirectOrder[0].Target);
            $('#txtTargetShortFall').val(response.GetSaleDataPanelTwoDashboardDirectOrder[0].TargetShortFall);
        }
        if (response.GetAllPaymentHistoryDataForDirectOrder[0] != '') {

        }

        if (response.GetPendingData[0] != '') {

        }

        if (response.GetSizeWiseSalesDataForDirectOrder[0] != '') {

        }

        if (response.GetDeliveryLocationDealerCode[0] != '') {

        }

    });
}


document.addEventListener("DOMContentLoaded", function () {

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    const formattedDate = ('0' + now.getDate()).slice(-2) + '/' +
        ('0' + (now.getMonth() + 1)).slice(-2) + '/' +
        now.getFullYear();

    $('#txtdate').val(formattedDate);
    $('#txtCheckInTime').val(formattedTime);
});

function GetActualLocation() {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showLocation, error, options);
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}
function error(err) {
    if ('N' == 'Y') {
        alert('Please on your location');
        window.location = "@BaseURL/HomeNew/Index";
    }
    console.warn("ERROR(${err.code}): ${err.message}");
}
function showLocation(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var latlong = "Latitude: " + latitude + " Longitude: " + longitude;
    $("#hflatlong").val(latlong);
    var googleAutoNo = "AIzaSyDFJGPvni-6MUITB8MxeHUMI4JfJjP5VJ4";
    var Address = '';
    //$("#txtCurrentLocation").val( Address);

    $.ajax({
        url: 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude + '&key=' + googleAutoNo + '',
        type: 'get',
        dataType: 'json',
        success: function (response) {

            Address = JSON.stringify(response.results[0].formatted_address);
            Address = Address.replaceAll('"', '');
            document.getElementById("txtCurrentLocation").value = Address;
            if ('V' != 'V') {
                document.getElementById("txtLocationOrderTypeO").value = Address;
            }
        },
        error: function (xhr) {
            Address = '';
            //document.getElementById("txtCurrentLocation").value = Address;

        }
    });
};

window.GetAccountMasterDetails = GetAccountMasterDetails;