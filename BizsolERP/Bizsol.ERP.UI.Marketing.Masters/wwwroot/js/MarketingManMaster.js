import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';
import { EmployeeMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/EmployeeMasterServices.js';
import { MarketingManMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MarketingManMasterService.js';

var authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
var G_UserMasterCode = authKeyData.UserMaster_Code || 0;

var G_MMM_SourceRows = [];
var G_MMM_DetailMode = 'list';
/** When true, Save sends ClientAccountCodes (from GETBYCODE); when false, SQL keeps existing client links unchanged. */
var G_MMM_ClientCodesLoaded = false;
/** When true, ddlUserId change does not overwrite Person Name (used while loading a record). */
var G_MMM_SkipApplyUserToPerson = false;

function getFinancialYear() {
    return BizSolHelperFunction.getFinancialYear();
}

function firstArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.Data)) return payload.Data;
    return [];
}

function showModal(id) {
    try {
        const el = document.getElementById(id);
        if (window.bootstrap && window.bootstrap.Modal) {
            window.bootstrap.Modal.getOrCreateInstance(el).show();
        } else {
            $('#' + id).modal('show');
        }
    } catch (e) {
        $('#' + id).modal('show');
    }
}

function hideModal(id) {
    try {
        const el = document.getElementById(id);
        if (window.bootstrap && window.bootstrap.Modal) {
            const m = window.bootstrap.Modal.getInstance(el);
            if (m) m.hide();
        } else {
            $('#' + id).modal('hide');
        }
    } catch (e) {
        $('#' + id).modal('hide');
    }
}

function normalizeUserRows(rows) {
    return (rows || []).map(function (r) {
        var code = r.Code != null ? r.Code : r.UserMaster_Code != null ? r.UserMaster_Code : r.code;
        var text =
            r.UserName ||
            r.DisplayName ||
            r.PersonName ||
            r.Name ||
            r.LoginName ||
            r.UserID ||
            '';
        return { Code: code, Desp: String(text).trim() || String(code) };
    });
}

function normalizeMarketingManRows(rows) {
    return (rows || []).map(function (r) {
        var code = r.Code != null ? r.Code : r.MarketingManMaster_Code;
        var text = r.PersonName || r.Person_Name || r.Name || '';
        return { Code: code, Desp: String(text).trim() || String(code) };
    });
}

function normalizeEmployeeRows(rows) {
    return (rows || []).map(function (r) {
        var code = r.Code != null ? r.Code : r.EmployeeMaster_Code;
        var text = r.EmployeeName || r.Name || '';
        return { Code: code, Desp: String(text).trim() || String(code) };
    });
}

function normalizeZoneRows(rows) {
    return (rows || []).map(function (r) {
        var code = r.Code != null ? r.Code : r.ZoneMaster_Code;
        var text = r.ZoneName || r.ZoneDesp || r.Name || r.Desp || '';
        return { Code: code, Desp: String(text).trim() || String(code) };
    });
}

/** GETEXPENSECATEGORYLIST: Code, Desp AS ExpenseCategoryName */
function normalizeExpenseCategoryRows(rows) {
    return (rows || []).map(function (r) {
        var code = r.Code != null ? r.Code : r.code;
        var text = r.ExpenseCategoryName || r.Desp || r.Name || '';
        return { Code: code, Desp: String(text).trim() || String(code) };
    });
}

/**
 * GETBYCODE may return MarketingManExpenseEntryCategory_Code as PascalCase or camelCase (ASP.NET JSON).
 */
function getMarketingManExpenseEntryCategoryCode(rec) {
    if (!rec || typeof rec !== 'object') return null;
    var candidates = [
        rec.MarketingManExpenseEntryCategory_Code,
        rec.marketingManExpenseEntryCategory_Code,
        rec.MarketingManExpenseEntryCategoryCode,
        rec.marketingManExpenseEntryCategoryCode
    ];
    for (var i = 0; i < candidates.length; i++) {
        var v = candidates[i];
        if (v === undefined || v === null || v === '') continue;
        var n = parseInt(v, 10);
        if (isFinite(n) && n > 0) return n;
    }
    return null;
}

/** Sets #ddlExpenseCategory from record; call after dropdown options are loaded (View/Edit). */
function bindExpenseCategoryDropdown(rec) {
    var $el = $('#ddlExpenseCategory');
    if (!$el.length) return;
    var code = getMarketingManExpenseEntryCategoryCode(rec);
    if (code != null) {
        $el.val(String(code));
        if ($el.data('select2')) {
            $el.trigger('change.select2');
        }
        $el.trigger('change');
    } else {
        $el.val('').trigger('change');
    }
}

function bindSelectBasic($select, rows, placeholder) {
    $select.empty();
    $select.append(new Option(placeholder || 'Select', ''));
    $.each(rows, function (_, item) {
        if (item.Code === undefined || item.Code === null) return;
        $select.append(new Option(item.Desp, item.Code));
    });
}

function initSelect2($el) {
    if ($el.data('select2')) {
        $el.select2('destroy');
    }
    $el.select2({
        width: '100%',
        placeholder: 'Select',
        allowClear: true,
    });
}

function getMarketingManCodeForDealers() {
    var v = parseInt($('#hfMarketingManMaster_Code').val() || '0', 10);
    return isFinite(v) ? v : 0;
}

/** Parse comma-separated account codes from hidden field into a lookup object. */
function getLinkedClientAccountSet() {
    var raw = ($('#hfClientAccountCodes').val() || '').trim();
    var o = {};
    if (!raw) return o;
    raw.split(',').forEach(function (s) {
        var n = parseInt(String(s).trim(), 10);
        if (isFinite(n) && n > 0) o[n] = true;
    });
    return o;
}

function accountCodeFromDealerRow(row) {
    var c =
        row.Code != null
            ? row.Code
            : row.AccountMaster_Code != null
              ? row.AccountMaster_Code
              : row.Account_Code != null
                ? row.Account_Code
                : null;
    var n = parseInt(c, 10);
    return isFinite(n) && n > 0 ? n : null;
}

/** Writes selected checkbox account codes to #hfClientAccountCodes (comma-separated). */
function syncClientAccountCodesFromCheckboxes() {
    var codes = [];
    $('#tblClientBody input.mmm-client-link-cb:checked').each(function () {
        var n = parseInt($(this).attr('data-account-code'), 10);
        if (isFinite(n) && n > 0) codes.push(n);
    });
    codes.sort(function (a, b) {
        return a - b;
    });
    $('#hfClientAccountCodes').val(codes.join(','));
}

function refreshClientTable() {
    var mm = getMarketingManCodeForDealers();
    var showAll = $('#chkShowAllParty').is(':checked');
    var codeArg = showAll ? 0 : mm;
    var viewMode = G_MMM_DetailMode === 'view';
    var linked = getLinkedClientAccountSet();

    CRMReportsServices.GetDealerList(codeArg)
        .then(function (res) {
            var rows = firstArray(res);
            var $tb = $('#tblClientBody');
            $tb.empty();
            if (!rows.length) {
                $tb.append(
                    '<tr><td colspan="3" class="center" style="padding:24px;color:var(--text-muted);">No clients found</td></tr>'
                );
                return;
            }
            rows.forEach(function (row, idx) {
                var name =
                    row.AccountDesp ||
                    row.DealerName ||
                    row.PartyName ||
                    row.Name ||
                    row['Account Desp'] ||
                    '';
                var acct = accountCodeFromDealerRow(row);
                var tr = $('<tr></tr>');
                tr.append('<td class="center"><span class="pm-sno">' + (idx + 1) + '</span></td>');
                tr.append('<td>' + $('<div></div>').text(name).html() + '</td>');
                var checked = acct != null && linked[acct];
                var cb =
                    '<input type="checkbox" class="mmm-client-link-cb" ' +
                    (acct != null ? 'data-account-code="' + acct + '" ' : '') +
                    (checked ? 'checked ' : '') +
                    (viewMode || acct == null ? 'disabled ' : '') +
                    'aria-label="Link client" />';
                tr.append($('<td class="center"></td>').html(cb));
                $tb.append(tr);
            });
        })
        .catch(function () {
            $('#tblClientBody').html(
                '<tr><td colspan="3" class="center" style="padding:24px;color:#ef4444;">Unable to load client list</td></tr>'
            );
        });
}

function applyUserSelectionToPersonName() {
    if (G_MMM_DetailMode === 'view') return;
    if (G_MMM_SkipApplyUserToPerson) return;
    var t = $('#ddlUserId option:selected').text();
    if (t && t !== 'Select') {
        $('#txtPersonName').val(t);
    }
}

/**
 * Person Name auto-fills from User ID and becomes disabled when a user is selected.
 * When no user is selected, Person Name is freely editable (still mandatory).
 */
function syncPersonNameFieldState() {
    if (G_MMM_DetailMode === 'view') return;
    var uid = $('#ddlUserId').val();
    var hasUser = uid != null && uid !== '' && String(uid) !== '0';
    $('#txtPersonName').prop('disabled', !!hasUser);
    // Clear validation error when field becomes disabled (value is auto-set)
    if (hasUser) clearFieldError('txtPersonName');
}

function toggleSeniorJuniorUi() {
    var isJunior = $('input[name="radSeniority"]:checked').val() === 'J';
    $('#lblSeniorRequired').toggle(isJunior);
    $('#ddlSeniorName').prop('required', isJunior);
    if (!isJunior && G_MMM_DetailMode !== 'view') {
        $('#ddlSeniorName').val('').trigger('change');
    }
}

/** User ID is mandatory unless Show All Party is checked. */
function toggleUserIdRequiredUi() {
    var userIdRequired = !$('#chkShowAllParty').is(':checked');
    $('#lblUserIdRequired').toggle(userIdRequired);
    $('#ddlUserId').prop('required', userIdRequired);
    if (!userIdRequired) {
        clearFieldError('ddlUserId');
    }
}

/**
 * @param {number} excludeMmCode Current MarketingManMaster Code when editing (0 for new).
 */
function loadDropdowns(excludeMmCode) {
    excludeMmCode = excludeMmCode || 0;

    var pUser = MarketingManMasterService.GetMarketingManUserList(excludeMmCode)
        .then(function (res) {
            var rows = normalizeUserRows(firstArray(res));
            bindSelectBasic($('#ddlUserId'), rows, 'Select');
            initSelect2($('#ddlUserId'));
        })
        .catch(function () {
            return CRMReportsServices.GetUserList()
                .then(function (res) {
                    var rows = normalizeUserRows(firstArray(res));
                    bindSelectBasic($('#ddlUserId'), rows, 'Select');
                    initSelect2($('#ddlUserId'));
                })
                .catch(function () {
                    bindSelectBasic($('#ddlUserId'), [], 'Select');
                    initSelect2($('#ddlUserId'));
                });
        });

    var pSales = MarketingManMasterService.GetSeniorMarketingManList(excludeMmCode)
        .then(function (res) {
            var rows = normalizeMarketingManRows(firstArray(res));
            bindSelectBasic($('#ddlSeniorName'), rows, 'Select');
            initSelect2($('#ddlSeniorName'));
        })
        .catch(function () {
            return CRMReportsServices.GetSalespersonList()
                .then(function (res) {
                    var rows = normalizeMarketingManRows(firstArray(res));
                    bindSelectBasic($('#ddlSeniorName'), rows, 'Select');
                    initSelect2($('#ddlSeniorName'));
                })
                .catch(function () {
                    bindSelectBasic($('#ddlSeniorName'), [], 'Select');
                    initSelect2($('#ddlSeniorName'));
                });
        });

    var pEmp = EmployeeMasterService.GetEmployeeMasterList('All')
        .then(function (res) {
            var rows = normalizeEmployeeRows(firstArray(res));
            bindSelectBasic($('#ddlEmployeeName'), rows, 'Select');
            initSelect2($('#ddlEmployeeName'));
        })
        .catch(function () {
            bindSelectBasic($('#ddlEmployeeName'), [], 'Select');
            initSelect2($('#ddlEmployeeName'));
        });

    var pZone = MarketingManMasterService.GetZoneList()
        .then(function (res) {
            var rows = normalizeZoneRows(firstArray(res));
            bindSelectBasic($('#ddlZone'), rows, 'Select');
            initSelect2($('#ddlZone'));
        })
        .catch(function () {
            bindSelectBasic($('#ddlZone'), [], 'Select'); 
            initSelect2($('#ddlZone'));
        });

    var pExpenseCat = MarketingManMasterService.GetExpenseCategoryList()
        .then(function (res) {
            var rows = normalizeExpenseCategoryRows(firstArray(res));
            bindSelectBasic($('#ddlExpenseCategory'), rows, 'Select');
            initSelect2($('#ddlExpenseCategory'));
        })
        .catch(function () {
            bindSelectBasic($('#ddlExpenseCategory'), [], 'Select');
            initSelect2($('#ddlExpenseCategory'));
        });

    bindSelectBasic($('#ddlCostCenter'), [], 'Select');
    initSelect2($('#ddlCostCenter'));

    return Promise.all([pUser, pSales, pEmp, pZone, pExpenseCat]);
}

/** @param {number} excludeMmCode Pass current MM Code on edit so user/senior dropdowns exclude correctly. */
function ensureDropdowns(excludeMmCode) {
    return loadDropdowns(excludeMmCode || 0);
}

function clearForm() {
    clearAllFieldErrors();
    G_MMM_ClientCodesLoaded = false;
    $('#hfClientAccountCodes').val('');
    $('#hfMarketingManMaster_Code').val('0');
    $('#txtPersonName').prop('disabled', false);
    $('#ddlUserId').val('').trigger('change');
    $('#txtPersonName').val('');
    $('#txtDesignation').val('');
    $('#txtMobile').val('');
    $('#txtEMail').val('');
    $('#chkEmailInvoiceCopy').prop('checked', false);
    $('input[name="radSeniority"][value="S"]').prop('checked', true);
    $('#ddlSeniorName').val('').trigger('change');
    $('#ddlEmployeeName').val('').trigger('change');
    $('#ddlCostCenter').val('').trigger('change');
    $('#txtEmployeeLeaveDate').val('');
    $('#ddlZone').val('').trigger('change');
    $('#ddlExpenseCategory').val('').trigger('change');
    $('input[name="radStatus"][value="Y"]').prop('checked', true);
    $('#chkShowAllParty').prop('checked', false);
    syncPersonNameFieldState();
    toggleUserIdRequiredUi();
}

function setDetailFormMode(mode) {
    G_MMM_DetailMode = mode;
    var ro = mode === 'view';
    $('#mmmDetailPanel').toggleClass('mmm-readonly', ro);

    var $interactive = $('#mmmDetailPanel').find(
        'input:not([type="hidden"]), select, textarea, .mmm-btn.primary, .mmm-btn.secondary, .btn-mmm-ci-po-save'
    );
    $interactive.prop('disabled', ro);
    $('#btnBackToMarketingManList').prop('disabled', false);

    if (!ro) {
        $('#btnSaveMarketingMan, #btnClearMarketingMan').show();
    } else {
        $('#btnSaveMarketingMan, #btnClearMarketingMan').hide();
    }

    try {
        ['ddlUserId', 'ddlSeniorName', 'ddlEmployeeName', 'ddlCostCenter', 'ddlZone', 'ddlExpenseCategory'].forEach(function (id) {
            var $s = $('#' + id);
            if ($s.data('select2')) {
                $s.prop('disabled', ro);
            }
        });
    } catch (e) {}

    if (!ro) {
        syncPersonNameFieldState();
    }
}

function showListPanel() {
    $('#mmmListPanel').show();
    $('#mmmDetailPanel').hide();
    G_MMM_DetailMode = 'list';
    refreshMarketingManMasterGrid();
}

function showDetailPanel(mode) {
    $('#mmmListPanel').hide();
    $('#mmmDetailPanel').show();
    setDetailFormMode(mode);
}

function buildActionHtml(code) {
    return (
        '<div class="pm-actions">' +
        '<button type="button" class="pm-icon-btn view" title="View" onclick="MMM_OpenView(' +
        code +
        ')"><i class="fas fa-eye"></i></button>' +
        '<button type="button" class="pm-icon-btn edit" title="Edit" onclick="MMM_OpenEdit(' +
        code +
        ')"><i class="fas fa-pencil-alt"></i></button>' +
        '<button type="button" class="pm-icon-btn del" title="Delete" onclick="MMM_OpenDelete(' +
        code +
        ')"><i class="fas fa-trash-alt"></i></button>' +
        '</div>'
    );
}

function mapRowForGrid(item, rowIndex) {
    var code = item.Code || 0;
    var active = String(item.IsActive || 'Y').toUpperCase() !== 'N';
    var sjRaw = (item.SeniorJunior || item.Senior || 'S').toString().toUpperCase();
    var sj = sjRaw.indexOf('J') >= 0 || sjRaw === 'N';
    var sno = item['S.No.'];
    if (sno == null || sno === '') {
        sno = rowIndex != null ? rowIndex + 1 : '';
    }
    return {
        Code: code,
        'S.No.': sno,
        'Person Name': item.PersonName || item.Person_Name || '',
        Mobile: item.Mobile || item.MobileNo || '',
        'E-Mail': item.EMail || item.Email || '',
        Designation: item.Designation || '',
        Status: active ? 'Active' : 'Inactive',
        Level: sj ? 'Junior' : 'Senior',
        Action: buildActionHtml(code),
    };
}

function applyMMMListSearch(rows) {
    var q = ($('#mmmSearch').val() || '').toLowerCase().trim();
    var src = rows || G_MMM_SourceRows || [];
    if (!q) return src.slice();
    return src.filter(function (r) {
        var pn = String(r.PersonName || r.Person_Name || '').toLowerCase();
        var m = String(r.Mobile || r.MobileNo || '').toLowerCase();
        var e = String(r.EMail || r.Email || '').toLowerCase();
        var d = String(r.Designation || '').toLowerCase();
        return pn.indexOf(q) >= 0 || m.indexOf(q) >= 0 || e.indexOf(q) >= 0 || d.indexOf(q) >= 0;
    });
}

function bindMarketingManMasterGridData(filteredRows) {
    var rows = filteredRows || [];
    if (!rows.length) {
        $('#table-header-MarketingManMaster').empty();
        $('#table-body-MarketingManMaster').html(
            '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">No records found. Click <strong>Create New</strong> to add.</td></tr>'
        );
        $('#paginator-MarketingManMaster').empty();
        return;
    }

    var mapped = rows.map(function (item, idx) {
        return mapRowForGrid(item, idx);
    });
    var StringFilterColumn = ['Person Name', 'Mobile', 'E-Mail', 'Designation', 'Status', 'Level'];
    var NumericFilterColumn = [];
    var DateFilterColumn = [];
    var Button = false;
    var showButtons = [];
    var StringdoubleFilterColumn = [];
    var hiddenColumns = ['Code'];
    var ColumnAlignment = {
        'S.No.': 'center;min-width:52px;white-space:nowrap;',
        Action: 'center;min-width:128px;white-space:nowrap;',
    };

    if (typeof window.columnFilters === 'object' && window.columnFilters !== null) {
        window.columnFilters = {};
    }

    BizsolCustomFilterGrid.CreateDataTable(
        'table-header-MarketingManMaster',
        'table-body-MarketingManMaster',
        mapped,
        Button,
        showButtons,
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
}

function refreshMarketingManMasterGrid() {
    MarketingManMasterService.GetMarketingManMasterList()
        .then(function (res) {
            G_MMM_SourceRows = firstArray(res);
            bindMarketingManMasterGridData(applyMMMListSearch(G_MMM_SourceRows));
        })
        .catch(function () {
            G_MMM_SourceRows = [];
            bindMarketingManMasterGridData([]);
            if (typeof toastr !== 'undefined') {
                toastr.error('Could not load marketing man list.');
            }
        });
}

function buildSavePayload() {
    var payload = {
        Code: parseInt($('#hfMarketingManMaster_Code').val() || '0', 10) || 0,
        UserMaster_Code: parseInt($('#ddlUserId').val() || '0', 10) || 0,
        PersonName: ($('#txtPersonName').val() || '').trim(),
        Designation: ($('#txtDesignation').val() || '').trim(),
        MobileNo: ($('#txtMobile').val() || '').trim(),
        Email: ($('#txtEMail').val() || '').trim(),
        EmailInvoiceCopy: $('#chkEmailInvoiceCopy').is(':checked') ? 'Y' : 'N',
        SeniorJunior: $('input[name="radSeniority"]:checked').val() || 'S',
        Senior_Code: parseInt($('#ddlSeniorName').val() || '0', 10) || 0,
        EmployeeMaster_Code: parseInt($('#ddlEmployeeName').val() || '0', 10) || 0,
        CostCanterIDMaster_Code: parseInt($('#ddlCostCenter').val() || '0', 10) || 0,
        EmployeeLeaveDate: $('#txtEmployeeLeaveDate').val() || null,
        ZoneMaster_Code: parseInt($('#ddlZone').val() || '0', 10) || 0,
        EmployeeCode: '',
        IsActive: $('input[name="radStatus"]:checked').val() || 'Y',
        ShowAllClient: $('#chkShowAllParty').is(':checked') ? 'Y' : 'N',
        MarketingManPassword: '',
        CRMAdmin: 'N',
        AllowAllItems: 'N',
        MarketingManExpenseEntryCategory_Code:
            parseInt($('#ddlExpenseCategory').val() || '0', 10) || 0,
        AllowToVerifyOrderInMobileApp: 'N',
        IsActiveMobileApp: 'N',
    };
    if ($('#tblClientBody').find('input.mmm-client-link-cb').length) {
        syncClientAccountCodesFromCheckboxes();
    }
    if (G_MMM_ClientCodesLoaded) {
        payload.ClientAccountCodes = $('#hfClientAccountCodes').val() || '';
    } else {
        payload.ClientAccountCodes = null;
    }
    return payload;
}

function mapRecordToForm(rec) {
    if (!rec || typeof rec !== 'object') return;
    G_MMM_SkipApplyUserToPerson = true;
    try {
    if (rec.Code != null) $('#hfMarketingManMaster_Code').val(rec.Code);
    if (rec.UserMaster_Code != null) {
        $('#ddlUserId').val(String(rec.UserMaster_Code)).trigger('change');
    }
    $('#txtPersonName').val(rec.PersonName || rec.Person_Name || '');
    $('#txtDesignation').val(rec.Designation || '');
    $('#txtMobile').val(rec.Mobile || rec.MobileNo || '');
    $('#txtEMail').val(rec.EMail || rec.Email || '');
    $('#chkEmailInvoiceCopy').prop(
        'checked',
        String(rec.EmailInvoiceCopy || '').toUpperCase() === 'Y'
    );
    var sj = (rec.SeniorJunior || 'S').toString().toUpperCase().indexOf('J') >= 0 ? 'J' : 'S';
    $('input[name="radSeniority"][value="' + sj + '"]').prop('checked', true);
    if (rec.SeniorMarketingManMaster_Code != null) {
        $('#ddlSeniorName').val(String(rec.SeniorMarketingManMaster_Code)).trigger('change');
    }
    if (rec.EmployeeMaster_Code != null) {
        $('#ddlEmployeeName').val(String(rec.EmployeeMaster_Code)).trigger('change');
    }
    if (rec.CostCentreMaster_Code != null) {
        $('#ddlCostCenter').val(String(rec.CostCentreMaster_Code)).trigger('change');
    }
    var ld = rec.EmployeeLeaveDate || rec.LeaveDate;
    if (ld) {
        var d = ld.length >= 10 ? ld.substring(0, 10) : ld;
        $('#txtEmployeeLeaveDate').val(d);
    }
    if (rec.ZoneMaster_Code != null) {
        $('#ddlZone').val(String(rec.ZoneMaster_Code)).trigger('change');
    }
    bindExpenseCategoryDropdown(rec);
    var active = String(rec.IsActive || 'Y').toUpperCase() !== 'N';
    $('input[name="radStatus"][value="' + (active ? 'Y' : 'N') + '"]').prop('checked', true);
    $('#chkShowAllParty').prop(
        'checked',
        String(rec.ShowAllParty || rec.ShowAllClient || '').toUpperCase() === 'Y'
    );
    var cc = rec.ClientAccountCodes != null ? rec.ClientAccountCodes : rec.clientAccountCodes;
    if (cc != null && cc !== undefined) {
        $('#hfClientAccountCodes').val(String(cc));
        G_MMM_ClientCodesLoaded = true;
    } else {
        G_MMM_ClientCodesLoaded = false;
    }
    toggleSeniorJuniorUi();
    toggleUserIdRequiredUi();
    syncPersonNameFieldState();
    } finally {
        G_MMM_SkipApplyUserToPerson = false;
    }
}

function loadEditRecord(code, mode) {
    return MarketingManMasterService.GetMarketingManMasterByCode(code)
        .then(function (res) {
            var raw = res && (res.data || res.Data || res);
            var rec = raw;
            if (Array.isArray(raw) && raw.length) rec = raw[0];
            if (rec) {
                mapRecordToForm(rec);
                /* Select2 sometimes needs a second tick to show the selected expense category after options exist. */
                setTimeout(function () {
                    bindExpenseCategoryDropdown(rec);
                }, 0);
            }
            setDetailFormMode(mode || 'edit');
            refreshClientTable();
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') {
                toastr.warning('Could not load record from server.');
            }
            refreshClientTable();
        });
}

/** Show a red inline error message below a field. */
function showFieldError(fieldId, message) {
    var $field = $('#' + fieldId);
    $field.addClass('mmm-input-error');
    var $wrap = $field.closest('.mmm-fg');
    $wrap.find('.mmm-field-error').remove();
    $wrap.append(
        '<div class="mmm-field-error">' +
        '<i class="fas fa-circle-exclamation"></i>' +
        '<span>' + message + '</span>' +
        '</div>'
    );
}

/** Remove inline error state from a field. */
function clearFieldError(fieldId) {
    var $field = $('#' + fieldId);
    $field.removeClass('mmm-input-error');
    $field.closest('.mmm-fg').find('.mmm-field-error').remove();
}

function clearAllFieldErrors() {
    $('#mmmDetailPanel .mmm-input-error').removeClass('mmm-input-error');
    $('#mmmDetailPanel .mmm-field-error').remove();
}

function saveMarketingMan() {
    var ModuleName = 'Marketing Executive Master',
        OptionName = parseInt($('#hfMarketingManMaster_Code').val() || '0', 10) > 0 ? 'Edit' : 'New',
        ShowMsg = 'Y',
        FinYear = getFinancialYear();

    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') {
                toastr.error((response && response.Msg) || 'Permission denied.');
            }
            return;
        }
        // ── Mandatory: User ID (unless Show All Party is checked) ───────
        if (!$('#chkShowAllParty').is(':checked')) {
            var userId = $('#ddlUserId').val();
            if (!userId || String(userId) === '0') {
                showFieldError('ddlUserId', 'User ID is required.');
                try {
                    if ($('#ddlUserId').data('select2')) {
                        $('#ddlUserId').select2('open');
                    } else {
                        $('#ddlUserId').focus();
                    }
                } catch (e) {
                    $('#ddlUserId').focus();
                }
                return;
            }
        }

        // ── Mandatory: Person Name ───────────────────────────────────────
        var personName = ($('#txtPersonName').val() || '').trim();
        if (!personName) {
            showFieldError('txtPersonName', 'Person Name is required.');
            $('#txtPersonName').focus();
            return;
        }

        // ── Mobile format (if provided) ──────────────────────────────────
        var mobile = ($('#txtMobile').val() || '').trim();
        if (mobile && !/^\d{10}$/.test(mobile)) {
            showFieldError('txtMobile', 'Mobile number must be exactly 10 digits.');
            $('#txtMobile').focus();
            return;
        }

        // ── Email format (if provided) ───────────────────────────────────
        var email = ($('#txtEMail').val() || '').trim();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showFieldError('txtEMail', 'Please enter a valid email address.');
            $('#txtEMail').focus();
            return;
        }

        if ($('input[name="radSeniority"]:checked').val() === 'J') {
            var sn = $('#ddlSeniorName').val();
            if (!sn) {
                if (typeof toastr !== 'undefined') {
                    toastr.warning('Senior is mandatory for junior level.');
                }
                try {
                    if ($('#ddlSeniorName').data('select2')) {
                        $('#ddlSeniorName').select2('open');
                    } else {
                        $('#ddlSeniorName').focus();
                    }
                } catch (e) {
                    $('#ddlSeniorName').focus();
                }
                return;
            }
        }
        var expenseCategoryCode = parseInt($('#ddlExpenseCategory').val() || '0', 10) || 0;
        if (!expenseCategoryCode) {
            if (typeof toastr !== 'undefined') {
                toastr.warning('Expense Category is required.');
            }
            try {
                if ($('#ddlExpenseCategory').data('select2')) {
                    $('#ddlExpenseCategory').select2('open');
                } else {
                    $('#ddlExpenseCategory').focus();
                }
            } catch (e) {
                $('#ddlExpenseCategory').focus();
            }
            return;
        }
        var payload = buildSavePayload();
        MarketingManMasterService.SaveMarketingManMaster(payload)
            .then(function (res) {
                var ok = res && (res.Status === 'Y' || res.status === 'Y');
                if (ok) {
                    if (res.Code != null) $('#hfMarketingManMaster_Code').val(res.Code);
                    if (typeof toastr !== 'undefined') {
                        toastr.success((res && (res.Msg || res.Message)) || 'Saved successfully.');
                    }
                    clearAllFieldErrors();
                    // Navigate back to the list after a short delay so toastr is visible
                    setTimeout(function () { showListPanel(); }, 900);
                } else {
                    if (typeof toastr !== 'undefined') {
                        toastr.error((res && (res.Msg || res.Message || res.message)) || 'Save failed.');
                    }
                }
            })
            .catch(function () {
                if (typeof toastr !== 'undefined') {
                    toastr.error('Save request failed. Ensure Marketing Man API endpoints are deployed.');
                }
            });
    });
}

function MMM_OpenView(code) {
    var ModuleName = 'Marketing Executive Master',
        OptionName = 'View',
        ShowMsg = 'Y',
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('view');
        loadDropdowns(code).then(function () {
            clearForm();
            loadEditRecord(code, 'view');
        });
    });
}

function MMM_OpenEdit(code) {
    var ModuleName = 'Marketing Executive Master',
        OptionName = 'Edit',
        ShowMsg = 'Y',
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('edit');
        loadDropdowns(code).then(function () {
            clearForm();
            loadEditRecord(code, 'edit');
        });
    });
}

function MMM_OpenDelete(code) {
    var ModuleName = 'Marketing Executive Master',
        OptionName = 'Delete',
        ShowMsg = 'Y',
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        $('#hfMMMDeleteCode').val(code);
        $('#mmmReasonForDelete').val('');
        showModal('dvMMMDeleteModal');
        setTimeout(function () {
            $('#mmmReasonForDelete').focus();
        }, 300);
    });
}

function confirmMMMDelete() {
    var code = parseInt($('#hfMMMDeleteCode').val() || '0', 10) || 0;
    var reason = ($('#mmmReasonForDelete').val() || '').trim();
    if (!code) {
        hideModal('dvMMMDeleteModal');
        return;
    }
    if (!reason) {
        if (typeof toastr !== 'undefined') toastr.warning('Please enter a reason for deletion.');
        $('#mmmReasonForDelete').focus();
        return;
    }
    MarketingManMasterService.DeleteMarketingManMaster(code, reason)
        .then(function (res) {
            var ok = res && (res.Status === 'Y' || res.status === 'Y');
            if (ok) {
                hideModal('dvMMMDeleteModal');
                if (typeof toastr !== 'undefined') toastr.success((res && res.Msg) || 'Deleted.');
                refreshMarketingManMasterGrid();
            } else {
                if (typeof toastr !== 'undefined') toastr.error((res && (res.Msg || res.message)) || 'Delete failed.');
            }
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.error('Delete request failed.');
        });
}

$(document).ready(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    if (!$('#ERPHeading').text().trim()) {
        $('#ERPHeading').text('Marketing Executive Master');
    }

    $('#btnCreateMarketingMan').on('click', function () {
        loadDropdowns(0).then(function () {
            clearForm();
            showDetailPanel('new');
            toggleSeniorJuniorUi();
            refreshClientTable();
        });
    });

    $('input[name="radSeniority"]').on('change', function () {
        toggleSeniorJuniorUi();
    });

    $('#btnBackToMarketingManList').on('click', function () {
        showListPanel();
    });

    $('#ddlUserId').on('change', function () {
        applyUserSelectionToPersonName();
        syncPersonNameFieldState();
        if ($(this).val() && String($(this).val()) !== '0') {
            clearFieldError('ddlUserId');
        }
    });

    $('#chkShowAllParty').on('change', function () {
        toggleUserIdRequiredUi();
        refreshClientTable();
    });

    $(document).on('change', '#tblClient .mmm-client-link-cb', function () {
        if (G_MMM_DetailMode === 'view') return;
        G_MMM_ClientCodesLoaded = true;
        syncClientAccountCodesFromCheckboxes();
    });

    // ── Focusout validation ─────────────────────────────────────────────
    $('#txtPersonName').on('blur', function () {
        clearFieldError('txtPersonName');
        if (!$(this).val().trim()) {
            showFieldError('txtPersonName', 'Person Name is required.');
        }
    });
    $('#txtPersonName').on('input', function () {
        if ($(this).val().trim()) clearFieldError('txtPersonName');
    });

    $('#txtMobile').on('blur', function () {
        clearFieldError('txtMobile');
        var v = $(this).val().trim();
        if (v && !/^\d{10}$/.test(v)) {
            showFieldError('txtMobile', 'Mobile number must be exactly 10 digits.');
        }
    });
    $('#txtMobile').on('input', function () {
        var v = $(this).val().trim();
        if (!v || /^\d{10}$/.test(v)) clearFieldError('txtMobile');
    });

    $('#txtEMail').on('blur', function () {
        clearFieldError('txtEMail');
        var v = $(this).val().trim();
        if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
            showFieldError('txtEMail', 'Please enter a valid email address.');
        }
    });
    $('#txtEMail').on('input', function () {
        var v = $(this).val().trim();
        if (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) clearFieldError('txtEMail');
    });

    $('#btnSaveMarketingMan').on('click', function () {
        saveMarketingMan();
    });

    $('#btnClearMarketingMan').on('click', function () {
        clearForm();
        refreshClientTable();
    });

    $('#btnMMMConfirmDelete').on('click', function () {
        confirmMMMDelete();
    });

    var searchTimer;
    $('#mmmSearch').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            bindMarketingManMasterGridData(applyMMMListSearch(G_MMM_SourceRows));
        }, 200);
    });

    var params = BizSolHelperFunction.getUrlVars();
    var codeFromUrl = parseInt(params.Code || params.code || '0', 10);

    if (isFinite(codeFromUrl) && codeFromUrl > 0) {
        showDetailPanel('edit');
        loadDropdowns(codeFromUrl).then(function () {
            clearForm();
            $('#hfMarketingManMaster_Code').val(String(codeFromUrl));
            loadEditRecord(codeFromUrl, 'edit');
        });
    } else {
        refreshMarketingManMasterGrid();
    }
});

window.MMM_OpenView = MMM_OpenView;
window.MMM_OpenEdit = MMM_OpenEdit;
window.MMM_OpenDelete = MMM_OpenDelete;
