import { PhysicalStockTakingItemService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PhysicalStockTakingItemService.js';

$(document).ready(function () {
    $("#ERPHeading").text("Physical Stock Taking");
    highlightSelectedDates();
    GetWarehouse();
    GetItemName();
    ScanIdDataListStockTacing();
    let todayDate = convertDateFormat($('#txtdate').val());
    $('#remarks').on('focus', function (e) {
        $("#remarks").val("");
    });
    $('#txtPhysicalWarehouse').on('focus', function (e) {
        $("#txtPhysicalWarehouse ").val("");
    });
    $('#itemName').on('focus', function (e) {
        $("#itemName ").val("");
    });
    $('#txtScanIdentificationNo').on('focus', function (e) {
        $("#txtScanIdentificationNo ").val("");
    });
    $('#txtdate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#remarks").focus();
        }
    });
    $('#remarks').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPhysicalWarehouse").focus();
        }
    });
    $('#txtPhysicalWarehouse').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#itemName").focus();
        }
    });
    $('#itemName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtScanIdentificationNo").focus();
        }
    });
    $('#txtScanIdentificationNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            OpenModal();
        }
    });
});
function setupDateInputFormatting() {
    $('#txtdate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');

        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);

        if (value.length === 10) {
            validateDate(value);
        } else {
            $(this).val(value);
        }
    });
}
function validateDate(value) {
    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    let isValidFormat = regex.test(value);

    if (isValidFormat) {
        let parts = value.split('/');
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let date = new Date(year, month - 1, day);

        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

            $(this).val(value);
        } else {
            $('#txtdate').val('');

        }
    } else {
        $('#txtdate').val('');

    }
}
function highlightSelectedDates() {
    var highlightedDates = {};
    var selectedDates = ['01/10/2024', '05/10/2024', '11/11/2024'];
    selectedDates.forEach(date => {
        var parts = date.split('/');
        var formattedDate = new Date(parts[2], parts[1] - 1, parts[0]).toDateString();
        highlightedDates[formattedDate] = true;
    });

    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();

    $('#txtdate').val(`${day}/${month}/${year}`);
    $('#txtdate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        beforeShowDay: function (date) {
            const formattedDate = date.toDateString();
            if (highlightedDates[formattedDate]) {
                return { classes: 'highlighted-date', tooltip: 'Data Available' };
            }
            return { classes: '', tooltip: '' };
        }
    }).on('change', function () {
        var selectedDate = $(this).val();
        var parts = selectedDate.split('/');
        var formattedSelectedDate = new Date(parts[2], parts[1] - 1, parts[0]);
        formattedSelectedDate = convertDateFormat($('#txtdate').val());
    });
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month, 10) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}
function ScanCoilDetails() {
    PhysicalStockTakingItemService.ScanCoilDetails(IdentificationNo, GodownMaster_Code, StockTaking, ItemMaster_Code).then(function (response) {

    });
}
function AddPhysicalStock() {
    PhysicalStockTakingItemService.AddPhysicalStock(AsOnDate, Remark, IdentificationNo, StockType, ItemMaster_Code, ItemSizeMaster_Code, QtyPC, QtyMT, QtyMTRS, Status, GodownMaster_Code).then(function (response) {

    });
}
function RemovePhysicalStock() {
    PhysicalStockTakingItemService.RemovePhysicalStock(PhysicalStockTackingMaster_Code, PhysicalStockTackingTransaction_Code).then(function (response) {

    });
}
function UpdateQtyInPhysicalStock() {
    PhysicalStockTakingItemService.UpdateQtyInPhysicalStock(PhysicalStockTackingMaster_Code, PhysicalStockTackingTransaction_Code, QtyPC, QtyMT, QtyMTRS, Status, Remark).then(function (response) {

    });
}
function DeletePhysicalStock() {
    PhysicalStockTakingItemService.DeletePhysicalStock(PhysicalStockTackingMaster_Code).then(function (response) {

    });
}
function ScanIdDataListStockTacing() {
    PhysicalStockTakingItemService.ScanIdDataListStockTacing().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#ddlPhysicalWarehouse')[0], response.map((item) => ({ Code: item.Code, Desp: item['Identification No'] })));

            $('#ddlPhysicalWarehouse').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching warehouse data:', error);
    });
}
function ShowPhysicalStockAsOnDate() {
    PhysicalStockTakingItemService.ShowPhysicalStockAsOnDate().then(function (response) {

    });
}
function GetWarehouse() {
    PhysicalStockTakingItemService.GetWarehouse().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#ddlPhysicalWarehouse')[0], response.map((item) => ({ Code: item.Code, Desp: item.GodownName })));

            $('#ddlPhysicalWarehouse').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching warehouse data:', error);
    });
}
function GetItemName() {
    PhysicalStockTakingItemService.GetItemName().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#ddlItmeName')[0], response.map((item) => ({ Code: item.Code, Desp: item.ItemName })));

            $('#ddlItemName').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching warehouse data:', error);
    });
}
function BindSelectList(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function OpenModal() {
    $('#myModal').modal({
        backdrop: 'static',
    });
    $('#myModal').modal('show');
}
function CloseModal() {
    $('#myModal').modal('hide');
}

window.ScanCoilDetails = ScanCoilDetails;
window.CloseModal = CloseModal;