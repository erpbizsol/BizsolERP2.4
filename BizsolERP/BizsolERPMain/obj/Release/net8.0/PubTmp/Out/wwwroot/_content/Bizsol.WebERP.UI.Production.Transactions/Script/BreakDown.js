import { BreakDownService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_BreakDownService.js';

let G_PVCProductionBreakDownDetails_Code = 0;
let G_PvcProductionMaster_Code = 0;
$(document).ready(function () {
    $("#ERPHeading").text("Break Down");
    StartOrEndSummary();
    
});

function setCurrentTime() {
    const currentTime = new Date();
    const hours = currentTime.getHours().toString().padStart(2, '0'); // Ensure 2-digit format
    const minutes = currentTime.getMinutes().toString().padStart(2, '0'); // Ensure 2-digit format
    const time = `${hours}:${minutes}`; // Format as HH:MM
    document.getElementById('txtTimer').value = time;
}

function StartOrEndSummary() {
    Showloader();
    BreakDownService.StartOrEndSummary().then(function (response) {
        if (response && response.length > 0) { 
            HideLoader();
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code","PvcProductionMaster_Code"];
            const columnAlignment = {};
            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-danger icon-height mb-1" title="End BreakDown" onclick="EndBreakDownOpen_Modal('${item.Code}','${item.PvcProductionMaster_Code}')"><i class="fa-solid fa-hourglass-end"></i></button>`;
                return {
                    ...item,
                    Action: buttonsHTML,
                };
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-tblBreakDownStartOrEnd", "table-body-tblBreakDownStartOrEnd", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
        } else {
            HideLoader();
            toastr.error('No Data Found');
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during BreakDown');
        });
}

function EndBreakDownOpen_Modal(PVCProductionBreakDownDetails_Code,productionCode) {
    $('#myModal').modal({
        backdrop: 'static',
    });
    $('#myModal').modal('show');
    setCurrentTime();

    $('#txtEnterCause').val('')
    $('#txtEnterActionPlan').val('')
    
     G_PVCProductionBreakDownDetails_Code = PVCProductionBreakDownDetails_Code;
     G_PvcProductionMaster_Code = productionCode;
}
function BreakDown_Save(mode = "Update") {
    let EndTimeBreakDown = $('#txtTimer').val();
    let EnterCause = $('#txtEnterCause').val();
    let EnterActionPlan = $('#txtEnterActionPlan').val();
    let BreakDownMode = mode;


    if (typeof EndTimeBreakDown === 'undefined' || EndTimeBreakDown === '' || EndTimeBreakDown === null) {

        toastr.error('End Time can not be Blank!');
       
        return false;
    }
    if (typeof EnterCause === 'undefined' || EnterCause === '' || EnterCause === null) {
        toastr.error('Cause can not be Blank!');
        return false;
    }

    if (typeof EnterActionPlan === 'undefined' || EnterActionPlan === '' || EnterActionPlan === null) {
        toastr.error('Action Plan can not be Blank!');
        return false;
    }

    if (typeof G_PVCProductionBreakDownDetails_Code === 'undefined' || G_PVCProductionBreakDownDetails_Code === '' || G_PVCProductionBreakDownDetails_Code === null || G_PVCProductionBreakDownDetails_Code === '0') {
        toastr.error('PVCProductionBreakDownDetailsCode can not be Blank!');
        return false;
    }

    if (typeof G_PvcProductionMaster_Code === 'undefined' || G_PvcProductionMaster_Code === '' || G_PvcProductionMaster_Code === null || G_PvcProductionMaster_Code === '0') {
        toastr.error('hfPvcProductionMaster_Code can not be Blank!');
        return false;
    }


    BreakDownService.EndBreakDown(G_PVCProductionBreakDownDetails_Code, G_PvcProductionMaster_Code, EndTimeBreakDown, EnterCause, EnterActionPlan, BreakDownMode).then(function (response) {
        if (response.Status === 'Y' && response.Msg.toLowerCase().includes("successfully") == true) {
            toastr.success(response.Msg);
            StartOrEndSummary();
            $('#myModal').modal('hide');

        } else if (response.Status === 'Y' && response.Msg.toLowerCase().includes("shift") == true) {
            if (confirm(response.Msg) == true) {
                BreakDown_Save('endbrkdownnextshift');

            }
        }
        else if (response.Status === 'N') {
            toastr.error(response.Msg);
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during EndBreakDown');
        });
}



window.EndBreakDownOpen_Modal = EndBreakDownOpen_Modal;
window.BreakDown_Save = BreakDown_Save;

