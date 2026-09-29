import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function getSessionUserCode() {
    try {
        const auth = JSON.parse(sessionStorage.getItem('authKey'));
        return auth && auth.UserMaster_Code != null ? auth.UserMaster_Code : 0;
    } catch (e) {
        return 0;
    }
}

const BASE = UrlService.API_ENDPOINT_SalesPersonDashboard;

const SalesPersonDashboardService = {

    GetActivitySummary: function GetActivitySummary() {
        const userMasterCode = getSessionUserCode();
        const url = `${BASE}/GetActivitySummary?UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    GetPerformanceSummary: function GetPerformanceSummary() {
        const userMasterCode = getSessionUserCode();
        const url = `${BASE}/GetPerformanceSummary?UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },

    GetPaymentSummary: function GetPaymentSummary() {
        const userMasterCode = getSessionUserCode();
        const url = `${BASE}/GetPaymentSummary?UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },
};

export { SalesPersonDashboardService };
