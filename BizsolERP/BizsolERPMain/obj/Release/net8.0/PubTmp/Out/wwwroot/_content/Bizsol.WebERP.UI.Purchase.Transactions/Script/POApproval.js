import { POApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/POApprovalService.js';
$(document).ready(function () {
    $("#ERPHeading").text("PO Approval");
    unApprovedPO();
});
function unApprovedPO() {
    POApprovalService.GetUnApprovedPO().then(function (response) {
        if (response && response.length > 0) {
            const stringFilterColumn = ["Party Name"];
            const numericFilterColumn = ["Code", "PO No", "PO Amount"];
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
            const updatedResponse = response.map(item => ({
                ...item,
                Action: `<button class="btn btn-success icon-height mb-1" title="Approve" onclick="Approval('${item.Code}')"><i class="fa fa-check-circle" aria-hidden="true"></i></button>
                <button class="btn btn-primary icon-height mb-1" title="View Detail" onclick="ViewData('${item.Code}')"><i class="fa fa-folder-open" aria-hidden="true"></i></button>
                <button class="btn btn-info icon-height mb-1" title="Attchment" onclick="AttchmentFile('${item.Code}')"><i class="fa-solid fa-paperclip"></i></button>`
                //<button class="btn btn-primary icon-height mb-1" title="Preview" onclick="ViewData('${item.Code}')"><i class="fa fa-eye" aria-hidden="true"></i></button>`
            }));

            BizsolCustomFilterGrid.CreateDataTable("table-header-POApproval", "table-body-POApproval", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment); 
        } else {
            toastr.error("No valid data found:", response);
        }
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
    });
}
function ViewData(Code) {
    POApprovalService.GetPODetail(Code).then(function (response) {
        if (response && response.length > 0) {
            $('#myModal').modal({
                backdrop: 'static',
            });
            $('#myModal').modal('show');
            const stringFilterColumn = [];
            const numericFilterColumn = ["Amount"];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = ["Product"];
            const showButtons = [];
            const hiddenColumns = ["AllowPOWithOutIndent_RawMaterial_Code", "Size Description", "Specification", "itemsizemaster_Code", "ItemMaster_Code","IndentMaster_Code"];
            const ColumnAlignment = {};
            const updatedResponse = response.map(item => {
                const showPOWithOutIndentButton = item.AllowPOWithOutIndent_RawMaterial_Code === 'N';

                return {
                    ...item,
                    Action: `
                        <button class="btn btn-success icon-height mb-1" title="View History" onclick="ViewHistory('${item.ItemMaster_Code}', '${item.itemsizemaster_Code}')">
                            <i class="fa fa-eye" aria-hidden="true"></i>
                        </button>
                        ${showPOWithOutIndentButton ?
                        `<button class="btn btn-primary icon-height mb-1" title="Price Comparison" onclick="POWithOutIndent('${item.IndentMaster_Code}')">
                                <i class="fa fa-eye" aria-hidden="true"></i>
                            </button>`
                            : ''
                        }
                    `
                }; 
            });
            BizsolCustomFilterGrid.CreateDataTable("table-header-PoapprovalModal", "table-body-PoapprovalModal", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
        } else {
            toastr.error("No valid data found:", response);
        }
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
    });
}

function CloseModal() {
    $('#myModal').modal('hide');
}

function Approval(Code) {
    POApprovalService.POApproved(Code).then(function (approvedata) {
        if (approvedata.status === 'Y') {
            unApprovedPO();
            GetWebNotificationList();
            alert(approve.Msg);
            toastr.success(approvedata.Msg);
        }
        else {
            toastr.error("Error in fetching Data", error);
        }
    });
}
function ViewHistory(ItemMaster_Code, itemsizemaster_Code) {   
    POApprovalService.GetPOHistory(ItemMaster_Code, itemsizemaster_Code).then(function (response) {
        if (response && response.length > 0) {
            $('#myHistoryModal').modal({
                backdrop: 'static',
            });
            CloseModal();
            $('#myHistoryModal').modal('show');
            $('#modal-title').text(`View History`);
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                "PODate": "center",
                "PONo": "center",
                "QtyMT": "right",
            };
            BizsolCustomFilterGrid.CreateDataTable("table-header-PoaprrovalHistory", "table-body-PoaprrovalHistory", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
        } else {
            toastr.error("No valid data found:", response);
        }
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
    });
}
function CloseHistoryModal() {
    $('#myHistoryModal').modal('hide');
}
function POWithOutIndent(IndentMaster_Code) {
    POApprovalService.GetPOIndentPriceComparisonDetails(IndentMaster_Code).then(function (response) {
        if (response && response.length > 0) {
            $('#myHistoryModal').modal({
                backdrop: 'static',
            });
            CloseModal();
            $('#myHistoryModal').modal('show');
            $('#modal-title').text(`PO WithOut Indent History`);
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const ColumnAlignment = {};
            BizsolCustomFilterGrid.CreateDataTable("table-header-PoaprrovalHistory", "table-body-PoaprrovalHistory", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, ColumnAlignment);
        } else {
            toastr.error("No valid data found:", response);
        }
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
    });
}
function AttchmentFile(Code) {
    InitAttachmentControl('PurchaseOrderMaster', Code, '', 0, 0, '', "View");
    
}
function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode) {
    var url = `${sessionStorage.getItem('AppBaseURL')}/CustomControl/AttachmentControl`;
    $('#POApproval_AttachmentControlmodal').load(url, { MasterTableName: masterTableName, MasterTableCode: masterTableCode, DetailTableName: detailTableName, DetailTableCode: detailTableCode, EntryNo: entryNo, EntryDate: entryDate, Mode: mode });
}


window.ViewData = ViewData;
window.CloseModal = CloseModal;
window.Approval = Approval;
window.ViewHistory = ViewHistory;
window.CloseHistoryModal = CloseHistoryModal;
window.POWithOutIndent = POWithOutIndent;
window.AttchmentFile = AttchmentFile;