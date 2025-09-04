import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const OrderEntryListService = {
    GetRouteDataFromOrderEntry: function GetRouteDataFromOrderEntry(FromDate, ToDate, UserName, OrderStatus) {
        //var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/GetRouteDataFromOrderEntry?FromDate=${FromDate}&ToDate=${ToDate}&UserName=${UserName}&OrderStatus=${OrderStatus}`;
        var URL = `${UrlService.API_ENDPOINT_VISIT_MASTER}/GetRouteDataFromOrderEntry?FromDate=${encodeURIComponent(FromDate)}&ToDate=${encodeURIComponent(ToDate)}&UserName=${encodeURIComponent(UserName)}&OrderStatus=${encodeURIComponent(OrderStatus)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetOrderStatusList: function GetOrderStatusList() {
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + "/GetOrderStatusList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetFixedParameterConfiguration: function GetFixedParameterConfiguration() {
        var URL = UrlService.API_ENDPOINT_FixedParameter + "/GetFixedParameterConfiguration";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetUserNameList: function GetUserNameList() {
        var userMasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + "/GetUserNameList?UserMaster_Code=" + userMasterCode ;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    DeleteVisit: function DeleteVisit(Code, ReasonForDelete) {
        var userMasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + "/DeleteVisit?Code=" + Code + "&UserMaster_Code=" + userMasterCode + "&ReasonForDelete=" + ReasonForDelete + "" + "&IPAddress=" + 1 + "" +"&Location=" + 1 +"";
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
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
    GetFixedParameterQtyConfig: function GetFixedParameterQtyConfig() {

        var URL = UrlService.API_ENDPOINT_QTY_CONFIG + `/GetFixedParameterQtyConfig`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    CheckModuleOptionRight: function CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var UserMaster_Code = authKeyData.UserMaster_Code;
        let url = UrlService.ERP_SIDE_MENU + `/CheckModuleOptionRight?ModuleName=${ModuleName}&OptionName=${OptionName}&ShowMsg=${ShowMsg}&FinYear=${FinYear}&UserMaster_Code=${UserMaster_Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );


    },
    GetOrderListDates: function GetOrderListDates() {
        var userMasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + "/GetOrderListDates?UserMaster_Code=" + userMasterCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { OrderEntryListService }