
import { SlittingProductionEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SlittingProductionEntryService.js';
import { SizeControlService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_SizeControlService.js';
import { AutoSuggestionControl } from '../../Bizsol.WebERP.UI.Shared/js/AutoSuggestion.js';
import { BreakDownService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_BreakDownService.js';
$("#ERPHeading").text("Production Entry GP");
$('#txtFromDate').val(new Date().toISOString().slice(0, 10));
$('#txtToDate').val(new Date().toISOString().slice(0, 10));
$('#txtSlittingDate').val(new Date().toISOString().slice(0, 10));

let baseUrl = sessionStorage.getItem('AppBaseURL');

let PackingListFGFixedParaMeters = [];
let AskNoOfPassInSlitting = "N";
let ManualIDApplicable_FixedParameterPurchase = "N";
let ManualIDApplicable_Process = "N";
let AllowWeightOnlyByWeighment = "N";
let ShowZincWeight = "N";
let AddStdZincPerMT = 0.0;
let G_issueWidth = 0;
let G_ddlItemReceivedOption = '';
let G_issueIdentificationNo = '';
let G_IssueItemMaster_Code = 0;
let G_IssueItemSizeMaster_Code = 0;
let G_IssueGodownMaster_Code = 0;
let G_IssueWeight = 0;
let G_FormType = "Production";
let G_ShowProcessStartEndTime = "N";
let G_ShowGrossWeight = "N";

let LockDateAndShiftInWeb = "N";
let IsGetWeightByScale = false;
let indxSnoCol_tbSlittingReceivedDetails = 0;
let indxItemNameCol_tbSlittingReceivedDetails = 1;
let indxSizeDespCol_tbSlittingReceivedDetails = 2;
let indxPCsCol_tbSlittingReceivedDetails = 4;
let indxWeightCol_tbSlittingReceivedDetails = 5;
let indxManualIDCol_tbSlittingReceivedDetails = 7;
let indxInTimeCol_tbSlittingReceivedDetails = 8;
let indxOutTimeCol_tbSlittingReceivedDetails = 9;
let indxGrossWeightCol_tbSlittingReceivedDetails = 10;
let indxRemarksCol_tbSlittingReceivedDetails = 11;
let indxHiddenCol_tbSlittingReceivedDetails = 12;

let G_SlittingPlanMaster_Code = 0;
let G_Row = ''
let G_NewPlanSummary = []; // holds last GetSlittingPlanOrEntrySummary response for New mode

let G_UserMaster_Code = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
let prevFocus;
let G_machineIP = "";
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
function SlittingProductionEntry_GetValue(item, keys, prefix = '', defaultValue = '') {
    if (!item) return defaultValue;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
            return prefix + item[key];
        }
    }
    return defaultValue;
}
function SlittingProductionEntry_IsBlank(value) {
    return value === undefined || value === null || value === '';
}
function SlittingProductionEntry_GetInTimeValue(item) {
    return SlittingProductionEntry_GetValue(item, ['InTime', 'In Time', 'In_Time', 'StartTime', 'Start Time'], '');
}
function SlittingProductionEntry_GetPriorityNo(item) {
    let p = SlittingProductionEntry_GetValue(item, ['Priority', 'Priority No', 'PriorityNo', 'priority'], '');
    if (SlittingProductionEntry_IsBlank(p)) {
        return 999999;
    }
    let n = parseFloat(p);
    if (isNaN(n)) {
        return 999999;
    }
    return n;
}
function SlittingProductionEntry_GetPlanCode(item) {
    return SlittingProductionEntry_GetValue(item, ['SlittingPlanMaster_Code', 'Code'], '');
}
function SlittingProductionEntry_FindPlanIndexByCode(list, planCode) {
    if (!Array.isArray(list)) {
        return -1;
    }
    for (let i = 0; i < list.length; i++) {
        let code = SlittingProductionEntry_GetPlanCode(list[i]);
        if (code !== '' && planCode !== '' && code.toString() === planCode.toString()) {
            return i;
        }
    }
    return -1;
}
function SlittingProductionEntry_SortPlansByPriority(list) {
    list.sort(function (a, b) {
        return SlittingProductionEntry_GetPriorityNo(a) - SlittingProductionEntry_GetPriorityNo(b);
    });
}

function SlittingProductionEntry_BuildPlanCardHtml(item, isMainCard) {
    const planNo = SlittingProductionEntry_GetValue(item, ['PlanNo', 'Plan No', 'Plan_No', 'PackingList No'], '');
    const planDate = SlittingProductionEntry_GetValue(item, ['PlanDate', 'Plan Date', 'Date'], '');
    const millName = SlittingProductionEntry_GetValue(item, ['Desp', 'Mill Name', 'Mill', 'MachineName', 'Machine Name'], '');
    const processName = SlittingProductionEntry_GetValue(item, ['ProcessName', 'Process Name', 'Process', 'ProcessDesp'], '');
    const coilId = SlittingProductionEntry_GetValue(item, ['IdentificationNo', 'Identification No', 'CoilId', 'Coil ID'], '');
    const coilSize = SlittingProductionEntry_GetValue(item, ['CoilSize', 'SizeDesp', 'Size Desp'], '');
    const coilWeight = SlittingProductionEntry_GetValue(item, ['CoilWeight', 'Weight', 'QtyKG', 'Qty KG'], '');
    const output = SlittingProductionEntry_GetValue(item, ['Slitting Combination', 'OutPut', 'SlittingCombination', 'OutPutDesp'], '');
    const planCode = SlittingProductionEntry_GetPlanCode(item);
    const inTime = SlittingProductionEntry_GetInTimeValue(item);

    let editBtn = '';
    if (planCode) {
        editBtn = '<a class="btn btn-info icon-height" onclick="SlittingProductionEntry_EditOrView(\'Y\',\'' + planCode + '\')"> <i class="fa fa-pencil"></i></a>';
    }

    let startDisabledAttr = '';
    let startBtnClass = 'btn-success';
    if (!SlittingProductionEntry_IsBlank(inTime)) {
        startDisabledAttr = ' disabled';
        startBtnClass = 'btn-secondary';
    }

    let startBtnCssClass = 'btn-start-upcoming';
    if (isMainCard === true) {
        startBtnCssClass = 'btn-start-main';
    }

    let endBtnCssClass = 'btn-end-upcoming';
    if (isMainCard === true) {
        endBtnCssClass = 'btn-end-main';
    }

    let html = '<div class="card slit-plan-card col-12 col-sm-6 mt-3" data-plan-code="' + planCode + '">' +
        '<div class="card-body">' +
        '<div class="table-responsive">' +
        '<table class="slit-plan-table">' +
        '<tr>' +
        '<th style="width:16%; min-width:80px;">Plan No</th>' +
        '<td style="width:15%; min-width:100px;">' + (planNo || '') + '</td>' +
        '<td colspan="6" class="d-none d-md-table-cell"></td>' +
        '<th style="width:20%; min-width:80px;">Plan Date</th>' +
        '<td style="width:25%; min-width:100px;">' + (planDate || '') + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td colspan="10" class="slit-plan-header-main">' + (millName ? 'Mill : ' + millName : 'Mill :') + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td colspan="10" class="slit-plan-header-sub">' + (processName ? 'Process : ' + processName : 'Process :') + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td colspan="10" class="slit-plan-coil-id">' + (coilId ? 'Coil Id : ' + coilId : 'Coil Id :') + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td colspan="10" class="slit-plan-coil-size">' + (coilSize ? 'Coil Size : ' + coilSize : 'Coil Size :') + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td colspan="10" class="slit-plan-coil-weight">' + (coilWeight ? 'Coil Weight : ' + coilWeight : 'Coil Weight :') + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td colspan="10" class="slit-plan-output">' + (output ? 'Output : ' + output : 'Output :') + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td colspan="10" class="slit-plan-actions-row">' +
        '<div class="d-flex align-items-center w-100">' +
        '<div class="d-flex align-items-center" style="flex:1; justify-content:flex-start; gap:8px;">' +
        '<button type="button" class="btn ' + startBtnClass + ' btn-height btn-sm ' + startBtnCssClass + '" data-plan-code="' + planCode + '"' + startDisabledAttr + '>Start Time</button>' +
        '<span class="slit-plan-actions-time">' + (inTime || '') + '</span>' +
        '</div>' +
        '<div style="flex:0; text-align:center;">' + editBtn + '</div>' +
        '<div style="flex:1; display:flex; justify-content:flex-end;">' +
        '<button type="button" class="btn btn-danger btn-height btn-sm ' + endBtnCssClass + '" disabled>End Time</button>' +
        '</div>' +
        '</div>' +
        '</td>' +
        '</tr>' +
        '</table>' +
        '</div>' +
        '</div>' +
        '</div>';

    return html;
}

function SlittingProductionEntry_BindNewPlanLayout(plans) {
    $('#mainPlanCard').empty();
    $('#upcomingPlansContainer').empty();
    $('#upcomingPlansSection').hide();

    if (!plans || plans.length === 0) {
        return;
    }

    let runningCards = [];
    let upcomingCards = [];

    // First, separate running (InTime not blank) and others
    for (let i = 0; i < plans.length; i++) {
        let inTime = SlittingProductionEntry_GetInTimeValue(plans[i]);

        if (!SlittingProductionEntry_IsBlank(inTime)) {
            runningCards.push(plans[i]);
        } else {
            upcomingCards.push(plans[i]);
        }
    }

    // Only ONE running plan card: pick by Priority
    let mainCard = null;
    if (runningCards.length > 0) {
        SlittingProductionEntry_SortPlansByPriority(runningCards);
        mainCard = runningCards[0];
    }

    // Build upcoming list = all plans except the selected mainCard
    let allUpcoming = [];
    for (let i = 0; i < plans.length; i++) {
        let planCode = SlittingProductionEntry_GetPlanCode(plans[i]);
        let isMain = false;

        if (mainCard !== null) {
            let mainCode = SlittingProductionEntry_GetPlanCode(mainCard);
            if (mainCode !== '' && planCode !== '' && mainCode.toString() === planCode.toString()) {
                isMain = true;
            }
        }

        if (!isMain) {
            allUpcoming.push(plans[i]);
        }
    }

    // Render single running plan card (if any)
    if (mainCard !== null) {
        $('#mainPlanCard').append(SlittingProductionEntry_BuildPlanCardHtml(mainCard, true));
    }

    // Render upcoming plans
    if (allUpcoming.length > 0) {
        $('#upcomingPlansSection').show();
        SlittingProductionEntry_SortPlansByPriority(allUpcoming);
        for (let i = 0; i < allUpcoming.length; i++) {
            $('#upcomingPlansContainer').append(SlittingProductionEntry_BuildPlanCardHtml(allUpcoming[i], false));
        }
    }
}

$(document).on('click', '.btn-start-main', function () {
    let btn = $(this);
    let planCode = btn.data('plan-code');

    if (planCode && planCode !== '' && planCode !== 0 && planCode !== '0') {
        Showloader();
        SlittingProductionEntryService.StartTimeUpdated(planCode).then(function (resp) {
            HideLoader();
            if (resp && resp.Status === 'N') {
                toastr.error(resp.Msg || 'Failed to update start time.');
                return;
            }

            let now = new Date();
            let timeText = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            btn.closest('.slit-plan-actions-row').find('.slit-plan-actions-time').text(timeText);

            let idx = SlittingProductionEntry_FindPlanIndexByCode(G_NewPlanSummary, planCode);
            if (idx >= 0) {
                G_NewPlanSummary[idx].StartTime = timeText;
                G_NewPlanSummary[idx].InTime = timeText;
            }
            
            btn.prop('disabled', true);
            btn.removeClass('btn-success').addClass('btn-secondary');
        }).catch(function () {
            HideLoader();
        });
    }
});

$(document).on('click', '.btn-end-main', function () {
    let now = new Date();
    let timeText = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    $('#spEndTimeCell').text(timeText);

    $(this).prop('disabled', true);
    $(this).removeClass('btn-danger').addClass('btn-secondary');
});

$(document).on('click', '.btn-start-upcoming', function () {
    let btn = $(this);
    let planCode = btn.data('plan-code');

    if (planCode && planCode !== '' && planCode !== 0 && planCode !== '0') {
        Showloader();
        SlittingProductionEntryService.StartTimeUpdated(planCode).then(function (resp) {
            HideLoader();
            if (resp && resp.Status === 'N') {
                toastr.error(resp.Msg || 'Failed to update start time.');
                return;
            }

            let now = new Date();
            let timeText = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

            let idx = SlittingProductionEntry_FindPlanIndexByCode(G_NewPlanSummary, planCode);
            if (idx >= 0) {
                G_NewPlanSummary[idx].StartTime = timeText;
                G_NewPlanSummary[idx].InTime = timeText;

                // Rebuild layout: this will add ONE running plan card in mainPlanCard
                // and move this plan from upcoming to main section
                SlittingProductionEntry_BindNewPlanLayout(G_NewPlanSummary);
            } else {
                btn.closest('.slit-plan-actions-row').find('.slit-plan-actions-time').text(timeText);
                btn.prop('disabled', true);
                btn.removeClass('btn-success').addClass('btn-secondary');
            }
        }).catch(function () {
            HideLoader();
        });
    }
});
$(document).on('click', '.btn-end-upcoming', function () {
    let planIndex = $(this).data('plan-index');
    let now = new Date();
    let timeText = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    $('.upcoming-end-time-' + planIndex).text(timeText);
    
    $(this).prop('disabled', true);
    $(this).removeClass('btn-danger').addClass('btn-secondary');
});
function SlittingProductionEntry_ShowPlanGrid() {
    let filterType = $('input[name="filterType"]:checked').val();
    let FromDate = $('#txtFromDate').val(), Todate = $('#txtToDate').val();

    if (FromDate == "" && Todate == "") {
        return false;
    }

    let apiFilterType = filterType === 'New' ? 'Plan' : filterType;

    Showloader();
    SlittingProductionEntryService.GetSlittingPlanOrEntrySummary(FromDate, Todate, apiFilterType).then(function (response) {
        HideLoader();

        if (filterType === 'New') {
            G_NewPlanSummary = Array.isArray(response) ? response : [];

            $('#NewPlanLayout').show();
            $('.fixed-height-table').hide();
            $('#paginator-tbProductionGPView').hide();

            SlittingProductionEntry_BindNewPlanLayout(G_NewPlanSummary);
            return;
        } else {
            $('#NewPlanLayout').hide();
            $('.fixed-height-table').show();
            $('#paginator-tbProductionGPView').show();
        }

        if (filterType == 'Plan') {
            response.forEach(item => {
                item.Action = '<a class="btn btn-info icon-height" onclick="SlittingProductionEntry_EditOrView(\'Y\',\'' + item.SlittingPlanMaster_Code + '\')"> <i class="fa fa-pencil"></i></a>'
            });
        }
        else {

            response.forEach(item => {
                item.Action = '<a class="btn btn-info icon-height" onclick="SlittingProductionEntry_Print(\'' + item["Identification No"] + '\')"> <i class="fa fa-print"></i></a>'
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
        const hiddenColumns = ["QtyMT", "QtyPC", "QtyMTRS", "SlittingPlanMaster_Code", "Desp", "Slitting Combination","InTime"];
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


function getPackingListFGFixedParaMeters() {
    SlittingProductionEntryService.GetFixedParaMeter().then(function (response) {
        PackingListFGFixedParaMeters = response;
        LoadFrm();
    });
}
function GetProcessMasterCustomizedValue(ProcessMaster_Code) {
    SlittingProductionEntryService.GetSlittingProductionEntryDDl('GetProcessMasterCustomizedValue', ProcessMaster_Code).then(function (response) {

        if (response.length > 0) {
            G_ShowProcessStartEndTime = response[0].ShowProcessStartEndTime;
            G_ShowGrossWeight = response[0].ShowGrossWeight;
        }

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
       

        let option = '<option value="0" ShowTimeInProduction="0" ManualIDApplicable="0" ShowZincWeight="0" AddStdZincPerMT="0" AskNoOfPassInSlitting="0" LockDateAndShiftInWeb="0" FormType="0"></option>';
        $.each(response, function (key, val) {

            option += '<option value="' + val.Code + '" ShowTimeInProduction="' + val.ShowTimeInProduction + '" ManualIDApplicable="' + val.ManualIDApplicable + '" ShowZincWeight="' + val.ShowZincWeight + '" AddStdZincPerMT="' + val.AddStdZincPerMT + '" AskNoOfPassInSlitting="' + val.AskNoOfPassInSlitting + '" LockDateAndShiftInWeb="' + val.LockDateAndShiftInWeb + '" FormType="' + val.FormType + '">' + val.ProcessName + '</option>';
        });

        $('#ddlProcess')[0].innerHTML = option;
        
        $('#ddlProcess').select2({
            width: '-webkit-fill-available'
        });
       
        
    });
}



function Bind_ddlIdNo(Mode,ProcessMaster_Code) {
    SlittingProductionEntryService.GetSlittingProductionEntryDDl(Mode, ProcessMaster_Code).then(function (response) {
       // BindSelectList($('#ddlIdNo')[0], response.map((item) => ({ Code: item.Code, Desp: item.IdentificationNo })))
        //BindSelectList($('#ddlPlanNo')[0], response.map((item) => ({ Code: item.Code, Desp: item.PlanNo })))

        

        let option1 = '<option value="0" ProcessMaster_Code="0"></option>';
        $.each(response, function (key, val) {

            option1 += '<option value="' + val.Code + '" ProcessMaster_Code="' + val.ProcessMaster_Code + '" >' + val.IdentificationNo + '</option>';
        });

        $('#ddlIdNo')[0].innerHTML = option1;
        $('#ddlIdNo').select2({
            width: '-webkit-fill-available'
        });


        let option = '<option value="0" ProcessMaster_Code="0"></option>';
        $.each(response, function (key, val) {

            option += '<option value="' + val.Code + '" ProcessMaster_Code="' + val.ProcessMaster_Code + '" >' + val.PlanNo + '</option>';
        });

        $('#ddlPlanNo')[0].innerHTML = option;
        $('#ddlPlanNo').select2({
            width: '-webkit-fill-available'
        });


        if (response.length == 0) {
            G_SlittingPlanMaster_Code = 0;
            Bind_IssueAndReceivedCoilDetail(G_SlittingPlanMaster_Code);
            return;
        }
        if (G_SlittingPlanMaster_Code>0) {
            $('#ddlPlanNo').val(G_SlittingPlanMaster_Code);
            $('#ddlIdNo').val(G_SlittingPlanMaster_Code);

            $('#ddlPlanNo').select2({
                width: '-webkit-fill-available'
            });
            $('#ddlIdNo').select2({
                width: '-webkit-fill-available'
            });
        }
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
        if (response.length > 0) {
            AllowWeightOnlyByWeighment = response[0].AllowWeightOnlyByWeighment;
            G_machineIP = response[0].WeightScaleIP;
            G_issueIdentificationNo = response[0]["Identification No"];
            
            G_IssueItemMaster_Code = response[0].IssueItemMaster_Code;
            G_IssueItemSizeMaster_Code = response[0].IssueItemSizeMaster_Code;
            G_IssueGodownMaster_Code = response[0].IssueGodownMaster_Code;
            G_IssueWeight = response[0].Weight;


        response = response.map((item) => ({
            "Identification No": item["Identification No"],
            "Size Desp": item["Size Desp"],
            "Actual Width": item["Actual Width"],
            "Weight": item.Weight,
            "Actual Weight": '<input id="txtActualWeight" class="BizSolFormControl form-control form-control-sm" type="text" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" onchange="BizSolInputControl.OnChangeFloatTextBox(this,3);" maxlength="6" autocomplete="off" value="' + item["Actual Weight"] +'" style="text-align: right;" onchange="SlittingProductionEntry_CalActualZincWeight()">',
            "Actual Zinc Weight": '<input id="txtActualZincWeight" class="BizSolFormControl form-control form-control-sm" type="text" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" onchange="BizSolInputControl.OnChangeFloatTextBox(this,3);" maxlength="6" autocomplete="off" value="' + item.ZincWeight +'" style="text-align: right;" onchange="SlittingProductionEntry_CalRecevieZincWeight()">',
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

        
            G_issueWidth = response[0]["Actual Width"];
            
            SelectOptionByText('ddlMachineNo', response[0].MachineNo);
            BizsolCustomFilterGrid.CreateDataTable("tbSlittingIssueDetailsHeader", "tbSlittingIssueDetailsBody", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)

            $('#paginator-tbSlittingIssueDetails').empty();


        }
        else {
            $('#tbSlittingIssueDetails tr').empty();
            $('#paginator-tbSlittingIssueDetails').empty();
            AllowWeightOnlyByWeighment = "N";
        }



        SlittingProductionEntryService.GetSlittingProductionEntryDDl('ReceivedCoilDetails', G_SlittingPlanMaster_Code).then(function (response2) {
            console.log(response2)
            if (response2.length > 0) {
            let ele = document.getElementById('ddlProcess')

            let eleText = ele.options[ele.selectedIndex].text;

            let ThicknessApplicable = response2[0].ThicknessApplicable;
            
            response2 = response2.map((item) => ({
                "SNo": item.SNo,
                //"Item Name": item.ItemName,
                "Item Name": `<select id="ItemReceived_${item.SNo}" class="form-control form-control-sm box_border" onchange="SlittingProductionEntry_OnChange_ddlItemReceived(this)">${G_ddlItemReceivedOption}</select>`,
                //"Size Desp": item.SizeDesp,
                "Size Desp": `${item.SizeDesp} &nbsp;&nbsp;<a class="btn btn-secondary icon-height" onclick="SlittingProductionEntry_OnClick_NewSize(this)"><i class="fa fa-plus"></i></a>`,
                "Thickness": item.itemThick,
                "PCs": eleText.toLowerCase() == 'slitting' && item.NoofSlits > 1 ? `${item.NoofSlits} &nbsp;&nbsp;<a class="btn btn-primary icon-height" onclick="SlittingProductionEntry_AddReceivedItem(this)">Split PC</a>` : item.NoofSlits,
                "Weight": '<input id="txtItemWeight_' + item.SNo + '"  class="form-control form-control-sm itemWeight" type="text" maxlength="6" autocomplete="off" value="' + parseFloat(item.Weight).toFixed(3) + '" style="text-align: right;min-width: 70px;" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" onchange="BizSolInputControl.OnChangeFloatTextBox(this,3);SlittingProductionEntry_CalScrapWeight();" >',
                "No Of Pass": '<input  class="form-control form-control-sm" type="text" maxlength="6" autocomplete="off" value="' + item.NoOfPass + '" style="text-align: right;" onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);">',
                "Manual ID": '<input  class="form-control form-control-sm" type="text" maxlength="6" autocomplete="off" value="' + item.ManualIDNo + '" style="text-align: right;" onkeypress="return BizSolInputControl.OnKeyDownPressNumericTextBox(event,this);">',
                "In Time": '<input  class="form-control form-control-sm " type="time" maxlength="6" autocomplete="off" value="' + item.InTime + '" style="text-align: right;" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);"  >',
                "Out Time": '<input  class="form-control form-control-sm " type="time" maxlength="6" autocomplete="off" value="' + item.OutTime + '" style="text-align: right;" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" >',
                "Gross Weight": '<input  class="form-control form-control-sm " type="text" maxlength="6" autocomplete="off" value="' + parseFloat(item.GrossWeight).toFixed(3) + '" style="text-align: right;" onkeypress="return BizSolInputControl.OnKeyDownPressFloatTextBox(event,this);" onchange="BizSolInputControl.OnChangeFloatTextBox(this,3);">',
                "Remarks": '<input  class="form-control form-control-sm " type="text" maxlength="150" autocomplete="off" value="' + item.Remarks + '" style="text-align: right;" >',
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
            if (G_ShowProcessStartEndTime === 'N') {
                hiddenColumns.push("In Time");
                hiddenColumns.push("Out Time");
            }
            if (G_ShowGrossWeight === 'N') {
                hiddenColumns.push("Gross Weight");
                }

                
            

            
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

                $("input").focus(function () {


                    if (typeof prevFocus !== "undefined") {
                        $("#prev").html(prevFocus.val());
                    }
                    prevFocus = $(this);
                });

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


function SlittingProductionEntry_CreateNew() {
  
        ClrFrm();
        Bind_ddlIdNo('dllAllPlansOrId', G_UserMaster_Code);
        ChangeMode('New');
}
function SlittingProductionEntry_Back() {
    SlittingProductionEntry_ShowPlanGrid()
    ClrFrm();
    Bind_ddlIdNo('dllAllPlansOrId', G_UserMaster_Code);
    ChangeMode('');
}
function SlittingProductionEntry_EditOrView(isEdit, slittingPlanMaster_Code) {
    G_SlittingPlanMaster_Code = slittingPlanMaster_Code;
    Bind_ddlIdNo('dllAllPlansOrId', G_UserMaster_Code);
    $('#ddlPlanNo').val(slittingPlanMaster_Code);

    let elem = document.getElementById('ddlPlanNo');
    $('#ddlPlanNo').select2({
        width: '-webkit-fill-available'
    });
    SlittingProductionEntry_OnChangeddlPlanOrIds(elem)
    ChangeMode('Edit');


    $('#ddlProcess').attr('disabled', 'disabled')
    $('#ddlPlanNo').attr('disabled', 'disabled')
    $('#ddlIdNo').attr('disabled', 'disabled')
}



function SlittingProductionEntry_OnChangeddlProcess(CallBy) {
    let ProcessMaster_Code=0
    let ddlProcess = document.getElementById("ddlProcess");

    AskNoOfPassInSlitting = ddlProcess.options[ddlProcess.selectedIndex].attributes["AskNoOfPassInSlitting"].value;

    ManualIDApplicable_Process = ddlProcess.options[ddlProcess.selectedIndex].attributes["ManualIDApplicable"].value

    ShowZincWeight = ddlProcess.options[ddlProcess.selectedIndex].attributes["ShowZincWeight"].value

    AddStdZincPerMT = ddlProcess.options[ddlProcess.selectedIndex].attributes["AddStdZincPerMT"].value
    G_FormType = ddlProcess.options[ddlProcess.selectedIndex].attributes["FormType"].value

    ProcessMaster_Code = $('#ddlProcess').val();

    Bind_ddlMachineNo(ProcessMaster_Code);
    
    if (CallBy === 'Process') {
        Bind_ddlIdNo('GetPlans', ProcessMaster_Code);
    }

    Bind_ddlScrapItem(ProcessMaster_Code);
    Bind_ddlItemReceived(ProcessMaster_Code);
    GetProcessMasterCustomizedValue(ProcessMaster_Code);
}
function SlittingProductionEntry_OnChangeddlPlanOrIds(element) {

    let ProcessMaster_Code = 0;
    if (element.id === 'ddlPlanNo') {
        let ddlPlanNo = document.getElementById("ddlPlanNo");

        ProcessMaster_Code = ddlPlanNo.options[ddlPlanNo.selectedIndex].attributes["ProcessMaster_Code"].value;

    } else {
        let ddlIdNo = document.getElementById("ddlIdNo");

        ProcessMaster_Code = ddlIdNo.options[ddlIdNo.selectedIndex].attributes["ProcessMaster_Code"].value;
    }

    $('#ddlProcess').val(ProcessMaster_Code);
    $('#ddlProcess').select2({
        width: '-webkit-fill-available'
    });

    SlittingProductionEntry_OnChangeddlProcess('IdOrPlan');

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

function SlittingProductionEntry_OnClick_NewSize(Row) {
    G_Row = Row;
    let processMaster_Code = $('#ddlProcess').val();
    let UpdateRow = $(Row).closest("tr")[0];

    let HideColObj = JSON.parse(UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
    InitSizeControl(HideColObj.ItemMaster_Code, HideColObj.ItemSizeMaster_Code, "SlittingProductionEntry_SizeCallBack", processMaster_Code)

}
function SlittingProductionEntry_OnChange_ddlItemReceived(Row) {
    let UpdateRow = $(Row).closest("tr")[0];
    let HideColObj = JSON.parse(UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
    let ddlItemReceived = document.getElementById('ItemReceived_' + HideColObj.SNo);
    let ItemName = ddlItemReceived.options[ddlItemReceived.selectedIndex].text;
    let byproduct = ddlItemReceived.options[ddlItemReceived.selectedIndex].attributes["byproduct"].value;
    let OldItemMaster_Code = HideColObj.ItemMaster_Code; 
    HideColObj.ItemName = ItemName;
    HideColObj.ByProduct = byproduct;
    HideColObj.ItemMaster_Code = $('#ItemReceived_' + HideColObj.SNo).val();

    if (byproduct==='S') {
        HideColObj.ItemSizeMaster_Code = 0;
        HideColObj.SizeDesp = '';
        UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML = JSON.stringify(HideColObj);
        UpdateRow.cells[indxSizeDespCol_tbSlittingReceivedDetails].innerHTML = '';
        return;
    }
    //UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML = JSON.stringify(HideColObj);

    SizeControlService.CreateItemSize(HideColObj.ItemMaster_Code, '0', OldItemMaster_Code).then(function (response) {
        if (response.length > 0) {
            HideColObj.ItemSizeMaster_Code = response[0].Code;
            HideColObj.SizeDesp = response[0].SizeDesp;
            UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML = JSON.stringify(HideColObj);
            UpdateRow.cells[indxSizeDespCol_tbSlittingReceivedDetails].innerHTML = `${response[0].SizeDesp} &nbsp;&nbsp;<a class="btn btn-secondary icon-height" onclick="SlittingProductionEntry_OnClick_NewSize(this)"><i class="fa fa-plus"></i></a>`;

        }
    })

}

function InitSizeControl(itemMaster_Code, itemSizeMaster_Code, callBackFunctionName_btnDone, processMaster_Code) {
    let url = baseUrl + '/CustomControl/SizeControl';

    $('#DivSizeControlmodal').load(url, { ItemMaster_Code: itemMaster_Code, ItemSizeMaster_Code: itemSizeMaster_Code, CallBackFunctionName_btnDone: callBackFunctionName_btnDone, RowNo: 0, ProcessMaster_Code: processMaster_Code });

}

function InitBrakDownControl( entryDate,  processMaster_Code,  machineMaster_Code,  shiftMaster_Code,  godownMaster_Code) {
    let url = baseUrl + '/CustomControl/BreakDownControl';

    $('#DivBrakDownStartControlModal').load(url, { EntryDate: entryDate, ProcessMaster_Code: processMaster_Code, MachineMaster_Code: machineMaster_Code, ShiftMaster_Code: shiftMaster_Code, GodownMaster_Code: godownMaster_Code });

}

function SlittingProductionEntry_SizeCallBack() {
    //alert(SizeControl_NewSizeMaster_Code + 'SizeDesp:' + SizeControl_NewSizeDesp);

    let RowNo = G_Row;
    let UpdateRow = $(RowNo).closest("tr")[0];

    let HideColObj = JSON.parse(UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
    
    HideColObj.ItemSizeMaster_Code = SizeControl_NewSizeMaster_Code;
    HideColObj.SizeDesp = SizeControl_NewSizeDesp;

    UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML = JSON.stringify(HideColObj);
    UpdateRow.cells[indxSizeDespCol_tbSlittingReceivedDetails].innerHTML = `${SizeControl_NewSizeDesp} &nbsp;&nbsp;<a class="btn btn-secondary icon-height" onclick="SlittingProductionEntry_OnClick_NewSize(this)"><i class="fa fa-plus"></i></a>`;

}

function SlittingProductionEntry_AddReceivedItem(row) {
    

    let tbReceivedItems = document.getElementById("tbSlittingReceivedDetails");
    let RowCount = tbReceivedItems.rows.length;


    //typeof row === "object" Call By Split PC Btn else callBy add Btn

    let UpdateRow = typeof row === "object" ? $(row).closest("tr")[0] : tbReceivedItems.rows[1];
    let HideColObj = JSON.parse(UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());

    //let rowCopyIndex = typeof row === "object" ? HideColObj.SNo : 1;
    let noPC = typeof row === "object" ? HideColObj.NoofSlits : 2;


    for (let i = 0; i < (noPC - 1); i++) {

        if (RowCount > 1) {

            let newRow = tbReceivedItems.insertRow(RowCount);//.replaceWith(UpdateRow);

            UpdateRow.cells.forEach((cell) => {
                let Cell = newRow.insertCell()
                
                Cell.innerHTML = cell.innerHTML;
                Cell.outerHTML = cell.outerHTML;
            });

            newRow.cells[indxSnoCol_tbSlittingReceivedDetails].innerHTML = RowCount;
            newRow.cells[indxItemNameCol_tbSlittingReceivedDetails].innerHTML = `<select id="ItemReceived_${RowCount}" class="form-control form-control-sm box_border" onchange="SlittingProductionEntry_OnChange_ddlItemReceived(this)">${G_ddlItemReceivedOption}</select>`;
            newRow.cells[indxPCsCol_tbSlittingReceivedDetails].innerHTML = '1'
            newRow.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value = 0;

            let newHideColObj = JSON.parse(newRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
            newHideColObj.NoofSlits = 1;
            newHideColObj.SNo = RowCount;
            $('#ItemReceived_' + RowCount).val(newHideColObj.ItemMaster_Code);
            $('#ItemReceived_' + RowCount).select2({
                width: '-webkit-fill-available'
            });
            newRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML = JSON.stringify(newHideColObj);
            
          
            RowCount++;
        }


    }

    if (typeof row === "object") {
        UpdateRow.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value = 0;
        UpdateRow.cells[indxPCsCol_tbSlittingReceivedDetails].innerHTML = '1'
        HideColObj.NoofSlits = 1;
        UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML = JSON.stringify(HideColObj);
    }
}
function SlittingProductionEntry_AllCheckSelection(masterCheckbox) {
    const checkboxes = document.querySelectorAll('#tbPrintID input[type="checkbox"]:not(#checkAllPrint)');
    checkboxes.forEach((checkbox) => {
        checkbox.checked = masterCheckbox.checked;
    });
}
function SlittingProductionEntry_OnChangeddlParantID() {
    let ParantID = $('#ddlParantID').val();
    SlittingProductionEntryService.GetChildIDsByParantIDToPrintID('GetChildIDsByParantIDToPrintID', ParantID).then(function (response) {
        const stringFilterColumn = [];
        const numericFilterColumn = [];
        const dateFilterColumn = [];
        const button = false;
        const stringDoubleFilterColumn = [];
        const showButtons = [];
        const hiddenColumns = [];
        const columnAlignment = {};
        response = response.map(item => {
            return {
                ...item,

                'Print <input type="checkbox" id="checkAllPrint" onchange="SlittingProductionEntry_AllCheckSelection(this)" checked>': `<input type="checkbox" id="checkPrint" onchange="toggleSelection(this, this.checked)" checked>`,
            };
        })

        BizsolCustomFilterGrid.CreateDataTable("table-header-tbPrintID", "table-body-tbPrintID", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
    });
}

function SlittingProductionEntry_CreatNewEntry() {
    let GodownMaster_Code = 0;
    let ddlProcess = document.getElementById("ddlProcess");
   
    let ProcessMaster_Code = $('#ddlProcess').val();
    let ProcessName = ddlProcess.options[ddlProcess.selectedIndex].text
    let MachineMaster_Code = $('#ddlMachineNo').val();
    let ScrapItemMaster_Code = $('#ddlScrapItem').val();
    let ScrapWeight = $('#txtScrapWeight').val();

    let StartTime = $('#txtStartTime').val();
    let EndTime = $('#txtEndTime').val();
    let Speed = $('#txtSpeed').val();

    let scrapWeight = parseFloat(ScrapWeight);

    let ReceivedDetailsArry = [];

    ReceivedDetailsArry = $('#tbSlittingReceivedDetailsBody')[0].rows;


    //if (IsBreakDownRunning()) {
    //    toastr.error({ html: 'Cannot not save Entry BreakDown Is Running', classes: 'rounded' });
    //    return false;
    //}

    if (typeof G_SlittingPlanMaster_Code === 'undefined' || G_SlittingPlanMaster_Code === '' || G_SlittingPlanMaster_Code === null || G_SlittingPlanMaster_Code === 0) {
        toastr.error('Invalid Plan No Or IdentificationNo please Check!');
        return false;
    }

    if (isNaN(scrapWeight)) {
        scrapWeight = 0;
    }
    if (ProcessMaster_Code === "0" ||ProcessMaster_Code === 0 || typeof ProcessMaster_Code === 'undefined' || ProcessMaster_Code === '' || ProcessMaster_Code === null) {
        toastr.error('Invalid Process Name please Check!');
         return false;
    }  
    else if (MachineMaster_Code === "0" || MachineMaster_Code === 0 || typeof MachineMaster_Code === 'undefined' || MachineMaster_Code === '' || MachineMaster_Code === null) {
        toastr.error('Invalid Machine No please Check!')
        return false;
    }
    else if (scrapWeight > 0 && (typeof ScrapItemMaster_Code === 'undefined' || ScrapItemMaster_Code === '0' || ScrapItemMaster_Code === null)) {
        toastr.error('Invalid ScrapItem please Check!')
        return false;
    }
    else if (ProcessName.toUpperCase().includes("CR GALVANIZED") && ShowTimeInProduction == "Y") {

        if (typeof StartTime === 'undefined' || StartTime === '' || StartTime === null) {
            
            toastr.error('Invalid StartTime please Check!');
            
            return false;
        }
        else if (typeof EndTime === 'undefined' || EndTime === '' || EndTime === null) {
            
            toastr.error('Invalid EndTime please Check!');
            
            return false;
        }
        else if (typeof Speed === 'undefined' || Speed === '' || Speed === null) {
            
            toastr.error('Invalid Speed please Check!');
            
            return false;
        }


    }
    else {
        let tableValid = true;
        let tbItemReceivedDetails = document.getElementById("tbSlittingReceivedDetails");
        let GManualID = "";
        for (let i = 1; i < tbItemReceivedDetails.rows.length; i++) {
            let UpdateRow = tbItemReceivedDetails.rows[i];

                let HideColObj = JSON.parse(UpdateRow.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
                let ItemSizeMaster_Code = HideColObj.ItemSizeMaster_Code;
                let ItemMaster_Code = HideColObj.ItemMaster_Code;
                let ByProduct = HideColObj.ByProduct
                if (ByProduct === 'N') {
                    if (typeof ItemSizeMaster_Code === 'undefined' || ItemSizeMaster_Code === '' || ItemSizeMaster_Code === null || ItemSizeMaster_Code === '0') {
                       
                        toastr.error('Invalid Size in row No. ' + i);
                        tableValid = false;
                        break;
                    }
                    if (typeof ItemMaster_Code === 'undefined' || ItemMaster_Code === '' || ItemMaster_Code === null || ItemMaster_Code === '0') {
                       
                        toastr.error('Invalid Item in row No. ' + i);
                        tableValid = false;
                        break;
                    }

                    if (ManualIDApplicable_FixedParameterPurchase === 'Y' && ManualIDApplicable_Process === 'Y') {
                        let ManualID = UpdateRow.cells[indxManualIDCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value;
                        let NoOfSlits = HideColObj.NoofSlits
                        let Weight = UpdateRow.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value;

                        if (typeof ManualID === 'undefined' || ManualID === '' || ManualID === null || ManualID === '0') {
                          
                            toastr.error('ManualID Can not Be Blank Or Zero in RowNo' + i);
                            tableValid = false;
                            break;
                        }
                        if (typeof ManualID === 'undefined' || ManualID === '' || ManualID === null || ManualID === '0') {
                         
                            toastr.error('ManualID Can not Be Blank Or Zero in RowNo' + i);
                            tableValid = false;
                            break;
                        }
                        if (typeof NoOfSlits === 'undefined' || NoOfSlits === '' || NoOfSlits === null || NoOfSlits === '0') {
                         
                            toastr.error('NoOfSlits Can not Be Blank Or Zero in RowNo' + i);
                            tableValid = false;
                            break;
                        }
                        if (typeof Weight === 'undefined' || Weight === '' || Weight === null || Weight === '0') {
                           
                            toastr.error('Weight Can not Be Blank Or Zero in RowNo' + i);
                            tableValid = false;
                            break;
                        }
                        if (i == 1) {
                            GManualID = ManualID;
                        } else {
                            if (GManualID === ManualID) {
                                toastr.error('Duplicate ManualID No Not Allowed' + i);
                                tableValid = false;
                                break;
                            }
                        }

                        //if (!ValidateManualID($('#txtProcess').val(), $('#txtProDate').val(), $('#txtIdentificationNo').val(), ItemMaster_Code, ItemSizeMaster_Code, NoOfSlits, Weight, ManualID)) {
                        //    toastr.error('ManualID No Not Validate in RowNo' + i);
                        //    tableValid = false;
                        //    break;
                        //    // return false;
                        //}

                    }
                }

        }

        if (!tableValid)
            return false;

        if (!isNaN($('#txtIssuePC').val()) && parseInt($('#txtIssuePC').val()) > 1) {
            let PC = parseInt($('#txtIssuePC').val());
            let TotalPC = 0;

            $.each(ReceivedDetailsArry, function (index, value) {
                let HideColObj = JSON.parse(value.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
                if (isNaN(parseInt(HideColObj.NoofSlits))) {
                    TotalPC += 0;
                }
                else {
                    TotalPC += parseInt(HideColObj.NoofSlits);
                }

            });

            if (TotalPC < PC) {
                toastr.error('Please Check ! Total No PC should not be Equal to PC');

                return false;
            }
            if (TotalPC > PC) {
                toastr.error('Please Check ! Total No PC should not be Equal to PC');

                return false;
            }

        }



        let actualWeight = parseFloat($('#txtActualWeight').val()).toFixed(3);

        if (AddStdZincPerMT > 0 && ShowZincWeight === "Y") {
            actualWeight = Number(actualWeight) + Number($('#txtActualZincWeight').val());
            actualWeight = parseFloat(actualWeight).toFixed(3);
        }
       


        let totalItemWeight = 0;
        $.each(ReceivedDetailsArry, function (index, value) {
            if (isNaN(parseFloat(value.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value))) {
                totalItemWeight += 0;
            }
            else {
                totalItemWeight += parseFloat(value.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value);
            }

        });
        totalItemWeight += scrapWeight;

        totalItemWeight = parseFloat(totalItemWeight).toFixed(3);


        if (scrapWeight < 0) {
            toastr.error('Please Check ! Scrap Weight should not be negative (-)')
            return false;
        }
        else if (scrapWeight > actualWeight) {
            toastr.error('Please Check ! Scrap Weight should be less than equal to actual Weight')
            return false;
        }
        else if (totalItemWeight != actualWeight) {
            toastr.error("Please Check ! Total Receive weight (" + totalItemWeight + ") should be equal to actual weight (" + actualWeight + ")");
            return false;
        }


    }

    

    if (AllowWeightOnlyByWeighment === 'Y' && IsGetWeightByScale == false) {
        toastr.error('Please take weight by Scale!');
        return false;
    }

    let CheckStockPayLoad = {
        EntryType: "O",
        EntryDate: $('#txtSlittingDate').val(),//12-feb-24// Production Date
        ItemMaster_Code: G_IssueItemMaster_Code,//need
        ItemSizeMaster_Code: G_IssueItemSizeMaster_Code,//need
        GodownMaster_Code: G_IssueGodownMaster_Code,//need
        PlanBatchNo: "",
        ISNoDesp: "",
        BundleNo: "",
        OldQtyPC: 0,
        OldQtyMT: 0,
        OldQtyMTRS: 0,
        NewQtyPC: 1,
        NewQtyMT: G_IssueWeight,//need
        NewQtyMTRS: 0,
        BatchNo: "",
        IdentificationNo: G_issueIdentificationNo,//need
        IdentificationNoMaster_Code: 0
    };

    let SlittingEntryDataPayload = [];

    let rowno = 0;
    let validateProcessStartEndTime = true;
    $.each(ReceivedDetailsArry, function (index, value) {
        let HideColObj = JSON.parse(value.cells[indxHiddenCol_tbSlittingReceivedDetails].innerHTML.trim());
        let Weight = parseFloat(value.cells[indxWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value);
        let ManualID = parseInt(value.cells[indxManualIDCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value);
        let InTime = value.cells[indxInTimeCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value;
        let OutTime = value.cells[indxOutTimeCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value;
        let GrossWeight = parseFloat(value.cells[indxGrossWeightCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value);
        let Remarks = value.cells[indxRemarksCol_tbSlittingReceivedDetails].getElementsByTagName('input')[0].value;
        rowno++;
        if (G_ShowProcessStartEndTime == "Y") {

            if (typeof InTime === 'undefined' || InTime === '' || InTime === null || InTime === '0') {

                toastr.error('In Time Can not Be Blank RowNo ' + rowno);
                validateProcessStartEndTime = false;
                return;
            }

            if (typeof OutTime === 'undefined' || OutTime === '' || OutTime === null || OutTime === '0') {

                toastr.error('Out Time Can not Be Blank RowNo ' + rowno);
                validateProcessStartEndTime = false;
                return;
            }

        }

        if (G_ShowGrossWeight == "Y") {

            if (GrossWeight > 0 && GrossWeight < Weight) {

                toastr.error('Gross Weight should be greater than equal to ' + Weight+' in RowNo ' + rowno);
                validateProcessStartEndTime = false;
                return;
            }

        }
        

        SlittingEntryDataPayload.push({
            Sno: HideColObj.SNo,
            ItemMaster_Code: HideColObj.ItemMaster_Code,
            itemSizeMaster_Code: HideColObj.ItemSizeMaster_Code,
            Weight: Weight,
            NoOfPass: HideColObj.NoOfPass,
            NoofSlits: HideColObj.NoofSlits,
            ManualIDNo: ManualID,
            InTime: InTime,
            OutTime: OutTime,
            Speed: "",
            GrossWeight: GrossWeight,
            Remarks: Remarks,
            SlittingPlanMaster_Code: G_SlittingPlanMaster_Code,
            ShiftMaster_Code: $("#ddlShift").val(),
            FormType: G_FormType,
            txtActualWeight: $("#txtActualWeight").val(),
            txtscrapWT: $("#txtScrapWeight").val(),
            txtProDate: $("#txtSlittingDate").val(),
            ScrapItemMaster_Code: $("#ddlScrapItem").val(),
            txtActualZincWeight: $("#txtActualZincWeight").val(),
            MachineMaster_Code: $("#ddlMachineNo").val(),
            IssuePC: $("#txtIssuePC").val()
        });

    });

    if (G_ShowProcessStartEndTime == "Y" && validateProcessStartEndTime == false) {
        return;
    }
    if (G_ShowGrossWeight == "Y" && validateProcessStartEndTime == false) {
        return;
    }

    Showloader();
    BreakDownService.IsBreakDownRunning(ProcessMaster_Code, MachineMaster_Code, GodownMaster_Code).then(function (breakDownrespone) {

        if (breakDownrespone.Status === 'N') {
            SlittingProductionEntryService.CheckEntryAllowed(G_issueIdentificationNo).then(function (response) {
                if (response.Status === 'Y') {
                    SlittingProductionEntryService.CheckStockValidate(JSON.stringify(CheckStockPayLoad)).then(function (response1) {
                        if (response1.Status === 'Y') {

                            SlittingProductionEntryService.SaveSlittingEntry(JSON.stringify(SlittingEntryDataPayload)).then(function (response2) {
                                if (response2.Status === 'Y') {
                                    HideLoader();
                                    toastr.success(response2.Msg);
                                    SlittingProductionEntry_ShowPlanGrid()
                                    ClrFrm();
                                    Bind_ddlIdNo('dllAllPlansOrId', G_UserMaster_Code);
                                    ChangeMode('');

                                } else {
                                    toastr.error(response2.Msg);
                                    HideLoader();
                                }

                            });

                        } else {
                            toastr.error(response1.Msg);
                            HideLoader();
                        }

                    });

                } else {
                    toastr.error(response.Msg);
                    HideLoader();
                }


            });
        } else {
            toastr.error('Can not Save Entry! ' + breakDownrespone.Msg + ' on selected Machine No..')
            HideLoader();
        }

    })
    
    


   
}

function ClrFrm() {
    G_SlittingPlanMaster_Code = 0;
    G_ShowProcessStartEndTime = "N";
    G_ShowGrossWeight = "N";

    $('#txtScrapWeight').val('0');
    $('#txtSlittingDate').val(new Date().toISOString().slice(0, 10));
  
    
    $('#ddlScrapItem').val('0');
    
    $('#ddlMachineNo').val('0');

    $('#ddlProcess').val('0');
    $('#ddlPlanNo').val('0');

    $('#ddlScrapItem').select2({
        width: '-webkit-fill-available'
    });
    $('#ddlIdNo').select2({
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
    

    $('#ddlProcess').removeAttr('disabled')
    $('#ddlPlanNo').removeAttr('disabled')
    $('#ddlIdNo').removeAttr('disabled')

    $('#tbPackingListTransaction tr').empty();
    $('#paginator-tbPackingListTransaction').empty();
    Bind_IssueAndReceivedCoilDetail(G_SlittingPlanMaster_Code);
}

function LoadFrm() {
    

    if (PackingListFGFixedParaMeters.length > 0 && PackingListFGFixedParaMeters.find(x => x.PeramaterName === 'ManualIDApplicable').PeramaterValue === 'Y') {
        ManualIDApplicable_FixedParameterPurchase = "Y";
    }
    
     
    
   
}


$('#txtTotalReceivedWeight').on('change', function () {
    CalSlitWeightByReceivedWeight();
});

$('#btnPrint').on('click', function () {
    Showloader()
    SlittingProductionEntryService.GetSlittingProductionEntryDDl('GetPrintIDs', 0).then(function (response) {

        BindSelectList($('#ddlParantID')[0], response.map((item) => ({ Code: item.ParantID, Desp: item.ParantID })))
        $('#ddlParantID').select2({
            width: '-webkit-fill-available',
            dropdownParent: $('#PintIDModal'),
        });

        
        HideLoader();
        
        //$('#ddlParantID').select2({
        //    data: response.map(item => ({ id: item.ParantID, text: item.ParantID })),

        //    dataAdapter: CustomData,
        //    resultsAdapter: ResultsAdapter,
        //    dropdownParent: $('#PintIDModal'),
        //    width: '-webkit-fill-available',
        //});

        $('#tbPrintID tr').empty();
        $('#paginator-tbPrintID').empty();
        
        $("#PintIDModal").modal({
            backdrop: 'static',
        });
        $('#PintIDModal').modal('show');
    });

});

$('#btnModalPrint').on('click', function () {
    //InitSelectPrinterToPrintControl("01-18I-0002A#01-18I-0002B#");

    let PrintId = "";
    let table = document.getElementById("tbPrintID");
    for (let i = 1; i < table.rows.length; i++) {
        
            let UpdateRow = table.rows[i];
            //let check = UpdateRow.cells[0].innerHTML;
            let check = UpdateRow.cells[1].getElementsByTagName('input')[0]
            if (check.checked) {
                PrintId += UpdateRow.cells[0].innerHTML + "#";
            }

        
    }
    if (PrintId == "") {
       
        toastr.error('Plz Select at least one Id!');
        return;
    }
    InitSelectPrinterToPrintControl(PrintId);

    //SlittingProductionEntryService.PrintIdentificationNos(PrintId, '0').then(function (response) {
    //    let url = response.Url;
    //    const a = document.createElement('a');
    //    a.style.display = 'none';
    //    a.target = '_blank';
    //    a.href = url;
    //    document.body.appendChild(a);
    //    a.click();
    //});
});

$('#btnBrkDownStart').on('click', function () {
    let entryDate = $('#txtSlittingDate').val(); 
    let processMaster_Code = $('#ddlProcess').val();
    let machineMaster_Code = $('#ddlMachineNo').val();
    let shiftMaster_Code = $('#ddlShift').val();
    let godownMaster_Code = 0;
    if (entryDate == "") {
        toastr.error('Invalid Entry Date please Check!');
        return false
    }
    if (processMaster_Code === "0" ||processMaster_Code === 0 || typeof processMaster_Code === 'undefined' || processMaster_Code === '' || processMaster_Code === null) {
        toastr.error('Invalid Process please Check!');
        return false
    }
    if (machineMaster_Code === "0" ||machineMaster_Code === 0 || typeof machineMaster_Code === 'undefined' || machineMaster_Code === '' || machineMaster_Code === null) {
        toastr.error('Invalid Machine No please Check!');
        return false
    }
    if (shiftMaster_Code === "0"||shiftMaster_Code === 0 || typeof shiftMaster_Code === 'undefined' || shiftMaster_Code === '' || shiftMaster_Code === null) {
        toastr.error('Invalid shift please Check!');
        return false
    }

    InitBrakDownControl(entryDate, processMaster_Code, machineMaster_Code, shiftMaster_Code, godownMaster_Code);
});

// our single focus event handler


$("input").focus(function () {

    // let's check if the previous focus has already been defined
    if (typeof prevFocus !== "undefined") {

        // we do something with the previously focused element
        $("#prev").html(prevFocus.val());
    }
    prevFocus = $(this);
});


function InitSelectPrinterToPrintControl(printText) {
    let url = baseUrl + '/CustomControl/SelectPrinterToPrintControl';

    $('#DivSelectPrinterToPrintControlModal').load(url, { PrintText: encodeURIComponent(printText) });

}
function SlittingProductionEntry_GetSCaleWeight() {
    

    if (G_machineIP === "") {
        toastr.error('Can not calculate Scale Weight! MachineIp not available for this process');
        return;
    }
    Showloader();
    SlittingProductionEntryService.GetSCaleWeight(G_machineIP).then(function (resp) {
        if (resp.Status === 'Y') {
            HideLoader();
           
            if (resp.Msg.includes("System.Net.Sockets.SocketException") == true) {
                toastr.error('Weight Not Available on Scale! Please Put Weight on Scale!');
                return;
            }

            toastr.success(resp.Msg);
                if (typeof prevFocus !== "undefined") {
                    var id = prevFocus[0].id;
                    if (id === 'txtScrapWeight' || id.includes("txtItemWeight")) {
                        var Data = resp.Msg.replace(/\\n/g, '').replace(/\\r/g, '').replace(/"/g, '')

                        Data = parseInt(Data) / 1000


                        document.getElementById(id).value = parseFloat(Data).toFixed(3);
                       IsGetWeightByScale = true;
                        if (id === 'txtScrapWeight') {
                            SlittingProductionEntry_CalScrapPerWeight();
                        } else if (id.includes("txtItemWeight")) {
                            SlittingProductionEntry_CalScrapWeight();
                        }


                    }
                }
            

        } else {
            toastr.error(resp.Msg);
            HideLoader();
        }

    });

    
}
function SlittingProductionEntry_Print(IdentificationNo) {
    Showloader
    SlittingProductionEntryService.GetChildIDsByParantIDToPrintID('GetChildIDsByParantIDToPrintID', IdentificationNo).then(function (response) {
        HideLoader()

        BindSelectList($('#ddlParantID')[0], [{ Code: IdentificationNo, Desp: IdentificationNo }]);
        $('#ddlParantID').val(IdentificationNo);
        $('#ddlParantID').select2({
            width: '-webkit-fill-available',
            dropdownParent: $('#PintIDModal'),
        });

        const stringFilterColumn = [];
        const numericFilterColumn = [];
        const dateFilterColumn = [];
        const button = false;
        const stringDoubleFilterColumn = [];
        const showButtons = [];
        const hiddenColumns = [];
        const columnAlignment = {};
        response = response.map(item => {
            return {
                ...item,

                'Print <input type="checkbox" id="checkAllPrint" onchange="SlittingProductionEntry_AllCheckSelection(this)" checked>': `<input type="checkbox" id="checkPrint" onchange="toggleSelection(this, this.checked)" checked>`,
            };
        })

        BizsolCustomFilterGrid.CreateDataTable("table-header-tbPrintID", "table-body-tbPrintID", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);


        $("#PintIDModal").modal({
            backdrop: 'static',
        });
        $('#PintIDModal').modal('show');
    });

    

}
SlittingProductionEntry_ShowPlanGrid();
getPackingListFGFixedParaMeters();
Bind_AllDLL();
Bind_ddlIdNo('dllAllPlansOrId', G_UserMaster_Code);
//LoadFrm();

//var CustomData, ResultsAdapter; 

//var items = Array.from(Array(99992)).map(function (_, index) {
//    return { id: index, text: "item - " + index };
//});

//$(document).ready(function () {
//    $.fn.select2.amd.require(
//        [
//            "select2/data/array",
//            "select2/results",
//            "select2/dropdown/infiniteScroll",
//            "select2/utils"
//        ],
//        function (ArrayData, ResultsList, InfiniteScroll, Utils) {
//            function MyCustomData($element, options) {
//                MyCustomData.__super__.constructor.call(this, $element, options);
//            }
//            Utils.Extend(MyCustomData, ArrayData);

//            MyCustomData.prototype.query = function (params, callback) {
//                var pageSize = 20;
//                var page = params.page || 1;
//                var results = [];
//                var data = this.options.options.data || [];
//                var term = (params.term || "").trim().toUpperCase();

//                if (term) {
//                    results = data.filter(function (item) {
//                        return item.text.toUpperCase().indexOf(term) >= 0;
//                    });
//                } else {
//                    results = data;
//                }

//                callback({
//                    results: results.slice((page - 1) * pageSize, page * pageSize),
//                    pagination: {
//                        more: results.length >= page * pageSize,
//                    },
//                });
//            };

//            // Assign to global
//            CustomData = MyCustomData;
//            ResultsAdapter = Utils.Decorate(ResultsList, InfiniteScroll);

           
//        }
//    );
//});


//$('#ddltest').select2({
//    ajax: {
//        url: "https://web.bizsol.in/erp25api/api/SlittingEntry/GetSlittingProductionEntryDDl?ddlType=GetPrintIDs&Code=0", // Replace with your API endpoint
//        dataType: 'json',
//        delay: 250,
//        data: function (params) {
//            return {
//                searchTerm: params.term, // Search term from Select2 input
//                page: params.page || 1 // Pagination
//            };
//        },
//        processResults: function (data, params) {
//            params.page = params.page || 1;

//            return {
//                results: data, // Results from your API
//                pagination: {
//                    more: (params.page * 30) < data.length//data.total_count // Assuming 30 items per page
//                }
//            };
//        },
//        cache: true
//    },
//    placeholder: 'Search for an item',
//    minimumInputLength: 2, // Start searching after 2 characters
//    templateResult: function (item) {
//        if (item.loading) {
//            return item.text;
//        }
//        // Customize how each item is displayed
//       // return `<div>${item.name} - ${item.description}</div>`;
//        return `${item.ParantID}`;
//    },
//    templateSelection: function (item) {
//        // Customize how the selected item is displayed
//        return item.name || item.text;
//    }
//});

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
window.SlittingProductionEntry_OnClick_NewSize = SlittingProductionEntry_OnClick_NewSize;
window.SlittingProductionEntry_OnChange_ddlItemReceived = SlittingProductionEntry_OnChange_ddlItemReceived;
window.SlittingProductionEntry_SizeCallBack = SlittingProductionEntry_SizeCallBack;
window.SlittingProductionEntry_AddReceivedItem = SlittingProductionEntry_AddReceivedItem;
window.SlittingProductionEntry_AllCheckSelection = SlittingProductionEntry_AllCheckSelection;
window.SlittingProductionEntry_OnChangeddlParantID = SlittingProductionEntry_OnChangeddlParantID;
window.SlittingProductionEntry_CreatNewEntry = SlittingProductionEntry_CreatNewEntry;
window.SlittingProductionEntry_GetSCaleWeight = SlittingProductionEntry_GetSCaleWeight;
window.SlittingProductionEntry_Print = SlittingProductionEntry_Print;


