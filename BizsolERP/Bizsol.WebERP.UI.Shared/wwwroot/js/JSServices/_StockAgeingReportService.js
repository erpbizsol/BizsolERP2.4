import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const StockAgeingReportService = {
    GetStockAgeingReportList: function GetStockAgeingReportList(Payload) {
        var URL = UrlService.API_DOCUMENT_StockAgeingReport + "/GetStockAgeingReportList";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(Payload)).then(
            function (value) {
                return value;
            }
        );
    },
    GetCategoryList: function GetCategoryList() {
        var URL = UrlService.API_DOCUMENT_StockAgeingReport + "/GetCategoryList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetItemTypeList: function GetItemTypeList() {
        var URL = UrlService.API_DOCUMENT_StockAgeingReport + "/GetItemTypeList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetWarehouseList: function GetWarehouseList() {
        var URL = UrlService.API_DOCUMENT_StockAgeingReport + "/GetWarehouseList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetReportOptionList: function GetReportOptionList() {
        var URL = UrlService.API_DOCUMENT_StockAgeingReport + "/GetReportOptionList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetItemNameList: function GetItemNameList(Category, ItemType) {
        var URL = UrlService.API_DOCUMENT_StockAgeingReport + "/GetItemNameList?Category=" + Category + "&ItemType=" + ItemType;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetParameterMasterFilter: function GetParameterMasterFilter(ItemMaster_Code) {
        var URL = UrlService.API_ENDPOINT_ItemSize + "/GetParameterMasterFilter?ItemMaster_Codes=" + encodeURIComponent(ItemMaster_Code);
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetStockData: function GetStockData(Level, Code, GodownMasterCode, FilterPayload) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var payload = FilterPayload || {};
        payload.level            = Level;
        payload.code             = Code;
        payload.godownMasterCode = GodownMasterCode;
        var URL = UrlService.API_DOCUMENT_StockAgeingReport + '/GetStockWithChart';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload)).then(
            function (value) {
                return value;
            }
        );
    },

}

export { StockAgeingReportService }
