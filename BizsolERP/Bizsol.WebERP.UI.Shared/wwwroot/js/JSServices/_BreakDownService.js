import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';


const BreakDownService = {
    StartOrEndSummary: function StartOrEndSummary() {
        var URL = UrlService.API_ENDPOINT_BreakDown + "/StartOrEndSummary";
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    EndBreakDown: function EndBreakDown(PVCProductionBreakDownDetails_Code,  PVCProductionMasterCode,  EndTime,  Cause,  ActionPlan,  BreakDownMode) {
        var URL = UrlService.API_ENDPOINT_BreakDown + "/EndBreakDown?PVCProductionBreakDownDetails_Code=" + PVCProductionBreakDownDetails_Code + "&PVCProductionMasterCode=" + PVCProductionMasterCode + "&EndTime=" + EndTime + "&Cause=" + Cause + "&ActionPlan=" + ActionPlan + "&BreakDownMode=" + BreakDownMode;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetDDlBreakDown: function GetDDlBreakDown(Mode) {
        var URL = UrlService.API_ENDPOINT_BreakDown + "/GetDDlBreakDown?Mode="+Mode;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    IsBreakDownRunning: function IsBreakDownRunning(processMaster_Code,  machineMaster_Code,  godownMaster_Code) {
        var URL = UrlService.API_ENDPOINT_BreakDown + "/IsBreakDownRunning?ProcessMaster_Code=" + processMaster_Code + "&MachineMaster_Code=" + machineMaster_Code + "&GodownMaster_Code=" + godownMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    StartBreakDown: function StartBreakDown(entryDate, processMaster_Code, machineMaster_Code, shiftMaster_Code, reasonMaster_Code, startTime, remarks, departmentMaster_Code, operatorName_Code, godownMaster_Code) {
        var URL = UrlService.API_ENDPOINT_BreakDown + "/StartBreakDown?EntryDate=" + entryDate + "&ProcessMaster_Code=" + processMaster_Code + "&MachineMaster_Code=" + machineMaster_Code + "&ShiftMaster_Code=" + shiftMaster_Code + "&ReasonMaster_Code=" + reasonMaster_Code + "&StartTime=" + encodeURIComponent(startTime) + "&Remarks=" + encodeURIComponent(remarks) + "&DepartmentMaster_Code=" + departmentMaster_Code + "&OperatorName_Code=" + operatorName_Code +"&GodownMaster_Code=" + godownMaster_Code;
        return promiseAjaxCallApi.CallAPI('POST', URL, "").then(
            function (value) {
                return value;
            }
        );
    },
    
}
export { BreakDownService }