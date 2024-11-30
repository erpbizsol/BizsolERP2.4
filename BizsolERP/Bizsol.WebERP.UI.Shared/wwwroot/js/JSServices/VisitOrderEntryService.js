import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const VisitOrderEntryService = {
    GetUserDetails: function GetUserDetails() {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var companyCode = authKeyData.CompanyCode;
        var URL = UrlService.API_UserMODULE + `/GetUserDetails?UserMaster_Code=` + userMasterCode + `&CompanyCode=` + companyCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetNestedDealerList: function GetNestedDealerList() {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ACCOUNT_MASTER + `/GetNestedDealerList?UserMaster_Code=` + userMasterCode + `&MarketingManMaster_Code=0`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetCRMFixedParameterConfig: function GetCRMFixedParameterConfig() {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CRM_CONFIG + `/GetCRMFixedParameterConfig`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetAccountMasterDetails: function GetAccountMasterDetails(AccountDesp) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ACCOUNT_MASTER + `/GetAccountMasterByAccountDesp?AccountDesp=` + AccountDesp;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDealerDetailsByDealerName: function GetDealerDetailsByDealerName(AccountDesp) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/GetDealerDetailsByDealerName?DealerName=` + AccountDesp;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetItemMasterDropdown: function GetItemMasterDropdown() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ITEM + `/GetItemMasterDropdown`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetNestedMarketingManList: function GetNestedMarketingManList() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_SALESPERSON + `/GetNestedMarketingManList?UserMaster_Code=`+ userMasterCode + `&MarketingManMaster_Code=0`;
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
    GetOrderTypeList: function GetOrderTypeList() {
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/GetOrderTypeList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetVerifyOrderList: function GetVerifyOrderList(SalesPerson, DealerName, OrderType, ChkWithOrder) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `GetVerifyOrderList?DealerName=${DealerName} &SalesPerson=${SalesPerson}&OrderType=${OrderType}&ChkWithOrder=${ChkWithOrder}&UserMaster_Code=${userMasterCode}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { VisitOrderEntryService }