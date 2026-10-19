import { UrlService } from '../URL.js';
import { environment } from '../environment.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';
import { stripFormTypeQuotes } from '../OrderLoadFormTypeUtil.js';

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
        var resolved = stripFormTypeQuotes(formType);
        var URL = templeteReportApiBase()
            + '/GetTempleteList?FormType=' + encodeURIComponent(resolved || 'OrderLoad');
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
        var itemSizeMasterCodes = String(params.itemSizeMasterCodes || '').trim();
        var URL = templeteReportApiBase() + '/GetOrderLoadReport';
        var payload = {
            ReportType: params.reportType || '',
            TempleteMasterCode: params.templateCode || 0,
            FilterCondition: params.filterCondition || '',
            QueryCondition: params.queryCondition || '',
            FromDate: params.fromDate || '',
            ToDate: params.toDate || '',
            UserMasterCode: userMasterCode,
            MarketingManMasterCode: params.marketingManMasterCode || 0,
            GodownMaster_Code: params.godownMasterCode || 0,
            ItemGroupMaster_Code: params.itemGroupMasterCode || 0,
            ProcessMaster_Code: params.processMasterCode || 0,
            ItemTypeMaster_Code: params.itemTypeMasterCode || 0,
            ItemMaster_Code: params.itemMasterCode || 0,
            BuyerPOMaster_Code: params.buyerPOMasterCode || 0,
            ItemSizeMaster_Codes: itemSizeMasterCodes
        };

        // POST avoids IIS/browser URL length limits when ItemSizeMaster_Codes is large.
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload), { suppressErrorToast: true });
    },

    GetDdlOfOtherFilter: function GetDdlOfOtherFilter(objListTableName) {
        var URL = templeteReportApiBase()
            + '/GetDdlOfOtherFilter?ObjListTableName=' + encodeURIComponent(objListTableName || '');
        return promiseAjaxCallApi.CallAPI('GET', URL, '');
    },

    GetDefaultReportDates: function GetDefaultReportDates(templeteMasterCode, reportType) {
        var URL = templeteReportApiBase()
            + '/GetDefaultReportDates?TempleteMasterCode=' + encodeURIComponent(templeteMasterCode || 0)
            + '&ReportType=' + encodeURIComponent(reportType || '');
        return promiseAjaxCallApi.CallAPI('GET', URL, '', { suppressErrorToast: true });
    },

    GetResolvedFilterTokens: function GetResolvedFilterTokens() {
        var URL = templeteReportApiBase() + '/GetResolvedFilterTokens';
        return promiseAjaxCallApi.CallAPI('GET', URL, '', { suppressErrorToast: true });
    },

    /** Filter setup rows only (ControlType, ComboQuery, DisplayName, ...). Not dropdown option rows. */
    GetTemplateFilterConfiguration: function GetTemplateFilterConfiguration(templeteMasterCode) {
        var URL = templeteReportApiBase()
            + '/GetTemplateFilterConfiguration?TempleteMasterCode=' + encodeURIComponent(templeteMasterCode || 0);
        return promiseAjaxCallApi.CallAPI('GET', URL, '', { suppressErrorToast: true });
    },

    /**
     * Dropdown option rows for ONE Combo filter (F_TemplateFilterConfiguration.Code = configCode).
     * The API looks up ComboQuery / ComboDependsOn / ComboSortBy by configCode on the server and RUNS the
     * query in SQL (USP_WebAPI_GetTempleteReport @Mode = TEMPLATEFILTERCOMBODATA), returning [{ Code, Desp }, ...].
     * No SQL text is sent from the browser.
     *
     * filterSelectionJson: JSON array of the other combos' current selections, used to resolve
     * ComboDependsOn tokens such as {{Client Nature}}, e.g.
     *   '[{"configCode":68,"displayName":"Client Nature","selectedValue":"Store,Finish"}]'
     */
    GetTemplateFilterComboData: function GetTemplateFilterComboData(templeteMasterCode, configCode, filterSelectionJson) {
        var URL = templeteReportApiBase() + '/GetTemplateFilterComboData';
        var payload = {
            TempleteMasterCode: parseInt(templeteMasterCode, 10) || 0,
            ConfigCode: parseInt(configCode, 10) || 0,
            FilterSelectionJson: String(filterSelectionJson || '')
        };
        // POST: selections (many party names) can exceed URL length limits.
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload), { suppressErrorToast: true });
    },

    // ===================== Manage Template =====================

    // masterTemplete: 'Y' => master templates (ADD), 'N' => user templates (EDIT)
    GetManageTemplateList: function GetManageTemplateList(masterTemplete, formType) {
        var resolved = stripFormTypeQuotes(formType);
        var URL = templeteReportApiBase()
            + '/GetManageTemplateList'
            + '?FormType=' + encodeURIComponent(resolved || 'OrderLoad')
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
    },

    GetTemplateAmendmentDetails: function GetTemplateAmendmentDetails(options) {
        var opts = options || {};
        function amendmentNameQuery(value) {
            if (value === null || value === undefined) return '';
            return String(value);
        }
        function amendmentCodeQuery(value) {
            if (value === null || value === undefined || value === '') return 0;
            var n = parseInt(value, 10);
            return isNaN(n) ? 0 : n;
        }
        var URL = templeteReportApiBase()
            + '/GetTemplateAmendmentDetails'
            + '?MasterTableName=' + encodeURIComponent(amendmentNameQuery(opts.masterTableName))
            + '&MasterTableCode=' + encodeURIComponent(amendmentCodeQuery(opts.masterTableCode))
            + '&TransactionTableName=' + encodeURIComponent(amendmentNameQuery(opts.transactionTableName))
            + '&TransactionTableCode=' + encodeURIComponent(amendmentCodeQuery(opts.transactionTableCode))
            + '&AmendmentNo=' + encodeURIComponent(amendmentCodeQuery(opts.amendmentNo));
        return promiseAjaxCallApi.CallAPI('GET', URL, '', { suppressErrorToast: true });
    },

    GetCompanylist: function GetCompanylist() {
        return promiseAjaxCallApi.CallAPI('GET', templeteReportApiBase() + '/GetCompanylist', '');
    },

    PrintTemplateReport: function PrintTemplateReport(params) {
        var URL = `${UrlService.API_ENDPOINT_CRYSTAL}/PrintTemplateReport`;
        var procedureParametersAndValues = params.ProcedureParametersAndValues
            || params.procedureParametersAndValues
            || params.ProcedureParameters
            || params.procedureParameters
            || '';
        var payload = {
            ReportFileName: String(params.reportFileName || '').trim(),
            ProcedureParametersAndValues: procedureParametersAndValues,
        };
        return promiseAjaxCallApi.CallAPI('POST', URL, JSON.stringify(payload), { suppressErrorToast: true });
    }
};

export { OrderLoadReportService };
