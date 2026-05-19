import { MillWiseProductionReport } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_MillWiseProductionReportService.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

let currentReportData = [];
let currentJsonData = {};
let currentIsMachineWise = false;
let filteredReportData = [];
let activeSizeFilters = [];
let activeSizeFiltersByCol = {}; 

let _mwprHeightRaf = 0;
let _mwprHeightHandlersBound = false;
function getViewportHeight() {
    return (window.visualViewport && window.visualViewport.height) ? window.visualViewport.height : (window.innerHeight || document.documentElement.clientHeight || 0);
}
function getFooterViewportOverlapHeight() {
    const footer = document.querySelector('footer.footer');
    if (!footer) return 0;
    const viewportHeight = getViewportHeight();
    const rect = footer.getBoundingClientRect();
    const h = rect.height || 0;
    if (!isFinite(h) || h <= 0) return 0;

    const overlap = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
    return overlap > 0 && isFinite(overlap) ? overlap : 0;
}
function adjustMillWiseProductionTableHeight() {
    const tableWrapper = document.getElementById('tableWrapper') || document.querySelector('.table-wrapper');
    if (!tableWrapper) return;

    if (tableWrapper.offsetParent === null) return;

    const rect = tableWrapper.getBoundingClientRect();
    const viewportHeight = getViewportHeight();
    const footerHeight = getFooterViewportOverlapHeight();
    const bottomGap = 8;
    const minHeight = 200;

    let availableHeight = viewportHeight - rect.top - footerHeight - bottomGap;
    if (!isFinite(availableHeight)) return;
    availableHeight = Math.max(minHeight, Math.floor(availableHeight));

    tableWrapper.style.height = availableHeight + 'px';
    tableWrapper.style.maxHeight = availableHeight + 'px';
}
function scheduleMillWiseProductionTableHeightAdjust() {
    if (_mwprHeightRaf) cancelAnimationFrame(_mwprHeightRaf);
    _mwprHeightRaf = requestAnimationFrame(function () {
        _mwprHeightRaf = 0;
        adjustMillWiseProductionTableHeight();
    });
}
function bindMillWiseProductionTableHeightHandlers() {
    if (_mwprHeightHandlersBound) return;
    _mwprHeightHandlersBound = true;

    window.addEventListener('resize', scheduleMillWiseProductionTableHeightAdjust, { passive: true });
    window.addEventListener('orientationchange', scheduleMillWiseProductionTableHeightAdjust, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', scheduleMillWiseProductionTableHeightAdjust, { passive: true });
    }

    setTimeout(scheduleMillWiseProductionTableHeightAdjust, 0);
    setTimeout(scheduleMillWiseProductionTableHeightAdjust, 150);
    setTimeout(scheduleMillWiseProductionTableHeightAdjust, 350);
}

$(document).ready(function () {
    InitializeFinancialYearDates();
    GetItemSizeParameter();
    GetMachineNo();
    GetPartyList();
    bindMillWiseProductionTableHeightHandlers();
    scheduleMillWiseProductionTableHeightAdjust();
    $("#btnSearch").on("click", function () {
        GetMillWiseProduction();
    });
    var urlParams = BizSolHelperFunction.getUrlVars();
    var menuValue = decodeURI(urlParams['ModuleDesp']);
    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    } else {
        $("#ERPHeading").text("Mill Wise Production Summary");
    }
    $(document).click(function (event) {
        if (!$(event.target).closest('.size-filter-dropdown, .size-filter-icon, .col-filter-dropdown, .col-filter-icon').length) {
            $('.size-filter-dropdown').hide();
            $('.col-filter-dropdown').hide();
        }
    });

    $(document).on('click', '.size-filter-dropdown, .col-filter-dropdown', function (event) {
        event.stopPropagation();
    });
});
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
    var fromDate = $("#txtFromDate").val();
    if (!fromDate || fromDate.trim() === '') {
        toastr.warning('Please select From Date');
        $("#txtFromDate").focus();
        return;
    }

    var toDate = $("#txtToDate").val();
    if (!toDate || toDate.trim() === '') {
        toastr.warning('Please select To Date');
        $("#txtToDate").focus();
        return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
        toastr.warning('From Date cannot be greater than To Date');
        $("#txtFromDate").focus();
        return;
    }

    var selectedSizeParams = $("#txtSizeParameter").val() || [];
    if (!selectedSizeParams || selectedSizeParams.length === 0) {
        toastr.warning('Please select at least one Size Parameter');
        $("#txtSizeParameter").focus();
        return;
    }

    var sizeParamCsv = selectedSizeParams.map(function (x) { return String(x).trim().toUpperCase(); }).join(',');
    var MachineNo = $("#ddlMachineNo").val() || [];
    let MachineMaster_Codes = ''
    if (MachineNo || MachineNo.length > 0) {
        MachineMaster_Codes = MachineNo.map(function (x) { return String(x).trim().toUpperCase(); }).join(',');
    }
    var partyCode = parseInt($("#ddlParty").val()) || 0;
    var jsonData = {
        FromDate: fromDate,
        ToDate: toDate,
        sizeParameter: sizeParamCsv,
        MachineMaster_Codes: MachineMaster_Codes,
        AccountMaster_Code: partyCode
    };
    GetMillWiseProductionReportList(jsonData);
}
function GetMillWiseProductionReportList(jsonData) {
    Showloader();
    MillWiseProductionReport.GetItemSizeWiseAndMonthWiseData(jsonData).then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            currentReportData = response;
            activeSizeFilters = [];
            activeSizeFiltersByCol = {};
            filteredReportData = response;
            currentJsonData = jsonData;
            currentIsMachineWise = jsonData.MachineMaster_Codes != '';
            RenderMillWiseProductionTable(filteredReportData, currentIsMachineWise);
            $('#btnDownload').show();
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
    filteredReportData = [];
    activeSizeFilters = [];
    activeSizeFiltersByCol = {}; 
    currentJsonData = {};
    scheduleMillWiseProductionTableHeightAdjust();
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
    var numericColumn = null; 
    var monthMachineColumns = [];

    allColumns.forEach(function (col) {
        var colLower = col.toLowerCase();
        if (col === 'S.NO' || col === 'SIZE' || col === 'THICKNESS' || col === 'DIAMETER' ||
            col === 'WIDTH' || col === 'LENGTH' || col === 'WEIGHT' || col === 'GSM' || col === 'MIC') {
            sizeColumns.push(col);
        } else if (col === 'Numeric' || col === 'SizeNumeric' || colLower.indexOf('numeric') >= 0) {
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
    var hasDiameterCol = allColumns.indexOf('DIAMETER') >= 0 || allColumns.indexOf('DIA') >= 0 || allColumns.indexOf('OD') >= 0;
    function getOdKey(row) {
        var raw = null;
        if (row['DIAMETER'] != null && row['DIAMETER'] !== '') raw = row['DIAMETER'];
        else if (row['DIA'] != null && row['DIA'] !== '') raw = row['DIA'];
        else if (row['OD'] != null && row['OD'] !== '') raw = row['OD'];
        if (raw != null) {
            var num = parseFloat(String(raw).toString().replace(/[^0-9.\-]/g, ''));
            if (!isNaN(num)) return num.toFixed(2);
        }
        var sizeText = row['SIZE'] != null ? String(row['SIZE']) : '';
        var m = sizeText.match(/([0-9]+(?:\.[0-9]+)?)/);
        if (m && m[1]) {
            var parsed = parseFloat(m[1]);
            if (!isNaN(parsed)) return parsed.toFixed(2);
        }
        if (numericColumn && row[numericColumn] != null) {
            var n = parseFloat(String(row[numericColumn]).toString().replace(/[^0-9.\-]/g, ''));
            if (!isNaN(n)) return n.toFixed(2);
        }
        return '';
    }

    console.log('All Columns:', allColumns);

    function getSelectedParameterColumns() {
        var selectedSizeParams = ($("#txtSizeParameter").val() || []).map(function (x) { return String(x).trim().toUpperCase(); });
        var availableColumns = Object.keys(data[0] || {}).map(function (k) { return String(k).trim().toUpperCase(); });
        var map = {
            'SIZE NUMERIC': 'SIZENUMERIC',
            'SIZE_NUMERIC': 'SIZENUMERIC',
            'SIZE-NUMERIC': 'SIZENUMERIC',
            'SIZE NUM': 'SIZENUMERIC',
            'NUMERIC': 'NUMERIC',
            'SIZE THICKNESS': 'THICKNESS',
            'OD': 'DIAMETER',
            'DIA': 'DIAMETER',
            'THK': 'THICKNESS'
        };
        var out = new Set();
        selectedSizeParams.forEach(function (p) {
            var key = map[p] || p;
            if (availableColumns.indexOf(key) >= 0) out.add(key);
        });
        return out;
    }

    var selectedParamCols = getSelectedParameterColumns();

    var headerHtml = '';

    if (isMachineWise) {
        headerHtml += '<tr>';

        sizeColumns.forEach(function (col) {
            var colHasFilter = selectedParamCols.has(col.toUpperCase());
            if (colHasFilter) {
                headerHtml += '<th rowspan="2" style="text-align:center; vertical-align:middle; white-space:nowrap; position:relative;">' +
                    col + ' <i class="fa-solid fa-filter col-filter-icon" data-col="' + col + '" style="cursor:pointer; margin-left:5px; color:#fff; font-size:12px;" onclick="toggleColumnFilter(event, \'' + col + '\')"></i>' +
                    '<div class="col-filter-dropdown" data-col="' + col + '" style="display:none; position:absolute; top:100%; left:50%; transform:translateX(-50%); background:#fff; border:1px solid #ccc; padding:8px; z-index:10000; min-width:180px; max-width:220px; box-shadow:0 2px 8px rgba(0,0,0,0.15); border-radius:4px; max-height:280px; overflow-y:auto; margin-top:3px; font-size:12px; color:#000;">' +
                    '<div style="margin-bottom:6px;">' +
                    '<input type="text" placeholder="Search..." class="form-control form-control-sm col-filter-search" data-col="' + col + '" style="font-size:11px; padding:4px 6px; border:1px solid #ddd; border-radius:3px; width:100%; color:#000;" />' +
                    '</div>' +
                    '<div class="col-filter-options" data-col="' + col + '" style="max-height:150px; overflow-y:auto; margin-bottom:6px; padding:3px; color:#000;"></div>' +
                    '<div style="border-top:1px solid #eee; padding-top:6px; display:flex; gap:5px; justify-content:flex-end;">' +
                    '<button class="btn btn-sm" onclick="clearColumnFilter(\'' + col + '\')" style="background-color:#6c757d; color:white; border:none; padding:4px 10px; border-radius:3px; font-size:11px; cursor:pointer; transition:background-color 0.2s;" onmouseover="this.style.backgroundColor=\'#5a6268\'" onmouseout="this.style.backgroundColor=\'#6c757d\'">Clear</button>' +
                    '<button class="btn btn-sm" onclick="applyColumnFilter(\'' + col + '\')" style="background-color:#28a745; color:white; border:none; padding:4px 10px; border-radius:3px; font-size:11px; cursor:pointer; transition:background-color 0.2s;" onmouseover="this.style.backgroundColor=\'#218838\'" onmouseout="this.style.backgroundColor=\'#28a745\'">Apply</button>' +
                    '</div>' +
                    '</div>' +
                    '</th>';
            } else {
                headerHtml += '<th rowspan="2" style="text-align:center; vertical-align:middle; white-space:nowrap;">' + col + '</th>';
            }
        });

        if (cfColumn) {
            headerHtml += '<th rowspan="2" style="text-align:center; vertical-align:middle;">' + cfColumn + '</th>';
        }

        var machineGroups = {};
        monthMachineColumns.forEach(function (col) {
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
        Object.keys(machineGroups).forEach(function (machine) {
            var colspan = machineGroups[machine].length;
            headerHtml += '<th colspan="' + colspan + '" style="text-align:center; background-color:#5c95ce; color:white;">' + machine + '</th>';
        });

        // Total column (rowspan=2)
        if (totalColumn) {
            headerHtml += '<th rowspan="2" style="text-align:center; vertical-align:middle;">' + totalColumn + '</th>';
        }

        // Total OD Wise column (rowspan=2) - calculated from grouped SizeNumeric
        headerHtml += '<th rowspan="2" style="text-align:center; vertical-align:middle; background-color:#e3f2fd; border: 2px solid #000;">Total OD Wise</th>';

        headerHtml += '</tr>';

        // Second row: Month names
        headerHtml += '<tr>';
        Object.keys(machineGroups).forEach(function (machine) {
            machineGroups[machine].forEach(function (item) {
                headerHtml += '<th style="text-align:center;">' + item.month + '</th>';
            });
        });
        headerHtml += '</tr>';

    } else {
        // Month-wise: Single row header
        headerHtml += '<tr>';

        // Size columns
        sizeColumns.forEach(function (col) {
            var colHasFilter = selectedParamCols.has(col.toUpperCase());
            if (colHasFilter) {
                headerHtml += '<th style="text-align:center; white-space:nowrap; position:relative;">' +
                    col + ' <i class="fa-solid fa-filter col-filter-icon" data-col="' + col + '" style="cursor:pointer; margin-left:5px; color:#fff; font-size:12px;" onclick="toggleColumnFilter(event, \'' + col + '\')"></i>' +
                    '<div class="col-filter-dropdown" data-col="' + col + '" style="display:none; position:absolute; top:100%; left:50%; transform:translateX(-50%); background:#fff; border:1px solid #ccc; padding:8px; z-index:10000; min-width:180px; max-width:220px; box-shadow:0 2px 8px rgba(0,0,0,0.15); border-radius:4px; max-height:280px; overflow-y:auto; margin-top:3px; font-size:12px; color:#000;">' +
                    '<div style="margin-bottom:6px;">' +
                    '<input type="text" placeholder="Search..." class="form-control form-control-sm col-filter-search" data-col="' + col + '" style="font-size:11px; padding:4px 6px; border:1px solid #ddd; border-radius:3px; width:100%; color:#000;" />' +
                    '</div>' +
                    '<div class="col-filter-options" data-col="' + col + '" style="max-height:150px; overflow-y:auto; margin-bottom:6px; padding:3px; color:#000;"></div>' +
                    '<div style="border-top:1px solid #eee; padding-top:6px; display:flex; gap:5px; justify-content:flex-end;">' +
                    '<button class="btn btn-sm" onclick="clearColumnFilter(\'' + col + '\')" style="background-color:#6c757d; color:white; border:none; padding:4px 10px; border-radius:3px; font-size:11px; cursor:pointer; transition:background-color 0.2s;" onmouseover="this.style.backgroundColor=\'#5a6268\'" onmouseout="this.style.backgroundColor=\'#6c757d\'">Clear</button>' +
                    '<button class="btn btn-sm" onclick="applyColumnFilter(\'' + col + '\')" style="background-color:#28a745; color:white; border:none; padding:4px 10px; border-radius:3px; font-size:11px; cursor:pointer; transition:background-color 0.2s;" onmouseover="this.style.backgroundColor=\'#218838\'" onmouseout="this.style.backgroundColor=\'#28a745\'">Apply</button>' +
                    '</div>' +
                    '</div>' +
                    '</th>';
            } else {
                headerHtml += '<th style="text-align:center; white-space:nowrap;">' + col + '</th>';
            }
        });

        // C/F column
        if (cfColumn) {
            headerHtml += '<th style="text-align:center;">' + cfColumn + '</th>';
        }

        // Month columns
        monthMachineColumns.forEach(function (col) {
            headerHtml += '<th style="text-align:center;">' + col + '</th>';
        });

        // Total column
        if (totalColumn) {
            headerHtml += '<th style="text-align:center;">' + totalColumn + '</th>';
        }

        // Total OD Wise column - calculated from grouped SizeNumeric
        headerHtml += '<th style="text-align:center; background-color:#e3f2fd; border: 2px solid #000;">Total OD Wise</th>';

        headerHtml += '</tr>';
    }

    $("#table-head").html(headerHtml);

    // Initialize filter options after header is rendered for selected columns
    Array.from(selectedParamCols).forEach(function (col) {
        populateColumnFilterOptions(col);
    });
    
    // Update filter icon colors to reflect active filter status
    $('.col-filter-icon').each(function () {
        var c = $(this).data('col');
        var set = activeSizeFiltersByCol[c];
        $(this).css('color', set && set.size > 0 ? '#ff6b6b' : '#fff');
    });

    // Calculate Total OD Wise: Sum of TOTAL MT for rows with same SizeNumeric/Numeric value
    var sizeWiseTotals = {};
    var sizeWiseRowCount = {};
    if (totalColumn && numericColumn) {
        data.forEach(function (row, index) {
            var sizeKey = row[numericColumn] || '';
            if (index === 0) {
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
    }

    // OD-wise column will now display value on every row (no rowspan)
    var sizeFirstOccurrence = {}; // retained but unused for now

    // Build body HTML
    var bodyHtml = '';
    data.forEach(function (row) {
        bodyHtml += '<tr>';

        // Size columns
        sizeColumns.forEach(function (col) {
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
            monthMachineColumns.forEach(function (col) {
                var parts = col.split('_');
                if (parts.length >= 2) {
                    var machine = parts.slice(1).join('_');
                    if (!machineGroups[machine]) {
                        machineGroups[machine] = [];
                    }
                    machineGroups[machine].push(col);
                }
            });

            Object.keys(machineGroups).forEach(function (machine) {
                machineGroups[machine].forEach(function (col) {
                    var val = formatNumber(row[col]);
                    bodyHtml += '<td style="text-align:right;">' + val + '</td>';
                });
            });
        } else {
            monthMachineColumns.forEach(function (col) {
                var val = formatNumber(row[col]);
                bodyHtml += '<td style="text-align:right;">' + val + '</td>';
            });
        }

        // Total column
        if (totalColumn) {
            var val = formatNumber(row[totalColumn]);
            bodyHtml += '<td style="text-align:right; font-weight:bold;">' + val + '</td>';
        }

        // Total OD Wise column - shows sum of TOTAL MT for rows with same Numeric/SizeNumeric (merged via rowspan)
        if (numericColumn) {
            var sizeKey = row[numericColumn] || '';
            if (sizeKey && !sizeFirstOccurrence[sizeKey]) {
                sizeFirstOccurrence[sizeKey] = true;
                var rowCount = sizeWiseRowCount[sizeKey] || 1;
                var sizeWiseVal = sizeWiseTotals[sizeKey] ? formatTotalOD(sizeWiseTotals[sizeKey]) : formatTotalOD(row[totalColumn] || 0);
                bodyHtml += '<td rowspan="' + rowCount + '" style="text-align:right; font-weight:bold; vertical-align:middle; background-color:#e3f2fd; border: 2px solid #000;">' + sizeWiseVal + '</td>';
            } else if (!sizeKey) {
                bodyHtml += '<td style="text-align:right; background-color:#e3f2fd; border: 2px solid #000;"></td>';
            }
        } else {
            bodyHtml += '<td style="text-align:right; background-color:#e3f2fd; border-left: 2px solid #000; border-right: 2px solid #000;"></td>';
        }

        bodyHtml += '</tr>';
    });

    // Add totals row
    bodyHtml += '<tr style="background-color:#fff3cd; font-weight:bold;">';
    bodyHtml += '<td colspan="' + sizeColumns.length + '" style="text-align:center;">TOTAL</td>';

    // Calculate totals for numeric columns
    if (cfColumn) {
        var total = 0;
        data.forEach(function (row) { total += parseFloat(row[cfColumn]) || 0; });
        bodyHtml += '<td style="text-align:right;">' + formatNumber(total) + '</td>';
    }

    // Month-machine columns totals - must match the same order as data rows
    if (isMachineWise) {
        // Group by machine to match data row order
        var machineGroups = {};
        monthMachineColumns.forEach(function (col) {
            var parts = col.split('_');
            if (parts.length >= 2) {
                var machine = parts.slice(1).join('_');
                if (!machineGroups[machine]) {
                    machineGroups[machine] = [];
                }
                machineGroups[machine].push(col);
            }
        });

        Object.keys(machineGroups).forEach(function (machine) {
            machineGroups[machine].forEach(function (col) {
                var total = 0;
                data.forEach(function (row) { total += parseFloat(row[col]) || 0; });
                bodyHtml += '<td style="text-align:right;">' + formatNumber(total) + '</td>';
            });
        });
    } else {
        monthMachineColumns.forEach(function (col) {
            var total = 0;
            data.forEach(function (row) { total += parseFloat(row[col]) || 0; });
            bodyHtml += '<td style="text-align:right;">' + formatNumber(total) + '</td>';
        });
    }

    if (totalColumn) {
        var total = 0;
        data.forEach(function (row) { total += parseFloat(row[totalColumn]) || 0; });
        bodyHtml += '<td style="text-align:right;">' + formatNumber(total) + '</td>';
    }

    // Total OD Wise column in footer - no total needed, just empty cell
    bodyHtml += '<td style="text-align:right; background-color:#e3f2fd; border: 2px solid #000;"></td>';

    bodyHtml += '</tr>';

    $("#table-body").html(bodyHtml);
    scheduleMillWiseProductionTableHeightAdjust();
}
function populateSizeFilterOptions() {
    if (!currentReportData || currentReportData.length === 0) return;

    // Determine which size-parameter columns are selected and available in data
    var selectedSizeParams = ($("#txtSizeParameter").val() || []).map(function (x) { return String(x).trim().toUpperCase(); });
    var candidateColumns = ['SIZE', 'DIAMETER', 'THICKNESS', 'WIDTH', 'LENGTH', 'WEIGHT', 'GSM', 'MIC', 'SIZENUMERIC', 'NUMERIC'];
    var availableColumns = Object.keys(currentReportData[0] || {}).map(function (k) { return String(k).trim().toUpperCase(); });
    var selectedColumns = [];
    if (selectedSizeParams.length > 0) {
        // Map selected params to actual available columns
        selectedSizeParams.forEach(function (param) {
            // direct match first
            if (availableColumns.indexOf(param) >= 0) {
                selectedColumns.push(param);
                return;
            }
            // try common mappings
            var map = {
                'SIZE NUMERIC': 'SIZENUMERIC',
                'SIZE_NUMERIC': 'SIZENUMERIC',
                'SIZE-NUMERIC': 'SIZENUMERIC',
                'SIZE NUM': 'SIZENUMERIC',
                'NUMERIC': 'NUMERIC',
                'SIZE THICKNESS': 'THICKNESS',
                'OD': 'DIAMETER',
                'DIA': 'DIAMETER',
                'THK': 'THICKNESS',
            };
            var mapped = map[param] || param;
            if (availableColumns.indexOf(mapped) >= 0) {
                selectedColumns.push(mapped);
            }
        });
    }
    if (selectedColumns.length === 0) {
        // Fallback to any candidate columns present
        candidateColumns.forEach(function (col) {
            if (availableColumns.indexOf(col) >= 0) selectedColumns.push(col);
        });
    }

    // Collect unique values from selected columns
    var uniqueSizes = new Set();
    currentReportData.forEach(function (row) {
        selectedColumns.forEach(function (col) {
            var val = row[col] != null ? String(row[col]).trim() : '';
            if (val) uniqueSizes.add(val);
        });
    });

    // Sort sizes
    var sortedSizes = Array.from(uniqueSizes).sort(function (a, b) {
        // Try to parse as numbers for numeric sorting
        var numA = parseFloat(a);
        var numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return a.toString().localeCompare(b.toString());
    });

    // Build checkbox HTML with compact styling
    var optionsHtml = '<div style="margin-bottom:5px; padding-bottom:5px; border-bottom:1px solid #eee;">' +
        '<label style="display:flex; align-items:center; margin:0; font-weight:600; font-size:11px; cursor:pointer; padding:3px; background-color:#f8f9fa; border-radius:3px; color:#000;">' +
        '<input type="checkbox" class="size-filter-checkbox-all" style="margin-right:5px; width:13px; height:13px; cursor:pointer;" checked /> ' +
        'Select All</label></div>';

    sortedSizes.forEach(function (size) {
        var isChecked = activeSizeFilters.length === 0 || activeSizeFilters.includes(size);
        optionsHtml += '<label style="display:flex; align-items:center; margin-bottom:3px; font-size:11px; cursor:pointer; padding:3px; border-radius:2px; transition:background-color 0.2s; color:#000;" ' +
            'onmouseover="this.style.backgroundColor=\'#f1f3f5\'" onmouseout="this.style.backgroundColor=\'transparent\'">' +
            '<input type="checkbox" class="size-filter-checkbox" value="' + size + '" style="margin-right:5px; width:13px; height:13px; cursor:pointer;" ' + (isChecked ? 'checked' : '') + ' /> ' +
            '<span style="user-select:none; color:#000;">' + size + '</span></label>';
    });

    $('.size-filter-options').html(optionsHtml);

    // Add event handlers
    $('.size-filter-checkbox-all').on('change', function () {
        var isChecked = $(this).is(':checked');
        $('.size-filter-checkbox').prop('checked', isChecked);
    });

    $('.size-filter-checkbox').on('change', function () {
        var totalCheckboxes = $('.size-filter-checkbox').length;
        var checkedCheckboxes = $('.size-filter-checkbox:checked').length;
        $('.size-filter-checkbox-all').prop('checked', totalCheckboxes === checkedCheckboxes);
    });

    // Search functionality with improved filtering
    $('.size-filter-search').off('input').on('input', function () {
        var searchValue = $(this).val().toLowerCase();
        var matchCount = 0;
        $('.size-filter-checkbox').each(function () {
            var label = $(this).parent();
            var text = $(this).val().toLowerCase();
            if (text.includes(searchValue)) {
                label.show();
                matchCount++;
            } else {
                label.hide();
            }
        });

        // Show "Select All" only if there are matches
        if (matchCount > 0) {
            $('.size-filter-checkbox-all').parent().parent().show();
        } else {
            $('.size-filter-checkbox-all').parent().parent().hide();
        }
    });
}

window.toggleSizeFilter = function (event) {
    event.stopPropagation();
    $('.size-filter-dropdown').toggle();
    if ($('.size-filter-dropdown').is(':visible')) {
        populateSizeFilterOptions();
        // Focus on search input when dropdown opens
        setTimeout(function () {
            $('.size-filter-search').focus();
        }, 100);
    }
};

window.applySizeFilter = function () {
    activeSizeFilters = [];
    $('.size-filter-checkbox:checked').each(function () {
        activeSizeFilters.push($(this).val());
    });

    if (activeSizeFilters.length === 0 || activeSizeFilters.length === $('.size-filter-checkbox').length) {
        // No filter or all selected - show all data
        filteredReportData = currentReportData;
        $('.size-filter-icon').css('color', '#fff');
    } else {
        // Filter data by selected sizes - check across all size-related columns
        var selectedSizeParams = ($("#txtSizeParameter").val() || []).map(function (x) { return String(x).trim().toUpperCase(); });
        var availableColumns = Object.keys(currentReportData[0] || {}).map(function (k) { return String(k).trim().toUpperCase(); });
        var columnsToCheck = [];
        if (selectedSizeParams.length > 0) {
            selectedSizeParams.forEach(function (param) {
                if (availableColumns.indexOf(param) >= 0) columnsToCheck.push(param);
            });
        }
        if (columnsToCheck.length === 0) {
            columnsToCheck = ['SIZE', 'DIAMETER', 'THICKNESS', 'WIDTH', 'LENGTH', 'WEIGHT', 'GSM', 'MIC'];
        }
        filteredReportData = currentReportData.filter(function (row) {
            for (var i = 0; i < columnsToCheck.length; i++) {
                var colName = columnsToCheck[i];
                if (row[colName] != null) {
                    var colValue = String(row[colName]).trim();
                    if (activeSizeFilters.indexOf(colValue) >= 0) return true;
                }
            }
            return false;
        });
        $('.size-filter-icon').css('color', '#ff6b6b'); // Red color to indicate active filter
    }

    RenderMillWiseProductionTable(filteredReportData, currentIsMachineWise);
    $('.size-filter-dropdown').hide();

};

window.clearSizeFilter = function () {
    activeSizeFilters = [];
    $('.size-filter-checkbox').prop('checked', true);
    $('.size-filter-checkbox-all').prop('checked', true);
    filteredReportData = currentReportData;
    $('.size-filter-icon').css('color', '#fff');

    RenderMillWiseProductionTable(filteredReportData, currentIsMachineWise);
    $('.size-filter-dropdown').hide();


};
function validateAndCleanActiveFilters() {
    if (!currentReportData || currentReportData.length === 0) {
        activeSizeFiltersByCol = {};
        return;
    }
    
    var allColumns = Object.keys(currentReportData[0] || {});
    var columnsToClean = Object.keys(activeSizeFiltersByCol);
    
    columnsToClean.forEach(function (col) {
        // Only clean filters for columns that exist in current data
        if (allColumns.indexOf(col) >= 0) {
            var availableValues = new Set();
            currentReportData.forEach(function (row) {
                var v = row[col] != null ? String(row[col]).trim() : '';
                if (v) availableValues.add(v);
            });
            
            // Remove filter values that no longer exist in the data
            if (activeSizeFiltersByCol[col]) {
                var filteredSet = new Set();
                activeSizeFiltersByCol[col].forEach(function (val) {
                    if (availableValues.has(val)) {
                        filteredSet.add(val);
                    }
                });
                
                // If all values still exist or filter is now empty/all selected, clear the filter
                if (filteredSet.size === 0 || filteredSet.size === availableValues.size) {
                    delete activeSizeFiltersByCol[col];
                } else {
                    activeSizeFiltersByCol[col] = filteredSet;
                }
            }
        } else {
            // Column no longer exists, remove its filter
            delete activeSizeFiltersByCol[col];
        }
    });
}

// New: column-specific filters for all selected size-parameter columns
function populateColumnFilterOptions(columnName) {
    if (!currentReportData || currentReportData.length === 0) return;
    var col = String(columnName).trim();
    var $optionsHost = $('.col-filter-options[data-col="' + col + '"]');
    if ($optionsHost.length === 0) return;

    var values = new Set();
    currentReportData.forEach(function (row) {
        var v = row[col] != null ? String(row[col]).trim() : '';
        if (v) values.add(v);
    });

    var sorted = Array.from(values).sort(function (a, b) {
        var na = parseFloat(a); var nb = parseFloat(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.toString().localeCompare(b.toString());
    });

    var optionsHtml = '<div style="margin-bottom:5px; padding-bottom:5px; border-bottom:1px solid #eee;">' +
        '<label style="display:flex; align-items:center; margin:0; font-weight:600; font-size:11px; cursor:pointer; padding:3px; background-color:#f8f9fa; border-radius:3px; color:#000;">' +
        '<input type="checkbox" class="col-filter-checkbox-all" data-col="' + col + '" style="margin-right:5px; width:13px; height:13px; cursor:pointer;" checked /> Select All</label></div>';

    var selectedSet = activeSizeFiltersByCol[col] || null; // null => no active filter
    sorted.forEach(function (val) {
        var checked = !selectedSet || selectedSet.has(val);
        optionsHtml += '<label style="display:flex; align-items:center; margin-bottom:3px; font-size:11px; cursor:pointer; padding:3px; border-radius:2px; transition:background-color 0.2s; color:#000;" onmouseover="this.style.backgroundColor=\'#f1f3f5\'" onmouseout="this.style.backgroundColor=\'transparent\'">' +
            '<input type="checkbox" class="col-filter-checkbox" data-col="' + col + '" value="' + val + '" style="margin-right:5px; width:13px; height:13px; cursor:pointer;" ' + (checked ? 'checked' : '') + ' /> ' +
            '<span style="user-select:none; color:#000;">' + val + '</span></label>';
    });

    $optionsHost.html(optionsHtml);
    
    // Clear search field when refreshing
    var $dropdown = $('.col-filter-dropdown[data-col="' + col + '"]');
    $dropdown.find('.col-filter-search').val('');

    // events
    $dropdown.find('.col-filter-checkbox-all').off('change').on('change', function () {
        var isChecked = $(this).is(':checked');
        $dropdown.find('.col-filter-checkbox').prop('checked', isChecked);
    });
    $dropdown.find('.col-filter-checkbox').off('change').on('change', function () {
        var total = $dropdown.find('.col-filter-checkbox').length;
        var checked = $dropdown.find('.col-filter-checkbox:checked').length;
        $dropdown.find('.col-filter-checkbox-all').prop('checked', total === checked);
    });
    $dropdown.find('.col-filter-search').off('input').on('input', function () {
        var s = $(this).val().toLowerCase();
        var match = 0;
        $dropdown.find('.col-filter-checkbox').each(function () {
            var label = $(this).parent();
            var text = $(this).val().toLowerCase();
            if (text.includes(s)) { label.show(); match++; } else { label.hide(); }
        });
        if (match > 0) $dropdown.find('.col-filter-checkbox-all').parent().parent().show();
        else $dropdown.find('.col-filter-checkbox-all').parent().parent().hide();
    });
}

function applyAllColumnFilters() {
    var columns = Object.keys(activeSizeFiltersByCol);
    var hasAny = columns.some(function (c) { return activeSizeFiltersByCol[c] && activeSizeFiltersByCol[c].size > 0; });
    if (!hasAny) {
        filteredReportData = currentReportData;
        $('.col-filter-icon').css('color', '#5c95ce');
        return;
    }
    filteredReportData = currentReportData.filter(function (row) {
        for (var i = 0; i < columns.length; i++) {
            var c = columns[i];
            var set = activeSizeFiltersByCol[c];
            if (set && set.size > 0) {
                var v = row[c] != null ? String(row[c]).trim() : '';
                if (!set.has(v)) return false;
            }
        }
        return true;
    });
    // Color icons by active status
    $('.col-filter-icon').each(function () {
        var c = $(this).data('col');
        var set = activeSizeFiltersByCol[c];
        $(this).css('color', set && set.size > 0 ? '#ff6b6b' : '#fff');
    });
}

window.toggleColumnFilter = function (event, columnName) {
    event.stopPropagation();
    var col = String(columnName).trim();
    var $dd = $('.col-filter-dropdown[data-col="' + col + '"]');
    $('.col-filter-dropdown').not($dd).hide();
    $dd.toggle();
    if ($dd.is(':visible')) {
        populateColumnFilterOptions(col);
        setTimeout(function () {
            $dd.find('.col-filter-search').focus();
        }, 100);
    }
};

window.applyColumnFilter = function (columnName) {
    var col = String(columnName).trim();
    var selected = new Set();
    $('.col-filter-dropdown[data-col="' + col + '"]').find('.col-filter-checkbox:checked').each(function () {
        selected.add($(this).val());
    });
    // If all or none selected, treat as no active filter for this column
    var total = $('.col-filter-dropdown[data-col="' + col + '"]').find('.col-filter-checkbox').length;
    if (selected.size === 0 || selected.size === total) {
        delete activeSizeFiltersByCol[col];
    } else {
        activeSizeFiltersByCol[col] = selected;
    }
    applyAllColumnFilters();
    RenderMillWiseProductionTable(filteredReportData, currentIsMachineWise);
    $('.col-filter-dropdown[data-col="' + col + '"]').hide();
};

window.clearColumnFilter = function (columnName) {
    var col = String(columnName).trim();
    delete activeSizeFiltersByCol[col];
    $('.col-filter-dropdown[data-col="' + col + '"]').find('.col-filter-checkbox').prop('checked', true);
    $('.col-filter-dropdown[data-col="' + col + '"]').find('.col-filter-checkbox-all').prop('checked', true);
    applyAllColumnFilters();
    RenderMillWiseProductionTable(filteredReportData, currentIsMachineWise);
    $('.col-filter-dropdown[data-col="' + col + '"]').hide();
};

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
                
                // Track when user is actively using this Select2
                var isInteracting = false;
                window.txtSizeParameterLastInteraction = 0;
                
                // When Select2 opens, focus the search field and track typing
                $select.on('select2:open', function() {
                    isInteracting = true;
                    window.txtSizeParameterLastInteraction = new Date().getTime();
                    setTimeout(function() {
                        var $select2Container = $select.next('.select2-container');
                        var $searchField = $select2Container.find('.select2-search__field');
                        if ($searchField.length > 0) {
                            $searchField.focus();
                            // Track typing in the search field
                            $searchField.on('keyup input', function() {
                                window.txtSizeParameterLastInteraction = new Date().getTime();
                                isInteracting = true;
                            });
                        }
                    }, 0);
                });
                
                // When Select2 closes, keep focus on the Select2 container if user was interacting
                $select.on('select2:close', function(e) {
                    if (isInteracting) {
                        setTimeout(function() {
                            var $select2Container = $select.next('.select2-container');
                            if ($select2Container.length > 0) {
                                $select2Container.find('.select2-selection').focus();
                            }
                        }, 10);
                        isInteracting = false;
                    }
                });
                
                // Track interaction with txtSizeParameter Select2
                $select.on('select2:select select2:unselect', function() {
                    window.txtSizeParameterLastInteraction = new Date().getTime();
                    isInteracting = true;
                });
                
                // Prevent focus from moving to ddlMachineNo when user is typing in txtSizeParameter
                $(document).on('focusin', '#ddlMachineNo', function(e) {
                    var now = new Date().getTime();
                    // If txtSizeParameter was interacted with in the last 300ms, refocus it
                    if (window.txtSizeParameterLastInteraction && (now - window.txtSizeParameterLastInteraction < 300)) {
                        setTimeout(function() {
                            var $txtSizeParam = $('#txtSizeParameter');
                            var $txtSizeContainer = $txtSizeParam.next('.select2-container');
                            if ($txtSizeContainer.length > 0) {
                                if ($txtSizeContainer.hasClass('select2-container--open')) {
                                    $txtSizeContainer.find('.select2-search__field').focus();
                                } else {
                                    $txtSizeParam.select2('open');
                                }
                            } else {
                                $txtSizeParam.focus();
                            }
                        }, 0);
                    }
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
        toastr.error(error.Msg || 'Error Durante Get Mill Wise Production Report');
    });
}
function GetMachineNo() {
    Showloader();
    MillWiseProductionReport.GetMachineNo().then(function (response) {
        const $select = $('#ddlMachineNo');
        $select.empty();
        if (response.length > 0) {
            $.each(response, function (key, val) {
                $select.append(new Option(val["Desp"], val["Code"]));
            });
            if ($.fn && $.fn.select2) {
                $select.select2({
                    width: '100%',
                    closeOnSelect: false,
                    placeholder: "N/A..",
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
        toastr.error(error.Msg || 'Error Durante Get Mill Wise Production Report');
    });
}
function GetPartyList() {
    Showloader();
    MillWiseProductionReport.GetMillWiseProductionFilters('PARTY', 'Y', 0).then(function (response) {
        const $select = $('#ddlParty');
        $select.empty();
        $select.append(new Option('All', '0'));
        if (response && response.length > 0) {
            $.each(response, function (key, val) {
                $select.append(new Option(val['Desp'] || val['AccountDesp'] || val['Name'] || '', val['Code'] || val['AccountMaster_Code'] || 0));
            });
        }
        if ($.fn && $.fn.select2) {
            $select.select2({
                width: '100%',
                placeholder: 'All',
                allowClear: true
            });
        }
        HideLoader();
    }).catch(function (error) {
        HideLoader();
        toastr.error(error.Msg || 'Error loading Party list');
    });
}
function ExportExcel() {
    if (!currentReportData || currentReportData.length === 0) {
        toastr.warning('No data available to export');
        return;
    }
    // Prefer exporting the rendered HTML table (what user sees). Fallback to full dataset.
    const table = document.getElementById('tblMillWiseProduction');
    const workbook = XLSX.utils.book_new();
    let worksheet;
    if (table) {
        // Clone and strip filter UI before export
        const clone = table.cloneNode(true);
        const junkSelectors = [
            '.col-filter-dropdown',
            '.size-filter-dropdown',
            '.col-filter-icon',
            '.size-filter-icon'
        ];
        junkSelectors.forEach(sel => {
            clone.querySelectorAll(sel).forEach(el => el.remove());
        });
        // Also remove onclick attributes to avoid exporting their text in some libs
        clone.querySelectorAll('[onclick]').forEach(el => el.removeAttribute('onclick'));
        // Export from cleaned DOM table
        worksheet = XLSX.utils.table_to_sheet(clone, { raw: true });
    } else {
        // Fallback to full unfiltered data
        const dataToExport = currentReportData.slice();
        worksheet = XLSX.utils.json_to_sheet(dataToExport);
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mill Wise Production');
    const fileName = 'MillWiseProductionReport_' + new Date().toISOString().slice(0, 10) + '.xlsx';
    XLSX.writeFile(workbook, fileName);
    toastr.success('Excel file downloaded successfully');
}

window.ExportExcel = ExportExcel;
