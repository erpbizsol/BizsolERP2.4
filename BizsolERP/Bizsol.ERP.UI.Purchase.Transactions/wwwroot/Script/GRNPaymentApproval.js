import { GRNPaymentApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GRNPaymentApprovalService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

let G_PaymentList = [];
let G_CurrentPayment = null;

BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');

function InitDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const fromEl = document.getElementById('gpaFromDate');
    const toEl = document.getElementById('gpaToDate');
    if (fromEl && !fromEl.value) fromEl.value = FmtDateInput(firstDay);
    if (toEl && !toEl.value) toEl.value = FmtDateInput(today);
}

function FmtDateInput(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function FmtDateDisplay(d) {
    if (!d) return '';
    const dt = new Date(d);
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

function normalizeListResponse(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.Data)) return data.Data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
}

function getPaymentMasterCode(p) {
    const c = p.GRNPaymentMaster_Code ?? p.Code ?? p.code ?? p.PaymentMaster_Code;
    const n = parseInt(c, 10);
    return Number.isFinite(n) ? n : 0;
}

function getEntryNo(p) {
    return p.EntryNo ?? p['PO No'] ?? p.PONo ?? p['Entry No'] ?? p.Entry_No ?? p.DocNo ?? p.MRNNo ?? '—';
}

function getPartyName(p) {
    return p['Party Name'] ?? p.PartyName ?? p.VendorName ?? p.AccountName ?? p.Vendor ?? '—';
}

function getEntryDate(p) {
    return p.EntryDate ?? p['PO Date'] ?? p['Entry Date'] ?? p.PaymentDate ?? p.DocDate ?? '';
}

function getTotalAmount(p) {
    const v = p.Amount ?? p['Total Amount'] ?? p.TotalAmount ?? p.NetPayable ?? p.PaymentAmount ?? p['Total Bill Amount'] ?? 0;
    return v;
}

function levelRowIsApproved(lvl) {
    if (!lvl || typeof lvl !== 'object') return false;
    const on = lvl.ApprovedOn ?? lvl.Approved_Date ?? lvl.ApprovedDate ?? lvl.ApprovedOnDate;
    if (on != null && String(on).trim() !== '') return true;
    const st = (lvl.Status ?? lvl.ApprovalStatus ?? lvl.IsApproved ?? '').toString().trim().toLowerCase();
    return st === 'y' || st === 'approved' || st === '1' || st === 'true';
}

/** When master Status lags the API, infer from per-level rows (all levels 1..TotalLevels approved). */
function allLevelsApprovedFromDetails(p) {
    const total = parseInt(p.TotalLevels ?? p.MaxLevel ?? 0, 10) || 0;
    if (total < 1) return false;
    const levels = Array.isArray(p.LevelDetails) ? p.LevelDetails : [];
    if (!levels.length) return false;
    for (let i = 1; i <= total; i++) {
        const lvl = levels.find(function (l) {
            const n = parseInt(l.LevelNo ?? l.Level ?? l.LevelOrder ?? 0, 10);
            return n === i;
        });
        if (!levelRowIsApproved(lvl)) return false;
    }
    return true;
}

function getApprovalStatus(p) {
    const raw = (p.ApprovalStatus ?? p.Status ?? p.Approval_Status ?? '').toString().trim();
    const upper = raw.toUpperCase();
    const lower = raw.toLowerCase();

    // Matches SQL: CASE WHEN pom.Status = 'P' THEN 'Approved' WHEN pom.Status = 'R' THEN 'Rejected' ELSE 'Pending'
    if (upper === 'R' || lower === 'rejected') return 'Rejected';
    if (upper === 'P' || raw === 'Y' || lower === 'approved') return 'Approved';

    if (allLevelsApprovedFromDetails(p)) return 'Approved';

    const cur = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 0, 10) || 0;
    const tot = parseInt(p.TotalLevels ?? p.MaxLevel ?? 0, 10) || 0;
    if (tot > 0 && cur > tot) return 'Approved';

    if (raw === '' || raw === 'N' || upper === 'U' || lower === 'pending') return 'Pending';
    if (
        lower === 'complete' || lower === 'completed' ||
        lower.indexOf('fully approved') >= 0 ||
        lower.indexOf('final approved') >= 0 ||
        lower.indexOf('all approved') >= 0 ||
        (lower.indexOf('all levels') >= 0 && lower.indexOf('approved') >= 0)
    ) {
        return 'Approved';
    }

    return raw || 'Pending';
}

function getLevelCode(p) {
    const c = p.LevelCode ?? p.Level_Code ?? p.ApprovalLevel_Code ?? p.GRNPaymentLevel_Code ?? 0;
    const n = parseInt(c, 10);
    return Number.isFinite(n) ? n : 0;
}

function NormalizePaymentList(list) {
    return (list || []).map(function (row) {
        const p = { ...row };
        if (typeof p.LevelDetails === 'string') {
            try {
                p.LevelDetails = JSON.parse(p.LevelDetails);
            } catch (e) {
                p.LevelDetails = [];
            }
        }
        if (!Array.isArray(p.LevelDetails)) p.LevelDetails = [];
        if (!p.TotalLevels && p.LevelDetails.length > 0) {
            p.TotalLevels = p.LevelDetails.length;
        }
        return p;
    });
}

function LoadPaymentList() {
    const fromDate = document.getElementById('gpaFromDate')?.value || '';
    const toDate = document.getElementById('gpaToDate')?.value || '';
    const status = document.getElementById('gpaDdlStatus')?.value || 'A';

    ShowGpaLoading(true);
    ShowGpaEmpty(false);
    const container = document.getElementById('gpaPendingList');
    if (container) container.innerHTML = '';

    GRNPaymentApprovalService.GetPendingGRNPaymentList(fromDate, toDate, status)
        .then(function (data) {
            ShowGpaLoading(false);
            G_PaymentList = NormalizePaymentList(normalizeListResponse(data));
            UpdateGpaStatChips();
            RenderPaymentCards(G_PaymentList);
        })
        .catch(function (err) {
            console.error('LoadPaymentList', err);
            ShowGpaLoading(false);
            G_PaymentList = [];
            if (container) container.innerHTML = '';
            ShowGpaEmpty(true);
            if (typeof toastr !== 'undefined') {
                toastr.error('Error loading GRN payment approval list.');
            }
        });
}

function UpdateGpaStatChips() {
    const pending = G_PaymentList.filter(function (p) {
        return getApprovalStatus(p).toLowerCase() !== 'approved';
    }).length;
    const other = G_PaymentList.length - pending;
    const elP = document.getElementById('gpaStatPending');
    const elO = document.getElementById('gpaStatProcessed');
    if (elP) elP.textContent = pending > 0 ? String(pending) : (G_PaymentList.length ? '0' : '—');
    if (elO) elO.textContent = other > 0 ? String(other) : '—';
}

function RenderPaymentCards(list) {
    const container = document.getElementById('gpaPendingList');
    if (!container) return;
    if (!list || list.length === 0) {
        container.innerHTML = '';
        ShowGpaEmpty(true);
        return;
    }
    ShowGpaEmpty(false);
    container.innerHTML = list.map(function (p) { return BuildPaymentCard(p); }).join('');
}

function BuildPaymentCard(p) {
    const code = getPaymentMasterCode(p);
    const entryPlain = String(getEntryNo(p));
    const vendorPlain = String(getPartyName(p));
    const entryNo = EscHtml(entryPlain);
    const vendor = EscHtml(vendorPlain);
    const entryDate = FmtDateDisplay(getEntryDate(p));
    const amount = FmtCurrency(getTotalAmount(p));
    const totalLvl = parseInt(p.TotalLevels ?? p.MaxLevel ?? 3, 10) || 1;
    const curLvlNo = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 1, 10) || 1;
    const lvlDesc = EscHtml(p.CurrentLevelDesc ?? p.LevelDesc ?? ('Level ' + curLvlNo));
    const status = getApprovalStatus(p);

    let statusClr, statusBg;
    if (status.toLowerCase() === 'approved') { statusClr = '#059669'; statusBg = '#d1fae5'; }
    else if (status.toLowerCase() === 'rejected') { statusClr = '#dc2626'; statusBg = '#fee2e2'; }
    else { statusClr = '#d97706'; statusBg = '#fef3c7'; }

    const stepperHtml = BuildGpaCardStepper(curLvlNo, totalLvl, status);
    const isPending = status.toLowerCase() === 'pending';
    const actionBtn = isPending
        ? `<button type="button" class="btn-gpa-card-approve" onclick="OpenDetailModal(${code})">
               <i class="fa fa-check me-1"></i>Review &amp; Approve
           </button>`
        : `<button type="button" class="btn-gpa-card-view" onclick="OpenDetailModal(${code})">
               <i class="fa fa-eye me-1"></i>View Details
           </button>`;

    const searchKey = (vendorPlain + ' ' + entryPlain).toLowerCase();

    return `
    <div class="gpa-pay-card section-entry-animation" data-code="${code}" data-search="${EscHtml(searchKey)}">
        <div class="gpa-pay-card-header">
            <div class="gpa-entry-badge">
                <span style="font-size:0.6rem;font-weight:600;opacity:0.82;line-height:1;">Entry</span>
                <span style="font-weight:800;font-size:0.82rem;line-height:1.2;">${entryNo}</span>
            </div>
            <div class="gpa-pay-card-vendor">
                <div class="gpa-pay-vendor-name">
                    <i class="fa fa-building me-1" style="color:#667eea;font-size:0.72rem;"></i>${vendor}
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
                <i class="fa fa-code-branch me-1" style="color:#667eea;"></i>
                Approval Progress
            </div>
            ${stepperHtml}
        </div>
        <div class="gpa-pay-card-footer">
            ${actionBtn}
        </div>
    </div>`;
}

function BuildGpaCardStepper(currentLevel, totalLevels, status) {
    if (!totalLevels || totalLevels < 1) totalLevels = 1;
    const st = status.toLowerCase();
    let html = '<div class="gpa-stepper">';
    for (let i = 1; i <= totalLevels; i++) {
        let stepClass;
        if (st === 'approved') stepClass = 'gpa-step-done';
        else if (i < currentLevel) stepClass = 'gpa-step-done';
        else if (i === currentLevel) stepClass = st === 'rejected' ? 'gpa-step-rejected' : 'gpa-step-active';
        else stepClass = 'gpa-step-pending';

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

function FilterGpaCards(query) {
    const q = (query || '').toLowerCase().trim();
    const cards = document.querySelectorAll('.gpa-pay-card');
    let visible = 0;
    cards.forEach(function (card) {
        const match = !q || (card.dataset.search || '').includes(q);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
    });
    ShowGpaEmpty(visible === 0 && G_PaymentList.length > 0);
}

function mergeDetailIntoPayment(root, basePayment) {
    const p = { ...basePayment };
    if (Array.isArray(root)) {
        p._detailLines = root;
        return p;
    }
    const data = root?.Data ?? root?.data ?? root;
    if (!data || typeof data !== 'object') return p;
    if (Array.isArray(data)) {
        p._detailLines = data;
        return p;
    }

    const master = data.VW_GRNPaymentMaster?.GRNPaymentMaster?.[0]
        ?? data.GRNPaymentMaster?.[0]
        ?? data.GRNPaymentMaster
        ?? data.Master
        ?? data;

    if (master && typeof master === 'object') {
        Object.assign(p, master);
    }

    if (typeof p.LevelDetails === 'string') {
        try { p.LevelDetails = JSON.parse(p.LevelDetails); } catch (e) { p.LevelDetails = []; }
    }
    if (data.LevelDetails && !p.LevelDetails?.length) {
        p.LevelDetails = Array.isArray(data.LevelDetails) ? data.LevelDetails : p.LevelDetails;
    }

    const lines = data.GRNPaymentDetails ?? data.Details ?? data.BillLines ?? data.Items ?? data.Lines;
    if (Array.isArray(lines)) p._detailLines = lines;

    return p;
}

function extractDetailLines(root) {
    if (Array.isArray(root)) return root;
    const data = root?.Data ?? root?.data ?? root;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const lines = data.GRNPaymentDetails ?? data.Details ?? data.BillLines ?? data.Items ?? data.Lines;
    return Array.isArray(lines) ? lines : [];
}

/** API may return { Status, Msg } or wrap in Data/Result. */
function unwrapGpaActionResponse(res) {
    if (!res || typeof res !== 'object') return res;
    return res.Data ?? res.data ?? res.Result ?? res.result ?? res;
}

function OpenDetailModal(paymentCode) {
    var ModuleName = 'Payment Entry',
        OptionName = 'Verify',
        ShowMsg = 'Y',
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(async function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        } else {
            const code = parseInt(paymentCode, 10);
            if (!Number.isFinite(code) || code <= 0) return;

            G_CurrentPayment = G_PaymentList.find(function (p) { return getPaymentMasterCode(p) === code; }) || null;
            if (!G_CurrentPayment) {
                G_CurrentPayment = { Code: code, GRNPaymentMaster_Code: code };
            }

            const entryNo = getEntryNo(G_CurrentPayment);
            const vendor = getPartyName(G_CurrentPayment);

            $('#gpaModalEntryTitle').text('Entry# ' + entryNo);
            $('#gpaModalParty').text(vendor);
            $('#hfGpaPaymentCode').val(String(code));
            $('#hfGpaLevelCode').val(String(getLevelCode(G_CurrentPayment)));
            $('#gpaFrmRemarks').val('');

            paintModalFromPayment(G_CurrentPayment);

            $('#gpaModalItemsBody').html(
                '<tr><td colspan="6" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">' +
                '<i class="fa fa-spinner fa-spin me-1"></i>Loading\u2026</td></tr>'
            );

            $('#gpaBtnApproveAction').toggle(getApprovalStatus(G_CurrentPayment).toLowerCase() === 'pending');
            $('#gpaBtnRejectAction').toggle(getApprovalStatus(G_CurrentPayment).toLowerCase() === 'pending');

            $('#modalGpaDetail').modal({ backdrop: 'static' });
            $('#modalGpaDetail').modal('show');

            GRNPaymentApprovalService.GetGRNPaymentDetail(code)
                .then(function (res) {
                    const root = res?.Data ?? res?.data ?? res;
                    G_CurrentPayment = mergeDetailIntoPayment(res, G_CurrentPayment);
                    $('#hfGpaLevelCode').val(String(getLevelCode(G_CurrentPayment)));
                    paintModalFromPayment(G_CurrentPayment);
                    const lines = extractDetailLines(res);
                    RenderGpaModalItems(lines);
                    const st = getApprovalStatus(G_CurrentPayment);
                    const pend = st.toLowerCase() === 'pending';
                    $('#gpaBtnApproveAction').toggle(pend);
                    $('#gpaBtnRejectAction').toggle(pend);
                })
                .catch(function (err) {
                    console.error('GetGRNPaymentDetail', err);
                    $('#gpaModalItemsBody').html(
                        '<tr><td colspan="6" class="text-center py-3" style="color:#ef4444;font-size:0.82rem;">' +
                        '<i class="fa fa-exclamation-triangle me-1"></i>Error loading bill lines.</td></tr>'
                    );
                });
        }
    });
   
}

function paintModalFromPayment(po) {
    const entryNo = EscHtml(getEntryNo(po));
    const vendor = EscHtml(getPartyName(po));
    const entryDate = EscHtml(FmtDateDisplay(getEntryDate(po)) || '—');
    const amount = FmtCurrency(getTotalAmount(po));
    const curLvlNo = parseInt(po.CurrentLevelNo ?? po.CurrentLevel ?? 1, 10) || 1;
    const totalLvl = parseInt(po.TotalLevels ?? po.MaxLevel ?? 3, 10) || 1;
    const status = EscHtml(getApprovalStatus(po));

    $('#gpaModalHeader').html(
        '<div class="gpa-info-grid">' +
            BuildGpaInfoItem('Entry Number', entryNo, 'fa-file-invoice') +
            BuildGpaInfoItem('Party', vendor, 'fa-building') +
            BuildGpaInfoItem('Entry Date', entryDate, 'fa-calendar-alt') +
            BuildGpaInfoItem('Amount', amount, 'fa-rupee-sign', '#667eea') +
            BuildGpaInfoItem('Current Level', 'Level ' + curLvlNo + ' of ' + totalLvl, 'fa-layer-group') +
            BuildGpaInfoItem('Status', status, 'fa-info-circle') +
        '</div>'
    );

    $('#gpaModalApprovalStepper').html(BuildGpaDetailStepper(po));
}

function BuildGpaInfoItem(label, value, icon, valueColor) {
    const clr = valueColor ? 'style="color:' + valueColor + ';font-weight:800;"' : '';
    return '<div class="gpa-info-item">' +
        '<span class="gpa-info-lbl"><i class="fa ' + icon + ' me-1"></i>' + label + '</span>' +
        '<span class="gpa-info-val" ' + clr + '>' + value + '</span>' +
        '</div>';
}

function BuildGpaDetailStepper(po) {
    const curLvlNo = parseInt(po.CurrentLevelNo ?? po.CurrentLevel ?? 1, 10) || 1;
    const totalLvl = parseInt(po.TotalLevels ?? po.MaxLevel ?? 3, 10) || 1;
    const status = getApprovalStatus(po);
    const st = status.toLowerCase();
    const levels = Array.isArray(po.LevelDetails) ? po.LevelDetails : [];

    let html = '<div class="gpa-detail-stepper">';
    for (let i = 1; i <= totalLvl; i++) {
        const lvlInfo = levels.find(function (l) {
            return (l.LevelNo ?? l.Level ?? l.LevelOrder) == i;
        }) || {};
        const lvlName = EscHtml(lvlInfo.LevelDesc ?? lvlInfo.LevelName ?? ('Level ' + i));
        const approver = EscHtml(lvlInfo.ApproverName ?? lvlInfo.UserName ?? '');
        const approvedOn = lvlInfo.ApprovedOn ? FmtDateDisplay(lvlInfo.ApprovedOn) : '';

        let stepState;
        if (st === 'approved' || i < curLvlNo) stepState = 'done';
        else if (i === curLvlNo) stepState = st === 'rejected' ? 'rejected' : 'active';
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
            (approvedOn ? ' &mdash; ' + approvedOn : '') + '</div>'
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

function RenderGpaModalItems(items) {
    const $body = $('#gpaModalItemsBody');
    if (!items || items.length === 0) {
        $body.html(
            '<tr><td colspan="6" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No bill lines found.</td></tr>'
        );
        return;
    }
    let html = '';
    items.forEach(function (row, idx) {
        const billNo = EscHtml(row.BillNo ?? row.billNo ?? row.MRNNo ?? row.Name ?? '—');
        const bdt = FmtDateDisplay(row.BillDate ?? row['Bill Date'] ?? row.billDate ?? row.ReceiveDate ?? row.receiveDate ?? '');
        const totalBill = FmtCurrency(row.BillAmount ?? row.billAmount ?? row.TotalBillAmountManual ?? row.Amount ?? 0);
        const netNum = parseFloat(row.PayableAmount ?? row.payableAmount ?? row.NetPayable ?? row.netPayable ??
            row.BillAmount ?? row.billAmount ?? row.Amount ?? 0);
        const payRaw = row.PaymentAmount ?? row['Payment Amount'] ?? row.paymentAmount ?? row.PayAmount;
        const payNum = (payRaw !== undefined && payRaw !== null && payRaw !== '')
            ? parseFloat(payRaw)
            : netNum;
        const netPay = FmtCurrency(netNum);
        const payAmt = FmtCurrency(payNum);
        html += '<tr>' +
            '<td class="text-center" style="color:#94a3b8;">' + (idx + 1) + '</td>' +
            '<td style="font-weight:600;">' + billNo + '</td>' +
            '<td class="text-center">' + EscHtml(bdt || '—') + '</td>' +
            '<td class="text-end">' + totalBill + '</td>' +
            '<td class="text-end">' + netPay + '</td>' +
            '<td class="text-end" style="font-weight:700;color:#667eea;">' + payAmt + '</td>' +
            '</tr>';
    });
    $body.html(html);
}

function SubmitApproval(action) {
    const poCode = parseInt($('#hfGpaPaymentCode').val() || '0', 10);
    const levelCode = parseInt($('#hfGpaLevelCode').val() || '0', 10);
    const remarks = ($('#gpaFrmRemarks').val() || '').trim();

    if (!poCode) {
        if (typeof toastr !== 'undefined') toastr.warning('No payment entry selected.');
        return;
    }
    if (action === 'Reject' && !remarks) {
        if (typeof toastr !== 'undefined') toastr.warning('Please enter remarks before rejecting.');
        $('#gpaFrmRemarks').trigger('focus');
        return;
    }

    const entryLabel = G_CurrentPayment ? String(getEntryNo(G_CurrentPayment)) : '';
    const isAppr = action === 'Approve';
    const hdrBg = isAppr
        ? 'background:linear-gradient(135deg,#059669,#10b981);color:#fff;'
        : 'background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;';
    const btnCls = isAppr ? 'btn-gpa-confirm-approve' : 'btn-gpa-confirm-reject';
    const btnTxt = isAppr
        ? '<i class="fa fa-check me-1"></i>Yes, Approve'
        : '<i class="fa fa-times me-1"></i>Yes, Reject';
    const msg = isAppr
        ? 'Are you sure you want to <strong>approve</strong> entry# <strong>' + EscHtml(entryLabel) + '</strong>?'
        : 'Are you sure you want to <strong>reject</strong> entry# <strong>' + EscHtml(entryLabel) + '</strong>?';

    $('#gpaConfirmTitle').text(isAppr ? 'Confirm Approval' : 'Confirm Rejection');
    $('#gpaConfirmModalHeader').attr('style', 'padding:12px 16px;border:none;' + hdrBg);
    $('#gpaConfirmMessage').html(msg);
    $('#gpaBtnConfirmAction')
        .attr('class', btnCls)
        .html(btnTxt)
        .off('click')
        .on('click', function () { ExecuteGpaApproval(poCode, levelCode, remarks, action); });

    $('#modalGpaConfirm').modal('show');
}

function ExecuteGpaApproval(paymentCode, levelCode, remarks, action) {
    CloseConfirmModal();

    if (typeof Showloader === 'function') Showloader();

    const serviceCall = action === 'Approve'
        ? GRNPaymentApprovalService.ApproveGRNPayment(paymentCode, levelCode, remarks)
        : GRNPaymentApprovalService.RejectGRNPayment(paymentCode, levelCode, remarks);

    serviceCall
        .then(function (response) {
            if (typeof HideLoader === 'function') HideLoader();
            const payload = unwrapGpaActionResponse(response) || response;
            const st = payload && (payload.Status ?? payload.status);
            const ok = payload && (
                st === 'Y' || st === 'Success' || st === 'success' ||
                payload.Success === true || payload.success === true || response === true
            );
            if (ok) {
                const serverMsg = (payload.Msg || payload.Message || payload.message || '').trim();
                if (typeof toastr !== 'undefined') {
                    toastr.success(serverMsg || ('Payment entry ' + (action === 'Approve' ? 'approved' : 'rejected') + ' successfully.'));
                }
                CloseDetailModal();
                LoadPaymentList();
            } else {
                const msg = (payload && (payload.Msg || payload.Message || payload.message)) ||
                    ('Failed to ' + action.toLowerCase() + ' payment entry.');
                if (typeof toastr !== 'undefined') toastr.error(msg);
            }
        })
        .catch(function () {
            if (typeof HideLoader === 'function') HideLoader();
            if (typeof toastr !== 'undefined') {
                toastr.error('Error while ' + (action === 'Approve' ? 'approving' : 'rejecting') + ' payment entry.');
            }
        });
}

function CloseDetailModal() {
    $('#modalGpaDetail').modal('hide');
    G_CurrentPayment = null;
}

function CloseConfirmModal() {
    $('#modalGpaConfirm').modal('hide');
}

function ShowGpaLoading(show) {
    const loadEl = document.getElementById('gpaPendingLoading');
    const listEl = document.getElementById('gpaPendingList');
    if (loadEl) loadEl.style.display = show ? '' : 'none';
    if (listEl) listEl.style.display = show ? 'none' : '';
}

function ShowGpaEmpty(show) {
    const el = document.getElementById('gpaPendingEmpty');
    if (el) el.style.display = show ? '' : 'none';
}

function NavigateToGRNService() {
    const appBase = (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/'))
        .replace(/\/?$/, '/');
    window.location.href = appBase + 'PurchaseTransactions/GRNPaymentApproval/GRNPaymentApproval?ModuleDesp=Payment%20Entry';
}

document.addEventListener('DOMContentLoaded', function () {
    InitDates();
    LoadPaymentList();

    const searchEl = document.getElementById('gpaLstSearch');
    if (searchEl) {
        searchEl.addEventListener('input', function () {
            FilterGpaCards(this.value);
        });
    }
});

window.LoadPaymentList = LoadPaymentList;
window.OpenDetailModal = OpenDetailModal;
window.SubmitApproval = SubmitApproval;
window.CloseDetailModal = CloseDetailModal;
window.CloseConfirmModal = CloseConfirmModal;
window.NavigateToGRNService = NavigateToGRNService;
