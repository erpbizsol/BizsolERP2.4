import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BankMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/BankMasterService.js';
import { CityMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CityMasterService.js';
import { CountryMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CountryMasterService.js';

var authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
var G_UserMasterCode = authKeyData.UserMaster_Code || 0;

var G_BANK_SourceRows = [];
var G_BANK_DetailMode = 'list';
var G_BANK_ListCountry = 'India';
var G_BANK_CityRows = [];
var G_BANK_StateRows = [];
var G_BANK_NationRows = [];
var G_BANK_CurrencyRows = [];
var G_BANK_ECMSRows = [];
var G_BANK_AccountRows = [];
var G_BANK_SavedDatabaseLocationCode = 0;

var G_BANK_ModuleName = 'Bank';

function getFinancialYear() {
    return BizSolHelperFunction.getFinancialYear();
}
function firstArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload.$values && Array.isArray(payload.$values)) return payload.$values;
    if (payload.data && Array.isArray(payload.data)) return payload.data;
    if (payload.Data && Array.isArray(payload.Data)) return payload.Data;
    if (payload.value && Array.isArray(payload.value)) return payload.value;
    if (payload.Value && Array.isArray(payload.Value)) return payload.Value;
    return [];
}
function firstRecord(payload) {
    if (!payload) return null;
    if (Array.isArray(payload)) return payload.length ? payload[0] : null;
    if (payload.$values && Array.isArray(payload.$values)) return payload.$values.length ? payload.$values[0] : null;
    if (payload.data != null && typeof payload.data === 'object' && !Array.isArray(payload.data)) return payload.data;
    if (payload.Data != null && typeof payload.Data === 'object' && !Array.isArray(payload.Data)) return payload.Data;
    if (typeof payload === 'object') return payload;
    return null;
}
function dropdownText(item, fieldName) {
    if (!item || typeof item !== 'object') return '';
    if (item[fieldName] != null) return String(item[fieldName]).trim();
    var lower = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
    if (item[lower] != null) return String(item[lower]).trim();
    if (item.Value != null) return String(item.Value).trim();
    if (item.value != null) return String(item.value).trim();
    if (item.Text != null) return String(item.Text).trim();
    if (item.text != null) return String(item.text).trim();
    return '';
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
function bindSelect2($sel, placeholder) {
    if (!$sel.length) return;
    if ($sel.data('select2')) $sel.select2('destroy');
    $sel.select2({
        width: '100%',
        placeholder: placeholder || 'Search…',
        allowClear: true,
        minimumResultsForSearch: 0,
    });
}
function bindSimpleDropdown($sel, rows, valueField, textField, placeholder) {
    if (!$sel.length) return;
    var selected = ($sel.val() || '').toString();
    $sel.empty();
    $sel.append(new Option(placeholder || '-- Select --', ''));
    var seen = {};
    $.each(rows || [], function (_, item) {
        var text = dropdownText(item, textField);
        if (!text || seen[text]) return;
        seen[text] = true;
        $sel.append(new Option(text, text));
    });
    if (selected) $sel.val(selected);
    bindSelect2($sel, placeholder);
    if (selected) {
        $sel.val(selected);
        if ($sel.data('select2')) $sel.trigger('change.select2');
    }
}
function showFieldError(fieldId, message) {
    var $field = $('#' + fieldId);
    $field.addClass('bank-input-error');
    var $wrap = $field.closest('.bank-fg');
    $wrap.find('.bank-field-error').remove();
    $wrap.append(
        '<div class="bank-field-error"><i class="fas fa-circle-exclamation"></i> <span>' + message + '</span></div>'
    );
}
function clearFieldError(fieldId) {
    $('#' + fieldId).removeClass('bank-input-error');
    $('#' + fieldId).closest('.bank-fg').find('.bank-field-error').remove();
}
function clearAllFieldErrors() {
    $('#bankDetailPanel .bank-input-error').removeClass('bank-input-error');
    $('#bankDetailPanel .bank-field-error').remove();
}
function clearForm() {
    clearAllFieldErrors();
    G_BANK_SavedDatabaseLocationCode = 0;
    $('#hfBankMaster_Code').val('0');
    $('#txtBankName, #txtAliasName, #txtAccountNo, #txtIFSCCode, #txtSwiftCode, #txtAddress').val('');
    $('#txtPin, #txtPhoneNo, #txtFaxNo, #txtServiceTaxNo, #txtPANNo, #txtEMail').val('');
    $('#txtMICRCode, #txtVartualAccountPrefix, #txtVartualAccountLength').val('');
    $('#chkIsDefault, #chkECMSApplicable, #chkVartualAccountAutoGenerate').prop('checked', false);
    $('#ddlCurrency, #ddlCity, #ddlState, #ddlNation, #ddlECMSBank, #ddlECMSDebitAccount').val('').trigger('change');
    toggleECMSPanel(false);
}
function toggleECMSPanel(show) {
    if (show) {
        $('#bankECMSPanel').slideDown(180);
    } else {
        $('#bankECMSPanel').hide();
    }
}
function setDetailFormMode(mode) {
    G_BANK_DetailMode = mode;
    var ro = mode === 'view';
    $('#bankDetailPanel').toggleClass('bank-readonly', ro);
    $('#bankDetailPanel input[type="text"], #bankDetailPanel input[type="email"], #bankDetailPanel select').prop('disabled', ro);
    $('#chkIsDefault, #chkECMSApplicable, #chkVartualAccountAutoGenerate').prop('disabled', ro);
    try {
        $('#bankDetailPanel select').each(function () {
            if ($(this).data('select2')) $(this).prop('disabled', ro);
        });
    } catch (e) {}
    if (!ro) {
        $('#btnSaveBank, #btnClearBank').show();
    } else {
        $('#btnSaveBank, #btnClearBank').hide();
    }
}
function showListPanel() {
    $('#bankListPanel').show();
    $('#bankDetailPanel').hide();
    G_BANK_DetailMode = 'list';
    refreshBankGrid();
}
function showDetailPanel(mode) {
    $('#bankListPanel').hide();
    $('#bankDetailPanel').show();
    setDetailFormMode(mode);
}
function buildActionHtml(code) {
    return (
        '<div class="pm-actions">' +
        '<button type="button" class="pm-icon-btn view" title="View" onclick="Bank_OpenView(' + code + ')"><i class="fas fa-eye"></i></button>' +
        '<button type="button" class="pm-icon-btn edit" title="Edit" onclick="Bank_OpenEdit(' + code + ')"><i class="fas fa-pencil-alt"></i></button>' +
        '<button type="button" class="pm-icon-btn del" title="Delete" onclick="Bank_OpenDelete(' + code + ')"><i class="fas fa-trash-alt"></i></button>' +
        '</div>'
    );
}
function formatDate(val) {
    if (val == null || val === '') return '';
    try {
        var d = new Date(val);
        return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-IN');
    } catch (e) {
        return String(val);
    }
}
function ynDisplay(val) {
    if (val === true || val === 1 || val === '1') return 'Yes';
    var s = val != null ? String(val).trim().toUpperCase() : '';
    return s === 'Y' || s === 'T' ? 'Yes' : 'No';
}
function mapRowForGrid(item, idx) {
    var code = item.Code != null ? Number(item.Code) : 0;
    return {
        Code: code,
        'S.No.': idx + 1,
        'Bank Name': item.BankName != null ? String(item.BankName).trim() : '',
        'Alias Name': item.AliasName != null ? String(item.AliasName).trim() : '',
        'Account No': item.AccountNo != null ? String(item.AccountNo).trim() : '',
        'IFSC Code': item.IFSC_Code != null ? String(item.IFSC_Code).trim() : '',
        City: item.City != null ? String(item.City).trim() : '',
        State: item.State != null ? String(item.State).trim() : '',
        Default: ynDisplay(item.IsDefault),
        Action: buildActionHtml(code),
    };
}
function applyBankSearch(rows) {
    var q = ($('#bankSearch').val() || '').toLowerCase().trim();
    if (!q) return (rows || []).slice();
    return (rows || []).filter(function (r) {
        return (
            String(r.BankName || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.AliasName || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.AccountNo || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.IFSC_Code || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.City || '').toLowerCase().indexOf(q) >= 0 ||
            String(r.State || '').toLowerCase().indexOf(q) >= 0
        );
    });
}
function bindBankGridData(filteredRows) {
    var rows = filteredRows || [];
    if (!rows.length) {
        $('#table-header-BankMaster').empty();
        $('#table-body-BankMaster').html(
            '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">No records found. Click <strong>Create New</strong> to add.</td></tr>'
        );
        $('#paginator-BankMaster').empty();
        return;
    }
    var mapped = rows.map(function (item, idx) {
        return mapRowForGrid(item, idx);
    });
    var StringFilterColumn = ['Bank Name', 'Alias Name', 'Account No', 'IFSC Code', 'City', 'State', 'Default'];
    var NumericFilterColumn = [];
    var DateFilterColumn = [];
    var Button = false;
    var showButtons = [];
    var StringdoubleFilterColumn = [];
    var hiddenColumns = ['Code'];
    var ColumnAlignment = {
        'S.No.': 'center;min-width:52px;white-space:nowrap;',
        Default: 'center;min-width:72px;',
        Action: 'center;min-width:128px;white-space:nowrap;',
    };
    if (typeof window.columnFilters === 'object' && window.columnFilters !== null) {
        window.columnFilters = {};
    }
    BizsolCustomFilterGrid.CreateDataTable(
        'table-header-BankMaster',
        'table-body-BankMaster',
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
function refreshBankGrid() {
    BankMasterService.GetBankMasterList()
        .then(function (res) {
            G_BANK_SourceRows = firstArray(res);
            bindBankGridData(applyBankSearch(G_BANK_SourceRows));
        })
        .catch(function () {
            G_BANK_SourceRows = [];
            bindBankGridData([]);
            if (typeof toastr !== 'undefined') toastr.error('Could not load bank list.');
        });
}
function loadMasterDropdowns() {
    return Promise.all([
        CountryMasterService.GetCountryMasterList()
            .then(function (res) {
                G_BANK_NationRows = firstArray(res);
                return G_BANK_NationRows;
            })
            .catch(function () {
                G_BANK_NationRows = [];
                return [];
            }),
        CityMasterService.GetStateList('ALL')
            .then(function (res) {
                G_BANK_StateRows = firstArray(res);
                return G_BANK_StateRows;
            })
            .catch(function () {
                G_BANK_StateRows = [];
                return [];
            }),
        CityMasterService.GetCityList(G_BANK_ListCountry, 'ALL')
            .then(function (res) {
                G_BANK_CityRows = firstArray(res);
                return G_BANK_CityRows;
            })
            .catch(function () {
                G_BANK_CityRows = [];
                return [];
            }),
        BankMasterService.GetCurrencyList()
            .then(function (res) {
                G_BANK_CurrencyRows = firstArray(res);
                return G_BANK_CurrencyRows;
            })
            .catch(function () {
                G_BANK_CurrencyRows = [];
                return [];
            }),
        BankMasterService.GetECMSBankList()
            .then(function (res) {
                G_BANK_ECMSRows = firstArray(res);
                return G_BANK_ECMSRows;
            })
            .catch(function () {
                G_BANK_ECMSRows = [];
                return [];
            }),
        BankMasterService.GetAccountList()
            .then(function (res) {
                G_BANK_AccountRows = firstArray(res);
                return G_BANK_AccountRows;
            })
            .catch(function () {
                G_BANK_AccountRows = [];
                return [];
            }),
    ]).then(function () {
        bindSimpleDropdown($('#ddlNation'), G_BANK_NationRows, 'CountryName', 'CountryName', '-- Select Nation --');
        bindSimpleDropdown($('#ddlState'), G_BANK_StateRows, 'StateName', 'StateName', '-- Select State --');
        bindSimpleDropdown(
            $('#ddlCity'),
            G_BANK_CityRows,
            'CityName',
            'CityName',
            '-- Select City --'
        );
        bindSimpleDropdown($('#ddlCurrency'), G_BANK_CurrencyRows, 'Description', 'Description', '-- Select Currency --');
        bindSimpleDropdown($('#ddlECMSBank'), G_BANK_ECMSRows, 'eCMSBANK', 'eCMSBANK', '-- Select e-CMS Bank --');
        bindSimpleDropdown(
            $('#ddlECMSDebitAccount'),
            G_BANK_AccountRows,
            'AccountDesp',
            'AccountDesp',
            '-- Select Debit Account --'
        );
    });
}
function setCheckboxFromBit($el, val) {
    $el.prop('checked', val === true || val === 1 || val === '1' || String(val).toUpperCase() === 'Y');
}
function populateForm(rec) {
    G_BANK_SavedDatabaseLocationCode =
        rec.DatabaseLocation_Code != null ? parseInt(String(rec.DatabaseLocation_Code), 10) || 0 : 0;
    $('#hfBankMaster_Code').val(rec.Code != null ? rec.Code : 0);
    $('#txtBankName').val(rec.BankName != null ? String(rec.BankName).trim() : '');
    $('#txtAliasName').val(rec.AliasName != null ? String(rec.AliasName).trim() : '');
    $('#txtAccountNo').val(rec.AccountNo != null ? String(rec.AccountNo).trim() : '');
    $('#txtIFSCCode').val(rec.IFSC_Code != null ? String(rec.IFSC_Code).trim() : '');
    $('#txtSwiftCode').val(rec.SwiftCode != null ? String(rec.SwiftCode).trim() : '');
    $('#txtAddress').val(rec.Address != null ? String(rec.Address).trim() : '');
    $('#txtPin').val(rec.PinCode != null && rec.PinCode !== 0 ? String(rec.PinCode).trim() : '');
    $('#txtPhoneNo').val(rec.PhoneNo != null ? String(rec.PhoneNo).trim() : '');
    $('#txtFaxNo').val(rec.FaxNo != null ? String(rec.FaxNo).trim() : '');
    $('#txtServiceTaxNo').val(rec.ServiceTaxNo != null ? String(rec.ServiceTaxNo).trim() : '');
    $('#txtPANNo').val(rec.PANNo != null ? String(rec.PANNo).trim() : '');
    $('#txtEMail').val(rec.EMail != null ? String(rec.EMail).trim() : '');
    $('#txtMICRCode').val(rec.MICRCode != null ? String(rec.MICRCode).trim() : '');
    $('#txtVartualAccountPrefix').val(rec.VartualAccountPrefix != null ? String(rec.VartualAccountPrefix).trim() : '');
    $('#txtVartualAccountLength').val(
        rec.VartualAccountLength != null && rec.VartualAccountLength !== 0 ? String(rec.VartualAccountLength).trim() : ''
    );
    setCheckboxFromBit($('#chkIsDefault'), rec.IsDefault);
    setCheckboxFromBit($('#chkVartualAccountAutoGenerate'), rec.VartualAccountAutoGenerate);

    var hasECMS =
        (rec.ECMSBank != null && String(rec.ECMSBank).trim() !== '') ||
        (rec.eCMSBank != null && String(rec.eCMSBank).trim() !== '') ||
        (rec.F_eCMSMaster_Code != null && parseInt(String(rec.F_eCMSMaster_Code), 10) > 0);
    $('#chkECMSApplicable').prop('checked', hasECMS);
    toggleECMSPanel(hasECMS);

    var currency = rec.CurrencyName != null ? String(rec.CurrencyName).trim() : '';
    var city = rec.City != null ? String(rec.City).trim() : '';
    var state = rec.State != null ? String(rec.State).trim() : '';
    var nation = rec.Nation != null ? String(rec.Nation).trim() : '';
    var ecmsBank = rec.ECMSBank != null ? String(rec.ECMSBank).trim() : rec.eCMSBank != null ? String(rec.eCMSBank).trim() : '';
    var debitAccount =
        rec.eCMSDebitAccountName != null
            ? String(rec.eCMSDebitAccountName).trim()
            : rec.eCMSDebitAccount != null
              ? String(rec.eCMSDebitAccount).trim()
              : '';

    $('#ddlCurrency').val(currency).trigger('change');
    $('#ddlCity').val(city).trigger('change');
    $('#ddlState').val(state).trigger('change');
    $('#ddlNation').val(nation).trigger('change');
    $('#ddlECMSBank').val(ecmsBank).trigger('change');
    $('#ddlECMSDebitAccount').val(debitAccount).trigger('change');
    try {
        $('#bankDetailPanel select').each(function () {
            if ($(this).data('select2')) $(this).trigger('change.select2');
        });
    } catch (e) {}
}
function loadEditRecord(code, mode) {
    return BankMasterService.GetBankMasterByCode(code)
        .then(function (res) {
            var rec = firstRecord(res);
            if (!rec || typeof rec !== 'object') {
                if (typeof toastr !== 'undefined') toastr.warning('Record not found.');
                setDetailFormMode(mode || 'edit');
                return;
            }
            return loadMasterDropdowns().then(function () {
                populateForm(rec);
                setDetailFormMode(mode || 'edit');
            });
        })
        .catch(function () {
            if (typeof toastr !== 'undefined') toastr.warning('Could not load record from server.');
        });
}
function ynFromCheckbox($el) {
    return $el.length && $el.prop('checked') ? 'Y' : 'N';
}
/** Single row — matches BizSol.WebERP.Models.Common.Models.tblBankMaster */
function buildBankMasterRow(code) {
    var pinRaw = ($('#txtPin').val() || '').trim();
    var pinStr = pinRaw !== '' ? pinRaw.replace(/\D/g, '').slice(0, 6) : '';
    var vaLenRaw = ($('#txtVartualAccountLength').val() || '').trim();
    var vaLen = vaLenRaw !== '' ? parseInt(vaLenRaw, 10) : 0;
    if (isNaN(vaLen)) vaLen = 0;
    var ecmsOn = $('#chkECMSApplicable').prop('checked');
    return {
        Code: code,
        BankName: ($('#txtBankName').val() || '').trim(),
        Address: ($('#txtAddress').val() || '').trim(),
        City: ($('#ddlCity').val() || '').toString().trim(),
        PinCode: pinStr,
        State: ($('#ddlState').val() || '').toString().trim(),
        Nation: ($('#ddlNation').val() || '').toString().trim(),
        EMail: ($('#txtEMail').val() || '').trim(),
        PhoneNo: ($('#txtPhoneNo').val() || '').trim(),
        FaxNo: ($('#txtFaxNo').val() || '').trim(),
        ServiceTaxNo: ($('#txtServiceTaxNo').val() || '').trim(),
        PANNo: ($('#txtPANNo').val() || '').trim(),
        DatabaseLocation_Code: G_BANK_SavedDatabaseLocationCode || 0,
        AccountNo: ($('#txtAccountNo').val() || '').trim(),
        IFSC_Code: ($('#txtIFSCCode').val() || '').trim(),
        IsDefault: ynFromCheckbox($('#chkIsDefault')),
        MICRCode: ($('#txtMICRCode').val() || '').trim(),
        AliasName: ($('#txtAliasName').val() || '').trim(),
        SwiftCode: ($('#txtSwiftCode').val() || '').trim(),
        CurrencyName: ($('#ddlCurrency').val() || '').toString().trim(),
        ECMSBank: ecmsOn ? ($('#ddlECMSBank').val() || '').toString().trim() : '',
        VartualAccountPrefix: ecmsOn ? ($('#txtVartualAccountPrefix').val() || '').trim() : '',
        VartualAccountLength: ecmsOn ? vaLen : 0,
        VartualAccountAutoGenerate: ecmsOn ? ynFromCheckbox($('#chkVartualAccountAutoGenerate')) : 'N',
        eCMSDebitAccountName: ecmsOn ? ($('#ddlECMSDebitAccount').val() || '').toString().trim() : '',
        UserMaster_Code: G_UserMasterCode,
        GSTNo: '',
    };
}
function buildSavePayload() {
    var code = parseInt($('#hfBankMaster_Code').val() || '0', 10) || 0;
    return [buildBankMasterRow(code)];
}
function saveBank() {
    var currentCode = parseInt($('#hfBankMaster_Code').val() || '0', 10) || 0;
    var OptionName = currentCode > 0 ? 'Edit' : 'New';

    MenuService.CheckModuleOptionRight(G_BANK_ModuleName, OptionName, 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }

        var bankName = ($('#txtBankName').val() || '').trim();
        if (!bankName) {
            showFieldError('txtBankName', 'Bank Name is required.');
            $('#txtBankName').focus();
            return;
        }

        BankMasterService.SaveBankMaster(buildSavePayload())
            .then(function (res) {
                var ok = res && (res.Status === 'Y' || res.status === 'Y');
                if (ok) {
                    if (typeof toastr !== 'undefined') toastr.success((res && (res.Msg || res.Message)) || 'Saved successfully.');
                    clearAllFieldErrors();
                    setTimeout(function () {
                        showListPanel();
                    }, 900);
                } else {
                    if (typeof toastr !== 'undefined')
                        toastr.error((res && (res.Msg || res.Message || res.message)) || 'Save failed.');
                }
            })
            .catch(function () {
                if (typeof toastr !== 'undefined') toastr.error('Save request failed. Please verify Bank API endpoints.');
            });
    });
}
function Bank_OpenView(code) {
    MenuService.CheckModuleOptionRight(G_BANK_ModuleName, 'View', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('view');
        clearForm();
        loadEditRecord(code, 'view');
    });
}
function Bank_OpenEdit(code) {
    MenuService.CheckModuleOptionRight(G_BANK_ModuleName, 'Edit', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        showDetailPanel('edit');
        clearForm();
        loadEditRecord(code, 'edit');
    });
}
function Bank_OpenDelete(code) {
    MenuService.CheckModuleOptionRight(G_BANK_ModuleName, 'Delete', 'Y', getFinancialYear()).then(function (response) {
        if (!response || response.CheckModuleOptionRight === 'N') {
            if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
            return;
        }
        $('#hfBankDeleteCode').val(code);
        $('#bankReasonForDelete').val('');
        showModal('dvBankDeleteModal');
        setTimeout(function () {
            $('#bankReasonForDelete').focus();
        }, 300);
    });
}
function confirmBankDelete() {
    var code = parseInt($('#hfBankDeleteCode').val() || '0', 10) || 0;
    var reason = ($('#bankReasonForDelete').val() || '').trim();
    if (!code) {
        hideModal('dvBankDeleteModal');
        return;
    }
    if (!reason) {
        if (typeof toastr !== 'undefined') toastr.warning('Please enter a reason for deletion.');
        $('#bankReasonForDelete').focus();
        return;
    }
    BankMasterService.DeleteBankMaster(code, reason)
        .then(function (res) {
            var ok = res && (res.Status === 'Y' || res.status === 'Y');
            if (ok) {
                hideModal('dvBankDeleteModal');
                if (typeof toastr !== 'undefined') toastr.success((res && res.Msg) || 'Deleted successfully.');
                refreshBankGrid();
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
        $('#ERPHeading').text('Bank Master');
    }

    $('#btnCreateBank').on('click', function () {
        MenuService.CheckModuleOptionRight(G_BANK_ModuleName, 'New', 'Y', getFinancialYear()).then(function (response) {
            if (!response || response.CheckModuleOptionRight === 'N') {
                if (typeof toastr !== 'undefined') toastr.error((response && response.Msg) || 'Permission denied.');
                return;
            }
            clearForm();
            loadMasterDropdowns().then(function () {
                showDetailPanel('new');
            });
        });
    });

    $('#btnBackToBankList').on('click', function () {
        showListPanel();
    });
    $('#btnClearBank').on('click', function () {
        clearForm();
    });
    $('#btnSaveBank').on('click', function () {
        saveBank();
    });
    $('#btnBankConfirmDelete').on('click', function () {
        confirmBankDelete();
    });

    $('#chkECMSApplicable').on('change', function () {
        toggleECMSPanel($(this).prop('checked'));
    });

    $('#txtBankName').on('blur', function () {
        clearFieldError('txtBankName');
        if (!$(this).val().trim()) showFieldError('txtBankName', 'Bank Name is required.');
    }).on('input', function () {
        if ($(this).val().trim()) clearFieldError('txtBankName');
    });

    var searchTimer;
    $('#bankSearch').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            bindBankGridData(applyBankSearch(G_BANK_SourceRows));
        }, 200);
    });

    var params = BizSolHelperFunction.getUrlVars();
    var codeFromUrl = parseInt(params.Code || params.code || '0', 10);

    loadMasterDropdowns().then(function () {
        if (isFinite(codeFromUrl) && codeFromUrl > 0) {
            showDetailPanel('edit');
            clearForm();
            $('#hfBankMaster_Code').val(String(codeFromUrl));
            return loadEditRecord(codeFromUrl, 'edit');
        }
        refreshBankGrid();
    });
});

window.Bank_OpenView = Bank_OpenView;
window.Bank_OpenEdit = Bank_OpenEdit;
window.Bank_OpenDelete = Bank_OpenDelete;
