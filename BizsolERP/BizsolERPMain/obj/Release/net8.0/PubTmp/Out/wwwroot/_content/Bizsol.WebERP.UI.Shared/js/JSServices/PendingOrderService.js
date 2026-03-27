import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const PendingOrderService = {
    GetNestedMarketingManList: function GetNestedMarketingManList() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_SALESPERSON + `/GetNestedMarketingManList?UserMaster_Code=` + userMasterCode + `&MarketingManMaster_Code=0`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    CheckModuleOptionRight: function CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var UserMaster_Code = authKeyData.UserMaster_Code;
        let url = UrlService.ERP_SIDE_MENU + `/CheckModuleOptionRight?ModuleName=${ModuleName}&OptionName=${OptionName}&ShowMsg=${ShowMsg}&FinYear=${FinYear}`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetPendingOrderSummary: function GetPendingOrderSummary(FromDate, ToDate, SalesPersonName, Mode, StrCondition) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var UserMaster_Code = authKeyData.UserMaster_Code;
        let url = UrlService.API_ENDPOINT_GatependingOrderforDO + `/GetPendingOrderSummary?FromDate=${FromDate}&ToDate=${ToDate}&SalesPersonName=${SalesPersonName}&Mode=${Mode}&StrCondition=${StrCondition}`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetFixedParameterQtyConfig: function GetFixedParameterQtyConfig() {

        var URL = UrlService.API_ENDPOINT_QTY_CONFIG + `/GetFixedParameterQtyConfig`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetCRMOrderEntryConfig: function GetCRMOrderEntryConfig() {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CRM_ORDERENTRY_CONFIG + `/GetCRMFixedParameterConfig`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { PendingOrderService }