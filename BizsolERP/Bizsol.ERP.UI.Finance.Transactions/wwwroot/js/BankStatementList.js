import { BankStatementService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BankStatementService.js';
import { GRNPaymentApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/GRNPaymentEntryService.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');

/** Pending reconciliation toggle after user confirms modal */
var reconPendingCode = 0;
var reconPendingToYes = false;
var reconPendingGrnMasterCode = 0;
/** Second modal: delete linked GRN then clear bank row link */
var grnDeletePendingBankCode = 0;
var grnDeletePendingGrnCode = 0;
/** Reconcile choice (No): pick list vs new payment form */
var pendingBsGrnChoiceCode = 0;
var pendingBsGrnEmbedCtx = null;

/** Backdrops live in #modern-content (offset by sidebar); mount on body for full-viewport overlay. */
var BS_BACKDROP_IDS = [
    'bsImportBackdrop', 'bsGrnPaymentEmbedBackdrop', 'bsReconcileChoiceBackdrop',
    'bsReconConfirmBackdrop', 'bsGrnAutoMatchConfirmBackdrop', 'bsGrnUnreconcileDeleteBackdrop',
    'bsResultBackdrop', 'bsDeleteBackdrop', 'bsHistoryDetailBackdrop'
];

function mountBankStatementModalsToBody() {
    BS_BACKDROP_IDS.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode !== document.body) {
            document.body.appendChild(el);
        }
    });
}

function syncBankStatementModalScrollLock() {
    var anyOpen = BS_BACKDROP_IDS.some(function (id) {
        var el = document.getElementById(id);
        return el && el.classList.contains('active');
    });
    document.body.classList.toggle('bs-page-modal-open', anyOpen);
}

function showBsBackdrop(sel) {
    mountBankStatementModalsToBody();
    var $el = sel instanceof jQuery ? sel : $(sel);
    $el.addClass('active').attr('aria-hidden', 'false');
    syncBankStatementModalScrollLock();
}

function hideBsBackdrop(sel) {
    var $el = sel instanceof jQuery ? sel : $(sel);
    $el.removeClass('active').attr('aria-hidden', 'true');
    syncBankStatementModalScrollLock();
}

window.mountBankStatementModalsToBody = mountBankStatementModalsToBody;
window.showBsBackdrop = showBsBackdrop;
window.hideBsBackdrop = hideBsBackdrop;

// ── Date helpers (same pattern as ProjectMaster) ──────────────────────────────
function formatDate(date) {
    var day   = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year  = date.getFullYear();
    return year + '-' + month + '-' + day;
}

function isoToApiDate(val) {
    if (!val || !val.trim()) return '';
    var parts = val.split('-');
    if (parts.length !== 3) return '';
    return parts[2] + '/' + parts[1] + '/' + parts[0];
}

/** Calendar day before yyyy-mm-dd (local); null if invalid. */
function prevCalendarDayIso(ymd) {
    if (!ymd || !String(ymd).trim()) return null;
    var p = String(ymd).trim().split('-');
    if (p.length !== 3) return null;
    var y = parseInt(p[0], 10), mo = parseInt(p[1], 10) - 1, d = parseInt(p[2], 10);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
    var dt = new Date(y, mo, d, 0, 0, 0);
    if (isNaN(dt.getTime())) return null;
    dt.setDate(dt.getDate() - 1);
    return formatDate(dt);
}

var _MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/** Parse amount from API (number or string, strip thousands separators). */
function cleanAmount(v) {
    if (v == null || v === '') return NaN;
    return parseFloat(String(v).replace(/,/g, '').trim());
}

/** Two-decimal rupee amount (matches bank paise; avoids float drift in running balance). */
function roundMoney(n) {
    if (n == null || n === '') return NaN;
    var x = typeof n === 'number' ? n : parseFloat(String(n).replace(/,/g, '').trim());
    if (!isFinite(x) || isNaN(x)) return NaN;
    return Math.round(x * 100) / 100;
}

/** Whole paise for Σ(amounts); avoids binary float drift on many rows (e.g. 1.98 + 1.98 → 396, not 3.959999…). */
function moneyToPaisa(m) {
    var r = roundMoney(m);
    if (!isFinite(r) || isNaN(r)) return 0;
    return Math.round(r * 100);
}

function paisaToMoney(p) {
    var n = Math.round(p);
    return n / 100;
}

/** Parse display/API date string → ISO (same rules as BankStatementImport). */
function ConvertToIsoDate(str) {
    if (!str || !str.trim()) return null;
    str = String(str).trim();
    var d, mo, y, dt;

    var m1 = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (m1) {
        d = parseInt(m1[1], 10); mo = parseInt(m1[2], 10); y = parseInt(m1[3], 10);
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12)
            return new Date(y, mo - 1, d, 0, 0, 0).toISOString();
    }

    var m2 = str.match(/^(\d{1,2})[\-\/\s]([A-Za-z]{3,9})[\-\/\s](\d{2,4})$/);
    if (m2) {
        d  = parseInt(m2[1], 10);
        mo = _MON[(m2[2]).toLowerCase().substring(0, 3)];
        y  = parseInt(m2[3], 10);
        if (y < 100) y += 2000;
        if (mo && d >= 1 && d <= 31)
            return new Date(y, mo - 1, d, 0, 0, 0).toISOString();
    }

    var m3 = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/);
    if (m3) {
        d = parseInt(m3[1], 10); mo = parseInt(m3[2], 10); y = parseInt(m3[3], 10) + 2000;
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12)
            return new Date(y, mo - 1, d, 0, 0, 0).toISOString();
    }

    var m4 = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (m4) {
        y = parseInt(m4[1], 10); mo = parseInt(m4[2], 10); d = parseInt(m4[3], 10);
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12)
            return new Date(y, mo - 1, d, 0, 0, 0).toISOString();
    }

    dt = new Date(str);
    if (!isNaN(dt.getTime())) return dt.toISOString();
    return null;
}

// ── Default date range: 1st of current month → today (same style as other reports) ──
function setDefaultFilterDates() {
    var now = new Date();
    var first = new Date(now.getFullYear(), now.getMonth(), 1);
    $('#txtFilterFromDate').val(formatDate(first));
    $('#txtFilterToDate').val(formatDate(now));
}

// ── Init ──────────────────────────────────────────────────────────────────────
function isRowReconciled(row) {
    var ir = row && row.IsReconciled;
    if (ir === true || ir === 1) return true;
    if (ir == null || ir === '') return false;
    var u = String(ir).trim().toUpperCase();
    return u === 'Y' || u === 'C';
}

/** IsManualReconciled = Y from API (manual reconcile via No -> existing / new payment on this screen). */
function isManualReconciledRow(row) {
    var mr = row && (row.IsManualReconciled != null ? row.IsManualReconciled : row.isManualReconciled);
    return mr === 'Y' || mr === true || mr === 1
        || (mr != null && String(mr).toUpperCase() === 'Y');
}

/** Manual reconcile from Bank Statement list (uses IsManualReconciled from DB, not Auto Match GRN). */
function isManualReconciledImportRow(row) {
    return isManualReconciledRow(row);
}

/** When focused reconciliation filters are selected: hide deposit & closing summaries. */
function syncBankStatementColumnVisibility() {
    var mode = String($('#ddlFilterStatement').val() || 'All').trim();
    var hideFin = mode === 'Unreconciled' || mode === 'BankStatement' || mode === 'ImportReconciled';
    $('#cardList').toggleClass('bs-stmt-hide-fin-summary', !!hideFin);
}

/** Statement filter: All | Unreconciled | BankStatement | ImportReconciled (IsManualReconciled = Y). */
function applyStatementFilter(list) {
    var mode = String($('#ddlFilterStatement').val() || 'All').trim();
    if (!list || !list.length) return list || [];
    if (mode === 'Unreconciled') {
        return list.filter(function (row) { return !isRowReconciled(row); });
    }
    if (mode === 'BankStatement') {
        return list.filter(function (row) { return isRowReconciled(row); });
    }
    if (mode === 'ImportReconciled') {
        return list.filter(function (row) { return isManualReconciledImportRow(row); });
    }
    return list;
}

$(document).ready(function () {
    mountBankStatementModalsToBody();
    setDefaultFilterDates();
    $('#ddlFilterStatement').val('All');
    BindEvents();
    syncBankStatementColumnVisibility();
    LoadBankMasterDropdown()
        .then(function () {
            initBankSelect2();
            LoadStatements();
        })
        .catch(function () {
            $('#ddlFilterBank').html('<option value="All">All banks</option>');
            initBankSelect2();
            LoadStatements();
        });
});

function getBatchNoFromUrl() {
    return (new URLSearchParams(window.location.search).get('BatchNo') || '').trim();
}

function LoadBankMasterDropdown() {
    return BankStatementService.GetBankMasterList()
        .then(function (data) {
            var list = Array.isArray(data) ? data
                     : (Array.isArray(data && data.data) ? data.data
                     : (Array.isArray(data && data.Data) ? data.Data : []));
            var $ddl = $('#ddlFilterBank');
            $ddl.empty();
            $ddl.append($('<option></option>').val('All').text('All banks'));
            if (list && list.length) {
                $.each(list, function (i, b) {
                    var code = b.Code || b.BankMaster_Code || 0;
                    if (!code) return;
                    var name = (b.BankName || '').trim();
                    var short = b.BankShortCode ? ' (' + b.BankShortCode + ')' : '';
                    $ddl.append($('<option></option>').val(String(code)).text(name + short));
                });
            }
        });
}

/**
 * Select2 multi-select (StockAgeingReport pattern): "All" clears other picks; picking a bank drops "All".
 */
function initBankSelect2() {
    var $ddl = $('#ddlFilterBank');
    if (typeof $.fn.select2 === 'undefined') {
        $ddl.attr('multiple', 'multiple');
        $ddl.val(['All']);
        return;
    }
    if ($ddl.hasClass('select2-hidden-accessible')) {
        $ddl.select2('destroy');
    }
    $ddl.select2({
        width: '100%',
        multiple: true,
        allowClear: true
    });
    $ddl.val(['All']).trigger('change');
    $ddl.off('select2:select').on('select2:select', function (e) {
        var id = e.params && e.params.data && e.params.data.id;
        if (id === 'All') {
            $(this).val(['All']).trigger('change');
        } else {
            var selected = $(this).val() || [];
            if (selected.indexOf('All') >= 0) {
                $(this).val(selected.filter(function (v) { return v !== 'All'; })).trigger('change');
            }
        }
    });
}

/** Bank codes to send; [] = all banks. Uses Select2 (or raw select) "All" option. */
function getSelectedBankCodes() {
    var raw = $('#ddlFilterBank').val();
    if (raw == null) return [];
    if (!Array.isArray(raw)) raw = [String(raw)];
    if (raw.indexOf('All') >= 0 || raw.length === 0) return [];
    return raw.map(function (s) { return parseInt(s, 10) || 0; }).filter(function (c) { return c > 0; });
}

function mergeStatementLists(arrOfLists) {
    var byCode = {};
    (arrOfLists || []).forEach(function (list) {
        (list || []).forEach(function (row) {
            var c = row && row.Code;
            if (c != null && c !== '' && byCode[c] == null) byCode[c] = row;
        });
    });
    return Object.keys(byCode).map(function (k) { return byCode[k]; });
}

function BindEvents() {
    $('#btnSearch').on('click', function () { LoadStatements(); });
    $('#btnRefreshList').on('click', function () { LoadStatements(); });
    $('#btnAutoReconcileGrn').on('click', function () {
        openGrnAutoMatchConfirmModal();
    });
    $('#btnGrnAutoMatchConfirmCancel').off('click.bsGrnAutoConf').on('click.bsGrnAutoConf', function () {
        closeGrnAutoMatchConfirmModal();
    });
    $('#btnGrnAutoMatchConfirmOk').off('click.bsGrnAutoConf').on('click.bsGrnAutoConf', function () {
        confirmGrnAutoMatchPending();
    });
    $('#bsGrnAutoMatchConfirmBackdrop').off('click.bsGrnAutoConf').on('click.bsGrnAutoConf', function (e) {
        if (e.target === this) closeGrnAutoMatchConfirmModal();
    });
    $('#btnClearFilter').on('click', function () {
        setDefaultFilterDates();
        $('#ddlFilterStatement').val('All');
        var $b = $('#ddlFilterBank');
        if (typeof $b.select2 === 'function' && $b.hasClass('select2-hidden-accessible')) {
            $b.val(['All']).trigger('change');
        } else {
            $b.val(['All']);
        }
        history.replaceState(null, '', window.location.pathname);
        LoadStatements();
    });
    $('#btnImportNew').on('click', function () {
        var $b = $('#bsImportBackdrop');
        if ($b.length) {
            showBsBackdrop($b);
            setTimeout(function () { $('#btnRefreshHistory').trigger('click'); }, 0);
        } else {
            window.location = baseUrl + '/FinanceTransactions/BankStatement/BankStatementUpload';
        }
    });

    $('#txtFilterFromDate, #txtFilterToDate').on('keydown', function (e) {
        if (e.key === 'Enter') LoadStatements();
    });
    $('#ddlFilterStatement').on('keydown', function (e) {
        if (e.key === 'Enter') LoadStatements();
    });
    $('#ddlFilterStatement').on('change', function () {
        syncBankStatementColumnVisibility();
    });

    $('#tblStatementsBody').off('click.bsReconTog').on('click.bsReconTog', '.bs-recon-toggle', function (e) {
        e.preventDefault();
        var $b = $(this);
        var code = parseInt($b.attr('data-code') || '0', 10);
        var rc = String($b.attr('data-recon') || '').toUpperCase();
        var isYes = rc === 'Y' || rc === 'C';
        if (!code) return;
        if (isYes) {
            /* Yes → unreconcile: show details when bank row is linked to GRNPaymentMaster_Code */
            var grn = parseInt($b.attr('data-grn-master') || '0', 10) || 0;
            openReconConfirmModal(code, false, grn);
        } else {
            /* No → choose: existing payment list vs new payment (prefill from row) */
            var wRaw = $b.attr('data-bs-withdraw');
            var wNum = parseFloat(String(wRaw || '').replace(/,/g, ''));
            if (!Number.isFinite(wNum)) wNum = 0;
            var narrEnc = $b.attr('data-bs-narr-enc') || '';
            var refEnc = $b.attr('data-bs-ref-enc') || '';
            var txnEnc = $b.attr('data-bs-txn-enc') || '';
            var bankMc = parseInt(String($b.attr('data-bs-bank-master') || '0'), 10) || 0;
            var bankNameEnc = $b.attr('data-bs-bank-name-enc') || '';
            var acctEnc = $b.attr('data-bs-acct-enc') || '';
            pendingBsGrnEmbedCtx = {
                withdrawal: wNum,
                narration: narrEnc ? decodeURIComponent(narrEnc) : '',
                chequeRef: refEnc ? decodeURIComponent(refEnc) : '',
                txnDate: txnEnc ? decodeURIComponent(txnEnc) : '',
                bankMaster_Code: bankMc,
                bankName: bankNameEnc ? decodeURIComponent(bankNameEnc) : '',
                accountNo: acctEnc ? decodeURIComponent(acctEnc) : ''
            };
            pendingBsGrnChoiceCode = code;
            openBankStmtReconcileChoiceModal();
        }
    });

    if (!window.__bizsolBsGrnEmbedMsgBound) {
        window.__bizsolBsGrnEmbedMsgBound = true;
        window.addEventListener('message', onBankStmtGrnEmbedChildMessage);
    }

    $('#btnReconConfirmCancel').off('click.bsReconConf').on('click.bsReconConf', function () {
        closeReconConfirmModal();
    });
    $('#btnReconConfirmOk').off('click.bsReconConf').on('click.bsReconConf', function () {
        confirmReconPending();
    });
    $('#bsReconConfirmBackdrop').off('click.bsReconConf').on('click.bsReconConf', function (e) {
        if (e.target === this) closeReconConfirmModal();
    });

    $('#btnGrnUnreconcileDeleteCancel').off('click.bsGrnDelConf').on('click.bsGrnDelConf', function () {
        confirmGrnDeleteSecondCancel();
    });
    $('#btnGrnUnreconcileDeleteOk').off('click.bsGrnDelConf').on('click.bsGrnDelConf', function () {
        confirmGrnDeleteSecond();
    });
    $('#bsGrnUnreconcileDeleteBackdrop').off('click.bsGrnDelConf').on('click.bsGrnDelConf', function (e) {
        if (e.target === this) confirmGrnDeleteSecondCancel();
    });

    $('#btnCloseGrnPaymentEmbed').off('click.bsGrnEmbed').on('click.bsGrnEmbed', function () {
        closeGrnPaymentEmbedModal();
    });
    $('#bsGrnPaymentEmbedBackdrop').off('click.bsGrnEmbed').on('click.bsGrnEmbed', function (e) {
        if (e.target === this) closeGrnPaymentEmbedModal();
    });

    $('#btnBsReconcileChoiceCancel').off('click.bsReconCh').on('click.bsReconCh', function () {
        closeBankStmtReconcileChoiceModal();
    });
    $('#btnBsReconcileChoiceExisting').off('click.bsReconCh').on('click.bsReconCh', function () {
        try {
            sessionStorage.removeItem('BizsolBankStmtGrnEmbed');
        } catch (e) { /* ignore */ }
        loadBsPendingGrnListInModal();
    });
    $('#btnBsReconcileExistingBack').off('click.bsReconCh').on('click.bsReconCh', function () {
        backBsReconcileChoiceFromList();
    });
    $('#btnBsReconcileChoiceCancelFromList').off('click.bsReconCh').on('click.bsReconCh', function () {
        closeBankStmtReconcileChoiceModal();
    });
    $('#bsReconcileChoiceBackdrop').off('click.bsGrnRecon', '.btn-bs-grn-reconcile').on('click.bsGrnRecon', '.btn-bs-grn-reconcile', function (ev) {
        ev.preventDefault();
        var $t = $(this);
        var grn = parseInt(String($t.attr('data-grn-code') || '0'), 10) || 0;
        var bc = parseInt(String($t.attr('data-bank-stmt-code') || '0'), 10) || pendingBsGrnChoiceCode || 0;
        if (!grn || !bc) {
            toastr && toastr.warning('Invalid selection.');
            return;
        }
        linkBankStatementLineToGrnAndRefresh(bc, grn, { closeGrnEmbed: false, closeReconcileChoice: true });
    });
    $('#btnBsReconcileChoiceNew').off('click.bsReconCh').on('click.bsReconCh', function () {
        var c = pendingBsGrnChoiceCode;
        var ctxSnapshot = pendingBsGrnEmbedCtx ? $.extend({}, pendingBsGrnEmbedCtx) : null;
        if (pendingBsGrnEmbedCtx) {
            try {
                sessionStorage.setItem('BizsolBankStmtGrnEmbed', JSON.stringify(pendingBsGrnEmbedCtx));
            } catch (se) { /* ignore */ }
        }
        pendingBsGrnEmbedCtx = null;
        closeBankStmtReconcileChoiceModal();
        if (c) openGrnPaymentEmbedModal(c, { wantNewForm: true, embedCtx: ctxSnapshot });
    });
    $('#bsReconcileChoiceBackdrop').off('click.bsReconCh').on('click.bsReconCh', function (e) {
        if (e.target === this) closeBankStmtReconcileChoiceModal();
    });

    $(document).off('keydown.bsReconConfirm').on('keydown.bsReconConfirm', function (e) {
        if (e.key !== 'Escape') return;
        if ($('#bsReconcileChoiceBackdrop').hasClass('active')) {
            e.preventDefault();
            if ($('#bsReconcileChoiceBackdrop').attr('data-bs-recon-step') === 'list') {
                backBsReconcileChoiceFromList();
            } else {
                closeBankStmtReconcileChoiceModal();
            }
            return;
        }
        if ($('#bsGrnPaymentEmbedBackdrop').hasClass('active')) {
            e.preventDefault();
            closeGrnPaymentEmbedModal();
            return;
        }
        if ($('#bsGrnUnreconcileDeleteBackdrop').hasClass('active')) {
            e.preventDefault();
            confirmGrnDeleteSecondCancel();
            return;
        }
        if ($('#bsGrnAutoMatchConfirmBackdrop').hasClass('active')) {
            e.preventDefault();
            closeGrnAutoMatchConfirmModal();
            return;
        }
        if ($('#bsReconConfirmBackdrop').hasClass('active')) {
            e.preventDefault();
            closeReconConfirmModal();
        }
    });
}

function openBankStmtReconcileChoiceModal() {
    resetBsReconcileChoiceModalUi();
    showBsBackdrop('#bsReconcileChoiceBackdrop');
}

function closeBankStmtReconcileChoiceModal() {
    hideBsBackdrop('#bsReconcileChoiceBackdrop');
    resetBsReconcileChoiceModalUi();
    pendingBsGrnChoiceCode = 0;
    pendingBsGrnEmbedCtx = null;
}

/**
 * GRN Payment Entry in iframe. wantNewForm true → new payment (openNew=1) + sessionStorage prefill;
 * false → pending payment list (second screen in flow).
 * embedCtx: bank / amount copied onto query string so the iframe always receives them (sessionStorage can differ by frame).
 */
function openGrnPaymentEmbedModal(bankStatementCode, opts) {
    opts = opts || {};
    var wantNew = opts.wantNewForm === true;
    var ctx = opts.embedCtx || null;
    var root = (baseUrl || '').replace(/\/$/, '');
    var url = root + '/PurchaseTransactions/GRNPaymentApproval/GRNPaymentApproval'
        + '?bankStatementCode=' + encodeURIComponent(String(bankStatementCode || 0))
        + '&embedded=1'
        + (wantNew ? '&openNew=1' : '');
    if (wantNew && ctx) {
        var bmc = parseInt(String(ctx.bankMaster_Code != null ? ctx.bankMaster_Code : (ctx.BankMaster_Code != null ? ctx.BankMaster_Code : 0)), 10) || 0;
        if (bmc > 0) {
            url += '&embedBankMasterCode=' + encodeURIComponent(String(bmc));
        }
        var bn = String(ctx.bankName != null ? ctx.bankName : (ctx.BankName != null ? ctx.BankName : '')).trim();
        if (bn) {
            url += '&embedBankName=' + encodeURIComponent(bn);
        }
        var wv = ctx.withdrawal != null ? ctx.withdrawal : ctx.withdrawalAmt;
        if (wv != null && String(wv).trim() !== '') {
            var wStr = String(wv).replace(/,/g, '');
            if (!isNaN(parseFloat(wStr)) && parseFloat(wStr) > 0) {
                url += '&embedWithdrawal=' + encodeURIComponent(wStr);
            }
        }
    }
    $('#iframeBankStmtGrnEmbed').attr('src', url);
    showBsBackdrop('#bsGrnPaymentEmbedBackdrop');
}

function closeGrnPaymentEmbedModal() {
    $('#iframeBankStmtGrnEmbed').attr('src', 'about:blank');
    hideBsBackdrop('#bsGrnPaymentEmbedBackdrop');
    try {
        sessionStorage.removeItem('BizsolBankStmtGrnEmbed');
    } catch (e) { /* ignore */ }
}

/**
 * Link bank statement line to GRN payment master and mark reconciled (same chain as post-iframe save).
 * opts.closeGrnEmbed (default true): close payment iframe when done.
 * opts.closeReconcileChoice: close reconcile choice modal when done (in-modal pending list flow).
 */
function linkBankStatementLineToGrnAndRefresh(bankStmtCode, grnPaymentMasterCode, opts) {
    opts = opts || {};
    var closeEmb = opts.closeGrnEmbed !== false;
    var closeChoice = opts.closeReconcileChoice === true;

    var bc = parseInt(String(bankStmtCode || '0'), 10) || 0;
    var grn = parseInt(String(grnPaymentMasterCode || '0'), 10) || 0;
    if (!bc) {
        toastr && toastr.warning('Missing bank statement record.');
        return;
    }

    Showloader && Showloader();

    function finishOk(msg) {
        HideLoader && HideLoader();
        var text = msg || 'Bank line reconciled.';
        toastr && toastr.success(text, 'Reconciled');
        if (closeEmb) closeGrnPaymentEmbedModal();
        if (closeChoice) closeBankStmtReconcileChoiceModal();
        LoadStatements();
    }

    function finishErr(msg) {
        HideLoader && HideLoader();
        toastr && toastr.error(msg || 'Could not update bank statement.');
    }

    var tryLink = grn > 0
        ? BankStatementService.LinkAndReconcileBankStatement(bc, grn)
        : Promise.reject(new Error('no-grn'));

    tryLink
        .then(function (r) {
            if (isApiResultOk(r)) {
                finishOk((r && (r.Msg || r.msg)) || '');
                return;
            }
            finishErr((r && (r.Msg || r.msg || r.message)) || 'Could not reconcile: validation failed or server rejected the link.');
        })
        .catch(function () {
            finishErr('Reconcile request failed.');
        });
}

/** Iframe Payment Entry saved — link GRN code on bank row, mark reconciled, close embed. */
function onBankStmtGrnEmbedChildMessage(ev) {
    var d = ev && ev.data;
    if (!d || d.type !== 'bizsol:bankStmtGrnSaved') return;
    if (ev.origin && window.location.origin && ev.origin !== window.location.origin) return;
    var bc = parseInt(String(d.bankStatementCode || '0'), 10) || 0;
    if (!bc) return;
    var grn = parseInt(String(d.grnPaymentMasterCode || d.grnPaymentMaster_Code || '0'), 10) || 0;
    linkBankStatementLineToGrnAndRefresh(bc, grn, { closeGrnEmbed: true, closeReconcileChoice: false });
}

function openGrnAutoMatchConfirmModal() {
    showBsBackdrop('#bsGrnAutoMatchConfirmBackdrop');
}

function closeGrnAutoMatchConfirmModal() {
    hideBsBackdrop('#bsGrnAutoMatchConfirmBackdrop');
}

function confirmGrnAutoMatchPending() {
    closeGrnAutoMatchConfirmModal();
    Showloader && Showloader();
    BankStatementService.AutoReconcileFromGrn()
        .then(function (r) {
            HideLoader && HideLoader();
            if (isApiResultOk(r)) {
                var msg = (r && (r.Msg || r.msg || r.Message)) || 'Done.';
                toastr && toastr.success(msg);
                LoadStatements();
            } else {
                toastr && toastr.error((r && (r.Msg || r.msg || r.Message)) || 'Auto-match could not complete.');
            }
        })
        .catch(function () {
            HideLoader && HideLoader();
            toastr && toastr.error('Auto-match request failed.');
        });
}

function peelGrnRootForBs(res) {
    if (!res) return null;
    var r = res;
    if (r.data != null) r = r.data;
    if (r.Data != null) r = r.Data;
    return r;
}

/** Same row unwrapping as GRNPaymentEntry.normalizeApiRows (GET GetGRNPaymentApprovalList). */
function bsNormalizeGrnListApiRows(result) {
    if (Array.isArray(result)) return result;
    if (!result || typeof result !== 'object') return [];
    var datum = result.Data != null ? result.Data : result.data;
    if (datum != null && typeof datum === 'object' && !Array.isArray(datum)) {
        var inner = bsNormalizeGrnListApiRows(datum);
        if (inner.length) return inner;
    }
    if (Array.isArray(result.SubProjectList)) return result.SubProjectList;
    if (Array.isArray(result.subProjectList)) return result.subProjectList;
    if (Array.isArray(result.ProjectList)) return result.ProjectList;
    if (Array.isArray(result.projectList)) return result.projectList;
    if (Array.isArray(result.Table)) return result.Table;
    if (Array.isArray(result.table)) return result.table;
    if (Array.isArray(result.data)) return result.data;
    if (Array.isArray(result.Data)) return result.Data;
    if (Array.isArray(result.Result)) return result.Result;
    if (Array.isArray(result.result)) return result.result;
    if (Array.isArray(result.value)) return result.value;
    if (Array.isArray(result.Value)) return result.Value;
    if (Array.isArray(result.List)) return result.List;
    if (Array.isArray(result.list)) return result.list;
    var nested = result.Items != null ? result.Items : (result.items != null ? result.items
        : (result.Details != null ? result.Details : (result.details != null ? result.details
            : (result.Lines != null ? result.Lines : result.lines))));
    if (Array.isArray(nested)) return nested;
    if (result && typeof result === 'object' && !Array.isArray(result)) {
        var billish = result.BillNo != null || result.billNo != null || result.BillAmount != null || result.billAmount != null;
        var payLine =
            result.PaymentAmount != null || result.paymentAmount != null
            || result.MRNMaster_Code != null || result.mRNMaster_Code != null || result.mrnMaster_Code != null
            || result.GRNPaymentMaster_Code != null || result.gRNPaymentMaster_Code != null
            || result.GRNPaymentDetail_Code != null || result.GRNPaymentDetails_Code != null
            || result.DetailCode != null || result.detailCode != null
            || (result.Code !== undefined && result.Code !== null && (result.GRNPaymentMaster_Code != null || result.gRNPaymentMaster_Code != null)
                && (result.MRNMaster_Code != null || result.mRNMaster_Code != null || result.mrnMaster_Code != null));
        var ddlBillNoListRow =
            (result.Code !== undefined && result.Code !== null)
            && (result.BillDate != null || result.billDate != null
                || result.TotalBillAmountManual != null || result.totalBillAmountManual != null
                || result.NetPayable != null || result.netPayable != null
                || result.Name != null || result.name != null);
        if (billish || payLine || ddlBillNoListRow) return [result];
    }
    if (result && typeof result === 'object' && !Array.isArray(result)) {
        var keys = Object.keys(result);
        for (var ki = 0; ki < keys.length; ki++) {
            var arr = result[keys[ki]];
            if (!Array.isArray(arr) || !arr.length) continue;
            var first = arr[0];
            if (!first || typeof first !== 'object') continue;
            if (first.BillNo != null || first.billNo != null || first.BillAmount != null || first.billAmount != null) continue;
            if (
                ('Code' in first) || ('code' in first)
                || ('ProjectMaster_Code' in first) || ('projectMaster_Code' in first)
                || ('SubProjectMaster_Code' in first) || ('subProjectMaster_Code' in first)
                || ('SubProjectDesp' in first) || ('subProjectDesp' in first)
                || ('ProjectDesp' in first) || ('projectDesp' in first)
                || ('VendorMaster_Code' in first) || ('vendorMaster_Code' in first)
            ) {
                return arr;
            }
        }
    }
    return [];
}

function bsFormatGpaListDate(val) {
    if (val === undefined || val === null || val === '') return '';
    var s = String(val);
    if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
        var d = new Date(s.substring(0, 10) + 'T12:00:00');
        if (!Number.isNaN(d.getTime())) {
            return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
    }
    var d2 = new Date(s);
    if (!Number.isNaN(d2.getTime())) {
        return d2.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return s;
}

function clearBsPendingGrnBizsolGridState() {
    if (typeof ClearFilter === 'function' && window.filteredDataTemp_tblBsPendingGrnList != null) {
        try {
            ClearFilter('tblBsPendingGrnTbody-body');
        } catch (e) { /* ignore */ }
    }
    $('#paginator-tblBsPendingGrnList').empty().hide();
    $('#tblBsPendingGrnTable-hader').empty();
    $('#tblBsPendingGrnTbody-body').empty();
}

function resetBsReconcileChoiceModalUi() {
    $('#bsReconcileChoiceBackdrop').attr('data-bs-recon-step', 'pick');
    $('#bsReconcileChoiceStepList').hide();
    $('#bsReconcileChoiceStepPick').show();
    $('#bsReconcileChoiceInner').removeClass('bs-reconcile-choice-modal--wide');
    clearBsPendingGrnBizsolGridState();
    $('#tblBsPendingGrnLoad').hide();
    $('#tblBsPendingGrnEmpty').hide();
    $('#tblBsPendingGrnScroll').hide();
    $('#tblBsPendingGrnEmpty').text('No pending payment entries found.');
}

function showBsReconcileChoiceListStep() {
    $('#bsReconcileChoiceBackdrop').attr('data-bs-recon-step', 'list');
    $('#bsReconcileChoiceStepPick').hide();
    $('#bsReconcileChoiceStepList').show();
    $('#bsReconcileChoiceInner').addClass('bs-reconcile-choice-modal--wide');
}

function backBsReconcileChoiceFromList() {
    $('#bsReconcileChoiceStepList').hide();
    $('#bsReconcileChoiceStepPick').show();
    $('#bsReconcileChoiceInner').removeClass('bs-reconcile-choice-modal--wide');
    $('#bsReconcileChoiceBackdrop').attr('data-bs-recon-step', 'pick');
    clearBsPendingGrnBizsolGridState();
    $('#tblBsPendingGrnLoad').hide();
    $('#tblBsPendingGrnEmpty').text('No pending payment entries found.').hide();
    $('#tblBsPendingGrnScroll').hide();
}

/** Row shape from USP_WebAPI_BankStatement @Mode = ExistingReconciled → modal table columns. */
function bsMapExistingReconciledSpRow(item) {
    if (!item || typeof item !== 'object') {
        return { code: 0, entryNo: '', entryDateStr: '', party: '', employee: '', amountNum: NaN, ref: '' };
    }
    var code = parseInt(String(item.Code != null ? item.Code : (item.code != null ? item.code : 0)), 10) || 0;
    var entryNo = item.EntryNo != null ? item.EntryNo : (item.entryNo != null ? item.entryNo : '');
    var ed = item.EntryDate != null ? item.EntryDate : item.entryDate;
    var party = item.PartyName != null ? item.PartyName : (item.partyName != null ? item.partyName : '');
    var empRaw = item.Employee != null ? item.Employee : item.employee;
    var employee = empRaw !== undefined && empRaw !== null ? String(empRaw).trim() : '';
    var rawAmt = item.Amount != null ? item.Amount : item.amount;
    var amtNum = rawAmt !== undefined && rawAmt !== null && rawAmt !== '' ? Number(rawAmt) : NaN;
    var ref = item.RefNo != null ? item.RefNo : (item.refNo != null ? item.refNo : '');
    return {
        code: code,
        entryNo: entryNo,
        entryDateStr: bsFormatGpaListDate(ed),
        party: party,
        employee: employee,
        amountNum: amtNum,
        ref: ref,
    };
}

/** Same BizsolCustomFilterGrid column model as GRN Payment Entry list (GRNPaymentEntry.js → renderGpaListGridForActiveTab). */
function mapBsPendingGrnRowForCustomFilterGrid(r, bankStmt) {
    var amt = r.amountNum;
    var amtVal = (typeof amt === 'number' && !isNaN(amt) && isFinite(amt)) ? amt : '';
    var entryNo = r.entryNo !== '' && r.entryNo != null ? r.entryNo : r.code;
    return {
        'Entry No': entryNo,
        'Entry Date': r.entryDateStr || '',
        'Party Name': String(r.party || ''),
        'Employee': String(r.employee || ''),
        'Amount': amtVal,
        'Ref No': String(r.ref || ''),
        'Action': '<button type="button" class="btn-bs-grn-reconcile" data-grn-code="' + r.code + '" data-bank-stmt-code="' + bankStmt + '">Reconcile</button>',
        'Code': r.code,
        _bsPendingRaw: r,
    };
}

function renderBsPendingGrnBizsolFilterGrid(items) {
    var bankStmt = pendingBsGrnChoiceCode || 0;
    var gridRows = [];
    for (var i = 0; i < items.length; i++) {
        if (items[i].code) gridRows.push(mapBsPendingGrnRowForCustomFilterGrid(items[i], bankStmt));
    }
    if (!gridRows.length) return;
    if (typeof BizsolCustomFilterGrid === 'undefined' || typeof BizsolCustomFilterGrid.CreateDataTable !== 'function') {
        toastr && toastr.error('Filter grid script is not loaded.');
        return;
    }
    var StringFilterColumn = ['Party Name', 'Employee', 'Ref No'];
    var NumericFilterColumn = ['Entry No', 'Amount'];
    var DateFilterColumn = ['Entry Date'];
    var StringdoubleFilterColumn = [];
    var hiddenColumns = ['Code', '_bsPendingRaw'];
    var ColumnAlignment = { Action: 'center;min-width:7rem;', Amount: 'right' };
    BizsolCustomFilterGrid.CreateDataTable(
        'tblBsPendingGrnTable-hader',
        'tblBsPendingGrnTbody-body',
        gridRows,
        false,
        [],
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        ColumnAlignment,
        true,
        null,
        { Amount: 2 },
        ['Amount'],
        'Search by Entry No, Party, Employee, Work Type...'
    );
    $('#paginator-tblBsPendingGrnList').show();
}

function loadBsPendingGrnListInModal() {
    var bankStmt = pendingBsGrnChoiceCode || 0;
    if (!bankStmt) {
        toastr && toastr.warning('Missing bank statement row.');
        return;
    }
    clearBsPendingGrnBizsolGridState();
    showBsReconcileChoiceListStep();
    $('#tblBsPendingGrnEmpty').text('No pending payment entries found.');
    $('#tblBsPendingGrnLoad').show();
    $('#tblBsPendingGrnEmpty').hide();
    $('#tblBsPendingGrnScroll').hide();

    BankStatementService.GetExistingReconciledPendingGrnList(bankStmt)
        .then(function (response) {
            $('#tblBsPendingGrnLoad').hide();
            var raw = bsNormalizeGrnListApiRows(response);
            var pending = [];
            for (var i = 0; i < raw.length; i++) {
                var row = bsMapExistingReconciledSpRow(raw[i]);
                if (row.code > 0) pending.push(row);
            }
            if (!pending.length) {
                $('#tblBsPendingGrnEmpty').show();
                return;
            }
            renderBsPendingGrnBizsolFilterGrid(pending);
            $('#tblBsPendingGrnScroll').show();
        })
        .catch(function () {
            $('#tblBsPendingGrnLoad').hide();
            toastr && toastr.error('Failed to load payment list.');
            $('#tblBsPendingGrnEmpty').text('Could not load the list.').show();
        });
}

function bsFirstGrnMasterFromApi(root) {
    if (!root || typeof root !== 'object') return null;
    var vw = root.VW_GRNPaymentMaster || root.vw_GRNPaymentMaster || root;
    var list = vw.GRNPaymentMaster || vw.grnPaymentMaster
        || root.GRNPaymentMaster || root.grnPaymentMaster;
    if (Array.isArray(list) && list.length) return list[0];
    if (list && typeof list === 'object' && !Array.isArray(list)) return list;
    if (vw !== root && (vw.Code !== undefined || vw.code !== undefined || vw.EntryNo !== undefined || vw.entryNo !== undefined
        || vw.AccountMaster_Code !== undefined || vw.accountMaster_Code !== undefined)) {
        return vw;
    }
    var hasSibling = root.GRNPaymentDetails || root.grnPaymentDetails
        || root.GRNPaymentMaster || root.grnPaymentMaster;
    if ((root.Code !== undefined || root.code !== undefined || root.EntryNo !== undefined || root.entryNo !== undefined
        || root.AccountMaster_Code !== undefined || root.accountMaster_Code !== undefined)
        && !hasSibling) {
        return root;
    }
    return null;
}

function buildGrnSummaryHtml(master, grnCode) {
    if (!master) {
        return '<p class="mb-0">Linked payment master code: <strong>' + escHtml(String(grnCode)) + '</strong> (details could not be parsed from the server response).</p>';
    }
    var m = master;
    var code = m.Code != null ? m.Code : (m.code != null ? m.code : grnCode);
    var eno = m.EntryNo != null ? m.EntryNo : m.entryNo;
    var ed = m.EntryDate != null ? m.EntryDate : (m.entryDate != null ? m.entryDate : (m.PaymentDate != null ? m.PaymentDate : m.paymentDate));
    var amt = m.Amount != null ? m.Amount : m.amount;
    var narr = m.Narration != null ? m.Narration : (m.narration != null ? m.narration : '');
    var cref = m.ChequeRefNo != null ? m.ChequeRefNo : (m.chequeRefNo != null ? m.chequeRefNo : (m.RefNo != null ? m.RefNo : (m.refNo != null ? m.refNo : '')));
    var party = m.AccountDesp != null ? m.AccountDesp : (m.accountDesp != null ? m.accountDesp : (m.PartyName != null ? m.PartyName : (m.partyName != null ? m.partyName : (m.VendorName != null ? m.VendorName : (m.vendorName != null ? m.vendorName : '')))));
    var rows = [
        { k: 'Code', v: code },
        { k: 'Entry No', v: eno },
        { k: 'Date', v: ed },
        { k: 'Amount', v: amt },
        { k: 'Party', v: party },
        { k: 'Ref / Chq', v: cref },
        { k: 'Narration', v: narr }
    ];
    var sb = '<div class="bs-grn-summary-box border rounded p-2 small text-start bg-light">';
    sb += '<div class="fw-semibold mb-2">Payment entry (GRN)</div>';
    sb += '<table class="table table-sm table-borderless mb-0">';
    for (var i = 0; i < rows.length; i++) {
        var rv = rows[i].v;
        if (rv === undefined || rv === null || String(rv).trim() === '') continue;
        sb += '<tr><th class="text-muted pe-2" style="width:7rem;">' + escHtml(rows[i].k) + '</th><td>' + escHtml(String(rv)) + '</td></tr>';
    }
    sb += '</table></div>';
    return sb;
}

function openReconConfirmModal(code, toYes, grnMasterCode) {
    reconPendingCode = code;
    reconPendingToYes = toYes;
    reconPendingGrnMasterCode = parseInt(grnMasterCode, 10) || 0;
    var grn = reconPendingGrnMasterCode;

    $('#bsReconConfirmTitle').text('Change reconciliation?');

    if (!toYes && grn > 0) {
        $('#bsReconConfirmTitle').text('Linked payment entry');
        $('#bsReconConfirmText').html(
            '<p class="text-muted mb-2">Loading payment details…</p>'
        );
        showBsBackdrop('#bsReconConfirmBackdrop');
        GRNPaymentApprovalService.GetGRNPaymentApprovalByCode(grn)
            .then(function (res) {
                var root = peelGrnRootForBs(res);
                var master = bsFirstGrnMasterFromApi(root);
                var box = buildGrnSummaryHtml(master, grn);
                $('#bsReconConfirmText').html(
                    box + '<p class="mt-3 mb-0">If you choose <strong>Yes, continue</strong>, you will be asked to confirm '
                    + '<strong>deleting</strong> this payment entry, or to cancel and only mark the bank line <strong>Not reconciled</strong> '
                    + '(without deleting the payment).</p>'
                );
            })
            .catch(function () {
                $('#bsReconConfirmText').html(
                    buildGrnSummaryHtml(null, grn)
                    + '<p class="mt-2 text-danger mb-0">Could not load full details from the server. You can still continue to the delete confirmation if this code is correct.</p>'
                );
            });
        return;
    }

    var msg = toYes
        ? 'Mark this bank statement line as <strong>reconciled</strong>?'
        : 'Clear reconciliation for this line (set to <strong>Not reconciled</strong>)?';
    $('#bsReconConfirmText').html(msg);
    showBsBackdrop('#bsReconConfirmBackdrop');
}

function closeReconConfirmModal() {
    hideBsBackdrop('#bsReconConfirmBackdrop');
    reconPendingCode = 0;
    reconPendingToYes = false;
    reconPendingGrnMasterCode = 0;
}

function openGrnDeleteSecondModal(bankStmtCode, grnCode) {
    grnDeletePendingBankCode = bankStmtCode || 0;
    grnDeletePendingGrnCode = grnCode || 0;
    $('#bsGrnUnreconcileDeleteText').html(
        '<p class="mb-2"><strong>Yes, delete</strong> removes payment master code <strong>' + escHtml(String(grnCode)) + '</strong> (same as Payment Entry delete), '
        + 'then sets bank line <strong>' + escHtml(String(bankStmtCode)) + '</strong> to <strong>Not reconciled</strong> and clears the link.</p>'
        + '<p class="mb-2"><strong>Cancel</strong> does <em>not</em> delete the payment; it still sets this bank line to <strong>Not reconciled</strong> and clears the stored link.</p>'
        + '<p class="mb-0 text-danger small">Deletion cannot be undone.</p>'
    );
    showBsBackdrop('#bsGrnUnreconcileDeleteBackdrop');
}

function closeGrnDeleteSecondModal() {
    hideBsBackdrop('#bsGrnUnreconcileDeleteBackdrop');
    grnDeletePendingBankCode = 0;
    grnDeletePendingGrnCode = 0;
}

function confirmGrnDeleteSecondCancel() {
    var bankCode = grnDeletePendingBankCode;
    closeGrnDeleteSecondModal();
    if (!bankCode) return;
    Showloader && Showloader();
    BankStatementService.SetBankStatementReconciliation(bankCode, false, { clearGrnLink: true })
        .then(function (r) {
            HideLoader && HideLoader();
            if (isApiResultOk(r)) {
                toastr && toastr.success((r && (r.Msg || r.msg)) || 'Bank line set to Not reconciled (payment entry was not deleted).');
                LoadStatements();
            } else {
                toastr && toastr.error((r && (r.Msg || r.message)) || 'Could not set bank line to Not reconciled.');
            }
        })
        .catch(function () {
            HideLoader && HideLoader();
            toastr && toastr.error('Update failed.');
        });
}

function confirmGrnDeleteSecond() {
    var bankCode = grnDeletePendingBankCode;
    var grnCode = grnDeletePendingGrnCode;
    closeGrnDeleteSecondModal();
    if (!bankCode || !grnCode) return;
    Showloader && Showloader();
    var reason = 'Removed via bank statement unreconcile (user confirmed delete of linked payment).';
    GRNPaymentApprovalService.DeleteGRNPaymentApproval(grnCode, reason, '', '')
        .then(function (delRes) {
            if (!isApiResultOk(delRes)) {
                HideLoader && HideLoader();
                toastr && toastr.error((delRes && (delRes.Msg || delRes.msg || delRes.message)) || 'Delete payment failed.');
                return null;
            }
            return BankStatementService.UnlinkBankStatementGrn(bankCode);
        })
        .then(function (unlinkRes) {
            if (unlinkRes === null) return;
            if (isApiResultOk(unlinkRes)) {
                HideLoader && HideLoader();
                toastr && toastr.success((unlinkRes && (unlinkRes.Msg || unlinkRes.msg)) || 'Payment deleted and bank line updated.');
                LoadStatements();
                return null;
            }
            return BankStatementService.SetBankStatementReconciliation(bankCode, false, { clearGrnLink: true });
        })
        .then(function (fallbackRes) {
            if (fallbackRes === null || fallbackRes === undefined) return;
            HideLoader && HideLoader();
            if (isApiResultOk(fallbackRes)) {
                toastr && toastr.warning((fallbackRes && (fallbackRes.Msg || fallbackRes.msg)) || 'Payment deleted; bank line reconciled flag cleared via fallback.');
                LoadStatements();
            } else {
                toastr && toastr.warning(
                    (fallbackRes && (fallbackRes.Msg || fallbackRes.msg)) || 'Payment was deleted but updating the bank line failed. Refresh or correct data manually.'
                );
                LoadStatements();
            }
        })
        .catch(function () {
            HideLoader && HideLoader();
            toastr && toastr.error('Delete or unlink request failed.');
        });
}

function confirmReconPending() {
    var code = reconPendingCode;
    var toYes = reconPendingToYes;
    var grn = reconPendingGrnMasterCode || 0;
    closeReconConfirmModal();
    if (!code) return;
    if (toYes) {
        saveReconciliationState(code, true)
            .then(function () {
                toastr && toastr.success('Marked as reconciled.');
                LoadStatements();
            })
            .catch(function (err) {
                if (err && err.message === 'code') return;
            });
        return;
    }
    if (grn > 0) {
        openGrnDeleteSecondModal(code, grn);
        return;
    }
    saveReconciliationState(code, false)
        .then(function () {
            toastr && toastr.success('Reconciliation cleared.');
            LoadStatements();
        })
        .catch(function (err) {
            if (err && err.message === 'code') return;
        });
}

/** Bank → account → date → import line seq (Remarks) → record code (stable list order: line-wise running is correct). */
function readImportLineSeq(row) {
    if (!row) return null;
    var r = row.Remarks != null ? row.Remarks : (row.remarks != null ? row.remarks : '');
    if (r == null || r === '') return null;
    var m = String(r).trim().match(/^(\d{1,8})$/);
    return m ? parseInt(m[1], 10) : null;
}

function sortStatementRows(list) {
    return list.map(function (row, origIdx) {
        return { row: row, origIdx: origIdx, iso: ConvertToIsoDate(row.TxnDate) };
    }).sort(function (a, b) {
        var ba = parseInt(a.row.BankMaster_Code, 10);
        var bb = parseInt(b.row.BankMaster_Code, 10);
        ba = isNaN(ba) ? 0 : ba;
        bb = isNaN(bb) ? 0 : bb;
        if (ba !== bb) return ba - bb;
        var sa = String(a.row.AccountNo || '');
        var sb = String(b.row.AccountNo || '');
        if (sa < sb) return -1;
        if (sa > sb) return 1;
        if (!a.iso && !b.iso) return a.origIdx - b.origIdx;
        if (!a.iso) return 1;
        if (!b.iso) return -1;
        var c = a.iso.localeCompare(b.iso);
        if (c !== 0) return c;
        var la = readImportLineSeq(a.row);
        var lb = readImportLineSeq(b.row);
        if (la != null && lb != null && la !== lb) return la - lb;
        if (la != null && lb == null) return -1;
        if (la == null && lb != null) return 1;
        var ca = parseInt(a.row.Code, 10) || 0;
        var cb = parseInt(b.row.Code, 10) || 0;
        if (ca !== cb) return ca - cb;
        return a.origIdx - b.origIdx;
    });
}

/**
 * Opening + Deposit − Withdrawal; chain per bank + account (resets when bank/acct changes).
 * @param {Array} sortedItems sortStatementRows output
 * @param {Record<string, number>|null} seedClosingByAcct optional: closing balance after last txn
 *        on or before the calendar day before the list filter (so filtered view opens correctly).
 */
function computeBalances(sortedItems, seedClosingByAcct) {
    var lastClosing = null;
    var lastAcctKey = null;
    var out = [];
    for (var i = 0; i < sortedItems.length; i++) {
        var row = sortedItems[i].row;
        var acctKey = (row.BankMaster_Code != null ? String(row.BankMaster_Code) : '') + '|' + String(row.AccountNo || '');

        if (acctKey !== lastAcctKey) {
            lastClosing = null;
            lastAcctKey = acctKey;
        }

        var dep = roundMoney(cleanAmount(row.DepositAmt));
        var w = roundMoney(cleanAmount(row.WithdrawalAmt));
        if (isNaN(dep) || !isFinite(dep)) dep = 0;
        if (isNaN(w) || !isFinite(w)) w = 0;
        var op;

        if (lastClosing === null) {
            var usedSeed = false;
            if (seedClosingByAcct && Object.prototype.hasOwnProperty.call(seedClosingByAcct, acctKey)) {
                var sd = seedClosingByAcct[acctKey];
                if (typeof sd === 'number' && isFinite(sd) && !isNaN(sd)) {
                    op = roundMoney(sd);
                    usedSeed = true;
                }
            }
            if (!usedSeed) {
                var st = cleanAmount(row.ServiceTaxNo);
                op = roundMoney(st);
                if (isNaN(op) || !isFinite(op)) {
                    var cl0 = cleanAmount(row.ClosingBalance);
                    op = !isNaN(cl0) && isFinite(cl0) ? roundMoney(cl0 - dep + w) : 0;
                }
            }
        } else {
            op = roundMoney(lastClosing);
        }

        var balanceAfter = roundMoney(op + dep - w);
        var storedClose = cleanAmount(row.ClosingBalance);
        var storedR = roundMoney(storedClose);
        if (!isNaN(storedR) && isFinite(storedR)) balanceAfter = storedR;
        lastClosing = balanceAfter;
        out.push({
            row: row,
            opening: op,
            balanceAfter: balanceAfter
        });
    }
    return out;
}

/** Per bank|account closing after last row in prior history (no statement filter — physical balance). */
function buildClosingBalanceSeedMap(priorList) {
    if (!priorList || !priorList.length) return null;
    var sorted = sortStatementRows(priorList);
    var computed = computeBalances(sorted, null);
    var map = {};
    for (var i = 0; i < computed.length; i++) {
        var row = computed[i].row;
        var acctKey = (row.BankMaster_Code != null ? String(row.BankMaster_Code) : '') + '|' + String(row.AccountNo || '');
        map[acctKey] = computed[i].balanceAfter;
    }
    return map;
}

function isApiResultOk(r) {
    if (!r) return false;
    if (r.Status === 'Y' || r.status === 'Y' || r.Success === true || r.success === true) return true;
    return false;
}

/**
 * Mark reconciled: ReconcileBankStatement (withdrawals require GRN link on server; credits without debit pass).
 * Mark not reconciled: UnreconcileWithdrawalWithGrn then SetBankStatementReconciliation if needed.
 */
function saveReconciliationState(code, toYes) {
    if (!code) {
        toastr && toastr.warning('Missing record id.');
        return Promise.reject(new Error('code'));
    }
    if (toYes) {
        return BankStatementService.ReconcileBankStatement(code)
            .then(function (r) {
                if (isApiResultOk(r)) return r;
                toastr && toastr.error((r && (r.Msg || r.msg || r.message)) || 'Could not mark as reconciled.');
                return Promise.reject(new Error('reconcile'));
            });
    }
    return BankStatementService.UnreconcileWithdrawalWithGrn(code)
        .catch(function () { return null; })
        .then(function (r) {
            if (r != null && isApiResultOk(r)) return r;
            return BankStatementService.SetBankStatementReconciliation(code, false);
        })
        .then(function (r2) {
            if (isApiResultOk(r2)) return r2;
            toastr && toastr.error(
                (r2 && (r2.Msg || r2.message)) || 'Could not clear reconciliation or remove payment entry. Wire UnreconcileWithdrawalWithGrn on the API.'
            );
            return Promise.reject(new Error('reconciliation'));
        });
}

function loadStatementListForFilter(codes, fromDate, toDate, batchNo) {
    if (!codes || !codes.length) {
        return BankStatementService.GetBankStatementList(0, '', fromDate, toDate, batchNo)
            .then(function (data) { return normalizeListPayload(data); });
    }
    return Promise.all(codes.map(function (c) {
        return BankStatementService.GetBankStatementList(c, '', fromDate, toDate, batchNo)
            .then(function (data) { return normalizeListPayload(data); });
    })).then(function (arrays) { return mergeStatementLists(arrays); });
}

function normalizeListPayload(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data && data.data)) return data.data;
    if (Array.isArray(data && data.Data)) return data.Data;
    return [];
}

function LoadStatements() {
    var codes  = getSelectedBankCodes();
    var batchNo = getBatchNoFromUrl();
    var fromIso = $('#txtFilterFromDate').val().trim();
    var fromDate  = isoToApiDate(fromIso);
    var toDate    = isoToApiDate($('#txtFilterToDate').val().trim());

    var $body = $('#tblStatementsBody');
    $body.html('<tr><td colspan="11" class="text-center py-3 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Loading…</td></tr>');
    $('#lblRecordCount').text('');
    syncBankStatementColumnVisibility();
    $('.js-bs-list-opening').text('—');
    $('#tdTotalWithdrawal').text('—');
    $('#tdTotalDeposit').text('—');
    $('#tdTotalClosingBalance').text('—');

    Showloader && Showloader();

    var prevIso = prevCalendarDayIso(fromIso);
    var priorToApi = prevIso ? isoToApiDate(prevIso) : '';
    var mainPromise = loadStatementListForFilter(codes, fromDate, toDate, batchNo);
    var priorPromise = priorToApi
        ? loadStatementListForFilter(codes, '', priorToApi, batchNo).catch(function () { return []; })
        : Promise.resolve([]);

    Promise.all([mainPromise, priorPromise])
        .then(function (pair) {
            HideLoader && HideLoader();
            $body.empty();

            var list = pair[0];
            var priorRaw = pair[1] || [];
            var seedMap = priorToApi ? buildClosingBalanceSeedMap(priorRaw) : null;

            list = applyStatementFilter(list);

            if (!list || !list.length) {
                $body.html('<tr><td colspan="11" class="text-center py-3 text-muted">No records found.</td></tr>');
                $('#lblRecordCount').text('(0 records)');
                $('.js-bs-list-opening').text('—');
                $('#tdTotalWithdrawal').text('—');
                $('#tdTotalDeposit').text('—');
                $('#tdTotalClosingBalance').text('—');
                syncBankStatementColumnVisibility();
                return;
            }

            var sorted = sortStatementRows(list);
            var computed = computeBalances(sorted, seedMap);
            $('.js-bs-list-opening').text(FormatAmount(computed[0] && computed[0].opening));

            var totalWithPaisa = 0;
            var totalDepPaisa = 0;
            var lastDisplayCloseNum = null;

            $.each(computed, function (i, item) {
                var row = item.row;
                var ir = row.IsReconciled;
                var reconY = isRowReconciled(row);
                var storedClose = cleanAmount(row.ClosingBalance);
                var storedR = roundMoney(storedClose);
                var after = roundMoney(item.balanceAfter);
                var displayClose = !isNaN(storedR) && isFinite(storedR) ? storedR : after;
                var mismatch = !isNaN(storedR) && isFinite(after) && Math.abs(storedR - after) > 0.02;
                var closeCls = mismatch ? ' text-end text-warning' : ' text-end';
                var closeTitle = mismatch
                    ? 'Computed: ' + after + ' | Saved on import: ' + row.ClosingBalance
                    : (!isNaN(storedR) && isFinite(storedR)
                        ? 'Closing balance from statement (import)'
                        : 'Opening + Deposit − Withdrawal = line closing (running balance)');

                var wAmt = roundMoney(cleanAmount(row.WithdrawalAmt));
                var dAmt = roundMoney(cleanAmount(row.DepositAmt));
                if (isNaN(wAmt) || !isFinite(wAmt)) wAmt = 0;
                if (isNaN(dAmt) || !isFinite(dAmt)) dAmt = 0;
                var grnMaster = parseInt(String(row.GRNPaymentMaster_Code != null ? row.GRNPaymentMaster_Code : (row.gRNPaymentMaster_Code != null ? row.gRNPaymentMaster_Code : 0)), 10) || 0;
                var stmtBankCode = parseInt(String(
                    row.BankMaster_Code != null && row.BankMaster_Code !== ''
                        ? row.BankMaster_Code
                        : (row.bankMaster_Code != null && row.bankMaster_Code !== '' ? row.bankMaster_Code : 0)
                ), 10) || 0;
                var stmtBankName = row.BankName != null ? row.BankName : (row.bankName != null ? row.bankName : '');

                var reconCell;
                var depositBlocksUnreconcile = dAmt > 0;
                if (row.Code == null || row.Code === '') {
                    reconCell = reconY
                        ? '<span class="bs-badge bs-badge--recon-yes">Yes</span>'
                        : '<span class="bs-badge bs-badge--recon-no">No</span>';
                } else {
                    reconCell = reconY
                        ? (depositBlocksUnreconcile
                            ? '<span class="bs-badge bs-badge--recon-yes bs-recon-yes--locked" title="Deposit lines cannot be unreconciled from here.">Yes</span>'
                            : '<button type="button" class="bs-recon-toggle bs-badge bs-badge--recon-yes" data-code="'
                                + String(row.Code) + '" data-recon="C" data-grn-master="' + String(grnMaster) + '" title="Unreconcile — clear reconciled for this line">Yes</button>')
                        : '<button type="button" class="bs-recon-toggle bs-badge bs-badge--recon-no" data-code="'
                            + String(row.Code) + '" data-recon="N" data-bs-withdraw="'
                            + (Number.isFinite(wAmt) ? String(wAmt) : '0') + '" data-bs-narr-enc="'
                            + encodeURIComponent(String(row.Narration == null ? '' : row.Narration)) + '" data-bs-ref-enc="'
                            + encodeURIComponent(String(row.ChequeRefNo == null ? '' : row.ChequeRefNo)) + '" data-bs-txn-enc="'
                            + encodeURIComponent(String(row.TxnDate == null ? '' : row.TxnDate)) + '" data-bs-bank-master="'
                            + String(stmtBankCode) + '" data-bs-bank-name-enc="'
                            + encodeURIComponent(String(stmtBankName == null ? '' : stmtBankName)) + '" data-bs-acct-enc="'
                            + encodeURIComponent(String(row.AccountNo == null ? '' : row.AccountNo)) + '" title="Open payment entry to reconcile this line">No</button>';
                }
                totalWithPaisa += moneyToPaisa(wAmt);
                totalDepPaisa += moneyToPaisa(dAmt);
                lastDisplayCloseNum = displayClose;

                var rowReconClass = reconY ? 'bs-row-recon-yes' : 'bs-row-recon-no';

                $body.append(`
                    <tr class="${rowReconClass}">
                        <td>${i + 1}</td>
                        <td>${escHtml(row.TxnDate)}</td>
                        <td>${escHtml(row.AccountNo)}</td>
                        <td class="bs-narration-cell" title="${escHtml(row.Narration)}">${escHtml(TruncStr(row.Narration, 50))}</td>
                        <td>${escHtml(row.ChequeRefNo || '—')}</td>
                        <td class="text-end">${FormatAmount(wAmt)}</td>
                        <td class="text-end bs-stmt-col-deposit">${FormatAmount(dAmt)}</td>
                        <td class="bs-closing-balance bs-stmt-col-closing${closeCls}" title="${escHtml(closeTitle)}">${FormatAmount(displayClose)}</td>
                        <td class="bs-col-hidden bs-col-drcr">${escHtml(row.BalanceType || '—')}</td>
                        <td class="bs-col-hidden bs-col-batch"><span class="fw-semibold text-primary small">${escHtml(row.ImportBatchNo)}</span></td>
                        <td class="text-center bs-recon-cell">${reconCell}</td>
                    </tr>`);
            });

            var totalWith = paisaToMoney(totalWithPaisa);
            var totalDep = paisaToMoney(totalDepPaisa);
            $('#tdTotalWithdrawal').text(FormatAmount(totalWith));
            $('#tdTotalDeposit').text(FormatAmount(totalDep));
            /*
             * Footer closing: prefer last row’s displayed closing (bank-reported / stored when shown),
             * so it matches the final line (e.g. .97) instead of a rounded recomputation (.00).
             * Fallback: opening + Σ deposit − Σ withdrawal using paise-safe totals.
             */
            var firstOpen = computed[0] && computed[0].opening;
            var openNum = typeof firstOpen === 'number' && isFinite(firstOpen) && !isNaN(firstOpen) ? roundMoney(firstOpen) : 0;
            var footerFromLedgerPaisa = moneyToPaisa(openNum) + totalDepPaisa - totalWithPaisa;
            var footerFromLedger = paisaToMoney(footerFromLedgerPaisa);
            var footerClose = roundMoney(footerFromLedger);
            if (lastDisplayCloseNum !== null && typeof lastDisplayCloseNum === 'number'
                && isFinite(lastDisplayCloseNum) && !isNaN(lastDisplayCloseNum)) {
                footerClose = roundMoney(lastDisplayCloseNum);
            }
            $('#tdTotalClosingBalance').text(formatNumericTotal(footerClose));
            $('#lblRecordCount').text('(' + computed.length + ' records)');
            syncBankStatementColumnVisibility();
        })
        .catch(function () {
            HideLoader && HideLoader();
            $body.html('<tr><td colspan="11" class="text-center py-3 text-danger">Failed to load records.</td></tr>');
            $('.js-bs-list-opening').text('—');
            $('#tdTotalWithdrawal').text('—');
            $('#tdTotalDeposit').text('—');
            $('#tdTotalClosingBalance').text('—');
            syncBankStatementColumnVisibility();
        });
}

window.refreshBankStatementList = LoadStatements;

/** Footer totals: show 0.00 for zero (unlike FormatAmount which uses — for 0). */
function formatNumericTotal(n) {
    var r = roundMoney(n);
    if (typeof r !== 'number' || isNaN(r) || !isFinite(r)) return '—';
    return r.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FormatAmount(val) {
    var n = typeof val === 'number' && !isNaN(val) ? val : cleanAmount(val);
    if (isNaN(n) || !isFinite(n)) return '—';
    n = roundMoney(n);
    if (n === 0) return '—';
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TruncStr(str, max) {
    if (!str) return '';
    return str.length > max ? str.substring(0, max) + '…' : str;
}

function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
