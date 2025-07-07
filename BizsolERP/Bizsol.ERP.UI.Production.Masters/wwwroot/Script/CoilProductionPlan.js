
import { CoilProductionPlanService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CoilProductionPlanService.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';

$("#ERPHeading").text("Coil Production Plan");
//$('#txtFromDate').val(new Date().toISOString().slice(0, 10));
//$('#txtToDate').val(new Date().toISOString().slice(0, 10));

let baseUrl = sessionStorage.getItem('AppBaseURL');
let CoilProductionPlan_indxHideObj = 0;
let G_CoilProductionPlanArry = [];
let G_ddlIssueItemsArry = [];
let G_ddlPartyArry = [];
let G_ddlOrders = [];
let G_allDllCount = 3;
let G_Counter = 0;

function CoilProductionPlan_GetCoilProductionPlanGridViewOrNewRow(Mode) {
    //let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
    
    //if (FromDate == "" && Todate == "") {
    //    return false;
    //}
    //let filterType = $('input[name="filterType"]:checked').val();
    Showloader();
    CoilProductionPlanService.GetCoilProductionPlanGridView(Mode).then(async function (response) {
        HideLoader();
        let rowNO = G_CoilProductionPlanArry.length + 1;
        let gridCounter = 0;

        let processedResponses = await Promise.all(response.map(async Res => {
            let HideColObj = {
                Code: 0,
                ItemMaster_Code: 0,
                ItemSizeMaster_Code: 0,
                IdentificationNo: '',
                BuyerPOMaster_Code: 0,
                ClientMaster_Code: 0,
                PlanTransactions: []
            };

            if (Mode === 'GetCoilProductionPlanGridView') {
                rowNO = Res.Rno;

                let PlanData = await CoilProductionPlanService.ShowCoilPlan(Res.HideObj, rowNO);
                HideColObj = PlanData.Respone;
                HideColObj.PlanTransactions = HideColObj.ShowPlanTransactions;
                //G_CoilProductionPlanArry[PlanData.Rno - 1].HideObj = JSON.stringify(HideColObj);

                gridCounter++;
                if (G_CoilProductionPlanArry.length === gridCounter) {
                    // InitializeDdlControl();
                }
            }

            rowNO = Mode === 'GetCoilProductionPlanGridView' ? Res.Rno : G_CoilProductionPlanArry.length + 1;

            let responseKey = Object.keys(Res);
            responseKey.forEach(function (key) {
                let value = Res[key];

               

                if (typeof value === "string" && value.includes(",")) {
                    let splitObj = value.split(',')
                    Res[key] = `<div style="width: 55px;"><input id="txt_${splitObj[0]}_${rowNO}_${key.replace(/ /g, "")}" class="txt_${splitObj[0]}_${rowNO} BizSolFormControl form-control form-control-sm" type="text" onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);" onchange="CoilProductionPlan_OnChangetxt(this)" maxlength="4" autocomplete="off" readonly></div>`
                } else if (key === 'HideObj') {
                    Res[key] = JSON.stringify(HideColObj);
                } else {
                    Res[key] = `<input type="checkbox" id="Chk_${Res[key]}_${rowNO}" switch="success" onchange="CoilProductionPlan_OnChangeChkProcess(this)" /><label data-on-label="Yes" data-off-label="No" for="Chk_${Res[key]}_${rowNO}"></label>`
                }
            });

            return {
                ...Res,
                "ITEM NAMES": `<div style="width: 120px;"><select id="ddlIssueItems_${rowNO}" class="form-control form-control-sm box_border" onchange="CoilProductionPlan_OnChangeDdlIssueItems(this)"></select></div>`,
                "SIZE": `<div style="width: 120px;"><select id="ddlSize_${rowNO}" class="form-control form-control-sm box_border" onchange="CoilProductionPlan_OnChangeDdlSize(this)"></select></div>`,
                "ID NO": `<div style="width: 120px;"><select id="ddlIDNO_${rowNO}" class="form-control form-control-sm box_border" onchange="CoilProductionPlan_OnChangeDdlIDNo(this)"></select></div>`,
                "PARTY": `<div style="width: 120px;"><select id="ddlParty_${rowNO}" class="form-control form-control-sm box_border" onchange="CoilProductionPlan_OnChangeDdlParty(this)"></select></div>`,
                "ORDER": `<div style="width: 120px;"><select id="ddlOrder_${rowNO}" class="form-control form-control-sm box_border" onchange="CoilProductionPlan_OnChangeDdlOrders(this)"></select></div>`,
            }
        }));

        G_CoilProductionPlanArry = [...G_CoilProductionPlanArry, ...processedResponses];

        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["HideObj", "Rno"];
        
        const ColumnAlignment = {};

        if (G_CoilProductionPlanArry.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbCoilProductionPlanHeader", "tbCoilProductionPlanBody", G_CoilProductionPlanArry, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false)
            

            InitializeDdlControl();
            if (Mode === 'GetCoilProductionPlanNewRow') {
                
            }
        } else {
            $('#tbCoilProductionPlan tr').empty()
            $('#paginator-tbCoilProductionPlan').empty();
        }
    });

   
}

function CoilProductionPlan_GetCoilProductionPlanGridViewOrNewRow2(Mode) {
    //let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();

    //if (FromDate == "" && Todate == "") {
    //    return false;
    //}
    //let filterType = $('input[name="filterType"]:checked').val();
    Showloader();
    CoilProductionPlanService.GetCoilProductionPlanGridView(Mode).then(function (response) {
        HideLoader();
        console.log(response);
        let rowNO = G_CoilProductionPlanArry.length + 1;
        let gridCounter = 0
        let HideColObj = {
            Code: 0,
            ItemMaster_Code: 0,
            ItemSizeMaster_Code: 0,
            IdentificationNo: '',
            BuyerPOMaster_Code: 0,
            ClientMaster_Code: 0,
            PlanTransactions: []

        }

        response = response.map(Res => {



            if (Mode === 'GetCoilProductionPlanGridView') {
                rowNO = Res.Rno;

                CoilProductionPlanService.ShowCoilPlan(Res.HideObj, rowNO).then(function (PlanData) {
                    HideColObj = PlanData.Respone;
                    HideColObj.PlanTransactions = HideColObj.ShowPlanTransactions;
                    G_CoilProductionPlanArry[PlanData.Rno - 1].HideObj = JSON.stringify(HideColObj);
                    $('#tbCoilProductionPlan tr')[PlanData.Rno].cells[CoilProductionPlan_indxHideObj].innerHTML = JSON.stringify(HideColObj);

                    gridCounter++;

                    if (G_CoilProductionPlanArry.length === gridCounter) {
                        InitializeDdlControl();
                    }
                })

            }

            let responseKey = Object.keys(Res);

            responseKey.forEach(function (key) {
                let value = Res[key];

                if (typeof value == "string" && value.includes(",") == true) {
                    let splitObj = value.split(',')
                    Res[key] = `<div style="width: 55px;"><input id="txt_${splitObj[0]}_${rowNO}_${key.replace(/ /g, "")}" class="txt_${splitObj[0]}_${rowNO} BizSolFormControl form-control form-control-sm" type="text" onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);" onchange="CoilProductionPlan_OnChangetxt(this)" maxlength="4" autocomplete="off" readonly></div>`

                } else if (key == 'HideObj') {

                    Res[key] = JSON.stringify(HideColObj)
                } else {

                    Res[key] = `<input type="checkbox" id="Chk_${Res[key]}_${rowNO}" switch="success" onchange="CoilProductionPlan_OnChangeChkProcess(this)" /><label data-on-label="Yes" data-off-label="No" for="Chk_${Res[key]}_${rowNO}"></label>`
                }
            });

            return {
                ...Res, "ITEM NAMES": `<div style="width: 120px;"><select id="ddlIssueItems_${rowNO}" class="form-control form-control-sm box_border" onchange="CoilProductionPlan_OnChangeDdlIssueItems(this)"></select></div>`,
                "SIZE": `<div style="width: 120px;"><select id="ddlSize_${rowNO}" class="form-control form-control-sm box_border" onchange="CoilProductionPlan_OnChangeDdlSize(this)"></select></div>`,
                "ID NO": `<div style="width: 120px;"><select id="ddlIDNO_${rowNO}" class="form-control form-control-sm box_border" onchange="CoilProductionPlan_OnChangeDdlIDNo(this)"></select></div>`,
                "PARTY": `<div style="width: 120px;"><select id="ddlParty_${rowNO}" class="form-control form-control-sm box_border" onchange="CoilProductionPlan_OnChangeDdlParty(this)"></select></div>`,
                "ORDER": `<div style="width: 120px;"><select id="ddlOrder_${rowNO}" class="form-control form-control-sm box_border" onchange="CoilProductionPlan_OnChangeDdlOrders(this)"></select></div>`,
            }

        })

        G_CoilProductionPlanArry = [...G_CoilProductionPlanArry, ...response];


        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["HideObj", "Rno"];
        const ColumnAlignment = {};

        if (G_CoilProductionPlanArry.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbCoilProductionPlanHeader", "tbCoilProductionPlanBody", G_CoilProductionPlanArry, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false)


            if (Mode === 'GetCoilProductionPlanNewRow') {
                InitializeDdlControl();

            }


        } else {
            $('#tbCoilProductionPlan tr').empty()
            $('#paginator-tbCoilProductionPlan').empty();
        }

    });


}
function Bind_ddlIssueItems() {
    CoilProductionPlanService.Getddl('ddlIssueItems', 0, 0).then(function (response) {
        G_ddlIssueItemsArry = response;
         InitializeDdlControl();
         G_Counter++;
        if (G_Counter === G_allDllCount) {
            CoilProductionPlan_GetCoilProductionPlanGridViewOrNewRow('GetCoilProductionPlanGridView')
        }
    });
}
function Bind_ddlParty() {
    CoilProductionPlanService.Getddl('ddlParties', 0, 0).then(function (response) {
        G_ddlPartyArry = response;
        InitializeDdlControl();
        G_Counter++;
        if (G_Counter === G_allDllCount) {
            CoilProductionPlan_GetCoilProductionPlanGridViewOrNewRow('GetCoilProductionPlanGridView')
        }
    });
}
function Bind_ddlOrders() {
    CoilProductionPlanService.Getddl('ddlOrders', 0, 0).then(function (response) {
        G_ddlOrders = response;
         InitializeDdlControl();
        G_Counter++;
        if (G_Counter === G_allDllCount) {
            CoilProductionPlan_GetCoilProductionPlanGridViewOrNewRow('GetCoilProductionPlanGridView')
        }
    });
}

function InitializeDdlControl() {

    for (let i = 1; i <= G_CoilProductionPlanArry.length; i++) {
        let rno = i;
        
        let HideColObj = JSON.parse(G_CoilProductionPlanArry[rno - 1].HideObj);
        let PlanTransactions = HideColObj.PlanTransactions;
        BindSelectList($(`#ddlIssueItems_${rno}`)[0], G_ddlIssueItemsArry.map((item) => ({ Code: item.Code, Desp: item.ItemName })));

        BindSelectList($(`#ddlParty_${rno}`)[0], G_ddlPartyArry.map((item) => ({ Code: item.Code, Desp: item.AccountDesp })));

        BindSelectList($(`#ddlOrder_${rno}`)[0], G_ddlOrders.map((item) => ({ Code: item.Code, Desp: item.BuyerPONo, ClientMaster_Code: item.CustomerMaster_Code })));

        $(`#ddlIssueItems_${rno}`).val(HideColObj.ItemMaster_Code);
        $(`#ddlParty_${rno}`).val(HideColObj.ClientMaster_Code);
        $(`#ddlOrder_${rno}`).val(HideColObj.BuyerPOMaster_Code);

        $(`#ddlIssueItems_${rno}`).select2({
            width: '-webkit-fill-available'
        });
        $(`#ddlParty_${rno}`).select2({
            width: '-webkit-fill-available'
        });
        $(`#ddlOrder_${rno}`).select2({
            width: '-webkit-fill-available'
        });

         Bind_ddlSize('ddlSize_' + rno, HideColObj.ItemMaster_Code, HideColObj.ItemSizeMaster_Code);
         Bind_ddlIDNo('ddlIDNO_' + rno, HideColObj.ItemMaster_Code, HideColObj.ItemSizeMaster_Code, HideColObj.IdentificationNo);

        PlanTransactions.forEach(item => {
            $.each($('.txt_' + item.ProcessMaster_Code + '_' + rno), function (key, val) {

                if (item.SlitWidth > 0 && val.id.toUpperCase().includes("SLITWIDTH") == true) {
                    $('#' + val.id).val(item.SlitWidth);
                    $('#' + val.id).removeAttr('readonly');
                   
                }
                if (item.NoOfSlit > 0 && val.id.toUpperCase().includes("NOOFSLIT") == true) {
                    $('#' + val.id).val(item.NoOfSlit);
                    $('#' + val.id).removeAttr('readonly');
                }

            });

            $(`#Chk_${item.ProcessMaster_Code}_${rno}`)[0].checked = true;
        })

    }
}
function Bind_ddlSize(elementid,ItemMaster_Code,SetSizeMasterValue) {
       CoilProductionPlanService.GetddlForGrid('ddlIssueItemsSize', ItemMaster_Code, 0, elementid).then(function (resObj) {

        BindSelectList($('#' + resObj.ElementID)[0], resObj.Respone.map((item) => ({ Code: item.Code, Desp: item.SizeDesp })));
        $('#' + resObj.ElementID).val(SetSizeMasterValue);
        $('#' + resObj.ElementID).select2({
            width: '-webkit-fill-available'
        });


    });
}
function Bind_ddlIDNo(elementid, ItemMaster_Code,ItemSizeMaster_Code,SetIDNo) {
    CoilProductionPlanService.GetddlForGrid('ddlIssueItemsSizeIDs', ItemMaster_Code, ItemSizeMaster_Code, elementid).then(function (resObj) {

        BindSelectList($('#' + resObj.ElementID)[0], resObj.Respone.map((item) => ({ Code: item.IdentificationNo, Desp: item.IdentificationNo })));
        $('#' + resObj.ElementID).val(SetIDNo);
        $('#' + resObj.ElementID).select2({
            width: '-webkit-fill-available'
        });


    });
}
function BindSelectList(element, list) {
    let option = '<option value="0" ClientMaster_Code="0">Select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '" ClientMaster_Code="' + val.ClientMaster_Code + '">' + val.Desp + '</option>';
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
    HideColObj.IdentificationNo = '';

    UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML = JSON.stringify(HideColObj);

    G_CoilProductionPlanArry[RowNo - 1].HideObj = JSON.stringify(HideColObj);

    Bind_ddlSize('ddlSize_' + RowNo, itemMaster_Code,0);
}
function CoilProductionPlan_OnChangeDdlSize(ele) {
    let splitObj = ele.id.split('_');

    let RowNo = splitObj[1];
    
    let itemSizeMaster_Code = $('#' + ele.id).val();

    let UpdateRow = $(ele).closest("tr")[0];

    let HideColObj = JSON.parse(UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML.trim());

    HideColObj.ItemSizeMaster_Code = itemSizeMaster_Code;
    HideColObj.IdentificationNo = '';

    UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML = JSON.stringify(HideColObj);
    G_CoilProductionPlanArry[RowNo - 1].HideObj = JSON.stringify(HideColObj);

    Bind_ddlIDNo('ddlIDNO_' + RowNo, HideColObj.ItemMaster_Code, itemSizeMaster_Code,0);
}
function CoilProductionPlan_OnChangeChkProcess(ele) {
    let splitObj = ele.id.split('_');
    let ProcessMasterCode = splitObj[1];
    let RowNo = splitObj[2];

    let UpdateRow = $(ele).closest("tr")[0];

    let HideColObj = JSON.parse(UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML.trim());

    let PlanTransactions = HideColObj.PlanTransactions;
        

   

    if (ele.checked == true) {
        
        $.each($('.txt_' + ProcessMasterCode + '_' + RowNo), function (key, val) {
            
            $('#' + val.id).removeAttr('readonly');
        });

        PlanTransactions.push({
            ProcessMaster_Code: ProcessMasterCode,
            SlitWidth: 0,
            NoOfSlit:0
        })
    } else {
        
        $.each($('.txt_' + ProcessMasterCode + '_' + RowNo), function (key, val) {
            $('#' + val.id).val('');
            $('#' + val.id).attr('readonly', 'readonly');
        });
        PlanTransactions = PlanTransactions.filter(item => parseInt(item.ProcessMaster_Code) !== parseInt(ProcessMasterCode));
    }

    HideColObj.PlanTransactions = PlanTransactions;
    UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML = JSON.stringify(HideColObj);

    G_CoilProductionPlanArry[RowNo - 1].HideObj = JSON.stringify(HideColObj);

    SaveCoilPlan(HideColObj, RowNo);
}
function CoilProductionPlan_OnChangetxt(ele) {
    let splitObj = ele.id.split('_');
    let ProcessMasterCode = splitObj[1];
    let RowNo = splitObj[2];
    let texboxName = splitObj[3];
    let UpdateRow = $(ele).closest("tr")[0];

    let HideColObj = JSON.parse(UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML.trim());

    let PlanTransactions = HideColObj.PlanTransactions;

    PlanTransactions = PlanTransactions.map(item => {
        if (item.ProcessMaster_Code == ProcessMasterCode && texboxName.toUpperCase().includes("SLITWIDTH")==true) {
            return {
                ...item,
                SlitWidth: $('#' + ele.id).val()

            }
        }
        if (item.ProcessMaster_Code == ProcessMasterCode && texboxName.toUpperCase().includes("NOOFSLIT") == true) {
            return {
                ...item,
                NoOfSlit: $('#' + ele.id).val()

            }
        }
        return {...item}
    });

    HideColObj.PlanTransactions = PlanTransactions;
    UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML = JSON.stringify(HideColObj);

    G_CoilProductionPlanArry[RowNo - 1].HideObj = JSON.stringify(HideColObj);

    SaveCoilPlan(HideColObj, RowNo);
}

function CoilProductionPlan_OnChangeDdlIDNo(ele) {
    let splitObj = ele.id.split('_');

    let RowNo = splitObj[1];

    let UpdateRow = $(ele).closest("tr")[0];

    let HideColObj = JSON.parse(UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML.trim());

    
    HideColObj.IdentificationNo = $('#' + ele.id).val();;

    UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML = JSON.stringify(HideColObj);
    G_CoilProductionPlanArry[RowNo - 1].HideObj = JSON.stringify(HideColObj);

}
function CoilProductionPlan_OnChangeDdlParty(ele) {
    let splitObj = ele.id.split('_');

    let RowNo = splitObj[1];

    let UpdateRow = $(ele).closest("tr")[0];

    let HideColObj = JSON.parse(UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML.trim());


    HideColObj.ClientMaster_Code = $('#' + ele.id).val();;

    UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML = JSON.stringify(HideColObj);
    G_CoilProductionPlanArry[RowNo - 1].HideObj = JSON.stringify(HideColObj);

}
function CoilProductionPlan_OnChangeDdlOrders(ele) {
    let splitObj = ele.id.split('_');

    let RowNo = splitObj[1];

    let UpdateRow = $(ele).closest("tr")[0];

    let HideColObj = JSON.parse(UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML.trim());


    HideColObj.BuyerPOMaster_Code = $('#' + ele.id).val();

    UpdateRow.cells[CoilProductionPlan_indxHideObj].innerHTML = JSON.stringify(HideColObj);
    G_CoilProductionPlanArry[RowNo - 1].HideObj = JSON.stringify(HideColObj);


    let DdlOrders = document.getElementById(ele.id);
    let clientmaster_code = DdlOrders.options[DdlOrders.selectedIndex].attributes["clientmaster_code"].value;

    $('#ddlParty_' + RowNo).val(clientmaster_code);
    $(`#ddlParty_${RowNo}`).select2({
        width: '-webkit-fill-available'
    });
}

function AddNexRow() {

    CoilProductionPlan_GetCoilProductionPlanGridViewOrNewRow('GetCoilProductionPlanNewRow');
    
}
function CoilProductionPlan_addORSave() {
    AddNexRow();
}

function SaveCoilPlan(PayLoad, rowNo) {

    if (PayLoad.ItemMaster_Code == 0 || PayLoad.ItemMaster_Code == "0") {
        toastr.error('Item Name can not be blank in row: ' + rowNo);
        return;
    }
    if (PayLoad.ItemSizeMaster_Code == 0 || PayLoad.ItemSizeMaster_Code == "0") {
        toastr.error('Size can not be blank in row: ' + rowNo);
        return;
    }
    if (PayLoad.IdentificationNo == '' || PayLoad.IdentificationNo == "") {
        toastr.error('ID can not be blank in row: ' + rowNo);
        return;
    }

    let validate = true;

   PayLoad.PlanTransactions.forEach(item => {
       $.each($('.txt_' + item.ProcessMaster_Code + '_' + rowNo), function (key, val) {

            if ((item.SlitWidth == 0 || item.SlitWidth=="0") && val.id.toUpperCase().includes("SLITWIDTH") == true) {
                toastr.error(`${val.id.split('_')[3]} can not be blank in row: ` + rowNo);
                validate = false;
                return; 
            }

            if ((item.NoOfSlit == 0 || item.NoOfSlit == "0") && val.id.toUpperCase().includes("NOOFSLIT") == true) {
                toastr.error(`${val.id.split('_')[3]} can not be blank in row: ` + rowNo);
                validate = false;
                return;
            }

        });

    })

    if (validate == false) {
        return;
    }
    

    CoilProductionPlanService.SaveCoilPlan(JSON.stringify(PayLoad)).then(function (response) {
        console.log(response);
        toastr.success(response.Msg);
    });
}
Bind_ddlIssueItems();
Bind_ddlParty();
Bind_ddlOrders();
//CoilProductionPlan_GetCoilProductionPlanGridViewOrNewRow('GetCoilProductionPlanGridView');

window.CoilProductionPlan_OnChangeDdlIssueItems = CoilProductionPlan_OnChangeDdlIssueItems;
window.CoilProductionPlan_OnChangeChkProcess = CoilProductionPlan_OnChangeChkProcess;
window.CoilProductionPlan_OnChangetxt = CoilProductionPlan_OnChangetxt;
window.CoilProductionPlan_OnChangeDdlSize = CoilProductionPlan_OnChangeDdlSize;
window.CoilProductionPlan_OnChangeDdlIDNo = CoilProductionPlan_OnChangeDdlIDNo;
window.CoilProductionPlan_OnChangeDdlParty = CoilProductionPlan_OnChangeDdlParty;
window.CoilProductionPlan_OnChangeDdlOrders = CoilProductionPlan_OnChangeDdlOrders;
window.CoilProductionPlan_addORSave = CoilProductionPlan_addORSave;


