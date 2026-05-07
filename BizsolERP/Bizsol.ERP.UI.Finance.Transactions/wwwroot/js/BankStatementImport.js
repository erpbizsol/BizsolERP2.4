import { BankStatementService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BankStatementService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');
var parsedRows    = [];   
var fileHeaders   = [];   
var columnMappers = {};   
var deleteBatchNo = '';
/** Batch no for “Open full list” from history detail modal */
var historyDetailBatchNo = '';
/** Full grid from the last successful parse (incl. header/metadata) — used to re-check bank / account on import. */
var lastParsedFullRows = null;

var LOCK_STORAGE_KEY = 'BizSol_BankStmt_DayLocks';

/** One-time: old BankStatementList merged every list date into locks → preview showed 0 importable. */
(function migrateStaleDayLocksOnce() {
    try {
        if (!localStorage.getItem('BizSol_BankStmt_LockMig_v1')) {
            localStorage.removeItem(LOCK_STORAGE_KEY);
            localStorage.setItem('BizSol_BankStmt_LockMig_v1', '1');
        }
    } catch (e) { /* ignore */ }
})();

function lockStorageKey(bankCode, accountNo) {
    return String(bankCode || 0) + '|' + String(accountNo || '').replace(/\s/g, '');
}

function getDayLocks() {
    try {
        return JSON.parse(localStorage.getItem(LOCK_STORAGE_KEY) || '{}');
    } catch (e) {
        return {};
    }
}

function mergeImportedDays(bankCode, accountNo, isoDateKeys) {
    if (!isoDateKeys || !isoDateKeys.length) return;
    var k = lockStorageKey(bankCode, accountNo);
    var all = getDayLocks();
    all[k] = all[k] || {};
    isoDateKeys.forEach(function (key) {
        if (key) all[k][key] = true;
    });
    localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(all));
}

function isDayLocked(bankCode, accountNo, isoDateKey) {
    if (!isoDateKey) return false;
    var all = getDayLocks();
    return !!(all[lockStorageKey(bankCode, accountNo)] || {})[isoDateKey];
}

var FIELD_DEFS = [
    { field: 'TxnDate',
      label: 'Date',
      /* Specific first: substring "date" matches "Value Date" before "Date" → empty txn dates. */
      patterns: ['transaction date', 'txn date', 'trans date', 'tran date', 'tran. date',
                 'transaction dt', 'posting date', 'book date', 'statement date',
                 'trndate', 'trn date', 'valuedate',
                 'date'] },
    { field: 'Narration',
      label: 'Narration',
      patterns: ['narration','description','particulars','details','remarks',
                 'desc','transaction details','transaction narration',
                 'transaction remarks','transaction description'] },
    { field: 'ChequeRefNo',
      label: 'Chq / Ref No',
      patterns: ['chq./ref.no.','chq/ref no','chq. no.','chq no','cheque no',
                 'cheque number','reference no','ref no','ref number',
                 'instrument no','utr no','utr number','ref','chq'] },
    { field: 'ValueDate',
      label: 'Value Date',
      patterns: ['value date','val date','value dt','valuedate'] },
    { field: 'OpeningBalance',
      label: 'Opening Balance',
      patterns: ['opening balance','opening bal','opening','op bal','op. bal','obl',
                 'ob','opening amt'] },
    { field: 'WithdrawalAmt',
      label: 'Withdrawal (Dr)',
      patterns: ['withdrawal amt.','withdrawal amt','withdrawal amount','withdrawal',
                 'debit amt','debit amount','debit','dr amt','dr amount','dr'] },
    { field: 'DepositAmt',
      label: 'Deposit (Cr)',
      patterns: ['deposit amt.','deposit amt','deposit amount','deposit',
                 'credit amt','credit amount','credit','cr amt','cr amount','cr'] },
    { field: 'ClosingBalance',
      label: 'Closing Balance',
      patterns: ['closing balance','closing bal','balance','bal','running balance',
                 'closing','available balance'] },
    { field: 'BalanceType',
      label: 'Dr / Cr',
      patterns: ['dr/cr','cr/dr','bal type','balance type','type'] }
];

// ── Init ──────────────────────────────────────────────────────────────────────
$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    LoadBankMasterDropdown();
    LoadImportHistory();
    BindEvents();
});

// ── Load bank master dropdown ─────────────────────────────────────────────────
function LoadBankMasterDropdown() {
    BankStatementService.GetBankMasterList()
        .then(function (data) {
            var list = Array.isArray(data) ? data
                     : (Array.isArray(data && data.data) ? data.data
                     : (Array.isArray(data && data.Data) ? data.Data : []));
            var $ddl = $('#ddlBankMaster');
            $ddl.find('option:not(:first)').remove();
            if (list && list.length) {
                $.each(list, function (i, b) {
                    var code    = b.Code || b.BankMaster_Code || 0;
                    var name    = (b.BankName || '').trim();
                    var shortC  = (b.BankShortCode || '').trim();
                    var short   = shortC ? ' (' + shortC + ')' : '';
                    var account = (b.AccountNo || '').trim();
                    $ddl.append(
                        $('<option></option>')
                            .val(code)
                            .text(name + short)
                            .attr('data-account', account)
                            .attr('data-bank-name', name)
                            .attr('data-bank-short', shortC)
                    );
                });
            }
        })
        .catch(function () {});
}

// ── Load import history ───────────────────────────────────────────────────────
function LoadImportHistory() {
    var $body = $('#tblHistoryBody');
    $body.html('<tr><td colspan="10" class="text-center py-3 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Loading…</td></tr>');

    BankStatementService.GetImportLog(0, '', '')
        .then(function (data) {
            $body.empty();
            if (!data || !data.length) {
                $body.html('<tr><td colspan="10" class="text-center py-3 text-muted">No import history found.</td></tr>');
                return;
            }
            $.each(data, function (i, row) {
                var successClass = row.FailedRecords > 0 ? 'text-warning' : 'text-success';
                $body.append(`
                    <tr>
                        <td>${i + 1}</td>
                        <td><span class="fw-semibold text-primary">${escHtml(row.ImportBatchNo)}</span></td>
                        <td>${escHtml(row.BankName)}</td>
                        <td>${escHtml(row.AccountNo)}</td>
                        <td>${escHtml(row.FileName || '—')}</td>
                        <td class="text-center">${row.TotalRecords}</td>
                        <td class="text-center ${successClass}">${row.SuccessRecords}</td>
                        <td class="text-center ${row.FailedRecords > 0 ? 'text-danger' : ''}">${row.FailedRecords}</td>
                        <td>${FormatDateTime(row.ImportDate)}</td>
                        <td class="text-center">
                            <button type="button" class="bs-icon-btn bs-icon-btn--view bs-history-view-btn" title="View batch history"
                                data-batch="${escHtml(String(row.ImportBatchNo || ''))}"
                                data-bank="${escHtml(String(row.BankName || ''))}"
                                data-account="${escHtml(String(row.AccountNo || ''))}"
                                data-file="${escHtml(String(row.FileName || ''))}"
                                data-total="${escHtml(String(row.TotalRecords != null ? row.TotalRecords : ''))}"
                                data-success="${escHtml(String(row.SuccessRecords != null ? row.SuccessRecords : ''))}"
                                data-failed="${escHtml(String(row.FailedRecords != null ? row.FailedRecords : ''))}"
                                data-import-date="${escHtml(FormatDateTime(row.ImportDate))}">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>`);
            });
        })
        .catch(function () {
            $body.html('<tr><td colspan="10" class="text-center py-3 text-danger">Failed to load history.</td></tr>');
        });
}

// ── Import history: batch detail modal (eye icon) ───────────────────────────
function normalizeStatementListForModal(data) {
    if (Array.isArray(data)) return data;
    if (data == null) return [];
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.Data)) return data.Data;
    if (Array.isArray(data.result)) return data.result;
    if (Array.isArray(data.Result)) return data.Result;
    if (Array.isArray(data.list)) return data.list;
    if (Array.isArray(data.List)) return data.List;
    return [];
}

function sortRowsForHistoryModal(list) {
    return list.slice().sort(function (a, b) {
        var ia = ConvertToIsoDate(a.TxnDate);
        var ib = ConvertToIsoDate(b.TxnDate);
        if (ia && ib) {
            var c = ia.localeCompare(ib);
            if (c !== 0) return c;
        } else if (ia) return -1;
        else if (ib) return 1;
        var ca = parseInt(a.Code, 10) || 0;
        var cb = parseInt(b.Code, 10) || 0;
        return ca - cb;
    });
}

function readHistorySummaryFromBtn($btn) {
    return {
        batchNo: ($btn.attr('data-batch') || '').trim(),
        bankName: $btn.attr('data-bank') || '',
        accountNo: $btn.attr('data-account') || '',
        fileName: $btn.attr('data-file') || '',
        total: $btn.attr('data-total') || '—',
        success: $btn.attr('data-success') || '—',
        failed: $btn.attr('data-failed') || '—',
        importDate: $btn.attr('data-import-date') || '—'
    };
}

function renderHistoryDetailSummary(s) {
    var safe = function (x) { return escHtml(x == null || x === '' ? '—' : String(x)); };
    var html = ''
        + '<dl class="bs-hist-summary-grid">'
        + '<div><dt>Batch no</dt><dd>' + safe(s.batchNo) + '</dd></div>'
        + '<div><dt>Bank</dt><dd>' + safe(s.bankName) + '</dd></div>'
        + '<div><dt>Account</dt><dd>' + safe(s.accountNo) + '</dd></div>'
        + '<div><dt>File name</dt><dd>' + safe(s.fileName) + '</dd></div>'
        + '<div><dt>Total rows</dt><dd>' + safe(s.total) + '</dd></div>'
        + '<div><dt>Success</dt><dd>' + safe(s.success) + '</dd></div>'
        + '<div><dt>Failed</dt><dd>' + safe(s.failed) + '</dd></div>'
        + '<div><dt>Import date</dt><dd>' + safe(s.importDate) + '</dd></div>'
        + '</dl>';
    $('#bsHistDetailSummary').html(html);
}

function fmtAmtCell(v) {
    var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '').trim());
    if (isNaN(n) || n === 0) return '—';
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function populateHistoryDetailLines(list) {
    var $tb = $('#tblHistDetailBody');
    $tb.empty();
    if (!list || !list.length) {
        $tb.html('<tr><td colspan="8" class="text-center py-3 text-muted">No statement rows returned for this batch.</td></tr>');
        return;
    }
    var sorted = sortRowsForHistoryModal(list);
    $.each(sorted, function (i, row) {
        var w = fmtAmtCell(row.WithdrawalAmt);
        var d = fmtAmtCell(row.DepositAmt);
        var c = fmtAmtCell(row.ClosingBalance);
        $tb.append(
            '<tr>'
            + '<td>' + (i + 1) + '</td>'
            + '<td>' + escHtml(row.TxnDate != null ? String(row.TxnDate) : '—') + '</td>'
            + '<td>' + escHtml(row.AccountNo != null ? String(row.AccountNo) : '—') + '</td>'
            + '<td class="bs-narration-cell" title="' + escHtml(row.Narration || '') + '">' + escHtml(TruncStr(row.Narration || '', 48)) + '</td>'
            + '<td>' + escHtml(row.ChequeRefNo != null && row.ChequeRefNo !== '' ? String(row.ChequeRefNo) : '—') + '</td>'
            + '<td class="text-end">' + w + '</td>'
            + '<td class="text-end">' + d + '</td>'
            + '<td class="text-end">' + c + '</td>'
            + '</tr>'
        );
    });
}

function closeImportBatchHistoryModal() {
    $('#bsHistoryDetailBackdrop').removeClass('active').attr('aria-hidden', 'true');
    historyDetailBatchNo = '';
    $('#tblHistDetailBody').empty();
}

function openImportBatchHistoryModal(summary) {
    if (!summary || !summary.batchNo) {
        toastr && toastr.warning('Missing batch number.');
        return;
    }
    historyDetailBatchNo = summary.batchNo;
    $('#bsHistoryDetailBackdrop').addClass('active').attr('aria-hidden', 'false');
    renderHistoryDetailSummary(summary);
    $('#tblHistDetailBody').html(
        '<tr><td colspan="8" class="text-center py-3 text-muted">'
        + '<i class="fas fa-spinner fa-spin me-2"></i>Loading statement lines…</td></tr>'
    );

    var fromD = '01/01/2000';
    var toD = '31/12/2099';

    Showloader && Showloader();
    BankStatementService.GetBankStatementList(0, '', fromD, toD, summary.batchNo)
        .then(function (data) {
            HideLoader && HideLoader();
            populateHistoryDetailLines(normalizeStatementListForModal(data));
        })
        .catch(function () {
            HideLoader && HideLoader();
            $('#tblHistDetailBody').html(
                '<tr><td colspan="8" class="text-center py-3 text-danger">Could not load lines for this batch.</td></tr>'
            );
        });
}

// ── Bind all events ───────────────────────────────────────────────────────────
function BindEvents() {

    // File chosen — update label and enable Parse button
    $('#fileStatementUpload').on('change', function () {
        var file = this.files[0];
        if (!file) return;
        $('#lblFileName').text(file.name);
        var bankOk = parseInt($('#ddlBankMaster').val() || '0', 10) > 0;
        $('#btnParseFile').prop('disabled', !bankOk);
        ResetPreview();
    });

    // Auto-fill Account Number when a bank is selected
    $('#ddlBankMaster').on('change', function () {
        var $selected = $(this).find('option:selected');
        var account   = $selected.data('account') || '';
        var $acct     = $('#txtAccountNumber');

        // Always keep the Account Number field fully editable —
        // remove disabled / readonly before setting the value.
        $acct.prop('disabled', false).prop('readonly', false).val(account);

        var fileReady = $('#fileStatementUpload')[0].files.length > 0;
        $('#btnParseFile').prop('disabled', !fileReady);
    });

    // Re-check parse button when account number is typed manually
    $('#txtAccountNumber').on('input', function () {
        var fileReady = $('#fileStatementUpload')[0].files.length > 0;
        $('#btnParseFile').prop('disabled', !fileReady);
    });

    // Parse button
    $('#btnParseFile').on('click', function () { ParseFile(); });

    // Clear button
    $('#btnClearFile').on('click', function () { ClearAll(); });

    // Back to step 1
    $('#btnBackToStep1').on('click', function () {
        $('#cardStep2').hide();
        $('#cardStep1').show();
    });

    // Preview checkboxes — scope to #tblPreviewBody; .off namespaced (list page loads this module twice)
    $('#chkSelectAll').off('change.bsPreviewChk').on('change.bsPreviewChk', function () {
        var checked = $(this).prop('checked');
        $(this).prop('indeterminate', false);
        $('#tblPreviewBody .row-chk').prop('checked', checked);
        syncPreviewSelectAllHeader();
        UpdateSelectedCount();
        UpdateImportButton();
    });

    $('#btnSelectAll').off('click.bsPreviewChk').on('click.bsPreviewChk', function (e) {
        e.preventDefault();
        var $body = $('#tblPreviewBody');
        var $allChk = $body.find('.row-chk');
        if (!$allChk.length) {
            $('#chkSelectAll').prop({ checked: false, indeterminate: false });
            UpdateSelectedCount();
            UpdateImportButton();
            return;
        }
        $allChk.prop('checked', true);
        $('#chkSelectAll').prop({ checked: true, indeterminate: false });
        syncPreviewSelectAllHeader();
        UpdateSelectedCount();
        UpdateImportButton();
    });

    $('#btnDeselectAll').off('click.bsPreviewChk').on('click.bsPreviewChk', function (e) {
        e.preventDefault();
        $('#tblPreviewBody .row-chk').prop('checked', false);
        $('#chkSelectAll').prop({ checked: false, indeterminate: false });
        syncPreviewSelectAllHeader();
        UpdateSelectedCount();
        UpdateImportButton();
    });

    // Import button
    $('#btnImport').on('click', function () { DoImport(); });

    // Close the import overlay (or navigate back if running as a standalone page)
    function closeImportModal() {
        var $b = $('#bsImportBackdrop');
        if ($b.length) {
            $b.removeClass('active').attr('aria-hidden', 'true');
        } else {
            window.location = baseUrl + '/FinanceTransactions/BankStatement/BankStatementList';
        }
    }
    $('#btnViewList').on('click', closeImportModal);
    $('#btnCloseImportModal').on('click', closeImportModal);

    // Clicking the dimmed area behind the panel closes the overlay
    $('#bsImportBackdrop').on('click', function (e) {
        if (e.target === this) closeImportModal();
    });

    // Escape closes the import overlay (unless a nested dialog is open)
    $(document).on('keydown.bsImportModal', function (e) {
        if (e.key !== 'Escape') return;
        if ($('#bsHistoryDetailBackdrop').hasClass('active')) {
            e.preventDefault();
            closeImportBatchHistoryModal();
            return;
        }
        if ($('#bsResultBackdrop').hasClass('active') || $('#bsDeleteBackdrop').hasClass('active')) return;
        if ($('#bsImportBackdrop').hasClass('active')) {
            e.preventDefault();
            closeImportModal();
        }
    });

    // Delete dialog buttons
    $('#btnCancelDelete').on('click', function () { CloseDeleteModal(); });
    $('#btnConfirmDelete').on('click', function () { DoDeleteBatch(); });

    // Refresh history
    $('#btnRefreshHistory').on('click', function () { LoadImportHistory(); });

    // Recent Import History — view batch in modal (namespaced: list page loads this module with BankStatementList.js)
    $('#tblHistoryBody').off('click.bsHistView').on('click.bsHistView', '.bs-history-view-btn', function (e) {
        e.preventDefault();
        openImportBatchHistoryModal(readHistorySummaryFromBtn($(this)));
    });

    $('#btnCloseHistoryDetail, #btnHistDetailOk').off('click.bsHistModal').on('click.bsHistModal', function () {
        closeImportBatchHistoryModal();
    });

    $('#btnHistDetailOpenList').off('click.bsHistModalOpen').on('click.bsHistModalOpen', function () {
        var b = historyDetailBatchNo;
        closeImportBatchHistoryModal();
        if (b) window.ViewBatch(b);
    });

    $('#bsHistoryDetailBackdrop').off('click.bsHistBackdrop').on('click.bsHistBackdrop', function (e) {
        if (e.target === this) closeImportBatchHistoryModal();
    });

    // Result modal close button
    $('#btnResultClose').on('click', function () { CloseResultModal(); });

    // File format — changing type clears the current file so extension and format stay aligned
    $('#ddlFileType').on('change', function () {
        $('#fileStatementUpload').val('');
        $('#lblFileName').text('No file chosen');
        $('#btnParseFile').prop('disabled', true);
        ResetPreview();
    });
}

// ── Parse statement file (CSV / TXT or Excel) ─────────────────────────────────
function ParseFile() {
    var file = $('#fileStatementUpload')[0].files[0];
    if (!file) { toastr.warning('Please select a file first.'); return; }

    if (!ValidateStep1()) return;
    if (!ValidateFileFormatMatchesExtension(file)) return;

    var fmt = $('#ddlFileType').val() || 'csv';
    if (fmt === 'excel') {
        ParseExcelFile(file);
    } else {
        ParseCsvFile(file);
    }
}

function ValidateFileFormatMatchesExtension(file) {
    var fmt = $('#ddlFileType').val() || 'csv';
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    var isExcel = ext === 'xls' || ext === 'xlsx';
    var isCsvish = ext === 'csv' || ext === 'txt';

    if (fmt === 'excel' && !isExcel) {
        toastr.warning('File Format is Excel, but the selected file is not .xls or .xlsx.');
        return false;
    }
    if (fmt === 'csv' && isExcel) {
        toastr.warning('File Format is CSV, but the selected file is Excel. Switch File Format to Excel or pick a CSV/TXT file.');
        return false;
    }
    if (fmt === 'csv' && !isCsvish) {
        toastr.warning('Please choose a .csv or .txt file, or change File Format to Excel.');
        return false;
    }
    return true;
}

function ParseCsvFile(file) {
    Showloader && Showloader();
    var reader = new FileReader();
    reader.onload = function (e) {
        try {
            var text = e.target.result;
            var rows = ParseCSV(text);
            FinalizeStatementParse(rows);
        } catch (ex) {
            HideLoader && HideLoader();
            toastr.error('Failed to parse CSV: ' + ex.message);
        }
    };
    reader.onerror = function () {
        HideLoader && HideLoader();
        toastr.error('Failed to read file.');
    };
    reader.readAsText(file);
}

function ParseExcelFile(file) {
    if (typeof window.XLSX === 'undefined') {
        toastr.error('Excel reader (SheetJS) is not loaded. Refresh the page and try again.');
        return;
    }
    Showloader && Showloader();
    var reader = new FileReader();
    reader.onload = function (e) {
        try {
            var data = new Uint8Array(e.target.result);
            var wb = window.XLSX.read(data, { type: 'array', cellDates: true });
            if (!wb.SheetNames || !wb.SheetNames.length) {
                HideLoader && HideLoader();
                toastr.error('The workbook has no sheets.');
                return;
            }
            var ws = wb.Sheets[wb.SheetNames[0]];
            var rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
            FinalizeStatementParse(rows);
        } catch (ex) {
            HideLoader && HideLoader();
            toastr.error('Failed to parse Excel: ' + ex.message);
        }
    };
    reader.onerror = function () {
        HideLoader && HideLoader();
        toastr.error('Failed to read file.');
    };
    reader.readAsArrayBuffer(file);
}

/** Normalise ragged rows and cell values to trimmed strings (dates → DD/MM/YY). */
function NormalizeStatementGrid(rows) {
    if (!rows || !rows.length) return [];
    return rows.map(function (row) {
        if (!row) return [];
        return row.map(function (cell) {
            if (cell == null || cell === '') return '';
            if (Object.prototype.toString.call(cell) === '[object Date]') {
                var d = cell.getDate();
                var mo = cell.getMonth() + 1;
                var y = cell.getFullYear();
                var pad = function (n) { return String(n).padStart(2, '0'); };
                return pad(d) + '/' + pad(mo) + '/' + String(y).slice(-2);
            }
            return String(cell).trim();
        });
    });
}

function JoinRowsForIdentityScan(rows, maxRows) {
    var lim = Math.min(rows.length, maxRows || 55);
    var parts = [];
    for (var i = 0; i < lim; i++) {
        var r = rows[i];
        if (!r) continue;
        for (var j = 0; j < r.length; j++) {
            var c = r[j];
            if (c != null && String(c).trim() !== '') parts.push(String(c));
        }
    }
    return parts.join(' ');
}

function digitsOnly(s) {
    return (s || '').replace(/\D/g, '');
}

function extractAccountFromStatement(rows) {
    var blob = JoinRowsForIdentityScan(rows, 60);
    var patterns = [
        /account\s*(?:number|no\.?)?\s*[:#.\s]+\s*([0-9][0-9\s\-]{7,22})/i,
        /a\/\s*c\s*(?:number|no\.?)?\s*[:#.\s]*\s*([0-9][0-9\s\-]{7,22})/i,
        /\bacct\s*no\.?\s*[:#.\s]*\s*([0-9][0-9\s\-]{7,22})/i
    ];
    for (var p = 0; p < patterns.length; p++) {
        var m = blob.match(patterns[p]);
        if (m) return m[1].replace(/\s/g, '').replace(/-/g, '');
    }
    return null;
}

function getSelectedBankContext() {
    var $opt = $('#ddlBankMaster option:selected');
    return {
        name: ($opt.data('bank-name') || '').trim() || ($opt.text() || '').trim(),
        shortCode: ($opt.data('bank-short') || '').trim()
    };
}

function bankNameFromFileMatchesSelection(rows) {
    var blobLower = JoinRowsForIdentityScan(rows, 65).toLowerCase();
    var ctx = getSelectedBankContext();

    if (ctx.shortCode && ctx.shortCode.length >= 3) {
        var sc = ctx.shortCode.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (sc.length >= 3 && blobLower.indexOf(sc) >= 0) return true;
    }

    var bankLabel = (ctx.name || '').split('(')[0].trim();
    var words = (bankLabel.match(/[a-z0-9]+/gi) || []).map(function (w) { return w.toLowerCase(); });
    var stop = { bank: true, ltd: true, limited: true, the: true, of: true, and: true, co: true };
    var keywords = words.filter(function (w) { return w.length >= 3 && !stop[w]; });
    if (!keywords.length) keywords = words.filter(function (w) { return w.length >= 4; });
    if (!keywords.length) keywords = words.filter(function (w) { return w.length >= 2; });
    if (!keywords.length) return false;

    return keywords.every(function (kw) { return blobLower.indexOf(kw) >= 0; });
}

function ValidateStatementIdentity(rows) {
    var expectedAcct = digitsOnly($('#txtAccountNumber').val());
    if (!expectedAcct) {
        toastr.warning('Please enter the account number.');
        $('#txtAccountNumber').focus();
        return false;
    }

    var fileAcct = extractAccountFromStatement(rows);
    if (!fileAcct) {
        toastr.error('Could not read an account number from the statement header. Check the file or your File Format selection.');
        return false;
    }
    if (digitsOnly(fileAcct) !== expectedAcct) {
        toastr.error('The account number in the file does not match the Account Number you entered. Import is not allowed.');
        return false;
    }

    if (!bankNameFromFileMatchesSelection(rows)) {
        toastr.error('The bank details in the file do not match the Bank you selected. Import is not allowed.');
        return false;
    }
    return true;
}

function FinalizeStatementParse(rawRows) {
    HideLoader && HideLoader();
    try {
        var rows = NormalizeStatementGrid(rawRows);

        if (!rows || rows.length < 2) {
            toastr.error('File appears to be empty or has only a header row.');
            return;
        }

        if (!ValidateStatementIdentity(rows)) return;

        lastParsedFullRows = rows;

        var headerIdx = FindHeaderRow(rows);
        fileHeaders = rows[headerIdx];

        var dataRows = rows.slice(headerIdx + 1).filter(function (r) {
            if (!r.some(function (c) { return c && String(c).trim() !== ''; })) return false;
            return !IsGarbageRow(r);
        });

        if (!dataRows.length) {
            toastr.error('No data rows found after the header.');
            lastParsedFullRows = null;
            return;
        }

        parsedRows = dataRows;
        BuildColumnMappingUI(fileHeaders);
        AutoMapColumns(fileHeaders);
        inferTxnDateColumnIfNeeded();
        RenderPreviewTable();
        $('#cardStep2').show();
        $('#cardStep1').hide();
    } catch (ex) {
        lastParsedFullRows = null;
        toastr.error('Failed to process file: ' + ex.message);
    }
}

// ── CSV parser — handles quoted fields and common delimiters ──────────────────
function ParseCSV(text) {
    // Detect delimiter by scanning first 30 non-blank lines and picking the
    // delimiter that appears most consistently (max total count wins).
    // Using only the first line fails when the file starts with metadata rows
    // that contain no delimiters.
    var lines30 = text.split(/\r?\n/).filter(function (l) { return l.trim(); }).slice(0, 30);
    var delimiter = ',';
    var counts = { ',': 0, '\t': 0, '|': 0, ';': 0 };
    lines30.forEach(function (line) {
        for (var d in counts) counts[d] += (line.match(new RegExp('\\' + d, 'g')) || []).length;
    });
    var maxD = Object.keys(counts).reduce(function (a, b) { return counts[a] >= counts[b] ? a : b; });
    if (counts[maxD] > 0) delimiter = maxD;

    var rows = [];
    var lines = text.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!line.trim()) continue;
        rows.push(ParseCSVLine(line, delimiter));
    }
    return rows;
}

function ParseCSVLine(line, delimiter) {
    var result = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (ch === delimiter && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

// ── Build column-mapping dropdowns ───────────────────────────────────────────
function BuildColumnMappingUI(headers) {
    var $row = $('#divMappingRow').empty();
    var optionsHtml = '<option value="-1">-- Skip --</option>';
    headers.forEach(function (h, i) {
        optionsHtml += `<option value="${i}">${escHtml(h)}</option>`;
    });

    FIELD_DEFS.forEach(function (fd) {
        $row.append(`
            <div class="col-6 col-sm-4 col-md-3 col-lg-2">
                <div class="bs-mapping-row-label">${fd.label}</div>
                <select id="map_${fd.field}" class="form-control form-control-sm bs-input map-select" data-field="${fd.field}">
                    ${optionsHtml}
                </select>
            </div>`);
    });

    $('#divColumnMapping').show();

    $('.map-select').off('change.bsMap').on('change.bsMap', function () {
        columnMappers[$(this).data('field')] = parseInt($(this).val(), 10);
        RenderPreviewTable();
    });
}

// ── Detect separator / filler rows ───────────────────────────────────────────
// Returns true for rows whose non-empty cells consist entirely of non-data
// characters like *** ---- === ~~~ (common bank statement dividers).
function IsGarbageRow(row) {
    var nonEmpty = row.filter(function (c) { return String(c || '').trim() !== ''; });
    if (!nonEmpty.length) return true;

    // Characters that, when a cell contains ONLY them, mark it as filler
    var garbageRe = /^[*\-=_~.\/\\| \t]+$/;

    var garbageCount = nonEmpty.filter(function (c) {
        return garbageRe.test(String(c || '').trim());
    }).length;

    // Row is garbage when ≥ 70 % of its non-empty cells are filler chars
    return (garbageCount / nonEmpty.length) >= 0.7;
}

// ── Find the real header row (many bank CSVs have metadata before headers) ────
// Scans the first 25 rows and picks the one with the most bank-header keywords.
// Returns the row index (0-based); falls back to 0 if nothing better is found.
function FindHeaderRow(rows) {
    var headerKeywords = [
        'date', 'narration', 'description', 'particulars',
        'debit', 'credit', 'withdrawal', 'deposit',
        'balance', 'closing', 'opening', 'ref', 'chq', 'cheque', 'amount', 'value'
    ];

    var bestScore = 0;
    var bestIdx   = 0;
    var limit     = Math.min(rows.length, 25);

    for (var i = 0; i < limit; i++) {
        var score = 0;
        rows[i].forEach(function (cell) {
            var lower = String(cell || '').toLowerCase().trim();
            if (!lower) return;
            headerKeywords.forEach(function (kw) {
                if (lower === kw || lower.indexOf(kw) >= 0) score++;
            });
        });
        if (score > bestScore) {
            bestScore = score;
            bestIdx   = i;
        }
    }

    return (bestScore >= 2) ? bestIdx : 0;
}

/** Avoid mapping TxnDate to "Value Date" when using generic pattern "date". */
function autoMapHeaderMatchesField(field, lh, p) {
    if (!lh || !p) return false;
    if (lh === p) return true;
    if (lh.indexOf(p) >= 0) {
        if (field === 'TxnDate' && p === 'date') {
            var norm = lh.replace(/\s+/g, ' ').trim();
            if (norm === 'value date' || norm === 'val date' || norm === 'value dt') return false;
            if (norm.indexOf('value date') === 0) return false;
            if (norm.indexOf('value ') === 0 && norm.indexOf('date') >= 0) return false;
        }
        return true;
    }
    return lh.length >= 3 && p.indexOf(lh) >= 0;
}

// ── Auto-detect column mapping from header names ──────────────────────────────
function AutoMapColumns(headers) {
    var lowerHeaders = headers.map(function (h) { return (h || '').toLowerCase().trim(); });

    FIELD_DEFS.forEach(function (fd) {
        var matched = -1;
        fd.patterns.forEach(function (p) {
            if (matched >= 0) return;
            lowerHeaders.forEach(function (lh, idx) {
                if (matched >= 0) return;
                if (!lh) return; // skip empty header cells — avoids false matches
                if (autoMapHeaderMatchesField(fd.field, lh, p)) {
                    matched = idx;
                }
            });
        });
        columnMappers[fd.field] = matched;
        $('#map_' + fd.field).val(matched);
    });
}

// ── Render preview table ──────────────────────────────────────────────────────
function RenderPreviewTable() {
    var $body = $('#tblPreviewBody');
    $body.empty();

    var bankCode  = parseInt($('#ddlBankMaster').val() || '0', 10) || 0;
    var accountNo = ($('#txtAccountNumber').val() || '').trim();

    var totalWithdrawal = 0, totalDeposit = 0;
    var validCount = 0;
    var invalidDateRows = 0;
    var lockedRows = 0;

    parsedRows.forEach(function (row, idx) {
        var mapped  = MapRow(row);
        var dateRaw = mapped.TxnDate ? mapped.TxnDate.trim() : '';

        var valRaw     = mapped.ValueDate ? mapped.ValueDate.trim() : '';
        var valIso     = valRaw ? ConvertToIsoDate(valRaw) : null;
        var valDisplay = valIso ? IsoToDMY(valIso) : (valRaw || '');

        var rawTxnIso   = dateRaw ? ConvertToIsoDate(dateRaw) : null;
        var txnIso      = resolveStatementTxnIso(mapped);
        var dateDisplay = rawTxnIso ? IsoToDMY(rawTxnIso) : (txnIso ? IsoToDMY(txnIso) : (dateRaw || valRaw || ''));

        var isValid  = !!txnIso;
        var isoKey   = txnIso ? txnIso.substring(0, 10) : '';
        var locked   = isValid && isDayLocked(bankCode, accountNo, isoKey);

        if (!txnIso) invalidDateRows++;
        else if (locked) lockedRows++;

        var rowClass = isValid ? (locked ? 'bs-row-error' : 'bs-row-ok') : 'bs-row-error';
        var badge;
        if (locked) {
            badge = '<span class="bs-badge bs-badge-dup">Day locked</span>';
        } else if (isValid) {
            badge = '<span class="bs-badge bs-badge--ok">OK</span>';
        } else {
            badge = dateRaw
                ? '<span class="bs-badge bs-badge--error">Invalid Date</span>'
                : '<span class="bs-badge bs-badge--error">Date Missing</span>';
        }

        var canSelect = isValid && !locked;
        if (canSelect) {
            totalWithdrawal += parseFloat(mapped.WithdrawalAmt) || 0;
            totalDeposit    += parseFloat(mapped.DepositAmt)    || 0;
            validCount++;
        }

        $body.append(`
            <tr class="${rowClass}" data-idx="${idx}">
                <td class="bs-col-check text-center">
                    <input type="checkbox" class="row-chk" data-idx="${idx}" ${canSelect ? 'checked' : ''} />
                </td>
                <td>${idx + 1}</td>
                <td>${escHtml(dateDisplay)}</td>
                <td class="bs-narration-cell" title="${escHtml(mapped.Narration)}">${escHtml(TruncStr(mapped.Narration, 55))}</td>
                <td>${escHtml(mapped.ChequeRefNo)}</td>
                <td>${escHtml(valDisplay)}</td>
                <td class="text-end">${FormatAmount(mapped.OpeningBalance)}</td>
                <td class="text-end">${FormatAmount(mapped.WithdrawalAmt)}</td>
                <td class="text-end">${FormatAmount(mapped.DepositAmt)}</td>
                <td class="text-end">${FormatAmount(mapped.ClosingBalance)}</td>
                <td>${escHtml(mapped.BalanceType)}</td>
                <td>${badge}</td>
            </tr>`);
    });

    $('#tdImportTotalWithdrawal').text(FormatAmount(totalWithdrawal));
    $('#tdImportTotalDeposit').text(FormatAmount(totalDeposit));
    $('#lblPreviewCount').text('(' + validCount + ' importable / ' + parsedRows.length + ' total rows)');

    $('#cardStep2').data('bsPreviewBlock', {
        total: parsedRows.length,
        invalid: invalidDateRows,
        locked: lockedRows,
        importable: validCount
    });

    $body.find('.row-chk').off('change.bsPreviewRow').on('change.bsPreviewRow', function () {
        syncPreviewSelectAllHeader();
        UpdateSelectedCount();
        UpdateImportButton();
    });

    syncPreviewSelectAllHeader();
    UpdateSelectedCount();
    UpdateImportButton();
}

/** Align #chkSelectAll with all preview row checkboxes. */
function syncPreviewSelectAllHeader() {
    var $all = $('#tblPreviewBody .row-chk');
    var n = $all.length;
    var $h = $('#chkSelectAll');
    if (!n) {
        $h.prop({ checked: false, indeterminate: false });
        return;
    }
    var c = $all.filter(':checked').length;
    if (c === 0) {
        $h.prop({ checked: false, indeterminate: false });
    } else if (c === n) {
        $h.prop({ checked: true, indeterminate: false });
    } else {
        $h.prop({ checked: false, indeterminate: true });
    }
}

/** Excel serial day number → ISO (SheetJS / cells sometimes stay numeric). */
function excelSerialToIso(serial) {
    var n = Math.floor(Number(serial));
    if (!isFinite(n) || n < 1 || n > 1000000) return null;
    var epoch = Date.UTC(1899, 11, 30);
    var t = epoch + n * 86400000;
    var d = new Date(t);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
}

/** Normalize odd spaces / unicode dashes so DD-MM-YYYY parses reliably. */
function sanitizeDateInput(str) {
    str = String(str == null ? '' : str).replace(/^\uFEFF/, '');
    str = str.replace(/\u00A0/g, ' ').trim();
    str = str.replace(/^['"]+|['"]+$/g, '');
    str = str.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-');
    try {
        if (typeof str.normalize === 'function') str = str.normalize('NFKC');
    } catch (e) { /* ignore */ }
    return str.trim();
}

// ── Map one raw CSV row to field object ───────────────────────────────────────
function MapRow(row) {
    var get = function (field, treatExcelSerialAsDate) {
        var idx = columnMappers[field];
        if (idx === undefined || idx < 0 || idx >= row.length) return '';
        var v = row[idx];
        if (v == null || v === '') return '';
        if (treatExcelSerialAsDate && typeof v === 'number' && isFinite(v)) {
            var fl = Math.floor(v);
            if (fl >= 200 && fl < 800000) {
                var iso = excelSerialToIso(fl);
                if (iso) return iso.substring(0, 10);
            }
        }
        return String(v).replace(/\u00A0/g, ' ').trim();
    };
    return {
        TxnDate:         get('TxnDate', true),
        ValueDate:       get('ValueDate', true),
        Narration:       get('Narration', false),
        ChequeRefNo:     get('ChequeRefNo', false),
        OpeningBalance:  CleanAmount(get('OpeningBalance', false)),
        WithdrawalAmt:   CleanAmount(get('WithdrawalAmt', false)),
        DepositAmt:      CleanAmount(get('DepositAmt', false)),
        ClosingBalance:  CleanAmount(get('ClosingBalance', false)),
        BalanceType:     get('BalanceType', false),
        Remarks:         ''
    };
}

/** Effective transaction date for validation/import (Value Date fallback if Txn column blank / wrong map). */
function resolveStatementTxnIso(mapped) {
    if (!mapped) return null;
    var t = mapped.TxnDate ? ConvertToIsoDate(mapped.TxnDate) : null;
    if (t) return t;
    var v = mapped.ValueDate ? ConvertToIsoDate(mapped.ValueDate) : null;
    return v || null;
}

/** Raw cell → string for date probing (same rules as MapRow date fields). */
function cellToStringForDateProbe(v) {
    if (v == null || v === '') return '';
    if (typeof v === 'number' && isFinite(v)) {
        var fl = Math.floor(v);
        if (fl >= 200 && fl < 800000) {
            var iso = excelSerialToIso(fl);
            if (iso) return iso.substring(0, 10);
        }
        return String(v);
    }
    return String(v).replace(/\u00A0/g, ' ').trim();
}

/**
 * If auto-map leaves almost no parseable dates, pick the column that parses best as dates.
 */
function inferTxnDateColumnIfNeeded() {
    var sample = Math.min(parsedRows.length, 80);
    if (sample < 5) return;

    function scoreCurrentMapper() {
        var ok = 0;
        for (var i = 0; i < sample; i++) {
            if (resolveStatementTxnIso(MapRow(parsedRows[i]))) ok++;
        }
        return ok;
    }

    var base = scoreCurrentMapper();
    if (base >= Math.ceil(sample * 0.75)) return;

    var maxCol = 0;
    for (var i = 0; i < sample; i++) {
        var r = parsedRows[i];
        if (r && r.length) maxCol = Math.max(maxCol, r.length);
    }

    var bestCol = columnMappers.TxnDate;
    var bestScore = base;
    for (var c = 0; c < maxCol; c++) {
        var sc = 0;
        for (var i = 0; i < sample; i++) {
            var row = parsedRows[i];
            if (!row || c >= row.length) continue;
            var s = cellToStringForDateProbe(row[c]);
            if (s && ConvertToIsoDate(s)) sc++;
        }
        if (sc > bestScore) {
            bestScore = sc;
            bestCol = c;
        }
    }

    var need = Math.max(8, Math.floor(sample * 0.35));
    if (bestCol >= 0 && bestScore >= need && bestScore > base) {
        columnMappers.TxnDate = bestCol;
        var $sel = $('#map_TxnDate');
        if ($sel.length) $sel.val(String(bestCol));
    }
}

// ── Import selected rows ──────────────────────────────────────────────────────
function DoImport() {
    var checked = $('#tblPreviewBody .row-chk:checked');
    if (!checked.length) { toastr.warning('Please select at least one row to import.'); return; }

    if (!ValidateStep1()) return;

    if (!lastParsedFullRows || !ValidateStatementIdentity(lastParsedFullRows)) {
        toastr.error('The statement file no longer matches the selected bank or account number. Go back, correct the values, and parse again.');
        return;
    }

    var bankCode  = parseInt($('#ddlBankMaster').val() || '0', 10);
    var accountNo = $('#txtAccountNumber').val().trim();
    var fileName  = $('#fileStatementUpload')[0].files[0]?.name || '';
    var batchNo   = GenerateBatchNo();

    var indices = [];
    checked.each(function () { indices.push(parseInt($(this).data('idx'), 10)); });
    indices.sort(function (a, b) {
        var ma = MapRow(parsedRows[a]);
        var mb = MapRow(parsedRows[b]);
        var ia = resolveStatementTxnIso(ma);
        var ib = resolveStatementTxnIso(mb);
        if (!ia && !ib) return a - b;
        if (!ia) return 1;
        if (!ib) return -1;
        return ia.localeCompare(ib) || (a - b);
    });

    for (var z = 0; z < indices.length; z++) {
        var mz = MapRow(parsedRows[indices[z]]);
        var iz = resolveStatementTxnIso(mz);
        if (iz && isDayLocked(bankCode, accountNo, iz.substring(0, 10))) {
            toastr.warning('A selected row falls on a date that is already locked for this bank and account. Deselect those rows.');
            return;
        }
    }

    var rows = [];
    var lastClosing = null;
    var dateKeysForLock = {};

    for (var i = 0; i < indices.length; i++) {
        var idx = indices[i];
        var mapped = MapRow(parsedRows[idx]);
        var txnDateIso = resolveStatementTxnIso(mapped);
        if (!txnDateIso) continue;

        var valueDateIso = mapped.ValueDate ? ConvertToIsoDate(mapped.ValueDate) : null;
        var dep = parseFloat(mapped.DepositAmt) || 0;
        var w = parseFloat(mapped.WithdrawalAmt) || 0;

        var lineOp;
        if (lastClosing === null) {
            lineOp = parseFloat(mapped.OpeningBalance);
            if (isNaN(lineOp)) {
                var cl0 = parseFloat(mapped.ClosingBalance);
                lineOp = !isNaN(cl0) ? cl0 - dep + w : 0;
            }
        } else {
            lineOp = lastClosing;
        }

        var closing = lineOp + dep - w;
        lastClosing = closing;

        var isoDay = txnDateIso.substring(0, 10);
        dateKeysForLock[isoDay] = true;

        rows.push({
            BankMaster_Code: bankCode,
            AccountNo:       accountNo,
            TxnDate:         txnDateIso,
            ValueDate:       valueDateIso,
            Narration:       mapped.Narration  || '',
            ChequeRefNo:     mapped.ChequeRefNo || '',
            WithdrawalAmt:   w,
            DepositAmt:      dep,
            ClosingBalance:  closing,
            BalanceType:     (mapped.BalanceType || '').substring(0, 2),
            ImportBatchNo:   batchNo,
            UserID:          0,
            Remarks:         '',
            GRNPaymentMaster_Code: 0,
            ServiceTaxNo:    String(lineOp),
            IsReconciled:    dep > 0 ? 'Y' : 'N'
        });
    }

    if (!rows.length) {
        toastr.warning('No valid rows with parseable dates found to import.');
        return;
    }

    var payload = {
        BankMaster_Code: bankCode,
        AccountNo:       accountNo,
        ImportBatchNo:   batchNo,
        FileName:        fileName,
        BankStatements:  rows
    };

    Showloader && Showloader();
    $('#btnImport').prop('disabled', true);

    BankStatementService.ImportBankStatement(payload)
        .then(function (result) {
            HideLoader && HideLoader();

            if (result && result.Status === 'Y') {
                var successCount = result.Code || 0;
                var skippedCount = Math.max(0, rows.length - successCount);

                mergeImportedDays(bankCode, accountNo, Object.keys(dateKeysForLock));

                ShowResultModal({
                    TotalRecords:   rows.length,
                    SuccessRecords: successCount,
                    SkippedRecords: skippedCount,
                    FailedRecords:  0,
                    ImportBatchNo:  batchNo,
                    Msg:            result.Msg
                }, false);

                UpdateStats(rows.length, successCount, skippedCount, 0);
                LoadImportHistory();
                ClearAll();
            } else {
                ShowResultModal({
                    TotalRecords:   rows.length,
                    SuccessRecords: 0,
                    SkippedRecords: 0,
                    FailedRecords:  rows.length,
                    ImportBatchNo:  batchNo,
                    Msg:            result?.Msg || 'Import failed. Please try again.'
                }, true);
                $('#btnImport').prop('disabled', false);
            }
        })
        .catch(function () {
            HideLoader && HideLoader();
            $('#btnImport').prop('disabled', false);
        });
}

// ── Validation ────────────────────────────────────────────────────────────────
function ValidateStep1() {
    var bankVal = parseInt($('#ddlBankMaster').val() || '0', 10);
    if (!bankVal || bankVal <= 0) {
        toastr.warning('Please select a bank.');
        $('#ddlBankMaster').focus();
        return false;
    }
    if (!$('#txtAccountNumber').val().trim()) {
        toastr.warning('Please enter the account number.');
        $('#txtAccountNumber').focus();
        return false;
    }
    return true;
}

// ── Stats strip ───────────────────────────────────────────────────────────────
function UpdateStats(total, success, skipped, failed) {
    $('#bsStatTotal').text(total);
    $('#bsStatSuccess').text(success);
    $('#bsStatSkipped').text(skipped);
    $('#bsStatFailed').text(failed);
    $('#bsStatsStrip').show();
}

// ── Selected-count helper ─────────────────────────────────────────────────────
function UpdateSelectedCount() {
    var count = $('#tblPreviewBody .row-chk:checked').length;
    $('#lblSelectedCount').text(count + ' selected');
}

function UpdateImportButton() {
    var count = $('#tblPreviewBody .row-chk:checked').length;
    $('#btnImport').prop('disabled', count === 0);
}

// ── Reset preview ─────────────────────────────────────────────────────────────
function ResetPreview() {
    parsedRows    = [];
    fileHeaders   = [];
    columnMappers = {};
    lastParsedFullRows = null;
    $('#divColumnMapping').hide();
    $('#tblPreviewBody').empty();
    $('#chkSelectAll').prop({ checked: false, indeterminate: false });
    $('#lblPreviewCount').text('');
    $('#lblSelectedCount').text('0 selected');
    $('#btnImport').prop('disabled', true);
    $('#cardStep2').hide();
}

// ── Clear everything ──────────────────────────────────────────────────────────
function ClearAll() {
    $('#fileStatementUpload').val('');
    $('#lblFileName').text('No file chosen');
    $('#btnParseFile').prop('disabled', true);
    $('#cardStep2').hide();
    $('#cardStep1').show();
    ResetPreview();
}

// ── Delete batch helpers ──────────────────────────────────────────────────────
window.ConfirmDeleteBatch = function (batchNo) {
    deleteBatchNo = batchNo;
    $('#lblDeleteBatchNo').text(batchNo);
    $('#reasonForDeleteInput').val('');
    $('#bsDeleteBackdrop').addClass('active').attr('aria-hidden', 'false');
    // Focus the reason input after a brief animation delay
    setTimeout(function () { $('#reasonForDeleteInput').focus(); }, 200);
};

function CloseDeleteModal() {
    $('#bsDeleteBackdrop').removeClass('active').attr('aria-hidden', 'true');
    $('#reasonForDeleteInput').val('');
    deleteBatchNo = '';
}

function DoDeleteBatch() {
    if (!deleteBatchNo) return;

    var reason = ($('#reasonForDeleteInput').val() || '').trim();
    if (!reason) {
        toastr.warning('Please provide a reason for deletion.');
        $('#reasonForDeleteInput').focus();
        return;
    }

    Showloader && Showloader();
    BankStatementService.DeleteImportBatch(deleteBatchNo, reason)
        .then(function (result) {
            HideLoader && HideLoader();
            CloseDeleteModal();
            if (result && result.Status === 'Y') {
                toastr.success(result.Msg || 'Batch deleted successfully.');
                LoadImportHistory();
                if (typeof window.refreshBankStatementList === 'function') {
                    window.refreshBankStatementList();
                }
            } else {
                toastr.error(result?.Msg || 'Delete failed.');
            }
        })
        .catch(function () {
            HideLoader && HideLoader();
            CloseDeleteModal();
        });
}

// View batch — navigate to list with batch filter
window.ViewBatch = function (batchNo) {
    window.location = baseUrl + '/FinanceTransactions/BankStatement/BankStatementList?BatchNo=' + encodeURIComponent(batchNo);
};

// ── Result modal ──────────────────────────────────────────────────────────────
function ShowResultModal(result, isError) {
    var $icon = $('#bsResultIcon');
    $icon.html(isError ? '<i class="fas fa-circle-xmark"></i>' : '<i class="fas fa-circle-check"></i>');
    $icon.toggleClass('error', !!isError);
    $('#bsResultTitle').text(isError ? 'Import Failed' : 'Import Complete');
    $('#bsResTotal').text(result.TotalRecords   || 0);
    $('#bsResSuccess').text(result.SuccessRecords || 0);
    $('#bsResSkipped').text(result.SkippedRecords || 0);
    $('#bsResFailed').text(result.FailedRecords  || 0);
    $('#bsResBatch').text(result.ImportBatchNo   || '—');
    $('#bsResultBackdrop').addClass('active').attr('aria-hidden', 'false');
}

function CloseResultModal() {
    $('#bsResultBackdrop').removeClass('active').attr('aria-hidden', 'true');
    if (typeof window.refreshBankStatementList === 'function') {
        window.refreshBankStatementList();
    }
}

window.CloseResultModal = CloseResultModal;

// ── Utilities ─────────────────────────────────────────────────────────────────
function GenerateBatchNo() {
    var now = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return 'BS'
        + now.getFullYear()
        + pad(now.getMonth() + 1)
        + pad(now.getDate())
        + pad(now.getHours())
        + pad(now.getMinutes())
        + pad(now.getSeconds());
}

// Convert DD/MM/YYYY (or common variants) → ISO 8601 string for JSON/DateTime binding
// ── IsoToDMY : ISO string → "DD-MM-YYYY"  (same style as ProjectMaster display) ─
function IsoToDMY(iso) {
    if (!iso) return '';
    var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
        return m[3] + '-' + m[2] + '-' + m[1];
    }
    var dt = new Date(iso);
    if (isNaN(dt.getTime())) return '';
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return pad(dt.getDate()) + '-' + pad(dt.getMonth() + 1) + '-' + dt.getFullYear();
}

/** Calendar Y/M/D → UTC midnight ISO so substring(0,10) is stable (avoids TZ shift from local Date). */
function calendarYmdToUtcIso(y, mo, d) {
    if (y == null || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    var ms = Date.UTC(y, mo - 1, d);
    var dt = new Date(ms);
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return dt.toISOString();
}

// ── ConvertToIsoDate : parse any common bank-statement date string → ISO 8601 ──
// Returns null if the date string cannot be parsed.
// Month-name lookup used by DD-MMM-YYYY parser
var _MON = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };

function ConvertToIsoDate(str) {
    if (str == null || str === '') return null;
    if (typeof str === 'number' && isFinite(str)) {
        var fln = Math.floor(str);
        if (fln >= 200 && fln < 800000) {
            var ex0 = excelSerialToIso(fln);
            if (ex0) return ex0;
        }
        return null;
    }
    str = sanitizeDateInput(str);
    if (!str) return null;

    var d, mo, y, dt;

    // ── 0. Plain Excel serial as string (e.g. "45291" or "45291.0")
    if (/^\d{5,7}(\.\d+)?$/.test(str)) {
        var ex1 = excelSerialToIso(Math.floor(parseFloat(str)));
        if (ex1) return ex1;
    }

    // ── 1. DD/MM/YYYY  or  DD-MM-YYYY  or  DD.MM.YYYY  (4-digit year)
    var m1 = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (m1) {
        d = parseInt(m1[1], 10); mo = parseInt(m1[2], 10); y = parseInt(m1[3], 10);
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12)
            return calendarYmdToUtcIso(y, mo, d);
    }

    // ── 2. DD-MMM-YYYY  or  DD/MMM/YYYY  or  DD MMM YYYY  (e.g. "01-Apr-2026")
    var m2 = str.match(/^(\d{1,2})[\-\/\s]([A-Za-z]{3,9})[\-\/\s](\d{2,4})$/);
    if (m2) {
        d  = parseInt(m2[1], 10);
        mo = _MON[(m2[2]).toLowerCase().substring(0, 3)];
        y  = parseInt(m2[3], 10);
        if (y < 100) y += 2000;
        if (mo && d >= 1 && d <= 31)
            return calendarYmdToUtcIso(y, mo, d);
    }

    // ── 3. DD/MM/YY  or  DD-MM-YY  or  DD.MM.YY  (2-digit year)
    var m3 = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/);
    if (m3) {
        d = parseInt(m3[1], 10); mo = parseInt(m3[2], 10); y = parseInt(m3[3], 10) + 2000;
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12)
            return calendarYmdToUtcIso(y, mo, d);
    }

    // ── 4. YYYY-MM-DD  or  YYYY/MM/DD  (ISO / Excel export)
    var m4 = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (m4) {
        y = parseInt(m4[1], 10); mo = parseInt(m4[2], 10); d = parseInt(m4[3], 10);
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12)
            return calendarYmdToUtcIso(y, mo, d);
    }

    // ── 5. YYYYMMDD  (compact 8-digit, e.g. Excel numeric export)
    var m5 = str.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m5) {
        y = parseInt(m5[1], 10); mo = parseInt(m5[2], 10); d = parseInt(m5[3], 10);
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12)
            return calendarYmdToUtcIso(y, mo, d);
    }

    // ── 6. Browser fallback (handles ISO 8601 and many locale strings)
    dt = new Date(str);
    if (!isNaN(dt.getTime())) return dt.toISOString();

    return null;
}

function CleanAmount(str) {
    if (!str) return '0';
    var cleaned = str.replace(/[^0-9.\-]/g, '');
    return cleaned === '' ? '0' : cleaned;
}

function FormatAmount(val) {
    var n = parseFloat(val);
    if (isNaN(n) || n === 0) return '—';
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FormatDateTime(dt) {
    if (!dt) return '—';
    var d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    var pad = function (n) { return String(n).padStart(2, '0'); };
    // DD-MM-YYYY HH:MM  (same dash-separated style as ProjectMaster)
    return pad(d.getDate()) + '-' + pad(d.getMonth() + 1) + '-' + d.getFullYear()
        + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
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
