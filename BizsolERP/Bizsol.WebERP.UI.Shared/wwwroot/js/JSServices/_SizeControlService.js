import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const SizeControlService = {
    GetItemSizeMasterList: function GetItemSizeMasterList(ItemName) {

        let url = UrlService.API_ENDPOINT_ItemSize + "/GetItemSizeMasterList?ItemName=" + ItemName;
        //alert(url);
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetItemSizeListByItemCode: function GetItemSizeListByItemCode(ItemMaster_Code) {
        let url = UrlService.API_ENDPOINT_ItemSize + "/GetItemSizeListByItemCode?ItemMaster_Code=" + ItemMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetItemParameterMasterList: function GetItemParameterMasterList(ItemMaster_Code, ItemSizeMaster_Code) {
        let url = UrlService.API_ENDPOINT_ItemSize + "/GetItemParameterMasterList?ItemMaster_Code=" + ItemMaster_Code + "&ItemSizeMaster_Code=" + ItemSizeMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    GetItemSizeDropdownList: function GetItemSizeDropdownList(ItemParameterMaster_Code, ItemMaster_Code) {

        let url = UrlService.API_ENDPOINT_ItemSize + "/GetItemSizeDropdownList?ItemParameterMaster_Code=" + ItemParameterMaster_Code + "&ItemMaster_Code=" + ItemMaster_Code;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
    CreateItemSize: function CreateItemSize(ItemMaster_Code, ItemParameterMaster_CodeString, CopySizeForNewItemMasterCode) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        ItemParameterMaster_CodeString = encodeURIComponent(ItemParameterMaster_CodeString);
        let url = UrlService.API_ENDPOINT_ItemSize + "/CreateItemSize?ItemMaster_Code=" + ItemMaster_Code + "&ItemSizeParameterCodes=" + ItemParameterMaster_CodeString + "&CopySizeForNewItemMasterCode=" + CopySizeForNewItemMasterCode + "&UserCode=" + userCode;
        return promiseAjaxCallApi.CallAPI('POST', url, "").then(
            function (value) {
                return value;
            }
        );
    }
}



export { SizeControlService }
//window.SizeControlService = SizeControlService;
