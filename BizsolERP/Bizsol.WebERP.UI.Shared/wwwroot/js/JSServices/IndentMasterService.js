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
     * @param {string}  Mode       - Procedure mode (LOCATE, SHOWDATA, DELETE, …)
     * @param {number}  [Code]     - Master-record code (default 0)
     * @param {string}  [FromDate] - ISO date yyyy-mm-dd
     * @param {string}  [ToDate]   - ISO date yyyy-mm-dd
     * @param {string}  [LocateType] - 'Default' | 'Detail'
     * @param {string}  [VerifyStatus] - optional status filter
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

    /**
     * LOCATE – Execute the F_LocateConfiguration-driven dynamic query.
     * @param {string} FromDate
     * @param {string} ToDate
     * @param {string} [LocateType='Default']
     * @param {string} [VerifyStatus='']
     */
    GetIndentList: function GetIndentList(FromDate, ToDate, LocateType, VerifyStatus) {
        return IndentMasterService.Getddl('LOCATE', 0, FromDate, ToDate, LocateType, VerifyStatus);
    },

    /**
     * DDL_LOCATETYPELIST – Returns { Code, LocateType } rows from
     * F_LocateConfiguration for 'Indent/Material Requirement (Store)'.
     * Used to populate the View-Type dropdown on the page.
     */
    GetLocateTypeList: function GetLocateTypeList() {
        return IndentMasterService.Getddl('DDL_LOCATETYPELIST', 0, '', '', '', '');
    },

    /**
     * GETLOCATECONFIG – Returns full F_LocateConfiguration rows
     * (LocateType, CodeFieldName, RowColorCodeString, SortOrder …).
     */
    GetLocateConfig: function GetLocateConfig() {
        return IndentMasterService.Getddl('GETLOCATECONFIG', 0, '', '', '', '');
    },

    /**
     * SHOWDATA – Returns master header + transaction detail rows for one Code.
     * @param {number} code
     */
    GetIndentById: function GetIndentById(code) {
        return IndentMasterService.Getddl('SHOWDATA', code);
    },

    /**
     * VERIFY – Set Verified status on all transactions of a master record.
     * @param {number} code
     * @param {string} verifyStatus   'Y' | 'R' | 'H'
     */
    VerifyIndent: function VerifyIndent(code, verifyStatus) {
        return IndentMasterService.Getddl('VERIFY', code, '', '', '', verifyStatus);
    },

    /**
     * DELETE – Remove an Indent master + its transactions.
     * @param {number} code
     */
    DeleteIndent: function DeleteIndent(code) {
        return IndentMasterService.Getddl('DELETE', code);
    },

    /**
     * DDL helpers
     */
    GetDepartmentList: function GetDepartmentList() {
        return IndentMasterService.Getddl('GETDEPARTMENTLIST');
    },

    GetItemList: function GetItemList() {
        return IndentMasterService.Getddl('GETITEMLIST');
    },
};

export { IndentMasterService };
