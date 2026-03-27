import { SaleOrderApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SaleOrderApprovalService.js';

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
function mergeTermsRowsWithMaster(termsRows, masterRow) {
    if (!termsRows || !termsRows.length) return termsRows;
    const marketing = masterRow ? pickRowValue(masterRow, ["Marketing Man", "MarketingMan"]) : "";
    const creditRaw = masterRow ? pickRowValue(masterRow, ["Credit Limit", "CreditLimit"]) : "";
    let creditCol = "";
    if (creditRaw !== "") {
        const t = creditRaw.trim();
        creditCol = /days?$/i.test(t) ? t : t + " Days";
    }
    return termsRows.map(function (row) {
        const rest = {};
        const keys = Object.keys(row);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (
                k === "Marketing Man" ||
                k === "MarketingMan" ||
                k === "Credit Limit" ||
                k === "CreditLimit"
            )
                continue;
            rest[k] = row[k];
        }
        const out = Object.assign({}, rest);
        out["Marketing Man"] = marketing;
        out["Credit Limit"] = creditCol;
        return out;
    });
}
function normalizeSaleOrderDetailRows(rows) {
    if (!rows || !rows.length) return rows;
    return rows.map(function (row) {
        const result = {};
        const keys = Object.keys(row);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (k === "Qty KG" || k === "QtyKG") {
                const mt = row["Qty MT"] ?? row["QtyMT"];
                const kg = row[k];
                result["Qty MT"] = mt != null && mt !== "" ? mt : kg;
                continue;
            }
            if (k === "Qty MT" || k === "QtyMT") {
                if (result["Qty MT"] === undefined) result["Qty MT"] = row[k];
                continue;
            }
            if (k === "Qty SQM" || k === "QtySQM") {
                const mr = row["Qty MR"] ?? row["QtyMR"];
                const sqm = row[k];
                result["Qty MR"] = mr != null && mr !== "" ? mr : sqm;
                continue;
            }
            if (k === "Qty MR" || k === "QtyMR") {
                if (result["Qty MR"] === undefined) result["Qty MR"] = row[k];
                continue;
            }
            result[k] = row[k];
        }
        return result;
    });
}
function populateSaleOrderDetailHeaderPanel(row) {
    $("#sod_BuyerPOMaster_OtherChargesDesp1").val(pickRowValue(row, ["BuyerPOMaster_OtherChargesDesp1"]));
    $("#sod_BuyerPOMaster_OtherCharges1").val(pickRowValue(row, ["BuyerPOMaster_OtherCharges1"]));
    $("#sod_BuyerPOMaster_PackingChargeDesp").val(pickRowValue(row, ["BuyerPOMaster_PackingChargeDesp"]));
    $("#sod_BuyerPOMaster_PackingChargesValue").val(pickRowValue(row, ["BuyerPOMaster_PackingChargesValue"]));
    $("#sod_BuyerPOMaster_PackingChargesAmount").val(pickRowValue(row, ["BuyerPOMaster_PackingChargesAmount"]));
    $("#sod_FreightCondition").val(pickRowValue(row, ["Freight Condition", "FreightCondition"]));
    $("#sod_Freight").val(pickRowValue(row, ["Freight"]));
}
function clearSaleOrderDetailHeaderPanel() {
    $("#saleOrderDetailHeaderPanel input").val("");
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

function formatQtyDisplay(val) {
    if (val == null || val === "") return "\u2014";
    const raw = String(val).replace(/,/g, "").trim();
    const n = parseFloat(raw);
    if (!isNaN(n)) return n.toLocaleString("en-IN", { maximumFractionDigits: 4 });
    return escapeHtml(String(val));
}

function renderSaleOrderCard(item) {
    const code = item.BuyerPOMaster_Code;
    const orderNo = escapeHtml(rowField(item, ["Order No", "OrderNo"]));
    const party = escapeHtml(rowField(item, ["PartyName", "Party Name"]));
    const orderDate = escapeHtml(rowField(item, ["Order Date", "OrderDate"]));
    const sales = escapeHtml(rowField(item, ["Sales Person", "SalesPerson", "Sales Man"]));
    const totalRaw = rowField(item, ["Total Order Amount", "TotalOrderAmount", "Amount"]);
    const amountText = formatINRAmount(totalRaw);
    const qtyMt = formatQtyDisplay(rowField(item, ["Qty MT", "QtyMT", "Qty KG", "QtyKG"]));
    const qtyPc = formatQtyDisplay(rowField(item, ["Qty PC", "QtyPC"]));
    const qtyMr = formatQtyDisplay(rowField(item, ["Qty MR", "QtyMR", "Qty SQM", "QtySQM"]));
    let lineAmtRaw = rowField(item, ["Amount", "Order Amount", "OrderAmount"]);
    if (lineAmtRaw === "")
        lineAmtRaw = rowField(item, ["Total Order Amount", "TotalOrderAmount"]);
    const lineAmountText = lineAmtRaw !== "" ? formatINRAmount(lineAmtRaw) : "\u2014";
    const canAction = !!item.Action;
    const frmLabel = escapeHtml(FrmAction || "\u2014");

    const metaCreator =
        sales !== ""
            ? '<span class="sopa-tag"><i class="fa fa-user" aria-hidden="true"></i> ' + sales + "</span>"
            : '<span class="sopa-tag"><i class="fa fa-user" aria-hidden="true"></i> ' + frmLabel + "</span>";

    const encCode = encodeURIComponent(String(code));

    const actions = canAction
        ? '<button type="button" class="sopa-btn sopa-btn--primary sopa-js-approve" data-bcode="' +
          encCode +
          '" title="' +
          escapeHtml(FrmAction) +
          '"><i class="fa fa-check-circle" aria-hidden="true"></i>Verify</button>' +
          '<button type="button" class="sopa-btn sopa-btn--secondary sopa-js-view" data-bcode="' +
          encCode +
          '"><i class="fa fa-folder-open" aria-hidden="true"></i> Details</button>'
        : '<button type="button" class="sopa-btn sopa-btn--secondary sopa-js-view" data-bcode="' +
          encCode +
          '"><i class="fa fa-folder-open" aria-hidden="true"></i> View details</button>';

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
        metaCreator +
        "</div></div>" +
        '<div class="sopa-amount-block"><div class="sopa-amount">' +
        amountText +
        '</div><span class="sopa-status sopa-status--pending">Pending</span></div></div>' +
        '<div class="sopa-metrics" role="group" aria-label="Quantities and amount">' +
        '<div class="sopa-metric"><span class="sopa-metric-lbl">Qty MT</span><span class="sopa-metric-val">' +
        qtyMt +
        "</span></div>" +
        '<div class="sopa-metric"><span class="sopa-metric-lbl">Qty PC</span><span class="sopa-metric-val">' +
        qtyPc +
        "</span></div>" +
        '<div class="sopa-metric"><span class="sopa-metric-lbl">Qty MR</span><span class="sopa-metric-val">' +
        qtyMr +
        "</span></div>" +
        '<div class="sopa-metric"><span class="sopa-metric-lbl">Amount</span><span class="sopa-metric-val">' +
        lineAmountText +
        "</span></div></div>" +
        '<div class="sopa-verify-pending" role="status"><i class="fa fa-exclamation-circle" aria-hidden="true"></i><span>Please verify — pending</span></div>' +
        '<div class="sopa-card-foot">' +
        actions +
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

    $(document).on("click", "#SaleOrderApprovalCards .sopa-js-approve", function () {
        const c = decodeURIComponent($(this).attr("data-bcode") || "");
        if (c) SaleOrderApprovedlist(c);
    });
    $(document).on("click", "#SaleOrderApprovalCards .sopa-js-view", function () {
        const c = decodeURIComponent($(this).attr("data-bcode") || "");
        if (c) ViewData(c);
    });
});
function GetSaleOrderApproval() {
    SaleOrderApprovalService.GetUnApprovedSaleOrders(FrmAction).then(function (response) {
        if (response.length > 0) {
            G_SaleOrderListRaw = response;
            G_SaleOrderCardPage = 1;
            $("#SaleOrderApprovalList").show();
            paintSaleOrderCards();
        } else {
            toastr.error("No data found:", response);
            G_SaleOrderListRaw = [];
            $("#SaleOrderApprovalCards").html("");
            $("#sopa-cards-paginator").empty();
            $("#SaleOrderApprovalList").hide();
        }
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
    });
}
function ViewData(Code) {
    SaleOrderApprovalService.GetSaleOrderDetail(Code).then(function (response) {
        if (response && response.length > 0) {
            $('#myModal').modal({
                backdrop: 'static',
            });
            $('#myModal').modal('show');
            const detailRows = normalizeSaleOrderDetailRows(response);
            const lineGridRows = stripKeysFromRows(detailRows, SALE_ORDER_DETAIL_GRID_HIDDEN);
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "BuyerPOMaster_Code"];
            const ColumnAlignment = {
                "Order Date": "center",
                "BuyerPOMaster_Code": "center",
                "Qty MT": "right",
                "Qty PC": "right",
                "Qty MR": "right",
                "Qty KG": "right",
                "Qty SQM": "right",
                "Amount": "right",
                "Freight/Unit": "right",
            };
            BizsolCustomFilterGrid.CreateDataTable(
                "table-header-SaleOrderApprovalTable",
                "table-body-SaleOrderApprovalTable",
                lineGridRows,
                Button,
                showButtons,
                StringFilterColumn,
                NumericFilterColumn,
                DateFilterColumn,
                StringdoubleFilterColumn,
                hiddenColumns,
                ColumnAlignment
            );
            populateSaleOrderDetailHeaderPanel(detailRows[0]);
            SaleOrderDeliveryTerms(Code, detailRows[0]);
        } else {
            clearSaleOrderDetailHeaderPanel();
            toastr.error("No valid data found:", response);
        }
    }).catch(error => {
        clearSaleOrderDetailHeaderPanel();
        toastr.error("Error in fetching data:", error);
    });
}
function SaleOrderDeliveryTerms(Code, masterRow) {
    SaleOrderApprovalService.GetSaleOrderDeliveryTermsDetail(Code).then(function (response) {
        if (response && response.length > 0) {
            $('#myModal').modal({
                backdrop: 'static',
            });
            $('#myModal').modal('show');
            const termsRows = mergeTermsRowsWithMaster(normalizeSaleOrderDetailRows(response), masterRow);
            const StringFilterColumn = [];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "BuyerPOMaster_Code"];
            const ColumnAlignment = {
                "Order Date": "center",
                "BuyerPOMaster_Code": "center",
                "Qty MT": "right",
                "Qty PC": "right",
                "Qty MR": "right",
                "Qty KG": "right",
                "Qty SQM": "right",
                "Amount": "right",
            };
            BizsolCustomFilterGrid.CreateDataTable(
                "table-header-SaleOrderDeliveryTermsTable",
                "table-body-SaleOrderDeliveryTermsTable",
                termsRows,
                Button,
                showButtons,
                StringFilterColumn,
                NumericFilterColumn,
                DateFilterColumn,
                StringdoubleFilterColumn,
                hiddenColumns,
                ColumnAlignment
            );
            $('#paginator-SaleOrderDeliveryTermsTable').hide();
        } else {
            toastr.error("No valid data found:", response);
        }
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
    });
}
function CloseModal() {
    clearSaleOrderDetailHeaderPanel();
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