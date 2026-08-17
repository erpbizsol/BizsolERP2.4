import { QuotationApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/QuotationApprovalService.js';

let FrmType = '';
let FrmAction = '';
let G_QuotationList = [];
let G_CurrentQuotation = null;
/** 'Y' = show Rate As Per Cost Sheet column(s); anything else = hide */
let G_RateAsPerCostSheet  = 'N';
const QA_RATE_CS_KEYS = new Set(['Rate As Per Cost Sheet', 'RateAsPerCostSheet']);
const QA_RATE_FC_KEYS = new Set(['Rate As Per Cost Sheet In FC', 'RateAsPerCostSheetInFC']);
const QA_COST_SHEET_KEYS = new Set([...QA_RATE_CS_KEYS, ...QA_RATE_FC_KEYS]);
const QA_COST_SHEET_LABELS = {
    RateAsPerCostSheet: 'Rate As Per Cost Sheet',
    'Rate As Per Cost Sheet': 'Rate As Per Cost Sheet',
    RateAsPerCostSheetInFC: 'Rate As Per Cost Sheet In FC',
    'Rate As Per Cost Sheet In FC': 'Rate As Per Cost Sheet In FC'
};
const QA_QUOT_FOR_KEYS = ['QuotationFor', 'Quotation For'];
const QA_QUOT_AGAINST_KEYS = ['QuotationAgainst', 'Quotation Against', 'OrderAgainst', 'Order Against'];
const QA_CONVERSION_RATE_KEYS = ['ConversionRate', 'Conversion Rate'];

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
    const a = (FrmAction || 'Verify').trim();
    if (/approve/i.test(a)) return 'Review & Approve';
    if (/check/i.test(a)) return 'Review & Check';
    return 'Review & Verify';
}

function VerifyButtonLabel() {
    const a = (FrmAction || 'Verify').trim();
    if (/approve/i.test(a)) return 'Approve';
    if (/check/i.test(a)) return 'Check';
    return 'Verify';
}

const QA_ATTACHMENT_MASTER = 'QuotationMaster';

function EscJsSingleQuote(s) {
    return String(s ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r\n/g, '\\n')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\n');
}

function QaHasAttachmentYes(item) {
    if (!item) return false;
    const v = item.HasAttach != null ? item.HasAttach
        : item.hasAttach != null ? item.hasAttach
        : item.HasAttachment != null ? item.HasAttachment
        : item['Has Attachment'];
    return String(v || '').trim().toUpperCase() === 'Y';
}

function QaRawQuotNoForAttach(item) {
    if (!item) return '';
    return String(item['Quotation No'] || item.QuotationNo || '').trim();
}

function QaRawQuotDateForAttach(item) {
    if (!item) return '';
    const d = item['Quotation Date'] || item.QuotationDate || '';
    const s = String(d).trim();
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) {
        return m[3] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[1]).padStart(2, '0');
    }
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) {
        return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
    }
    return s.length >= 10 ? s.substring(0, 10) : '';
}

function QaEntryDateParamForAttachmentControl(item) {
    const raw = QaRawQuotDateForAttach(item);
    if (!raw) return '';
    const dt = new Date(raw);
    return !isNaN(dt.getTime()) ? dt.toISOString() : '';
}

function InitQuotationAttachmentControl(masterCode, entryNo, entryDate) {
    const appBase = (sessionStorage.getItem('AppBaseURL') || (window.location.origin + '/')).replace(/\/?$/, '/');
    $('#QuotationApproval_AttachmentControlmodal').load(appBase + 'CustomControl/AttachmentControl', {
        MasterTableName: QA_ATTACHMENT_MASTER,
        MasterTableCode: parseInt(masterCode, 10) || 0,
        DetailTableName: '',
        DetailTableCode: 0,
        EntryNo: parseInt(entryNo, 10) || 0,
        EntryDate: entryDate || '',
        Mode: 'view'
    });
}

function OpenQuotationApprovalAttachment(code, entryNo, entryDate) {
    const masterCode = parseInt(code, 10) || 0;
    if (masterCode <= 0) {
        toastr.warning('Invalid record. Cannot open attachments.');
        return;
    }
    const item = G_QuotationList.find(function (q) { return String(q.Code) === String(masterCode); })
        || (G_CurrentQuotation && String(G_CurrentQuotation.Code) === String(masterCode) ? G_CurrentQuotation : null);
    const en = entryNo != null && String(entryNo) !== '' ? entryNo : (item ? QaRawQuotNoForAttach(item) : '');
    const ed = entryDate != null && String(entryDate) !== ''
        ? entryDate
        : (item ? QaEntryDateParamForAttachmentControl(item) : '');
    InitQuotationAttachmentControl(masterCode, en, ed);
}

function OpenQuotationApprovalAttachmentFromModal() {
    const code = parseInt(document.getElementById('hfQuotationCode').value || '0', 10);
    const entryNo = document.getElementById('hfQuotationAttachNo').value || '';
    const entryDate = document.getElementById('hfQuotationAttachDate').value || '';
    OpenQuotationApprovalAttachment(code, entryNo, entryDate);
}

function SyncQuotationModalAttachmentButton(item) {
    if (!item) return;
    document.getElementById('hfQuotationAttachNo').value = String(QaRawQuotNoForAttach(item) || '');
    document.getElementById('hfQuotationAttachDate').value = QaEntryDateParamForAttachmentControl(item) || '';
    const btn = document.getElementById('btnQuotationModalAttachment');
    if (btn) btn.classList.toggle('av-attach-has-files', QaHasAttachmentYes(item));
}

function ShowLoading(show) {
    document.getElementById('quotationPendingLoading').style.display = show ? '' : 'none';
}

function ShowEmpty(show) {
    document.getElementById('quotationPendingEmpty').style.display = show ? '' : 'none';
}

function UpdateStatChips() {
    const pending = G_QuotationList.length;
    document.getElementById('statPendingQuotation').textContent = pending > 0 ? pending : '\u2014';
}

function BuildInfoItem(label, value, icon, valueColor) {
    const clr = valueColor ? 'style="color:' + valueColor + ';font-weight:800;"' : '';
    return '<div class="pla-info-item">' +
        '<span class="pla-info-lbl"><i class="fa ' + icon + ' me-1"></i>' + EscHtml(label) + '</span>' +
        '<span class="pla-info-val" ' + clr + '>' + value + '</span>' +
        '</div>';
}

function BuildQuotationCard(item) {
    const code = item.Code;
    const quotNo = EscHtml(item['Quotation No'] || item.QuotationNo || '\u2014');
    const party = EscHtml(item.Party || item.PartyName || item['Party Name'] || '\u2014');
    const quotDate = EscHtml(FmtDateDisplay(item['Quotation Date'] || item.QuotationDate));
    const amount = FmtCurrency(item['Total Amount'] || item.TotalAmount || item.Amount || 0);
    const canAction = !!item.Action;

    const actionBtn = canAction
        ? '<button type="button" class="btn-pla-card-approve" onclick="OpenReviewModal(\'' + code + '\')">' +
          '<i class="fa fa-folder-open me-1"></i>' + ReviewActionLabel() +
          '</button>'
        : '<button type="button" class="btn-pla-card-view" onclick="OpenReviewModal(\'' + code + '\')">' +
          '<i class="fa fa-eye me-1"></i>View Details' +
          '</button>';

    const rawNo = QaRawQuotNoForAttach(item);
    const rawDt = QaEntryDateParamForAttachmentControl(item);
    const escNo = EscJsSingleQuote(rawNo);
    const escDt = EscJsSingleQuote(rawDt);
    const attachBg = QaHasAttachmentYes(item)
        ? 'linear-gradient(135deg,#16a34a,#15803d)'
        : 'linear-gradient(135deg,#0ea5e9,#0284c7)';
    const attachBtns =
        '<div class="av-card-attach-btns">' +
        '<button type="button" class="btn-av-attach-icon" title="Attachments" ' +
        'style="background:' + attachBg + ';box-shadow:0 2px 8px rgba(14,165,233,0.35);" ' +
        'onclick="event.stopPropagation();OpenQuotationApprovalAttachment(\'' + EscHtml(String(code)) + '\', \'' + escNo + '\', \'' + escDt + '\')">' +
        '<i class="fa fa-paperclip"></i></button></div>';

    return (
        '<div class="pla-po-card section-entry-animation" data-code="' + EscHtml(String(code)) + '">' +
        '<div class="pla-po-card-header">' +
        '<div class="pla-po-no-badge">' +
        '<span style="font-size:0.6rem;font-weight:600;opacity:0.82;line-height:1;">Quotation#</span>' +
        '<span style="font-weight:800;font-size:0.82rem;line-height:1.2;">' + quotNo + '</span>' +
        '</div>' +
        '<div class="pla-po-card-vendor">' +
        '<div class="pla-po-vendor-name">' +
        '<i class="fa fa-building me-1" style="color:#667eea;font-size:0.72rem;"></i>' + party +
        '</div>' +
        '<div class="pla-po-card-meta">' +
        '<span><i class="fa fa-calendar-alt me-1"></i>' + (quotDate || '\u2014') + '</span>' +
        '<span class="pla-po-level-chip"><i class="fa fa-file-invoice me-1"></i>' + EscHtml(FrmAction || 'Verify') + '</span>' +
        '</div>' +
        '</div>' +
        '<div class="pla-po-card-right">' +
        '<div class="pla-po-amount">' + amount + '</div>' +
        '<div class="pla-po-status-badge">Pending</div>' +
        '</div>' +
        '</div>' +
        '<div class="pla-po-card-footer">' + attachBtns + actionBtn + '</div>' +
        '</div>'
    );
}

function RenderQuotationCards(list) {
    const container = document.getElementById('quotationPendingList');
    if (!list || list.length === 0) {
        container.innerHTML = '';
        ShowEmpty(true);
        return;
    }
    ShowEmpty(false);
    container.innerHTML = list.map(BuildQuotationCard).join('');
}

function QaPickQuotationField(quotation, rows, keys) {
    let val = quotation ? pickRowField(quotation, keys) : '';
    if ((!val || val === '') && rows && rows.length) {
        val = pickRowField(rows[0], keys);
    }
    return val || '';
}

function ShouldShowRateAsPerCostSheetInFC(quotation, rows) {
    if (G_RateAsPerCostSheet !== 'Y') return false;
    const quoteFor = QaPickQuotationField(quotation, rows, QA_QUOT_FOR_KEYS).trim().toUpperCase();
    const quoteAgainst = QaPickQuotationField(quotation, rows, QA_QUOT_AGAINST_KEYS).trim().toUpperCase();
    return quoteFor === 'EXPORT' && quoteAgainst === 'PRICE LIST';
}

function GetConversionRate(quotation, rows) {
    const raw = QaPickQuotationField(quotation, rows, QA_CONVERSION_RATE_KEYS);
    const n = parseFloat(String(raw || '').replace(/,/g, ''));
    return !isNaN(n) && n !== 0 ? n : 1;
}

function GetRateAsPerCostSheetFromRow(row) {
    if (row == null) return 0;
    if (row['Rate As Per Cost Sheet'] != null && row['Rate As Per Cost Sheet'] !== '') {
        return row['Rate As Per Cost Sheet'];
    }
    if (row.RateAsPerCostSheet != null && row.RateAsPerCostSheet !== '') {
        return row.RateAsPerCostSheet;
    }
    return 0;
}

function CalcRateAsPerCostSheetInFC(rateAsPerCostSheet, conversionRate) {
    const rate = parseFloat(String(rateAsPerCostSheet ?? '').replace(/,/g, ''));
    if (isNaN(rate)) return 0;
    const conv = conversionRate || 1;
    return Math.round((rate / conv) * 1000) / 1000;
}

function PrepareQuotationDetailRows(rows, quotation) {
    if (!rows || !rows.length) return [];
    const showFc = ShouldShowRateAsPerCostSheetInFC(quotation, rows);
    const conversionRate = GetConversionRate(quotation, rows);

    return rows.map(function (row) {
        const newRow = Object.assign({}, row);
        const rateCs = GetRateAsPerCostSheetFromRow(row);

        if (showFc) {
            // VB: Round(RateAsPerCostSheet / IIf(ConversionRate=0, 1, ConversionRate), 3)
            newRow['Rate As Per Cost Sheet In FC'] = CalcRateAsPerCostSheetInFC(rateCs, conversionRate);
        } else {
            delete newRow['Rate As Per Cost Sheet In FC'];
            delete newRow.RateAsPerCostSheetInFC;
        }
        return newRow;
    });
}

function OrderModalItemKeys(keys) {
    const fcKey = keys.find(function (k) { return QA_RATE_FC_KEYS.has(k); });
    const csKey = keys.find(function (k) { return QA_RATE_CS_KEYS.has(k); });
    if (!fcKey || !csKey) return keys;
    const ordered = keys.filter(function (k) { return k !== fcKey; });
    const csIdx = ordered.indexOf(csKey);
    if (csIdx === -1) {
        ordered.push(fcKey);
    } else {
        ordered.splice(csIdx + 1, 0, fcKey);
    }
    return ordered;
}

function GetModalItemKeys(rows, quotation) {
    if (!rows || !rows.length) return [];
    const hiddenKeys = new Set([
        'Code', 'ItemMaster_Code', 'itemsizemaster_Code',
        'QuotationFor', 'Quotation For',
        'QuotationAgainst', 'Quotation Against', 'OrderAgainst', 'Order Against',
        'ConversionRate', 'Conversion Rate'
    ]);
    const showFc = ShouldShowRateAsPerCostSheetInFC(quotation, rows);

    const keys = Object.keys(rows[0]).filter(function (k) {
        if (hiddenKeys.has(k)) return false;
        if (G_RateAsPerCostSheet !== 'Y' && QA_COST_SHEET_KEYS.has(k)) return false;
        if (!showFc && QA_RATE_FC_KEYS.has(k)) return false;
        return true;
    });
    return OrderModalItemKeys(keys);
}

function LoadCostSheetParameter() {
    return QuotationApprovalService.GetQuotationCostSheetParameter().then(function (res) {
        const row = Array.isArray(res) ? res[0] : res;
        let val = 'N';
        if (row) {
            val = row.RateAsPerCostSheet != null ? row.RateAsPerCostSheet
                : row.rateAsPerCostSheet != null ? row.rateAsPerCostSheet
                : row['Rate As Per Cost Sheet'] != null ? row['Rate As Per Cost Sheet']
                : 'N';
        }
        G_RateAsPerCostSheet = String(val || 'N').trim().toUpperCase();
    }).catch(function () {
        G_RateAsPerCostSheet = 'N';
    });
}

const QA_ITEM_NUMERIC = new Set([
    'Amount', 'Qty MT', 'Last Rate', 'Qty', 'Quantity', 'Rate',
    'Rate As Per Cost Sheet', 'RateAsPerCostSheet',
    'Rate As Per Cost Sheet In FC', 'RateAsPerCostSheetInFC',
]);
const QA_ITEM_HEAD = {
    sno: ['SNO', 'Sno', 'Sr No', 'SrNo'],
    item: ['Item Name', 'ItemName', 'ITEM NAME', 'Item', 'Description'],
};
const QA_ITEM_SKIP = new Set([
    'SNO', 'Sno', 'Sr No', 'SrNo', 'Item Name', 'ItemName', 'ITEM NAME', 'Item', 'Description',
]);

function BuildLineItemMobileCard(row, keys, index) {
    const sno = pickRowField(row, QA_ITEM_HEAD.sno) || String(index + 1);
    const itemName = pickRowField(row, QA_ITEM_HEAD.item) || 'Item';
    const detailKeys = keys.filter(function (k) { return !QA_ITEM_SKIP.has(k); });
    const gridHtml = detailKeys.map(function (k) {
        const val = row[k];
        if (val == null || val === '') return '';
        const isNum = QA_ITEM_NUMERIC.has(k);
        const lbl = QA_COST_SHEET_LABELS[k] || k;
        const full = lbl.length > 14 || String(val).length > 18 ? ' qa-li-mobile-kv--full' : '';
        return (
            '<div class="qa-li-mobile-kv' + full + '">' +
            '<span class="qa-li-mobile-lbl">' + EscHtml(lbl) + '</span>' +
            '<span class="qa-li-mobile-val' + (isNum ? ' is-num' : '') + '">' + EscHtml(String(val)) + '</span></div>'
        );
    }).join('');
    return (
        '<div class="qa-li-mobile-card">' +
        '<div class="qa-li-mobile-head">' +
        '<span class="qa-li-mobile-sno">#' + EscHtml(String(sno)) + '</span>' +
        '<span class="qa-li-mobile-item">' + EscHtml(itemName) + '</span></div>' +
        (gridHtml ? '<div class="qa-li-mobile-grid">' + gridHtml + '</div>' : '') +
        '</div>'
    );
}

function pickRowField(row, keys) {
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (Object.prototype.hasOwnProperty.call(row, k)) {
            const v = row[k];
            if (v != null && v !== '') return String(v);
        }
    }
    return '';
}

function RenderModalItems(rows, quotation) {
    const tbody = document.getElementById('table-body-Quotation');
    const thead = document.getElementById('table-header-Quotation');
    const mobileEl = document.getElementById('qaLineItemsMobile');
    const preparedRows = PrepareQuotationDetailRows(rows, quotation);

    if (!preparedRows || preparedRows.length === 0) {
        thead.innerHTML = '';
        tbody.innerHTML =
            '<tr><td colspan="6" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No line items found.</td></tr>';
        if (mobileEl) {
            mobileEl.innerHTML = '<div class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No line items found.</div>';
        }
        return;
    }

    const keys = GetModalItemKeys(preparedRows, quotation);

    thead.innerHTML = '<tr>' + keys.map(function (k) {
        const header = QA_COST_SHEET_LABELS[k] || k;
        return '<th>' + EscHtml(header) + '</th>';
    }).join('') + '</tr>';

    tbody.innerHTML = preparedRows.map(function (row) {
        return '<tr>' + keys.map(function (k) {
            const val = row[k] == null ? '' : row[k];
            const align = QA_ITEM_NUMERIC.has(k) ? ' style="text-align:right;"' : '';
            return '<td' + align + '>' + EscHtml(String(val)) + '</td>';
        }).join('') + '</tr>';
    }).join('');

    if (mobileEl) {
        mobileEl.innerHTML = preparedRows.map(function (row, idx) {
            return BuildLineItemMobileCard(row, keys, idx);
        }).join('');
    }

    const tableWrap = document.querySelector('#myModal .qa-items-table-wrap');
    if (tableWrap) tableWrap.scrollTop = 0;
}

function OpenReviewModal(code) {
    G_CurrentQuotation = G_QuotationList.find(function (q) { return String(q.Code) === String(code); });
    if (!G_CurrentQuotation) return;

    const quotNo = G_CurrentQuotation['Quotation No'] || G_CurrentQuotation.QuotationNo || '\u2014';
    const party = G_CurrentQuotation.Party || G_CurrentQuotation.PartyName || G_CurrentQuotation['Party Name'] || '\u2014';
    const quotDate = FmtDateDisplay(G_CurrentQuotation['Quotation Date'] || G_CurrentQuotation.QuotationDate);
    const amount = FmtCurrency(G_CurrentQuotation['Total Amount'] || G_CurrentQuotation.TotalAmount || G_CurrentQuotation.Amount || 0);
    const canAction = !!G_CurrentQuotation.Action;

    document.getElementById('modalQuotationTitle').textContent =
        'Quotation# ' + quotNo + (party && party !== '\u2014' ? ' \u2014 ' + party : '');
    const od = String(quotDate || '').trim();
    if (od) {
        document.getElementById('modalQuotationDate').textContent = od;
        document.getElementById('modalQuotationDateWrap').style.display = '';
    } else {
        document.getElementById('modalQuotationDate').textContent = '';
        document.getElementById('modalQuotationDateWrap').style.display = 'none';
    }
    document.getElementById('hfQuotationCode').value = code;
    SyncQuotationModalAttachmentButton(G_CurrentQuotation);

    document.getElementById('modalQuotationHeader').innerHTML =
        '<div class="pla-info-grid">' +
        BuildInfoItem('Total Amount', amount, 'fa-rupee-sign', '#667eea') +
        BuildInfoItem('Action', EscHtml(FrmAction || 'Verify'), 'fa-check-double') +
        BuildInfoItem('Status', 'Pending', 'fa-info-circle') +
        '</div>';

    document.getElementById('btnQuotationVerifyLabel').textContent = VerifyButtonLabel();
    document.getElementById('btnQuotationVerify').style.display = canAction ? '' : 'none';

    document.getElementById('table-header-Quotation').innerHTML = '';
    document.getElementById('table-body-Quotation').innerHTML =
        '<tr><td colspan="6" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">' +
        '<i class="fa fa-spinner fa-spin me-1"></i>Loading items\u2026</td></tr>';
    const mobileEl = document.getElementById('qaLineItemsMobile');
    if (mobileEl) {
        mobileEl.innerHTML = '<div class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">' +
            '<i class="fa fa-spinner fa-spin me-1"></i>Loading items\u2026</div>';
    }

    $('#myModal').modal({ backdrop: 'static', keyboard: true });
    $('#myModal').modal('show');

    QuotationApprovalService.GetQuotationDetail(code).then(function (response) {
        RenderModalItems(response && response.length > 0 ? response : [], G_CurrentQuotation);
    }).catch(function () {
        document.getElementById('table-body-Quotation').innerHTML =
            '<tr><td colspan="6" class="text-center py-3" style="color:#ef4444;font-size:0.82rem;">' +
            '<i class="fa fa-exclamation-triangle me-1"></i>Error loading items.</td></tr>';
        const mobileEl = document.getElementById('qaLineItemsMobile');
        if (mobileEl) {
            mobileEl.innerHTML = '<div class="text-center py-3" style="color:#ef4444;font-size:0.82rem;">' +
                '<i class="fa fa-exclamation-triangle me-1"></i>Error loading items.</div>';
        }
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
        document.getElementById('qaPageTitle').textContent = menuValue;
    } else {
        $('#ERPHeading').text('Quotation Approval');
    }

    document.getElementById('btnQuotationVerifyLabel').textContent = VerifyButtonLabel();
    LoadCostSheetParameter().then(function () {
        GetApprovedQuotationList();
    });

    $('#myModal').on('shown.bs.modal', function () {
        document.body.style.overflow = 'hidden';
        const wrap = document.querySelector('#myModal .qa-items-table-wrap');
        if (wrap) wrap.scrollTop = 0;
    });
    $('#myModal').on('hidden.bs.modal', function () {
        document.body.style.overflow = '';
    });
});

function GetApprovedQuotationList() {
    ShowLoading(true);
    ShowEmpty(false);
    document.getElementById('quotationPendingList').innerHTML = '';

    QuotationApprovalService.GetUnApprovedQuotation(FrmAction).then(function (resData) {
        ShowLoading(false);
        if (resData && resData.length > 0) {
            G_QuotationList = resData;
            UpdateStatChips();
            RenderQuotationCards(G_QuotationList);
        } else {
            G_QuotationList = [];
            UpdateStatChips();
            RenderQuotationCards([]);
            toastr.error('No data available');
        }
    }).catch(function () {
        ShowLoading(false);
        G_QuotationList = [];
        UpdateStatChips();
        RenderQuotationCards([]);
        toastr.error('Error loading quotations');
    });
}

function CloseModal() {
    G_CurrentQuotation = null;
    $('#myModal').modal('hide');
    document.body.style.overflow = '';
    document.getElementById('modalQuotationDate').textContent = '';
    document.getElementById('modalQuotationDateWrap').style.display = 'none';
}

function QuotationApprovedlist(code) {
    if (!code) return;
    QuotationApprovalService.QuotationApproved(code, FrmAction, FrmType).then(function (resdata) {
        if (resdata.Status === 'Y') {
            toastr.success(resdata.Msg);
            CloseModal();
            GetWebNotificationList();
            GetApprovedQuotationList();
        } else {
            toastr.error(resdata.Msg);
        }
    }).catch(function (error) {
        toastr.error('Error in Quotation Approval: ', error);
    });
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
window.QuotationApprovedlist = QuotationApprovedlist;
window.OpenQuotationApprovalAttachment = OpenQuotationApprovalAttachment;
window.OpenQuotationApprovalAttachmentFromModal = OpenQuotationApprovalAttachmentFromModal;
