import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';

$(document).ready(function () {
    $("#ERPHeading").text("Check In/Check Out Report");
    var today = new Date();
    const yyyy = today.getFullYear();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    const currentDate = `${yyyy}-${mm}-${dd}`;
    $('#txtdateFrom, #txtdateTo').val(currentDate);
    GetSalespersonList();
    //Getcheckinoutlist();
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
    var formValues = {
        fromDate: convertDateFormat($("#txtdateFrom").val()),
        toDate: convertDateFormat($("#txtdateTo").val()),
        ReportTypeName: $('#txtReportType').val(),
        PersonName: $('#txtSalesPerson').val(),
    };
    var fromDate = formValues.fromDate;
    var toDate = formValues.toDate;
    var salesperson = formValues.PersonName;
    var reportType = formValues.ReportTypeName;
    CRMReportsServices.Getcheckinoutlist(fromDate, toDate, salesperson,reportType).then(function (response) {
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
            if (reportType === 'Distance Detail Report') {
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
            <td style="text-align: right;">${totalQuantity.toFixed(2)}</td>   
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
function clearFooter() {
    const tfoot = document.querySelector("#table tfoot");
    if (tfoot) {
        tfoot.innerHTML = "";
    }
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${ day } -${ monthAbbreviation } -${ year }`;
}



