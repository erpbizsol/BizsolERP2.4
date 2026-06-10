import { VisitOrderEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VisitOrderEntryService.js';
import { BizSolGeoLocation } from '../../Bizsol.WebERP.UI.Shared/js/BizSolGeoLocation.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

//var baseUrl = `${window.location.protocol}//${window.location.host}`;
var baseUrl = sessionStorage.getItem('AppBaseURL');

var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};



// Define columns in order - indices are auto-generated
const TblOrderColumns = [
    'Consignee',
    'DeliveryAddress',
    'DealerName',
    'ItemName',
    'Size',
    'Thickness',
    'SizeDesp',
    'UOM',
    'Stock',
    'OrderQtyBags',
    'OrderQtyPC',
    'OrderQtyMT',
    'OrderQtyMTR',
    'RateUnit',
    'OrderUOM',
    'OrderQTY',
    'Tolerance',
    'BasicRate',
    'ExtraCharges',
    'DiscountType',
    'Discount',
    'OrderRate',
    'DiscountType_AfterRate',
    'Discount_AfterRate',
    'Amount',
    'DeliveryDate',
    'ZonePriceListCode',
    //'DealerName',
    'Remarks',
    'Delete',
    'VisitDetailsCode',
    'IsNewRow',
    'SizeApplicable',
    'ThkApplicable',
    'LenApplicable',
    'ItemMasterCode',
    'UOMDecimalUnit'
];

// Auto-generate the index object
const Indx_TblOrder = TblOrderColumns.reduce((acc, col, index) => {
    acc[col] = index;
    return acc;
}, {});

// Validation helper function to check for duplicate indices (optional, for debugging)
function validateIndices(indexObj) {
    const values = Object.values(indexObj);
    const uniqueValues = new Set(values);
    if (values.length !== uniqueValues.size) {
        console.error('Duplicate indices found in Indx_TblOrder!');
    }
    console.log('Total columns:', values.length);
}

// Validate indices on load (optional)
validateIndices(Indx_TblOrder);

// Define Stock columns in order - indices are auto-generated
const StockColumns = [
    'Code',
    'ItemMaster_Code',
    'ItemName',
    'Size',
    'Thickness',
    'PhysicalStock',
    'SaleOrderQty',
    'PendingCRMOrder',
    'RollingForcast',
    'MinimumQty',
    'BalQty',
    'Qty'
];

// Auto-generate the stock index object
const Indx_Stock = StockColumns.reduce((acc, col, index) => {
    acc[col] = index;
    return acc;
}, {});


let arrayList_NestedDealer = [];
let arrayList_NestedDealerFull = [];
let arrayList_ItemMaster = [];
let arrayList_UOMMaster = [];
let arrayList_UOMMasterDecimalPoints = [];
let arrayList_RateUnitFromConfig = [];
let arrayList_Zone = [];
let G_BasicRateUOM = 'MT';
$(document).ready(function () {
    $("#ERPHeading").text("Direct Order Entry");
    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var UserMaster_Code = authKeyData.UserMaster_Code;
    GetCRMFixedParameterConfig();

});

function PageLoad() {

    GetUserDetails();
    GetFreightTypeList();
    GetFreightList();
    GetZoneMasterList();
    GetPaymentTerms();
    GetUOMMasterList();
    GetFixedParameter();
    GetItemMasterDropdown();
    getRateUnitListFromQtyConfig(0);

    if (param_VisitMode == 'View' && param_VisitMaster_Code > 0) {
        PopulateData();
        $('input, textarea,select').prop('disabled', true);
        $("#btnBack").prop("disabled", false);
        $('select').prop('disabled', true);
        //GetEditVisitDetails();
        
    }

    if (param_VisitMode == 'Edit' && param_VisitMaster_Code > 0) {
        //GetEditVisitDetails();

        PopulateData();


        //$('#toggleSwitch').prop("disabled", true);
    }


    if (param_VisitMode == 'New') {
        SetOrderBookingTableHeaderAsPerConfig();
    }
    if (param_RoutePlanCode > 0) {
        $('#txtDealer').prop("disabled", true);
    }

    if (param_VisitMode == 'Edit' && param_RoutePlanCode > 0) {
        $('#btnCheckOut').prop('hidden', false);
        $('#divtxtNextVistDate').prop('hidden', false);
        //$('#toggleSwitch').prop("disabled", false);
        $('#ddlCustomerName').prop('disabled', true);

    } else {
        $('#btnCheckOut').prop('hidden', true);
        $('#divtxtNextVistDate').prop('hidden', true);
    }


    var FixedParaMarketing_Config = JSON.parse(sessionStorage.getItem('FixedParameterMarketing'));
    var BuyerPOOpenMasterApplicable = FixedParaMarketing_Config.BuyerPOOpenMasterApplicable;
    if (BuyerPOOpenMasterApplicable == 'Y') {
        $('#btnShow').hide();/// For Hariom
        $('#divPaymentTerms').hide();
        $('#divFreight').hide();
    } else {

    }
    
    // Show Stock Button Click
    $('#btnShow').click(function () {

        var VisitType = $('#hfVisitType').val();
        
       //var AccountDesp = $("#txtDealer").val();
        var AccountDesp = $('#ddlCustomerName option:selected').text()
        if (AccountDesp == "") {
            toastr.error("Please Select Customer Name!")
            return false;
        }
        if (VisitType == 'New Acquisition') {
            toastr.error("Order cannot be booked for New Acquisition!")
            return false;
        }

        // Change the button text to "Loading..."
        $(this).prop('hidden', true); // Disable the button to prevent multiple clicks
        $('#btnLoading').prop('hidden', false);
        ShowLogicalStockModal();
      
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
    $('#toggleMoreCols').on('change', function () {

        SetLogicalStockTableColumns();

    });
    
    document.addEventListener('DOMContentLoaded', function () {
        var inputs = form.querySelectorAll('input');
        inputs.forEach(function (input) {
            input.setAttribute('autocomplete', 'off');
        });
    });

}

function PopulateData() {
    VisitOrderEntryService.GetFreightTypeList().then(function (response) {
        var defaultValue = '';
        if (response.length > 0) {
            
            var arrayList_FreightType = [];
            response = response.map((item) => ({
                key: item.Code, value: item.Field
            }));
            arrayList_FreightType = response;

            BindSelect2FromDataList($('#ddlFreightType'), arrayList_FreightType, "FirstItemZero", "100%")

            VisitOrderEntryService.GetFreightList().then(function (response) {

                if (response.length > 0) {
                    var arrayList_Freight = [];
                    response = response.map((item) => ({
                        key: item.Code, value: item.Field
                    }));
                    arrayList_Freight = response;

                    BindSelect2FromDataList($('#ddlFreight'), arrayList_Freight, "FirstItemSelected", "100%")

                    if (param_VisitMode == 'New') {
                        BizSolHelperFunction.SelectOptionByText('ddlFreight', "Ex-Works");
                    }

                    VisitOrderEntryService.GetPaymentTermsMasterList().then(function (response) {
                        if (response.length > 0) {
                             var arrayList_PaymentTerms = [];
                            response = response.map((item) => ({
                                key: item.Code, value: item.Desp
                            }));
                            arrayList_PaymentTerms = response;

                            BindSelect2FromDataList($('#ddlPaymentTerms'), arrayList_PaymentTerms, "FirstItemSelected", "100%")

                            VisitOrderEntryService.GetUOMMasterList().then(function (response) {
                                var defaultValue = '';
                                if (response.length > 0) {
                                    
                                     arrayList_UOMMaster = [];
                                    var response1 = response.map((item) => ({
                                        key: item.Code, value: item.UOM
                                    }));
                                    arrayList_UOMMaster = response1;

                                    arrayList_UOMMasterDecimalPoints = [];
                                    var response2 = response.map((item) => ({
                                        key: item.Code, value: item.DecimalPoints
                                    }));
                                    arrayList_UOMMasterDecimalPoints = response2;


                                    VisitOrderEntryService.GetItemMasterDropdown().then(function (response) {

                                        sessionStorage.setItem('ItemMasterTable', JSON.stringify(response));

                                        if (response.length > 0) {
                                           
                                            arrayList_ItemMaster = [];
                                            response = response.map((item) => ({
                                                key: item.Code, value: item.ItemName
                                            }));
                                            arrayList_ItemMaster = response;
                                        }

                                        // Rate Unit from Qty Config
                                        var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
                                        var defaultValue = '';
                                        var inputString = Qty_Config.RateUnit;

                                        // Split the string by "/" and store it in an array
                                        var response = inputString.split('/');

                                        if (response.length > 0) {
                                           
                                            arrayList_RateUnitFromConfig = [];
                                            response = response.map((item) => ({
                                                key: item.value, value: item.value
                                            }));
                                            arrayList_RateUnitFromConfig = response;

                                            GetEditVisitDetails();
                                        }

                                    });
                                }

                            });
                        }
                       
                    });

                }

              

            });
        }


    });

}


function GetEditVisitDetails() {

    SetOrderBookingTableHeaderAsPerConfig();
    VisitOrderEntryService.GetEditVisitDetails(param_RoutePlanCode, param_VisitMaster_Code).then(function (response) {

        if (response.VisitORroutePlanMaster.length > 0) {


            $('#txtUserName').val(response.VisitORroutePlanMaster[0].PlanUserName);
            $('#txtdate').val(response.VisitORroutePlanMaster[0].Date);
            if (response.VisitORroutePlanMaster[0].OrderEntryType == 'V') {
                // $('#txtDealer').val(response.VisitORroutePlanMaster[0].OrderDealerName);
                BizSolHelperFunction.SelectOptionByText('ddlCustomerName', response.VisitORroutePlanMaster[0].OrderDealerName);
            } else {
                //$('#ddlCustomerName option').filter(function () {
                //    return $(this).text() === response.VisitORroutePlanMaster[0].OrderDealerName;
                //}).prop('selected', true);
                //$('#ddlCustomerName').trigger('change');
                BizSolHelperFunction.SelectOptionByText('ddlCustomerName', response.VisitORroutePlanMaster[0].OrderDealerName);
            }

            $('#txtCheckInTime').val(response.VisitORroutePlanMaster[0].CheckIn);
            $('#txtRemarks').val(response.VisitORroutePlanMaster[0].Remarks);
            $('#txtAddLocation').val(response.VisitORroutePlanMaster[0].Location);
            $('#txtNextVistDate').val(response.VisitORroutePlanMaster[0].NextVisitDate);
            /*$('#txtFreightType').val(response.VisitORroutePlanMaster[0].FreightType);*/
            BizSolHelperFunction.SelectOptionByText('ddlFreightType', response.VisitORroutePlanMaster[0].FreightType);
            $('#txtCurrentLocation').val(response.VisitORroutePlanMaster[0].CheckInLocation);
            $('#txtDeliveryDays').val(response.VisitORroutePlanMaster[0].DeliveryDaysForOrder);
            $('#hfFileInput').val(response.VisitORroutePlanMaster[0].PanelOneAttachment);
            $('#txtCreditDaysForDC').val(response.VisitORroutePlanMaster[0].CreditDays);
            //$('#txtlistFreight').val(response.VisitORroutePlanMaster[0].Freight);

            BizSolHelperFunction.SelectOptionByText('ddlFreight', response.VisitORroutePlanMaster[0].Freight);
            //$('#txtZone').val(response.VisitORroutePlanMaster[0].ZoneName);
            $('#hfVisitType').val(response.VisitORroutePlanMaster[0].VisitType);
            //$('#txtPaymentTerms').val(response.VisitORroutePlanMaster[0].PaymentTerm);
            BizSolHelperFunction.SelectOptionByText('ddlPaymentTerms', response.VisitORroutePlanMaster[0].PaymentTerm);

            //$('#hiddentxtPaymentTerm').val(response.VisitORroutePlanMaster[0].PaymentTermsMaster_Code);
            $('#txtBuyerPONo').val(response.VisitORroutePlanMaster[0].BuyerPONo);

            if (response.VisitORroutePlanMaster[0].TotalOrderQty != null && response.VisitORroutePlanMaster[0].TotalOrderQty !== undefined) {
                $('#txtTotalOrderQty').val(parseFloat(response.VisitORroutePlanMaster[0].TotalOrderQty) || '');
            }


        }
        if (response.VisitOrderDetails.length > 0) {
            PopulateOrderBookingTable(response.VisitOrderDetails);
            $('#toggleSwitch').prop("disabled", true);
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

function BindSelect2FromDataList(element, arrayList, FirstItem,ddlwidth) {
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

        if (response != null && param_VisitMode == 'New') {
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
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var DiscountLimit = CRM_Config.LimitForVerifyDiscount;
    var ShowExtraColumnOrderQtyAndUnit = CRM_Config.ShowExtraColumnOrderQtyAndUnit;
    var DiscountValToCompare = 0;
    var TotalQty = 0;
    $('#tblorderbooking tbody tr').each(function () {
       
        var DiscountType = $(this).find('td').eq(Indx_TblOrder.DiscountType)[0].getElementsByTagName('select')[0].value; 
        var BasicRate = parseFloat($(this).find('td').eq(Indx_TblOrder.BasicRate)[0].getElementsByTagName('input')[0].value); 
        var Discount = parseFloat($(this).find('td').eq(Indx_TblOrder.Discount)[0].getElementsByTagName('input')[0].value);
        var RateUnit = $(this).find('td').eq(Indx_TblOrder.RateUnit)[0].getElementsByTagName('input')[0].value;
        var QtyPC = parseFloat($(this).find('td').eq(Indx_TblOrder.OrderQtyPC)[0].getElementsByTagName('input')[0].value);
        var QtyMT = parseFloat($(this).find('td').eq(Indx_TblOrder.OrderQtyMT)[0].getElementsByTagName('input')[0].value);
        var QtyMR = parseFloat($(this).find('td').eq(Indx_TblOrder.OrderQtyMTR)[0].getElementsByTagName('input')[0].value);
        var OrderQty = parseFloat($(this).find('td').eq(Indx_TblOrder.OrderQTY)[0].getElementsByTagName('input')[0].value);

        var Dis = 0;
        var qty = 0;

        QtyPC = QtyPC == NaN || QtyPC==undefined || QtyPC==''?0:QtyPC;
        QtyMT = QtyMT == NaN || QtyMT == undefined || QtyMT == '' ? 0 : QtyMT;
        QtyMR = QtyMR == NaN || QtyMR == undefined || QtyMR == '' ? 0 : QtyMR;
        OrderQty = OrderQty == NaN || OrderQty == undefined || OrderQty == '' ? 0 : OrderQty;
        Discount = Discount == NaN || Discount == undefined || Discount == '' ? 0 : Discount;

        if (Discount > 0) {
            if (DiscountType == '%') {
                Dis = BasicRate * (Discount / 100);
            } else {
                Dis = Discount;
            }
            if (ShowExtraColumnOrderQtyAndUnit == "Y") {
                qty = OrderQty;
            } else {
                if (RateUnit == 'PC') {
                    qty = QtyPC;
                } else if (RateUnit == 'MR') {
                    qty = QtyMR;
                } else {
                    qty = QtyMT;
                }
            }

            DiscountValToCompare += (Dis * qty);
            TotalQty += qty;
        }
       
    });


    DiscountValToCompare = DiscountValToCompare / TotalQty;

        if (parseFloat(DiscountLimit) != 0 && parseFloat(DiscountValToCompare) != 0) {
            if (parseFloat(DiscountValToCompare) > parseFloat(DiscountLimit)) {
                toastr.warning("The Discount Limit is : " + DiscountLimit + " Rs. This record has exceeded discount Limit!");

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


            arrayList_NestedDealer = [];
            arrayList_NestedDealerFull = response.slice();
            response = response.map((item) => ({
                key: item.Code, value: item.AccountDesp
            }));
            arrayList_NestedDealer = response;

            BindSelect2FromDataList($('#ddlCustomerName'), arrayList_NestedDealer, "FirstItemZero", "100%");
            PageLoad();
        }

    });
}
function GetSelectedCustomerAccountNature() {
    var selectedCode = parseInt($('#ddlCustomerName option:selected').val());
    var found = arrayList_NestedDealerFull.find(function (item) { return item.Code === selectedCode; });
    return found ? (found.AccountNature || '') : '';
}

function GetSelectedCustomerBillApplicable() {
    var selectedCode = parseInt($('#ddlCustomerName option:selected').val());
    var found = arrayList_NestedDealerFull.find(function (item) { return item.Code === selectedCode; });
    return found ? (found.BillApplicable || 'Y') : 'Y';
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

            arrayList_Zone = [];
            response = response.map((item) => ({
                key: item.Code, value: item.Field
            }));
            arrayList_Zone = response;
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
        
            arrayList_ItemMaster = [];
            response = response.map((item) => ({
                key: item.Code, value: item.ItemName
            }));
            arrayList_ItemMaster = response;
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


    //var AccountDesp = $("#txtDealer").val();
    var AccountDesp = $('#ddlCustomerName option:selected').text()
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
        //for (var i = 0; i < 1; i++) {
            AddNewRow();
        }
    }
    SelectAddressNewRow();
    SetOrderBookingTableHeaderAsPerConfig();
}
function AddNewRow() {
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader_MT = Qty_Config.QtyMT;

    var DistributorDealerApplicableInOrder = CRM_Config.ShowDealerColumn;
    var DefaultDiscountType = CRM_Config.DefaultDiscountType;
    
    
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

    // Create all cells sequentially first
    var cells = [];
    for (let i = 0; i < TblOrderColumns.length; i++) {
        cells.push(row.insertCell(i));
    }

    var Consignee = cells[Indx_TblOrder.Consignee];
    var DeliveryAddress = cells[Indx_TblOrder.DeliveryAddress];
    var ItemName = cells[Indx_TblOrder.ItemName];
    var Size = cells[Indx_TblOrder.Size];
    var Thickness = cells[Indx_TblOrder.Thickness];
    var SizeDesp = cells[Indx_TblOrder.SizeDesp];
    var UOM = cells[Indx_TblOrder.UOM];
    var Stock = cells[Indx_TblOrder.Stock];
    var OrderQtyBags = cells[Indx_TblOrder.OrderQtyBags];
    var OrderQtyPC = cells[Indx_TblOrder.OrderQtyPC];
    var OrderQtyMT = cells[Indx_TblOrder.OrderQtyMT];
    var OrderQtyMTR = cells[Indx_TblOrder.OrderQtyMTR];
    var RateUnit = cells[Indx_TblOrder.RateUnit];
    var OrderUOM = cells[Indx_TblOrder.OrderUOM];
    var OrderQTY = cells[Indx_TblOrder.OrderQTY];
    var Tolerance = cells[Indx_TblOrder.Tolerance];
    var BasicRate = cells[Indx_TblOrder.BasicRate];
    var ExtraCharges = cells[Indx_TblOrder.ExtraCharges];
    var DiscountType = cells[Indx_TblOrder.DiscountType];
    var Discount = cells[Indx_TblOrder.Discount];
    var OrderRate = cells[Indx_TblOrder.OrderRate];
    
    var DiscountType_AfterRate = cells[Indx_TblOrder.DiscountType_AfterRate];
    var Discount_AfterRate = cells[Indx_TblOrder.Discount_AfterRate];
    var Amount = cells[Indx_TblOrder.Amount];
    var DeliveryDate = cells[Indx_TblOrder.DeliveryDate];
    var ZonePriceListCode = cells[Indx_TblOrder.ZonePriceListCode];
    var DealerNameList = cells[Indx_TblOrder.DealerName];
    var Remarks = cells[Indx_TblOrder.Remarks];
    var Delete = cells[Indx_TblOrder.Delete];
    
    var VisitDetailsCode = cells[Indx_TblOrder.VisitDetailsCode];
    var IsNewRow = cells[Indx_TblOrder.IsNewRow];
    var SizeApplicable = cells[Indx_TblOrder.SizeApplicable];
    var ThkApplicable = cells[Indx_TblOrder.ThkApplicable];
    var LenApplicable = cells[Indx_TblOrder.LenApplicable];
    var ItemMasterCode = cells[Indx_TblOrder.ItemMasterCode];
    var UOMDecimalUnit = cells[Indx_TblOrder.UOMDecimalUnit];

    let addDealerMasterBtn = '<div class="d-inline-flex gap-1" style="margin-left: 4px;">';
    addDealerMasterBtn += '<a class="btn btn-success btn-sm" title="Add New Dealer" onclick="AddNewDealer(this);"><i class="fa fa-plus"></i></a>';
    addDealerMasterBtn += '<a class="btn btn-primary btn-sm" title="Refresh Dealer List" onclick="RefreshDealerList(this);"><i class="fa fa-refresh"></i></a>';
    addDealerMasterBtn += '</div>';

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

    Consignee.innerHTML = '<input type="text" id="txtConsignee' + tbItemConsumeRowNo + '" list="listConsignee" class="BizSolFormControl box_border form-control form-control-sm" name="txtConsignee" placeholder="" onclick="$(this).val(\'\')" autocomplete="off" onchange="GetConsigneeCode(this,' + tbItemConsumeRowNo + ');GetAccountDeliveryLocationDetails(this,' + tbItemConsumeRowNo + ');"  required><input type="hidden" id="hdnConsigneeCode' + tbItemConsumeRowNo + '" name="hdnConsigneeCode">';
    DeliveryAddress.innerHTML = '<div class="row"><div class="col-md-7"><datalist id="listDeliveryLocation' + tbItemConsumeRowNo + '"></datalist><input type="text" id="txtDeliveryAddress' + tbItemConsumeRowNo + '" list="listDeliveryLocation' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryAddress" placeholder="" onclick="$(this).val(\'\')" autocomplete="off"  required onchange="GetDeliveryAddressCode(this,' + tbItemConsumeRowNo + ');"></div><div class="col-md-3"><button type="button" id="btnSelectDeliveryAdd" onclick="GetAccountDeliveryLocationDetails(this,' + tbItemConsumeRowNo + ');ShowDeliveryAddressModal(' + tbItemConsumeRowNo + ');" class="btn btn-primary btn-height" title="Select Address"> <i class="fa fa-search"></i></button></div></div><input type="hidden" id="hdnAddressCode' + tbItemConsumeRowNo + '" name="hdnAddressCode"> ';
    //ItemName.innerHTML = '<input type="text"  id="txtItemName' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtItemName" placeholder="" list="listItem" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetItemSizeList(this,' + tbItemConsumeRowNo + ');GetLatestPriceListByItemName(this,' + tbItemConsumeRowNo + ');GetUOM(' + tbItemConsumeRowNo + ');GetBasicRateFromPriceList(this,' + tbItemConsumeRowNo + ');GetDealerFromPreRow(this,' + tbItemConsumeRowNo + ');GetItemSizeMasterList(this,' + tbItemConsumeRowNo + ');getRateUnitListFromQtyConfig(' + tbItemConsumeRowNo + ');ShowStockValueByItemSizeThk(this,' + tbItemConsumeRowNo + ');" required>';
    //Size.innerHTML = '<datalist id="listItemSize_' + tbItemConsumeRowNo + '"></datalist> <input type="text"  id="txtSize' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm digit8" name="txtSize" placeholder="" list="listItemSize_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedSizeCode(' + tbItemConsumeRowNo + ');GetItemThicknessList(this,' + tbItemConsumeRowNo + ');GetBasicRateExtraCharges(' + tbItemConsumeRowNo + ');ShowStockValueByItemSizeThk(this,' + tbItemConsumeRowNo + ');" required><input type="hidden" id="hdnSizeMasterCode' + tbItemConsumeRowNo + '" name="hdnSizeMasterCode">';
    //Thickness.innerHTML = '<datalist id="listItemThickness_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtThickness' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtThickness" placeholder="" list="listItemThickness_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedThkCode(' + tbItemConsumeRowNo + ');GetBasicRateExtraCharges(' + tbItemConsumeRowNo + ');ShowStockValueByItemSizeThk(this,' + tbItemConsumeRowNo + ');" required><input type="hidden" id="hdnThkMasterCode' + tbItemConsumeRowNo + '" name="hdnThkMasterCode">';
    //SizeDesp.innerHTML = '<div class="sizeDes"><datalist id="listItemSizeMaster_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtSizeDesp' + tbItemConsumeRowNo + '" list="listItemSizeMaster_' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="sizeDesInput BizSolFormControl box_border form-control form-control-sm" name="txtSizeDesp" placeholder="" list="listItemSizeMaster" autocomplete="off" onclick="$(this).val(\'\')"    onchange="GetSelectedItemSizeMasterCode(' + tbItemConsumeRowNo + ');" required><button type="button" id="btnShowSizeControl_' + tbItemConsumeRowNo + '" class="btn btn-primary btn-height" title="New Size" onclick="ShowSizeControl(this,' + tbItemConsumeRowNo + ');"> <i class="fa fa-plus-square"></i></button><input type="hidden" id="hdnItemSizeMasterCode' + tbItemConsumeRowNo + '" name="hdnItemSizeMasterCode"></div>';
    //UOM.innerHTML = '<datalist id="listUOM_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtUOM' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name="txtUOM" placeholder="" list="listUOM_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';

    ItemName.innerHTML = '<select id="ddlItemName' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlItemName"  autocomplete="off" onchange="OnChange_ddlItemName(this,' + tbItemConsumeRowNo + ');"></select>';
    Size.innerHTML = '<select id="ddlItemSize' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlItemSize"  autocomplete="off" onchange="OnChange_ddlItemSize(this,' + tbItemConsumeRowNo + ');"></select>';
    Thickness.innerHTML = '<select id="ddlItemThickness' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlItemThickness"  autocomplete="off" onchange="OnChange_ddlItemThickness(this,' + tbItemConsumeRowNo + ');"></select>';
    SizeDesp.innerHTML = '<div class="sizeDes"><select id="ddlItemSizeMaster' + tbItemConsumeRowNo + '" class="BizSolFormControl form-control form-control-sm box_border sizeDesInput" name="ddlItemSizeMaster"  autocomplete="off" onchange="OnChange_ddlItemSizeMaster(this,' + tbItemConsumeRowNo + ');"></select><button type="button" id="btnShowSizeControl_' + tbItemConsumeRowNo + '" class="btn btn-primary btn-height" title="New Size" onclick="ShowSizeControl(this,' + tbItemConsumeRowNo + ');"> <i class="fa fa-plus-square"></i></button></div>';
    UOM.innerHTML = '<select id="ddlUOM' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlUOM"  autocomplete="off" ></select>';


    Stock.innerHTML = '<input type="text"  id="txtStock' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtStock" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" style="min-width: 70px;" onchange="" required>';
    OrderQtyBags.innerHTML = '<input type="number"  id="txtOrderQtyBags' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderQtyBags" placeholder=""  autocomplete="off"  maxlength="6"  onchange="SetMTRByPacking(this,' + tbItemConsumeRowNo + ');CalculateAmount(this);" required>';
    OrderQtyPC.innerHTML = '<input type="number"  id="txtOrderQtyPC' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderQtyPC" placeholder=""  autocomplete="off"  maxlength="6"  onchange="SetWeightInMTByPC(this,' + tbItemConsumeRowNo + ');CalculateAmount(this);" required>';
    OrderQtyMT.innerHTML = '<input type="number"  id="txtOrderQtyMT' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderQtyMT" placeholder=""  autocomplete="off"  maxlength="6"  onchange="SetPCByWeightInMT(this,' + tbItemConsumeRowNo + ');CalculateAmount(this);" required>';
    OrderQtyMTR.innerHTML = '<input type="number"  id="txtOrderQtyMTR' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderQtyMTR" placeholder=""  autocomplete="off"  maxlength="6"  onchange="SetPCandWeightByLengthInMR(this,' + tbItemConsumeRowNo + ');CalculateAmount(this);" required>';
    RateUnit.innerHTML = '<input type="text" list="listRateUnit"  id="txtRateUnit' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtRateUnit" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')" onchange="CalculateAmount(this);OnChange_RateUnit(this,' + tbItemConsumeRowNo + ')"  required>';
    OrderUOM.innerHTML = '<input type="text"  id="txtOrderUOM' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderUOM" placeholder="" list="listOrderUOM" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    OrderQTY.innerHTML = '<input type="number"  id="txtOrderQTY' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderQTY" placeholder=""  autocomplete="off"  onchange="CalculateAmount(this);" required>';
    Tolerance.innerHTML = '<input type="number"  id="txtTolerance' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtTolerance" placeholder=""  autocomplete="off"   required>';
    BasicRate.innerHTML = '<input type="number"  id="txtBasicRate' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtBasicRate" placeholder=""  autocomplete="off" maxlength="12" onchange="CalculateAmount(this);GetMaxBasicRate();calFinalAmt();" required>';
    ExtraCharges.innerHTML = '<input type="number"  id="txtExtraCharges' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtExtraCharges" placeholder=""  autocomplete="off" maxlength="6" onchange="" required>';
    //DiscountType.innerHTML = '<input type="text"  id="txtDiscountType' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType" placeholder="" list="listDiscountType" value="' + DefaultDiscountType +'" autocomplete="off" onclick="$(this).val(\'\')"  onchange="CalculateAmount(this);" required>';
    DiscountType.innerHTML = '<select  id="txtDiscountType' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm btn-width" style="max-width: 60px;"> <option selected>Per Unit</option><option >%</option ></select>';

    Discount.innerHTML = '<input type="number"  id="txtDiscount' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount" placeholder=""  autocomplete="off"   required  onchange="CalculateAmount(this);">';
    OrderRate.innerHTML = '<input type="number"  id="txtOrderRate' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderRate" placeholder=""autocomplete="off"   onchange="" required>';
   

    DiscountType_AfterRate.innerHTML = '<input type="text"  id="txtDiscountType_AfterRate' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType_AfterRate" placeholder="" list="listDiscountType" autocomplete="off" onclick="$(this).val(\'\')"   onchange="CalculateAmount(this);" required>';
    Discount_AfterRate.innerHTML = '<input type="number"  id="txtDiscount_AfterRate' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount_AfterRate" placeholder="" maxlength="6"  autocomplete="off"   required  onchange="CalculateAmount(this);">';
    Amount.innerHTML = '<input type="number"  id="txtAmount' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" disabled name="txtAmount" placeholder="" autocomplete="off"  onchange="" required>';
    DeliveryDate.innerHTML = '<input type="date"  id="txtDeliveryDate' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryDate" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    //ZonePriceListCode.innerHTML = '<datalist id="ZonePriceListCode' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtZonePriceListCode' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtZonePriceListCode" placeholder="" list="listZone" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    ZonePriceListCode.innerHTML = '<select id="ddlZonePriceList' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ZonePriceList"  autocomplete="off" ></select>';
    Remarks.innerHTML = '<input type="text"  id="txtRemarks' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtRemarks" placeholder=""  autocomplete="off"  onchange="" required  maxlength="200">';
    Delete.innerHTML = '<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light disabled" title="Delete" onclick="DeleteOrderItem(this,' + tbItemConsumeRowNo + ');"><i class="fa fa-times" aria-hidden="true"></i></a>';

    DealerNameList.innerHTML = '<div class="d-flex align-items-center gap-1"><input type="hidden" id="hdnDistributorDealerCode' + tbItemConsumeRowNo + '" name="hdnDistributorDealerCode"><input type="text"  id="txtDealerNameList' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm flex-grow-1" name="txtDealerNameList" placeholder="" list="listDistributorDealer" autocomplete="off" onclick="$(this).val(\'\')" onchange="GetDistributorDealerCode(this,' + tbItemConsumeRowNo + ')"  required>' + addDealerMasterBtn + '</div>';

    VisitDetailsCode.innerHTML = '<input type="text"  id="txtVisitDetailsCode' + tbItemConsumeRowNo + '"  name="txtVisitDetailsCode" placeholder="" value=0  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    IsNewRow.innerHTML = '<input type="text"  id="txtIsNewRow' + tbItemConsumeRowNo + '"  name="txtIsNewRow" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    SizeApplicable.innerHTML = '<input type="text"  id="txtSizeApplicable' + tbItemConsumeRowNo + '"  name="txtSizeApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    ThkApplicable.innerHTML = '<input type="text"  id="txtThkApplicable' + tbItemConsumeRowNo + '" name="txtThkApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    LenApplicable.innerHTML = '<input type="text"  id="txtLenApplicable' + tbItemConsumeRowNo + '"  name="txtLenApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    ItemMasterCode.innerHTML = '<input type="text"  id="txtItemMasterCode' + tbItemConsumeRowNo + '"  name="txtItemMasterCode" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    UOMDecimalUnit.innerHTML = '<input type="text"  id="txtUOMDecimalUnit' + tbItemConsumeRowNo + '"  name="UOMDecimalUnit" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';


    $('#txtDeliveryDate' + tbItemConsumeRowNo).val(new Date().toISOString().split("T")[0]);

    BindSelect2FromDataList($('#ddlItemName' + tbItemConsumeRowNo), arrayList_ItemMaster, "FirstItemZero","100%");
    BindSelect2FromDataList($('#ddlZonePriceList' + tbItemConsumeRowNo), arrayList_Zone, "FirstItemZero", "100%");
}

function OnChange_ddlItemName(x, tbItemConsumeRowNo) {
    GetItemSizeList(x, tbItemConsumeRowNo);
    //GetLatestPriceListByItemName(x, tbItemConsumeRowNo);
    GetUOM(tbItemConsumeRowNo);
   //GetBasicRateFromPriceList(x, tbItemConsumeRowNo);
    GetDealerFromPreRow(x, tbItemConsumeRowNo);
    GetItemSizeMasterList(x, tbItemConsumeRowNo);
    getRateUnitListFromQtyConfig(tbItemConsumeRowNo);
    ShowStockValueByItemSizeThk(x, tbItemConsumeRowNo); 
    GetBasicRateExtraCharges(x, tbItemConsumeRowNo);
    SetMTRByPacking(x, tbItemConsumeRowNo);

}

function OnChange_ddlItemSize(x, tbItemConsumeRowNo) {
    //GetSelectedSizeCode(tbItemConsumeRowNo);
    GetItemThicknessList(x, tbItemConsumeRowNo);
    GetBasicRateExtraCharges(x,tbItemConsumeRowNo);
    ShowStockValueByItemSizeThk(x, tbItemConsumeRowNo);
    GetDefaultItemSizeMasterCode(x, tbItemConsumeRowNo);

}

function OnChange_ddlItemThickness(x, tbItemConsumeRowNo) {
    //GetSelectedThkCode(tbItemConsumeRowNo);
    GetBasicRateExtraCharges(x,tbItemConsumeRowNo);
    ShowStockValueByItemSizeThk(x, tbItemConsumeRowNo);
    GetDefaultItemSizeMasterCode(x, tbItemConsumeRowNo);
}

function OnChange_ddlItemSizeMaster(x, tbItemConsumeRowNo) {
    GetSelectedItemSizeMasterCode(tbItemConsumeRowNo);
    SetWeightInMTByPC(x, tbItemConsumeRowNo);
    //SetPCandWeightByLengthInMR(x, tbItemConsumeRowNo);
    ShowStockValueByItemSizeThk(x, tbItemConsumeRowNo);
}
function OnChange_RateUnit(x, tbItemConsumeRowNo) {
    GetBasicRateExtraCharges(x, tbItemConsumeRowNo);
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

        ///Copy DiscountType and Discount from Pre Row
        var PreDiscountType = PreRow.cells[Indx_TblOrder.DiscountType].getElementsByTagName('select')[0].value;
        var PreDiscount = PreRow.cells[Indx_TblOrder.Discount].getElementsByTagName('input')[0].value;
        if (PreDiscount != undefined && PreDiscountType != '') {
            ObjCurrRow.find('td:eq(' + Indx_TblOrder.DiscountType + ')')[0].getElementsByTagName('select')[0].value = PreDiscountType;
            ObjCurrRow.find('td:eq(' + Indx_TblOrder.Discount + ')')[0].getElementsByTagName('input')[0].value = PreDiscount;
        }
    }
}
function CalculateAmount(x) {

    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var AskDiscountItemWise = CRM_Config.AskDiscountItemWise;
    var ShowExtraColumnOrderQtyAndUnit = CRM_Config.ShowExtraColumnOrderQtyAndUnit;
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var Qty_Config_Unit = Qty_Config.Unit;
    var Qty_Config_RateUnit = Qty_Config.RateUnit;
    var Qty_Config_DefaultRateUnit = Qty_Config.DefaultRateUnit;
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader = Qty_Config.QtyMT;

    var ObjCurrRow = $(x).closest('tr');
    var QtyMT = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyMT + ')')[0].getElementsByTagName('input')[0].value;
    var QtyPC = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyPC + ')')[0].getElementsByTagName('input')[0].value;
    var QtyMTR = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyMTR + ')')[0].getElementsByTagName('input')[0].value;
    /* var UOM = ObjCurrRow.find('td:eq(' + Indx_TblOrder.UOM + ')')[0].getElementsByTagName('input')[0].value;*/
    var UOM = ObjCurrRow.find('td:eq(' + Indx_TblOrder.UOM + ') select option:selected').text();
    var BasicRate = ObjCurrRow.find('td:eq(' + Indx_TblOrder.BasicRate + ')')[0].getElementsByTagName('input')[0].value;
    //var DiscountType = ObjCurrRow.find('td:eq(' + Indx_TblOrder.DiscountType + ')')[0].getElementsByTagName('input')[0].value;
    var DiscountType = ObjCurrRow.find('td:eq(' + Indx_TblOrder.DiscountType + ')')[0].getElementsByTagName('select')[0].value;

    var Discount = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Discount + ')')[0].getElementsByTagName('input')[0].value;
    var DiscountType_AfterRate = ObjCurrRow.find('td:eq(' + Indx_TblOrder.DiscountType_AfterRate + ')')[0].getElementsByTagName('input')[0].value;
    var Discount_AfterRate = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Discount_AfterRate + ')')[0].getElementsByTagName('input')[0].value;
    var OrderUOM = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderUOM + ')')[0].getElementsByTagName('input')[0].value;
    var ExtraCharges = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ExtraCharges + ')')[0].getElementsByTagName('input')[0].value;
    var RateUnit = ObjCurrRow.find('td:eq(' + Indx_TblOrder.RateUnit + ')')[0].getElementsByTagName('input')[0].value;
    
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
    if (ExtraCharges == undefined || ExtraCharges == '') {
        ExtraCharges = 0;
    }

    if (ShowExtraColumnOrderQtyAndUnit == 'Y') {
        RateUnit = OrderUOM;
    } else {
        if (Qty_Config_Unit.trim().toUpperCase() == 'As Per Master'.trim().toUpperCase()) {
            if (QtyPCHeader == '' && QtyMTHeader == '' && QtyMTRHeader!=='') {
                RateUnit = 'MR';
            } else {
                RateUnit = UOM;
            }
            
        } else {
            if (RateUnit == '') {
                RateUnit = Qty_Config_DefaultRateUnit;
            }
        }
    }


    var Qty = 0;

    //if (UOM.trim().toUpperCase() == 'NOS' || UOM.trim().toUpperCase() == 'MR') {
    //    Qty = QtyMTR;
    //} else if (UOM.trim().toUpperCase() == 'PC') {
    //    Qty = QtyPC;
    //} else {
    //    Qty = QtyMT;
    //}

    if (RateUnit.trim().toUpperCase() == 'NOS' || RateUnit.trim().toUpperCase() == 'MR') {
        Qty = QtyMTR;
    } else if (RateUnit.trim().toUpperCase() == 'PC' || RateUnit.trim().toUpperCase() == 'PCS') {
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
        BasicRate = parseFloat(BasicRate) + parseFloat(ExtraCharges);
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

    if (AskDiscountItemWise.trim().toUpperCase() == 'Before Order Rate'.trim().toUpperCase() || AskDiscountItemWise.trim().toUpperCase() == 'Both'.trim().toUpperCase()) {
        if (DiscountType == '%' && Discount !== '') {
            BasicRate = parseFloat(BasicRate).toFixed(2) - (parseFloat(BasicRate).toFixed(2) * (parseFloat(Discount).toFixed(2) / 100));
        } else if (DiscountType == 'Per Unit' && Discount !== '') {
           BasicRate= parseFloat(BasicRate).toFixed(2) - parseFloat(Discount).toFixed(2);
        } else {
            BasicRate = parseFloat(BasicRate).toFixed(2)
        }
    } 
    ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderRate + ')')[0].getElementsByTagName('input')[0].value = parseFloat(BasicRate).toFixed(2);

    if (AskDiscountItemWise.trim().toUpperCase() == 'After Order Rate'.trim().toUpperCase() || AskDiscountItemWise.trim().toUpperCase() == 'Both'.trim().toUpperCase()) {
        if (DiscountType_AfterRate == '%' && Discount_AfterRate !== '') {
            TotalDiscount_ItemWise = parseFloat(Qty * BasicRate).toFixed(2) * (parseFloat(Discount_AfterRate).toFixed(2) / 100);
        } else if (DiscountType_AfterRate.trim().toUpperCase() == 'Per Unit'.trim().toUpperCase() && Discount_AfterRate !== '') {
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
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader = Qty_Config.QtyMT;
    var Qty_Config_DefaultRateUnit = Qty_Config.DefaultRateUnit;
    var Qty_Config_Unit = Qty_Config.Unit;

    var DistributorDealerApplicableInOrder = CRM_Config.ShowDealerColumn;

    var Valid = true;
    var MsgStr = "";
    var newLine = "<br>";
    var EntryType = 'O';
    let AllowOrderOnlyAvailableStock = 'N'

    AllowOrderOnlyAvailableStock = CRM_Config.AllowOrderOnlyAvailableStock;

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
    var UOMForVerifyDiscount = CRM_Config.UOMForVerifyDiscount;
    var ManualBasicRate = CRM_Config.AllowToChangeBasicRate;
    var PriceZoneListMandatoryInOrder = CRM_Config.ShowZone;
    var ShowSizeThicknessColumns = CRM_Config.ShowSizeThicknessColumns;
    var ShowExtraColumnOrderQtyAndUnit = CRM_Config.ShowExtraColumnOrderQtyAndUnit;
    var ShowDeliveryDate = CRM_Config.ShowDeliveryDate;
    var CheckLogicalStockLimit = CRM_Config.CheckLogicalStockLimit;
    var isOEMClient = GetSelectedCustomerAccountNature() === 'OEM';
    var PaymentTerm = $('#ddlPaymentTerms option:selected').text();//$("#txtPaymentTerms").val();
    var Freight = $('#ddlFreight option:selected').text();//$("#txtlistFreight").val();
   

    //var AccountDesp = $("#txtDealer").val();
    var AccountDesp = $('#ddlCustomerName option:selected').text();
    if (AccountDesp == "") {

        MsgStr += "* Please Select Customer Name!" + newLine;
        Valid = false;
    }

    var totalOrderQtyVal = parseFloat($('#txtTotalOrderQty').val());
    if (isNaN(totalOrderQtyVal) || totalOrderQtyVal <= 0) {
        MsgStr += "* Total Order Qty cannot be blank or zero. Please enter a valid Total Order Qty!" + newLine;
        Valid = false;
    }

    if (GetSelectedCustomerBillApplicable() === 'N') {
        MsgStr += "* Order cannot be saved. Billing is not applicable for the selected Customer!" + newLine;
        Valid = false;
    }
    //if (ListValidation("#txtDealer", "#listdealer") == false) {
    //    MsgStr += "* Please Enter Valid Customer Name!" + newLine;
    //    Valid = false;
    //}


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
    var TotalDiscount = 0;
    var TotalQty = 0;
    var DiscountedItems = 0;
    var ShowSizeButton = $('#toggleSwitch').is(':checked');
    $("#tblorderbooking tbody tr").each(function (index, row) {
        var ItemName = '';
        var QtyMT = 0;
        var BasicRate = 0;
        var Amount = 0;
        var DeliveryDate = new Date().toISOString().split("T")[0];
        var ZonePriceListCode = '';
        var Remarks = '';
        var rowNo = index + 1;
        var QtyBags = 0;
        var QtyPC = 0;
        var QtyMTR = 0;
        var DealerCode = 0;
        var DealerName = '';
        var SizeDesp = '';
        var Size = '';
        var Thk = '';
        var Stock = 0;
        let ItemMaster_Code = 0;

        let ItemMasterTable = JSON.parse(sessionStorage.getItem('ItemMasterTable'));

        //ItemName = $(this).find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
        ItemName = $(this).find('td:eq(' + Indx_TblOrder.ItemName + ') select option:selected').text();
        ItemMaster_Code = $(this).find('td:eq(' + Indx_TblOrder.ItemName + ') select option:selected').val();

        QtyMT = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyMT + ')')[0].getElementsByTagName('input')[0].value;
        BasicRate = $(this).find('td:eq(' + Indx_TblOrder.BasicRate + ')')[0].getElementsByTagName('input')[0].value;
        Amount = $(this).find('td:eq(' + Indx_TblOrder.Amount + ')')[0].getElementsByTagName('input')[0].value;
        DeliveryDate = $(this).find('td:eq(' + Indx_TblOrder.DeliveryDate + ')')[0].getElementsByTagName('input')[0].value;
        //ZonePriceListCode = $(this).find('td:eq(' + Indx_TblOrder.ZonePriceListCode + ')')[0].getElementsByTagName('input')[0].value;
        ZonePriceListCode = $(this).find('td:eq(' + Indx_TblOrder.ZonePriceListCode + ') select option:selected').text();
        Remarks = $(this).find('td:eq(' + Indx_TblOrder.Remarks + ')')[0].getElementsByTagName('input')[0].value;
        QtyBags = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyBags + ')')[0].getElementsByTagName('input')[0].value;
        QtyPC = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyPC + ')')[0].getElementsByTagName('input')[0].value;
        QtyMTR = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyMTR + ')')[0].getElementsByTagName('input')[0].value;
        DealerCode = $(this).find('td:eq(' + Indx_TblOrder.DealerName + ')')[0].getElementsByTagName('input')[0].value;
        DealerName = $(this).find('td:eq(' + Indx_TblOrder.DealerName + ')')[0].getElementsByTagName('input')[1].value;
        //SizeDesp = $(this).find('td:eq(' + Indx_TblOrder.SizeDesp + ')')[0].getElementsByTagName('input')[0].value;
        SizeDesp = $(this).find('td:eq(' + Indx_TblOrder.SizeDesp + ') select option:selected').text();
        //Size = $(this).find('td:eq(' + Indx_TblOrder.Size + ')')[0].getElementsByTagName('input')[0].value;
        Size = $(this).find('td:eq(' + Indx_TblOrder.Size + ') select option:selected').text();
        //Thk = $(this).find('td:eq(' + Indx_TblOrder.Thickness + ')')[0].getElementsByTagName('input')[0].value;
        Thk = $(this).find('td:eq(' + Indx_TblOrder.Thickness + ') select option:selected').text();
        var OrderQty = $(this).find('td:eq(' + Indx_TblOrder.OrderQTY + ')')[0].getElementsByTagName('input')[0].value;
        var OrderUOM = $(this).find('td:eq(' + Indx_TblOrder.OrderUOM + ')')[0].getElementsByTagName('input')[0].value;
        Stock = $(this).find('td:eq(' + Indx_TblOrder.Stock + ')')[0].getElementsByTagName('input')[0].value;
        var DiscountType = $(this).find('td:eq(' + Indx_TblOrder.DiscountType + ')')[0].getElementsByTagName('select')[0].value;
        var Discount = $(this).find('td:eq(' + Indx_TblOrder.Discount + ')')[0].getElementsByTagName('input')[0].value;
        var DiscountType_AfterRate = $(this).find('td:eq(' + Indx_TblOrder.DiscountType_AfterRate + ')')[0].getElementsByTagName('input')[0].value;
        var Discount_AfterRate = $(this).find('td:eq(' + Indx_TblOrder.Discount_AfterRate + ')')[0].getElementsByTagName('input')[0].value;
        //var UOM = $(this).find('td:eq(' + Indx_TblOrder.UOM + ')')[0].getElementsByTagName('input')[0].value;
        var UOM = $(this).find('td:eq(' + Indx_TblOrder.UOM + ') select option:selected').text();
        var RateUnit = $(this).find('td:eq(' + Indx_TblOrder.RateUnit + ')')[0].getElementsByTagName('input')[0].value;

        let StockInMT = "N";
        let StockInMTRS = "N";
        let StockInPC = "N";
        let AlowCRMOrderBookingWithOutStock = 'N';

        let ItemSelectedObj = ItemMasterTable.find(x => x.Code === parseInt(ItemMaster_Code));
        if (typeof ItemSelectedObj !== "undefined") {
            StockInMT = ItemSelectedObj.StockInMT;
            StockInMTRS = ItemSelectedObj.StockInMTRS;
            StockInPC = ItemSelectedObj.StockInPC;
            AlowCRMOrderBookingWithOutStock = ItemSelectedObj.AlowCRMOrderBookingWithOutStock || 'N';
        }

        if (QtyMT == undefined || QtyMT == '') {
            QtyMT = 0;
        }
        if (QtyPC == undefined || QtyPC == '') {
            QtyPC = 0;
        }
        if (QtyMTR == undefined || QtyMTR == '') {
            QtyMTR = 0;
        }
        if (Amount == undefined || Amount == '') {
            Amount = 0;
        }

        if (ShowExtraColumnOrderQtyAndUnit == 'Y') {
            RateUnit = OrderUOM;
        } else {
            
            if (Qty_Config_Unit.trim().toUpperCase() == 'As Per Master'.trim().toUpperCase()) {
                if (QtyPCHeader == '' && QtyMTHeader == '' && QtyMTRHeader !== '') {
                    RateUnit = 'MR';
                } else {
                    RateUnit = UOM;
                }

            } else {
                if (RateUnit == '') {
                    RateUnit = Qty_Config_DefaultRateUnit;
                }
            }
        }


        TotalOrderAmount += parseFloat(Amount);

        if (ItemName != '' && (Amount == '' || Amount==0)) {
            MsgStr += "* Invalid Amount at Row No " + rowNo + "!" + newLine;
            Valid = false;
        }

        if (Amount > 0) {
            if (ItemName == '') {

                MsgStr += "* Invalid Item Name at Row No " + rowNo + "!" + newLine;
                Valid = false;
            }
            //else {
            //    if (param_VisitMode == 'New') {
            //        if (ListValidation("#txtItemName" + rowNo, "#listItem") == false) {
            //            MsgStr += "* Please Enter Valid Item Name at Row No " + rowNo + "!" + newLine;
            //            Valid = false;
            //        }
            //    }
            //}
           
            //if (ShowSizeThicknessColumns == 'Y') {
            //    if (param_VisitMode == 'New') {
            //        if (ShowSizeButton == false) {
            //            if (ListValidation("#txtThickness" + rowNo, "#listItemThickness_" + rowNo) == false) {
            //                MsgStr += "* Please Enter Valid Thickness at Row No " + rowNo + "!" + newLine;
            //                Valid = false;
            //            }
            //        } else {
            //            if (ListValidation("#txtSizeDesp" + rowNo, "#listItemSizeMaster_" + rowNo) == false) {
            //                MsgStr += "* Please Enter Valid Size Desp at Row No " + rowNo + "!" + newLine;
            //                Valid = false;
            //            }
            //        }
                   
            //    }
            //}

            if (RateUnit !== '') {
                if (ListValidation("#txtRateUnit" + rowNo, "#listRateUnit") == false) {
                    MsgStr += "* Please Enter Valid Rate Unit at Row No " + rowNo + "!" + newLine;
                    Valid = false;
                }
            }

            if (BasicRate == '' || BasicRate <= 0) {

                MsgStr += "* Invalid Basic Rate at Row No " + rowNo + "!" + newLine;
                Valid = false;
            }
            if ((QtyMT == '' || QtyMT <= 0) && (QtyPC == '' || QtyPC <= 0) && (QtyMTR == '' || QtyMTR <= 0)) {

                MsgStr += "* Invalid Qty at Row No " + rowNo + "!" + newLine;
                Valid = false;
            }

            if (Stock > 0 && QtyMT > 0 && !isOEMClient && AlowCRMOrderBookingWithOutStock !== 'Y') {
                if (CheckLogicalStockLimit == 'Y') {
                    if (parseFloat(QtyMT) > parseFloat(Stock)) {
                        MsgStr += "* Qty value shouldn't be greater than the stock value at Row No " + rowNo + "!" + newLine;
                        Valid = false;

                    }
                }

            }

            if (ShowDeliveryDate == 'Y') {
                if (DeliveryDate == '') {

                    MsgStr += "* Invalid Delivery Date at Row No " + rowNo + "!" + newLine;
                    Valid = false;
                }
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

            if (Discount > 0 && (DiscountType == undefined || DiscountType=='')) {
                MsgStr += "* Invalid Discount Type at Row No " + rowNo + "!" + newLine;
                Valid = false;
            }

            if (Discount_AfterRate > 0 && (DiscountType_AfterRate == undefined || DiscountType_AfterRate == '')) {
                MsgStr += "* Invalid Discount Type After Rate at Row No " + rowNo + "!" + newLine;
                Valid = false;
            }
            if (DiscountType == '%' && (Discount > 100 || Discount < 0)) {
                MsgStr += "* Discount Percentage should be between 0 to 100 at Row No " + rowNo + "!" + newLine;
                Valid = false;
            }
            if (Discount > 0 && (DiscountType !== undefined || DiscountType !== '') && RateUnit == UOMForVerifyDiscount) {
                TotalDiscount += parseFloat(Discount);
                DiscountedItems = DiscountedItems+1;
                if (RateUnit.trim().toUpperCase() == 'NOS' || RateUnit.trim().toUpperCase() == 'MR') {
                    TotalQty+= parseFloat(QtyMTR);
                    
                } else if (RateUnit.trim().toUpperCase() == 'PC') {
                    TotalQty += parseFloat(QtyPC);
                } else {
                    TotalQty +=  parseFloat(QtyMT);
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



            if (Stock <= 0 && AllowOrderOnlyAvailableStock == 'Y' && !isOEMClient && AlowCRMOrderBookingWithOutStock !== 'Y') {

                MsgStr += "* Stock not Available at Row No " + rowNo + "!" + newLine;
                Valid = false;

            }

            

            if ((QtyMT == '' || QtyMT <= 0) && StockInMT == 'Y') {

                MsgStr += "* Invalid Order MT at Row No " + rowNo + "!" + newLine;
                Valid = false;

            }
            if ((QtyMTR == '' || QtyMTR <= 0) && StockInMTRS == 'Y') {

                MsgStr += "* Invalid Order MR at Row No " + rowNo + "!" + newLine;
                Valid = false;

            }
            if ((QtyPC == '' || QtyPC <= 0) && RateUnit.trim().toUpperCase() == 'PC' && StockInPC == 'Y') {

                MsgStr += "* Invalid Order PC at Row No " + rowNo + "!" + newLine;
                Valid = false;

            }

        }

    });


   

    ValidateDiscountLimit();

 

    if (EntryType == 'O' && tbodyOrderDetail.rows.length == 0) {
        MsgStr += "* Please enter any record for Order Booking." + newLine;
        Valid = false;
    } else if (EntryType == 'O' && (TotalOrderAmount == 0 || TotalOrderAmount<0)) {
        MsgStr += "* Please enter any valid record for Order Booking." + newLine;
        Valid = false;
    }

    if (duplicateValues.length > 0) {
        duplicateValues.forEach((item) => {
            MsgStr += "* Duplicate record exists for item:'" + item + "'" + newLine;
        })
        Valid = false;
    }

    var _totalOrderQty = parseFloat($('#txtTotalOrderQty').val()) || 0;
    if (_totalOrderQty > 0) {
        ShowFooterTotal();
        var _sizeWiseTotalMT = parseFloat($('#txtOrderQtyMTTotal').text()) || 0;
        var _sizeWiseTotalPC = parseFloat($('#txtOrderQtyPCTotal').text()) || 0;
        var _sizeWiseTotalMTR = parseFloat($('#txtOrderQtyMTRTotal').text()) || 0;
        var _sizeWiseTotal = _sizeWiseTotalMT > 0 ? _sizeWiseTotalMT
                           : _sizeWiseTotalPC > 0 ? _sizeWiseTotalPC
                           : _sizeWiseTotalMTR;
        if (_sizeWiseTotal > _totalOrderQty) {
            MsgStr += "* Size-wise total Order Qty (" + _sizeWiseTotal.toFixed(3) + ") exceeds the Total Order Qty (" + _totalOrderQty.toFixed(3) + "). Please reduce the ordered quantities!" + newLine;
            Valid = false;
        }
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
    //if (ValidateData() == false) {
    //    return false;
    //}
    var allTablesData = {};
    var visitMasterData = [];
    var visitOrderDetailsData = [];

    var visitOtherPartyData = [];
    var visitPaymentData = [];
    var visitCheckListData = [];

    var visitMasterRow = {};

    var Config_Marketing = JSON.parse(sessionStorage.getItem('FixedParameterMarketing'));
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var FixedParameterCreditLimit_Config = JSON.parse(sessionStorage.getItem('FixedParameterCreditLimit'));

    var AllowInMTRSColForSingleUnit = Config_Marketing.AllowInMTRSColForSingleUnit;
    var ShowExtraColumnOrderQtyAndUnit = CRM_Config.ShowExtraColumnOrderQtyAndUnit;
    var Qty_Config_Unit = Qty_Config.Unit;
    var Qty_Config_RateUnit = Qty_Config.RateUnit;
    var Qty_Config_DefaultRateUnit = Qty_Config.DefaultRateUnit;
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader = Qty_Config.QtyMT;
    var OverduePasswordRemark = '0';
    if (FixedParameterCreditLimit_Config[0].CreditLimitCheck_BuyerPO == 'Y' || FixedParameterCreditLimit_Config[0].CreditLimitCheck_BuyerPO == 'R') {
        var OverduePasswordCode = CheckCreditLimitsControl_PasswordCode !== undefined && CheckCreditLimitsControl_PasswordCode !== '' ? CheckCreditLimitsControl_PasswordCode : 0;
         OverduePasswordRemark = CheckCreditLimitsControl_Remark !== undefined && CheckCreditLimitsControl_Remark !== '' ? CheckCreditLimitsControl_Remark : '0';
    } else {
        var OverduePasswordCode = 0;
        
    }
   

    var objToggle = $('#toggleSwitch');

    visitMasterRow["code"] = param_VisitMaster_Code;
    visitMasterRow["date"] = new Date().toISOString().split("T")[0];
    visitMasterRow["visitType"] = 0;
    visitMasterRow["accountDesp"] = $('#ddlCustomerName option:selected').text() !== null ? $('#ddlCustomerName option:selected').text() : '';
    visitMasterRow["photo"] = $("#hfFileInput")[0].value !== null ? $("#hfFileInput")[0].value : '';
    visitMasterRow["location"] = $("#hflatlong").val() !== null ? $("#hflatlong").val() : '';
    visitMasterRow["checkIn"] = $("#txtCheckInTime").val() !== null ? $("#txtCheckInTime").val() : '';
    visitMasterRow["checkOut"] = '';
    visitMasterRow["remarks"] = $("#txtRemarks").val() !== null ? $("#txtRemarks").val() : '';
    visitMasterRow["routePlanMaster_code"] = param_RoutePlanCode;
    visitMasterRow["nextVisitDate"] = addDays(new Date(), 2).toISOString().split("T")[0];
    visitMasterRow["verified"] = 'N';
    visitMasterRow["paymentTermsMaster_Code"] = $('#ddlPaymentTerms option:selected').val() !== null ? $('#ddlPaymentTerms option:selected').val() : 0;//$('#hiddentxtPaymentTerm').val() !== null ? $("#hiddentxtPaymentTerm").val() : 0;
    visitMasterRow["deliveryDays"] = $("#txtDeliveryDays").val() !== null ? $("#txtDeliveryDays").val() : 0;
    visitMasterRow["freightCondition"] = $('#ddlFreightType option:selected').text() !== null ? $('#ddlFreightType option:selected').text() : '';//$("#txtFreightType").val() !== null ? $("#txtFreightType").val() : '';
    visitMasterRow["orderDealerName"] = $('#ddlCustomerName option:selected').text() !== null ? $('#ddlCustomerName option:selected').text() : '';//$("#txtDealer").val() !== null ? $("#txtDealer").val() : '';
    visitMasterRow["userMasterCode"] = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
    visitMasterRow["checkInLocation"] = $("#txtCurrentLocation").val() !== null ? $("#txtCurrentLocation").val() : '';
    visitMasterRow["checkOutLocation"] = 0;
    visitMasterRow["mRateUnit"] = '';
    visitMasterRow["creditDays"] = $('#txtCreditDaysForDC') !== null ? $("#txtCreditDaysForDC").val() : 0;
    visitMasterRow["freight"] = $('#ddlFreight option:selected').text() !== null ? $('#ddlFreight option:selected').text() : '';//$("#txtlistFreight").val() !== null ? $("#txtlistFreight").val() : '';
    visitMasterRow["dispatchFrom"] = '';
    visitMasterRow["buyerPONo"] = $("#txtBuyerPONo").val() !== null ? $("#txtBuyerPONo").val() : '';
    visitMasterRow["buyerPODate"] = new Date().toISOString().split("T")[0];
    visitMasterRow["zoneName"] = '';
    visitMasterRow["totalOrderQty"] = parseFloat($("#txtTotalOrderQty").val()) || 0;

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
        var QtyBags = 0;
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
        

        //ItemName = $(this).find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
        var ItemName = $(this).find('td:eq(' + Indx_TblOrder.ItemName + ') select option:selected').text();

        QtyMT = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyMT + ')')[0].getElementsByTagName('input')[0].value;
        BasicRate = $(this).find('td:eq(' + Indx_TblOrder.BasicRate + ')')[0].getElementsByTagName('input')[0].value;
        Amount = $(this).find('td:eq(' + Indx_TblOrder.Amount + ')')[0].getElementsByTagName('input')[0].value;
        DeliveryDate = $(this).find('td:eq(' + Indx_TblOrder.DeliveryDate + ')')[0].getElementsByTagName('input')[0].value;
        //ZonePriceListCode = $(this).find('td:eq(' + Indx_TblOrder.ZonePriceListCode + ')')[0].getElementsByTagName('input')[0].value;
        ZonePriceListCode = $(this).find('td:eq(' + Indx_TblOrder.ZonePriceListCode + ') select option:selected').text();
        Remarks = $(this).find('td:eq(' + Indx_TblOrder.Remarks + ')')[0].getElementsByTagName('input')[0].value;
        VisitDetailsCode = $(this).find('td:eq(' + Indx_TblOrder.VisitDetailsCode + ')')[0].getElementsByTagName('input')[0].value;
        /*UOM = $(this).find('td:eq(' + Indx_TblOrder.UOM + ')')[0].getElementsByTagName('input')[0].value;*/
        UOM = $(this).find('td:eq(' + Indx_TblOrder.UOM + ') select option:selected').text();
        QtyMTR = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyMTR + ')')[0].getElementsByTagName('input')[0].value;
        DealerCode = $(this).find('td:eq(' + Indx_TblOrder.DealerName + ')')[0].getElementsByTagName('input')[0].value;
        QtyBags = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyBags + ')')[0].getElementsByTagName('input')[0].value;
        QtyPC = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyPC + ')')[0].getElementsByTagName('input')[0].value;
        ExtraCharges = $(this).find('td:eq(' + Indx_TblOrder.ExtraCharges + ')')[0].getElementsByTagName('input')[0].value;
        

        if (objToggle[0].checked == true) {
            //SizeDesp = $(this).find('td:eq(' + Indx_TblOrder.SizeDesp + ')')[0].getElementsByTagName('input')[0].value;
            //ItemSizeMaster_code = $(this).find('td:eq(' + Indx_TblOrder.SizeDesp + ')')[0].getElementsByTagName('input')[1].value;
            SizeDesp = $(this).find('td:eq(' + Indx_TblOrder.SizeDesp + ') select option:selected').text();
            ItemSizeMaster_code = $(this).find('td:eq(' + Indx_TblOrder.SizeDesp + ') select option:selected').val();

        } else {
            SizeDesp = '';
            ItemSizeMaster_code = 0;
        }
       
        //Size = $(this).find('td:eq(' + Indx_TblOrder.Size + ')')[0].getElementsByTagName('input')[0].value;
        //Thickness = $(this).find('td:eq(' + Indx_TblOrder.Thickness + ')')[0].getElementsByTagName('input')[0].value;
        //SizeCode = $(this).find('td:eq(' + Indx_TblOrder.Size + ')')[0].getElementsByTagName('input')[1].value;
        //ThicknessCode = $(this).find('td:eq(' + Indx_TblOrder.Thickness + ')')[0].getElementsByTagName('input')[1].value;

        Size = $(this).find('td:eq(' + Indx_TblOrder.Size + ') select option:selected').text();
        Thickness = $(this).find('td:eq(' + Indx_TblOrder.Thickness + ') select option:selected').text();
        SizeCode = $(this).find('td:eq(' + Indx_TblOrder.Size + ') select option:selected').val();
        ThicknessCode = $(this).find('td:eq(' + Indx_TblOrder.Thickness + ') select option:selected').val();

        var DiscountType = $(this).find('td:eq(' + Indx_TblOrder.DiscountType + ')')[0].getElementsByTagName('select')[0].value;
        var Discount = $(this).find('td:eq(' + Indx_TblOrder.Discount + ')')[0].getElementsByTagName('input')[0].value;
        var DiscountType_AfterRate = $(this).find('td:eq(' + Indx_TblOrder.DiscountType_AfterRate + ')')[0].getElementsByTagName('input')[0].value;
        var Discount_AfterRate = $(this).find('td:eq(' + Indx_TblOrder.Discount_AfterRate + ')')[0].getElementsByTagName('input')[0].value;
        var Tolerance = $(this).find('td:eq(' + Indx_TblOrder.Tolerance + ')')[0].getElementsByTagName('input')[0].value;
        var Consignee_Code = $(this).find('td:eq(' + Indx_TblOrder.Consignee + ')')[0].getElementsByTagName('input')[1].value;
        var DeliveryLocation_Code = $(this).find('td:eq(' + Indx_TblOrder.DeliveryAddress + ')')[0].getElementsByTagName('input')[1].value;
        var RateUnit = $(this).find('td:eq(' + Indx_TblOrder.RateUnit + ')')[0].getElementsByTagName('input')[0].value;
        var Rate = $(this).find('td:eq(' + Indx_TblOrder.OrderRate + ')')[0].getElementsByTagName('input')[0].value;
        var OrderUOM = $(this).find('td:eq(' + Indx_TblOrder.OrderUOM + ')')[0].getElementsByTagName('input')[0].value;
    
        QtyMT = QtyMT == undefined || QtyMT == '' ? 0 : QtyMT;
        QtyBags = QtyBags == undefined || QtyBags == '' ? 0 : QtyBags;
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

        if (ShowExtraColumnOrderQtyAndUnit == 'Y') {
            RateUnit = OrderUOM;
        } else {
            if (Qty_Config_Unit == 'As Per Master') {
                RateUnit = UOM;
            } else {
                if (RateUnit == '') {
                    RateUnit = Qty_Config_DefaultRateUnit;
                }
            }
            //if (Qty_Config_Unit.trim().toUpperCase() == 'As Per Master'.trim().toUpperCase()) {
            //    if (QtyPCHeader == '' && QtyMTHeader == '' && QtyMTRHeader !== '') {
            //        RateUnit = 'MR';
            //    } else {
            //        RateUnit = UOM;
            //    }

            //} else {
            //    if (RateUnit == '') {
            //        RateUnit = Qty_Config_DefaultRateUnit;
            //    }
            //}
        }
        


        if (Amount > 0) {
            var rowData = {};


            rowData["Code"] = VisitDetailsCode;
            rowData["VisitMaster_Code"] = param_VisitMaster_Code;
            rowData["Size"] = Size;
            rowData["Thickness"] = Thickness;
            rowData["LengthDesp"] = '';
            rowData["OrderQty"] = QtyMT;// (QtyPCHeader == '' && QtyMTHeader == '' && QtyMTRHeader !== '') ? QtyMTR : QtyMT;
            rowData["Rate"] = Rate;
            rowData["Discount"] = Discount == undefined || Discount == "" ? 0 : Discount;
            rowData["Amount"] = Amount;
            rowData["Remarks"] = Remarks;
            rowData["BasicRate"] = BasicRate;
            rowData["ExtraCharges"] = ExtraCharges;
            rowData["ItemDesp"] = ItemName;
            rowData["LogicalStock"] = 0;
            rowData["IsNewRow"] = 'Y';
            rowData["ItemParameterValueMasterSizeCode"] = SizeCode;
            rowData["ItemParameterValueMasterTHKCode"] = ThicknessCode;
            rowData["ItemParameterValueMasterLength"] = 0;
            rowData["DeliveryLocation"] = DeliveryLocation_Code == undefined || DeliveryLocation_Code == "" ? 0 : DeliveryLocation_Code;;
            rowData["GSTInOrder"] = '';
            rowData["QtyPC"] = QtyPC;
            rowData["RateUnit"] = RateUnit;
            rowData["OtherCharges"] = OtherCharges;
            rowData["OtherChargesLV1Old"] = Discount == undefined || Discount == "" ? 0 : Discount;
            rowData["OtherChargesLV1New"] = 0;
            rowData["OtherChargesLV2Old"] = 0;
            rowData["OtherChargesLV2New"] = 0;
            rowData["QtyMR"] = QtyMTR;
            rowData["SizeDesp"] = SizeDesp;
            rowData["ItemSizeMasterCode"] = ItemSizeMaster_code;
            rowData["DeliveryDate"] = DeliveryDate != '' ? convertDateFormatForDeliveryDate(DeliveryDate) : new Date().toISOString().split("T")[0];
            rowData["ZoneMasterCode"] = 0;
            rowData["ZoneName"] = ZonePriceListCode == undefined || ZonePriceListCode == null ? '' : ZonePriceListCode;
            rowData["DealerMaster_Code"] = DealerCode == undefined || DealerCode == "" ? 0 : DealerCode;
            rowData["Tolerance"] = Tolerance == undefined || Tolerance == "" ? 0 : Tolerance;
            rowData["DiscountType"] = DiscountType;
            rowData["AccountMaster_Code_Consignee"] = Consignee_Code == undefined || Consignee_Code == "" ? 0 : Consignee_Code;
            rowData["Discount_AfterRate"] = Discount_AfterRate == undefined || Discount_AfterRate == "" ? 0 : Discount_AfterRate;
            rowData["DiscountType_AfterRate"] = DiscountType_AfterRate;
            rowData["DiscountLV1UpdatedBy"] = 0;
            rowData["DiscountLV2UpdatedBy"] = 0;
            rowData["DiscountLV1UpdatedOn"] = new Date().toISOString().split("T")[0];
            rowData["DiscountLV2UpdatedOn"] = new Date().toISOString().split("T")[0];
            rowData["QtyBags"] = QtyBags;
            

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

    VisitOrderEntryService.SaveVisit(allTablesData, OverduePasswordCode, OverduePasswordRemark).then(function (response) {

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
function BindSelectList(element, list, bFirstOptionZero,selectedVal) {
    if (bFirstOptionZero) {
        var option = '<option value="0"></option>';
    } else {
        var option = '';
    }
    
    $.each(list, function (key, val) {
        if (selectedVal == val.Desp) {
            option += '<option value="' + val.Code + '" selected>' + val.Desp + '</option>';
        } else {
            option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
        }
       
    });
    element.innerHTML = option;
}
function GetCRMFixedParameterConfig() {

    VisitOrderEntryService.GetCRMOrderEntryConfig().then(function (response) {

        if (response.length > 0) {

            sessionStorage.setItem('CRMOrderEntryConfig', JSON.stringify(response[0]));
            VisitOrderEntryService.GetFixedParameterQtyConfig().then(function (response) {
                if (response.length > 0) {
                    sessionStorage.setItem('QtyConfig', JSON.stringify(response[0]));
                    VisitOrderEntryService.GetFixedparameterMarketing().then(function (response) {

                        if (response.length > 0) {

                            sessionStorage.setItem('FixedParameterMarketing', JSON.stringify(response[0]));
                            GetNestedDealerList();
                            GetFixedParameter();
                        }
                    });
                    

                }
            });

            let CRM_Config1 = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
            let ShowDashboard = "Y";
            ShowDashboard = CRM_Config1.ShowDashboard;
            if (ShowDashboard == "Y") {
                $('#divSecDashboard').show();
            } else {
                $('#divSecDashboard').hide();
            }

        }
    });
}

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
   
}
function GetAccountMasterDetails() {


    /*var AccountDesp = $('#txtDealer').val();*/
    var AccountDesp = $('#ddlCustomerName option:selected').text();


    if (AccountDesp == "") {
        //toastr.error("Please Select Customer Name!")
        return false;
    }
    if (GetSelectedCustomerBillApplicable() === 'N') {
        toastr.error("Order cannot be placed for '" + AccountDesp + "'. Billing is not applicable for this Customer.");
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
    if (param_VisitMode == 'New') {
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
    } else {
        GetDealerDetailsByDealerName();
        SetBlankOrderBookingTable();
        AddFiveNewRows();
       
        SetOrderBookingTableHeaderAsPerConfig();
    }
   
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
    var FixedParaMarketing_Config = JSON.parse(sessionStorage.getItem('FixedParameterMarketing'));
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader = Qty_Config.QtyMT;

    var DistributorDealerApplicableInOrder = CRM_Config.ShowDealerColumn;
    var SizeApplicableInOrder = CRM_Config.ShowSizeThicknessColumns;
    var BuyerPOOpenMasterApplicable = FixedParaMarketing_Config.BuyerPOOpenMasterApplicable;

    //var AccountDesp = $('#txtDealer').val();
    var AccountDesp = $('#ddlCustomerName option:selected').text();
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

            const StringFilterColumn = ["Booking No", "Item Desp"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Party Name"];
            var ColumnAlignment = {};

            if (BuyerPOOpenMasterApplicable == 'Y') {
               
                 ColumnAlignment = {
                    "Booked Qty": 'right',
                    "Rate": 'right',
                    "Buyer PO Order Qty": 'right',
                    "Dispatch Qty": 'right',
                    "Cancel Qty": 'right',
                    "Bal Dispatch Qty": 'right',
                    "Bal Order Qty": 'right'
                };
                
            } else {
                
                 ColumnAlignment = {
                    "BalQtyPC": 'right',
                    "BookedQtyPc": 'right',
                     "DispatchQtyPC": 'right',
                     "CancelQtyPC": 'right',
                     "BalQtyMTRS": 'right',
                     "BookedQtyMTRS": 'right',
                     "CancelQtyMTRS": 'right',
                     "DispatchQtyMTRS": 'right',
                     "BalQtyMT": 'right',
                     "BookedQtyMT": 'right',
                     "DispatchQtyMT": 'right',
                     "CancelQtyMT": 'right'
                };
                if (QtyPCHeader == '') {
                    hiddenColumns.push("BalQtyPC");
                    hiddenColumns.push("BookedQtyPc");
                    hiddenColumns.push("DispatchQtyPC");
                    hiddenColumns.push("CancelQtyPC");
                    
                }
                if (QtyMTRHeader == '') {
                    hiddenColumns.push("BalQtyMTRS");
                    hiddenColumns.push("BookedQtyMTRS");
                    hiddenColumns.push("CancelQtyMTRS");
                    hiddenColumns.push("DispatchQtyMTRS");
                }
                if (QtyMTHeader == '') {
                    hiddenColumns.push("BalQtyMT");
                    hiddenColumns.push("BookedQtyMT");
                    hiddenColumns.push("DispatchQtyMT");
                    hiddenColumns.push("CancelQtyMT");
                }
                if (SizeApplicableInOrder == 'N') {
                    hiddenColumns.push("Size");
                }

                if (QtyMTRHeader !== '') {
                    response.GetPendingData = response.GetPendingData.map(item => {
                        if (item.hasOwnProperty('BookedQtyMTRS')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'BookedQtyMTRS') {
                                    reorderedItem['Booked Qty ' + QtyMTRHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });

                    response.GetPendingData = response.GetPendingData.map(item => {
                        if (item.hasOwnProperty('DispatchQtyMTRS')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'DispatchQtyMTRS') {
                                    reorderedItem['Dispatch Qty ' + QtyMTRHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });

                    response.GetPendingData = response.GetPendingData.map(item => {
                        if (item.hasOwnProperty('CancelQtyMTRS')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'CancelQtyMTRS') {
                                    reorderedItem['Cancel Qty ' + QtyMTRHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });
                    response.GetPendingData = response.GetPendingData.map(item => {
                        if (item.hasOwnProperty('BalQtyMTRS')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'BalQtyMTRS') {
                                    reorderedItem['Bal Qty ' + QtyMTRHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });
                    NumericFilterColumn.push('Booked Qty ' + QtyMTRHeader);
                    NumericFilterColumn.push('Dispatch Qty ' + QtyMTRHeader);
                    NumericFilterColumn.push('Cancel Qty ' + QtyMTRHeader);
                    NumericFilterColumn.push('Bal Qty ' + QtyMTRHeader);
                } else {
                    hiddenColumns.push("BalQtyMTRS");
                    hiddenColumns.push("BookedQtyMTRS");
                    hiddenColumns.push("CancelQtyMTRS");
                    hiddenColumns.push("DispatchQtyMTRS");
                }
                if (QtyMTHeader !== '') {
                    response.GetPendingData = response.GetPendingData.map(item => {
                        if (item.hasOwnProperty('BookedQtyMT')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'BookedQtyMT') {
                                    reorderedItem['Booked Qty ' + QtyMTHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });
                    response.GetPendingData = response.GetPendingData.map(item => {
                        if (item.hasOwnProperty('DispatchQtyMT')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'DispatchQtyMT') {
                                    reorderedItem['Dispatch Qty ' + QtyMTHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });
                    response.GetPendingData = response.GetPendingData.map(item => {
                        if (item.hasOwnProperty('CancelQtyMT')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'CancelQtyMT') {
                                    reorderedItem['Cancel Qty ' + QtyMTHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });
                    response.GetPendingData = response.GetPendingData.map(item => {
                        if (item.hasOwnProperty('BalQtyMT')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'BalQtyMT') {
                                    reorderedItem['Bal Qty ' + QtyMTHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });
                    NumericFilterColumn.push(QtyMTHeader);
                } else {
                    hiddenColumns.push("BookedQtyMT");
                    hiddenColumns.push("BalQtyMT");
                    hiddenColumns.push("CancelQtyMT");
                    hiddenColumns.push("DispatchQtyMT");
                }
                if (QtyPCHeader !== '') {
                    response.GetPendingData = response.GetPendingData.map(item => {
                        if (item.hasOwnProperty('BalQtyPC')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'BalQtyPC') {
                                    reorderedItem['Bal Qty ' + QtyPCHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });
                    response.GetPendingData = response.GetPendingData.map(item => {
                        if (item.hasOwnProperty('BookedQtyPc')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'BookedQtyPc') {
                                    reorderedItem['Booked Qty ' + QtyPCHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });
                    response.GetPendingData = response.GetPendingData.map(item => {
                        if (item.hasOwnProperty('DispatchQtyPC')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'DispatchQtyPC') {
                                    reorderedItem['Dispatch Qty ' + QtyPCHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });
                    response.GetPendingData = response.GetPendingData.map(item => {
                        if (item.hasOwnProperty('CancelQtyPC')) {
                            const reorderedItem = {};
                            for (const key in item) {
                                if (key === 'CancelQtyPC') {
                                    reorderedItem['Cancel Qty ' + QtyPCHeader] = item[key];
                                } else {
                                    reorderedItem[key] = item[key];
                                }
                            }
                            return reorderedItem;
                        }
                        return item;
                    });
                    NumericFilterColumn.push(QtyPCHeader);
                } else {
                    hiddenColumns.push("BalQtyPC");
                    hiddenColumns.push("BookedQtyPc");
                    hiddenColumns.push("DispatchQtyPC");
                    hiddenColumns.push("CancelQtyPC");
                }
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
    //var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
    var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ') select option:selected').text();

    if (ItemName == '') {
        return false;
    }
    
    var ItemMasterCode = 0;
    var array = $('#listItem')[0];
    var arrValue;
    var Valid = false;

    var arrayList_ItemSize = [];

    var ParameterCode = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ') select option:selected').val();

    //$('#listItem option').each(function () {
    //    if ($(this).val() === ItemName) {
    //        // Get the code (data-code attribute)
    //        var selectedCode = $(this).data('code');

    //        ParameterCode = selectedCode;
    //    }
    //});
    //$('#txtItemMasterCode' + RowNo).val(ParameterCode);

    VisitOrderEntryService.GetSizeParameterAsPerChart(ItemName).then(function (response) {
        if (response.length > 0) {
          
            response = response.map((item) => ({
                key: item.ItemParameterValueMaster_Code_Size, value: item.SizeDesp
            }));
            arrayList_ItemSize = response;

            BindSelect2FromDataList($('#ddlItemSize' + RowNo), arrayList_ItemSize, "FirstItemZero", "100%");
        }

    });

    

    //for (var i = 0; i < array.options.length; i++) {
    //    arrValue = htmlDecode(array.options[i].innerHTML);

    //    if (arrValue.trim().toUpperCase().replace("\u0026", "&") == ItemName.trim().toUpperCase().replace("&amp;", "&")) {
    //        Valid = true;
    //    }
    //}
    //if (Valid == false) {
    //    toastr.error("Invalid Item Name!");
    //    $(x).val('');
    //    return false;
    //} else {
    //    VisitOrderEntryService.GetSizeParameterAsPerChart(ItemName).then(function (response) {
    //        if (response.length > 0) {
    //            $('#listItemSize_' + RowNo + ' option').empty();
    //            var option = '';
    //            for (var i = 0; i < response.length; i++) {

    //                option += '<option data-code="' + response[i].ItemParameterValueMaster_Code_Size + '">' + response[i].SizeDesp + '</option>'
    //            }
    //            $('#listItemSize_' + RowNo)[0].innerHTML = option;

    //        }

    //    });
    //}

}
function GetItemThicknessList(x, RowNo) {
    var ObjCurrRow = $(x).closest('tr');
    //var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
    var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ') select option:selected').text();
    /* var Size = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Size + ')')[0].getElementsByTagName('input')[0].value;*/
    var Size = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Size + ') select option:selected').text();

    var ItemMasterCode = 0;
    var array = $('#listItemSize_' + RowNo)[0];
    var arrValue;
    var Valid = false;
    var arrayList_ItemThickness = [];

    if (ItemName !== '' && Size!==''){
   
        VisitOrderEntryService.GetThkParameterAsPerChart(ItemName, Size).then(function (response) {
            if (response.length > 0) {
                
                response = response.map((item) => ({
                    key: item.ItemParameterValueMaster_Code_THK, value: item.ThkDesp
                }));
                arrayList_ItemThickness = response;

                BindSelect2FromDataList($('#ddlItemThickness' + RowNo), arrayList_ItemThickness, "FirstItemZero", "100%");
            }

        }); 
    }

    //for (var i = 0; i < array.options.length; i++) {
    //    arrValue = htmlDecode(array.options[i].innerHTML);

    //    if (arrValue.trim().toUpperCase().replace("\u0026", "&") == Size.trim().toUpperCase().replace("&amp;", "&")) {
    //        Valid = true;
    //    }
    //}
    //if (Valid == false) {
    //    toastr.error("Invalid Size!");
    //    $(x).val('');
    //    return false;
    //} else {
    //    VisitOrderEntryService.GetThkParameterAsPerChart(ItemName, Size).then(function (response) {
    //        if (response.length > 0) {
    //            $('#listItemThickness_' + RowNo + ' option').empty();
    //            var option = '';
    //            for (var i = 0; i < response.length; i++) {

    //                option += '<option data-code="' + response[i].ItemParameterValueMaster_Code_THK + '">' + response[i].ThkDesp + '</option>'
    //            }
    //            $('#listItemThickness_' + RowNo)[0].innerHTML = option;

    //        }

    //    });
    //}

}


function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}


function SetOrderBookingTableHeaderAsPerConfig() {
    GenerateTableHeaders();
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader_MT = Qty_Config.QtyMT;
    var Qty_Config_Unit = Qty_Config.Unit;
    var Qty_Config_RateUnit = Qty_Config.RateUnit;
    var Qty_Config_DefaultRateUnit = Qty_Config.DefaultRateUnit;
    

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

    if (Qty_Config_Unit == 'NA' || Qty_Config_Unit == 'As Per Master') {//For LOf India hide UOM
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.UOM + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.UOM + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.UOM + 1) + ")").css('display', 'none');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.UOM + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.UOM + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.UOM + 1) + ")").css('display', '');
    }

    if (Qty_Config_Unit == 'As Per Master' && ShowExtraColumnOrderQtyAndUnit == 'Y') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyMT + 1) + ")").text('Item Qty');
    }

    if (Qty_Config_Unit == 'As Per Master') {
        
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyBags + 1) + ")").text('QTY CRATE');
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyBags + 1) + ")").css('display', '');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderQtyBags + 1) + ")").css('display', '');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.OrderQtyBags + 1) + ")").css('display', '');
    } else {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyBags + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderQtyBags + 1) + ")").css('display', 'none');
        $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.OrderQtyBags + 1) + ")").css('display', 'none');
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
   
    if (ShowStock == 'N' || ShowStock == '') {
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
    if (Qty_Config_Unit == 'As Per Master') {
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

    if (param_VisitMode !== 'Edit') {

  
    
    //$("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Amount + 1) + ")").css('display', 'none');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Delete + 1) + ")").css('display', 'none');
    
    // Hide Columns
    
    
    
    
    //$("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Amount + 1) + ")").css('display', 'none');
    $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Delete + 1) + ")").css('display', 'none');
    
   

    // Hide Footer Columns

    
    //$("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Amount + 1) + ")").css('display', 'none');
    $("#tblorderbooking tfoot tr:first-child td:nth-child(" + (Indx_TblOrder.Delete + 1) + ")").css('display', 'none');
   
    }
    if (param_VisitMode == 'View') {
        $('select').prop('disabled', true);
    }

    //$("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.ItemName + 1) + ")").css('width', '100px');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.ItemName + 1) + ")").css('width', '200px');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyMT + 1) + ")").css('width', '70px');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.RateUnit + 1) + ")").css('width', '60px');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.BasicRate + 1) + ")").css('width', '70px');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Amount + 1) + ")").css('width', '75px');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DiscountType + 1) + ")").css('width', '60px');
    //$("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Remarks + 1) + ")").css('width', '1000px');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Remarks + 1) + ")").css('width', '200px');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Stock + 1) + ")").css('width', '6%');

    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DealerName + 1) + ")").css('width', '13rem');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyBags + 1) + ")").css('width', '70px');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyMTR + 1) + ")").css('width', '70px');

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
    var Qty_Config_Unit = Qty_Config.Unit;

    if (ShowTolerance == 'Y') {
        $('#txtTolerance' + rowNo).val(ToleranceValue);
    }

    if (param_VisitMode == 'New') {
        $('#txtRateUnit' + rowNo).val(DefaultRateUnit);
    }
    

    var ItemMasterTable = JSON.parse(sessionStorage.getItem('ItemMasterTable'));

    //var ItemName = $('#txtItemName' + rowNo).val();
    var ItemName = $('#ddlItemName' + rowNo + ' option:selected').text();


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
       
        //option += '<option text="' + arr.UOM + '">' + arr.UOM + '</option>'

    }
    var arrayList_UOM = [];
    var response = ItemMasterTable.map((item) => ({
        key: item.UOM, value: item.UOM
    }));
    let uniqueById = [];
    let ids = new Set();

    response.forEach(item => {
        if (!ids.has(item.key.trim().toUpperCase())) {
            ids.add(item.key.trim().toUpperCase());
            uniqueById.push(item);
        }
    });
    arrayList_UOM = uniqueById;

   // $('#listUOM_' + rowNo + ' option').empty();
    // $('#listUOM_' + rowNo)[0].innerHTML = option;
    BindSelect2FromDataList($('#ddlUOM' + rowNo), arrayList_UOM, "FirstItemSelected", "100%");
    //BizSolHelperFunction.SelectOptionByText('ddlUOM', ItemUOM);

    if (ItemUOM != '') {
       // $('#txtUOM' + rowNo).val(ItemUOM);
        $('#UOMDecimalUnit_' + rowNo).val(UOMDecimalUnit);
        if (Qty_Config_Unit.trim().toUpperCase() == 'As Per Master'.trim().toUpperCase()) {
            BizSolHelperFunction.SelectOptionByText('ddlUOM' + rowNo, ItemUOM);
        }
    }

   


}


function GetFreightList() {

    VisitOrderEntryService.GetFreightList().then(function (response) {

        if (response.length > 0) {
            var arrayList_Freight = [];
            response = response.map((item) => ({
                key: item.Code, value: item.Field
            }));
            arrayList_Freight = response;

            BindSelect2FromDataList($('#ddlFreight'), arrayList_Freight, "FirstItemSelected", "100%")

            if (param_VisitMode == 'New') {
                BizSolHelperFunction.SelectOptionByText('ddlFreight', "Ex-Works");
            }
        }

       
    });

}
function GetFreightTypeList() {

    VisitOrderEntryService.GetFreightTypeList().then(function (response) {
        var defaultValue = '';
        if (response.length > 0) {
            
            var arrayList_FreightType = [];
            response = response.map((item) => ({
                key: item.Code, value: item.Field
            }));
            arrayList_FreightType = response;

            BindSelect2FromDataList($('#ddlFreightType'), arrayList_FreightType,"FirstItemZero","100%")

        }
        //if (param_VisitMode == 'New') {
        //    $('#txtFreightType').val(defaultValue);
        //}


    });

}
function GetPaymentTerms() {

    VisitOrderEntryService.GetPaymentTermsMasterList().then(function (response) {
        //var defaultValue = '';
        //var defaultCode = 0;
        if (response.length > 0) {
            
            var arrayList_PaymentTerms = [];
            response = response.map((item) => ({
                key: item.Code, value: item.Desp
            }));
            arrayList_PaymentTerms = response;

            BindSelect2FromDataList($('#ddlPaymentTerms'), arrayList_PaymentTerms, "FirstItemSelected", "100%")
        }
        //if (param_VisitMode == 'New') {
        //    $('#txtPaymentTerms').val(defaultValue);
        //    $('#hiddentxtPaymentTerm').val(defaultCode);
        //}
    });

}
function GetAccountDeliveryLocationDetails(x,RowNo) {
    var ObjCurrRow = $(x).closest('tr');
    var AccountDesp = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Consignee + ')')[0].getElementsByTagName('input')[0].value;

    ObjCurrRow.find('td:eq(' + Indx_TblOrder.DeliveryAddress + ')')[0].getElementsByTagName('input')[0].value = '';
    //var AccountDesp = $("#txtDealer").val();

    let CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    let ShowConsignee = 'N'
    ShowConsignee = CRM_Config.ShowConsignee;

    if (ShowConsignee == 'N') {
        AccountDesp = $('#ddlCustomerName option:selected').text();
    }

    AccountDesp = normalizeText(AccountDesp);



    if (AccountDesp == "") {
        return;
    }
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

            if (response.length == 1) {
                $('#txtDeliveryAddress' + RowNo).val(response[0].AddressCode);
                $('#hdnAddressCode' + RowNo).val(response[0].Select);
            }
        }

    });
}
//function GetEditVisitDetails() {

//    SetOrderBookingTableHeaderAsPerConfig();
//    VisitOrderEntryService.GetEditVisitDetails(param_RoutePlanCode, param_VisitMaster_Code).then(function (response) {

//        if (response.VisitORroutePlanMaster.length > 0) {


//            $('#txtUserName').val(response.VisitORroutePlanMaster[0].PlanUserName);
//            $('#txtdate').val(response.VisitORroutePlanMaster[0].Date);
//            if (response.VisitORroutePlanMaster[0].OrderEntryType == 'V') {
//                $('#txtDealer').val(response.VisitORroutePlanMaster[0].OrderDealerName);
//            } else {
//                //$('#ddlCustomerName option').filter(function () {
//                //    return $(this).text() === response.VisitORroutePlanMaster[0].OrderDealerName;
//                //}).prop('selected', true);
//                //$('#ddlCustomerName').trigger('change');
//                BizSolHelperFunction.SelectOptionByText('ddlCustomerName', response.VisitORroutePlanMaster[0].OrderDealerName);
//            }

//            $('#txtCheckInTime').val(response.VisitORroutePlanMaster[0].CheckIn);
//            $('#txtRemarks').val(response.VisitORroutePlanMaster[0].Remarks);
//            $('#txtAddLocation').val(response.VisitORroutePlanMaster[0].Location);
//            $('#txtNextVistDate').val(response.VisitORroutePlanMaster[0].NextVisitDate);
//            /*$('#txtFreightType').val(response.VisitORroutePlanMaster[0].FreightType);*/
//            BizSolHelperFunction.SelectOptionByText('ddlFreightType', response.VisitORroutePlanMaster[0].FreightType);
//            $('#txtCurrentLocation').val(response.VisitORroutePlanMaster[0].CheckInLocation);
//            $('#txtDeliveryDays').val(response.VisitORroutePlanMaster[0].DeliveryDaysForOrder);
//            $('#hfFileInput').val(response.VisitORroutePlanMaster[0].PanelOneAttachment);
//            $('#txtCreditDaysForDC').val(response.VisitORroutePlanMaster[0].CreditDays);
//            //$('#txtlistFreight').val(response.VisitORroutePlanMaster[0].Freight);

//            BizSolHelperFunction.SelectOptionByText('ddlFreight', response.VisitORroutePlanMaster[0].Freight);
//            //$('#txtZone').val(response.VisitORroutePlanMaster[0].ZoneName);
//            $('#hfVisitType').val(response.VisitORroutePlanMaster[0].VisitType);
//            //$('#txtPaymentTerms').val(response.VisitORroutePlanMaster[0].PaymentTerm);
//            BizSolHelperFunction.SelectOptionByText('ddlPaymentTerms', response.VisitORroutePlanMaster[0].PaymentTerm);

//            //$('#hiddentxtPaymentTerm').val(response.VisitORroutePlanMaster[0].PaymentTermsMaster_Code);
//            $('#txtBuyerPONo').val(response.VisitORroutePlanMaster[0].BuyerPONo);




//        }
//        if (response.VisitOrderDetails.length > 0) {
//            PopulateOrderBookingTable(response.VisitOrderDetails);
//            $('#toggleSwitch').prop("disabled", true);
//        }

//        GetDealerDetailsByDealerName();
//        GetMaxBasicRate();
//        calFinalAmt();
//        SetImageControl();
//        var VisitType = $('#hfVisitType').val();
//        if (VisitType != '' && VisitType != undefined && VisitType != null && VisitType == 'New Acquisition') {
//            $('#divOrderBooking').prop('hidden', true);
//        } else {
//            $('#divOrderBooking').prop('hidden', false);
//        }


//    });



//    //GetDealerDetailsByDealerName();



//}



function PopulateOrderBookingTable(data) {
    //var tbody = $('#tblorderbooking tbody');
    var tbody = $('#tblorderbooking tbody')[0]
    var OtherCharges = 0;
    console.log(data);
    var ShowToggleSize = false;

    // Clear any existing rows
    //tbody.empty();
    //tbody.remove();
    tbody.innerHTML = ''; 
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





        var td_DeliveryAddress = `<div class="row"><div class="col-md-7"><datalist id="listDeliveryLocation${tbItemConsumeRowNo}"></datalist><input type="text" id="txtDeliveryAddress` + tbItemConsumeRowNo + `" list="listDeliveryLocation` + tbItemConsumeRowNo + `" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryAddress" placeholder="" onclick="$(this).val(\'\')" autocomplete="off" value="${item.DeliveryAddressCode}"  required onchange="GetDeliveryAddressCode(this,` + tbItemConsumeRowNo + `);"></div><div class="col-md-3"><button type="button" id="btnSelectDeliveryAdd" onclick="GetAccountDeliveryLocationDetails(this,` + tbItemConsumeRowNo + `);ShowDeliveryAddressModal(` + tbItemConsumeRowNo + `);" class="btn btn-primary btn-height" title="Select Address"> <i class="fa fa-search"></i></button></div></div><input type="hidden" id="hdnAddressCode` + tbItemConsumeRowNo + `" name="hdnAddressCode" value="${item.DeliveryLocation_Code}"> `;

        //var td_DeliveryAddress = `<input type="text" id="txtDeliveryAddress` + tbItemConsumeRowNo + `" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryAddress" placeholder="" onclick="$(this).val(\'\')" autocomplete="off" value="${item.DeliveryAddressCode}"  required><input type="hidden" id="hdnAddressCode` + tbItemConsumeRowNo + `" name="hdnAddressCode" value="${item.DeliveryLocation_Code}">`;
        //var td_ItemName = `<input type="text"  id="txtItemName` + tbItemConsumeRowNo + `" value="${item.ItemName}" onkeypress = "BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name = "txtItemName" placeholder = "" list = "listItem" autocomplete = "off" onclick = "$(this).val(\'\')"  onchange = "GetItemSizeList(this,` + tbItemConsumeRowNo + `);GetLatestPriceListByItemName(this,` + tbItemConsumeRowNo + `);" required >`;
        //var td_Size = `<datalist id = "listItemSize_` + tbItemConsumeRowNo + `" ></datalist > <input type="text" id="txtSize` + tbItemConsumeRowNo + `"  value="${item.Size}" title="${item.Size}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm digit8" name="txtSize" placeholder="" list="listItemSize_` + tbItemConsumeRowNo + `" autocomplete="off" onclick="$(this).val(\'\')" onchange="GetItemThicknessList(this,` + tbItemConsumeRowNo + `)" required disabled><input type="hidden" id="hdnSizeMasterCode` + tbItemConsumeRowNo + `" name="hdnSizeMasterCode"  value="${item.ItemParameterValueMasterSizeCode}">`;
        //var td_Thickness = `<datalist id="listItemThickness_` + tbItemConsumeRowNo + `"></datalist><input type="text"  id="txtThickness` + tbItemConsumeRowNo + `"  value="${item.ThickNess}" title="${item.ThickNess}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtThickness" placeholder="" list="listItemThickness_` + tbItemConsumeRowNo + `" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required disabled><input type="hidden" id="hdnThkMasterCode` + tbItemConsumeRowNo + `" name="hdnThkMasterCode"  value="${item.ItemParameterValueMasterTHKCode}">`;
        //var td_SizeDesp = `<div class="sizeDes"><input type="text"  id="txtSizeDesp` + tbItemConsumeRowNo + `" onkeypress="BizSolhandleEnterKey(event);"  value="${item.SizeDesp}" title="${item.SizeDesp}"  class="BizSolFormControl box_border form-control form-control-sm sizeDesInput" name="txtSizeDesp" placeholder="" list="listItemSizeMaster" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required disabled><input type="hidden" id="hdnItemSizeMasterCode` + tbItemConsumeRowNo + `" name="hdnItemSizeMasterCode"  value="${item.ItemSizeMaster_Code}"></div>`;
        //var td_UOM = `<datalist id="listUOM_` + tbItemConsumeRowNo + `"></datalist><input type="text"  id="txtUOM` + tbItemConsumeRowNo + `"  value="${item.UOM}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name="txtUOM" placeholder="" list="listUOM_` + tbItemConsumeRowNo + `" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;

        var td_ItemName = '<select id="ddlItemName' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlItemName"  autocomplete="off" onchange="OnChange_ddlItemName(this,' + tbItemConsumeRowNo + ');" ></select>';
        var td_Size = '<select id="ddlItemSize' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlItemSize"  autocomplete="off" onchange="OnChange_ddlItemSize(this,' + tbItemConsumeRowNo + ');" ></select>';
        var td_Thickness = '<select id="ddlItemThickness' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlItemThickness"  autocomplete="off" onchange="OnChange_ddlItemThickness(this,' + tbItemConsumeRowNo + ');" ></select>';
        var td_SizeDesp = '<div class="sizeDes"><select id="ddlItemSizeMaster' + tbItemConsumeRowNo + '" class="BizSolFormControl form-control form-control-sm box_border sizeDesInput" name="ddlItemSizeMaster"  autocomplete="off"  onchange="OnChange_ddlItemSizeMaster(this,' + tbItemConsumeRowNo + ');"></select><button type="button" id="btnShowSizeControl_' + tbItemConsumeRowNo + '" class="btn btn-primary btn-height" title="New Size" onclick="ShowSizeControl(this,' + tbItemConsumeRowNo + ');"> <i class="fa fa-plus-square"></i></button></div>';
        var td_UOM = '<select id="ddlUOM' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlUOM"  autocomplete="off" ></select>';

        var td_Stock = `<input type="text"  id="txtStock` + tbItemConsumeRowNo + `" onkeypress="BizSolhandleEnterKey(event);"  value=""  class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtStock" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" style="min-width: 70px;" onchange="" required>`;
        var td_OrderQtyBags = `<input type="number"  id="txtOrderQtyBags` + tbItemConsumeRowNo + `" onkeypress="BizSolhandleEnterKey(event);"  value="${item.QtyBags}"  class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderQtyBags" placeholder=""  autocomplete="off"  onchange="SetMTRByPacking(this,${tbItemConsumeRowNo});CalculateAmount(this);" required>`;
        var td_OrderQtyPC = `<input type="number"  id="txtOrderQtyPC` + tbItemConsumeRowNo + `" onkeypress="BizSolhandleEnterKey(event);"  value="${item.QtyPC}"  class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderQtyPC" placeholder=""  autocomplete="off"   onchange="" required>`;
        var td_OrderQtyMT = `<input type = "number"  id = "txtOrderQtyMT` + tbItemConsumeRowNo + `"  value="${item.OrderQty}"  onkeypress = "BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name = "txtOrderQtyMT" placeholder = ""  autocomplete = "off"   onchange = "CalculateAmount(this);" required >`;
        var td_OrderQtyMTR = `<input type="number"  id="txtOrderQtyMTR` + tbItemConsumeRowNo + `"  value="${item.QtyMR}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderQtyMTR" placeholder=""  autocomplete="off"   onchange="CalculateAmount(this);" required>`;
        var td_RateUnit = `<input type="text" list="listRateUnit"  id="txtRateUnit` + tbItemConsumeRowNo + `"  value="${item.RateUnit}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtRateUnit" placeholder="" onclick="$(this).val(\'\')" autocomplete="off" onchange="CalculateAmount(this);OnChange_RateUnit(this,` + tbItemConsumeRowNo + `);"    required>`;
       
        var td_OrderUOM = `<input type="text"  id="txtOrderUOM` + tbItemConsumeRowNo + `"  value="${item.RateUnit}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name="txtOrderUOM" placeholder="" list="listUOM" autocomplete="off" onclick="$(this).val(\'\')"  onchange="CalculateAmount(this);" required>`;
        var td_OrderQTY = `<input type="number"  id="txtOrderQTY` + tbItemConsumeRowNo + `"  value="${item.OrderQty}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderQTY" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_Tolerance = `<input type="number"  id="txtTolerance` + tbItemConsumeRowNo + `" value="${item.Tolerance}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtTolerance" placeholder=""  autocomplete="off"   required>`;

        var td_BasicRate = `<input type="number"  id="txtBasicRate` + tbItemConsumeRowNo + `"  value="${item.BasicRate}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtBasicRate" placeholder=""  autocomplete="off"   onchange="CalculateAmount(this);GetMaxBasicRate();calFinalAmt();" required>`;
        var td_ExtraCharges = `<input type="number"  id="txtExtraCharges` + tbItemConsumeRowNo + `"  value="${item.ExtraCharges}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtExtraCharges" placeholder=""  autocomplete="off" required>`;
        var td_DiscountType = `<select  id="txtDiscountType` + tbItemConsumeRowNo + `" value="${item.DiscountType}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm btn-width"  name="txtDiscountType" placeholder=""   onchange="CalculateAmount(this);" style="max-width: 60px;" required> <option ${item.DiscountType == "Per Unit" ? 'selected' : ''} >Per Unit</option><option ${item.DiscountType == "%" ? 'selected' : '' }>%</option ></select>`;
        //var td_DiscountType = `<input type="text"  id="txtDiscountType` + tbItemConsumeRowNo + `" value="${item.DiscountType}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType" placeholder="" list="listDiscountType" autocomplete="off" onclick="$(this).val(\'\')"  onchange="CalculateAmount(this);" required>`;

        var td_Discount = `<input type="number"  id="txtDiscount` + tbItemConsumeRowNo + `" value="${item.Discount}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount" placeholder=""  autocomplete="off"  onchange="CalculateAmount(this);"  required>`;


        var td_OrderRate = `<input type="number"  id="txtOrderRate` + tbItemConsumeRowNo + `"  value="${item.Rate}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderRate" placeholder=""autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
      

        var td_DiscountType_AfterRate = `<input type="text"  id="txtDiscountType_AfterRate` + tbItemConsumeRowNo + `" value="${item.DiscountType_AfterRate}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType_AfterRate" placeholder="" list="listDiscountType" autocomplete="off" onclick="$(this).val(\'\')"  onchange="CalculateAmount(this);" required>`;
        var td_Discount_AfterRate = `<input type="number"  id="txtDiscount_AfterRate` + tbItemConsumeRowNo + `" value="${item.Discount_AfterRate}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount_AfterRate" placeholder=""  autocomplete="off"  onchange="CalculateAmount(this);"  required>`;

        var td_Amount = `<input type="number"  id="txtAmount` + tbItemConsumeRowNo + `"  value="${item.Amount}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end digit10" disabled name="txtAmount" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_DeliveryDate = `<input type="date"  id="txtDeliveryDate` + tbItemConsumeRowNo + `"  value="${formattedDate}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryDate" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        //var td_ZonePriceListCode = `<input type="text"  id="ZonePriceListCode` + tbItemConsumeRowNo + `" value="${item.ZoneName}" onkeypress = "BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name = "ZonePriceListCode" placeholder = "" list = "listZone" autocomplete = "off" onclick = "$(this).val(\'\')"  onchange = "" required >`;
        var td_ZonePriceListCode = '<select id="ddlZonePriceList' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ZonePriceList"  autocomplete="off" ></select>';
        var td_Remarks = `<input type="text"  id="txtRemarks` + tbItemConsumeRowNo + `"  value="${item.Remarks}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtRemarks" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required  maxlength="200">`;
        var td_Delete = `<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light " title="Delete" onclick="DeleteOrderItem(this,` + tbItemConsumeRowNo + `);"><i class="fa fa-times" aria-hidden="true"></i></a>`;
        var td_DealerName = `<input type="hidden" id="hdnDistributorDealerCode` + tbItemConsumeRowNo + `" name="hdnDistributorDealerCode" value="${item.DealerMaster_Code}"><input type="text"  id="txtDealerNameList` + tbItemConsumeRowNo + `" value="${item.DealerName}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDealerNameList" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" disabled  required>`;

        var td_VisitDetailsCode = `<input type="text"  id="txtVisitDetailsCode` + tbItemConsumeRowNo + `"  value="${item.Code}"   name="txtVisitDetailsCode" placeholder="" value=0  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_IsNewRow = `<input type="text"  id="txtIsNewRow` + tbItemConsumeRowNo + `"  value="${item.IsNewRow}"   name="txtIsNewRow" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_SizeApplicable = `<input type="text"  id="txtSizeApplicable` + tbItemConsumeRowNo + `"  value="N"   name="txtSizeApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
        var td_ThkApplicable = `<input type="text" id="txtThkApplicable` + tbItemConsumeRowNo + `"  value="N" name="txtThkApplicable" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" onchange="" required>`;
        var td_LenApplicable = `<input type="text" id="txtLenApplicable` + tbItemConsumeRowNo + `"  value="N"  name="txtLenApplicable" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" onchange="" required>`;
        var td_ItemMasterCode = `<input type="text" id="txtItemMasterCode` + tbItemConsumeRowNo + `"  value="${item.ItemMaster_code}"  name="txtItemMasterCode" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" onchange="" required>`;
        var td_UOMDecimalUnit = `<input type="text" id="txtUOMDecimalUnit` + tbItemConsumeRowNo + `" name="UOMDecimalUnit" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" onchange="" required>`;

        var row = tbody.insertRow(index);

        var cells = [];
        for (let i = 0; i < TblOrderColumns.length; i++) {
            cells.push(row.insertCell(i));
        }

        var Consignee = cells[Indx_TblOrder.Consignee];
        var DeliveryAddress = cells[Indx_TblOrder.DeliveryAddress];
        var ItemName = cells[Indx_TblOrder.ItemName];
        var Size = cells[Indx_TblOrder.Size];
        var Thickness = cells[Indx_TblOrder.Thickness];
        var SizeDesp = cells[Indx_TblOrder.SizeDesp];
        var UOM = cells[Indx_TblOrder.UOM];
        var Stock = cells[Indx_TblOrder.Stock];
        var OrderQtyBags = cells[Indx_TblOrder.OrderQtyBags];
        var OrderQtyPC = cells[Indx_TblOrder.OrderQtyPC];
        var OrderQtyMT = cells[Indx_TblOrder.OrderQtyMT];
        var OrderQtyMTR = cells[Indx_TblOrder.OrderQtyMTR];
        var RateUnit = cells[Indx_TblOrder.RateUnit];
        var OrderUOM = cells[Indx_TblOrder.OrderUOM];
        var OrderQTY = cells[Indx_TblOrder.OrderQTY];
        var Tolerance = cells[Indx_TblOrder.Tolerance];
        var BasicRate = cells[Indx_TblOrder.BasicRate];
        var ExtraCharges = cells[Indx_TblOrder.ExtraCharges];
        var DiscountType = cells[Indx_TblOrder.DiscountType];
        var Discount = cells[Indx_TblOrder.Discount];
        var OrderRate = cells[Indx_TblOrder.OrderRate];

        var DiscountType_AfterRate = cells[Indx_TblOrder.DiscountType_AfterRate];
        var Discount_AfterRate = cells[Indx_TblOrder.Discount_AfterRate];
        var Amount = cells[Indx_TblOrder.Amount];
        var DeliveryDate = cells[Indx_TblOrder.DeliveryDate];
        var ZonePriceListCode = cells[Indx_TblOrder.ZonePriceListCode];
        var DealerNameList = cells[Indx_TblOrder.DealerName];
        var Remarks = cells[Indx_TblOrder.Remarks];
        var Delete = cells[Indx_TblOrder.Delete];

        var VisitDetailsCode = cells[Indx_TblOrder.VisitDetailsCode];
        var IsNewRow = cells[Indx_TblOrder.IsNewRow];
        var SizeApplicable = cells[Indx_TblOrder.SizeApplicable];
        var ThkApplicable = cells[Indx_TblOrder.ThkApplicable];
        var LenApplicable = cells[Indx_TblOrder.LenApplicable];
        var ItemMasterCode = cells[Indx_TblOrder.ItemMasterCode];
        var UOMDecimalUnit = cells[Indx_TblOrder.UOMDecimalUnit];


        VisitDetailsCode.style["display"] = "none";
        IsNewRow.style["display"] = "none";
        SizeApplicable.style["display"] = "none";
        ThkApplicable.style["display"] = "none";
        LenApplicable.style["display"] = "none";
        ItemMasterCode.style["display"] = "none";
        UOMDecimalUnit.style["display"] = "none";
        //if (DistributorDealerApplicableInOrder == 'N') {
            DealerNameList.style["display"] = "none";
        //}

        Consignee.innerHTML = td_Consignee;
        DeliveryAddress.innerHTML = td_DeliveryAddress;
        ItemName.innerHTML = td_ItemName;
        Size.innerHTML = td_Size;
        Thickness.innerHTML = td_Thickness;
        SizeDesp.innerHTML = td_SizeDesp;
        UOM.innerHTML = td_UOM;
        Stock.innerHTML = td_Stock;
        OrderQtyBags.innerHTML = td_OrderQtyBags;
        OrderQtyPC.innerHTML = td_OrderQtyPC;
        OrderQtyMT.innerHTML = td_OrderQtyMT;
        OrderQtyMTR.innerHTML = td_OrderQtyMTR;
        RateUnit.innerHTML = td_RateUnit;
        OrderUOM.innerHTML = td_OrderUOM;
        OrderQTY.innerHTML = td_OrderQTY;
        Tolerance.innerHTML = td_Tolerance;
        BasicRate.innerHTML = td_BasicRate;
        ExtraCharges.innerHTML = td_ExtraCharges;
        DiscountType.innerHTML = td_DiscountType;
        Discount.innerHTML = td_Discount;
        OrderRate.innerHTML = td_OrderRate;
        DiscountType_AfterRate.innerHTML = td_DiscountType_AfterRate;
        Discount_AfterRate.innerHTML = td_Discount_AfterRate;
        Amount.innerHTML = td_Amount;
        DeliveryDate.innerHTML = td_DeliveryDate;
        ZonePriceListCode.innerHTML = td_ZonePriceListCode;
        DealerNameList.innerHTML = td_DealerName;
        Remarks.innerHTML = td_Remarks;
        Delete.innerHTML = td_Delete;
        VisitDetailsCode.innerHTML = td_VisitDetailsCode;
        IsNewRow.innerHTML = td_IsNewRow;
        SizeApplicable.innerHTML = td_SizeApplicable;
        ThkApplicable.innerHTML = td_ThkApplicable;
        LenApplicable.innerHTML = td_LenApplicable;
        ItemMasterCode.innerHTML = td_ItemMasterCode;
        //UOMDecimalUnit.innerHTML = td_UOMDecimalUnit;

    //    var row = `
    //  <tr>
    //    <td  style="display:none">${td_Consignee}   </td>
    //    <td  style="display:none">${td_DeliveryAddress}   </td>
    //    <td>${td_ItemName}</td>
    //    <td  style="display:none">${td_Size}   </td>
    //    <td  style="display:none">${td_Thickness}   </td>
    //    <td  style="display:none">${td_SizeDesp}   </td>
    //    <td>${td_UOM} </td>
    //    <td  style="display:none">${td_Stock}   </td>
    //    <td  style="display:none">${td_OrderQtyBags}   </td>
    //    <td  style="display:none">${td_OrderQtyPC}   </td>
    //    <td>${td_OrderQtyMT}</td>
    //    <td  style="display:none">${td_OrderQtyMTR}   </td>
    //    <td>${td_RateUnit}   </td>
    //    <td  style="display:none">${td_OrderUOM}   </td>
    //    <td  style="display:none">${td_OrderQTY}   </td>
    //    <td>${td_Tolerance}   </td>
    //    <td>${td_BasicRate}   </td>
    //    <td  style="display:none">${td_ExtraCharges}   </td>
    //    <td>${td_DiscountType}   </td>
    //    <td>${td_Discount}   </td>
    //    <td  style="display:none">${td_OrderRate}   </td>

    //     <td>${td_DiscountType_AfterRate}   </td>
    //    <td>${td_Discount_AfterRate}   </td>
    //    <td>${td_Amount}   </td>
    //    <td>${td_DeliveryDate}   </td>
    //    <td>${td_ZonePriceListCode}   </td>
    //    <td>${td_DealerName}   </td>
    //    <td>${td_Remarks}   </td>
    //    <td>${td_Delete}   </td>

    //    <td  style="display:none">${td_VisitDetailsCode}   </td>
    //    <td  style="display:none">${td_IsNewRow}   </td>
    //    <td  style="display:none">${td_SizeApplicable}   </td>
    //    <td  style="display:none">${td_ThkApplicable}   </td>
    //    <td  style="display:none">${td_LenApplicable}   </td>
    //    <td  style="display:none"> ${td_ItemMasterCode}   </td>

    //  </tr>
    //`;
        // tbody.append(row);

        OtherCharges = item.OtherCharges;
        BindSelect2FromDataList($('#ddlItemName' + tbItemConsumeRowNo), arrayList_ItemMaster, "FirstItemZero", "100%");
        BindSelect2FromDataList($('#ddlZonePriceList' + tbItemConsumeRowNo), arrayList_Zone, "FirstItemZero", "100%");
        BizSolHelperFunction.SelectOptionByText('ddlItemName' + tbItemConsumeRowNo, item.ItemName);
        BizSolHelperFunction.SelectOptionByText('ddlZonePriceList' + tbItemConsumeRowNo, item.ZoneName);
        GetUOM(tbItemConsumeRowNo);
        
        if (ShowToggleSize == true) {
            FillValuesAfterStockData(tbItemConsumeRowNo, item.ItemName, item.SizeDesp, item.ThickNess,"N");
        } else {
            FillValuesAfterStockData(tbItemConsumeRowNo, item.ItemName, item.Size, item.ThickNess, "N");
        }
       // ShowStockValueByItemSizeThk('x', tbItemConsumeRowNo);
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
//function PopulateOrderBookingTable(data) {
//    var tbody = $('#tblorderbooking tbody');
//    var OtherCharges = 0;
//    console.log(data);
//    var ShowToggleSize = false;

//    // Clear any existing rows
//    tbody.empty();
//    //SetOrderBookingTableHeaderAsPerConfig();

//    // Loop through the data and append rows
//    data.forEach(function (item, index) {

//        var tbItemConsumeRowNo = index + 1;
//        var DelDate = new Date(item.DeliveryDate).toISOString().split("T")[0];
//        var date = new Date(item.DeliveryDate);  // Create a Date object for the particular date

//        // Format as yyyy-mm-dd
//        var formattedDate = date.getFullYear() + '-' +
//            ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
//            ('0' + date.getDate()).slice(-2);

//        if (item.ItemSizeMaster_Code > 0) {
//            ShowToggleSize = true;
//        }

//        var td_Consignee = `<input type="text" id="txtConsignee` + tbItemConsumeRowNo + `" class="BizSolFormControl box_border form-control form-control-sm" name="txtConsignee" placeholder="" onclick="$(this).val(\'\')" autocomplete="off"   required><input type="hidden" id="hdnConsigneeCode` + tbItemConsumeRowNo + `" value="${item.AccountMaster_Code_Consignee}" name="hdnConsigneeCode">`;





//        var td_DeliveryAddress = `<div class="row"><div class="col-md-7"><datalist id="listDeliveryLocation${tbItemConsumeRowNo}"></datalist><input type="text" id="txtDeliveryAddress` + tbItemConsumeRowNo + `" list="listDeliveryLocation` + tbItemConsumeRowNo + `" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryAddress" placeholder="" onclick="$(this).val(\'\')" autocomplete="off" value="${item.DeliveryAddressCode}"  required onchange="GetDeliveryAddressCode(this,` + tbItemConsumeRowNo + `);"></div><div class="col-md-3"><button type="button" id="btnSelectDeliveryAdd" onclick="GetAccountDeliveryLocationDetails(this,` + tbItemConsumeRowNo + `);ShowDeliveryAddressModal(` + tbItemConsumeRowNo + `);" class="btn btn-primary btn-height" title="Select Address"> <i class="fa fa-search"></i></button></div></div><input type="hidden" id="hdnAddressCode` + tbItemConsumeRowNo + `" name="hdnAddressCode" value="${item.DeliveryLocation_Code}"> `;

//        //var td_DeliveryAddress = `<input type="text" id="txtDeliveryAddress` + tbItemConsumeRowNo + `" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryAddress" placeholder="" onclick="$(this).val(\'\')" autocomplete="off" value="${item.DeliveryAddressCode}"  required><input type="hidden" id="hdnAddressCode` + tbItemConsumeRowNo + `" name="hdnAddressCode" value="${item.DeliveryLocation_Code}">`;
//        //var td_ItemName = `<input type="text"  id="txtItemName` + tbItemConsumeRowNo + `" value="${item.ItemName}" onkeypress = "BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name = "txtItemName" placeholder = "" list = "listItem" autocomplete = "off" onclick = "$(this).val(\'\')"  onchange = "GetItemSizeList(this,` + tbItemConsumeRowNo + `);GetLatestPriceListByItemName(this,` + tbItemConsumeRowNo + `);" required >`;
//        //var td_Size = `<datalist id = "listItemSize_` + tbItemConsumeRowNo + `" ></datalist > <input type="text" id="txtSize` + tbItemConsumeRowNo + `"  value="${item.Size}" title="${item.Size}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm digit8" name="txtSize" placeholder="" list="listItemSize_` + tbItemConsumeRowNo + `" autocomplete="off" onclick="$(this).val(\'\')" onchange="GetItemThicknessList(this,` + tbItemConsumeRowNo + `)" required disabled><input type="hidden" id="hdnSizeMasterCode` + tbItemConsumeRowNo + `" name="hdnSizeMasterCode"  value="${item.ItemParameterValueMasterSizeCode}">`;
//        //var td_Thickness = `<datalist id="listItemThickness_` + tbItemConsumeRowNo + `"></datalist><input type="text"  id="txtThickness` + tbItemConsumeRowNo + `"  value="${item.ThickNess}" title="${item.ThickNess}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtThickness" placeholder="" list="listItemThickness_` + tbItemConsumeRowNo + `" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required disabled><input type="hidden" id="hdnThkMasterCode` + tbItemConsumeRowNo + `" name="hdnThkMasterCode"  value="${item.ItemParameterValueMasterTHKCode}">`;
//        //var td_SizeDesp = `<div class="sizeDes"><input type="text"  id="txtSizeDesp` + tbItemConsumeRowNo + `" onkeypress="BizSolhandleEnterKey(event);"  value="${item.SizeDesp}" title="${item.SizeDesp}"  class="BizSolFormControl box_border form-control form-control-sm sizeDesInput" name="txtSizeDesp" placeholder="" list="listItemSizeMaster" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required disabled><input type="hidden" id="hdnItemSizeMasterCode` + tbItemConsumeRowNo + `" name="hdnItemSizeMasterCode"  value="${item.ItemSizeMaster_Code}"></div>`;
//        //var td_UOM = `<datalist id="listUOM_` + tbItemConsumeRowNo + `"></datalist><input type="text"  id="txtUOM` + tbItemConsumeRowNo + `"  value="${item.UOM}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name="txtUOM" placeholder="" list="listUOM_` + tbItemConsumeRowNo + `" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;

//        var td_ItemName = '<select id="ddlItemName' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlItemName"  autocomplete="off" onchange="OnChange_ddlItemName(this,' + tbItemConsumeRowNo + ');" ></select>';
//        var td_Size = '<select id="ddlItemSize' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlItemSize"  autocomplete="off" onchange="OnChange_ddlItemSize(this,' + tbItemConsumeRowNo + ');" ></select>';
//        var td_Thickness = '<select id="ddlItemThickness' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlItemThickness"  autocomplete="off" onchange="OnChange_ddlItemThickness(this,' + tbItemConsumeRowNo + ');" ></select>';
//        var td_SizeDesp = '<div class="sizeDes"><select id="ddlItemSizeMaster' + tbItemConsumeRowNo + '" class="BizSolFormControl form-control form-control-sm box_border sizeDesInput" name="ddlItemSizeMaster"  autocomplete="off"  onchange="OnChange_ddlItemSizeMaster(this,' + tbItemConsumeRowNo + ');"></select><button type="button" id="btnShowSizeControl_' + tbItemConsumeRowNo + '" class="btn btn-primary btn-height" title="New Size" onclick="ShowSizeControl(this,' + tbItemConsumeRowNo + ');"> <i class="fa fa-plus-square"></i></button></div>';
//        var td_UOM = '<select id="ddlUOM' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlUOM"  autocomplete="off" ></select>';

//        var td_Stock = `<input type="text"  id="txtStock` + tbItemConsumeRowNo + `" onkeypress="BizSolhandleEnterKey(event);"  value=""  class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtStock" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" style="min-width: 70px;" onchange="" required>`;
//        var td_OrderQtyPC = `<input type="number"  id="txtOrderQtyPC` + tbItemConsumeRowNo + `" onkeypress="BizSolhandleEnterKey(event);"  value="${item.QtyPC}"  class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderQtyPC" placeholder=""  autocomplete="off"   onchange="" required>`;
//        var td_OrderQtyMT = `<input type = "number"  id = "txtOrderQtyMT` + tbItemConsumeRowNo + `"  value="${item.OrderQty}"  onkeypress = "BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name = "txtOrderQtyMT" placeholder = ""  autocomplete = "off"   onchange = "CalculateAmount(this);" required >`;
//        var td_OrderQtyMTR = `<input type="number"  id="txtOrderQtyMTR` + tbItemConsumeRowNo + `"  value="${item.QtyMR}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderQtyMTR" placeholder=""  autocomplete="off"   onchange="CalculateAmount(this);" required>`;
//        var td_RateUnit = `<input type="text" list="listRateUnit"  id="txtRateUnit` + tbItemConsumeRowNo + `"  value="${item.RateUnit}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtRateUnit" placeholder="" onclick="$(this).val(\'\')" autocomplete="off" onchange="CalculateAmount(this);OnChange_RateUnit(this,` + tbItemConsumeRowNo + `);"    required>`;

//        var td_OrderUOM = `<input type="text"  id="txtOrderUOM` + tbItemConsumeRowNo + `"  value="${item.RateUnit}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name="txtOrderUOM" placeholder="" list="listUOM" autocomplete="off" onclick="$(this).val(\'\')"  onchange="CalculateAmount(this);" required>`;
//        var td_OrderQTY = `<input type="number"  id="txtOrderQTY` + tbItemConsumeRowNo + `"  value="${item.OrderQty}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderQTY" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
//        var td_Tolerance = `<input type="number"  id="txtTolerance` + tbItemConsumeRowNo + `" value="${item.Tolerance}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtTolerance" placeholder=""  autocomplete="off"   required>`;

//        var td_BasicRate = `<input type="number"  id="txtBasicRate` + tbItemConsumeRowNo + `"  value="${item.BasicRate}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtBasicRate" placeholder=""  autocomplete="off"   onchange="CalculateAmount(this);GetMaxBasicRate();calFinalAmt();" required>`;
//        var td_ExtraCharges = `<input type="number"  id="txtExtraCharges` + tbItemConsumeRowNo + `"  value="${item.ExtraCharges}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtExtraCharges" placeholder=""  autocomplete="off" required>`;
//        var td_DiscountType = `<select  id="txtDiscountType` + tbItemConsumeRowNo + `" value="${item.DiscountType}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm btn-width"  name="txtDiscountType" placeholder=""   onchange="CalculateAmount(this);" style="max-width: 60px;" required> <option ${item.DiscountType == "Per Unit" ? 'selected' : ''} >Per Unit</option><option ${item.DiscountType == "%" ? 'selected' : ''}>%</option ></select>`;
//        //var td_DiscountType = `<input type="text"  id="txtDiscountType` + tbItemConsumeRowNo + `" value="${item.DiscountType}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType" placeholder="" list="listDiscountType" autocomplete="off" onclick="$(this).val(\'\')"  onchange="CalculateAmount(this);" required>`;

//        var td_Discount = `<input type="number"  id="txtDiscount` + tbItemConsumeRowNo + `" value="${item.Discount}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount" placeholder=""  autocomplete="off"  onchange="CalculateAmount(this);"  required>`;


//        var td_OrderRate = `<input type="number"  id="txtOrderRate` + tbItemConsumeRowNo + `"  value="${item.Rate}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderRate" placeholder=""autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;


//        var td_DiscountType_AfterRate = `<input type="text"  id="txtDiscountType_AfterRate` + tbItemConsumeRowNo + `" value="${item.DiscountType_AfterRate}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType_AfterRate" placeholder="" list="listDiscountType" autocomplete="off" onclick="$(this).val(\'\')"  onchange="CalculateAmount(this);" required>`;
//        var td_Discount_AfterRate = `<input type="number"  id="txtDiscount_AfterRate` + tbItemConsumeRowNo + `" value="${item.Discount_AfterRate}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount_AfterRate" placeholder=""  autocomplete="off"  onchange="CalculateAmount(this);"  required>`;

//        var td_Amount = `<input type="number"  id="txtAmount` + tbItemConsumeRowNo + `"  value="${item.Amount}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end digit10" disabled name="txtAmount" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
//        var td_DeliveryDate = `<input type="date"  id="txtDeliveryDate` + tbItemConsumeRowNo + `"  value="${formattedDate}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryDate" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
//        //var td_ZonePriceListCode = `<input type="text"  id="ZonePriceListCode` + tbItemConsumeRowNo + `" value="${item.ZoneName}" onkeypress = "BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name = "ZonePriceListCode" placeholder = "" list = "listZone" autocomplete = "off" onclick = "$(this).val(\'\')"  onchange = "" required >`;
//        var td_ZonePriceListCode = '<select id="ddlZonePriceList' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ZonePriceList"  autocomplete="off" ></select>';
//        var td_Remarks = `<input type="text"  id="txtRemarks` + tbItemConsumeRowNo + `"  value="${item.Remarks}"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtRemarks" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required  maxlength="200">`;
//        var td_Delete = `<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light " title="Delete" onclick="DeleteOrderItem(this,` + tbItemConsumeRowNo + `);"><i class="fa fa-times" aria-hidden="true"></i></a>`;
//        var td_DealerName = `<input type="hidden" id="hdnDistributorDealerCode` + tbItemConsumeRowNo + `" name="hdnDistributorDealerCode" value="${item.DealerMaster_Code}"><input type="text"  id="txtDealerNameList` + tbItemConsumeRowNo + `" value="${item.DealerName}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDealerNameList" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" disabled  required>`;

//        var td_VisitDetailsCode = `<input type="text"  id="txtVisitDetailsCode` + tbItemConsumeRowNo + `"  value="${item.Code}"   name="txtVisitDetailsCode" placeholder="" value=0  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
//        var td_IsNewRow = `<input type="text"  id="txtIsNewRow` + tbItemConsumeRowNo + `"  value="${item.IsNewRow}"   name="txtIsNewRow" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
//        var td_SizeApplicable = `<input type="text"  id="txtSizeApplicable` + tbItemConsumeRowNo + `"  value="N"   name="txtSizeApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>`;
//        var td_ThkApplicable = `<input type="text" id="txtThkApplicable` + tbItemConsumeRowNo + `"  value="N" name="txtThkApplicable" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" onchange="" required>`;
//        var td_LenApplicable = `<input type="text" id="txtLenApplicable` + tbItemConsumeRowNo + `"  value="N"  name="txtLenApplicable" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" onchange="" required>`;
//        var td_ItemMasterCode = `<input type="text" id="txtItemMasterCode` + tbItemConsumeRowNo + `"  value="${item.ItemMaster_code}"  name="txtItemMasterCode" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" onchange="" required>`;
//        var td_UOMDecimalUnit = `<input type="text" id="txtUOMDecimalUnit` + tbItemConsumeRowNo + `" name="UOMDecimalUnit" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" onchange="" required>`;


//        var row = `
//      <tr>
//        <td  style="display:none">${td_Consignee}   </td>
//        <td  style="display:none">${td_DeliveryAddress}   </td>
//        <td>${td_ItemName}</td>
//        <td  style="display:none">${td_Size}   </td>
//        <td  style="display:none">${td_Thickness}   </td>
//        <td  style="display:none">${td_SizeDesp}   </td>
//        <td  style="display:none">${td_UOM}   </td>
//        <td  style="display:none">${td_Stock}   </td>
//        <td  style="display:none">${td_OrderQtyPC}   </td>
//        <td>${td_OrderQtyMT}</td>
//        <td  style="display:none">${td_OrderQtyMTR}   </td>
//        <td>${td_RateUnit}   </td>
//        <td  style="display:none">${td_OrderUOM}   </td>
//        <td  style="display:none">${td_OrderQTY}   </td>
//        <td>${td_Tolerance}   </td>
//        <td>${td_BasicRate}   </td>
//        <td  style="display:none">${td_ExtraCharges}   </td>
//        <td>${td_DiscountType}   </td>
//        <td>${td_Discount}   </td>
//        <td  style="display:none">${td_OrderRate}   </td>
        
//         <td>${td_DiscountType_AfterRate}   </td>
//        <td>${td_Discount_AfterRate}   </td>
//        <td>${td_Amount}   </td>
//        <td>${td_DeliveryDate}   </td>
//        <td>${td_ZonePriceListCode}   </td>
//        <td>${td_DealerName}   </td>
//        <td>${td_Remarks}   </td>
//        <td>${td_Delete}   </td>
        
//        <td  style="display:none">${td_VisitDetailsCode}   </td>
//        <td  style="display:none">${td_IsNewRow}   </td>
//        <td  style="display:none">${td_SizeApplicable}   </td>
//        <td  style="display:none">${td_ThkApplicable}   </td>
//        <td  style="display:none">${td_LenApplicable}   </td>
//        <td  style="display:none"> ${td_ItemMasterCode}   </td>
       
//      </tr>
//    `;
//        tbody.append(row);
//        OtherCharges = item.OtherCharges;
//        BindSelect2FromDataList($('#ddlItemName' + tbItemConsumeRowNo), arrayList_ItemMaster, "FirstItemZero", "100%");
//        BindSelect2FromDataList($('#ddlZonePriceList' + tbItemConsumeRowNo), arrayList_Zone, "FirstItemZero", "100%");
//        BizSolHelperFunction.SelectOptionByText('ddlItemName' + tbItemConsumeRowNo, item.ItemName);
//        BizSolHelperFunction.SelectOptionByText('ddlZonePriceList' + tbItemConsumeRowNo, item.ZoneName);
//        if (ShowToggleSize == true) {
//            FillValuesAfterStockData(tbItemConsumeRowNo, item.ItemName, item.SizeDesp, item.ThickNess, "N");
//        } else {
//            FillValuesAfterStockData(tbItemConsumeRowNo, item.ItemName, item.Size, item.ThickNess, "N");
//        }
//        // ShowStockValueByItemSizeThk('x', tbItemConsumeRowNo);
//    });


//    if (OtherCharges != 0) {
//        $("#txtAmt").val(OtherCharges);

//        if (OtherCharges < 0) {
//            $('#selectSign').val("-");
//        } else {
//            $('#selectSign').val("+");
//        }
//        //calFinalAmt();
//    }
//    if (ShowToggleSize == true) {
//        $('#toggleSwitch').prop('checked', true);
//    }
//    ShowFooterTotal();
//    SetOrderBookingTableHeaderAsPerConfig();
//    if (param_VisitMode == 'View' && param_VisitMaster_Code > 0) {
//        $('#tblorderbooking input').prop('disabled', true)
//    }
//}
function GetSelectedItemMaster_Code() {

}

function SetFieldsAsPerConfig() {
   // var CRM_Config = JSON.parse(sessionStorage.getItem('CRMConfig'));
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var QtyPCHeader = Qty_Config.QtyPC;
    var QtyMTRHeader = Qty_Config.QtyMR;
    var QtyMTHeader_MT = Qty_Config.QtyMT;

    var DistributorDealerApplicableInOrder = CRM_Config.ShowDealerColumn;
    var ShowCreditDays = CRM_Config.ShowCreditDays;
    var AskDiscountOnOrder = CRM_Config.AskDiscountOnOrder;
    var AskDiscountItemWise = CRM_Config.AskDiscountItemWise;
    var ShowBuyerPoNo = CRM_Config.ShowBuyerPoNo
    var ShowStock = CRM_Config.ShowStock;
    


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

    if (ShowStock == 'N') {
        $('#btnShow').prop('hidden', true);
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

function ShowLogicalStockModal() {
   
    var AccountDesp = $('#ddlCustomerName option:selected').text();// $('#txtDealer').val();
    var ItemName = '';
    var dtDate = new Date().toISOString().split("T")[0];
    var ItemMaster_Codes = '';
    var Size = '';
    var Thicknessdesp = '';
    var Mode = 'Stock';
    var GodownMaster_Codes = '0';
    var StockDependOnParameters = 'NA';
    var OtherParameters = '';
    var ItemSizeMaster_Code = '0';

    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var ShowPendingEnqInStock = CRM_Config.ShowPendingEnqInStock
        , ShowPendingRollingForcastInStock = CRM_Config.ShowPendingRollingForcastInStock
        , ShowPendingCRMOrderInStock = CRM_Config.ShowPendingCRMOrderInStock;


    var ShowSizeButton = $('#toggleSwitch').is(':checked');
    if (ShowSizeButton == true) {
        StockDependOnParameters = 'NA';
    } else {
        StockDependOnParameters = 'SIZE,THICKNESS';
    }
    VisitOrderEntryService.GetLogicalStock(dtDate, ItemMaster_Codes, Size, Thicknessdesp, AccountDesp, Mode, GodownMaster_Codes, StockDependOnParameters, OtherParameters, ItemSizeMaster_Code).then(function (response) {


        if (response.length > 0) {
            $('#LogicalStockModal').modal('show');
            //$('input[name="record"][value="' + Code + '"]').prop('checked', true);
            $(".modal-backdrop").remove();

            $('#tblLogicalStock').prop('hidden', false);
            $('#paginator-LogicalStock').prop('hidden', false);
            $('#btnShow').prop('hidden', false);
            $('#btnLoading').prop('hidden', true);

            

            response.forEach((item, index) => {
                item["Code"] = `<input type="checkbox" name="record"  data-index="${index}" value="${item["Code"] || 0}" class="select-record" onclick=ResetStockQty(this);>`;
                item["PhysicalStock"] = item["PhysicalStock"].toFixed(3);
                item["SaleOrderQty"] = item["SaleOrderQty"].toFixed(3);
                item["RollingForcast"] = item["RollingForcast"].toFixed(3);
                item["BalanceQty"] = item["BalanceQty"].toFixed(3);
            });

            //var filteredResponse = response.filter(function (record) {
            //    return record.BalanceQty > 0;
            //});

            var filteredResponse = response;
            filteredResponse = filteredResponse.map(item => {
                if (item.hasOwnProperty('SaleOrderQty')) {
                    const reorderedItem = {};
                    for (const key in item) {
                        if (key === 'SaleOrderQty') {
                            reorderedItem['Sale Order Qty'] = item[key];
                        } else {
                            reorderedItem[key] = item[key];
                        }
                    }
                    return reorderedItem;
                }
                return item;
            });

            filteredResponse = filteredResponse.map(item => {
                if (item.hasOwnProperty('ItemName')) {
                    const reorderedItem = {};
                    for (const key in item) {
                        if (key === 'ItemName') {
                            reorderedItem['Item Name'] = item[key];
                        } else {
                            reorderedItem[key] = item[key];
                        }
                    }
                    return reorderedItem;
                }
                return item;
            });

            filteredResponse = filteredResponse.map(item => {
                if (item.hasOwnProperty('PhysicalStock')) {
                    const reorderedItem = {};
                    for (const key in item) {
                        if (key === 'PhysicalStock') {
                            reorderedItem['Physical Stock'] = item[key];
                        } else {
                            reorderedItem[key] = item[key];
                        }
                    }
                    return reorderedItem;
                }
                return item;
            });

            filteredResponse = filteredResponse.map(item => {
                if (item.hasOwnProperty('RollingForcast')) {
                    const reorderedItem = {};
                    for (const key in item) {
                        if (key === 'RollingForcast') {
                            reorderedItem['Rolling Forcast'] = item[key];
                        } else {
                            reorderedItem[key] = item[key];
                        }
                    }
                    return reorderedItem;
                }
                return item;
            });


            filteredResponse = filteredResponse.map(item => {
                if (item.hasOwnProperty('PendingCRMOrder')) {
                    const reorderedItem = {};
                    for (const key in item) {
                        if (key === 'PendingCRMOrder') {
                            reorderedItem['Pending CRM Order'] = item[key];
                        } else {
                            reorderedItem[key] = item[key];
                        }
                    }
                    return reorderedItem;
                }
                return item;
            });

            filteredResponse = filteredResponse.map(item => {
                if (item.hasOwnProperty('BalanceQty')) {
                    const reorderedItem = {};
                    for (const key in item) {
                        if (key === 'BalanceQty') {
                            reorderedItem['Balance Qty'] = item[key];
                        } else {
                            reorderedItem[key] = item[key];
                        }
                    }
                    return reorderedItem;
                }
                return item;
            });

            filteredResponse = filteredResponse.map(item => {
                if (item.hasOwnProperty('SizeDesp')) {
                    const reorderedItem = {};
                    for (const key in item) {
                        if (key === 'SizeDesp') {
                            reorderedItem['Size Desp'] = item[key];
                        } else {
                            reorderedItem[key] = item[key];
                        }
                    }
                    return reorderedItem;
                }
                return item;
            });

            filteredResponse = filteredResponse.map(item => {
                if (item.hasOwnProperty('SIZE')) {
                    const reorderedItem = {};
                    for (const key in item) {
                        if (key === 'SIZE') {
                            reorderedItem['Size Desp'] = item[key];
                        } else {
                            reorderedItem[key] = item[key];
                        }
                    }
                    return reorderedItem;
                }
                return item;
            });

            filteredResponse = filteredResponse.map(item => {
                if (item.hasOwnProperty('THICKNESS')) {
                    const reorderedItem = {};
                    for (const key in item) {
                        if (key === 'THICKNESS') {
                            reorderedItem['Thickness'] = item[key];
                        } else {
                            reorderedItem[key] = item[key];
                        }
                    }
                    return reorderedItem;
                }
                return item;
            });

            const StringFilterColumn = ["Item Name", "Size Desp", "SIZE", "Thickness"];
            const NumericFilterColumn = ["Balance Qty","Rolling Forcast"];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["ItemMaster_Code", "MinimumQty"];
            const ColumnAlignment = {
                "Physical Stock": "right",
                "Sale Order Qty": "right",
                "Rolling Forcast": "right",
                "Balance Qty": "right",
                "Pending CRM Order": "right"
            };
            if (ShowPendingEnqInStock == 'N') {
                hiddenColumns.push("Pending Enquiry");
            }
            if (ShowPendingRollingForcastInStock == 'N') {
                hiddenColumns.push("Rolling Forcast");
            }
            if (ShowPendingCRMOrderInStock == 'N') {
                hiddenColumns.push("Pending CRM Order");
            }

            const updatedResponse = filteredResponse.map(item => {
                let td_Qty = `<input type="number"  id="txtStockQty" onchange="SelectStockCheck(this);" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtStockQty" placeholder=""  autocomplete="off" maxlength="7" style="width:50px !important"  required>`;
                let td_BalQty = `<label id="txtBalQty" class="text-end">${item["Balance Qty"]}</label>`;


                return {
                    ...item,
                    "Balance Qty": td_BalQty,
                    Qty: td_Qty,
                };
            });




            BizsolCustomFilterGrid.CreateDataTable("LogicalStock-header", "LogicalStock-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false)
            SetLogicalStockTableColumns();

        } else {
            toastr.error("Stock Not Found!");
            $('#btnShow').prop('hidden', false);
            $('#btnLoading').prop('hidden', true);
        }

        
    });
}
function CloseLogicalStockModal() {
    
    $('#LogicalStockModal').modal('hide');
}

function SetLogicalStockTableColumns() {
    var ShowSizeButton = $('#toggleSwitch').is(':checked');

    var count = ShowSizeButton==true?0:1;
    

    var ShowMoreColumns = $('#toggleMoreCols').is(':checked');
    if (ShowMoreColumns == true) {
        $("#LogicalStock thead tr th:nth-child(" + (Indx_Stock.PhysicalStock + count) + ")").css('display', '');
        $("#LogicalStock tbody tr td:nth-child(" + (Indx_Stock.PhysicalStock + count) + ")").css('display', '');
            
        $("#LogicalStock thead tr th:nth-child(" + (Indx_Stock.SaleOrderQty + count) + ")").css('display', '');
        $("#LogicalStock tbody tr td:nth-child(" + (Indx_Stock.SaleOrderQty + count) + ")").css('display', '');
                                                   
        $("#LogicalStock thead tr th:nth-child(" + (Indx_Stock.PendingCRMOrder + count) + ")").css('display', '');
        $("#LogicalStock tbody tr td:nth-child(" + (Indx_Stock.PendingCRMOrder + count) + ")").css('display', '');
                                                    
        $("#LogicalStock thead tr th:nth-child(" + (Indx_Stock.RollingForcast + count) + ")").css('display', '');
        $("#LogicalStock tbody tr td:nth-child(" + (Indx_Stock.RollingForcast + count) + ")").css('display', '');



    } else {
        $("#LogicalStock thead tr th:nth-child(" + (Indx_Stock.PhysicalStock + count) + ")").css('display', 'none');
        $("#LogicalStock tbody tr td:nth-child(" + (Indx_Stock.PhysicalStock + count) + ")").css('display', 'none');

        $("#LogicalStock thead tr th:nth-child(" + (Indx_Stock.SaleOrderQty + count) + ")").css('display', 'none');
        $("#LogicalStock tbody tr td:nth-child(" + (Indx_Stock.SaleOrderQty + count) + ")").css('display', 'none');

        $("#LogicalStock thead tr th:nth-child(" + (Indx_Stock.PendingCRMOrder + count) + ")").css('display', 'none');
        $("#LogicalStock tbody tr td:nth-child(" + (Indx_Stock.PendingCRMOrder + count) + ")").css('display', 'none');

        $("#LogicalStock thead tr th:nth-child(" + (Indx_Stock.RollingForcast + count) + ")").css('display', 'none');
        $("#LogicalStock tbody tr td:nth-child(" + (Indx_Stock.RollingForcast + count) + ")").css('display', 'none');
    }
}

//function SelectStockRows() {
//    var selectedRecord = $('input[name="record"]:checked');
//    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
//    var DistributorDealerApplicableInOrder = CRM_Config.ShowDealerColumn;
//    var ShowSizeButton = $('#toggleSwitch').is(':checked');


//    //var RowNo = $('#hdnRowNo').val();
//    //// Check if a record is selected
//    var tbItemConsumeRowNo = 0;

//    var count = 0;
//    var count1 = 0;

//    // Loop through each row in the table
//    //$("#tblorderbooking tbody tr").each(function () {

//    //    var InputValue = $(this).find("td:eq("+ Indx_TblOrder.ItemName +") input").val().trim();


//    //    if (InputValue !== "") {
//    //            count++;
//    //        }

//    //});

//    if (selectedRecord.length > 0) {
//        selectedRecord.each((index,record) => {
//            var recordID = selectedRecord.val();  // Get the value of the selected radio button
//            var recordRow = record.closest('tr');  // Get the closest row for the selected radio button
//            var ItemMaster_Code = recordRow.cells[Indx_Stock.ItemMaster_Code].innerText;
//            var ItemName = recordRow.cells[Indx_Stock.ItemName].innerText;


//            if (ShowSizeButton == true) {
//                var SIZE = recordRow.cells[Indx_Stock.Size].innerText;
//                var THICKNESS = "";
//                var PhysicalStock = recordRow.cells[Indx_Stock.PhysicalStock-1].innerText;
//                var SaleOrderQty = recordRow.cells[Indx_Stock.SaleOrderQty - 1].innerText;
//                var PendingCRMOrder = recordRow.cells[Indx_Stock.PendingCRMOrder - 1].innerText;
//                var RollingForcast = recordRow.cells[Indx_Stock.RollingForcast - 1].innerText;
//                var MinimumQty = recordRow.cells[Indx_Stock.MinimumQty - 1].innerText;
//                var BalanceQty = recordRow.cells[Indx_Stock.BalQty - 1].innerText;
//                var currentCell = recordRow.cells[Indx_Stock.Qty - 1];
//                var Qty = currentCell.querySelector("input").value;
//                //BizSolHelperFunction.SelectOptionByText('ddlUOM', ItemUOM);
//            } else {
//                var SIZE = recordRow.cells[Indx_Stock.Size].innerText;
//                var THICKNESS = recordRow.cells[Indx_Stock.Thickness].innerText;
//                var PhysicalStock = recordRow.cells[Indx_Stock.PhysicalStock].innerText;
//                var SaleOrderQty = recordRow.cells[Indx_Stock.SaleOrderQty].innerText;
//                var PendingCRMOrder = recordRow.cells[Indx_Stock.PendingCRMOrder].innerText;
//                var RollingForcast = recordRow.cells[Indx_Stock.RollingForcast].innerText;
//                var MinimumQty = recordRow.cells[Indx_Stock.MinimumQty].innerText;
//                var BalanceQty = recordRow.cells[Indx_Stock.BalQty].innerText;
//                var currentCell = recordRow.cells[Indx_Stock.Qty];
//                var Qty = currentCell.querySelector("input").value;
//            }



//            if (THICKNESS !== '') {
//                THICKNESS = THICKNESS.substring('M', THICKNESS.length - 2).trim()
//            }
//            var InputValue;
//            var InputId;
//            $("#tblorderbooking tbody tr").each(function () {

//                 InputValue = $(this).find("td:eq(" + Indx_TblOrder.ItemName + ") input").val().trim();
//                 InputId = $(this).find("td:eq(" + Indx_TblOrder.ItemName + ") input");

//                if (InputValue !== "") {
//                    count++;
//                } else {
//                    var id = InputId.attr("id");
//                    var substring = "txtItemName";
//                    var position = id.indexOf(substring);
//                    count1 = parseInt(id.substring(position + substring.length));
//                    return false;

//                }

//            });

//            if (count1 > 0) {
//                var ObjCurrRow = InputId.closest('tr');
//                ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value = ItemName;
//                if (ShowSizeButton == true) {
//                    ObjCurrRow.find('td:eq(' + Indx_TblOrder.SizeDesp + ')')[0].getElementsByTagName('input')[0].value = SIZE;
//                }
//                else {
//                    ObjCurrRow.find('td:eq(' + Indx_TblOrder.Size + ')')[0].getElementsByTagName('input')[0].value = SIZE;
//                    ObjCurrRow.find('td:eq(' + Indx_TblOrder.Thickness + ')')[0].getElementsByTagName('input')[0].value = THICKNESS;
//                }



//                ObjCurrRow.find('td:eq(' + Indx_TblOrder.Stock + ')')[0].getElementsByTagName('input')[0].value = BalanceQty;
//                ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyMT + ')')[0].getElementsByTagName('input')[0].value = Qty;
//                tbItemConsumeRowNo = count1;
//            } else {

//                var tbody = $('#tblorderbooking tbody')[0];
//                var rowNO = count;// tbody.rows.length;

//                var row = tbody.insertRow(rowNO);
//                tbItemConsumeRowNo = rowNO + 1;

//                var td_Consignee = row.insertCell(Indx_TblOrder.Consignee);
//                var td_DeliveryAddress = row.insertCell(Indx_TblOrder.DeliveryAddress);
//                var td_ItemName = row.insertCell(Indx_TblOrder.ItemName);
//                var td_Size = row.insertCell(Indx_TblOrder.Size);
//                var td_Thickness = row.insertCell(Indx_TblOrder.Thickness);
//                var td_SizeDesp = row.insertCell(Indx_TblOrder.SizeDesp);
//                var td_UOM = row.insertCell(Indx_TblOrder.UOM);
//                var td_Stock = row.insertCell(Indx_TblOrder.Stock);
//                var td_OrderQtyPC = row.insertCell(Indx_TblOrder.OrderQtyPC);
//                var td_OrderQtyMT = row.insertCell(Indx_TblOrder.OrderQtyMT);
//                var td_OrderQtyMTR = row.insertCell(Indx_TblOrder.OrderQtyMTR);
//                var td_RateUnit = row.insertCell(Indx_TblOrder.RateUnit);
//                var td_OrderUOM = row.insertCell(Indx_TblOrder.OrderUOM);
//                var td_OrderQTY = row.insertCell(Indx_TblOrder.OrderQTY);
//                var td_Tolerance = row.insertCell(Indx_TblOrder.Tolerance);
//                var td_BasicRate = row.insertCell(Indx_TblOrder.BasicRate);
//                var td_ExtraCharges = row.insertCell(Indx_TblOrder.ExtraCharges);
//                var td_DiscountType = row.insertCell(Indx_TblOrder.DiscountType);
//                var td_Discount = row.insertCell(Indx_TblOrder.Discount);
//                var td_OrderRate = row.insertCell(Indx_TblOrder.OrderRate);

//                var td_DiscountType_AfterRate = row.insertCell(Indx_TblOrder.DiscountType_AfterRate);
//                var td_Discount_AfterRate = row.insertCell(Indx_TblOrder.Discount_AfterRate);
//                var td_Amount = row.insertCell(Indx_TblOrder.Amount);
//                var td_DeliveryDate = row.insertCell(Indx_TblOrder.DeliveryDate);
//                var td_ZonePriceListCode = row.insertCell(Indx_TblOrder.ZonePriceListCode);
//                var td_DealerNameList = row.insertCell(Indx_TblOrder.DealerName);
//                var td_Remarks = row.insertCell(Indx_TblOrder.Remarks);
//                var td_Delete = row.insertCell(Indx_TblOrder.Delete);

//                var td_VisitDetailsCode = row.insertCell(Indx_TblOrder.VisitDetailsCode);
//                var td_IsNewRow = row.insertCell(Indx_TblOrder.IsNewRow);
//                var td_SizeApplicable = row.insertCell(Indx_TblOrder.SizeApplicable);
//                var td_ThkApplicable = row.insertCell(Indx_TblOrder.ThkApplicable);
//                var td_LenApplicable = row.insertCell(Indx_TblOrder.LenApplicable);
//                var td_ItemMasterCode = row.insertCell(Indx_TblOrder.ItemMasterCode);
//                var td_UOMDecimalUnit = row.insertCell(Indx_TblOrder.UOMDecimalUnit);


//                td_VisitDetailsCode.style["display"] = "none";
//                td_IsNewRow.style["display"] = "none";
//                td_SizeApplicable.style["display"] = "none";
//                td_ThkApplicable.style["display"] = "none";
//                td_LenApplicable.style["display"] = "none";
//                td_ItemMasterCode.style["display"] = "none";
//                td_UOMDecimalUnit.style["display"] = "none";
//                if (DistributorDealerApplicableInOrder == 'N') {
//                    td_DealerNameList.style["display"] = "none";
//                }



//                td_Consignee.innerHTML = '<input type="text" id="txtConsignee' + tbItemConsumeRowNo + '" list="listConsignee" class="BizSolFormControl box_border form-control form-control-sm" name="txtConsignee" placeholder="" onclick="$(this).val(\'\')" autocomplete="off" onchange="GetConsigneeCode(this,' + tbItemConsumeRowNo + ');GetAccountDeliveryLocationDetails(this,' + tbItemConsumeRowNo + ');"  required><input type="hidden" id="hdnConsigneeCode' + tbItemConsumeRowNo + '" name="hdnConsigneeCode">';
//                td_DeliveryAddress.innerHTML = '<div class="row"><div class="col-md-7"><datalist id="listDeliveryLocation' + tbItemConsumeRowNo + '"></datalist><input type="text" id="txtDeliveryAddress' + tbItemConsumeRowNo + '" list="listDeliveryLocation' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryAddress" placeholder="" onclick="$(this).val(\'\')" autocomplete="off"  required onchange="GetDeliveryAddressCode(this,' + tbItemConsumeRowNo + ');"></div><div class="col-md-3"><button type="button" id="btnSelectDeliveryAdd" onclick="GetAccountDeliveryLocationDetails(this,' + tbItemConsumeRowNo + ');ShowDeliveryAddressModal(' + tbItemConsumeRowNo + ');" class="btn btn-primary btn-height" title="Select Address"> <i class="fa fa-search"></i></button></div></div><input type="hidden" id="hdnAddressCode' + tbItemConsumeRowNo + '" name="hdnAddressCode"> ';
//                td_ItemName.innerHTML = '<input type="text"  id="txtItemName' + tbItemConsumeRowNo + '" value="' + ItemName + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtItemName" placeholder="" list="listItem" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetItemSizeList(this,' + tbItemConsumeRowNo + ');GetLatestPriceListByItemName(this,' + tbItemConsumeRowNo + ');GetUOM(' + tbItemConsumeRowNo + ');GetBasicRateFromPriceList(this,' + tbItemConsumeRowNo + ');GetDealerFromPreRow(this,' + tbItemConsumeRowNo + ');GetItemSizeMasterList(this,' + tbItemConsumeRowNo + ');getRateUnitListFromQtyConfig(' + tbItemConsumeRowNo + ');" required>';
//                td_Size.innerHTML = '<datalist id="listItemSize_' + tbItemConsumeRowNo + '"></datalist> <input type="text"  id="txtSize' + tbItemConsumeRowNo + '" value="' + SIZE + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm digit8" name="txtSize" placeholder="" list="listItemSize_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedSizeCode(' + tbItemConsumeRowNo + ');GetItemThicknessList(this,' + tbItemConsumeRowNo + ');GetBasicRateExtraCharges(' + tbItemConsumeRowNo + ');" required><input type="hidden" id="hdnSizeMasterCode' + tbItemConsumeRowNo + '" name="hdnSizeMasterCode">';
//                td_Thickness.innerHTML = '<datalist id="listItemThickness_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtThickness' + tbItemConsumeRowNo + '" value="' + THICKNESS + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtThickness" placeholder="" list="listItemThickness_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedThkCode(' + tbItemConsumeRowNo + ');GetBasicRateExtraCharges(' + tbItemConsumeRowNo + ');" required><input type="hidden" id="hdnThkMasterCode' + tbItemConsumeRowNo + '" name="hdnThkMasterCode">';
//                if (ShowSizeButton == true) {
//                    td_SizeDesp.innerHTML = '<div class="sizeDes"><datalist id="listItemSizeMaster_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtSizeDesp' + tbItemConsumeRowNo + '"   value="' + SIZE + '" list="listItemSizeMaster_' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm sizeDesInput" name="txtSizeDesp" placeholder="" list="listItemSizeMaster" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedItemSizeMasterCode(' + tbItemConsumeRowNo + ');" required><button type="button" id="btnShowSizeControl_' + tbItemConsumeRowNo + '" class="btn btn-primary btn-height" title="New Size" onclick="ShowSizeControl(this,' + tbItemConsumeRowNo + ');"> <i class="fa fa-plus-square"></i></button><input type="hidden" id="hdnItemSizeMasterCode' + tbItemConsumeRowNo + '" name="hdnItemSizeMasterCode"></div>';

//                }
//                else {
//                    td_SizeDesp.innerHTML = '<div class="sizeDes"><datalist id="listItemSizeMaster_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtSizeDesp' + tbItemConsumeRowNo + '"   list="listItemSizeMaster_' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm sizeDesInput" name="txtSizeDesp" placeholder="" list="listItemSizeMaster" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedItemSizeMasterCode(' + tbItemConsumeRowNo + ');" required><button type="button" id="btnShowSizeControl_' + tbItemConsumeRowNo + '" class="btn btn-primary btn-height" title="New Size" onclick="ShowSizeControl(this,' + tbItemConsumeRowNo + ');"> <i class="fa fa-plus-square"></i></button><input type="hidden" id="hdnItemSizeMasterCode' + tbItemConsumeRowNo + '" name="hdnItemSizeMasterCode"></div>';

//                }
//                td_UOM.innerHTML = '<datalist id="listUOM_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtUOM' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name="txtUOM" placeholder="" list="listUOM_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_Stock.innerHTML = '<input type="text"  id="txtStock' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" value="' + BalanceQty + '" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtStock" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_OrderQtyPC.innerHTML = '<input type="number"  id="txtOrderQtyPC' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderQtyPC" placeholder="" maxlength="6" autocomplete="off"   onchange="CalculateAmount(this);" required>';
//                td_OrderQtyMT.innerHTML = '<input type="number"  id="txtOrderQtyMT' + tbItemConsumeRowNo + '" value="' + Qty + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderQtyMT" maxlength="6" placeholder=""  autocomplete="off"   onchange="CalculateAmount(this);" required>';
//                td_OrderQtyMTR.innerHTML = '<input type="number"  id="txtOrderQtyMTR' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderQtyMTR" placeholder="" maxlength="6"  autocomplete="off"   onchange="CalculateAmount(this);" required>';
//                td_RateUnit.innerHTML = '<input type="text" list="listRateUnit"  id="txtRateUnit' + tbItemConsumeRowNo + '" onchange="CalculateAmount(this);"   onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtRateUnit" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  required>';
//                td_OrderUOM.innerHTML = '<input type="text"  id="txtOrderUOM' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderUOM" placeholder="" list="listOrderUOM" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_OrderQTY.innerHTML = '<input type="number"  id="txtOrderQTY' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderQTY" placeholder="" maxlength="6" autocomplete="off"  onchange="CalculateAmount(this);" required>';
//                td_Tolerance.innerHTML = '<input type="number"  id="txtTolerance' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtTolerance" placeholder=""  autocomplete="off"   required>';
//                td_BasicRate.innerHTML = '<input type="number"  id="txtBasicRate' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtBasicRate" placeholder="" maxlength="12" autocomplete="off" onchange="CalculateAmount(this);GetMaxBasicRate();calFinalAmt();" required>';
//                td_ExtraCharges.innerHTML = '<input type="number"  id="txtExtraCharges' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtExtraCharges" placeholder="" maxlength="6"  autocomplete="off"  onchange="" required>';
//                //td_DiscountType.innerHTML = '<input type="text"  id="txtDiscountType' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType" placeholder="" list="listDiscountType" autocomplete="off" onclick="$(this).val(\'\')"   onchange="CalculateAmount(this);" required>';
//                td_DiscountType.innerHTML = '<select   id="txtDiscountType' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType" placeholder=""   onchange="CalculateAmount(this);" required><option>Per Unit</option><option>%</option ></select>';

//                //var td_DiscountType = `<select  id="txtDiscountType` + tbItemConsumeRowNo + `" value="${item.DiscountType}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm btn-width"  name="txtDiscountType" placeholder=""   onchange="CalculateAmount(this);" required> <option>Per Unit</option><option>%</option ></select>`;

//                td_Discount.innerHTML = '<input type="number"  id="txtDiscount' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount" placeholder=""  autocomplete="off" maxlength="6"  required  onchange="CalculateAmount(this);">';
//                td_OrderRate.innerHTML = '<input type="number"  id="txtOrderRate' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderRate" placeholder=""autocomplete="off"   onchange="" required>';


//                td_DiscountType_AfterRate.innerHTML = '<input type="text"  id="txtDiscountType_AfterRate' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType_AfterRate" placeholder="" list="listDiscountType" autocomplete="off" onclick="$(this).val(\'\')"   onchange="CalculateAmount(this);" required>';
//                td_Discount_AfterRate.innerHTML = '<input type="number"  id="txtDiscount_AfterRate' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount_AfterRate" placeholder="" maxlength="6"  autocomplete="off"   required  onchange="CalculateAmount(this);">';
//                td_Amount.innerHTML = '<input type="number"  id="txtAmount' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end digit10" disabled name="txtAmount" placeholder="" autocomplete="off"  onchange="" required>';
//                td_DeliveryDate.innerHTML = '<input type="date"  id="txtDeliveryDate' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryDate" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_ZonePriceListCode.innerHTML = '<datalist id="ZonePriceListCode' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtZonePriceListCode' + tbItemConsumeRowNo + '"   onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtZonePriceListCode" placeholder="" list="listZone" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_Remarks.innerHTML = '<input type="text"  id="txtRemarks' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);"  class="BizSolFormControl box_border form-control form-control-sm" name="txtRemarks" placeholder=""  autocomplete="off"  onchange="" required  maxlength="200">';
//                td_Delete.innerHTML = '<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light disabled" title="Delete" onclick="DeleteOrderItem(this);"><i class="fa fa-times" aria-hidden="true"></i></a>';
//                td_DealerNameList.innerHTML = '<input type="hidden" id="hdnDistributorDealerCode' + tbItemConsumeRowNo + '" name="hdnDistributorDealerCode"><input type="text"  id="txtDealerNameList' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDealerNameList" placeholder="" list="listDistributorDealer" autocomplete="off" onclick="$(this).val(\'\')" onchange="GetDistributorDealerCode(this,' + tbItemConsumeRowNo + ')"  required>';

//                td_VisitDetailsCode.innerHTML = '<input type="text"  id="txtVisitDetailsCode' + tbItemConsumeRowNo + '"  name="txtVisitDetailsCode" placeholder="" value=0  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_IsNewRow.innerHTML = '<input type="text"  id="txtIsNewRow' + tbItemConsumeRowNo + '"  name="txtIsNewRow" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_SizeApplicable.innerHTML = '<input type="text"  id="txtSizeApplicable' + tbItemConsumeRowNo + '"  name="txtSizeApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_ThkApplicable.innerHTML = '<input type="text"  id="txtThkApplicable' + tbItemConsumeRowNo + '" name="txtThkApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_LenApplicable.innerHTML = '<input type="text"  id="txtLenApplicable' + tbItemConsumeRowNo + '"  name="txtLenApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_ItemMasterCode.innerHTML = '<input type="text"  id="txtItemMasterCode' + tbItemConsumeRowNo + '"  name="txtItemMasterCode" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_UOMDecimalUnit.innerHTML = '<input type="text"  id="txtUOMDecimalUnit' + tbItemConsumeRowNo + '"  name="UOMDecimalUnit" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';

//            }

//            FillValuesAfterStockData(tbItemConsumeRowNo);

//        });

//    }
//    $('#LogicalStockModal').modal('hide');
//    SetOrderBookingTableHeaderAsPerConfig();


//}

//function SelectStockRows() {
//    var selectedRecord = $('input[name="record"]:checked');
//    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
//    var DistributorDealerApplicableInOrder = CRM_Config.ShowDealerColumn;
//    var ShowSizeButton = $('#toggleSwitch').is(':checked');


//    //var RowNo = $('#hdnRowNo').val();
//    //// Check if a record is selected
//    var tbItemConsumeRowNo = 0;

//    var count = 0;
//    var count1 = 0;

//    // Loop through each row in the table
//    //$("#tblorderbooking tbody tr").each(function () {

//    //    var InputValue = $(this).find("td:eq("+ Indx_TblOrder.ItemName +") input").val().trim();


//    //    if (InputValue !== "") {
//    //            count++;
//    //        }

//    //});

//    if (selectedRecord.length > 0) {
//        selectedRecord.each((index, record) => {
//            var recordID = selectedRecord.val();  // Get the value of the selected radio button
//            var recordRow = record.closest('tr');  // Get the closest row for the selected radio button
//            var ItemMaster_Code = recordRow.cells[Indx_Stock.ItemMaster_Code].innerText;
//            var ItemName = recordRow.cells[Indx_Stock.ItemName].innerText;


//            if (ShowSizeButton == true) {
//                var SIZE = recordRow.cells[Indx_Stock.Size].innerText;
//                var THICKNESS = "";
//                var PhysicalStock = recordRow.cells[Indx_Stock.PhysicalStock - 1].innerText;
//                var SaleOrderQty = recordRow.cells[Indx_Stock.SaleOrderQty - 1].innerText;
//                var PendingCRMOrder = recordRow.cells[Indx_Stock.PendingCRMOrder - 1].innerText;
//                var RollingForcast = recordRow.cells[Indx_Stock.RollingForcast - 1].innerText;
//                var MinimumQty = recordRow.cells[Indx_Stock.MinimumQty - 1].innerText;
//                var BalanceQty = recordRow.cells[Indx_Stock.BalQty - 1].innerText;
//                var currentCell = recordRow.cells[Indx_Stock.Qty - 1];
//                var Qty = currentCell.querySelector("input").value;

//            } else {
//                var SIZE = recordRow.cells[Indx_Stock.Size].innerText;
//                var THICKNESS = recordRow.cells[Indx_Stock.Thickness].innerText;
//                var PhysicalStock = recordRow.cells[Indx_Stock.PhysicalStock].innerText;
//                var SaleOrderQty = recordRow.cells[Indx_Stock.SaleOrderQty].innerText;
//                var PendingCRMOrder = recordRow.cells[Indx_Stock.PendingCRMOrder].innerText;
//                var RollingForcast = recordRow.cells[Indx_Stock.RollingForcast].innerText;
//                var MinimumQty = recordRow.cells[Indx_Stock.MinimumQty].innerText;
//                var BalanceQty = recordRow.cells[Indx_Stock.BalQty].innerText;
//                var currentCell = recordRow.cells[Indx_Stock.Qty];
//                var Qty = currentCell.querySelector("input").value;
//            }



//            if (THICKNESS !== '') {
//                THICKNESS = THICKNESS.substring('M', THICKNESS.length - 2).trim()
//            }
//            var InputValue;
//            var InputId;
//            $("#tblorderbooking tbody tr").each(function () {

//                InputValue = $(this).find("td:eq(" + Indx_TblOrder.ItemName + ") select option:selected").text().trim();
//                InputId = $(this).find("td:eq(" + Indx_TblOrder.ItemName + ") select");


//                if (InputValue !== "") {
//                    count++;
//                } else {
//                    var id = InputId.attr("id");
//                    var substring = "ddlItemName";
//                    var position = id.indexOf(substring);
//                    count1 = parseInt(id.substring(position + substring.length));
//                    return false;

//                }

//            });
//            var TotalRowCount = $('#tblorderbooking tbody')[0].rows.length;

//            if (count1 > 0) {
//                var ObjCurrRow = InputId.closest('tr');
//                //ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value = ItemName;
//                BizSolHelperFunction.SelectOptionByText('ddlItemName' + count1, ItemName);

//                if (ShowSizeButton == true) {
//                    //ObjCurrRow.find('td:eq(' + Indx_TblOrder.SizeDesp + ')')[0].getElementsByTagName('input')[0].value = SIZE;
//                    BizSolHelperFunction.SelectOptionByText('ddlItemSizeMaster' + count1, SIZE);
//                }
//                else {
//                    //ObjCurrRow.find('td:eq(' + Indx_TblOrder.Size + ')')[0].getElementsByTagName('input')[0].value = SIZE;
//                    BizSolHelperFunction.SelectOptionByText('ddlItemSize' + count1, SIZE);
//                    //ObjCurrRow.find('td:eq(' + Indx_TblOrder.Thickness + ')')[0].getElementsByTagName('input')[0].value = THICKNESS;
//                    BizSolHelperFunction.SelectOptionByText('ddlItemThickness' + count1, THICKNESS);
//                }



//                ObjCurrRow.find('td:eq(' + Indx_TblOrder.Stock + ')')[0].getElementsByTagName('input')[0].value = BalanceQty;
//                ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyMT + ')')[0].getElementsByTagName('input')[0].value = Qty;
//                tbItemConsumeRowNo = count1;
//            } else {

//                var tbody = $('#tblorderbooking tbody')[0];
//                var rowNO = count;// tbody.rows.length;

//                var row = tbody.insertRow(rowNO);
//                tbItemConsumeRowNo = rowNO + 1;

//                var td_Consignee = row.insertCell(Indx_TblOrder.Consignee);
//                var td_DeliveryAddress = row.insertCell(Indx_TblOrder.DeliveryAddress);
//                var td_ItemName = row.insertCell(Indx_TblOrder.ItemName);
//                var td_Size = row.insertCell(Indx_TblOrder.Size);
//                var td_Thickness = row.insertCell(Indx_TblOrder.Thickness);
//                var td_SizeDesp = row.insertCell(Indx_TblOrder.SizeDesp);
//                var td_UOM = row.insertCell(Indx_TblOrder.UOM);
//                var td_Stock = row.insertCell(Indx_TblOrder.Stock);
//                var td_OrderQtyPC = row.insertCell(Indx_TblOrder.OrderQtyPC);
//                var td_OrderQtyMT = row.insertCell(Indx_TblOrder.OrderQtyMT);
//                var td_OrderQtyMTR = row.insertCell(Indx_TblOrder.OrderQtyMTR);
//                var td_RateUnit = row.insertCell(Indx_TblOrder.RateUnit);
//                var td_OrderUOM = row.insertCell(Indx_TblOrder.OrderUOM);
//                var td_OrderQTY = row.insertCell(Indx_TblOrder.OrderQTY);
//                var td_Tolerance = row.insertCell(Indx_TblOrder.Tolerance);
//                var td_BasicRate = row.insertCell(Indx_TblOrder.BasicRate);
//                var td_ExtraCharges = row.insertCell(Indx_TblOrder.ExtraCharges);
//                var td_DiscountType = row.insertCell(Indx_TblOrder.DiscountType);
//                var td_Discount = row.insertCell(Indx_TblOrder.Discount);
//                var td_OrderRate = row.insertCell(Indx_TblOrder.OrderRate);

//                var td_DiscountType_AfterRate = row.insertCell(Indx_TblOrder.DiscountType_AfterRate);
//                var td_Discount_AfterRate = row.insertCell(Indx_TblOrder.Discount_AfterRate);
//                var td_Amount = row.insertCell(Indx_TblOrder.Amount);
//                var td_DeliveryDate = row.insertCell(Indx_TblOrder.DeliveryDate);
//                var td_ZonePriceListCode = row.insertCell(Indx_TblOrder.ZonePriceListCode);
//                var td_DealerNameList = row.insertCell(Indx_TblOrder.DealerName);
//                var td_Remarks = row.insertCell(Indx_TblOrder.Remarks);
//                var td_Delete = row.insertCell(Indx_TblOrder.Delete);

//                var td_VisitDetailsCode = row.insertCell(Indx_TblOrder.VisitDetailsCode);
//                var td_IsNewRow = row.insertCell(Indx_TblOrder.IsNewRow);
//                var td_SizeApplicable = row.insertCell(Indx_TblOrder.SizeApplicable);
//                var td_ThkApplicable = row.insertCell(Indx_TblOrder.ThkApplicable);
//                var td_LenApplicable = row.insertCell(Indx_TblOrder.LenApplicable);
//                var td_ItemMasterCode = row.insertCell(Indx_TblOrder.ItemMasterCode);
//                var td_UOMDecimalUnit = row.insertCell(Indx_TblOrder.UOMDecimalUnit);


//                td_VisitDetailsCode.style["display"] = "none";
//                td_IsNewRow.style["display"] = "none";
//                td_SizeApplicable.style["display"] = "none";
//                td_ThkApplicable.style["display"] = "none";
//                td_LenApplicable.style["display"] = "none";
//                td_ItemMasterCode.style["display"] = "none";
//                td_UOMDecimalUnit.style["display"] = "none";
//                if (DistributorDealerApplicableInOrder == 'N') {
//                    td_DealerNameList.style["display"] = "none";
//                }



//                td_Consignee.innerHTML = '<input type="text" id="txtConsignee' + tbItemConsumeRowNo + '" list="listConsignee" class="BizSolFormControl box_border form-control form-control-sm" name="txtConsignee" placeholder="" onclick="$(this).val(\'\')" autocomplete="off" onchange="GetConsigneeCode(this,' + tbItemConsumeRowNo + ');GetAccountDeliveryLocationDetails(this,' + tbItemConsumeRowNo + ');"  required><input type="hidden" id="hdnConsigneeCode' + tbItemConsumeRowNo + '" name="hdnConsigneeCode">';
//                td_DeliveryAddress.innerHTML = '<div class="row"><div class="col-md-7"><datalist id="listDeliveryLocation' + tbItemConsumeRowNo + '"></datalist><input type="text" id="txtDeliveryAddress' + tbItemConsumeRowNo + '" list="listDeliveryLocation' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryAddress" placeholder="" onclick="$(this).val(\'\')" autocomplete="off"  required onchange="GetDeliveryAddressCode(this,' + tbItemConsumeRowNo + ');"></div><div class="col-md-3"><button type="button" id="btnSelectDeliveryAdd" onclick="GetAccountDeliveryLocationDetails(this,' + tbItemConsumeRowNo + ');ShowDeliveryAddressModal(' + tbItemConsumeRowNo + ');" class="btn btn-primary btn-height" title="Select Address"> <i class="fa fa-search"></i></button></div></div><input type="hidden" id="hdnAddressCode' + tbItemConsumeRowNo + '" name="hdnAddressCode"> ';
//                //td_ItemName.innerHTML = '<input type="text"  id="txtItemName' + tbItemConsumeRowNo + '" value="' + ItemName + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtItemName" placeholder="" list="listItem" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetItemSizeList(this,' + tbItemConsumeRowNo + ');GetLatestPriceListByItemName(this,' + tbItemConsumeRowNo + ');GetUOM(' + tbItemConsumeRowNo + ');GetBasicRateFromPriceList(this,' + tbItemConsumeRowNo + ');GetDealerFromPreRow(this,' + tbItemConsumeRowNo + ');GetItemSizeMasterList(this,' + tbItemConsumeRowNo + ');getRateUnitListFromQtyConfig(' + tbItemConsumeRowNo + ');" required>';
//                //td_Size.innerHTML = '<datalist id="listItemSize_' + tbItemConsumeRowNo + '"></datalist> <input type="text"  id="txtSize' + tbItemConsumeRowNo + '" value="' + SIZE + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm digit8" name="txtSize" placeholder="" list="listItemSize_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedSizeCode(' + tbItemConsumeRowNo + ');GetItemThicknessList(this,' + tbItemConsumeRowNo + ');GetBasicRateExtraCharges(' + tbItemConsumeRowNo + ');" required><input type="hidden" id="hdnSizeMasterCode' + tbItemConsumeRowNo + '" name="hdnSizeMasterCode">';
//                //td_Thickness.innerHTML = '<datalist id="listItemThickness_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtThickness' + tbItemConsumeRowNo + '" value="' + THICKNESS + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtThickness" placeholder="" list="listItemThickness_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedThkCode(' + tbItemConsumeRowNo + ');GetBasicRateExtraCharges(' + tbItemConsumeRowNo + ');" required><input type="hidden" id="hdnThkMasterCode' + tbItemConsumeRowNo + '" name="hdnThkMasterCode">';
//                //if (ShowSizeButton == true) {
//                //    td_SizeDesp.innerHTML = '<div class="sizeDes"><datalist id="listItemSizeMaster_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtSizeDesp' + tbItemConsumeRowNo + '"   value="' + SIZE + '" list="listItemSizeMaster_' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm sizeDesInput" name="txtSizeDesp" placeholder="" list="listItemSizeMaster" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedItemSizeMasterCode(' + tbItemConsumeRowNo + ');" required><button type="button" id="btnShowSizeControl_' + tbItemConsumeRowNo + '" class="btn btn-primary btn-height" title="New Size" onclick="ShowSizeControl(this,' + tbItemConsumeRowNo + ');"> <i class="fa fa-plus-square"></i></button><input type="hidden" id="hdnItemSizeMasterCode' + tbItemConsumeRowNo + '" name="hdnItemSizeMasterCode"></div>';

//                //}
//                //else {
//                //    td_SizeDesp.innerHTML = '<div class="sizeDes"><datalist id="listItemSizeMaster_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtSizeDesp' + tbItemConsumeRowNo + '"   list="listItemSizeMaster_' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm sizeDesInput" name="txtSizeDesp" placeholder="" list="listItemSizeMaster" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedItemSizeMasterCode(' + tbItemConsumeRowNo + ');" required><button type="button" id="btnShowSizeControl_' + tbItemConsumeRowNo + '" class="btn btn-primary btn-height" title="New Size" onclick="ShowSizeControl(this,' + tbItemConsumeRowNo + ');"> <i class="fa fa-plus-square"></i></button><input type="hidden" id="hdnItemSizeMasterCode' + tbItemConsumeRowNo + '" name="hdnItemSizeMasterCode"></div>';

//                //}
//                //td_UOM.innerHTML = '<datalist id="listUOM_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtUOM' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name="txtUOM" placeholder="" list="listUOM_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_ItemName.innerHTML = '<select id="ddlItemName' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlItemName"  autocomplete="off" onchange="OnChange_ddlItemName(this,' + tbItemConsumeRowNo + ');"></select>';
//                td_Size.innerHTML = '<select id="ddlItemSize' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlItemSize"  autocomplete="off" onchange="OnChange_ddlItemSize(this,' + tbItemConsumeRowNo + ');"></select>';
//                td_Thickness.innerHTML = '<select id="ddlItemThickness' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlItemThickness"  autocomplete="off" onchange="OnChange_ddlItemThickness(this,' + tbItemConsumeRowNo + ');"></select>';
//                if (ShowSizeButton == true) {
//                    td_SizeDesp.innerHTML = '<div class="sizeDes"><select id="ddlItemSizeMaster' + tbItemConsumeRowNo + '" class="BizSolFormControl form-control form-control-sm box_border sizeDesInput" name="ddlItemSizeMaster"  autocomplete="off" onchange="OnChange_ddlItemSizeMaster(this,' + tbItemConsumeRowNo + ');"></select><button type="button" id="btnShowSizeControl_' + tbItemConsumeRowNo + '" class="btn btn-primary btn-height" title="New Size" onclick="ShowSizeControl(this,' + tbItemConsumeRowNo + ');"> <i class="fa fa-plus-square"></i></button></div>';

//                }
//                else {
//                    td_SizeDesp.innerHTML = '<div class="sizeDes"><select id="ddlItemSizeMaster' + tbItemConsumeRowNo + '" class="BizSolFormControl form-control form-control-sm box_border sizeDesInput" name="ddlItemSizeMaster"  autocomplete="off" onchange="OnChange_ddlItemSizeMaster(this,' + tbItemConsumeRowNo + ');"></select><button type="button" id="btnShowSizeControl_' + tbItemConsumeRowNo + '" class="btn btn-primary btn-height" title="New Size" onclick="ShowSizeControl(this,' + tbItemConsumeRowNo + ');"> <i class="fa fa-plus-square"></i></button></div>';

//                }
//                td_UOM.innerHTML = '<select id="ddlUOM' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlUOM"  autocomplete="off" ></select>';
//                td_Stock.innerHTML = '<input type="text"  id="txtStock' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" value="' + BalanceQty + '" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtStock" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_OrderQtyPC.innerHTML = '<input type="number"  id="txtOrderQtyPC' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderQtyPC" placeholder="" maxlength="6" autocomplete="off"   onchange="CalculateAmount(this);" required>';
//                td_OrderQtyMT.innerHTML = '<input type="number"  id="txtOrderQtyMT' + tbItemConsumeRowNo + '" value="' + Qty + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderQtyMT" maxlength="6" placeholder=""  autocomplete="off"   onchange="CalculateAmount(this);" required>';
//                td_OrderQtyMTR.innerHTML = '<input type="number"  id="txtOrderQtyMTR' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderQtyMTR" placeholder="" maxlength="6"  autocomplete="off"   onchange="CalculateAmount(this);" required>';
//                td_RateUnit.innerHTML = '<input type="text" list="listRateUnit"  id="txtRateUnit' + tbItemConsumeRowNo + '" onchange="CalculateAmount(this);"   onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtRateUnit" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  required>';
//                td_OrderUOM.innerHTML = '<input type="text"  id="txtOrderUOM' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderUOM" placeholder="" list="listOrderUOM" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_OrderQTY.innerHTML = '<input type="number"  id="txtOrderQTY' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderQTY" placeholder="" maxlength="6" autocomplete="off"  onchange="CalculateAmount(this);" required>';
//                td_Tolerance.innerHTML = '<input type="number"  id="txtTolerance' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtTolerance" placeholder=""  autocomplete="off"   required>';
//                td_BasicRate.innerHTML = '<input type="number"  id="txtBasicRate' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtBasicRate" placeholder="" maxlength="12" autocomplete="off" onchange="CalculateAmount(this);GetMaxBasicRate();calFinalAmt();" required>';
//                td_ExtraCharges.innerHTML = '<input type="number"  id="txtExtraCharges' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtExtraCharges" placeholder="" maxlength="6"  autocomplete="off"  onchange="" required>';
//                //td_DiscountType.innerHTML = '<input type="text"  id="txtDiscountType' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType" placeholder="" list="listDiscountType" autocomplete="off" onclick="$(this).val(\'\')"   onchange="CalculateAmount(this);" required>';
//                td_DiscountType.innerHTML = '<select   id="txtDiscountType' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType" placeholder=""   onchange="CalculateAmount(this);" required><option>Per Unit</option><option>%</option ></select>';

//                //var td_DiscountType = `<select  id="txtDiscountType` + tbItemConsumeRowNo + `" value="${item.DiscountType}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm btn-width"  name="txtDiscountType" placeholder=""   onchange="CalculateAmount(this);" required> <option>Per Unit</option><option>%</option ></select>`;

//                td_Discount.innerHTML = '<input type="number"  id="txtDiscount' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount" placeholder=""  autocomplete="off" maxlength="6"  required  onchange="CalculateAmount(this);">';
//                td_OrderRate.innerHTML = '<input type="number"  id="txtOrderRate' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderRate" placeholder=""autocomplete="off"   onchange="" required>';


//                td_DiscountType_AfterRate.innerHTML = '<input type="text"  id="txtDiscountType_AfterRate' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType_AfterRate" placeholder="" list="listDiscountType" autocomplete="off" onclick="$(this).val(\'\')"   onchange="CalculateAmount(this);" required>';
//                td_Discount_AfterRate.innerHTML = '<input type="number"  id="txtDiscount_AfterRate' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount_AfterRate" placeholder="" maxlength="6"  autocomplete="off"   required  onchange="CalculateAmount(this);">';
//                td_Amount.innerHTML = '<input type="number"  id="txtAmount' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end digit10" disabled name="txtAmount" placeholder="" autocomplete="off"  onchange="" required>';
//                td_DeliveryDate.innerHTML = '<input type="date"  id="txtDeliveryDate' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryDate" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                //td_ZonePriceListCode.innerHTML = '<datalist id="ZonePriceListCode' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtZonePriceListCode' + tbItemConsumeRowNo + '"   onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtZonePriceListCode" placeholder="" list="listZone" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_ZonePriceListCode.innerHTML = '<select id="ddlZonePriceList' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ZonePriceList"  autocomplete="off" ></select>';
//                td_Remarks.innerHTML = '<input type="text"  id="txtRemarks' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);"  class="BizSolFormControl box_border form-control form-control-sm" name="txtRemarks" placeholder=""  autocomplete="off"  onchange="" required  maxlength="200">';
//                td_Delete.innerHTML = '<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light disabled" title="Delete" onclick="DeleteOrderItem(this);"><i class="fa fa-times" aria-hidden="true"></i></a>';
//                td_DealerNameList.innerHTML = '<input type="hidden" id="hdnDistributorDealerCode' + tbItemConsumeRowNo + '" name="hdnDistributorDealerCode"><input type="text"  id="txtDealerNameList' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDealerNameList" placeholder="" list="listDistributorDealer" autocomplete="off" onclick="$(this).val(\'\')" onchange="GetDistributorDealerCode(this,' + tbItemConsumeRowNo + ')"  required>';

//                td_VisitDetailsCode.innerHTML = '<input type="text"  id="txtVisitDetailsCode' + tbItemConsumeRowNo + '"  name="txtVisitDetailsCode" placeholder="" value=0  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_IsNewRow.innerHTML = '<input type="text"  id="txtIsNewRow' + tbItemConsumeRowNo + '"  name="txtIsNewRow" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_SizeApplicable.innerHTML = '<input type="text"  id="txtSizeApplicable' + tbItemConsumeRowNo + '"  name="txtSizeApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_ThkApplicable.innerHTML = '<input type="text"  id="txtThkApplicable' + tbItemConsumeRowNo + '" name="txtThkApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_LenApplicable.innerHTML = '<input type="text"  id="txtLenApplicable' + tbItemConsumeRowNo + '"  name="txtLenApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_ItemMasterCode.innerHTML = '<input type="text"  id="txtItemMasterCode' + tbItemConsumeRowNo + '"  name="txtItemMasterCode" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
//                td_UOMDecimalUnit.innerHTML = '<input type="text"  id="txtUOMDecimalUnit' + tbItemConsumeRowNo + '"  name="UOMDecimalUnit" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';


//            }
//            FillValuesAfterStockData(tbItemConsumeRowNo,ItemName, SIZE, THICKNESS);


//        });

//    }
//    $('#LogicalStockModal').modal('hide');
//    SetOrderBookingTableHeaderAsPerConfig();


//}


function SelectStockRows() {
    var selectedRecord = $('input[name="record"]:checked');
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var DistributorDealerApplicableInOrder = CRM_Config.ShowDealerColumn;
    var ShowSizeButton = $('#toggleSwitch').is(':checked');


    //var RowNo = $('#hdnRowNo').val();
    //// Check if a record is selected
    var tbItemConsumeRowNo = 0;

    var count = 0;
    var count1 = 0;

    // Loop through each row in the table
    //$("#tblorderbooking tbody tr").each(function () {

    //    var InputValue = $(this).find("td:eq("+ Indx_TblOrder.ItemName +") input").val().trim();


    //    if (InputValue !== "") {
    //            count++;
    //        }

    //});

   


    if (selectedRecord.length > 0) {
        selectedRecord.each((index, record) => {
            var recordID = selectedRecord.val();  // Get the value of the selected radio button
            var recordRow = record.closest('tr');  // Get the closest row for the selected radio button
            var ItemMaster_Code = recordRow.cells[Indx_Stock.ItemMaster_Code].innerText;
            var ItemName = recordRow.cells[Indx_Stock.ItemName].innerText;


            if (ShowSizeButton == true) {
                var SIZE = recordRow.cells[Indx_Stock.Size].innerText;
                var THICKNESS = "";
                var PhysicalStock = recordRow.cells[Indx_Stock.PhysicalStock - 1].innerText;
                var SaleOrderQty = recordRow.cells[Indx_Stock.SaleOrderQty - 1].innerText;
                var PendingCRMOrder = recordRow.cells[Indx_Stock.PendingCRMOrder - 1].innerText;
                var RollingForcast = recordRow.cells[Indx_Stock.RollingForcast - 1].innerText;
                var MinimumQty = recordRow.cells[Indx_Stock.MinimumQty - 1].innerText;
                var BalanceQty = recordRow.cells[Indx_Stock.BalQty - 1].innerText;
                var currentCell = recordRow.cells[Indx_Stock.Qty - 1];
                var Qty = currentCell.querySelector("input").value;

            } else {
                var SIZE = recordRow.cells[Indx_Stock.Size].innerText;
                var THICKNESS = recordRow.cells[Indx_Stock.Thickness].innerText;
                var PhysicalStock = recordRow.cells[Indx_Stock.PhysicalStock].innerText;
                var SaleOrderQty = recordRow.cells[Indx_Stock.SaleOrderQty].innerText;
                var PendingCRMOrder = recordRow.cells[Indx_Stock.PendingCRMOrder].innerText;
                var RollingForcast = recordRow.cells[Indx_Stock.RollingForcast].innerText;
                var MinimumQty = recordRow.cells[Indx_Stock.MinimumQty].innerText;
                var BalanceQty = recordRow.cells[Indx_Stock.BalQty].innerText;
                var currentCell = recordRow.cells[Indx_Stock.Qty];
                var Qty = currentCell.querySelector("input").value;
            }



            if (THICKNESS !== '') {
                THICKNESS = THICKNESS.substring('M', THICKNESS.length - 2).trim()
            }
         
            var InputValue;
            var InputId;
            count = 0;
            $("#tblorderbooking tbody tr").each(function () {

                InputValue = $(this).find("td:eq(" + Indx_TblOrder.ItemName + ") select option:selected").text().trim();
                InputId = $(this).find("td:eq(" + Indx_TblOrder.ItemName + ") select");


                if (InputValue !== "") {
                    count=count+1;
                } else {
                    var id = InputId.attr("id");
                    var substring = "ddlItemName";
                    var position = id.indexOf(substring);
                    count1 = parseInt(id.substring(position + substring.length));
                    return false;

                }

            });
            var TotalRowCount = $('#tblorderbooking tbody')[0].rows.length;

            if (count1 > 0 && TotalRowCount >= count1 && TotalRowCount>count) {
                var ObjCurrRow = InputId.closest('tr');
                //ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value = ItemName;
                BizSolHelperFunction.SelectOptionByText('ddlItemName' + count1, ItemName);

                if (ShowSizeButton == true) {
                    //ObjCurrRow.find('td:eq(' + Indx_TblOrder.SizeDesp + ')')[0].getElementsByTagName('input')[0].value = SIZE;
                    VisitOrderEntryService.GetItemSizeMasterListWithRequestNo(ItemName, count1).then(function (response) {
                        var defaultValue = '';
                        var defaultCode = 0;
                        let recivCount = count1;
                        if (response.resvalue.length > 0) {
                            response.resvalue = response.resvalue.map((item) => ({
                                key: item.Code, value: item.SizeDesp
                            }));

                            let ResponseNo = response.Count;
                            let arrayList_ItemSizeMaster1 = response.resvalue;

                            BindSelect2FromDataList($('#ddlItemSizeMaster' + ResponseNo), arrayList_ItemSizeMaster1, "FirstItemZero", "100%");

                            BizSolHelperFunction.SelectOptionByText('ddlItemSizeMaster' + ResponseNo, SIZE);
                        }
                    });
                }
                else {
                    //ObjCurrRow.find('td:eq(' + Indx_TblOrder.Size + ')')[0].getElementsByTagName('input')[0].value = SIZE;
                    BizSolHelperFunction.SelectOptionByText('ddlItemSize' + count1, SIZE);
                    //ObjCurrRow.find('td:eq(' + Indx_TblOrder.Thickness + ')')[0].getElementsByTagName('input')[0].value = THICKNESS;
                    BizSolHelperFunction.SelectOptionByText('ddlItemThickness' + count1, THICKNESS);
                }



                ObjCurrRow.find('td:eq(' + Indx_TblOrder.Stock + ')')[0].getElementsByTagName('input')[0].value = BalanceQty;
                ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyMT + ')')[0].getElementsByTagName('input')[0].value = Qty;
                tbItemConsumeRowNo = count1;
            } else {

                var tbody = $('#tblorderbooking tbody')[0];
                var rowNO = count;// tbody.rows.length;

                var row = tbody.insertRow(rowNO);
                tbItemConsumeRowNo = rowNO + 1;

                var cells = [];
                for (let i = 0; i < TblOrderColumns.length; i++) {
                    cells.push(row.insertCell(i));
                }

                //var td_Consignee = row.insertCell(Indx_TblOrder.Consignee);
                //var td_DeliveryAddress = row.insertCell(Indx_TblOrder.DeliveryAddress);
                //var td_ItemName = row.insertCell(Indx_TblOrder.ItemName);
                //var td_Size = row.insertCell(Indx_TblOrder.Size);
                //var td_Thickness = row.insertCell(Indx_TblOrder.Thickness);
                //var td_SizeDesp = row.insertCell(Indx_TblOrder.SizeDesp);
                //var td_UOM = row.insertCell(Indx_TblOrder.UOM);
                //var td_Stock = row.insertCell(Indx_TblOrder.Stock);
                //var td_OrderQtyBags = row.insertCell(Indx_TblOrder.OrderQtyBags);
                //var td_OrderQtyPC = row.insertCell(Indx_TblOrder.OrderQtyPC);
                //var td_OrderQtyMT = row.insertCell(Indx_TblOrder.OrderQtyMT);
                //var td_OrderQtyMTR = row.insertCell(Indx_TblOrder.OrderQtyMTR);
                //var td_RateUnit = row.insertCell(Indx_TblOrder.RateUnit);
                //var td_OrderUOM = row.insertCell(Indx_TblOrder.OrderUOM);
                //var td_OrderQTY = row.insertCell(Indx_TblOrder.OrderQTY);
                //var td_Tolerance = row.insertCell(Indx_TblOrder.Tolerance);
                //var td_BasicRate = row.insertCell(Indx_TblOrder.BasicRate);
                //var td_ExtraCharges = row.insertCell(Indx_TblOrder.ExtraCharges);
                //var td_DiscountType = row.insertCell(Indx_TblOrder.DiscountType);
                //var td_Discount = row.insertCell(Indx_TblOrder.Discount);
                //var td_OrderRate = row.insertCell(Indx_TblOrder.OrderRate);

                //var td_DiscountType_AfterRate = row.insertCell(Indx_TblOrder.DiscountType_AfterRate);
                //var td_Discount_AfterRate = row.insertCell(Indx_TblOrder.Discount_AfterRate);
                //var td_Amount = row.insertCell(Indx_TblOrder.Amount);
                //var td_DeliveryDate = row.insertCell(Indx_TblOrder.DeliveryDate);
                //var td_ZonePriceListCode = row.insertCell(Indx_TblOrder.ZonePriceListCode);
                //var td_DealerNameList = row.insertCell(Indx_TblOrder.DealerName);
                //var td_Remarks = row.insertCell(Indx_TblOrder.Remarks);
                //var td_Delete = row.insertCell(Indx_TblOrder.Delete);

                //var td_VisitDetailsCode = row.insertCell(Indx_TblOrder.VisitDetailsCode);
                //var td_IsNewRow = row.insertCell(Indx_TblOrder.IsNewRow);
                //var td_SizeApplicable = row.insertCell(Indx_TblOrder.SizeApplicable);
                //var td_ThkApplicable = row.insertCell(Indx_TblOrder.ThkApplicable);
                //var td_LenApplicable = row.insertCell(Indx_TblOrder.LenApplicable);
                //var td_ItemMasterCode = row.insertCell(Indx_TblOrder.ItemMasterCode);
                //var td_UOMDecimalUnit = row.insertCell(Indx_TblOrder.UOMDecimalUnit);

                var td_Consignee = cells[Indx_TblOrder.Consignee];
                var td_DeliveryAddress = cells[Indx_TblOrder.DeliveryAddress];
                var td_ItemName = cells[Indx_TblOrder.ItemName];
                var td_Size = cells[Indx_TblOrder.Size];
                var td_Thickness = cells[Indx_TblOrder.Thickness];
                var td_SizeDesp = cells[Indx_TblOrder.SizeDesp];
                var td_UOM = cells[Indx_TblOrder.UOM];
                var td_Stock = cells[Indx_TblOrder.Stock];
                var td_OrderQtyBags = cells[Indx_TblOrder.OrderQtyBags];
                var td_OrderQtyPC = cells[Indx_TblOrder.OrderQtyPC];
                var td_OrderQtyMT = cells[Indx_TblOrder.OrderQtyMT];
                var td_OrderQtyMTR = cells[Indx_TblOrder.OrderQtyMTR];
                var td_RateUnit = cells[Indx_TblOrder.RateUnit];
                var td_OrderUOM = cells[Indx_TblOrder.OrderUOM];
                var td_OrderQTY = cells[Indx_TblOrder.OrderQTY];
                var td_Tolerance = cells[Indx_TblOrder.Tolerance];
                var td_BasicRate = cells[Indx_TblOrder.BasicRate];
                var td_ExtraCharges = cells[Indx_TblOrder.ExtraCharges];
                var td_DiscountType = cells[Indx_TblOrder.DiscountType];
                var td_Discount = cells[Indx_TblOrder.Discount];
                var td_OrderRate = cells[Indx_TblOrder.OrderRate];

                var td_DiscountType_AfterRate = cells[Indx_TblOrder.DiscountType_AfterRate];
                var td_Discount_AfterRate = cells[Indx_TblOrder.Discount_AfterRate];
                var td_Amount = cells[Indx_TblOrder.Amount];
                var td_DeliveryDate = cells[Indx_TblOrder.DeliveryDate];
                var td_ZonePriceListCode = cells[Indx_TblOrder.ZonePriceListCode];
                var td_DealerNameList = cells[Indx_TblOrder.DealerName];
                var td_Remarks = cells[Indx_TblOrder.Remarks];
                var td_Delete = cells[Indx_TblOrder.Delete];

                var td_VisitDetailsCode = cells[Indx_TblOrder.VisitDetailsCode];
                var td_IsNewRow = cells[Indx_TblOrder.IsNewRow];
                var td_SizeApplicable = cells[Indx_TblOrder.SizeApplicable];
                var td_ThkApplicable = cells[Indx_TblOrder.ThkApplicable];
                var td_LenApplicable = cells[Indx_TblOrder.LenApplicable];
                var td_ItemMasterCode = cells[Indx_TblOrder.ItemMasterCode];
                var td_UOMDecimalUnit = cells[Indx_TblOrder.UOMDecimalUnit];


                td_VisitDetailsCode.style["display"] = "none";
                td_IsNewRow.style["display"] = "none";
                td_SizeApplicable.style["display"] = "none";
                td_ThkApplicable.style["display"] = "none";
                td_LenApplicable.style["display"] = "none";
                td_ItemMasterCode.style["display"] = "none";
                td_UOMDecimalUnit.style["display"] = "none";
                if (DistributorDealerApplicableInOrder == 'N') {
                    td_DealerNameList.style["display"] = "none";
                }



                td_Consignee.innerHTML = '<input type="text" id="txtConsignee' + tbItemConsumeRowNo + '" list="listConsignee" class="BizSolFormControl box_border form-control form-control-sm" name="txtConsignee" placeholder="" onclick="$(this).val(\'\')" autocomplete="off" onchange="GetConsigneeCode(this,' + tbItemConsumeRowNo + ');GetAccountDeliveryLocationDetails(this,' + tbItemConsumeRowNo + ');"  required><input type="hidden" id="hdnConsigneeCode' + tbItemConsumeRowNo + '" name="hdnConsigneeCode">';
                td_DeliveryAddress.innerHTML = '<div class="row"><div class="col-md-7"><datalist id="listDeliveryLocation' + tbItemConsumeRowNo + '"></datalist><input type="text" id="txtDeliveryAddress' + tbItemConsumeRowNo + '" list="listDeliveryLocation' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryAddress" placeholder="" onclick="$(this).val(\'\')" autocomplete="off"  required onchange="GetDeliveryAddressCode(this,' + tbItemConsumeRowNo + ');"></div><div class="col-md-3"><button type="button" id="btnSelectDeliveryAdd" onclick="GetAccountDeliveryLocationDetails(this,' + tbItemConsumeRowNo + ');ShowDeliveryAddressModal(' + tbItemConsumeRowNo + ');" class="btn btn-primary btn-height" title="Select Address"> <i class="fa fa-search"></i></button></div></div><input type="hidden" id="hdnAddressCode' + tbItemConsumeRowNo + '" name="hdnAddressCode"> ';
                //td_ItemName.innerHTML = '<input type="text"  id="txtItemName' + tbItemConsumeRowNo + '" value="' + ItemName + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtItemName" placeholder="" list="listItem" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetItemSizeList(this,' + tbItemConsumeRowNo + ');GetLatestPriceListByItemName(this,' + tbItemConsumeRowNo + ');GetUOM(' + tbItemConsumeRowNo + ');GetBasicRateFromPriceList(this,' + tbItemConsumeRowNo + ');GetDealerFromPreRow(this,' + tbItemConsumeRowNo + ');GetItemSizeMasterList(this,' + tbItemConsumeRowNo + ');getRateUnitListFromQtyConfig(' + tbItemConsumeRowNo + ');" required>';
                //td_Size.innerHTML = '<datalist id="listItemSize_' + tbItemConsumeRowNo + '"></datalist> <input type="text"  id="txtSize' + tbItemConsumeRowNo + '" value="' + SIZE + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm digit8" name="txtSize" placeholder="" list="listItemSize_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedSizeCode(' + tbItemConsumeRowNo + ');GetItemThicknessList(this,' + tbItemConsumeRowNo + ');GetBasicRateExtraCharges(' + tbItemConsumeRowNo + ');" required><input type="hidden" id="hdnSizeMasterCode' + tbItemConsumeRowNo + '" name="hdnSizeMasterCode">';
                //td_Thickness.innerHTML = '<datalist id="listItemThickness_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtThickness' + tbItemConsumeRowNo + '" value="' + THICKNESS + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtThickness" placeholder="" list="listItemThickness_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedThkCode(' + tbItemConsumeRowNo + ');GetBasicRateExtraCharges(' + tbItemConsumeRowNo + ');" required><input type="hidden" id="hdnThkMasterCode' + tbItemConsumeRowNo + '" name="hdnThkMasterCode">';
                //if (ShowSizeButton == true) {
                //    td_SizeDesp.innerHTML = '<div class="sizeDes"><datalist id="listItemSizeMaster_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtSizeDesp' + tbItemConsumeRowNo + '"   value="' + SIZE + '" list="listItemSizeMaster_' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm sizeDesInput" name="txtSizeDesp" placeholder="" list="listItemSizeMaster" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedItemSizeMasterCode(' + tbItemConsumeRowNo + ');" required><button type="button" id="btnShowSizeControl_' + tbItemConsumeRowNo + '" class="btn btn-primary btn-height" title="New Size" onclick="ShowSizeControl(this,' + tbItemConsumeRowNo + ');"> <i class="fa fa-plus-square"></i></button><input type="hidden" id="hdnItemSizeMasterCode' + tbItemConsumeRowNo + '" name="hdnItemSizeMasterCode"></div>';

                //}
                //else {
                //    td_SizeDesp.innerHTML = '<div class="sizeDes"><datalist id="listItemSizeMaster_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtSizeDesp' + tbItemConsumeRowNo + '"   list="listItemSizeMaster_' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm sizeDesInput" name="txtSizeDesp" placeholder="" list="listItemSizeMaster" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetSelectedItemSizeMasterCode(' + tbItemConsumeRowNo + ');" required><button type="button" id="btnShowSizeControl_' + tbItemConsumeRowNo + '" class="btn btn-primary btn-height" title="New Size" onclick="ShowSizeControl(this,' + tbItemConsumeRowNo + ');"> <i class="fa fa-plus-square"></i></button><input type="hidden" id="hdnItemSizeMasterCode' + tbItemConsumeRowNo + '" name="hdnItemSizeMasterCode"></div>';

                //}
                //td_UOM.innerHTML = '<datalist id="listUOM_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtUOM' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" disabled name="txtUOM" placeholder="" list="listUOM_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
                td_ItemName.innerHTML = '<select id="ddlItemName' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlItemName"  autocomplete="off" onchange="OnChange_ddlItemName(this,' + tbItemConsumeRowNo + ');"></select>';
                td_Size.innerHTML = '<select id="ddlItemSize' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlItemSize"  autocomplete="off" onchange="OnChange_ddlItemSize(this,' + tbItemConsumeRowNo + ');"></select>';
                td_Thickness.innerHTML = '<select id="ddlItemThickness' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlItemThickness"  autocomplete="off" onchange="OnChange_ddlItemThickness(this,' + tbItemConsumeRowNo + ');"></select>';
                if (ShowSizeButton == true) {
                    td_SizeDesp.innerHTML = '<div class="sizeDes"><select id="ddlItemSizeMaster' + tbItemConsumeRowNo + '" class="BizSolFormControl form-control form-control-sm box_border sizeDesInput" name="ddlItemSizeMaster"  autocomplete="off" onchange="OnChange_ddlItemSizeMaster(this,' + tbItemConsumeRowNo + ');"></select><button type="button" id="btnShowSizeControl_' + tbItemConsumeRowNo + '" class="btn btn-primary btn-height" title="New Size" onclick="ShowSizeControl(this,' + tbItemConsumeRowNo + ');"> <i class="fa fa-plus-square"></i></button></div>';

                }
                else {
                    td_SizeDesp.innerHTML = '<div class="sizeDes"><select id="ddlItemSizeMaster' + tbItemConsumeRowNo + '" class="BizSolFormControl form-control form-control-sm box_border sizeDesInput" name="ddlItemSizeMaster"  autocomplete="off" onchange="OnChange_ddlItemSizeMaster(this,' + tbItemConsumeRowNo + ');"></select><button type="button" id="btnShowSizeControl_' + tbItemConsumeRowNo + '" class="btn btn-primary btn-height" title="New Size" onclick="ShowSizeControl(this,' + tbItemConsumeRowNo + ');"> <i class="fa fa-plus-square"></i></button></div>';

                }
                td_UOM.innerHTML = '<select id="ddlUOM' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlUOM"  autocomplete="off" ></select>';
                td_Stock.innerHTML = '<input type="text"  id="txtStock' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" value="' + BalanceQty + '" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtStock" placeholder="" autocomplete="off" onclick="$(this).val(\'\')" style="min-width: 70px;" onchange="" required>';
                td_OrderQtyBags.innerHTML = '<input type="number"  id="txtOrderQtyBags' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderQtyBags" placeholder="" maxlength="6" autocomplete="off"   onchange="SetMTRByPacking(this,' + tbItemConsumeRowNo + ');CalculateAmount(this);" required>';
                td_OrderQtyPC.innerHTML = '<input type="number"  id="txtOrderQtyPC' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderQtyPC" placeholder="" maxlength="6" autocomplete="off"   onchange="SetWeightInMTByPC(this,' + tbItemConsumeRowNo + ');CalculateAmount(this);" required>';
                td_OrderQtyMT.innerHTML = '<input type="number"  id="txtOrderQtyMT' + tbItemConsumeRowNo + '" value="' + Qty + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderQtyMT" maxlength="6" placeholder=""  autocomplete="off"   onchange="SetPCByWeightInMT(this,' + tbItemConsumeRowNo + ');CalculateAmount(this);" required>';
                td_OrderQtyMTR.innerHTML = '<input type="number"  id="txtOrderQtyMTR' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderQtyMTR" placeholder="" maxlength="6"  autocomplete="off"   onchange="SetPCandWeightByLengthInMR(this,' + tbItemConsumeRowNo + ');CalculateAmount(this);" required>';
                td_RateUnit.innerHTML = '<input type="text" list="listRateUnit"  id="txtRateUnit' + tbItemConsumeRowNo + '" onchange="CalculateAmount(this);"   onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtRateUnit" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="CalculateAmount(this);OnChange_RateUnit(this,' + tbItemConsumeRowNo + ')"  required>';
                td_OrderUOM.innerHTML = '<input type="text"  id="txtOrderUOM' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderUOM" placeholder="" list="listOrderUOM" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
                td_OrderQTY.innerHTML = '<input type="number"  id="txtOrderQTY' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtOrderQTY" placeholder="" maxlength="6" autocomplete="off"  onchange="CalculateAmount(this);" required>';
                td_Tolerance.innerHTML = '<input type="number"  id="txtTolerance' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtTolerance" placeholder=""  autocomplete="off"   required>';
                td_BasicRate.innerHTML = '<input type="number"  id="txtBasicRate' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtBasicRate" placeholder="" maxlength="12" autocomplete="off" onchange="CalculateAmount(this);GetMaxBasicRate();calFinalAmt();" required>';
                td_ExtraCharges.innerHTML = '<input type="number"  id="txtExtraCharges' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtExtraCharges" placeholder="" maxlength="6"  autocomplete="off"  onchange="" required>';
                //td_DiscountType.innerHTML = '<input type="text"  id="txtDiscountType' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType" placeholder="" list="listDiscountType" autocomplete="off" onclick="$(this).val(\'\')"   onchange="CalculateAmount(this);" required>';
                td_DiscountType.innerHTML = '<select   id="txtDiscountType' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType" placeholder="" style="max-width: 60px;"  onchange="CalculateAmount(this);" required><option>Per Unit</option><option>%</option ></select>';

                //var td_DiscountType = `<select  id="txtDiscountType` + tbItemConsumeRowNo + `" value="${item.DiscountType}" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm btn-width"  name="txtDiscountType" placeholder=""   onchange="CalculateAmount(this);" required> <option>Per Unit</option><option>%</option ></select>`;

                td_Discount.innerHTML = '<input type="number"  id="txtDiscount' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount" placeholder=""  autocomplete="off" maxlength="6"  required  onchange="CalculateAmount(this);">';
                td_OrderRate.innerHTML = '<input type="number"  id="txtOrderRate' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end" name="txtOrderRate" placeholder=""autocomplete="off"   onchange="" required>';


                td_DiscountType_AfterRate.innerHTML = '<input type="text"  id="txtDiscountType_AfterRate' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm"  name="txtDiscountType_AfterRate" placeholder="" list="listDiscountType" autocomplete="off" onclick="$(this).val(\'\')"   onchange="CalculateAmount(this);" required>';
                td_Discount_AfterRate.innerHTML = '<input type="number"  id="txtDiscount_AfterRate' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm  text-end" name="txtDiscount_AfterRate" placeholder="" maxlength="6"  autocomplete="off"   required  onchange="CalculateAmount(this);">';
                td_Amount.innerHTML = '<input type="number"  id="txtAmount' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm text-end digit10" disabled name="txtAmount" placeholder="" autocomplete="off"  onchange="" required>';
                td_DeliveryDate.innerHTML = '<input type="date"  id="txtDeliveryDate' + tbItemConsumeRowNo + '"  onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryDate" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
                //td_ZonePriceListCode.innerHTML = '<datalist id="ZonePriceListCode' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtZonePriceListCode' + tbItemConsumeRowNo + '"   onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtZonePriceListCode" placeholder="" list="listZone" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
                td_ZonePriceListCode.innerHTML = '<select id="ddlZonePriceList' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ZonePriceList"  autocomplete="off" ></select>';
                td_Remarks.innerHTML = '<input type="text"  id="txtRemarks' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);"  class="BizSolFormControl box_border form-control form-control-sm" name="txtRemarks" placeholder=""  autocomplete="off"  onchange="" required  maxlength="200">';
                td_Delete.innerHTML = '<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light disabled" title="Delete" onclick="DeleteOrderItem(this,' + tbItemConsumeRowNo + ');"><i class="fa fa-times" aria-hidden="true"></i></a>';
                td_DealerNameList.innerHTML = '<input type="hidden" id="hdnDistributorDealerCode' + tbItemConsumeRowNo + '" name="hdnDistributorDealerCode"><input type="text"  id="txtDealerNameList' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDealerNameList" placeholder="" list="listDistributorDealer" autocomplete="off" onclick="$(this).val(\'\')" onchange="GetDistributorDealerCode(this,' + tbItemConsumeRowNo + ')"  required>';

                td_VisitDetailsCode.innerHTML = '<input type="text"  id="txtVisitDetailsCode' + tbItemConsumeRowNo + '"  name="txtVisitDetailsCode" placeholder="" value=0  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
                td_IsNewRow.innerHTML = '<input type="text"  id="txtIsNewRow' + tbItemConsumeRowNo + '"  name="txtIsNewRow" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
                td_SizeApplicable.innerHTML = '<input type="text"  id="txtSizeApplicable' + tbItemConsumeRowNo + '"  name="txtSizeApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
                td_ThkApplicable.innerHTML = '<input type="text"  id="txtThkApplicable' + tbItemConsumeRowNo + '" name="txtThkApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
                td_LenApplicable.innerHTML = '<input type="text"  id="txtLenApplicable' + tbItemConsumeRowNo + '"  name="txtLenApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
                td_ItemMasterCode.innerHTML = '<input type="text"  id="txtItemMasterCode' + tbItemConsumeRowNo + '"  name="txtItemMasterCode" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
                td_UOMDecimalUnit.innerHTML = '<input type="text"  id="txtUOMDecimalUnit' + tbItemConsumeRowNo + '"  name="UOMDecimalUnit" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';


            }
            FillValuesAfterStockData(tbItemConsumeRowNo, ItemName, SIZE, THICKNESS,"Y");


        });

    }
    $('#LogicalStockModal').modal('hide');
    SetOrderBookingTableHeaderAsPerConfig();


}
function FillValuesAfterStockData(tbItemConsumeRowNo, ItemName, Size, Thickness, IsNewRow) {

    //VisitOrderEntryService.GetItemMasterDropdown().then(function (response) {

        

    //    if (response.length > 0) {
    //        //$('#listItem option').empty();
    //        //var option = '';
    //        //for (var i = 0; i < response.length; i++) {

    //        //    option += '<option data-code="' + response[i].Code + '">' + response[i].ItemName + '</option>'
    //        //}
    //        //$('#listItem')[0].innerHTML = option;

    //        arrayList_ItemMaster = [];
    //        response = response.map((item) => ({
    //            key: item.Code, value: item.ItemName
    //        }));
    //        arrayList_ItemMaster = response;
    //        BindSelect2FromDataList($('#ddlItemName' + tbItemConsumeRowNo), arrayList_ItemMaster, "FirstItemZero", "100%");
    //        BizSolHelperFunction.SelectOptionByText('ddlItemName' + tbItemConsumeRowNo, ItemName);
    //    }



    //});

    var ObjCurrRow = $('#ddlItemName' + tbItemConsumeRowNo).closest('tr');
    //var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
    var ItemName1 = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ') select option:selected').text();
    var ItemMasterCode = 0;
    var array = $('#listItem')[0];
    var arrValue;
    var Valid = false;

    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var FixedParameter = JSON.parse(sessionStorage.getItem('FixedParameter'));
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));

    var ToleranceValue = FixedParameter.ShowBuyerPOToleranceValue;
    var DefaultRateUnit = Qty_Config.DefaultRateUnit;
    var ShowTolerance = CRM_Config.ShowTolerance;
    var ShowSizeButton = $('#toggleSwitch').is(':checked'); 
    var arrayList_ItemSize = [];
    var arrayList_ddlZonePriceList = [];
    var arrayList_ItemSizeMaster = [];
    var arrayList_ItemThickness = [];

    if (ShowTolerance == 'Y') {
        $('#txtTolerance' + tbItemConsumeRowNo).val(ToleranceValue);
    }
    if (IsNewRow=='Y') {
        $('#txtRateUnit' + tbItemConsumeRowNo).val(DefaultRateUnit);
    }

    if (ItemName1 !== ''){
        Valid = true;
    }
    if (Valid == false) {
        BindSelect2FromDataList($('#ddlItemName' + tbItemConsumeRowNo), arrayList_ItemMaster, "FirstItemZero", "100%");
        BizSolHelperFunction.SelectOptionByText('ddlItemName' + tbItemConsumeRowNo, ItemName);




        VisitOrderEntryService.GetItemSizeMasterList(ItemName).then(function (response) {
            var defaultValue = '';
            var defaultCode = 0;
            if (response.length > 0) {
                response = response.map((item) => ({
                    key: item.Code, value: item.SizeDesp
                }));
                arrayList_ItemSizeMaster = response;

                BindSelect2FromDataList($('#ddlItemSizeMaster' + tbItemConsumeRowNo), arrayList_ItemSizeMaster, "FirstItemZero", "100%");
                BizSolHelperFunction.SelectOptionByText('ddlItemSizeMaster' + tbItemConsumeRowNo, Size);
                VisitOrderEntryService.GetSizeParameterAsPerChart(ItemName).then(function (response) {
                    if (response.length > 0) {
                        response = response.map((item) => ({
                            key: item.ItemParameterValueMaster_Code_Size, value: item.SizeDesp
                        }));
                        arrayList_ItemSize = response;

                        BindSelect2FromDataList($('#ddlItemSize' + tbItemConsumeRowNo), arrayList_ItemSize, "FirstItemZero", "100%");
                        BizSolHelperFunction.SelectOptionByText('ddlItemSize' + tbItemConsumeRowNo, Size);

                        VisitOrderEntryService.GetThkParameterAsPerChart(ItemName, Size).then(function (response) {
                            if (response.length > 0) {
                                response = response.map((item) => ({
                                    key: item.ItemParameterValueMaster_Code_THK, value: item.ThkDesp
                                }));
                                arrayList_ItemThickness = response;

                                BindSelect2FromDataList($('#ddlItemThickness' + tbItemConsumeRowNo), arrayList_ItemThickness, "FirstItemZero", "100%");
                                BizSolHelperFunction.SelectOptionByText('ddlItemThickness' + tbItemConsumeRowNo, Thickness);

                                ShowStockValueByItemSizeThk('x', tbItemConsumeRowNo);

                               // var Size = $('#ddlItemSize' + tbItemConsumeRowNo + ' option:selected').text();
                                var Thk = $('#ddlItemThickness' + tbItemConsumeRowNo + ' option:selected').text();
                                var CustomerName = $('#ddlCustomerName option:selected').text();
                                var ParameterCode = $('#ddlItemThickness' + tbItemConsumeRowNo + ' option:selected').val();
                                
                                    if (ShowSizeButton == true) {


                                        var ItemSize = $('#ddlItemSizeMaster' + tbItemConsumeRowNo + ' option:selected').text();

                                        ParameterCode = $('#ddlItemSizeMaster' + tbItemConsumeRowNo + ' option:selected').val();
                                        VisitOrderEntryService.GetBasicRateExtraCharges(ItemName, ItemSize, '', CustomerName, ParameterCode, G_BasicRateUOM).then(function (response) {

                                            if (response.length > 0) {

                                                $('#txtBasicRate' + tbItemConsumeRowNo).val(response[0].BasicRate);
                                                $('#txtExtraCharges' + tbItemConsumeRowNo).val(response[0].ExtraCharges);

                                            }
                                            CalculateAmount($('#ddlItemSizeMaster' + tbItemConsumeRowNo));

                                            
                                        });
                                    } else {
                                        VisitOrderEntryService.GetBasicRateExtraCharges(ItemName, Size, Thickness, CustomerName, 0, G_BasicRateUOM).then(function (response) {

                                            if (response.length > 0) {

                                                $('#txtBasicRate' + tbItemConsumeRowNo).val(response[0].BasicRate);
                                                $('#txtExtraCharges' + tbItemConsumeRowNo).val(response[0].ExtraCharges);

                                            }
                                            CalculateAmount($('#ddlItemSize' + tbItemConsumeRowNo));

                                            
                                        });
                                    }
                               
                            }




                        });
                    }
                });
            }
        });
    } else
    {
        VisitOrderEntryService.GetSizeParameterAsPerChart(ItemName).then(function (response) {
            if (response.length > 0) {
                response = response.map((item) => ({
                    key: item.ItemParameterValueMaster_Code_Size, value: item.SizeDesp
                }));
                arrayList_ItemSize = response;

                BindSelect2FromDataList($('#ddlItemSize' + tbItemConsumeRowNo), arrayList_ItemSize, "FirstItemZero", "100%");
                BizSolHelperFunction.SelectOptionByText('ddlItemSize' + tbItemConsumeRowNo, Size);
            }

            //VisitOrderEntryService.GetLatestPriceListByItemName(ItemName).then(function (response) {
            //    var defaultValue = '';
            //    if (response.length > 0) {
            //        response = response.map((item) => ({
            //            key: item.ZoneMaster_Code, value: item.ZoneName
            //        }));
            //        arrayList_ddlZonePriceList = response;

            //        BindSelect2FromDataList($('#ddlZonePriceList' + tbItemConsumeRowNo), arrayList_ddlZonePriceList, "FirstItemSelected", "100%");


            //    }


            //    //var AccountDesp = $("#txtDealer").val();
            //    var AccountDesp = $('#ddlCustomerName option:selected').text()
            //    const now = new Date();
            //    const hours = now.getHours().toString().padStart(2, '0');
            //    const minutes = now.getMinutes().toString().padStart(2, '0');


            //    const formattedDate = ('0' + now.getDate()).slice(-2) + '/' +
            //        ('0' + (now.getMonth() + 1)).slice(-2) + '/' +
            //        now.getFullYear();

            //    VisitOrderEntryService.GetBasicRateFromPriceList(convertDateFormat(formattedDate), ItemName, AccountDesp).then(function (response) {

            //        if (response.length > 0 && IsNewRow=='Y') {

            //            $('#txtBasicRate' + tbItemConsumeRowNo).val(response[0].BasicRateFromPriceList);

            //        }

                    VisitOrderEntryService.GetItemSizeMasterList(ItemName).then(function (response) {
                        var defaultValue = '';
                        var defaultCode = 0;
                        if (response.length > 0) {
                            response = response.map((item) => ({
                                key: item.Code, value: item.SizeDesp
                            }));
                            arrayList_ItemSizeMaster = response;

                            BindSelect2FromDataList($('#ddlItemSizeMaster' + tbItemConsumeRowNo), arrayList_ItemSizeMaster, "FirstItemZero", "100%");
                            BizSolHelperFunction.SelectOptionByText('ddlItemSizeMaster' + tbItemConsumeRowNo, Size);
                        }
                        //if (param_VisitMode == 'New') {
                        //$('#txtSizeDesp' + tbItemConsumeRowNo).val(defaultValue);
                        //$('#hdnItemSizeMasterCode' + tbItemConsumeRowNo).val(defaultCode);
                        //}

                        var defaultValue1 = '';
                        var inputString = Qty_Config.RateUnit;

                        // Split the string by "/" and store it in an array
                        var response = inputString.split('/');

                        if (response.length > 0) {
                            $('#listRateUnit option').empty();
                            $('#listRateUnit').empty();
                            $.each(response, function (index, value) {
                                // Create a new <option> element for each item
                                if (index == 0) {
                                    defaultValue1 = value;
                                }
                                $("#listRateUnit").append($('<option>', {
                                    value: value
                                }));
                            });
                            if (IsNewRow == 'Y') {
                                $('#txtRateUnit' + tbItemConsumeRowNo).val(defaultValue1);
                            }
                        }

                        //var Size = $('#ddlItemSize' + tbItemConsumeRowNo + ' option:selected').text();
                        var ParameterCode = $('#ddlItemSize' + tbItemConsumeRowNo + ' option:selected').val();
                        //$('#listItemSize_' + tbItemConsumeRowNo + ' option').each(function () {
                        //    if ($(this).val() === Size) {
                        //        // Get the code (data-code attribute)
                        //        var selectedCode = $(this).data('code');

                        //        ParameterCode = selectedCode;
                        //    }
                        //});
                        //$('#hdnSizeMasterCode' + tbItemConsumeRowNo).val(ParameterCode);


                        //var Size = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Size + ')')[0].getElementsByTagName('input')[0].value;
                        //var Size = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Size + ') select option:selected').text();

                        var ItemMasterCode = 0;
                        var array = $('#listItemSize_' + tbItemConsumeRowNo)[0];
                        var arrValue;
                        var Valid = false;


                        VisitOrderEntryService.GetThkParameterAsPerChart(ItemName, Size).then(function (response) {
                            if (response.length > 0) {
                                response = response.map((item) => ({
                                    key: item.ItemParameterValueMaster_Code_THK, value: item.ThkDesp
                                }));
                                arrayList_ItemThickness = response;

                                BindSelect2FromDataList($('#ddlItemThickness' + tbItemConsumeRowNo), arrayList_ItemThickness, "FirstItemZero", "100%");
                                BizSolHelperFunction.SelectOptionByText('ddlItemThickness' + tbItemConsumeRowNo, Thickness);

                                ShowStockValueByItemSizeThk('x', tbItemConsumeRowNo);
                            }

                            //var Size = $('#ddlItemSize' + tbItemConsumeRowNo + ' option:selected').text();
                            var Thk = $('#ddlItemThickness' + tbItemConsumeRowNo + ' option:selected').text();
                            var CustomerName = $('#ddlCustomerName option:selected').text();
                            var ParameterCode = $('#ddlItemThickness' + tbItemConsumeRowNo + ' option:selected').val();


                        });

                        var CustomerName = $('#ddlCustomerName option:selected').text();
                        //var Size = $('#ddlItemSize' + tbItemConsumeRowNo + ' option:selected').text();
                        var Thk = $('#ddlItemThickness' + tbItemConsumeRowNo + ' option:selected').text();

                        if (ShowSizeButton == true ) {


                            var ItemSize = $('#ddlItemSizeMaster' + tbItemConsumeRowNo + ' option:selected').text();

                            ParameterCode = $('#ddlItemSizeMaster' + tbItemConsumeRowNo + ' option:selected').val();
                            VisitOrderEntryService.GetBasicRateExtraCharges(ItemName, ItemSize, '', CustomerName, ParameterCode, G_BasicRateUOM).then(function (response) {

                                if (response.length > 0 && IsNewRow == 'Y') {

                                    $('#txtBasicRate' + tbItemConsumeRowNo).val(response[0].BasicRate);
                                    $('#txtExtraCharges' + tbItemConsumeRowNo).val(response[0].ExtraCharges);

                                }
                                CalculateAmount($('#ddlItemSizeMaster' + tbItemConsumeRowNo));
                                
                            });
                        } else {
                            VisitOrderEntryService.GetBasicRateExtraCharges(ItemName, Size, Thickness, CustomerName, 0, G_BasicRateUOM).then(function (response) {

                                if (response.length > 0 && IsNewRow == 'Y') {

                                    $('#txtBasicRate' + tbItemConsumeRowNo).val(response[0].BasicRate);
                                    $('#txtExtraCharges' + tbItemConsumeRowNo).val(response[0].ExtraCharges);

                                }
                                CalculateAmount($('#ddlItemSize' + tbItemConsumeRowNo));
                            });
                        }


                    ///});


            //    });

            });



        });

    }

}



//function FillValuesAfterStockData(tbItemConsumeRowNo) {

//    var ObjCurrRow = $('#txtItemName' + tbItemConsumeRowNo).closest('tr');
//    //var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
//    var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ') select option:selected').text();
//    var ItemMasterCode = 0;
//    var array = $('#listItem')[0];
//    var arrValue;
//    var Valid = false;

//    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
//    var FixedParameter = JSON.parse(sessionStorage.getItem('FixedParameter'));
//    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));

//    var ToleranceValue = FixedParameter.ShowBuyerPOToleranceValue;
//    var DefaultRateUnit = Qty_Config.DefaultRateUnit;
//    var ShowTolerance = CRM_Config.ShowTolerance;
//    var ShowSizeButton = $('#toggleSwitch').is(':checked');

//    if (ShowTolerance == 'Y') {
//        $('#txtTolerance' + tbItemConsumeRowNo).val(ToleranceValue);
//    }

//    $('#txtRateUnit' + tbItemConsumeRowNo).val(DefaultRateUnit);

//    for (var i = 0; i < array.options.length; i++) {
//        arrValue = htmlDecode(array.options[i].innerHTML);

//        if (arrValue.trim().toUpperCase().replace("\u0026", "&") == ItemName.trim().toUpperCase().replace("&amp;", "&")) {
//            Valid = true;
//        }
//    }
//    if (Valid == false) {

//    } else {
//        VisitOrderEntryService.GetSizeParameterAsPerChart(ItemName).then(function (response) {
//            if (response.length > 0) {
//                $('#listItemSize_' + tbItemConsumeRowNo + ' option').empty();
//                var option = '';
//                for (var i = 0; i < response.length; i++) {

//                    option += '<option data-code="' + response[i].ItemParameterValueMaster_Code_Size + '">' + response[i].SizeDesp + '</option>'
//                }
//                $('#listItemSize_' + tbItemConsumeRowNo)[0].innerHTML = option;

//            }

//            VisitOrderEntryService.GetLatestPriceListByItemName(ItemName).then(function (response) {
//                var defaultValue = '';
//                if (response.length > 0) {
//                    $('#ZonePriceListCode' + tbItemConsumeRowNo + ' option').empty();
//                    var option = '';
//                    for (var i = 0; i < response.length; i++) {
//                        if (i == 0) {
//                            defaultValue = response[0].ZoneName;
//                        }
//                        option += '<option text="' + response[i].ZoneMaster_Code + '">' + response[i].ZoneName + '</option>'
//                    }
//                    $('#ZonePriceListCode' + tbItemConsumeRowNo)[0].innerHTML = option;

//                }
//                //if (param_VisitMode == 'New') {
//                $('#txtZonePriceListCode' + tbItemConsumeRowNo).val(defaultValue);
//                //}


//                //var AccountDesp = $("#txtDealer").val();
//                var AccountDesp = $('#ddlCustomerName option:selected').text()
//                const now = new Date();
//                const hours = now.getHours().toString().padStart(2, '0');
//                const minutes = now.getMinutes().toString().padStart(2, '0');


//                const formattedDate = ('0' + now.getDate()).slice(-2) + '/' +
//                    ('0' + (now.getMonth() + 1)).slice(-2) + '/' +
//                    now.getFullYear();

//                VisitOrderEntryService.GetBasicRateFromPriceList(convertDateFormat(formattedDate), ItemName, AccountDesp).then(function (response) {

//                    if (response.length > 0) {

//                        $('#txtBasicRate' + tbItemConsumeRowNo).val(response[0].BasicRateFromPriceList);

//                    }

//                    VisitOrderEntryService.GetItemSizeMasterList(ItemName).then(function (response) {
//                        var defaultValue = '';
//                        var defaultCode = 0;
//                        if (response.length > 0) {
//                            $('#listItemSizeMaster_' + tbItemConsumeRowNo + ' option').empty();
//                            var option = '';
//                            for (var i = 0; i < response.length; i++) {
//                                if (i == 0) {
//                                    defaultValue = response[0].SizeDesp;
//                                    defaultCode = response[0].Code;
//                                }
//                                option += '<option data-code="' + response[i].Code + '">' + response[i].SizeDesp + '</option>'
//                            }
//                            $('#listItemSizeMaster_' + tbItemConsumeRowNo)[0].innerHTML = option;

//                        }
//                        //if (param_VisitMode == 'New') {
//                        //$('#txtSizeDesp' + tbItemConsumeRowNo).val(defaultValue);
//                        //$('#hdnItemSizeMasterCode' + tbItemConsumeRowNo).val(defaultCode);
//                        //}

//                        var defaultValue1 = '';
//                        var inputString = Qty_Config.RateUnit;

//                        // Split the string by "/" and store it in an array
//                        var response = inputString.split('/');

//                        if (response.length > 0) {
//                            $('#listRateUnit option').empty();

//                            $.each(response, function (index, value) {
//                                // Create a new <option> element for each item
//                                if (index == 0) {
//                                    defaultValue1 = value;
//                                }
//                                $("#listRateUnit").append($('<option>', {
//                                    value: value
//                                }));
//                            });

//                            $('#txtRateUnit' + tbItemConsumeRowNo).val(defaultValue1);
//                        }

//                        var Size = $('#txtSize' + tbItemConsumeRowNo).val();
//                        var ParameterCode = 0;
//                        $('#listItemSize_' + tbItemConsumeRowNo + ' option').each(function () {
//                            if ($(this).val() === Size) {
//                                // Get the code (data-code attribute)
//                                var selectedCode = $(this).data('code');

//                                ParameterCode = selectedCode;
//                            }
//                        });
//                        $('#hdnSizeMasterCode' + tbItemConsumeRowNo).val(ParameterCode);


//                        //var Size = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Size + ')')[0].getElementsByTagName('input')[0].value;
//                        var Size = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Size + ') select option:selected').text();

//                        var ItemMasterCode = 0;
//                        var array = $('#listItemSize_' + tbItemConsumeRowNo)[0];
//                        var arrValue;
//                        var Valid = false;

//                        for (var i = 0; i < array.options.length; i++) {
//                            arrValue = htmlDecode(array.options[i].innerHTML);

//                            if (arrValue.trim().toUpperCase().replace("\u0026", "&") == Size.trim().toUpperCase().replace("&amp;", "&")) {
//                                Valid = true;
//                            }
//                        }
//                        if (Valid == false) {

//                        } else {
//                            VisitOrderEntryService.GetThkParameterAsPerChart(ItemName, Size).then(function (response) {
//                                if (response.length > 0) {
//                                    $('#listItemThickness_' + tbItemConsumeRowNo + ' option').empty();
//                                    var option = '';
//                                    for (var i = 0; i < response.length; i++) {

//                                        option += '<option data-code="' + response[i].ItemParameterValueMaster_Code_THK + '">' + response[i].ThkDesp + '</option>'
//                                    }
//                                    $('#listItemThickness_' + tbItemConsumeRowNo)[0].innerHTML = option;

//                                }

//                                var Size = $('#txtSize' + tbItemConsumeRowNo).val();
//                                var Thk = $('#txtThickness' + tbItemConsumeRowNo).val();
//                                var CustomerName = $("#txtDealer").val();

//                                $('#listItemThickness_' + tbItemConsumeRowNo + ' option').each(function () {
//                                    if ($(this).val() === Thk) {
//                                        // Get the code (data-code attribute)
//                                        var selectedCode1 = $(this).data('code');

//                                        ParameterCode = selectedCode1;
//                                    }
//                                });
//                                $('#hdnThkMasterCode' + tbItemConsumeRowNo).val(ParameterCode);



//                            });
//                        }
//                        var CustomerName = $("#txtDealer").val();
//                        var Size = $('#txtSize' + tbItemConsumeRowNo).val();
//                        var Thk = $('#txtThickness' + tbItemConsumeRowNo).val();
//                        if (ShowSizeButton == true) {


//                            var ItemSize = $('#txtSizeDesp' + tbItemConsumeRowNo).val();
//                            $('#listItemSizeMaster_' + tbItemConsumeRowNo + ' option').each(function () {
//                                if ($(this).val() === ItemSize) {
//                                    // Get the code (data-code attribute)
//                                    var selectedCode = $(this).data('code');

//                                    ParameterCode = selectedCode;
//                                }
//                            });
//                            $('#hdnItemSizeMasterCode' + tbItemConsumeRowNo).val(ParameterCode);
//                            ParameterCode = $('#hdnSizeMasterCode' + tbItemConsumeRowNo).val();
//                            VisitOrderEntryService.GetBasicRateExtraCharges(ItemName, '', '', CustomerName, ParameterCode).then(function (response) {

//                                if (response.length > 0) {

//                                    $('#txtBasicRate' + tbItemConsumeRowNo).val(response[0].BasicRate);
//                                    $('#txtExtraCharges' + tbItemConsumeRowNo).val(response[0].ExtraCharges);

//                                }
//                                CalculateAmount($('#txtSizeDesp' + tbItemConsumeRowNo));
//                            });
//                        } else {
//                            VisitOrderEntryService.GetBasicRateExtraCharges(ItemName, Size, Thk, CustomerName, 0).then(function (response) {

//                                if (response.length > 0) {

//                                    $('#txtBasicRate' + tbItemConsumeRowNo).val(response[0].BasicRate);
//                                    $('#txtExtraCharges' + tbItemConsumeRowNo).val(response[0].ExtraCharges);

//                                }
//                                CalculateAmount($('#txtSize' + tbItemConsumeRowNo));
//                            });
//                        }

//                    });

//                });

//            });



//        });
//    }






//}

function getFinancialYear() {
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth(); // 0 is January, 11 is December

    var startYear = currentDate.getFullYear();

    // If the current month is before April (i.e., January, February, March), 
    // the financial year will belong to the previous year.
    if (currentMonth < 3) {
        startYear = startYear - 1; // Subtract one year for FY before April
    }

    // The fiscal year starts from April, so we return the year range.
    return startYear + "-" + (startYear + 1);
}
function DeleteOrderItem(x,RowNo) {
    var ObjCurrRow = $('#ddlItemName' + RowNo).closest('tr');

    var TotalRowCount = $('#tblorderbooking tbody')[0].rows.length;

    if (TotalRowCount <= 1) {
        toastr.error("Please delete whole record from Order List!");
        return false;
    }
    
    //var VisitOrderDetails_Code = ObjCurrRow.find('td:eq(' + Indx_TblOrder.VisitDetailsCode + ')')[0].getElementsByTagName('input')[0].value;
    var VisitOrderDetails_Code = $('#txtVisitDetailsCode' + RowNo).val();
    

    var ModuleName = "Direct Order Entry",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    var OptionName = 'DELETE';
    VisitOrderEntryService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {

        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            const alertCls = confirm("Are you sure you want to delete this item?");
            if (alertCls) {
                VisitOrderEntryService.DeleteVisitOrderDetails(VisitOrderDetails_Code, 'Wrong Entry').then(function (response) {
                    if (response.Status === 'Y') {
                        toastr.success(response.Msg);
                        PopulateData();
                    } else {
                        toastr.error(response.Msg);
                    }
                });
            }
        }
    });
}


function ShowStockValueByItemSizeThk(x,RowNo) {
    var AccountDesp = $('#ddlCustomerName option:selected').text();// $('#txtDealer').val();
    var ObjCurrRow = $('#ddlItemName' + RowNo).closest('tr'); 
    //var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
    var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ') select option:selected').text();
    //var ItemMasterCode = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemMasterCode + ')')[0].getElementsByTagName('input')[0].value;
    var ItemMasterCode = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ') select option:selected').val();

    var dtDate = new Date().toISOString().split("T")[0];
    var ItemMaster_Codes = '';
    var Size = '';
    var Thicknessdesp = '';
    var SizeDesp = '';
    var Mode = 'Stock';
    var GodownMaster_Codes = '0';
    var StockDependOnParameters = 'NA';
    var OtherParameters = '';
    var ItemSizeMaster_Code = '0';

    var ShowSizeButton = $('#toggleSwitch').is(':checked');
    if (ShowSizeButton == true) {
        StockDependOnParameters = 'NA';
        //SizeDesp = ObjCurrRow.find('td:eq(' + Indx_TblOrder.SizeDesp + ')')[0].getElementsByTagName('input')[0].value;
        SizeDesp = ObjCurrRow.find('td:eq(' + Indx_TblOrder.SizeDesp + ') select option:selected').text();
    } else {
        StockDependOnParameters = 'SIZE,THICKNESS';
        //Size = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Size + ')')[0].getElementsByTagName('input')[0].value;
        Size = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Size + ') select option:selected').text();
        //Thicknessdesp = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Thickness + ')')[0].getElementsByTagName('input')[0].value;
        Thicknessdesp = ObjCurrRow.find('td:eq(' + Indx_TblOrder.Thickness + ') select option:selected').text();
    }
    VisitOrderEntryService.GetLogicalStock(dtDate, ItemMasterCode, Size, Thicknessdesp, AccountDesp, Mode, GodownMaster_Codes, StockDependOnParameters, OtherParameters, ItemSizeMaster_Code).then(function (response) {


        if (response.length > 0) {

            var filteredResponse = response.filter(function (record) {
                return record.BalanceQty > 0 && record.SIZE === Size && record.THICKNESS === (Thicknessdesp + ' MM');
            });
            let filteredResponseBySizeDesp = response.filter(function (record) {
                return record.BalanceQty > 0 && record.SizeDesp === SizeDesp;
            });
            if (filteredResponse.length > 0) {
                ObjCurrRow.find('td:eq(' + Indx_TblOrder.Stock + ')')[0].getElementsByTagName('input')[0].value = filteredResponse[0].BalanceQty;
            } else if (filteredResponseBySizeDesp.length > 0 && StockDependOnParameters == 'NA') {
                ObjCurrRow.find('td:eq(' + Indx_TblOrder.Stock + ')')[0].getElementsByTagName('input')[0].value = filteredResponseBySizeDesp[0].BalanceQty;
            }
            else {
                ObjCurrRow.find('td:eq(' + Indx_TblOrder.Stock + ')')[0].getElementsByTagName('input')[0].value = 0;
            }
           
        } 
    });
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
//function GetLatestPriceListByItemName(x, RowNo) {
//    var ObjCurrRow = $(x).closest('tr');
//    //var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
//    var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ') select option:selected').text();
//    var arrayList_ddlZonePriceList = [];
//    VisitOrderEntryService.GetLatestPriceListByItemName(ItemName).then(function (response) {
//        var defaultValue = '';
//        if (response.length > 0) {
            
//            response = response.map((item) => ({
//                key: item.ZoneMaster_Code, value: item.ZoneName
//            }));
//            arrayList_ddlZonePriceList = response;

//            BindSelect2FromDataList($('#ddlZonePriceList'), arrayList_ddlZonePriceList, "FirstItemSelected", "100%");
//            }
       
//    });


//}
//function GetBasicRateFromPriceList(x, RowNo) {
//    var ObjCurrRow = $(x).closest('tr');
//    //var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
//    var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ') select option:selected').text();
//    //var AccountDesp = $("#txtDealer").val();
//    var AccountDesp = $('#ddlCustomerName option:selected').text()
//    const now = new Date();
//    const hours = now.getHours().toString().padStart(2, '0');
//    const minutes = now.getMinutes().toString().padStart(2, '0');


//    const formattedDate = ('0' + now.getDate()).slice(-2) + '/' +
//        ('0' + (now.getMonth() + 1)).slice(-2) + '/' +
//        now.getFullYear();

//    VisitOrderEntryService.GetBasicRateFromPriceList(convertDateFormat(formattedDate), ItemName, AccountDesp).then(function (response) {

//        if (response.length > 0) {

//            $('#txtBasicRate' + RowNo).val(response[0].BasicRateFromPriceList);

//        }

//    });


//}
function GetDistributorDealerList() {
    //var AccountDesp = $('#txtDealer').val();
    var AccountDesp = $('#ddlCustomerName option:selected').text()
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
        if (confirm("Do you want to copy delivery address in all row ?") == true) {
            let allDeliveryAddressRows = $('input[name="txtDeliveryAddress"]'); 

            allDeliveryAddressRows.each(index => {
                
                $('#txtDeliveryAddress' + (index+1)).val(name);
                $('#hdnAddressCode' + (index+1)).val(recordID);
            })
           
        } else {
            $('#txtDeliveryAddress' + RowNo).val(name);
            $('#hdnAddressCode' + RowNo).val(recordID);
           
        }
        CloseDeliveryAddressModal();
    } else {
        alert('No record selected!');
    }
}
function SelectAddressNewRow() {
    var selectedRecord = $('input[name="record"]:checked');
    var RowNo = $('#hdnRowNo').val();
    // Check if a record is selected
    if (selectedRecord.length > 0) {
        var recordID = selectedRecord.val();  // Get the value of the selected radio button
        var recordRow = selectedRecord.closest('tr');  // Get the closest row for the selected radio button
        var name = recordRow.find('td:nth-child(2)').text(); // Get the name from the 3rd column
        if (confirm("Do you want to copy delivery address in all row ?") == true) {
        let allDeliveryAddressRows = $('input[name="txtDeliveryAddress"]'); 

            allDeliveryAddressRows.each(index => {
                
                $('#txtDeliveryAddress' + (index+1)).val(name);
                $('#hdnAddressCode' + (index+1)).val(recordID);
            })
           
    }
    else
    {
            $('#txtDeliveryAddress' + RowNo).val(name);
            $('#hdnAddressCode' + RowNo).val(recordID);
           
    }
        CloseDeliveryAddressModal();
    } else {
       // alert('No record selected!');
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
    VisitOrderEntryService.GetFixedParameter().then(function (response) {

        if (response.length > 0) {

            sessionStorage.setItem('FixedParameterCreditLimit', JSON.stringify(response[0]));

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
    //var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
    var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ') select option:selected').text();
    //var ItemSizeMaster_Code = $('#hdnItemSizeMasterCode' + RowNo).val();
    var ItemSizeMaster_Code = ObjCurrRow.find('td:eq(' + Indx_TblOrder.SizeDesp + ') select option:selected').val();
    if (ItemSizeMaster_Code == undefined || ItemSizeMaster_Code == null || ItemSizeMaster_Code == "") {
        ItemSizeMaster_Code = 0;
    }
    var selectedCode = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ') select option:selected').val(); //0;
    //$('#listItem option').each(function () {
    //    if ($(this).val() === ItemName) {
    //        // Get the code (data-code attribute)
    //        selectedCode = $(this).data('code');
    //    }
    //});
    InitSizeControl(selectedCode, ItemSizeMaster_Code, "SizeCallBack", RowNo);

}
async function SizeCallBack() {
    //alert(SizeControl_NewSizeMaster_Code + 'SizeDesp:' + SizeControl_NewSizeDesp);

    var RowNo = $('#hfRow_Id').val();

    //$('#hdnItemSizeMasterCode' + RowNo).val(SizeControl_NewSizeMaster_Code); 
    //$('#txtSizeDesp' + RowNo).val(SizeControl_NewSizeDesp);
    //$('#txtSizeDesp').attr('title', SizeControl_NewSizeDesp);
    

    //var ItemName = $('#txtItemName' + RowNo).val();
    var ItemName = $('#ddlItemName' + RowNo + ' option:selected').text();
   // var CustomerName = $('#txtDealer').val();
    var CustomerName = $('#ddlCustomerName option:selected').text()
    let BasicRateUOM = $('#txtRateUnit' + RowNo)[0].value;
    //G_BasicRateUOM

    let response1 = await VisitOrderEntryService.GetItemSizeMasterList(ItemName)
        
    if (response1.length > 0) {
        response1 = response1.map((item) => ({
            key: item.Code, value: item.SizeDesp
        }));
        

        BindSelect2FromDataList($('#ddlItemSizeMaster' + RowNo), response1, "FirstItemZero", "100%");

        BizSolHelperFunction.SelectOptionByText('ddlItemSizeMaster' + RowNo, SizeControl_NewSizeDesp);

        ShowStockValueByItemSizeThk('x', RowNo);
    }

    VisitOrderEntryService.GetBasicRateExtraCharges(ItemName, "", "", CustomerName, SizeControl_NewSizeMaster_Code, BasicRateUOM).then(function (response) {

        if (response.length > 0) {

            $('#txtBasicRate' + RowNo).val(response[0].BasicRate);
            $('#txtExtraCharges' + RowNo).val(response[0].ExtraCharges);

        }
    });

}

function GetBasicRateExtraCharges(x,RowNo) {

  
    //var ItemName = $('#txtItemName' + RowNo).val();
    //var CustomerName = $('#txtDealer').val();
    var ItemName = $('#ddlItemName' + RowNo + ' option:selected').text();
    var CustomerName = $('#ddlCustomerName option:selected').text();
   
    var Size = $('#ddlItemSize' + RowNo+' option:selected').text();
    var Thk = $('#ddlItemThickness' + RowNo + ' option:selected').text();
    let BasicRateUOM = $('#txtRateUnit' + RowNo)[0].value;
    //G_BasicRateUOM

    if (typeof ItemName == undefined || ItemName == "") {
        return;
    }
    VisitOrderEntryService.GetBasicRateExtraCharges(ItemName, Size, Thk, CustomerName, 0, BasicRateUOM).then(function (response) {

        if (response.length > 0) {

            $('#txtBasicRate' + RowNo).val(response[0].BasicRate);
            $('#txtExtraCharges' + RowNo).val(response[0].ExtraCharges);
            CalculateAmount(x);
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
function InitCheckCreditLimitsControl(AccountMaster_Code, Amount, PreviousAmount, Source, PasswordsCodeRs, PasswordsCodeDays, ShowFormDialog, LedgerClosing, OverDueAmount
    , ShowOnlyOutstandingInfo, Log_OnLineVerification_Code, OnlyCheckCreditLimit, CheckBillingWithoutAdvance, AdvancePayPercentage
    , EntryDesp, MasterTableCode, BuyerPOMaster_Code, CallBackFunctionName_btnDone, Code, Mode, AskPassword, AskRemark) {


    var url = baseUrl + '/CustomControl/CheckCreditLimits';

    $('#DivCheckCreditLimitsModal').load(url, {
                                                  AccountMaster_Code:AccountMaster_Code
                                                , Amount:Amount
                                                , PreviousAmount:PreviousAmount
                                                , Source:Source
                                                , PasswordsCodeRs:PasswordsCodeRs
                                                , PasswordsCodeDays:PasswordsCodeDays
                                                , ShowFormDialog:ShowFormDialog
                                                , LedgerClosing:LedgerClosing
                                                , OverDueAmount:OverDueAmount
                                                , ShowOnlyOutstandingInfo:ShowOnlyOutstandingInfo
                                                , Log_OnLineVerification_Code:Log_OnLineVerification_Code
                                                , OnlyCheckCreditLimit:OnlyCheckCreditLimit
                                                , CheckBillingWithoutAdvance:CheckBillingWithoutAdvance
                                                , AdvancePayPercentage:AdvancePayPercentage
                                                , EntryDesp:EntryDesp
                                                , MasterTableCode:MasterTableCode
                                                , BuyerPOMaster_Code: BuyerPOMaster_Code
                                                , CallBackFunctionName_btnDone: CallBackFunctionName_btnDone
                                                , Code: Code
                                                , Mode: Mode
                                                , AskPassword: AskPassword
                                                , AskRemark: AskRemark
                                        });

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
    //var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
    var ItemName = ObjCurrRow.find('td:eq(' + Indx_TblOrder.ItemName + ') select option:selected').text();
    let arrayList_ItemSizeMaster = [];
    VisitOrderEntryService.GetItemSizeMasterList(ItemName).then(function (response) {
        var defaultValue = '';
        var defaultCode = 0;
        if (response.length > 0) {
            //$('#listItemSizeMaster_' + RowNo + ' option').empty();
            //var option = '';
            //for (var i = 0; i < response.length; i++) {
            //    if (i == 0) {
            //        defaultValue = response[0].SizeDesp;
            //        defaultCode = response[0].Code;
            //    }
            //    option += '<option data-code="' + response[i].Code + '">' + response[i].SizeDesp + '</option>'
            //}
            //$('#listItemSizeMaster_' + RowNo)[0].innerHTML = option;
            
            response = response.map((item) => ({
                key: item.Code, value: item.SizeDesp
            }));
            arrayList_ItemSizeMaster = response;

            BindSelect2FromDataList($('#ddlItemSizeMaster' + RowNo), arrayList_ItemSizeMaster, "FirstItemZero", "100%");
        }
        //if (param_VisitMode == 'New') {
        //$('#txtSizeDesp' + RowNo).val(defaultValue);
        //$('#hdnItemSizeMasterCode' + RowNo).val(defaultCode);
        //}
    });


}

function GetSelectedItemSizeMasterCode(RowNo) {

    var ParameterCode = 0;

   // var ItemSize = $('#txtSizeDesp' + RowNo).val();

    var ItemSize = $('#ddlItemSizeMaster' + RowNo + ' option:selected').text();
    ParameterCode = $('#ddlItemSizeMaster' + RowNo + ' option:selected').val();
    //$('#listItemSizeMaster_' + RowNo + ' option').each(function () {
    //    if ($(this).val() === ItemSize) {
    //        // Get the code (data-code attribute)
    //        var selectedCode = $(this).data('code');

    //        ParameterCode = selectedCode;
    //    }
    //});
    //$('#hdnItemSizeMasterCode' + RowNo).val(ParameterCode);
    //var ItemName = $('#txtItemName' + RowNo).val();
    var ItemName = $('#ddlItemName' + RowNo + ' option:selected').text();
    //var CustomerName = $('#txtDealer').val();
    var CustomerName = $('#ddlCustomerName option:selected').text()
    let BasicRateUOM = $('#txtRateUnit' + RowNo)[0].value;
    //G_BasicRateUOM

    VisitOrderEntryService.GetBasicRateExtraCharges(ItemName, '', '', CustomerName, ParameterCode, BasicRateUOM).then(function (response) {

        if (response.length > 0) {

            $('#txtBasicRate' + RowNo).val(response[0].BasicRate);
            $('#txtExtraCharges' + RowNo).val(response[0].ExtraCharges);

        }
    });
}

function getRateUnitListFromQtyConfig(RowNo) {

    var Qty_Config = JSON.parse(sessionStorage.getItem('QtyConfig'));
    var defaultValue = '';
    var inputString = Qty_Config.RateUnit;

    // Split the string by "/" and store it in an array
    var response = inputString.split('/');

    if (response.length > 0) {
        $('#listRateUnit option').empty();
        $('#listRateUnit').empty();
        $.each(response, function (index, value) {
            // Create a new <option> element for each item
            if (index == 0) {
                defaultValue = value;
                }
            $("#listRateUnit").append($('<option>', {
                value: value
            }));
        });
        if (RowNo > 0) {
            $('#txtRateUnit' + RowNo).val(defaultValue);
        }
        
    }
}
function SelectStockCheck(x) {
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMOrderEntryConfig'));
    var ObjCurrRow = $(x).closest('tr');
    if ($(x).val() > 0) {
        ObjCurrRow.find('td:eq(0)')[0].getElementsByTagName('input')[0].checked = true;
    }
    var Bal_Qty = ObjCurrRow.find("label").text();
    var isOEMClient = GetSelectedCustomerAccountNature() === 'OEM';

    var AlowCRMOrderBookingWithOutStock = 'N';
    try {
        var ItemMasterTable = JSON.parse(sessionStorage.getItem('ItemMasterTable'));
        var ItemMaster_Code = parseInt(ObjCurrRow[0].cells[Indx_Stock.ItemMaster_Code].innerText);
        var ItemSelectedObj = ItemMasterTable.find(function (i) { return i.Code === ItemMaster_Code; });
        if (typeof ItemSelectedObj !== 'undefined') {
            AlowCRMOrderBookingWithOutStock = ItemSelectedObj.AlowCRMOrderBookingWithOutStock || 'N';
        }
    } catch (e) { }

    if (CRM_Config.CheckLogicalStockLimit == 'Y' && !isOEMClient && AlowCRMOrderBookingWithOutStock !== 'Y') {
        if (parseFloat($(x).val()) > parseFloat(Bal_Qty)) {
            toastr.error("Qty Value shouldn't be greater than Balance Qty");
            $(x).val(0);
            ObjCurrRow.find('td:eq(0)')[0].getElementsByTagName('input')[0].checked = false;
        }
    }

}
function ResetStockQty(x) {
    var ObjCurrRow = $(x).closest('tr');
    if ($(x)[0].checked==false) {
        ObjCurrRow.find('input[name="txtStockQty"]').val(0);
    }


}

function ListValidation(inputElement, datalistElement) {
   
        var inputValue = $(inputElement).val();
        var datalistOptions = $(datalistElement).find('option').map(function () {
            return $(this).val();
        }).get();

        // Check if the input value is in the datalist options
        if (datalistOptions.includes(inputValue)) {
            return true; // Valid input
        } else {
            return false; // Invalid input
        }
    
}

function ValidateOverdueAmount() {

    if (ValidateData() == false) {
        return false;
    }
    var FixedParameterCreditLimit_Config = JSON.parse(sessionStorage.getItem('FixedParameterCreditLimit'));
    var TotalOrderAmount =parseFloat($('#txtAmountTotal')[0].innerText);
    var AccountMaster_Code = $('#ddlCustomerName option:selected').val();
    var Config_CheckCreditLimit = FixedParameterCreditLimit_Config[0].CreditLimitCheck_BuyerPO == undefined || FixedParameterCreditLimit_Config[0].CreditLimitCheck_BuyerPO == '' ? 'N' : FixedParameterCreditLimit_Config[0].CreditLimitCheck_BuyerPO;

    ///Config_CheckCreditLimit='R' means it will check credit limit only for Crm and Not Check in ERP

    if (Config_CheckCreditLimit == 'Y' || Config_CheckCreditLimit == 'R') {
        if (TotalOrderAmount > 0) {
            InitCheckCreditLimitsControl(AccountMaster_Code, TotalOrderAmount, 0, 'VISIT MASTER', 0, 0, 'Y', 0, 0, 'N', 0, 'N', 'N', 0, 'Y', 0, 0, 'SaveData',0,'','N','Y');
        }
    } else {
        SaveData();
    }
    
}

async function SetWeightInMTByPC(x,RowNo) {

    var ObjCurrRow = $(x).closest('tr');
    var QtyPC = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyPC + ')')[0].getElementsByTagName('input')[0].value;
   
    
    if (QtyPC == undefined || QtyPC == '') {
        QtyPC = 0;
    }
    

    var Qty = 0;
    //let ItemSizeMaster_Code = 4594;
    let ItemSizeMaster_Code = 0;
    ItemSizeMaster_Code = $('#ddlItemSizeMaster' + RowNo + ' option:selected').val();

    if (ItemSizeMaster_Code == undefined || ItemSizeMaster_Code == '') {
        ItemSizeMaster_Code = 0;
        return;
    }

   let response = await VisitOrderEntryService.GetWeightPerPCByItemSizeMasterCode(ItemSizeMaster_Code);

   if (response.length > 0) {
       ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyMT + ')')[0].getElementsByTagName('input')[0].value = parseFloat(QtyPC * response[0].WeightPerPC).toFixed(3);
       
   }

}
async function SetPCByWeightInMT(x, RowNo) {

    var ObjCurrRow = $(x).closest('tr');
    var QtyMT = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyMT + ')')[0].getElementsByTagName('input')[0].value;
   
    if (QtyMT == undefined || QtyMT == '') {
        QtyMT = 0;
    }
    

    
    //let ItemSizeMaster_Code = 4594;
    let ItemSizeMaster_Code = 0;
    ItemSizeMaster_Code = $('#ddlItemSizeMaster' + RowNo + ' option:selected').val();

    if (ItemSizeMaster_Code == undefined || ItemSizeMaster_Code == '') {
        ItemSizeMaster_Code = 0;
        return;
    }

    let response = await VisitOrderEntryService.GetWeightPerPCByItemSizeMasterCode(ItemSizeMaster_Code);

    if (response.length > 0) {
        ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyPC + ')')[0].getElementsByTagName('input')[0].value = parseInt(parseFloat(QtyMT).toFixed(3) / response[0].WeightPerPC);

    }

}

async function GetDefaultItemSizeMasterCode(x, RowNo) {

    let ItemMaster_Code = 0, Size = '', Thickness = '';

    ItemMaster_Code = $('#ddlItemName' + RowNo + ' option:selected').val();
    Size = $('#ddlItemSize' + RowNo + ' option:selected').text();
    Thickness = $('#ddlItemThickness' + RowNo + ' option:selected').text();


    if (ItemMaster_Code == undefined || ItemMaster_Code == '') {
        ItemMaster_Code = 0;
        return;
    }
    if (Size == undefined || Size == '') {
        return;
    }
    if (Thickness == undefined || Thickness == '') {
        return;
    }

    let response = await VisitOrderEntryService.GetDefaultItemSizeMasterCode(ItemMaster_Code, Size, Thickness);

    if (response.length > 0) {
        let element = $('#ddlItemSizeMaster' + RowNo); 
        element.append(new Option(response[0].Code, response[0].SizeDesp));
       
        $('#ddlItemSizeMaster' + RowNo).val(response[0].Code);
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

        SetWeightInMTByPC(x, RowNo);
    }
}

async function SetPCandWeightByLengthInMR(x, RowNo) {

    var ObjCurrRow = $(x).closest('tr');

    //var QtyMT = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyMT + ')')[0].getElementsByTagName('input')[0].value;
    //var QtyPC = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyPC + ')')[0].getElementsByTagName('input')[0].value;
    var QtyMR = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyMTR + ')')[0].getElementsByTagName('input')[0].value;

    if (QtyMR == undefined || QtyMR == '') {
        QtyMR = 0;
    }

    //let ItemSizeMaster_Code = 4594;
    let ItemSizeMaster_Code = 0;
    ItemSizeMaster_Code = $('#ddlItemSizeMaster' + RowNo + ' option:selected').val();

    if (ItemSizeMaster_Code == undefined || ItemSizeMaster_Code == '') {
        ItemSizeMaster_Code = 0;
        return;
    }

    let response = await VisitOrderEntryService.GetLengthByItemSizeMasterCode(ItemSizeMaster_Code);

    if (response.length > 0) {

        ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyPC + ')')[0].getElementsByTagName('input')[0].value = parseInt((1 / response[0].NumericValue) * QtyMR);
        SetWeightInMTByPC(x, RowNo);
    }

}

function SetMTRByPacking(x, RowNo) {

    var ObjCurrRow = $(x).closest('tr');
    var QtyBags = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyBags + ')')[0].getElementsByTagName('input')[0].value;


    if (QtyBags == undefined || QtyBags == '') {
        QtyBags = 0;
    }


    var Qty = 0;
    //let ItemSizeMaster_Code = 4594;

    let ItemMaster_Code = 0;

    let ItemMasterTable = JSON.parse(sessionStorage.getItem('ItemMasterTable'));
    ItemMaster_Code = $('#ddlItemName' + RowNo + ' option:selected').val();
    
    let ItemSelectedObj = ItemMasterTable.find(x => x.Code === parseInt(ItemMaster_Code));
    if (typeof ItemSelectedObj !== "undefined") {
        let Packing = parseInt(ItemSelectedObj.Packing);
        Qty = Packing * QtyBags
    }


    

    

    if (Qty > 0) {
        ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyMTR + ')')[0].getElementsByTagName('input')[0].value = Qty;
    } else {
        ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyMTR + ')')[0].getElementsByTagName('input')[0].value = 0;
    }

}

function GenerateTableHeaders() {
    var thead = $('#tblorderbooking thead tr');
    thead.empty();

    TblOrderColumns.forEach(function (columnName) {
        // Skip hidden columns or add logic to determine display
        if (['VisitDetailsCode', 'IsNewRow', 'SizeApplicable', 'ThkApplicable',
            'LenApplicable', 'ItemMasterCode', 'UOMDecimalUnit'].indexOf(columnName) === -1) {
            thead.append('<th>' + BizSolHelperFunction.ToWithSpace(columnName)  + '</th>');
        }
    });
}

function AddNewDealer(element) {
    // Find the current row and try to pick distributor/dealer info from the row
    var $row = $(element).closest('tr');
    //var distributorDealerCode = $row.find("input[id^='hdnDistributorDealerCode']").val() || '';
    //var dealerNameFromRow = $row.find("input[id^='txtDealerNameList']").val() || '';
    var dealerName = $('#ddlCustomerName option:selected').text() || '';
    var distributorDealerCode = $('#ddlCustomerName option:selected').val() || '';

    // Build encoded query parameters following existing project pattern
    var codes = window.btoa(0); // Code = 0 for new
    var Mode = window.btoa("New");
    var disCode = window.btoa(distributorDealerCode || '');
    var Name = window.btoa(dealerName || '');

    var url = baseUrl + "/MarketingMasters/DealerMaster/DealerMaster?Code=" + codes + "&Mode=" + Mode + "&Distributor_Code=" + disCode + "&Distributor_Name=" + Name;

    // Remove any existing modal we might have created previously
    if ($('#modalAddDealer').length) {
        $('#modalAddDealer').remove();
    }

    // Create a bootstrap modal that hosts the DealerMaster page inside an iframe
    var modalHtml = ''
        + '<div class="modal fade" id="modalAddDealer" tabindex="-1" role="dialog" aria-hidden="true">'
        + '  <div class="modal-dialog modal-xl" role="document" style="max-width:1200px;">'
        + '    <div class="modal-content">'
        + '      <div class="modal-header">'
        + '        <h5 class="modal-title">Create New Dealer</h5>'
        + '        <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
        + '      </div>'
        + '      <div class="modal-body p-0" style="height:80vh;">'
        + '        <iframe id="iframeAddDealer" src="' + url + '" frameborder="0" style="width:100%; height:100%;"></iframe>'
        + '      </div>'
        + '    </div>'
        + '  </div>'
        + '</div>';

    $('body').append(modalHtml);

    // Show modal (supporting projects that use bootstrap's jQuery modal plugin)
    $('#modalAddDealer').modal({
        backdrop: 'static',
        keyboard: false
    });
    $('#modalAddDealer').modal('show');

    // When the modal is closed remove it and try to refresh dealer list in the row if a global function exists
    $('#modalAddDealer').on('hidden.bs.modal', function () {
        setTimeout(function () {
            // Cleanup
            $('#modalAddDealer').remove();
            // If there's a RefreshDealerList function elsewhere in the app, call it to update the row's dealer list
            if (typeof RefreshDealerList === 'function') {
                try { RefreshDealerList(element); } catch (e) { console.warn('RefreshDealerList failed:', e); }
            }
        }, 100);
    });
}

function RefreshDealerList(element) {
    GetDistributorDealerList();
}
let sellogicaltableColumnstimer = setInterval(SetLogicalStockTableColumns, 100);
window.GetAccountMasterDetails = GetAccountMasterDetails;
window.GetSelectedCustomerBillApplicable = GetSelectedCustomerBillApplicable;
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
//window.GetLatestPriceListByItemName = GetLatestPriceListByItemName;
window.GetPaymentTerms = GetPaymentTerms;
//window.GetBasicRateFromPriceList = GetBasicRateFromPriceList;
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
window.ShowLogicalStockModal = ShowLogicalStockModal;
window.CloseLogicalStockModal = CloseLogicalStockModal;
window.SelectStockRows = SelectStockRows;
window.getRateUnitListFromQtyConfig = getRateUnitListFromQtyConfig;
window.SelectStockCheck = SelectStockCheck;
window.ResetStockQty = ResetStockQty;
window.ShowStockValueByItemSizeThk = ShowStockValueByItemSizeThk;
window.OnChange_ddlItemName = OnChange_ddlItemName;
window.OnChange_ddlItemSize = OnChange_ddlItemSize;
window.OnChange_ddlItemThickness = OnChange_ddlItemThickness;
window.OnChange_ddlItemSizeMaster = OnChange_ddlItemSizeMaster;
window.DeleteOrderItem = DeleteOrderItem;
window.InitCheckCreditLimitsControl = InitCheckCreditLimitsControl;
window.ValidateOverdueAmount = ValidateOverdueAmount;
window.OnChange_RateUnit = OnChange_RateUnit;
window.SetWeightInMTByPC = SetWeightInMTByPC;
window.SetPCByWeightInMT = SetPCByWeightInMT;
window.GetDefaultItemSizeMasterCode = GetDefaultItemSizeMasterCode;
window.SetPCandWeightByLengthInMR = SetPCandWeightByLengthInMR;
window.SetMTRByPacking = SetMTRByPacking;
window.AddNewDealer = AddNewDealer;
window.RefreshDealerList = RefreshDealerList;