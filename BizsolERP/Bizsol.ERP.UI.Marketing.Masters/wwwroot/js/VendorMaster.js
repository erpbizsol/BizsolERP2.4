import { VendorMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VendorMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
var G_UserMasterCode = authKeyData.UserMaster_Code;
var G_EditCode = 0;
var G_ViewCode = 0;

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    GetVendorMasterList();
    GetNationList();
    GetStateList();
    GetCityList();
    // Modal close buttons
    $("#vmBtnModalClose, #vmBtnCancelVendor").on("click", CloseVendorForm);
    $("#vmBtnCancelDelete").on("click", function () {
        $("#vmDeleteConfirmBackdrop").removeClass("show");
    });

    // Live clear validation on input
    $("#AccountDesp").on("input", function () {
        if ($(this).val().trim()) {
            $("#err_AccountDesp").hide();
            $(this).removeClass("vm-input-error");
        }
    });

    // GST auto-uppercase
    $("#GSTNNo").on("input", function () {
        $(this).val($(this).val().toUpperCase());
        validateGST(false);
    });

    // Pincode — digits only
    $("#PinCode").on("input", function () {
        $(this).val($(this).val().replace(/\D/g, ''));
        $("#err_PinCode").hide();
    });

    // Email — live validation
    $("#EMail").on("input", function () {
        var val = $(this).val().trim();
        if (!val) {
            $("#err_EMail").hide();
            $(this).removeClass("vm-input-error");
        } else {
            validateEmail(false);
        }
    });

    // PhoneNo — digits only + live validation
    $("#PhoneNo").on("input", function () {
        $(this).val($(this).val().replace(/\D/g, ''));
        var val = $(this).val().trim();
        if (!val) {
            $("#err_PhoneNo").hide();
            $(this).removeClass("vm-input-error");
        } else {
            validatePhone(false);
        }
    });

    //// Country change → State/City reset (user ko dobara select karna hoga)
    //$("#Nation").on("change", function () {
    //    $("#State").val("").trigger("change");
    //    $("#City").val("").trigger("change");
    //});

    //// State change → City reset
    //$("#State").on("change", function () {
    //    $("#City").val("").trigger("change");
    //});

});

// ── Load Grid ──────────────────────────────────────────────
function GetVendorMasterList() {
    VendorMasterService.GetSolarVendorMasterList().then(function (response) {
        var rows = [];
        if (Array.isArray(response))            rows = response;
        else if (Array.isArray(response.data))  rows = response.data;
        else if (Array.isArray(response.Data))  rows = response.Data;

        if (rows.length > 0) {
            $("#tblVendorMaster").show();
            const StringFilterColumn = ["Account Name","GSTN No","Phone","Email","City","State","Country","Pin Code"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "Short Code", "Category", "Active", "PAN No","CityMaster_Code","StateMaster_Code","CountryMaster_Code"];
            const ColumnAlignment = {

                "Action": "center;width:118px;",
            };
            
            var updatedResponse = rows.map(function (item) {
                var btns =
                    '<button class="vm-btn-view" title="View" onclick="ViewVendor(' + item.Code + ')">' +
                        '<i class="fas fa-eye"></i>' +
                    '</button>' +
                    '<button class="vm-btn-edit" title="Edit" onclick="EditVendor(' + item.Code + ')">' +
                        '<i class="fas fa-pen"></i>' +
                    '</button>' +
                    '<button class="vm-btn-delete" title="Delete" onclick="ConfirmVendorDelete(' + item.Code + ')">' +
                        '<i class="fas fa-trash-can"></i>' +
                    '</button>';
                return Object.assign({}, item, { Action: btns });
            });

            BizsolCustomFilterGrid.CreateDataTable(
                "VendorMaster-header", "VendorMaster-body",
                updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment
            );
        } else {
            toastr.warning("No vendors found. Add your first vendor!");
            $("#tblVendorMaster").hide();
        }
    }).catch(function () {
        toastr.error("Failed to load vendor list.");
    });
}

// ── Open New Form ───────────────────────────────────────────
function OpenNewVendor() {
    G_EditCode = 0;
    ClearVendorForm();
    $("#vmFormModalTitle").text("Add New Vendor");
    $("#vmBtnSaveText").text("Save Vendor");
    $("#vendorDialogBackdrop").addClass("show");
    setTimeout(function () { $("#AccountDesp").focus(); }, 140);
}

// ── Open Edit Form ──────────────────────────────────────────
function EditVendor(code) {
    var ModuleName = "Vendor Master",
        OptionName = "Edit",
        ShowMsg    = "Y",
        FinYear    = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        }
        G_EditCode = code;
        ClearVendorForm();
        $("#vmFormModalTitle").text("Edit Vendor");
        $("#vmBtnSaveText").text("Update Vendor");

        VendorMasterService.GetSolarVendorMasterByCode(code).then(function (res) {
            var item = res && res.VendorMasterList ? res.VendorMasterList[0] : (Array.isArray(res) ? res[0] : res);
            if (!item) { toastr.error("Failed to load vendor data."); return; }

            $("#AccountDesp").val(item.AccountDesp || "");
            $("#BillName").val(item.BillName || "");
            $("#GSTNNo").val(item.GSTNNo || "");
            $("#EMail").val(item.EMail || "");
            $("#PhoneNo").val(item.PhoneNo || "");
            $("#PinCode").val(item.PinCode || "");

            var stateCode = item.StateMaster_Code != null ? String(item.StateMaster_Code) : "";
            var cityCode = item.CityMaster_Code != null ? String(item.CityMaster_Code) : "";
            var nationCode = item.CountryMaster_Code != null ? String(item.CountryMaster_Code) : "";

            $("#vendorDialogBackdrop").addClass("show");

            setTimeout(function () {
                $("#Nation").val(nationCode).trigger("change");
                setTimeout(function () {
                    $("#State").val(stateCode).trigger("change");
                    setTimeout(function () {
                        $("#City").val(cityCode).trigger("change");
                    }, 80);
                }, 80);
            }, 150);
            setTimeout(function () { $("#AccountDesp").focus(); }, 140);
        }).catch(function () {
            toastr.error("Error loading vendor data. Please try again.");
        });
    });
}

// ── View Vendor ─────────────────────────────────────────────
function ViewVendor(code) {
    var ModuleName = "Vendor Master",
        OptionName = "View",
        ShowMsg    = "Y",
        FinYear    = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        }
        G_ViewCode = code;

        VendorMasterService.GetSolarVendorMasterByCode(code).then(function (res) {
            var item = res && res.VendorMasterList ? res.VendorMasterList[0] : (Array.isArray(res) ? res[0] : res);
            if (!item) { toastr.error("Failed to load vendor details."); return; }

            // Header
            $("#viewVendorName").text(item.AccountDesp || "—");

            // Badges
            if (item.City) {
                $("#viewCityBadge").html('<i class="fas fa-city" style="margin-right:5px;font-size:10px;"></i>' + item.City).show();
            } else {
                $("#viewCityBadge").hide();
            }
            if (item.GSTNNo) {
                $("#viewGSTBadge").html('<i class="fas fa-receipt" style="margin-right:5px;font-size:10px;"></i>' + item.GSTNNo).show();
            } else {
                $("#viewGSTBadge").hide();
            }

            // Fields
            $("#vf_VendorName").text(item.AccountDesp   || "—");
            $("#vf_DisplayName").text(item.AccountDesp    || "—");
            $("#vf_Pincode").text(item.PinCode          || "—");
            $("#vf_GSTNo").text(item.GSTNNo             || "—");
            $("#vf_EMail").text(item.EMail               || "—");
            $("#vf_PhoneNo").text(item.PhoneNo || "—");

            $("#vf_State").text(item.State || "");
            $("#vf_City").text(item.City || "");
            $("#vf_Nation").text(item.Nation || "");

            //$('#State').select2({
            //    width: '-webkit-fill-available'
            //});
            //$('#Nation').select2({
            //    width: '-webkit-fill-available'
            //});
            //$('#City').select2({
            //    width: '-webkit-fill-available'
            //});

            $("#viewVendorBackdrop").addClass("show");
        }).catch(function () {
            toastr.error("Error loading vendor details. Please try again.");
        });
    });
}

function CloseVendorViewModal() {
    G_ViewCode = 0;
    $("#viewVendorBackdrop").removeClass("show");
}

function EditFromVendorView() {
    var codeToEdit = G_ViewCode;
    CloseVendorViewModal();
    EditVendor(codeToEdit);
}

// ── Delete Flow ─────────────────────────────────────────────
function ConfirmVendorDelete(code) {
    G_EditCode = code;
    $("#vmReasonForDeleteInput").val("");
    $("#vmDeleteConfirmBackdrop").addClass("show");
    setTimeout(function () { $("#vmReasonForDeleteInput").focus(); }, 150);
}

function DoVendorDelete() {
    var ModuleName = "Vendor Master",
        OptionName = "Delete",
        ShowMsg    = "Y",
        FinYear    = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        } else {
            var reason = $("#vmReasonForDeleteInput").val().trim();
            if (!reason) {
                toastr.warning("Please provide a reason for deletion.");
                $("#vmReasonForDeleteInput").focus();
                return;
            }
            VendorMasterService.DeleteSolarVendorMaster(G_EditCode, reason).then(function (res) {
                $("#vmDeleteConfirmBackdrop").removeClass("show");
                if (res && res.Status === 'Y') {
                    GetVendorMasterList();
                    ShowVendorSuccessModal(
                        "Deleted Successfully!",
                        res.Msg || "The vendor record has been permanently removed.",
                        "fa-trash-can"
                    );
                } else {
                    toastr.error((res && res.Msg) || "Failed to delete vendor.");
                }
            }).catch(function () {
                toastr.error("Failed to delete vendor. Please try again.");
                $("#vmDeleteConfirmBackdrop").removeClass("show");
            });
        }
       
    });
}

// ── Save / Update ────────────────────────────────────────────
function SaveVendor() {
    var ModuleName = "Vendor Master",
        OptionName = "New",
        ShowMsg    = "Y",
        FinYear    = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        }
        if (!ValidateVendorForm()) return;

        var isEdit   = G_EditCode > 0;
        var payload  = BuildVendorPayload();
        var btnSave  = $("#vmBtnSaveVendor");
        var origLabel = $("#vmBtnSaveText").text();

        btnSave.prop("disabled", true);
        $("#vmBtnSaveText").text(isEdit ? "Updating…" : "Saving…");

        VendorMasterService.SaveVendorMaster(payload.VendorMaster).then(function (res) {
            if (res && res.Status === 'Y') {
                CloseVendorForm();
                GetVendorMasterList();
                ShowVendorSuccessModal(
                    isEdit ? "Updated Successfully!" : "Saved Successfully!",
                    res.Msg || (isEdit ? "Vendor details have been updated." : "New vendor has been added."),
                    isEdit ? "fa-pen-to-square" : "fa-circle-check"
                );
            } else {
                toastr.error((res && res.Msg) || (isEdit ? "Failed to update vendor." : "Failed to save vendor."));
            }
        }).catch(function () {
            toastr.error("An error occurred. Please try again.");
        }).finally(function () {
            btnSave.prop("disabled", false);
            $("#vmBtnSaveText").text(origLabel);
        });
    });
}

// ── Helpers ─────────────────────────────────────────────────
function BuildVendorPayload() {
    return {
        VendorMaster: [
            {
                // ── Primary Key ──────────────────────────────────────────
                Code:                                       parseInt(G_EditCode) || 0,

                // ── Form Fields (from VendorMaster.cshtml) ───────────────
                AccountDesp:                                $("#AccountDesp").val().trim(),
                BillName:                                   $("#BillName").val().trim(),
                GSTNNo:                                     $("#GSTNNo").val().trim(),
                EMail:                                      $("#EMail").val().trim(),
                PhoneNo:                                    $("#PhoneNo").val().trim(),
                City:                                       $("#City").val(),
                State:                                      $("#State").val(),
                Nation:                                     $("#Nation").val(),
                PinCode:                                    $("#PinCode").val(),

                // ── Default Values (not in form) ─────────────────────────
                Address1:                                   "",
                Address2:                                   "",
                Zone:                                       "",
                DespWithoutSpaces:                          "",
                FaxNo:                                      "",
                WebSite:                                    "",
                CSTNo:                                      "",
                STNo:                                       "",
                ECCNo:                                      "",
                RangeDivision:                              "",
                VatNo:                                      "",
                ServiceTaxNo:                               "",
                PANNo:                                      "",
                TANNo:                                      "",
                AadhaarNo:                                  "",
                EXIMCode:                                   "",
                DrugLicenseNoAnddate:                       "",
                MSMEType:                                   "",
                MSMENo:                                     "",
                Client:                                     "N",
                Vendor:                                     "Y",
                JobWorker:                                  "N",
                Transporter:                                "N",
                Contractor:                                 "N",
                Investor:                                   "N",
                IsAgent:                                    "N",
                IsProspectiveCustomer:                      "N",
                AccountType:                                "",
                AccountNature:                              "",
                AccountCategory:                            "",
                AccountShortCode:                           "",
                AccountNameForIT:                           "",
                AccountNo:                                  "",
                BankActID:                                  "",
                TransferClosingBalance:                     "Y",
                MasterAccountCode:                          0,
                CodeinFactoryDB:                            0,
                MaintainBillWise:                           "N",
                MaintainInForeignCurrency:                  "N",
                OpeningSource:                              "C",
                LedgerSorting:                              "",
                AccountMasterHistory:                       "",
                LedgerGroupMISMaster_Code:                  0,
                AccountPrintInCommInvoice:                  "",
                DepreciationRateCompanyAct:                 0,
                DepreciationRateIncomeTaxAct:               0,
                BankMaster_Code:                            0,
                DefaultBankMaster_Code:                     0,
                F_BankChequeTypeMaster_Code:                0,
                F_BankRTGSMaster_Code:                      0,
                CreditLimit:                                0,
                TDSApplicable:                              "N",
                TDSProvisionsAs:                            "Basic",
                TCSApplicable:                              "N",
                TCSRate:                                    0,
                GSTApplicableDate:                          null,
                IsSEZSupply:                                "N",
                GSTRFrequency:                              "Q",
                IsUnRegisterGSTNo:                          "N",
                PartyExcemptionNo:                          "",
                DivisionMaster_Code:                        0,
                SubDivisionMaster_Code:                     0,
                BranchMaster_Code:                          0,
                AccountCodeinBranch:                        0,
                BranchCode:                                 "",
                GroupNo:                                    0,
                GroupTypeMaster_Code:                       0,
                CostCentreCategoryMaster_Code:              0,
                CostCenterMendatory:                        "N",
                AccountMaster_Code_MasterGroup:             0,
                AccountMaster_CodeDebitCredit:              0,
                AccountMaster_CodeScheme:                   0,
                ServiceProviderNatureMaster_Code:           0,
                ServiceProviderMaster_Code:                 0,
                MRNWithoutPO:                               "",

                // ── Audit ────────────────────────────────────────────────
                UserID:                                     G_UserMasterCode,
                CreateDate:                                 null,
                UpdateDate:                                 null,
                FinYear:                                    getFinancialYear(),
                UpdatedBy:                                  G_UserMasterCode,
                DatabaseLocation_Code:                      null,

                ZoneMaster_Code:                            0,
                AreaMaster_Code:                            0,
                Verified:                                   "N",
                VerifiedBy:                                 0,
                VerifiedON:                                 null,
                CountryMaster_Code: $("#Nation").val(),
                StateMaster_Code:$("#State").val(),
                CityMaster_Code: $("#City").val(), 
                CityMaster_CodeFreight:                     0,
                DistributorMaster_Code:                     0,
                SalesAccountCode:                           0,
                PriceListTypeMaster_Code:                   0,
                DiscountGroupMaster_Code:                   0,
                SpecialDiscountPercent:                     0,
                FreightDiscountPercent:                     0,
                VendorCode:                                 "",
                PreferredTransport:                         "",
                RoadPermitApplicable:                       "N",
                Distance:                                   0,
                AllowOnlyFreightAccountProvisionInInvoice:  "N",
                IndustryTypeMaster_Code:                    0,
                F_CommonValues_Priority_Code:               0,
                F_CommonValues_Code_Grade:                  0,
                EmailInvoiceCopy:                           "N",
                LanguageMaster_Code:                        0,
                CurrencyMaster_Code:                        0,
                ClientPassword:                             "",
                F_Common_ClientVendor_Code_Status:          0,
                F_Common_ClientVendor_Code_PaymentTerms:    0,
                F_Common_ClientVendor_Code_PaymentMode:     0,
                Access:                                     "",
                CustomerSource:                             "",
                NameofExhibition:                           "",
                PortOfDischarge:                            "",
                YearofExhibition:                           "",
                PortOfLoiding:                              "",
                CMSCode:                                    "",
                AirlineMaster_Code_Prefered:                0,
                AirlineMaster_Code_Optional:                0,
                FreightForwarderMaster_Code:                0,
                CommissionAgent:                            "",
                ShowDlvryAddasByrAndCons:                   "N",
                AllowInvoiceWOPackingList:                  "Y",
                LinkedAccountMaster_Code:                   0,
                BudgetApplicable:                           "N",
                BudgetPeriod:                               "",
                Marka:                                      "",
                IsActive:                                   "Y",
                IsActiveMobileApp:                          "Y",
                CostCenterMandatory:                        "N",
                BillDetailApplicableInGRBill:               "N",
                OutSideLocalArea:                           "N",
                ForDomesticUseOnly:                         "N",
                RateDetailApplicable:                       "N",
                RemarksDSP:                                 "",
                PPCPersonMaster_Code:                       0,
                DealerSince:                                "",
                CityType:                                   "",
                FileNo:                                     "",
                SortCodePreFix:                             "",
                ABCCode:                                    "",
                TransactionType:                            "",
                Ratings:                                    "",
                InsuranceChargesApplicable:                 "N",
                LastCalsulateOnCD:                          null,
                MonthlyGovermentDues:                       "N",
                DueDaysForGovermentDues:                    0,
                ReminderDaysForGovermentDues:               0,
                InterestRateValue:                          0,
                RelationWithCustomer:                       "",
                RelativeName:                               "",
                WitnessName1:                               "",
                RelationWithWitness1:                       "",
                RelativeNameWitness1:                       "",
                WitnessAddress1:                            "",
                WitnessName2:                               "",
                RelationWithWitness2:                       "",
                RelativeNameWitness2:                       "",
                WitnessAddress2:                            "",
                CRNNo_ByThirdParty:                         "",
                ACNo_ByThirdParty:                          "",
                TransNo_ByThirdParty:                       "",
                OtherStatus:                                ""
            }
        ],
        UserMasterCode: G_UserMasterCode
    };
}

function ValidateVendorForm() {
    var valid = true;

    // Vendor Name — required
    var nameEl  = $("#AccountDesp");
    var nameErr = $("#err_AccountDesp");
    if (!nameEl.val().trim()) {
        nameErr.css("display", "flex");
        nameEl.addClass("vm-input-error");
        nameEl.focus();
        valid = false;
    } else {
        nameErr.hide();
        nameEl.removeClass("vm-input-error");
    }

    // Pincode — optional but if filled must be 6 digits
    var pinVal = $("#PinCode").val().trim();
    if (pinVal && !/^\d{6}$/.test(pinVal)) {
        $("#err_PinCode").css("display", "flex");
        $("#PinCode").addClass("vm-input-error");
        valid = false;
    } else {
        $("#err_PinCode").hide();
        $("#PinCode").removeClass("vm-input-error");
    }

    // GST — optional but if filled must match pattern
    if (!validateGST(true)) valid = false;

    // Email — optional but if filled must be valid
    if (!validateEmail(true)) valid = false;

    // Phone — optional but if filled must be 10 digits
    if (!validatePhone(true)) valid = false;

    return valid;
}

function validateGST(showError) {
    var gstVal = $("#GSTNNo").val().trim();
    if (!gstVal) {
        $("#err_GSTNNo").hide();
        $("#GSTNNo").removeClass("vm-input-error");
        return true;
    }
    var gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstPattern.test(gstVal)) {
        if (showError) {
            $("#err_GSTNNo").css("display", "flex");
            $("#GSTNNo").addClass("vm-input-error");
        }
        return false;
    }
    $("#err_GSTNNo").hide();
    $("#GSTNNo").removeClass("vm-input-error");
    return true;
}

function validateEmail(showError) {
    var emailVal = $("#EMail").val().trim();
    if (!emailVal) {
        $("#err_EMail").hide();
        $("#EMail").removeClass("vm-input-error");
        return true;
    }
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailVal)) {
        if (showError) {
            $("#err_EMail").css("display", "flex");
            $("#EMail").addClass("vm-input-error");
        }
        return false;
    }
    $("#err_EMail").hide();
    $("#EMail").removeClass("vm-input-error");
    return true;
}

function validatePhone(showError) {
    var phoneVal = $("#PhoneNo").val().trim();
    if (!phoneVal) {
        $("#err_PhoneNo").hide();
        $("#PhoneNo").removeClass("vm-input-error");
        return true;
    }
    var phonePattern = /^[6-9]\d{9}$/;
    if (!phonePattern.test(phoneVal)) {
        if (showError) {
            $("#err_PhoneNo").css("display", "flex");
            $("#PhoneNo").addClass("vm-input-error");
        }
        return false;
    }
    $("#err_PhoneNo").hide();
    $("#PhoneNo").removeClass("vm-input-error");
    return true;
}

function ClearVendorForm() {
    ["AccountDesp", "BillName", "GSTNNo", "EMail", "PhoneNo", "City", "State", "Nation", "PinCode"].forEach(function (id) {
        $("#" + id)
            .val("")
            .removeClass("vm-input-error")
            .prop("readonly", false)
            .prop("disabled", false);
        var errEl = $("#err_" + id);
        if (errEl.length) errEl.hide();
        var dupEl = $("#dup_" + id);
        if (dupEl.length) dupEl.hide();
    });
    $("#vmBtnSaveVendor").show().prop("disabled", false);
    $("#vmBtnCancelVendor").html('<i class="fas fa-times"></i> Cancel');
}

function CloseVendorForm() {
    ClearVendorForm();
    G_EditCode = 0;
    G_ViewCode = 0;
    $("#vendorDialogBackdrop").removeClass("show");
}

function ShowVendorSuccessModal(title, text, iconClass) {
    $("#vmSuccessModalTitle").text(title || "Done!");
    $("#vmSuccessModalText").text(text  || "Operation completed successfully.");
    $("#vmSuccessModalIcon")
        .removeClass()
        .addClass("fas " + (iconClass || "fa-circle-check"));
    $("#vmSuccessBackdrop").addClass("show");
}

function CloseVendorSuccessModal() {
    $("#vmSuccessBackdrop").removeClass("show");
}

function getFinancialYear() {
    var d     = new Date();
    var month = d.getMonth();
    var year  = d.getFullYear();
    if (month < 3) year = year - 1;
    return year + "-" + (year + 1);
}
function GetCityList() {

    VendorMasterService.GetCityList().then(function (resObj) {
        BindSelectList($('#City')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.CityName })));
        $('#City').select2({
            width: '-webkit-fill-available'
        });
    });
}
function GetStateList() {

    VendorMasterService.GetStateList().then(function (resObj) {
        BindSelectList($('#State')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.StateName })));
        $('#State').select2({
            width: '-webkit-fill-available'
        });
    });
}
function GetNationList() {

    VendorMasterService.GetNationList().then(function (resObj) {
        BindSelectList($('#Nation')[0], resObj.map((item) => ({ Code: item.Code, Desp: item.CountryName })));
        $('#Nation').select2({
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

// ── Expose to global scope ──────────────────────────────────
window.OpenNewVendor          = OpenNewVendor;
window.EditVendor             = EditVendor;
window.ViewVendor             = ViewVendor;
window.CloseVendorViewModal   = CloseVendorViewModal;
window.EditFromVendorView     = EditFromVendorView;
window.ConfirmVendorDelete    = ConfirmVendorDelete;
window.DoVendorDelete         = DoVendorDelete;
window.SaveVendor             = SaveVendor;
window.CloseVendorSuccessModal = CloseVendorSuccessModal;
