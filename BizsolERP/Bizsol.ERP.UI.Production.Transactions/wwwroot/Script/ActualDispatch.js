import { StockTransferReceiveService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/StockTransferReceiveService.js';

let PartyName = '';
$(document).ready(function () {
    $("#ERPHeading").text("Actual Dispatch");
    getPartyNamePendingPackingListActualDespatch();
});
function getPartyNamePendingPackingListActualDespatch() {
    //$('#ddlPartyName').on('focus', function (e) {
    //    $("#ddlPartyName").val("");
    //    $("#tblActualDispatch").hide();
    //});

    //$('#ddlPartyName').on('change', function (e) {
    //    if ($(this).val() !== "") {
    //        $("#tblActualDispatch").show();
    //    }
    //});
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
                const stringFilterColumn = [];
                const numericFilterColumn = [];
                const dateFilterColumn = [];
                const button = false;
                const stringDoubleFilterColumn = [];
                const showButtons = [];
            const hiddenColumns = ["PackingListMaster_Code"];
            const ColumnAlignment = {
                "QtyPc":'right',
                "QtyMT":'right',
                "QtyMTRS": 'right',
                "PackingListDate": 'center',
                "PackingListNo": 'center',

            };
            const updatedResponse = response.map(item => {
                let Action = `<button class="btn btn-success icon-height mb-1" title="Update All" onclick="updateAll(${item?.PackingListMaster_Code})"><i class="fa fa-check-circle"></i></button>
                <button class="btn btn-primary icon-height mb-1" title="Edit" onclick="openModal(${item?.PackingListMaster_Code})"><i class="fa-solid fa-pencil"></i></button>`;
                return {
                    ...item,
                    Action
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-ActualDispatch", "table-body-ActualDispatch", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
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
        //toastr.success("The pallet has been updated successfully!");
    }     
}
function openModal(PackingListMaster_Code) {
    $('#txtPackingListMaster_Code').val(PackingListMaster_Code);
    $('#myModal').modal({
        backdrop: 'static',
    });
    GetPendingPackingListActualDespatchDetails(PackingListMaster_Code);
    $('#myModal').modal('show');
}
function GetPendingPackingListActualDespatchDetails(PackingListMaster_Code){
    StockTransferReceiveService.GetPendingPackingListActualDespatchDetails(PackingListMaster_Code).then(function (response) {
        if (response.length > 0) {
            const item = response[0];
            let PartyName = $('#ddlPartyName').val();
            $('#modal-title').text(PartyName + ' (' + item.PackingListNo + ')');
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["PackingListNo"];
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
                        var PackingListMaster_Code=$('#txtPackingListMaster_Code').val();
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
//window.getPendingPackingListPalletsActualDespatch = getPendingPackingListPalletsActualDespatch;
window.getPartyNamePendingPackingListActualDespatch = getPartyNamePendingPackingListActualDespatch;
window.onPartyNameSelectGrid = onPartyNameSelectGrid;
window.updateAll = updateAll;
window.openModal = openModal;
window.CloseModal = CloseModal;
window.toggleSelection = toggleSelection;