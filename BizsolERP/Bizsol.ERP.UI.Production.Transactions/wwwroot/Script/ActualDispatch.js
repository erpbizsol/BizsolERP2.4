import { StockTransferReceiveService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/StockTransferReceiveService.js';

let PartyName = '';
let PackingListNo = 0;
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
    $('#ddlPartyName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#btnShow").focus();
        }
    });
    Showloader();
    StockTransferReceiveService.GetPartyNamePendingPackingListActualDespatch().then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            BindSelectList($('#ddlPartyName')[0], response.map((item) => ({ Code: item.AccountDesp, Desp: item.AccountDesp })));

            $('#ddlPartyName').select2({
                width: '-webkit-fill-available'
            });
            //$('#ddlPartyNameList option').remove();
            //var option = '';
            //for (var i = 0; i < response.length; i++) {
            //    option += '<option text="' + response[i].Code + '" value="' + response[i].AccountDesp + '" >' + response[i].AccountDesp + '</option>';
            //}
            //$('#ddlPartyNameList')[0].innerHTML = option;
        } else {
            toastr.error('No data received or empty response');
        }
        //const inputElement = document.getElementById("ddlPartyName");
        //const dataList = document.getElementById("ddlPartyNameList");
        //inputElement.addEventListener("input", () => {
        //    const inputValue = inputElement.value;
        //    const selectedOption = Array.from(dataList.options).find(
        //        option => option.value === inputValue
        //    );
        //    if (selectedOption) {
        //        PartyName = $("#ddlPartyName").val();
        //        //getPendingPackingListPalletsActualDespatch(PartyName);
        //    }
        //});
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
            $('#tblActualDispatch').show();
            const stringFilterColumn = ["Warehouse"];
            const numericFilterColumn = ["Packing List No"];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["PackingListMaster_Code","Party Name"];
            const ColumnAlignment = {
                "Qty PC": 'right',
                "Qty KG": 'right',
                "Qty SQM": 'right',
                "Bal Qty PC": 'right',
                "Bal Qty KG": 'right',
                "Bal Qty SQM": 'right',
                "Date": 'center',
                "Packing List No": 'center',
                "No of Pallet":'right',
            };
            const updatedResponse = response.map(item => {
                
                let Action = `<button class="btn btn-success icon-height mb-1" title="Update All" onclick="updateAll(${item?.PackingListMaster_Code})"><i class="fa fa-check-circle"></i></button>
                <button class="btn btn-primary icon-height mb-1" title="Edit" onclick="openModal(${item?.PackingListMaster_Code},${item["Packing List No"]})"><i class="fa-solid fa-pencil"></i></button>`;
                return {
                    ...item,
                    Action,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-ActualDispatch", "table-body-ActualDispatch", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
            if (updatedResponse?.length > 0) {
                updateFooter(response);
            }
        }
        else {
            $('#tblActualDispatch').hide();
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
function openModal(PackingListMaster_Code, packingListNo) {
    PackingListNo = packingListNo;
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
            const stringFilterColumn = ["Pallet No", "SizeDesp", "ItemName"];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                "Qty PC": 'right',
                "Qty KG": 'right',
                "Qty SQM": 'right',
            };
            const updatedResponse = response.map(item => {
                let Action = `<input type="checkbox" onchange="toggleSelection(${item["Pallet No"]})">`;
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
        GetPendingPackingListActualDespatchDetails(PackingListMaster_Code, PackingListNo);
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
        let totalNoOFPallets = 0;
        let totalQtyBalWeight = 0;
        let totalQtyMTWeight = 0;
        let totalQtyMTRSWeight = 0;

        let totalQtyBalPCWeight = 0;
        let totalQtyBalMTWeight = 0;
        let totalQtyBalMTRSWeight = 0;

        let totalNoOFPalletsTotal = 0;
        let totalQtyBalWeightTotal = 0;
        let totalQtyMTWeightTotal = 0;
        let totalQtyMTRSWeightTotal = 0;

        let totalQtyBalPCWeightTotal = 0;
        let totalQtyBalMTWeightTotal = 0;
        let totalQtyBalMTRSWeightTotal = 0;
        $('#ActualDispatch tbody tr:visible').each(function () {
            const row = $(this);
            totalNoOFPalletsTotal += parseFloat(row.find("td:nth-child(8)").text()) || 0;
            totalQtyBalWeightTotal += parseFloat(row.find("td:nth-child(9)").text()) || 0;
            totalQtyMTWeightTotal += parseFloat(row.find("td:nth-child(10)").text()) || 0;
            totalQtyMTRSWeightTotal += parseFloat(row.find("td:nth-child(11)").text()) || 0;
            totalQtyBalPCWeightTotal += parseFloat(row.find("td:nth-child(12)").text()) || 0;
            totalQtyBalMTWeightTotal += parseFloat(row.find("td:nth-child(13)").text()) || 0;
            totalQtyBalMTRSWeightTotal += parseFloat(row.find("td:nth-child(14)").text()) || 0;
        });
        data.forEach(row => {
            totalNoOFPallets += parseFloat(row["No of Pallet"]);
            totalQtyBalWeight += parseFloat(row["Qty PC"]);
            totalQtyMTWeight += parseFloat(row["Qty KG"]);
            totalQtyMTRSWeight += parseFloat(row["Qty SQM"]);

            totalQtyBalPCWeight += parseFloat(row["Bal Qty PC"]);
            totalQtyBalMTWeight += parseFloat(row["Bal Qty KG"]);
            totalQtyBalMTRSWeight += parseFloat(row["Bal Qty SQM"]);
        });
        totalQtyMTWeight = totalQtyMTWeight.toFixed(3);
        totalQtyMTRSWeight = totalQtyMTRSWeight.toFixed(3);

        totalQtyBalMTWeight = totalQtyBalMTWeight.toFixed(3);
        totalQtyBalMTRSWeight = totalQtyBalMTRSWeight.toFixed(3);

        totalQtyMTWeightTotal = totalQtyMTWeightTotal.toFixed(3);
        totalQtyMTRSWeightTotal = totalQtyMTRSWeightTotal.toFixed(3);

        totalQtyBalMTWeightTotal = totalQtyBalMTWeightTotal.toFixed(3);
        totalQtyBalMTRSWeightTotal = totalQtyBalMTRSWeightTotal.toFixed(3);

        const tfootContent = `
        <tr id="trTotal">
        <td colspan="4"></td>
        <td style="text-align: center;">Total</td>
        <td style="text-align: right;">${totalNoOFPalletsTotal}</td>
        <td style="text-align: right;">${totalQtyBalWeightTotal}</td>
        <td style="text-align: right;">${totalQtyMTWeightTotal}</td>
        <td style="text-align: right;">${totalQtyMTRSWeightTotal}</td>
        <td style="text-align: right;">${totalQtyBalPCWeightTotal}</td>
        <td style="text-align: right;">${totalQtyBalMTWeightTotal}</td>
        <td style="text-align: right;">${totalQtyBalMTRSWeightTotal}</td>
        <td></td>
        </tr>
        <tr id="trGrandTotal">
        <td colspan="4"></td>
        <td style="text-align: center;">Grand Total</td>
        <td style="text-align: right;">${totalNoOFPallets}</td>
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

function calculateTotal() {

    let Data = $('#ActualDispatch tbody tr:visible');
    let totalNoOFPalletsTotal = 0;
    let totalQtyBalWeightTotal = 0;
    let totalQtyMTWeightTotal = 0;
    let totalQtyMTRSWeightTotal = 0;

    let totalQtyBalPCWeightTotal = 0;
    let totalQtyBalMTWeightTotal = 0;
    let totalQtyBalMTRSWeightTotal = 0;
    if (Data.length > 0) {
        
        for (let i = 0; i < Data.length; i++) {
            let ItemRow = Data[i];
            totalNoOFPalletsTotal += parseFloat(ItemRow.children[7].innerHTML);
            totalQtyBalWeightTotal += parseFloat(ItemRow.children[8].innerHTML);
            totalQtyMTWeightTotal += parseFloat(ItemRow.children[9].innerHTML);
            totalQtyMTRSWeightTotal += parseFloat(ItemRow.children[10].innerHTML) ;
            totalQtyBalPCWeightTotal += parseFloat(ItemRow.children[11].innerHTML) ;
            totalQtyBalMTWeightTotal += parseFloat(ItemRow.children[12].innerHTML) ;
            totalQtyBalMTRSWeightTotal += parseFloat(ItemRow.children[13].innerHTML);

        }
        $('#trTotal')[0].children[2].innerHTML = totalNoOFPalletsTotal;
        $('#trTotal')[0].children[3].innerHTML = totalQtyBalWeightTotal;
        $('#trTotal')[0].children[4].innerHTML = parseFloat(totalQtyMTWeightTotal).toFixed(3);
        $('#trTotal')[0].children[5].innerHTML = parseFloat(totalQtyMTRSWeightTotal).toFixed(3);
        $('#trTotal')[0].children[6].innerHTML = totalQtyBalPCWeightTotal;
        $('#trTotal')[0].children[7].innerHTML = parseFloat(totalQtyBalMTWeightTotal).toFixed(3);
        $('#trTotal')[0].children[8].innerHTML = parseFloat(totalQtyBalMTRSWeightTotal).toFixed(3);

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
window.getPartyNamePendingPackingListActualDespatch = getPartyNamePendingPackingListActualDespatch;
window.onPartyNameSelectGrid = onPartyNameSelectGrid;
window.updateAll = updateAll;
window.openModal = openModal;
window.CloseModal = CloseModal;
window.toggleSelection = toggleSelection;