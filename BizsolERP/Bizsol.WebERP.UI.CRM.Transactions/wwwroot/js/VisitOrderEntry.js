import { VisitOrderEntryService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/VisitOrderEntryService.js';

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
    LenApplicable: 24,
    ItemMasterCode: 25,
    UOMDecimalUnit:26
}

$(document).ready(function () {
    $("#ERPHeading").text("Direct Order Entry");
    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var UserMaster_Code = authKeyData.UserMaster_Code;
    GetUserDetails();
    // GetActualLocation();
    GetNestedDealerList();
    GetCRMFixedParameterConfig();
    GetFreightTypeList();
    GetFreightList();
    GetZoneMasterList();

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
        AddFiveNewRows();

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

    SetOrderBookingTableHeaderAsPerConfig();
    $('#txtDeliveryDays').val(2);


    SetFieldsAsPerConfig();
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
function GetZoneMasterList() {
    VisitOrderEntryService.GetZoneMasterList().then(function (response) {

        if (response.length > 0) {
            $('#listZone option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {

                option += '<option text="' + response[i].Code + '">' + response[i].Field + '</option>'
            }
            $('#listZone')[0].innerHTML = option;

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

                option += '<option text="' + response[i].Code + '">' + response[i].ItemName + '</option>'
            }
            $('#listItem')[0].innerHTML = option;

        }

    });
}

function SetBlankOrderBookingTable() {
   
    $("#tblorderbooking tbody").empty();
}

function AddFiveNewRows() {
    var VisitType = 'Order';
    var EntryType = 'O';

    var AccountDesp = $("#txtDealer").val();
    if (AccountDesp == "") {
        toastr.error("Please Select Dealer Name!")
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
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMConfig'));


    var QtyPCHeader = CRM_Config.QtyPCHeader;
    var QtyMTRHeader = CRM_Config.QtyMTRHeader;
    var QtyMTHeader_MT = CRM_Config.QtyMTHeader_MT;
    var VisitType = 'Order';
    var EntryType = 'O';
    var ShowSizeButton = $('#toggleSwitch').is(':checked');
    var PageMode = 'New'; // New/Edit/View
    var tbItemConsumeRowNo = 0;


    

    //var table = document.getElementById("tblorderbooking").getElementsByTagName('tbody')[0];
    var tbody = $('#tblorderbooking tbody')[0];
    var theadRow = $('#tblorderbooking thead tr')[0];
    var rowNO = tbody.rows.length;

    var row = tbody.insertRow(rowNO);
    tbItemConsumeRowNo = rowNO+1;

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


    var PickSizeParameterasPerChart = CRM_Config.PickSizeParameterasPerChart;
    Consignee.innerHTML = '<input type="text" id="txtConsignee' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtConsignee" placeholder="" onclick="$(this).val(\'\')" autocomplete="off"   required>';
    DeliveryAddress.innerHTML = '<input type="text" id="txtDeliveryAddress' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryAddress" placeholder="" onclick="$(this).val(\'\')" autocomplete="off"  required>';
    ItemName.innerHTML = '<input type="text"  id="txtItemName' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtItemName" placeholder="" list="listItem" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetItemSizeList(this,' + tbItemConsumeRowNo + ');GetUOM('+ tbItemConsumeRowNo + ')" required>';
    Size.innerHTML = '<datalist id="listItemSize_' + tbItemConsumeRowNo + '"></datalist> <input type="text"  id="txtSize' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtSize" placeholder="" list="listItemSize_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="GetItemThicknessList(this,' + tbItemConsumeRowNo + ')" required>';
    Thickness.innerHTML = '<datalist id="listItemThickness_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtThickness' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtThickness" placeholder="" list="listItemThickness_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    SizeDesp.innerHTML = '<input type="text"  id="txtSizeDesp' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtSizeDesp" placeholder="" list="listItemName" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    UOM.innerHTML = '<datalist id="listUOM_' + tbItemConsumeRowNo + '"></datalist><input type="text"  id="txtUOM' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtUOM" placeholder="" list="listUOM_' + tbItemConsumeRowNo + '" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    Stock.innerHTML = '<input type="text"  id="txtStock' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtStock" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    OrderQtyPC.innerHTML = '<input type="text"  id="txtOrderQtyPC' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderQtyPC" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    OrderQtyMT.innerHTML = '<input type="number"  id="txtOrderQtyMT' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderQtyMT" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="CalculateAmount(this);" required>';
    OrderQtyMTR.innerHTML = '<input type="number"  id="txtOrderQtyMTR' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderQtyMTR" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    OrderUOM.innerHTML = '<input type="text"  id="txtOrderUOM' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderUOM" placeholder="" list="listUOM" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    OrderQTY.innerHTML = '<input type="number"  id="txtOrderQTY' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderQTY" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    BasicRate.innerHTML = '<input type="number"  id="txtBasicRate' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtBasicRate" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="CalculateAmount(this);" required>';
    ExtraCharges.innerHTML = '<input type="number"  id="txtExtraCharges' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtExtraCharges" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    OrderRate.innerHTML = '<input type="number"  id="txtOrderRate' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtOrderRate" placeholder=""autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    Amount.innerHTML = '<input type="number"  id="txtAmount' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm " disabled name="txtAmount" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    DeliveryDate.innerHTML = '<input type="date"  id="txtDeliveryDate' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtDeliveryDate" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    Remarks.innerHTML = '<input type="text"  id="txtRemarks' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtRemarks" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    Delete.innerHTML = '<a id="btnDelete" class=" btn btn-danger btn-sm waves-effect waves-light disabled" title="Delete" onclick="DeleteOrderItem(this);"><i class="fa fa-times" aria-hidden="true"></i></a>';

    VisitDetailsCode.innerHTML = '<input type="text"  id="txtVisitDetailsCode' + tbItemConsumeRowNo + '"  name="txtVisitDetailsCode" placeholder="" value=0  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    IsNewRow.innerHTML = '<input type="text"  id="txtIsNewRow' + tbItemConsumeRowNo + '"  name="txtIsNewRow" placeholder="" autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    SizeApplicable.innerHTML = '<input type="text"  id="txtSizeApplicable' + tbItemConsumeRowNo + '"  name="txtSizeApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    ThkApplicable.innerHTML = '<input type="text"  id="txtThkApplicable' + tbItemConsumeRowNo + '" name="txtThkApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    LenApplicable.innerHTML = '<input type="text"  id="txtLenApplicable' + tbItemConsumeRowNo + '"  name="txtLenApplicable" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    ItemMasterCode.innerHTML = '<input type="text"  id="txtItemMasterCode' + tbItemConsumeRowNo + '"  name="txtItemMasterCode" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';
    UOMDecimalUnit.innerHTML = '<input type="text"  id="txtUOMDecimalUnit' + tbItemConsumeRowNo + '"  name="UOMDecimalUnit" placeholder=""  autocomplete="off" onclick="$(this).val(\'\')"  onchange="" required>';

    $('#txtDeliveryDate' + tbItemConsumeRowNo).val(new Date().toISOString().split("T")[0]);
}


function CalculateAmount(x) {
    var ObjCurrRow = $(x).closest('tr');
    var QtyMT = ObjCurrRow.find('td:eq(' + Indx_TblOrder.OrderQtyMT + ')')[0].getElementsByTagName('input')[0].value;
    var BasicRate = ObjCurrRow.find('td:eq(' + Indx_TblOrder.BasicRate + ')')[0].getElementsByTagName('input')[0].value;

    if (BasicRate.trim() == "") {
        BasicRate = 0;
    } else if (Number(parseFloat(BasicRate).toFixed(2)) > 0) {
        BasicRate = parseFloat(BasicRate).toFixed(2);
    }
    if (QtyMT.trim() == "") {
        QtyMT = 0;
    } else if (Number(parseFloat(QtyMT).toFixed(2)) > 0) {
        QtyMT = parseFloat(QtyMT).toFixed(2);
    }

    var Amount = parseFloat(QtyMT * BasicRate).toFixed(2);

    ObjCurrRow.find('td:eq(' + Indx_TblOrder.Amount + ')')[0].getElementsByTagName('input')[0].value = Amount;
}

function ValidateData() {

    var tbodyOrderDetail = document.getElementById("tblorderbooking").getElementsByTagName('tbody')[0];
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMConfig'));

    var QtyPCHeader = CRM_Config.QtyPCHeader;
    var QtyMTRHeader = CRM_Config.QtyMTRHeader;
    var QtyMTHeader_MT = CRM_Config.QtyMTHeader_MT;
    var Valid = true;
    var MsgStr = "";
    var newLine = "\r\n";
    $("#tblorderbooking tbody tr").each(function (index, row) {
        var ItemName = '';
        var QtyMT = 0;
        var BasicRate = 0;
        var Amount = 0;
        var DeliveryDate = new Date().toISOString().split("T")[0];
        var Remarks = '';


        ItemName = $(this).find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
        QtyMT = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyMT + ')')[0].getElementsByTagName('input')[0].value;
        BasicRate = $(this).find('td:eq(' + Indx_TblOrder.BasicRate + ')')[0].getElementsByTagName('input')[0].value;
        Amount = $(this).find('td:eq(' + Indx_TblOrder.Amount + ')')[0].getElementsByTagName('input')[0].value;
        DeliveryDate = $(this).find('td:eq(' + Indx_TblOrder.DeliveryDate + ')')[0].getElementsByTagName('input')[0].value;
        Remarks = $(this).find('td:eq(' + Indx_TblOrder.Remarks + ')')[0].getElementsByTagName('input')[0].value;

        if (Amount > 0) {
            if (ItemName == '') {
                
                MsgStr = "Invalid Item Name at Row No " + index + "!" + newLine;
                Valid = false;
            }
            if (BasicRate == '' || BasicRate <= 0) {
                
                MsgStr = "Invalid Basic Rate at Row No " + index + "!" + newLine;
                Valid = false;
            }
            if (QtyMT == '' || QtyMT <= 0) {
                
                MsgStr = "Invalid Qty MT at Row No " + index + "!" + newLine;
                Valid = false;
            }
            if (DeliveryDate == '') {
               
                MsgStr = "Invalid Delivery Date at Row No " + index + "!" + newLine;
                Valid = false;
            }
        }


    });

    if (Valid == false) {
        toastr.error(MsgStr);
        return false;
    }


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

    visitMasterRow["code"] = 0;
    visitMasterRow["date"] = new Date().toISOString().split("T")[0];
    visitMasterRow["visitType"] = 0;
    visitMasterRow["accountDesp"] = $("#txtDealer").val() !== null ? $("#txtDealer").val() : '';
    visitMasterRow["photo"] = '';
    visitMasterRow["location"] = $("#txtAddLocation").val() !== null ? $("#txtAddLocation").val() : '';
    visitMasterRow["checkIn"] = $("#txtCheckInTime").val() !== null ? $("#txtCheckInTime").val() : '';
    visitMasterRow["checkOut"] = '';
    visitMasterRow["remarks"] = $("#txtRemarks").val() !== null ? $("#txtRemarks").val() : '';
    visitMasterRow["routePlanMaster_code"] = 0;
    visitMasterRow["nextVisitDate"] = new Date().toISOString().split("T")[0];
    visitMasterRow["verified"] ='N';
    visitMasterRow["paymentTermsMasterCode"] = 0;
    visitMasterRow["deliveryDays"] = $("#txtDeliveryDays").val() !== null ? $("#txtDeliveryDays").val() : 0;
    visitMasterRow["freightCondition"] = $("#txtFreightType").val() !== null ? $("#txtFreightType").val() : '';
    visitMasterRow["orderDealerName"] = $("#txtDealer").val() !== null ? $("#txtDealer").val() : '';
    visitMasterRow["userMasterCode"] = 0;
    visitMasterRow["checkInLocation"] = $("#txtCurrentLocation").val() !== null ? $("#txtCurrentLocation").val() : '';
    visitMasterRow["checkOutLocation"] = 0;
    visitMasterRow["mRateUnit"] = '';
    visitMasterRow["creditDays"] = 0;
    visitMasterRow["freight"] = $("#txtlistFreight").val() !== null ? $("#txtlistFreight").val() : '';
    visitMasterRow["dispatchFrom"] = '';
    visitMasterRow["buyerPONo"] = 0;
    visitMasterRow["buyerPODate"] = new Date().toISOString().split("T")[0];
    visitMasterRow["zoneName"] = $("#txtZone").val() !== null ? $("#txtZone").val() : '';

    visitMasterData.push(visitMasterRow);
    $("#tblorderbooking tbody tr").each(function (index, row) {
        var ItemName = '';
        var QtyMT = 0;
        var BasicRate = 0;
        var Amount = 0;
        var DeliveryDate = new Date().toISOString().split("T")[0];
        var Remarks = '';


        ItemName = $(this).find('td:eq(' + Indx_TblOrder.ItemName + ')')[0].getElementsByTagName('input')[0].value;
        QtyMT = $(this).find('td:eq(' + Indx_TblOrder.OrderQtyMT + ')')[0].getElementsByTagName('input')[0].value;
        BasicRate = $(this).find('td:eq(' + Indx_TblOrder.BasicRate + ')')[0].getElementsByTagName('input')[0].value;
        Amount = $(this).find('td:eq(' + Indx_TblOrder.Amount + ')')[0].getElementsByTagName('input')[0].value;
        DeliveryDate = $(this).find('td:eq(' + Indx_TblOrder.DeliveryDate + ')')[0].getElementsByTagName('input')[0].value;
        Remarks = $(this).find('td:eq(' + Indx_TblOrder.Remarks + ')')[0].getElementsByTagName('input')[0].value;

        if (Amount > 0) {
            var rowData = {};

            rowData["code"] = 0;
            rowData["visitMaster_Code"] = 0;
            rowData["size"] = '';
            rowData["thickness"] = '';
            rowData["lengthDesp"] = '';
            rowData["orderQty"] = QtyMT;

            rowData["rate"] = 0;
            rowData["discount"] = 0;
            rowData["amount"] = Amount;
            rowData["remarks"] = Remarks;
            rowData["basicRate"] = BasicRate;
            rowData["extraCharges"] = 0;

            rowData["itemDesp"] = ItemName;
            rowData["logicalStock"] = 0;
            rowData["isNewRow"] = 'Y';
            rowData["itemParameterValueMasterSizeCode"] = 0;
            rowData["itemParameterValueMasterTHKCode"] = 0;
            rowData["itemParameterValueMasterLengthCode"] = 0;

            rowData["deliveryLocation"] = 0;
            rowData["gstInOrder"] = '';
            rowData["qtyPC"] = 0;
            rowData["rateUnit"] = '';
            rowData["otherCharges"] = 0;
            rowData["qtyMR"] = 0;

            rowData["sizeDesp"] = '';
            rowData["itemSizeMasterCode"] = 0;
          

            visitOrderDetailsData.push(rowData);
        }
    });

    //allTablesData.push(OrdertableData);

    var visitOtherPartyRow = {};

    visitOtherPartyRow["code"]=0;
    visitOtherPartyRow["visitMaster_code"]=0;
    visitOtherPartyRow["partyName"]='';
    visitOtherPartyRow["stockQty"]=0;
    visitOtherPartyRow["saleQty"]=0;
    visitOtherPartyRow["remarks"]='';
    visitOtherPartyRow["price"]=0


    visitOtherPartyData.push(visitOtherPartyRow);

    var visitPaymentRow={};
    visitPaymentRow["code"]=0;
    visitPaymentRow["visitMaster_code"]=0;
    visitPaymentRow["paymentMode"]='';
    visitPaymentRow["paymentDate"]="2024-12-02T13:04:04.192Z",
    visitPaymentRow["refferenceNo"]='';
    visitPaymentRow["paymentAmount"]=0;

    visitPaymentData.push(visitPaymentRow);

    var visitCheckListRow={};

    visitCheckListRow["code"]=0;
    visitCheckListRow["visitMaster_code"]=0;
    visitCheckListRow["checkListMaster_code"]=0;
    visitCheckListRow["fieldValue"]=''

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
            }
        }

    });
}

function GetCRMFixedParameterConfig() {
    VisitOrderEntryService.GetCRMFixedParameterConfig().then(function (response) {

        if (response.length > 0) {

            sessionStorage.setItem('CRMConfig', JSON.stringify(response[0]));
        }

    });
}
function GetAccountMasterDetails() {


    var AccountDesp = $('#txtDealer').val();
    VisitOrderEntryService.GetAccountMasterDetails(AccountDesp).then(function (response) {

        if (response[1] != '') {
            var Address = response["AccountMaster"][0].Address1 + ',\n ' + response["AccountMaster"][0].Address2;

            $('#txtGSTNo').val(response["AccountMaster"][0].GSTNNo);
            $('#txtAddress').val(Address);
        }
    });

    GetDealerDetailsByDealerName();
    SetBlankOrderBookingTable();
    AddFiveNewRows();
    GetAccountDeliveryLocationDetails();
    SetOrderBookingTableHeaderAsPerConfig();
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


function GetItemSizeList(x,RowNo) {
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
                $('#listItemSize_' + RowNo+' option').empty();
                var option = '';
                for (var i = 0; i < response.length; i++) {

                    option += '<option text="' + response[i].ItemParameterValueMaster_Code_Size + '">' + response[i].SizeDesp + '</option>'
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
        VisitOrderEntryService.GetThkParameterAsPerChart(ItemName,Size).then(function (response) {
            if (response.length > 0) {
                $('#listItemThickness_' + RowNo + ' option').empty();
                var option = '';
                for (var i = 0; i < response.length; i++) {

                    option += '<option text="' + response[i].ItemParameterValueMaster_Code_THK + '">' + response[i].ThkDesp + '</option>'
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
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMConfig'));


    var QtyPCHeader = CRM_Config.QtyPCHeader;
    var QtyMTRHeader = CRM_Config.QtyMTRHeader;
    var QtyMTHeader_MT = CRM_Config.QtyMTHeader_MT;


    /// Hide Headers
    if (QtyPCHeader == '') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyPC + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderQtyPC + 1) + ")").css('display', 'none');
    }
    if (QtyMTRHeader == '') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyMTR + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderQtyMTR + 1) + ")").css('display', 'none');
    }
    if (QtyMTHeader_MT == '') {
        $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQtyMT + 1) + ")").css('display', 'none');
        $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderQtyMT + 1) + ")").css('display', 'none');
    }

    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Consignee + 1) + ")").css('display', 'none');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.DeliveryAddress + 1) + ")").css('display', 'none');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Size + 1) + ")").css('display', 'none');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Thickness + 1) + ")").css('display', 'none');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.SizeDesp + 1) + ")").css('display', 'none');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.UOM + 1) + ")").css('display', 'none');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Stock + 1) + ")").css('display', 'none');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderUOM + 1) + ")").css('display', 'none');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderRate + 1) + ")").css('display', 'none');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.ExtraCharges + 1) + ")").css('display', 'none');
    //$("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.Amount + 1) + ")").css('display', 'none');
    $("#tblorderbooking thead tr th:nth-child(" + (Indx_TblOrder.OrderQTY + 1) + ")").css('display', 'none');


    // Hide Columns
    $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Consignee + 1) + ")").css('display', 'none');
    $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.DeliveryAddress + 1) + ")").css('display', 'none');
    $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Size + 1) + ")").css('display', 'none');
    $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Thickness + 1) + ")").css('display', 'none');
    $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.SizeDesp + 1) + ")").css('display', 'none');
    $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.UOM + 1) + ")").css('display', 'none');
    $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Stock + 1) + ")").css('display', 'none');
    $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderUOM + 1) + ")").css('display', 'none');
    $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderRate + 1) + ")").css('display', 'none');
    $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.ExtraCharges + 1) + ")").css('display', 'none');
    //$("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.Amount + 1) + ")").css('display', 'none');
    $("#tblorderbooking tbody tr td:nth-child(" + (Indx_TblOrder.OrderQTY + 1) + ")").css('display', 'none');

    // Hide Footer Columns

    //var firstFooterRow = $("#tblorderbooking tfoot tr").eq(0);

    //$(firstFooterRow).find('td:eq(' + Indx_TblOrder.Consignee + ')')[0].style["display"] = "none";
    //$(firstFooterRow).find('td:eq(' + Indx_TblOrder.DeliveryAddress + ')')[0].style["display"] = "none";
    //$(firstFooterRow).find('td:eq(' + Indx_TblOrder.Size + ')')[0].style["display"] = "none";
    //$(firstFooterRow).find('td:eq(' + Indx_TblOrder.Thickness + ')')[0].style["display"] = "none";
    //$(firstFooterRow).find('td:eq(' + Indx_TblOrder.SizeDesp + ')')[0].style["display"] = "none";
    //$(firstFooterRow).find('td:eq(' + Indx_TblOrder.UOM + ')')[0].style["display"] = "none";
    //$(firstFooterRow).find('td:eq(' + Indx_TblOrder.Stock + ')')[0].style["display"] = "none";
    //$(firstFooterRow).find('td:eq(' + Indx_TblOrder.OrderUOM + ')')[0].style["display"] = "none";
    //$(firstFooterRow).find('td:eq(' + Indx_TblOrder.OrderRate + ')')[0].style["display"] = "none";
    //$(firstFooterRow).find('td:eq(' + Indx_TblOrder.ExtraCharges + ')')[0].style["display"] = "none";
    //$(firstFooterRow).find('td:eq(' + Indx_TblOrder.OrderQTY + ')')[0].style["display"] = "none";

  
}

function GetUOM(rowNo) {

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
        $('#txtUOM_' + rowNo).val(ItemUOM);
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
        if (response.length > 0) {
            $('#listFreight option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {

                option += '<option text="' + response[i].Code + '">' + response[i].Field + '</option>'
            }
            $('#listFreight')[0].innerHTML = option;

        }

    });
}
function GetFreightTypeList() {
    VisitOrderEntryService.GetFreightTypeList().then(function (response) {
        if (response.length > 0) {
            $('#listFreightType option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {

                option += '<option text="' + response[i].Code + '">' + response[i].Field + '</option>'
            }
            $('#listFreightType')[0].innerHTML = option;

        }

    });
}

function GetAccountDeliveryLocationDetails() {

    var AccountDesp = $("#txtDealer").val();
    VisitOrderEntryService.GetAccountDeliveryLocationDetails(AccountDesp).then(function (response) {
        if (response.length > 0) {
            $('#listDeliveryLocation option').empty();
            var option = '';
            for (var i = 0; i < response.length; i++) {

                option += '<option text="' + response[i].Code + '">' + response[i].Address + '</option>'
            }
            $('#listDeliveryLocation')[0].innerHTML = option;

        }

    });
}


function SetFieldsAsPerConfig() {
    var CRM_Config = JSON.parse(sessionStorage.getItem('CRMConfig'));

    var ShowPaymentTermsInDirectOrder = CRM_Config.ShowPaymentTermsInDirectOrder;
    var ShowDeliveryLocationInOrder = CRM_Config.ShowDeliveryLocationInOrder;
    var ShowCreditDaysForDC = CRM_Config.ShowCreditDaysForDC;
    var ShowMRateUnit = CRM_Config.ShowMRateUnit;
    var AskOtherCharges = CRM_Config.AskOtherCharges;
    var ShowSizeButton = CRM_Config.ShowSizeButton;


    if (ShowPaymentTermsInDirectOrder == 'Y') {
        $('#divShowFreight').prop('hidden', false);
    } else {
        $('#divShowFreight').prop('hidden', true);
    }
    if (ShowDeliveryLocationInOrder == 'Y' || ShowDeliveryLocationInOrder == 'M') {
        $('#divDeliveryLocation').prop('hidden', false);
    } else {
        $('#divDeliveryLocation').prop('hidden', true);
    }
    if (ShowCreditDaysForDC == 'Y') {
        $('#divCreditDays').prop('hidden', false);
    } else {
        $('#divCreditDays').prop('hidden', true);
    }
    if (ShowMRateUnit == 'Y') {
        $('#divRateUnit').prop('hidden', false);
    } else {
        $('#divRateUnit').prop('hidden', true);
    }
    if (AskOtherCharges == 'Y') {
        $('#divBasicRate').prop('hidden', false);
        $('#divselectSign').prop('hidden', false);
        $('#divAmt').prop('hidden', false);
        $('#divFinalRate').prop('hidden', false);
    } else {
        $('#divBasicRate').prop('hidden', true);
        $('#divselectSign').prop('hidden', true);
        $('#divAmt').prop('hidden', true);
        $('#divFinalRate').prop('hidden', true);
    }
    if (ShowSizeButton == 'Y') {
        $('#divShowSizeButton').prop('hidden', false);
    } else {
        $('#divShowSizeButton').prop('hidden', true);
    }
}





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

window.GetAccountMasterDetails = GetAccountMasterDetails;
window.BizSolhandleEnterKey = BizSolhandleEnterKey;
window.AddNewRow = AddNewRow;
window.GetItemSizeList = GetItemSizeList;
window.GetItemThicknessList = GetItemThicknessList;
window.GetUOM = GetUOM;
window.SaveData = SaveData;
window.CalculateAmount = CalculateAmount;
window.GetZoneMasterList = GetZoneMasterList;