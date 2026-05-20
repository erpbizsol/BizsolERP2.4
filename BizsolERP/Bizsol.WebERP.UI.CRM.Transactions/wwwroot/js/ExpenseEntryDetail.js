import { ExpenseEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseEntryService.js';
import { ExpensesLedgerReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpensesLedgerReportService.js';
import { ProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectMasterService.js';
import { SubProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SubProjectMasterService.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

function CheckRight(optionName) {
    const FinYear = BizSolHelperFunction.getFinancialYear();
    return MenuService.CheckModuleOptionRight('Expense Entry', optionName, 'Y', FinYear);
}
var baseUrl = sessionStorage.getItem('AppBaseURL');

const Indx_Tbl = {
    ExpenseHead: 0,
    Designation: 1,
    EffectiveFrom: 2,
    PerDayLimit: 3,
    Project: 4,
    SubProject: 5,
    AllowedAmount: 6,
    ExpenseAmount: 7,
    ApprovedAmount: 8,
    Remarks: 9,
    Attachment: 10,
    VerifyStatus: 11,
    ExpenseEntryDetail_Code: 12,
    ExpenseHeadMaster_Code: 13
};

var G_ProjectList = [];
var G_SubProjectList = [];
var G_ProjectApplicable = 'N';
var G_LevelVerifyApplicable = 'N';
/** Distinct expense heads from loaded detail (for New Row dropdown). */
var G_ExpenseHeadOptions = [];
/** `disabled="disabled"` on Approved Amount HTML when LevelVerifyApplicable is Y. */
var G_EeApprovedInputDisabled = '';

/** LevelVerifyApplicable=Y → Approved Amount read-only; Verify button unchanged. */
function refreshApprovedAmountInputDisabledAttr() {
    G_EeApprovedInputDisabled = (G_LevelVerifyApplicable === 'Y') ? 'disabled="disabled"' : '';
}

function applyApprovedAmountInputState() {
    refreshApprovedAmountInputDisabledAttr();
    if (param_Mode === 'View') return;
    var masterCode = getExpenseEntryMasterCode();
    var disableApproved = (G_LevelVerifyApplicable === 'Y') || masterCode <= 0;
    $('#ExpenseEntryDetails .txtApprovedAmount').prop('disabled', disableApproved);
}

function getExpenseDetailHiddenColumns() {
    var hiddenColumns = ['Designation Name', 'Per Day Limit', 'VerifyStatus', 'ExpenseEntryDetail_Code', 'ExpenseHeadMaster_Code', 'Attachment', 'Effective From'];
    if (G_ProjectApplicable !== 'Y') {
        hiddenColumns.push('Project', 'Sub Project');
    }
    return hiddenColumns;
}

function getExpenseDetailColumnAlignment() {
    return {
        'Expense Head': 'left',
        'Allowed Amount': 'center',
        'Approved Amount': 'center',
        'Effective From': 'center',
        'Expense Amount': 'center',
        'Remarks': 'center',
        'Project': 'left',
        'Sub Project': 'left'
    };
}

function buildExpenseHeadOptionsFromDetailList(rawList) {
    var seenHead = {};
    G_ExpenseHeadOptions = [];
    (rawList || []).forEach(function (item) {
        var hc = item.ExpenseHeadMaster_Code != null ? item.ExpenseHeadMaster_Code : 0;
        if (hc && !seenHead[hc]) {
            seenHead[hc] = true;
            G_ExpenseHeadOptions.push({
                ExpenseHeadMaster_Code: hc,
                'Expense Head': item['Expense Head'],
                'Designation Name': item['Designation Name'],
                'Effective From': item['Effective From'],
                templatePerDayLimit: item['Per Day Limit'] != null ? item['Per Day Limit'] : 0,
                templateAllowedAmount: item['Allowed Amount'] != null ? item['Allowed Amount'] : 0
            });
        }
    });
}

/** Recompute footer totals from current inputs (Filter.js totals use stored HTML, not live typing). */
function refreshExpenseEntryDetailTotals() {
    var bodyId = 'ExpenseEntryDetails-body';
    var $tbody = $('#' + bodyId);
    var $totalRow = $tbody.find('tr.total-row');
    if (!$totalRow.length) return;

    var sumAllowed = 0;
    var sumExp = 0;
    var sumAppr = 0;
    $tbody.find('tr').not('.total-row').not('.grand-total-row').each(function () {
        var $tr = $(this);
        if ($tr.hasClass('expense-entry-empty-row')) return;
        if (!$tr.find('.hdnExpenseHeadMasterCode').length) return;
        var a = parseFloat($tr.find('.txtAllowedAmount').val());
        var e = parseFloat($tr.find('.txtExpendedAmount').val());
        var p = parseFloat($tr.find('.txtApprovedAmount').val());
        if (!isNaN(a) && isFinite(a)) sumAllowed += a;
        if (!isNaN(e) && isFinite(e)) sumExp += e;
        if (!isNaN(p) && isFinite(p)) sumAppr += p;
    });

    var fixedCfg = window['fixedDecimalvalue_' + bodyId];
    var commaCols = window['commaColumns_' + bodyId] || [];

    function formatTotalCell(columnKey, sum) {
        var decimalPlaces = 3;
        if (fixedCfg && typeof fixedCfg === 'object' && Object.prototype.hasOwnProperty.call(fixedCfg, columnKey)) {
            decimalPlaces = fixedCfg[columnKey];
        } else if (typeof fixedCfg === 'number') {
            decimalPlaces = fixedCfg;
        }
        var valStr = (commaCols.indexOf(columnKey) >= 0 && typeof window.formatIndianNumber === 'function')
            ? window.formatIndianNumber(sum, decimalPlaces)
            : sum.toFixed(decimalPlaces);
        return '<strong>' + valStr + '</strong>';
    }

    $totalRow.find('td').eq(Indx_Tbl.AllowedAmount).html(formatTotalCell('Allowed Amount', sumAllowed));
    $totalRow.find('td').eq(Indx_Tbl.ExpenseAmount).html(formatTotalCell('Expense Amount', sumExp));
    $totalRow.find('td').eq(Indx_Tbl.ApprovedAmount).html(formatTotalCell('Approved Amount', sumAppr));
}

/** Grid loads with Paginator=false; New Row must not call renderTableWithPagination without page controls. */
function renderExpenseEntryDetailGrid() {
    var tableId = 'ExpenseEntryDetails';
    var bodyId = 'ExpenseEntryDetails-body';
    var data = window['filteredData_' + tableId] || [];
    if (window['Paginator_' + tableId] === true && $('#pageSize-' + tableId).length) {
        renderTableWithPagination(tableId, bodyId);
    } else {
        renderTable(data, bodyId, false);
    }
    refreshExpenseEntryDetailTotals();
}

function initializeExpenseEntryDetailGridShell() {
    var tableId = 'ExpenseEntryDetails';
    var bodyId = 'ExpenseEntryDetails-body';
    var hiddenColumns = getExpenseDetailHiddenColumns();
    var sample = buildExpenseDetailRowObject(0);
    var totalAmount = ['Allowed Amount', 'Approved Amount', 'Expense Amount'];
    renderTableHeader(hiddenColumns, 'ExpenseEntryDetails-header', bodyId, Object.keys(sample), false, [], [], [], []);
    window['hiddenColumns_' + bodyId] = hiddenColumns;
    window['columnAlignment_' + bodyId] = getExpenseDetailColumnAlignment();
    window['totalColumns_' + bodyId] = totalAmount;
    window['fixedDecimalvalue_' + bodyId] = null;
    window['commaColumns_' + bodyId] = [];
    window['button_' + tableId] = false;
    window['ShowButtons_' + bodyId] = [];
    window['filteredData_' + tableId] = [];
    window['filteredDataTemp_' + tableId] = [];
    window['currentPage_' + tableId] = 1;
    window['itemsPerPage_' + tableId] = 10;
    window['Paginator_' + tableId] = false;
    $('#' + bodyId).html('');
}

function ensureExpenseEntryDetailDataStore() {
    var tableId = 'ExpenseEntryDetails';
    var fd = window['filteredData_' + tableId];
    if (fd && Array.isArray(fd)) return fd;
    initializeExpenseEntryDetailGridShell();
    return window['filteredData_' + tableId];
}

function loadExpenseHeadOptionsFromTemplate(marketingPersonName) {
    return ExpenseEntryService.GetExpenseEntryDetails(marketingPersonName, 0).then(function (response) {
        var rawList = (response && response.ExpenseEntryDetail) ? response.ExpenseEntryDetail : [];
        buildExpenseHeadOptionsFromDetailList(rawList);
        return G_ExpenseHeadOptions;
    });
}

function buildExpenseDetailRowObject(index) {
    return {
        'Expense Head': buildExpenseHeadSelectHtml(0, index),
        'Designation Name': '',
        'Effective From': '',
        'Per Day Limit': '<input type="number" id="txtPerDay" data-index="' + index + '" value="0" class="bal-mt-input txtPerDay" readonly="readonly" autocomplete="off">',
        'Project': buildProjectSelectHtml(0, index),
        'Sub Project': buildSubProjectSelectHtml(0, 0, index),
        'Allowed Amount': '<input type="number" id="txtAllowedAmount" data-index="' + index + '" value="0" class="bal-mt-input txtAllowedAmount" readonly="readonly" autocomplete="off" style="text-align: right;">',
        'Expense Amount': '<input type="number" id="txtExpendedAmount" data-index="' + index + '" value="0" class="bal-mt-input txtExpendedAmount" onfocusout="CalculateApprovedAmount(this);" autocomplete="off" style="text-align: right;" oninput="limitInputLength(this, 8);">',
        'Approved Amount': '<input type="number" ' + G_EeApprovedInputDisabled + ' id="txtApprovedAmount" data-index="' + index + '" value="0" class="bal-pc-input txtApprovedAmount" onfocusout="ApprovedAmountIncrease(this);" autocomplete="off" style="text-align: right;" oninput="limitInputLength(this, 8);">',
        'Remarks': '<input type="text" id="txtRemarks" data-index="' + index + '" value="" class="bal-mtrs-input txtRemarks" autocomplete="off" maxlength="16">',
        'Attachment': buildDetailAttachmentButtonHtml(0),
        'VerifyStatus': '',
        'ExpenseEntryDetail_Code': formatExpenseEntryDetailCodeCell(0),
        'ExpenseHeadMaster_Code': '<input type="hidden" class="hdnExpenseHeadMasterCode" value="0" />'
    };
}

/** API expects int; empty / non-numeric cells must be 0 (not null). */
function normalizeDetailLineCode($tr) {
    var $hid = $tr.find('.hdnExpenseEntryDetailCode');
    if ($hid.length) {
        var hv = parseInt($hid.val(), 10);
        if (!isNaN(hv)) return hv;
    }
    var $cell = $tr.find('td').eq(Indx_Tbl.ExpenseEntryDetail_Code);
    if (!$cell.length) return 0;
    var t = ($cell.text() || '').replace(/\s/g, '').trim();
    if (t === '') {
        var html = $cell.html() || '';
        t = String(html).replace(/<[^>]*>/g, '').replace(/\s/g, '').trim();
    }
    var n = parseInt(t, 10);
    return isNaN(n) ? 0 : n;
}

function getExpenseEntryMasterCode() {
    return parseInt(String(param_ExpenseEntryMaster_Code || 0), 10) || 0;
}

function getAttachmentControlMode() {
    var m = (param_Mode || 'Edit').toString().trim().toLowerCase();
    return m === 'view' ? 'view' : 'all';
}

/** Detail-line paperclip: requires saved ExpenseEntryDetail_Code. */
function buildDetailAttachmentButtonHtml(detailCode) {
    var dc = parseInt(detailCode, 10) || 0;
    var title = dc > 0 ? 'Line attachment' : 'Save this entry first to attach files to this line';
    var extraClass = dc <= 0 ? ' ee-attach-disabled' : '';
    return '<a class="btn btn-success icon-height mb-1 ee-btn-detail-attach' + extraClass + '" title="' + escHtml(title) + '" data-detail-code="' + dc + '" onclick="ViewAttachment(this)"><i class="fa fa-paperclip" aria-hidden="true"></i></a>';
}

function formatExpenseEntryDetailCodeCell(detailCode) {
    var dc = parseInt(detailCode, 10) || 0;
    return '<input type="hidden" class="hdnExpenseEntryDetailCode" value="' + dc + '" />';
}

/** Body shape expected by SaveExpenseEntryMaster / VerifyExpenseEntryMaster API. */
function buildExpenseEntryApiPayload(masterRow, detailRows) {
    return {
        vm_ExpenseEntryMaster: masterRow,
        ExpenseEntryMaster: [masterRow],
        ExpenseEntryDetail: detailRows
    };
}

function escHtml(str) {
    if (str == null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildProjectSelectHtml(selectedCode, index) {
    const sel = selectedCode != null ? String(selectedCode) : '0';
    const parts = ['<option value="0">-- Project --</option>'];
    G_ProjectList.forEach(function (p) {
        const code = p.Code != null ? p.Code : 0;
        const name = (p.ProjectDesp || p.ProjectName || '').trim() || ('Project ' + code);
        parts.push('<option value="' + code + '"' + (String(code) === sel ? ' selected' : '') + '>' + escHtml(name) + '</option>');
    });
    return '<select class="form-control form-control-sm ee-ddl-project" data-index="' + index + '">' + parts.join('') + '</select>';
}

function buildSubProjectSelectHtml(projectMasterCode, selectedSubCode, index) {
    const pid = String(projectMasterCode != null ? projectMasterCode : 0);
    const ssel = selectedSubCode != null ? String(selectedSubCode) : '0';
    const parts = ['<option value="0">-- Sub Project --</option>'];
    G_SubProjectList
        .filter(function (sp) {
            return String(sp.ProjectMaster_Code != null ? sp.ProjectMaster_Code : sp.MasterProjectCode || 0) === pid;
        })
        .forEach(function (sp) {
            const code = sp.Code != null ? sp.Code : 0;
            const name = (sp.SubProjectDesp || sp.SubProjectName || '').trim() || ('Sub Project ' + code);
            parts.push('<option value="' + code + '"' + (String(code) === ssel ? ' selected' : '') + '>' + escHtml(name) + '</option>');
        });
    return '<select class="form-control form-control-sm ee-ddl-subproject" data-index="' + index + '">' + parts.join('') + '</select>';
}

function buildExpenseHeadSelectHtml(selectedCode, index) {
    const sel = selectedCode != null ? String(selectedCode) : '0';
    const parts = ['<option value="0">-- Expense Head --</option>'];
    G_ExpenseHeadOptions.forEach(function (h) {
        const code = h.ExpenseHeadMaster_Code != null ? h.ExpenseHeadMaster_Code : 0;
        const label = (h['Expense Head'] || h.ExpenseHeadName || '').trim() || ('Head ' + code);
        parts.push('<option value="' + code + '"' + (String(code) === sel ? ' selected' : '') + '>' + escHtml(label) + '</option>');
    });
    return '<select class="form-control form-control-sm ee-ddl-expensehead" data-index="' + index + '">' + parts.join('') + '</select>';
}

/** Global row index in `filteredData_ExpenseEntryDetails` from a tbody data row. */
function expenseDetailDataIndexFromRow($tr) {
    if ($tr.hasClass('total-row') || $tr.hasClass('grand-total-row') || $tr.hasClass('expense-entry-empty-row')) return -1;
    var tableId = 'ExpenseEntryDetails';
    var bodyId = 'ExpenseEntryDetails-body';
    var $rows = $('#' + bodyId + ' tr').not('.total-row').not('.grand-total-row');
    var rowOnPage = $rows.index($tr);
    if (rowOnPage < 0) return -1;
    var page = window['currentPage_' + tableId] || 1;
    var ipp = parseInt($('#pageSize-' + tableId).val(), 10) || 10;
    return (page - 1) * ipp + rowOnPage;
}

/** Keep grid backing store in sync for Sub Project + Expense Head duplicate checks and pagination. */
function syncExpenseDetailRowToFilteredData($tr) {
    var tableId = 'ExpenseEntryDetails';
    var fd = window['filteredData_' + tableId];
    if (!fd || !fd.length) return;
    if ($tr.hasClass('expense-entry-empty-row') || $tr.hasClass('total-row') || $tr.hasClass('grand-total-row')) return;
    var idx = expenseDetailDataIndexFromRow($tr);
    if (idx < 0 || idx >= fd.length) return;
    var item = fd[idx];
    var i = idx;

    var headCode = parseInt($tr.find('.hdnExpenseHeadMasterCode').val(), 10) || 0;
    if ($tr.find('.ee-ddl-expensehead').length) {
        headCode = parseInt($tr.find('.ee-ddl-expensehead').val(), 10) || 0;
        item['Expense Head'] = buildExpenseHeadSelectHtml(headCode, i);
    } else {
        item['Expense Head'] = $tr.find('td').eq(Indx_Tbl.ExpenseHead).text().trim();
    }
    item['ExpenseHeadMaster_Code'] = '<input type="hidden" class="hdnExpenseHeadMasterCode" value="' + headCode + '" />';

    if (G_ProjectApplicable === 'Y') {
        var pm = parseInt($tr.find('.ee-ddl-project').val(), 10) || 0;
        var sp = parseInt($tr.find('.ee-ddl-subproject').val(), 10) || 0;
        item['Project'] = buildProjectSelectHtml(pm, i);
        item['Sub Project'] = buildSubProjectSelectHtml(pm, sp, i);
    }

    var perDayV = $tr.find('.txtPerDay').val();
    if (perDayV === undefined || perDayV === null) perDayV = '0';
    var allowedV = $tr.find('.txtAllowedAmount').val();
    if (allowedV === undefined || allowedV === null) allowedV = '0';
    var expV = $tr.find('.txtExpendedAmount').val();
    if (expV === undefined || expV === null) expV = '0';
    var apprV = $tr.find('.txtApprovedAmount').val();
    if (apprV === undefined || apprV === null) apprV = '0';
    var remV = $tr.find('.txtRemarks').val() || '';

    item['Per Day Limit'] = '<input type="number" id="txtPerDay" data-index="' + i + '" value="' + escHtml(perDayV) + '" class="bal-mt-input txtPerDay" readonly="readonly" autocomplete="off">';
    item['Allowed Amount'] = '<input type="number" id="txtAllowedAmount" data-index="' + i + '" value="' + escHtml(allowedV) + '" class="bal-mt-input txtAllowedAmount" readonly="readonly" autocomplete="off" style="text-align: right;">';
    item['Expense Amount'] = '<input type="number" id="txtExpendedAmount" data-index="' + i + '" value="' + escHtml(expV) + '" class="bal-mt-input txtExpendedAmount" onfocusout="CalculateApprovedAmount(this);" autocomplete="off" style="text-align: right;" oninput="limitInputLength(this, 8);">';
    item['Approved Amount'] = '<input type="number" ' + G_EeApprovedInputDisabled + ' id="txtApprovedAmount" data-index="' + i + '" value="' + escHtml(apprV) + '" class="bal-pc-input txtApprovedAmount" onfocusout="ApprovedAmountIncrease(this);" autocomplete="off" style="text-align: right;" oninput="limitInputLength(this, 8);">';
    item['Remarks'] = '<input type="text" id="txtRemarks" data-index="' + i + '" value="' + escHtml(remV) + '" class="bal-mtrs-input txtRemarks" autocomplete="off" maxlength="16">';
}

function syncVisibleExpenseDetailRowsToFilteredData() {
    $('#ExpenseEntryDetails-body tr').not('.total-row').not('.grand-total-row').each(function () {
        var $tr = $(this);
        if ($tr.hasClass('expense-entry-empty-row')) return;
        if (!$tr.find('.hdnExpenseHeadMasterCode').length) return;
        syncExpenseDetailRowToFilteredData($tr);
    });
}

function getDetailRowExpenseHeadCodeFromItem(item) {
    var cell = item['ExpenseHeadMaster_Code'] || '';
    var $d = $('<div>').html(cell);
    var v = parseInt($d.find('.hdnExpenseHeadMasterCode').val(), 10);
    if (!isNaN(v) && v > 0) return v;
    var $sel = $('<div>').html(item['Expense Head'] || '').find('.ee-ddl-expensehead');
    if ($sel.length) return parseInt($sel.val(), 10) || 0;
    return 0;
}

function getDetailRowSubProjectCodeFromItem(item) {
    if (G_ProjectApplicable !== 'Y') return 0;
    var cell = item['Sub Project'] || '';
    var $d = $('<div>').html(cell);
    var $s = $d.find('select.ee-ddl-subproject');
    if ($s.length) return parseInt($s.val(), 10) || 0;
    return 0;
}

function validateDuplicateSubProjectExpenseHead() {
    if (G_ProjectApplicable !== 'Y') return true;
    var tableId = 'ExpenseEntryDetails';
    var fd = window['filteredData_' + tableId];
    if (!fd || !fd.length) return true;
    var seen = {};
    for (var i = 0; i < fd.length; i++) {
        var head = getDetailRowExpenseHeadCodeFromItem(fd[i]);
        if (head <= 0) continue;
        var sub = getDetailRowSubProjectCodeFromItem(fd[i]);
        var key = sub + '|' + head;
        if (seen[key]) {
            toastr.error('Each Sub Project can only have one line per Expense Head. Remove or change the duplicate combination before saving.');
            return false;
        }
        seen[key] = true;
    }
    return true;
}

/** When API config ProjectApplicable is Y, each line with an expense head needs Project + Sub Project. */
function validateExpenseDetailProjectSubProject() {
    if (G_ProjectApplicable !== 'Y') return true;
    var ok = true;
    $('#ExpenseEntryDetails-body tr').not('.total-row').not('.grand-total-row').each(function () {
        var $r = $(this);
        if ($r.hasClass('expense-entry-empty-row')) return;
        var $head = $r.find('.ee-ddl-expensehead');
        if (!$head.length || (parseInt($head.val(), 10) || 0) <= 0) return;
        var pm = parseInt($r.find('.ee-ddl-project').val(), 10) || 0;
        var sp = parseInt($r.find('.ee-ddl-subproject').val(), 10) || 0;
        if (pm <= 0 || sp <= 0) {
            ok = false;
            return false;
        }
    });
    if (!ok) {
        toastr.warning('Please select Project and Sub Project on every line when project is applicable.');
    }
    return ok;
}

function parseAllowedAmountFromDetailItem(item) {
    if (!item) return null;
    var html = item['Allowed Amount'];
    if (html === undefined || html === null) return null;
    if (typeof html === 'number' && !isNaN(html)) return html;
    var $wrap = $('<div>').html(String(html));
    var $inp = $wrap.find('input.txtAllowedAmount');
    if ($inp.length) {
        var raw = $inp.attr('value');
        if (raw === undefined || raw === null) raw = $inp.val();
        var v = parseFloat(raw);
        return isNaN(v) ? null : v;
    }
    return null;
}

function findAllowedAmountFromOtherDetailRow(headCode, excludeIdx) {
    var fd = window['filteredData_ExpenseEntryDetails'];
    if (!fd || !headCode) return null;
    var hc = Number(headCode);
    for (var j = 0; j < fd.length; j++) {
        if (excludeIdx >= 0 && j === excludeIdx) continue;
        if (getDetailRowExpenseHeadCodeFromItem(fd[j]) !== hc) continue;
        var amt = parseAllowedAmountFromDetailItem(fd[j]);
        if (amt != null && amt > 0) return amt;
    }
    return null;
}

function applyAllowedAmountFallbackForRow($row, rowCode) {
    var idx = expenseDetailDataIndexFromRow($row);
    var v = findAllowedAmountFromOtherDetailRow(rowCode, idx);
    if (v == null || v === 0) {
        var opt = G_ExpenseHeadOptions.find(function (h) {
            return Number(h.ExpenseHeadMaster_Code) === Number(rowCode);
        });
        if (opt && opt.templateAllowedAmount != null && !isNaN(Number(opt.templateAllowedAmount))) {
            v = Number(opt.templateAllowedAmount);
        }
    }
    if (v != null && !isNaN(v)) {
        $row.find('.txtAllowedAmount').val(v);
    }
}

/** When user picks an expense head: fill Per Day / Allowed from template or another line, then API may refine Allowed. */
function applyImmediateFieldsForExpenseHeadSelection($row, headCode) {
    if (!headCode || headCode <= 0) {
        $row.find('.txtAllowedAmount').val('0');
        $row.find('.txtPerDay').val('0');
        refreshExpenseEntryDetailTotals();
        return;
    }
    var meta = G_ExpenseHeadOptions.find(function (h) {
        return Number(h.ExpenseHeadMaster_Code) === Number(headCode);
    }) || {};
    var idx = expenseDetailDataIndexFromRow($row);
    var fromOther = findAllowedAmountFromOtherDetailRow(headCode, idx);
    var allowed = (fromOther != null && fromOther > 0)
        ? fromOther
        : (meta.templateAllowedAmount != null && !isNaN(Number(meta.templateAllowedAmount)) ? Number(meta.templateAllowedAmount) : 0);
    var perDay = meta.templatePerDayLimit != null && !isNaN(Number(meta.templatePerDayLimit)) ? Number(meta.templatePerDayLimit) : 0;
    $row.find('.txtAllowedAmount').val(allowed);
    $row.find('.txtPerDay').val(perDay);
    refreshExpenseEntryDetailTotals();
}

function refreshAllowedAmountForSingleRow($row) {
    var fromDate = $('#txtFromDate').val();
    var toDate = $('#txtToDate').val();
    var rowCode = parseInt($row.find('.hdnExpenseHeadMasterCode').val(), 10) || 0;
    if (rowCode <= 0) {
        $row.find('.txtAllowedAmount').val('0');
        syncExpenseDetailRowToFilteredData($row);
        refreshExpenseEntryDetailTotals();
        return;
    }
    function finish() {
        syncExpenseDetailRowToFilteredData($row);
        refreshExpenseEntryDetailTotals();
    }
    if (!fromDate || !toDate || !MarketingManMaster_Code) {
        applyAllowedAmountFallbackForRow($row, rowCode);
        finish();
        return;
    }
    ExpenseEntryService.CalculateAllowedAmount(
        MarketingManMaster_Code,
        convertDateFormat1(fromDate),
        convertDateFormat1(toDate)
    ).then(function (response) {
        if (response && response.length > 0) {
            var matchedItem = response.find(function (item) {
                return Number(item.ExpenseHeadMaster_Code) === Number(rowCode);
            });
            if (matchedItem && matchedItem.TotalExpense !== undefined && matchedItem.TotalExpense !== null) {
                $row.find('.txtAllowedAmount').val(matchedItem.TotalExpense);
            } else {
                applyAllowedAmountFallbackForRow($row, rowCode);
            }
        } else {
            applyAllowedAmountFallbackForRow($row, rowCode);
        }
        finish();
    }).catch(function () {
        applyAllowedAmountFallbackForRow($row, rowCode);
        finish();
    });
}

function appendNewExpenseEntryRow() {
    if (param_Mode === 'View') return;
    if (!G_ExpenseHeadOptions.length) {
        toastr.warning('No expense heads are available to add a row.');
        return;
    }
    var tableId = 'ExpenseEntryDetails';
    var fd = ensureExpenseEntryDetailDataStore();
    var temp = window['filteredDataTemp_' + tableId];
    var i = fd.length;
    var newRow = buildExpenseDetailRowObject(i);

    fd.push(newRow);
    if (temp && Array.isArray(temp) && temp !== fd) {
        temp.push(newRow);
    } else {
        window['filteredDataTemp_' + tableId] = fd;
    }

    if (window['Paginator_' + tableId] === true && $('#pageSize-' + tableId).length) {
        var ipp = parseInt($('#pageSize-' + tableId).val(), 10) || 10;
        window['currentPage_' + tableId] = Math.max(1, Math.ceil(fd.length / ipp));
    }
    renderExpenseEntryDetailGrid();
    $('#paginator-ExpenseEntryDetails').show();
    applyApprovedAmountInputState();
    DisableControls();
    if (MarketingManMaster_Code) {
        CalculateTotalDays(MarketingManMaster_Code);
    }
}

var MarketingPersonName = param_MarketingMan_Name;
var MarketingManMaster_Code = 0;
var G_EeClosingBalanceRequestId = 0;

function applyClosingBalanceFieldVisibility() {
    if (G_ProjectApplicable === 'Y') {
        $('#eeClosingBalWrap').show();
    } else {
        $('#eeClosingBalWrap').hide();
        $('#txtClosingBalance').val('');
    }
}

function formatClosingBalanceDisplay(row) {
    if (!row) return '';
    var err = row.Error || row.error || row.Message || row.message;
    if (err) return '';
    var amt = row.ClosingBalance != null ? row.ClosingBalance : (row.Balance != null ? Math.abs(Number(row.Balance)) : null);
    if (amt === null || amt === undefined || amt === '') return '';
    var n = Number(amt);
    if (isNaN(n)) return '';
    var drCr = (row.DrCr != null ? String(row.DrCr) : '').trim();
    var displayAmt = Math.abs(n);
    return drCr ? displayAmt.toFixed(3) + ' ' + drCr : displayAmt.toFixed(3);
}

/** Closing balance = payments − expenses for sales person + project + sub project (From/To dates). */
function refreshClosingBalance(projectMasterCode, subProjectMasterCode) {
    if (G_ProjectApplicable !== 'Y') {
        $('#txtClosingBalance').val('');
        return;
    }
    var pm = parseInt(projectMasterCode, 10) || 0;
    var sp = parseInt(subProjectMasterCode, 10) || 0;
    if (pm <= 0 || sp <= 0) {
        $('#txtClosingBalance').val('');
        return;
    }
    var fromDate = $('#txtFromDate').val();
    var toDate = $('#txtToDate').val();
    if (!fromDate || !toDate || !MarketingManMaster_Code) {
        $('#txtClosingBalance').val('');
        return;
    }
    var reqId = ++G_EeClosingBalanceRequestId;
    ExpensesLedgerReportService.GetClosingBalance(
        convertDateFormat1(fromDate),
        convertDateFormat1(toDate),
        MarketingManMaster_Code,
        pm,
        sp
    ).then(function (response) {
        if (reqId !== G_EeClosingBalanceRequestId) return;
        var rows = Array.isArray(response) ? response : (response && Array.isArray(response.Data) ? response.Data : []);
        if (!rows.length) {
            $('#txtClosingBalance').val('');
            return;
        }
        var err0 = rows[0].Error || rows[0].error;
        if (err0) {
            $('#txtClosingBalance').val('');
            return;
        }
        $('#txtClosingBalance').val(formatClosingBalanceDisplay(rows[0]));
    }).catch(function () {
        if (reqId !== G_EeClosingBalanceRequestId) return;
        $('#txtClosingBalance').val('');
    });
}

function refreshClosingBalanceFromRow($row) {
    if (!$row || !$row.length) return;
    var pm = parseInt($row.find('.ee-ddl-project').val(), 10) || 0;
    var sp = parseInt($row.find('.ee-ddl-subproject').val(), 10) || 0;
    refreshClosingBalance(pm, sp);
}

$(document).ready(function () {
    $("#ERPHeading").text("Expense Entry Details");

    
    var today = new Date();
    const yyyy = today.getFullYear();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    const currentDate = `${dd}-${mm}-${yyyy}`;
    
    $('#txtEntryDate').val(currentDate);
    DatePicker();

    $('#txtMarketingManName').val(MarketingPersonName);
    $('#txtFromDate').on('keydown', function (e) {
        if (e.key === "Enter") {
            $("#txtToDate").focus();
        }
    });
    $('#txtToDate').on('keydown', function (e) {
        if (e.key === "Enter") {

        }
    });
    $('#ExpenseEntryDetails').on('keydown', '.txtExpendedAmount', function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            $(this).closest('tr').find('.txtRemarks').focus();
        }
    });

    $('#ExpenseEntryDetails').on('keydown', '.txtRemarks', function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            var nextRow = $(this).closest('tr').next();
            if (nextRow.length) {
                nextRow.find('.txtExpendedAmount').focus();
            }
        }
    });

    $('#ExpenseEntryDetails').on('change', '.ee-ddl-project', function () {
        var $row = $(this).closest('tr');
        var gidx = expenseDetailDataIndexFromRow($row);
        var idxForHtml = gidx >= 0 ? gidx : 0;
        var proj = parseInt($(this).val(), 10) || 0;
        var html = buildSubProjectSelectHtml(proj, 0, idxForHtml);
        $row.find('td').eq(Indx_Tbl.SubProject).html(html);
        syncExpenseDetailRowToFilteredData($row);
        $('#txtClosingBalance').val('');
    });

    $('#ExpenseEntryDetails').on('change', '.ee-ddl-subproject', function () {
        var $row = $(this).closest('tr');
        syncExpenseDetailRowToFilteredData($row);
        refreshClosingBalanceFromRow($row);
    });

    $('#ExpenseEntryDetails').on('input', '.txtAllowedAmount, .txtExpendedAmount, .txtApprovedAmount', function () {
        refreshExpenseEntryDetailTotals();
    });

    $('#ExpenseEntryDetails').on('change', '.ee-ddl-expensehead', function () {
        var $row = $(this).closest('tr');
        var code = parseInt($(this).val(), 10) || 0;
        $row.find('.hdnExpenseHeadMasterCode').val(code);
        var meta = G_ExpenseHeadOptions.find(function (h) {
            return Number(h.ExpenseHeadMaster_Code) === code;
        }) || {};
        $row.find('td').eq(Indx_Tbl.Designation).text(meta['Designation Name'] != null ? meta['Designation Name'] : '');
        $row.find('td').eq(Indx_Tbl.EffectiveFrom).text(meta['Effective From'] != null ? meta['Effective From'] : '');
        var idx = expenseDetailDataIndexFromRow($row);
        if (idx >= 0 && window['filteredData_ExpenseEntryDetails'] && window['filteredData_ExpenseEntryDetails'][idx]) {
            var item = window['filteredData_ExpenseEntryDetails'][idx];
            item['Designation Name'] = meta['Designation Name'] != null ? meta['Designation Name'] : '';
            item['Effective From'] = meta['Effective From'] != null ? meta['Effective From'] : '';
        }
        applyImmediateFieldsForExpenseHeadSelection($row, code);
        syncExpenseDetailRowToFilteredData($row);
        refreshAllowedAmountForSingleRow($row);
    });

    $('#btnNewRow').on('click', function () {
        if (param_Mode === 'View') return;
        appendNewExpenseEntryRow();
    });

    $('#btnExpenseEntryMasterAttach').on('click', function () {
        openExpenseEntryMasterAttachmentControl();
    });

    ExpenseEntryService.GetMarketingManMasterByName(param_MarketingMan_Name).then(function (mm) {
        if (mm && mm.Code) {
            MarketingManMaster_Code = parseInt(mm.Code, 10) || 0;
        }
    });

    ExpenseEntryService.GetConfigExpenseEntryParameter()
        .then(function (cfg) {
            var row = Array.isArray(cfg) && cfg.length > 0 ? cfg[0] : (cfg || {});
            G_ProjectApplicable      = ((row.ProjectApplicable      || 'N') + '').trim().toUpperCase();
            G_LevelVerifyApplicable  = ((row.LevelVerifyApplicable  || 'N') + '').trim().toUpperCase();
            refreshApprovedAmountInputDisabledAttr();
            applyClosingBalanceFieldVisibility();
            PopulateExpenseHeadDetails(param_ExpenseEntryMaster_Code);
        })
        .catch(function () {
            refreshApprovedAmountInputDisabledAttr();
            PopulateExpenseHeadDetails(param_ExpenseEntryMaster_Code);
        });

    $('#btnBack').click(function (e) {
        let MarketingPersonName = encodeURIComponent($("#txtMarketingManName").val());
        let FromDate = encodeURIComponent($("#txtFromDate").val());
        let ToDate = encodeURIComponent($("#txtToDate").val());

        window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryList?MarketingMan_Name=" + MarketingPersonName + "&FromDate=" + FromDate + "&ToDate=" + ToDate;
    });


    $('#btnSubmit').click(function (e) {
        var option = parseInt(param_ExpenseEntryMaster_Code, 10) > 0 ? 'Edit' : 'New';
        CheckRight(option).then(function (respCheck) {
            if (respCheck && respCheck.CheckModuleOptionRight === 'N') {
                toastr.error(respCheck.Msg);
                return;
            }
            SaveData();
        });
    });
    $('#btnVerify').click(function (e) {
        CheckRight('Verify').then(function (respCheck) {
            if (respCheck && respCheck.CheckModuleOptionRight === 'N') {
                toastr.error(respCheck.Msg);
                return;
            }
            VerifyExpenseEntryMaster();
        });
    });

    $('#eeBtnConfirmCancel').on('click', function () { ApplyAmountExceedResponse(false); });
    $('#eeBtnConfirmProceed').on('click', function () { ApplyAmountExceedResponse(true); });

    DisableControls();
    ValidateMarketingPersonSenior();
});

function DisableControls() {
    if (param_Mode == 'View') {
        $('input, textarea').prop('disabled', true);
        $('#ExpenseEntryDetails select.ee-ddl-project, #ExpenseEntryDetails select.ee-ddl-subproject, #ExpenseEntryDetails select.ee-ddl-expensehead').prop('disabled', true);
        $("#btnBack").prop("disabled", false);
        $("#btnExpenseEntryMasterAttach").prop("disabled", false);
        $("#btnSubmit").hide();
        $("#btnVerify").hide();
        $("#btnNewRow").hide();
    } else {
        $("#btnSubmit").show();
        $("#btnVerify").show();
        $("#btnNewRow").show();
        $("#btnExpenseEntryMasterAttach").prop("disabled", false);
    }
    if (param_ExpenseEntryMaster_Code > 0) {
        $("#ExpenseEntryDetails thead tr th:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', '');
        $("#ExpenseEntryDetails tbody tr td:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', '');
        $("#ExpenseEntryDetails tfoot tr td:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', '');
    } else {
        $("#ExpenseEntryDetails thead tr th:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', 'none');
        $("#ExpenseEntryDetails tbody tr td:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', 'none');
        $("#ExpenseEntryDetails tfoot tr td:nth-child(" + (Indx_Tbl.Attachment + 1) + ")").css('display', 'none');
    }
    if (param_Mode !== 'View') {
        $("#btnNewRow").prop("disabled", G_ExpenseHeadOptions.length === 0);
    }
    applyApprovedAmountInputState();
}
function PopulateExpenseHeadDetails(Code) {
    refreshApprovedAmountInputDisabledAttr();
    Promise.all([
        ProjectMasterService.GetProjectList(),
        SubProjectMasterService.GetSubProjectList(),
        ExpenseEntryService.GetExpenseEntryDetails(MarketingPersonName, Code)
    ]).then(function (results) {
            G_ProjectList = Array.isArray(results[0]) ? results[0] : [];
            G_SubProjectList = Array.isArray(results[1]) ? results[1] : [];
            var response = results[2];
            if (!response) {
                toastr.error('No Data Found');
                DisableControls();
                return;
            }
            if (response.ExpenseEntryMaster && response.ExpenseEntryMaster.length > 0) {
                $('#txtEntryNo').val(response.ExpenseEntryMaster[0].EntryNo);
                $('#txtEntryDate').val(response.ExpenseEntryMaster[0].EntryDate);
                $('#txtFromDate').val(response.ExpenseEntryMaster[0].FromDate);
                $('#txtToDate').val(response.ExpenseEntryMaster[0].ToDate);
                MarketingManMaster_Code = (response.ExpenseEntryMaster[0].MarketingManMaster_Code);
                CalculateTotalDays(MarketingManMaster_Code);
            } else {
                toastr.error('No Data Found');
            }

            var rawList = response.ExpenseEntryDetail || [];
            if (rawList.length > 0) {
                buildExpenseHeadOptionsFromDetailList(rawList);
                var detailData = rawList.map(function (item, index) {
                    var pm = Number(item.ProjectMaster_Code != null ? item.ProjectMaster_Code : 0) || 0;
                    var spm = Number(item.SubProjectMaster_Code != null ? item.SubProjectMaster_Code : 0) || 0;
                    return {
                        'Expense Head': item['Expense Head'],
                        'Designation Name': item['Designation Name'],
                        'Effective From': item['Effective From'],
                        'Per Day Limit': '<input type="number" id="txtPerDay" data-index="' + index + '" value="' + (item['Per Day Limit'] || 0) + '" class="bal-mt-input txtPerDay" readonly="readonly" autocomplete="off">',
                        'Project': buildProjectSelectHtml(pm, index),
                        'Sub Project': buildSubProjectSelectHtml(pm, spm, index),
                        'Allowed Amount': '<input type="number" id="txtAllowedAmount" data-index="' + index + '" value="' + (item['Allowed Amount'] || 0) + '" class="bal-mt-input txtAllowedAmount" readonly="readonly" autocomplete="off" style="text-align: right;">',
                        'Expense Amount': '<input type="number" id="txtExpendedAmount" data-index="' + index + '" value="' + (item['Expense Amount'] || 0) + '" class="bal-mt-input txtExpendedAmount" onfocusout="CalculateApprovedAmount(this);" autocomplete="off" style="text-align: right;" oninput="limitInputLength(this, 8);">',
                        'Approved Amount': '<input type="number" ' + G_EeApprovedInputDisabled + ' id="txtApprovedAmount" data-index="' + index + '" value="' + (item['Approved Amount'] || 0) + '" class="bal-pc-input txtApprovedAmount" onfocusout="ApprovedAmountIncrease(this);" autocomplete="off" style="text-align: right;" oninput="limitInputLength(this, 8);">',
                        'Remarks': '<input type="text" id="txtRemarks" data-index="' + index + '" value="' + (item['Remarks'] || '') + '" class="bal-mtrs-input txtRemarks" autocomplete="off" maxlength="16">',
                        'Attachment': buildDetailAttachmentButtonHtml(item['ExpenseEntryDetail_Code'] != null ? item['ExpenseEntryDetail_Code'] : 0),
                        'VerifyStatus': item['VerifyStatus'] !== undefined && item['VerifyStatus'] !== null ? item['VerifyStatus'] : '',
                        'ExpenseEntryDetail_Code': formatExpenseEntryDetailCodeCell(item['ExpenseEntryDetail_Code'] != null ? item['ExpenseEntryDetail_Code'] : 0),
                        'ExpenseHeadMaster_Code': '<input type="hidden" class="hdnExpenseHeadMasterCode" value="' + (item.ExpenseHeadMaster_Code != null ? item.ExpenseHeadMaster_Code : 0) + '" />'
                    };
                });
                const StringFilterColumn = [];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = getExpenseDetailHiddenColumns();
                const ColumnAlignment = getExpenseDetailColumnAlignment();
                const totalAmount = ['Allowed Amount', 'Approved Amount', 'Expense Amount'];
                BizsolCustomFilterGrid.CreateDataTable('ExpenseEntryDetails-header', 'ExpenseEntryDetails-body', detailData, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false, totalAmount);
                $('#paginator-ExpenseEntryDetails').show();
                refreshExpenseEntryDetailTotals();
                applyClosingBalanceFieldVisibility();
                var $firstWithSub = $('#ExpenseEntryDetails-body tr').not('.total-row').not('.grand-total-row').filter(function () {
                    return (parseInt($(this).find('.ee-ddl-subproject').val(), 10) || 0) > 0;
                }).first();
                if ($firstWithSub.length) {
                    refreshClosingBalanceFromRow($firstWithSub);
                }
            } else {
                loadExpenseHeadOptionsFromTemplate(MarketingPersonName).then(function () {
                    if (G_ExpenseHeadOptions.length > 0) {
                        initializeExpenseEntryDetailGridShell();
                        $('#paginator-ExpenseEntryDetails').hide();
                    } else {
                        ShowExpenseEntryDetailEmptyState();
                    }
                    applyApprovedAmountInputState();
                    DisableControls();
                }).catch(function () {
                    G_ExpenseHeadOptions = [];
                    ShowExpenseEntryDetailEmptyState();
                    DisableControls();
                });
                return;
            }
            applyApprovedAmountInputState();
            DisableControls();
        }).catch(function () {
            toastr.error('Could not load expense entry details.');
            DisableControls();
        });
}
function ShowExpenseEntryDetailEmptyState() {
    var emptyRow = buildExpenseDetailRowObject(0);
    var hiddenColumns = getExpenseDetailHiddenColumns();
    renderTableHeader(hiddenColumns, "ExpenseEntryDetails-header", "ExpenseEntryDetails-body", Object.keys(emptyRow), false, [], [], [], []);
    var colCount = Object.keys(emptyRow).length;
    $("#ExpenseEntryDetails-body").html('<tr class="expense-entry-empty-row"><td colspan="' + colCount + '"><span>No expense heads configured for this sales person</span></td></tr>');
    $("#paginator-ExpenseEntryDetails").hide();
}
function limitInputLength(elem, maxLength) {
    let value = elem.value;
    value = value.replace(/-/g, 0);
    if (value.length > maxLength) {
        value = value.slice(0, maxLength);
    }
    if (value.trim() === '') {
        value = '0';
    }
    elem.value = value;
}

function ViewAttachment(x) {
    var masterCode = getExpenseEntryMasterCode();
    if (masterCode <= 0) {
        toastr.warning('Please save the expense entry first.');
        return;
    }
    var $btn = $(x);
    var detailCode = parseInt($btn.attr('data-detail-code'), 10);
    if (isNaN(detailCode) || detailCode <= 0) {
        detailCode = normalizeDetailLineCode($btn.closest('tr'));
    }
    if (detailCode <= 0) {
        toastr.warning('Please save this line first, then attach files.');
        return;
    }
    var entryNo = parseInt($('#txtEntryNo').val(), 10) || 0;
    var entryDate = entryDateParamForAttachmentControl();
    InitAttachmentControl('ExpenseEntryMaster', masterCode, 'ExpenseEntryDetail', detailCode, entryNo, entryDate, getAttachmentControlMode());
}

/** Master-level attachments (footer): ExpenseEntryMaster_Code, no detail table. */
function openExpenseEntryMasterAttachmentControl() {
    var masterCode = getExpenseEntryMasterCode();
    var entryNo = parseInt($('#txtEntryNo').val(), 10) || 0;
    var entryDate = entryDateParamForAttachmentControl();
    InitAttachmentControl('ExpenseEntryMaster', masterCode, '', 0, entryNo, entryDate, getAttachmentControlMode());
}

function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode) {
    var url = `${sessionStorage.getItem('AppBaseURL')}/CustomControl/AttachmentControl`;
    $('#ExpenseEntryDetail_AttachmentControlmodal').load(url, {
        MasterTableName: masterTableName,
        MasterTableCode: parseInt(masterTableCode, 10) || 0,
        DetailTableName: detailTableName || '',
        DetailTableCode: parseInt(detailTableCode, 10) || 0,
        EntryNo: parseInt(entryNo, 10) || 0,
        EntryDate: entryDate || '',
        Mode: mode || 'all'
    });
}

var G_AmountExceedRow = null;

function CalculateApprovedAmount(x) {
    var ApprovedAmount = 0;
    var ObjCurrRow = $(x).closest('tr');
    var AllowedAmount = ObjCurrRow.find('.txtAllowedAmount').val();
    var ExpendedAmount = ObjCurrRow.find('.txtExpendedAmount').val();
    ApprovedAmount = ExpendedAmount;
    if (parseFloat(AllowedAmount) < parseFloat(ExpendedAmount)) {
        ApprovedAmount = AllowedAmount;
        G_AmountExceedRow = ObjCurrRow;
        G_AmountExceedRow.data('allowedAmount', AllowedAmount);
        $('#eeConfirmBackdrop').addClass('show');
        refreshExpenseEntryDetailTotals();
        return;
    }
    ObjCurrRow.find('.txtApprovedAmount').val(ApprovedAmount);
    refreshExpenseEntryDetailTotals();
}

function ApplyAmountExceedResponse(proceed) {
    if (G_AmountExceedRow && G_AmountExceedRow.length) {
        var allowedAmount = G_AmountExceedRow.data('allowedAmount');
        G_AmountExceedRow.find('.txtApprovedAmount').val(allowedAmount);
        G_AmountExceedRow = null;
    }
    $('#eeConfirmBackdrop').removeClass('show');
    refreshExpenseEntryDetailTotals();
}

function ShowExpenseEntryDetailSuccessModal(title, text, iconClass) {
    $('#eeSuccessModalTitle').text(title || "Done!");
    $('#eeSuccessModalText').text(text || "Operation completed successfully.");
    $('#eeSuccessModalIcon').removeClass().addClass('fas ' + (iconClass || 'fa-circle-check'));
    $('#eeSuccessBackdrop').addClass('show');
}

function CloseExpenseEntryDetailSuccessModal() {
    $('#eeSuccessBackdrop').removeClass('show');
}
function ApprovedAmountIncrease(x) {
    var ObjCurrRow = $(x).closest('tr');
    var allowedAmountIncrease = parseFloat(ObjCurrRow.find('.txtApprovedAmount').val()) || 0;
    var expendedAmountIncrease = parseFloat(ObjCurrRow.find('.txtExpendedAmount').val()) || 0;

    if (allowedAmountIncrease > expendedAmountIncrease) {
        ObjCurrRow.find('.txtApprovedAmount').val(expendedAmountIncrease);
        toastr.warning("Approved amount should be Less than Expended amount.");
    }
    refreshExpenseEntryDetailTotals();
}


function setupDateInputFormatting() {
    $('#txtToDate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');

        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);

        if (value.length === 10) {
            validateDate(value);
        } else {
            $(this).val(value);
        }
    });
    $('#txtFromDate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');

        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);

        if (value.length === 10) {
            validateDateFrom(value);
        } else {
            $(this).val(value);
        }
    });
}
function validateDateFrom(value) {
    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    let isValidFormat = regex.test(value);

    if (isValidFormat) {
        let parts = value.split('/');
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let date = new Date(year, month - 1, day);

        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

            $(this).val(value);
        } else {
            $('#txtFromDate').val('');

        }

    } else {
        $('#txtFromDate').val('');

    }
}
function validateDate(value) {
    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    let isValidFormat = regex.test(value);

    if (isValidFormat) {
        let parts = value.split('/');
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let date = new Date(year, month - 1, day);

        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

            $(this).val(value);
        } else {
            $('#txtToDate').val('');

        }

    } else {
        $('#txtToDate').val('');

    }
}
function DatePicker() {

    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();

    $('#txtToDate, #txtFromDate').val(`${day}-${month}-${year}`);
    $('#txtToDate, #txtFromDate').datepicker({
        format: 'dd-mm-yyyy',
        autoclose: true,
    }).on('change', function () {
        CalculateTotalDays(MarketingManMaster_Code);
        var $active = $('#ExpenseEntryDetails-body tr').not('.total-row').not('.grand-total-row').has('.ee-ddl-subproject:focus').first();
        if (!$active.length) {
            $active = $('#ExpenseEntryDetails-body tr').not('.total-row').not('.grand-total-row').filter(function () {
                return (parseInt($(this).find('.ee-ddl-subproject').val(), 10) || 0) > 0;
            }).first();
        }
        if ($active.length) {
            refreshClosingBalanceFromRow($active);
        }
    });

}
/** Parse UI date (dd-mm-yyyy or dd/mm/yyyy). Returns null if invalid. */
function parseDate(dateStr) {
    if (!dateStr) return null;
    var s = String(dateStr).trim();
    var sep = s.indexOf('/') >= 0 ? '/' : '-';
    var parts = s.split(sep);
    if (parts.length !== 3) return null;
    var day = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1;
    var year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    var d = new Date(year, month, day);
    if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
    return d;
}

/** Attachment control uses `new Date(hfEntryDate)` → pass ISO here (display field stays dd-mm-yyyy). */
function entryDateParamForAttachmentControl() {
    var d = parseDate(($('#txtEntryDate').val() || '').trim());
    return d ? d.toISOString() : '';
}

function CalculateTotalDays(MarketingManMaster_Code) {
    var fromDate = $('#txtFromDate').val();
    var toDate = $('#txtToDate').val();

    if (fromDate && toDate) {
        var fromDateObj = parseDate(fromDate);
        var toDateObj = parseDate(toDate);
        if (!fromDateObj || !toDateObj) {
            $('#txtTotalDays').val('');
            return;
        }

        // Inclusive: same day = 1, 22nd to 24th = 3 days
        var timeDiff = toDateObj - fromDateObj;
        var totalDays = Math.round((timeDiff / (1000 * 3600 * 24)) + 1);

        if (totalDays >= 1) {
            $('#txtTotalDays').val(totalDays);

            // Call service once and apply allowed amount to each row
            ExpenseEntryService.CalculateAllowedAmount(
                MarketingManMaster_Code,
                convertDateFormat1(fromDate),
                convertDateFormat1(toDate)
            ).then(function (response) {
                if (response && response.length > 0) {
                    $('#ExpenseEntryDetails tbody tr').each(function () {
                        if ($(this).hasClass('expense-entry-empty-row')) return;
                        if ($(this).hasClass('total-row') || $(this).hasClass('grand-total-row')) return;
                        const $row = $(this);
                        if (!$row.find('.hdnExpenseHeadMasterCode').length) return;

                        // Get ExpenseHeadMaster_Code from hidden input or a reliable source
                        const rowCode = parseInt($row.find('.hdnExpenseHeadMasterCode').val(), 10);

                        // Find matching item from response
                        const matchedItem = response.find(function (item) {
                            return item.ExpenseHeadMaster_Code === rowCode;
                        });

                        if (matchedItem) {
                            $row.find('.txtAllowedAmount').val(matchedItem.TotalExpense);
                        } else {
                            $row.find('.txtAllowedAmount').val("0");
                        }
                    });
                    refreshExpenseEntryDetailTotals();
                } else {
                    console.warn('No allowed amounts found from API');
                }
            }).catch(function (err) {
                console.error("Error fetching allowed amounts:", err);
                toastr.error("Could not load allowed amounts.");
            });

        } else {
            toastr.error("Please select a valid range of dates.");
        }
    } else {
        toastr.error("Please select both dates.");
    }
}


function VerifyExpenseEntryMaster() {
    if (ValidateVerifyData() == false) {
        return false;
    }
    if (param_ExpenseEntryMaster_Code == 0) {
        toastr.warning("Oops! Please save your data first, then verify.");
        return false;
    }
    
    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var UserMaster_Code = authKeyData.UserMaster_Code;
    var MarketingManMaster_Code = 0;
    ExpenseEntryService.GetMarketingManMasterByName(param_MarketingMan_Name).then(function (response) {

        if (response != '') {
            MarketingManMaster_Code = response.Code;

        }

        var ExpenseEntryDetailsData = [];

        var ExpenseEntryMasterRow = {};
        ExpenseEntryMasterRow["Code"] = parseInt(param_ExpenseEntryMaster_Code, 10) || 0;
        ExpenseEntryMasterRow["EntryNo"] = $('#txtEntryNo').val();
        ExpenseEntryMasterRow["MarketingManMaster_Code"] = parseInt(MarketingManMaster_Code, 10) || 0;
        ExpenseEntryMasterRow["FromDate"] = convertDateFormat($('#txtFromDate').val());
        ExpenseEntryMasterRow["ToDate"] = convertDateFormat($('#txtToDate').val());

        $("#ExpenseEntryDetails tbody tr").each(function (index, row) {
            if ($(this).hasClass('expense-entry-empty-row')) return;
            if ($(this).hasClass('total-row') || $(this).hasClass('grand-total-row')) return;
            if (!$(this).find('.hdnExpenseHeadMasterCode').length) return;

            var ExpenseHead = 0;
            var Designation = '';
            var EffectiveFrom = '';
            var PerDayLimit = 0;
            var AllowedAmount = 0;
            var ExpenseAmount = 0;
            var ApprovedAmount = 0;
            var Remarks = '';
            var Attachment = '';
            var ExpenseHeadMaster_Code = 0;


            ExpenseHead = $(this).find('td:eq(' + Indx_Tbl.ExpenseHead + ')')[0].innerHTML.trim();
            Designation = $(this).find('td:eq(' + Indx_Tbl.Designation + ')')[0].innerHTML.trim();
            EffectiveFrom = $(this).find('td:eq(' + Indx_Tbl.EffectiveFrom + ')')[0].innerHTML.trim();
            PerDayLimit = $(this).find('td:eq(' + Indx_Tbl.PerDayLimit + ')')[0].getElementsByTagName('input')[0].value;
            AllowedAmount = $(this).find('td:eq(' + Indx_Tbl.AllowedAmount + ')')[0].getElementsByTagName('input')[0].value;
            ExpenseAmount = $(this).find('td:eq(' + Indx_Tbl.ExpenseAmount + ')')[0].getElementsByTagName('input')[0].value;
            ApprovedAmount = $(this).find('td:eq(' + Indx_Tbl.ApprovedAmount + ')')[0].getElementsByTagName('input')[0].value;
            Remarks = $(this).find('td:eq(' + Indx_Tbl.Remarks + ')')[0].getElementsByTagName('input')[0].value;
            Attachment = '';// $(this).find('td:eq(' + Indx_Tbl.Attachment + ')')[0].getElementsByTagName('input')[0].value;
            //ExpenseHeadMaster_Code = $(this).find('td:eq(' + Indx_Tbl.ExpenseHeadMaster_Code + ')')[0].innerHTML.trim();
            ExpenseHeadMaster_Code = parseInt($(this).find('.hdnExpenseHeadMasterCode').val(), 10) || 0;
            var projectMaster_Code    = G_ProjectApplicable === 'Y' ? (parseInt($(this).find('.ee-ddl-project').val(), 10) || 0) : 0;
            var subProjectMaster_Code = G_ProjectApplicable === 'Y' ? (parseInt($(this).find('.ee-ddl-subproject').val(), 10) || 0) : 0;

            var rowData = {};

            rowData["Code"] = normalizeDetailLineCode($(this));
            rowData["ExpenseEntryMaster_Code"] = parseInt(param_ExpenseEntryMaster_Code, 10) || 0;
            rowData["ExpenseHeadMaster_Code"] = ExpenseHeadMaster_Code;
            rowData["ProjectMaster_Code"] = projectMaster_Code;
            rowData["SubProjectMaster_Code"] = subProjectMaster_Code;
            rowData["AllowLimit"] = PerDayLimit;
            rowData["AllowAmount"] = ApprovedAmount;
            rowData["ExpendedAmount"] = ExpenseAmount;
            rowData["Remarks"] = Remarks;
            rowData["voucherMaster_Code"] = 0;
            rowData["finYear"] = '';
            rowData["createdBy"] = UserMaster_Code;
            rowData["createDate"] = new Date().toISOString().split("T")[0];
            rowData["updatedBy"] = UserMaster_Code;
            rowData["updateDate"] = new Date().toISOString().split("T")[0];
            rowData["TotalDays"] = $('#txtTotalDays').val();
            rowData["FromDate"] = convertDateFormat($('#txtFromDate').val());
            rowData["ToDate"] = convertDateFormat($('#txtToDate').val());
            rowData["verifyStatus"] = "Y";
            rowData["verifyRejectedBy"] = UserMaster_Code;
            rowData["verifyRejectedDate"] = new Date().toISOString().split("T")[0];
            rowData["location"] = '';
            rowData["expendedThrough"] = 0;
            rowData["expendedOnBehalf"] = 0;
            rowData["amountToRecover"] = 0;

            ExpenseEntryDetailsData.push(rowData);
        });

        var allTablesData = buildExpenseEntryApiPayload(ExpenseEntryMasterRow, ExpenseEntryDetailsData);

        ExpenseEntryService.VerifyExpenseEntryMaster(allTablesData).then(function (response) {
            if (response && response.Status === 'N') {
                toastr.error(response.Msg);
            } else if (response && response.Status === 'Y') {
                ShowExpenseEntryDetailSuccessModal("Verified Successfully!", response.Msg || "Expense entry has been verified.", "fa-circle-check");
                setTimeout(function () {
                    window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryList";
                }, 2000);
            }
        });

    });

}

function SaveData() {
    if (ValidateData() == false) {
        return false;
    }
    var MarketingManMaster_Code = 0;
    ExpenseEntryService.GetMarketingManMasterByName(param_MarketingMan_Name).then(function (response) {

        if (response!='') {
            MarketingManMaster_Code = response.Code;


            var ExpenseEntryDetailsData = [];

            var ExpenseEntryMasterRow = {};

            var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
            var UserMaster_Code = authKeyData.UserMaster_Code;

            ExpenseEntryMasterRow["Code"] = parseInt(param_ExpenseEntryMaster_Code, 10) || 0;
            ExpenseEntryMasterRow["EntryNo"] = $('#txtEntryNo').val();
            ExpenseEntryMasterRow["MarketingManMaster_Code"] = parseInt(MarketingManMaster_Code, 10) || 0;
            ExpenseEntryMasterRow["FromDate"] = convertDateFormat($('#txtFromDate').val());
            ExpenseEntryMasterRow["ToDate"] = convertDateFormat($('#txtToDate').val());

            $("#ExpenseEntryDetails tbody tr").each(function (index, row) {
                if ($(this).hasClass('expense-entry-empty-row')) return;
                if ($(this).hasClass('total-row') || $(this).hasClass('grand-total-row')) return;
                if (!$(this).find('.hdnExpenseHeadMasterCode').length) return;

                var PerDayLimit = 0;
                var AllowedAmount = 0;
                var ExpenseAmount = 0;
                var ApprovedAmount = 0;
                var Remarks = '';
                var ExpenseHeadMaster_Code = 0;

                PerDayLimit = $(this).find('td:eq(' + Indx_Tbl.PerDayLimit + ')')[0].getElementsByTagName('input')[0].value;
                AllowedAmount = $(this).find('td:eq(' + Indx_Tbl.AllowedAmount + ')')[0].getElementsByTagName('input')[0].value;
                ExpenseAmount = $(this).find('td:eq(' + Indx_Tbl.ExpenseAmount + ')')[0].getElementsByTagName('input')[0].value;
                ApprovedAmount = $(this).find('td:eq(' + Indx_Tbl.ApprovedAmount + ')')[0].getElementsByTagName('input')[0].value;
                Remarks = $(this).find('td:eq(' + Indx_Tbl.Remarks + ')')[0].getElementsByTagName('input')[0].value;
                ExpenseHeadMaster_Code = $(this).find('.hdnExpenseHeadMasterCode').val();
                var projectMaster_Code    = G_ProjectApplicable === 'Y' ? (parseInt($(this).find('.ee-ddl-project').val(), 10) || 0) : 0;
                var subProjectMaster_Code = G_ProjectApplicable === 'Y' ? (parseInt($(this).find('.ee-ddl-subproject').val(), 10) || 0) : 0;

                var rowData = {};

                rowData["Code"] = normalizeDetailLineCode($(this));
                rowData["ExpenseEntryMaster_Code"] = parseInt(param_ExpenseEntryMaster_Code, 10) || 0;
                rowData["ExpenseHeadMaster_Code"] = parseInt(ExpenseHeadMaster_Code, 10) || 0;
                rowData["ProjectMaster_Code"] = projectMaster_Code;
                rowData["SubProjectMaster_Code"] = subProjectMaster_Code;
                rowData["AllowLimit"] = PerDayLimit;
                rowData["AllowAmount"] = ApprovedAmount;
                rowData["ExpendedAmount"] = ExpenseAmount;
                rowData["Remarks"] = Remarks;
                rowData["voucherMaster_Code"] = 0;
                rowData["finYear"] = '';
                rowData["createdBy"] = UserMaster_Code;
                rowData["createDate"] = new Date().toISOString().split("T")[0];
                rowData["updatedBy"] = UserMaster_Code;
                rowData["updateDate"] = new Date().toISOString().split("T")[0];
                rowData["TotalDays"] = $('#txtTotalDays').val();
                rowData["FromDate"] = convertDateFormat($('#txtFromDate').val());
                rowData["ToDate"] = convertDateFormat($('#txtToDate').val());
                rowData["verifyStatus"] = "N";
                rowData["verifyRejectedBy"] = 0;
                rowData["verifyRejectedDate"] = new Date().toISOString().split("T")[0];
                rowData["location"] = '';
                rowData["expendedThrough"] = 0;
                rowData["expendedOnBehalf"] = 0;
                rowData["amountToRecover"] = 0;

                ExpenseEntryDetailsData.push(rowData);
            });

            var allTablesData = buildExpenseEntryApiPayload(ExpenseEntryMasterRow, ExpenseEntryDetailsData);

            ExpenseEntryService.SaveExpenseEntryMaster(allTablesData).then(function (response) {
                if (response && response.Status === 'N') {
                    toastr.error(response.Msg);
                } else if (response && response.Status === 'Y') {
                    var Code = response.Code == undefined || response.Code == '' ? 0 : response.Code;
                    ShowExpenseEntryDetailSuccessModal("Saved Successfully!", response.Msg || "Expense entry has been saved.", "fa-circle-check");
                    setTimeout(function () {
                        const codes = window.btoa(Code);
                        var MarketingPersonName = window.btoa(param_MarketingMan_Name);
                        var Mode = window.btoa("Edit");
                        window.location = baseUrl + "/CRMTransactions/ExpenseEntry/ExpenseEntryDetail?Code=" + codes + "&Mode=" + Mode + "&MarketingMan_Name=" + MarketingPersonName;
                    }, 2000);
                }
            });
        }
    });
}
function ValidateData() {
    syncVisibleExpenseDetailRowsToFilteredData();

    var headMissing = false;
    $('#ExpenseEntryDetails-body tr').not('.total-row').not('.grand-total-row').each(function () {
        var $r = $(this);
        if ($r.hasClass('expense-entry-empty-row')) return;
        var $ddl = $r.find('.ee-ddl-expensehead');
        if ($ddl.length && (parseInt($ddl.val(), 10) || 0) <= 0) {
            headMissing = true;
            return false;
        }
    });
    if (headMissing) {
        toastr.warning('Please select an Expense Head on every added row.');
        return false;
    }

    if (!validateExpenseDetailProjectSubProject()) {
        return false;
    }

    if (!validateDuplicateSubProjectExpenseHead()) {
        return false;
    }

    var TotalDays = $('#txtTotalDays').val();
    var TotalAllowed = 0;
    var TotalApproved = 0;
    var TotalExp = 0;
    var EntryDateRange = ($('#txtEntryDate').val() || '').trim();
    var FromDateRange = ($('#txtFromDate').val() || '').trim();
    var ToDateRange = ($('#txtToDate').val() || '').trim();

    var entryDt = parseDate(EntryDateRange);
    var fromDt = parseDate(FromDateRange);
    var toDt = parseDate(ToDateRange);

    if (!entryDt || !fromDt || !toDt) {
        toastr.warning('Please enter valid Entry, From and To dates.');
        return false;
    }
    if (fromDt > toDt) {
        toastr.error('From Date cannot be after To Date.');
        return false;
    }
    /* Claim date must be on/after the expense period (not string compare — dd-mm-yyyy sorts wrong). */
    if (entryDt < fromDt || entryDt < toDt) {
        toastr.warning('Entry Date must be on or after both From Date and To Date.');
        return false;
    }

    if (TotalDays < 0) {
        toastr.error("Please select a valid range of dates.");
        return false;
    }
    
    $("#ExpenseEntryDetails tbody tr").each(function (index, row) {
        if ($(this).hasClass('expense-entry-empty-row')) return;
        if ($(this).hasClass('total-row') || $(this).hasClass('grand-total-row')) return;
        var $amtCell = $(this).find('td:eq(' + Indx_Tbl.AllowedAmount + ')');
        if (!$amtCell.length || !$amtCell[0].getElementsByTagName('input').length) return;
        var AllowedAmount = $amtCell[0].getElementsByTagName('input')[0].value;
        var ExpenseAmount = $(this).find('td:eq(' + Indx_Tbl.ExpenseAmount + ')')[0].getElementsByTagName('input')[0].value;
        var ApprovedAmount = $(this).find('td:eq(' + Indx_Tbl.ApprovedAmount + ')')[0].getElementsByTagName('input')[0].value;

        TotalAllowed += parseFloat(AllowedAmount);
        TotalExp += parseFloat(ExpenseAmount);
        TotalApproved += parseFloat(ApprovedAmount);

    });
    if (TotalAllowed < 0) {
        toastr.error("Invalid Allowed Amount.");
        return false;
    }
    if (TotalExp < 0) {
        toastr.error("Invalid Expense Amount.");
        return false;
    }
    if (TotalApproved > TotalExp) {
        toastr.warning("Approved amount can not greater then expended amount");
        return false;
    }
    return true;
}

function ValidateVerifyData() {
    if (ValidateData() == false) {
        return false;
    }
    var TotalApprovedAmount = 0;
    $("#ExpenseEntryDetails tbody tr").each(function (index, row) {
        if ($(this).hasClass('expense-entry-empty-row')) return;
        if ($(this).hasClass('total-row') || $(this).hasClass('grand-total-row')) return;
        var $ap = $(this).find('td:eq(' + Indx_Tbl.ApprovedAmount + ')');
        if (!$ap.length || !$ap[0].getElementsByTagName('input').length) return;
        var ApprovedAmount = $ap[0].getElementsByTagName('input')[0].value;
        TotalApprovedAmount += parseFloat(ApprovedAmount);
    });

    if (TotalApprovedAmount <= 0) {
        toastr.error("Invalid Approved Amount.");
        return false;
    }
    return true;
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${year}-${monthAbbreviation}-${day}`;
}
function convertDateFormat1(dateString) {
    const [day, month, year] = dateString.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}
function ValidateMarketingPersonSenior() {
ExpenseEntryService.ExpenseEntry_ValidateMarketingPersonSenior(param_ExpenseEntryMaster_Code).then(function (response) {
    if (parseInt(param_ExpenseEntryMaster_Code) === 0) {
        $('#btnVerify').prop('disabled', true);
        return;
    }

    if (response && response.length > 0) {
        if (response[0].Valid == "Y") {
            $('#btnVerify').prop('disabled', false);
        } else {
            $('#btnVerify').prop('disabled', true);
        }
    }
    if (param_Mode == 'View' && param_ExpenseEntryMaster_Code > 0) {
        $("#btnVerify").prop("disabled", true);
    }
});
}

window.ViewAttachment = ViewAttachment;
window.openExpenseEntryMasterAttachmentControl = openExpenseEntryMasterAttachmentControl;
window.CalculateApprovedAmount = CalculateApprovedAmount;
window.ApprovedAmountIncrease = ApprovedAmountIncrease;
window.SaveData = SaveData;
window.VerifyExpenseEntryMaster = VerifyExpenseEntryMaster;
window.limitInputLength = limitInputLength;
window.ApplyAmountExceedResponse = ApplyAmountExceedResponse;
window.CloseExpenseEntryDetailSuccessModal = CloseExpenseEntryDetailSuccessModal;