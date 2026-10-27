/**
 * AdminToolsService.js
 * API service for Administrative Tools – Menu Visibility Management
 * API Controller: BizsolERP_API\Controllers\Common\Tools\AdminToolsController.cs
 */

import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const AdminToolsService = {

    /**
     * GET api/AdminTools/GetAllMenus?CompanyCode=X
     * Returns all menus with IsHidden = 'Y'/'N' for the given company.
     * @param {string|number} companyCode - Company code to load menus for
     */
    GetAllMenus: function GetAllMenus(companyCode) {
        var code = companyCode != null && companyCode !== '' ? companyCode
            : (JSON.parse(sessionStorage.getItem('authKey') || '{}').CompanyCode || '');
        var url = UrlService.API_ENDPOINT_AdminTools + '/GetAllMenus?CompanyCode=' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('GET', url, '');
    },

    /**
     * POST api/AdminTools/HideMenu
     * Hides a single menu for the given company.
     * @param {number|string} menuCode    - UserModuleMaster.Code
     * @param {string|number} companyCode - Company code
     */
    HideMenu: function HideMenu(menuCode, companyCode) {
        var code = companyCode != null && companyCode !== '' ? companyCode
            : (JSON.parse(sessionStorage.getItem('authKey') || '{}').CompanyCode || '');
        var url = UrlService.API_ENDPOINT_AdminTools + '/HideMenu'
            + '?Code=' + encodeURIComponent(menuCode)
            + '&CompanyCode=' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('POST', url, '');
    },

    /**
     * POST api/AdminTools/UnhideMenu
     * Makes a single menu visible again for the given company.
     * @param {number|string} menuCode    - UserModuleMaster.Code
     * @param {string|number} companyCode - Company code
     */
    UnhideMenu: function UnhideMenu(menuCode, companyCode) {
        var code = companyCode != null && companyCode !== '' ? companyCode
            : (JSON.parse(sessionStorage.getItem('authKey') || '{}').CompanyCode || '');
        var url = UrlService.API_ENDPOINT_AdminTools + '/UnhideMenu'
            + '?Code=' + encodeURIComponent(menuCode)
            + '&CompanyCode=' + encodeURIComponent(code);
        return promiseAjaxCallApi.CallAPI('POST', url, '');
    },

    /**
     * POST api/AdminTools/SaveMenuVisibility
     * Bulk save: hides and unhides multiple menus in one call.
     * @param {string}        menuCodesToHide    - comma-separated codes to HIDE
     * @param {string}        menuCodesToUnhide  - comma-separated codes to UNHIDE
     * @param {string|number} companyCode        - Company code
     */
    /**
     * POST api/AdminTools/UpdateApplicableFor
     * Updates the ApplicableForWebErp flag for a single menu item.
     * @param {string|number} menuCode        - UserModuleMaster.Code
     * @param {string} applicableStatus - 'Y'=Both | 'N'=ERP | 'W'=Web ERP
     */
    UpdateApplicableFor: function UpdateApplicableFor(menuCode, applicableStatus) {
        var url = UrlService.API_ENDPOINT_AdminTools + '/UpdateApplicableFor'
            + '?Code='             + encodeURIComponent(menuCode)
            + '&ApplicableStatus=' + encodeURIComponent(applicableStatus);
        return promiseAjaxCallApi.CallAPI('POST', url, '');
    },

    SaveMenuVisibility: function SaveMenuVisibility(menuCodesToHide, menuCodesToUnhide, companyCode) {
        var code = companyCode != null && companyCode !== '' ? companyCode
            : (JSON.parse(sessionStorage.getItem('authKey') || '{}').CompanyCode || '');
        var url = UrlService.API_ENDPOINT_AdminTools + '/SaveMenuVisibility';
        var body = JSON.stringify({
            CompanyCode:        code,
            MenuCodesToHide:    menuCodesToHide,
            MenuCodesToUnhide:  menuCodesToUnhide
        });
        return promiseAjaxCallApi.CallAPI('POST', url, body);
    },

};

export { AdminToolsService };
