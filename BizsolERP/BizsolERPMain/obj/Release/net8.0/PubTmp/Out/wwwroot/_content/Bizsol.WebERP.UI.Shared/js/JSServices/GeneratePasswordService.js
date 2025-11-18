import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const GeneratePasswordService = {
    UnUsedPasswords: function UnUsedPasswords() {
        var URL = UrlService.API_ENDPOINT_GeneratePassword + "/UnUsedPasswords";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    UsedForFilter: function UsedForFilter() {
        var URL = UrlService.API_ENDPOINT_GeneratePassword + "/UsedForFilter";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GeneratePasswords: function GeneratePasswords(NoOfPwd) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_GeneratePassword + "/GeneratePasswords?NoOfPwd=" + NoOfPwd + "&UserMaster_Code=" + userCode ;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    ReportPasswords: function ReportPasswords(FromDate, ToDate, UsedForFillter) {
        var URL = UrlService.API_ENDPOINT_GeneratePassword + "/ReportPasswords?FromDate=" + FromDate + "" + "&ToDate=" + ToDate + "" + "&UsedForFillter=" + UsedForFillter + "";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

}

export { GeneratePasswordService }