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
    
    GetRoutePlanListByPlanDate: function GetRoutePlanListByPlanDate(dtPlanDate){
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ROUTE_PLAN + `/GetRoutePlanListByPlanDate?Date=10-07-2024&UserMaster_Code=`+userMasterCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    }

    export { RoutePlanMasterService }