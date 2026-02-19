import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const ObjectListControlService = {
    GetItemMultipleSelectLOV: function GetItemMultipleSelectLOV(payload) {
        var url = UrlService.API_ENDPOINT_ItemSize + '/GetItemMultipleSelectLOV';
        return promiseAjaxCallApi.CallAPI('POST', url, JSON.stringify(payload)).then(
            function (value) {
                return value;
            }
        );
    }
};

export { ObjectListControlService };
