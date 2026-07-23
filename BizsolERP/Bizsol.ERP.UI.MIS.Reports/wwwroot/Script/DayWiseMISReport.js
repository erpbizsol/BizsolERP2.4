import { MISReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MISReportsService.js';

let lastReportData = null;
let _pdfExportCompact = false;

const PDF_LAYOUT = {
    marginMm: 4,
    fontSizePx: '7.5px',
    cellPadding: '1px 3px',
    lineHeight: '1.08',
    minRowPx: 7
};

$(document).ready(function () {
    $("#ERPHeading").text("MIS Report");
    var today = new Date();
    $('#txtDate').val(today.toISOString().split('T')[0]);

    $('#txtDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $('#btnShow').trigger('click');
        }
    });

    // Auto-load data whenever the date changes
    $('#txtDate').on('change', function () {
        $('#btnShow').trigger('click');
    });

    $('#btnShow').click(function () {
        $(this).prop('hidden', true);
        $('#btnLoading').prop('hidden', false);
        GetReportData();
    });

    $('#btnDownload').click(function (e) {
        e.stopPropagation();
        $('#downloadMenu').toggle();
    });

    $('#downloadMenu').click(function (e) {
        e.stopPropagation();
    });

    $('#btnDownloadExcel').click(function () {
        $('#downloadMenu').hide();
        ExportExcel();
    });

    $('#btnDownloadPdf').click(function () {
        $('#downloadMenu').hide();
        ExportPdf();
    });

    $(document).on('click', function () {
        $('#downloadMenu').hide();
    });

    // Auto-load the report for today's date on page load
    $('#btnShow').trigger('click');
});

function convertDateFormat(dateString) {
    // Input: YYYY-MM-DD, Output: DD-Mon-YYYY
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day}-${monthNames[parseInt(month) - 1]}-${year}`;
}

function GetReportData() {
    const dateVal = $('#txtDate').val();

    if (!dateVal) {
        toastr.warning("Please select a Date.");
        $('#btnShow').prop('hidden', false);
        $('#btnLoading').prop('hidden', true);
        return;
    }

    const formattedDate = convertDateFormat(dateVal);

    MISReportsServices.GetDayWiseMISReports(formattedDate).then(function (response) {
        $('#btnShow').prop('hidden', false);
        $('#btnLoading').prop('hidden', true);

        if (!response) {
            toastr.error("No response from server.");
            return;
        }

        $('#divReportSections').show();

        const MRNReceive    = response.MRNReceive    || [];
        const ProductionData = response.ProductionData || [];
        const DispatchSales  = response.DispatchSales  || [];
        const SlittingData   = response.SlittingData   || response.SlittingDate || [];

        // Keep last data for PDF / export
        lastReportData = {
            MRNReceive: MRNReceive,
            ProductionData: ProductionData,
            DispatchSales: DispatchSales,
            SlittingData: SlittingData
        };

        RenderSection('tblMRNReceive-header', 'tblMRNReceive-body', 'noMRN', MRNReceive);
        RenderGroupedSection('tblProduction-header', 'tblProduction-body', 'noProduction', ProductionData, 'Machine');
        RenderSection('tblDispatch-header', 'tblDispatch-body', 'noDispatch', DispatchSales);
        RenderSlittingSection('tblSlitting', 'noSlitting', SlittingData);

    }).catch(function (error) {
        $('#btnShow').prop('hidden', false);
        $('#btnLoading').prop('hidden', true);
        console.error('Error fetching MIS report:', error);
        toastr.error("Error fetching report data.");
    });
}

function isDateString(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value);
}

function isNumericValue(value) {
    if (value === null || value === undefined || value === '') return false;
    if (isDateString(value)) return false;
    return !isNaN(parseFloat(value)) && isFinite(value);
}

function normalizeColName(key) {
    return String(key || '').toLowerCase().replace(/[\s._%]/g, '');
}

function isYieldColumn(key) {
    const k = normalizeColName(key);
    return k === 'yield' || k === 'yieldpct' || k === 'yieldpercent' || k === 'yeild' || k === 'yeildpct';
}

function formatYieldPct(value) {
    if (value === null || value === undefined || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toFixed(2);
}

function sortMillNames(order) {
    return order.slice().sort(function (a, b) {
        const na = parseInt(String(a).replace(/\D/g, ''), 10);
        const nb = parseInt(String(b).replace(/\D/g, ''), 10);
        if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
        return String(a).localeCompare(String(b));
    });
}

// Determine which columns hold numeric values (every non-empty value is numeric)
function getNumericColumns(data, headers) {
    const numeric = {};
    headers.forEach(function (key) {
        let hasValue = false;
        let allNumeric = true;
        for (let i = 0; i < data.length; i++) {
            const v = data[i][key];
            if (v === null || v === undefined || v === '') continue;
            hasValue = true;
            if (!isNumericValue(v)) {
                allNumeric = false;
                break;
            }
        }
        numeric[key] = hasValue && allNumeric;
    });
    return numeric;
}

function formatCellValue(value, key) {
    if (value === null || value === undefined) return '';

    if (isYieldColumn(key)) {
        return formatYieldPct(value);
    }

    // Round Weight / Qty MT columns to 3 decimal places
    if (key) {
        const k = key.toLowerCase();
        if (k.indexOf('weight') !== -1 || k.replace(/[\s.]/g, '') === 'qtymt') {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                return num.toFixed(3);
            }
        }
    }

    const str = String(value);
    // Strip time portion from ISO date strings e.g. "2026-04-30T00:00:00" → "2026-04-30"
    if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
        return str.split('T')[0];
    }
    return str;
}

function formatTotalValue(key, sum) {
    if (isYieldColumn(key)) {
        return '';
    }
    const k = String(key || '').toLowerCase();
    // Weight / Qty MT totals keep 3 decimals
    if (k.indexOf('weight') !== -1 || k.replace(/[\s.]/g, '') === 'qtymt') {
        return Number(sum).toFixed(3);
    }
    // Integer-only sums stay integer, otherwise show 2 decimals
    return Number.isInteger(sum) ? String(sum) : Number(sum).toFixed(2);
}

function isSerialColumn(key) {
    const k = key.toLowerCase().replace(/[\s.]/g, '');
    return k === 'sno' || k === 'srno' || k === 'serialno' || k === 'slno';
}

function makeAlignChecker(numericCols) {
    return function (key) {
        return numericCols[key] && !isSerialColumn(key);
    };
}

function makeTotalChecker(numericCols) {
    return function (key) {
        if (!numericCols[key]) return false;
        // Yield% is derived from totals — never sum the % values
        if (isYieldColumn(key)) return false;
        const k = key.toLowerCase().replace(/[\s.]/g, '');
        if (k.indexOf('code') !== -1) return false;
        if (isSerialColumn(key)) return false;
        return true;
    };
}

function buildTotalRowCells(displayCols, totals, isTotalable, isRightAligned, labelText, bgColor) {
    let labelPlaced = false;

    return displayCols.map(function (key) {
        const td = document.createElement('td');
        td.style.fontWeight = 'bold';
        td.style.backgroundColor = bgColor || '#f1f3f5';

        if (isYieldColumn(key)) {
            td.textContent = '';
        } else if (isTotalable(key)) {
            td.textContent = formatTotalValue(key, totals[key] || 0);
            if (isRightAligned(key)) td.style.textAlign = 'right';
        } else if (!labelPlaced) {
            td.textContent = labelText;
            labelPlaced = true;
        } else {
            td.textContent = '';
        }
        return td;
    });
}

function buildTotalExportCells(displayCols, totals, isTotalable, labelText) {
    let labelPlaced = false;

    return displayCols.map(function (k) {
        if (isYieldColumn(k)) {
            return cell('', { type: 'total' });
        }
        if (isTotalable(k)) {
            return cell(formatTotalValue(k, totals[k] || 0), { type: 'total', bold: true, align: 'right' });
        }
        if (!labelPlaced) {
            labelPlaced = true;
            return cell(labelText, { type: 'total', bold: true });
        }
        return cell('', { type: 'total' });
    });
}

function RenderSection(headerId, bodyId, noDataId, data) {
    const $header = $('#' + headerId);
    const $body = $('#' + bodyId);
    const $noData = $('#' + noDataId);
    const $table = $header.closest('table');

    $header.empty();
    $body.empty();
    $table.find('tfoot').remove();

    if (!data || data.length === 0) {
        $table.hide();
        $noData.show();
        return;
    }

    $noData.hide();
    $table.show();

    const headers = Object.keys(data[0]);
    const numericCols = getNumericColumns(data, headers);
    const isSerialColumn = function (key) {
        const k = key.toLowerCase().replace(/[\s.]/g, '');
        return k === 'sno' || k === 'srno' || k === 'serialno' || k === 'slno';
    };
    // Serial-number columns keep default (left) alignment
    const isRightAligned = function (key) {
        return numericCols[key] && !isSerialColumn(key);
    };
    // Identifier-like columns are excluded from totals
    const isTotalable = function (key) {
        if (!numericCols[key]) return false;
        const k = key.toLowerCase().replace(/[\s.]/g, '');
        if (k.indexOf('code') !== -1) return false;
        if (isSerialColumn(key)) return false;
        return true;
    };

    // Build header (headers stay default/left aligned)
    headers.forEach(function (key) {
        const th = document.createElement('th');
        th.textContent = key;
        $header[0].appendChild(th);
    });

    // Build rows + accumulate totals
    const totals = {};
    headers.forEach(function (key) { if (isTotalable(key)) totals[key] = 0; });

    data.forEach(function (item) {
        const tr = document.createElement('tr');
        headers.forEach(function (key) {
            const td = document.createElement('td');
            td.textContent = formatCellValue(item[key], key);
            if (isRightAligned(key)) td.style.textAlign = 'right';
            tr.appendChild(td);
            if (isTotalable(key)) {
                const num = parseFloat(item[key]);
                if (!isNaN(num)) totals[key] += num;
            }
        });
        $body[0].appendChild(tr);
    });

    // Build totals footer row
    const hasTotals = Object.keys(totals).length > 0;
    if (hasTotals) {
        const tfoot = document.createElement('tfoot');
        const tr = document.createElement('tr');
        let labelPlaced = false;
        headers.forEach(function (key, idx) {
            const td = document.createElement('td');
            td.style.fontWeight = 'bold';
            if (isTotalable(key)) {
                td.textContent = formatTotalValue(key, totals[key]);
                if (isRightAligned(key)) td.style.textAlign = 'right';
            } else if (!labelPlaced) {
                td.textContent = 'Total';
                labelPlaced = true;
            } else {
                td.textContent = '';
            }
            tr.appendChild(td);
        });
        tfoot.appendChild(tr);
        tfoot.style.backgroundColor = '#f1f3f5';
        $table[0].appendChild(tfoot);
    }
}

// Renders a section grouped by a column (e.g. Machine), with a column header
// band and a subtotal row per group — like the A-1 / A-2 / A-3 layout.
function RenderGroupedSection(headerId, bodyId, noDataId, data, groupKeyName) {
    const $header = $('#' + headerId);
    const $body = $('#' + bodyId);
    const $noData = $('#' + noDataId);
    const $table = $header.closest('table');

    $header.empty();
    $body.empty();
    $table.find('tfoot').remove();

    if (!data || data.length === 0) {
        $table.hide();
        $noData.show();
        return;
    }

    $noData.hide();
    $table.show();

    const allHeaders = Object.keys(data[0]);
    const groupKey = allHeaders.find(function (h) {
        return h.toLowerCase() === groupKeyName.toLowerCase();
    });

    // If group column is missing, fall back to the standard renderer
    if (!groupKey) {
        RenderSection(headerId, bodyId, noDataId, data);
        return;
    }

    // Columns to display: drop the group column, identifier (code) and date columns
    const displayCols = allHeaders.filter(function (h) {
        if (h === groupKey) return false;
        if (h.toLowerCase().indexOf('code') !== -1) return false;
        if (data.some(function (r) { return isDateString(r[h]); })) return false;
        return true;
    });

    const numericCols = getNumericColumns(data, displayCols);
    const isRightAligned = makeAlignChecker(numericCols);
    const isTotalable = makeTotalChecker(numericCols);

    // Group rows preserving first-seen order; sort mills MILL-1, MILL-2, MILL-3...
    const groups = {};
    const order = [];
    data.forEach(function (r) {
        const g = (r[groupKey] === null || r[groupKey] === undefined) ? '' : r[groupKey];
        if (!groups[g]) { groups[g] = []; order.push(g); }
        groups[g].push(r);
    });
    const sortedOrder = sortMillNames(order);

    const colCount = displayCols.length;
    const grandTotals = {};
    displayCols.forEach(function (key) { if (isTotalable(key)) grandTotals[key] = 0; });

    sortedOrder.forEach(function (machine, machineIndex) {
        const rows = groups[machine];
        const isLastMill = machineIndex === sortedOrder.length - 1;

        // Group band row showing the machine name
        const bandTr = document.createElement('tr');
        const bandTd = document.createElement('td');
        bandTd.colSpan = colCount;
        bandTd.textContent = machine;
        bandTd.style.fontWeight = 'bold';
        bandTd.style.backgroundColor = '#343a40';
        bandTd.style.color = '#fff';
        bandTr.appendChild(bandTd);
        $body[0].appendChild(bandTr);

        // Column header row for this group
        const headTr = document.createElement('tr');
        displayCols.forEach(function (key) {
            const th = document.createElement('th');
            th.textContent = key;
            th.style.backgroundColor = '#1f4e8c';
            th.style.color = '#fff';
            headTr.appendChild(th);
        });
        $body[0].appendChild(headTr);

        // Data rows + subtotal accumulation
        const totals = {};
        displayCols.forEach(function (key) { if (isTotalable(key)) totals[key] = 0; });

        rows.forEach(function (item) {
            const tr = document.createElement('tr');
            displayCols.forEach(function (key) {
                const td = document.createElement('td');
                td.textContent = formatCellValue(item[key], key);
                if (isRightAligned(key) || isYieldColumn(key)) td.style.textAlign = 'right';
                tr.appendChild(td);
                if (isTotalable(key)) {
                    const num = parseFloat(item[key]);
                    if (!isNaN(num)) {
                        totals[key] += num;
                        grandTotals[key] += num;
                    }
                }
            });

            $body[0].appendChild(tr);
        });

        const totalTr = document.createElement('tr');
        buildTotalRowCells(displayCols, totals, isTotalable, isRightAligned, 'Total', '#f1f3f5')
            .forEach(function (td) { totalTr.appendChild(td); });
        $body[0].appendChild(totalTr);

        if (isLastMill && Object.keys(grandTotals).length > 0) {
            const grandTr = document.createElement('tr');
            buildTotalRowCells(displayCols, grandTotals, isTotalable, isRightAligned, 'Grand Total', '#dde5f0')
                .forEach(function (td) { grandTr.appendChild(td); });
            $body[0].appendChild(grandTr);
        }
    });
}

function findDataColumn(data, candidates) {
    if (!data || !data.length) return null;
    const keys = Object.keys(data[0]);
    for (let i = 0; i < candidates.length; i++) {
        const found = keys.find(function (k) {
            return k.toLowerCase() === candidates[i].toLowerCase();
        });
        if (found) return found;
    }
    return null;
}

function normalizeWeightType(value) {
    return String(value || '').trim().toLowerCase();
}

function slittingIssueColumnLabel(key, shiftKey, sizeKey, weightKey) {
    if (key === shiftKey) return 'Shift';
    if (key === sizeKey) return 'Size Desp';
    if (key === weightKey) return 'Weight MT';
    return key;
}

// Slitting: one Issue row per Code, many Receive rows — issue/receive side-by-side layout.
function RenderSlittingSection(tableId, noDataId, data) {
    const $table = $('#' + tableId);
    const $thead = $('#' + tableId + '-thead');
    const $body = $('#' + tableId + '-body');
    const $noData = $('#' + noDataId);

    $thead.empty();
    $body.empty();
    $table.find('tfoot').remove();

    if (!data || data.length === 0) {
        $table.hide();
        $noData.show();
        return;
    }

    const codeKey = findDataColumn(data, ['Code']);
    const shiftKey = findDataColumn(data, ['ShiftName', 'Shift']);
    const sizeKey = findDataColumn(data, ['SizeDesp', 'Size Desp', 'SizeDescription']);
    const typeKey = findDataColumn(data, ['WeightType', 'Type']);
    const weightKey = findDataColumn(data, ['WeightMT', 'WeightMT.', 'Weight MT', 'Weight']);
    const slitsKey = findDataColumn(data, ['NoOfSlits', 'NoOfSlit', 'NoofSlits', 'NoOfSlitting', 'Slits', 'No Of Slits']);

    // Fall back to flat table when the API does not send issue/receive rows
    if (!codeKey || !typeKey || !weightKey) {
        $table.removeClass('mis-slitting-table');
        const tr = document.createElement('tr');
        tr.id = tableId + '-fallback-header';
        $thead.empty().append(tr);
        RenderSection(tr.id, tableId + '-body', noDataId, data);
        return;
    }

    $table.addClass('mis-slitting-table');
    $noData.hide();
    $table.show();

    // Code is used for grouping only — not shown in the grid
    const issueCols = [shiftKey, sizeKey, weightKey].filter(Boolean);
    const receiveCols = 3;

    // Header band: Issue | Receive
    const bandTr = document.createElement('tr');
    const issueBand = document.createElement('th');
    issueBand.colSpan = issueCols.length;
    issueBand.textContent = 'Issue';
    issueBand.className = 'mis-slit-band-issue';
    bandTr.appendChild(issueBand);

    const receiveBand = document.createElement('th');
    receiveBand.colSpan = receiveCols;
    receiveBand.textContent = 'Receive';
    receiveBand.className = 'mis-slit-band-receive';
    bandTr.appendChild(receiveBand);
    $thead[0].appendChild(bandTr);

    // Sub-header row
    const subTr = document.createElement('tr');
    subTr.className = 'mis-slit-subhead';
    issueCols.forEach(function (key) {
        const th = document.createElement('th');
        th.textContent = slittingIssueColumnLabel(key, shiftKey, sizeKey, weightKey);
        subTr.appendChild(th);
    });
    ['Weight MT', 'No Of Slits', 'Size Desp'].forEach(function (label) {
        const th = document.createElement('th');
        th.className = 'mis-slit-subhead-receive';
        th.textContent = label;
        subTr.appendChild(th);
    });
    $thead[0].appendChild(subTr);

    // Group rows by Code preserving order
    const groups = {};
    const order = [];
    data.forEach(function (row) {
        const code = row[codeKey];
        if (!groups[code]) {
            groups[code] = [];
            order.push(code);
        }
        groups[code].push(row);
    });

    let totalIssueWeight = 0;
    let totalReceiveWeight = 0;

    order.forEach(function (code) {
        const rows = groups[code];
        const issueRow = rows.find(function (r) {
            return normalizeWeightType(r[typeKey]) === 'issue';
        });
        const receiveRows = rows.filter(function (r) {
            return normalizeWeightType(r[typeKey]) === 'receive';
        });

        const displayRows = receiveRows.length > 0 ? receiveRows : [null];
        const rowSpan = displayRows.length;

        displayRows.forEach(function (receiveRow, idx) {
            const tr = document.createElement('tr');
            if (idx === 0) tr.className = 'mis-slit-group-start';

            if (idx === 0) {
                issueCols.forEach(function (key) {
                    const td = document.createElement('td');
                    td.rowSpan = rowSpan;
                    td.className = 'mis-slit-issue-col' + (key === sizeKey ? ' mis-slit-size' : '');
                    if (key === weightKey) {
                        td.textContent = formatCellValue(issueRow ? issueRow[key] : '', key);
                        td.style.textAlign = 'right';
                        const n = parseFloat(issueRow ? issueRow[key] : '');
                        if (!isNaN(n)) totalIssueWeight += n;
                    } else {
                        td.textContent = formatCellValue(issueRow ? issueRow[key] : '', key);
                    }
                    tr.appendChild(td);
                });
            }

            const wtTd = document.createElement('td');
            wtTd.className = 'mis-slit-receive-col';
            wtTd.style.textAlign = 'right';
            wtTd.textContent = receiveRow ? formatCellValue(receiveRow[weightKey], weightKey) : '';
            tr.appendChild(wtTd);

            const slitsTd = document.createElement('td');
            slitsTd.className = 'mis-slit-receive-col';
            slitsTd.style.textAlign = 'right';
            slitsTd.textContent = receiveRow && slitsKey ? formatCellValue(receiveRow[slitsKey], slitsKey) : '';
            tr.appendChild(slitsTd);

            const sizeTd = document.createElement('td');
            sizeTd.className = 'mis-slit-receive-col mis-slit-size';
            sizeTd.textContent = receiveRow && sizeKey ? formatCellValue(receiveRow[sizeKey], sizeKey) : '';
            tr.appendChild(sizeTd);

            if (receiveRow) {
                const n = parseFloat(receiveRow[weightKey]);
                if (!isNaN(n)) totalReceiveWeight += n;
            }

            $body[0].appendChild(tr);
        });
    });

    // Footer totals
    const tfoot = document.createElement('tfoot');
    const totalTr = document.createElement('tr');
    let labelPlaced = false;

    issueCols.forEach(function (key) {
        const td = document.createElement('td');
        td.style.fontWeight = 'bold';
        td.style.backgroundColor = '#f1f3f5';
        if (key === weightKey) {
            td.textContent = formatTotalValue(key, totalIssueWeight);
            td.style.textAlign = 'right';
        } else if (!labelPlaced) {
            td.textContent = 'Total';
            labelPlaced = true;
        } else {
            td.textContent = '';
        }
        totalTr.appendChild(td);
    });

    const recvWtTd = document.createElement('td');
    recvWtTd.style.fontWeight = 'bold';
    recvWtTd.style.backgroundColor = '#f1f3f5';
    recvWtTd.style.textAlign = 'right';
    recvWtTd.textContent = formatTotalValue(weightKey, totalReceiveWeight);
    totalTr.appendChild(recvWtTd);

    const recvSlitsTd = document.createElement('td');
    recvSlitsTd.style.backgroundColor = '#f1f3f5';
    totalTr.appendChild(recvSlitsTd);

    const recvSizeTd = document.createElement('td');
    recvSizeTd.style.backgroundColor = '#f1f3f5';
    totalTr.appendChild(recvSizeTd);

    tfoot.appendChild(totalTr);
    $table[0].appendChild(tfoot);
}

// Build slitting block for Excel export (issue / receive side-by-side per Code).
function buildSlittingBlock(title, data) {
    if (!data || data.length === 0) {
        return { rows: [[cell(title, { type: 'title', bold: true })], [cell('No data')]], cols: 1 };
    }

    const codeKey = findDataColumn(data, ['Code']);
    const shiftKey = findDataColumn(data, ['ShiftName', 'Shift']);
    const sizeKey = findDataColumn(data, ['SizeDesp', 'Size Desp', 'SizeDescription']);
    const typeKey = findDataColumn(data, ['WeightType', 'Type']);
    const weightKey = findDataColumn(data, ['WeightMT', 'WeightMT.', 'Weight MT', 'Weight']);
    const slitsKey = findDataColumn(data, ['NoOfSlits', 'NoOfSlit', 'NoofSlits', 'NoOfSlitting', 'Slits', 'No Of Slits']);

    if (!codeKey || !typeKey || !weightKey) {
        return buildFlatBlock(title, data);
    }

    const issueCols = [shiftKey, sizeKey, weightKey].filter(Boolean);
    const cols = issueCols.length + 3;
    const rows = [];

    rows.push(tagExportRow([cell(title, { type: 'title', bold: true, align: 'center', colspan: cols })], 'sectionTitle'));

    const bandRow = [
        cell('Issue', { type: 'slitBandIssue', bold: true, align: 'center', colspan: issueCols.length }),
        cell('Receive', { type: 'slitBandReceive', bold: true, align: 'center', colspan: 3 })
    ];
    rows.push(tagExportRow(bandRow, 'slitBand', { repeat: true }));

    const subRow = issueCols.map(function (k) {
        const label = slittingIssueColumnLabel(k, shiftKey, sizeKey, weightKey);
        return cell(label, { type: 'slitHeadIssue', bold: true, align: 'center' });
    }).concat([
        cell('Weight MT', { type: 'slitHeadReceive', bold: true, align: 'center' }),
        cell('No Of Slits', { type: 'slitHeadReceive', bold: true, align: 'center' }),
        cell('Size Desp', { type: 'slitHeadReceive', bold: true, align: 'center' })
    ]);
    rows.push(tagExportRow(subRow, 'slitSubHead', { repeat: true }));

    const groups = {};
    const order = [];
    data.forEach(function (row) {
        const code = row[codeKey];
        if (!groups[code]) {
            groups[code] = [];
            order.push(code);
        }
        groups[code].push(row);
    });

    let totalIssueWeight = 0;
    let totalReceiveWeight = 0;

    order.forEach(function (code) {
        const groupRows = groups[code];
        const issueRow = groupRows.find(function (r) {
            return normalizeWeightType(r[typeKey]) === 'issue';
        });
        const receiveRows = groupRows.filter(function (r) {
            return normalizeWeightType(r[typeKey]) === 'receive';
        });
        const displayRows = receiveRows.length > 0 ? receiveRows : [null];
        const rowSpan = displayRows.length;

        displayRows.forEach(function (receiveRow, idx) {
            const row = [];

            // Issue columns — rowspan on first receive row only (matches on-screen table)
            if (idx === 0) {
                issueCols.forEach(function (key) {
                    const isWeight = key === weightKey;
                    const isSize = key === sizeKey;
                    const c = cell(formatCellValue(issueRow ? issueRow[key] : '', key), {
                        type: 'slitIssueCol',
                        align: isWeight ? 'right' : 'left',
                        valign: 'middle',
                        wrap: isSize,
                        rowspan: rowSpan > 1 ? rowSpan : undefined,
                        groupStart: true
                    });
                    if (isWeight) {
                        const n = parseFloat(issueRow ? issueRow[key] : '');
                        if (!isNaN(n)) totalIssueWeight += n;
                    }
                    row.push(c);
                });
            } else {
                row._skipPad = true;
            }

            if (receiveRow) {
                const n = parseFloat(receiveRow[weightKey]);
                if (!isNaN(n)) totalReceiveWeight += n;
            }

            row.push(cell(receiveRow ? formatCellValue(receiveRow[weightKey], weightKey) : '', {
                align: 'right', valign: 'middle', groupStart: idx === 0
            }));
            row.push(cell(receiveRow && slitsKey ? formatCellValue(receiveRow[slitsKey], slitsKey) : '', {
                align: 'right', valign: 'middle', groupStart: idx === 0
            }));
            row.push(cell(receiveRow && sizeKey ? formatCellValue(receiveRow[sizeKey], sizeKey) : '', {
                valign: 'middle', wrap: true, groupStart: idx === 0
            }));

            if (idx > 0) row._skipPad = true;
            tagExportRow(row, 'data', { slittingGroup: String(code) });
            rows.push(row);
        });
    });

    let labelPlaced = false;
    const totalRow = issueCols.map(function (key) {
        if (key === weightKey) {
            return cell(formatTotalValue(key, totalIssueWeight), { type: 'total', bold: true, align: 'right' });
        }
        if (!labelPlaced) {
            labelPlaced = true;
            return cell('Total', { type: 'total', bold: true });
        }
        return cell('', { type: 'total' });
    }).concat([
        cell(formatTotalValue(weightKey, totalReceiveWeight), { type: 'total', bold: true, align: 'right' }),
        cell('', { type: 'total' }),
        cell('', { type: 'total' })
    ]);
    rows.push(tagExportRow(totalRow, 'total'));

    rows.forEach(function (row) { row._exportCols = cols; });
    return { rows: rows, cols: cols };
}

/* =====================================================================
   COMBINED EXCEL EXPORT  (2x2 quadrant layout matching MIS template)
   Receiving | Production
   Dispatch  | Slitting
   ===================================================================== */

// Excel cell style palette (inline styles are preserved by table2excel)
const XL = {
    title:  { bg: '#1f4e8c', color: '#ffffff' },
    band:   { bg: '#4a5568', color: '#ffffff' },
    header: { bg: '#d9e0ee', color: '#1f2937' },
    total:  { bg: '#fde9c8', color: '#1f2937' },
    slitBandIssue:   { bg: '#2c5282', color: '#ffffff' },
    slitBandReceive: { bg: '#276749', color: '#ffffff' },
    slitHeadIssue:   { bg: '#3d5a80', color: '#ffffff' },
    slitHeadReceive: { bg: '#2f6b4f', color: '#ffffff' },
    slitIssueCol:    { bg: '#f0f4fa', color: '#1f2937' },
};

function cell(text, opts) {
    return Object.assign({ text: (text === null || text === undefined) ? '' : text }, opts || {});
}

function tagExportRow(row, type, opts) {
    row._exportType = type;
    if (opts) {
        if (opts.group) row._exportGroup = String(opts.group);
        if (opts.slittingGroup) row._exportSlittingGroup = String(opts.slittingGroup);
        if (opts.repeat) row._exportRepeat = true;
    }
    return row;
}

function applyExportRowMeta(tr, row) {
    if (!Array.isArray(row)) return;
    tr.setAttribute('data-export-cols', String(row._exportCols || rowWidth(row)));
    if (!row._exportType) return;
    tr.setAttribute('data-export-type', row._exportType);
    if (row._exportGroup) tr.setAttribute('data-export-group', row._exportGroup);
    if (row._exportSlittingGroup) tr.setAttribute('data-export-slitting-group', row._exportSlittingGroup);
    if (row._exportRepeat) tr.setAttribute('data-export-repeat', '1');
}

// Logical column width of a row (accounts for colspan).
function rowWidth(row) {
    return row.reduce(function (s, c) { return s + (c.colspan || 1); }, 0);
}

// Pad a row to occupy exactly `cols` logical columns with blank cells.
function padRowToWidth(row, cols) {
    const out = row.slice();
    let w = rowWidth(out);
    while (w < cols) { out.push(cell('')); w++; }
    return out;
}

// Build a cell grid for a flat section (title, header, data, total) —
// every row has exactly `cols` cells (no colspan, so columns align in Excel).
function buildFlatBlock(title, data) {
    if (!data || data.length === 0) {
        return { rows: [[cell(title, { type: 'title', bold: true })], [cell('No data')]], cols: 1 };
    }

    const headers = Object.keys(data[0]).filter(function (h) {
        if (h.toLowerCase().indexOf('code') !== -1) return false;
        if (data.some(function (r) { return isDateString(r[h]); })) return false;
        return true;
    });

    const numericCols = getNumericColumns(data, headers);
    const isRightAligned = makeAlignChecker(numericCols);
    const isTotalable = makeTotalChecker(numericCols);

    const cols = headers.length;
    const rows = [];

    rows.push(tagExportRow([cell(title, { type: 'title', bold: true, align: 'center', colspan: cols })], 'sectionTitle'));
    rows.push(tagExportRow(headers.map(function (k) { return cell(k, { type: 'header', bold: true }); }), 'columnHeader', { repeat: true }));

    const totals = {};
    headers.forEach(function (k) { if (isTotalable(k)) totals[k] = 0; });

    data.forEach(function (item) {
        rows.push(tagExportRow(headers.map(function (k) {
            if (isTotalable(k)) {
                const n = parseFloat(item[k]);
                if (!isNaN(n)) totals[k] += n;
            }
            return cell(formatCellValue(item[k], k), { align: isRightAligned(k) ? 'right' : 'left' });
        }), 'data'));
    });

    if (Object.keys(totals).length > 0) {
        let labelPlaced = false;
        rows.push(tagExportRow(headers.map(function (k) {
            if (isTotalable(k)) return cell(formatTotalValue(k, totals[k]), { type: 'total', bold: true, align: 'right' });
            if (!labelPlaced) { labelPlaced = true; return cell('Total', { type: 'total', bold: true }); }
            return cell('', { type: 'total' });
        }), 'total'));
    }

    return { rows: rows, cols: cols };
}

// Build a grouped (by Machine) cell grid for the Production section.
function buildGroupedBlock(title, data, groupKeyName) {
    if (!data || data.length === 0) {
        return { rows: [[cell(title, { type: 'title', bold: true })], [cell('No data')]], cols: 1 };
    }

    const allHeaders = Object.keys(data[0]);
    const groupKey = allHeaders.find(function (h) { return h.toLowerCase() === groupKeyName.toLowerCase(); });
    if (!groupKey) return buildFlatBlock(title, data);

    const displayCols = allHeaders.filter(function (h) {
        if (h === groupKey) return false;
        if (h.toLowerCase().indexOf('code') !== -1) return false;
        if (data.some(function (r) { return isDateString(r[h]); })) return false;
        return true;
    });

    const numericCols = getNumericColumns(data, displayCols);
    const isRightAligned = makeAlignChecker(numericCols);
    const isTotalable = makeTotalChecker(numericCols);

    const groups = {};
    const order = [];
    data.forEach(function (r) {
        const g = (r[groupKey] === null || r[groupKey] === undefined) ? '' : r[groupKey];
        if (!groups[g]) { groups[g] = []; order.push(g); }
        groups[g].push(r);
    });
    const sortedOrder = sortMillNames(order);

    const cols = displayCols.length;
    const rows = [];
    const grandTotals = {};
    displayCols.forEach(function (k) { if (isTotalable(k)) grandTotals[k] = 0; });
    rows.push(tagExportRow([cell(title, { type: 'title', bold: true, align: 'center', colspan: cols })], 'sectionTitle'));

    sortedOrder.forEach(function (machine, machineIndex) {
        const isLastMill = machineIndex === sortedOrder.length - 1;
        rows.push(tagExportRow([cell(machine, { type: 'band', bold: true, align: 'center', colspan: cols })], 'groupBand', { group: machine }));
        rows.push(tagExportRow(displayCols.map(function (k) { return cell(k, { type: 'header', bold: true }); }), 'columnHeader', { group: machine, repeat: true }));

        const totals = {};
        displayCols.forEach(function (k) { if (isTotalable(k)) totals[k] = 0; });

        groups[machine].forEach(function (item) {
            rows.push(tagExportRow(displayCols.map(function (k) {
                if (isTotalable(k)) {
                    const n = parseFloat(item[k]);
                    if (!isNaN(n)) {
                        totals[k] += n;
                        grandTotals[k] += n;
                    }
                }
                return cell(formatCellValue(item[k], k), { align: (isRightAligned(k) || isYieldColumn(k)) ? 'right' : 'left' });
            }), 'data', { group: machine }));
        });

        rows.push(tagExportRow(buildTotalExportCells(displayCols, totals, isTotalable, 'Total'), 'total', { group: machine }));

        if (isLastMill && Object.keys(grandTotals).length > 0) {
            rows.push(tagExportRow(buildTotalExportCells(displayCols, grandTotals, isTotalable, 'Grand Total'), 'grandTotal'));
        }
    });

    return { rows: rows, cols: cols };
}

// Place two blocks side-by-side with a 1-column gap.
function combineSideBySide(leftBlock, rightBlock) {
    const leftCols = leftBlock.cols;
    const rightCols = rightBlock.cols;
    const maxRows = Math.max(leftBlock.rows.length, rightBlock.rows.length);
    const combined = [];

    for (let i = 0; i < maxRows; i++) {
        const leftRow = padRowToWidth(leftBlock.rows[i] || [], leftCols);
        const rawRight = rightBlock.rows[i] || [];
        const rightRow = rawRight._skipPad ? rawRight : padRowToWidth(rawRight, rightCols);
        combined.push(leftRow.concat([cell('', { spacer: true })]).concat(rightRow));
    }
    return combined;
}

function styleCell(td, cell) {
    const compact = _pdfExportCompact;
    td.style.border = '1px solid #b9c0cf';
    td.style.padding = compact ? PDF_LAYOUT.cellPadding : '3px 7px';
    td.style.fontSize = compact ? PDF_LAYOUT.fontSizePx : '11px';
    td.style.lineHeight = compact ? PDF_LAYOUT.lineHeight : 'normal';
    if (cell.bold) td.style.fontWeight = 'bold';
    if (cell.align) td.style.textAlign = cell.align;
    if (cell.valign) td.style.verticalAlign = compact ? 'top' : cell.valign;

    const palette = cell.type && XL[cell.type];
    if (palette) {
        td.style.backgroundColor = palette.bg;
        td.style.color = palette.color;
    }

    if (cell.type === 'slitHeadIssue' || cell.type === 'slitHeadReceive') {
        td.style.whiteSpace = 'normal';
        td.style.wordBreak = 'keep-all';
        td.style.textAlign = 'center';
        td.style.verticalAlign = 'middle';
    }

    if (cell.type === 'slitIssueCol') {
        td.style.borderRight = '2px solid #c8d2e8';
    }

    if (cell.groupStart) {
        td.style.borderTop = '2px solid #c8d2e8';
    }

    if (cell.wrap) {
        td.style.whiteSpace = 'normal';
        td.style.wordBreak = 'break-word';
        td.style.minWidth = compact ? '80px' : '140px';
        td.style.maxWidth = compact ? 'none' : '280px';
    }

    // Column headers: wrap only at spaces (never break words mid-character), centered
    if (cell.type === 'header') {
        td.style.whiteSpace = 'normal';
        td.style.wordBreak = 'keep-all';
        td.style.textAlign = 'center';
        td.style.verticalAlign = 'middle';
    }

    if (cell.spacer) {
        td.style.border = 'none';
        td.style.backgroundColor = '#ffffff';
        td.style.width = '24px';
    }
}

function renderCellGridToTable($tbody, gridRows) {
    gridRows.forEach(function (row) {
        const tr = document.createElement('tr');
        applyExportRowMeta(tr, row);
        row.forEach(function (c) {
            const td = document.createElement('td');
            td.textContent = c.text;
            if (c.colspan && c.colspan > 1) {
                td.colSpan = c.colspan;
                td.setAttribute('colspan', c.colspan);
            }
            if (c.rowspan && c.rowspan > 1) {
                td.rowSpan = c.rowspan;
                td.setAttribute('rowspan', c.rowspan);
            }
            styleCell(td, c);
            tr.appendChild(td);
        });
        $tbody[0].appendChild(tr);
    });
}

function buildExportTable() {
    const receivingBlock = buildFlatBlock('RECEIVING', lastReportData.MRNReceive);
    const productionBlock = buildGroupedBlock('PRODUCTION', lastReportData.ProductionData, 'Machine');
    const dispatchBlock   = buildFlatBlock('DISPATCH', lastReportData.DispatchSales);
    const slittingBlock   = buildSlittingBlock('SLITTING', lastReportData.SlittingData);

    const topRows    = combineSideBySide(receivingBlock, productionBlock);
    const bottomRows = combineSideBySide(dispatchBlock, slittingBlock);

    const $table = $('#tblExportMaster');
    const $tbody = $table.find('tbody');
    $tbody.empty();
    $table.attr('cellspacing', '0').attr('cellpadding', '0').css({ borderCollapse: 'collapse', width: '100%' });

    renderCellGridToTable($tbody, topRows);
    $tbody[0].appendChild(document.createElement('tr'));
    $tbody[0].appendChild(document.createElement('tr'));
    renderCellGridToTable($tbody, bottomRows);
}

function applyPdfTableStyles(table) {
    table.className = 'pdf-section-table';
    table.setAttribute('cellspacing', '0');
    table.setAttribute('cellpadding', '0');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.minWidth = '100%';
    table.style.tableLayout = 'fixed';
    table.style.background = '#ffffff';
    table.style.fontSize = PDF_LAYOUT.fontSizePx;
}

// PDF: one full-width table per section so mixed column counts do not leave blank space on the right
function buildPdfExportDom(wrapper) {
    wrapper.querySelectorAll('table.pdf-section-table').forEach(function (t) { t.remove(); });

    const blocks = [
        buildFlatBlock('RECEIVING', lastReportData.MRNReceive),
        buildGroupedBlock('PRODUCTION', lastReportData.ProductionData, 'Machine'),
        buildFlatBlock('DISPATCH', lastReportData.DispatchSales),
        buildSlittingBlock('SLITTING', lastReportData.SlittingData)
    ];

    const sectionTables = [];
    blocks.forEach(function (block) {
        if (!block || !block.rows || block.rows.length === 0) return;
        const table = document.createElement('table');
        applyPdfTableStyles(table);
        const tbody = document.createElement('tbody');
        renderCellGridToTable($(tbody), block.rows);
        table.appendChild(tbody);
        wrapper.appendChild(table);
        sectionTables.push(table);
    });
    return sectionTables;
}

function getPdfWrapperWidthPx(usableWMm) {
    return Math.max(960, Math.round((usableWMm / 25.4) * 96));
}

function updatePdfRepeatState(state, info) {
    if (!info) return;
    if (info.type === 'sectionTitle') {
        state.repeatTrs = [];
        return;
    }
    if (info.type === 'groupBand') {
        state.repeatTrs = [{ tr: info.tr, h: info.h }];
        return;
    }
    if (info.type === 'columnHeader') {
        if (state.repeatTrs.length === 1 &&
            state.repeatTrs[0].tr.getAttribute('data-export-type') === 'groupBand') {
            state.repeatTrs = [state.repeatTrs[0], { tr: info.tr, h: info.h }];
        } else {
            state.repeatTrs = [{ tr: info.tr, h: info.h }];
        }
        return;
    }
    if (info.type === 'slitBand') {
        state.repeatTrs = [{ tr: info.tr, h: info.h }];
        return;
    }
    if (info.type === 'slitSubHead') {
        if (state.repeatTrs.length &&
            state.repeatTrs[0].tr.getAttribute('data-export-type') === 'slitBand') {
            state.repeatTrs = [state.repeatTrs[0], { tr: info.tr, h: info.h }];
        } else {
            state.repeatTrs = [{ tr: info.tr, h: info.h }];
        }
    }
}

function collectSlittingGroupRows(rowInfos, startIndex) {
    const group = rowInfos[startIndex].slittingGroup;
    if (!group) return [rowInfos[startIndex]];
    const batch = [rowInfos[startIndex]];
    let j = startIndex + 1;
    while (j < rowInfos.length && rowInfos[j].slittingGroup === group) {
        batch.push(rowInfos[j]);
        j++;
    }
    return batch;
}

function measurePdfRowHeight(tr) {
    return Math.max(tr.offsetHeight || tr.getBoundingClientRect().height || 0, PDF_LAYOUT.minRowPx);
}

// Rowspan slitting groups: sum of row heights can under-count; use DOM span when possible
function measureBatchHeight(batch) {
    if (!batch || !batch.length) return 0;
    if (batch.length === 1) return batch[0].h;

    const firstTr = batch[0].tr;
    const lastTr = batch[batch.length - 1].tr;
    if (firstTr.offsetParent && firstTr.offsetParent === lastTr.offsetParent) {
        const spanH = lastTr.offsetTop + lastTr.offsetHeight - firstTr.offsetTop;
        if (spanH > 0) return spanH;
    }

    return batch.reduce(function (sum, info) { return sum + info.h; }, 0);
}

function buildPdfRowPages(sectionTables, usableHeightPx) {
    const rowInfos = [];
    sectionTables.forEach(function (table) {
        Array.from(table.querySelectorAll('tbody tr')).forEach(function (tr) {
            rowInfos.push({
                tr: tr,
                h: measurePdfRowHeight(tr),
                type: tr.getAttribute('data-export-type') || 'data',
                slittingGroup: tr.getAttribute('data-export-slitting-group') || '',
                cols: parseInt(tr.getAttribute('data-export-cols') || '0', 10) || tr.cells.length
            });
        });
    });
    const filtered = rowInfos.filter(function (info) { return info.type !== 'spacer'; });

    const pages = [];
    let current = [];
    let currentH = 0;
    const state = { repeatTrs: [] };

    function appendRepeatHeaders() {
        state.repeatTrs.forEach(function (item) {
            current.push(item.tr.cloneNode(true));
            currentH += item.h;
        });
    }

    function startNewPage() {
        if (current.length) pages.push({ rows: current, contentH: currentH });
        current = [];
        currentH = 0;
        appendRepeatHeaders();
    }

    for (let i = 0; i < filtered.length; i++) {
        const batch = filtered[i].slittingGroup
            ? collectSlittingGroupRows(filtered, i)
            : [filtered[i]];

        updatePdfRepeatState(state, batch[0]);
        const batchH = measureBatchHeight(batch);

        if (current.length > 0 && currentH + batchH > usableHeightPx) {
            startNewPage();
        }

        batch.forEach(function (info) {
            current.push(info.tr.cloneNode(true));
        });
        currentH += batchH;

        if (filtered[i].slittingGroup) {
            i += batch.length - 1;
        }
    }

    if (current.length) pages.push({ rows: current, contentH: currentH });
    return pages;
}

function buildPdfPageTable(pageRows) {
    const table = document.createElement('table');
    applyPdfTableStyles(table);
    const tbody = document.createElement('tbody');
    pageRows.forEach(function (tr) { tbody.appendChild(tr.cloneNode(true)); });
    table.appendChild(tbody);
    return table;
}

// Split page rows into separate full-width tables when column counts change between sections
function buildPdfPageFragment(pageRows) {
    const host = document.createElement('div');
    host.style.width = '100%';
    host.style.background = '#ffffff';

    let group = [];
    let groupCols = null;

    function flushGroup() {
        if (!group.length) return;
        host.appendChild(buildPdfPageTable(group));
        group = [];
    }

    pageRows.forEach(function (tr) {
        const cols = parseInt(tr.getAttribute('data-export-cols') || '0', 10) || tr.cells.length;
        const slitGroup = tr.getAttribute('data-export-slitting-group') || '';
        const prevSlit = group.length
            ? (group[group.length - 1].getAttribute('data-export-slitting-group') || '')
            : '';
        const sameSlitGroup = slitGroup && slitGroup === prevSlit;

        if (groupCols !== null && cols !== groupCols && !sameSlitGroup) flushGroup();
        if (!sameSlitGroup) groupCols = cols;
        group.push(tr);
    });
    flushGroup();
    return host;
}

function waitNextFrame() {
    return new Promise(function (resolve) { requestAnimationFrame(function () { resolve(); }); });
}

function getReportFileName() {
    const currentDate = new Date();
    const dateString = currentDate.getFullYear() + "-" +
        (currentDate.getMonth() + 1).toString().padStart(2, "0") + "-" +
        currentDate.getDate().toString().padStart(2, "0");
    return "MISReport_" + dateString;
}

function ExportExcel() {
    if (!lastReportData) {
        toastr.warning("Please load the report first.");
        return;
    }

    buildExportTable();
    downloadTableAsExcel('tblExportMaster', getReportFileName());
}

function downloadTableAsExcel(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tableHtml = table.outerHTML;
    const template =
        '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
        'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
        'xmlns="http://www.w3.org/TR/REC-html40">' +
        '<head><meta charset="UTF-8">' +
        '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>' +
        '<x:Name>MIS Report</x:Name>' +
        '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>' +
        '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' +
        '<style>td{mso-number-format:"\\@";}</style>' +
        '</head><body>' + tableHtml + '</body></html>';

    const dataUri = 'data:application/vnd.ms-excel;base64,' + base64EncodeUnicode(template);
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = filename + '.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function base64EncodeUnicode(str) {
    const utf8 = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (_, p1) {
        return String.fromCharCode(parseInt(p1, 16));
    });
    return window.btoa(utf8);
}

async function ExportPdf() {
    if (!lastReportData) {
        toastr.warning("Please load the report first.");
        return;
    }

    const JsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!JsPDF || typeof html2canvas !== 'function') {
        toastr.error("PDF library not loaded. Please refresh the page.");
        return;
    }

    _pdfExportCompact = true;

    const wrapper = document.getElementById('misPdfExportWrap');
    if (!wrapper) {
        _pdfExportCompact = false;
        toastr.error("PDF export container not found.");
        return;
    }

    const sectionTables = buildPdfExportDom(wrapper);
    if (!sectionTables.length) {
        _pdfExportCompact = false;
        toastr.warning("No data available for PDF export.");
        return;
    }

    const prev = {
        display: wrapper.style.display,
        position: wrapper.style.position,
        left: wrapper.style.left,
        top: wrapper.style.top,
        zIndex: wrapper.style.zIndex,
        background: wrapper.style.background,
        width: wrapper.style.width
    };

    const pdf = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const margin = PDF_LAYOUT.marginMm;
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const usableW = pageW - margin * 2;
    const usableH = pageH - margin * 2;
    const wrapperWidthPx = getPdfWrapperWidthPx(usableW);

    wrapper.style.display = 'block';
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-12000px';
    wrapper.style.top = '0';
    wrapper.style.zIndex = '-1';
    wrapper.style.background = '#ffffff';
    wrapper.style.width = wrapperWidthPx + 'px';
    wrapper.style.overflow = 'hidden';

    const $btn = $('#btnDownload');
    $btn.prop('disabled', true);

    try {
        await waitNextFrame();
        await waitNextFrame();

        const usablePx = wrapperWidthPx * (usableH / usableW);
        const pages = buildPdfRowPages(sectionTables, usablePx);

        for (let p = 0; p < pages.length; p++) {
            const pageFragment = buildPdfPageFragment(pages[p].rows);
            const captureHost = document.createElement('div');
            captureHost.style.width = wrapperWidthPx + 'px';
            captureHost.style.overflow = 'hidden';
            captureHost.style.background = '#ffffff';
            captureHost.appendChild(pageFragment);
            wrapper.appendChild(captureHost);
            await waitNextFrame();

            const captureW = captureHost.offsetWidth;
            const captureH = captureHost.offsetHeight;

            const canvas = await html2canvas(captureHost, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: captureW,
                height: captureH,
                windowWidth: captureW,
                windowHeight: captureH
            });

            wrapper.removeChild(captureHost);

            if (p > 0) pdf.addPage();

            // Scale to full page width; keep natural height (do not stretch short pages)
            const drawW = usableW;
            const drawH = Math.min(usableH, (captureH / captureW) * drawW);

            pdf.addImage(
                canvas.toDataURL('image/jpeg', 0.92),
                'JPEG',
                margin,
                margin,
                drawW,
                drawH,
                undefined,
                'FAST'
            );
        }

        pdf.save(getReportFileName() + '.pdf');
    } catch (err) {
        console.error('PDF export failed:', err);
        toastr.error("Failed to generate PDF.");
    } finally {
        _pdfExportCompact = false;
        wrapper.querySelectorAll('table.pdf-section-table').forEach(function (t) { t.remove(); });
        wrapper.style.display = prev.display;
        wrapper.style.position = prev.position;
        wrapper.style.left = prev.left;
        wrapper.style.top = prev.top;
        wrapper.style.zIndex = prev.zIndex;
        wrapper.style.background = prev.background;
        wrapper.style.width = prev.width;
        wrapper.style.overflow = '';
        $btn.prop('disabled', false);
    }
}

window.GetReportData = GetReportData;
window.ExportExcel = ExportExcel;
window.ExportPdf = ExportPdf;
