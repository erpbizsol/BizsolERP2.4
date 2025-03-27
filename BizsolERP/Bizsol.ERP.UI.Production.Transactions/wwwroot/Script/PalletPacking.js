import { PalletPackingService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PalletPackingService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';

let BuyerPOMaster_Code = 0;
let Godownmaster_Code = 0;
let IdentificationNo = '';
let ColForWhere = '';
let ColValue = '';
let scanIdCheck = [];
let PalletNo = 0;
let todayDate = '';
let todayDate1 = '';
let selectedDates = [];
let PalletNosToPrint = "";
let G_PrintOrDownloadAllPallet = [];
$(document).ready(function () {
    $("#ERPHeading").text("Pallet Packing");
    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();

    $('#txtdate').val(`${day}/${month}/${year}`);
    setupDateInputFormatting();
    GetPackedPalletDate();
    todayDate = convertDateFormat($('#txtdate').val());
    todayDate1 = $('#txtdate').val();

    $('input[name="filterType"]').on('change', function () {
        const selectedValue = $(this).val();
        if (selectedValue === 'dateWise') {
            $('#dateWiseSection').show();
            $("#tblDateOrderPallet").hide();
            $("#txtOrderNo").empty();
            BuyerPOMaster_Code = 0;
            todayDate = convertDateFormat($('#txtdate').val());
            GetPackedPalletDateAndOrderWise(todayDate, BuyerPOMaster_Code);
            $('#orderWiseSection').hide();
        } else if (selectedValue === 'orderWise') {
            $("#tblDateOrderPallet").hide();
            $('#dateWiseSection').hide();
            $('#orderWiseSection').show();
            $('#txtOrderNo').val('');
            $('#txtWarehouse').val('');
            $('#txtPalletType').val('');
            $('#packingWt').val('');
            $('#referenceNo').val('');
            FillPendingOrder();
            $('#txtOrderNo').on('change', function () {
                GetPackedPalletDateAndOrderWise(todayDate, BuyerPOMaster_Code);
            });
        }
    });
    if ($('#dateWise').is(':checked')) {
        GetPackedPalletDateAndOrderWise(todayDate, BuyerPOMaster_Code);
    }
    $('#txtWarehouse').on('focus', function (e) {
        $("#txtWarehouse").val("");
    });
    $('#txtOrderNo').on('focus', function (e) {
        $("#txtOrderNo ").val("");
    });
    $('#txtPalletType').on('focus', function (e) {
        $("#txtPalletType ").val("");
    });
    $('#txtOrderNo1').on('focus', function (e) {
        $("#txtOrderNo1 ").val("");
    });
    $('#txtWarehouse').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#packingWt").focus();
        }
    });
    $('#packingWt').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#referenceNo").focus();
        }
    });
    $('#referenceNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPalletType").focus();
        }
    });
    $('#txtPalletType').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtOrderNo1").focus();
        }
    });
    $('#txtScanIdentificationNo').on('keyup keypress', function (e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode === 13) {
            e.preventDefault();
            onScanIdSelect();
            $('#txtScanIdentificationNo').focus()
            return false;
        }
    });
    $('#btnExport').click(function () {
        Export();
    });
});
function GetPackedPalletDate() {
    PalletPackingService.GetPackedPalletDate().then(function (response) {
        if (response && response.length > 0) {
            response.forEach(item => {
                if (item.PalletDate) {
                    selectedDates.push(item.PalletDate);
                }
            });
            highlightSelectedDates();
        }
        else {
            highlightSelectedDates();
        }
    });

}
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
        GetPackedPalletDateAndOrderWise(formattedSelectedDate, BuyerPOMaster_Code);
    });
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month, 10) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}

function GetPackedPalletDateAndOrderWise(todayDate, BuyerPOMaster_Code) {
    Showloader();
    PalletPackingService.GetPackedPalletDateAndOrderWise(todayDate, BuyerPOMaster_Code).then(function (response) {
        if (response && response.length > 0) {
            G_PrintOrDownloadAllPallet = response;
            HideLoader();
            $("#tblDateOrderPallet").show();
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Allow Edit", "Print"];
            const columnAlignment = {
                "Pallet Weight": 'right',
                "Pallet Remark": 'right',
                "Qty PC": 'right',
                "Qty KG": 'right',
                "Pallet Date": 'center',
                "Qty KG": 'right',
            };
            const updatedResponse = response.map(item => {
                let buttonsCheckBox = `<input type="checkbox" id="checkPrint" onchange="toggleSelection(this, this.checked)" checked>`;
                let buttonsHTML = item?.['Allow Edit'] === 'Y'
                    ? `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="EditPallet(${item?.['Pallet No']},'Y')"><i class="fa-solid fa-pencil"></i></button>&nbsp;<button class="btn btn-warning icon-height mb-1" title="Remove Pallet" onclick="PalletPacking_DeletePallet(${item?.['Pallet No']})"><i class="fa fa-remove"></i></button>&nbsp;<button class="btn btn-secondary icon-height mb-1" title="View In ID" onclick="ViewPalletId(${item?.['Pallet No']})"><i class="fa-regular fa-eye"></i></button>`
                    : `<button class="btn btn-info icon-height mb-1" title="View" onclick="GetPalletViewDetail(${item?.['Pallet No']})"><i class="fa-regular fa-eye"></i></button>&nbsp;<button class="btn btn-warning icon-height mb-1" title="Remove Pallet" onclick="PalletPacking_DeletePallet(${item?.['Pallet No']})"><i class="fa fa-remove"></i></button>&nbsp;<button class="btn btn-secondary icon-height mb-1" title="View In ID" onclick="ViewPalletId(${item?.['Pallet No']})"><i class="fa-regular fa-eye"></i></button>`;

                return {
                    ...item,
                    Action: buttonsHTML,
                    'Print <input type="checkbox" id="checkAllPrint" onchange="toggleAllSelection(this)" checked>': buttonsCheckBox,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-PalletPacking", "table-body-PalletPacking", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
            if (updatedResponse?.length > 0) {
                updateFooterOrderWise(updatedResponse);
            }
            if (response.length > 0) {
                updateFooterPrint(response);
                response = response.map((item) => ({
                    'Pallet No': item['Pallet No'], 'Order No': item['Order No'], 'Pallet Weight': item['Pallet Weight'], 'Warehouse': item['Warehouse'],
                    'Pallet Date': item['Pallet Date'], 'Qty KG': item['Qty KG'], 'Qty PC': item['Qty PC'], 'Pallet Remark': item['Pallet Remark']
                }))
                PopulateTableForPrintPalletPacking(response);
            } else {
                clearFooterPrint();
            }
        } else {
            HideLoader();
            toastr.info(`This ${todayDate} Date is No Pallet...Please Create A New Pallet`);
            $("#tblDateOrderPallet").hide();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during stock transfer');
            $("#tblDateOrderPallet").hide();
        });
}
function toggleSelection(checkbox, isChecked) {

    console.log("Checkbox selected:", checkbox, isChecked);
}
function toggleAllSelection(masterCheckbox) {
    const checkboxes = document.querySelectorAll('#tblDateOrderPallet input[type="checkbox"]:not(#checkAllPrint)');
    checkboxes.forEach((checkbox) => {
        checkbox.checked = masterCheckbox.checked;
    });
}

function FillPendingOrder() {
    PalletPackingService.FillPendingOrder().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#txtOrderNo')[0], response.map((item) => ({ Code: item.Code, Desp: item.Desp })));

            $('#txtOrderNo').select2({
                width: '-webkit-fill-available'
            });
            const inputElement = document.getElementById("txtOrderNo");
            $('#txtOrderNo').on("input", () => {
                const inputValue = inputElement.value;
                const selectedOption = Array.from(inputElement.options).find(
                    option => option.value === inputValue
                );
                if (selectedOption) {
                    BuyerPOMaster_Code = selectedOption.getAttribute("value");
                    if (BuyerPOMaster_Code !== undefined && BuyerPOMaster_Code !== 0) {
                        onSelectRoll(BuyerPOMaster_Code, Godownmaster_Code);
                    }
                }
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function FillPendingOrderModal() {
    PalletPackingService.FillPendingOrder().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#txtOrderNo1')[0], response.map(item => ({ Code: item.Code, Desp: item.Desp })));
            $('#txtOrderNo1').select2({
                width: '-webkit-fill-available'
            });
            const inputElement = document.getElementById("txtOrderNo1");
            $('#txtOrderNo1').on("change", () => {
                const inputValue = inputElement.value;
                const selectedOption = Array.from(inputElement.options).find(option => option.value === inputValue);
                if (selectedOption) {
                    const BuyerPOMaster_Code = selectedOption.getAttribute("value");
                    if (BuyerPOMaster_Code !== undefined && BuyerPOMaster_Code !== 0) {
                        onSelectRoll(BuyerPOMaster_Code, Godownmaster_Code);
                    }
                }
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching order data:', error);
    });
}
function CreateNew() {
    if ($("#palletNo").val() !== '') {
        let NewWarehouseNo = $("#txtWarehouse option:selected").text();
        let NewPackingWtNo = $("#packingWt").val();
        let NewPalletType = $("#txtPalletType").val();
        let NewOrderNo = $("#txtOrderNo1 option:selected").text();
        let referenceNoValue = $("#referenceNo").val();
        let NewReferenceNo = referenceNoValue.trim() === "" ? 0 : parseInt(referenceNoValue, 10);
        if (isNaN(NewReferenceNo)) {
            NewReferenceNo = 0;
        }
        if (confirm("Previous Pallet are logging...! Are you sure you want to Create New Pallet!")) {
            $('#newCreateForm').show();
            $('#dateAndOrderByPallet').hide();
            $('#table-header-ScanIdentification').empty();
            $('#table-body-ScanIdentification').empty();
            scanIdCheck = [];
            $('#tdlScanIdentification').hide();
            $("#txtPalletdate").val(todayDate1);
            $("#palletNo").val('');
            $("#packingWt").val('');
            $("#referenceNo").val('');
            
            $("#referenceNo").val(NewReferenceNo + 1);
            BizSolHelperFunction.SelectOptionByText('txtWarehouse', NewWarehouseNo);
            $("#packingWt").val(NewPackingWtNo);
            $("#txtPalletType").val(NewPalletType);
            $('#txtPalletType').select2({
                width: '-webkit-fill-available'
            });
            BizSolHelperFunction.SelectOptionByText('txtOrderNo1', NewOrderNo);
            //$("#txtScanIdentificationNoList").empty();
            $('#newCreateForm select').prop('disabled', true);
            $('#referenceNo').prop('disabled', false);
            $('#packingWt').prop('disabled', false);
        } else {
            return;
        }
    } else {
        proceedWithNewPallet();
    }
}

function proceedWithNewPallet() {
    $('#newCreateForm').show();
    $('#dateAndOrderByPallet').hide();
    $('#tdlScanIdentification').hide();
    $("#txtPalletdate").val(todayDate1);
    $("#palletNo").val('');
    $("#txtWarehouse").val('');
    $("#packingWt").val('');
    $("#referenceNo").val('');
    $("#txtPalletType").val('');
    $("#txtOrderNo1").val($("#txtOrderNo").val());
    $("#txtScanIdentificationNo").val('');
    $("#txtScanIdentificationNoList").empty();
    $('#newCreateForm input').prop('disabled', false);
    $('#newCreateForm select').prop('disabled', false);
    Godownmaster_Code = 0;
    FillWarehouse();
    FillPendingOrderModal();
    FillPalletType();
}

function Close() {
    $('#dateAndOrderByPallet').show();
    $('#newCreateForm').hide();
    $('#tdlScanIdentification').hide();
    var selectedDate = $('#txtdate').val();
    var parts = selectedDate.split('/');
    var formattedSelectedDate = new Date(parts[2], parts[1] - 1, parts[0]);
    formattedSelectedDate = convertDateFormat($('#txtdate').val());
    Godownmaster_Code = 0;
    BuyerPOMaster_Code = 0;
    BuyerPOMaster_Code = $('#txtOrderNo').val();
    if (BuyerPOMaster_Code > 0) {
        GetPackedPalletDateAndOrderWise(formattedSelectedDate, BuyerPOMaster_Code);
    }
    else {
    BuyerPOMaster_Code = 0;
        GetPackedPalletDateAndOrderWise(formattedSelectedDate, BuyerPOMaster_Code);
    }
    $('#palletNo').val('');
    $('#txtScanIdentificationNoList').empty();
    scanIdCheck = [];
}

function FillWarehouse() {
    PalletPackingService.FillWarehouse().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#txtWarehouse')[0], response.map((item) => ({ Code: item.Code, Desp: item.GodownName })));

            $('#txtWarehouse').select2({
                width: '-webkit-fill-available'
            });
            
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching warehouse data:', error);
    });
}
function FillPalletType() {
    PalletPackingService.FillPalletType().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#txtPalletType')[0], response.map((item) => ({ Code: item.PalletType, Desp: item.PalletType })));

            $('#txtPalletType').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function onSelectRoll(BuyerPOMaster_Code, GodownMaster_Code) {
    if (BuyerPOMaster_Code !== 0 && GodownMaster_Code !== 0) {
        F_GetPendingIDOrderWise(BuyerPOMaster_Code, GodownMaster_Code);
    } else {
        //toastr.error("API is Not Called");
    }
}
function F_GetPendingIDOrderWise(BuyerPOMaster_Code, GodownMaster_Code) {
    PalletPackingService.GetPendingIDOrderWise(BuyerPOMaster_Code, GodownMaster_Code).then(function (response) {
        if (response && response.length > 0) {
    AutoSuggestionControl.SetUpAutoSuggestion($('#txtScanIdentificationNo'), $('#txtScanIdentificationNoList'), response.map((item) => ({ Desp: item.IdentificationNo })), 'StartWith');
        } else {
            $('#txtScanIdentificationNoList').empty();
        }
    })
        .catch(function (error) {
            console.error("Error fetching pending IDs:", error);
        });
}
function onScanIdSelect() {
    IdentificationNo = $("#txtScanIdentificationNo").val();
    var packingWt = $("#packingWt").val();
    if (packingWt === "" || packingWt === "0") {
        toastr.warning("Please enter a valid Packing Wt, it cannot be empty or zero.");
        return;
    }

    var referenceNo = $("#referenceNo").val();
    if (referenceNo === "" || referenceNo === "0") {
        toastr.warning("Please enter a valid Reference No, it cannot be empty or zero.");
        return;
    }
    var palletType = $("#txtPalletType").val();
    if (palletType === "" || palletType === "0") {
        toastr.warning("Please enter a Pallet Type, it cannot be empty or zero.");
        return;
    }
    ScanID();
}
function ScanID() {
    let checkIdentificationInput = $("#txtScanIdentificationNo").val();
    if (checkIdentificationInput == '') {
        return;
    }
    Showloader();
    PalletPackingService.ScanID(IdentificationNo, Godownmaster_Code).then(function (response) {
        if (response.length > 0) {
            HideLoader();
             ColForWhere = response[0]?.ColForWhere;
             ColValue = response[0]?.['Identification No'];

                
                var PalletNo = $("#palletNo").val();
                if (PalletNo === '') {
                    PalletNo = 0;
                }
                
            CheckDuplicateIDPallet(IdentificationNo, ColForWhere, ColValue, PalletNo, response).then(function (isDuplicate) {
                if (isDuplicate) {
                    return;
                }
                
            });
        }
        else {
            HideLoader();
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        toastr.error(error?.Msg || 'Error during Pallet ');
    });
}
function AddIDInPallet(ColForWhere, ColValue, responseGrid) {
    var PalletNo = $("#palletNo").val();
    var PalletType = $("#txtPalletType").val();
    var PalletWeight = $("#packingWt").val();
    var PalletRemark = $("#referenceNo").val();
    BuyerPOMaster_Code = $("#txtOrderNo1").val();
    var PalletDate = convertDateFormat($('#txtPalletdate').val());
    if (PalletNo === '') {
        PalletNo = 0;
    }
    
    PalletPackingService.AddIDInPallet(ColForWhere, ColValue, PalletNo, PalletRemark, PalletWeight, PalletDate, PalletType, BuyerPOMaster_Code).then(function (response) {
        if (response.Status === 'Y') {
            $("#palletNo").val(response?.Msg);
            toastr.success("Pallet No is Saved Successfully");
            $("#tdlScanIdentification").show();

            const newData = responseGrid.map((item, index) => ({
                SN: scanIdCheck.length + index + 1,
                ...item
            }));
            const existingIds = scanIdCheck.map(item => item?.['Identification No']);
            const uniqueData = newData.filter(item => !existingIds.includes(item?.['Identification No']));

            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Stock Type", "ColForWhere", "Pallet Weight", "Pallet No"];
            const columnAlignment = {
                "Qty KG": 'right',
                "Qty PC": 'right',
                "Qty": 'right',
            };
            const updatedResponse = uniqueData.map(item => {
                const ColValue = item?.['Identification No'];
                let buttonsHTML = `<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete('${item.ColForWhere}','${ColValue}')"><i class="fa-regular fa-circle-xmark"></i></button>`;
                return {
                    ...item,
                    Action: buttonsHTML,
                };
            });
            scanIdCheck = [...scanIdCheck, ...updatedResponse];
            BizsolCustomFilterGrid.CreateDataTable("table-header-ScanIdentification", "table-body-ScanIdentification", scanIdCheck, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
            $('#newCreateForm input').prop('disabled', true);
            $('#newCreateForm select').prop('disabled', true);
            $('#txtScanIdentificationNo').val('').prop('disabled', false);
            if (scanIdCheck?.length > 0) {
                updateFooter(scanIdCheck);
            }
            BuyerPOMaster_Code = $('#txtOrderNo1').val();
            F_GetPendingIDOrderWise(BuyerPOMaster_Code, Godownmaster_Code);
        }
        else {
            toastr.warning(response?.Msg);
        }
    }).catch(function (error) {
        toastr.error('Error adding ID in pallet');
    });
}
function CheckDuplicateIDPallet(IdentificationNo, ColForWhere, ColValue, PalletNo, responseGrid) {
    return PalletPackingService.CheckDuplicateIDPallet(IdentificationNo, ColForWhere, ColValue, PalletNo).then(function (response) {
        if (response.Status === 'N') {
            toastr.warning(response.Msg);
            return true;
        }
        AddIDInPallet(ColForWhere, ColValue, responseGrid);
        return false;
    });
}
function EditPallet(PalletNo1,isAction) {
    FillWarehouse();
    FillPendingOrderModal();
    FillPalletType();
    Showloader();
    PalletNo = PalletNo1;
    PalletPackingService.GetPalletDetail(PalletNo).then(function (response) {
        if (response.length > 0) {
            HideLoader();
            let EditPalletPackingList = response.map((item, index) => ({ SN: index + 1, ...item }));
            $('#txtPalletdate').val(response[0]?.['Pallet Date']);
            $('#palletNo').val(response[0]?.PalletNo);
            BizSolHelperFunction.SelectOptionByText('txtWarehouse', response[0]?.['WareHouse']);
            $('#packingWt').val(response[0]?.PalletWeight);
            $('#referenceNo').val(response[0]?.['Pallet Remark']);
            $('#txtPalletType').val(response[0]?.['Pallet Type']);
            $('#txtPalletType').select2({
                width: '-webkit-fill-available'
            });
            BizSolHelperFunction.SelectOptionByText('txtOrderNo1', response[0]?.['Order No']);
            $('#newCreateForm input').prop('disabled', true);
            $('#newCreateForm select').prop('disabled', true);
            $('#txtScanIdentificationNo').val('').prop('disabled', false);
            $('#newCreateForm').show();
            $('#dateAndOrderByPallet').hide();
            $('#tdlScanIdentification').show();

            BuyerPOMaster_Code = response[0].BuyerPOMaster_Code;
            Godownmaster_Code = response[0].GodownMaster_Code;
            editPalletTable(PalletNo, Godownmaster_Code, isAction);
            F_GetPendingIDOrderWise(BuyerPOMaster_Code, Godownmaster_Code);
        } else {
            HideLoader();
            toastr.error('No Data Found');
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during stock transfer');
        });
}
function editPalletTable(PalletNo, Godownmaster_Code, isAction) {
    Showloader();
    $('#table-header-ScanIdentification').empty();
    $('#table-body-ScanIdentification').empty();
    scanIdCheck = [];
    PalletPackingService.EditPallet(PalletNo, Godownmaster_Code, isAction).then(function (response) {
        if (response.length > 0) {
            HideLoader();
            const newEditData = response.map((item, index) => ({
                SN: scanIdCheck.length + index + 1,
                ...item
            }));
            const existingEditIds = scanIdCheck.map(item => item?.['Identification No']);
            const uniqueEditData = newEditData.filter(item => !existingEditIds.includes(item?.['Identification No']));
            
            $("#tdlScanIdentification").show();

            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Stock Type", "ColForWhere", "Pallet Weight", "Pallet No"];
            const columnAlignment = {
                "Qty KG": 'right',
                "Qty PC": 'right',
                "Qty": 'right',
            };
            const updatedResponse = uniqueEditData.map(item => {
                let ColValue = item?.['Identification No'];
                
                    let buttonsHTML = `<button class="btn btn-danger icon-height mb-1 btndelete" title="Delete" onclick="Delete('${item.ColForWhere}','${ColValue}')"><i class="fa-regular fa-circle-xmark"></i></button>`;
                    return {
                        ...item,
                        Action: buttonsHTML,
                    };
                
            });
            scanIdCheck = [...scanIdCheck, ...updatedResponse];

            if (isAction === 'N') {
                hiddenColumns.push("Action");
            }
            BizsolCustomFilterGrid.CreateDataTable("table-header-ScanIdentification", "table-body-ScanIdentification", scanIdCheck, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
                updateFooter(response);
        } else {
            HideLoader();
            $('#tdlScanIdentification').hide();
            toastr.error('No Data Found');
            Close();
        }
    })
        .catch(function (error) {
            HideLoader();
            toastr.error(error.Msg || 'Error during Pallet ');
        });
}
function GetPalletViewDetail(PalletNo) {
    FillWarehouse();
    FillPendingOrderModal();
    FillPalletType();
    Showloader();
    PalletPackingService.GetPalletDetail(PalletNo).then(function (response) {
        if (response.length > 0) {
            HideLoader();
          
            $('#txtPalletdate').val(response[0]?.['Pallet Date']);
            $('#palletNo').val(response[0]?.PalletNo);
            BizSolHelperFunction.SelectOptionByText('txtWarehouse', response[0]?.['WareHouse']);
            $('#packingWt').val(response[0]?.PalletWeight);
            $('#referenceNo').val(response[0]?.['Pallet Remark']);
            $('#txtPalletType').val(response[0]?.['Pallet Type']);
            $('#txtPalletType').select2({
                width: '-webkit-fill-available'
            });
            BizSolHelperFunction.SelectOptionByText('txtOrderNo1', response[0]?.['Order No']);
            $('#txtScanIdentificationNo').val('');
            $('#newCreateForm').show();
            $('#dateAndOrderByPallet').hide();
            $('#newCreateForm input').prop('disabled', true);
            $('#newCreateForm select').prop('disabled', true);
            $('#tdlScanIdentification').show();

            Godownmaster_Code = response[0].GodownMaster_Code;
            editPalletTable(PalletNo, Godownmaster_Code,'N');
           
        } else {
            HideLoader();
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error(error.Msg || 'Error during pallet detail retrieval');
    });
}
function updateFooter(data) {
    const calculateTotalAmount = "Total Amount";
    if (calculateTotalAmount === "Total Amount") {
        let totalQtyBalWeight = 0;
        data.forEach(row => {
            totalQtyBalWeight += parseFloat(row["Qty KG"]);
        });

        const tfootContent = `
        <tr>
        <td colspan="3"></td>
        <td ><b>Total:</b></td>
        <td style="text-align: right;">${totalQtyBalWeight}</td>
        <td></td>
        </tr>
        `;

        const tfoot = document.querySelector("#ScanIdentification tfoot");

        if (tfoot) {
            tfoot.innerHTML = tfootContent;
        } else {
            const table = document.querySelector("#ScanIdentification");
            if (table) {
                const newTfoot = document.createElement("tfoot");
                newTfoot.innerHTML = tfootContent;
                table.appendChild(newTfoot);
            } else {
                console.error("Table element with id 'table' not found.");
            }
        }
    }
}
function clearFooter() {
    const tfoot = document.querySelector("#table-header-ScanIdentification tfoot");
    if (tfoot) {
        tfoot.innerHTML = "";
    }
}
function Delete(ColForWhere, ColValue) {
    var button = $(event.target);
    var row = button.closest('tr');
    var rowIndex = row.index();
    const userConfirmed = confirm(`Are you sure you want to delete this Pallet ID ${ColValue}?`);
    if (userConfirmed) {
        PalletPackingService.RemoveIDFromPallet(ColForWhere, ColValue).then(function (response) {
            if (response) {
                scanIdCheck = [];
                PalletNo = $('#palletNo').val();
                editPalletTable(PalletNo, Godownmaster_Code, 'Y');
                toastr.success("Pallet ID is Deleted Successfully");
                F_GetPendingIDOrderWise(BuyerPOMaster_Code, Godownmaster_Code);
            } else {
                toastr.error('Error deleting pallet');
            }
        }).catch(function (error) {
            //toastr.error('Error during delete action');
        });
    } else {
        toastr.info('Delete action cancelled');
    }
}

function PalletPacking_Print(Mode,isDownload) {
    let PalletNosToPrint = "";
    if (Mode === 'Grid') {

        let tbPackingList = document.getElementById("PalletPacking");
        let rows = tbPackingList.querySelectorAll("tr");
        let checkAllPrint = document.getElementById("checkAllPrint");
        if (checkAllPrint.checked == true) {

            if (G_PrintOrDownloadAllPallet.length > 0) {
                G_PrintOrDownloadAllPallet.forEach(function (item) {

                    PalletNosToPrint += item["Pallet No"] + ','

                })
            }

            
        } else {
            
            for (let i = 1; i < rows.length; i++) {
                let tbPackingListUpdateRow = rows[i];
                let chkId = tbPackingListUpdateRow.cells[11]?.getElementsByTagName('input')[0];
                let PalletNo = tbPackingListUpdateRow.cells[0]?.innerHTML.trim();

                if (chkId && chkId.checked == true) {
                    PalletNosToPrint += PalletNo + ',';
                }
            }
        }


    } else {
        PalletNosToPrint = $('#palletNo').val();
    }

    if (PalletNosToPrint === "") {
        toastr.error("Please select at least one row to print.");
        return;
    }
    PalletPackingService.Print(PalletNosToPrint, isDownload).then(function (response) {
        let url = response.Url;
        const a = document.createElement('a');
        a.style.display = 'none';
        a.target = '_blank';
        a.href = url;
        document.body.appendChild(a);
        a.click();
    });
}
function PalletPacking_DeletePallet(palletNo) {
    if (confirm(`Are you sure you want to Remove ${palletNo}?`) == true) {
        Showloader();
        PalletPackingService.RemovePallet(palletNo).then(function (response) {

            if (response.Status == 'Y') {
                toastr.success(response.Msg);
                todayDate = convertDateFormat($('#txtdate').val());
                GetPackedPalletDateAndOrderWise(todayDate, BuyerPOMaster_Code);
            } else {
                toastr.error(response.Msg);
                HideLoader();
            }
        });
    }
}
function updateFooterOrderWise(data) {
    const calculateTotalOrderWise = "Total Amount";
    if (calculateTotalOrderWise === "Total Amount") {
        let totalPalletWeight = 0;
        let totalQtyKG = 0;
        let totalQtyPC = 0;

        let grandTotalPalletWeight = 0;
        let grandTotalQtyKG = 0;
        let grandTotalQtyPC = 0;
        
        $('#PalletPacking tbody tr:visible').each(function () {
            const row = $(this);
            grandTotalPalletWeight += parseFloat(row.find("td:nth-child(4)").text()) || 0;
            grandTotalQtyKG += parseFloat(row.find("td:nth-child(5)").text()) || 0;
            grandTotalQtyPC += parseFloat(row.find("td:nth-child(6)").text()) || 0;
        });
        data.forEach(row => {
            totalPalletWeight += parseFloat(row["Pallet Weight"]);
            totalQtyKG += parseFloat(row["Qty KG"]);
            totalQtyPC += parseFloat(row["Qty PC"]);
        });
        totalQtyKG = totalQtyKG.toFixed(3);

        grandTotalQtyKG = grandTotalQtyKG.toFixed(3);

        const tfootContent = `
        <tr id="trTotal">
        <td colspan="1"></td>
        <td style="text-align: center;">Total</td>
        <td style="text-align: right;">${grandTotalPalletWeight}</td>
        <td></td>
        <td></td>
        <td style="text-align: right;">${grandTotalQtyKG}</td>
        <td style="text-align: right;">${Math.round(grandTotalQtyPC)}</td>
        <td colspan="3"></td>
        </tr>
        <tr id="trGrandTotal">
        <td colspan="1"></td>
        <td style="text-align: center;">Grand Total</td>
        <td style="text-align: right;">${totalPalletWeight}</td>
        <td></td>
        <td></td>
        <td style="text-align: right;">${totalQtyKG}</td>
        <td style="text-align: right;">${Math.round(totalQtyPC)}</td>
        <td colspan="3"></td>
        </tr>
        `;

        const tfoot = document.querySelector("#PalletPacking tfoot");

        if (tfoot) {
            tfoot.innerHTML = tfootContent;
        } else {
            const table = document.querySelector("#PalletPacking");
            if (table) {
                const newTfoot = document.createElement("tfoot");
                newTfoot.innerHTML = tfootContent;
                table.appendChild(newTfoot);
            } else {
                console.error("Table element with id 'table' not found.");
            }
        }
    }
}

{
    const tfoot = document.querySelector("#PalletPacking tfoot");
    if (tfoot) {
        tfoot.innerHTML = "";
    }
}

function calculateTotal() {

    let Data = $('#PalletPacking tbody tr:visible');
    let grandTotalPalletWeight = 0;
    let grandTotalQtyKG = 0;
    let grandTotalQtyPC = 0;
    
    if (Data.length > 0) {

        for (let i = 0; i < Data.length; i++) {
            let ItemRow = Data[i];
            grandTotalPalletWeight += parseFloat(ItemRow.children[2].innerHTML);
            grandTotalQtyKG += parseFloat(ItemRow.children[6].innerHTML);
            grandTotalQtyPC += parseFloat(ItemRow.children[7].innerHTML);

        }
        $('#trTotal')[0].children[2].innerHTML = grandTotalPalletWeight;
        $('#trTotal')[0].children[6].innerHTML = grandTotalQtyPC;
        $('#trTotal')[0].children[5].innerHTML = parseFloat(grandTotalQtyKG).toFixed(3);

    }

}
setInterval(function () {
    calculateTotal();
}, 1000);
function BindSelectList(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function updateFooterPrint(data) {
    const calculateTotalAmount = "Total Amount";
    if (calculateTotalAmount === "Total Amount") {
        let totalPalletWeight = 0;
        let totalQtyKG = 0;
        let totalQtyPC = 0;

        data.forEach(row => {
            totalPalletWeight += parseFloat(row["Pallet Weight"]);
            totalQtyKG += parseFloat(row["Qty KG"]);
            totalQtyPC += parseFloat(row["Qty PC"]);
            
        });
        totalQtyKG = totalQtyKG.toFixed(3);

        const tfootContent = `
        
        <tr id="trGrandTotalPrint">
        <td></td>
        <td style="text-align: center;">Total</td>
        <td style="text-align: right;">${totalPalletWeight}</td>
        <td></td>
        <td></td>
        <td style="text-align: right;">${totalQtyKG}</td>
        <td style="text-align: right;">${totalQtyPC}</td>
        <td></td>
        <td></td>
        <td></td>
        </tr>
        `;

        const tfoot = document.querySelector("#tblReport tfoot");

        if (tfoot) {
            tfoot.innerHTML = tfootContent;
        } else {
            const table = document.querySelector("#tblReport");
            if (table) {
                const newTfoot = document.createElement("tfoot");
                newTfoot.innerHTML = tfootContent;
                table.appendChild(newTfoot);
            } else {
                console.error("Table element with id 'table' not found.");
            }
        }
    }
}
function clearFooterPrint() {
    const tfoot = document.querySelector("#tblReport tfoot");
    if (tfoot) {
        tfoot.innerHTML = "";
    }
}
function PopulateTableForPrintPalletPacking(data) {
    const tableBody = document.querySelector('#tblReport tbody');
    const tableHeader = document.querySelector('#tblReport thead tr');

    $('#tblReport  thead tr').empty();
    $('#tblReport tbody').empty();

    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.charAt(0).toUpperCase() + header.slice(1);
        tableHeader.appendChild(th);
    });

    $('#tblReport th').css('font-weight', 'bold');
    data.forEach(item => {
        const row = document.createElement('tr');

        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = item[header];
            row.appendChild(td);
        });

        tableBody.appendChild(row);
    });

}
function Export() {
    $('#ExportModal').modal({
        backdrop: 'static',
    });
    $('#ExportModal').modal('show');
    
}
function Close_ExportModal() {
    $('#ExportModal').modal('hide');
}
function ExportSummary() {
    todayDate = convertDateFormat($('#txtdate').val());
    
    PalletPackingService.GetPackedPalletDateAndOrderWise(todayDate, BuyerPOMaster_Code).then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            
            if (response.length > 0) {
                
                response = response.map((item) => ({
                    'Pallet No': item['Pallet No'], 'Order No': item['Order No'], 'Pallet Weight': item['Pallet Weight'], 'Warehouse': item['Warehouse'],
                    'Pallet Date': item['Pallet Date'], 'Qty KG': item['Qty KG'], 'Qty PC': item['Qty PC'], 'Pallet Remark': item['Pallet Remark']
                }))
                PopulateTableForPrintPalletPacking(response);
                

                $("#tblReport").table2excel({
                    filename: "PalletPacking_" + todayDate,
                    fileext: ".xlsx"
                });
                Close_ExportModal();
            } else {
                clearFooterPrint();
            }
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $("#tblDateOrderPallet").hide();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during stock transfer');
            $("#tblDateOrderPallet").hide();
        });
    
}
function PopulateTableForDownloadPalletPacking(data) {
    const tableBody = document.querySelector('#tblReport tbody');
    const tableHeader = document.querySelector('#tblReport thead tr');

    $('#tblReport  thead tr').empty();
    $('#tblReport tbody').empty();

    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.charAt(0).toUpperCase() + header.slice(1);
        tableHeader.appendChild(th);
    });

    $('#tblReport th').css('font-weight', 'bold');
    data.forEach(item => {
        const row = document.createElement('tr');

        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = item[header];
            row.appendChild(td);
        });

        tableBody.appendChild(row);
    });

}

function DownloadPalletPacking() {
    todayDate = convertDateFormat($('#txtdate').val());
    PalletPackingService.ExportInExcelPackedPalletDateAndOrderWise(todayDate, BuyerPOMaster_Code).then(function (response) {
        if (response && response.length > 0) {
            if (response.length > 0) {
                updateFooterPrint(response);
                response = response.map((item) => ({
                    'Pallet No': item['Pallet No'], 'Order No': item['Order No'], 'Pallet Weight': item['Pallet Weight'], 'Warehouse': item['Warehouse'],
                    'Pallet Date': item['Pallet Date'], 'Qty KG': item['Qty KG'], 'Qty PC': item['Qty PC'], 'Pallet Remark': item['Pallet Remark'], 'Pallet Type': item['PalletType'], 'Identification No': item['IdentificationNo']
                }))
                PopulateTableForDownloadPalletPacking(response);
                
               
                $("#tblReport").table2excel({
                    filename: "PalletPackingDetails_" + todayDate,
                    fileext: ".xlsx"
                });
                Close_ExportModal();
            } else {
                clearFooterPrint();
            }
        } else {
            //toastr.error('No Data Found');
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during stock transfer');
        });
}
function ViewPalletId(PalletNo) {
    Showloader();
    PalletPackingService.ViewInIDPallet(PalletNo).then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            $('#ViewInIDPallet').modal({
                backdrop: 'static',
            });
            $('#ViewInIDPallet').modal('show');

            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const columnAlignment = {};

            BizsolCustomFilterGrid.CreateDataTable("table-header-ViewInIdPalletTable", "table-body-ViewInIdPalletTable", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment,false);
        } else {
            HideLoader();
            toastr.error('No Data Found');
            Close_ViewIdInPalletModal();
        }
    })
        .catch(function (error) {
            HideLoader();
            toastr.error(error.Msg || 'Error during Pallet ');
        });
}
function Close_ViewIdInPalletModal() {
    $('#ViewInIDPallet').modal('hide');
}

const inputWarehouseElement = document.getElementById("txtWarehouse");
$('#txtWarehouse').on("change", () => {
    const inputValue = inputWarehouseElement.value;
    const selectedOption = Array.from(inputWarehouseElement.options).find(
        option => option.value === inputValue
    );
    if (selectedOption) {
        Godownmaster_Code = selectedOption.getAttribute("value");
        if (Godownmaster_Code !== undefined && Godownmaster_Code !== 0) {
            let buyerPOMaster_Code = $('#txtOrderNo1').val();
            onSelectRoll(buyerPOMaster_Code, Godownmaster_Code);
        }
    }
});
window.GetPackedPalletDateAndOrderWise = GetPackedPalletDateAndOrderWise;
window.FillPendingOrder = FillPendingOrder;
window.CreateNew = CreateNew;
window.Close = Close;
window.onScanIdSelect = onScanIdSelect;
window.toggleAllSelection = toggleAllSelection;
window.toggleSelection = toggleSelection;
window.EditPallet = EditPallet;
window.GetPalletViewDetail = GetPalletViewDetail;
window.Delete = Delete;
window.PalletPacking_Print = PalletPacking_Print;
window.PalletPacking_DeletePallet = PalletPacking_DeletePallet;
window.DownloadPalletPacking = DownloadPalletPacking;
window.Export = Export;
window.ExportSummary = ExportSummary;
window.Close_ExportModal = Close_ExportModal;
window.ViewPalletId = ViewPalletId;
window.Close_ViewIdInPalletModal = Close_ViewIdInPalletModal;