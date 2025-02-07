import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const FixedParameterConfigurationService = {
    
    GetCRMFixedParameterConfigFields: function GetCRMFixedParameterConfigFields() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var FormType = "Config_CRMOrderEntry";
        var URL = UrlService.API_ENDPOINT_CRM_ORDERENTRY_CONFIG + `/GetCRMFixedParameterConfigFields?FormType=${FormType}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveCRMFixedParameterConfig: function SaveCRMFixedParameterConfig(Data) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var json_data = JSON.stringify(Data, null, 2);
        var URL = UrlService.API_ENDPOINT_CRM_ORDERENTRY_CONFIG + `/SaveCRMFixedParameterConfig`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    GetStockOptionList: function GetStockOptionList() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CRM_ORDERENTRY_CONFIG + `/GetStockOptionList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}
export { FixedParameterConfigurationService }