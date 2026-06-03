import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const GRNPaymentApprovalService = {

    GetGRNPaymentApprovalList: function GetGRNPaymentApprovalList() {
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry + `/GetGRNPaymentApprovalList`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },


    GetGRNPaymentApprovalByCode: function GetGRNPaymentApprovalByCode(Code) {
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry +
            `/GetGRNPaymentApprovalByCode?Code=${encodeURIComponent(Code)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },

    SaveGRNPaymentApproval: function SaveGRNPaymentApproval(payload) {
        let json_data = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry + `/SaveGRNPaymentApproval`;
        return promiseAjaxCallApi.CallAPI('POST', url, json_data)
            .then(function (value) {
                return value;
            });
    },

    DeleteGRNPaymentApproval: function DeleteGRNPaymentApproval(Code, ReasonForDelete, IPAddress, Location) {
        let authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
        let userMasterCode = authKeyData.UserMaster_Code;
        let ip = IPAddress != null ? encodeURIComponent(IPAddress) : '';
        let loc = Location != null ? encodeURIComponent(Location) : '';
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry +
            `/DeleteGRNPaymentApproval?Code=${encodeURIComponent(Code)}` +
            `&UserMaster_Code=${encodeURIComponent(userMasterCode)}` +
            `&ReasonForDelete=${encodeURIComponent(ReasonForDelete || '')}` +
            `&IPAddress=${ip}&Location=${loc}`;
        return promiseAjaxCallApi.CallAPI('POST', url, '')
            .then(function (value) {
                return value;
            });
    },

    GetVendor: function GetVendor() {
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry + `/GetVendor`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },

    GetBillDetails: function GetBillDetails(PartyMaster_Code, ProjectMaster_Code, SubProjectMaster_Code) {
        const toQuery = (x) => {
            if (x === undefined || x === null) return '0';
            const s = String(x).trim();
            return s === '' ? '0' : s;
        };
        const pmc = toQuery(ProjectMaster_Code);
        const smc = toQuery(SubProjectMaster_Code);
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry +
            `/GetBillDetails?PartyMaster_Code=${encodeURIComponent(PartyMaster_Code || '')}` +
            `&ProjectMaster_Code=${encodeURIComponent(pmc)}` +
            `&SubProjectMaster_Code=${encodeURIComponent(smc)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },

    GetBankPayment: function GetBankPayment() {
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry + `/GetBankPayment`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },
    GetMarketingManMaster: function GetMarketingManMaster() {
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry + `/GetMarketingManMaster`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },
    GetProjectMasterList: function GetProjectMasterList() {
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry + `/GetProjectMasterList`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },
    GetSubProjectMasterList: function GetSubProjectMasterList(ProjectMaster_Code) {
        const code = ProjectMaster_Code != null && ProjectMaster_Code !== undefined
            ? String(ProjectMaster_Code).trim()
            : '';
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry +
            `/GetSubProjectMasterList?ProjectMaster_Code=${encodeURIComponent(code)}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },
    /** Alias used by GRN modal / legacy callers — same endpoint as {@link GetSubProjectMasterList}. */
    GetSubProjectMaster: function GetSubProjectMaster(ProjectMaster_Code) {
        return GRNPaymentApprovalService.GetSubProjectMasterList(ProjectMaster_Code);
    },
    GetBankList: function GetBankList() {
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry + `/GetBankList`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },
    GetCompany: function GetCompany() {
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry + `/GetCompany`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },
    GetList: function GetList() {
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry + `/GetList`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },
    GetProjectCategory: function GetProjectCategory() {
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry + `/GetProjectCategory`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },
    GetPOList: function GetPOList(Code) {
        const code = Code !== undefined && Code !== null ? String(Code).trim() : '';
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry + `/GetPOList?Code=${encodeURIComponent(code || '0')}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },
    GetPOWISELIST: function GetPOWISELIST(POCode) {
        const code = POCode !== undefined && POCode !== null ? String(POCode).trim() : '0';
        let url = UrlService.API_ENDPOINT_GRNPaymentEntry + `/GetPOWISELIST?POCode=${encodeURIComponent(code || '0')}`;
        return promiseAjaxCallApi.CallAPI('GET', url, null)
            .then(function (value) {
                return value;
            });
    },
};

export { GRNPaymentApprovalService };
