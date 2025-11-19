import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';
$(document).ready(function () {
    $("#ERPHeading").text("Daily Attendance Report");
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
            //$("#txtSalesPerson").focus();
        }
    });
    //$('#txtSalesPerson').on('keydown', function (e) {
    //    if (e.key === "Enter") {
    //        $("#txtReportType").focus();
    //    }
    //});
    //$('#txtReportType').on('keydown', function (e) {
    //    if (e.key === "Enter") {
    //        $("#fetchReportButton").focus();
    //    }
    //});
    //$('#txtSalesPerson').on('focus', function (e) {
    //    $("#txtSalesPerson").val('');
    //});
    //$('#txtReportType').on('focus', function (e) {
    //    $("#txtReportType").val('');
    //});
    $('#fetchReportButton').click(function () {
        Getcheckinoutlist();
    });
    $('#btnDownload').click(function () {
        Export();
    });
});
function GetSalespersonList() {
    //CRMReportsServices.GetSalespersonList().then(function (response) {
    //    if (response.length > 0) {
    //        $('#txtSalesPersonlist').empty();
    //        var options = '<option value="All" selected>All</option>';
    //        for (var i = 0; i < response.length; i++) {
    //            options += '<option value="' + response[i].PersonName + '" text="' + response[i].Code + '"></option>';
    //        }
    //        $('#txtSalesPersonlist').html(options);

    //    } else {
    //        $('#txtSalesPersonlist').empty();
    //    }
    //}).catch(function (error) {
    //    console.error('Error fetching salesperson list:', error);
    //    $('#txtSalesPersonlist').empty();
    //});

    CRMReportsServices.GetUserList().then(function (response) {
        if (response.length > 0) {
            //$('#txtSalesPersonlist').empty();
            //var options = '<option value="All" selected>All</option>';
            //for (var i = 0; i < response.length; i++) {
            //    options += '<option value="' + response[i].UserName + '" text="' + response[i].Code + '"></option>';
            //}
            //$('#txtSalesPersonlist').html(options);

            BindSelectList($('#ddlUserNamelist')[0], response.map((item) => ({ Code: item.Code, Desp: item.UserName })), 'FirstItemAll');
            $('#ddlUserNamelist').select2({
                // allowClear: true,
                matcher: function (params, data) {
                    // If there's no search term, return all data
                    if ($.trim(params.term) === '') {
                        return data;
                    }

                    // Match items that start with the search term
                    if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) {
                        return data;
                    }

                    // Return null if no match
                    return null;
                }
            });

        } else {
           //$('#txtSalesPersonlist').empty();
        }
    }).catch(function (error) {
        console.error('Error fetching User list:', error);
        //$('#txtSalesPersonlist').empty();
    });
}
function GetDisplayNameForReportTypes() {
    CRMReportsServices.GetDisplayNameForReportTypes().then(function (response) {
        if (response.length > 0) {
           // $('#txtReportTypelist').empty();
           // let options = '';
           // response.forEach(function (item, index) {
           //     options += `<option value="${item.DisplayName}" text="${item.Code}" ${index === 0 ? 'selected' : ''}>${item.DisplayName}</option>`;
           // });
           // $('#txtReportTypelist').html(options);
           // $('#txtReportType').val(response[0].DisplayName);
           //$('#txtReportTypelist').on('change', function () {
           //     const selectedValue = $(this).val();
           //    $('#txtReportType').val(selectedValue);
           //});

            BindSelectList($('#ddlReportTypelist')[0], response.map((item) => ({ Code: item.DisplayName, Desp: item.DisplayName })), 'FirstItemSelected');
            $('#ddlReportTypelist').select2({
                // allowClear: true,
                matcher: function (params, data) {
                    // If there's no search term, return all data
                    if ($.trim(params.term) === '') {
                        return data;
                    }

                    // Match items that start with the search term
                    if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) {
                        return data;
                    }

                    // Return null if no match
                    return null;
                }
            });
        } else {
            //$('#txtReportTypelist').empty();
            //$('#txtReportType').val('');
        }
    }).catch(function (error) {
        console.error('Error fetching report types:', error);
        //$('#txtReportTypelist').empty();
        //$('#txtReportType').val('');
    });
}
function Getcheckinoutlist() {
    var fromDate = convertDateFormat($("#txtdateFrom").val());
    var toDate = convertDateFormat($("#txtdateTo").val());
    //var ReportTypeName = $('#txtReportType').val();
    var ReportTypeName = $('#ddlReportTypelist option:selected').text();

    //var PersonName = $('#txtSalesPerson').val();
    var PersonName = $('#ddlUserNamelist option:selected').text();
    if (ReportTypeName.trim().toUpperCase() !== 'Geo Tag Location'.trim().toUpperCase() && PersonName=='All') {
        PersonName = '';
    } 
    CRMReportsServices.Getcheckinoutlist(fromDate,toDate, PersonName, ReportTypeName).then(function (response) {
        if (response.length > 0) {
            if (ReportTypeName.trim().toUpperCase() === 'Geo Tag Location'.trim().toUpperCase()) {
                PopulateTable(response);
            } else {

            
            $("#tblTable").show();
                $("#divGeoLocation").hide();
            const StringFilterColumn = ["User Name","Source","Type"];
            const NumericFilterColumn = [];
            const DateFilterColumn = ["Date"];
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
            if (ReportTypeName.trim().toUpperCase() === 'Distance Detail Report'.trim().toUpperCase()) {
                updateFooter(response)
            } else {
                clearFooter();
                }
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

function mergeTableCells(selector) {
   
    const $rows = $('#tblGeoLocation tbody tr');
    let lastValue = null;
    let rowspanCount = 0;
    let firstCell = null;

    $rows.each(function (index) {
        const $cell = $(this).find('td.' + selector);
        const currentValue = $cell[0].innerText;

        if (currentValue!== undefined && currentValue === lastValue) {
            rowspanCount++;
            $cell.remove(); // remove current duplicate
        } else {
            if (rowspanCount > 1) {
                firstCell.attr('rowspan', rowspanCount); // apply rowspan
            }
            // reset values
            lastValue = currentValue;
            rowspanCount = 1;
            firstCell = $cell;
        }
    });

    // apply rowspan to the last group if needed
    if (rowspanCount > 1 && firstCell) {
        firstCell.attr('rowspan', rowspanCount);
    }
}

function MergeCells() {
    const $rows = $('#tblGeoLocation tbody tr');
    let groupStartIndex = 0;

    while (groupStartIndex < $rows.length) {
        const $startRow = $rows.eq(groupStartIndex);
        const empId = $startRow.find('.MergeUser').text();
        let groupLength = 1;

        // Find how many rows share the same employee_id (group size)
        for (let i = groupStartIndex + 1; i < $rows.length; i++) {
            const currentEmpId = $rows.eq(i).find('.MergeUser').text();
            if (currentEmpId === empId) {
                groupLength++;
            } else {
                break;
            }
        }

        // Merge the employee_id column
        if (groupLength > 1) {
            const $empCell = $startRow.find('.MergeUser');
            $empCell.attr('rowspan', groupLength);
            for (let i = 1; i < groupLength; i++) {
                $rows.eq(groupStartIndex + i).find('.MergeUser').remove();
            }
        }

        // Optionally merge other columns  **only if values are same in group**
        ['MergeDate'].forEach(className => {
            let prevText = null;
            let $prevCell = null;
            let sameCount = 0;

            for (let i = 0; i < groupLength; i++) {
                const $cell = $rows.eq(groupStartIndex + i).find('.' + className);
                const text = $cell.text();

                if (text === prevText) {
                    sameCount++;
                    $cell.remove();
                    if ($prevCell) $prevCell.attr('rowspan', sameCount + 1);
                } else {
                    $prevCell = $cell;
                    prevText = text;
                    sameCount = 0;
                }
            }
        });

        // Move to the next group
        groupStartIndex += groupLength;
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

function PopulateTable(data) {
    $("#divGeoLocation").show();

    $("#tblTable").hide();
    // Select the table body
    var tbody = $('#tblGeoLocation tbody');

    // Clear any existing rows
    tbody.empty();

    // Loop through the data and append rows
    data.forEach(function (item, index) {
        const serialNo = index + 1;
           
        var row = `
      <tr>
        <td>${item["S.No"]}</td>
        <td class="MergeUser">${item["User Name"]}</td>
        
        <td>${item["Source"]}</td>
        <td>${item["Type"]}</td>
        <td>${item["Location"]}</td>
        <td class="MergeDate">${item["Date"]}</td>
        <td>${item["Punch Time"]}</td>
        <td>${item["Duration(Hrs)"]}</td>
        <td>${item["Distance(KM)"]}</td>
        <td>${item["Remarks"]}</td>
      </tr>
    `;
        tbody.append(row);
    });


   
    MergeCells();
    
   // mergeTableCells('MergeUser');

}
function ExportGeoLocation() {
    //let clone = $("#tblGeoLocation").clone();
    //$('#tblReport  thead tr').empty();
    //$('#tblReport tbody').empty();

    //$("#tblReport").append(clone);

    //var ReportType = $("#txtReportType").val().replace(" ", "").replace(".", "");
    var ReportType = $('#ddlReportTypelist').val().replace(/ /g, "").replace(".", "");
    var currentDate = new Date();
    var dateString = currentDate.getFullYear() + "-" +
        (currentDate.getMonth() + 1).toString().padStart(2, "0") + "-" +
        currentDate.getDate().toString().padStart(2, "0") + "_" +
        currentDate.getHours().toString().padStart(2, "0") + "-" +
        currentDate.getMinutes().toString().padStart(2, "0") + "-" +
        currentDate.getSeconds().toString().padStart(2, "0");

    var wb = XLSX.utils.book_new();

    // Convert the table to worksheet
    var ws = XLSX.utils.table_to_sheet(document.getElementById('tblGeoLocation'), {
        raw: true,
    });

    // Define merges manually
    //ws['!merges'] = [
    //    // Merge A1:B1 (0-based indices)
    //    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    //    // Merge A2:A3
    //    { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },
    //];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Export
    XLSX.writeFile(wb, ReportType + "_" + dateString +".xlsx");
}

function Export() {
    //var ReportType = $("#txtReportType").val().replace(" ", "").replace(".", "");
    var ReportType = $('#ddlReportTypelist').val().replace(/ /g, "").replace(".", "");
    var currentDate = new Date();
    var dateString = currentDate.getFullYear() + "-" +
        (currentDate.getMonth() + 1).toString().padStart(2, "0") + "-" +
        currentDate.getDate().toString().padStart(2, "0") + "_" +
        currentDate.getHours().toString().padStart(2, "0") + "-" +
        currentDate.getMinutes().toString().padStart(2, "0") + "-" +
        currentDate.getSeconds().toString().padStart(2, "0");

    if (ReportType.toUpperCase() == 'GeoTagLocation'.toUpperCase()) {
        ExportGeoLocation();
    }
    else {
        $("#tblReport").table2excel({
            filename: ReportType + "_" + dateString,
            fileext: ".xlsx"
        });
    }
   
}

function BindSelectList(element, list, FirstItem) {
    let option = '';

    if (FirstItem == 'FirstItemAll') {
        option = '<option value="All">All</option>';
    } else if (FirstItem == 'FirstItemSelected') {
        option = '';
    } else {
        option = '<option value="0"></option>';
    }

    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
window.Export = Export;
window.BindSelectList = BindSelectList;
window.ExportGeoLocation = ExportGeoLocation;
