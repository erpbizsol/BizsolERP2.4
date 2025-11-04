import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const VerifyDispatchPlanService = {
    GetDispatchAdvicePlanList: function GetDispatchAdvicePlanList(Status) {
        var URL = UrlService.API_DOCUMENT_DispatchAdvicePlan + "/GetVerifyDispatchAdviceList?Status=" + Status;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    Verify: function Verify(Code, Status) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_DOCUMENT_DispatchAdvicePlan + `/VerifyDispatchAdvice?Status=${Status}&UserMaster_Code=${userMasterCode}&DespatchAdviceNo=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { VerifyDispatchPlanService }
