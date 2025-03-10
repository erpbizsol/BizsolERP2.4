
import { SlittingProductionEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SlittingProductionEntryService.js';
import { SizeControlService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_SizeControlService.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';
import { BreakDownService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_BreakDownService.js';
$("#ERPHeading").text("Tube Mill Production");
$('#txtFromDate').val(new Date().toISOString().slice(0, 10));
$('#txtToDate').val(new Date().toISOString().slice(0, 10));

let baseUrl = sessionStorage.getItem('AppBaseURL');

//let PackingListFGFixedParaMeters = [];
//let AskNoOfPassInSlitting = "N";
//let ManualIDApplicable_FixedParameterPurchase = "N";
//let ManualIDApplicable_Process = "N";
//let AllowWeightOnlyByWeighment = "N";
//let ShowZincWeight = "N";
//let AddStdZincPerMT = 0.0;
//let G_issueWidth = 0;
//let G_ddlItemReceivedOption = '';
//let G_issueIdentificationNo = '';
//let G_IssueItemMaster_Code = 0;
//let G_IssueItemSizeMaster_Code = 0;
//let G_IssueGodownMaster_Code = 0;
//let G_IssueWeight = 0;
//let G_FormType = "Production";
//let LockDateAndShiftInWeb = "N";
//let IsGetWeightByScale = false;
//let indxSnoCol_tbSlittingReceivedDetails = 0;
//let indxItemNameCol_tbSlittingReceivedDetails = 1;
//let indxSizeDespCol_tbSlittingReceivedDetails = 2;
//let indxPCsCol_tbSlittingReceivedDetails = 4;
//let indxWeightCol_tbSlittingReceivedDetails = 5;
//let indxManualIDCol_tbSlittingReceivedDetails = 7;
//let indxHiddenCol_tbSlittingReceivedDetails = 8;

//let G_SlittingPlanMaster_Code = 0;
//let G_Row = ''

//let G_UserMaster_Code = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;


//let G_isView = "N";
//function ChangeMode(Mode) {
//    $('#DivProductionGPForm').hide();
//    $('#DivProductionGPViewGrid').hide();
//    if (Mode === 'New' || Mode === 'View' || Mode === 'Edit') {
//        $('#DivProductionGPForm').show();
//        $('#DivProductionGPViewGrid').hide();

//    } else {
//        $('#DivProductionGPForm').hide();
//        $('#DivProductionGPViewGrid').show();
//    }

//}
//function SlittingProductionEntry_ShowPlanGrid() {
//    let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
    
//    if (FromDate == "" && Todate == "") {
//        return false;
//    }
//    let filterType = $('input[name="filterType"]:checked').val();
//    Showloader();
//    SlittingProductionEntryService.GetSlittingPlanOrEntrySummary(FromDate, Todate,filterType).then(function (response) {
//        HideLoader();
//        if (filterType == 'Plan') {
//            response.forEach(item => {
//                item.Action = '<a class="btn btn-info icon-height" onclick="SlittingProductionEntry_EditOrView(\'Y\',\'' + item.SlittingPlanMaster_Code + '\')"> <i class="fa fa-pencil"></i></a>'
//            });
//        }
//       // console.log(response);
//        //response = response.map((item) => ({
//        //    "PackingList No": item.PackingListNo, Date: item.PackingListDate, Warehouse: item.GodownName, "Packing Type": item.PackingType, "Requisition No / Order No": item["Requisition No"], "Party Name": item.ClienName, "Qty KG": item.QtyMT, "Qty PC": item.QtyPC, "Qty SQM": item.QtyMTRS, Status: item.PKStatus,
//        //    Action: item.Verify === 'N' && item.AllowVerify == 'Y' ? '<a class="btn btn-info icon-height" title="Edit" onclick="SlittingProductionEntry_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>&nbsp;&nbsp;<a class="btn btn-success icon-height" title="Verify" onclick="SlittingProductionEntry_Verify(\'' + item.Code + '\')"><i class="fa fa-check"></i></a>': item.Verify === 'N' ? '<a class="btn btn-info icon-height" title="Edit" onclick="SlittingProductionEntry_EditOrView(\'Y\',\'' + item.Code + '\')"> <i class="fa fa-pencil"></i></a>' : '<a class="btn btn-dark icon-height" title="View" onclick="SlittingProductionEntry_EditOrView(\'N\',\'' + item.Code + '\')"> <i class="fa fa-eye"></i></a>', 
//        //    QtyMT: item.QtyMT, QtyPC: item.QtyPC, QtyMTRS: item.QtyMTRS
//        //}))
//        console.log(response);
//        const StringFilterColumn = ["Warehouse", "Packing Type", "Requisition No / Order No", "Party Name","Status"];
//        const NumericFilterColumn = ["PackingList No"];
//        const DateFilterColumn = [];
//        const Button = false;
//        const showButtons = []
//        const StringdoubleFilterColumn = [];
//        const hiddenColumns = ["QtyMT", "QtyPC", "QtyMTRS","SlittingPlanMaster_Code"];
//        const ColumnAlignment = {
//            "Qty PC": 'right',
//            "Qty KG": 'right',
//            "Qty SQM": 'right',
//        };

//        if (response.length > 0) {
//            BizsolCustomFilterGrid.CreateDataTable("tbProductionGPViewHeader", "tbProductionGPViewBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
//           // WebLocatePackingSumDispatch(response);
//        } else {
//            $('#tbProductionGPView tr').empty()
//            $('#paginator-tbProductionGPView').empty();
//        }

//    });

//    ChangeMode('');
//}

//function WebLocatePackingSumDispatch(response) {
//    let DispatchRows = response.filter(item => item["Packing Type"] ==='Dispatch');
//    let StockRows = response.filter(item => item["Packing Type"] === 'Stock Transfer');

//    let DispatchTotalMT = 0;
//    let DispatchTotalPC = 0;
//    let DispatchTotalMTRS = 0;
//    let StockTotalMT = 0;
//    let StockTotalPC = 0;
//    let StockTotalMTRS = 0;

//    if (StockRows.length > 0)
//    {
//        StockTotalMT = StockRows.reduce((partialSum, item) => partialSum + item.QtyMT, 0)
//        StockTotalPC = StockRows.reduce((partialSum, item) => partialSum + item.QtyPC, 0)
//        StockTotalMTRS = StockRows.reduce((partialSum, item) => partialSum + item.QtyMTRS, 0)
//    }

//    if (DispatchRows.length > 0) {
//        DispatchTotalMT = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyMT, 0)
//        DispatchTotalPC = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyPC, 0)
//        DispatchTotalMTRS = DispatchRows.reduce((partialSum, item) => partialSum + item.QtyMTRS, 0)
//    }
//    let tfootContent = `
//        <tr id="trDispatchTotal">
//        <td colspan="5"></td>
//        <td >DISPATCH TOTAL:</td>
//        <td style="text-align: right;">${ parseFloat(DispatchTotalMT).toFixed(2)}</td >
//        <td style="text-align: right;">${DispatchTotalPC}</td>
//        <td style="text-align: right;">${parseFloat(DispatchTotalMTRS).toFixed(2)}</td>
//        <td colspan="2"></td>
//        </tr>
//        <tr id="trStockTotal">
//        <td colspan="5"></td>
//        <td >STOCK TRANSFER TOTAL :</td>
//        <td style="text-align: right;">${parseFloat(StockTotalMT).toFixed(2)}</td>
//        <td style="text-align: right;">${StockTotalPC}</td>
//        <td style="text-align: right;">${parseFloat(StockTotalMTRS).toFixed(2)}</td>
//        <td colspan="2"></td>
//        </tr>
//        <tr id="trTotal">
//        <td colspan="5"></td>
//        <td >TOTAL:</td>
//        <td style="text-align: right;">${parseFloat((DispatchTotalMT + StockTotalMT)).toFixed(2)}</td>
//        <td style="text-align: right;">${(DispatchTotalPC + StockTotalPC)}</td>
//        <td style="text-align: right;">${parseFloat((DispatchTotalMTRS + StockTotalMTRS)).toFixed(2)}</td>
//        <td colspan="2"></td>
//        </tr>
//        `;

   

//    $('#tbProductionGPView tfoot')[0].innerHTML = tfootContent;



//}
//function getPackingListFGFixedParaMeters() {
//    SlittingProductionEntryService.GetFixedParaMeter().then(function (response) {
//        PackingListFGFixedParaMeters = response;
//        LoadFrm();
//    });
//}
//function SelectOptionByText(Id, FindText) {
//    var dd = document.getElementById(Id);
//    for (var i = 0; i < dd.options.length; i++) {
//        if (dd.options[i].text === FindText) {
//            dd.selectedIndex = i;
//            break;
//        }
//    }
//    $('#' + Id).select2({
//        width: '-webkit-fill-available'
//    })
//}
//function Bind_ddlShift() {
//    SlittingProductionEntryService.GetSlittingProductionEntryDDl('ddlShift',0).then(function (response) {

//        BindSelectList($('#ddlShift')[0], response.map((item) => ({ Code: item.Code, Desp: item.Desp })))
        

//        $('#ddlShift').select2({
//            width: '-webkit-fill-available'
//        });

//        SlittingProductionEntryService.GetSlittingProductionEntryDDl('getCurrentShift', 0).then(function (response) {

//            $('#ddlShift').val(response[0].Code);

//            $('#ddlShift').select2({
//                width: '-webkit-fill-available'
//            });
//        });

//    });

    
//}
//function Bind_ddlProcess() {
//    SlittingProductionEntryService.GetSlittingProductionEntryDDl('dllProcess',0).then(function (response) {
       

//        let option = '<option value="0" ShowTimeInProduction="0" ManualIDApplicable="0" ShowZincWeight="0" AddStdZincPerMT="0" AskNoOfPassInSlitting="0" LockDateAndShiftInWeb="0" FormType="0"></option>';
//        $.each(response, function (key, val) {

//            option += '<option value="' + val.Code + '" ShowTimeInProduction="' + val.ShowTimeInProduction + '" ManualIDApplicable="' + val.ManualIDApplicable + '" ShowZincWeight="' + val.ShowZincWeight + '" AddStdZincPerMT="' + val.AddStdZincPerMT + '" AskNoOfPassInSlitting="' + val.AskNoOfPassInSlitting + '" LockDateAndShiftInWeb="' + val.LockDateAndShiftInWeb + '" FormType="' + val.FormType + '">' + val.ProcessName + '</option>';
//        });

//        $('#ddlProcess')[0].innerHTML = option;
        
//        $('#ddlProcess').select2({
//            width: '-webkit-fill-available'
//        });
       
        
//    });
//}



//function Bind_ddlIdNo(Mode,ProcessMaster_Code) {
//    SlittingProductionEntryService.GetSlittingProductionEntryDDl(Mode, ProcessMaster_Code).then(function (response) {
//       // BindSelectList($('#ddlIdNo')[0], response.map((item) => ({ Code: item.Code, Desp: item.IdentificationNo })))
//        //BindSelectList($('#ddlPlanNo')[0], response.map((item) => ({ Code: item.Code, Desp: item.PlanNo })))

        

//        let option1 = '<option value="0" ProcessMaster_Code="0"></option>';
//        $.each(response, function (key, val) {

//            option1 += '<option value="' + val.Code + '" ProcessMaster_Code="' + val.ProcessMaster_Code + '" >' + val.IdentificationNo + '</option>';
//        });

//        $('#ddlIdNo')[0].innerHTML = option1;
//        $('#ddlIdNo').select2({
//            width: '-webkit-fill-available'
//        });


//        let option = '<option value="0" ProcessMaster_Code="0"></option>';
//        $.each(response, function (key, val) {

//            option += '<option value="' + val.Code + '" ProcessMaster_Code="' + val.ProcessMaster_Code + '" >' + val.PlanNo + '</option>';
//        });

//        $('#ddlPlanNo')[0].innerHTML = option;
//        $('#ddlPlanNo').select2({
//            width: '-webkit-fill-available'
//        });


//        if (response.length == 0) {
//            G_SlittingPlanMaster_Code = 0;
//            Bind_IssueAndReceivedCoilDetail(G_SlittingPlanMaster_Code);
//            return;
//        }
//        if (G_SlittingPlanMaster_Code>0) {
//            $('#ddlPlanNo').val(G_SlittingPlanMaster_Code);
//            $('#ddlIdNo').val(G_SlittingPlanMaster_Code);

//            $('#ddlPlanNo').select2({
//                width: '-webkit-fill-available'
//            });
//            $('#ddlIdNo').select2({
//                width: '-webkit-fill-available'
//            });
//        }
//    });
//}

//function Bind_AllDLL() {
//    Bind_ddlShift();
//    Bind_ddlProcess();
   
//}
//function Bind_ddlMachineNo(ProcessMaster_Code) {
//    SlittingProductionEntryService.GetSlittingProductionEntryDDl('ddlMachineNo', ProcessMaster_Code).then(function (response) {
//        BindSelectList($('#ddlMachineNo')[0], response.map((item) => ({ Code: item.Code, Desp: item.Desp })))
//        $('#ddlMachineNo').select2({
//                width: '-webkit-fill-available'
//        });
        
//    });
//}
//function Bind_ddlScrapItem(ProcessMaster_Code) {
//    SlittingProductionEntryService.GetSlittingProductionEntryDDl('ddlScrapItem', ProcessMaster_Code).then(function (response) {
//        BindSelectList($('#ddlScrapItem')[0], response.map((item) => ({ Code: item.ItemMaster_Code, Desp: item.ItemName })))
//        $('#ddlScrapItem').select2({
//            width: '-webkit-fill-available'
//        });

//    });
//}
//function Bind_ddlItemReceived(ProcessMaster_Code) {
//    SlittingProductionEntryService.GetSlittingProductionEntryDDl('ddlItemReceived', ProcessMaster_Code).then(function (response) {
        
//        G_ddlItemReceivedOption = '<option value="0" ByProduct="0"></option>';

//        $.each(response, function (key, val) {

//            G_ddlItemReceivedOption += '<option value="' + val.ItemMaster_Code + '" ByProduct="' + val.ByProduct + '" >' + val.ItemName + '</option>';
//        });

//    });
//}
//function Bind_IssueAndReceivedCoilDetail(G_SlittingPlanMaster_Code) {
//    SlittingProductionEntryService.GetSlittingProductionEntryDDl('IssueCoilDetail', G_SlittingPlanMaster_Code).then(function (response) {
        

//        console.log(response)
//        if (response.length > 0) {
//            AllowWeightOnlyByWeighment = response[0].AllowWeightOnlyByWeighment;
//            G_issueIdentificationNo = response[0]["Identification No"];
            
//            G_IssueItemMaster_Code = response[0].IssueItemMaster_Code;
//            G_IssueItemSizeMaster_Code = response[0].IssueItemSizeMaster_Code;
//            G_IssueGodownMaster_Code = response[0].IssueGodownMaster_Code;
//            G_IssueWeight = response[0].Weight;


//        response = response.map((item) => ({
//            "Identification No": item["Identification No"],
//            "Size Desp": item["Size Desp"],
//            "Actual Width": item["Actual Width"],
//            "Weight": item.Weight,
//            "Actual Weight": '<input id="txtActualWeight" class="BizSolFormControl form-control form-control-sm" type="text" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" onchange="BizSolInputControl.OnChangeFloatTextBox(this,3);" maxlength="6" autocomplete="off" value="' + item["Actual Weight"] +'" style="text-align: right;" onchange="SlittingProductionEntry_CalActualZincWeight()">',
//            "Actual Zinc Weight": '<input id="txtActualZincWeight" class="BizSolFormControl form-control form-control-sm" type="text" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" onchange="BizSolInputControl.OnChangeFloatTextBox(this,3);" maxlength="6" autocomplete="off" value="' + item.ZincWeight +'" style="text-align: right;" onchange="SlittingProductionEntry_CalRecevieZincWeight()">',
//            "PC": '<input id="txtIssuePC" class="form-control form-control-sm" type="text" maxlength="6" autocomplete="off" value="' + item.PC + '" readonly style="text-align: right;">',
//            MachineNo: item.MachineNo
//        }))

        

//        const StringFilterColumn = [];
//        const NumericFilterColumn = [];
//        const DateFilterColumn = [];
//        const Button = false;
//        const showButtons = []
//        const StringdoubleFilterColumn = [];
//        const hiddenColumns = ["MachineNo"];
//        const ColumnAlignment = {
//        };

//        if (ShowZincWeight==='N') {
//            hiddenColumns.push("Actual Zinc Weight")
//        }

        
//            G_issueWidth = response[0]["Actual Width"];
            
//            SelectOptionByText('ddlMachineNo', response[0].MachineNo);
//            BizsolCustomFilterGrid.CreateDataTable("tbSlittingIssueDetailsHeader", "tbSlittingIssueDetailsBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)

//            $('#paginator-tbSlittingIssueDetails').empty();


//        }
//        else {
//            $('#tbSlittingIssueDetails tr').empty();
//            $('#paginator-tbSlittingIssueDetails').empty();
//            AllowWeightOnlyByWeighment = "N";
//        }



//        SlittingProductionEntryService.GetSlittingProductionEntryDDl('ReceivedCoilDetails', G_SlittingPlanMaster_Code).then(function (response2) {
//            console.log(response2)
//            if (response2.length > 0) {
//            let ele = document.getElementById('ddlProcess')

//            let eleText = ele.options[ele.selectedIndex].text;

//            let ThicknessApplicable = response2[0].ThicknessApplicable;
            
//            response2 = response2.map((item) => ({
//                "SNo": item.SNo,
//                //"Item Name": item.ItemName,
//                "Item Name": `<select id="ItemReceived_${item.SNo}" class="form-control form-control-sm box_border" onchange="SlittingProductionEntry_OnChange_ddlItemReceived(this)">${G_ddlItemReceivedOption}</select>`,
//                //"Size Desp": item.SizeDesp,
//                "Size Desp": `${item.SizeDesp} &nbsp;&nbsp;<a class="btn btn-secondary icon-height" onclick="SlittingProductionEntry_OnClick_NewSize(this)"><i class="fa fa-plus"></i></a>`,
//                "Thickness": item.itemThick,
//                "PCs": eleText.toLowerCase() == 'slitting' && item.NoofSlits > 1 ? `${item.NoofSlits} &nbsp;&nbsp;<a class="btn btn-primary icon-height" onclick="SlittingProductionEntry_AddReceivedItem(this)">Split PC</a>` : item.NoofSlits,
//                "Weight": '<input  class="form-control form-control-sm itemWeight" type="text" maxlength="6" autocomplete="off" value="' + parseFloat(item.Weight).toFixed(3) + '" style="text-align: right;" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" onchange="BizSolInputControl.OnChangeFloatTextBox(this,3);SlittingProductionEntry_CalScrapWeight();" >',
//                "No Of Pass": '<input  class="form-control form-control-sm" type="text" maxlength="6" autocomplete="off" value="' + item.NoOfPass + '" style="text-align: right;" onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);">',
//                "Manual ID": '<input  class="form-control form-control-sm" type="text" maxlength="6" autocomplete="off" value="' + item.ManualIDNo + '" style="text-align: right;" onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);">',
//                "HiddenCol": JSON.stringify(item)
//                }
//            ))

//            const StringFilterColumn = [];
//            const NumericFilterColumn = [];
//            const DateFilterColumn = [];
//            const Button = false;
//            const showButtons = []
//            const StringdoubleFilterColumn = [];
//            let hiddenColumns = ["HiddenCol"];
//            const ColumnAlignment = {
                
//            };

           
//            if (ManualIDApplicable_FixedParameterPurchase === 'N' || ManualIDApplicable_Process === 'N') {
//                hiddenColumns.push("Manual ID");
//            }
//            if (ThicknessApplicable === 'N') {
//                hiddenColumns.push("Thickness");
//            }
//            if (AskNoOfPassInSlitting === 'N') {
//                hiddenColumns.push("No Of Pass");
//            }
            

            
//                BizsolCustomFilterGrid.CreateDataTable("tbSlittingReceivedDetailsHeader", "tbSlittingReceivedDetailsBody", response2, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)

                
//                $('#paginator-tbSlittingReceivedDetails').empty();
//                let tbItemReceived = document.getElementById("tbSlittingReceivedDetails")

//                //initialize ItemReceived select control begin

//                for (let i = 1; i < tbItemReceived.rows.length; i++) {

//                    let tbItemReceivedUpdateRow = tbItemReceived.rows[i];
//                    let HideColObj = JSON.parse(tbItemReceivedUpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
//                    let ItemMaster_Code = HideColObj.ItemMaster_Code;

//                    $('#ItemReceived_'+i).val(ItemMaster_Code);
//                    $('#ItemReceived_'+i).select2({
//                        width: '-webkit-fill-available'
//                    });
//                }
//                //initialize ItemReceived select control end

//            } else {
//                $('#tbSlittingReceivedDetails tr').empty();
//                $('#paginator-tbSlittingReceivedDetails').empty();
//            }


//        });


//    });

//}


//function BindSelectList(element, list) {
//    let option = '<option value="0"></option>';
//    $.each(list, function (key, val) {
//        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
//    });
//    element.innerHTML = option;
//}

//function SlittingProductionEntry_CalActualZincWeight() {

//    let ActualWeight = $('#txtActualWeight').val();
//    let StdZinWeight = parseFloat((AddStdZincPerMT / 1000.0) * (ActualWeight * 1000.0)).toFixed(4);
//    $('#txtActualZincWeight').val(parseFloat(StdZinWeight).toFixed(3));
//    SlittingProductionEntry_CalRecevieZincWeight();
//}

//function SlittingProductionEntry_CalRecevieZincWeight(IsCallByScrap = 'N') {

//    let ActualWeight = $('#txtActualWeight').val();

//    let ActualZincWeight = $('#txtActualZincWeight').val();

//    let issueWidth = G_issueWidth;
//    let ScrapWeight = $('#txtScrapWeight').val() == '' ? 0 : $('#txtScrapWeight').val();

//    if (IsCallByScrap === 'Y') {
//        let TreceviedWidth = 0;
//        let tbItemDetail = document.getElementById("tbSlittingReceivedDetails");
//        for (let i = 1; i < tbItemDetail.rows.length; i++) {
            
//            let tbItemDetailUpdateRow = tbItemDetail.rows[i];
//            let HideColObj = JSON.parse(tbItemDetailUpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
//            let ItemWidth = HideColObj.WidthNum;
//            let QtyPc = HideColObj.NoofSlits;
                
//            TreceviedWidth += Number(ItemWidth) * Number(QtyPc);

            


//        }

//        issueWidth = TreceviedWidth.toString();
//    }

//    let PerPcWeight = parseFloat(((Number(ActualWeight) + Number(ActualZincWeight)) - Number(ScrapWeight)) / Number(issueWidth)).toFixed(10);
//    let tbItemDetail = document.getElementById("tbSlittingReceivedDetails");
//    // Set Weight
//    for (let i = 1; i < tbItemDetail.rows.length; i++) {
//        if (i == 0) {

//        }
//        else {
//            let tbItemDetailUpdateRow = tbItemDetail.rows[i];
//            let HideColObj = JSON.parse(tbItemDetailUpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
//            let ItemWidth = HideColObj.WidthNum;
//            let QtyPc = HideColObj.NoofSlits;
//            tbItemDetailUpdateRow.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value = parseFloat(ItemWidth * PerPcWeight * QtyPc).toFixed(3);

//        }


//    }
//}

//function SlittingProductionEntry_CalScrapPerWeight() {
//    SlittingProductionEntry_CalRecevieZincWeight('Y')
//}
//function SlittingProductionEntry_CalScrapWeight() {
//    let weightList = $('.itemWeight');
//    let actualWeight = parseFloat($('#txtActualWeight').val()).toFixed(3);
//    let totalItemWeight = 0;

//    //totalItemWeight = weightList.reduce((partialSum, item) => parseFloat(partialSum + item.value), 0)
//    $.each(weightList, function (index, value) {

//        totalItemWeight += parseFloat(value.value);
//    });


//    if (AddStdZincPerMT > 0 && ShowZincWeight === "Y") {
//        actualWeight = Number(actualWeight) + Number($('#txtActualZincWeight').val());
//        actualWeight = actualWeight;
//    }
//    let scrapWeight = parseFloat(actualWeight - totalItemWeight).toFixed(3);
//    if (isNaN(scrapWeight) || scrapWeight < 0) {
//        $('#txtScrapWeight').val('0');
//    }
//    else {
//        $('#txtScrapWeight').val(scrapWeight);
//    }
//}

//function CalSlitWeightByReceivedWeight() {

//    let TreceviedWidth = 0;
//    let TreceviedWeight = $('#txtTotalReceivedWeight').val();
//    let tbItemReceived = document.getElementById("tbSlittingReceivedDetails");
//    let balForScrap = 0;
//    if (Number($('#txtActualWeight').val()) >= TreceviedWeight) {
//        balForScrap = parseFloat(Number($('#txtActualWeight').val()) - TreceviedWeight).toFixed(3);
//    }
//    let isScrapInGrid = false;
//    if (TreceviedWeight > 0) {
//        for (let i = 1; i < tbItemReceived.rows.length; i++) {

//            let tbItemReceivedUpdateRow = tbItemReceived.rows[i];
//            let HideColObj = JSON.parse(tbItemReceivedUpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
//            let ItemWidth = HideColObj.WidthNum;
//            let QtyPc = HideColObj.NoofSlits;
//            let ByProduct = HideColObj.ByProduct;
//            if (ByProduct == "N") {
//                TreceviedWidth += Number(ItemWidth) * Number(QtyPc);
//            }
//        }




//        let PerWidthWeight = parseFloat(Number(TreceviedWeight) / Number(TreceviedWidth)).toFixed(10);

//        // Set Weight
//        for (let i = 1; i < tbItemReceived.rows.length; i++) {

//            let tbItemReceivedUpdateRow = tbItemReceived.rows[i];
//            let HideColObj = JSON.parse(tbItemReceivedUpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
//            let ItemWidth = HideColObj.WidthNum;
//            let QtyPc = HideColObj.NoofSlits;
//            let ByProduct = HideColObj.ByProduct;
//            if (ByProduct == "N") {
//                tbItemReceivedUpdateRow.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value = parseFloat(ItemWidth * PerWidthWeight * QtyPc).toFixed(3);
//            }
//            else {
//                tbItemReceivedUpdateRow.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value = balForScrap;
//                isScrapInGrid = true;
//            }
//        }

//        if (isScrapInGrid == false && balForScrap > 0) {
//            $('#txtScrapWeight').val(balForScrap);
//            document.getElementById("ddlScrapItem").options.selectedIndex = 1;
//            $('#ddlScrapItem').select2({
//                width: '-webkit-fill-available'
//            });
//        }
//    }

//}


//function SlittingProductionEntry_CreateNew() {
  
//        ClrFrm();
//        Bind_ddlIdNo('dllAllPlansOrId', G_UserMaster_Code);
//        ChangeMode('New');
//}
//function SlittingProductionEntry_Back() {
//    SlittingProductionEntry_ShowPlanGrid()
//    ClrFrm();
//    Bind_ddlIdNo('dllAllPlansOrId', G_UserMaster_Code);
//    ChangeMode('');
//}
//function SlittingProductionEntry_EditOrView(isEdit, slittingPlanMaster_Code) {
//    G_SlittingPlanMaster_Code = slittingPlanMaster_Code;
//    Bind_ddlIdNo('dllAllPlansOrId', G_UserMaster_Code);
//    $('#ddlPlanNo').val(slittingPlanMaster_Code);

//    let elem = document.getElementById('ddlPlanNo');
//    $('#ddlPlanNo').select2({
//        width: '-webkit-fill-available'
//    });
//    SlittingProductionEntry_OnChangeddlPlanOrIds(elem)
//    ChangeMode('Edit');


//    $('#ddlProcess').attr('disabled', 'disabled')
//    $('#ddlPlanNo').attr('disabled', 'disabled')
//    $('#ddlIdNo').attr('disabled', 'disabled')
//}



//function SlittingProductionEntry_OnChangeddlProcess(CallBy) {
//    let ProcessMaster_Code=0
//    let ddlProcess = document.getElementById("ddlProcess");

//    AskNoOfPassInSlitting = ddlProcess.options[ddlProcess.selectedIndex].attributes["AskNoOfPassInSlitting"].value;

//    ManualIDApplicable_Process = ddlProcess.options[ddlProcess.selectedIndex].attributes["ManualIDApplicable"].value

//    ShowZincWeight = ddlProcess.options[ddlProcess.selectedIndex].attributes["ShowZincWeight"].value

//    AddStdZincPerMT = ddlProcess.options[ddlProcess.selectedIndex].attributes["AddStdZincPerMT"].value
//    G_FormType = ddlProcess.options[ddlProcess.selectedIndex].attributes["FormType"].value

//    ProcessMaster_Code = $('#ddlProcess').val();

//    Bind_ddlMachineNo(ProcessMaster_Code);
    
//    if (CallBy === 'Process') {
//        Bind_ddlIdNo('GetPlans', ProcessMaster_Code);
//    }

//    Bind_ddlScrapItem(ProcessMaster_Code);
//    Bind_ddlItemReceived(ProcessMaster_Code);
    
//}
//function SlittingProductionEntry_OnChangeddlPlanOrIds(element) {

//    let ProcessMaster_Code = 0;
//    if (element.id === 'ddlPlanNo') {
//        let ddlPlanNo = document.getElementById("ddlPlanNo");

//        ProcessMaster_Code = ddlPlanNo.options[ddlPlanNo.selectedIndex].attributes["ProcessMaster_Code"].value;

//    } else {
//        let ddlIdNo = document.getElementById("ddlIdNo");

//        ProcessMaster_Code = ddlIdNo.options[ddlIdNo.selectedIndex].attributes["ProcessMaster_Code"].value;
//    }

//    $('#ddlProcess').val(ProcessMaster_Code);
//    $('#ddlProcess').select2({
//        width: '-webkit-fill-available'
//    });

//    SlittingProductionEntry_OnChangeddlProcess('IdOrPlan');

//    G_SlittingPlanMaster_Code = element.id === 'ddlPlanNo' ? $('#ddlPlanNo').val() : $('#ddlIdNo').val();
    
//    $('#ddlPlanNo').val(G_SlittingPlanMaster_Code);
//    $('#ddlIdNo').val(G_SlittingPlanMaster_Code);

//    $('#ddlPlanNo').select2({
//        width: '-webkit-fill-available'
//    });
//    $('#ddlIdNo').select2({
//        width: '-webkit-fill-available'
//    });
    

    

//    Bind_IssueAndReceivedCoilDetail(G_SlittingPlanMaster_Code);
    

//}

//function SlittingProductionEntry_OnClick_NewSize(Row) {
//    G_Row = Row;
//    let UpdateRow = $(Row).closest("tr")[0];

//    let HideColObj = JSON.parse(UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
//    InitSizeControl(HideColObj.ItemMaster_Code, HideColObj.ItemSizeMaster_Code, "SlittingProductionEntry_SizeCallBack", 0)

//}
//function SlittingProductionEntry_OnChange_ddlItemReceived(Row) {
//    let UpdateRow = $(Row).closest("tr")[0];
//    let HideColObj = JSON.parse(UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
//    let ddlItemReceived = document.getElementById('ItemReceived_' + HideColObj.SNo);
//    let ItemName = ddlItemReceived.options[ddlItemReceived.selectedIndex].text;
//    let byproduct = ddlItemReceived.options[ddlItemReceived.selectedIndex].attributes["byproduct"].value;
//    let OldItemMaster_Code = HideColObj.ItemMaster_Code; 
//    HideColObj.ItemName = ItemName;
//    HideColObj.ByProduct = byproduct;
//    HideColObj.ItemMaster_Code = $('#ItemReceived_' + HideColObj.SNo).val();

//    if (byproduct==='S') {
//        HideColObj.ItemSizeMaster_Code = 0;
//        HideColObj.SizeDesp = '';
//        UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML = JSON.stringify(HideColObj);
//        UpdateRow.cells[indxSizeDespCol_tbSlittingReceivedDetails].innerHTML = '';
//        return;
//    }
//    //UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML = JSON.stringify(HideColObj);

//    SizeControlService.CreateItemSize(HideColObj.ItemMaster_Code, '0', OldItemMaster_Code).then(function (response) {
//        if (response.length > 0) {
//            HideColObj.ItemSizeMaster_Code = response[0].Code;
//            HideColObj.SizeDesp = response[0].SizeDesp;
//            UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML = JSON.stringify(HideColObj);
//            UpdateRow.cells[indxSizeDespCol_tbSlittingReceivedDetails].innerHTML = `${response[0].SizeDesp} &nbsp;&nbsp;<a class="btn btn-secondary icon-height" onclick="SlittingProductionEntry_OnClick_NewSize(this)"><i class="fa fa-plus"></i></a>`;

//        }
//    })

//}

//function InitSizeControl(itemMaster_Code, itemSizeMaster_Code, callBackFunctionName_btnDone, rowNo) {
//    let url = baseUrl + '/CustomControl/SizeControl';

//    $('#DivSizeControlmodal').load(url, { ItemMaster_Code: itemMaster_Code, ItemSizeMaster_Code: itemSizeMaster_Code, CallBackFunctionName_btnDone: callBackFunctionName_btnDone, RowNo: rowNo });

//}

//function InitBrakDownControl( entryDate,  processMaster_Code,  machineMaster_Code,  shiftMaster_Code,  godownMaster_Code) {
//    let url = baseUrl + '/CustomControl/BreakDownControl';

//    $('#DivBrakDownStartControlModal').load(url, { EntryDate: entryDate, ProcessMaster_Code: processMaster_Code, MachineMaster_Code: machineMaster_Code, ShiftMaster_Code: shiftMaster_Code, GodownMaster_Code: godownMaster_Code });

//}

//function SlittingProductionEntry_SizeCallBack() {
//    //alert(SizeControl_NewSizeMaster_Code + 'SizeDesp:' + SizeControl_NewSizeDesp);

//    let RowNo = G_Row;
//    let UpdateRow = $(RowNo).closest("tr")[0];

//    let HideColObj = JSON.parse(UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
    
//    HideColObj.ItemSizeMaster_Code = SizeControl_NewSizeMaster_Code;
//    HideColObj.SizeDesp = SizeControl_NewSizeDesp;

//    UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML = JSON.stringify(HideColObj);
//    UpdateRow.cells[indxSizeDespCol_tbSlittingReceivedDetails].innerHTML = `${SizeControl_NewSizeDesp} &nbsp;&nbsp;<a class="btn btn-secondary icon-height" onclick="SlittingProductionEntry_OnClick_NewSize(this)"><i class="fa fa-plus"></i></a>`;

//}

//function SlittingProductionEntry_AddReceivedItem(row) {
    

//    let tbReceivedItems = document.getElementById("tbSlittingReceivedDetails");
//    let RowCount = tbReceivedItems.rows.length;


//    //typeof row === "object" Call By Split PC Btn else callBy add Btn

//    let UpdateRow = typeof row === "object" ? $(row).closest("tr")[0] : tbReceivedItems.rows[1];
//    let HideColObj = JSON.parse(UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());

//    //let rowCopyIndex = typeof row === "object" ? HideColObj.SNo : 1;
//    let noPC = typeof row === "object" ? HideColObj.NoofSlits : 2;


//    for (let i = 0; i < (noPC - 1); i++) {

//        if (RowCount > 1) {

//            let newRow = tbReceivedItems.insertRow(RowCount);//.replaceWith(UpdateRow);

//            UpdateRow.cells.forEach((cell) => {
//                let Cell = newRow.insertCell()
                
//                Cell.innerHTML = cell.innerHTML;
//                Cell.outerHTML = cell.outerHTML;
//            });

//            newRow.cells[indxSnoCol_tbSlittingReceivedDetails].innerHTML = RowCount;
//            newRow.cells[indxItemNameCol_tbSlittingReceivedDetails].innerHTML = `<select id="ItemReceived_${RowCount}" class="form-control form-control-sm box_border" onchange="SlittingProductionEntry_OnChange_ddlItemReceived(this)">${G_ddlItemReceivedOption}</select>`;
//            newRow.cells[indxPCsCol_tbSlittingReceivedDetails].innerHTML = '1'
//            newRow.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value = 0;

//            let newHideColObj = JSON.parse(newRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
//            newHideColObj.NoofSlits = 1;
//            newHideColObj.SNo = RowCount;
//            $('#ItemReceived_' + RowCount).val(newHideColObj.ItemMaster_Code);
//            $('#ItemReceived_' + RowCount).select2({
//                width: '-webkit-fill-available'
//            });
//            newRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML = JSON.stringify(newHideColObj);
            
          
//            RowCount++;
//        }


//    }

//    if (typeof row === "object") {
//        UpdateRow.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value = 0;
//        UpdateRow.cells[indxPCsCol_tbSlittingReceivedDetails].innerHTML = '1'
//        HideColObj.NoofSlits = 1;
//        UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML = JSON.stringify(HideColObj);
//    }
//}
//function SlittingProductionEntry_AllCheckSelection(masterCheckbox) {
//    const checkboxes = document.querySelectorAll('#tbPrintID input[type="checkbox"]:not(#checkAllPrint)');
//    checkboxes.forEach((checkbox) => {
//        checkbox.checked = masterCheckbox.checked;
//    });
//}
//function SlittingProductionEntry_OnChangeddlParantID() {
//    let ParantID = $('#ddlParantID').val();
//    SlittingProductionEntryService.GetChildIDsByParantIDToPrintID('GetChildIDsByParantIDToPrintID', ParantID).then(function (response) {
//        const stringFilterColumn = [];
//        const numericFilterColumn = [];
//        const dateFilterColumn = [];
//        const button = false;
//        const stringDoubleFilterColumn = [];
//        const showButtons = [];
//        const hiddenColumns = [];
//        const columnAlignment = {};
//        response = response.map(item => {
//            return {
//                ...item,

//                'Print <input type="checkbox" id="checkAllPrint" onchange="SlittingProductionEntry_AllCheckSelection(this)" checked>': `<input type="checkbox" id="checkPrint" onchange="toggleSelection(this, this.checked)" checked>`,
//            };
//        })

//        BizsolCustomFilterGrid.CreateDataTable("table-header-tbPrintID", "table-body-tbPrintID", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
//    });
//}

//function SlittingProductionEntry_CreatNewEntry() {
//    let GodownMaster_Code = 0;
//    let ddlProcess = document.getElementById("ddlProcess");
   
//    let ProcessMaster_Code = $('#ddlProcess').val();
//    let ProcessName = ddlProcess.options[ddlProcess.selectedIndex].text
//    let MachineMaster_Code = $('#ddlMachineNo').val();
//    let ScrapItemMaster_Code = $('#ddlScrapItem').val();
//    let ScrapWeight = $('#txtScrapWeight').val();

//    let StartTime = $('#txtStartTime').val();
//    let EndTime = $('#txtEndTime').val();
//    let Speed = $('#txtSpeed').val();

//    let scrapWeight = parseFloat(ScrapWeight);

//    let ReceivedDetailsArry = [];

//    ReceivedDetailsArry = $('#tbSlittingReceivedDetailsBody')[0].rows;


//    //if (IsBreakDownRunning()) {
//    //    toastr.error({ html: 'Cannot not save Entry BreakDown Is Running', classes: 'rounded' });
//    //    return false;
//    //}

//    if (typeof G_SlittingPlanMaster_Code === 'undefined' || G_SlittingPlanMaster_Code === '' || G_SlittingPlanMaster_Code === null || G_SlittingPlanMaster_Code === 0) {
//        toastr.error('Invalid Plan No Or IdentificationNo please Check!');
//        return false;
//    }

//    if (isNaN(scrapWeight)) {
//        scrapWeight = 0;
//    }
//    if (ProcessMaster_Code === "0" ||ProcessMaster_Code === 0 || typeof ProcessMaster_Code === 'undefined' || ProcessMaster_Code === '' || ProcessMaster_Code === null) {
//        toastr.error('Invalid Process Name please Check!');
//         return false;
//    }  
//    else if (MachineMaster_Code === "0" || MachineMaster_Code === 0 || typeof MachineMaster_Code === 'undefined' || MachineMaster_Code === '' || MachineMaster_Code === null) {
//        toastr.error('Invalid Machine No please Check!')
//        return false;
//    }
//    else if (scrapWeight > 0 && (typeof ScrapItemMaster_Code === 'undefined' || ScrapItemMaster_Code === '0' || ScrapItemMaster_Code === null)) {
//        toastr.error('Invalid ScrapItem please Check!')
//        return false;
//    }
//    else if (ProcessName.toUpperCase().includes("CR GALVANIZED") && ShowTimeInProduction == "Y") {

//        if (typeof StartTime === 'undefined' || StartTime === '' || StartTime === null) {
            
//            toastr.error('Invalid StartTime please Check!');
            
//            return false;
//        }
//        else if (typeof EndTime === 'undefined' || EndTime === '' || EndTime === null) {
            
//            toastr.error('Invalid EndTime please Check!');
            
//            return false;
//        }
//        else if (typeof Speed === 'undefined' || Speed === '' || Speed === null) {
            
//            toastr.error('Invalid Speed please Check!');
            
//            return false;
//        }


//    }
//    else {
//        let tableValid = true;
//        let tbItemReceivedDetails = document.getElementById("tbSlittingReceivedDetails");
//        let GManualID = "";
//        for (let i = 1; i < tbItemReceivedDetails.rows.length; i++) {
//            let UpdateRow = tbItemReceivedDetails.rows[i];

//                let HideColObj = JSON.parse(UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
//                let ItemSizeMaster_Code = HideColObj.ItemSizeMaster_Code;
//                let ItemMaster_Code = HideColObj.ItemMaster_Code;
//                let ByProduct = HideColObj.ByProduct
//                if (ByProduct === 'N') {
//                    if (typeof ItemSizeMaster_Code === 'undefined' || ItemSizeMaster_Code === '' || ItemSizeMaster_Code === null || ItemSizeMaster_Code === '0') {
                       
//                        toastr.error('Invalid Size in row No. ' + i);
//                        tableValid = false;
//                        break;
//                    }
//                    if (typeof ItemMaster_Code === 'undefined' || ItemMaster_Code === '' || ItemMaster_Code === null || ItemMaster_Code === '0') {
                       
//                        toastr.error('Invalid Item in row No. ' + i);
//                        tableValid = false;
//                        break;
//                    }

//                    if (ManualIDApplicable_FixedParameterPurchase === 'Y' && ManualIDApplicable_Process === 'Y') {
//                        let ManualID = UpdateRow.cells[indxManualIDCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value;
//                        let NoOfSlits = HideColObj.NoofSlits
//                        let Weight = UpdateRow.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value;

//                        if (typeof ManualID === 'undefined' || ManualID === '' || ManualID === null || ManualID === '0') {
                          
//                            toastr.error('ManualID Can not Be Blank Or Zero in RowNo' + i);
//                            tableValid = false;
//                            break;
//                        }
//                        if (typeof ManualID === 'undefined' || ManualID === '' || ManualID === null || ManualID === '0') {
                         
//                            toastr.error('ManualID Can not Be Blank Or Zero in RowNo' + i);
//                            tableValid = false;
//                            break;
//                        }
//                        if (typeof NoOfSlits === 'undefined' || NoOfSlits === '' || NoOfSlits === null || NoOfSlits === '0') {
                         
//                            toastr.error('NoOfSlits Can not Be Blank Or Zero in RowNo' + i);
//                            tableValid = false;
//                            break;
//                        }
//                        if (typeof Weight === 'undefined' || Weight === '' || Weight === null || Weight === '0') {
                           
//                            toastr.error('Weight Can not Be Blank Or Zero in RowNo' + i);
//                            tableValid = false;
//                            break;
//                        }
//                        if (i == 1) {
//                            GManualID = ManualID;
//                        } else {
//                            if (GManualID === ManualID) {
//                                toastr.error('Duplicate ManualID No Not Allowed' + i);
//                                tableValid = false;
//                                break;
//                            }
//                        }

//                        //if (!ValidateManualID($('#txtProcess').val(), $('#txtProDate').val(), $('#txtIdentificationNo').val(), ItemMaster_Code, ItemSizeMaster_Code, NoOfSlits, Weight, ManualID)) {
//                        //    toastr.error('ManualID No Not Validate in RowNo' + i);
//                        //    tableValid = false;
//                        //    break;
//                        //    // return false;
//                        //}

//                    }
//                }

//        }

//        if (!tableValid)
//            return false;

//        if (!isNaN($('#txtIssuePC').val()) && parseInt($('#txtIssuePC').val()) > 1) {
//            let PC = parseInt($('#txtIssuePC').val());
//            let TotalPC = 0;

//            $.each(ReceivedDetailsArry, function (index, value) {
//                let HideColObj = JSON.parse(value.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
//                if (isNaN(parseInt(HideColObj.NoofSlits))) {
//                    TotalPC += 0;
//                }
//                else {
//                    TotalPC += parseInt(HideColObj.NoofSlits);
//                }

//            });

//            if (TotalPC < PC) {
//                toastr.error('Please Check ! Total No PC should not be Equal to PC');

//                return false;
//            }
//            if (TotalPC > PC) {
//                toastr.error('Please Check ! Total No PC should not be Equal to PC');

//                return false;
//            }

//        }



//        let actualWeight = parseFloat($('#txtActualWeight').val()).toFixed(3);

//        if (AddStdZincPerMT > 0 && ShowZincWeight === "Y") {
//            actualWeight = Number(actualWeight) + Number($('#txtActualZincWeight').val());
//            actualWeight = parseFloat(actualWeight).toFixed(3);
//        }
       


//        let totalItemWeight = 0;
//        $.each(ReceivedDetailsArry, function (index, value) {
//            if (isNaN(parseFloat(value.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value))) {
//                totalItemWeight += 0;
//            }
//            else {
//                totalItemWeight += parseFloat(value.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value);
//            }

//        });
//        totalItemWeight += scrapWeight;

//        totalItemWeight = parseFloat(totalItemWeight).toFixed(3);


//        if (scrapWeight < 0) {
//            toastr.error('Please Check ! Scrap Weight should not be negative (-)')
//            return false;
//        }
//        else if (scrapWeight > actualWeight) {
//            toastr.error('Please Check ! Scrap Weight should be less than equal to actual Weight')
//            return false;
//        }
//        else if (totalItemWeight != actualWeight) {
//            toastr.error("Please Check ! Total Receive weight (" + totalItemWeight + ") should be equal to actual weight (" + actualWeight + ")");
//            return false;
//        }


//    }

    

//    //if (AllowWeightOnlyByWeighment === 'Y' && IsGetWeightByScale == false) {
//    //    toastr.error('Please take weight by Scale!');
//    //    return false;
//    //}

//    let CheckStockPayLoad = {
//        EntryType: "O",
//        EntryDate: $('#txtSlittingDate').val(),//12-feb-24// Production Date
//        ItemMaster_Code: G_IssueItemMaster_Code,//need
//        ItemSizeMaster_Code: G_IssueItemSizeMaster_Code,//need
//        GodownMaster_Code: G_IssueGodownMaster_Code,//need
//        PlanBatchNo: "",
//        ISNoDesp: "",
//        BundleNo: "",
//        OldQtyPC: 0,
//        OldQtyMT: 0,
//        OldQtyMTRS: 0,
//        NewQtyPC: 1,
//        NewQtyMT: G_IssueWeight,//need
//        NewQtyMTRS: 0,
//        BatchNo: "",
//        IdentificationNo: G_issueIdentificationNo,//need
//        IdentificationNoMaster_Code: 0
//    };

//    let SlittingEntryDataPayload = [];

//    $.each(ReceivedDetailsArry, function (index, value) {
//        let HideColObj = JSON.parse(value.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
//        let Weight = parseFloat(value.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value);
//        let ManualID = parseInt(value.cells[indxManualIDCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value);
        
//        SlittingEntryDataPayload.push({
//            Sno: HideColObj.SNo,
//            ItemMaster_Code: HideColObj.ItemMaster_Code,
//            itemSizeMaster_Code: HideColObj.ItemSizeMaster_Code,
//            Weight: Weight,
//            NoOfPass: HideColObj.NoOfPass,
//            NoofSlits: HideColObj.NoofSlits,
//            ManualIDNo: ManualID,
//            InTime: "",
//            OutTime: "",
//            Speed: "",
//            SlittingPlanMaster_Code: G_SlittingPlanMaster_Code,
//            ShiftMaster_Code: $("#ddlShift").val(),
//            FormType: G_FormType,
//            txtActualWeight: $("#txtActualWeight").val(),
//            txtscrapWT: $("#txtScrapWeight").val(),
//            txtProDate: $("#txtSlittingDate").val(),
//            ScrapItemMaster_Code: $("#ddlScrapItem").val(),
//            txtActualZincWeight: $("#txtActualZincWeight").val(),
//            MachineMaster_Code: $("#ddlMachineNo").val(),
//            IssuePC: $("#txtIssuePC").val()
//        });

//    });

//    Showloader();
//    BreakDownService.IsBreakDownRunning(ProcessMaster_Code, MachineMaster_Code, GodownMaster_Code).then(function (breakDownrespone) {

//        if (breakDownrespone.Status === 'N') {
//            SlittingProductionEntryService.CheckEntryAllowed(G_issueIdentificationNo).then(function (response) {
//                if (response.Status === 'Y') {
//                    SlittingProductionEntryService.CheckStockValidate(JSON.stringify(CheckStockPayLoad)).then(function (response1) {
//                        if (response1.Status === 'Y') {

//                            SlittingProductionEntryService.SaveSlittingEntry(JSON.stringify(SlittingEntryDataPayload)).then(function (response2) {
//                                if (response2.Status === 'Y') {
//                                    HideLoader();
//                                    toastr.success(response2.Msg);
//                                    SlittingProductionEntry_ShowPlanGrid()
//                                    ClrFrm();
//                                    Bind_ddlIdNo('dllAllPlansOrId', G_UserMaster_Code);
//                                    ChangeMode('');

//                                } else {
//                                    toastr.error(response2.Msg);
//                                    HideLoader();
//                                }

//                            });

//                        } else {
//                            toastr.error(response1.Msg);
//                            HideLoader();
//                        }

//                    });

//                } else {
//                    toastr.error(response.Msg);
//                    HideLoader();
//                }


//            });
//        } else {
//            toastr.error('Can not Save Entry! ' + breakDownrespone.Msg + ' on selected Machine No..')
//            HideLoader();
//        }

//    })
    
    


   
//}
//function ClrFrm() {
//    G_SlittingPlanMaster_Code = 0;
   
//    $('#txtScrapWeight').val('0');
//    $('#txtSlittingDate').val(new Date().toISOString().slice(0, 10));
  
    
//    $('#ddlScrapItem').val('0');
    
//    $('#ddlMachineNo').val('0');

//    $('#ddlProcess').val('0');
//    $('#ddlPlanNo').val('0');

//    $('#ddlScrapItem').select2({
//        width: '-webkit-fill-available'
//    });
//    $('#ddlIdNo').select2({
//        width: '-webkit-fill-available'
//    });
    
//    $('#ddlMachineNo').select2({
//        width: '-webkit-fill-available'
//    });
//    $('#ddlProcess').select2({
//        width: '-webkit-fill-available'
//    });
//    $('#ddlPlanNo').select2({
//        width: '-webkit-fill-available'
//    });
    

//    $('#ddlProcess').removeAttr('disabled')
//    $('#ddlPlanNo').removeAttr('disabled')
//    $('#ddlIdNo').removeAttr('disabled')

//    $('#tbPackingListTransaction tr').empty();
//    $('#paginator-tbPackingListTransaction').empty();
//    Bind_IssueAndReceivedCoilDetail(G_SlittingPlanMaster_Code);
//}

//function LoadFrm() {
    

//    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'ManualIDApplicable').PeramaterValue === 'Y') {
//        ManualIDApplicable_FixedParameterPurchase = "Y";
//    }
    
     
    
   
//}


//$('#txtTotalReceivedWeight').on('change', function () {
//    CalSlitWeightByReceivedWeight();
//});

//$('#btnPrint').on('click', function () {
//    Showloader()
//    SlittingProductionEntryService.GetSlittingProductionEntryDDl('GetPrintIDs', 0).then(function (response) {

//        BindSelectList($('#ddlParantID')[0], response.map((item) => ({ Code: item.ParantID, Desp: item.ParantID })))
//        $('#ddlParantID').select2({
//            width: '-webkit-fill-available'
//        });
//        HideLoader()
//        $("#PintIDModal").modal({
//            backdrop: 'static',
//        });
//        $('#PintIDModal').modal('show');
//    });

//});

//$('#btnModalPrint').on('click', function () {
   

//    let PrintId = "";
//    let table = document.getElementById("tbPrintID");
//    for (let i = 1; i < table.rows.length; i++) {
        
//            let UpdateRow = table.rows[i];
//            //let check = UpdateRow.cells[0].innerHTML;
//            let check = UpdateRow.cells[1].getElementsByTagName('input')[0]
//            if (check.checked) {
//                PrintId += UpdateRow.cells[0].innerHTML + "#";
//            }

        
//    }
//    if (PrintId == "") {
       
//        toastr.error('Plz Select at least one Id!');
//        return;
//    }
    
//    SlittingProductionEntryService.PrintIdentificationNos(PrintId, '0').then(function (response) {
//        let url = response.Url;
//        const a = document.createElement('a');
//        a.style.display = 'none';
//        a.target = '_blank';
//        a.href = url;
//        document.body.appendChild(a);
//        a.click();
//    });
//});

//$('#btnBrkDownStart').on('click', function () {
//    let entryDate = $('#txtSlittingDate').val(); 
//    let processMaster_Code = $('#ddlProcess').val();
//    let machineMaster_Code = $('#ddlMachineNo').val();
//    let shiftMaster_Code = $('#ddlShift').val();
//    let godownMaster_Code = 0;
//    if (entryDate == "") {
//        toastr.error('Invalid Entry Date please Check!');
//        return false
//    }
//    if (processMaster_Code === "0" ||processMaster_Code === 0 || typeof processMaster_Code === 'undefined' || processMaster_Code === '' || processMaster_Code === null) {
//        toastr.error('Invalid Process please Check!');
//        return false
//    }
//    if (machineMaster_Code === "0" ||machineMaster_Code === 0 || typeof machineMaster_Code === 'undefined' || machineMaster_Code === '' || machineMaster_Code === null) {
//        toastr.error('Invalid Machine No please Check!');
//        return false
//    }
//    if (shiftMaster_Code === "0"||shiftMaster_Code === 0 || typeof shiftMaster_Code === 'undefined' || shiftMaster_Code === '' || shiftMaster_Code === null) {
//        toastr.error('Invalid shift please Check!');
//        return false
//    }

//    InitBrakDownControl(entryDate, processMaster_Code, machineMaster_Code, shiftMaster_Code, godownMaster_Code);
//});


//SlittingProductionEntry_ShowPlanGrid();
//getPackingListFGFixedParaMeters();
//Bind_AllDLL();
//Bind_ddlIdNo('dllAllPlansOrId', G_UserMaster_Code);
////LoadFrm();



//window.SlittingProductionEntry_CreateNew = SlittingProductionEntry_CreateNew;
//window.SlittingProductionEntry_Back = SlittingProductionEntry_Back;
//window.SlittingProductionEntry_ShowPlanGrid = SlittingProductionEntry_ShowPlanGrid;
//window.SlittingProductionEntry_EditOrView = SlittingProductionEntry_EditOrView;
//window.SlittingProductionEntry_OnChangeddlProcess = SlittingProductionEntry_OnChangeddlProcess;
//window.SlittingProductionEntry_OnChangeddlPlanOrIds = SlittingProductionEntry_OnChangeddlPlanOrIds;
//window.SlittingProductionEntry_CalScrapPerWeight = SlittingProductionEntry_CalScrapPerWeight;
//window.SlittingProductionEntry_CalActualZincWeight = SlittingProductionEntry_CalActualZincWeight;
//window.SlittingProductionEntry_CalRecevieZincWeight = SlittingProductionEntry_CalRecevieZincWeight;
//window.SlittingProductionEntry_CalScrapWeight = SlittingProductionEntry_CalScrapWeight;
//window.SlittingProductionEntry_OnClick_NewSize = SlittingProductionEntry_OnClick_NewSize;
//window.SlittingProductionEntry_OnChange_ddlItemReceived = SlittingProductionEntry_OnChange_ddlItemReceived;
//window.SlittingProductionEntry_SizeCallBack = SlittingProductionEntry_SizeCallBack;
//window.SlittingProductionEntry_AddReceivedItem = SlittingProductionEntry_AddReceivedItem;
//window.SlittingProductionEntry_AllCheckSelection = SlittingProductionEntry_AllCheckSelection;
//window.SlittingProductionEntry_OnChangeddlParantID = SlittingProductionEntry_OnChangeddlParantID;
//window.SlittingProductionEntry_CreatNewEntry = SlittingProductionEntry_CreatNewEntry;


