import { SizeControlService } from '../../JSServices/_SizeControlService.js'

let arraySizeControlDllID = [];

let SizeControl_NewSizeMaster_Code = 0;
let SizeControl_NewSizeDesp = '';

//function getAllSize() {
//    SizeControlService.GetItemSizeListByItemCode($('#hfItemMaster_Code').val()).then(function (respone) {
//        BindSelectList($('#ddlItemSizeMaster')[0], respone.map((item) => ({ Code: item.Code, Desp: item.SizeDesp })));

//        $('#ddlItemSizeMaster').val($('#hfItemSizeMaster_Code').val());
//        $('#ddlItemSizeMaster').select2({
//            dropdownParent: $('#SizeControlmodal')
//        });

//        getItemParameterList();
//    })
    
//}

function getItemParameterList() {
    SizeControlService.GetItemParameterMasterList($('#hfItemMaster_Code').val(), $('#hfItemSizeMaster_Code').val()).then(function (respone) {
        console.log(respone);
        arraySizeControlDllID = respone.map((item) => ({ ParameterCode: item.ParameterCode, ParameterName: item.ParameterName, ParameterValue: item.ParameterValue, ValueCode: item.ValueCode, SizeControlDllID: item.ParameterName.split(' ').join('') }))
        let tbRow = '';
        $.each(respone, function (key, val) {
            let PValue = '<select id="' + val.ParameterName.split(' ').join('') +'" ></select>'
            tbRow += '<tr><td>' + val.ParameterName + '</td><td>' + PValue + '</td></tr>';
            GetSizeDll(val.ParameterName.split(' ').join(''), val.ParameterCode, val.ValueCode);
            
        });

        $('#tbSizeParameter')[0].innerHTML = tbRow;
        

    })
}

function GetSizeDll(ddlelementID, ItemParameterMaster_Code, ValueCode) {
    SizeControlService.GetItemSizeDropdownList(ItemParameterMaster_Code, $('#hfItemMaster_Code').val()).then(function (respone) {
       // console.log(respone);
        BindSelectList($('#' + ddlelementID)[0], respone.map((item) => ({ Code: item.Code, Desp: item.Desp })));
        $('#' + ddlelementID).val(ValueCode);
        $('#' + ddlelementID).select2({
            dropdownParent: $('#SizeControlmodal'),
            width: '-webkit-fill-available'
        });
    })
}
function BindSelectList(element,list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function onSizeControl_ddlItemSizeMasterChange(){
    $('#hfItemSizeMaster_Code').val($('#ddlItemSizeMaster').val());
    getItemParameterList();
}
function CreateSize() {

    var validFrom = true;
    var ItemSizeParameterCodes = '';

    arraySizeControlDllID.forEach((value) => {
        let ItemParameterValue_Code = $('#' + value.SizeControlDllID).val();
        if (ItemParameterValue_Code == 0) {
            alert('inval' + value.SizeControlDllID);
            validFrom = false;
            return;
        }
        ItemSizeParameterCodes += value.ParameterCode + ',' + ItemParameterValue_Code + '#'
    })
    

    if (validFrom==true) {
       // alert(ItemSizeParameterCodes);
        SizeControlService.CreateItemSize($('#hfItemMaster_Code').val(), ItemSizeParameterCodes, 0).then(function (respone) {
            //console.log(respone);
            //alert(respone[0].Code + 'SizeDesp:' + respone[0].SizeDesp);
            SizeControl_NewSizeMaster_Code = respone[0].Code;
            SizeControl_NewSizeDesp = respone[0].SizeDesp;
            window.SizeControl_NewSizeMaster_Code = SizeControl_NewSizeMaster_Code;
            window.SizeControl_NewSizeDesp = SizeControl_NewSizeDesp;
            window[$('#hfCallBackFunctionName_btnDone').val()]();
            $("#SizeControlmodal").modal('hide');
        })
    }
    

}
getAllSize();
window.getAllSize = getAllSize;
window.onSizeControl_CreateSize = CreateSize;
window.onSizeControl_ddlItemSizeMasterChange = onSizeControl_ddlItemSizeMasterChange;




