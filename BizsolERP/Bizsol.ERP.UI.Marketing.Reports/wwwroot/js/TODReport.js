import { TODReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/TODReportService.js';
import { TODConfigurationMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/TODConfigurationMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

let G_TODReport = [];
let G_HiddenColumns = [];

function firstPayloadArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (typeof payload !== 'object') return [];

    const named = ['data', 'Data', 'result', 'Result', 'table', 'Table', 'items', 'Items', '$values'];
    for (let i = 0; i < named.length; i++) {
        if (Array.isArray(payload[named[i]])) return payload[named[i]];
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

function escapeAttr(val) {
    return String(val == null ? '' : val)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeHtml(val) {
    return String(val == null ? '' : val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function rowValue(row, names) {
    if (!row) return '';
    const keys = Object.keys(row);
    for (let i = 0; i < names.length; i++) {
        const wanted = String(names[i]).replace(/\s+/g, '').toLowerCase();
        for (let k = 0; k < keys.length; k++) {
            if (String(keys[k]).replace(/\s+/g, '').toLowerCase() === wanted) {
                return row[keys[k]];
            }
        }
    }
    return '';
}

function selectedCodes(selector) {
    const vals = $(selector).val();
    if (!vals || !vals.length) return '';
    return (Array.isArray(vals) ? vals : [vals]).filter(function (v) {
        return String(v || '').trim() !== '';
    }).join(',');
}

function initSelect2($el) {
    if (!$.fn.select2 || !$el.length) return;
    if ($el.hasClass('select2-hidden-accessible')) $el.select2('destroy');
    $el.select2({
        placeholder: 'All',
        allowClear: true,
        width: '100%',
        closeOnSelect: false,
        dropdownParent: $(document.body)
    });
}

function fillMultiSelect($el, rows, nameKeys) {
    let html = '';
    (rows || []).forEach(function (row) {
        const code = rowValue(row, ['Code']);
        const name = String(rowValue(row, nameKeys) || '').trim();
        if (code === undefined || code === null || String(code) === '' || String(code) === '0' || !name) return;
        html += '<option value="' + escapeAttr(code) + '">' + escapeAttr(name) + '</option>';
    });
    $el.html(html);
    initSelect2($el);
}

function isHiddenColumn(key) {
    const name = String(key || '').trim();
    if (!name || name === '_search') return true;
    if (/^code$/i.test(name)) return true;
    if (/master_code$/i.test(name)) return true;
    if (/_code$/i.test(name)) return true;
    return false;
}

function isEmptyValue(value) {
    if (value === null || value === undefined) return true;
    const text = String(value).trim();
    return text === '' || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined';
}

function isNumericValue(value) {
    if (isEmptyValue(value)) return false;
    if (typeof value === 'number') return isFinite(value);
    const text = String(value).replace(/,/g, '').trim();
    return text !== '' && !isNaN(text) && isFinite(Number(text));
}

function formatCell(value, numeric) {
    if (isEmptyValue(value)) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
    }
    if (numeric && isNumericValue(value)) {
        return Number(String(value).replace(/,/g, '')).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    }
    return String(value);
}

function classifyColumns(rows) {
    const first = rows[0] || {};
    const keys = Object.keys(first);
    const hidden = keys.filter(isHiddenColumn);
    hidden.push('_search');

    const sample = rows.slice(0, 80);
    keys.forEach(function (key) {
        if (hidden.indexOf(key) !== -1) return;
        const allEmpty = sample.every(function (row) { return isEmptyValue(row[key]); });
        if (allEmpty) hidden.push(key);
    });

    const visible = keys.filter(function (key) { return hidden.indexOf(key) === -1; });
    const numeric = [];
    visible.forEach(function (key) {
        const values = sample.map(function (row) { return row[key]; }).filter(function (value) {
            return !isEmptyValue(value);
        });
        const numericCount = values.filter(isNumericValue).length;
        if (values.length && numericCount === values.length) numeric.push(key);
    });

    return { hidden: hidden, visible: visible, numeric: numeric };
}

function cleanCell(value) {
    if (isEmptyValue(value)) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
    }
    return value;
}

function enhanceRows(rows) {
    return (rows || []).map(function (row, index) {
        const enhanced = { 'S.No': index + 1 };
        Object.keys(row || {}).forEach(function (key) {
            if (key === 'S.No' || key === '_search') return;
            enhanced[key] = cleanCell(row[key]);
        });
        enhanced._search = Object.keys(enhanced).map(function (key) {
            if (isHiddenColumn(key) || key === 'S.No' || isEmptyValue(enhanced[key])) return '';
            return String(enhanced[key]);
        }).join(' ').toLowerCase();
        return enhanced;
    });
}

function filterReportRows(rows) {
    const term = ($('#txtTODReportSearch').val() || '').trim().toLowerCase();
    if (!term) return rows || [];
    return (rows || []).filter(function (row) {
        return (row._search || '').indexOf(term) !== -1;
    });
}

function BindTODReport() {
    const rows = filterReportRows(G_TODReport);
    $('#todrRecordCount').text(
        rows.length === G_TODReport.length
            ? rows.length + (rows.length === 1 ? ' record' : ' records')
            : rows.length + ' of ' + G_TODReport.length + ' records'
    );

    if (!rows.length) {
        $('#TODReport-header').empty();
        $('#TODReport-body').empty();
        $('#paginator-TODReport').empty();
        return;
    }

    const cols = classifyColumns(rows);
    G_HiddenColumns = cols.hidden;
    const stringFilterColumn = cols.visible.filter(function (key) {
        return key !== 'S.No' && cols.numeric.indexOf(key) === -1;
    });
    const numericFilterColumn = cols.numeric.filter(function (key) {
        return key !== 'S.No';
    });
    const columnAlignment = { 'S.No': 'right' };
    cols.numeric.forEach(function (key) { columnAlignment[key] = 'right'; });

    BizsolCustomFilterGrid.CreateDataTable(
        'TODReport-header',
        'TODReport-body',
        rows,
        false,
        [],
        stringFilterColumn,
        numericFilterColumn,
        [],
        [],
        cols.hidden,
        columnAlignment,
        true
    );

    window.Paginator_TODReport = true;
    window.itemsPerPage_TODReport = 10;
    if (typeof window.createPaginator === 'function') {
        window.createPaginator('TODReport', 'TODReport-body');
    }
    if (typeof window.renderTableWithPagination === 'function') {
        window.renderTableWithPagination('TODReport', 'TODReport-body');
    }
}

function ShowEmptyState() {
    G_TODReport = [];
    G_HiddenColumns = [];
    $('#tblTODReport').removeClass('is-open');
    $('#todrEmptyState').show();
    $('#btnDownload').prop('disabled', true);
    $('#txtTODReportSearch').val('');
    $('#TODReport-header').empty();
    $('#TODReport-body').empty();
    $('#paginator-TODReport').empty();
}

function ShowGrid() {
    $('#todrEmptyState').hide();
    $('#tblTODReport').addClass('is-open');
    $('#btnDownload').prop('disabled', false);
}

function setShowLoading(isLoading) {
    $('#btnShow').prop('disabled', isLoading);
    $('#btnShowText').text(isLoading ? 'Loading...' : 'Show');
}

function currentFilter() {
    return {
        AccountMaster_Codes: selectedCodes('#ddlParty'),
        Scheme_Codes: selectedCodes('#ddlScheme'),
        CreditLimitAsPer: ($('#ddlCreditLimitAsPer').val() || '').trim(),
        // ItemMaster_Codes: selectedCodes('#ddlItem'),
        // ItemSizeParameter_Codes: selectedCodes('#ddlSizeParameter'),
        AccountType: ($('#ddlAccountType').val() || '').trim()
    };
}

function LoadFilters() {
    TODConfigurationMasterService.GetTODConfigurationList().then(function (res) {
        fillMultiSelect($('#ddlScheme'), firstPayloadArray(res), ['TOD Name', 'TODConfigurationDesp', 'Desp', 'Scheme']);
    }).catch(function () {
        fillMultiSelect($('#ddlScheme'), [], ['TOD Name']);
    });

    TODConfigurationMasterService.GetPartyList(0).then(function (res) {
        fillMultiSelect($('#ddlParty'), firstPayloadArray(res), ['AccountDesp', 'Party Name', 'Desp']);
    }).catch(function () {
        fillMultiSelect($('#ddlParty'), [], ['AccountDesp']);
    });

    if ($('#ddlItem').length) {
        TODConfigurationMasterService.GetItemList(0).then(function (res) {
            fillMultiSelect($('#ddlItem'), firstPayloadArray(res), ['Desp', 'ItemName', 'Item Name']);
        }).catch(function () {
            fillMultiSelect($('#ddlItem'), [], ['Desp']);
        });
    }

    if ($('#ddlSizeParameter').length) {
        TODConfigurationMasterService.GetSizeParameterList().then(function (res) {
            fillMultiSelect($('#ddlSizeParameter'), firstPayloadArray(res), ['Desp', 'Size Parameter Name']);
        }).catch(function () {
            fillMultiSelect($('#ddlSizeParameter'), [], ['Desp']);
        });
    }
}

function ShowData() {
    setShowLoading(true);
    if (typeof window.Showloader === 'function') window.Showloader();

    TODReportService.GetTODReport(currentFilter()).then(function (response) {
        const status = response && (response.Status || response.status);
        const msg = response && (response.Msg || response.msg || response.message);
        const rows = firstPayloadArray(response);
        if (typeof window.HideLoader === 'function') window.HideLoader();
        setShowLoading(false);

        if (status && String(status).toUpperCase() === 'N') {
            ShowEmptyState();
            toastr.error(msg || 'No Data Found');
            return;
        }

        if (!rows.length) {
            ShowEmptyState();
            toastr.error(msg || 'No Data Found');
            return;
        }

        G_TODReport = enhanceRows(rows);
        ShowGrid();
        BindTODReport();
    }).catch(function (error) {
        if (typeof window.HideLoader === 'function') window.HideLoader();
        setShowLoading(false);
        ShowEmptyState();
        toastr.error((error && (error.Msg || error.message)) || 'Failed to load TOD Report.');
    });
}

function Download() {
    if (!G_TODReport.length) {
        toastr.error('No data to export.');
        return;
    }
    ExportToExcelControl.ExportToExcel(G_TODReport, G_HiddenColumns, 'TODReport');
}

function ResetReport() {
    $('#ddlAccountType').val('');
    $('#ddlCreditLimitAsPer').val('');
    $('#ddlScheme, #ddlParty, #ddlItem, #ddlSizeParameter').val(null).trigger('change');
    ShowEmptyState();
}

$(document).ready(function () {
    if (BizSolHelperFunction && typeof BizSolHelperFunction.setHeadingFromQueryParam === 'function') {
        BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    }
    $('#ERPHeading').text($('#ERPHeading').text() || 'TOD Report');

    LoadFilters();
    ShowEmptyState();

    $('#txtTODReportSearch').on('input', function () {
        if (G_TODReport.length) BindTODReport();
    });
    $('#btnShow').click(ShowData);
    $('#btnDownload').click(Download);
    $('#btnReset').click(ResetReport);
});

window.ShowData = ShowData;
window.Download = Download;
window.ResetReport = ResetReport;
