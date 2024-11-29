import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const OrderEntryListService = {
    GetRouteDataFromOrderEntry: function GetRouteDataFromOrderEntry(FromDate, ToDate, UserName, OrderStatus) {
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/GetRouteDataFromOrderEntry?FromDate='${FromDate}'&ToDate='${ToDate}'&UserName='${UserName}'&OrderStatus='${OrderStatus}'`;
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
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + "/RejectAllRoutePlan?Code=" + Code + "&UserMaster_Code=" + userMasterCode + "&ReasonForDelete='" + ReasonForDelete + "'" + "&IPAddress=" + 1 + "'" +"&Location=" + 1 +"'";
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { OrderEntryListService }