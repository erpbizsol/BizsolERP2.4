import { BreakDownService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BreakDownService.js';

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
                let buttonsHTML = `<button class="btn btn-danger icon-height mb-1" title="End BreakDown" onclick="EndBreakDownOpen_Modal('${item.PvcProductionMaster_Code}')"><i class="fa-solid fa-hourglass-end"></i></button>`;
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

function EndBreakDownOpen_Modal(productionCode) {
    $('#myModal').modal({
        backdrop: 'static',
    });
    $('#myModal').modal('show');
    setCurrentTime();
}
function BreakDown_Save() {
    let EndTimeBreakDown = $('#txtTimer').val();
    let EnterCause = $('#txtEnterCause').val();
    let EnterActionPlan = $('#txtEnterActionPlan').val();
    BreakDownService.EndBreakDown(EndTimeBreakDown, EnterCause, EnterActionPlan).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            BreakDownModal_Close();
        }
    })
        .catch(function (error) {
            toastr.error(error.Msg || 'Error during EndBreakDown');
        });
}
function BreakDownModal_Close() {
    $('#myModal').modal('hide');
}
window.EndBreakDownOpen_Modal = EndBreakDownOpen_Modal;
window.BreakDown_Save = BreakDown_Save;
window.BreakDownModal_Close = BreakDownModal_Close;
