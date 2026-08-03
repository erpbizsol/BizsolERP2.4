import { LeadMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_LeadMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

function setVerifyCloseEnquiryHeading() {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    if (!$('#ERPHeading').text().trim()) {
        $('#ERPHeading').text('Verify Close Enquiry');
    }
    // Keep page card title in sync with dynamic menu heading
    var heading = ($('#ERPHeading').text() || '').trim() || 'Verify Close Enquiry';
    $('.vce-header h5').each(function () {
        var $h = $(this);
        var $icon = $h.find('.vce-title-icon').first().detach();
        $h.empty();
        if ($icon.length) $h.append($icon);
        $h.append(document.createTextNode(' ' + heading));
    });
}

$(document).ready(function () {
    setVerifyCloseEnquiryHeading();
    LoadCloseEnquiryVerifyList();
});

function isPendingStatus(status) {
    var s = String(status ?? "").trim().toLowerCase();
    return s === "p" || s === "pending" || s === "";
}

function normalizeApiResult(response) {
    if (Array.isArray(response)) return response[0] || response;
    return response || {};
}

function renderEmptyState() {
    $("#table-header").empty();
    $("#table-body").html(
        "<tr><td colspan='12' class='vce-empty'>" +
        "<i class='fa fa-inbox'></i>No matching records found" +
        "</td></tr>"
    );
}

function escapeHtml(text) {
    return String(text == null ? "" : text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function breakTextEveryNChars(text, n) {
    var s = String(text == null ? "" : text);
    if (!s || s.length <= n) return escapeHtml(s);
    var parts = [];
    for (var i = 0; i < s.length; i += n) {
        parts.push(escapeHtml(s.slice(i, i + n)));
    }
    return parts.join("<br>");
}

function applyOurRemarkColumnBreak() {
    var headers = document.querySelectorAll("#table-header th");
    var colIdx = -1;
    for (var i = 0; i < headers.length; i++) {
        var t = (headers[i].textContent || "").replace(/\s+/g, "").toUpperCase();
        if (t === "OURREMARK" || t === "OURREMARKS") {
            colIdx = i;
            break;
        }
    }
    if (colIdx < 0) return;
    if (headers[colIdx]) headers[colIdx].classList.add("vce-col-remark-wrap");
    document.querySelectorAll("#table-body tr").forEach(function (row) {
        var tds = row.querySelectorAll("td");
        if (tds.length <= colIdx) return;
        var td = tds[colIdx];
        td.classList.add("vce-col-remark-wrap");
        if (td.dataset.vceTextBroken === "1") return;
        var plain = (td.textContent || "").trim();
        if (plain.length > 50) {
            td.innerHTML = breakTextEveryNChars(plain, 50);
        }
        td.dataset.vceTextBroken = "1";
    });
}

function LoadCloseEnquiryVerifyList() {
    LeadMasterService.GetCloseEnquiryVerifyList().then(function (response) {
        if (!response || !Array.isArray(response) || response.length === 0) {
            renderEmptyState();
            return;
        }

        const stringFilterColumn = [
            "Enquiry No", "Person Name", "Company Name", "City", "Sales Person",
            "Contact No", "Status", "Lead Type", "Our Remark", "Verify Status"
        ];
        const numericFilterColumn = [];
        const dateFilterColumn = ["Enquiry Date", "Close Date", "Followup Date"];
        const button = false;
        const showButtons = [];
        const stringDoubleFilterColumn = [];
        const hiddenColumns = [
            "Code", "EnquiryMaster_Code", "EnquiryFollowUp_Code", "UserMaster_Code",
            "MarketingPersonMaster_Code", "UserID", "VerifiedBy", "VerifiedOn",
            "ReasonForReject", "ReasonForVerify"
        ];
        const ColumnAlignment = {
            Action: "center",
            "Verify Status": "center",
            Status: "center"
        };

        const updatedResponse = response.map(function (item) {
            var code = item.Code ?? item.EnquiryMaster_Code ?? item.EnquiryFollowUp_Code ?? 0;
            var verifyStatus = item["Verify Status"] ?? item.VerifyStatus ?? item.CloseVerifyStatus ?? "";
            var pending = isPendingStatus(verifyStatus);
            var verifyBtn = `<button type="button" class="btn btn-success icon-height" title="Verify" ${pending ? "" : "disabled"} onclick="OpenVerifyCloseAction(${code}, 'verify')"><i class="fa fa-check"></i></button>`;
            var rejectBtn = `<button type="button" class="btn btn-danger icon-height" title="Reject" ${pending ? "" : "disabled"} onclick="OpenVerifyCloseAction(${code}, 'reject')"><i class="fa fa-times"></i></button>`;
            return {
                ...item,
                Action: `<span class="vce-action-wrap">${verifyBtn}${rejectBtn}</span>`
            };
        });

        BizsolCustomFilterGrid.CreateDataTable(
            "table-header",
            "table-body",
            updatedResponse,
            button,
            showButtons,
            stringFilterColumn,
            numericFilterColumn,
            dateFilterColumn,
            stringDoubleFilterColumn,
            hiddenColumns,
            ColumnAlignment
        );
        setTimeout(applyOurRemarkColumnBreak, 80);
    }).catch(function () {
        toastr.error("Error while loading close enquiry list.");
        renderEmptyState();
    });
}

function OpenVerifyCloseAction(Code, action) {
    if (!Code) {
        toastr.error("Invalid record.");
        return;
    }
    var isReject = action === "reject";
    $("#txtVerifyCloseCode").val(Code);
    $("#txtVerifyCloseAction").val(action);
    $("#txtVerifyCloseReason").val("");
    $("#VerifyCloseModalTitle").text(isReject ? "Reject Close Enquiry" : "Verify Close Enquiry");
    $("#VerifyCloseModalHeader").toggleClass("vce-modal-reject", isReject);
    $("#lblVerifyCloseReasonReq").toggle(isReject);
    $("#txtVerifyCloseReason").attr("placeholder", isReject ? "Enter reject reason (required)" : "Enter reason (optional)");
    $("#btnVerifyCloseOk")
        .toggleClass("is-reject", isReject)
        .html(isReject
            ? '<i class="fa fa-times me-1"></i>Reject'
            : '<i class="fa fa-check me-1"></i>Verify');

    var el = document.getElementById("VerifyCloseModal");
    if (!el) {
        toastr.error("Verify modal not found.");
        return;
    }
    var modal = bootstrap.Modal.getOrCreateInstance(el);
    modal.show();
    setTimeout(function () { $("#txtVerifyCloseReason").focus(); }, 200);
}

function ConfirmVerifyCloseAction() {
    var code = $("#txtVerifyCloseCode").val();
    var action = $("#txtVerifyCloseAction").val();
    var reason = ($("#txtVerifyCloseReason").val() || "").trim();

    if (action === "reject" && reason === "") {
        toastr.error("Please enter a reason before rejecting.");
        $("#txtVerifyCloseReason").focus();
        return;
    }

    var apiCall = action === "reject"
        ? LeadMasterService.RejectCloseEnquiry(code, reason)
        : LeadMasterService.VerifyCloseEnquiry(code, reason);

    apiCall.then(function (response) {
        var res = normalizeApiResult(response);
        if (res && (res.Status === "Y" || res.status === "Y")) {
            toastr.success(res.Msg || res.msg || (action === "reject" ? "Rejected successfully." : "Verified successfully."));
            CloseVerifyCloseModal();
            LoadCloseEnquiryVerifyList();
        } else {
            toastr.error((res && (res.Msg || res.msg)) || "Action failed.");
        }
    }).catch(function () {
        toastr.error("An error occurred while processing the request.");
    });
}

function CloseVerifyCloseModal() {
    var el = document.getElementById("VerifyCloseModal");
    var modal = el ? bootstrap.Modal.getInstance(el) : null;
    if (modal) modal.hide();
    $("#txtVerifyCloseReason").val("");
    $("#txtVerifyCloseCode").val("");
    $("#txtVerifyCloseAction").val("");
    $("#VerifyCloseModalHeader").removeClass("vce-modal-reject");
    $("#lblVerifyCloseReasonReq").hide();
}

window.OpenVerifyCloseAction = OpenVerifyCloseAction;
window.ConfirmVerifyCloseAction = ConfirmVerifyCloseAction;
window.CloseVerifyCloseModal = CloseVerifyCloseModal;
window.LoadCloseEnquiryVerifyList = LoadCloseEnquiryVerifyList;
