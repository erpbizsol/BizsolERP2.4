import { ProductionBreakDownReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_ProductionBreakDownReportService.js';
import { MillWiseProductionReport } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_MillWiseProductionReportService.js';
import { MachineMaintenanceService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MachineMaintenanceService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

let currentReportData = [];

const HIDDEN_COLUMNS = ['ReportPeriod', 'ReportMode'];
const PBDR_TABLE_MIN_HEIGHT = 350;

let _pbdrHeightRaf = 0;
let _pbdrHeightHandlersBound = false;
function getViewportHeight() {
    return (window.visualViewport && window.visualViewport.height)
        ? window.visualViewport.height
        : (window.innerHeight || document.documentElement.clientHeight || 0);
}
function getFooterViewportOverlapHeight() {
    const footer = document.querySelector('footer.footer');
    if (!footer) return 0;
    const viewportHeight = getViewportHeight();
    const rect = footer.getBoundingClientRect();
    const overlap = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
    return overlap > 0 && isFinite(overlap) ? overlap : 0;
}
function adjustProductionBreakDownTableHeight() {
    const tableWrapper = document.getElementById('pbdrTableWrapper');
    if (!tableWrapper || tableWrapper.offsetParent === null) return;

    const rect = tableWrapper.getBoundingClientRect();
    const footerHeight = getFooterViewportOverlapHeight();
    const bottomGap = 4;
    const minHeight = PBDR_TABLE_MIN_HEIGHT;

    let availableHeight = getViewportHeight() - rect.top - footerHeight - bottomGap;
    if (!isFinite(availableHeight)) return;
    availableHeight = Math.max(minHeight, Math.floor(availableHeight));

    tableWrapper.style.height = availableHeight + 'px';
    tableWrapper.style.maxHeight = availableHeight + 'px';
}
function scheduleProductionBreakDownTableHeightAdjust() {
    if (_pbdrHeightRaf) cancelAnimationFrame(_pbdrHeightRaf);
    _pbdrHeightRaf = requestAnimationFrame(function () {
        _pbdrHeightRaf = 0;
        adjustProductionBreakDownTableHeight();
        syncMonthModeHeaderStickyOffset();
    });
}
function syncMonthModeHeaderStickyOffset() {
    const table = document.getElementById('tblProductionBreakDown');
    if (!table || !table.classList.contains('pbdr-month-mode')) return;

    const topRow = table.querySelector('thead .pbdr-month-header-top');
    const subRow = table.querySelector('thead .pbdr-month-header-sub');
    if (!topRow || !subRow) return;

    const topHeight = Math.ceil(topRow.getBoundingClientRect().height);
    const subHeight = Math.ceil(subRow.getBoundingClientRect().height);
    if (topHeight > 0) {
        table.style.setProperty('--pbdr-hdr-r1', topHeight + 'px');
    }
    if (subHeight > 0) {
        table.style.setProperty('--pbdr-hdr-r2', subHeight + 'px');
    }
}
function bindProductionBreakDownTableHeightHandlers() {
    if (_pbdrHeightHandlersBound) return;
    _pbdrHeightHandlersBound = true;

    window.addEventListener('resize', scheduleProductionBreakDownTableHeightAdjust, { passive: true });
    window.addEventListener('orientationchange', scheduleProductionBreakDownTableHeightAdjust, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', scheduleProductionBreakDownTableHeightAdjust, { passive: true });
    }

    setTimeout(scheduleProductionBreakDownTableHeightAdjust, 0);
    setTimeout(scheduleProductionBreakDownTableHeightAdjust, 150);
    setTimeout(scheduleProductionBreakDownTableHeightAdjust, 350);
}
function asList(response) {
    if (response == null) return [];
    if (Array.isArray(response)) return response;
    const keys = ['data', 'Data', 'result', 'Result', 'items', 'Items', 'value', 'Value'];
    for (let i = 0; i < keys.length; i++) {
        const v = response[keys[i]];
        if (Array.isArray(v)) return v;
    }
    return [];
}
function normalizeKey(key) {
    return String(key || '').trim().toLowerCase();
}
function isHiddenColumn(key) {
    const nk = normalizeKey(key);
    return HIDDEN_COLUMNS.some(function (col) { return normalizeKey(col) === nk; });
}
function isCodeColumn(key) {
    return normalizeKey(key) === 'code';
}

function isSerialNoColumn(key) {
    const nk = normalizeKey(key).replace(/[\s._%]/g, '');
    return nk === 'srno' || nk === 'sno' || nk === 'serialno';
}

function isPlainLeftColumn(key) {
    return isCodeColumn(key) || isSerialNoColumn(key);
}

function isIdentifierColumn(key) {
    const nk = normalizeKey(key).replace(/[\s._%]/g, '');
    return nk === 'srno' || nk === 'sno' || nk === 'serialno' || nk === 'reasoncode' || nk === 'code';
}
function isReasonwisePercentColumn(key) {
    const nk = normalizeKey(key);
    return nk === 'cumulative in %' || nk.indexOf('cumulative%') >= 0;
}
function isCumulativeColumn(key) {
    return normalizeKey(key) === 'cumulative';
}
function isNumericValue(value) {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'number' && isFinite(value)) return true;
    const n = parseFloat(String(value).replace(/,/g, ''));
    return !isNaN(n) && isFinite(n);
}
function isNumericColumn(data, key) {
    let hasValue = false;
    for (let i = 0; i < data.length; i++) {
        const v = data[i][key];
        if (v === null || v === undefined || v === '') continue;
        hasValue = true;
        if (!isNumericValue(v)) return false;
    }
    return hasValue;
}
function buildGridOptions(data) {
    const hiddenColumns = HIDDEN_COLUMNS.slice();
    const StringFilterColumn = [];
    const NumericFilterColumn = [];
    const ColumnAlignment = {};
    const TotalColumns = [];
    const FixedDecimals = {};

    if (!data || !data.length) {
        return {
            StringFilterColumn,
            NumericFilterColumn,
            hiddenColumns,
            ColumnAlignment,
            TotalColumns,
            FixedDecimals,
        };
    }

    Object.keys(data[0]).forEach(function (key) {
        if (isHiddenColumn(key)) {
            if (hiddenColumns.indexOf(key) < 0) hiddenColumns.push(key);
            return;
        }

        const nk = normalizeKey(key);
        if (isIdentifierColumn(key)) {
            if (!isPlainLeftColumn(key)) {
                StringFilterColumn.push(key);
            }
            ColumnAlignment[key] = isPlainLeftColumn(key) ? 'left' : 'center';
        } else if (isNumericColumn(data, key)) {
            NumericFilterColumn.push(key);
            ColumnAlignment[key] = 'right';
            if (nk !== 'average' && !isReasonwisePercentColumn(key) && !isCumulativeColumn(key)) {
                TotalColumns.push(key);
            }
            if (isReasonwisePercentColumn(key)) {
                FixedDecimals[key] = 0;
            } else if (nk === 'average in minutes' || nk === 'cumulative') {
                FixedDecimals[key] = 0;
            } else {
                FixedDecimals[key] = (nk.indexOf('_fq') >= 0 || nk === 'total') ? 0 : 2;
            }
        } else {
            StringFilterColumn.push(key);
        }
    });

    return {
        StringFilterColumn,
        NumericFilterColumn,
        hiddenColumns,
        ColumnAlignment,
        TotalColumns,
        FixedDecimals,
    };
}
function formatDateYYYYMMDD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}
function InitializeDefaultDates() {
    const today = new Date();
    const fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    $('#txtFromDate').val(formatDateYYYYMMDD(fromDate));
    $('#txtToDate').val(formatDateYYYYMMDD(today));
}
function findDataColumn(data, candidates) {
    if (!data || !data.length) return null;
    const keys = Object.keys(data[0]);
    for (let c = 0; c < candidates.length; c++) {
        const target = normalizeKey(candidates[c]);
        for (let i = 0; i < keys.length; i++) {
            if (normalizeKey(keys[i]) === target) return keys[i];
        }
    }
    return null;
}
function isMonthReportMode(mode, data) {
    const m = String(mode || '').trim().toLowerCase();
    if (m === 'month') return true;
    if (data && data.length) {
        const reportMode = data[0].ReportMode || data[0].reportMode;
        return String(reportMode || '').trim().toLowerCase() === 'month';
    }
    return false;
}
function parseMonthPivotColumns(data) {
    const months = [];
    const monthMap = {};
    const keys = Object.keys(data[0]);

    keys.forEach(function (key) {
        const match = key.match(/^(.+)_Fq$/i);
        if (!match) return;
        const month = match[1];
        if (!monthMap[month]) {
            monthMap[month] = { month: month, fqKey: key, downtimeKey: null };
            months.push(monthMap[month]);
        } else {
            monthMap[month].fqKey = key;
        }
    });

    keys.forEach(function (key) {
        const match = key.match(/^(.+)_Downtime$/i);
        if (!match) return;
        const month = match[1];
        if (monthMap[month]) {
            monthMap[month].downtimeKey = key;
        }
    });

    return months.filter(function (item) { return item.fqKey && item.downtimeKey; });
}
function formatMonthCell(value, decimals) {
    if (!isNumericValue(value)) {
        return value === null || value === undefined ? '' : String(value);
    }
    const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
    if (typeof formatIndianNumber === 'function') {
        return formatIndianNumber(n, decimals);
    }
    return n.toFixed(decimals);
}
function getCategoryRowSpans(data, categoryKey, srNoKey) {
    const spans = new Array(data.length).fill(0);
    let i = 0;

    while (i < data.length) {
        const category = data[i][categoryKey];
        const srNo = srNoKey ? data[i][srNoKey] : i;
        let count = 1;

        while (i + count < data.length) {
            const nextCategory = data[i + count][categoryKey];
            const nextSrNo = srNoKey ? data[i + count][srNoKey] : i + count;
            if (nextCategory !== category || nextSrNo !== srNo) break;
            count++;
        }

        spans[i] = count;
        i += count;
    }

    return spans;
}
function buildMonthModeHeader(monthColumns, totalKey, averageKey) {
    let headerHtml = '<tr class="pbdr-month-header-top">';

    headerHtml += '<th rowspan="2" class="pbdr-static-col text-start">S.No</th>';
    headerHtml += '<th rowspan="2" class="pbdr-static-col">Category</th>';
    headerHtml += '<th rowspan="2" class="pbdr-static-col">Reason Code</th>';
    headerHtml += '<th rowspan="2" class="pbdr-static-col">Reason Description</th>';

    monthColumns.forEach(function (item) {
        headerHtml += '<th colspan="2" class="pbdr-month-group">' + item.month + '</th>';
    });

    if (totalKey) {
        headerHtml += '<th rowspan="2" class="pbdr-summary-col">Total</th>';
    }
    if (averageKey) {
        headerHtml += '<th rowspan="2" class="pbdr-summary-col">Average</th>';
    }

    headerHtml += '</tr><tr class="pbdr-month-header-sub">';

    monthColumns.forEach(function () {
        headerHtml += '<th class="pbdr-sub-col">Fq</th>';
        headerHtml += '<th class="pbdr-sub-col">Downtime</th>';
    });

    headerHtml += '</tr>';
    return headerHtml;
}
function buildMonthModeBody(data, monthColumns, columnKeys, categorySpans) {
    const srNoKey = columnKeys.srNo;
    const categoryKey = columnKeys.category;
    const reasonCodeKey = columnKeys.reasonCode;
    const reasonDespKey = columnKeys.reasonDesp;
    const totalKey = columnKeys.total;
    const averageKey = columnKeys.average;

    let bodyHtml = '';

    data.forEach(function (row, rowIndex) {
        bodyHtml += '<tr>';

        if (categorySpans[rowIndex] > 0) {
            const span = categorySpans[rowIndex];
            bodyHtml += '<td rowspan="' + span + '" class="text-start pbdr-static-col">' +
                (srNoKey ? (row[srNoKey] != null ? row[srNoKey] : '') : '') + '</td>';
            bodyHtml += '<td rowspan="' + span + '" class="pbdr-static-col">' +
                (categoryKey ? (row[categoryKey] != null ? row[categoryKey] : '') : '') + '</td>';
        }

        bodyHtml += '<td class="text-center pbdr-static-col">' +
            (reasonCodeKey ? (row[reasonCodeKey] != null ? row[reasonCodeKey] : '') : '') + '</td>';
        bodyHtml += '<td class="pbdr-static-col">' +
            (reasonDespKey ? (row[reasonDespKey] != null ? row[reasonDespKey] : '') : '') + '</td>';

        monthColumns.forEach(function (item) {
            bodyHtml += '<td class="text-end">' + formatMonthCell(row[item.fqKey], 0) + '</td>';
            bodyHtml += '<td class="text-end">' + formatMonthCell(row[item.downtimeKey], 2) + '</td>';
        });

        if (totalKey) {
            bodyHtml += '<td class="text-end pbdr-summary-col">' + formatMonthCell(row[totalKey], 0) + '</td>';
        }
        if (averageKey) {
            bodyHtml += '<td class="text-end pbdr-summary-col">' + formatMonthCell(row[averageKey], 2) + '</td>';
        }

        bodyHtml += '</tr>';
    });

    return bodyHtml;
}
function buildMonthModeFooter(data, monthColumns, columnKeys) {
    const totalKey = columnKeys.total;
    const totals = { fq: {}, downtime: {}, total: 0 };

    monthColumns.forEach(function (item) {
        totals.fq[item.fqKey] = 0;
        totals.downtime[item.downtimeKey] = 0;
    });

    data.forEach(function (row) {
        monthColumns.forEach(function (item) {
            const fqVal = parseFloat(String(row[item.fqKey] || 0).replace(/,/g, ''));
            const downtimeVal = parseFloat(String(row[item.downtimeKey] || 0).replace(/,/g, ''));
            if (!isNaN(fqVal)) totals.fq[item.fqKey] += fqVal;
            if (!isNaN(downtimeVal)) totals.downtime[item.downtimeKey] += downtimeVal;
        });
        if (totalKey) {
            const totalVal = parseFloat(String(row[totalKey] || 0).replace(/,/g, ''));
            if (!isNaN(totalVal)) totals.total += totalVal;
        }
    });

    let footerHtml = '<tr class="pbdr-month-total-row">';
    footerHtml += '<td colspan="4" class="text-center fw-bold">Total</td>';

    monthColumns.forEach(function (item) {
        footerHtml += '<td class="text-end fw-bold">' + formatMonthCell(totals.fq[item.fqKey], 0) + '</td>';
        footerHtml += '<td class="text-end fw-bold">' + formatMonthCell(totals.downtime[item.downtimeKey], 2) + '</td>';
    });

    if (totalKey) {
        footerHtml += '<td class="text-end fw-bold pbdr-summary-col">' + formatMonthCell(totals.total, 0) + '</td>';
    }
    if (columnKeys.average) {
        footerHtml += '<td class="pbdr-summary-col"></td>';
    }

    footerHtml += '</tr>';
    return footerHtml;
}
function RenderMonthModeGrid(data) {
    const monthColumns = parseMonthPivotColumns(data);
    const columnKeys = {
        srNo: findDataColumn(data, ['S.No', 'SrNo', 'SNo']),
        category: findDataColumn(data, ['Category']),
        reasonCode: findDataColumn(data, ['ReasonCode', 'Reason Code']),
        reasonDesp: findDataColumn(data, ['ReasonDesp', 'Reason Description']),
        total: findDataColumn(data, ['Total']),
        average: findDataColumn(data, ['Average']),
    };
    const categorySpans = getCategoryRowSpans(data, columnKeys.category, columnKeys.srNo);

    $('#tblProductionBreakDown').addClass('pbdr-month-mode');
    $('#table-header').html(buildMonthModeHeader(monthColumns, columnKeys.total, columnKeys.average));
    $('#table-body').html(
        buildMonthModeBody(data, monthColumns, columnKeys, categorySpans) +
        buildMonthModeFooter(data, monthColumns, columnKeys)
    );

    window.filteredData_tblProductionBreakDown = data;
    window.filteredDataTemp_tblProductionBreakDown = data;
    $('#paginator-tblProductionBreakDown').empty().hide();
    $('#btnExportExcel').removeClass('d-none');
    scheduleProductionBreakDownTableHeightAdjust();
    setTimeout(syncMonthModeHeaderStickyOffset, 0);
    setTimeout(syncMonthModeHeaderStickyOffset, 150);
}
function RenderProductionBreakDownGrid(data, mode) {
    $('#table-header').empty();
    $('#table-body').empty();
    $('#paginator-tblProductionBreakDown').empty();
    $('#tblProductionBreakDown').removeClass('pbdr-month-mode');

    if (!data || !data.length) {
        ClearTable();
        return;
    }

    if (isMonthReportMode(mode, data)) {
        RenderMonthModeGrid(data);
        return;
    }

    const opts = buildGridOptions(data);

    BizsolCustomFilterGrid.CreateDataTable(
        'table-header',
        'table-body',
        data,
        false,
        [],
        opts.StringFilterColumn,
        opts.NumericFilterColumn,
        [],
        [],
        opts.hiddenColumns,
        opts.ColumnAlignment,
        true,
        opts.TotalColumns,
        opts.FixedDecimals
    );

    $('#btnExportExcel').removeClass('d-none');
    $('#paginator-tblProductionBreakDown').show();
    scheduleProductionBreakDownTableHeightAdjust();
}
function ClearTable() {
    $('#table-header').empty();
    $('#tblProductionBreakDown').removeClass('pbdr-month-mode');
    $('#table-body').html(
        '<tr><td colspan="100" class="text-center text-muted py-4">' +
        'Select filters and click <strong>Show</strong> to generate the report' +
        '</td></tr>'
    );
    $('#paginator-tblProductionBreakDown').empty().hide();
    $('#btnExportExcel').addClass('d-none');
    currentReportData = [];
    scheduleProductionBreakDownTableHeightAdjust();
}
function normalizeMachineItem(item) {
    if (!item) return null;
    const code = item.Code != null ? item.Code : item.MachineMaster_Code;
    const desp = item.Desp || item.MachineNo || item.MachineDesp || item.Description || '';
    if (code == null || code === '' || !desp) return null;
    return { Code: code, Desp: desp };
}
function mapMachineList(response) {
    return asList(response)
        .map(normalizeMachineItem)
        .filter(function (item) { return item != null; });
}
function fillMachineDropdown(list) {
    const $select = $('#ddlMachineNo');
    $select.empty();
    $select.append(new Option('ALL', '0'));
    list.forEach(function (item) {
        $select.append(new Option(item.Desp, item.Code));
    });
}
function loadMachineListWithFallback() {
    return ProductionBreakDownReportService.GetMachineList()
        .then(function (response) {
            const list = mapMachineList(response);
            if (list.length > 0) return list;
            return MillWiseProductionReport.GetMachineNo().then(mapMachineList);
        })
        .then(function (list) {
            if (list.length > 0) return list;
            return MachineMaintenanceService.GetMachineMasterList().then(mapMachineList);
        });
}
function BindMachineDropdown() {
    Showloader();
    loadMachineListWithFallback()
        .then(function (list) {
            HideLoader();
            fillMachineDropdown(list);
            if (!list.length) {
                toastr.warning('Machine list not available');
            }
        })
        .catch(function (error) {
            HideLoader();
            fillMachineDropdown([]);
            toastr.error(error.Msg || 'Error loading machine list');
        });
}
function GetProductionBreakDownReport() {
    const fromDate = $('#txtFromDate').val();
    if (!fromDate || fromDate.trim() === '') {
        toastr.warning('Please select From Date');
        $('#txtFromDate').focus();
        return;
    }

    const toDate = $('#txtToDate').val();
    if (!toDate || toDate.trim() === '') {
        toastr.warning('Please select To Date');
        $('#txtToDate').focus();
        return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
        toastr.warning('From Date cannot be greater than To Date');
        $('#txtFromDate').focus();
        return;
    }

    const machineCode = $('#ddlMachineNo').val() || 0;
    const mode = $('#ddlMode').val() || 'Day';

    Showloader();
    ProductionBreakDownReportService
        .GetProductionBreakDownReport(fromDate, toDate, machineCode, mode)
        .then(function (response) {
            const data = asList(response);
            HideLoader();
            if (data.length > 0) {
                currentReportData = data;
                RenderProductionBreakDownGrid(data, mode);
            } else {
                ClearTable();
                toastr.error('No Data Found');
            }
        })
        .catch(function (error) {
            HideLoader();
            ClearTable();
            toastr.error(error.Msg || 'Error during Production Break Down Report');
        });
}
function prepareTableCloneForExport(table) {
    const clone = table.cloneNode(true);
    const junkSelectors = [
        '.filter-dropdown',
        '.filter-dropdown-double',
        '.filter-division',
        '.table-filter-arrow',
        '.fa-filter',
        '.toggle-icon',
        '.col-filter-dropdown',
        '.size-filter-dropdown',
        '.col-filter-icon',
        '.size-filter-icon'
    ];

    junkSelectors.forEach(function (sel) {
        clone.querySelectorAll(sel).forEach(function (el) {
            el.remove();
        });
    });

    clone.querySelectorAll('[onclick]').forEach(function (el) {
        el.removeAttribute('onclick');
    });

    clone.querySelectorAll('th').forEach(function (th) {
        const heading = th.querySelector('.filter-table-heading');
        if (heading) {
            th.textContent = heading.textContent.trim();
        }
    });

    clone.querySelectorAll('td, th').forEach(function (cell) {
        if (cell.querySelector('strong, button, i')) {
            cell.textContent = cell.textContent.trim();
        }
    });

    return clone;
}
function buildExportSheetFromData(data) {
    if (!data || !data.length) return null;

    const opts = buildGridOptions(data);
    const columns = Object.keys(data[0]).filter(function (key) {
        return opts.hiddenColumns.indexOf(key) < 0;
    });

    const rows = data.map(function (row) {
        const out = {};
        columns.forEach(function (col) {
            out[col] = row[col];
        });
        return out;
    });

    const totalRow = {};
    columns.forEach(function (col, colIndex) {
        if (colIndex === 0) {
            totalRow[col] = 'Total';
            return;
        }

        if (opts.TotalColumns.indexOf(col) >= 0) {
            let sum = 0;
            data.forEach(function (row) {
                const value = parseFloat(String(row[col] == null ? '' : row[col]).replace(/,/g, ''));
                if (!isNaN(value) && isFinite(value)) {
                    sum += value;
                }
            });

            const decimals = opts.FixedDecimals[col];
            totalRow[col] = decimals != null ? Number(sum.toFixed(decimals)) : sum;
            return;
        }

        totalRow[col] = '';
    });
    rows.push(totalRow);

    return XLSX.utils.json_to_sheet(rows);
}
function ExportExcel() {
    const exportData = window.filteredData_tblProductionBreakDown || currentReportData;
    if (!exportData || exportData.length === 0) {
        toastr.warning('No data available to export');
        return;
    }

    const workbook = XLSX.utils.book_new();
    let worksheet;
    const isMonthMode = $('#tblProductionBreakDown').hasClass('pbdr-month-mode');

    if (isMonthMode) {
        const table = document.getElementById('tblProductionBreakDown');
        if (!table) {
            toastr.warning('No table available to export');
            return;
        }
        worksheet = XLSX.utils.table_to_sheet(prepareTableCloneForExport(table), { raw: true });
    } else {
        worksheet = buildExportSheetFromData(exportData);
        if (!worksheet) {
            toastr.warning('No data available to export');
            return;
        }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'BreakDown Report');
    const fileName = 'ProductionBreakDownReport_' + new Date().toISOString().slice(0, 10) + '.xlsx';
    XLSX.writeFile(workbook, fileName);
    toastr.success('Excel file downloaded successfully');
}

window.ExportExcel = ExportExcel;

$(document).ready(function () {
    InitializeDefaultDates();
    BindMachineDropdown();
    bindProductionBreakDownTableHeightHandlers();
    scheduleProductionBreakDownTableHeightAdjust();

    $('#btnSearch').on('click', function () {
        GetProductionBreakDownReport();
    });

    const urlParams = BizSolHelperFunction.getUrlVars();
    const menuValue = decodeURI(urlParams.ModuleDesp);
    if (menuValue && menuValue !== 'undefined' && menuValue !== '') {
        $('#ERPHeading').text(menuValue);
    } else {
        $('#ERPHeading').text('Production Break Down Report');
    }
});
