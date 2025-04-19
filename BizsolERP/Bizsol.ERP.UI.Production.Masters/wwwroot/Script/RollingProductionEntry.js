
import { RollingProductionService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/RollingProductionService.js';

$("#ERPHeading").text("Tube Mill Production");
$('#txtFromDate').val(new Date().toISOString().slice(0, 10));
$('#txtToDate').val(new Date().toISOString().slice(0, 10));

let baseUrl = sessionStorage.getItem('AppBaseURL');
let G_PVCProductionMaster_Code = 0;//28823;
let indx_dtIssueSlitID_HideObj = 0;
let indx_dtIssueSlitID_CheckBox = 7;

function RollingProductionSummary_ShowPlanGrid() {
    let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();
    
    if (FromDate == "" && Todate == "") {
        return false;
    }
   
    Showloader();
    RollingProductionService.GetRollingProductionPlanGridView(FromDate, Todate,"ProductionSummary").then(function (response) {
        HideLoader();
       
            response.forEach(item => {
                item.Action = item.Status === 'Running' ? '<a class="btn btn-info icon-height" onclick="RollingProductionSummary_RollingProductionEntryFrm(\'Y\',\'' + item.SlittingPlanMaster_Code + '\')"> <i class="fa fa-pencil"></i></a>':''
            });
        
       
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
            BizsolCustomFilterGrid.CreateDataTable("tbProductionSummaryViewHeader", "tbProductionSummaryViewBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
           // WebLocatePackingSumDispatch(response);
        } else {
            $('#tbProductionSummaryView tr').empty()
            $('#paginator-tbProductionSummaryView').empty();
        }

    });

    
}



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

function CurrentProductionDate() {
    RollingProductionService.Getddl('GetEntryDate',0).then(function (resEntryDate) {

        $('#txtIssueProductionDate').val(new Date(resEntryDate[0].EntryDate).toISOString().slice(0, 10) );

    });

}

function BindSelectList(element, list) {
    let option = '<option value="0" ClientMaster_Code="0">Select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '" ClientMaster_Code="' + val.ClientMaster_Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

function RollingProductionEnty_GatPlanDetail() {
    let EntryDate = $('#txtIssuePlanDate').val();
    //let MachineName = $('#ddlMachineNo').val();
    //let GodownName = $('#txtGodownIssue').val();
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

    let ProducationDate = $('#txtProEntryDateIssue').val();
    let ShiftCode = $('#ddlShift').val();
    let pVCProductionMaster_Code = 0//GetPVCProductionMaster_Code(ProducationDate, ShiftCode, MachineName, GodownMaster_Code);
    //let issueSlitIDdatatb = GetPlanBatchIssueReceiveDetail(EntryDate, "0", MachineName, "issueSlitID", 0, 0, pVCProductionMaster_Code, '', GodownName, 0);

    let IssueReceivePayload = {
        planBatchNo: "0",
        entrydate: EntryDate,
        warehouseName: GodownName,
        processName: "",
        machineNo: MachineName,
        getType: "PlanBatch",
        totalPC: 0,
        totalPCRej: 0,
        pvcProductionMaster_Code: pVCProductionMaster_Code,
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
                pvcProductionMaster_Code: pVCProductionMaster_Code,
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

        if (response.length > 0) {
            BizsolCustomFilterGrid.CreateDataTable("tbIssueSlitIDHeader", "tbIssueSlitIDBody", IssueSlitIDResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment,false)
            GetIssuedIDDetails();

        } else {
            $('#tbIssueSlitID tr').empty()
            $('#paginator-tbIssueSlitID').empty();
        }


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
    if (G_PVCProductionMaster_Code>0) {
        RollingProductionService.Getddl('GetIssuedIDDetails', G_PVCProductionMaster_Code).then(function (Respone) {

            Respone = Respone.map(item => {
                return {
                    hideObj: JSON.stringify(item),
                    "Id No": item.IdentificationNo,
                    "Qty MT": `<input id="frmEmptyIn_txtVehicleEmptyWeight" class="BizSolFormControl form-control form-control-sm" type="text" onchange="BizSolInputControl.OnChangeFloatTextBox(this,2)" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" value="${parseFloat(item.issueW).toFixed(3) }" autocomplete="off">` ,
                    "Action": '<a class="btn btn-info icon-height" onclick="GateEntyMode_GateEntry(' + item.Code +')"> <i class="fa fa-print"></i></a',
                    
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
                "Qty MT": 'right',
                "Qty SQM": 'right',
            };

            if (Respone.length > 0) {
                BizsolCustomFilterGrid.CreateDataTable("tbIssuedIDDetailsHeader", "tbIssuedIDDetailsBody", Respone, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false)


            } else {
                $('#tbIssuedIDDetails tr').empty()
                $('#paginator-tbIssuedIDDetails').empty();
            }

        });
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
                rollingPlanMaster_Code: HideColObj.PlanBatchNo_Code
            })
        }
    }

    console.log(IssueIdPayload);
    Showloader();
   
    RollingProductionService.SaveIssueID(JSON.stringify(IssueIdPayload)).then(function (Respone) {

        if (Respone.Status === 'Y') {
            HideLoader()

            if (G_PVCProductionMaster_Code == 0) {
                G_PVCProductionMaster_Code = Respone.Code;
            }
            toastr.success(Respone.Msg);

        }
        else {
            toastr.error(Respone.Msg);
            HideLoader()
        }

    });
}
function RollingProductionEnty_Back() {

    window.location.href = baseUrl +"/ProductionMasters/Rolling/RollingProductionSummary"
}

Bind_ddlGodown();
Bind_ddlMachineNo();
Bind_ddlShift();
CurrentProductionDate();

window.RollingProductionEnty_Back = RollingProductionEnty_Back;
window.RollingProductionEnty_GatPlanDetail = RollingProductionEnty_GatPlanDetail;
window.RollingProductionEnty_AllSelect = RollingProductionEnty_AllSelect;
window.RollingProductionEnty_SaveIssueID = RollingProductionEnty_SaveIssueID;



