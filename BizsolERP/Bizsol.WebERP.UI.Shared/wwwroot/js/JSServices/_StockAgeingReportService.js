import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const StockAgeingReportService = {
    GetStockAgeingReportList: function GetStockAgeingReportList(Category, ItemType, Warehouse, AsOnDate) {
        var URL = UrlService.API_DOCUMENT_StockAgeingReport + "/GetStockAgeingReportList?Category=" + Category + "&ItemType=" + ItemType + "&Warehouse=" + Warehouse + "&AsOnDate=" + AsOnDate;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
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
}

export { StockAgeingReportService }
