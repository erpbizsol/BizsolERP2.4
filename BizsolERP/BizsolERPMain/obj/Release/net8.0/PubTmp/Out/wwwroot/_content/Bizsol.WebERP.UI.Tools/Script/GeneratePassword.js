import { GeneratePasswordService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GeneratePasswordService.js';

let NoOfPassword = 0;
$("#ERPHeading").text("Generate OTP");
$(document).ready(function () {
    //PBControls();
    
    UnUsedPasswordsTable();
    FillUsedForType();
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    // Set value of date inputs
    $('#txtFromDate').val(formattedDate);
    $('#txtToDate').val(formattedDate);

    $('#btnDownload').click(function () {
        Export();
    });
    $('#btnDownloadUsedPassword').click(function () {
        ExportUsed();
    });
    });
function validateIntegerInput(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length > 3) {
        value = value.slice(0, 3);
    }
    input.value = value;
}
function UnUsedPasswordsTable() {
    Showloader();
    GeneratePasswordService.UnUsedPasswords().then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            $('#tblUnUsedGeneratePassword').show();
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const columnAlignment = {};

            BizsolCustomFilterGrid.CreateDataTable("table-header-UnUsedGeneratePassword", "table-body-UnUsedGeneratePassword", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);

            PopulateTableForPrint(response);
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $('#tblUnUsedGeneratePassword').hide();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during UnUsed Generate Password');
        });
}
function Generate_GeneratePassword() {
    let NoOfPassword = parseInt($("#txtNoOfGenerateOTP").val()) || 0;
    Showloader();
    GeneratePasswordService.GeneratePasswords(NoOfPassword).then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            $('#tblUnUsedGeneratePassword').show();
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const columnAlignment = {};
            
            BizsolCustomFilterGrid.CreateDataTable("table-header-UnUsedGeneratePassword", "table-body-UnUsedGeneratePassword", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
            
            PopulateTableForPrint(response);
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $('#tblUnUsedGeneratePassword').hide();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during UnUsed Generate Password');
        });
}
function FillUsedForType() {
    GeneratePasswordService.UsedForFilter().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#txtUsedForType')[0], response.map((item) => ({ Code: item.Desp, Desp: item.Desp })));

            $('#txtUsedForType').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
    });
}
function ShowUsed_GeneratePassword() {
    let FromDate = $("#txtFromDate").val();
    let ToDate = $("#txtToDate").val();
    let UsedForType = $("#txtUsedForType").val();
    if (FromDate == null && ToDate == null && UsedForType == null || FromDate == '' && ToDate == '' && UsedForType == '') {
        return;
    }
    Showloader();
    GeneratePasswordService.ReportPasswords(FromDate, ToDate, UsedForType).then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            $('#tblUsedGeneratePassword').show();
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const columnAlignment = {};

            BizsolCustomFilterGrid.CreateDataTable("table-header-UsedGeneratePassword", "table-body-UsedGeneratePassword", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);

            PopulateTableForPrintUsed(response);
        } else {
            HideLoader();
            toastr.error('No Data Found');
            $('#tblUsedGeneratePassword').hide();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during Used Generate Password');
        });
}
function BindSelectList(element, list) {
    let option = '<option value="0">All</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function PopulateTableForPrint(data) {
    const tableBody = document.querySelector('#tblReport tbody');
    const tableHeader = document.querySelector('#tblReport thead tr');

    //tableBody.empty();

    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.charAt(0).toUpperCase() + header.slice(1);
        tableHeader.appendChild(th);
    });

    $('#tblReport th').css('font-weight', 'bold');
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
    var ReportType = "GeneratePasswordReport";
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
function PopulateTableForPrintUsed(data) {
    const tableBody = document.querySelector('#tblReportUsed tbody');
    const tableHeader = document.querySelector('#tblReportUsed thead tr');

    //tableBody.empty();

    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.charAt(0).toUpperCase() + header.slice(1);
        tableHeader.appendChild(th);
    });

    $('#tblReportUsed th').css('font-weight', 'bold');
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
function ExportUsed() {
    var ReportType = "GeneratePasswordUsedReport";
    var currentDate = new Date();
    var dateString = currentDate.getFullYear() + "-" +
        (currentDate.getMonth() + 1).toString().padStart(2, "0") + "-" +
        currentDate.getDate().toString().padStart(2, "0") + "_" +
        currentDate.getHours().toString().padStart(2, "0") + "-" +
        currentDate.getMinutes().toString().padStart(2, "0") + "-" +
        currentDate.getSeconds().toString().padStart(2, "0");

    $("#tblReportUsed").table2excel({
        filename: ReportType + "_" + dateString,
        fileext: ".xlsx"
    });
}
document.Export = Export;
document.ExportUsed = ExportUsed;
document.validateIntegerInput = validateIntegerInput;
document.Generate_GeneratePassword = Generate_GeneratePassword;
document.ShowUsed_GeneratePassword = ShowUsed_GeneratePassword;