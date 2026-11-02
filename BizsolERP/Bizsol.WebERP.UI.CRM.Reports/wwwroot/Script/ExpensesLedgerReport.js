import { ExpensesLedgerReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpensesLedgerReportService.js';
import { LeadMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_LeadMasterService.js';

/** Must match F_ReportConfiguration.ModuleDescription used by API (GetReportType + procedure lookup). */
const MODULE_DESCRIPTION_FOR_REPORT_CONFIG = 'Expenses Ledger Report';
let G_SubProjectList = [];
/** Full ledger rows after last successful fetch (for paging + stats). */
let G_LedgerData = [];
let G_LedgerCurrentPage = 1;
let G_AllProjects = [];
let G_FiltersReady = false;
const PROJECT_EXPENSE_REPORT = 'project expense report';
const VENDOR_PROJECT_REPORT = 'vendor project wise';
const VENDOR_LEDGER_REPORT = 'vendor ledger report';
const LEDGER_PAGE_SUBTITLE = 'View payments, expenses and running balance for the selected period and filters.';
const VENDOR_PROJECT_SUBTITLE = 'Vendor-wise PO, GRN and payment summary for the selected date range. Click a vendor to open project / sub-project breakdown.';
const PROJECT_LEVELS = [
    { id: 'PROJECTWISE', label: 'Project Wise' },
    { id: 'SUBPROJECTWISE', label: 'Sub Project Wise' },
    { id: 'GROUPWISE', label: 'Expense Category Wise' },
    { id: 'HEADWISE', label: 'Expense Head Wise' },
    { id: 'EMPLOYEEWISE', label: 'Employee Wise' },
    { id: 'DETAIL', label: 'Entry Wise' },
];
let projectDrill = emptyProjectDrill();
let projectRows = [];

function emptyProjectDrill() {
    return {
        level: 'PROJECTWISE',
        projectCode: 0,
        projectName: '',
        subCode: 0,
        subName: '',
        groupCode: 0,
        groupName: '',
        headCode: 0,
        headName: '',
        employeeCode: 0,
        employeeName: '',
    };
}

function isProjectExpenseReport() {
    return String($('#ddlReportType').val() || '').trim().toLowerCase() === PROJECT_EXPENSE_REPORT;
}

function normalizeReportLabel(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function isVendorProjectReport() {
    const label = normalizeReportLabel($('#ddlReportType').val());
    return label === VENDOR_PROJECT_REPORT || label === 'vendor wise';
}

function isVendorLedgerReport() {
    return normalizeReportLabel($('#ddlReportType').val()) === VENDOR_LEDGER_REPORT;
}

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
    else if (firstItem === 'Select') $el.append(new Option('Select', ''));
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

function selectedEmployeeCode() {
    const raw = String($('#ddlEmployee').val() || '').trim();
    const n = parseInt(raw, 10);
    if (!raw || raw === 'All' || Number.isNaN(n) || n <= 0) return 0;
    return n;
}

function rebindFilterSelect($el, rows, firstItem, keepValue) {
    bindSelectList($el[0], rows, firstItem);
    if ($el.data('select2')) $el.select2('destroy');
    initSelect2($el);
    const keep = keepValue == null ? '' : String(keepValue);
    if (keep && $el.find('option[value="' + keep + '"]').length) $el.val(keep);
    else $el.val(firstItem === 'All' ? '0' : '');
}

function reloadLedgerProjectFilters() {
    if (isProjectExpenseReport()) return Promise.resolve();
    const emp = selectedEmployeeCode();
    const keepProject = $('#ddlProject').val();
    const keepSub = $('#ddlSubProject').val();
    const pProj = ExpensesLedgerReportService.GetProjectMasterList(emp).then(function (response) {
        G_AllProjects = mapDdLProjects(asDdLArray(response));
        rebindFilterSelect($('#ddlProject'), G_AllProjects, 'All', keepProject);
    });
    const pSub = ExpensesLedgerReportService.GetSubProjectMasterList(emp).then(function (response) {
        G_SubProjectList = asDdLArray(response);
    });
    return Promise.all([pProj, pSub]).then(function () {
        refreshSubProjectOptions(keepSub);
    }).catch(function () {
        toastr.error('Could not load projects for the selected employee.');
    });
}

function refreshSubProjectOptions(keepValue) {
    const pid = parseInt($('#ddlProject').val() || '0', 10) || 0;
    const keep = keepValue != null ? keepValue : $('#ddlSubProject').val();
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
    const keepCode = keep == null ? '' : String(keep);
    if (keepCode && $('#ddlSubProject option[value="' + keepCode + '"]').length) {
        $('#ddlSubProject').val(keepCode).trigger('change.select2');
    }
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
        rows.forEach(function (row) {
            const label = reportTypeDisplay(row);
            if (!label) return;
            $rt.append($('<option/>').attr('value', label).text(label));
        });
        // let hasVendorProject = false;
        // $rt.find('option').each(function () {
        //     const label = normalizeReportLabel($(this).val());
        //     if (label === VENDOR_PROJECT_REPORT || label === 'vendor wise') hasVendorProject = true;
        // });
        // if (!hasVendorProject) {
        //     $rt.append($('<option/>').attr('value', 'Vendor Project Wise').text('Vendor Project Wise'));
        // }
        if (!$rt.find('option').length) {
            $rt.append($('<option/>').attr('value', '').text('-- No report types --'));
        }
        initSelect2('#ddlReportType');
    });

    const pEmp = ExpensesLedgerReportService.GetNestedMarketingManList().then(function (response) {
        const rows = mapDdLEmployees(asDdLArray(response));
        bindSelectList($('#ddlEmployee')[0], rows, 'Select');
        initSelect2('#ddlEmployee');
    });

    const pProj = ExpensesLedgerReportService.GetProjectMasterList().then(function (response) {
        G_AllProjects = mapDdLProjects(asDdLArray(response));
        bindSelectList($('#ddlProject')[0], G_AllProjects, 'All');
        initSelect2('#ddlProject');
    });

    const pSub = ExpensesLedgerReportService.GetSubProjectMasterList().then(function (response) {
        G_SubProjectList = asDdLArray(response);
        refreshSubProjectOptions();
    });

    return Promise.all([pTypes, pEmp, pProj, pSub]).then(function () {
        G_FiltersReady = true;
        applyReportTypeLayout();
    }).catch(function () {
        toastr.error('Could not load filters.');
    });
}

function formatAmount(v) {
    if (v === null || v === undefined || v === '') return '';
    const n = Number(v);
    if (Number.isNaN(n)) return v;
    return Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseAmountForSum(v) {
    if (v === null || v === undefined || v === '') return 0;
    const n = Number(String(v).replace(/,/g, ''));
    return Number.isNaN(n) ? 0 : n;
}

function selectedFilterProjectText() {
    const v = $('#ddlProject option:selected').val();
    const t = String($('#ddlProject option:selected').text() || '').trim();
    if (!v || v === '0' || v === 'All' || t === 'All') return '';
    return t;
}

function selectedFilterSubProjectText() {
    const v = $('#ddlSubProject option:selected').val();
    const t = String($('#ddlSubProject option:selected').text() || '').trim();
    if (!v || v === '0' || v === 'All' || t === 'All') return '';
    return t;
}

function ledgerRowProjectName(row) {
    const fromRow = String(
        firstNonEmpty(row, [
            'Project',
            'project',
            'ProjectName',
            'projectName',
            'ProjectDesp',
            'projectDesp',
            'ProjectDescription',
            'projectDescription',
        ])
    ).trim();
    if (fromRow) return fromRow;
    const kind = ledgerParticularsRowKind(String(row.Particulars || ''));
    if (kind === 'opening' || kind === 'closing') return selectedFilterProjectText();
    return '';
}

function ledgerRowSubProjectName(row) {
    const fromRow = String(
        firstNonEmpty(row, [
            'SubProject',
            'subProject',
            'SubProjectName',
            'subProjectName',
            'SubProjectDesp',
            'subProjectDesp',
            'Sub Proj',
            'subProj',
        ])
    ).trim();
    if (fromRow) return fromRow;
    const kind = ledgerParticularsRowKind(String(row.Particulars || ''));
    if (kind === 'opening' || kind === 'closing') return selectedFilterSubProjectText();
    return '';
}

/** Match API variants: Opening, Closing, Closing balance, etc. */
function ledgerParticularsRowKind(particulars) {
    const s = String(particulars == null ? '' : particulars).trim().toLowerCase();
    if (s === 'opening' || s.startsWith('opening ')) return 'opening';
    if (s === 'closing' || s.startsWith('closing') || s.includes('closing balance')) return 'closing';
    return '';
}

function vendorLedgerKind(row) {
    const rowType = String(firstNonEmpty(row, ['RowType', 'rowType']) || '').trim().toLowerCase();
    if (rowType) return rowType;
    return ledgerParticularsRowKind(String(row.Particulars || row.Desp || ''));
}

function vendorSideAmount(row, side) {
    const keys = side === 'dr' ? ['Dr', 'dr', 'DR'] : ['CR', 'Cr', 'cr'];
    return firstNonEmpty(row, keys);
}

function applyLedgerTableHeaders() {
    const $tr = $('#tblLedger thead tr');
    if (!$tr.length) return;
    $tr.empty();
    const cols = isVendorLedgerReport()
        ? [
            { t: 'Date', w: '7.5rem' },
            { t: 'Desp' },
            { t: 'Project' },
            { t: 'Sub project' },
            { t: 'Dr', num: true },
            { t: 'CR', num: true },
            { t: 'Balance', num: true },
            { t: 'Dr/Cr', w: '3.5rem' },
        ]
        : [
            { t: 'S.No', w: '3rem' },
            { t: 'Date', w: '7rem' },
            { t: 'Particulars' },
            { t: 'Project' },
            { t: 'Sub project' },
            { t: 'Payment', num: true },
            { t: 'Expenses', num: true },
            { t: 'Balance', num: true },
            { t: 'Dr/Cr', w: '3.5rem' },
        ];
    cols.forEach(function (c) {
        const th = $('<th/>').text(c.t);
        if (c.w) th.css('width', c.w);
        if (c.num) th.addClass('num');
        $tr.append(th);
    });
}

function computeVendorLedgerStats(rows) {
    const data = rows.filter((r) => !(r.Error != null && r.Error !== '') && !(r.error != null && r.error !== ''));
    let sumPay = 0;
    let sumExp = 0;
    let closingBal = null;
    let closingDrCr = '';
    data.forEach(function (r) {
        const kind = vendorLedgerKind(r);
        if (kind === 'closing') {
            const bal = firstNonEmpty(r, ['Balance', 'balance']);
            const side = String(firstNonEmpty(r, ['DrCr', 'drCr', 'DRCR']) || '').trim();
            if (bal !== '' && bal != null) {
                closingBal = bal;
                closingDrCr = side;
            } else {
                const dr = parseAmountForSum(vendorSideAmount(r, 'dr'));
                const cr = parseAmountForSum(vendorSideAmount(r, 'cr'));
                if (cr > 0) {
                    closingBal = cr;
                    closingDrCr = 'Cr';
                } else if (dr > 0) {
                    closingBal = dr;
                    closingDrCr = 'Dr';
                }
            }
            return;
        }
        if (kind === 'opening' || kind === 'total') return;
        sumPay += parseAmountForSum(vendorSideAmount(r, 'dr'));
        sumExp += parseAmountForSum(vendorSideAmount(r, 'cr'));
    });
    return { rows: data.length, sumPay, sumExp, closingBal, closingDrCr };
}

function computeLedgerStats(rows) {
    if (isVendorLedgerReport()) return computeVendorLedgerStats(rows);
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
    $('#elrPageInfo').text(total === 0 ? '0 of 0' : `${start} to ${end} of ${total}`);
    const atFirst = page <= 1;
    const atLast = page >= totalPg;
    $('#elrBtnFirst').prop('disabled', atFirst);
    $('#elrBtnPrev').prop('disabled', atFirst);
    $('#elrBtnNext').prop('disabled', atLast);
    $('#elrBtnLast').prop('disabled', atLast);
}

function appendVendorLedgerRow($body, row) {
    const kind = vendorLedgerKind(row);
    const particulars = String(row.Particulars || row.Desp || '');
    const tr = $('<tr/>');
    if (kind === 'opening') tr.addClass('row-opening');
    if (kind === 'closing') tr.addClass('row-closing');
    if (kind === 'total') tr.addClass('row-total');

    const desp = kind === 'total' || kind === 'closing'
        ? ''
        : String(row.Desp != null && String(row.Desp) !== '' ? row.Desp : particulars);
    let project = '';
    let sub = '';
    if (kind === 'closing') sub = 'Closing';
    else if (kind !== 'total') {
        project = ledgerRowProjectName(row);
        sub = ledgerRowSubProjectName(row);
    }

    tr.append($('<td/>').text(row.Date != null ? row.Date : ''));
    tr.append($('<td/>').text(desp));
    tr.append($('<td/>').text(project));
    tr.append($('<td/>').text(sub));
    tr.append($('<td class="num"/>').text(formatAmount(vendorSideAmount(row, 'dr'))));
    tr.append($('<td class="num"/>').text(formatAmount(vendorSideAmount(row, 'cr'))));
    tr.append($('<td class="num"/>').text(kind === 'total' ? '' : formatAmount(firstNonEmpty(row, ['Balance', 'balance']))));
    tr.append($('<td/>').text(kind === 'total' ? '' : String(firstNonEmpty(row, ['DrCr', 'drCr', 'DRCR']) || '')));
    $body.append(tr);
}

function appendLedgerRow($body, row) {
    if (isVendorLedgerReport()) {
        appendVendorLedgerRow($body, row);
        return;
    }
    const p = (row.Particulars || '').toString();
    const tr = $('<tr/>');
    const kind = ledgerParticularsRowKind(p);
    if (kind === 'opening') tr.addClass('row-opening');
    if (kind === 'closing') tr.addClass('row-closing');

    tr.append($('<td/>').text(row['S.No'] != null ? row['S.No'] : ''));
    tr.append($('<td/>').text(row.Date != null ? row.Date : ''));
    tr.append($('<td/>').text(p));
    tr.append($('<td/>').text(ledgerRowProjectName(row)));
    tr.append($('<td/>').text(ledgerRowSubProjectName(row)));

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


function projectLevelIndex(id) {
    for (let i = 0; i < PROJECT_LEVELS.length; i++) {
        if (PROJECT_LEVELS[i].id === id) return i;
    }
    return 0;
}

function selectedProjectFilterCode() {
    const v = $('#ddlProject').val();
    if (!v || v === '0' || v === 'All') return 0;
    return parseInt(v, 10) || 0;
}

function selectedSubProjectFilterCode() {
    const v = $('#ddlSubProject').val();
    if (!v || v === '0' || v === 'All') return 0;
    return parseInt(v, 10) || 0;
}

function escHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function showProjectPlaceholder(message) {
    projectRows = [];
    $('#tblProjectExpenseBody').html('<tr><td colspan="2" class="elr-drill-empty">' + escHtml(message) + '</td></tr>');
    $('#tblProjectExpenseFoot').empty();
}

function renderProjectCrumb() {
    const idx = projectLevelIndex(projectDrill.level);
    let html = '';
    for (let i = 0; i <= idx; i++) {
        if (i > 0) html += '<span class="elr-crumb-sep">→</span>';
        const current = i === idx ? ' is-current' : '';
        html += '<button type="button" class="elr-crumb-btn' + current + '" data-level="'
            + PROJECT_LEVELS[i].id + '">' + escHtml(PROJECT_LEVELS[i].label) + '</button>';
    }
    $('#elrCrumb').html(html);
    const parts = [];
    if (idx >= 1 && projectDrill.projectName) parts.push(projectDrill.projectName);
    if (idx >= 2 && projectDrill.subName) parts.push(projectDrill.subName);
    if (idx >= 3 && projectDrill.groupName) parts.push(projectDrill.groupName);
    if (idx >= 4 && projectDrill.headName) parts.push(projectDrill.headName);
    if (idx >= 5 && projectDrill.employeeName) parts.push(projectDrill.employeeName);
    if (!parts.length) {
        $('#elrLevelSub').empty();
        return;
    }
    let pills = '';
    for (let i = 0; i < parts.length; i++) {
        if (i > 0) pills += '<span class="elr-crumb-sep">→</span>';
        const current = i === parts.length - 1 ? ' is-current' : '';
        pills += '<span class="elr-crumb-btn' + current + '">' + escHtml(parts[i]) + '</span>';
    }
    $('#elrLevelSub').html(pills);
}

function goToProjectLevel(levelId) {
    const idx = projectLevelIndex(levelId);
    if (idx < 1) {
        projectDrill.projectCode = 0;
        projectDrill.projectName = '';
    }
    if (idx < 2) {
        projectDrill.subCode = 0;
        projectDrill.subName = '';
    }
    if (idx < 3) {
        projectDrill.groupCode = 0;
        projectDrill.groupName = '';
    }
    if (idx < 4) {
        projectDrill.headCode = 0;
        projectDrill.headName = '';
    }
    if (idx < 5) {
        projectDrill.employeeCode = 0;
        projectDrill.employeeName = '';
    }
    projectDrill.level = PROJECT_LEVELS[idx].id;
    renderProjectCrumb();
    loadProjectExpenseReport();
}

function openNextProjectLevel(row) {
    if (!row || projectDrill.level === 'DETAIL') return;
    const key = row.RowKey == null ? '' : String(row.RowKey);
    const name = row.Particular == null ? '' : String(row.Particular);
    const code = parseInt(key, 10) || 0;
    if (projectDrill.level === 'PROJECTWISE') {
        projectDrill.projectCode = code;
        projectDrill.projectName = name;
        goToProjectLevel('SUBPROJECTWISE');
        return;
    }
    if (projectDrill.level === 'SUBPROJECTWISE') {
        projectDrill.subCode = code;
        projectDrill.subName = name;
        goToProjectLevel('GROUPWISE');
        return;
    }
    if (projectDrill.level === 'GROUPWISE') {
        projectDrill.groupCode = code;
        projectDrill.groupName = name;
        goToProjectLevel('HEADWISE');
        return;
    }
    if (projectDrill.level === 'HEADWISE') {
        projectDrill.headCode = code;
        projectDrill.headName = name;
        goToProjectLevel('EMPLOYEEWISE');
        return;
    }
    if (projectDrill.level === 'EMPLOYEEWISE') {
        projectDrill.employeeCode = code;
        projectDrill.employeeName = name;
        goToProjectLevel('DETAIL');
    }
}

function normalizeProjectRows(data) {
    const list = Array.isArray(data) ? data
        : (Array.isArray(data && data.data) ? data.data
        : (Array.isArray(data && data.Data) ? data.Data : []));
    return list.map(function (r) {
        return {
            RowKey: firstNonEmpty(r, ['RowKey', 'rowKey']),
            Particular: firstNonEmpty(r, ['Particular', 'particular']),
            ExpenseAmount: parseAmountForSum(firstNonEmpty(r, ['ExpenseAmount', 'expenseAmount'])),
            ParentName: firstNonEmpty(r, ['ParentName', 'parentName']),
            Error: firstNonEmpty(r, ['Error', 'error']),
        };
    });
}

function renderProjectRows(rows) {
    projectRows = rows || [];
    if (!projectRows.length) {
        $('#tblProjectExpenseBody').html('<tr><td colspan="2" class="elr-drill-empty">No records for this level.</td></tr>');
        $('#tblProjectExpenseFoot').html('<tr><td>Total</td><td class="num">0.00</td></tr>');
        return;
    }
    let total = 0;
    const canDrill = projectDrill.level !== 'DETAIL';
    let html = '';
    projectRows.forEach(function (row) {
        total += row.ExpenseAmount;
        const cls = canDrill ? ' class="elr-row-link"' : '';
        html += '<tr' + cls + '><td class="elr-drill-particular">' + escHtml(row.Particular) + '</td>'
            + '<td class="num">' + formatAmount(row.ExpenseAmount) + '</td></tr>';
    });
    $('#tblProjectExpenseBody').html(html);
    $('#tblProjectExpenseBody tr.elr-row-link').each(function (i) {
        $(this).data('row', projectRows[i]);
    });
    $('#tblProjectExpenseFoot').html(
        '<tr><td>Total</td><td class="num">' + formatAmount(total) + '</td></tr>'
    );
}

function loadProjectExpenseReport() {
    const payload = {
        Mode: projectDrill.level,
        ReportStatus: $('#ddlElrStatus').val() || 'Pending',
        FilterProjectMaster_Code: selectedProjectFilterCode(),
        FilterSubProjectMaster_Code: selectedSubProjectFilterCode(),
        ProjectMaster_Code: projectDrill.projectCode || 0,
        SubProjectMaster_Code: projectDrill.subCode || 0,
        ExpenseGroupMaster_Code: projectDrill.groupCode || 0,
        ExpenseHeadMaster_Code: projectDrill.headCode || 0,
        MarketingManMaster_Code: projectDrill.employeeCode || 0,
        ProjectName: projectDrill.projectName || '',
        SubProjectName: projectDrill.subName || '',
        GroupName: projectDrill.groupName || '',
        HeadName: projectDrill.headName || '',
        EmployeeName: projectDrill.employeeName || '',
    };
    $('#tblProjectExpenseBody').html('<tr><td colspan="2" class="elr-drill-empty">Loading…</td></tr>');
    $('#tblProjectExpenseFoot').empty();
    if (typeof Showloader === 'function') Showloader();
    ExpensesLedgerReportService.GetProjectExpenseReport(payload).then(function (data) {
        const rows = normalizeProjectRows(data);
        const err = rows.length && rows[0].Error ? rows[0].Error : '';
        if (err) {
            showProjectPlaceholder(err);
            toastr.error(err);
            return;
        }
        renderProjectRows(rows);
    }).catch(function () {
        showProjectPlaceholder('Could not load the project expense report.');
        toastr.error('Could not load the project expense report.');
    }).then(function () {
        if (typeof HideLoader === 'function') HideLoader();
    });
}

function loadProjectExpenseProjects() {
    ExpensesLedgerReportService.GetProjectExpenseReport({
        Mode: 'GETPROJECTS',
        ReportStatus: $('#ddlElrStatus').val() || 'Pending',
    }).then(function (data) {
        if (!isProjectExpenseReport()) return;
        const rows = normalizeProjectRows(data).map(function (p) {
            return { Code: String(p.RowKey || '').trim(), Desp: String(p.Particular || '').trim() };
        }).filter(function (p) { return p.Code && p.Code !== '0' && p.Desp; });
        const current = $('#ddlProject').val();
        bindSelectList($('#ddlProject')[0], rows, 'All');
        if ($('#ddlProject').data('select2')) $('#ddlProject').select2('destroy');
        initSelect2('#ddlProject');
        if (current && $('#ddlProject option[value="' + current + '"]').length) $('#ddlProject').val(current).trigger('change.select2');
        else $('#ddlProject').val('0').trigger('change.select2');
        refreshSubProjectOptions();
    }).catch(function () { });
}

function restoreLedgerProjects() {
    bindSelectList($('#ddlProject')[0], G_AllProjects, 'All');
    if ($('#ddlProject').data('select2')) $('#ddlProject').select2('destroy');
    initSelect2('#ddlProject');
    refreshSubProjectOptions();
}

function applyReportTypeLayout() {
    const projectMode = isProjectExpenseReport();
    const vendorMode = !projectMode && isVendorProjectReport();
    const vendorLedger = !projectMode && !vendorMode && isVendorLedgerReport();
    $('.elr-page')
        .toggleClass('is-project-expense', projectMode)
        .toggleClass('is-vendor-project', vendorMode)
        .toggleClass('is-vendor-ledger', vendorLedger);
    applyLedgerTableHeaders();
    $('#elrPageSubtitle').text(vendorMode ? VENDOR_PROJECT_SUBTITLE : LEDGER_PAGE_SUBTITLE);
    /* Report type change only resets the grids. Rows load when Show is clicked. */
    clearLedgerView();
    projectRows = [];
    projectDrill = emptyProjectDrill();
    G_VendorProjectDrill = resetVendorProjectDrill();
    if (vendorMode) {
        showVendorPlaceholder('Click Show to load the report.');
        ensureVendorNameDropdown('0');
        loadVendorNameOptions();
        return;
    }
    clearVendorProjectView();
    if (vendorLedger) {
        ensureVendorNameDropdown($('#ddlVendorName').val() || '0');
        loadVendorNameOptions();
        restoreLedgerProjects();
        return;
    }
    if (projectMode) {
        renderProjectCrumb();
        showProjectPlaceholder('Click Show to load the report.');
        loadProjectExpenseProjects();
        return;
    }
    restoreLedgerProjects();
}

function exportProjectExcel() {
    if (!projectRows.length) {
        toastr.warning('Load the report first.');
        return;
    }
    const $h = $('#tblLedgerExport thead tr');
    const $b = $('#tblLedgerExport tbody');
    $h.empty();
    $b.empty();
    $h.append($('<th/>').text('Particular'));
    $h.append($('<th/>').text('Expense amount'));
    let total = 0;
    projectRows.forEach(function (row) {
        total += row.ExpenseAmount;
        const tr = $('<tr/>');
        tr.append($('<td/>').text(row.Particular));
        tr.append($('<td/>').text(formatAmount(row.ExpenseAmount)));
        $b.append(tr);
    });
    const foot = $('<tr/>');
    foot.append($('<td/>').text('Total'));
    foot.append($('<td/>').text(formatAmount(total)));
    $b.append(foot);
    const currentDate = new Date();
    const dateString =
        currentDate.getFullYear() + '-' +
        (currentDate.getMonth() + 1).toString().padStart(2, '0') + '-' +
        currentDate.getDate().toString().padStart(2, '0') + '_' +
        currentDate.getHours().toString().padStart(2, '0') + '-' +
        currentDate.getMinutes().toString().padStart(2, '0');
    const level = (PROJECT_LEVELS[projectLevelIndex(projectDrill.level)].label || 'Project').replace(/\s+/g, '');
    $('#tblLedgerExport').table2excel({
        filename: 'ProjectExpenseReport_' + level + '_' + dateString,
        fileext: '.xlsx',
    });
}

const VENDOR_PROJECT_DRILL_LEVELS = [
    { key: 'vendor', title: 'Vendor wise', next: 'project' },
    { key: 'project', title: 'Project / Sub project wise', next: null },
];
const VENDOR_PROJECT_VENDOR_METRICS = [
    { id: 'poAmountWithGst', label: 'PO Amount With Gst', keys: ['POAmountWithGST', 'poAmountWithGST', 'POAmountWithGst'] },
    { id: 'totalGrnAmount', label: 'Total GRN Amount', keys: ['TotalGRNAmount', 'totalGRNAmount', 'TotalGrnAmount'] },
    { id: 'tdsDeposit', label: 'TDS Deposit', keys: ['TDSDeposit', 'tdsDeposit', 'TDS_Deposit'] },
    { id: 'netPay', label: 'NetPay', keys: ['NetPay', 'netPay'] },
    { id: 'payment', label: 'Payment', keys: ['PaymentAmount', 'paymentAmount', 'Payment', 'payment'] },
];
const VENDOR_PROJECT_PROJECT_METRICS = [
    { id: 'poTaxableAmount', label: 'PO Taxable Amount', keys: ['POTaxableAmount', 'poTaxableAmount', 'POTaxableAmt'] },
    { id: 'gstAmount', label: 'GST Amount', keys: ['GSTAmount', 'gstAmount', 'GST'] },
    { id: 'totalPoAmount', label: 'Total PO Amount', keys: ['TotalPOAmount', 'totalPOAmount', 'TotalPoAmount'] },
    { id: 'totalBillGrnAmount', label: 'Total Bill Grn Amount', keys: ['TotalBillGRNAmount', 'totalBillGRNAmount', 'TotalGRNAmount', 'TotalBillAmount'] },
    { id: 'tdsDeposit', label: 'TDS Deposit', keys: ['TDSDeposit', 'tdsDeposit', 'TDS_Deposit'] },
    { id: 'netPay', label: 'NetPay', keys: ['NetPay', 'netPay'] },
    { id: 'totalPayment', label: 'Total Payment', keys: ['TotalPaymentAmount', 'totalPaymentAmount', 'TotalPayment', 'PaymentAmount', 'paymentAmount'] },
];
const VENDOR_PROJECT_BALANCE_KEYS = {
    vendor: {
        dr: ['BalanceDR', 'balanceDR', 'BalanceDr'],
        cr: ['BalanceCR', 'balanceCR', 'BalanceCr'],
    },
    project: {
        dr: ['BalanceDR', 'balanceDR', 'BalanceDr'],
        cr: ['BalanceCR', 'balanceCR', 'BalanceCr'],
    },
};
let G_VendorProjectRows = [];
let G_VendorProjectDrill = resetVendorProjectDrill();
let G_VendorNameOptions = [];
let G_VendorColFilter = {};
let G_VendorColSort = null;

function resetVendorProjectDrill() {
    return { level: 'vendor', vendorCode: 0, vendorName: '' };
}

function vendorProjectLevel(key) {
    for (let i = 0; i < VENDOR_PROJECT_DRILL_LEVELS.length; i++) {
        if (VENDOR_PROJECT_DRILL_LEVELS[i].key === key) return VENDOR_PROJECT_DRILL_LEVELS[i];
    }
    return VENDOR_PROJECT_DRILL_LEVELS[0];
}

function vendorProjectValue(row, keys) {
    return firstNonEmpty(row, keys);
}

function vendorProjectCode(row, keys) {
    const n = parseInt(vendorProjectValue(row, keys), 10);
    return Number.isNaN(n) ? 0 : n;
}

function vendorProjectMetricValue(row, metricDef) {
    return parseAmountForSum(vendorProjectValue(row, metricDef.keys));
}

function vendorProjectSignedBalance(lines, levelKey) {
    const keys = VENDOR_PROJECT_BALANCE_KEYS[levelKey] || VENDOR_PROJECT_BALANCE_KEYS.vendor;
    let dr = 0;
    let cr = 0;
    lines.forEach(function (row) {
        dr += parseAmountForSum(vendorProjectValue(row, keys.dr));
        cr += parseAmountForSum(vendorProjectValue(row, keys.cr));
    });
    return dr - cr;
}

function vendorApiDate(dateString) {
    const parts = String(dateString || '').trim().split('/');
    if (parts.length !== 3) return '';
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
    return year + '-' + month + '-' + day;
}

function vendorBalanceCell(amount) {
    const n = parseAmountForSum(amount);
    const cls = n < 0 ? 'num elr-balance-negative' : 'num';
    return '<td class="' + cls + '">' + escHtml(formatAmount(Math.abs(n))) + '</td>';
}

function vendorBalanceSides(lines, levelKey) {
    const keys = VENDOR_PROJECT_BALANCE_KEYS[levelKey] || VENDOR_PROJECT_BALANCE_KEYS.vendor;
    let dr = 0;
    let cr = 0;
    (lines || []).forEach(function (row) {
        dr += parseAmountForSum(vendorProjectValue(row, keys.dr));
        cr += parseAmountForSum(vendorProjectValue(row, keys.cr));
    });
    return { dr: dr, cr: cr };
}

function vendorDrCrLabel(lines, levelKey) {
    const sides = vendorBalanceSides(lines, levelKey);
    if (sides.dr > sides.cr) return 'Dr';
    if (sides.cr > sides.dr) return 'Cr';
    return '';
}

function vendorDrCrCell(lines, levelKey) {
    return '<td class="elr-drcr">' + escHtml(vendorDrCrLabel(lines, levelKey)) + '</td>';
}

function showVendorPlaceholder(message) {
    $('#elrVendorCrumb').empty();
    $('#tblVendorProjectHead').html('<tr><th>Vendor Project Wise</th></tr>');
    $('#tblVendorProjectBody').html('<tr><td class="elr-drill-empty">' + escHtml(message) + '</td></tr>');
}

function clearVendorProjectView() {
    G_VendorProjectRows = [];
    G_VendorProjectDrill = resetVendorProjectDrill();
    showVendorPlaceholder('Click Show to load the report.');
}

function renderVendorCrumb() {
    if (G_VendorProjectDrill.level === 'vendor') {
        $('#elrVendorCrumb').empty();
        return;
    }
    const name = G_VendorProjectDrill.vendorName || 'Project / Sub project';
    $('#elrVendorCrumb').html(
        '<button type="button" class="elr-crumb-btn" data-vw-level="vendor">Vendor wise</button>' +
        '<span class="elr-crumb-sep">→</span>' +
        '<span class="elr-crumb-btn is-current">' + escHtml(name) + '</span>'
    );
}

function vendorProjectHeaders(level) {
    if (level === 'project') {
        return ['S.No', 'Project', 'Sub project'].concat(VENDOR_PROJECT_PROJECT_METRICS.map(function (m) { return m.label; }), ['Balance', 'Dr/Cr']);
    }
    return ['S.No', 'Vendor name'].concat(VENDOR_PROJECT_VENDOR_METRICS.map(function (m) { return m.label; }), ['Balance', 'Dr/Cr']);
}

function selectedVendorMasterCode() {
    const raw = String($('#ddlVendorName').val() || '').trim();
    if (!raw || raw === '0' || raw === 'All') return 0;
    return parseInt(raw, 10) || 0;
}

function ensureVendorNameDropdown(keepValue) {
    const $el = $('#ddlVendorName');
    if (!$el.length) return;
    const keep = keepValue != null ? String(keepValue) : String($el.val() || '0');
    bindSelectList($el[0], G_VendorNameOptions, isVendorLedgerReport() ? 'Select' : 'All');
    if ($el.data('select2')) $el.select2('destroy');
    initSelect2($el);
    if (keep && $el.find('option[value="' + keep.replace(/"/g, '\\"') + '"]').length) {
        $el.val(keep).trigger('change.select2');
    } else {
        $el.val('0').trigger('change.select2');
    }
}

function loadVendorNameOptions() {
    const fromDate = vendorApiDate($('#txtdateFrom').val());
    const toDate = vendorApiDate($('#txtdateTo').val());
    if (!fromDate || !toDate) {
        ensureVendorNameDropdown('0');
        return;
    }
    ExpensesLedgerReportService.GetVendorWiseReport(fromDate, toDate, 0).then(function (response) {
        if (!isVendorProjectReport() && !isVendorLedgerReport()) return;
        const rows = asDdLArray(response).filter(function (row) { return row && !row.Error && !row.error; });
        rememberVendorOptions(rows, true);
    }).catch(function () {
        ensureVendorNameDropdown($('#ddlVendorName').val() || '0');
    });
}

function rememberVendorOptions(rows, replaceList) {
    const map = new Map();
    if (!replaceList) {
        G_VendorNameOptions.forEach(function (opt) {
            map.set(String(opt.Code), opt);
        });
    }
    rows.forEach(function (row) {
        const code = vendorProjectCode(row, ['VendorMaster_Code', 'vendorMaster_Code']);
        const name = String(vendorProjectValue(row, ['VendorName', 'vendorName']) || '').trim();
        if (!code || !name) return;
        map.set(String(code), { Code: String(code), Desp: name });
    });
    G_VendorNameOptions = Array.from(map.values()).sort(function (a, b) {
        return String(a.Desp).localeCompare(String(b.Desp), undefined, { sensitivity: 'base' });
    });
    ensureVendorNameDropdown($('#ddlVendorName').val());
}

function resetVendorColumnFilters() {
    G_VendorColFilter = {};
    G_VendorColSort = null;
}

function vendorFilterDomId(column) {
    return 'vw-' + String(column || '').replace(/\s+/g, '');
}

function vendorGroupColumnText(group, column) {
    return column === 'Sub project' ? (group.subName || '') : (group.projectName || '');
}

function applyVendorColumnView(groups) {
    let list = groups.slice();
    Object.keys(G_VendorColFilter).forEach(function (column) {
        const selected = G_VendorColFilter[column];
        if (!selected || !selected.length) return;
        list = list.filter(function (group) {
            return selected.indexOf(vendorGroupColumnText(group, column)) >= 0;
        });
    });
    if (G_VendorColSort && G_VendorColSort.column) {
        const column = G_VendorColSort.column;
        const dir = G_VendorColSort.order === 'desc' ? -1 : 1;
        list.sort(function (a, b) {
            return dir * String(vendorGroupColumnText(a, column)).localeCompare(
                String(vendorGroupColumnText(b, column)),
                undefined,
                { sensitivity: 'base' }
            );
        });
    }
    return list;
}

function vendorFilterHeader(label) {
    const id = vendorFilterDomId(label);
    const active = G_VendorColFilter[label] && G_VendorColFilter[label].length;
    const filterIcon = active ? '<i class="fa-solid fa-filter" style="color:#fff;margin-left:5px;"></i>' : '';
    return (
        '<th class="elr-vw-filter-th">' +
            '<div class="filter-table-heading-div">' +
                '<span class="filter-table-heading">' + escHtml(label) + filterIcon + '</span>' +
                '<span class="table-filter-arrow">' +
                    '<i class="fa-solid fa-angle-down elr-vw-open" data-col="' + escHtml(label) + '" style="cursor:pointer;"></i>' +
                '</span>' +
                '<div class="filter-division" id="filterDropdown-' + id + '" style="display:none;">' +
                    '<div class="dropdown-content">' +
                        '<div class="dropdown-item elr-vw-sort" data-col="' + escHtml(label) + '" data-order="asc">' +
                            '<i class="fa-solid fa-arrow-up-a-z sort-indicator sort-indicator-color"></i> Ascending' +
                        '</div>' +
                        '<div class="dropdown-item elr-vw-sort" data-col="' + escHtml(label) + '" data-order="desc">' +
                            '<i class="fa-solid fa-arrow-down-z-a sort-indicator sort-indicator-color"></i> Descending' +
                        '</div>' +
                        '<div class="dropdown-item fafilter elr-vw-filter" data-col="' + escHtml(label) + '">' +
                            '<i class="fa-solid fa-filter sort-indicator-color"></i> Filter...' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="filter-dropdown" id="filter-' + id + '" style="display:none;">' +
                '<input type="text" placeholder="Search..." class="filter-input form-control form-control-sm" data-column="' + escHtml(label) + '" />' +
                '<div class="checkbox-container" id="checkbox-container-' + id + '"></div>' +
                '<hr>' +
                '<button type="button" class="btn btn-success btn-height elr-vw-apply" data-col="' + escHtml(label) + '">Apply</button>' +
                '<button type="button" class="btn btn-success btn-height elr-vw-clear" data-col="' + escHtml(label) + '">Clear</button>' +
            '</div>' +
        '</th>'
    );
}

function filterVendorProjectRows() {
    let rows = G_VendorProjectRows.slice();
    if (G_VendorProjectDrill.level !== 'project') return rows;
    if (G_VendorProjectDrill.vendorCode > 0) {
        return rows.filter(function (row) {
            return vendorProjectCode(row, ['VendorMaster_Code', 'vendorMaster_Code']) === G_VendorProjectDrill.vendorCode;
        });
    }
    if (G_VendorProjectDrill.vendorName) {
        const want = G_VendorProjectDrill.vendorName.toLowerCase();
        return rows.filter(function (row) {
            return String(vendorProjectValue(row, ['VendorName', 'vendorName']) || '').trim().toLowerCase() === want;
        });
    }
    return rows;
}

function groupVendorProjectRows(rows, level) {
    const map = new Map();
    const metricDefs = level === 'vendor' ? VENDOR_PROJECT_VENDOR_METRICS : VENDOR_PROJECT_PROJECT_METRICS;
    rows.forEach(function (row) {
        const vendorCode = vendorProjectCode(row, ['VendorMaster_Code', 'vendorMaster_Code']);
        const vendorName = String(vendorProjectValue(row, ['VendorName', 'vendorName']) || '(No Vendor)').trim() || '(No Vendor)';
        const projectCode = vendorProjectCode(row, ['ProjectMaster_Code', 'projectMaster_Code']);
        const projectName = String(vendorProjectValue(row, ['ProjectName', 'projectName']) || '(No Project)').trim() || '(No Project)';
        const subCode = vendorProjectCode(row, ['SubProjectMaster_Code', 'subProjectMaster_Code']);
        const subName = String(vendorProjectValue(row, ['SubProjectDesp', 'subProjectDesp', 'SubProjectName', 'ProjectLocation']) || '(No Sub Project)').trim() || '(No Sub Project)';
        const key = level === 'vendor'
            ? String(vendorCode || 0) + '|' + vendorName.toLowerCase()
            : String(projectCode || 0) + '|' + String(subCode || 0) + '|' + projectName.toLowerCase() + '|' + subName.toLowerCase();
        if (!map.has(key)) {
            map.set(key, {
                vendorCode: vendorCode,
                vendorName: vendorName,
                projectName: projectName,
                subName: subName,
                lines: [],
            });
        }
        map.get(key).lines.push(row);
    });
    const groups = Array.from(map.values()).map(function (group) {
        const agg = {};
        metricDefs.forEach(function (metric) {
            let total = 0;
            group.lines.forEach(function (line) {
                total += vendorProjectMetricValue(line, metric);
            });
            agg[metric.id] = total;
        });
        agg.signedBalance = vendorProjectSignedBalance(group.lines, level);
        return Object.assign(group, agg);
    });
    groups.sort(function (a, b) {
        const left = level === 'vendor' ? a.vendorName : (a.projectName + ' ' + a.subName);
        const right = level === 'vendor' ? b.vendorName : (b.projectName + ' ' + b.subName);
        return String(left).localeCompare(String(right), undefined, { sensitivity: 'base' });
    });
    return groups;
}

function renderVendorProjectLevel() {
    const level = G_VendorProjectDrill.level;
    const metricDefs = level === 'vendor' ? VENDOR_PROJECT_VENDOR_METRICS : VENDOR_PROJECT_PROJECT_METRICS;
    const rows = filterVendorProjectRows();
    let groups = groupVendorProjectRows(rows, level);
    if (level === 'project') groups = applyVendorColumnView(groups);
    const headers = vendorProjectHeaders(level);
    const canDrill = !!vendorProjectLevel(level).next;
    renderVendorCrumb();
    if (typeof closeAllFilters === 'function') closeAllFilters();
    $('#tblVendorProjectHead').html(
        '<tr>' + headers.map(function (header, index) {
            if (level === 'project' && (header === 'Project' || header === 'Sub project')) {
                return vendorFilterHeader(header);
            }
            if (header === 'Dr/Cr') return '<th class="elr-drcr">Dr/Cr</th>';
            const cls = index === 0 ? '' : (index < (level === 'project' ? 3 : 2) ? '' : ' class="num"');
            return '<th' + cls + '>' + escHtml(header) + '</th>';
        }).join('') + '</tr>'
    );
    if (!groups.length) {
        $('#tblVendorProjectBody').html('<tr><td colspan="' + headers.length + '" class="elr-drill-empty">No records found.</td></tr>');
        return;
    }
    let html = '';
    groups.forEach(function (group, index) {
        const link = canDrill
            ? '<a href="#" class="elr-vendor-link">' + escHtml(group.vendorName) + '</a>'
            : escHtml(group.projectName);
        let cells = '<td>' + (index + 1) + '</td><td>' + link + '</td>';
        if (level === 'project') cells += '<td>' + escHtml(group.subName) + '</td>';
        metricDefs.forEach(function (metric) {
            cells += '<td class="num">' + escHtml(formatAmount(group[metric.id])) + '</td>';
        });
        cells += vendorBalanceCell(group.signedBalance);
        cells += vendorDrCrCell(group.lines, level);
        html += '<tr class="' + (canDrill ? 'elr-row-link' : '') + '" data-vendor-code="' + escHtml(group.vendorCode || 0) + '" data-vendor-name="' + escHtml(group.vendorName) + '">' + cells + '</tr>';
    });
    const totalLines = [];
    groups.forEach(function (group) {
        group.lines.forEach(function (line) { totalLines.push(line); });
    });
    const total = { signedBalance: vendorProjectSignedBalance(totalLines, level) };
    metricDefs.forEach(function (metric) {
        let sum = 0;
        totalLines.forEach(function (row) { sum += vendorProjectMetricValue(row, metric); });
        total[metric.id] = sum;
    });
    let totalCells = '<td></td><td><strong>Total</strong></td>';
    if (level === 'project') totalCells += '<td></td>';
    metricDefs.forEach(function (metric) {
        totalCells += '<td class="num">' + escHtml(formatAmount(total[metric.id])) + '</td>';
    });
    totalCells += vendorBalanceCell(total.signedBalance);
    totalCells += vendorDrCrCell(totalLines, level);
    html += '<tr class="row-total">' + totalCells + '</tr>';
    $('#tblVendorProjectBody').html(html);
}

function openVendorColumnMenu(column) {
    if (typeof closeAllFilters === 'function') closeAllFilters();
    const $menu = $('#filterDropdown-' + vendorFilterDomId(column));
    $menu.show();
    if (typeof bizsolFloatFilterPanel === 'function') bizsolFloatFilterPanel($menu);
}

function vendorProjectSourceGroups() {
    return groupVendorProjectRows(filterVendorProjectRows(), 'project');
}

function openVendorValueFilter(column) {
    const id = vendorFilterDomId(column);
    $('#filterDropdown-' + id).hide();
    const values = [];
    vendorProjectSourceGroups().forEach(function (group) {
        const text = vendorGroupColumnText(group, column);
        if (values.indexOf(text) < 0) values.push(text);
    });
    values.sort(function (a, b) {
        return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
    });
    const selected = G_VendorColFilter[column];
    const $box = $('#checkbox-container-' + id);
    $box.empty();
    const $all = $('<input type="checkbox" class="filter-checkbox"/>').val('All');
    $box.append($('<label/>').append($all).append(document.createTextNode(' All')));
    values.forEach(function (value) {
        const $cb = $('<input type="checkbox" class="filter-checkbox"/>').val(value);
        if (!selected || !selected.length || selected.indexOf(value) >= 0) $cb.prop('checked', true);
        $box.append($('<label/>').append($cb).append(document.createTextNode(' ' + value)));
    });
    if (!selected || !selected.length) $box.find('input[type="checkbox"]').prop('checked', true);
    $all.on('change', function () {
        $box.find('input[type="checkbox"]').prop('checked', $(this).is(':checked'));
    });
    const $panel = $('#filter-' + id);
    $panel.show();
    if (typeof bizsolFloatFilterPanel === 'function') bizsolFloatFilterPanel($panel);
}

function applyVendorValueFilter(column) {
    const id = vendorFilterDomId(column);
    const selected = [];
    $('#checkbox-container-' + id + ' input:checked').each(function () {
        const value = $(this).val();
        if (value && value !== 'All') selected.push(value);
    });
    const total = $('#checkbox-container-' + id + ' input').not('[value="All"]').length;
    if (!selected.length || selected.length === total) delete G_VendorColFilter[column];
    else G_VendorColFilter[column] = selected;
    if (typeof closeAllFilters === 'function') closeAllFilters();
    renderVendorProjectLevel();
}

function vendorProjectGoToLevel(levelKey) {
    if (levelKey === 'vendor') {
        G_VendorProjectDrill = resetVendorProjectDrill();
        resetVendorColumnFilters();
    } else {
        G_VendorProjectDrill.level = 'project';
    }
    renderVendorProjectLevel();
}

function vendorProjectDrillInto($tr) {
    const current = vendorProjectLevel(G_VendorProjectDrill.level);
    if (!current.next) return;
    G_VendorProjectDrill.vendorCode = parseInt($tr.attr('data-vendor-code') || '0', 10) || 0;
    G_VendorProjectDrill.vendorName = String($tr.attr('data-vendor-name') || '').trim();
    G_VendorProjectDrill.level = current.next;
    renderVendorProjectLevel();
}

function fetchVendorProjectReport() {
    const fromDate = vendorApiDate($('#txtdateFrom').val());
    const toDate = vendorApiDate($('#txtdateTo').val());
    if (!fromDate || !toDate) {
        toastr.warning('Select from date and to date.');
        return;
    }
    G_VendorProjectDrill = resetVendorProjectDrill();
    resetVendorColumnFilters();
    showVendorPlaceholder('Loading…');
    if (typeof Showloader === 'function') Showloader();
    const vendorCode = selectedVendorMasterCode();
    ExpensesLedgerReportService.GetVendorWiseReport(fromDate, toDate, vendorCode).then(function (response) {
        const rows = asDdLArray(response);
        if (!rows.length) {
            G_VendorProjectRows = [];
            showVendorPlaceholder('No records found.');
            toastr.error('Record not found.');
            return;
        }
        const err0 = rows[0].Error || rows[0].error || rows[0].Msg || rows[0].msg;
        if (err0 != null && err0 !== '') {
            G_VendorProjectRows = [];
            showVendorPlaceholder(String(err0));
            toastr.error(String(err0));
            return;
        }
        G_VendorProjectRows = rows.filter(function (row) { return !row.Error && !row.error; });
        rememberVendorOptions(G_VendorProjectRows, vendorCode === 0);
        renderVendorProjectLevel();
    }).catch(function (err) {
        console.error('GetVendorWiseReport error:', err);
        G_VendorProjectRows = [];
        showVendorPlaceholder('Could not load the vendor project report.');
        toastr.error((err && (err.Msg || err.message)) || 'Error loading vendor project report.');
    }).then(function () {
        if (typeof HideLoader === 'function') HideLoader();
    });
}

function exportVendorProjectExcel() {
    if (!G_VendorProjectRows.length) {
        toastr.warning('Load the report first.');
        return;
    }
    const rows = filterVendorProjectRows();
    const $h = $('#tblLedgerExport thead tr');
    const $b = $('#tblLedgerExport tbody');
    $h.empty();
    $b.empty();
    const headers = [
        'Vendor Name', 'Project Name', 'Sub Project',
        'PO Amount with GST', 'Total Grn Amount', 'TDS Deposit', 'Net Pay', 'Payment', 'Balance (Vendor)', 'Dr/Cr (Vendor)',
        'PO Taxable Amount', 'GST', 'Total PO Amount', 'Total Bill Amount (GRN)', 'TDS Deposit', 'Net Pay', 'Total Payment', 'Balance (Project)', 'Dr/Cr (Project)',
    ];
    headers.forEach(function (header) { $h.append($('<th/>').text(header)); });
    rows.forEach(function (item) {
        const tr = $('<tr/>');
        tr.append($('<td/>').text(vendorProjectValue(item, ['VendorName', 'vendorName'])));
        tr.append($('<td/>').text(vendorProjectValue(item, ['ProjectName', 'projectName'])));
        tr.append($('<td/>').text(vendorProjectValue(item, ['SubProjectDesp', 'subProjectDesp', 'SubProjectName', 'ProjectLocation'])));
        VENDOR_PROJECT_VENDOR_METRICS.forEach(function (metric) {
            tr.append($('<td/>').text(formatAmount(vendorProjectMetricValue(item, metric))));
        });
        tr.append($('<td/>').text(formatAmount(vendorProjectSignedBalance([item], 'vendor'))));
        tr.append($('<td/>').text(vendorDrCrLabel([item], 'vendor')));
        VENDOR_PROJECT_PROJECT_METRICS.forEach(function (metric) {
            tr.append($('<td/>').text(formatAmount(vendorProjectMetricValue(item, metric))));
        });
        tr.append($('<td/>').text(formatAmount(vendorProjectSignedBalance([item], 'project'))));
        tr.append($('<td/>').text(vendorDrCrLabel([item], 'project')));
        $b.append(tr);
    });
    const now = new Date();
    const dateString =
        now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') + '-' +
        String(now.getMinutes()).padStart(2, '0');
    $('#tblLedgerExport').table2excel({
        filename: 'VendorProjectWise_' + dateString,
        fileext: '.xlsx',
    });
}

function fetchVendorLedgerReport() {
    const reportType = ($('#ddlReportType option:selected').val() || '').trim();
    if (!reportType) {
        toastr.warning('Select report type.');
        return;
    }
    const fromDate = convertDateFormat($('#txtdateFrom').val());
    const toDate = convertDateFormat($('#txtdateTo').val());
    const vendor = selectedVendorMasterCode();
    if (vendor <= 0) {
        toastr.warning('Select vendor name.');
        return;
    }
    const proj =
        $('#ddlProject option:selected').val() === '0' || $('#ddlProject option:selected').val() === 'All'
            ? 0
            : parseInt($('#ddlProject option:selected').val(), 10) || 0;
    const sub =
        $('#ddlSubProject option:selected').val() === '0' || $('#ddlSubProject option:selected').val() === 'All'
            ? 0
            : parseInt($('#ddlSubProject option:selected').val(), 10) || 0;

    ExpensesLedgerReportService.GetVendorLedgerReport(fromDate, toDate, vendor, proj, sub).then(function (response) {
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

function fetchReport() {
    if (isVendorProjectReport()) {
        fetchVendorProjectReport();
        return;
    }
    if (isVendorLedgerReport()) {
        fetchVendorLedgerReport();
        return;
    }
    if (isProjectExpenseReport()) {
        const selected = selectedProjectFilterCode();
        if (selected > 0 && projectDrill.projectCode > 0 && projectDrill.projectCode !== selected) {
            goToProjectLevel('PROJECTWISE');
            return;
        }
        if (!projectDrill.level) projectDrill.level = 'PROJECTWISE';
        renderProjectCrumb();
        loadProjectExpenseReport();
        return;
    }
    const reportType = ($('#ddlReportType option:selected').val() || '').trim();
    if (!reportType) {
        toastr.warning('Select report type.');
        return;
    }
    const fromDate = convertDateFormat($('#txtdateFrom').val());
    const toDate = convertDateFormat($('#txtdateTo').val());
    const empRaw = ($('#ddlEmployee').val() || '').toString().trim();
    if (!empRaw || empRaw === '0' || empRaw === 'All') {
        toastr.warning('Select employee.');
        return;
    }
    const emp = parseInt(empRaw, 10) || 0;
    if (emp <= 0) {
        toastr.warning('Select employee.');
        return;
    }
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
    if (isVendorLedgerReport()) {
        const headers = ['Date', 'Desp', 'Project', 'Sub project', 'Dr', 'CR', 'Balance', 'Dr/Cr'];
        headers.forEach((h) => $h.append($('<th/>').text(h)));
        data.forEach(function (item) {
            const kind = vendorLedgerKind(item);
            const tr = $('<tr/>');
            const desp = kind === 'total' || kind === 'closing'
                ? ''
                : String(item.Desp != null && String(item.Desp) !== '' ? item.Desp : (item.Particulars || ''));
            let project = '';
            let sub = '';
            if (kind === 'closing') sub = 'Closing';
            else if (kind !== 'total') {
                project = ledgerRowProjectName(item);
                sub = ledgerRowSubProjectName(item);
            }
            tr.append($('<td/>').text(item.Date != null ? item.Date : ''));
            tr.append($('<td/>').text(desp));
            tr.append($('<td/>').text(project));
            tr.append($('<td/>').text(sub));
            tr.append($('<td/>').text(formatAmount(vendorSideAmount(item, 'dr'))));
            tr.append($('<td/>').text(formatAmount(vendorSideAmount(item, 'cr'))));
            tr.append($('<td/>').text(kind === 'total' ? '' : formatAmount(firstNonEmpty(item, ['Balance', 'balance']))));
            tr.append($('<td/>').text(kind === 'total' ? '' : String(firstNonEmpty(item, ['DrCr', 'drCr', 'DRCR']) || '')));
            $b.append(tr);
        });
        return;
    }
    const headers = ['S.No', 'Date', 'Particulars', 'Project', 'SubProject', 'Payment', 'Expenses', 'Balance', 'DrCr'];
    headers.forEach((h) => $h.append($('<th/>').text(h)));
    data.forEach(function (item) {
        const tr = $('<tr/>');
        headers.forEach(function (h) {
            let cellVal = '';
            if (h === 'Project') cellVal = ledgerRowProjectName(item);
            else if (h === 'SubProject') cellVal = ledgerRowSubProjectName(item);
            else if (item[h] != null) cellVal = item[h];
            if (h === 'Payment' || h === 'Expenses' || h === 'Balance') cellVal = formatAmount(cellVal);
            tr.append($('<td/>').text(cellVal));
        });
        $b.append(tr);
    });
}

function exportExcel() {
    if (isVendorProjectReport()) {
        exportVendorProjectExcel();
        return;
    }
    if (isProjectExpenseReport()) {
        exportProjectExcel();
        return;
    }
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
        filename: (isVendorLedgerReport() ? 'VendorLedger_' : 'EmployeeExpensesLedger_') + dateString,
        fileext: '.xlsx',
    });
}

$(document).ready(function () {
    $('#ERPHeading').text('Employee Expenses Ledger');
    initDefaultDates();
    initSelect2('#ddlElrStatus');
    loadDropdowns();

    $('#ddlProject').on('change', function () {
        refreshSubProjectOptions();
    });
    $('#ddlEmployee').on('change', function () {
        if (!G_FiltersReady || isProjectExpenseReport() || isVendorProjectReport() || isVendorLedgerReport()) return;
        reloadLedgerProjectFilters();
    });
    $('#ddlReportType').on('change', function () {
        if (!G_FiltersReady) return;
        applyReportTypeLayout();
    });
    $('#ddlElrStatus').on('change', function () {
        if (!isProjectExpenseReport()) return;
        projectDrill = emptyProjectDrill();
        renderProjectCrumb();
        showProjectPlaceholder('Click Show to load the report.');
        loadProjectExpenseProjects();
    });
    $('#elrCrumb').on('click', '.elr-crumb-btn', function () {
        goToProjectLevel($(this).attr('data-level'));
    });
    $('#tblProjectExpenseBody').on('click', 'tr.elr-row-link', function () {
        openNextProjectLevel($(this).data('row'));
    });
    $('#elrVendorCrumb').on('click', '.elr-crumb-btn', function () {
        const level = $(this).attr('data-vw-level');
        if (level) vendorProjectGoToLevel(level);
    });
    $('#tblVendorProjectBody').on('click', 'tr.elr-row-link', function (e) {
        e.preventDefault();
        vendorProjectDrillInto($(this));
    });
    $(document).on('click', '#tblVendorProjectHead .elr-vw-open', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openVendorColumnMenu($(this).attr('data-col'));
    });
    $(document).on('click', '.elr-vw-sort', function (e) {
        e.preventDefault();
        e.stopPropagation();
        G_VendorColSort = { column: $(this).attr('data-col'), order: $(this).attr('data-order') };
        if (typeof closeAllFilters === 'function') closeAllFilters();
        renderVendorProjectLevel();
    });
    $(document).on('click', '.elr-vw-filter', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openVendorValueFilter($(this).attr('data-col'));
    });
    $(document).on('click', '.elr-vw-apply', function (e) {
        e.preventDefault();
        e.stopPropagation();
        applyVendorValueFilter($(this).attr('data-col'));
    });
    $(document).on('click', '.elr-vw-clear', function (e) {
        e.preventDefault();
        e.stopPropagation();
        delete G_VendorColFilter[$(this).attr('data-col')];
        if (typeof closeAllFilters === 'function') closeAllFilters();
        renderVendorProjectLevel();
    });

    $('#fetchReportButton').on('click', fetchReport);
    $('#btnDownload').on('click', exportExcel);
    $('#btnLedgerClosing').on('click', scrollLedgerToClosing);
    $('#btnLedgerClose').on('click', function () {
        if (isVendorProjectReport()) {
            clearVendorProjectView();
            return;
        }
        if (isProjectExpenseReport()) {
            $('#ddlProject').val('0').trigger('change');
            $('#ddlElrStatus').val('Pending').trigger('change');
            return;
        }
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
        if (isProjectExpenseReport() || isVendorProjectReport() || !G_LedgerData.length) return;
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
