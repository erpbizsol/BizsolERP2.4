import { MISReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MISReportsService.js';

let lastReportData = null;

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

    $('#btnDownload').click(function () {
        Export();
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

        // Keep last data for the combined Excel export
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

    // Round any column whose name contains "Weight" to 3 decimal places
    if (key && key.toLowerCase().indexOf('weight') !== -1) {
        const num = parseFloat(value);
        if (!isNaN(num)) {
            return num.toFixed(3);
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
    if (key && key.toLowerCase().indexOf('weight') !== -1) {
        return sum.toFixed(3);
    }
    // Integer-only sums stay integer, otherwise show 2 decimals
    return Number.isInteger(sum) ? String(sum) : sum.toFixed(2);
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
        const k = key.toLowerCase().replace(/[\s.]/g, '');
        if (k.indexOf('code') !== -1) return false;
        if (isSerialColumn(key)) return false;
        return true;
    };
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

    // Group rows preserving first-seen order
    const groups = {};
    const order = [];
    data.forEach(function (r) {
        const g = (r[groupKey] === null || r[groupKey] === undefined) ? '' : r[groupKey];
        if (!groups[g]) { groups[g] = []; order.push(g); }
        groups[g].push(r);
    });

    const colCount = displayCols.length;

    order.forEach(function (machine) {
        const rows = groups[machine];

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
                if (isRightAligned(key)) td.style.textAlign = 'right';
                tr.appendChild(td);
                if (isTotalable(key)) {
                    const num = parseFloat(item[key]);
                    if (!isNaN(num)) totals[key] += num;
                }
            });
            $body[0].appendChild(tr);
        });

        // Subtotal row for the group
        const totalTr = document.createElement('tr');
        let labelPlaced = false;
        displayCols.forEach(function (key) {
            const td = document.createElement('td');
            td.style.fontWeight = 'bold';
            td.style.backgroundColor = '#f1f3f5';
            if (isTotalable(key)) {
                td.textContent = formatTotalValue(key, totals[key]);
                if (isRightAligned(key)) td.style.textAlign = 'right';
            } else if (!labelPlaced) {
                td.textContent = 'Total';
                labelPlaced = true;
            } else {
                td.textContent = '';
            }
            totalTr.appendChild(td);
        });
        $body[0].appendChild(totalTr);
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

    rows.push([cell(title, { type: 'title', bold: true, align: 'center', colspan: cols })]);

    const bandRow = [
        cell('Issue', { type: 'band', bold: true, align: 'center', colspan: issueCols.length }),
        cell('Receive', { type: 'band', bold: true, align: 'center', colspan: 3 })
    ];
    rows.push(bandRow);

    const subRow = issueCols.map(function (k) {
        const label = slittingIssueColumnLabel(k, shiftKey, sizeKey, weightKey);
        return cell(label, { type: 'header', bold: true });
    }).concat([
        cell('Weight MT', { type: 'header', bold: true }),
        cell('No Of Slits', { type: 'header', bold: true }),
        cell('Size Desp', { type: 'header', bold: true })
    ]);
    rows.push(subRow);

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

        displayRows.forEach(function (receiveRow, idx) {
            const row = [];

            issueCols.forEach(function (key) {
                if (key === weightKey) {
                    const n = parseFloat(issueRow ? issueRow[key] : '');
                    if (idx === 0 && !isNaN(n)) totalIssueWeight += n;
                    row.push(cell(formatCellValue(issueRow ? issueRow[key] : '', key), { align: 'right' }));
                } else {
                    row.push(cell(formatCellValue(issueRow ? issueRow[key] : '', key)));
                }
            });

            if (receiveRow) {
                const n = parseFloat(receiveRow[weightKey]);
                if (!isNaN(n)) totalReceiveWeight += n;
            }

            row.push(cell(receiveRow ? formatCellValue(receiveRow[weightKey], weightKey) : '', { align: 'right' }));
            row.push(cell(receiveRow && slitsKey ? formatCellValue(receiveRow[slitsKey], slitsKey) : '', { align: 'right' }));
            row.push(cell(receiveRow && sizeKey ? formatCellValue(receiveRow[sizeKey], sizeKey) : ''));
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
    rows.push(totalRow);

    return { rows: rows, cols: cols };
}

/* =====================================================================
   COMBINED EXCEL EXPORT  (2x2 quadrant layout matching MIS template)
   Receiving | Production
   Dispatch  | Slitting
   ===================================================================== */

// Excel cell style palette (inline styles are preserved by table2excel)
const XL = {
    title:  { bg: '#1f4e8c', color: '#ffffff' },   // section title band
    band:   { bg: '#4a5568', color: '#ffffff' },   // machine group band
    header: { bg: '#d9e0ee', color: '#1f2937' },   // column headers
    total:  { bg: '#fde9c8', color: '#1f2937' },   // total / subtotal rows
};

function cell(text, opts) {
    return Object.assign({ text: (text === null || text === undefined) ? '' : text }, opts || {});
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

    rows.push([cell(title, { type: 'title', bold: true, align: 'center', colspan: cols })]);
    rows.push(headers.map(function (k) { return cell(k, { type: 'header', bold: true }); }));

    const totals = {};
    headers.forEach(function (k) { if (isTotalable(k)) totals[k] = 0; });

    data.forEach(function (item) {
        rows.push(headers.map(function (k) {
            if (isTotalable(k)) {
                const n = parseFloat(item[k]);
                if (!isNaN(n)) totals[k] += n;
            }
            return cell(formatCellValue(item[k], k), { align: isRightAligned(k) ? 'right' : 'left' });
        }));
    });

    if (Object.keys(totals).length > 0) {
        let labelPlaced = false;
        rows.push(headers.map(function (k) {
            if (isTotalable(k)) return cell(formatTotalValue(k, totals[k]), { type: 'total', bold: true, align: 'right' });
            if (!labelPlaced) { labelPlaced = true; return cell('Total', { type: 'total', bold: true }); }
            return cell('', { type: 'total' });
        }));
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

    const cols = displayCols.length;
    const rows = [];
    rows.push([cell(title, { type: 'title', bold: true, align: 'center', colspan: cols })]);

    order.forEach(function (machine) {
        rows.push([cell(machine, { type: 'band', bold: true, align: 'center', colspan: cols })]);
        rows.push(displayCols.map(function (k) { return cell(k, { type: 'header', bold: true }); }));

        const totals = {};
        displayCols.forEach(function (k) { if (isTotalable(k)) totals[k] = 0; });

        groups[machine].forEach(function (item) {
            rows.push(displayCols.map(function (k) {
                if (isTotalable(k)) {
                    const n = parseFloat(item[k]);
                    if (!isNaN(n)) totals[k] += n;
                }
                return cell(formatCellValue(item[k], k), { align: isRightAligned(k) ? 'right' : 'left' });
            }));
        });

        let labelPlaced = false;
        rows.push(displayCols.map(function (k) {
            if (isTotalable(k)) return cell(formatTotalValue(k, totals[k]), { type: 'total', bold: true, align: 'right' });
            if (!labelPlaced) { labelPlaced = true; return cell('Total', { type: 'total', bold: true }); }
            return cell('', { type: 'total' });
        }));
    });

    return { rows: rows, cols: cols };
}

// Place two blocks side-by-side with a 1-column gap. Every row is padded to
// the exact left/right width using real cells so Excel columns stay aligned.
function combineSideBySide(leftBlock, rightBlock) {
    const leftCols = leftBlock.cols;
    const rightCols = rightBlock.cols;
    const maxRows = Math.max(leftBlock.rows.length, rightBlock.rows.length);
    const combined = [];

    for (let i = 0; i < maxRows; i++) {
        const leftRow = padRowToWidth(leftBlock.rows[i] || [], leftCols);
        const rightRow = padRowToWidth(rightBlock.rows[i] || [], rightCols);
        combined.push(leftRow.concat([cell('', { spacer: true })]).concat(rightRow));
    }
    return combined;
}

function styleCell(td, cell) {
    td.style.border = '1px solid #b9c0cf';
    td.style.padding = '3px 7px';
    td.style.fontSize = '11px';
    if (cell.bold) td.style.fontWeight = 'bold';
    if (cell.align) td.style.textAlign = cell.align;

    const palette = cell.type && XL[cell.type];
    if (palette) {
        td.style.backgroundColor = palette.bg;
        td.style.color = palette.color;
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

function Export() {
    if (!lastReportData) {
        toastr.warning("Please load the report first.");
        return;
    }

    const receivingBlock = buildFlatBlock('RECEIVING', lastReportData.MRNReceive);
    const productionBlock = buildGroupedBlock('PRODUCTION', lastReportData.ProductionData, 'Machine');
    const dispatchBlock   = buildFlatBlock('DISPATCH', lastReportData.DispatchSales);
    const slittingBlock   = buildSlittingBlock('SLITTING', lastReportData.SlittingData);

    const topRows    = combineSideBySide(receivingBlock, productionBlock);
    const bottomRows = combineSideBySide(dispatchBlock, slittingBlock);

    const $tbody = $('#tblExportMaster tbody');
    $tbody.empty();

    renderCellGridToTable($tbody, topRows);
    $tbody[0].appendChild(document.createElement('tr')); // gap between quadrants
    $tbody[0].appendChild(document.createElement('tr'));
    renderCellGridToTable($tbody, bottomRows);

    var currentDate = new Date();
    var dateString = currentDate.getFullYear() + "-" +
        (currentDate.getMonth() + 1).toString().padStart(2, "0") + "-" +
        currentDate.getDate().toString().padStart(2, "0");

    downloadTableAsExcel('tblExportMaster', "MISReport_" + dateString);
}

// Export an HTML table to Excel while preserving inline styles
// (bold, background colour, borders). Excel reads the HTML directly.
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

    const dataUri = 'data:application/vnd.ms-excel;base64,' +
        base64EncodeUnicode(template);

    const link = document.createElement('a');
    link.href = dataUri;
    link.download = filename + '.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function base64EncodeUnicode(str) {
    // Handle Unicode characters safely before base64 encoding
    const utf8 = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (_, p1) {
        return String.fromCharCode(parseInt(p1, 16));
    });
    return window.btoa(utf8);
}

window.GetReportData = GetReportData;
window.Export = Export;
