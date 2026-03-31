import { ItemMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_ItemMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
//var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
//var G_UserMasterCode = authKeyData.UserMaster_Code;
var G_EditCode = 0;
var G_ViewCode = 0;

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    GetItemMasterList();
    GetUOMList();

    // Modal close buttons
    $("#btnModalClose, #btnCancelItem").on("click", CloseForm);
    $("#btnCancelDelete").on("click", function () {
        $("#deleteConfirmBackdrop").removeClass("show");
    });

    // Live clear validation errors on input
    ["ItemCode", "ItemName"].forEach(function (id) {
        $("#" + id).on("input", function () {
            if ($(this).val().trim()) {
                $("#err_" + id).hide();
                $(this).removeClass("im-input-error");
            }
        });
    });

    // UOM — live clear on select2 change
    $("#UOM").on("change", function () {
        if ($(this).val()) {
            $("#err_UOM").hide();
            $(this).nextAll(".select2-container").first().find(".select2-selection--single").css({
                "border-color": "",
                "box-shadow": ""
            });
        }
    });

    // HSN — numbers only, max 8 digits
    $("#HSN").on("keypress", function (e) {
        if (!/\d/.test(String.fromCharCode(e.which))) e.preventDefault();
    }).on("input", function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 8);
        if (this.value.length > 0) $("#err_HSN").hide();
    });

    // GST Rate — numbers and single decimal only, no alphabets
    $("#GSTRate").on("keypress", function (e) {
        var ch = String.fromCharCode(e.which);
        if (!/[\d.]/.test(ch)) { e.preventDefault(); return; }
        if (ch === '.' && $(this).val().includes('.')) e.preventDefault();
    }).on("input", function () {
        this.value = this.value.replace(/[^\d.]/g, '').replace(/(\..*?)\..*/g, '$1');
    });
});

// ── Load Grid ──────────────────────────────────────────────
function GetItemMasterList() {
    ItemMasterService.GetItemMasterListData().then(function (response) {
        var rows = [];
        if (Array.isArray(response)) rows = response;
        else if (Array.isArray(response.data)) rows = response.data;
        else if (Array.isArray(response.Data)) rows = response.Data;

        if (rows.length > 0) {
            $("#tblitemMaster").show();
            const StringFilterColumn = ["Item Code", "Item Name", "UOM", "Type"];
            const NumericFilterColumn = ["Entry No"];
            const DateFilterColumn = ["Entry Date"];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["CurrentStatus", "MaintenanceType", "Priority", "NatureofBreakdown", "DescriptionofBreakdown", "SpareConsumed", "JobAssignedTo", "MobileNo", "RequestTime", "ConcernedPerson", "ConcenedPersonMobileNo", "Code", "Job Assigned", "Request Date", "Work Start Date", "Machine Failed Date", "Failed Remark", "Start Remark", "Description"];
            const ColumnAlignment = {

                "Action": "center;width:118px;",
            };
            var updatedResponse = rows.map(function (item) {
                var btns =
                    '<button class="im-btn-view" title="View" onclick="ViewItem(' + item.Code + ')">' +
                    '<i class="fas fa-eye"></i>' +
                    '</button>' +
                    '<button class="im-btn-edit" title="Edit" onclick="EditItem(' + item.Code + ')">' +
                    '<i class="fas fa-pen"></i>' +
                    '</button>' +
                    '<button class="im-btn-delete" title="Delete" onclick="ConfirmDelete(' + item.Code + ')">' +
                    '<i class="fas fa-trash-can"></i>' +
                    '</button>';
                return Object.assign({}, item, { Action: btns });
            });

            BizsolCustomFilterGrid.CreateDataTable(
                "ItemMaster-header", "ItemMaster-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment
            );

        } else {
            toastr.warning("No items found. Add your first item!");
            $("#tblitemMaster").hide();
        }
    }).catch(function () {
        toastr.error("Failed to load item list.");
    });
}

// ── Open New Form ───────────────────────────────────────────
function OpenNewItem() {
    var ModuleName = "Item Master",
        OptionName = "New",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            G_EditCode = 0;
            ClearForm();
            $("#formModalTitle").text("Add New Item");
            $("#btnSaveText").text("Save Item");
            $("#itemDialogBackdrop").addClass("show");
            setTimeout(function () { $("#ItemName").focus(); }, 140);
        }
    });
};

// ── Open Edit Form ──────────────────────────────────────────
function EditItem(code) {
    var ModuleName = "Item Master",
        OptionName = "Edit",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {

            G_EditCode = code;
            ClearForm();
            $("#formModalTitle").text("Edit Item");
            $("#btnSaveText").text("Update Item");
            ItemMasterService.GetItemMasterByCode(code).then(function (response) {
                // ✅ VW_ItemMaster ke do arrays
                var item = response && response.ItemMasterList
                    ? response.ItemMasterList[0]
                    : null;
                var otherDetail = response && response.ItemMasterOtherDetail
                    ? response.ItemMasterOtherDetail[0]
                    : null;
                if (item) {
                    // ── tblItemMaster fields ──
                    $("#ItemCode").val(item.ItemCode || "");
                    $("#ItemName").val(item.ItemName || "");
                    SelectOptionByText('UOM', item.UOM);
                    $("#GSTRate").val(item.DutyValue || "0");
                    $("#ItemType").val((otherDetail && otherDetail.ItemNature) ? otherDetail.ItemNature : "");
                    $("#HSN").val((otherDetail && otherDetail.HSNCode != null) ? otherDetail.HSNCode : "");
                    $("#ItemSpecification").val(item.ItemSpecification || "");
                    $("#itemDialogBackdrop").addClass("show");
                } else {
                    toastr.error("Failed to load item data.");
                }
            }).catch(function () {
                toastr.error("Error loading item. Please try again.");
            });
        }
    });
}

// ── View Item ───────────────────────────────────────────────
function ViewItem(code) {
    var ModuleName = "Item Master",
        OptionName = "View",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {
            G_ViewCode = code;

            ItemMasterService.GetItemMasterByCode(code).then(function (response) {
                var item = response && response.ItemMasterList ? response.ItemMasterList[0] : null;
                var otherDetail = response && response.ItemMasterOtherDetail ? response.ItemMasterOtherDetail[0] : null;

                if (!item) { toastr.error("Failed to load item details."); return; }

                // Header
                $("#viewItemCode").text(item.ItemCode || "—");
                $("#viewItemName").text(item.ItemName || "—");

                // Badges
                var natureVal = item.ItemNature || "";
                var typeText = natureVal === 'G' ? 'Good' : natureVal === 'S' ? 'Services' : '';
                if (typeText) {
                    $("#viewItemTypeBadge").html('<i class="fas fa-cubes" style="margin-right:5px;font-size:10px;"></i>Type: ' + typeText).show();
                } else {
                    $("#viewItemTypeBadge").hide();
                }
                if (item.DutyValue) {
                    $("#viewGSTBadge").html('<i class="fas fa-percent" style="margin-right:5px;font-size:10px;"></i>GST: ' + item.DutyValue + '%').show();
                } else {
                    $("#viewGSTBadge").hide();
                }

                // Fields
                $("#vf_ItemCode").text(item.ItemCode || "—");
                $("#vf_ItemName").text(item.ItemName || "—");
                $("#vf_UOM").text(item.UOM || "—");
                $("#vf_GSTRate").text(item.DutyValue ? item.DutyValue + "%" : "—");
                $("#vf_ItemType").text(typeText || "—");
                $("#vf_HSN").text((otherDetail && otherDetail.HSNCode != null && otherDetail.HSNCode !== "") ? otherDetail.HSNCode : "—");
                $("#vf_ItemSpecification").text((otherDetail && otherDetail.ItemSpecification) ? otherDetail.ItemSpecification : "—");

                // Open view modal
                $("#viewItemBackdrop").addClass("show");
            }).catch(function () {
                toastr.error("Error loading item details. Please try again.");
            });
        }
    });
}

function CloseViewModal() {
    G_ViewCode = 0;
    $("#viewItemBackdrop").removeClass("show");
}

function EditFromView() {
    var codeToEdit = G_ViewCode;
    CloseViewModal();
    EditItem(codeToEdit);
}

// ── Delete Flow ─────────────────────────────────────────────
function ConfirmDelete(code) {
    G_EditCode = code;
    $("#reasonForDeleteInput").val(""); // clear previous reason
    $("#deleteConfirmBackdrop").addClass("show");
    setTimeout(function () { $("#reasonForDeleteInput").focus(); }, 150);
};

function DoDelete() {
    var ModuleName = "Item Master",
        OptionName = "Delete",
        ShowMsg = "Y",
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight == 'N') {
            toastr.error(response.Msg);
            return false;
        } else {

            let reasonForDelete = $('#reasonForDeleteInput').val();

            if (!reasonForDelete) {
                toastr.warning("Please Provide a Reason For Delete.");
                $('#reasonForDeleteInput').focus();
                return;
            }
            ItemMasterService.DeleteItemMaster(G_EditCode, reasonForDelete).then(function (response) {
                $("#deleteConfirmBackdrop").removeClass("show");
                if (response && response.Status === 'Y') {
                    GetItemMasterList();
                    ShowSuccessModal(
                        "Deleted Successfully!",
                        response.Msg || "The item has been permanently removed from the catalogue.",
                        "fa-trash-can"
                    );
                } else {
                    toastr.error((response && response.Msg) || "Failed to delete item.");
                }
            }).catch(function () {
                toastr.error("Failed to delete item. Please try again.");
                $("#deleteConfirmBackdrop").removeClass("show");
            });
        }
    });
};

// ── Save / Update (single function) ────────────────────────
function SaveItem() {
    if (!ValidateForm()) return;
    var isEdit = G_EditCode > 0;
    var payload = BuildPayload();
    var btnSave = $("#btnSaveItem");
    var origLabel = $("#btnSaveText").text();

    btnSave.prop("disabled", true);
    $("#btnSaveText").text(isEdit ? "Updating…" : "Saving…");

    var serviceCall = isEdit
        ? ItemMasterService.SaveItemMaster(payload)
        : ItemMasterService.SaveItemMaster(payload);

    serviceCall.then(function (response) {
        if (response && response.Status === 'Y') {
            CloseForm();
            GetItemMasterList();
            if (isEdit) {
                ShowSuccessModal(
                    "Updated Successfully!",
                    response.Msg || "Item details have been saved successfully.",
                    "fa-pen-to-square"
                );
            } else {
                ShowSuccessModal(
                    "Saved Successfully!",
                    response.Msg || "New item has been added to the catalogue.",
                    "fa-circle-check"
                );
            }
        } else {
            toastr.error(
                (response && response.Msg) ||
                (isEdit ? "Failed to update item." : "Failed to save item.")
            );
        }
    }).catch(function () {
        toastr.error("An error occurred. Please try again.");
    }).finally(function () {
        btnSave.prop("disabled", false);
        $("#btnSaveText").text(origLabel);
    });
}

// ── Helpers ─────────────────────────────────────────────────
function BuildPayload() {
    return {
        ItemMasterList: [
            {
                // tblItemMaster fields
                Code: parseInt(G_EditCode) || 0,
                ItemCode: 0,
                ItemName: $("#ItemName").val().trim(),
                UOM: $("#UOM").val(),
                DisplayName: $("#ItemName").val().trim(),
                Category: "",
                CategoryName: "",
                SubCategoryName: "",
                GroupName: "",
                SubGroupName: "",
                DivisionName: "",
                ItemClassificationName: "",
                IsActive: "Y",
                AutoCalculateQty: "N",
                AverageMonthlyConsumption: parseFloat(0),
                ByProduct: "N",
                ConsiderForMonthlyIndenting: "N",
                DatabaseLocation_Code: 0,
                DoNotAllowBuyerPOWithOutPriceList: "N",
                ManualIDApplicable: "Y",
                MinimumPerTon: parseFloat(0),
                MRPvalue: parseFloat(0),
                MTMandatoryInBooking: "N",
                MTRSMandatoryInBooking: "N",
                OpeningBalance: parseFloat(0),
                Packing: "",
                PCMandatoryInBooking: "N",
                Rates: parseFloat(0),
                Rejection: "N",
                RejectionOf: parseFloat(0),
                ReorderLevel: parseFloat(0),
                ReorderQty: parseFloat(0),
                ShowItem: "Y",
                StockInMT: "N",
                StockInMTRS: "N",
                StockInPC: "N",
                Verified: "Y",
                VerifiedBy: "",
                VerifiedOn: null,
                DecimalPoints: 0,
                DutyValue: parseFloat($("#GSTRate").val()) || 0,
                ItemSpecification: $("#ItemSpecification").val().trim(),
                // UserMasterCode: G_UserMasterCode,
            }
        ],
        ItemMasterOtherDetail: [
            {
                Code: parseInt(G_EditCode),
                ItemMaster_Code: parseInt(G_EditCode) || 0,
                HSNCode: $("#HSN").val().trim(),
                ItemNature: $("#ItemType").val() || '',
                ItemCodeForGI: 0,
                ItemGroupName: "",
                ItemNameForProductionReceive: "",
                ItemNameForRolling: "",
                ItemNamePurchase: "",
                ItemWeightPerPc: parseFloat(0),
                InsuranceApplicable: "",
                ExemptionType: "",
                FormulaResult: parseFloat(0),
                FormulaText: "",
                FormulaValue: "",
                GrossWeight: parseFloat(0),
                NetWeight: parseFloat(0),
                NoOfUnits: parseFloat(0),
                ReportFileNameIDLabel: "",
                ReportIDLabelMultipleApplicable: "N",
                ReportIDLabelMultipleReportsName: "",
                RequirementPerMonth: parseFloat(0)
            }
        ],

    };
}

function ValidateForm() {
    var valid = true;

    ["ItemName"].forEach(function (id) {
        var el = $("#" + id);
        var err = $("#err_" + id);
        if (!el.val().trim()) {
            err.css("display", "flex");
            el.addClass("im-input-error");
            valid = false;
        } else {
            err.hide();
            el.removeClass("im-input-error");
        }
    });

    // UOM — select2 validation
    var uomVal = $("#UOM").val();
    var uomSelect2 = $("#UOM").nextAll(".select2-container").first()
        .find(".select2-selection--single");
    if (!uomVal || uomVal.trim() === "") {
        $("#err_UOM").css("display", "flex");
        uomSelect2.css({ "border-color": "#ef4444", "box-shadow": "0 0 0 3px rgba(239,68,68,0.10)" });
        valid = false;
    } else {
        $("#err_UOM").hide();
        uomSelect2.css({ "border-color": "", "box-shadow": "" });
    }

    // Block save if any duplicate warning is visible
    if ($("#dup_ItemName").is(":visible")) {
        toastr.warning("Please resolve duplicate warnings before saving.");
        valid = false;
    }

    return valid;
}

function ClearForm() {
    ["ItemCode", "ItemName", "UOM", "HSN", "GSTRate", "ItemSpecification"].forEach(function (id) {
        var el = $("#" + id);
        el.val("").removeClass("im-input-error").prop("disabled", false);
        if (id !== "ItemCode") el.prop("readonly", false);
        $("#err_" + id).hide();
        $("#dup_" + id).hide();
    });
    // Select2 keeps showing the old label until the underlying select change is signaled
    $("#UOM").trigger("change");
    // Reset UOM select2 error border
    $("#UOM").nextAll(".select2-container").first().find(".select2-selection--single").css({
        "border-color": "",
        "box-shadow": ""
    });
    $("#ItemType").val("").prop("disabled", false);
    $(".im-dup-warning").hide();
    // Restore Save button and Cancel label to default
    $("#btnSaveItem").show();
    $("#btnCancelItem").html('<i class="fas fa-times"></i> Cancel');
}

function CloseForm() {
    ClearForm();
    G_EditCode = 0;
    G_ViewCode = 0;
    $("#itemDialogBackdrop").removeClass("show");
}

function ShowSuccessModal(title, text, iconClass) {
    $("#successModalTitle").text(title || "Done!");
    $("#successModalText").text(text || "Operation completed successfully.");
    $("#successModalIcon")
        .removeClass()
        .addClass("fas " + (iconClass || "fa-circle-check"));
    $("#successBackdrop").addClass("show");
}

function CloseSuccessModal() {
    $("#successBackdrop").removeClass("show");
}
function GetUOMList() {
    ItemMasterService.GetUomMasterList().then(function (resObj) {
        BindSelectList($('#UOM')[0], resObj.map((item) => ({ Code: item.UOM, Desp: item.UOM })));
        $('#UOM').select2({
            width: '-webkit-fill-available'
        });
    });
}
function BindSelectList(element, list) {
    let option = '<option value="">select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '" >' + val.Desp + '</option>';
    });
    element.innerHTML = option;
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

function getFinancialYear() {
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth();
    var startYear = currentDate.getFullYear();
    if (currentMonth < 3) {
        startYear = startYear - 1;
    }
    return startYear + "-" + (startYear + 1);
}
window.OpenNewItem = OpenNewItem;
window.EditItem = EditItem;
window.ViewItem = ViewItem;
window.CloseViewModal = CloseViewModal;
window.EditFromView = EditFromView;
window.ConfirmDelete = ConfirmDelete;
window.DoDelete = DoDelete;
window.SaveItem = SaveItem;
window.CloseSuccessModal = CloseSuccessModal;
window.GetUOMList = GetUOMList;