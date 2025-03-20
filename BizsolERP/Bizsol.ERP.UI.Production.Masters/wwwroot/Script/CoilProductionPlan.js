
import { CoilProductionPlanService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CoilProductionPlanService.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';

$("#ERPHeading").text("Coil Production Plan");
//$('#txtFromDate').val(new Date().toISOString().slice(0, 10));
//$('#txtToDate').val(new Date().toISOString().slice(0, 10));

let baseUrl = sessionStorage.getItem('AppBaseURL');
let CoilProductionPlan_indxHideObj = 0;


function CoilProductionPlan_GetCoilProductionPlanGridView() {
    //let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
    
    //if (FromDate == "" && Todate == "") {
    //    return false;
    //}
    //let filterType = $('input[name="filterType"]:checked').val();
    Showloader();
    CoilProductionPlanService.GetCoilProductionPlanGridView().then(function (response) {
        HideLoader();
        console.log(response);
        response = response.map(Res => {

            let responseKey = Object.keys(Res);

            responseKey.forEach(function (key) {
                let value = Res[key];

                if (typeof value == "string" && value.includes(",") == true) {
                    let splitObj = value.split(',')
                    Res[key] = `<input id="txt_${splitObj[0]}_0_${key.replace(/ /g,"")}" class="txt_${splitObj[0]}_0 BizSolFormControl form-control form-control-sm" type="text" onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);" maxlength="4" autocomplete="off" readonly>`
                   
                } else if (key == 'HideObj') {
                    let HideColObj = {
                        ItemMaster_Code: 0,
                        ItemSizeMaster_Code: 0,
                        IdentificationNoMaster_Code: 0,
                        BuyerPOMaster_Code: 0,
                        ProcessMaster_Code: 0,
                        SlitWidth: 0,
                        NoOfSlit:0
                    }
                    Res[key] = JSON.stringify(HideColObj)
                }else {
                    
                    Res[key] = `<input type="checkbox" id="Chk_${Res[key]}_0" switch="success" onchange="CoilProductionPlan_OnChangeChkProcess(this)" /><label data-on-label="Yes" data-off-label="No" for="Chk_${Res[key]}_0"></label>`
                }
            });
                     
        return {
            ...Res, "ITEM NAMES": `<select id="ddlIssueItems_0" class="form-control form-control-sm box_border" onchange="CoilProductionPlan_OnChangeDdlIssueItems(this)"></select>`,
            "SIZE": `<select id="ddlSize_0" class="form-control form-control-sm box_border" onchange="CoilProductionPlan_OnChangeDdlSize(this)"></select>`,
            "ID NO": `<select id="ddlIDNO_0" class="form-control form-control-sm box_border"></select>`,
            "PARTY": `<select id="ddlParty_0" class="form-control form-control-sm box_border"></select>`,
            "ORDER": `<select id="ddlOrder_0" class="form-control form-control-sm box_border"></select>`,
            }
            
         })




        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["HideObj"];
        const ColumnAlignment = {};

        if (response.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbCoilProductionPlanHeader", "tbCoilProductionPlanBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
            Bind_ddlIssueItems();
            Bind_ddlParty();
            Bind_ddlOrders();
        } else {
            $('#tbCoilProductionPlan tr').empty()
            $('#paginator-tbCoilProductionPlan').empty();
        }

    });

   
}

function Bind_ddlIssueItems() {
    CoilProductionPlanService.Getddl('ddlIssueItems', 0, 0).then(function (response) {
        
        BindSelectList($('#ddlIssueItems_0')[0], response.map((item) => ({ Code: item.Code, Desp: item.ItemName })));
        $('#ddlIssueItems_0').select2({
            width: '-webkit-fill-available'
        });
        

    });
}
function Bind_ddlParty() {
    CoilProductionPlanService.Getddl('ddlParties', 0, 0).then(function (response) {

        BindSelectList($('#ddlParty_0')[0], response.map((item) => ({ Code: item.Code, Desp: item.ItemName })));
        $('#ddlParty_0').select2({
            width: '-webkit-fill-available'
        });


    });
}
function Bind_ddlOrders() {
    CoilProductionPlanService.Getddl('ddlOrders', 0, 0).then(function (response) {

        BindSelectList($('#ddlOrder_0')[0], response.map((item) => ({ Code: item.Code, Desp: item.ItemName })));
        $('#ddlOrder_0').select2({
            width: '-webkit-fill-available'
        });


    });
}

function Bind_ddlSize(elementid,ItemMaster_Code) {
    CoilProductionPlanService.Getddl('ddlIssueItemsSize', ItemMaster_Code, 0).then(function (response) {

        BindSelectList($('#' + elementid)[0], response.map((item) => ({ Code: item.Code, Desp: item.SizeDesp })));
        $('#'+ elementid).select2({
            width: '-webkit-fill-available'
        });


    });
}
function Bind_ddlIDNo(elementid, ItemMaster_Code,ItemSizeMaster_Code) {
    CoilProductionPlanService.Getddl('ddlIssueItemsSizeIDs', ItemMaster_Code, ItemSizeMaster_Code).then(function (response) {

        BindSelectList($('#' + elementid)[0], response.map((item) => ({ Code: item.IdentificationNoMaster_Code, Desp: item.IdentificationNo })));
        $('#' + elementid).select2({
            width: '-webkit-fill-available'
        });


    });
}
function BindSelectList(element, list) {
    let option = '<option value="0">Select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

function CoilProductionPlan_OnChangeDdlIssueItems(ele) {
    let splitObj = ele.id.split('_');
    
    let RowNo = splitObj[1];
    let itemMaster_Code = $('#' + ele.id).val();

    let UpdateRow = $(ele).closest("tr")[0];

    let HideColObj = JSON.parse(UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML.trim());

    HideColObj.ItemMaster_Code = itemMaster_Code;
    HideColObj.ItemSizeMaster_Code = 0;
    HideColObj.IdentificationNoMaster_Code = 0;

    UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML = JSON.stringify(HideColObj);

    Bind_ddlSize('ddlSize_' + RowNo, itemMaster_Code);
}
function CoilProductionPlan_OnChangeDdlSize(ele) {
    let splitObj = ele.id.split('_');

    let RowNo = splitObj[1];
    
    let itemSizeMaster_Code = $('#' + ele.id).val();

    let UpdateRow = $(ele).closest("tr")[0];

    let HideColObj = JSON.parse(UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML.trim());

    HideColObj.ItemSizeMaster_Code = itemSizeMaster_Code;
    HideColObj.IdentificationNoMaster_Code = 0;

    UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML = JSON.stringify(HideColObj);

    Bind_ddlIDNo('ddlIDNO_' + RowNo, HideColObj.ItemMaster_Code, itemSizeMaster_Code);
}
function CoilProductionPlan_OnChangeChkProcess(ele) {
    let splitObj = ele.id.split('_');
    let ProcessMasterCode = splitObj[1];
    let RowNo = splitObj[2];

    if (ele.checked == true) {
        //$('#txt_' + ProcessMasterCode + '_' + RowNo).removeAttr('readonly');
        
        $.each($('.txt_' + ProcessMasterCode + '_' + RowNo), function (key, val) {
            
            $('#' + val.id).removeAttr('readonly');
        });

    } else {
        //$('#txt_' + ProcessMasterCode + '_' + RowNo).attr('readonly', 'readonly');
        $.each($('.txt_' + ProcessMasterCode + '_' + RowNo), function (key, val) {
            $('#' + val.id).val('');
            $('#' + val.id).attr('readonly', 'readonly');
        });
    }
 
}
CoilProductionPlan_GetCoilProductionPlanGridView();

window.CoilProductionPlan_OnChangeDdlIssueItems = CoilProductionPlan_OnChangeDdlIssueItems;
window.CoilProductionPlan_OnChangeChkProcess = CoilProductionPlan_OnChangeChkProcess;
window.CoilProductionPlan_OnChangeDdlSize = CoilProductionPlan_OnChangeDdlSize;


