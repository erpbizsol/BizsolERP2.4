import { PhysicalStockTakingItemService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/PhysicalStockTakingItemService.js';

let ItemMaster_Code = 0;
let IdentificationNo = '';
let G_PhysicalStockTackingMaster_Code = 0;
let responseData = [];
let todayDate = '';

$(document).ready(function () {
    $("#ERPHeading").text("Stock Audit");
    highlightSelectedDates();
    PhysicalStockTackingSummary();
    handlePhysicalWarehouseField();
    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();

    $('#txtdate').val(`${day}/${month}/${year}`);
    setupDateInputFormatting();
    todayDate = convertDateFormat($('#txtdate').val());

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
            IdentificationNo = $('#txtScanIdentificationNo').val();
            ScanCoilDetails(IdentificationNo, ItemMaster_Code);
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
function CreateNew(todayDate) {
    $("#dateWisePhysicalStock").hide();
    $("#newCreateForm").show();
    GetWarehouse();
    GetItemName();
    todayDate = todayDate == '0' ? $('#txtdate').val() : todayDate;
    PhysicalStockTackingSummaryByAsOnDateCreate(convertDateFormat(todayDate));
}
function PhysicalStockTackingSummary() {
    Showloader();
    PhysicalStockTakingItemService.PhysicalStockTackingSummary().then(function (response) {
        if (response && response.length > 0) {
            $("#tbldateWisePhysicalStock").show();
            HideLoader();
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["PhysicalStockTackingMaster_Code"];
            const columnAlignment = {
                "QtyPC":'right',
                "QtyMT":'right',
                "AsOnDate":'center',
            };
            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="CreateNew('${item.AsOnDate}')"><i class="fa-solid fa-pencil"></i></button>&nbsp;<button class="btn btn-info icon-height mb-1" title="View" onclick="ViewModal_OpenReport('${item.AsOnDate}')"><i class="fa-regular fa-eye"></i></button>
                                   <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeletePhysicalStock('${item.PhysicalStockTackingMaster_Code}')"><i class="fa-regular fa-circle-xmark"></i></button>`;

                return {
                    ...item,
                    Action: buttonsHTML,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-tbldateWisePhysicalStock", "table-body-tbldateWisePhysicalStock", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $("#tbldateWisePhysicalStock").hide();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during stock transfer');
            $("#tbldateWisePhysicalStock").hide();
        });
}
function handlePhysicalWarehouseField() {
    PhysicalStockTakingItemService.GetFixedParaMeter().then(function (response) {
        if (response[0].PeramaterValue === "Y") {
            $('#PerameterBasedHideAndShow').show();
        } else if (response[0].PeramaterValue === "N") {
            $('#PerameterBasedHideAndShow').hide();
        }
    }).catch(function (error) {
        console.log("Error fetching the parameter:", error);
    });
}
function PhysicalStockTackingSummaryByAsOnDateCreate(todayDate) {
    Showloader();
    PhysicalStockTakingItemService.PhysicalStockTackingSummaryByAsOnDate(todayDate).then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            $("#txtdate").val(response[0].AsOnDate); 
            $("#remarks").val(response[0].Remark);
             G_PhysicalStockTackingMaster_Code = response[0].PhysicalStockTackingMaster_Code;
            PhysicalStockTackingTransactionDetails(G_PhysicalStockTackingMaster_Code);
        }
        else {
            toastr.error("Please Create A New Stock Audit");
            HideLoader();
            G_PhysicalStockTackingMaster_Code = 0;
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error fetching ');
            G_PhysicalStockTackingMaster_Code = 0;
        }); 
}
function ScanCoilDetails(IdentificationNo, ItemMaster_Code) {
    PhysicalStockTakingItemService.ScanCoilDetails(IdentificationNo, ItemMaster_Code).then(function (response) {
        if (response && response.length > 0) {
             //todayDate = $("#txtdate").val();
            let Remark = $("#remarks").val();
            let StockType = response[0].StockType;
            let ItemSizeMaster_Code = response[0].ItemSizeMaster_Code;
            let QtyPC = response[0].QtyPC;
            let QtyMT = response[0].QtyMT;
            let QtyMTRS = 0;
            let Status = "A";
            let GodownMaster_Code = $("#ddlPhysicalWarehouse").val();
            AddPhysicalStock(todayDate, Remark, IdentificationNo, StockType, ItemMaster_Code, ItemSizeMaster_Code, QtyPC, QtyMT, QtyMTRS, Status, GodownMaster_Code, G_PhysicalStockTackingMaster_Code);
        } else {
            toastr.error('No Data Found');
            OpenModal();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error fetching pending rolls');
        });
}
function AddPhysicalStock(todayDate, Remark, IdentificationNo, StockType, ItemMaster_Code, ItemSizeMaster_Code, QtyPC, QtyMT, QtyMTRS, Status, GodownMaster_Code, PhysicalStockTackingMaster_Code) {
    PhysicalStockTakingItemService.AddPhysicalStock(todayDate, Remark, IdentificationNo, StockType, ItemMaster_Code, ItemSizeMaster_Code, QtyPC, QtyMT, QtyMTRS, Status, GodownMaster_Code, PhysicalStockTackingMaster_Code).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            G_PhysicalStockTackingMaster_Code = response.Code;
            PhysicalStockTackingTransactionDetails(G_PhysicalStockTackingMaster_Code);
            $("#txtScanIdentificationNo").val('');
            ScanIdDataListStockTacing(ItemMaster_Code);
        }
        else {
            toastr.error("Error adding physical stock: " + response.Msg);
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error processing the stock addition');
    });
}
function DeletePhysicalStock(PhysicalStockTackingMaster_Code) {
        if (confirm(`Are you sure you want to Delete`) == true) {
            Showloader();
             PhysicalStockTakingItemService.DeletePhysicalStock(PhysicalStockTackingMaster_Code).then(function (response) {
                if (response.Status == 'Y') {
                    HideLoader();
                    toastr.success(response.Msg);
                    PhysicalStockTackingSummary();
                } else {
                    toastr.error(response.Msg);
                    HideLoader();
                }
            });
        }
}
function ViewModal_OpenReport(todayDate) {
    Showloader();
    PhysicalStockTakingItemService.PhysicalStockTackingReportAsOnDate(todayDate).then(function (response) {
        if (response && response.length > 0) {
            $('#ViewModal_Open').modal({
                backdrop: 'static',
            });
            $('#ViewModal_Open').modal('show');
            HideLoader();
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const columnAlignment = {};
            
            BizsolCustomFilterGrid.CreateDataTable("table-header-tblViewModal_Open", "table-body-tblViewModal_Open", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $("#tblViewModal_Open").hide();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during stock transfer');
            $("#tblViewModal_Open").hide();
        });
}
function PhysicalStockTackingTransactionDetails(PhysicalStockTackingMaster_Code) {
    PhysicalStockTakingItemService.PhysicalStockTackingTransactionDetails(PhysicalStockTackingMaster_Code).then(function (response) {
        if (response && response.length > 0) {
            const existingIds = [];
                $("#tblPhysicalStockTaking tbody tr").each(function() {
                    const stockId = $(this).find("td.StockID").text(); 
                    if (stockId) {
                        existingIds.push(stockId);
                    }
                });
            const seenStockIds = new Set();
            const hasDuplicate = response.some(item => {
                if (seenStockIds.has(item.StockID)) {
                    return true;  
                }
                seenStockIds.add(item.StockID);
                return false;
            });

            if (hasDuplicate) {
                toastr.warning('Duplicate StockID found in the data.');
                return;  
            }
            const uniqueData = response.filter(item => !existingIds.includes(item?.StockID));

                if (uniqueData.length === 0) {
                    toastr.warning('Identification number already exists in the grid.');
                    return;
                }
                    $("#tblPhysicalStockTaking").hide();
                    $("#tblAddPhysicalStock").show();
                    const stringFilterColumn = [];
                    const numericFilterColumn = [];
                    const dateFilterColumn = [];
                    const button = false;
                    const showButtons = [];
                    const stringDoubleFilterColumn = [];
                    const hiddenColumns = ["Code", "StockType", "ItemMaster_Code", "ItemSizeMaster_Code", "PhysicalStockTackingMaster_Code","Remark"];
                    const columnAlignment = {};
            const updatedResponse = response.map(item => {
                let inputQTYPC = `<input type="text" id="tblQtyPC" class="box_border form-control form-control-sm" style="width:80px;text-align:right" value="${item.QtyPC}" autocomplete="off" maxlength="3" oninput="validateInput(this)" onfocusout="UpdateQtyInPhysicalStock('${item.PhysicalStockTackingMaster_Code}','${item.Code}')"/>`;
                let inputQTYMT = `<input type="text" id="tblQtyMT" class="box_border form-control form-control-sm" style="width:80px;text-align:right" value="${item.QtyMT}" autocomplete="off" maxlength="7" oninput="validateDecimalInput(this)" onfocusout="UpdateQtyInPhysicalStock('${item.PhysicalStockTackingMaster_Code}','${item.Code}')"/>`;
                let inputRemark = `<input type="text" id="tblRemark" class="box_border form-control form-control-sm" style="width:80px" value="${item.TRemark}" autocomplete="off" onfocusout="UpdateQtyInPhysicalStock('${item.PhysicalStockTackingMaster_Code}','${item.Code}')"/>`;
                let inputStatus = `<select id="tblStatus" class="form-control form-control-sm box_border" style="width:80px" autocomplete="off" onfocusout="UpdateQtyInPhysicalStock('${item.PhysicalStockTackingMaster_Code}','${item.Code}')">
                <option value="A" ${item.Status === 'Accepted' ? 'selected' : ''}>Accepted</option>
                <option value="H" ${item.Status === 'Hold' ? 'selected' : ''}>Hold</option>
                <option value="C" ${item.Status === 'To Be Check' ? 'selected' : ''}>To Be Check</option></select>`;
                let buttonsHTMLRemove = `<button class="btn btn-warning icon-height mb-1" onclick="RemovePhysicalStock('${item.PhysicalStockTackingMaster_Code}','${item.Code}')" title="Remove Physical Stock ID"><i class="fa fa-remove"></i></button>`
                        return {
                            ...item,
                            QtyPC: inputQTYPC,
                            QtyMT: inputQTYMT,
                            TRemark: inputRemark,
                            Status: inputStatus,
                            Action: buttonsHTMLRemove,
                            
                        };
                    });
            BizsolCustomFilterGrid.CreateDataTable("table-header-tblAddPhysicalStock", "table-body-tblAddPhysicalStock", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);

        } else {
                    $("#tblAddPhysicalStock").hide();
                    toastr.error("No data found");
                }
            })
                .catch(function (error) {
                    toastr.error(error.Msg || 'Error fetching pending rolls');
                });
}
function validateInput(input) {
    input.value = input.value.replace(/[^0-9]/g, ''); 
    if (input.value.length > 3) {
        input.value = input.value.slice(0, 3); 
    }
}
function UpdateQtyInPhysicalStock(PhysicalStockTackingMaster_Code, TransactionCode) {
    const row = $(event.target).closest('tr');
    let updateQtyPC = row.find('input[id="tblQtyPC"]').val();
    let updateQtyMT = row.find('input[id="tblQtyMT"]').val(); 
    let updateQtyMTRS = 0;
    let updateStatus = row.find('select[id="tblStatus"]').val();
    let updateRemark = row.find('input[id="tblRemark"]').val();
    PhysicalStockTakingItemService.UpdateQtyInPhysicalStock(PhysicalStockTackingMaster_Code, TransactionCode, updateQtyPC, updateQtyMT, updateQtyMTRS, updateStatus, updateRemark).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            PhysicalStockTackingTransactionDetails(PhysicalStockTackingMaster_Code);
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error updating quantity in physical stock.');
    });
}
function validateDecimalInput(input) {
    let value = input.value.replace(/[^0-9.]/g, '');
    let parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts[1]; 
    }
    if (value.length > 7) {
        value = value.slice(0, 7);
    }
    if (parts[1] && parts[1].length > 3) {
        value = parts[0] + '.' + parts[1].slice(0, 3); 
    }
    input.value = value;
}
function RemovePhysicalStock(PhysicalStockTackingMaster_Code, Code) {
    if (confirm(`Are you sure you want to Remove`) == true) {
        Showloader();
        PhysicalStockTakingItemService.RemovePhysicalStock(PhysicalStockTackingMaster_Code, Code).then(function (response) {
            if (response.Status == 'Y') {
                HideLoader();
                toastr.success(response.Msg);
                PhysicalStockTackingTransactionDetails(PhysicalStockTackingMaster_Code);
            } else {
                toastr.error(response.Msg);
                HideLoader();
            }
        });
    }  
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
function GetPhysicalType() {
    let PhysicalType = $("#ddlPhysicalType").val();
}
function GetItemName() {
    PhysicalStockTakingItemService.GetItemName().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#ddlItemName')[0], response.map((item) => ({ Code: item.Code, Desp: item.ItemName })));

            $('#ddlItemName').select2({
                width: '-webkit-fill-available'
            });
            $('#ddlItemName').on('change', function () {
                let selectedOption = this.options[this.selectedIndex];
                 ItemMaster_Code = selectedOption.value; 
                if (ItemMaster_Code) {
                    ScanIdDataListStockTacing(ItemMaster_Code);
                }
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching data:', error);
    });
}
function ScanIdDataListStockTacing(ItemMaster_Code) {
    Showloader();
    PhysicalStockTakingItemService.ScanIdDataListStockTacing(ItemMaster_Code)
        .then(function (response) {
            HideLoader();

            const datalist = $('#txtScanIdentificationNoList');
            datalist.empty();

            if (response && Array.isArray(response) && response.length > 0) {
                response.forEach(function (item) {
                    if (item.StockIDCombo) { 
                        const option = $('<option>').val(item.StockID).text(item.StockID);
                        datalist.append(option);
                    }
                });

                $('#txtScanIdentificationNo').off('keydown').on('keydown', function (e) {
                    if (e.key === "Enter") {
                        let IdentificationNo = $("#txtScanIdentificationNo").val();
                        ScanCoilDetails(IdentificationNo, ItemMaster_Code);
                    }
                });
            } else {
                //toastr.error('No data received or empty response');
                HideLoader();
            }
        })
        .catch(function (error) {
            toastr.error('Error fetching user list:', error);
        });
}
function GetddlSizeDesp() {
    PhysicalStockTakingItemService.GetddlSizeDesp(ItemMaster_Code).then(function (response) {
            if (response && response.length > 0) {
                BindSelectList($('#ddlItemSize')[0], response.map((item) => ({ Code: item.Code, Desp: item.SizeDesp })));

                $('#ddlItemSize').select2({
                    width: '-webkit-fill-available'
                });
                //let SizeDesp= $('#ddlItemSize').val();
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
    GetddlSizeDesp();
}
function NewSizeModal() {

}
function NewAddSizePhysical_Stock() {

}
function CloseModal() {
    $('#myModal').modal('hide');
}
function CloseModalView_Physical() {
    $('#ViewModal_Open').modal('hide');
}
function PhysicalStock_Back() {
    $("#dateWisePhysicalStock").show();
    $("#newCreateForm").hide();
    $("#tblPhysicalStockTaking").hide();
    $("#tblAddPhysicalStock").hide();
    $("#ddlItemName").val('');
    $("#txtScanIdentificationNo").val('');
    $("#txtScanIdentificationNoList").empty();
    PhysicalStockTackingSummary();
}
window.ScanCoilDetails = ScanCoilDetails;
window.CreateNew = CreateNew;
window.CloseModal = CloseModal;
window.CloseModalView_Physical = CloseModalView_Physical;
window.PhysicalStock_Back = PhysicalStock_Back;
window.validateInput = validateInput;
window.validateDecimalInput = validateDecimalInput;
window.NewSizeModal = NewSizeModal;
window.GetPhysicalType = GetPhysicalType;
window.RemovePhysicalStock = RemovePhysicalStock;
window.DeletePhysicalStock = DeletePhysicalStock;
window.ViewModal_OpenReport = ViewModal_OpenReport;
window.UpdateQtyInPhysicalStock = UpdateQtyInPhysicalStock;
window.NewAddSizePhysical_Stock = NewAddSizePhysical_Stock;