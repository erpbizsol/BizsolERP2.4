import { SaleOrderApprovalService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/SaleOrderApprovalService.js';
$(document).ready(function () {
    GetSaleOrderApproval();
    //GetSaleOrderDetail();

});

function GetSaleOrderApproval() {
    SaleOrderApprovalService.GetUnApprovedSaleOrders().then(function (response) {
        const StringFilterColumn = ["Order No", "PartyName", "Sales Person"];
        const NumericFilterColumn = ["BuyerPOMaster_Code", "Qty MT", "Qty PC", "Qty MTRS", "Amount", "TotalOrderAmount"];
        const DateFilterColumn = ["Order Date"];
        const Button = true;
        const StringdoubleFilterColumn = ["UserName"];
        const ShowButton = ["V"];
        CreateDataTable(response, Button, ShowButton, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn)
    });
}
function openModal() {
    $('#myModal').modal('show');
    $('#myModal').modal({
        backdrop: 'static', // No closing on backdrop click
    });

}
function closeModal() {
    $('#myModal').modal('hide');
}

function GetSaleOrderDetail() {
    SaleOrderApprovalService.GetUnApprovedSaleOrders().then(function (response) {


        // Ensure Code and BuyerPOMaster_Code exist before calling the next function
        if (response.BuyerPOMaster_Code) {
            alert(response.BuyerPOMaster_Code);
            return SaleOrderApprovalService.GetSaleOrderDetail(response.BuyerPOMaster_Code);
        } else {
            throw new Error("BuyerPOMaster_Code not found in response");
        }
    }).then(function (data) {

        renderDynamicTable(data);
        alert(data);
        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = true;
        const StringdoubleFilterColumn = [];
        CreateDataTable(data, Button, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn);
    })
        .catch(function (error) {
            console.error("Error fetching sale order details:", error);
        });
}

function renderDynamicTable(data) {
    const tableHeader = document.getElementById('tableheader');
    const tableBody = document.getElementById('tablebody');

    // Clear existing headers and rows
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    // Generate headers based on the first item in `data`
    if (data && data.length > 0) {
        const headerRow = document.createElement('tr');

        // Create header cells
        Object.keys(data[0]).forEach(key => {
            const th = document.createElement('th');
            th.textContent = key;
            headerRow.appendChild(th);
        });

        // Append header row to table header
        tableHeader.appendChild(headerRow);
    }

    // Populate rows
    data.forEach(rowData => {
        const row = document.createElement('tr');

        // Create row cells based on data
        Object.values(rowData).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            row.appendChild(td);
        });

        // Append row to table body
        tableBody.appendChild(row);
    });
}


window.openModal = openModal;
window.closeModal = closeModal;

