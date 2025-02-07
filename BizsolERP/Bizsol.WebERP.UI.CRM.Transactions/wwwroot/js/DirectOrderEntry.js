import { VisitOrderEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VisitOrderEntryService.js';
import { BizSolGeoLocation } from '../../Bizsol.WebERP.UI.Shared/js/BizSolGeoLocation.js';

//var baseUrl = `${window.location.protocol}//${window.location.host}`;
var baseUrl = sessionStorage.getItem('AppBaseURL');

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
    Tolerance: 13,
    BasicRate: 14,
    ExtraCharges: 15,
    DiscountType: 16,
    Discount: 17,
    OrderRate: 18,
    RateUnit:19,
    DiscountType_AfterRate: 20,
    Discount_AfterRate: 21,
    Amount: 22,
    DeliveryDate: 23,
    ZonePriceListCode: 24,
    DealerName: 25,
    Remarks: 26,
    Delete: 27,
    VisitDetailsCode: 28,
    IsNewRow: 29,
    SizeApplicable: 30,
    ThkApplicable: 31,
    LenApplicable: 32,
    ItemMasterCode: 33,
    UOMDecimalUnit: 34

}

$(document).ready(function () {
    $("#ERPHeading").text("Direct Order Entry");
    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var UserMaster_Code = authKeyData.UserMaster_Code;
    GetCRMFixedParameterConfig();

});

function PageLoad() {


    if (param_VisitMode == 'View' && param_VisitMaster_Code > 0) {
        $('input, textarea').prop('disabled', true);
        $("#btnBack").prop("disabled", false);

        GetEditVisitDetails();
    }

    if (param_VisitMode == 'Edit' && param_VisitMaster_Code > 0) {
        GetEditVisitDetails();
    }


    if (param_VisitMode == 'New') {
        SetOrderBookingTableHeaderAsPerConfig();
    }
    if (param_VisitMode == 'Edit' && param_RoutePlanCode > 0) {
        $('#btnCheckOut').prop('hidden', false);
        $('#divtxtNextVistDate').prop('hidden', false);

    } else {
        $('#btnCheckOut').prop('hidden', true);
        $('#divtxtNextVistDate').prop('hidden', true);
    }


    GetUserDetails();
    // GetActualLocation();
    GetNestedDealerList();

    GetFreightTypeList();
    GetFreightList();
    GetZoneMasterList();
    GetPaymentTerms();
    GetUOMMasterList();
    GetFixedParameter();
    GetFixedParameterMarketing();

    $('#btnShow').hide();/// For Hariom
    // Show Stock Button Click
    $('#btnShow').click(function () {
        // Change the button text to "Loading..."
        $(this).prop('hidden', true); // Disable the button to prevent multiple clicks
        $('#btnLoading').prop('hidden', false);

        // Simulate a delay (e.g., waiting for an API call)
        setTimeout(function () {
            // Restore the button to its original state
            $('#btnShow').prop('hidden', false);
            $('#btnLoading').prop('hidden', true);

        }, 3000); // Replace with your actual logic for completion
    });

    // Add New Row Button Click
    $('#btnAddNewRow').click(function (e) {
        var VisitType = $('#hfVisitType').val();
        var DealerZone = $('#hfDealerZone').val();
        //var CRM_Config = JSON.parse(sessionStorage.getItem('CRMConfig'));

        if (VisitType == 'New Acquisition') {
            toastr.error('This client does not exists in ERP client master...order can be booked after creating client in ERP client master');
            return;
        }
        //else if (DealerZone == '' && CRM_Config.ZoneMandatoryInDirectOrder == 'Y') {
        //    toastr.error('Order cannot be booked because Zone is not defined for the Client : ' + $("#txtDealer").val());
        //    return;
        //}
        else {
            AddFiveNewRows();
        }


    });

    $('#btnBack').click(function (e) {
        if (param_RoutePlanCode > 0) {
            window.location = baseUrl + "/CRMTransactions/Visit/Visit";
        } else {
            window.location = baseUrl + "/CRMTransactions/OrderEntryList/OrderEntryList";
        }


    });

    // Sales Search Button Click
    $("#btnSalesSearch").on("click", function () {
        var value = $('#txtSalesSearch').val().toLowerCase();
        $("#SizeWiseSalesdata tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });

    $('#txtItemName1').on('input', function () {
        var selectedValue = $(this).text();

    });

    $("input[name='txtDeliveryDays']").on('input', function (e) {
        $(this).val($(this).val().replace(/[^0-9]/g, ''));
    });

    //SetOrderBookingTableHeaderAsPerConfig();
    $('#txtDeliveryDays').val(2);
    $('#txtCreditDaysForDC').val(1);
    $('#txtNextVistDate').val(addDays(new Date(), 2).toISOString().split("T")[0]);

    SetFieldsAsPerConfig();
    GetCurrentLocation();

    // When the user selects a file
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

    //$('#btnCheckOut').click(function (e) {
    //    CheckOutVisit();

    //});

    $('#imgSelfie').click(function () {
        ShowImageModal(this.src);


    });
    $('#txtPaymentTerms').on('change', function () {

        var selectedValue = $(this).val();  // Get the selected value from the input

        // Loop through the options in the datalist
        $('#listPaymentTerms option').each(function () {
            if ($(this).val() === selectedValue) {
                // Get the code (data-code attribute)
                var selectedCode = $(this).data('code');

                // Set the code in the hidden textbox
                $('#hiddentxtPaymentTerm').val(selectedCode);
            }
        });

    });

    $('#DeliveryAddressModal').on('shown.bs.modal', function () {
        var Code = $('#hdnSelectedCode').val();
        $('input[name="record"][value="'+Code+'"]').prop('checked', true);
    });

    $('#toggleSwitch').on('change', function () {

        ShowSizeDespButton(this);

    });

   
}
function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days); // Add the number of days
    return result;
}

function GetCurrentLocation() {
    BizSolGeoLocation.GetActualLocation().then(function (response) {
        console.log(response);
        if (param_VisitMode == 'New') {
            $('#txtCurrentLocation').val(response.Address);
            $('#hflatlong').val('Latitude: ' + response.latitude + ' Longitude: ' + response.longitude);
        } else {
            //$('#txtCheckOutLocation').val(response.Address);
        }

    });
}

function GetUserDetails() {

    VisitOrderEntryService.GetUserDetails().then(function (response) {

        if (response != null) {
            var UserName = response[0].UserName;
            $('#txtUserName').val(UserName);

        }

    });
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
function GetMaxBasicRate() {
    var maxVal = 0;

    // Loop through each row in the table
    $('#tblorderbooking tbody tr').each(function () {
        // Get the value in the second column (index 1) of the current row
        var value = parseFloat($(this).find('td').eq(Indx_TblOrder.BasicRate)[0].getElementsByTagName('input')[0].value); // Assuming the value is in the second column (Price)

        // Check if the value is greater than the current maximum
        if (value > maxVal) {
            maxVal = value;
        }
    });

    $('#txtBasicRateLock').val(maxVal);

}

function ValidateDiscountLimit() {
    var basicAmount = $('#txtBasicRateLock').val();
    var Amount = $('#txtAmt').val();
    var FinalAmount = 0;
    if (Number(parseFloat(Amount).toFixed(2)) < 0) {
        Amount = Amount * (-1);
    }
    var Sign = $('#selectSign').val();

    if (Sign === "-") {
        var DiscountLimit = 0;
        var DiscountValToCompare = parseFloat(Amount);
        //var CRM_Config = JSON.parse(sessionStorage.getItem('CRMConfig'));
        var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));


        var DiscountLimit = CRM_Config.LimitForVerifyDiscount;


        if (parseFloat(DiscountLimit) != 0 && parseFloat(DiscountValToCompare) != 0) {
            if (parseFloat(DiscountValToCompare) > parseFloat(DiscountLimit)) {
                toastr.warning("The Discount Limit is : " + DiscountLimit + " Rs. This record has exceeded discount Limit!");

            }
        }

    }
}

function calFinalAmt() {
    var basicAmount = $('#txtBasicRateLock').val();
    var Amount = $('#txtAmt').val();
    var FinalAmount = 0;
    var Sign = $('#selectSign').val();

    if (Number(parseFloat(Amount).toFixed(2)) < 0) {
        Amount = Amount * (-1);
    }



    if (Sign === "+") {
        FinalAmount = Number(basicAmount) + Number(Amount);
    } else {
        FinalAmount = Number(basicAmount) - Number(Amount);
    }

    $('#txtAmtFinal').val(parseFloat(FinalAmount).toFixed(2));
    $('#txtAmt').val(parseFloat(Amount).toFixed(2));
}
function GetNestedDealerList() {
    VisitOrderEntryService.GetNestedDealerList().then(function (response) {

        if (response.length > 0) {
            $('#listdealer option').empty();
            $('#listConsignee option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {

                option += '<option data-code="' + response[i].Code + '">' + response[i].AccountDesp + '</option>'
            }
            $('#listdealer')[0].innerHTML = option;
            $('#listConsignee')[0].innerHTML = option;
        }

    });
}
function GetZoneMasterList() {

    VisitOrderEntryService.GetZoneMasterList().then(function (response) {
        var defaultValue = '';
        if (response.length > 0) {
            $('#listZone option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                if (i == 0) {
                    defaultValue = response[0].Field;
                }
                option += '<option text="' + response[i].Code + '">' + response[i].Field + '</option>'
            }
            $('#listZone')[0].innerHTML = option;

        }
        if (param_VisitMode == 'New') {
            $('#txtZone').val(defaultValue);
        }
    });


}

function GetItemMasterDropdown() {
    VisitOrderEntryService.GetItemMasterDropdown().then(function (response) {

        sessionStorage.setItem('ItemMasterTable', JSON.stringify(response));

        if (response.length > 0) {
            $('#listItem option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {

                option += '<option data-code="' + response[i].Code + '">' + response[i].ItemName + '</option>'
            }
            $('#listItem')[0].innerHTML = option;

        }

    });
}

function SetBlankOrderBookingTable() {

    $("#tblorderbooking tbody").empty();
}

function AddFiveNewRows() {
    //var VisitType = 'Order';
    var VisitType = $('#hfVisitType').val();
    var EntryType = 'O';

    if (param_RoutePlanCode > 0) {
        EntryType = 'V';
    }


    var AccountDesp = $("#txtDealer").val();
    if (AccountDesp == "") {
        toastr.error("Please Select Customer Name!")
        return false;
    }
    if (VisitType == 'New Acquisition') {
        toastr.error("Order cannot be booked for New Acquisition!")
        return false;
    }
    GetItemMasterDropdown();

    if (EntryType == 'V') {
        AddNewRow();
    } else {
        for (var i = 0; i < 5; i++) {
            AddNewRow();
        }
    }
    SetOrderBookingTableHeaderAsPerConfig();
}
function AddNewRow() {
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMTR;
    var QtyMTHeader_MT = Qty_Config.QtyMT;

    var DistributorDealerApplicableInOrder = CRM_Config.ShowDealerColumn;
    //var QtyPCHeader = CRM_Config.QtyPCHeader;
    //var QtyMTRHeader = CRM_Config.QtyMTRHeader;
    //var QtyMTHeader_MT = CRM_Config.QtyMTHeader_MT;
    //var DistributorDealerApplicableInOrder = CRM_Config.DistributorDealerApplicableInOrder;

    
    //var VisitType = 'Order';
    var VisitType = $('#hfVisitType').val();
    var EntryType = 'O';

    if (param_RoutePlanCode > 0) {
        EntryType = 'V';
    }

    var ShowSizeButton = $('#toggleSwitch').is(':checked');
    var PageMode = param_VisitMode; // New/Edit/View
    var tbItemConsumeRowNo = 0;
    GetDistributorDealerList();



    //var table = document.getElementById("tblorderbooking").getElementsByTagName('tbody')[0];
    var tbody = $('#tblorderbooking tbody')[0];
    var theadRow = $('#tblorderbooking thead tr')[0];
    var rowNO = tbody.rows.length;

    var row = tbody.insertRow(rowNO);
    tbItemConsumeRowNo = rowNO + 1;

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
    var Tolerance = row.insertCell(Indx_TblOrder.Tolerance);
    var BasicRate = row.insertCell(Indx_TblOrder.BasicRate);
    var ExtraCharges = row.insertCell(Indx_TblOrder.ExtraCharges);
    var DiscountType = row.insertCell(Indx_TblOrder.DiscountType);
    var Discount = row.insertCell(Indx_TblOrder.Discount);
    var OrderRate = row.insertCell(Indx_TblOrder.OrderRate);
    var RateUnit = row.insertCell(Indx_TblOrder.RateUnit);
    var DiscountType_AfterRate = row.insertCell(Indx_TblOrder.DiscountType_AfterRate);
    var Discount_AfterRate = row.insertCell(Indx_TblOrder.Discount_AfterRate);
    var Amount = row.insertCell(Indx_TblOrder.Amount);
    var DeliveryDate = row.insertCell(Indx_TblOrder.DeliveryDate);
    var ZonePriceListCode = row.insertCell(Indx_TblOrder.ZonePriceListCode);
    var DealerNameList = row.insertCell(Indx_TblOrder.DealerName);
    var Remarks = row.insertCell(Indx_TblOrder.Remarks);
    var Delete = row.insertCell(Indx_TblOrder.Delete);
    
    var VisitDetailsCode = row.insertCell(Indx_TblOrder.VisitDetailsCode);
    var IsNewRow = row.insertCell(Indx_TblOrder.IsNewRow);
    var SizeApplicable = row.insertCell(Indx_TblOrder.SizeApplicable);
    var ThkApplicable = row.insertCell(Indx_TblOrder.ThkApplicable);
    var LenApplicable = row.insertCell(Indx_TblOrder.LenApplicable);
    var ItemMasterCode = row.insertCell(Indx_TblOrder.ItemMasterCode);
    var UOMDecimalUnit = row.insertCell(Indx_TblOrder.UOMDecimalUnit);


    VisitDetailsCode.style["display"] = "none";
    IsNewRow.style["display"] = "none";
    SizeApplicable.style["display"] = "none";
    ThkApplicable.style["display"] = "none";
    LenApplicable.style["display"] = "none";
    ItemMasterCode.style["display"] = "none";
    UOMDecimalUnit.style["display"] = "none";
    if (DistributorDealerApplicableInOrder == 'N') {
        DealerNameList.style["display"] = "none";
    }

    //if (QtyPCHeader == '') {
    //    OrderQtyPC.style["display"] = "none";
    //    //$("#tblorderbooking thead tr th:nth-child(" + Indx_TblOrder.OrderQtyPC + ")").css('display', 'none');
    //}
    //if (QtyMTRHeader == '') {
    //    OrderQtyMT.style["display"] = "none";
    //}
    //if (QtyMTHeader_MT == '') {
    //    OrderQtyMTR.style["display"] = "none";
    //}

    
    
    Consignee.innerHTML = '<input type="text" id="txtConsignee' + tbItemConsumeRowNo + '" list="listConsignee" class="BizSolFormControl box_border form-control form-control-sm" name="txtConsignee" placeholder="" onclick="$(this).val(\'\')" autocomplete="off" onchange="GetConsigneeCode(this,' + tbItemConsumeRowNo + ');GetAccountDeliveryLocationDetails(this,' + tbItemConsumeRowNo + ');"  required><input type="hidden" id="hdnConsigneeCode' + tbItemConsumeRowNo + '" name="hdnConsigneeCode">';
    DeliveryAddress.innerHTML = '<div class="row"><div class="col-md-7"><datalist id="listDeliveryLocation' + tbItemConsumeRowNo + '"></datalist><input type="text" id="txtDeliveryAddress' + tbItemConsumeRowNo + '" list="listDeliveryLocation' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryAddress" placeholder="" onclick="$(this).val(\'\')" autocomplete="off"  required onchange="GetDeliveryAddressCode(this,' + tbItemConsumeRowNo + ');"></div><div class="col-md-3"><button type="button" id="btnSelectDeliveryAdd" onclick="GetAccountDeliveryLocationDetails(this,' + tbItemConsumeRowNo + ');ShowDeliveryAddressModal(' + tbItemConsumeRowNo + ');" class="btn btn-primary btn-height" title="Select Address"> <i class="fa fa-search"></i></button></div></div><input type="hidden" id="hdnAddressCode' + tbItemConsumeRowNo + '" name="hdnAddressCode"> ';
    ItemName.innerHTML = '<input type="text"  id="txtItemName' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtItemName" placeholder="" list="listItem" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetItemSizeList(this,' + tbItemConsumeRowNo + ');GetLatestPriceListByItemName(this,' + tbItemConsumeRowNo + ');GetUOM(' + tbItemConsumeRowNo + ');GetBasicRateFromPriceList(this,' + tbItemConsumeRowNo + ');GetDealerFromPreRow(this,' + tbItemConsumeRowNo + ');GetItemSizeMasterList(this,' + tbItemConsumeRowNo + ');" required>';
    Size.innerHTML = '<datalist id="listItemSize_' + tbItemConsumeRowNo + '"></datalist> <input type="text"  id="txtSize' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtSize" placeholder="" list="listItemSize_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedSizeCode(' + tbItemConsumeRowNo + ');GetItemThicknessList(this,' + tbItemConsumeRowNo + ');GetBasicRateExtraCharges(' + tbItemConsumeRowNo + ');" required><input type="hidden" id="hdnSizeMasterCode' + tbItemConsumeRowNo + '" name="hdnSizeMasterCode">';
    Thickness.innerHTML = '<datalist id="listItemThickness_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtThickness' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtThickness" placeholder="" list="listItemThickness_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedThkCode(' + tbItemConsumeRowNo + ');GetBasicRateExtraCharges(' + tbItemConsumeRowNo + ');" required><input type="hidden" id="hdnThkMasterCode' + tbItemConsumeRowNo + '" name="hdnThkMasterCode">';
    SizeDesp.innerHTML = '<datalist id="listItemSizeMaster_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtSizeDesp' + tbItemConsumeRowNo + '" list="listItemSizeMaster_' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtSizeDesp" placeholder="" list="listItemSizeMaster" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedItemSizeMasterCode(' + tbItemConsumeRowNo + ');" required><button type="button" id="btnShowSizeControl_' + tbItemConsumeRowNo + '" class="btn btn-primary btn-height" title="New Size" onclick="ShowSizeControl(this,' + tbItemConsumeRowNo + ');"> <i class="fa fa-plus-square"></i></button><input type="hidden" id="hdnItemSizeMasterCode' + tbItemConsumeRowNo + '" name="hdnItemSizeMasterCode">';
    UOM.innerHTML = '<datalist id="listUOM_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtUOM' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name="txtUOM" placeholder="" list="listUOM_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    Stock.innerHTML = '<input type="text"  id="txtStock' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtStock" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    OrderQtyPC.innerHTML = '<input type="text"  id="txtOrderQtyPC' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderQtyPC" placeholder=""  autocomplete="off"   onchange="CalculateAmount(this);" required>';
    OrderQtyMT.innerHTML = '<input type="number"  id="txtOrderQtyMT' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderQtyMT" placeholder=""  autocomplete="off"   onchange="CalculateAmount(this);" required>';
    OrderQtyMTR.innerHTML = '<input type="number"  id="txtOrderQtyMTR' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderQtyMTR" placeholder=""  autocomplete="off"   onchange="CalculateAmount(this);" required>';
    OrderUOM.innerHTML = '<input type="text"  id="txtOrderUOM' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderUOM" placeholder="" list="listOrderUOM" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    OrderQTY.innerHTML = '<input type="number"  id="txtOrderQTY' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderQTY" placeholder=""  autocomplete="off"  onchange="CalculateAmount(this);" required>';
    Tolerance.innerHTML = '<input type="number"  id="txtTolerance' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtTolerance" placeholder=""  autocomplete="off"   required>';
    BasicRate.innerHTML = '<input type="number"  id="txtBasicRate' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtBasicRate" placeholder=""  autocomplete="off" onchange="CalculateAmount(this);GetMaxBasicRate();calFinalAmt();" required>';
    ExtraCharges.innerHTML = '<input type="number"  id="txtExtraCharges' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtExtraCharges" placeholder=""  autocomplete="off"  onchange="" required>';
    DiscountType.innerHTML = '<input type="text"  id="txtDiscountType' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType" placeholder="" list="listDiscountType" autocomplete="off" onclick="$(this).val(\'\')"   onchange="CalculateAmount(this);" required>';
    Discount.innerHTML = '<input type="number"  id="txtDiscount' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount" placeholder=""  autocomplete="off"   required  onchange="CalculateAmount(this);">';
    OrderRate.innerHTML = '<input type="number"  id="txtOrderRate' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderRate" placeholder=""autocomplete="off"   onchange="" required>';
    RateUnit.innerHTML = '<input type="text"  id="txtRateUnit' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtRateUnit" placeholder=""  autocomplete="off"    required>';

    DiscountType_AfterRate.innerHTML = '<input type="text"  id="txtDiscountType_AfterRate' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType_AfterRate" placeholder="" list="listDiscountType" autocomplete="off" onclick="$(this).val(\'\')"   onchange="CalculateAmount(this);" required>';
    Discount_AfterRate.innerHTML = '<input type="number"  id="txtDiscount_AfterRate' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount_AfterRate" placeholder=""  autocomplete="off"   required  onchange="CalculateAmount(this);">';
    Amount.innerHTML = '<input type="number"  id="txtAmount' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" disabled name="txtAmount" placeholder="" autocomplete="off"  onchange="" required>';
    DeliveryDate.innerHTML = '<input type="date"  id="txtDeliveryDate' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryDate" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    ZonePriceListCode.innerHTML = '<datalist id="ZonePriceListCode' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtZonePriceListCode' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtZonePriceListCode" placeholder="" list="listZone" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    Remarks.innerHTML = '<input type="text"  id="txtRemarks' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtRemarks" placeholder=""  autocomplete="off"  onchange="" required  maxlength="200">';
    Delete.innerHTML = '<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light disabled" title="Delete" onclick="DeleteOrderItem(this);"><i class="fa fa-times" aria-hidden="true"></i></a>';
    DealerNameList.innerHTML = '<input type="hidden" id="hdnDistributorDealerCode' + tbItemConsumeRowNo + '" name="hdnDistributorDealerCode"><input type="text"  id="txtDealerNameList' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDealerNameList" placeholder="" list="listDistributorDealer" autocomplete="off" onclick="$(this).val(\'\')" onchange="GetDistributorDealerCode(this,' + tbItemConsumeRowNo + ')"  required>';

    VisitDetailsCode.innerHTML = '<input type="text"  id="txtVisitDetailsCode' + tbItemConsumeRowNo + '"  name="txtVisitDetailsCode" placeholder="" value=0  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    IsNewRow.innerHTML = '<input type="text"  id="txtIsNewRow' + tbItemConsumeRowNo + '"  name="txtIsNewRow" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    SizeApplicable.innerHTML = '<input type="text"  id="txtSizeApplicable' + tbItemConsumeRowNo + '"  name="txtSizeApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    ThkApplicable.innerHTML = '<input type="text"  id="txtThkApplicable' + tbItemConsumeRowNo + '" name="txtThkApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    LenApplicable.innerHTML = '<input type="text"  id="txtLenApplicable' + tbItemConsumeRowNo + '"  name="txtLenApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    ItemMasterCode.innerHTML = '<input type="text"  id="txtItemMasterCode' + tbItemConsumeRowNo + '"  name="txtItemMasterCode" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    UOMDecimalUnit.innerHTML = '<input type="text"  id="txtUOMDecimalUnit' + tbItemConsumeRowNo + '"  name="UOMDecimalUnit" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';


    $('#txtDeliveryDate' + tbItemConsumeRowNo).val(new Date().toISOString().split("T")[0]);
}

function GetDealerFromPreRow(x,RowNo) {
    
    if (RowNo > 1) {
        var ObjCurrRow = $(x).closest('tr');
        var tblorderbooking = $('#tblorderbooking')[0];
        var PreRowNo = RowNo - 1;

        var PreRow = tblorderbooking.rows[PreRowNo];
        var PreDealerCode = PreRow.cells[Indx_TblOrder.DealerName].getElementsByTagName('input')[0].value;
        var PreDealerName = PreRow.cells[Indx_TblOrder.DealerName].getElementsByTagName('input')[1].value;
        if (PreDealerName != undefined && PreDealerName != '') {
            ObjCurrRow.find('td:eq(' + Indx_TblOrder.DealerName + ')')[0].getElementsByTagName('input')[0].value = PreDealerCode;
            ObjCurrRow.find('td:eq(' + Indx_TblOrder.DealerName + ')')[0].getElementsByTagName('input')[1].value = PreDealerName;
        }

    }
}
function CalculateAmount(x) {

    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var AskDiscountItemWise = CRM_Config.AskDiscountItemWise;
    var ShowExtraColumnOrderQtyAndUnit = CRM_Config.ShowExtraColumnOrderQtyAndUnit;

    var ObjCurrRow = $(x).closest('tr');
    var QtyMT = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyMT + ')')[0].getElementsByTagName('input')[0].value;
    var QtyPC = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyPC + ')')[0].getElementsByTagName('input')[0].value;
    var QtyMTR = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyMTR + ')')[0].getElementsByTagName('input')[0].value;
    var UOM = ObjCurrRow.find('td:eq(' + Indx_TblOrder.UOM + ')')[0].getElementsByTagName('input')[0].value;
    var BasicRate = ObjCurrRow.find('td:eq(' + Indx_TblOrder.BasicRate + ')')[0].getElementsByTagName('input')[0].value;
    var DiscountType = ObjCurrRow.find('td:eq(' + Indx_TblOrder.DiscountType + ')')[0].getElementsByTagName('input')[0].value;
    var Discount = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Discount + ')')[0].getElementsByTagName('input')[0].value;
    var DiscountType_AfterRate = ObjCurrRow.find('td:eq(' + Indx_TblOrder.DiscountType_AfterRate + ')')[0].getElementsByTagName('input')[0].value;
    var Discount_AfterRate = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Discount_AfterRate + ')')[0].getElementsByTagName('input')[0].value;
    var OrderUOM = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderUOM + ')')[0].getElementsByTagName('input')[0].value;
   
   
    
    var TotalDiscount_ItemWise = 0;



    if (QtyMT == undefined || QtyMT == '') {
        QtyMT = 0;
    }
    if (QtyPC == undefined || QtyPC == '') {
        QtyPC = 0;
    }
    if (QtyMTR == undefined || QtyMTR == '') {
        QtyMTR = 0;
    }


    var Qty = 0;

    if (UOM.trim().toUpperCase() == 'NOS' || UOM.trim().toUpperCase() == 'MR') {
        Qty = QtyMTR;
    } else if (UOM.trim().toUpperCase() == 'PC') {
        Qty = QtyPC;
    } else {
        Qty = QtyMT;
    }

    if (ShowExtraColumnOrderQtyAndUnit == 'Y' && (OrderUOM != undefined || OrderUOM != '')) {
        var OrderQty = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQTY + ')')[0].getElementsByTagName('input')[0].value;
        Qty = OrderQty == undefined|| OrderQty==''?0:OrderQty;
    }

    if (BasicRate.trim() == "") {
        BasicRate = 0;
    } else if (Number(parseFloat(BasicRate).toFixed(2)) > 0) {
        BasicRate = parseFloat(BasicRate).toFixed(2);
    }
    //if (QtyMT.trim() == "") {
    //    QtyMT = 0;
    //} else if (Number(parseFloat(QtyMT).toFixed(2)) > 0) {
    //    QtyMT = parseFloat(QtyMT).toFixed(2);
    //}

    if (Number(parseFloat(Qty).toFixed(2)) > 0) {
        Qty = parseFloat(Qty).toFixed(2);
    }

    if (AskDiscountItemWise == 'Before Order Rate' || AskDiscountItemWise == 'Both') {
        if (DiscountType == '%' && Discount !== '') {
            BasicRate = parseFloat(BasicRate).toFixed(2) - (parseFloat(BasicRate).toFixed(2) * (parseFloat(Discount).toFixed(2) / 100));
        } else if (DiscountType == 'Per Unit' && Discount !== '') {
           BasicRate= parseFloat(BasicRate).toFixed(2) - parseFloat(Discount).toFixed(2);
        } else {
            BasicRate = parseFloat(BasicRate).toFixed(2)
        }
    } 
    ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderRate + ')')[0].getElementsByTagName('input')[0].value = parseFloat(BasicRate).toFixed(2);

    if (AskDiscountItemWise == 'After Order Rate' || AskDiscountItemWise == 'Both') {
        if (DiscountType_AfterRate == '%' && Discount_AfterRate !== '') {
            TotalDiscount_ItemWise = parseFloat(Qty * BasicRate).toFixed(2) * (parseFloat(Discount_AfterRate).toFixed(2) / 100);
        } else if (DiscountType_AfterRate == 'Per Unit' && Discount_AfterRate !== '') {
            TotalDiscount_ItemWise = parseFloat(Qty).toFixed(2) * parseFloat(Discount_AfterRate).toFixed(2);
        } else {
            TotalDiscount_ItemWise = 0;
        }
    } 
    //if (DiscountType != 'undefined' && Discount != 'undefined') {
    //    if (DiscountType == '%' && Discount !== '') {
    //        TotalDiscount_ItemWise = parseFloat(Qty * BasicRate).toFixed(2) * (parseFloat(Discount).toFixed(2) / 100);
    //    } else if (DiscountType == 'Per Unit' && Discount !== '') {
    //        TotalDiscount_ItemWise = parseFloat(Qty).toFixed(2) * parseFloat(Discount).toFixed(2);
    //    } else {
    //        TotalDiscount_ItemWise = 0;
    //    }
    //} else {
    //    TotalDiscount_ItemWise = 0;
    //}

    var Amount = parseFloat(Qty * BasicRate).toFixed(2);
    Amount = Amount - parseFloat(TotalDiscount_ItemWise).toFixed(2);

    ObjCurrRow.find('td:eq(' + Indx_TblOrder.Amount + ')')[0].getElementsByTagName('input')[0].value = parseFloat(Amount).toFixed(2);
    ShowFooterTotal();
}

function ValidateData() {

    var tbodyOrderDetail = document.getElementById("tblorderbooking").getElementsByTagName('tbody')[0];
    //var CRM_Config = JSON.parse(sessionStorage.getItem('CRMConfig'));

    //var QtyPCHeader = CRM_Config.QtyPCHeader;
    //var QtyMTRHeader = CRM_Config.QtyMTRHeader;
    //var QtyMTHeader_MT = CRM_Config.QtyMTHeader_MT;
    //var DistributorDealerApplicableInOrder = CRM_Config.DistributorDealerApplicableInOrder;
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMTR;
    var QtyMTHeader = Qty_Config.QtyMT;

    var DistributorDealerApplicableInOrder = CRM_Config.ShowDealerColumn;

    var Valid = true;
    var MsgStr = "";
    var newLine = "<br>";
    var EntryType = 'O';

    if (param_RoutePlanCode > 0) {
        EntryType = 'V';
    }

    //var LocationMandatoryForCheckInCheckOut = CRM_Config.LocationMandatoryForCheckInCheckOut;
    //var QtyMTHeader = CRM_Config.QtyMTHeader;
    //var LimitForVerifyDiscount = CRM_Config.LimitForVerifyDiscount;
    //var ManualBasicRate = CRM_Config.ManualBasicRate;
    //var SelfieMandatoryInDirectOrder = CRM_Config.SelfieMandatoryInDirectOrder;
    //var ZoneMandatoryInDirectOrder = CRM_Config.ZoneMandatoryInDirectOrder;
    //var PriceZoneListMandatoryInOrder = CRM_Config.PriceZoneListMandatoryInOrder;

    var LocationMandatoryForCheckInCheckOut = CRM_Config.LocationMandatoryForCheckInCheckOut;
    var LimitForVerifyDiscount = CRM_Config.LimitForVerifyDiscount;
    var ManualBasicRate = CRM_Config.AllowToChangeBasicRate;
    var PriceZoneListMandatoryInOrder = CRM_Config.ShowZone;
    var ShowSizeThicknessColumns = CRM_Config.ShowSizeThicknessColumns;
    var ShowExtraColumnOrderQtyAndUnit = CRM_Config.ShowExtraColumnOrderQtyAndUnit;


   

    var AccountDesp = $("#txtDealer").val();
    if (AccountDesp == "") {

        MsgStr += "* Please Select Customer Name!" + newLine;
        Valid = false;
    }

    if (LocationMandatoryForCheckInCheckOut == 'Y') {
        if ($('#txtCurrentLocation').val() == '') {

            MsgStr += "* Please on your Location!" + newLine;
            Valid = false;
        }
    }
    //if (SelfieMandatoryInDirectOrder == 'Y') {
    //    if ($('#hfFileInput').val() == '') {

    //        MsgStr += "* Please select the attachment file!" + newLine;
    //        Valid = false;
    //    } else {
    //        if (validateFileType() == false) {
    //            Valid = false;
    //        }
    //    }

    //}
    if ($('#hfFileInput').val() !== '') {

        if (validateFileType() == false) {
            Valid = false;
        }
    }


    //if (ZoneMandatoryInDirectOrder == 'Y') {
    //var VisitType = $('#hfVisitType').val();
    //if (VisitType != '' && VisitType != undefined && VisitType != null && VisitType == 'New Acquisition' && EntryType == 'V') {

    //} else {
    //    if ($('#txtZone').val() == '') {

    //        MsgStr += "* Please select Zone!" + newLine;
    //        Valid = false;
    //    }
    //}
    //}


    var arrItems = {};  // An object to keep track of seen values
    var duplicateValues = [];  // Array to store cells with duplicate values
    var TotalOrderAmount = 0;
    var seenCombinations = [];
    $("#tblorderbooking tbody tr").each(function (index, row) {
        var ItemName = '';
        var QtyMT = 0;
        var BasicRate = 0;
        var Amount = 0;
        var DeliveryDate = new Date().toISOString().split("T")[0];
        var ZonePriceListCode = '';
        var Remarks = '';
        var rowNo = index + 1;
        var QtyPC = 0;
        var QtyMTR = 0;
        var DealerCode = 0;
        var DealerName = '';
        var SizeDesp = '';
        var Size = '';
        var Thk = '';

        ItemName = $(this).find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
        QtyMT = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyMT + ')')[0].getElementsByTagName('input')[0].value;
        BasicRate = $(this).find('td:eq(' + Indx_TblOrder.BasicRate + ')')[0].getElementsByTagName('input')[0].value;
        Amount = $(this).find('td:eq(' + Indx_TblOrder.Amount + ')')[0].getElementsByTagName('input')[0].value;
        DeliveryDate = $(this).find('td:eq(' + Indx_TblOrder.DeliveryDate + ')')[0].getElementsByTagName('input')[0].value;
        ZonePriceListCode = $(this).find('td:eq(' + Indx_TblOrder.ZonePriceListCode + ')')[0].getElementsByTagName('input')[0].value;
        Remarks = $(this).find('td:eq(' + Indx_TblOrder.Remarks + ')')[0].getElementsByTagName('input')[0].value;
        QtyPC = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyPC + ')')[0].getElementsByTagName('input')[0].value;
        QtyMTR = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyMTR + ')')[0].getElementsByTagName('input')[0].value;
        DealerCode = $(this).find('td:eq(' + Indx_TblOrder.DealerName + ')')[0].getElementsByTagName('input')[0].value;
        DealerName = $(this).find('td:eq(' + Indx_TblOrder.DealerName + ')')[0].getElementsByTagName('input')[1].value;
        SizeDesp = $(this).find('td:eq(' + Indx_TblOrder.SizeDesp + ')')[0].getElementsByTagName('input')[0].value;
        Size = $(this).find('td:eq(' + Indx_TblOrder.Size + ')')[0].getElementsByTagName('input')[0].value;
        Thk = $(this).find('td:eq(' + Indx_TblOrder.Thickness + ')')[0].getElementsByTagName('input')[0].value;
        var OrderQty = $(this).find('td:eq(' + Indx_TblOrder.OrderQTY + ')')[0].getElementsByTagName('input')[0].value;
        var OrderUOM = $(this).find('td:eq(' + Indx_TblOrder.OrderUOM + ')')[0].getElementsByTagName('input')[0].value;
        

        if (QtyMT == undefined || QtyMT == '') {
            QtyMT = 0;
        }
        if (QtyPC == undefined || QtyPC == '') {
            QtyPC = 0;
        }
        if (QtyMTR == undefined || QtyMTR == '') {
            QtyMTR = 0;
        }


        TotalOrderAmount += Amount;

        if (Amount > 0) {
            if (ItemName == '') {

                MsgStr += "* Invalid Item Name at Row No " + rowNo + "!" + newLine;
                Valid = false;
            }
            if (BasicRate == '' || BasicRate <= 0) {

                MsgStr += "* Invalid Basic Rate at Row No " + rowNo + "!" + newLine;
                Valid = false;
            }
            if ((QtyMT == '' || QtyMT <= 0) && (QtyPC == '' || QtyPC <= 0) && (QtyMTR == '' || QtyMTR <= 0)) {

                MsgStr += "* Invalid Qty at Row No " + rowNo + "!" + newLine;
                Valid = false;
            }
            if (DeliveryDate == '') {

                MsgStr += "* Invalid Delivery Date at Row No " + rowNo + "!" + newLine;
                Valid = false;
            }
            if (PriceZoneListMandatoryInOrder == 'Y') {
                if (ZonePriceListCode == '') {
                    MsgStr += "* Invalid Price List at Row No " + rowNo + "!" + newLine;
                    Valid = false;
                }
            }

            if (ShowExtraColumnOrderQtyAndUnit == 'Y' && (OrderUOM != undefined || OrderUOM !='')) {

                if (OrderQty == undefined || OrderQty == '') {
                    MsgStr += "* Invalid Order Qty at Row No " + rowNo + "!" + newLine;
                    Valid = false;
                }
            }

            if (DistributorDealerApplicableInOrder == "Y") {
                var combination = ItemName + ' | ' + DealerName;
                if ($.inArray(combination, seenCombinations) === -1) {
                    seenCombinations.push(combination);  // Add combination to the array if it's not a duplicate
                } else {
                    if ($.inArray(combination, duplicateValues) === -1) {
                        duplicateValues.push(combination);  // Add to duplicates array if it's a duplicate
                    }
                }
            } else {
                if (ShowSizeThicknessColumns == 'Y') {
                    var objToggle = $('#toggleSwitch');

                    if (objToggle[0].checked == true) {
                        var combination = ItemName + ' | ' + SizeDesp;
                        if ($.inArray(combination, seenCombinations) === -1) {
                            seenCombinations.push(combination);  // Add combination to the array if it's not a duplicate
                        } else {
                            if ($.inArray(combination, duplicateValues) === -1) {
                                duplicateValues.push(combination);  // Add to duplicates array if it's a duplicate
                            }
                        }
                    } else {
                        var combination = ItemName + ' | ' + Size + ' | ' + Thk;
                        if ($.inArray(combination, seenCombinations) === -1) {
                            seenCombinations.push(combination);  // Add combination to the array if it's not a duplicate
                        } else {
                            if ($.inArray(combination, duplicateValues) === -1) {
                                duplicateValues.push(combination);  // Add to duplicates array if it's a duplicate
                            }
                        }
                    }
                } else {
                    if (arrItems[ItemName]) {
                        // If it's a duplicate, add it to the array of duplicates
                        duplicateValues.push(ItemName);
                    } else {
                        // If it's not a duplicate, mark it as seen
                        arrItems[ItemName] = true;
                    }
                }
                
               
            }


        }

    });

    if (EntryType == 'O' && tbodyOrderDetail.rows.length == 0) {
        MsgStr += "* Please enter any record for Order Booking." + newLine;
        Valid = false;
    } else if (EntryType == 'O' && TotalOrderAmount == 0) {
        MsgStr += "* Please enter any record for Order Booking." + newLine;
        Valid = false;
    }

    if (duplicateValues.length > 0) {
        duplicateValues.forEach((item) => {
            MsgStr += "* Duplicate record exists for item:'" + item + "'" + newLine;
        })
        Valid = false;
    }
    if (Valid == false) {
        toastr.error(MsgStr);
        return false;
    }


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
function SaveData() {
    if (ValidateData() == false) {
        return false;
    }
    var allTablesData = {};
    var visitMasterData = [];
    var visitOrderDetailsData = [];

    var visitOtherPartyData = [];
    var visitPaymentData = [];
    var visitCheckListData = [];

    var visitMasterRow = {};

    var Config_Marketing = JSON.parse(sessionStorage.getItem('FixedParameterMarketing'));
    var AllowInMTRSColForSingleUnit = Config_Marketing.AllowInMTRSColForSingleUnit;
    var objToggle = $('#toggleSwitch');

    visitMasterRow["code"] = param_VisitMaster_Code;
    visitMasterRow["date"] = new Date().toISOString().split("T")[0];
    visitMasterRow["visitType"] = 0;
    visitMasterRow["accountDesp"] = $("#txtDealer").val() !== null ? $("#txtDealer").val() : '';
    visitMasterRow["photo"] = $("#hfFileInput")[0].value !== null ? $("#hfFileInput")[0].value : '';
    visitMasterRow["location"] = $("#hflatlong").val() !== null ? $("#hflatlong").val() : '';
    visitMasterRow["checkIn"] = $("#txtCheckInTime").val() !== null ? $("#txtCheckInTime").val() : '';
    visitMasterRow["checkOut"] = '';
    visitMasterRow["remarks"] = $("#txtRemarks").val() !== null ? $("#txtRemarks").val() : '';
    visitMasterRow["routePlanMaster_code"] = param_RoutePlanCode;
    visitMasterRow["nextVisitDate"] = addDays(new Date(), 2).toISOString().split("T")[0];
    visitMasterRow["verified"] = 'N';
    visitMasterRow["paymentTermsMaster_Code"] = $('#hiddentxtPaymentTerm').val() !== null ? $("#hiddentxtPaymentTerm").val() : 0;
    visitMasterRow["deliveryDays"] = $("#txtDeliveryDays").val() !== null ? $("#txtDeliveryDays").val() : 0;
    visitMasterRow["freightCondition"] = $("#txtFreightType").val() !== null ? $("#txtFreightType").val() : '';
    visitMasterRow["orderDealerName"] = $("#txtDealer").val() !== null ? $("#txtDealer").val() : '';
    visitMasterRow["userMasterCode"] = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
    visitMasterRow["checkInLocation"] = $("#txtCurrentLocation").val() !== null ? $("#txtCurrentLocation").val() : '';
    visitMasterRow["checkOutLocation"] = 0;
    visitMasterRow["mRateUnit"] = '';
    visitMasterRow["creditDays"] = $('#txtCreditDaysForDC') !== null ? $("#txtCreditDaysForDC").val() : 0;
    visitMasterRow["freight"] = $("#txtlistFreight").val() !== null ? $("#txtlistFreight").val() : '';
    visitMasterRow["dispatchFrom"] = '';
    visitMasterRow["buyerPONo"] = $("#txtBuyerPONo").val() !== null ? $("#txtBuyerPONo").val() : '';
    visitMasterRow["buyerPODate"] = new Date().toISOString().split("T")[0];
    visitMasterRow["zoneName"] = '';

    visitMasterData.push(visitMasterRow);

    var OtherCharges = $("#txtAmt").val() !== null || $("#txtAmt").val() !== '' ? $("#txtAmt").val() : 0;
    if ($('#selectSign').val() == "-") { OtherCharges *= -1; }
    $("#tblorderbooking tbody tr").each(function (index, row) {
        var ItemName = '';
        var QtyMT = 0;
        var BasicRate = 0;
        var Amount = 0;
        var DeliveryDate = new Date().toISOString().split("T")[0];
        var Remarks = '';
        var VisitDetailsCode = 0;
        var ZonePriceListCode = '';
        var UOM = '';
        var QtyPC = 0;
        var QtyMTR = 0;
        var DealerCode = 0;
        var DiscountType = '';
        var Discount = 0;
        var DiscountType_AfterRate = '';
        var Discount_AfterRate = 0;
        var Tolerance = 0;
        var Consignee = '';
        var RateUnit = '';
        var ExtraCharges = 0;
        var SizeDesp = '';
        var ItemSizeMaster_code = 0;
        var Size = '';
        var Thickness = '';
        var SizeCode = 0;
        var ThicknessCode = 0;


        ItemName = $(this).find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
        QtyMT = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyMT + ')')[0].getElementsByTagName('input')[0].value;
        BasicRate = $(this).find('td:eq(' + Indx_TblOrder.BasicRate + ')')[0].getElementsByTagName('input')[0].value;
        Amount = $(this).find('td:eq(' + Indx_TblOrder.Amount + ')')[0].getElementsByTagName('input')[0].value;
        DeliveryDate = $(this).find('td:eq(' + Indx_TblOrder.DeliveryDate + ')')[0].getElementsByTagName('input')[0].value;
        ZonePriceListCode = $(this).find('td:eq(' + Indx_TblOrder.ZonePriceListCode + ')')[0].getElementsByTagName('input')[0].value;
        Remarks = $(this).find('td:eq(' + Indx_TblOrder.Remarks + ')')[0].getElementsByTagName('input')[0].value;
        VisitDetailsCode = $(this).find('td:eq(' + Indx_TblOrder.VisitDetailsCode + ')')[0].getElementsByTagName('input')[0].value;
        UOM = $(this).find('td:eq(' + Indx_TblOrder.UOM + ')')[0].getElementsByTagName('input')[0].value;
        QtyMTR = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyMTR + ')')[0].getElementsByTagName('input')[0].value;
        DealerCode = $(this).find('td:eq(' + Indx_TblOrder.DealerName + ')')[0].getElementsByTagName('input')[0].value;
        QtyPC = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyPC + ')')[0].getElementsByTagName('input')[0].value;
        ExtraCharges = $(this).find('td:eq(' + Indx_TblOrder.ExtraCharges + ')')[0].getElementsByTagName('input')[0].value;
        

        if (objToggle[0].checked == true) {
            SizeDesp = $(this).find('td:eq(' + Indx_TblOrder.SizeDesp + ')')[0].getElementsByTagName('input')[0].value;
            ItemSizeMaster_code = $(this).find('td:eq(' + Indx_TblOrder.SizeDesp + ')')[0].getElementsByTagName('input')[1].value;

        } else {
            SizeDesp = '';
            ItemSizeMaster_code = 0;
        }
       
        Size = $(this).find('td:eq(' + Indx_TblOrder.Size + ')')[0].getElementsByTagName('input')[0].value;
        Thickness = $(this).find('td:eq(' + Indx_TblOrder.Thickness + ')')[0].getElementsByTagName('input')[0].value;
        SizeCode = $(this).find('td:eq(' + Indx_TblOrder.Size + ')')[0].getElementsByTagName('input')[1].value;
        ThicknessCode = $(this).find('td:eq(' + Indx_TblOrder.Thickness + ')')[0].getElementsByTagName('input')[1].value;

        var DiscountType = $(this).find('td:eq(' + Indx_TblOrder.DiscountType + ')')[0].getElementsByTagName('input')[0].value;
        var Discount = $(this).find('td:eq(' + Indx_TblOrder.Discount + ')')[0].getElementsByTagName('input')[0].value;
        var DiscountType_AfterRate = $(this).find('td:eq(' + Indx_TblOrder.DiscountType_AfterRate + ')')[0].getElementsByTagName('input')[0].value;
        var Discount_AfterRate = $(this).find('td:eq(' + Indx_TblOrder.Discount_AfterRate + ')')[0].getElementsByTagName('input')[0].value;
        var Tolerance = $(this).find('td:eq(' + Indx_TblOrder.Tolerance + ')')[0].getElementsByTagName('input')[0].value;
        var Consignee_Code = $(this).find('td:eq(' + Indx_TblOrder.Consignee + ')')[0].getElementsByTagName('input')[1].value;
        var DeliveryLocation_Code = $(this).find('td:eq(' + Indx_TblOrder.DeliveryAddress + ')')[0].getElementsByTagName('input')[1].value;
        var RateUnit = $(this).find('td:eq(' + Indx_TblOrder.RateUnit + ')')[0].getElementsByTagName('input')[0].value;

    
        QtyMT = QtyMT == undefined || QtyMT == '' ? 0 : QtyMT;
        QtyPC = QtyPC == undefined || QtyPC == '' ? 0 : QtyPC;
        QtyMTR = QtyMTR == undefined || QtyMTR == '' ? 0 : QtyMTR;
        Discount = Discount == undefined || Discount == '' ? 0 : Discount;
        Discount_AfterRate = Discount_AfterRate == undefined || Discount_AfterRate == '' ? 0 : Discount_AfterRate;
        ExtraCharges = ExtraCharges == undefined || ExtraCharges == '' ? 0 : ExtraCharges;
        ItemSizeMaster_code = ItemSizeMaster_code == undefined || ItemSizeMaster_code == '' ? 0 : ItemSizeMaster_code;
        SizeCode = SizeCode == undefined || SizeCode == '' ? 0 : SizeCode;
        ThicknessCode = ThicknessCode == undefined || ThicknessCode == '' ? 0 : ThicknessCode;

        var Qty = 0;

        if (UOM.trim().toUpperCase() == 'NOS' || UOM.trim().toUpperCase() == 'MR') {
            Qty = QtyMTR;
            QtyMT = QtyMTR;
        } else if (UOM.trim().toUpperCase() == 'PC') {
            Qty = QtyPC;
        } else {
            Qty = QtyMT;
        }

        if (Amount > 0) {
            var rowData = {};

            rowData["code"] = VisitDetailsCode;
            rowData["visitMaster_Code"] = param_VisitMaster_Code;
            rowData["size"] = Size;
            rowData["thickness"] = Thickness;
            rowData["lengthDesp"] = '';
            rowData["orderQty"] = QtyMT;

            rowData["rate"] = BasicRate;
            rowData["discount"] = Discount == undefined || Discount == "" ? 0 : Discount;
            rowData["amount"] = Amount;
            rowData["remarks"] = Remarks;
            rowData["basicRate"] = BasicRate;
            rowData["extraCharges"] = ExtraCharges;

            rowData["itemDesp"] = ItemName;
            rowData["logicalStock"] = 0;
            rowData["isNewRow"] = 'Y';
            rowData["itemParameterValueMasterSizeCode"] = SizeCode;
            rowData["itemParameterValueMasterTHKCode"] = ThicknessCode;
            rowData["itemParameterValueMasterLengthCode"] = 0;

            rowData["deliveryLocation"] = DeliveryLocation_Code == undefined || DeliveryLocation_Code == "" ? 0 : DeliveryLocation_Code;
            rowData["gstInOrder"] = '';
            rowData["qtyPC"] = QtyPC;
            rowData["rateUnit"] = RateUnit;// UOM;
            rowData["otherCharges"] = OtherCharges;
            rowData["qtyMR"] = QtyMTR;

            rowData["sizeDesp"] = SizeDesp;
            rowData["itemSizeMasterCode"] = ItemSizeMaster_code;
           
            //let d = new Date(DeliveryDate);

            //// Display output
            //console.log(formatDate(d));

            rowData["DeliveryDate"] = convertDateFormatForDeliveryDate(DeliveryDate);
            rowData["ZoneName"] = ZonePriceListCode == undefined || ZonePriceListCode == null ? '' : ZonePriceListCode;
            rowData["DealerMaster_code"] = DealerCode == undefined || DealerCode == "" ? 0 : DealerCode;
            rowData["Tolerance"] = Tolerance == undefined || Tolerance == "" ? 0 : Tolerance;
            rowData["DiscountType"] = DiscountType;
            rowData["AccountMaster_Code_Consignee"] = Consignee_Code == undefined || Consignee_Code == "" ? 0 : Consignee_Code;
            rowData["Discount_AfterRate"] = Discount_AfterRate == undefined || Discount_AfterRate == "" ? 0 : Discount_AfterRate;
            rowData["DiscountType_AfterRate"] = DiscountType_AfterRate;
          
            

            visitOrderDetailsData.push(rowData);
        }
    });

    //allTablesData.push(OrdertableData);

    var visitOtherPartyRow = {};

    visitOtherPartyRow["code"] = 0;
    visitOtherPartyRow["visitMaster_code"] = param_VisitMaster_Code;
    visitOtherPartyRow["partyName"] = '';
    visitOtherPartyRow["stockQty"] = 0;
    visitOtherPartyRow["saleQty"] = 0;
    visitOtherPartyRow["remarks"] = '';
    visitOtherPartyRow["price"] = 0


    visitOtherPartyData.push(visitOtherPartyRow);

    var visitPaymentRow = {};
    visitPaymentRow["code"] = 0;
    visitPaymentRow["visitMaster_code"] = param_VisitMaster_Code;
    visitPaymentRow["paymentMode"] = '';
    visitPaymentRow["paymentDate"] = "2024-12-02T13:04:04.192Z",
        visitPaymentRow["refferenceNo"] = '';
    visitPaymentRow["paymentAmount"] = 0;

    visitPaymentData.push(visitPaymentRow);

    var visitCheckListRow = {};

    visitCheckListRow["code"] = 0;
    visitCheckListRow["visitMaster_code"] = parseInt(param_VisitMaster_Code);
    visitCheckListRow["checkListMaster_code"] = 0;
    visitCheckListRow["fieldValue"] = ''

    visitCheckListData.push(visitCheckListRow);

    allTablesData["visitMaster"] = visitMasterData;
    allTablesData["visitOtherPartyDetail"] = visitOtherPartyData;
    allTablesData["visitPaymentDetails"] = visitPaymentData;
    allTablesData["visitOrderDetails"] = visitOrderDetailsData;
    allTablesData["visitCheckListDetails"] = visitCheckListData;

    var Data = JSON.stringify(allTablesData);

    VisitOrderEntryService.SaveVisit(allTablesData).then(function (response) {

        if (response != '') {
            if (response.Status == 'N') {
                toastr.error(response.Msg);
            } else {

                toastr.success(response.Msg);
                setTimeout(function () {
                    if (param_RoutePlanCode > 0) {
                        window.location = baseUrl + "/CRMTransactions/Visit/Visit";
                    } else {
                        window.location = baseUrl + "/CRMTransactions/OrderEntryList/OrderEntryList";
                    }
                }, 2000); // 2 seconds delay before redirect
            }

        }

    });
}

function GetCRMFixedParameterConfig() {

    VisitOrderEntryService.GetCRMOrderEntryConfig().then(function (response) {

        if (response.length > 0) {

            sessionStorage.setItem('CRMOrderEntryConfig', JSON.stringify(response[0]));
            VisitOrderEntryService.GetFixedParameterQtyConfig().then(function (response) {
                if (response.length > 0) {
                    sessionStorage.setItem('QtyConfig', JSON.stringify(response[0]));
                    PageLoad();

                }
            });
        }
    });
}

//function GetSameDayDuplicateAlert(OrderDate, DealerName) {

//    OrderDate = convertDateFormat(OrderDate);
//    VisitOrderEntryService.GetSameDayDuplicateAlert(OrderDate, DealerName).then(function (response) {

//        if (response.AlertMsg != '') {

//            return response.AlertMsg;
//        } else {
//            return '';
//        }

//    });
//}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}
function convertDateFormatForDeliveryDate(dateString) {
    const [year, month, day] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    var date = new Date(dateString);
    var isoString = date.toISOString();
    //return `${year}-${monthAbbreviation}-${day}`;
    return `${day}-${monthAbbreviation}-${year}`;
    //return `${day}-${monthAbbreviation}-24`;
    //return `${monthAbbreviation}-${day}-24`;
    //return '13-12-2024';
}
function GetAccountMasterDetails() {


    var AccountDesp = $('#txtDealer').val();
    //VisitOrderEntryService.GetAccountMasterDetails(AccountDesp).then(function (response) {

    //    if (response[1] != '') {
    //        var Address = response["AccountMaster"][0].Address1 + ',\n ' + response["AccountMaster"][0].Address2;

    //        $('#txtGSTNo').val(response["AccountMaster"][0].GSTNNo);
    //        $('#txtAddress').val(Address);
    //    }
    //});
    if (AccountDesp == "") {
        toastr.error("Please Select Customer Name!")
        return false;
    }
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    const formattedDate = ('0' + now.getDate()).slice(-2) + '/' +
        ('0' + (now.getMonth() + 1)).slice(-2) + '/' +
        now.getFullYear();


    // var msg = GetSameDayDuplicateAlert(formattedDate, AccountDesp);

    var OrderDate = convertDateFormat(formattedDate);
    var msg = '';
    VisitOrderEntryService.GetSameDayDuplicateAlert(OrderDate, AccountDesp).then(function (response) {

        if (response.AlertMsg != '') {
            msg = response.AlertMsg;
                var r = confirm(" '" + msg + "' ");
                if (r == true) {
                    AccountDesp = normalizeText(AccountDesp);

                    GetDealerDetailsByDealerName();
                    SetBlankOrderBookingTable();
                    AddFiveNewRows();
                    //GetAccountDeliveryLocationDetails();
                    SetOrderBookingTableHeaderAsPerConfig();
                } else {
                    if (param_RoutePlanCode > 0) {
                        window.location = baseUrl + "/CRMTransactions/Visit/Visit";
                    } else {
                        window.location = baseUrl + "/CRMTransactions/OrderEntryList/OrderEntryList";
                    }
                }
            
        } else {
            GetDealerDetailsByDealerName();
            SetBlankOrderBookingTable();
            AddFiveNewRows();
            //GetAccountDeliveryLocationDetails();
            SetOrderBookingTableHeaderAsPerConfig();
        }

    });
    
   
}


// Funciton to extract day, month, and year 
function formatDate(date) {
    let day = date.getDate();
    if (day < 10) {
        day = "0" + day;
    }
    let month = date.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    let year = date.getFullYear();
    return month + "/" + day + "/" + year;
}
function normalizeText(text) {
    var newValue = '';
    var specialChars = ".-#,=}]')[(*&$/@@ ";

    for (var i = 0; i < text.length; i++) {
        if (!specialChars.includes(text[i])) {
            newValue += text[i];
        }
    }
    return newValue.toUpperCase();
}
function GetDealerDetailsByDealerName() {
    //var CRM_Config = JSON.parse(sessionStorage.getItem('CRMConfig'));


    //var QtyPCHeader = CRM_Config.QtyPCHeader;
    //var QtyMTRHeader = CRM_Config.QtyMTRHeader;
    //var QtyMTHeader = CRM_Config.QtyMTHeader;
    //var SizeApplicableInOrder = CRM_Config.SizeApplicableInOrder;
    //var ThkApplicableInOrder = CRM_Config.ThkApplicableInOrder;


    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMTR;
    var QtyMTHeader = Qty_Config.QtyMT;

    var DistributorDealerApplicableInOrder = CRM_Config.ShowDealerColumn;
    var SizeApplicableInOrder = CRM_Config.ShowSizeThicknessColumns;

    var AccountDesp = $('#txtDealer').val();
    AccountDesp = normalizeText(AccountDesp);
    VisitOrderEntryService.GetDealerDetailsByDealerName(AccountDesp).then(function (response) {

        if (response.GetERPDataPanelTwoDirectOrderDashBoard.length > 0) {
            $('#txtCreditLimitRs').val(response.GetERPDataPanelTwoDirectOrderDashBoard[0].CreditLimitRs);
            $('#txtCreditDays').val(response.GetERPDataPanelTwoDirectOrderDashBoard[0].CreditDays);
            $('#txtOverDueAmount').val(response.GetERPDataPanelTwoDirectOrderDashBoard[0].OverDueAmount);
            $('#txtOutstanding').val(response.GetERPDataPanelTwoDirectOrderDashBoard[0].Outstanding);
        } else {
            $('#txtCreditLimitRs').val(0);
            $('#txtCreditDays').val(0);
            $('#txtOverDueAmount').val(0);
            $('#txtOutstanding').val(0);
        }
        if (response.GetSaleDataPanelTwoDashboardDirectOrder.length > 0) {
            $('#txtLastMonthSales').val(response.GetSaleDataPanelTwoDashboardDirectOrder[0].LastMonthSales);
            $('#txtCurrentMonthSale').val(response.GetSaleDataPanelTwoDashboardDirectOrder[0].CurrentMonthSalesAsOnDate);
            $('#txtTarget').val(response.GetSaleDataPanelTwoDashboardDirectOrder[0].Target);
            $('#txtTargetShortFall').val(response.GetSaleDataPanelTwoDashboardDirectOrder[0].TargetShortFall);
        } else {
            $('#txtLastMonthSales').val(0);
            $('#txtCurrentMonthSale').val(0);
            $('#txtTarget').val(0);
            $('#txtTargetShortFall').val(0);
        }
        if (response.GetAllPaymentHistoryDataForDirectOrder.length > 0) {
            $('#divtblPaymentHistory').prop('hidden', false);
            $('#paginator-PaymentHistorydata').prop('hidden', false);

            const StringFilterColumn = ["OrderNo", "InvoiceNo"];
            const NumericFilterColumn = ["BillAmount"];
            const DateFilterColumn = ["OrderDate", "DeliveryDate", "Paymentdate"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                "ReceiptPayment": 'right',
                "Balance": 'right',
                "BillAmount": 'right',
                "DispatchQtyMt": 'right',
                "CreditDays": 'right',
                "OrderDate": 'center',
                "DeliveryDate": 'center',
                "Paymentdate": 'center'
            };
            BizsolCustomFilterGrid.CreateDataTable("thPaymentHistory", "PaymentHistorydata", response.GetAllPaymentHistoryDataForDirectOrder, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        } else {
            $('#divtblPaymentHistory').prop('hidden', true);
            $('#paginator-PaymentHistorydata').prop('hidden', true);
        }

        if (response.GetPendingData.length > 0) {
            $('#divtblPendingOrder').prop('hidden', false);
            $('#paginator-tblPendingOrder').prop('hidden', false);

            const StringFilterColumn = ["OrderNo", "ItemName"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["AccountDesp"];
            const ColumnAlignment = {
                "BalQtyPC": 'right',
                "BalQtyMT": 'right',
                "BalQtyMTRS": 'right'
            };
            if (QtyPCHeader == '') {
                hiddenColumns.push("BalQtyPC");
            }
            if (QtyMTRHeader == '') {
                hiddenColumns.push("BalQtyMTRS");
            }
            if (QtyMTHeader == '') {
                hiddenColumns.push("BalQtyMT");
            }
            if (SizeApplicableInOrder == 'N') {
                hiddenColumns.push("SizeDesp");
            }
            BizsolCustomFilterGrid.CreateDataTable("thPendingOrder", "PendingOrderdata", response.GetPendingData, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        }
        else {
            $('#divtblPendingOrder').prop('hidden', true);
            $('#paginator-tblPendingOrder').prop('hidden', true);
        }

        if (response.GetSizeWiseSalesDataForDirectOrder.length > 0) {
            $('#divtblSizeWiseSales').prop('hidden', false);
            $('#paginator-tblSizeWiseSales').prop('hidden', false);

            const StringFilterColumn = ["ItemName"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                "QtyMT": 'right',
                "Pcs": 'right'
            };
            if (QtyPCHeader == '') {
                hiddenColumns.push("Pcs");
            }
            if (QtyMTHeader == '') {
                hiddenColumns.push("QtyMT");
            }
            if (SizeApplicableInOrder == 'N') {
                hiddenColumns.push("Size");
            }
            if (SizeApplicableInOrder == 'N') {
                hiddenColumns.push("Thickness");
            }
            BizsolCustomFilterGrid.CreateDataTable("thSizeWiseSales", "SizeWiseSalesdata", response.GetSizeWiseSalesDataForDirectOrder, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)

        }
        else {
            $('#divtblSizeWiseSales').prop('hidden', true);
            $('#paginator-tblSizeWiseSales').prop('hidden', true);
        }

        if (response.GetDeliveryLocationDealerCode.length > 0) {
            $('#txtGSTNo').val(response.GetDeliveryLocationDealerCode[0].GSTNNo);
            $('#txtAddress').val(response.GetDeliveryLocationDealerCode[0].Address);
            $('#hfDealerZone').val(response.GetDeliveryLocationDealerCode[0].DealerZone);

        } else {
            $('#txtGSTNo').val('');
            $('#txtAddress').val('');
            $('#hfDealerZone').val('');
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


function GetItemSizeList(x, RowNo) {
    var ObjCurrRow = $(x).closest('tr');
    var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
    var ItemMasterCode = 0;
    var array = $('#listItem')[0];
    var arrValue;
    var Valid = false;

    for (var i = 0; i < array.options.length; i++) {
        arrValue = htmlDecode(array.options[i].innerHTML);

        if (arrValue.trim().toUpperCase().replace("\u0026", "&") == ItemName.trim().toUpperCase().replace("&amp;", "&")) {
            Valid = true;
        }
    }
    if (Valid == false) {
        toastr.error("Invalid Item Name!");
        $(x).val('');
        return false;
    } else {
        VisitOrderEntryService.GetSizeParameterAsPerChart(ItemName).then(function (response) {
            if (response.length > 0) {
                $('#listItemSize_' + RowNo + ' option').empty();
                var option = '';
                for (var i = 0; i < response.length; i++) {

                    option += '<option data-code="' + response[i].ItemParameterValueMaster_Code_Size + '">' + response[i].SizeDesp + '</option>'
                }
                $('#listItemSize_' + RowNo)[0].innerHTML = option;

            }

        });
    }

}
function GetItemThicknessList(x, RowNo) {
    var ObjCurrRow = $(x).closest('tr');
    var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
    var Size = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Size + ')')[0].getElementsByTagName('input')[0].value;
    var ItemMasterCode = 0;
    var array = $('#listItemSize_' + RowNo)[0];
    var arrValue;
    var Valid = false;

    for (var i = 0; i < array.options.length; i++) {
        arrValue = htmlDecode(array.options[i].innerHTML);

        if (arrValue.trim().toUpperCase().replace("\u0026", "&") == Size.trim().toUpperCase().replace("&amp;", "&")) {
            Valid = true;
        }
    }
    if (Valid == false) {
        toastr.error("Invalid Size!")
        return false;
    } else {
        VisitOrderEntryService.GetThkParameterAsPerChart(ItemName, Size).then(function (response) {
            if (response.length > 0) {
                $('#listItemThickness_' + RowNo + ' option').empty();
                var option = '';
                for (var i = 0; i < response.length; i++) {

                    option += '<option data-code="' + response[i].ItemParameterValueMaster_Code_THK + '">' + response[i].ThkDesp + '</option>'
                }
                $('#listItemThickness_' + RowNo)[0].innerHTML = option;

            }

        });
    }

}


function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}


function SetOrderBookingTableHeaderAsPerConfig() {
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader_MT = Qty_Config.QtyMT;

    var AskDiscountItemWise = CRM_Config.AskDiscountItemWise;
    var ShowTolerance = CRM_Config.ShowTolerance;

    var ShowDealerColumn = CRM_Config.ShowDealerColumn;
    var ShowSizeThicknessColumns = CRM_Config.ShowSizeThicknessColumns;
    var ShowUOM = CRM_Config.ShowUOM;
    var ShowZone = CRM_Config.ShowZone;
    var AllowToChangeBasicRate = CRM_Config.AllowToChangeBasicRate;
    var ShowConsignee = CRM_Config.ShowConsignee;
    var ShowDeliveryAddress = CRM_Config.ShowDeliveryAddress;
    var ShowExtraCharge = CRM_Config.ShowExtraCharge;
    var ShowOrderRate = CRM_Config.ShowOrderRate;
    var ShowDeliveryDate = CRM_Config.ShowDeliveryDate;
    var ShowRemarks = "Y";
    var ShowStock = CRM_Config.ShowStock;
    var ShowExtraColumnOrderQtyAndUnit = CRM_Config.ShowExtraColumnOrderQtyAndUnit;
    var ShowDefaultRateUnit = CRM_Config.ShowDefaultRateUnit;


    var QtyMT	= Qty_Config.QtyMT	    ;
    var QtyPC	= Qty_Config.QtyPC	    ;
    var QtyMR	= Qty_Config.QtyMR	    ;
    var Unit    = Qty_Config.Unit        ;
    var RateUnit = Qty_Config.RateUnit;



    if (QtyPC == '') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyPC + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderQtyPC + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.OrderQtyPC + 1) + ")").css('display', 'none');

    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyPC + 1) + ")").text('QTY ' + QtyPC);
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyPC + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderQtyPC + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.OrderQtyPC + 1) + ")").css('display', '');
    }
    if (QtyMR == '') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyMTR + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderQtyMTR + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.OrderQtyMTR + 1) + ")").css('display', 'none');

    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyMTR + 1) + ")").text('QTY ' + QtyMR);
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyMTR + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderQtyMTR + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.OrderQtyMTR + 1) + ")").css('display', '');
    }
    if (QtyMT == '') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyMT + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderQtyMT + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.OrderQtyMT + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyMT + 1) + ")").text('QTY ' + QtyMT);
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyMT + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderQtyMT + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.OrderQtyMT + 1) + ")").css('display', '');
    }

    if (ShowUOM == 'NA') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.UOM + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.UOM + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.UOM + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.UOM + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.UOM + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.UOM + 1) + ")").css('display', '');
    }

    if (ShowUOM == 'As Per Master' && ShowExtraColumnOrderQtyAndUnit == 'Y') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyMT + 1) + ")").text('Item Qty');
    }

    if (ShowZone == 'N') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.ZonePriceListCode + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.ZonePriceListCode + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.ZonePriceListCode + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.ZonePriceListCode + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.ZonePriceListCode + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.ZonePriceListCode + 1) + ")").css('display', '');
    }
    if (AllowToChangeBasicRate == 'Y') {
        $('#tblorderbooking  input[name="txtBasicRate"]').prop('disabled', false);
        $('#tblorderbooking input[name="txtOrderRate"]').prop('disabled', false);
        $('#tblorderbooking  input[name="txtExtraCharges"]').prop('disabled', false);
    } else {
        $('#tblorderbooking  input[name="txtBasicRate"]').prop('disabled', true);
        $('#tblorderbooking input[name="txtOrderRate"]').prop('disabled', true);
        $('#tblorderbooking  input[name="txtExtraCharges"]').prop('disabled', true);
    }
    if (ShowDealerColumn == 'N') {

        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DealerName + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.DealerName + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.DealerName + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DealerName + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.DealerName + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.DealerName + 1) + ")").css('display', '');
    }

    if (ShowConsignee == 'N') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Consignee + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Consignee + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child:first-child td:nth-child(" + (Indx_TblOrder.Consignee + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Consignee + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Consignee + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Consignee + 1) + ")").css('display', '');
    }

    if (ShowDeliveryAddress == 'N') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DeliveryAddress + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.DeliveryAddress + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.DeliveryAddress + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DeliveryAddress + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.DeliveryAddress + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.DeliveryAddress + 1) + ")").css('display', '');
    }
    if (ShowExtraCharge == 'N') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.ExtraCharges + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.ExtraCharges + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.ExtraCharges + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.ExtraCharges + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.ExtraCharges + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.ExtraCharges + 1) + ")").css('display', '');
    }
    if (ShowOrderRate == 'N') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderRate + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderRate + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.OrderRate + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderRate + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderRate + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.OrderRate + 1) + ")").css('display', '');
    }
    if (ShowDeliveryDate == 'Item Wise') {
       
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DeliveryDate + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.DeliveryDate + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.DeliveryDate + 1) + ")").css('display', '');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DeliveryDate + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.DeliveryDate + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.DeliveryDate + 1) + ")").css('display', 'none');
    }
    if (ShowRemarks == 'N') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Remarks + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Remarks + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Remarks + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Remarks + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Remarks + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Remarks + 1) + ")").css('display', '');
    }

    if (ShowSizeThicknessColumns == 'N') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Size + 1) + ")").css('display', 'none');
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Thickness + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Size + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Thickness + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Size + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Thickness + 1) + ")").css('display', 'none');
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.SizeDesp + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.SizeDesp + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.SizeDesp + 1) + ")").css('display', 'none');
    } else {
        var objToggle = $('#toggleSwitch');
        ShowSizeDespButton(objToggle[0]);
    }
   
    if (ShowStock == '') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Stock + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Stock + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Stock + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Stock + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Stock + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Stock + 1) + ")").css('display', '');
        $('#tblorderbooking  input[name="txtStock"]').prop('disabled', true);
    }

    if (ShowExtraColumnOrderQtyAndUnit == 'N') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQTY + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderQTY + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.OrderQTY + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQTY + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderQTY + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.OrderQTY + 1) + ")").css('display', '');
    }

    if (ShowExtraColumnOrderQtyAndUnit == 'N') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderUOM + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderUOM + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.OrderUOM + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderUOM + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderUOM + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.OrderUOM + 1) + ")").css('display', '');
    }
    if (ShowTolerance == 'N') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Tolerance + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Tolerance + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Tolerance + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Tolerance + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Tolerance + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Tolerance + 1) + ")").css('display', '');
    }
    if (ShowDefaultRateUnit == 'N') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.RateUnit + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.RateUnit + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.RateUnit + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.RateUnit + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.RateUnit + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.RateUnit + 1) + ")").css('display', '');
    }
    
    if (AskDiscountItemWise == 'NA') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DiscountType + 1) + ")").css('display', 'none');
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Discount + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.DiscountType + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Discount + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.DiscountType + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Discount + 1) + ")").css('display', 'none');

        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DiscountType_AfterRate + 1) + ")").css('display', 'none');
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Discount_AfterRate + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.DiscountType_AfterRate + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Discount_AfterRate + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.DiscountType_AfterRate + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Discount_AfterRate + 1) + ")").css('display', 'none');

    } else if (AskDiscountItemWise == 'Before Order Rate') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DiscountType + 1) + ")").css('display', '');
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Discount + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.DiscountType + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Discount + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.DiscountType + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Discount + 1) + ")").css('display', '');

        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DiscountType_AfterRate + 1) + ")").css('display', 'none');
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Discount_AfterRate + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.DiscountType_AfterRate + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Discount_AfterRate + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.DiscountType_AfterRate + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Discount_AfterRate + 1) + ")").css('display', 'none');
    } else if (AskDiscountItemWise == 'Both') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DiscountType + 1) + ")").css('display', '');
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Discount + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.DiscountType + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Discount + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.DiscountType + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Discount + 1) + ")").css('display', '');

        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DiscountType_AfterRate + 1) + ")").css('display', '');
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Discount_AfterRate + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.DiscountType_AfterRate + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Discount_AfterRate + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.DiscountType_AfterRate + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Discount_AfterRate + 1) + ")").css('display', '');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DiscountType + 1) + ")").css('display', 'none');
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Discount + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.DiscountType + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Discount + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.DiscountType + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Discount + 1) + ")").css('display', 'none');

        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DiscountType_AfterRate + 1) + ")").css('display', '');
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Discount_AfterRate + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.DiscountType_AfterRate + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Discount_AfterRate + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.DiscountType_AfterRate + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Discount_AfterRate + 1) + ")").css('display', '');
    }


    
    //$("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Amount + 1) + ")").css('display', 'none');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Delete + 1) + ")").css('display', 'none');
    
    // Hide Columns
    
    
    
    
    //$("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Amount + 1) + ")").css('display', 'none');
    $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Delete + 1) + ")").css('display', 'none');
    
   

    // Hide Footer Columns

    
    //$("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Amount + 1) + ")").css('display', 'none');
    $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Delete + 1) + ")").css('display', 'none');
   

}
function ShowSizeDespButton(x) {
    if (x.checked == true) {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.SizeDesp + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.SizeDesp + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.SizeDesp + 1) + ")").css('display', '');

        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Size + 1) + ")").css('display', 'none');
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Thickness + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Size + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Thickness + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Size + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Thickness + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.SizeDesp + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.SizeDesp + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.SizeDesp + 1) + ")").css('display', 'none');

        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Size + 1) + ")").css('display', '');
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Thickness + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Size + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Thickness + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Size + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Thickness + 1) + ")").css('display', '');
    }
}

function ShowFooterTotal() {
    var totalAmount = 0;
    var totalQty = 0;
    var totalPC = 0;
    var totalMTR = 0;
    var totalDiscount = 0;
    var totalDiscount_AfterRate = 0;
    $('#tblorderbooking tbody tr').each(function () {
        var Amount = parseFloat($(this).find('input[name="txtAmount"]').val());
        var qty = parseFloat($(this).find('input[name="txtOrderQtyMT"]').val());
        var qtyPC = parseFloat($(this).find('input[name="txtOrderQtyPC"]').val());
        var qtyMTR = parseFloat($(this).find('input[name="txtOrderQtyMTR"]').val());
        var Discount = parseFloat($(this).find('input[name="txtDiscount"]').val());
        var Discount_AfterRate = parseFloat($(this).find('input[name="txtDiscount_AfterRate"]').val());

        if (!isNaN(Amount)) {
            totalAmount += Amount;
        }
        if (!isNaN(qty)) {
            totalQty += qty;
        }
        if (!isNaN(qtyPC)) {
            totalPC += qtyPC;
        }
        if (!isNaN(qtyMTR)) {
            totalMTR += qtyMTR;
        }
        if (!isNaN(Discount)) {
            totalDiscount += Discount;
        }
        if (!isNaN(Discount_AfterRate)) {
            totalDiscount_AfterRate += Discount_AfterRate;
        }
    });
    totalAmount = parseFloat(totalAmount).toFixed(2);
    totalQty = parseFloat(totalQty).toFixed(1);
    totalPC = parseFloat(totalPC).toFixed(1);
    totalMTR = parseFloat(totalMTR).toFixed(1);

    $('#txtAmountTotal').text(totalAmount);
    $('#txtOrderQtyMTTotal').text(totalQty);
    $('#txtOrderQtyPCTotal').text(totalPC);
    $('#txtOrderQtyMTRTotal').text(totalMTR);
    $('#txtDiscountTotal').text(parseFloat(totalDiscount).toFixed(2));
    $('#txtDiscountTotal_AfterRate').text(parseFloat(totalDiscount_AfterRate).toFixed(2));
}

function GetUOM(rowNo) {
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var FixedParameter = JSON.parse(sessionStorage.getItem('FixedParameter'));
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));

    var ToleranceValue = FixedParameter.ShowBuyerPOToleranceValue;
    var DefaultRateUnit = Qty_Config.DefaultRateUnit;
    var ShowTolerance = CRM_Config.ShowTolerance;

    if (ShowTolerance == 'Y') {
        $('#txtTolerance' + rowNo).val(ToleranceValue);
    }

    $('#txtRateUnit' + rowNo).val(DefaultRateUnit);

    var ItemMasterTable = JSON.parse(sessionStorage.getItem('ItemMasterTable'));

    var ItemName = $('#txtItemName' + rowNo).val();


    var ItemUOM = '';
    var UOMDecimalUnit = '';
    var arr = [];

    var SizeApplicable = 'Y';
    var ThkApplicable = 'Y';
    var LenApplicable = 'Y';
    var option = '';
    for (var i = 0; i < ItemMasterTable.length; i++) {
        arr = ItemMasterTable[i];

        if (arr.ItemName == ItemName) {
            ItemUOM = arr.UOM;
            UOMDecimalUnit = arr.DecimalPoints;


            //SizeApplicable = b_col[3];
            //ThkApplicable = b_col[4];
            //LenApplicable = b_col[5];

        }

        option += '<option text="' + arr.UOM + '">' + arr.UOM + '</option>'

    }
    $('#listUOM_' + rowNo + ' option').empty();
    $('#listUOM_' + rowNo)[0].innerHTML = option;
    if (ItemUOM != '') {
        $('#txtUOM' + rowNo).val(ItemUOM);
        $('#UOMDecimalUnit_' + rowNo).val(UOMDecimalUnit);

    }

    //// Under Direct order Entry Allow to copy Rate from the last row if item name is same and RateUnit is KG.
    if (rowNo > 1) {
        var i = rowNo;
        var j = i - 1;



    }


    //$('#txtSizeApplicable_' + rowNo).val(SizeApplicable);
    //$('#txtThkApplicable_' + rowNo).val(ThkApplicable);
    //$('#txtLenApplicable_' + rowNo).val(LenApplicable);

    //if (ThkApplicable == 'N') {
    //    $('#txtThickness_' + rowNo).attr("disabled", true);
    //} else {
    //    $('#txtThickness_' + rowNo).attr("disabled", false);
    //}
    //if (LenApplicable == 'N') {
    //    $('#txtLength_' + rowNo).attr("disabled", true);
    //} else {
    //    $('#txtLength_' + rowNo).attr("disabled", false);
    //    $('#txtLength_' + rowNo).val('6');
    //}

    //// Under Direct order Entry Allow to copy Rate from the last row if item name is same and RateUnit is KG.

    //var tblorderbookingDetails = document.getElementById("tblorderbooking");

    //if (rowNo > 1) {
    //    var i = rowNo;
    //    var j = i - 1;

    //    var CurrRow = tblorderbookingDetails.rows[i];
    //    var ItemName = CurrRow.cells[OrderTblIdx.ItemName].innerHTML.trim();
    //    var PreRow = tblorderbookingDetails.rows[j];

    //    var PreIsNewRow = PreRow.cells[OrderTblIdx.IsNewRow].getElementsByTagName('input')[0].value;
    //    var PreItemName = PreRow.cells[OrderTblIdx.ItemName].innerHTML.trim();
    //    if (PreItemName.includes("text") == false) {
    //        var PreItemText = PreItemName;
    //    } else {
    //        var PreItemText = PreRow.cells[OrderTblIdx.ItemName].getElementsByTagName('input')[0].value;
    //    }


    //    var IsNewRow = CurrRow.cells[OrderTblIdx.IsNewRow].getElementsByTagName('input')[0].value;
    //    var ItemText = CurrRow.cells[OrderTblIdx.ItemName].getElementsByTagName('input')[0].value;

    //    if (ItemName !== "" && ItemName.includes("btnAddNewRow") === false && PreIsNewRow == 'Y') {

    //        if (IsNewRow !== 'N' || ItemName.includes("text") !== false) {
    //            var BasicRate = parseFloat(PreRow.cells[OrderTblIdx.BasicRate].getElementsByTagName('input')[0].value).toFixed(2);
    //            var RateUnit = PreRow.cells[OrderTblIdx.RateUnit].getElementsByTagName('input')[0].value;

    //            if (BasicRate > 0 && PreItemText == ItemText && RateUnit == 'KG') {
    //                CurrRow.cells[OrderTblIdx.BasicRate].getElementsByTagName('input')[0].value = parseFloat(BasicRate).toFixed(2);
    //            }
    //        }
    //    }

    //}


}


function GetFreightList() {

    VisitOrderEntryService.GetFreightList().then(function (response) {
        var defaultValue = '';

        if (response.length > 0) {
            $('#listFreight option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                if (i == 1) {
                    defaultValue = response[1].Field;
                }
                option += '<option text="' + response[i].Code + '">' + response[i].Field + '</option>'
            }
            $('#listFreight')[0].innerHTML = option;

        }
        if (param_VisitMode == 'New') {
            $('#txtlistFreight').val(defaultValue);
        }

    });

}
function GetFreightTypeList() {

    VisitOrderEntryService.GetFreightTypeList().then(function (response) {
        var defaultValue = '';
        if (response.length > 0) {
            $('#listFreightType option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                if (i == 1) {
                    defaultValue = response[i].Field;
                }
                option += '<option text="' + response[i].Code + '">' + response[i].Field + '</option>'
            }
            $('#listFreightType')[0].innerHTML = option;

        }
        if (param_VisitMode == 'New') {
            $('#txtFreightType').val(defaultValue);
        }
    });

}
function GetPaymentTerms() {

    VisitOrderEntryService.GetPaymentTermsMasterList().then(function (response) {
        var defaultValue = '';
        var defaultCode = 0;
        if (response.length > 0) {
            $('#listPaymentTerms option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                if (i == 1) {
                    defaultValue = response[i].Desp;
                    defaultCode = response[i].Code;
                }
                option += '<option data-code="' + response[i].Code + '">' + response[i].Desp + '</option>'
            }
            $('#listPaymentTerms')[0].innerHTML = option;

        }
        if (param_VisitMode == 'New') {
            $('#txtPaymentTerms').val(defaultValue);
            $('#hiddentxtPaymentTerm').val(defaultCode);
        }
    });

}
function GetAccountDeliveryLocationDetails(x,RowNo) {
    var ObjCurrRow = $(x).closest('tr');
    var AccountDesp = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Consignee + ')')[0].getElementsByTagName('input')[0].value;

    ObjCurrRow.find('td:eq(' + Indx_TblOrder.DeliveryAddress + ')')[0].getElementsByTagName('input')[0].value = '';
    //var AccountDesp = $("#txtDealer").val();
    AccountDesp = normalizeText(AccountDesp);
    VisitOrderEntryService.GetAccountDeliveryLocationDetails(AccountDesp).then(function (response) {
        if (response.length > 0) {


            $('#listDeliveryLocation' + RowNo+' option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {

                option += '<option data-code="' + response[i].Select + '">' + response[i].AddressCode + '</option>'
            }
            $('#listDeliveryLocation' + RowNo )[0].innerHTML = option;

            const StringFilterColumn = ["AddressCode", "City","State"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["AccountMaster_Code","AccountDesp"];
            const ColumnAlignment = {
            };
            response.forEach((item, index) => {
                item["Select"] = `<input type="radio" name="record"  data-index="${index}" value="${item["Select"] || 0}" class="select-record">`;
            });
            BizsolCustomFilterGrid.CreateDataTable("ConsigneeDeliveryAddress-header", "ConsigneeDeliveryAddress-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        }

    });
}
function GetEditVisitDetails() {

    SetOrderBookingTableHeaderAsPerConfig();
    VisitOrderEntryService.GetEditVisitDetails(param_RoutePlanCode, param_VisitMaster_Code).then(function (response) {

        if (response.VisitORroutePlanMaster.length > 0) {


            $('#txtUserName').val(response.VisitORroutePlanMaster[0].PlanUserName);
            $('#txtdate').val(response.VisitORroutePlanMaster[0].Date);
            $('#txtDealer').val(response.VisitORroutePlanMaster[0].OrderDealerName);
            $('#txtCheckInTime').val(response.VisitORroutePlanMaster[0].CheckIn);
            $('#txtRemarks').val(response.VisitORroutePlanMaster[0].Remarks);
            $('#txtAddLocation').val(response.VisitORroutePlanMaster[0].Location);
            $('#txtNextVistDate').val(response.VisitORroutePlanMaster[0].NextVisitDate);
            $('#txtFreightType').val(response.VisitORroutePlanMaster[0].FreightType);
            $('#txtCurrentLocation').val(response.VisitORroutePlanMaster[0].CheckInLocation);
            $('#txtDeliveryDays').val(response.VisitORroutePlanMaster[0].DeliveryDaysForOrder);
            $('#hfFileInput').val(response.VisitORroutePlanMaster[0].PanelOneAttachment);
            $('#txtCreditDaysForDC').val(response.VisitORroutePlanMaster[0].CreditDays);
            $('#txtlistFreight').val(response.VisitORroutePlanMaster[0].Freight);
            //$('#txtZone').val(response.VisitORroutePlanMaster[0].ZoneName);
            $('#hfVisitType').val(response.VisitORroutePlanMaster[0].VisitType);
            $('#txtPaymentTerms').val(response.VisitORroutePlanMaster[0].PaymentTerm);
            $('#hiddentxtPaymentTerm').val(response.VisitORroutePlanMaster[0].PaymentTermsMaster_Code);
            $('#txtBuyerPONo').val(response.VisitORroutePlanMaster[0].BuyerPONo);
            



        }
        if (response.VisitOrderDetails.length > 0) {
            PopulateOrderBookingTable(response.VisitOrderDetails);
        }

        GetDealerDetailsByDealerName();
        GetMaxBasicRate();
        calFinalAmt();
        SetImageControl();
        var VisitType = $('#hfVisitType').val();
        if (VisitType != '' && VisitType != undefined && VisitType != null && VisitType == 'New Acquisition') {
            $('#divOrderBooking').prop('hidden', true);
        } else {
            $('#divOrderBooking').prop('hidden', false);
        }


    });



    //GetDealerDetailsByDealerName();

   

}

function PopulateOrderBookingTable(data) {
    var tbody = $('#tblorderbooking tbody');
    var OtherCharges = 0;

    var ShowToggleSize = false;

    // Clear any existing rows
    tbody.empty();
    //SetOrderBookingTableHeaderAsPerConfig();

    // Loop through the data and append rows
    data.forEach(function (item, index) {

        var tbItemConsumeRowNo = index + 1;
        var DelDate = new Date(item.DeliveryDate).toISOString().split("T")[0];
        var date = new Date(item.DeliveryDate);  // Create a Date object for the particular date

        // Format as yyyy-mm-dd
        var formattedDate = date.getFullYear() + '-' +
            ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
            ('0' + date.getDate()).slice(-2);

        if (item.ItemSizeMaster_Code > 0) {
            ShowToggleSize = true;
        }

        var td_Consignee = `<input type="text" id="txtConsignee` + tbItemConsumeRowNo + `" class="BizSolFormControl box_border form-control form-control-sm" name="txtConsignee" placeholder="" onclick="$(this).val(\'\')" autocomplete="off"   required><input type="hidden" id="hdnConsigneeCode` + tbItemConsumeRowNo + `" value="${item.AccountMaster_Code_Consignee}" name="hdnConsigneeCode">`;
        var td_DeliveryAddress = `<input type="text" id="txtDeliveryAddress` + tbItemConsumeRowNo + `" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryAddress" placeholder="" onclick="$(this).val(\'\')" autocomplete="off"  required><input type="hidden" id="hdnAddressCode` + tbItemConsumeRowNo + `" name="hdnAddressCode" value="${item.DeliveryLocation_Code}">`;
        var td_ItemName = `<input type="text"  id="txtItemName` + tbItemConsumeRowNo + `" value="${item.ItemName}" onkeypress = "BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name = "txtItemName" placeholder = "" list = "listItem" autocomplete = "off" onclick = "$(this).val(\'\')"  onchange = "GetItemSizeList(this,` + tbItemConsumeRowNo + `);GetLatestPriceListByItemName(this,` + tbItemConsumeRowNo + `);" required >`;
        var td_Size = `<datalist id = "listItemSize_` + tbItemConsumeRowNo + `" ></datalist > <input type="text" id="txtSize` + tbItemConsumeRowNo + `"  value="${item.Size}" title="${item.Size}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtSize" placeholder="" list="listItemSize_` + tbItemConsumeRowNo + `" autocomplete="off" onclick="$(this).val(\'\')" onchange="GetItemThicknessList(this,` + tbItemConsumeRowNo + `)" required disabled><input type="hidden" id="hdnSizeMasterCode` + tbItemConsumeRowNo + `" name="hdnSizeMasterCode"  value="${item.ItemParameterValueMasterSizeCode}">`;
        var td_Thickness = `<datalist id="listItemThickness_` + tbItemConsumeRowNo + `"></datalist><input type="text"  id="txtThickness` + tbItemConsumeRowNo + `"  value="${item.ThickNess}" title="${item.ThickNess}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtThickness" placeholder="" list="listItemThickness_` + tbItemConsumeRowNo + `" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required disabled><input type="hidden" id="hdnThkMasterCode` + tbItemConsumeRowNo + `" name="hdnThkMasterCode"  value="${item.ItemParameterValueMasterTHKCode}">`;
        var td_SizeDesp = `<input type="text"  id="txtSizeDesp` + tbItemConsumeRowNo + `" onkeypress="BizSolhandleEnterKey(event);"  value="${item.SizeDesp}" title="${item.SizeDesp}"  class="BizSolFormControl box_border form-control form-control-sm" name="txtSizeDesp" placeholder="" list="listItemSizeMaster" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required disabled><input type="hidden" id="hdnItemSizeMasterCode` + tbItemConsumeRowNo + `" name="hdnItemSizeMasterCode"  value="${item.ItemSizeMaster_Code}">`;
        var td_UOM = `<datalist id="listUOM_` + tbItemConsumeRowNo + `"></datalist><input type="text"  id="txtUOM` + tbItemConsumeRowNo + `"  value="${item.UOM}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name="txtUOM" placeholder="" list="listUOM_` + tbItemConsumeRowNo + `" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_Stock = `<input type="text"  id="txtStock` + tbItemConsumeRowNo + `" onkeypress="BizSolhandleEnterKey(event);"  value=""  class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtStock" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_OrderQtyPC = `<input type="text"  id="txtOrderQtyPC` + tbItemConsumeRowNo + `" onkeypress="BizSolhandleEnterKey(event);"  value="${item.QtyPC}"  class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderQtyPC" placeholder=""  autocomplete="off"   onchange="" required>`;
        var td_OrderQtyMT = `<input type = "number"  id = "txtOrderQtyMT` + tbItemConsumeRowNo + `"  value="${item.OrderQty}"  onkeypress = "BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name = "txtOrderQtyMT" placeholder = ""  autocomplete = "off"   onchange = "CalculateAmount(this);" required >`;
        var td_OrderQtyMTR = `<input type="number"  id="txtOrderQtyMTR` + tbItemConsumeRowNo + `"  value="${item.QtyMR}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderQtyMTR" placeholder=""  autocomplete="off"   onchange="CalculateAmount(this);" required>`;
        var td_OrderUOM = `<input type="text"  id="txtOrderUOM` + tbItemConsumeRowNo + `"  value="${item.RateUnit}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name="txtOrderUOM" placeholder="" list="listUOM" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_OrderQTY = `<input type="number"  id="txtOrderQTY` + tbItemConsumeRowNo + `"  value="${item.OrderQty}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderQTY" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_Tolerance = `<input type="number"  id="txtTolerance` + tbItemConsumeRowNo + `" value="${item.Tolerance}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtTolerance" placeholder=""  autocomplete="off"   required>`;

        var td_BasicRate = `<input type="number"  id="txtBasicRate` + tbItemConsumeRowNo + `"  value="${item.BasicRate}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtBasicRate" placeholder=""  autocomplete="off"   onchange="CalculateAmount(this);GetMaxBasicRate();calFinalAmt();" required>`;
        var td_ExtraCharges = `<input type="number"  id="txtExtraCharges` + tbItemConsumeRowNo + `"  value="${item.ExtraCharges}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtExtraCharges" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_DiscountType = `<input type="text"  id="txtDiscountType` + tbItemConsumeRowNo + `" value="${item.DiscountType}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType" placeholder="" list="listDiscountType" autocomplete="off" onclick="$(this).val(\'\')"  onchange="CalculateAmount(this);" required>`;
        var td_Discount = `<input type="number"  id="txtDiscount` + tbItemConsumeRowNo + `" value="${item.Discount}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount" placeholder=""  autocomplete="off"  onchange="CalculateAmount(this);"  required>`;


        var td_OrderRate = `<input type="number"  id="txtOrderRate` + tbItemConsumeRowNo + `"  value="${item.Rate}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderRate" placeholder=""autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_RateUnit = `<input type="text"  id="txtRateUnit` + tbItemConsumeRowNo + `"  value="${item.RateUnit}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtRateUnit" placeholder=""  autocomplete="off"    required>`;

        var td_DiscountType_AfterRate = `<input type="text"  id="txtDiscountType_AfterRate` + tbItemConsumeRowNo + `" value="${item.DiscountType_AfterRate}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType_AfterRate" placeholder="" list="listDiscountType" autocomplete="off" onclick="$(this).val(\'\')"  onchange="CalculateAmount(this);" required>`;
        var td_Discount_AfterRate = `<input type="number"  id="txtDiscount_AfterRate` + tbItemConsumeRowNo + `" value="${item.Discount_AfterRate}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount_AfterRate" placeholder=""  autocomplete="off"  onchange="CalculateAmount(this);"  required>`;

        var td_Amount = `<input type="number"  id="txtAmount` + tbItemConsumeRowNo + `"  value="${item.Amount}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" disabled name="txtAmount" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_DeliveryDate = `<input type="date"  id="txtDeliveryDate` + tbItemConsumeRowNo + `"  value="${formattedDate}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryDate" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_ZonePriceListCode = `<input type="text"  id="ZonePriceListCode` + tbItemConsumeRowNo + `" value="${item.ZoneName}" onkeypress = "BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name = "ZonePriceListCode" placeholder = "" list = "listZone" autocomplete = "off" onclick = "$(this).val(\'\')"  onchange = "" required >`;
        var td_Remarks = `<input type="text"  id="txtRemarks` + tbItemConsumeRowNo + `"  value="${item.Remarks}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtRemarks" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required  maxlength="200">`;
        var td_Delete = `<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light disabled" title="Delete" onclick="DeleteOrderItem(this);"><i class="fa fa-times" aria-hidden="true"></i></a>`;
        var td_DealerName = `<input type="hidden" id="hdnDistributorDealerCode` + tbItemConsumeRowNo + `" name="hdnDistributorDealerCode" value="${item.DealerMaster_Code}"><input type="text"  id="txtDealerNameList` + tbItemConsumeRowNo + `" value="${item.DealerName}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDealerNameList" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" disabled  required>`;

        var td_VisitDetailsCode = `<input type="text"  id="txtVisitDetailsCode` + tbItemConsumeRowNo + `"  value="${item.Code}"   name="txtVisitDetailsCode" placeholder="" value=0  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_IsNewRow = `<input type="text"  id="txtIsNewRow` + tbItemConsumeRowNo + `"  value="${item.IsNewRow}"   name="txtIsNewRow" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_SizeApplicable = `<input type="text"  id="txtSizeApplicable` + tbItemConsumeRowNo + `"  value="N"   name="txtSizeApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_ThkApplicable = `<input type="text" id="txtThkApplicable` + tbItemConsumeRowNo + `"  value="N" name="txtThkApplicable" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" onchange="" required>`;
        var td_LenApplicable = `<input type="text" id="txtLenApplicable` + tbItemConsumeRowNo + `"  value="N"  name="txtLenApplicable" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" onchange="" required>`;
        var td_ItemMasterCode = `<input type="text" id="txtItemMasterCode` + tbItemConsumeRowNo + `"  value="${item.ItemMaster_code}"  name="txtItemMasterCode" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" onchange="" required>`;
        var td_UOMDecimalUnit = `<input type="text" id="txtUOMDecimalUnit` + tbItemConsumeRowNo + `" name="UOMDecimalUnit" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" onchange="" required>`;


        var row = `
      <tr>
        <td  style="display:none">${td_Consignee}   </td>
        <td  style="display:none">${td_DeliveryAddress}   </td>
        <td>${td_ItemName}</td>
        <td  style="display:none">${td_Size}   </td>
        <td  style="display:none">${td_Thickness}   </td>
        <td  style="display:none">${td_SizeDesp}   </td>
        <td  style="display:none">${td_UOM}   </td>
        <td  style="display:none">${td_Stock}   </td>
        <td  style="display:none">${td_OrderQtyPC}   </td>
        <td>${td_OrderQtyMT}</td>
        <td  style="display:none">${td_OrderQtyMTR}   </td>
        <td  style="display:none">${td_OrderUOM}   </td>
        <td  style="display:none">${td_OrderQTY}   </td>
        <td>${td_Tolerance}   </td>
        <td>${td_BasicRate}   </td>
        <td  style="display:none">${td_ExtraCharges}   </td>
        <td>${td_DiscountType}   </td>
        <td>${td_Discount}   </td>
        <td  style="display:none">${td_OrderRate}   </td>
        <td>${td_RateUnit}   </td>
         <td>${td_DiscountType_AfterRate}   </td>
        <td>${td_Discount_AfterRate}   </td>
        <td>${td_Amount}   </td>
        <td>${td_DeliveryDate}   </td>
        <td>${td_ZonePriceListCode}   </td>
        <td>${td_DealerName}   </td>
        <td>${td_Remarks}   </td>
        <td>${td_Delete}   </td>
        
        <td  style="display:none">${td_VisitDetailsCode}   </td>
        <td  style="display:none">${td_IsNewRow}   </td>
        <td  style="display:none">${td_SizeApplicable}   </td>
        <td  style="display:none">${td_ThkApplicable}   </td>
        <td  style="display:none">${td_LenApplicable}   </td>
        <td  style="display:none"> ${td_ItemMasterCode}   </td>
       
      </tr>
    `;
        tbody.append(row);
        OtherCharges = item.OtherCharges;
    });


    if (OtherCharges != 0) {
        $("#txtAmt").val(OtherCharges);

        if (OtherCharges < 0) {
            $('#selectSign').val("-");
        } else {
            $('#selectSign').val("+");
        }
        //calFinalAmt();
    }
    if (ShowToggleSize == true) {
        $('#toggleSwitch').prop('checked', true);
    }
    ShowFooterTotal();
    SetOrderBookingTableHeaderAsPerConfig();
    if (param_VisitMode == 'View' && param_VisitMaster_Code > 0) {
        $('#tblorderbooking input').prop('disabled', true)
    }
}

function SetFieldsAsPerConfig() {
   // var CRM_Config = JSON.parse(sessionStorage.getItem('CRMConfig'));
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMTR;
    var QtyMTHeader_MT = Qty_Config.QtyMT;

    var DistributorDealerApplicableInOrder = CRM_Config.ShowDealerColumn;
    var ShowCreditDays = CRM_Config.ShowCreditDays;
    var AskDiscountOnOrder = CRM_Config.AskDiscountOnOrder;
    var AskDiscountItemWise = CRM_Config.AskDiscountItemWise;
    var ShowBuyerPoNo = CRM_Config.ShowBuyerPoNo
    


    var ShowSizeThicknessColumns = CRM_Config.ShowSizeThicknessColumns;
  

    $('#divShowFreight').prop('hidden', true);

    if (ShowCreditDays == 'Y') {
        $('#divCreditDays').prop('hidden', false);
    } else {
        $('#divCreditDays').prop('hidden', true);
    }
    //if (ShowMRateUnit == 'Y') {
    //    $('#divRateUnit').prop('hidden', false);
    //} else {
    //    $('#divRateUnit').prop('hidden', true);
    //}
    //if (AskDiscountOnOrder == 'Y') {
    //    $('#divBasicRate').prop('hidden', false);
    //    $('#divselectSign').prop('hidden', false);
    //    $('#divAmt').prop('hidden', false);
    //    $('#divFinalRate').prop('hidden', false);
    //} else {
    //    $('#divBasicRate').prop('hidden', true);
    //    $('#divselectSign').prop('hidden', true);
    //    $('#divAmt').prop('hidden', true);
    //    $('#divFinalRate').prop('hidden', true);
    //}

    $('#divBasicRate').prop('hidden', true);
    $('#divselectSign').prop('hidden', true);
    $('#divAmt').prop('hidden', true);
    $('#divFinalRate').prop('hidden', true);

    if (ShowSizeThicknessColumns == 'Y') {
        $('#divShowSizeButton').prop('hidden', false);
        var objToggle = $('#toggleSwitch');
        ShowSizeDespButton(objToggle[0]);
    } else {
        $('#divShowSizeButton').prop('hidden', true);
    }
    if (ShowBuyerPoNo == "Y") {

        $('#divBuyerPONo').prop('hidden', false);
    } else {
        $('#divBuyerPONo').prop('hidden', true);
    }

   

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
function ShowDeliveryAddressModal(RowNo) {
    $('#hdnRowNo').val(RowNo);
    var Code = $('#hdnAddressCode' + RowNo).val();
    $('#hdnSelectedCode').val(Code);
    //
    $('#DeliveryAddressModal').modal('show');
    //$('input[name="record"][value="' + Code + '"]').prop('checked', true);
    $(".modal-backdrop").remove();
}
function CloseDeliveryAddressModal() {
    var selectedRecord = $('input[name="record"]:checked');
    var RowNo = $('#hdnRowNo').val();
    // Check if a record is selected
    if (selectedRecord.length > 0) {
        var recordID = selectedRecord.val();  // Get the value of the selected radio button
        var recordRow = selectedRecord.closest('tr');  // Get the closest row for the selected radio button
        var name = recordRow.find('td:nth-child(2)').text(); // Get the name from the 3rd column
        $('#txtDeliveryAddress' + RowNo).val(name);
        $('#hdnAddressCode' + RowNo).val(recordID);
       }
    $('#DeliveryAddressModal').modal('hide');
}
function ShowImageModal(strSrc) {

    $('#ImgModal').attr("src", strSrc);
    $('#ImageModal').modal('show');

    $(".modal-backdrop").remove();
}
function CheckOutVisit() {
    var visitMasterData = [];
    var visitMasterRow = {};

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    visitMasterRow["code"] = param_VisitMaster_Code;
    visitMasterRow["date"] = new Date().toISOString().split("T")[0];
    visitMasterRow["visitType"] = 0;
    visitMasterRow["accountDesp"] = $("#txtDealer").val() !== null ? $("#txtDealer").val() : '';
    visitMasterRow["photo"] = $("#hfFileInput")[0].value !== null ? $("#hfFileInput")[0].value : '';
    visitMasterRow["location"] = $("#hflatlong").val() !== null ? $("#hflatlong").val() : '';
    visitMasterRow["checkIn"] = $("#txtCheckInTime").val() !== null ? $("#txtCheckInTime").val() : '';
    visitMasterRow["checkOut"] = formattedTime;
    visitMasterRow["remarks"] = $("#txtRemarks").val() !== null ? $("#txtRemarks").val() : '';
    visitMasterRow["routePlanMaster_code"] = param_RoutePlanCode;
    visitMasterRow["nextVisitDate"] = addDays(new Date(), 2).toISOString().split("T")[0];
    visitMasterRow["verified"] = 'N';
    visitMasterRow["paymentTermsMasterCode"] = 0;
    visitMasterRow["deliveryDays"] = $("#txtDeliveryDays").val() !== null ? $("#txtDeliveryDays").val() : 0;
    visitMasterRow["freightCondition"] = $("#txtFreightType").val() !== null ? $("#txtFreightType").val() : '';
    visitMasterRow["orderDealerName"] = $("#txtDealer").val() !== null ? $("#txtDealer").val() : '';
    visitMasterRow["userMasterCode"] = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
    visitMasterRow["checkInLocation"] = $("#txtCurrentLocation").val() !== null ? $("#txtCurrentLocation").val() : '';
    visitMasterRow["checkOutLocation"] = $("#txtCheckOutLocation").val() !== null ? $("#txtCheckOutLocation").val() : '';
    visitMasterRow["mRateUnit"] = '';
    visitMasterRow["creditDays"] = 0;
    visitMasterRow["freight"] = $("#txtlistFreight").val() !== null ? $("#txtlistFreight").val() : '';
    visitMasterRow["dispatchFrom"] = '';
    visitMasterRow["buyerPONo"] = 0;
    visitMasterRow["buyerPODate"] = new Date().toISOString().split("T")[0];
    visitMasterRow["zoneName"] = '';//$("#txtZone").val() !== null ? $("#txtZone").val() : '';

    visitMasterData.push(visitMasterRow);

    VisitOrderEntryService.CheckOut(visitMasterData).then(function (response) {

        if (response != '') {
            if (response.Status == 'N') {
                toastr.error(response.Msg);
            } else {
                toastr.success(response.Msg);
                window.location = baseUrl + "/CRMTransactions/Visit/Visit";

            }
        }

    });
}



function GetActualLocation() {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showLocation, error, options);
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}
function error(err) {
    //if ('N' == 'Y') {
    //    toastr.error('Please on your location');
    //    window.location = baseUrl + "/Home/Home";
    //}
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

            if (param_RoutePlanCode > 0) {
                document.getElementById("txtCheckOutLocation").value = Address;
            }
        },
        error: function (xhr) {
            Address = '';
            //document.getElementById("txtCurrentLocation").value = Address;

        }
    });
};
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
function GetLatestPriceListByItemName(x, RowNo) {
    var ObjCurrRow = $(x).closest('tr');
    var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
    VisitOrderEntryService.GetLatestPriceListByItemName(ItemName).then(function (response) {
        var defaultValue = '';
        if (response.length > 0) {
            $('#ZonePriceListCode' + RowNo + ' option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                if (i == 0) {
                    defaultValue = response[0].ZoneName;
                }
                option += '<option text="' + response[i].ZoneMaster_Code + '">' + response[i].ZoneName + '</option>'
            }
            $('#ZonePriceListCode' + RowNo)[0].innerHTML = option;

        }
        //if (param_VisitMode == 'New') {
        $('#txtZonePriceListCode' + RowNo).val(defaultValue);
        //}
    });


}
function GetBasicRateFromPriceList(x, RowNo) {
    var ObjCurrRow = $(x).closest('tr');
    var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
    var AccountDesp = $("#txtDealer").val();
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');


    const formattedDate = ('0' + now.getDate()).slice(-2) + '/' +
        ('0' + (now.getMonth() + 1)).slice(-2) + '/' +
        now.getFullYear();

    VisitOrderEntryService.GetBasicRateFromPriceList(convertDateFormat(formattedDate), ItemName, AccountDesp).then(function (response) {

        if (response.length > 0) {

            $('#txtBasicRate' + RowNo).val(response[0].BasicRateFromPriceList);

        }

    });


}
function GetDistributorDealerList() {
    var AccountDesp = $('#txtDealer').val();
    AccountDesp = normalizeText(AccountDesp);
    VisitOrderEntryService.GetDistributorDealerList(AccountDesp).then(function (response) {
        var defaultValue = '';
        if (response.length > 0) {
            $('#listDistributorDealer option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                //if (i == 0) {
                //    defaultValue = response[0].ZoneName;
                //}
                option += '<option data-code="' + response[i].Code + '">' + response[i].DealerName + '</option>'
            }
            $('#listDistributorDealer')[0].innerHTML = option;

        }
        ////if (param_VisitMode == 'New') {
        //$('#txtZonePriceListCode' + RowNo).val(defaultValue);
        ////}
    });


}

function GetDistributorDealerCode(x, RowNo) {
    var selectedValue = $(x).val();  // Get the selected value from the input

    // Loop through the options in the datalist
    $('#listDistributorDealer option').each(function () {
        if ($(this).val() === selectedValue) {
            // Get the code (data-code attribute)
            var selectedCode = $(this).data('code');

            // Set the code in the hidden textbox
            $('#hdnDistributorDealerCode' + RowNo).val(selectedCode);
        }
    });
}

function SelectAddress() {
    var selectedRecord = $('input[name="record"]:checked');
    var RowNo = $('#hdnRowNo').val();
    // Check if a record is selected
    if (selectedRecord.length > 0) {
        var recordID = selectedRecord.val();  // Get the value of the selected radio button
        var recordRow = selectedRecord.closest('tr');  // Get the closest row for the selected radio button
        var name = recordRow.find('td:nth-child(2)').text(); // Get the name from the 3rd column
        $('#txtDeliveryAddress' + RowNo).val(name);
        $('#hdnAddressCode' + RowNo).val(recordID);
        CloseDeliveryAddressModal();
    } else {
        alert('No record selected!');
    }
}

function GetUOMMasterList() {
    VisitOrderEntryService.GetUOMMasterList().then(function (response) {
        var defaultValue = '';
        if (response.length > 0) {
            $('#listOrderUOM option').empty();
            $('#listOrderUOMDecimalDigits option').empty();
            var option = '';
            var option1 = '';
            for (var i = 0; i < response.length; i++) {
                //if (i == 0) {
                //    defaultValue = response[0].ZoneName;
                //}
                option += '<option data-code="' + response[i].Code + '">' + response[i].UOM + '</option>'
                option1 += '<option data-code="' + response[i].DecimalPoints + '">' + response[i].UOM + '</option>'
            }
            $('#listOrderUOM')[0].innerHTML = option;
            $('#listOrderUOMDecimalDigits')[0].innerHTML = option1;
        }

    });
}
function GetDeliveryAddressCode(x, RowNo) {
    var selectedValue = $(x).val();  // Get the selected value from the input

    // Loop through the options in the datalist
    $('#listDeliveryLocation'+RowNo+' option').each(function () {
        if ($(this).val() === selectedValue) {
            // Get the code (data-code attribute)
            var selectedCode = $(this).data('code');

            // Set the code in the hidden textbox
            $('#hdnAddressCode' + RowNo).val(selectedCode);
        }
    });
}
function GetFixedParameter() {
    VisitOrderEntryService.GetFixedParameterDetails().then(function (response) {

        if (response.length > 0) {

            sessionStorage.setItem('FixedParameter', JSON.stringify(response[0]));
           
        }
    });
}
function GetFixedParameterMarketing() {
    VisitOrderEntryService.GetFixedparameterMarketing().then(function (response) {

        if (response.length > 0) {

            sessionStorage.setItem('FixedParameterMarketing', JSON.stringify(response[0]));

        }
    });
}
function GetConsigneeCode(x, RowNo) {
    var selectedValue = $(x).val();  // Get the selected value from the input

    // Loop through the options in the datalist
    $('#listConsignee option').each(function () {
        if ($(this).val() === selectedValue) {
            // Get the code (data-code attribute)
            var selectedCode = $(this).data('code');

            // Set the code in the hidden textbox
            $('#hdnConsigneeCode' + RowNo).val(selectedCode);
        }
    });
}
function ShowSizeControl(x, RowNo) {
    var ObjCurrRow = $(x).closest('tr');
    var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
    var ItemSizeMaster_Code = $('#hdnItemSizeMasterCode' + RowNo).val();
    if (ItemSizeMaster_Code == undefined || ItemSizeMaster_Code == null || ItemSizeMaster_Code == "") {
        ItemSizeMaster_Code = 0;
    }
    var selectedCode = 0;
    $('#listItem option').each(function () {
        if ($(this).val() === ItemName) {
            // Get the code (data-code attribute)
            selectedCode = $(this).data('code');
        }
    });
    InitSizeControl(selectedCode, ItemSizeMaster_Code, "SizeCallBack", RowNo);

}
function SizeCallBack() {
    //alert(SizeControl_NewSizeMaster_Code + 'SizeDesp:' + SizeControl_NewSizeDesp);

    var RowNo = $('#hfRow_Id').val();

    $('#hdnItemSizeMasterCode' + RowNo).val(SizeControl_NewSizeMaster_Code); 
    $('#txtSizeDesp' + RowNo).val(SizeControl_NewSizeDesp);
    $('#txtSizeDesp').attr('title', SizeControl_NewSizeDesp);

    var ItemName = $('#txtItemName' + RowNo).val();
    var CustomerName = $('#txtDealer').val();
    VisitOrderEntryService.GetBasicRateExtraCharges(ItemName, "", "", CustomerName,SizeControl_NewSizeMaster_Code).then(function (response) {

        if (response.length > 0) {

            $('#txtBasicRate' + RowNo).val(response[0].BasicRate);
            $('#txtExtraCharges' + RowNo).val(response[0].ExtraCharges);

        }
    });

}

function GetBasicRateExtraCharges(RowNo) {

  
    var ItemName = $('#txtItemName' + RowNo).val();
    var CustomerName = $('#txtDealer').val();
    var Size = $('#txtSize' + RowNo).val();
    var Thk = $('#txtThickness' + RowNo).val();
    VisitOrderEntryService.GetBasicRateExtraCharges(ItemName, Size, Thk, CustomerName, 0).then(function (response) {

        if (response.length > 0) {

            $('#txtBasicRate' + RowNo).val(response[0].BasicRate);
            $('#txtExtraCharges' + RowNo).val(response[0].ExtraCharges);

        }
    });
}

function InitSizeControl(itemMaster_Code, itemSizeMaster_Code, callBackFunctionName_btnDone, rowNo) {

    console.log("ItemMaster_Code:" + itemMaster_Code);

    console.log("ItemSizeMaster_Code:" + itemSizeMaster_Code);

    // var url = '@Url.Action("SizeControl", "CustomControl")';
    var url = baseUrl+'/CustomControl/SizeControl';

    $('#DivSizeControlmodal').load(url, { ItemMaster_Code: itemMaster_Code, ItemSizeMaster_Code: itemSizeMaster_Code, CallBackFunctionName_btnDone: callBackFunctionName_btnDone, RowNo: rowNo });

}

//function GetItemParameterMasterList(ItemMaster_Code) {
//    VisitOrderEntryService.GetItemParameterMasterList(ItemMaster_Code).then(function (response) {

//        if (response.length > 0) {
//            $('#ItemParameterMasterList option').empty();

//            var option = '';

//            for (var i = 0; i < response.length; i++) {
//                option += '<option data-code="' + response[i].ParameterCode + '">' + response[i].ParameterName + '</option>'
//            }
//            $('#ItemParameterMasterList')[0].innerHTML = option;

//        }

//    });
//}

//function GetItemSizeDropdownList(x, RowNo) {

//    var ItemParameterMaster_Code = GetItemParameterCode('SIZE');
//    var ItemMaster_Code = $(x).val();
//    VisitOrderEntryService.GetItemSizeDropdownList(ItemParameterMaster_Code,ItemMaster_Code).then(function (response) {

//        if (response.length > 0) {
//            $('#listItemSize_' + RowNo +' option').empty();

//            var option = '';

//            for (var i = 0; i < response.length; i++) {
//                option += '<option data-code="' + response[i].ParameterCode + '">' + response[i].ParameterName + '</option>'
//            }
//            $('#listItemSize_'+RowNo)[0].innerHTML = option;

//        }

//    });
//}
//function GetItemThkDropdownList(x, RowNo) {

//    var ItemParameterMaster_Code = GetItemParameterCode('THICKNESS');
//    var ItemMaster_Code = $(x).val();
//    VisitOrderEntryService.GetItemSizeDropdownList(ItemParameterMaster_Code, ItemMaster_Code).then(function (response) {

//        if (response.length > 0) {
//            $('#ThkMasterList' + RowNo + ' option').empty();

//            var option = '';

//            for (var i = 0; i < response.length; i++) {
//                option += '<option data-code="' + response[i].ParameterCode + '">' + response[i].ParameterName + '</option>'
//            }
//            $('#ThkMasterList' + RowNo)[0].innerHTML = option;

//        }

//    });
//}
//function GetItemParameterCode(ParameterName) {
//    var ParameterCode = 0;
//    $('#ItemParameterMasterList option').each(function () {
//        if ($(this).val() === ParameterName) {
//            // Get the code (data-code attribute)
//            var selectedCode = $(this).data('code');

//            ParameterCode=selectedCode;
//        }
//    });
//    return ParameterCode;
//}

function GetSelectedSizeCode(RowNo) {
    var Size = $('#txtSize' + RowNo).val();
    var ParameterCode = 0;
    $('#listItemSize_' + RowNo+' option').each(function () {
        if ($(this).val() === Size) {
            // Get the code (data-code attribute)
            var selectedCode = $(this).data('code');

            ParameterCode=selectedCode;
        }
    });
    $('#hdnSizeMasterCode' + RowNo).val(ParameterCode);
}


function GetSelectedThkCode(RowNo) {
   
    var ParameterCode = 0;
    
    var Thk = $('#txtThickness' + RowNo).val();
    $('#listItemThickness_' + RowNo +' option').each(function () {
        if ($(this).val() === Thk) {
            // Get the code (data-code attribute)
            var selectedCode = $(this).data('code');

            ParameterCode=selectedCode;
        }
    });
    $('#hdnThkMasterCode' + RowNo).val(ParameterCode);
}
function GetItemSizeMasterList(x, RowNo) {
    var ObjCurrRow = $(x).closest('tr');
    var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
    VisitOrderEntryService.GetItemSizeMasterList(ItemName).then(function (response) {
        var defaultValue = '';
        var defaultCode = 0;
        if (response.length > 0) {
            $('#listItemSizeMaster_' + RowNo + ' option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                if (i == 0) {
                    defaultValue = response[0].SizeDesp;
                    defaultCode = response[0].Code;
                }
                option += '<option data-code="' + response[i].Code + '">' + response[i].SizeDesp + '</option>'
            }
            $('#listItemSizeMaster_' + RowNo)[0].innerHTML = option;

        }
        //if (param_VisitMode == 'New') {
        $('#txtSizeDesp' + RowNo).val(defaultValue);
        $('#hdnItemSizeMasterCode' + RowNo).val(defaultCode);
        //}
    });


}

function GetSelectedItemSizeMasterCode(RowNo) {

    var ParameterCode = 0;

    var ItemSize = $('#txtSizeDesp' + RowNo).val();
    $('#listItemSizeMaster_' + RowNo + ' option').each(function () {
        if ($(this).val() === ItemSize) {
            // Get the code (data-code attribute)
            var selectedCode = $(this).data('code');

            ParameterCode = selectedCode;
        }
    });
    $('#hdnItemSizeMasterCode' + RowNo).val(ParameterCode);
    var ItemName = $('#txtItemName' + RowNo).val();
    var CustomerName = $('#txtDealer').val();
    VisitOrderEntryService.GetBasicRateExtraCharges(ItemName, '', '', CustomerName, ParameterCode).then(function (response) {

        if (response.length > 0) {

            $('#txtBasicRate' + RowNo).val(response[0].BasicRate);
            $('#txtExtraCharges' + RowNo).val(response[0].ExtraCharges);

        }
    });
}

window.GetAccountMasterDetails = GetAccountMasterDetails;
window.BizSolhandleEnterKey = BizSolhandleEnterKey;
window.AddNewRow = AddNewRow;
window.GetItemSizeList = GetItemSizeList;
window.GetItemThicknessList = GetItemThicknessList;
window.GetUOM = GetUOM;
window.SaveData = SaveData;
window.CalculateAmount = CalculateAmount;
window.GetZoneMasterList = GetZoneMasterList;
window.GetMaxBasicRate = GetMaxBasicRate;
window.calFinalAmt = calFinalAmt;
window.ValidateDiscountLimit = ValidateDiscountLimit;
window.CloseModal = CloseModal;
window.ShowFooterTotal = ShowFooterTotal;
window.GetLatestPriceListByItemName = GetLatestPriceListByItemName;
window.GetPaymentTerms = GetPaymentTerms;
window.GetBasicRateFromPriceList = GetBasicRateFromPriceList;
window.GetDistributorDealerList = GetDistributorDealerList;
window.GetDistributorDealerCode = GetDistributorDealerCode;
window.GetDealerFromPreRow = GetDealerFromPreRow;
window.ShowDeliveryAddressModal = ShowDeliveryAddressModal;
window.CloseDeliveryAddressModal = CloseDeliveryAddressModal;
window.GetAccountDeliveryLocationDetails = GetAccountDeliveryLocationDetails;
window.SelectAddress = SelectAddress;
window.GetUOMMasterList = GetUOMMasterList;
window.GetDeliveryAddressCode = GetDeliveryAddressCode;
window.GetFixedParameter = GetFixedParameter;
window.GetConsigneeCode = GetConsigneeCode;
window.GetFixedParameterMarketing = GetFixedParameterMarketing;
//window.GetItemParameterMasterList = GetItemParameterMasterList;
//window.GetItemSizeDropdownList = GetItemSizeDropdownList;
//window.GetItemParameterCode = GetItemParameterCode;
//window.GetItemThkDropdownList = GetItemThkDropdownList;
window.InitSizeControl = InitSizeControl;
window.ShowSizeControl = ShowSizeControl;
window.SizeCallBack = SizeCallBack;
window.GetBasicRateExtraCharges = GetBasicRateExtraCharges;
window.GetSelectedSizeCode = GetSelectedSizeCode;
window.GetSelectedThkCode = GetSelectedThkCode;
window.GetItemSizeMasterList = GetItemSizeMasterList;
window.GetSelectedItemSizeMasterCode = GetSelectedItemSizeMasterCode;