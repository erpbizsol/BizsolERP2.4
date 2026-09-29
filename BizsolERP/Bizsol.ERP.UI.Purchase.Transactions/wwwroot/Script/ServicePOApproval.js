import { ServicePOApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ServicePOApprovalService.js';

let FrmType = '';
let FrmAction = '';
let G_ServicePOList = [];
let G_CurrentServicePO = null;

function EscHtml(s) {
    if (s == null || s === '') return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function FmtCurrency(val) {
    const n = parseFloat(String(val ?? '').replace(/,/g, ''));
    if (isNaN(n)) return '\u2014';
    return '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FmtDateDisplay(d) {
    if (!d) return '';
    const s = String(d).trim();
    if (s.indexOf('/') !== -1) return s;
    const dt = new Date(s);
    if (isNaN(dt.getTime())) return s;
    return String(dt.getDate()).padStart(2, '0') + '/' +
        String(dt.getMonth() + 1).padStart(2, '0') + '/' +
        dt.getFullYear();
}

function ReviewActionLabel() {
    const a = (FrmAction || 'Approve').trim();
    if (/verify/i.test(a)) return 'Review & Verify';
    if (/check/i.test(a)) return 'Review & Check';
    return 'Review & Approve';
}

function VerifyButtonLabel() {
    const a = (FrmAction || 'Approve').trim();
    if (/verify/i.test(a)) return 'Verify';
    if (/check/i.test(a)) return 'Check';
    return 'Approve';
}

function ShowLoading(show) {
    document.getElementById('servicePoPendingLoading').style.display = show ? '' : 'none';
}

function ShowEmpty(show) {
    document.getElementById('servicePoPendingEmpty').style.display = show ? '' : 'none';
}

function UpdateStatChips() {
    const pending = G_ServicePOList.length;
    document.getElementById('statPendingServicePO').textContent = pending > 0 ? pending : '\u2014';
}

function GetField(item, keys) {
    for (let i = 0; i < keys.length; i++) {
        if (item[keys[i]] != null && item[keys[i]] !== '') return item[keys[i]];
    }
    return '';
}

function BuildInfoItem(label, value, icon, valueColor) {
    const clr = valueColor ? 'style="color:' + valueColor + ';font-weight:800;"' : '';
    return '<div class="pla-info-item">' +
        '<span class="pla-info-lbl"><i class="fa ' + icon + ' me-1"></i>' + EscHtml(label) + '</span>' +
        '<span class="pla-info-val" ' + clr + '>' + value + '</span>' +
        '</div>';
}

function BuildServicePOCard(item) {
    const code = item.Code;
    const poNo = EscHtml(String(GetField(item, ['PO No.', 'PONo', 'PO No']) || '\u2014'));
    const party = EscHtml(String(GetField(item, ['Party', 'PartyName', 'Party Name']) || '\u2014'));
    const description = EscHtml(String(GetField(item, ['Description', 'Remarks']) || ''));
    const poDate = EscHtml(FmtDateDisplay(GetField(item, ['PO Date', 'PODate'])));
    const amount = FmtCurrency(GetField(item, ['Amount', 'Total Amount', 'TotalAmount']) || 0);

    const actionBtn =
        '<button type="button" class="btn-pla-card-approve" onclick="OpenReviewModal(\'' + code + '\')">' +
        '<i class="fa fa-folder-open me-1"></i>' + ReviewActionLabel() +
        '</button>';

    return (
        '<div class="pla-po-card section-entry-animation" data-code="' + EscHtml(String(code)) + '">' +
        '<div class="pla-po-card-header">' +
        '<div class="pla-po-no-badge">' +
        '<span style="font-size:0.6rem;font-weight:600;opacity:0.82;line-height:1;">PO#</span>' +
        '<span style="font-weight:800;font-size:0.82rem;line-height:1.2;">' + poNo + '</span>' +
        '</div>' +
        '<div class="pla-po-card-vendor">' +
        '<div class="pla-po-vendor-name">' +
        '<i class="fa fa-building me-1" style="color:#667eea;font-size:0.72rem;"></i>' + party +
        '</div>' +
        (description ? '<div class="pla-po-desc">' + description + '</div>' : '') +
        '<div class="pla-po-card-meta">' +
        '<span><i class="fa fa-calendar-alt me-1"></i>' + (poDate || '\u2014') + '</span>' +
        '<span class="pla-po-level-chip"><i class="fa fa-screwdriver-wrench me-1"></i>' + EscHtml(FrmAction || 'Approve') + '</span>' +
        '</div>' +
        '</div>' +
        '<div class="pla-po-card-right">' +
        '<div class="pla-po-amount">' + amount + '</div>' +
        '<div class="pla-po-status-badge">Pending</div>' +
        '</div>' +
        '</div>' +
        '<div class="pla-po-card-footer">' + actionBtn + '</div>' +
        '</div>'
    );
}

function RenderServicePOCards(list) {
    const container = document.getElementById('servicePoPendingList');
    if (!list || list.length === 0) {
        container.innerHTML = '';
        ShowEmpty(true);
        return;
    }
    ShowEmpty(false);
    container.innerHTML = list.map(BuildServicePOCard).join('');
}

function RenderModalItems(rows) {
    const tbody = document.getElementById('table-body-PoapprovalModalTable');
    const thead = document.getElementById('table-header-PoapprovalModalTable');
    if (!rows || rows.length === 0) {
        thead.innerHTML = '';
        tbody.innerHTML =
            '<tr><td colspan="6" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No line items found.</td></tr>';
        return;
    }

    const hiddenKeys = new Set(['Code', 'ItemMaster_Code', 'itemsizemaster_Code']);
    const keys = Object.keys(rows[0]).filter(function (k) { return !hiddenKeys.has(k); });
    const rightAlign = new Set(['Amount', 'Qty MT', 'Last Rate', 'Qty', 'Rate']);

    thead.innerHTML = '<tr>' + keys.map(function (k) {
        return '<th>' + EscHtml(k) + '</th>';
    }).join('') + '</tr>';

    tbody.innerHTML = rows.map(function (row) {
        return '<tr>' + keys.map(function (k) {
            const val = row[k] == null ? '' : row[k];
            const align = rightAlign.has(k) ? ' style="text-align:right;"' : '';
            return '<td' + align + '>' + EscHtml(String(val)) + '</td>';
        }).join('') + '</tr>';
    }).join('');
}

function OpenReviewModal(code) {
    G_CurrentServicePO = G_ServicePOList.find(function (q) { return String(q.Code) === String(code); });
    if (!G_CurrentServicePO) return;

    const poNo = GetField(G_CurrentServicePO, ['PO No.', 'PONo', 'PO No']) || '\u2014';
    const party = GetField(G_CurrentServicePO, ['Party', 'PartyName', 'Party Name']) || '\u2014';
    const description = GetField(G_CurrentServicePO, ['Description', 'Remarks']) || '\u2014';
    const poDate = FmtDateDisplay(GetField(G_CurrentServicePO, ['PO Date', 'PODate']));
    const amount = FmtCurrency(GetField(G_CurrentServicePO, ['Amount', 'Total Amount', 'TotalAmount']) || 0);

    document.getElementById('modalServicePONo').textContent = 'PO# ' + poNo;
    document.getElementById('modalPartyName').textContent = party;
    document.getElementById('hfServicePOCode').value = code;

    document.getElementById('modalServicePOHeader').innerHTML =
        '<div class="pla-info-grid">' +
        BuildInfoItem('PO No.', EscHtml(String(poNo)), 'fa-hashtag') +
        BuildInfoItem('Party', EscHtml(String(party)), 'fa-building') +
        BuildInfoItem('PO Date', EscHtml(poDate || '\u2014'), 'fa-calendar-alt') +
        BuildInfoItem('Amount', amount, 'fa-rupee-sign', '#667eea') +
        BuildInfoItem('Action', EscHtml(FrmAction || 'Approve'), 'fa-check-double') +
        BuildInfoItem('Status', 'Pending', 'fa-info-circle') +
        '</div>' +
        '<div class="pla-info-grid" style="grid-template-columns:1fr;">' +
        BuildInfoItem('Description', EscHtml(String(description)), 'fa-align-left') +
        '</div>';

    document.getElementById('btnServicePOVerifyLabel').textContent = VerifyButtonLabel();
    document.getElementById('btnServicePOVerify').style.display = '';

    document.getElementById('table-header-PoapprovalModalTable').innerHTML = '';
    document.getElementById('table-body-PoapprovalModalTable').innerHTML =
        '<tr><td colspan="6" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">' +
        '<i class="fa fa-spinner fa-spin me-1"></i>Loading items\u2026</td></tr>';

    $('#myModal').modal({ backdrop: 'static' });
    $('#myModal').modal('show');

    ServicePOApprovalService.GetServicePODetail(code).then(function (response) {
        if (response && response.length > 0) {
            RenderModalItems(response);
        } else {
            RenderModalItems([]);
        }
    }).catch(function () {
        document.getElementById('table-body-PoapprovalModalTable').innerHTML =
            '<tr><td colspan="6" class="text-center py-3" style="color:#ef4444;font-size:0.82rem;">' +
            '<i class="fa fa-exclamation-triangle me-1"></i>Error loading items.</td></tr>';
    });
}

function ViewData(Code) {
    OpenReviewModal(Code);
}

$(document).ready(function () {
    var urlParams = getUrlVars();
    var menuValue = decodeURI(urlParams['menu']);
    FrmType = decodeURI(urlParams['FrmType']);
    FrmAction = decodeURI(urlParams['FrmAction']);

    if (menuValue && menuValue !== 'undefined' && menuValue !== '') {
        $('#ERPHeading').text(menuValue);
        document.getElementById('spoPageTitle').textContent = menuValue;
    } else {
        $('#ERPHeading').text('Service PO Approval');
    }

    document.getElementById('btnServicePOVerifyLabel').textContent = VerifyButtonLabel();
    unApprovedServicePO();
});

function unApprovedServicePO() {
    ShowLoading(true);
    ShowEmpty(false);
    document.getElementById('servicePoPendingList').innerHTML = '';

    ServicePOApprovalService.GetUnApprovedServicePO(FrmAction).then(function (response) {
        ShowLoading(false);
        if (response && response.length > 0) {
            G_ServicePOList = response;
            UpdateStatChips();
            RenderServicePOCards(G_ServicePOList);
        } else {
            G_ServicePOList = [];
            UpdateStatChips();
            RenderServicePOCards([]);
            toastr.error('No data available');
        }
    }).catch(function () {
        ShowLoading(false);
        G_ServicePOList = [];
        UpdateStatChips();
        RenderServicePOCards([]);
        toastr.error('Error in fetching data');
    });
}

function Approval(Code) {
    if (!Code) return;
    ServicePOApprovalService.ServicePOApproved(Code, FrmAction, FrmType).then(function (approve) {
        if (approve.Status === 'Y') {
            toastr.success(approve.Msg);
            CloseModal();
            GetWebNotificationList();
            unApprovedServicePO();
        } else {
            toastr.error(approve.Msg);
        }
    }).catch(function (error) {
        toastr.error('Error in Service PO Approval: ', error);
    });
}

function CloseModal() {
    G_CurrentServicePO = null;
    $('#myModal').modal('hide');
}

function getUrlVars() {
    var vars = {};
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}

window.ViewData = ViewData;
window.OpenReviewModal = OpenReviewModal;
window.CloseModal = CloseModal;
window.Approval = Approval;
