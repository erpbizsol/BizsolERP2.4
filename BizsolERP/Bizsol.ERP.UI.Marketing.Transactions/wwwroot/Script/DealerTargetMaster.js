import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { DealerTargetMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/DealerTargetMasterService.js';

let G_DealerTargetList = [];
let G_DealerRawList = [];
let G_MonthList = [];
let G_MarketingManList = [];
let G_FinYear = '';
let G_HeaderCode = 0;
let G_SalesPersonReady = false;
let G_PartyReady = false;
let G_MonthReady = false;
let G_AutoShown = false;
let G_SuppressSalesPersonChange = false;
let G_RowFilter = 'all';
const DEALER_TARGET_STATE_KEY = 'DealerTargetMasterState';

function firstPayloadArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (typeof payload !== 'object') return [];

    const named = ['data', 'Data', 'result', 'Result', 'table', 'Table', 'items', 'Items', '$values'];
    for (let i = 0; i < named.length; i++) {
        if (Array.isArray(payload[named[i]]) && payload[named[i]].length) return payload[named[i]];
    }

    const keys = Object.keys(payload);
    for (let i = 0; i < keys.length; i++) {
        const value = payload[keys[i]];
        if (Array.isArray(value) && value.length && typeof value[0] === 'object') {
            return value;
        }
    }
    return [];
}

function collectObjectArrays(payload) {
    const arrays = [];
    if (!payload) return arrays;
    if (Array.isArray(payload)) {
        arrays.push(payload);
        return arrays;
    }
    if (typeof payload !== 'object') return arrays;
    Object.keys(payload).forEach(function (key) {
        const value = payload[key];
        if (Array.isArray(value) && value.length && typeof value[0] === 'object') {
            arrays.push(value);
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            collectObjectArrays(value).forEach(function (nested) {
                arrays.push(nested);
            });
        }
    });
    return arrays;
}

function pick(row, names, fallback) {
    if (!row) return fallback;
    for (let i = 0; i < names.length; i++) {
        const key = names[i];
        if (row[key] !== undefined && row[key] !== null && String(row[key]) !== '') {
            return row[key];
        }
        const found = Object.keys(row).find(function (k) {
            return k.toLowerCase() === String(key).toLowerCase();
        });
        if (found && row[found] !== undefined && row[found] !== null && String(row[found]) !== '') {
            return row[found];
        }
    }
    return fallback;
}

function pickAny(row, names, fallback) {
    if (!row) return fallback;
    for (let i = 0; i < names.length; i++) {
        const key = names[i];
        if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== undefined) {
            return row[key];
        }
        const found = Object.keys(row).find(function (k) {
            return k.toLowerCase() === String(key).toLowerCase();
        });
        if (found && row[found] !== undefined) {
            return row[found];
        }
    }
    return fallback;
}

function toNumber(val) {
    const n = parseFloat(String(val == null ? '' : val).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
}

function toInt(val) {
    const n = parseInt(val, 10);
    return isNaN(n) ? 0 : n;
}

function pad2(val) {
    return String(val).padStart(2, '0');
}

function escapeAttr(val) {
    return String(val == null ? '' : val)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function normalizeText(text) {
    var newValue = '';
    var specialChars = ".-#,=}]')[(*&$/@@ ";
    for (var i = 0; i < String(text || '').length; i++) {
        if (!specialChars.includes(text[i])) {
            newValue += text[i];
        }
    }
    return newValue.toUpperCase();
}

function getFinancialYear() {
    if (BizSolHelperFunction && typeof BizSolHelperFunction.getFinancialYear === 'function') {
        return BizSolHelperFunction.getFinancialYear();
    }
    const currentDate = new Date();
    let startYear = currentDate.getFullYear();
    if (currentDate.getMonth() < 3) startYear = startYear - 1;
    return startYear + '-' + (startYear + 1);
}

function getSelectedTargetFor() {
    return 'Amount';
}

function isQuantityTarget() {
    return false;
}

function amountPrefix() {
    return '₹';
}

function isInactiveStatus(status) {
    const text = String(status || '').toLowerCase();
    return text === 'de-active' || text === 'deactive' || text === 'inactive' || text === 'n' || text === 'no';
}

function hasTargetAmount(value) {
    return value !== null && value !== undefined && String(value).trim() !== '';
}

function sanitizeAmountInput(raw) {
    let value = String(raw || '').replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts[1];
    }
    if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
    }
    return value;
}

function getFinancialYearStart() {
    const fy = getSelectedFinYear();
    return parseInt(String(fy).split('-')[0], 10) || new Date().getFullYear();
}

function resolveMonthYear(monthNumber, explicitYear) {
    const year = toInt(explicitYear);
    if (year) return year;
    const start = getFinancialYearStart();
    return toInt(monthNumber) >= 4 ? start : start + 1;
}

function initSearchableSelect($el) {
    if (!$el || !$el.length || typeof $el.select2 !== 'function') return;
    try {
        if ($el.hasClass('select2-hidden-accessible')) {
            $el.select2('destroy');
        }
    } catch (e) { }

    $el.select2({
        width: '100%',
        dropdownParent: $(document.body),
        placeholder: $el.data('placeholder') || 'Select',
        allowClear: false,
        minimumResultsForSearch: 0,
        matcher: function (params, data) {
            if ($.trim(params.term) === '') return data;
            if (!data.id) return null;
            if (data.text && data.text.toLowerCase().indexOf(params.term.toLowerCase()) > -1) {
                return data;
            }
            return null;
        }
    });
}

function destroySearchableSelect($el) {
    if (!$el || !$el.length) return;
    try {
        if ($el.hasClass('select2-hidden-accessible') && typeof $el.select2 === 'function') {
            $el.select2('destroy');
        }
    } catch (e) { }
}

function bindSearchableSelect($el, html, value) {
    destroySearchableSelect($el);
    $el.html(html);
    initSearchableSelect($el);
    const selected = value === undefined || value === null ? '' : String(value);
    $el.val(selected);
    try {
        $el.trigger('change.select2');
    } catch (e) { }
}

function getSelectedPartyName() {
    const code = ($('#txtPartyName').val() || '').trim();
    if (!code) return '';
    return ($('#txtPartyName option:selected').text() || '').trim();
}

function getSelectedMonthRow() {
    syncMonthSelection();
    const selectedValue = ($('#txtMonthName').val() || '').trim().toLowerCase();
    return G_MonthList.find(function (row) {
        return String(row.MonthNameWithYear).toLowerCase() === selectedValue;
    }) || null;
}

function getSelectedTargetedDate() {
    const found = getSelectedMonthRow();
    const monthNumber = found ? found.MonthNumber : getSelectedMonthNumber();
    const monthYear = resolveMonthYear(monthNumber, found && found.MonthYear);
    if (monthNumber && monthYear) {
        return monthYear + '-' + pad2(monthNumber) + '-01';
    }
    return getSelectedMonthName();
}

function bindMonthDropdown() {
    G_MonthList = [];

    DealerTargetMasterService.GetMonth().then(function (response) {
        const rows = firstPayloadArray(response);
        if (!rows.length) {
            toastr.warning('No Month data found');
            return;
        }

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        let defaultValue = '';
        let option = '';

        G_MonthList = rows.map(function (row) {
            const monthNameWithYear = String(pick(row, ['MonthNameWithYear'], '')).trim();
            const monthName = String(pick(row, ['MonthName'], '')).trim();
            const monthNumber = toInt(pick(row, ['MonthNumber'], 0));
            const monthYear = toInt(pick(row, ['MonthYear'], 0));
            return {
                MonthNameWithYear: monthNameWithYear,
                MonthName: monthName,
                MonthNumber: monthNumber,
                MonthYear: monthYear,
                LastDayOfMonth: pick(row, ['LastDayOfMonth'], ''),
                QuarterNo: pick(row, ['QuarterNo'], ''),
                HalfYear: pick(row, ['HalfYear'], '')
            };
        }).filter(function (row) {
            return !!row.MonthNameWithYear;
        });

        for (let i = 0; i < G_MonthList.length; i++) {
            const row = G_MonthList[i];
            if (row.MonthNumber === currentMonth && (row.MonthYear === currentYear || !row.MonthYear)) {
                defaultValue = row.MonthNameWithYear;
            }
            option += '<option value="' + escapeAttr(row.MonthNameWithYear) +
                '" data-month-number="' + escapeAttr(row.MonthNumber) +
                '" data-month-name="' + escapeAttr(row.MonthName) +
                '" data-month-year="' + escapeAttr(row.MonthYear) +
                '">' + escapeAttr(row.MonthNameWithYear) + '</option>';
        }

        if (!defaultValue && G_MonthList.length) {
            defaultValue = G_MonthList[0].MonthNameWithYear;
        }

        bindSearchableSelect($('#txtMonthName'), '<option value="">Select month</option>' + option, defaultValue);
        syncMonthSelection();
        G_MonthReady = true;
        tryAutoShowDealerTargets();
    }).catch(function (error) {
        toastr.error((error && (error.Msg || error.message)) || 'Failed to load month list.');
    });
}

function getSelectedMarketingManCode() {
    const selected = ($('#ddlMarketingMan').val() || $('#hdnMarketingManMasterCode').val() || '').trim();
    return toInt(selected);
}

function syncMarketingManCode() {
    const selectedCode = ($('#ddlMarketingMan').val() || '').trim();
    $('#hdnMarketingManMasterCode').val(selectedCode || '');
    return toInt(selectedCode);
}

function syncPartyCode() {
    const selectedCode = ($('#txtPartyName').val() || '').trim();
    $('#hdnPartyCode').val(selectedCode || '');
    return toInt(selectedCode);
}

function clearDistributorDropdown(placeholder) {
    const label = placeholder || 'Select';
    bindSearchableSelect($('#txtPartyName'), '<option value="">' + escapeAttr(label) + '</option>', '');
    syncPartyCode();
    G_PartyReady = false;
}

function getSelectedParty() {
    const name = getSelectedPartyName();
    const code = syncPartyCode();
    if (!name || !code) return null;
    return { Code: code, AccountDesp: name };
}

function syncMonthSelection() {
    const selectedValue = ($('#txtMonthName').val() || '').trim();
    let monthNumber = '';
    let monthName = '';
    const found = G_MonthList.find(function (row) {
        return String(row.MonthNameWithYear).toLowerCase() === selectedValue.toLowerCase();
    });
    if (found) {
        monthNumber = found.MonthNumber;
        monthName = found.MonthName;
    } else {
        const $opt = $('#txtMonthName option:selected');
        monthNumber = $opt.data('month-number');
        monthName = $opt.data('month-name');
    }
    $('#hdnMonthNumber').val(monthNumber || '');
    $('#hdnMonthName').val(monthName || '');
}

function GetNestedMarketingManList() {
    G_SalesPersonReady = false;
    G_MarketingManList = [];
    $('#ddlMarketingMan').prop('disabled', true);

    DealerTargetMasterService.GetNestedMarketingManList().then(function (response) {
        const rows = firstPayloadArray(response);
        let option = '<option value="">Select</option>';

        G_MarketingManList = rows.map(function (person) {
            const code = pick(person, ['Code', 'MarketingManMaster_Code'], '');
            const name = String(pick(person, ['PersonName', 'Desp', 'MarketingManName'], '')).trim();
            const userCode = pick(person, ['Usermaster_Code', 'UserMaster_Code'], 0);
            return {
                Code: code,
                PersonName: name,
                UserMaster_Code: userCode
            };
        }).filter(function (person) {
            return person.PersonName && person.Code !== undefined && person.Code !== null && String(person.Code) !== '';
        });

        for (let i = 0; i < G_MarketingManList.length; i++) {
            const person = G_MarketingManList[i];
            option += '<option value="' + escapeAttr(person.Code) + '">' + escapeAttr(person.PersonName) + '</option>';
        }

        G_SuppressSalesPersonChange = true;
        bindSearchableSelect($('#ddlMarketingMan'), option, '');
        syncMarketingManCode();
        G_SuppressSalesPersonChange = false;
        G_SalesPersonReady = true;
        $('#ddlMarketingMan').prop('disabled', false);

        if (!G_MarketingManList.length) {
            toastr.warning('No sales person found.');
        }

        clearDistributorDropdown();
    }).catch(function (error) {
        G_SalesPersonReady = false;
        $('#ddlMarketingMan').prop('disabled', false);
        toastr.error((error && (error.Msg || error.message)) || 'Failed to load sales person list.');
        clearDistributorDropdown();
    });
}

function GetPartyList() {
    G_PartyReady = false;
    const marketingManCode = syncMarketingManCode();
    if (!marketingManCode) {
        clearDistributorDropdown();
        return;
    }

    $('#txtPartyName').prop('disabled', true);
    DealerTargetMasterService.GetNestedDealerList(marketingManCode, 'Y').then(function (response) {
        const rows = firstPayloadArray(response);
        let hasDistributor = false;
        let option = '<option value="">Select</option>';
        for (let i = 0; i < rows.length; i++) {
            const name = rows[i].AccountDesp || rows[i].Desp || '';
            const code = rows[i].Code;
            if (!name || code === undefined || code === null || code === '') continue;
            hasDistributor = true;
            option += '<option value="' + escapeAttr(code) + '">' + escapeAttr(name) + '</option>';
        }

        bindSearchableSelect($('#txtPartyName'), option, '');
        syncPartyCode();
        $('#txtPartyName').prop('disabled', false);

        if (!hasDistributor) {
            toastr.warning('No distributor found for the selected sales person.');
            return;
        }

        G_PartyReady = true;
    }).catch(function (error) {
        $('#txtPartyName').prop('disabled', false);
        clearDistributorDropdown();
        toastr.error((error && (error.Msg || error.message)) || 'Failed to load distributor list.');
    });
}

function onSalesPersonChange() {
    if (G_SuppressSalesPersonChange) return;
    G_HeaderCode = 0;
    G_AutoShown = false;
    G_DealerTargetList = [];
    G_DealerRawList = [];
    ShowEmptyState();
    UpdateSummary();
    GetPartyList();
}

function formatNumber(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function buildAmountInput(code, value) {
    const display = value === null || value === undefined || value === '' ? '' : value;
    const filled = display === '' ? '' : ' is-filled';
    return '<div class="dtm-amount-wrap' + filled + '">' +
        '<span class="dtm-amount-prefix js-amount-prefix">' + amountPrefix() + '</span>' +
        '<input type="text" inputmode="decimal" class="form-control form-control-sm text-end box_border js-targeted-amount" data-code="' +
        escapeAttr(code) + '" value="' + escapeAttr(display) +
        '" maxlength="12" autocomplete="off" placeholder="0.00" oninput="OnTargetedAmountChange(this)" />' +
        '</div>';
}

function buildStatusBadge(status) {
    const inactive = isInactiveStatus(status);
    const label = inactive ? 'Inactive' : 'Active';
    return '<span class="dtm-badge ' + (inactive ? 'dtm-badge-inactive' : 'dtm-badge-active') + '">' + label + '</span>';
}

function setShowLoading(isLoading) {
    const $btn = $('#btnShow');
    $btn.prop('disabled', isLoading);
    $('#btnShowText').text(isLoading ? 'Loading...' : 'Show');
}

function refreshAmountPrefixes() {
    $('.js-amount-prefix').text(amountPrefix());
    if (isQuantityTarget()) {
        $('#kpiAmountIcon').html('<i class="fas fa-boxes-stacked"></i>');
        $('#kpiAmountLabel').text('Total Quantity');
    } else {
        $('#kpiAmountIcon').html('<i class="fas fa-rupee-sign"></i>');
        $('#kpiAmountLabel').text('Total Target');
    }
}

function UpdateSummary() {
    const rows = G_DealerTargetList || [];
    const total = rows.length;
    let entered = 0;
    let amount = 0;

    rows.forEach(function (row) {
        if (hasTargetAmount(row.TargetedAmountValue)) {
            entered += 1;
            amount += toNumber(row.TargetedAmountValue);
        }
    });

    const coverage = total > 0 ? (entered / total) * 100 : 0;
    const pending = Math.max(total - entered, 0);
    const partyName = getSelectedPartyName();
    const monthName = ($('#txtMonthName').val() || '').trim();

    $('#kpiDealers').text(formatNumber(total));
    $('#kpiDealerSub').text(partyName || 'Select a distributor');
    $('#kpiEntered').text(formatNumber(entered));
    $('#kpiPending').text(pending + (pending === 1 ? ' pending' : ' pending'));
    $('#kpiTotalAmount').text(formatNumber(amount));
    $('#kpiAvgAmount').text('Avg ' + formatNumber(entered ? (amount / entered) : 0));
    $('#kpiCoverage').text(formatNumber(coverage) + '%');
    $('#kpiCoverageBar').css('width', Math.max(0, Math.min(coverage, 100)) + '%');
    $('#dtmKpiCoverage').removeClass('is-good is-low');
    if (total && coverage >= 80) {
        $('#dtmKpiCoverage').addClass('is-good');
    } else if (total && coverage < 40) {
        $('#dtmKpiCoverage').addClass('is-low');
    }
    $('#dtmPeriodLabel').text((partyName || 'Distributor') + (monthName ? '  ·  ' + monthName : ''));
    refreshAmountPrefixes();
}

function ShowEmptyState() {
    $('#tblDealerTargetList').hide();
    $('#dtmKpiRow').hide();
    $('#dtmEmptyState').show();
    $('#btnSave').hide();
}

function showSaveButton() {
    $('#btnSave').css('display', 'inline-flex');
}

function ShowGrid() {
    $('#dtmEmptyState').hide();
    $('#dtmKpiRow').show();
    $('#tblDealerTargetList').show();
    showSaveButton();
}

function ResetDealerTargetPage() {
    G_DealerTargetList = [];
    G_DealerRawList = [];
    G_HeaderCode = 0;
    G_AutoShown = false;
    G_RowFilter = 'all';
    $('#txtDealerTargetSearch').val('');
    $('#txtBulkAmount').val('');
    $('#dtmFilterChips .dtm-chip').removeClass('is-active');
    $('#dtmFilterChips .dtm-chip[data-filter="all"]').addClass('is-active');
    $('#DealerTargetList-header').empty();
    $('#DealerTargetList-body').empty();
    $('#paginator-DealerTargetList').empty();
    ShowEmptyState();
    UpdateSummary();
}

function getUserMasterCode() {
    try {
        const authKey = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        return authKey.UserMaster_Code || 0;
    } catch (e) {
        return 0;
    }
}

function getSelectedMonthName() {
    syncMonthSelection();
    return ($('#txtMonthName').val() || '').trim();
}

function getSelectedMonthNumber() {
    syncMonthSelection();
    return toInt($('#hdnMonthNumber').val() || 0);
}

function getSelectedFinYear() {
    return (G_FinYear || getFinancialYear() || '').trim();
}

function todayDate() {
    return new Date().toISOString().split('T')[0];
}

function extractSavedCode(payload, fallback) {
    const fallbackCode = toInt(fallback) || 0;
    if (!payload) return fallbackCode;

    if (typeof payload === 'number' || typeof payload === 'string') {
        return toInt(payload) || fallbackCode;
    }

    const direct = toInt(pick(payload, [
        'DealerTargetMaster_Code', 'Code', 'code', 'MasterCode', 'NewCode'
    ], 0));
    if (direct) return direct;

    const masterRows = firstPayloadArray(
        payload.DealerTargetMaster || payload.dealerTargetMaster || payload.TY_DealerTargetMaster
    );
    if (masterRows.length) {
        const masterCode = toInt(pick(masterRows[0], ['Code', 'DealerTargetMaster_Code'], 0));
        if (masterCode) return masterCode;
    }

    const rows = extractTargetRows(payload);
    if (rows.length) {
        const rowCode = toInt(pick(rows[0], ['DealerTargetMaster_Code'], 0));
        if (rowCode) return rowCode;
    }

    return fallbackCode;
}

function looksLikeTargetRow(row) {
    if (!row || typeof row !== 'object') return false;
    return pickAny(row, [
        'DealerMaster_Code', 'DealerCode', 'TargetedAmount', 'TargetAmount',
        'DealerTargetTransaction_Code', 'DealerTargetTransactionCode'
    ], null) !== null;
}

function extractTargetRows(payload) {
    if (!payload) return [];

    const named = [
        payload.DealerTargetTransaction,
        payload.dealerTargetTransaction,
        payload.TY_DealerTargetTransaction,
        payload.DealerMasterList,
        payload.dealerMasterList,
        payload.Table1,
        payload.table1
    ];
    for (let i = 0; i < named.length; i++) {
        const rows = firstPayloadArray(named[i]);
        if (rows.length) return rows;
    }

    const arrays = collectObjectArrays(payload);
    for (let i = 0; i < arrays.length; i++) {
        if (arrays[i].some(looksLikeTargetRow)) return arrays[i];
    }
    if (arrays.length) return arrays[0];

    if (typeof payload === 'object' && looksLikeTargetRow(payload)) {
        return [payload];
    }
    return [];
}

function currentStateKey() {
    syncPartyCode();
    return [
        $('#hdnPartyCode').val() || '',
        getSelectedMonthName(),
        getSelectedFinYear(),
        getSelectedTargetFor()
    ].join('|');
}

function readStoredState() {
    try {
        const all = JSON.parse(localStorage.getItem(DEALER_TARGET_STATE_KEY) || '{}');
        return all[currentStateKey()] || { headerCode: 0, amounts: {} };
    } catch (e) {
        return { headerCode: 0, amounts: {} };
    }
}

function writeStoredState(headerCode, amounts) {
    try {
        const all = JSON.parse(localStorage.getItem(DEALER_TARGET_STATE_KEY) || '{}');
        all[currentStateKey()] = {
            headerCode: toInt(headerCode) || 0,
            amounts: amounts || {}
        };
        localStorage.setItem(DEALER_TARGET_STATE_KEY, JSON.stringify(all));
    } catch (e) { }
}

function persistCurrentAmounts() {
    const stored = readStoredState();
    writeStoredState(G_HeaderCode || stored.headerCode, Object.assign({}, stored.amounts, snapshotTargetAmounts()));
}

function tryAutoShowDealerTargets() {
    if (G_AutoShown || !G_SalesPersonReady || !G_PartyReady || !G_MonthReady) return;
    if (!getSelectedMarketingManCode() || !getSelectedParty() || !($('#txtMonthName').val() || '').trim()) return;
    G_AutoShown = true;
    GetDealerTargetList(0, true);
}

function snapshotTargetAmounts() {
    const map = {};
    (G_DealerTargetList || []).forEach(function (row) {
        if (!hasTargetAmount(row.TargetedAmountValue)) return;
        map[String(row.Code)] = row.TargetedAmountValue;
    });
    return map;
}

function dealerRowCode(dealer) {
    return String(pick(dealer, ['Code', 'DealerMaster_Code'], ''));
}

function dealerIndexByCode(dealers, code) {
    if (code === '' || code == null) return -1;
    const key = String(code);
    return dealers.findIndex(function (dealer) {
        return dealerRowCode(dealer) === key;
    });
}

function applySavedRowToDealer(dealer, saved, transactionCode) {
    const merged = Object.assign({}, dealer);
    const amountRaw = pickAny(saved, ['TargetedAmount', 'Targeted Amount', 'Amount', 'TargetAmount'], null);
    if (hasTargetAmount(amountRaw)) {
        merged.TargetedAmount = amountRaw;
    }

    merged.DealerTargetTransaction_Code = transactionCode || pick(saved, [
        'DealerTargetTransactionCode', 'DealerTargetTransaction_Code', 'TransactionCode'
    ], dealer.DealerTargetTransaction_Code);

    const header = pick(saved, ['DealerTargetMaster_Code'], '');
    if (header !== '') merged.DealerTargetMaster_Code = header;
    merged.ItemMaster_Code = pickAny(saved, ['ItemMaster_Code'], dealer.ItemMaster_Code);
    merged.GroupMaster_Code = pickAny(saved, ['GroupMaster_Code'], dealer.GroupMaster_Code);
    return merged;
}

function applyAmountSnapshot(dealers, snapshot) {
    if (!dealers || !dealers.length || !snapshot) return dealers || [];
    return dealers.map(function (dealer) {
        const current = pickAny(dealer, ['TargetedAmount', 'Targeted Amount'], null);
        const snapAmount = snapshot[dealerRowCode(dealer)];
        if (!hasTargetAmount(current) && hasTargetAmount(snapAmount)) {
            return Object.assign({}, dealer, { TargetedAmount: snapAmount });
        }
        return dealer;
    });
}

function mergeSavedTargetData(dealers, savedPayload, snapshot) {
    const targetRows = extractTargetRows(savedPayload);
    if (!dealers || !dealers.length) return dealers || [];

    const result = dealers.map(function (dealer) {
        return Object.assign({}, dealer);
    });
    if (!targetRows.length) return applyAmountSnapshot(result, snapshot);

    targetRows.forEach(function (saved) {
        const dealerCode = pick(saved, ['DealerMaster_Code', 'DealerCode'], '');
        let idx = dealerIndexByCode(result, dealerCode);
        if (idx < 0 && pick(saved, ['DealerName'], '')) {
            idx = dealerIndexByCode(result, pick(saved, ['Code'], ''));
        }
        if (idx >= 0) {
            const txCode = pick(saved, [
                'DealerTargetTransactionCode', 'DealerTargetTransaction_Code', 'TransactionCode',
                dealerCode !== '' ? 'Code' : ''
            ].filter(Boolean), 0);
            result[idx] = applySavedRowToDealer(result[idx], saved, txCode);
        }
    });

    return applyAmountSnapshot(result, snapshot);
}

function applyDealerList(dealers, party, silent) {
    G_DealerRawList = dealers || [];
    G_HeaderCode = toInt(pick(G_DealerRawList[0], ['DealerTargetMaster_Code'], 0)) || G_HeaderCode;

    const rows = G_DealerRawList.map(function (dealer) {
        return mapDealerRow(dealer, party);
    });
    G_DealerTargetList = rows;
    persistCurrentAmounts();
    if (typeof window.HideLoader === 'function') window.HideLoader();
    BindDealerTargetGrid(rows, silent);
    syncAmountInputs();
}

function loadSavedTargetData(headerCode, dealers, party, snapshot, silent) {
    const code = toInt(headerCode);
    if (!code) {
        applyDealerList(applyAmountSnapshot(dealers, snapshot), party, silent);
        return Promise.resolve();
    }

    return DealerTargetMasterService.GetByCodeData(code).then(function (savedPayload) {
        G_HeaderCode = extractSavedCode(savedPayload, code) || code;
        const merged = mergeSavedTargetData(dealers, savedPayload, snapshot);
        applyDealerList(merged, party, silent);
    }).catch(function () {
        applyDealerList(applyAmountSnapshot(dealers, snapshot), party, silent);
    });
}

function syncAmountInputs() {
    refreshAmountPrefixes();
    (G_DealerTargetList || []).forEach(function (row) {
        if (!hasTargetAmount(row.TargetedAmountValue)) return;
        const $input = $('.js-targeted-amount[data-code="' + row.Code + '"]');
        $input.val(row.TargetedAmountValue);
        $input.closest('.dtm-amount-wrap').addClass('is-filled');
    });
}

function fillAmountOnDealer(dealerCode, amount, transactionCode) {
    const code = String(dealerCode);
    const row = findGridRow(code);
    if (row) {
        row.TargetedAmountValue = hasTargetAmount(amount) ? toNumber(amount) : null;
        row.TargetedAmount = buildAmountInput(row.Code, hasTargetAmount(amount) ? amount : '');
    }

    const raw = (G_DealerRawList || []).find(function (item) {
        return String(pick(item, ['Code', 'DealerMaster_Code'], '')) === code;
    });
    if (raw) {
        raw.TargetedAmount = amount;
        if (transactionCode) {
            raw.DealerTargetTransaction_Code = transactionCode;
        }
    }

    const $input = $('.js-targeted-amount[data-code="' + code + '"]');
    $input.val(hasTargetAmount(amount) ? amount : '');
    $input.closest('.dtm-amount-wrap').toggleClass('is-filled', hasTargetAmount(amount));
    UpdateSummary();
}

function fillAmountsFromSavePayload(transactions) {
    (transactions || []).forEach(function (tx) {
        const dealerCode = pick(tx, ['DealerMaster_Code', 'Code'], '');
        const amount = pickAny(tx, ['TargetedAmount', 'Amount'], null);
        if (dealerCode === '' || !hasTargetAmount(amount)) return;
        fillAmountOnDealer(dealerCode, amount, pick(tx, ['Code', 'DealerTargetTransaction_Code', 'DealerTargetTransactionCode'], 0));
    });
}

function fillAmountsAfterSave(savePayload, saveResponse) {
    fillAmountsFromSavePayload(savePayload.DealerTargetTransaction);
    G_HeaderCode = extractSavedCode(saveResponse, savePayload.DealerTargetMaster[0].Code) || G_HeaderCode;
    persistCurrentAmounts();

    const headerCode = G_HeaderCode;
    if (!headerCode) {
        if (typeof window.HideLoader === 'function') window.HideLoader();
        return;
    }

    DealerTargetMasterService.GetByCodeData(headerCode).then(function (savedPayload) {
        G_HeaderCode = extractSavedCode(savedPayload, headerCode) || headerCode;
        const savedRows = extractTargetRows(savedPayload);
        savedRows.forEach(function (saved) {
            const dealerCode = pick(saved, ['DealerMaster_Code', 'DealerCode'], '');
            const amount = pickAny(saved, ['TargetedAmount', 'Amount'], null);
            if (dealerCode === '' || !hasTargetAmount(amount)) return;
            fillAmountOnDealer(
                dealerCode,
                amount,
                pick(saved, ['DealerTargetTransactionCode', 'DealerTargetTransaction_Code', 'Code'], 0)
            );
        });
        fillAmountsFromSavePayload(savePayload.DealerTargetTransaction);
        persistCurrentAmounts();
        if (typeof window.HideLoader === 'function') window.HideLoader();
    }).catch(function () {
        persistCurrentAmounts();
        if (typeof window.HideLoader === 'function') window.HideLoader();
        fillAmountsFromSavePayload(savePayload.DealerTargetTransaction);
    });
}

function buildDealerTargetSavePayload() {
    const userCode = getUserMasterCode();
    const accountCode = toInt($('#hdnPartyCode').val() || 0);
    const targetedDate = getSelectedTargetedDate();
    const finYear = getSelectedFinYear();
    const targetFor = getSelectedTargetFor();
    const headerCode = G_HeaderCode || toInt(pick(G_DealerRawList[0], ['DealerTargetMaster_Code'], 0));
    const today = todayDate();

    const transactions = [];
    G_DealerTargetList.forEach(function (row, index) {
        const amount = row.TargetedAmountValue;
        if (!hasTargetAmount(amount)) return;

        const raw = G_DealerRawList.find(function (item) {
            return String(pick(item, ['Code', 'DealerMaster_Code'], 0)) === String(row.Code);
        }) || {};

        transactions.push({
            Code: toInt(pick(raw, ['DealerTargetTransaction_Code', 'TransactionCode'], 0)),
            DealerTargetMaster_Code: headerCode,
            DealerMaster_Code: toInt(row.Code),
            ItemMaster_Code: toInt(pick(raw, ['ItemMaster_Code'], 0)),
            GroupMaster_Code: toInt(pick(raw, ['GroupMaster_Code'], 0)),
            TargetedDate: targetedDate,
            TargetedAmount: toNumber(amount),
            SortOrder: index + 1
        });
    });

    return {
        DealerTargetMaster: [{
            Code: headerCode,
            AccountMaster_Code: accountCode,
            FinYear: finYear,
            CreatedBy: userCode,
            CreatedDate: today,
            UpdatedBy: userCode,
            UpdatedDate: today,
            TargetFor: targetFor
        }],
        DealerTargetTransaction: transactions
    };
}

function highlightDeactiveRows() {
    $('#DealerTargetList-body .LightRed, #DealerTargetList-body .dtm-badge-inactive').each(function () {
        const tr = this.closest('tr');
        if (tr) tr.classList.add('dtm-row-inactive');
    });
}

function mapDealerRow(dealer, party) {
    const code = pick(dealer, ['Code', 'DealerMaster_Code'], 0);
    const amountRaw = pickAny(dealer, ['TargetedAmount', 'Targeted Amount', 'Amount', 'TargetAmount'], null);
    const amountValue = hasTargetAmount(amountRaw) ? amountRaw : '';
    const status = pick(dealer, ['Status', 'DealerStatus', 'IsActive'], 'Active');
    const inactive = isInactiveStatus(status);

    return {
        Code: code,
        AccountMaster_Code: pick(dealer, ['AccountMaster_Code'], party.Code),
        DealerName: pick(dealer, ['DealerName'], ''),
        CityName: pick(dealer, ['CityName', 'Location', 'City'], ''),
        StateName: pick(dealer, ['StateName', 'State'], ''),
        'Sales Person': pick(dealer, ['Sales Person', 'SalesPerson', 'PersonName', 'MarketingManName'], ''),
        Status: buildStatusBadge(status),
        TargetedAmount: buildAmountInput(code, amountValue),
        Address: pick(dealer, ['Address'], ''),
        MobileNo: pick(dealer, ['MobileNo', 'Mobile'], ''),
        EmailId: pick(dealer, ['EmailId', 'Email'], ''),
        CityMaster_Code: pick(dealer, ['CityMaster_Code'], 0),
        StateMaster_Code: pick(dealer, ['StateMaster_Code'], 0),
        CreatedBy: pickAny(dealer, ['CreatedBy'], ''),
        CreatedDate: pickAny(dealer, ['CreatedDate'], ''),
        UpdatedBy: pickAny(dealer, ['UpdatedBy'], ''),
        UpdatedDate: pickAny(dealer, ['UpdatedDate'], ''),
        TargetedAmountValue: amountValue === '' ? null : toNumber(amountValue),
        TargetedDateValue: getSelectedTargetedDate(),
        ColorRow: inactive ? '<span class="LightRed"></span>' : '',
        _inactive: inactive,
        _search: [
            pick(dealer, ['DealerName'], ''),
            pick(dealer, ['CityName', 'Location', 'City'], ''),
            pick(dealer, ['StateName', 'State'], ''),
            pick(dealer, ['Sales Person', 'SalesPerson', 'PersonName', 'MarketingManName'], ''),
            pick(dealer, ['MobileNo', 'Mobile'], ''),
            pick(dealer, ['Address'], '')
        ].join(' ').toLowerCase()
    };
}

function filterDealerTargetRows(list) {
    const term = ($('#txtDealerTargetSearch').val() || '').trim().toLowerCase();
    return (list || []).filter(function (row) {
        if (G_RowFilter === 'entered' && !hasTargetAmount(row.TargetedAmountValue)) return false;
        if (G_RowFilter === 'pending' && hasTargetAmount(row.TargetedAmountValue)) return false;
        if (G_RowFilter === 'inactive' && !row._inactive) return false;
        if (term && (row._search || '').indexOf(term) === -1) return false;
        return true;
    });
}

function BindDealerTargetGrid(list, silent) {
    const visible = filterDealerTargetRows(list);
    if (!list || !list.length) {
        ShowEmptyState();
        if (!silent) toastr.error('No Data Found');
        return;
    }

    ShowGrid();
    UpdateSummary();
    if (!visible.length) {
        $('#DealerTargetList-header').empty();
        $('#DealerTargetList-body').empty();
        $('#paginator-DealerTargetList').empty();
        $('#dtmRecordCount').text('0 of ' + list.length + (list.length === 1 ? ' dealer' : ' dealers'));
        return;
    }
    if (visible.length !== list.length) {
        $('#dtmRecordCount').text(visible.length + ' of ' + list.length + (list.length === 1 ? ' dealer' : ' dealers'));
    } else {
        $('#dtmRecordCount').text(list.length + (list.length === 1 ? ' dealer' : ' dealers'));
    }

    const StringFilterColumn = ['DealerName', 'CityName', 'StateName', 'Sales Person'];
    const NumericFilterColumn = [];
    const DateFilterColumn = [];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = [
        'Code', 'AccountMaster_Code', 'CityMaster_Code', 'StateMaster_Code',
        'CreatedBy', 'CreatedDate', 'UpdatedBy', 'UpdatedDate',
        'TargetedAmountValue', 'TargetedDateValue', 'ColorRow',
        'Address', 'MobileNo', 'EmailId', '_search', '_inactive'
    ];
    const ColumnAlignment = {
        TargetedAmount: 'right',
        Status: 'center'
    };

    BizsolCustomFilterGrid.CreateDataTable(
        'DealerTargetList-header',
        'DealerTargetList-body',
        visible,
        Button,
        showButtons,
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        ColumnAlignment
    );

    window.itemsPerPage_DealerTargetList = 25;
    if (typeof window.renderTableWithPagination === 'function') {
        window.renderTableWithPagination('DealerTargetList', 'DealerTargetList-body');
    }

    highlightDeactiveRows();
    refreshAmountPrefixes();
    $('#paginator-DealerTargetList').off('click.dealerTarget change.dealerTarget')
        .on('click.dealerTarget change.dealerTarget', function () {
            setTimeout(function () {
                highlightDeactiveRows();
                syncAmountInputs();
            }, 50);
        });
}

function GetDealerTargetList(preferredHeaderCode, silent) {
    silent = !!silent;
    const party = getSelectedParty();
    const monthNameWithYear = getSelectedMonthName();
    const monthNumber = getSelectedMonthNumber();
    const finYear = getSelectedFinYear();
    const marketingManCode = getSelectedMarketingManCode();
    const targetedDate = getSelectedTargetedDate();

    if (!marketingManCode) {
        if (!silent) toastr.error('Please select Sales Person');
        return false;
    }
    if (!party) {
        if (!silent) toastr.error('Please select Distributor');
        return false;
    }
    if (!monthNameWithYear || !monthNumber) {
        if (!silent) toastr.error('Please select Month Name');
        return false;
    }

    setShowLoading(true);
    if (typeof window.Showloader === 'function') window.Showloader();

    const locateDealers = function (dateValue) {
        return DealerTargetMasterService.GetDealerLocate(normalizeText(party.AccountDesp), marketingManCode, finYear, dateValue);
    };

    locateDealers(targetedDate).then(function (response) {
        let dealers = firstPayloadArray(response);
        if (dealers.length || targetedDate === monthNameWithYear) {
            return { dealers: dealers };
        }
        return locateDealers(monthNameWithYear).then(function (fallbackResponse) {
            return { dealers: firstPayloadArray(fallbackResponse) };
        });
    }).then(function (result) {
        const dealers = (result && result.dealers) || [];
        const headerCode = toInt(preferredHeaderCode) ||
            toInt(pick(dealers[0], ['DealerTargetMaster_Code'], 0));
        G_HeaderCode = headerCode;
        setShowLoading(false);
        return loadSavedTargetData(headerCode, dealers, party, {}, silent);
    }).catch(function (error) {
        if (typeof window.HideLoader === 'function') window.HideLoader();
        setShowLoading(false);
        G_DealerTargetList = [];
        G_DealerRawList = [];
        G_HeaderCode = 0;
        ShowEmptyState();
        if (!silent) {
            toastr.error((error && (error.Msg || error.message)) || 'Failed to load dealer targets.');
        }
    });
}

function findGridRow(code) {
    return G_DealerTargetList.find(function (row) {
        return String(row.Code) === String(code);
    });
}

function OnTargetedAmountChange(el) {
    const value = sanitizeAmountInput(el.value);
    if (value !== el.value) el.value = value;

    const code = $(el).attr('data-code');
    const row = findGridRow(code);
    if (!row) return;

    row.TargetedAmountValue = value === '' ? null : toNumber(value);
    row.TargetedAmount = buildAmountInput(code, value);
    $(el).closest('.dtm-amount-wrap').toggleClass('is-filled', value !== '');
    persistCurrentAmounts();
    UpdateSummary();
}

function focusNextAmount(current) {
    const $inputs = $('.js-targeted-amount');
    const index = $inputs.index(current);
    if (index >= 0 && index < $inputs.length - 1) {
        $inputs.eq(index + 1).focus().select();
    }
}

function applyBulkAmount(onlyEmpty) {
    const value = sanitizeAmountInput($('#txtBulkAmount').val());
    if (value === '') {
        toastr.warning('Enter a target value to fill.');
        return;
    }

    const visible = filterDealerTargetRows(G_DealerTargetList);
    let updated = 0;
    visible.forEach(function (row) {
        if (onlyEmpty && hasTargetAmount(row.TargetedAmountValue)) return;
        fillAmountOnDealer(row.Code, value);
        updated += 1;
    });
    persistCurrentAmounts();
    if (!updated) {
        toastr.info(onlyEmpty ? 'All visible dealers already have a target.' : 'No dealers to fill.');
        return;
    }
    toastr.success('Filled ' + updated + (updated === 1 ? ' dealer.' : ' dealers.'));
}

function SaveDealerTarget() {
    if (!G_DealerTargetList.length) {
        toastr.warning('No data to save.');
        return;
    }

    if (!getSelectedMarketingManCode()) {
        toastr.error('Please select Sales Person');
        return;
    }
    if (!getSelectedParty()) {
        toastr.error('Please select Distributor');
        return;
    }
    if (!getSelectedMonthName() || !getSelectedMonthNumber()) {
        toastr.error('Please select Month Name');
        return;
    }

    const payload = buildDealerTargetSavePayload();
    if (!payload.DealerTargetTransaction || !payload.DealerTargetTransaction.length) {
        toastr.warning('Please enter Targeted Amount.');
        return;
    }

    if (typeof window.Showloader === 'function') window.Showloader();
    DealerTargetMasterService.SaveDealerTarget(payload).then(function (response) {
        const status = response && (response.Status || response.status);
        const msg = (response && (response.Msg || response.message || response.Message)) || '';
        if (status === 'Y' || status === true || status === 'Success') {
            toastr.success(msg || ('Saved targets for ' + payload.DealerTargetTransaction.length + ' dealers.'));
            fillAmountsAfterSave(payload, response);
        } else {
            if (typeof window.HideLoader === 'function') window.HideLoader();
            toastr.error(msg || 'Failed to save dealer target.');
        }
    }).catch(function (error) {
        if (typeof window.HideLoader === 'function') window.HideLoader();
        toastr.error((error && (error.Msg || error.message)) || 'Failed to save dealer target.');
    });
}

function selectOnFocus(el) {
    setTimeout(function () {
        if (el && typeof el.select === 'function') el.select();
    }, 0);
}

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    $('#ERPHeading').text($('#ERPHeading').text() || 'Dealer Target Master');
    initSearchableSelect($('#ddlMarketingMan'));
    initSearchableSelect($('#txtPartyName'));
    initSearchableSelect($('#txtMonthName'));
    bindMonthDropdown();
    GetNestedMarketingManList();
    $('#btnSave').hide();
    ShowEmptyState();
    refreshAmountPrefixes();

    $('#btnShow').click(function () {
        GetDealerTargetList();
    });

    $('#btnSave').click(function () {
        SaveDealerTarget();
    });

    $('#btnReset').click(function () {
        ResetDealerTargetPage();
    });

    $('#ddlMarketingMan').on('change', function () {
        onSalesPersonChange();
    });

    $('#txtPartyName').on('change', function () {
        syncPartyCode();
        G_HeaderCode = 0;
    });

    $('#txtMonthName').on('change', function () {
        syncMonthSelection();
        G_HeaderCode = 0;
    });

    $('#txtDealerTargetSearch').on('input', function () {
        if (G_DealerTargetList.length) {
            BindDealerTargetGrid(G_DealerTargetList, true);
            syncAmountInputs();
        }
    });

    $('#dtmFilterChips').on('click', '.dtm-chip', function () {
        G_RowFilter = $(this).data('filter') || 'all';
        $('#dtmFilterChips .dtm-chip').removeClass('is-active');
        $(this).addClass('is-active');
        if (G_DealerTargetList.length) {
            BindDealerTargetGrid(G_DealerTargetList, true);
            syncAmountInputs();
        }
    });

    $('#btnFillEmpty').click(function () {
        applyBulkAmount(true);
    });
    $('#btnFillAll').click(function () {
        applyBulkAmount(false);
    });

    $('#txtBulkAmount').on('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        applyBulkAmount(true);
    });

    $(document).on('keydown', '.js-targeted-amount', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            focusNextAmount(this);
        }
    });
});

window.OnTargetedAmountChange = OnTargetedAmountChange;
window.GetDealerTargetList = GetDealerTargetList;
window.SaveDealerTarget = SaveDealerTarget;
window.ResetDealerTargetPage = ResetDealerTargetPage;
window.GetNestedMarketingManList = GetNestedMarketingManList;
