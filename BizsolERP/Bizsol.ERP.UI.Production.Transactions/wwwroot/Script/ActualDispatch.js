import { StockTransferReceiveService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/StockTransferReceiveService.js';

let PartyName = '';
$(document).ready(function () {
    $("#ERPHeading").text("Actual Dispatch");
    getPartyNamePendingPackingListActualDespatch();
});
function getPartyNamePendingPackingListActualDespatch() {
    $('#ddlPartyName').on('focus', function (e) {
        $("#ddlPartyName").val("");

        $("#tblActualDispatch tbody").empty();

        $("#tblActualDispatch").hide();
    });
    $('#ddlPartyName').on('change', function (e) {
        if ($(this).val() !== "") {
            $("#tblActualDispatch").show();
        }
    });
    $('#ddlPartyName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#btnShow").focus();
        }
    });
    Showloader();
    StockTransferReceiveService.GetPartyNamePendingPackingListActualDespatch().then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
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
                //getPendingPackingListPalletsActualDespatch(PartyName);
            }
        });
    }).catch(function (error) {
        toastr.error('Error fetching warehouse data:', error);
    });
}
//function getPendingPackingListPalletsActualDespatch(PartyName) {
//    StockTransferReceiveService.GetPendingPackingListPalletsActualDespatch(PartyName).then(function (response) {
//        const datalist = $('#ddlPalletNoList');
//        datalist.empty();
//        if (response && response.length > 0) {
//            response.forEach(function (item) {
//                const option = $('<option>').val(item.PalletNo).text(item.PalletNo);
//                datalist.append(option);
//            });
//        } else {
//            toastr.error('No data received or empty response');
//        }
//    }).catch(function (error) {
//        toastr.error('Error fetching user list:', error);
//    });
//}
//function PackingActualPalletIDDispatch() {
//    let PalletNo = $("#ddlPalletNo").val();
//    PartyName = $("#ddlPartyName").val();
//    if (PalletNo == "") {
//        return;
//    }
//    StockTransferReceiveService.PackingActualPalletIDDispatch(PalletNo, PartyName).then(function (response) {
//        $("#ddlPalletNo ").val("");
//        toastr.success(response.Msg);
//        StockTransferReceiveService.GetPalletActualDespatchDetails(PalletNo, PartyName).then(function (results) {
//            if (results && Array.isArray(results) && results.length > 0) {
//                const stringFilterColumn = [];
//                const numericFilterColumn = [];
//                const dateFilterColumn = [];
//                const button = false;
//                const stringDoubleFilterColumn = [];
//                const showButtons = [];
//                const hiddenColumns = [];
//                const ColumnAlignment = {};
//                BizsolCustomFilterGrid.CreateDataTable("table-header-ActualDispatch", "table-body-ActualDispatch", results, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
//            }
//            else {
//                toastr.error('No Data Found');
//            }
//        }).catch(error => {
//            toastr.error(error.Msg);
//        });


//    });
//}
function onPartyNameSelectGrid() {
    PartyName = $("#ddlPartyName").val();
    if (PartyName == "") {
        toastr.warning("Please Select the Party Name!");
        return;
    }
    StockTransferReceiveService.GetPendingPackingListActualDespatch(PartyName).then(function (response) {
        if (response.length > 0) {
            const stringFilterColumn = ["Party Name", "Warehouse"];
            const numericFilterColumn = ["QtyPc", "QtyMT", "QtyMTRS", "Bal Qty PC", "Bal Qty MT", "Bal Qty Mtrs", "PackingListNo"];
            const dateFilterColumn = ["Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["PackingListMaster_Code"];
            const ColumnAlignment = {
                "QtyPc": 'right',
                "QtyMT": 'right',
                "QtyMTRS": 'right',
                "Bal Qty PC": 'right',
                "Bal Qty MT": 'right',
                "Bal Qty Mtrs": 'right',
                "PackingListDate": 'center',
                "PackingListNo": 'center',

            };
            const updatedResponse = response.map(item => {
                let Action = `<button class="btn btn-success icon-height mb-1" title="Update All" onclick="updateAll(${item?.PackingListMaster_Code})"><i class="fa fa-check-circle"></i></button>
                <button class="btn btn-primary icon-height mb-1" title="Edit" onclick="openModal(${item?.PackingListMaster_Code},${item?.PackingListNo})"><i class="fa-solid fa-pencil"></i></button>`;
                return {
                    ...item,
                    Action
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-ActualDispatch", "table-body-ActualDispatch", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
            if (updatedResponse?.length > 0) {
                updateFooter(response);
            }
        }
        else {
            toastr.error('No Data Found');
        }
    }).catch(error => {
        toastr.error(error.Msg);
    });
}
function updateAll(PackingListMaster_Code) {
    const isConfirmed = confirm("Are You Sure! Dispatch All Pallet Of This Packing List");
    if (isConfirmed) {
        StockTransferReceiveService.PackingListActualDespatchAllPallet(PackingListMaster_Code).then(function (response) {
            onPartyNameSelectGrid();
            toastr.success(response.Msg);
        });
    }
}
function openModal(PackingListMaster_Code, PackingListNo) {
    $('#txtPackingListMaster_Code').val(PackingListMaster_Code);
    $('#myModal').modal({
        backdrop: 'static',
    });
    GetPendingPackingListActualDespatchDetails(PackingListMaster_Code, PackingListNo);
    $('#myModal').modal('show');
}
function GetPendingPackingListActualDespatchDetails(PackingListMaster_Code, PackingListNo) {
    StockTransferReceiveService.GetPendingPackingListActualDespatchDetails(PackingListMaster_Code).then(function (response) {
        if (response.length > 0) {
            const item = response[0];
            let PartyName = $('#ddlPartyName').val();
            $('#modal-title').text(`${PartyName} (${PackingListNo})`);
            const stringFilterColumn = ["PalletNo", "SizeDesp", "ItemName"];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                "QtyPc": 'right',
                "QtyMT": 'right',
                "QtyMTRS": 'right',
                "PackingListDate": 'center',
                "PackingListNo": 'center',

            };
            const updatedResponse = response.map(item => {
                let Action = `<input type="checkbox" onchange="toggleSelection(${item?.PalletNo})">`;
                return {
                    ...item,
                    Action
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-NoOfDispatch", "table-body-NoOfDispatch", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
        }
        else {
            toastr.error('No Data Found');
        }
    }).catch(error => {
        toastr.error(error.Msg);
    });
}
function toggleSelection(PalletNo) {
    let ReveivedTable = document.getElementById("table-body-NoOfDispatch");
    let PartyName = $('#ddlPartyName').val();
    StockTransferReceiveService.PackingActualPalletIDDispatch(PalletNo, PartyName).then(function (response) {
        var PackingListMaster_Code = $('#txtPackingListMaster_Code').val();
        GetPendingPackingListActualDespatchDetails(PackingListMaster_Code);
        toastr.success(response.Msg);
    })
        .catch(function (error) {
            toastr.error(error.Msg);
        });
}
function CloseModal() {
    onPartyNameSelectGrid();
    $('#myModal').modal('hide');
}
function updateFooter(data) {
    const calculateTotalAmount = "Total Amount";
    if (calculateTotalAmount === "Total Amount") {
        let totalQtyBalWeight = 0;
        let totalQtyMTWeight = 0;
        let totalQtyMTRSWeight = 0;

        let totalQtyBalPCWeight = 0;
        let totalQtyBalMTWeight = 0;
        let totalQtyBalMTRSWeight = 0;
        data.forEach(row => {
            totalQtyBalWeight += parseFloat(row["QtyPc"]);
            totalQtyMTWeight += parseFloat(row["QtyMT"]);
            totalQtyMTRSWeight += parseFloat(row["QtyMTRS"]);

            totalQtyBalPCWeight += parseFloat(row["Bal Qty PC"]);
            totalQtyBalMTWeight += parseFloat(row["Bal Qty MT"]);
            totalQtyBalMTRSWeight += parseFloat(row["Bal Qty Mtrs"]);
        });
        totalQtyMTWeight = totalQtyMTWeight.toFixed(3);
        totalQtyMTRSWeight = totalQtyMTRSWeight.toFixed(3);

        totalQtyBalMTWeight = totalQtyBalMTWeight.toFixed(3);
        totalQtyBalMTRSWeight = totalQtyBalMTRSWeight.toFixed(3);

        const tfootContent = `
        <tr>
        <td style="text-align: center;">Total</td>
        <td colspan="3"></td>
        <td style="text-align: right;">${totalQtyBalWeight}</td>
        <td style="text-align: right;">${totalQtyMTWeight}</td>
        <td style="text-align: right;">${totalQtyMTRSWeight}</td>
        <td style="text-align: right;">${totalQtyBalPCWeight}</td>
        <td style="text-align: right;">${totalQtyBalMTWeight}</td>
        <td style="text-align: right;">${totalQtyBalMTRSWeight}</td>
        <td></td>
        </tr>
        `;

        const tfoot = document.querySelector("#ActualDispatch tfoot");

        if (tfoot) {
            tfoot.innerHTML = tfootContent;
        } else {
            const table = document.querySelector("#ActualDispatch");
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
    const tfoot = document.querySelector("#table-header-ActualDispatch tfoot");
    if (tfoot) {
        tfoot.innerHTML = "";
    }
}

window.getPartyNamePendingPackingListActualDespatch = getPartyNamePendingPackingListActualDespatch;
window.onPartyNameSelectGrid = onPartyNameSelectGrid;
window.updateAll = updateAll;
window.openModal = openModal;
window.CloseModal = CloseModal;
window.toggleSelection = toggleSelection;