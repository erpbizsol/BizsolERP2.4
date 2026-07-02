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

const BASE = () => UrlService.API_ENDPOINT_ExpenseDashboard;

const ExpenseDashboardService = {

    GetExpenseDashboard: function GetExpenseDashboard(
        fromDate,
        toDate,
        marketingManMaster_Code,
        projectMaster_Code,
        subProjectMaster_Code
    ) {
        const userMasterCode = getSessionUserCode();
        const url =
            `${BASE()}/GetExpenseDashboard` +
            `?FromDate=${encodeURIComponent(fromDate || '')}` +
            `&ToDate=${encodeURIComponent(toDate || '')}` +
            `&MarketingManMaster_Code=${encodeURIComponent(marketingManMaster_Code || 0)}` +
            `&ProjectMaster_Code=${encodeURIComponent(projectMaster_Code || 0)}` +
            `&SubProjectMaster_Code=${encodeURIComponent(subProjectMaster_Code || 0)}` +
            `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) { return value; });
    },
};

export { ExpenseDashboardService };
