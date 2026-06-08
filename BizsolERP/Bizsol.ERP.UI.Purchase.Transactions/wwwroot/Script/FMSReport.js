import { FMSReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/FMSReportService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/menuservices.js';

let FrmType = '';
let FrmAction = '';
let G_FMSListRaw = [];
let G_FMSCardPage = 1;
let G_FMSPageSize = 10;

function escapeHtml(s) {
    if (s == null || s === "") return "";
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function rowField(item, keys) {
    if (!item) return "";
    const arr = Array.isArray(keys) ? keys : [keys];
    for (let i = 0; i < arr.length; i++) {
        const k = arr[i];
        if (Object.prototype.hasOwnProperty.call(item, k)) {
            const v = item[k];
            if (v != null && v !== "" && String(v).toLowerCase() !== "null") return String(v);
        }
    }
    for (let i = 0; i < arr.length; i++) {
        const k = arr[i];
        if (Object.prototype.hasOwnProperty.call(item, k)) {
            const v = item[k];
            return v == null || String(v).toLowerCase() === "null" ? "" : String(v);
        }
    }
    return "";
}

function formatINRAmount(val) {
    const raw = String(val ?? "").replace(/,/g, "").trim();
    const n = parseFloat(raw);
    if (isNaN(n)) return val ? escapeHtml(String(val)) : "\u2014";
    return "\u20B9" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function normalizeFMSRow(item) {
    return {
        ...item,
        "Curr. Stk.": item["Curr. Stk."] ? parseFloat(item["Curr. Stk."]).toFixed(3) : "0.000",
        "Last Mon Con.": item["Last Mon Con."] ? parseFloat(item["Last Mon Con."]).toFixed(3) : "0.000",
    };
}

function renderFMSCard(item) {
    const code = rowField(item, ["Code"]);
    const indNo = escapeHtml(rowField(item, ["Ind No", "IndNo"]));
    const itemName = escapeHtml(rowField(item, ["Item Name", "ItemName"]));
    const indentDate = escapeHtml(rowField(item, ["Indent Date", "IndentDate"]));
    const uom = escapeHtml(rowField(item, ["UOM"]));
    const createdBy = escapeHtml(rowField(item, ["Created by", "CreatedBy"]));
    const remarks = escapeHtml(rowField(item, ["Remarks"]));
    const qty = escapeHtml(rowField(item, ["Qty"]) || "\u2014");
    const currStk = escapeHtml(rowField(item, ["Curr. Stk."]) || "0.000");
    const lastMonCon = escapeHtml(rowField(item, ["Last Mon Con."]) || "0.000");
    const unitPrice = escapeHtml(rowField(item, ["Unit Price", "UnitPrice"]) || "\u2014");
    const totalAmount = formatINRAmount(rowField(item, ["Total Amount", "TotalAmount"]));
    const actionLabel = escapeHtml(FrmAction || "Verify");

    const remarksHtml = remarks
        ? '<span class="sopa-tag" title="Remarks"><i class="fa fa-comment-alt" aria-hidden="true"></i> ' + remarks + "</span>"
        : "";

    const createdHtml = createdBy
        ? '<span><i class="fa fa-user" aria-hidden="true"></i> ' + createdBy + "</span>"
        : "";

    const verifyBtn =
        '<button type="button" class="sopa-btn sopa-btn--primary fmsr-js-verify" data-code="' +
        escapeHtml(String(code)) +
        '"><i class="fa fa-check-circle" aria-hidden="true"></i> ' +
        actionLabel +
        "</button>";

    return (
        '<article class="sopa-card" role="listitem">' +
        '<div class="sopa-card-head">' +
        '<div class="sopa-po-badge"><span class="sopa-po-label">Ind No</span><span class="sopa-po-no">' +
        (indNo || "\u2014") +
        "</span></div>" +
        '<div class="sopa-company-block"><div class="sopa-company-title"><i class="fa fa-cube" aria-hidden="true"></i><span>' +
        (itemName || "\u2014") +
        "</span></div>" +
        '<div class="sopa-meta">' +
        '<span><i class="far fa-calendar-alt" aria-hidden="true"></i>' +
        (indentDate || "\u2014") +
        "</span>" +
        (uom ? '<span class="sopa-tag"><i class="fa fa-balance-scale" aria-hidden="true"></i> ' + uom + "</span>" : "") +
        createdHtml +
        remarksHtml +
        "</div></div>" +
        '<div class="sopa-amount-block"><div class="sopa-amount">' +
        totalAmount +
        '</div><span class="sopa-status sopa-status--pending">Pending</span></div></div>' +
        '<div class="sopa-metrics">' +
        '<div class="sopa-metric"><span class="sopa-metric-lbl">Qty</span><span class="sopa-metric-val">' + qty + "</span></div>" +
        '<div class="sopa-metric"><span class="sopa-metric-lbl">Curr. Stk.</span><span class="sopa-metric-val">' + currStk + "</span></div>" +
        '<div class="sopa-metric"><span class="sopa-metric-lbl">Last Mon Con.</span><span class="sopa-metric-val">' + lastMonCon + "</span></div>" +
        '<div class="sopa-metric"><span class="sopa-metric-lbl">Unit Price</span><span class="sopa-metric-val">' + unitPrice + "</span></div>" +
        "</div>" +
        '<div class="sopa-card-foot">' +
        verifyBtn +
        "</div></article>"
    );
}

function renderFMSPaginator(total, page, pageSize) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const p = Math.min(Math.max(1, page), pages);
    const start = total === 0 ? 0 : (p - 1) * pageSize + 1;
    const end = Math.min(p * pageSize, total);
    const $nav = $("#fmsr-cards-paginator");

    if (total === 0) {
        $nav.empty();
        return;
    }

    const disFirst = p <= 1 ? " disabled" : "";
    const disLast = p >= pages ? " disabled" : "";

    $nav.html(
        '<div class="sopa-page-size"><span>Lines per page</span>' +
            '<select id="fmsr-page-size-sel" class="form-control form-control-sm" style="width:auto;display:inline-block">' +
            [10, 20, 50]
                .map(function (n) {
                    return (
                        '<option value="' +
                        n +
                        '"' +
                        (n === pageSize ? " selected" : "") +
                        ">" +
                        n +
                        "</option>"
                    );
                })
                .join("") +
            "</select></div>" +
            '<div class="sopa-paginator__nav">' +
            '<button type="button" class="sopa-paginator__btn fmsr-pg-first"' +
            disFirst +
            ' title="First"><i class="fa fa-angle-double-left"></i></button>' +
            '<button type="button" class="sopa-paginator__btn fmsr-pg-prev"' +
            disFirst +
            ' title="Previous"><i class="fa fa-angle-left"></i></button>' +
            "</div>" +
            '<span class="sopa-paginator__info">' +
            start +
            " \u2013 " +
            end +
            " of " +
            total +
            "</span>" +
            '<div class="sopa-paginator__nav">' +
            '<button type="button" class="sopa-paginator__btn fmsr-pg-next"' +
            disLast +
            ' title="Next"><i class="fa fa-angle-right"></i></button>' +
            '<button type="button" class="sopa-paginator__btn fmsr-pg-last"' +
            disLast +
            ' title="Last"><i class="fa fa-angle-double-right"></i></button>' +
            "</div>"
    );

    $(".fmsr-pg-first")
        .off("click")
        .on("click", function () {
            if (G_FMSCardPage > 1) {
                G_FMSCardPage = 1;
                paintFMSCards();
            }
        });
    $(".fmsr-pg-prev")
        .off("click")
        .on("click", function () {
            if (G_FMSCardPage > 1) {
                G_FMSCardPage--;
                paintFMSCards();
            }
        });
    $(".fmsr-pg-next")
        .off("click")
        .on("click", function () {
            const pg = Math.ceil(total / pageSize);
            if (G_FMSCardPage < pg) {
                G_FMSCardPage++;
                paintFMSCards();
            }
        });
    $(".fmsr-pg-last")
        .off("click")
        .on("click", function () {
            const pg = Math.max(1, Math.ceil(total / pageSize));
            if (G_FMSCardPage !== pg) {
                G_FMSCardPage = pg;
                paintFMSCards();
            }
        });
    $("#fmsr-page-size-sel")
        .off("change")
        .on("change", function () {
            G_FMSPageSize = parseInt($(this).val(), 10) || 10;
            G_FMSCardPage = 1;
            paintFMSCards();
        });
}

function updateFMSStatChips() {
    const pending = G_FMSListRaw.length;
    const el = document.getElementById("statPendingFMS");
    if (el) el.textContent = pending > 0 ? pending : "\u2014";
}

function paintFMSCards() {
    const all = G_FMSListRaw;
    const pageSize = G_FMSPageSize;
    let p = G_FMSCardPage;
    const total = all.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (p > pages) p = pages;
    G_FMSCardPage = p;
    const start = (p - 1) * pageSize;
    const slice = all.slice(start, start + pageSize);
    const $box = $("#FMSReportCards");

    if (!total) {
        $box.html('<p class="sopa-empty">No records to display.</p>');
        $("#fmsr-cards-paginator").empty();
        return;
    }

    $box.html(slice.map(renderFMSCard).join(""));
    renderFMSPaginator(total, G_FMSCardPage, pageSize);
}

function syncPageHeader(menuValue) {
    const title = menuValue && menuValue !== "undefined" && menuValue !== "" ? menuValue : "FMS Report Approval";
    $("#ERPHeading").text(title);
    $("#fmsPageTitle").text(title);
}

$(document).ready(function () {
    var urlParams = getUrlVars();
    var menuValue = decodeURI(urlParams['menu']);
    FrmType = decodeURI(urlParams['FrmType']);
    FrmAction = decodeURI(urlParams['FrmAction']);

    syncPageHeader(menuValue);
    unApprovedFMSReport();

    $(document).on("click", "#FMSReportCards .fmsr-js-verify", function () {
        const code = $(this).attr("data-code");
        if (code) Approval(code);
    });
});

function unApprovedFMSReport() {
    FMSReportService.GetUnApprovedFMSReport(FrmAction, FrmType).then(function (response) {
        if (response && response.length > 0) {
            G_FMSListRaw = response.map(normalizeFMSRow);
            G_FMSCardPage = 1;
            $("#FMSReportList").show();
            updateFMSStatChips();
            paintFMSCards();
        } else {
            toastr.error("No data found:", response);
            G_FMSListRaw = [];
            updateFMSStatChips();
            $("#FMSReportCards").html('<p class="sopa-empty">No records to display.</p>');
            $("#fmsr-cards-paginator").empty();
            $("#FMSReportList").show();
        }
    }).catch(function (error) {
        toastr.error("Error in fetching data:", error);
    });
}

function Approval(Code) {
    var ModuleName = "Indent/Material Requirement (Store)",
        ShowMsg = "Y",
        FinYear = BizSolHelperFunction.getFinancialYear();
    var OptionName = 'Verify';
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (respCheck) {

        if (respCheck.CheckModuleOptionRight == 'N') {
            toastr.error(respCheck.Msg);
            return false;
        } else {
            FMSReportService.FMSReportApproved(Code).then(function (approvedata) {
                if (approvedata.Status === "Y") {
                    toastr.success(approvedata.Message);
                    unApprovedFMSReport();
                    GetWebNotificationList();
                }
                else {
                    toastr.error(approvedata.Message);
                }
            }).catch(function (error) {
                toastr.error("Error in FMSReport Approval: ", error);
            });
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

window.Approval = Approval;
