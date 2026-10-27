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

let G_IsMainCompany = false;
let G_AssetVerify = 'N';
let G_VerifyInProgress = false;

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

/** Read asset value for save (normalize formatted display first). */
function readAssetValueForSave() {
    formatAssetValueField();
    return parseAssetValueNumber();
}

function formatAssetValuePlain(num) {
    const n = parseFloat(num);
    if (isNaN(n)) return '';
    return n.toLocaleString('en-IN', {
        minimumFractionDigits: G_CurrencyDecimals,
        maximumFractionDigits: G_CurrencyDecimals
    });
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
    const finYear = (typeof BizSolHelperFunction.getFinancialYear === 'function')
        ? BizSolHelperFunction.getFinancialYear()
        : getAssetFinYear();
    return MenuService.CheckModuleOptionRight(AMM_MODULE_NAME, optionName, showMsg || 'Y', finYear);
}

function checkAmmRight(optionName, showMsg) {
    const show = showMsg == null ? 'Y' : showMsg;
    return checkAssetModuleRight(optionName, show)
        .then(function (response) {
            if (response && response.CheckModuleOptionRight === 'N') {
                if (show === 'Y') {
                    toastr.error(response.Msg || ('No rights for ' + optionName));
                }
                return false;
            }
            return true;
        })
        .catch(function () {
            if (show === 'Y') toastr.error('Unable to verify module rights.');
            return false;
        });
}

function checkAmmVerifyRight() {
    return checkAmmRight('Verify', 'N').then(function (hasVerify) {
        if (hasVerify) return true;
        return checkAmmRight('Edit', 'N');
    });
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
}

function ammClearBranchFormState() {
    G_AssetVerify = 'N';
}

function isAmmRecordVerified(item) {
    if (!item) return false;
    const v = item.Verify != null ? item.Verify : item.verify;
    return String(v || 'N').trim().toUpperCase() === 'Y';
}

function findAssetListRowByCode(code) {
    const pk = parseInt(code, 10) || 0;
    return (G_AssetListRows || []).find(function (x) {
        return parseInt(x.Code || x.AssetsMaster_Code, 10) === pk;
    });
}

function formatAmmAjaxError(err, fallback) {
    let detail = fallback || 'Request failed.';
    if (err && err.xhr) {
        const xhr = err.xhr;
        const rt = xhr.responseText ? String(xhr.responseText).trim() : '';
        if (rt) {
            if (rt.indexOf('{') === 0) {
                try {
                    const parsed = JSON.parse(rt);
                    detail = parsed.Msg || parsed.msg || parsed.title || parsed.message || rt;
                } catch (e) {
                    detail = rt;
                }
            } else {
                detail = rt;
            }
        } else if (xhr.status) {
            detail = 'HTTP ' + xhr.status + (xhr.statusText ? (' ' + xhr.statusText) : '');
        }
    } else if (err && err.message && err.message.indexOf('error:') !== 0) {
        detail = err.message;
    }
    return detail;
}

function isAmmApiStatusYes(response) {
    if (!response) return false;
    const row = firstPayloadRow(response) || response;
    const status = row.Status != null ? row.Status : row.status;
    return String(status || '').trim().toUpperCase() === 'Y';
}

function getAmmApiMessage(response, fallback) {
    if (!response) return fallback || '';
    const row = firstPayloadRow(response) || response;
    return (row.Msg != null ? row.Msg : row.msg) || fallback || '';
}

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

function VerifyAssetFromList(code) {
    const recordCode = parseInt(code, 10) || 0;
    if (recordCode <= 0) {
        toastr.error('Invalid record. Refresh the list and try again.');
        return;
    }
    if (!G_IsMainCompany) {
        toastr.warning('Verify is available only from the Main Company.');
        return;
    }
    if (G_VerifyInProgress) return;
    const row = findAssetListRowByCode(recordCode);
    if (row && isAmmRecordVerified(row)) {
        toastr.info('This asset is already verified.');
        return;
    }
    checkAmmVerifyRight().then(function (ok) {
        if (!ok) return;
        G_VerifyInProgress = true;
        AssetsMasterService.VerifyAssetsMaster(recordCode).then(function (res) {
            if (isAmmApiStatusYes(res)) {
                toastr.success(getAmmApiMessage(res, 'Verified and transferred to all branch companies successfully.'));
                LoadAssetList();
            } else {
                toastr.warning(getAmmApiMessage(res, 'Verification failed.'));
            }
        }).catch(function (err) {
            toastr.error(formatAmmAjaxError(err, 'Error during verification.'));
        }).finally(function () {
            G_VerifyInProgress = false;
        });
    });
}
window.VerifyAssetFromList = VerifyAssetFromList;

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

function buildAssetListActionHtml(code, entryDateIso, hasAttach, item) {
    const attachBg = hasAttach
        ? 'linear-gradient(135deg,#16a34a,#15803d)'
        : 'linear-gradient(135deg,#0ea5e9,#0284c7)';
    const dateAttr = ammEscHtmlAttr(entryDateIso);
    let verifyBtn = '';
    if (G_IsMainCompany && !isAmmRecordVerified(item)) {
        verifyBtn = `<button type="button" class="amm-icon-btn verify ms-1" title="Verify and transfer to all branches" onclick="VerifyAssetFromList(${code})"><i class="fas fa-check"></i></button>`;
    } else if (isAmmRecordVerified(item)) {
        verifyBtn = `<button type="button" class="amm-icon-btn verified ms-1" title="Verified and transferred" disabled><i class="fas fa-check"></i></button>`;
    }
    return (
        '<div class="text-nowrap">' +
        `<button type="button" class="amm-icon-btn view" title="View" onclick="ViewAsset(${code})"><i class="fas fa-eye"></i></button>` +
        `<button type="button" class="amm-icon-btn edit ms-1" title="Edit" onclick="EditAsset(${code})"><i class="fas fa-pen"></i></button>` +
        `<button type="button" class="amm-icon-btn del ms-1" title="Delete" onclick="DeleteAsset(${code})"><i class="fas fa-trash"></i></button>` +
        verifyBtn +
        `<button type="button" class="amm-icon-btn preview ms-1" title="Print Preview" onclick="PrintAssetQrCode(${code},'preview')"><i class="fa fa-search-plus"></i></button>` +
        `<button type="button" class="amm-icon-btn print ms-1" title="Print QR" onclick="PrintAssetQrCode(${code},'print')"><i class="fa fa-print"></i></button>` +
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
        'Asset Value': formatAssetValuePlain(item.AssetValue),
        Department: item.Department || '',
        Verify: item.Verify != null ? item.Verify : (item.verify != null ? item.verify : 'N'),
        Action: buildAssetListActionHtml(code, entryDateIso, hasAttach, item)
    };
}

function bindAssetsMasterGridData(filteredRows) {
    const rows = filteredRows || [];
    if (!rows.length) {
        $('#table-header-AssetsMaster').empty();
        $('#table-body-AssetsMaster').html('<tr><td colspan="10" class="text-center text-muted py-4">No records found.</td></tr>');
        $('#paginator-tblAssetList').empty();
        return;
    }

    ammSyncListAttachmentStates(rows).then(function () {
        const mapped = rows.map(function (item, idx) {
            return mapAssetRowForGrid(item, idx);
        });
        const StringFilterColumn = ['Ref No', 'Tag No', 'Asset Type', 'Location', 'Department'];
        const NumericFilterColumn = ['Asset Value'];
        const DateFilterColumn = ['Date of Purchase'];
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ['Code', 'Verify'];
        const ColumnAlignment = {
            'S.No.': 'center;min-width:52px;white-space:nowrap;',
            'Date of Purchase': 'center;white-space:nowrap;',
            'Asset Value': 'right;white-space:nowrap;min-width:100px;',
            Action: 'center;min-width:260px;white-space:nowrap;'
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
            row.Location, row.Department, row.AssetValue, row.AccumulatedDep,
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
    const refNo = $('#txtRefNo').val().trim();
    const purchaseDate = $('#txtPurchaseDate').val() || '';
    const depDate = $('#txtDepApplicableDate').val() || '';
    // TY_AssetsMaster — column names must match SQL user-defined table type
    const Details = [{
        Code: code,
        AssetsMaster_Code: code,
        RefNo: refNo,
        AssetName: refNo,
        AssetTypeMaster_Code: parseInt($('#ddlAssetType').val(), 10) || 0,
        View_UnitOfAssets_Code: 0,
        CurrencyMaster_Code: parseInt($('#ddlAssetCurrency').val(), 10) || 0,
        AssetsDays: 0,
        DepPercentage: 0,
        ITDespvalue: 0,
        DatabaseLocation_Code: 0,
        AssetTagNo: ($('#txtAssetTagNo').val() || '').trim(),
        AssetLife: parseOptionalFloat($('#txtAssetLife').val()) || 0,
        Location: $('#txtLocation').val().trim(),
        DepartmentMaster_Code: parseInt($('#ddlDepartment').val(), 10) || 0,
        AssetValue: readAssetValueForSave(),
        DateOfPurchase: purchaseDate,
        PurchaseDate: purchaseDate,
        ApplicableDateOfDep: depDate,
        DepApplicableDate: depDate,
        AccumulatedDep: ($('#txtAccumulatedDep').val() || '').trim()
    }];
    const payload = { Code: code, Details: Details };

    AssetsMasterService.SaveAssetsMaster(payload).then(function (res) {
        const r = firstPayloadRow(res) || res || {};
        const ok = r.Status === 1 || r.status === 1 || r.Status === 'Y' || r.status === 'Y' || r.IsSuccess === true || r.Success === true;
        const msg = r.Msg || r.Message || r.msg || '';
        if (!ok) {
            toastr.error(msg || 'Save failed.');
            return;
        }
        const newCode = r.Code || r.CodeOutput || r.codeOutput || r.Data || r.data || payload.AssetsMaster_Code;
        const savedCode = parseInt(newCode, 10) || payload.AssetsMaster_Code;
        const savedTag = r.AssetTagNo || r.assetTagNo || '';
        if (savedTag) $('#txtAssetTagNo').val(savedTag);
        if (savedCode > 0) {
            $('#hdnAssetCode').val(savedCode);
            refreshAssetsMasterAttachmentButton(savedCode);
        }
        toastr.success(msg || 'Asset saved successfully.');
        ShowAssetList();
        LoadAssetList();
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
        const pk = parseInt(data.Code || data.AssetsMaster_Code || code, 10) || 0;
        G_AssetVerify = String(data.Verify || data.verify || 'N').trim().toUpperCase();
        $('#hdnAssetCode').val(pk);
        $('#txtRefNo').val(data.RefNo || data.AssetName || '');
        $('#txtAssetTagNo').val(data.AssetTagNo || data.assetTagNo || '');
        ShowAssetForm(false);
        $('#txtAssetLife').val(data.AssetLife != null && data.AssetLife !== '' ? data.AssetLife : '');
        $('#txtLocation').val(data.Location || '');
        const assetValRaw = data.AssetValue != null ? data.AssetValue : (data.assetValue != null ? data.assetValue : '');
        $('#txtAssetValue').val(assetValRaw !== '' && assetValRaw != null ? String(assetValRaw) : '');
        $('#txtPurchaseDate').val(parsePurchaseDateToIso(data.DateOfPurchase || data.PurchaseDate || ''));
        $('#txtDepApplicableDate').val(parsePurchaseDateToIso(data.ApplicableDateOfDep || data.DepApplicableDate || ''));
        $('#txtAccumulatedDep').val(data.AccumulatedDep != null ? data.AccumulatedDep : '');

        Promise.all([
            LoadAssetTypeDropdown(data.AssetTypeMaster_Code),
            LoadCurrencyDropdown(data.CurrencyMaster_Code),
            LoadDepartmentDropdown(data.DepartmentMaster_Code)
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

function getAmmPrintUserName() {
    try {
        const auth = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        return (auth.UserName || auth.UserDesp || auth.EmployeeName || auth.Name || auth.UserMaster_Code || '').toString().trim();
    } catch (e) {
        return '';
    }
}

function formatAmmPrintDate(d) {
    const dt = d || new Date();
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return dd + '-' + mm + '-' + yyyy;
}

function buildAssetQrLabelModel(apiRow, formFallback) {
    const row = apiRow || {};
    const fb = formFallback || {};
    const tag = (row.AssetTagNo || row.assetTagNo || fb.tag || '').trim();
    const assetName = (row.RefNo || row.AssetName || row.assetName || fb.refNo || '').trim();
    const assetType = (row.AssetType || row.assetType || fb.assetType || '').trim();
    const location = (row.Location || row.location || fb.location || '').trim();
    const printByApi = (row.PrintBy || row.printBy || row.UserName || row.userName || '').toString().trim();
    const printDateApi = (row.PrintDate || row.printDate || '').toString().trim();
    return {
        tag: tag,
        assetName: assetName.toUpperCase(),
        assetType: assetType.toUpperCase(),
        location: location.toUpperCase(),
        printDate: printDateApi || formatAmmPrintDate(new Date()),
        printBy: printByApi || getAmmPrintUserName()
    };
}

/** 7cm × 4cm asset tag — print preview layout (reference label mockup). */
function openAssetQrPrintWindow(labelModel, printUrl, mode) {
    const printMode = (mode || 'preview').toLowerCase() === 'print' ? 'print' : 'preview';
    if (printUrl) {
        window.open(printUrl, '_blank');
        return;
    }
    const m = labelModel || {};
    const tag = (m.tag || '').trim();
    if (!tag) {
        toastr.warning('Asset Tag No is required to print QR code.');
        return;
    }
    const qrImg = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=' + encodeURIComponent(tag);
    const w = window.open('', '_blank', 'width=420,height=320');
    if (!w) {
        toastr.warning('Allow pop-ups to print or preview the QR label.');
        return;
    }
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
        '<title>Asset Tag ' + esc(tag) + '</title>' +
        '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />' +
        '<style>' +
        '@page { size: 7cm 4cm; margin: 0; }' +
        '* { box-sizing: border-box; }' +
        'html, body { margin: 0; padding: 0; background: #e2e8f0; }' +
        'body { display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh; }' +
        '.amm-qr-toolbar { display: flex; gap: 8px; padding: 8px 10px; background: #fff; position: sticky; top: 0; z-index: 20; }' +
        '.amm-qr-toolbar button { border: none; border-radius: 999px; padding: 7px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }' +
        '.amm-qr-btn-print { background: #1f2937; color: #fff; }' +
        '.amm-qr-btn-close { background: #e5e7eb; color: #111827; }' +
        '.amm-qr-stage { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px 8px; }' +
        '.amm-qr-label { width: 7cm; height: 4cm; background: #fff; border: 1px solid #334155; border-radius: 5px; ' +
        'display: flex; flex-direction: column; overflow: hidden; color: #0f172a; font-family: Segoe UI, Arial, sans-serif; }' +
        '.amm-qr-logo-bar { display: flex; align-items: stretch; min-height: 7.4mm; background: #0f2744; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
        '.amm-qr-logo-wrap { display: flex; align-items: center; background: #fff; padding: 0.6mm 1.6mm; }' +
        '.amm-qr-logo-wrap img { height: 5.6mm; width: auto; max-width: 26mm; object-fit: contain; display: block; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
        '.amm-qr-header-title { flex: 1; display: flex; align-items: center; justify-content: center; gap: 1.6mm; color: #fff; font-size: 8.5pt; font-weight: 800; letter-spacing: 0.08em; white-space: nowrap; }' +
        '.amm-qr-header-title i { font-size: 9pt; }' +
        '.amm-qr-body { flex: 1; display: flex; min-height: 0; border-bottom: 1px solid #94a3b8; }' +
        '.amm-qr-left { flex: 1; padding: 2.2mm 2mm; border-right: 1px solid #94a3b8; display: flex; flex-direction: column; justify-content: space-between; }' +
        '.amm-qr-row { display: flex; align-items: flex-start; gap: 1.2mm; line-height: 1.15; }' +
        '.amm-qr-row i { color: #475569; font-size: 7pt; width: 3.2mm; margin-top: 0.3mm; flex-shrink: 0; }' +
        '.amm-qr-lbl { font-size: 5pt; color: #64748b; margin: 0; }' +
        '.amm-qr-val { font-size: 6pt; font-weight: 700; margin: 0; word-break: break-word; }' +
        '.amm-qr-right { width: 23mm; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1mm; }' +
        '.amm-qr-right img { width: 17mm; height: 17mm; display: block; }' +
        '.amm-qr-tag { font-size: 5.5pt; font-weight: 700; margin-top: 0.6mm; text-align: center; word-break: break-all; }' +
        '.amm-qr-foot { display: flex; align-items: center; justify-content: space-between; padding: 0.7mm 2mm; font-size: 5pt; color: #64748b; }' +
        '.amm-qr-foot span { display: inline-flex; align-items: center; gap: 1mm; }' +
        '.amm-qr-foot i { font-size: 6pt; }' +
        '.amm-qr-foot b { color: #0f172a; font-weight: 700; }' +
        '.amm-qr-sep { margin: 0 2mm; color: #94a3b8; }' +
        '@media print { html, body { background: #fff; min-height: 0; } .amm-qr-toolbar, .no-print { display: none !important; } .amm-qr-stage { padding: 0; } .amm-qr-label { margin: 0; border-radius: 0; } }' +
        '</style></head><body>' +
        '<div class="amm-qr-toolbar no-print">' +
        '<button type="button" class="amm-qr-btn-print" onclick="window.print()"><i class="fa-solid fa-print"></i> Print</button>' +
        '<button type="button" class="amm-qr-btn-close" onclick="ammCloseQrPreview()"><i class="fa-solid fa-xmark"></i> Close</button>' +
        '</div>' +
        '<div class="amm-qr-stage"><div class="amm-qr-label">' +
        '<div class="amm-qr-logo-bar">' +
        '<div class="amm-qr-logo-wrap"><img src="https://www.ite-oman.com/images/ite-new-logo.png" alt="ITE" /></div>' +
        '<div class="amm-qr-header-title"><i class="fa-solid fa-cube"></i> ASSET QR</div>' +
        '</div>' +
        '<div class="amm-qr-body">' +
        '<div class="amm-qr-left">' +
        '<div class="amm-qr-row"><i class="fa-solid fa-box"></i><div><p class="amm-qr-lbl">Asset Name</p><p class="amm-qr-val">' + esc(m.assetName || '—') + '</p></div></div>' +
        '<div class="amm-qr-row"><i class="fa-solid fa-tag"></i><div><p class="amm-qr-lbl">Tag No.</p><p class="amm-qr-val">' + esc(tag) + '</p></div></div>' +
        '<div class="amm-qr-row"><i class="fa-solid fa-sitemap"></i><div><p class="amm-qr-lbl">Asset Type</p><p class="amm-qr-val">' + esc(m.assetType || '—') + '</p></div></div>' +
        '<div class="amm-qr-row"><i class="fa-solid fa-location-dot"></i><div><p class="amm-qr-lbl">Location</p><p class="amm-qr-val">' + esc(m.location || '—') + '</p></div></div>' +
        '</div>' +
        '<div class="amm-qr-right"><img src="' + qrImg + '" alt="QR" /><div class="amm-qr-tag">' + esc(tag) + '</div></div>' +
        '</div>' +
        '<div class="amm-qr-foot">' +
        '<span><i class="fa-solid fa-print"></i> Print Date <b>' + esc(m.printDate) + '</b></span>' +
        '<span class="amm-qr-sep">|</span>' +
        '<span><i class="fa-solid fa-user"></i> Print By <b>' + esc(m.printBy || '—') + '</b></span>' +
        '</div></div></div>' +
        '<script>' +
        'function ammCloseQrPreview(){' +
        'if(window.opener){window.close();return;}' +
        'if(history.length>1){history.back();return;}' +
        'window.close();' +
        '}' +
        'window.onload=function(){window.focus();' +
        (printMode === 'print' ? 'setTimeout(function(){window.print();},400);' : '') +
        '};' +
        '<\/script></body></html>';
    w.document.open();
    w.document.write(html);
    w.document.close();
}

function getAssetQrFormFallback() {
    const typeText = ($('#ddlAssetType option:selected').text() || '').trim();
    return {
        tag: ($('#txtAssetTagNo').val() || '').trim(),
        refNo: ($('#txtRefNo').val() || '').trim(),
        assetType: typeText === '-- Select Asset Type --' ? '' : typeText,
        location: ($('#txtLocation').val() || '').trim()
    };
}

function getAssetQrListFallback(code) {
    const row = (G_AssetListRows || []).find(function (x) {
        return parseInt(x.Code || x.AssetsMaster_Code, 10) === parseInt(code, 10);
    }) || {};
    return {
        tag: (row.AssetTagNo || '').toString().trim(),
        refNo: (row.RefNo || row.AssetName || '').toString().trim(),
        assetType: (row.AssetType || '').toString().trim(),
        location: (row.Location || '').toString().trim()
    };
}

/** List Action: PrintAssetQrCode(code, 'preview' | 'print') — rights like New/Edit. */
function PrintAssetQrCode(code, mode) {
    const recordCode = parseInt(code, 10) || parseInt($('#hdnAssetCode').val(), 10) || 0;
    const printMode = (mode || 'preview').toLowerCase() === 'print' ? 'print' : 'preview';
    const optionName = printMode === 'print' ? 'Print' : 'Preview';
    if (recordCode <= 0) {
        toastr.warning('Invalid record. Refresh the list and try again.');
        return;
    }

    const runPrint = function () {
        const listFb = getAssetQrListFallback(recordCode);
        const formFb = getAssetQrFormFallback();
        const fb = {
            tag: listFb.tag || formFb.tag,
            refNo: listFb.refNo || formFb.refNo,
            assetType: listFb.assetType || formFb.assetType,
            location: listFb.location || formFb.location
        };
        AssetsMasterService.GetPrintQrUrl(recordCode).then(function (res) {
            const row = firstPayloadRow(res) || {};
            const url = (row.PrintUrl || row.QrPrintUrl || row.Url || '').trim();
            const label = buildAssetQrLabelModel(row, fb);
            if (!label.tag) label.tag = fb.tag;
            if (!label.assetName) label.assetName = (fb.refNo || '').toUpperCase();
            if (!label.tag) {
                toastr.warning('Asset Tag No is not generated yet.');
                return;
            }
            openAssetQrPrintWindow(label, url, printMode);
        }).catch(function () {
            if (!fb.tag) {
                toastr.warning('Asset Tag No is not generated yet.');
                return;
            }
            openAssetQrPrintWindow(buildAssetQrLabelModel({}, fb), '', printMode);
        });
    };

    checkAssetModuleRight(optionName, 'Y').then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            toastr.error((response && response.Msg) || ('Permission denied for ' + optionName + '.'));
            return;
        }
        runPrint();
    });
}
window.PrintAssetQrCode = PrintAssetQrCode;

function checkPrintQrRights() {
    const names = ['Print', 'Print QR', 'PrintQR'];
    let chain = Promise.resolve(false);
    names.forEach(function (name) {
        chain = chain.then(function (found) {
            if (found) return true;
            return checkAssetModuleRight(name, 'N').then(function (response) {
                if (response && response.CheckModuleOptionRight === 'Y') {
                    G_CanPrintQr = true;
                    return true;
                }
                return false;
            }).catch(function () { return false; });
        });
    });
}

$(document).ready(function () {
    ensureAssetsMasterHeading();
    $('#btnNewAsset').show();
    checkPrintQrRights();
    loadAmmMainCompanyFlag().finally(function () {
        LoadAssetList();
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
