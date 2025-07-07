import { ClosePendingOrderService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/ClosePendingOrderService.js';

$(document).ready(function () {
    $("#ERPHeading").text("Close Pending Order");
    GetFilterForCancelPendingOrder();
    var today = new Date();
    const yyyy = today.getFullYear();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    const currentDate = `${yyyy}-${mm}-${dd}`;
    $('#txtdateFrom, #txtdateTo').val(currentDate);
    $('#txtSalesPerson').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtPartyName").focus();
        }
    });
    $('#txtPartyName').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtdateFrom").focus();
        }
    });
    $('#txtdateFrom').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtdateTo").focus();
        }
    });
    $('#txtdateTo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#fetchReportButton").focus();
        }
    });
   
   
});

function GetFilterForCancelPendingOrder() {
    ClosePendingOrderService.GetFilterForCancelPendingOrder()
        .then(function (response) {
            if (response.SalesPerson && response.SalesPerson.length > 0) {
                $('#txtSalesPersonlist').empty();
                var salesOptions = '<option value="All" selected>All</option>';
                for (var i = 0; i < response.SalesPerson.length; i++) {
                    salesOptions += '<option value="' + response.SalesPerson[i].SalesPerson + '">' + response.SalesPerson[i].SalesPerson + '</option>';
                }
                $('#txtSalesPersonlist').html(salesOptions);
            } else {
                $('#txtSalesPersonlist').empty();
            }

            if (response.PartyName && response.PartyName.length > 0) {
                $('#txtPartyNamelist').empty();
                var partyOptions = '<option value="All" selected>All</option>';
                for (var i = 0; i < response.PartyName.length; i++) {
                    partyOptions += '<option value="' + response.PartyName[i].Party + '">' + response.PartyName[i].Party + '</option>';
                }
                $('#txtPartyNamelist').html(partyOptions);
            } else {
                $('#txtPartyNamelist').empty();
            }
        })
        .catch(function (error) {
            console.error('Error fetching data:', error);
            $('#txtSalesPersonlist').empty();
            $('#txtPartyNamelist').empty();
        });
}


$('#fetchReportButton').click(function () {
    GetCancelPendingOrderList();
});



function GetCancelPendingOrderList() {
    const formValues = {
        fromDate: convertDateFormat($("#txtdateFrom").val()),
        toDate: convertDateFormat($("#txtdateTo").val()),
        PersonName: $('#txtSalesPerson').val(),
        PartyName: $('#txtPartyName').val(),
    };

    const fromDate = formValues.fromDate;
    const toDate = formValues.toDate;
    const personName = formValues.PersonName;
    const partyName = formValues.PartyName;

    ClosePendingOrderService.GetCancelPendingOrderList(fromDate, toDate, personName, partyName).then(function (response) {
        if (response.length > 0) {
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "BuyerPODetail_Code", "BuyerPOMaster_Code"];
            const ColumnAlignment = {
                "Payment Amount": 'right',
                "Other Sale Qty": 'right',
                "Date": 'center',
            };
            response.forEach((item, index) => {
                item.Select = `<input type="checkbox" class="select-checkbox" data-index="${index}">`;
                item["Bal MT"] = `<input type="number" data-index="${index}" value="${item["Bal MT"] || 0}" class="bal-mt-input">`;
                item["Bal PC"] = `<input type="number" data-index="${index}" value="${item["Bal PC"] || 0}" class="bal-pc-input">`;
                item["Bal MTRS"] = `<input type="number" data-index="${index}" value="${item["Bal MTRS"] || 0}" class="bal-mtrs-input">`;
            });

            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);
            document.querySelectorAll('.bal-mt-input').forEach(input => {
                input.addEventListener('input', (event) => {
                    var index = event.target.dataset.index;
                    var newValue = parseFloat(event.target.value) || 0;
                    response[index]["Bal MT"] = newValue;
                    updateFooter(response);
                });
            });

            document.querySelectorAll('.bal-pc-input').forEach(input => {
                input.addEventListener('input', (event) => {
                    var index = event.target.dataset.index;
                    var newValue = parseFloat(event.target.value) || 0;
                    response[index]["Bal PC"] = newValue;
                    updateFooter(response);
                });
            });

            document.querySelectorAll('.bal-mtrs-input').forEach(input => {
                input.addEventListener('input', (event) => {
                    var index = event.target.dataset.index;
                    var newValue = parseFloat(event.target.value) || 0;
                    response[index]["Bal MTRS"] = newValue;
                    updateFooter(response);
                });
            });

            // Initial footer update
            updateFooter(response);
        } else {
            toastr.error("Record not found...!");
        }
    });
}

function updateFooter(data) {
    let BalMT = 0;
    let BalPC = 0;
    let BalMTRS = 0;
    let QtyMT = 0;
    let QtyPC = 0;
    let QtyMTRS = 0;
    //for (let index in data) {
    //    BalMT += data[index]["Bal MT"] || 0;
    //    BalPC += data[index]["Bal PC"] || 0;
    //    BalMTRS += data[index]["Bal MTRS"] || 0;
    //    QtyMT += data[index]["Qty MT"] || 0;
    //    QtyPC += data[index]["Qty PC"] || 0;
    //    QtyMTRS += data[index]["Qty MTRS"] || 0;
    //}
   
    data.forEach(row => {
        BalMT += parseFloat(row["Bal MT"]) || 0;
        BalPC += parseFloat(row["Bal PC"]) || 0;
        BalMTRS += parseFloat(row["Bal MTRS"]) || 0;
        QtyMT += parseFloat(row["Qty MT"]) || 0;
        QtyPC += parseFloat(row["Qty PC"]) || 0;
        QtyMTRS += parseFloat(row["Qty MTRS"]) || 0;
    });

    const tfootContent = `
        <tr>
            <td><b>Total</b></td>
            <td colspan="6"></td>
            <td>${QtyMT}</td>
            <td colspan="1"></td>
            <td>${BalMT}</td>
            <td>${QtyPC}</td>
            <td colspan="1"></td>
            <td>${BalPC}</td>
            <td>${QtyMTRS}</td>
            <td colspan="1"></td>
            <td>${BalMTRS}</td>  
        </tr>
    `;

    const tfoot = document.querySelector("#table tfoot");
    if (tfoot) {
        tfoot.innerHTML = tfootContent;
    } else {
        const table = document.querySelector("#table");
        if (table) {
            const newTfoot = document.createElement("tfoot");
            newTfoot.innerHTML = tfootContent;
            table.appendChild(newTfoot);
        } else {
            console.error("Table element with id 'table' not found.");
        }
    }
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day} -${monthAbbreviation} -${year}`;
}