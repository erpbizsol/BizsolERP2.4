import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function getCrmReportsBase() {
    const crm = UrlService.API_ENDPOINT_CRMReports;
    if (crm == null || String(crm).trim() === '') return '';
    return String(crm).replace(/\/$/, '');
}

/** `{BASE}` — DDL actions; report data via `GetExpensesLedgerReport`; CRM area uses `ExpensesLedgerReport`. */
function getExpenseLedgerDdLApiBase() {
    const stand =
        UrlService.API_ENDPOINT_ExpensesLedgerReport ||
        UrlService.API_ENDPOINT_AREA_ExpensesLedgerReport;
    if (stand != null && String(stand).trim() !== '')
        return String(stand).replace(/\/$/, '');
    const base =
        UrlService.BASE_URL != null ? String(UrlService.BASE_URL).trim().replace(/\/$/, '') : '';
    if (base !== '') return `${base}/ExpensesLedgerReport`;
    return '';
}

/**
 * Prefer standalone: `{base}/GetExpensesLedgerReport?...`
 * Fallback: `{CRMReports}/ExpensesLedgerReport?...`
 */
function expenseLedgerReportUrl(queryStringLeadingQuestionOrEmpty) {
    const qs = queryStringLeadingQuestionOrEmpty || '';
    const standalone = getExpenseLedgerDdLApiBase();
    if (standalone !== '') {
        return `${standalone}/ExpensesLedgerReport${qs}`;
    }
    const crm = getCrmReportsBase();
    if (crm !== '') {
        return `${crm}/ExpensesLedgerReport${qs}`;
    }
    console.error('ExpensesLedgerReportService: Missing report API base.');
    return '';
}

const EXPENSE_LEDGER_DDL_MODE = {
    EMPLOYEE: 'DDL_EMPLOYEEMASTER',
    PROJECT: 'DDL_PROJECTMASTER',
    SUB_PROJECT: 'DDL_SUBPROJECTMASTER',
};

const EXPENSE_LEDGER_MODE = {
    CLOSING_BALANCE: 'CLOSING_BALANCE',
};

function ddlUrlWithMode(actionSegment, mode) {
    const root = getExpenseLedgerDdLApiBase();
    if (!root) {
        console.error('ExpensesLedgerReportService: Missing DDL API base.');
        return '';
    }
    const act = String(actionSegment).replace(/^\//, '');
    return `${root}/${act}?Mode=${encodeURIComponent(mode)}&_ts=${Date.now()}`;
}

const ExpensesLedgerReportService = {
    GetReportType: function GetReportType(moduleDesc) {
        const crm = getCrmReportsBase();
        const prefix = crm !== '' ? crm : getExpenseLedgerDdLApiBase();
        const url =
            `${prefix}/GetReportType?ModuleDesc=${encodeURIComponent(moduleDesc ?? '')}&_ts=${Date.now()}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null).then(function (value) {
            return value;
        });
    },

    ExpensesLedgerReport: function ExpensesLedgerReport(
        fromDate,
        toDate,
        reportType,
        employeeMaster_Code,
        projectMaster_Code,
        subProjectMaster_Code
    ) {
        let qs =
            `?FromDate=${encodeURIComponent(fromDate)}` +
            `&ToDate=${encodeURIComponent(toDate)}` +
            `&ReportType=${encodeURIComponent(reportType)}` +
            `&EmployeeMaster_Code=${encodeURIComponent(employeeMaster_Code)}` +
            `&ProjectMaster_Code=${encodeURIComponent(projectMaster_Code)}` +
            `&SubProjectMaster_Code=${encodeURIComponent(subProjectMaster_Code)}`;
        const url = expenseLedgerReportUrl(qs);
        return promiseAjaxCallApi.CallAPI('GET', url, null).then(function (value) {
            return value;
        });
    },

    GetEmployeeMasterList: function GetEmployeeMasterList() {
        const url = ddlUrlWithMode('GetEmployeeMasterList', EXPENSE_LEDGER_DDL_MODE.EMPLOYEE);
        return promiseAjaxCallApi.CallAPI('GET', url, null).then(function (value) {
            return value;
        });
    },

    GetProjectMasterList: function GetProjectMasterList() {
        const url = ddlUrlWithMode('GetProjectMasterList', EXPENSE_LEDGER_DDL_MODE.PROJECT);
        return promiseAjaxCallApi.CallAPI('GET', url, null).then(function (value) {
            return value;
        });
    },

    GetSubProjectMasterList: function GetSubProjectMasterList() {
        const url = ddlUrlWithMode('GetSubProjectMasterList', EXPENSE_LEDGER_DDL_MODE.SUB_PROJECT);
        return promiseAjaxCallApi.CallAPI('GET', url, null).then(function (value) {
            return value;
        });
    },

    /** Closing balance for Expense Entry (Mode=CLOSING_BALANCE). */
    GetClosingBalance: function GetClosingBalance(
        fromDate,
        toDate,
        employeeMaster_Code,
        projectMaster_Code,
        subProjectMaster_Code
    ) {
        let qs =
            `?FromDate=${encodeURIComponent(fromDate)}` +
            `&ToDate=${encodeURIComponent(toDate)}` +
            `&Mode=${encodeURIComponent(EXPENSE_LEDGER_MODE.CLOSING_BALANCE)}` +
            `&EmployeeMaster_Code=${encodeURIComponent(employeeMaster_Code)}` +
            `&ProjectMaster_Code=${encodeURIComponent(projectMaster_Code)}` +
            `&SubProjectMaster_Code=${encodeURIComponent(subProjectMaster_Code)}`;
        const url = expenseLedgerReportUrl(qs);
        return promiseAjaxCallApi.CallAPI('GET', url, null).then(function (value) {
            return value;
        });
    },
};

export { ExpensesLedgerReportService };
