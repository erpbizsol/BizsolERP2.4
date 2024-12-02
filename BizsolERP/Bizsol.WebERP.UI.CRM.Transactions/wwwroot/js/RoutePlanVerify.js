import { RoutePlanMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/RoutePlanService.js';

let MultiRoutePlanCodes = [];
$(document).ready(function () {
    $("#ERPHeading").text("Route Plan Verify");
    GetUserWiseRoutePlanDetails();
});
function GetUserWiseRoutePlanDetails() {
    RoutePlanMasterService.GetUserWiseRoutePlanDetails().then(function (response) {
      
        if (response && Array.isArray(response) && response.length > 0) {
            const stringFilterColumn = ["User Name", "Visit Type", "City Name", "State Name", "Description","Dealer Name","Status"];
            const numericFilterColumn = [];
            const dateFilterColumn = ["Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code", "VisitTypeMaster_Code", "DealerMaster_Code", "CityMaster_Code", "StateMaster_Code","UserMaster_Code"];
            const ColumnAlignment = {
                //"Total Amount": 'right',
                //"Total Order Qty": 'right',
                "Date": 'center',
                "Status": 'center',
                //"Closed": 'center',
            };
            const updatedResponse = response.map(item => ({
                ...item,
                Action: `<button class="btn btn-success btn-sm" title="Verify" onclick="Verify('${item.Code}')"><i class="fa fa-check-circle" aria-hidden="true"></i></button>
                <button class="btn btn-danger btn-sm" title="Reject" onclick="Reject('${item.Code}')"><i class="fa-regular fa-circle-xmark"></i></button>`
               
            }));
            BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
             MultiRoutePlanCodes = response.map(item => item.Code);
        } else {
            console.error("No valid data found:", response);
            alert("No data available.");
        }
    }).catch(error => {
        console.error("Error in fetching data:", error);
        alert("Failed to load data.");
    });
}
function Verify(Code) {
    RoutePlanMasterService.VerifyRoutePlan(Code).then(function (result) {
        toastr.success(result.Msg);
        GetUserWiseRoutePlanDetails();
    });
}
function Reject(Code) {
    $('#myModal').modal('show');
    $('#myModal').modal({
        backdrop: 'static',
        
    });
    $("#txtcode").val(Code);
}
function SaveModal() {
    var reason = $("#rejectReason").val();
    var code = $("#txtcode").val();
    RoutePlanMasterService.RejectRoutePlan(code, reason).then(function (response) {
       
        if (reason == "") {
            alert('Please enter a reason before proceeding.');
            toastr.error(response.Msg);
            return;
        }
        else {
            toastr.success(response.Msg);
            $('#myModal').modal('hide');
            $('#rejectReason').val('');
            GetUserWiseRoutePlanDetails();
        }
    });
}
function CloseModal() {
    $('#myModal').modal('hide');
}
function VerifyAll() {
    RoutePlanMasterService.VerifyAllRoutePlan(MultiRoutePlanCodes).then(function (res) {
        toastr.success(res.Msg);
        GetUserWiseRoutePlanDetails();
    });
}
function RejectAll() {
    $('#myAllDeleteModal').modal('show');
    $('#myAllDeleteModal').modal({
        backdrop: 'static',
    });
    
}
function SaveAllModal() {
    var reasonAll = $("#rejectAllReason").val();
    RoutePlanMasterService.RejectAllRoutePlan(MultiRoutePlanCodes, reasonAll).then(function (results) {
        if (reasonAll == "") {
            alert('Please enter a reason before proceeding.');
            toastr.error(results.Msg);
            return;
        }
        else {
            toastr.success(results.Msg);
            $('#myAllDeleteModal').modal('hide');
            $('#rejectAllReason').val('');
            GetUserWiseRoutePlanDetails();
        }
    });
}
function CloseAllModal() {
    $('#myAllDeleteModal').modal('hide');
}

window.GetUserWiseRoutePlanDetails = GetUserWiseRoutePlanDetails;
window.Verify = Verify;
window.Reject = Reject;
window.CloseModal = CloseModal;
window.SaveModal = SaveModal;
window.VerifyAll = VerifyAll;
window.RejectAll = RejectAll;
window.SaveAllModal = SaveAllModal;
window.CloseAllModal = CloseAllModal;
