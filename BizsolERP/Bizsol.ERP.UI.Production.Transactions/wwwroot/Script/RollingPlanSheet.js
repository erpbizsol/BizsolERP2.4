import { RollingPlanSheetService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_RollingPlanSheetService.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

let G_FromDate = '';
let G_ToDate = '';
$(document).ready(function () {
    GetRollingPlanSheetList();
    $(document).on('click', '#dispatch-tab', function () {
        clearTable();
        $('#date-filter-bar').show();
        $('#btnDownload').hide();
        $('#from-date-to-date-filter-bar').hide();
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const iso = `${yyyy}-${mm}-${dd}`;
        if (!$('#rpToDate').val()) {
            $('#rpToDate').val(iso);
        }
        GetDateAndMillWiseReportList($('#rpToDate').val());
    });
    $(document).on('click', '#current-stock-tab', function () {
        clearTable();
        $('#date-filter-bar').hide();
        $('#from-date-to-date-filter-bar').hide();
        $('#btnDownload').show();
        GetRollingPlanSheetList();
        const $wrapper = $('.table-wrapper');
        $wrapper.css({ width: '100%' });

    });
    $(document).on('click', '#pipe-stock-tab', function () {
        clearTable();
        $('#date-filter-bar').hide();
        $('#from-date-to-date-filter-bar').hide();
        $('#btnDownload').show();
        GetPipeStockRollingPlanList();
        const $wrapper = $('.table-wrapper');
        $wrapper.css({ width: '100%' });

    });
    $(document).on('click', '#pending-plans-tab', function () {
        clearTable();
        $('#date-filter-bar').hide();
        $('#btnDownload').show();
        $('#from-date-to-date-filter-bar').show();
        setCurrentDatePendingPlans()
        GetPendingPlansReportList(G_FromDate, G_ToDate);
        const $wrapper = $('.table-wrapper');
        $wrapper.css({ width: '100%' });

    });
    $(document).on('click', '#btnShowDateMillReport', function () {
        const d = $('#rpToDate').val();
        if (!d) {
            toastr.warning('Please select a date');
            return;
        }
        GetDateAndMillWiseReportList(d);
    });
    $(document).on('click', '#btnShowDatePendingPlansReport', function () {
        G_FromDate = $('#fromDate').val();
        G_ToDate = $('#toDate').val();
        GetPendingPlansReportList(G_FromDate, G_ToDate);
    });
    $(document).on('change', '#rpToDate', function () {
        const d = $(this).val();
        if (d) {
            GetDateAndMillWiseReportList(d);
        }
    });
});
function GetRollingPlanSheetList() {
    Showloader();
    RollingPlanSheetService.GetRollingPlanSheetList().then(function (response) {
        if (response && response.length > 0) {
            HideLoader();

            const stringFilterColumn = ["Order No", "Item Name", "Size", "Thk", "Mkt_Man", "Status"];
            const numericFilterColumn = [
                "Ord Qty", "Rld Qty", "Pld Qty", "Pld Bal Qty", "Rld Bal Qty",
                "Dispatch Qty", "Avl stock for dispatch", "Bal Dispatch Qty"
            ];

            const dateFilterColumn = ["Order Date", "Dispatch Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["BuyerPoMaster_Code", "BuyerPoDetail_Code", "Qty MR", "Bal Qty Pc", "SizeDesp", "Dispatch Qty_raw", "Pld Qty_raw", "Rld Qty_raw", "PartyName", "Ord Bal Qty"];

            const totals = calculateTotals(response);

            const formattedResponse = formatRowsByColumns(response, numericFilterColumn).map(r => {
                const row = formatQuantityFields(r);
                // Keep raw text in data to preserve filtering; tooltips applied post-render
                // Make qty cells clickable to open a small modal
                // Store raw numeric values before converting to HTML
                if (row["Dispatch Qty"]) {
                    const code = row["BuyerPoDetail_Code"] ?? '';
                    const rawValue = row["Dispatch Qty"];
                    row["Dispatch Qty_raw"] = rawValue;
                    row["Dispatch Qty"] = `<a href="javascript:void(0)" onclick="OpenModal('INVOICEDETAIL','${escapeHtml(code)}')">${rawValue}</a>`;
                }
                if (row["Pld Qty"]) {
                    const code = row["BuyerPoDetail_Code"] ?? '';
                    const rawValue = row["Pld Qty"];
                    row["Pld Qty_raw"] = rawValue;
                    row["Pld Qty"] = `<a href="javascript:void(0)" onclick="OpenModal('ROLLINGPLAN','${escapeHtml(code)}')">${rawValue}</a>`;
                }
                if (row["Rld Qty"]) {
                    const code = row["BuyerPoDetail_Code"] ?? '';
                    const rawValue = row["Rld Qty"];
                    row["Rld Qty_raw"] = rawValue;
                    row["Rld Qty"] = `<a href="javascript:void(0)" onclick="OpenModal('PRODUCTION','${escapeHtml(code)}')">${rawValue}</a>`;
                }
                return row;
            });

            const columnAlignment = {
                "Ord Qty": "right;",
                "Ord Bal Qty": "right;",
                "Rld Qty": "right;",
                "Pld Bal Qty": "right;",
                "Pld Qty": "right;",
                "Rld Bal Qty": "right;",
                "Dispatch Qty": "right;",
                "Avl stock for dispatch": "right;",
                "Availiable stock for dispatch": "right;",
                "Bal Dispatch Qty": "right;",
                "SNo": ";width:15px;",
                "Status": ";width:15px;"
            };

            BizsolCustomFilterGrid.CreateDataTable("table-head", "table-body", formattedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);

            setTimeout(() => {
                addTotalsRow(totals, hiddenColumns);
                adjustFilterDropdownPosition();
                applyTooltipsToGridCells();
            }, 500);
        } else {
            HideLoader();
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error During Get Rolling Plan Sheet');
    });
}
function GetDateAndMillWiseReportList(ToDate) {
    Showloader();
    RollingPlanSheetService.GetDateAndMillWiseReportList(ToDate).then(function (response) {
        if (response && response.length > 0) {
            HideLoader();
            renderDateAndMillWiseReportTable(response, ToDate);
        } else {
            HideLoader();
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        toastr.error(error.Msg || 'Error During Get Rolling Plan Sheet');
    });
}
function clearTable() {
    $('#table-head').empty();
    $('#table-body').empty();
    $('#paginator-tblTable').empty();
    $('#table-foot').empty();
    // Also clear any existing totals row
    $('.totals-row').remove();
}
function renderDateAndMillWiseReportTable(response, reportDate) {
    const mills = [...new Set(response.map(r => r.MachineNo))];
    const rowsByMill = {};
    const totalsByMill = {};

    mills.forEach(m => {
        const list = response.filter(r => r.MachineNo === m);
        rowsByMill[m] = list;
        totalsByMill[m] = list.reduce((sum, r) => sum + (Number(r.PlannedQtyMT) || 0), 0);
    });

    const maxRows = Math.max(...mills.map(m => rowsByMill[m].length));

    let headHtml = '';
    if (reportDate) {
        const colspan = mills.length * 5;
        headHtml += `<tr><th colspan="${colspan}" style="text-align:center;background:white;color:black;">DATE: ${reportDate}</th></tr>`;
    }
    headHtml += '<tr>' + mills.map(m => `<th colspan="5" style="text-align:center">Total&nbsp;${totalsByMill[m].toFixed(3)}</th>`).join('') + '</tr>';
    headHtml += '<tr>' + mills.map(m => `<th colspan="5" style="text-align:center;background:white;color:black;">${m}</th>`).join('') + '</tr>';
    headHtml += '<tr>' + mills.map(() => (
        '<th style="width:20px;">SNo</th>' +
        '<th style="width:50px;">Size</th>' +
        '<th style="width:50px;">Thickness</th>' +
        '<th style="width:40px;">Rolled</th>' +
        '<th style="width:200px;">Rm Remark</th>'
    )).join('') + '</tr>';

    let bodyHtml = '';
    for (let i = 0; i < maxRows; i++) {
        bodyHtml += '<tr>';
        mills.forEach(m => {
            const row = rowsByMill[m][i];
            if (row) {
                const sr = (i + 1);
                const size = `${row.Size || ''}`;
                const Thickness = `${row.Thickness || ''}`;
                const total = (row.PlannedQtyMT != null ? Number(row.PlannedQtyMT).toFixed(3) : '');
                const pending = (row.RMRemark || '').toString().trim();
                bodyHtml += `<td style="text-align:center">${sr}</td>` +
                    `<td>${escapeHtml(size)}</td>` +
                    `<td>${escapeHtml(Thickness)}</td>` +
                    `<td style="text-align:right">${total}</td>` +
                    `<td style="text-align:center">${escapeHtml(pending)}</td>`;
            } else {
                bodyHtml += '<td></td><td></td><td></td><td></td>';
            }
        });
        bodyHtml += '</tr>';
    }

    $('#table-head').html(headHtml);
    $('#table-body').html(bodyHtml);
    $('#paginator-tblTable').empty();

    // Adjust container width based on number of mills
    (function adjustWidthByMillCount(count) {
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        let pct = '100%';
        if (!isMobile) {
            if (count === 1) pct = '45%';
            else if (count === 2) pct = '70%';
            else pct = '100%';
        }
        const $wrapper = $('.table-wrapper');
        // Center wrapper horizontally on desktop; full width on mobile
        $wrapper.css({ width: pct, margin: isMobile ? '0' : '0', display: 'block' });
        // Let table size to content so the wrapper width controls centering
        $('#tblTable').css({ width: isMobile ? '100%' : 'auto' });
    })(mills.length);
}
function escapeHtml(input) {
    if (input == null) return '';
    return String(input)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function calculateTotals(data) {
    const totals = {
        totalQty: 0,        // Ord Qty
        orderBalQty: 0,     // Ord Bal Qty
        rolledQty: 0,       // Rld Qty
        balQty: 0,          // Pld Bal Qty
        plannedQty: 0,      // Pld Qty
        rldplannedQty: 0,   // Rld Bal Qty
        dispatchQty: 0,     // Dispatch Qty
        availableStockForDispatch: 0, // Avl stock for dispatch
        balanceDispatchQty: 0 // Bal Dispatch Qty
    };


    data.forEach((item, index) => {


        const totalQty = Number(item["Ord Qty"] ?? item["OrdQty"] ?? item["Ord_Qty"] ?? 0);
        const orderBalQty = Number(item["Ord Bal Qty"] ?? item["OrdBalQty"] ?? item["Ord_Bal_Qty"] ?? 0);

        const rolledQty = Number(item["Rld Qty_raw"] ?? item["Rld Qty"] ?? item["RldQty"] ?? item["Rld_Qty"] ?? 0);
        const plannedQty = Number(item["Pld Qty_raw"] ?? item["Pld Qty"] ?? item["PldQty"] ?? item["Pld_Qty"] ?? 0);

        const balQty = Number(item["Pld Bal Qty"] ?? item["PldBalQty"] ?? item["Pld_Bal_Qty"] ?? 0);
        const rldplannedQty = Number(item["Rld Bal Qty"] ?? item["RldBalQty"] ?? item["Rld_Bal_Qty"] ?? 0);

        const dispatchQty = Number(item["Dispatch Qty_raw"] ?? item["Dispatch Qty"] ?? item["DispatchQty"] ?? item["Dispatch_Qty"] ?? 0);

        const availableStockForDispatch = Number(
            item["Avl stock for dispatch"] ?? item["Availiable stock for dispatch"] ?? item["AvailableStockForDispatch"] ?? item["Avail_Stock_For_Dispatch"] ?? 0
        );
        const balanceDispatchQty = Number(item["Bal Dispatch Qty"] ?? item["BalanceDispatchQty"] ?? item["Bal_Dispatch_Qty"] ?? 0);

        if (!isNaN(totalQty)) totals.totalQty += totalQty;
        if (!isNaN(orderBalQty)) totals.orderBalQty += orderBalQty;
        if (!isNaN(rolledQty)) totals.rolledQty += rolledQty;
        if (!isNaN(balQty)) totals.balQty += balQty;
        if (!isNaN(plannedQty)) totals.plannedQty += plannedQty;
        if (!isNaN(rldplannedQty)) totals.rldplannedQty += rldplannedQty;
        if (!isNaN(dispatchQty)) totals.dispatchQty += dispatchQty;
        if (!isNaN(availableStockForDispatch)) totals.availableStockForDispatch += availableStockForDispatch;
        if (!isNaN(balanceDispatchQty)) totals.balanceDispatchQty += balanceDispatchQty;

    });

    return totals;
}
function formatQuantityFields(row) {
    const clone = { ...row };
    const qtyFields = [
        "Ord Qty", "Ord Bal Qty", "Rld Qty", "Pld Qty"
        , "Pld Bal Qty", "Rld Bal Qty", "Dispatch Qty", "Avl stock for dispatch", "Availiable stock for dispatch", "Bal Dispatch Qty"
    ];
    qtyFields.forEach(k => {
        if (k in clone && clone[k] != null && clone[k] !== '') {
            const v = Number(clone[k]);
            if (!isNaN(v)) clone[k] = v.toFixed(3);
        }
    });
    return clone;
}
function formatRowsByColumns(rows, numericColumns) {
    if (!Array.isArray(rows) || rows.length === 0) return rows;
    const lowerSet = new Set(numericColumns.map(c => c.toLowerCase()));
    return rows.map(r => {
        const clone = { ...r };
        Object.keys(clone).forEach(k => {
            if (lowerSet.has(k.toLowerCase())) {
                const v = Number(clone[k]);
                if (!isNaN(v)) clone[k] = v.toFixed(3);
            }
        });
        return clone;
    });
}
// (reverted) numeric inference removed
function addTotalsRow(totals, hiddenColumns = []) {
    const tableHead = document.getElementById('table-head');
    if (!tableHead) {
        setTimeout(() => addTotalsRow(totals, hiddenColumns), 200);
        return;
    }
    const existingTotalsRow = tableHead.querySelector('.totals-row');
    if (existingTotalsRow) {
        existingTotalsRow.remove();
    }
    if (tableHead.children.length === 0) {
        setTimeout(() => addTotalsRow(totals, hiddenColumns), 200);
        return;
    }
    const totalsRow = document.createElement('tr');
    totalsRow.className = 'totals-row';
    totalsRow.style.backgroundColor = '#fff';
    totalsRow.style.fontWeight = 'bold';
    totalsRow.style.borderBottom = 'none';
    totalsRow.style.position = 'sticky';
    const firstHeaderRow = tableHead.children[0];
    totalsRow.style.top = '0';
    totalsRow.style.zIndex = '15';
    const columnCount = firstHeaderRow.children.length;
    for (let i = 0; i < columnCount; i++) {
        const cell = document.createElement('th');
        cell.style.textAlign = 'center';
        cell.style.padding = '4px 4px';
        cell.style.border = '1px solid #ddd';
        cell.style.fontSize = '8pt';
        cell.style.height = '16px';
        cell.style.verticalAlign = 'middle';
        cell.style.whiteSpace = 'nowrap';

        const headerText = firstHeaderRow.children[i].textContent.trim();


        const isHidden = hiddenColumns.some(hiddenCol =>
            headerText.includes(hiddenCol) ||
            hiddenCol.includes(headerText) ||
            headerText.toLowerCase().includes(hiddenCol.toLowerCase()) ||
            hiddenCol.toLowerCase().includes(headerText.toLowerCase())
        );

        // Special case: Show Status column in totals row even if it's hidden
        const isStatusColumn = headerText.includes('Status') || headerText.includes('Plan Status');

        if (isHidden && !isStatusColumn) {
            cell.textContent = '';
            cell.style.backgroundColor = '#e8f4fd';
            cell.style.display = 'none';
        } else {
            if (headerText.includes('Ord Qty') || headerText.includes('OQ')) {
                cell.textContent = totals.totalQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Ord Bal Qty') || headerText.includes('OBQ')) {
                cell.textContent = totals.orderBalQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Rld Qty')) {
                cell.textContent = totals.rolledQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Pld Bal Qty')) {
                cell.textContent = totals.balQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Pld Qty')) {
                cell.textContent = totals.plannedQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Rld Bal Qty')) {
                cell.textContent = totals.rldplannedQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Bal Dispatch Qty')) {
                cell.textContent = totals.balanceDispatchQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Dispatch Qty')) {
                cell.textContent = totals.dispatchQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Avl stock for dispatch') || headerText.includes('Availiable stock for dispatch')) {
                cell.textContent = totals.availableStockForDispatch.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Plan Status') || headerText.includes('PlanStatus') || headerText.includes('planStatus')) {
                cell.textContent = '';
                cell.style.fontWeight = 'bold';
                cell.style.backgroundColor = '#d5dde5';
                cell.style.textAlign = 'center';
            } else if (i === 2) {
                cell.textContent = 'Total';
                cell.style.fontWeight = 'bold';
                cell.style.backgroundColor = '#d5dde5';
                cell.style.textAlign = 'center';
            } else if (i === 0) {
                cell.textContent = 'Rows';
                cell.style.fontWeight = 'bold';
                cell.style.backgroundColor = '#d5dde5';
                cell.style.textAlign = 'center';
            } else if (i === 1) {
                cell.textContent = countTableTr();
                cell.style.fontWeight = 'bold';
                cell.style.backgroundColor = '#d5dde5';
                cell.style.textAlign = 'Right';
            } else {
                cell.textContent = '';
                cell.style.backgroundColor = '#e8f4fd';
            }
        }

        totalsRow.appendChild(cell);
    }

    // Insert totals at the top (original behavior)
    tableHead.insertBefore(totalsRow, tableHead.firstChild);


    totalsRow.offsetHeight;

    setTimeout(() => {
        const allRows = tableHead.querySelectorAll('tr');
        allRows.forEach(row => {
            const cells = row.querySelectorAll('th, td');
            for (let i = cells.length - 1; i >= 0; i--) {
                const cell = cells[i];
                if (cell.textContent.trim() === '' && cell.style.backgroundColor === '') {
                    cell.remove();
                } else {
                    break;
                }
            }
        });
    }, 100);
}

document.addEventListener("DOMContentLoaded", function () {
    setInterval(ChangecolorTr, 1000); // Slower interval for better performance
});
function ChangecolorTr() {
    const table = document.getElementById("table-body");
    let statusColIndex = 21;

    const rows = table.querySelectorAll("tr");
    rows.forEach((row) => {
        const tds = row.querySelectorAll("td");
        if (tds.length > statusColIndex) {
            // Reset previous backgrounds if needed
            tds[statusColIndex].style.backgroundColor = "";
            const statusValue = tds[statusColIndex].textContent.trim().toUpperCase();
            switch (statusValue) {
                case "PLANNED":
                    tds[statusColIndex].style.backgroundColor = "#07bb72";
                    break;
                case "PARTIAL":
                    tds[statusColIndex].style.backgroundColor = "#ebb861";
                    break;
                case "PENDING":
                    tds[statusColIndex].style.backgroundColor = "#f87171";
                    break;
                default:
                    tds[statusColIndex].style.backgroundColor = "";
                    break;
            }
        }
    });
}
function countTableTr() {
    return $('#table-body tr').length;
}

$(document).on('click', '[onclick*="applyStringFilters"], [onclick*="applyNumericFilter"], [onclick*="applyfilterdate"], [onclick*="ClearFilter"]', function () {
    const isPipeStock = $('#pipe-stock-tab').hasClass('active');
    const isPendingPlans = $('#pending-plans-tab').hasClass('active');

    setTimeout(() => {
        const filteredData = window['filteredData_tblTable'] || [];
        if (isPipeStock) {
            updatePipeStockFooterFromFiltered(filteredData);
            adjustFilterDropdownPosition();
            applyTooltipsToGridCells();
            return;
        }
        if (isPendingPlans) {
            updatePendingPlansFooterFromFiltered(filteredData);
            return;
        }
        const totals = calculateTotals(filteredData);
        const hiddenColumns = ["BuyerPoMaster_Code", "BuyerPoDetail_Code", "Qty MR", "Bal Qty Pc", "SizeDesp", "Dispatch Qty_raw", "Pld Qty_raw", "Rld Qty_raw", "PartyName", "Ord Bal Qty"];
        addTotalsRow(totals, hiddenColumns);
        adjustFilterDropdownPosition();
        applyTooltipsToGridCells();
    }, 300);
});

$(document).on('click', '[id^="pageSize-"], [id^="firstBtn-"], [id^="prevBtn-"], [id^="nextBtn-"], [id^="lastBtn-"]', function () {
    const isPipeStock = $('#pipe-stock-tab').hasClass('active');
    const isPendingPlans = $('#pending-plans-tab').hasClass('active');

    setTimeout(() => {
        const filteredData = window['filteredData_tblTable'] || [];
        if (isPipeStock) {
            updatePipeStockFooterFromFiltered(filteredData);
            adjustFilterDropdownPosition();
            applyTooltipsToGridCells();
            return;
        }
        if (isPendingPlans) {
            updatePendingPlansFooterFromFiltered(filteredData);
            return;
        }
        const totals = calculateTotals(filteredData);
        const hiddenColumns = ["BuyerPoMaster_Code", "BuyerPoDetail_Code", "Qty MR", "Bal Qty Pc", "SizeDesp", "Dispatch Qty_raw", "Pld Qty_raw", "Rld Qty_raw", "PartyName", "Ord Bal Qty"];
        addTotalsRow(totals, hiddenColumns);
        adjustFilterDropdownPosition();
        applyTooltipsToGridCells();
    }, 300);
});

function updatePipeStockFooterFromFiltered(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
        addPipeStockFooter(0, 0, 0);
        return;
    }
    let totalQtyMT = 0;
    let totalQtyPC = 0;
    let totalKG_Pipe = 0;

    rows.forEach(function (row) {
        totalQtyMT += parseFloat(row["Qty MT"]) || 0;
        totalQtyPC += parseFloat(row["Qty PC"]) || 0;
        totalKG_Pipe += parseFloat(row["KG_Pipe"]) || 0;
    });

    addPipeStockFooter(totalQtyMT, totalQtyPC, totalKG_Pipe);
}

function updatePendingPlansFooterFromFiltered(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
        addPendingPlansFooter(0, 0, 0, 0, 0, 0, 0, 0);
        return;
    }
    let totalOrderMT = 0;
    let totalPlannedMT = 0;
    let totalRolledMT = 0;
    let totalBalanceMT = 0;
    let totalOrderPC = 0;
    let totalPlannedPC = 0;
    let totalRolledPC = 0;
    let totalBalancePC = 0;

    rows.forEach(function (row) {
        totalOrderMT += parseFloat(row["Order MT"]) || 0;
        totalPlannedMT += parseFloat(row["Planned MT"]) || 0;
        totalRolledMT += parseFloat(row["Rolled MT"]) || 0;
        totalBalanceMT += parseFloat(row["Balance MT"]) || 0;
        totalOrderPC += parseFloat(row["Order PC"]) || 0;
        totalPlannedPC += parseFloat(row["Planned PC"]) || 0;
        totalRolledPC += parseFloat(row["Rolled PC"]) || 0;
        totalBalancePC += parseFloat(row["Balance PC"]) || 0;
    });

    addPendingPlansFooter(
        totalOrderMT,
        totalPlannedMT,
        totalRolledMT,
        totalBalanceMT,
        totalOrderPC,
        totalPlannedPC,
        totalRolledPC,
        totalBalancePC
    );
}
function applyTooltipsToGridCells() {
    try {
        const head = document.getElementById('table-head');
        const body = document.getElementById('table-body');
        if (!head || !body) return;

        // Determine the actual header row (skip totals row if present)
        const headerRows = Array.from(head.querySelectorAll('tr'));
        if (!headerRows.length) return;
        let headerRow = headerRows[0];
        const targetNames = ['Size', 'Thk', 'Thickness', 'Order No'];
        const found = headerRows.find(r => targetNames.some(n => (r.textContent || '').includes(n)));
        if (found) headerRow = found;

        // Build column index map from the detected header row (fuzzy by includes)
        const headerCells = Array.from(headerRow.children);
        const lowerHeaderByIndex = headerCells.map(th => ((th.textContent || '').trim().toLowerCase()));
        const findIndex = (needleArr) => {
            for (let i = 0; i < lowerHeaderByIndex.length; i++) {
                const h = lowerHeaderByIndex[i];
                if (needleArr.some(n => h.includes(n))) return i;
            }
            return null;
        };

        const sizeIdx = findIndex(['size']);
        const thkIdx = findIndex(['thk', 'thickness']);
        const orderNoIdx = findIndex(['order no', 'orderno']);
        const sizeDespIdx = findIndex(['sizedesp', 'size desp']);
        const partyNameIdx = findIndex(['partyname', 'party name']);

        if (sizeIdx == null && thkIdx == null && orderNoIdx == null) return;

        const rows = Array.from(body.querySelectorAll('tr'));
        rows.forEach(tr => {
            const tds = tr.children;
            const sizeDesp = sizeDespIdx != null && tds[sizeDespIdx] ? (tds[sizeDespIdx].textContent || '').trim() : '';
            const partyName = partyNameIdx != null && tds[partyNameIdx] ? (tds[partyNameIdx].textContent || '').trim() : '';

            if (sizeIdx != null && tds[sizeIdx] && sizeDesp) tds[sizeIdx].title = sizeDesp;
            if (thkIdx != null && tds[thkIdx] && sizeDesp) tds[thkIdx].title = sizeDesp;
            if (orderNoIdx != null && tds[orderNoIdx] && partyName) tds[orderNoIdx].title = partyName;
        });
    } catch (e) {
        // swallow errors to avoid breaking grid interactions
    }
}
function adjustFilterDropdownPosition() {
    // Add CSS to position filter dropdowns for last 5 columns to the left
    const style = document.createElement('style');
    style.id = 'filter-dropdown-position-fix';

    // Remove existing style if present
    const existingStyle = document.getElementById('filter-dropdown-position-fix');
    if (existingStyle) {
        existingStyle.remove();
    }

    style.innerHTML = `
        #table-head th:nth-last-child(-n+5) .filter-dropdown,
        #table-head th:nth-last-child(-n+5) .dropdown-menu,
        #table-head th:nth-last-child(-n+5) [class*="filter"],
        #table-head th:nth-last-child(-n+5) [class*="dropdown"] {
            right: 0 !important;
            left: auto !important;
        }
        
        /* Ensure filter content is visible and not cut off */
        .table-wrapper {
            overflow-x: auto;
            overflow-y: visible;
        }
        
        #tblTable {
            position: relative;
        }
        
        /* Adjust any filter popups/dropdowns in last 5 columns */
        #table-head th:last-child .filter-popup,
        #table-head th:last-child .filter-container,
        #table-head th:nth-last-child(2) .filter-popup,
        #table-head th:nth-last-child(2) .filter-container,
        #table-head th:nth-last-child(3) .filter-popup,
        #table-head th:nth-last-child(3) .filter-container,
        #table-head th:nth-last-child(4) .filter-popup,
        #table-head th:nth-last-child(4) .filter-container,
        #table-head th:nth-last-child(5) .filter-popup,
        #table-head th:nth-last-child(5) .filter-container {
            right: 0 !important;
            left: auto !important;
            transform: translateX(0) !important;
        }
    `;

    document.head.appendChild(style);

    // Also dynamically adjust filter elements if they exist
    setTimeout(() => {
        const tableHead = document.getElementById('table-head');
        if (tableHead) {
            const headerCells = tableHead.querySelectorAll('th');
            const totalCells = headerCells.length;

            // Apply to last 5 columns
            headerCells.forEach((cell, index) => {
                if (index >= totalCells - 5) {
                    cell.style.position = 'relative';

                    // Find any filter-related elements and adjust their positioning
                    const filterElements = cell.querySelectorAll('[class*="filter"], [class*="dropdown"]');
                    filterElements.forEach(elem => {
                        elem.style.right = '0';
                        elem.style.left = 'auto';
                    });
                }
            });
        }
    }, 100);
}

function ExportExcel() {
    const isPipeStockTabActive = $('#pipe-stock-tab').hasClass('active');
    const isPendingPlansTabActive = $('#pending-plans-tab').hasClass('active');
    
    if (isPipeStockTabActive) {
        const hiddenFields = [];
        RollingPlanSheetService.GetPipeStockRollingPlanList().then(function (response) {
            if (response && response.length > 0) {
                ExportToExcelControl.ExportToExcel(response, hiddenFields, "PipeStockRollingPlan");
            } else {
                toastr.error('No Data Found');
            }
        }).catch(function (error) {
            toastr.error(error.Msg || 'Error During Export Pipe Stock Data');
        });
    } else if (isPendingPlansTabActive) {
        const fromDate = $('#fromDate').val();
        const toDate = $('#toDate').val();
        
        if (!fromDate || !toDate) {
            toastr.warning('Please select From Date and To Date');
            return;
        }
        
        const hiddenFields = [];
        RollingPlanSheetService.GetPendingPlansReportList(fromDate, toDate).then(function (response) {
            if (response && response.length > 0) {
                ExportToExcelControl.ExportToExcel(response, hiddenFields, "PendingPlansRollingPlan");
            } else {
                toastr.error('No Data Found');
            }
        }).catch(function (error) {
            toastr.error(error.Msg || 'Error During Export Pending Plans Data');
        });
    } else {
        const hiddenFields = ["BuyerPoMaster_Code", "BuyerPoDetail_Code", "Qty MR", "Bal Qty Pc", "SizeDesp", "Dispatch Qty_raw", "Pld Qty_raw", "Rld Qty_raw", "PartyName", "Ord Bal Qty"];
        RollingPlanSheetService.GetRollingPlanSheetList().then(function (response) {
            if (response && response.length > 0) {
                ExportToExcelControl.ExportToExcel(response, hiddenFields, "RollingPlanSheet");
            } else {
                toastr.error('No Data Found');
            }
        }).catch(function (error) {
            toastr.error(error.Msg || 'Error During Export Rolling Plan Sheet Data');
        });
    }

}
function OpenModal(Mode, BuyerPoMaster_Code) {
    const titleMap = {
        'INVOICEDETAIL': 'Invoice Details',
        'ROLLINGPLAN': 'Rolling Plan Details',
        'PRODUCTION': 'Production Details',
    };
    const title = document.getElementById('detail-modal-title');
    if (title) title.textContent = titleMap[Mode] || (Mode || 'Details');
    const th = document.getElementById('DetailTable-head');
    const tb = document.getElementById('DetailTable-body');
    if (th) th.innerHTML = '';
    if (tb) tb.innerHTML = '';
    GetRollingPlanDetail(Mode, BuyerPoMaster_Code);
}
function GetRollingPlanDetail(Mode, BuyerPoMaster_Code) {
    Showloader();
    RollingPlanSheetService.GetRollingPlanDetail(Mode, BuyerPoMaster_Code).then(function (response) {
        if (response && response.length > 0) {
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];

            const columnAlignment = {
                Qty: 'right',
                "Planned Qty": 'right',
                "Rolled QTY": 'right'
            };

            const formattedDetailRows = formatRowsByColumns(response, ["Qty", "Planned Qty", "Rolled QTY"]);

            BizsolCustomFilterGrid.CreateDataTable("DetailTable-head", "DetailTable-body", formattedDetailRows, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
            HideLoader();
            $('#DetailModal').modal({ backdrop: 'static' });
            $('#DetailModal').modal('show');
        } else {
            HideLoader();
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error(error.Msg || 'Error During Get Rolling Plan Sheet');
    });
}
function CloseModal() {
    $('#DetailModal').modal('hide');
}
function GetPipeStockRollingPlanList() {
    Showloader();
    RollingPlanSheetService.GetPipeStockRollingPlanList().then(function (response) {
        if (response && response.length > 0) {
            let totalQtyMT = 0;
            let totalQtyPC = 0;
            let totalKG_Pipe = 0;
            
            response.forEach(function(item) {
                const qtyMT = parseFloat(item["Qty MT"]) || 0;
                const qtyPC = parseFloat(item["Qty PC"]) || 0;
                const kgPipe = parseFloat(item["KG_Pipe"]) || 0;
                
                totalQtyMT += qtyMT;
                totalQtyPC += qtyPC;
                totalKG_Pipe += kgPipe;
            });
            
            response = response.map(item => {
                if (item["Qty MT"] !== undefined && item["Qty MT"] !== null && !isNaN(item["Qty MT"])) {
                    item["Qty MT"] = parseFloat(item["Qty MT"]).toFixed(3);
                }
                if (item["KG_Pipe"] !== undefined && item["KG_Pipe"] !== null && !isNaN(item["KG_Pipe"])) {
                    item["KG_Pipe"] = parseFloat(item["KG_Pipe"]).toFixed(3);
                }
                return item;
            });
            const stringFilterColumn = ["ItemName", "Size", "Thickness", "Length", "Stamp", "GRADE", "KG_Pipe","Qty MT", "Type"];
            const numericFilterColumn = ["Qty PC"];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];

            const columnAlignment = {
                "KG_Pipe": 'right', "Qty PC": 'right', "Qty MT": 'right', "Size": 'right', "Thickness": 'right',"Length":'right',"Type":'right'
            };

            BizsolCustomFilterGrid.CreateDataTable("table-head", "table-body", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
            $('.totals-row').remove();
            
            setTimeout(function() {
                addPipeStockFooter(totalQtyMT, totalQtyPC, totalKG_Pipe);
            }, 300);
            
            HideLoader();
        } else {
            HideLoader();
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error(error.Msg || 'Error During Get Rolling Plan Sheet');
    });
}
function addPipeStockFooter(totalQtyMT, totalQtyPC, totalKG_Pipe) {
    const tfoot = document.getElementById('table-foot');
    const thead = document.getElementById('table-head');
    
    if (!tfoot || !thead) {
        return;
    }
    
    tfoot.innerHTML = '';
    
    const headerRow = thead.querySelector('tr');
    if (!headerRow) {
        return;
    }
    
    const columnCount = headerRow.children.length;
    const footerRow = document.createElement('tr');
    
    let qtyMTIndex = -1;
    let qtyPCIndex = -1;
    let kgPipeIndex = -1;
    
    for (let i = 0; i < headerRow.children.length; i++) {
        const headerText = headerRow.children[i].textContent.trim();
        if (headerText.includes('Qty MT') || headerText.includes('QtyMT')) {
            qtyMTIndex = i;
        }
        if (headerText.includes('Qty PC') || headerText.includes('QtyPC')) {
            qtyPCIndex = i;
        }
        if (headerText.includes('KG_Pipe') || headerText.includes('KG/Pipe')) {
            kgPipeIndex = i;
        }
    }
    
    for (let i = 0; i < columnCount; i++) {
        const cell = document.createElement('td');
        
        if (i === 0) {
            cell.textContent = 'Total';
            cell.style.textAlign = 'center';
        } else if (i === qtyMTIndex) {
            cell.textContent = totalQtyMT.toFixed(3);
            cell.style.textAlign = 'right';
        } else if (i === qtyPCIndex) {
            cell.textContent = totalQtyPC;
            cell.style.textAlign = 'right';
        } else if (i === kgPipeIndex) {
            cell.textContent = totalKG_Pipe.toFixed(3);
            cell.style.textAlign = 'right';
        } else {
            cell.textContent = '';
        }
        
        footerRow.appendChild(cell);
    }
    
    tfoot.appendChild(footerRow);
}
function setCurrentDatePendingPlans() {
    let today = new Date();
    let firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    function formatDate(date) {
        let day = String(date.getDate()).padStart(2, '0');
        let month = String(date.getMonth() + 1).padStart(2, '0');
        let year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }

    $('#fromDate').val(formatDate(firstOfMonth));
    $('#toDate').val(formatDate(today));
    G_FromDate = $('#fromDate').val();
    G_ToDate = $('#toDate').val();
}
function GetPendingPlansReportList(G_FromDate, G_ToDate) {
    Showloader();
    RollingPlanSheetService.GetPendingPlansReportList(G_FromDate, G_ToDate).then(function (response) {
        if (response && response.length > 0) {
            const stringFilterColumn = ["Plan No", "Order No", "Item Name", "Size Desp", "Order PC", "Status"];
            const numericFilterColumn = ["Order MT", "Planned PC", "Planned MT", "Rolled PC", "Rolled MT", "Balance PC", "Balance MT"];
            const dateFilterColumn = ["Plan Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code", "Party Name","Order No_raw"];
            
            const allowedColumns = [
                "SNo", "Plan Date", "Plan No", "Order No", "Item Name", "Size Desp", 
                "Order PC", "Order MT", "Planned PC", "Planned MT", "Rolled PC", "Rolled MT", "Balance PC", "Balance MT", "Status"
            ];
            
            response = response.map((item, index) => {
                const filteredItem = {};
                
                allowedColumns.forEach(col => {
                    if (col === "SNo") {
                        filteredItem[col] = index + 1;
                    } else if (item.hasOwnProperty(col)) {
                        filteredItem[col] = item[col];
                    }
                });
                
                if (filteredItem["Order MT"] !== undefined && filteredItem["Order MT"] !== null && !isNaN(filteredItem["Order MT"])) {
                    filteredItem["Order MT"] = parseFloat(filteredItem["Order MT"]).toFixed(3);
                } 
                if (filteredItem["Planned MT"] !== undefined && filteredItem["Planned MT"] !== null && !isNaN(filteredItem["Planned MT"])) {
                    filteredItem["Planned MT"] = parseFloat(filteredItem["Planned MT"]).toFixed(3);
                } 
                if (filteredItem["Rolled MT"] !== undefined && filteredItem["Rolled MT"] !== null && !isNaN(filteredItem["Rolled MT"])) {
                    filteredItem["Rolled MT"] = parseFloat(filteredItem["Rolled MT"]).toFixed(3);
                }
                if (filteredItem["Balance MT"] !== undefined && filteredItem["Balance MT"] !== null && !isNaN(filteredItem["Balance MT"])) {
                    filteredItem["Balance MT"] = parseFloat(filteredItem["Balance MT"]).toFixed(3);
                }
                
                if (filteredItem["Plan No"]) {
                    const rawValue = filteredItem["Plan No"];
                    filteredItem["Plan No"] = `<a href="javascript:void(0)" onclick="GetRollingPlanNoDetail('${escapeHtml(rawValue)}')">${rawValue}</a>`;
                }
                if (filteredItem["Order No"]) {
                    const partyName = (item["Party Name"] ?? item["PartyName"] ?? '').toString().trim();
                    const orderValue = filteredItem["Order No"];
                    if (partyName) {
                        filteredItem["Order No"] = `<span class="order-no-cell" title="${escapeHtml(partyName)}">${escapeHtml(orderValue)}</span>`;
                    } else {
                        filteredItem["Order No"] = `<span class="order-no-cell">${escapeHtml(orderValue)}</span>`;
                    }
                }
                
                return filteredItem;
            });
            const columnAlignment = {
                "Plan Date": 'center', "Order MT": 'right', "Planned MT": 'right', "Rolled MT": 'right', "Balance MT": 'right', "Planned PC": 'right',"Order PC": 'right', "Rolled PC": 'right', "Balance PC": 'right',
            };

            BizsolCustomFilterGrid.CreateDataTable("table-head", "table-body", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
            $('.totals-row').remove();
            
            setTimeout(function() {
                updatePendingPlansFooterFromFiltered(response);
            }, 300);
            
            HideLoader();
        } else {
            HideLoader();
            clearTable();
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        HideLoader();
        clearTable();
        toastr.error(error.Msg || 'Error During Get Pending Plan Sheet');
    });
}
function addPendingPlansFooter(totalOrderMT, totalPlannedMT, totalRolledMT, totalBalanceMT, totalOrderPC, totalPlannedPC, totalRolledPC, totalBalancePC) {
    const tfoot = document.getElementById('table-foot');
    const thead = document.getElementById('table-head');
    
    if (!tfoot || !thead) {
        return;
    }
    
    tfoot.innerHTML = '';
    
    const headerRow = thead.querySelector('tr');
    if (!headerRow) {
        return;
    }
    
    const columnCount = headerRow.children.length;
    const footerRow = document.createElement('tr');
    
    let orderMTIndex = -1;
    let plannedMTIndex = -1;
    let rolledMTIndex = -1;
    let balanceMTIndex = -1;
    let plannedPCIndex = -1;
    let orderPCIndex = -1;
    let rolledPCIndex = -1;
    let balancePCIndex = -1;
    
    for (let i = 0; i < headerRow.children.length; i++) {
        const headerText = headerRow.children[i].textContent.trim();
        if (headerText.includes('Order MT') || headerText.includes('OrderMT')) {
            orderMTIndex = i;
        }
        if (headerText.includes('Planned MT') || headerText.includes('PlannedMT')) {
            plannedMTIndex = i;
        }
        if (headerText.includes('Rolled MT') || headerText.includes('RolledMT')) {
            rolledMTIndex = i;
        }
        if (headerText.includes('Balance MT') || headerText.includes('BalanceMT')) {
            balanceMTIndex = i;
        }
        if (headerText.includes('Planned PC') || headerText.includes('PlannedPC')) {
            plannedPCIndex = i;
        }
        if (headerText.includes('Order PC') || headerText.includes('OrderPC')) {
            orderPCIndex = i;
        }
        if (headerText.includes('Rolled PC') || headerText.includes('RolledPC')) {
            rolledPCIndex = i;
        }
        if (headerText.includes('Balance PC') || headerText.includes('BalancePC')) {
            balancePCIndex = i;
        }
    }
    
    for (let i = 0; i < columnCount; i++) {
        const cell = document.createElement('td');
        
        if (i === 0) {
            cell.textContent = 'Total';
            cell.style.textAlign = 'center';
        } else if (i === orderMTIndex) {
            cell.textContent = totalOrderMT.toFixed(3);
            cell.style.textAlign = 'right';
        } else if (i === plannedMTIndex) {
            cell.textContent = totalPlannedMT.toFixed(3);
            cell.style.textAlign = 'right';
        } else if (i === rolledMTIndex) {
            cell.textContent = totalRolledMT.toFixed(3);
            cell.style.textAlign = 'right';
        } else if (i === balanceMTIndex) {
            cell.textContent = totalBalanceMT.toFixed(3);
            cell.style.textAlign = 'right';
        } else if (i === plannedPCIndex) {
            cell.textContent = totalPlannedPC;
            cell.style.textAlign = 'right';
        } else if (i === orderPCIndex) {
            cell.textContent = totalOrderPC;
            cell.style.textAlign = 'right';
        } else if (i === rolledPCIndex) {
            cell.textContent = totalRolledPC;
            cell.style.textAlign = 'right';
        } else if (i === balancePCIndex) {
            cell.textContent = totalBalancePC;
            cell.style.textAlign = 'right';
        } else {
            cell.textContent = '';
        }
        
        footerRow.appendChild(cell);
    }
    
    tfoot.appendChild(footerRow);
}
function GetRollingPlanNoDetail(PlanNo) {
    Showloader();
    RollingPlanSheetService.GetRollingPlanNoDetail(PlanNo).then(function (response) {
        if (response && response.length > 0) {
            let totalWeight = 0;
            response.forEach(function(item) {
                const weight = parseFloat(item["Issue Id Weight"]) || 0;
                totalWeight += weight;
            });

            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];

            const columnAlignment = {
                "Issue Id Weight": 'right'
            };

            const formattedDetailRows = formatRowsByColumns(response, ["Issue Id Weight"]);

            BizsolCustomFilterGrid.CreateDataTable("PlanNoDetailTable-head", "PlanNoDetailTable-body", formattedDetailRows, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
            
            setTimeout(function() {
                addPlanNoDetailFooter(totalWeight);
            }, 300);
            
            HideLoader();
            $('#planNoDetails').modal({ backdrop: 'static' });
            $('#planNoDetails').modal('show');
        } else {
            HideLoader();
            toastr.error('No Data Found');
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error(error.Msg || 'Error During Get Rolling Plan No Details');
    });
}
function addPlanNoDetailFooter(totalWeight) {
    const tfoot = document.getElementById('PlanNoDetailTable-foot');
    const thead = document.getElementById('PlanNoDetailTable-head');
    
    if (!tfoot || !thead) {
        return;
    }
    
    tfoot.innerHTML = '';
    
    const headerRow = thead.querySelector('tr');
    if (!headerRow) {
        return;
    }
    
    const columnCount = headerRow.children.length;
    const footerRow = document.createElement('tr');
    
    let issueIdWeightIndex = -1;
    for (let i = 0; i < headerRow.children.length; i++) {
        const headerText = headerRow.children[i].textContent.trim();
        if (headerText.includes('Issue Id Weight') || headerText.includes('Weight')) {
            issueIdWeightIndex = i;
            break;
        }
    }
    
    for (let i = 0; i < columnCount; i++) {
        const cell = document.createElement('td');
        
        if (i === 0) {
            cell.textContent = 'Total';
            cell.style.textAlign = 'center';
        } else if (i === issueIdWeightIndex) {
            cell.textContent = totalWeight.toFixed(3);
            cell.style.textAlign = 'right';
        } else {
            cell.textContent = '';
        }
        
        footerRow.appendChild(cell);
    }
    
    tfoot.appendChild(footerRow);
}
function PlanNoCloseModal() {
    const tfoot = document.getElementById('PlanNoDetailTable-foot');
    if (tfoot) {
        tfoot.innerHTML = '';
    }
    $('#planNoDetails').modal('hide');
}
window.ExportExcel = ExportExcel;
window.OpenModal = OpenModal;
window.CloseModal = CloseModal;
window.GetRollingPlanNoDetail = GetRollingPlanNoDetail;
window.PlanNoCloseModal = PlanNoCloseModal;


