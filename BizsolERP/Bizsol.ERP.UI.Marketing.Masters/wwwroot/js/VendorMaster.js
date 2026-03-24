import { VendorMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VendorMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
var G_UserMasterCode = authKeyData.UserMaster_Code;
var G_EditCode = 0;
var G_ViewCode = 0;
var G_VendorVerifyCode = 0;
let G_IsClientOrVendor = 'N';
let G_ModuleName = "Vendor Master";
window.G_VendorHasVerifyRight = false;
/** From GetFixedParameterDetails; when Y, show stats strip + Verify column (with menu Verify right). */
window.G_PartyVerificationBeforeOrderY = false;

function syncVendorModuleContextFromHeading() {
    var raw = ($("#ERPHeading").text() || "").trim();
    G_ModuleName = raw || "Vendor Master";
    G_IsClientOrVendor = G_ModuleName === "Vendor Master" ? "V" : "C";
}

function extractPartyVerificationBeforeOrderY(res) {
    var row = null;
    if (Array.isArray(res) && res.length > 0) row = res[0];
    else if (res && Array.isArray(res.data) && res.data.length > 0) row = res.data[0];
    else if (res && Array.isArray(res.Data) && res.Data.length > 0) row = res.Data[0];
    else if (res && typeof res === "object" && !Array.isArray(res)) row = res;
    if (!row || typeof row !== "object") return false;
    var v = row.PartyVerificationBeforeOrder;
    if (v === undefined || v === null) v = row.partyVerificationBeforeOrder;
    if (v === undefined || v === null) return false;
    var s = String(v).trim().toUpperCase();
    return s === "Y" || s === "YES" || s === "1";
}

function applyVendorMasterPartyVerificationUi() {
    var show = !!window.G_PartyVerificationBeforeOrderY;
    var $strip = $("#vendorMasterStatsStrip");
    if (!$strip.length) return;
    if (show) {
        $strip.show();
    } else {
        $strip.hide();
        window.G_VendorStatFilter = "all";
    }
}

function shouldShowVendorPartyVerifyColumn() {
    return !!(window.G_PartyVerificationBeforeOrderY && window.G_VendorHasVerifyRight);
}

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");
    syncVendorModuleContextFromHeading();
    applyVendorMasterClientModeUi();
    window.G_PartyVerificationBeforeOrderY = false;

    VendorMasterService.GetFixedParameterDetails()
        .then(function (res) {
            window.G_PartyVerificationBeforeOrderY = extractPartyVerificationBeforeOrderY(res);
        })
        .catch(function () {
            window.G_PartyVerificationBeforeOrderY = false;
        })
        .finally(function () {
            applyVendorMasterPartyVerificationUi();
            resolveVendorVerifyRight().then(function () {
                GetVendorMasterList();
            });
        });

    GetNationList();
    GetStateList();
    GetCityList();
   
    $("#vmBtnModalClose, #vmBtnCancelVendor").on("click", CloseVendorForm);
    $("#vmBtnCancelDelete").on("click", function () {
        $("#vmDeleteConfirmBackdrop").removeClass("show");
    });
    $("#vmBtnCancelVerify").on("click", CloseVendorVerifyModal);

    $("#AccountDesp").on("input", function () {
        if ($(this).val()) {
            $("#err_AccountDesp").hide();
            $(this).removeClass("vm-input-error");
        }
    });

    $("#GSTNNo").on("input", function () {
        $(this).val($(this).val().toUpperCase());
        var val = $(this).val();
        if (!val) {
            $("#err_GSTNNo").hide();
            $(this).removeClass("vm-input-error");
        } else if (val.length === 15) {
            validateGST(true);
        } else {
            $("#err_GSTNNo").hide();
            $(this).removeClass("vm-input-error");
        }
    });

    $("#PinCode").on("input", function () {
        $(this).val($(this).val().replace(/\D/g, ''));
        $("#err_PinCode").hide();
    });

    $("#EMail").on("input", function () {
        var val = $(this).val();
        if (!val) {
            $("#err_EMail").hide();
            $(this).removeClass("vm-input-error");
        } else {
            validateEmail(false);
        }
    });

    $("#PhoneNo").on("input", function () {
        $(this).val($(this).val().replace(/\D/g, ''));
        var val = $(this).val();
        if (!val) {
            $("#err_PhoneNo").hide();
            $(this).removeClass("vm-input-error");
        } else {
            validatePhone(false);
        }
    });

    $("#ContactPersonMobile").on("input", function () {
        $(this).val($(this).val().replace(/\D/g, ''));
        var val = $(this).val();
        if (!val) {
            $("#err_ContactPersonMobile").hide();
            $(this).removeClass("vm-input-error");
        } else {
            validateCPMobile(false);
        }
    });

    $("#ContactPersonEMail").on("input", function () {
        var val = $(this).val();
        if (!val) {
            $("#err_ContactPersonEMail").hide();
            $(this).removeClass("vm-input-error");
        } else {
            validateCPEmail(false);
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

    // Summary chips: filter grid by All / Verified / Pending
    $(document).on("click", ".vm-stat-chip[data-vm-filter]", function () {
        var mode = $(this).attr("data-vm-filter");
        window.G_VendorStatFilter = mode;
        if (window.G_VendorMasterSourceRows && window.G_VendorMasterSourceRows.length > 0) {
            refreshVendorMasterGrid();
        }
    });
    $(document).on("keydown", ".vm-stat-chip[data-vm-filter]", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            $(this).trigger("click");
        }
    });

    // Verified badge: title="" has no reliable hover on touch — tap shows the same details (toastr).
    $(document).on("click", ".vm-verify-status--done[data-vm-verify-info]", function (e) {
        e.preventDefault();
        e.stopPropagation();
        showVendorVerifyDetailFromBadge(this);
    });
    $(document).on("keydown", ".vm-verify-status--done[data-vm-verify-info]", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            showVendorVerifyDetailFromBadge(this);
        }
    });

    $(window).on("load", function () {
        syncVendorModuleContextFromHeading();
        applyVendorMasterClientModeUi();
    });
});
function rowIsVerified(item) {
    var v = item && item.Verified;
    if (v === undefined || v === null) return false;
    if (typeof v === "string") {
        var u = v.toUpperCase();
        return u === "Y" || u === "YES" || v === "1";
    }
    return v === true || v === 1;
}

function escapeVendorAttr(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
/** Resolve verify-by display text from API variants (PascalCase or spaced labels). */
function getVendorVerifiedByDisplay(item) {
    if (!item) return "";
    var v =
        item.VerifiedByName ||
        item.VerifiedByDesp ||
        item.VerifiedBy ||
        item["Verify By"] ||
        item["Verified By"] ||
        item.UserVerifiedBy;
    if (v === undefined || v === null || v === "") return "";
    if (typeof v === "number" && v === 0) return "";
    return String(v).trim();
}
function getVendorVerifiedOnRaw(item) {
    if (!item) return null;
    var d =
        item.VerifiedON !== undefined && item.VerifiedON !== null
            ? item.VerifiedON
            : item.VerifiedOn !== undefined && item.VerifiedOn !== null
              ? item.VerifiedOn
              : item["Verified ON"] !== undefined && item["Verified ON"] !== null
                ? item["Verified ON"]
                : item["Verified On"];
    return d === undefined ? null : d;
}
function pad2VendorDate(n) {
    return n < 10 ? "0" + n : String(n);
}
/** Verified ON shown as dd/mm/yyyy (local calendar date). */
function formatDateDdMmYyyy(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return "";
    return pad2VendorDate(d.getDate()) + "/" + pad2VendorDate(d.getMonth() + 1) + "/" + d.getFullYear();
}
function formatVendorVerifiedOnDisplay(val) {
    if (val === null || val === undefined || val === "") return "";
    if (typeof val === "number" && isFinite(val)) {
        return formatDateDdMmYyyy(new Date(val));
    }
    if (typeof val === "string") {
        var t = val.trim();
        if (!t) return "";
        var parsed = Date.parse(t);
        if (!isNaN(parsed)) return formatDateDdMmYyyy(new Date(parsed));
        return t;
    }
    if (val instanceof Date) return formatDateDdMmYyyy(val);
    return String(val);
}
function showVendorVerifyDetailFromBadge(el) {
    var enc = el.getAttribute("data-vm-verify-info");
    if (!enc) return;
    var txt = decodeURIComponent(enc);
    var oneLine = txt.replace(/\s*\n+\s*/g, " · ");
    if (typeof toastr !== "undefined") {
        toastr.info(oneLine, "Verification", { timeOut: 5500 });
    } else {
        window.alert(txt);
    }
}

/** Verified badge; desktop: title tooltip. Touch/mobile: tap opens toastr (native title is unreliable on touch). */
function buildVerifiedBadgeHtml(item) {
    var by = getVendorVerifiedByDisplay(item);
    var on = formatVendorVerifiedOnDisplay(getVendorVerifiedOnRaw(item));
    var parts = [];
    if (by) parts.push("Verify By: " + by);
    if (on) parts.push("Verified ON: " + on);
    var titleAttr = parts.length ? ' title="' + escapeVendorAttr(parts.join(" · ")) + '"' : "";
    var dataAttr = "";
    var a11y = "";
    var extraClass = "";
    if (parts.length) {
        extraClass = " vm-verify-status--with-detail";
        dataAttr = ' data-vm-verify-info="' + encodeURIComponent(parts.join("\n")) + '"';
        a11y =
            ' role="button" tabindex="0" aria-label="' +
            escapeVendorAttr(parts.join(". ")) +
            '"';
    }
    return (
        '<span class="vm-verify-status vm-verify-status--done' +
        extraClass +
        '"' +
        titleAttr +
        dataAttr +
        a11y +
        ">Verified</span>"
    );
}
function updateVendorMasterStats(rows) {
    var list = Array.isArray(rows) ? rows : [];
    var total = list.length;
    var verified = 0;
    for (var i = 0; i < list.length; i++) {
        if (rowIsVerified(list[i])) verified++;
    }
    var pending = total - verified;
    $("#vmStatTotal").text(total);
    $("#vmStatVerified").text(verified);
    $("#vmStatPending").text(pending);
}

/** Silent check: Verify column if user has Verify right (Vendor Master or Client Master — uses G_ModuleName). */
function resolveVendorVerifyRight() {
    var FinYear = getFinancialYear();
    return MenuService.CheckModuleOptionRight(G_ModuleName, "Verify", "N", FinYear)
        .then(function (response) {
            window.G_VendorHasVerifyRight = response && response.CheckModuleOptionRight === "Y";
        })
        .catch(function () {
            window.G_VendorHasVerifyRight = false;
        });
}

window.G_VendorMasterSourceRows = window.G_VendorMasterSourceRows || [];

window.G_VendorStatFilter = window.G_VendorStatFilter || "all";
function filterVendorRowsByStat(rows, mode) {
    var list = Array.isArray(rows) ? rows : [];
    if (!window.G_PartyVerificationBeforeOrderY) return list.slice();
    if (mode === "verified") return list.filter(function (r) { return rowIsVerified(r); });
    if (mode === "pending") return list.filter(function (r) { return !rowIsVerified(r); });
    return list.slice();
}
function mapVendorRowsToGrid(rows) {
    return rows.map(function (item) {
        var verifyCell = "";
        if (shouldShowVendorPartyVerifyColumn()) {
            verifyCell = rowIsVerified(item)
                ? buildVerifiedBadgeHtml(item)
                : '<button type="button" class="vm-btn-verify" onclick="VerifyVendor(' +
                  item.Code +
                  ')"><i class="fas fa-check"></i></button>';
        }

        if (G_IsClientOrVendor === "C") {
            var clientPatch = {};
            if (shouldShowVendorPartyVerifyColumn()) {
                clientPatch.Verify = verifyCell;
            }
            return Object.assign({}, item, clientPatch);
        }

        var btns =
            '<button class="vm-btn-view" title="View" onclick="ViewVendor(' + item.Code + ')">' +
            '<i class="fas fa-eye"></i>' +
            "</button>" +
            '<button class="vm-btn-edit" title="Edit" onclick="EditVendor(' + item.Code + ')">' +
            '<i class="fas fa-pen"></i>' +
            "</button>" +
            '<button class="vm-btn-delete" title="Delete" onclick="ConfirmVendorDelete(' + item.Code + ')">' +
            '<i class="fas fa-trash-can"></i>' +
            "</button>";
        var patch = {};
        if (shouldShowVendorPartyVerifyColumn()) {
            patch.Verify = verifyCell;
        }
        patch.Action = btns;
        return Object.assign({}, item, patch);
    });
}
function applyVendorMasterClientModeUi() {
    var $btn = $("#vmBtnNewVendor");
    if (!$btn.length) return;
    if (G_IsClientOrVendor === "C") {
        $btn.hide();
    } else {
        $btn.show();
    }
}
function getVendorMasterHiddenColumns() {
    var cols = [
        "Code",
        "Short Code",
        "Category",
        "Active",
        "PAN No",
        "Verified",
        "CityMaster_Code",
        "StateMaster_Code",
        "CountryMaster_Code",
        "VerifiedBy",
        "VerifiedByName",
        "VerifiedByDesp",
        "VerifiedON",
        "VerifiedOn",
        "Verify By",
        "Verified By",
        "Verified ON",
        "Verified On",
    ];
    if (G_IsClientOrVendor === "C") {
        cols.push("Action");
    }
    if (!window.G_PartyVerificationBeforeOrderY) {
        cols.push("Verify");
    }
    return cols;
}
function getVendorMasterColumnAlignment() {
    var ca = {};
    if (shouldShowVendorPartyVerifyColumn()) {
        ca.Verify = "center;min-width:96px;white-space:nowrap;";
    }
    if (G_IsClientOrVendor === "V") {
        ca.Action = "center;min-width:120px;white-space:nowrap;";
    }
    return ca;
}
function syncVendorStatChipClasses() {
    if (!window.G_PartyVerificationBeforeOrderY) return;
    var mode = window.G_VendorStatFilter || "all";
    $("#vendorMasterStatsStrip .vm-stat-chip[data-vm-filter]")
        .removeClass("vm-stat-chip--active")
        .attr("aria-pressed", "false");
    $('#vendorMasterStatsStrip .vm-stat-chip[data-vm-filter="' + mode + '"]')
        .addClass("vm-stat-chip--active")
        .attr("aria-pressed", "true");
}
function refreshVendorMasterGrid() {
    var source = window.G_VendorMasterSourceRows || [];
    var mode = window.G_VendorStatFilter || "all";
    if (source.length === 0) return;

    var filtered = filterVendorRowsByStat(source, mode);
    var mapped = mapVendorRowsToGrid(filtered);

    const StringFilterColumn = ["Account Name", "GSTN No", "Phone", "Email", "City", "State", "Country", "Pin Code"];
    const NumericFilterColumn = [];
    const DateFilterColumn = [];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = getVendorMasterHiddenColumns();
    const ColumnAlignment = getVendorMasterColumnAlignment();

    if (typeof window.columnFilters === "object" && window.columnFilters !== null) {
        window.columnFilters = {};
    }

    if (mapped.length === 0) {
        window.filteredData_VendorMaster = [];
        window.filteredDataTemp_VendorMaster = [];
        window.currentPage_VendorMaster = 1;
        var colCount = $("#VendorMaster-header th:visible").length;
        if (!colCount) colCount = 1;
        $("#VendorMaster-body").html(
            '<tr><td colspan="' +
                colCount +
                '" style="text-align:center;padding:28px;color:#6b7280;">No data found</td></tr>'
        );
        $("#VendorMaster-header").find("th span.filter-table-heading .fa-filter").remove();
        if (typeof window.updatePageInfo === "function") window.updatePageInfo("VendorMaster");
        if (typeof window.updateButtons === "function") window.updateButtons("VendorMaster");
        if (typeof window.updateFilteredClass === "function") window.updateFilteredClass("VendorMaster-body");
        syncVendorStatChipClasses();
        return;
    }

    BizsolCustomFilterGrid.CreateDataTable(
        "VendorMaster-header",
        "VendorMaster-body",
        mapped,
        Button,
        showButtons,
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        ColumnAlignment
    );
    syncVendorStatChipClasses();
}
function GetVendorMasterList() {

        VendorMasterService.GetSolarVendorMasterList(G_IsClientOrVendor).then(function (response) {
        var rows = [];
        if (Array.isArray(response)) rows = response;
        else if (Array.isArray(response.data)) rows = response.data;
        else if (Array.isArray(response.Data)) rows = response.Data;

        updateVendorMasterStats(rows);
        window.G_VendorMasterSourceRows = rows;
        window.G_VendorStatFilter = "all";

        if (rows.length > 0) {
            $("#tblVendorMaster").show();
            refreshVendorMasterGrid();
        } else {
            toastr.warning("No vendors found. Add your first vendor!");
            $("#tblVendorMaster").hide();
        }
    }).catch(function () {
        updateVendorMasterStats([]);
        window.G_VendorMasterSourceRows = [];
        toastr.error("Failed to load vendor list.");
    });
}
function OpenNewVendor() {
    G_EditCode = 0;
    ClearVendorForm();
    $("#vmFormModalTitle").text("Add New Vendor");
    $("#vmBtnSaveText").text("Save Vendor");
    $("#vendorDialogBackdrop").addClass("show");
    setTimeout(function () { $("#AccountDesp").focus(); }, 140);
}
function EditVendor(code) {
    var ModuleName = G_ModuleName,
        OptionName = "Edit",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            toastr.error((response && response.Msg) || "Permission denied.");
            return;
        }

        G_EditCode = code;
        ClearVendorForm();
        $("#vmFormModalTitle").text("Edit Vendor");
        $("#vmBtnSaveText").text("Update Vendor");

        VendorMasterService.GetSolarVendorMasterByCode(code).then(function (res) {
            // ── Handle API response (multiple structures) ─────────────────
            var raw = res && (res.data || res.Data || res);
            var item = null;
            var list = raw && (raw.VendorMaster || raw.VendorMasterList);
            if (list && Array.isArray(list) && list.length > 0) {
                item = list[0];
            } else if (Array.isArray(raw) && raw.length > 0) {
                // API may return [resultSet1, resultSet2, resultSet3]
                if (Array.isArray(raw[0]) && raw[0].length > 0) {
                    item = raw[0][0];
                } else {
                    item = raw[0];
                }
            } else if (raw && typeof raw === 'object' && raw.AccountDesp !== undefined) {
                item = raw;
            }

            if (!item) {
                toastr.error("Failed to load vendor data.");
                console.warn("EditVendor: Unexpected API response", res);
                return;
            }

            // ── ContactPerson: check multiple possible locations (3rd result set) ────────────
            var cpList = (raw && (raw.AccountContactPersonDetail || raw.accountContactPersonDetail || raw.Table3)) || (Array.isArray(raw) && raw[2]);
            var cp = (Array.isArray(cpList) && cpList.length > 0) ? cpList[0] : null;
            if (!cp && Array.isArray(raw) && raw.length >= 3 && Array.isArray(raw[2])) {
                cp = raw[2][0] || null;  // result set 3 = ContactPerson
            }
            if (cp) {
                $("#ContactPersonName").val(cp.ContactPersonName || "");
                $("#ContactPersonDesignation").val(cp.ContactPersonDesignation || "");
                $("#ContactPersonMobile").val(cp.ContactPersonMobile || "");
                $("#ContactPersonEMail").val(cp.ContactPersonEMail || "");
            }

            // ── BankAccount: check multiple possible locations (2nd result set) ─────────────
            var bkList = (raw && (raw.BankAccountDetail || raw.bankAccountDetail || raw.Table2)) || (Array.isArray(raw) && raw[1]);
            var bk = (Array.isArray(bkList) && bkList.length > 0) ? bkList[0] : null;
            if (!bk && Array.isArray(raw) && raw.length >= 2 && Array.isArray(raw[1])) {
                bk = raw[1][0] || null;  // result set 2 = BankAccount
            }
            if (bk) {
                $("#BankName").val(bk.BankName || bk.bankName || "");
                $("#BankAddress").val(bk.Address || bk.address || "");
                $("#AccountNo").val(bk.AccountNo || bk.accountNo || "");
                $("#IFSCCode").val(bk.IFSCCode || bk.ifscCode || "");
                $("#Refrence").val(bk.Refrence || bk.refrence || "");
            }

            console.log("EditVendor: BankDetail count=" + (bkList ? bkList.length : 0) + ", ContactDetail count=" + (cpList ? cpList.length : 0));

            // ── VendorMaster fields ──────────────────────────────────
            $("#AccountDesp").val(item.AccountDesp || "");
            $("#BillName").val(item.BillName || "");
            $("#GSTNNo").val(item.GSTNNo || "");
            $("#EMail").val(item.EMail || "");
            $("#PhoneNo").val(item.PhoneNo || "");
            $("#Address1").val(item.Address1 || "");
            $("#PinCode").val(item.PinCode || "");
            $("#Nature").val(item.AccountNature || "");

            var stateCode = item.StateMaster_Code != null ? String(item.StateMaster_Code) : "";
            var cityCode = item.CityMaster_Code != null ? String(item.CityMaster_Code) : "";
            var nationCode = item.CountryMaster_Code != null ? String(item.CountryMaster_Code) : "";

            // ── Show modal AFTER data is loaded ──────────────────────────
            $("#vendorDialogBackdrop").addClass("show");

            // ── Set dropdowns (Nation → State → City) ────────────────────
            setTimeout(function () {
                if (nationCode) $("#Nation").val(nationCode).trigger("change");
                setTimeout(function () {
                    if (stateCode) $("#State").val(stateCode).trigger("change");
                    setTimeout(function () {
                        if (cityCode) $("#City").val(cityCode).trigger("change");
                        setTimeout(function () { $("#AccountDesp").focus(); }, 100);
                    }, 100);
                }, 100);
            }, 50);
        }).catch(function (err) {
            console.error("EditVendor API error:", err);
            toastr.error("Error loading vendor data. Please try again.");
        });
    }).catch(function (err) {
        console.error("EditVendor permission check error:", err);
        toastr.error("Permission check failed.");
    });
}
function ViewVendor(code) {
    var ModuleName = G_ModuleName,
        OptionName = "View",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        }
        else {

            G_ViewCode = code;

            VendorMasterService.GetSolarVendorMasterByCode(code).then(function (res) {
                var raw = res && (res.data || res.Data || res);
                var list = raw && (raw.VendorMaster || raw.VendorMasterList);
                var item = (list && list.length > 0) ? list[0] : (Array.isArray(raw) ? raw[0] : raw);
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
                $("#vf_VendorName").text(item.AccountDesp || "—");
                $("#vf_DisplayName").text(item.BillName || "—");
                $("#vf_Address1").text(item.Address1 || "—");
                $("#vf_Pincode").text(item.PinCode || "—");
                $("#vf_GSTNo").text(item.GSTNNo || "—");
                $("#vf_EMail").text(item.EMail || "—");
                $("#vf_PhoneNo").text(item.PhoneNo || "—");
                $("#vf_State").text(item.State || "—");
                $("#vf_City").text(item.City || "—");
                $("#vf_Nation").text(item.Nation || "—");

                // Contact Person (3rd result set)
                var cpList = raw.AccountContactPersonDetail || raw.accountContactPersonDetail || raw.Table3 || raw[2];
                var cp = (Array.isArray(cpList) && cpList.length > 0) ? cpList[0] : null;
                $("#vf_ContactPersonName").text(cp && cp.ContactPersonName ? cp.ContactPersonName : "—");
                $("#vf_ContactPersonDesignation").text(cp && cp.ContactPersonDesignation ? cp.ContactPersonDesignation : "—");
                $("#vf_ContactPersonMobile").text(cp && cp.ContactPersonMobile ? cp.ContactPersonMobile : "—");
                $("#vf_ContactPersonEMail").text(cp && cp.ContactPersonEMail ? cp.ContactPersonEMail : "—");

                // Bank Details (2nd result set)
                var bkList = raw.BankAccountDetail || raw.bankAccountDetail || raw.Table2 || raw[1];
                var bk = (Array.isArray(bkList) && bkList.length > 0) ? bkList[0] : null;
                $("#vf_BankName").text(bk && (bk.BankName || bk.bankName) ? (bk.BankName || bk.bankName) : "—");
                $("#vf_BankAddress").text(bk && (bk.Address || bk.address) ? (bk.Address || bk.address) : "—");
                $("#vf_AccountNo").text(bk && (bk.AccountNo || bk.accountNo) ? (bk.AccountNo || bk.accountNo) : "—");
                $("#vf_IFSCCode").text(bk && (bk.IFSCCode || bk.ifscCode) ? (bk.IFSCCode || bk.ifscCode) : "—");

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

        }
    });
}

function VerifyVendor(code) {
    if (!window.G_PartyVerificationBeforeOrderY) {
        toastr.warning("Party verification is not enabled in fixed parameters.");
        return;
    }
    if (!window.G_VendorHasVerifyRight) {
        toastr.warning("You do not have Verify permission.");
        return;
    }
    G_VendorVerifyCode = code;
    var isClient = G_IsClientOrVendor === "C";
    var noun = isClient ? "client" : "vendor";
    $("#vmVerifyConfirmTitle").text("Verify this " + noun + "?");
    $("#vmVerifyConfirmText").text("This will mark the " + noun + " as verified.");
    $("#vmVerifyConfirmBackdrop").addClass("show");
}

function CloseVendorVerifyModal() {
    G_VendorVerifyCode = 0;
    $("#vmVerifyConfirmBackdrop").removeClass("show");
}

function DoVendorVerify() {
    var code = G_VendorVerifyCode;
    if (!code) {
        CloseVendorVerifyModal();
        return;
    }
    if (!window.G_PartyVerificationBeforeOrderY) {
        toastr.warning("Party verification is not enabled in fixed parameters.");
        CloseVendorVerifyModal();
        return;
    }
    var ModuleName = G_ModuleName,
        OptionName = "Verify",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight === "N") {
            toastr.error(response.Msg);
            CloseVendorVerifyModal();
            return;
        }
        VendorMasterService.VerifySolarVendorMaster(code)
            .then(function (res) {
                var ok = res && (res.Status === "Y" || res.status === "Y");
                if (ok) {
                    CloseVendorVerifyModal();
                    toastr.success(res.Msg || "Verified successfully.");
                    GetVendorMasterList();
                } else {
                    toastr.error((res && (res.Msg || res.message)) || "Verify failed.");
                }
            })
            .catch(function () {
                toastr.error("Verify failed. Please try again.");
            });
    }).catch(function (err) {
        console.error("DoVendorVerify permission check error:", err);
        toastr.error("Permission check failed.");
        CloseVendorVerifyModal();
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
function ConfirmVendorDelete(code) {
    G_EditCode = code;
    $("#vmReasonForDeleteInput").val("");
    $("#vmDeleteConfirmBackdrop").addClass("show");
    setTimeout(function () { $("#vmReasonForDeleteInput").focus(); }, 150);
}
function DoVendorDelete() {
    var ModuleName = G_ModuleName,
        OptionName = "Delete",
        ShowMsg = "Y",
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (response.CheckModuleOptionRight === 'N') {
            toastr.error(response.Msg);
            return;
        } else {
            var reason = $("#vmReasonForDeleteInput").val();
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
function SaveVendor() {
    var isEdit     = G_EditCode > 0;
    var ModuleName = G_ModuleName;
    var OptionName = isEdit ? "Edit" : "New";   // ✔ correct option per mode
    var ShowMsg    = "Y";
    var FinYear    = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear)
        .then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                toastr.error((response && response.Msg) || "You do not have permission to perform this action.");
                return;
            }

            if (!ValidateVendorForm()) return;

            var payload   = BuildVendorPayload();
            var btnSave   = $("#vmBtnSaveVendor");
            var origLabel = $("#vmBtnSaveText").text();

            btnSave.prop("disabled", true);
            $("#vmBtnSaveText").text(isEdit ? "Updating…" : "Saving…");

            VendorMasterService.SaveVendorMaster(payload)
                .then(function (res) {
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
                })
                .catch(function (err) {
                    console.error("SaveVendorMaster error:", err);
                    toastr.error("Server error occurred. Please try again.");
                })
                .finally(function () {
                    btnSave.prop("disabled", false);
                    $("#vmBtnSaveText").text(origLabel);
                });
        })
        .catch(function (err) {
            console.error("CheckModuleOptionRight error:", err);
            toastr.error("Permission check failed. Please refresh and try again.");
        });
}
function BuildVendorPayload() {
    var vendorCode = parseInt(G_EditCode) || 0;

    return {
        VendorMaster: [
            {
                // ── Primary Key ──────────────────────────────────────────
                Code: vendorCode,

                // ── Form Fields (from VendorMaster.cshtml) ───────────────
                AccountDesp: $("#AccountDesp").val(),
                BillName: $("#BillName").val(),
                GSTNNo: $("#GSTNNo").val(),
                EMail: $("#EMail").val(),
                PhoneNo: $("#PhoneNo").val(),
                City: $("#City option:selected").text(),
                State: $("#State option:selected").text(),
                Nation: $("#Nation option:selected").text(),
                PinCode: $("#PinCode").val(),
                AccountNature: $("#Nature").val(),

                // ── Default Values (not in form) ─────────────────────────
                Address1: $("#Address1").val(),
                Address2: "",
                Zone: "",
                DespWithoutSpaces: "",
                FaxNo: "",
                WebSite: "",
                CSTNo: "",
                STNo: "",
                ECCNo: "",
                RangeDivision: "",
                VatNo: "",
                ServiceTaxNo: "",
                PANNo: "",
                TANNo: "",
                AadhaarNo: "",
                EXIMCode: "",
                DrugLicenseNoAnddate: "",
                MSMEType: "",
                MSMENo: "",
                Client: "N",
                Vendor: "Y",
                JobWorker: "N",
                Transporter: "N",
                Contractor: "N",
                Investor: "N",
                IsAgent: "N",
                IsProspectiveCustomer: "N",
                AccountType: "",
                AccountCategory: "",
                AccountShortCode: "",
                AccountNameForIT: "",
                AccountNo: "",
                BankActID: "",
                TransferClosingBalance: "Y",
                MasterAccountCode: 0,
                CodeinFactoryDB: 0,
                MaintainBillWise: "N",
                MaintainInForeignCurrency: "N",
                OpeningSource: "C",
                LedgerSorting: "",
                AccountMasterHistory: "",
                LedgerGroupMISMaster_Code: 0,
                AccountPrintInCommInvoice: "",
                DepreciationRateCompanyAct: 0,
                DepreciationRateIncomeTaxAct: 0,
                BankMaster_Code: 0,
                DefaultBankMaster_Code: 0,
                F_BankChequeTypeMaster_Code: 0,
                F_BankRTGSMaster_Code: 0,
                CreditLimit: 0,
                TDSApplicable: "N",
                TDSProvisionsAs: "Basic",
                TCSApplicable: "N",
                TCSRate: 0,
                GSTApplicableDate: null,
                IsSEZSupply: "N",
                GSTRFrequency: "Q",
                IsUnRegisterGSTNo: "N",
                PartyExcemptionNo: "",
                DivisionMaster_Code: 0,
                SubDivisionMaster_Code: 0,
                BranchMaster_Code: 0,
                AccountCodeinBranch: 0,
                BranchCode: "",
                GroupNo: 0,
                GroupTypeMaster_Code: 0,
                CostCentreCategoryMaster_Code: 0,
                CostCenterMendatory: "N",
                AccountMaster_Code_MasterGroup: 0,
                AccountMaster_CodeDebitCredit: 0,
                AccountMaster_CodeScheme: 0,
                ServiceProviderNatureMaster_Code: 0,
                ServiceProviderMaster_Code: 0,
                MRNWithoutPO: "",

                // ── Audit ────────────────────────────────────────────────
                UserID: G_UserMasterCode,
                CreateDate: null,
                UpdateDate: null,
                FinYear: getFinancialYear(),
                UpdatedBy: G_UserMasterCode,
                DatabaseLocation_Code: null,

                ZoneMaster_Code: 0,
                AreaMaster_Code: 0,
                Verified: "N",
                VerifiedBy: 0,
                VerifiedON: null,
                CountryMaster_Code: $("#Nation").val(),
                StateMaster_Code: $("#State").val(),
                CityMaster_Code: $("#City").val(),
                CityMaster_CodeFreight: 0,
                DistributorMaster_Code: 0,
                SalesAccountCode: 0,
                PriceListTypeMaster_Code: 0,
                DiscountGroupMaster_Code: 0,
                SpecialDiscountPercent: 0,
                FreightDiscountPercent: 0,
                VendorCode: "",
                PreferredTransport: "",
                RoadPermitApplicable: "N",
                Distance: 0,
                AllowOnlyFreightAccountProvisionInInvoice: "N",
                IndustryTypeMaster_Code: 0,
                F_CommonValues_Priority_Code: 0,
                F_CommonValues_Code_Grade: 0,
                EmailInvoiceCopy: "N",
                LanguageMaster_Code: 0,
                CurrencyMaster_Code: 0,
                ClientPassword: "",
                F_Common_ClientVendor_Code_Status: 0,
                F_Common_ClientVendor_Code_PaymentTerms: 0,
                F_Common_ClientVendor_Code_PaymentMode: 0,
                Access: "",
                CustomerSource: "",
                NameofExhibition: "",
                PortOfDischarge: "",
                YearofExhibition: "",
                PortOfLoiding: "",
                CMSCode: "",
                AirlineMaster_Code_Prefered: 0,
                AirlineMaster_Code_Optional: 0,
                FreightForwarderMaster_Code: 0,
                CommissionAgent: "",
                ShowDlvryAddasByrAndCons: "N",
                AllowInvoiceWOPackingList: "Y",
                LinkedAccountMaster_Code: 0,
                BudgetApplicable: "N",
                BudgetPeriod: "",
                Marka: "",
                IsActive: "Y",
                IsActiveMobileApp: "Y",
                CostCenterMandatory: "N",
                BillDetailApplicableInGRBill: "N",
                OutSideLocalArea: "N",
                ForDomesticUseOnly: "N",
                RateDetailApplicable: "N",
                RemarksDSP: "",
                PPCPersonMaster_Code: 0,
                DealerSince: "",
                CityType: "",
                FileNo: "",
                SortCodePreFix: "",
                ABCCode: "",
                TransactionType: "",
                Ratings: "",
                InsuranceChargesApplicable: "N",
                LastCalsulateOnCD: null,
                MonthlyGovermentDues: "N",
                DueDaysForGovermentDues: 0,
                ReminderDaysForGovermentDues: 0,
                InterestRateValue: 0,
                RelationWithCustomer: "",
                RelativeName: "",
                WitnessName1: "",
                RelationWithWitness1: "",
                RelativeNameWitness1: "",
                WitnessAddress1: "",
                WitnessName2: "",
                RelationWithWitness2: "",
                RelativeNameWitness2: "",
                WitnessAddress2: "",
                CRNNo_ByThirdParty: "",
                ACNo_ByThirdParty: "",
                TransNo_ByThirdParty: "",
                OtherStatus: ""
            }
        ],

        // ── Contact Person Detail (Code is IDENTITY - do not send) ─────
        AccountContactPersonDetail: [
            {
                AccountMaster_Code: vendorCode,
                ContactPersonName: $("#ContactPersonName").val(),
                ContactPersonDesignation: $("#ContactPersonDesignation").val(),
                ContactPersonExt: "",
                ContactPersonMobile: $("#ContactPersonMobile").val(),
                ContactPersonEMail: $("#ContactPersonEMail").val(),
                ContactPersonSkypeId: "",
                CountryCode: "91",
                DOB: null,
                DOA: null,
                Default: "N",
                DepartmentMaster_Code: 0
            }
        ],

        // ── Bank Account Detail (Code is IDENTITY - do not send) ───────
        BankAccountDetail: [
            {
                AccountMaster_Code: vendorCode,
                BankName: $("#BankName").val(),
                Address: $("#BankAddress").val(),
                AccountNo: $("#AccountNo").val(),
                IFSCCode: $("#IFSCCode").val(),
                BeneficiaryCode: "",
                SWIFTCode: "",
                Refrence: $("#Refrence").val(),
                Default: "N",
                Verified: "N",
                VerifiedBy: 0,
                VerifiedOn: null
            }
        ],

        UserMasterCode: G_UserMasterCode
    };
}
function ValidateVendorForm() {
    var valid = true;

    // Vendor Name — required
    var nameEl = $("#AccountDesp");
    var nameErr = $("#err_AccountDesp");
    if (!nameEl.val()) {
        nameErr.css("display", "flex");
        nameEl.addClass("vm-input-error");
        nameEl.focus();
        valid = false;
        console.warn("Validation failed: AccountDesp is empty");
    } else {
        nameErr.hide();
        nameEl.removeClass("vm-input-error");
    }

    // Pincode — optional but if filled must be 6 digits
    var pinVal = $("#PinCode").val();
    if (pinVal && !/^\d{6}$/.test(pinVal)) {
        $("#err_PinCode").css("display", "flex");
        $("#PinCode").addClass("vm-input-error");
        valid = false;
        console.warn("Validation failed: PinCode invalid:", pinVal);
    } else {
        $("#err_PinCode").hide();
        $("#PinCode").removeClass("vm-input-error");
    }

    if (!validateGST(true))      { valid = false; console.warn("Validation failed: GSTNNo"); }
    if (!validatePhone(true))    { valid = false; console.warn("Validation failed: PhoneNo"); }
    if (!validateCPMobile(true)) { valid = false; console.warn("Validation failed: ContactPersonMobile"); }
    if (!validateCPEmail(true))  { valid = false; console.warn("Validation failed: ContactPersonEMail"); }

    console.log("ValidateVendorForm result:", valid);
    return valid;
}
function validateGST(showError) {
    var gstVal = $("#GSTNNo").val();
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
function validatePhone(showError) {
    var phoneVal = $("#PhoneNo").val();
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
function validateCPMobile(showError) {
    var val = $("#ContactPersonMobile").val();
    if (!val) {
        $("#err_ContactPersonMobile").hide();
        $("#err_PhoneNo").hide();
        $("#ContactPersonMobile").removeClass("vm-input-error");
        return true;
    }
    var pattern = /^[6-9]\d{9}$/;
    if (!pattern.test(val)) {
        if (showError) {
            $("#err_ContactPersonMobile").css("display", "flex");
            $("#err_PhoneNo").css("display", "flex");
            $("#ContactPersonMobile").addClass("vm-input-error");
            $("#PhoneNo").addClass("vm-input-error");
        }
        return false;
    }
    $("#err_ContactPersonMobile").hide();
    $("#err_PhoneNo").hide();
    $("#ContactPersonMobile").removeClass("vm-input-error");
    $("#PhoneNo").removeClass("vm-input-error");
    return true;
}
function validateCPEmail(showError) {
    var val = $("#ContactPersonEMail").val();
    if (!val) {
        $("#err_ContactPersonEMail").hide();
        $("#ContactPersonEMail").removeClass("vm-input-error");
        return true;
    }
    var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(val)) {
        if (showError) {
            $("#err_ContactPersonEMail").css("display", "flex");
            $("#ContactPersonEMail").addClass("vm-input-error");
        }
        return false;
    }
    $("#err_ContactPersonEMail").hide();
    $("#ContactPersonEMail").removeClass("vm-input-error");
    return true;
}
function ClearVendorForm() {
    // VendorMaster fields
    ["AccountDesp", "BillName", "GSTNNo", "EMail", "PhoneNo", "Address1", "City", "State", "Nation", "PinCode"].forEach(function (id) {
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

    // Nature dropdown
    $("#Nature").val("");

    // ContactPerson fields
    $("#ContactPersonName").val("");
    $("#ContactPersonDesignation").val("");
    $("#ContactPersonMobile").val("").removeClass("vm-input-error");
    $("#PhoneNo").val("").removeClass("vm-input-error");
    $("#err_ContactPersonMobile").hide();
    $("#err_PhoneNo").hide();
    $("#ContactPersonEMail").val("").removeClass("vm-input-error");
    $("#EMail").val("").removeClass("vm-input-error");
    $("#err_ContactPersonEMail").hide();
    $("#err_EMail").hide();

    // BankAccount fields
    $("#BankName").val("");
    $("#BankAddress").val("");
    $("#AccountNo").val("");
    $("#IFSCCode").val("");
    $("#Refrence").val("");

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
    $("#vmSuccessModalText").text(text || "Operation completed successfully.");
    $("#vmSuccessModalIcon")
        .removeClass()
        .addClass("fas " + (iconClass || "fa-circle-check"));
    $("#vmSuccessBackdrop").addClass("show");
}
function CloseVendorSuccessModal() {
    $("#vmSuccessBackdrop").removeClass("show");
}
function getFinancialYear() {
    var d = new Date();
    var month = d.getMonth();
    var year = d.getFullYear();
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

window.OpenNewVendor = OpenNewVendor;
window.EditVendor = EditVendor;
window.ViewVendor = ViewVendor;
window.VerifyVendor = VerifyVendor;
window.CloseVendorVerifyModal = CloseVendorVerifyModal;
window.DoVendorVerify = DoVendorVerify;
window.CloseVendorViewModal = CloseVendorViewModal;
window.EditFromVendorView = EditFromVendorView;
window.ConfirmVendorDelete = ConfirmVendorDelete;
window.DoVendorDelete = DoVendorDelete;
window.SaveVendor = SaveVendor;
window.CloseVendorSuccessModal = CloseVendorSuccessModal;
