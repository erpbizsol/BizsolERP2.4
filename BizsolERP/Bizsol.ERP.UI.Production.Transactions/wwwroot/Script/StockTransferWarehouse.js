import { StockTransferReceiveService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/StockTransferReceiveService.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';

let Godownmaster_Code = 0;
let files = [];
let fileName = '';
let imageBase64Data = [];

$(document).ready(function () {
    $("#ERPHeading").text("Warehouse Receive");
            getWarehouse();

    $('#ddlRollIdNo').on('focus', function (e) {
        $("#ddlRollIdNo ").val("");
    });
    $('#fileInput').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlRollIdNo").focus();
        }
    });
    $('#ddlRollIdNo').on('keyup keypress', function (e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode === 13) {
            e.preventDefault();
            StockTransferWherehouseReceive();
            $('#ddlRollIdNo').focus()
            return false;
        }
    });
});
function getWarehouse() {    
    StockTransferReceiveService.GetWarehouse().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#ddlWarehouse')[0], response.map((item) => ({ Code: item.Code, Desp: item.GodownName })));

            $('#ddlWarehouse').select2({
                width: '-webkit-fill-available'
            });
            const inputElement = document.getElementById("ddlWarehouse");
            $('#ddlWarehouse').on("change", () => {
                const inputValue = inputElement.value;
                const selectedOption = Array.from(inputElement.options).find(
                    option => option.value === inputValue
                );
                if (selectedOption) {
                    Godownmaster_Code = selectedOption.getAttribute("value");
                    getPendingRoll(Godownmaster_Code, "0");
                    $('#tblStockReceive').hide();
                    $('#fileInput').val('');
                }
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching warehouse data:', error);
    });
}
function getPendingRoll(Godownmaster_Code) {
    StockTransferReceiveService.GetPendingRoll(Godownmaster_Code, "0").then(function (response) {
        if (response && response.length > 0) {
        AutoSuggestionControl.SetUpAutoSuggestion($('#ddlRollIdNo'), $('#ddlRollIdNoList'), response.map((item) => ({ Desp: item.IdentificationNo })), 'StartWith');
    } else {
        $('#ddlRollIdNoList').empty();
    }
    })
        .catch (function (error) {
    console.error("Error fetching pending IDs:", error);
});
        
}
function triggerFileInputClick() {
    document.getElementById('fileInput').click();
}
function FileUploadChange(event) {
    const target = event.target;
     files = target.files;
    fileName = files?.[0]?.name;

    if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target?.result;
            const byteArray = new Uint8Array(arrayBuffer);
            imageBase64Data = Array.from(byteArray);
        };
        reader.readAsArrayBuffer(file);
    }
}
function StockTransferWherehouseReceive() {
    //$('#tblStockReceive').show();
    let obj = [{
        godownMaster_Code: Godownmaster_Code,
        rollIdNo: $("#ddlRollIdNo").val(),
        user_Code: JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code,
        companyCode: JSON.parse(sessionStorage.getItem('authKey')).CompanyCode,
        attachFileName: fileName,
        attachData: imageBase64Data
    }];

    if ($('#ddlRollIdNo').val()?.includes("*")) {
        if ($('#fileInput').val() !== '') {
            Showloader();
            StockTransferReceiveService.GetPendingRoll(Godownmaster_Code, obj[0].rollIdNo).then(function (res) {
                if (res && Array.isArray(res) && res.length > 0) {
                    HideLoader();
                    $('#tblStockReceive').hide();
                    $('#myModal').modal({
                        backdrop: 'static',
                    });
                    $('#myModal').modal('show');
                    const stringFilterColumn = [];
                    const numericFilterColumn = [];
                    const dateFilterColumn = [];
                    const button = false;
                    const showButtons = [];
                    const stringDoubleFilterColumn = [];
                    const hiddenColumns = ["PackingListMaster_Code"];
                    const columnAlignment = {
                        "PackingListNo": 'right',
                        "BalQtyPC": 'right',
                        "PackingListMaster_Code": 'right'
                    };
                    const updatedResponse = res.map(item => {
                        let buttonsHTML = `<input type="checkbox" checked>`;
                        let inputHTML = `<input type="number" id="receviedQTYPC" data-packing-list-no="${item.PackingListMaster_Code}" value="${item.BalQtyPC}" min="1" max="${item.BalQtyPC}">`;
                        return {
                            ...item,
                            select: buttonsHTML,
                            ['Recevied QTY PC']: inputHTML,
                        };
                    });
                    BizsolCustomFilterGrid.CreateDataTable("table-header-NoOfVerify", "table-body-NoOfVerify", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
                    $('#paginator-NoOfVerify').hide();
                } else {
                    HideLoader();
                    //toastr.error('No Data Found');
                }
            })
                .catch(function (error) {
                    toastr.error(error.Msg || 'Error fetching pending rolls');
                });
        }
        else {
            toastr.error('Please select a file to proceed');
            $('#StockTransferReceive').hide();
            return;
        }
    } else {
        if ($('#fileInput').val() !== '') {
            Showloader();
            StockTransferReceiveService.StockTransferWherehouseReceive(JSON.stringify(obj)).then(function (response) {
                if (response && response.length > 0) {
                    HideLoader();
                    $('#tblStockReceive').show();
                    const stringFilterColumn = [];
                    const numericFilterColumn = [];
                    const dateFilterColumn = [];
                    const button = false;
                    const stringDoubleFilterColumn = [];
                    const showButtons = [];
                    const hiddenColumns = [];
                    const columnAlignment = {};

                    BizsolCustomFilterGrid.CreateDataTable("table-header-StockTransferReceive", "table-body-StockTransferReceive", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
                    $("#ddlRollIdNo").val('');
                    ChangeBackgroundColor();
                    $('#paginator-StockTransferReceive').hide();
                    getPendingRoll(Godownmaster_Code);
                } else {
                    HideLoader();
                    //toastr.error('No Data Found');
                }
            })
                .catch(function (error) {
                    toastr.error(error.Msg || 'Error during stock transfer');
                });
        }
        else {
            toastr.error('Please select a file to proceed');
            $('#tblStockReceive').hide();
            return;
        }         
    }
}
function ChangeBackgroundColor() {
    const tableRows = document.querySelectorAll('#table-body-StockTransferReceive tr');
    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            if (cell.textContent.trim() === 'Entry is invalid' ) {
                cell.style.backgroundColor = 'red';
                cell.style.color = 'white';
            }
            else if (cell.textContent.trim() === 'Entry is Accepted' || cell.textContent.includes("received") === true){
                cell.style.backgroundColor = 'green';
                cell.style.color = 'white';
            }
        });
    });
}
function SaveReceivedData() {
    let ReveivedTable = document.getElementById("table-body-NoOfVerify");
    let selectedRows = [];
    for (let i = 0; i < ReveivedTable.rows.length; i++) {
        const rowData = ReveivedTable.rows[i];
        let isChecked = rowData.children[0].getElementsByTagName('input')[0].checked;

        let PackingListMaster_Code = rowData.children[6].getElementsByTagName('input')[0].attributes["data-packing-list-no"].value;

        const rowValues = {
            PackingListMaster_Code: PackingListMaster_Code,
            ReceviedQty: rowData.children[6].getElementsByTagName('input')[0].value
        };

        if (isChecked) {
            selectedRows.push(rowValues);
        } else {
            const index = selectedRows.findIndex(r => r.PackingListMaster_Code === rowValues.PackingListMaster_Code);
            if (index !== -1) {
                selectedRows.splice(index, 1);
            }
        }
    }

    if (selectedRows.length > 0) {
        let isValid = true;
        let Data = selectedRows.map(row => {
            const receviedQty = parseInt(row.ReceviedQty);
            const inputField = $(`#receviedQTYPC[data-packing-list-no="${row.PackingListMaster_Code}"]`);
            const maxQty = parseInt(inputField.attr('max'));
            if (receviedQty < 1 || receviedQty > maxQty) {
                toastr.error('Received quantity must be between 1 and the available balance.');
                isValid = false;
                return null; 
            }

            return {
                godownMaster_Code: Godownmaster_Code,
                rollIdNo: $("#ddlRollIdNo").val(),
                user_Code: JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code,
                companyCode: JSON.parse(sessionStorage.getItem('authKey')).CompanyCode,
                attachFileName: fileName,
                attachData: imageBase64Data,
                packingListMaster_Code: row.PackingListMaster_Code,
                receviedQTY: receviedQty
            };
        }).filter(item => item !== null); 
        if (isValid && Data.length > 0) {
            Showloader();
            StockTransferReceiveService.ItemWaiseVerifyRollIdInPackingList(JSON.stringify(Data)).then(function (response) {
                if (response.Status === 'Y') {
                    HideLoader();
                    $('#tblStockReceive').show();
                    toastr.success(response.Msg);
                    let msgData = []
                    msgData.push({
                        "Desp": "Chemical Item",
                        "Value": response.Msg

                    })
                    const stringFilterColumn = [];
                    const numericFilterColumn = [];
                    const dateFilterColumn = [];
                    const button = false;
                    const stringDoubleFilterColumn = [];
                    const showButtons = [];
                    const hiddenColumns = [];
                    const columnAlignment = {};

                    BizsolCustomFilterGrid.CreateDataTable("table-header-StockTransferReceive", "table-body-StockTransferReceive", msgData, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
                    ChangeBackgroundColor();
                    $('#paginator-StockTransferReceive').hide();
                    $("#ddlRollIdNo").val('');
                    CloseModal();
                    ClearForm();
                }
            }).catch(function (error) {
                toastr.error(error.Msg || 'Error processing received data');
            });
        } 
    } else {
        toastr.error('No rows selected');
    }
}
function CloseModal() {
    $('#myModal').modal('hide');
}
function ClearForm() {
    $("#fileInput").val('');
    //$("#ddlRollIdNoList").val('');
    getPendingRoll(Godownmaster_Code);
}
function BindSelectList(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

window.FileUploadChange = FileUploadChange;
window.CloseModal = CloseModal;
window.SaveReceivedData = SaveReceivedData;
window.triggerFileInputClick = triggerFileInputClick;