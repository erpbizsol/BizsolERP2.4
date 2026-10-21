import { OrderLoadReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/OrderLoadReportService.js';
import { ItemMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_ItemMasterService.js';
import { LedgerService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/LedgerService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { getOrderLoadFormTypeFromQuery } from '../../Bizsol.WebERP.UI.Shared/js/OrderLoadFormTypeUtil.js';

var G_OL_Templates = [];
var G_OL_LevelRows = [];
var G_OL_CurrentLevel = null;
var G_OL_LoadingReport = false;
var G_OL_DropdownLoaded = {};
/* Normalized keys of columns with ShowTotal = 'Y' for the active template */
var G_OL_ShowTotalKeys = [];
var G_OL_ShowTotalLoaded = false;
var G_OL_ExportRows = [];
var G_OL_GridDataReady = false;
var G_OL_DateColumns = [];
var G_OL_NumericColumns = [];
var G_OL_TemplateTransactions = [];
var G_OL_PrintColumnDefs = [];
var G_OL_PrintPreviewHtml = '';
var G_OL_ItemSizeMaster_Codes = '';
var G_OL_SizeFilterItemMasterCodes = '';
var G_OL_FreezeColumnLabel = '';
var G_OL_FilterModalFocusTrapSuspended = false;
var G_OL_OpenCheckboxDropdownId = '';
var G_OL_DynamicFilters = [];
var G_OL_HasDynamicComboFilters = false;
var G_OL_FilterConfigCache = null;
var G_OL_FilterLoadSeq = 0;
var G_OL_FilterConfigFetchPending = false;
var G_OL_FinYear = { desp: '', startIso: '', endIso: '' };
var G_OL_FinYearLoaded = false;

function getFormTypeFromQuery() {
    var urlParams = BizSolHelperFunction.getUrlVars();
    return getOrderLoadFormTypeFromQuery(
        urlParams['FormType'] || urlParams['formtype'] || '',
        urlParams['ModuleDesp'] || urlParams['moduledesp'] || ''
    );
}

var G_OL_FORM_TYPE = getFormTypeFromQuery();
window.G_OL_FORM_TYPE = G_OL_FORM_TYPE;

var G_OL_MODAL_FIELD_IDS = [
    'olFieldLevel',
    'olFieldWareHouse', 'olFieldItemGroup', 'olFieldProcess', 'olFieldMarketingMan',
    'olFieldOrderNo', 'olFieldItemType', 'olFieldItemName',
    'olFieldOtherFilter1', 'olFieldOtherFilter2', 'olFieldOtherFilter3'
];

var G_OL_MULTI_SELECTS = [
    '#ddlWareHouse', '#ddlItemGroup', '#ddlProcess', '#ddlMarketingMan',
    '#ddlOrderNo', '#ddlItemType', '#ddlItemName'
];

var G_OL_OTHER_FILTER_SELECTS = [
    '#ddlOtherFilter1', '#ddlOtherFilter2', '#ddlOtherFilter3'
];

var G_OL_OTHER_FILTER_META = {
    1: { query: '', fieldName: '', label: '', nameColumn: '', flag: '', tableName: '' },
    2: { query: '', fieldName: '', label: '', nameColumn: '', flag: '', tableName: '' },
    3: { query: '', fieldName: '', label: '', nameColumn: '', flag: '', tableName: '' }
};

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    if (!$('#ERPHeading').text() || $('#ERPHeading').text() === 'undefined') {
        $('#ERPHeading').text('OrderLoad Report In Grid');
    }

    bindEvents();
    clearDateFilterInputs();
    loadTemplateDropdown();
    installOrderLoadGridRenderHook();
    initOrderLoadPreviewModal();
    initOrderLoadGridLayoutHooks();

    // Called by the Manage Template module after a template is saved/deleted.
    window.OrderLoadReportRefreshTemplates = function (selectCode) {
        G_OL_FilterConfigCache = null;
        loadTemplateDropdown(selectCode);
    };

    updateDownloadButtonState();
    updateSizeParameterGridButton();
    updateEmptyStateMessage();
});

function bindEvents() {
    $('#btnFilter').on('click', openFilterModal);
    $('#btnFilterModalOk').on('click', closeFilterModalOk);
    $('#btnFilterModalClear').on('click', clearModalFilters);
    $('#btnShow').on('click', loadReportData);
    $('#btnReset').on('click', resetFilters);
    $('#ddlTemplate').on('change', function () {
        applyTemplateFilters();
        applyFilterActiveColors();
        updateFilterButtonState();
        updateFilterSummary();
    });
    // modal From/To -> header From/To (no auto report refresh while the modal is open)
    $('#txtFromDateModal, #txtToDateModal').on('change input', function () {
        $('#txtFromDate').val($('#txtFromDateModal').val());
        $('#txtToDate').val($('#txtToDateModal').val());
        applyFilterActiveColors();
        updateFilterButtonState();
        updateFilterSummary();
    });
    // header From/To -> modal From/To
    $('#txtFromDate, #txtToDate').on('change input', syncModalDatesFromHeader);
    $('#olDynamicFilterHost').on('change input', '.ol-mirror-from, .ol-mirror-to', function () {
        syncHeaderDatesFromModalMirror();
        applyFilterActiveColors();
        updateFilterButtonState();
        updateFilterSummary();
    });
    $('#ddlLevel').on('change', function () {
        applySelectedLevel();
        loadTemplateDefaultDatesFromApi(G_OL_CurrentLevel).then(function () {
            ensureLevelDateRangeDefaults();
            applyStaticDateFieldsFromTemplate(G_OL_CurrentLevel || getSelectedTemplate());
        });
        applyFilterActiveColors();
        updateFilterButtonState();
        updateFilterSummary();
    });
    $('#txtFromDate, #txtToDate').on('change input', function () {
        applyFilterActiveColors();
        updateFilterButtonState();
        updateFilterSummary();
    });
    $('#btnSizeParameterFilter').on('click', showOrderLoadSizeControlModal);
    $('#btnClearSizeParameterFilter, #btnEmptyClearSizeFilter').on('click', onClearSizeParameterFilterClick);

    $('#olFilterModal').on('shown.bs.modal', function () {
        $('.ol-cd-menu').each(function () {
            ensureCheckboxDropdownMenuContainer($(this));
        });
        syncLevelDateRangeUi();
        syncDateFieldModalHeaderMirror();
        applyFilterActiveColors();
        updateModalEmptyState();
    });

    $('#olFilterModal').on('hidden.bs.modal', function () {
        G_OL_FilterModalFocusTrapSuspended = false;
        G_OL_OpenCheckboxDropdownId = '';
        $('.ol-cd-menu').hide();
        $('.ol-cd-wrap').removeClass('ol-cd-open');
    });

    $('#btnOlDownload').on('click', function (e) {
        e.stopPropagation();
        if ($(this).prop('disabled')) {
            toastr.warning('Please load the report first.');
            return;
        }
        exportOrderLoadExcel();
    });

    $('#btnOlPrint').on('click', function () {
        if ($(this).prop('disabled')) {
            toastr.warning('Please load the report first.');
            return;
        }
        onOrderLoadPrintClick();
    });

    $('#btnOlPreview').on('click', function () {
        if ($(this).prop('disabled')) {
            toastr.warning('Please load the report first.');
            return;
        }
        onOrderLoadPreviewClick();
    });
}

function formatDisplayDate(iso) {
    if (!iso) return '';
    var p = String(iso).split('-');
    if (p.length !== 3) return iso;
    return p[2] + '-' + p[1] + '-' + p[0];
}

function getActiveModalFilterCount() {
    var count = 0;

    if (!$('#olFieldLevel').hasClass('ol-hidden') && $('#ddlLevel').val() !== null && $('#ddlLevel').val() !== '') {
        count += 1;
    }

    G_OL_MULTI_SELECTS.concat(G_OL_OTHER_FILTER_SELECTS).forEach(function (selector) {
        var $field = $(selector).closest('.ol-filter-field');
        if ($field.hasClass('ol-hidden')) return;
        if (getDropdownCodes(selector).length > 0) count += 1;
    });

    $('#olDynamicFilterHost select').each(function () {
        if (dynamicSelectHasValue($(this))) count += 1;
    });

    return count;
}

function updateFilterSummary() {
    // Dates + template are always visible outside the modal; badge covers modal filters only.
}

function updateFilterButtonState() {
    var activeCount = getActiveModalFilterCount();
    var $btn = $('#btnFilter');
    var $badge = $('#olFilterBadge');

    $btn.removeClass('ol-hidden');
    $btn.toggleClass('ol-btn-filter-active', activeCount > 0);

    if (activeCount > 0) {
        $badge.text(activeCount).show();
    } else {
        $badge.hide();
    }

    updateSizeParameterGridButton();
    updateFilterSummary();
}

function openFilterModal() {
    var tpl = G_OL_CurrentLevel || getSelectedTemplate();
    if (tpl) {
        applyOtherFiltersVisibility(tpl);
    }

    applyFilterActiveColors();
    updateModalEmptyState();
    syncDateFieldModalHeaderMirror();

    var modalEl = document.getElementById('olFilterModal');
    if (window.bootstrap && bootstrap.Modal) {
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    } else {
        $(modalEl).modal('show');
    }
}

function closeFilterModalOk() {
    applyFilterActiveColors();
    updateFilterButtonState();

    var modalEl = document.getElementById('olFilterModal');
    if (window.bootstrap && bootstrap.Modal) {
        var instance = bootstrap.Modal.getInstance(modalEl);
        if (instance) instance.hide();
        else bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    } else {
        $(modalEl).modal('hide');
    }
}

function shouldShowSizeParameterGridButton(tpl) {
    tpl = tpl || getSelectedTemplate();
    var code = parseInt(tpl && tpl.code, 10) || parseInt($('#ddlTemplate').val(), 10) || 0;
    return code > 0 && isFlagY(tpl.showSizeParameterFilter);
}

function isOrderLoadSizeParameterFilterEnabled(tpl) {
    return shouldShowSizeParameterGridButton(tpl) && !!String(G_OL_ItemSizeMaster_Codes || '').trim();
}

function isSizeParameterFilterApplied() {
    return isOrderLoadSizeParameterFilterEnabled() && !!String(G_OL_ItemSizeMaster_Codes || '').trim();
}

function clearSizeParameterFilter() {
    G_OL_ItemSizeMaster_Codes = '';
    updateSizeFilterBadge();
    updateEmptyStateMessage();
}

function onClearSizeParameterFilterClick() {
    if (!isSizeParameterFilterApplied()) {
        toastr.info('Size Parameter Filter is already cleared.');
        return;
    }

    clearSizeParameterFilter();
    updateFilterButtonState();
    toastr.success('Size Parameter Filter cleared. Click Load Report to refresh.');
}

function updateEmptyStateMessage() {
    var applied = isSizeParameterFilterApplied();
    var $empty = $('#olEmptyState');

    if (!$empty.length) return;

    $empty.find('[data-ol-empty-mode="default"]').toggleClass('is-hidden', applied);
    $empty.find('[data-ol-empty-mode="size-filter"]').toggleClass('is-hidden', !applied);
}

function updateSizeFilterBadge() {
    var applied = isSizeParameterFilterApplied();
    var $badge = $('#olSizeFilterBadge');
    if (!$badge.length) return;
    $badge.toggleClass('is-hidden', !applied);
    $('#btnSizeParameterFilter').toggleClass('ol-filter-applied', applied);
    $('#btnClearSizeParameterFilter').toggleClass('is-hidden', !applied);
}

function updateSizeParameterGridButton() {
    var $wrap = $('.ol-size-param-wrap');
    if (!$wrap.length) return;

    var show = shouldShowSizeParameterGridButton();
    $wrap.toggleClass('is-hidden', !show);
    updateSizeFilterBadge();
}

function normalizeGridColumnKey(key) {
    return String(key || '').replace(/[\s_\[\]]/g, '').toLowerCase();
}

function findGridColumnKey(rows, normalizedName) {
    if (!Array.isArray(rows) || !rows.length) return null;
    var found = null;
    rows.some(function (row) {
        if (!row || typeof row !== 'object') return false;
        return Object.keys(row).some(function (key) {
            if (normalizeGridColumnKey(key) === normalizedName) {
                found = key;
                return true;
            }
            return false;
        });
    });
    return found;
}

function collectItemMasterCodesFromGridRows(rows) {
    if (!Array.isArray(rows) || !rows.length) return '';

    var seen = {};
    var codes = [];
    var codeCol = findGridColumnKey(rows, 'itemmastercode');

    if (codeCol) {
        rows.forEach(function (row) {
            var code = parseInt(row[codeCol], 10);
            if (code > 0 && !seen[code]) {
                seen[code] = true;
                codes.push(code);
            }
        });
        if (codes.length) {
            return codes.join(',');
        }
    }

    return '';
}

function getDynamicItemMasterCodesForSizeFilter() {
    var row = (G_OL_DynamicFilters || []).find(function (r) {
        if (String(r.controlType || '').toUpperCase() !== 'COMBO') return false;
        var name = String(r.displayName || '').trim().toLowerCase();
        return name === 'item name' || name === 'itemname';
    });
    if (!row || row.withCode !== 'Y') return [];
    var $sel = $('#ddlDynFilter_' + row.code);
    if (!$sel.length) return [];
    var val = $sel.val();
    if (!val) return [];
    if (!Array.isArray(val)) val = [val];
    return val.map(function (v) { return parseInt(v, 10); }).filter(function (n) { return n > 0; });
}

function collectItemNamesFromGridRows(rows) {
    if (!Array.isArray(rows) || !rows.length) return [];

    var nameCol = findGridColumnKey(rows, 'itemname');
    if (!nameCol) return [];

    var seen = {};
    var names = [];
    rows.forEach(function (row) {
        if (!row) return;
        var name = String(row[nameCol] == null ? '' : row[nameCol]).replace(/\s+/g, ' ').trim();
        var key = name.toLowerCase();
        if (!name || seen[key]) return;
        seen[key] = true;
        names.push(name);
    });
    return names;
}

function collectItemNamesFromRenderedGrid() {
    var $table = $('#OrderLoadReport');
    if (!$table.length) return [];
    var idx = -1;
    $table.find('thead th').each(function (i) {
        var label = $(this).text().replace(/[\s_]/g, '').toLowerCase();
        if (label.indexOf('itemname') >= 0) idx = i;
    });
    if (idx < 0) return [];

    var seen = {};
    var names = [];
    $table.find('tbody tr').not('.total-row, .grand-total-row').each(function () {
        var name = ($(this).children('td').eq(idx).text() || '').replace(/\s+/g, ' ').trim();
        var key = name.toLowerCase();
        if (!name || seen[key]) return;
        seen[key] = true;
        names.push(name);
    });
    return names;
}

function getItemNameFilterSelect() {
    var row = (G_OL_DynamicFilters || []).find(function (r) {
        if (String(r.controlType || '').toUpperCase() !== 'COMBO') return false;
        var name = String(r.displayName || '').trim().toLowerCase();
        return name === 'item name' || name === 'itemname';
    });
    if (row) {
        var $dyn = $('#ddlDynFilter_' + row.code);
        if ($dyn.length) return $dyn;
    }
    var $static = $('#ddlItemName');
    return $static.length ? $static : $();
}

function getSelectedItemNamesForSizeFilter() {
    var $sel = getItemNameFilterSelect();
    if (!$sel.length) return [];
    var val = $sel.val();
    if (!val) return [];
    if (!Array.isArray(val)) val = [val];
    if (val.indexOf('0') >= 0) return [];
    return val.map(function (v) {
        var text = ($sel.find('option').filter(function () {
            return String($(this).val()) === String(v);
        }).first().text() || '').trim();
        return text || String(v).trim();
    }).filter(function (name) {
        return !!name && name.toLowerCase() !== 'all' && name !== '0';
    });
}

function matchItemNamesToSelectCodes(names) {
    var wanted = {};
    (names || []).forEach(function (name) {
        var key = String(name || '').trim().toLowerCase();
        if (key) wanted[key] = true;
    });
    if (!Object.keys(wanted).length) return '';

    var $sel = getItemNameFilterSelect();
    if (!$sel.length) return '';

    var codes = [];
    var seen = {};
    $sel.find('option').each(function () {
        var code = parseInt($(this).val(), 10);
        var text = String($(this).text() || '').trim().toLowerCase();
        if (code > 0 && wanted[text] && !seen[code]) {
            seen[code] = true;
            codes.push(code);
        }
    });
    return codes.join(',');
}

function unwrapItemMasterRows(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    if (payload && Array.isArray(payload.Data)) return payload.Data;
    return unwrapApiList(payload);
}

function resolveItemNamesToMasterCodes(names) {
    var fromSelect = matchItemNamesToSelectCodes(names);
    if (fromSelect) return Promise.resolve(fromSelect);
    if (!names || !names.length) return Promise.resolve('');

    var wanted = {};
    names.forEach(function (name) {
        var key = String(name || '').trim().toLowerCase();
        if (key) wanted[key] = true;
    });

    return ItemMasterService.GetItemMasterListData().then(function (payload) {
        var codes = [];
        var seen = {};
        var wantedKey = {};
        Object.keys(wanted).forEach(function (name) {
            wantedKey[name.replace(/[^a-z0-9]/g, '')] = true;
        });
        unwrapItemMasterRows(payload).forEach(function (item) {
            if (!item) return;
            var name = '';
            ['ItemName', 'itemName', 'Item Name', 'Desp', 'desp', 'ItemDesp', 'itemDesp'].some(function (key) {
                if (item[key] != null && String(item[key]).trim()) {
                    name = String(item[key]).replace(/\s+/g, ' ').trim();
                    return true;
                }
                return false;
            });
            if (!name) {
                Object.keys(item).some(function (key) {
                    var nk = key.replace(/[\s_]/g, '').toLowerCase();
                    if (nk !== 'itemname' && nk !== 'itemdesp' && nk !== 'desp') return false;
                    if (item[key] == null || !String(item[key]).trim()) return false;
                    name = String(item[key]).replace(/\s+/g, ' ').trim();
                    return true;
                });
            }
            var code = parseInt(item.Code != null ? item.Code : (item.code != null ? item.code : item.ItemMaster_Code), 10);
            var nameKey = name.toLowerCase();
            var compact = nameKey.replace(/[^a-z0-9]/g, '');
            if (code > 0 && (wanted[nameKey] || wantedKey[compact]) && !seen[code]) {
                seen[code] = true;
                codes.push(code);
            }
        });
        return codes.join(',');
    });
}

function resolveOrderLoadItemMasterCodesForSizeFilter(tpl, options) {
    tpl = tpl || getSelectedTemplate();
    options = options || {};

    if (!options.skipCache && String(G_OL_SizeFilterItemMasterCodes || '').trim()) {
        return Promise.resolve(G_OL_SizeFilterItemMasterCodes);
    }

    var dynamicCodes = getDynamicItemMasterCodesForSizeFilter();
    if (dynamicCodes.length) {
        return Promise.resolve(dynamicCodes.join(','));
    }

    var staticCodes = getItemNameCodesForSizeFilter();
    if (staticCodes.length) {
        return Promise.resolve(staticCodes.join(','));
    }

    var rows = getOrderLoadExportRows();
    var gridCodes = collectItemMasterCodesFromGridRows(rows);
    if (gridCodes) return Promise.resolve(gridCodes);

    var names = getSelectedItemNamesForSizeFilter();
    if (!names.length) names = collectItemNamesFromGridRows(rows);
    if (!names.length) names = collectItemNamesFromRenderedGrid();
    return resolveItemNamesToMasterCodes(names);
}

function showOrderLoadSizeControlModal() {
    var tpl = getSelectedTemplate();

    if (!shouldShowSizeParameterGridButton(tpl)) {
        return;
    }

    if (!canOpenOrderLoadSizeParameterFilter(tpl)) {
        toastr.warning('Please load report first.');
        return;
    }

    if (typeof window.initializeSizeFilterControl !== 'function') {
        toastr.error('Size Parameter Filter is not loaded.');
        return;
    }

    resolveOrderLoadItemMasterCodesForSizeFilter(tpl)
        .then(function (itemMasterCodes) {
            itemMasterCodes = String(itemMasterCodes || '').trim();
            if (!itemMasterCodes) {
                if (isFlagY(tpl.showItemName)) {
                    toastr.warning('Please select Item Name or load report with item data.');
                } else {
                    toastr.warning('Could not resolve item codes from loaded report.');
                }
                return;
            }

            window.initializeSizeFilterControl({
                ModalId: 'SizeControlmodal',
                ItemMaster_Code: itemMasterCodes,
                CallBackFunctionName_btnDone: 'onOrderLoadSizeFilterApplied'
            });
        })
        .catch(function () {
            toastr.error('Could not load item list for Size Filter.');
        });
}

window.onOrderLoadSizeFilterApplied = function (response) {
    if (response && response.length) {
        G_OL_ItemSizeMaster_Codes = response.map(function (row) {
            return row.Code;
        }).join(',');
    } else {
        G_OL_ItemSizeMaster_Codes = '';
    }
    updateSizeFilterBadge();
    updateFilterButtonState();
    updateEmptyStateMessage();
    toastr.info('Size Parameter Filter applied. Click Load Report to refresh.');
};

function syncTemplateGridMeta(tpl) {
    tpl = tpl || getSelectedTemplate();
    G_OL_FreezeColumnLabel = String(tpl.freezeFromColumn || '').trim();
    clearOrderLoadSizeFilterItemCodes();
    if (!shouldShowSizeParameterGridButton(tpl)) {
        clearSizeParameterFilter();
    }
    updateSizeParameterGridButton();
}

function clearModalFilters() {
    var tpl = G_OL_CurrentLevel || getSelectedTemplate();
    if (tpl && tpl.code) {
        loadTemplateDefaultDatesFromApi(tpl);
    } else {
        clearDateFilterInputs();
    }
    resetDropdownFilters();
    resetDynamicFilterSelections();
    clearSizeParameterFilter();
    if (tpl) {
        applyOtherFiltersVisibility(tpl);
        applyDynamicDateDefaults(tpl);
    }
    if (isLevelDateRangeAvailable()) {
        applyStaticDateFieldsFromTemplate(tpl || G_OL_CurrentLevel || getSelectedTemplate());
        ensureLevelDateRangeDefaults();
    }
    applyFilterActiveColors();
    updateFilterButtonState();
    updateModalEmptyState();
}

function applyFilterActiveColors() {
    $('#olFilterModal .ol-filter-field, #olFieldTemplate, #olHeaderDateBar .ol-filter-field')
        .removeClass('ol-filter-applied');

    if (!$('#olFieldFromDate').hasClass('ol-hidden') && $('#txtFromDate').val()) {
        $('#olFieldFromDate').addClass('ol-filter-applied');
    }
    if (!$('#olFieldToDate').hasClass('ol-hidden') && $('#txtToDate').val()) {
        $('#olFieldToDate').addClass('ol-filter-applied');
    }
    $('#olDynamicFilterHost .ol-filter-field').each(function () {
        var $sel = $(this).find('select');
        if ($sel.length && dynamicSelectHasValue($sel)) $(this).addClass('ol-filter-applied');
    });
    if ($('#ddlTemplate').val()) {
        $('#olFieldTemplate').addClass('ol-filter-applied');
    }
    if (!$('#olFieldLevel').hasClass('ol-hidden') && $('#ddlLevel').val() !== null && $('#ddlLevel').val() !== '') {
        $('#olFieldLevel').addClass('ol-filter-applied');
    }
    if (isLevelDateRangeAvailable() && ($('#txtFromDateModal').val() || $('#txtToDateModal').val())) {
        $('#olFieldLevel').addClass('ol-filter-applied');
    }

    G_OL_MULTI_SELECTS.concat(G_OL_OTHER_FILTER_SELECTS).forEach(function (selector) {
        var $select = $(selector);
        var $field = $select.closest('.ol-filter-field');
        if ($field.hasClass('ol-hidden')) return;

        var codes = getDropdownCodes(selector);
        var dropdownId = $select.attr('id') + '_cdDropdown';
        var $wrap = $('#' + dropdownId);
        var hasSelection = codes.length > 0;

        $wrap.toggleClass('ol-cd-has-selection', hasSelection);
        $field.toggleClass('ol-filter-applied', hasSelection);
    });
}

function getDefaultFromDate() {
    var now = new Date();
    return toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

function getDefaultToDate() {
    return toIsoDate(new Date());
}

function setDefaultDateFilterInputs() {
    $('#txtFromDate').val(getDefaultFromDate());
    $('#txtToDate').val(getDefaultToDate());
}

function clearDateFilterInputs() {
    $('#txtFromDate').val('');
    $('#txtToDate').val('');
}

function apiDateToIso(value) {
    if (value === null || value === undefined || value === '') return '';

    var str = String(value).trim();
    if (!str) return '';

    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return str.substring(0, 10);
    }

    var months = {
        jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
        jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
    };
    var apiMatch = /^(\d{1,2})[-\/]([A-Za-z]{3})[-\/](\d{4})$/.exec(str);
    if (apiMatch) {
        var mon = months[String(apiMatch[2]).toLowerCase()];
        if (mon) {
            return apiMatch[3] + '-' + String(mon).padStart(2, '0') + '-' + String(apiMatch[1]).padStart(2, '0');
        }
    }

    var slashMatch = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(str);
    if (slashMatch) {
        return slashMatch[3] + '-' + String(slashMatch[2]).padStart(2, '0') + '-' + String(slashMatch[1]).padStart(2, '0');
    }

    return '';
}

function extractDatesFromApiRow(row) {
    var out = { fromDate: '', toDate: '' };
    if (!row || typeof row !== 'object') return out;

    out.fromDate = prop(row, [
        'FromDate', 'fromDate', 'DefaultFromDate', 'defaultFromDate',
        'ReportFromDate', 'reportFromDate', 'StartDate', 'startDate', 'DateFrom', 'dateFrom'
    ]);
    out.toDate = prop(row, [
        'ToDate', 'toDate', 'DefaultToDate', 'defaultToDate',
        'ReportToDate', 'reportToDate', 'EndDate', 'endDate', 'DateTo', 'dateTo'
    ]);

    if (out.fromDate && out.toDate) return out;

    Object.keys(row).forEach(function (key) {
        var lower = String(key).toLowerCase().replace(/[\s_]/g, '');
        var val = row[key];
        if (val == null || val === '') return;

        if (!out.fromDate && /^(fromdate|defaultfromdate|reportfromdate|startdate|datefrom)$/.test(lower)) {
            out.fromDate = val;
        } else if (!out.toDate && /^(todate|defaulttodate|reporttodate|enddate|dateto)$/.test(lower)) {
            out.toDate = val;
        }
    });

    return out;
}

function applyTemplateDefaultDates(tpl) {
    tpl = tpl || getSelectedTemplate();
    var dates = extractDatesFromApiRow(tpl);
    var fromIso = apiDateToIso(dates.fromDate || tpl.fromDate);
    var toIso = apiDateToIso(dates.toDate || tpl.toDate);

    if (isAsOnDateMode(tpl)) {
        $('#txtFromDate').val('');
        $('#txtToDate').val(toIso || fromIso || '');
        return;
    }

    var showFrom = !tpl.code || isFlagY(tpl.showFromDate);
    var showTo = !tpl.code || isFlagY(tpl.showToDate);

    if (showFrom && normalizeFieldName(tpl.fieldForDate)) {
        $('#txtFromDate').val(fromIso || '');
    } else {
        $('#txtFromDate').val('');
    }

    if (showTo && normalizeFieldName(tpl.fieldForDate)) {
        $('#txtToDate').val(toIso || '');
    } else {
        $('#txtToDate').val('');
    }
}

function loadTemplateDefaultDatesFromApi(tpl) {
    tpl = tpl || getSelectedTemplate();
    if (!tpl || !tpl.code) {
        clearDateFilterInputs();
        return Promise.resolve();
    }

    var master = findTemplate(tpl.code) || {};
    var levelRow = null;
    if (G_OL_LevelRows && G_OL_LevelRows.length) {
        var levelIndex = tpl.levelIndex != null
            ? tpl.levelIndex
            : (templateTransactionHasDateField(G_OL_LevelRows)
                ? resolveLevelIndexByDateField(G_OL_LevelRows, $('#ddlLevel').val())
                : resolveLevelIndex(G_OL_LevelRows, $('#ddlLevel').val()));
        levelRow = levelIndex >= 0 ? G_OL_LevelRows[levelIndex] : G_OL_LevelRows[0];
    }

    var $opt = $('#ddlTemplate option:selected');
    var optionDates = {
        fromDate: $opt.attr('data-from-date') || '',
        toDate: $opt.attr('data-to-date') || ''
    };

    var mergedDates = extractDatesFromApiRow(tpl);
    var masterDates = extractDatesFromApiRow(master);
    var levelDates = extractDatesFromApiRow(levelRow);
    var fromIso = apiDateToIso(
        mergedDates.fromDate || tpl.fromDate || levelDates.fromDate || masterDates.fromDate || optionDates.fromDate
    );
    var toIso = apiDateToIso(
        mergedDates.toDate || tpl.toDate || levelDates.toDate || masterDates.toDate || optionDates.toDate
    );

    var hasDynamicFrom = dynamicConfigHasDateFilter('from');
    var hasDynamicTo = dynamicConfigHasDateFilter('to');
    if (hasDynamicFrom || hasDynamicTo) {
        applyDynamicDateDefaults(tpl);
        ensureLevelDateRangeDefaults();
        return Promise.resolve();
    }

    applyTemplateDefaultDates(Object.assign({}, tpl, master, {
        fromDate: fromIso || mergedDates.fromDate || tpl.fromDate || '',
        toDate: toIso || mergedDates.toDate || tpl.toDate || ''
    }));
    ensureLevelDateRangeDefaults();

    return Promise.resolve();
}

function showGridPanel(visible) {
    hideOrderLoadErrorCombo();
    if (visible) {
        $('#tblOrderLoadReport').css('display', 'flex');
        $('#olEmptyState').hide();
    } else {
        $('#tblOrderLoadReport').hide();
        $('#olGridMeta').hide();
        $('#olGridFooter').hide();
        clearGridExportState();
        $('#olEmptyState').show();
    }
    updateEmptyStateMessage();
    updateSizeParameterGridButton();
}

var OL_SQL_ERROR_KEYS = {
    success: true,
    errornumber: true,
    errorseverity: true,
    errorstate: true,
    errorprocedure: true,
    errorline: true,
    errormessage: true
};

function isSqlErrorResultRow(row) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
    var keys = Object.keys(row);
    if (!keys.length) return false;

    var lower = keys.map(function (key) { return String(key).toLowerCase(); });
    if (lower.indexOf('errormessage') < 0) return false;
    if (lower.indexOf('errornumber') < 0 && lower.indexOf('errorline') < 0) return false;

    return lower.every(function (key) { return !!OL_SQL_ERROR_KEYS[key]; });
}

function isSqlErrorResultSet(rows) {
    return !!(rows && rows.length && rows.every(isSqlErrorResultRow));
}

function sqlErrorMessageText(row) {
    var msg = String(prop(row, ['ErrorMessage', 'errorMessage']) || '').trim();
    if (!msg || msg.toLowerCase() === 'null') return '';
    return msg;
}

function hideOrderLoadErrorCombo() {
    $('#olErrorComboPanel').hide().empty();
}

function orderLoadErrorDisplayText(row) {
    if (typeof row === 'string') {
        var direct = String(row).trim();
        return direct.toLowerCase() === 'null' ? '' : direct;
    }

    var text = sqlErrorMessageText(row);
    if (text) return text;

    var num = String(prop(row, ['ErrorNumber', 'errorNumber']) || '').trim();
    var state = String(prop(row, ['ErrorState', 'errorState']) || '').trim();
    var proc = String(prop(row, ['ErrorProcedure', 'errorProcedure']) || '').trim();
    var line = String(prop(row, ['ErrorLine', 'errorLine']) || '').trim();
    var bits = [];
    if (num && num.toLowerCase() !== 'null') bits.push('Error ' + num);
    if (state && state.toLowerCase() !== 'null') bits.push('State ' + state);
    if (proc && proc.toLowerCase() !== 'null') bits.push(proc);
    if (line && line.toLowerCase() !== 'null') bits.push('Line ' + line);
    return bits.join(', ');
}

function showOrderLoadErrorCombo(rows) {
    var messages = [];
    (rows || []).forEach(function (row) {
        var text = orderLoadErrorDisplayText(row);
        if (text && messages.indexOf(text) < 0) messages.push(text);
    });
    if (!messages.length) messages.push('Report request failed.');

    showGridPanel(false);

    var $copy = $('<div class="ol-error-alert-copy"></div>');
    $copy.append($('<h4></h4>').text('Report could not be loaded'));
    messages.forEach(function (msg) {
        $copy.append($('<p class="ol-error-alert-msg"></p>').text(msg));
    });

    var $alert = $('<div class="ol-error-alert" role="alert"></div>');
    $alert.append('<div class="ol-error-alert-icon" aria-hidden="true"><i class="fas fa-circle-exclamation"></i></div>');
    $alert.append($copy);

    $('#olEmptyState').hide();
    $('#olErrorComboPanel')
        .empty()
        .append($alert)
        .css('display', 'flex');
}

function clearGridExportState() {
    G_OL_ExportRows = [];
    G_OL_GridDataReady = false;
    G_OL_TemplateTransactions = [];
    G_OL_PrintColumnDefs = [];
    clearOrderLoadSizeFilterItemCodes();
    updateDownloadButtonState();
}

function clearOrderLoadSizeFilterItemCodes() {
    G_OL_SizeFilterItemMasterCodes = '';
}

function refreshOrderLoadSizeFilterItemCodes(tpl) {
    tpl = tpl || getSelectedTemplate();
    return resolveOrderLoadItemMasterCodesForSizeFilter(tpl, { skipCache: true })
        .then(function (codes) {
            G_OL_SizeFilterItemMasterCodes = String(codes || '').trim();
            return G_OL_SizeFilterItemMasterCodes;
        })
        .catch(function () {
            G_OL_SizeFilterItemMasterCodes = '';
            return '';
        });
}

function canOpenOrderLoadSizeParameterFilter(tpl) {
    tpl = tpl || getSelectedTemplate();
    if (!shouldShowSizeParameterGridButton(tpl)) return false;
    if (G_OL_GridDataReady) return true;
    if (String(G_OL_SizeFilterItemMasterCodes || '').trim()) return true;
    if (getDynamicItemMasterCodesForSizeFilter().length) return true;
    if (isFlagY(tpl.showItemName)) return true;
    return false;
}

function setGridExportReady(rows) {
    G_OL_ExportRows = Array.isArray(rows) ? rows.slice() : [];
    G_OL_GridDataReady = G_OL_ExportRows.length > 0;
    updateDownloadButtonState();
}

function updateDownloadButtonState() {
    var canExport = G_OL_GridDataReady && G_OL_ExportRows.length > 0;
    var $wrap = $('#olDownloadWrap');
    var $btn = $('#btnOlDownload');

    $('#btnOlDownload').prop('disabled', !canExport);
    $('#btnOlPrint').prop('disabled', !canExport);
    $('#btnOlPreview').prop('disabled', !canExport);
    $wrap.toggleClass('ol-download-ready', canExport);
}

function canExportOrderLoadGrid() {
    return G_OL_GridDataReady && getOrderLoadExportRows().length > 0;
}

function resetFilters() {
    resetDropdownFilters();
    clearSizeParameterFilter();
    $('#chkOlReportFormat2').prop('checked', false);
    $('.ol-cd-wrap').removeClass('ol-cd-has-selection');
    $('#olFilterModal .ol-filter-field, #olFieldTemplate')
        .removeClass('ol-filter-applied');
    if (G_OL_Templates.length) {
        $('#ddlTemplate').prop('selectedIndex', 0);
        applyTemplateFilters();
    }
    updateFilterButtonState();
    showGridPanel(false);
}

function resetDropdownFilters() {
    G_OL_MULTI_SELECTS.forEach(function (selector) {
        var $select = $(selector);
        if (!$select.length) return;
        setCheckboxDropdownValue($select, ['0']);
    });
    G_OL_OTHER_FILTER_SELECTS.forEach(function (selector) {
        var $select = $(selector);
        if (!$select.length) return;
        setCheckboxDropdownValue($select, ['0']);
    });
}

function isFlagY(value) {
    if (value === true || value === 1) return true;
    if (value === false || value === 0) return false;
    return String(value || 'N').trim().toUpperCase() === 'Y';
}

function normalizeFieldName(value) {
    if (value === null || value === undefined) return '';
    var text = String(value).trim();
    if (!text) return '';
    if (text.charAt(0) === '[' && text.charAt(text.length - 1) === ']') {
        text = text.slice(1, -1).trim();
    }
    return text;
}

/** Dedup Date Field options when API returns BookingDate and Booking Date as separate keys. */
function canonicalDateFieldKey(value) {
    var n = normalizeFieldName(value);
    if (!n) return '';
    return n.replace(/[\s_]+/g, '').toLowerCase();
}

function resolveDateFieldOption(code, text) {
    var physical = normalizeFieldName(code) || normalizeFieldName(text);
    if (!physical) return null;
    return {
        value: physical,
        label: fieldNameToLabel(physical, physical)
    };
}

function getDistinctDateFieldOptions(rows) {
    var seen = {};
    var out = [];
    (rows || []).forEach(function (row) {
        var field = normalizeFieldName(prop(row, ['FieldForDate', 'fieldForDate']));
        if (!field || seen[field]) return;
        seen[field] = true;
        out.push({ value: field, label: fieldNameToLabel(field, field) });
    });
    return out;
}

/** Same default as report SP: last F_TempleteTransaction row with FieldForDate. */
function getDefaultDateFieldFromLevelRows(rows) {
    if (!rows || !rows.length) return '';
    for (var i = rows.length - 1; i >= 0; i--) {
        var field = normalizeFieldName(prop(rows[i], ['FieldForDate', 'fieldForDate']));
        if (field) return field;
    }
    return '';
}

function selectDateFieldComboValue($sel, physicalField) {
    if (!$sel || !$sel.length) return false;
    var target = normalizeFieldName(physicalField);
    var targetKey = canonicalDateFieldKey(target);
    if (!target && !targetKey) return false;
    var matched = false;
    $sel.find('option').each(function () {
        var val = normalizeFieldName($(this).val());
        var text = normalizeFieldName($(this).text());
        if (val === target || text === target
            || (targetKey && (canonicalDateFieldKey(val) === targetKey || canonicalDateFieldKey(text) === targetKey))) {
            $sel.val($(this).val());
            matched = true;
        }
    });
    return matched;
}

function templateTransactionHasDateField(rows) {
    return getDistinctDateFieldOptions(rows).length > 0;
}

function resolveLevelIndexByDateField(rows, dateField) {
    if (!rows || !rows.length) return -1;
    var target = normalizeFieldName(dateField);
    if (!target) return resolveLevelIndex(rows, null);

    for (var i = rows.length - 1; i >= 0; i--) {
        if (normalizeFieldName(prop(rows[i], ['FieldForDate', 'fieldForDate'])) === target) {
            return i;
        }
    }
    return resolveLevelIndex(rows, null);
}

function isAsOnDateMode(tpl) {
    tpl = tpl || getSelectedTemplate();
    if (!tpl || !tpl.code) return false;
    if (!normalizeFieldName(tpl.fieldForDate)) return false;
    return !isFlagY(tpl.showFromDate) && isFlagY(tpl.showToDate);
}

function isDynamicDateFieldCombo(row) {
    return String(row && row.displayName || '').trim().toLowerCase() === 'date field';
}

function getDynamicDateFieldComboRow() {
    return (G_OL_DynamicFilters || []).find(isDynamicDateFieldCombo) || null;
}

function configHasTextHeaderDates() {
    return dynamicConfigHasDateFilter('from') || dynamicConfigHasDateFilter('to');
}

function usesTemplateFilterConfigurationUi(tpl) {
    tpl = tpl || getSelectedTemplate();
    return hasActiveTemplateFilterConfiguration()
        || templateUsesFilterConfiguration(tpl && tpl.code);
}

function findTextHeaderDateRow(kind) {
    var param = String(kind || '').toLowerCase() === 'to' ? 'TODATE' : 'FROMDATE';
    return (G_OL_DynamicFilters || []).find(function (row) {
        return isTextHeaderDateRow(row) && resolveDynamicRowProcedureParameter(row) === param;
    }) || null;
}

function headerDateLabelFromConfigRow(row, fallback) {
    var label = String(row && row.displayName || '').trim();
    return label || fallback || '';
}

/** Label (display text) of the option picked in the "Date Field" combo, e.g. "Receive Date"; '' when nothing is picked. */
function selectedDateFieldLabel() {
    var row = getDynamicDateFieldComboRow();
    if (!row) return '';
    var $sel = $('#ddlDynFilter_' + row.code);
    if (!$sel.length) return '';
    var val = $sel.val();
    if (!val || val === '0') return '';
    var text = ($sel.find('option:selected').first().text() || '').trim();
    if (text && text.toLowerCase() !== 'all') return text;
    return fieldNameToLabel(normalizeFieldName(String(val)), '');
}

/** "From" + "Receive Date" -> "Receive Date From"; "To Date" -> "Receive Date To" (no doubled "Date"). */
function composeDateFieldLabel(dateFieldLabel, baseLabel) {
    var base = String(baseLabel || '').trim();
    var field = String(dateFieldLabel || '').trim();
    if (!field) return base;
    if (base.toLowerCase().indexOf(field.toLowerCase()) >= 0) return base;
    var shortBase = base.replace(/\s*date\s*$/i, '').trim() || base;
    return field + ' ' + shortBase;
}

/** Header + modal date inputs: labels from F_TemplateFilterConfiguration DisplayName (From / To). */
function applyConfigTextHeaderDateLabels() {
    if (!configHasTextHeaderDates()) return;

    var fromLbl = headerDateLabelFromConfigRow(findTextHeaderDateRow('from'), 'From');
    var toLbl = headerDateLabelFromConfigRow(findTextHeaderDateRow('to'), 'To');

    if (!$('#olFieldFromDate').hasClass('ol-hidden')) {
        $('#lblFromDateText').text(fromLbl);
        $('label[for="txtFromDate"]').html(escapeHtml(fromLbl) + ' <span class="text-danger">*</span>');
    }
    if (!$('#olFieldToDate').hasClass('ol-hidden')) {
        $('#lblToDateText').text(toLbl);
        $('label[for="txtToDate"]').html(escapeHtml(toLbl) + ' <span class="text-danger">*</span>');
    }

    /* Modal From/To sit under the "Date Field" combo: show which date they apply to (Receive Date From / To). */
    var dateFieldLbl = selectedDateFieldLabel();
    var mirrorFromLbl = composeDateFieldLabel(dateFieldLbl, fromLbl);
    var mirrorToLbl = composeDateFieldLabel(dateFieldLbl, toLbl);
    $('#olDynamicFilterHost .ol-mirror-from-label').text(mirrorFromLbl);
    $('#olDynamicFilterHost .ol-mirror-to-label').text(mirrorToLbl);
    $('#olDynamicFilterHost .ol-mirror-from').attr('aria-label', mirrorFromLbl);
    $('#olDynamicFilterHost .ol-mirror-to').attr('aria-label', mirrorToLbl);
}

function applySelectedConfigDateFieldCombo() {
    var row = getDynamicDateFieldComboRow();
    if (!row || !G_OL_CurrentLevel) return;

    var $sel = $('#ddlDynFilter_' + row.code);
    if (!$sel.length) return;

    var val = $sel.val();
    if (!val || val === '0') return;

    var field = normalizeFieldName(String(val));
    if (!field) {
        var text = ($sel.find('option:selected').first().text() || '').trim();
        field = normalizeFieldName(text);
    }
    if (!field) return;

    G_OL_CurrentLevel.fieldForDate = field;
    mergeTemplateLevel(G_OL_CurrentLevel);
    if (!configHasTextHeaderDates()) {
        applyFilterLabels(G_OL_CurrentLevel);
    } else {
        applyConfigTextHeaderDateLabels(); // modal From/To labels follow the selected Date Field
    }
}

function appendStaticDateFilterParts(filterParts, tpl, fromIso, toIso) {
    if (!normalizeFieldName(tpl && tpl.fieldForDate)) return;
    var dateField = getTemplateDateField(tpl);
    if (!dateField) return;

    var sqlDateField = toSqlFieldName(dateField);
    if (isAsOnDateMode(tpl)) {
        var asOnIso = String(toIso || fromIso || '').trim();
        if (asOnIso && !$('#olFieldToDate').hasClass('ol-hidden')) {
            filterParts.push(buildSqlDateCompareFragment(sqlDateField, '=', asOnIso));
        }
        return;
    }

    var showFrom = reportIncludesFromDate(tpl) && fromIso;
    var showTo = reportIncludesToDate(tpl) && toIso;
    if (showFrom) {
        filterParts.push(buildSqlDateCompareFragment(sqlDateField, '>=', fromIso));
    }
    if (showTo) {
        filterParts.push(buildSqlDateCompareFragment(sqlDateField, '<=', toIso));
    }
}

function reportIncludesFromDate(tpl) {
    if (shouldShowStaticFromDate(tpl) && !$('#olFieldFromDate').hasClass('ol-hidden')) return true;
    return isLevelDateRangeAvailable() && !!$('#txtFromDate').val();
}

function reportIncludesToDate(tpl) {
    if (shouldShowStaticToDate(tpl) && !$('#olFieldToDate').hasClass('ol-hidden')) return true;
    return isLevelDateRangeAvailable() && !!$('#txtToDate').val();
}

function isFromDateRequired(tpl) {
    if (isAsOnDateMode(tpl)) return false;
    if (dynamicConfigHasDateFilter('from')) return true;
    if (isLevelDateRangeAvailable() && normalizeFieldName(tpl && tpl.fieldForDate)) return true;
    if (hasActiveTemplateFilterConfiguration()) return false;
    return (!tpl || !tpl.code || isFlagY(tpl.showFromDate)) && !!normalizeFieldName(tpl && tpl.fieldForDate);
}

function isToDateRequired(tpl) {
    if (isAsOnDateMode(tpl)) return !!normalizeFieldName(tpl && tpl.fieldForDate);
    if (dynamicConfigHasDateFilter('to')) return true;
    if (isLevelDateRangeAvailable() && normalizeFieldName(tpl && tpl.fieldForDate)) return true;
    if (hasActiveTemplateFilterConfiguration()) return false;
    return (!tpl || !tpl.code || isFlagY(tpl.showToDate)) && !!normalizeFieldName(tpl && tpl.fieldForDate);
}

function toSqlFieldName(value) {
    var text = String(value || '').trim();
    if (!text) return '';

    if (text.indexOf('.') >= 0) {
        return text.split('.').map(function (part) {
            return toSqlFieldName(part);
        }).join('.');
    }

    if (text.charAt(0) === '[' && text.charAt(text.length - 1) === ']') {
        return text;
    }

    var name = normalizeFieldName(text);
    if (!name) return '';

    if (/[\s[\]]/.test(name) || /[^A-Za-z0-9_]/.test(name)) {
        return '[' + name.replace(/\]/g, ']]') + ']';
    }

    return name;
}

function fieldNameToLabel(fieldName, fallback) {
    var name = normalizeFieldName(fieldName) || fallback || '';
    if (!name) return fallback || '';
    return name
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
}

var G_OL_AUTO_FILTER_FLAG_MAP = {
    showfromdate: 'showFromDate',
    showtodate: 'showToDate',
    showwarehouse: 'showWareHouse',
    showitemgroup: 'showItemGroup',
    showprocess: 'showProcess',
    showmarketingman: 'showMarketingMan',
    showaspermarketingperson: 'showAsPerMarketingPerson',
    showorderno: 'showOrderNo',
    showitemtype: 'showItemType',
    showitemname: 'showItemName'
};

function getAutoFilterItemValue(row) {
    return String(prop(row, ['AutoFilterItem', 'autoFilterItem', 'Item', 'item']) || '').trim();
}

function autoFilterKeyToFlag(key) {
    return G_OL_AUTO_FILTER_FLAG_MAP[String(key || '').toLowerCase().replace(/[\s_]/g, '')] || '';
}

function parseAutoFilterItem(raw) {
    var text = String(raw || '').trim();
    if (!text) return null;

    var eqPos = text.indexOf('=');
    if (eqPos <= 0) return null;

    var flagKey = autoFilterKeyToFlag(text.substring(0, eqPos).trim());
    if (!flagKey) return null;

    return {
        flagKey: flagKey,
        flagValue: text.substring(eqPos + 1).trim() || 'N'
    };
}

function applyAutoFilterItemToTemplate(tpl, row) {
    var parsed = parseAutoFilterItem(getAutoFilterItemValue(row));
    if (parsed) {
        tpl[parsed.flagKey] = parsed.flagValue;
    }
    return tpl;
}

function collapseAutoFilterTemplateRows(rows) {
    if (!rows || !rows.length) return [];

    var hasAutoFilterItems = rows.some(function (row) {
        return !!getAutoFilterItemValue(row);
    });
    if (!hasAutoFilterItems) return rows;

    var grouped = {};
    var order = [];

    rows.forEach(function (row) {
        var code = parseInt(prop(row, ['Code', 'code']), 10) || 0;
        if (!code) return;

        if (!grouped[code]) {
            grouped[code] = {
                code: code,
                desp: prop(row, ['Desp', 'desp']),
                masterTemplete: prop(row, ['MasterTemplete', 'masterTemplete', 'MasterTemplate', 'masterTemplate']),
                procedureName: prop(row, ['ProcedureName', 'procedureName']),
                procedureParameters: prop(row, ['ProcedureParameters', 'procedureParameters']),
                otherFilter1: prop(row, ['OtherFilter1', 'otherFilter1']),
                otherFilter2: prop(row, ['OtherFilter2', 'otherFilter2']),
                otherFilter3: prop(row, ['OtherFilter3', 'otherFilter3']),
                freezeFromColumn: prop(row, ['FreezeFromColumn', 'freezeFromColumn']),
                showSizeParameterFilter: prop(row, ['ShowSizeParameterFilter', 'showSizeParameterFilter']) || 'N',
                reportFileName: String(prop(row, ['ReportFileName', 'reportFileName']) || '').trim(),
                reportFileNameFormat2: String(prop(row, ['ReportFileNameFormat2', 'reportFileNameFormat2']) || '').trim(),
                fromDate: extractDatesFromApiRow(row).fromDate,
                toDate: extractDatesFromApiRow(row).toDate
            };
            order.push(code);
        }

        applyAutoFilterItemToTemplate(grouped[code], row);
    });

    return order.map(function (code) {
        return grouped[code];
    });
}

function mapTemplate(row) {
    var tpl = Object.assign(getDefaultLevelTemplate(), {
        code: parseInt(prop(row, ['Code', 'code']), 10) || 0,
        desp: prop(row, ['Desp', 'desp']),
        masterTemplete: normalizeMasterTemplete(prop(row, ['MasterTemplete', 'masterTemplete', 'MasterTemplate', 'masterTemplate'])),
        procedureName: prop(row, ['ProcedureName', 'procedureName']),
        procedureParameters: prop(row, ['ProcedureParameters', 'procedureParameters']),
        otherFilter1: String(prop(row, ['OtherFilter1', 'otherFilter1']) || '').trim(),
        otherFilter2: String(prop(row, ['OtherFilter2', 'otherFilter2']) || '').trim(),
        otherFilter3: String(prop(row, ['OtherFilter3', 'otherFilter3']) || '').trim(),
        freezeFromColumn: String(prop(row, ['FreezeFromColumn', 'freezeFromColumn']) || '').trim(),
        showSizeParameterFilter: prop(row, ['ShowSizeParameterFilter', 'showSizeParameterFilter']) || 'N',
        reportFileName: String(prop(row, ['ReportFileName', 'reportFileName']) || '').trim(),
        reportFileNameFormat2: String(prop(row, ['ReportFileNameFormat2', 'reportFileNameFormat2']) || '').trim()
    });
    var rowDates = extractDatesFromApiRow(row);
    tpl.fromDate = rowDates.fromDate || tpl.fromDate;
    tpl.toDate = rowDates.toDate || tpl.toDate;

    return ensureStaticLevelDefaults(applyApiLevelRow(tpl, row));
}

function normalizeMasterTemplete(value) {
    return isFlagY(value) ? 'Y' : 'N';
}

function getTemplateOptionClass(masterFlag) {
    return masterFlag === 'Y' ? 'ol-tpl-master-y' : 'ol-tpl-master-n';
}

function formatTemplateDisplayName(desp, masterFlag) {
    return String(desp || '').trim();
}

function updateTemplateSelectStyle() {
    var $ddl = $('#ddlTemplate');
    var $opt = $ddl.find('option:selected');
    var flag = normalizeMasterTemplete($opt.attr('data-master-templete'));

    $ddl.removeClass('ol-tpl-selected-y ol-tpl-selected-n');
    if ($ddl.val()) {
        $ddl.addClass(flag === 'Y' ? 'ol-tpl-selected-y' : 'ol-tpl-selected-n');
    }
}

function getTemplateMasterConfig(templateCode) {
    var tpl = Object.assign(getDefaultLevelTemplate(), findTemplate(templateCode) || {}, { code: templateCode });
    return tpl;
}

function extractApiRowFields(row) {
    var out = {
        hasFieldForClient: false,
        hasFieldForDate: false,
        fieldForClient: '',
        fieldForDate: '',
        fromDate: '',
        toDate: '',
        flags: {}
    };

    if (!row) return out;

    Object.keys(row).forEach(function (key) {
        var lower = String(key).toLowerCase().replace(/[\s_]/g, '');
        var val = row[key];

        if (lower === 'fieldforclient') {
            out.hasFieldForClient = true;
            out.fieldForClient = normalizeFieldName(val);
        } else if (lower === 'fieldfordate') {
            out.hasFieldForDate = true;
            out.fieldForDate = normalizeFieldName(val);
        } else if (lower === 'fromdate' || lower === 'defaultfromdate' || lower === 'reportfromdate' || lower === 'startdate' || lower === 'datefrom') {
            out.fromDate = val;
        } else if (lower === 'todate' || lower === 'defaulttodate' || lower === 'reporttodate' || lower === 'enddate' || lower === 'dateto') {
            out.toDate = val;
        } else if (lower === 'showfromdate') out.flags.showFromDate = val;
        else if (lower === 'showtodate') out.flags.showToDate = val;
        else if (lower === 'showwarehouse') out.flags.showWareHouse = val;
        else if (lower === 'showitemgroup') out.flags.showItemGroup = val;
        else if (lower === 'showprocess') out.flags.showProcess = val;
        else if (lower === 'showmarketingman') out.flags.showMarketingMan = val;
        else if (lower === 'showaspermarketingperson') out.flags.showAsPerMarketingPerson = val;
        else if (lower === 'showorderno') out.flags.showOrderNo = val;
        else if (lower === 'showitemtype') out.flags.showItemType = val;
        else if (lower === 'showitemname') out.flags.showItemName = val;
        else if (lower === 'otherfilter1') out.flags.otherFilter1 = val;
        else if (lower === 'otherfilter2') out.flags.otherFilter2 = val;
        else if (lower === 'otherfilter3') out.flags.otherFilter3 = val;
        else if (lower === 'autofilteritem') {
            var autoFilterParsed = parseAutoFilterItem(val);
            if (autoFilterParsed) out.flags[autoFilterParsed.flagKey] = autoFilterParsed.flagValue;
        } else if (lower === 'item') {
            var itemParsed = parseAutoFilterItem(val);
            if (itemParsed) out.flags[itemParsed.flagKey] = itemParsed.flagValue;
        }
    });

    return out;
}

function applyApiLevelRow(tpl, row) {
    if (!row) return tpl;

    var fields = extractApiRowFields(row);

    if (fields.hasFieldForClient) {
        tpl.fieldForClient = fields.fieldForClient || '';
    }
    if (fields.hasFieldForDate) {
        tpl.fieldForDate = fields.fieldForDate;
        tpl._fieldForDateFromApi = true;
    }
    if (fields.fromDate) {
        tpl.fromDate = fields.fromDate;
    }
    if (fields.toDate) {
        tpl.toDate = fields.toDate;
    }

    Object.keys(fields.flags).forEach(function (key) {
        if (fields.flags[key] != null && fields.flags[key] !== '') {
            tpl[key] = fields.flags[key];
        }
    });

    return tpl;
}

function isFullTemplateRow(row) {
    return !!(
        getAutoFilterItemValue(row) ||
        prop(row, ['ShowFromDate', 'showFromDate']) ||
        prop(row, ['ShowWareHouse', 'showWareHouse']) ||
        prop(row, ['ShowItemGroup', 'showItemGroup']) ||
        prop(row, ['Code', 'code'])
    );
}

function buildLevelOptionText(row, index) {
    var desp = prop(row, ['Desp', 'desp', 'LevelDesp', 'levelDesp', 'LevelName', 'levelName']);
    if (desp) return desp;

    var client = fieldNameToLabel(prop(row, ['FieldForClient', 'fieldForClient']), 'Party Name');
    var date = normalizeFieldName(prop(row, ['FieldForDate', 'fieldForDate']));
    var dateLabel = date ? ' + ' + fieldNameToLabel(date, 'Order Date') : '';
    return 'Level ' + (index + 1) + ' — ' + client + dateLabel;
}

/** True when F_TemplateFilterConfiguration rows exist for this template (cache or in-memory). */
function templateUsesFilterConfiguration(templateCode) {
    var code = parseInt(templateCode, 10) || parseInt($('#ddlTemplate').val(), 10) || 0;
    if (!code) return false;

    if ((G_OL_DynamicFilters || []).some(function (row) {
        return row.templateCode === code && row.code > 0 && row.isActive !== 'N';
    })) {
        return true;
    }

    var cacheKey = 'tpl_' + code;
    if (G_OL_FilterConfigCache && G_OL_FilterConfigCache.key === cacheKey) {
        return (G_OL_FilterConfigCache.rows || []).some(function (row) {
            var tplCode = parseInt(prop(row, ['F_TempleteMaster_Code', 'f_TempleteMaster_Code']), 10) || 0;
            var rowCode = parseInt(prop(row, ['Code', 'code']), 10) || 0;
            return tplCode === code && rowCode > 0;
        });
    }

    return false;
}

/*
  "Date Field" (#olFieldLevel) comes from GetLevel → F_TempleteTransaction.FieldForDate,
  NOT from F_TemplateFilterConfiguration. When filter configuration rows exist, modal
  filters must match that table only (Text dates → header; Combo → modal).
*/
function syncOrderLoadTemplateDateFieldUi(tpl) {
    tpl = tpl || getSelectedTemplate();
    var levelOptions = getDistinctDateFieldOptions(G_OL_LevelRows);

    if (hasActiveTemplateFilterConfiguration() || templateUsesFilterConfiguration(tpl.code)) {
        toggleFilterField('olFieldLevel', false);
        applyStaticDateFieldsFromTemplate(tpl);
        return;
    }

    toggleFilterField('olFieldLevel', levelOptions.length > 0);
    if (levelOptions.length > 0) {
        ensureLevelDateRangeDefaults();
    } else {
        syncLevelDateRangeUi();
    }
}

function bindLevelDropdown(rows) {
    var $field = $('#olFieldLevel');
    var $ddl = $('#ddlLevel').empty();
    var dateOptions = getDistinctDateFieldOptions(rows);
    var templateCode = parseInt($('#ddlTemplate').val(), 10) || 0;

    if (!dateOptions.length || templateUsesFilterConfiguration(templateCode)) {
        $field.addClass('ol-hidden');
        syncLevelDateRangeUi();
        return resolveLevelIndex(rows || [], null);
    }

    $field.removeClass('ol-hidden');
    dateOptions.forEach(function (opt) {
        $ddl.append($('<option/>').val(opt.value).text(opt.label));
    });

    var defaultValue = dateOptions[dateOptions.length - 1].value;
    $ddl.val(defaultValue);
    syncLevelDateRangeUi();
    ensureLevelDateRangeDefaults();
    return resolveLevelIndexByDateField(rows, defaultValue);
}

function resolveLevelIndex(rows, preferredIndex) {
    if (!rows || !rows.length) return -1;
    if (rows.length === 1) return 0;

    var index = parseInt(preferredIndex, 10);
    if (!isNaN(index) && index >= 0 && index < rows.length) return index;

    for (var i = rows.length - 1; i >= 0; i--) {
        if (normalizeFieldName(prop(rows[i], ['FieldForDate', 'fieldForDate']))) return i;
    }

    return rows.length - 1;
}

function buildTemplateLevel(templateCode, levelRow) {
    var master = getTemplateMasterConfig(templateCode);
    var tpl = Object.assign({}, master);

    if (levelRow) {
        tpl = applyApiLevelRow(tpl, levelRow);
    }

    // Keep OtherFilter values from TEMPLETEREPORT when level row has blanks
    if (!hasOtherFilterValue(tpl.otherFilter1) && hasOtherFilterValue(master.otherFilter1)) {
        tpl.otherFilter1 = master.otherFilter1;
    }
    if (!hasOtherFilterValue(tpl.otherFilter2) && hasOtherFilterValue(master.otherFilter2)) {
        tpl.otherFilter2 = master.otherFilter2;
    }
    if (!hasOtherFilterValue(tpl.otherFilter3) && hasOtherFilterValue(master.otherFilter3)) {
        tpl.otherFilter3 = master.otherFilter3;
    }

    tpl.code = templateCode;
    return ensureStaticLevelDefaults(tpl);
}

function applySelectedLevel() {
    var code = parseInt($('#ddlTemplate').val(), 10) || 0;
    if (!code) {
        G_OL_CurrentLevel = null;
        applyLevelToFilters(getDefaultLevelTemplate());
        return;
    }

    var levelIndex = templateTransactionHasDateField(G_OL_LevelRows)
        ? resolveLevelIndexByDateField(G_OL_LevelRows, $('#ddlLevel').val())
        : resolveLevelIndex(G_OL_LevelRows, $('#ddlLevel').val());
    var levelRow = levelIndex >= 0 ? G_OL_LevelRows[levelIndex] : null;
    var tpl = buildTemplateLevel(code, levelRow);
    tpl.levelIndex = levelIndex;

    mergeTemplateLevel(tpl);
    applyLevelToFilters(tpl);
}

function bindTemplateLevel(code) {
    return ensureFinYearTokens().then(function () {
        return Promise.all([
            OrderLoadReportService.GetLevel(code).then(function (res) {
                return unwrapApiList(res);
            }),
            fetchTemplateFilterConfigurationRows(code)
        ]);
    }).then(function (results) {
        if ((parseInt($('#ddlTemplate').val(), 10) || 0) !== code) return null;

        G_OL_LevelRows = results[0] || [];
        G_OL_FilterConfigCache = { key: 'tpl_' + code, rows: results[1] || [] };

        bindLevelDropdown(G_OL_LevelRows);
        applySelectedLevel();
        return loadTemplateDefaultDatesFromApi(G_OL_CurrentLevel).then(function () {
            applyFilterActiveColors();
            updateFilterButtonState();
            return G_OL_CurrentLevel;
        });
    });
}

function ensureStaticLevelDefaults(tpl) {
    if (!tpl) tpl = getDefaultLevelTemplate();
    return tpl;
}

function applyFilterLabels(tpl) {
    var dateField = normalizeFieldName(getTemplateDateField(tpl)) || normalizeFieldName(tpl.fieldForDate);
    var dateLabel = dateField
        ? fieldNameToLabel(dateField, 'Order Date')
        : 'Order Date';
    var clientLabel = fieldNameToLabel(tpl.fieldForClient || 'PartyName', 'Party Name');
    var textHeaderDates = configHasTextHeaderDates();

    $('#txtFromDate').attr('data-level-field', dateField || '');
    $('#txtToDate').attr('data-level-field', dateField || '');

    if (!textHeaderDates) {
        if ($('#lblFromDateText').length) {
            $('#lblFromDateText').text(dateLabel);
            $('#lblToDateText').text('To Date');
        } else {
            $('label[for="txtFromDate"]').html(dateLabel + ' <span class="text-danger">*</span>');
            $('label[for="txtToDate"]').html('To Date <span class="text-danger">*</span>');
        }
    } else {
        applyConfigTextHeaderDateLabels();
    }

    $('#olSearchSlot input[type="text"], #global-search-wrap-OrderLoadReport input').attr(
        'placeholder',
        getGridSearchPlaceholder(clientLabel)
    );
}

function toggleFilterField(fieldId, visible) {
    $('#' + fieldId).toggleClass('ol-hidden', !visible);
    if (fieldId === 'olFieldFromDate' || fieldId === 'olFieldToDate') {
        syncHeaderDateBarVisibility();
    }
}

function syncHeaderDateBarVisibility() {
    var showBar = !$('#olFieldFromDate').hasClass('ol-hidden') || !$('#olFieldToDate').hasClass('ol-hidden');
    $('#olHeaderDateBar').toggleClass('ol-hidden', !showBar);
}

/**
 * Date Field (template level dropdown): From/To stay inside the filter modal only.
 * F_TemplateFilterConfiguration ControlType Text (From/To) binds in the header bar.
 */
function isLevelDateRangeAvailable() {
    return !$('#olFieldLevel').hasClass('ol-hidden');
}

function syncModalDatesFromHeader() {
    $('#txtFromDateModal').val($('#txtFromDate').val() || '');
    $('#txtToDateModal').val($('#txtToDate').val() || '');
    syncDateFieldModalHeaderMirror();
}

/** Modal From/To under Date Field — same values as header; editable both ways. */
function syncDateFieldModalHeaderMirror() {
    var fromIso = $('#txtFromDate').val() || '';
    var toIso = $('#txtToDate').val() || '';
    $('#olDynamicFilterHost .ol-config-header-date-mirror .ol-mirror-from').val(fromIso);
    $('#olDynamicFilterHost .ol-config-header-date-mirror .ol-mirror-to').val(toIso);
}

function syncHeaderDatesFromModalMirror() {
    var $from = $('#olDynamicFilterHost .ol-config-header-date-mirror .ol-mirror-from').first();
    var $to = $('#olDynamicFilterHost .ol-config-header-date-mirror .ol-mirror-to').first();
    if ($from.length) $('#txtFromDate').val($from.val() || '');
    if ($to.length) $('#txtToDate').val($to.val() || '');
    $('#txtFromDateModal').val($('#txtFromDate').val() || '');
    $('#txtToDateModal').val($('#txtToDate').val() || '');
}

function syncLevelDateRangeUi() {
    var available = isLevelDateRangeAvailable();
    $('#olLevelDates').toggleClass('ol-hidden', !available);
    $('#olFieldLevel').toggleClass('ol-level-range-on', available);
    $('#txtFromDateModal, #txtToDateModal').prop('disabled', !available);
    syncModalDatesFromHeader();
}

/** Default range for modal date field: 1st of current month .. today (only fills blanks). */
function ensureLevelDateRangeDefaults() {
    syncLevelDateRangeUi();
    if (!isLevelDateRangeAvailable()) return;
    if (hasActiveTemplateFilterConfiguration()) {
        syncModalDatesFromHeader();
        return;
    }

    if (!dynamicConfigHasDateFilter('from') && !$('#txtFromDate').val()) {
        $('#txtFromDate').val(getDefaultFromDate());
    }
    if (!dynamicConfigHasDateFilter('to') && !$('#txtToDate').val()) {
        $('#txtToDate').val(getDefaultToDate());
    }
    syncModalDatesFromHeader();
}

function prepareTemplateFilterSwitch(code) {
    ++G_OL_FilterLoadSeq;
    G_OL_FilterConfigFetchPending = false;
    G_OL_DynamicFilters = [];
    G_OL_HasDynamicComboFilters = false;
    clearDynamicFilterHost();
    if (code > 0) {
        hideStaticComboFilters();
        toggleFilterField('olFieldLevel', false);
    }
    updateModalEmptyState();
}

function applyTemplateFilters() {
    updateTemplateSelectStyle();

    var code = parseInt($('#ddlTemplate').val(), 10) || 0;
    prepareTemplateFilterSwitch(code);

    resetDropdownFilters();
    G_OL_DropdownLoaded = {};
    G_OL_LevelRows = [];
    G_OL_ShowTotalKeys = [];
    G_OL_ShowTotalLoaded = false;
    resetOtherFilterSlot(1);
    resetOtherFilterSlot(2);
    resetOtherFilterSlot(3);
    showGridPanel(false);

    if (!code) {
        G_OL_CurrentLevel = null;
        bindLevelDropdown([]);
        applyLevelToFilters(getDefaultLevelTemplate());
        updateReportFormat2Checkbox(getDefaultLevelTemplate());
        return;
    }

    bindTemplateLevel(code).catch(function () {
        var currentCode = parseInt($('#ddlTemplate').val(), 10) || 0;
        if (currentCode !== code) return;
        toastr.error('Could not load template level filters.');
        G_OL_LevelRows = [];
        bindLevelDropdown([]);
        applyLevelToFilters(getTemplateMasterConfig(code));
    });
}

function mergeTemplateLevel(tpl) {
    if (!tpl || !tpl.code) return;

    var idx = G_OL_Templates.findIndex(function (t) {
        return (parseInt(t.code, 10) || 0) === (parseInt(tpl.code, 10) || 0);
    });
    if (idx >= 0) {
        G_OL_Templates[idx] = Object.assign({}, G_OL_Templates[idx], tpl);
    }
}

function getDefaultLevelTemplate() {
    return {
        code: 0,
        desp: '',
        showFromDate: 'Y',
        showToDate: 'Y',
        showWareHouse: 'N',
        showItemGroup: 'N',
        showProcess: 'N',
        showMarketingMan: 'N',
        showAsPerMarketingPerson: 'N',
        showOrderNo: 'N',
        showItemType: 'N',
        showItemName: 'N',
        showSizeParameterFilter: 'N',
        reportFileName: '',
        reportFileNameFormat2: '',
        freezeFromColumn: '',
        otherFilter1: '',
        otherFilter2: '',
        otherFilter3: '',
        fieldForClient: '',
        fieldForDate: ''
    };
}

function applyStaticDateFieldsFromTemplate(tpl) {
    applyStaticDateFieldsCore(tpl);
    ensureLevelDateRangeDefaults();
}

function applyStaticDateFieldsCore(tpl) {
    tpl = ensureStaticLevelDefaults(tpl || getDefaultLevelTemplate());
    var levelDatesInModal = isLevelDateRangeAvailable();

    if (hasActiveTemplateFilterConfiguration()) {
        applyFilterLabels(tpl);
        if (configHasTextHeaderDates()) {
            applyDynamicDateDefaults(tpl);
        }
        if (isAsOnDateMode(tpl)) {
            toggleFilterField('olFieldFromDate', false);
            toggleFilterField('olFieldToDate', true);
            $('#txtFromDate').val('');
            $('#lblToDateText').text('As On');
            $('label[for="txtToDate"]').html('As On <span class="text-danger">*</span>');
        } else {
            toggleFilterField('olFieldFromDate', dynamicConfigHasDateFilter('from'));
            toggleFilterField('olFieldToDate', dynamicConfigHasDateFilter('to'));
        }
        syncLevelDateRangeUi();
        syncHeaderDateBarVisibility();
        syncModalDatesFromHeader();
        return;
    }

    var hasDateField = !!normalizeFieldName(tpl.fieldForDate);
    if (levelDatesInModal && hasDateField) {
        toggleFilterField('olFieldFromDate', false);
        toggleFilterField('olFieldToDate', false);
        syncLevelDateRangeUi();
        return;
    }

    var showFromFlag = !tpl.code || isFlagY(tpl.showFromDate);
    var showToFlag = !tpl.code || isFlagY(tpl.showToDate);
    var asOn = hasDateField && isAsOnDateMode(tpl);
    var hideDates = !hasDateField || (!showFromFlag && !showToFlag);

    if (hideDates) {
        toggleFilterField('olFieldFromDate', false);
        toggleFilterField('olFieldToDate', false);
        $('#txtFromDate').val('');
        $('#txtToDate').val('');
        return;
    }

    if (asOn) {
        toggleFilterField('olFieldFromDate', false);
        toggleFilterField('olFieldToDate', true);
        $('#txtFromDate').val('');
        $('#lblToDateText').text('As On');
        $('label[for="txtToDate"]').html('As On <span class="text-danger">*</span>');
        $('#txtToDate').attr('data-level-field', normalizeFieldName(tpl.fieldForDate) || '');
        return;
    }

    applyFilterLabels(tpl);
    toggleFilterField('olFieldFromDate', showFromFlag);
    toggleFilterField('olFieldToDate', showToFlag);
    if (!showFromFlag && !levelDatesInModal) $('#txtFromDate').val('');
    if (!showToFlag && !levelDatesInModal) $('#txtToDate').val('');
    syncLevelDateRangeUi();
}

function applyLevelToFilters(tpl) {
    tpl = ensureStaticLevelDefaults(tpl);
    G_OL_CurrentLevel = tpl;

    syncTemplateGridMeta(tpl);
    loadDynamicTemplateFilters(tpl);

    var usesConfigUi = usesTemplateFilterConfigurationUi(tpl);
    var configReady = hasActiveTemplateFilterConfiguration();

    if (!usesConfigUi || configReady) {
        applyStaticDateFieldsFromTemplate(tpl);
    }

    if (usesConfigUi || G_OL_HasDynamicComboFilters) {
        hideStaticComboFilters();
    } else if (!configReady && (tpl.code || 0) > 0 && templateUsesFilterConfiguration(tpl.code)) {
        hideStaticComboFilters();
    } else if (!G_OL_FilterConfigFetchPending && !templateUsesFilterConfiguration(tpl.code)) {
        toggleFilterField('olFieldWareHouse', isFlagY(tpl.showWareHouse));
        toggleFilterField('olFieldItemGroup', isFlagY(tpl.showItemGroup));
        toggleFilterField('olFieldProcess', isFlagY(tpl.showProcess));
        toggleFilterField('olFieldMarketingMan', isFlagY(tpl.showMarketingMan) || isFlagY(tpl.showAsPerMarketingPerson));
        toggleFilterField('olFieldOrderNo', isFlagY(tpl.showOrderNo));
        toggleFilterField('olFieldItemType', isFlagY(tpl.showItemType));
        toggleFilterField('olFieldItemName', isFlagY(tpl.showItemName));
        applyOtherFiltersVisibility(tpl);
    }

    applyFilterActiveColors();
    updateFilterButtonState();
    updateReportFormat2Checkbox(tpl);
}

function trimReportFileName(value) {
    return String(value || '').trim();
}

function formatReportFileLabel(fileName) {
    var text = trimReportFileName(fileName);
    if (!text) return 'Format 2';
    return text.replace(/\.rpt$/i, '') || 'Format 2';
}

function usesOrderLoadCrystalReport(tpl) {
    return !!trimReportFileName(tpl && tpl.reportFileName);
}

function getOrderLoadCrystalReportFileName(tpl) {
    tpl = tpl || getSelectedTemplate();
    var primary = trimReportFileName(tpl.reportFileName);
    var format2 = trimReportFileName(tpl.reportFileNameFormat2);
    if (!primary) return '';
    if (format2 && $('#chkOlReportFormat2').prop('checked')) {
        return format2;
    }
    return primary;
}

function updateReportFormat2Checkbox(tpl) {
    tpl = tpl || getSelectedTemplate();
    var $wrap = $('#olReportFormat2Wrap');
    var format2 = trimReportFileName(tpl.reportFileNameFormat2);

    if (format2 && usesOrderLoadCrystalReport(tpl)) {
        $wrap.removeClass('is-hidden');
        $('#lblOlReportFormat2').text(formatReportFileLabel(format2));
    } else {
        $wrap.addClass('is-hidden');
        $('#chkOlReportFormat2').prop('checked', false);
    }
}

function openOrderLoadCrystalReportUrl(response) {
    var url = LedgerService.extractCrystalUrl(response);
    if (!url) return false;

    var win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
        var a = document.createElement('a');
        a.style.display = 'none';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    return true;
}

function hasOtherFilterValue(value) {
    return String(value || '').trim() !== '';
}

function applyOtherFiltersVisibility() {
    // OtherFilter1/2/3 options were loaded via GetOtherFilterDetails (removed) — keep slots hidden and empty.
    [1, 2, 3].forEach(function (index) {
        toggleFilterField('olFieldOtherFilter' + index, false);
        resetOtherFilterSlot(index);
    });

    updateModalEmptyState();
}

function updateModalEmptyState() {
    var anyVisible = G_OL_MODAL_FIELD_IDS.some(function (fieldId) {
        return !$('#' + fieldId).hasClass('ol-hidden');
    }) || $('#olDynamicFilterHost .ol-filter-field').length > 0;
    $('#olFilterModalEmpty').toggleClass('ol-hidden', anyVisible);
    $('.ol-filter-modal-grid').toggleClass('ol-hidden', !anyVisible);
}

function resetOtherFilterSlot(index) {
    G_OL_OTHER_FILTER_META[index] = { query: '', fieldName: '', label: '', nameColumn: '', flag: '', tableName: '' };
    G_OL_DropdownLoaded['otherFilter' + index] = false;
    var $select = $('#ddlOtherFilter' + index);
    if ($select.length) {
        $select.empty().append($('<option/>', { value: '0', text: 'All' }));
        var dropdownId = $select.attr('id') + '_cdDropdown';
        $('#' + dropdownId).remove();
        $('.ol-cd-menu[data-for="' + dropdownId + '"]').remove();
    }
    $('#lblOtherFilter' + index).text('Other Filter ' + index);
}

/*
  OtherFilter format:
    Label#NameColumn#SqlSource#FilterField#Flag
  Example:
    Entry Type#EntryType#(select 1 Code, 'Purchase' EntryType ...)A#A.[Entry Type]#N
*/
function parseOtherFilterDefinition(raw) {
    var text = String(raw || '').trim();
    if (!text) return null;

    var parts = text.split('#');
    if (parts.length < 5) {
        return {
            label: '',
            nameColumn: 'Desp',
            sqlSource: text,
            filterField: '',
            flag: 'N',
            raw: text
        };
    }

    return {
        label: String(parts[0] || '').trim(),
        nameColumn: String(parts[1] || '').trim(),
        sqlSource: parts.slice(2, parts.length - 2).join('#').trim(),
        filterField: String(parts[parts.length - 2] || '').trim(),
        flag: String(parts[parts.length - 1] || '').trim(),
        raw: text
    };
}

/* ── Checkbox multi-select dropdown (same pattern as CommonSizeFilterControl.js) ── */
/* Menu is appended inside the filter modal (when open) so Bootstrap focus-trap
   allows typing in the search box; otherwise it goes to document.body. */

function isFilterModalOpen() {
    return $('#olFilterModal').hasClass('show');
}

function getCheckboxDropdownMenuContainer() {
    return isFilterModalOpen() ? $('#olFilterModal') : $(document.body);
}

function ensureCheckboxDropdownMenuContainer($menu) {
    var $container = getCheckboxDropdownMenuContainer();
    if (!$menu.parent().is($container)) {
        $menu.appendTo($container);
    }
}

function setFilterModalFocusTrap(active) {
    var modalEl = document.getElementById('olFilterModal');
    if (!modalEl || !window.bootstrap || !bootstrap.Modal) return;

    var instance = bootstrap.Modal.getInstance(modalEl);
    if (!instance || !instance._focustrap) return;

    if (active) {
        instance._focustrap.activate();
    } else {
        instance._focustrap.deactivate();
    }
}

function suspendFilterModalFocusTrap() {
    if (!isFilterModalOpen() || G_OL_FilterModalFocusTrapSuspended) return;
    G_OL_FilterModalFocusTrapSuspended = true;
    setFilterModalFocusTrap(false);
}

function resumeFilterModalFocusTrap() {
    if (!G_OL_FilterModalFocusTrapSuspended) return;
    G_OL_FilterModalFocusTrapSuspended = false;
    G_OL_OpenCheckboxDropdownId = '';
    if (isFilterModalOpen()) {
        setFilterModalFocusTrap(true);
    }
}

function closeOtherCheckboxDropdowns(exceptDropdownId) {
    $('.ol-cd-wrap').each(function () {
        if (this.id !== exceptDropdownId) $(this).removeClass('ol-cd-open');
    });
    $('.ol-cd-menu').each(function () {
        if ($(this).attr('data-for') !== exceptDropdownId) $(this).hide();
    });
}

function positionCheckboxDropdownMenu($wrap, $menu) {
    var header = $wrap.find('.ol-cd-header')[0];
    if (!header) return;

    var rect = header.getBoundingClientRect();
    var menuWidth = Math.max(rect.width, 220);
    var left = Math.min(rect.left, window.innerWidth - menuWidth - 12);
    left = Math.max(12, left);

    $menu.css({
        position: 'fixed',
        top: rect.bottom + 4,
        left: left,
        width: menuWidth
    });
}

function syncCheckboxDropdownToSelect($select, $wrap, $menu) {
    var $checked = $menu.find('.ol-cd-checkbox:checked');
    var values = $checked.map(function () { return String($(this).val()); }).get();

    $select.val(values).trigger('change');

    var $headerText = $wrap.find('.ol-cd-header-text');
    var hasSelection = values.length > 0 && values.indexOf('0') < 0;

    if (!hasSelection) {
        $headerText.text($wrap.data('placeholder') || 'All');
    } else if (values.length === 1) {
        $headerText.text($checked.first().data('text'));
    } else {
        $headerText.text(values.length + ' selected');
    }

    $wrap.toggleClass('ol-cd-has-selection', hasSelection);

    if ($select.attr('id') === 'ddlItemName') {
        refreshOrderLoadSizeFilterItemCodes(getSelectedTemplate());
        updateSizeParameterGridButton();
    }

    var dropdownId = $select.attr('id') + '_cdDropdown';
    var $menu = $('.ol-cd-menu[data-for="' + dropdownId + '"]');
    if ($menu.length) {
        updateCheckboxDropdownSelectionHint($wrap, $menu);
    }
}

function setCheckboxDropdownValue($select, values) {
    var dropdownId = $select.attr('id') + '_cdDropdown';
    var $wrap = $('#' + dropdownId);
    var $menu = $('.ol-cd-menu[data-for="' + dropdownId + '"]');
    if (!$wrap.length || !$menu.length) {
        $select.val(values).trigger('change');
        return;
    }

    var valueSet = (values || []).map(String);
    $menu.find('.ol-cd-checkbox').each(function () {
        $(this).prop('checked', valueSet.indexOf(String($(this).val())) >= 0);
    });
    syncCheckboxDropdownToSelect($select, $wrap, $menu);
}

function getCheckboxDropdownFieldLabel($select) {
    var selectId = $select.attr('id');
    if (!selectId) return '';

    var $labelSpan = $('label[for="' + selectId + '"] span').first();
    if ($labelSpan.length) {
        return String($labelSpan.text() || '').trim();
    }

    return String($('label[for="' + selectId + '"]').text() || '').replace(/\*/g, '').trim();
}

function getCheckboxDropdownSearchPlaceholder($select, placeholder) {
    var label = getCheckboxDropdownFieldLabel($select);
    if (label) {
        return 'Search ' + label + '...';
    }

    placeholder = String(placeholder || '').trim();
    if (placeholder && !/^select/i.test(placeholder)) {
        return 'Search ' + placeholder.replace(/\.\.\.$/, '') + '...';
    }

    return 'Search options...';
}

function filterCheckboxDropdownOptions($optionsWrap, $noResults, term) {
    term = String(term || '').trim().toLowerCase();
    var visibleCount = 0;

    $optionsWrap.find('.ol-cd-option').each(function () {
        var $opt = $(this);
        var $cb = $opt.find('.ol-cd-checkbox');
        var isAll = String($cb.val()) === '0';
        var isChecked = $cb.is(':checked') && !isAll;
        var searchText = String($opt.attr('data-search') || $opt.find('.ol-cd-option-text').text() || '').toLowerCase();
        var matches = !term || searchText.indexOf(term) >= 0;
        var show = isAll || matches || isChecked;

        $opt.toggleClass('ol-cd-option-hidden', !show);
        $opt.css('display', show ? 'flex' : 'none');
        if (show && !isAll) {
            visibleCount++;
        }
    });

    if ($noResults && $noResults.length) {
        $noResults.toggleClass('is-hidden', !term || visibleCount > 0);
    }
}

function getVisibleCheckboxDropdownOptions($optionsWrap) {
    return $optionsWrap.find('.ol-cd-option:not(.ol-cd-option-hidden)');
}

function updateCheckboxDropdownSelectionHint($wrap, $menu) {
    var $hint = $menu.find('.ol-cd-selection-hint');
    if (!$hint.length) return;

    var selectedCount = $menu.find('.ol-cd-checkbox:checked').filter(function () {
        return String($(this).val()) !== '0';
    }).length;

    if (selectedCount > 0) {
        $hint.text(selectedCount + ' selected').removeClass('is-hidden');
    } else {
        $hint.addClass('is-hidden').text('');
    }
}

function buildCheckboxDropdown($select, placeholder) {
    var selectId = $select.attr('id');
    var dropdownId = selectId + '_cdDropdown';

    $('#' + dropdownId).remove();
    $('.ol-cd-menu[data-for="' + dropdownId + '"]').remove();
    $(document).off('click.' + dropdownId);
    $(window).off('scroll.' + dropdownId + ' resize.' + dropdownId);

    var $wrap = $('<div class="ol-cd-wrap" id="' + dropdownId + '"></div>').data('placeholder', placeholder || 'All');
    var $header = $(
        '<div class="ol-cd-header">' +
            '<span class="ol-cd-header-text">' + escapeHtml(placeholder || 'All') + '</span>' +
            '<span class="ol-cd-arrow">&#9660;</span>' +
        '</div>'
    );
    var $menu = $('<div class="ol-cd-menu" data-for="' + dropdownId + '" style="display:none;"></div>');
    var searchPlaceholder = getCheckboxDropdownSearchPlaceholder($select, placeholder);
    var $searchWrap = $(
        '<div class="ol-cd-search-wrap">' +
            '<input type="text" class="ol-cd-search-input" placeholder="' + escapeHtml(searchPlaceholder) + '" autocomplete="off" />' +
        '</div>'
    );
    var $optionsWrap = $('<div class="ol-cd-options"></div>');
    var $noResults = $('<div class="ol-cd-no-results is-hidden">No matching options</div>');

    $select.find('option').each(function () {
        var $opt = $(this);
        var val = $opt.val();
        var text = $opt.text();
        var searchText = String(text || '').trim().toLowerCase();
        $optionsWrap.append(
            '<label class="ol-cd-option" data-search="' + escapeHtml(searchText) + '">' +
                '<input type="checkbox" class="ol-cd-checkbox" value="' + escapeHtml(val) + '" data-text="' + escapeHtml(text) + '" ' + (val === '0' ? 'checked' : '') + ' />' +
                '<span class="ol-cd-option-text">' + escapeHtml(text) + '</span>' +
            '</label>'
        );
    });

    if ($select.find('option').length > 30) {
        $optionsWrap.addClass('ol-cd-options-large');
    }

    var $footer = $(
        '<div class="ol-cd-footer">' +
            '<span class="ol-cd-selection-hint is-hidden"></span>' +
            '<button type="button" class="ol-cd-btn-select-visible">Select visible</button>' +
            '<button type="button" class="ol-cd-btn-clear-visible">Clear visible</button>' +
            '<button type="button" class="ol-cd-btn-ok">OK</button>' +
        '</div>'
    );

    $menu.append($searchWrap).append($optionsWrap).append($noResults).append($footer);
    $wrap.append($header);

    $select.hide().after($wrap);
    ensureCheckboxDropdownMenuContainer($menu);
    $select.val(['0']).trigger('change');

    var $searchInput = $searchWrap.find('.ol-cd-search-input');

    function closeMenu() {
        $menu.hide();
        $wrap.removeClass('ol-cd-open');
        $(window).off('scroll.' + dropdownId + ' resize.' + dropdownId);
        if (G_OL_OpenCheckboxDropdownId === dropdownId) {
            resumeFilterModalFocusTrap();
        }
    }

    function openMenu() {
        closeOtherCheckboxDropdowns(dropdownId);
        ensureCheckboxDropdownMenuContainer($menu);
        suspendFilterModalFocusTrap();
        G_OL_OpenCheckboxDropdownId = dropdownId;
        positionCheckboxDropdownMenu($wrap, $menu);
        $menu.css('z-index', isFilterModalOpen() ? 10060 : 2000);
        $menu.show();
        $wrap.addClass('ol-cd-open');
        $searchInput.val('');
        filterCheckboxDropdownOptions($optionsWrap, $noResults, '');
        updateCheckboxDropdownSelectionHint($wrap, $menu);
        window.setTimeout(function () {
            $searchInput.trigger('focus');
        }, 0);
        $(window).on('scroll.' + dropdownId + ' resize.' + dropdownId, function () {
            positionCheckboxDropdownMenu($wrap, $menu);
        });
    }

    function runCheckboxDropdownSearch() {
        filterCheckboxDropdownOptions($optionsWrap, $noResults, $searchInput.val());
    }

    $wrap.on('click', '.ol-cd-header', function (e) {
        e.stopPropagation();
        if ($menu.is(':visible')) closeMenu(); else openMenu();
    });

    $searchInput.on('input.' + dropdownId + ' keyup.' + dropdownId + ' compositionend.' + dropdownId, function (e) {
        e.stopPropagation();
        runCheckboxDropdownSearch();
    });

    $searchInput.on('keydown.' + dropdownId, function (e) {
        e.stopPropagation();
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });

    $menu.on('mousedown.' + dropdownId, function (e) {
        e.stopPropagation();
    });

    $menu.on('click', '.ol-cd-btn-select-visible', function (e) {
        e.preventDefault();
        e.stopPropagation();
        getVisibleCheckboxDropdownOptions($optionsWrap).find('.ol-cd-checkbox').each(function () {
            if (String($(this).val()) !== '0') {
                $(this).prop('checked', true);
            }
        });
        $optionsWrap.find('.ol-cd-checkbox[value="0"]').prop('checked', false);
        syncCheckboxDropdownToSelect($select, $wrap, $menu);
        runCheckboxDropdownSearch();
        applyFilterActiveColors();
        updateFilterButtonState();
    });

    $menu.on('click', '.ol-cd-btn-clear-visible', function (e) {
        e.preventDefault();
        e.stopPropagation();
        getVisibleCheckboxDropdownOptions($optionsWrap).find('.ol-cd-checkbox').each(function () {
            if (String($(this).val()) !== '0') {
                $(this).prop('checked', false);
            }
        });
        if (!$optionsWrap.find('.ol-cd-checkbox:checked').length) {
            $optionsWrap.find('.ol-cd-checkbox[value="0"]').prop('checked', true);
        }
        syncCheckboxDropdownToSelect($select, $wrap, $menu);
        runCheckboxDropdownSearch();
        applyFilterActiveColors();
        updateFilterButtonState();
    });

    $menu.on('change', '.ol-cd-checkbox', function () {
        var $cb = $(this);
        var isAllBox = String($cb.val()) === '0';

        if (isAllBox && $cb.is(':checked')) {
            $optionsWrap.find('.ol-cd-checkbox').not($cb).prop('checked', false);
        } else if (!isAllBox && $cb.is(':checked')) {
            $optionsWrap.find('.ol-cd-checkbox[value="0"]').prop('checked', false);
        }

        if (!$optionsWrap.find('.ol-cd-checkbox:checked').length) {
            $optionsWrap.find('.ol-cd-checkbox[value="0"]').prop('checked', true);
        }

        syncCheckboxDropdownToSelect($select, $wrap, $menu);
        runCheckboxDropdownSearch();
        applyFilterActiveColors();
        updateFilterButtonState();
    });

    $menu.on('click', '.ol-cd-btn-ok', function (e) {
        e.preventDefault();
        e.stopPropagation();
        syncCheckboxDropdownToSelect($select, $wrap, $menu);
        applyFilterActiveColors();
        updateFilterButtonState();
        closeMenu();
    });

    $(document).on('click.' + dropdownId, function (e) {
        var $target = $(e.target);
        if (!$target.closest('#' + dropdownId).length && !$target.closest('.ol-cd-menu[data-for="' + dropdownId + '"]').length) {
            closeMenu();
        }
    });
}

function bindDropdown($select, rows, textKeys, placeholder) {
    var list = unwrapComboDataList(rows);
    $select.empty().append($('<option/>', { value: '0', text: 'All' }));

    list.forEach(function (row) {
        var code = prop(row, ['Code', 'code', 'ItemName', 'itemName', 'PartyName', 'partyName', 'Category', 'category']);
        var text = prop(row, textKeys) || String(code || '');
        if (!code && text) code = text;
        if (!code && !text) return;
        if (isAllComboOption(code, text)) return;
        $select.append($('<option/>', { value: code, text: text }));
    });

    buildCheckboxDropdown($select, placeholder);
}

function procedureUsesParam(tpl, paramName) {
    return (tpl.procedureParameters || '').toUpperCase().indexOf(paramName.toUpperCase()) >= 0;
}

function getDropdownCodes(selector) {
    var val = $(selector).val();
    if (!val) return [];
    if (!Array.isArray(val)) val = [val];
    if (val.includes('0')) return [];
    return val
        .map(function (v) { return parseInt(v, 10); })
        .filter(function (n) { return n > 0; });
}

function getAllDropdownCodes(selector) {
    var codes = [];
    $(selector).find('option').each(function () {
        var code = parseInt($(this).val(), 10);
        if (code > 0) {
            codes.push(code);
        }
    });
    return codes;
}

function isDropdownAllSelected(selector) {
    var val = $(selector).val();
    if (!val) return true;
    if (!Array.isArray(val)) val = [val];
    return val.length === 0 || val.indexOf('0') >= 0;
}

function getItemNameCodesForSizeFilter() {
    var selected = getDropdownCodes('#ddlItemName');
    if (selected.length) {
        return selected;
    }
    if (isDropdownAllSelected('#ddlItemName')) {
        return getAllDropdownCodes('#ddlItemName');
    }
    return [];
}

function getDropdownCode(selector) {
    var codes = getDropdownCodes(selector);
    return codes.length === 1 ? codes[0] : 0;
}

function getFilterCodes(tpl) {
    return {
        godownMasterCode: isFlagY(tpl.showWareHouse) ? getDropdownCode('#ddlWareHouse') : 0,
        itemGroupMasterCode: isFlagY(tpl.showItemGroup) ? getDropdownCode('#ddlItemGroup') : 0,
        processMasterCode: isFlagY(tpl.showProcess) ? getDropdownCode('#ddlProcess') : 0,
        itemTypeMasterCode: isFlagY(tpl.showItemType) ? getDropdownCode('#ddlItemType') : 0,
        itemMasterCode: isFlagY(tpl.showItemName) ? getDropdownCode('#ddlItemName') : 0,
        buyerPOMasterCode: isFlagY(tpl.showOrderNo) ? getDropdownCode('#ddlOrderNo') : 0
    };
}

function appendCodeFilter(parts, columnName, codes) {
    if (codes == null) return;
    if (!Array.isArray(codes)) codes = [codes];
    codes = codes.filter(function (n) { return n > 0; });
    if (!codes.length) return;

    var field = toSqlFieldName(columnName);
    if (codes.length === 1) {
        parts.push(' AND (' + field + '=' + codes[0] + ' OR 0=' + codes[0] + ')');
    } else {
        parts.push(' AND (' + field + ' IN (' + codes.join(',') + '))');
    }
}

function getDropdownSelectedTexts(selector) {
    var $select = $(selector);
    var val = $select.val();
    if (!val) return [];
    if (!Array.isArray(val)) val = [val];
    if (val.indexOf('0') >= 0) return [];

    return val
        .map(function (v) {
            return ($select.find('option').filter(function () {
                return String($(this).val()) === String(v);
            }).first().text() || '').trim();
        })
        .filter(function (t) { return !!t && t.toLowerCase() !== 'all'; });
}

function appendTextFilter(parts, columnName, texts) {
    if (!texts || !texts.length) return;

    var escaped = texts.map(function (t) {
        return "'" + String(t).replace(/'/g, "''") + "'";
    });

    var field = String(columnName || '').trim();

    // Stock QueryCondition has ItemMaster, not ItemTypeMaster.
    // Type text in this ERP = ItemMasterOtherDetail.ItemNature
    if (/^\[?ItemTypeMaster\]?\s*\.\s*\[?ItemType\]?$/i.test(field)) {
        parts.push(
            ' AND (ItemMaster.Code IN (SELECT ItemMaster_Code FROM ItemMasterOtherDetail WHERE ItemNature IN ('
            + escaped.join(',') + ')))'
        );
        return;
    }

    parts.push(' AND (' + toSqlFieldName(field) + ' IN (' + escaped.join(',') + '))');
}

function templateKey(tpl) {
    return ((tpl.procedureName || '') + ' ' + (tpl.desp || '')).toUpperCase();
}

function inferUsesQueryCondition(tpl) {
    return /STOCK|PACKINGLIST|PENDING\s*PACKING|PENDINGPACKING|RPTPENDING|RPTPACKING|BAL\s*STOCK|INVOICE\s*RATE/i.test(templateKey(tpl));
}

function inferUsesFilterCondition(tpl) {
    return /TMPT_ORDER|ONTIMEDELIVERY|ORDER\s*DETAIL|ORDERDETAIL|PENDING\s*ORDER|PENDINGORDER|ON-TIME DELIVERY/i.test(templateKey(tpl));
}

function buildMasterFilterParts(tpl) {
    var parts = [];
    var isStockTransfer = /STOCK\s*TRANSFER|STOCKTRANSFER/i.test(templateKey(tpl));

    if (isFlagY(tpl.showWareHouse)) {
        var whCodes = getDropdownCodes('#ddlWareHouse');
        if (whCodes.length === 1) {
            if (isStockTransfer) {
                parts.push(' AND ((FromGodownMaster_Code=' + whCodes[0] + ' OR ToGodownMaster_Code=' + whCodes[0] + ') OR 0=' + whCodes[0] + ')');
            } else {
                appendCodeFilter(parts, 'GodownMaster_Code', whCodes);
            }
        } else if (whCodes.length > 1) {
            var whInList = whCodes.join(',');
            if (isStockTransfer) {
                parts.push(' AND ((FromGodownMaster_Code IN (' + whInList + ') OR ToGodownMaster_Code IN (' + whInList + ')))');
            } else {
                parts.push(' AND (GodownMaster_Code IN (' + whInList + '))');
            }
        }
    }
    if (isFlagY(tpl.showItemGroup)) {
        appendCodeFilter(parts, 'ItemGroupMaster_Code', getDropdownCodes('#ddlItemGroup'));
    }
    if (isFlagY(tpl.showProcess)) {
        appendCodeFilter(parts, 'ProcessMaster_Code', getDropdownCodes('#ddlProcess'));
    }
    if (isFlagY(tpl.showMarketingMan) || isFlagY(tpl.showAsPerMarketingPerson)) {
        appendCodeFilter(parts, 'MarketingManMaster_Code', getDropdownCodes('#ddlMarketingMan'));
    }
    if (isFlagY(tpl.showOrderNo)) {
        appendCodeFilter(parts, 'BuyerPOMaster_Code', getDropdownCodes('#ddlOrderNo'));
    }
    if (isFlagY(tpl.showItemType)) {
        appendCodeFilter(parts, 'ItemTypeMaster_Code', getDropdownCodes('#ddlItemType'));
    }
    if (isFlagY(tpl.showItemName)) {
        appendCodeFilter(parts, 'ItemMaster_Code', getDropdownCodes('#ddlItemName'));
    }

    return parts;
}

function buildOtherFilterParts(tpl) {
    var parts = [];

    [1, 2, 3].forEach(function (index) {
        if (!hasOtherFilterValue(tpl['otherFilter' + index])) return;

        var meta = G_OL_OTHER_FILTER_META[index] || {};
        var parsed = parseOtherFilterDefinition(tpl['otherFilter' + index]) || {};
        var fieldName = String(meta.fieldName || parsed.filterField || '').trim();
        if (!fieldName) return;

        // Flag Y = Code (int); Flag N = name/text (varchar) — FieldName comes from template OtherFilter
        var flag = String(meta.flag || parsed.flag || 'N').trim().toUpperCase();
        if (flag === 'Y') {
            appendCodeFilter(parts, fieldName, getDropdownCodes('#ddlOtherFilter' + index));
        } else {
            appendTextFilter(parts, fieldName, getDropdownSelectedTexts('#ddlOtherFilter' + index));
        }
    });

    return parts;
}

function getTemplateDateField(tpl) {
    var dfRow = getDynamicDateFieldComboRow();
    if (dfRow) {
        var selected = selectedRawForDynamicRow(dfRow);
        if (selected) {
            var picked = normalizeFieldName(String(selected).split(',')[0]);
            if (picked) return picked;
        }
    }

    var name = normalizeFieldName(tpl && tpl.fieldForDate);
    if (!name) return '';
    if (/^order\s*date$/i.test(name)) return 'OrderDate';
    return name;
}

function isViewBasedTemplate(tpl) {
    return !String(tpl && tpl.procedureName || '').trim();
}

function normalizeReportCondition(value) {
    var text = String(value || '').trim();
    if (!text || text.indexOf('%') < 0) return text;
    try {
        return decodeURIComponent(text.replace(/\+/g, ' '));
    } catch (e) {
        return text;
    }
}

function resolveDynamicRowProcedureParameter(row) {
    if (!row) return '';
    var param = String(row.procedureParameter || prop(row, ['ProcedureParameter', 'procedureParameter']) || '')
        .trim()
        .toUpperCase();
    if (param === 'FROMDATE' || param === 'TODATE') return param;

    if (String(row.controlType || prop(row, ['ControlType', 'controlType']) || '').trim().toUpperCase() !== 'TEXT') {
        return param;
    }

    var dn = String(row.displayName || prop(row, ['DisplayName', 'displayName']) || '').trim().toLowerCase();
    if (dn === 'from' || dn === 'from date') return 'FROMDATE';
    if (dn === 'to' || dn === 'to date' || dn === 'as on' || dn === 'as on date') return 'TODATE';
    return param;
}

function isTextHeaderDateRow(row) {
    if (!row || row.isActive === 'N') return false;
    if (String(row.controlType || '').trim().toUpperCase() !== 'TEXT') return false;
    var param = resolveDynamicRowProcedureParameter(row);
    return param === 'FROMDATE' || param === 'TODATE';
}

function mapDynamicFilterRow(row) {
    var mapped = {
        code: parseInt(prop(row, ['Code', 'code']), 10) || 0,
        templateCode: parseInt(prop(row, ['F_TempleteMaster_Code', 'f_TempleteMaster_Code']), 10) || 0,
        controlType: String(prop(row, ['ControlType', 'controlType']) || '').trim(),
        displayName: String(prop(row, ['DisplayName', 'displayName']) || '').trim(),
        comboQuery: String(prop(row, ['ComboQuery', 'comboQuery']) || '').trim(),
        comboDependsOn: String(prop(row, ['ComboDependsOn', 'comboDependsOn']) || '').trim(),
        defaultValue: String(prop(row, ['DefaultValue', 'defaultValue']) || '').trim(),
        resolvedDefaultValue: String(prop(row, ['ResolvedDefaultValue', 'resolvedDefaultValue']) || '').trim(),
        queryCondition: String(prop(row, ['QueryCondition', 'queryCondition']) || '').trim(),
        withCode: String(prop(row, ['WithCode', 'withCode']) || 'N').trim().toUpperCase(),
        multi: String(prop(row, ['MultiSelectionApplicable', 'multiSelectionApplicable']) || 'Y').trim().toUpperCase(),
        procedureParameter: String(prop(row, ['ProcedureParameter', 'procedureParameter']) || '').trim().toUpperCase(),
        comboSortBy: String(prop(row, ['ComboSortBy', 'comboSortBy']) || '').trim(),
        sortOrder: parseInt(prop(row, ['SortOrder', 'sortOrder', 'DisplayOrder', 'displayOrder']), 10)
            || (parseInt(prop(row, ['Code', 'code']), 10) || 0),
        isActive: String(prop(row, ['IsActive', 'isActive']) || 'Y').trim().toUpperCase()
    };
    mapped.procedureParameter = resolveDynamicRowProcedureParameter(mapped);
    return mapped;
}

function isDynamicDateRow(row) {
    if (!row) return false;
    if (String(row.controlType || '').trim().toUpperCase() === 'COMBO') return false;
    var param = resolveDynamicRowProcedureParameter(row);
    return param === 'FROMDATE' || param === 'TODATE';
}

function dynamicDateRowsHaveQuery() {
    if (configHasTextHeaderDates()) return true;
    return (G_OL_DynamicFilters || []).some(function (row) {
        return isDynamicDateRow(row) && !!row.queryCondition;
    });
}

/** True when F_TemplateFilterConfiguration returned at least one active row for this template. */
function hasActiveTemplateFilterConfiguration() {
    return (G_OL_DynamicFilters || []).some(function (row) {
        return row.code > 0 && row.isActive !== 'N';
    });
}

function dynamicConfigHasDateFilter(kind) {
    var param = String(kind || '').toLowerCase() === 'to' ? 'TODATE' : 'FROMDATE';
    return (G_OL_DynamicFilters || []).some(function (row) {
        return isTextHeaderDateRow(row) && resolveDynamicRowProcedureParameter(row) === param;
    });
}

/** Header From/To: F_TemplateFilterConfiguration ControlType Text only (modal level dates stay inside). */
function shouldShowStaticFromDate(tpl) {
    if (isAsOnDateMode(tpl)) return false;
    if (isLevelDateRangeAvailable()) return dynamicConfigHasDateFilter('from');
    if (hasActiveTemplateFilterConfiguration()) {
        return dynamicConfigHasDateFilter('from');
    }
    return (!tpl || !tpl.code || isFlagY(tpl.showFromDate)) && !!normalizeFieldName(tpl && tpl.fieldForDate);
}

function shouldShowStaticToDate(tpl) {
    if (isAsOnDateMode(tpl)) {
        return dynamicConfigHasDateFilter('to') || (!hasActiveTemplateFilterConfiguration()
            && !!normalizeFieldName(tpl && tpl.fieldForDate));
    }
    if (isLevelDateRangeAvailable()) return dynamicConfigHasDateFilter('to');
    if (hasActiveTemplateFilterConfiguration()) {
        return dynamicConfigHasDateFilter('to');
    }
    return (!tpl || !tpl.code || isFlagY(tpl.showToDate)) && !!normalizeFieldName(tpl && tpl.fieldForDate);
}

function syncFilterFieldsFromTemplateFilterConfiguration(tpl) {
    tpl = tpl || getSelectedTemplate();
    if (!hasActiveTemplateFilterConfiguration()) {
        return false;
    }

    applyStaticDateFieldsFromTemplate(tpl);
    applyFilterActiveColors();
    updateFilterButtonState();
    return true;
}

function resolveDynamicDefaultValue(raw) {
    var value = String(raw || '');
    var now = new Date();
    var tokens = {};
    tokens['{{DefaultDate}}'] = toIsoDate(now);
    tokens['{{MonthStartDate}}'] = toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
    tokens['{{MonthEndDate}}'] = toIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    tokens['{{FinYearStartDate}}'] = G_OL_FinYear.startIso || '';
    tokens['{{FinYearEndDate}}'] = G_OL_FinYear.endIso || '';
    tokens['{{FinYear}}'] = G_OL_FinYear.desp || '';
    Object.keys(tokens).forEach(function (token) {
        if (!tokens[token]) return;
        value = value.split(token).join(tokens[token]);
    });
    value = value.trim();
    if (!value || value.indexOf('{{') >= 0) return value;
    return apiDateToIso(value) || value;
}

function applyResolvedFilterTokenMap(tokenRows) {
    var map = {};
    (tokenRows || []).forEach(function (row) {
        var token = String(prop(row, ['Token', 'token']) || '').trim();
        var val = String(prop(row, ['ResolvedValue', 'resolvedValue']) || '').trim();
        if (token) map[token] = val;
    });

    if (map['{{FinYear}}']) G_OL_FinYear.desp = map['{{FinYear}}'];
    if (map['{{FinYearStartDate}}']) G_OL_FinYear.startIso = apiDateToIso(map['{{FinYearStartDate}}']) || G_OL_FinYear.startIso;
    if (map['{{FinYearEndDate}}']) G_OL_FinYear.endIso = apiDateToIso(map['{{FinYearEndDate}}']) || G_OL_FinYear.endIso;
}

function ensureFinYearTokens() {
    if (G_OL_FinYearLoaded) return Promise.resolve(G_OL_FinYear);

    if (typeof OrderLoadReportService.GetResolvedFilterTokens !== 'function') {
        G_OL_FinYearLoaded = true;
        return Promise.resolve(G_OL_FinYear);
    }

    return OrderLoadReportService.GetResolvedFilterTokens()
        .then(function (res) {
            applyResolvedFilterTokenMap(unwrapApiList(res));
            G_OL_FinYearLoaded = true;
            return G_OL_FinYear;
        })
        .catch(function () {
            G_OL_FinYearLoaded = true;
            return G_OL_FinYear;
        });
}

function fetchTemplateFilterConfigurationRows(templateCode) {
    var code = parseInt(templateCode, 10) || 0;
    function rowsForTemplate(list) {
        return (list || []).filter(function (row) {
            var tplCode = parseInt(prop(row, ['F_TempleteMaster_Code', 'f_TempleteMaster_Code', 'templateCode']), 10) || 0;
            return !code || tplCode === code;
        });
    }
    function loadFilterConfigTableDdl() {
        return OrderLoadReportService.GetDdlOfOtherFilter('F_TemplateFilterConfiguration')
            .then(function (res) { return rowsForTemplate(unwrapApiList(res)); })
            .catch(function () {
                return OrderLoadReportService.GetDdlOfOtherFilter('F_TempleteFilterConfiguration')
                    .then(function (res) { return rowsForTemplate(unwrapApiList(res)); });
            });
    }
    if (typeof OrderLoadReportService.GetTemplateFilterConfiguration === 'function') {
        return OrderLoadReportService.GetTemplateFilterConfiguration(code)
            .then(function (res) {
                var rows = rowsForTemplate(unwrapApiList(res));
                if (rows.length) return rows;
                return loadFilterConfigTableDdl();
            })
            .catch(function () {
                return loadFilterConfigTableDdl();
            });
    }
    return loadFilterConfigTableDdl();
}

function clearDynamicFilterHost() {
    $('#olDynamicFilterHost select').each(function () {
        var dropdownId = $(this).attr('id') + '_cdDropdown';
        $('#' + dropdownId).remove();
        $('.ol-cd-menu[data-for="' + dropdownId + '"]').remove();
        $(document).off('click.' + dropdownId);
    });
    $('#olDynamicFilterHost').empty();
}

function hideStaticComboFilters() {
    [
        'olFieldWareHouse', 'olFieldItemGroup', 'olFieldProcess', 'olFieldMarketingMan',
        'olFieldOrderNo', 'olFieldItemType', 'olFieldItemName',
        'olFieldOtherFilter1', 'olFieldOtherFilter2', 'olFieldOtherFilter3'
    ].forEach(function (id) {
        $('#' + id).addClass('ol-hidden');
    });
}

function applyDynamicDateDefaults(tpl) {
    var fromRow = findTextHeaderDateRow('from');
    var toRow = findTextHeaderDateRow('to');

    if (fromRow) {
        var fromIso = apiDateToIso(fromRow.resolvedDefaultValue)
            || apiDateToIso(resolveDynamicDefaultValue(fromRow.defaultValue));
        if (fromIso) {
            $('#txtFromDate').val(fromIso);
        }
        $('#olFieldFromDate').removeAttr('title');
    } else if (hasActiveTemplateFilterConfiguration()) {
        $('#txtFromDate').val('');
    }

    if (toRow) {
        var toIso = apiDateToIso(toRow.resolvedDefaultValue)
            || apiDateToIso(resolveDynamicDefaultValue(toRow.defaultValue));
        if (toIso) {
            $('#txtToDate').val(toIso);
        }
        $('#olFieldToDate').removeAttr('title');
    } else if (hasActiveTemplateFilterConfiguration()) {
        $('#txtToDate').val('');
    }

    applyConfigTextHeaderDateLabels();
    syncModalDatesFromHeader();
    syncHeaderDateBarVisibility();
}

function comboResultColumn(sql) {
    var text = String(sql || '');
    var match = /^\s*select\s+(?:distinct\s+)?(?:\[[^\]]+\]|\w+)\s*,\s*(?:\[[^\]]+\]|\w+)(?:\s+as\s+(\[[^\]]+\]|\w+))?/i.exec(text);
    if (match && match[1]) return match[1].replace(/[\[\]]/g, '');
    var second = /^\s*select\s+(?:distinct\s+)?(?:\[[^\]]+\]|\w+)\s*,\s*(\[[^\]]+\]|\w+)/i.exec(text);
    if (second) return second[1].replace(/[\[\]]/g, '');
    return 'Desp';
}

function comboQueryHasTwoColumns(sql) {
    return /^\s*select\s+(?:distinct\s+)?(?:\[[^\]]+\]|\w+)\s*,/i.test(String(sql || ''));
}

function normalizeDynamicComboSql(sql) {
    sql = String(sql || '').trim().replace(/;+\s*$/, '');
    if (!sql) return '';

    sql = replaceDynamicFilterTokens(sql);
    /* T-SQL empty string: N'' — use double-quoted JS so quotes are not parsed as string delimiters */
    var notEmptyNvarchar = " <> N''";
    sql = sql.replace(/<>\s*''/gi, notEmptyNvarchar);
    sql = sql.replace(/<>\s*""/gi, notEmptyNvarchar);

    if (!comboQueryHasTwoColumns(sql)) {
        var single = /^\s*select\s+(?:distinct\s+)?(\[[^\]]+\]|\w+)\s+from\b/i.exec(sql);
        if (single) {
            var col = single[1];
            sql = 'SELECT ' + col + ' AS Code, ' + col + ' AS Desp FROM (' + sql + ') _olq';
        }
    }

    return sql;
}

function formatDynamicFilterTokenValue(row, raw) {
    if (!raw) return '';
    if (row.withCode === 'Y') return raw;
    return raw.split(',').map(function (part) {
        return "'" + String(part).trim().replace(/'/g, "''") + "'";
    }).join(',');
}

function replaceDynamicFilterTokens(text) {
    var out = String(text || '');
    if (!out || out.indexOf('{{') < 0) return out;

    var templateCode = parseInt($('#ddlTemplate').val(), 10) || 0;
    if (templateCode > 0) {
        ['{{F_TempleteMaster_Code}}', '{{F_TemplateMaster_Code}}', '{{f_templetemaster_code}}'].forEach(function (token) {
            if (out.indexOf(token) >= 0) {
                out = out.split(token).join(String(templateCode));
            }
        });
    }

    (G_OL_DynamicFilters || []).forEach(function (row) {
        var token = '{{' + row.displayName + '}}';
        if (out.indexOf(token) < 0) return;

        var raw = effectiveRawForDynamicRow(row);
        var replacement = formatDynamicFilterTokenValue(row, raw);
        out = out.split(token).join(replacement);
    });

    return cleanupInvalidDynamicComboSql(out);
}

function splitComboDependsOnSegments(depends) {
    return String(depends || '')
        .split('#')
        .map(function (part) { return String(part || '').trim(); })
        .filter(function (part) { return !!part; });
}

function replaceDependsOnSegment(segment) {
    var out = String(segment || '').trim();
    if (!out) return '';

    var tokenMatch = out.match(/\{\{([^}]+)\}\}/g) || [];
    var i;
    for (i = 0; i < tokenMatch.length; i++) {
        var token = tokenMatch[i];
        var displayName = token.slice(2, -2);
        var parentRow = (G_OL_DynamicFilters || []).find(function (r) {
            return String(r.displayName || '').trim() === String(displayName).trim();
        });
        if (!parentRow) return '';

        var raw = effectiveRawForDynamicRow(parentRow);
        if (!raw) return '';

        out = out.split(token).join(formatDynamicFilterTokenValue(parentRow, raw));
    }

    if (out.indexOf('{{') >= 0) return '';
    return cleanupInvalidDynamicComboSql(out);
}

function cleanupInvalidDynamicComboSql(sql) {
    var out = String(sql || '');
    if (!out) return out;

    out = out.replace(/\s+and\s+([^\s]+(?:\.[^\s]+)?)\s+in\s*\(\s*\)/gi, '');
    out = out.replace(/\s+and\s+\(\s*[^)]+\)\s+in\s*\(\s*\)/gi, '');
    out = out.replace(/\s+where\s+([^\s]+(?:\.[^\s]+)?)\s+in\s*\(\s*\)/gi, ' WHERE 1=1');
    out = out.replace(/\s{2,}/g, ' ').trim();
    return out;
}

function appendDynamicComboCondition(baseSql, conditionPart) {
    var sql = String(baseSql || '').trim();
    var cond = String(conditionPart || '').trim();
    if (!cond) return sql;

    if (/^\s*order\s+by\b/i.test(cond)) {
        return sql + ' ' + cond;
    }

    if (/^\s*where\b/i.test(cond)) {
        if (/\bwhere\b/i.test(sql)) {
            return sql + ' ' + cond.replace(/^\s*where\b/i, 'AND');
        }
        return sql + ' ' + cond;
    }

    if (/^\s*and\b/i.test(cond) || /^\s*or\b/i.test(cond)) {
        return sql + ' ' + cond;
    }

    if (/\bwhere\b/i.test(sql)) {
        return sql + ' AND ' + cond;
    }

    return sql + ' WHERE ' + cond;
}

function buildDynamicComboSql(row) {
    var sql = String(row.comboQuery || '').trim().replace(/;+\s*$/, '');
    sql = replaceDynamicFilterTokens(sql);

    splitComboDependsOnSegments(row.comboDependsOn).forEach(function (segment) {
        var resolved = replaceDependsOnSegment(segment);
        if (!resolved) return;
        sql = appendDynamicComboCondition(sql, resolved);
    });

    return normalizeDynamicComboSql(sql);
}

function getDynamicFilterRowsDependingOn(displayName) {
    var name = String(displayName || '').trim();
    if (!name) return [];
    var token = '{{' + name + '}}';
    return (G_OL_DynamicFilters || []).filter(function (row) {
        return String(row.comboDependsOn || '').indexOf(token) >= 0
            || String(row.comboQuery || '').indexOf(token) >= 0;
    });
}

function bindDynamicComboCascade() {
    $('#olDynamicFilterHost').off('change.olDynCascade', 'select');
    $('#olDynamicFilterHost').on('change.olDynCascade', 'select', function () {
        var id = $(this).attr('id') || '';
        var code = parseInt(String(id).replace('ddlDynFilter_', ''), 10) || 0;
        var parent = (G_OL_DynamicFilters || []).find(function (r) { return r.code === code; });
        if (!parent) return;

        if (isDynamicDateFieldCombo(parent)) {
            applySelectedConfigDateFieldCombo();
        }

        /* buildCheckboxDropdown() fires 'change' on every (re)bind; while the initial load runs, the loader itself
           orders parents before children, so do not reset/reload children for those programmatic events. */
        if (!G_OL_ComboBulkLoading) {
            getDynamicFilterRowsDependingOn(parent.displayName).forEach(function (child) {
                if (child.code === parent.code) return;
                var $child = $('#ddlDynFilter_' + child.code);
                if (!$child.length) return;
                if (child.multi === 'Y') setCheckboxDropdownValue($child, ['0']);
                else $child.val('0');
                loadDynamicComboOptionsAsync(child);
            });
        }

        if (String(parent.displayName || '').trim().toLowerCase() === 'item name') {
            refreshOrderLoadSizeFilterItemCodes(getSelectedTemplate());
            updateSizeParameterGridButton();
        }

        applyFilterActiveColors();
        updateFilterButtonState();
    });
}

function escapeXmlAttr(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function buildDynamicFilterSelectionJson() {
    var filters = [];
    (G_OL_DynamicFilters || []).forEach(function (row) {
        if (String(row.controlType || '').toUpperCase() !== 'COMBO') return;
        if (isDynamicDateFieldCombo(row)) return;
        var raw = selectedRawForDynamicRow(row);
        if (!raw) return;
        var item = {
            configCode: row.code || 0,
            displayName: String(row.displayName || '').trim(),
            selectedValue: raw
        };
        // WithCode='Y' combos send numeric codes in selectedValue. A dependent ComboDependsOn condition on a TEXT column
        // (e.g. AccountNature in ({{Client Nature}})) cannot use the code, so also send the option text; the server falls
        // back to it when the code form raises "Conversion failed ... to data type int".
        if (row.withCode === 'Y') {
            var text = selectedTextForDynamicRow(row);
            if (text) item.selectedText = text;
        }
        filters.push(item);
    });
    if (!filters.length) return '';
    return JSON.stringify(filters);
}

/** F_TemplateFilterConfiguration metadata — not SQL combo result rows (no DisplayName+ControlType on data). */
function isTemplateFilterConfigurationRecord(item) {
    if (!item || typeof item !== 'object') return false;
    var displayName = String(prop(item, ['DisplayName', 'displayName']) || '').trim();
    var controlType = String(prop(item, ['ControlType', 'controlType']) || '').trim().toUpperCase();
    if (displayName && controlType) return true;
    var comboQuery = String(prop(item, ['ComboQuery', 'comboQuery']) || '').trim();
    var tplCode = prop(item, ['F_TempleteMaster_Code', 'f_TempleteMaster_Code', 'F_TemplateMaster_Code']);
    if (comboQuery && tplCode !== '' && tplCode != null) return true;
    return false;
}

function normalizeComboDataRow(item) {
    if (!item || typeof item !== 'object') return item;
    if (prop(item, ['Code', 'code']) != null && prop(item, ['Desp', 'desp', 'ItemName', 'itemName', 'Name', 'name']) != null) {
        return item;
    }
    var code = prop(item, ['Code', 'code', 'ItemName', 'itemName', 'Category', 'category',
        'AccountDesp', 'accountDesp', 'PartyName', 'partyName', 'CustomerName', 'customerName',
        'PersonName', 'personName', 'Nature', 'nature', 'ClientNature', 'clientNature', 'Value', 'value']);
    if (code != null && code !== '') {
        var desp = prop(item, ['Desp', 'desp', 'Value', 'value', 'Category', 'category', 'ItemName', 'itemName',
            'Name', 'name', 'AccountDesp', 'accountDesp', 'PartyName', 'partyName', 'CustomerName', 'customerName',
            'PersonName', 'personName']) || code;
        return { Code: code, Desp: desp };
    }
    var keys = Object.keys(item);
    if (keys.length === 1) {
        var only = item[keys[0]];
        if (only != null && only !== '') return { Code: only, Desp: only };
    }
    return item;
}

/** Rows to bind in ddlDynFilter_* — excludes config metadata mistaken for combo data. */
function unwrapComboDataList(payload) {
    var list = unwrapApiList(payload);
    if (!list.length) return [];
    return list.filter(function (item) { return !isTemplateFilterConfigurationRecord(item); })
        .map(normalizeComboDataRow);
}

/** True when API returned only config metadata — not when JSON also has Code/Desp (or PartyName) rows. */
function looksLikeFilterConfigPayload(res) {
    var list = unwrapApiList(res);
    if (!list.length) return false;
    var bindable = list.filter(function (item) { return !isTemplateFilterConfigurationRecord(item); });
    if (bindable.length > 0) return false;
    return list.some(isTemplateFilterConfigurationRecord);
}

/**
 * Single place that supplies option rows for a Combo filter row.
 * GetTemplateFilterConfiguration returns setup only (ComboQuery text, not data), so the dropdown rows come from
 * the API GetTemplateFilterComboData: the server reads this row's ComboQuery / ComboDependsOn / ComboSortBy
 * (by configCode), applies the parent combo selections sent in FilterSelectionJson, runs the SQL and returns
 * [{ Code: 1, Desp: 'Name' }, ...]. SQL is never sent from the browser.
 */
function fetchTemplateFilterComboData(templateCode, configCode, row) {
    return OrderLoadReportService.GetTemplateFilterComboData(
        templateCode,
        configCode,
        buildDynamicFilterSelectionJson()
    );
}

/** Display text of the selected option(s), comma-joined — same selection rules as selectedRawForDynamicRow. */
function selectedTextForDynamicRow(row) {
    var $sel = $('#ddlDynFilter_' + row.code);
    if (!$sel.length) return '';
    var val = $sel.val();
    if (!val) return '';
    if (!Array.isArray(val)) val = [val];
    val = val.filter(function (v) { return String(v) !== '0' && String(v) !== ''; });
    if (!val.length) return '';
    if (row.multi !== 'Y') val = [val[0]];
    return val.map(function (v) {
        return ($sel.find('option').filter(function () {
            return String($(this).val()) === String(v);
        }).first().text() || '').trim();
    }).filter(function (text) { return !!text && text.toLowerCase() !== 'all'; }).join(',');
}

function selectedRawForDynamicRow(row) {
    var $sel = $('#ddlDynFilter_' + row.code);
    if (!$sel.length) return '';
    var val = $sel.val();
    if (!val) return '';
    if (!Array.isArray(val)) val = [val];
    val = val.filter(function (v) { return String(v) !== '0' && String(v) !== ''; });
    if (!val.length) return '';
    if (row.multi !== 'Y') val = [val[0]];
    if (row.withCode === 'Y') return val.join(',');
    return val.map(function (v) {
        return ($sel.find('option').filter(function () {
            return String($(this).val()) === String(v);
        }).first().text() || '').trim();
    }).filter(function (text) { return !!text && text.toLowerCase() !== 'all'; }).join(',');
}

/** UI selection, else ResolvedDefaultValue (for ComboDependsOn before user picks parent). */
function effectiveRawForDynamicRow(row) {
    var raw = selectedRawForDynamicRow(row);
    if (raw) return raw;
    if (!row) return '';
    var def = String(row.resolvedDefaultValue || '').trim();
    if (def && def.indexOf('{{') < 0 && def.toLowerCase() !== 'all' && def !== '0') return def;
    def = String(row.defaultValue || '').trim();
    if (def && def.indexOf('{{') < 0 && def.toLowerCase() !== 'all' && def !== '0') {
        return String(resolveDynamicDefaultValue(def) || def).trim();
    }
    return '';
}

function dynamicSelectHasValue($sel) {
    var val = $sel.val();
    if (!val) return false;
    if (!Array.isArray(val)) val = [val];
    return val.some(function (v) { return String(v) !== '0' && String(v) !== ''; });
}

function fragmentFromFilterTemplate(row, rawValue, tpl) {
    var template = bracketSpacedDateColumnsInSql(
        rewriteDisplayDateColumnsInSql(String(row.queryCondition || ''), tpl)
    );
    var raw = String(rawValue || '').trim();
    if (!template || !raw || raw === '0') return '';
    var literal = /'\{\{SelectedValue\}\}'/.test(template);
    var sqlValue = raw;
    if (row.withCode === 'Y') {
        if (/[^0-9,]/.test(raw)) return '';
    } else if (!literal) {
        sqlValue = raw.split(',').map(function (part) {
            return "'" + String(part).trim().replace(/'/g, "''") + "'";
        }).join(',');
    } else {
        sqlValue = raw.replace(/'/g, "''");
    }
    var frag = template.split('{{SelectedValue}}').join(sqlValue);
    if (!/^\s*AND\b/i.test(frag)) frag = ' AND ' + frag.replace(/^\s+/, '');
    if (/CAST\s*\(\s*'[^']*'\s*AS\s*DATE\s*\)/i.test(frag)) {
        frag = applyTryCastToDateCompareFragment(frag);
    }
    return frag;
}

function isDateCompareConditionFragment(part) {
    var p = String(part || '');
    if (!p) return false;
    return (/\bTRY_CAST\s*\(/i.test(p) || /\bCAST\s*\(\s*'[^']*'\s*AS\s*DATE\s*\)/i.test(p))
        && /\s(>=|<=|=)\s/i.test(p);
}

function extractDateCompareSqlFromCondition(sql) {
    var rest = String(sql || '').trim();
    if (!rest) return '';
    if (/^and\b/i.test(rest)) rest = rest.replace(/^and\s+/i, '').trim();
    if (!rest) return '';
    var out = [];
    rest.split(/\s+and\s+/i).forEach(function (chunk) {
        chunk = String(chunk || '').trim();
        if (!chunk) return;
        var frag = ' AND ' + chunk;
        if (isDateCompareConditionFragment(frag)) out.push(frag);
    });
    return out.join('');
}

/**
 * View (ViewName, no ProcedureName): user filters → QueryCondition only (SP view WHERE).
 * Procedure: FilterCondition and/or QueryCondition per ProcedureParameters (#FilterCondition# / #QueryCondition#).
 */
function routeConditionsForReportSource(conditions, tpl) {
    tpl = tpl || getSelectedTemplate();
    if (!conditions) return { filterCondition: '', queryCondition: '' };

    var fc = String(conditions.filterCondition || '');
    var qc = String(conditions.queryCondition || '');

    if (isViewBasedTemplate(tpl)) {
        return { filterCondition: '', queryCondition: fc + qc };
    }

    var hasFilterParam = procedureUsesParam(tpl, 'FilterCondition') || inferUsesFilterCondition(tpl);
    var hasQueryParam = procedureUsesParam(tpl, 'QueryCondition') || inferUsesQueryCondition(tpl);

    if (hasFilterParam && !hasQueryParam) {
        return { filterCondition: fc + qc, queryCondition: '' };
    }
    if (hasQueryParam && !hasFilterParam) {
        return { filterCondition: '', queryCondition: fc + qc };
    }
    if (!hasFilterParam && !hasQueryParam) {
        return { filterCondition: fc + qc, queryCondition: '' };
    }
    return { filterCondition: fc, queryCondition: qc };
}

function buildConditionsFromFilterConfiguration(tpl, usesDateParams, fromIso, toIso) {
    var filterParts = [];
    var queryParts = [];

    (G_OL_DynamicFilters || []).forEach(function (row) {
        if (isDynamicDateRow(row)) {
            if (row.queryCondition) {
                if (row.procedureParameter === 'FROMDATE' && !fromIso) return;
                if (row.procedureParameter === 'TODATE' && !toIso) return;
                var dateRawTpl = row.procedureParameter === 'TODATE' ? isoToSqlCastLiteral(toIso) : isoToSqlCastLiteral(fromIso);
                if (!dateRawTpl) return;
                var dateFragTpl = fragmentFromFilterTemplate(row, dateRawTpl, tpl);
                if (!dateFragTpl) return;
                if (isViewBasedTemplate(tpl) || row.procedureParameter === 'QUERYCONDITION') {
                    queryParts.push(dateFragTpl);
                } else {
                    filterParts.push(dateFragTpl);
                }
            }
            return;
        }

        if (String(row.controlType || '').toUpperCase() !== 'COMBO') return;
        if (isDynamicDateFieldCombo(row)) return;
        var selected = selectedRawForDynamicRow(row);
        var frag = fragmentFromFilterTemplate(row, selected, tpl);
        if (!frag) return;
        if (isViewBasedTemplate(tpl) || row.procedureParameter === 'QUERYCONDITION') {
            queryParts.push(frag);
        } else {
            filterParts.push(frag);
        }
    });

    return routeConditionsForReportSource({
        filterCondition: filterParts.join(''),
        queryCondition: queryParts.join('')
    }, tpl);
}

function resolveDynamicComboDefaultWanted(row) {
    if (!row) return '';
    var wanted = String(row.resolvedDefaultValue || '').trim();
    if (!wanted || wanted.indexOf('{{') >= 0) {
        wanted = String(row.defaultValue || '').trim();
    }
    if (!wanted || wanted.indexOf('{{') >= 0) {
        wanted = String(resolveDynamicDefaultValue(row.defaultValue || '') || '').trim();
    }
    if (!wanted || wanted.toLowerCase() === 'all') return '';
    return wanted;
}

function applyDynamicComboDefault(row) {
    if (isDynamicDateFieldCombo(row)) return;
    var wanted = resolveDynamicComboDefaultWanted(row);
    if (!wanted) return;
    var $sel = $('#ddlDynFilter_' + row.code);
    if (!$sel.length || $sel.find('option').length <= 1) return;
    var match = '';
    $sel.find('option').each(function () {
        var text = String($(this).text() || '').trim();
        var val = String($(this).val() || '');
        if (val === '0') return;
        if (text.toLowerCase() === wanted.toLowerCase() || val === wanted
            || String(val).toLowerCase() === wanted.toLowerCase()) {
            match = val;
        }
    });
    if (!match) return;
    if (row.multi === 'Y') setCheckboxDropdownValue($sel, [match]);
    else $sel.val(match);
}

function applyAllDynamicComboDefaults() {
    sortDynamicComboFiltersForRender((G_OL_DynamicFilters || []).filter(function (row) {
        return String(row.controlType || '').toUpperCase() === 'COMBO' && !isDynamicDateFieldCombo(row);
    })).forEach(function (row) {
        applyDynamicComboDefault(row);
    });
}

/** True when ComboQuery/DependsOn needs other filter selections (not only template code tokens). */
function comboQueryNeedsClientFilterTokens(row) {
    var blob = String(row && row.comboQuery || '') + String(row && row.comboDependsOn || '');
    var tokens = blob.match(/\{\{([^}]+)\}\}/g);
    if (!tokens) return false;
    for (var i = 0; i < tokens.length; i++) {
        var inner = tokens[i].slice(2, -2).trim().toLowerCase();
        if (inner !== 'f_templetemaster_code' && inner !== 'f_templatemaster_code') {
            return true;
        }
    }
    return false;
}

function isAllComboOption(code, text) {
    var c = String(code == null ? '' : code).trim();
    var t = String(text || '').trim();
    if (!c && !t) return true;
    if (c === '0' || /^all$/i.test(c)) return true;
    return /^all$/i.test(t);
}

/** Date Field combo: no "All"; distinct date columns only (modal). Header keeps Text From/To. */
function populateDateFieldComboSelect($sel, res, nameColumn) {
    var textKeys = [nameColumn, 'Desp', 'desp', 'Value', 'value', 'Name', 'name', 'FieldName', 'fieldName', 'FieldForDate', 'fieldForDate'];
    var list = unwrapComboDataList(res);
    var seen = {};
    $sel.empty();
    list.forEach(function (item) {
        var code = prop(item, ['Code', 'code', 'FieldName', 'fieldName', 'FieldForDate', 'fieldForDate']);
        var text = String(prop(item, textKeys) || code || '').trim();
        if (isAllComboOption(code, text)) return;
        var opt = resolveDateFieldOption(code, text);
        if (!opt) return;
        var key = canonicalDateFieldKey(opt.value) || canonicalDateFieldKey(opt.label);
        if (!key || seen[key]) return;
        seen[key] = true;
        $sel.append($('<option/>', { value: opt.value, text: opt.label }));
    });
}

/** ComboQuery like "select Code, Category from ItemMaster" repeats the same label; keep one option per label (or per Code when WithCode=Y). */
function dedupeDynamicComboList(list, textKeys, row) {
    var seen = {};
    var out = [];
    (list || []).forEach(function (item) {
        var code = prop(item, ['Code', 'code']);
        var text = String(prop(item, textKeys) || code || '').trim();
        var key = String(row && row.withCode === 'Y' ? code : text).trim().toLowerCase();
        if (!key || seen[key]) return;
        seen[key] = true;
        out.push(item);
    });
    return out;
}

function populateDynamicComboSelect($sel, res, row, nameColumn) {
    if (isDynamicDateFieldCombo(row)) {
        populateDateFieldComboSelect($sel, res, nameColumn);
        return;
    }
    var textKeys = [nameColumn, 'Desp', 'desp', 'Value', 'value', 'Name', 'name', 'FieldName', 'fieldName',
        'AccountDesp', 'accountDesp', 'PartyName', 'partyName', 'CustomerName', 'customerName', 'PersonName', 'personName',
        'ItemName', 'itemName', 'Category', 'category', 'Nature', 'nature', 'ClientNature', 'clientNature'];
    var useMulti = row.multi === 'Y';
    var list = unwrapComboDataList(res);
    if (useMulti) {
        bindDropdown($sel, list, textKeys, 'Select ' + row.displayName + '...');
        return;
    }
    $sel.empty().append($('<option/>', { value: '0', text: 'All' }));
    list.forEach(function (item) {
        var code = prop(item, ['Code', 'code']);
        var text = prop(item, textKeys) || String(code || '');
        if (isAllComboOption(code, text)) return;
        if (code == null || code === '') code = text;
        if (!code && !text) return;
        $sel.append($('<option/>', { value: code, text: text }));
    });
}

function afterDynamicComboOptionsLoaded(row, $field) {
    if ($field && $field.length) {
        $field.removeAttr('title');
    }
    applyDynamicComboDefault(row);
    if (isDynamicDateFieldCombo(row)) {
        applySelectedConfigDateFieldCombo();
    } else if (!G_OL_ComboBulkLoading) {
        /* During the initial sequential load every combo is loaded in order anyway (parents first), so children
           are not loaded a second time here. After that, a parent reload refreshes its dependent combos. */
        getDynamicFilterRowsDependingOn(row.displayName).forEach(function (child) {
            loadDynamicComboOptionsAsync(child);
        });
    }
    applyFilterActiveColors();
    updateFilterButtonState();
}

function loadConfigDateFieldComboOptions(row) {
    var templateCode = parseInt($('#ddlTemplate').val(), 10) || 0;
    var $field = $('#olDynField_' + row.code);
    var $sel = $('#ddlDynFilter_' + row.code);
    if (!$sel.length) return;

    function fillAndFinish(res) {
        populateDateFieldComboSelect($sel, res, 'Desp');
        if (!$sel.find('option').length) {
            fillFromLevelRows();
            return;
        }
        var target = normalizeFieldName(G_OL_CurrentLevel && G_OL_CurrentLevel.fieldForDate);
        if (!selectDateFieldComboValue($sel, target)) {
            selectDateFieldComboValue($sel, getDefaultDateFieldFromLevelRows(G_OL_LevelRows));
        }
        if (!$sel.val() && $sel.find('option').length) {
            $sel.prop('selectedIndex', 0);
        }
        afterDynamicComboOptionsLoaded(row, $field);
    }

    function fillFromLevelRows() {
        var opts = getDistinctDateFieldOptions(G_OL_LevelRows);
        fillAndFinish(opts.map(function (o) {
            return { code: o.value, desp: o.label };
        }));
    }

    fetchTemplateFilterComboData(templateCode, row.code, row)
        .then(function (res) {
            var list = unwrapComboDataList(res);
            if (!list.length) {
                fillFromLevelRows();
                return;
            }
            var looksLikeCategoryLeak = list.some(function (item) {
                var t = String(prop(item, ['Desp', 'desp', 'Code', 'code']) || '').trim().toLowerCase();
                return t === 'finish' || t === 'raw' || t === 'grey';
            }) && !list.some(function (item) {
                var t = String(prop(item, ['Desp', 'desp', 'Code', 'code']) || '').trim();
                return /date/i.test(t);
            });
            if (looksLikeCategoryLeak) {
                fillFromLevelRows();
                return;
            }
            fillAndFinish(res);
        })
        .catch(function () {
            if (G_OL_LevelRows && G_OL_LevelRows.length) {
                fillFromLevelRows();
                return;
            }
            OrderLoadReportService.GetLevel(templateCode)
                .then(function (res) {
                    G_OL_LevelRows = unwrapApiList(res);
                    fillFromLevelRows();
                })
                .catch(function () {
                    if ($field.length) $field.removeAttr('title');
                    toastr.error('Could not load Date Field options.');
                });
        });
}

function resolveDynamicComboNameColumn(row) {
    var configNameCol = comboResultColumn(row.comboQuery || '') || 'Desp';
    if (/,\s*Value\b/i.test(row.comboQuery || '')) configNameCol = 'Value';
    if (/,\s*Category\b/i.test(row.comboQuery || '')) configNameCol = 'Category';
    if (/,\s*AccountDesp\b/i.test(row.comboQuery || '')) configNameCol = 'AccountDesp';
    if (/select\s+ItemName\b/i.test(row.comboQuery || '')) configNameCol = 'ItemName';
    if (/,\s*PartyName\b/i.test(row.comboQuery || '') || /select\s+PartyName\b/i.test(row.comboQuery || '')) configNameCol = 'PartyName';
    if (/,\s*CustomerName\b/i.test(row.comboQuery || '') || /select\s+CustomerName\b/i.test(row.comboQuery || '')) configNameCol = 'CustomerName';
    if (/,\s*PersonName\b/i.test(row.comboQuery || '')) configNameCol = 'PersonName';
    return configNameCol;
}

function loadDynamicComboOptionsAsync(row) {
    if (!row || !(row.code > 0)) return Promise.resolve();

    if (isDynamicDateFieldCombo(row)) {
        return new Promise(function (resolve) {
            loadConfigDateFieldComboOptions(row);
            resolve();
        });
    }

    var templateCode = parseInt($('#ddlTemplate').val(), 10) || 0;
    var configNameCol = resolveDynamicComboNameColumn(row);
    var $field = $('#olDynField_' + row.code);
    var $sel = $('#ddlDynFilter_' + row.code);
    if (!$sel.length) return Promise.resolve();

    /* Same combo can be requested again while an older request is still running (parent changed quickly, template
       re-rendered ...). Only the LATEST request may write into the dropdown, otherwise a slow unfiltered answer
       overwrites the filtered list. */
    var loadSeq = (G_OL_ComboLoadSeq[row.code] = (G_OL_ComboLoadSeq[row.code] || 0) + 1);
    function isStaleLoad() {
        return G_OL_ComboLoadSeq[row.code] !== loadSeq || !document.body.contains($sel[0]);
    }

    return fetchTemplateFilterComboData(templateCode, row.code, row)
        .then(function (res) {
            if (isStaleLoad()) return;
            if (!unwrapComboDataList(res).length) {
                return Promise.reject(new Error('Empty combo list'));
            }
            populateDynamicComboSelect($sel, res, row, configNameCol);
            afterDynamicComboOptionsLoaded(row, $field);
        })
        .catch(function (err) {
            if (isStaleLoad()) return;
            var failure = describeComboLoadFailure(err);
            if ($field.length) {
                $field.attr('title', failure.title);
            }
            /* A real failure (HTTP error / script error) keeps whatever was already loaded; only a genuinely empty
               answer (parent selection matches nothing) clears the list. */
            var hasLoadedOptions = $sel.find('option').filter(function () {
                return String($(this).val()) !== '0';
            }).length > 0;
            if (failure.empty || !hasLoadedOptions) {
                if (row.multi === 'Y') {
                    bindDropdown($sel, [], resolveDynamicComboNameColumn(row), 'Select ' + (row.displayName || 'filter') + '...');
                } else {
                    $sel.empty().append($('<option/>', { value: '0', text: 'All' }));
                }
            }
            if (window.console && console.warn) {
                console.warn('Combo not loaded: ' + (row.displayName || row.code) + ' - ' + failure.reason, err);
            }
            notifyComboLoadFailureOnce(failure);
        });
}

var G_OL_ComboLoadSeq = {};
var G_OL_ComboFailureShown = {};

/**
 * Why a combo stayed empty. GetTemplateFilterComboData returns the SQL error text on HTTP 500 and the call runs with
 * suppressErrorToast, so without this a missing API (404) or a bad ComboQuery looks the same as "no data".
 */
function describeComboLoadFailure(err) {
    if (err && err.message === 'Empty combo list') {
        return { empty: true, reason: 'the ComboQuery returned no rows', title: 'No options returned for this filter' };
    }
    var xhr = err && err.xhr;
    var status = xhr && xhr.status ? xhr.status : 0;
    var body = xhr && xhr.responseText
        ? String(xhr.responseText).replace(/\s+/g, ' ').trim().substring(0, 300)
        : '';
    var reason;
    if (status === 404 || status === 405) {
        reason = 'API OrderLoadReport/GetTemplateFilterComboData not found (HTTP ' + status + ') - deploy the Web API method';
    } else if (status) {
        reason = 'HTTP ' + status + (body ? ': ' + body : '');
    } else {
        reason = (err && err.message) ? String(err.message) : 'no response from the API';
    }
    return { empty: false, reason: reason, title: 'Dropdown options could not be loaded - ' + reason };
}

/** One toast per distinct reason (four combos failing for the same reason must not show four toasts). */
function notifyComboLoadFailureOnce(failure) {
    if (!failure || failure.empty) return;
    if (G_OL_ComboFailureShown[failure.reason]) return;
    G_OL_ComboFailureShown[failure.reason] = true;
    if (typeof toastr !== 'undefined') {
        toastr.error('Filter dropdowns could not be loaded: ' + failure.reason);
    }
}

function loadDynamicComboOptions(row) {
    loadDynamicComboOptionsAsync(row);
}

/** True while loadAllDynamicCombosSequential runs: parents are loaded before children, no extra cascade reloads needed. */
var G_OL_ComboBulkLoading = false;

function loadAllDynamicCombosSequential() {
    var combos = sortDynamicComboFiltersForRender((G_OL_DynamicFilters || []).filter(function (row) {
        return String(row.controlType || '').toUpperCase() === 'COMBO';
    }));
    G_OL_ComboBulkLoading = true;
    var chain = Promise.resolve();
    combos.forEach(function (row) {
        chain = chain.then(function () { return loadDynamicComboOptionsAsync(row); });
    });
    var done = function () { G_OL_ComboBulkLoading = false; };
    return chain.then(done, done);
}

function isClientNatureParentComboName(name) {
    var n = String(name || '').trim().toLowerCase();
    return n === 'customername' || n === 'partyname' || n === 'party name';
}

function sortDynamicComboFiltersForRender(combos) {
    return (combos || []).slice().sort(function (a, b) {
        if (isDynamicDateFieldCombo(a)) return -1;
        if (isDynamicDateFieldCombo(b)) return 1;
        var an = String(a.displayName || '').trim().toLowerCase();
        var bn = String(b.displayName || '').trim().toLowerCase();
        if (an === 'client nature' && isClientNatureParentComboName(bn)) return -1;
        if (bn === 'client nature' && isClientNatureParentComboName(an)) return 1;
        if (an === 'item category' && (bn === 'item name' || bn === 'item type')) return -1;
        if (bn === 'item category' && (an === 'item name' || an === 'item type')) return 1;
        if (an === 'item type' && bn === 'item name') return -1;
        if (an === 'item name' && bn === 'item type') return 1;
        return (a.sortOrder || a.code) - (b.sortOrder || b.code);
    });
}

function renderDynamicComboFilters() {
    clearDynamicFilterHost();
    var combos = sortDynamicComboFiltersForRender((G_OL_DynamicFilters || []).filter(function (row) {
        return String(row.controlType || '').toUpperCase() === 'COMBO';
    }));

    combos.forEach(function (row) {
        var selectId = 'ddlDynFilter_' + row.code;
        var isDateField = isDynamicDateFieldCombo(row);
        var multiple = (row.multi === 'Y' && !isDateField) ? ' multiple' : '';
        var useHeaderDateMirror = isDateField && configHasTextHeaderDates();
        var modalDatesHtml = '';
        if (useHeaderDateMirror) {
            var fromRow = findTextHeaderDateRow('from');
            var toRow = findTextHeaderDateRow('to');
            var mirrorItems = '';
            if (fromRow) {
                var fromLbl = escapeHtml(headerDateLabelFromConfigRow(fromRow, 'From'));
                var mirrorFromId = 'olMirrorFrom_' + row.code;
                mirrorItems += '<div class="ol-dyn-date-mirror-item">' +
                    '<label class="form-label ol-dyn-date-mirror-label" for="' + mirrorFromId + '"><span class="ol-mirror-from-label">' + fromLbl + '</span></label>' +
                    '<input type="date" id="' + mirrorFromId + '" class="form-control form-control-sm box_border ol-mirror-from" aria-label="' + fromLbl + '" />' +
                    '</div>';
            }
            if (toRow) {
                var toLbl = escapeHtml(headerDateLabelFromConfigRow(toRow, 'To'));
                var mirrorToId = 'olMirrorTo_' + row.code;
                mirrorItems += '<div class="ol-dyn-date-mirror-item">' +
                    '<label class="form-label ol-dyn-date-mirror-label" for="' + mirrorToId + '"><span class="ol-mirror-to-label">' + toLbl + '</span></label>' +
                    '<input type="date" id="' + mirrorToId + '" class="form-control form-control-sm box_border ol-mirror-to" aria-label="' + toLbl + '" />' +
                    '</div>';
            }
            modalDatesHtml = mirrorItems
                ? '<div class="ol-config-header-date-mirror"><div class="ol-dyn-date-mirror-pair">' + mirrorItems + '</div></div>'
                : '';
        } else if (isDateField && !configHasTextHeaderDates()) {
            modalDatesHtml = '<div class="ol-level-dates ol-config-date-range-host"></div>';
        }
        var bodyHtml;
        var fieldClass = 'ol-filter-field ol-filter-multiselect' + (isDateField ? ' ol-dyn-date-field' : '');
        var fieldInner;
        if (isDateField && useHeaderDateMirror) {
            fieldInner = '<div class="ol-dyn-date-inline">' +
                '<div class="ol-dyn-date-inline-combo">' +
                '<label for="' + selectId + '" class="form-label"><span>' + escapeHtml(row.displayName || 'Date Field') + '</span></label>' +
                '<select id="' + selectId + '" class="form-control form-control-sm box_border ol-dyn-date-field-select"></select>' +
                '</div>' +
                modalDatesHtml +
                '</div>';
        } else {
            bodyHtml = '<div class="ol-level-row">' +
                '<select id="' + selectId + '" class="form-control form-control-sm box_border' + (multiple ? ' ol-multi-select' : '') + '"' + multiple + '>' +
                (isDateField ? '' : '<option value="0">All</option>') + '</select>' +
                modalDatesHtml +
                '</div>';
            fieldInner = '<label for="' + selectId + '" class="form-label"><span>' + escapeHtml(row.displayName || 'Filter') + '</span></label>' +
                bodyHtml;
        }
        var html = '<div class="' + fieldClass + '" id="olDynField_' + row.code + '">' +
            fieldInner +
            '</div>';
        $('#olDynamicFilterHost').append(html);
    });

    syncConfigDateFieldModalRangeUi();
    applyConfigTextHeaderDateLabels();
    syncDateFieldModalHeaderMirror();
    loadAllDynamicCombosSequential().then(function () {
        applyAllDynamicComboDefaults();
        bindDynamicComboCascade();
        var templateCode = parseInt($('#ddlTemplate').val(), 10) || 0;
        sortDynamicComboFiltersForRender((G_OL_DynamicFilters || []).filter(function (row) {
            return String(row.controlType || '').toUpperCase() === 'COMBO';
        })).forEach(function (row) {
            if (isDynamicDateFieldCombo(row)) return;
            /* Only a parent that now HAS a selection (e.g. Item Category default "Finish") narrows its children;
               children of an unselected parent were already loaded unfiltered during the sequential load. */
            if (!dynamicSelectHasValue($('#ddlDynFilter_' + row.code))) return;
            getDynamicFilterRowsDependingOn(row.displayName).forEach(function (child) {
                loadDynamicComboOptionsAsync(child);
            });
        });
    });
}

/** When Text From/To are outside, Date Field combo stays in modal only; else show modal From/To under that combo. */
function syncConfigDateFieldModalRangeUi() {
    var dfCombo = getDynamicDateFieldComboRow();
    var showModalDates = !!dfCombo && hasActiveTemplateFilterConfiguration() && !configHasTextHeaderDates();
    var $levelDates = $('#olLevelDates');

    toggleFilterField('olFieldLevel', false);

    if (showModalDates && $levelDates.length) {
        var $host = $('#olDynamicFilterHost .ol-config-date-range-host').first();
        if ($host.length) {
            $host.append($levelDates.removeClass('ol-hidden'));
        }
        ensureLevelDateRangeDefaults();
        syncModalDatesFromHeader();
    } else if ($levelDates.length && $('#olFieldLevel .ol-level-row').length) {
        $('#olFieldLevel .ol-level-row').append($levelDates.addClass('ol-hidden'));
    }

    if (configHasTextHeaderDates()) {
        syncDateFieldModalHeaderMirror();
    }
}

function resetDynamicFilterSelections() {
    (G_OL_DynamicFilters || []).forEach(function (row) {
        if (String(row.controlType || '').toUpperCase() !== 'COMBO') return;
        var $sel = $('#ddlDynFilter_' + row.code);
        if (!$sel.length) return;
        if (isDynamicDateFieldCombo(row)) {
            if ($sel.find('option').length) $sel.prop('selectedIndex', 0);
            applySelectedConfigDateFieldCombo();
            return;
        }
        if (row.defaultValue && row.defaultValue.indexOf('{{') < 0) {
            applyDynamicComboDefault(row);
            return;
        }
        if (row.multi === 'Y') setCheckboxDropdownValue($sel, ['0']);
        else $sel.val('0');
    });
}

function loadDynamicTemplateFilters(tpl) {
    tpl = tpl || getSelectedTemplate();
    var code = parseInt(tpl && tpl.code, 10) || 0;
    var seq = ++G_OL_FilterLoadSeq;

    if (!code) {
        G_OL_DynamicFilters = [];
        G_OL_HasDynamicComboFilters = false;
        clearDynamicFilterHost();
        return;
    }

    var applyRows = function (rows) {
        if (seq !== G_OL_FilterLoadSeq) return;
        if ((parseInt($('#ddlTemplate').val(), 10) || 0) !== code) return;

        G_OL_FilterConfigFetchPending = false;

        G_OL_DynamicFilters = (rows || []).filter(function (row) {
            return (parseInt(row.templateCode, 10) || 0) === code && row.isActive !== 'N' && row.code > 0;
        }).sort(function (a, b) {
            return (a.sortOrder || a.code) - (b.sortOrder || b.code);
        });

        G_OL_HasDynamicComboFilters = G_OL_DynamicFilters.some(function (row) {
            return String(row.controlType || '').toUpperCase() === 'COMBO';
        });

        if (usesTemplateFilterConfigurationUi(tpl)) {
            hideStaticComboFilters();
        } else if (G_OL_HasDynamicComboFilters) {
            hideStaticComboFilters();
        } else {
            clearDynamicFilterHost();
        }

        applyDynamicDateDefaults(tpl);
        syncOrderLoadTemplateDateFieldUi(tpl);
        syncFilterFieldsFromTemplateFilterConfiguration(tpl);
        if (G_OL_HasDynamicComboFilters) renderDynamicComboFilters();
        applyFilterActiveColors();
        updateFilterButtonState();
        updateModalEmptyState();

        var needsFinYear = (G_OL_DynamicFilters || []).some(function (row) {
            return isDynamicDateRow(row) && String(row.defaultValue || '').indexOf('{{FinYear') >= 0;
        });
        if (needsFinYear && typeof OrderLoadReportService.GetDefaultReportDates === 'function') {
            OrderLoadReportService.GetDefaultReportDates(code, '')
                .then(function (res) {
                    if (seq !== G_OL_FilterLoadSeq) return;
                    unwrapApiList(res).forEach(function (item) {
                        var param = String(prop(item, ['ProcedureParameter', 'procedureParameter']) || '').toUpperCase();
                        var iso = apiDateToIso(prop(item, ['ResolvedDefaultValue', 'resolvedDefaultValue']));
                        if (!iso) return;
                        if (param === 'FROMDATE') $('#txtFromDate').val(iso);
                        if (param === 'TODATE') $('#txtToDate').val(iso);
                    });
                })
                .catch(function () { });
        }
    };

    var useCache = function (list) {
        applyRows((list || []).map(function (row) {
            var mapped = mapDynamicFilterRow(row);
            if (!mapped.resolvedDefaultValue && mapped.defaultValue) {
                mapped.resolvedDefaultValue = resolveDynamicDefaultValue(mapped.defaultValue);
            }
            return mapped;
        }));
    };

    var cacheKey = 'tpl_' + code;
    var cachedRows = G_OL_FilterConfigCache && G_OL_FilterConfigCache.key === cacheKey
        ? G_OL_FilterConfigCache.rows
        : null;

    if (cachedRows) {
        useCache(cachedRows);
        return;
    }

    G_OL_FilterConfigFetchPending = true;

    ensureFinYearTokens().then(function () {
        if (seq !== G_OL_FilterLoadSeq) return;

        fetchTemplateFilterConfigurationRows(code)
            .then(function (list) {
                if (seq !== G_OL_FilterLoadSeq) return;
                G_OL_FilterConfigCache = { key: cacheKey, rows: list };
                useCache(list);
            })
            .catch(function () {
                if (seq !== G_OL_FilterLoadSeq) return;
                G_OL_FilterConfigFetchPending = false;
                G_OL_DynamicFilters = [];
                G_OL_HasDynamicComboFilters = false;
                clearDynamicFilterHost();
                syncOrderLoadTemplateDateFieldUi(tpl);
                applyStaticDateFieldsFromTemplate(tpl);
                applyLevelToFiltersStaticCombosOnly(tpl);
                updateModalEmptyState();
            });
    });
}

/** Static modal combos when F_TemplateFilterConfiguration is unavailable. */
function applyLevelToFiltersStaticCombosOnly(tpl) {
    tpl = tpl || getSelectedTemplate();
    if (usesTemplateFilterConfigurationUi(tpl) || G_OL_HasDynamicComboFilters) return;
    toggleFilterField('olFieldWareHouse', isFlagY(tpl.showWareHouse));
    toggleFilterField('olFieldItemGroup', isFlagY(tpl.showItemGroup));
    toggleFilterField('olFieldProcess', isFlagY(tpl.showProcess));
    toggleFilterField('olFieldMarketingMan', isFlagY(tpl.showMarketingMan) || isFlagY(tpl.showAsPerMarketingPerson));
    toggleFilterField('olFieldOrderNo', isFlagY(tpl.showOrderNo));
    toggleFilterField('olFieldItemType', isFlagY(tpl.showItemType));
    toggleFilterField('olFieldItemName', isFlagY(tpl.showItemName));
    applyOtherFiltersVisibility(tpl);
}

function buildReportConditions(tpl) {
    var filterParts = [];
    var queryParts = [];
    var viewBased = isViewBasedTemplate(tpl);
    var isStockSafe = viewBased ? false : inferUsesQueryCondition(tpl);
    var usesFilter = viewBased
        || procedureUsesParam(tpl, 'FilterCondition')
        || inferUsesFilterCondition(tpl);
    var usesQuery = !viewBased && (procedureUsesParam(tpl, 'QueryCondition') || isStockSafe);
    var usesDateParams = !viewBased && (procedureUsesParam(tpl, 'FromDate') || procedureUsesParam(tpl, 'ToDate'));
    var fromIso = $('#txtFromDate').val();
    var toIso = resolveReportToIsoForRequest(tpl, fromIso, $('#txtToDate').val());

    if (G_OL_HasDynamicComboFilters || dynamicDateRowsHaveQuery() || hasActiveTemplateFilterConfiguration()) {
        return buildConditionsFromFilterConfiguration(tpl, usesDateParams, fromIso, toIso);
    }
    // OtherFilter field names come from the template row. Do not add static column SQL
    // (ItemMaster_Code, GodownMaster_Code, OrderDate, ...) — the procedure binds only returned columns.
    var masterParts = buildOtherFilterParts(tpl);
    var dateField = getTemplateDateField(tpl);

    // Default: if procedure params unknown, prefer QueryCondition (stock-safe)
    if (!usesFilter && !usesQuery) {
        usesQuery = true;
    }

    // Stock / bal / invoice-rate: never put ItemMaster.* style filters in FilterCondition
    if (isStockSafe) {
        usesQuery = true;
    }

    if (usesQuery) {
        queryParts = queryParts.concat(masterParts);
    }

    if (usesFilter && !usesQuery) {
        filterParts = filterParts.concat(masterParts);
    } else if (viewBased) {
        queryParts = queryParts.concat(masterParts);
    }

    if (usesFilter && usesQuery) {
        // Procedure with both params: dates in FilterCondition; item/other filters in QueryCondition
        filterParts = filterParts.filter(function (part) {
            return part.indexOf(dateField) >= 0;
        });
    }

    // Stock-safe: drop non-date FilterCondition entirely
    if (isStockSafe) {
        filterParts = filterParts.filter(function (part) {
            return part.indexOf(dateField) >= 0;
        });
        if (!queryParts.length && masterParts.length) {
            queryParts = masterParts.slice();
        }
    }

    return routeConditionsForReportSource({
        filterCondition: filterParts.join(''),
        queryCondition: queryParts.join('')
    }, tpl);
}

function toIsoDate(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
}

function isoToApiDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    if (p.length !== 3) return iso;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return p[2] + '-' + months[parseInt(p[1], 10) - 1] + '-' + p[0];
}

/** dd/mm/yyyy for @FromDate/@ToDate — legacy procs use CONVERT(..., 103); dd-MMM-yyyy fails there. */
function isoToProcDateParam(iso) {
    var text = isoToSqlCastLiteral(iso);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return String(iso || '').trim();
    }
    var parts = text.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
}

/** yyyy-mm-dd for CAST(... AS DATE) — locale-safe on SQL Server. */
function isoToSqlCastLiteral(iso) {
    var text = String(iso || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    return apiDateToIso(text) || text;
}

function rewriteDisplayDateColumnsInSql(sql, tpl) {
    if (!sql || !tpl) return sql;
    var physical = toSqlFieldName(getTemplateDateField(tpl));
    if (!physical) return sql;
    var out = String(sql);
    var label = fieldNameToLabel(getTemplateDateField(tpl), 'Order Date');
    out = out.replace(/\[\s*Order\s*Date\s*\]/gi, physical);
    if (label) {
        var esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        out = out.replace(new RegExp('\\[\\s*' + esc + '\\s*\\]', 'gi'), physical);
    }
    return out;
}

/** Receive Date -> [Receive Date]; alias.Receive Date -> alias.[Receive Date]. Single words / already bracketed: unchanged. */
function bracketSpacedColumnName(name) {
    var text = String(name || '').trim();
    if (!text || !/\s/.test(text) || text.indexOf('[') >= 0) return text;
    var dot = text.indexOf('.');
    if (dot > 0 && !/\s/.test(text.slice(0, dot))) {
        return text.slice(0, dot + 1) + '[' + text.slice(dot + 1).trim().replace(/\]/g, ']]') + ']';
    }
    return '[' + text.replace(/\]/g, ']]') + ']';
}

/**
 * F_TemplateFilterConfiguration.QueryCondition may hold the date column without brackets when its name has a space:
 *   AND TRY_CAST(Receive Date AS DATE) >= CAST('...' AS DATE)   ->   AND TRY_CAST([Receive Date] AS DATE) >= ...
 *   AND Receive Date >= CAST('...' AS DATE)                      ->   AND [Receive Date] >= ...
 * Only adds brackets (never renames a column); single-word and already bracketed names are left alone.
 */
function bracketSpacedDateColumnsInSql(sql) {
    if (!sql) return sql;
    var word = '[A-Za-z_]\\w*';
    var notKeyword = '(?!(?:AND|OR|NOT|WHERE)\\b)';
    var ident = word + '(?:\\.' + word + ')?';

    // TRY_CAST(Receive Date AS DATE) / CAST(Receive Date AS DATE)
    var reCast = new RegExp(
        '(\\b(?:TRY_)?CAST\\s*\\(\\s*)(' + ident + '(?:\\s+(?!AS\\s+DATE\\b)' + notKeyword + word + ')+)(\\s+AS\\s+DATE\\s*\\))',
        'gi'
    );
    var out = String(sql).replace(reCast, function (_, pre, col, post) {
        // CAST('2026-07-02' AS DATE) has a quoted literal, never matches: only identifiers get here.
        return pre + bracketSpacedColumnName(col) + post;
    });

    // AND Receive Date >= CAST('2026-07-02' AS DATE)
    var reCompare = new RegExp(
        '((?:^|\\b(?:AND|OR|WHERE)\\s+|\\()\\s*)(?!(?:AND|OR|NOT|WHERE|CAST|TRY_CAST|CONVERT)\\b)'
        + '(' + ident + '(?:\\s+' + notKeyword + word + ')+)'
        + '(\\s*(?:>=|<=|<>|=|>|<)\\s*(?:TRY_)?CAST\\s*\\()',
        'gi'
    );
    out = out.replace(reCompare, function (_, pre, col, post) {
        return pre + bracketSpacedColumnName(col) + post;
    });
    return out;
}

function sqlDateCompareExpression(columnRef) {
    var col = String(columnRef || '').trim();
    if (!col) return '';
    if (/TRY_CAST\s*\(/i.test(col)) return col;
    var bare = col.replace(/^\[|\]$/g, '');
    if (/\s/.test(bare)) return 'TRY_CAST(' + bracketSpacedColumnName(col) + ' AS DATE)';
    return col;
}

function simplifyPhysicalDateTryCast(sql) {
    if (!sql) return sql;
    return String(sql).replace(
        /TRY_CAST\((\[[A-Za-z0-9_]+\]|[A-Za-z_][A-Za-z0-9_.]*)\s+AS\s+DATE\)/gi,
        function (_, col) {
            var bare = col.replace(/^\[|\]$/g, '');
            return /\s/.test(bare) ? ('TRY_CAST(' + col + ' AS DATE)') : col;
        }
    );
}

function finalizeReportSqlDateConditions(condition, tpl) {
    var text = normalizeReportCondition(condition);
    text = rewriteDisplayDateColumnsInSql(text, tpl);
    text = bracketSpacedDateColumnsInSql(text);
    text = applyTryCastToDateCompareFragment(text);
    text = simplifyPhysicalDateTryCast(text);
    return text;
}

function applyTryCastToDateCompareFragment(frag) {
    if (!frag) return frag;
    var text = String(frag).replace(
        /CAST\s*\(\s*'([^']*)'\s*AS\s*DATE\s*\)/gi,
        function (_, raw) {
            var iso = isoToSqlCastLiteral(apiDateToIso(raw) || raw);
            return "CAST('" + iso.replace(/'/g, "''") + "' AS DATE)";
        }
    );
    if (!/TRY_CAST\s*\(/i.test(text)) {
        text = text.replace(
            /(\sAND\s+)(\[[^\]]+\]|[A-Za-z_][\w.]*)(\s*(?:>=|<=|=|>|<)\s*CAST\s*\(\s*'[^']*'\s*AS\s*DATE\s*\))/gi,
            function (_, and, col, rest) {
                return and + sqlDateCompareExpression(col) + rest;
            }
        );
    }
    return text;
}

function buildSqlDateCompareFragment(sqlDateField, operator, iso) {
    var literal = isoToSqlCastLiteral(iso);
    if (!sqlDateField || !literal) return '';
    var expr = sqlDateCompareExpression(String(sqlDateField).trim());
    return ' AND ' + expr + ' ' + operator + " CAST('" + literal.replace(/'/g, "''") + "' AS DATE)";
}

function setPageLoader(visible, text) {
    var $loader = $('#olPageLoader');
    if (text) $('#olLoaderText').text(text);
    $loader.toggleClass('ol-visible', !!visible);
    if (typeof ShowLoader === 'function' && visible) ShowLoader();
    if (typeof HideLoader === 'function' && !visible && !G_OL_LoadingReport) HideLoader();
}

function setGridLoader(visible) {
    $('#olGridLoader').toggleClass('ol-visible', !!visible);
}

function setShowButtonLoading(loading) {
    G_OL_LoadingReport = !!loading;
    $('#btnShow').prop('disabled', loading);
    $('#btnFilter').prop('disabled', loading);
    $('#btnFilterModalOk').prop('disabled', loading);
    $('#btnShowIcon').toggle(!loading);
    $('#btnShowText').text(loading ? 'Loading...' : 'Load Report');
    $('#btnShowSpinner').toggle(loading);
}

function loadTemplateDropdown(preselectCode) {
    setPageLoader(true, 'Loading templates...');

    OrderLoadReportService.GetTempleteList(G_OL_FORM_TYPE)
        .then(function (res) {
            var rows = unwrapApiList(res);
            G_OL_Templates = collapseAutoFilterTemplateRows(rows).map(mapTemplate);
            var $ddl = $('#ddlTemplate').empty();

            if (!G_OL_Templates.length) {
                $ddl.append($('<option/>').val('').text('-- No templates --'));
                if (rows.length) {
                    console.warn('OrderLoadReport: template rows received but none mapped.', rows);
                }
                return;
            }

            G_OL_Templates.forEach(function (t) {
                var masterFlag = normalizeMasterTemplete(t.masterTemplete);
                var tplDates = extractDatesFromApiRow(t);
                $ddl.append(
                    $('<option/>')
                        .val(t.code)
                        .text(formatTemplateDisplayName(t.desp, masterFlag))
                        .attr('data-desp', t.desp)
                        .attr('data-master-templete', masterFlag)
                        .attr('data-from-date', tplDates.fromDate || t.fromDate || '')
                        .attr('data-to-date', tplDates.toDate || t.toDate || '')
                        .addClass(getTemplateOptionClass(masterFlag))
                );
            });

            var wanted = parseInt(preselectCode, 10) || 0;
            if (wanted && findTemplate(wanted)) {
                $ddl.val(String(wanted));
            }

            applyTemplateFilters();
        })
        .catch(function (err) {
            console.error('OrderLoadReport GetTempleteList failed:', err);
            toastr.error('Could not load report templates.');
            $('#ddlTemplate').empty().append($('<option/>').val('').text('-- No templates --'));
        })
        .finally(function () {
            setPageLoader(false);
        });
}

function getSelectedTemplate() {
    var code = parseInt($('#ddlTemplate').val(), 10) || 0;

    if (G_OL_CurrentLevel && (parseInt(G_OL_CurrentLevel.code, 10) || 0) === code) {
        return G_OL_CurrentLevel;
    }

    var found = findTemplate(code);
    if (found) return found;

    var $opt = $('#ddlTemplate option:selected');
    return Object.assign(getDefaultLevelTemplate(), {
        code: code,
        desp: ($opt.attr('data-desp') || $opt.text() || '').trim()
    });
}

function extractOrderLoadReportErrorMessage(payload, err) {
    if (payload != null) {
        if (typeof payload === 'string') {
            var text = payload.trim().replace(/^"|"$/g, '');
            if (text && text.charAt(0) !== '[' && text.charAt(0) !== '{') {
                return text;
            }
        }

        if (typeof payload === 'object') {
            var objectMsg = prop(payload, [
                'Message', 'message', 'Msg', 'msg', 'Error', 'error',
                'ErrorMessage', 'errorMessage', 'ExceptionMessage', 'exceptionMessage'
            ]);
            if (objectMsg) return String(objectMsg).trim();
        }
    }

    if (err && err.xhr) {
        var responseText = String(err.xhr.responseText || '').trim().replace(/^"|"$/g, '');
        if (responseText) {
            if (responseText.charAt(0) === '{' || responseText.charAt(0) === '[') {
                try {
                    var parsedMsg = extractOrderLoadReportErrorMessage(JSON.parse(responseText), null);
                    if (parsedMsg) return parsedMsg;
                } catch (parseErr) {
                    /* ignore invalid JSON body */
                }
            } else {
                return responseText;
            }
        }
    }

    if (err && err.message) {
        return String(err.message).trim();
    }

    return '';
}

function formatOrderLoadReportErrorMessage(rawMsg, tpl) {
    var msg = String(rawMsg || '').trim();
    if (!msg || msg.toLowerCase() === 'null') {
        return 'Report request failed.';
    }
    return msg;
}

function assertValidOrderLoadReportResponse(response, tpl) {
    var inlineError = extractOrderLoadReportErrorMessage(response);
    if (inlineError && typeof response === 'string' && response.trim().charAt(0) !== '[' && response.trim().charAt(0) !== '{') {
        throw { message: formatOrderLoadReportErrorMessage(inlineError, tpl) };
    }

    if (inlineError && typeof response === 'object' && response && !unwrapApiList(response).length) {
        throw { message: formatOrderLoadReportErrorMessage(inlineError, tpl) };
    }
}

function validateOrderLoadReportTemplate(tpl) {
    if (!tpl.code || !tpl.desp) {
        return 'Please select Template.';
    }

    var fromIso = $('#txtFromDate').val();
    var toIso = $('#txtToDate').val();
    if (isAsOnDateMode(tpl) && normalizeFieldName(tpl.fieldForDate) && !toIso) {
        return 'Please select As On date.';
    }
    if (isFromDateRequired(tpl) && !fromIso) {
        var fromWhere = isLevelDateRangeAvailable() && !shouldShowStaticFromDate(tpl)
            ? ' (Filters → Date Field)'
            : '';
        return 'Please select ' + fieldNameToLabel(tpl.fieldForDate, 'Order Date') + ' From' + fromWhere + '.';
    }
    if (isToDateRequired(tpl) && !toIso) {
        var toWhere = isLevelDateRangeAvailable() && !shouldShowStaticToDate(tpl)
            ? ' (Filters → Date Field)'
            : '';
        return 'Please select ' + fieldNameToLabel(tpl.fieldForDate, 'Order Date') + ' To' + toWhere + '.';
    }
    if (isFromDateRequired(tpl) && isToDateRequired(tpl) && fromIso && toIso && fromIso > toIso) {
        return 'From Date must be less than or equal to To Date.';
    }

    return '';
}

function resolveReportToIsoForRequest(tpl, fromIso, toIso) {
    var to = String(toIso || '').trim();
    if (hasActiveTemplateFilterConfiguration() && !dynamicConfigHasDateFilter('to')) {
        return '';
    }
    if (isAsOnDateMode(tpl)) return to;
    if (to) return to;
    if (!String(fromIso || '').trim()) return '';
    if (hasActiveTemplateFilterConfiguration() && !dynamicConfigHasDateFilter('to') && !isLevelDateRangeAvailable()) {
        return '';
    }
    if (!isViewBasedTemplate(tpl)) {
        return getDefaultToDate();
    }
    if (shouldShowStaticToDate(tpl) || procedureUsesParam(tpl, 'ToDate')) {
        return getDefaultToDate();
    }
    return '';
}

function resolveProcDateParamForRequest(tpl, iso, kind) {
    var value = String(iso || '').trim();
    if (!value) return '';
    if (kind === 'from') {
        if (!isFromDateRequired(tpl) && !(isLevelDateRangeAvailable() && value)) return '';
        return isoToProcDateParam(value);
    }
    if (!isToDateRequired(tpl) && !(isLevelDateRangeAvailable() && value)) return '';
    return isoToProcDateParam(value);
}

function buildOrderLoadReportRequestParams(tpl) {
    var validationMsg = validateOrderLoadReportTemplate(tpl);
    if (validationMsg) {
        return { error: validationMsg };
    }

    var fromIso = $('#txtFromDate').val();
    var toIso = resolveReportToIsoForRequest(tpl, fromIso, $('#txtToDate').val());
    var auth = {};
    try {
        auth = JSON.parse(sessionStorage.getItem('authKey') || '{}');
    } catch (e) {
        auth = {};
    }

    var conditions = buildReportConditions(tpl);
    var filterCodes = getFilterCodes(tpl);
    var marketingManCode = 0;
    if (isFlagY(tpl.showMarketingMan) || isFlagY(tpl.showAsPerMarketingPerson)) {
        marketingManCode = getDropdownCode('#ddlMarketingMan');
    }

    var sizeCodes = isOrderLoadSizeParameterFilterEnabled(tpl) ? String(G_OL_ItemSizeMaster_Codes || '').trim() : '';

    var fromParam = resolveProcDateParamForRequest(tpl, fromIso, 'from');
    var toParam = resolveProcDateParamForRequest(tpl, toIso, 'to');

    return {
        reportType: String(tpl.desp || '').trim(),
        templateCode: tpl.code,
        filterCondition: finalizeReportSqlDateConditions(conditions.filterCondition, tpl),
        queryCondition: finalizeReportSqlDateConditions(sizeCodes ? '' : conditions.queryCondition, tpl),
        fromDate: fromParam,
        toDate: toParam,
        userMasterCode: auth.UserMaster_Code || 0,
        marketingManMasterCode: marketingManCode,
        godownMasterCode: filterCodes.godownMasterCode,
        itemGroupMasterCode: filterCodes.itemGroupMasterCode,
        processMasterCode: filterCodes.processMasterCode,
        itemTypeMasterCode: filterCodes.itemTypeMasterCode,
        itemMasterCode: filterCodes.itemMasterCode,
        buyerPOMasterCode: filterCodes.buyerPOMasterCode,
        itemSizeMasterCodes: sizeCodes
    };
}

function resolveOrderLoadProcedureParamValue(paramName, tpl, requestParams, reportFileName) {
    var key = String(paramName || '').trim().toUpperCase();
    switch (key) {
        case 'F_TEMPLETEMASTER_CODE':
            return String(requestParams.templateCode || (tpl && tpl.code) || 0);
        case 'USERMASTER_CODE':
            return String(requestParams.userMasterCode || 0);
        case 'FROMDATE':
            return String(requestParams.fromDate || '');
        case 'TODATE':
            return String(requestParams.toDate || '');
        case 'FILTERCONDITION':
            return String(requestParams.filterCondition || '');
        case 'QUERYCONDITION':
            return String(requestParams.queryCondition || '');
        case 'MARKETINGMANMASTER_CODE':
            return String(requestParams.marketingManMasterCode || 0);
        case 'GODOWNMASTER_CODE':
            return String(requestParams.godownMasterCode || 0);
        case 'ITEMGROUPMASTER_CODE':
            return String(requestParams.itemGroupMasterCode || 0);
        case 'PROCESSMASTER_CODE':
            return String(requestParams.processMasterCode || 0);
        case 'ITEMTYPEMASTER_CODE':
            return String(requestParams.itemTypeMasterCode || 0);
        case 'ITEMMASTER_CODE':
            return String(requestParams.itemMasterCode || 0);
        case 'BUYERPOMASTER_CODE':
            return String(requestParams.buyerPOMasterCode || 0);
        case 'ITEMSIZEMASTER_CODES':
            return String(requestParams.itemSizeMasterCodes || '');
        case 'REPORTFILENAME':
            return String(reportFileName || '');
        case 'DATABASELOCATION_CODE':
        case 'SUBREPORTNAME':
            return '';
        case 'FILLDATAONLY':
            return 'N';
        default:
            return '';
    }
}

function quoteOrderLoadProcedureParamValue(value) {
    return '\'' + String(value == null ? '' : value).replace(/'/g, "''") + '\'';
}

function buildOrderLoadPrintProcedureParameters(tpl, requestParams, reportFileName) {
    var spec = String(tpl && tpl.procedureParameters || '').trim();
    if (!spec) return '';

    return spec.split('#')
        .map(function (name) { return String(name || '').trim(); })
        .filter(function (name) { return !!name; })
        .map(function (name) {
            var value = resolveOrderLoadProcedureParamValue(name, tpl, requestParams, reportFileName);
            return name + '=' + quoteOrderLoadProcedureParamValue(value);
        })
        .join('#');
}

function loadReportData() {
    if (G_OL_LoadingReport) return;

    var tpl = getSelectedTemplate();
    var params = buildOrderLoadReportRequestParams(tpl);
    if (params.error) {
        toastr.warning(params.error);
        return;
    }

    setShowButtonLoading(true);
    setGridLoader(true);
    clearGridExportState();
    $('#olGridFooter').hide();
    showGridPanel(true);

    // Load report + template ShowTotal flags together
    Promise.all([
        OrderLoadReportService.GetOrderLoadReport(params),
        OrderLoadReportService.GetTemplateTransaction(tpl.code)
            .then(function (res) {
                G_OL_ShowTotalLoaded = true;
                return res;
            })
            .catch(function () {
                G_OL_ShowTotalLoaded = false;
                return [];
            })
    ])
        .then(function (results) {
            assertValidOrderLoadReportResponse(results[0], tpl);
            G_OL_TemplateTransactions = unwrapApiList(results[1]);
            G_OL_ShowTotalKeys = buildShowTotalKeys(G_OL_TemplateTransactions);
            bindOrderLoadGrid(results[0]);
        })
        .catch(function (err) {
            var rawMsg = extractOrderLoadReportErrorMessage(null, err) || (err && err.message) || 'Request failed';
            var msg = formatOrderLoadReportErrorMessage(rawMsg, tpl);
            showOrderLoadErrorCombo([msg]);
            toastr.error(msg);
        })
        .finally(function () {
            setShowButtonLoading(false);
            setGridLoader(false);
        });
}

/* ShowTotal = 'Y' → collect display/field names used to match grid columns */
function buildShowTotalKeys(transactionRows) {
    var keys = [];
    (transactionRows || []).forEach(function (row) {
        if (!isFlagY(prop(row, ['ShowTotal', 'showTotal']))) return;
        // Prefer selected fields; still allow ShowTotal if Selected blank
        var selected = prop(row, ['Selected', 'selected']);
        if (selected !== '' && !isFlagY(selected)) return;

        var aliases = [
            prop(row, ['FieldNameAs', 'fieldNameAs']),
            prop(row, ['FieldName', 'fieldName'])
        ];
        aliases.forEach(function (alias) {
            var n = normalizeColumnKey(alias);
            if (n && keys.indexOf(n) < 0) keys.push(n);
        });
    });
    return keys;
}

function normalizeColumnKey(name) {
    return normalizeFieldName(name)
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function isShowTotalColumn(colName) {
    if (!G_OL_ShowTotalKeys.length) return false;
    var key = normalizeColumnKey(colName);
    if (G_OL_ShowTotalKeys.indexOf(key) >= 0) return true;

    // also match without spaces: "Qty Pc" vs "QtyPc"
    var compact = key.replace(/\s+/g, '');
    return G_OL_ShowTotalKeys.some(function (k) {
        return k.replace(/\s+/g, '') === compact;
    });
}

/* Template DecimalPoint (DataType = N) → normalized column keys for grid formatting */
function buildTemplateDecimalPointMap(gridKeys) {
    var map = {};
    var keys = gridKeys || [];

    (G_OL_TemplateTransactions || []).forEach(function (row) {
        if (String(prop(row, ['DataType', 'dataType']) || '').trim().toUpperCase() !== 'N') return;

        var dec = parseInt(prop(row, ['DecimalPoint', 'decimalPoint']), 10);
        if (isNaN(dec) || dec < 0) dec = 0;
        if (dec > 9) dec = 9;

        var fieldName = prop(row, ['FieldName', 'fieldName']);
        var fieldNameAs = prop(row, ['FieldNameAs', 'fieldNameAs']);
        var gridKey = resolveGridColumnKey(keys, fieldName, fieldNameAs);

        [fieldName, fieldNameAs, gridKey].forEach(function (alias) {
            if (!alias) return;
            var n = normalizeColumnKey(alias);
            if (!n) return;
            map[n] = dec;
            map[n.replace(/\s+/g, '')] = dec;
        });
    });

    return map;
}

function getTemplateDecimalPoint(colName, templateDecimalMap) {
    if (!templateDecimalMap || !colName) return null;
    var key = normalizeColumnKey(colName);
    if (Object.prototype.hasOwnProperty.call(templateDecimalMap, key)) {
        return templateDecimalMap[key];
    }
    var compact = key.replace(/\s+/g, '');
    if (Object.prototype.hasOwnProperty.call(templateDecimalMap, compact)) {
        return templateDecimalMap[compact];
    }
    return null;
}

function bindOrderLoadGrid(response) {
    var rows = formatGridRows(unwrapApiList(response));

    if (isSqlErrorResultSet(rows)) {
        showOrderLoadErrorCombo(rows);
        return;
    }

    if (!rows || !rows.length) {
        if (isSizeParameterFilterApplied()) {
            toastr.warning('No data found for applied Size Parameter Filter. Clear filter and try again.');
        } else {
            toastr.warning('No Data Found');
        }
        showGridPanel(false);
        updateEmptyStateMessage();
        return;
    }

    var cfg = buildGridConfig(rows);
    G_OL_DateColumns = cfg.DateFilterColumn.slice();
    G_OL_NumericColumns = cfg.NumericFilterColumn.slice();
    G_OL_PrintColumnDefs = buildPrintColumnDefs(G_OL_TemplateTransactions, rows[0]);
    showGridPanel(true);

    BizsolCustomFilterGrid.CreateDataTable(
        'OrderLoadReport-header',
        'OrderLoadReport-body',
        rows,
        cfg.Button,
        cfg.showButtons,
        cfg.StringFilterColumn,
        cfg.NumericFilterColumn,
        cfg.DateFilterColumn,
        cfg.StringdoubleFilterColumn,
        cfg.hiddenColumns,
        cfg.ColumnAlignment,
        true,
        cfg.totalColumns,
        cfg.fixedDecimalValue,
        cfg.commaColumns,
        getGridSearchPlaceholder()
    );

    setGridExportReady(rows);
    refreshOrderLoadSizeFilterItemCodes(getSelectedTemplate());
    enhanceGridChrome(rows.length);
}

function getGridSearchPlaceholder(clientLabel) {
    var label = clientLabel || fieldNameToLabel(
        G_OL_CurrentLevel && G_OL_CurrentLevel.fieldForClient,
        'Customer'
    );
    return 'Search Order No, ' + label + ', Item...';
}

function enhanceGridChrome(totalRows) {
    $('#olGridMeta').show();
    $('#olGridFooter').show();
    updateDownloadButtonState();

    $('#olRecordCount').text(
        totalRows.toLocaleString('en-IN') + ' record' + (totalRows === 1 ? '' : 's')
    );

    var $search = $('#global-search-wrap-OrderLoadReport');
    if ($search.length) {
        $search.detach().appendTo('#olSearchSlot');
    }

    $('#OrderLoadReport').closest('.table-wrapper').addClass('filtered');
    applyGridCellEnhancements();
    updateSizeParameterGridButton();
}

function getOrderLoadExportRows() {
    if (!G_OL_GridDataReady) {
        return [];
    }

    var filtered = window.filteredData_OrderLoadReport;
    if (Array.isArray(filtered) && filtered.length) {
        return filtered;
    }

    return G_OL_ExportRows;
}

function getOrderLoadExportColumns(rows) {
    if (!rows.length) return [];

    var hidden = window['hiddenColumns_OrderLoadReport-body'] || [];
    var cols = Object.keys(rows[0]).filter(function (col) {
        return hidden.indexOf(col) < 0;
    });

    return cols.length ? cols : Object.keys(rows[0]);
}

function isBlankNullValue(value) {
    if (value === null || value === undefined) return true;
    return String(value).trim().toLowerCase() === 'null';
}

function normalizeExportCellValue(value) {
    if (isBlankNullValue(value)) return '';
    var text = String(value);
    if (text.indexOf('<') >= 0) {
        var $tmp = $('<div/>').html(text);
        text = $tmp.text();
    }
    return text.trim();
}

function buildOrderLoadExportSheetRows(rows, columns) {
    var sheetRows = rows.map(function (row) {
        var out = {};
        columns.forEach(function (col) {
            var raw = normalizeExportCellValue(row[col]);
            if (G_OL_DateColumns.indexOf(col) >= 0) {
                raw = isoDateToDisplay(raw);
            }
            out[col] = raw;
        });
        return out;
    });

    var totalCols = window['totalColumns_OrderLoadReport-body'] || [];
    if (totalCols.length) {
        var totalRow = {};
        columns.forEach(function (col, idx) {
            if (idx === 0) {
                totalRow[col] = 'Grand Total';
                return;
            }
            if (totalCols.indexOf(col) >= 0) {
                var sum = 0;
                rows.forEach(function (row) {
                    var n = parseFloat(normalizeExportCellValue(row[col]).replace(/,/g, ''));
                    if (!isNaN(n)) sum += n;
                });
                totalRow[col] = sum;
            } else {
                totalRow[col] = '';
            }
        });
        sheetRows.push(totalRow);
    }

    return sheetRows;
}

function getOrderLoadExportFileName(ext) {
    var tpl = getSelectedTemplate();
    var name = String(tpl.desp || 'OrderLoadReport').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    var stamp = new Date().toISOString().slice(0, 10);
    return name + '_' + stamp + '.' + ext;
}

function exportOrderLoadExcel() {
    if (!canExportOrderLoadGrid()) {
        toastr.warning('Please load the report first.');
        return;
    }
    if (typeof XLSX === 'undefined') {
        toastr.error('Excel export library not loaded.');
        return;
    }

    var rows = getOrderLoadExportRows();
    var columns = getOrderLoadExportColumns(rows);
    var sheetRows = buildOrderLoadExportSheetRows(rows, columns);
    var ws = XLSX.utils.json_to_sheet(sheetRows, { header: columns });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, getOrderLoadExportFileName('xlsx'));
}

function buildPrintColumnDefs(transactionRows, sampleRow) {
    if (!sampleRow) return [];

    var gridKeys = Object.keys(sampleRow);
    var defs = [];

    (transactionRows || []).forEach(function (row) {
        if (!isFlagY(prop(row, ['ShowInPrint', 'showInPrint']))) return;

        var fieldName = prop(row, ['FieldName', 'fieldName']);
        var fieldNameAs = prop(row, ['FieldNameAs', 'fieldNameAs']);
        var gridKey = resolveGridColumnKey(gridKeys, fieldName, fieldNameAs);
        if (!gridKey) return;

        var dataType = String(prop(row, ['DataType', 'dataType']) || '').toUpperCase();
        defs.push({
            key: gridKey,
            label: getPrintLabelForColumn(gridKey, fieldNameAs, fieldName),
            sortOrder: parseFloat(prop(row, ['SortOrder', 'sortOrder'])) || 0,
            isNumeric: dataType === 'N' || G_OL_NumericColumns.indexOf(gridKey) >= 0,
            widthClass: getPrintWidthClass(gridKey, fieldNameAs, fieldName, dataType)
        });
    });

    defs.sort(function (a, b) {
        return a.sortOrder - b.sortOrder;
    });

    if (defs.length) return defs;

    return gridKeys.map(function (key, index) {
        return {
            key: key,
            label: getPrintLabelForColumn(key, key, key),
            sortOrder: index,
            isNumeric: G_OL_NumericColumns.indexOf(key) >= 0,
            widthClass: getPrintWidthClass(key, key, key, G_OL_NumericColumns.indexOf(key) >= 0 ? 'N' : 'S')
        };
    });
}

function getOrderLoadGridHeaderLabels() {
    var map = {};
    $('#OrderLoadReport thead th').each(function () {
        var name = $(this).find('.filter-table-heading').first().text().trim();
        if (name) {
            map[normalizeColumnKey(name)] = name;
        }
    });
    return map;
}

function getPrintLabelForColumn(gridKey, fieldNameAs, fieldName) {
    var headerLabels = getOrderLoadGridHeaderLabels();
    var normalizedKey = normalizeColumnKey(gridKey);
    if (headerLabels[normalizedKey]) {
        return headerLabels[normalizedKey];
    }

    var fromDisplay = fieldNameToLabel(fieldNameAs, '');
    if (fromDisplay) return fromDisplay;

    var fromField = fieldNameToLabel(fieldName, '');
    if (fromField) return fromField;

    return fieldNameToLabel(gridKey, gridKey);
}

function getPrintWidthClass(gridKey, fieldNameAs, fieldName, dataType) {
    if (String(dataType || '').toUpperCase() === 'N' || G_OL_NumericColumns.indexOf(gridKey) >= 0) {
        return 'col-num';
    }

    var label = normalizeColumnKey(
        getPrintLabelForColumn(gridKey, fieldNameAs, fieldName)
    );

    if (/size\s*des|sizedes|size\s*desp|sizedesp|size\s*deep|sizedeep|size\s*drop|particular|itemdesc|item\s*desc|description|typedesp|type\s*desp/.test(label)) {
        return 'col-desc';
    }
    if (/party|consignee|itemname|item name|remark|address|desc|finish|metal|gloss|matt|matte|clear|grade|lam|coat|rm |sheet|item type/.test(label)) {
        return 'col-wide';
    }
    if (/date|orderno|order no|buyer|serial|priority|marketing|saletype|sub sale|process|warehouse|status/.test(label)) {
        return 'col-medium';
    }
    return 'col-text';
}

function normalizeFieldToken(value) {
    return normalizeColumnKey(normalizeFieldName(value));
}

function resolveGridColumnKey(gridKeys, fieldName, fieldNameAs) {
    var candidates = [fieldNameAs, fieldName, normalizeFieldName(fieldNameAs), normalizeFieldName(fieldName)].filter(function (v) {
        return v !== null && v !== undefined && String(v).trim() !== '';
    });

    var i;
    for (i = 0; i < candidates.length; i++) {
        if (gridKeys.indexOf(candidates[i]) >= 0) return candidates[i];
    }

    var normalizedCandidates = candidates.map(normalizeFieldToken);
    for (i = 0; i < gridKeys.length; i++) {
        var gridKey = gridKeys[i];
        var normalizedGridKey = normalizeFieldToken(gridKey);
        if (normalizedCandidates.indexOf(normalizedGridKey) >= 0) return gridKey;

        var compactGrid = normalizedGridKey.replace(/\s+/g, '');
        if (normalizedCandidates.some(function (c) {
            return c.replace(/\s+/g, '') === compactGrid;
        })) {
            return gridKey;
        }
    }

    return null;
}

function pickCompanyPreviewField(companyInfo, names) {
    var info = companyInfo;
    if (Array.isArray(info)) info = info[0] || {};
    if (!info || typeof info !== 'object') return '';

    for (var i = 0; i < names.length; i++) {
        var val = info[names[i]];
        if (val !== null && val !== undefined && String(val).trim() !== '') {
            return String(val).trim();
        }
    }
    return '';
}

function formatPrintDate(iso) {
    if (!iso) return '';
    var parts = String(iso).split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function isOrderLoadNoBreakColumn(nameOrKey) {
    var label = normalizeColumnKey(nameOrKey || '');
    if (!label) return false;
    return /size\s*des|sizedes|size\s*desp|sizedesp|size\s*deep|sizedeep|size\s*drop|particular/.test(label);
}

function isOrderLoadWrapTextColumn(nameOrKey) {
    var label = normalizeColumnKey(nameOrKey || '');
    if (!label || isOrderLoadNoBreakColumn(label)) return false;

    return /itemdesc|item\s*desc|description|typedesp|type\s*desp|remark|finish|metal|gloss|matt|matte|grade|lam|coat|rm\s|sheet|consignee|partyname|party name|itemname|item name|address/.test(label);
}

function isOrderLoadWideWrapColumn(nameOrKey) {
    var label = normalizeColumnKey(nameOrKey || '');
    return /consignee|party|itemname|item name|particular|address|remark/.test(label);
}

function shouldOrderLoadBreakText(text, colNameOrDef) {
    if (!text) return false;

    var colName = typeof colNameOrDef === 'string'
        ? colNameOrDef
        : (colNameOrDef && (colNameOrDef.label || colNameOrDef.key)) || '';

    if (isOrderLoadNoBreakColumn(colName)) return false;
    if (isOrderLoadWrapTextColumn(colName)) return true;
    return text.length > 28 && /\s\/\s/.test(text);
}

function formatOrderLoadWrapTextHtml(text, colNameOrDef, innerClass, breakClass) {
    innerClass = innerClass || 'ol-wrap-cell-inner';
    breakClass = breakClass || 'ol-wrap-cell-break';
    text = String(text || '').trim();
    if (!text) return '';

    if (!shouldOrderLoadBreakText(text, colNameOrDef)) {
        return '<span class="' + innerClass + '">' + escapeHtml(text) + '</span>';
    }

    var parts = text.split(/\s*\/\s*/).filter(function (part) {
        return String(part || '').trim() !== '';
    });

    if (parts.length > 1) {
        var html = parts.map(function (part, index) {
            var line = escapeHtml(String(part).trim());
            return index < parts.length - 1 ? line + ' /' : line;
        }).join('<br />');
        return '<span class="' + innerClass + ' ' + breakClass + '">' + html + '</span>';
    }

    return '<span class="' + innerClass + '">' + escapeHtml(text).replace(/(\s+)/g, '<wbr>$1') + '</span>';
}

function isPrintWrapBreakColumn(colDef) {
    if (!colDef || colDef.isNumeric) return false;

    return isOrderLoadWrapTextColumn(colDef.label || '') ||
        isOrderLoadWrapTextColumn(colDef.key || '');
}

function shouldPrintBreakText(text, colDef) {
    return shouldOrderLoadBreakText(text, colDef);
}

function formatPrintCellHtml(value, colDef) {
    var text = formatOrderLoadPrintCellValue(value, colDef);
    if (!text) return '';

    return formatOrderLoadWrapTextHtml(
        text,
        colDef,
        'ol-print-cell-inner',
        'ol-print-cell-break'
    );
}

function getPrintCellCssClass(col) {
    if (col.isNumeric) {
        return 'num ' + (col.widthClass || 'col-num');
    }
    if (isPrintWrapBreakColumn(col)) {
        return 'txt wrap wrap-desc ' + (col.widthClass || 'col-desc');
    }
    return 'txt wrap ' + (col.widthClass || 'col-text');
}

function getPrintColumnLayoutWeight(col) {
    var weight = getPrintColumnWidthPx(col);
    if (isPrintWrapBreakColumn(col)) {
        return Math.max(weight, 115);
    }
    return weight;
}

function formatOrderLoadPrintCellValue(value, colDef) {
    var text = normalizeExportCellValue(value);
    if (text === '') return '';

    if (G_OL_DateColumns.indexOf(colDef.key) >= 0) {
        return formatPrintDate(isoDateToDisplay(text));
    }

    if (colDef.isNumeric) {
        var num = parseFloat(String(text).replace(/,/g, ''));
        if (!isNaN(num)) return num.toLocaleString('en-IN', { maximumFractionDigits: 3 });
    }

    return text;
}

function enrichPrintColumnWidths(columnDefs, rows) {
    var sampleRows = (rows || []).slice(0, Math.min(rows.length, 60));

    return (columnDefs || []).map(function (col) {
        if (col.isNumeric) return col;

        if (isPrintWrapBreakColumn(col)) {
            return Object.assign({}, col, { widthClass: 'col-desc', wrapBreak: true });
        }

        var maxLen = String(col.label || '').length;
        sampleRows.forEach(function (row) {
            var val = formatOrderLoadPrintCellValue(row[col.key], col);
            if (val.length > maxLen) maxLen = val.length;
        });

        var widthClass = col.widthClass || 'col-text';
        if (maxLen > 42) {
            widthClass = 'col-xwide';
        } else if (maxLen > 24) {
            widthClass = 'col-wide';
        } else if (maxLen > 14) {
            widthClass = 'col-medium';
        }

        return Object.assign({}, col, { widthClass: widthClass });
    });
}

function appendPrintGrandTotalRow(rows, columnDefs) {
    var totalCols = window['totalColumns_OrderLoadReport-body'] || [];
    if (!totalCols.length || !rows.length || !columnDefs.length) {
        return rows;
    }

    var totalRow = {};
    columnDefs.forEach(function (col, idx) {
        if (idx === 0) {
            totalRow[col.key] = 'Grand Total';
            return;
        }
        if (totalCols.indexOf(col.key) >= 0 && col.isNumeric) {
            var sum = 0;
            rows.forEach(function (row) {
                var n = parseFloat(normalizeExportCellValue(row[col.key]).replace(/,/g, ''));
                if (!isNaN(n)) sum += n;
            });
            totalRow[col.key] = sum;
        } else {
            totalRow[col.key] = '';
        }
    });

    return rows.concat([totalRow]);
}

function isPrintTotalRow(row, columnDefs) {
    var firstCol = columnDefs[0];
    if (!firstCol || !row) return false;
    var val = normalizeExportCellValue(row[firstCol.key]);
    return /^(grand\s*)?total$/i.test(val);
}

function getPrintColumnWidthPx(col) {
    var widths = {
        'col-sr': 28,
        'col-num': 48,
        'col-text': 64,
        'col-medium': 80,
        'col-desc': 115,
        'col-wide': 110,
        'col-xwide': 140
    };
    return widths[col.widthClass] || widths['col-text'];
}

function getPrintMaxColumnsPerPage(pageCols) {
    var wideCount = (pageCols || []).filter(function (col) {
        return col.widthClass === 'col-wide' || col.widthClass === 'col-xwide';
    }).length;
    if (wideCount >= 2) return 6;
    if (wideCount === 1) return 7;
    return 9;
}

function splitPrintColumnsIntoPages(columnDefs, pageWidthPx) {
    var maxWidth = pageWidthPx || 900;
    var srWidth = getPrintColumnWidthPx({ widthClass: 'col-sr' });
    var pages = [];
    var current = [];
    var usedWidth = srWidth;

    (columnDefs || []).forEach(function (col) {
        var colWidth = getPrintColumnWidthPx(col);
        var maxCols = getPrintMaxColumnsPerPage(current);
        var wouldExceedWidth = current.length && (usedWidth + colWidth > maxWidth);
        var wouldExceedCount = current.length >= maxCols;

        if (current.length && (wouldExceedWidth || wouldExceedCount)) {
            pages.push(current);
            current = [];
            usedWidth = srWidth;
        }

        current.push(col);
        usedWidth += colWidth;
    });

    if (current.length) {
        pages.push(current);
    }

    return pages.length ? pages : [[]];
}

function buildPrintColgroup(columnDefs) {
    var srWeight = getPrintColumnWidthPx({ widthClass: 'col-sr' });
    var weights = columnDefs.map(getPrintColumnLayoutWeight);
    var totalWeight = srWeight + weights.reduce(function (sum, w) {
        return sum + w;
    }, 0);

    var html = '<col style="width:' + ((srWeight / totalWeight) * 100).toFixed(3) + '%" />';
    columnDefs.forEach(function (col, index) {
        html += '<col style="width:' + ((weights[index] / totalWeight) * 100).toFixed(3) + '%" />';
    });
    return html;
}

function buildPrintTableSection(rows, columnDefs) {
    var colgroup = '<colgroup>' + buildPrintColgroup(columnDefs) + '</colgroup>';

    var headCells = columnDefs.map(function (col) {
        return '<th class="' + getPrintCellCssClass(col) + '">' + escapeHtml(col.label) + '</th>';
    }).join('');

    var bodyHtml = (rows || []).map(function (row, index) {
        var isTotal = isPrintTotalRow(row, columnDefs);
        var cells = columnDefs.map(function (col) {
            return '<td class="' + getPrintCellCssClass(col) + '">' + formatPrintCellHtml(row[col.key], col) + '</td>';
        }).join('');
        var rowClass = isTotal ? ' class="ol-print-total-row"' : '';
        return '<tr' + rowClass + '><td class="num sr">' + (isTotal ? '' : (index + 1)) + '</td>' + cells + '</tr>';
    }).join('');

    return '<div class="ol-print-table-wrap"><table class="ol-print-table">' + colgroup +
        '<thead><tr><th class="sr">#</th>' + headCells + '</tr></thead><tbody>' +
        bodyHtml + '</tbody></table></div>';
}

function buildPrintPageHeaderHtml(companyName, companyAddress, title, fromText, toText, pageNote) {
    return '<div class="ol-print-header">' +
        '<p class="ol-print-company">' + (companyName || '&nbsp;') + '</p>' +
        '<p class="ol-print-address">' + (companyAddress || '&nbsp;') + '</p>' +
        '<p class="ol-print-title">' + title +
        (fromText && toText ? ' From ' + fromText + ' To ' + toText : '') + '</p>' +
        (pageNote ? '<p class="ol-print-page-note">' + escapeHtml(pageNote) + '</p>' : '') +
        '</div>';
}

function getOrderLoadPrintStyles() {
    return '' +
        '@page { size: A4 landscape; margin: 8mm 6mm; }' +
        '* { box-sizing: border-box; }' +
        'html, body { margin: 0; padding: 0; background: #d1d5db; font-family: Arial, Helvetica, sans-serif; font-size: 7pt; color: #000; overflow-x: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
        'body { padding: 6mm 0; }' +
        '.ol-print-page { width: 277mm; max-width: 100%; min-height: 190mm; margin: 0 auto 10mm; background: #fff; padding: 5mm 6mm; box-shadow: 0 4px 24px rgba(15,23,42,.18); page-break-after: always; break-after: page; overflow-x: hidden; overflow-y: visible; }' +
        '.ol-print-page:last-child { page-break-after: auto; break-after: auto; margin-bottom: 0; }' +
        '.ol-print-header { text-align: center; margin-bottom: 5px; line-height: 1.35; }' +
        '.ol-print-company { font-size: 11pt; font-weight: 700; margin: 0 0 2px; text-transform: uppercase; }' +
        '.ol-print-address { font-size: 7pt; margin: 0 0 4px; line-height: 1.25; }' +
        '.ol-print-title { font-size: 8pt; font-weight: 700; margin: 0; }' +
        '.ol-print-page-note { font-size: 7pt; font-weight: 600; color: #475569; margin: 4px 0 0; }' +
        '.ol-print-table-wrap { width: 100%; max-width: 100%; overflow: visible; }' +
        '.ol-print-table { width: 100%; max-width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 6.5pt; }' +
        '.ol-print-table th, .ol-print-table td { border: 1px solid #555; padding: 2px 3px; vertical-align: top; line-height: 1.2; }' +
        '.ol-print-table thead th { background: #eef2ff !important; color: #1e3a8a !important; font-weight: 700; text-align: center; white-space: normal !important; word-wrap: break-word; overflow-wrap: anywhere; writing-mode: horizontal-tb !important; text-orientation: mixed !important; transform: none !important; font-size: 6.5pt; }' +
        '.ol-print-table tbody td { font-size: 6.5pt; }' +
        '.ol-print-table td.num, .ol-print-table th.num { text-align: right; white-space: nowrap; overflow: visible; max-width: none; }' +
        '.ol-print-table td.txt, .ol-print-table th.txt { text-align: left; }' +
        '.ol-print-table td.wrap, .ol-print-table th.wrap { white-space: normal !important; word-wrap: break-word; overflow-wrap: anywhere; word-break: break-word; overflow: hidden; text-overflow: clip; max-width: 0; }' +
        '.ol-print-table td.wrap-desc, .ol-print-table th.wrap-desc { white-space: normal !important; word-wrap: break-word; overflow-wrap: anywhere; word-break: break-word; line-height: 1.3; vertical-align: top; overflow: hidden; max-width: 0; }' +
        '.ol-print-cell-inner { display: block; width: 100%; white-space: normal !important; word-wrap: break-word; overflow-wrap: anywhere; word-break: break-word; }' +
        '.ol-print-cell-inner.ol-print-cell-break { line-height: 1.3; }' +
        '.ol-print-table td.sr, .ol-print-table th.sr { text-align: center; white-space: nowrap; overflow: visible; max-width: none; }' +
        '.ol-print-table tr.ol-print-total-row td { background: #f1f5f9; font-weight: 700; }' +
        '@media print {' +
        'html, body { background: #fff; padding: 0; }' +
        '.ol-print-page { box-shadow: none; width: auto; max-width: none; padding: 0; margin: 0; page-break-after: always; break-after: page; overflow: visible; }' +
        '.ol-print-page:last-child { page-break-after: auto; break-after: auto; }' +
        '.ol-print-table { font-size: 6pt; }' +
        '.ol-print-table thead th { font-size: 6pt; }' +
        '.ol-print-table tbody td { font-size: 6pt; }' +
        '}';
}

function buildOrderLoadPrintPreviewHtml(companyInfo, rows, columnDefs, reportTitle, fromLabel, toLabel) {
    var companyName = escapeHtml(pickCompanyPreviewField(companyInfo, ['CompanyName', 'companyName', 'CompanyNameForShow', 'companyNameForShow']));
    var companyAddress = escapeHtml(pickCompanyPreviewField(companyInfo, ['OfficeAddress1', 'officeAddress1', 'OfficeAddress', 'CompanyAddress', 'companyAddress', 'Address']));
    var title = escapeHtml(reportTitle || 'Order Load Report');
    var fromText = escapeHtml(fromLabel || '');
    var toText = escapeHtml(toLabel || '');

    var columnPages = splitPrintColumnsIntoPages(columnDefs);
    var totalPages = columnPages.length;

    var pagesHtml = columnPages.map(function (pageCols, pageIndex) {
        var pageNote = totalPages > 1
            ? 'Columns Page ' + (pageIndex + 1) + ' of ' + totalPages
            : '';
        return '<div class="ol-print-page">' +
            buildPrintPageHeaderHtml(companyName, companyAddress, title, fromText, toText, pageNote) +
            buildPrintTableSection(rows, pageCols) +
            '</div>';
    }).join('');

    return '<!DOCTYPE html><html><head><meta charset="utf-8" />' +
        '<meta name="viewport" content="width=device-width, initial-scale=1" />' +
        '<title>' + title + '</title><style>' + getOrderLoadPrintStyles() + '</style></head><body>' +
        pagesHtml + '</body></html>';
}

function openOrderLoadPrintPreviewHtml(html) {
    if (showOrderLoadPreviewModal(html)) {
        return true;
    }

    var blobUrl = '';
    try {
        var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        blobUrl = URL.createObjectURL(blob);
        var previewWin = window.open(blobUrl, '_blank');
        if (previewWin) {
            previewWin.onload = function () {
                try {
                    previewWin.focus();
                } catch (e) { /* ignore */ }
            };
            setTimeout(function () {
                URL.revokeObjectURL(blobUrl);
            }, 120000);
            return true;
        }
    } catch (err) {
        console.error('Order load print preview failed:', err);
    }

    if (blobUrl) URL.revokeObjectURL(blobUrl);
    return false;
}

function showOrderLoadPreviewModal(html) {
    var modal = document.getElementById('olPrintPreviewModal');
    var frame = document.getElementById('olPrintPreviewFrame');
    if (!modal || !frame) return false;

    G_OL_PrintPreviewHtml = html || '';
    frame.srcdoc = G_OL_PrintPreviewHtml;
    modal.classList.remove('is-hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ol-print-preview-open');
    return true;
}

function closeOrderLoadPreviewModal() {
    var modal = document.getElementById('olPrintPreviewModal');
    var frame = document.getElementById('olPrintPreviewFrame');
    if (!modal) return;

    modal.classList.add('is-hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ol-print-preview-open');
    G_OL_PrintPreviewHtml = '';
    if (frame) frame.srcdoc = '';
}

function printOrderLoadPreviewModal(targetFrame) {
    var frame = targetFrame || document.getElementById('olPrintPreviewFrame');
    if (!frame || !frame.contentWindow) return false;

    try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
        return true;
    } catch (err) {
        console.error('Order load print failed:', err);
        return false;
    }
}

function initOrderLoadPreviewModal() {
    var btnClose = document.getElementById('btnOlPreviewClose');
    var btnPrint = document.getElementById('btnOlPreviewPrint');
    var backdrop = document.getElementById('olPrintPreviewBackdrop');

    if (btnClose && !btnClose._olPreviewBound) {
        btnClose._olPreviewBound = true;
        btnClose.addEventListener('click', closeOrderLoadPreviewModal);
    }
    if (btnPrint && !btnPrint._olPreviewBound) {
        btnPrint._olPreviewBound = true;
        btnPrint.addEventListener('click', printOrderLoadPreviewModal);
    }
    if (backdrop && !backdrop._olPreviewBound) {
        backdrop._olPreviewBound = true;
        backdrop.addEventListener('click', closeOrderLoadPreviewModal);
    }
    if (!document._olPreviewEscBound) {
        document._olPreviewEscBound = true;
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeOrderLoadPreviewModal();
            }
        });
    }
}

function buildOrderLoadPrintColumnDefs(rows) {
    return (G_OL_PrintColumnDefs.length
        ? G_OL_PrintColumnDefs.slice()
        : buildPrintColumnDefs(G_OL_TemplateTransactions, rows[0])
    ).map(function (col) {
        return {
            key: col.key,
            label: getPrintLabelForColumn(col.key, col.label, col.key),
            sortOrder: col.sortOrder,
            isNumeric: col.isNumeric,
            widthClass: col.widthClass || getPrintWidthClass(col.key, col.label, col.key, col.isNumeric ? 'N' : 'S')
        };
    });
}

function prepareOrderLoadPrintHtml(onReady) {
    if (!canExportOrderLoadGrid()) {
        toastr.warning('Please load the report first.');
        return;
    }

    var baseRows = getOrderLoadExportRows();
    var columnDefs = enrichPrintColumnWidths(buildOrderLoadPrintColumnDefs(baseRows), baseRows);
    var rows = appendPrintGrandTotalRow(baseRows, columnDefs);

    if (!columnDefs.length) {
        toastr.warning('No print columns configured.');
        return;
    }

    var tpl = getSelectedTemplate();
    var reportTitle = String((tpl && tpl.desp) || 'Order Load Report').trim();
    var fromLabel = formatPrintDate($('#txtFromDate').val() || '');
    var toLabel = formatPrintDate($('#txtToDate').val() || '');

    var finish = function (companyInfo) {
        var html = buildOrderLoadPrintPreviewHtml(companyInfo, rows, columnDefs, reportTitle, fromLabel, toLabel);
        if (typeof onReady === 'function') onReady(html);
    };

    OrderLoadReportService.GetCompanylist()
        .then(function (res) {
            finish(unwrapApiList(res)[0] || res || {});
        })
        .catch(function () {
            finish({});
        });
}

function openOrderLoadPrintPreview() {
    prepareOrderLoadPrintHtml(function (html) {
        if (!openOrderLoadPrintPreviewHtml(html)) {
            toastr.error('Could not open preview.');
        }
    });
}

function openOrderLoadCrystalReport(isPrint) {
    var tpl = getSelectedTemplate();
    if (!usesOrderLoadCrystalReport(tpl)) {
        return Promise.resolve(false);
    }

    var params = buildOrderLoadReportRequestParams(tpl);
    if (params.error) {
        toastr.warning(params.error);
        return Promise.resolve(false);
    }

    var reportFileName = getOrderLoadCrystalReportFileName(tpl);
    if (!reportFileName) {
        toastr.warning('Crystal report file is not configured for this template.');
        return Promise.resolve(false);
    }

    if (typeof ShowLoader === 'function') ShowLoader();

    return OrderLoadReportService.PrintTemplateReport({
        isPrint: !!isPrint,
        reportFileName: reportFileName,
        procedureParametersAndValues: buildOrderLoadPrintProcedureParameters(tpl, params, reportFileName)
    })
        .then(function (response) {
            if (!openOrderLoadCrystalReportUrl(response)) {
                var msg = extractOrderLoadReportErrorMessage(response) || 'Crystal report could not be opened.';
                toastr.error(formatOrderLoadReportErrorMessage(msg, tpl));
                return false;
            }
            return true;
        })
        .catch(function (err) {
            var rawMsg = extractOrderLoadReportErrorMessage(null, err) || 'Crystal report request failed.';
            toastr.error(formatOrderLoadReportErrorMessage(rawMsg, tpl));
            return false;
        })
        .finally(function () {
            if (typeof HideLoader === 'function') HideLoader();
        });
}

function onOrderLoadPreviewClick() {
    var tpl = getSelectedTemplate();
    if (usesOrderLoadCrystalReport(tpl)) {
        openOrderLoadCrystalReport(false);
        return;
    }
    openOrderLoadPrintPreview();
}

function onOrderLoadPrintClick() {
    var tpl = getSelectedTemplate();
    if (usesOrderLoadCrystalReport(tpl)) {
        openOrderLoadCrystalReport(true);
        return;
    }
    printOrderLoadReport();
}

function printOrderLoadReport() {
    prepareOrderLoadPrintHtml(function (html) {
        var frame = document.getElementById('olPrintHiddenFrame') || document.getElementById('olPrintPreviewFrame');
        if (!frame) {
            if (!openOrderLoadPrintPreviewHtml(html)) {
                toastr.error('Could not open print preview.');
            }
            return;
        }

        G_OL_PrintPreviewHtml = html;
        frame.srcdoc = html;
        setTimeout(function () {
            if (!printOrderLoadPreviewModal(frame)) {
                toastr.error('Print could not be started.');
            }
        }, 800);
    });
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getOrderLoadColumnIndexMap() {
    var colMap = {};

    $('#OrderLoadReport thead th').each(function (i) {
        var name = $(this).find('.filter-table-heading').first().text().trim();
        if (!name) {
            name = $(this).clone().children().remove().end().text().trim();
        }
        if (name) {
            colMap[name] = i;
        }
    });

    return colMap;
}

function applyGridColumnAlignment() {
    var $table = $('#OrderLoadReport');
    if (!$table.length) return;

    var colMap = getOrderLoadColumnIndexMap();
    var numericSet = {};
    G_OL_NumericColumns.forEach(function (col) {
        numericSet[col] = true;
    });

    Object.keys(colMap).forEach(function (colName) {
        var idx = colMap[colName];
        var align = numericSet[colName] ? 'right' : 'left';
        var alignClass = numericSet[colName] ? 'ol-align-right' : 'ol-align-left';
        var $th = $table.find('thead th').eq(idx);

        $th.removeClass('ol-align-right ol-align-left')
            .addClass(alignClass)
            .css('text-align', align);

        $table.find('tbody tr').each(function () {
            $(this).find('td').eq(idx)
                .removeClass('ol-align-right ol-align-left')
                .addClass(alignClass)
                .css('text-align', align);
        });
    });
}

function applyGridWrapColumns() {
    var $table = $('#OrderLoadReport');
    if (!$table.length) return;

    var wrapColumns = [];
    $table.find('thead th').each(function (i) {
        var name = $(this).find('.filter-table-heading').first().text().trim();
        if (!name) return;

        if (isOrderLoadNoBreakColumn(name)) {
            $(this).addClass('ol-col-no-break');
            $table.find('tbody tr').each(function () {
                $(this).find('td').eq(i).addClass('ol-col-no-break');
            });
            return;
        }

        if (!isOrderLoadWrapTextColumn(name)) return;

        var wrapClass = 'ol-col-wrap' + (isOrderLoadWideWrapColumn(name) ? ' ol-col-wrap-wide' : '');
        $(this).addClass(wrapClass);
        wrapColumns.push({ index: i, name: name, wrapClass: wrapClass });
    });

    if (!wrapColumns.length) return;

    $table.find('tbody tr').each(function () {
        var $row = $(this);
        var isTotalRow = $row.hasClass('total-row') || $row.hasClass('grand-total-row');

        wrapColumns.forEach(function (col) {
            var $cell = $row.find('td').eq(col.index);
            if (!$cell.length || $cell.hasClass('ol-col-no-break')) return;

            $cell.addClass(col.wrapClass);
            if (isTotalRow) return;

            var text = ($cell.text() || '').trim();
            if (!text) return;

            $cell.html(formatOrderLoadWrapTextHtml(
                text,
                col.name,
                'ol-grid-cell-inner',
                'ol-grid-cell-break'
            ));
        });
    });
}

function getGridHeaderColumnName($th) {
    var name = $th.find('.filter-table-heading').first().text().trim();
    if (!name) {
        name = $th.clone().children().remove().end().text().trim();
    }
    return name;
}

function findFreezeColumnIndex($table, freezeLabel) {
    if (!freezeLabel) return -1;

    var target = normalizeColumnKey(freezeLabel);
    if (!target) return -1;

    var exact = -1;
    var partial = -1;
    var compactTarget = target.replace(/\s+/g, '');

    $table.find('thead tr').first().find('th').each(function (i) {
        var key = normalizeColumnKey(getGridHeaderColumnName($(this)));
        if (!key) return;

        if (key === target) {
            exact = i;
            return false;
        }

        var compactKey = key.replace(/\s+/g, '');
        if (partial < 0 && (key.indexOf(target) >= 0 || target.indexOf(key) >= 0 || compactKey.indexOf(compactTarget) >= 0)) {
            partial = i;
        }
    });

    return exact >= 0 ? exact : partial;
}

function clearGridFreezeColumns() {
    var $table = $('#OrderLoadReport');
    $table.find('th, td').removeClass('ol-col-frozen ol-col-frozen-last').each(function () {
        this.style.position = '';
        this.style.left = '';
        this.style.top = '';
        this.style.zIndex = '';
    });
}

function getColumnStickyLeft($headers, colIndex) {
    if (colIndex <= 0) return 0;

    var left = 0;
    var i;

    for (i = 0; i < colIndex; i++) {
        var width = $headers.eq(i).outerWidth() || 0;
        if (!width) break;
        left += width;
    }

    if (left > 0) return left;

    var cell = $headers.eq(colIndex)[0];
    if (!cell) return 0;

    var row = cell.parentElement;
    if (row && row.cells && row.cells[colIndex]) {
        return row.cells[colIndex].offsetLeft || 0;
    }

    return cell.offsetLeft || 0;
}

function applyGridFreezeColumns() {
    var $table = $('#OrderLoadReport');
    if (!$table.length) return;

    clearGridFreezeColumns();

    var freezeLabel = String(G_OL_FreezeColumnLabel || '').trim();
    var $wrapper = $table.closest('.ol-table-wrapper');
    $wrapper.toggleClass('ol-has-frozen-cols', !!freezeLabel);

    if (!freezeLabel) return;

    var freezeIndex = findFreezeColumnIndex($table, freezeLabel);
    if (freezeIndex < 0) return;

    var $headers = $table.find('thead tr').first().find('th');

    for (var col = 0; col <= freezeIndex; col++) {
        var isLastFrozen = col === freezeIndex;
        var left = getColumnStickyLeft($headers, col);

        $table.find('thead tr').each(function () {
            var $cell = $(this).find('th').eq(col);
            $cell.addClass('ol-col-frozen').css({
                position: 'sticky',
                left: left + 'px',
                top: '0',
                zIndex: isLastFrozen ? 23 : 22
            });
            if (isLastFrozen) $cell.addClass('ol-col-frozen-last');
        });

        $table.find('tbody tr').each(function () {
            var $cell = $(this).find('td').eq(col);
            $cell.addClass('ol-col-frozen').css({
                position: 'sticky',
                left: left + 'px',
                zIndex: isLastFrozen ? 7 : 6
            });
            if (isLastFrozen) $cell.addClass('ol-col-frozen-last');
        });
    }
}

function scheduleGridLayoutRefresh() {
    clearTimeout(window._olGridLayoutTimer);
    window._olGridLayoutTimer = setTimeout(function () {
        applyGridFreezeColumns();
    }, 120);
}

function initOrderLoadGridLayoutHooks() {
    if (window._olGridLayoutHooksInstalled) return;
    window._olGridLayoutHooksInstalled = true;

    $(window).on('resize.olGridLayout', scheduleGridLayoutRefresh);

    $(document).on('scroll', '.ol-table-wrapper', scheduleGridLayoutRefresh);

    if (window.ResizeObserver) {
        var $wrapper = $('.ol-table-wrapper');
        if ($wrapper.length) {
            var ro = new ResizeObserver(function () {
                scheduleGridLayoutRefresh();
            });
            ro.observe($wrapper[0]);
        }
    }
}

function applyGridCellEnhancements() {
    var $table = $('#OrderLoadReport');
    var colMap = {};

    $table.find('thead th').each(function (i) {
        var name = $(this).find('.filter-table-heading').first().text().trim();
        if (name) {
            colMap[name.toLowerCase()] = i;
        }
    });

    $table.find('tbody tr:not(.total-row):not(.grand-total-row)').each(function () {
        var $cells = $(this).find('td');

        applyColumnClass($cells, colMap, 'order no', 'ol-col-order-no');
        applyColumnClass($cells, colMap, 'order date', 'ol-col-date');
        applyColumnClass($cells, colMap, 'delivery date', 'ol-col-date');

        applyStatusBadge($cells, colMap, 'order status');
        applyStatusBadge($cells, colMap, 'production status');
    });

    applyGridWrapColumns();
    applyGridColumnAlignment();
    applyGridFreezeColumns();
    scheduleGridLayoutRefresh();
}

function applyColumnClass($cells, colMap, colName, cssClass) {
    if (colMap[colName] === undefined) return;
    $cells.eq(colMap[colName]).addClass(cssClass);
}

function applyStatusBadge($cells, colMap, colName) {
    if (colMap[colName] === undefined) return;

    var $cell = $cells.eq(colMap[colName]);
    var text = ($cell.text() || '').trim();

    if (!text) {
        $cell.html('<span class="ol-empty-cell">&mdash;</span>');
        return;
    }

    var lower = text.toLowerCase();
    var statusClass = 'ol-status--neutral';

    if (/cancel|reject|hold/i.test(lower)) {
        statusClass = 'ol-status--cancel';
    } else if (/partial/i.test(lower)) {
        statusClass = 'ol-status--partial';
    } else if (/complete|dispatch|deliver|closed|done/i.test(lower)) {
        statusClass = 'ol-status--complete';
    } else if (/pending|open|new/i.test(lower)) {
        statusClass = 'ol-status--pending';
    }

    $cell.html('<span class="ol-status-badge ' + statusClass + '">' + escapeHtml(text) + '</span>');
}

function buildGridConfig(rows) {
    var cols = Object.keys(rows[0]);
    var StringFilterColumn = [];
    var NumericFilterColumn = [];
    var DateFilterColumn = [];
    var hiddenColumns = [];
    var ColumnAlignment = {};
    var totalColumns = [];

    cols.forEach(function (col) {
        if (normalizeGridColumnKey(col) === 'itemmastercode') {
            hiddenColumns.push(col);
            return;
        }
        var sample = rows.slice(0, Math.min(rows.length, 25)).map(function (r) { return r[col]; });

        if (isDateColumn(col, sample)) {
            DateFilterColumn.push(col);
            ColumnAlignment[col] = 'left';
        } else if (isNumericColumn(col, sample)) {
            NumericFilterColumn.push(col);
            ColumnAlignment[col] = 'right';
            // Total / Grand Total only when template ShowTotal = 'Y'
            if (isShowTotalColumn(col)) {
                totalColumns.push(col);
            }
        } else {
            StringFilterColumn.push(col);
            ColumnAlignment[col] = 'left';
        }
    });

    // Template meta loaded → honour ShowTotal (even if none = no totals).
    // Meta failed to load → keep old behaviour (sum all numeric cols).
    if (!G_OL_ShowTotalLoaded) {
        totalColumns = NumericFilterColumn.slice();
    }

    return {
        Button: false,
        showButtons: [],
        StringFilterColumn: StringFilterColumn,
        NumericFilterColumn: NumericFilterColumn,
        DateFilterColumn: DateFilterColumn,
        StringdoubleFilterColumn: [],
        hiddenColumns: hiddenColumns,
        ColumnAlignment: ColumnAlignment,
        totalColumns: totalColumns,
        fixedDecimalValue: buildDecimalConfig(NumericFilterColumn),
        commaColumns: []
    };
}

function buildDecimalConfig(numericCols) {
    var templateDecimals = buildTemplateDecimalPointMap(numericCols);
    var cfg = {};
    numericCols.forEach(function (col) {
        var fromTemplate = getTemplateDecimalPoint(col, templateDecimals);
        if (fromTemplate !== null) {
            cfg[col] = fromTemplate;
            return;
        }
        if (/qty|weight|sqm|kg|mt|mtr|amount|rate|value/i.test(col)) {
            cfg[col] = /amount|rate|value/i.test(col) ? 2 : 3;
        } else {
            cfg[col] = 0;
        }
    });
    return Object.keys(cfg).length ? cfg : 2;
}

function isNumericColumn(colName, values) {
    var name = colName.toLowerCase();
    if (/qty|amount|rate|weight|total|balance|pending|dispatch|production|value|nos|no\./i.test(name)) {
        return true;
    }
    var nonEmpty = values.filter(function (v) { return v !== null && v !== undefined && v !== ''; });
    if (!nonEmpty.length) return false;
    var nums = nonEmpty.filter(function (v) { return !isNaN(parseFloat(v)); });
    return nums.length >= nonEmpty.length * 0.8;
}

function isDateColumn(colName, values) {
    var name = colName.toLowerCase();
    if (/date|_dt| on$/i.test(name)) return true;
    return values.some(function (v) {
        return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v);
    });
}

function formatGridRows(rows) {
    return (rows || []).map(function (row) {
        var out = {};
        Object.keys(row).forEach(function (key) {
            out[key] = formatCellValue(key, row[key]);
        });
        return out;
    });
}

function formatCellValue(colName, val) {
    if (isBlankNullValue(val) || val === '') return '';
    var str = String(val).trim();

    if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
        return str.split('T')[0];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
    }

    var m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(str);
    if (m) {
        return m[3] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[1]).padStart(2, '0');
    }

    return val;
}

function isoDateToDisplay(iso) {
    if (!iso) return iso;
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(iso).trim());
    if (!m) return iso;
    return String(m[3]).padStart(2, '0') + '-' + String(m[2]).padStart(2, '0') + '-' + m[1];
}

function formatOrderLoadDateCells() {
    if (!G_OL_DateColumns.length) return;

    var $table = $('#OrderLoadReport');
    var colMap = getOrderLoadColumnIndexMap();

    G_OL_DateColumns.forEach(function (colName) {
        var idx = colMap[colName];
        if (idx === undefined) return;

        $table.find('tbody tr:not(.total-row):not(.grand-total-row)').each(function () {
            var $cell = $(this).find('td').eq(idx);
            var raw = ($cell.text() || '').trim();
            if (!raw) return;
            var display = isoDateToDisplay(raw);
            if (display !== raw) {
                $cell.text(display);
            }
        });
    });
}

function installOrderLoadGridRenderHook() {
    if (window._olGridRenderHookInstalled) return;
    window._olGridRenderHookInstalled = true;

    var origRenderTable = window.renderTable;
    var origRenderTableWithPagination = window.renderTableWithPagination;

    window.renderTable = function (items, bodyId, skipTotalRow) {
        origRenderTable.apply(this, arguments);
        if ($('#' + bodyId).closest('table').attr('id') === 'OrderLoadReport') {
            blankOrderLoadNullCells();
            formatOrderLoadDateCells();
            applyGridCellEnhancements();
        }
    };

    window.renderTableWithPagination = function (tableId, bodyId) {
        origRenderTableWithPagination.apply(this, arguments);
        if (tableId === 'OrderLoadReport') {
            blankOrderLoadNullCells();
            formatOrderLoadDateCells();
            applyGridCellEnhancements();
        }
    };
}

function blankOrderLoadNullCells() {
    $('#OrderLoadReport td').each(function () {
        var text = ($(this).text() || '').replace(/\u00a0/g, ' ').trim();
        if (text.toLowerCase() === 'null') {
            $(this).text('');
        }
    });
}

function unwrapApiList(payload) {
    if (!payload) return [];

    if (typeof payload === 'string') {
        var trimmed = payload.trim();
        if (trimmed.charAt(0) === '[' || trimmed.charAt(0) === '{') {
            try {
                return unwrapApiList(JSON.parse(trimmed));
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    if (Array.isArray(payload)) {
        if (payload.length && Array.isArray(payload[0])) return payload[0];
        return payload;
    }
    if (payload.$values && Array.isArray(payload.$values)) return payload.$values;
    if (typeof payload === 'object') {
        var objKeys = Object.keys(payload);
        if (objKeys.length && objKeys.every(function (k) { return /^\d+$/.test(k); })) {
            return objKeys.sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); })
                .map(function (k) { return payload[k]; });
        }
    }
    var keys = ['Data', 'data', 'Result', 'result', 'Rows', 'rows', 'Items', 'items', 'List', 'list'];
    for (var i = 0; i < keys.length; i++) {
        if (payload[keys[i]] && Array.isArray(payload[keys[i]])) return payload[keys[i]];
    }
    if (typeof payload === 'object') {
        if (payload.FieldForClient != null || payload.fieldForClient != null ||
            payload.FieldForDate != null || payload.fieldForDate != null ||
            payload.Code != null || payload.code != null ||
            payload.ShowFromDate != null || payload.showFromDate != null ||
            payload.AutoFilterItem != null || payload.autoFilterItem != null ||
            payload.Item != null || payload.item != null) {
            return [payload];
        }
    }
    return [];
}

function prop(obj, names) {
    if (!obj) return '';

    for (var i = 0; i < names.length; i++) {
        if (obj[names[i]] != null && obj[names[i]] !== '') return obj[names[i]];
    }

    var objKeys = Object.keys(obj);
    for (var j = 0; j < names.length; j++) {
        var target = String(names[j]).toLowerCase();
        for (var k = 0; k < objKeys.length; k++) {
            if (String(objKeys[k]).toLowerCase() === target) {
                var val = obj[objKeys[k]];
                if (val != null && val !== '') return val;
            }
        }
    }

    return '';
}

function findTemplate(templateCode) {
    var code = parseInt(templateCode, 10) || 0;
    return G_OL_Templates.find(function (t) {
        return (parseInt(t.code, 10) || 0) === code;
    });
}
