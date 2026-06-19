import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { ProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProjectMasterService.js';
import { SubProjectMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/SubProjectMasterService.js';
import { BOMService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BOMService.js';

let G_ProjectList         = [];
let G_SubProjectList      = [];
let G_CategoryList        = [];
let G_WorkTypeList        = [];
let G_ItemCacheByWorkType = {};
let G_BOMRows             = [];
let G_BOMList             = [];
let G_BOMHeader           = {};
/** Last Copy From source — shown in modal until Save All. */
let G_CopyFromSource        = { active: false, projectCode: 0, subProjectCode: 0, projectName: '', subProjectDesp: '' };

const BOM_MAX_RATE    = 999999.99;
const BOM_MAX_QTY     = 99999.99;
const BOM_MAX_AMOUNT  = 99999999.99;
const BOM_MAX_GST_PCT = 100;

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    loadBOMList();
    loadProjectsAndSubProjects();
    loadCategoryAndWorkTypeMaster();

    $('#btnCreateBOM').on('click', function () { openNewBOM(); });
    $('#btnCopyFromBom').on('click', function () { openCopyFromModal(); });
    $('#btnCopyFromFill').on('click', function () { fillBomFromCopy(); });
    $('#btnAddBomRow').on('click', function () { addNewBomRow(); });
    $('#btnSaveAllBomRows').on('click', function () { saveAllRows(); });
    $('#btnVerifyAllBomRows').on('click', function () { verifyAllRows(); });
    $('#btnBackToBomList').on('click', function () { showBOMListView(); });
    $('#btnConfirmDeleteBOM').on('click', function () { confirmDeleteBOM(); });

    $('#tblBOMList').on('click', '.js-bom-view', function () {
        const $tr = $(this).closest('tr');
        viewBOM($tr.data('id'), $tr.data('sub-id') || 0);
    });
    $('#tblBOMList').on('click', '.js-bom-edit', function () {
        const $tr = $(this).closest('tr');
        openBOMFromList($tr.data('id'), 'edit', $tr.data('sub-id') || 0);
    });
    $('#tblBOMList').on('click', '.js-bom-delete', function () {
        const $tr = $(this).closest('tr');
        deleteBOMFromList($tr.data('id'), $tr.data('sub-id') || 0);
    });
    $('#tblBOMList').on('click', '.js-bom-history', function () {
        const $tr = $(this).closest('tr');
        openBomAmendmentHistoryModal($tr.data('id'), $tr.data('sub-id') || 0);
    });

    $('#bomSearch').on('input', function () {
        filterBOMs($(this).val().toLowerCase().trim());
    });

    $('#dvBOMViewModal, #dvBOMCopyFromModal, #dvBomAmendmentHistoryModal, #dvBOMDeleteConfirmModal')
        .on('shown.bs.modal', function () {
            document.documentElement.classList.add('bom-modal-open');
            document.body.classList.add('bom-modal-open');
        })
        .on('hidden.bs.modal', function () {
            const anyOpen = $('#dvBOMViewModal, #dvBOMCopyFromModal, #dvBomAmendmentHistoryModal, #dvBOMDeleteConfirmModal')
                .toArray()
                .some(function (el) { return el.classList.contains('show'); });
            if (!anyOpen) {
                document.documentElement.classList.remove('bom-modal-open');
                document.body.classList.remove('bom-modal-open');
            }
        });
});
function loadBOMList() {
    if (!BOMService || typeof BOMService.GetBOMList !== 'function') return;

    Showloader && Showloader();
    BOMService.GetBOMList()
        .then(function (response) {
            HideLoader && HideLoader();
            let rows = [];
            if (Array.isArray(response))             rows = response;
            else if (Array.isArray(response.data))  rows = response.data;
            else if (Array.isArray(response.Data))  rows = response.Data;
            G_BOMList = rows || [];
            bindBOMGrid(G_BOMList);
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            G_BOMList = [];
            bindBOMGrid([]);
            toastr.error((error && error.Msg));
        });
}

/** Indian-style comma formatting (same style as Project Master budget). */
function formatInrAmountNum(n, minDec, maxDec) {
    const mn = minDec != null ? minDec : 2;
    const mx = maxDec != null ? maxDec : 2;
    if (n == null || isNaN(n)) return '—';
    return '₹ ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: mn, maximumFractionDigits: mx });
}

function formatInrQtyNum(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

/** Base amount (qty × rate, before GST) for list / view — matches BOM summary "Amount" column. */
function getBomListBaseAmount(item) {
    if (!item) return 0;
    const amountKeys = ['Amount', 'amount', 'BaseAmount', 'SumAmount', 'TotalBaseAmount'];
    for (let i = 0; i < amountKeys.length; i++) {
        const v = item[amountKeys[i]];
        if (v != null && v !== '') {
            const n = parseFloat(v);
            if (!isNaN(n)) return n;
        }
    }
    const total = parseFloat(item.TotalAmount || 0) || 0;
    const gst = parseFloat(item.GSTAmount ?? item.GstAmount ?? item.TotalGSTAmount ?? item.GSTAmt ?? 0) || 0;
    if (total && gst) return Math.max(0, total - gst);
    return 0;
}

/** Indian numbering: amount in words after ₹ for BOM summary footer (no "Rupees" / "Only"). */
const _INR_ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const _INR_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function _inrWordsBelowHundred(n) {
    n = Math.floor(Math.abs(n));
    if (n < 20) return _INR_ONES[n] || '';
    const t = Math.floor(n / 10);
    const o = n % 10;
    return _INR_TENS[t] + (o ? ' ' + _INR_ONES[o] : '');
}

function _inrWordsBelowThousand(n) {
    n = Math.floor(Math.abs(n));
    if (n === 0) return '';
    if (n < 100) return _inrWordsBelowHundred(n);
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return _INR_ONES[h] + ' Hundred' + (rest ? ' ' + _inrWordsBelowHundred(rest) : '');
}

function numToWordsIndian(n) {
    n = Math.floor(Math.abs(Number(n)));
    if (n === 0) return 'Zero';
    if (n >= 10000000) {
        const crore = Math.floor(n / 10000000);
        const rest = n % 10000000;
        const cw = crore < 1000 ? _inrWordsBelowThousand(crore) : numToWordsIndian(crore);
        if (!rest) return cw + ' Crore';
        const rw = numToWordsIndian(rest);
        return cw + ' Crore ' + (rw === 'Zero' ? '' : rw);
    }
    let rem = n;
    const lakh = Math.floor(rem / 100000);
    rem %= 100000;
    const thousand = Math.floor(rem / 1000);
    rem %= 1000;
    const parts = [];
    if (lakh) parts.push(_inrWordsBelowThousand(lakh) + ' Lakh');
    if (thousand) parts.push(_inrWordsBelowThousand(thousand) + ' Thousand');
    if (rem) parts.push(_inrWordsBelowThousand(rem));
    return parts.length ? parts.join(' ') : 'Zero';
}

function inrAmountWordsRupeeSymbol(amount) {
    if (amount == null || isNaN(amount)) return '';
    const rounded = Math.round(Number(amount) * 100) / 100;
    const rupees = Math.floor(rounded);
    const paise = Math.round((rounded - rupees) * 100);
    let w = numToWordsIndian(rupees);
    if (rupees === 0 && paise === 0) w = 'Zero';
    let s = '₹ ' + w;
    if (paise > 0) {
        s += ' and ' + numToWordsIndian(paise) + ' Paise';
    }
    return s;
}

/* Same comma rules as Project Master budget field (formatBudgetRaw). */
function formatBomMoneyRaw(value) {
    if (value === null || value === undefined) return '';
    let raw = value.toString();
    const endsWithDot = raw.trim().endsWith('.');
    raw = raw.replace(/,/g, '').replace(/[^0-9.]/g, '');
    if (!raw) return '';

    const parts = raw.split('.');
    let intPart = (parts[0] || '').replace(/^0+(?=\d)/, '') || '0';
    let decPart = (parts[1] || '').substring(0, 3);
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (endsWithDot && !decPart) return intPart + '.';
    return decPart ? intPart + '.' + decPart : intPart;
}

function formatBomMoneyInput(input) {
    if (!input) return;
    input.value = formatBomMoneyRaw(input.value);
}

/** Parse display value (with commas) to number for save / math. */
function parseBomMoney(val) {
    if (val == null || val === '') return 0;
    const v = val.toString().replace(/,/g, '').trim();
    if (v === '' || v === '.') return 0;
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
}

function bindBOMGrid(list) {
    const $tbody = $('#tblBOMList tbody');
    if (!$tbody.length) return;
    $tbody.empty();

    if (!list || list.length === 0) {
        $tbody.append(`
            <tr>
                <td colspan="7">
                    <div class="pm-empty">
                        <div class="pm-empty-icon"><i class="fas fa-folder-open"></i></div>
                        <div class="pm-empty-title">No BOM records found</div>
                        <div class="pm-empty-sub">Click &quot;New BOM&quot; to create your first BOM.</div>
                    </div>
                </td>
            </tr>`);
        $('#bomListGrandAmount').text('—');
        $('#bomListGrandTotal').text('—');
        return;
    }

    let grandAmount = 0;
    let grandTotal = 0;

    list.forEach(function (item, index) {
        const projectName    = item.ProjectName || item.ProjectDesp || '';
        const subProjectName = item.SubProjectName || item.SubProjectDesp || '';
        const totalItems     = item.TotalItems  || 0;
        const baseAmount     = getBomListBaseAmount(item);
        const totalAmount    = parseFloat(item.TotalAmount || 0);
        grandAmount += baseAmount;
        grandTotal += totalAmount;

        const bomId    = item.ProjectMaster_Code || item.Code || 0;
        const subBomId = item.SubProjectMaster_Code || 0;

        $tbody.append(`
            <tr data-index="${index}" data-id="${bomId}" data-sub-id="${subBomId}">
                <td class="center"><span class="pm-sno">${index + 1}</span></td>
                <td style="max-width:260px; overflow:hidden; text-overflow:ellipsis;">${escHtml(projectName)}</td>
                <td style="max-width:260px; overflow:hidden; text-overflow:ellipsis;">${escHtml(subProjectName)}</td>
                <td class="center">${totalItems}</td>
                <td class="right pm-budget">${formatInrAmountNum(baseAmount, 2, 2)}</td>
                <td class="right pm-budget">${formatInrAmountNum(totalAmount, 2, 2)}</td>
                <td class="center">
                    <div class="bom-actions">
                        <button type="button" class="bom-btn icon view js-bom-view" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="bom-btn icon edit js-bom-edit" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="bom-btn icon history js-bom-history" title="Amendment history">
                            <i class="fas fa-history"></i>
                        </button>
                        <button type="button" class="bom-btn icon del js-bom-delete" title="Delete">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>`);
    });

    $('#bomListGrandAmount').text(formatInrAmountNum(grandAmount, 2, 2));
    $('#bomListGrandTotal').text(formatInrAmountNum(grandTotal, 2, 2));
}
function filterBOMs(query) {
    if (!query) { bindBOMGrid(G_BOMList); return; }
    const filtered = (G_BOMList || []).filter(function (item) {
        return (item.ProjectName || item.ProjectDesp || '').toLowerCase().includes(query);
    });
    bindBOMGrid(filtered);
}

function normalizeAmendmentHistoryResponse(resp) {
    if (Array.isArray(resp)) return resp;
    if (resp && Array.isArray(resp.data)) return resp.data;
    if (resp && Array.isArray(resp.Data)) return resp.Data;
    return [];
}

/** Map API / serializer variants to stable column names used by USP_GetCommonAmendmentDetails. */
function amendmentCanonicalColumnName(key) {
    if (key == null) return key;
    const t = String(key).trim();
    const compact = t.replace(/\s+/g, '').toLowerCase();
    const aliases = {
        trancode: 'TranCode',
        type: 'Type',
        amendmentno: 'Amendment No',
        amendmentdate: 'Amendment Date',
        amendmenttime: 'Amendment Time',
        amendmentby: 'Amendment By'
    };
    return aliases[compact] || t;
}

function formatAmendmentHistoryDate(val) {
    if (val == null || val === '') return '';
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        return String(val);
    }
}

function orderAmendmentHistoryColumns(allKeys) {
    const priority = ['Type', 'Amendment No', 'Amendment Date', 'Amendment Time', 'Amendment By'];
    const head = priority.filter(function (k) { return allKeys.indexOf(k) >= 0; });
    const rest = allKeys.filter(function (k) { return priority.indexOf(k) < 0; }).sort(function (a, b) {
        return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
    });
    return head.concat(rest);
}

/** Build rows with same keys (pivot columns may differ per amendment), format dates, show nulls as — for numeric pivots. */
function prepareAmendmentHistoryGridRows(rawRows) {
    const list = Array.isArray(rawRows) ? rawRows : [];
    const canonicalRows = list.map(function (row) {
        const o = {};
        Object.keys(row).forEach(function (k) {
            o[amendmentCanonicalColumnName(k)] = row[k];
        });
        return o;
    });

    const keySet = new Set();
    canonicalRows.forEach(function (r) {
        Object.keys(r).forEach(function (k) { keySet.add(k); });
    });
    const orderedKeys = orderAmendmentHistoryColumns(Array.from(keySet));

    const numericPivotNames = ['Amount', 'Qty Required', 'Rate', 'Tolerance', 'Rate Tolerance', 'GST Amount', 'Total Amount', 'GST %'];

    function formatAmendmentPivotNumber(columnName, raw) {
        if (raw === '' || raw === null || raw === undefined) return raw;
        const n = parseFloat(String(raw).replace(/,/g, '').trim());
        if (isNaN(n)) return raw;
        /* Large floats from SQL/JSON often stringify as 4e+007 — normalize to INR / qty display */
        if (columnName === 'Amount' || columnName === 'Rate' || columnName === 'GST Amount' || columnName === 'Total Amount') {
            return formatInrAmountNum(n, 2, 2);
        }
        if (columnName === 'Qty Required' || columnName === 'Tolerance' || columnName === 'Rate Tolerance') {
            return formatInrQtyNum(n);
        }
        if (columnName === 'GST %') {
            return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return raw;
    }

    return canonicalRows.map(function (r) {
        const out = {};
        orderedKeys.forEach(function (k) {
            let v = r.hasOwnProperty(k) ? r[k] : '';
            if (k === 'Amendment Date' && v !== '' && v != null) {
                out[k] = formatAmendmentHistoryDate(v);
                return;
            }
            if (v === null || v === undefined) {
                v = '';
            }
            if (v === '' && numericPivotNames.indexOf(k) >= 0) {
                out[k] = '—';
            } else if (numericPivotNames.indexOf(k) >= 0 && v !== '') {
                out[k] = formatAmendmentPivotNumber(k, v);
            } else {
                out[k] = v;
            }
        });
        return out;
    });
}

function sortAmendmentHistoryRows(rows) {
    return rows.slice().sort(function (a, b) {
        const noA = parseInt(a['Amendment No'], 10) || 0;
        const noB = parseInt(b['Amendment No'], 10) || 0;
        if (noA !== noB) return noB - noA;
        const tcA = parseInt(a.TranCode, 10) || 0;
        const tcB = parseInt(b.TranCode, 10) || 0;
        if (tcA !== tcB) return tcA - tcB;
        const timeA = String(a['Amendment Time'] || '');
        const timeB = String(b['Amendment Time'] || '');
        if (timeA !== timeB) return timeB.localeCompare(timeA);
        const rank = { OldValue: 0, NewValue: 1 };
        const ra = rank.hasOwnProperty(a.Type) ? rank[a.Type] : 9;
        const rb = rank.hasOwnProperty(b.Type) ? rank[b.Type] : 9;
        return ra - rb;
    });
}

/**
 * Opens modal and binds amendment grid (BizsolCustomFilterGrid — same pattern as Buying Capacity).
 */
function openBomAmendmentHistoryModal(projectMasterCode, subProjectMasterCode) {
    const code = parseInt(projectMasterCode || '0', 10) || 0;
    const sub  = parseInt(subProjectMasterCode || '0', 10) || 0;
    if (!code) {
        toastr.warning('Invalid project for this BOM row.');
        return;
    }

    const Grid = window.BizsolCustomFilterGrid;
    if (!Grid || typeof Grid.CreateDataTable !== 'function') {
        toastr.error('Grid component not loaded. Ensure filter.js is included on the page.');
        return;
    }

    const row = (G_BOMList || []).find(function (x) {
        return String(x.ProjectMaster_Code || x.Code || 0) === String(code)
            && String(x.SubProjectMaster_Code || 0) === String(sub);
    });
    const proj = row ? (row.ProjectName || row.ProjectDesp || '') : '';
    const subn = row ? (row.SubProjectName || row.SubProjectDesp || '') : '';
    $('#bomAmendmentHistorySubtitle').text((proj || '—') + (subn ? ' · ' + subn : ''));

    $('#table-header-BomAmendmentHistory').empty();
    $('#table-body-BomAmendmentHistory').empty();
    $('#paginator-tblBomAmendmentHistory').empty();

    showModal('dvBomAmendmentHistoryModal');

    Showloader && Showloader();
    BOMService.GetBOMAmendmentDetails(sub)
        .then(function (response) {
            HideLoader && HideLoader();
            const raw = normalizeAmendmentHistoryResponse(response);
            if (!raw.length) {
                $('#table-body-BomAmendmentHistory').html(
                    '<tr><td colspan="99" style="text-align:center;padding:24px;color:var(--text-muted);">No amendment history found.</td></tr>'
                );
                return;
            }

            let rows = prepareAmendmentHistoryGridRows(raw);
            rows = sortAmendmentHistoryRows(rows);

            const keys = Object.keys(rows[0]);
            /* Must not appear in String/Numeric/Date filter lists, or Filter.js renders a visible header for them. */
            const AMENDMENT_HIDDEN_COLUMNS = ['TranCode'];
            const hiddenColumns = AMENDMENT_HIDDEN_COLUMNS.filter(function (k) {
                return keys.indexOf(k) >= 0;
            });
            const DateFilterColumn = keys.indexOf('Amendment Date') >= 0 ? ['Amendment Date'] : [];
            const numericCandidates = ['Amendment No'];
            const pivotNumeric = keys.filter(function (k) {
                return ['Amount', 'Rate', 'Qty Required', 'Tolerance', 'Rate Tolerance', 'GST Amount', 'Total Amount', 'GST %'].indexOf(k) >= 0;
            });
            const NumericFilterColumn = numericCandidates.concat(pivotNumeric).filter(function (k) {
                return keys.indexOf(k) >= 0 && hiddenColumns.indexOf(k) < 0;
            });
            const StringFilterColumn = keys.filter(function (k) {
                return hiddenColumns.indexOf(k) < 0
                    && DateFilterColumn.indexOf(k) < 0
                    && NumericFilterColumn.indexOf(k) < 0;
            });
            const StringdoubleFilterColumn = [];
            const ColumnAlignment = {};
            keys.forEach(function (k) {
                if (NumericFilterColumn.indexOf(k) >= 0) {
                    ColumnAlignment[k] = 'right';
                } else if (k === 'Type') {
                    ColumnAlignment[k] = 'center';
                }
            });

            Grid.CreateDataTable(
                'table-header-BomAmendmentHistory',
                'table-body-BomAmendmentHistory',
                rows,
                false,
                [],
                StringFilterColumn,
                NumericFilterColumn,
                DateFilterColumn,
                StringdoubleFilterColumn,
                hiddenColumns,
                ColumnAlignment,
                true
            );
        })
        .catch(function (err) {
            HideLoader && HideLoader();
            toastr.error((err && err.Msg) || 'Could not load amendment history.');
        });
}

function viewBOM(id, subId) {
    if (!G_BOMList || !G_BOMList.length) return;
    const row = G_BOMList.find(function (x) {
        const matchProject = String(x.ProjectMaster_Code || x.Code || 0) === String(id || 0);
        const matchSub    = String(x.SubProjectMaster_Code || 0) === String(subId || 0);
        return matchProject && matchSub;
    });
    if (!row) return;

    $('#viewBOMProjectName').text(row.ProjectName || row.ProjectDesp || '—');
    $('#viewBOMSubProjectName').text(row.SubProjectName || row.SubProjectDesp || '—');
    $('#viewBOMTotalItems').text(row.TotalItems || 0);
    $('#viewBOMTotalQty').text(row.TotalQty != null ? formatInrQtyNum(parseFloat(row.TotalQty)) : '—');
    $('#viewBOMAmount').text(formatInrAmountNum(getBomListBaseAmount(row), 2, 2));
    $('#viewBOMTotalAmount').text(formatInrAmountNum(parseFloat(row.TotalAmount || 0), 2, 2));

    showModal('dvBOMViewModal');
}
function showBOMListView() {
    $('#dvBOMEntry').hide();
    $('#dvBOMGrid').show();
    loadBOMList();
}
function openNewBOM() {
    $('#dvBOMGrid').hide();
    $('#dvBOMEntry').show();
    resetBomForm();
    Showloader && Showloader();

    const projectPromise = (!G_ProjectList.length || !G_SubProjectList.length)
        ? loadProjectsAndSubProjects()
        : Promise.resolve();

    const masterPromise = (!G_CategoryList.length || !G_WorkTypeList.length)
        ? loadCategoryAndWorkTypeMaster()
        : Promise.resolve();

    Promise.all([projectPromise, masterPromise])
        .then(function ()  { HideLoader && HideLoader(); addNewBomRow(); })
        .catch(function () { HideLoader && HideLoader(); addNewBomRow(); });
}
/** GETBYCODE / COPYFROM response may be a bare array or wrapped in Data/data. */
function normalizeBOMDetailResponse(response) {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.Data)) return response.Data;
    if (response && Array.isArray(response.data)) return response.data;
    return [];
}

/** When API returns { Status, Msg, Data }, surface validation errors from SP. */
function getBomApiFailureMessage(response, fallback) {
    if (!response || typeof response !== 'object' || Array.isArray(response)) return '';
    if (response.Status === 'Y') return '';
    return (response.Msg || response.Message || fallback || '').toString().trim();
}

/**
 * Bind main form Project / Sub Project from BOM detail rows (GETBYCODE / COPYFROM).
 */
function bindBomHeaderFromDetailRows(detailRows, options) {
    options = options || {};
    if (!detailRows || !detailRows.length) return;

    const first  = detailRows[0];
    const pCode  = parseInt(options.projectCode || first.ProjectMaster_Code || 0, 10) || 0;
    const spCode = parseInt(options.subProjectCode || first.SubProjectMaster_Code || first.ProjectSubCategory_Code || 0, 10) || 0;
    const spDesp = (options.subProjectDesp || first.SubProjectDesp || first.SubProjectName || '').trim();
    const pName  = (options.projectName || first.ProjectName || first.ProjectDesp || '').trim();

    if (!G_ProjectList.length) {
        bindProjectDropdown();
    } else if ($('#ddlProject option').length <= 1) {
        bindProjectDropdown();
    }

    if (pCode) {
        $('#ddlProject').val(String(pCode));
    }
    if (!$('#ddlProject').val() && pName) {
        const needle = pName.toLowerCase();
        $('#ddlProject option').each(function () {
            if ($(this).text().trim().toLowerCase() === needle) {
                $('#ddlProject').val($(this).val());
                return false;
            }
        });
    }

    bindSubProjectDropdown();

    var spBound = false;
    if (spCode) {
        $('#ddlSubProject').val(String(spCode));
        if ($('#ddlSubProject').val()) spBound = true;
    }
    if (!spBound && spDesp) {
        const needle = spDesp.toLowerCase();
        $('#ddlSubProject option').each(function () {
            if ($(this).text().trim().toLowerCase() === needle) {
                $('#ddlSubProject').val($(this).val());
                spBound = true;
                return false;
            }
        });
    }

    G_BOMHeader = {
        ProjectMaster_Code: parseInt($('#ddlProject').val() || pCode, 10) || pCode,
        SubProjectMaster_Code: parseInt($('#ddlSubProject').val() || spCode, 10) || spCode
    };

    if (options.lockDropdowns) {
        $('#ddlProject, #ddlSubProject').prop('disabled', true);
    } else if (options.enableDropdowns !== false) {
        $('#ddlProject, #ddlSubProject').prop('disabled', false);
    }
}

/**
 * Rebuilds the BOM grid from API detail rows (sets data-detail-code from DB).
 * Used after load and after Save so a second Save sends real detail Codes, not 0.
 */
function applyBomDetailRows(detailRows) {
    $('#tblBOM tbody').empty();

    if (detailRows.length > 0) {
        detailRows.forEach(function (d) {
            addNewBomRow();
            var $tr = $('#tblBOM tbody tr').last();

            $tr.attr('data-detail-code',    d.Code || 0);
            $tr.attr('data-uom-code',        parseInt(d.UOMMaster_Code || 0, 10) || 0);
            $tr.attr('data-item-code',       parseInt(d.ItemMaster_Code || 0, 10) || 0);
            $tr.attr('data-work-type-name',  (d.WorkTypeDesp || '').trim().toUpperCase());

            $tr.find('.bom-project-category').val(String(d.ProjectCategory_Code || ''));

            setWorkTypeSilent($tr, d.WorkTypeMaster_Code || 0, d.WorkTypeDesp || '');

            var $itemDdl = $tr.find('.bom-item');
            $itemDdl.empty().append('<option value="">Select</option>');
            if (d.ItemMaster_Code) {
                var cachedUom = getUomTextFromCache(d.WorkTypeDesp || '', d.ItemMaster_Code);
                var uomText   = d.UOM || cachedUom || '';
                var gstForOpt = d.GSTRate != null ? d.GSTRate : (d.GSTPercent != null ? d.GSTPercent : 0);

                $itemDdl.append(
                    `<option value="${d.ItemMaster_Code}"
                             data-uom="${escHtml(uomText)}"
                             data-uom-code="${parseInt(d.UOMMaster_Code || 0, 10) || 0}"
                             data-item-spec="${escHtml(d.ItemSpecificationDesp || '')}"
                             data-gst-rate="${parseFloat(gstForOpt) || 0}">
                        ${escHtml(d.ItemName || '')}
                     </option>`
                );
                $tr.find('.bom-uom').val(uomText);
            }
            $itemDdl.val(String(d.ItemMaster_Code || 0));

            $tr.find('.bom-item-spec').val(    d.ItemSpecificationDesp != null ? d.ItemSpecificationDesp : '');
            $tr.find('.bom-tolerance').val(   d.Tolerance         != null ? d.Tolerance         : '');
            $tr.find('.bom-qty-required').val( d.QtyRequired      != null ? d.QtyRequired        : '');
            $tr.find('.bom-rate-tol').val(     d.RateTolerance    != null ? d.RateTolerance      : '');
            if (d.Rate != null && d.Rate !== '') {
                $tr.find('.bom-est-rate').val(formatBomMoneyRaw(String(d.Rate)));
            } else {
                $tr.find('.bom-est-rate').val('');
            }
            if (d.Amount != null && d.Amount !== '') {
                $tr.find('.bom-amount').val(formatBomMoneyRaw(Number(d.Amount).toFixed(2)));
            } else {
                $tr.find('.bom-amount').val('');
            }
            const gstRate = d.GSTRate != null ? d.GSTRate : (d.GSTPercent != null ? d.GSTPercent : (d['GST %'] != null ? d['GST %'] : ''));
            if (gstRate !== '' && gstRate != null) {
                $tr.find('.bom-gst-pct').val(formatBomMoneyRaw(Number(gstRate).toFixed(2)));
            } else {
                $tr.find('.bom-gst-pct').val('');
            }
            /* TotalAmount is not stored — always derive GST Amount + Total from Amount & GSTRate */
            recalcGstAndTotal($tr);

            bindItemDropdownForRow($tr, {
                preselectCode: d.ItemMaster_Code || 0,
                preserveGst: true
            });
        });

        prefetchUOMsForRows(detailRows);
        refreshBOMSummary();
    } else {
        addNewBomRow();
        refreshBOMSummary();
    }
}

function openBOMFromList(id, mode, subProjectCode) {
    const projectCode    = parseInt(id             || '0', 10) || 0;
    const subProjCode    = parseInt(subProjectCode || '0', 10) || 0;
    if (!projectCode) return;

    $('#dvBOMGrid').hide();
    $('#dvBOMEntry').show();
    resetBomForm();
    $('#hfBOMCode').val(projectCode);

    if (mode === 'view') {
        $('#btnSaveAllBomRows').prop('disabled', true);
        $('#btnVerifyAllBomRows').prop('disabled', true);
    }

    if (!BOMService || typeof BOMService.GetBOMByCode !== 'function') {
        if (mode === 'view') disableEntryForm();
        return;
    }

    Showloader && Showloader();

    const projectPromise = (!G_ProjectList.length || !G_SubProjectList.length)
        ? loadProjectsAndSubProjects()
        : Promise.resolve();

    const masterPromise = (!G_CategoryList.length || !G_WorkTypeList.length)
        ? loadCategoryAndWorkTypeMaster()
        : Promise.resolve();

    const bomDataPromise = BOMService.GetBOMByCode(projectCode, subProjCode);

    Promise.all([projectPromise, masterPromise, bomDataPromise])
        .then(function (results) {
            HideLoader && HideLoader();

            const response = results[2];
            var detailRows = normalizeBOMDetailResponse(response);

            if (detailRows.length > 0) {
                bindBomHeaderFromDetailRows(detailRows);
            }

            applyBomDetailRows(detailRows);

            if (mode === 'view') {
                disableEntryForm();
            } else {
                $('#ddlProject, #ddlSubProject').prop('disabled', true);
                $('#btnSaveAllBomRows').prop('disabled', false);
                $('#btnVerifyAllBomRows').prop('disabled', false);
            }
        })
        .catch(function () {
            HideLoader && HideLoader();
            toastr.error('Error loading BOM details.');
            if (mode === 'view') disableEntryForm();
            else $('#ddlProject, #ddlSubProject').prop('disabled', true);
        });
}
function disableEntryForm() {
    $('#tblBOM .bom-input, #tblBOM .bom-select').prop('disabled', true).prop('readonly', true);
    $('#ddlProject, #ddlSubProject').prop('disabled', true);
    $('#btnCopyFromBom, #btnAddBomRow, #btnSaveAllBomRows').prop('disabled', true);
}
function enableEntryFormHeader() {
    $('#ddlProject, #ddlSubProject').prop('disabled', false);
}
function deleteBOMFromList(id, subId) {
    if (!G_BOMList || !G_BOMList.length) return;
    const sub = subId != null ? subId : 0;
    const row = G_BOMList.find(function (x) {
        const sameProj = String(x.ProjectMaster_Code || x.Code || 0) === String(id || 0);
        const sameSub  = String(x.SubProjectMaster_Code || 0) === String(sub || 0);
        return sameProj && sameSub;
    });
    if (!row) return;

    const subName = row.SubProjectName || row.SubProjectDesp || '';
    const projName = row.ProjectName || row.ProjectDesp || 'this BOM';
    $('#delBOMName').text(subName ? (projName + ' / ' + subName) : projName);
    $('#hfDeleteBOMId').val(id || 0);
    $('#hfDeleteBOMSubId').val(row.SubProjectMaster_Code || 0);
    $('#bomReasonForDeleteInput').val('');
    showModal('dvBOMDeleteConfirmModal');
}
function confirmDeleteBOM() {
    const id       = parseInt($('#hfDeleteBOMId').val()    || '0', 10) || 0;
    const subId    = parseInt($('#hfDeleteBOMSubId').val() || '0', 10) || 0;
    const reason   = ($('#bomReasonForDeleteInput').val() || '').trim();

    if (!id)     { toastr.error('Invalid BOM selected for deletion.'); return; }
    if (!reason) { toastr.warning('Please enter reason for deletion.'); $('#bomReasonForDeleteInput').focus(); return; }

    if (!BOMService || typeof BOMService.DeleteBOM !== 'function') return;

    Showloader && Showloader();
    BOMService.DeleteBOM(id, subId, reason)
        .then(function (resp) {
            HideLoader && HideLoader();
            if (resp && resp.Status === 'Y') {
                toastr.success(resp.Msg || 'BOM deleted successfully.');
                hideModal('dvBOMDeleteConfirmModal');
                loadBOMList();
            } else {
                toastr.warning((resp && resp.Msg));
            }
        })
        .catch(function () {
            HideLoader && HideLoader();
            toastr.error('Error while deleting BOM.');
        });
}
function loadProjectsAndSubProjects() {
    const projPromise = ProjectMasterService.GetProjectList()
        .then(function (projects) {
            G_ProjectList = Array.isArray(projects) ? projects : [];
            bindProjectDropdown();
        })
        .catch(function () { toastr.error('Error loading project list.'); });

    const subPromise = SubProjectMasterService.GetSubProjectList()
        .then(function (subs) {
            G_SubProjectList = Array.isArray(subs) ? subs : [];
            bindSubProjectDropdown();
        })
        .catch(function () { toastr.error('Error loading sub-project list.'); });

    return Promise.all([projPromise, subPromise]);
}
function bindProjectDropdown() {
    const $ddl = $('#ddlProject');
    $ddl.empty().append('<option value="">-- Select Project --</option>');
    G_ProjectList.forEach(function (p) {
        const code = p.Code || 0;
        const name = (p.ProjectDesp || p.ProjectName || '').trim() || ('Project ' + code);
        $ddl.append(`<option value="${code}">${escHtml(name)}</option>`);
    });
    $ddl.off('change').on('change', function () { bindSubProjectDropdown(); });
}
function bindSubProjectDropdown() {
    const $ddl            = $('#ddlSubProject');
    const selectedProject = $('#ddlProject').val();

    $ddl.empty();

    if (!G_SubProjectList.length) {
        $ddl.append('<option value="">No sub-projects found</option>');
        return;
    }
    if (!selectedProject) {
        $ddl.append('<option value="">Select project first</option>');
        return;
    }

    $ddl.append('<option value="">-- Select Sub Project --</option>');

    G_SubProjectList
        .filter(function (row) {
            return String(row.ProjectMaster_Code || row.MasterProjectCode || 0) === String(selectedProject);
        })
        .forEach(function (sp) {
            const code = sp.Code || 0;
            const name = (sp.SubProjectDesp || sp.SubProjectName || '').trim() || ('Sub Project ' + code);
            $ddl.append(`<option value="${code}" data-name="${escHtml(name)}">${escHtml(name)}</option>`);
        });
}

function bindCopyFromProjectDropdown() {
    const $ddl = $('#ddlCopyFromProject');
    $ddl.empty().append('<option value="">-- Select Project --</option>');
    (G_ProjectList || []).forEach(function (p) {
        const code = p.Code || 0;
        const name = (p.ProjectDesp || p.ProjectName || '').trim() || ('Project ' + code);
        $ddl.append(`<option value="${code}">${escHtml(name)}</option>`);
    });
    $ddl.off('change.copyfrom').on('change.copyfrom', function () {
        bindCopyFromSubProjectDropdown();
    });
}

function bindCopyFromSubProjectDropdown() {
    const $ddl = $('#ddlCopyFromSubProject');
    const selectedProject = $('#ddlCopyFromProject').val();

    $ddl.empty();

    if (!G_SubProjectList.length) {
        $ddl.append('<option value="">No sub-projects found</option>');
        return;
    }
    if (!selectedProject) {
        $ddl.append('<option value="">Select project first</option>');
        return;
    }

    $ddl.append('<option value="">-- Select Sub Project --</option>');

    G_SubProjectList
        .filter(function (row) {
            return String(row.ProjectMaster_Code || row.MasterProjectCode || 0) === String(selectedProject);
        })
        .forEach(function (sp) {
            const code = sp.Code || 0;
            const name = (sp.SubProjectDesp || sp.SubProjectName || '').trim() || ('Sub Project ' + code);
            $ddl.append(`<option value="${code}" data-name="${escHtml(name)}">${escHtml(name)}</option>`);
        });
}

function clearCopyFromSession() {
    G_CopyFromSource = { active: false, projectCode: 0, subProjectCode: 0, projectName: '', subProjectDesp: '' };
    $('#copyFromSessionInfo').hide().text('').attr('title', '');
    $('#copyFromModalFilledInfo').hide().text('');
}

function rememberCopyFromSource(projectCode, subProjectCode, projectName, subProjectDesp) {
    G_CopyFromSource = {
        active: true,
        projectCode: parseInt(projectCode || '0', 10) || 0,
        subProjectCode: parseInt(subProjectCode || '0', 10) || 0,
        projectName: (projectName || '').trim(),
        subProjectDesp: (subProjectDesp || '').trim()
    };
    updateCopyFromDisplay();
}

function updateCopyFromDisplay() {
    if (!G_CopyFromSource.active) {
        clearCopyFromSession();
        return;
    }
    const label = 'Filled from: ' + G_CopyFromSource.projectName
        + (G_CopyFromSource.subProjectDesp ? ' / ' + G_CopyFromSource.subProjectDesp : '');
    $('#copyFromSessionInfo').text(label).attr('title', label).show();
    $('#copyFromModalFilledInfo')
        .html('<i class="fas fa-info-circle"></i> Table loaded from <strong>'
            + escHtml(G_CopyFromSource.projectName)
            + (G_CopyFromSource.subProjectDesp ? ' / ' + escHtml(G_CopyFromSource.subProjectDesp) : '')
            + '</strong>. Save to clear.')
        .show();
}

function restoreCopyFromModalSelections() {
    if (!G_CopyFromSource.active) return;
    bindCopyFromProjectDropdown();
    if (G_CopyFromSource.projectCode) {
        $('#ddlCopyFromProject').val(String(G_CopyFromSource.projectCode));
        bindCopyFromSubProjectDropdown();
    }
    if (G_CopyFromSource.subProjectCode) {
        $('#ddlCopyFromSubProject').val(String(G_CopyFromSource.subProjectCode));
    }
    updateCopyFromDisplay();
}

function openCopyFromModal() {
    if (!$('#dvBOMEntry').is(':visible')) {
        toastr.warning('Please open BOM entry before using Copy From.');
        return;
    }

    const ensureMasters = (!G_ProjectList.length || !G_SubProjectList.length)
        ? loadProjectsAndSubProjects()
        : Promise.resolve();

    Showloader && Showloader();
    ensureMasters
        .then(function () {
            HideLoader && HideLoader();
            if (G_CopyFromSource.active) {
                restoreCopyFromModalSelections();
            } else {
                bindCopyFromProjectDropdown();
                bindCopyFromSubProjectDropdown();
                $('#ddlCopyFromProject').val('');
                $('#ddlCopyFromSubProject').empty().append('<option value="">Select project first</option>');
                $('#copyFromModalFilledInfo').hide().text('');
            }
            showModal('dvBOMCopyFromModal');
        })
        .catch(function () {
            HideLoader && HideLoader();
            toastr.error('Error loading project list for Copy From.');
        });
}

function prepareCopyFromDetailRows(detailRows) {
    return (detailRows || []).map(function (d) {
        return Object.assign({}, d, {
            Code     : 0,
            Verify   : 'N',
            VerifyON : null,
            VerifyBy : null
        });
    });
}

function clearBomTableAndSummary() {
    $('#tblBOM tbody').empty();
    $('#tblBOMSummary tbody').empty();
    $('#bomSummaryTotalsLine').empty();
    $('#sumQtyRequired').text('—');
    $('#sumAmount').text('—');
    $('#sumTotalAmount').text('—');
    $('#dvBOMSummary').hide();
    G_BOMRows = [];
}

function applyCopyFromResponse(detailRows) {
    clearBomTableAndSummary();
    /* Do not change main form Project / Sub Project — target stays as user selected externally. */
    const copyRows = prepareCopyFromDetailRows(detailRows);
    applyBomDetailRows(copyRows);
    enableBomEntryRows();
}

function enableBomEntryRows() {
    $('#tblBOM tbody tr').each(function () {
        $(this).attr('data-state', 'edit');
        $(this).find('.bom-input:not(.bom-uom):not(.bom-amount):not(.bom-gst-amount):not(.bom-total-amount)').prop('readonly', false);
        $(this).find('.bom-select').prop('disabled', false);
        $(this).find('.bom-uom, .bom-amount, .bom-gst-amount, .bom-total-amount').prop('readonly', true);
    });
}

function fillBomFromCopy() {
    const targetProjectCode = parseInt($('#ddlProject').val() || '0', 10) || 0;
    const targetSubCode     = parseInt($('#ddlSubProject').val() || '0', 10) || 0;
    const sourceProjectCode = parseInt($('#ddlCopyFromProject').val() || '0', 10) || 0;
    const sourceSubCode     = parseInt($('#ddlCopyFromSubProject').val() || '0', 10) || 0;

    if (!sourceProjectCode) {
        toastr.warning('Please select source project in Copy From.');
        $('#ddlCopyFromProject').focus();
        return;
    }
    if (!sourceSubCode) {
        toastr.warning('Please select source sub-project in Copy From.');
        $('#ddlCopyFromSubProject').focus();
        return;
    }
    if (targetProjectCode && targetSubCode
        && String(targetProjectCode) === String(sourceProjectCode)
        && String(targetSubCode) === String(sourceSubCode)) {
        toastr.warning('Source and target project/sub-project cannot be the same.');
        return;
    }

    if (!BOMService || typeof BOMService.GetBOMCopyFrom !== 'function') {
        toastr.error('Copy From service is not available.');
        return;
    }

    Showloader && Showloader();
    BOMService.GetBOMCopyFrom(sourceProjectCode, sourceSubCode)
        .then(function (response) {
            const failMsg = getBomApiFailureMessage(response, 'Could not copy BOM.');
            if (failMsg) {
                HideLoader && HideLoader();
                toastr.warning(failMsg);
                return;
            }

            const detailRows = normalizeBOMDetailResponse(response);
            if (!detailRows.length) {
                HideLoader && HideLoader();
                toastr.warning('No BOM lines found for the selected project and sub-project.');
                return;
            }

            const loadPromises = [];
            if (!G_ProjectList.length || !G_SubProjectList.length) {
                loadPromises.push(loadProjectsAndSubProjects());
            }
            if (!G_CategoryList.length || !G_WorkTypeList.length) {
                loadPromises.push(loadCategoryAndWorkTypeMaster());
            }
            const masterPromise = loadPromises.length ? Promise.all(loadPromises) : Promise.resolve();

            return masterPromise.then(function () {
                const $srcSub = $('#ddlCopyFromSubProject option:selected');
                const $srcPrj = $('#ddlCopyFromProject option:selected');
                const srcProjectName = ($srcPrj.text() || '').trim();
                const srcSubDesp = ($srcSub.data('name') || $srcSub.text() || '').trim();

                applyCopyFromResponse(detailRows);
                rememberCopyFromSource(sourceProjectCode, sourceSubCode, srcProjectName, srcSubDesp);

                hideModal('dvBOMCopyFromModal');
                HideLoader && HideLoader();
                toastr.success('Copied ' + detailRows.length + ' line(s). Target project/sub-project unchanged.');
            });
        })
        .catch(function (error) {
            HideLoader && HideLoader();
            toastr.warning((error && error.Msg) || 'Error while copying BOM.');
        });
}

function loadCategoryAndWorkTypeMaster() {
    if (!BOMService) return Promise.resolve();

    const catPromise = BOMService.GetCategoryList()
        .then(function (categories) {
            let rows = Array.isArray(categories) ? categories
                : (Array.isArray(categories.data) ? categories.data
                : (Array.isArray(categories.Data) ? categories.Data : []));
            G_CategoryList = rows || [];
        })
        .catch(function () { toastr.error('Error loading project category list.'); });

    const wtPromise = BOMService.GetWorkTypeList()
        .then(function (workTypes) {
            let rows = Array.isArray(workTypes) ? workTypes
                : (Array.isArray(workTypes.data) ? workTypes.data
                : (Array.isArray(workTypes.Data) ? workTypes.Data : []));
            G_WorkTypeList = rows || [];
        })
        .catch(function () { toastr.error('Error loading work type list.'); });

    return Promise.all([catPromise, wtPromise]);
}
function resetBomForm() {
    G_BOMRows   = [];
    G_BOMHeader = {};
    clearCopyFromSession();

    $('#hfBOMCode').val(0);
    $('#ddlProject').val('').prop('disabled', false);
    $('#ddlSubProject').empty().append('<option value="">Select project first</option>').prop('disabled', false);
    $('#tblBOM tbody').empty();
    $('#tblBOMSummary tbody').empty();
    $('#bomSummaryTotalsLine').empty();
    $('#sumQtyRequired').text('—');
    $('#sumAmount').text('—');
    $('#sumTotalAmount').text('—');
    $('#dvBOMSummary').hide();
    $('#btnVerifyAllBomRows').hide().prop('disabled', false);
    $('#btnSaveAllBomRows').prop('disabled', false);
    $('#btnCopyFromBom, #btnAddBomRow').prop('disabled', false);
}
function addNewBomRow() {
    const $tbody    = $('#tblBOM tbody');
    const nextIndex = $tbody.children('tr').length + 1;
    const rowId     = `bomRow_${Date.now()}_${nextIndex}`;

    const $tr = $(`
        <tr data-row-id="${rowId}" data-state="edit" data-detail-code="0" data-uom-code="0">
            <td class="center">${nextIndex}</td>
            <td class="bom-col-category">
                <select class="bom-select bom-project-category">
                    <option value="">Select</option>
                </select>
            </td>
            <td>
                <select class="bom-select bom-work-type">
                    <option value="">Select</option>
                </select>
            </td>
            <td class="bom-col-item-name">
                <div style="display:flex;align-items:center;gap:4px;">
                    <select class="bom-select bom-item" style="flex:1;min-width:0;">
                        <option value="">Select</option>
                    </select>
                    <button type="button" class="item-add-btn js-open-item-master" title="Add New Item">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </td>
            <td class="bom-col-uom center">
                <input type="text" class="bom-input bom-uom" readonly />
            </td>
            <td class="bom-col-spec">
                <input type="text" class="bom-input bom-item-spec" />
            </td>
            <td class="bom-col-tolerance">
                <input type="text" class="bom-input bom-tolerance right" />
            </td>
            <td class="bom-col-qty">
                <input type="text" class="bom-input bom-qty-required right" />
            </td>
            <td class="bom-col-rate-tol">
                <input type="text" class="bom-input bom-rate-tol right" />
            </td>
            <td class="bom-col-rate">
                <input type="text" class="bom-input bom-est-rate right" />
            </td>
            <td class="bom-col-amount">
                <input type="text" class="bom-input bom-amount right" readonly />
            </td>
            <td class="bom-col-gst-pct">
                <input type="text" class="bom-input bom-gst-pct right" />
            </td>
            <td class="bom-col-gst-amt">
                <input type="text" class="bom-input bom-gst-amount right" readonly />
            </td>
            <td class="bom-col-total-amt">
                <input type="text" class="bom-input bom-total-amount right" readonly />
            </td>
            <td class="center">
                <button type="button" class="bom-btn icon del js-bom-row-delete" title="Remove">
                    <i class="fas fa-times-circle"></i>
                </button>
            </td>
        </tr>
    `);

    $tbody.append($tr);

    initRowCategoryDropdown($tr);
    initRowWorkTypeDropdown($tr);
    initRowEvents($tr);
}
function initRowCategoryDropdown($tr) {
    const $cat = $tr.find('.bom-project-category');
    $cat.empty().append('<option value="">Select</option>');
    (G_CategoryList || []).forEach(function (c) {
        const code = c.Code || 0;
        const name = (c.CategoryDesp || c.CategoryName || c.Category || '').trim() || ('Category ' + code);
        $cat.append(`<option value="${code}">${escHtml(name)}</option>`);
    });
    $cat.off('change.bomSum').on('change.bomSum', function () { refreshBOMSummary(); });
}
function initRowWorkTypeDropdown($tr) {
    const $wt = $tr.find('.bom-work-type');
    $wt.empty().append('<option value="">Select</option>');
    (G_WorkTypeList || []).forEach(function (t) {
        const code = t.Code || 0;
        const name = (t.WorkTypeDesp || t.WorkType || t.WorkTypeName || t.ItemType || '').trim();
        if (!name) return;
        $wt.append(`<option value="${code}" data-worktype="${escHtml(name)}">${escHtml(name)}</option>`);
    });
    $wt.off('change').on('change', function () {
        bindItemDropdownForRow($tr);
    });
}
function setWorkTypeSilent($tr, workTypeCode, workTypeName) {
    const $wt = $tr.find('.bom-work-type');

    // Primary: match by numeric code
    if (workTypeCode) {
        $wt.val(String(workTypeCode));
        if ($wt.val()) return;  // jQuery returns null if the value isn't an existing option
    }

    // Fallback: match by option text
    if (!workTypeName) return;
    const needle = workTypeName.trim().toLowerCase();
    $wt.find('option').each(function () {
        if (($(this).data('worktype') || $(this).text() || '').toLowerCase() === needle) {
            $wt.val($(this).val());
            return false;
        }
    });
}
function getItemGstRateFromMaster(item) {
    if (!item) return 0;
    const raw = item.GSTRate != null ? item.GSTRate
        : (item.DutyValue != null ? item.DutyValue
        : (item.GSTPercent != null ? item.GSTPercent : 0));
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
}

function findBomItemInCache(workTypeName, itemCode) {
    const cacheKey = (workTypeName || '').trim().toUpperCase();
    if (!cacheKey || !itemCode) return null;
    const code = parseInt(itemCode, 10) || 0;
    const items = G_ItemCacheByWorkType[cacheKey] || [];
    return items.find(function (it) { return (it.Code || 0) === code; }) || null;
}

/**
 * Apply item master fields to row (same pattern as PO Store OnItemChange).
 * @param {jQuery} $tr
 * @param {object|null} item - row from GetItemMasterList cache
 * @param {object} options - { bindGstFromMaster: true }
 */
function applyItemMasterFieldsToRow($tr, item, options) {
    options = options || {};
    const bindGst = options.bindGstFromMaster !== false;

    if (!item) {
        $tr.find('.bom-uom').val('');
        $tr.attr('data-uom-code', 0);
        $tr.find('.bom-item-spec').val('');
        if (bindGst) $tr.find('.bom-gst-pct').val('');
        recalcGstAndTotal($tr);
        refreshBOMSummary();
        return;
    }

    const uom     = item.UOM || '';
    const uomCode = parseInt(item.UOMMaster_Code || 0, 10) || 0;
    const spec    = (item.ItemSpecification || item.ItemSpecificationDesp || '').trim();
    const gstRate = getItemGstRateFromMaster(item);

    $tr.attr('data-item-code', item.Code || 0);
    $tr.find('.bom-uom').val(uom);
    $tr.attr('data-uom-code', uomCode);
    $tr.find('.bom-item-spec').val(spec);

    if (bindGst) {
        $tr.find('.bom-gst-pct').val(formatBomMoneyRaw(gstRate.toFixed(2)));
    }

    recalcGstAndTotal($tr);
    refreshBOMSummary();
}

function onBomItemSelected($tr, options) {
    options = options || {};
    const $item    = $tr.find('.bom-item');
    const itemCode = $item.val();

    if (!itemCode) {
        applyItemMasterFieldsToRow($tr, null, { bindGstFromMaster: true });
        return;
    }

    const workTypeName = ($tr.find('.bom-work-type option:selected').data('worktype') || '').toString().trim();
    const cachedItem   = findBomItemInCache(workTypeName, itemCode);

    if (cachedItem) {
        applyItemMasterFieldsToRow($tr, cachedItem, options);
        return;
    }

    /* Fallback: single injected option (edit row before full list loads) */
    const $opt    = $item.find('option:selected');
    const uom     = $opt.attr('data-uom') || '';
    const uomCode = parseInt($opt.attr('data-uom-code') || 0, 10) || 0;
    const spec    = $opt.attr('data-item-spec') || '';
    const gstRate = parseFloat($opt.attr('data-gst-rate') || 0) || 0;

    $tr.attr('data-item-code', parseInt(itemCode, 10) || 0);
    $tr.find('.bom-uom').val(uom);
    $tr.attr('data-uom-code', uomCode);
    $tr.find('.bom-item-spec').val(spec);

    if (options.bindGstFromMaster !== false) {
        $tr.find('.bom-gst-pct').val(formatBomMoneyRaw(gstRate.toFixed(2)));
    }

    recalcGstAndTotal($tr);
    refreshBOMSummary();
}

function bindItemDropdownForRow($tr, options) {
    options = options || {};
    const $wt          = $tr.find('.bom-work-type');
    const selectedCode = $wt.val();
    const workTypeName = ($wt.find('option:selected').data('worktype') || '').toString().trim();

    const $item = $tr.find('.bom-item');
    const prevItemCode = options.preselectCode || $item.val();
    $item.empty().append('<option value="">Select</option>');
    if (!options.preserveFields) {
        $tr.find('.bom-uom').val('');
        $tr.attr('data-uom-code', 0);
    }

    if (!selectedCode || !workTypeName) return;

    const cacheKey = workTypeName.toUpperCase();

    function bindItems(items) {
        (items || []).forEach(function (it) {
            const itemCode = it.Code || 0;
            const name     = (it.ItemName || '').trim();
            const uom      = it.UOM || '';
            const uomCode  = parseInt(it.UOMMaster_Code || 0, 10) || 0;
            const itemSpec = (it.ItemSpecification || it.ItemSpecificationDesp || '').trim();
            const gstRate  = getItemGstRateFromMaster(it);
            $item.append(
                `<option value="${itemCode}" data-uom="${escHtml(uom)}" data-uom-code="${uomCode}" data-item-spec="${escHtml(itemSpec)}" data-gst-rate="${gstRate}">${escHtml(name)}</option>`
            );
        });

        $item.off('change.bomItem').on('change.bomItem', function () {
            onBomItemSelected($tr, { bindGstFromMaster: true });
        });

        if (prevItemCode) {
            $item.val(String(prevItemCode));
            if ($item.val()) {
                onBomItemSelected($tr, {
                    bindGstFromMaster: !options.preserveGst
                });
            }
        }
    }

    if (G_ItemCacheByWorkType[cacheKey]) {
        bindItems(G_ItemCacheByWorkType[cacheKey]);
        return;
    }

    if (!BOMService || typeof BOMService.GetItemMasterList !== 'function') return;

    BOMService.GetItemMasterList(workTypeName)
        .then(function (items) {
            let rows = Array.isArray(items) ? items
                : (Array.isArray(items.data) ? items.data
                : (Array.isArray(items.Data) ? items.Data : []));
            G_ItemCacheByWorkType[cacheKey] = rows || [];
            bindItems(G_ItemCacheByWorkType[cacheKey]);
        })
        .catch(function () {
            toastr.error('Error loading item master for selected work type.');
        });
}
function getUomTextFromCache(workTypeName, itemCode) {
    if (!workTypeName || !itemCode) return '';
    const cacheKey = workTypeName.toUpperCase();
    const items = G_ItemCacheByWorkType[cacheKey] || [];
    const found = items.find(function (it) { return (it.Code || 0) === itemCode; });
    return found ? (found.UOM || '') : '';
}

// After edit rows are built, fetch item lists for every work type present so that
// UOM text (not returned by GETBYCODE) can be filled in from the GETITEMMASATERLIST cache.
function prefetchUOMsForRows(detailRows) {
    if (!BOMService || typeof BOMService.GetItemMasterList !== 'function') return;

    // Collect unique work-type names (key = uppercased name, value = original case for API call)
    var workTypeMap = {};
    detailRows.forEach(function (d) {
        var name = (d.WorkTypeDesp || '').trim();
        if (name) workTypeMap[name.toUpperCase()] = name;
    });

    Object.keys(workTypeMap).forEach(function (key) {
        var displayName = workTypeMap[key];

        if (G_ItemCacheByWorkType[key]) {
            // Already cached — apply immediately
            applyUOMsFromCache(key);
        } else {
            // Fetch from API, cache, then apply
            BOMService.GetItemMasterList(displayName)
                .then(function (items) {
                    var rows = Array.isArray(items) ? items
                        : (Array.isArray(items.data) ? items.data
                        : (Array.isArray(items.Data) ? items.Data : []));
                    G_ItemCacheByWorkType[key] = rows || [];
                    applyUOMsFromCache(key);
                })
                .catch(function () {});
        }
    });
}

// For every table row whose data-work-type-name matches cacheKey, look up the item
// in the cache and write the UOM text + UOM code into the row.
function applyUOMsFromCache(cacheKey) {
    var items = G_ItemCacheByWorkType[cacheKey] || [];
    if (!items.length) return;

    $('#tblBOM tbody tr').each(function () {
        var $tr          = $(this);
        var rowWtKey     = ($tr.attr('data-work-type-name') || '').toUpperCase();
        if (rowWtKey !== cacheKey) return;

        var itemCode = parseInt($tr.attr('data-item-code') || '0', 10) || 0;
        if (!itemCode) return;

        var found = items.find(function (it) { return (it.Code || 0) === itemCode; });
        if (!found) return;

        var uom     = found.UOM || '';
        var uomCode = parseInt(found.UOMMaster_Code || 0, 10) || 0;
        var gstRate = getItemGstRateFromMaster(found);
        var itemSpec = (found.ItemSpecification || found.ItemSpecificationDesp || '').trim();

        $tr.find('.bom-item option[value="' + itemCode + '"]')
            .attr('data-uom', uom)
            .attr('data-uom-code', uomCode)
            .attr('data-item-spec', itemSpec)
            .attr('data-gst-rate', gstRate);

        $tr.find('.bom-uom').val(uom);
        $tr.attr('data-uom-code', uomCode);

        if (!$tr.find('.bom-gst-pct').val()) {
            $tr.find('.bom-gst-pct').val(formatBomMoneyRaw(gstRate.toFixed(2)));
            recalcGstAndTotal($tr);
        }
    });
    refreshBOMSummary();
}
function initRowEvents($tr) {
    $tr.find('.bom-qty-required').on('input', function () {
        enforceNumericWithMax(this, 2, BOM_MAX_QTY);
        recalcAmount($tr);
    });
    $tr.find('.bom-est-rate').on('input', function () {
        enforceBomRateInput(this);
        recalcAmount($tr);
    });
    $tr.find('.bom-tolerance').on('input',   function () { enforceNumeric(this, 3); refreshBOMSummary(); });
    $tr.find('.bom-rate-tol').on('input',    function () { enforceNumeric(this, 3); refreshBOMSummary(); });
    $tr.find('.bom-gst-pct').on('input', function () {
        enforceNumericWithMax(this, 2, BOM_MAX_GST_PCT);
        recalcGstAndTotal($tr);
        refreshBOMSummary();
    });

    $tr.find('.js-bom-row-delete').on('click', function () { deleteBomRow($tr); });
}
function deleteBomRow($tr) {
    const $tbody = $('#tblBOM tbody');
    if ($tbody.children('tr').length <= 1) {
        $tr.find('input.bom-input').val('');
        $tr.find('select.bom-select').val('');
        $tr.find('.bom-uom').val('');
        $tr.attr('data-detail-code', 0).attr('data-uom-code', 0);
        refreshBOMSummary();
        return;
    }
    $tr.remove();
    $tbody.children('tr').each(function (idx) {
        $(this).find('td').first().text(idx + 1);
    });
    refreshBOMSummary();
}
function buildRowPayload($tr) {
    return {
        DetailCode    : parseInt($tr.attr('data-detail-code') || '0', 10) || 0,
        CategoryCode  : parseInt($tr.find('.bom-project-category').val() || '0', 10) || 0,
        WorkTypeCode  : parseInt($tr.find('.bom-work-type').val() || '0', 10) || 0,
        ItemCode      : parseInt($tr.find('.bom-item').val() || '0', 10) || 0,
        UOM           : $tr.find('.bom-uom').val() || '',
        UOMMaster_Code: parseInt($tr.attr('data-uom-code') || '0', 10) || 0,
        ItemSpecificationDesp : ($tr.find('.bom-item-spec').val() || '').trim(),
        Tolerance         : parseFloat(($tr.find('.bom-tolerance').val() || '0').replace(/,/g, '')) || 0,
        QtyRequired       : parseFloat(($tr.find('.bom-qty-required').val() || '0').replace(/,/g, '')) || 0,
        RateTolerance     : parseFloat(($tr.find('.bom-rate-tol').val() || '0').replace(/,/g, '')) || 0,
        EstRate           : parseBomMoney($tr.find('.bom-est-rate').val()),
        Amount            : parseBomMoney($tr.find('.bom-amount').val()),
        GSTRate           : parseFloat(($tr.find('.bom-gst-pct').val() || '0').replace(/,/g, '')) || 0,
        GSTAmount         : parseBomMoney($tr.find('.bom-gst-amount').val()),
        TotalAmount       : getBomRowLineTotal($tr)
    };
}
function saveAllRows() {
    const $rows = $('#tblBOM tbody tr');
    if (!$rows.length) {
        toastr.warning('Please add at least one row.');
        return;
    }

    const payloads = [];
    let hasError   = false;

    $rows.each(function () {
        const $tr  = $(this);
        const item = $tr.find('.bom-item').val();
        const qty  = $tr.find('.bom-qty-required').val();

        // Skip completely empty rows
        if (!item && (!qty || parseFloat((qty || '').toString().replace(/,/g, '')) === 0)) return;

        if (!validateRow($tr)) { hasError = true; return false; }

        payloads.push(buildRowPayload($tr));
    });

    if (hasError) return;
    if (!payloads.length) {
        toastr.warning('Please enter at least one complete line before saving.');
        return;
    }

    const subProjectCodePre = parseInt($('#ddlSubProject').val() || '0', 10) || 0;
    if (subProjectCodePre && G_SubProjectList && G_SubProjectList.length) {
        const spRow = G_SubProjectList.find(function (s) { return String(s.Code) === String(subProjectCodePre); });
        const limit = spRow ? (parseFloat(spRow.Budget || spRow.SubProjectBudget || 0) || 0) : 0;
        if (limit > 0) {
            let bomSum = 0;
            payloads.forEach(function (p) { bomSum += parseFloat(p.TotalAmount || p.Amount || 0) || 0; });
            if (bomSum > limit) {
                toastr.warning(
                    'Total BOM amount (' + formatInrAmountNum(bomSum, 2, 2)
                        + ') cannot exceed sub-project budget (' + formatInrAmountNum(limit, 2, 2) + ').'
                );
                return;
            }
        }
    }

    // For edit, hfBOMCode holds the ProjectMaster_Code; for new, fall back to ddlProject
    const projectMaster_Code =
        parseInt($('#hfBOMCode').val() || '0', 10) ||
        parseInt($('#ddlProject').val() || '0', 10) || 0;

    if (!projectMaster_Code) {
        toastr.warning('Please select a Project before saving.');
        return;
    }

    // Sub project
    const subProjectCode = parseInt($('#ddlSubProject').val() || '0', 10) || 0;
    const subProjectDesp = subProjectCode
        ? (($('#ddlSubProject option:selected').data('name') ||
            $('#ddlSubProject option:selected').text() || '')).trim()
        : '';

    G_BOMRows = payloads.slice();

    // Map to TY_ProjectBOMDetails TVP — column names must exactly match the SQL type
    const Details = payloads.map(function (p) {
        return {
            Code                             : p.DetailCode || 0,
            ProjectMaster_Code               : projectMaster_Code,
            ProjectCategory_Code             : p.CategoryCode || 0,
            ProjectSubCategory_Code          : 0,
            F_CommonValues_WorkType_Code     : 0,
            WorkTypeMaster_Code              : p.WorkTypeCode || 0,
            UOMMaster_Code                   : p.UOMMaster_Code || 0,
            QtyRequired                      : p.QtyRequired || 0,
            Rate                             : p.EstRate || 0,
            Amount                           : p.Amount || 0,
            GSTRate                          : p.GSTRate || 0,
            GSTAmount                        : p.GSTAmount || 0,
            ItemMaster_Code                  : p.ItemCode || 0,
            GodownMaster_Code                : 0,
            SubProjectDesp                   : subProjectDesp,
            ServiceProviderNatureMaster_Code : 0,
            Tolerance                        : p.Tolerance || 0,
            RateTolerance                    : p.RateTolerance || 0,
            SubProjectMaster_Code            : subProjectCode,
            ItemSpecificationDesp            : p.ItemSpecificationDesp || ''
        };
    });

    // Payload matches VM_BOMSaveRequest { Code, Details }
    const payload = { Code: projectMaster_Code, Details: Details };

    if (!BOMService || typeof BOMService.SaveBOM !== 'function') {
        lockAllRowsAfterSave();
        toastr.success('All BOM lines saved (local only).');
        return;
    }

    Showloader && Showloader();
    let saveSuccessMsg = '';
    BOMService.SaveBOM(payload)
        .then(function (resp) {
            if (resp && resp.Status === 'Y') {
                saveSuccessMsg = resp.Msg || 'BOM saved successfully.';
                $('#hfBOMCode').val(projectMaster_Code);
                if (BOMService && typeof BOMService.GetBOMByCode === 'function') {
                    return BOMService.GetBOMByCode(projectMaster_Code, subProjectCode);
                }
                return Promise.resolve(null);
            }
            HideLoader && HideLoader();
            toastr.warning((resp && (resp.Msg || resp.Message)));
            return Promise.reject(new Error());
        })
        .then(function (reloadResponse) {
            HideLoader && HideLoader();
            if (reloadResponse !== null && reloadResponse !== undefined) {
                const detailRows = normalizeBOMDetailResponse(reloadResponse);
                applyBomDetailRows(detailRows);
            }
            lockAllRowsAfterSave();
            $('#btnVerifyAllBomRows').show();
            clearCopyFromSession();
            toastr.success(saveSuccessMsg || 'BOM saved successfully.');
            loadBOMList();
        })
        .catch(function (err) {
            HideLoader && HideLoader();
            if (err && err.message === 'save_failed') return;
            toastr.error('Error while saving BOM or reloading lines.');
        });
}
function lockAllRowsAfterSave() {
    $('#tblBOM tbody tr').each(function () {
        $(this).attr('data-state', 'saved');
        $(this).find('.bom-input, .bom-select').prop('readonly', true).prop('disabled', true);
    });
}
function verifyAllRows() {
    const bomCode    = parseInt($('#hfBOMCode').val()      || '0', 10) || 0;
    const subProjCode = parseInt($('#ddlSubProject').val() || '0', 10) || 0;
    if (!bomCode) {
        toastr.warning('Please save BOM before verify.');
        return;
    }

    if (!BOMService || typeof BOMService.VerifyBOM !== 'function') {
        $('#tblBOM tbody tr').addClass('table-success');
        $('#btnVerifyAllBomRows').prop('disabled', true);
        toastr.success('BOM verified (local only).');
        return;
    }

    Showloader && Showloader();
    BOMService.VerifyBOM(bomCode, subProjCode)
        .then(function (resp) {
            HideLoader && HideLoader();
            if (resp && resp.Status === 'Y') {
                $('#tblBOM tbody tr').addClass('table-success');
                $('#btnVerifyAllBomRows').prop('disabled', true);
                toastr.success(resp.Msg || 'BOM verified successfully.');
                loadBOMList();
            } else {
                toastr.warning((resp && resp.Msg));
            }
        })
        .catch(function () {
            HideLoader && HideLoader();
            toastr.error('Error while verifying BOM.');
        });
}
function validateRow($tr) {
    const item    = $tr.find('.bom-item').val();
    const qty     = $tr.find('.bom-qty-required').val();
    const tol     = $tr.find('.bom-tolerance').val();
    const rateTol = $tr.find('.bom-rate-tol').val();
    const estRate = $tr.find('.bom-est-rate').val();

    if (!item) {
        toastr.warning('Please select Item (Work Material / Service).');
        return false;
    }
    if (!qty || parseFloat((qty || '').toString().replace(/,/g, '')) <= 0) {
        toastr.warning('Please enter Qty Required greater than 0.');
        return false;
    }
    if (tol     && !isValidNumber(tol))     { toastr.warning('Please enter valid Tolerance value.');  return false; }
    if (rateTol && !isValidNumber(rateTol)) { toastr.warning('Please enter valid Rate Tol (%).');     return false; }
    if (estRate && !isValidNumber(estRate)) { toastr.warning('Please enter valid Est. Rate.');        return false; }

    const rateNum = parseBomMoney(estRate);
    const qtyNum  = parseFloat((qty || '').toString().replace(/,/g, '')) || 0;
    const amtNum  = parseBomMoney($tr.find('.bom-amount').val());
    //if (rateNum > BOM_MAX_RATE) {
    //    toastr.warning('Est. Rate cannot exceed ' + BOM_MAX_RATE.toLocaleString('en-IN') + '.');
    //    return false;
    //}
    //if (qtyNum > BOM_MAX_QTY) {
    //    toastr.warning('Qty Required cannot exceed ' + BOM_MAX_QTY.toLocaleString('en-IN') + '.');
    //    return false;
    //}
    //if (amtNum > BOM_MAX_AMOUNT) {
    //    toastr.warning('Amount cannot exceed ' + BOM_MAX_AMOUNT.toLocaleString('en-IN') + '.');
    //    return false;
    //}

    return true;
}

function isValidNumber(val) {
    if (val == null) return false;
    const v = val.toString().replace(/,/g, '').trim();
    return !!v && !isNaN(parseFloat(v));
}
function enforceNumeric(input, maxDecimals) {
    let v = (input.value || '').replace(/,/g, '').replace(/[^0-9.]/g, '');
    const parts = v.split('.');
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
    const p2 = v.split('.');
    if (p2[1]) v = p2[0] + '.' + p2[1].slice(0, maxDecimals);
    input.value = v;
}

function enforceNumericWithMax(input, maxDecimals, maxValue) {
    enforceNumeric(input, maxDecimals);
    if (!input.value) return;
    const n = parseFloat(input.value);
    if (!isNaN(n) && maxValue != null && n > maxValue) {
        input.value = maxDecimals > 0 ? maxValue.toFixed(maxDecimals) : String(maxValue);
    }
}

function enforceBomRateInput(input) {
    formatBomMoneyInput(input);
    const n = parseBomMoney(input.value);
    if (n > BOM_MAX_RATE) {
        input.value = formatBomMoneyRaw(BOM_MAX_RATE.toFixed(2));
    }
}

function capBomMoneyAmount(n) {
    const v = parseFloat(n);
    if (isNaN(v)) return 0;
    return Math.min(v, BOM_MAX_AMOUNT);
}

/** Base amount (Qty × Rate) without GST. */
function getBomRowBaseAmount($tr) {
    return parseBomMoney($tr.find('.bom-amount').val());
}

/** Line total = Total Amt field, or Amount + GST Amount when total not yet calculated. */
function getBomRowLineTotal($tr) {
    const totalFld = parseBomMoney($tr.find('.bom-total-amount').val());
    if (totalFld > 0) return totalFld;
    const amount = parseBomMoney($tr.find('.bom-amount').val());
    const gstAmt = parseBomMoney($tr.find('.bom-gst-amount').val());
    return capBomMoneyAmount(amount + gstAmt);
}
function getCategoryGroupKey($tr) {
    const code = ($tr.find('.bom-project-category').val() || '').trim();
    return code || '_uncat';
}

function getCategoryLabelFromRow($tr) {
    const $sel = $tr.find('.bom-project-category');
    const v = $sel.val();
    if (!v) return 'Uncategorized';
    const t = ($sel.find('option:selected').text() || '').trim();
    return t || ('Category ' + v);
}

function refreshBOMSummary() {
    const groups = {};

    $('#tblBOM tbody tr').each(function () {
        const $tr = $(this);
        const qty       = parseFloat(($tr.find('.bom-qty-required').val() || '0').replace(/,/g, '')) || 0;
        const baseAmt   = getBomRowBaseAmount($tr);
        const totalAmt  = getBomRowLineTotal($tr);
        const item      = $tr.find('.bom-item').val();

        if (!item && qty === 0 && baseAmt === 0 && totalAmt === 0) return;

        const key = getCategoryGroupKey($tr);
        if (!groups[key]) {
            groups[key] = { label: getCategoryLabelFromRow($tr), qty: 0, amount: 0, totalAmount: 0 };
        }
        groups[key].qty += qty;
        groups[key].amount += baseAmt;
        groups[key].totalAmount += totalAmt;
    });

    const keys = Object.keys(groups).filter(function (k) {
        const g = groups[k];
        return g.qty !== 0 || g.amount !== 0 || g.totalAmount !== 0;
    });
    if (!keys.length) {
        $('#dvBOMSummary').hide();
        $('#bomSummaryTotalsLine').empty();
        return;
    }

    const $tbody = $('#tblBOMSummary tbody');
    $tbody.empty();

    let gQty = 0, gBaseAmt = 0, gTotalAmt = 0;

    keys.sort().forEach(function (k) {
        const g = groups[k];
        gQty += g.qty;
        gBaseAmt += g.amount;
        gTotalAmt += g.totalAmount;

        $tbody.append(`
            <tr>
                <td><span class="uom-badge">${escHtml(g.label)}</span></td>
                <td class="right">${formatInrQtyNum(g.qty)}</td>
                <td class="right">${formatInrAmountNum(g.amount, 2, 2)}</td>
                <td class="right"><strong>${formatInrAmountNum(g.totalAmount, 2, 2)}</strong></td>
            </tr>`);
    });

    $('#sumQtyRequired').text(formatInrQtyNum(gQty));
    $('#sumAmount').text(formatInrAmountNum(gBaseAmt, 2, 2));
    $('#sumTotalAmount').text(formatInrAmountNum(gTotalAmt, 2, 2));

    const amtFormatted = formatInrAmountNum(gTotalAmt, 2, 2);
    const wordsFormatted = inrAmountWordsRupeeSymbol(gTotalAmt);
    $('#bomSummaryTotalsLine').html(
        '<div class="bom-summary-footer-qty">Total Qty: ' + escHtml(formatInrQtyNum(gQty)) + '</div>' +
        '<div class="bom-summary-footer-row bom-summary-footer-total-amt">' +
        '<span class="bom-summary-footer-label">Amount :</span> ' +
        '<span class="bom-summary-footer-value">' + escHtml(formatInrAmountNum(gBaseAmt, 2, 2)) + '</span></div>' +
        '<div class="bom-summary-footer-row bom-summary-footer-total-amt">' +
        '<span class="bom-summary-footer-label">Total Amount :</span> ' +
        '<span class="bom-summary-footer-value">' + escHtml(amtFormatted) + '</span></div>' +
        '<div class="bom-summary-footer-row bom-summary-footer-amt-words">' +
        '<span class="bom-summary-footer-label">Amount In Words :</span> ' +
        '<span class="bom-summary-footer-value">' + escHtml(wordsFormatted) + '</span></div>'
    );

    $('#dvBOMSummary').show();
}
function recalcAmount($tr) {
    const qty  = parseFloat(($tr.find('.bom-qty-required').val() || '0').replace(/,/g, '')) || 0;
    const rate = parseBomMoney($tr.find('.bom-est-rate').val());
    const amt  = capBomMoneyAmount(qty * rate);
    if (isNaN(amt)) {
        $tr.find('.bom-amount').val('');
    } else {
        $tr.find('.bom-amount').val(formatBomMoneyRaw(amt.toFixed(2)));
    }
    recalcGstAndTotal($tr);
    refreshBOMSummary();
}

function recalcGstAndTotal($tr) {
    const amount = parseBomMoney($tr.find('.bom-amount').val());
    const gstPct = parseFloat(($tr.find('.bom-gst-pct').val() || '0').replace(/,/g, '')) || 0;

    if (!amount && !gstPct) {
        $tr.find('.bom-gst-amount').val('');
        $tr.find('.bom-total-amount').val('');
        return;
    }

    const gstAmt   = capBomMoneyAmount(amount * gstPct / 100);
    const totalAmt = capBomMoneyAmount(amount + gstAmt);

    $tr.find('.bom-gst-amount').val(formatBomMoneyRaw(gstAmt.toFixed(2)));
    $tr.find('.bom-total-amount').val(formatBomMoneyRaw(totalAmt.toFixed(2)));
}
function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function showModal(id) {
    try {
        const el = document.getElementById(id);
        if (window.bootstrap && window.bootstrap.Modal) {
            bootstrap.Modal.getOrCreateInstance(el).show();
        } else {
            $(`#${id}`).modal('show');
        }
    } catch (e) { $(`#${id}`).modal('show'); }
}
function hideModal(id) {
    try {
        const el = document.getElementById(id);
        if (window.bootstrap && window.bootstrap.Modal) {
            bootstrap.Modal.getOrCreateInstance(el).hide();
        } else {
            $(`#${id}`).modal('hide');
        }
    } catch (e) { $(`#${id}`).modal('hide'); }
}

// ── Item Master Modal ────────────────────────────────────────────────────────

function openItemMasterModal() {
    const baseUrl = sessionStorage.getItem('AppBaseURL') || '';
    document.getElementById('iframeItemMaster').src =
        baseUrl + '/MarketingMasters/ItemMaster/ItemMaster?embedded=1&ModuleDesp=Item%20Master';
    if (window.bootstrap && window.bootstrap.Modal) {
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById('modalAddItemMaster'),
            { backdrop: 'static', keyboard: false }
        ).show();
    } else {
        $('#modalAddItemMaster').modal('show');
    }
}

document.getElementById('modalAddItemMaster').addEventListener('hidden.bs.modal', function () {
    document.getElementById('iframeItemMaster').src = '';
    // Clear item cache so newly added items are fetched on next work-type selection
    G_ItemCacheByWorkType = {};
});

// Delegate click on any + button next to an item dropdown (rows added dynamically)
$(document).on('click', '.js-open-item-master', function () {
    openItemMasterModal();
});
