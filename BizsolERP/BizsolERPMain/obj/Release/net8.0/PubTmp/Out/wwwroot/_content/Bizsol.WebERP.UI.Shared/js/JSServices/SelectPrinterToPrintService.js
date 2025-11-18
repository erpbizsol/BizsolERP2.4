import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const SelectPrinterToPrintService = {
    
    GetPrinterList: function GetPrinterList() {

        let url = `${UrlService.API_ENDPOINT_SelectPrinterToPrint}/GetPrinterList`;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    USP_RPT_PrintID: function USP_RPT_PrintID(IdOrBundle) {

        let url = `${UrlService.API_ENDPOINT_SelectPrinterToPrint}/USP_RPT_PrintID?IdOrBundle=${IdOrBundle}`;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    PrintToPrinter: function PrintToPrinter(PayLoad) {

        let url = `${UrlService.API_ENDPOINT_SelectPrinterToPrint}/PrintToPrinter`;

        return promiseAjaxCallApi.CallAPI('POST', url, PayLoad).then(
            function (value) {
                return value;
            }
        );
    },
    
}



export { SelectPrinterToPrintService }

