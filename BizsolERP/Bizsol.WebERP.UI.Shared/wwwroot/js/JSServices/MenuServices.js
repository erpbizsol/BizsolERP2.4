
import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const MenuService = {
    GetMenuList: function GetMenuList(UserID) {

        let url = UrlService.ERP_SIDE_MENU + "/GetUserModuleMasterByUserID?UserID=" + UserID;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );


    }
}

export { MenuService }