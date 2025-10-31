import { RollingPlanSheetService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_RollingPlanSheetService.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

$(document).ready(function () {
    GetRollingPlanSheetList();
    $(document).on('click', '#dispatch-tab', function () {
        clearTable();
        // Show date bar and default to today
        $('#date-filter-bar').show();
        $('#btnDownload').hide();
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
        $('#btnDownload').show();
        GetRollingPlanSheetList();
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
                "Ord Qty", "Ord Bal Qty", "Rld Qty", "Pld Qty", "Pld Bal Qty", "Rld Bal Qty",
                "Dispatch Qty", "Available stock for dispatch", "Availiable stock for dispatch", "Balance Dispatch Qty"
            ];
            const dateFilterColumn = ["Order Date", "Dispatch Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["BuyerPoMaster_Code", "BuyerPoDetail_Code", "Qty MR", "Bal Qty Pc", "SizeDesp", "Dispatch Qty_raw", "Pld Qty_raw", "Rld Qty_raw"];

            const totals = calculateTotals(response);

            const formattedResponse = formatRowsByColumns(response, numericFilterColumn).map(r => {
                const row = formatQuantityFields(r);
                // Add tooltips for Size and Thickness columns
                if (row["Size"] && row["SizeDesp"]) {
                    row["Size"] = `<span title="${escapeHtml(row["SizeDesp"])}">${row["Size"]}</span>`;
                }
                if (row["Thk"] && row["SizeDesp"]) {
                    row["Thk"] = `<span title="${escapeHtml(row["SizeDesp"])}">${row["Thk"]}</span>`;
                }
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
                "Available stock for dispatch": "right;",
                "Availiable stock for dispatch": "right;",
                "Balance Dispatch Qty": "right;",
                "SNo": ";width:15px;",
                "Status": ";width:15px;"
            };

            BizsolCustomFilterGrid.CreateDataTable("table-head", "table-body", formattedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);

            setTimeout(() => {
                addTotalsRow(totals, hiddenColumns);
                adjustFilterDropdownPosition();
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
        availableStockForDispatch: 0, // Available stock for dispatch
        balanceDispatchQty: 0 // Balance Dispatch Qty
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
            item["Available stock for dispatch"] ?? item["Availiable stock for dispatch"] ?? item["AvailableStockForDispatch"] ?? item["Avail_Stock_For_Dispatch"] ?? 0
        );
        const balanceDispatchQty = Number(item["Balance Dispatch Qty"] ?? item["BalanceDispatchQty"] ?? item["Bal_Dispatch_Qty"] ?? 0);

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
        , "Pld Bal Qty", "Rld Bal Qty", "Dispatch Qty", "Available stock for dispatch", "Availiable stock for dispatch", "Balance Dispatch Qty"
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
    totalsRow.style.borderBottom = '2px solid #5c95ce';
    totalsRow.style.position = 'sticky';
    totalsRow.style.top = '0';
    totalsRow.style.zIndex = '15';
    const firstHeaderRow = tableHead.children[0];
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
            } else if (headerText.includes('Balance Dispatch Qty')) {
                cell.textContent = totals.balanceDispatchQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Dispatch Qty')) {
                cell.textContent = totals.dispatchQty.toFixed(3);
                cell.style.textAlign = 'right';
                cell.style.backgroundColor = '#fff2cc';
                cell.style.fontWeight = 'bold';
            } else if (headerText.includes('Available stock for dispatch') || headerText.includes('Availiable stock for dispatch')) {
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
    setTimeout(() => {
        const filteredData = window['filteredData_tblTable'] || [];
        const totals = calculateTotals(filteredData);
        const hiddenColumns = ["BuyerPoMaster_Code", "BuyerPoDetail_Code", "Qty MR", "Bal Qty Pc", "SizeDesp", "Dispatch Qty_raw", "Pld Qty_raw", "Rld Qty_raw"];
        addTotalsRow(totals, hiddenColumns);
        adjustFilterDropdownPosition();
    }, 300);
});

$(document).on('click', '[id^="pageSize-"], [id^="firstBtn-"], [id^="prevBtn-"], [id^="nextBtn-"], [id^="lastBtn-"]', function () {
    setTimeout(() => {
        const filteredData = window['filteredData_tblTable'] || [];
        const totals = calculateTotals(filteredData);
        const hiddenColumns = ["BuyerPoMaster_Code", "BuyerPoDetail_Code", "Qty MR", "Bal Qty Pc", "SizeDesp", "Dispatch Qty_raw", "Pld Qty_raw", "Rld Qty_raw"];
        addTotalsRow(totals, hiddenColumns);
        adjustFilterDropdownPosition();
    }, 300);
});

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
    const hiddenFields = ["Code", "BuyerPoMaster_Code", "BuyerPoDetail_Code", "SizeDesp"];
    RollingPlanSheetService.GetRollingPlanSheetList().then(function (response) {
        ExportToExcelControl.ExportToExcel(response, hiddenFields, "RollingPlanSheet");
    });

}

function OpenModal(Mode, BuyerPoMaster_Code) {
    const titleMap = {
        'INVOICEDETAIL': 'Invoice Details',
        'ROLLINGPLAN': 'Rolling Plan Details',
        'PRODUCTION': 'Production Details'
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
            };

            BizsolCustomFilterGrid.CreateDataTable("DetailTable-head", "DetailTable-body", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment, false);
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

window.ExportExcel = ExportExcel;
window.OpenModal = OpenModal;
window.CloseModal = CloseModal;


