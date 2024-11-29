import { StockTransferReceiveService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/StockTransferReceiveService.js';

$(document).ready(function () {
    getWarehouse();
});
function getWarehouse() {
    StockTransferReceiveService.GetWarehouse()
        .then(function (result) {
            $("#Warehouse").find("option:not([disabled])").remove();

            // Populate the dropdown with dynamic options
            result.forEach(function (warehouse) {
                $("#Warehouse").append(
                    `<option value="${warehouse.id}">${warehouse.GodownName}</option>`
                );
            });
        })
        .catch(function (error) {
            console.error("Error fetching warehouses:", error);
        });
}

$(document).on("change", "#Warehouse", function () {
    const selectedValue = $(this).val();
    const selectedText = $(this).find("option:selected").text(); 
});
//function getPendingRoll() {
//    StockTransferReceiveService.GetPendingRoll().then(function (response) {
//        $("#rollIdNo").
//    });
//}

window.getWarehouse = getWarehouse;
window.getPendingRoll = getPendingRoll;