import { ExpensesLedgerReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpensesLedgerReportService.js';

/** Must match F_ReportConfiguration.ModuleDescription used by API (GetReportType + procedure lookup). */
const MODULE_DESCRIPTION_FOR_REPORT_CONFIG = 'Expenses Ledger Report';
let G_SubProjectList = [];
/** Full ledger rows after last successful fetch (for paging + stats). */
let G_LedgerData = [];
let G_LedgerCurrentPage = 1;

function pad2(n) {
    return String(n).padStart(2, '0');
}

function initDefaultDates() {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    const first = new Date(y, m, 1);
    const dd = (x) => `${pad2(x.getDate())}/${pad2(x.getMonth() + 1)}/${x.getFullYear()}`;
    $('#txtdateFrom').val(dd(first));
    $('#txtdateTo').val(dd(today));

    $('#txtdateFrom, #txtdateTo').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        todayHighlight: true,
        todayBtn: false,
        orientation: 'bottom auto',
        container: 'body',
        templates: {
            leftArrow: '&laquo;',
            rightArrow: '&raquo;',
        },
    });

    $('#txtdateFrom, #txtdateTo').each(function () {
        const $inp = $(this);
        $inp.on('show', function () {
            setTimeout(function () {
                const dp = $inp.data('datepicker');
                let $p = null;
                if (dp && dp.picker) {
                    $p = $(dp.picker);
                }
                if (!$p || !$p.length) {
                    $p = $('body > .datepicker').not('.datepicker-inline').last();
                }
                if (!$p || !$p.length) return;

                $p.addClass('elr-dp-themed');
                $p.find('.elr-dp-footer').remove();

                const $footer = $(
                    '<div class="elr-dp-footer">' +
                        '<button type="button" class="elr-dp-foot-btn elr-dp-foot-btn--primary elr-dp-today">Today</button>' +
                        '<button type="button" class="elr-dp-foot-btn elr-dp-foot-btn--muted elr-dp-clear">Clear</button>' +
                        '<button type="button" class="elr-dp-foot-btn elr-dp-close">Close</button>' +
                        '</div>'
                );

                $footer.find('.elr-dp-today').on('click', function (ev) {
                    ev.preventDefault();
                    $inp.datepicker('setDate', new Date());
                    $inp.datepicker('hide');
                });
                $footer.find('.elr-dp-clear').on('click', function (ev) {
                    ev.preventDefault();
                    $inp.val('');
                    $inp.datepicker('update', '');
                });
                $footer.find('.elr-dp-close').on('click', function (ev) {
                    ev.preventDefault();
                    $inp.datepicker('hide');
                });

                $p.append($footer);
            }, 0);
        });
    });
}

function convertDateFormat(dateString) {
    const parts = dateString.split('/');
    if (parts.length !== 3) return dateString;
    const [day, month, year] = parts;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthAbbreviation = monthNames[parseInt(month, 10) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}

/** API may return []; { data }; { Data }; { items }; nested from wrapper. */
function asDdLArray(response) {
    if (response == null) return [];
    if (Array.isArray(response)) return response;
    const keys = ['data', 'Data', 'result', 'Result', 'items', 'Items', 'value', 'Value', 'rows', 'Rows', 'records', 'Records'];
    for (let i = 0; i < keys.length; i++) {
        const v = response[keys[i]];
        if (Array.isArray(v)) return v;
    }
    return [];
}

function firstNonEmpty(obj, keys) {
    if (!obj || typeof obj !== 'object') return '';
    for (let i = 0; i < keys.length; i++) {
        const v = obj[keys[i]];
        if (v != null && v !== '') return v;
    }
    return '';
}

function mapDdLEmployees(rows) {
    return rows.map(function (item) {
        const Code = firstNonEmpty(item, [
                'EmployeeMaster_Code',
                'employeeMaster_Code',
                'Emp_Code',
                'emp_Code',
                'EmpCode',
                'Code',
                'code',
                'PersonMaster_Code',
                'personMaster_Code',
            ]);
        const Desp =
            String(
                firstNonEmpty(item, [
                    'PersonName',
                    'personName',
                    'EmployeeName',
                    'employeeName',
                    'EmpName',
                    'Desp',
                    'desp',
                    'Name',
                    'name',
                ])
            ).trim();
        return { Code, Desp: Desp || String(Code || '') };
    });
}

function mapDdLProjects(rows) {
    return rows.map(function (item) {
        const Code = firstNonEmpty(item, ['ProjectMaster_Code', 'projectMaster_Code', 'Code', 'code', 'PROJECT_Code']);
        const Desp =
            String(
                firstNonEmpty(item, [
                    'ProjectName',
                    'projectName',
                    'ProjectDesp',
                    'projectDesp',
                    'ProjectDescription',
                    'projectDescription',
                    'Desp',
                    'desp',
                    'Description',
                    'Name',
                    'name',
                ])
            ).trim();
        return { Code, Desp: Desp || String(Code || '') };
    });
}

function reportTypeDisplay(row) {
    return (
        (row.DisplayName != null ? row.DisplayName : null) ||
        row.displayName ||
        row.FieldValue ||
        row.Desp ||
        ''
    ).toString();
}

function bindSelectList(element, list, firstItem) {
    const $el = $(element);
    $el.empty();
    if (firstItem === 'All') $el.append(new Option('All', '0'));
    list.forEach(function (val) {
        const code = val.Code != null ? String(val.Code) : '';
        let text = val.Desp != null ? String(val.Desp) : '';
        if (!text) text = code || '--';
        $el.append(new Option(text, code));
    });
}

function subProjectDesp(item) {
    return String(
        firstNonEmpty(item, [
            'SubProjectDesp',
            'subProjectDesp',
            'SubProjectName',
            'subProjectName',
            'SubProjDesp',
            'subProjDesp',
            'DesProject',
            'desProject',
            'Desp',
            'desp',
            'Description',
            'description',
            'Name',
            'name',
        ])
    );
}

function subProjectCode(item) {
    return firstNonEmpty(item, ['SubProjectMaster_Code', 'subProjectMaster_Code', 'Code', 'code']);
}

function subProjectParentCode(item) {
    const v = firstNonEmpty(item, [
        'ProjectMaster_Code',
        'projectMaster_Code',
        'MasterProjectCode',
        'MasterProject_Code',
        'Parent_Code',
        'Project_Code',
        'PROJECTMASTER_Code',
    ]);
    if (v === '' || v == null) return 0;
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
}

function simplifySubProjectsForDdL(rows) {
    return rows.map(function (item) {
        let codeVal = subProjectCode(item);
        if (codeVal === '' || codeVal == null)
            codeVal = firstNonEmpty(item, ['SUBPROJECT_Code', 'subProject_Code', 'Sub_Code']);
        const Code = String(codeVal != null && codeVal !== '' ? codeVal : '');
        const Desp = String(subProjectDesp(item)).trim() || Code;
        return { Code, Desp };
    });
}

function refreshSubProjectOptions() {
    const pid = parseInt($('#ddlProject').val() || '0', 10) || 0;
    const items = pid === 0
        ? G_SubProjectList
        : G_SubProjectList.filter((sp) => Number(subProjectParentCode(sp)) === pid);
    const mapped = simplifySubProjectsForDdL(items);
    bindSelectList($('#ddlSubProject')[0], mapped, 'All');
    if ($('#ddlSubProject').data('select2')) $('#ddlSubProject').select2('destroy');
    $('#ddlSubProject').select2({
        width: '100%',
        matcher: function (params, data) {
            if ($.trim(params.term) === '') return data;
            if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) return data;
            return null;
        },
    });
}

function initSelect2(el) {
    $(el).select2({
        width: '100%',
        matcher: function (params, data) {
            if ($.trim(params.term) === '') return data;
            if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) return data;
            return null;
        },
    });
}

function loadDropdowns() {
    const pTypes = ExpensesLedgerReportService.GetReportType(MODULE_DESCRIPTION_FOR_REPORT_CONFIG).then(function (response) {
        const rows = asDdLArray(response);
        const $rt = $('#ddlReportType');
        $rt.empty();
        if (!rows.length) {
            $rt.append($('<option/>').attr('value', '').text('-- No report types --'));
            return;
        }
        rows.forEach(function (row) {
            const label = reportTypeDisplay(row);
            if (!label) return;
            $rt.append($('<option/>').attr('value', label).text(label));
        });
        initSelect2('#ddlReportType');
    });

    const pEmp = ExpensesLedgerReportService.GetEmployeeMasterList().then(function (response) {
        const rows = mapDdLEmployees(asDdLArray(response));
        bindSelectList($('#ddlEmployee')[0], rows, 'All');
        initSelect2('#ddlEmployee');
    });

    const pProj = ExpensesLedgerReportService.GetProjectMasterList().then(function (response) {
        const rows = mapDdLProjects(asDdLArray(response));
        bindSelectList($('#ddlProject')[0], rows, 'All');
        initSelect2('#ddlProject');
    });

    const pSub = ExpensesLedgerReportService.GetSubProjectMasterList().then(function (response) {
        G_SubProjectList = asDdLArray(response);
        refreshSubProjectOptions();
    });

    return Promise.all([pTypes, pEmp, pProj, pSub]).catch(function () {
        toastr.error('Could not load filters.');
    });
}

function formatAmount(v) {
    if (v === null || v === undefined || v === '') return '';
    const n = Number(v);
    if (Number.isNaN(n)) return v;
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseAmountForSum(v) {
    if (v === null || v === undefined || v === '') return 0;
    const n = Number(String(v).replace(/,/g, ''));
    return Number.isNaN(n) ? 0 : n;
}

/** Match API variants: Opening, Closing, Closing balance, etc. */
function ledgerParticularsRowKind(particulars) {
    const s = String(particulars == null ? '' : particulars).trim().toLowerCase();
    if (s === 'opening' || s.startsWith('opening ')) return 'opening';
    if (s === 'closing' || s.startsWith('closing') || s.includes('closing balance')) return 'closing';
    return '';
}

function computeLedgerStats(rows) {
    const data = rows.filter((r) => !(r.Error != null && r.Error !== '') && !(r.error != null && r.error !== ''));
    let sumPay = 0;
    let sumExp = 0;
    let closingBal = null;
    let closingDrCr = '';
    for (let i = 0; i < data.length; i++) {
        const r = data[i];
        const p = String(r.Particulars || '');
        const kind = ledgerParticularsRowKind(p);
        if (kind === 'closing') {
            closingBal = r.Balance;
            closingDrCr = r.DrCr != null ? String(r.DrCr) : '';
        }
        if (kind === 'opening' || kind === 'closing') continue;
        sumPay += parseAmountForSum(r.Payment);
        sumExp += parseAmountForSum(r.Expenses);
    }
    if ((closingBal === null || closingBal === '') && data.length) {
        const last = data[data.length - 1];
        closingBal = last.Balance;
        closingDrCr = last.DrCr != null ? String(last.DrCr) : '';
    }
    return { rows: data.length, sumPay, sumExp, closingBal, closingDrCr };
}

function updateLedgerSummaryChips(rows) {
    if (!rows || !rows.length) {
        $('#elrStatRows').text('—');
        $('#elrStatPayment').text('—');
        $('#elrStatExpense').text('—');
        $('#elrStatClosing').text('—');
        return;
    }
    const s = computeLedgerStats(rows);
    $('#elrStatRows').text(String(s.rows));
    $('#elrStatPayment').text(formatAmount(s.sumPay));
    $('#elrStatExpense').text(formatAmount(s.sumExp));
    const cb =
        s.closingBal != null && s.closingBal !== ''
            ? formatAmount(s.closingBal)
            : '—';
    $('#elrStatClosing').text(s.closingDrCr ? `${cb} ${s.closingDrCr}`.trim() : cb);
}

function ledgerPageSize() {
    const n = parseInt($('#elrPageSize').val() || '10', 10);
    return n > 0 ? n : 10;
}

function ledgerTotalPages() {
    const sz = ledgerPageSize();
    return Math.max(1, Math.ceil(G_LedgerData.length / sz));
}

function updateLedgerPaginatorUi() {
    const total = G_LedgerData.length;
    const sz = ledgerPageSize();
    const totalPg = ledgerTotalPages();
    if (total === 0) {
        $('#elrPaginator').attr('hidden', 'hidden');
        return;
    }
    $('#elrPaginator').removeAttr('hidden');
    const page = Math.min(G_LedgerCurrentPage, totalPg);
    G_LedgerCurrentPage = page;
    const start = total === 0 ? 0 : (page - 1) * sz + 1;
    const end = Math.min(page * sz, total);
    $('#elrPageInfo').text(`${start} – ${end} of ${total}`);
    const atFirst = page <= 1;
    const atLast = page >= totalPg;
    $('#elrBtnFirst').prop('disabled', atFirst);
    $('#elrBtnPrev').prop('disabled', atFirst);
    $('#elrBtnNext').prop('disabled', atLast);
    $('#elrBtnLast').prop('disabled', atLast);
}

function appendLedgerRow($body, row) {
    const p = (row.Particulars || '').toString();
    const tr = $('<tr/>');
    const kind = ledgerParticularsRowKind(p);
    if (kind === 'opening') tr.addClass('row-opening');
    if (kind === 'closing') tr.addClass('row-closing');

    tr.append($('<td/>').text(row['S.No'] != null ? row['S.No'] : ''));
    tr.append($('<td/>').text(row.Date != null ? row.Date : ''));
    tr.append($('<td/>').text(p));

    const pay = formatAmount(row.Payment);
    const exp = formatAmount(row.Expenses);
    const bal = formatAmount(row.Balance);

    tr.append($('<td class="num"/>').text(pay));
    tr.append($('<td class="num"/>').text(exp));
    tr.append($('<td class="num"/>').text(bal));
    tr.append($('<td/>').text(row.DrCr != null ? row.DrCr : ''));
    $body.append(tr);
}

/** Render current page from `G_LedgerData`. */
function renderLedgerPage() {
    const $body = $('#tblLedgerBody');
    $body.empty();
    if (!G_LedgerData.length) {
        updateLedgerPaginatorUi();
        return;
    }
    const sz = ledgerPageSize();
    const totalPg = ledgerTotalPages();
    const page = Math.min(G_LedgerCurrentPage, totalPg);
    G_LedgerCurrentPage = page;
    const start = (page - 1) * sz;
    const slice = G_LedgerData.slice(start, start + sz);
    slice.forEach(function (row) {
        appendLedgerRow($body, row);
    });
    updateLedgerPaginatorUi();
}

function clearLedgerView() {
    G_LedgerData = [];
    G_LedgerCurrentPage = 1;
    $('#tblLedgerBody').empty();
    updateLedgerSummaryChips([]);
    updateLedgerPaginatorUi();
    populateExportTable([]);
}

/** Opens the page that contains the closing row and scrolls it into view. */
function scrollLedgerToClosing() {
    if (!G_LedgerData.length) {
        if (typeof toastr !== 'undefined') toastr.warning('Load the report first.');
        return;
    }
    let idx = -1;
    for (let i = 0; i < G_LedgerData.length; i++) {
        const p = String(G_LedgerData[i].Particulars || '');
        if (ledgerParticularsRowKind(p) === 'closing') {
            idx = i;
            break;
        }
    }
    if (idx < 0) idx = G_LedgerData.length - 1;
    const sz = ledgerPageSize();
    G_LedgerCurrentPage = Math.floor(idx / sz) + 1;
    renderLedgerPage();
    requestAnimationFrame(function () {
        let row = document.querySelector('#tblLedgerBody tr.row-closing');
        if (!row) row = document.querySelector('#tblLedgerBody tr:last-child');
        if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

let printLedgerRestore = null;

function renderLedger(rows) {
    G_LedgerData = rows && rows.length ? rows.slice() : [];
    G_LedgerCurrentPage = 1;
    updateLedgerSummaryChips(G_LedgerData);
    renderLedgerPage();
}


function fetchReport() {
    const reportType = ($('#ddlReportType option:selected').val() || '').trim();
    if (!reportType) {
        toastr.warning('Select report type.');
        return;
    }
    const fromDate = convertDateFormat($('#txtdateFrom').val());
    const toDate = convertDateFormat($('#txtdateTo').val());
    const emp =
        $('#ddlEmployee option:selected').val() === '0' || $('#ddlEmployee option:selected').val() === 'All'
            ? 0
            : parseInt($('#ddlEmployee option:selected').val(), 10) || 0;
    const proj =
        $('#ddlProject option:selected').val() === '0' || $('#ddlProject option:selected').val() === 'All'
            ? 0
            : parseInt($('#ddlProject option:selected').val(), 10) || 0;
    const sub =
        $('#ddlSubProject option:selected').val() === '0' || $('#ddlSubProject option:selected').val() === 'All'
            ? 0
            : parseInt($('#ddlSubProject option:selected').val(), 10) || 0;

    ExpensesLedgerReportService.ExpensesLedgerReport(fromDate, toDate, reportType, emp, proj, sub).then(function (response) {
        if (!response || !response.length) {
            clearLedgerView();
            toastr.error('Record not found.');
            return;
        }
        const err0 = response[0].Error || response[0].error;
        if (err0 != null && err0 !== '') {
            clearLedgerView();
            toastr.error(err0);
            return;
        }
        const clean = response.filter((r) => !r.Error && !r.error);
        renderLedger(clean);
        populateExportTable(clean);
    }).catch(function (err) {
        console.error(err);
        clearLedgerView();
        toastr.error('Failed to load report.');
    });
}

function populateExportTable(data) {
    const $h = $('#tblLedgerExport thead tr');
    const $b = $('#tblLedgerExport tbody');
    $h.empty();
    $b.empty();
    if (!data.length) return;
    const headers = ['S.No', 'Date', 'Particulars', 'Payment', 'Expenses', 'Balance', 'DrCr'];
    headers.forEach((h) => $h.append($('<th/>').text(h)));
    data.forEach(function (item) {
        const tr = $('<tr/>');
        headers.forEach((h) => tr.append($('<td/>').text(item[h] != null ? item[h] : '')));
        $b.append(tr);
    });
}

function exportExcel() {
    const currentDate = new Date();
    const dateString =
        currentDate.getFullYear() +
        '-' +
        (currentDate.getMonth() + 1).toString().padStart(2, '0') +
        '-' +
        currentDate.getDate().toString().padStart(2, '0') +
        '_' +
        currentDate.getHours().toString().padStart(2, '0') +
        '-' +
        currentDate.getMinutes().toString().padStart(2, '0');

    $('#tblLedgerExport').table2excel({
        filename: 'EmployeeExpensesLedger_' + dateString,
        fileext: '.xlsx',
    });
}

$(document).ready(function () {
    $('#ERPHeading').text('Employee Expenses Ledger');
    initDefaultDates();
    loadDropdowns();

    $('#ddlProject').on('change', function () {
        refreshSubProjectOptions();
    });

    $('#fetchReportButton').on('click', fetchReport);
    $('#btnDownload').on('click', exportExcel);
    $('#btnLedgerClosing').on('click', scrollLedgerToClosing);
    $('#btnLedgerClose').on('click', function () {
        clearLedgerView();
    });

    $('#elrPageSize').on('change', function () {
        G_LedgerCurrentPage = 1;
        renderLedgerPage();
    });
    $('#elrBtnFirst').on('click', function () {
        G_LedgerCurrentPage = 1;
        renderLedgerPage();
    });
    $('#elrBtnPrev').on('click', function () {
        G_LedgerCurrentPage = Math.max(1, G_LedgerCurrentPage - 1);
        renderLedgerPage();
    });
    $('#elrBtnNext').on('click', function () {
        G_LedgerCurrentPage = Math.min(ledgerTotalPages(), G_LedgerCurrentPage + 1);
        renderLedgerPage();
    });
    $('#elrBtnLast').on('click', function () {
        G_LedgerCurrentPage = ledgerTotalPages();
        renderLedgerPage();
    });

    window.addEventListener('beforeprint', function () {
        if (!G_LedgerData.length) return;
        printLedgerRestore = {
            page: G_LedgerCurrentPage,
            size: ledgerPageSize(),
        };
        G_LedgerCurrentPage = 1;
        $('#elrPageSize').val(String(Math.max(G_LedgerData.length, 1)));
        renderLedgerPage();
    });
    window.addEventListener('afterprint', function () {
        if (!printLedgerRestore) return;
        $('#elrPageSize').val(String(printLedgerRestore.size));
        G_LedgerCurrentPage = printLedgerRestore.page;
        printLedgerRestore = null;
        renderLedgerPage();
    });

    $('#btnPrint').on('click', function () {
        window.print();
    });
});
