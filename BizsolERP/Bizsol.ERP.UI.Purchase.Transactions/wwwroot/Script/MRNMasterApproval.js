import { MRNMasterApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MRNMasterApprovalService.js';
import { AttachmentControlService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_AttachmentControlService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

/** Set by GRNService.navigateToMRNMasterApprovalPendingOnMe before redirect */
const MRN_LANDING_PENDING_ON_ME_KEY = 'bizsol_mrnLandingPendingOnMe';
/** Set by GRNService.saveGRN after successful update — approval list reloads when view opens */
const MRN_APPROVAL_REFRESH_KEY = 'bizsol_mrnApprovalRefresh';

let G_PaymentList = [];
let G_CurrentPayment = null;
let G_OnlyPendingOnMe = false;
let G_LoadPaymentListSeq = 0;
/** When true, detail modal is read-only (opened from GRN list View). */
let G_GpaModalViewOnly = false;

BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');

function InitDates(forceRefresh) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const fromEl = document.getElementById('gpaFromDate');
    const toEl = document.getElementById('gpaToDate');
    if (toEl) toEl.value = FmtDateInput(today);

    if (!fromEl) {
        return Promise.resolve();
    }
    if (fromEl.value && !forceRefresh) {
        return Promise.resolve();
    }

    return MRNMasterApprovalService.GetFirstPendingBillDate()
        .then(function (result) {
            let dateVal = null;
            if (Array.isArray(result) && result.length > 0) {
                const row = result[0];
                dateVal = row.FirstPendingBillDate ?? row.firstPendingBillDate ?? row.Data ?? row.data ?? null;
            } else if (result && result.FirstPendingBillDate) dateVal = result.FirstPendingBillDate;
            else if (result && result.Data) dateVal = result.Data;
            else if (result && result.data) dateVal = result.data;
            else if (typeof result === 'string' || result instanceof Date) dateVal = result;

            if (dateVal) {
                const parsed = new Date(dateVal);
                if (!isNaN(parsed.getTime())) {
                    fromEl.value = FmtDateInput(parsed);
                    return;
                }
            }
            fromEl.value = FmtDateInput(firstDay);
        })
        .catch(function () {
            fromEl.value = FmtDateInput(firstDay);
        });
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
    const c = p.MRNMaster_Code ?? p.mRNMaster_Code ?? p.Code ?? p.code;
    const n = parseInt(c, 10);
    return Number.isFinite(n) ? n : 0;
}

function getEntryNo(p) {
    if (!p) return '—';
    const v = p.BillNo ?? p.billNo ?? p.EntryNo ?? p['Entry No'] ?? p.Entry_No
        ?? p['PO No'] ?? p.PONo ?? p.DocNo ?? '';
    const s = v !== null && v !== undefined ? String(v).trim() : '';
    return s || '—';
}

function getMrnNo(p) {
    if (!p) return '—';
    const v = p.MRNNo ?? p.mRNNo ?? p['MRN No'] ?? p['MRN NO'] ?? p.MRN_No ?? p.mrnNo
        ?? p.GRNo ?? p.grnNo ?? p.GRNNo ?? p.grNNo ?? '';
    const s = v !== null && v !== undefined ? String(v).trim() : '';
    if (s && s !== '0') return s;
    return '—';
}

function resolveMrnNoFromGrnList(p) {
    if (!p) return '';
    const code = getPaymentMasterCode(p);
    if (!code) return '';
    const rows = window.grnMasterSourceRows;
    if (!Array.isArray(rows) || !rows.length) return '';
    const row = rows.find(function (r) {
        const c = parseInt(r.Code ?? r.code ?? r.MRNMaster_Code ?? r.mRNMaster_Code ?? 0, 10);
        return c === code;
    });
    if (!row) return '';
    const mrn = getMrnNo(row);
    return mrn !== '—' ? mrn : '';
}

function enrichPaymentMrnNo(p) {
    if (!p || typeof p !== 'object') return p;
    if (getMrnNo(p) !== '—') return p;
    const fromList = resolveMrnNoFromGrnList(p);
    if (!fromList) return p;
    p.MRNNo = fromList;
    p.mRNNo = fromList;
    return p;
}

function enrichPaymentListMrnNos(list) {
    return (list || []).map(enrichPaymentMrnNo);
}

function formatMrnDisplayNo(p) {
    if (!p) return '—';
    let mrn = getMrnNo(p);
    if (mrn === '—') {
        const fromList = resolveMrnNoFromGrnList(p);
        if (fromList) mrn = fromList;
    }
    return mrn !== '—' ? mrn : '—';
}

function getPartyName(p) {
    return p.AccountDesp ?? p['Party Name'] ?? p.PartyName ?? p.VendorName ?? p.AccountName ?? p.Vendor ?? '—';
}

function getEntryDate(p) {
    if (!p) return '';
    return p.GRDate ?? p.grDate ?? p['Entry Date'] ?? p.ReceiveDate ?? p.receiveDate
        ?? p.BillDate ?? p.billDate ?? p.EntryDate ?? p.entryDate ?? p.DocDate ?? '';
}

function getTotalAmount(p) {
    if (!p) return 0;
    const v = p.TotalBillAmountManual ?? p.totalBillAmountManual ?? p.NetPayable ?? p.netPayable
        ?? p.Amount ?? p.amount ?? p['Total Bill Amount'] ?? p['Total Amount'] ?? p.TotalAmount ?? 0;
    return v;
}

function mrnProjectLabelFromRow(r) {
    if (!r || typeof r !== 'object') return '';
    let v = r.ProjectDesp ?? r.projectDesp ?? r.Project ?? r.project ?? r.ProjectName ?? r.projectName ?? '';
    if (!`${v}`.trim()) {
        const pm = r.ProjectMaster ?? r.projectMaster;
        if (pm && typeof pm === 'object') {
            v = pm.ProjectDesp ?? pm.projectDesp ?? pm.ProjectName ?? pm.projectName ?? pm.Name ?? pm.name ?? '';
        }
    }
    return `${v ?? ''}`.trim();
}

function mrnSubProjectLabelFromRow(r) {
    if (!r || typeof r !== 'object') return '';
    let v = r.SubProjectDesp ?? r.subProjectDesp ?? r.SubProject ?? r.subProject ?? r.SubProjectName ?? r.subProjectName ?? '';
    if (!`${v}`.trim()) {
        const sm = r.SubProjectMaster ?? r.subProjectMaster;
        if (sm && typeof sm === 'object') {
            v = sm.SubProjectDesp ?? sm.subProjectDesp ?? sm.SubProjectName ?? sm.subProjectName ?? sm.Name ?? sm.name ?? '';
        }
    }
    return `${v ?? ''}`.trim();
}

function mrnProjectLabelFromPayment(p) {
    if (!p || typeof p !== 'object') return '';
    let v = p.Project ?? p.ProjectDesp ?? p.projectDesp ?? p.ProjectName ?? p.projectName ?? '';
    if (!`${v}`.trim()) v = mrnProjectLabelFromRow(p);
    return `${v ?? ''}`.trim();
}

function mrnSubProjectLabelFromPayment(p) {
    if (!p || typeof p !== 'object') return '';
    let v = p.SubProject ?? p.SubProjectDesp ?? p.subProjectDesp ?? p.SubProjectName ?? p.subProjectName ?? '';
    if (!`${v}`.trim()) v = mrnSubProjectLabelFromRow(p);
    return `${v ?? ''}`.trim();
}

function firstMrnDetailLineFromPayment(p) {
    if (!p) return null;
    const arr = p._detailLines;
    if (Array.isArray(arr) && arr.length && arr[0] && typeof arr[0] === 'object') return arr[0];
    return null;
}

function getProject(p) {
    if (!p) return '';
    let v = mrnProjectLabelFromPayment(p);
    if (!v) {
        const d = firstMrnDetailLineFromPayment(p);
        if (d) v = mrnProjectLabelFromRow(d);
    }
    return v;
}

function getSubProject(p) {
    if (!p) return '';
    let v = mrnSubProjectLabelFromPayment(p);
    if (!v) {
        const d = firstMrnDetailLineFromPayment(p);
        if (d) v = mrnSubProjectLabelFromRow(d);
    }
    return v;
}

function mrnIsDetailRow(r) {
    if (!r || typeof r !== 'object') return false;
    return r.PONo != null || r.pONo != null || r.PurchaseOrderMaster_Code != null || r.purchaseOrderMaster_Code != null
        || r.ItemMaster_Code != null || r.itemMaster_Code != null || r.ItemName != null || r.itemName != null
        || r.Qty != null || r.qty != null || r.QtyMT != null || r.qtyMT != null
        || r.Amount != null || r.amount != null || r.GRDate != null || r.grDate != null;
}

function mrnScanDetailArraysInObject(obj) {
    if (!obj || typeof obj !== 'object') return [];
    if (Array.isArray(obj)) return obj.length && mrnIsDetailRow(obj[0]) ? obj : [];
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        const arr = obj[keys[i]];
        if (Array.isArray(arr) && arr.length && mrnIsDetailRow(arr[0])) return arr;
    }
    return [];
}

function peelMrnApprovalApiRoot(res) {
    let root = res?.Data ?? res?.data ?? res;
    if (!root || typeof root !== 'object') return root;
    if (!root.MRNMaster && !root.mRNMaster && !root.GRNServiceList && !root.grnServiceList && !root.VW_MRNMaster) {
        const inner = root.Data ?? root.data;
        if (inner && typeof inner === 'object') root = inner;
    }
    return root;
}

function firstMrnMasterFromApi(data) {
    if (!data || typeof data !== 'object') return null;
    if (Array.isArray(data)) return data.length ? data[0] : null;
    const vw = data.VW_MRNMaster ?? data.vw_MRNMaster;
    const list = data.MRNMaster ?? data.mRNMaster
        ?? data.GRNServiceList ?? data.grnServiceList
        ?? vw?.MRNMaster ?? vw?.mRNMaster
        ?? vw?.GRNServiceList ?? vw?.grnServiceList;
    if (Array.isArray(list) && list.length) return list[0];
    if (list && typeof list === 'object' && !Array.isArray(list)) return list;
    if (vw && typeof vw === 'object' && (vw.BillNo != null || vw.MRNNo != null || vw.AccountDesp != null)) return vw;
    if (data.BillNo != null || data.MRNNo != null || data.AccountDesp != null) return data;
    return null;
}

function enrichMrnHeaderFromDetailLines(payment, lines) {
    if (!payment) return payment;
    if (Array.isArray(lines) && lines.length) payment._detailLines = lines;

    const entryNo = getEntryNo(payment);
    if (!entryNo || entryNo === '—') {
        const billNo = payment.BillNo ?? payment.billNo;
        const mrnNo = payment.MRNNo ?? payment.mRNNo;
        if (billNo != null && `${billNo}`.trim() !== '') payment.BillNo = billNo;
        else if (mrnNo != null && `${mrnNo}`.trim() !== '') payment.MRNNo = mrnNo;
    }

    if (!getEntryDate(payment)) {
        const d0 = firstMrnDetailLineFromPayment(payment);
        const lineDate = d0 ? (d0.GRDate ?? d0.grDate ?? d0['Entry Date'] ?? d0.ReceiveDate ?? d0.receiveDate) : '';
        if (lineDate) payment.GRDate = lineDate;
        else if (payment.BillDate ?? payment.billDate) payment.ReceiveDate = payment.BillDate ?? payment.billDate;
    }

    const amtNum = parseFloat(getTotalAmount(payment));
    if (isNaN(amtNum) || amtNum === 0) {
        const masterAmt = payment.TotalBillAmountManual ?? payment.totalBillAmountManual
            ?? payment.NetPayable ?? payment.netPayable;
        if (masterAmt != null && parseFloat(masterAmt) !== 0) {
            payment.TotalBillAmountManual = masterAmt;
        } else if (Array.isArray(lines) && lines.length) {
            let sum = 0;
            lines.forEach(function (r) { sum += mrnResolveLineAmount(r); });
            if (sum > 0) payment.Amount = sum;
        }
    }

    if (Array.isArray(lines) && lines.length) {
        const d0 = lines[0];
        const proj = mrnProjectLabelFromRow(d0);
        const sub = mrnSubProjectLabelFromRow(d0);
        if (proj) payment.Project = proj;
        if (sub) payment.SubProject = sub;
    }

    return payment;
}

function mrnResolveLineAmount(row) {
    if (!row || typeof row !== 'object') return 0;
    const amtRaw = row.Amount ?? row.amount;
    if (amtRaw !== null && amtRaw !== undefined && `${amtRaw}`.trim() !== '') {
        const n = parseFloat(String(amtRaw).replace(/,/g, ''));
        if (!isNaN(n)) return n;
    }
    const rateRaw = row.Rate ?? row.rate;
    if (rateRaw !== null && rateRaw !== undefined && `${rateRaw}`.trim() !== '') {
        const r = parseFloat(String(rateRaw).replace(/,/g, ''));
        if (!isNaN(r)) return r;
    }
    return 0;
}

function mrnPickRowField(row, names) {
    if (!row || typeof row !== 'object') return '';
    let i;
    for (i = 0; i < names.length; i++) {
        const v = row[names[i]];
        if (v !== null && v !== undefined && `${v}`.trim() !== '') return v;
    }
    const keys = Object.keys(row);
    for (i = 0; i < names.length; i++) {
        const want = names[i].toLowerCase();
        for (let j = 0; j < keys.length; j++) {
            if (keys[j].toLowerCase() === want) {
                const v = row[keys[j]];
                if (v !== null && v !== undefined && `${v}`.trim() !== '') return v;
            }
        }
    }
    return '';
}

function mrnResolveItemName(row) {
    if (!row || typeof row !== 'object') return '';
    const v = mrnPickRowField(row, [
        'ItemName', 'itemName', 'Item_Name', 'item_name', 'Item Desp', 'ItemDesp', 'itemDesp',
        'Description', 'description', 'ServiceName', 'serviceName',
    ]);
    if (`${v}`.trim() !== '') return `${v}`.trim();
    const code = mrnPickRowField(row, ['ItemMaster_Code', 'itemMaster_Code', 'ItemMasterCode', 'itemMasterCode']);
    return code !== '' ? String(code) : '';
}

function mrnResolveLineQty(row) {
    if (!row || typeof row !== 'object') return '';
    const v = mrnPickRowField(row, [
        'Qty', 'qty', 'QtyMT', 'qtyMT', 'Qty_Mt', 'qty_Mt',
        'QtyBill', 'qtyBill', 'Quantity', 'quantity',
    ]);
    if (v === null || v === undefined || `${v}`.trim() === '') return '';
    return String(v).trim();
}

function mrnNormalizeDetailLines(lines, master) {
    const m = master || {};
    const masterBillNo = m.BillNo ?? m.billNo ?? '';
    return (lines || []).map(function (row) {
        if (!row || typeof row !== 'object') return row;
        const itemName = mrnResolveItemName(row);
        const qty = mrnResolveLineQty(row);
        const billNo = mrnPickRowField(row, ['BillNo', 'billNo']) || masterBillNo || '';
        return Object.assign({}, row, {
            BillNo: billNo,
            ItemName: itemName,
            itemName: itemName,
            Qty: qty !== '' ? qty : (row.Qty ?? row.QtyMT ?? row.QtyBill ?? ''),
            qty: qty !== '' ? qty : (row.qty ?? row.qtyMT ?? row.qtyBill ?? ''),
        });
    });
}

function ensureGpaModalItemsTableHead() {
    const $body = $('#gpaModalItemsBody');
    if (!$body.length) return;
    const $table = $body.closest('table');
    if (!$table.length) return;
    let $thead = $table.children('thead');
    if (!$thead.length) {
        $table.prepend('<thead></thead>');
        $thead = $table.children('thead');
    }
    $thead.html(
        '<tr>' +
            '<th style="width:40px;">#</th>' +
            '<th>Bill no</th>' +
            '<th style="width:90px;">PO no</th>' +
            '<th>Item</th>' +
            '<th style="width:120px;">Qty</th>' +
            '<th style="width:120px;">Amount</th>' +
        '</tr>'
    );
}

function levelRowIsApproved(lvl) {
    if (!lvl || typeof lvl !== 'object') return false;
    const on = lvl.ApprovedOn ?? lvl.Approved_Date ?? lvl.ApprovedDate ?? lvl.ApprovedOnDate;
    if (on != null && String(on).trim() !== '') return true;
    const st = (lvl.Status ?? lvl.ApprovalStatus ?? lvl.IsApproved ?? '').toString().trim().toLowerCase();
    return st === 'y' || st === 'approved' || st === '1' || st === 'true';
}

function allLevelsApprovedFromDetails(p) {
    const total = parseInt(p.TotalLevels ?? p.MaxLevel ?? 0, 10) || 0;
    if (total < 1) return false;
    const levels = parseLevelDetailsToArray(p.LevelDetails);
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
    // MRN master: backend stores rejected as Status 'N' (not approved); 'R' / text also supported
    if (upper === 'R' || upper === 'N' || lower === 'rejected') return 'Rejected';
    if (upper === 'P' || raw === 'Y' || lower === 'approved') return 'Approved';
    if (allLevelsApprovedFromDetails(p)) return 'Approved';
    const cur = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 0, 10) || 0;
    const tot = parseInt(p.TotalLevels ?? p.MaxLevel ?? 0, 10) || 0;
    if (tot > 0 && cur > tot) return 'Approved';
    if (raw === '' || upper === 'U' || lower === 'pending') return 'Pending';
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

function getGpaCardLevelChipLabel(p) {
    const status = getApprovalStatus(p);
    const st = status.toLowerCase();
    if (st === 'approved') return 'Approved';
    if (st === 'rejected') return 'Rejected';
    const totalLvl = parseInt(p.TotalLevels ?? p.MaxLevel ?? 1, 10) || 1;
    let cur = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 1, 10) || 1;
    if (cur < 1) cur = 1;
    if (totalLvl > 0 && cur > totalLvl) return 'Approved';
    const masterDesc = String(p.CurrentLevelDesc ?? '').trim();
    if (masterDesc) return masterDesc;
    const row = getCurrentLevelRowForGpa(p);
    const rowDesc = row ? pickLevelRowTitleText(row) : '';
    if (rowDesc) return rowDesc;
    return 'L' + cur;
}

function getLevelCode(p) {
    const c = p.LevelCode ?? p.Level_Code ?? p.ApprovalLevel_Code ?? p.MRNMasterLevel_Code ?? p.GRNPaymentLevel_Code ?? 0;
    let n = parseInt(c, 10);
    if (Number.isFinite(n) && n > 0) return n;
    const lvl = getCurrentLevelRowForGpa(p);
    if (lvl && typeof lvl === 'object') {
        const fromRow = pickFirstPositiveInt(lvl, [
            'Code', 'MRNMasterLevel_Code', 'MRNMaster_Level_Code', 'LevelCode', 'Level_Code',
            'ApprovalLevel_Code', 'ConfigLevel_Code', 'GRNPaymentLevel_Code',
            'MRNMasterApprovalLevel_Code', 'LevelMaster_Code'
        ]);
        if (fromRow > 0) return fromRow;
    }
    return Number.isFinite(n) ? n : 0;
}
function getSessionUserMasterCodeGpa() {
    try {
        const a = JSON.parse(sessionStorage.getItem('authKey'));
        return parseInt(a && a.UserMaster_Code, 10) || 0;
    } catch (e) {
        return 0;
    }
}

function getSessionGroupMasterCodeGpa() {
    try {
        const d = JSON.parse(sessionStorage.getItem('UserDetails'));
        if (Array.isArray(d) && d[0] != null) {
            return parseInt(d[0].GroupMaster_Code, 10) || 0;
        }
    } catch (e) { /* ignore */ }
    return 0;
}

function pickFirstPositiveInt(obj, keys) {
    if (!obj || typeof obj !== 'object') return 0;
    for (let i = 0; i < keys.length; i++) {
        const v = obj[keys[i]];
        if (v == null || v === '') continue;
        const n = parseInt(v, 10);
        if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
}

function getCurrentLevelRowForGpa(p) {
    const cur = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 1, 10) || 1;
    const levels = parseLevelDetailsToArray(p.LevelDetails);
    const row = levels.find(function (l) {
        return levelNoFromRow(l) === cur;
    });
    if (row) return row;
    if (levels.length && cur >= 1 && cur <= levels.length) return levels[cur - 1];
    return null;
}

function truthyFlagGpa(v) {
    if (v === true || v === 1) return true;
    const s = (v != null ? String(v) : '').trim().toLowerCase();
    return s === 'y' || s === '1' || s === 'true';
}

function paymentIsPendingOnMe(p) {
    if (getApprovalStatus(p).toLowerCase() !== 'pending') return false;
    if (truthyFlagGpa(p.IsPendingForMe) || truthyFlagGpa(p.PendingForMe) || truthyFlagGpa(p.CanApproveNow)
        || truthyFlagGpa(p.IsMyApproval) || truthyFlagGpa(p.PendingOnMe)) {
        return true;
    }
    const me = getSessionUserMasterCodeGpa();
    const myG = getSessionGroupMasterCodeGpa();
    const lvl = getCurrentLevelRowForGpa(p);
    const ru = pickFirstPositiveInt(lvl, [
        'UserMaster_Code', 'userMaster_Code', 'ApproverUserMaster_Code', 'ApproverUser_Code',
        'AssignedUserMaster_Code', 'ApprovalUserMaster_Code', 'Approver_Code'
    ]);
    const rg = pickFirstPositiveInt(lvl, [
        'GroupMaster_Code', 'groupMaster_Code', 'ApproverGroupMaster_Code',
        'AssignedGroupMaster_Code', 'ApprovalGroupMaster_Code'
    ]);
    if (me > 0 && ru > 0 && ru === me) return true;
    if (myG > 0 && rg > 0 && rg === myG) return true;
    const mu = pickFirstPositiveInt(p, [
        'CurrentApproverUserMaster_Code', 'ApproverUserMaster_Code', 'NextApproverUserMaster_Code',
        'PendingApproverUserMaster_Code'
    ]);
    const mg = pickFirstPositiveInt(p, [
        'CurrentApproverGroupMaster_Code', 'ApproverGroupMaster_Code', 'NextApproverGroupMaster_Code',
        'PendingApproverGroupMaster_Code'
    ]);
    if (me > 0 && mu > 0 && mu === me) return true;
    if (myG > 0 && mg > 0 && mg === myG) return true;
    const hasAssignee = (ru + rg + mu + mg) > 0;
    if (!hasAssignee) {
        return true;
    }
    return false;
}

function getFilteredPaymentListForRender() {
    if (!G_OnlyPendingOnMe) return G_PaymentList;
    return G_PaymentList.filter(paymentIsPendingOnMe);
}

function syncGpaPendingOnMeChipActive() {
    const chip = document.getElementById('gpaStatChipPendingOnMe');
    if (chip) {
        chip.classList.toggle('gpa-stat-chip--onme-active', !!G_OnlyPendingOnMe);
    }
}

function getLevelRowRemarks(lvlInfo) {
    if (!lvlInfo || typeof lvlInfo !== 'object') return '';
    const r = lvlInfo.Remarks ?? lvlInfo.Remark ?? lvlInfo.ApprovalRemarks ?? lvlInfo.LevelRemarks
        ?? lvlInfo.Comments ?? lvlInfo.RejectionRemarks;
    const s = r != null ? String(r).trim() : '';
    return s;
}

function pickLevelRowTitleText(lvlInfo) {
    if (!lvlInfo || typeof lvlInfo !== 'object') return '';
    const c = lvlInfo.Description ?? lvlInfo.description
        ?? lvlInfo.LevelDesc ?? lvlInfo.LevelDesp
        ?? lvlInfo.LevelName ?? lvlInfo.levelName;
    const s = c != null ? String(c).trim() : '';
    return s;
}

function getLevelRowDisplayTitle(lvlInfo, levelNo) {
    const t = pickLevelRowTitleText(lvlInfo);
    if (t) return t;
    return 'Level ' + levelNo;
}

function parseLevelDetailsToArray(v) {
    if (Array.isArray(v)) return v;
    if (v == null) return [];
    if (typeof v === 'string') {
        const t = v.trim();
        if (!t) return [];
        try {
            const j = JSON.parse(t);
            return Array.isArray(j) ? j : [];
        } catch (e) {
            return [];
        }
    }
    return [];
}

function levelNoFromRow(r) {
    const n = parseInt(r.LevelNo ?? r.Level ?? r.LevelOrder ?? 0, 10);
    return Number.isFinite(n) ? n : 0;
}

function mergeLevelDetailsLists(fromList, fromApi) {
    const a = Array.isArray(fromList) ? fromList : [];
    const b = Array.isArray(fromApi) ? fromApi : [];
    if (!b.length) return a.slice();
    if (!a.length) return b.slice();

    const map = new Map();
    a.forEach(function (row) {
        const n = levelNoFromRow(row);
        if (n > 0) map.set(n, { ...row });
    });
    b.forEach(function (row) {
        const n = levelNoFromRow(row);
        if (n < 1) return;
        const prev = map.get(n) || {};
        const next = { ...prev, ...row };
        next.LevelDesc = pickLevelRowTitleText(row) || pickLevelRowTitleText(prev)
            || row.LevelDesc || prev.LevelDesc || row.LevelName || prev.LevelName || '';
        next.Remarks = getLevelRowRemarks(row) || getLevelRowRemarks(prev) || '';

        const hasApprover = (x) => x && String(x.ApproverName ?? x.UserName ?? '').trim() !== '';
        if (!hasApprover(row) && hasApprover(prev)) {
            next.ApproverName = prev.ApproverName;
            next.UserName = prev.UserName;
        }
        const hasDate = (x) => x && String(x.ApprovedOn ?? '').trim() !== '';
        if (!hasDate(row) && hasDate(prev)) {
            next.ApprovedOn = prev.ApprovedOn;
        }

        map.set(n, next);
    });
    return [...map.keys()].sort(function (x, y) { return x - y; }).map(function (k) { return map.get(k); });
}

function NormalizePaymentList(list) {
    return (list || []).map(function (row) {
        const p = { ...row };
        p.LevelDetails = parseLevelDetailsToArray(p.LevelDetails);
        if (!p.TotalLevels && p.LevelDetails.length > 0) {
            p.TotalLevels = p.LevelDetails.length;
        }
        return p;
    });
}
function shouldApplyLandingPendingOnMe() {
    try {
        const v = sessionStorage.getItem(MRN_LANDING_PENDING_ON_ME_KEY);
        return v === 'Y' || v === '1';
    } catch (e) {
        return false;
    }
}

function LoadPaymentList(options) {
    options = options || {};
    const seq = ++G_LoadPaymentListSeq;
    const landingPendingOnMe = shouldApplyLandingPendingOnMe();
    const keepPendingOnMe = !!(options.preservePendingOnMe || landingPendingOnMe || G_OnlyPendingOnMe);

    if (keepPendingOnMe) {
        G_OnlyPendingOnMe = true;
        syncGpaPendingOnMeChipActive();
    } else {
        G_OnlyPendingOnMe = false;
        syncGpaPendingOnMeChipActive();
    }

    const fromDate = document.getElementById('gpaFromDate')?.value || '';
    const toDate = document.getElementById('gpaToDate')?.value || '';
    const statusVal = document.getElementById('gpaDdlStatus')?.value || 'A';

    ShowGpaLoading(true);
    ShowGpaEmpty(false);
    const container = document.getElementById('gpaPendingList');
    if (container) container.innerHTML = '';

    // Always fetch ALL records from the API (Status='A') and apply status filtering
    // entirely on the client side using getApprovalStatus(). This avoids any
    // mismatch between the dropdown labels ('P'=Pending, 'Y'=Approved) and the
    // underlying DB values ('P'=Approved/Posted, 'N'/'R'=Rejected, ''=Pending).
    return MRNMasterApprovalService.GetPendingMRNMasterList('A', fromDate, toDate)
        .then(function (data) {
            if (seq !== G_LoadPaymentListSeq) return G_PaymentList;
            ShowGpaLoading(false);
            let list = NormalizePaymentList(normalizeListResponse(data));

            // Client-side status filter based on selected dropdown value
            if (statusVal === 'P') {
                list = list.filter(function (p) { return getApprovalStatus(p).toLowerCase() === 'pending'; });
            } else if (statusVal === 'Y') {
                list = list.filter(function (p) { return getApprovalStatus(p).toLowerCase() === 'approved'; });
            } else if (statusVal === 'R') {
                list = list.filter(function (p) { return getApprovalStatus(p).toLowerCase() === 'rejected'; });
            }
            // 'A' (All Status) — no filter, keep full list

            G_PaymentList = enrichPaymentListMrnNos(list);
            UpdateGpaStatChips();
            RenderPaymentCards();
            const searchEl = document.getElementById('gpaLstSearch');
            FilterGpaCards(searchEl ? searchEl.value : '');
            applyLandingPendingOnMeFilterIfNeeded();
            return list;
        })
        .catch(function (err) {
            if (seq !== G_LoadPaymentListSeq) return [];
            console.error('LoadPaymentList MRN', err);
            ShowGpaLoading(false);
            G_PaymentList = [];
            UpdateGpaStatChips();
            if (container) container.innerHTML = '';
            ShowGpaEmpty(true);
            if (typeof toastr !== 'undefined') {
                toastr.error('Error loading GRN Service (MRN) approval list.');
            }
            return [];
        });
}

function UpdateGpaStatChips() {
    const pendingOnly = G_PaymentList.filter(function (p) {
        return getApprovalStatus(p).toLowerCase() === 'pending';
    }).length;
    const approvedCount = G_PaymentList.filter(function (p) {
        return getApprovalStatus(p).toLowerCase() === 'approved';
    }).length;
    const rejectedCount = G_PaymentList.filter(function (p) {
        return getApprovalStatus(p).toLowerCase() === 'rejected';
    }).length;
    const elP = document.getElementById('gpaStatPending');
    const elO = document.getElementById('gpaStatProcessed');
    if (elP) elP.textContent = String(pendingOnly);
    if (elO) elO.textContent = String(approvedCount);

    let onMe = pendingOnly === 0 ? 0 : G_PaymentList.filter(paymentIsPendingOnMe).length;
    const elOnMe = document.getElementById('gpaStatPendingOnMe');
    if (elOnMe) {
        elOnMe.textContent = String(onMe);
    }
    if (typeof window.syncGrnListHeaderTabsFromApprovalChips === 'function') {
        window.syncGrnListHeaderTabsFromApprovalChips({
            pending: pendingOnly,
            approved: approvedCount,
            rejected: rejectedCount,
            pendingOnMe: onMe,
        });
    }
}

function countMrnPendingOnMeFromList(list) {
    const rows = list || [];
    const pendingOnly = rows.filter(function (p) {
        return getApprovalStatus(p).toLowerCase() === 'pending';
    }).length;
    if (pendingOnly === 0) return 0;
    return rows.filter(paymentIsPendingOnMe).length;
}

function RenderPaymentCards() {
    const list = getFilteredPaymentListForRender();
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

function ToggleGpaPendingOnMeFilter() {
    G_OnlyPendingOnMe = !G_OnlyPendingOnMe;
    syncGpaPendingOnMeChipActive();
    RenderPaymentCards();
    const searchEl = document.getElementById('gpaLstSearch');
    FilterGpaCards(searchEl ? searchEl.value : '');
}

function applyLandingPendingOnMeFilterIfNeeded() {
    try {
        const v = sessionStorage.getItem(MRN_LANDING_PENDING_ON_ME_KEY);
        if (v !== 'Y' && v !== '1') return;
        sessionStorage.removeItem(MRN_LANDING_PENDING_ON_ME_KEY);
        G_OnlyPendingOnMe = true;
        syncGpaPendingOnMeChipActive();
        RenderPaymentCards();
        const searchEl = document.getElementById('gpaLstSearch');
        FilterGpaCards(searchEl ? searchEl.value : '');
    } catch (e) {
        /* ignore */
    }
}

function consumeMrnApprovalRefreshFlag() {
    try {
        const v = sessionStorage.getItem(MRN_APPROVAL_REFRESH_KEY);
        if (!v) return false;
        sessionStorage.removeItem(MRN_APPROVAL_REFRESH_KEY);
        return true;
    } catch (e) {
        return false;
    }
}

function refreshMrnApprovalListIfNeeded(forceReload) {
    if (forceReload || consumeMrnApprovalRefreshFlag()) {
        return reloadMrnApprovalView({
            pendingOnMe: shouldApplyLandingPendingOnMe() || G_OnlyPendingOnMe,
        });
    }
    return Promise.resolve(G_PaymentList);
}

function reloadMrnApprovalView(options) {
    options = options || {};
    if (options.pendingOnMe || shouldApplyLandingPendingOnMe()) {
        G_OnlyPendingOnMe = true;
        syncGpaPendingOnMeChipActive();
    }
    return InitDates(true).then(function () {
        return LoadPaymentList({
            preservePendingOnMe: !!(options.pendingOnMe || G_OnlyPendingOnMe || shouldApplyLandingPendingOnMe()),
        });
    });
}

function BuildPaymentCard(p) {
    const code = getPaymentMasterCode(p);
    const mrnPlain = String(formatMrnDisplayNo(p));
    const entryPlain = String(getEntryNo(p));
    const vendorPlain = String(getPartyName(p));
    const mrnNo = EscHtml(mrnPlain);
    const vendor = EscHtml(vendorPlain);
    const entryDate = FmtDateDisplay(getEntryDate(p));
    const amount = FmtCurrency(getTotalAmount(p));
    const totalLvl = parseInt(p.TotalLevels ?? p.MaxLevel ?? 3, 10) || 1;
    const curLvlNo = parseInt(p.CurrentLevelNo ?? p.CurrentLevel ?? 1, 10) || 1;
    const levelChip = EscHtml(getGpaCardLevelChipLabel(p));
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

    /* Project / sub-project info from API (if present) */
    const project = EscHtml(String(p.SubProjectName ?? p.ProjectName ?? p.Project ?? '').trim());
    const creatorName = EscHtml(String(p.CreatedByName ?? p.CreatedBy ?? p.Creator ?? '').trim());
    const projectLine = project
        ? `<span style="font-size:0.72rem;color:#475569;"><i class="fa fa-project-diagram me-1" style="color:#0284c7;"></i>${project} · L${curLvlNo}</span>`
        : '';
    const creatorBadge = creatorName
        ? `<span class="gpa-creator-chip"><i class="fa fa-user me-1"></i>${creatorName}</span>`
        : `<span class="gpa-creator-chip"><i class="fa fa-user me-1"></i>Creator</span>`;

    const searchKey = (vendorPlain + ' ' + mrnPlain + ' ' + entryPlain).toLowerCase();

    /* Icon buttons: Attachment only */
    const iconBtns = `
        <div class="gpa-pay-card-print-btns">
            <button type="button" class="btn-gpa-print-icon btn-gpa-print-attach"
                    title="Attachments"
                    onclick="if(typeof openGRNApprovalCardAttachment==='function')openGRNApprovalCardAttachment(${code})">
                <i class="fa fa-paperclip"></i>
            </button>
        </div>`;

    return `
    <div class="gpa-pay-card section-entry-animation" data-code="${code}" data-search="${EscHtml(searchKey)}">
        <div class="gpa-pay-card-header">
            <div class="gpa-entry-badge">
                <span style="font-size:0.6rem;font-weight:600;opacity:0.82;line-height:1;">MRN#</span>
                <span style="font-weight:800;font-size:0.82rem;line-height:1.2;">${mrnNo}</span>
            </div>
            <div class="gpa-pay-card-vendor">
                <div class="gpa-pay-vendor-name">
                    <i class="fa fa-building me-1" style="color:#667eea;font-size:0.72rem;"></i>${vendor}
                </div>
                <div class="gpa-pay-card-meta">
                    <span><i class="fa fa-calendar-alt me-1"></i>${entryDate || '—'}</span>
                    ${creatorBadge}
                    ${projectLine}
                    <span class="gpa-pay-level-chip">
                        <i class="fa fa-layer-group me-1"></i>${levelChip}
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
            ${iconBtns}
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
    const fromList = parseLevelDetailsToArray(basePayment.LevelDetails);

    if (Array.isArray(root)) {
        p._detailLines = root;
        p.LevelDetails = fromList.length ? fromList.slice() : [];
        enrichMrnHeaderFromDetailLines(p, root);
        return p;
    }

    const data = peelMrnApprovalApiRoot(root);
    if (!data || typeof data !== 'object') {
        p.LevelDetails = fromList.length ? fromList.slice() : parseLevelDetailsToArray(p.LevelDetails);
        return p;
    }
    if (Array.isArray(data)) {
        p._detailLines = data;
        p.LevelDetails = fromList.length ? fromList.slice() : parseLevelDetailsToArray(p.LevelDetails);
        enrichMrnHeaderFromDetailLines(p, data);
        return p;
    }

    const resolvedMaster = firstMrnMasterFromApi(data)
        ?? data.VW_GRNPaymentMaster?.GRNPaymentMaster?.[0]
        ?? data.GRNPaymentMaster?.[0]
        ?? data.GRNPaymentMaster
        ?? data.Master
        ?? null;

    if (resolvedMaster && typeof resolvedMaster === 'object' && !Array.isArray(resolvedMaster)) {
        Object.assign(p, resolvedMaster);
        const mProj = mrnProjectLabelFromPayment(resolvedMaster);
        const mSub = mrnSubProjectLabelFromPayment(resolvedMaster);
        if (mProj) p.Project = mProj;
        if (mSub) p.SubProject = mSub;
    }

    enrichPaymentMrnNo(p);

    const fromApi = parseLevelDetailsToArray(
        (data && data.LevelDetails != null) ? data.LevelDetails : p.LevelDetails
    );
    p.LevelDetails = mergeLevelDetailsLists(fromList, fromApi);

    let lines = data.GRNServiceDetail ?? data.grnServiceDetail
        ?? data.MRNDetails ?? data.MRNDetail ?? data.mRNDetail
        ?? data.GRNPaymentDetails ?? data.Details ?? data.BillLines ?? data.Items ?? data.Lines
        ?? data.Table ?? data.table;
    if (!Array.isArray(lines) || !lines.length) lines = mrnScanDetailArraysInObject(data);
    if (Array.isArray(lines) && lines.length) {
        p._detailLines = lines;
        enrichMrnHeaderFromDetailLines(p, lines);
    }

    return p;
}

function extractDetailLines(root) {
    if (Array.isArray(root)) {
        return root.length && mrnIsDetailRow(root[0]) ? root : [];
    }
    const data = peelMrnApprovalApiRoot(root);
    if (!data) return [];
    if (Array.isArray(data)) {
        return data.length && mrnIsDetailRow(data[0]) ? data : [];
    }
    const lines = data.GRNServiceDetail ?? data.grnServiceDetail
        ?? data.MRNDetails ?? data.MRNDetail ?? data.mRNDetail
        ?? data.Details ?? data.Items ?? data.Lines
        ?? data.Table ?? data.table;
    if (Array.isArray(lines) && lines.length) return lines;
    return mrnScanDetailArraysInObject(data);
}

function extractBillLines(root) {
    if (Array.isArray(root)) return [];
    const data = root?.Data ?? root?.data ?? root;
    if (!data || Array.isArray(data)) return [];
    const lines = data.GRNPaymentDetails ?? data.BillLines ?? data.PaymentLines ?? data.PaymentDetails;
    return Array.isArray(lines) ? lines : [];
}

function unwrapGpaActionResponse(res) {
    if (!res || typeof res !== 'object') return res;
    return res.Data ?? res.data ?? res.Result ?? res.result ?? res;
}

function setGpaModalViewOnlyMode(viewOnly) {
    G_GpaModalViewOnly = !!viewOnly;
    var $attach = $('#btnGpaModalAttach');
    var $approve = $('#gpaBtnApproveAction');
    var $reject = $('#gpaBtnRejectAction');
    var $remarks = $('#gpaFrmRemarks');

    if (G_GpaModalViewOnly) {
        $attach.hide().prop('disabled', true);
        $approve.hide().prop('disabled', true);
        $reject.hide().prop('disabled', true);
        $remarks.prop('readonly', true).prop('disabled', true);
        return;
    }

    $attach.show().prop('disabled', false);
    $remarks.prop('readonly', false).prop('disabled', false);
}

function applyGpaModalActionButtons(payment) {
    if (G_GpaModalViewOnly) {
        setGpaModalViewOnlyMode(true);
        return;
    }
    var pend = getApprovalStatus(payment || G_CurrentPayment || {}).toLowerCase() === 'pending';
    $('#gpaBtnApproveAction').toggle(pend).prop('disabled', !pend);
    $('#gpaBtnRejectAction').toggle(pend).prop('disabled', !pend);
    $('#btnGpaModalAttach').show().prop('disabled', false);
}

function OpenDetailModal(paymentCode, options) {
    const viewOnly = options === true || !!(options && options.viewOnly);
    setGpaModalViewOnlyMode(viewOnly);
    const code = parseInt(paymentCode, 10);
    if (!Number.isFinite(code) || code <= 0) return;

    G_CurrentPayment = G_PaymentList.find(function (p) { return getPaymentMasterCode(p) === code; }) || null;
    if (!G_CurrentPayment) {
        G_CurrentPayment = { Code: code, MRNMaster_Code: code };
    }

    const entryNo = formatMrnDisplayNo(G_CurrentPayment);
    const vendor = getPartyName(G_CurrentPayment);

    $('#gpaModalEntryTitle').text('MRN# ' + entryNo);
    $('#gpaModalParty').text(vendor);
    $('#hfGpaPaymentCode').val(String(code));
    $('#hfGpaLevelCode').val(String(getLevelCode(G_CurrentPayment)));
    $('#gpaFrmRemarks').val('');

    paintModalFromPayment(G_CurrentPayment);

    ensureGpaModalItemsTableHead();
    $('#gpaModalItemsBody').html(
        '<tr><td colspan="6" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">' +
        '<i class="fa fa-spinner fa-spin me-1"></i>Loading\u2026</td></tr>'
    );

    applyGpaModalActionButtons(G_CurrentPayment);

    $('#modalGpaDetail').modal({ backdrop: 'static' });
    $('#modalGpaDetail').modal('show');

    MRNMasterApprovalService.GetMRNMasterDetail(code)
        .then(function (res) {
            G_CurrentPayment = mergeDetailIntoPayment(res, G_CurrentPayment);
            let lines = extractDetailLines(res);
            if (!lines.length && Array.isArray(G_CurrentPayment._detailLines)) {
                lines = G_CurrentPayment._detailLines;
            }
            lines = mrnNormalizeDetailLines(lines, G_CurrentPayment);
            G_CurrentPayment = enrichMrnHeaderFromDetailLines(G_CurrentPayment, lines);
            $('#hfGpaLevelCode').val(String(getLevelCode(G_CurrentPayment)));
            $('#gpaModalEntryTitle').text('MRN# ' + formatMrnDisplayNo(G_CurrentPayment));
            paintModalFromPayment(G_CurrentPayment);
            RenderGpaModalItems(lines);
            applyGpaModalActionButtons(G_CurrentPayment);
        })
        .catch(function (err) {
            console.error('GetMRNMasterDetail', err);
            $('#gpaModalItemsBody').html(
                '<tr><td colspan="6" class="text-center py-3" style="color:#ef4444;font-size:0.82rem;">' +
                '<i class="fa fa-exclamation-triangle me-1"></i>Error loading GRN service lines.</td></tr>'
            );
        });
}

function paintModalFromPayment(po) {
    const mrnNo = EscHtml(formatMrnDisplayNo(po));
    const vendor = EscHtml(getPartyName(po));
    const entryDate = EscHtml(FmtDateDisplay(getEntryDate(po)) || '—');
    const amount = FmtCurrency(getTotalAmount(po));
    const curLvlNo = parseInt(po.CurrentLevelNo ?? po.CurrentLevel ?? 1, 10) || 1;
    const totalLvl = parseInt(po.TotalLevels ?? po.MaxLevel ?? 3, 10) || 1;
    const status = EscHtml(getApprovalStatus(po));
    const project = EscHtml(getProject(po) || '—');
    const subProject = EscHtml(getSubProject(po) || '—');

    $('#gpaModalHeader').html(
        '<div class="gpa-info-grid">' +
            BuildGpaInfoItem('MRN Number', mrnNo, 'fa-file-invoice') +
            BuildGpaInfoItem('Party', vendor, 'fa-building') +
            BuildGpaInfoItem('Entry Date', entryDate, 'fa-calendar-alt') +
            BuildGpaInfoItem('Amount', amount, 'fa-rupee-sign', '#667eea') +
            BuildGpaInfoItem('Project', project, 'fa-project-diagram') +
            BuildGpaInfoItem('Sub Project', subProject, 'fa-sitemap') +
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
    const levels = parseLevelDetailsToArray(po.LevelDetails);

    let html = '<div class="gpa-detail-stepper">';
    for (let i = 1; i <= totalLvl; i++) {
        const lvlInfo = levels.find(function (l) {
            return (l.LevelNo ?? l.Level ?? l.LevelOrder) == i;
        }) || {};
        const lvlName = EscHtml(getLevelRowDisplayTitle(lvlInfo, i));
        const approver = EscHtml(lvlInfo.ApproverName ?? lvlInfo.UserName ?? '');
        const approvedOn = lvlInfo.ApprovedOn ? FmtDateDisplay(lvlInfo.ApprovedOn) : '';
        const lvlRemarksRaw = getLevelRowRemarks(lvlInfo);
        const remarksHtml = lvlRemarksRaw
            ? '<div class="gpa-dstep-remarks"><i class="fa fa-comment me-1"></i>' + EscHtml(lvlRemarksRaw) + '</div>'
            : '';

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
            remarksHtml +
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
    ensureGpaModalItemsTableHead();
    const master = G_CurrentPayment || {};
    const rows = mrnNormalizeDetailLines(items, master);
    if (!rows || rows.length === 0) {
        $body.html(
            '<tr><td colspan="6" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No line items found.</td></tr>'
        );
        return;
    }
    let html = '';
    rows.forEach(function (row, idx) {
        const billNoRaw = row.BillNo ?? row.billNo ?? master.BillNo ?? master.billNo ?? '';
        const billNo = EscHtml(billNoRaw !== null && `${billNoRaw}`.trim() !== '' ? billNoRaw : '—');
        const poRaw = row.PONo ?? row.PoNO ?? row.pONo ?? row.PurchaseOrderNo ?? row.purchaseOrderNo ?? '';
        const po = EscHtml(poRaw !== null && `${poRaw}`.trim() !== '' ? poRaw : '—');
        const itemRaw = mrnResolveItemName(row);
        const itemName = EscHtml(itemRaw !== '' ? itemRaw : '—');
        const qtyRaw = mrnResolveLineQty(row);
        const qty = qtyRaw !== '' ? EscHtml(qtyRaw) : '—';
        const amt = FmtCurrency(mrnResolveLineAmount(row));
        html += '<tr>' +
            '<td class="text-center" style="color:#94a3b8;">' + (idx + 1) + '</td>' +
            '<td style="font-weight:600;">' + billNo + '</td>' +
            '<td class="text-center">' + po + '</td>' +
            '<td>' + itemName + '</td>' +
            '<td class="text-end">' + qty + '</td>' +
            '<td class="text-end" style="font-weight:700;color:#667eea;">' + amt + '</td>' +
            '</tr>';
    });
    $body.html(html);
}

function RenderGpaBillLines(items) {
    const $body = $('#gpaModalBillLinesBody');
    if (!$body.length) return;
    if (!items || items.length === 0) {
        $body.html(
            '<tr><td colspan="6" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No bill lines found.</td></tr>'
        );
        return;
    }
    let html = '';
    items.forEach(function (row, idx) {
        const billNo = EscHtml(row.BillNo ?? row.billNo ?? row.MRNNo ?? row.Name ?? '—');
        const bdt = FmtDateDisplay(row.BillDate ?? row['Bill Date'] ?? row.billDate ?? row.ReceiveDate ?? '');
        const totalBill = FmtCurrency(row.BillAmount ?? row.billAmount ?? row.TotalBillAmountManual ?? row.Amount ?? 0);
        const netNum = parseFloat(row.PayableAmount ?? row.payableAmount ?? row.NetPayable ?? row.netPayable ??
            row.BillAmount ?? row.billAmount ?? row.Amount ?? 0);
        const payRaw = row.PaymentAmount ?? row['Payment Amount'] ?? row.paymentAmount ?? row.PayAmount;
        const payNum = (payRaw !== undefined && payRaw !== null && payRaw !== '')
            ? parseFloat(payRaw)
            : netNum;
        html += '<tr>' +
            '<td class="text-center" style="color:#94a3b8;">' + (idx + 1) + '</td>' +
            '<td style="font-weight:600;">' + billNo + '</td>' +
            '<td class="text-center">' + EscHtml(bdt || '—') + '</td>' +
            '<td class="text-end">' + totalBill + '</td>' +
            '<td class="text-end">' + FmtCurrency(netNum) + '</td>' +
            '<td class="text-end" style="font-weight:700;color:#667eea;">' + FmtCurrency(payNum) + '</td>' +
            '</tr>';
    });
    $body.html(html);
}

function SubmitApproval(action) {
    const poCode = parseInt($('#hfGpaPaymentCode').val() || '0', 10);
    const levelCode = parseInt($('#hfGpaLevelCode').val() || '0', 10);
    const remarks = ($('#gpaFrmRemarks').val() || '').trim();

    if (!poCode) {
        if (typeof toastr !== 'undefined') toastr.warning('No GRN service entry selected.');
        return;
    }
    if (!levelCode) {
        if (typeof toastr !== 'undefined') {
            toastr.warning('Could not determine approval level. Refresh the list or reopen the entry, then try again.');
        }
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

    //var ModuleName = 'GRN Approval Configuration';
    //var OptionName = 'Verify';
    //var ShowMsg = 'Y';
    //var FinYear = BizSolHelperFunction.getFinancialYear();

    //MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (perm) {
    //    if (!perm || perm.CheckModuleOptionRight === 'N') {
    //        if (typeof HideLoader === 'function') HideLoader();
    //        if (typeof toastr !== 'undefined') {
    //            toastr.error((perm && perm.Msg) ? perm.Msg : 'You do not have permission to verify.');
    //        }
    //        CloseDetailModal();
    //        return;
    //    }

        const serviceCall = action === 'Approve'
            ? MRNMasterApprovalService.ApproveMRNMaster(paymentCode, levelCode, remarks)
            : MRNMasterApprovalService.RejectMRNMaster(paymentCode, levelCode, remarks);

        serviceCall
            .then(function (response) {
                if (typeof HideLoader === 'function') HideLoader();
                const payload = unwrapGpaActionResponse(response) || response;
                const st = payload && (payload.Status ?? payload.status);
                const stU = st != null ? String(st).toUpperCase() : '';
                const okReject = action === 'Reject' && (stU === 'N' || stU === 'R' || stU === 'SUCCESS');
                const ok = payload && (
                    st === 'Y' || st === 'Success' || st === 'success' ||
                    okReject ||
                    payload.Success === true || payload.success === true || response === true
                );
                if (ok) {
                    const serverMsg = (payload.Msg || payload.Message || payload.message || '').trim();
                    const done = action === 'Approve' ? 'approved' : 'rejected';
                    if (typeof toastr !== 'undefined') {
                        toastr.success(serverMsg || ('GRN Service entry ' + done + ' successfully.'));
                    }
                    CloseDetailModal();
                    LoadPaymentList().then(function () {
                        if (typeof window.loadGRNList === 'function') {
                            return window.loadGRNList();
                        }
                    });
                } else {
                    const msg = (payload && (payload.Msg || payload.Message || payload.message)) ||
                        ('Failed to ' + action.toLowerCase() + ' GRN service entry.');
                    if (typeof toastr !== 'undefined') toastr.error(msg);
                }
            })
            .catch(function () {
                if (typeof HideLoader === 'function') HideLoader();
                if (typeof toastr !== 'undefined') {
                    toastr.error('Error while ' + (action === 'Approve' ? 'approving' : 'rejecting') + ' GRN service entry.');
                }
            });
    //}).catch(function () {
    //    if (typeof HideLoader === 'function') HideLoader();
    //    if (typeof toastr !== 'undefined') {
    //        toastr.error('Permission check failed.');
    //    }
    //});
}

function LoadMrnAttachmentsInline(masterCode) {
    const wrap = document.getElementById('gpaModalAttachList');
    if (!wrap) return;
    if (!masterCode || masterCode <= 0) {
        wrap.innerHTML = '<span style="font-size:0.78rem;color:#94a3b8;"><i class="fa fa-paperclip me-1"></i>No attachments.</span>';
        return;
    }
    wrap.innerHTML = '<span style="font-size:0.78rem;color:#94a3b8;"><i class="fa fa-spinner fa-spin me-1"></i>Loading attachments\u2026</span>';
    AttachmentControlService.GetAttachmentUploadFiles('MRNMaster', masterCode, '', 0)
        .then(function (response) {
            const rows = Array.isArray(response) ? response : [];
            if (rows.length === 0) {
                wrap.innerHTML = '<span style="font-size:0.78rem;color:#94a3b8;"><i class="fa fa-paperclip me-1"></i>No attachments.</span>';
                return;
            }
            let html = '<div style="display:flex;flex-direction:column;gap:6px;">';
            rows.forEach(function (item) {
                const name = EscHtml(item.DocumentName ?? item.documentName ?? '—');
                const particulars = EscHtml(item.DocumentParticulars ?? item.documentParticulars ?? '');
                const code = item.Code ?? item.code ?? 0;
                const ext = String(item.DocumentName ?? '').split('.').pop().toLowerCase();
                const iconMap = {
                    pdf: 'fa-file-pdf', doc: 'fa-file-word', docx: 'fa-file-word',
                    xls: 'fa-file-excel', xlsx: 'fa-file-excel',
                    png: 'fa-file-image', jpg: 'fa-file-image', jpeg: 'fa-file-image',
                    zip: 'fa-file-archive', rar: 'fa-file-archive', txt: 'fa-file-alt'
                };
                const icon = iconMap[ext] || 'fa-file';
                html += '<div style="display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;">' +
                    '<i class="fa ' + icon + '" style="color:#667eea;font-size:1rem;flex-shrink:0;"></i>' +
                    '<div style="flex:1;min-width:0;">' +
                    '<div style="font-size:0.8rem;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + name + '</div>' +
                    (particulars ? '<div style="font-size:0.72rem;color:#64748b;">' + particulars + '</div>' : '') +
                    '</div>' +
                    '<a href="#" onclick="MrnApprovalDownloadAttachment(' + code + ',\'' + name + '\'); return false;" ' +
                    'style="flex-shrink:0;font-size:0.75rem;color:#667eea;font-weight:600;text-decoration:none;" title="Download">' +
                    '<i class="fa fa-download me-1"></i>Download</a>' +
                    '</div>';
            });
            html += '</div>';
            wrap.innerHTML = html;
        })
        .catch(function () {
            wrap.innerHTML = '<span style="font-size:0.78rem;color:#ef4444;"><i class="fa fa-exclamation-triangle me-1"></i>Could not load attachments.</span>';
        });
}

function MrnApprovalDownloadAttachment(code, fileName) {
    if (!code) return;
    if (typeof Showloader === 'function') Showloader();
    AttachmentControlService.DownloadAttachment(code)
        .then(function (blob) {
            if (typeof HideLoader === 'function') HideLoader();
            const ext = String(fileName).split('.').pop().toLowerCase();
            const viewable = ['txt', 'png', 'gif', 'jpeg', 'jpg', 'pdf'].includes(ext);
            const url = window.URL.createObjectURL(blob);
            if (viewable) {
                window.open(url, '_blank');
            } else {
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
            window.URL.revokeObjectURL(url);
        })
        .catch(function () {
            if (typeof HideLoader === 'function') HideLoader();
            if (typeof toastr !== 'undefined') toastr.error('Failed to download attachment.');
        });
}

function CloseDetailModal() {
    $('#modalGpaDetail').modal('hide');
    const wrap = document.getElementById('gpaModalAttachList');
    if (wrap) wrap.innerHTML = '';
    setGpaModalViewOnlyMode(false);
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
    window.location.href = appBase + 'PurchaseTransactions/GRNService/GRNService?ModuleDesp=GRN%20Services';
}

function NavigateToGRNServiceApprovalConfiguration() {
    const appBase = (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/'))
        .replace(/\/?$/, '/');
    window.location.href =
        appBase + 'PurchaseTransactions/GRNService/GRNServiceApprovalConfiguration?ModuleDesp=GRN%20Services';
}

document.addEventListener('DOMContentLoaded', function () {
    InitDates()
        .then(function () {
            return reloadMrnApprovalView({});
        })
        .catch(function (err) {
            console.error('InitDates failed', err);
            return reloadMrnApprovalView({});
        });

    const searchEl = document.getElementById('gpaLstSearch');
    if (searchEl) {
        searchEl.addEventListener('input', function () {
            FilterGpaCards(this.value);
        });
    }
});

window.addEventListener('pageshow', function () {
    refreshMrnApprovalListIfNeeded(false);
});

window.LoadPaymentList = LoadPaymentList;
window.refreshMrnApprovalListIfNeeded = refreshMrnApprovalListIfNeeded;
window.reloadMrnApprovalView = reloadMrnApprovalView;
window.MRN_APPROVAL_REFRESH_KEY = MRN_APPROVAL_REFRESH_KEY;
window.OpenDetailModal = OpenDetailModal;
window.SubmitApproval = SubmitApproval;
window.CloseDetailModal = CloseDetailModal;
window.CloseConfirmModal = CloseConfirmModal;
window.NavigateToGRNService = NavigateToGRNService;
window.NavigateToGRNServiceApprovalConfiguration = NavigateToGRNServiceApprovalConfiguration;
window.ToggleGpaPendingOnMeFilter = ToggleGpaPendingOnMeFilter;
window.countMrnPendingOnMeFromList = countMrnPendingOnMeFromList;
window.MrnApprovalDownloadAttachment = MrnApprovalDownloadAttachment;
