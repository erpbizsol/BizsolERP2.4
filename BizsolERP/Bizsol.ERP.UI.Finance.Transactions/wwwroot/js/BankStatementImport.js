import { BankStatementService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BankStatementService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');
var parsedRows    = [];   
var fileHeaders   = [];   
var columnMappers = {};   
var deleteBatchNo = '';

var FIELD_DEFS = [
    { field: 'TxnDate',
      label: 'Date',
      patterns: ['date','txn date','trans date','transaction date','tran date',
                 'posting date','tran. date','transaction dt','valuedate',
                 'trndate','trn date'] },
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
                    var short   = b.BankShortCode ? ' (' + b.BankShortCode + ')' : '';
                    var account = (b.AccountNo || '').trim();
                    $ddl.append(
                        $('<option></option>')
                            .val(code)
                            .text(name + short)
                            .attr('data-account', account)
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
                            <button class="bs-icon-btn bs-icon-btn--view me-1" title="View records"
                                onclick="ViewBatch('${escHtml(row.ImportBatchNo)}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="bs-icon-btn bs-icon-btn--danger" title="Delete batch"
                                onclick="ConfirmDeleteBatch('${escHtml(row.ImportBatchNo)}')">
                                <i class="fas fa-trash-can"></i>
                            </button>
                        </td>
                    </tr>`);
            });
        })
        .catch(function () {
            $body.html('<tr><td colspan="10" class="text-center py-3 text-danger">Failed to load history.</td></tr>');
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

    // Select / deselect all checkboxes via header checkbox
    $('#chkSelectAll').on('change', function () {
        var checked = $(this).prop('checked');
        $('.row-chk:not(:disabled)').prop('checked', checked);
        UpdateSelectedCount();
        UpdateImportButton();
    });

    $('#btnSelectAll').on('click', function () {
        $('.row-chk:not(:disabled)').prop('checked', true);
        $('#chkSelectAll').prop('checked', true);
        UpdateSelectedCount();
        UpdateImportButton();
    });

    $('#btnDeselectAll').on('click', function () {
        $('.row-chk').prop('checked', false);
        $('#chkSelectAll').prop('checked', false);
        UpdateSelectedCount();
        UpdateImportButton();
    });

    // Import button
    $('#btnImport').on('click', function () { DoImport(); });

    // View List button — navigate to bank statement list (relative URL, no baseUrl needed)
    $('#btnViewList').on('click', function () {
        window.location = baseUrl + '/FinanceTransactions/BankStatement/BankStatementList';
    });

    // Refresh history
    $('#btnRefreshHistory').on('click', function () { LoadImportHistory(); });

    // Delete confirmation modal buttons
    $('#btnCancelDelete').on('click', function () { CloseDeleteModal(); });
    $('#btnConfirmDelete').on('click', function () { DoDeleteBatch(); });

    // Result modal close button
    $('#btnResultClose').on('click', function () { CloseResultModal(); });
}

// ── Parse CSV file ────────────────────────────────────────────────────────────
function ParseFile() {
    var file = $('#fileStatementUpload')[0].files[0];
    if (!file) { toastr.warning('Please select a file first.'); return; }

    if (!ValidateStep1()) return;

    Showloader && Showloader();
    var reader = new FileReader();
    reader.onload = function (e) {
        HideLoader && HideLoader();
        try {
            var text = e.target.result;
            var rows = ParseCSV(text);

            if (!rows || rows.length < 2) {
                toastr.error('File appears to be empty or has only a header row.');
                return;
            }

            // Auto-detect the real header row — many bank CSVs have 5-20 lines of
            // account metadata before the actual column headers (Date, Narration, …)
            var headerIdx = FindHeaderRow(rows);
            fileHeaders   = rows[headerIdx];

            var dataRows = rows.slice(headerIdx + 1).filter(function (r) {
                // Drop completely blank rows
                if (!r.some(function (c) { return c && c.trim() !== ''; })) return false;
                // Drop bank separator / filler rows (all cells are only *, -, =, _, ~, / etc.)
                return !IsGarbageRow(r);
            });

            if (!dataRows.length) {
                toastr.error('No data rows found after the header.');
                return;
            }

            parsedRows = dataRows;
            BuildColumnMappingUI(fileHeaders);
            AutoMapColumns(fileHeaders);
            RenderPreviewTable();
            $('#cardStep2').show();
            $('#cardStep1').hide();

        } catch (ex) {
            toastr.error('Failed to parse file: ' + ex.message);
        }
    };
    reader.onerror = function () {
        HideLoader && HideLoader();
        toastr.error('Failed to read file.');
    };
    reader.readAsText(file);
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

    // Re-render preview whenever mapping changes
    $('.map-select').on('change', function () {
        columnMappers[$(this).data('field')] = parseInt($(this).val(), 10);
        RenderPreviewTable();
    });
}

// ── Detect separator / filler rows ───────────────────────────────────────────
// Returns true for rows whose non-empty cells consist entirely of non-data
// characters like *** ---- === ~~~ (common bank statement dividers).
function IsGarbageRow(row) {
    var nonEmpty = row.filter(function (c) { return (c || '').trim() !== ''; });
    if (!nonEmpty.length) return true;

    // Characters that, when a cell contains ONLY them, mark it as filler
    var garbageRe = /^[*\-=_~.\/\\| \t]+$/;

    var garbageCount = nonEmpty.filter(function (c) {
        return garbageRe.test((c || '').trim());
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
        'balance', 'closing', 'ref', 'chq', 'cheque', 'amount', 'value'
    ];

    var bestScore = 0;
    var bestIdx   = 0;
    var limit     = Math.min(rows.length, 25);

    for (var i = 0; i < limit; i++) {
        var score = 0;
        rows[i].forEach(function (cell) {
            var lower = (cell || '').toLowerCase().trim();
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
                // exact match OR header contains pattern OR pattern contains header (min 3 chars)
                if (lh === p
                    || lh.indexOf(p) >= 0
                    || (lh.length >= 3 && p.indexOf(lh) >= 0)) {
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

    var totalWithdrawal = 0, totalDeposit = 0;
    var validCount = 0;

    parsedRows.forEach(function (row, idx) {
        var mapped  = MapRow(row);
        var dateRaw = mapped.TxnDate ? mapped.TxnDate.trim() : '';

        // Try to parse the date immediately — same as ProjectMaster (format at display time)
        var txnIso     = dateRaw ? ConvertToIsoDate(dateRaw) : null;
        var dateDisplay = txnIso ? IsoToDMY(txnIso) : (dateRaw || '');

        // ValueDate display
        var valRaw     = mapped.ValueDate ? mapped.ValueDate.trim() : '';
        var valIso     = valRaw ? ConvertToIsoDate(valRaw) : null;
        var valDisplay = valIso ? IsoToDMY(valIso) : (valRaw || '');

        // A row is valid (selectable) only when the date cell maps to a recognisable date.
        // Rows with non-date text (totals, opening balance lines) are excluded automatically.
        var isValid  = !!txnIso;
        var rowClass = isValid ? 'bs-row-ok' : 'bs-row-error';
        var badge    = isValid
            ? '<span class="bs-badge bs-badge--ok">OK</span>'
            : (dateRaw
                ? '<span class="bs-badge bs-badge--error">Invalid Date</span>'
                : '<span class="bs-badge bs-badge--error">Date Missing</span>');

        if (isValid) {
            totalWithdrawal += parseFloat(mapped.WithdrawalAmt) || 0;
            totalDeposit    += parseFloat(mapped.DepositAmt)    || 0;
            validCount++;
        }

        $body.append(`
            <tr class="${rowClass}" data-idx="${idx}">
                <td class="bs-col-check text-center">
                    <input type="checkbox" class="row-chk" data-idx="${idx}" ${isValid ? 'checked' : 'disabled'} />
                </td>
                <td>${idx + 1}</td>
                <td>${escHtml(dateDisplay)}</td>
                <td class="bs-narration-cell" title="${escHtml(mapped.Narration)}">${escHtml(TruncStr(mapped.Narration, 55))}</td>
                <td>${escHtml(mapped.ChequeRefNo)}</td>
                <td>${escHtml(valDisplay)}</td>
                <td class="text-end">${FormatAmount(mapped.WithdrawalAmt)}</td>
                <td class="text-end">${FormatAmount(mapped.DepositAmt)}</td>
                <td class="text-end">${FormatAmount(mapped.ClosingBalance)}</td>
                <td>${escHtml(mapped.BalanceType)}</td>
                <td>${badge}</td>
            </tr>`);
    });

    $('#tdTotalWithdrawal').text(FormatAmount(totalWithdrawal));
    $('#tdTotalDeposit').text(FormatAmount(totalDeposit));
    $('#lblPreviewCount').text('(' + validCount + ' valid / ' + parsedRows.length + ' total rows)');

    $body.find('.row-chk').on('change', function () {
        UpdateSelectedCount();
        UpdateImportButton();
    });

    UpdateSelectedCount();
    UpdateImportButton();
}

// ── Map one raw CSV row to field object ───────────────────────────────────────
function MapRow(row) {
    var get = function (field) {
        var idx = columnMappers[field];
        if (idx === undefined || idx < 0 || idx >= row.length) return '';
        return (row[idx] || '').trim();
    };
    return {
        TxnDate:        get('TxnDate'),
        ValueDate:      get('ValueDate'),
        Narration:      get('Narration'),
        ChequeRefNo:    get('ChequeRefNo'),
        WithdrawalAmt:  CleanAmount(get('WithdrawalAmt')),
        DepositAmt:     CleanAmount(get('DepositAmt')),
        ClosingBalance: CleanAmount(get('ClosingBalance')),
        BalanceType:    get('BalanceType'),
        Remarks:        ''
    };
}

// ── Import selected rows ──────────────────────────────────────────────────────
function DoImport() {
    var checked = $('.row-chk:checked');
    if (!checked.length) { toastr.warning('Please select at least one row to import.'); return; }

    if (!ValidateStep1()) return;

    var bankCode  = parseInt($('#ddlBankMaster').val() || '0', 10);
    var accountNo = $('#txtAccountNumber').val().trim();
    var fileName  = $('#fileStatementUpload')[0].files[0]?.name || '';
    var batchNo   = GenerateBatchNo();
    var rows      = [];

    checked.each(function () {
        var idx    = parseInt($(this).data('idx'), 10);
        var mapped = MapRow(parsedRows[idx]);

        // Convert dates to ISO 8601 — required for ASP.NET Core JSON→DateTime binding
        // (Rows with un-parseable dates are already unchecked in the preview, so this
        //  guard is a safety net only.)
        var txnDateIso   = ConvertToIsoDate(mapped.TxnDate);
        var valueDateIso = mapped.ValueDate ? ConvertToIsoDate(mapped.ValueDate) : null;

        if (!txnDateIso) return;

        rows.push({
            BankMaster_Code: bankCode,
            AccountNo:       accountNo,
            TxnDate:         txnDateIso,
            ValueDate:       valueDateIso,
            Narration:       mapped.Narration  || '',
            ChequeRefNo:     mapped.ChequeRefNo || '',
            WithdrawalAmt:   parseFloat(mapped.WithdrawalAmt)  || 0,
            DepositAmt:      parseFloat(mapped.DepositAmt)     || 0,
            ClosingBalance:  parseFloat(mapped.ClosingBalance) || 0,
            BalanceType:     (mapped.BalanceType || '').substring(0, 2),
            ImportBatchNo:   batchNo,
            UserID:          0,
            Remarks:         ''
        });
    });

    if (!rows.length) {
        toastr.warning('No valid rows with parseable dates found to import.');
        return;
    }

    // Payload property names must match VM_BankStatementImportRequest exactly
    var payload = {
        BankMaster_Code: bankCode,
        AccountNo:       accountNo,
        ImportBatchNo:   batchNo,
        FileName:        fileName,
        BankStatements:  rows          // "BankStatements" — NOT "Rows"
    };

    Showloader && Showloader();
    $('#btnImport').prop('disabled', true);

    BankStatementService.ImportBankStatement(payload)
        .then(function (result) {
            HideLoader && HideLoader();

            // API returns spOutputParameter: { Status, Msg, Code }
            // Code = SuccessRecords count from the SP
            if (result && result.Status === 'Y') {
                var successCount = result.Code || 0;
                var skippedCount = Math.max(0, rows.length - successCount);

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
    var count = $('.row-chk:checked').length;
    $('#lblSelectedCount').text(count + ' selected');
}

function UpdateImportButton() {
    var count = $('.row-chk:checked').length;
    $('#btnImport').prop('disabled', count === 0);
}

// ── Reset preview ─────────────────────────────────────────────────────────────
function ResetPreview() {
    parsedRows    = [];
    fileHeaders   = [];
    columnMappers = {};
    $('#divColumnMapping').hide();
    $('#tblPreviewBody').empty();
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
    $('#bsDeleteBackdrop').addClass('active');
    // Focus the reason input after a brief animation delay
    setTimeout(function () { $('#reasonForDeleteInput').focus(); }, 200);
};

function CloseDeleteModal() {
    $('#bsDeleteBackdrop').removeClass('active');
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
            } else {
                toastr.error(result?.Msg || 'Delete failed.');
            }
        })
        .catch(function () {
            HideLoader && HideLoader();
            CloseDeleteModal();
        });
}

// View batch — navigate to list filtered by batch no
window.ViewBatch = function (batchNo) {
    window.location = baseUrl + '/FinanceTransactions/BankStatement/BankStatementList?BatchNo=' + encodeURIComponent(batchNo);

    //window.location.href = '/FinanceTransactions/BankStatement/BankStatementList?BatchNo=' + encodeURIComponent(batchNo);
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
    $('#bsResultBackdrop').addClass('active');
}

function CloseResultModal() {
    $('#bsResultBackdrop').removeClass('active');
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
    var dt = new Date(iso);
    if (isNaN(dt.getTime())) return '';
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return pad(dt.getDate()) + '-' + pad(dt.getMonth() + 1) + '-' + dt.getFullYear();
}

// ── ConvertToIsoDate : parse any common bank-statement date string → ISO 8601 ──
// Returns null if the date string cannot be parsed.
// Month-name lookup used by DD-MMM-YYYY parser
var _MON = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };

function ConvertToIsoDate(str) {
    if (!str || !str.trim()) return null;
    str = str.trim();

    var d, mo, y, dt;

    // ── 1. DD/MM/YYYY  or  DD-MM-YYYY  or  DD.MM.YYYY  (4-digit year)
    var m1 = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (m1) {
        d = parseInt(m1[1], 10); mo = parseInt(m1[2], 10); y = parseInt(m1[3], 10);
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12)
            return new Date(y, mo - 1, d, 0, 0, 0).toISOString();
    }

    // ── 2. DD-MMM-YYYY  or  DD/MMM/YYYY  or  DD MMM YYYY  (e.g. "01-Apr-2026")
    var m2 = str.match(/^(\d{1,2})[\-\/\s]([A-Za-z]{3,9})[\-\/\s](\d{2,4})$/);
    if (m2) {
        d  = parseInt(m2[1], 10);
        mo = _MON[(m2[2]).toLowerCase().substring(0, 3)];
        y  = parseInt(m2[3], 10);
        if (y < 100) y += 2000;
        if (mo && d >= 1 && d <= 31)
            return new Date(y, mo - 1, d, 0, 0, 0).toISOString();
    }

    // ── 3. DD/MM/YY  or  DD-MM-YY  or  DD.MM.YY  (2-digit year)
    var m3 = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/);
    if (m3) {
        d = parseInt(m3[1], 10); mo = parseInt(m3[2], 10); y = parseInt(m3[3], 10) + 2000;
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12)
            return new Date(y, mo - 1, d, 0, 0, 0).toISOString();
    }

    // ── 4. YYYY-MM-DD  or  YYYY/MM/DD  (ISO / Excel export)
    var m4 = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (m4) {
        y = parseInt(m4[1], 10); mo = parseInt(m4[2], 10); d = parseInt(m4[3], 10);
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12)
            return new Date(y, mo - 1, d, 0, 0, 0).toISOString();
    }

    // ── 5. YYYYMMDD  (compact 8-digit, e.g. Excel numeric export)
    var m5 = str.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m5) {
        y = parseInt(m5[1], 10); mo = parseInt(m5[2], 10); d = parseInt(m5[3], 10);
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12)
            return new Date(y, mo - 1, d, 0, 0, 0).toISOString();
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
