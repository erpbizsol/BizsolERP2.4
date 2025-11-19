import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const Sub_DepartmentService = {
    SubDepartmentMasterList: function SubDepartmentMasterList(Status, DepartmentName) {
        var URL = UrlService.API_ENDPOINT_SubDepartment + "/GetSubDepartmentMasterList?Status=" + Status + "" + "&DepartmentName=" + DepartmentName +"";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },

    GetSubDepartmentrByCode: function GetSubDepartmentrByCode(Code) {
        var URL = UrlService.API_ENDPOINT_SubDepartment + "/GetSubDepartmentMasterByCode?Code=" + Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    SaveSubDepartment: function SaveSubDepartment(Data) {
        var URL = UrlService.API_ENDPOINT_SubDepartment + "/SaveSubDepartmentMaster";
        return promiseAjaxCallApi.CallAPI('POST', URL, Data).then(
            function (value) {
                return value;
            }
        );
    },
    DeleteSubDepartment: function DeleteSubDepartment(Code, ReasonForDelete, IPAddress, Location) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        var URL = UrlService.API_ENDPOINT_SubDepartment + "/DeleteSubDepartmentMaster?Code=" + Code + "&UserMaster_Code=" + userCode + "&ReasonForDelete=" + ReasonForDelete + "" + "&IPAddress=" + "1" + "&Location=" + "1";
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    CheckDependencySubDepartment: function CheckDependencySubDepartment(Code) {
        var URL = UrlService.API_ENDPOINT_SubDepartment + "/CheckDependencySubDepartment?Code=" + Code;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    
}

export { Sub_DepartmentService }