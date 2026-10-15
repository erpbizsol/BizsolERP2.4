import { POGRNBillingReportService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/POGRNBillingReportService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { ExportToExcelControl } from '../../Bizsol.WebERP.UI.Shared/js/ExportToExcel.js';

let G_POGRNRawRows = [];
let G_QtyValueMode = 'both';
let G_Drill = resetDrillState();

const FIELD = {
    project: ['ProjectDesp', 'projectDesp', 'ProjectName', 'projectName'],
    subProject: ['SubProjectDesp', 'subProjectDesp', 'SubProjectName', 'subProjectName'],
    poNo: ['PO no', 'PONo', 'PONO', 'PoNo', 'poNo'],
    poDate: ['Po date', 'PODate', 'PoDate', 'poDate'],
    grnNo: ['GRN No', 'GRNNo', 'GrnNo', 'grnNo'],
    grnDate: ['GRN Date', 'GRNDate', 'GrnDate', 'grnDate'],
};

const DRILL_LEVELS = [
    { key: 'project', title: 'ProjectWise', firstCol: 'Project name', field: FIELD.project, empty: '(No Project)', next: 'subproject' },
    { key: 'subproject', title: 'SubProjectWise', firstCol: 'Sub project', field: FIELD.subProject, empty: '(No Sub Project)', next: 'detail' },
    { key: 'detail', title: 'PO / GRN Detail', firstCol: 'PO / GRN', field: null, empty: '', next: null, isDetail: true },
];

const PO_QTY_KEYS = ['Total Qty', 'TotalQty', 'totalQty'];
const PO_VAL_KEYS = [
    ['Taxable amt', 'TaxableAmt', 'taxableAmt'],
    ['GST', 'Gst', 'gst'],
    ['Freight Amt With Gst', 'FreightAmtWithGst', 'freightAmtWithGst'],
    ['Total po amount', 'TotalPoAmount', 'totalPoAmount'],
];
const GRN_QTY_KEYS = [
    ['Total Bill QTY', 'TotalBillQTY', 'totalBillQTY'],
    ['Total Accept Qty', 'TotalAcceptQty', 'totalAcceptQty'],
];
const GRN_VAL_KEYS = [
    ['GRN taxable amount', 'GRNTaxableAmount', 'grnTaxableAmount'],
    ['Freight amount with GST', 'FreightAmountWithGST', 'freightAmountWithGST'],
    ['GST amount', 'GSTAmount', 'gstAmount'],
    ['Total bill amount', 'TotalBillAmount', 'totalBillAmount'],
    ['Deduction', 'deduction'],
    ['Net GRN Amount', 'NetGRNAmount', 'netGRNAmount'],
    ['Balance Billing Amount', 'BalanceBillingAmount', 'balanceBillingAmount'],
];

const SUMMARY_COLS = [
    { id: 'poQty', label: 'Total Qty', qty: true, keys: PO_QTY_KEYS, section: 'po' },
    { id: 'taxable', label: 'Taxable amt', qty: false, keys: PO_VAL_KEYS[0], section: 'po' },
    { id: 'gst', label: 'GST', qty: false, keys: PO_VAL_KEYS[1], section: 'po' },
    { id: 'freightPo', label: 'Freight Amt With Gst', qty: false, keys: PO_VAL_KEYS[2], section: 'po' },
    { id: 'totalPo', label: 'Total po amount', qty: false, keys: PO_VAL_KEYS[3], section: 'po' },
    { id: 'billQty', label: 'Total Bill QTY', qty: true, keys: GRN_QTY_KEYS[0], section: 'grn' },
    { id: 'acceptQty', label: 'Total Accept Qty', qty: true, keys: GRN_QTY_KEYS[1], section: 'grn' },
    { id: 'grnTax', label: 'GRN taxable amount', qty: false, keys: GRN_VAL_KEYS[0], section: 'grn' },
    { id: 'freightGrn', label: 'Freight amount with GST', qty: false, keys: GRN_VAL_KEYS[1], section: 'grn' },
    { id: 'gstGrn', label: 'GST amount', qty: false, keys: GRN_VAL_KEYS[2], section: 'grn' },
    { id: 'totalBill', label: 'Total bill amount', qty: false, keys: GRN_VAL_KEYS[3], section: 'grn' },
    { id: 'deduction', label: 'Deduction', qty: false, keys: GRN_VAL_KEYS[4], section: 'grn' },
    { id: 'netGrn', label: 'Net GRN Amount', qty: false, keys: GRN_VAL_KEYS[5], section: 'grn' },
    { id: 'balance', label: 'Balance Billing Amount', qty: false, keys: GRN_VAL_KEYS[6], section: 'grn' },
];

const DETAIL_EXTRA_COLS = [
    { id: 'poNo', label: 'PO no', keys: FIELD.poNo, text: true, section: 'po' },
    { id: 'poDate', label: 'Po date', keys: FIELD.poDate, text: true, section: 'po' },
    ...SUMMARY_COLS.slice(0, 5),
    { id: 'grnNo', label: 'GRN No', keys: FIELD.grnNo, text: true, section: 'grn' },
    { id: 'grnDate', label: 'GRN Date', keys: FIELD.grnDate, text: true, section: 'grn' },
    ...SUMMARY_COLS.slice(5),
];

function resetDrillState() {
    return { level: 'project', project: '', subProject: '' };
}

function sectionClass(col) {
    return col && col.section === 'grn' ? 'col-grn' : 'col-po';
}

function getLevel(key) {
    return DRILL_LEVELS.find(function (l) { return l.key === key; }) || DRILL_LEVELS[0];
}

function applyPageHeading() {
    const title = BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp') || 'PO GRN Billing Report';
    if (title && title !== 'undefined') {
        $('#pogrPageTitleText').text(title);
    }
}

$(document).ready(function () {
    applyPageHeading();
    buildTableHeader(getLevel('project'));
    if ($.fn.select2) {
        $('#ddlStatus, #ddlQtyValue').select2({ width: '100%', minimumResultsForSearch: Infinity });
    }
    $('#ddlQtyValue').on('change', function () {
        G_QtyValueMode = $(this).val() || 'both';
        applyQtyValueVisibility();
    });
    $('#btnShow').on('click', ShowPOGRNReport);
    $('#btnDownload').on('click', DownloadPOGRNReport);
    $('#btnClose').on('click', ClearPOGRNReport);
    $('#btnDrillBack').on('click', drillBack);
    $(document).on('click', '#pogrDrillPath .pogr-crumb-link', function () {
        goToLevel($(this).data('level'));
    });
    $(document).on('click', '#pogrTableBody a.pogr-drill-link', function (e) {
        e.preventDefault();
        e.stopPropagation();
        drillInto($(this).closest('tr').data('key'));
    });
    $(document).on('click', '#pogrTableBody tr.pmr-tree-parent', function (e) {
        if ($(e.target).closest('a').length) return;
        drillInto($(this).data('key'));
    });
});

function asArray(response) {
    if (response == null) return [];
    if (Array.isArray(response)) return response;
    const keys = ['data', 'Data', 'result', 'Result', 'items', 'Items', 'rows', 'Rows'];
    for (let i = 0; i < keys.length; i++) {
        const v = response[keys[i]];
        if (Array.isArray(v)) return v;
    }
    return [];
}

function rowVal(row, keys) {
    if (!row || typeof row !== 'object') return '';
    const list = Array.isArray(keys) ? keys : [keys];
    for (let i = 0; i < list.length; i++) {
        const k = list[i];
        if (Object.prototype.hasOwnProperty.call(row, k)) {
            const v = row[k];
            if (v != null && v !== '') return v;
        }
    }
    return '';
}

function parseNum(v) {
    if (v == null || v === '') return 0;
    const n = parseFloat(String(v).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
}

function formatNum(v, decimals) {
    const n = parseNum(v);
    return n.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

function formatCellValue(row, col, isQty) {
    if (col.text) {
        const raw = rowVal(row, col.keys);
        return raw === '' ? '' : escapeHtml(String(raw));
    }
    const raw = rowVal(row, col.keys);
    if (raw === '' || raw == null) return '';
    return formatNum(raw, isQty ? 3 : 2);
}

function escapeHtml(text) {
    return $('<div/>').text(text == null ? '' : String(text)).html();
}

function dimValue(row, fieldKeys, emptyLabel) {
    const v = String(rowVal(row, fieldKeys) || '').trim();
    return v || emptyLabel;
}

function aggregateMetrics(rows) {
    const out = {};
    SUMMARY_COLS.forEach(function (col) {
        out[col.id] = 0;
    });

    const poSeen = {};
    rows.forEach(function (row) {
        GRN_QTY_KEYS.concat(GRN_VAL_KEYS).forEach(function (keys, idx) {
            const col = SUMMARY_COLS[5 + idx];
            out[col.id] += parseNum(rowVal(row, keys));
        });

        const poKey = String(rowVal(row, FIELD.poNo) || '').trim();
        if (poKey && poSeen[poKey]) return;
        if (poKey) poSeen[poKey] = true;

        out.poQty += parseNum(rowVal(row, PO_QTY_KEYS));
        PO_VAL_KEYS.forEach(function (keys, i) {
            out[SUMMARY_COLS[i + 1].id] += parseNum(rowVal(row, keys));
        });
    });

    return out;
}

function headerLabelHtml(label) {
    return escapeHtml(label || '');
}

function isDetailLevel(levelCfg) {
    return !!(levelCfg && levelCfg.isDetail);
}

function visibleSummaryCols(levelCfg) {
    const cfg = levelCfg || getLevel(G_Drill.level);
    if (isDetailLevel(cfg)) return SUMMARY_COLS.slice();
    return SUMMARY_COLS.filter(function (col) { return !col.qty; });
}

function buildTableHeader(levelCfg) {
    const $head = $('#pogrTableHead');
    $head.empty();
    if (isDetailLevel(levelCfg)) {
        const $c = $('<tr/>');
        $c.append('<th class="pmr-th-dim">PO /<br>GRN</th>');
        DETAIL_EXTRA_COLS.forEach(function (col) {
            let cls = sectionClass(col);
            if (col.text) cls += ' pmr-th-dim';
            else if (col.qty) cls += ' col-qty num';
            else cls += ' col-val num';
            $c.append(`<th class="${cls}">${headerLabelHtml(col.label)}</th>`);
        });
        $head.append($c);
        return;
    }
    const cols = visibleSummaryCols(levelCfg);
    const poCount = cols.filter(function (c) { return c.section === 'po'; }).length;
    const grnCount = cols.filter(function (c) { return c.section === 'grn'; }).length;
    const first = (levelCfg && levelCfg.firstCol) || 'Project name';
    const $g = $('<tr/>');
    $g.append('<th rowspan="2" class="pmr-th-dim">' + headerLabelHtml(first) + '</th>');
    $g.append('<th colspan="' + poCount + '" class="col-po-group">PO</th>');
    $g.append('<th colspan="' + grnCount + '" class="col-grn-group">GRN / Billing</th>');
    const $c = $('<tr/>');
    cols.forEach(function (col) {
        const cls = (col.qty ? 'col-qty num ' : 'col-val num ') + sectionClass(col);
        $c.append(`<th class="${cls}">${headerLabelHtml(col.label)}</th>`);
    });
    $head.append($g).append($c);
}

function applyQtyValueVisibility() {
    const detail = isDetailLevel(getLevel(G_Drill.level));
    $('#pogrQtyValueField').toggle(detail);
    if (!detail) {
        $('#tblPOGRNBilling .col-qty').addClass('hidden-col');
        $('#tblPOGRNBilling .col-val').removeClass('hidden-col');
        return;
    }
    const mode = G_QtyValueMode || 'both';
    $('#tblPOGRNBilling .col-qty').toggleClass('hidden-col', mode === 'value');
    $('#tblPOGRNBilling .col-val').toggleClass('hidden-col', mode === 'qty');
}

function metricCellsFromAgg(agg, levelCfg) {
    let html = '';
    visibleSummaryCols(levelCfg).forEach(function (col) {
        const cls = (col.qty ? 'col-qty ' : 'col-val ') + 'num ' + sectionClass(col);
        const val = agg[col.id];
        const text = val === '' || val == null ? '' : formatNum(val, col.qty ? 3 : 2);
        html += `<td class="${cls}">${text}</td>`;
    });
    return html;
}

function groupBy(rows, keyFn) {
    const map = new Map();
    rows.forEach(function (r) {
        const k = keyFn(r);
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(r);
    });
    return map;
}

function filterRowsForDrill() {
    return G_POGRNRawRows.filter(function (r) {
        if (G_Drill.project && dimValue(r, FIELD.project, '(No Project)') !== G_Drill.project) return false;
        if (G_Drill.subProject && dimValue(r, FIELD.subProject, '(No Sub Project)') !== G_Drill.subProject) return false;
        return true;
    });
}

function renderBreadcrumb() {
    const current = getLevel(G_Drill.level);
    const currentIdx = DRILL_LEVELS.findIndex(function (l) { return l.key === G_Drill.level; });
    if (currentIdx <= 0) {
        $('#pogrDrillBreadcrumb').hide();
        return;
    }

    $('#pogrDrillTitle').text(current.title);

    const chips = [];
    if (G_Drill.project) {
        chips.push('<span class="pogr-chip"><span class="lbl">Project</span><span class="val">' + escapeHtml(G_Drill.project) + '</span></span>');
    }
    if (G_Drill.subProject) {
        chips.push('<span class="pogr-chip"><span class="lbl">Sub project</span><span class="val">' + escapeHtml(G_Drill.subProject) + '</span></span>');
    }
    $('#pogrSelectedChips').html(chips.join('')).toggle(chips.length > 0);

    const parts = [];
    for (let i = 0; i <= currentIdx; i++) {
        const lvl = DRILL_LEVELS[i];
        if (i < currentIdx) {
            parts.push('<button type="button" class="pogr-crumb-link" data-level="' + lvl.key + '">' + escapeHtml(lvl.title) + '</button>');
        } else {
            parts.push('<span class="pogr-crumb-current">' + escapeHtml(lvl.title) + '</span>');
        }
    }
    $('#pogrDrillPath').html(parts.join('<span class="pogr-crumb-sep">→</span>'));
    $('#pogrDrillBreadcrumb').show();
}

function renderCurrentLevel() {
    const levelCfg = getLevel(G_Drill.level);
    const rows = filterRowsForDrill();
    const $body = $('#pogrTableBody');
    $body.empty();
    buildTableHeader(levelCfg);
    renderBreadcrumb();

    if (!rows.length) {
        toastr.error('No Data Found');
        applyQtyValueVisibility();
        return;
    }

    if (levelCfg.isDetail) {
        rows.forEach(function (row) {
            const po = String(rowVal(row, FIELD.poNo) || '').trim();
            const grn = String(rowVal(row, FIELD.grnNo) || '').trim();
            let label = po || '—';
            if (grn) label += ' / ' + grn;
            let cells = '<td class="label-cell">' + escapeHtml(label) + '</td>';
            DETAIL_EXTRA_COLS.forEach(function (col) {
                let cls = sectionClass(col);
                if (col.qty) cls += ' col-qty num';
                else if (!col.text) cls += ' col-val num';
                else cls += ' num';
                cells += `<td class="${cls}">${formatCellValue(row, col, !!col.qty)}</td>`;
            });
            $body.append('<tr class="pogr-level-detail">' + cells + '</tr>');
        });
        const total = aggregateMetrics(rows);
        let totalCells = '<td class="label-cell"><strong>Total</strong></td>';
        DETAIL_EXTRA_COLS.forEach(function (col) {
            if (col.text) {
                totalCells += `<td class="${sectionClass(col)}"></td>`;
            } else {
                totalCells += `<td class="num ${sectionClass(col)}">${formatNum(total[col.id], col.qty ? 3 : 2)}</td>`;
            }
        });
        $body.append('<tr class="pogr-row-total">' + totalCells + '</tr>');
        applyQtyValueVisibility();
        return;
    }

    const byKey = groupBy(rows, function (r) {
        return dimValue(r, levelCfg.field, levelCfg.empty);
    });
    const labels = Array.from(byKey.keys()).sort(function (a, b) {
        return a.localeCompare(b, undefined, { sensitivity: 'base' });
    });

    labels.forEach(function (label) {
        const groupRows = byKey.get(label);
        const agg = aggregateMetrics(groupRows);
        const canDrill = !!levelCfg.next;
        const link = canDrill
            ? '<a href="#" class="pogr-drill-link">' + escapeHtml(label) + '</a>'
            : '<span class="pmr-particulars-text">' + escapeHtml(label) + '</span>';
        const $tr = $('<tr class="pogr-level-' + levelCfg.key + (canDrill ? ' pmr-tree-parent' : '') + '" data-level="' + levelCfg.key + '" data-key="' + escapeHtml(label) + '"/>');
        $tr.append('<td class="label-cell">' + link + '</td>' + metricCellsFromAgg(agg, levelCfg));
        $body.append($tr);
    });

    const grand = aggregateMetrics(rows);
    const $tot = $('<tr class="pogr-row-total"/>');
    $tot.append('<td class="label-cell"><strong>Total</strong></td>' + metricCellsFromAgg(grand, levelCfg));
    $body.append($tot);
    applyQtyValueVisibility();
}

function drillInto(key) {
    const label = String(key || '').trim();
    if (!label) return;
    const current = getLevel(G_Drill.level);
    if (!current.next) return;

    if (current.key === 'project') G_Drill.project = label;
    else if (current.key === 'subproject') G_Drill.subProject = label;

    G_Drill.level = current.next;
    renderCurrentLevel();
}

function goToLevel(levelKey) {
    const idx = DRILL_LEVELS.findIndex(function (l) { return l.key === levelKey; });
    if (idx < 0) return;
    G_Drill.level = levelKey;
    if (idx < 1) G_Drill.project = '';
    if (idx < 2) G_Drill.subProject = '';
    renderCurrentLevel();
}

function drillBack() {
    const idx = DRILL_LEVELS.findIndex(function (l) { return l.key === G_Drill.level; });
    if (idx <= 0) return;
    goToLevel(DRILL_LEVELS[idx - 1].key);
}

function ShowPOGRNReport() {
    const status = ($('#ddlStatus').val() || '').trim();
    if (!status) {
        toastr.error('Please select status');
        $('#ddlStatus').focus();
        return;
    }

    Showloader();
    POGRNBillingReportService.GetPOGRNBillingReport(status)
        .then(function (response) {
            HideLoader();
            const rows = asArray(response);
            if (!rows.length) {
                G_POGRNRawRows = [];
                G_Drill = resetDrillState();
                $('#pogrTableBody').empty();
                $('#pogrDrillBreadcrumb').hide();
                toastr.error('No Data Found');
                return;
            }
            const err = rows[0].Error || rows[0].error || rows[0].Msg || rows[0].msg;
            if (err) {
                toastr.error(String(err));
                return;
            }
            G_POGRNRawRows = rows;
            G_Drill = resetDrillState();
            renderCurrentLevel();
        })
        .catch(function (error) {
            HideLoader();
            G_POGRNRawRows = [];
            G_Drill = resetDrillState();
            $('#pogrTableBody').empty();
            $('#pogrDrillBreadcrumb').hide();
            toastr.error((error && error.Msg) || 'Error loading report');
        });
}

function ClearPOGRNReport() {
    G_POGRNRawRows = [];
    G_Drill = resetDrillState();
    $('#pogrTableBody').empty();
    $('#pogrDrillBreadcrumb').hide();
    buildTableHeader(getLevel('project'));
}

function DownloadPOGRNReport() {
    if (!G_POGRNRawRows.length) {
        toastr.warning('Load the report first.');
        return;
    }
    const exportRows = filterRowsForDrill().map(function (row) {
        const o = {};
        o.ProjectDesp = rowVal(row, FIELD.project);
        o.SubProjectDesp = rowVal(row, FIELD.subProject);
        DETAIL_EXTRA_COLS.forEach(function (col) {
            o[col.label] = col.text ? rowVal(row, col.keys) : parseNum(rowVal(row, col.keys));
        });
        return o;
    });
    ExportToExcelControl.ExportToExcel(exportRows, [], 'POGRNBillingReport');
}

window.ShowPOGRNReport = ShowPOGRNReport;
window.DownloadPOGRNReport = DownloadPOGRNReport;
window.ClearPOGRNReport = ClearPOGRNReport;
