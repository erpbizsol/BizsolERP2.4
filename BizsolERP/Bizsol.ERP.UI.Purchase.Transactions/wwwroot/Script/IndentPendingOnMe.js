import { IndentMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/IndentMasterService.js';
import { IndentMasterLevelsApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/IndentMasterLevelsApprovalService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

var G_PendingList = [];
var G_CurrentLines = [];
var G_CurrentLevels = [];
var G_CurrentLevelCode = 0;

function _toList(res) {
    if (!res) return [];
    if (Array.isArray(res)) {
        if (res.length && Array.isArray(res[0]) && typeof res[0][0] === 'object') return res[0];
        return res;
    }
    if (Array.isArray(res.Table)) return res.Table;
    if (Array.isArray(res.Data)) return res.Data;
    if (Array.isArray(res.Result)) return res.Result;
    return [];
}

function _esc(v) {
    return String(v == null ? '' : v)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

function _rowCode(row) {
    return parseInt(row && (row.Code ?? row.code ?? row.IndentMaster_Code) || 0, 10) || 0;
}

function _isoDate(d) {
    if (!d) return '';
    if (typeof d === 'string') {
        if (d.length >= 10 && d.charAt(4) === '-') return d.substring(0, 10);
        var parsed = new Date(d);
        if (!isNaN(parsed.getTime())) d = parsed;
        else return d.length >= 10 ? d.substring(0, 10) : d;
    }
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
}

function _dispDate(v) {
    var iso = _isoDate(v);
    if (!iso || iso.length < 10) return v || '—';
    return iso.substring(8, 10) + '-' + iso.substring(5, 7) + '-' + iso.substring(0, 4);
}

function _queryParam(name) {
    try {
        var vars = typeof getUrlVars === 'function' ? getUrlVars() : BizSolHelperFunction.getUrlVars();
        return decodeURIComponent(vars[name] || '');
    } catch (e) {
        return '';
    }
}

function _setDates() {
    var qFrom = _queryParam('FromDate');
    var qTo = _queryParam('ToDate');
    var today = new Date();
    var first = new Date(today.getFullYear(), today.getMonth(), 1);
    $('#ipmFromDate').val(qFrom || _isoDate(first));
    $('#ipmToDate').val(qTo || _isoDate(today));
}

function _unwrapShowData(res) {
    var header = null;
    var details = [];
    if (!res) return { header: header, details: details };
    var isDetail = function (r) {
        return r && ((parseInt(r.ItemMaster_Code || r.itemMaster_Code || 0, 10) || 0) > 0
            || (parseInt(r.IndentTransaction_Code || r.indentTransaction_Code || 0, 10) || 0) > 0);
    };
    if (Array.isArray(res) && res.length && Array.isArray(res[0])) {
        header = res[0][0] || null;
        details = (res[1] && res[1].length) ? res[1] : [];
    } else if (res.Table || res.Table1) {
        header = (res.Table && res.Table[0]) || null;
        details = res.Table1 || [];
    } else {
        var rows = _toList(res);
        header = rows.filter(function (r) { return !isDetail(r); })[0] || rows[0] || null;
        details = rows.filter(isDetail);
    }
    return { header: header, details: details };
}

function _apiOk(res) {
    var row = Array.isArray(res) ? (res[0] || {}) : (res || {});
    var status = String(row.Status || row.status || '').toUpperCase();
    return status === 'Y' || status === 'SUCCESS' || row.Success === true;
}

function _apiMsg(res, fallback) {
    var row = Array.isArray(res) ? (res[0] || {}) : (res || {});
    return row.Msg || row.msg || row.Message || fallback;
}

window.NavigateToIndentMaster = function () {
    var appBase = (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/')).replace(/\/?$/, '/');
    window.location.href = appBase + 'PurchaseTransactions/IndentMaster/IndentMaster?menu=' +
        encodeURIComponent('Indent/Material Requirement (Store)');
};

window.LoadIndentPendingList = function () {
    var fromDate = $('#ipmFromDate').val();
    var toDate = $('#ipmToDate').val();
    if (!fromDate || !toDate) {
        toastr.warning('Please select From Date and To Date.');
        return;
    }
    $('#ipmLoading').show();
    $('#ipmEmpty').hide();
    $('#ipmList').html('');

    IndentMasterLevelsApprovalService.GetPendingIndentList(fromDate, toDate, 'N')
        .then(function (data) {
            G_PendingList = _toList(data).map(_normalizePendingRow);
            _renderCards(G_PendingList);
        })
        .catch(function () {
            G_PendingList = [];
            _renderCards([]);
            toastr.error('Error loading pending indents.');
        })
        .then(function () {
            $('#ipmLoading').hide();
        });
};

function _normalizePendingRow(row) {
    if (!row) return row;
    if (typeof row.LevelDetails === 'string') {
        try { row.LevelDetails = JSON.parse(row.LevelDetails); } catch (e) { row.LevelDetails = []; }
    }
    if (!Array.isArray(row.LevelDetails)) row.LevelDetails = [];
    return row;
}

function _renderCards(list) {
    var q = String($('#ipmSearch').val() || '').toLowerCase().trim();
    var rows = (list || []).filter(function (row) {
        if (!q) return true;
        var blob = [
            row.IndentNo, row.IndentNoWithPrefix, row.WarehouseName, row.Status,
            row.Category, row.Remarks, row.CurrentLevelDesc, row.ApprovalStatus
        ].join(' ').toLowerCase();
        return blob.indexOf(q) >= 0;
    });
    $('#ipmStatPending').text(list && list.length ? String(list.length) : '—');
    if (!rows.length) {
        $('#ipmList').html('');
        $('#ipmEmpty').show();
        return;
    }
    $('#ipmEmpty').hide();
    var html = rows.map(function (row) {
        var code = _rowCode(row);
        var no = row.IndentNoWithPrefix || row.IndentNo || code;
        var date = _dispDate(row.IndentDate || row.indentDate);
        var wh = row.WarehouseName || row.warehouseName || row.GodownName || '';
        var cat = row.Category || row.category || '';
        var status = row.ApprovalStatus || row.Status || row.status || 'Pending';
        var lvl = row.CurrentLevelDesc || row.currentLevelDesc || '';
        var lvlNo = row.CurrentLevelNo || row.currentLevelNo || '';
        var total = row.TotalLevels || row.totalLevels || '';
        var levelChip = lvl
            ? '<span class="ipm-level-chip"><i class="fa fa-layer-group me-1"></i>Level ' +
              _esc(lvlNo) + (total ? '/' + _esc(total) : '') + ' — ' + _esc(lvl) + '</span>'
            : '';
        return '<div class="ipm-card">' +
            '<div class="ipm-card-header">' +
            '<div class="ipm-no-badge"><div class="no">#' + _esc(no) + '</div><div class="dt">' + _esc(date) + '</div></div>' +
            '<div class="ipm-card-main">' +
            '<div class="ipm-card-title">Indent #' + _esc(no) + '</div>' +
            '<div class="ipm-card-meta">' +
            (wh ? '<i class="fa fa-warehouse me-1"></i>' + _esc(wh) + ' &nbsp; ' : '') +
            (cat ? '<i class="fa fa-tags me-1"></i>' + _esc(cat) + ' &nbsp; ' : '') +
            '<i class="fa fa-info-circle me-1"></i>' + _esc(status) +
            '</div>' + levelChip +
            '</div></div>' +
            '<div class="ipm-card-footer">' +
            '<button type="button" class="btn-ipm-view" onclick="OpenIndentVerify(' + code + ')"><i class="fa fa-eye"></i>View</button>' +
            '<button type="button" class="btn-ipm-verify" onclick="OpenIndentVerify(' + code + ')"><i class="fa fa-check-circle"></i>Approve</button>' +
            '</div></div>';
    }).join('');
    $('#ipmList').html(html);
}

function _renderStepper(levels, currentLevelCode) {
    if (!levels || !levels.length) {
        $('#ipmLevelStepper').html('');
        return;
    }
    var html = '<div class="ipm-stepper">';
    levels.forEach(function (lvl, i) {
        var st = String(lvl.LevelStatus || lvl.levelStatus || '').toLowerCase();
        var code = parseInt(lvl.LevelCode || lvl.levelCode || 0, 10) || 0;
        var cls = 'ipm-step-pending';
        if (st === 'approved') cls = 'ipm-step-done';
        else if (st === 'rejected') cls = 'ipm-step-rejected';
        else if (code === currentLevelCode || (currentLevelCode === 0 && st === 'pending' && !levels.slice(0, i).some(function (x) {
            return String(x.LevelStatus || '').toLowerCase() === 'pending';
        }))) cls = 'ipm-step-active';

        html += '<div class="ipm-step-item">' +
            '<div class="ipm-step-circle ' + cls + '">' + _esc(lvl.LevelNo || lvl.Level || (i + 1)) + '</div>' +
            '<div class="ipm-step-lbl">' + _esc(lvl.LevelDesc || lvl.LevelDesp || '') + '</div>' +
            '</div>';
        if (i < levels.length - 1) {
            html += '<div class="ipm-step-connector ' + (st === 'approved' ? 'ipm-step-line-done' : 'ipm-step-line-pending') + '"></div>';
        }
    });
    html += '</div>';
    $('#ipmLevelStepper').html(html);
}

window.OpenIndentVerify = function (code) {
    if (!code) return;
    G_CurrentLevelCode = 0;
    G_CurrentLevels = [];
    Promise.all([
        IndentMasterService.GetIndentById(code),
        IndentMasterLevelsApprovalService.GetIndentLevelDetail(code).catch(function () { return []; })
    ]).then(function (packAll) {
        var pack = _unwrapShowData(packAll[0]);
        if (!pack.header) {
            toastr.error('Indent not found.');
            return;
        }
        var h = pack.header;
        G_CurrentLines = pack.details || [];
        G_CurrentLevels = _toList(packAll[1]);
        var current = G_CurrentLevels.find(function (l) {
            return String(l.LevelStatus || l.levelStatus || '').toLowerCase() === 'pending'
                && String(l.IsLevelApplicable || 'Y').toUpperCase() !== 'N';
        }) || G_CurrentLevels.find(function (l) {
            return String(l.LevelStatus || '').toLowerCase() === 'pending';
        });
        G_CurrentLevelCode = parseInt((current && (current.LevelCode || current.levelCode)) || 0, 10) || 0;
        $('#ipmHfCode').val(code);
        $('#ipmHfLevelCode').val(G_CurrentLevelCode);
        $('#ipmTxtRemarks').val('');
        $('#ipmModalTitle').text('Approve Indent #' + (h.IndentNoWithPrefix || h.IndentNo || code));
        $('#ipmModalHeader').html(
            '<div class="ipm-info-grid">' +
            _info('Indent No', h.IndentNoWithPrefix || h.IndentNo, 'fa-hashtag') +
            _info('Date', _dispDate(h.IndentDate), 'fa-calendar') +
            _info('Warehouse', h.WarehouseName || h.GodownName || '—', 'fa-warehouse') +
            _info('Status', h.Status || 'Pending', 'fa-info-circle') +
            _info('Category', h.Category || '—', 'fa-tags') +
            _info('Current Level', (current && (current.LevelDesc || current.LevelDesp)) || '—', 'fa-layer-group') +
            _info('Remarks', h.Remarks || '—', 'fa-comment') +
            _info('Requested', h.RequestedNameMannual || '—', 'fa-user') +
            '</div>'
        );
        _renderStepper(G_CurrentLevels, G_CurrentLevelCode);
        _renderModalItems(G_CurrentLines);
        var canAct = G_CurrentLevelCode > 0;
        $('#ipmBtnApprove, #ipmBtnReject, #ipmRemarksWrap').toggle(canAct);
        $('#modalIndentVerify').modal({ backdrop: 'static' });
        $('#modalIndentVerify').modal('show');
    }).catch(function () {
        toastr.error('Error loading indent.');
    });
};

function _info(lbl, val, icon) {
    return '<div class="ipm-info-item"><span class="ipm-info-lbl"><i class="fa ' + icon + ' me-1"></i>' +
        _esc(lbl) + '</span><span class="ipm-info-val">' + _esc(val) + '</span></div>';
}

function _renderModalItems(lines) {
    if (!lines.length) {
        $('#ipmItemsBody').html('<tr><td colspan="6" class="text-center text-muted py-3">No item lines.</td></tr>');
        return;
    }
    $('#ipmItemsBody').html(lines.map(function (d, i) {
        var name = d.ItemName || d.itemName || d.Desp || '—';
        var spec = d.ItemSpecification || d.itemSpecification || '';
        var qty = d.QtyMTRS != null ? d.QtyMTRS : (d.QtyMT || 0);
        var uom = d.UOM || '';
        var rate = d.Rate != null ? d.Rate : 0;
        return '<tr>' +
            '<td>' + (i + 1) + '</td>' +
            '<td>' + _esc(name) + '</td>' +
            '<td>' + _esc(spec) + '</td>' +
            '<td class="text-end">' + _esc(qty) + '</td>' +
            '<td>' + _esc(uom) + '</td>' +
            '<td class="text-end">' + _esc(rate) + '</td>' +
            '</tr>';
    }).join(''));
}

function _runAction(action) {
    var code = parseInt($('#ipmHfCode').val() || 0, 10) || 0;
    var levelCode = parseInt($('#ipmHfLevelCode').val() || 0, 10) || 0;
    var remarks = String($('#ipmTxtRemarks').val() || '').trim();
    if (!code) {
        toastr.warning('Indent not selected.');
        return;
    }
    if (!levelCode) {
        toastr.warning('No pending approval level found for this indent.');
        return;
    }
    if (action === 'Reject' && !remarks) {
        toastr.warning('Remarks are required to reject.');
        $('#ipmTxtRemarks').focus();
        return;
    }

    var moduleName = 'Indent/Material Requirement (Store)';
    var finYear = BizSolHelperFunction.getFinancialYear();
    MenuService.CheckModuleOptionRight(moduleName, 'Verify', 'Y', finYear).then(function (resp) {
        if (resp && resp.CheckModuleOptionRight == 'N') {
            toastr.error(resp.Msg || 'You do not have approval rights.');
            return;
        }
        var verb = action === 'Approve' ? 'approve' : 'reject';
        if (!confirm('Are you sure you want to ' + verb + ' this indent?')) return;
        var call = action === 'Approve'
            ? IndentMasterLevelsApprovalService.ApproveIndent(code, levelCode, remarks)
            : IndentMasterLevelsApprovalService.RejectIndent(code, levelCode, remarks);
        call.then(function (res) {
            if (_apiOk(res) || !_apiMsg(res, '')) {
                toastr.success(_apiMsg(res, 'Indent ' + verb + 'd successfully.'));
                $('#modalIndentVerify').modal('hide');
                LoadIndentPendingList();
            } else {
                toastr.error(_apiMsg(res, 'Failed to ' + verb + ' indent.'));
            }
        }).catch(function () {
            toastr.error('Error during ' + verb + '.');
        });
    });
}

window.ApprovePendingIndent = function () { _runAction('Approve'); };
window.RejectPendingIndent = function () { _runAction('Reject'); };

$(document).ready(function () {
    var menu = _queryParam('ModuleDesp') || _queryParam('menu');
    $('#ERPHeading').text(menu || 'Indent Verification');
    _setDates();
    $('#ipmSearch').on('input', function () { _renderCards(G_PendingList); });
    LoadIndentPendingList();
});
