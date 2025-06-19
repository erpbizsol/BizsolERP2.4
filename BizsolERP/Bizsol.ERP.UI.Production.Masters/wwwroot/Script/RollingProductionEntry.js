

import { RollingProductionService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/RollingProductionService.js';
import { BreakDownService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_BreakDownService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';



$("#ERPHeading").text("Tube Mill Production");
$('#txtFromDate').val(new Date().toISOString().slice(0, 10));
$('#txtToDate').val(new Date().toISOString().slice(0, 10));

let baseUrl = sessionStorage.getItem('AppBaseURL');
let G_PVCProductionMaster_Code = 0;//28823;
let G_ProcessMaster_Code = 0;
let G_WeightInCalculatedRange = "Y";
let indx_dtIssueSlitID_HideObj = 0;
let indx_dtIssueSlitID_CheckBox = 7;

let IndxtbItemToBeReceive_FreshPC = 5;
let IndxtbItemToBeReceive_FreshMT = 6;
let IndxtbItemToBeReceive_MixPC = 7;
let IndxtbItemToBeReceive_CalculatedWT = 8;
let IndxtbItemToBeReceive_RWarehouse = 9;
let IndxtbItemToBeReceive_RejectedPC = 10;
let IndxtbItemToBeReceive_RejectedWeight = 11;

let IndxtbScrapAndRejectedItem_RejectedPC = 2;
let IndxtbScrapAndRejectedItem_RejectedWeight = 3;
let IndxtbScrapAndRejectedItem_RejectedWarehouse = 4;

let DdlReceiveGodown = [];
function Bind_ddlGodown() {
    RollingProductionService.Getddl('GetDdlGodown',0).then(function (resObj) {

        BindSelectList($('#ddlGodown')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.GodownName })));
        $('#ddlGodown').select2({
            width: '-webkit-fill-available'
        });
        BindSelectList($('#ddlGodownReceive')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.GodownName })));
        $('#ddlGodownReceive').select2({
            width: '-webkit-fill-available'
        });

    });

}

function Bind_ddlMachineNo() {
    RollingProductionService.Getddl('GetDdlMachineNo',0).then(function (resObj) {

        BindSelectList($('#ddlMachineNo')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.MachineNo })));
        $('#ddlMachineNo').select2({
            width: '-webkit-fill-available'
        });
        BindSelectList($('#ddlMachineNoReceive')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.MachineNo })));
        $('#ddlMachineNoReceive').select2({
            width: '-webkit-fill-available'
        });
        if (resObj.length > 0) {
            G_ProcessMaster_Code = resObj[0].ProcessMaster_Code;
            Bind_ReceivedGodown();
        }
        if (NavMachineNo !=="") {
            BizSolHelperFunction.SelectOptionByText('ddlMachineNo', NavMachineNo);
            BizSolHelperFunction.SelectOptionByText('ddlMachineNoReceive', NavMachineNo);
            RollingProductionEnty_GatPlanDetail();
        }
    });

}

function Bind_ddlShift() {
    RollingProductionService.Getddl('GetDdlShift',0).then(function (resObj) {

        RollingProductionService.Getddl('GetCurrentShift',0).then(function (resCurrentShift) {


            BindSelectList($('#ddlIssueShift')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.ShiftName })));
            $('#ddlIssueShift').val(resCurrentShift[0].Code);

            $('#ddlIssueShift').select2({
                width: '-webkit-fill-available'
            });
            BindSelectList($('#ddlReceiveShift')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.ShiftName })));
            $('#ddlReceiveShift').val(resCurrentShift[0].Code);
            $('#ddlReceiveShift').select2({
                width: '-webkit-fill-available'
            });

        });

        

    });

}

function Bind_ReceivedGodown() {
    RollingProductionService.Getddl('GetDdlReceiveGodown', G_ProcessMaster_Code).then(function (resObj) {
        DdlReceiveGodown = resObj;
        
    });
}
function CurrentProductionDate() {
    RollingProductionService.Getddl('GetEntryDate',0).then(function (resEntryDate) {

        $('#txtIssueProductionDate').val(new Date(resEntryDate[0].EntryDate).toISOString().slice(0, 10) );
        $('#txtReceiveProductionDate').val(new Date(resEntryDate[0].EntryDate).toISOString().slice(0, 10) );

    });

}

function BindSelectList(element, list) {
    let option = '<option value="0" ClientMaster_Code="0">Select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '" >' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

async function RollingProductionEnty_GatPlanDetail() {
    let EntryDate = $('#txtIssuePlanDate').val();
    let MachineMaster_Code = $('#ddlMachineNo').val();
    
    let GodownMaster_Code = $('#ddlGodown').val();

    let ddlMachineNo = document.getElementById("ddlMachineNo");
    let MachineName = ddlMachineNo.options[ddlMachineNo.selectedIndex].text;
    let ddlGodown = document.getElementById("ddlGodown");
    let GodownName = ddlGodown.options[ddlGodown.selectedIndex].text;

    if (typeof EntryDate === 'undefined' || EntryDate === '' || EntryDate === null) {
        toastr.error('Plan Date should not be blank');
        return;

    }
    if (typeof MachineName === 'undefined' || MachineName === '' || MachineName === null) {
        toastr.error('Machine Name should not be blank');
        return;

    }
    if (typeof GodownMaster_Code === 'undefined' || GodownMaster_Code === '' || GodownMaster_Code === null || GodownMaster_Code === "0") {
        toastr.error('Warehouse not selected Plz select..');
        return;

    }

    //@if (string.IsNullOrEmpty(ViewBag.BOMOrderWiseFor) == false && ViewBag.BOMOrderWiseFor == "PPPL") {
    //    @: if (typeof GodownName === 'undefined' || GodownName === '' || GodownName === null)
    //        @: {
    //        @: M.toast({ html: 'Godown Name should not be blank', classes: 'rounded' });
    //        @: return;
    //        @:
    //        @:
    //    }
    //}

    let ProducationDate = $('#txtIssueProductionDate').val();
    let ShiftMaster_Code = $('#ddlIssueShift').val();
   

    let pVCProductionMaster_CodeRep = await GetPVCProductionMaster_Code(ProducationDate, ShiftMaster_Code, MachineMaster_Code, GodownMaster_Code);
    if (pVCProductionMaster_CodeRep.length > 0) {
        G_PVCProductionMaster_Code = pVCProductionMaster_CodeRep[0].Code;
    } else {
        G_PVCProductionMaster_Code = 0;
    }
    

   

    let IssueReceivePayload = {
        planBatchNo: "0",
        entrydate: EntryDate,
        warehouseName: GodownName,
        processName: "",
        machineNo: MachineName,
        getType: "PlanBatch",
        totalPC: 0,
        totalPCRej: 0,
        pvcProductionMaster_Code: G_PVCProductionMaster_Code,
        rejItemCodesAndPCandWeight: "",
        totalWeight: 0
    }
    Showloader();
    RollingProductionService.UDF_GetPlanBatchIssueReceiveDetail(JSON.stringify(IssueReceivePayload)).then(async function (response) {
        HideLoader();
        let IssueSlitIDResponse = await Promise.all(response.map(async item => {

            let SlitIDPayload = {
                planBatchNo: item.PlanBatchNo,
                entrydate: EntryDate,
                warehouseName: GodownName,
                processName: "",
                machineNo: MachineName,
                getType: "",
                totalPC: 0,
                totalPCRej: 0,
                pvcProductionMaster_Code: G_PVCProductionMaster_Code,
                rejItemCodesAndPCandWeight: "",
                totalWeight: 0
            }

            return await RollingProductionService.UDF_GetPlanBatchIssueReceiveDetail(JSON.stringify(SlitIDPayload));
            
        }));

        IssueSlitIDResponse = IssueSlitIDResponse.flat();
        console.log(IssueSlitIDResponse);

        IssueSlitIDResponse = IssueSlitIDResponse.map(item => {
            return {
                hideObj: JSON.stringify(item),
                "Plan Batch No": item.PlanBatchNo,
                "Item Name": item.ItemName,
                "Item Size": item.ItemSize,	
                "Id No": item.IdentificationNo,
                "Qty PC": item.QtyPC,
                "Qty MT": parseFloat(item.QtyMT).toFixed(3),
                "<input type='checkbox' id='checkAllissueID' onchange='RollingProductionEnty_AllSelect(this)' >":'<input type="checkbox" onclick="RollingProductionEnty_SaveIssueID()"> '
            }
        })
        console.log(IssueSlitIDResponse);
        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["hideObj"];
        const ColumnAlignment = {
            "Qty PC": 'right',
            "Qty MT": 'right',
            "Qty SQM": 'right',
        };

        if (IssueSlitIDResponse.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbIssueSlitIDHeader", "tbIssueSlitIDBody", IssueSlitIDResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment,false)
            //GetIssuedIDDetails();

        } else {
            $('#tbIssueSlitID tr').empty()
            $('#paginator-tbIssueSlitID').empty();
        }
        GetIssuedIDDetails();

    });

}
function RollingProductionEnty_AllSelect(masterCheckbox) {
    const checkboxes = document.querySelectorAll('#tbIssueSlitID input[type="checkbox"]:not(#checkAllissueID)');
    checkboxes.forEach((checkbox) => {
        checkbox.checked = masterCheckbox.checked;
    });

    RollingProductionEnty_SaveIssueID();
}

function GetIssuedIDDetails() {
    if (G_PVCProductionMaster_Code > 0) {
        RollingProductionService.Getddl('GetIssuedIDDetails', G_PVCProductionMaster_Code).then(function (Respone) {

            Respone = Respone.map(item => {
                return {
                    hideObj: JSON.stringify(item),
                    "Id No": item.IdentificationNo,
                    "Qty MT": `<input id="frmEmptyIn_txtVehicleEmptyWeight" class="BizSolFormControl form-control form-control-sm" type="text" onchange="BizSolInputControl.OnChangeFloatTextBox(this,2)" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" value="${parseFloat(item.issueW).toFixed(3)}" autocomplete="off">`,
                    "Action": '<a class="btn btn-info icon-height" onclick="RollingProductionEnty_UpdateissueIDQtyMT(this)"> <i class="fa fa-print"></i></a>',

                }
            })

            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = []
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["hideObj"];
            const ColumnAlignment = {
                "Qty PC": 'right',
                "Qty MT": 'right;width: 150px',
                "Action": 'right;width: 50px',
            };

            if (Respone.length > 0) {
                BizsolCustomFilterGrid.CreateDataTable("tbIssuedIDDetailsHeader", "tbIssuedIDDetailsBody", Respone, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false)


            } else {
                $('#tbIssuedIDDetails tr').empty()
                $('#paginator-tbIssuedIDDetails').empty();
            }

        });
    } else {
        $('#tbIssuedIDDetails tr').empty()
        $('#paginator-tbIssuedIDDetails').empty();
    }

}

function RollingProductionEnty_SaveIssueID(CallBy) {
    if (CallBy === 'ScanIdNo' && $('#txtScanIdNo').val() == "") {
        return;
    }

    let GodownMaster_Code = $('#ddlGodown').val();
    let MachineMaster_Code = $('#ddlMachineNo').val();
    let ShiftMaster_Code = $('#ddlIssueShift').val();
    let EntryDate = $('#txtIssueProductionDate').val();

    

    if (typeof EntryDate === 'undefined' || EntryDate === '' || EntryDate === null) {
        toastr.error('Production Date should not be blank');
        return;

    }
    if (typeof MachineMaster_Code === 'undefined' || MachineMaster_Code === '0' || MachineMaster_Code ==0) {
        toastr.error('Machine Name should not be blank');
        return;

    }

    if (typeof ShiftMaster_Code === 'undefined' || ShiftMaster_Code === '0' || ShiftMaster_Code == 0) {
        toastr.error('Shift should not be blank');
        return;

    }
    if (typeof GodownMaster_Code === 'undefined' || GodownMaster_Code == 0 || GodownMaster_Code === null || GodownMaster_Code === "0") {
        toastr.error('Warehouse not selected Plz select..');
        return;

    }

    let IssueIdPayload = [];

    let dtIssueSlitID = document.getElementById("tbIssueSlitID");

    for (var i = 1; i < dtIssueSlitID.rows.length; i++) {
        let dtIssueSlitIDUpdateRow = dtIssueSlitID.rows[i];
        let HideColObj = JSON.parse(dtIssueSlitIDUpdateRow.cells[indx_dtIssueSlitID_HideObj].innerHTML.trim());

        if (CallBy === 'ScanIdNo') {
            if ($('#txtScanIdNo').val().trim().toLowerCase() === HideColObj.IdentificationNo.toLowerCase()) {
                dtIssueSlitIDUpdateRow.cells[indx_dtIssueSlitID_CheckBox].getElementsByTagName('input')[0].checked = true;

            }
        }

       
        
        

        let CheckBox = dtIssueSlitIDUpdateRow.cells[indx_dtIssueSlitID_CheckBox].getElementsByTagName('input')[0];
        

        if (CheckBox.checked==true) {
            IssueIdPayload.push({
                pvcProductionMaster_Code: G_PVCProductionMaster_Code,
                shiftMaster_Code: ShiftMaster_Code,
                machineMaster_Code: MachineMaster_Code,
                godownMaster_Code: GodownMaster_Code,
                itemMaster_Code: HideColObj.ItemMaster_Code,
                itemSizeMaster_Code: HideColObj.ItemSizeMaster_Code,
                qtyMT: parseFloat(HideColObj.QtyMT).toFixed(2),
                inputID: HideColObj.IdentificationNo,
                entrydate: EntryDate,
                planBatchNo: HideColObj.PlanBatchNo,
                itemMasterSizeDesp: HideColObj.ItemSize,
                rollingPlanMaster_Code: HideColObj.PlanBatchNo_Code,
                qtyPC: 0,
                isRejected: "",
                buyerPoMaster_Code: 0,
                weightInCalculatedRange: "",
                calculatedWT: 0,
                scaleWT: 0
            })
        }
    }

    console.log(IssueIdPayload);
    Showloader();

    BreakDownService.IsBreakDownRunning(G_ProcessMaster_Code, MachineMaster_Code, GodownMaster_Code).then(function (breakDownrespone) {

        if (breakDownrespone.Status === 'N') {
            RollingProductionService.SaveIssueID(JSON.stringify(IssueIdPayload)).then(function (Respone) {

                if (Respone.Status === 'Y') {
                    HideLoader()

                    if (G_PVCProductionMaster_Code == 0) {
                        G_PVCProductionMaster_Code = Respone.Code;
                    }
                    toastr.success(Respone.Msg);
                    RollingProductionEnty_GatPlanDetail();
                }
                else {
                    toastr.error(Respone.Msg);
                    HideLoader()
                }
                $('#txtScanIdNo').val('');
            });
        }
        else {
            toastr.error('Can not Save Entry! ' + breakDownrespone.Msg + ' on selected Mill..')
            HideLoader();
        }
    });
}

function GetPVCProductionMaster_Code(EntryDate, ShiftMaster_Code, MachineMaster_Code, GodownMaster_Code) {
    let PVCProductionMaster_CodePayload = [{
        pvcProductionMaster_Code: 0,
        shiftMaster_Code: ShiftMaster_Code,
        machineMaster_Code: MachineMaster_Code,
        godownMaster_Code: GodownMaster_Code,
        itemMaster_Code: 0,
        itemSizeMaster_Code:0,
        qtyMT: 0,
        inputID:'',
        entrydate: EntryDate,
        planBatchNo: '',
        itemMasterSizeDesp: '',
        rollingPlanMaster_Code: 0,
        qtyPC: 0,
        isRejected: '',
        buyerPoMaster_Code: 0,
        weightInCalculatedRange: '',
        calculatedWT: 0,
        scaleWT: 0
    }]

    return RollingProductionService.GetPVCProductionMaster_Code(JSON.stringify(PVCProductionMaster_CodePayload));
}

function RollingProductionEnty_UpdateissueIDQtyMT(ele) {

   let eleRow= $(ele).closest('tr')[0];
    let HideColObj = JSON.parse(eleRow.cells[indx_dtIssueSlitID_HideObj].innerHTML.trim());
    

    
    let qtyMT = eleRow.cells[2].getElementsByTagName('input')[0].value;
    let pVCProductionMaster_Code = G_PVCProductionMaster_Code;
    let pVCProductionIssueDetails_Code = HideColObj.Code;
    let QtyMTMax = HideColObj.MaxW; 
    if (qtyMT != "" && qtyMT != '0') {
        if (Number(qtyMT) > Number(QtyMTMax)) {
            toastr.error('Issue Id qtyMT: ' + qtyMT +' Should be less then Max qtyMT :' + QtyMTMax);
            return;
        }
        
        RollingProductionService.UpdateIssueIDQtyMT(pVCProductionMaster_Code, qtyMT, pVCProductionIssueDetails_Code).then(function (Respone) {

            if (Respone.Status === 'Y') {
                HideLoader()
                toastr.success(Respone.Msg);
               
            }
            else {
                toastr.error(Respone.Msg);
                HideLoader()
            }
           
        });

    } else {
        toastr.error('Issue Id qtyMT can not be blank or zero');
       
    }
}

async function RollingProductionEnty_GatReceivedPlanDetail() {
    let EntryDate = $('#txtReceivePlanDate').val();
    let MachineMaster_Code = $('#ddlMachineNoReceive').val();

    let GodownMaster_Code = $('#ddlGodownReceive').val();

    let ddlMachineNo = document.getElementById("ddlMachineNoReceive");
    let MachineName = ddlMachineNo.options[ddlMachineNo.selectedIndex].text;
    let ddlGodown = document.getElementById("ddlGodownReceive");
    let GodownName = ddlGodown.options[ddlGodown.selectedIndex].text;

    if (typeof EntryDate === 'undefined' || EntryDate === '' || EntryDate === null) {
        toastr.error('Plan Date should not be blank');
        return;

    }
    if (typeof MachineName === 'undefined' || MachineName === '' || MachineName === null) {
        toastr.error('Machine Name should not be blank');
        return;

    }
    if (typeof GodownMaster_Code === 'undefined' || GodownMaster_Code === '' || GodownMaster_Code === null || GodownMaster_Code === "0") {
        toastr.error('Warehouse not selected Plz select..');
        return;

    }

    //@if (string.IsNullOrEmpty(ViewBag.BOMOrderWiseFor) == false && ViewBag.BOMOrderWiseFor == "PPPL") {
    //    @: if (typeof GodownName === 'undefined' || GodownName === '' || GodownName === null)
    //        @: {
    //        @: M.toast({ html: 'Godown Name should not be blank', classes: 'rounded' });
    //        @: return;
    //        @:
    //        @:
    //    }
    //}

    let ProducationDate = $('#txtReceiveProductionDate').val();
    let ShiftMaster_Code = $('#ddlReceiveShift').val();


    let pVCProductionMaster_CodeRep = await GetPVCProductionMaster_Code(ProducationDate, ShiftMaster_Code, MachineMaster_Code, GodownMaster_Code);
    if (pVCProductionMaster_CodeRep.length > 0) {
        G_PVCProductionMaster_Code = pVCProductionMaster_CodeRep[0].Code;
    } else {
        G_PVCProductionMaster_Code = 0;
    }
    if (G_PVCProductionMaster_Code == 0) {
        toastr.error('Weight Not Issue for this Plan Date:' + EntryDate + ' Plz Issue Weight First on Production Date:' + ProducationDate + '!');
        return;
    }



    let IssueReceivePayload = {
        planBatchNo: "0",
        entrydate: EntryDate,
        warehouseName: GodownName,
        processName: "",
        machineNo: MachineName,
        getType: "PlanBatch",
        totalPC: 0,
        totalPCRej: 0,
        pvcProductionMaster_Code: G_PVCProductionMaster_Code,
        rejItemCodesAndPCandWeight: "",
        totalWeight: 0
    }
    Showloader();
    RollingProductionService.UDF_GetPlanBatchIssueReceiveDetail(JSON.stringify(IssueReceivePayload)).then( function (response) {
        HideLoader();
       

        let indxRowNo = 0;
        console.log(response);

        response = response.map(item => {
           

            item.IsBundleConfig = "Y";
            if (item.PCPerBundle >= item.QtyPC) {
                item.PCPerBundle = item.QtyPC;
            }
            if (Number(item.PCPerBundle) == 0) {
                item.IsBundleConfig = "N";
            }
            indxRowNo++;
            return {
                hideObj: JSON.stringify(item),
                "Plan Batch No": item.PlanBatchNo,
                "Item Name": item.ItemName,
                "Item Size": item.ItemSize,
                "Bal PC": item.QtyPC,
                "Fresh Qty PC": `<input class="BizSolFormControl form-control form-control-sm" type="text" onchange="BizSolInputControl.OnChangeNumericTextBox(this);RollingProductionEnty_calWT(this)" onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);" value="${item.PCPerBundle}" autocomplete="off" maxlength="5">`,
                "Fresh Qty MT": `<input class="BizSolFormControl form-control form-control-sm" type="text" onchange="BizSolInputControl.OnChangeFloatTextBox(this,3)" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" value="0" autocomplete="off">`,
                "Mix PC": `<input class="BizSolFormControl form-control form-control-sm" type="text" onchange="BizSolInputControl.OnChangeNumericTextBox(this)" onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);" value="0" autocomplete="off" maxlength="5">`,
                "Calculated WT": parseFloat(item.PCPerBundle * item.WeightPerPC).toFixed(3),
                "Warehouse": `<select id="ddlReceivedGodown_${indxRowNo}" class="form-control form-control-sm box_border"></select>`,
                "Rejected PC": `<input class="BizSolFormControl form-control form-control-sm" type="text" onchange="BizSolInputControl.OnChangeNumericTextBox(this)" onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);" value="0" autocomplete="off" maxlength="5">`,
                "Rejected MT": `<input class="BizSolFormControl form-control form-control-sm" type="text" onchange="BizSolInputControl.OnChangeFloatTextBox(this,3)" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" value="0" autocomplete="off">`,
                "Action": '<a class="btn btn-secondary icon-height" title="Scrap Item" onclick="RollingProductionEnty_GetScrapAndRejectedItem()"> <i class="fa fa-print"></i></a>&nbsp;&nbsp; <a class="btn btn-success icon-height" title="Add" onclick="RollingProductionEnty_AddReceveBundel(this)"> <i class="fa fa-save"></i></a>'
            }
        })
       
        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["hideObj","Mix PC"];
        const ColumnAlignment = {
            "Qty PC": 'right',
            "Qty MT": 'right',
            "Qty SQM": 'right',
            "Warehouse": 'left;width:150px',
        };

        if (response.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbItemToBeReceiveHeader", "tbItemToBeReceiveBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false)
            for (indxRowNo = 1; indxRowNo <= response.length; indxRowNo++) {

                BindSelectList($(`#ddlReceivedGodown_${indxRowNo}`)[0], DdlReceiveGodown.map((item) => ({ Code: item.Code, Desp: item.Warehouse })));
                $(`#ddlReceivedGodown_${indxRowNo}`).select2({
                    width: '-webkit-fill-available'
                });
            }
        } else {
            $('#tbItemToBeReceive tr').empty()
            $('#paginator-tbItemToBeReceive').empty();
        }
        GetReceviedDetails();

    });

}

function GetReceviedDetails() {
    Showloader();
    RollingProductionService.Getddl('GetReceviedDetails',G_PVCProductionMaster_Code).then(function (response) {
        HideLoader();



        console.log(response);

        response = response.map(item => {
            return {
                ...item,
                "WeightInCalculatedRange": item.WeightInCalculatedRange=='N'?`<span class="LightRed">`:'',
                "Action": `<a class="btn btn-info icon-height" title="${item.BundleNo}" onclick="RollingProductionEnty_PrintID('${item.BundleNo}#')"> <i class="fa fa-print"></i></a>`
            }
        })

        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["BundleNo","WeightInCalculatedRange","Mix"];
        const ColumnAlignment = {
            "Received PC": 'right',
            "Received MT": 'right',
            "Calculated WT": 'right'
            
        };

        if (response.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbReceiveViewHeader", "tbReceiveViewBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false)
            $('.LightRed').each(function(inx,val){

                val.closest('tr').style["backgroundColor"] ='#e90c0c5e'
            });


        } else {
            $('#tbReceiveView tr').empty()
            $('#paginator-tbReceiveView').empty();
        }
       

    });
}

async function RollingProductionEnty_AddReceveBundel(ele) {
    let EntryDate = $('#txtReceiveProductionDate').val();
    let GodownMaster_Code = $('#ddlGodownReceive').val();
    let ddlMachineNo = document.getElementById("ddlMachineNoReceive");
    let MachineName = ddlMachineNo.options[ddlMachineNo.selectedIndex].text;
    let MachineMaster_Code = $('#ddlMachineNoReceive').val();

    G_WeightInCalculatedRange = "Y";

    if (typeof EntryDate === 'undefined' || EntryDate === '' || EntryDate === null) {
        toastr.error('Production Date should not be blank');
        return;

    }
    if (typeof MachineName === 'undefined' || MachineName === '' || MachineName === null) {
        toastr.error('Machine Name should not be blank');
        return;

    }

    if (GodownMaster_Code == 0) {
        toastr.error('Warehouse should not be blank');
        return;
    }


    let eleRow = $(ele).closest('tr')[0];
    let HideColObj = JSON.parse(eleRow.cells[indx_dtIssueSlitID_HideObj].innerHTML.trim());

    

    let dtPlanBatchNo = HideColObj.PlanBatchNo.trim();
    let BalQtyPC = HideColObj.QtyPC;
    let FreshPC = eleRow.cells[IndxtbItemToBeReceive_FreshPC].getElementsByTagName('input')[0].value;
    let FreshMT = eleRow.cells[IndxtbItemToBeReceive_FreshMT].getElementsByTagName('input')[0].value;
    //let ScaleWT = eleRow.cells[IndxtbItemToBeReceive_FreshMT].getElementsByTagName('input')[1].value;
    let IsBundleConfig = HideColObj.IsBundleConfig;

    let MixPC = eleRow.cells[IndxtbItemToBeReceive_MixPC].getElementsByTagName('input')[0].value;
    let MixMT = 0;

    let CalculatedWT = eleRow.cells[IndxtbItemToBeReceive_CalculatedWT].innerHTML.trim();
    let RWarehouseCode = eleRow.cells[IndxtbItemToBeReceive_RWarehouse].getElementsByTagName('select')[0].value;

    let RejectedPC = eleRow.cells[IndxtbItemToBeReceive_RejectedPC].getElementsByTagName('input')[0].value;
    let RejectedWeight = eleRow.cells[IndxtbItemToBeReceive_RejectedWeight].getElementsByTagName('input')[0].value;

    let ItemSizeMasterCode = HideColObj.ItemSizeMaster_Code;
    let PlanBatchNo_Code = HideColObj.PlanBatchNo_Code;
    let RejectedItemCode = "";

    
    let TotalIssueWeightForPlanBatch = await RollingProductionService.GetTotalIssueOrReciveWeightByPlanBatchNo(dtPlanBatchNo, 'GetTotalIssueWeightByPlanBatchNo', 0, G_PVCProductionMaster_Code);

    

    
    let TotalMixIssueWeight = await RollingProductionService.GetTotalIssueOrReciveWeightByPlanBatchNo(dtPlanBatchNo, 'GetTotalMixIssueWeight', 0, G_PVCProductionMaster_Code); 
    



    let TotalRecvPc = Number(FreshPC) + Number(RejectedPC);

    let TotalReciveWeightForPlanBatch = await RollingProductionService.GetTotalIssueOrReciveWeightByPlanBatchNo(TotalRecvPc, 'GetCurrentReciveWeight', ItemSizeMasterCode, PlanBatchNo_Code); 

    

    if (typeof FreshPC === 'undefined' || FreshPC === '' || FreshPC === null || Number(FreshPC) == 0) {
        
        toastr.error('FreshPC should not be blank or Zero');
        return;

    }
    if (typeof FreshMT === 'undefined' || FreshMT === '' || FreshMT === null || Number(FreshMT) == 0) {
        
        toastr.error('FreshMT should not be blank or Zero');
        return;

    }

    if (typeof MixPC === 'undefined' || MixPC === '' || MixPC === null) {
        
        toastr.error('Mix PC should not be blank');
        return;

    }

    if (typeof RejectedPC === 'undefined' || RejectedPC === '' || RejectedPC === null) {
       
        toastr.error('RejectedPC Name should not be blank');
        return;

    }
    if (typeof RejectedWeight === 'undefined' || RejectedWeight === '' || RejectedWeight === null) {
       
        toastr.error('Rejected Weight should not be blank');
        return;

    }
    if (typeof RWarehouseCode === 'undefined' || RWarehouseCode === '' || RWarehouseCode === null || RWarehouseCode === '0' || RWarehouseCode === 0) {
       toastr.error('Received Warehouse should not be blank');
        return;

    }

    if (IsBundleConfig.trim() === "N") {
       toastr.error('Please Check! Bundle Not configure for this Size');
        return;
    }

    if (BalQtyPC < TotalRecvPc) {
       toastr.error('FreshPC and RejectedPC Total should ' + BalQtyPC);
        return;

    }

    if (TotalIssueWeightForPlanBatch == 0) {
        toastr.error('Cannot receive! Weight not issue for this plan ' + TotalIssueWeightForPlanBatch + ' on Production Date: ' + $('#txtReceiveProductionDate').val());
        return;

    }

    if (TotalIssueWeightForPlanBatch < 0) {
       toastr.error('issue Weight! (-) negative: ' + TotalIssueWeightForPlanBatch);
        return;

    }

    if (FreshMT > 0 && TotalIssueWeightForPlanBatch < FreshMT) {

       toastr.error('Receive Weight is greater to issue Weight! Issue Weight: ' + TotalIssueWeightForPlanBatch + ' Receive Weight: ' + FreshMT);
        return;
    }
    else if (TotalIssueWeightForPlanBatch < TotalReciveWeightForPlanBatch) {
        var PerPCWeight = TotalReciveWeightForPlanBatch / TotalRecvPc;
        var PCCanRecive = TotalIssueWeightForPlanBatch / PerPCWeight;

       toastr.error('Receive Weight is greater to issue Weight! Issue Weight: ' + TotalIssueWeightForPlanBatch + ' Receive Weight: ' + TotalReciveWeightForPlanBatch + ' :PC Can Receive:- ' + parseInt(PCCanRecive));
        return;

    }


    if (await UDF_ValidatePipePCWeightWithCalculated(dtPlanBatchNo, FreshPC, FreshMT) == false) {
        return;
    }

    if (Number(RejectedPC) > 0 || Number(RejectedWeight) > 0) {
        RejectedItemCode=MakeRejectedItemCodeAndPC(RejectedPC, RejectedWeight);
        if ((Number(RejectedPC) > 0 || Number(RejectedWeight) > 0) && RejectedItemCode === '') {
           toastr.error('Plz! select Rejected item');
            return;

        }
    }

    //if ($('#hfAllowWeightOnlyByWeighment').val() === 'Y' && IsGetWeightByScale == false) {
    //   toastr.error("Please take weight by Scale!");
    //    return false;
    //}

   

    if (Number(MixPC) > 0) {
        let WeightPerPC = HideColObj.WeightPerPC;
        MixMT = parseFloat(Number(WeightPerPC) * Number(MixPC)).toFixed(3);
        if (Number(TotalMixIssueWeight) == 0) {
           toastr.error('Cannot not Mix Item! Mix Weight not Issue:');
            return false;
        }
        if (Number(TotalMixIssueWeight) < Number(MixMT)) {
           toastr.error('Cannot not Mix Item! Issue Mix Weight:' + TotalMixIssueWeight + ' less then to Receive Weight:' + MixMT + ' You can add only ' + parseInt(TotalMixIssueWeight / WeightPerPC) + ' PC');
            return false;
        }

        FreshPC = (Number(FreshPC) - Number(MixPC));
        FreshMT = (Number(FreshMT) - Number(MixMT));

    }

    //toastr.error('Passsuccess');
    //return;
    let IssueReceivePayload = {
        planBatchNo: dtPlanBatchNo,
        entrydate: EntryDate,
        warehouseName: "",
        processName: "",
        machineNo: MachineName,
        getType: "",
        totalPC: FreshPC,
        totalPCRej: RejectedPC,
        pvcProductionMaster_Code: 0,//G_PVCProductionMaster_Code,
        rejItemCodesAndPCandWeight: RejectedItemCode,
        totalWeight: FreshMT
    }

    let ReceivedPayload = [];

    Showloader();
    RollingProductionService.UDF_GetPlanBatchIssueReceiveDetail(JSON.stringify(IssueReceivePayload)).then(function (response) {
       // HideLoader();

       // console.log(response);
        response = response.filter((item) => item.EntryType=='R');

        console.log(response);

        response.forEach(item => {
            if (item.Rejected==="N") {
                item.RejectedGodownCode = RWarehouseCode;
            }

            ReceivedPayload.push({
                pvcProductionMaster_Code: G_PVCProductionMaster_Code,
                shiftMaster_Code: 0,
                machineMaster_Code: MachineMaster_Code,
                godownMaster_Code: item.RejectedGodownCode,
                itemMaster_Code: item.ItemMaster_Code,
                itemSizeMaster_Code: item.ItemSizeMaster_Code,
                qtyMT: parseFloat(item.QtyMT).toFixed(3),
                inputID: "",
                entrydate: EntryDate,
                planBatchNo: item.PlanBatchNo,
                itemMasterSizeDesp: item.ItemSize,
                rollingPlanMaster_Code: item.PlanBatchNo_Code,
                qtyPC: item.QtyPC,
                isRejected: item.Rejected,
                buyerPoMaster_Code: item.BuyerPoMaster_Code,
                markNo: item.MarkNo,
                weightInCalculatedRange: G_WeightInCalculatedRange,
                calculatedWT: CalculatedWT,
                scaleWT: 0
            })

        });

        //console.log(ReceivedPayload);


        BreakDownService.IsBreakDownRunning(G_ProcessMaster_Code, MachineMaster_Code, GodownMaster_Code).then(function (breakDownrespone) {

            if (breakDownrespone.Status === 'N') {
                RollingProductionService.SaveRecevied(JSON.stringify(ReceivedPayload)).then(function (SaveRespone) {

                    if (SaveRespone.Status === 'Y') {
                        HideLoader()
                        toastr.success(SaveRespone.Msg);
                        
                        RollingProductionEnty_GatReceivedPlanDetail();
                        GetReceviedDetails();
                    }
                    else {
                        toastr.error(SaveRespone.Msg);
                        HideLoader()
                    }
                   
                });
            }
            else {
                toastr.error('Can not Save Entry! ' + breakDownrespone.Msg + ' on selected MIll No..')
                HideLoader();
            }
        });

    });
    
    
}


async function UDF_ValidatePipePCWeightWithCalculated(PlanBatchNo, QtyPC, QtyMT) {
    let Respon = await RollingProductionService.UDF_ValidatePipePCWeightWithCalculated(PlanBatchNo, QtyPC, QtyMT)
    let valid = true;

    if (Respon.Status !== 'N') {

        if (Respon.Status.toUpperCase() === "W" && Respon.Msg != "") {
            if (confirm(Respon.Msg) == false) {
                valid = false;
            }
            if (valid == true) {
                G_WeightInCalculatedRange = "N";
            }

        } else if (Respon.Status.toUpperCase() === "Y" && Respon.Msg != "") {
            toastr.error(Respon.Msg);
            valid = false;
        }
    }

    return valid;
}

function RollingProductionEnty_calWT(ele) {
    let eleRow = $(ele).closest('tr')[0];
    let HideColObj = JSON.parse(eleRow.cells[indx_dtIssueSlitID_HideObj].innerHTML.trim());

    let FreshPC = eleRow.cells[IndxtbItemToBeReceive_FreshPC].getElementsByTagName('input')[0].value;
    var WeightPerPC = HideColObj.WeightPerPC;
    eleRow.cells[IndxtbItemToBeReceive_CalculatedWT].innerHTML = parseFloat(FreshPC * WeightPerPC).toFixed(3);

}
function RollingProductionEnty_GetScrapAndRejectedItem() {
    RollingProductionService.Getddl('GetScrapAndRejectedItem', G_ProcessMaster_Code).then(function (resObj) {
        let indxRowNo = 0;
        resObj = resObj.map(item => {
            indxRowNo++;
            let RejectWarehouse = item.AllowToChangeWarehouse == "N" ? `<select id="ddlRejectedGodown_${indxRowNo}" class="form-control form-control-sm box_border" disabled ><option value="${item.GodownMaster_CodeQuality}" selected>${item.GodownName}</option></select>` : `<select id="ddlRejectedGodown_${indxRowNo}" class="form-control form-control-sm box_border" value="${item.GodownMaster_CodeQuality}"></select>`
            
            return {
                hideObj: JSON.stringify(item),
                "Item Name": item.ItemName,
                "PC": `<input class="BizSolFormControl form-control form-control-sm" type="text" onchange="BizSolInputControl.OnChangeNumericTextBox(this);" onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);" value="0" autocomplete="off" maxlength="5">`,
                "MT": `<input class="BizSolFormControl form-control form-control-sm" type="text" onchange="BizSolInputControl.OnChangeFloatTextBox(this,3)" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" value="0" autocomplete="off">`,
                "Warehouse": RejectWarehouse,

            }
        })

        const StringFilterColumn = [];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = false;
        const showButtons = []
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["hideObj", "ItemMaster_Code", "GodownMaster_CodeQuality", "GodownName","AllowToChangeWarehouse"];
        const ColumnAlignment = {
            "PC": 'right',
            "MT": 'right',
            "Qty SQM": 'right',
            "Warehouse": 'left;width:150px',
        };

        if (resObj.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbScrapAndRejectedItemHeader", "tbScrapAndRejectedItembody", resObj, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false)
            for (indxRowNo = 1; indxRowNo <= resObj.length; indxRowNo++) {

               // BindSelectList($(`#ddlRejectedGodown_${indxRowNo}`)[0], DdlReceiveGodown.map((item) => ({ Code: item.Code, Desp: item.Warehouse })));
                $(`#ddlRejectedGodown_${indxRowNo}`).select2({
                    width: '-webkit-fill-available'
                });
            }
        } else {
            $('#tbScrapAndRejectedItem tr').empty()
            $('#paginator-tbScrapAndRejectedItem').empty();
        }
       
        $("#modalGetScrapAndRejectedItem").modal({
            backdrop: 'static',
        });
        $('#modalGetScrapAndRejectedItem').modal('show');
    });
}
function RollingProductionEnty_CheckValidRejected() {
    let dtRejectedItems = document.getElementById("tbScrapAndRejectedItem");

    let isValid = true;

    for (let i = 1; i < dtRejectedItems.rows.length; i++) {
        
            let tbRejectedItemsUpdateRow = dtRejectedItems.rows[i];
        let RNOWeight = tbRejectedItemsUpdateRow.cells[IndxtbScrapAndRejectedItem_RejectedWeight].getElementsByTagName('input')[0].value;
        let RNOGodownCode = tbRejectedItemsUpdateRow.cells[IndxtbScrapAndRejectedItem_RejectedWarehouse].getElementsByTagName('select')[0].value;
            if (RNOWeight > 0 && RNOGodownCode == 0) {
                toastr.error('Rejected Warehouse should not be blank in Row:' + i);
                isValid = false;
                break;
            }

      }
    if (isValid == true) {
        $('#modalGetScrapAndRejectedItem').modal('hide');
    }

}
function MakeRejectedItemCodeAndPC(tPC, tWT) {
    let dtRejectedItems = document.getElementById("tbScrapAndRejectedItem");

    let RejectedItemCodeAndPC = '';

    let totalPC = 0;
    let totalScrapWeight = 0;

    for (let i = 1; i < dtRejectedItems.rows.length; i++) {
        if (i == 0) {

        }
        else {
            let tbRejectedItemsUpdateRow = dtRejectedItems.rows[i];
            let HideColObj = JSON.parse(tbRejectedItemsUpdateRow.cells[indx_dtIssueSlitID_HideObj].innerHTML.trim());

            let RNOPc = tbRejectedItemsUpdateRow.cells[IndxtbScrapAndRejectedItem_RejectedPC].getElementsByTagName('input')[0].value;
            let RNOWeight = tbRejectedItemsUpdateRow.cells[IndxtbScrapAndRejectedItem_RejectedWeight].getElementsByTagName('input')[0].value;

            if (RNOWeight > 0) {
                let ItemMasterCode = HideColObj.ItemMaster_Code;
                let RNOGodownCode = tbRejectedItemsUpdateRow.cells[IndxtbScrapAndRejectedItem_RejectedWarehouse].getElementsByTagName('select')[0].value;

                totalPC += Number(RNOPc);
                totalScrapWeight += Number(RNOWeight);
                RejectedItemCodeAndPC += ItemMasterCode + ',' + Number(RNOPc) + ',' + Number(RNOWeight) + ',' + Number(RNOGodownCode) + '#';
            }

        }


    }

    if (totalPC === Number(tPC) && totalScrapWeight === Number(tWT)) {
     return  RejectedItemCodeAndPC
    } else {
        toastr.error('Plz Check! Total of Reject or Scarp Item PC must be ' + tPC + ' and Weight: ' + tWT + ' in Scrap And Rejected window');
        return '';

    }
    
}
function RollingProductionEnty_Back() {

    window.location.href = baseUrl +"/ProductionMasters/Rolling/RollingProductionSummary"
}
function BrkDownStart(Callby) {
    let entryDate = $('#txtIssueProductionDate').val();
    let processMaster_Code = G_ProcessMaster_Code;
    let machineMaster_Code = $('#ddlMachineNo').val();
    let shiftMaster_Code = $('#ddlIssueShift').val();
    let godownMaster_Code = $('#ddlGodown').val();

    if (Callby==="R") {
        entryDate = $('#txtReceiveProductionDate').val();
        processMaster_Code = G_ProcessMaster_Code;
        machineMaster_Code = $('#ddlMachineNoReceive').val();
        shiftMaster_Code = $('#ddlReceiveShift').val();
        godownMaster_Code = $('#ddlGodownReceive').val();
    }

    if (entryDate == "") {
        toastr.error('Invalid Entry Date please Check!');
        return false
    }
    if (processMaster_Code === "0" || processMaster_Code === 0 || typeof processMaster_Code === 'undefined' || processMaster_Code === '' || processMaster_Code === null) {
        toastr.error('Invalid Process please Check!');
        return false
    }
    if (machineMaster_Code === "0" || machineMaster_Code === 0 || typeof machineMaster_Code === 'undefined' || machineMaster_Code === '' || machineMaster_Code === null) {
        toastr.error('Invalid Machine No please Check!');
        return false
    }
    if (shiftMaster_Code === "0" || shiftMaster_Code === 0 || typeof shiftMaster_Code === 'undefined' || shiftMaster_Code === '' || shiftMaster_Code === null) {
        toastr.error('Invalid shift please Check!');
        return false
    }
    if (godownMaster_Code === "0" || godownMaster_Code === 0 || typeof godownMaster_Code === 'undefined' || godownMaster_Code === '' || godownMaster_Code === null) {
        toastr.error('Invalid Warehouse please Check!');
        return false
    }

    InitBrakDownControl(entryDate, processMaster_Code, machineMaster_Code, shiftMaster_Code, godownMaster_Code);
}
function InitBrakDownControl(entryDate, processMaster_Code, machineMaster_Code, shiftMaster_Code, godownMaster_Code) {
    let url = baseUrl + '/CustomControl/BreakDownControl';

    $('#DivBrakDownStartControlModal').load(url, { EntryDate: entryDate, ProcessMaster_Code: processMaster_Code, MachineMaster_Code: machineMaster_Code, ShiftMaster_Code: shiftMaster_Code, GodownMaster_Code: godownMaster_Code });

}
$('#btnBrkDownStart').on('click', function () {
    BrkDownStart("I");
});
$('#btnReceiveBrkDownStart').on('click', function () {
    BrkDownStart("R");
});

function RollingProductionEnty_PrintID(PrintId) {
    InitSelectPrinterToPrintControl(PrintId);
}
function InitSelectPrinterToPrintControl(printText) {
    let url = baseUrl + '/CustomControl/SelectPrinterToPrintControl';

    $('#DivSelectPrinterToPrintControlModal').load(url, { PrintText: encodeURIComponent(printText) });

}
function InitScanQRCodeByCameraControl(outputQRTextElementID, callBackFunctionName) {
    let url = baseUrl + '/CustomControl/ScanQRCodeByCameraControl';

    $('#DivScanQRCodeByCameraControlModal').load(url, { OutputQRTextElementID: outputQRTextElementID, CallBackFunctionName: callBackFunctionName });

}
function RollingProductionEnty_btnScanQR() {

    InitScanQRCodeByCameraControl("txtScanIdNo","RollingProductionEnty_CallbackScanQRCode");
}
function RollingProductionEnty_CallbackScanQRCode() {
    RollingProductionEnty_SaveIssueID('ScanIdNo');
}
function LoadNavPlan() {
    if (typeof IsRunningPlan === 'undefined') {
        return;
    }
    if (typeof NavPVCProductionMaster_Code === 'undefined') {
        return;
    }
    if (typeof NavPlanDate === 'undefined') {
        return;
    }
    if (typeof NavMachineNo === 'undefined') {
        return;
    }

    if (IsRunningPlan === 'N') {
        //$('#txtIssuePlanDate').val(new Date(NavPlanDate).toISOString().slice(0, 10));
        $('#txtIssuePlanDate').val(NavPlanDate.slice(0, 10));
        //RollingProductionEnty_GatPlanDetail();
        // $('#txtReceivePlanDate').val(new Date(NavPlanDate).toISOString().slice(0, 10));
    }
    //if (IsRunningPlan === 'Y') {
    //    // $('#txtReceivePlanDate').val(new Date(NavPlanDate).toISOString().slice(0, 10));
    //    $('#txtReceiveProductionDate').val(new Date(NavPlanDate).toISOString().slice(0, 10));
    //}


}
Bind_ddlGodown();
Bind_ddlMachineNo();
Bind_ddlShift();
CurrentProductionDate();

LoadNavPlan()


window.RollingProductionEnty_Back = RollingProductionEnty_Back;
window.RollingProductionEnty_GatPlanDetail = RollingProductionEnty_GatPlanDetail;
window.RollingProductionEnty_AllSelect = RollingProductionEnty_AllSelect;
window.RollingProductionEnty_SaveIssueID = RollingProductionEnty_SaveIssueID;
window.RollingProductionEnty_UpdateissueIDQtyMT = RollingProductionEnty_UpdateissueIDQtyMT;
window.RollingProductionEnty_GatReceivedPlanDetail = RollingProductionEnty_GatReceivedPlanDetail;
window.RollingProductionEnty_AddReceveBundel = RollingProductionEnty_AddReceveBundel;
window.RollingProductionEnty_calWT = RollingProductionEnty_calWT;
window.RollingProductionEnty_GetScrapAndRejectedItem = RollingProductionEnty_GetScrapAndRejectedItem;
window.RollingProductionEnty_CheckValidRejected = RollingProductionEnty_CheckValidRejected;
window.RollingProductionEnty_PrintID = RollingProductionEnty_PrintID;
window.RollingProductionEnty_btnScanQR = RollingProductionEnty_btnScanQR;
window.RollingProductionEnty_CallbackScanQRCode = RollingProductionEnty_CallbackScanQRCode;




