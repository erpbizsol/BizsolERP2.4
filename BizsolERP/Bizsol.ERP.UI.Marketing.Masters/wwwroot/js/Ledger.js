import { VendorMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VendorMasterService.js';
import { TransporterMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/TransporterMasterService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';

var G_VendorVerifyCode = 0;
let G_ModuleName = 'Ledger Master';
window.G_VendorHasVerifyRight = false;
/** From GetFixedParameterDetails; both must be Y (with menu Verify right) for Ledger stats + Verify column. */
window.G_PartyVerificationBeforeOrderY = false;
window.G_AllowVerifyInLedgerGroupY = false;

function syncLedgerModuleContextFromHeading() {
    var raw = ($('#ERPHeading').text() || '').trim();
    G_ModuleName = raw || 'Ledger Master';
}

function parseFixedParamFlagY(row, pascalKey, camelKey) {
    if (!row || typeof row !== 'object') return false;
    var v = row[pascalKey];
    if (v === undefined || v === null) v = row[camelKey];
    if (v === undefined || v === null) return false;
    var s = String(v).trim().toUpperCase();
    return s === 'Y' || s === 'YES' || s === '1';
}

/** Read PartyVerificationBeforeOrder and AllowVerifyInLedgerGroup from GetFixedParameterDetails. */
function applyLedgerFixedParameterFlags(res) {
    var row = null;
    if (Array.isArray(res) && res.length > 0) row = res[0];
    else if (res && Array.isArray(res.data) && res.data.length > 0) row = res.data[0];
    else if (res && Array.isArray(res.Data) && res.Data.length > 0) row = res.Data[0];
    else if (res && typeof res === 'object' && !Array.isArray(res)) row = res;
    window.G_PartyVerificationBeforeOrderY = parseFixedParamFlagY(
        row,
        'PartyVerificationBeforeOrder',
        'partyVerificationBeforeOrder'
    );
    window.G_AllowVerifyInLedgerGroupY = parseFixedParamFlagY(
        row,
        'AllowVerifyInLedgerGroup',
        'allowVerifyInLedgerGroup'
    );
}

/** Stats strip + verify filtering only when both fixed-parameter flags are Y. */
function isLedgerVerificationUiEnabled() {
    return !!(window.G_PartyVerificationBeforeOrderY && window.G_AllowVerifyInLedgerGroupY);
}

function applyLedgerPartyVerificationUi() {
    var show = isLedgerVerificationUiEnabled();
    var $strip = $('#ledgerStatsStrip');
    if ($strip.length) {
        if (show) {
            $strip.show();
        } else {
            $strip.hide();
            window.G_VendorStatFilter = 'all';
        }
    }
}

function shouldShowLedgerVerifyColumn() {
    return !!(isLedgerVerificationUiEnabled() && window.G_VendorHasVerifyRight);
}

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    syncLedgerModuleContextFromHeading();
    window.G_PartyVerificationBeforeOrderY = false;
    window.G_AllowVerifyInLedgerGroupY = false;

    VendorMasterService.GetFixedParameterDetails()
        .then(function (res) {
            applyLedgerFixedParameterFlags(res);
        })
        .catch(function () {
            window.G_PartyVerificationBeforeOrderY = false;
            window.G_AllowVerifyInLedgerGroupY = false;
        })
        .finally(function () {
            applyLedgerPartyVerificationUi();
            resolveVendorVerifyRight().then(function () {
                GetLedgerMasterList();
            });
        });

    $('#vmBtnCancelVerify').on('click', CloseVendorVerifyModal);

    $(document).on('click', '.vm-stat-chip[data-vm-filter]', function () {
        var mode = $(this).attr('data-vm-filter');
        window.G_VendorStatFilter = mode;
        if (window.G_VendorMasterSourceRows && window.G_VendorMasterSourceRows.length > 0) {
            refreshVendorMasterGrid();
        }
    });
    $(document).on('keydown', '.vm-stat-chip[data-vm-filter]', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $(this).trigger('click');
        }
    });

    $(document).on('click', '.vm-verify-status--done[data-vm-verify-info]', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showVendorVerifyDetailFromBadge(this);
    });
    $(document).on('keydown', '.vm-verify-status--done[data-vm-verify-info]', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showVendorVerifyDetailFromBadge(this);
        }
    });

    $(window).on('load', function () {
        syncLedgerModuleContextFromHeading();
    });
});

function rowIsVerified(item) {
    var v = item && item.Verified;
    if (v === undefined || v === null) return false;
    if (typeof v === 'string') {
        var u = v.toUpperCase();
        return u === 'Y' || u === 'YES' || v === '1';
    }
    return v === true || v === 1;
}

function escapeVendorAttr(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function getVendorVerifiedByDisplay(item) {
    if (!item) return '';
    var v =
        item.VerifiedByName ||
        item.VerifiedByDesp ||
        item.VerifiedBy ||
        item['Verify By'] ||
        item['Verified By'] ||
        item.UserVerifiedBy;
    if (v === undefined || v === null || v === '') return '';
    if (typeof v === 'number' && v === 0) return '';
    return String(v).trim();
}

function getVendorVerifiedOnRaw(item) {
    if (!item) return null;
    var d =
        item.VerifiedON !== undefined && item.VerifiedON !== null
            ? item.VerifiedON
            : item.VerifiedOn !== undefined && item.VerifiedOn !== null
              ? item.VerifiedOn
              : item['Verified ON'] !== undefined && item['Verified ON'] !== null
                ? item['Verified ON']
                : item['Verified On'];
    return d === undefined ? null : d;
}

function pad2VendorDate(n) {
    return n < 10 ? '0' + n : String(n);
}

function formatDateDdMmYyyy(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return '';
    return pad2VendorDate(d.getDate()) + '/' + pad2VendorDate(d.getMonth() + 1) + '/' + d.getFullYear();
}

function formatVendorVerifiedOnDisplay(val) {
    if (val === null || val === undefined || val === '') return '';
    if (typeof val === 'number' && isFinite(val)) {
        return formatDateDdMmYyyy(new Date(val));
    }
    if (typeof val === 'string') {
        var t = val.trim();
        if (!t) return '';
        var parsed = Date.parse(t);
        if (!isNaN(parsed)) return formatDateDdMmYyyy(new Date(parsed));
        return t;
    }
    if (val instanceof Date) return formatDateDdMmYyyy(val);
    return String(val);
}

function showVendorVerifyDetailFromBadge(el) {
    var enc = el.getAttribute('data-vm-verify-info');
    if (!enc) return;
    var txt = decodeURIComponent(enc);
    var oneLine = txt.replace(/\s*\n+\s*/g, ' · ');
    if (typeof toastr !== 'undefined') {
        toastr.info(oneLine, 'Verification', { timeOut: 5500 });
    } else {
        window.alert(txt);
    }
}

function buildVerifiedBadgeHtml(item) {
    var by = getVendorVerifiedByDisplay(item);
    var on = formatVendorVerifiedOnDisplay(getVendorVerifiedOnRaw(item));
    var parts = [];
    if (by) parts.push('Verify By: ' + by);
    if (on) parts.push('Verified ON: ' + on);
    var titleAttr = parts.length ? ' title="' + escapeVendorAttr(parts.join(' · ')) + '"' : '';
    var dataAttr = '';
    var a11y = '';
    var extraClass = '';
    if (parts.length) {
        extraClass = ' vm-verify-status--with-detail';
        dataAttr = ' data-vm-verify-info="' + encodeURIComponent(parts.join('\n')) + '"';
        a11y =
            ' role="button" tabindex="0" aria-label="' +
            escapeVendorAttr(parts.join('. ')) +
            '"';
    }
    return (
        '<span class="vm-verify-status vm-verify-status--done' +
        extraClass +
        '"' +
        titleAttr +
        dataAttr +
        a11y +
        '>Verified</span>'
    );
}

function updateVendorMasterStats(rows) {
    var list = Array.isArray(rows) ? rows : [];
    var total = list.length;
    var verified = 0;
    for (var i = 0; i < list.length; i++) {
        if (rowIsVerified(list[i])) verified++;
    }
    var pending = total - verified;
    $('#vmStatTotal').text(total);
    $('#vmStatVerified').text(verified);
    $('#vmStatPending').text(pending);
}

function resolveVendorVerifyRight() {
    var FinYear = getFinancialYear();
    return MenuService.CheckModuleOptionRight(G_ModuleName, 'Verify', 'N', FinYear)
        .then(function (response) {
            window.G_VendorHasVerifyRight = response && response.CheckModuleOptionRight === 'Y';
        })
        .catch(function () {
            window.G_VendorHasVerifyRight = false;
        });
}

window.G_VendorMasterSourceRows = window.G_VendorMasterSourceRows || [];
window.G_VendorStatFilter = window.G_VendorStatFilter || 'all';

function filterVendorRowsByStat(rows, mode) {
    var list = Array.isArray(rows) ? rows : [];
    if (!isLedgerVerificationUiEnabled()) return list.slice();
    if (mode === 'verified') return list.filter(function (r) { return rowIsVerified(r); });
    if (mode === 'pending') return list.filter(function (r) { return !rowIsVerified(r); });
    return list.slice();
}

function mapVendorRowsToGrid(rows) {
    return rows.map(function (item) {
        var verifyCell = '';
        if (shouldShowLedgerVerifyColumn()) {
            verifyCell = rowIsVerified(item)
                ? buildVerifiedBadgeHtml(item)
                : '<button type="button" class="vm-btn-verify" onclick="VerifyVendor(' +
                  item.Code +
                  ')"><i class="fas fa-check"></i></button>';
        }
        var patch = {};
        if (shouldShowLedgerVerifyColumn()) patch.Verify = verifyCell;
        return Object.assign({}, item, patch);
    });
}

function getVendorMasterHiddenColumns() {
    var cols = [
        'Code',
        'Short Code',
        'Category',
        'Active',
        'PAN No',
        'Verified',
        'CityMaster_Code',
        'StateMaster_Code',
        'CountryMaster_Code',
        'VerifiedBy',
        'VerifiedByName',
        'VerifiedByDesp',
        'VerifiedON',
        'VerifiedOn',
        'Verify By',
        'Verified By',
        'Verified ON',
        'Verified On',
    ];
    if (!isLedgerVerificationUiEnabled()) {
        cols.push('Verify');
    }
    return cols;
}

function getVendorMasterColumnAlignment() {
    var ca = {};
    if (shouldShowLedgerVerifyColumn()) {
        ca.Verify = 'center;min-width:96px;white-space:nowrap;';
    }
    return ca;
}

function syncVendorStatChipClasses() {
    if (!isLedgerVerificationUiEnabled()) return;
    var mode = window.G_VendorStatFilter || 'all';
    $('#ledgerStatsStrip .vm-stat-chip[data-vm-filter]')
        .removeClass('vm-stat-chip--active')
        .attr('aria-pressed', 'false');
    $('#ledgerStatsStrip .vm-stat-chip[data-vm-filter="' + mode + '"]')
        .addClass('vm-stat-chip--active')
        .attr('aria-pressed', 'true');
}

function refreshVendorMasterGrid() {
    var source = window.G_VendorMasterSourceRows || [];
    var mode = window.G_VendorStatFilter || 'all';
    if (source.length === 0) return;

    var filtered = filterVendorRowsByStat(source, mode);
    var mapped = mapVendorRowsToGrid(filtered);

    const StringFilterColumn = ['Account Name', 'GSTN No', 'Phone', 'Email', 'City', 'State', 'Country', 'Pin Code'];
    const NumericFilterColumn = [];
    const DateFilterColumn = [];
    const Button = false;
    const showButtons = [];
    const StringdoubleFilterColumn = [];
    const hiddenColumns = getVendorMasterHiddenColumns();
    const ColumnAlignment = getVendorMasterColumnAlignment();

    if (typeof window.columnFilters === 'object' && window.columnFilters !== null) {
        window.columnFilters = {};
    }

    if (mapped.length === 0) {
        window.filteredData_VendorMaster = [];
        window.filteredDataTemp_VendorMaster = [];
        window.currentPage_VendorMaster = 1;
        var colCount = $('#VendorMaster-header th:visible').length;
        if (!colCount) colCount = 1;
        $('#VendorMaster-body').html(
            '<tr><td colspan="' +
                colCount +
                '" style="text-align:center;padding:28px;color:#6b7280;">No data found</td></tr>'
        );
        $('#VendorMaster-header').find('th span.filter-table-heading .fa-filter').remove();
        if (typeof window.updatePageInfo === 'function') window.updatePageInfo('VendorMaster');
        if (typeof window.updateButtons === 'function') window.updateButtons('VendorMaster');
        if (typeof window.updateFilteredClass === 'function') window.updateFilteredClass('VendorMaster-body');
        syncVendorStatChipClasses();
        return;
    }

    BizsolCustomFilterGrid.CreateDataTable(
        'VendorMaster-header',
        'VendorMaster-body',
        mapped,
        Button,
        showButtons,
        StringFilterColumn,
        NumericFilterColumn,
        DateFilterColumn,
        StringdoubleFilterColumn,
        hiddenColumns,
        ColumnAlignment
    );
    syncVendorStatChipClasses();
}

function GetLedgerMasterList() {
    TransporterMasterService.GetSolarTransporterMasterList('A')
        .then(function (response) {
            var rows = [];
            if (Array.isArray(response)) rows = response;
            else if (Array.isArray(response.data)) rows = response.data;
            else if (Array.isArray(response.Data)) rows = response.Data;

            updateVendorMasterStats(rows);
            window.G_VendorMasterSourceRows = rows;
            window.G_VendorStatFilter = 'all';

            if (rows.length > 0) {
                $('#tblVendorMaster').show();
                refreshVendorMasterGrid();
            } else {
                toastr.warning('No ledger records found.');
                $('#tblVendorMaster').hide();
            }
        })
        .catch(function () {
            updateVendorMasterStats([]);
            window.G_VendorMasterSourceRows = [];
            toastr.error('Failed to load ledger list.');
        });
}

function VerifyVendor(code) {
    if (!isLedgerVerificationUiEnabled()) {
        toastr.warning(
            'Ledger verification is not enabled (fixed parameters: PartyVerificationBeforeOrder and AllowVerifyInLedgerGroup must be Y).'
        );
        return;
    }
    if (!window.G_VendorHasVerifyRight) {
        toastr.warning('You do not have Verify permission.');
        return;
    }
    G_VendorVerifyCode = code;
    $('#vmVerifyConfirmTitle').text('Verify this ledger?');
    $('#vmVerifyConfirmText').text('This will mark the ledger as verified.');
    $('#vmVerifyConfirmBackdrop').addClass('show');
}

function CloseVendorVerifyModal() {
    G_VendorVerifyCode = 0;
    $('#vmVerifyConfirmBackdrop').removeClass('show');
}

function getFinancialYear() {
    var d = new Date();
    var month = d.getMonth();
    var year = d.getFullYear();
    if (month < 3) year = year - 1;
    return year + '-' + (year + 1);
}

function DoVendorVerify() {
    var code = G_VendorVerifyCode;
    if (!code) {
        CloseVendorVerifyModal();
        return;
    }
    if (!isLedgerVerificationUiEnabled()) {
        toastr.warning(
            'Ledger verification is not enabled (fixed parameters: PartyVerificationBeforeOrder and AllowVerifyInLedgerGroup must be Y).'
        );
        CloseVendorVerifyModal();
        return;
    }
    var ModuleName = G_ModuleName;
    var OptionName = 'Verify';
    var ShowMsg = 'Y';
    var FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear)
        .then(function (response) {
            if (response.CheckModuleOptionRight === 'N') {
                toastr.error(response.Msg);
                CloseVendorVerifyModal();
                return;
            }
            VendorMasterService.VerifySolarVendorMaster(code)
                .then(function (res) {
                    var ok = res && (res.Status === 'Y' || res.status === 'Y');
                    if (ok) {
                        CloseVendorVerifyModal();
                        toastr.success(res.Msg || 'Verified successfully.');
                        GetLedgerMasterList();
                    } else {
                        toastr.error((res && (res.Msg || res.message)) || 'Verify failed.');
                    }
                })
                .catch(function () {
                    toastr.error('Verify failed. Please try again.');
                });
        })
        .catch(function (err) {
            console.error('DoVendorVerify permission check error:', err);
            toastr.error('Permission check failed.');
            CloseVendorVerifyModal();
        });
}

window.VerifyVendor = VerifyVendor;
window.CloseVendorVerifyModal = CloseVendorVerifyModal;
window.DoVendorVerify = DoVendorVerify;
