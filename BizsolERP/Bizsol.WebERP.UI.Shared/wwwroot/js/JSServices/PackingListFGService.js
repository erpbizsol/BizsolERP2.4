import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const PackingListFGService = {
    GetPackingListWebLocate: function GetPackingListWebLocate(date,dateTo) {

        let url = UrlService.API_ENDPOINT_PackingListFG + "/GetPackingListWebLocate?Date=" + date + "&ToDate=" + dateTo;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    }
}



export { PackingListFGService }
//window.SizeControlService = SizeControlService;
