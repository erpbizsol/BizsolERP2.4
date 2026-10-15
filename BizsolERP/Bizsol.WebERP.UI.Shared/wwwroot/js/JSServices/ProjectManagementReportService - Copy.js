import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function getReportApiBase() {
    const stand =
        UrlService.API_ENDPOINT_ProjectManagementReport ||
        UrlService.API_ENDPOINT_AREA_ProjectManagementReport;
    if (stand != null && String(stand).trim() !== '')
        return String(stand).replace(/\/$/, '');
    const base =
        UrlService.BASE_URL != null ? String(UrlService.BASE_URL).trim().replace(/\/$/, '') : '';
    if (base !== '') return `${base}/ProjectManagementReport`;
    return '';
}

/** DDL uses ExpensesLedgerReport API (same as Expenses Ledger page — already deployed). */
function getDdlApiBase() {
    const stand =
        UrlService.API_ENDPOINT_ExpensesLedgerReport ||
        UrlService.API_ENDPOINT_AREA_ExpensesLedgerReport;
    if (stand != null && String(stand).trim() !== '')
        return String(stand).replace(/\/$/, '');
    const base =
        UrlService.BASE_URL != null ? String(UrlService.BASE_URL).trim().replace(/\/$/, '') : '';
    if (base !== '') return `${base}/ExpensesLedgerReport`;
    return getReportApiBase();
}

function getCrmReportsBase() {
    const crm = UrlService.API_ENDPOINT_CRMReports;
    if (crm == null || String(crm).trim() === '') return '';
    return String(crm).replace(/\/$/, '');
}

const PMR_DDL_MODE = {
    PROJECT: 'DDL_PROJECTMASTER',
    SUB_PROJECT: 'DDL_SUBPROJECTMASTER',
};

function ddlUrl(actionSegment, mode) {
    const root = getDdlApiBase();
    if (!root) {
        console.error('ProjectManagementReportService: Missing DDL API base.');
        return '';
    }
    const act = String(actionSegment).replace(/^\//, '');
    return `${root}/${act}?Mode=${encodeURIComponent(mode)}&_ts=${Date.now()}`;
}

const ProjectManagementReportService = {
    GetReportType: function GetReportType(moduleDesc) {
        const crm = getCrmReportsBase();
        const prefix = crm !== '' ? crm : getDdlApiBase();
        const url =
            `${prefix}/GetReportType?ModuleDesc=${encodeURIComponent(moduleDesc ?? '')}&_ts=${Date.now()}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null).then(function (value) {
            return value;
        });
    },

    GetProjectManagementReport: function GetProjectManagementReport(
        reportType,
        projectMaster_Code,
        subProjectMaster_Code,
        vendorMaster_Code
    ) {
        let qs =
            `?ReportType=${encodeURIComponent(reportType)}` +
            `&ProjectMaster_Code=${encodeURIComponent(projectMaster_Code)}` +
            `&SubProjectMaster_Code=${encodeURIComponent(subProjectMaster_Code)}` +
            `&VendorMaster_Code=${encodeURIComponent(vendorMaster_Code || 0)}`;
        const url = `${getReportApiBase()}/ProjectManagementReport${qs}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null).then(function (value) {
            return value;
        });
    },

    GetProjectMasterList: function GetProjectMasterList() {
        const url = ddlUrl('GetProjectMasterList', PMR_DDL_MODE.PROJECT);
        return promiseAjaxCallApi.CallAPI('GET', url, null).then(function (value) {
            return value;
        });
    },

    GetSubProjectMasterList: function GetSubProjectMasterList(projectMaster_Code) {
        const root = getDdlApiBase();
        if (!root) {
            console.error('ProjectManagementReportService: Missing DDL API base.');
            return Promise.resolve([]);
        }
        let url = `${root}/GetSubProjectMasterList?Mode=${encodeURIComponent(PMR_DDL_MODE.SUB_PROJECT)}&_ts=${Date.now()}`;
        if (projectMaster_Code > 0) {
            url += `&ProjectMaster_Code=${encodeURIComponent(projectMaster_Code)}`;
        }
        return promiseAjaxCallApi.CallAPI('GET', url, null).then(function (value) {
            return value;
        });
    },
};

export { ProjectManagementReportService };
