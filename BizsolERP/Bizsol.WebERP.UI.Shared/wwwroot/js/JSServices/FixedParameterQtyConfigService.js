import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const FixedParameterQtyConfigService = {

    GetFixedParameterQtyConfigFields: function GetFixedParameterQtyConfigFields() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var FormType = "FixedparameterQtyConfig";
        var URL = UrlService.API_ENDPOINT_QTY_CONFIG + `/GetFixedParameterQtyConfigFields?FormType=${FormType}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveFixedParameterQtyConfig: function SaveFixedParameterQtyConfig(Data) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var json_data = JSON.stringify(Data, null, 2);
        var URL = UrlService.API_ENDPOINT_QTY_CONFIG + `/SaveFixedParameterQtyConfig`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
}
export { FixedParameterQtyConfigService }