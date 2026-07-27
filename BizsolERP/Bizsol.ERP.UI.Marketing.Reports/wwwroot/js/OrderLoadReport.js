import { OrderLoadReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/OrderLoadReportService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

var G_OL_Templates = [];
var G_OL_LevelRows = [];
var G_OL_CurrentLevel = null;
var G_OL_LoadingReport = false;
var G_OL_DropdownLoaded = {};
/* Normalized keys of columns with ShowTotal = 'Y' for the active template */
var G_OL_ShowTotalKeys = [];
var G_OL_ShowTotalLoaded = false;

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

    initDefaultDates();
    bindEvents();
    loadTemplateDropdown();

    // Called by the Manage Template module after a template is saved/deleted.
    window.OrderLoadReportRefreshTemplates = function (selectCode) {
        loadTemplateDropdown(selectCode);
    };
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

    $('#olFilterModal').on('shown.bs.modal', function () {
        applyFilterActiveColors();
        updateModalEmptyState();
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

function clearModalFilters() {
    initDefaultDates();
    resetDropdownFilters();
    var tpl = G_OL_CurrentLevel || getSelectedTemplate();
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

function showGridPanel(visible) {
    if (visible) {
        $('#tblOrderLoadReport').css('display', 'flex');
        $('#olEmptyState').hide();
    } else {
        $('#tblOrderLoadReport').hide();
        $('#olGridMeta').hide();
        $('#olEmptyState').show();
    }
}

function resetFilters() {
    initDefaultDates();
    resetDropdownFilters();
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

function mapTemplate(row) {
    var tpl = Object.assign(getDefaultLevelTemplate(), {
        code: parseInt(prop(row, ['Code', 'code']), 10) || 0,
        desp: prop(row, ['Desp', 'desp']),
        procedureName: prop(row, ['ProcedureName', 'procedureName']),
        procedureParameters: prop(row, ['ProcedureParameters', 'procedureParameters']),
        otherFilter1: String(prop(row, ['OtherFilter1', 'otherFilter1']) || '').trim(),
        otherFilter2: String(prop(row, ['OtherFilter2', 'otherFilter2']) || '').trim(),
        otherFilter3: String(prop(row, ['OtherFilter3', 'otherFilter3']) || '').trim()
    });

    return ensureStaticLevelDefaults(applyApiLevelRow(tpl, row));
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

    Object.keys(fields.flags).forEach(function (key) {
        if (fields.flags[key] != null && fields.flags[key] !== '') {
            tpl[key] = fields.flags[key];
        }
    });

    return tpl;
}

function isFullTemplateRow(row) {
    return !!(
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
        return G_OL_CurrentLevel;
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
/* Menu is appended to <body> and fixed-positioned so it can never be clipped by
   the page's scroll/overflow containers (mirrors how Select2 dropdowns escape via body). */

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
    var $searchWrap = $('<div class="ol-cd-search-wrap"><input type="text" class="ol-cd-search-input" placeholder="Search..." /></div>');
    var $optionsWrap = $('<div class="ol-cd-options"></div>');

    $select.find('option').each(function () {
        var $opt = $(this);
        var val = $opt.val();
        var text = $opt.text();
        $optionsWrap.append(
            '<label class="ol-cd-option">' +
                '<input type="checkbox" class="ol-cd-checkbox" value="' + escapeHtml(val) + '" data-text="' + escapeHtml(text) + '" ' + (val === '0' ? 'checked' : '') + ' />' +
                '<span class="ol-cd-option-text">' + escapeHtml(text) + '</span>' +
            '</label>'
        );
    });

    var $footer = $(
        '<div class="ol-cd-footer">' +
            '<button type="button" class="ol-cd-btn-ok">OK</button>' +
        '</div>'
    );

    $menu.append($searchWrap).append($optionsWrap).append($footer);
    $wrap.append($header);

    $select.hide().after($wrap);
    $menu.appendTo(document.body);
    $select.val(['0']).trigger('change');

    function closeMenu() {
        $menu.hide();
        $wrap.removeClass('ol-cd-open');
        $(window).off('scroll.' + dropdownId + ' resize.' + dropdownId);
    }

    function openMenu() {
        closeOtherCheckboxDropdowns(dropdownId);
        positionCheckboxDropdownMenu($wrap, $menu);
        $menu.show();
        $wrap.addClass('ol-cd-open');
        $searchWrap.find('.ol-cd-search-input').val('').trigger('keyup').focus();
        $(window).on('scroll.' + dropdownId + ' resize.' + dropdownId, function () {
            positionCheckboxDropdownMenu($wrap, $menu);
        });
    }

    $wrap.on('click', '.ol-cd-header', function (e) {
        e.stopPropagation();
        if ($menu.is(':visible')) closeMenu(); else openMenu();
    });

    $menu.on('keyup', '.ol-cd-search-input', function () {
        var term = $(this).val().toLowerCase();
        $optionsWrap.find('.ol-cd-option').each(function () {
            var text = $(this).find('.ol-cd-option-text').text().toLowerCase();
            $(this).toggle(text.indexOf(term) >= 0);
        });
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
    if (G_OL_DropdownLoaded.itemName) return;
    OrderLoadReportService.GetItemMaster()
        .then(function (res) {
            bindDropdown($('#ddlItemName'), res, ['ItemName', 'itemName'], 'Select Item Name...');
            G_OL_DropdownLoaded.itemName = true;
        })
        .catch(function () { toastr.error('Could not load Item list.'); });
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
    return /TMPT_ORDER|ONTIMEDELIVERY|ORDERDETAIL|PENDINGORDER|ON-TIME DELIVERY/i.test(templateKey(tpl));
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

    OrderLoadReportService.GetTempleteList('OrderLoad')//
        .then(function (res) {
            G_OL_Templates = unwrapApiList(res).map(mapTemplate);
            var $ddl = $('#ddlTemplate').empty();

            if (!G_OL_Templates.length) {
                $ddl.append($('<option/>').val('').text('-- No templates --'));
                return;
            }

            G_OL_Templates.forEach(function (t) {
                $ddl.append(
                    $('<option/>')
                        .val(t.code)
                        .text(t.desp)
                        .attr('data-desp', t.desp)
                );
            });

            var wanted = parseInt(preselectCode, 10) || 0;
            if (wanted && findTemplate(wanted)) {
                $ddl.val(String(wanted));
            }

            applyTemplateFilters();
        })
        .catch(function () {
            toastr.error('Could not load report templates.');
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

    var params = {
        reportType: tpl.desp,
        templateCode: tpl.code,
        filterCondition: conditions.filterCondition,
        queryCondition: conditions.queryCondition,
        fromDate: isFlagY(tpl.showFromDate) ? isoToApiDate(fromIso) : '',
        toDate: isFlagY(tpl.showToDate) ? isoToApiDate(toIso) : '',
        userMasterCode: auth.UserMaster_Code || 0,
        marketingManMasterCode: marketingManCode,
        godownMasterCode: filterCodes.godownMasterCode,
        itemGroupMasterCode: filterCodes.itemGroupMasterCode,
        processMasterCode: filterCodes.processMasterCode,
        itemTypeMasterCode: filterCodes.itemTypeMasterCode,
        itemMasterCode: filterCodes.itemMasterCode,
        buyerPOMasterCode: filterCodes.buyerPOMasterCode
    };

    setShowButtonLoading(true);
    setGridLoader(true);
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
            G_OL_ShowTotalKeys = buildShowTotalKeys(unwrapApiList(results[1]));
            bindOrderLoadGrid(results[0]);
        })
        .catch(function (err) {
            showGridPanel(false);
            showApiError(err, 'Could not load report.');
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

function showApiError(err, fallback) {
    var msg = fallback || 'Something went wrong.';
    try {
        if (!err) {
            toastr.error(msg);
            return;
        }
        if (typeof err === 'string' && err.trim()) {
            msg = err;
        } else if (err.responseText) {
            msg = err.responseText;
        } else if (err.responseJSON) {
            msg = err.responseJSON.message || err.responseJSON.Message || err.responseJSON.title || JSON.stringify(err.responseJSON);
        } else if (err.message) {
            msg = err.message;
        } else if (err.statusText) {
            msg = err.statusText;
        }
        msg = String(msg).replace(/^Data Error\s*:\s*/i, '').trim();
        if (msg.length > 300) msg = msg.substring(0, 300) + '...';
    } catch (e) { /* keep fallback */ }
    toastr.error(msg || fallback || 'Something went wrong.');
}

function bindOrderLoadGrid(response) {
    var rows = formatGridRows(unwrapApiList(response));

    if (!rows || !rows.length) {
        toastr.warning('No Data Found');
        showGridPanel(false);
        return;
    }

    var cfg = buildGridConfig(rows);
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
    $('#olRecordCount').text(
        totalRows.toLocaleString('en-IN') + ' record' + (totalRows === 1 ? '' : 's')
    );

    var $search = $('#global-search-wrap-OrderLoadReport');
    if ($search.length) {
        $search.detach().appendTo('#olSearchSlot');
    }

    $('#OrderLoadReport').closest('.table-wrapper').addClass('filtered');
    applyGridCellEnhancements();
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function applyGridCellEnhancements() {
    var $table = $('#OrderLoadReport');
    var colMap = {};

    $table.find('thead th').each(function (i) {
        colMap[$(this).text().trim().toLowerCase()] = i;
    });

    $table.find('tbody tr:not(.total-row):not(.grand-total-row)').each(function () {
        var $cells = $(this).find('td');

        applyColumnClass($cells, colMap, 'order no', 'ol-col-order-no');
        applyColumnClass($cells, colMap, 'order date', 'ol-col-date');
        applyColumnClass($cells, colMap, 'delivery date', 'ol-col-date');
        applyColumnClass($cells, colMap, 'party name', 'ol-col-party');

        applyStatusBadge($cells, colMap, 'order status');
        applyStatusBadge($cells, colMap, 'production status');
    });
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
        } else if (isNumericColumn(col, sample)) {
            NumericFilterColumn.push(col);
            ColumnAlignment[col] = 'right';
            // Total / Grand Total only when template ShowTotal = 'Y'
            if (isShowTotalColumn(col)) {
                totalColumns.push(col);
            }
        } else {
            StringFilterColumn.push(col);
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
    var str = String(val);
    if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
        var d = str.split('T')[0].split('-');
        return d[2] + '-' + d[1] + '-' + d[0];
    }
    return val;
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
            payload.ShowFromDate != null || payload.showFromDate != null) {
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
