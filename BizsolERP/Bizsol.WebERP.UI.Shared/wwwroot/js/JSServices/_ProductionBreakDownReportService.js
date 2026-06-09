import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const ProductionBreakDownReportService = {
    /** GET /RollingProduction/Getddl?Mode=GetDdlMachineNo */
    GetMachineList: function GetMachineList() {
        var URL =
            UrlService.API_ENDPOINT_RollingProduction +
            '/Getddl?Mode=GetDdlMachineNo&Code=0';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /** GET /ProductionBreakDownReport/GetProductionBreakDownReport */
    GetProductionBreakDownReport: function GetProductionBreakDownReport(fromDate, toDate, machineMaster_Code, mode) {
        var machineCode = machineMaster_Code !== undefined && machineMaster_Code !== null && machineMaster_Code !== ''
            ? machineMaster_Code
            : 0;
        var reportMode = mode || 'Day';
        var URL =
            UrlService.API_ENDPOINT_ProductionBreakDownReport +
            `/GetProductionBreakDownReport` +
            `?FromDate=${encodeURIComponent(fromDate)}` +
            `&ToDate=${encodeURIComponent(toDate)}` +
            `&MachineMaster_Code=${encodeURIComponent(machineCode)}` +
            `&Mode=${encodeURIComponent(reportMode)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },
};

export { ProductionBreakDownReportService };
