import { BuyingCapacityService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BuyingCapacityService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

let G_BuyingCapacityRows = [];
// Active F_ClientRatingMaster rows (IsActive = Y). Code 1 maps to Parameter1, and so on.
let G_RatingColumns = [];
// When true, programmatic value binding is in progress and onchange-triggered saves are ignored
let G_SuppressSave = false;
let G_SalesPersonBound = false;
let G_SalesPersonLoadPromise = null;

const BC_SALES_PERSON_MAX_RETRIES = 4;
const BC_SALES_PERSON_RETRY_DELAY_MS = 350;

function delay(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

function normalizeApiList(response) {
    if (Array.isArray(response)) {
        return response;
    }
    if (response && Array.isArray(response.Data)) {
        return response.Data;
    }
    if (response && Array.isArray(response.data)) {
        return response.data;
    }
    return [];
}

function escapeHtmlAttr(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

async function waitForElement(selector, maxAttempts, intervalMs) {
    maxAttempts = maxAttempts || 80;
    intervalMs = intervalMs || 50;
    for (var attempt = 0; attempt < maxAttempts; attempt++) {
        var $el = $(selector);
        if ($el.length) {
            return $el;
        }
        await delay(intervalMs);
    }
    return null;
}

function initSalesPersonSelect2($ddl) {
    if (!$ddl || !$ddl.length) {
        return;
    }
    try {
        if ($ddl.hasClass('select2-hidden-accessible')) {
            $ddl.select2('destroy');
        }
    } catch (e) { }
    if (typeof $ddl.select2 === 'function') {
        $ddl.select2({
            width: '100%',
            dropdownParent: $(document.body)
        });
    }
}

async function waitForAuthKey(maxAttempts, intervalMs) {
    maxAttempts = maxAttempts || 50;
    intervalMs = intervalMs || 100;
    for (var attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            var authRaw = sessionStorage.getItem('authKey');
            if (authRaw) {
                var authKey = JSON.parse(authRaw);
                if (authKey && authKey.UserMaster_Code !== undefined && authKey.UserMaster_Code !== null && authKey.UserMaster_Code !== '') {
                    return authKey;
                }
            }
        } catch (e) { }
        await delay(intervalMs);
    }
    return null;
}

function getBuyingCapacityScroller() {
    return document.querySelector('#BuyingCapacityPage .bc-scroll')
        || document.querySelector('#BuyingCapacityPage .table-wrapper');
}

function resetBuyingCapacityTableScroll() {
    var wrap = getBuyingCapacityScroller();
    if (wrap) {
        wrap.scrollLeft = 0;
    }
}

// The grid is the only element allowed to scroll sideways. Focusing an input in an
// off-screen column makes the browser scroll the ancestors too, which drags the whole
// page left and leaves blank space next to the table.
function pinOuterHorizontalScroll() {
    [
        document.querySelector('#BuyingCapacityPage .table-wrapper'),
        document.getElementById('BuyingCapacityPage'),
        document.getElementById('modern-content'),
        document.querySelector('#modern-content > main'),
        document.scrollingElement || document.documentElement,
        document.body
    ].forEach(function (el) {
        if (el && el.scrollLeft) {
            el.scrollLeft = 0;
        }
    });
}

function lockBuyingCapacityHorizontalScroll() {
    var page = document.getElementById('BuyingCapacityPage');
    if (!page || page.dataset.hScrollLocked === '1') {
        return;
    }
    page.dataset.hScrollLocked = '1';

    document.addEventListener('scroll', pinOuterHorizontalScroll, true);
    page.addEventListener('focusin', function () {
        pinOuterHorizontalScroll();
        requestAnimationFrame(pinOuterHorizontalScroll);
    });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(layoutBuyingCapacityTable, 150);
    });
}

function isHiddenTableCell(cell) {
    if (!cell) {
        return false;
    }
    if (cell.style && String(cell.style.display).toLowerCase() === 'none') {
        return true;
    }
    var computed = window.getComputedStyle ? window.getComputedStyle(cell) : null;
    return !!(computed && computed.display === 'none');
}

function removeHiddenBuyingCapacityColumns() {
    var table = document.getElementById('BuyingCapacity');
    if (!table) {
        return;
    }

    var headerRow = table.querySelector('thead tr');
    if (!headerRow) {
        return;
    }

    var hiddenIndexes = [];
    Array.prototype.forEach.call(headerRow.children, function (th, index) {
        if (isHiddenTableCell(th)) {
            hiddenIndexes.push(index);
        }
    });
    if (!hiddenIndexes.length) {
        return;
    }

    hiddenIndexes.sort(function (a, b) { return b - a; }).forEach(function (colIndex) {
        Array.prototype.forEach.call(table.querySelectorAll('tr'), function (tr) {
            if (tr.children[colIndex]) {
                tr.removeChild(tr.children[colIndex]);
            }
        });
    });
}

function layoutBuyingCapacityTable() {
    var table = document.getElementById('BuyingCapacity');
    if (!table) {
        return;
    }

    removeHiddenBuyingCapacityColumns();

    var ratingNames = {};
    G_RatingColumns.forEach(function (col) {
        ratingNames[String(col.desp).trim().toLowerCase()] = true;
    });

    var headerRow = table.querySelector('thead tr');
    if (!headerRow) {
        return;
    }

    Array.prototype.forEach.call(headerRow.children, function (th, colIndex) {
        var heading = (th.querySelector('.filter-table-heading') || th).textContent || '';
        heading = heading.replace(/\s+/g, ' ').trim().toLowerCase();
        var isRating = !!ratingNames[heading] || heading === 'customer rating' || heading === 'monthly req(qty)';
        var cells = table.querySelectorAll('tr > *:nth-child(' + (colIndex + 1) + ')');
        cells.forEach(function (cell) {
            if (isRating) {
                cell.classList.add('bc-col-numeric');
            }
        });
    });

    sizeBuyingCapacityColumns(table, headerRow);
}

// Locks the table to the exact total of its column widths so the horizontal scroll
// stops at the last column. When the columns do not fill the view the table is
// stretched instead, so no blank strip is left on the right.
function sizeBuyingCapacityColumns(table, headerRow) {
    var wrap = getBuyingCapacityScroller() || table.parentElement;

    var oldGroup = table.querySelector('colgroup.bc-colgroup');
    if (oldGroup) {
        oldGroup.remove();
    }
    table.style.setProperty('table-layout', 'auto', 'important');
    table.style.setProperty('width', 'auto', 'important');
    table.style.setProperty('min-width', '0px', 'important');
    table.style.setProperty('max-width', 'none', 'important');

    var widths = [];
    var total = 0;
    Array.prototype.forEach.call(headerRow.children, function (th) {
        var w = Math.round(th.getBoundingClientRect().width);
        widths.push(w);
        total += w;
    });
    if (!total) {
        return;
    }

    var available = wrap ? wrap.clientWidth : 0;
    if (available && total <= available) {
        table.style.setProperty('width', '100%', 'important');
        table.style.setProperty('min-width', '0px', 'important');
        return;
    }

    var group = document.createElement('colgroup');
    group.className = 'bc-colgroup';
    widths.forEach(function (w) {
        var col = document.createElement('col');
        col.style.width = w + 'px';
        group.appendChild(col);
    });
    table.insertBefore(group, table.firstChild);

    table.style.setProperty('table-layout', 'fixed', 'important');
    table.style.setProperty('width', total + 'px', 'important');
    table.style.setProperty('min-width', total + 'px', 'important');
    table.style.setProperty('max-width', total + 'px', 'important');
}

function pickField(item, keys, fallback) {
    if (!item || !keys) {
        return fallback !== undefined ? fallback : '';
    }
    for (var i = 0; i < keys.length; i++) {
        var val = item[keys[i]];
        if (val !== undefined && val !== null && val !== '') {
            return val;
        }
    }
    return fallback !== undefined ? fallback : '';
}

function formatRatingNumber(val) {
    if (val === null || val === undefined || val === '') {
        return '';
    }
    var n = parseFloat(val);
    if (isNaN(n)) {
        return '';
    }
    var rounded = Math.round(n * 100) / 100;
    if (Math.abs(rounded - Math.round(rounded)) < 0.000001) {
        return String(Math.round(rounded));
    }
    return String(rounded);
}

function isActiveRatingFlag(value) {
    if (value === undefined || value === null || value === '') {
        return true;
    }
    var flag = String(value).trim().toUpperCase();
    return flag === 'Y' || flag === '1' || flag === 'TRUE' || flag === 'YES';
}

function applyRatingColumnList(list) {
    G_RatingColumns = [];
    if (!Array.isArray(list)) {
        return;
    }
    var used = {};
    list.forEach(function (item) {
        if (!item) {
            return;
        }
        if (!isActiveRatingFlag(item.IsActive != null ? item.IsActive : item.isActive)) {
            return;
        }
        var code = parseInt(item.Code != null ? item.Code : item.code, 10);
        var desp = String(item.Desp != null ? item.Desp : (item.desp || '')).replace(/[<>"]/g, '').trim();
        var maxValue = parseFloat(item.MaxValue != null ? item.MaxValue : item.maxValue);
        if (!code || code < 1 || code > 10 || !desp) {
            return;
        }
        if (used[desp]) {
            desp = desp + ' ' + code;
        }
        used[desp] = true;
        G_RatingColumns.push({
            code: code,
            desp: desp,
            maxValue: isNaN(maxValue) ? 0 : maxValue
        });
    });
    G_RatingColumns.sort(function (a, b) {
        return a.code - b.code;
    });
}

function loadRatingColumnsFromResponse(rows) {
    if (!rows || !rows.length) {
        return;
    }
    var raw = rows[0].RatingColumnMeta != null ? rows[0].RatingColumnMeta : rows[0].ratingColumnMeta;
    if (raw == null || raw === '') {
        return;
    }
    var list;
    try {
        list = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
        return;
    }
    applyRatingColumnList(list);
}

function isSkippedListColumn(key) {
    var name = String(key || '');
    if (!name || name === 'Code' || name === '__RowIndex') {
        return true;
    }
    if (/^ratingcolumnmeta$/i.test(name.replace(/\s+/g, ''))) {
        return true;
    }
    if (/^parameter\d+$/i.test(name.replace(/\s+/g, ''))) {
        return true;
    }
    return false;
}

function getListDisplayColumns(row) {
    if (!row) {
        return [];
    }
    return Object.keys(row).filter(function (key) {
        return !isSkippedListColumn(key);
    });
}

function getRatingColumnByDesp(name) {
    var target = String(name || '').trim().toLowerCase();
    for (var i = 0; i < G_RatingColumns.length; i++) {
        if (String(G_RatingColumns[i].desp).trim().toLowerCase() === target) {
            return G_RatingColumns[i];
        }
    }
    return null;
}

async function ensureRatingColumns(rows) {
    G_RatingColumns = [];
    loadRatingColumnsFromResponse(rows);
    if (G_RatingColumns.length) {
        return;
    }
    try {
        var response = await BuyingCapacityService.GetClientRatingMaster();
        applyRatingColumnList(normalizeApiList(response));
    } catch (e) { }
}

function ratingParamInputHtml(rowIndex, accountCode, col) {
    return '<input type="text" class="form-control form-control-sm box_border text-end bc-rating-param" id="txtRating_'
        + col.code + '_' + rowIndex + '" data-code="' + col.code + '" data-max="' + col.maxValue
        + '" inputmode="decimal" oninput="validateRatingParamInput(this)" onblur="onRatingParamBlur('
        + rowIndex + ',\'' + accountCode + '\')" autocomplete="off"/>';
}

function customerRatingInputHtml(rowIndex) {
    return '<input type="text" class="form-control form-control-sm box_border text-end bc-customer-rating" id="txtCustomerRating_'
        + rowIndex + '" readonly tabindex="-1" autocomplete="off"/>';
}

function readRatingParamValue(row, col) {
    if (!row || !col) {
        return null;
    }
    var direct = row['Parameter' + col.code];
    if (direct === undefined) {
        direct = row['parameter' + col.code];
    }
    if (direct === undefined || direct === null || direct === '') {
        direct = row[col.desp];
    }
    if (direct === undefined || direct === null || direct === '') {
        return null;
    }
    var n = parseFloat(direct);
    return isNaN(n) ? null : n;
}

function rowHasStoredRating(row) {
    return G_RatingColumns.some(function (col) {
        return readRatingParamValue(row, col) !== null;
    });
}

function recalcCustomerRating(index) {
    var total = 0;
    G_RatingColumns.forEach(function (col) {
        var el = document.getElementById('txtRating_' + col.code + '_' + index);
        if (!el || String(el.value).trim() === '') {
            return;
        }
        var n = parseFloat(el.value);
        if (!isNaN(n)) {
            total += n;
        }
    });
    var text = G_RatingColumns.length ? formatRatingNumber(total) : '';
    var $rating = $('#txtCustomerRating_' + index);
    if ($rating.length && G_RatingColumns.length) {
        $rating.val(text);
    }
    return text;
}

function collectRatingParameters(index, baseItem) {
    var values = {};
    for (var n = 1; n <= 10; n++) {
        values[n] = 0;
    }
    G_RatingColumns.forEach(function (col) {
        var el = document.getElementById('txtRating_' + col.code + '_' + index);
        var raw = el ? String(el.value || '').trim() : '';
        var n = raw === '' ? 0 : parseFloat(raw);
        values[col.code] = isNaN(n) ? 0 : n;
    });
    if (baseItem) {
        for (var p = 1; p <= 10; p++) {
            var active = false;
            for (var c = 0; c < G_RatingColumns.length; c++) {
                if (G_RatingColumns[c].code === p) {
                    active = true;
                    break;
                }
            }
            if (!active) {
                var existing = baseItem['Parameter' + p];
                if (existing === undefined || existing === null || existing === '') {
                    values[p] = 0;
                } else {
                    var parsed = parseFloat(existing);
                    values[p] = isNaN(parsed) ? 0 : parsed;
                }
            }
        }
    }
    return values;
}

function buildRatingToken(values) {
    var parts = [];
    for (var n = 1; n <= 10; n++) {
        parts.push(n + '=' + formatRatingNumber(values[n] || 0));
    }
    return 'RC|' + parts.join(',');
}

function buildRatingQuery(values) {
    var obj = {};
    for (var n = 1; n <= 10; n++) {
        obj['Parameter' + n] = values[n] || 0;
    }
    return obj;
}

function validateRatingParamInput(input) {
    var value = String(input.value || '').replace(/[^0-9.]/g, '');
    var parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts[1];
    }
    if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
    }
    if (value.length > 8) {
        value = value.slice(0, 8);
    }
    input.value = value;
}

function onRatingParamBlur(index, accountCode) {
    if (G_SuppressSave) {
        return;
    }
    var capped = false;
    G_RatingColumns.forEach(function (col) {
        var el = document.getElementById('txtRating_' + col.code + '_' + index);
        if (!el || String(el.value).trim() === '') {
            return;
        }
        var n = parseFloat(el.value);
        if (!isNaN(n) && col.maxValue > 0 && n > col.maxValue) {
            toastr.error(col.desp + ' cannot be greater than ' + formatRatingNumber(col.maxValue));
            el.value = formatRatingNumber(col.maxValue);
            capped = true;
        }
    });
    recalcCustomerRating(index);
    SaveBuyingCapacity(index, accountCode, 'rating');
    return capped;
}

$(document).ready(async function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    lockBuyingCapacityHorizontalScroll();

    $("#btnShow").click(function () {
        if (!G_SalesPersonBound) {
            toastr.error('Please wait, sales person list is loading');
            return false;
        }
        var MarketingMan_Name = $("#ddlMarketingMan").val();

        if (MarketingMan_Name == undefined || MarketingMan_Name == '') {
            toastr.error('Please select Sales Person');
            return false;
        }
        GetBuyingCapacityList();
    });

    try {
        await initBuyingCapacityPage();
    } catch (err) {
        console.error('Buying Capacity page init failed:', err);
    }
});

async function initBuyingCapacityPage() {
    var bound = await GetNestedMarketingManList();
    if (bound) {
        await GetBuyingCapacityList();
    }
}
function getUrlVars() {
    var vars = {};
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}
function applySalesPersonDropdownBinding(response) {
    var rows = normalizeApiList(response);
    if (!rows.length) {
        return false;
    }

    var matchedPersonName = null;
    var marketingList = [];
    var personNames = [];
    var userMaster_Code = null;

    try {
        var authKeyStr = sessionStorage.getItem('authKey');
        if (authKeyStr) {
            var authKey = JSON.parse(authKeyStr);
            userMaster_Code = authKey ? authKey.UserMaster_Code : null;
        }
    } catch (e) {
        console.error('Error parsing authKey:', e);
        userMaster_Code = null;
    }

    for (var i = 0; i < rows.length; i++) {
        var person = rows[i];
        if (person && person.PersonName) {
            var personName = String(person.PersonName).trim();
            if (!personName) {
                continue;
            }
            var userCode = person.Usermaster_Code != null ? person.Usermaster_Code : person.UserMaster_Code;
            if (userMaster_Code != null && userCode == userMaster_Code) {
                matchedPersonName = personName;
            }
            personNames.push(personName);
            marketingList.push({
                Code: personName,
                Desp: personName
            });
        }
    }

    if (marketingList.length === 0) {
        return false;
    }

    var $ddl = $('#ddlMarketingMan');
    if (!$ddl.length) {
        return false;
    }

    BindSelectList1($ddl[0], marketingList);

    var urlParams = getUrlVars();
    var urlMarketingMan = decodeURIComponent((urlParams['MarketingMan_Name'] || '').replace(/\+/g, ' ')).trim();
    var targetValue;
    if (urlMarketingMan === '') {
        targetValue = matchedPersonName ? matchedPersonName : 'ALL';
    } else {
        targetValue = urlMarketingMan;
    }

    if (personNames.indexOf(targetValue) < 0 && targetValue !== 'ALL') {
        targetValue = matchedPersonName ? matchedPersonName : 'ALL';
    }

    initSalesPersonSelect2($ddl);
    $ddl.val(targetValue);
    if (!$ddl.val()) {
        $ddl.val('ALL');
    }
    try {
        $ddl.trigger('change.select2');
    } catch (e) {
        $ddl.trigger('change');
    }

    G_SalesPersonBound = true;
    $ddl.prop('disabled', false);
    $('#btnShow, #btnExportExcel').prop('disabled', false);
    return true;
}

async function GetNestedMarketingManList() {
    if (G_SalesPersonLoadPromise) {
        return G_SalesPersonLoadPromise;
    }

    G_SalesPersonLoadPromise = (async function () {
        G_SalesPersonBound = false;
        var $ddl = await waitForElement('#ddlMarketingMan');
        if (!$ddl || !$ddl.length) {
            toastr.error('Page not ready. Please refresh the page.');
            return false;
        }

        $ddl.prop('disabled', true).empty();
        $('#btnShow, #btnExportExcel').prop('disabled', true);
        if (typeof Showloader === 'function') {
            Showloader();
        }

        try {
            var authKey = await waitForAuthKey(80, 100);
            if (!authKey) {
                toastr.error('Session not ready. Please refresh the page.');
                return false;
            }

            var lastError = null;
            for (var attempt = 0; attempt < BC_SALES_PERSON_MAX_RETRIES; attempt++) {
                try {
                    var response = await BuyingCapacityService.GetNestedMarketingManList();
                    lastError = null;
                    if (applySalesPersonDropdownBinding(response)) {
                        return true;
                    }
                } catch (err) {
                    lastError = err;
                }

                if (attempt < BC_SALES_PERSON_MAX_RETRIES - 1) {
                    await delay(BC_SALES_PERSON_RETRY_DELAY_MS);
                    await waitForAuthKey(10, 100);
                }
            }

            if (lastError) {
                throw lastError;
            }

            toastr.error('No Data Found');
            $ddl.prop('disabled', false);
            return false;
        } catch (error) {
            console.error('Error loading marketing person list:', error);
            toastr.error('Error loading sales person list');
            $('#ddlMarketingMan').prop('disabled', false);
            return false;
        } finally {
            if (typeof HideLoader === 'function') {
                HideLoader();
            }
        }
    })();

    try {
        return await G_SalesPersonLoadPromise;
    } finally {
        G_SalesPersonLoadPromise = null;
    }
}
async function GetBuyingCapacityList() {
    if (!G_SalesPersonBound) {
        toastr.error('Please wait, sales person list is loading');
        return;
    }
    var MarketingPersonName = $("#ddlMarketingMan").val();
    // Procedure expects 'All' (not 'ALL') when showing all marketing persons
    if (MarketingPersonName === 'ALL' || MarketingPersonName === '0') {
        MarketingPersonName = 'All';
    }

    try {
        Showloader();
        const response = await BuyingCapacityService.GetBuyingCapacityList(MarketingPersonName);
        $('#BuyingCapacity').show();
        if (response && response.length > 0) {
            G_BuyingCapacityRows = response.map(function(item, index) {
                return {
                    ...item,
                    __RowIndex: index
                };
            });
            await ensureRatingColumns(G_BuyingCapacityRows);
            const displayColumns = getListDisplayColumns(G_BuyingCapacityRows[0]);
            const StringFilterColumn = ["Party Name", "Mkt Person", "Country", "City", "State", "PinCode"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                "S.No.": "right",
                "PinCode": "right",
                "Monthly Req(Qty)": "right",
                "Customer Rating": "right"
            };
            G_RatingColumns.forEach(function (col) {
                ColumnAlignment[col.desp] = "right";
            });
            const updatedResponse = G_BuyingCapacityRows.map((item) => {
                const rowIndex = item.__RowIndex;
                const accountCode = item.Code;
                var rowObj = {};
                displayColumns.forEach(function (colName) {
                    var ratingCol = getRatingColumnByDesp(colName);
                    var key = String(colName).replace(/\s+/g, '').toLowerCase();
                    if (key === 'buyingfrequency') {
                        rowObj[colName] = `<select type="text" class="form-control form-control-sm box_border" id="ddlFillBuyingFrequency_${rowIndex}" onchange="SaveBuyingCapacity(${rowIndex},'${accountCode}')"></select>`;
                    } else if (key === 'monthlyreq(qty)' || key === 'monthlyrequiredqty') {
                        rowObj[colName] = `<input type="text" class="form-control form-control-sm box_border text-end" id="txtMonthlyRequired_${rowIndex}" oninput="validateDecimalRateInput(this)" onblur="SaveBuyingCapacity(${rowIndex},'${accountCode}')" autocomplete="off"/>`;
                    } else if (ratingCol) {
                        rowObj[colName] = ratingParamInputHtml(rowIndex, accountCode, ratingCol);
                    } else if (key === 'customerrating') {
                        rowObj[colName] = G_RatingColumns.length
                            ? customerRatingInputHtml(rowIndex)
                            : `<input type="text" class="form-control form-control-sm box_border text-end" id="txtCustomerRating_${rowIndex}" maxlength="100" onblur="SaveBuyingCapacity(${rowIndex},'${accountCode}')" autocomplete="off"/>`;
                    } else if (key === 'gprolling') {
                        rowObj[colName] = `<select type="text" class="form-control form-control-sm box_border" id="ddlFillGPRolling_${rowIndex}" onchange="SaveBuyingCapacity(${rowIndex},'${accountCode}')"></select>`;
                    } else if (key === 's.no.' || key === 'sno' || key === 's.no') {
                        rowObj[colName] = pickField(item, ['S.No.', 'S.No', 'SNo', 'SrNo', 'Sr No'], rowIndex + 1);
                    } else {
                        rowObj[colName] = item[colName] != null ? item[colName] : '';
                    }
                });
                Object.defineProperty(rowObj, 'Code', { value: accountCode, enumerable: false, writable: true });
                Object.defineProperty(rowObj, '__RowIndex', { value: rowIndex, enumerable: false, writable: true });
                return rowObj;
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-BuyingCapacity", "table-body-BuyingCapacity", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
            layoutBuyingCapacityTable();

            // Ensure dropdown options are populated first
            await FillBuyingFrequency();
            await FillBuyingGPRolling();

            G_SuppressSave = true;
            try {
                for (var i = 0; i < G_BuyingCapacityRows.length; i++) {
                    var row = G_BuyingCapacityRows[i] || {};
                    var domIndex = typeof row.__RowIndex === 'number' ? row.__RowIndex : i;
                    bindBuyingCapacityRow(domIndex, G_BuyingCapacityRows[domIndex] || {});
                }
            } catch (e) { }
            finally {
                setTimeout(function () {
                    G_SuppressSave = false;
                    layoutBuyingCapacityTable();
                }, 0);
            }
        }
        else {
            $('#BuyingCapacity').hide();
            toastr.error('No Data Found');
        }
    } catch (error) {
        $('#BuyingCapacity').hide();
        toastr.error('Error loading buying capacity data');
    } finally {
        layoutBuyingCapacityTable();
        resetBuyingCapacityTableScroll();
        HideLoader();
    }
}

function bindBuyingCapacityRow(domIndex, baseRow) {
    baseRow = baseRow || {};
    var bfText = baseRow.BuyingFrequency || baseRow['Buying Frequency'] || '';
    var codeMap = { 'M': 'Monthly', 'O': 'Occasionally', 'W': 'Weekly' };
    if (bfText && codeMap[bfText]) {
        bfText = codeMap[bfText];
    }
    var qty = pickField(baseRow, ['MonthlyRequiredQty', 'Monthly Req(Qty)', 'Monthly Required(Qty)']);
    var customerRating = baseRow['Customer Rating'] != null ? baseRow['Customer Rating'] : (baseRow.CustomerRating != null ? baseRow.CustomerRating : (baseRow.Ratings != null ? baseRow.Ratings : ''));
    if (typeof customerRating === 'string' && customerRating.indexOf('RC|') === 0) {
        customerRating = '';
    }
    var gpRolling = baseRow.GPRolling != null ? baseRow.GPRolling : (baseRow['GP Rolling'] != null ? baseRow['GP Rolling'] : '');

    try {
        if (bfText && typeof BizSolHelperFunction !== 'undefined' && BizSolHelperFunction.SelectOptionByText) {
            BizSolHelperFunction.SelectOptionByText('ddlFillBuyingFrequency_' + domIndex, bfText);
        } else {
            var $bfSel = $('#ddlFillBuyingFrequency_' + domIndex);
            if ($bfSel && $bfSel.length) {
                $bfSel.find('option').filter(function () { return $(this).text() === bfText; }).prop('selected', true);
                try {
                    if ($bfSel.select2) { $bfSel.trigger('change.select2'); } else { $bfSel.trigger('change'); }
                } catch (e2) { $bfSel.trigger('change'); }
            }
        }
    } catch (e1) { }

    var $qtyInp = $('#txtMonthlyRequired_' + domIndex);
    if ($qtyInp && $qtyInp.length) {
        if (qty !== '' && !isNaN(qty)) { $qtyInp.val(parseFloat(qty).toFixed(3)); } else { $qtyInp.val(''); }
    }

    var hasStoredRating = rowHasStoredRating(baseRow);
    G_RatingColumns.forEach(function (col) {
        var $param = $('#txtRating_' + col.code + '_' + domIndex);
        if (!$param.length) {
            return;
        }
        if (hasStoredRating) {
            var stored = readRatingParamValue(baseRow, col);
            $param.val(stored === null ? '' : formatRatingNumber(stored));
        } else {
            $param.val('');
        }
    });

    var $ratingInp = $('#txtCustomerRating_' + domIndex);
    if ($ratingInp && $ratingInp.length) {
        if (G_RatingColumns.length && hasStoredRating) {
            $ratingInp.val(recalcCustomerRating(domIndex));
        } else {
            $ratingInp.val(customerRating || '');
        }
    }

    try {
        SelectGPRollingOption('ddlFillGPRolling_' + domIndex, gpRolling);
    } catch (e3) { }
}

function SaveBuyingCapacity(index, Code, source) {
    try {
        if (G_SuppressSave) {
            return;
        }
        var baseItem = (G_BuyingCapacityRows && G_BuyingCapacityRows.length > index) ? G_BuyingCapacityRows[index] : null;
        if (!baseItem) {
            toastr.error('Row context not found');
            return;
        }
        var buyingFrequency = $('#ddlFillBuyingFrequency_' + index).val();
        var frequencyToSave = (!buyingFrequency || buyingFrequency === '0') ? null : buyingFrequency;
        var monthlyQtyStr = ($('#txtMonthlyRequired_' + index).val() || '').trim();
        var monthlyQty = monthlyQtyStr !== '' ? parseFloat(monthlyQtyStr) : null;
        var gpRollingVal = $('#ddlFillGPRolling_' + index).val();
        var gpRolling = (gpRollingVal && gpRollingVal !== '0') ? gpRollingVal : '';
        var ratingValues = G_RatingColumns.length ? collectRatingParameters(index, baseItem) : null;
        var ratingTotal = G_RatingColumns.length ? recalcCustomerRating(index) : (($('#txtCustomerRating_' + index).val() || '').trim());

        if (source !== 'rating' && !frequencyToSave) {
            return;
        }
        if (monthlyQty !== null && (isNaN(monthlyQty) || monthlyQty < 0)) {
            toastr.error('Enter a valid Monthly Required Qty');
            return;
        }
        if (ratingValues) {
            for (var c = 0; c < G_RatingColumns.length; c++) {
                var col = G_RatingColumns[c];
                if (col.maxValue > 0 && ratingValues[col.code] > col.maxValue) {
                    toastr.error(col.desp + ' cannot be greater than ' + formatRatingNumber(col.maxValue));
                    return;
                }
            }
        }

        var payload = {
            Code: 0,
            AccountMaster_Code: parseInt(Code, 10) || 0,
            BuyingFrequency: frequencyToSave,
            MonthlyRequiredQty: monthlyQty,
            CustomerRating: ratingValues ? buildRatingToken(ratingValues) : (ratingTotal || ''),
            GPRolling: gpRolling
        };
        if (ratingValues) {
            var ratingQuery = buildRatingQuery(ratingValues);
            payload.QueryCondition = JSON.stringify(ratingQuery);
            for (var n = 1; n <= 10; n++) {
                payload['Parameter' + n] = ratingValues[n];
            }
        }

        Showloader();
        BuyingCapacityService.SaveBuyingCapacity(JSON.stringify(payload)).then(function (response) {
            HideLoader();
            if (response) {
                var msg = response.Message || response.Msg || '';
                if (response.Status === 'Y') {
                    if (ratingValues && baseItem) {
                        for (var p = 1; p <= 10; p++) {
                            baseItem['Parameter' + p] = ratingValues[p];
                        }
                        baseItem['Customer Rating'] = ratingTotal;
                        baseItem.CustomerRating = ratingTotal;
                        baseItem.Ratings = ratingTotal;
                    }
                    toastr.success(msg || 'Saved successfully');
                } else if (response.Status === 'N') {
                    toastr.error(msg || 'Save failed');
                } else {
                    toastr.info(msg || 'Updated successfully');
                }
            } else {
                toastr.error('No response received');
            }
        }).catch(function (error) {
            HideLoader();
            toastr.error('Error saving row');
        });
    } catch (e) {
        toastr.error('Unexpected error while saving');
    }
}

function readSelectDisplay(id, fallback) {
    var el = document.getElementById(id);
    if (!el) {
        return fallback;
    }
    if (el.selectedIndex >= 0 && el.options[el.selectedIndex]) {
        var text = String(el.options[el.selectedIndex].text || '').trim();
        if (text && text.toLowerCase() !== 'select' && text !== '0') {
            return text;
        }
    }
    return el.value || fallback;
}

function mapBuyingCapacityExportRow(item, index) {
    var rowIndex = typeof item.__RowIndex === 'number' ? item.__RowIndex : index;
    var qtyEl = document.getElementById('txtMonthlyRequired_' + rowIndex);
    var ratingEl = document.getElementById('txtCustomerRating_' + rowIndex);
    var row = {
        'S.No.': pickField(item, ['S.No.', 'S.No', 'SNo', 'SrNo', 'Sr No'], rowIndex + 1),
        'Party Name': pickField(item, ['Party Name', 'PartyName']),
        'Mkt Person': pickField(item, ['Marketing Person', 'Mkt Person', 'PersonName']),
        'Country': pickField(item, ['Country']),
        'State': pickField(item, ['State']),
        'City': pickField(item, ['City']),
        'PinCode': pickField(item, ['PinCode']),
        'Buying Frequency': readSelectDisplay('ddlFillBuyingFrequency_' + rowIndex, pickField(item, ['Buying Frequency', 'BuyingFrequency'])),
        'Monthly Req(Qty)': (qtyEl && qtyEl.value !== '') ? qtyEl.value : pickField(item, ['MonthlyRequiredQty', 'Monthly Req(Qty)', 'Monthly Required(Qty)'])
    };
    G_RatingColumns.forEach(function (col) {
        var el = document.getElementById('txtRating_' + col.code + '_' + rowIndex);
        var stored = readRatingParamValue(item, col);
        row[col.desp] = (el && el.value !== '') ? el.value : (stored === null ? '' : formatRatingNumber(stored));
    });
    row['Customer Rating'] = (ratingEl && ratingEl.value !== '') ? ratingEl.value : pickField(item, ['Customer Rating', 'CustomerRating', 'Ratings']);
    row['GP Rolling'] = readSelectDisplay('ddlFillGPRolling_' + rowIndex, pickField(item, ['GP Rolling', 'GPRolling']));
    return row;
}

function ExportExcel() {
    if (!G_SalesPersonBound) {
        toastr.error('Please wait, sales person list is loading');
        return;
    }
    var MarketingPersonName = $("#ddlMarketingMan").val();
    if (MarketingPersonName == undefined || MarketingPersonName === '') {
        toastr.error('Please select Sales Person');
        return;
    }
    var hiddenFields = ["Code", "__RowIndex", "Marketing Person", "PersonName", "MonthlyRequiredQty", "Monthly Required(Qty)", "RatingColumnMeta", "Parameter1", "Parameter2", "Parameter3", "Parameter4", "Parameter5", "Parameter6", "Parameter7", "Parameter8", "Parameter9", "Parameter10"];

    // Use already-loaded grid data so iOS still has the user tap for Share.
    if (G_BuyingCapacityRows && G_BuyingCapacityRows.length > 0) {
        var exportRows = G_BuyingCapacityRows.map(mapBuyingCapacityExportRow);
        var result = ExportToExcelControl.ExportToExcel(exportRows, hiddenFields, "BuyingCapacity");
        if (result === true) {
            toastr.success('Export completed successfully.');
        }
        return;
    }

    // Procedure expects 'All' (not 'ALL') when exporting all marketing persons
    if (MarketingPersonName === 'ALL' || MarketingPersonName === '0') {
        MarketingPersonName = 'All';
    }

    Showloader();
    BuyingCapacityService.GetBuyingCapacityList(MarketingPersonName).then(function (response) {
        HideLoader();
        if (response && response.length > 0) {
            G_BuyingCapacityRows = response.map(function (item, index) {
                return Object.assign({}, item, { __RowIndex: index });
            });
            var fetchedRows = G_BuyingCapacityRows.map(mapBuyingCapacityExportRow);
            var fetchedResult = ExportToExcelControl.ExportToExcel(fetchedRows, hiddenFields, "BuyingCapacity");
            if (fetchedResult === true) {
                toastr.success('Export completed successfully.');
            }
        } else {
            toastr.info('No data to export.');
        }
    }).catch(function (error) {
        HideLoader();
        toastr.error((error && (error.Msg || error.message)) || 'Error during export.');
    });
}

async function FillBuyingFrequency(selectId) {
    try {
        const response = await BuyingCapacityService.GetBuyingFrequency();
        if (response && response.length > 0) {
            var list = response.map(function (item) {
                return { Code: item.ShortDesp, Desp: item.Value };
            });

            function bindOptions($select) {
                if (!$select || $select.length === 0) { return; }
                var option = '<option value="0">Select</option>';
                for (var i = 0; i < list.length; i++) {
                    option += '<option value="' + list[i].Code + '">' + list[i].Desp + '</option>';
                }
                $select.html(option);
                try {
                    if ($select.select2) {
                        $select.select2({ width: '100%', dropdownParent: $(document.body) });
                    }
                } catch(e) { }
            }

            if (selectId && typeof selectId === 'string') {
                bindOptions($('#' + selectId));
            } else {
                $('[id^=ddlFillBuyingFrequency_]').each(function () {
                    bindOptions($(this));
                });
            }
        } else {
            toastr.error('No data received or empty response');
        }
    } catch (error) {
        toastr.error('Error fetching buying frequency');
    }
}
async function FillBuyingGPRolling(selectId) {
    try {
        const response = await BuyingCapacityService.GetBuyingGPRollingCategory();
        if (response && response.length > 0) {
            var list = response.map(function (item) {
                // Store the descriptive string in RollingGPCategory: use Description as both value and text
                var text = (item.Description != null ? item.Description : (item.Desp != null ? item.Desp : item.Value));
                return { Code: text, Desp: text };
            });

            function bindOptions($select) {
                if (!$select || $select.length === 0) { return; }
                var option = '<option value="0">Select</option>';
                for (var i = 0; i < list.length; i++) {
                    option += '<option value="' + list[i].Code + '">' + list[i].Desp + '</option>';
                }
                $select.html(option);
                try {
                    if ($select.select2) {
                        $select.select2({ width: '100%', dropdownParent: $(document.body) });
                    }
                } catch(e) { }
            }

            if (selectId && typeof selectId === 'string') {
                bindOptions($('#' + selectId));
            } else {
                $('[id^=ddlFillGPRolling_]').each(function () {
                    bindOptions($(this));
                });
            }
        } else {
            toastr.error('No data received or empty response');
        }
    } catch (error) {
        toastr.error('Error fetching GP rolling category');
    }
}
function SelectGPRollingOption(selectId, gpValue) {
    var $sel = $('#' + selectId);
    if (!$sel || $sel.length === 0) { return; }
    if (gpValue == null || gpValue === '') { return; }
    var target = String(gpValue).trim();
    var matched = false;
    // Try match by option value first
    $sel.find('option').each(function () {
        if (!matched && String($(this).val()).trim() === target) {
            $(this).prop('selected', true);
            matched = true;
        }
    });
    // Fallback: match by option text
    if (!matched) {
        $sel.find('option').each(function () {
            if (!matched && String($(this).text()).trim() === target) {
                $(this).prop('selected', true);
                matched = true;
            }
        });
    }
    if (matched) {
        try {
            if ($sel.select2) { $sel.trigger('change.select2'); } else { $sel.trigger('change'); }
        } catch (e) { $sel.trigger('change'); }
    }
}
function validateDecimalRateInput(input) {
    let value = input.value.replace(/[^0-9.]/g, '');
    let parts = value.split('.');
    if (parts.length > 3) {
        value = parts[0] + '.' + parts[1];
    }
    if (value.length > 8) {
        value = value.slice(0, 8);
    }
    if (parts[1] && parts[1].length > 3) {
        value = parts[0] + '.' + parts[1].slice(0, 3);
    }
    input.value = value;
}
function BindSelectList1(element, list) {
    let option = '<option value="ALL">ALL</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + escapeHtmlAttr(val.Code) + '">' + escapeHtmlAttr(val.Desp) + '</option>';
    });
    element.innerHTML = option;
}

function BindSelectList2(element, list) {
    let option = '<option value="0">Select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
$(document).on('click', '[onclick*="applyStringFilters"], [onclick*="applyNumericFilter"], [onclick*="applyfilterdate"], [onclick*="ClearFilter"]', function () {
    // Skip totals row for Pipe Stock tab
    //if ($('#pipe-stock-tab').hasClass('active')) {
    //    return;
    //}
    setTimeout(function () {
        var filteredRows = window['filteredData_BuyingCapacity'] || [];
        refreshBuyingCapacityRowControls(filteredRows);
    }, 300);
});
function refreshBuyingCapacityRowControls(rows) {
    if (!rows || rows.length === 0) {
        adjustFilterDropdownPosition();
        return;
    }

    Promise.all([FillBuyingFrequency(), FillBuyingGPRolling()]).then(function () {
        G_SuppressSave = true;
        try {
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i] || {};
                var domIndex = typeof row.__RowIndex === 'number' ? row.__RowIndex : i;
                var baseRow = (G_BuyingCapacityRows && G_BuyingCapacityRows.length > domIndex) ? G_BuyingCapacityRows[domIndex] : {};
                bindBuyingCapacityRow(domIndex, baseRow);
            }
        } catch (error) {
            console.error('Error rebinding buying capacity controls:', error);
        } finally {
            setTimeout(function () {
                G_SuppressSave = false;
                layoutBuyingCapacityTable();
                resetBuyingCapacityTableScroll();
                adjustFilterDropdownPosition();
            }, 0);
        }
    }).catch(function (error) {
        console.error('Error refreshing buying frequency after filtering:', error);
        G_SuppressSave = false;
        adjustFilterDropdownPosition();
    });
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
        
        /* Only the inner scroller may scroll; the shell stays clipped */
        @media (min-width: 1200px) {
            #BuyingCapacityPage .bc-scroll {
                overflow-x: auto;
                overflow-y: auto;
            }
        }
        
        #BuyingCapacityPage {
            overflow-x: clip;
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


window.GetBuyingCapacityList = GetBuyingCapacityList;
window.GetNestedMarketingManList = GetNestedMarketingManList;
window.getUrlVars = getUrlVars;
window.FillBuyingFrequency = FillBuyingFrequency;
window.FillBuyingGPRolling = FillBuyingGPRolling;
window.SelectGPRollingOption = SelectGPRollingOption;
window.validateDecimalRateInput = validateDecimalRateInput;
window.validateRatingParamInput = validateRatingParamInput;
window.onRatingParamBlur = onRatingParamBlur;
window.SaveBuyingCapacity = SaveBuyingCapacity;
window.ExportExcel = ExportExcel;
