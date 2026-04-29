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
    return ir === 'Y' || ir === true || ir === 1
        || (ir != null && String(ir).toUpperCase() === 'Y');
}

/** When Un reconciled or Reconciled is selected: hide deposit & closing columns + opening/deposit/closing summaries. */
function syncBankStatementColumnVisibility() {
    var mode = String($('#ddlFilterStatement').val() || 'All').trim();
    var hideFin = mode === 'Unreconciled' || mode === 'BankStatement';
    $('#cardList').toggleClass('bs-stmt-hide-fin-summary', !!hideFin);
}

/** Statement filter: All | Unreconciled | BankStatement (reconciled lines). */
function applyStatementFilter(list) {
    var mode = String($('#ddlFilterStatement').val() || 'All').trim();
    if (!list || !list.length) return list || [];
    if (mode === 'Unreconciled') {
        return list.filter(function (row) { return !isRowReconciled(row); });
    }
    if (mode === 'BankStatement') {
        return list.filter(function (row) { return isRowReconciled(row); });
    }
    return list;
}

$(document).ready(function () {
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
            $b.addClass('active').attr('aria-hidden', 'false');
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
        var isYes = $b.attr('data-recon') === 'Y';
        if (!code) return;
        if (isYes) {
            /* Yes → unreconcile: show details when bank row is linked to GRNPaymentMaster_Code */
            var grn = parseInt($b.attr('data-grn-master') || '0', 10) || 0;
            openReconConfirmModal(code, false, grn);
        } else {
            /* No → Payment Entry iframe; row context in sessionStorage for prefill */
            try {
                var wRaw = $b.attr('data-bs-withdraw');
                var wNum = parseFloat(String(wRaw || '').replace(/,/g, ''));
                if (!Number.isFinite(wNum)) wNum = 0;
                var narrEnc = $b.attr('data-bs-narr-enc') || '';
                var refEnc = $b.attr('data-bs-ref-enc') || '';
                var txnEnc = $b.attr('data-bs-txn-enc') || '';
                sessionStorage.setItem('BizsolBankStmtGrnEmbed', JSON.stringify({
                    withdrawal: wNum,
                    narration: narrEnc ? decodeURIComponent(narrEnc) : '',
                    chequeRef: refEnc ? decodeURIComponent(refEnc) : '',
                    txnDate: txnEnc ? decodeURIComponent(txnEnc) : ''
                }));
            } catch (se) { /* ignore */ }
            openGrnPaymentEmbedModal(code);
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

    $(document).off('keydown.bsReconConfirm').on('keydown.bsReconConfirm', function (e) {
        if (e.key !== 'Escape') return;
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

/** Payment Entry form in iframe (GRNPaymentApproval area + GRNPaymentEntry.js; openNew=1 shows form, not approval list). */
function openGrnPaymentEmbedModal(bankStatementCode) {
    var root = (baseUrl || '').replace(/\/$/, '');
    var url = root + '/PurchaseTransactions/GRNPaymentApproval/GRNPaymentApproval'
        + '?bankStatementCode=' + encodeURIComponent(String(bankStatementCode || 0))
        + '&embedded=1&openNew=1';
    $('#iframeBankStmtGrnEmbed').attr('src', url);
    $('#bsGrnPaymentEmbedBackdrop').addClass('active').attr('aria-hidden', 'false');
}

function closeGrnPaymentEmbedModal() {
    $('#iframeBankStmtGrnEmbed').attr('src', 'about:blank');
    $('#bsGrnPaymentEmbedBackdrop').removeClass('active').attr('aria-hidden', 'true');
    try {
        sessionStorage.removeItem('BizsolBankStmtGrnEmbed');
    } catch (e) { /* ignore */ }
}

/** Iframe Payment Entry saved — link GRN code on bank row, mark reconciled, close embed. */
function onBankStmtGrnEmbedChildMessage(ev) {
    var d = ev && ev.data;
    if (!d || d.type !== 'bizsol:bankStmtGrnSaved') return;
    if (ev.origin && window.location.origin && ev.origin !== window.location.origin) return;
    var bc = parseInt(String(d.bankStatementCode || '0'), 10) || 0;
    if (!bc) return;
    var grn = parseInt(String(d.grnPaymentMasterCode || d.grnPaymentMaster_Code || '0'), 10) || 0;
    Showloader && Showloader();

    function finishOk(msg) {
        HideLoader && HideLoader();
        toastr && toastr.success(msg || 'Bank line marked reconciled.');
        closeGrnPaymentEmbedModal();
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
                return null;
            }
            return BankStatementService.ReconcileBankStatement(bc);
        })
        .catch(function () {
            return BankStatementService.ReconcileBankStatement(bc);
        })
        .then(function (r2) {
            if (r2 == null) return;
            if (isApiResultOk(r2)) {
                finishOk((r2 && (r2.Msg || r2.msg)) || '');
                return null;
            }
            return BankStatementService.SetBankStatementReconciliation(bc, true);
        })
        .then(function (r3) {
            if (r3 == null) return;
            if (isApiResultOk(r3)) {
                finishOk((r3 && (r3.Msg || r3.msg)) || '');
            } else {
                finishErr((r3 && (r3.Msg || r3.message)) || '');
            }
        })
        .catch(function () {
            finishErr('Reconcile request failed.');
        });
}

function openGrnAutoMatchConfirmModal() {
    $('#bsGrnAutoMatchConfirmBackdrop').addClass('active').attr('aria-hidden', 'false');
}

function closeGrnAutoMatchConfirmModal() {
    $('#bsGrnAutoMatchConfirmBackdrop').removeClass('active').attr('aria-hidden', 'true');
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
        $('#bsReconConfirmBackdrop').addClass('active').attr('aria-hidden', 'false');
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
    $('#bsReconConfirmBackdrop').addClass('active').attr('aria-hidden', 'false');
}

function closeReconConfirmModal() {
    $('#bsReconConfirmBackdrop').removeClass('active').attr('aria-hidden', 'true');
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
    $('#bsGrnUnreconcileDeleteBackdrop').addClass('active').attr('aria-hidden', 'false');
}

function closeGrnDeleteSecondModal() {
    $('#bsGrnUnreconcileDeleteBackdrop').removeClass('active').attr('aria-hidden', 'true');
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

/** Bank → account → date → record code (stable list order: line-wise running is correct). */
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

        var dep = cleanAmount(row.DepositAmt);
        var w = cleanAmount(row.WithdrawalAmt);
        if (isNaN(dep) || !isFinite(dep)) dep = 0;
        if (isNaN(w) || !isFinite(w)) w = 0;
        var op;

        if (lastClosing === null) {
            var usedSeed = false;
            if (seedClosingByAcct && Object.prototype.hasOwnProperty.call(seedClosingByAcct, acctKey)) {
                var sd = seedClosingByAcct[acctKey];
                if (typeof sd === 'number' && isFinite(sd) && !isNaN(sd)) {
                    op = sd;
                    usedSeed = true;
                }
            }
            if (!usedSeed) {
                var st = cleanAmount(row.ServiceTaxNo);
                op = st;
                if (isNaN(op) || !isFinite(op)) {
                    var cl0 = cleanAmount(row.ClosingBalance);
                    op = !isNaN(cl0) && isFinite(cl0) ? cl0 - dep + w : 0;
                }
            }
        } else {
            op = lastClosing;
        }

        var balanceAfter = op + dep - w;
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
 * Mark reconciled: existing ReconcileBankStatement, optional SetBankStatementReconciliation.
 * Mark not reconciled: needs POST /BankStatement/SetBankStatementReconciliation { Code, IsReconciled: "N" }.
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
                return BankStatementService.SetBankStatementReconciliation(code, true)
                    .then(function (r2) {
                        if (isApiResultOk(r2)) return r2;
                        toastr && toastr.error('Could not mark as reconciled.');
                        return Promise.reject(new Error('reconcile'));
                    });
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

            var totalWith = 0, totalDep = 0;

            $.each(computed, function (i, item) {
                var row = item.row;
                var ir = row.IsReconciled;
                var reconY = ir === 'Y' || ir === true || ir === 1
                    || (ir != null && String(ir).toUpperCase() === 'Y');
                var storedClose = cleanAmount(row.ClosingBalance);
                var after = item.balanceAfter;
                var mismatch = !isNaN(storedClose) && isFinite(after) && Math.abs(storedClose - after) > 0.01;
                var closeCls = mismatch ? ' text-end text-warning' : ' text-end';
                var closeTitle = mismatch
                    ? 'Computed: ' + after + ' | Saved on import: ' + row.ClosingBalance
                    : 'Opening + Deposit − Withdrawal = line closing (running balance)';

                var wAmt = cleanAmount(row.WithdrawalAmt);
                var dAmt = cleanAmount(row.DepositAmt);
                if (isNaN(wAmt) || !isFinite(wAmt)) wAmt = 0;
                if (isNaN(dAmt) || !isFinite(dAmt)) dAmt = 0;
                var grnMaster = parseInt(String(row.GRNPaymentMaster_Code != null ? row.GRNPaymentMaster_Code : (row.gRNPaymentMaster_Code != null ? row.gRNPaymentMaster_Code : 0)), 10) || 0;

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
                                + String(row.Code) + '" data-recon="Y" data-grn-master="' + String(grnMaster) + '" title="Unreconcile — clear reconciled for this line">Yes</button>')
                        : '<button type="button" class="bs-recon-toggle bs-badge bs-badge--recon-no" data-code="'
                            + String(row.Code) + '" data-recon="N" data-bs-withdraw="'
                            + (Number.isFinite(wAmt) ? String(wAmt) : '0') + '" data-bs-narr-enc="'
                            + encodeURIComponent(String(row.Narration == null ? '' : row.Narration)) + '" data-bs-ref-enc="'
                            + encodeURIComponent(String(row.ChequeRefNo == null ? '' : row.ChequeRefNo)) + '" data-bs-txn-enc="'
                            + encodeURIComponent(String(row.TxnDate == null ? '' : row.TxnDate)) + '" title="Open payment entry to reconcile this line">No</button>';
                }
                totalWith += wAmt;
                totalDep  += dAmt;

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
                        <td class="bs-closing-balance bs-stmt-col-closing${closeCls}" title="${escHtml(closeTitle)}">${FormatAmount(item.balanceAfter)}</td>
                        <td class="bs-col-hidden bs-col-drcr">${escHtml(row.BalanceType || '—')}</td>
                        <td class="bs-col-hidden bs-col-batch"><span class="fw-semibold text-primary small">${escHtml(row.ImportBatchNo)}</span></td>
                        <td class="text-center bs-recon-cell">${reconCell}</td>
                    </tr>`);
            });

            $('#tdTotalWithdrawal').text(FormatAmount(totalWith));
            $('#tdTotalDeposit').text(FormatAmount(totalDep));
            /* Footer closing = opening (same as first row / footer opening cell) + Σ deposit − Σ withdrawal — not Σ(line closings). */
            var firstOpen = computed[0] && computed[0].opening;
            var openNum = typeof firstOpen === 'number' && isFinite(firstOpen) && !isNaN(firstOpen) ? firstOpen : 0;
            var footerClose = openNum + totalDep - totalWith;
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
    if (typeof n !== 'number' || isNaN(n) || !isFinite(n)) return '—';
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FormatAmount(val) {
    var n = typeof val === 'number' && !isNaN(val) ? val : cleanAmount(val);
    if (isNaN(n) || n === 0) return '—';
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
