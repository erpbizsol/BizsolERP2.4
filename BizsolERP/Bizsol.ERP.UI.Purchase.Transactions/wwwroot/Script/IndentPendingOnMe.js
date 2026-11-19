import { IndentMasterLevelsApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/IndentMasterLevelsApprovalService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

var G_PendingList = [];
var G_CurrentLines = [];
var G_CurrentLevels = [];
var G_CurrentLevelCode = 0;
var G_CurrentRow = null;
var G_PrintMode = 'preview';
var G_IpmAutoSetFromDate = true;

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

function _financialYearStart() {
    var today = new Date();
    var startYear = today.getFullYear();
    if (today.getMonth() < 3) startYear -= 1;
    return new Date(startYear, 3, 1);
}

function _setDates() {
    var today = new Date();
    $('#ipmToDate').val(_isoDate(today));
    $('#ipmFromDate').val(_isoDate(_financialYearStart()));
    return Promise.resolve();
}

function _indentRowDate(row) {
    var raw = row && (row['Indent Date'] || row.IndentDate || row.indentDate);
    if (raw == null || raw === '') return null;
    var s = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        var iso = new Date(s.substring(0, 10) + 'T12:00:00');
        return isNaN(iso.getTime()) ? null : iso;
    }
    var dt = new Date(s);
    return isNaN(dt.getTime()) ? null : dt;
}

function _setFromDateFromList(list) {
    if (!list || !list.length) return;
    var minDate = null;
    list.forEach(function (row) {
        var dt = _indentRowDate(row);
        if (dt && (!minDate || dt < minDate)) minDate = dt;
    });
    if (minDate) $('#ipmFromDate').val(_isoDate(minDate));
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
    var fromDate = G_IpmAutoSetFromDate ? '1900-01-01' : $('#ipmFromDate').val();
    var toDate = $('#ipmToDate').val();
    if (!fromDate || !toDate) {
        toastr.warning('Please select From Date and To Date.');
        return;
    }
    $('#ipmLoading').show();
    $('#ipmEmpty').hide();
    $('#ipmList').html('');

    var status = $('#ipmDdlStatus').val() || 'N';
    IndentMasterLevelsApprovalService.GetPendingIndentList(fromDate, toDate, status)
        .then(function (data) {
            G_PendingList = _toList(data).map(_normalizePendingRow);
            if (G_IpmAutoSetFromDate) {
                if (G_PendingList.length) _setFromDateFromList(G_PendingList);
                G_IpmAutoSetFromDate = false;
            }
            _renderCards(G_PendingList);
        })
        .catch(function () {
            G_IpmAutoSetFromDate = false;
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

function _money(n) {
    var v = parseFloat(n);
    if (!isFinite(v)) v = 0;
    return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function _isDoneStatus(status) {
    var s = String(status || '').trim().toLowerCase();
    return s === 'completed' || s === 'verified' || s === 'approved' || s === 'c' || s === 'y';
}

function _statusStyle(status) {
    var s = String(status || 'Pending').trim().toLowerCase();
    if (s === 'completed' || s === 'c') return { color: '#059669', bg: '#d1fae5' };
    if (s === 'verified' || s === 'y' || s === 'approved') return { color: '#047857', bg: '#d1fae5' };
    if (s === 'rejected') return { color: '#dc2626', bg: '#fee2e2' };
    if (s === 'hold' || s === 'h') return { color: '#ea580c', bg: '#ffedd5' };
    if (s === 'unverified' || s === 'u') return { color: '#b45309', bg: '#fef3c7' };
    return { color: '#4f46e5', bg: '#e0e7ff' };
}

function _needsAction(status) {
    var s = String(status || 'Pending').trim().toLowerCase();
    if (_isDoneStatus(s) || s === 'rejected') return false;
    return s === 'pending' || s === 'unverified' || s === 'hold' || s === 'on hold'
        || s === 'p' || s === 'u' || s === 'n' || s === 'h';
}

function _resolveLevelCode(row, levels) {
    var direct = parseInt((row && (row.LevelCode || row.levelCode || row.ApprovalLevel_Code || row.approvalLevel_Code)) || 0, 10) || 0;
    if (direct > 0) return direct;
    var list = levels || (row && row.LevelDetails) || [];
    var i;
    for (i = 0; i < list.length; i++) {
        var lvl = list[i] || {};
        var st = String(lvl.LevelStatus || lvl.levelStatus || '').trim().toLowerCase();
        var code = parseInt(lvl.LevelCode || lvl.levelCode || 0, 10) || 0;
        if (code > 0 && st !== 'approved' && st !== 'rejected') return code;
    }
    return 0;
}

function _cardStepper(currentLevel, totalLevels, status) {
    var total = parseInt(totalLevels, 10) || 1;
    var cur = parseInt(currentLevel, 10) || 1;
    var st = String(status || '').toLowerCase();
    var html = '<div class="ipm-stepper">';
    for (var i = 1; i <= total; i++) {
        var cls = 'ipm-step-pending';
        var onHold = st === 'hold' || st === 'h';
        if (_isDoneStatus(st) || i < cur) cls = 'ipm-step-done';
        else if (i === cur && onHold) cls = 'ipm-step-hold';
        else if (i === cur) cls = st === 'rejected' ? 'ipm-step-rejected' : 'ipm-step-active';
        var icon = cls === 'ipm-step-done' ? '<i class="fa fa-check" style="font-size:0.6rem;"></i>'
            : cls === 'ipm-step-rejected' ? '<i class="fa fa-times" style="font-size:0.6rem;"></i>'
            : cls === 'ipm-step-hold' ? '<i class="fa fa-pause" style="font-size:0.6rem;"></i>'
            : String(i);
        html += '<div class="ipm-step-item"><div class="ipm-step-circle ' + cls + '">' + icon + '</div>' +
            '<div class="ipm-step-lbl">L' + i + '</div></div>';
        if (i < total) {
            html += '<div class="ipm-step-connector ' + ((i < cur || _isDoneStatus(st)) ? 'ipm-step-line-done' : 'ipm-step-line-pending') + '"></div>';
        }
    }
    html += '</div>';
    return html;
}

function _renderCards(list) {
    var q = String($('#ipmSearch').val() || '').toLowerCase().trim();
    var rows = (list || []).filter(function (row) {
        if (!q) return true;
        var blob = [
            row['Indent No'], row.IndentNo, row.IndentNoWithPrefix, row.WarehouseName,
            row.Category, row.Remarks, row.CurrentLevelDesc, row.ApprovalStatus
        ].join(' ').toLowerCase();
        return blob.indexOf(q) >= 0;
    });
    var pending = (list || []).filter(function (r) {
        return !_isDoneStatus(r.ApprovalStatus || 'Pending');
    }).length;
    var approved = (list || []).length - pending;
    $('#ipmStatPending').text((list && list.length) ? String(pending || list.length) : '—');
    $('#ipmStatApproved').text(approved > 0 ? String(approved) : '—');
    if (!rows.length) {
        $('#ipmList').html('');
        $('#ipmEmpty').show();
        return;
    }
    $('#ipmEmpty').hide();
    var html = rows.map(function (row) {
        var code = _rowCode(row);
        var no = row['Indent No'] || row.IndentNoWithPrefix || row.IndentNo || code;
        var date = _dispDate(row['Indent Date'] || row.IndentDate);
        var wh = row.WarehouseName || row.GodownName || '—';
        var cat = row.Category || '';
        var status = row.ApprovalStatus || 'Pending';
        var lvl = row.CurrentLevelDesc || ('Level ' + (row.CurrentLevelNo || 1));
        var amount = _money(row['Total Amount'] || row.TotalAmount || 0);
        var st = _statusStyle(status);
        var action = _needsAction(status)
            ? '<button type="button" class="btn-ipm-verify" onclick="OpenIndentVerify(' + code + ')"><i class="fa fa-check"></i>Review &amp; Approve</button>'
            : '<button type="button" class="btn-ipm-view" onclick="OpenIndentVerify(' + code + ')"><i class="fa fa-eye"></i>View Details</button>';
        return '<div class="ipm-card">' +
            '<div class="ipm-card-header">' +
            '<div class="ipm-no-badge"><div class="dt">INDENT#</div><div class="no">' + _esc(no) + '</div></div>' +
            '<div class="ipm-card-main">' +
            '<div class="ipm-card-title"><i class="fa fa-warehouse me-1" style="color:#667eea;"></i>' + _esc(wh) + '</div>' +
            '<div class="ipm-card-meta"><i class="fa fa-calendar-alt me-1"></i>' + _esc(date) +
            ' &nbsp; <span class="ipm-level-chip"><i class="fa fa-layer-group me-1"></i>' + _esc(lvl) + '</span></div>' +
            (cat ? '<div class="ipm-card-meta" style="margin-top:4px;"><i class="fa fa-tags me-1"></i>' + _esc(cat) + '</div>' : '') +
            '</div>' +
            '<div class="ipm-card-right"><div class="ipm-amount">' + _esc(amount) + '</div>' +
            '<span class="ipm-status-badge" style="color:' + st.color + ';background:' + st.bg + ';">' + _esc(status) + '</span></div>' +
            '</div>' +
            '<div class="ipm-levels"><div class="ipm-level-label"><i class="fa fa-code-branch me-1" style="color:#667eea;"></i>Approval Progress</div>' +
            _cardStepper(row.CurrentLevelNo, row.TotalLevels, status) +
            '</div>' +
            '<div class="ipm-card-footer">' + action + '</div></div>';
    }).join('');
    $('#ipmList').html(html);
}

function _levelState(lvl, index, levels, currentLevelCode) {
    var st = String(lvl.LevelStatus || lvl.levelStatus || '').toLowerCase();
    var hold = String(lvl.IsOnHold || lvl.isOnHold || '').toUpperCase() === 'Y';
    if (st === 'approved') return 'done';
    if (st === 'rejected') return 'rejected';
    if (hold) return 'hold';
    var code = parseInt(lvl.LevelCode || lvl.levelCode || 0, 10) || 0;
    if (code && code === currentLevelCode) return 'active';
    if (!st || st === 'pending') {
        var earlierPending = levels.slice(0, index).some(function (x) {
            var xs = String(x.LevelStatus || x.levelStatus || 'pending').toLowerCase();
            return xs !== 'approved' && xs !== 'rejected';
        });
        if (!earlierPending) return 'active';
    }
    return 'waiting';
}

function _renderStepper(levels, currentLevelCode) {
    if (!levels || !levels.length) {
        $('#ipmLevelStepper').html('');
        return;
    }
    var html = '<div class="ipm-stepper">';
    levels.forEach(function (lvl, i) {
        var state = _levelState(lvl, i, levels, currentLevelCode);
        var cls = state === 'done' ? 'ipm-step-done'
            : state === 'rejected' ? 'ipm-step-rejected'
            : state === 'hold' ? 'ipm-step-hold'
            : state === 'active' ? 'ipm-step-active'
            : 'ipm-step-pending';
        var icon = state === 'done' ? '<i class="fa fa-check" style="font-size:0.65rem;"></i>'
            : state === 'rejected' ? '<i class="fa fa-times" style="font-size:0.65rem;"></i>'
            : state === 'hold' ? '<i class="fa fa-pause" style="font-size:0.65rem;"></i>'
            : state === 'active' ? '<i class="fa fa-hourglass-half" style="font-size:0.65rem;"></i>'
            : String(lvl.LevelNo || (i + 1));
        var badge = state === 'done' ? 'Approved' : state === 'rejected' ? 'Rejected' : state === 'hold' ? 'On Hold' : state === 'active' ? 'Pending' : 'Waiting';
        var who = lvl.ApproverName || lvl.approverName || '';
        var when = lvl.ApprovedOn || lvl.approvedOn || '';
        html += '<div class="ipm-step-item" style="min-width:88px;">' +
            '<div class="ipm-step-circle ' + cls + '">' + icon + '</div>' +
            '<div class="ipm-step-lbl" style="font-weight:700;color:#1e293b;">' + _esc(lvl.LevelDesc || lvl.LevelDesp || ('L' + (i + 1))) + '</div>' +
            (who ? '<div class="ipm-step-lbl">' + _esc(who) + (when ? ' — ' + _esc(when) : '') + '</div>' : '') +
            '<div class="ipm-step-lbl" style="margin-top:2px;">' + badge + '</div></div>';
        if (i < levels.length - 1) {
            html += '<div class="ipm-step-connector ' + (state === 'done' ? 'ipm-step-line-done' : 'ipm-step-line-pending') + '"></div>';
        }
    });
    html += '</div>';
    $('#ipmLevelStepper').html(html);
}

window.OpenIndentVerify = function (code) {
    if (!code) return;
    var row = (G_PendingList || []).find(function (r) { return _rowCode(r) === code; });
    if (!row) return;
    var no = row['Indent No'] || row.IndentNoWithPrefix || row.IndentNo || code;
    var status = row.ApprovalStatus || row.approvalStatus || row.Status || 'Pending';
    G_CurrentLevels = Array.isArray(row.LevelDetails) ? row.LevelDetails : [];
    G_CurrentLevelCode = _resolveLevelCode(row, G_CurrentLevels);
    G_CurrentRow = row;
    G_CurrentLines = [];
    $('#ipmHfCode').val(code);
    $('#ipmHfLevelCode').val(G_CurrentLevelCode);
    $('#ipmHfIndentNo').val(no);
    $('#ipmHfIndentDate').val(row['Indent Date'] || row.IndentDate || '');
    $('#ipmTxtRemarks').val('');
    $('#ipmModalTitle').html('<i class="fa fa-file-invoice me-2"></i>Indent# ' + _esc(no));
    $('#ipmModalSub').text(row.WarehouseName || '');
    var hasAttach = String(row.HasAttach || row.hasAttach || '').toUpperCase() === 'Y';
    $('#ipmBtnAttachment').css('background', hasAttach ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#0ea5e9,#0284c7)');
    var alreadyHold = String(status).toLowerCase() === 'hold';
    $('#ipmBtnHold').prop('disabled', alreadyHold).attr('title', alreadyHold ? 'This indent is already on hold.' : 'Put on hold');
    $('#ipmModalHeader').html(
        '<div class="ipm-info-grid">' +
        _info('Indent No', no, 'fa-hashtag') +
        _info('Warehouse', row.WarehouseName || '—', 'fa-warehouse') +
        _info('Date', _dispDate(row['Indent Date'] || row.IndentDate), 'fa-calendar') +
        _info('Category', row.Category || '—', 'fa-tags') +
        _info('Total Amount', _money(row['Total Amount'] || 0), 'fa-rupee-sign') +
        _info('Current Level', 'Level ' + (row.CurrentLevelNo || 1) + ' of ' + (row.TotalLevels || 1), 'fa-layer-group') +
        _info('Status', status, 'fa-info-circle') +
        _info('Level', row.CurrentLevelDesc || '—', 'fa-code-branch') +
        '</div>'
    );
    _renderStepper(G_CurrentLevels, G_CurrentLevelCode);
    $('#ipmItemsBody').html('<tr><td colspan="6" class="text-center text-muted py-3">Loading items…</td></tr>');
    var canAct = _needsAction(status);
    $('#ipmBtnApprove, #ipmBtnReject, #ipmBtnHold').css('display', canAct ? 'inline-flex' : 'none');
    $('#ipmRemarksWrap').toggle(canAct);
    $('#modalIndentVerify').modal({ backdrop: 'static' });
    $('#modalIndentVerify').modal('show');
    IndentMasterLevelsApprovalService.GetIndentDetail(code).then(function (items) {
        G_CurrentLines = _toList(items);
        _renderModalItems(G_CurrentLines);
    }).catch(function () {
        $('#ipmItemsBody').html('<tr><td colspan="6" class="text-center text-danger py-3">Error loading items.</td></tr>');
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
        var name = d.Product || d.ItemName || d.itemName || '—';
        var spec = d.ItemSpecification || d.itemSpecification || '';
        var qty = d['Indent Qty'] != null ? d['Indent Qty'] : (d.QtyMTRS != null ? d.QtyMTRS : 0);
        var uom = d.UOM || '';
        var rate = d.Rate != null ? d.Rate : 0;
        var amt = d.Amount != null ? d.Amount : (parseFloat(qty) || 0) * (parseFloat(rate) || 0);
        return '<tr>' +
            '<td>' + (i + 1) + '</td>' +
            '<td>' + _esc(name) + (spec ? '<div style="color:#64748b;font-size:0.72rem;">' + _esc(spec) + '</div>' : '') + '</td>' +
            '<td>' + _esc(uom) + '</td>' +
            '<td class="text-end">' + _esc(qty) + '</td>' +
            '<td class="text-end">' + _esc(rate) + '</td>' +
            '<td class="text-end">' + _esc(_money(amt)) + '</td>' +
            '</tr>';
    }).join(''));
}

function _runAction(action) {
    var code = parseInt($('#ipmHfCode').val() || 0, 10) || 0;
    var levelCode = parseInt($('#ipmHfLevelCode').val() || 0, 10) || _resolveLevelCode(null, G_CurrentLevels);
    var remarks = String($('#ipmTxtRemarks').val() || '').trim();
    if (!code) {
        toastr.warning('Indent not selected.');
        return;
    }
    if (!levelCode && (G_CurrentLevels || []).length) {
        toastr.warning('No pending approval level found for this indent.');
        return;
    }
    if ((action === 'Reject' || action === 'Hold') && !remarks) {
        toastr.warning('Remarks are required to ' + action.toLowerCase() + '.');
        $('#ipmTxtRemarks').focus();
        return;
    }

    var no = $('#ipmHfIndentNo').val() || code;
        var isAppr = action === 'Approve';
        var isHold = action === 'Hold';
        var hdr = isAppr
            ? 'background:linear-gradient(135deg,#059669,#10b981);color:#fff;'
            : isHold
                ? 'background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;'
                : 'background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;';
        var btnCls = isAppr ? 'btn-ipm-confirm-approve' : (isHold ? 'btn-ipm-confirm-hold' : 'btn-ipm-confirm-reject');
        var btnTxt = isAppr
            ? '<i class="fa fa-check me-1"></i>Yes, Approve'
            : isHold
                ? '<i class="fa fa-pause me-1"></i>Yes, Hold'
                : '<i class="fa fa-times me-1"></i>Yes, Reject';
        var msg = isAppr
            ? 'Are you sure you want to <strong>approve</strong> Indent# <strong>' + _esc(no) + '</strong>?'
            : isHold
                ? 'Are you sure you want to put Indent# <strong>' + _esc(no) + '</strong> on <strong>hold</strong>?'
                : 'Are you sure you want to <strong>reject</strong> Indent# <strong>' + _esc(no) + '</strong>?';
        $('#ipmConfirmTitle').text(isAppr ? 'Confirm Approval' : (isHold ? 'Confirm Hold' : 'Confirm Rejection'));
        $('#ipmConfirmHeader').attr('style', 'padding:12px 16px;border:none;' + hdr);
        $('#ipmConfirmMessage').html(msg);
    $('#ipmBtnConfirmAction').attr('class', btnCls).html(btnTxt).off('click').on('click', function () {
        _executeAction(code, levelCode, remarks, action);
    });
    _showStackedModal('modalIndentConfirm');
}

function _executeAction(code, levelCode, remarks, action) {
    CloseIndentConfirm();
    var moduleName = 'Indent/Material Requirement (Store)';
    var finYear = BizSolHelperFunction.getFinancialYear();
    MenuService.CheckModuleOptionRight(moduleName, 'Verify', 'Y', finYear).then(function (resp) {
        if (resp && resp.CheckModuleOptionRight == 'N') {
            toastr.error(resp.Msg || 'You do not have approval rights.');
            return;
        }
        _postAction(code, levelCode, remarks, action);
    }).catch(function () {
        _postAction(code, levelCode, remarks, action);
    });
}

function _postAction(code, levelCode, remarks, action) {
    var verb = action === 'Approve' ? 'approve' : (action === 'Hold' ? 'hold' : 'reject');
    var call = action === 'Approve'
        ? IndentMasterLevelsApprovalService.ApproveIndent(code, levelCode, remarks)
        : action === 'Hold'
            ? IndentMasterLevelsApprovalService.HoldIndent(code, levelCode, remarks)
            : IndentMasterLevelsApprovalService.RejectIndent(code, levelCode, remarks);
    call.then(function (res) {
        if (_apiOk(res)) {
            toastr.success(_apiMsg(res, 'Indent ' + verb + 'd successfully.'));
            $('#modalIndentVerify').modal('hide');
            LoadIndentPendingList();
        } else {
            toastr.error(_apiMsg(res, 'Failed to ' + verb + ' indent.'));
        }
    }).catch(function () {
        toastr.error('Error during ' + verb + '.');
    });
}

function _showStackedModal(id) {
    var el = document.getElementById(id);
    if (!el || !window.bootstrap || !bootstrap.Modal) {
        $('#' + id).modal({ backdrop: 'static' });
        $('#' + id).modal('show');
        return;
    }
    var modal = bootstrap.Modal.getOrCreateInstance(el, { backdrop: 'static', keyboard: false });
    el.addEventListener('shown.bs.modal', function lift() {
        var backs = document.querySelectorAll('.modal-backdrop');
        if (backs.length) backs[backs.length - 1].style.zIndex = '1070';
        el.style.zIndex = '1080';
        el.removeEventListener('shown.bs.modal', lift);
    });
    modal.show();
}

window.ApprovePendingIndent = function () { _runAction('Approve'); };
window.RejectPendingIndent = function () { _runAction('Reject'); };
window.HoldPendingIndent = function () { _runAction('Hold'); };

window.CloseIndentVerify = function () {
    $('#modalIndentVerify').modal('hide');
};

window.CloseIndentConfirm = function () {
    var el = document.getElementById('modalIndentConfirm');
    if (el && window.bootstrap && bootstrap.Modal.getInstance(el)) {
        bootstrap.Modal.getInstance(el).hide();
    } else {
        $('#modalIndentConfirm').modal('hide');
    }
};

window.CloseIndentPrintOptions = function () {
    var el = document.getElementById('modalIndentPrintOptions');
    if (el && window.bootstrap && bootstrap.Modal.getInstance(el)) {
        bootstrap.Modal.getInstance(el).hide();
    } else {
        $('#modalIndentPrintOptions').modal('hide');
    }
};

window.CloseIndentHistory = function () {
    $('#modalIndentHistory').modal('hide');
};

window.OpenIndentHistory = function () {
    var no = $('#ipmHfIndentNo').val() || '';
    var wh = $('#ipmModalSub').text() || '';
    $('#ipmHistorySub').text((no ? ('Indent# ' + no) : 'Approval history') + (wh ? (' · ' + wh) : ''));
    var levels = G_CurrentLevels || [];
    if (!levels.length) {
        $('#ipmHistoryBody').html('<tr><td colspan="5" class="text-center text-muted py-3">No approval history.</td></tr>');
    } else {
        $('#ipmHistoryBody').html(levels.map(function (lvl, i) {
            var state = _levelState(lvl, i, levels, G_CurrentLevelCode);
            var badge = state === 'done' ? 'Approved' : state === 'rejected' ? 'Rejected' : state === 'hold' ? 'On Hold' : state === 'active' ? 'Pending' : 'Waiting';
            return '<tr><td>' + _esc(lvl.LevelDesc || ('L' + (i + 1))) + '</td>' +
                '<td>' + _esc(lvl.ApproverName || '—') + '</td>' +
                '<td>' + _esc(lvl.ApprovedOn || '—') + '</td>' +
                '<td>' + badge + '</td>' +
                '<td>' + _esc(lvl.Remarks || '') + '</td></tr>';
        }).join(''));
    }
    $('#modalIndentHistory').modal({ backdrop: 'static' });
    $('#modalIndentHistory').modal('show');
};

window.OpenIndentAttachment = function () {
    var code = parseInt($('#ipmHfCode').val() || 0, 10) || 0;
    if (!code) {
        toastr.warning('Indent not selected.');
        return;
    }
    var appBase = (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/')).replace(/\/?$/, '/');
    $('#IndentApproval_AttachmentControlmodal').load(appBase + 'CustomControl/AttachmentControl', {
        MasterTableName: 'IndentMaster',
        MasterTableCode: code,
        DetailTableName: '',
        DetailTableCode: 0,
        EntryNo: $('#ipmHfIndentNo').val() || '',
        EntryDate: $('#ipmHfIndentDate').val() || '',
        Mode: 'view',
        SourceDownloadFileName: ''
    });
};

window.PrintIndentFromDetail = function (mode) {
    var code = parseInt($('#ipmHfCode').val() || 0, 10) || 0;
    if (!code) {
        toastr.warning('Indent not selected.');
        return;
    }
    G_PrintMode = mode === 'print' ? 'print' : 'preview';
    var chk = document.getElementById('ipmChkIncludeFlow');
    if (chk) chk.checked = true;
    _showStackedModal('modalIndentPrintOptions');
};

function _buildIndentPrintHtml(includeFlow) {
    var row = G_CurrentRow || {};
    var no = $('#ipmHfIndentNo').val() || '';
    var wh = row.WarehouseName || $('#ipmModalSub').text() || '';
    var date = _dispDate($('#ipmHfIndentDate').val() || row['Indent Date'] || row.IndentDate);
    var cat = row.Category || '';
    var status = row.ApprovalStatus || '';
    var amount = _money(row['Total Amount'] || 0);
    var itemRows = (G_CurrentLines || []).map(function (d, i) {
        var name = d.Product || d.ItemName || '';
        var spec = d.ItemSpecification || '';
        var qty = d['Indent Qty'] != null ? d['Indent Qty'] : (d.QtyMTRS || 0);
        var uom = d.UOM || '';
        var rate = d.Rate || 0;
        var amt = d.Amount != null ? d.Amount : (parseFloat(qty) || 0) * (parseFloat(rate) || 0);
        return '<tr><td>' + (i + 1) + '</td><td>' + _esc(name) + (spec ? '<div class="spec">' + _esc(spec) + '</div>' : '') +
            '</td><td>' + _esc(uom) + '</td><td class="num">' + _esc(qty) +
            '</td><td class="num">' + _esc(rate) + '</td><td class="num">' + _esc(_money(amt)) + '</td></tr>';
    }).join('');
    var flow = '';
    if (includeFlow && G_CurrentLevels && G_CurrentLevels.length) {
        flow = '<h3>Approval Flow</h3><table><thead><tr><th>Level</th><th>Approver</th><th>Date</th><th>Status</th><th>Remarks</th></tr></thead><tbody>' +
            G_CurrentLevels.map(function (lvl, i) {
                var state = _levelState(lvl, i, G_CurrentLevels, G_CurrentLevelCode);
                var badge = state === 'done' ? 'Approved' : state === 'rejected' ? 'Rejected' : state === 'hold' ? 'On Hold' : state === 'active' ? 'Pending' : 'Waiting';
                return '<tr><td>' + _esc(lvl.LevelDesc || ('L' + (i + 1))) + '</td><td>' + _esc(lvl.ApproverName || '') +
                    '</td><td>' + _esc(lvl.ApprovedOn || '') + '</td><td>' + badge + '</td><td>' + _esc(lvl.Remarks || '') + '</td></tr>';
            }).join('') + '</tbody></table>';
    }
    return '<!DOCTYPE html><html><head><title>Indent ' + _esc(no) + '</title><style>' +
        'body{font-family:Arial,sans-serif;color:#1e293b;margin:24px;}h1{margin:0;font-size:20px;}h3{margin:18px 0 8px;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#475569;}' +
        '.sub{color:#64748b;margin-top:4px;}.meta{width:100%;border-collapse:collapse;margin-top:14px;}.meta td{border:1px solid #e2e8f0;padding:8px 10px;font-size:12px;width:33%;}' +
        '.meta b{display:block;font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:2px;}' +
        'table.items,table.items th,table.items td,h3+table,h3+table th,h3+table td{border-collapse:collapse;}' +
        'table{width:100%;border-collapse:collapse;margin-top:8px;}th,td{border:1px solid #e2e8f0;padding:6px 8px;font-size:12px;}th{background:#4f46e5;color:#fff;}' +
        '.num{text-align:right;}.spec{color:#64748b;font-size:11px;}</style></head><body>' +
        '<h1>INDENT# ' + _esc(no) + '</h1><div class="sub">' + _esc(wh) + '</div>' +
        '<table class="meta"><tr><td><b>Indent No</b>' + _esc(no) + '</td><td><b>Warehouse</b>' + _esc(wh) + '</td><td><b>Date</b>' + _esc(date) + '</td></tr>' +
        '<tr><td><b>Category</b>' + _esc(cat || '—') + '</td><td><b>Total Amount</b>' + _esc(amount) + '</td><td><b>Status</b>' + _esc(status || 'Pending') + '</td></tr></table>' +
        '<h3>Indent Items</h3><table class="items"><thead><tr><th>#</th><th>Item / Description</th><th>UOM</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>' +
        (itemRows || '<tr><td colspan="6">No items</td></tr>') + '</tbody></table>' + flow + '</body></html>';
}

window.ConfirmIndentPrint = function () {
    var includeFlow = !!(document.getElementById('ipmChkIncludeFlow') && document.getElementById('ipmChkIncludeFlow').checked);
    CloseIndentPrintOptions();
    var html = _buildIndentPrintHtml(includeFlow);
    var win = window.open('', '_blank', 'width=920,height=760,scrollbars=yes,resizable=yes');
    if (!win) {
        toastr.warning('Please allow pop-ups for this site to preview or print.');
        return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    if (G_PrintMode === 'print') {
        setTimeout(function () { win.focus(); win.print(); }, 600);
    }
};

$(document).ready(function () {
    var menu = _queryParam('ModuleDesp') || _queryParam('menu');
    $('#ERPHeading').text(menu || 'Indent Level Approval');
    $('#ipmSearch').on('input', function () { _renderCards(G_PendingList); });
    Promise.resolve(_setDates()).then(function () { LoadIndentPendingList(); });
});
