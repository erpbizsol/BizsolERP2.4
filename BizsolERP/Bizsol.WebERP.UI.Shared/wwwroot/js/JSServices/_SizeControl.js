function InitSizeControl(itemMaster_Code, itemSizeMaster_Code, callBackFunctionName) {

    console.log("ItemMaster_Code:" + itemMaster_Code);

    console.log("ItemSizeMaster_Code:" + itemSizeMaster_Code);

    var url = '@Url.Action("SizeControl", "CustomControl")';

    $('#DivSizeControlmodal').load(url, { ItemMaster_Code: itemMaster_Code, ItemSizeMaster_Code: itemSizeMaster_Code, CallBackFunctionName: callBackFunctionName });

}
function HIIamBoss() {
    alert('Hi I am Boss Shared ! I was Change this..... and you are the boss....');
}
function HIIamBoss2() {
    alert('Hi I am Boss Shared ! Was sheare ');
}