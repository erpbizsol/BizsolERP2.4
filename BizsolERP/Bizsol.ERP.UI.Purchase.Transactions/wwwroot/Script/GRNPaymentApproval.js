import { GRNPaymentApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GRNPaymentApprovalService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

const USE_DUMMY = false;

let G_PaymentList = [];
let G_CurrentPayment = null;

BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');

$(document).ready(function () {
    InitDates();
    LoadPaymentList();

    $('#gpaLstSearch').on('input', function () {
        FilterCards($(this).val().toLowerCase().trim());
    });
});

function InitDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    $('#gpaFromDate').val(FmtDateInput(firstDay));
    $('#gpaToDate').val(FmtDateInput(today));
}

function FmtDateInput(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function FmtDateDisplay(d) {
    if (!d) return '';
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return String(dt.getDate()).padStart(2, '0') + '/' +
        String(dt.getMonth() + 1).padStart(2, '0') + '/' +
        dt.getFullYear();
}

function FmtCurrency(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return '—';
    return '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function EscHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Map USP_WebAPI_GRNPaymentLevelsApproval list row (aliases may include spaces). */
function GetEntryNo(row) {
    return row['PO No'] || row.PONo || row.EntryNo || row.DocNo || '—';
}

function GetPartyName(row) {
    return row['Party Name'] || row.PartyName || row.VendorName || '—';
}

function GetEntryDate(row) {
    return row['PO Date'] || row.EntryDate || row.PODate || row.DocDate || '';
}

function GetTotalAmount(row) {
    const v = row['Total Amount'] != null ? row['Total Amount'] : row.TotalAmount;
    return v;
}

function NormalizePaymentList(list) {
    return (list || []).map(function (row) {
        if (typeof row.LevelDetails === 'string') {
            try {
                row.LevelDetails = JSON.parse(row.LevelDetails);
            } catch (e) {
                row.LevelDetails = [];
            }
        }
        if (!Array.isArray(row.LevelDetails)) {
            row.LevelDetails = [];
        }
        if (!row.TotalLevels && row.LevelDetails.length > 0) {
            row.TotalLevels = row.LevelDetails.length;
        }
        return row;
    });
}

function LoadPaymentList() {
    const fromDate = $('#gpaFromDate').val() || '';
    const toDate = $('#gpaToDate').val() || '';
    const status = $('#gpaDdlStatus').val() || '';

    ShowLoading(true);
    ShowEmpty(false);
    document.getElementById('gpaPendingList').innerHTML = '';

    if (USE_DUMMY) {
        ShowLoading(false);
        G_PaymentList = [];
        UpdateStatChips();
        RenderPaymentCards(G_PaymentList);
        return;
    }

    GRNPaymentApprovalService.GetPendingGRNPaymentList(fromDate, toDate, status)
        .then(function (data) {
            ShowLoading(false);
            const arr = Array.isArray(data) ? data : (data && data.Data ? data.Data : []);
            G_PaymentList = NormalizePaymentList(arr);
            UpdateStatChips();
            RenderPaymentCards(G_PaymentList);
        })
        .catch(function () {
            ShowLoading(false);
            G_PaymentList = [];
            ShowEmpty(true);
            toastr.error('Error loading GRN payment list.');
        });
}

function UpdateStatChips() {
    const pending = G_PaymentList.filter(function (p) {
        const s = (p.ApprovalStatus || p.Status || 'Pending').trim().toLowerCase();
        return s === 'pending';
    }).length;
    const nonPending = G_PaymentList.length - pending;
    $('#gpaStatPending').text(pending > 0 ? pending : (G_PaymentList.length ? '0' : '—'));
    $('#gpaStatProcessed').text(nonPending > 0 ? nonPending : '—');
}

function RenderPaymentCards(list) {
    const container = document.getElementById('gpaPendingList');
    if (!list || list.length === 0) {
        container.innerHTML = '';
        ShowEmpty(true);
        return;
    }
    ShowEmpty(false);
    container.innerHTML = list.map(function (row) { return BuildPaymentCard(row); }).join('');
}

function BuildPaymentCard(row) {
    const entryNo = EscHtml(GetEntryNo(row));
    const party = EscHtml(GetPartyName(row));
    const entryDate = FmtDateDisplay(GetEntryDate(row));
    const amount = FmtCurrency(GetTotalAmount(row));
    const code = row.Code || row.GRNPaymentMaster_Code || 0;
    const totalLvl = parseInt(row.TotalLevels || row.MaxLevel || 1, 10);
    const curLvlNo = parseInt(row.CurrentLevelNo || row.CurrentLevel || 1, 10);
    const lvlDesc = EscHtml(row.CurrentLevelDesc || row.LevelDesc || ('Level ' + curLvlNo));
    const status = (row.ApprovalStatus || row.Status || 'Pending').trim();

    let statusClr, statusBg;
    if (status.toLowerCase() === 'approved') { statusClr = '#059669'; statusBg = '#d1fae5'; }
    else if (status.toLowerCase() === 'rejected') { statusClr = '#dc2626'; statusBg = '#fee2e2'; }
    else { statusClr = '#b45309'; statusBg = '#fef3c7'; }

    const stepperHtml = BuildCardStepper(curLvlNo, totalLvl, status);

    const actionBtn = status.toLowerCase() === 'pending'
        ? `<button type="button" class="btn-gpa-card-approve" onclick="OpenDetailModal(${code})">
               <i class="fa fa-check me-1"></i>Review &amp; Approve
           </button>`
        : `<button type="button" class="btn-gpa-card-view" onclick="OpenDetailModal(${code})">
               <i class="fa fa-eye me-1"></i>View Details
           </button>`;

    const searchKey = (
        GetPartyName(row) + ' ' + GetEntryNo(row) + ' ' + (row.CurrentLevelDesc || '')
    ).toLowerCase();

    return `
    <div class="gpa-pay-card section-entry-animation" data-code="${code}" data-search="${EscHtml(searchKey)}">
        <div class="gpa-pay-card-header">
            <div class="gpa-entry-badge">
                <span style="font-size:0.6rem;font-weight:600;opacity:0.88;line-height:1;">Entry</span>
                <span style="font-weight:800;font-size:0.82rem;line-height:1.2;">${entryNo}</span>
            </div>
            <div class="gpa-pay-card-vendor">
                <div class="gpa-pay-vendor-name">
                    <i class="fa fa-building me-1" style="color:#0d9488;font-size:0.72rem;"></i>${party}
                </div>
                <div class="gpa-pay-card-meta">
                    <span><i class="fa fa-calendar-alt me-1"></i>${entryDate || '—'}</span>
                    <span class="gpa-pay-level-chip">
                        <i class="fa fa-layer-group me-1"></i>${lvlDesc}
                    </span>
                </div>
            </div>
            <div class="gpa-pay-card-right">
                <div class="gpa-pay-amount">${amount}</div>
                <div class="gpa-pay-status-badge" style="color:${statusClr};background:${statusBg};">${EscHtml(status)}</div>
            </div>
        </div>
        <div class="gpa-pay-card-levels">
            <div class="gpa-pay-level-label">
                <i class="fa fa-code-branch me-1" style="color:#0d9488;"></i>
                Approval Progress
            </div>
            ${stepperHtml}
        </div>
        <div class="gpa-pay-card-footer">
            ${actionBtn}
        </div>
    </div>`;
}

function BuildCardStepper(currentLevel, totalLevels, status) {
    if (!totalLevels || totalLevels < 1) totalLevels = 1;
    let html = '<div class="gpa-stepper">';
    const st = status.toLowerCase();
    for (let i = 1; i <= totalLevels; i++) {
        let stepClass;
        if (st === 'approved') { stepClass = 'gpa-step-done'; }
        else if (i < currentLevel) { stepClass = 'gpa-step-done'; }
        else if (i === currentLevel) { stepClass = st === 'rejected' ? 'gpa-step-rejected' : 'gpa-step-active'; }
        else { stepClass = 'gpa-step-pending'; }

        const lineClass = (i < currentLevel || st === 'approved')
            ? 'gpa-step-line-done' : 'gpa-step-line-pending';

        const iconHtml = stepClass === 'gpa-step-done'
            ? '<i class="fa fa-check" style="font-size:0.6rem;"></i>'
            : stepClass === 'gpa-step-rejected'
                ? '<i class="fa fa-times" style="font-size:0.6rem;"></i>'
                : i;

        html += `<div class="gpa-step-item">
                    <div class="gpa-step-circle ${stepClass}">${iconHtml}</div>
                    <div class="gpa-step-lbl">L${i}</div>
                 </div>`;
        if (i < totalLevels) {
            html += `<div class="gpa-step-connector ${lineClass}"></div>`;
        }
    }
    html += '</div>';
    return html;
}

function FilterCards(query) {
    const cards = document.querySelectorAll('.gpa-pay-card');
    let visible = 0;
    cards.forEach(function (card) {
        const match = !query || (card.dataset.search || '').includes(query);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
    });
    ShowEmpty(visible === 0 && G_PaymentList.length > 0);
}

function OpenDetailModal(paymentCode) {
    G_CurrentPayment = G_PaymentList.find(function (p) {
        return (p.Code || p.GRNPaymentMaster_Code || 0) == paymentCode;
    });
    if (!G_CurrentPayment) return;

    const entryNo = GetEntryNo(G_CurrentPayment);
    const party = GetPartyName(G_CurrentPayment);
    const entryDate = FmtDateDisplay(GetEntryDate(G_CurrentPayment));
    const amount = FmtCurrency(GetTotalAmount(G_CurrentPayment));
    const curLvlNo = parseInt(G_CurrentPayment.CurrentLevelNo || G_CurrentPayment.CurrentLevel || 1, 10);
    const totalLvl = parseInt(G_CurrentPayment.TotalLevels || G_CurrentPayment.MaxLevel || 1, 10);
    const status = (G_CurrentPayment.ApprovalStatus || G_CurrentPayment.Status || 'Pending').trim();

    $('#gpaModalEntryTitle').text('GRN Payment #' + entryNo);
    $('#gpaModalParty').text(party);
    $('#hfGpaPaymentCode').val(paymentCode);
    $('#hfGpaLevelCode').val(G_CurrentPayment.LevelCode || G_CurrentPayment.GRNPaymentApprovalConfiguration_Code || 0);
    $('#gpaFrmRemarks').val('');

    $('#gpaModalHeader').html(
        '<div class="gpa-info-grid">' +
            BuildInfoItem('Entry No', EscHtml(entryNo), 'fa-hashtag') +
            BuildInfoItem('Party', EscHtml(party), 'fa-building') +
            BuildInfoItem('Entry Date', EscHtml(entryDate || '—'), 'fa-calendar-alt') +
            BuildInfoItem('Total Amount', amount, 'fa-rupee-sign', '#0d9488') +
            BuildInfoItem('Current Level', 'Level ' + curLvlNo + ' of ' + totalLvl, 'fa-layer-group') +
            BuildInfoItem('Status', EscHtml(status), 'fa-info-circle') +
        '</div>'
    );

    $('#gpaModalApprovalStepper').html(BuildDetailStepper(G_CurrentPayment));

    const isPending = status.toLowerCase() === 'pending';
    $('#gpaBtnApproveAction').toggle(isPending);
    $('#gpaBtnRejectAction').toggle(isPending);

    $('#gpaModalItemsBody').html(
        '<tr><td colspan="6" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">' +
        '<i class="fa fa-spinner fa-spin me-1"></i>Loading bill details…</td></tr>'
    );

    $('#modalGpaDetail').modal({ backdrop: 'static' });
    $('#modalGpaDetail').modal('show');

    if (USE_DUMMY) {
        $('#gpaModalItemsBody').html(
            '<tr><td colspan="6" class="text-center py-3" style="color:#94a3b8;">No demo data.</td></tr>'
        );
        return;
    }

    GRNPaymentApprovalService.GetGRNPaymentDetail(paymentCode)
        .then(function (data) {
            const rows = Array.isArray(data) ? data : (data && data.Data ? data.Data : []);
            RenderPaymentRows(rows);
        })
        .catch(function () {
            $('#gpaModalItemsBody').html(
                '<tr><td colspan="6" class="text-center py-3" style="color:#ef4444;font-size:0.82rem;">' +
                '<i class="fa fa-exclamation-triangle me-1"></i>Error loading bill details.</td></tr>'
            );
        });
}

function BuildInfoItem(label, value, icon, valueColor) {
    const clr = valueColor ? 'style="color:' + valueColor + ';font-weight:800;"' : '';
    return '<div class="gpa-info-item">' +
        '<span class="gpa-info-lbl"><i class="fa ' + icon + ' me-1"></i>' + label + '</span>' +
        '<span class="gpa-info-val" ' + clr + '>' + value + '</span>' +
        '</div>';
}

function BuildDetailStepper(po) {
    const curLvlNo = parseInt(po.CurrentLevelNo || po.CurrentLevel || 1, 10);
    const totalLvl = parseInt(po.TotalLevels || po.MaxLevel || 1, 10);
    const status = (po.ApprovalStatus || po.Status || 'Pending').trim();
    const levels = Array.isArray(po.LevelDetails) ? po.LevelDetails : [];

    let html = '<div class="gpa-detail-stepper">';
    for (let i = 1; i <= totalLvl; i++) {
        const lvlInfo = levels.find(function (l) { return (l.LevelNo || l.Level || l.LevelOrder) == i; }) || {};
        const lvlName = EscHtml(lvlInfo.LevelDesc || lvlInfo.LevelName || ('Level ' + i));
        const approver = EscHtml(lvlInfo.ApproverName || lvlInfo.UserName || '');
        const approvedOn = lvlInfo.ApprovedOn ? FmtDateDisplay(lvlInfo.ApprovedOn) : '';

        let stepState;
        if (status.toLowerCase() === 'approved' || i < curLvlNo) stepState = 'done';
        else if (i === curLvlNo) stepState = status.toLowerCase() === 'rejected' ? 'rejected' : 'active';
        else stepState = 'pending';

        const iconHtml = stepState === 'done' ? '<i class="fa fa-check"></i>'
            : stepState === 'rejected' ? '<i class="fa fa-times"></i>'
                : stepState === 'active' ? '<i class="fa fa-hourglass-half"></i>'
                    : i;

        const badgeLabel = stepState === 'done' ? 'Approved'
            : stepState === 'rejected' ? 'Rejected'
                : stepState === 'active' ? 'Pending'
                    : 'Waiting';

        const approverHtml = approver
            ? '<div class="gpa-dstep-sub"><i class="fa fa-user me-1"></i>' + approver +
            (approvedOn ? ' — ' + approvedOn : '') + '</div>'
            : '';

        const lineClass = (stepState === 'done') ? 'gpa-dstep-line-done' : 'gpa-dstep-line-pending';

        html += '<div class="gpa-dstep-item gpa-dstep-' + stepState + '">' +
            '<div class="gpa-dstep-circle">' + iconHtml + '</div>' +
            '<div class="gpa-dstep-body">' +
            '<div class="gpa-dstep-title">' + lvlName + '</div>' +
            approverHtml +
            '<div class="gpa-dstep-badge gpa-dstep-badge-' + stepState + '">' + badgeLabel + '</div>' +
            '</div>' +
            '</div>';

        if (i < totalLvl) {
            html += '<div class="gpa-dstep-line ' + lineClass + '"></div>';
        }
    }
    html += '</div>';
    return html;
}

function RenderPaymentRows(rows) {
    if (!rows || rows.length === 0) {
        $('#gpaModalItemsBody').html(
            '<tr><td colspan="6" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No bill lines found.</td></tr>'
        );
        return;
    }
    let html = '';
    rows.forEach(function (item, idx) {
        const billNo = EscHtml(item.BillNo || item['BillNo'] || '—');
        const billDate = (item['Bill Date'] != null || item.BillDate != null)
            ? FmtDateDisplay(item['Bill Date'] != null ? item['Bill Date'] : item.BillDate)
            : '—';
        const totalManual = parseFloat(item.TotalBillAmountManual != null ? item.TotalBillAmountManual : item.totalBillAmountManual || 0);
        const netPay = parseFloat(item.NetPayable != null ? item.NetPayable : item.netPayable || 0);
        const payAmt = parseFloat(item['Payment Amount'] != null ? item['Payment Amount'] : item.PaymentAmount || 0);

        html += '<tr>' +
            '<td class="text-center" style="color:#94a3b8;">' + (idx + 1) + '</td>' +
            '<td style="font-weight:600;">' + billNo + '</td>' +
            '<td class="text-center">' + billDate + '</td>' +
            '<td class="text-end">' + FmtCurrency(totalManual) + '</td>' +
            '<td class="text-end">' + FmtCurrency(netPay) + '</td>' +
            '<td class="text-end" style="font-weight:700;color:#0d9488;">' + FmtCurrency(payAmt) + '</td>' +
            '</tr>';
    });
    $('#gpaModalItemsBody').html(html);
}

function SubmitApproval(action) {
    const payCode = parseInt($('#hfGpaPaymentCode').val() || '0', 10);
    const levelCode = parseInt($('#hfGpaLevelCode').val() || '0', 10);
    const remarks = ($('#gpaFrmRemarks').val() || '').trim();

    if (!payCode) { toastr.warning('No payment selected.'); return; }
    if (action === 'Reject' && !remarks) {
        toastr.warning('Please enter remarks before rejecting.');
        $('#gpaFrmRemarks').focus();
        return;
    }

    const entryNo = G_CurrentPayment ? GetEntryNo(G_CurrentPayment) : '';
    const isAppr = action === 'Approve';
    const hdrBg = isAppr
        ? 'background:linear-gradient(135deg,#059669,#10b981);color:#fff;'
        : 'background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;';
    const btnCls = isAppr ? 'btn-gpa-confirm-approve' : 'btn-gpa-confirm-reject';
    const btnTxt = isAppr
        ? '<i class="fa fa-check me-1"></i>Yes, Approve'
        : '<i class="fa fa-times me-1"></i>Yes, Reject';
    const msg = isAppr
        ? 'Are you sure you want to <strong>approve</strong> GRN payment <strong>' + EscHtml(entryNo) + '</strong>?'
        : 'Are you sure you want to <strong>reject</strong> GRN payment <strong>' + EscHtml(entryNo) + '</strong>?';

    $('#gpaConfirmTitle').text(isAppr ? 'Confirm Approval' : 'Confirm Rejection');
    $('#gpaConfirmModalHeader').attr('style', 'padding:12px 16px;border:none;' + hdrBg);
    $('#gpaConfirmMessage').html(msg);
    $('#gpaBtnConfirmAction')
        .attr('class', btnCls)
        .html(btnTxt)
        .off('click')
        .on('click', function () { ExecuteApproval(payCode, levelCode, remarks, action); });

    $('#modalGpaConfirm').modal('show');
}

function ExecuteApproval(payCode, levelCode, remarks, action) {
    CloseConfirmModal();

    if (USE_DUMMY) {
        toastr.success('Demo only.');
        return;
    }

    Showloader();

    const serviceCall = action === 'Approve'
        ? GRNPaymentApprovalService.ApproveGRNPayment(payCode, levelCode, remarks)
        : GRNPaymentApprovalService.RejectGRNPayment(payCode, levelCode, remarks);

    serviceCall
        .then(function (response) {
            HideLoader();
            const ok = response && (
                response.Status === 'Y' || response.Status === 'Success' ||
                response.Success === true || response === true
            );
            if (ok) {
                toastr.success('GRN payment ' + (action === 'Approve' ? 'approved' : 'rejected') + ' successfully.');
                CloseDetailModal();
                LoadPaymentList();
            } else {
                const msg = (response && (response.Msg || response.Message || response.message)) ||
                    ('Failed to ' + action.toLowerCase() + ' GRN payment.');
                toastr.error(msg);
            }
        })
        .catch(function () {
            HideLoader();
            toastr.error('Error while ' + (action === 'Approve' ? 'approving' : 'rejecting') + ' GRN payment.');
        });
}

function CloseDetailModal() {
    $('#modalGpaDetail').modal('hide');
    G_CurrentPayment = null;
}

function CloseConfirmModal() {
    $('#modalGpaConfirm').modal('hide');
}

function ShowLoading(show) {
    document.getElementById('gpaPendingLoading').style.display = show ? '' : 'none';
    document.getElementById('gpaPendingList').style.display = show ? 'none' : '';
}

function ShowEmpty(show) {
    document.getElementById('gpaPendingEmpty').style.display = show ? '' : 'none';
}

function NavigateToGRNService() {
    const appBase = (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/'))
        .replace(/\/?$/, '/');
    const q = new URLSearchParams(window.location.search);
    const mod = q.get('ModuleDesp');
    const qs = mod ? ('?ModuleDesp=' + encodeURIComponent(mod)) : '';
    window.location.href = appBase + 'PurchaseTransactions/GRNService/GRNService' + qs;
}

window.LoadPaymentList = LoadPaymentList;
window.OpenDetailModal = OpenDetailModal;
window.SubmitApproval = SubmitApproval;
window.CloseDetailModal = CloseDetailModal;
window.CloseConfirmModal = CloseConfirmModal;
window.NavigateToGRNService = NavigateToGRNService;
