import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const BASE = () => UrlService.API_ENDPOINT_ProjectDetailDashboard;


const ProjectDetailDashboardService = {

    // GET api/ProjectDetailDashboard/GetProjectList
    GetProjectList: function GetProjectList() {
        const url = `${BASE()}/GetProjectList`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    // GET api/ProjectDetailDashboard/GetSubProjectListByProject?ProjectMaster_Code=X
    GetSubProjectListByProject: function GetSubProjectListByProject(projectCode) {
        const url = `${BASE()}/GetSubProjectListByProject?ProjectMaster_Code=${projectCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    // GET api/ProjectDetailDashboard/GetDashboardSummary
    GetDashboardSummary: function GetDashboardSummary(projectCode, subProjectCode, fromDate, toDate) {
        const url = `${BASE()}/GetDashboardSummary?ProjectMaster_Code=${projectCode}&SubProjectMaster_Code=${subProjectCode}&FromDate=${fromDate}&ToDate=${toDate}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    // GET api/ProjectDetailDashboard/GetPOStatus
    GetPOStatus: function GetPOStatus(projectCode, subProjectCode, fromDate, toDate) {
        const url = `${BASE()}/GetPOStatus?ProjectMaster_Code=${projectCode}&SubProjectMaster_Code=${subProjectCode}&FromDate=${fromDate}&ToDate=${toDate}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    // GET api/ProjectDetailDashboard/GetPaymentTrend
    GetPaymentTrend: function GetPaymentTrend(projectCode, subProjectCode, year) {
        const url = `${BASE()}/GetPaymentTrend?ProjectMaster_Code=${projectCode}&SubProjectMaster_Code=${subProjectCode}&Year=${year}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    // GET api/ProjectDetailDashboard/GetProjectSummary
    GetProjectSummary: function GetProjectSummary(projectCode) {
        const url = `${BASE()}/GetProjectSummary?ProjectMaster_Code=${projectCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    // GET api/ProjectDetailDashboard/GetBudgetVsActual
    GetBudgetVsActual: function GetBudgetVsActual(projectCode, subProjectCode, fromDate, toDate) {
        const url = `${BASE()}/GetBudgetVsActual?ProjectMaster_Code=${projectCode}&SubProjectMaster_Code=${subProjectCode}&FromDate=${fromDate}&ToDate=${toDate}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    // GET api/ProjectDetailDashboard/GetExpenseSummary
    GetExpenseSummary: function GetExpenseSummary(projectCode, subProjectCode, fromDate, toDate) {
        const url = `${BASE()}/GetExpenseSummary?ProjectMaster_Code=${projectCode}&SubProjectMaster_Code=${subProjectCode}&FromDate=${fromDate}&ToDate=${toDate}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },
};

export { ProjectDetailDashboardService };
