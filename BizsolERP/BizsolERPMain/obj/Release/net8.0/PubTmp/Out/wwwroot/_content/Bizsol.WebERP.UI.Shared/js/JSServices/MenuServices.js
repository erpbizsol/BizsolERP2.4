
import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const MenuService = {
    GetMenuList: function GetMenuList(UserID) {
        let CompanyCode = JSON.parse(sessionStorage.getItem('authKey')).CompanyCode;
        let url = UrlService.ERP_SIDE_MENU + "/GetUserModuleMaster?UserID=" + UserID + "&CompanyCode=" + CompanyCode ;
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
}

export { MenuService }