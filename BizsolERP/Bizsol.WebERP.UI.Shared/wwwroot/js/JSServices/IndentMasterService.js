import { UrlService }        from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

/**
 * IndentMasterService
 * All API calls for Indent / Material Requirement (Store).
 * The backend procedure is USP_WebAPI_IndentMaster.
 */
const IndentMasterService = {

    /**
     * Generic GET helper that maps every parameter to a query-string key.
     */
    Getddl: function Getddl(Mode, Code, FromDate, ToDate, LocateType, VerifyStatus) {
        Code         = Code         || 0;
        FromDate     = FromDate     || '';
        ToDate       = ToDate       || '';
        LocateType   = LocateType   || 'Default';
        VerifyStatus = VerifyStatus || '';

        let url = UrlService.API_ENDPOINT_IndentMaster
                + `/Getddl?Mode=${encodeURIComponent(Mode)}`
                + `&Code=${encodeURIComponent(Code)}`;

        if (FromDate)     url += `&FromDate=${encodeURIComponent(FromDate)}`;
        if (ToDate)       url += `&ToDate=${encodeURIComponent(ToDate)}`;
        if (LocateType)   url += `&LocateType=${encodeURIComponent(LocateType)}`;
        if (VerifyStatus) url += `&VerifyStatus=${encodeURIComponent(VerifyStatus)}`;

        return promiseAjaxCallApi.CallAPI('GET', url, '').then(value => value);
    },

    GetIndentList: function GetIndentList(FromDate, ToDate, LocateType, VerifyStatus) {
        return IndentMasterService.Getddl('LOCATE', 0, FromDate, ToDate, LocateType, VerifyStatus);
    },

    GetLocateTypeList: function GetLocateTypeList() {
        return IndentMasterService.Getddl('DDL_LOCATETYPELIST', 0, '', '', '', '');
    },

    GetLocateConfig: function GetLocateConfig() {
        return IndentMasterService.Getddl('GETLOCATECONFIG', 0, '', '', '', '');
    },

    GetConfig: function GetConfig() {
        return IndentMasterService.Getddl('GETCONFIG');
    },

    GetNextIndentNo: function GetNextIndentNo() {
        return IndentMasterService.Getddl('GETNEXTINDENTNO');
    },

    GetWarehouseList: function GetWarehouseList() {
        return IndentMasterService.Getddl('DDL_WAREHOUSELIST');
    },

    GetCategoryList: function GetCategoryList() {
        return IndentMasterService.Getddl('DDL_CATEGORYLIST');
    },

    GetUserList: function GetUserList() {
        return IndentMasterService.Getddl('DDL_USERLIST');
    },

    GetDepartmentList: function GetDepartmentList() {
        return IndentMasterService.Getddl('GETDEPARTMENTLIST');
    },

    GetVendorList: function GetVendorList() {
        return IndentMasterService.Getddl('DDL_VENDORLIST');
    },

    GetCurrencyList: function GetCurrencyList() {
        return IndentMasterService.Getddl('DDL_CURRENCYLIST');
    },

    GetUOMList: function GetUOMList() {
        return IndentMasterService.Getddl('DDL_UOMLIST');
    },

    GetDivisionList: function GetDivisionList() {
        return IndentMasterService.Getddl('DDL_DIVISIONLIST');
    },

    GetSubDivisionList: function GetSubDivisionList() {
        return IndentMasterService.Getddl('DDL_SUBDIVISIONLIST');
    },

    GetSubDepartmentList: function GetSubDepartmentList(departmentCode) {
        return IndentMasterService.Getddl('DDL_SUBDEPARTMENTLIST', departmentCode || 0);
    },

    GetItemStock: function GetItemStock(itemCode) {
        return IndentMasterService.Getddl('GETITEMSTOCK', itemCode || 0);
    },

    GetItemList: function GetItemList(categoryCode) {
        /* API @Code is INT — category names like "Consumables" must not be sent. */
        var code = 0;
        if (categoryCode !== undefined && categoryCode !== null && String(categoryCode).trim() !== '') {
            var s = String(categoryCode).trim();
            if (/^\d+$/.test(s)) {
                code = parseInt(s, 10);
            }
        }
        return IndentMasterService.Getddl('GETITEMLIST', code);
    },

    GetIndentById: function GetIndentById(code) {
        return IndentMasterService.Getddl('SHOWDATA', code);
    },

    VerifyIndent: function VerifyIndent(code, verifyStatus) {
        return IndentMasterService.Getddl('VERIFY', code, '', '', '', verifyStatus);
    },

    DeleteIndent: function DeleteIndent(code) {
        return IndentMasterService.Getddl('DELETE', code);
    },

    /**
     * SAVE – POST XML payload. API should call USP_WebAPI_IndentMaster
     * with Mode='SAVE' and @OtherParameter = payload XML.
     */
    SaveIndentMaster: function SaveIndentMaster(payload) {
        let url = UrlService.API_ENDPOINT_IndentMaster + `/SaveIndentMaster`;
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(value => value);
    },
};

export { IndentMasterService };
