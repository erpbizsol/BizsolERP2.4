import { POApprovalService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/POApprovalService.js';
let FrmType = '';
let FrmAction = '';
let G_POA_LIST = [];
let G_CurrentPOA = null;
const POA_ITEM_COL_COUNT = 17;
$(document).ready(function () {
    var urlParams = getUrlVars();
    var menuValue = decodeURI(urlParams['menu']);
     FrmType = decodeURI(urlParams['FrmType']);
     FrmAction = decodeURI(urlParams['FrmAction']);
    
    if (menuValue && menuValue !== "undefined" && menuValue !== "") {
        $("#ERPHeading").text(menuValue);
    }
    else {
        $("#ERPHeading").text("PO Approval");
    }

    $('#myHistoryModal').on('hidden.bs.modal', function () {
        $(this).css('z-index', '');
        poaCleanupModalState();
    });

    $('#myModal').on('hidden.bs.modal', function () {
        poaCleanupModalState();
    });

    $(document).on('click', '.btn-poa-view', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const code = $(this).data('code') || $(this).closest('.poa-po-card').data('code');
        if (code) ViewData(String(code));
    });

    poaRemoveOrphanBackdrops();
    unApprovedPO();
});

function EscHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function FmtDateDisplay(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    return String(dt.getDate()).padStart(2, '0') + '/' +
        String(dt.getMonth() + 1).padStart(2, '0') + '/' +
        dt.getFullYear();
}

function FmtCurrency(val) {
    const n = parseMoneyValue(val);
    if (isNaN(n)) return '—';
    return '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseMoneyValue(val) {
    if (val === null || val === undefined || val === '') return NaN;
    if (typeof val === 'number' && isFinite(val)) return val;
    const s = String(val).replace(/Rs\.?/gi, '').replace(/,/g, '').trim();
    const n = parseFloat(s);
    return isNaN(n) ? NaN : n;
}

function pickField(o, keys) {
    if (!o) return '';
    for (let i = 0; i < keys.length; i++) {
        const val = o[keys[i]];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
            return String(val).trim();
        }
    }
    const objKeys = Object.keys(o);
    for (let i = 0; i < keys.length; i++) {
        const want = keys[i].toLowerCase().replace(/\s+/g, '');
        const found = objKeys.find(function (k) {
            return k.toLowerCase().replace(/\s+/g, '') === want;
        });
        if (found) {
            const v = o[found];
            if (v !== undefined && v !== null && String(v).trim() !== '') {
                return String(v).trim();
            }
        }
    }
    return '';
}

function getPOFromList(code) {
    return G_POA_LIST.find(function (p) {
        return String(p.Code || p.PurchaseOrderMaster_Code) === String(code);
    }) || null;
}

function getListTotalAmount(po) {
    if (!po) return NaN;
    return parseMoneyValue(po['Total Bill Amount'] || po.TotalBillAmount || po.TotalAmount || po.Amount);
}

function getListProductSummary(po) {
    if (!po) return '';
    return String(po.Product || po['Product'] || '').trim().replace(/,\s*$/, '');
}

function buildItemDescription(item, listPo, itemIndex, itemCount) {
    let desc = pickField(item, [
        'Product', 'Item Description', 'ItemDescription', 'Item Name', 'ItemName',
        'Item', 'Description', 'Product Description'
    ]);
    if (!desc && listPo && itemCount === 1) {
        desc = getListProductSummary(listPo);
    }
    if (!desc) {
        const parts = [];
        const add = function (s) {
            s = String(s || '').trim();
            if (!s) return;
            if (!parts.some(function (p) { return p.toLowerCase() === s.toLowerCase(); })) {
                parts.push(s);
            }
        };
        add(pickField(item, ['Size Description', 'SizeDescription', 'Size']));
        add(pickField(item, ['Specification', 'ItemSpecificationDesp', 'Item Specification']));
        desc = parts.join(', ');
    }
    return desc || '—';
}

function displayCell(val) {
    if (val === null || val === undefined || String(val).trim() === '') return '—';
    return EscHtml(val);
}

/** Remove invisible backdrops that block page clicks. */
function poaRemoveOrphanBackdrops() {
    const visibleCount = $('.modal.show:visible').length;
    const $backs = $('.modal-backdrop');
    if (visibleCount === 0) {
        $backs.remove();
        $('body').removeClass('modal-open');
        $('body').css({ overflow: '', paddingRight: '' });
    } else {
        while ($backs.length > visibleCount) {
            $backs.last().remove();
        }
    }
}

function poaModalIsVisible($el) {
    return $el.length > 0 && $el.hasClass('show') && $el.is(':visible');
}

function poaClearStaleModal($el) {
    if ($el.hasClass('show') && !$el.is(':visible')) {
        $el.removeClass('show').css('display', 'none').attr('aria-hidden', 'true');
    }
}

/** Remove stale Bootstrap backdrops / body lock after nested modals. */
function poaCleanupModalState() {
    poaRemoveOrphanBackdrops();
    $('#myModal, #myHistoryModal').css('z-index', '');
}

function poaShowModal($el, options) {
    const el = $el && $el[0];
    if (!el) return;
    const opts = Object.assign({ backdrop: 'static', keyboard: false }, options || {});
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        let inst = bootstrap.Modal.getInstance(el);
        if (!inst) inst = new bootstrap.Modal(el, opts);
        inst.show();
    } else {
        $el.modal(Object.assign({ show: true }, opts));
    }
}

function poaHideModal($el) {
    const el = $el && $el[0];
    if (!el) return;
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const inst = bootstrap.Modal.getInstance(el);
        if (inst) inst.hide();
        else $el.modal('hide');
    } else {
        $el.modal('hide');
    }
}

function poaShowHistoryModal() {
    const $history = $('#myHistoryModal');
    $history.off('shown.bs.modal.poaStack').on('shown.bs.modal.poaStack', function () {
        const $backs = $('.modal-backdrop');
        if ($backs.length > 1) {
            $backs.last().css('z-index', 1055);
        }
        $(this).css('z-index', 1060);
    });
    poaShowModal($history);
}

function poaLoadDetailContent(Code) {
    PODeliveryTermsDetails(Code);
    G_CurrentPOA = getPOFromList(Code);
    const po = G_CurrentPOA;
    $('#poaModalPONo').text(po ? `PO# ${po['PO No'] || po.PONo || ''}` : 'View Details');
    $('#poaModalVendor').text(po ? (po['Party Name'] || po.VendorName || '') : '');
    $('#poaModalHeader').html(po ? BuildPOAModalHeader(po, null) : '');
    $('#poaModalItemsBody').html(
        `<tr><td colspan="${POA_ITEM_COL_COUNT}" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">
            <i class="fa fa-spinner fa-spin me-1"></i>Loading items…
        </td></tr>`
    );
    $('#hfCodeForBack').val(Code);

    POApprovalService.GetPODetail(Code).then(function (response) {
        if (response && response.length > 0) {
            $('#poaModalHeader').html(po ? BuildPOAModalHeader(po, response) : '');
            RenderPOAModalItems(response, po);
        } else {
            toastr.error("No valid data found:", response);
            RenderPOAModalItems([], po);
        }
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
        RenderPOAModalItems([], po);
    });
}

function ShowPOA_Loading(show) {
    const $loading = $('#poApprovalLoading');
    const $list = $('#poApprovalList');
    if (show) {
        $loading.show();
        $list.hide();
    } else {
        $loading.hide();
        $list.show();
    }
}

function ShowPOA_Empty(show) {
    const $empty = $('#poApprovalEmpty');
    $empty.toggle(!!show);
}

function UpdatePOA_Stats(list) {
    const total = Array.isArray(list) ? list.length : 0;
    $('#statPOA_Total').text(total ? total : '—');
    $('#statPOA_Pending').text(total ? total : '—');
}

function NormalizePOARow(po) {
    // Expecting columns like: Code, PO No, Party Name, PO Date, Total Bill Amount
    return po || {};
}

function BuildPOACard(po) {
    po = NormalizePOARow(po);
    const code = po.Code || po.PurchaseOrderMaster_Code || 0;
    const poNo = EscHtml(po['PO No'] || po.PONo || po.PONumber || po.DocNo || '—');
    const vendor = EscHtml(po['Party Name'] || po.VendorName || po.PartyName || '—');
    const poDate = FmtDateDisplay(po['PO Date'] || po.PODate || po.DocDate);
    const amtNum = getListTotalAmount(po);
    const amount = FmtCurrency(isNaN(amtNum) ? 0 : amtNum);

    const statusTxt = 'Pending';
    const statusClr = '#d97706';
    const statusBg = '#fef3c7';

    return `
    <div class="poa-po-card section-entry-animation" data-code="${code}">
        <div class="poa-po-card-header">
            <div class="poa-po-no-badge">
                <span style="font-size:0.6rem;font-weight:600;opacity:0.82;line-height:1;">PO#</span>
                <span style="font-weight:800;font-size:0.82rem;line-height:1.2;">${poNo}</span>
            </div>
            <div class="poa-po-card-vendor">
                <div class="poa-po-vendor-name">
                    <i class="fa fa-building me-1" style="color:#667eea;font-size:0.72rem;"></i>${vendor}
                </div>
                <div class="poa-po-card-meta">
                    <span><i class="fa fa-calendar-alt me-1"></i>${EscHtml(poDate || '—')}</span>
                </div>
            </div>
            <div class="poa-po-card-right">
                <div class="poa-po-amount">${amount}</div>
                <div class="poa-po-status-badge" style="color:${statusClr};background:${statusBg};">${statusTxt}</div>
                <button type="button" class="btn-poa-view"
                        data-code="${code}"
                        style="padding:6px 12px;font-size:0.78rem;margin-top:6px;">
                    <i class="fa fa-eye me-1"></i>Review &amp; Verify Details
                </button>
            </div>
        </div>
    </div>`;
}

function RenderPOACards(list) {
    const $c = $('#poApprovalList');
    if (!list || list.length === 0) {
        $c.html('');
        ShowPOA_Empty(true);
        return;
    }
    ShowPOA_Empty(false);
    $c.html(list.map(BuildPOACard).join(''));
}

function BuildPOAModalHeader(po, items) {
    if (!po) return '';
    const poNo = EscHtml(po['PO No'] || po.PONo || po.PONumber || '—');
    const vendor = EscHtml(po['Party Name'] || po.VendorName || po.PartyName || '—');
    const poDate = EscHtml(FmtDateDisplay(po['PO Date'] || po.PODate || po.DocDate) || '—');
    let totalAmt = getListTotalAmount(po);
    if (isNaN(totalAmt) || totalAmt === 0) {
        totalAmt = (items || []).reduce(function (acc, it) {
            const v = parseMoneyValue(pickField(it, ['Amount', 'AmountAfterDiscount', 'LineAmount', 'NetAmount', 'Total']));
            return acc + (isNaN(v) ? 0 : v);
        }, 0);
    }
    const amount = EscHtml(FmtCurrency(totalAmt));

    return `
        <div class="poa-info-grid">
            <div class="poa-info-item">
                <span class="poa-info-lbl"><i class="fa fa-file-invoice me-1"></i>PO Number</span>
                <span class="poa-info-val">${poNo}</span>
            </div>
            <div class="poa-info-item">
                <span class="poa-info-lbl"><i class="fa fa-building me-1"></i>Vendor</span>
                <span class="poa-info-val">${vendor}</span>
            </div>
            <div class="poa-info-item">
                <span class="poa-info-lbl"><i class="fa fa-calendar-alt me-1"></i>PO Date</span>
                <span class="poa-info-val">${poDate}</span>
            </div>
            <div class="poa-info-item">
                <span class="poa-info-lbl"><i class="fa fa-rupee-sign me-1"></i>Total Amount</span>
                <span class="poa-info-val" style="color:#667eea;font-weight:800;">${amount}</span>
            </div>
            <div class="poa-info-item">
                <span class="poa-info-lbl"><i class="fa fa-info-circle me-1"></i>Status</span>
                <span class="poa-info-val">Pending</span>
            </div>
            <div class="poa-info-item">
                <span class="poa-info-lbl"><i class="fa fa-user-check me-1"></i>Action</span>
                <span class="poa-info-val">${EscHtml(FrmAction || 'Approve')}</span>
            </div>
        </div>`;
}

function RenderPOAModalItems(items, listPo) {
    const $b = $('#poaModalItemsBody');
    if (!items || items.length === 0) {
        $b.html(`<tr><td colspan="${POA_ITEM_COL_COUNT}" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No items found.</td></tr>`);
        return;
    }

    const itemCount = items.length;
    let html = '';
    items.forEach(function (item) {
        const itemCode = pickField(item, ['Item Code', 'ItemCode', 'Item_Code']);
        const itemDesc = EscHtml(buildItemDescription(item, listPo, 0, itemCount));
        const poQty = displayCell(pickField(item, ['PO Qty', 'Qty', 'Quantity', 'POQty']));
        const tolerance = displayCell(pickField(item, ['Tolerance %', 'Tolerance', 'TolerancePercent']));
        const rate = displayCell(pickField(item, ['Rate', 'UnitRate']));
        const discount = displayCell(pickField(item, ['Dis. (%)', 'Dis (%)', 'Discount', 'Dis.%']));
        const rateAfterDisc = displayCell(pickField(item, ['Rate After Discount', 'RateAfterDiscount']));
        const amount = displayCell(pickField(item, ['Amount', 'AmountAfterDiscount', 'LineAmount', 'NetAmount']));
        const indentNo = displayCell(pickField(item, ['Indent No', 'IndentNo', 'Indent_No']));
        const requestedBy = displayCell(pickField(item, ['Requested By', 'RequestedBy']));
        const lastPoDate = displayCell(pickField(item, ['Last Po Date', 'Last PO Date', 'LastPODate']));
        const lastPoRate = displayCell(pickField(item, ['Last PO Rate', 'LastPORate', 'Last Po Rate']));
        const lastPurchasedFrom = displayCell(pickField(item, ['Last Purchased From', 'LastPurchasedFrom']));
        const lastPurchasedQty = displayCell(pickField(item, ['Last Purchased Qty', 'LastPurchasedQty']));
        const purpose = displayCell(pickField(item, ['Purpose', 'PO Purpose']));
        const machineNo = displayCell(pickField(item, ['Machine No', 'MachineNo', 'Machine_No']));

        const itemMasterCode = pickField(item, ['ItemMaster_Code', 'ItemMaster Code']) || item.ItemMaster_Code || '';
        const sizeCode = pickField(item, ['itemsizemaster_Code', 'ItemSizeMaster_Code']) || item.itemsizemaster_Code || '';
        const indentMasterCode = pickField(item, ['IndentMaster_Code', 'IndentMaster Code']) || item.IndentMaster_Code || '';
        const showPOWithOutIndentButton = String(item.AllowPOWithOutIndent_RawMaterial_Code || '').toUpperCase() === 'N';

        const actionBtns = `
            <button class="btn btn-success icon-height mb-1" title="View History"
                    onclick="ViewHistory('${itemMasterCode}', '${sizeCode}')" style="padding:4px 8px;">
                <i class="fa fa-eye" aria-hidden="true"></i>
            </button>
            ${showPOWithOutIndentButton ? `
            <button class="btn btn-primary icon-height mb-1" title="Price Comparison"
                    onclick="POWithOutIndent('${indentMasterCode}')" style="padding:4px 8px;">
                <i class="fa fa-eye" aria-hidden="true"></i>
            </button>` : ''}`;

        html += `<tr>
            <td>${displayCell(itemCode)}</td>
            <td style="font-weight:600;">${itemDesc}</td>
            <td class="text-end">${poQty}</td>
            <td class="text-end">${tolerance}</td>
            <td class="text-end">${rate}</td>
            <td class="text-end">${discount}</td>
            <td class="text-end">${rateAfterDisc}</td>
            <td class="text-end" style="font-weight:700;color:#667eea;">${amount}</td>
            <td class="text-end">${indentNo}</td>
            <td>${requestedBy}</td>
            <td class="text-center">${lastPoDate}</td>
            <td class="text-end">${lastPoRate}</td>
            <td>${lastPurchasedFrom}</td>
            <td class="text-end">${lastPurchasedQty}</td>
            <td>${purpose}</td>
            <td>${machineNo}</td>
            <td class="text-center" style="white-space:nowrap;">${actionBtns}</td>
        </tr>`;
    });
    $b.html(html);
}

function RenderDeliveryTermsTable(rows) {
    const $thead = $('#poaDeliveryTermsHead');
    const $tbody = $('#poaDeliveryTermsBody');

    if (!rows || rows.length === 0) {
        $thead.html('<tr><th>Info</th></tr>');
        $tbody.html('<tr><td class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No delivery terms found.</td></tr>');
        return;
    }

    const keys = Object.keys(rows[0] || {});
    if (keys.length === 0) {
        $thead.html('<tr><th>Info</th></tr>');
        $tbody.html('<tr><td class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No delivery terms found.</td></tr>');
        return;
    }

    $thead.html('<tr>' + keys.map(k => `<th>${EscHtml(k)}</th>`).join('') + '</tr>');

    let html = '';
    rows.forEach(function (r) {
        html += '<tr>' + keys.map(k => `<td>${EscHtml(r[k])}</td>`).join('') + '</tr>';
    });
    $tbody.html(html);
}

function unApprovedPO() {
    ShowPOA_Loading(true);
    ShowPOA_Empty(false);
    POApprovalService.GetUnApprovedPO(FrmAction, FrmType).then(function (response) {
        if (response && response.length > 0) {
            G_POA_LIST = Array.isArray(response) ? response : [];
            UpdatePOA_Stats(G_POA_LIST);
            RenderPOACards(G_POA_LIST);
            ShowPOA_Loading(false);
        } else {
            G_POA_LIST = [];
            UpdatePOA_Stats(G_POA_LIST);
            RenderPOACards(G_POA_LIST);
            ShowPOA_Loading(false);
        }
    }).catch(error => {
        ShowPOA_Loading(false);
        toastr.error("Error in fetching data:", error);
    });
}
function ViewData(Code) {
    Code = String(Code || '').trim();
    if (!Code) return;
    $('#hfCodeForBack').val(Code);

    poaRemoveOrphanBackdrops();
    poaClearStaleModal($('#myModal'));
    poaClearStaleModal($('#myHistoryModal'));

    const $history = $('#myHistoryModal');
    const $detail = $('#myModal');

    function showDetailModal() {
        poaRemoveOrphanBackdrops();
        poaLoadDetailContent(Code);
        $detail.off('shown.bs.modal.poaScroll').one('shown.bs.modal.poaScroll', function () {
            $(this).find('.modal-body').scrollTop(0);
        });
        poaShowModal($detail);
    }

    if (poaModalIsVisible($history)) {
        $history.one('hidden.bs.modal.poaReopen', showDetailModal);
        poaHideModal($history);
        return;
    }

    if (poaModalIsVisible($detail)) {
        poaLoadDetailContent(Code);
        return;
    }

    showDetailModal();
}
function PODeliveryTermsDetails(Code) {
    POApprovalService.GetPODeliveryTermsDetail(Code).then(function (response) {
        RenderDeliveryTermsTable(response || []);
    }).catch(error => {
        toastr.error("Error in fetching data:", error);
        RenderDeliveryTermsTable([]);
    });
}
function CloseModal() {
    if ($('#myHistoryModal').hasClass('show')) {
        poaHideModal($('#myHistoryModal'));
    }
    $('#myModal').one('hidden.bs.modal.poaClose', function () {
        poaRemoveOrphanBackdrops();
        poaClearStaleModal($('#myModal'));
    });
    poaHideModal($('#myModal'));
}

function POA_ModalVerify() {
    const code = $('#hfCodeForBack').val() || '';
    if (!code) {
        toastr.warning('No PO selected.');
        return;
    }
    Approval(code);
}

function POA_ModalAttachment() {
    const code = $('#hfCodeForBack').val() || '';
    if (!code) {
        toastr.warning('No PO selected.');
        return;
    }
    AttchmentFile(code);
}

function Approval(Code) {
    POApprovalService.POApproved(Code, FrmAction, FrmType).then(function (approvedata) {
        if (approvedata.Status === "Y") {
            toastr.success(approvedata.Msg);
            unApprovedPO();
            GetWebNotificationList();
        }
        else {
            toastr.error(approvedata.Msg);
        }
    }).catch(function (error) {
        toastr.error("Error in PO Approval: ", error);
    });
}
function poaSetHistoryModalLabels(title, sectionTitle, subtitle) {
    $('#modal-title').text(title || 'View History');
    $('#poaHistorySectionTitle').html(
        `<i class="fa fa-list me-1"></i>${EscHtml(sectionTitle || 'PO History')}`
    );
    const $sub = $('#poaHistoryModalSub');
    if (subtitle) {
        $sub.text(subtitle).show();
    } else {
        $sub.text('').hide();
    }
}

function ViewHistory(ItemMaster_Code, itemsizemaster_Code) {
    if (!ItemMaster_Code) {
        toastr.warning('Item not available for history.');
        return;
    }
    POApprovalService.GetPOHistory(ItemMaster_Code, itemsizemaster_Code).then(function (response) {
        if (response && response.length > 0) {
            poaSetHistoryModalLabels('View History', 'PO History', 'Previous purchase orders for this item');
            poaShowHistoryModal();
            const stringFilterColumn = [];
            const numericFilterColumn = [];
            const dateFilterColumn = [];
            const button = false;
            const stringDoubleFilterColumn = [];
            const showButtons = [];
            const hiddenColumns = [];
            const ColumnAlignment = {
                "PO Date": "center",
                "PO No": "center",
                "QtyMT": "right",
                "Rate": "right",
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
    poaHideModal($('#myHistoryModal'));
}
function POWithOutIndent(IndentMaster_Code) {
    POApprovalService.GetPOIndentPriceComparisonDetails(IndentMaster_Code).then(function (response) {
        if (response && response.length > 0) {
            poaSetHistoryModalLabels('PO WithOut Indent History', 'Price Comparison', 'Indent price comparison details');
            poaShowHistoryModal();
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

function getUrlVars() {
    var vars = {};
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function BackButton() {
    poaHideModal($('#myHistoryModal'));
}
window.ViewData = ViewData;
window.CloseModal = CloseModal;
window.Approval = Approval;
window.ViewHistory = ViewHistory;
window.CloseHistoryModal = CloseHistoryModal;
window.POWithOutIndent = POWithOutIndent;
window.AttchmentFile = AttchmentFile;
window.BackButton = BackButton;
window.POA_ModalVerify = POA_ModalVerify;
window.POA_ModalAttachment = POA_ModalAttachment;