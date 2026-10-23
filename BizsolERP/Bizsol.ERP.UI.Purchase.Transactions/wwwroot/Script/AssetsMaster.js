import { AssetsMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/AssetsMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { AttachmentControlService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/_AttachmentControlService.js';
import { BranchDetailsFunction } from '../../Bizsol.WebERP.UI.Shared/js/BranchdetailsFunction.js?v=branch-fn-v10';

let G_CurrencyList = [];
let G_CurrencyDecimals = 2;
let G_CanPrintQr = false;
let G_AssetListRows = [];
let G_AssetDetailMode = 'list';
/** Attachment flags for list paperclip color (keyed by AssetsMaster.Code). */
let G_AMM_ListAttachmentYesMap = {};

const AMM_BRANCH_MASTER_TABLE = 'AssetsMaster';
let G_IsMainCompany = false;
let G_AssetVerify = 'N';
let G_BranchList = [];
let G_SelectedBranchCodes = [];
let G_LockedBranchCodes = [];
let G_InitialLockedBranchCodes = [];
let G_BranchSelectionDirty = false;
let G_PendingVerifyAfterBranch = false;

function firstPayloadArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.Data)) return payload.Data;
    if (payload.Table && Array.isArray(payload.Table)) return payload.Table;
    return [];
}

function firstPayloadRow(payload) {
    const arr = firstPayloadArray(payload);
    if (arr.length) return arr[0];
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) return payload;
    return null;
}

function getCurrencyMeta(desc) {
    const raw = String(desc || '').trim();
    const key = raw.replace(/\s+/g, '').replace(/\./g, '').toUpperCase();
    if (!raw || key === 'RS' || key === 'INR' || key === '₹' || key === 'RUPEE' || key === 'RUPEES') {
        return { symbol: '\u20B9', label: raw || 'Rs' };
    }
    if (key === 'US$' || key === 'USD' || key === '$' || key === 'OMR' || key === 'DOLLAR' || key === 'DOLLARS') {
        if (key === 'OMR') return { symbol: 'OMR', label: 'OMR' };
        return { symbol: key === 'USD' || key === '$' ? '$' : 'US$', label: raw || 'US$' };
    }
    if (key === 'EURO' || key === 'EUR' || key === '€') {
        return { symbol: '\u20AC', label: raw || 'EUR' };
    }
    if (key === 'GBP' || key === '£') {
        return { symbol: '\u00A3', label: raw || 'GBP' };
    }
    return { symbol: raw, label: raw };
}

function pickCurrencyDecimals(row) {
    if (!row) return 2;
    const keys = ['DecimalPlaces', 'DecimalPlace', 'NoOfDecimal', 'NoOfDecimals', 'CurrencyDecimal', 'Decimals'];
    for (let i = 0; i < keys.length; i++) {
        const v = row[keys[i]];
        if (v !== undefined && v !== null && String(v).trim() !== '') {
            const n = parseInt(String(v), 10);
            if (!isNaN(n) && n >= 0 && n <= 6) return n;
        }
    }
    return 2;
}

function getSelectedCurrencyRow() {
    const code = $('#ddlAssetCurrency').val();
    if (!code) return null;
    return (G_CurrencyList || []).find(function (c) {
        return String(c.Code || c.code) === String(code);
    }) || null;
}

function applyCurrencyUi() {
    const row = getSelectedCurrencyRow();
    const desc = row ? (row.Desp || row.Description || row.Currency || '') : '';
    const meta = getCurrencyMeta(desc);
    G_CurrencyDecimals = pickCurrencyDecimals(row);
    $('#lblAssetCurrencySymbol').text(meta.symbol || '');
    formatAssetValueField();
}

function formatAssetValueField() {
    const $inp = $('#txtAssetValue');
    const raw = ($inp.val() || '').toString().replace(/,/g, '').trim();
    if (raw === '') return;
    const n = parseFloat(raw);
    if (isNaN(n)) return;
    $inp.val(n.toLocaleString('en-IN', {
        minimumFractionDigits: G_CurrencyDecimals,
        maximumFractionDigits: G_CurrencyDecimals
    }));
}

function parseAssetValueNumber() {
    const raw = ($('#txtAssetValue').val() || '').toString().replace(/,/g, '').trim();
    if (raw === '') return 0;
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
}

function parseOptionalFloat(val) {
    const raw = (val || '').toString().replace(/,/g, '').trim();
    if (raw === '') return 0;
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
}

function parseOptionalInt(val) {
    const raw = (val || '').toString().trim();
    if (raw === '') return 0;
    const n = parseInt(raw, 10);
    return isNaN(n) ? 0 : n;
}

function validateDecimalInput(el, allowDot) {
    if (!el) return;
    let v = el.value;
    if (allowDot) {
        v = v.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    } else {
        v = v.replace(/[^\d]/g, '');
    }
    el.value = v;
}

/** Must match UserRights / ModuleMaster name in ERP (not URL ModuleDesp). */
const AMM_MODULE_NAME = 'Asset Master';

function getAssetsModuleName() {
    return AMM_MODULE_NAME;
}

function ensureAssetsMasterHeading() {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    if (!$('#ERPHeading').text().trim()) {
        $('#ERPHeading').text(AMM_MODULE_NAME);
    }
}

function checkAssetModuleRight(optionName, showMsg) {
    return MenuService.CheckModuleOptionRight(AMM_MODULE_NAME, optionName, showMsg || 'Y', getAssetFinYear());
}

function getAssetFinYear() {
    try {
        const d = new Date();
        let sy = d.getFullYear();
        if (d.getMonth() < 3) sy -= 1;
        return sy + '-' + (sy + 1);
    } catch (e) {
        return '';
    }
}

function setAssetDetailFormMode(mode) {
    G_AssetDetailMode = mode || 'edit';
    const ro = G_AssetDetailMode === 'view';
    $('#ammDetailPanel').toggleClass('amm-readonly', ro);
    $('#ammDetailPanel').find('input:not([type="hidden"]), select, textarea').prop('disabled', ro);
    $('#txtAssetTagNo').prop('readonly', true);
    $('#amm-ci-po-back-btn, .amm-ci-po-back-btn').prop('disabled', false);
    if (ro) {
        $('#btnSaveAsset').hide();
    } else {
        $('#btnSaveAsset').show();
    }
    const pk = parseInt($('#hdnAssetCode').val(), 10) || 0;
    $('#btnPrintAssetQr').toggle(G_CanPrintQr && pk > 0);
    applyAmmBranchVerifyButtons();
}

function applyAmmBranchVerifyButtons() {
    const pk = parseInt($('#hdnAssetCode').val(), 10) || 0;
    const verified = String(G_AssetVerify || 'N').trim().toUpperCase() === 'Y';
    const canEdit = G_AssetDetailMode !== 'view';
    $('#btnAMMBranchDetails').toggle(G_IsMainCompany && canEdit);
    $('#btnVerifyAsset').toggle(G_IsMainCompany && canEdit && pk > 0 && !verified);
}

function ammClearBranchFormState() {
    G_SelectedBranchCodes = [];
    G_LockedBranchCodes = [];
    G_InitialLockedBranchCodes = [];
    G_BranchSelectionDirty = false;
    G_PendingVerifyAfterBranch = false;
    G_AssetVerify = 'N';
}

function ammNormalizeBranchCodes(codes) {
    return (codes || []).map(function (c) { return parseInt(c, 10); }).filter(function (c) { return c > 0; });
}

function ammUnionBranchCodes() {
    const merged = {};
    for (let i = 0; i < arguments.length; i++) {
        ammNormalizeBranchCodes(arguments[i]).forEach(function (c) { merged[c] = true; });
    }
    return Object.keys(merged).map(function (k) { return parseInt(k, 10); });
}

function ammApplyTransferredBranchState(fromApiCodes, resetSelection) {
    const fromApi = ammNormalizeBranchCodes(fromApiCodes);
    G_InitialLockedBranchCodes = ammUnionBranchCodes(G_InitialLockedBranchCodes, fromApi);
    G_LockedBranchCodes = G_InitialLockedBranchCodes.slice();
    if (resetSelection || !G_BranchSelectionDirty) {
        G_SelectedBranchCodes = G_LockedBranchCodes.slice();
    } else {
        G_SelectedBranchCodes = ammUnionBranchCodes(G_LockedBranchCodes, G_SelectedBranchCodes);
    }
}

function ammCollectBranchSelectionFromUi() {
    return ammUnionBranchCodes(
        G_LockedBranchCodes,
        $('#ammBranchListContainer input[type="checkbox"]:not(:disabled):checked')
            .map(function () { return parseInt($(this).val(), 10); }).get()
    );
}

function ammRenderBranchList() {
    const $container = $('#ammBranchListContainer');
    if (!G_BranchList.length) {
        $container.html('<p class="amm-branch-list-empty">No branches have Master Data Transfer enabled.</p>');
        return;
    }
    const lockedSet = {};
    ammNormalizeBranchCodes(G_LockedBranchCodes).forEach(function (c) { lockedSet[c] = true; });
    const selectedSet = {};
    ammNormalizeBranchCodes(G_SelectedBranchCodes).forEach(function (c) { selectedSet[c] = true; });
    ammNormalizeBranchCodes(G_LockedBranchCodes).forEach(function (c) { selectedSet[c] = true; });
    const html = G_BranchList.map(function (branch) {
        const code = parseInt(branch.Code ?? branch.CompanyCode ?? branch.code, 10) || 0;
        const name = branch.CompanyName ?? branch.ShortCompanyName ?? branch.name ?? ('Company ' + code);
        const isLocked = !!lockedSet[code];
        const checked = isLocked || !!selectedSet[code];
        const itemClass = 'amm-branch-list-item' + (isLocked ? ' amm-branch-list-item--locked' : '');
        return (
            '<label class="' + itemClass + '">' +
            '<input type="checkbox" value="' + code + '"' +
            (checked ? ' checked' : '') + (isLocked ? ' disabled data-locked="1"' : '') + ' />' +
            '<span>' + esc(name) + '</span></label>'
        );
    }).join('');
    $container.html(html);
}

function ammLoadBranchListForModal() {
    const $container = $('#ammBranchListContainer');
    $container.html('<p class="amm-branch-list-empty">Loading branches...</p>');
    const recordCode = parseInt($('#hdnAssetCode').val(), 10) || 0;
    const transferredPromise = recordCode > 0
        ? BranchDetailsFunction.GetTransferredBranches(AMM_BRANCH_MASTER_TABLE, recordCode).catch(function () {
            return G_LockedBranchCodes.slice();
        })
        : Promise.resolve([]);
    Promise.all([
        BranchDetailsFunction.GetTransferApplicableBranches(),
        transferredPromise
    ]).then(function (results) {
        G_BranchList = Array.isArray(results[0]) ? results[0] : [];
        ammApplyTransferredBranchState(results[1], !G_BranchSelectionDirty);
        ammRenderBranchList();
    }).catch(function () {
        G_BranchList = [];
        $container.html('<p class="amm-branch-list-empty">Failed to load branches. Please try again.</p>');
    });
}

function OpenAMMBranchDetails() {
    if (!G_IsMainCompany) {
        toastr.warning('Branch Details is only available for the Main Company.');
        return;
    }
    $('#ammBranchDetailsBackdrop').addClass('show');
    ammLoadBranchListForModal();
}
window.OpenAMMBranchDetails = OpenAMMBranchDetails;

function loadAmmMainCompanyFlag() {
    if (!BranchDetailsFunction || typeof BranchDetailsFunction.MainCompany !== 'function') {
        G_IsMainCompany = false;
        return Promise.resolve();
    }
    return BranchDetailsFunction.MainCompany().then(function (value) {
        G_IsMainCompany = String(value || '').trim().toUpperCase() === 'Y';
    }).catch(function () {
        G_IsMainCompany = false;
    });
}

function doVerifyAssetApi(code, companyCodes) {
    const pk = parseInt(code, 10) || 0;
    if (pk <= 0) return;
    AssetsMasterService.VerifyAssetsMaster(pk, companyCodes || '').then(function (res) {
        const r = firstPayloadRow(res) || res || {};
        const ok = r.Status === 1 || r.status === 1 || r.Status === 'Y' || r.status === 'Y';
        if (ok) {
            G_AssetVerify = 'Y';
            applyAmmBranchVerifyButtons();
            toastr.success(r.Msg || r.Message || 'Verified and transferred successfully.');
            LoadAssetList();
        } else {
            toastr.error(r.Msg || r.Message || 'Verify failed.');
        }
    }).catch(function () {
        toastr.error('Verify request failed.');
    });
}

function VerifyAsset() {
    const code = parseInt($('#hdnAssetCode').val(), 10) || 0;
    if (code <= 0) {
        toastr.warning('Please save the asset before verify.');
        return;
    }
    if (String(G_AssetVerify || 'N').trim().toUpperCase() === 'Y') {
        toastr.info('This asset is already verified.');
        return;
    }
    checkAssetModuleRight('Verify', 'Y').then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        G_PendingVerifyAfterBranch = true;
        OpenAMMBranchDetails();
    });
}
window.VerifyAsset = VerifyAsset;

function ShowAssetList() {
    G_AssetDetailMode = 'list';
    ammClearBranchFormState();
    $('#ammListPanel').show();
    $('#ammDetailPanel').hide();
}
window.ShowAssetList = ShowAssetList;

function ShowAssetForm(isNew) {
    if (isNew) ResetAssetForm();
    $('#ammListPanel').hide();
    $('#ammDetailPanel').show();
    if (isNew) setAssetDetailFormMode('edit');
}
window.ShowAssetForm = ShowAssetForm;

function ResetAssetForm() {
    ammClearBranchFormState();
    $('#hdnAssetCode').val('0');
    $('#txtRefNo').val('');
    $('#ddlAssetType').val('');
    $('#txtAssetTagNo').val('');
    $('#txtAssetLife').val('');
    $('#txtLocation').val('');
    $('#ddlAssetCurrency').val('');
    G_CurrencyDecimals = 2;
    $('#lblAssetCurrencySymbol').text('');
    $('#txtAssetValue').val('');
    $('#txtPurchaseDate').val('');
    $('#txtDepApplicableDate').val('');
    $('#txtAccumulatedDep').val('');
    $('#ddlDepartment').val('');
    $('#btnPrintAssetQr').hide();
    syncAssetsMasterAttachButton(false);
}

function assetEntryDateForAttachmentControl() {
    const raw = ($('#txtPurchaseDate').val() || '').toString().trim();
    return raw || '';
}

function getAssetsMasterAttachmentControlMode() {
    return G_AssetDetailMode === 'view' ? 'view' : 'all';
}

function syncAssetsMasterAttachButton(hasFiles) {
    const $btn = $('#btnAssetsMasterAttach');
    if (!$btn.length) return;
    $btn.toggleClass('amm-attach-has-files', !!hasFiles);
}

function refreshAssetsMasterAttachmentButton(code) {
    const c = parseInt(code, 10) || 0;
    if (c <= 0) {
        syncAssetsMasterAttachButton(false);
        return Promise.resolve();
    }
    return AttachmentControlService.GetAttachmentUploadFiles('AssetsMaster', c, '', 0, { suppressErrorToast: true })
        .then(function (resp) {
            const files = firstPayloadArray(resp);
            syncAssetsMasterAttachButton(files.length > 0);
        })
        .catch(function () {
            syncAssetsMasterAttachButton(false);
        });
}

function ammEscHtmlAttr(val) {
    return String(val ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;');
}

const AMM_MONTH_TO_NUM = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

/** Normalizes API dates (ISO, dd-mm-yyyy, SQL style 106) to yyyy-mm-dd for inputs/API. */
function parsePurchaseDateToIso(val) {
    const s = String(val ?? '').trim();
    if (!s) return '';
    const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];
    const dmyMatch = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
    const monMatch = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/i);
    if (monMatch) {
        const mm = AMM_MONTH_TO_NUM[monMatch[2].toLowerCase().substring(0, 3)];
        if (mm) {
            const dd = String(monMatch[1]).padStart(2, '0');
            return `${monMatch[3]}-${mm}-${dd}`;
        }
    }
    return '';
}

function formatDisplayDatePlain(val) {
    if (val == null || val === '') return '';
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const iso = s.substring(0, 10);
        const p = iso.split('-');
        return p[2] + '-' + p[1] + '-' + p[0];
    }
    if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/i.test(s)) {
        return s;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
        return s;
    }
    return s;
}

function assetEntryDateIsoFromRow(item) {
    return parsePurchaseDateToIso(item.DateOfPurchase || item.PurchaseDate || '');
}

function ammListHasAttachmentYes(item) {
    const code = parseInt(item.Code || item.AssetsMaster_Code || 0, 10) || 0;
    if (code > 0 && Object.prototype.hasOwnProperty.call(G_AMM_ListAttachmentYesMap, code)) {
        return !!G_AMM_ListAttachmentYesMap[code];
    }
    const flag = item.HasAttach ?? item.HasAttachment ?? item.hasAttachment;
    return String(flag || '').trim().toUpperCase() === 'Y';
}

function ammSyncListAttachmentStates(rows) {
    G_AMM_ListAttachmentYesMap = {};
    const list = rows || [];
    if (!list.length) return Promise.resolve();
    const tasks = list.map(function (item) {
        const code = parseInt(item.Code || item.AssetsMaster_Code || 0, 10) || 0;
        if (code <= 0) return Promise.resolve();
        return AttachmentControlService.GetAttachmentUploadFiles('AssetsMaster', code, '', 0, { suppressErrorToast: true })
            .then(function (resp) {
                G_AMM_ListAttachmentYesMap[code] = firstPayloadArray(resp).length > 0;
            })
            .catch(function () {
                G_AMM_ListAttachmentYesMap[code] = ammListHasAttachmentYes(item);
            });
    });
    return Promise.all(tasks);
}

function buildAssetListActionHtml(code, entryDateIso, hasAttach) {
    const attachBg = hasAttach
        ? 'linear-gradient(135deg,#16a34a,#15803d)'
        : 'linear-gradient(135deg,#0ea5e9,#0284c7)';
    const dateAttr = ammEscHtmlAttr(entryDateIso);
    return (
        '<div class="text-nowrap">' +
        `<button type="button" class="amm-icon-btn view" title="View" onclick="ViewAsset(${code})"><i class="fas fa-eye"></i></button>` +
        `<button type="button" class="amm-icon-btn edit ms-1" title="Edit" onclick="EditAsset(${code})"><i class="fas fa-pen"></i></button>` +
        `<button type="button" class="amm-icon-btn del ms-1" title="Delete" onclick="DeleteAsset(${code})"><i class="fas fa-trash"></i></button>` +
        `<button type="button" class="amm-list-attach-btn ms-1" title="Attachments" style="background:${attachBg};" onclick="openAMMListAttachmentControl(${code},'${dateAttr}')"><i class="fa fa-paperclip"></i></button>` +
        '</div>'
    );
}

function mapAssetRowForGrid(item, rowIndex) {
    const code = parseInt(item.Code || item.AssetsMaster_Code || 0, 10) || 0;
    const entryDateIso = assetEntryDateIsoFromRow(item);
    const hasAttach = ammListHasAttachmentYes(item);
    return {
        Code: code,
        'S.No.': rowIndex + 1,
        'Ref No': item.RefNo || item.AssetName || '',
        'Tag No': item.AssetTagNo || '',
        'Asset Type': item.AssetType || '',
        Location: item.Location || '',
        'Date of Purchase': formatDisplayDatePlain(item.DateOfPurchase || item.PurchaseDate || ''),
        Department: item.Department || '',
        Action: buildAssetListActionHtml(code, entryDateIso, hasAttach)
    };
}

function bindAssetsMasterGridData(filteredRows) {
    const rows = filteredRows || [];
    if (!rows.length) {
        $('#table-header-AssetsMaster').empty();
        $('#table-body-AssetsMaster').html('<tr><td colspan="9" class="text-center text-muted py-4">No records found.</td></tr>');
        $('#paginator-tblAssetList').empty();
        return;
    }

    ammSyncListAttachmentStates(rows).then(function () {
        const mapped = rows.map(function (item, idx) {
            return mapAssetRowForGrid(item, idx);
        });
        const StringFilterColumn = ['Ref No', 'Tag No', 'Asset Type', 'Location', 'Department'];
        const NumericFilterColumn = [];
        const DateFilterColumn = ['Date of Purchase'];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ['Code'];
        const ColumnAlignment = {
            'S.No.': 'center;min-width:52px;white-space:nowrap;',
            'Date of Purchase': 'center;white-space:nowrap;',
            Action: 'center;min-width:168px;white-space:nowrap;'
        };

        if (typeof window.columnFilters === 'object' && window.columnFilters !== null) {
            window.columnFilters = {};
        }

        BizsolCustomFilterGrid.CreateDataTable(
            'table-header-AssetsMaster',
            'table-body-AssetsMaster',
            mapped,
            false,
            [],
            StringFilterColumn,
            NumericFilterColumn,
            DateFilterColumn,
            StringdoubleFilterColumn,
            hiddenColumns,
            ColumnAlignment,
            true,
            null,
            null
        );
    });
}

function applyAssetListSearch(rows) {
    const q = ($('#ammSearch').val() || '').trim().toLowerCase();
    const src = rows || G_AssetListRows || [];
    if (!q) return src.slice();
    return src.filter(function (row) {
        const hay = [
            row.RefNo, row.AssetName, row.AssetTagNo, row.AssetType,
            row.Location, row.Department, row.AccumulatedDep,
            row.DateOfPurchase, row.PurchaseDate
        ].join(' ').toLowerCase();
        return hay.indexOf(q) >= 0;
    });
}

function filterAssetListClientSide() {
    bindAssetsMasterGridData(applyAssetListSearch(G_AssetListRows));
}

function LoadAssetList() {
    AssetsMasterService.GetAssetsMasterList('', '').then(function (res) {
        G_AssetListRows = firstPayloadArray(res);
        filterAssetListClientSide();
    }).catch(function (err) {
        console.error('LoadAssetList', err);
        toastr.error('Failed to load assets.');
    });
}
window.LoadAssetList = LoadAssetList;

function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function formatDisplayDate(val) {
    return esc(formatDisplayDatePlain(val));
}

function LoadAssetTypeDropdown(selected) {
    return AssetsMasterService.GetAssetTypeList().then(function (res) {
        const data = firstPayloadArray(res);
        const $ddl = $('#ddlAssetType');
        $ddl.empty().append('<option value="">-- Select Asset Type --</option>');
        data.forEach(function (item) {
            const val = item.Code || 0;
            const text = item.Desp || item.AssetTypeDesp || item.TypeDesp || '';
            $ddl.append(`<option value="${val}">${esc(text)}</option>`);
        });
        if (selected) $ddl.val(String(selected));
    });
}

function LoadCurrencyDropdown(selected) {
    return AssetsMasterService.GetCurrencyList().then(function (res) {
        G_CurrencyList = firstPayloadArray(res);
        const $ddl = $('#ddlAssetCurrency');
        $ddl.empty().append('<option value="">-- Select Currency --</option>');
        G_CurrencyList.forEach(function (item) {
            const val = item.Code || 0;
            const text = item.Desp || item.Description || '';
            $ddl.append(`<option value="${val}">${esc(text)}</option>`);
        });
        if (selected) $ddl.val(String(selected));
        applyCurrencyUi();
    });
}

function LoadDepartmentDropdown(selected) {
    return AssetsMasterService.GetDepartmentList().then(function (res) {
        const data = firstPayloadArray(res);
        const $ddl = $('#ddlDepartment');
        $ddl.empty().append('<option value="">-- Select Department --</option>');
        data.forEach(function (item) {
            const val = item.Code || 0;
            const text = item.Desp || item.DepartmentName || '';
            $ddl.append(`<option value="${val}">${esc(text)}</option>`);
        });
        if (selected) $ddl.val(String(selected));
    });
}

function isNewAssetForm() {
    return (parseInt($('#hdnAssetCode').val(), 10) || 0) <= 0;
}

function clearAssetTagOnTypeChange() {
    if (G_AssetDetailMode === 'view') return;
    $('#txtAssetTagNo').val('');
}

function validateAssetValueInput(el) {
    if (!el) return;
    let v = (el.value || '').toString().replace(/,/g, '');
    v = v.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    el.value = v;
}

function isValidAssetValueField() {
    const raw = ($('#txtAssetValue').val() || '').toString().replace(/,/g, '').trim();
    if (raw === '') return true;
    return /^\d+(\.\d+)?$/.test(raw);
}

function OpenNewAsset() {
    checkAssetModuleRight('New', 'Y').then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        $('#lblAssetFormTitle').text('New Asset Master');
        ShowAssetForm(true);
        setAssetDetailFormMode('edit');
        Promise.all([
            LoadAssetTypeDropdown(),
            LoadCurrencyDropdown(),
            LoadDepartmentDropdown()
        ]).then(function () {
            $('#txtAssetTagNo').val('');
        });
    });
}
window.OpenNewAsset = OpenNewAsset;

function validateAssetForm() {
    if (!$('#txtRefNo').val().trim()) {
        toastr.warning('Please enter Ref No.');
        $('#txtRefNo').focus();
        return false;
    }
    if (!$('#ddlAssetType').val()) {
        toastr.warning('Please select Asset Type.');
        return false;
    }
    if (!isValidAssetValueField()) {
        toastr.warning('Asset Value must be a valid number (no letters).');
        $('#txtAssetValue').focus();
        return false;
    }
    const life = $('#txtAssetLife').val().trim();
    if (life !== '' && !/^\d+(\.\d+)?$/.test(life)) {
        toastr.warning('Asset Life must be a valid number (years).');
        return false;
    }
    if (!$('#ddlAssetCurrency').val()) {
        toastr.warning('Please select Currency / Unit.');
        return false;
    }
    return true;
}

function SaveAsset() {
    if (G_AssetDetailMode === 'view') return;
    if (!validateAssetForm()) return;

    const code = parseInt($('#hdnAssetCode').val(), 10) || 0;
    const payload = {
        Code: code,
        AssetsMaster_Code: code,
        RefNo: $('#txtRefNo').val().trim(),
        AssetTypeMaster_Code: parseInt($('#ddlAssetType').val(), 10) || 0,
        CurrencyMaster_Code: parseInt($('#ddlAssetCurrency').val(), 10) || 0,
        AssetTagNo: '',
        AssetLife: parseOptionalFloat($('#txtAssetLife').val()),
        Location: $('#txtLocation').val().trim(),
        DepartmentMaster_Code: parseInt($('#ddlDepartment').val(), 10) || 0,
        AssetValue: parseAssetValueNumber(),
        DateOfPurchase: $('#txtPurchaseDate').val() || null,
        ApplicableDateOfDep: $('#txtDepApplicableDate').val() || null,
        AccumulatedDep: ($('#txtAccumulatedDep').val() || '').trim()
    };

    AssetsMasterService.SaveAssetsMaster(payload).then(function (res) {
        const r = firstPayloadRow(res) || res || {};
        const ok = r.Status === 1 || r.status === 1 || r.Status === 'Y' || r.status === 'Y' || r.IsSuccess === true || r.Success === true;
        const msg = r.Msg || r.Message || r.msg || '';
        if (!ok) {
            toastr.error(msg || 'Save failed.');
            return;
        }
        const wasNew = isNewAssetForm();
        const newCode = r.Code || r.CodeOutput || r.codeOutput || r.Data || r.data || payload.AssetsMaster_Code;
        const savedCode = parseInt(newCode, 10) || payload.AssetsMaster_Code;
        const savedTag = r.AssetTagNo || r.assetTagNo || '';
        if (savedTag) $('#txtAssetTagNo').val(savedTag);
        if (savedCode > 0) {
            $('#hdnAssetCode').val(savedCode);
            refreshAssetsMasterAttachmentButton(savedCode);
            $('#btnPrintAssetQr').toggle(G_CanPrintQr);
        }
        toastr.success(msg || 'Asset saved successfully.');
        LoadAssetList();
        if (wasNew && savedCode > 0) {
            $('#lblAssetFormTitle').text('Edit Asset Master');
        }
    }).catch(function (err) {
        console.error('SaveAsset', err);
        toastr.error('Error while saving asset.');
    });
}
window.SaveAsset = SaveAsset;

function loadAssetRecord(code, mode) {
    const detailMode = mode === 'view' ? 'view' : 'edit';
    AssetsMasterService.GetAssetsMasterByCode(code).then(function (res) {
        const data = firstPayloadRow(res);
        if (!data) {
            toastr.error('Record not found.');
            return;
        }
        $('#lblAssetFormTitle').text(detailMode === 'view' ? 'View Asset Master' : 'Edit Asset Master');
        ShowAssetForm(false);
        setAssetDetailFormMode(detailMode);
        const pk = data.Code || data.AssetsMaster_Code || code;
        G_AssetVerify = String(data.Verify || data.verify || 'N').trim().toUpperCase();
        $('#hdnAssetCode').val(pk);
        $('#txtRefNo').val(data.RefNo || data.AssetName || '');
        $('#txtAssetTagNo').val(data.AssetTagNo || '');
        $('#txtAssetLife').val(data.AssetLife != null && data.AssetLife !== '' ? data.AssetLife : '');
        $('#txtLocation').val(data.Location || '');
        $('#txtAssetValue').val(data.AssetValue != null ? data.AssetValue : '');
        $('#txtPurchaseDate').val(parsePurchaseDateToIso(data.DateOfPurchase || data.PurchaseDate || ''));
        $('#txtDepApplicableDate').val(parsePurchaseDateToIso(data.ApplicableDateOfDep || data.DepApplicableDate || ''));
        $('#txtAccumulatedDep').val(data.AccumulatedDep != null ? data.AccumulatedDep : '');

        const branchLoadPromise = (G_IsMainCompany && pk > 0 && detailMode !== 'view')
            ? BranchDetailsFunction.GetTransferredBranches(AMM_BRANCH_MASTER_TABLE, pk).catch(function () { return []; })
                .then(function (codes) { ammApplyTransferredBranchState(codes, true); })
            : Promise.resolve();

        Promise.all([
            LoadAssetTypeDropdown(data.AssetTypeMaster_Code),
            LoadCurrencyDropdown(data.CurrencyMaster_Code),
            LoadDepartmentDropdown(data.DepartmentMaster_Code),
            branchLoadPromise
        ]).then(function () {
            applyCurrencyUi();
            formatAssetValueField();
            refreshAssetsMasterAttachmentButton(pk);
            setAssetDetailFormMode(detailMode);
        });
    }).catch(function (err) {
        console.error('loadAssetRecord', err);
        toastr.error('Failed to load asset.');
    });
}

function ViewAsset(code) {
    checkAssetModuleRight('View', 'Y').then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                toastr.error((response && response.Msg) || 'Permission denied.');
                return;
            }
            loadAssetRecord(code, 'view');
        });
}
window.ViewAsset = ViewAsset;

function EditAsset(code) {
    checkAssetModuleRight('Edit', 'Y').then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                toastr.error((response && response.Msg) || 'Permission denied.');
                return;
            }
            loadAssetRecord(code, 'edit');
        });
}
window.EditAsset = EditAsset;

function ammShowModal(id) {
    try {
        const el = document.getElementById(id);
        if (window.bootstrap && window.bootstrap.Modal) {
            bootstrap.Modal.getOrCreateInstance(el).show();
        } else {
            $(`#${id}`).modal('show');
        }
    } catch (e) {
        $(`#${id}`).modal('show');
    }
}

function ammHideModal(id) {
    try {
        const el = document.getElementById(id);
        if (window.bootstrap && window.bootstrap.Modal) {
            const m = bootstrap.Modal.getInstance(el);
            if (m) m.hide();
        } else {
            $(`#${id}`).modal('hide');
        }
    } catch (e) {
        $(`#${id}`).modal('hide');
    }
}

function callDeleteAssetApi(code, reason) {
    if (typeof Showloader === 'function') Showloader();
    AssetsMasterService.DeleteAssetsMaster(code, reason).then(function (res) {
        if (typeof HideLoader === 'function') HideLoader();
        const r = firstPayloadRow(res) || res || {};
        const ok = r.Status === 1 || r.status === 1 || r.Status === 'Y' || r.status === 'Y' || r.IsSuccess === true;
        if (!ok && r.Status === 'N') {
            toastr.warning(r.Msg || r.Message || 'Delete failed.');
            return;
        }
        if (ok) {
            toastr.success(r.Msg || r.Message || 'Asset deleted successfully.');
            ammHideModal('dvAMMDeleteConfirmModal');
            LoadAssetList();
        } else {
            toastr.warning(r.Msg || r.Message || 'Delete failed.');
        }
    }).catch(function (err) {
        if (typeof HideLoader === 'function') HideLoader();
        toastr.error((err && err.Msg) || 'Delete failed.');
    });
}

function DeleteAsset(code) {
    if (!code) return;
    checkAssetModuleRight('Delete', 'Y').then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        const row = (G_AssetListRows || []).find(function (x) {
            return String(x.Code || x.AssetsMaster_Code) === String(code);
        });
        const label = row
            ? (row.RefNo || row.AssetName || row.AssetTagNo || code)
            : code;
        $('#ammDelAssetName').text('"' + String(label).replace(/"/g, '') + '"');
        $('#hfAMMDeleteCode').val(code);
        $('#ammReasonForDeleteInput').val('');
        ammShowModal('dvAMMDeleteConfirmModal');
        setTimeout(function () {
            $('#ammReasonForDeleteInput').focus();
        }, 300);
    });
}
window.DeleteAsset = DeleteAsset;

function bindAssetsMasterAttachmentModalRefresh() {
    const $host = $('#AssetsMaster_AttachmentControlmodal');
    $host.find('.modal').off('hidden.bs.modal.ammAttach').on('hidden.bs.modal.ammAttach', function () {
        refreshAssetsMasterAttachmentButton($('#hdnAssetCode').val());
    });
}

function InitAttachmentControl(masterTableName, masterTableCode, detailTableName, detailTableCode, entryNo, entryDate, mode) {
    const url = `${sessionStorage.getItem('AppBaseURL')}/CustomControl/AttachmentControl`;
    $('#AssetsMaster_AttachmentControlmodal').load(url, {
        MasterTableName: masterTableName,
        MasterTableCode: parseInt(masterTableCode, 10) || 0,
        DetailTableName: detailTableName || '',
        DetailTableCode: parseInt(detailTableCode, 10) || 0,
        EntryNo: parseInt(entryNo, 10) || 0,
        EntryDate: entryDate || '',
        Mode: mode || 'all',
        SourceDownloadFileName: ''
    }, function () {
        bindAssetsMasterAttachmentModalRefresh();
    });
}

/** Master-level attachments (same pattern as Expense Entry footer). */
function openAssetsMasterAttachmentControl() {
    const masterCode = parseInt($('#hdnAssetCode').val(), 10) || 0;
    if (masterCode <= 0) {
        toastr.warning('Please save the asset first, then add attachments.');
        return;
    }
    const entryNo = masterCode;
    const entryDate = assetEntryDateForAttachmentControl();
    InitAttachmentControl('AssetsMaster', masterCode, '', 0, entryNo, entryDate, getAssetsMasterAttachmentControlMode());
}
window.openAssetsMasterAttachmentControl = openAssetsMasterAttachmentControl;
window.OpenAssetsMasterAttachment = openAssetsMasterAttachmentControl;

function openAMMListAttachmentControl(code, entryDateIso) {
    const masterCode = parseInt(code, 10) || 0;
    if (masterCode <= 0) {
        toastr.warning('Invalid record. Cannot open attachments.');
        return;
    }
    InitAttachmentControl('AssetsMaster', masterCode, '', 0, masterCode, entryDateIso || '', 'all');
}
window.openAMMListAttachmentControl = openAMMListAttachmentControl;

function PrintAssetQrCode() {
    const code = parseInt($('#hdnAssetCode').val(), 10) || 0;
    if (code <= 0) {
        toastr.warning('Save the asset first to print QR code.');
        return;
    }
    AssetsMasterService.GetPrintQrUrl(code).then(function (res) {
        const row = firstPayloadRow(res);
        const url = row ? (row.PrintUrl || row.QrPrintUrl || row.Url || '') : '';
        if (url) {
            window.open(url, '_blank');
        } else {
            toastr.info('QR print URL is not configured on the server.');
        }
    }).catch(function () {
        toastr.error('Unable to open QR print.');
    });
}
window.PrintAssetQrCode = PrintAssetQrCode;

function checkPrintQrRights() {
    checkAssetModuleRight('Print QR Code', 'N')
        .then(function (response) {
            G_CanPrintQr = response && response.CheckModuleOptionRight === 'Y';
            $('#btnPrintAssetQr').toggle(G_CanPrintQr && (parseInt($('#hdnAssetCode').val(), 10) || 0) > 0);
        })
        .catch(function () {
            G_CanPrintQr = false;
        });
}

$(document).ready(function () {
    ensureAssetsMasterHeading();
    $('#btnNewAsset').show();
    loadAmmMainCompanyFlag().then(function () {
        applyAmmBranchVerifyButtons();
    });
    checkPrintQrRights();
    LoadAssetList();

    $('#btnAMMBranchClose').on('click', function () {
        $('#ammBranchDetailsBackdrop').removeClass('show');
        G_PendingVerifyAfterBranch = false;
    });
    $('#btnAMMBranchOk').on('click', function () {
        G_SelectedBranchCodes = ammCollectBranchSelectionFromUi();
        G_BranchSelectionDirty = true;
        const selected = ammUnionBranchCodes(G_SelectedBranchCodes, G_LockedBranchCodes);
        if (G_PendingVerifyAfterBranch && !selected.length) {
            toastr.warning('Please select at least one branch for transfer.');
            return;
        }
        $('#ammBranchDetailsBackdrop').removeClass('show');
        if (G_PendingVerifyAfterBranch) {
            G_PendingVerifyAfterBranch = false;
            doVerifyAssetApi($('#hdnAssetCode').val(), selected.join(','));
        }
    });
    $('#btnAMMSelectAllBranches').on('click', function () {
        $('#ammBranchListContainer input[type="checkbox"]:not(:disabled)').prop('checked', true);
        $('#ammBranchListContainer input[type="checkbox"][data-locked="1"]').prop('checked', true);
    });
    $('#ammBranchListContainer').on('change', 'input[type="checkbox"][data-locked="1"]', function () {
        $(this).prop('checked', true);
    });

    document.addEventListener('bizsol:attachmentcontrol:changed', function (ev) {
        const d = ev && ev.detail;
        if (!d || d.tempMode) return;
        if (d.masterTableName !== 'AssetsMaster') return;
        if (!$('#ammListPanel').is(':visible')) return;
        LoadAssetList();
    });

    $('#btnNewAsset').on('click', OpenNewAsset);
    $('#btnAMMConfirmDelete').on('click', function () {
        const delCode = parseInt($('#hfAMMDeleteCode').val(), 10) || 0;
        const reason = ($('#ammReasonForDeleteInput').val() || '').trim();
        if (!reason) {
            toastr.warning('Please provide a reason for deletion.');
            $('#ammReasonForDeleteInput').focus();
            return;
        }
        if (delCode > 0) callDeleteAssetApi(delCode, reason);
    });
    $('#btnSaveAsset').on('click', SaveAsset);
    $('#btnAssetsMasterAttach').on('click', openAssetsMasterAttachmentControl);

    $('#ddlAssetCurrency').on('change', applyCurrencyUi);
    $('#txtAssetValue').on('input', function () {
        validateAssetValueInput(this);
    });
    $('#txtAssetValue').on('blur', formatAssetValueField);
    $('#txtAssetLife').on('input', function () {
        validateDecimalInput(this, true);
    });
    $('#ammSearch').on('input', filterAssetListClientSide);
    $('#ddlAssetType').on('change', clearAssetTagOnTypeChange);
});
