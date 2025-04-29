import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const CRMReportsServices = {
    GetSalespersonList: function GetSalespersonList() {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_SALESPERSON + `/GetNestedMarketingManList?UserMaster_Code=` + userMasterCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    GetDealerList: function GetDealerList() {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_ACCOUNT_MASTER + `/GetNestedDealerList?UserMaster_Code=` + userMasterCode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },

    GetOrderTypeList: function GetOrderTypeList() {
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/GetEntryTypeList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },

    GetOrderStatusList: function GetOrderStatusList() {
        var URL = UrlService.API_ENDPOINT_VISIT_MASTER + `/GetOrderStatusList`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    GetFixedParameterConfigurationList: function GetFixedParameterConfigurationList() {
        var URL = UrlService.API_ENDPOINT_FixedParameter + `/GetFixedParameterConfiguration`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },

    GetDisplayNameForReportType: function GetDisplayNameForReportType() {
        var URL = UrlService.API_ENDPOINT_CRMReports + `/GetDisplayNameForReportType?ReportName=Visit Order Report`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    GetDailyVisitReport: function GetDailyVisitReport(fromDate, toDate, orderStatus, reportType, salesperson, dealerName, orderType, strCondition) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = `${UrlService.API_ENDPOINT_CRMReports}/GetDailyVisitReport` +
            `?FromDate=${encodeURIComponent(fromDate)}` +
            `&ToDate=${encodeURIComponent(toDate)}` +
            `&OrderStatus=${encodeURIComponent(orderStatus)}` +
            `&ReportType=${encodeURIComponent(reportType)}` +
            `&strCondition=${encodeURIComponent(strCondition)}` +
            `&OrderType=${encodeURIComponent(orderType)}` +
            `&DealerName=${encodeURIComponent(dealerName)}` +
            `&SalesPerson=${encodeURIComponent(salesperson)}` +
            `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

     GetReportTypelist: function GetReportTypelist(ModuleDesc) {
         var URL = UrlService.API_ENDPOINT_CRMReports + `/GetReportType?ModuleDesc=Web Stock Report`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetItemMasterDropDownlist: function GetItemMasterDropDownlist() {
        var URL = UrlService.API_ENDPOINT_PRODUCT + `/GetItemMasterDropDown`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetStockReportList: function GetStockReportList(ItemMaster_Code, ReportType) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = `${UrlService.API_ENDPOINT_CRMReports}/GetStockReport` +
            `?ItemMaster_Code=${encodeURIComponent(ItemMaster_Code)}` +
            `&txtReportType=${encodeURIComponent(ReportType)}` +
            `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDisplayNameForReportTypes: function GetDisplayNameForReportTypes() {
       var URL = UrlService.API_ENDPOINT_CRMReports + `/GetDisplayNameForReportType?ReportName=CheckIn CheckOut Report`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );

    },
    Getcheckinoutlist: function Getcheckinoutlist(fromDate, toDate, salesperson, reportType) {
        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = `${UrlService.API_ENDPOINT_CRMReports}/GetCheckInOutReport` +
            `?FromDate=${encodeURIComponent(fromDate)}` +
            `&ToDate=${encodeURIComponent(toDate)}` +
            `&SalesPerson=${encodeURIComponent(salesperson)}` +
            `&ReportType=${encodeURIComponent(reportType)}` +
            `&UserMaster_Code=${encodeURIComponent(userMasterCode)}`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetCRMOrderEntryConfig: function GetCRMOrderEntryConfig() {

        var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        var userMasterCode = authKeyData.UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_CRM_ORDERENTRY_CONFIG + `/GetCRMFixedParameterConfig`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetFixedParameterQtyConfig: function GetFixedParameterQtyConfig() {

        var URL = UrlService.API_ENDPOINT_QTY_CONFIG + `/GetFixedParameterQtyConfig`;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetUserList: function GetUserList() {
        let url = UrlService.API_UserMODULE + `/GetUserList`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },

}

export { CRMReportsServices }