import { BankStatementService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BankStatementService.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');

/** Pending reconciliation toggle after user confirms modal */
var reconPendingCode = 0;
var reconPendingToYes = false;

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
$(document).ready(function () {
    setDefaultFilterDates();
    BindEvents();
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
        if (!confirm('Match pending GRN payments (Status P) to bank withdrawals by amount and mark those lines reconciled?')) {
            return;
        }
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
    });
    $('#btnClearFilter').on('click', function () {
        setDefaultFilterDates();
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

    $('#tblStatementsBody').off('click.bsReconTog').on('click.bsReconTog', '.bs-recon-toggle', function (e) {
        e.preventDefault();
        var $b = $(this);
        var code = parseInt($b.attr('data-code') || '0', 10);
        var isYes = $b.attr('data-recon') === 'Y';
        var toYes = !isYes;
        openReconConfirmModal(code, toYes);
    });

    $('#btnReconConfirmCancel').off('click.bsReconConf').on('click.bsReconConf', function () {
        closeReconConfirmModal();
    });
    $('#btnReconConfirmOk').off('click.bsReconConf').on('click.bsReconConf', function () {
        confirmReconPending();
    });
    $('#bsReconConfirmBackdrop').off('click.bsReconConf').on('click.bsReconConf', function (e) {
        if (e.target === this) closeReconConfirmModal();
    });

    $(document).off('keydown.bsReconConfirm').on('keydown.bsReconConfirm', function (e) {
        if (e.key !== 'Escape') return;
        if ($('#bsReconConfirmBackdrop').hasClass('active')) {
            e.preventDefault();
            closeReconConfirmModal();
        }
    });
}

function openReconConfirmModal(code, toYes) {
    reconPendingCode = code;
    reconPendingToYes = toYes;
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
}

function confirmReconPending() {
    var code = reconPendingCode;
    var toYes = reconPendingToYes;
    closeReconConfirmModal();
    if (!code) return;
    saveReconciliationState(code, toYes)
        .then(function () {
            toastr && toastr.success(toYes ? 'Marked as reconciled.' : 'Reconciliation cleared.');
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

/** Opening + Deposit − Withdrawal; chain per bank + account (resets when bank/acct changes). */
function computeBalances(sortedItems) {
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
            var st = cleanAmount(row.ServiceTaxNo);
            op = st;
            if (isNaN(op) || !isFinite(op)) {
                var cl0 = cleanAmount(row.ClosingBalance);
                op = !isNaN(cl0) && isFinite(cl0) ? cl0 - dep + w : 0;
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
    return BankStatementService.SetBankStatementReconciliation(code, false)
        .then(function (r) {
            if (isApiResultOk(r)) return r;
            toastr && toastr.error(
                (r && (r.Msg || r.message)) || 'Could not clear reconciliation. Add SetBankStatementReconciliation on the API.'
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
    var fromDate  = isoToApiDate($('#txtFilterFromDate').val().trim());
    var toDate    = isoToApiDate($('#txtFilterToDate').val().trim());

    var $body = $('#tblStatementsBody');
    $body.html('<tr><td colspan="12" class="text-center py-3 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Loading…</td></tr>');
    $('#lblRecordCount').text('');

    Showloader && Showloader();

    loadStatementListForFilter(codes, fromDate, toDate, batchNo)
        .then(function (list) {
            HideLoader && HideLoader();
            $body.empty();

            if (!list || !list.length) {
                $body.html('<tr><td colspan="12" class="text-center py-3 text-muted">No records found.</td></tr>');
                $('#lblRecordCount').text('(0 records)');
                $('#tdTotalWithdrawal').text('—');
                $('#tdTotalDeposit').text('—');
                return;
            }

            var sorted = sortStatementRows(list);
            var computed = computeBalances(sorted);

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

                var reconCell;
                if (row.Code == null || row.Code === '') {
                    reconCell = reconY
                        ? '<span class="bs-badge bs-badge--recon-yes">Yes</span>'
                        : '<span class="bs-badge bs-badge--recon-no">No</span>';
                } else {
                    reconCell = reconY
                        ? '<button type="button" class="bs-recon-toggle bs-badge bs-badge--recon-yes" data-code="'
                            + String(row.Code) + '" data-recon="Y" title="Click to set Not reconciled">Yes</button>'
                        : '<button type="button" class="bs-recon-toggle bs-badge bs-badge--recon-no" data-code="'
                            + String(row.Code) + '" data-recon="N" title="Click to set Reconciled">No</button>';
                }

                var wAmt = cleanAmount(row.WithdrawalAmt);
                var dAmt = cleanAmount(row.DepositAmt);
                if (isNaN(wAmt) || !isFinite(wAmt)) wAmt = 0;
                if (isNaN(dAmt) || !isFinite(dAmt)) dAmt = 0;
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
                        <td class="text-end">${FormatAmount(item.opening)}</td>
                        <td class="text-end">${FormatAmount(wAmt)}</td>
                        <td class="text-end">${FormatAmount(dAmt)}</td>
                        <td class="bs-closing-balance${closeCls}" title="${escHtml(closeTitle)}">${FormatAmount(item.balanceAfter)}</td>
                        <td class="bs-col-hidden bs-col-drcr">${escHtml(row.BalanceType || '—')}</td>
                        <td class="bs-col-hidden bs-col-batch"><span class="fw-semibold text-primary small">${escHtml(row.ImportBatchNo)}</span></td>
                        <td class="text-center bs-recon-cell">${reconCell}</td>
                    </tr>`);
            });

            $('#tdTotalWithdrawal').text(FormatAmount(totalWith));
            $('#tdTotalDeposit').text(FormatAmount(totalDep));
            $('#lblRecordCount').text('(' + list.length + ' records)');
        })
        .catch(function () {
            HideLoader && HideLoader();
            $body.html('<tr><td colspan="12" class="text-center py-3 text-danger">Failed to load records.</td></tr>');
        });
}

window.refreshBankStatementList = LoadStatements;

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
