import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';
$(document).ready(function () {
    $("#ERPHeading").text("Check In/Check Out Report");
    DatePicker();
    GetSalespersonList();
    GetDisplayNameForReportTypes();
    $('#txtdateFrom').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtdateTo").focus();
        }
    });
    $('#txtdateTo').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtSalesPerson").focus();
        }
    });
    $('#txtSalesPerson').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtReportType").focus();
        }
    });
    $('#txtReportType').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#fetchReportButton").focus();
        }
    });
    $('#txtSalesPerson').on('focus', function (e) {
        $("#txtSalesPerson").val('');
    });
    $('#txtReportType').on('focus', function (e) {
        $("#txtReportType").val('');
    });
    $('#fetchReportButton').click(function () {
        Getcheckinoutlist();
    });
    $('#btnDownload').click(function () {
        Export();
    });
});
function GetSalespersonList() {
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
    }).catch(function (error) {
        console.error('Error fetching salesperson list:', error);
        $('#txtSalesPersonlist').empty();
    });
}
function GetDisplayNameForReportTypes() {
    CRMReportsServices.GetDisplayNameForReportTypes().then(function (response) {
        if (response.length > 0) {
            $('#txtReportTypelist').empty();
            let options = '';
            response.forEach(function (item, index) {
                options += `<option value="${item.DisplayName}" text="${item.Code}" ${index === 0 ? 'selected' : ''}>${item.DisplayName}</option>`;
            });
            $('#txtReportTypelist').html(options);
            $('#txtReportType').val(response[0].DisplayName);
           $('#txtReportTypelist').on('change', function () {
                const selectedValue = $(this).val();
               $('#txtReportType').val(selectedValue);
            });
        } else {
            $('#txtReportTypelist').empty();
            $('#txtReportType').val('');
        }
    }).catch(function (error) {
        console.error('Error fetching report types:', error);
        $('#txtReportTypelist').empty();
        $('#txtReportType').val('');
    });
}
function Getcheckinoutlist() {
    var fromDate = convertDateFormat($("#txtdateFrom").val());
    var toDate = convertDateFormat($("#txtdateTo").val());
    var ReportTypeName = $('#txtReportType').val();
    var PersonName = $('#txtSalesPerson').val();

    CRMReportsServices.Getcheckinoutlist(fromDate,toDate, PersonName, ReportTypeName).then(function (response) {
        if (response.length > 0) {
            $("#tblTable").show();
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = {
                "Distance KM": 'right',
                "DurationInHrs": 'right',
                "Date": 'center',
            };
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns,ColumnAlignment);
            PopulateTableForPrint(response);
            if (ReportTypeName === 'Distance Detail Report') {
                updateFooter(response)
            } else {
                clearFooter();
            }
           
        } else {
            toastr.error("Record not found...!");
            clearFooter();
            $("#tblTable").hide();
        }
    });
}
function updateFooter(data) {
        let totalQuantity = 0;
        data.forEach(row => {
            totalQuantity += parseFloat(row["Distance KM"] || 0);
        });

        const tfootContent = `
        <tr>
            <td colspan="5"><b>Total :</b></td>
            <td style="text-align: right;"><b>${totalQuantity.toFixed(2)}</b></td>
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


    /// footer total for Excel

    const tfootContentPrint = `
        <tr>
            <td><b>Total :</b></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td style="text-align: right;"><b>${totalQuantity.toFixed(2)}</b></td>
        </tr>
        `;

    const tfootPrint = document.querySelector("#tblReport tfoot");

    if (tfootPrint) {
        tfootPrint.innerHTML = tfootContentPrint;
    } else {
        const tablePrint = document.querySelector("#tblReport");
        if (tablePrint) {
            const newTfootPrint = document.createElement("tfoot");
            newTfootPrint.innerHTML = tfootContentPrint;
            tablePrint.appendChild(newTfootPrint);
        } 
    }
}
function clearFooter() {
    const tfoot = document.querySelector("#table tfoot");
    if (tfoot) {
        tfoot.innerHTML = "";
    }
    const tfootPrint = document.querySelector("#tblReport tfoot");
    if (tfootPrint) {
        tfootPrint.innerHTML = "";
    }
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${ day } -${ monthAbbreviation } -${ year }`;
}
function setupDateInputFormatting() {
    $('#txtdateTo').on('input', function () {
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
    $('#txtdateFrom').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');

        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);

        if (value.length === 10) {
            validateDateFrom(value);
        } else {
            $(this).val(value);
        }
    });
}
function validateDateFrom(value) {
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
            $('#txtdateFrom').val('');

        }
    } else {
        $('#txtdateFrom').val('');

    }
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
            $('#txtdateTo').val('');

        }
    } else {
        $('#txtdateTo').val('');

    }
}
function DatePicker() {

    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();

    $('#txtdateTo, #txtdateFrom').val(`${day}/${month}/${year}`);
    $('#txtdateTo, #txtdateFrom').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
    });
}


function PopulateTableForPrint(data) {
    const tableBody = document.querySelector('#tblReport tbody');
    const tableHeader = document.querySelector('#tblReport thead tr');

    $('#tblReport  thead tr').empty();
    $('#tblReport tbody').empty();

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
    var ReportType = $("#txtReportType").val().replace(" ", "").replace(".", "");
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
