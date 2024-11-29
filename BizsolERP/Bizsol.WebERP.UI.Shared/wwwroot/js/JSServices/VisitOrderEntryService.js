import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const VisitOrderEntryService = {
    GetNestedMarketingManList: function GetNestedMarketingManList() {
        var URL = UrlService.API_ENDPOINT_SALESPERSON + `/GetNestedMarketingManList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetVisitMasterList: function GetVisitMasterList(FromDate, ToDate, MarketingMan) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/GetVerifiedRoutePlanUserAndDateWise?User_ID=${userMasterCode}&MarketingMan_Name=${MarketingMan}&FromDate=${FromDate}&ToDate=${ToDate}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRoutePlanList: function GetRoutePlanList() {
        var URL = UrlService.API_ENDPOINT_ROUTE_PLAN + `/GetRoutePlanList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    NotVisitedRoutePlan: function NotVisitedRoutePlan(RoutePlanMaster_Code, Reason) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/NotVisitedRoutePlan?RoutePlanMaster_Code=${RoutePlanMaster_Code}&UserMaster_Code=${userMasterCode}&ReasonForClose=${Reason}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    CheckInVisit: function CheckInVisit(RoutePlanMaster_Code, CheckIn, location, ChekedInLocation) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/CheckInVisit?RoutePlanMaster_Code=${RoutePlanMaster_Code}&CheckIn=${CheckIn}&Location=${location}&ChekedInLocation=${ChekedInLocation}&UserMaster_Code=${userMasterCode}`;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { VisitOrderEntryService }