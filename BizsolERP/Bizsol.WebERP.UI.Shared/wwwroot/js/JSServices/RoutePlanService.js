import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const RoutePlanMasterService = {
    GetNestedDealerList: function GetNestedDealerList() {
        
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ACCOUNT_MASTER + `/GetNestedDealerList?UserMaster_Code=`+userMasterCode+`&MarketingManMaster_Code=0` ;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    RoutePlanVistTypeDropDownList: function RoutePlanVistTypeDropDownList(){
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ROUTE_PLAN + `/RoutePlanVistTypeDropDownList` ;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetStateList: function GetStateList(CountryName){
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_STATE + `/GetStateList?CountryName=` +CountryName+`&UserId=`+userMasterCode  ;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetCityList: function GetCityList(CountryName,StateName){
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CITY + `/GetCityList?CountryName=` +CountryName+`&StateName=`+StateName+`&UserId=`+userMasterCode ;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetCityDetailsByName: function GetCityDetailsByName(CityName, Mode) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CITY + `/GetCityMasterByName?CityName=` + CityName + `&Mode=` + Mode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRoutePlanListByPlanDate: function GetRoutePlanListByPlanDate(dtPlanDate){
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ROUTE_PLAN + `/GetRoutePlanListByPlanDate?Date=`+dtPlanDate+`&UserMaster_Code=`+userMasterCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetRoutePlanList: function GetRoutePlanList(Mode){
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ROUTE_PLAN + `/GetRoutePlanList?UserMaster_Code=${userMasterCode}&Mode=${Mode}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveRoutePlan: function SaveRoutePlan(Data) {
        var json_data=JSON.stringify(Data)
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ROUTE_PLAN + `/SaveRoutePlan?UserMaster_Code=` + userMasterCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteRoutePlan: function DeleteRoutePlan(Code, UserMaster_Code, ReasonForDelete) {
        
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ROUTE_PLAN + `/DeleteRoutePlan?UserMaster_Code=` + userMasterCode + `&Code=` + Code + `&ReasonForDelete=` + ReasonForDelete;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
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
    GetUserWiseRoutePlanDetails: function GetUserWiseRoutePlanDetails(FromDate,ToDate) {
        let userMasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ROUTE_PLAN + "/GetUserWiseRoutePlanDetails?FromDate=" + FromDate + "&ToDate=" + ToDate +"&UserMaster_Code=" + userMasterCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    VerifyRoutePlan: function VerifyRoutePlan(Code) {
        var userMasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ROUTE_PLAN + "/VerifyRoutePlan?Code="+ Code +"&UserMaster_Code=" + userMasterCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    RejectRoutePlan: function RejectRoutePlan(Code,ReasonForDelete) {
        var userMasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ROUTE_PLAN + "/RejectRoutePlan?Code=" + Code + "&UserMaster_Code=" + userMasterCode+ "&ReasonForDelete=" + ReasonForDelete +"";
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    VerifyAllRoutePlan: function VerifyAllRoutePlan(MultiRoutePlanCodes) {
        var userMasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ROUTE_PLAN + "/VerifyAllRoutePlan?MultiRoutePlanCodes=" + MultiRoutePlanCodes + "" + "&UserMaster_Code=" + userMasterCode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    RejectAllRoutePlan: function RejectAllRoutePlan(MultiRoutePlanCodes,ReasonForDelete) {
        var userMasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ROUTE_PLAN + "/RejectAllRoutePlan?MultiRoutePlanCodes=" + MultiRoutePlanCodes + "" + "&UserMaster_Code=" + userMasterCode + "&ReasonForDelete=" + ReasonForDelete +"";
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    }

    export { RoutePlanMasterService }