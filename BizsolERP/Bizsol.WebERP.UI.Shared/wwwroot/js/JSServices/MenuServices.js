
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


    }
}

export { MenuService }