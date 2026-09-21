/**
 * IndentMaster.js
 * Indent / Material Requirement (Store)
 * List + Create New form (same flow as PurchaseOrderStore).
 */
import { IndentMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/IndentMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { initializeObjectlistControl } from '../../Bizsol.WebERP.UI.Shared/js/Pages/CustomControl/_ObjectListControlPage.js';

var G_IndentList        = [];
var G_LocateConfig      = [];
var G_ItemList          = [];
var G_AllItemList       = [];
var G_CategoryList      = [];
var G_DepartmentList    = [];
var G_VendorList        = [];
var G_CurrencyList      = [];
var G_UOMList           = [];
var G_DivisionList      = [];
var G_SubDivisionList   = [];
var G_ItemRowCount      = 0;
var G_FormReady         = false;
var G_EditMode          = 'New';
var G_SkipCategoryChange = false;
var G_CurrentItemRowId   = 0;
var G_CurrentVendorRowId = 0;
var G_IndentObjKeepValue = '';
var G_IndentMobileEditRowId = null;
var INDENT_OBJ_MODAL     = 'IndentLookupObjectListModal';

function _isIndentMobile() {
    return window.innerWidth <= 768;
}

function _parseIndentObjListOpen(value) {
    var typed = String(value == null ? '' : value);
    var raw = typed.trim();
    var useContains = raw.indexOf('*') >= 0;
    var cleaned = raw.replace(/\*/g, '').trim();
    var isBrowse = cleaned === '' || cleaned === '.' || cleaned === '..';
    return {
        typed: typed,
        matchType: useContains ? 'contains' : 'startswith',
        searchValue: isBrowse ? '.' : cleaned
    };
}

function _prepIndentObjListModal() {
    $('#IndentItemObjectListModal, #IndentVendorObjectListModal').remove();
    $('#' + INDENT_OBJ_MODAL).off('hidden.bs.modal.indentItem hidden.bs.modal.indentVendor');
}

$(document).ready(function () {
    var urlParams = typeof getUrlVars === 'function'
        ? getUrlVars()
        : BizSolHelperFunction.getUrlVars();
    var menuValue = decodeURI(urlParams['menu'] || '');
    if (menuValue && menuValue !== 'undefined' && menuValue !== '') {
        $('#ERPHeading').text(menuValue);
    } else {
        $('#ERPHeading').text('Indent/Material Requirement (Store)');
    }

    _setDefaultDates();
    _bindIndentItemGridKeys();

    Promise.all([
        _fillLocateTypeDropdown(),
        _loadLocateConfig()
    ]);

    $('#ddlLocateType').on('change', function () {
        if (G_IndentList.length > 0) {
            var selectedLocateType = $(this).find('option:selected').data('locate-type');
            _renderTable(G_IndentList, selectedLocateType || '');
        }
    });
});

function _setDefaultDates() {
    var today        = new Date();
    var firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    $('#txtFromDate').val(_isoDate(firstOfMonth));
    $('#txtToDate').val(_isoDate(today));
}

function _isoDate(d) {
    if (!d) return '';
    if (typeof d === 'string') {
        var parsed = new Date(d);
        if (!isNaN(parsed.getTime())) d = parsed;
        else return d.length >= 10 ? d.substring(0, 10) : d;
    }
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}

function _toList(res) {
    if (!res) return [];
    if (Array.isArray(res)) {
        if (res.length && Array.isArray(res[0]) && typeof res[0][0] === 'object') return res[0];
        return res;
    }
    if (Array.isArray(res.Table)) return res.Table;
    if (Array.isArray(res.table)) return res.table;
    if (Array.isArray(res.Data)) return res.Data;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.Result)) return res.Result;
    if (Array.isArray(res.result)) return res.result;
    return [];
}

function _fillSelect($el, list, placeholder) {
    $el.empty();
    $el.append($('<option>').val('').text(placeholder || '-- Select --'));
    (list || []).forEach(function (item) {
        var code = item.Code ?? item.code ?? item.CategoryMaster_Code ?? '';
        var desp = item.Desp ?? item.desp ?? item.GodownName ?? item.CategoryName
                ?? item.UserName ?? item.ItemName ?? item.DepartmentName ?? '';
        $el.append($('<option>').val(code).text(desp));
    });
}

function _initSelect2($el, $parent) {
    if (!$.fn.select2 || !$el.length) return;
    if ($el.hasClass('select2-hidden-accessible')) {
        $el.select2('destroy');
    }
    var opts = { width: '100%', placeholder: $el.find('option:first').text() || '-- Select --', allowClear: true };
    if ($parent && $parent.length) opts.dropdownParent = $parent;
    $el.select2(opts);
}

function _auth() {
    try { return JSON.parse(sessionStorage.getItem('authKey') || '{}'); }
    catch (e) { return {}; }
}

function _fillLocateTypeDropdown() {
    return IndentMasterService.GetLocateTypeList()
        .then(function (list) {
            var $ddl = $('#ddlLocateType');
            $ddl.empty();
            list = _toList(list);

            if (!list.length) {
                $ddl.append('<option value="11" data-locate-type="Default">Default</option>');
                $ddl.append('<option value="12" data-locate-type="Detail">Detail</option>');
                return;
            }

            list.forEach(function (item) {
                $ddl.append(
                    $('<option>')
                        .val(item.Code)
                        .attr('data-locate-type', item.LocateType)
                        .text(item.LocateType)
                );
            });

            if ($.fn.select2) {
                $ddl.select2({ width: '-webkit-fill-available' });
            }
        })
        .catch(function (err) {
            console.warn('IndentMaster – could not load locate-type list:', err);
            var $ddl = $('#ddlLocateType');
            $ddl.empty();
            $ddl.append('<option value="11" data-locate-type="Default">Default</option>');
            $ddl.append('<option value="12" data-locate-type="Detail">Detail</option>');
        });
}

function _loadLocateConfig() {
    return IndentMasterService.GetLocateConfig()
        .then(function (res) {
            var list = _toList(res);
            if (list.length) G_LocateConfig = list;
        })
        .catch(function (err) {
            console.warn('IndentMaster – could not load locate config:', err);
        });
}

window.LoadIndentList = function () {
    var fromDate = $('#txtFromDate').val();
    var toDate   = $('#txtToDate').val();
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
            G_IndentList = _toList(data);
            _renderTable(G_IndentList, locateType);
        })
        .catch(function (err) {
            toastr.error('Error loading Indent list.');
            console.error('IndentMaster LOCATE error:', err);
        });
};

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

    var rowColorMap = _buildColorMap(locateType);
    var augmented = data.map(function (row, index) {
        var copy = Object.assign({ '#': index + 1 }, row);
        copy['#'] = index + 1;
        if (rowColorMap) {
            var cssClass = _getRowCssClass(copy, rowColorMap);
            if (cssClass) copy.__bizsolRowClass = cssClass;
        }
        var code = copy.Code ?? copy.code ?? 0;
        if (code) {
            var status = (copy.Status || copy.status || '').replace(/'/g, '');
            copy.Action =
                `<button class="btn btn-warning icon-height mb-1" title="Edit" onclick="OpenIndentForm('Edit',${code},'${status}')"><i class="fa fa-edit"></i></button>` +
                ` <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteIndentRow(${code})"><i class="fa fa-trash"></i></button>`;
        }
        return copy;
    });

    var hiddenColumns = ['Code', 'code','__bizsolRowClass'];
    var stringCols    = [];
    var numericCols   = [];
    var dateCols      = [];
    var colAlignment  = { '#': 'left', Action: 'left' };

    Object.keys(augmented[0]).forEach(function (key) {
        if (key === '#' || key === '__bizsolRowClass' || hiddenColumns.indexOf(key) !== -1 || key === 'Action') return;
        var lk = key.toLowerCase();
        if (_isIndentNoColumn(lk)) {
            stringCols.push(key);
            colAlignment[key] = 'right';
        } else if (_isDateColumn(lk)) {
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
        false,
        [],
        _dedup(stringCols),
        _dedup(numericCols),
        _dedup(dateCols),
        [],
        hiddenColumns,
        colAlignment,
        true,
        null, null, null,
        'Search by Indent No, Department, Status…'
    );

    _applyIndentHeaderAlign(augmented[0], colAlignment);
    _fitIndentListColumns();
}

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

function _isDateColumn(lk) {
    return lk.includes('date') && !lk.includes('update') && !lk.includes('create');
}

function _isIndentNoColumn(lk) {
    var n = (lk || '').replace(/[\s._]/g, '');
    return n === 'indentno' || n.indexOf('indentno') === 0;
}

function _isNumericColumn(lk) {
    return ['qty', 'amount', 'days', 'rate', 'price', 'count',
            'total', 'weight', 'value', 'limit', 'balance']
        .some(function (kw) { return lk.includes(kw); });
}

function _dedup(arr) {
    return arr.filter(function (v, i, a) { return a.indexOf(v) === i; });
}

function _applyIndentHeaderAlign(sampleRow, colAlignment) {
    if (!sampleRow || !colAlignment) return;
    var keys = Object.keys(sampleRow);
    $('#IndentMasterTable thead th').each(function (i) {
        var key = keys[i];
        var align = key ? colAlignment[key] : '';
        if (align) $(this).css('text-align', align);
    });
}

function _indentHeaderLabel($th) {
    var label = ($th.find('.filter-table-heading').first().text() || $th.text() || '');
    return label.replace(/\s+/g, ' ').trim();
}

function _fitIndentListColumns() {
    var $tbl = $('#IndentMasterTable');
    if (!$tbl.length) return;

    var actionIndex = -1;
    $tbl.find('thead th').each(function (i) {
        var isAction = _indentHeaderLabel($(this)) === 'Action';
        $(this).toggleClass('indent-action-col', isAction);
        if (isAction) actionIndex = i;
    });

    $tbl.find('tbody tr').each(function () {
        $(this).children('td').each(function (i) {
            $(this).toggleClass('indent-action-col', i === actionIndex);
        });
    });

    $('#indentListColFit').remove();
    if (actionIndex >= 0) {
        var n = actionIndex + 1;
        $('head').append(
            '<style id="indentListColFit">' +
            '#IndentMasterTable th:nth-child(' + n + '),' +
            '#IndentMasterTable td:nth-child(' + n + '){' +
            'width:auto!important;min-width:88px;text-align:left!important;}' +
            '</style>'
        );
    }

    var $pager = $('#paginator-IndentMasterTable');
    $pager.off('click.indentFit').on('click.indentFit', function () {
        setTimeout(_fitIndentListColumns, 0);
    });
}

function _ensureFormLookups() {
    if (G_FormReady) return Promise.resolve();

    return Promise.all([
        IndentMasterService.GetWarehouseList().catch(function () { return []; }),
        IndentMasterService.GetCategoryList().catch(function () { return []; }),
        IndentMasterService.GetUserList().catch(function () { return []; }),
        IndentMasterService.GetDepartmentList().catch(function () { return []; }),
        IndentMasterService.GetItemList(0).catch(function () { return []; }),
        IndentMasterService.GetConfig().catch(function () { return []; }),
        IndentMasterService.GetVendorList().catch(function () { return []; }),
        IndentMasterService.GetCurrencyList().catch(function () { return []; }),
        IndentMasterService.GetUOMList().catch(function () { return []; }),
        IndentMasterService.GetDivisionList().catch(function () { return []; }),
        IndentMasterService.GetSubDivisionList().catch(function () { return []; })
    ]).then(function (results) {
        _fillSelect($('#frmDdlWarehouse'), _toList(results[0]), '-- Select Warehouse --');
        G_CategoryList   = _toList(results[1]);
        _fillCategorySelect($('#frmDdlCategory'), G_CategoryList);
        _fillSelect($('#frmDdlRequestedBy'), _toList(results[2]), '-- Select User --');
        G_DepartmentList = _toList(results[3]);
        G_AllItemList    = _toList(results[4]);
        G_ItemList       = G_AllItemList.slice();
        G_VendorList     = _toList(results[6]);
        G_CurrencyList   = _toList(results[7]);
        G_UOMList        = _toList(results[8]);
        G_DivisionList   = _toList(results[9]);
        G_SubDivisionList = _toList(results[10]);
        _applyConfig(_toList(results[5])[0] || {});
        _initSelect2($('#frmDdlWarehouse'));
        _initSelect2($('#frmDdlCategory'));
        _initSelect2($('#frmDdlRequestedBy'));
        G_FormReady = true;
        _refreshLongestLookupNames();
        FitIndentItemColumns();
    });
}

function _applyConfig(cfg) {
    var show = function (flag, selector) {
        var on = String(flag == null ? 'Y' : flag).toUpperCase() !== 'N';
        $(selector).toggle(on);
    };
    show(cfg.ShowWarehouse, '.cfg-warehouse');
    show(cfg.ShowItemCategory, '.cfg-category');
    show(cfg.ShowSpecialComments, '.cfg-special');
    show(cfg.ShowRequestedBy, '.cfg-requested');
    show(cfg.ShowAuthorizedBy, '.cfg-authorized');

    var $tbl = $('#tblIndentItems');
    $tbl.toggleClass('hide-vendor', String(cfg.ShowVendor || 'Y').toUpperCase() === 'N');
    $tbl.toggleClass('hide-currency', String(cfg.ShowCurrency || 'Y').toUpperCase() === 'N');
    $tbl.toggleClass('hide-division', String(cfg.ShowDivision || 'Y').toUpperCase() === 'N');
    $tbl.toggleClass('hide-rate', String(cfg.ShowRate || 'Y').toUpperCase() === 'N');

    if (String(cfg.ShowWarehouse || 'Y').toUpperCase() === 'N') {
        var loginGodown = parseInt(_auth().WebERPLoginGodownMaster_Code || 0, 10) || 0;
        if (loginGodown) $('#frmDdlWarehouse').val(String(loginGodown));
    }
}

function _resetForm() {
    $('#frmHfCode').val('0');
    $('#frmTxtIndentNo').val('');
    $('#frmTxtIndentDate').val(_isoDate(new Date()));
    $('#frmDdlWarehouse').val('');
    $('#frmDdlCategory').val('');
    _applyItemCategoryFilter('');
    $('#frmTxtStatus').val('Pending');
    $('#frmTxtFinYear').val(BizSolHelperFunction.getFinancialYear());
    $('#frmTxtDueDate').val('');
    $('#frmChkVerified').prop('checked', false);
    $('#frmTxtVerifiedAudit').text('');
    $('#frmDdlRequestedBy').val('');
    $('#frmTxtRequestedName').val('');
    $('#frmTxtAuthorizedBy').val('');
    $('#frmHfDatabaseLocation').val('0');
    $('#frmTxtRemarks').val('');
    $('#frmTxtSpecialComments').val('');
    $('#frmTxtCreatedAudit').val('');
    $('#frmTxtUpdatedAudit').val('');
    $('#frmTxtCheckedAudit').val('');
    $('#divIndentAudit').hide();
    $('.cfg-verified').hide();
    $('#tblIndentItemsBody').html('');
    G_ItemRowCount = 0;

    if ($.fn.select2) {
        $('#frmDdlWarehouse').val(null).trigger('change');
        $('#frmDdlCategory').val(null).trigger('change');
        $('#frmDdlRequestedBy').val(null).trigger('change');
    }
}

function _optionDesp(item) {
    return item.Desp ?? item.desp
        ?? item.DivisionDesp ?? item.divisionDesp
        ?? item.SubDivisionDesp ?? item.subDivisionDesp
        ?? item.SubDepartmentName ?? item.subDepartmentName
        ?? item.DepartmentName ?? item.departmentName
        ?? item.Name ?? item.ItemName ?? item.UOM ?? '';
}

function _optionCode(item) {
    return item.Code ?? item.code
        ?? item.SubDivisionMaster_Code ?? item.subDivisionMaster_Code
        ?? '';
}

var G_FitItemColsTimer = null;
var G_LongestItemName  = '-- Select Item --';
var G_LongestVendorName = 'Vendor / Party';

function _refreshLongestLookupNames() {
    G_LongestItemName = _longestText(
        (G_ItemList && G_ItemList.length ? G_ItemList : G_AllItemList || []).map(function (it) {
            return _itemDisplayName(it);
        }),
        '-- Select Item --'
    );
    G_LongestVendorName = _longestText(_listDesps(G_VendorList), 'Vendor / Party');
}

function _longestText(values, fallback) {
    var best = fallback || '';
    (values || []).forEach(function (v) {
        var t = String(v == null ? '' : v);
        if (t.length > best.length) best = t;
    });
    return best;
}

function _measureTextPx(text) {
    var el = document.getElementById('indentColMeasure');
    if (!el) {
        el = document.createElement('span');
        el.id = 'indentColMeasure';
        el.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;font-size:0.79rem;font-family:Segoe UI,Tahoma,sans-serif;';
        document.body.appendChild(el);
    }
    el.textContent = text || '';
    return el.offsetWidth || (String(text || '').length * 8);
}

function _colPx(text, minPx, maxPx, extra) {
    return Math.min(Math.max(_measureTextPx(text) + (extra || 32), minPx), maxPx);
}

function _listDesps(list) {
    return (list || []).map(function (item) { return _optionDesp(item); });
}

window.FitIndentItemColumns = function () {
    if (G_FitItemColsTimer) clearTimeout(G_FitItemColsTimer);
    G_FitItemColsTimer = setTimeout(_fitItemDetailsColumnsNow, 40);
};

function _fitItemDetailsColumnsNow() {
    var $tbl = $('#tblIndentItems');
    if (!$tbl.length) return;

    var itemTexts = ['-- Select Item --', 'Item Name', G_LongestItemName];
    $('#tblIndentItemsBody .indent-item-lookup').each(function () {
        itemTexts.push(this.value);
    });

    var specTexts = ['Specification'];
    $('#tblIndentItemsBody input[id^="frmTxtSpec_"]').each(function () {
        specTexts.push(this.value || this.placeholder || '');
    });

    var vendorTexts = ['Vendor / Party', '-- Vendor --', G_LongestVendorName];
    $('#tblIndentItemsBody .indent-vendor-lookup').each(function () {
        vendorTexts.push(this.value);
    });
    var uomTexts = ['UOM'].concat(_listDesps(G_UOMList));
    $('#tblIndentItemsBody input[id^="frmTxtUom_"]').each(function () { uomTexts.push(this.value); });
    var currTexts = ['Currency', '-- Currency --'].concat(_listDesps(G_CurrencyList));
    var divTexts = ['Sub-Division', '-- Division --'].concat(_listDesps(G_DivisionList)).concat(_listDesps(G_SubDivisionList));
    var deptTexts = ['Department', '-- Department --'].concat(_listDesps(G_DepartmentList));
    var remarkTexts = ['Line remarks'];
    $('#tblIndentItemsBody input[id^="frmTxtLineRemarks_"]').each(function () {
        remarkTexts.push(this.value || this.placeholder || '');
    });

    var widths = {
        'col-item': _colPx(_longestText(itemTexts), 170, 320, 40),
        'col-spec': _colPx(_longestText(specTexts), 120, 280, 28),
        'col-vendor': _colPx(_longestText(vendorTexts), 140, 260, 36),
        'col-uom': _colPx(_longestText(uomTexts), 70, 120, 24),
        'col-qty': 92,
        'col-rate': 80,
        'col-currency': _colPx(_longestText(currTexts), 100, 160, 28),
        'col-stock': 88,
        'col-division': _colPx(_longestText(divTexts), 120, 200, 32),
        'col-dept': _colPx(_longestText(deptTexts), 120, 200, 32),
        'col-subdept': 140,
        'col-lineremarks': _colPx(_longestText(remarkTexts), 120, 220, 24)
    };

    Object.keys(widths).forEach(function (cls) {
        $tbl.find('th.' + cls + ', td.' + cls).css({ minWidth: widths[cls] + 'px', width: widths[cls] + 'px' });
    });
    $tbl.find('.indent-item-lookup-wrap, .indent-item-lookup').css('min-width', Math.max(widths['col-item'] - 10, 160) + 'px');
    $tbl.find('.indent-vendor-lookup-wrap, .indent-vendor-lookup').css('min-width', Math.max(widths['col-vendor'] - 10, 140) + 'px');
}

function _buildLookupSelect(id, list, selected, placeholder, onchange) {
    var html = `<select id="${id}" class="form-control form-control-sm"${onchange ? ` onchange="${onchange}"` : ''}>`;
    html += `<option value="">${placeholder || '-- Select --'}</option>`;
    (list || []).forEach(function (item) {
        var code = _optionCode(item);
        var sel  = String(code) === String(selected) ? ' selected' : '';
        html += `<option value="${code}"${sel}>${_esc(_optionDesp(item))}</option>`;
    });
    html += '</select>';
    return html;
}

function _findItem(code) {
    var key = String(code || '');
    if (!key) return null;
    var lists = [G_ItemList, G_AllItemList];
    for (var i = 0; i < lists.length; i++) {
        var found = (lists[i] || []).filter(function (item) {
            return String(item.Code ?? item.code) === key;
        })[0];
        if (found) return found;
    }
    return null;
}

function _itemDisplayName(item) {
    if (!item) return '';
    return item.Desp ?? item.ItemName ?? item['Item Name'] ?? '';
}

function _buildItemSelect(rowId, selected) {
    var item = selected ? _findItem(selected) : null;
    var name = item ? _itemDisplayName(item) : '';
    return '<div class="indent-item-lookup-wrap">' +
        `<input type="text" id="frmTxtItem_${rowId}" class="form-control form-control-sm indent-item-lookup"` +
        ` value="${_esc(name)}" placeholder="-- Select Item --" autocomplete="off" />` +
        `<input type="hidden" id="frmDdlItem_${rowId}" value="${_esc(selected || '')}" />` +
        '</div>';
}

window.OnIndentItemLookupKey = function (e, rowId) {
    _onIndentGridKey(e, rowId, 'item');
};

function _itemStockValue(item) {
    if (!item) return 0;
    var v = item.StockInStore ?? item.stockInStore ?? item['Stock In Store'] ?? item.StockQty ?? item.stockQty;
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
}

function _itemObjListData() {
    return (G_ItemList || []).map(function (item) {
        return {
            'Item Name': item.Desp ?? item.ItemName ?? '',
            'Item Code': item.ItemCode ?? '',
            UOM: item.UOM ?? item.uom ?? '',
            'Item Specification': item.ItemSpecification ?? item.itemSpecification ?? '',
            'MRP Value': item.MRPValue != null ? item.MRPValue : (item.mrpValue != null ? item.mrpValue : 0),
            'Stock In Store': _itemStockValue(item),
            Category: item.ItemType ?? item.itemType ?? item.Category ?? item.CategoryName ?? '',
            Code: item.Code ?? item.code,
            UOMMaster_Code: item.UOMMaster_Code ?? item.uomMaster_Code ?? 0,
            Desp: item.Desp ?? item.ItemName ?? '',
            ItemSpecification: item.ItemSpecification ?? item.itemSpecification ?? '',
            MRPValue: item.MRPValue != null ? item.MRPValue : (item.mrpValue != null ? item.mrpValue : 0),
            StockInStore: _itemStockValue(item)
        };
    });
}

window.ShowIndentItemObjectList = function (rowId, value) {
    var list = _itemObjListData();
    if (!list.length) {
        toastr.warning('No item data available.');
        return;
    }
    var open = _parseIndentObjListOpen(value);
    if (!String(value || '').trim()) {
        toastr.warning('Type .. and press Enter to open the item list.');
        return;
    }
    G_CurrentVendorRowId = 0;
    G_CurrentItemRowId = rowId;
    G_IndentObjKeepValue = open.typed;
    _prepIndentObjListModal();
    initializeObjectlistControl({
        ModalId: INDENT_OBJ_MODAL,
        searchvalue: open.searchValue,
        MatchType: open.matchType,
        MultiSelect: _isLastIndentItemRow(rowId),
        ClientOrderProjectData: list,
        CallBackFunctionName_btnDone: 'onIndentItemSelected',
        DefaultColumnfilter: 'Item Name',
        ModalTitle: 'Select Item',
        NumericColumns: ['MRP Value', 'Stock In Store'],
        Columns: [
            { field: 'Item Name', header: 'Item Name', visible: true },
            { field: 'Item Code', header: 'Item Code', visible: true },
            { field: 'UOM', header: 'UOM', visible: true },
            { field: 'Item Specification', header: 'Item Specification', visible: true },
            { field: 'MRP Value', header: 'MRP Value', visible: true },
            { field: 'Stock In Store', header: 'Stock In Store', visible: true },
            { field: 'Category', header: 'Category', visible: true },
            { field: 'Code', visible: false },
            { field: 'UOMMaster_Code', visible: false },
            { field: 'Desp', visible: false },
            { field: 'ItemSpecification', visible: false },
            { field: 'MRPValue', visible: false },
            { field: 'StockInStore', visible: false }
        ]
    });
    var $itemModal = $('#' + INDENT_OBJ_MODAL);
    $itemModal.find('.modal-dialog').removeClass('modal-lg').addClass('modal-xl')
        .css({ 'max-width': '1140px', width: '94vw' });
    $itemModal.find('.modal-body').children('div').eq(1).css({ 'overflow-x': 'auto', 'overflow-y': 'auto' });
    _raiseIndentObjListZIndex();
    $itemModal.off('hidden.bs.modal.indentItem').on('hidden.bs.modal.indentItem', function () {
        if (!G_CurrentItemRowId) return;
        var restoreId = G_CurrentItemRowId;
        G_CurrentItemRowId = 0;
        G_IndentObjKeepValue = '';
        _clearIndentItemLookup(restoreId);
    });
};

function _isLastIndentItemRow(rowId) {
    if (rowId === 'mobile') return false;
    var maxId = 0;
    $('#tblIndentItemsBody tr').each(function () {
        var id = parseInt(String($(this).attr('id') || '').replace('indentItemRow_', ''), 10) || 0;
        if (id > maxId) maxId = id;
    });
    return parseInt(rowId, 10) === maxId;
}

function _clearIndentItemLookup(rowId) {
    if (rowId === 'mobile') {
        $('#indentMobileTxtItem').val('');
        $('#indentMobileDdlItem').val('').trigger('change');
        return;
    }
    $('#frmTxtItem_' + rowId).val('');
    $('#frmDdlItem_' + rowId).val('');
}

function _raiseIndentObjListZIndex() {
    setTimeout(function () {
        var $m = $('#' + INDENT_OBJ_MODAL);
        $m.css('z-index', 1080);
        $('.modal-backdrop').last().css('z-index', 1075);
        $m.find('[data-bs-dismiss="modal"]').off('click.indentObjClose').on('click.indentObjClose', function (e) {
            e.preventDefault();
            $m.modal('hide');
        });
    }, 120);
}

window.onIndentItemSelected = function (response) {
    if (!response || !response.length || !G_CurrentItemRowId) return;
    var startId = G_CurrentItemRowId;
    G_CurrentItemRowId = 0;
    if (startId === 'mobile') {
        _applyItemToMobileModal(response[0]);
        return;
    }
    response.forEach(function (item, index) {
        var rowId = startId;
        if (index > 0) {
            AddIndentItemRow(null, true);
            rowId = G_ItemRowCount;
        }
        _applyItemFromObj(rowId, item);
    });
    if (_isIndentMobile()) RenderIndentMobileItemCards();
    if (startId && startId !== 'mobile') _indentFocus('#frmTxtSpec_' + startId);
};

function _applyItemToMobileModal(item) {
    if (!item) return;
    var code = item.Code ?? item.code ?? 0;
    $('#indentMobileDdlItem').val(code || '');
    $('#indentMobileTxtItem').val(_itemDisplayName(item) || item.Desp || '');
    OnIndentMobileItemChange();
}

function _applyItemFromObj(rowId, item) {
    if (!item) return;
    var code = item.Code ?? item.code ?? 0;
    var desp = _itemDisplayName(item);
    var master = _findItem(code) || item;
    var spec = item.ItemSpecification ?? item['Item Specification'] ?? '';
    var mrp  = item.MRPValue ?? item['MRP Value'];
    var stock = _itemStockValue(item);
    if (!spec) spec = master.ItemSpecification ?? '';
    if (mrp == null || mrp === '') mrp = master.MRPValue;
    if (stock === 0) stock = _itemStockValue(master);
    $('#frmDdlItem_' + rowId).val(code || '');
    $('#frmTxtItem_' + rowId).val(desp);
    $('#frmTxtSpec_' + rowId).val(spec || '');
    if (mrp != null && mrp !== '') {
        var rate = parseFloat(mrp);
        if (!isNaN(rate)) $('#frmTxtRate_' + rowId).val(rate);
    }
    if (stock != null && stock !== '') {
        var sq = parseFloat(stock);
        if (!isNaN(sq)) $('#frmTxtStockQty_' + rowId).val(sq);
    }
    OnIndentItemChange(rowId);
    FitIndentItemColumns();
}

function _findVendor(code) {
    var key = String(code || '');
    if (!key) return null;
    return (G_VendorList || []).filter(function (v) {
        return String(v.Code ?? v.code) === key;
    })[0] || null;
}

function _vendorDisplayName(v) {
    if (!v) return '';
    return v.Desp ?? v.desp ?? v.AccountDesp ?? v.accountDesp
        ?? v.AccountName ?? v.accountName ?? v.VendorName ?? v.vendorName
        ?? v.PartyName ?? v.partyName ?? v['Vendor / Party']
        ?? v.Name ?? v.name ?? '';
}

function _ensureVendorList() {
    if ((G_VendorList || []).length) return Promise.resolve(G_VendorList);
    return IndentMasterService.GetVendorList()
        .then(function (res) {
            G_VendorList = _toList(res);
            return G_VendorList;
        })
        .catch(function () {
            G_VendorList = [];
            return G_VendorList;
        });
}

function _buildVendorSelect(rowId, selected) {
    var vendor = selected ? _findVendor(selected) : null;
    var name = vendor ? _vendorDisplayName(vendor) : '';
    return '<div class="indent-item-lookup-wrap indent-vendor-lookup-wrap">' +
        `<input type="text" id="frmTxtVendor_${rowId}" class="form-control form-control-sm indent-vendor-lookup"` +
        ` value="${_esc(name)}" placeholder="-- Vendor --" autocomplete="off" />` +
        `<input type="hidden" id="frmDdlVendor_${rowId}" value="${_esc(selected || '')}" />` +
        '</div>';
}

window.OnIndentVendorLookupKey = function (e, rowId) {
    _onIndentGridKey(e, rowId, 'vendor');
};

function _shouldOpenIndentObjList(typedVal, selectedCode, selectedName) {
    var raw = String(typedVal || '').trim();
    if (!raw) return false;
    if (raw === '.' || raw === '..' || raw.indexOf('*') === 0) return true;
    if (!String(selectedCode || '').trim()) return true;
    return raw !== String(selectedName || '').trim();
}

function _indentRowFocusOrder(rowId) {
    return [
        '#frmTxtItem_' + rowId,
        '#frmTxtSpec_' + rowId,
        '#frmTxtVendor_' + rowId,
        '#frmTxtQty_' + rowId,
        '#frmTxtRate_' + rowId,
        '#frmDdlCurrency_' + rowId,
        '#frmDdlDivision_' + rowId,
        '#frmDdlSubDivision_' + rowId,
        '#frmDdlDept_' + rowId,
        '#frmDdlSubDept_' + rowId,
        '#frmTxtLineRemarks_' + rowId
    ];
}

function _indentRowIdFromEl(el) {
    return String($(el).closest('tr').attr('id') || '').replace('indentItemRow_', '');
}

function _indentFocus(sel) {
    var $el = $(sel);
    if (!$el.length) return;
    $el.trigger('focus');
    if ($el.is('input[type="text"], input[type="number"]') && $el[0].select) {
        try { $el[0].select(); } catch (ex) { /* ignore */ }
    }
}

function _nextIndentRowId(rowId) {
    var $rows = $('#tblIndentItemsBody tr');
    var found = false;
    var next = '';
    $rows.each(function () {
        var id = String($(this).attr('id') || '').replace('indentItemRow_', '');
        if (found && !next) next = id;
        if (String(id) === String(rowId)) found = true;
    });
    return next;
}

function _focusIndentSaveButton() {
    var $btn = $('.btn-indent-save').first();
    if (!$btn.attr('tabindex')) $btn.attr('tabindex', '0');
    $btn.trigger('focus');
}

function _indentEnterNext(rowId, el) {
    var order = _indentRowFocusOrder(rowId);
    var idx = -1;
    var currentId = el && el.id ? '#' + el.id : '';
    if (currentId) idx = order.indexOf(currentId);
    if (idx < 0) {
        for (var i = 0; i < order.length; i++) {
            if ($(el).is(order[i])) { idx = i; break; }
        }
    }
    if (idx >= 0 && idx < order.length - 1) {
        _indentFocus(order[idx + 1]);
        return;
    }
    if (_isLastIndentItemRow(rowId)) {
        AddIndentItemRow(null, true);
        _indentFocus('#frmTxtItem_' + G_ItemRowCount);
    } else {
        var nextId = _nextIndentRowId(rowId);
        if (nextId) _indentFocus('#frmTxtItem_' + nextId);
    }
}

function _onIndentGridKey(e, rowId, field) {
    if (e.key === 'Tab' || e.keyCode === 9) {
        e.preventDefault();
        e.stopPropagation();
        _focusIndentSaveButton();
        return;
    }
    if (e.key !== 'Enter' && e.keyCode !== 13) return;
    e.preventDefault();
    e.stopPropagation();
    rowId = rowId || _indentRowIdFromEl(e.target);
    if (field === 'item') {
        var itemVal = $(e.target).val();
        var itemCode = $('#frmDdlItem_' + rowId).val();
        var itemName = '';
        if (itemCode) {
            var selItem = _findItem(itemCode);
            itemName = selItem ? _itemDisplayName(selItem) : String(itemVal || '').trim();
        }
        if (_shouldOpenIndentObjList(itemVal, itemCode, itemName)) {
            ShowIndentItemObjectList(rowId, itemVal);
            return;
        }
    }
    if (field === 'vendor') {
        var vendorVal = $(e.target).val();
        var vendorCode = $('#frmDdlVendor_' + rowId).val();
        var vendorName = '';
        if (vendorCode) {
            var selVendor = _findVendor(vendorCode);
            vendorName = selVendor ? _vendorDisplayName(selVendor) : String(vendorVal || '').trim();
        }
        if (_shouldOpenIndentObjList(vendorVal, vendorCode, vendorName)) {
            ShowIndentVendorObjectList(rowId, vendorVal);
            return;
        }
    }
    _indentEnterNext(rowId, e.target);
}

function _bindIndentItemGridKeys() {
    $('#tblIndentItemsBody').off('keydown.indentNav').on('keydown.indentNav', 'input, select', function (e) {
        var id = this.id || '';
        var field = '';
        if (id.indexOf('frmTxtItem_') === 0) field = 'item';
        else if (id.indexOf('frmTxtVendor_') === 0) field = 'vendor';
        _onIndentGridKey(e, _indentRowIdFromEl(this), field);
    });
}

function _vendorObjListData() {
    return (G_VendorList || []).map(function (v) {
        var name = _vendorDisplayName(v);
        var code = v.Code ?? v.code ?? v.PartyMaster_Code ?? v.partyMaster_Code ?? '';
        return {
            'Vendor / Party': name,
            Code: code,
            Desp: name
        };
    }).filter(function (row) {
        return String(row['Vendor / Party'] || '').trim() !== '' || row.Code;
    });
}

window.ShowIndentVendorObjectList = function (rowId, value) {
    var open = _parseIndentObjListOpen(value);
    if (!String(value || '').trim()) {
        toastr.warning('Type .. and press Enter to open the vendor list.');
        return;
    }
    G_CurrentItemRowId = 0;
    G_CurrentVendorRowId = rowId;
    G_IndentObjKeepValue = open.typed;
    _ensureVendorList().then(function () {
        var list = _vendorObjListData();
        if (!list.length) {
            toastr.warning('No vendor data available.');
            G_CurrentVendorRowId = 0;
            return;
        }
        _prepIndentObjListModal();
        initializeObjectlistControl({
            ModalId: INDENT_OBJ_MODAL,
            searchvalue: open.searchValue,
            MatchType: open.matchType,
            MultiSelect: false,
            ClientOrderProjectData: list,
            CallBackFunctionName_btnDone: 'onIndentVendorSelected',
            DefaultColumnfilter: 'Vendor / Party',
            ModalTitle: 'Select Vendor / Party',
            Columns: [
                { field: 'Vendor / Party', header: 'Vendor / Party', visible: true },
                { field: 'Code', visible: false },
                { field: 'Desp', visible: false }
            ]
        });
        _raiseIndentObjListZIndex();
        $('#' + INDENT_OBJ_MODAL).off('hidden.bs.modal.indentVendor').on('hidden.bs.modal.indentVendor', function () {
            if (!G_CurrentVendorRowId) return;
            var restoreId = G_CurrentVendorRowId;
            G_CurrentVendorRowId = 0;
            G_IndentObjKeepValue = '';
            if (restoreId === 'mobile') {
                $('#indentMobileTxtVendor').val('');
                $('#indentMobileDdlVendor').val('').trigger('change');
            } else {
                $('#frmTxtVendor_' + restoreId).val('');
                $('#frmDdlVendor_' + restoreId).val('');
            }
        });
    });
};

window.onIndentVendorSelected = function (response) {
    if (!response || !response.length || !G_CurrentVendorRowId) return;
    var rowId = G_CurrentVendorRowId;
    G_CurrentVendorRowId = 0;
    if (rowId === 'mobile') {
        _applyVendorToMobileModal(response[0]);
        return;
    }
    _applyVendorFromObj(rowId, response[0]);
};

function _applyVendorToMobileModal(vendor) {
    if (!vendor) return;
    var code = vendor.Code ?? vendor.code ?? vendor['Party Code'] ?? 0;
    $('#indentMobileDdlVendor').val(code || '');
    $('#indentMobileTxtVendor').val(_vendorDisplayName(vendor));
}

function _applyVendorFromObj(rowId, vendor) {
    if (!vendor) return;
    var code = vendor.Code ?? vendor.code ?? vendor['Party Code'] ?? 0;
    var desp = _vendorDisplayName(vendor);
    $('#frmDdlVendor_' + rowId).val(code || '');
    $('#frmTxtVendor_' + rowId).val(desp);
    FitIndentItemColumns();
    _indentFocus('#frmTxtQty_' + rowId);
}

window.AddIndentItemRow = function (preset, silent) {
    if (_isIndentMobile() && !preset && !silent) {
        OpenIndentMobileItemModal(null);
        return;
    }
    _appendIndentItemRow(preset || {});
};

function _appendIndentItemRow(preset) {
    G_ItemRowCount++;
    var rowId = G_ItemRowCount;
    preset = preset || {};
    var itemCode   = preset.ItemMaster_Code || '';
    var spec       = preset.ItemSpecification || '';
    var partyCode  = preset.PartyMaster_Code || '';
    var uomCode    = preset.UOMMaster_Code || '';
    var uom        = preset.UOM || '';
    var qty        = preset.QtyMTRS || preset.QtyMT || preset.PrimaryQty || 0;
    var rate       = preset.Rate || 0;
    var currCode   = preset.CurrencyMaster_Code || '';
    var stockQty   = preset.StockQty != null ? preset.StockQty : (preset.IndentStockOnDate || 0);
    var divCode    = preset.DivisionMaster_Code || '';
    var subDivCode = preset.SubDivisionMaster_Code || '';
    var deptCode   = preset.DepartmentMaster_Code || '';
    var subDept    = preset.SubDepartmentMaster_Code || '';
    var remarks    = preset.LineRemarks || preset.Remarks || '';
    var detCode    = preset.IndentTransaction_Code || preset.Code || 0;

    var row = `<tr id="indentItemRow_${rowId}">
        <td class="col-sno text-center fw-bold">${rowId}</td>
        <td class="col-item">${_buildItemSelect(rowId, itemCode)}</td>
        <td class="col-spec"><input type="text" id="frmTxtSpec_${rowId}" class="form-control form-control-sm" value="${_esc(spec)}" maxlength="1000" placeholder="Specification" oninput="FitIndentItemColumns()" /></td>
        <td class="col-vendor">${_buildVendorSelect(rowId, partyCode)}</td>
        <td class="col-uom">
            <input type="text" id="frmTxtUom_${rowId}" class="form-control form-control-sm" value="${_esc(uom)}" readonly />
            <input type="hidden" id="frmHfUomCode_${rowId}" value="${uomCode}" />
        </td>
        <td class="col-qty"><input type="number" id="frmTxtQty_${rowId}" class="form-control form-control-sm" value="${qty}" min="0" step="0.001" /></td>
        <td class="col-rate"><input type="number" id="frmTxtRate_${rowId}" class="form-control form-control-sm" value="${rate}" min="0" step="0.01" /></td>
        <td class="col-currency">${_buildLookupSelect('frmDdlCurrency_' + rowId, G_CurrencyList, currCode, '-- Currency --')}</td>
        <td class="col-stock">
            <input type="text" id="frmTxtStockQty_${rowId}" class="form-control form-control-sm" value="${stockQty}" readonly />
        </td>
        <td class="col-division">${_buildLookupSelect('frmDdlDivision_' + rowId, G_DivisionList, divCode, '-- Division --')}</td>
        <td class="col-division">${_buildLookupSelect('frmDdlSubDivision_' + rowId, G_SubDivisionList, subDivCode, '-- Sub-Division --')}</td>
        <td class="col-dept">${_buildLookupSelect('frmDdlDept_' + rowId, G_DepartmentList, deptCode, '-- Department --', 'OnIndentDepartmentChange(' + rowId + ')')}</td>
        <td class="col-subdept"><select id="frmDdlSubDept_${rowId}" class="form-control form-control-sm"><option value="">-- Sub-Department --</option></select></td>
        <td class="col-lineremarks"><input type="text" id="frmTxtLineRemarks_${rowId}" class="form-control form-control-sm" value="${_esc(remarks)}" maxlength="200" placeholder="Line remarks" /></td>
        <td class="col-action text-center">
            <input type="hidden" id="frmHfDetailCode_${rowId}" value="${detCode}" />
            <button type="button" class="del-row-btn" title="Remove" onclick="DeleteIndentItemRow(${rowId})"><i class="fa fa-times-circle"></i></button>
        </td>
    </tr>`;
    $('#tblIndentItemsBody').append(row);
    _renumberItemRows();
    if (deptCode) OnIndentDepartmentChange(rowId, subDept);
    FitIndentItemColumns();
}

function _esc(v) {
    return String(v == null ? '' : v)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

function _xmlTag(name, value) {
    var text = String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return '<' + name + '>' + text + '</' + name + '>';
}

window.DeleteIndentItemRow = function (rowId) {
    if ($('#tblIndentItemsBody tr').length <= 1 && !_isIndentMobile()) {
        toastr.warning('At least one item row is required.');
        return;
    }
    $('#indentItemRow_' + rowId).remove();
    _renumberItemRows();
    if (_isIndentMobile()) RenderIndentMobileItemCards();
};

function _fillIndentMobileLookups() {
    var $item = $('#indentMobileDdlItem');
    $item.empty().append($('<option>').val('').text('-- Select Item --'));
    (G_ItemList && G_ItemList.length ? G_ItemList : G_AllItemList || []).forEach(function (it) {
        $item.append($('<option>').val(it.Code ?? it.code).text(_itemDisplayName(it)));
    });
    _fillSelect($('#indentMobileDdlVendor'), G_VendorList, '-- Vendor --');
    _fillSelect($('#indentMobileDdlCurrency'), G_CurrencyList, '-- Currency --');
    _fillSelect($('#indentMobileDdlDivision'), G_DivisionList, '-- Division --');
    _fillSelect($('#indentMobileDdlSubDivision'), G_SubDivisionList, '-- Sub-Division --');
    _fillSelect($('#indentMobileDdlDept'), G_DepartmentList, '-- Department --');
    $('#indentMobileDdlSubDept').html('<option value="">-- Sub-Department --</option>');
}

function _initIndentMobileSelect2() {
    var $parent = $('#indentModalMobileItemEntry');
    _initSelect2($('#indentMobileDdlItem'), $parent);
    _initSelect2($('#indentMobileDdlVendor'), $parent);
    _initSelect2($('#indentMobileDdlCurrency'), $parent);
    _initSelect2($('#indentMobileDdlDivision'), $parent);
    _initSelect2($('#indentMobileDdlSubDivision'), $parent);
    _initSelect2($('#indentMobileDdlDept'), $parent);
    _initSelect2($('#indentMobileDdlSubDept'), $parent);
    $('#indentMobileDdlItem').off('change.indentMobItem').on('change.indentMobItem', OnIndentMobileItemChange);
}

window.OpenIndentMobileItemModal = function (rowId) {
    G_IndentMobileEditRowId = rowId;
    _fillIndentMobileLookups();
    if (rowId == null) {
        $('#indentMobileItemModalTitle').text('Add Item');
        $('#indentMobileItemModalBtnTxt').text('Add Item');
        $('#indentMobileDdlItem').val('');
        $('#indentMobileTxtSpec').val('');
        $('#indentMobileDdlVendor').val('');
        $('#indentMobileTxtUom').val('');
        $('#indentMobileHfUomCode').val('');
        $('#indentMobileTxtStock').val('0');
        $('#indentMobileTxtQty').val(0);
        $('#indentMobileTxtRate').val(0);
        $('#indentMobileDdlCurrency').val('');
        $('#indentMobileDdlDivision').val('');
        $('#indentMobileDdlSubDivision').val('');
        $('#indentMobileDdlDept').val('');
        $('#indentMobileTxtRemarks').val('');
        $('#indentMobileCalcValue').text('0.00');
    } else {
        $('#indentMobileItemModalTitle').text('Edit Item');
        $('#indentMobileItemModalBtnTxt').text('Update Item');
        $('#indentMobileDdlItem').val($('#frmDdlItem_' + rowId).val());
        $('#indentMobileTxtSpec').val($('#frmTxtSpec_' + rowId).val());
        $('#indentMobileDdlVendor').val($('#frmDdlVendor_' + rowId).val());
        $('#indentMobileTxtUom').val($('#frmTxtUom_' + rowId).val());
        $('#indentMobileHfUomCode').val($('#frmHfUomCode_' + rowId).val());
        $('#indentMobileTxtStock').val($('#frmTxtStockQty_' + rowId).val() || 0);
        $('#indentMobileTxtQty').val($('#frmTxtQty_' + rowId).val() || 0);
        $('#indentMobileTxtRate').val($('#frmTxtRate_' + rowId).val() || 0);
        $('#indentMobileDdlCurrency').val($('#frmDdlCurrency_' + rowId).val());
        $('#indentMobileDdlDivision').val($('#frmDdlDivision_' + rowId).val());
        $('#indentMobileDdlSubDivision').val($('#frmDdlSubDivision_' + rowId).val());
        $('#indentMobileDdlDept').val($('#frmDdlDept_' + rowId).val());
        $('#indentMobileTxtRemarks').val($('#frmTxtLineRemarks_' + rowId).val());
        var subDept = $('#frmDdlSubDept_' + rowId).val();
        OnIndentMobileDeptChange(subDept);
        IndentMobileCalcValue();
    }
    $('#indentModalMobileItemEntry').off('shown.bs.modal.indentSel2').on('shown.bs.modal.indentSel2', function () {
        _initIndentMobileSelect2();
    });
    $('#indentModalMobileItemEntry').modal('show');
};

window.OnIndentMobileItemChange = function () {
    var code = $('#indentMobileDdlItem').val();
    var item = _findItem(code);
    $('#indentMobileTxtUom').val(item ? (item.UOM || item.uom || '') : '');
    $('#indentMobileHfUomCode').val(item ? (item.UOMMaster_Code ?? item.uomMaster_Code ?? '') : '');
    if (item) {
        if (item.ItemSpecification) $('#indentMobileTxtSpec').val(item.ItemSpecification);
        if (item.MRPValue != null && item.MRPValue !== '') $('#indentMobileTxtRate').val(item.MRPValue);
        $('#indentMobileTxtStock').val(_itemStockValue(item));
    } else {
        $('#indentMobileTxtStock').val('0');
    }
    IndentMobileCalcValue();
    if (!code) return;
    IndentMasterService.GetItemStock(code).then(function (res) {
        var row = _toList(res)[0] || {};
        var qty = row.StockInStore != null ? row.StockInStore
                : (row.StockQty != null ? row.StockQty : row.IndentStockOnDate);
        if (qty != null && qty !== '') $('#indentMobileTxtStock').val(qty);
    }).catch(function () { /* keep list stock */ });
};

window.OnIndentMobileDeptChange = function (selectedSub) {
    var deptCode = parseInt($('#indentMobileDdlDept').val() || 0, 10) || 0;
    var $sub = $('#indentMobileDdlSubDept');
    $sub.html('<option value="">-- Sub-Department --</option>');
    if (!deptCode) return;
    IndentMasterService.GetSubDepartmentList(deptCode).then(function (list) {
        _toList(list).forEach(function (item) {
            var code = item.Code ?? item.code;
            $sub.append(`<option value="${code}">${_esc(_optionDesp(item))}</option>`);
        });
        if (selectedSub) $sub.val(String(selectedSub));
        _initSelect2($sub, $('#indentModalMobileItemEntry'));
    }).catch(function () { /* no sub-departments */ });
};

window.IndentMobileCalcValue = function () {
    var qty = parseFloat($('#indentMobileTxtQty').val()) || 0;
    var rate = parseFloat($('#indentMobileTxtRate').val()) || 0;
    $('#indentMobileCalcValue').text((qty * rate).toFixed(2));
};

window.IndentMobileItemModalConfirm = function () {
    var itemCode = $('#indentMobileDdlItem').val();
    var qty = parseFloat($('#indentMobileTxtQty').val()) || 0;
    if (!itemCode) { toastr.warning('Please select an item.'); return; }
    if (qty <= 0) { toastr.warning('Qty must be greater than 0.'); return; }
    var preset = {
        ItemMaster_Code: itemCode,
        ItemSpecification: $('#indentMobileTxtSpec').val() || '',
        PartyMaster_Code: $('#indentMobileDdlVendor').val() || '',
        UOMMaster_Code: $('#indentMobileHfUomCode').val() || '',
        UOM: $('#indentMobileTxtUom').val() || '',
        QtyMTRS: qty,
        Rate: parseFloat($('#indentMobileTxtRate').val()) || 0,
        CurrencyMaster_Code: $('#indentMobileDdlCurrency').val() || '',
        StockQty: $('#indentMobileTxtStock').val() || 0,
        DivisionMaster_Code: $('#indentMobileDdlDivision').val() || '',
        SubDivisionMaster_Code: $('#indentMobileDdlSubDivision').val() || '',
        DepartmentMaster_Code: $('#indentMobileDdlDept').val() || '',
        SubDepartmentMaster_Code: $('#indentMobileDdlSubDept').val() || '',
        LineRemarks: $('#indentMobileTxtRemarks').val() || '',
        IndentTransaction_Code: G_IndentMobileEditRowId
            ? ($('#frmHfDetailCode_' + G_IndentMobileEditRowId).val() || 0)
            : 0
    };
    if (G_IndentMobileEditRowId == null) {
        _appendIndentItemRow(preset);
    } else {
        _applyIndentMobileToRow(G_IndentMobileEditRowId, preset);
    }
    RenderIndentMobileItemCards();
    $('#indentModalMobileItemEntry').modal('hide');
};

function _applyIndentMobileToRow(rowId, preset) {
    var item = _findItem(preset.ItemMaster_Code);
    $('#frmDdlItem_' + rowId).val(preset.ItemMaster_Code || '');
    $('#frmTxtItem_' + rowId).val(item ? _itemDisplayName(item) : '');
    $('#frmTxtSpec_' + rowId).val(preset.ItemSpecification || '');
    $('#frmDdlVendor_' + rowId).val(preset.PartyMaster_Code || '');
    var vendor = _findVendor(preset.PartyMaster_Code);
    $('#frmTxtVendor_' + rowId).val(vendor ? _vendorDisplayName(vendor) : '');
    $('#frmTxtUom_' + rowId).val(preset.UOM || '');
    $('#frmHfUomCode_' + rowId).val(preset.UOMMaster_Code || '');
    $('#frmTxtQty_' + rowId).val(preset.QtyMTRS || 0);
    $('#frmTxtRate_' + rowId).val(preset.Rate || 0);
    $('#frmDdlCurrency_' + rowId).val(preset.CurrencyMaster_Code || '');
    $('#frmTxtStockQty_' + rowId).val(preset.StockQty || 0);
    $('#frmDdlDivision_' + rowId).val(preset.DivisionMaster_Code || '');
    $('#frmDdlSubDivision_' + rowId).val(preset.SubDivisionMaster_Code || '');
    $('#frmDdlDept_' + rowId).val(preset.DepartmentMaster_Code || '');
    $('#frmTxtLineRemarks_' + rowId).val(preset.LineRemarks || '');
    if (preset.DepartmentMaster_Code) {
        OnIndentDepartmentChange(rowId, preset.SubDepartmentMaster_Code);
    }
}

function RenderIndentMobileItemCards() {
    var container = $('#indentMobileItemCards');
    if (!container.length) return;
    container.empty();
    var rows = $('#tblIndentItemsBody tr');
    if (rows.length === 0) {
        container.html('<div class="mobile-item-empty"><i class="fa fa-box-open fa-2x d-block mb-2"></i>No items added yet.<br>Tap "+ Add Item" to start.</div>');
        return;
    }
    rows.each(function (index) {
        var rowId = String($(this).attr('id') || '').replace('indentItemRow_', '');
        var itemName = $('#frmTxtItem_' + rowId).val() || '-- Select Item --';
        var vendor = $('#frmTxtVendor_' + rowId).val() || '';
        var uom = $('#frmTxtUom_' + rowId).val() || '';
        var qty = $('#frmTxtQty_' + rowId).val() || 0;
        var rate = parseFloat($('#frmTxtRate_' + rowId).val() || 0).toFixed(2);
        var spec = $('#frmTxtSpec_' + rowId).val() || '';
        var value = (parseFloat(qty) * parseFloat(rate)).toFixed(2);
        container.append(
            '<div class="mobile-item-card">' +
            '<div class="item-card-header">' +
            '<span class="item-card-num">' + (index + 1) + '</span>' +
            '<span class="item-card-name">' + _esc(itemName) + '</span>' +
            '<div class="item-card-actions">' +
            '<button type="button" class="item-card-edit-btn" onclick="OpenIndentMobileItemModal(' + rowId + ')" title="Edit"><i class="fa fa-pencil-alt"></i></button>' +
            '<button type="button" class="item-card-del-btn" onclick="DeleteIndentItemRow(' + rowId + ')" title="Delete"><i class="fa fa-trash"></i></button>' +
            '</div></div>' +
            '<div class="item-card-details">' +
            (uom ? '<span class="item-card-detail"><i class="fa fa-ruler me-1"></i>' + _esc(uom) + '</span>' : '') +
            '<span class="item-card-detail"><i class="fa fa-sort-amount-up me-1"></i>Qty: ' + _esc(qty) + '</span>' +
            '<span class="item-card-detail"><i class="fa fa-tag me-1"></i>Rate: ' + rate + '</span>' +
            '<span class="item-card-detail item-card-value"><i class="fa fa-coins me-1"></i>Value: ' + value + '</span>' +
            (vendor ? '<span class="item-card-detail"><i class="fa fa-user me-1"></i>' + _esc(vendor) + '</span>' : '') +
            (spec ? '<span class="item-card-detail" style="width:100%;"><i class="fa fa-align-left me-1"></i>' + _esc(spec) + '</span>' : '') +
            '</div></div>'
        );
    });
}

function _renumberItemRows() {
    $('#tblIndentItemsBody tr').each(function (index) {
        $(this).find('td:first').text(index + 1);
    });
}

window.OnIndentItemChange = function (rowId) {
    var itemCode = parseInt($('#frmDdlItem_' + rowId).val() || 0, 10) || 0;
    var item = _findItem(itemCode);
    $('#frmTxtUom_' + rowId).val(item ? (item.UOM || item.uom || '') : '');
    $('#frmHfUomCode_' + rowId).val(item ? (item.UOMMaster_Code ?? item.uomMaster_Code ?? '') : '');
    if (!itemCode) {
        $('#frmTxtStockQty_' + rowId).val('0');
        return;
    }
    if (item && (item.StockInStore != null && item.StockInStore !== '')) {
        $('#frmTxtStockQty_' + rowId).val(item.StockInStore);
    }
    IndentMasterService.GetItemStock(itemCode).then(function (res) {
        var row = _toList(res)[0] || {};
        var qty = row.StockInStore != null ? row.StockInStore
                : (row.StockQty != null ? row.StockQty : row.IndentStockOnDate);
        if (qty != null && qty !== '') $('#frmTxtStockQty_' + rowId).val(qty);
    }).catch(function () { /* keep list stock if API fails */ });
};

window.OnIndentDepartmentChange = function (rowId, selectedSub) {
    var deptCode = parseInt($('#frmDdlDept_' + rowId).val() || 0, 10) || 0;
    var $sub = $('#frmDdlSubDept_' + rowId);
    $sub.html('<option value="">-- Sub-Department --</option>');
    if (!deptCode) return;
    IndentMasterService.GetSubDepartmentList(deptCode).then(function (list) {
        _toList(list).forEach(function (item) {
            var code = item.Code ?? item.code;
            var sel = String(code) === String(selectedSub || '') ? ' selected' : '';
            $sub.append(`<option value="${code}"${sel}>${_esc(_optionDesp(item))}</option>`);
        });
        if (selectedSub) $sub.val(String(selectedSub));
    }).catch(function () { /* no sub-departments */ });
};

function _fillCategorySelect($el, list) {
    $el.empty();
    $el.append($('<option>').val('').text('-- All Categories --'));
    (list || []).forEach(function (item) {
        var name = String(item.Desp ?? item.desp ?? item.ItemType ?? item.CategoryName ?? item.Category ?? '').trim();
        var code = item.Code ?? item.code ?? item.TypeMaster_Code ?? item.CategoryMaster_Code ?? '';
        if (!name && code !== '' && code != null) name = String(code);
        if (!name) return;
        $el.append($('<option>').val(name).attr('data-code', code).text(name));
    });
}

function _categoryMatchKeys(catKey) {
    var keys = [];
    var raw = String(catKey || '').trim();
    if (!raw) return keys;
    keys.push(raw);
    var $opt = $('#frmDdlCategory option').filter(function () {
        return String($(this).val()) === raw || $.trim($(this).text()) === raw;
    }).first();
    if ($opt.length) {
        if ($opt.val()) keys.push(String($opt.val()).trim());
        var txt = $.trim($opt.text());
        if (txt && txt.indexOf('--') !== 0) keys.push(txt);
        var dc = $opt.attr('data-code');
        if (dc) keys.push(String(dc).trim());
    }
    (G_CategoryList || []).forEach(function (c) {
        var code = String(c.Code ?? c.code ?? c.TypeMaster_Code ?? c.CategoryMaster_Code ?? '').trim();
        var name = String(c.Desp ?? c.desp ?? c.ItemType ?? c.CategoryName ?? c.Category ?? '').trim();
        if (code === raw || name === raw) {
            if (code) keys.push(code);
            if (name) keys.push(name);
        }
    });
    return _dedup(keys.filter(Boolean));
}

function _applyItemCategoryFilter(catKey) {
    var keys = _categoryMatchKeys(catKey).map(function (k) { return k.toLowerCase(); });
    if (!keys.length) {
        G_ItemList = G_AllItemList.slice();
    } else {
        var filtered = G_AllItemList.filter(function (item) {
            var itemCats = [
                item.ItemType, item.itemType,
                item.Category, item.category,
                item.TypeMaster_Code, item.typeMaster_Code,
                item.CategoryName, item.categoryName,
                item.CategoryMaster_Code, item.categoryMaster_Code
            ].map(function (v) { return v != null ? String(v).trim().toLowerCase() : ''; })
             .filter(Boolean);
            return itemCats.some(function (c) { return keys.indexOf(c) >= 0; });
        });
        G_ItemList = filtered.length ? filtered : (G_AllItemList || []).slice();
    }
    _refreshLongestLookupNames();
}

function _refreshItemDropdowns() {
    $('#tblIndentItemsBody tr').each(function () {
        var id = String($(this).attr('id') || '').replace('indentItemRow_', '');
        var current = $('#frmDdlItem_' + id).val();
        var $wrap = $('#frmTxtItem_' + id).closest('.indent-item-lookup-wrap');
        var html = _buildItemSelect(id, current);
        if ($wrap.length) {
            $wrap.replaceWith(html);
        } else {
            $('#frmDdlItem_' + id).replaceWith(html);
        }
    });
    FitIndentItemColumns();
}

window.OnIndentCategoryChange = function () {
    if (G_SkipCategoryChange) return;
    /* Dropdown value is ItemType (e.g. Consumables). API @Code is INT, so filter locally. */
    var cat = ($('#frmDdlCategory').val() || '').toString().trim();
    _applyItemCategoryFilter(cat);
    _refreshItemDropdowns();
};

/** Set Item Category by CategoryName or CategoryMaster.Code (legacy rows). */
function _setCategoryDropdown(category, silent) {
    var $ddl = $('#frmDdlCategory');
    var val = String(category == null ? '' : category).trim();
    var apply = function (v) {
        if (silent) G_SkipCategoryChange = true;
        try {
            $ddl.val(v).trigger('change');
        } finally {
            G_SkipCategoryChange = false;
        }
    };
    if (!val) {
        apply('');
        return;
    }
    if ($ddl.find('option').filter(function () { return String($(this).val()) === val; }).length) {
        apply(val);
        return;
    }
    var byText = $ddl.find('option').filter(function () {
        return $.trim($(this).text()) === val;
    }).first();
    if (byText.length) {
        apply(byText.val());
        return;
    }
    /* Unknown saved value — keep selectable so edit still shows it */
    $ddl.append($('<option>').val(val).text(val));
    apply(val);
}

window.OpenIndentForm = function (mode, code, statusHint) {
    var ModuleName = $('#ERPHeading').text().trim();
    var OptionName = mode === 'Edit' ? 'Edit' : 'New';
    var ShowMsg = 'Y';
    var FinYear = BizSolHelperFunction.getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (respCheck) {
        if (respCheck && respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg || 'You do not have rights for this action.');
            return;
        }

        G_EditMode = mode;
        _ensureFormLookups().then(function () {
            _resetForm();
            $('#divIndentList').hide();
            $('#divIndentForm').show();
            $('#indentFloatBar').css('display', 'flex');

            if (mode === 'Edit') {
                $('#floatIndentModeBadge').text('EDIT').removeClass('bg-success').addClass('bg-warning text-dark');
                $('#floatIndentNo').text('Loading…');
                _loadIndentForEdit(code);
            } else {
                $('#floatIndentModeBadge').text('NEW').removeClass('bg-warning text-dark').addClass('bg-success');
                $('#floatIndentNo').text('New Indent');
                $('#frmTxtIndentDate').val(_isoDate(new Date()));
                $('#frmTxtFinYear').val(FinYear);
                $('#frmTxtStatus').val('Pending');
                IndentMasterService.GetNextIndentNo().then(function (res) {
                    var row = _toList(res)[0] || res || {};
                    $('#frmTxtIndentNo').val(row.IndentNoWithPrefix || row.NextIndentNo || 'Auto Generate');
                    if (row.FinYear) $('#frmTxtFinYear').val(row.FinYear);
                    if (row.IndentDate) $('#frmTxtIndentDate').val(String(row.IndentDate).substring(0, 10));
                    $('#floatIndentNo').text($('#frmTxtIndentNo').val() || 'New Indent');
                }).catch(function () {
                    $('#frmTxtIndentNo').val('Auto Generate');
                });
                if (_isIndentMobile()) {
                    RenderIndentMobileItemCards();
                } else {
                    AddIndentItemRow();
                }
            }
        });
    }).catch(function () {
        // Rights API missing – still open the form
        G_EditMode = mode;
        _ensureFormLookups().then(function () {
            _resetForm();
            $('#divIndentList').hide();
            $('#divIndentForm').show();
            $('#indentFloatBar').css('display', 'flex');
            $('#frmTxtIndentDate').val(_isoDate(new Date()));
            $('#frmTxtFinYear').val(FinYear);
            if (_isIndentMobile()) {
                RenderIndentMobileItemCards();
            } else {
                AddIndentItemRow();
            }
        });
    });
};

window.CloseIndentForm = function () {
    $('#divIndentForm').hide();
    $('#indentFloatBar').hide();
    $('#divIndentList').show();
};

function _unwrapShowData(res) {
    var header = null;
    var details = [];
    if (!res) return { header: header, details: details };

    var isDetailRow = function (r) {
        if (!r) return false;
        return (parseInt(r.ItemMaster_Code || r.itemMaster_Code || 0, 10) || 0) > 0
            || (parseInt(r.IndentTransaction_Code || r.indentTransaction_Code || 0, 10) || 0) > 0;
    };

    if (Array.isArray(res) && res.length && Array.isArray(res[0])) {
        header  = res[0][0] || null;
        details = (res[1] && res[1].length) ? res[1] : (res[0] || []).filter(isDetailRow);
    } else if (res.Table && res.Table1) {
        header  = res.Table[0] || null;
        details = res.Table1 || [];
        if (!details.length) details = (res.Table || []).filter(isDetailRow);
    } else if (res.IndentMaster) {
        header  = (res.IndentMaster && res.IndentMaster[0]) || null;
        details = res.IndentTransactions || [];
    } else {
        var rows = _toList(res);
        header = rows[0] || null;
        details = rows.filter(isDetailRow);
    }
    return { header: header, details: details };
}

function _loadIndentForEdit(code) {
    IndentMasterService.GetIndentById(code).then(function (res) {
        var unpacked = _unwrapShowData(res);
        var header = unpacked.header;
        var details = unpacked.details || [];
        if (!header) {
            toastr.error('Indent not found.');
            CloseIndentForm();
            return;
        }

        $('#frmHfCode').val(header.Code || 0);
        $('#frmTxtIndentNo').val(header.IndentNoWithPrefix || header.IndentNo || '');
        $('#frmTxtIndentDate').val(header.IndentDate ? String(header.IndentDate).substring(0, 10) : '');
        $('#frmDdlWarehouse').val(String(header.GodownMaster_Code || '')).trigger('change');
        $('#frmTxtStatus').val(header.Status || 'Pending');
        $('#frmTxtFinYear').val(header.FinYear || '');
        $('#frmTxtDueDate').val(header.DueDate ? String(header.DueDate).substring(0, 10) : '');
        $('#frmChkVerified').prop('checked', String(header.Verified || 'N').toUpperCase() === 'Y');
        $('#frmTxtVerifiedAudit').text(
            (header.VerifiedBy ? ('By ' + header.VerifiedBy + ' ') : '') + (header.VerifiedOn || '')
        );
        $('#frmDdlRequestedBy').val(String(header.UserMaster_Code_Requested || '')).trigger('change');
        $('#frmTxtRequestedName').val(header.RequestedNameMannual || '');
        $('#frmTxtAuthorizedBy').val(header.AuthorizedNameMannual || '');
        $('#frmHfDatabaseLocation').val(header.DatabaseLocation_Code || 0);
        $('#frmTxtRemarks').val(header.Remarks || '');
        $('#frmTxtSpecialComments').val(header.SpecialComments || '');
        $('#frmTxtCreatedAudit').val(_joinAudit(header.UserId, header.CreateDate));
        $('#frmTxtUpdatedAudit').val(_joinAudit(header.UpdatedBy, header.UpdateDate));
        $('#frmTxtCheckedAudit').val(_joinAudit(header.Checkedby || header.Approvedby, header.CheckedOn || header.ApprovedOn));
        $('#divIndentAudit').show();
        $('.cfg-verified').show();
        $('#floatIndentNo').text($('#frmTxtIndentNo').val() || ('#' + code));

        /* Bind Item Category, then filter the already-loaded item list (do not call GETITEMLIST with a name). */
        _setCategoryDropdown(header.Category, true);

        var catKey = ($('#frmDdlCategory').val() || header.Category || '').toString().trim();
        _applyItemCategoryFilter(catKey);
        _fillDetailRows(details);
    }).catch(function (err) {
        toastr.error('Error loading Indent.');
        console.error(err);
        CloseIndentForm();
    });
}

function _fillDetailRows(details) {
    $('#tblIndentItemsBody').html('');
    G_ItemRowCount = 0;
    if (!details.length) {
        if (_isIndentMobile()) {
            RenderIndentMobileItemCards();
        } else {
            AddIndentItemRow(null, true);
        }
        return;
    }
    details.forEach(function (d) { AddIndentItemRow(d, true); });
    if (_isIndentMobile()) RenderIndentMobileItemCards();
}

function _joinAudit(who, when) {
    var a = who ? String(who) : '';
    var b = when ? String(when) : '';
    if (a && b) return a + ' / ' + b;
    return a || b || '';
}

window.SaveIndent = function () {
    var warehouse = parseInt($('#frmDdlWarehouse').val() || 0, 10) || 0;
    if (!warehouse && $('.cfg-warehouse').is(':visible')) {
        toastr.warning('Please select Warehouse.');
        return;
    }
    if (!$('#frmTxtIndentDate').val()) {
        toastr.warning('Indent Date is required.');
        return;
    }

    var details = [];
    var itemValid = true;
    $('#tblIndentItemsBody tr').each(function () {
        var rowId = String($(this).attr('id') || '').replace('indentItemRow_', '');
        var itemCode = parseInt($('#frmDdlItem_' + rowId).val() || 0, 10) || 0;
        var qty = parseFloat($('#frmTxtQty_' + rowId).val()) || 0;
        if (!itemCode) {
            toastr.warning('Please select item in all rows.');
            itemValid = false;
            return false;
        }
        if (qty <= 0) {
            toastr.warning('Qty must be greater than 0 for all items.');
            itemValid = false;
            return false;
        }
        details.push({
            Code: parseInt($('#frmHfDetailCode_' + rowId).val() || 0, 10) || 0,
            ItemMaster_Code: itemCode,
            ItemSpecification: $('#frmTxtSpec_' + rowId).val() || '',
            PartyMaster_Code: parseInt($('#frmDdlVendor_' + rowId).val() || 0, 10) || 0,
            QtyMTRS: qty,
            QtyMT: 0,
            QtyPC: 0,
            Rate: parseFloat($('#frmTxtRate_' + rowId).val()) || 0,
            UOMMaster_Code: parseInt($('#frmHfUomCode_' + rowId).val() || 0, 10) || 0,
            CurrencyMaster_Code: parseInt($('#frmDdlCurrency_' + rowId).val() || 0, 10) || 0,
            IndentStockOnDate: parseFloat($('#frmTxtStockQty_' + rowId).val()) || 0,
            DivisionMaster_Code: parseInt($('#frmDdlDivision_' + rowId).val() || 0, 10) || 0,
            SubDivisionMaster_Code: parseInt($('#frmDdlSubDivision_' + rowId).val() || 0, 10) || 0,
            DepartmentMaster_Code: parseInt($('#frmDdlDept_' + rowId).val() || 0, 10) || 0,
            SubDepartmentMaster_Code: parseInt($('#frmDdlSubDept_' + rowId).val() || 0, 10) || 0,
            Remarks: $('#frmTxtLineRemarks_' + rowId).val() || ''
        });
    });
    if (!itemValid) return;
    if (!details.length) {
        toastr.warning('Please add at least one item.');
        return;
    }

    var payloadXml =
        '<Indent>' +
        _xmlTag('Code', parseInt($('#frmHfCode').val() || 0, 10) || 0) +
        _xmlTag('IndentDate', $('#frmTxtIndentDate').val()) +
        _xmlTag('GodownMaster_Code', warehouse || parseInt(_auth().WebERPLoginGodownMaster_Code || 0, 10) || 0) +
        _xmlTag('Category', $('#frmDdlCategory').val() || '') +
        _xmlTag('DueDate', $('#frmTxtDueDate').val() || '') +
        _xmlTag('Remarks', $('#frmTxtRemarks').val() || '') +
        _xmlTag('SpecialComments', $('#frmTxtSpecialComments').val() || '') +
        _xmlTag('UserMaster_Code_Requested', parseInt($('#frmDdlRequestedBy').val() || 0, 10) || 0) +
        _xmlTag('RequestedNameMannual', $('#frmTxtRequestedName').val() || '') +
        _xmlTag('AuthorizedNameMannual', $('#frmTxtAuthorizedBy').val() || '') +
        _xmlTag('DatabaseLocation_Code', parseInt($('#frmHfDatabaseLocation').val() || 0, 10) || 0) +
        '<Details>' +
        details.map(function (d) {
            return '<Row>' +
                _xmlTag('ItemMaster_Code', d.ItemMaster_Code) +
                _xmlTag('ItemSpecification', d.ItemSpecification) +
                _xmlTag('PartyMaster_Code', d.PartyMaster_Code) +
                _xmlTag('QtyMTRS', d.QtyMTRS) +
                _xmlTag('QtyMT', d.QtyMT) +
                _xmlTag('QtyPC', d.QtyPC) +
                _xmlTag('Rate', d.Rate) +
                _xmlTag('UOMMaster_Code', d.UOMMaster_Code || 0) +
                _xmlTag('CurrencyMaster_Code', d.CurrencyMaster_Code) +
                _xmlTag('IndentStockOnDate', d.IndentStockOnDate) +
                _xmlTag('DivisionMaster_Code', d.DivisionMaster_Code) +
                _xmlTag('SubDivisionMaster_Code', d.SubDivisionMaster_Code) +
                _xmlTag('DepartmentMaster_Code', d.DepartmentMaster_Code) +
                _xmlTag('SubDepartmentMaster_Code', d.SubDepartmentMaster_Code) +
                _xmlTag('Remarks', d.Remarks) +
                '</Row>';
        }).join('') +
        '</Details></Indent>';

    IndentMasterService.SaveIndentMaster(JSON.stringify(payloadXml)).then(function (res) {
        var row = res;
        if (Array.isArray(res)) row = res[0] || {};
        var status = String((row && (row.Status != null ? row.Status : row.status)) || '').trim().toUpperCase();
        var msg = (row && (row.Msg || row.msg)) || '';
        var code = parseInt((row && (row.Code != null ? row.Code : row.code)) || 0, 10) || 0;
        if (status === 'Y') {
            toastr.success(msg || 'Indent saved successfully.');
            CloseIndentForm();
            LoadIndentList();
        } else {
            toastr.error(msg || ('Failed to save Indent.' + (code ? (' (Code ' + code + ')') : '')));
        }
    }).catch(function (err) {
        toastr.error('Error saving Indent.');
        console.error(err);
    });
};

window.DeleteIndentRow = function (code) {
    var ModuleName = $('#ERPHeading').text().trim();
    var FinYear = BizSolHelperFunction.getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, 'Delete', 'Y', FinYear).then(function (respCheck) {
        if (respCheck && respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg || 'You do not have delete rights.');
            return;
        }
        if (!confirm('Delete this Indent?')) return;
        IndentMasterService.DeleteIndent(code).then(function (res) {
            if (res && (res.Status === 'Y' || res.status === 'Y' || Array.isArray(res))) {
                toastr.success((res && res.Msg) || 'Indent deleted.');
                LoadIndentList();
            } else {
                toastr.error(res ? (res.Msg || res.msg) : 'Delete failed.');
            }
        }).catch(function (err) {
            toastr.error('Error deleting Indent.');
            console.error(err);
        });
    });
};
