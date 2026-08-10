import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const ProductionOrderService = {
    GetPendingList: function GetPendingList(QueryCondition, FrmType) {
        const url = UrlService.API_ENDPOINT_ProductionOrder
            + '/GetPendingList?QueryCondition=' + encodeURIComponent(QueryCondition || '')
            + '&FrmType=' + encodeURIComponent(FrmType || '');
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },

    GetPendingCount: function GetPendingCount(QueryCondition, FrmType) {
        const url = UrlService.API_ENDPOINT_ProductionOrder
            + '/GetPendingCount?QueryCondition=' + encodeURIComponent(QueryCondition || '')
            + '&FrmType=' + encodeURIComponent(FrmType || '');
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },

    GetMaster: function GetMaster(WorkOrderPlanMaster_Code) {
        let userCode = 0;
        try {
            userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        } catch (e) { /* ignore */ }
        const url = UrlService.API_ENDPOINT_ProductionOrder
            + '/GetMaster?WorkOrderPlanMaster_Code=' + encodeURIComponent(WorkOrderPlanMaster_Code)
            + '&UserMaster_Code=' + encodeURIComponent(userCode);
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) {
            return value;
        });
    },

    GetDetail: function GetDetail(WorkOrderPlanMaster_Code) {
        const url = UrlService.API_ENDPOINT_ProductionOrder
            + '/GetDetail?WorkOrderPlanMaster_Code=' + encodeURIComponent(WorkOrderPlanMaster_Code);
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) {
            return value;
        });
    },

    GetShowData: function GetShowData(WorkOrderPlanMaster_Code) {
        let userCode = 0;
        try {
            userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        } catch (e) { /* ignore */ }
        const url = UrlService.API_ENDPOINT_ProductionOrder
            + '/GetShowData?WorkOrderPlanMaster_Code=' + encodeURIComponent(WorkOrderPlanMaster_Code)
            + '&UserMaster_Code=' + encodeURIComponent(userCode);
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) {
            return value;
        });
    },

    ApprovedOrVerify: function ApprovedOrVerify(WorkOrderPlanMaster_Code, QueryCondition, FrmType) {
        let userCode = 0;
        let companyCode = 0;
        try {
            userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        } catch (e) { /* ignore */ }
        try {
            const ud = JSON.parse(sessionStorage.getItem('UserDetails'));
            if (ud && ud[0] && ud[0].CompanyCode) companyCode = ud[0].CompanyCode;
        } catch (e) { /* ignore */ }
        const url = UrlService.API_ENDPOINT_ProductionOrder
            + '/ApprovedOrVerify?WorkOrderPlanMaster_Code=' + encodeURIComponent(WorkOrderPlanMaster_Code)
            + '&UserMaster_Code=' + encodeURIComponent(userCode)
            + '&QueryCondition=' + encodeURIComponent(QueryCondition || '')
            + '&FrmType=' + encodeURIComponent(FrmType || '')
            + '&CompanyCode=' + encodeURIComponent(companyCode);
        return promiseAjaxCallApi.CallAPI('POST', url, '').then(function (value) {
            return value;
        });
    },

    GetWarehouseList: function GetWarehouseList() {
        const url = UrlService.API_ENDPOINT_ProductionOrder + '/GetWarehouseList';
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },

    GetProcessList: function GetProcessList() {
        const url = UrlService.API_ENDPOINT_ProductionOrder + '/GetProcessList';
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },

    GetMachineList: function GetMachineList(ProcessMaster_Code) {
        const url = UrlService.API_ENDPOINT_ProductionOrder
            + '/GetMachineList?ProcessMaster_Code=' + encodeURIComponent(ProcessMaster_Code || 0);
        return promiseAjaxCallApi.CallAPI('GET', url, '').then(function (value) {
            return value;
        });
    },
};

export { ProductionOrderService };
