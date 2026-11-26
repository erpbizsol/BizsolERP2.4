import { VoucherDepriciationConfigurationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VoucherDepriciationConfigurationService.js';

/* Dropdown value = F_CommonValues.SortOrder (drives the grids). The saved column stores the option text. */
var BASIS = { SINGLE: 1, GROUP: 2, TYPE: 3, ASSET: 4 };
var BASIS_COLUMNS = {
    2: ['Asset Group', ''],
    3: ['Asset Type', 'Asset Group'],
    4: ['Asset', 'Asset Type']
};

var G_VDCLedgerOptions = '';
var G_VDCMapCache = {};
var G_VDCSaved = { Basis: { DR: 0, CR: 0 }, Accounts: { DR: {}, CR: {} } };
var G_VDCRows = { DR: [], CR: [] };
var G_VDCLocked = false;

$(document).ready(function () {
    $('#ERPHeading').text('Voucher / Depreciation Configuration');

    $('#ddlVDCDrBasis').on('change', function () { _loadSide('DR'); });
    $('#ddlVDCCrBasis').on('change', function () { _loadSide('CR'); });
    $('#txtVDCDrSearch').on('input', function () { _filterRows('DR', $(this).val()); });
    $('#txtVDCCrSearch').on('input', function () { _filterRows('CR', $(this).val()); });

    $('#tblVDCDrBody, #tblVDCCrBody').on('change', 'select[data-index]', function () {
        var side = $(this).closest('tbody').is('#tblVDCDrBody') ? 'DR' : 'CR';
        var row = G_VDCRows[side][parseInt($(this).data('index'), 10)];
        if (!row) return;
        row.AccountMaster_Code = parseInt($(this).val(), 10) || 0;
        $(this).closest('tr').toggleClass('vdc-row-missing', row.AccountMaster_Code <= 0);
        _promptApplyAccount(side, parseInt($(this).data('index'), 10), row.AccountMaster_Code);
    });

    ReloadVoucherDepriciationConfiguration();
});

/* ───────────────────────── APPLY TO ROWS ───────────────────────── */

var G_VDCApply = null;

function _promptApplyAccount(side, index, account) {
    var rows = G_VDCRows[side];
    if (G_VDCLocked || account <= 0 || rows.length < 2) return;

    var $body = $(side === 'DR' ? '#tblVDCDrBody' : '#tblVDCCrBody');
    var visibleIdx = [];
    $body.find('tr[data-search]').each(function (i) { if ($(this).is(':visible')) visibleIdx.push(i); });
    var emptyCount = rows.filter(function (r, i) { return i !== index && r.AccountMaster_Code <= 0; }).length;
    var searchActive = !!String($(side === 'DR' ? '#txtVDCDrSearch' : '#txtVDCCrSearch').val() || '').trim();

    G_VDCApply = { side: side, index: index, account: account, visibleIdx: visibleIdx };

    $('#lblVDCApplyAccount').text($body.find('select[data-index="' + index + '"] option:selected').text());
    $('#lblVDCApplyRow').text(rows[index] ? rows[index].Name : '');
    $('#lblVDCApplyAllCount').text(rows.length);
    $('#lblVDCApplyEmptyCount').text(emptyCount);
    $('#lblVDCApplyVisibleCount').text(visibleIdx.length);
    $('#btnVDCApplyEmpty').prop('disabled', emptyCount === 0);
    $('#btnVDCApplyVisible').toggle(searchActive && visibleIdx.length > 1);
    $('#dvVDCApplyModal').modal('show');
}

function ApplyVoucherDepriciationAccount(scope) {
    $('#dvVDCApplyModal').modal('hide');
    var a = G_VDCApply;
    G_VDCApply = null;
    if (!a || scope === 'ROW') return;

    var rows = G_VDCRows[a.side];
    var targets = scope === 'VISIBLE' ? a.visibleIdx : rows.map(function (r, i) { return i; });
    if (scope === 'EMPTY') targets = targets.filter(function (i) { return rows[i].AccountMaster_Code <= 0; });

    var $body = $(a.side === 'DR' ? '#tblVDCDrBody' : '#tblVDCCrBody');
    targets.forEach(function (i) {
        rows[i].AccountMaster_Code = a.account;
        var $ddl = $body.find('select[data-index="' + i + '"]');
        $ddl.val(String(a.account)).trigger('change.select2');
        $ddl.closest('tr').removeClass('vdc-row-missing');
    });
    toastr.success('Account applied to ' + targets.length + ' row(s).');
}

function _toList(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.Table)) return res.Table;
    if (Array.isArray(res.Data)) return res.Data;
    return [];
}

function _esc(v) {
    return String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _showLoader() { if (typeof Showloader === 'function') Showloader(); }
function _hideLoader() { if (typeof HideLoader === 'function') HideLoader(); }

function _basis(side) {
    return parseInt($(side === 'DR' ? '#ddlVDCDrBasis' : '#ddlVDCCrBasis').val(), 10) || 0;
}

function _basisText(side) {
    return $(side === 'DR' ? '#ddlVDCDrBasis' : '#ddlVDCCrBasis').find('option:selected').text() || '';
}

function _fillDropdown(selector, list) {
    $(selector).html(list.map(function (r) {
        return '<option value="' + _esc(r.Code) + '">' + _esc(r.Desp) + '</option>';
    }).join(''));
}

/** Saved value is the option text; rows saved earlier hold the numeric code. Returns the code. */
function _selectSavedBasis(selector, saved, fallback) {
    var $ddl = $(selector);
    var text = String(saved == null ? '' : saved).trim();
    var byText = $ddl.find('option').filter(function () { return $(this).text() === text; });
    if (byText.length) $ddl.val(byText.first().val());
    else _pickValue(selector, text, fallback);
    return parseInt($ddl.val(), 10) || 0;
}

function _pickValue(selector, value, fallback) {
    var $ddl = $(selector);
    var v = String(value || '');
    if (!v || !$ddl.find('option[value="' + v + '"]').length) v = String(fallback || '');
    if (!$ddl.find('option[value="' + v + '"]').length) v = $ddl.find('option:first').val() || '';
    $ddl.val(v);
}

function _setLocked(locked, finYear) {
    G_VDCLocked = locked;
    $('#lblVDCFinYear').text(finYear ? 'Financial Year: ' + finYear : '');
    $('#divVDCLockedMsg').toggle(locked);
    $('#ddlVDCDrBasis, #ddlVDCCrBasis, #ddlVDCPeriod, #ddlVDCDrSingleAccount').prop('disabled', locked);
    $('.btn-vdc-save').toggle(!locked);
}

function _ledgerOptions(selected) {
    var sel = parseInt(selected, 10) || 0;
    if (!sel) return G_VDCLedgerOptions;
    return G_VDCLedgerOptions.replace('value="' + sel + '"', 'value="' + sel + '" selected');
}

/* ───────────────────────── LOAD ───────────────────────── */

function ReloadVoucherDepriciationConfiguration() {
    _showLoader();
    G_VDCMapCache = {};
    Promise.all([
        VoucherDepriciationConfigurationService.GetLedgerList(),
        VoucherDepriciationConfigurationService.GetConfiguration(),
        VoucherDepriciationConfigurationService.GetDropdownList()
    ]).then(function (results) {
        _hideLoader();
        var ddl = results[2] || {};
        _fillDropdown('#ddlVDCDrBasis', ddl.DebitBasis || []);
        _fillDropdown('#ddlVDCCrBasis', ddl.CreditBasis || []);
        _fillDropdown('#ddlVDCPeriod', ddl.Period || []);

        G_VDCLedgerOptions = '<option value="0">-- Select Account --</option>' +
            _toList(results[0]).map(function (r) {
                return '<option value="' + (parseInt(r.Code, 10) || 0) + '">' + _esc(r.Desp) + '</option>';
            }).join('');

        var res = results[1] || {};
        var master = (res.Master && res.Master[0]) || null;
        G_VDCSaved = { Basis: { DR: 0, CR: 0 }, Accounts: { DR: {}, CR: {} } };
        (res.Transactions || []).forEach(function (t) {
            var side = String(t.TransactionType || '').toUpperCase();
            if (G_VDCSaved.Accounts[side]) G_VDCSaved.Accounts[side][parseInt(t.MasterTableCode, 10) || 0] = parseInt(t.AccountMaster_Code, 10) || 0;
        });

        $('#hfVDCCode').val(master ? master.Code : 0);
        G_VDCSaved.Basis.DR = _selectSavedBasis('#ddlVDCDrBasis', master && master.DrAccountDepriciation, BASIS.SINGLE);
        G_VDCSaved.Basis.CR = _selectSavedBasis('#ddlVDCCrBasis', master && master.CrAccountDepriciation, BASIS.TYPE);
        _pickValue('#ddlVDCPeriod', master && master.DepreciationPeriod, 'Year');
        _setLocked(!!master && master.IsVoucherCreated === 'Y', master ? master.FinYear : '');

        _loadSide('DR');
        _loadSide('CR');
    }).catch(function () {
        _hideLoader();
        toastr.error('Error loading Depreciation Configuration.');
    });
}

function _savedAccount(side, basis, masterTableCode) {
    if (G_VDCSaved.Basis[side] !== basis) return 0;
    return G_VDCSaved.Accounts[side][masterTableCode] || 0;
}

function _loadSide(side) {
    var basis = _basis(side);
    $(side === 'DR' ? '#lblVDCDrBasis' : '#lblVDCCrBasis').text(_basisText(side));
    $(side === 'DR' ? '#txtVDCDrSearch' : '#txtVDCCrSearch').val('');

    if (side === 'DR') {
        var isSingle = basis === BASIS.SINGLE;
        $('#divVDCDrSingle').toggle(isSingle);
        $('#divVDCDrGrid').toggle(!isSingle);
        if (isSingle) {
            G_VDCRows.DR = [];
            _renderSingle(_savedAccount('DR', BASIS.SINGLE, 0));
            return;
        }
    }

    _getMappingList(basis).then(function (list) {
        if (_basis(side) !== basis) return;
        G_VDCRows[side] = list.map(function (r) {
            var code = parseInt(r.Code, 10) || 0;
            return { Code: code, Name: r.Name || '', ParentName: r.ParentName || '', AccountMaster_Code: _savedAccount(side, basis, code) };
        });
        _renderGrid(side, basis);
    });
}

function _getMappingList(basis) {
    if (G_VDCMapCache[basis]) return Promise.resolve(G_VDCMapCache[basis]);
    _showLoader();
    return VoucherDepriciationConfigurationService.GetMappingList(basis)
        .then(function (res) {
            _hideLoader();
            if (res && res.Status && res.Status !== 'Y') {
                toastr.error(res.Msg || 'Error loading list.');
                return [];
            }
            G_VDCMapCache[basis] = _toList(res);
            return G_VDCMapCache[basis];
        })
        .catch(function () {
            _hideLoader();
            toastr.error('Error loading list.');
            return [];
        });
}

/* ───────────────────────── RENDER ───────────────────────── */

function _renderSingle(selected) {
    var $ddl = $('#ddlVDCDrSingleAccount');
    if ($ddl.hasClass('select2-hidden-accessible')) $ddl.select2('destroy');
    $ddl.html(_ledgerOptions(selected)).prop('disabled', G_VDCLocked);
    if ($.fn.select2) $ddl.select2({ width: '100%' });
}

function _renderGrid(side, basis) {
    var cols = BASIS_COLUMNS[basis] || ['', ''];
    var showParent = cols[1] !== '';
    var $head = $(side === 'DR' ? '#tblVDCDrHead' : '#tblVDCCrHead');
    var $body = $(side === 'DR' ? '#tblVDCDrBody' : '#tblVDCCrBody');
    var title = side === 'DR' ? 'Debit Account' : 'Credit Account';

    $head.html('<tr><th style="width:50px;">S.No</th><th>' + cols[0] + '</th>' +
        (showParent ? '<th>' + cols[1] + '</th>' : '') +
        '<th>' + title + ' <span class="req">*</span></th></tr>');

    $body.find('select.select2-hidden-accessible').select2('destroy');

    var rows = G_VDCRows[side];
    if (!rows.length) {
        $body.html('<tr><td colspan="4" class="vdc-map-empty"><i class="fa fa-inbox fa-2x d-block mb-2"></i>' +
            'No ' + _esc(cols[0]) + ' found.</td></tr>');
        return;
    }

    $body.html(rows.map(function (r, i) {
        return '<tr data-search="' + _esc((r.Name + ' ' + r.ParentName).toLowerCase()) + '">' +
            '<td class="text-center">' + (i + 1) + '</td>' +
            '<td>' + _esc(r.Name) + '</td>' +
            (showParent ? '<td>' + _esc(r.ParentName) + '</td>' : '') +
            '<td><select class="form-select form-select-sm" data-index="' + i + '"' + (G_VDCLocked ? ' disabled' : '') + '>' + _ledgerOptions(r.AccountMaster_Code) + '</select></td>' +
            '</tr>';
    }).join(''));

    if ($.fn.select2) $body.find('select[data-index]').select2({ width: '320px' });
}

function _filterRows(side, text) {
    var term = String(text || '').trim().toLowerCase();
    $(side === 'DR' ? '#tblVDCDrBody' : '#tblVDCCrBody').find('tr[data-search]').each(function () {
        $(this).toggle(!term || String($(this).data('search')).indexOf(term) >= 0);
    });
}

/* ───────────────────────── SAVE ───────────────────────── */

function _sideTransactions(side) {
    var basis = _basis(side);
    if (side === 'DR' && basis === BASIS.SINGLE) {
        var account = parseInt($('#ddlVDCDrSingleAccount').val(), 10) || 0;
        if (account <= 0) {
            toastr.warning('Please select Debit Account.');
            $('#ddlVDCDrSingleAccount').focus();
            return null;
        }
        return [{ MasterTableCode: 0, AccountMaster_Code: account, TransactionType: 'DR' }];
    }

    var rows = G_VDCRows[side];
    var label = (side === 'DR' ? 'Debit' : 'Credit') + ' Account';
    if (!rows.length) {
        toastr.warning('No ' + _basisText(side) + ' rows found for ' + label + '.');
        return null;
    }

    var missing = rows.filter(function (r) { return r.AccountMaster_Code <= 0; });
    if (missing.length) {
        var $body = $(side === 'DR' ? '#tblVDCDrBody' : '#tblVDCCrBody');
        $(side === 'DR' ? '#txtVDCDrSearch' : '#txtVDCCrSearch').val('');
        _filterRows(side, '');
        $body.find('select[data-index]').each(function () {
            $(this).closest('tr').toggleClass('vdc-row-missing', (parseInt($(this).val(), 10) || 0) <= 0);
        });
        toastr.warning('Please select ' + label + ' for all rows (' + missing.length + ' pending).');
        var $first = $body.find('tr.vdc-row-missing select').first();
        if ($first.hasClass('select2-hidden-accessible')) $first.select2('open'); else $first.focus();
        return null;
    }

    return rows.map(function (r) {
        return { MasterTableCode: r.Code, AccountMaster_Code: r.AccountMaster_Code, TransactionType: side };
    });
}

function SaveVoucherDepriciationConfiguration() {
    if (G_VDCLocked) {
        toastr.warning('Depreciation voucher is already created for this Financial Year. Configuration cannot be changed.');
        return;
    }
    var drRows = _sideTransactions('DR');
    if (!drRows) return;
    var crRows = _sideTransactions('CR');
    if (!crRows) return;

    var code = parseInt($('#hfVDCCode').val(), 10) || 0;
    var payload = {
        Code: code,
        Master: [{
            Code: code,
            DrAccountDepriciation: $('#ddlVDCDrBasis option:selected').text(),
            CrAccountDepriciation: $('#ddlVDCCrBasis option:selected').text(),
            DepreciationPeriod: $('#ddlVDCPeriod').val() || 'Year'
        }],
        Transactions: drRows.concat(crRows)
    };

    _showLoader();
    VoucherDepriciationConfigurationService.SaveConfiguration(payload)
        .then(function (res) {
            _hideLoader();
            if (res && res.Status === 'Y') {
                toastr.success(res.Msg || 'Saved successfully.');
                ReloadVoucherDepriciationConfiguration();
            } else {
                toastr.error((res && res.Msg) || 'Save failed.');
            }
        })
        .catch(function () { _hideLoader(); });
}

window.ReloadVoucherDepriciationConfiguration = ReloadVoucherDepriciationConfiguration;
window.SaveVoucherDepriciationConfiguration = SaveVoucherDepriciationConfiguration;
window.ApplyVoucherDepriciationAccount = ApplyVoucherDepriciationAccount;
