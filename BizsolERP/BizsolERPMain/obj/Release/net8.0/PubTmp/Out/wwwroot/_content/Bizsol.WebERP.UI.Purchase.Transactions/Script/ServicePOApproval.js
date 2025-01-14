import { ServicePOApprovalService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/ServicePOApprovalService.js';

$(document).ready(function () {
    $("#ERPHeading").text("Service PO Approval");
    unApprovedServicePO();

});
function unApprovedServicePO() {
    ServicePOApprovalService.GetUnApprovedServicePO().then(function (response) {
        if (response && response.length > 0) {
            const stringFilterColumn = ["Party", "Description", "Payment Terms"];
            const numericFilterColumn = ["Code", "PO No.", "Amount"];
            const dateFilterColumn = ["PO Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                "PO Amount": 'right',
                "PO Date": 'center',
                "PO No": 'center',
                "Code": 'center',
            };
            const updatedResponse = response.map(item => ({
                ...item, Action: `<button class="btn btn-success icon-height mb-1" title="Approve" onclick="Approval('${item.Code}')"><i class="fa fa-check-circle" aria-hidden="true"></i></button>
        <button class="btn btn-info icon-height mb-1" title="View Details" onclick="ViewData('${item.Code}')"><i class="fa fa-folder-open" aria-hidden="true"></i></button>`
            }));
            BizsolCustomFilterGrid.CreateDataTable("table-header-ServicePOApproval", "table-body-ServicePOApproval", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
        } else {
            toastr.error("No valid data found:", response);
        }
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
    });
}

function Approval(Code) {
    ServicePOApprovalService.ServicePOApproved(Code).then(function (approve) {
        if (approve.Status === "Y") {
            unApprovedServicePO();
            GetWebNotificationList();
            toastr.success(approve.Msg);
        }
        else {
            toastr.error(approve.Msg);
            
        }
    });
}

function ViewData(Code) {
    ServicePOApprovalService.GetServicePODetail(Code).then(function (data) {
        if (data && data.length > 0) {
            $('#myModal').modal({
                backdrop: 'static',
            });
            $('#myModal').modal('show');
            const stringFilterColumn = ["Description"];
            const numericFilterColumn = ["Qty", "Rate", "Amount"];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                "PO Amount": 'right',
                "PO Date": 'center',
                "PO No": 'center',
                "Code": 'center',
            };
            BizsolCustomFilterGrid.CreateDataTable("table-header-PoapprovalModalTable", "table-body-PoapprovalModalTable", data, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
        } else {
            toastr.error("No valid data found:", data);
        }
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
    });
}
function CloseModal(Code) {
    $('#myModal').modal('hide');
}

window.ViewData = ViewData;
window.CloseModal = CloseModal;
window.Approval = Approval;