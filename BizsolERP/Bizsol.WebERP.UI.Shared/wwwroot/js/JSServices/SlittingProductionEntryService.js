import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const SlittingProductionEntryService = {
    GetSlittingPlanOrEntrySummary: function GetSlittingPlanOrEntrySummary(date, dateTo, filterType) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/GetSlittingPlanOrEntrySummary?Date=" + date + "&ToDate=" + dateTo + "&FilterType=" + filterType;
       
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetFixedParaMeter: function GetFixedParaMeter() {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/GetFixedParaMeter";
        
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
   
    
    GetSlittingProductionEntryDDl: function GetSlittingProductionEntryDDl(ddlType, Code) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/GetSlittingProductionEntryDDl?ddlType=" + ddlType + "&Code=" + Code;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetChildIDsByParantIDToPrintID: function GetChildIDsByParantIDToPrintID(Mode, ParantID) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/GetChildIDsByParantIDToPrintID?Mode=" + Mode + "&IdentificationNo=" + encodeURIComponent(ParantID);
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    CheckEntryAllowed: function CheckEntryAllowed(ID) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/CheckEntryAllowed?IdentificationNo=" + encodeURIComponent(ID);
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    CheckStockValidate: function CheckStockValidate(CheckStockValidatepayLoad) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/CheckStockValidate";
        //alert(url);
        return promiseAjaxCallApi.CallAPI('POST', url, CheckStockValidatepayLoad).then(
            function (value) {
                return value;
            }
        );
    },
    SaveSlittingEntry: function SaveSlittingEntry(SaveSlittingPayLoad) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/SaveSlittingEntry";
        //alert(url);
        return promiseAjaxCallApi.CallAPI('POST', url, SaveSlittingPayLoad).then(
            function (value) {
                return value;
            }
        );
    },
    PrintIdentificationNos: function PrintIdentificationNos( tableName,  TableIdentificationNo) {
        
        let url = `${UrlService.API_ENDPOINT_CRYSTAL}/PrintIdentificationNos?tableName=${encodeURIComponent(tableName)}&TableIdentificationNo=${TableIdentificationNo}`;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetSCaleWeight: function GetSCaleWeight(MachineIP) {

        let url = `${UrlService.API_ENDPOINT_SlittingEntry}/GetSCaleWeight?MachineIP=${encodeURIComponent(MachineIP)}`;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    StartTimeUpdated: function StartTimeUpdated(SlittingPlanMaster_Code) {

        let url = UrlService.API_ENDPOINT_SlittingEntry + "/StartTimeUpdated?SlittingPlanMaster_Code=" + SlittingPlanMaster_Code;

        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
}



export { SlittingProductionEntryService }

