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
        return this._http.get(url, { headers: this.headers() });
    },
    GetItemParameterMasterList: function GetItemParameterMasterList(ItemMaster_Code, ItemSizeMaster_Code) {
        this.userCode = this.authService.getUserMasterCode();
        let url = UrlService.API_ENDPOINT_ItemSize + "/GetItemParameterMasterList?ItemMaster_Code=" + ItemMaster_Code + "&ItemSizeMaster_Code=" + ItemSizeMaster_Code;
        return this._http.get(url, { headers: this.headers() });
    },
    GetItemSizeDropdownList: function GetItemSizeDropdownList(ItemParameterMaster_Code, ItemMaster_Code) {

        let url = UrlService.API_ENDPOINT_ItemSize + "/GetItemSizeDropdownList?ItemParameterMaster_Code=" + ItemParameterMaster_Code + "&ItemMaster_Code=" + ItemMaster_Code;
        return this._http.get(url, { headers: this.headers() });
    },
    CreateItemSize: function CreateItemSize(ItemMaster_Code, ItemParameterMaster_CodeString, CopySizeForNewItemMasterCode) {
        ItemParameterMaster_CodeString = encodeURIComponent(ItemParameterMaster_CodeString);
        let url = UrlService.API_ENDPOINT_ItemSize + "/CreateItemSize?ItemMaster_Code=" + ItemMaster_Code + "&ItemSizeParameterCodes=" + ItemParameterMaster_CodeString + "&CopySizeForNewItemMasterCode=" + CopySizeForNewItemMasterCode + "&UserCode=" + this.userCode;
        return this._http.post(url, {}, { headers: this.headers() });
    }
}



export { SizeControlService }
//window.SizeControlService = SizeControlService;





//function InitSizeControl(itemMaster_Code, itemSizeMaster_Code, callBackFunctionName) {

//    console.log("ItemMaster_Code:" + itemMaster_Code);

//    console.log("ItemSizeMaster_Code:" + itemSizeMaster_Code);

//    var url = '@Url.Action("SizeControl", "CustomControl")';

//    $('#DivSizeControlmodal').load(url, { ItemMaster_Code: itemMaster_Code, ItemSizeMaster_Code: itemSizeMaster_Code, CallBackFunctionName: callBackFunctionName });

//}
//function HIIamBoss() {
//    alert('Hi I am Boss Shared ! I was Change this..... and you are the boss....');
//}
//function HIIamBoss2() {
//    alert('Hi I am Boss Shared ! Was sheare ');
//}