import { BankStatementService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BankStatementService.js';

// ── Date helpers (same pattern as ProjectMaster) ──────────────────────────────
function formatDate(date) {
    var day   = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year  = date.getFullYear();
    return year + '-' + month + '-' + day;       // YYYY-MM-DD for type="date" inputs
}

function getTodayForInput() {
    return formatDate(new Date());
}

// Convert type="date" value (YYYY-MM-DD) → DD/MM/YYYY expected by the API (style 105)
function isoToApiDate(val) {
    if (!val || !val.trim()) return '';
    var parts = val.split('-');                  // ['YYYY','MM','DD']
    if (parts.length !== 3) return '';
    return parts[2] + '/' + parts[1] + '/' + parts[0];
}

// ── Init ──────────────────────────────────────────────────────────────────────
$(document).ready(function () {
    LoadBankMasterDropdown();
    PreFillFiltersFromUrl();
    BindEvents();
    LoadStatements();    // FromDate and ToDate start blank → all records are returned
});

// ── Pre-fill filter from query string (e.g. ?BatchNo=BS20260413...) ───────────
function PreFillFiltersFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var batchNo = params.get('BatchNo') || '';
    if (batchNo) {
        $('#txtFilterBatchNo').val(batchNo);
    }
}

// ── Load bank master dropdown ─────────────────────────────────────────────────
function LoadBankMasterDropdown() {
    BankStatementService.GetBankMasterList()
        .then(function (data) {
            var list = Array.isArray(data) ? data
                     : (Array.isArray(data && data.data) ? data.data
                     : (Array.isArray(data && data.Data) ? data.Data : []));
            var $ddl = $('#ddlFilterBank');
            $ddl.find('option:not(:first)').remove();
            if (list && list.length) {
                $.each(list, function (i, b) {
                    var code = b.Code || b.BankMaster_Code || 0;
                    var name = (b.BankName || '').trim();
                    var short = b.BankShortCode ? ' (' + b.BankShortCode + ')' : '';
                    $ddl.append($('<option></option>').val(code).text(name + short));
                });
            }
        })
        .catch(function () {});
}

// ── Bind events ───────────────────────────────────────────────────────────────
function BindEvents() {
    $('#btnSearch').on('click', function () { LoadStatements(); });
    $('#btnRefreshList').on('click', function () { LoadStatements(); });
    $('#btnClearFilter').on('click', function () {
        $('#ddlFilterBank').val('0');
        $('#txtFilterBatchNo').val('');
        $('#txtFilterFromDate').val('');
        $('#txtFilterToDate').val('');
        history.replaceState(null, '', window.location.pathname);
        LoadStatements();
    });
    $('#btnImportNew').on('click', function () {
        window.location.href = '/FinanceTransactions/BankStatement/BankStatementImport';
    });

    // Allow Enter key in filter inputs to trigger search
    $('#txtFilterBatchNo, #txtFilterFromDate, #txtFilterToDate').on('keydown', function (e) {
        if (e.key === 'Enter') LoadStatements();
    });
}

// ── Load statements ───────────────────────────────────────────────────────────
function LoadStatements() {
    var bankCode  = parseInt($('#ddlFilterBank').val() || '0', 10) || 0;
    var batchNo   = $('#txtFilterBatchNo').val().trim();
    // Convert YYYY-MM-DD (type="date") → DD/MM/YYYY (API style 105)
    var fromDate  = isoToApiDate($('#txtFilterFromDate').val().trim());
    var toDate    = isoToApiDate($('#txtFilterToDate').val().trim());

    var $body = $('#tblStatementsBody');
    $body.html('<tr><td colspan="13" class="text-center py-3 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Loading…</td></tr>');
    $('#lblRecordCount').text('');

    Showloader && Showloader();

    BankStatementService.GetBankStatementList(bankCode, '', fromDate, toDate, batchNo)
        .then(function (data) {
            HideLoader && HideLoader();
            $body.empty();

            var list = Array.isArray(data) ? data
                     : (Array.isArray(data && data.data) ? data.data
                     : (Array.isArray(data && data.Data) ? data.Data : []));

            if (!list || !list.length) {
                $body.html('<tr><td colspan="13" class="text-center py-3 text-muted">No records found.</td></tr>');
                $('#lblRecordCount').text('(0 records)');
                $('#tdTotalWithdrawal').text('—');
                $('#tdTotalDeposit').text('—');
                return;
            }

            var totalWith = 0, totalDep = 0;

            $.each(list, function (i, row) {
                var reconBadge = row.IsReconciled === 'Y'
                    ? '<span class="bs-badge bs-badge--ok">Yes</span>'
                    : '<span class="bs-badge" style="background:#f3f4f6;color:#6b7280;border:1px solid #d1d5db;">No</span>';

                totalWith += parseFloat(row.WithdrawalAmt) || 0;
                totalDep  += parseFloat(row.DepositAmt)    || 0;

                $body.append(`
                    <tr>
                        <td>${i + 1}</td>
                        <td>${escHtml(row.TxnDate)}</td>
                        <td>${escHtml(row.BankName)}</td>
                        <td>${escHtml(row.AccountNo)}</td>
                        <td class="bs-narration-cell" title="${escHtml(row.Narration)}">${escHtml(TruncStr(row.Narration, 50))}</td>
                        <td>${escHtml(row.ChequeRefNo || '—')}</td>
                        <td>${escHtml(row.ValueDate || '—')}</td>
                        <td class="text-end">${FormatAmount(row.WithdrawalAmt)}</td>
                        <td class="text-end">${FormatAmount(row.DepositAmt)}</td>
                        <td class="text-end">${FormatAmount(row.ClosingBalance)}</td>
                        <td>${escHtml(row.BalanceType || '—')}</td>
                        <td><span class="fw-semibold text-primary small">${escHtml(row.ImportBatchNo)}</span></td>
                        <td class="text-center">${reconBadge}</td>
                    </tr>`);
            });

            $('#tdTotalWithdrawal').text(FormatAmount(totalWith));
            $('#tdTotalDeposit').text(FormatAmount(totalDep));
            $('#lblRecordCount').text('(' + list.length + ' records)');
        })
        .catch(function () {
            HideLoader && HideLoader();
            $body.html('<tr><td colspan="13" class="text-center py-3 text-danger">Failed to load records.</td></tr>');
        });
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function FormatAmount(val) {
    var n = parseFloat(val);
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
