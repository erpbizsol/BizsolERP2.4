import { UrlService } from '../URL.js';
import { environment } from '../environment.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function templeteReportApiBase() {
    if (UrlService.API_ENDPOINT_TEMPLETE_REPORT) {
        return UrlService.API_ENDPOINT_TEMPLETE_REPORT;
    }
    var base = (UrlService.BASE_URL || environment.BASE_URL || '').replace(/\/$/, '');
    return base + '/OrderLoadReport';
}

function getAuthUserCode() {
    try {
        var auth = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        return auth.UserMaster_Code || 0;
    } catch (e) {
        return 0;
    }
}

const OrderLoadReportService = {

    GetTempleteList: function GetTempleteList(formType) {
        var URL = templeteReportApiBase()
            + '/GetTempleteList?FormType=' + encodeURIComponent(formType || 'OrderLoad');
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetLevel: function GetLevel(templeteMasterCode) {
        var URL = templeteReportApiBase()
            + '/GetLevel?templeteMasterCode=' + encodeURIComponent(templeteMasterCode || 0)
            + '&Code=' + encodeURIComponent(templeteMasterCode || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetOrderLoadReport: function GetOrderLoadReport(params) {
        var userMasterCode = params.userMasterCode || getAuthUserCode();
        var URL = templeteReportApiBase()
            + '/GetOrderLoadReport'
            + '?ReportType=' + encodeURIComponent(params.reportType || '')
            + '&TempleteMasterCode=' + encodeURIComponent(params.templateCode || 0)
            + '&FilterCondition=' + encodeURIComponent(params.filterCondition || '')
            + '&QueryCondition=' + encodeURIComponent(params.queryCondition || '')
            + '&FromDate=' + encodeURIComponent(params.fromDate || '')
            + '&ToDate=' + encodeURIComponent(params.toDate || '')
            + '&UserMasterCode=' + encodeURIComponent(userMasterCode)
            + '&MarketingManMasterCode=' + encodeURIComponent(params.marketingManMasterCode || 0)
            + '&GodownMaster_Code=' + encodeURIComponent(params.godownMasterCode || 0)
            + '&ItemGroupMaster_Code=' + encodeURIComponent(params.itemGroupMasterCode || 0)
            + '&ProcessMaster_Code=' + encodeURIComponent(params.processMasterCode || 0)
            + '&ItemTypeMaster_Code=' + encodeURIComponent(params.itemTypeMasterCode || 0)
            + '&ItemMaster_Code=' + encodeURIComponent(params.itemMasterCode || 0)
            + '&BuyerPOMaster_Code=' + encodeURIComponent(params.buyerPOMasterCode || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetNestedMarketingManList: function GetNestedMarketingManList(userMasterCode, marketingManMasterCode) {
        var URL = templeteReportApiBase()
            + '/GetNestedMarketingManList'
            + '?UserMaster_Code=' + encodeURIComponent(userMasterCode || getAuthUserCode())
            + '&MarketingManMaster_Code=' + encodeURIComponent(marketingManMasterCode || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetGodownMaster: function GetGodownMaster() {
        return promiseAjaxCallApi.CallAPI('GET', templeteReportApiBase() + '/GetGodownMaster', '');
    },

    GetItemGroupMaster: function GetItemGroupMaster() {
        return promiseAjaxCallApi.CallAPI('GET', templeteReportApiBase() + '/GetItemGroupMaster', '');
    },

    GetProcessMaster: function GetProcessMaster() {
        return promiseAjaxCallApi.CallAPI('GET', templeteReportApiBase() + '/GetProcessMaster', '');
    },

    GetItemTypeMaster: function GetItemTypeMaster() {
        return promiseAjaxCallApi.CallAPI('GET', templeteReportApiBase() + '/GetItemTypeMaster', '');
    },

    GetItemMaster: function GetItemMaster() {
        return promiseAjaxCallApi.CallAPI('GET', templeteReportApiBase() + '/GetItemMaster', '');
    },

    GetOrderNo: function GetOrderNo() {
        return promiseAjaxCallApi.CallAPI('GET', templeteReportApiBase() + '/GetOrderNo', '');
    },

    GetOtherFilterDetails: function GetOtherFilterDetails(otherFilterQuery, templateCode, otherFilterNo) {
        var URL = templeteReportApiBase()
            + '/GetOtherFilterDetails'
            + '?TempleteMasterCode=' + encodeURIComponent(templateCode || 0)
            + '&OtherFilterNo=' + encodeURIComponent(otherFilterNo || 0)
            + '&OtherFilterQuery=' + encodeURIComponent(otherFilterQuery || '');
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetDdlOfOtherFilter: function GetDdlOfOtherFilter(objListTableName) {
        var URL = templeteReportApiBase()
            + '/GetDdlOfOtherFilter?ObjListTableName=' + encodeURIComponent(objListTableName || '');
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    // ===================== Manage Template =====================

    // masterTemplete: 'Y' => master templates (ADD), 'N' => user templates (EDIT)
    GetManageTemplateList: function GetManageTemplateList(masterTemplete, formType) {
        var URL = templeteReportApiBase()
            + '/GetManageTemplateList'
            + '?FormType=' + encodeURIComponent(formType || 'OrderLoad')
            + '&MasterTemplete=' + encodeURIComponent(masterTemplete || 'Y');
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetTemplateTransaction: function GetTemplateTransaction(templeteMasterCode) {
        var URL = templeteReportApiBase()
            + '/GetTemplateTransaction?TempleteMasterCode=' + encodeURIComponent(templeteMasterCode || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    SaveTemplate: function SaveTemplate(payload) {
        var body = Object.assign({ UserMaster_Code: getAuthUserCode() }, payload || {});
        var URL = templeteReportApiBase() + '/SaveTemplate';
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(body));
    },

    DeleteTemplate: function DeleteTemplate(templeteMasterCode) {
        var URL = templeteReportApiBase()
            + '/DeleteTemplate?TempleteMasterCode=' + encodeURIComponent(templeteMasterCode || 0);
        return promiseAjaxCallApi.CallAPI('POST', URL, '');
    }
};

export { OrderLoadReportService };
