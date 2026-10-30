import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const SalesManagementDashboradService = {
    GetMultipleTableSalesManagementDashboardData: function GetMultipleTableSalesManagementDashboardData(payload) {
        const source = payload || {};
        const requestBody = {
            Mode: source.Mode || 'DASHBOARD',
            DealerCodes: source.dealerCodes || '0',
            FromDate: formatDashboardDate(source.fromDate),
            ToDate: formatDashboardDate(source.toDate),
            SalesPersons: source.salesPersons || '0',
            ZoneCodes: source.zoneCodes || '0',
            States: source.states || '0',
            IndustryTypes: source.industryTypes || '0',
            ItemCodes: source.itemCodes || '0',
            CompareFromDate: formatDashboardDate(source.compareFromDate),
            CompareToDate: formatDashboardDate(source.compareToDate)
        };

        const url = `${UrlService.API_ENDPOINT_SalesManagementDashborad}/GetMultipleTableSalesManagementDashboardData`;
        return promiseAjaxCallApi.CallAPI('POST', url, JSON.stringify(requestBody)).then(function (value) {
            return value;
        });
    }
};

function formatDashboardDate(d) {
    if (d === '0' || d === 0 || d === null || d === undefined || d === '') return '0';
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt)) return String(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export { SalesManagementDashboradService };
