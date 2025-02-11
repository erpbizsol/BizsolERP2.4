import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const ServicePOApprovalService = {
    GetUnApprovedServicePO: function GetUnApprovedServicePO(QueryCondition) {
        var URL = UrlService.API_ENDPOINT_ServicePOApproval + "/GetUnApprovedServicePO?QueryCondition=" + QueryCondition;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
GetServicePODetail: function GetServicePODetail(POServiceMaster_Code) {
    var URL = UrlService.API_ENDPOINT_ServicePOApproval + "/GetServicePODetail?POServiceMaster_Code=" + POServiceMaster_Code;
    return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
        function (value) {
            return value;
        }
    );
},
    ServicePOApproved: function ServicePOApproved(POServiceMaster_Code, QueryCondition, FrmType) {
    let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ServicePOApproval + "/ServicePOApproved?POServiceMaster_Code=" + POServiceMaster_Code + "&UserMaster_Code=" + userCode + "&QueryCondition=" + QueryCondition + "&FrmType=" + FrmType;

    return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
        function (value) {
            return value;
        }
    );
},
}
export { ServicePOApprovalService }