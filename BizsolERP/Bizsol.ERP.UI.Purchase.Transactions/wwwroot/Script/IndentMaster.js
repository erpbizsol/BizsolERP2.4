/**
 * IndentMaster.js
 * Indent / Material Requirement (Store)
 * List + Create New form (same flow as PurchaseOrderStore).
 */
import { IndentMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/IndentMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

var G_IndentList        = [];
var G_LocateConfig      = [];
var G_ItemList          = [];
var G_DepartmentList    = [];
var G_VendorList        = [];
var G_CurrencyList      = [];
var G_UOMList           = [];
var G_DivisionList      = [];
var G_ItemRowCount      = 0;
var G_FormReady         = false;
var G_EditMode          = 'New';

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
    return [];
}

function _fillSelect($el, list, placeholder) {
    $el.empty();
    $el.append($('<option>').val('').text(placeholder || '-- Select --'));
    (list || []).forEach(function (item) {
        var code = item.Code ?? item.code ?? '';
        var desp = item.Desp ?? item.desp ?? item.GodownName ?? item.CategoryName
                ?? item.UserName ?? item.ItemName ?? item.DepartmentName ?? '';
        $el.append($('<option>').val(code).text(desp));
    });
}

function _initSelect2($el) {
    if (!$.fn.select2) return;
    if ($el.hasClass('select2-hidden-accessible')) {
        $el.select2('destroy');
    }
    $el.select2({ width: '100%' });
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
    var augmented = data.map(function (row) {
        var copy = Object.assign({}, row);
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

    var hiddenColumns = ['Code', 'code'];
    var stringCols    = [];
    var numericCols   = [];
    var dateCols      = [];
    var colAlignment  = { Action: 'center' };

    Object.keys(augmented[0]).forEach(function (key) {
        if (key === '__bizsolRowClass' || hiddenColumns.indexOf(key) !== -1 || key === 'Action') return;
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

function _isNumericColumn(lk) {
    return ['qty', 'amount', 'days', 'rate', 'price', 'count',
            'total', 'weight', 'value', 'limit', 'balance']
        .some(function (kw) { return lk.includes(kw); });
}

function _dedup(arr) {
    return arr.filter(function (v, i, a) { return a.indexOf(v) === i; });
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
        IndentMasterService.GetDivisionList().catch(function () { return []; })
    ]).then(function (results) {
        _fillSelect($('#frmDdlWarehouse'), _toList(results[0]), '-- Select Warehouse --');
        _fillSelect($('#frmDdlCategory'), _toList(results[1]), '-- All Categories --');
        _fillSelect($('#frmDdlRequestedBy'), _toList(results[2]), '-- Select User --');
        G_DepartmentList = _toList(results[3]);
        G_ItemList       = _toList(results[4]);
        G_VendorList     = _toList(results[6]);
        G_CurrencyList   = _toList(results[7]);
        G_UOMList        = _toList(results[8]);
        G_DivisionList   = _toList(results[9]);
        _applyConfig(_toList(results[5])[0] || {});
        _initSelect2($('#frmDdlWarehouse'));
        _initSelect2($('#frmDdlCategory'));
        _initSelect2($('#frmDdlRequestedBy'));
        G_FormReady = true;
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
    return item.Desp ?? item.desp ?? item.Name ?? item.ItemName ?? item.DepartmentName ?? item.UOM ?? '';
}

function _buildLookupSelect(id, list, selected, placeholder, onchange) {
    var html = `<select id="${id}" class="form-control form-control-sm"${onchange ? ` onchange="${onchange}"` : ''}>`;
    html += `<option value="">${placeholder || '-- Select --'}</option>`;
    (list || []).forEach(function (item) {
        var code = item.Code ?? item.code;
        var sel  = String(code) === String(selected) ? ' selected' : '';
        html += `<option value="${code}"${sel}>${_esc(_optionDesp(item))}</option>`;
    });
    html += '</select>';
    return html;
}

function _buildItemSelect(rowId, selected) {
    var html = `<select id="frmDdlItem_${rowId}" class="form-control form-control-sm" onchange="OnIndentItemChange(${rowId})">`;
    html += '<option value="">-- Select Item --</option>';
    G_ItemList.forEach(function (item) {
        var code    = item.Code ?? item.code;
        var desp    = item.Desp ?? item.ItemName ?? '';
        var uom     = item.UOM ?? item.uom ?? '';
        var uomCode = item.UOMMaster_Code ?? item.uomMaster_Code ?? '';
        var sel     = String(code) === String(selected) ? ' selected' : '';
        html += `<option value="${code}" data-uom="${_esc(uom)}" data-uom-code="${uomCode}"${sel}>${_esc(desp)}</option>`;
    });
    html += '</select>';
    return html;
}

window.AddIndentItemRow = function (preset) {
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
    var remarks    = preset.Remarks || '';
    var detCode    = preset.IndentTransaction_Code || preset.Code || 0;

    var row = `<tr id="indentItemRow_${rowId}">
        <td class="text-center fw-bold">${rowId}</td>
        <td>${_buildItemSelect(rowId, itemCode)}</td>
        <td><input type="text" id="frmTxtSpec_${rowId}" class="form-control form-control-sm" value="${_esc(spec)}" maxlength="1000" placeholder="Specification" /></td>
        <td class="col-vendor">${_buildLookupSelect('frmDdlVendor_' + rowId, G_VendorList, partyCode, '-- Vendor --')}</td>
        <td>
            <input type="text" id="frmTxtUom_${rowId}" class="form-control form-control-sm" value="${_esc(uom)}" readonly />
            <input type="hidden" id="frmHfUomCode_${rowId}" value="${uomCode}" />
        </td>
        <td><input type="number" id="frmTxtQty_${rowId}" class="form-control form-control-sm" value="${qty}" min="0" step="0.001" /></td>
        <td class="col-rate"><input type="number" id="frmTxtRate_${rowId}" class="form-control form-control-sm" value="${rate}" min="0" step="0.01" /></td>
        <td class="col-currency">${_buildLookupSelect('frmDdlCurrency_' + rowId, G_CurrencyList, currCode, '-- Currency --')}</td>
        <td class="col-stock">
            <input type="text" id="frmTxtStockQty_${rowId}" class="form-control form-control-sm" value="${stockQty}" readonly />
        </td>
        <td class="col-division">${_buildLookupSelect('frmDdlDivision_' + rowId, G_DivisionList, divCode, '-- Division --', 'OnIndentDivisionChange(' + rowId + ')')}</td>
        <td class="col-division"><select id="frmDdlSubDivision_${rowId}" class="form-control form-control-sm"><option value="">-- Sub-Division --</option></select></td>
        <td>${_buildLookupSelect('frmDdlDept_' + rowId, G_DepartmentList, deptCode, '-- Department --', 'OnIndentDepartmentChange(' + rowId + ')')}</td>
        <td><select id="frmDdlSubDept_${rowId}" class="form-control form-control-sm"><option value="">-- Sub-Department --</option></select></td>
        <td><input type="text" id="frmTxtLineRemarks_${rowId}" class="form-control form-control-sm" value="${_esc(remarks)}" maxlength="200" placeholder="Line remarks" /></td>
        <td class="text-center">
            <input type="hidden" id="frmHfDetailCode_${rowId}" value="${detCode}" />
            <button type="button" class="del-row-btn" title="Remove" onclick="DeleteIndentItemRow(${rowId})"><i class="fa fa-times-circle"></i></button>
        </td>
    </tr>`;
    $('#tblIndentItemsBody').append(row);
    _renumberItemRows();
    if (divCode) OnIndentDivisionChange(rowId, subDivCode);
    if (deptCode) OnIndentDepartmentChange(rowId, subDept);
};

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
    if ($('#tblIndentItemsBody tr').length <= 1) {
        toastr.warning('At least one item row is required.');
        return;
    }
    $('#indentItemRow_' + rowId).remove();
    _renumberItemRows();
};

function _renumberItemRows() {
    $('#tblIndentItemsBody tr').each(function (index) {
        $(this).find('td:first').text(index + 1);
    });
}

window.OnIndentItemChange = function (rowId) {
    var $opt = $(`#frmDdlItem_${rowId} option:selected`);
    $('#frmTxtUom_' + rowId).val($opt.data('uom') || '');
    $('#frmHfUomCode_' + rowId).val($opt.data('uom-code') || '');
    var itemCode = parseInt($opt.val() || 0, 10) || 0;
    if (!itemCode) {
        $('#frmTxtStockQty_' + rowId).val('0');
        return;
    }
    IndentMasterService.GetItemStock(itemCode).then(function (res) {
        var row = _toList(res)[0] || {};
        $('#frmTxtStockQty_' + rowId).val(row.StockQty != null ? row.StockQty : (row.IndentStockOnDate || 0));
    }).catch(function () {
        $('#frmTxtStockQty_' + rowId).val('0');
    });
};

window.OnIndentDivisionChange = function (rowId, selectedSub) {
    var divCode = parseInt($('#frmDdlDivision_' + rowId).val() || 0, 10) || 0;
    var $sub = $('#frmDdlSubDivision_' + rowId);
    $sub.html('<option value="">-- Sub-Division --</option>');
    if (!divCode) return;
    IndentMasterService.GetSubDivisionList(divCode).then(function (list) {
        _toList(list).forEach(function (item) {
            var code = item.Code ?? item.code;
            var sel = String(code) === String(selectedSub || '') ? ' selected' : '';
            $sub.append(`<option value="${code}"${sel}>${_esc(_optionDesp(item))}</option>`);
        });
        if (selectedSub) $sub.val(String(selectedSub));
    }).catch(function () { /* no sub-divisions */ });
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

window.OnIndentCategoryChange = function () {
    var cat = parseInt($('#frmDdlCategory').val() || 0, 10) || 0;
    IndentMasterService.GetItemList(cat).then(function (list) {
        G_ItemList = _toList(list);
        $('#tblIndentItemsBody tr').each(function () {
            var id = String($(this).attr('id') || '').replace('indentItemRow_', '');
            var current = $('#frmDdlItem_' + id).val();
            $('#frmDdlItem_' + id).replaceWith(_buildItemSelect(id, current));
        });
    });
};

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
                AddIndentItemRow();
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
            AddIndentItemRow();
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

    if (Array.isArray(res) && res.length && Array.isArray(res[0])) {
        header  = res[0][0] || null;
        details = res[1] || [];
    } else if (res.Table && res.Table1) {
        header  = res.Table[0] || null;
        details = res.Table1 || [];
    } else if (res.IndentMaster) {
        header  = (res.IndentMaster && res.IndentMaster[0]) || null;
        details = res.IndentTransactions || [];
    } else if (Array.isArray(res) && res[0] && !Array.isArray(res[0])) {
        header = res[0];
        details = res.slice(1);
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
        $('#frmDdlCategory').val(String(header.Category || '')).trigger('change');
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

        if (header.Category) {
            IndentMasterService.GetItemList(header.Category).then(function (list) {
                G_ItemList = _toList(list);
                _fillDetailRows(details);
            }).catch(function () { _fillDetailRows(details); });
        } else {
            _fillDetailRows(details);
        }
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
        AddIndentItemRow();
        return;
    }
    details.forEach(function (d) { AddIndentItemRow(d); });
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
        if (res && (res.Status === 'Y' || res.status === 'Y')) {
            toastr.success(res.Msg || res.msg || 'Indent saved successfully.');
            CloseIndentForm();
            LoadIndentList();
        } else {
            toastr.error(res ? (res.Msg || res.msg) : 'Failed to save Indent.');
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
