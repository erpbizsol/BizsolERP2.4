import { ProductionOrderService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProductionOrderService.js';

let FrmType = '';
let FrmAction = '';
let G_ListRaw = [];
let G_CardPage = 1;
let G_PageSize = 10;
let G_CurrentCode = 0;
let G_CurrentRow = null;
const PRO_ITEM_COL_COUNT = 18;

function escapeHtml(s) {
    if (s == null || s === '') return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function rowField(item, keys) {
    if (!item) return '';
    const arr = Array.isArray(keys) ? keys : [keys];
    for (let i = 0; i < arr.length; i++) {
        const k = arr[i];
        if (Object.prototype.hasOwnProperty.call(item, k)) {
            const v = item[k];
            if (v != null && v !== '') return String(v);
        }
    }
    const objKeys = Object.keys(item);
    for (let i = 0; i < arr.length; i++) {
        const want = String(arr[i]).toLowerCase().replace(/\s+/g, '');
        const found = objKeys.find(function (k) {
            return k.toLowerCase().replace(/\s+/g, '') === want;
        });
        if (found && item[found] != null && String(item[found]) !== '') {
            return String(item[found]);
        }
    }
    return '';
}

function displayCell(val) {
    if (val === null || val === undefined || String(val).trim() === '') return '—';
    return escapeHtml(val);
}

function formatQty(val) {
    const n = parseFloat(String(val ?? '').replace(/,/g, '').trim());
    if (isNaN(n)) return '—';
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}

function reviewActionLabel() {
    const a = String(FrmAction || 'Verify').trim();
    if (!a || a === 'undefined') return 'Review & Verify';
    if (/^verify$/i.test(a)) return 'Review & Verify';
    if (/^approve$/i.test(a)) return 'Review & Approve';
    if (/^check$/i.test(a)) return 'Review & Check';
    return 'Review & ' + a;
}

function verifyButtonLabel() {
    const a = String(FrmAction || 'Verify').trim();
    if (!a || a === 'undefined') return 'Verify';
    return a;
}

function statusClass(statusText) {
    const s = String(statusText || '').toUpperCase();
    if (s.indexOf('PROCESS') >= 0) return 'pro-status--process';
    if (s.indexOf('COMPLETE') >= 0) return 'pro-status--done';
    return 'pro-status--pending';
}

function getFromList(code) {
    return G_ListRaw.find(function (p) {
        return String(p.Code || p.WorkOrderPlanMaster_Code) === String(code);
    }) || null;
}

function renderCard(item) {
    const code = rowField(item, ['Code', 'WorkOrderPlanMaster_Code']) || '0';
    const entryNo = escapeHtml(rowField(item, ['EntryNo', 'Entry No']) || '—');
    const party = escapeHtml(rowField(item, ['Party Name', 'PartyName', 'Process', 'Warehouse']) || '—');
    const orderDate = escapeHtml(rowField(item, ['Order Date', 'EntryDate', 'Entry Date']) || '—');
    const statusText = escapeHtml(rowField(item, ['Status Text', 'StatusText', 'Status']) || 'PENDING');
    const warehouse = escapeHtml(rowField(item, ['Warehouse']) || '');
    const process = escapeHtml(rowField(item, ['Process']) || '');
    const machine = escapeHtml(rowField(item, ['Machine']) || '');
    const frmLabel = escapeHtml(FrmAction || 'Verify');

    const sub = [
        warehouse ? '<span><i class="fa fa-warehouse me-1"></i>' + warehouse + '</span>' : '',
        process ? '<span><i class="fa fa-cogs me-1"></i>' + process + '</span>' : '',
        machine ? '<span><i class="fa fa-industry me-1"></i>' + machine + '</span>' : '',
    ].filter(Boolean).join('');

    return (
        '<article class="pro-card section-entry-animation" role="listitem" data-code="' + escapeHtml(code) + '">' +
        '<div class="pro-card-head">' +
        '<div class="pro-po-badge"><span class="pro-po-label">WO#</span><span class="pro-po-no">' + entryNo + '</span></div>' +
        '<div class="pro-company-block">' +
        '<div class="pro-company-title"><i class="fa fa-building" aria-hidden="true"></i><span>' + party + '</span></div>' +
        '<div class="pro-meta">' +
        '<span><i class="far fa-calendar-alt" aria-hidden="true"></i>' + orderDate + '</span>' +
        '<span class="pro-tag"><i class="fa fa-file-invoice" aria-hidden="true"></i> ' + frmLabel + '</span>' +
        '</div></div>' +
        '<div class="pro-amount-block">' +
        '<span class="pro-status ' + statusClass(statusText) + '">' + statusText + '</span>' +
        '</div></div>' +
        '<div class="pro-card-foot">' +
        '<div class="pro-submeta">' + (sub || '<span>&nbsp;</span>') + '</div>' +
        '<button type="button" class="pro-btn pro-js-view" data-code="' + encodeURIComponent(code) + '">' +
        '<i class="fa fa-folder-open" aria-hidden="true"></i> ' + escapeHtml(reviewActionLabel()) +
        '</button></div></article>'
    );
}

function renderPaginator(total, page, pageSize) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const p = Math.min(Math.max(1, page), pages);
    const start = total === 0 ? 0 : (p - 1) * pageSize + 1;
    const end = Math.min(p * pageSize, total);
    const $nav = $('#pro-cards-paginator');
    if (total === 0) {
        $nav.empty();
        return;
    }
    const disFirst = p <= 1 ? ' disabled' : '';
    const disLast = p >= pages ? ' disabled' : '';
    $nav.html(
        '<div class="pro-page-size"><span>Lines per page</span>' +
        '<select id="pro-page-size-sel" class="form-control form-control-sm" style="width:auto;display:inline-block">' +
        [10, 20, 50].map(function (n) {
            return '<option value="' + n + '"' + (n === pageSize ? ' selected' : '') + '>' + n + '</option>';
        }).join('') +
        '</select></div>' +
        '<div class="pro-paginator__nav">' +
        '<button type="button" class="pro-paginator__btn pro-pg-first"' + disFirst + ' title="First"><i class="fa fa-angle-double-left"></i></button>' +
        '<button type="button" class="pro-paginator__btn pro-pg-prev"' + disFirst + ' title="Previous"><i class="fa fa-angle-left"></i></button>' +
        '</div>' +
        '<span class="pro-paginator__info">' + start + ' \u2013 ' + end + ' of ' + total + '</span>' +
        '<div class="pro-paginator__nav">' +
        '<button type="button" class="pro-paginator__btn pro-pg-next"' + disLast + ' title="Next"><i class="fa fa-angle-right"></i></button>' +
        '<button type="button" class="pro-paginator__btn pro-pg-last"' + disLast + ' title="Last"><i class="fa fa-angle-double-right"></i></button>' +
        '</div>'
    );

    $('.pro-pg-first').off('click').on('click', function () {
        if (G_CardPage > 1) { G_CardPage = 1; paintCards(); }
    });
    $('.pro-pg-prev').off('click').on('click', function () {
        if (G_CardPage > 1) { G_CardPage--; paintCards(); }
    });
    $('.pro-pg-next').off('click').on('click', function () {
        if (G_CardPage < Math.ceil(total / pageSize)) { G_CardPage++; paintCards(); }
    });
    $('.pro-pg-last').off('click').on('click', function () {
        const pg = Math.max(1, Math.ceil(total / pageSize));
        if (G_CardPage !== pg) { G_CardPage = pg; paintCards(); }
    });
    $('#pro-page-size-sel').off('change').on('change', function () {
        G_PageSize = parseInt($(this).val(), 10) || 10;
        G_CardPage = 1;
        paintCards();
    });
}

function paintCards() {
    const all = G_ListRaw;
    const pageSize = G_PageSize;
    let p = G_CardPage;
    const total = all.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (p > pages) p = pages;
    G_CardPage = p;
    const start = (p - 1) * pageSize;
    const slice = all.slice(start, start + pageSize);
    const $box = $('#ProductionOrderCards');
    if (!total) {
        $box.html('');
        $('#pro-cards-paginator').empty();
        $('#proEmpty').show();
        return;
    }
    $('#proEmpty').hide();
    $box.html(slice.map(renderCard).join(''));
    renderPaginator(total, G_CardPage, pageSize);
}

function updateStats() {
    const pending = G_ListRaw.length;
    const el = document.getElementById('statPendingProductionOrder');
    if (el) el.textContent = pending > 0 ? pending : '—';
}

function buildInfoItem(label, value, icon, valueColor) {
    const clr = valueColor ? 'style="color:' + valueColor + ';font-weight:800;"' : '';
    return '<div class="pro-info-item">' +
        '<span class="pro-info-lbl"><i class="fa ' + icon + ' me-1"></i>' + escapeHtml(label) + '</span>' +
        '<span class="pro-info-val" ' + clr + '>' + value + '</span>' +
        '</div>';
}

function buildModalHeader(row, items) {
    if (!row) return '';
    let qty = parseFloat(String(rowField(row, ['Total Qty KG', 'TotalQtyKG']) || '').replace(/,/g, ''));
    if (isNaN(qty) || qty === 0) {
        qty = (items || []).reduce(function (acc, it) {
            const v = parseFloat(String(rowField(it, ['Order Qty KG', 'OrderQtyKG', 'QtyMT_Finish']) || '').replace(/,/g, ''));
            return acc + (isNaN(v) ? 0 : v);
        }, 0);
    }
    const statusTxt = escapeHtml(rowField(row, ['Status Text', 'StatusText', 'Status']) || 'Pending');
    return '<div class="pro-info-grid">' +
        buildInfoItem('Total Qty KG', escapeHtml(formatQty(qty)), 'fa-balance-scale', '#667eea') +
        buildInfoItem('Status', statusTxt, 'fa-info-circle') +
        buildInfoItem('Action', escapeHtml(FrmAction || 'Verify'), 'fa-user-check') +
        '</div>';
}

function syncModalTitle(row) {
    if (!row) {
        $('#proModalTitle').text('View Details');
        $('#proModalDate').text('');
        $('#proModalDateWrap').hide();
        return;
    }
    const entryNo = rowField(row, ['EntryNo', 'Entry No']) || '—';
    const party = rowField(row, ['Party Name', 'PartyName', 'Process', 'Warehouse']) || '';
    const orderDate = rowField(row, ['Order Date', 'EntryDate', 'Entry Date']) || '';
    $('#proModalTitle').text('WO# ' + entryNo + (party ? ' — ' + party : ''));
    if (orderDate) {
        $('#proModalDate').text(orderDate);
        $('#proModalDateWrap').show();
    } else {
        $('#proModalDate').text('');
        $('#proModalDateWrap').hide();
    }
}

function renderModalItems(items) {
    const $b = $('#proModalItemsBody');
    if (!items || items.length === 0) {
        $b.html(
            '<tr><td colspan="' + PRO_ITEM_COL_COUNT + '" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">No items found.</td></tr>'
        );
        return;
    }

    let html = '';
    items.forEach(function (item, idx) {
        html +=
            '<tr>' +
            '<td class="text-center">' + (idx + 1) + '</td>' +
            '<td>' + displayCell(rowField(item, ['Order No', 'OrderNo'])) + '</td>' +
            '<td>' + displayCell(rowField(item, ['Cust. Code', 'CustCode', 'AccountCode'])) + '</td>' +
            '<td style="font-weight:600;">' + displayCell(rowField(item, ['Order Item Name', 'OrderItemName'])) + '</td>' +
            '<td>' + displayCell(rowField(item, ['Order Item Size', 'OrderItemSize'])) + '</td>' +
            '<td class="text-end">' + displayCell(rowField(item, ['Order Qty PC', 'OrderQtyPC'])) + '</td>' +
            '<td class="text-end" style="font-weight:700;color:#667eea;">' +
            escapeHtml(formatQty(rowField(item, ['Order Qty KG', 'OrderQtyKG', 'QtyMT_Finish']))) +
            '</td>' +
            '<td>' + displayCell(rowField(item, ['I/P Item Name', 'IP Item Name', 'IPItemName'])) + '</td>' +
            '<td>' + displayCell(rowField(item, ['Input Roll', 'InputRoll', 'InputID'])) + '</td>' +
            '<td>' + displayCell(rowField(item, ['I/P Item Size', 'IP Item Size', 'IPItemSize'])) + '</td>' +
            '<td class="text-end">' + escapeHtml(formatQty(rowField(item, ['I/P Weight', 'IP Weight', 'QtyMT_Input']))) + '</td>' +
            '<td>' + displayCell(rowField(item, ['WIP Item Name', 'WIPItemName'])) + '</td>' +
            '<td>' + displayCell(rowField(item, ['WIP Item Size', 'WIPItemSize'])) + '</td>' +
            '<td class="text-end">' + escapeHtml(formatQty(rowField(item, ['WIP Qty KG', 'WIPQtyKG', 'QtyMT_WIP']))) + '</td>' +
            '<td class="text-end">' + displayCell(rowField(item, ['Priority', 'PriorityNo'])) + '</td>' +
            '<td>' + displayCell(rowField(item, ['Order Remark', 'Remark'])) + '</td>' +
            '<td>' + displayCell(rowField(item, ['Profile'])) + '</td>' +
            '<td>' + displayCell(rowField(item, ['Status']) || 'PENDING') + '</td>' +
            '</tr>';
    });
    $b.html(html);
}

function proRemoveOrphanBackdrops() {
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

function proShowModal($el) {
    const el = $el && $el[0];
    if (!el) return;
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        let inst = bootstrap.Modal.getInstance(el);
        if (!inst) inst = new bootstrap.Modal(el, { backdrop: 'static', keyboard: false });
        inst.show();
    } else {
        $el.modal({ backdrop: 'static', keyboard: false, show: true });
    }
}

function proHideModal($el) {
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

function loadDetailContent(code) {
    G_CurrentCode = parseInt(code, 10) || 0;
    G_CurrentRow = getFromList(code);
    const row = G_CurrentRow;

    $('#hfProCode').val(String(G_CurrentCode));
    $('#btnProModalVerifyLabel').text(verifyButtonLabel());
    syncModalTitle(row);
    $('#proModalHeader').html(row ? buildModalHeader(row, null) : '');
    $('#proModalItemsBody').html(
        '<tr><td colspan="' + PRO_ITEM_COL_COUNT + '" class="text-center py-3" style="color:#94a3b8;font-size:0.82rem;">' +
        '<i class="fa fa-spinner fa-spin me-1"></i>Loading items…</td></tr>'
    );

    ProductionOrderService.GetDetail(G_CurrentCode).then(function (response) {
        const items = Array.isArray(response) ? response : [];
        if (items.length > 0) {
            $('#proModalHeader').html(row ? buildModalHeader(row, items) : '');
            renderModalItems(items);
        } else {
            renderModalItems([]);
            toastr.warning('No line items found.');
        }
    }).catch(function (error) {
        renderModalItems([]);
        toastr.error('Error in fetching data: ' + (error || ''));
    });
}

function ViewData(code) {
    code = String(code || '').trim();
    if (!code) return;

    proRemoveOrphanBackdrops();
    loadDetailContent(code);

    const $detail = $('#proModal');
    $detail.off('shown.bs.modal.proScroll').one('shown.bs.modal.proScroll', function () {
        const wrap = this.querySelector('.pro-items-table-wrap');
        if (wrap) wrap.scrollTop = 0;
        document.body.style.overflow = 'hidden';
    });
    $detail.off('hidden.bs.modal.proClean').one('hidden.bs.modal.proClean', function () {
        document.body.style.overflow = '';
        proRemoveOrphanBackdrops();
    });
    proShowModal($detail);
}

function CloseProModal() {
    G_CurrentCode = 0;
    G_CurrentRow = null;
    $('#proModalDate').text('');
    $('#proModalDateWrap').hide();
    $('#proModal').one('hidden.bs.modal.proClose', function () {
        proRemoveOrphanBackdrops();
        document.body.style.overflow = '';
    });
    proHideModal($('#proModal'));
}

function ProModalVerify() {
    const code = $('#hfProCode').val() || G_CurrentCode;
    if (!code || parseInt(code, 10) <= 0) {
        toastr.warning('No production order selected.');
        return;
    }
    if (!confirm('Are you sure you want to ' + verifyButtonLabel() + ' this Production Order?')) {
        return;
    }

    const $btn = $('#btnProModalVerify');
    $btn.prop('disabled', true);

    ProductionOrderService.ApprovedOrVerify(code, FrmAction || 'Verify', FrmType).then(function (res) {
        $btn.prop('disabled', false);
        const status = res && (res.Status || res.status);
        const msg = (res && (res.Msg || res.msg)) || '';
        if (String(status).toUpperCase() === 'Y') {
            toastr.success(msg || (verifyButtonLabel() + ' successfully.'));
            CloseProModal();
            loadList();
            if (typeof GetWebNotificationList === 'function') {
                GetWebNotificationList();
            }
        } else {
            toastr.error(msg || (verifyButtonLabel() + ' failed.'));
        }
    }).catch(function (err) {
        $btn.prop('disabled', false);
        toastr.error('Error: ' + (err || ''));
    });
}

function loadList() {
    $('#proLoading').show();
    $('#ProductionOrderList').hide();
    $('#proEmpty').hide();
    ProductionOrderService.GetPendingList(FrmAction, FrmType).then(function (response) {
        $('#proLoading').hide();
        if (response && response.length > 0) {
            G_ListRaw = response;
            G_CardPage = 1;
            $('#ProductionOrderList').show();
            updateStats();
            paintCards();
        } else {
            G_ListRaw = [];
            updateStats();
            $('#ProductionOrderCards').html('');
            $('#pro-cards-paginator').empty();
            $('#proEmpty').show();
        }
    }).catch(function (error) {
        $('#proLoading').hide();
        toastr.error('Error in fetching data: ' + (error || ''));
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

$(document).ready(function () {
    const urlParams = getUrlVars();
    const menuValue = decodeURI(urlParams['menu'] || '');
    FrmType = decodeURI(urlParams['FrmType'] || '');
    FrmAction = decodeURI(urlParams['FrmAction'] || '');

    if (menuValue && menuValue !== 'undefined' && menuValue !== '') {
        $('#ERPHeading').text(menuValue);
        $('#proPageTitle').text(menuValue);
    } else {
        $('#ERPHeading').text('Production Order');
    }

    $('#btnProModalVerifyLabel').text(verifyButtonLabel());

    $(document).on('click', '#ProductionOrderCards .pro-js-view', function () {
        const c = decodeURIComponent($(this).attr('data-code') || '');
        if (c) ViewData(c);
    });

    loadList();
});

window.ViewData = ViewData;
window.CloseProModal = CloseProModal;
window.ProModalVerify = ProModalVerify;
