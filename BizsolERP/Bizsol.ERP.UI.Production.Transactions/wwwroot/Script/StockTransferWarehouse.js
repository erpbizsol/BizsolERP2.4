import { StockTransferReceiveService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/StockTransferReceiveService.js';

let Godownmaster_Code = 0;
let imageSrc = null;
let base64String = '';
let files = [];
let fileName = '';
let base64Data = [];
let imageBase64Data = [];
let selectedRows = [];
let PartyName = '';
$(document).ready(function () {
    $("#ERPHeading").text("Warehouse Receive");

        $('#myTab').on('shown.bs.tab', function (e) {
            const targetTab = $(e.target).attr('id');  
            if (targetTab === 'home-tab') {
                getWarehouse();
            } else if (targetTab === 'profile-tab') {
                getPartyNamePendingPackingListActualDespatch();
            }
        });
        if ($('#home-tab').hasClass('active')) {
            getWarehouse();
            
    }
    $('#ddlWarehouse').on('focus', function (e) {
        $("#ddlWarehouse").val("");
    });
    $('#ddlRollIdNo').on('focus', function (e) {
        $("#ddlRollIdNo ").val("");
    });
    $('#ddlWarehouse').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#fileInput").focus();
        }
    });
    $('#fileInput').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlRollIdNo").focus();
        }
    });
    $('#ddlRollIdNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            StockTransferWherehouseReceive();
        }
    });
    });
function getWarehouse() {
    $('#ddlWarehouse').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#fileInput").focus();
        }
    });
    $('#fileInput').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlRollIdNo").focus();
        }
    });
    $('#ddlRollIdNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            StockTransferWherehouseReceive();
        }
    });
    
    StockTransferReceiveService.GetWarehouse().then(function (response) {
        if (response && response.length > 0) {
            $('#ddlWarehouseList option').remove();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                option += '<option text="' + response[i].Code + '" value="' + response[i].GodownName + '" >' + response[i].GodownName + '</option>';
            }
            $('#ddlWarehouseList')[0].innerHTML = option;
        } else {
            toastr.error('No data received or empty response');
        }
        const inputElement = document.getElementById("ddlWarehouse");
        const dataList = document.getElementById("ddlWarehouseList");
            inputElement.addEventListener("input", () => {
                const inputValue = inputElement.value;
                const selectedOption = Array.from(dataList.options).find(
                    option => option.value === inputValue
                );
                if (selectedOption) {
                     Godownmaster_Code = selectedOption.getAttribute("text");
                    getPendingRoll(Godownmaster_Code, "0");
                }
            });
    }).catch(function (error) {
        toastr.error('Error fetching warehouse data:', error);
    });
}
function getPendingRoll(Godownmaster_Code) {
    StockTransferReceiveService.GetPendingRoll(Godownmaster_Code, "0").then(function (response) {
            const datalist = $('#ddlRollIdNoList');
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
    let obj = [{
        godownMaster_Code: Godownmaster_Code,
        rollIdNo: $("#ddlRollIdNo").val(),
        user_Code: JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code,
        companyCode: JSON.parse(sessionStorage.getItem('authKey')).CompanyCode,
        attachFileName: fileName,
        attachData: imageBase64Data
    }];

    if ($('#ddlRollIdNo').val()?.includes("*")) {
        $('#myModal').modal('show');
        $('#myModal').modal({
            backdrop: 'static',
        });
        StockTransferReceiveService.GetPendingRoll(Godownmaster_Code, obj[0].rollIdNo).then(function (res) {
                if (res && Array.isArray(res) && res.length > 0) {
                    const stringFilterColumn = [];
                    const numericFilterColumn = [];
                    const dateFilterColumn = [];
                    const button = false;
                    const showButtons = [];
                    const stringDoubleFilterColumn = [];
                    const hiddenColumns = [];
                    const columnAlignment = {
                        "PackingListNo": 'right',
                        "BalQtyPC": 'right',
                        "PackingListMaster_Code": 'right'
                    };
                    const updatedResponse = res.map(item => {
                        let buttonsHTML = `<input type="checkbox" onchange="toggleSelection(this, this.checked)">`;
                        let inputHTML = `<input type="number" id="receviedQTYPC" value="${item.BalQtyPC}" min="1" max="${item.BalQtyPC}">`;
                        return {
                            ...item,
                            select: buttonsHTML,
                            ['Recevied QTY PC']: inputHTML,
                        };
                    });
                    BizsolCustomFilterGrid.CreateDataTable("table-header-NoOfVerify", "table-body-NoOfVerify", updatedResponse,button,showButtons,stringFilterColumn,numericFilterColumn,dateFilterColumn,stringDoubleFilterColumn,hiddenColumns,columnAlignment);
                } else {
                    toastr.error('No Data Found');
                }
            })
            .catch(function (error) {
                toastr.error(error.Msg || 'Error fetching pending rolls');
            });
            } else {
                    StockTransferReceiveService.StockTransferWherehouseReceive(JSON.stringify(obj)).then(function (response) {
                            if (response && Array.isArray(response) && response.length > 0) {
                                const stringFilterColumn = [];
                                const numericFilterColumn = [];
                                const dateFilterColumn = [];
                                const button = false;
                                const stringDoubleFilterColumn = [];
                                const showButtons = [];
                                const hiddenColumns = [];
                                const columnAlignment = {};

                                BizsolCustomFilterGrid.CreateDataTable("table-header","table-body",response,button,showButtons,stringFilterColumn,numericFilterColumn,dateFilterColumn,stringDoubleFilterColumn,hiddenColumns,columnAlignment);
                            } else {
                                toastr.error('No Data Found');
                            }
                        })
                        .catch(function (error) {
                            toastr.error(error.Msg || 'Error during stock transfer');
                        });
    }
}
function toggleSelection(row, isChecked) {
    const rowData = $(row).closest('tr'); 
    let PackingListNo = rowData[0].children[3].innerText;
    const rowValues = {
        PackingListNo: PackingListNo,
        ReceviedQty: rowData.find('#receviedQTYPC').val() 
    };

    if (isChecked) {
        selectedRows.push(rowValues);
    } else {
        const index = selectedRows.findIndex(r => r.PackingListNo === rowValues.PackingListNo);
        if (index !== -1) {
            selectedRows.splice(index, 1);
        }
    }
}
function SaveReceivedData() {
    if (selectedRows.length > 0) {
        let Data = selectedRows.map(row => ({
            godownMaster_Code: Godownmaster_Code,
            rollIdNo: $("#ddlRollIdNo").val(),
            user_Code: JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code,
            companyCode: JSON.parse(sessionStorage.getItem('authKey')).CompanyCode,
            attachFileName: fileName,
            attachData: imageBase64Data,
            packingListMaster_Code: row.PackingListNo,
            receviedQTY: row.ReceviedQty
        }));
        StockTransferReceiveService.ItemWaiseVerifyRollIdInPackingList(JSON.stringify(Data)).then(function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                CloseModal();
            } 
        }).catch(function (error) {
            toastr.error(error.Msg || 'Error processing received data');
        });
    } else {
        toastr.error('No rows selected');
    }
}
function getPartyNamePendingPackingListActualDespatch() {
    $('#ddlPartyName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#ddlPalletNo").focus();
        }
    });
    $('#ddlPalletNo').on('keydown', function (e) {
        if (e.key === "Enter") {
            GetPalletActualDespatchDetails();
        }
    });
    StockTransferReceiveService.GetPartyNamePendingPackingListActualDespatch().then(function (response) {
        if (response && response.length > 0) {
            $('#ddlPartyNameList option').remove();
            var option = '';
            for (var i = 0; i < response.length; i++) {
                option += '<option text="' + response[i].Code + '" value="' + response[i].AccountDesp + '" >' + response[i].AccountDesp + '</option>';
            }
            $('#ddlPartyNameList')[0].innerHTML = option;
        } else {
            toastr.error('No data received or empty response');
        }
        const inputElement = document.getElementById("ddlPartyName");
        const dataList = document.getElementById("ddlPartyNameList");
        inputElement.addEventListener("input", () => {
            const inputValue = inputElement.value;
            const selectedOption = Array.from(dataList.options).find(
                option => option.value === inputValue
            );
            if (selectedOption) {
                PartyName = $("#ddlPartyName").val();
                getPendingPackingListPalletsActualDespatch(PartyName);
            }
        });
    }).catch(function (error) {
        toastr.error('Error fetching warehouse data:', error);
    });
}
function getPendingPackingListPalletsActualDespatch(PartyName) {
    StockTransferReceiveService.GetPendingPackingListPalletsActualDespatch(PartyName).then(function (response) {
        const datalist = $('#ddlPalletNoList');
        datalist.empty();
        if (response && response.length > 0) {
            response.forEach(function (item) {
                const option = $('<option>').val(item.PalletNo).text(item.PalletNo);
                datalist.append(option);
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function GetPalletActualDespatchDetails() {
    let PalletNo = $("#ddlPalletNo").val();
    PartyName = $("#ddlPartyName").val();
    StockTransferReceiveService.GetPalletActualDespatchDetails(PalletNo, PartyName).then(function (results) {
        if (results && Array.isArray(results) && results.length > 0) {
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const ColumnAlignment = {};
            BizsolCustomFilterGrid.CreateDataTable("table-header-ActualDispatch", "table-body-ActualDispatch", results, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
        else {
            toastr.error('No Data Found');
        }
    }).catch(error => {
        toastr.error(error.Msg);
    });
    
}
function CloseModal() {
    $('#myModal').modal('hide');
}

window.getWarehouse = getWarehouse;
window.getPendingRoll = getPendingRoll;
window.FileUploadChange = FileUploadChange;
window.getPendingPackingListPalletsActualDespatch = getPendingPackingListPalletsActualDespatch;
window.getPartyNamePendingPackingListActualDespatch = getPartyNamePendingPackingListActualDespatch;
window.CloseModal = CloseModal;
window.SaveReceivedData = SaveReceivedData;
window.toggleSelection = toggleSelection;
window.triggerFileInputClick = triggerFileInputClick;