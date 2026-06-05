import { SaleOrderApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SaleOrderApprovalService.js';
import { BillWiseOutStandingReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BillWiseOutStandingReportService.js';

let FrmType = '';
let FrmAction = '';
let G_BCode = 0;
let G_CheckCreditLimitAmountBase = 'Y';
let G_CheckCreditLimitDaysBase = 'Y';
let CreditLimitCheck_BuyerPO = 'Y';
let SaleOrderApprovalFixedParaMeters = [];
let G_SaleOrderListRaw = [];
let G_SaleOrderCardPage = 1;
let G_SaleOrderPageSize = 10;
let G_CurrentSaleOrderCode = 0;

const SALE_ORDER_DETAIL_GRID_HIDDEN = [
    "BuyerPOMaster_OtherChargesDesp1",
    "BuyerPOMaster_OtherCharges1",
    "BuyerPOMaster_PackingChargeDesp",
    "BuyerPOMaster_PackingChargesValue",
    "BuyerPOMaster_PackingChargesAmount",
    "Freight Condition",
    "FreightCondition",
    "Freight",
    "Marketing Man",
    "MarketingMan",
    "Credit Limit",
    "CreditLimit",
    "Order Date",
    "OrderDate",
];
function pickRowValue(row, keys) {
    if (!row) return "";
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (Object.prototype.hasOwnProperty.call(row, k)) {
            const v = row[k];
            return v === null || v === undefined ? "" : String(v);
        }
    }
    return "";
}
function stripKeysFromRows(rows, keysToStrip) {
    if (!rows || !rows.length) return rows;
    const omit = new Set(keysToStrip);
    return rows.map(function (row) {
        const o = {};
        Object.keys(row).forEach(function (k) {
            if (!omit.has(k)) o[k] = row[k];
        });
        return o;
    });
}
const SALE_ORDER_DELIVERY_TERM_COLUMNS = [
    { label: "Payment Terms Details", keys: ["Payment Terms Details", "PaymentTermsDetails", "Payment Terms"] },
    { label: "Terms of Delivery", keys: ["Terms of Delivery", "TermsOfDelivery"] },
    { label: "Inco Terms", keys: ["Inco Terms", "IncoTerms", "INCO Terms"] },
    { label: "Marketing Man", keys: ["Marketing Man", "MarketingMan"] },
    { label: "Credit Limit", keys: ["Credit Limit", "CreditLimit"] },
];
function formatCreditLimitDisplay(raw) {
    if (raw == null || raw === "") return "";
    const t = String(raw).trim();
    return /days?$/i.test(t) ? t : t + " Days";
}
function buildDeliveryTermsDisplayRows(termsRows, masterRow) {
    if (!termsRows || !termsRows.length) return [];
    return termsRows.map(function (row) {
        const out = {};
        SALE_ORDER_DELIVERY_TERM_COLUMNS.forEach(function (col) {
            let val = pickRowValue(row, col.keys);
            if (col.label === "Marketing Man" && val === "" && masterRow) {
                val = pickRowValue(masterRow, col.keys);
            }
            if (col.label === "Credit Limit") {
                const masterCredit = masterRow ? pickRowValue(masterRow, col.keys) : "";
                if (masterCredit !== "") val = masterCredit;
                val = formatCreditLimitDisplay(val);
            }
            out[col.label] = val;
        });
        return out;
    });
}
function getLineItemColumnKeys(rows) {
    if (!rows || !rows.length) return [];
    const hiddenKeys = new Set([
        "Code", "BuyerPOMaster_Code", "Party Name", "Order No", "Against Rolling", "Order Date", "OrderDate",
    ]);
    SALE_ORDER_DETAIL_GRID_HIDDEN.forEach(function (k) { hiddenKeys.add(k); });
    const keys = [];
    const seen = new Set();
    rows.forEach(function (row) {
        Object.keys(row).forEach(function (k) {
            if (!hiddenKeys.has(k) && !seen.has(k)) {
                seen.add(k);
                keys.push(k);
            }
        });
    });
    return keys;
}
function populateSaleOrderDetailHeaderPanel(row) {
    $("#sod_BuyerPOMaster_OtherChargesDesp1").val(pickRowValue(row, ["BuyerPOMaster_OtherChargesDesp1"]));
    $("#sod_BuyerPOMaster_OtherCharges1").val(pickRowValue(row, ["BuyerPOMaster_OtherCharges1"]));
    $("#sod_BuyerPOMaster_PackingChargeDesp").val(pickRowValue(row, ["BuyerPOMaster_PackingChargeDesp"]));
    $("#sod_BuyerPOMaster_PackingChargesValue").val(pickRowValue(row, ["BuyerPOMaster_PackingChargesValue"]));
    $("#sod_BuyerPOMaster_PackingChargesAmount").val(pickRowValue(row, ["BuyerPOMaster_PackingChargesAmount"]));
    $("#sod_FreightCondition").val(pickRowValue(row, ["Freight Condition", "FreightCondition"]));
    $("#sod_Freight").val(pickRowValue(row, ["Freight"]));
    renderChargesMobilePanel();
}
function clearSaleOrderDetailHeaderPanel() {
    $("#saleOrderDetailHeaderPanel input").val("");
    const chargesMobile = document.getElementById("sodChargesMobile");
    if (chargesMobile) chargesMobile.innerHTML = "";
}
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
            if (v != null && v !== "") return String(v);
        }
    }
    for (let i = 0; i < arr.length; i++) {
        const k = arr[i];
        if (Object.prototype.hasOwnProperty.call(item, k)) return item[k] == null ? "" : String(item[k]);
    }
    return "";
}

function formatINRAmount(val) {
    const raw = String(val ?? "").replace(/,/g, "").trim();
    const n = parseFloat(raw);
    if (isNaN(n)) return val ? escapeHtml(String(val)) : "\u2014";
    return (
        "\u20B9" +
        n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
}

function parseMoneyNumber(val) {
    if (val == null || val === "") return NaN;
    const n = parseFloat(String(val).replace(/,/g, "").replace(/[^\d.-]/g, "").trim());
    return Number.isFinite(n) ? n : NaN;
}

function formatINRAmountPlain(val) {
    const n = parseMoneyNumber(val);
    if (isNaN(n)) return "\u2014";
    return "\u20B9" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getAsonDateIsoToday() {
    const d = new Date();
    return (
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0")
    );
}

function extractAccountMasterCode(row) {
    if (!row) return "";
    const code = pickRowValue(row, [
        "AccountMaster_Code",
        "AccountMaster Code",
        "AccountMasterCode",
        "DealerMaster_Code",
        "DealerMaster Code",
        "Party Code",
        "Party_Code",
    ]);
    const n = parseInt(code, 10);
    return n > 0 ? String(n) : "";
}

function rowBalanceAmount(row) {
    if (!row) return 0;
    const bal = parseMoneyNumber(
        pickRowValue(row, ["Balance", "balance", "Outstanding", "Net Outstanding", "NetOutstanding"])
    );
    if (!isNaN(bal)) return bal;
    const amt = parseMoneyNumber(pickRowValue(row, ["Amount", "amount"]));
    const adj = parseMoneyNumber(
        pickRowValue(row, ["Amount Adjusted", "AmountAdjusted", "amountAdjusted", "Amount_Adjusted"])
    );
    if (!isNaN(amt)) return amt - (isNaN(adj) ? 0 : adj);
    return 0;
}

function rowDelayDays(row) {
    if (!row) return 0;
    const dd = parseMoneyNumber(
        pickRowValue(row, ["DelayDays", "Delay Days", "delayDays", "Delay_Days"])
    );
    return isNaN(dd) ? 0 : dd;
}

function normalizeBillWiseRows(response) {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.Data)) return response.Data;
    if (Array.isArray(response.data)) return response.data;
    return [];
}

function setPartyOutstandingDisplay(outstandingText, overdueText, loading) {
    const $out = $("#sodPartyOutstandingAmt");
    const $od = $("#sodPartyOverdueAmt");
    $out.text(outstandingText);
    $od.text(overdueText);
    $out.toggleClass("is-loading", !!loading);
    $od.toggleClass("is-loading", !!loading);
}

function clearSaleOrderPartyOutstanding() {
    setPartyOutstandingDisplay("\u2014", "\u2014", false);
}

function aggregateOutstandingFromBillRows(rows) {
    let outstanding = 0;
    let overdue = 0;
    rows.forEach(function (row) {
        const bal = rowBalanceAmount(row);
        if (bal <= 0) return;
        outstanding += bal;
        if (rowDelayDays(row) > 0) overdue += bal;
    });
    return { outstanding: outstanding, overdue: overdue };
}

function normalizePartyOutstandingSummary(response) {
    if (!response) return null;
    let rows = null;
    if (Array.isArray(response)) rows = response;
    else if (Array.isArray(response.Data)) rows = response.Data;
    else if (Array.isArray(response.data)) rows = response.data;

    if (rows && rows.length) {
        const first = rows[0];
        const hasSummary =
            pickRowValue(first, ["Outstanding", "outstanding"]) !== "" ||
            pickRowValue(first, ["Overdue", "overdue"]) !== "";
        if (hasSummary) {
            const outstanding = parseMoneyNumber(
                pickRowValue(first, ["Outstanding", "outstanding", "txtOutStanding", "OutStanding"])
            );
            const overdue = parseMoneyNumber(
                pickRowValue(first, ["Overdue", "overdue", "objGenCreditLimitOverDue", "OverDue", "Over Due"])
            );
            return {
                outstanding: isNaN(outstanding) ? 0 : outstanding,
                overdue: isNaN(overdue) ? 0 : overdue,
            };
        }
        if (pickRowValue(first, ["Balance", "balance"]) !== "" || pickRowValue(first, ["DelayDays", "Delay Days"]) !== "") {
            return aggregateOutstandingFromBillRows(rows);
        }
    }

    let row = null;
    if (rows && rows.length) row = rows[0];
    else if (response.Outstanding != null || response.Overdue != null || response.outstanding != null) row = response;
    if (!row) return null;
    const outstanding = parseMoneyNumber(
        pickRowValue(row, ["Outstanding", "outstanding", "txtOutStanding", "OutStanding"])
    );
    const overdue = parseMoneyNumber(
        pickRowValue(row, ["Overdue", "overdue", "objGenCreditLimitOverDue", "OverDue", "Over Due"])
    );
    return {
        outstanding: isNaN(outstanding) ? 0 : outstanding,
        overdue: isNaN(overdue) ? 0 : overdue,
    };
}

function loadPartyOutstandingFromBillWise(accountMasterCode) {
    return BillWiseOutStandingReportService.GetBillWiseOutStandingReport(
        "",
        accountMasterCode,
        getAsonDateIsoToday(),
        "0",
        "Y"
    ).then(function (response) {
        return aggregateOutstandingFromBillRows(normalizeBillWiseRows(response));
    });
}

function loadPartyOutstandingFromApi(buyerPOCode) {
    const bp = parseInt(buyerPOCode, 10) || 0;
    return SaleOrderApprovalService.GetPartyOutstandingOverdue(bp).then(function (response) {
        const summary = normalizePartyOutstandingSummary(response);
        if (summary) return summary;
        return Promise.reject(new Error("Empty outstanding summary"));
    });
}

/**
 * Outstanding / overdue for party — BillMaster balance & credit-days delay (user query logic).
 * Primary: SaleOrderApproval/GetPartyOutstandingOverdue API.
 * Fallback: bill-wise outstanding report aggregation.
 */
function loadSaleOrderPartyOutstanding(buyerPOCode, contextRow) {
    setPartyOutstandingDisplay("Loading\u2026", "Loading\u2026", true);
    const bpCode = parseInt(buyerPOCode, 10) || 0;
    if (bpCode <= 0) {
        clearSaleOrderPartyOutstanding();
        return;
    }

    let accountCode = extractAccountMasterCode(contextRow);

    function applySummary(agg) {
        setPartyOutstandingDisplay(
            formatINRAmountPlain(agg.outstanding),
            formatINRAmountPlain(agg.overdue),
            false
        );
    }

    function tryBillWiseFallback() {
        if (!accountCode) {
            clearSaleOrderPartyOutstanding();
            return;
        }
        loadPartyOutstandingFromBillWise(accountCode)
            .then(applySummary)
            .catch(function () {
                clearSaleOrderPartyOutstanding();
            });
    }

    loadPartyOutstandingFromApi(bpCode)
        .then(applySummary)
        .catch(function () {
            if (!accountCode && bpCode > 0) {
                SaleOrderApprovalService.SaleOrdersCreditLimitReports(bpCode)
                    .then(function (response) {
                        response = response || {};
                        const amtBase = response.CreditLimitAmountBase || [];
                        if (amtBase.length && amtBase[0]) {
                            accountCode =
                                extractAccountMasterCode(amtBase[0]) ||
                                String(
                                    amtBase[0].AccountMaster_Code ||
                                    amtBase[0].AccountMasterCode ||
                                    amtBase[0].CustomerMaster_Code ||
                                    ""
                                ).trim();
                        }
                        tryBillWiseFallback();
                    })
                    .catch(tryBillWiseFallback);
            } else {
                tryBillWiseFallback();
            }
        });
}

function formatQtyDisplay(val) {
    if (val == null || val === "") return "\u2014";
    const raw = String(val).replace(/,/g, "").trim();
    const n = parseFloat(raw);
    if (!isNaN(n)) return n.toLocaleString("en-IN", { maximumFractionDigits: 4 });
    return escapeHtml(String(val));
}

function reviewActionLabel() {
    const a = (FrmAction || "Verify").trim();
    if (/approve/i.test(a)) return "Review & Approve";
    if (/check/i.test(a)) return "Review & Check";
    return "Review & Verify";
}

function verifyButtonLabel() {
    const a = (FrmAction || "Verify").trim();
    if (/approve/i.test(a)) return "Approve";
    if (/check/i.test(a)) return "Check";
    return "Verify";
}

const SOD_ATTACHMENT_MASTER = "BuyerPOMaster";

function escapeForSingleQuotedJs(s) {
    return String(s ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\r\n/g, "\\n")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\n");
}

function sodHasAttachmentYes(item) {
    if (!item) return false;
    const v = item.HasAttach != null ? item.HasAttach
        : item.hasAttach != null ? item.hasAttach
        : item.HasAttachment != null ? item.HasAttachment
        : item["Has Attachment"];
    return String(v || "").trim().toUpperCase() === "Y";
}

function sodRawOrderNoForAttach(item) {
    if (!item) return "";
    const n = rowField(item, ["Order No", "OrderNo"]);
    return n === "\u2014" ? "" : String(n).trim();
}

function sodRawOrderDateForAttach(item) {
    if (!item) return "";
    const d = rowField(item, ["Order Date", "OrderDate"]);
    const s = String(d).trim();
    if (!s || s === "\u2014") return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) {
        return m[3] + "-" + String(m[2]).padStart(2, "0") + "-" + String(m[1]).padStart(2, "0");
    }
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) {
        return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
    }
    return s.length >= 10 ? s.substring(0, 10) : "";
}

function sodEntryDateParamForAttachmentControl(item) {
    const raw = sodRawOrderDateForAttach(item);
    if (!raw) return "";
    const dt = new Date(raw);
    return !isNaN(dt.getTime()) ? dt.toISOString() : "";
}

function InitSaleOrderAttachmentControl(masterCode, entryNo, entryDate) {
    const appBase = (sessionStorage.getItem("AppBaseURL") || (window.location.origin + "/")).replace(/\/?$/, "/");
    $("#SaleOrderApproval_AttachmentControlmodal").load(appBase + "CustomControl/AttachmentControl", {
        MasterTableName: SOD_ATTACHMENT_MASTER,
        MasterTableCode: parseInt(masterCode, 10) || 0,
        DetailTableName: "",
        DetailTableCode: 0,
        EntryNo: parseInt(entryNo, 10) || 0,
        EntryDate: entryDate || "",
        Mode: "view",
    });
}

function OpenSaleOrderApprovalAttachment(code, entryNo, entryDate) {
    const masterCode = parseInt(code, 10) || 0;
    if (masterCode <= 0) {
        toastr.warning("Invalid record. Cannot open attachments.");
        return;
    }
    const item = G_SaleOrderListRaw.find(function (x) {
        return String(x.BuyerPOMaster_Code) === String(masterCode);
    });
    const en = entryNo != null && String(entryNo) !== "" ? entryNo : (item ? sodRawOrderNoForAttach(item) : "");
    const ed = entryDate != null && String(entryDate) !== ""
        ? entryDate
        : (item ? sodEntryDateParamForAttachmentControl(item) : "");
    InitSaleOrderAttachmentControl(masterCode, en, ed);
}

function OpenSaleOrderApprovalAttachmentFromModal() {
    const code = G_CurrentSaleOrderCode || 0;
    const entryNo = $("#hfSodAttachOrderNo").val() || "";
    const entryDate = $("#hfSodAttachOrderDate").val() || "";
    OpenSaleOrderApprovalAttachment(code, entryNo, entryDate);
}

function syncSaleOrderModalAttachmentButton(item) {
    if (!item) return;
    $("#hfSodAttachOrderNo").val(String(sodRawOrderNoForAttach(item) || ""));
    $("#hfSodAttachOrderDate").val(sodEntryDateParamForAttachmentControl(item) || "");
    $("#btnSaleOrderModalAttachment").toggleClass("av-attach-has-files", sodHasAttachmentYes(item));
}

function renderSaleOrderCard(item) {
    const code = item.BuyerPOMaster_Code;
    const orderNo = escapeHtml(rowField(item, ["Order No", "OrderNo"]));
    const party = escapeHtml(rowField(item, ["PartyName", "Party Name"]));
    const orderDate = escapeHtml(rowField(item, ["Order Date", "OrderDate"]));
    const totalRaw = rowField(item, ["Total Order Amount", "TotalOrderAmount", "Amount"]);
    const amountText = formatINRAmount(totalRaw);
    const frmLabel = escapeHtml(FrmAction || "\u2014");

    const encCode = encodeURIComponent(String(code));

    const actionBtn =
        '<button type="button" class="sopa-btn sopa-btn--primary sopa-js-view" data-bcode="' +
        encCode +
        '"><i class="fa fa-folder-open" aria-hidden="true"></i> ' +
        escapeHtml(reviewActionLabel()) +
        "</button>";

    const rawNo = sodRawOrderNoForAttach(item);
    const rawDt = sodEntryDateParamForAttachmentControl(item);
    const escNo = escapeForSingleQuotedJs(rawNo);
    const escDt = escapeForSingleQuotedJs(rawDt);
    const attachBg = sodHasAttachmentYes(item)
        ? "linear-gradient(135deg,#16a34a,#15803d)"
        : "linear-gradient(135deg,#0ea5e9,#0284c7)";
    const attachBtns =
        '<div class="av-card-attach-btns">' +
        '<button type="button" class="btn-av-attach-icon" title="Attachments" ' +
        'style="background:' + attachBg + ';box-shadow:0 2px 8px rgba(14,165,233,0.35);" ' +
        'onclick="event.stopPropagation();OpenSaleOrderApprovalAttachment(' + code + ", '" + escNo + "', '" + escDt + "')\">" +
        '<i class="fa fa-paperclip"></i></button></div>';

    return (
        '<article class="sopa-card" role="listitem">' +
        '<div class="sopa-card-head">' +
        '<div class="sopa-po-badge"><span class="sopa-po-label">PO#</span><span class="sopa-po-no">' +
        (orderNo || "\u2014") +
        "</span></div>" +
        '<div class="sopa-company-block"><div class="sopa-company-title"><i class="fa fa-building" aria-hidden="true"></i><span>' +
        (party || "\u2014") +
        "</span></div>" +
        '<div class="sopa-meta"><span><i class="far fa-calendar-alt" aria-hidden="true"></i>' +
        (orderDate || "\u2014") +
        "</span>" +
        '<span class="sopa-tag"><i class="fa fa-file-invoice" aria-hidden="true"></i> ' +
        frmLabel +
        "</span>" +
        "</div></div>" +
        '<div class="sopa-amount-block"><div class="sopa-amount">' +
        amountText +
        '</div><span class="sopa-status sopa-status--pending">Pending</span></div></div>' +
        '<div class="sopa-card-foot">' +
        attachBtns +
        actionBtn +
        "</div></article>"
    );
}

function renderSaleOrderPaginator(total, page, pageSize) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const p = Math.min(Math.max(1, page), pages);
    const start = total === 0 ? 0 : (p - 1) * pageSize + 1;
    const end = Math.min(p * pageSize, total);
    const $nav = $("#sopa-cards-paginator");
    if (total === 0) {
        $nav.empty();
        return;
    }
    const disFirst = p <= 1 ? " disabled" : "";
    const disLast = p >= pages ? " disabled" : "";
    $nav.html(
        '<div class="sopa-page-size"><span>Lines per page</span>' +
            '<select id="sopa-page-size-sel" class="form-control form-control-sm" style="width:auto;display:inline-block">' +
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
            '<button type="button" class="sopa-paginator__btn sopa-pg-first"' +
            disFirst +
            ' title="First"><i class="fa fa-angle-double-left"></i></button>' +
            '<button type="button" class="sopa-paginator__btn sopa-pg-prev"' +
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
            '<button type="button" class="sopa-paginator__btn sopa-pg-next"' +
            disLast +
            ' title="Next"><i class="fa fa-angle-right"></i></button>' +
            '<button type="button" class="sopa-paginator__btn sopa-pg-last"' +
            disLast +
            ' title="Last"><i class="fa fa-angle-double-right"></i></button>' +
            "</div>"
    );

    $(".sopa-pg-first")
        .off("click")
        .on("click", function () {
            if (G_SaleOrderCardPage > 1) {
                G_SaleOrderCardPage = 1;
                paintSaleOrderCards();
            }
        });
    $(".sopa-pg-prev")
        .off("click")
        .on("click", function () {
            if (G_SaleOrderCardPage > 1) {
                G_SaleOrderCardPage--;
                paintSaleOrderCards();
            }
        });
    $(".sopa-pg-next")
        .off("click")
        .on("click", function () {
            const pg = Math.ceil(total / pageSize);
            if (G_SaleOrderCardPage < pg) {
                G_SaleOrderCardPage++;
                paintSaleOrderCards();
            }
        });
    $(".sopa-pg-last")
        .off("click")
        .on("click", function () {
            const pg = Math.max(1, Math.ceil(total / pageSize));
            if (G_SaleOrderCardPage !== pg) {
                G_SaleOrderCardPage = pg;
                paintSaleOrderCards();
            }
        });
    $("#sopa-page-size-sel")
        .off("change")
        .on("change", function () {
            G_SaleOrderPageSize = parseInt($(this).val(), 10) || 10;
            G_SaleOrderCardPage = 1;
            paintSaleOrderCards();
        });
}

function updateSaleOrderStatChips() {
    const pending = G_SaleOrderListRaw.length;
    const el = document.getElementById("statPendingSaleOrder");
    if (el) el.textContent = pending > 0 ? pending : "\u2014";
}

function paintSaleOrderCards() {
    const all = G_SaleOrderListRaw;
    const pageSize = G_SaleOrderPageSize;
    let p = G_SaleOrderCardPage;
    const total = all.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (p > pages) p = pages;
    G_SaleOrderCardPage = p;
    const start = (p - 1) * pageSize;
    const slice = all.slice(start, start + pageSize);
    const $box = $("#SaleOrderApprovalCards");
    if (!total) {
        $box.html('<p class="sopa-empty">No records to display.</p>');
        $("#sopa-cards-paginator").empty();
        return;
    }
    $box.html(slice.map(renderSaleOrderCard).join(""));
    renderSaleOrderPaginator(total, G_SaleOrderCardPage, pageSize);
}

$(document).ready(function () {
    var urlParams = getUrlVars();
    var menuValue = decodeURI(urlParams['menu']);
    FrmType = decodeURI(urlParams['FrmType']);
    FrmAction = decodeURI(urlParams['FrmAction']);

    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    }
    else {
        $("#ERPHeading").text("Sale Order Approval");
    }
    GetSaleOrderApproval();

    $(document).on("click", "#SaleOrderApprovalCards .sopa-js-view", function () {
        const c = decodeURIComponent($(this).attr("data-bcode") || "");
        if (c) ViewData(c);
    });
    $(document).on("click", "#btnSaleOrderVerify", function () {
        const c = decodeURIComponent($(this).attr("data-bcode") || "") || G_CurrentSaleOrderCode;
        if (c) SaleOrderApprovedlist(c);
    });
});
function GetSaleOrderApproval() {
    SaleOrderApprovalService.GetUnApprovedSaleOrders(FrmAction).then(function (response) {
        if (response.length > 0) {
            G_SaleOrderListRaw = response;
            G_SaleOrderCardPage = 1;
            $("#SaleOrderApprovalList").show();
            updateSaleOrderStatChips();
            paintSaleOrderCards();
        } else {
            toastr.error("No data found:", response);
            G_SaleOrderListRaw = [];
            updateSaleOrderStatChips();
            $("#SaleOrderApprovalCards").html("");
            $("#sopa-cards-paginator").empty();
            $("#SaleOrderApprovalList").hide();
        }
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
    });
}
const LINE_ITEM_MOBILE_HEAD = {
    sno: ["SNO", "Sno", "SNo", "Sr No", "SrNo"],
    item: ["Item Name", "ItemName", "ITEM NAME", "Item"],
    size: ["SIZE DESP", "Size Desp", "SizeDesp", "Size Description", "Size"],
};
const LINE_ITEM_MOBILE_SKIP = new Set([
    "SNO", "Sno", "SNo", "Sr No", "SrNo", "Item Name", "ItemName", "ITEM NAME", "Item",
    "SIZE DESP", "Size Desp", "SizeDesp", "Size Description", "Size",
]);
const LINE_ITEM_NUMERIC = new Set(["Qty MT", "Qty PC", "Qty MR", "Qty KG", "Qty SQM", "Amount", "Freight/Unit"]);
function fmtMobileVal(val) {
    if (val == null || val === "") return "\u2014";
    return String(val);
}
function buildLineItemMobileCard(row, keys, index) {
    const sno = pickRowValue(row, LINE_ITEM_MOBILE_HEAD.sno) || String(index + 1);
    const itemName = pickRowValue(row, LINE_ITEM_MOBILE_HEAD.item) || "Item";
    const sizeDesp = pickRowValue(row, LINE_ITEM_MOBILE_HEAD.size);
    const detailKeys = keys.filter(function (k) { return !LINE_ITEM_MOBILE_SKIP.has(k); });
    const gridHtml = detailKeys.map(function (k) {
        const val = row[k];
        if (val == null || val === "") return "";
        const isNum = LINE_ITEM_NUMERIC.has(k);
        const full = k.length > 14 || String(val).length > 18 ? " sod-li-mobile-kv--full" : "";
        return (
            '<div class="sod-li-mobile-kv' + full + '">' +
            '<span class="sod-li-mobile-lbl">' + escapeHtml(k) + "</span>" +
            '<span class="sod-li-mobile-val' + (isNum ? " is-num" : "") + '">' + escapeHtml(String(val)) + "</span></div>"
        );
    }).join("");
    return (
        '<div class="sod-li-mobile-card">' +
        '<div class="sod-li-mobile-head">' +
        '<span class="sod-li-mobile-sno">#' + escapeHtml(String(sno)) + "</span>" +
        '<span class="sod-li-mobile-item">' + escapeHtml(itemName) + "</span></div>" +
        (sizeDesp ? '<div class="sod-li-mobile-size">' + escapeHtml(sizeDesp) + "</div>" : "") +
        (gridHtml ? '<div class="sod-li-mobile-grid">' + gridHtml + "</div>" : "") +
        "</div>"
    );
}
function buildDeliveryTermsMobileCard(displayRows) {
    if (!displayRows || !displayRows.length) return "";
    return displayRows.map(function (row) {
        const rowsHtml = SALE_ORDER_DELIVERY_TERM_COLUMNS.map(function (col) {
            const show = fmtMobileVal(row[col.label]);
            return (
                '<div class="sod-dt-mobile-kv">' +
                '<span class="sod-dt-mobile-lbl">' + escapeHtml(col.label) + "</span>" +
                '<span class="sod-dt-mobile-val">' + escapeHtml(show) + "</span></div>"
            );
        }).join("");
        return '<div class="sod-dt-mobile-card">' + rowsHtml + "</div>";
    }).join("");
}
function renderChargesMobilePanel() {
    const el = document.getElementById("sodChargesMobile");
    if (!el) return;
    const groups = [
        {
            title: "Packing",
            rows: [
                { lbl: "Description", val: $("#sod_BuyerPOMaster_PackingChargeDesp").val() },
                { lbl: "Value", val: $("#sod_BuyerPOMaster_PackingChargesValue").val() },
                { lbl: "Amount", val: $("#sod_BuyerPOMaster_PackingChargesAmount").val() },
            ],
        },
        {
            title: "Other charges",
            rows: [
                { lbl: "Description", val: $("#sod_BuyerPOMaster_OtherChargesDesp1").val() },
                { lbl: "Amount", val: $("#sod_BuyerPOMaster_OtherCharges1").val() },
            ],
        },
        {
            title: "Freight",
            rows: [
                { lbl: "Condition", val: $("#sod_FreightCondition").val() },
                { lbl: "Freight", val: $("#sod_Freight").val() },
            ],
        },
    ];
    el.innerHTML = groups.map(function (g) {
        return (
            '<div class="sod-charge-mobile-group">' +
            '<div class="sod-charge-mobile-group-title">' + escapeHtml(g.title) + "</div>" +
            '<div class="sod-charge-mobile-block">' +
            g.rows.map(function (r) {
                return (
                    '<div class="sod-charge-mobile-row">' +
                    '<span class="sod-charge-mobile-lbl">' + escapeHtml(r.lbl) + "</span>" +
                    '<span class="sod-charge-mobile-val">' + escapeHtml(fmtMobileVal(r.val)) + "</span></div>"
                );
            }).join("") +
            "</div></div>"
        );
    }).join("");
}
function clearSaleOrderLineItemsTable() {
    document.getElementById("table-header-SaleOrderApprovalTable").innerHTML = "";
    document.getElementById("table-body-SaleOrderApprovalTable").innerHTML =
        '<tr><td colspan="8" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">' +
        '<i class="fa fa-spinner fa-spin me-1"></i>Loading line items\u2026</td></tr>';
    const mobileEl = document.getElementById("sodLineItemsMobileCards");
    if (mobileEl) {
        mobileEl.innerHTML = '<div class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">' +
            '<i class="fa fa-spinner fa-spin me-1"></i>Loading line items\u2026</div>';
    }
}
function clearSaleOrderDeliveryTermsTable() {
    document.getElementById("table-header-SaleOrderDeliveryTermsTable").innerHTML = "";
    document.getElementById("table-body-SaleOrderDeliveryTermsTable").innerHTML = "";
    const termsMobile = document.getElementById("sodDeliveryTermsMobile");
    if (termsMobile) termsMobile.innerHTML = "";
    const chargesMobile = document.getElementById("sodChargesMobile");
    if (chargesMobile) chargesMobile.innerHTML = "";
    clearSaleOrderPartyOutstanding();
}
function renderSaleOrderLineItems(rows) {
    const tbody = document.getElementById("table-body-SaleOrderApprovalTable");
    const thead = document.getElementById("table-header-SaleOrderApprovalTable");
    const mobileEl = document.getElementById("sodLineItemsMobileCards");

    if (!rows || !rows.length) {
        thead.innerHTML = "";
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No line items found.</td></tr>';
        if (mobileEl) mobileEl.innerHTML = '<div class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No line items found.</div>';
        return;
    }

    const keys = getLineItemColumnKeys(rows);

    thead.innerHTML = "<tr>" + keys.map(function (k) { return "<th>" + escapeHtml(k) + "</th>"; }).join("") + "</tr>";
    tbody.innerHTML = rows.map(function (row) {
        return "<tr>" + keys.map(function (k) {
            const val = row[k] == null ? "" : row[k];
            const align = LINE_ITEM_NUMERIC.has(k) ? ' style="text-align:right;"' : "";
            return "<td" + align + ">" + escapeHtml(String(val)) + "</td>";
        }).join("") + "</tr>";
    }).join("");

    if (mobileEl) {
        mobileEl.innerHTML = rows.map(function (row, idx) {
            return buildLineItemMobileCard(row, keys, idx);
        }).join("");
    }
}
function renderSaleOrderDeliveryTermsTable(rows, masterRow) {
    const tbody = document.getElementById("table-body-SaleOrderDeliveryTermsTable");
    const thead = document.getElementById("table-header-SaleOrderDeliveryTermsTable");
    const mobileEl = document.getElementById("sodDeliveryTermsMobile");
    const displayRows = buildDeliveryTermsDisplayRows(rows, masterRow);

    if (!displayRows.length) {
        thead.innerHTML = "";
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No delivery terms found.</td></tr>';
        if (mobileEl) mobileEl.innerHTML = '<div class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No delivery terms found.</div>';
        return;
    }

    const keys = SALE_ORDER_DELIVERY_TERM_COLUMNS.map(function (c) { return c.label; });
    thead.innerHTML = "<tr>" + keys.map(function (k) { return "<th>" + escapeHtml(k) + "</th>"; }).join("") + "</tr>";
    tbody.innerHTML = displayRows.map(function (row) {
        return "<tr>" + keys.map(function (k) {
            return "<td>" + escapeHtml(fmtMobileVal(row[k])) + "</td>";
        }).join("") + "</tr>";
    }).join("");

    if (mobileEl) mobileEl.innerHTML = buildDeliveryTermsMobileCard(displayRows);
}
function setSaleOrderModalHeader(orderNo, party, orderDate) {
    $("#myModalTitle").text(
        (orderNo ? "PO# " + orderNo : "Sale Order Detail") + (party ? " — " + party : "")
    );
    const od = String(orderDate || "").trim();
    if (od) {
        $("#myModalOrderDate").text(od);
        $("#myModalOrderDateWrap").show();
    } else {
        $("#myModalOrderDate").text("");
        $("#myModalOrderDateWrap").hide();
    }
}
function ViewData(Code) {
    G_CurrentSaleOrderCode = Code;

    const current = G_SaleOrderListRaw.find(function (x) {
        return String(x.BuyerPOMaster_Code) === String(Code);
    });
    const canAction = current ? !!current.Action : false;
    const orderNo = current ? rowField(current, ["Order No", "OrderNo"]) : "";
    const party = current ? rowField(current, ["PartyName", "Party Name"]) : "";
    const orderDate = current ? rowField(current, ["Order Date", "OrderDate"]) : "";

    setSaleOrderModalHeader(orderNo, party, orderDate);
    syncSaleOrderModalAttachmentButton(current);

    const $verifyBtn = $("#btnSaleOrderVerify");
    $("#btnSaleOrderVerifyLabel").text(verifyButtonLabel());
    $verifyBtn.attr("data-bcode", encodeURIComponent(String(Code)));
    $verifyBtn.toggle(canAction);

    clearSaleOrderLineItemsTable();
    clearSaleOrderDeliveryTermsTable();
    loadSaleOrderPartyOutstanding(Code, current);

    SaleOrderApprovalService.GetSaleOrderDetail(Code).then(function (response) {
        if (response && response.length > 0) {
            $('#myModal').modal({
                backdrop: 'static',
            });
            $('#myModal').modal('show');
            const detailRows = response;
            const lineGridRows = stripKeysFromRows(detailRows, SALE_ORDER_DETAIL_GRID_HIDDEN);
            if (!orderDate && detailRows[0]) {
                setSaleOrderModalHeader(
                    orderNo,
                    party,
                    pickRowValue(detailRows[0], ["Order Date", "OrderDate"])
                );
            }
            renderSaleOrderLineItems(lineGridRows);
            populateSaleOrderDetailHeaderPanel(detailRows[0]);
            loadSaleOrderPartyOutstanding(Code, detailRows[0] || current);
            SaleOrderDeliveryTerms(Code, detailRows[0]);
        } else {
            clearSaleOrderDetailHeaderPanel();
            clearSaleOrderLineItemsTable();
            clearSaleOrderDeliveryTermsTable();
            toastr.error("No valid data found:", response);
        }
    }).catch(error => {
        clearSaleOrderDetailHeaderPanel();
        clearSaleOrderLineItemsTable();
        clearSaleOrderDeliveryTermsTable();
        toastr.error("Error in fetching data:", error);
    });
}
function SaleOrderDeliveryTerms(Code, masterRow) {
    SaleOrderApprovalService.GetSaleOrderDeliveryTermsDetail(Code).then(function (response) {
        if (response && response.length > 0) {
            renderSaleOrderDeliveryTermsTable(response, masterRow);
        } else {
            renderSaleOrderDeliveryTermsTable([], masterRow);
        }
    }).catch(error => {
        renderSaleOrderDeliveryTermsTable([], masterRow);
        toastr.error("Error in fetching data:", error);
    });
}
function CloseModal() {
    clearSaleOrderDetailHeaderPanel();
    clearSaleOrderLineItemsTable();
    clearSaleOrderDeliveryTermsTable();
    $("#myModalOrderDate").text("");
    $("#myModalOrderDateWrap").hide();
    $('#myModal').modal('hide');
}
function SaleOrderApprovedlist(BCode) {

    G_BCode = BCode;
    SaleOrderApprovalService.SaleOrdersCreditLimitReports(BCode).then(function (response) {
        let CheckCreditLimit = 'Y';
        let DoCreditLimtCheck = 'N';
        let CreditLimitAmountBase = [];
        let CreditLimitDayBase = [];
        let PartyName = '';
        console.log(response);
        if ((response.CreditLimitAmountBase.length > 0 && response.CreditLimitAmountBase[0].CheckCreditLimitAmountBase === "N") || (response.CreditLimitDayBase.length > 0 && response.CreditLimitDayBase[0].CheckCreditLimitDaysBase === "N")) {
            
            CheckCreditLimit = 'N';
            CreditLimitAmountBase = response.CreditLimitAmountBase;
            CreditLimitDayBase = response.CreditLimitDayBase;
            PartyName = response.CreditLimitAmountBase[0].AccountName;
            G_CheckCreditLimitAmountBase = response.CreditLimitAmountBase[0].CheckCreditLimitAmountBase;
            G_CheckCreditLimitDaysBase = response.CreditLimitDayBase[0].CheckCreditLimitDaysBase;
        }
        //CheckCreditLimit = 'N';
        //CreditLimitAmountBase = response.CreditLimitAmountBase;
        //CreditLimitDayBase = response.CreditLimitDayBase;
        //PartyName = response.CreditLimitAmountBase[0].AccountName;

        if (CreditLimitCheck_BuyerPO == 'V' && FrmAction == 'Verify') {
            DoCreditLimtCheck = 'Y';
        }
        if (CreditLimitCheck_BuyerPO == 'C' && FrmAction == 'Check') {
            DoCreditLimtCheck = 'Y';
        }

        if (CheckCreditLimit === 'N' && DoCreditLimtCheck=='Y') {
            $('#myModal').modal('hide');
            $('#OTPModalDisplay').modal({
                backdrop: 'static',
            });
            $('#OTPModalDisplay').modal('show');

            CreditLimitAmountBase = CreditLimitAmountBase.map((item) => ({
                "Credit Limit (Rs.)": item.txtCreditLimit,
                "Ledger Closig": item.txtLedgerClosing,
                "Un Booked Sale": item.txtUnBookSale,
                "Pending Do": item.txtPendingDO,
                "Available Limit": item.txtAvailableLimit,
                "Order Amount": item.txtDoAmount,
                "Balance": item.txtBalance

            }))

            CreditLimitAmountBase = Object.keys(CreditLimitAmountBase[0]).map((item) => ({
                Desp: item,
                Value: CreditLimitAmountBase[0][item]
            }))
           
            CreditLimitDayBase = CreditLimitDayBase.map((item) => ({
                "Credit Days": item.TxtCreditDays,
                "Grace Period": item.TxtGracePeriod,
                "Out Standing": item.txtOutStanding,
                "Gen Credit Limit OverDue": item.objGenCreditLimitOverDue,
            }))
            CreditLimitDayBase = Object.keys(CreditLimitDayBase[0]).map((item) => ({
                Desp: item,
                Value: CreditLimitDayBase[0][item]
            }))

            

                const StringFilterColumn = [];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = [];
            const ColumnAlignment = {};
            BizsolCustomFilterGrid.CreateDataTable("table-header-CreditLimitAmountBaseTable", "table-body-CreditLimitAmountBaseTable", CreditLimitAmountBase, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
            BizsolCustomFilterGrid.CreateDataTable("table-header-CreditLimitDayBaseTable", "table-body-CreditLimitDayBaseTable", CreditLimitDayBase, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);

            $('#paginator-CreditLimitAmountBaseTable').hide();
            $('#paginator-CreditLimitAmountBaseTable').empty();
            $('#paginator-CreditLimitDayBaseTable').hide();
            $('#paginator-CreditLimitDayBaseTable').empty();
            $('#ChkCreditLimitPartyName')[0].innerHTML = PartyName;

            //if (G_CheckCreditLimitDaysBase == "Y") {

            //    $('#CreditLimitDayBaseTable').hide();
            //}

            return;
        }
        Showloader();
        SaleOrderApprovalService.SaleOrderApproved(BCode, FrmAction, FrmType).then(function (resdata) {
            HideLoader();
            if (resdata.Status === "Y") {
                toastr.success(resdata.Msg);
                $('#myModal').modal('hide');
                GetSaleOrderApproval();
                GetWebNotificationList();
            } else if (resdata.Status === "N") {
                toastr.error(resdata.Msg);

            }
        }).catch(function (error) {
            toastr.error("Error in Sale Order Approval: ", error);
            HideLoader();
        });

    }).catch(error => {
        toastr.error("Error in fetching data:", error);
    });

    
};
function getUrlVars() {
    var vars = {};
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}
function SaleOrder_Authentication() {
    SaleOrderApprovalService.SendVerifyOrApproveNotificationToSenior(G_BCode).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
        }
    });
}
function SaleOrder_OTPReceive() {
    let OTP = $('#txtOTP').val()

    if (OTP === "") {
        toastr.error('Please Check! Authorization Code can not be blank');
        return;
    }
    let ReasonFor = 'Credit Limit Check (Amount)';
    if (G_CheckCreditLimitAmountBase == 'N' && G_CheckCreditLimitDaysBase == 'N') {
        ReasonFor = 'Credit Limit Check (Days with Amount)';
    } else if (G_CheckCreditLimitDaysBase=='N') {
        ReasonFor = 'Credit Limit Check (Days)';
    }

    SaleOrderApprovalService.SaleOrdersApprovedBYOTP(G_BCode, FrmAction, FrmType, OTP, ReasonFor).then(function (response) {
        if (response.Status === 'Y') {
            toastr.success(response.Msg);
            GetSaleOrderApproval();
            GetWebNotificationList();
            $('#txtOTP').val('');
            $('#OTPModalDisplay').modal('hide');

        } else {
            toastr.error(response.Msg);
        }

    });
}

function getSaleOrderApprovalFixedParaMeters() {
    SaleOrderApprovalService.GetFixedParaMeter().then(function (response) {
        SaleOrderApprovalFixedParaMeters = response;
        LoadFrm();
    });
}

function LoadFrm() {
    if (SaleOrderApprovalFixedParaMeters.length > 0 && SaleOrderApprovalFixedParaMeters.find(x => x.PeramaterName === 'CreditLimitCheck_BuyerPO').PeramaterValue != '') {
        CreditLimitCheck_BuyerPO = SaleOrderApprovalFixedParaMeters.find(x => x.PeramaterName === 'CreditLimitCheck_BuyerPO').PeramaterValue;
    }
}

getSaleOrderApprovalFixedParaMeters();
window.ViewData = ViewData;
window.CloseModal = CloseModal;
window.SaleOrderApprovedlist = SaleOrderApprovedlist;
window.SaleOrder_Authentication = SaleOrder_Authentication;
window.SaleOrder_OTPReceive = SaleOrder_OTPReceive;
window.OpenSaleOrderApprovalAttachment = OpenSaleOrderApprovalAttachment;
window.OpenSaleOrderApprovalAttachmentFromModal = OpenSaleOrderApprovalAttachmentFromModal;