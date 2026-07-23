/**
 * IndentMaster.js
 * Page script for Indent / Material Requirement (Store).
 *
 * Features
 * ────────
 * • Date-range filter  (From Date / To Date)
 * • View-Type dropdown  populated from F_LocateConfiguration
 *   (Code + LocateType) via Mode=DDL_LOCATETYPELIST so the options
 *   are 100 % data-driven – no hard-coding of 'Default' / 'Detail'.
 * • Dynamic table via BizsolCustomFilterGrid.CreateDataTable;
 *   columns derived from the API response keys automatically.
 * • Row colouring driven by F_LocateConfiguration.RowColorCodeString
 *   using the __bizsolRowClass hook already supported by Filter.js.
 */
import { IndentMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/IndentMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

// ── Module-level state ──────────────────────────────────────────────────────

var G_IndentList   = [];
var G_LocateConfig = [];   // full config rows (for RowColorCodeString lookup)

// ── Initialization ──────────────────────────────────────────────────────────

$(document).ready(function () {

    // Page heading
    var urlParams = typeof getUrlVars === 'function'
        ? getUrlVars()
        : BizSolHelperFunction.getUrlVars();
    var menuValue = decodeURI(urlParams['menu'] || '');
    if (menuValue && menuValue !== 'undefined' && menuValue !== '') {
        $('#ERPHeading').text(menuValue);
    } else {
        $('#ERPHeading').text('Indent / Material Requirement (Store)');
    }

    _setDefaultDates();

    // Load both lists in parallel: dropdown options + colour config
    Promise.all([
        _fillLocateTypeDropdown(),
        _loadLocateConfig()
    ]);

    // Re-render table when user changes the View-Type dropdown
    $('#ddlLocateType').on('change', function () {
        if (G_IndentList.length > 0) {
            var selectedLocateType = $(this).find('option:selected').data('locate-type');
            _renderTable(G_IndentList, selectedLocateType || '');
        }
    });
});

// ── Date helpers ─────────────────────────────────────────────────────────────

function _setDefaultDates() {
    var today        = new Date();
    var firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    $('#txtFromDate').val(_isoDate(firstOfMonth));
    $('#txtToDate').val(_isoDate(today));
}

function _isoDate(d) {
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}

// ── Populate View-Type dropdown from F_LocateConfiguration ───────────────────

/**
 * Calls DDL_LOCATETYPELIST and fills #ddlLocateType.
 * Each <option> stores:
 *   value       = Code          (numeric key from F_LocateConfiguration)
 *   data-locate-type = LocateType  (the string passed to the LOCATE procedure)
 *   text        = LocateType    (label shown to the user)
 */
function _fillLocateTypeDropdown() {
    return IndentMasterService.GetLocateTypeList()
        .then(function (list) {
            var $ddl = $('#ddlLocateType');
            $ddl.empty();

            if (!Array.isArray(list) || list.length === 0) {
                // Fallback hard-coded options so the page is still usable
                $ddl.append('<option value="11" data-locate-type="Default">Default</option>');
                $ddl.append('<option value="12" data-locate-type="Detail">Detail</option>');
                return;
            }

            list.forEach(function (item) {
                var $opt = $('<option>')
                    .val(item.Code)
                    .attr('data-locate-type', item.LocateType)
                    .text(item.LocateType);
                $ddl.append($opt);
            });

            // Initialise Select2 if available
            if ($.fn.select2) {
                $ddl.select2({ width: '-webkit-fill-available' });
            }
        })
        .catch(function (err) {
            console.warn('IndentMaster – could not load locate-type list:', err);
        });
}

// ── Load full locate config (for RowColorCodeString) ─────────────────────────

function _loadLocateConfig() {
    return IndentMasterService.GetLocateConfig()
        .then(function (res) {
            if (Array.isArray(res) && res.length > 0) {
                G_LocateConfig = res;
            }
        })
        .catch(function (err) {
            console.warn('IndentMaster – could not load locate config:', err);
        });
}

// ── Public: triggered by "Show" button ───────────────────────────────────────

window.LoadIndentList = function () {
    var fromDate = $('#txtFromDate').val();
    var toDate   = $('#txtToDate').val();

    // Read LocateType from the selected option's data attribute
    var $selectedOpt = $('#ddlLocateType').find('option:selected');
    var locateType   = $selectedOpt.data('locate-type') || $selectedOpt.text() || 'Default';

    if (!fromDate || !toDate) {
        toastr.warning('Please select From Date and To Date.');
        return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
        toastr.warning('From Date cannot be greater than To Date.');
        return;
    }
    if (!locateType) {
        toastr.warning('Please select a View Type.');
        return;
    }

    IndentMasterService.GetIndentList(fromDate, toDate, locateType)
        .then(function (data) {
            G_IndentList = data || [];
            _renderTable(G_IndentList, locateType);
        })
        .catch(function (err) {
            toastr.error('Error loading Indent list.');
            console.error('IndentMaster LOCATE error:', err);
        });
};

// ── Table rendering ──────────────────────────────────────────────────────────

function _renderTable(data, locateType) {

    if (!data || data.length === 0) {
        $('#tblIndentHeader').html('');
        $('#tblIndentBody').html(
            '<tr><td colspan="12" class="text-center text-muted py-4">' +
            '<i class="fa fa-inbox fa-2x d-block mb-2 text-muted"></i>' +
            'No records found for the selected period.</td></tr>'
        );
        $('#paginator-IndentMasterTable').html('');
        $('#divIndentGrid').show();
        return;
    }

    // Apply row colour CSS classes via __bizsolRowClass (Filter.js honours this)
    var rowColorMap = _buildColorMap(locateType);
    var augmented = data.map(function (row) {
        var copy = Object.assign({}, row);
        if (rowColorMap) {
            var cssClass = _getRowCssClass(copy, rowColorMap);
            if (cssClass) copy.__bizsolRowClass = cssClass;
        }
        return copy;
    });

    // Auto-detect column categories from key names
    var hiddenColumns = ['Code'];
    var stringCols    = [];
    var numericCols   = [];
    var dateCols      = [];
    var colAlignment  = {};

    Object.keys(augmented[0]).forEach(function (key) {
        if (key === '__bizsolRowClass' || hiddenColumns.indexOf(key) !== -1) return;
        var lk = key.toLowerCase();
        if (_isDateColumn(lk)) {
            dateCols.push(key);
            colAlignment[key] = 'center';
        } else if (_isNumericColumn(lk)) {
            numericCols.push(key);
            colAlignment[key] = 'right';
        } else {
            stringCols.push(key);
        }
    });

    $('#divIndentGrid').show();

    BizsolCustomFilterGrid.CreateDataTable(
        'tblIndentHeader',
        'tblIndentBody',
        augmented,
        false,                      // no standard button column
        [],
        _dedup(stringCols),
        _dedup(numericCols),
        _dedup(dateCols),
        [],
        hiddenColumns,
        colAlignment,
        true,                       // Paginator on
        null, null, null,
        'Search by Indent No, Department, Status…'
    );
}

// ── Row colouring helpers ─────────────────────────────────────────────────────

/**
 * Parse RowColorCodeString for the selected LocateType from G_LocateConfig.
 * Format: "COLUMNNAME#VALUE1=COLOR1,VALUE2=COLOR2"
 * Returns { colName, map: { 'PENDING': 'row-pending', … } } or null.
 */
function _buildColorMap(locateType) {
    if (!G_LocateConfig || !G_LocateConfig.length) return null;

    var cfg = G_LocateConfig.find(function (c) {
        return c.LocateType === locateType && c.RowColorCodeString;
    });
    if (!cfg || !cfg.RowColorCodeString) return null;

    var str     = cfg.RowColorCodeString;
    var hashIdx = str.indexOf('#');
    if (hashIdx < 0) return null;

    var colName = str.substring(0, hashIdx).trim();
    var pairStr = str.substring(hashIdx + 1);

    var map = {};
    pairStr.split(',').forEach(function (pair) {
        var eq  = pair.indexOf('=');
        if (eq < 0) return;
        var val = pair.substring(0, eq).trim().toUpperCase();
        var clr = pair.substring(eq + 1).trim().toUpperCase();

        var cssClass = {
            'YELLOW'      : 'row-pending',
            'GREEN'       : 'row-completed',
            'GREENYELLOW' : 'row-partial',
            'RED'         : 'row-rejected',
            'BLUE'        : 'row-verified',
            'ORANGE'      : 'row-hold'
        }[clr] || '';

        if (cssClass) map[val] = cssClass;
    });

    return { colName: colName, map: map };
}

function _getRowCssClass(rowData, colorMap) {
    var norm   = colorMap.colName.toUpperCase().replace(/\s+/g, '');
    var dataKey = Object.keys(rowData).find(function (k) {
        return k.toUpperCase().replace(/\s+/g, '') === norm;
    });
    if (!dataKey) return '';
    var val = String(rowData[dataKey] || '').trim().toUpperCase();
    return colorMap.map[val] || '';
}

// ── Column-type detectors ─────────────────────────────────────────────────────

function _isDateColumn(lk) {
    return lk.includes('date') && !lk.includes('update') && !lk.includes('create');
}

function _isNumericColumn(lk) {
    return ['qty', 'amount', 'days', 'rate', 'price', 'count',
            'total', 'weight', 'value', 'limit', 'balance']
        .some(function (kw) { return lk.includes(kw); });
}

function _dedup(arr) {
    return arr.filter(function (v, i, a) { return a.indexOf(v) === i; });
}
