/**
 * TODConfiguration.js
 * TOD (Turn Over Discount) Configuration — list + create/edit form.
 * Item lookup uses the same object-list flow as IndentMaster.
 */
import { TODConfigurationMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/TODConfigurationMasterService.js';
import { DealerTargetMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/DealerTargetMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { initializeObjectlistControl } from '../../Bizsol.WebERP.UI.Shared/js/Pages/CustomControl/_ObjectListControlPage.js';

var G_TODList          = [];
var G_TODChipFilter    = '';
var G_ItemList         = [];
var G_PartyList        = [];
var G_PartyRows        = [];     /* selected parties — one saved record each */
var G_MarketingManList = [];
var G_ScopePartyCodes  = null;   /* null = no marketing-man filter */
var G_ScopeRefreshing  = false;
var G_PeriodicityList  = [];
/* var G_MonthList        = []; */
var G_SlabRowCount     = 0;
var G_RateRowCount     = 0;
var G_FormReady        = false;
var G_CurrentItemRowId = 0;
var G_MobileEditRowId  = null;
var G_MobileRateEditRowId = null;
var G_MobileItemCode   = 0;
var G_PartyFilterSnapshot = null;
var G_PartyFilterApplied  = false;
var TOD_OBJ_MODAL      = 'TODLookupObjectListModal';
var TOD_ALL_ITEM_NAME  = 'All';
var TOD_QTY_STEP       = 0.01;   /* gap between the end of one slab and the start of the next */

function _isTODMobile() {
    return window.innerWidth <= 768;
}

$(document).ready(function () {
    var urlParams = typeof getUrlVars === 'function'
        ? getUrlVars()
        : BizSolHelperFunction.getUrlVars();
    var menuValue = decodeURI(urlParams['menu'] || '');
    if (menuValue && menuValue !== 'undefined' && menuValue !== '') {
        $('#ERPHeading').text(menuValue);
    } else {
        $('#ERPHeading').text('TOD Configuration');
    }

    _bindSlabGridKeys();
    _bindRateGridKeys();
    _bindPartyLookupKeys();
    LoadTODList();
});

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

function _esc(v) {
    return String(v == null ? '' : v)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

function _normalizeTODDesp(value) {
    return String(value == null ? '' : value).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function _todNameAlreadyExists(name, code) {
    var key = _normalizeTODDesp(name);
    if (!key) return false;
    var current = parseInt(code || 0, 10) || 0;
    return (G_TODList || []).some(function (row) {
        var rowCode = parseInt(row.Code ?? row.code ?? 0, 10) || 0;
        if (current && rowCode === current) return false;
        var desp = row['TOD Name'] ?? row.TODConfigurationDesp ?? '';
        return _normalizeTODDesp(desp) === key;
    });
}

function _xmlTag(name, value) {
    var text = String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return '<' + name + '>' + text + '</' + name + '>';
}

function _dedup(arr) {
    return arr.filter(function (v, i, a) { return a.indexOf(v) === i; });
}

function _num(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
}

function _fillSelect($el, list, placeholder, placeholderValue) {
    $el.empty();
    $el.append($('<option>').val(placeholderValue == null ? '' : placeholderValue).text(placeholder || '-- Select --'));
    (list || []).forEach(function (item) {
        var code = item.Code ?? item.code ?? '';
        var desp = item.Desp ?? item.desp ?? item.AccountDesp ?? item.ItemName ?? '';
        $el.append($('<option>').val(code).text(desp));
    });
}

function _initSelect2($el, $parent) {
    if (!$.fn.select2 || !$el.length) return;
    if ($el.hasClass('select2-hidden-accessible')) $el.select2('destroy');
    var opts = { width: '100%', placeholder: $el.find('option:first').text() || '-- Select --' };
    if ($parent && $parent.length) opts.dropdownParent = $parent;
    $el.select2(opts);
}

/* ══════════════════════════════════════════════════
   LIST
══════════════════════════════════════════════════ */

window.LoadTODList = function () {
    TODConfigurationMasterService.GetTODConfigurationList()
        .then(function (data) {
            G_TODList = _toList(data);
            _updateTODStatChips(G_TODList);
            _renderTable(_todFilteredList());
        })
        .catch(function (err) {
            toastr.error('Error loading TOD Configuration list.');
            console.error('TODConfiguration LOCATE error:', err);
        });
};

function _todStatusText(row) {
    return String((row && (row.Status || row.status)) || '').trim().toLowerCase();
}

function _todFilteredList() {
    var list = G_TODList || [];
    if (!G_TODChipFilter) return list;
    return list.filter(function (row) { return _todStatusText(row) === G_TODChipFilter; });
}

function _fmtTODStat(n) {
    return n > 0 ? String(n) : '—';
}

function _updateTODStatChips(list) {
    var rows = list || [];
    var count = function (status) {
        return rows.filter(function (r) { return _todStatusText(r) === status; }).length;
    };
    $('#statTotalTOD').text(rows.length > 0 ? String(rows.length) : '—');
    $('#statRunningTOD').text(_fmtTODStat(count('running')));
    $('#statUpcomingTOD').text(_fmtTODStat(count('upcoming')));
    $('#statExpiredTOD').text(_fmtTODStat(count('expired')));
    _syncTODChipActive();
}

function _syncTODChipActive() {
    $('#todChipTotal').toggleClass('is-active', !G_TODChipFilter);
    $('#todChipRunning').toggleClass('is-active', G_TODChipFilter === 'running');
    $('#todChipUpcoming').toggleClass('is-active', G_TODChipFilter === 'upcoming');
    $('#todChipExpired').toggleClass('is-active', G_TODChipFilter === 'expired');
}

window.FilterTODChip = function (chip) {
    chip = String(chip || 'total');
    if (chip === 'total' || G_TODChipFilter === chip) {
        G_TODChipFilter = '';
    } else {
        G_TODChipFilter = chip;
    }
    _syncTODChipActive();

    if (!G_TODList.length) {
        LoadTODList();
        return;
    }
    _renderTable(_todFilteredList());
};

function _renderTable(data) {
    if (!data || data.length === 0) {
        $('#tblTODHeader').html('');
        $('#tblTODBody').html(
            '<tr><td colspan="12" class="text-center text-muted py-4">' +
            '<i class="fa fa-inbox fa-2x d-block mb-2 text-muted"></i>' +
            'No TOD configuration found.</td></tr>'
        );
        $('#paginator-TODConfigurationTable').html('');
        $('#divTODGrid').show();
        return;
    }

    var statusClass = { running: 'row-running', upcoming: 'row-upcoming', expired: 'row-expired' };
    var augmented = data.map(function (row, index) {
        var copy = Object.assign({ 'S.No': index + 1 }, row);
        copy['S.No'] = index + 1;
        var cssClass = statusClass[_todStatusText(copy)];
        if (cssClass) copy.__bizsolRowClass = cssClass;
        var code = copy.Code ?? copy.code ?? 0;
        if (code) {
            copy.Action =
                `<button class="btn btn-warning icon-height mb-1" title="Edit" onclick="OpenTODForm('Edit',${code})"><i class="fa fa-edit"></i></button>` +
                ` <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteTODRow(${code})"><i class="fa fa-trash"></i></button>`;
        }
        return copy;
    });

    var hiddenColumns = [
        'Code', 'code', '__bizsolRowClass',
        'Month',
        'Party', 'Marketing Man', 'Slabs',
        'Increase Value', 'Decrease Value',
        'CD Percentage', 'CD Days',
        'Fin Year', 'Created By', 'Create Date'
    ];
    var stringCols    = [];
    var numericCols   = [];
    var dateCols      = [];
    var colAlignment  = { 'S.No': 'right', Action: 'center' };

    Object.keys(augmented[0]).forEach(function (key) {
        if (key === 'S.No' || key === '__bizsolRowClass' || hiddenColumns.indexOf(key) !== -1 || key === 'Action') return;
        var lk = key.toLowerCase();
        if (lk.indexOf('date') >= 0 && lk.indexOf('create') < 0) {
            dateCols.push(key);
            colAlignment[key] = 'center';
        } else if (['value', 'percentage', 'days', 'slabs', 'rate', 'amount'].some(function (kw) { return lk.indexOf(kw) >= 0; })) {
            numericCols.push(key);
            colAlignment[key] = 'right';
        } else {
            stringCols.push(key);
        }
    });

    $('#divTODGrid').show();

    BizsolCustomFilterGrid.CreateDataTable(
        'tblTODHeader',
        'tblTODBody',
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
        'Search by TOD Name, Periodicity, Consider AS Per…'
    );

    _fitTODListColumns();
}

function _todHeaderLabel($th) {
    var label = ($th.find('.filter-table-heading').first().text() || $th.text() || '');
    return label.replace(/\s+/g, ' ').trim();
}

function _fitTODListColumns() {
    var $tbl = $('#TODConfigurationTable');
    if (!$tbl.length) return;

    var actionIndex = -1;
    var snoIndex = -1;
    $tbl.find('thead th').each(function (i) {
        var label = _todHeaderLabel($(this));
        var isAction = label === 'Action';
        var isSno = label === 'S.No' || label === 'S.No.';
        $(this).toggleClass('tod-action-col', isAction);
        $(this).toggleClass('tod-sno-col', isSno);
        if (isAction) actionIndex = i;
        if (isSno) snoIndex = i;
    });

    $tbl.find('tbody tr').each(function () {
        $(this).children('td').each(function (i) {
            $(this).toggleClass('tod-action-col', i === actionIndex);
            $(this).toggleClass('tod-sno-col', i === snoIndex);
        });
    });

    var $pager = $('#paginator-TODConfigurationTable');
    $pager.off('click.todFit').on('click.todFit', function () {
        setTimeout(_fitTODListColumns, 0);
    });
}

/* ══════════════════════════════════════════════════
   FORM LOOKUPS
══════════════════════════════════════════════════ */

function _ensureFormLookups() {
    if (G_FormReady) return Promise.resolve();

    return Promise.all([
        TODConfigurationMasterService.GetPeriodicityList().catch(function () { return []; }),
        /* TODConfigurationMasterService.GetMonthList().catch(function () { return []; }), */
        TODConfigurationMasterService.GetPartyList().catch(function () { return []; }),
        TODConfigurationMasterService.GetItemList(0).catch(function () { return []; }),
        DealerTargetMasterService.GetNestedMarketingManList().catch(function () { return []; })
    ]).then(function (results) {
        G_PeriodicityList  = _toList(results[0]);
        /* G_MonthList        = _toList(results[1]); */
        G_PartyList        = _toList(results[1]);
        G_ItemList         = _toList(results[2]);
        G_MarketingManList = _toList(results[3]).map(function (person) {
            return {
                Code: person.Code ?? person.MarketingManMaster_Code ?? '',
                Desp: String(person.PersonName ?? person.Desp ?? person.MarketingManName ?? '').trim()
            };
        }).filter(function (person) {
            return person.Desp && String(person.Code) !== '';
        });

        if (!G_PeriodicityList.length) {
            G_PeriodicityList = ['Month', 'Quarter', 'Half Yearly', 'Yearly', 'Custom']
                .map(function (p) { return { Code: p, Desp: p }; });
        }

        _fillSelect($('#frmDdlPeriodicity'), G_PeriodicityList, '-- Select Periodicity --');
        /* _fillSelect($('#frmDdlMonth'), G_MonthList, '-- Select Period --'); */
        _fillSelect($('#frmDdlMarketingMan'), G_MarketingManList, '-- All --', 0);
        _refreshScopeDropdowns();

        _initSelect2($('#frmDdlPeriodicity'));
        _initSelect2($('#frmDdlConsiderASPer'));
        _initSelect2($('#frmDdlTurnoverASPer'));
        _initSelect2($('#frmDdlTurnoverDiscountASPer'));
        /* _initSelect2($('#frmDdlMonth')); */
        _renderPartyRows();

        G_FormReady = true;
    });
}

/* ══════════════════════════════════════════════════
   PARTY SCOPE (Marketing Man → Zone → State → City → Party)
   Filter lives in the modal. OK binds the outside Party object-list.
   Selected parties save only to TODConfigurationAccountDetail.
══════════════════════════════════════════════════ */

function _scopeText(party, field) {
    return String((party && party[field]) || '').trim();
}

function _partiesInScope(ignore) {
    var zone  = ignore === 'zone'  ? '' : String($('#frmDdlZone').val()  || '');
    var state = ignore === 'state' || ignore === 'zone' ? '' : String($('#frmDdlState').val() || '');
    var city  = ignore === 'city'  || ignore === 'state' || ignore === 'zone' ? '' : String($('#frmDdlCity').val() || '');

    return (G_PartyList || []).filter(function (party) {
        var code = String(party.Code ?? party.code ?? '');
        if (G_ScopePartyCodes && G_ScopePartyCodes.indexOf(code) < 0) return false;
        if (zone  && _scopeText(party, 'Zone')  !== zone)  return false;
        if (state && _scopeText(party, 'State') !== state) return false;
        if (city  && _scopeText(party, 'City')  !== city)  return false;
        return true;
    });
}

function _distinctScopeValues(parties, field) {
    var seen = {};
    var values = [];
    (parties || []).forEach(function (party) {
        var v = _scopeText(party, field);
        if (!v || seen[v]) return;
        seen[v] = true;
        values.push(v);
    });
    return values.sort().map(function (v) { return { Code: v, Desp: v }; });
}

function _keepSelection($el, list, value) {
    if (!value) return;
    var exists = (list || []).some(function (row) { return String(row.Code) === String(value); });
    if (exists) $el.val(String(value));
}

/**
 * Rebuilds Zone / State / City so each dropdown only offers values that still
 * have parties behind them.
 *
 * G_ScopeRefreshing is required because jQuery's trigger() also runs an
 * element's inline onchange attribute, namespace or not, so the select2
 * refresh below would otherwise re-enter this function forever.
 */
function _refreshScopeDropdowns() {
    if (G_ScopeRefreshing) return;
    G_ScopeRefreshing = true;

    try {
        var zoneSel  = String($('#frmDdlZone').val()  || '');
        var stateSel = String($('#frmDdlState').val() || '');
        var citySel  = String($('#frmDdlCity').val()  || '');

        var zoneList  = _distinctScopeValues(_partiesInScope('zone'),  'Zone');
        var stateList = _distinctScopeValues(_partiesInScope('state'), 'State');
        var cityList  = _distinctScopeValues(_partiesInScope('city'),  'City');

        _fillSelect($('#frmDdlZone'),  zoneList,  '-- All --');
        _fillSelect($('#frmDdlState'), stateList, '-- All --');
        _fillSelect($('#frmDdlCity'),  cityList,  '-- All --');

        _keepSelection($('#frmDdlZone'),  zoneList,  zoneSel);
        _keepSelection($('#frmDdlState'), stateList, stateSel);
        _keepSelection($('#frmDdlCity'),  cityList,  citySel);

        _updatePartyCount();

        if ($.fn.select2) {
            $('#frmDdlZone, #frmDdlState, #frmDdlCity').trigger('change.select2');
        }
    } finally {
        G_ScopeRefreshing = false;
    }
}

/* ══════════════════════════════════════════════════
   PARTY SELECTION (object list, multi-select → one row each)
══════════════════════════════════════════════════ */

function _partyLabel(party) {
    return String(party.Desp ?? party.desp ?? party.AccountDesp ?? party['Party Name'] ?? '').trim();
}

function _selectedMarketingManName() {
    var $ddl = $('#frmDdlMarketingMan');
    if (!$ddl.length) return '';
    var code = String($ddl.val() || '').trim();
    if (!code || code === '0') return '';
    var text = String($ddl.find('option:selected').text() || '').trim();
    return text === '-- All --' ? '' : text;
}

function _updatePartyCount() {
    var inScope = _partiesInScope().length;
    var picked  = G_PartyRows.length;
    var text = picked
        ? (picked + ' selected of ' + inScope + ' in scope')
        : (inScope + ' part' + (inScope === 1 ? 'y' : 'ies') + ' in scope — none selected (All Parties)');
    $('#frmTxtPartyCount').text(text);
    $('#frmTxtPartyCountBar').text(text);
}

function _readPartyFilter() {
    return {
        marketingMan: parseInt($('#frmDdlMarketingMan').val() || 0, 10) || 0,
        zone:  String($('#frmDdlZone').val()  || ''),
        state: String($('#frmDdlState').val() || ''),
        city:  String($('#frmDdlCity').val()  || '')
    };
}

function _writePartyFilter(filter) {
    if (!filter) return;
    $('#frmDdlMarketingMan').val(String(filter.marketingMan || 0));
    $('#frmDdlZone').val(filter.zone || '');
    $('#frmDdlState').val(filter.state || '');
    $('#frmDdlCity').val(filter.city || '');
}

function _reloadPartyList(marketingManCode, then) {
    TODConfigurationMasterService.GetPartyList(marketingManCode || 0).then(function (res) {
        G_PartyList = _toList(res);
        if (then) then();
    }).catch(function () {
        if (then) then();
    });
}

function _restorePartyFilterSnapshot() {
    var snap = G_PartyFilterSnapshot;
    if (!snap) return;
    _writePartyFilter(snap);
    _reloadPartyList(snap.marketingMan, function () {
        _refreshScopeDropdowns();
        if ($.fn.select2) {
            $('#frmDdlMarketingMan').val(String(snap.marketingMan || 0)).trigger('change.select2');
            $('#frmDdlZone').val(snap.zone || '').trigger('change.select2');
            $('#frmDdlState').val(snap.state || '').trigger('change.select2');
            $('#frmDdlCity').val(snap.city || '').trigger('change.select2');
        }
        _updatePartyCount();
    });
}

window.OpenTODPartyFilterModal = function () {
    G_PartyFilterApplied = false;
    G_PartyFilterSnapshot = _readPartyFilter();
    var $modal = $('#todModalPartyFilter');
    $modal.off('shown.bs.modal.todFilter').on('shown.bs.modal.todFilter', function () {
        var $parent = $('#todModalPartyFilter');
        _initSelect2($('#frmDdlMarketingMan'), $parent);
        _initSelect2($('#frmDdlZone'), $parent);
        _initSelect2($('#frmDdlState'), $parent);
        _initSelect2($('#frmDdlCity'), $parent);
        _refreshScopeDropdowns();
    });
    $modal.off('hidden.bs.modal.todFilterCancel').on('hidden.bs.modal.todFilterCancel', function () {
        if (G_PartyFilterApplied) return;
        _restorePartyFilterSnapshot();
    });
    $modal.modal('show');
};

window.ApplyTODPartyFilter = function () {
    G_PartyFilterApplied = true;
    var man = parseInt($('#frmDdlMarketingMan').val() || 0, 10) || 0;
    _reloadPartyList(man, function () {
        if (man && !G_PartyList.length) {
            toastr.warning('No party is mapped to the selected marketing man.');
        }
        _refreshScopeDropdowns();
        _updatePartyCount();
        $('#todModalPartyFilter').modal('hide');
        var inScope = _partiesInScope().length;
        toastr.success(inScope + ' part' + (inScope === 1 ? 'y is' : 'ies are') + ' bound to the Party list.');
        $('#frmTxtPartyLookup').trigger('focus');
    });
};

/** The grid only exists while parties are picked — no rows means All Parties. */
function _renderPartyRows() {
    var $body = $('#tblTODPartiesBody');
    if (!$body.length) return;

    $body.html(G_PartyRows.map(function (party, index) {
        return '<tr>' +
            '<td class="col-sno text-center fw-bold">' + (index + 1) + '</td>' +
            '<td class="col-party">' + _esc(party.Desp) + '</td>' +
            '<td class="col-marketingman">' + _esc(party.MarketingMan) + '</td>' +
            '<td class="col-zone">' + _esc(party.Zone) + '</td>' +
            '<td class="col-state">' + _esc(party.State) + '</td>' +
            '<td class="col-city">' + _esc(party.City) + '</td>' +
            '<td class="col-action text-center">' +
            '<button type="button" class="del-row-btn" title="Remove" ' +
            'onclick="RemoveTODPartyRow(\'' + _esc(party.Code) + '\')"><i class="fa fa-times-circle"></i></button>' +
            '</td></tr>';
    }).join(''));

    $('#divTODPartyGrid').toggle(G_PartyRows.length > 0);
    _updatePartyCount();
    RenderTODMobilePartyCards();
}

function RenderTODMobilePartyCards() {
    var container = $('#todMobilePartyCards');
    if (!container.length) return;
    container.empty();

    if (!G_PartyRows.length) return;

    container.html(G_PartyRows.map(function (party, index) {
        return '<div class="mobile-slab-card tod-party-card">' +
            '<div class="slab-card-header">' +
            '<span class="slab-card-num">' + (index + 1) + '</span>' +
            '<span class="slab-card-name">' + _esc(party.Desp) + '</span>' +
            '<div class="slab-card-actions">' +
            '<button type="button" class="slab-card-del-btn" title="Remove" ' +
            'onclick="RemoveTODPartyRow(\'' + _esc(party.Code) + '\')"><i class="fa fa-trash"></i></button>' +
            '</div></div>' +
            '<div class="slab-card-details">' +
            '<span class="slab-card-detail"><b>Marketing Man</b>' + _esc(party.MarketingMan || '—') + '</span>' +
            '<span class="slab-card-detail"><b>Zone</b>' + _esc(party.Zone || '—') + '</span>' +
            '<span class="slab-card-detail"><b>State</b>' + _esc(party.State || '—') + '</span>' +
            '<span class="slab-card-detail"><b>City</b>' + _esc(party.City || '—') + '</span>' +
            '</div></div>';
    }).join(''));
}
window.RenderTODMobilePartyCards = RenderTODMobilePartyCards;

window.RemoveTODPartyRow = function (code) {
    G_PartyRows = G_PartyRows.filter(function (party) { return String(party.Code) !== String(code); });
    _renderPartyRows();
};

function _addPartyRow(party) {
    var code = String(party.Code ?? party.code ?? '').trim();
    if (!code || code === '0') return false;
    if (G_PartyRows.some(function (row) { return String(row.Code) === code; })) return false;

    G_PartyRows.push({
        Code:         code,
        Desp:         _partyLabel(party) || ('Party #' + code),
        MarketingMan: String(party.MarketingMan ?? party['Marketing Man'] ?? _selectedMarketingManName()).trim(),
        MarketingManMaster_Code: parseInt(party.MarketingManMaster_Code || 0, 10) || 0,
        City:         _scopeText(party, 'City'),
        State:        _scopeText(party, 'State'),
        Zone:         _scopeText(party, 'Zone')
    });
    return true;
}

function _partyObjListData() {
    return _partiesInScope().map(function (party) {
        var manName = String(party.MarketingMan ?? party['Marketing Man'] ?? _selectedMarketingManName()).trim();
        return {
            'Marketing Man': manName,
            Zone:  _scopeText(party, 'Zone'),
            State: _scopeText(party, 'State'),
            City:  _scopeText(party, 'City'),
            'Party Name': _partyLabel(party),
            Code:  party.Code ?? party.code,
            Desp:  _partyLabel(party),
            MarketingMan: manName,
            MarketingManMaster_Code: party.MarketingManMaster_Code ?? 0
        };
    });
}

window.ShowTODPartyObjectList = function (value) {
    var list = _partyObjListData();
    if (!list.length) {
        toastr.warning('No party available in the current scope.');
        return;
    }
    if (!String(value || '').trim()) {
        toastr.warning('Type .. and press Enter to open the party list.');
        return;
    }

    var open = _parseObjListOpen(value);

    initializeObjectlistControl({
        ModalId: TOD_OBJ_MODAL,
        searchvalue: open.searchValue,
        MatchType: open.matchType,
        MultiSelect: true,
        ClientOrderProjectData: list,
        CallBackFunctionName_btnDone: 'onTODPartySelected',
        DefaultColumnfilter: 'Party Name',
        ModalTitle: 'Select Party',
        Columns: [
            { field: 'Party Name', header: 'Party Name', visible: true },
            { field: 'Marketing Man', header: 'Marketing Man', visible: true },
            { field: 'Zone', header: 'Zone', visible: true },
            { field: 'State', header: 'State', visible: true },
            { field: 'City', header: 'City', visible: true },
            { field: 'Code', visible: false },
            { field: 'Desp', visible: false },
            { field: 'MarketingMan', visible: false },
            { field: 'MarketingManMaster_Code', visible: false }
        ]
    });

    var $modal = $('#' + TOD_OBJ_MODAL);
    $modal.find('.modal-dialog').removeClass('modal-lg').addClass('modal-xl')
        .css({ 'max-width': '1040px', width: '94vw' });
    $modal.find('.modal-body').children('div').eq(1).css({ 'overflow-x': 'auto', 'overflow-y': 'auto' });
    _raiseObjListZIndex();

    $modal.off('hidden.bs.modal.todParty').on('hidden.bs.modal.todParty', function () {
        $('#frmTxtPartyLookup').val('');
    });
};

window.onTODPartySelected = function (response) {
    if (!response || !response.length) return;

    var added = 0;
    response.forEach(function (party) { if (_addPartyRow(party)) added++; });

    _renderPartyRows();
    $('#frmTxtPartyLookup').val('');

    if (!added) toastr.info('The selected part' + (response.length === 1 ? 'y is' : 'ies are') + ' already in the list.');
};

function _bindPartyLookupKeys() {
    $(document).off('keydown.todParty', '#frmTxtPartyLookup')
        .on('keydown.todParty', '#frmTxtPartyLookup', function (e) {
            if (e.key !== 'Enter' && e.keyCode !== 13) return;
            e.preventDefault();
            ShowTODPartyObjectList($(this).val() || '..');
        });
}

window.OnTODScopeChange = function (changed) {
    if (G_ScopeRefreshing) return;

    /* Clear the narrower levels so a stale City cannot hide every party. */
    if (changed === 'zone')  { $('#frmDdlState').val(''); $('#frmDdlCity').val(''); }
    if (changed === 'state') { $('#frmDdlCity').val(''); }
    _refreshScopeDropdowns();
};

window.OnTODMarketingManChange = function () {
    if (G_ScopeRefreshing) return;

    var code = parseInt($('#frmDdlMarketingMan').val() || 0, 10) || 0;

    $('#frmDdlZone').val('');
    $('#frmDdlState').val('');
    $('#frmDdlCity').val('');
    G_ScopePartyCodes = null;

    TODConfigurationMasterService.GetPartyList(code).then(function (res) {
        G_PartyList = _toList(res);
        if (code && !G_PartyList.length) {
            toastr.warning('No party is mapped to the selected marketing man.');
        }
        _refreshScopeDropdowns();
    }).catch(function () {
        _refreshScopeDropdowns();
    });
};

function _findItem(code) {
    var key = String(code == null ? '' : code);
    if (key === '' ) return null;
    if (key === '0') return { Code: 0, Desp: TOD_ALL_ITEM_NAME, UOM: '', ItemSpecification: '' };
    return (G_ItemList || []).filter(function (item) {
        return String(item.Code ?? item.code) === key;
    })[0] || null;
}

function _itemDisplayName(item) {
    if (!item) return '';
    return item.Desp ?? item.ItemName ?? item['Item Name'] ?? '';
}

/* ══════════════════════════════════════════════════
   ITEM OBJECT LIST (type ".." + Enter)
══════════════════════════════════════════════════ */

function _parseObjListOpen(value) {
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

function _itemObjListData() {
    var rows = [{
        'Item Name': TOD_ALL_ITEM_NAME,
        'Item Code': '',
        UOM: '',
        'Item Specification': 'Applies to every item',
        Category: '',
        Code: 0,
        Desp: TOD_ALL_ITEM_NAME,
        ItemSpecification: ''
    }];

    (G_ItemList || []).forEach(function (item) {
        rows.push({
            'Item Name': item.Desp ?? item.ItemName ?? '',
            'Item Code': item.ItemCode ?? '',
            UOM: item.UOM ?? item.uom ?? '',
            'Item Specification': item.ItemSpecification ?? item.itemSpecification ?? '',
            Category: item.Category ?? item.CategoryName ?? '',
            Code: item.Code ?? item.code,
            Desp: item.Desp ?? item.ItemName ?? '',
            ItemSpecification: item.ItemSpecification ?? item.itemSpecification ?? ''
        });
    });

    return rows;
}

function _raiseObjListZIndex() {
    setTimeout(function () {
        var $m = $('#' + TOD_OBJ_MODAL);
        $m.css('z-index', 1080);
        $('.modal-backdrop').last().css('z-index', 1075);
        $m.find('[data-bs-dismiss="modal"]').off('click.todObjClose').on('click.todObjClose', function (e) {
            e.preventDefault();
            $m.modal('hide');
        });
    }, 120);
}

window.ShowTODItemObjectList = function (rowId, value) {
    var list = _itemObjListData();
    if (list.length <= 1) {
        toastr.warning('No item data available.');
        return;
    }
    if (!String(value || '').trim()) {
        toastr.warning('Type .. and press Enter to open the item list.');
        return;
    }

    var open = _parseObjListOpen(value);
    G_CurrentItemRowId = rowId;

    initializeObjectlistControl({
        ModalId: TOD_OBJ_MODAL,
        searchvalue: open.searchValue,
        MatchType: open.matchType,
        MultiSelect: _isLastSlabRow(rowId),
        ClientOrderProjectData: list,
        CallBackFunctionName_btnDone: 'onTODItemSelected',
        DefaultColumnfilter: 'Item Name',
        ModalTitle: 'Select Item',
        Columns: [
            { field: 'Item Name', header: 'Item Name', visible: true },
            { field: 'Item Code', header: 'Item Code', visible: true },
            { field: 'UOM', header: 'UOM', visible: true },
            { field: 'Item Specification', header: 'Item Specification', visible: true },
            { field: 'Category', header: 'Category', visible: true },
            { field: 'Code', visible: false },
            { field: 'Desp', visible: false },
            { field: 'ItemSpecification', visible: false }
        ]
    });

    var $modal = $('#' + TOD_OBJ_MODAL);
    $modal.find('.modal-dialog').removeClass('modal-lg').addClass('modal-xl')
        .css({ 'max-width': '1040px', width: '94vw' });
    $modal.find('.modal-body').children('div').eq(1).css({ 'overflow-x': 'auto', 'overflow-y': 'auto' });
    _raiseObjListZIndex();

    $modal.off('hidden.bs.modal.todItem').on('hidden.bs.modal.todItem', function () {
        if (!G_CurrentItemRowId) return;
        var restoreId = G_CurrentItemRowId;
        G_CurrentItemRowId = 0;
        _restoreItemLookup(restoreId);
    });
};

/** Cancelling the lookup puts the row's own item back, not the typed ".." . */
function _itemCodeFromRow(rowId) {
    var raw = $('#frmHfItem_' + rowId).val();
    if (raw === '' || raw == null) return null;
    var n = parseInt(raw, 10);
    return isNaN(n) ? null : n;
}

function _restoreItemLookup(rowId) {
    if (rowId === 'mobile') return;
    var code = _itemCodeFromRow(rowId);
    if (code === null) {
        $('#frmTxtItem_' + rowId).val('');
        return;
    }
    var item = _findItem(code);
    $('#frmTxtItem_' + rowId).val(item ? _itemDisplayName(item) : (code === 0 ? TOD_ALL_ITEM_NAME : ''));
}

function _isLastSlabRow(rowId) {
    if (rowId === 'mobile') return false;
    var maxId = 0;
    $('#tblTODSlabsBody tr').each(function () {
        var id = parseInt(String($(this).attr('id') || '').replace('todSlabRow_', ''), 10) || 0;
        if (id > maxId) maxId = id;
    });
    return parseInt(rowId, 10) === maxId;
}

/** Item codes currently in the grid, excluding the row being edited. */
function _otherRowItemCodes(exceptRowId) {
    var codes = [];
    $('#tblTODSlabsBody tr').each(function () {
        var rowId = String($(this).attr('id') || '').replace('todSlabRow_', '');
        if (String(rowId) === String(exceptRowId)) return;
        var code = _itemCodeFromRow(rowId);
        if (code === null) return;
        codes.push(code);
    });
    return codes;
}

/**
 * "All" already covers every item, so the grid holds either All or specific
 * items — never both. Several slabs of the same item are still fine.
 */
function _canUseItem(rowId, code) {
    var others = _otherRowItemCodes(rowId);
    if (code === 0 && others.some(function (c) { return c > 0; })) {
        toastr.warning('Item "All" cannot be used while specific items are in the grid.');
        return false;
    }
    if (code > 0 && others.indexOf(0) >= 0) {
        toastr.warning('The grid already uses item "All" — remove it before adding a specific item.');
        return false;
    }
    if (code > 0 && others.indexOf(code) >= 0) {
        toastr.warning('This item is already in the list.');
        return false;
    }
    return true;
}

window.onTODItemSelected = function (response) {
    if (!response || !response.length || !G_CurrentItemRowId) return;
    var startId = G_CurrentItemRowId;
    G_CurrentItemRowId = 0;

    var codes = response.map(function (item) { return parseInt(item.Code ?? item.code ?? 0, 10) || 0; });
    if (codes.length > 1 && codes.indexOf(0) >= 0) {
        toastr.warning('Item "All" cannot be selected together with specific items.');
        return;
    }
    if (!_canUseItem(startId, codes[0])) return;

    if (startId === 'mobile') {
        _applyItemToMobileModal(response[0]);
        return;
    }

    response.forEach(function (item, index) {
        var rowId = startId;
        if (index > 0) {
            _appendSlabRow({});
            rowId = G_SlabRowCount;
        }
        _applyItemToRow(rowId, item);
    });

    if (_isTODMobile()) RenderTODMobileSlabCards();
    _todFocus('#frmTxtItem_' + startId);
};

function _applyItemToRow(rowId, item) {
    if (!item) return;
    var code = parseInt(item.Code ?? item.code ?? 0, 10) || 0;
    var master = _findItem(code) || item;

    $('#frmHfItem_' + rowId).val(code);
    $('#frmTxtItem_' + rowId).val(_itemDisplayName(item) || _itemDisplayName(master) || (code === 0 ? TOD_ALL_ITEM_NAME : ''));
    $('#frmTxtSpec_' + rowId).val(item.ItemSpecification ?? master.ItemSpecification ?? '');
    $('#frmTxtUom_' + rowId).val(item.UOM ?? master.UOM ?? '');
}

function _applyItemToMobileModal(item) {
    if (!item) return;
    var code = item.Code ?? item.code ?? 0;
    $('#todMobileDdlItem').val(String(code)).trigger('change');
}

/* ══════════════════════════════════════════════════
   SLAB GRID (desktop)
══════════════════════════════════════════════════ */

window.AddTODSlabRow = function (preset, silent) {
    if (_isTODMobile() && !preset && !silent) {
        OpenTODMobileSlabModal(null);
        return;
    }
    _appendSlabRow(preset || {});
};

function _appendSlabRow(preset) {
    G_SlabRowCount++;
    var rowId = G_SlabRowCount;
    preset = preset || {};

    var rawCode  = preset.ItemMaster_Code;
    var hasCode  = rawCode !== undefined && rawCode !== null && String(rawCode) !== '';
    var itemCode = hasCode ? (parseInt(rawCode, 10) || 0) : '';
    var item     = hasCode ? _findItem(itemCode) : null;
    var itemName = preset.ItemName || _itemDisplayName(item) || (hasCode && itemCode === 0 ? TOD_ALL_ITEM_NAME : '');
    var spec     = preset.ItemSpecification || (item ? (item.ItemSpecification || '') : '');
    var uom      = preset.UOM || (item ? (item.UOM || '') : '');

    var row = `<tr id="todSlabRow_${rowId}">
        <td class="col-sno text-center fw-bold">${rowId}</td>
        <td class="col-item">
            <div class="tod-item-lookup-wrap">
                <input type="text" id="frmTxtItem_${rowId}" class="form-control form-control-sm tod-item-lookup"
                       value="${_esc(itemName)}" placeholder="Type .. for list" autocomplete="off" />
                <input type="hidden" id="frmHfItem_${rowId}" value="${hasCode ? _esc(itemCode) : ''}" />
                <input type="hidden" id="frmTxtSpec_${rowId}" value="${_esc(spec)}" />
                <input type="hidden" id="frmTxtUom_${rowId}" value="${_esc(uom)}" />
            </div>
        </td>
        <td class="col-action text-center">
            <button type="button" class="del-row-btn" title="Remove" onclick="DeleteTODSlabRow(${rowId})"><i class="fa fa-times-circle"></i></button>
        </td>
    </tr>`;

    $('#tblTODSlabsBody').append(row);
    _renumberSlabRows();
}

window.DeleteTODSlabRow = function (rowId) {
    if ($('#tblTODSlabsBody tr').length <= 1 && !_isTODMobile()) {
        toastr.warning('At least one item row is required.');
        return;
    }
    $('#todSlabRow_' + rowId).remove();
    _renumberSlabRows();
    if (_isTODMobile()) RenderTODMobileSlabCards();
};

function _renumberSlabRows() {
    $('#tblTODSlabsBody tr').each(function (index) {
        $(this).find('td:first').text(index + 1);
    });
}

function _slabRowFocusOrder(rowId) {
    return ['#frmTxtItem_' + rowId];
}

function _slabRowIdFromEl(el) {
    return String($(el).closest('tr').attr('id') || '').replace('todSlabRow_', '');
}

function _todFocus(sel) {
    var $el = $(sel);
    if (!$el.length) return;
    $el.trigger('focus');
    if ($el.is('input[type="text"], input[type="number"]') && $el[0].select) {
        try { $el[0].select(); } catch (ex) { /* ignore */ }
    }
}

function _nextSlabRowId(rowId) {
    var found = false;
    var next = '';
    $('#tblTODSlabsBody tr').each(function () {
        var id = String($(this).attr('id') || '').replace('todSlabRow_', '');
        if (found && !next) next = id;
        if (String(id) === String(rowId)) found = true;
    });
    return next;
}

function _focusSaveButton() {
    var $btn = $('.btn-tod-save').first();
    if (!$btn.attr('tabindex')) $btn.attr('tabindex', '0');
    $btn.trigger('focus');
}

function _shouldOpenObjList(typedVal, selectedCode, selectedName) {
    var raw = String(typedVal || '').trim();
    if (!raw) return false;
    if (raw === '.' || raw === '..' || raw.indexOf('*') === 0) return true;
    if (String(selectedCode || '').trim() === '') return true;
    return raw !== String(selectedName || '').trim();
}

function _slabEnterNext(rowId, el) {
    var order = _slabRowFocusOrder(rowId);
    var idx = -1;
    var currentId = el && el.id ? '#' + el.id : '';
    if (currentId) idx = order.indexOf(currentId);

    if (idx >= 0 && idx < order.length - 1) {
        _todFocus(order[idx + 1]);
        return;
    }
    if (_isLastSlabRow(rowId)) {
        _appendSlabRow({});
        _todFocus('#frmTxtItem_' + G_SlabRowCount);
    } else {
        var nextId = _nextSlabRowId(rowId);
        if (nextId) _todFocus('#frmTxtItem_' + nextId);
    }
}

function _onSlabGridKey(e, rowId, field) {
    if (e.key === 'Tab' || e.keyCode === 9) {
        e.preventDefault();
        e.stopPropagation();
        _focusSaveButton();
        return;
    }
    if (e.key !== 'Enter' && e.keyCode !== 13) return;
    e.preventDefault();
    e.stopPropagation();

    rowId = rowId || _slabRowIdFromEl(e.target);

    if (field === 'item') {
        var typed    = $(e.target).val();
        var itemCode = $('#frmHfItem_' + rowId).val();
        if (!String(typed || '').trim() && (itemCode === '' || itemCode == null)) {
            ShowTODItemObjectList(rowId, '..');
            return;
        }
        var selected = itemCode === '' || itemCode == null ? null : _findItem(itemCode);
        var itemName = selected ? _itemDisplayName(selected) : '';
        if (_shouldOpenObjList(typed, itemCode, itemName)) {
            ShowTODItemObjectList(rowId, typed);
            return;
        }
    }
    _slabEnterNext(rowId, e.target);
}

function _bindSlabGridKeys() {
    $('#tblTODSlabsBody').off('keydown.todNav').on('keydown.todNav', 'input', function (e) {
        var field = (this.id || '').indexOf('frmTxtItem_') === 0 ? 'item' : '';
        _onSlabGridKey(e, _slabRowIdFromEl(this), field);
    });
}

/* ══════════════════════════════════════════════════
   RATE GRID (TODConfigurationRateDetail)
══════════════════════════════════════════════════ */

window.AddTODRateRow = function (preset, silent) {
    if (_isTODMobile() && !preset && !silent) {
        OpenTODMobileRateModal(null);
        return;
    }
    _appendRateRow(preset || _continuationRatePreset(), true);
};

function _nextSaleFrom(toQty) {
    var to = _num(toQty);
    return to > 0 ? Math.round((to + TOD_QTY_STEP) * 100) / 100 : 0;
}

function _continuationRatePreset() {
    var $last = $('#tblTODRatesBody tr').last();
    if (!$last.length) return { SaleForm: 0, SaleTo: 0, Discount: 0 };

    var lastId = String($last.attr('id') || '').replace('todRateRow_', '');
    return {
        SaleForm: _nextSaleFrom($('#frmTxtRateTo_' + lastId).val()),
        SaleTo: 0,
        Discount: 0
    };
}

function _syncRateFromQty() {
    var prevTo = null;
    $('#tblTODRatesBody tr').each(function (index) {
        var rowId = String($(this).attr('id') || '').replace('todRateRow_', '');
        var $from = $('#frmTxtRateFrom_' + rowId);
        if (index === 0) {
            $from.prop('readonly', false);
        } else {
            $from.prop('readonly', true);
            if (prevTo != null) $from.val(_nextSaleFrom(prevTo));
        }
        prevTo = _num($('#frmTxtRateTo_' + rowId).val());
    });
}

function _appendRateRow(preset, focusToQty) {
    G_RateRowCount++;
    var rowId = G_RateRowCount;
    preset = preset || {};
    var fromQty = _num(preset.SaleForm);
    var toQty   = _num(preset.SaleTo);
    var rate    = _num(preset.Discount);

    var row = `<tr id="todRateRow_${rowId}">
        <td class="col-sno text-center fw-bold">${rowId}</td>
        <td class="col-from"><input type="number" id="frmTxtRateFrom_${rowId}" class="form-control form-control-sm" value="${fromQty}" min="0" step="0.01" inputmode="decimal" /></td>
        <td class="col-to"><input type="number" id="frmTxtRateTo_${rowId}" class="form-control form-control-sm" value="${toQty}" min="0" step="0.01" inputmode="decimal" /></td>
        <td class="col-rate"><input type="number" id="frmTxtRateVal_${rowId}" class="form-control form-control-sm" value="${rate}" min="0" step="0.01" inputmode="decimal" /></td>
        <td class="col-action text-center">
            <button type="button" class="del-row-btn" title="Remove" onclick="DeleteTODRateRow(${rowId})"><i class="fa fa-times-circle"></i></button>
        </td>
    </tr>`;

    $('#tblTODRatesBody').append(row);
    _renumberRateRows();
    _syncRateFromQty();
    if (focusToQty) _todFocus('#frmTxtRateTo_' + rowId);
}

window.DeleteTODRateRow = function (rowId) {
    if ($('#tblTODRatesBody tr').length <= 1 && !_isTODMobile()) {
        toastr.warning('At least one TOD rate row is required.');
        return;
    }
    $('#todRateRow_' + rowId).remove();
    _renumberRateRows();
    _syncRateFromQty();
    if (_isTODMobile()) RenderTODMobileRateCards();
};

function _renumberRateRows() {
    $('#tblTODRatesBody tr').each(function (index) {
        $(this).find('td:first').text(index + 1);
    });
}

function _rateRowIdFromEl(el) {
    return String($(el).closest('tr').attr('id') || '').replace('todRateRow_', '');
}

function _isLastRateRow(rowId) {
    var maxId = 0;
    $('#tblTODRatesBody tr').each(function () {
        var id = parseInt(String($(this).attr('id') || '').replace('todRateRow_', ''), 10) || 0;
        if (id > maxId) maxId = id;
    });
    return parseInt(rowId, 10) === maxId;
}

function _nextRateRowId(rowId) {
    var found = false;
    var next = '';
    $('#tblTODRatesBody tr').each(function () {
        var id = String($(this).attr('id') || '').replace('todRateRow_', '');
        if (found && !next) next = id;
        if (String(id) === String(rowId)) found = true;
    });
    return next;
}

function _rateRowFocusOrder(rowId) {
    return [
        '#frmTxtRateTo_' + rowId,
        '#frmTxtRateVal_' + rowId
    ];
}

function _bindRateGridKeys() {
    var $body = $('#tblTODRatesBody');
    $body.off('keydown.todRateNav').on('keydown.todRateNav', 'input', function (e) {
        if (e.key === 'Tab' || e.keyCode === 9) {
            e.preventDefault();
            e.stopPropagation();
            _focusSaveButton();
            return;
        }
        if (e.key !== 'Enter' && e.keyCode !== 13) return;
        e.preventDefault();
        e.stopPropagation();

        var rowId = _rateRowIdFromEl(this);
        if ((this.id || '').indexOf('frmTxtRateFrom_') === 0) {
            _todFocus('#frmTxtRateTo_' + rowId);
            return;
        }
        var order = _rateRowFocusOrder(rowId);
        var idx = order.indexOf('#' + this.id);
        if (idx >= 0 && idx < order.length - 1) {
            _todFocus(order[idx + 1]);
            return;
        }
        if (_isLastRateRow(rowId)) {
            _appendRateRow(_continuationRatePreset(), true);
        } else {
            var nextId = _nextRateRowId(rowId);
            if (nextId) _todFocus('#frmTxtRateTo_' + nextId);
        }
    });
    $body.off('input.todRateFrom').on('input.todRateFrom', 'input[id^="frmTxtRateTo_"]', function () {
        _syncRateFromQty();
    });
}

/* ══════════════════════════════════════════════════
   SLAB CARDS + MODAL (mobile)
══════════════════════════════════════════════════ */

function _fillMobileItemDropdown() {
    var $item = $('#todMobileDdlItem');
    $item.empty().append($('<option>').val('').text('-- Select --'));
    $item.append($('<option>').val('0').text(TOD_ALL_ITEM_NAME));
    (G_ItemList || []).forEach(function (it) {
        $item.append($('<option>').val(it.Code ?? it.code).text(_itemDisplayName(it)));
    });
}

window.OpenTODMobileSlabModal = function (rowId) {
    G_MobileEditRowId = rowId;
    _fillMobileItemDropdown();

    if (rowId == null) {
        $('#todMobileSlabModalTitle').text('Add Item');
        $('#todMobileSlabModalBtnTxt').text('Add Item');
        $('#todMobileDdlItem').val('');
        $('#todMobileTxtSpec').val('');
        $('#todMobileTxtUom').val('');
    } else {
        $('#todMobileSlabModalTitle').text('Edit Item');
        $('#todMobileSlabModalBtnTxt').text('Update Item');
        var editCode = _itemCodeFromRow(rowId);
        $('#todMobileDdlItem').val(editCode === null ? '' : String(editCode));
        $('#todMobileTxtSpec').val($('#frmTxtSpec_' + rowId).val());
        $('#todMobileTxtUom').val($('#frmTxtUom_' + rowId).val());
    }
    var opened = $('#todMobileDdlItem').val();
    G_MobileItemCode = opened === '' ? null : (parseInt(opened, 10) || 0);

    $('#todModalMobileSlabEntry').off('shown.bs.modal.todSel2').on('shown.bs.modal.todSel2', function () {
        _initSelect2($('#todMobileDdlItem'), $('#todModalMobileSlabEntry'));
        $('#todMobileDdlItem').off('change.todMobItem').on('change.todMobItem', OnTODMobileItemChange);
    });
    $('#todModalMobileSlabEntry').modal('show');
};

window.OnTODMobileItemChange = function () {
    var raw = $('#todMobileDdlItem').val();
    if (raw === '' || raw == null) {
        $('#todMobileTxtUom').val('');
        $('#todMobileTxtSpec').val('');
        G_MobileItemCode = null;
        return;
    }
    var code = parseInt(raw, 10) || 0;
    var item = _findItem(code);
    $('#todMobileTxtUom').val(item ? (item.UOM || '') : '');
    $('#todMobileTxtSpec').val(item ? (item.ItemSpecification || '') : '');
    G_MobileItemCode = code;
};

window.TODMobileSlabModalConfirm = function () {
    var raw = $('#todMobileDdlItem').val();
    if (raw === '' || raw == null) {
        toastr.warning('Please select an item.');
        return;
    }
    var itemCode = parseInt(raw, 10) || 0;
    if (!_canUseItem(G_MobileEditRowId, itemCode)) return;

    var preset = {
        ItemMaster_Code: itemCode,
        ItemName: _itemDisplayName(_findItem(itemCode)) || (itemCode === 0 ? TOD_ALL_ITEM_NAME : ''),
        ItemSpecification: $('#todMobileTxtSpec').val() || '',
        UOM: $('#todMobileTxtUom').val() || ''
    };

    if (G_MobileEditRowId == null) {
        _appendSlabRow(preset);
    } else {
        _applyMobileSlabToRow(G_MobileEditRowId, preset);
    }

    RenderTODMobileSlabCards();
    $('#todModalMobileSlabEntry').modal('hide');
};

function _applyMobileSlabToRow(rowId, preset) {
    $('#frmHfItem_' + rowId).val(preset.ItemMaster_Code);
    $('#frmTxtItem_' + rowId).val(preset.ItemName);
    $('#frmTxtSpec_' + rowId).val(preset.ItemSpecification);
    $('#frmTxtUom_' + rowId).val(preset.UOM);
}

function RenderTODMobileSlabCards() {
    var container = $('#todMobileSlabCards');
    if (!container.length) return;
    container.empty();

    var rows = $('#tblTODSlabsBody tr');
    if (rows.length === 0) {
        container.html('<div class="mobile-slab-empty"><i class="fa fa-box fa-2x d-block mb-2"></i>No item added yet.<br>Tap "+ Add Item" to start.</div>');
        return;
    }

    rows.each(function (index) {
        var rowId = String($(this).attr('id') || '').replace('todSlabRow_', '');
        var itemName = $('#frmTxtItem_' + rowId).val() || TOD_ALL_ITEM_NAME;

        container.append(
            '<div class="mobile-slab-card">' +
            '<div class="slab-card-header">' +
            '<span class="slab-card-num">' + (index + 1) + '</span>' +
            '<span class="slab-card-name">' + _esc(itemName) + '</span>' +
            '<div class="slab-card-actions">' +
            '<button type="button" class="slab-card-edit-btn" onclick="OpenTODMobileSlabModal(' + rowId + ')" title="Edit"><i class="fa fa-pencil-alt"></i></button>' +
            '<button type="button" class="slab-card-del-btn" onclick="DeleteTODSlabRow(' + rowId + ')" title="Delete"><i class="fa fa-trash"></i></button>' +
            '</div></div></div>'
        );
    });
}
window.RenderTODMobileSlabCards = RenderTODMobileSlabCards;

window.OpenTODMobileRateModal = function (rowId) {
    G_MobileRateEditRowId = rowId;
    if (rowId == null) {
        var carry = _continuationRatePreset();
        $('#todMobileRateModalTitle').text('Add Rate');
        $('#todMobileRateModalBtnTxt').text('Add Rate');
        $('#todMobileTxtFromQty').val(carry.SaleForm || 0);
        $('#todMobileTxtToQty').val(0);
        $('#todMobileTxtRate').val(0);
        $('#todMobileTxtFromQty').prop('readonly', $('#tblTODRatesBody tr').length > 0);
    } else {
        $('#todMobileRateModalTitle').text('Edit Rate');
        $('#todMobileRateModalBtnTxt').text('Update Rate');
        $('#todMobileTxtFromQty').val($('#frmTxtRateFrom_' + rowId).val() || 0);
        $('#todMobileTxtToQty').val($('#frmTxtRateTo_' + rowId).val() || 0);
        $('#todMobileTxtRate').val($('#frmTxtRateVal_' + rowId).val() || 0);
        var isFirst = $('#tblTODRatesBody tr:first').attr('id') === ('todRateRow_' + rowId);
        $('#todMobileTxtFromQty').prop('readonly', !isFirst);
    }
    TODMobileRatePreview();
    setTimeout(function () { $('#todMobileTxtToQty').trigger('focus'); }, 200);
    $('#todModalMobileRateEntry').modal('show');
};

window.TODMobileRatePreview = function () {
    var from = _num($('#todMobileTxtFromQty').val());
    var to   = _num($('#todMobileTxtToQty').val());
    $('#todMobileRatePreview').text(from + ' – ' + (to > 0 ? to : '∞'));
};

window.TODMobileRateModalConfirm = function () {
    var from = _num($('#todMobileTxtFromQty').val());
    var to   = _num($('#todMobileTxtToQty').val());
    if (to > 0 && to < from) {
        toastr.warning('To Qty cannot be less than From Qty.');
        return;
    }

    var preset = {
        SaleForm: from,
        SaleTo: to,
        Discount: _num($('#todMobileTxtRate').val())
    };

    if (G_MobileRateEditRowId == null) {
        _appendRateRow(preset);
    } else {
        $('#frmTxtRateFrom_' + G_MobileRateEditRowId).val(preset.SaleForm);
        $('#frmTxtRateTo_' + G_MobileRateEditRowId).val(preset.SaleTo);
        $('#frmTxtRateVal_' + G_MobileRateEditRowId).val(preset.Discount);
    }

    RenderTODMobileRateCards();
    $('#todModalMobileRateEntry').modal('hide');
};

function RenderTODMobileRateCards() {
    var container = $('#todMobileRateCards');
    if (!container.length) return;
    container.empty();

    var rows = $('#tblTODRatesBody tr');
    if (rows.length === 0) {
        container.html('<div class="mobile-slab-empty"><i class="fa fa-percent fa-2x d-block mb-2"></i>No rate added yet.<br>Tap "+ Add Rate" to start.</div>');
        return;
    }

    rows.each(function (index) {
        var rowId = String($(this).attr('id') || '').replace('todRateRow_', '');
        var from = _num($('#frmTxtRateFrom_' + rowId).val());
        var to   = _num($('#frmTxtRateTo_' + rowId).val());
        var rate = _num($('#frmTxtRateVal_' + rowId).val()).toFixed(2);

        container.append(
            '<div class="mobile-slab-card">' +
            '<div class="slab-card-header">' +
            '<span class="slab-card-num">' + (index + 1) + '</span>' +
            '<span class="slab-card-name">TOD Rate ' + rate + '</span>' +
            '<div class="slab-card-actions">' +
            '<button type="button" class="slab-card-edit-btn" onclick="OpenTODMobileRateModal(' + rowId + ')" title="Edit"><i class="fa fa-pencil-alt"></i></button>' +
            '<button type="button" class="slab-card-del-btn" onclick="DeleteTODRateRow(' + rowId + ')" title="Delete"><i class="fa fa-trash"></i></button>' +
            '</div></div>' +
            '<div class="slab-card-details">' +
            '<span class="slab-card-detail"><i class="fa fa-arrows-left-right me-1"></i>' + from + ' – ' + (to > 0 ? to : '∞') + '</span>' +
            '<span class="slab-card-detail slab-card-rate"><i class="fa fa-percent me-1"></i>TOD: ' + rate + '</span>' +
            '</div></div>'
        );
    });
}
window.RenderTODMobileRateCards = RenderTODMobileRateCards;

/* ══════════════════════════════════════════════════
   PERIODICITY
══════════════════════════════════════════════════ */

function _monthWindow(year, monthIndex, monthSpan) {
    var start = new Date(year, monthIndex, 1);
    var end   = new Date(year, monthIndex + monthSpan, 0);
    return { start: start, end: end };
}

window.OnTODPeriodicityChange = function () {
    var periodicity = String($('#frmDdlPeriodicity').val() || '');
    var today = new Date();
    var win = null;

    if (periodicity === 'Month') {
        win = _monthWindow(today.getFullYear(), today.getMonth(), 1);
    } else if (periodicity === 'Quarter') {
        win = _monthWindow(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 3);
    } else if (periodicity === 'Half Yearly') {
        win = _monthWindow(today.getFullYear(), today.getMonth() < 6 ? 0 : 6, 6);
    } else if (periodicity === 'Yearly') {
        /* Financial year: April to March. */
        var fyStart = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
        win = _monthWindow(fyStart, 3, 12);
    }

    if (win) {
        $('#frmTxtStartDate').val(_isoDate(win.start));
        $('#frmTxtEndDate').val(_isoDate(win.end));
    }
};

/* Month / Period dropdown is commented in TODConfiguration.cshtml.
window.OnTODMonthChange = function () {
    var label = String($('#frmDdlMonth').val() || '');
    if (!label) return;

    var months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
    var spans = {
        'Q1 (Apr-Jun)': [3, 3], 'Q2 (Jul-Sep)': [6, 3], 'Q3 (Oct-Dec)': [9, 3], 'Q4 (Jan-Mar)': [0, 3],
        'H1 (Apr-Sep)': [3, 6], 'H2 (Oct-Mar)': [9, 6]
    };

    var today = new Date();
    var win = null;
    var monthIndex = months.indexOf(label);

    if (monthIndex >= 0) {
        win = _monthWindow(today.getFullYear(), monthIndex, 1);
    } else if (spans[label]) {
        win = _monthWindow(today.getFullYear(), spans[label][0], spans[label][1]);
    }

    if (win) {
        $('#frmTxtStartDate').val(_isoDate(win.start));
        $('#frmTxtEndDate').val(_isoDate(win.end));
    }
};
*/

/* ══════════════════════════════════════════════════
   FORM OPEN / CLOSE / LOAD
══════════════════════════════════════════════════ */

function _resetForm() {
    $('#frmHfCode').val('0');
    $('#frmTxtName').val('');
    $('#frmDdlPeriodicity').val('');
    $('#frmDdlConsiderASPer').val('');
    $('#frmDdlTurnoverASPer').val('');
    $('#frmDdlTurnoverDiscountASPer').val('');
    /* $('#frmDdlMonth').val(''); */
    $('#frmDdlMarketingMan').val('0');
    $('#frmDdlZone').val('');
    $('#frmDdlState').val('');
    $('#frmDdlCity').val('');
    G_PartyRows = [];
    G_ScopePartyCodes = null;
    _renderPartyRows();
    _refreshScopeDropdowns();
    $('#frmTxtPartyLookup').val('');
    $('#frmTxtStartDate').val('');
    $('#frmTxtEndDate').val('');
    $('#frmTxtFinYear').val(BizSolHelperFunction.getFinancialYear());
    $('#tblTODSlabsBody').html('');
    $('#tblTODRatesBody').html('');
    G_SlabRowCount = 0;
    G_RateRowCount = 0;

    if ($.fn.select2) {
        $('#frmDdlPeriodicity').val(null).trigger('change');
        $('#frmDdlConsiderASPer').val(null).trigger('change');
        $('#frmDdlTurnoverASPer').val(null).trigger('change');
        $('#frmDdlTurnoverDiscountASPer').val(null).trigger('change');
        /* $('#frmDdlMonth').val(null).trigger('change'); */
        $('#frmDdlMarketingMan').val('0').trigger('change.select2');
    }
}

function _showForm(mode) {
    _resetForm();
    $('#divTODList').hide();
    $('#divTODForm').show();
    $('#todFloatBar').css('display', 'flex');

    if (mode === 'Edit') {
        $('#floatTODModeBadge').text('EDIT').removeClass('bg-success').addClass('bg-warning text-dark');
        $('#floatTODName').text('Loading…');
    } else {
        $('#floatTODModeBadge').text('NEW').removeClass('bg-warning text-dark').addClass('bg-success');
        $('#floatTODName').text('New TOD Configuration');
    }
}

window.OpenTODForm = function (mode, code) {
    var ModuleName = $('#ERPHeading').text().trim();
    var OptionName = mode === 'Edit' ? 'Edit' : 'New';
    var FinYear = BizSolHelperFunction.getFinancialYear();

    var open = function () {
        _ensureFormLookups().then(function () {
            _showForm(mode);
            if (mode === 'Edit') {
                _loadTODForEdit(code);
            } else {
                $('#frmTxtFinYear').val(FinYear);
                if (_isTODMobile()) {
                    RenderTODMobileSlabCards();
                    RenderTODMobileRateCards();
                } else {
                    _appendSlabRow({});
                    _appendRateRow({});
                }
            }
        });
    };

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, 'Y', FinYear).then(function (respCheck) {
        if (respCheck && respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg || 'You do not have rights for this action.');
            return;
        }
        open();
    }).catch(function () {
        /* Rights API missing – still open the form. */
        open();
    });
};

window.CloseTODForm = function () {
    $('#divTODForm').hide();
    $('#todFloatBar').hide();
    $('#divTODList').show();
};

function _unwrapShowData(res) {
    var header = null;
    var details = [];
    var parties = [];
    var rates = [];
    if (!res) return { header: header, details: details, parties: parties, rates: rates };

    var isItemRow = function (r) {
        if (!r) return false;
        return r.ItemMaster_Code != null || r.TODConfigurationTransaction_Code != null;
    };
    var isRateRow = function (r) {
        if (!r) return false;
        return r.SaleForm != null && r.ItemMaster_Code == null && r.TODConfigurationTransaction_Code == null;
    };

    if (Array.isArray(res) && res.length && Array.isArray(res[0])) {
        header  = res[0][0] || null;
        details = res[1] || [];
        parties = res[2] || [];
        rates   = res[3] || [];
    } else if (res.Table) {
        header  = (res.Table[0] || null);
        details = res.Table1 || [];
        parties = res.Table2 || [];
        rates   = res.Table3 || [];
    } else if (res.TODConfigurationMaster) {
        header  = (res.TODConfigurationMaster || [])[0] || null;
        details = res.TODConfigurationTransaction || [];
        parties = res.TODConfigurationAccountDetail || [];
        rates   = res.TODConfigurationRateDetail || [];
    } else {
        var rows = _toList(res);
        header = rows[0] || null;
        details = rows.filter(isItemRow);
        rates = rows.filter(isRateRow);
    }

    if ((!rates || !rates.length) && details.some(function (d) {
        return _num(d.SaleForm) || _num(d.SaleTo) || _num(d.Discount);
    })) {
        rates = details.map(function (d) {
            return { SaleForm: d.SaleForm, SaleTo: d.SaleTo, Discount: d.Discount };
        });
    }
    return { header: header, details: details, parties: parties, rates: rates };
}

/**
 * Reloads every party that belongs to this one configuration.
 * Falls back to PartyMaster_Code when the party table has no rows.
 */
function _selectSavedParties(parties, fallbackCode, fallbackName) {
    G_PartyRows = [];
    var rows = (parties || []).filter(function (p) {
        return (parseInt(p.Code ?? p.PartyMaster_Code ?? 0, 10) || 0) > 0;
    });

    if (!rows.length && (parseInt(fallbackCode || 0, 10) || 0) > 0) {
        rows = [{ Code: fallbackCode, Desp: fallbackName || ('Party #' + fallbackCode) }];
    }

    rows.forEach(function (party) {
        var mapped = (G_PartyList || []).filter(function (p) {
            return String(p.Code ?? p.code) === String(party.Code ?? party.PartyMaster_Code);
        })[0];
        _addPartyRow(mapped || party);
    });

    if (G_PartyRows.length === 1) {
        var first = G_PartyRows[0];
        $('#frmDdlZone').val(first.Zone || '');
        $('#frmDdlState').val(first.State || '');
        $('#frmDdlCity').val(first.City || '');
        _refreshScopeDropdowns();
    }

    _renderPartyRows();
}

function _loadTODForEdit(code) {
    TODConfigurationMasterService.GetTODConfigurationById(code).then(function (res) {
        var unpacked = _unwrapShowData(res);
        var header = unpacked.header;
        var details = unpacked.details || [];
        var rates = unpacked.rates || [];

        if (!header) {
            toastr.error('TOD Configuration not found.');
            CloseTODForm();
            return;
        }

        $('#frmHfCode').val(header.Code || 0);
        $('#frmTxtName').val(header.TODConfigurationDesp || '');
        $('#frmDdlPeriodicity').val(header.Periodicity || '').trigger('change.select2');
        $('#frmDdlConsiderASPer').val(header.ConsiderASPer || '').trigger('change.select2');
        $('#frmDdlTurnoverASPer').val(header.TurnoverASPer || '').trigger('change.select2');
        $('#frmDdlTurnoverDiscountASPer').val(header.TurnoverDiscountASPer || '').trigger('change.select2');
        /* $('#frmDdlMonth').val(header.MonthDesp || '').trigger('change.select2'); */
        $('#frmTxtStartDate').val(header.StartDate ? String(header.StartDate).substring(0, 10) : '');
        $('#frmTxtEndDate').val(header.EndDate ? String(header.EndDate).substring(0, 10) : '');
        _selectSavedParties(unpacked.parties, header.PartyMaster_Code || 0, header.PartyName || '');
        $('#frmTxtFinYear').val(header.FinYear || BizSolHelperFunction.getFinancialYear());
        $('#floatTODName').text(header.TODConfigurationDesp || ('#' + code));

        $('#tblTODSlabsBody').html('');
        $('#tblTODRatesBody').html('');
        G_SlabRowCount = 0;
        G_RateRowCount = 0;
        if (!details.length) {
            if (!_isTODMobile()) _appendSlabRow({});
        } else {
            details.forEach(function (d) { _appendSlabRow(d); });
        }
        if (!rates.length) {
            if (!_isTODMobile()) _appendRateRow({});
        } else {
            rates.forEach(function (r) { _appendRateRow(r); });
        }
        _syncRateFromQty();
        if (_isTODMobile()) {
            RenderTODMobileSlabCards();
            RenderTODMobileRateCards();
        }
    }).catch(function (err) {
        toastr.error('Error loading TOD Configuration.');
        console.error(err);
        CloseTODForm();
    });
}

/* ══════════════════════════════════════════════════
   SAVE / DELETE
══════════════════════════════════════════════════ */

window.SaveTODConfiguration = function () {
    var name = String($('#frmTxtName').val() || '').trim();
    if (!name) {
        toastr.warning('Please enter the TOD Configuration Name.');
        $('#frmTxtName').trigger('focus');
        return;
    }
    var saveCode = parseInt($('#frmHfCode').val() || 0, 10) || 0;
    if (_todNameAlreadyExists(name, saveCode)) {
        toastr.warning('Please Check! TODConfigurationDesp ' + name + ' already exists.');
        $('#frmTxtName').trigger('focus');
        return;
    }
    var periodicity = String($('#frmDdlPeriodicity').val() || '').trim();
    if (!periodicity) {
        toastr.warning('Please select Periodicity.');
        return;
    }
    var considerAsPer = String($('#frmDdlConsiderASPer').val() || '').trim();
    if (!considerAsPer) {
        toastr.warning('Please select Consider AS Per.');
        return;
    }
    var turnoverAsPer = String($('#frmDdlTurnoverASPer').val() || '').trim();
    if (!turnoverAsPer) {
        toastr.warning('Please select Turnover AS Per.');
        return;
    }
    var turnoverDiscountAsPer = String($('#frmDdlTurnoverDiscountASPer').val() || '').trim();
    if (!turnoverDiscountAsPer) {
        toastr.warning('Please select Turnover Discount AS Per.');
        return;
    }
    var startDate = $('#frmTxtStartDate').val();
    var endDate   = $('#frmTxtEndDate').val();
    if (!startDate || !endDate) {
        toastr.warning('Please select Start Date and End Date.');
        return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        toastr.warning('End Date cannot be earlier than Start Date.');
        return;
    }

    var details = [];
    var rates = [];
    var valid = true;
    $('#tblTODSlabsBody tr').each(function () {
        var rowId = String($(this).attr('id') || '').replace('todSlabRow_', '');
        var itemCode = _itemCodeFromRow(rowId);
        if (itemCode === null) return;
        details.push({
            ItemMaster_Code: itemCode,
            RateOfInterest: 0
        });
    });
    $('#tblTODRatesBody tr').each(function () {
        var rowId = String($(this).attr('id') || '').replace('todRateRow_', '');
        var from  = _num($('#frmTxtRateFrom_' + rowId).val());
        var to    = _num($('#frmTxtRateTo_' + rowId).val());
        var rate  = _num($('#frmTxtRateVal_' + rowId).val());

        if (to > 0 && to < from) {
            toastr.warning('To Qty cannot be less than From Qty in rate row ' + (rates.length + 1) + '.');
            valid = false;
            return false;
        }
        if (from <= 0 && to <= 0 && rate <= 0) {
            toastr.warning('Please fill From Qty / To Qty / TOD Rate.');
            valid = false;
            return false;
        }
        rates.push({
            SaleForm: from,
            SaleTo: to,
            Discount: rate
        });
    });
    if (!valid) return;
    if (!details.length) {
        toastr.warning('Please add at least one item.');
        return;
    }
    if (!rates.length) {
        toastr.warning('Please add at least one TOD rate.');
        return;
    }
    if (details.some(function (d) { return d.ItemMaster_Code === 0; }) &&
        details.some(function (d) { return d.ItemMaster_Code > 0; })) {
        toastr.warning('Item "All" cannot be combined with specific items.');
        return;
    }

    var payloadXml =
        '<TOD>' +
        _xmlTag('Code', parseInt($('#frmHfCode').val() || 0, 10) || 0) +
        _xmlTag('TODConfigurationDesp', name) +
        _xmlTag('Periodicity', periodicity) +
        _xmlTag('ConsiderASPer', considerAsPer) +
        _xmlTag('TurnoverASPer', turnoverAsPer) +
        _xmlTag('TurnoverDiscountASPer', turnoverDiscountAsPer) +
        _xmlTag('StartDate', startDate) +
        _xmlTag('EndDate', endDate) +
        '<Parties>' + G_PartyRows.map(function (party) {
            return '<Party>' +
                _xmlTag('Code', parseInt(party.Code, 10) || 0) +
                _xmlTag('MarketingManMaster_Code', parseInt(party.MarketingManMaster_Code, 10) || 0) +
                '</Party>';
        }).join('') + '</Parties>' +
        _xmlTag('FinYear', $('#frmTxtFinYear').val() || '') +
        _xmlTag('IncreaseValue', 0) +
        _xmlTag('DecreaseValue', 0) +
        _xmlTag('CDPercentage', 0) +
        _xmlTag('CDDays', 0) +
        '<Details>' +
        details.map(function (d) {
            return '<Row>' +
                _xmlTag('ItemMaster_Code', d.ItemMaster_Code) +
                _xmlTag('RateOfInterest', d.RateOfInterest) +
                '</Row>';
        }).join('') +
        '</Details>' +
        '<Rates>' +
        rates.map(function (r) {
            return '<Row>' +
                _xmlTag('SaleForm', r.SaleForm) +
                _xmlTag('SaleTo', r.SaleTo) +
                _xmlTag('Discount', r.Discount) +
                '</Row>';
        }).join('') +
        '</Rates></TOD>';

    TODConfigurationMasterService.SaveTODConfigurationMaster(JSON.stringify(payloadXml)).then(function (res) {
        var row = Array.isArray(res) ? (res[0] || {}) : (res || {});
        var status = String((row.Status != null ? row.Status : row.status) || '').trim().toUpperCase();
        var msg = row.Msg || row.msg || '';
        if (status === 'Y') {
            toastr.success(msg || 'TOD Configuration saved successfully.');
            CloseTODForm();
            LoadTODList();
        } else {
            toastr.error(msg || 'Failed to save TOD Configuration.');
        }
    }).catch(function (err) {
        toastr.error('Error saving TOD Configuration.');
        console.error(err);
    });
};

window.DeleteTODRow = function (code) {
    var ModuleName = $('#ERPHeading').text().trim();
    var FinYear = BizSolHelperFunction.getFinancialYear();

    var remove = function () {
        if (!confirm('Delete this TOD Configuration?')) return;
        TODConfigurationMasterService.DeleteTODConfiguration(code).then(function (res) {
            var row = Array.isArray(res) ? (res[0] || {}) : (res || {});
            var status = String((row.Status != null ? row.Status : row.status) || '').trim().toUpperCase();
            if (status === 'Y') {
                toastr.success(row.Msg || row.msg || 'TOD Configuration deleted.');
                LoadTODList();
            } else {
                toastr.error(row.Msg || row.msg || 'Delete failed.');
            }
        }).catch(function (err) {
            toastr.error('Error deleting TOD Configuration.');
            console.error(err);
        });
    };

    MenuService.CheckModuleOptionRight(ModuleName, 'Delete', 'Y', FinYear).then(function (respCheck) {
        if (respCheck && respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg || 'You do not have delete rights.');
            return;
        }
        remove();
    }).catch(function () {
        remove();
    });
};
