import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const GateEntryService = {
    GateEntryDate: function GateEntryDate() {
        var url = UrlService.API_ENDPOINT_GateEntryMaster + "/GateEntryDate";
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
}
export { GateEntryService }