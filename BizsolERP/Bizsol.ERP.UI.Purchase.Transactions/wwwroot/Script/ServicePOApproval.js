import { ServicePOApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ServicePOApprovalService.js';

$(document).ready(function () {
    var urlParams = getUrlVars();
    var menuValue = decodeURI(urlParams['menu']);
    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    }
    else {
        $("#ERPHeading").text("Service PO Approval");
    }
    unApprovedServicePO();

});
function unApprovedServicePO() {
    ServicePOApprovalService.GetUnApprovedServicePO().then(function (response) {
        if (response && response.length > 0) {
            const stringFilterColumn = ["Party"];
            const numericFilterColumn = ["PO No."];
            const dateFilterColumn = ["PO Date"];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = {
                "Amount": 'right',
                "PO Date": 'center',
                "PO No.": 'center',
                "Code": 'center',
            };
            const updatedResponse = response.map(item => ({
                ...item, Action: `<button class="btn btn-success icon-height mb-1" title="Approve" onclick="Approval('${item.Code}')"><i class="fa fa-check-circle" aria-hidden="true"></i></button>
        <button class="btn btn-primary icon-height mb-1" title="View Details" onclick="ViewData('${item.Code}')"><i class="fa fa-folder-open" aria-hidden="true"></i></button>`
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
            toastr.success(approve.Msg);
            unApprovedServicePO();
            GetWebNotificationList();
        }
        else {
            toastr.error(approve.Msg);
        }
    }).catch(function (error) {
        toastr.error("Error in Service PO Approval: ", error);
    });
}

function ViewData(Code) {
    ServicePOApprovalService.GetServicePODetail(Code).then(function (data) {
        if (data && data.length > 0) {
            $('#myModal').modal({
                backdrop: 'static',
            });
            $('#myModal').modal('show');
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                "Amount": 'right',
                "Qty": 'right',
            };
            BizsolCustomFilterGrid.CreateDataTable("table-header-PoapprovalModalTable", "table-body-PoapprovalModalTable", data, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
        } else {
            toastr.error("No data found:", data);
            $("#ServicePOApproval").hide();
        }
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
    });
}
function CloseModal(Code) {
    $('#myModal').modal('hide');
}
function getUrlVars() {
    var vars = {};
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}

window.ViewData = ViewData;
window.CloseModal = CloseModal;
window.Approval = Approval;