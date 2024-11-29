import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const CRMDashboardService = {
    GetCRMDashboardDatalist: function GetCRMDashboardDatalist(DetailKey, MarketingManMaster_Code, AccountDesp, OnlyToday) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        const url = `${UrlService.API_ENDPOINT_CRM_DASHBOARD}/GetCRMDashboardData?DetailKey=${DetailKey}&MarketingManMaster_Code=${MarketingManMaster_Code}&AccountDesp=${AccountDesp}&OnlyToday=${OnlyToday}&UserMaster_Code=${userCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetCRMFixedParameterConfig: function GetCRMFixedParameterConfig(DetailKey, MarketingManMaster_Code, AccountDesp, OnlyToday) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        const url = `${UrlService.API_ENDPOINT_ConfigCRM}/GetCRMFixedParameterConfig`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetSalespersonList: function GetSalespersonList() {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_SALESPERSON + `/GetNestedMarketingManList?UserMaster_Code=` + userMasterCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    GetCRMDashboardDetailDatalist: function GetCRMDashboardDetailDatalist(DetailKey, MarketingManMaster_Code, AccountDesp, OnlyToday) {
        let usermasterCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        const url = `${UrlService.API_ENDPOINT_CRM_DASHBOARD}/GetCRMDashboardDetailData?DetailKey=${DetailKey}&MarketingManMaster_Code=${MarketingManMaster_Code}&AccountDesp=${AccountDesp}&OnlyToday=${OnlyToday}&UserMaster_Code=${usermasterCode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetUserDetails: function GetUserDetails() {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        let companycode = JSON.parse(sessionStorage.getItem('authKey')).CompanyCode;
        const url = `${UrlService.ERP_SIDE_MENU}/GetUserDetails?UserMaster_Code=${userCode}&CompanyCode=${companycode}`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    }



}
export { CRMDashboardService }