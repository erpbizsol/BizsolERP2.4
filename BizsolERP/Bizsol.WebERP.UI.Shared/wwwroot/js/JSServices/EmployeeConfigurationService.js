import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const EmployeeConfigurationService = {
   
    GetPrefixOptionList: function GetPrefixOptionList() {
        let url = UrlService.API_ENDPOINT_EmployeeMaster + `/GetPrefixOptionList`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDuplicateCardNoOptionList: function GetDuplicateCardNoOptionList() {
        let url = UrlService.API_ENDPOINT_EmployeeMaster + `/GetDuplicateCardNoOptionList`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetConfigEmployeeMaster: function GetConfigEmployeeMaster() {
        let url = UrlService.API_ENDPOINT_EmployeeMaster + `/GetConfigEmployeeMaster`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveConfigEmployeeMaster: function SaveConfigEmployeeMaster(Data) {
        var json_data = JSON.stringify(Data, null, 2);
        let url = UrlService.API_ENDPOINT_EmployeeMaster + `/SaveConfigEmployeeMaster`;
        return promiseAjaxCallApi.CallAPI('POST', url, json_data).then(
            function (value) {
                return value;
            }
        );
    },
}

export { EmployeeConfigurationService }