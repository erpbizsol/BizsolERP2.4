import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';


$(document).ready(function () {
    //var today = new Date();
    //const yyyy = today.getFullYear();
    //const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    //const dd = today.getDate().toString().padStart(2, '0');
    //const currentDate = `${yyyy}-${mm}-${dd}`;
    //$('#txtdateFrom, #txtdateTo').val(currentDate);
    $("#ERPHeading").text("Expense Entry Report");
    GetSalespersonLists();
    $('#btnDownload').click(function () {
        Export();
    });
});
function GetSalespersonLists() {
    CRMReportsServices.GetSalespersonList().then(function (response) {
        if (response.length > 0) {
            $('#txtSalesPersonlist').empty();
            var options = '<option value="All" selected>All</option>';
            for (var i = 0; i < response.length; i++) {
                options += '<option value="' + response[i].PersonName + '" text="' + response[i].Code + '"></option>';
            }
            $('#txtSalesPersonlist').html(options);

        } else {
            $('#txtSalesPersonlist').empty();
        }
        PopulateTableForPrint(response);
    }).catch(function (error) {
        console.error('Error fetching salesperson list:', error);
        $('#txtSalesPersonlist').empty();
    });
}

//function GetDailyVistList() {

//    const formValues = {
//        fromDate: convertDateFormat($("#txtdateFrom").val()),
//        toDate: convertDateFormat($("#txtdateTo").val()),
//        orderType: $('#txtOrderType').val(),
//        orderStatusName: $('#txtOrderStatus').val(),
//        ReportTypeName: $('#txtReportType').val(),
//        PersonName: $('#txtSalesPerson').val(),
//        AccountDesp: $('#txtDealerName').val(),
//    };
//    const fromDate = formValues.fromDate;
//    const toDate = formValues.toDate;
//    const orderType = formValues.orderType === 'All' || !formValues.orderType ? '' : formValues.orderType;
//    const orderStatus = formValues.orderStatusName === 'All' || !formValues.orderStatusName ? '' : formValues.orderStatusName;
//    const reportType = formValues.ReportTypeName;
//    const salesperson = formValues.PersonName === 'All' || !formValues.PersonName ? '' : formValues.PersonName;
//    const dealerName = formValues.AccountDesp === 'All' || !formValues.AccountDesp ? '' : formValues.AccountDesp;
//    const strCondition = '';
//    CRMReportsServices.GetDailyVisitReport(fromDate, toDate, orderStatus, reportType, salesperson, dealerName, orderType, strCondition).then(function (response) {
//        if (response.length > 0) {
//            const StringFilterColumn = ["Sale Person", "Visit Type", "Dealer Name", "City", "State", "Size_Desp", "Thickness"];
//            const NumericFilterColumn = [];
//            const DateFilterColumn = [];
//            const Button = false;
//            const showButtons = [];
//            const StringdoubleFilterColumn = [];
//            const hiddenColumns = ["Code"];
//            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns);
//            if (reportType === "Visit Report With Size and Thk") {
//                updateFooter(response);
//            } else {
//                clearFooter();
//            }
//        } else {
//            toastr.error("Record not found...!");
//            //alert("Record not found...!");
//        }
//    });
//}
//function convertDateFormat(dateString) {
//    const [day, month, year] = dateString.split('-');
//    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//    const monthAbbreviation = monthNames[parseInt(month) - 1];
//    return `${day} -${monthAbbreviation} -${year}`;
//}

function PopulateTableForPrint(data) {
    const tableBody = document.querySelector('#tblReport tbody');
    const tableHeader = document.querySelector('#tblReport thead tr');

    //tableBody.empty();

    // Get the keys from the first object to generate the header dynamically
    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.charAt(0).toUpperCase() + header.slice(1); // Capitalize the first letter
        tableHeader.appendChild(th);
    });

    $('#tblReport th').css('font-weight', 'bold');
    // Generate the rows for the table
    data.forEach(item => {
        const row = document.createElement('tr');

        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = item[header];
            row.appendChild(td);
        });

        tableBody.appendChild(row);
    });

}
function Export() {
    var ReportType = "ExpenseReport";
    var currentDate = new Date();
    var dateString = currentDate.getFullYear() + "-" +
        (currentDate.getMonth() + 1).toString().padStart(2, "0") + "-" +
        currentDate.getDate().toString().padStart(2, "0") + "_" +
        currentDate.getHours().toString().padStart(2, "0") + "-" +
        currentDate.getMinutes().toString().padStart(2, "0") + "-" +
        currentDate.getSeconds().toString().padStart(2, "0");

    $("#tblReport").table2excel({
        filename: ReportType + "_" + dateString,
        fileext: ".xlsx"
    });
}
window.Export = Export;