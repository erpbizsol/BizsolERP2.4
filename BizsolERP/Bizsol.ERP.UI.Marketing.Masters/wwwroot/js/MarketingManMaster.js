import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { CRMReportsServices } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMReportsService.js';
import { VisitOrderEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/VisitOrderEntryService.js';
import { EmployeeMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/EmployeeMasterServices.js';
import { MarketingManMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MarketingManMasterService.js';

var authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
var G_UserMasterCode = authKeyData.UserMaster_Code || 0;

/** Full list from API (for search) */
var G_MMM_SourceRows = [];
/** 'list' | 'new' | 'edit' | 'view' */
var G_MMM_DetailMode = 'list';
var G_MMM_DropdownsReady = false;

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

function refreshClientTable() {
    var mm = getMarketingManCodeForDealers();
    var showAll = $('#chkShowAllParty').is(':checked');
    var codeArg = showAll ? 0 : mm;

    CRMReportsServices.GetDealerList(codeArg)
        .then(function (res) {
            var rows = firstArray(res);
            var $tb = $('#tblClientBody');
            $tb.empty();
            if (!rows.length) {
                $tb.append(
                    '<tr><td colspan="2" class="center" style="padding:24px;color:var(--text-muted);">No clients found</td></tr>'
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
                var tr = $('<tr></tr>');
                tr.append('<td class="center"><span class="pm-sno">' + (idx + 1) + '</span></td>');
                tr.append('<td>' + $('<div></div>').text(name).html() + '</td>');
                $tb.append(tr);
            });
        })
        .catch(function () {
            $('#tblClientBody').html(
                '<tr><td colspan="2" class="center" style="padding:24px;color:#ef4444;">Unable to load client list</td></tr>'
            );
        });
}

function applyUserSelectionToPersonName() {
    if (G_MMM_DetailMode === 'view') return;
    var t = $('#ddlUserId option:selected').text();
    if (t && t !== 'Select') {
        $('#txtPersonName').val(t);
    }
}

function loadDropdowns() {
    var pUser = CRMReportsServices.GetUserList()
        .then(function (res) {
            var rows = normalizeUserRows(firstArray(res));
            bindSelectBasic($('#ddlUserId'), rows, 'Select');
            initSelect2($('#ddlUserId'));
        })
        .catch(function () {
            bindSelectBasic($('#ddlUserId'), [], 'Select');
            initSelect2($('#ddlUserId'));
        });

    var pSales = CRMReportsServices.GetSalespersonList()
        .then(function (res) {
            var rows = normalizeMarketingManRows(firstArray(res));
            bindSelectBasic($('#ddlSeniorName'), rows, 'Select');
            initSelect2($('#ddlSeniorName'));
        })
        .catch(function () {
            bindSelectBasic($('#ddlSeniorName'), [], 'Select');
            initSelect2($('#ddlSeniorName'));
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

    var pZone = VisitOrderEntryService.GetZoneMasterList()
        .then(function (res) {
            var rows = normalizeZoneRows(firstArray(res));
            bindSelectBasic($('#ddlZone'), rows, 'Select');
            initSelect2($('#ddlZone'));
        })
        .catch(function () {
            bindSelectBasic($('#ddlZone'), [], 'Select');
            initSelect2($('#ddlZone'));
        });

    bindSelectBasic($('#ddlCostCenter'), [], 'Select');
    initSelect2($('#ddlCostCenter'));

    return Promise.all([pUser, pSales, pEmp, pZone]).then(function () {
        G_MMM_DropdownsReady = true;
    });
}

function ensureDropdowns() {
    if (G_MMM_DropdownsReady) return Promise.resolve();
    return loadDropdowns();
}

function clearForm() {
    $('#hfMarketingManMaster_Code').val('0');
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
    $('input[name="radStatus"][value="Y"]').prop('checked', true);
    $('#chkShowAllParty').prop('checked', false);
}

function setDetailFormMode(mode) {
    G_MMM_DetailMode = mode;
    var ro = mode === 'view';
    $('#mmmDetailPanel').toggleClass('mmm-readonly', ro);

    var $interactive = $('#mmmDetailPanel').find(
        'input:not([type="hidden"]), select, textarea, .mmm-btn.primary, .mmm-btn.secondary'
    );
    $interactive.prop('disabled', ro);
    $('#btnBackToMarketingManList').prop('disabled', false);

    if (!ro) {
        $('#btnSaveMarketingMan, #btnClearMarketingMan').show();
    } else {
        $('#btnSaveMarketingMan, #btnClearMarketingMan').hide();
    }

    try {
        ['ddlUserId', 'ddlSeniorName', 'ddlEmployeeName', 'ddlCostCenter', 'ddlZone'].forEach(function (id) {
            var $s = $('#' + id);
            if ($s.data('select2')) {
                $s.prop('disabled', ro);
            }
        });
    } catch (e) {}
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

function mapRowForGrid(item) {
    var code = item.Code || 0;
    var active = String(item.IsActive || 'Y').toUpperCase() !== 'N';
    var sj = (item.SeniorJunior || 'S').toString().toUpperCase().indexOf('J') >= 0;
    return {
        Code: code,
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
            '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">No records found. Click <strong>Create New</strong> to add.</td></tr>'
        );
        $('#paginator-MarketingManMaster').empty();
        return;
    }

    var mapped = rows.map(mapRowForGrid);
    var StringFilterColumn = ['Person Name', 'Mobile', 'E-Mail', 'Designation', 'Status', 'Level'];
    var NumericFilterColumn = [];
    var DateFilterColumn = [];
    var Button = false;
    var showButtons = [];
    var StringdoubleFilterColumn = [];
    var hiddenColumns = ['Code'];
    var ColumnAlignment = { Action: 'center;min-width:128px;white-space:nowrap;' };

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
    return {
        Code: parseInt($('#hfMarketingManMaster_Code').val() || '0', 10) || 0,
        UserMaster_Code: $('#ddlUserId').val() || 0,
        PersonName: $('#txtPersonName').val() || '',
        Designation: $('#txtDesignation').val() || '',
        Mobile: $('#txtMobile').val() || '',
        EMail: $('#txtEMail').val() || '',
        EmailInvoiceCopy: $('#chkEmailInvoiceCopy').is(':checked') ? 'Y' : 'N',
        SeniorJunior: $('input[name="radSeniority"]:checked').val() || 'S',
        SeniorMarketingManMaster_Code: $('#ddlSeniorName').val() || 0,
        EmployeeMaster_Code: $('#ddlEmployeeName').val() || 0,
        CostCentreMaster_Code: $('#ddlCostCenter').val() || 0,
        EmployeeLeaveDate: $('#txtEmployeeLeaveDate').val() || null,
        ZoneMaster_Code: $('#ddlZone').val() || 0,
        IsActive: $('input[name="radStatus"]:checked').val() || 'Y',
        ShowAllParty: $('#chkShowAllParty').is(':checked') ? 'Y' : 'N',
        UserID: G_UserMasterCode,
        FinYear: getFinancialYear(),
    };
}

function mapRecordToForm(rec) {
    if (!rec || typeof rec !== 'object') return;
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
    var active = String(rec.IsActive || 'Y').toUpperCase() !== 'N';
    $('input[name="radStatus"][value="' + (active ? 'Y' : 'N') + '"]').prop('checked', true);
    $('#chkShowAllParty').prop(
        'checked',
        String(rec.ShowAllParty || '').toUpperCase() === 'Y'
    );
}

function loadEditRecord(code, mode) {
    return MarketingManMasterService.GetMarketingManMasterByCode(code)
        .then(function (res) {
            var raw = res && (res.data || res.Data || res);
            var rec = raw;
            if (Array.isArray(raw) && raw.length) rec = raw[0];
            if (rec) mapRecordToForm(rec);
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

function saveMarketingMan() {
    var ModuleName = 'Marketing Man Master',
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
        var payload = buildSavePayload();
        MarketingManMasterService.SaveMarketingManMaster(payload)
            .then(function (res) {
                var ok = res && (res.Status === 'Y' || res.status === 'Y');
                if (ok) {
                    if (res.Code != null) $('#hfMarketingManMaster_Code').val(res.Code);
                    if (typeof toastr !== 'undefined') {
                        toastr.success((res && res.Msg) || 'Saved successfully.');
                    }
                    refreshClientTable();
                    refreshMarketingManMasterGrid();
                } else {
                    if (typeof toastr !== 'undefined') {
                        toastr.error((res && (res.Msg || res.message)) || 'Save failed.');
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
    var ModuleName = 'Marketing Man Master',
        OptionName = 'View',
        ShowMsg = 'Y',
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        ensureDropdowns().then(function () {
            clearForm();
            showDetailPanel('view');
            loadEditRecord(code, 'view');
        });
    });
}

function MMM_OpenEdit(code) {
    var ModuleName = 'Marketing Man Master',
        OptionName = 'Edit',
        ShowMsg = 'Y',
        FinYear = getFinancialYear();
    MenuService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        ensureDropdowns().then(function () {
            clearForm();
            showDetailPanel('edit');
            loadEditRecord(code, 'edit');
        });
    });
}

function MMM_OpenDelete(code) {
    var ModuleName = 'Marketing Man Master',
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
        $('#ERPHeading').text('Marketing Man Master');
    }

    $('#btnCreateMarketingMan').on('click', function () {
        ensureDropdowns().then(function () {
            clearForm();
            showDetailPanel('new');
            refreshClientTable();
        });
    });

    $('#btnBackToMarketingManList').on('click', function () {
        showListPanel();
    });

    $('#ddlUserId').on('change', function () {
        applyUserSelectionToPersonName();
    });

    $('#chkShowAllParty').on('change', function () {
        refreshClientTable();
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
        ensureDropdowns().then(function () {
            clearForm();
            $('#hfMarketingManMaster_Code').val(String(codeFromUrl));
            showDetailPanel('edit');
            loadEditRecord(codeFromUrl, 'edit');
        });
    } else {
        refreshMarketingManMasterGrid();
    }
});

window.MMM_OpenView = MMM_OpenView;
window.MMM_OpenEdit = MMM_OpenEdit;
window.MMM_OpenDelete = MMM_OpenDelete;
