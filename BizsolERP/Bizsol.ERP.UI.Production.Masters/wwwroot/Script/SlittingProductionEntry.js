
import { SlittingProductionEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SlittingProductionEntryService.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';
$("#ERPHeading").text("Production Entry GP");
$('#txtFromDate').val(new Date().toISOString().slice(0, 10));
$('#txtToDate').val(new Date().toISOString().slice(0, 10));
$('#txtSlittingDate').val(new Date().toISOString().slice(0, 10));


let PackingListFGFixedParaMeters = [];
let AskNoOfPassInSlitting = "N";
let ManualIDApplicable_FixedParameterPurchase = "N";
let ManualIDApplicable_Process = "N";
let ShowZincWeight = "N";
let AddStdZincPerMT = 0.0;
let G_issueWidth = 0;
let G_ddlItemReceivedOption = '';
let LockDateAndShiftInWeb = "N";
let IsGetWeightByScale = false;
let indxHiddenCol_tbSlittingReceivedDetails = 8;
let indxWeightCol_tbSlittingReceivedDetails = 5;

let G_SlittingPlanMaster_Code = 0;



let G_isView = "N";
function ChangeMode(Mode) {
    $('#DivProductionGPForm').hide();
    $('#DivProductionGPViewGrid').hide();
    if (Mode === 'New' || Mode === 'View' || Mode === 'Edit') {
        $('#DivProductionGPForm').show();
        $('#DivProductionGPViewGrid').hide();

    } else {
        $('#DivProductionGPForm').hide();
        $('#DivProductionGPViewGrid').show();
    }

}
function SlittingProductionEntry_ShowPlanGrid() {
    let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
    
    if (FromDate == "" && Todate == "") {
        return false;
    }
    let filterType = $('input[name="filterType"]:checked').val();
    Showloader();
    SlittingProductionEntryService.GetSlittingPlanOrEntrySummary(FromDate, Todate,filterType).then(function (response) {
        HideLoader();
        if (filterType == 'Plan') {
            response.forEach(item => {
                item.Action = '<a class="btn btn-info icon-height" onclick="SlittingProductionEntry_EditOrView(\'Y\',\'' + item.SlittingPlanMaster_Code + '\')"> <i class="fa fa-pencil"></i></a>'
            });
        }
       // console.log(response);
        //response = response.map((item) => ({
        //    "PackingList No": item.PackingListNo, Date: item.PackingListDate, Warehouse: item.GodownName, "Packing Type": item.PackingType, "Requisition No / Order No": item["Requisition No"], "Party Name": item.ClienName, "Qty KG": item.QtyMT, "Qty PC": item.QtyPC, "Qty SQM": item.QtyMTRS, Status: item.PKStatus,
        //    Action: item.Verify === 'N' && item.AllowVerify == 'Y' ? '<a class="btn btn-info icon-height" title="Edit" onclick="SlittingProductionEntry_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;&nbsp;<a class="btn btn-success icon-height" title="Verify" onclick="SlittingProductionEntry_Verify(\'' + item.Code + '\')"><i class="fa fa-check"></i></a>': item.Verify === 'N' ? '<a class="btn btn-info icon-height" title="Edit" onclick="SlittingProductionEntry_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>' : '<a class="btn btn-dark icon-height" title="View" onclick="SlittingProductionEntry_EditOrView(\'N\',\'' + item.Code + '\')"> <i class="fa fa-eye"></i></a>', 
        //    QtyMT: item.QtyMT, QtyPC: item.QtyPC, QtyMTRS: item.QtyMTRS
        //}))
        console.log(response);
        const StringFilterColumn = ["Warehouse", "Packing Type", "Requisition No / Order No", "Party Name","Status"];
        const NumericFilterColumn = ["PackingList No"];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["QtyMT", "QtyPC", "QtyMTRS","SlittingPlanMaster_Code"];
        const ColumnAlignment = {
            "Qty PC": 'right',
            "Qty KG": 'right',
            "Qty SQM": 'right',
        };

        if (response.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbProductionGPViewHeader", "tbProductionGPViewBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
           // WebLocatePackingSumDispatch(response);
        } else {
            $('#tbProductionGPView tr').empty()
            $('#paginator-tbProductionGPView').empty();
        }

    });

    ChangeMode('');
}

function WebLocatePackingSumDispatch(response) {
    let DispatchRows = response.filter(item => item["Packing Type"] ==='Dispatch');
    let StockRows = response.filter(item => item["Packing Type"] === 'Stock Transfer');

    let DispatchTotalMT = 0;
    let DispatchTotalPC = 0;
    let DispatchTotalMTRS = 0;
    let StockTotalMT = 0;
    let StockTotalPC = 0;
    let StockTotalMTRS = 0;

    if (StockRows.length > 0)
    {
        StockTotalMT = StockRows.reduce((partialSum, item) => partialSum + item.QtyMT, 0)
        StockTotalPC = StockRows.reduce((partialSum, item) => partialSum + item.QtyPC, 0)
        StockTotalMTRS = StockRows.reduce((partialSum, item) => partialSum + item.QtyMTRS, 0)
    }

    if (DispatchRows.length > 0) {
        DispatchTotalMT = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyMT, 0)
        DispatchTotalPC = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyPC, 0)
        DispatchTotalMTRS = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyMTRS, 0)
    }
    let tfootContent = `
        <tr id="trDispatchTotal">
        <td colspan="5"></td>
        <td >DISPATCH TOTAL:</td>
        <td style="text-align: right;">${ parseFloat(DispatchTotalMT).toFixed(2)}</td >
        <td style="text-align: right;">${DispatchTotalPC}</td>
        <td style="text-align: right;">${parseFloat(DispatchTotalMTRS).toFixed(2)}</td>
        <td colspan="2"></td>
        </tr>
        <tr id="trStockTotal">
        <td colspan="5"></td>
        <td >STOCK TRANSFER TOTAL :</td>
        <td style="text-align: right;">${parseFloat(StockTotalMT).toFixed(2)}</td>
        <td style="text-align: right;">${StockTotalPC}</td>
        <td style="text-align: right;">${parseFloat(StockTotalMTRS).toFixed(2)}</td>
        <td colspan="2"></td>
        </tr>
        <tr id="trTotal">
        <td colspan="5"></td>
        <td >TOTAL:</td>
        <td style="text-align: right;">${parseFloat((DispatchTotalMT + StockTotalMT)).toFixed(2)}</td>
        <td style="text-align: right;">${(DispatchTotalPC + StockTotalPC)}</td>
        <td style="text-align: right;">${parseFloat((DispatchTotalMTRS + StockTotalMTRS)).toFixed(2)}</td>
        <td colspan="2"></td>
        </tr>
        `;

   

    $('#tbProductionGPView tfoot')[0].innerHTML = tfootContent;



}
function PackingListTransactionSum(response) {
    let DispatchRows = response

    let ColSpan = 3;
    let tdQtyRMTR = '';
    let DispatchTotalMT = 0;
    let DispatchTotalPC = 0;
    let DispatchTotalMTRS = 0;
    let DispatchTotalRMTR = 0;
    

    

    if (DispatchRows.length > 0) {
        DispatchTotalMT = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyMT, 0)
        DispatchTotalPC = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyPC, 0)
        DispatchTotalMTRS = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyMTRS, 0)
        DispatchTotalRMTR = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyRMTR, 0)
    }

    if (G_OnlyEntry == "S") {
        ColSpan = 2;
    }
    if (FourthOrderUnitApplicable === "Y") {
        tdQtyRMTR = `<td style="text-align: right;">${parseFloat((DispatchTotalRMTR)).toFixed(2)}</td>`
    }

    let tfootContent = `
        <tr id="trTotalPackingListTransaction">
        <td colspan="${ColSpan}"></td>
        <td >TOTAL:</td>
        <td style="text-align: right;">${parseFloat((DispatchTotalMT)).toFixed(2)}</td>
        <td style="text-align: right;">${(DispatchTotalPC)}</td>
        <td style="text-align: right;">${parseFloat((DispatchTotalMTRS)).toFixed(2)}</td>
        ${tdQtyRMTR}
        
        </tr>
        `;



    $('#tbPackingListTransaction tfoot')[0].innerHTML = tfootContent;



}
function getPackingListFGFixedParaMeters() {
    SlittingProductionEntryService.GetFixedParaMeter().then(function (response) {
        PackingListFGFixedParaMeters = response;
        LoadFrm();
    });
}
function SelectOptionByText(Id, FindText) {
    var dd = document.getElementById(Id);
    for (var i = 0; i < dd.options.length; i++) {
        if (dd.options[i].text === FindText) {
            dd.selectedIndex = i;
            break;
        }
    }
    $('#' + Id).select2({
        width: '-webkit-fill-available'
    })
}
function Bind_ddlShift() {
    SlittingProductionEntryService.GetSlittingProductionEntryDDl('ddlShift',0).then(function (response) {

        BindSelectList($('#ddlShift')[0], response.map((item) => ({ Code: item.Code, Desp: item.Desp })))
        

        $('#ddlShift').select2({
            width: '-webkit-fill-available'
        });

        SlittingProductionEntryService.GetSlittingProductionEntryDDl('getCurrentShift', 0).then(function (response) {

            $('#ddlShift').val(response[0].Code);

            $('#ddlShift').select2({
                width: '-webkit-fill-available'
            });
        });

    });

    
}
function Bind_ddlProcess() {
    SlittingProductionEntryService.GetSlittingProductionEntryDDl('dllProcess',0).then(function (response) {
       

        let option = '<option value="0" ShowTimeInProduction="0" ManualIDApplicable="0" ShowZincWeight="0" AddStdZincPerMT="0" AskNoOfPassInSlitting="0" LockDateAndShiftInWeb="0"></option>';
        $.each(response, function (key, val) {

            option += '<option value="' + val.Code + '" ShowTimeInProduction="' + val.ShowTimeInProduction + '" ManualIDApplicable="' + val.ManualIDApplicable + '" ShowZincWeight="' + val.ShowZincWeight + '" AddStdZincPerMT="' + val.AddStdZincPerMT + '" AskNoOfPassInSlitting="' + val.AskNoOfPassInSlitting + '" LockDateAndShiftInWeb="' + val.LockDateAndShiftInWeb + '">' + val.ProcessName + '</option>';
        });

        $('#ddlProcess')[0].innerHTML = option;
        
        $('#ddlProcess').select2({
            width: '-webkit-fill-available'
        });
       
        
    });
}



function Bind_ddlIdNo(ProcessMaster_Code) {
    SlittingProductionEntryService.GetSlittingProductionEntryDDl('GetPlans', ProcessMaster_Code).then(function (response) {
        BindSelectList($('#ddlIdNo')[0], response.map((item) => ({ Code: item.Code, Desp: item.IdentificationNo })))
        BindSelectList($('#ddlPlanNo')[0], response.map((item) => ({ Code: item.Code, Desp: item.PlanNo })))

        
        $('#ddlIdNo').select2({
            width: '-webkit-fill-available'
        });

        
        $('#ddlPlanNo').select2({
            width: '-webkit-fill-available'
        });
        
    });
}

function Bind_AllDLL() {
    Bind_ddlShift();
    Bind_ddlProcess();
   
}
function Bind_ddlMachineNo(ProcessMaster_Code) {
    SlittingProductionEntryService.GetSlittingProductionEntryDDl('ddlMachineNo', ProcessMaster_Code).then(function (response) {
        BindSelectList($('#ddlMachineNo')[0], response.map((item) => ({ Code: item.Code, Desp: item.Desp })))
        $('#ddlMachineNo').select2({
                width: '-webkit-fill-available'
        });
        
    });
}
function Bind_ddlScrapItem(ProcessMaster_Code) {
    SlittingProductionEntryService.GetSlittingProductionEntryDDl('ddlScrapItem', ProcessMaster_Code).then(function (response) {
        BindSelectList($('#ddlScrapItem')[0], response.map((item) => ({ Code: item.ItemMaster_Code, Desp: item.ItemName })))
        $('#ddlScrapItem').select2({
            width: '-webkit-fill-available'
        });

    });
}
function Bind_ddlItemReceived(ProcessMaster_Code) {
    SlittingProductionEntryService.GetSlittingProductionEntryDDl('ddlItemReceived', ProcessMaster_Code).then(function (response) {
        
        G_ddlItemReceivedOption = '<option value="0" ByProduct="0"></option>';

        $.each(response, function (key, val) {

            G_ddlItemReceivedOption += '<option value="' + val.ItemMaster_Code + '" ByProduct="' + val.ByProduct + '" >' + val.ItemName + '</option>';
        });

    });
}
function Bind_IssueAndReceivedCoilDetail(G_SlittingPlanMaster_Code) {
    SlittingProductionEntryService.GetSlittingProductionEntryDDl('IssueCoilDetail', G_SlittingPlanMaster_Code).then(function (response) {
        

        console.log(response)

        response = response.map((item) => ({
            "Identification No": item["Identification No"],
            "Size Desp": item["Size Desp"],
            "Actual Width": item["Actual Width"],
            "Weight": item.Weight,
            "Actual Weight": '<input id="txtActualWeight" class="BizSolFormControl form-control form-control-sm" type="text" onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);" maxlength="6" autocomplete="off" value="' + item["Actual Weight"] +'" style="text-align: right;" onchange="SlittingProductionEntry_CalActualZincWeight()">',
            "Actual Zinc Weight": '<input id="txtActualZincWeight" class="BizSolFormControl form-control form-control-sm" type="text" onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);" maxlength="6" autocomplete="off" value="' + item.ZincWeight +'" style="text-align: right;" onchange="SlittingProductionEntry_CalRecevieZincWeight()">',
            "PC": '<input id="txtIssuePC" class="form-control form-control-sm" type="text" maxlength="6" autocomplete="off" value="' + item.PC + '" readonly style="text-align: right;">',
            MachineNo: item.MachineNo
        }))

        

        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["MachineNo"];
        const ColumnAlignment = {
        };

        if (ShowZincWeight==='N') {
            hiddenColumns.push("Actual Zinc Weight")
        }

        if (response.length > 0) {
            G_issueWidth = response[0]["Actual Width"];
            
            SelectOptionByText('ddlMachineNo', response[0].MachineNo);
            BizsolCustomFilterGrid.CreateDataTable("tbSlittingIssueDetailsHeader", "tbSlittingIssueDetailsBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)

            $('#paginator-tbSlittingIssueDetails').empty();


        }
        else {
            $('#tbSlittingIssueDetails tr').empty();
            $('#paginator-tbSlittingIssueDetails').empty();
        }



        SlittingProductionEntryService.GetSlittingProductionEntryDDl('ReceivedCoilDetails', G_SlittingPlanMaster_Code).then(function (response2) {
            console.log(response2)
            let ele = document.getElementById('ddlProcess')

            let eleText = ele.options[ele.selectedIndex].text;

            let ThicknessApplicable = response2[0].ThicknessApplicable;
            
            response2 = response2.map((item) => ({
                "SNo": item.SNo,
                //"Item Name": item.ItemName,
                "Item Name": `<select id="ItemReceived_${item.SNo}" class="form-control form-control-sm box_border">${G_ddlItemReceivedOption}</select>`,
                "Size Desp": item.SizeDesp,
                "Thickness": item.itemThick,
                "PCs": eleText.toLowerCase() == 'slitting' && item.NoofSlits > 1 ? `${item.NoofSlits} &nbsp;&nbsp;<a class="btn btn-primary icon-height" id="btnAvailableOrderStock" onclick="">Split PC</a>` : item.NoofSlits,
                "Weight": '<input  class="form-control form-control-sm itemWeight" type="text" maxlength="6" autocomplete="off" value="' + parseFloat(item.Weight).toFixed(3) + '" style="text-align: right;" onchange="SlittingProductionEntry_CalScrapWeight()">',
                "No Of Pass": '<input  class="form-control form-control-sm" type="text" maxlength="6" autocomplete="off" value="' + item.NoOfPass + '" style="text-align: right;">',
                "Manual ID": '<input  class="form-control form-control-sm" type="text" maxlength="6" autocomplete="off" value="' + item.ManualIDNo + '" style="text-align: right;">',
                "HiddenCol": JSON.stringify(item)
                }
            ))

            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = []
            const StringdoubleFilterColumn = [];
            let hiddenColumns = ["HiddenCol"];
            const ColumnAlignment = {
                
            };

           
            if (ManualIDApplicable_FixedParameterPurchase === 'N' || ManualIDApplicable_Process === 'N') {
                hiddenColumns.push("Manual ID");
            }
            if (ThicknessApplicable === 'N') {
                hiddenColumns.push("Thickness");
            }
            if (AskNoOfPassInSlitting === 'N') {
                hiddenColumns.push("No Of Pass");
            }
            

            if (response2.length > 0) {
                BizsolCustomFilterGrid.CreateDataTable("tbSlittingReceivedDetailsHeader", "tbSlittingReceivedDetailsBody", response2, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)

                
                $('#paginator-tbSlittingReceivedDetails').empty();
                let tbItemReceived = document.getElementById("tbSlittingReceivedDetails")

                //initialize ItemReceived select control begin

                for (let i = 1; i < tbItemReceived.rows.length; i++) {

                    let tbItemReceivedUpdateRow = tbItemReceived.rows[i];
                    let HideColObj = JSON.parse(tbItemReceivedUpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
                    let ItemMaster_Code = HideColObj.ItemMaster_Code;

                    $('#ItemReceived_'+i).val(ItemMaster_Code);
                    $('#ItemReceived_'+i).select2({
                        width: '-webkit-fill-available'
                    });
                }
                //initialize ItemReceived select control end

            } else {
                $('#tbSlittingReceivedDetails tr').empty();
                $('#paginator-tbSlittingReceivedDetails').empty();
            }


        });


    });

}


function BindSelectList(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

function SlittingProductionEntry_CalActualZincWeight() {

    let ActualWeight = $('#txtActualWeight').val();
    let StdZinWeight = parseFloat((AddStdZincPerMT / 1000.0) * (ActualWeight * 1000.0)).toFixed(4);
    $('#txtActualZincWeight').val(parseFloat(StdZinWeight).toFixed(3));
    SlittingProductionEntry_CalRecevieZincWeight();
}

function SlittingProductionEntry_CalRecevieZincWeight(IsCallByScrap = 'N') {

    let ActualWeight = $('#txtActualWeight').val();

    let ActualZincWeight = $('#txtActualZincWeight').val();

    let issueWidth = G_issueWidth;
    let ScrapWeight = $('#txtScrapWeight').val() == '' ? 0 : $('#txtScrapWeight').val();

    if (IsCallByScrap === 'Y') {
        let TreceviedWidth = 0;
        let tbItemDetail = document.getElementById("tbSlittingReceivedDetails");
        for (let i = 1; i < tbItemDetail.rows.length; i++) {
            
            let tbItemDetailUpdateRow = tbItemDetail.rows[i];
            let HideColObj = JSON.parse(tbItemDetailUpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
            let ItemWidth = HideColObj.WidthNum;
            let QtyPc = HideColObj.NoofSlits;
                
            TreceviedWidth += Number(ItemWidth) * Number(QtyPc);

            


        }

        issueWidth = TreceviedWidth.toString();
    }

    let PerPcWeight = parseFloat(((Number(ActualWeight) + Number(ActualZincWeight)) - Number(ScrapWeight)) / Number(issueWidth)).toFixed(10);
    let tbItemDetail = document.getElementById("tbSlittingReceivedDetails");
    // Set Weight
    for (let i = 1; i < tbItemDetail.rows.length; i++) {
        if (i == 0) {

        }
        else {
            let tbItemDetailUpdateRow = tbItemDetail.rows[i];
            let HideColObj = JSON.parse(tbItemDetailUpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
            let ItemWidth = HideColObj.WidthNum;
            let QtyPc = HideColObj.NoofSlits;
            tbItemDetailUpdateRow.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value = parseFloat(ItemWidth * PerPcWeight * QtyPc).toFixed(3);

        }


    }
}

function SlittingProductionEntry_CalScrapPerWeight() {
    SlittingProductionEntry_CalRecevieZincWeight('Y')
}
function SlittingProductionEntry_CalScrapWeight() {
    let weightList = $('.itemWeight');
    let actualWeight = parseFloat($('#txtActualWeight').val()).toFixed(3);
    let totalItemWeight = 0;

    //totalItemWeight = weightList.reduce((partialSum, item) => parseFloat(partialSum + item.value), 0)
    $.each(weightList, function (index, value) {

        totalItemWeight += parseFloat(value.value);
    });


    if (AddStdZincPerMT > 0 && ShowZincWeight === "Y") {
        actualWeight = Number(actualWeight) + Number($('#txtActualZincWeight').val());
        actualWeight = actualWeight;
    }
    let scrapWeight = parseFloat(actualWeight - totalItemWeight).toFixed(3);
    if (isNaN(scrapWeight) || scrapWeight < 0) {
        $('#txtScrapWeight').val('0');
    }
    else {
        $('#txtScrapWeight').val(scrapWeight);
    }
}

function CalSlitWeightByReceivedWeight() {

    let TreceviedWidth = 0;
    let TreceviedWeight = $('#txtTotalReceivedWeight').val();
    let tbItemReceived = document.getElementById("tbSlittingReceivedDetails");
    let balForScrap = 0;
    if (Number($('#txtActualWeight').val()) >= TreceviedWeight) {
        balForScrap = parseFloat(Number($('#txtActualWeight').val()) - TreceviedWeight).toFixed(3);
    }
    let isScrapInGrid = false;
    if (TreceviedWeight > 0) {
        for (let i = 1; i < tbItemReceived.rows.length; i++) {

            let tbItemReceivedUpdateRow = tbItemReceived.rows[i];
            let HideColObj = JSON.parse(tbItemReceivedUpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
            let ItemWidth = HideColObj.WidthNum;
            let QtyPc = HideColObj.NoofSlits;
            let ByProduct = HideColObj.ByProduct;
            if (ByProduct == "N") {
                TreceviedWidth += Number(ItemWidth) * Number(QtyPc);
            }
        }




        let PerWidthWeight = parseFloat(Number(TreceviedWeight) / Number(TreceviedWidth)).toFixed(10);

        // Set Weight
        for (let i = 1; i < tbItemReceived.rows.length; i++) {

            let tbItemReceivedUpdateRow = tbItemReceived.rows[i];
            let HideColObj = JSON.parse(tbItemReceivedUpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
            let ItemWidth = HideColObj.WidthNum;
            let QtyPc = HideColObj.NoofSlits;
            let ByProduct = HideColObj.ByProduct;
            if (ByProduct == "N") {
                tbItemReceivedUpdateRow.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value = parseFloat(ItemWidth * PerWidthWeight * QtyPc).toFixed(3);
            }
            else {
                tbItemReceivedUpdateRow.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value = balForScrap;
                isScrapInGrid = true;
            }
        }

        if (isScrapInGrid == false && balForScrap > 0) {
            $('#txtScrapWeight').val(balForScrap);
            document.getElementById("ddlScrapItem").options.selectedIndex = 1;
            $('#ddlScrapItem').select2({
                width: '-webkit-fill-available'
            });
        }
    }

}
function EditMode(isView) {
    G_isView = isView;
    //alert('Mode:' + isView + SlittingPlanMaster_Code);
    if (Number(SlittingPlanMaster_Code) > 0) {
        SlittingProductionEntryService.GetShowPackingListData(SlittingPlanMaster_Code, G_OnlyEntry).then(function (response) {

           
            console.log(response);
            if (response.length > 0) {
                BuyerPOMaster_Code = response[0][0].BuyerPoMaster_Code;
                ArryPackingListTransaction = response[1];
                Bind_PackingListTransactionGrid(isView);
                SelectOptionByText('ddlShift', response[0][0].PackingType);
                SlittingProductionEntry_OnChangeddlShift();

                $('#txtScanIdentification').removeAttr("readonly");

                $('#txtScrapWeight').val(response[0][0].PackingListNo);
               
                //$('#txtSlittingDate').val(new Date(response[0].PackingListDate).toISOString().slice(0, 10));
                $('#txtSlittingDate').val(response[0][0].PackingListDate.slice(0, 10));

                

                $('#ddlShift').attr("disabled", "disabled");
                $('#ddlScrapItem').attr("disabled", "disabled");
                $('#ddlIdNo').attr("disabled", "disabled");
                $('#ddlReqNo').attr("disabled", "disabled");
                $('#ddlMachineNo').attr("disabled", "disabled");
       
                $('#ddlProcess').attr("disabled", "disabled");
                $('#ddlPlanNo').attr("disabled", "disabled");

                SelectOptionByText('ddlScrapItem', response[0][0].GodownName);
                SelectOptionByText('ddlIdNo', response[0][0].GodownNameTo);
                
                SelectOptionByText('ddlReqNo', response[0][0].RMRequisitionNo);
        
                SelectOptionByText('ddlProcess', response[0][0].ClienName);
                SelectOptionByText('ddlPlanNo', response[0][0].ConsigneeName);
                

                if (response[0].PackingType !== 'Stock Transfer') {
                    //BindOrderNOForBatchPackingList(PackingListCode);

                }


                if (InvoiceByOrder === 'Y') {
                    Bind_ddlMachineNo("GetPendingOrderListByPartyName", response[0][0].ConsigneeName);
                    //$('#ddlMachineNo').val(BuyerPOMaster_Code)
                    

                    //$('#ddlMachineNo').select2({
                    //    width: '-webkit-fill-available'
                    //});

                }

                else {
                    //BindOrderNOForBatchPackingList(PackingListCode);
                    //$('#ddlMachineNo').val('@ViewBag.DespatchAdviceMaster_Code');
                    //$('#hfddlMachineNo').val('@ViewBag.DespatchAdviceMaster_Code');
                }
                
                $('#txtSlittingDate').attr("readonly", true);
                $('#ddlTransporterName').attr("readonly", true);
                $('#DriverNo').attr("readonly", true);
                $('#VehicleNo').attr("readonly", true);
                $('#Distance').attr("readonly", true);
                $('#txtGRNo').attr("readonly", true);
                $('#txtGRDate').attr("readonly", true);
                

                //if ('@ViewBag.ddlShift' === 'Stock Transfer') { changeddlShift(); }

                

                if ('@ViewBag.LoadingStatus' === 'C') { $('#btnLoadingEnd')[0].innerHTML = "Loaded"; $('#btnScanNoPallet').hide(); } else {
                    $('#btnLoadingEnd').removeAttr("disabled");
                    $('#btnLoadingEnd').attr("onclick", "return SlittingProductionEntry_EndLoading()");
                }
                
                if (isView === 'Y') {
                   
                    $('#txtScanIdentification').attr("readonly", true);
                    $('#btnLoadingEnd').removeAttr("onclick");
                    $('#btnLoadingEnd').attr("disabled", "disabled(");
                    $('#btnLoadingEnd')[0].innerHTML = "Loaded";
                    $('#btnScanNoPallet').hide();
                    $('#btnStart')[0].innerHTML = 'Scan Started';
                    $('#btnStart').attr("disabled", "disabled");
                    $('#btnStart').removeAttr("onclick");

                }
                else {
                    $('#btnStart')[0].innerHTML = 'Scan Started';
                    $('#btnStart').attr("disabled", "disabled");
                    $('#btnStart').removeAttr("onclick");
                }
                
            }
            

        });

        

    }
}

function SlittingProductionEntry_CreateNew() {

      // ClrFrm();
      ChangeMode('New');
}
function SlittingProductionEntry_Back() {
    SlittingProductionEntry_ShowPlanGrid()
    ChangeMode('');
}
function SlittingProductionEntry_EditOrView(isEdit, slittingPlanMaster_Code) {

    $('#tbPackingListTransaction tr').empty();
    $('#paginator-tbPackingListTransaction').empty();

    ChangeMode('Edit');
  

    if (isEdit === 'Y') {
        SlittingProductionEntryService.EditValidatePackingListBatchNo(slittingPlanMaster_Code).then(function (response) {
            if (response.Status == 'Y') {

                //$('#paginator-tbPackingListTransaction').show();
                SlittingPlanMaster_Code = slittingPlanMaster_Code;
                //EditMode('N');
                ChangeMode('Edit');
            } else {
                toastr.error(response.Msg);
            }

        });
    } else {
        $('#paginator-tbPackingListTransaction').show();
        SlittingPlanMaster_Code = slittingPlanMaster_Code;
        //EditMode('Y');
        ChangeMode('View');
    }


}



function SlittingProductionEntry_OnChangeddlProcess() {
    let ProcessMaster_Code=0
    let ddlProcess = document.getElementById("ddlProcess");

    AskNoOfPassInSlitting = ddlProcess.options[ddlProcess.selectedIndex].attributes["AskNoOfPassInSlitting"].value;

    ManualIDApplicable_Process = ddlProcess.options[ddlProcess.selectedIndex].attributes["ManualIDApplicable"].value

    ShowZincWeight = ddlProcess.options[ddlProcess.selectedIndex].attributes["ShowZincWeight"].value

    AddStdZincPerMT = ddlProcess.options[ddlProcess.selectedIndex].attributes["AddStdZincPerMT"].value

    ProcessMaster_Code = $('#ddlProcess').val();

    Bind_ddlMachineNo(ProcessMaster_Code);
    Bind_ddlIdNo(ProcessMaster_Code);
    Bind_ddlScrapItem(ProcessMaster_Code);
    Bind_ddlItemReceived(ProcessMaster_Code);
    
}
function SlittingProductionEntry_OnChangeddlPlanOrIds(element) {

    G_SlittingPlanMaster_Code = element.id === 'ddlPlanNo' ? $('#ddlPlanNo').val() : $('#ddlIdNo').val();
    
    $('#ddlPlanNo').val(G_SlittingPlanMaster_Code);
    $('#ddlIdNo').val(G_SlittingPlanMaster_Code);

    $('#ddlPlanNo').select2({
        width: '-webkit-fill-available'
    });
    $('#ddlIdNo').select2({
        width: '-webkit-fill-available'
    });

    Bind_IssueAndReceivedCoilDetail(G_SlittingPlanMaster_Code);
    

}


function ClrFrm() {
    SlittingPlanMaster_Code = 0;
    BuyerPOMaster_Code = 0;
    ArryPackingListTransaction = [];
    AddPackingListTransaction = [];

    $('#txtScrapWeight').val('0');
    $('#txtScanIdentification').val('');
    //$('#txtSlittingDate').val(new Date(response[0].PackingListDate).toISOString().slice(0, 10));
    $('#txtSlittingDate').val(new Date().toISOString().slice(0, 10));
    SelectOptionByText('ddlShift', 'Dispatch');
    
    $('#ddlScrapItem').val('0');
    $('#ddlIdNo').val('0');
    $('#ddlReqNo').val('0');
    $('#ddlMachineNo').val('0');
    $('#ddlMachineNo')[0].innerHTML = "";
    $('#ddlProcess').val('0');
    $('#ddlPlanNo').val('0');

    

    $('#ddlTransporterName').val("0");
    $('#DriverNo').val("");
    $('#VehicleNo').val("");
    $('#Distance').val("0");
    $('#txtGRNo').val("");
    $('#txtGRDate').val("");


   
    $('#ddlScrapItem').select2({
        width: '-webkit-fill-available'
    });
    $('#ddlIdNo').select2({
        width: '-webkit-fill-available'
    });
    $('#ddlReqNo').select2({
        width: '-webkit-fill-available'
    });
    $('#ddlMachineNo').select2({
        width: '-webkit-fill-available'
    });
    $('#ddlProcess').select2({
        width: '-webkit-fill-available'
    });
    $('#ddlPlanNo').select2({
        width: '-webkit-fill-available'
    });
    $('#ddlTransporterName').select2({
        width: '-webkit-fill-available'
    });



    $('#ddlShift').removeAttr("disabled");
    $('#ddlScrapItem').removeAttr("disabled");
    $('#ddlIdNo').removeAttr("disabled");
    $('#ddlReqNo').removeAttr("disabled");
    $('#ddlMachineNo').removeAttr("disabled");

    $('#ddlProcess').removeAttr("disabled");
    $('#ddlPlanNo').removeAttr("disabled");

    $('#txtSlittingDate').removeAttr("readonly");
    $('#ddlTransporterName').removeAttr("readonly");
    $('#DriverNo').removeAttr("readonly");
    $('#VehicleNo').removeAttr("readonly");
    $('#Distance').removeAttr("readonly");
    $('#txtGRNo').removeAttr("readonly");
    $('#txtGRDate').removeAttr("readonly");

    $('#btnStart')[0].innerHTML = 'Start Scan';
    $('#btnStart').removeAttr("disabled");
    $('#btnStart').attr("onclick","SlittingProductionEntry_StartLoading()");

    $('#divGodownTo').hide();
    $('#divReqNo').hide();
    $('#txtScanIdentification').attr('readonly', 'readonly');

    $('#tbPackingListTransaction tr').empty();
    $('#paginator-tbPackingListTransaction').empty();
}

function LoadFrm() {
    

    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'ManualIDApplicable').PeramaterValue === 'Y') {
        ManualIDApplicable_FixedParameterPurchase = "Y";
    }
    
     
    
   
}

$('#txtTotalReceivedWeight').on('change', function () {
    CalSlitWeightByReceivedWeight();
});

SlittingProductionEntry_ShowPlanGrid();
getPackingListFGFixedParaMeters();
Bind_AllDLL();
//LoadFrm();



window.SlittingProductionEntry_CreateNew = SlittingProductionEntry_CreateNew;
window.SlittingProductionEntry_Back = SlittingProductionEntry_Back;
window.SlittingProductionEntry_ShowPlanGrid = SlittingProductionEntry_ShowPlanGrid;
window.SlittingProductionEntry_EditOrView = SlittingProductionEntry_EditOrView;
window.SlittingProductionEntry_OnChangeddlProcess = SlittingProductionEntry_OnChangeddlProcess;
window.SlittingProductionEntry_OnChangeddlPlanOrIds = SlittingProductionEntry_OnChangeddlPlanOrIds;
window.SlittingProductionEntry_CalScrapPerWeight = SlittingProductionEntry_CalScrapPerWeight;
window.SlittingProductionEntry_CalActualZincWeight = SlittingProductionEntry_CalActualZincWeight;
window.SlittingProductionEntry_CalRecevieZincWeight = SlittingProductionEntry_CalRecevieZincWeight;
window.SlittingProductionEntry_CalScrapWeight = SlittingProductionEntry_CalScrapWeight;


