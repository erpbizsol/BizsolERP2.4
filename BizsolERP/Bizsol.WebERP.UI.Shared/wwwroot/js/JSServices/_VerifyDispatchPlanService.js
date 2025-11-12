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
    AllTransporterRateList: function AllTransporterRateList(Code) {
        var URL = UrlService.API_DOCUMENT_DispatchAdvicePlan + `/AllTransporterRateList?Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    TransporterList: function TransporterList() {
        var URL = UrlService.API_DOCUMENT_DispatchAdvicePlan + `/TransporterList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    UpdateTransporter: function UpdateTransporter(Codes) {
        var URL = UrlService.API_DOCUMENT_DispatchAdvicePlan + `/UpdateTransporter?Codes=${Codes}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SendMailToTransporter: function SendMailToTransporter(TransporterCodes,Codes) {
        var URL = UrlService.API_DOCUMENT_DispatchAdvicePlan + `/SendMailToTransporter?TransporterCodes=${TransporterCodes}&Codes=${Codes}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { VerifyDispatchPlanService }
