import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const CRMOrderInTransitService = {
    GetCRMOrderInTransitList: function GetCRMOrderInTransitList(mode) {
        mode = mode != null && mode !== undefined && mode !== '' ? mode : 'SHOW_PendingOrders';
        var URL = UrlService.API_ENDPOINT_CRM_ORDER_IN_TRANSIT
            + '/GetCRMOrderInTransitList?Mode=' + encodeURIComponent(mode);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    SaveCRMOrderInTransit: function SaveCRMOrderInTransit(data, mode) {
        mode = mode != null && mode !== undefined && mode !== '' ? mode : 'Update';
        var URL = UrlService.API_ENDPOINT_CRM_ORDER_IN_TRANSIT
            + '/SaveCRMOrderInTransit?Mode=' + encodeURIComponent(mode);
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(data)).then(function (value) {
            return value;
        });
    }
};

export { CRMOrderInTransitService };
