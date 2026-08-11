import { OrderLoadReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/OrderLoadReportService.js';
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
var G_OL_ItemMasterLookup = null;
var G_OL_FilterModalFocusTrapSuspended = false;
var G_OL_OpenCheckboxDropdownId = '';

function getFormTypeFromQuery() {
    return getOrderLoadFormTypeFromQuery(
        BizSolHelperFunction.getQueryParam('FormType', ''),
        BizSolHelperFunction.getQueryParam('ModuleDesp', '')
    );
}

var G_OL_FORM_TYPE = getFormTypeFromQuery();
window.G_OL_FORM_TYPE = G_OL_FORM_TYPE;

var G_OL_MODAL_FIELD_IDS = [
    'olFieldFromDate', 'olFieldToDate',
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

var G_OL_FILTER_MAP = [
    { flag: 'showWareHouse', fieldId: 'olFieldWareHouse', select: '#ddlWareHouse', cacheKey: 'warehouse', loader: loadWareHouseDropdown, textKeys: ['GodownName', 'godownName'] },
    { flag: 'showItemGroup', fieldId: 'olFieldItemGroup', select: '#ddlItemGroup', cacheKey: 'itemGroup', loader: loadItemGroupDropdown, textKeys: ['ItemGroup', 'itemGroup'] },
    { flag: 'showProcess', fieldId: 'olFieldProcess', select: '#ddlProcess', cacheKey: 'process', loader: loadProcessDropdown, textKeys: ['ProcessName', 'processName'] },
    { flag: 'showMarketingMan', fieldId: 'olFieldMarketingMan', select: '#ddlMarketingMan', cacheKey: 'marketingMan', loader: loadMarketingManDropdown, textKeys: ['PersonName', 'personName', 'Desp', 'desp'] },
    { flag: 'showAsPerMarketingPerson', fieldId: 'olFieldMarketingMan', select: '#ddlMarketingMan', cacheKey: 'marketingMan', loader: loadMarketingManDropdown, textKeys: ['PersonName', 'personName', 'Desp', 'desp'] },
    { flag: 'showOrderNo', fieldId: 'olFieldOrderNo', select: '#ddlOrderNo', cacheKey: 'orderNo', loader: loadOrderNoDropdown, textKeys: ['OrderNo', 'orderNo'] },
    { flag: 'showItemType', fieldId: 'olFieldItemType', select: '#ddlItemType', cacheKey: 'itemType', loader: loadItemTypeDropdown, textKeys: ['ItemType', 'itemType'] },
    { flag: 'showItemName', fieldId: 'olFieldItemName', select: '#ddlItemName', cacheKey: 'itemName', loader: loadItemMasterDropdown, textKeys: ['ItemName', 'itemName'] }
];

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    if (!$('#ERPHeading').text() || $('#ERPHeading').text() === 'undefined') {
        $('#ERPHeading').text('OrderLoad Report In Grid');
    }

    bindEvents();
    loadTemplateDropdown();
    installOrderLoadGridRenderHook();
    initOrderLoadPreviewModal();
    initOrderLoadGridLayoutHooks();

    // Called by the Manage Template module after a template is saved/deleted.
    window.OrderLoadReportRefreshTemplates = function (selectCode) {
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
    $('#ddlLevel').on('change', function () {
        applySelectedLevel();
        loadTemplateDefaultDatesFromApi(G_OL_CurrentLevel);
        applyFilterActiveColors();
        updateFilterButtonState();
        updateFilterSummary();
    });
    $('#txtFromDate, #txtToDate').on('change input', function () {
        applyFilterActiveColors();
        updateFilterButtonState();
        updateFilterSummary();
    });
    $('#txtFromDate, #txtToDate').on('keydown', function (e) {
        if (e.key === 'Enter') {
            loadReportData();
        }
    });
    $('#btnSizeParameterFilter').on('click', showOrderLoadSizeControlModal);
    $('#btnClearSizeParameterFilter, #btnEmptyClearSizeFilter').on('click', onClearSizeParameterFilterClick);

    $('#olFilterModal').on('shown.bs.modal', function () {
        $('.ol-cd-menu').each(function () {
            ensureCheckboxDropdownMenuContainer($(this));
        });
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
        printOrderLoadReport();
    });

    $('#btnOlPreview').on('click', function () {
        if ($(this).prop('disabled')) {
            toastr.warning('Please load the report first.');
            return;
        }
        openOrderLoadPrintPreview();
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

    if (!$('#olFieldFromDate').hasClass('ol-hidden') && $('#txtFromDate').val()) {
        count += 1;
    }
    if (!$('#olFieldToDate').hasClass('ol-hidden') && $('#txtToDate').val()) {
        count += 1;
    }
    if (!$('#olFieldLevel').hasClass('ol-hidden') && $('#ddlLevel').val() !== null && $('#ddlLevel').val() !== '') {
        count += 1;
    }

    G_OL_MULTI_SELECTS.concat(G_OL_OTHER_FILTER_SELECTS).forEach(function (selector) {
        var $field = $(selector).closest('.ol-filter-field');
        if ($field.hasClass('ol-hidden')) return;
        if (getDropdownCodes(selector).length > 0) count += 1;
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
        loadVisibleDropdowns(tpl);
    }

    applyFilterActiveColors();
    updateModalEmptyState();

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
    toastr.success('Size Parameter Filter cleared.');

    if ($('#ddlTemplate').val()) {
        loadReportData();
    }
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

function findGridColumnKey(rows, normalizedName) {
    if (!Array.isArray(rows) || !rows.length) return null;
    var keys = Object.keys(rows[0]);
    return keys.find(function (key) {
        return key.replace(/[\s_]/g, '').toLowerCase() === normalizedName;
    }) || null;
}

function ensureItemMasterLookup() {
    if (G_OL_ItemMasterLookup) {
        return Promise.resolve(G_OL_ItemMasterLookup);
    }

    return OrderLoadReportService.GetItemMaster()
        .then(function (res) {
            var lookup = {};
            unwrapApiList(res).forEach(function (row) {
                var code = parseInt(prop(row, ['Code', 'code']), 10);
                var name = String(prop(row, ['ItemName', 'itemName']) || '').trim().toLowerCase();
                if (code > 0 && name) {
                    lookup[name] = code;
                }
            });
            G_OL_ItemMasterLookup = lookup;
            return lookup;
        });
}

function collectItemMasterCodesFromGridRows(rows, lookup) {
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

    lookup = lookup || {};
    var nameCol = findGridColumnKey(rows, 'itemname');
    if (!nameCol) return '';

    rows.forEach(function (row) {
        var name = String(row[nameCol] || '').trim().toLowerCase();
        if (!name) return;
        var code = lookup[name];
        if (code > 0 && !seen[code]) {
            seen[code] = true;
            codes.push(code);
        }
    });

    return codes.join(',');
}

function resolveOrderLoadItemMasterCodesForSizeFilter(tpl, options) {
    tpl = tpl || getSelectedTemplate();
    options = options || {};

    function resolveFromGridOrLookup() {
        if (!options.skipCache && String(G_OL_SizeFilterItemMasterCodes || '').trim()) {
            return Promise.resolve(G_OL_SizeFilterItemMasterCodes);
        }

        var rows = getOrderLoadExportRows();
        var directCodes = collectItemMasterCodesFromGridRows(rows);
        if (directCodes) {
            return Promise.resolve(directCodes);
        }

        return ensureItemMasterLookup()
            .then(function (lookup) {
                return collectItemMasterCodesFromGridRows(rows, lookup);
            });
    }

    if (isFlagY(tpl.showItemName)) {
        return loadItemMasterDropdown()
            .then(function () {
                var codes = getItemNameCodesForSizeFilter();
                if (codes.length) {
                    return codes.join(',');
                }
                return resolveFromGridOrLookup();
            });
    }

    return resolveFromGridOrLookup();
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
    if ($('#ddlTemplate').val()) {
        loadReportData();
    }
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
        initDefaultDates();
    }
    resetDropdownFilters();
    clearSizeParameterFilter();
    if (tpl) {
        applyOtherFiltersVisibility(tpl);
        loadVisibleDropdowns(tpl);
    }
    applyFilterActiveColors();
    updateFilterButtonState();
    updateModalEmptyState();
}

function applyFilterActiveColors() {
    $('#olFilterModal .ol-filter-field, #olFieldTemplate')
        .removeClass('ol-filter-applied');

    if (!$('#olFieldFromDate').hasClass('ol-hidden') && $('#txtFromDate').val()) {
        $('#olFieldFromDate').addClass('ol-filter-applied');
    }
    if (!$('#olFieldToDate').hasClass('ol-hidden') && $('#txtToDate').val()) {
        $('#olFieldToDate').addClass('ol-filter-applied');
    }
    if ($('#ddlTemplate').val()) {
        $('#olFieldTemplate').addClass('ol-filter-applied');
    }
    if (!$('#olFieldLevel').hasClass('ol-hidden') && $('#ddlLevel').val() !== null && $('#ddlLevel').val() !== '') {
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

function initDefaultDates() {
    var today = new Date();
    var first = new Date(today.getFullYear(), today.getMonth(), 1);
    $('#txtFromDate').val(toIsoDate(first));
    $('#txtToDate').val(toIsoDate(today));
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

function applyTemplateDefaultDates(tpl, fallbackToMonthStart) {
    tpl = tpl || getSelectedTemplate();
    var dates = extractDatesFromApiRow(tpl);
    var fromIso = apiDateToIso(dates.fromDate || tpl.fromDate);
    var toIso = apiDateToIso(dates.toDate || tpl.toDate);

    if (!fromIso && !toIso) {
        if (fallbackToMonthStart !== false && (!tpl || !tpl.code)) {
            initDefaultDates();
        }
        return;
    }

    if (fromIso && (!tpl.code || isFlagY(tpl.showFromDate))) {
        $('#txtFromDate').val(fromIso);
    }
    if (toIso && (!tpl.code || isFlagY(tpl.showToDate))) {
        $('#txtToDate').val(toIso);
    } else if (fromIso && !$('#txtToDate').val()) {
        $('#txtToDate').val(toIsoDate(new Date()));
    }
}

function loadTemplateDefaultDatesFromApi(tpl) {
    tpl = tpl || getSelectedTemplate();
    if (!tpl || !tpl.code) {
        if (!$('#txtFromDate').val() && !$('#txtToDate').val()) {
            initDefaultDates();
        }
        return Promise.resolve();
    }

    var master = findTemplate(tpl.code) || {};
    var levelRow = null;
    if (G_OL_LevelRows && G_OL_LevelRows.length) {
        var levelIndex = resolveLevelIndex(G_OL_LevelRows, tpl.levelIndex != null ? tpl.levelIndex : $('#ddlLevel').val());
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

    if (fromIso || toIso) {
        applyTemplateDefaultDates(Object.assign({}, tpl, master, {
            fromDate: fromIso || mergedDates.fromDate || tpl.fromDate,
            toDate: toIso || mergedDates.toDate || tpl.toDate
        }), false);
    }

    return Promise.resolve();
}

function showGridPanel(visible) {
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
        showSizeParameterFilter: prop(row, ['ShowSizeParameterFilter', 'showSizeParameterFilter']) || 'N'
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

    if (!normalizeFieldName(tpl.fieldForClient)) tpl.fieldForClient = 'PartyName';
    if (!normalizeFieldName(tpl.fieldForDate)) tpl.fieldForDate = 'OrderDate';

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
        tpl.fieldForClient = fields.fieldForClient || 'PartyName';
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

function bindLevelDropdown(rows) {
    var $field = $('#olFieldLevel');
    var $ddl = $('#ddlLevel').empty();

    if (!rows || rows.length <= 1) {
        $field.addClass('ol-hidden');
        return 0;
    }

    $field.removeClass('ol-hidden');
    rows.forEach(function (row, index) {
        $ddl.append($('<option/>').val(index).text(buildLevelOptionText(row, index)));
    });

    var defaultIndex = rows.length - 1;
    for (var i = rows.length - 1; i >= 0; i--) {
        if (normalizeFieldName(prop(rows[i], ['FieldForDate', 'fieldForDate']))) {
            defaultIndex = i;
            break;
        }
    }

    $ddl.val(String(defaultIndex));
    return defaultIndex;
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

    var levelIndex = resolveLevelIndex(G_OL_LevelRows, $('#ddlLevel').val());
    var levelRow = levelIndex >= 0 ? G_OL_LevelRows[levelIndex] : null;
    var tpl = buildTemplateLevel(code, levelRow);
    tpl.levelIndex = levelIndex;

    mergeTemplateLevel(tpl);
    applyLevelToFilters(tpl);
}

function bindTemplateLevel(code) {
    return OrderLoadReportService.GetLevel(code).then(function (res) {
        if ((parseInt($('#ddlTemplate').val(), 10) || 0) !== code) return null;

        G_OL_LevelRows = unwrapApiList(res);
        if (G_OL_LevelRows.length === 1 && isFullTemplateRow(G_OL_LevelRows[0])) {
            bindLevelDropdown([]);
        } else {
            bindLevelDropdown(G_OL_LevelRows);
        }

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
    if (!normalizeFieldName(tpl.fieldForClient)) tpl.fieldForClient = 'PartyName';
    if (!tpl._fieldForDateFromApi && !normalizeFieldName(tpl.fieldForDate)) {
        tpl.fieldForDate = 'OrderDate';
    }
    return tpl;
}

function applyFilterLabels(tpl) {
    var dateField = normalizeFieldName(tpl.fieldForDate);
    var dateLabel = dateField
        ? fieldNameToLabel(dateField, 'Order Date')
        : 'Order Date';
    var clientLabel = fieldNameToLabel(tpl.fieldForClient || 'PartyName', 'Party Name');

    $('#txtFromDate').attr('data-level-field', dateField || '');
    $('#txtToDate').attr('data-level-field', dateField || '');

    if ($('#lblFromDateText').length) {
        $('#lblFromDateText').text(dateLabel);
        $('#lblToDateText').text('To Date');
    } else {
        $('label[for="txtFromDate"]').html(dateLabel + ' <span class="text-danger">*</span>');
        $('label[for="txtToDate"]').html('To Date <span class="text-danger">*</span>');
    }

    $('#olSearchSlot input[type="text"], #global-search-wrap-OrderLoadReport input').attr(
        'placeholder',
        getGridSearchPlaceholder(clientLabel)
    );
}

function toggleFilterField(fieldId, visible) {
    $('#' + fieldId).toggleClass('ol-hidden', !visible);
}

function applyTemplateFilters() {
    updateTemplateSelectStyle();

    var code = parseInt($('#ddlTemplate').val(), 10) || 0;

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
        freezeFromColumn: '',
        otherFilter1: '',
        otherFilter2: '',
        otherFilter3: '',
        fieldForClient: 'PartyName',
        fieldForDate: 'OrderDate'
    };
}

function applyLevelToFilters(tpl) {
    tpl = ensureStaticLevelDefaults(tpl);
    G_OL_CurrentLevel = tpl;

    applyFilterLabels(tpl);

    var hasDateField = !!normalizeFieldName(tpl.fieldForDate);
    var showFrom = (!tpl.code || isFlagY(tpl.showFromDate)) && hasDateField;
    var showTo = (!tpl.code || isFlagY(tpl.showToDate)) && hasDateField;

    toggleFilterField('olFieldFromDate', showFrom);
    toggleFilterField('olFieldToDate', showTo);
    toggleFilterField('olFieldWareHouse', isFlagY(tpl.showWareHouse));
    toggleFilterField('olFieldItemGroup', isFlagY(tpl.showItemGroup));
    toggleFilterField('olFieldProcess', isFlagY(tpl.showProcess));
    toggleFilterField('olFieldMarketingMan', isFlagY(tpl.showMarketingMan) || isFlagY(tpl.showAsPerMarketingPerson));
    toggleFilterField('olFieldOrderNo', isFlagY(tpl.showOrderNo));
    toggleFilterField('olFieldItemType', isFlagY(tpl.showItemType));
    toggleFilterField('olFieldItemName', isFlagY(tpl.showItemName));

    applyOtherFiltersVisibility(tpl);
    loadVisibleDropdowns(tpl);
    syncTemplateGridMeta(tpl);
    applyFilterActiveColors();
    updateFilterButtonState();
}

function hasOtherFilterValue(value) {
    return String(value || '').trim() !== '';
}

function applyOtherFiltersVisibility(tpl) {
    // Blank OtherFilter => hide; non-blank => show inside modal
    var show1 = hasOtherFilterValue(tpl.otherFilter1);
    var show2 = hasOtherFilterValue(tpl.otherFilter2);
    var show3 = hasOtherFilterValue(tpl.otherFilter3);

    toggleFilterField('olFieldOtherFilter1', show1);
    toggleFilterField('olFieldOtherFilter2', show2);
    toggleFilterField('olFieldOtherFilter3', show3);

    if (!show1) resetOtherFilterSlot(1);
    if (!show2) resetOtherFilterSlot(2);
    if (!show3) resetOtherFilterSlot(3);

    if (show1) loadOtherFilterDropdown(1, tpl.otherFilter1);
    if (show2) loadOtherFilterDropdown(2, tpl.otherFilter2);
    if (show3) loadOtherFilterDropdown(3, tpl.otherFilter3);

    updateModalEmptyState();
}

function updateModalEmptyState() {
    var anyVisible = G_OL_MODAL_FIELD_IDS.some(function (fieldId) {
        return !$('#' + fieldId).hasClass('ol-hidden');
    });
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

function resolveOtherFilterLabel(meta, fallbackIndex) {
    return meta.label
        || fieldNameToLabel(meta.nameColumn, '')
        || fieldNameToLabel(meta.fieldName, '')
        || ('Other Filter ' + fallbackIndex);
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

function loadOtherFilterDropdown(index, otherFilterQuery) {
    var cacheKey = 'otherFilter' + index;
    var query = String(otherFilterQuery || '').trim();
    if (!query) return;
    if (G_OL_DropdownLoaded[cacheKey] && G_OL_OTHER_FILTER_META[index].query === query) return;

    var parsed = parseOtherFilterDefinition(query) || {};
    G_OL_OTHER_FILTER_META[index] = {
        query: query,
        fieldName: parsed.filterField || '',
        label: parsed.label || '',
        nameColumn: parsed.nameColumn || '',
        flag: parsed.flag || '',
        tableName: ''
    };

    var label = resolveOtherFilterLabel(G_OL_OTHER_FILTER_META[index], index);
    $('#lblOtherFilter' + index).text(label);

    var templateCode = parseInt($('#ddlTemplate').val(), 10) || 0;

    OrderLoadReportService.GetOtherFilterDetails('', templateCode, index)
        .then(function (res) {
            var list = unwrapApiList(res);
            var first = list[0] || {};

            // Prefer API meta when available
            var apiLabel = String(prop(first, ['FilterCaption', 'filterCaption']) || '').trim();
            var apiField = String(prop(first, ['FieldName', 'fieldName']) || '').trim();
            var apiNameCol = String(prop(first, ['NameColumn', 'nameColumn']) || '').trim();
            var apiFlag = String(prop(first, ['Flag', 'flag']) || '').trim();

            if (apiLabel) G_OL_OTHER_FILTER_META[index].label = apiLabel;
            if (apiField) G_OL_OTHER_FILTER_META[index].fieldName = apiField;
            if (apiNameCol) G_OL_OTHER_FILTER_META[index].nameColumn = apiNameCol;
            if (apiFlag) G_OL_OTHER_FILTER_META[index].flag = apiFlag;

            label = resolveOtherFilterLabel(G_OL_OTHER_FILTER_META[index], index);
            $('#lblOtherFilter' + index).text(label);

            var nameCol = G_OL_OTHER_FILTER_META[index].nameColumn;
            var textKeys = ['Desp', 'desp'];
            if (nameCol) {
                textKeys = [nameCol, nameCol.charAt(0).toLowerCase() + nameCol.slice(1), 'Desp', 'desp'];
            }
            textKeys = textKeys.concat(['EntryType', 'entryType', 'Name', 'name', 'Value', 'value']);

            bindDropdown(
                $('#ddlOtherFilter' + index),
                list,
                textKeys,
                'Select ' + label + '...'
            );
            G_OL_DropdownLoaded[cacheKey] = true;
        })
        .catch(function () {
            toastr.error('Could not load ' + label + '.');
        });
}

function loadVisibleDropdowns(tpl) {
    var loaders = {};

    G_OL_FILTER_MAP.forEach(function (cfg) {
        if (!isFlagY(tpl[cfg.flag])) return;
        if ($('#' + cfg.fieldId).hasClass('ol-hidden')) return;
        loaders[cfg.cacheKey] = cfg.loader;
    });

    Object.keys(loaders).forEach(function (key) {
        loaders[key]();
    });
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
    var list = unwrapApiList(rows);
    $select.empty().append($('<option/>', { value: '0', text: 'All' }));

    list.forEach(function (row) {
        var code = prop(row, ['Code', 'code']);
        var text = prop(row, textKeys) || String(code);
        $select.append($('<option/>', { value: code, text: text }));
    });

    buildCheckboxDropdown($select, placeholder);
}

function loadWareHouseDropdown() {
    if (G_OL_DropdownLoaded.warehouse) return;
    OrderLoadReportService.GetGodownMaster()
        .then(function (res) {
            bindDropdown($('#ddlWareHouse'), res, ['GodownName', 'godownName'], 'Select Warehouse...');
            G_OL_DropdownLoaded.warehouse = true;
        })
        .catch(function () { toastr.error('Could not load Warehouse list.'); });
}

function loadItemGroupDropdown() {
    if (G_OL_DropdownLoaded.itemGroup) return;
    OrderLoadReportService.GetItemGroupMaster()
        .then(function (res) {
            bindDropdown($('#ddlItemGroup'), res, ['ItemGroup', 'itemGroup'], 'Select Item Group...');
            G_OL_DropdownLoaded.itemGroup = true;
        })
        .catch(function () { toastr.error('Could not load Item Group list.'); });
}

function loadProcessDropdown() {
    if (G_OL_DropdownLoaded.process) return;
    OrderLoadReportService.GetProcessMaster()
        .then(function (res) {
            bindDropdown($('#ddlProcess'), res, ['ProcessName', 'processName'], 'Select Process...');
            G_OL_DropdownLoaded.process = true;
        })
        .catch(function () { toastr.error('Could not load Process list.'); });
}

function loadMarketingManDropdown() {
    if (G_OL_DropdownLoaded.marketingMan) return;

    var auth = {};
    try { auth = JSON.parse(sessionStorage.getItem('authKey') || '{}'); } catch (e) { auth = {}; }

    OrderLoadReportService.GetNestedMarketingManList(auth.UserMaster_Code || 0, 0)
        .then(function (res) {
            bindDropdown($('#ddlMarketingMan'), res, ['PersonName', 'personName', 'Desp', 'desp'], 'Select Marketing Man...');
            G_OL_DropdownLoaded.marketingMan = true;
        })
        .catch(function () { toastr.error('Could not load Marketing Man list.'); });
}

function loadOrderNoDropdown() {
    if (G_OL_DropdownLoaded.orderNo) return;
    OrderLoadReportService.GetOrderNo()
        .then(function (res) {
            bindDropdown($('#ddlOrderNo'), res, ['OrderNo', 'orderNo'], 'Select Order No...');
            G_OL_DropdownLoaded.orderNo = true;
        })
        .catch(function () { toastr.error('Could not load Order No list.'); });
}

function loadItemTypeDropdown() {
    if (G_OL_DropdownLoaded.itemType) return;
    OrderLoadReportService.GetItemTypeMaster()
        .then(function (res) {
            bindDropdown($('#ddlItemType'), res, ['ItemType', 'itemType'], 'Select Item Type...');
            G_OL_DropdownLoaded.itemType = true;
        })
        .catch(function () { toastr.error('Could not load Item Type list.'); });
}

function loadItemMasterDropdown() {
    if (G_OL_DropdownLoaded.itemName) {
        return Promise.resolve();
    }

    return OrderLoadReportService.GetItemMaster()
        .then(function (res) {
            bindDropdown($('#ddlItemName'), res, ['ItemName', 'itemName'], 'Select Item Name...');
            G_OL_DropdownLoaded.itemName = true;
            refreshOrderLoadSizeFilterItemCodes(getSelectedTemplate());
        })
        .catch(function () {
            toastr.error('Could not load Item list.');
            return Promise.reject(new Error('Could not load Item list.'));
        });
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

    if (codes.length === 1) {
        parts.push(' AND (' + columnName + '=' + codes[0] + ' OR 0=' + codes[0] + ')');
    } else {
        parts.push(' AND (' + columnName + ' IN (' + codes.join(',') + '))');
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

    parts.push(' AND (' + field + ' IN (' + escaped.join(',') + '))');
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
    return normalizeFieldName(tpl && tpl.fieldForDate) || 'OrderDate';
}

function buildReportConditions(tpl) {
    var filterParts = [];
    var queryParts = [];
    var isStockSafe = inferUsesQueryCondition(tpl);
    var usesFilter = procedureUsesParam(tpl, 'FilterCondition') || inferUsesFilterCondition(tpl);
    var usesQuery = procedureUsesParam(tpl, 'QueryCondition') || isStockSafe;
    var usesDateParams = procedureUsesParam(tpl, 'FromDate') || procedureUsesParam(tpl, 'ToDate');
    var fromIso = $('#txtFromDate').val();
    var toIso = $('#txtToDate').val();
    // Master + OtherFilter travel together (same routing rules)
    var masterParts = buildMasterFilterParts(tpl).concat(buildOtherFilterParts(tpl));
    var dateField = getTemplateDateField(tpl);

    // Default: if procedure params unknown, prefer QueryCondition (stock-safe)
    if (!usesFilter && !usesQuery) {
        usesQuery = true;
    }

    // Stock / bal / invoice-rate: never put ItemMaster.* style filters in FilterCondition
    if (isStockSafe) {
        usesQuery = true;
    }

    if (!usesDateParams) {
        if (isFlagY(tpl.showFromDate) && fromIso) {
            filterParts.push(" AND " + dateField + " >= CAST('" + isoToApiDate(fromIso) + "' AS DATE)");
        }
        if (isFlagY(tpl.showToDate) && toIso) {
            filterParts.push(" AND " + dateField + " <= CAST('" + isoToApiDate(toIso) + "' AS DATE)");
        }
    }

    if (usesQuery) {
        queryParts = masterParts.slice();
    }

    if (usesFilter && !usesQuery) {
        filterParts = filterParts.concat(masterParts);
    }

    if (usesFilter && usesQuery) {
        // Dates (if any) stay in FilterCondition; item/other filters only in QueryCondition
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

    return {
        filterCondition: filterParts.join(''),
        queryCondition: queryParts.join('')
    };
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
    if (!msg) {
        return 'Report request failed.';
    }

    if (/procedure\s*not\s*found/i.test(msg)) {
        return 'Procedure not found for selected report template.';
    }

    if (/^(error|parsererror|not found|internal server error):?\s*/i.test(msg)) {
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

function loadReportData() {
    if (G_OL_LoadingReport) return;

    var tpl = getSelectedTemplate();
    if (!tpl.code || !tpl.desp) {
        toastr.warning('Please select Template.');
        return;
    }

    var fromIso = $('#txtFromDate').val();
    var toIso = $('#txtToDate').val();
    if (isFlagY(tpl.showFromDate) && normalizeFieldName(tpl.fieldForDate) && !fromIso) {
        toastr.warning('Please select ' + fieldNameToLabel(tpl.fieldForDate, 'Order Date') + ' From.');
        return;
    }
    if (isFlagY(tpl.showToDate) && normalizeFieldName(tpl.fieldForDate) && !toIso) {
        toastr.warning('Please select ' + fieldNameToLabel(tpl.fieldForDate, 'Order Date') + ' To.');
        return;
    }
    if (isFlagY(tpl.showFromDate) && isFlagY(tpl.showToDate) && fromIso > toIso) {
        toastr.warning('From Date must be less than or equal to To Date.');
        return;
    }

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
    var params = {
        reportType: String(tpl.desp || '').trim(),
        templateCode: tpl.code,
        filterCondition: conditions.filterCondition,
        // Size filter travels only via ItemSizeMaster_Codes; SP builds FilterCondition/QueryCondition.
        queryCondition: sizeCodes ? '' : conditions.queryCondition,
        fromDate: isFlagY(tpl.showFromDate) ? isoToApiDate(fromIso) : '',
        toDate: isFlagY(tpl.showToDate) ? isoToApiDate(toIso) : '',
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
            showGridPanel(false);
            updateEmptyStateMessage();
            var rawMsg = extractOrderLoadReportErrorMessage(null, err) || (err && err.message) || 'Request failed';
            toastr.error(formatOrderLoadReportErrorMessage(rawMsg, tpl));
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

function bindOrderLoadGrid(response) {
    var rows = formatGridRows(unwrapApiList(response));

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

function normalizeExportCellValue(value) {
    if (value === null || value === undefined) return '';
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
    var cfg = {};
    numericCols.forEach(function (col) {
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
    if (val === null || val === undefined || val === '') return val;
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
            formatOrderLoadDateCells();
            applyGridCellEnhancements();
        }
    };

    window.renderTableWithPagination = function (tableId, bodyId) {
        origRenderTableWithPagination.apply(this, arguments);
        if (tableId === 'OrderLoadReport') {
            formatOrderLoadDateCells();
            applyGridCellEnhancements();
        }
    };
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
    var keys = ['Data', 'data', 'Result', 'result', 'Rows', 'rows'];
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
