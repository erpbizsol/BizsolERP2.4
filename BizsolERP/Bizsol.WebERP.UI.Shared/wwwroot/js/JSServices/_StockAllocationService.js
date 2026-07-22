import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const StockAllocationService = {
    GetRawMaterialDropDown: function GetRawMaterialDropDown() {
        var URL = UrlService.API_ENDPOINT_StockAllocation + "/GetRawMaterialDropDown";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetBOMMasterDataOrderWise: function GetBOMMasterDataOrderWise(AccountMaster_Code, OrderNo, Code) {
        var URL = UrlService.API_ENDPOINT_StockAllocation + `/GetBOMMasterDataOrderWise?AccountMaster_Code=${AccountMaster_Code}&OrderNo=${encodeURIComponent(OrderNo)}&ProjectNo=&Code=${encodeURIComponent(Code)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetBOMMasterIdentificationNo: function GetBOMMasterIdentificationNo(BomTransactionOrderWise_Code, WidthFrom, WidthTo, ThicknessFrom, ThicknessTo, Grades) {
        var URL = UrlService.API_ENDPOINT_StockAllocation
            + `/GetBOMMasterIdentificationNo?BomTransactionOrderWise_Code=${BomTransactionOrderWise_Code}`
            + `&WidthFrom=${encodeURIComponent(WidthFrom ?? '')}`
            + `&WidthTo=${encodeURIComponent(WidthTo ?? '')}`
            + `&ThicknessFrom=${encodeURIComponent(ThicknessFrom ?? '')}`
            + `&ThicknessTo=${encodeURIComponent(ThicknessTo ?? '')}`
            + `&Grades=${encodeURIComponent(Grades ?? '')}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveStockAllocation: function SaveStockAllocation(saveData) {
        var URL = UrlService.API_ENDPOINT_StockAllocation + "/SaveStockAllocation";
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(saveData)).then(
            function (value) {
                return value;
            }
        );
    },
    GetStockAllocationList: function GetStockAllocationList() {
        var URL = UrlService.API_ENDPOINT_StockAllocation + `/GetStockAllocationList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRMInspectionRequestDetailsEdit: function GetRMInspectionRequestDetailsEdit(Code, BomTransactionOrderWise_Code) {
        var URL = UrlService.API_ENDPOINT_StockAllocation + `/GetStockAllocationDetailsEdit?Code=${Code}&BomTransactionOrderWise_Code=${BomTransactionOrderWise_Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    DeleteStockAllocation: function DeleteStockAllocation(Code, ReasonForDelete, Mode, IPAddress, Location) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_StockAllocation + `/DeleteStockAllocationDetailsByCode?Code=${Code}&UserMaster_Code=${userCode}&ReasonForDelete=${ReasonForDelete}&Mode=${Mode}&IPAddress=1&Location=1`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { StockAllocationService }
