import { UrlService }        from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

function authUserCode() {
    try {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        return authKeyData.UserMaster_Code || 0;
    } catch (e) {
        return 0;
    }
}

/**
 * TODConfigurationMasterService
 * All API calls for TOD (Turn Over Discount) Configuration.
 * The backend procedure is USP_WebAPI_TODConfigurationMaster.
 */
const TODConfigurationMasterService = {

    /**
     * Generic GET helper that maps every parameter to a query-string key.
     */
    Getddl: function Getddl(Mode, Code, FromDate, ToDate, LocateType, OtherParameter) {
        Code           = Code           || 0;
        FromDate       = FromDate       || '';
        ToDate         = ToDate         || '';
        LocateType     = LocateType     || 'Default';
        OtherParameter = OtherParameter || '';

        let url = UrlService.API_ENDPOINT_TODConfigurationMaster
                + `/Getddl?Mode=${encodeURIComponent(Mode)}`
                + `&Code=${encodeURIComponent(Code)}`
                + `&UserMaster_Code=${encodeURIComponent(authUserCode())}`;

        if (FromDate)       url += `&FromDate=${encodeURIComponent(FromDate)}`;
        if (ToDate)         url += `&ToDate=${encodeURIComponent(ToDate)}`;
        if (LocateType)     url += `&LocateType=${encodeURIComponent(LocateType)}`;
        if (OtherParameter) url += `&OtherParameter=${encodeURIComponent(OtherParameter)}`;

        return promiseAjaxCallApi.CallAPI('GET', url, '').then(value => value);
    },

    /** LOCATE has no date filter — the screen always shows every configuration. */
    GetTODConfigurationList: function GetTODConfigurationList() {
        return TODConfigurationMasterService.Getddl('LOCATE');
    },

    GetConfig: function GetConfig() {
        return TODConfigurationMasterService.Getddl('GETCONFIG');
    },

    GetPeriodicityList: function GetPeriodicityList() {
        return TODConfigurationMasterService.Getddl('DDL_PERIODICITYLIST');
    },

    GetMonthList: function GetMonthList() {
        return TODConfigurationMasterService.Getddl('DDL_MONTHLIST');
    },

    /**
     * marketingManCode > 0 keeps only the parties mapped to that marketing man.
     */
    GetPartyList: function GetPartyList(marketingManCode) {
        var code = parseInt(marketingManCode, 10);
        return TODConfigurationMasterService.Getddl('DDL_PARTYLIST', isNaN(code) ? 0 : code);
    },

    GetItemList: function GetItemList(typeCode) {
        /* API @Code is INT — category names must not be sent. */
        var code = 0;
        if (typeCode !== undefined && typeCode !== null && String(typeCode).trim() !== '') {
            var s = String(typeCode).trim();
            if (/^\d+$/.test(s)) code = parseInt(s, 10);
        }
        return TODConfigurationMasterService.Getddl('GETITEMLIST', code);
    },

    /** ItemParameterMaster dropdown: Code, Desp, DataType */
    GetSizeParameterList: function GetSizeParameterList() {
        return TODConfigurationMasterService.Getddl('GETSIZEPARAMETERLIST');
    },

    /** ItemParameterValueMaster list for a parameter. @Code = ItemParameterMaster_Code */
    GetSizeParameterValueList: function GetSizeParameterValueList(itemParameterMasterCode) {
        var code = parseInt(itemParameterMasterCode, 10);
        return TODConfigurationMasterService.Getddl('GETSIZEPARAMETERVALUELIST', isNaN(code) ? 0 : code);
    },

    GetTODConfigurationById: function GetTODConfigurationById(code) {
        return TODConfigurationMasterService.Getddl('SHOWDATA', code);
    },

    DeleteTODConfiguration: function DeleteTODConfiguration(code) {
        return TODConfigurationMasterService.Getddl('DELETE', code);
    },

    /**
     * SAVE – POST XML payload. API calls USP_WebAPI_TODConfigurationMaster
     * with Mode='SAVE' and @OtherParameter = payload XML.
     */
    SaveTODConfigurationMaster: function SaveTODConfigurationMaster(payload) {
        let url = UrlService.API_ENDPOINT_TODConfigurationMaster
                + `/SaveTODConfigurationMaster?UserMaster_Code=${encodeURIComponent(authUserCode())}`;
        return promiseAjaxCallApi.CallAPI('POST', url, payload).then(value => value);
    },
};

export { TODConfigurationMasterService };
