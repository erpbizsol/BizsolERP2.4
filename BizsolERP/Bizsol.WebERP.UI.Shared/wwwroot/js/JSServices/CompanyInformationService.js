import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

/**
 * Client mirror of Bizsol.WebERP.DAL.Marketing.Masters.Service.CompanyParameterService
 * (stored procedure USP_WebAPI_CompanyParameter).
 *
 * Save body matches CompanyParameterSaveRequest:
 * Code, CompanyName, CompanyAliasName, OfficeAddress1, GSTNo, OfficePhones1, EMail, WebSite, UnitCode, UserMaster_Code
 *
 * Save/Delete responses: Status ('Y'/'N'), Message (or Msg from SP), and Save returns Code after insert (output param).
 */

function ensureProcedureSuccess(response) {
    if (response == null || typeof response !== 'object') return response;
    if (!Object.prototype.hasOwnProperty.call(response, 'Status') && !Object.prototype.hasOwnProperty.call(response, 'status')) {
        return response;
    }
    const st = response.Status !== undefined ? response.Status : response.status;
    if (String(st).toUpperCase() === 'Y') return response;

    const msg =
        response.Message || response.Msg || response.message || response.msg || 'Operation failed.';
    const err = new Error(msg);
    err.apiResponse = response;
    throw err;
}

const CompanyInformationService = {
    /**
     * Maps to GetCompanyParameterList — Mode GETLIST
     */
    GetCompanyParameterList: function GetCompanyParameterList() {
        const URL = UrlService.API_ENDPOINT_CompanyInformation + '/GetList';
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /**
     * Maps to GetCompanyParameterByCode — Mode GETBYCODE
     */
    GetCompanyParameterByCode: function GetCompanyParameterByCode(code) {
        const URL =
            UrlService.API_ENDPOINT_CompanyInformation +
            '/GetByCode?Code=' +
            encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', URL, '').then(function (value) {
            return value;
        });
    },

    /**
     * Maps to SaveCompanyParameter — Mode SAVE (Code is input/output; returns new Code on insert)
     * @param {Object} request - CompanyParameterSaveRequest
     */
    SaveCompanyParameter: function SaveCompanyParameter(request) {
        const URL = UrlService.API_ENDPOINT_CompanyInformation + '/Save';
        return promiseAjaxCallApi
            .CallAPI('POST', URL, JSON.stringify(request))
            .then(function (value) {
                return ensureProcedureSuccess(value);
            });
    },

    /**
     * Maps to DeleteCompanyParameter — Mode DELETE
     * @param {number} code
     * @param {string} [reason]
     * @param {string} [ipAddress] - passed to SP as IPAddress (audit); default '1'
     * @param {string} [location] - passed to SP as Location; default '1'
     */
    DeleteCompanyParameter: function DeleteCompanyParameter(code, reason, ipAddress, location) {
        const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        const userCode = authKeyData.UserMaster_Code || 0;
        const ip = ipAddress != null && ipAddress !== '' ? ipAddress : '1';
        const loc = location != null && location !== '' ? location : '1';
        const URL =
            UrlService.API_ENDPOINT_CompanyInformation +
            '/Delete?Code=' +
            encodeURIComponent(code) +
            '&UserMaster_Code=' +
            encodeURIComponent(userCode) +
            '&ReasonForDelete=' +
            encodeURIComponent(reason || '') +
            '&IPAddress=' +
            encodeURIComponent(ip) +
            '&Location=' +
            encodeURIComponent(loc);
        return promiseAjaxCallApi
            .CallAPI('POST', URL, '')
            .then(function (value) {
                return ensureProcedureSuccess(value);
            });
    },

    /** @deprecated Use GetCompanyParameterList */
    GetList: function GetList() {
        return CompanyInformationService.GetCompanyParameterList();
    },
    /** @deprecated Use GetCompanyParameterByCode */
    GetByCode: function GetByCode(code) {
        return CompanyInformationService.GetCompanyParameterByCode(code);
    },
    /** @deprecated Use SaveCompanyParameter */
    Save: function Save(data) {
        return CompanyInformationService.SaveCompanyParameter(data);
    },
    /** @deprecated Use DeleteCompanyParameter */
    Delete: function Delete(code, reason) {
        return CompanyInformationService.DeleteCompanyParameter(code, reason);
    },
};

export { CompanyInformationService };
