
import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const WebNotificationService = {
    GetWebNotificationMasterList: function GetWebNotificationMasterList(UserID) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var companycode = authKeyData.CompanyCode;
        let url = UrlService.API_ENDPOINT_WebNotification + "/GetWebNotificationMasterList?UserID=" + UserID + "&CompanyCode=" + companycode;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );


    }
}

export { WebNotificationService }