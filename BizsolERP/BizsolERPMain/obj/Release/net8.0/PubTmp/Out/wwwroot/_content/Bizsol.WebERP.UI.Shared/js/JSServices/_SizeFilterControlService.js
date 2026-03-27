import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const SizeFilterControlService = {
    GetParameterMasterFilter: function GetParameterMasterFilter(ItemMaster_Code) {
        let url = UrlService.API_ENDPOINT_ItemSize + "/GetParameterMasterFilter?ItemMaster_Codes=" + encodeURIComponent(ItemMaster_Code);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetItemParameterValueMasterFilter: function GetItemParameterValueMasterFilter(ItemParameterMaster_Code) {
        let url = UrlService.API_ENDPOINT_ItemSize + "/GetItemParameterValueMasterFilter?ItemParameterMaster_Code=" + ItemParameterMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetItemSizeMasterCodes: function GetItemSizeMasterCodes(filterPayload) {
        let url = UrlService.API_ENDPOINT_ItemSize + "/GetItemSizeMasterCodes";
        return promiseAjaxCallApi.CallAPI('POST', url, JSON.stringify(filterPayload)).then(
            function (value) {
                return value;
            });
    },
};



export { SizeFilterControlService }
