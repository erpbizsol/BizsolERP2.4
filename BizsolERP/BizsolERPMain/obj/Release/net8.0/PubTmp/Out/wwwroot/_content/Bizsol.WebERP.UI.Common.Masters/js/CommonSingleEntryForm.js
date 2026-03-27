import { CommonSingleEntryFormService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CommonSingleEntryFormService.js';

let G_CommonSingleEntry = 0;
let G_Code = 0;
let G_DeleteCode = 0;
let G_DeleteConfig = 0;
let menuValue = '';
$(document).ready(function () {
    var urlParams = getUrlVars();
     menuValue = decodeURI(urlParams['ModuleDesp']);

    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    }
    else {
    $("#ERPHeading").text("Common Single Entry Form");
    }
    GetCommonMastersConfiguration_Code(menuValue);

    $("#cseBtnCancelDelete").on("click", function () {
        $("#cseDeleteConfirmBackdrop").removeClass("show");
    });
});
function GetCommonSingleEntryTable(G_CommonSingleEntry) {
    CommonSingleEntryFormService.GetCommonSingleEntry(G_CommonSingleEntry).then(function (response) {
        $("#tblCommonSingleEntryForm").show();
        if (response.length > 0) {
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code"];
            const ColumnAlignment = {};

            const updatedResponse = response.map(item => {
                let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit" onclick="SingleEntry_EditData(${item.Code},${G_CommonSingleEntry})"><i class="fa fa-pencil"></i></button>&nbsp;
                <button class="btn btn-danger icon-height mb-1" title="Delete" onclick="SingleEntry_Delete('${item.Code}',${G_CommonSingleEntry})"><i class="fa fa-remove"></i></button>`;

                return {
                    ...item,
                    Action: buttonsHTML,
                };

            });

            BizsolCustomFilterGrid.CreateDataTable("table-header-CommonSingleEntryForm", "table-body-CommonSingleEntryForm", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
        }
        else {
            toastr.error('No Data Found');
            $("#tblCommonSingleEntryForm").hide();
        }
    });
}
function SingleEntry_EditData(Code,G_CommonSingleEntry) {
    G_Code = Code;
    CommonSingleEntryFormService.SHOWDATABYEDIT(Code,G_CommonSingleEntry).then(function (response) {
        $('#newCreateForm').show();
        $('#txtDescription').val(response[0].FieldValue);
    });
}
function submit_CommonSingleEntry() {
    let FieldValue = $('#txtDescription').val().trim();

    if (!FieldValue) {
        toastr.warning('Please Fill The Description.');
        return;
    }

    CommonSingleEntryFormService.SaveCommonSingleEntry(G_Code, G_CommonSingleEntry, FieldValue)
        .then(function (response) {
            if (response && response.Status === 'Y') {
                $('#txtDescription').val('');
                GetCommonSingleEntryTable(G_CommonSingleEntry);
                G_Code = 0;
                ShowCseSuccessModal(
                    "Saved Successfully!",
                    (response.Msg || "Record has been saved."),
                    "fa-circle-check"
                );
            } else if (response && response.Status === 'N') {
                toastr.warning(response.Msg);
            }
        });
}
function ConfirmSingleEntryDelete(Code, G_CommonSingleEntry) {
    G_DeleteCode = Code;
    G_DeleteConfig = G_CommonSingleEntry;
    $("#cseDeleteConfirmBackdrop").addClass("show");
}

function DoSingleEntryDelete() {
    CommonSingleEntryFormService.DeleteCommonSingleEntryForm(G_DeleteCode, G_DeleteConfig)
        .then(function (response) {
            $("#cseDeleteConfirmBackdrop").removeClass("show");
            if (response && response.Status === 'Y') {
                GetCommonSingleEntryTable(G_DeleteConfig);
                ShowCseSuccessModal(
                    "Deleted Successfully!",
                    (response.Msg || "The record has been permanently removed."),
                    "fa-trash-can"
                );
            } else {
                toastr.error((response && response.Msg) || "Failed to delete record.");
            }
        })
        .catch(function (error) {
            toastr.error((error && error.Msg) || "Error during delete. Please try again.");
            $("#cseDeleteConfirmBackdrop").removeClass("show");
        });
}

function SingleEntry_Delete(Code, G_CommonSingleEntry) {
    ConfirmSingleEntryDelete(Code, G_CommonSingleEntry);
}
function ShowCseSuccessModal(title, text, iconClass) {
    $("#cseSuccessModalTitle").text(title || "Done!");
    $("#cseSuccessModalText").text(text || "Operation completed successfully.");
    $("#cseSuccessModalIcon").removeClass().addClass("fas " + (iconClass || "fa-circle-check"));
    $("#cseSuccessBackdrop").addClass("show");
}

function CloseCseSuccessModal() {
    $("#cseSuccessBackdrop").removeClass("show");
}

function GetCommonMastersConfiguration_Code(menuValue) {
    CommonSingleEntryFormService.GetCommonMastersConfiguration_Code(menuValue).then(function (response) {
        if (response.length > 0) {
            $('#labelDescription').text(response[0].FieldLabelName + ':');
            G_CommonSingleEntry=response[0].Code;
            $('#txtDescription')
                .attr('maxlength', response[0].MaxLength || 50)
                .attr('type', response[0].FieldType || 'text');
            GetCommonSingleEntryTable(G_CommonSingleEntry);
        }
    });
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
window.GetCommonSingleEntryTable = GetCommonSingleEntryTable;
window.SingleEntry_EditData = SingleEntry_EditData;
window.submit_CommonSingleEntry = submit_CommonSingleEntry;
window.SingleEntry_Delete = SingleEntry_Delete;
window.ConfirmSingleEntryDelete = ConfirmSingleEntryDelete;
window.DoSingleEntryDelete = DoSingleEntryDelete;
window.CloseCseSuccessModal = CloseCseSuccessModal;