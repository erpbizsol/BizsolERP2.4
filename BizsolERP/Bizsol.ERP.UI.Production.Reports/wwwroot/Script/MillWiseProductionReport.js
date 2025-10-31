import { MillWiseProductionReport } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_MillWiseProductionReportService.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

let currentReportData = [];
let currentJsonData = {};

$(document).ready(function () {
    // Set default dates: From = Financial Year start (Apr 1), To = Today
    InitializeFinancialYearDates();
    GetItemSizeParameter();
    $("#btnSearch").on("click", function () {
        GetMillWiseProduction();
    });
});
// Set FromDate to financial year start (Apr 1) and ToDate to today
function InitializeFinancialYearDates() {
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth() + 1; // 1-12
    var fyStartYear = month >= 4 ? year : year - 1;
    var fromDate = new Date(fyStartYear, 3, 1); // April is month index 3

    $("#txtFromDate").val(formatDateYYYYMMDD(fromDate));
    $("#txtToDate").val(formatDateYYYYMMDD(today));
}

function formatDateYYYYMMDD(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}
function GetMillWiseProduction() {
    // Validate From Date
    var fromDate = $("#txtFromDate").val();
    if (!fromDate || fromDate.trim() === '') {
        toastr.warning('Please select From Date');
        $("#txtFromDate").focus();
        return;
    }

    // Validate To Date
    var toDate = $("#txtToDate").val();
    if (!toDate || toDate.trim() === '') {
        toastr.warning('Please select To Date');
        $("#txtToDate").focus();
        return;
    }

    // Validate date range
    if (new Date(fromDate) > new Date(toDate)) {
        toastr.warning('From Date cannot be greater than To Date');
        $("#txtFromDate").focus();
        return;
    }

    // Validate Size Parameters
    var selectedSizeParams = $("#txtSizeParameter").val() || [];
    if (!selectedSizeParams || selectedSizeParams.length === 0) {
        toastr.warning('Please select at least one Size Parameter');
        $("#txtSizeParameter").focus();
        return;
    }

    var sizeParamCsv = selectedSizeParams.map(function (x) { return String(x).trim().toUpperCase(); }).join(',');

    var jsonData = {
        FromDate : fromDate,
        ToDate : toDate,
        sizeParameter: sizeParamCsv,
        isMachineWise: $("#chkShowMachineWise").is(':checked') ? 'Y' : 'N'
    };
    GetMillWiseProductionReportList(jsonData);
}
function GetMillWiseProductionReportList(jsonData) {
    Showloader();
    MillWiseProductionReport.GetItemSizeWiseAndMonthWiseData(jsonData).then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            currentReportData = response;
            currentJsonData = jsonData;
            RenderMillWiseProductionTable(response, jsonData.isMachineWise === 'Y');
            $('#btnDownload').show();
            toastr.success('Report loaded successfully');
        } else {
            HideLoader();
            ClearTable();
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        HideLoader();
        ClearTable();
        toastr.error(error.Msg || 'Error During Get Mill Wise Production Report');
    });
}

function ClearTable() {
    $("#table-head").empty();
    $("#table-body").html('<tr><td colspan="100" class="text-center text-muted">No data available</td></tr>');
    $('#btnDownload').hide();
    currentReportData = [];
    currentJsonData = {};
}

function RenderMillWiseProductionTable(data, isMachineWise) {
    if (!data || data.length === 0) {
        ClearTable();
        return;
    }

    var allColumns = Object.keys(data[0]);
    var sizeColumns = [];
    var cfColumn = null;
    var totalColumn = null;
    var totalODColumn = null;
    var numericColumn = null; // Store the numeric size column for grouping
    var monthMachineColumns = [];

    // Separate columns into categories
    allColumns.forEach(function(col) {
        var colLower = col.toLowerCase();
        if (col === 'S.NO' || col === 'SIZE' || col === 'THICKNESS' || col === 'DIAMETER' || 
            col === 'WIDTH' || col === 'LENGTH' || col === 'WEIGHT' || col === 'GSM' || col === 'MIC') {
            sizeColumns.push(col);
        } else if (col === 'Numeric' || col === 'SizeNumeric' || colLower.indexOf('numeric') >= 0) {
            // Store numeric column for grouping but don't display it
            numericColumn = col;
        } else if (col.indexOf('C/F') >= 0 || col.indexOf('Previous Year') >= 0) {
            cfColumn = col;
        } else if (col.indexOf('Total OD') >= 0 || col.indexOf('Total OD Wise') >= 0 || col.indexOf('TotalODWise') >= 0) {
            totalODColumn = col;
        } else if (col.indexOf('TOTAL') >= 0) {
            totalColumn = col;
        } else {
            monthMachineColumns.push(col);
        }
    });
    
    // If no numeric column found, try using DIAMETER or SIZE as fallback
    if (!numericColumn) {
        if (allColumns.indexOf('DIAMETER') >= 0) {
            numericColumn = 'DIAMETER';
        } else if (allColumns.indexOf('SIZE') >= 0) {
            numericColumn = 'SIZE';
        }
    }
    
    console.log('All Columns:', allColumns);
    console.log('Numeric Column Found:', numericColumn);

    // Build header HTML
    var headerHtml = '';
    
    if (isMachineWise) {
        // Machine-wise: Create two-row header with Mill names on top, months below
        headerHtml += '<tr>';
        
        // Size columns header (rowspan=2)
        sizeColumns.forEach(function(col) {
            headerHtml += '<th rowspan="2" style="text-align:center; vertical-align:middle; white-space:nowrap;">' + col + '</th>';
        });
        
        // C/F column (rowspan=2)
        if (cfColumn) {
            headerHtml += '<th rowspan="2" style="text-align:center; vertical-align:middle;">' + cfColumn + '</th>';
        }

        // Group month-machine columns by machine
        var machineGroups = {};
        monthMachineColumns.forEach(function(col) {
            var parts = col.split('_');
            if (parts.length >= 2) {
                var month = parts[0];
                var machine = parts.slice(1).join('_');
                
                if (!machineGroups[machine]) {
                    machineGroups[machine] = [];
                }
                machineGroups[machine].push({ fullName: col, month: month });
            }
        });

        // Render machine names in first row with colspan
        Object.keys(machineGroups).forEach(function(machine) {
            var colspan = machineGroups[machine].length;
            headerHtml += '<th colspan="' + colspan + '" style="text-align:center; background-color:#5c95ce; color:white;">' + machine + '</th>';
        });

        // Total column (rowspan=2)
        if (totalColumn) {
            headerHtml += '<th rowspan="2" style="text-align:center; vertical-align:middle;">' + totalColumn + '</th>';
        }
        
        // Total OD Wise column (rowspan=2) - calculated from grouped SizeNumeric
        headerHtml += '<th rowspan="2" style="text-align:center; vertical-align:middle;">Total OD Wise</th>';

        headerHtml += '</tr>';
        
        // Second row: Month names
        headerHtml += '<tr>';
        Object.keys(machineGroups).forEach(function(machine) {
            machineGroups[machine].forEach(function(item) {
                headerHtml += '<th style="text-align:center;">' + item.month + '</th>';
            });
        });
        headerHtml += '</tr>';

    } else {
        // Month-wise: Single row header
        headerHtml += '<tr>';
        
        // Size columns
        sizeColumns.forEach(function(col) {
            headerHtml += '<th style="text-align:center; white-space:nowrap;">' + col + '</th>';
        });
        
        // C/F column
        if (cfColumn) {
            headerHtml += '<th style="text-align:center;">' + cfColumn + '</th>';
        }
        
        // Month columns
        monthMachineColumns.forEach(function(col) {
            headerHtml += '<th style="text-align:center;">' + col + '</th>';
        });
        
        // Total column
        if (totalColumn) {
            headerHtml += '<th style="text-align:center;">' + totalColumn + '</th>';
        }
        
        // Total OD Wise column - calculated from grouped SizeNumeric
        headerHtml += '<th style="text-align:center;">Total OD Wise</th>';
        
        headerHtml += '</tr>';
    }

    $("#table-head").html(headerHtml);

    // Calculate Total OD Wise: Sum of TOTAL MT for rows with same SizeNumeric/Numeric value
    var sizeWiseTotals = {};
    var sizeWiseRowCount = {};
    if (totalColumn && numericColumn) {
        data.forEach(function(row, index) {
            // Use the identified numeric column
            var sizeKey = row[numericColumn] || '';
            
            // Debug: Log first row to see available columns
            if (index === 0) {
                console.log('Using numeric column:', numericColumn);
                console.log('First row numeric value:', sizeKey);
                console.log('First row TOTAL MT:', row[totalColumn]);
            }
            
            if (sizeKey) {
                if (!sizeWiseTotals[sizeKey]) {
                    sizeWiseTotals[sizeKey] = 0;
                    sizeWiseRowCount[sizeKey] = 0;
                }
                sizeWiseTotals[sizeKey] += parseFloat(row[totalColumn]) || 0;
                sizeWiseRowCount[sizeKey]++;
            }
        });
        console.log('Size Wise Totals:', sizeWiseTotals);
        console.log('Size Wise Row Counts:', sizeWiseRowCount);
    }

    // Track first occurrence of each Numeric for rowspan
    var sizeFirstOccurrence = {};

    // Build body HTML
    var bodyHtml = '';
    data.forEach(function(row) {
        bodyHtml += '<tr>';
        
        // Size columns
        sizeColumns.forEach(function(col) {
            var val = row[col] || '';
            bodyHtml += '<td style="text-align:center; white-space:nowrap;">' + val + '</td>';
        });
        
        // C/F column
        if (cfColumn) {
            var val = formatNumber(row[cfColumn]);
            bodyHtml += '<td style="text-align:right;">' + val + '</td>';
        }
        
        // Month-machine columns
        if (isMachineWise) {
            // Render in machine order
            var machineGroups = {};
            monthMachineColumns.forEach(function(col) {
                var parts = col.split('_');
                if (parts.length >= 2) {
                    var machine = parts.slice(1).join('_');
                    if (!machineGroups[machine]) {
                        machineGroups[machine] = [];
                    }
                    machineGroups[machine].push(col);
                }
            });
            
            Object.keys(machineGroups).forEach(function(machine) {
                machineGroups[machine].forEach(function(col) {
                    var val = formatNumber(row[col]);
                    bodyHtml += '<td style="text-align:right;">' + val + '</td>';
                });
            });
        } else {
            monthMachineColumns.forEach(function(col) {
                var val = formatNumber(row[col]);
                bodyHtml += '<td style="text-align:right;">' + val + '</td>';
            });
        }
        
        // Total column
        if (totalColumn) {
            var val = formatNumber(row[totalColumn]);
            bodyHtml += '<td style="text-align:right; font-weight:bold;">' + val + '</td>';
        }
        
        // Total OD Wise column - shows sum of TOTAL MT for rows with same Numeric/SizeNumeric (with rowspan for merged rows)
        if (numericColumn) {
            var sizeKey = row[numericColumn] || '';
            if (sizeKey && !sizeFirstOccurrence[sizeKey]) {
                // First occurrence - render cell with rowspan
                sizeFirstOccurrence[sizeKey] = true;
                var rowCount = sizeWiseRowCount[sizeKey] || 1;
                var sizeWiseVal = sizeWiseTotals[sizeKey] ? formatTotalOD(sizeWiseTotals[sizeKey]) : formatTotalOD(row[totalColumn] || 0);
                bodyHtml += '<td rowspan="' + rowCount + '" style="text-align:right; font-weight:bold; vertical-align:middle;">' + sizeWiseVal + '</td>';
            } else if (!sizeKey) {
                // No Numeric value - render empty cell
                bodyHtml += '<td style="text-align:right;"></td>';
            }
            // Skip rendering for subsequent rows with same Numeric/SizeNumeric (they're merged)
        } else {
            // No numeric column found - render empty cell
            bodyHtml += '<td style="text-align:right;"></td>';
        }
        
        bodyHtml += '</tr>';
    });

    // Add totals row
    bodyHtml += '<tr style="background-color:#fff3cd; font-weight:bold;">';
    bodyHtml += '<td colspan="' + sizeColumns.length + '" style="text-align:center;">TOTAL</td>';
    
    // Calculate totals for numeric columns
    if (cfColumn) {
        var total = 0;
        data.forEach(function(row) { total += parseFloat(row[cfColumn]) || 0; });
        bodyHtml += '<td style="text-align:right;">' + formatNumber(total) + '</td>';
    }
    
    // Month-machine columns totals - must match the same order as data rows
    if (isMachineWise) {
        // Group by machine to match data row order
        var machineGroups = {};
        monthMachineColumns.forEach(function(col) {
            var parts = col.split('_');
            if (parts.length >= 2) {
                var machine = parts.slice(1).join('_');
                if (!machineGroups[machine]) {
                    machineGroups[machine] = [];
                }
                machineGroups[machine].push(col);
            }
        });
        
        Object.keys(machineGroups).forEach(function(machine) {
            machineGroups[machine].forEach(function(col) {
                var total = 0;
                data.forEach(function(row) { total += parseFloat(row[col]) || 0; });
                bodyHtml += '<td style="text-align:right;">' + formatNumber(total) + '</td>';
            });
        });
    } else {
        monthMachineColumns.forEach(function(col) {
            var total = 0;
            data.forEach(function(row) { total += parseFloat(row[col]) || 0; });
            bodyHtml += '<td style="text-align:right;">' + formatNumber(total) + '</td>';
        });
    }
    
    if (totalColumn) {
        var total = 0;
        data.forEach(function(row) { total += parseFloat(row[totalColumn]) || 0; });
        bodyHtml += '<td style="text-align:right;">' + formatNumber(total) + '</td>';
    }
    
    // Total OD Wise column in footer - no total needed, just empty cell
    bodyHtml += '<td style="text-align:right;"></td>';
    
    bodyHtml += '</tr>';

    $("#table-body").html(bodyHtml);
}

function formatNumber(value) {
    if (value === null || value === undefined || value === '') return '0';
    var num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toFixed(3);
}

function formatTotalOD(value) {
    if (value === null || value === undefined || value === '') return '0';
    var num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toFixed(2);
}
function GetItemSizeParameter() {
    Showloader();
    MillWiseProductionReport.GetItemSizeParameter().then(function (response) {
        const $select = $('#txtSizeParameter');
            $select.empty();
            if (response.length > 0) {
                $.each(response, function (key, val) {
                    $select.append(new Option(val["Desp"], val["Desp"]));
                });
                if ($.fn && $.fn.select2) {
                    $select.select2({
                        width: '100%',
                        closeOnSelect: false,
                        placeholder: "Select..",
                        allowClear: true
                    });
                }
            } else {
                $select.empty();
                HideLoader();
            toastr.error('No Data Found');
        }
       HideLoader();
    }).catch(function (error) {
        HideLoader();
        toastr.error(error.Msg || 'Error During Get Mill Wise Production Report');
    });
}

function ExportExcel() {
    if (!currentReportData || currentReportData.length === 0) {
        toastr.warning('No data available to export');
        return;
    }
    
    const table = document.getElementById('tblMillWiseProduction');
    
    if (!table) {
        toastr.error('Table not found');
        return;
    }
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.table_to_sheet(table);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mill Wise Production');
    
    const fileName = 'MillWiseProductionReport_' + new Date().toISOString().slice(0, 10) + '.xlsx';
    XLSX.writeFile(workbook, fileName);
    
    toastr.success('Excel file downloaded successfully');
}

window.ExportExcel = ExportExcel;
