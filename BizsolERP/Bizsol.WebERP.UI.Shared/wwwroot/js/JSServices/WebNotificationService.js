
import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const WebNotificationService = {
    GetWebNotificationMasterList: function GetWebNotificationMasterList(UserID, CompanyCode) {

        let url = UrlService.API_ENDPOINT_WebNotification + "/GetWebNotificationMasterList?UserID=" + UserID + "&CompanyCode=" + CompanyCode;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );


    }
}

export { WebNotificationService }