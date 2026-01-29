import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const RollingPlanSheetService = {
    GetRollingPlanSheetList: function GetRollingPlanSheetList() {
        var URL = UrlService.API_DOCUMENT_RollingPlanSheet + "/GetRollingPlanSheetList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDateAndMillWiseReportList: function GetDateAndMillWiseReportList(ToDate) {
        var URL = UrlService.API_DOCUMENT_RollingPlanSheet + `/GetDateAndMillWiseReportList?Date= ${ToDate}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRollingPlanDetail: function GetRollingPlanDetail(Mode, BuyerPoMaster_Code) {
        var URL = UrlService.API_DOCUMENT_RollingPlanSheet + "/GetRollingPlanDetail?Mode=" + Mode + "&BuyerPoMaster_Code=" + BuyerPoMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    Verify: function Verify(Code) {
        var URL = UrlService.API_DOCUMENT_RollingPlanSheet + `/Verify?Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveData: function SaveData(Json) {
        var json_data = JSON.stringify(Json, null, 2);
        var URL = UrlService.API_DOCUMENT_RollingPlanSheet + `/SaveTokenVerify`;
        return promiseAjaxCallApi.CallAPI('POST', URL, json_data).then(
            function (value) {
                return value;
            }
        );
    },
    GetPipeStockRollingPlanList: function GetPipeStockRollingPlanList() {
        var URL = UrlService.API_DOCUMENT_RollingPlanSheet + "/GetPipeStockRollingPlanList";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetPendingPlansReportList: function GetPendingPlansReportList(FromDate, ToDate,Status,ItemMaster_Code) {
        var URL = UrlService.API_DOCUMENT_RollingPlanSheet + "/GetPendingPlansReportList?FromDate=" + FromDate + "&ToDate=" + ToDate + "&Status=" + Status + "&ItemMaster_Code=" + ItemMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRollingPlanNoDetail: function GetRollingPlanNoDetail(PlanNo) {
        var URL = UrlService.API_DOCUMENT_RollingPlanSheet + "/GetRollingPlanNoDetail?PlanNo=" + PlanNo;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRollingPlanItemName: function GetRollingPlanItemName() {
        var URL = UrlService.API_DOCUMENT_RollingPlanSheet + "/GetRollingPlanItemName";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRollingPlanProductionDetails: function GetRollingPlanProductionDetails(Code) {
        var URL = UrlService.API_DOCUMENT_RollingPlanSheet + `/GetRollingPlanProductionDetails?Code=${Code}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetRollingPlanAgeingReportList: function GetRollingPlanAgeingReportList(FromDate, ToDate) {
        var URL = UrlService.API_DOCUMENT_RollingPlanSheet + "/GetRollingPlanAgeingReportList?FromDate=" + FromDate + "&ToDate=" + ToDate;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { RollingPlanSheetService }
