import { PalletPackingService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/PalletPackingService.js';

let BuyerPOMaster_Code = 0;
let Godownmaster_Code = 0;
let IdentificationNo = '';
let ColForWhere ='';
let ColValue = '';
let scanIdCheck = [];
let PalletNo = 0;
let todayDate = '';
let todayDate1 = '';
$(document).ready(function () {
    $("#ERPHeading").text("Pallet Packing");
    highlightSelectedDates();
    todayDate = convertDateFormat($('#txtdate').val());
    todayDate1 = $('#txtdate').val();
    $('input[name="filterType"]').on('change', function () {
        const selectedValue = $(this).val();  
        if (selectedValue === 'dateWise') {
            $('#dateWiseSection').show();
            $("#tblDateOrderPallet").hide();
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
    } else {

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
    $('#txtScanIdentificationNo').on('focus', function (e) {
        $("#txtScanIdentificationNo ").val("");
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
    $('#txtOrderNo1').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtScanIdentificationNo").focus();
        }
    });
    $('#txtScanIdentificationNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            onScanIdSelect();
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
    PalletPackingService.GetPackedPalletDateAndOrderWise(todayDate, BuyerPOMaster_Code).then(function (response) {
        if (response && Array.isArray(response) && response.length > 0) {
            $("#tblDateOrderPallet").show();
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Allow Edit","Print"];
            const columnAlignment = {
                "Pallet Weight":'right',
                "Pallet Remark":'right',
                "Qty PC":'right',
                "Qty MT":'right',
                "Pallet Date":'center',
            };
            const updatedResponse = response.map(item => {
                let buttonsCheckBox = `<input type="checkbox" id="checkPrint" onchange="toggleSelection(this, this.checked)" checked>`;
                let buttonsHTML = '';
                if (item?.['Allow Edit'] === 'Y') {
                    buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="EditPallet(${item?.['Pallet No']})"><i class="fa-solid fa-pencil"></i></button>`;
                } else if (item?.['Allow Edit'] === 'V') {
                    buttonsHTML = `<button class="btn btn-info icon-height mb-1" title="View" onclick="GetPalletDetail(${item?.['Pallet No']},"V")"><i class="fa-regular fa-eye"></i></button>`;
                }
                return {
                    ...item,
                    Action: buttonsHTML,
                    '<input type="checkbox" id="checkAllPrint" onchange="toggleAllSelection(this)" checked> Print': buttonsCheckBox,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-PalletPacking", "table-body-PalletPacking", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
        } else {
            toastr.error('No Data Found');
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
            $('#txtOrderNoList option').remove();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                option += '<option text="' + response[i].Code + '" value="' + response[i].Desp + '" >' + response[i].Desp + '</option>';
            }
            $('#txtOrderNoList')[0].innerHTML = option;
        } else {
            toastr.error('No data received or empty response');
        }
        const inputElement = document.getElementById("txtOrderNo");
        const dataList = document.getElementById("txtOrderNoList");
        inputElement.addEventListener("input", () => {
            const inputValue = inputElement.value;
            const selectedOption = Array.from(dataList.options).find(
                option => option.value === inputValue
            );
            if (selectedOption) {
                BuyerPOMaster_Code = selectedOption.getAttribute("text");
                if (BuyerPOMaster_Code !== undefined && BuyerPOMaster_Code !== 0) {
                    onSelectRoll(BuyerPOMaster_Code, Godownmaster_Code);
                }
            }
        });
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function FillPendingOrderModal() {
    PalletPackingService.FillPendingOrder().then(function (response) {
        if (response && response.length > 0) {
            $('#txtOrderNoList1 option').remove();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                option += '<option text="' + response[i].Code + '" value="' + response[i].Desp + '" >' + response[i].Desp + '</option>';
            }
            $('#txtOrderNoList1')[0].innerHTML = option;
        } else {
            toastr.error('No data received or empty response');
        }
        const inputElement = document.getElementById("txtOrderNo1");
        const dataList = document.getElementById("txtOrderNoList1");
        inputElement.addEventListener("input", () => {
            const inputValue = inputElement.value;
            const selectedOption = Array.from(dataList.options).find(
                option => option.value === inputValue
            );
            if (selectedOption) {
                BuyerPOMaster_Code = selectedOption.getAttribute("text");
                if (BuyerPOMaster_Code !== undefined && BuyerPOMaster_Code !== 0) {
                    onSelectRoll(BuyerPOMaster_Code, Godownmaster_Code);
                }
            }
        });
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
//function CreateNew() {
//    $('#newCreateForm').show();
//    $('#dateAndOrderByPallet').hide();
//    $('#tdlScanIdentification').hide();
//    $("#txtPalletdate").val(todayDate);
//    $("#txtOrderNo1").val($("#txtOrderNo").val());
//    $("#palletNo").val('');
//    $('#txtWarehouse').val('');
//    $('#txtPalletType').val('');
//    $('#packingWt').val('');
//    FillWarehouse();
//    FillPendingOrderModal();
//    FillPalletType();
//}
function CreateNew() {
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
    $('#newCreateForm input').prop('disabled', false);
    FillWarehouse();
    FillPendingOrderModal();
    FillPalletType();
}
function Close() {
    $('#dateAndOrderByPallet').show();
    $('#newCreateForm').hide();
    $('#tdlScanIdentification').hide();
}

function FillWarehouse() {
    PalletPackingService.FillWarehouse().then(function (response) {
        if (response && response.length > 0) {
            $('#txtWarehouseList option').remove();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                option += '<option text="' + response[i].Code + '" >' + response[i].GodownName + '</option>';
            }
            $('#txtWarehouseList')[0].innerHTML = option;
        } else {
            toastr.error('No data received or empty response');
        }
        const inputElement = document.getElementById("txtWarehouse");
        const dataList = document.getElementById("txtWarehouseList");
        inputElement.addEventListener("input", () => {
            const inputValue = inputElement.value;
            const selectedOption = Array.from(dataList.options).find(
                option => option.value === inputValue
            );
            if (selectedOption) {
                Godownmaster_Code = selectedOption.getAttribute("text");
                if (Godownmaster_Code !== undefined && Godownmaster_Code !== 0) {
                    onSelectRoll(BuyerPOMaster_Code, Godownmaster_Code);
                }
            }
        });
    }).catch(function (error) {
        toastr.error('Error fetching warehouse data:', error);
    });
}
function FillPalletType() {
    PalletPackingService.FillPalletType().then(function (response) {
        const datalist = $('#txtPalletTypeList');
        datalist.empty();
        if (response && response.length > 0) {
            response.forEach(function (item) {
                const option = $('<option>').val(item.PalletType).text(item.PalletType);
                datalist.append(option);
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
        GetPendingIDOrderWise(BuyerPOMaster_Code, GodownMaster_Code);
    } else {
        //toastr.error("API is Not Called");
    }
}
function GetPendingIDOrderWise(BuyerPOMaster_Code, GodownMaster_Code) {
    PalletPackingService.GetPendingIDOrderWise(BuyerPOMaster_Code, GodownMaster_Code).then(function (response) {
            const datalist = $('#txtScanIdentificationNoList');
            datalist.empty();
            if (response && response.length > 0) {
                response.forEach(function (item) {
                    const option = $('<option>').val(item.IdentificationNo).text(item.IdentificationNo);
                    datalist.append(option);
                });
            } else {
                toastr.error('No data received or empty response');
            }
        }).catch(function (error) {
            toastr.error('Error fetching user list:', error);
        });
    }
function onScanIdSelect(event) {   
        IdentificationNo = $("#txtScanIdentificationNo").val();
        ScanID();
    GetPendingIDOrderWise(BuyerPOMaster_Code, Godownmaster_Code);
}
function ScanID() {
    PalletPackingService.ScanID(IdentificationNo, Godownmaster_Code).then(function (response) {
        if (response.length > 0) {
            const newData = response.map((item, index) => ({
                SN: scanIdCheck.length + index + 1, 
                ...item
            }));
            const existingIds = scanIdCheck.map(item => item?.['Identification No']);
            const uniqueData = newData.filter(item => !existingIds.includes(item?.['Identification No']));
            if (uniqueData.length === 0) {
                toastr.warning('Identification number already exists in the grid.');
                return;
            }
            $("#tdlScanIdentification").show();
            
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Stock Type", "ColForWhere", "Pallet Weight","Pallet No"];
            const columnAlignment = {
                "Qty MT": 'right',
                "QtyPC": 'right',
            };
            const updatedResponse = uniqueData.map(item => {
                let ColValue = item?.['Identification No'];
                let buttonsHTML = `<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete('${item.ColForWhere}','${ColValue}')"><i class="fa-regular fa-circle-xmark"></i></button>`;
                return {
                    ...item,
                    Action: buttonsHTML,
                };
            });
            scanIdCheck = [...scanIdCheck, ...updatedResponse];
            BizsolCustomFilterGrid.CreateDataTable("table-header-ScanIdentification", "table-body-ScanIdentification", scanIdCheck, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
            if (updatedResponse?.length > 0) {
                ColForWhere = updatedResponse[0]?.ColForWhere;
                ColValue = updatedResponse[0]?.['Identification No'];
                AddIDInPallet();
                updateFooter(response);
            }
        } else {
            toastr.error('No Data Found');
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during Pallet ');
        });
}
function AddIDInPallet() {
    var PalletNo = $("#palletNo").val();
    var PalletType = $("#txtPalletType").val();
    var PalletWeight = $("#packingWt").val();
    var PalletRemark = $("#referenceNo").val();
    var PalletDate = convertDateFormat($('#txtPalletdate').val());
    if (PalletNo === '') {
        PalletNo = 0;
    }
    PalletPackingService.AddIDInPallet(ColForWhere, ColValue, PalletNo, PalletRemark, PalletWeight, PalletDate, PalletType).then(function (response) {
        if (response?.Msg) {
            $("#palletNo").val(response?.Msg);
                toastr.success("Pallet No is Saved Successfully");
            $("#Code").val(0);
            $("#txtScanIdentificationNo").val('');
        }
        error: (err) => {
            toastr.error(err.error);
        }
    });
}
function EditPallet(PalletNo1) {
    PalletNo = PalletNo1;
    PalletPackingService.GetPalletDetail(PalletNo).then(function (response) {
        if (response.length > 0) {
        let EditPalletPackingList = response.map((item, index) => ({ SN: index + 1, ...item }));
            $('#txtPalletdate').val(response[0]?.['Pallet Date']);
            $('#palletNo').val(response[0]?.PalletNo);
            $('#txtWarehouse').val(response[0]?.WareHouse);
            $('#packingWt').val(response[0]?.PalletWeight);
            $('#referenceNo').val(response[0]?.['Pallet Remark']);
            $('#txtPalletType').val(response[0]?.['Pallet Type']);
            $('#txtOrderNo1').val(response[0]?.['Order No']);
            $('#newCreateForm input').prop('disabled', true);
            $('#txtScanIdentificationNo').val('').prop('disabled', false);
            $('#newCreateForm').show();
            $('#dateAndOrderByPallet').hide();
            $('#tdlScanIdentification').show();
            
            BuyerPOMaster_Code = response[0].BuyerPOMaster_Code;
            Godownmaster_Code = response[0].GodownMaster_Code;
            editPalletTable(PalletNo, Godownmaster_Code);
            GetPendingIDOrderWise(BuyerPOMaster_Code, Godownmaster_Code);
        } else {
            toastr.error('No Data Found');
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during stock transfer');
        });  
}
function editPalletTable(PalletNo, Godownmaster_Code) {
    PalletPackingService.EditPallet(PalletNo, Godownmaster_Code).then(function (response) {
        if (response.length > 0) {
            const newEditData = response.map((item, index) => ({
                SN: scanIdCheck.length + index + 1,
                ...item
            }));
            const existingEditIds = scanIdCheck.map(item => item?.['Identification No']);
            const uniqueEditData = newEditData.filter(item => !existingEditIds.includes(item?.['Identification No']));
            //if (uniqueEditData.length === 0) {
            //    toastr.warning('Identification number already exists in the grid.');
            //    return;
            //}
            $("#tdlScanIdentification").show();

            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Stock Type", "ColForWhere", "Pallet Weight", "Pallet No"];
            const columnAlignment = {
                "Qty MT": 'right',
                "QtyPC": 'right',
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
            BizsolCustomFilterGrid.CreateDataTable("table-header-ScanIdentification", "table-body-ScanIdentification", scanIdCheck, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
            updateFooter(response);
        } else {
            toastr.error('No Data Found');
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during Pallet ');
        });
}
function GetPalletDetail(PalletNo) {
    PalletPackingService.GetPalletDetail(PalletNo).then(function (response) {
        if (response.length > 0) {
            $('#txtPalletdate').val(response[0]?.['Pallet Date']);
            $('#palletNo').val(response[0]?.PalletNo);
            $('#txtWarehouse').val(response[0]?.WareHouse);
            $('#packingWt').val(response[0]?.PalletWeight);
            $('#referenceNo').val(response[0]?.['Pallet Remark']);
            $('#txtPalletType').val(response[0]?.['Pallet Type']);
            $('#txtOrderNo1').val(response[0]?.['Order No']);
            $('#txtScanIdentificationNo').val('');
            $('#newCreateForm').show();
            $('#dateAndOrderByPallet').hide();
            $('#tdlScanIdentification').show();
            $('#newCreateForm input').prop('disabled', true);
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Stock Type", "ColForWhere"];
            const columnAlignment = {
                "Qty MT": 'right',
                "QtyPC": 'right',
            };
            const updatedResponse = response.map(item => {
                let ColValue = item?.['Identification No'];
                let buttonsHTML = `<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="Delete('${item.ColForWhere}','${ColValue}')"><i class="fa-regular fa-circle-xmark"></i></button>`;
                return {
                    ...item,
                    Action: buttonsHTML,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-ScanIdentification", "table-body-ScanIdentification", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
            updateFooter(response); 
        } else {
            toastr.error('No Data Found');
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during stock transfer');
        });
}
function updateFooter(data) {
    const calculateTotalAmount = "Total Amount";
    if (calculateTotalAmount === "Total Amount") {
        let totalQtyBalWeight = 0;
        data.forEach(row => {
            totalQtyBalWeight += parseFloat(row["Qty MT"]);
        });

        const tfootContent = `
        <tr>
        <td>Total</td>
        <td colspan="3"></td>
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
    const userConfirmed = confirm("Are you sure you want to delete this Pallet ID?");
    if (userConfirmed) {
        PalletPackingService.RemoveIDFromPallet(ColForWhere, ColValue).then(function (response) {
            if (response) {
                editPalletTable(PalletNo, Godownmaster_Code);
                scanIdCheck.pop(rowIndex)
                toastr.success("Pallet No is Deleted Successfully");
            } else {
                toastr.error('Error deleting pallet');
            }
        }).catch(function (error) {
            toastr.error('Error during delete action');
        });
    } else {
        toastr.info('Delete action cancelled');
    }
}



window.GetPackedPalletDateAndOrderWise = GetPackedPalletDateAndOrderWise;
window.FillPendingOrder = FillPendingOrder;
window.CreateNew = CreateNew;
window.Close = Close;
window.onScanIdSelect = onScanIdSelect;
window.toggleAllSelection = toggleAllSelection;
window.toggleSelection = toggleSelection;
window.EditPallet = EditPallet;
window.GetPalletDetail = GetPalletDetail;
window.Delete = Delete;